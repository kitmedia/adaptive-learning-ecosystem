-- Performance Optimization Indexes - Adaptive Learning Ecosystem
-- EbroValley Digital - Database Performance Enhancement
-- Created by ToñoAdPAOS & Claudio Supreme

-- ==============================================================================
-- PERFORMANCE INDEXES FOR HIGH-TRAFFIC QUERIES
-- ==============================================================================

-- Users table optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_hash ON education.users USING hash(email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role_active ON education.users(role, is_active);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_institution_role ON education.users(institution_id, role) WHERE is_active = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at ON education.users(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_last_login ON education.users(updated_at) WHERE is_active = true;

-- Courses optimization for catalog queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_courses_published ON education.courses(is_published) WHERE is_published = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_courses_category_difficulty ON education.courses(category, difficulty_level) WHERE is_published = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_courses_instructor_published ON education.courses(instructor_id, is_published);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_courses_institution_published ON education.courses(institution_id, is_published) WHERE is_published = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_courses_price_range ON education.courses(price) WHERE is_published = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_courses_duration ON education.courses(estimated_duration_hours) WHERE is_published = true;

-- Course modules optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_course_modules_course_order ON education.course_modules(course_id, order_index);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_course_modules_published ON education.course_modules(course_id, is_published) WHERE is_published = true;

-- Lessons optimization for learning path queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lessons_module_order ON education.lessons(module_id, order_index);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lessons_published ON education.lessons(module_id, is_published) WHERE is_published = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lessons_content_type ON education.lessons(content_type) WHERE is_published = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lessons_duration ON education.lessons(estimated_duration_minutes) WHERE is_published = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lessons_ai_generated ON education.lessons(ai_generated) WHERE is_published = true;

-- Enrollments optimization for student dashboard
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_enrollments_student_active ON education.enrollments(student_id, is_active) WHERE is_active = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_enrollments_course_active ON education.enrollments(course_id, is_active) WHERE is_active = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_enrollments_progress ON education.enrollments(progress_percentage) WHERE is_active = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_enrollments_last_accessed ON education.enrollments(student_id, last_accessed) WHERE is_active = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_enrollments_completion_date ON education.enrollments(completion_date) WHERE completion_date IS NOT NULL;

-- Lesson progress optimization for real-time tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lesson_progress_student_status ON education.lesson_progress(enrollment_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lesson_progress_completion ON education.lesson_progress(enrollment_id, completion_percentage);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lesson_progress_time_spent ON education.lesson_progress(lesson_id, time_spent_seconds);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lesson_progress_last_accessed ON education.lesson_progress(enrollment_id, last_accessed);

-- Assessment optimization for AI-powered adaptive testing
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assessments_lesson ON education.assessments(lesson_id) WHERE lesson_id IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assessments_course ON education.assessments(course_id) WHERE course_id IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assessments_type ON education.assessments(assessment_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assessments_adaptive ON education.assessments(is_adaptive) WHERE is_adaptive = true;

-- Assessment attempts optimization for performance analytics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assessment_attempts_student ON education.assessment_attempts(student_id, started_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assessment_attempts_assessment ON education.assessment_attempts(assessment_id, attempt_number);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assessment_attempts_score ON education.assessment_attempts(assessment_id, score) WHERE score IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assessment_attempts_submitted ON education.assessment_attempts(submitted_at) WHERE submitted_at IS NOT NULL;

-- Study groups optimization for collaboration features
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_study_groups_course ON education.study_groups(course_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_study_groups_public ON education.study_groups(is_public) WHERE is_public = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_study_groups_code ON education.study_groups(room_code);

-- Study group members optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_study_group_members_user ON education.study_group_members(user_id, is_active) WHERE is_active = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_study_group_members_group_active ON education.study_group_members(group_id, is_active) WHERE is_active = true;

-- AI recommendations optimization for ML performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_recommendations_student_active ON education.ai_recommendations(student_id, created_at) WHERE expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_recommendations_type_priority ON education.ai_recommendations(recommendation_type, priority);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_recommendations_course_type ON education.ai_recommendations(course_id, recommendation_type) WHERE course_id IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_recommendations_displayed ON education.ai_recommendations(student_id, is_displayed) WHERE is_displayed = false;

-- Notifications optimization for real-time updates
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_unread ON education.notifications(user_id, created_at) WHERE is_read = false;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_type ON education.notifications(notification_type, created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_delivery ON education.notifications(delivery_method, created_at) WHERE is_read = false;

-- ==============================================================================
-- COMPOSITE INDEXES FOR COMPLEX QUERIES
-- ==============================================================================

-- Student dashboard query optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_student_dashboard ON education.enrollments(student_id, is_active, last_accessed) 
WHERE is_active = true;

-- Course catalog with filters
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_course_catalog ON education.courses(category, difficulty_level, price, is_published) 
WHERE is_published = true;

-- Learning analytics queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_learning_analytics ON education.lesson_progress(enrollment_id, status, completion_percentage, time_spent_seconds);

-- Assessment analytics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assessment_analytics ON education.assessment_attempts(assessment_id, score, time_taken_seconds, submitted_at) 
WHERE submitted_at IS NOT NULL;

-- AI recommendation engine queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_engine ON education.ai_recommendations(student_id, recommendation_type, priority, created_at) 
WHERE (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP) AND is_displayed = false;

-- ==============================================================================
-- PARTIAL INDEXES FOR SPECIALIZED QUERIES
-- ==============================================================================

-- Active enrollments only
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_active_enrollments_progress ON education.enrollments(student_id, progress_percentage, last_accessed) 
WHERE is_active = true AND completion_date IS NULL;

-- Completed assessments with scores
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_completed_assessments ON education.assessment_attempts(student_id, assessment_id, score, submitted_at) 
WHERE submitted_at IS NOT NULL AND score IS NOT NULL;

-- Published content hierarchy
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_published_content ON education.lessons(module_id, order_index, content_type) 
WHERE is_published = true;

-- Recent activity tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_recent_activity ON education.lesson_progress(enrollment_id, last_accessed) 
WHERE last_accessed > CURRENT_TIMESTAMP - INTERVAL '30 days';

-- ==============================================================================
-- GINB INDEXES FOR JSONB QUERIES
-- ==============================================================================

-- Course metadata search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_courses_metadata_gin ON education.courses USING gin(metadata);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_courses_tags_gin ON education.courses USING gin(tags);

-- Assessment questions search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assessments_questions_gin ON education.assessments USING gin(questions);

-- Assessment answers analysis
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assessment_answers_gin ON education.assessment_attempts USING gin(answers);

-- AI recommendations content search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_recommendations_data_gin ON education.ai_recommendations USING gin(content_data);

-- Notification data search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_data_gin ON education.notifications USING gin(data);

-- Institution settings
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_institutions_settings_gin ON education.institutions USING gin(settings);

-- ==============================================================================
-- FULL-TEXT SEARCH INDEXES
-- ==============================================================================

-- Course full-text search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_courses_fulltext ON education.courses 
USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- Lesson content search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lessons_fulltext ON education.lessons 
USING gin(to_tsvector('english', title || ' ' || COALESCE(content, '')));

-- Assessment title search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assessments_fulltext ON education.assessments 
USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- ==============================================================================
-- STATISTICS UPDATE FOR QUERY PLANNER
-- ==============================================================================

-- Update table statistics for better query planning
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

-- ==============================================================================
-- INDEX USAGE MONITORING VIEWS
-- ==============================================================================

-- Create view to monitor index usage
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
    END as usage_level
FROM pg_stat_user_indexes 
WHERE schemaname = 'education'
ORDER BY idx_scan DESC;

-- Create view to monitor table access patterns
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
    ROUND((idx_tup_fetch::numeric / NULLIF(seq_tup_read + idx_tup_fetch, 0)) * 100, 2) as index_usage_percentage
FROM pg_stat_user_tables 
WHERE schemaname = 'education'
ORDER BY seq_scan + idx_scan DESC;

-- ==============================================================================
-- MAINTENANCE PROCEDURES
-- ==============================================================================

-- Function to rebuild indexes during maintenance windows
CREATE OR REPLACE FUNCTION education.rebuild_indexes()
RETURNS void AS $$
DECLARE
    index_record RECORD;
BEGIN
    -- Rebuild all indexes in education schema
    FOR index_record IN 
        SELECT indexname, tablename 
        FROM pg_indexes 
        WHERE schemaname = 'education'
    LOOP
        EXECUTE 'REINDEX INDEX CONCURRENTLY education.' || index_record.indexname;
        RAISE NOTICE 'Rebuilt index: %', index_record.indexname;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to analyze all tables for updated statistics
CREATE OR REPLACE FUNCTION education.update_table_statistics()
RETURNS void AS $$
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'education'
    LOOP
        EXECUTE 'ANALYZE education.' || table_record.tablename;
        RAISE NOTICE 'Analyzed table: %', table_record.tablename;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMIT;