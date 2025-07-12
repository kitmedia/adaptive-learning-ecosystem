-- =============================================================================
-- CONTENT VERSIONING AND BACKUP SCHEMA
-- Adaptive Learning Ecosystem - EbroValley Digital
-- 
-- Complete versioning system for courses, lessons, and all content types
-- with backup, restore, and audit capabilities
-- =============================================================================

-- =============================================================================
-- VERSIONING TABLES
-- =============================================================================

-- Content versions table for all versionable content
CREATE TABLE content_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL, -- 'course', 'lesson', 'assessment', 'media'
    entity_id UUID NOT NULL,
    version_number INTEGER NOT NULL DEFAULT 1,
    version_name VARCHAR(255),
    version_description TEXT,
    content_data JSONB NOT NULL, -- Complete content snapshot
    metadata JSONB DEFAULT '{}',
    
    -- Version control fields
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_published BOOLEAN DEFAULT FALSE,
    is_current BOOLEAN DEFAULT TRUE,
    is_draft BOOLEAN DEFAULT FALSE,
    
    -- Parent version for branching
    parent_version_id UUID REFERENCES content_versions(id),
    
    -- Content hash for integrity
    content_hash VARCHAR(64) NOT NULL,
    
    -- Size tracking
    content_size_bytes INTEGER DEFAULT 0,
    
    UNIQUE(entity_type, entity_id, version_number),
    
    -- Indexes
    INDEX idx_content_versions_entity (entity_type, entity_id),
    INDEX idx_content_versions_current (entity_type, entity_id, is_current),
    INDEX idx_content_versions_published (entity_type, entity_id, is_published),
    INDEX idx_content_versions_created (created_at),
    INDEX idx_content_versions_hash (content_hash),
    INDEX idx_content_versions_user (created_by)
);

-- Version tags for marking special versions
CREATE TABLE version_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version_id UUID NOT NULL REFERENCES content_versions(id) ON DELETE CASCADE,
    tag_name VARCHAR(100) NOT NULL, -- 'stable', 'beta', 'release', 'milestone'
    tag_description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6', -- hex color
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(version_id, tag_name),
    INDEX idx_version_tags_version (version_id),
    INDEX idx_version_tags_name (tag_name)
);

-- Version branches for parallel development
CREATE TABLE version_branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    branch_name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Branch origin
    base_version_id UUID REFERENCES content_versions(id),
    
    -- Branch status
    is_active BOOLEAN DEFAULT TRUE,
    is_protected BOOLEAN DEFAULT FALSE, -- prevent force updates
    
    -- Ownership
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(entity_type, entity_id, branch_name),
    INDEX idx_version_branches_entity (entity_type, entity_id),
    INDEX idx_version_branches_active (is_active)
);

-- =============================================================================
-- BACKUP TABLES
-- =============================================================================

-- Backup jobs configuration
CREATE TABLE backup_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    
    -- Backup scope
    backup_type VARCHAR(50) NOT NULL, -- 'full', 'incremental', 'selective'
    entity_types VARCHAR[] DEFAULT ARRAY['course', 'lesson', 'assessment', 'media'],
    include_media BOOLEAN DEFAULT TRUE,
    include_user_data BOOLEAN DEFAULT FALSE,
    
    -- Schedule
    schedule_cron VARCHAR(100), -- cron expression
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Retention
    retention_days INTEGER DEFAULT 30,
    max_backups INTEGER DEFAULT 10,
    
    -- Compression
    compression_enabled BOOLEAN DEFAULT TRUE,
    compression_type VARCHAR(20) DEFAULT 'gzip',
    
    -- Encryption
    encryption_enabled BOOLEAN DEFAULT TRUE,
    encryption_key_id VARCHAR(255),
    
    -- Metadata
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_run_at TIMESTAMP WITH TIME ZONE,
    next_run_at TIMESTAMP WITH TIME ZONE,
    
    INDEX idx_backup_jobs_active (is_active),
    INDEX idx_backup_jobs_next_run (next_run_at),
    INDEX idx_backup_jobs_type (backup_type)
);

-- Backup executions history
CREATE TABLE backup_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES backup_jobs(id) ON DELETE CASCADE,
    execution_type VARCHAR(50) NOT NULL, -- 'scheduled', 'manual', 'triggered'
    
    -- Execution details
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'running', -- 'running', 'completed', 'failed', 'cancelled'
    
    -- Results
    items_processed INTEGER DEFAULT 0,
    items_failed INTEGER DEFAULT 0,
    total_size_bytes BIGINT DEFAULT 0,
    compressed_size_bytes BIGINT DEFAULT 0,
    
    -- Storage location
    backup_location TEXT,
    backup_filename VARCHAR(500),
    
    -- Error handling
    error_message TEXT,
    error_details JSONB,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    triggered_by UUID REFERENCES users(id),
    
    INDEX idx_backup_executions_job (job_id),
    INDEX idx_backup_executions_status (status),
    INDEX idx_backup_executions_date (started_at),
    INDEX idx_backup_executions_type (execution_type)
);

-- Backup content items (individual items in a backup)
CREATE TABLE backup_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    execution_id UUID NOT NULL REFERENCES backup_executions(id) ON DELETE CASCADE,
    
    -- Content identification
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    version_id UUID REFERENCES content_versions(id),
    
    -- Backup details
    item_path TEXT NOT NULL, -- path within backup
    file_size_bytes INTEGER DEFAULT 0,
    content_hash VARCHAR(64),
    
    -- Status
    backup_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'skipped'
    error_message TEXT,
    
    -- Timestamps
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    INDEX idx_backup_items_execution (execution_id),
    INDEX idx_backup_items_entity (entity_type, entity_id),
    INDEX idx_backup_items_status (backup_status),
    INDEX idx_backup_items_hash (content_hash)
);

-- =============================================================================
-- RESTORE OPERATIONS
-- =============================================================================

-- Restore jobs for recovering content
CREATE TABLE restore_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Source backup
    backup_execution_id UUID REFERENCES backup_executions(id),
    backup_location TEXT,
    
    -- Restore scope
    restore_type VARCHAR(50) NOT NULL, -- 'full', 'selective', 'point_in_time'
    target_entities JSONB, -- specific entities to restore
    restore_to_timestamp TIMESTAMP WITH TIME ZONE,
    
    -- Restore options
    overwrite_existing BOOLEAN DEFAULT FALSE,
    create_versions BOOLEAN DEFAULT TRUE,
    restore_relationships BOOLEAN DEFAULT TRUE,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Results
    items_restored INTEGER DEFAULT 0,
    items_failed INTEGER DEFAULT 0,
    items_skipped INTEGER DEFAULT 0,
    
    -- Error handling
    error_message TEXT,
    error_details JSONB,
    
    -- Metadata
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_restore_jobs_backup (backup_execution_id),
    INDEX idx_restore_jobs_status (status),
    INDEX idx_restore_jobs_user (created_by),
    INDEX idx_restore_jobs_date (created_at)
);

-- Individual restore operations
CREATE TABLE restore_operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES restore_jobs(id) ON DELETE CASCADE,
    
    -- Target content
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    target_version_id UUID,
    
    -- Operation details
    operation_type VARCHAR(50) NOT NULL, -- 'create', 'update', 'restore_version'
    source_path TEXT,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending',
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    
    -- Results
    created_version_id UUID REFERENCES content_versions(id),
    
    INDEX idx_restore_operations_job (job_id),
    INDEX idx_restore_operations_entity (entity_type, entity_id),
    INDEX idx_restore_operations_status (status)
);

-- =============================================================================
-- CHANGE TRACKING
-- =============================================================================

-- Content change log for audit trail
CREATE TABLE content_changes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Content identification
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    version_id UUID REFERENCES content_versions(id),
    
    -- Change details
    change_type VARCHAR(50) NOT NULL, -- 'create', 'update', 'delete', 'publish', 'unpublish'
    field_name VARCHAR(100), -- specific field changed
    old_value JSONB,
    new_value JSONB,
    
    -- Change metadata
    change_description TEXT,
    change_reason VARCHAR(255),
    
    -- User and session
    changed_by UUID NOT NULL REFERENCES users(id),
    session_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    
    -- Timestamps
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Additional metadata
    metadata JSONB DEFAULT '{}',
    
    INDEX idx_content_changes_entity (entity_type, entity_id),
    INDEX idx_content_changes_version (version_id),
    INDEX idx_content_changes_user (changed_by),
    INDEX idx_content_changes_date (changed_at),
    INDEX idx_content_changes_type (change_type),
    INDEX idx_content_changes_session (session_id)
);

-- Content approval workflow
CREATE TABLE content_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version_id UUID NOT NULL REFERENCES content_versions(id) ON DELETE CASCADE,
    
    -- Approval request
    requested_by UUID NOT NULL REFERENCES users(id),
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    request_message TEXT,
    
    -- Approval response
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'cancelled'
    review_message TEXT,
    
    -- Approval metadata
    approval_level INTEGER DEFAULT 1, -- multi-level approvals
    required_approvals INTEGER DEFAULT 1,
    current_approvals INTEGER DEFAULT 0,
    
    -- Notification settings
    notify_on_approval BOOLEAN DEFAULT TRUE,
    notification_channels VARCHAR[] DEFAULT ARRAY['email'],
    
    INDEX idx_content_approvals_version (version_id),
    INDEX idx_content_approvals_status (status),
    INDEX idx_content_approvals_requester (requested_by),
    INDEX idx_content_approvals_reviewer (reviewed_by),
    INDEX idx_content_approvals_date (requested_at)
);

-- =============================================================================
-- CONTENT COMPARISON
-- =============================================================================

-- Content diff results for version comparison
CREATE TABLE content_diffs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Versions being compared
    from_version_id UUID NOT NULL REFERENCES content_versions(id),
    to_version_id UUID NOT NULL REFERENCES content_versions(id),
    
    -- Diff metadata
    diff_type VARCHAR(50) NOT NULL, -- 'text', 'json', 'binary', 'semantic'
    diff_algorithm VARCHAR(50) DEFAULT 'myers', -- diff algorithm used
    
    -- Diff results
    diff_data JSONB NOT NULL, -- structured diff result
    summary JSONB, -- diff summary (additions, deletions, modifications)
    
    -- Performance metrics
    comparison_time_ms INTEGER,
    diff_size_bytes INTEGER,
    
    -- User and context
    generated_by UUID REFERENCES users(id),
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Caching
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours'),
    
    UNIQUE(from_version_id, to_version_id, diff_type),
    INDEX idx_content_diffs_from (from_version_id),
    INDEX idx_content_diffs_to (to_version_id),
    INDEX idx_content_diffs_generated (generated_at),
    INDEX idx_content_diffs_expires (expires_at)
);

-- =============================================================================
-- CONTENT SYNCHRONIZATION
-- =============================================================================

-- Sync configurations for multi-environment deployment
CREATE TABLE sync_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    
    -- Source and target
    source_environment VARCHAR(100) NOT NULL, -- 'development', 'staging', 'production'
    target_environment VARCHAR(100) NOT NULL,
    
    -- Sync scope
    entity_types VARCHAR[] DEFAULT ARRAY['course', 'lesson'],
    sync_mode VARCHAR(50) DEFAULT 'incremental', -- 'full', 'incremental', 'selective'
    
    -- Sync rules
    auto_sync_enabled BOOLEAN DEFAULT FALSE,
    sync_schedule_cron VARCHAR(100),
    conflict_resolution VARCHAR(50) DEFAULT 'manual', -- 'manual', 'source_wins', 'target_wins', 'merge'
    
    -- Filters
    include_drafts BOOLEAN DEFAULT FALSE,
    include_archived BOOLEAN DEFAULT FALSE,
    tag_filters VARCHAR[],
    
    -- Security
    requires_approval BOOLEAN DEFAULT TRUE,
    allowed_users UUID[],
    
    -- Metadata
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    
    INDEX idx_sync_configs_source (source_environment),
    INDEX idx_sync_configs_target (target_environment),
    INDEX idx_sync_configs_active (is_active)
);

-- Sync execution history
CREATE TABLE sync_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_id UUID NOT NULL REFERENCES sync_configurations(id),
    
    -- Execution details
    execution_type VARCHAR(50) NOT NULL, -- 'manual', 'scheduled', 'triggered'
    started_by UUID REFERENCES users(id),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Status
    status VARCHAR(20) DEFAULT 'running', -- 'running', 'completed', 'failed', 'cancelled'
    
    -- Results
    items_synced INTEGER DEFAULT 0,
    items_failed INTEGER DEFAULT 0,
    conflicts_detected INTEGER DEFAULT 0,
    conflicts_resolved INTEGER DEFAULT 0,
    
    -- Error handling
    error_message TEXT,
    error_details JSONB,
    
    -- Execution log
    execution_log TEXT,
    
    INDEX idx_sync_executions_config (config_id),
    INDEX idx_sync_executions_status (status),
    INDEX idx_sync_executions_date (started_at),
    INDEX idx_sync_executions_user (started_by)
);

-- =============================================================================
-- FUNCTIONS AND TRIGGERS
-- =============================================================================

-- Function to create a new content version
CREATE OR REPLACE FUNCTION create_content_version(
    p_entity_type VARCHAR,
    p_entity_id UUID,
    p_content_data JSONB,
    p_version_name VARCHAR DEFAULT NULL,
    p_created_by UUID DEFAULT NULL,
    p_is_published BOOLEAN DEFAULT FALSE
) RETURNS UUID AS $$
DECLARE
    v_version_number INTEGER;
    v_content_hash VARCHAR(64);
    v_version_id UUID;
BEGIN
    -- Calculate next version number
    SELECT COALESCE(MAX(version_number), 0) + 1
    INTO v_version_number
    FROM content_versions 
    WHERE entity_type = p_entity_type AND entity_id = p_entity_id;
    
    -- Calculate content hash
    v_content_hash := encode(sha256(p_content_data::text::bytea), 'hex');
    
    -- Mark current version as not current
    UPDATE content_versions 
    SET is_current = FALSE 
    WHERE entity_type = p_entity_type 
      AND entity_id = p_entity_id 
      AND is_current = TRUE;
    
    -- Create new version
    INSERT INTO content_versions (
        entity_type, entity_id, version_number, version_name,
        content_data, content_hash, created_by, is_published, is_current,
        content_size_bytes
    ) VALUES (
        p_entity_type, p_entity_id, v_version_number, p_version_name,
        p_content_data, v_content_hash, p_created_by, p_is_published, TRUE,
        octet_length(p_content_data::text)
    ) RETURNING id INTO v_version_id;
    
    -- Log the change
    INSERT INTO content_changes (
        entity_type, entity_id, version_id, change_type,
        new_value, changed_by
    ) VALUES (
        p_entity_type, p_entity_id, v_version_id, 'create',
        p_content_data, p_created_by
    );
    
    RETURN v_version_id;
END;
$$ LANGUAGE plpgsql;

-- Function to restore content to a specific version
CREATE OR REPLACE FUNCTION restore_content_version(
    p_version_id UUID,
    p_restored_by UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    v_version_record content_versions%ROWTYPE;
    v_new_version_id UUID;
BEGIN
    -- Get version to restore
    SELECT * INTO v_version_record
    FROM content_versions
    WHERE id = p_version_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Version not found: %', p_version_id;
    END IF;
    
    -- Create new version from restored content
    v_new_version_id := create_content_version(
        v_version_record.entity_type,
        v_version_record.entity_id,
        v_version_record.content_data,
        'Restored from version ' || v_version_record.version_number,
        p_restored_by,
        FALSE
    );
    
    -- Log the restore operation
    INSERT INTO content_changes (
        entity_type, entity_id, version_id, change_type,
        change_description, changed_by
    ) VALUES (
        v_version_record.entity_type, v_version_record.entity_id, 
        v_new_version_id, 'restore',
        'Restored from version ' || v_version_record.version_number || ' (ID: ' || p_version_id || ')',
        p_restored_by
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update version timestamps
CREATE OR REPLACE FUNCTION update_version_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_update_version_branches_timestamp
    BEFORE UPDATE ON version_branches
    FOR EACH ROW
    EXECUTE FUNCTION update_version_timestamp();

CREATE TRIGGER tr_update_backup_jobs_timestamp
    BEFORE UPDATE ON backup_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_version_timestamp();

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Additional performance indexes
CREATE INDEX CONCURRENTLY idx_content_versions_entity_current 
ON content_versions (entity_type, entity_id, is_current, created_at DESC);

CREATE INDEX CONCURRENTLY idx_content_changes_entity_date 
ON content_changes (entity_type, entity_id, changed_at DESC);

CREATE INDEX CONCURRENTLY idx_backup_executions_job_date 
ON backup_executions (job_id, started_at DESC);

-- Partial indexes for active records
CREATE INDEX CONCURRENTLY idx_backup_jobs_active_next_run 
ON backup_jobs (next_run_at) WHERE is_active = TRUE;

CREATE INDEX CONCURRENTLY idx_content_approvals_pending 
ON content_approvals (requested_at) WHERE status = 'pending';

-- =============================================================================
-- INITIAL DATA
-- =============================================================================

-- Default backup job for daily full backup
INSERT INTO backup_jobs (
    job_name, description, backup_type, schedule_cron, 
    retention_days, max_backups, created_by
) VALUES (
    'Daily Full Backup',
    'Automated daily backup of all content',
    'full',
    '0 2 * * *', -- Daily at 2 AM
    30,
    30,
    (SELECT id FROM users WHERE email = 'admin@ebrovalley.com' LIMIT 1)
) ON CONFLICT (job_name) DO NOTHING;

-- Default sync configuration for staging to production
INSERT INTO sync_configurations (
    config_name, description, source_environment, target_environment,
    sync_mode, requires_approval, created_by
) VALUES (
    'Staging to Production',
    'Sync approved content from staging to production',
    'staging',
    'production',
    'selective',
    TRUE,
    (SELECT id FROM users WHERE email = 'admin@ebrovalley.com' LIMIT 1)
) ON CONFLICT (config_name) DO NOTHING;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE content_versions IS 'Version control for all content types with complete snapshots';
COMMENT ON TABLE version_tags IS 'Tags for marking special versions (stable, beta, release, etc.)';
COMMENT ON TABLE version_branches IS 'Branch management for parallel content development';
COMMENT ON TABLE backup_jobs IS 'Automated backup job configurations';
COMMENT ON TABLE backup_executions IS 'History of backup job executions';
COMMENT ON TABLE backup_items IS 'Individual items within each backup execution';
COMMENT ON TABLE restore_jobs IS 'Content restore operations';
COMMENT ON TABLE content_changes IS 'Audit trail of all content modifications';
COMMENT ON TABLE content_approvals IS 'Approval workflow for content publishing';
COMMENT ON TABLE content_diffs IS 'Version comparison results and diffs';
COMMENT ON TABLE sync_configurations IS 'Multi-environment sync configurations';
COMMENT ON TABLE sync_executions IS 'History of content synchronization operations';

COMMENT ON FUNCTION create_content_version IS 'Creates a new version of content with automatic versioning';
COMMENT ON FUNCTION restore_content_version IS 'Restores content to a specific version by creating new version';