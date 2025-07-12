-- Analytics Schema Extension
-- Adaptive Learning Ecosystem - EbroValley Digital
-- Additional tables for comprehensive analytics and event tracking

-- ============================================================================
-- ANALYTICS EVENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS education.analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES education.users(id) ON DELETE CASCADE,
    session_id VARCHAR(255) NOT NULL,
    
    -- Event classification
    event_type VARCHAR(100) NOT NULL, -- page_view, click, completion, assessment, etc.
    event_category VARCHAR(100) NOT NULL, -- learning, navigation, assessment, social, etc.
    event_action VARCHAR(100) NOT NULL, -- view, click, submit, complete, share, etc.
    event_label VARCHAR(255), -- Additional context
    event_value DECIMAL(10,2), -- Numeric value if applicable
    
    -- Event context
    properties JSONB DEFAULT '{}', -- Additional event properties
    course_id UUID REFERENCES education.courses(id) ON DELETE SET NULL,
    lesson_id UUID REFERENCES education.lessons(id) ON DELETE SET NULL,
    assessment_id UUID REFERENCES education.assessments(id) ON DELETE SET NULL,
    
    -- Technical metadata
    user_agent TEXT,
    ip_address INET,
    referrer TEXT,
    page_url TEXT,
    
    -- Timestamps
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexing
    CONSTRAINT analytics_events_timestamp_check CHECK (timestamp <= NOW() + INTERVAL '1 hour')
);

-- ============================================================================
-- LEARNING ANALYTICS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS education.learning_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES education.users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES education.courses(id) ON DELETE CASCADE,
    
    -- Learning metrics
    completion_rate DECIMAL(5,2) NOT NULL DEFAULT 0.0 CHECK (completion_rate >= 0 AND completion_rate <= 100),
    time_spent_minutes INTEGER NOT NULL DEFAULT 0 CHECK (time_spent_minutes >= 0),
    engagement_score DECIMAL(4,2) NOT NULL DEFAULT 0.0 CHECK (engagement_score >= 0 AND engagement_score <= 10),
    
    -- Performance metrics
    quiz_scores JSONB DEFAULT '[]', -- Array of quiz scores
    average_score DECIMAL(5,2) DEFAULT 0.0 CHECK (average_score >= 0 AND average_score <= 100),
    best_score DECIMAL(5,2) DEFAULT 0.0 CHECK (best_score >= 0 AND best_score <= 100),
    
    -- Adaptive learning metrics
    difficulty_adaptation JSONB DEFAULT '{}', -- Difficulty adjustments over time
    learning_path_efficiency DECIMAL(5,2) DEFAULT 0.0 CHECK (learning_path_efficiency >= 0 AND learning_path_efficiency <= 100),
    
    -- Activity patterns
    study_sessions_count INTEGER DEFAULT 0,
    avg_session_duration_minutes DECIMAL(8,2) DEFAULT 0.0,
    streak_days INTEGER DEFAULT 0,
    last_study_date DATE,
    
    -- Predictive metrics
    predicted_completion_date DATE,
    at_risk_dropout BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    analytics_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id, course_id, analytics_date)
);

-- ============================================================================
-- BUSINESS METRICS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS education.business_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Time period
    metric_date DATE NOT NULL,
    metric_type VARCHAR(50) NOT NULL, -- daily, weekly, monthly
    
    -- User metrics
    total_users INTEGER DEFAULT 0,
    active_users INTEGER DEFAULT 0,
    new_registrations INTEGER DEFAULT 0,
    returning_users INTEGER DEFAULT 0,
    
    -- Course metrics
    course_enrollments INTEGER DEFAULT 0,
    course_completions INTEGER DEFAULT 0,
    course_completion_rate DECIMAL(5,2) DEFAULT 0.0,
    
    -- Engagement metrics
    total_sessions INTEGER DEFAULT 0,
    avg_session_duration_minutes DECIMAL(8,2) DEFAULT 0.0,
    total_page_views INTEGER DEFAULT 0,
    bounce_rate DECIMAL(5,2) DEFAULT 0.0,
    
    -- Learning metrics
    total_lessons_completed INTEGER DEFAULT 0,
    total_assessments_taken INTEGER DEFAULT 0,
    avg_quiz_score DECIMAL(5,2) DEFAULT 0.0,
    
    -- Revenue metrics (if applicable)
    total_revenue DECIMAL(12,2) DEFAULT 0.0,
    avg_revenue_per_user DECIMAL(10,2) DEFAULT 0.0,
    
    -- Content metrics
    most_popular_courses JSONB DEFAULT '[]',
    least_popular_courses JSONB DEFAULT '[]',
    
    -- Technical metrics
    avg_load_time_seconds DECIMAL(6,3) DEFAULT 0.0,
    error_rate DECIMAL(5,2) DEFAULT 0.0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(metric_date, metric_type)
);

-- ============================================================================
-- USER BEHAVIOR PATTERNS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS education.user_behavior_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES education.users(id) ON DELETE CASCADE,
    
    -- Learning patterns
    preferred_study_times JSONB DEFAULT '{}', -- Hour-based preferences
    study_duration_patterns JSONB DEFAULT '{}', -- Session length preferences
    content_type_preferences JSONB DEFAULT '{}', -- Video, text, interactive, etc.
    
    -- Engagement patterns
    peak_activity_hours INTEGER[], -- Hours when most active
    weekly_activity_pattern JSONB DEFAULT '{}', -- Day-of-week patterns
    learning_streak_info JSONB DEFAULT '{}', -- Streak statistics
    
    -- Performance patterns
    difficulty_preference VARCHAR(20) DEFAULT 'medium', -- easy, medium, hard
    learning_speed VARCHAR(20) DEFAULT 'normal', -- slow, normal, fast
    retention_rate DECIMAL(5,2) DEFAULT 0.0,
    
    -- Interaction patterns
    help_seeking_frequency INTEGER DEFAULT 0,
    peer_interaction_level VARCHAR(20) DEFAULT 'low', -- low, medium, high
    ai_tutor_usage_frequency INTEGER DEFAULT 0,
    
    -- Predictive indicators
    churn_risk_score DECIMAL(5,2) DEFAULT 0.0 CHECK (churn_risk_score >= 0 AND churn_risk_score <= 100),
    engagement_trend VARCHAR(20) DEFAULT 'stable', -- increasing, stable, decreasing
    
    -- Timestamps
    analysis_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id, analysis_date)
);

-- ============================================================================
-- COURSE ANALYTICS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS education.course_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES education.courses(id) ON DELETE CASCADE,
    
    -- Enrollment metrics
    total_enrollments INTEGER DEFAULT 0,
    active_enrollments INTEGER DEFAULT 0,
    completion_count INTEGER DEFAULT 0,
    completion_rate DECIMAL(5,2) DEFAULT 0.0,
    
    -- Engagement metrics
    avg_time_to_complete_hours DECIMAL(8,2) DEFAULT 0.0,
    avg_engagement_score DECIMAL(4,2) DEFAULT 0.0,
    dropout_rate DECIMAL(5,2) DEFAULT 0.0,
    
    -- Content effectiveness
    most_challenging_lessons JSONB DEFAULT '[]',
    highest_rated_content JSONB DEFAULT '[]',
    content_gaps JSONB DEFAULT '[]',
    
    -- Performance metrics
    avg_quiz_scores JSONB DEFAULT '{}', -- Per quiz/assessment
    pass_rate DECIMAL(5,2) DEFAULT 0.0,
    retry_rate DECIMAL(5,2) DEFAULT 0.0,
    
    -- User feedback
    avg_rating DECIMAL(3,2) DEFAULT 0.0,
    total_reviews INTEGER DEFAULT 0,
    nps_score DECIMAL(5,2) DEFAULT 0.0, -- Net Promoter Score
    
    -- Timestamps
    analytics_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(course_id, analytics_date)
);

-- ============================================================================
-- SYSTEM PERFORMANCE METRICS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS education.system_performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Time period
    metric_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Response time metrics
    avg_response_time_ms DECIMAL(8,3) DEFAULT 0.0,
    p95_response_time_ms DECIMAL(8,3) DEFAULT 0.0,
    p99_response_time_ms DECIMAL(8,3) DEFAULT 0.0,
    
    -- Error metrics
    error_count INTEGER DEFAULT 0,
    error_rate DECIMAL(5,2) DEFAULT 0.0,
    
    -- Throughput metrics
    requests_per_second DECIMAL(8,2) DEFAULT 0.0,
    concurrent_users INTEGER DEFAULT 0,
    
    -- Resource utilization
    cpu_usage_percent DECIMAL(5,2) DEFAULT 0.0,
    memory_usage_percent DECIMAL(5,2) DEFAULT 0.0,
    disk_usage_percent DECIMAL(5,2) DEFAULT 0.0,
    
    -- Database performance
    db_connection_count INTEGER DEFAULT 0,
    db_avg_query_time_ms DECIMAL(8,3) DEFAULT 0.0,
    db_slow_query_count INTEGER DEFAULT 0,
    
    -- Cache performance
    cache_hit_rate DECIMAL(5,2) DEFAULT 0.0,
    cache_miss_rate DECIMAL(5,2) DEFAULT 0.0,
    
    -- Service health
    service_availability DECIMAL(5,2) DEFAULT 100.0,
    uptime_percentage DECIMAL(5,2) DEFAULT 100.0
);

-- ============================================================================
-- ANALYTICS INDEXES
-- ============================================================================

-- Analytics events indexes
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_timestamp ON education.analytics_events(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session ON education.analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type_category ON education.analytics_events(event_type, event_category);
CREATE INDEX IF NOT EXISTS idx_analytics_events_course_timestamp ON education.analytics_events(course_id, timestamp DESC) WHERE course_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_analytics_events_properties ON education.analytics_events USING GIN(properties);

-- Learning analytics indexes
CREATE INDEX IF NOT EXISTS idx_learning_analytics_user_course ON education.learning_analytics(user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_learning_analytics_date ON education.learning_analytics(analytics_date DESC);
CREATE INDEX IF NOT EXISTS idx_learning_analytics_completion_rate ON education.learning_analytics(completion_rate DESC);
CREATE INDEX IF NOT EXISTS idx_learning_analytics_at_risk ON education.learning_analytics(at_risk_dropout) WHERE at_risk_dropout = TRUE;

-- Business metrics indexes
CREATE INDEX IF NOT EXISTS idx_business_metrics_date_type ON education.business_metrics(metric_date DESC, metric_type);
CREATE INDEX IF NOT EXISTS idx_business_metrics_active_users ON education.business_metrics(active_users DESC);

-- User behavior patterns indexes
CREATE INDEX IF NOT EXISTS idx_user_behavior_patterns_user_date ON education.user_behavior_patterns(user_id, analysis_date DESC);
CREATE INDEX IF NOT EXISTS idx_user_behavior_patterns_churn_risk ON education.user_behavior_patterns(churn_risk_score DESC);

-- Course analytics indexes
CREATE INDEX IF NOT EXISTS idx_course_analytics_course_date ON education.course_analytics(course_id, analytics_date DESC);
CREATE INDEX IF NOT EXISTS idx_course_analytics_completion_rate ON education.course_analytics(completion_rate DESC);

-- System performance metrics indexes
CREATE INDEX IF NOT EXISTS idx_system_performance_timestamp ON education.system_performance_metrics(metric_timestamp DESC);

-- ============================================================================
-- ANALYTICS VIEWS
-- ============================================================================

-- Real-time dashboard view
CREATE OR REPLACE VIEW education.realtime_dashboard AS
SELECT 
    CURRENT_DATE as dashboard_date,
    COUNT(DISTINCT ae.user_id) as daily_active_users,
    COUNT(DISTINCT ae.session_id) as active_sessions,
    COUNT(ae.id) as total_events_today,
    COUNT(DISTINCT CASE WHEN ae.event_category = 'learning' THEN ae.user_id END) as learning_active_users,
    COUNT(DISTINCT CASE WHEN ae.event_type = 'completion' THEN ae.user_id END) as users_completing_content,
    AVG(CASE WHEN ae.event_value IS NOT NULL THEN ae.event_value END) as avg_engagement_value
FROM education.analytics_events ae
WHERE ae.timestamp >= CURRENT_DATE
GROUP BY CURRENT_DATE;

-- Learning effectiveness view
CREATE OR REPLACE VIEW education.learning_effectiveness AS
SELECT 
    c.id as course_id,
    c.title as course_title,
    c.category,
    COUNT(DISTINCT e.student_id) as enrolled_students,
    COUNT(DISTINCT CASE WHEN e.completed_at IS NOT NULL THEN e.student_id END) as completed_students,
    ROUND(
        COUNT(DISTINCT CASE WHEN e.completed_at IS NOT NULL THEN e.student_id END)::DECIMAL / 
        NULLIF(COUNT(DISTINCT e.student_id), 0) * 100, 2
    ) as completion_rate,
    AVG(e.progress_percentage) as avg_progress,
    AVG(CASE WHEN e.completed_at IS NOT NULL THEN 
        EXTRACT(EPOCH FROM (e.completed_at - e.enrolled_at))/3600 
    END) as avg_completion_time_hours
FROM education.courses c
LEFT JOIN education.enrollments e ON c.id = e.course_id
WHERE c.is_published = TRUE
GROUP BY c.id, c.title, c.category
ORDER BY completion_rate DESC;

-- User engagement summary view
CREATE OR REPLACE VIEW education.user_engagement_summary AS
SELECT 
    u.id as user_id,
    u.email,
    u.role,
    u.created_at as registration_date,
    COUNT(DISTINCT e.course_id) as enrolled_courses,
    COUNT(DISTINCT CASE WHEN e.completed_at IS NOT NULL THEN e.course_id END) as completed_courses,
    AVG(e.progress_percentage) as avg_progress,
    COUNT(DISTINCT ae.session_id) as total_sessions,
    COUNT(ae.id) as total_events,
    MAX(ae.timestamp) as last_activity,
    CASE 
        WHEN MAX(ae.timestamp) >= NOW() - INTERVAL '1 day' THEN 'Very Active'
        WHEN MAX(ae.timestamp) >= NOW() - INTERVAL '7 days' THEN 'Active'
        WHEN MAX(ae.timestamp) >= NOW() - INTERVAL '30 days' THEN 'Inactive'
        ELSE 'Dormant'
    END as engagement_status
FROM education.users u
LEFT JOIN education.enrollments e ON u.id = e.student_id
LEFT JOIN education.analytics_events ae ON u.id = ae.user_id
WHERE u.role IN ('student', 'instructor')
GROUP BY u.id, u.email, u.role, u.created_at
ORDER BY last_activity DESC;

-- ============================================================================
-- ANALYTICS FUNCTIONS
-- ============================================================================

-- Function to calculate user engagement score
CREATE OR REPLACE FUNCTION education.calculate_engagement_score(p_user_id UUID, p_course_id UUID DEFAULT NULL)
RETURNS DECIMAL(4,2) AS $$
DECLARE
    v_engagement_score DECIMAL(4,2) := 0.0;
    v_activity_score DECIMAL(4,2) := 0.0;
    v_completion_score DECIMAL(4,2) := 0.0;
    v_consistency_score DECIMAL(4,2) := 0.0;
    v_interaction_score DECIMAL(4,2) := 0.0;
BEGIN
    -- Calculate activity score (0-2.5 points)
    SELECT 
        LEAST(2.5, COUNT(DISTINCT DATE(timestamp)) / 7.0 * 2.5)
    INTO v_activity_score
    FROM education.analytics_events
    WHERE user_id = p_user_id
    AND timestamp >= NOW() - INTERVAL '7 days'
    AND (p_course_id IS NULL OR course_id = p_course_id);
    
    -- Calculate completion score (0-2.5 points)
    SELECT 
        COALESCE(AVG(progress_percentage) / 100.0 * 2.5, 0.0)
    INTO v_completion_score
    FROM education.enrollments
    WHERE student_id = p_user_id
    AND (p_course_id IS NULL OR course_id = p_course_id);
    
    -- Calculate consistency score (0-2.5 points)
    SELECT 
        CASE 
            WHEN COUNT(DISTINCT DATE(timestamp)) >= 5 THEN 2.5
            WHEN COUNT(DISTINCT DATE(timestamp)) >= 3 THEN 1.5
            WHEN COUNT(DISTINCT DATE(timestamp)) >= 1 THEN 1.0
            ELSE 0.0
        END
    INTO v_consistency_score
    FROM education.analytics_events
    WHERE user_id = p_user_id
    AND timestamp >= NOW() - INTERVAL '7 days'
    AND (p_course_id IS NULL OR course_id = p_course_id);
    
    -- Calculate interaction score (0-2.5 points)
    SELECT 
        LEAST(2.5, COUNT(id) / 50.0 * 2.5)
    INTO v_interaction_score
    FROM education.analytics_events
    WHERE user_id = p_user_id
    AND timestamp >= NOW() - INTERVAL '7 days'
    AND event_category IN ('learning', 'assessment', 'social')
    AND (p_course_id IS NULL OR course_id = p_course_id);
    
    -- Calculate total engagement score
    v_engagement_score := v_activity_score + v_completion_score + v_consistency_score + v_interaction_score;
    
    RETURN ROUND(v_engagement_score, 2);
END;
$$ LANGUAGE plpgsql;

-- Function to update learning analytics
CREATE OR REPLACE FUNCTION education.update_learning_analytics()
RETURNS VOID AS $$
BEGIN
    -- Update or insert learning analytics for all active enrollments
    INSERT INTO education.learning_analytics (
        user_id, course_id, completion_rate, time_spent_minutes, 
        engagement_score, analytics_date, created_at, updated_at
    )
    SELECT 
        e.student_id,
        e.course_id,
        COALESCE(e.progress_percentage, 0.0),
        COALESCE(EXTRACT(EPOCH FROM (e.last_accessed_at - e.enrolled_at))/60, 0),
        education.calculate_engagement_score(e.student_id, e.course_id),
        CURRENT_DATE,
        NOW(),
        NOW()
    FROM education.enrollments e
    WHERE e.is_active = TRUE
    ON CONFLICT (user_id, course_id, analytics_date) 
    DO UPDATE SET
        completion_rate = EXCLUDED.completion_rate,
        time_spent_minutes = EXCLUDED.time_spent_minutes,
        engagement_score = EXCLUDED.engagement_score,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to generate daily business metrics
CREATE OR REPLACE FUNCTION education.generate_daily_business_metrics(p_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
DECLARE
    v_total_users INTEGER;
    v_active_users INTEGER;
    v_new_registrations INTEGER;
    v_course_enrollments INTEGER;
    v_course_completions INTEGER;
    v_total_sessions INTEGER;
    v_avg_session_duration DECIMAL(8,2);
BEGIN
    -- Calculate user metrics
    SELECT COUNT(*) INTO v_total_users FROM education.users WHERE created_at::DATE <= p_date;
    SELECT COUNT(DISTINCT user_id) INTO v_active_users FROM education.analytics_events WHERE timestamp::DATE = p_date;
    SELECT COUNT(*) INTO v_new_registrations FROM education.users WHERE created_at::DATE = p_date;
    
    -- Calculate course metrics
    SELECT COUNT(*) INTO v_course_enrollments FROM education.enrollments WHERE enrolled_at::DATE = p_date;
    SELECT COUNT(*) INTO v_course_completions FROM education.enrollments WHERE completed_at::DATE = p_date;
    
    -- Calculate session metrics
    SELECT 
        COUNT(DISTINCT session_id),
        AVG(EXTRACT(EPOCH FROM (MAX(timestamp) - MIN(timestamp)))/60)
    INTO v_total_sessions, v_avg_session_duration
    FROM education.analytics_events
    WHERE timestamp::DATE = p_date
    GROUP BY session_id;
    
    -- Insert or update business metrics
    INSERT INTO education.business_metrics (
        metric_date, metric_type, total_users, active_users, new_registrations,
        course_enrollments, course_completions, total_sessions, avg_session_duration_minutes,
        created_at, updated_at
    ) VALUES (
        p_date, 'daily', v_total_users, v_active_users, v_new_registrations,
        v_course_enrollments, v_course_completions, v_total_sessions, v_avg_session_duration,
        NOW(), NOW()
    ) ON CONFLICT (metric_date, metric_type) 
    DO UPDATE SET
        total_users = EXCLUDED.total_users,
        active_users = EXCLUDED.active_users,
        new_registrations = EXCLUDED.new_registrations,
        course_enrollments = EXCLUDED.course_enrollments,
        course_completions = EXCLUDED.course_completions,
        total_sessions = EXCLUDED.total_sessions,
        avg_session_duration_minutes = EXCLUDED.avg_session_duration_minutes,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;