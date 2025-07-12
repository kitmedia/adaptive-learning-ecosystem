-- Connection Pooling and Performance Configuration
-- Adaptive Learning Ecosystem - Database Optimization
-- EbroValley Digital - Production-Ready Database Configuration

-- ==============================================================================
-- CONNECTION POOLING CONFIGURATION
-- ==============================================================================

-- Optimize connection settings for high-traffic educational platform
-- These settings should be applied in postgresql.conf or via ALTER SYSTEM

-- Connection Settings
-- max_connections = 200          -- Allow up to 200 concurrent connections
-- superuser_reserved_connections = 3  -- Reserve connections for superuser access

-- Connection Pooling Settings (for pgbouncer integration)
-- pool_mode = transaction         -- Transaction-level pooling for better throughput
-- default_pool_size = 20          -- 20 connections per pool
-- max_client_conn = 500           -- Maximum client connections
-- reserve_pool_size = 5           -- Reserve connections for priority clients

-- ==============================================================================
-- MEMORY AND PERFORMANCE OPTIMIZATION
-- ==============================================================================

-- Memory Settings (adjust based on available RAM)
-- shared_buffers = 256MB          -- 25% of total RAM for small instances
-- work_mem = 4MB                  -- Memory for sort/hash operations per connection
-- maintenance_work_mem = 64MB     -- Memory for maintenance operations
-- effective_cache_size = 1GB      -- Estimate of OS cache size

-- Query Performance
-- random_page_cost = 1.1          -- SSD optimization (lower than default 4.0)
-- effective_io_concurrency = 200  -- Number of concurrent I/O operations

-- ==============================================================================
-- CONNECTION MONITORING AND MANAGEMENT
-- ==============================================================================

-- Create connection monitoring view
CREATE OR REPLACE VIEW education.connection_stats AS
SELECT 
    count(*) as total_connections,
    count(*) FILTER (WHERE state = 'active') as active_connections,
    count(*) FILTER (WHERE state = 'idle') as idle_connections,
    count(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction,
    count(*) FILTER (WHERE backend_type = 'client backend') as client_connections,
    count(*) FILTER (WHERE usename = 'adaptive_user') as app_connections,
    max(backend_start) as oldest_connection,
    avg(extract(epoch from (now() - backend_start))) as avg_connection_age_seconds
FROM pg_stat_activity;

-- Connection usage by database
CREATE OR REPLACE VIEW education.database_connections AS
SELECT 
    datname,
    count(*) as connections,
    count(*) FILTER (WHERE state = 'active') as active,
    count(*) FILTER (WHERE state = 'idle') as idle,
    max(backend_start) as oldest_connection
FROM pg_stat_activity 
WHERE datname IS NOT NULL
GROUP BY datname
ORDER BY connections DESC;

-- Long-running queries monitor
CREATE OR REPLACE VIEW education.long_running_queries AS
SELECT 
    pid,
    now() - pg_stat_activity.query_start AS duration,
    query,
    state,
    usename,
    datname,
    application_name,
    client_addr
FROM pg_stat_activity 
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes'
  AND state != 'idle'
ORDER BY duration DESC;

-- ==============================================================================
-- AUTOMATED CONNECTION MANAGEMENT
-- ==============================================================================

-- Function to kill idle connections older than specified time
CREATE OR REPLACE FUNCTION education.kill_idle_connections(max_age_minutes INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    killed_count INTEGER := 0;
    conn_record RECORD;
BEGIN
    FOR conn_record IN 
        SELECT pid, usename, state, backend_start
        FROM pg_stat_activity 
        WHERE state = 'idle'
          AND backend_type = 'client backend'
          AND now() - backend_start > (max_age_minutes || ' minutes')::interval
          AND usename != 'postgres'  -- Don't kill superuser connections
    LOOP
        BEGIN
            PERFORM pg_terminate_backend(conn_record.pid);
            killed_count := killed_count + 1;
            RAISE NOTICE 'Killed idle connection PID % (user: %, idle since: %)', 
                conn_record.pid, conn_record.usename, conn_record.backend_start;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE WARNING 'Failed to kill connection PID %: %', conn_record.pid, SQLERRM;
        END;
    END LOOP;
    
    RETURN killed_count;
END;
$$ LANGUAGE plpgsql;

-- Function to monitor connection pool health
CREATE OR REPLACE FUNCTION education.connection_pool_health()
RETURNS TABLE(
    metric_name TEXT,
    current_value NUMERIC,
    threshold_value NUMERIC,
    status TEXT,
    recommendation TEXT
) AS $$
DECLARE
    total_conns INTEGER;
    active_conns INTEGER;
    idle_conns INTEGER;
    max_conns INTEGER;
BEGIN
    -- Get current connection stats
    SELECT INTO total_conns, active_conns, idle_conns
        count(*),
        count(*) FILTER (WHERE state = 'active'),
        count(*) FILTER (WHERE state = 'idle')
    FROM pg_stat_activity;
    
    -- Get max connections setting
    SELECT INTO max_conns setting::INTEGER FROM pg_settings WHERE name = 'max_connections';
    
    -- Total connections check
    RETURN QUERY SELECT 
        'total_connections'::TEXT,
        total_conns::NUMERIC,
        (max_conns * 0.8)::NUMERIC,
        CASE WHEN total_conns > max_conns * 0.8 THEN 'WARNING' ELSE 'OK' END,
        CASE WHEN total_conns > max_conns * 0.8 
             THEN 'Consider increasing max_connections or implementing connection pooling'
             ELSE 'Connection usage is within normal limits' END;
    
    -- Active connections check
    RETURN QUERY SELECT 
        'active_connections'::TEXT,
        active_conns::NUMERIC,
        (max_conns * 0.5)::NUMERIC,
        CASE WHEN active_conns > max_conns * 0.5 THEN 'WARNING' ELSE 'OK' END,
        CASE WHEN active_conns > max_conns * 0.5 
             THEN 'High active connection count - monitor for bottlenecks'
             ELSE 'Active connection count is normal' END;
    
    -- Idle connections check
    RETURN QUERY SELECT 
        'idle_connections'::TEXT,
        idle_conns::NUMERIC,
        50::NUMERIC,
        CASE WHEN idle_conns > 50 THEN 'WARNING' ELSE 'OK' END,
        CASE WHEN idle_conns > 50 
             THEN 'Too many idle connections - consider shorter connection timeouts'
             ELSE 'Idle connection count is acceptable' END;
             
    -- Connection utilization percentage
    RETURN QUERY SELECT 
        'connection_utilization_pct'::TEXT,
        ROUND((total_conns::NUMERIC / max_conns::NUMERIC) * 100, 2),
        80::NUMERIC,
        CASE WHEN (total_conns::NUMERIC / max_conns::NUMERIC) * 100 > 80 THEN 'WARNING' ELSE 'OK' END,
        CASE WHEN (total_conns::NUMERIC / max_conns::NUMERIC) * 100 > 80 
             THEN 'Connection pool utilization is high'
             ELSE 'Connection pool utilization is healthy' END;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- QUERY PERFORMANCE OPTIMIZATION
-- ==============================================================================

-- Function to identify slow queries
CREATE OR REPLACE FUNCTION education.identify_slow_queries(min_duration_seconds INTEGER DEFAULT 5)
RETURNS TABLE(
    query_hash TEXT,
    avg_duration_ms NUMERIC,
    total_calls BIGINT,
    total_time_ms NUMERIC,
    query_text TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        encode(digest(query, 'sha256'), 'hex') as query_hash,
        ROUND(mean_exec_time::NUMERIC, 2) as avg_duration_ms,
        calls as total_calls,
        ROUND(total_exec_time::NUMERIC, 2) as total_time_ms,
        query as query_text
    FROM pg_stat_statements 
    WHERE mean_exec_time > (min_duration_seconds * 1000)
    ORDER BY mean_exec_time DESC
    LIMIT 20;
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'pg_stat_statements extension not installed. Please install with: CREATE EXTENSION pg_stat_statements;';
        RETURN;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- CACHE OPTIMIZATION
-- ==============================================================================

-- Buffer cache hit ratio monitoring
CREATE OR REPLACE VIEW education.cache_hit_ratio AS
SELECT 
    'buffer_cache' as cache_type,
    ROUND(
        (sum(heap_blks_hit) / NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0)) * 100, 
        2
    ) as hit_ratio_percentage,
    sum(heap_blks_hit) as cache_hits,
    sum(heap_blks_read) as disk_reads
FROM pg_statio_user_tables
UNION ALL
SELECT 
    'index_cache' as cache_type,
    ROUND(
        (sum(idx_blks_hit) / NULLIF(sum(idx_blks_hit) + sum(idx_blks_read), 0)) * 100, 
        2
    ) as hit_ratio_percentage,
    sum(idx_blks_hit) as cache_hits,
    sum(idx_blks_read) as disk_reads
FROM pg_statio_user_indexes;

-- ==============================================================================
-- MAINTENANCE PROCEDURES
-- ==============================================================================

-- Daily maintenance procedure
CREATE OR REPLACE FUNCTION education.daily_maintenance()
RETURNS TEXT AS $$
DECLARE
    result_text TEXT := '';
    killed_connections INTEGER;
BEGIN
    -- Kill old idle connections
    SELECT education.kill_idle_connections(30) INTO killed_connections;
    result_text := result_text || 'Killed ' || killed_connections || ' idle connections. ';
    
    -- Update table statistics for query planner
    PERFORM education.update_table_statistics();
    result_text := result_text || 'Updated table statistics. ';
    
    -- Log maintenance completion
    INSERT INTO education.notifications (user_id, title, message, notification_type, delivery_method)
    SELECT 
        id,
        'Database Maintenance Completed',
        'Daily maintenance tasks completed: ' || result_text,
        'system',
        'in_app'
    FROM education.users 
    WHERE role = 'admin' 
    LIMIT 1;
    
    RETURN result_text;
END;
$$ LANGUAGE plpgsql;

-- Weekly maintenance procedure
CREATE OR REPLACE FUNCTION education.weekly_maintenance()
RETURNS TEXT AS $$
DECLARE
    result_text TEXT := '';
BEGIN
    -- Rebuild indexes (use during low-traffic periods)
    PERFORM education.rebuild_indexes();
    result_text := result_text || 'Rebuilt database indexes. ';
    
    -- Vacuum analyze all tables
    VACUUM ANALYZE;
    result_text := result_text || 'Completed VACUUM ANALYZE. ';
    
    RETURN result_text;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- PERFORMANCE MONITORING ALERTS
-- ==============================================================================

-- Function to check database health and send alerts
CREATE OR REPLACE FUNCTION education.check_database_health()
RETURNS TEXT AS $$
DECLARE
    health_record RECORD;
    alert_message TEXT := '';
    needs_alert BOOLEAN := FALSE;
BEGIN
    -- Check connection pool health
    FOR health_record IN SELECT * FROM education.connection_pool_health() LOOP
        IF health_record.status = 'WARNING' THEN
            needs_alert := TRUE;
            alert_message := alert_message || health_record.metric_name || ': ' || health_record.recommendation || E'\n';
        END IF;
    END LOOP;
    
    -- Check cache hit ratio
    FOR health_record IN 
        SELECT cache_type, hit_ratio_percentage 
        FROM education.cache_hit_ratio 
        WHERE hit_ratio_percentage < 90 
    LOOP
        needs_alert := TRUE;
        alert_message := alert_message || 'Low ' || health_record.cache_type || ' hit ratio: ' || health_record.hit_ratio_percentage || '%' || E'\n';
    END LOOP;
    
    -- Send alert if needed
    IF needs_alert THEN
        INSERT INTO education.notifications (user_id, title, message, notification_type, delivery_method)
        SELECT 
            id,
            'Database Performance Alert',
            'Database performance issues detected:' || E'\n' || alert_message,
            'system',
            'email'
        FROM education.users 
        WHERE role = 'admin';
        
        RETURN 'ALERT: ' || alert_message;
    ELSE
        RETURN 'OK: Database health is good';
    END IF;
END;
$$ LANGUAGE plpgsql;

COMMIT;