-- Content Management Schema Extension
-- Adaptive Learning Ecosystem - EbroValley Digital
-- Database schema for comprehensive content management system

-- ============================================================================
-- CONTENT TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS education.content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic information
    title VARCHAR(255) NOT NULL,
    content_type VARCHAR(50) NOT NULL, -- course, module, lesson, assessment, resource, scorm
    description TEXT,
    content_body TEXT,
    
    -- Metadata and structure
    metadata JSONB DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    category VARCHAR(100),
    difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    estimated_duration INTEGER, -- in minutes
    language VARCHAR(10) DEFAULT 'en',
    
    -- Hierarchy and relationships
    parent_id UUID REFERENCES education.content(id) ON DELETE SET NULL,
    prerequisites TEXT[] DEFAULT '{}',
    learning_objectives TEXT[] DEFAULT '{}',
    
    -- Content body and search
    embeddings FLOAT[], -- For semantic search
    search_vector TSVECTOR, -- For full-text search
    
    -- Status and workflow
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'published', 'archived')),
    
    -- Versioning
    version INTEGER DEFAULT 1,
    
    -- Timestamps and ownership
    created_by UUID NOT NULL REFERENCES education.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT content_title_check CHECK (length(title) > 0),
    CONSTRAINT content_version_check CHECK (version > 0)
);

-- ============================================================================
-- CONTENT VERSIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS education.content_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL REFERENCES education.content(id) ON DELETE CASCADE,
    
    -- Version information
    version_number INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    content_body TEXT,
    metadata JSONB DEFAULT '{}',
    
    -- Change tracking
    change_summary TEXT,
    created_by UUID NOT NULL REFERENCES education.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(content_id, version_number)
);

-- ============================================================================
-- MEDIA FILES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS education.media_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID REFERENCES education.content(id) ON DELETE SET NULL,
    
    -- File information
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    media_type VARCHAR(50) NOT NULL, -- image, video, audio, document, presentation, interactive
    file_size BIGINT NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    file_hash VARCHAR(64) NOT NULL,
    
    -- Processing metadata
    metadata JSONB DEFAULT '{}',
    
    -- Accessibility
    alt_text TEXT,
    transcript TEXT,
    
    -- Status
    processing_status VARCHAR(20) DEFAULT 'ready' CHECK (processing_status IN ('uploading', 'processing', 'ready', 'error')),
    
    -- Timestamps and ownership
    created_by UUID NOT NULL REFERENCES education.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT media_files_file_size_check CHECK (file_size > 0)
);

-- ============================================================================
-- CONTENT COLLABORATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS education.content_collaborations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL REFERENCES education.content(id) ON DELETE CASCADE,
    
    -- Collaboration details
    user_id UUID NOT NULL REFERENCES education.users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'editor', 'reviewer', 'viewer')),
    permissions JSONB DEFAULT '{}',
    
    -- Session tracking
    session_id VARCHAR(255),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(content_id, user_id)
);

-- ============================================================================
-- CONTENT REVIEWS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS education.content_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL REFERENCES education.content(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    
    -- Review details
    reviewer_id UUID NOT NULL REFERENCES education.users(id),
    review_status VARCHAR(20) NOT NULL CHECK (review_status IN ('pending', 'approved', 'rejected', 'changes_requested')),
    comments TEXT,
    feedback JSONB DEFAULT '{}',
    
    -- Review criteria
    accuracy_score INTEGER CHECK (accuracy_score >= 1 AND accuracy_score <= 5),
    clarity_score INTEGER CHECK (clarity_score >= 1 AND clarity_score <= 5),
    completeness_score INTEGER CHECK (completeness_score >= 1 AND completeness_score <= 5),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(content_id, version_number, reviewer_id)
);

-- ============================================================================
-- CONTENT TAGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS education.content_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Tag information
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7), -- Hex color code
    
    -- Usage statistics
    usage_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT content_tags_name_check CHECK (length(name) > 0),
    CONSTRAINT content_tags_slug_check CHECK (length(slug) > 0)
);

-- ============================================================================
-- CONTENT CATEGORIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS education.content_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Category information
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    
    -- Hierarchy
    parent_id UUID REFERENCES education.content_categories(id) ON DELETE SET NULL,
    
    -- Display
    display_order INTEGER DEFAULT 0,
    icon VARCHAR(50),
    color VARCHAR(7), -- Hex color code
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT content_categories_name_check CHECK (length(name) > 0)
);

-- ============================================================================
-- SCORM PACKAGES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS education.scorm_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL REFERENCES education.content(id) ON DELETE CASCADE,
    
    -- SCORM information
    scorm_version VARCHAR(10) NOT NULL, -- 1.2, 2004
    manifest_data JSONB NOT NULL,
    
    -- Package files
    package_path TEXT NOT NULL,
    manifest_file TEXT NOT NULL,
    launch_file TEXT NOT NULL,
    
    -- Status
    is_valid BOOLEAN DEFAULT FALSE,
    validation_errors JSONB DEFAULT '[]',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Content indexes
CREATE INDEX IF NOT EXISTS idx_content_title ON education.content USING GIN(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_content_type_status ON education.content(content_type, status);
CREATE INDEX IF NOT EXISTS idx_content_created_by ON education.content(created_by);
CREATE INDEX IF NOT EXISTS idx_content_parent_id ON education.content(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_content_tags ON education.content USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_content_metadata ON education.content USING GIN(metadata);
CREATE INDEX IF NOT EXISTS idx_content_search_vector ON education.content USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_content_updated_at ON education.content(updated_at DESC);

-- Content versions indexes
CREATE INDEX IF NOT EXISTS idx_content_versions_content_id ON education.content_versions(content_id, version_number DESC);
CREATE INDEX IF NOT EXISTS idx_content_versions_created_at ON education.content_versions(created_at DESC);

-- Media files indexes
CREATE INDEX IF NOT EXISTS idx_media_files_content_id ON education.media_files(content_id) WHERE content_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_media_files_media_type ON education.media_files(media_type);
CREATE INDEX IF NOT EXISTS idx_media_files_file_hash ON education.media_files(file_hash);
CREATE INDEX IF NOT EXISTS idx_media_files_created_at ON education.media_files(created_at DESC);

-- Content collaborations indexes
CREATE INDEX IF NOT EXISTS idx_content_collaborations_content_user ON education.content_collaborations(content_id, user_id);
CREATE INDEX IF NOT EXISTS idx_content_collaborations_user_active ON education.content_collaborations(user_id, is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_content_collaborations_session ON education.content_collaborations(session_id) WHERE session_id IS NOT NULL;

-- Content reviews indexes
CREATE INDEX IF NOT EXISTS idx_content_reviews_content_version ON education.content_reviews(content_id, version_number);
CREATE INDEX IF NOT EXISTS idx_content_reviews_reviewer ON education.content_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_content_reviews_status ON education.content_reviews(review_status);

-- Content tags indexes
CREATE INDEX IF NOT EXISTS idx_content_tags_usage ON education.content_tags(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_content_tags_name ON education.content_tags(name);

-- Content categories indexes
CREATE INDEX IF NOT EXISTS idx_content_categories_parent ON education.content_categories(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_content_categories_active ON education.content_categories(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_content_categories_order ON education.content_categories(display_order);

-- SCORM packages indexes
CREATE INDEX IF NOT EXISTS idx_scorm_packages_content ON education.scorm_packages(content_id);
CREATE INDEX IF NOT EXISTS idx_scorm_packages_valid ON education.scorm_packages(is_valid) WHERE is_valid = TRUE;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update search vector when content changes
CREATE OR REPLACE FUNCTION education.update_content_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.content_body, '')), 'C') ||
        setweight(to_tsvector('english', array_to_string(NEW.tags, ' ')), 'D');
    
    NEW.updated_at := NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_content_search_vector
    BEFORE INSERT OR UPDATE ON education.content
    FOR EACH ROW
    EXECUTE FUNCTION education.update_content_search_vector();

-- Auto-increment version on content update
CREATE OR REPLACE FUNCTION education.increment_content_version()
RETURNS TRIGGER AS $$
BEGIN
    -- Only increment version if content_body or title changed
    IF (OLD.content_body IS DISTINCT FROM NEW.content_body) OR 
       (OLD.title IS DISTINCT FROM NEW.title) THEN
        NEW.version := OLD.version + 1;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_content_version
    BEFORE UPDATE ON education.content
    FOR EACH ROW
    EXECUTE FUNCTION education.increment_content_version();

-- Update collaboration activity timestamp
CREATE OR REPLACE FUNCTION education.update_collaboration_activity()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_activity := NOW();
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_collaboration_activity
    BEFORE UPDATE ON education.content_collaborations
    FOR EACH ROW
    EXECUTE FUNCTION education.update_collaboration_activity();

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Content with media summary
CREATE OR REPLACE VIEW education.content_with_media AS
SELECT 
    c.*,
    u.email as created_by_email,
    COALESCE(media_counts.total_files, 0) as media_file_count,
    COALESCE(media_counts.total_size, 0) as total_media_size,
    media_types.media_types
FROM education.content c
LEFT JOIN education.users u ON c.created_by = u.id
LEFT JOIN (
    SELECT 
        content_id,
        COUNT(*) as total_files,
        SUM(file_size) as total_size
    FROM education.media_files
    WHERE content_id IS NOT NULL
    GROUP BY content_id
) media_counts ON c.id = media_counts.content_id
LEFT JOIN (
    SELECT 
        content_id,
        ARRAY_AGG(DISTINCT media_type) as media_types
    FROM education.media_files
    WHERE content_id IS NOT NULL
    GROUP BY content_id
) media_types ON c.id = media_types.content_id;

-- Content hierarchy view
CREATE OR REPLACE VIEW education.content_hierarchy AS
WITH RECURSIVE content_tree AS (
    -- Base case: top-level content
    SELECT 
        id,
        title,
        content_type,
        parent_id,
        status,
        0 as level,
        ARRAY[id] as path,
        title as full_path
    FROM education.content
    WHERE parent_id IS NULL
    
    UNION ALL
    
    -- Recursive case: child content
    SELECT 
        c.id,
        c.title,
        c.content_type,
        c.parent_id,
        c.status,
        ct.level + 1,
        ct.path || c.id,
        ct.full_path || ' > ' || c.title
    FROM education.content c
    JOIN content_tree ct ON c.parent_id = ct.id
)
SELECT * FROM content_tree
ORDER BY level, title;

-- Content review summary
CREATE OR REPLACE VIEW education.content_review_summary AS
SELECT 
    c.id as content_id,
    c.title,
    c.status,
    c.version,
    COUNT(cr.id) as total_reviews,
    COUNT(CASE WHEN cr.review_status = 'approved' THEN 1 END) as approved_reviews,
    COUNT(CASE WHEN cr.review_status = 'rejected' THEN 1 END) as rejected_reviews,
    COUNT(CASE WHEN cr.review_status = 'pending' THEN 1 END) as pending_reviews,
    AVG(cr.accuracy_score) as avg_accuracy_score,
    AVG(cr.clarity_score) as avg_clarity_score,
    AVG(cr.completeness_score) as avg_completeness_score
FROM education.content c
LEFT JOIN education.content_reviews cr ON c.id = cr.content_id AND c.version = cr.version_number
GROUP BY c.id, c.title, c.status, c.version;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to get content tree
CREATE OR REPLACE FUNCTION education.get_content_children(p_parent_id UUID)
RETURNS TABLE (
    id UUID,
    title VARCHAR(255),
    content_type VARCHAR(50),
    status VARCHAR(20),
    level INTEGER
) AS $$
WITH RECURSIVE content_children AS (
    SELECT 
        c.id,
        c.title,
        c.content_type,
        c.status,
        0 as level
    FROM education.content c
    WHERE c.parent_id = p_parent_id
    
    UNION ALL
    
    SELECT 
        c.id,
        c.title,
        c.content_type,
        c.status,
        cc.level + 1
    FROM education.content c
    JOIN content_children cc ON c.parent_id = cc.id
)
SELECT 
    cc.id,
    cc.title,
    cc.content_type,
    cc.status,
    cc.level
FROM content_children cc
ORDER BY cc.level, cc.title;
$$ LANGUAGE sql;

-- Function to search content
CREATE OR REPLACE FUNCTION education.search_content(
    p_query TEXT,
    p_content_type VARCHAR(50) DEFAULT NULL,
    p_status VARCHAR(20) DEFAULT NULL,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    title VARCHAR(255),
    content_type VARCHAR(50),
    description TEXT,
    status VARCHAR(20),
    created_by_email TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.title,
        c.content_type,
        c.description,
        c.status,
        u.email,
        c.created_at,
        ts_rank(c.search_vector, plainto_tsquery('english', p_query)) as rank
    FROM education.content c
    LEFT JOIN education.users u ON c.created_by = u.id
    WHERE 
        (p_query IS NULL OR c.search_vector @@ plainto_tsquery('english', p_query))
        AND (p_content_type IS NULL OR c.content_type = p_content_type)
        AND (p_status IS NULL OR c.status = p_status)
    ORDER BY 
        CASE WHEN p_query IS NOT NULL THEN ts_rank(c.search_vector, plainto_tsquery('english', p_query)) END DESC,
        c.updated_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;