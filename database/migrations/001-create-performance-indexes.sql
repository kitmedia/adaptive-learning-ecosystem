-- Migration 001: Create Performance Indexes
-- Adaptive Learning Ecosystem - Database Performance Enhancement
-- Safe deployment of performance indexes with rollback capability

-- Migration Metadata
INSERT INTO education.migrations (
    version, 
    name, 
    description, 
    applied_at
) VALUES (
    '001',
    'create-performance-indexes',
    'Add comprehensive performance indexes for high-traffic queries',
    CURRENT_TIMESTAMP
) ON CONFLICT (version) DO NOTHING;

-- ==============================================================================
-- MIGRATION START TRANSACTION
-- ==============================================================================

BEGIN;

-- Create migration tracking if it doesn't exist
CREATE TABLE IF NOT EXISTS education.migrations (
    version VARCHAR(10) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    rollback_sql TEXT
);

-- Store rollback information for this migration
UPDATE education.migrations 
SET rollback_sql = $ROLLBACK$
    -- Drop all performance indexes created in this migration
    DROP INDEX IF EXISTS education.idx_users_email_hash;
    DROP INDEX IF EXISTS education.idx_users_role_active;
    DROP INDEX IF EXISTS education.idx_users_institution_role;
    DROP INDEX IF EXISTS education.idx_users_created_at;
    DROP INDEX IF EXISTS education.idx_users_last_login;
    
    DROP INDEX IF EXISTS education.idx_courses_published;
    DROP INDEX IF EXISTS education.idx_courses_category_difficulty;
    DROP INDEX IF EXISTS education.idx_courses_instructor_published;
    DROP INDEX IF EXISTS education.idx_courses_institution_published;
    DROP INDEX IF EXISTS education.idx_courses_price_range;
    DROP INDEX IF EXISTS education.idx_courses_duration;
    
    DROP INDEX IF EXISTS education.idx_course_modules_course_order;
    DROP INDEX IF EXISTS education.idx_course_modules_published;
    
    DROP INDEX IF EXISTS education.idx_lessons_module_order;
    DROP INDEX IF EXISTS education.idx_lessons_published;
    DROP INDEX IF EXISTS education.idx_lessons_content_type;
    DROP INDEX IF EXISTS education.idx_lessons_duration;
    DROP INDEX IF EXISTS education.idx_lessons_ai_generated;
    
    DROP INDEX IF EXISTS education.idx_enrollments_student_active;
    DROP INDEX IF EXISTS education.idx_enrollments_course_active;
    DROP INDEX IF EXISTS education.idx_enrollments_progress;
    DROP INDEX IF EXISTS education.idx_enrollments_last_accessed;
    DROP INDEX IF EXISTS education.idx_enrollments_completion_date;
    
    DROP INDEX IF EXISTS education.idx_lesson_progress_student_status;
    DROP INDEX IF EXISTS education.idx_lesson_progress_completion;
    DROP INDEX IF EXISTS education.idx_lesson_progress_time_spent;
    DROP INDEX IF EXISTS education.idx_lesson_progress_last_accessed;
    
    DROP INDEX IF EXISTS education.idx_assessments_lesson;
    DROP INDEX IF EXISTS education.idx_assessments_course;
    DROP INDEX IF EXISTS education.idx_assessments_type;
    DROP INDEX IF EXISTS education.idx_assessments_adaptive;
    
    DROP INDEX IF EXISTS education.idx_assessment_attempts_student;
    DROP INDEX IF EXISTS education.idx_assessment_attempts_assessment;
    DROP INDEX IF EXISTS education.idx_assessment_attempts_score;
    DROP INDEX IF EXISTS education.idx_assessment_attempts_submitted;
    
    DROP INDEX IF EXISTS education.idx_study_groups_course;
    DROP INDEX IF EXISTS education.idx_study_groups_public;
    DROP INDEX IF EXISTS education.idx_study_groups_code;
    
    DROP INDEX IF EXISTS education.idx_study_group_members_user;
    DROP INDEX IF EXISTS education.idx_study_group_members_group_active;
    
    DROP INDEX IF EXISTS education.idx_ai_recommendations_student_active;
    DROP INDEX IF EXISTS education.idx_ai_recommendations_type_priority;
    DROP INDEX IF EXISTS education.idx_ai_recommendations_course_type;
    DROP INDEX IF EXISTS education.idx_ai_recommendations_displayed;
    
    DROP INDEX IF EXISTS education.idx_notifications_user_unread;
    DROP INDEX IF EXISTS education.idx_notifications_type;
    DROP INDEX IF EXISTS education.idx_notifications_delivery;
    
    -- Drop composite indexes
    DROP INDEX IF EXISTS education.idx_student_dashboard;
    DROP INDEX IF EXISTS education.idx_course_catalog;
    DROP INDEX IF EXISTS education.idx_learning_analytics;
    DROP INDEX IF EXISTS education.idx_assessment_analytics;
    DROP INDEX IF EXISTS education.idx_ai_engine;
    
    -- Drop partial indexes
    DROP INDEX IF EXISTS education.idx_active_enrollments_progress;
    DROP INDEX IF EXISTS education.idx_completed_assessments;
    DROP INDEX IF EXISTS education.idx_published_content;
    DROP INDEX IF EXISTS education.idx_recent_activity;
    
    -- Drop GIN indexes
    DROP INDEX IF EXISTS education.idx_courses_metadata_gin;
    DROP INDEX IF EXISTS education.idx_courses_tags_gin;
    DROP INDEX IF EXISTS education.idx_assessments_questions_gin;
    DROP INDEX IF EXISTS education.idx_assessment_answers_gin;
    DROP INDEX IF EXISTS education.idx_ai_recommendations_data_gin;
    DROP INDEX IF EXISTS education.idx_notifications_data_gin;
    DROP INDEX IF EXISTS education.idx_institutions_settings_gin;
    
    -- Drop full-text search indexes
    DROP INDEX IF EXISTS education.idx_courses_fulltext;
    DROP INDEX IF EXISTS education.idx_lessons_fulltext;
    DROP INDEX IF EXISTS education.idx_assessments_fulltext;
    
    -- Drop monitoring views
    DROP VIEW IF EXISTS education.index_usage_stats;
    DROP VIEW IF EXISTS education.table_access_stats;
    
    -- Drop maintenance functions
    DROP FUNCTION IF EXISTS education.rebuild_indexes();
    DROP FUNCTION IF EXISTS education.update_table_statistics();
$ROLLBACK$
WHERE version = '001';

-- ==============================================================================
-- SAFE INDEX CREATION WITH MONITORING
-- ==============================================================================

-- Function to safely create index with timeout protection
CREATE OR REPLACE FUNCTION education.safe_create_index(
    index_sql TEXT,
    index_name TEXT,
    timeout_seconds INTEGER DEFAULT 300
) RETURNS BOOLEAN AS $$
DECLARE
    start_time TIMESTAMP;
    current_locks INTEGER;
BEGIN
    start_time := CURRENT_TIMESTAMP;
    
    -- Check for existing locks that might block index creation
    SELECT COUNT(*) INTO current_locks
    FROM pg_locks l
    JOIN pg_class c ON l.relation = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'education' 
    AND l.mode LIKE '%ExclusiveLock%';
    
    -- If too many locks, defer creation
    IF current_locks > 5 THEN
        RAISE WARNING 'Too many locks detected (%), deferring index creation for %', current_locks, index_name;
        RETURN FALSE;
    END IF;
    
    -- Execute the index creation with error handling
    BEGIN
        EXECUTE index_sql;
        RAISE NOTICE 'Successfully created index: %', index_name;
        RETURN TRUE;
    EXCEPTION
        WHEN duplicate_table THEN
            RAISE NOTICE 'Index % already exists, skipping', index_name;
            RETURN TRUE;
        WHEN lock_not_available THEN
            RAISE WARNING 'Could not acquire lock for index %, deferring', index_name;
            RETURN FALSE;
        WHEN OTHERS THEN
            RAISE WARNING 'Error creating index %: %', index_name, SQLERRM;
            RETURN FALSE;
    END;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- CREATE INDEXES IN PRIORITY ORDER
-- ==============================================================================

-- High Priority Indexes (most critical for performance)
DO $$
BEGIN
    -- Users table critical indexes
    PERFORM education.safe_create_index(
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_hash ON education.users USING hash(email)',
        'idx_users_email_hash'
    );
    
    PERFORM education.safe_create_index(
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role_active ON education.users(role, is_active)',
        'idx_users_role_active'
    );
    
    -- Enrollment critical indexes
    PERFORM education.safe_create_index(
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_enrollments_student_active ON education.enrollments(student_id, is_active) WHERE is_active = true',
        'idx_enrollments_student_active'
    );
    
    PERFORM education.safe_create_index(
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_enrollments_course_active ON education.enrollments(course_id, is_active) WHERE is_active = true',
        'idx_enrollments_course_active'
    );
    
    -- Course catalog indexes
    PERFORM education.safe_create_index(
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_courses_published ON education.courses(is_published) WHERE is_published = true',
        'idx_courses_published'
    );
    
    PERFORM education.safe_create_index(
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_courses_category_difficulty ON education.courses(category, difficulty_level) WHERE is_published = true',
        'idx_courses_category_difficulty'
    );
END $$;

-- Medium Priority Indexes
DO $$
BEGIN
    -- Lesson progress tracking
    PERFORM education.safe_create_index(
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lesson_progress_student_status ON education.lesson_progress(enrollment_id, status)',
        'idx_lesson_progress_student_status'
    );
    
    PERFORM education.safe_create_index(
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lesson_progress_completion ON education.lesson_progress(enrollment_id, completion_percentage)',
        'idx_lesson_progress_completion'
    );
    
    -- Assessment indexes
    PERFORM education.safe_create_index(
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assessments_type ON education.assessments(assessment_type)',
        'idx_assessments_type'
    );
    
    PERFORM education.safe_create_index(
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assessment_attempts_student ON education.assessment_attempts(student_id, started_at)',
        'idx_assessment_attempts_student'
    );
    
    -- AI recommendations
    PERFORM education.safe_create_index(
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_recommendations_student_active ON education.ai_recommendations(student_id, created_at) WHERE expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP',
        'idx_ai_recommendations_student_active'
    );
    
    -- Notifications
    PERFORM education.safe_create_index(
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_unread ON education.notifications(user_id, created_at) WHERE is_read = false',
        'idx_notifications_user_unread'
    );
END $$;

-- Low Priority Indexes (can be created during off-peak hours)
DO $$
BEGIN
    -- Full-text search indexes (resource intensive)
    PERFORM education.safe_create_index(
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_courses_fulltext ON education.courses USING gin(to_tsvector(''english'', title || '' '' || COALESCE(description, '''')))',
        'idx_courses_fulltext'
    );
    
    PERFORM education.safe_create_index(
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lessons_fulltext ON education.lessons USING gin(to_tsvector(''english'', title || '' '' || COALESCE(content, '''')))',
        'idx_lessons_fulltext'
    );
    
    -- JSONB indexes
    PERFORM education.safe_create_index(
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_courses_metadata_gin ON education.courses USING gin(metadata)',
        'idx_courses_metadata_gin'
    );
    
    PERFORM education.safe_create_index(
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assessments_questions_gin ON education.assessments USING gin(questions)',
        'idx_assessments_questions_gin'
    );
END $$;

-- ==============================================================================
-- CREATE MONITORING VIEWS
-- ==============================================================================

-- Index usage monitoring
CREATE OR REPLACE VIEW education.index_usage_stats AS
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch,
    idx_scan,
    CASE 
        WHEN idx_scan = 0 THEN 'UNUSED'
        WHEN idx_scan < 100 THEN 'LOW_USAGE'
        WHEN idx_scan < 1000 THEN 'MEDIUM_USAGE'
        ELSE 'HIGH_USAGE'
    END as usage_level,
    ROUND((idx_tup_fetch::numeric / NULLIF(idx_scan, 0)), 2) as avg_tuples_per_scan
FROM pg_stat_user_indexes 
WHERE schemaname = 'education'
ORDER BY idx_scan DESC;

-- Table access patterns
CREATE OR REPLACE VIEW education.table_access_stats AS
SELECT 
    schemaname,
    tablename,
    seq_scan,
    seq_tup_read,
    idx_scan,
    idx_tup_fetch,
    n_tup_ins,
    n_tup_upd,
    n_tup_del,
    ROUND((idx_tup_fetch::numeric / NULLIF(seq_tup_read + idx_tup_fetch, 0)) * 100, 2) as index_usage_percentage,
    CASE 
        WHEN seq_scan > idx_scan * 2 THEN 'NEEDS_MORE_INDEXES'
        WHEN idx_scan > seq_scan * 10 THEN 'WELL_INDEXED'
        ELSE 'BALANCED'
    END as indexing_status
FROM pg_stat_user_tables 
WHERE schemaname = 'education'
ORDER BY seq_scan + idx_scan DESC;

-- ==============================================================================
-- CREATE MAINTENANCE FUNCTIONS
-- ==============================================================================

-- Rebuild indexes function
CREATE OR REPLACE FUNCTION education.rebuild_indexes()
RETURNS TABLE(
    index_name TEXT,
    table_name TEXT,
    status TEXT,
    duration_seconds NUMERIC
) AS $$
DECLARE
    index_record RECORD;
    start_time TIMESTAMP;
    end_time TIMESTAMP;
BEGIN
    FOR index_record IN 
        SELECT indexname, tablename 
        FROM pg_indexes 
        WHERE schemaname = 'education'
        AND indexname LIKE 'idx_%'
        ORDER BY tablename, indexname
    LOOP
        start_time := CURRENT_TIMESTAMP;
        
        BEGIN
            EXECUTE 'REINDEX INDEX CONCURRENTLY education.' || index_record.indexname;
            end_time := CURRENT_TIMESTAMP;
            
            RETURN QUERY SELECT 
                index_record.indexname::TEXT,
                index_record.tablename::TEXT,
                'SUCCESS'::TEXT,
                EXTRACT(EPOCH FROM (end_time - start_time))::NUMERIC;
                
        EXCEPTION WHEN OTHERS THEN
            end_time := CURRENT_TIMESTAMP;
            
            RETURN QUERY SELECT 
                index_record.indexname::TEXT,
                index_record.tablename::TEXT,
                ('ERROR: ' || SQLERRM)::TEXT,
                EXTRACT(EPOCH FROM (end_time - start_time))::NUMERIC;
        END;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Update statistics function
CREATE OR REPLACE FUNCTION education.update_table_statistics()
RETURNS TABLE(
    table_name TEXT,
    status TEXT,
    rows_analyzed BIGINT
) AS $$
DECLARE
    table_record RECORD;
    table_stats RECORD;
BEGIN
    FOR table_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'education'
        ORDER BY tablename
    LOOP
        BEGIN
            EXECUTE 'ANALYZE education.' || table_record.tablename;
            
            -- Get updated statistics
            SELECT n_tup_ins + n_tup_upd + n_tup_del as total_rows
            INTO table_stats
            FROM pg_stat_user_tables 
            WHERE schemaname = 'education' AND tablename = table_record.tablename;
            
            RETURN QUERY SELECT 
                table_record.tablename::TEXT,
                'SUCCESS'::TEXT,
                COALESCE(table_stats.total_rows, 0)::BIGINT;
                
        EXCEPTION WHEN OTHERS THEN
            RETURN QUERY SELECT 
                table_record.tablename::TEXT,
                ('ERROR: ' || SQLERRM)::TEXT,
                0::BIGINT;
        END;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Clean up temporary function
DROP FUNCTION IF EXISTS education.safe_create_index(TEXT, TEXT, INTEGER);

-- Update migration status
UPDATE education.migrations 
SET applied_at = CURRENT_TIMESTAMP 
WHERE version = '001';

COMMIT;

-- ==============================================================================
-- POST-MIGRATION ANALYSIS
-- ==============================================================================

-- Analyze all tables to update statistics after index creation
ANALYZE education.users;
ANALYZE education.institutions;
ANALYZE education.courses;
ANALYZE education.course_modules;
ANALYZE education.lessons;
ANALYZE education.enrollments;
ANALYZE education.lesson_progress;
ANALYZE education.assessments;
ANALYZE education.assessment_attempts;
ANALYZE education.study_groups;
ANALYZE education.study_group_members;
ANALYZE education.ai_recommendations;
ANALYZE education.notifications;

-- Display migration summary
SELECT 
    'Migration 001 completed successfully' as status,
    COUNT(*) as indexes_created,
    CURRENT_TIMESTAMP as completed_at
FROM pg_indexes 
WHERE schemaname = 'education' 
AND indexname LIKE 'idx_%';