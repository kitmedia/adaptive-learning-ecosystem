#!/bin/bash

# Apply Database Optimizations - Adaptive Learning Ecosystem
# EbroValley Digital - Safe deployment of database performance enhancements

set -e

echo "🚀 Applying Database Optimizations..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-adaptive_learning}
DB_USER=${DB_USER:-adaptive_user}
DB_PASSWORD=${DB_PASSWORD:-adaptive_secure_password_2024}

# Function to check database connection
check_db_connection() {
    echo -e "${BLUE}Checking database connection...${NC}"
    
    if PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1;" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Database connection successful${NC}"
        return 0
    else
        echo -e "${RED}❌ Cannot connect to database${NC}"
        echo "Connection details:"
        echo "  Host: $DB_HOST"
        echo "  Port: $DB_PORT"
        echo "  Database: $DB_NAME"
        echo "  User: $DB_USER"
        return 1
    fi
}

# Function to check database health before optimization
check_database_health() {
    echo -e "${BLUE}Checking database health...${NC}"
    
    # Check active connections
    ACTIVE_CONNECTIONS=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';" 2>/dev/null || echo "0")
    echo -e "${YELLOW}  Active connections: $ACTIVE_CONNECTIONS${NC}"
    
    # Check database size
    DB_SIZE=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT pg_size_pretty(pg_database_size('$DB_NAME'));" 2>/dev/null || echo "Unknown")
    echo -e "${YELLOW}  Database size: $DB_SIZE${NC}"
    
    # Check if we're in a low-activity period
    if [ "$ACTIVE_CONNECTIONS" -gt 10 ]; then
        echo -e "${YELLOW}⚠️  High activity detected ($ACTIVE_CONNECTIONS active connections)${NC}"
        echo -e "${YELLOW}⚠️  Consider running during off-peak hours for better performance${NC}"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${RED}Optimization cancelled by user${NC}"
            exit 1
        fi
    fi
}

# Function to backup current indexes
backup_current_state() {
    echo -e "${BLUE}Creating backup of current database state...${NC}"
    
    BACKUP_DIR="./database/backups"
    mkdir -p $BACKUP_DIR
    
    BACKUP_FILE="$BACKUP_DIR/pre_optimization_backup_$(date +%Y%m%d_%H%M%S).sql"
    
    PGPASSWORD=$DB_PASSWORD pg_dump \
        -h $DB_HOST -p $DB_PORT -U $DB_USER \
        --schema=education \
        --schema-only \
        --no-owner \
        --no-privileges \
        $DB_NAME > $BACKUP_FILE
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Backup created: $BACKUP_FILE${NC}"
    else
        echo -e "${RED}❌ Backup failed${NC}"
        exit 1
    fi
}

# Function to apply performance indexes
apply_performance_indexes() {
    echo -e "${BLUE}Applying performance indexes...${NC}"
    
    MIGRATION_FILE="./database/migrations/001-create-performance-indexes.sql"
    
    if [ ! -f "$MIGRATION_FILE" ]; then
        echo -e "${RED}❌ Migration file not found: $MIGRATION_FILE${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}  Executing migration 001-create-performance-indexes.sql...${NC}"
    
    # Apply migration with timeout protection
    timeout 1800 PGPASSWORD=$DB_PASSWORD psql \
        -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME \
        -f $MIGRATION_FILE \
        -v ON_ERROR_STOP=1
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Performance indexes applied successfully${NC}"
    else
        echo -e "${RED}❌ Failed to apply performance indexes${NC}"
        echo -e "${YELLOW}Check the migration logs for details${NC}"
        exit 1
    fi
}

# Function to apply connection pooling configuration
apply_connection_pooling() {
    echo -e "${BLUE}Applying connection pooling configuration...${NC}"
    
    POOLING_FILE="./database/connection-pooling.sql"
    
    if [ ! -f "$POOLING_FILE" ]; then
        echo -e "${RED}❌ Connection pooling file not found: $POOLING_FILE${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}  Creating monitoring views and functions...${NC}"
    
    PGPASSWORD=$DB_PASSWORD psql \
        -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME \
        -f $POOLING_FILE \
        -v ON_ERROR_STOP=1
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Connection pooling configuration applied${NC}"
    else
        echo -e "${RED}❌ Failed to apply connection pooling configuration${NC}"
        exit 1
    fi
}

# Function to verify optimization results
verify_optimizations() {
    echo -e "${BLUE}Verifying optimization results...${NC}"
    
    # Check index creation
    INDEX_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'education' AND indexname LIKE 'idx_%';" 2>/dev/null || echo "0")
    echo -e "${YELLOW}  Performance indexes created: $INDEX_COUNT${NC}"
    
    # Check monitoring views
    VIEWS_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.views WHERE table_schema = 'education' AND table_name LIKE '%_stats';" 2>/dev/null || echo "0")
    echo -e "${YELLOW}  Monitoring views created: $VIEWS_COUNT${NC}"
    
    # Check functions
    FUNCTIONS_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'education' AND routine_name LIKE '%_maintenance%' OR routine_name LIKE '%connection%';" 2>/dev/null || echo "0")
    echo -e "${YELLOW}  Maintenance functions created: $FUNCTIONS_COUNT${NC}"
    
    if [ "$INDEX_COUNT" -gt 30 ] && [ "$VIEWS_COUNT" -gt 2 ] && [ "$FUNCTIONS_COUNT" -gt 3 ]; then
        echo -e "${GREEN}✅ All optimizations verified successfully${NC}"
    else
        echo -e "${YELLOW}⚠️  Some optimizations may not have been applied correctly${NC}"
        echo -e "${YELLOW}⚠️  Check the database manually for any issues${NC}"
    fi
}

# Function to run performance test
run_performance_test() {
    echo -e "${BLUE}Running performance validation...${NC}"
    
    # Test query performance on key tables
    echo -e "${YELLOW}  Testing query performance...${NC}"
    
    # Test user lookup by email (should use hash index)
    EMAIL_QUERY_TIME=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "EXPLAIN (ANALYZE, BUFFERS) SELECT id FROM education.users WHERE email = 'admin@ebrovalley.edu';" 2>/dev/null | grep "Execution Time" | awk '{print $3}' || echo "N/A")
    echo -e "${YELLOW}    Email lookup time: ${EMAIL_QUERY_TIME}ms${NC}"
    
    # Test course catalog query (should use composite index)
    CATALOG_QUERY_TIME=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "EXPLAIN (ANALYZE, BUFFERS) SELECT id, title FROM education.courses WHERE is_published = true AND category = 'Technology' LIMIT 10;" 2>/dev/null | grep "Execution Time" | awk '{print $3}' || echo "N/A")
    echo -e "${YELLOW}    Course catalog query time: ${CATALOG_QUERY_TIME}ms${NC}"
    
    # Test enrollment lookup (should use partial index)
    ENROLLMENT_QUERY_TIME=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM education.enrollments WHERE student_id = '550e8400-e29b-41d4-a716-446655440003' AND is_active = true;" 2>/dev/null | grep "Execution Time" | awk '{print $3}' || echo "N/A")
    echo -e "${YELLOW}    Enrollment lookup time: ${ENROLLMENT_QUERY_TIME}ms${NC}"
    
    echo -e "${GREEN}✅ Performance validation completed${NC}"
}

# Function to generate optimization report
generate_report() {
    echo -e "${BLUE}Generating optimization report...${NC}"
    
    REPORT_FILE="./database/optimization_report_$(date +%Y%m%d_%H%M%S).txt"
    
    cat > $REPORT_FILE << EOF
===================================================================
ADAPTIVE LEARNING ECOSYSTEM - DATABASE OPTIMIZATION REPORT
===================================================================
Generated: $(date)
Database: $DB_NAME
Host: $DB_HOST:$DB_PORT

OPTIMIZATION SUMMARY:
- Performance indexes: Applied successfully
- Connection pooling: Configured
- Monitoring views: Created
- Maintenance functions: Implemented

INDEX STATISTICS:
$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT tablename, indexname, idx_scan, idx_tup_read FROM pg_stat_user_indexes WHERE schemaname = 'education' ORDER BY idx_scan DESC LIMIT 10;" 2>/dev/null || echo "Unable to fetch index statistics")

CONNECTION HEALTH:
$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT * FROM education.connection_stats;" 2>/dev/null || echo "Unable to fetch connection statistics")

RECOMMENDATIONS:
1. Monitor index usage weekly using education.index_usage_stats view
2. Run daily maintenance using education.daily_maintenance() function
3. Schedule weekly index rebuilds during low-traffic periods
4. Monitor connection pool health using education.connection_pool_health()

NEXT STEPS:
- Configure pgbouncer for production connection pooling
- Set up automated monitoring alerts
- Schedule regular performance reviews
- Consider partitioning for large tables (>1M rows)

===================================================================
EOF

    echo -e "${GREEN}✅ Report generated: $REPORT_FILE${NC}"
}

# Main execution
main() {
    echo -e "${YELLOW}🎯 Starting Database Optimization Process${NC}"
    echo ""
    
    # Pre-flight checks
    check_db_connection || exit 1
    echo ""
    
    check_database_health
    echo ""
    
    # Backup current state
    backup_current_state
    echo ""
    
    # Apply optimizations
    apply_performance_indexes
    echo ""
    
    apply_connection_pooling
    echo ""
    
    # Verification
    verify_optimizations
    echo ""
    
    run_performance_test
    echo ""
    
    generate_report
    echo ""
    
    echo -e "${GREEN}🎉 Database optimization completed successfully!${NC}"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo -e "1. 📊 Monitor performance using: SELECT * FROM education.index_usage_stats;"
    echo -e "2. 🔧 Run daily maintenance: SELECT education.daily_maintenance();"
    echo -e "3. 📈 Check connection health: SELECT * FROM education.connection_pool_health();"
    echo -e "4. 🚀 Continue with Action 4: CI/CD Configuration"
}

# Handle script interruption
trap 'echo -e "\n${RED}Script interrupted. Database may be in intermediate state.${NC}"; exit 1' INT TERM

# Run main function
main