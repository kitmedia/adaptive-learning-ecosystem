#!/bin/bash

# Monitor Database Performance - Adaptive Learning Ecosystem
# EbroValley Digital - Real-time database performance monitoring

set -e

echo "📊 Database Performance Monitor - Adaptive Learning Ecosystem"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-adaptive_learning}
DB_USER=${DB_USER:-adaptive_user}
DB_PASSWORD=${DB_PASSWORD:-adaptive_secure_password_2024}
REFRESH_INTERVAL=${REFRESH_INTERVAL:-5}

# Function to clear screen and show header
show_header() {
    clear
    echo -e "${CYAN}================================================================${NC}"
    echo -e "${CYAN}🎯 ADAPTIVE LEARNING ECOSYSTEM - DATABASE PERFORMANCE MONITOR${NC}"
    echo -e "${CYAN}================================================================${NC}"
    echo -e "${BLUE}Database: $DB_NAME | Host: $DB_HOST:$DB_PORT | Refresh: ${REFRESH_INTERVAL}s${NC}"
    echo -e "${CYAN}================================================================${NC}"
    echo ""
}

# Function to check database connection
check_connection() {
    if ! PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1;" > /dev/null 2>&1; then
        echo -e "${RED}❌ Cannot connect to database${NC}"
        echo "Connection details:"
        echo "  Host: $DB_HOST"
        echo "  Port: $DB_PORT"
        echo "  Database: $DB_NAME"
        echo "  User: $DB_USER"
        exit 1
    fi
}

# Function to get connection statistics
show_connection_stats() {
    echo -e "${YELLOW}🔗 CONNECTION STATISTICS${NC}"
    echo "----------------------------------------"
    
    CONN_STATS=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "
        SELECT 
            total_connections,
            active_connections,
            idle_connections,
            idle_in_transaction,
            client_connections,
            app_connections,
            ROUND(avg_connection_age_seconds::numeric, 2) as avg_age_seconds
        FROM education.connection_stats;
    " 2>/dev/null)
    
    if [ $? -eq 0 ] && [ -n "$CONN_STATS" ]; then
        echo "$CONN_STATS" | while IFS='|' read -r total active idle idle_tx client app avg_age; do
            echo -e "  Total Connections: ${GREEN}$(echo $total | xargs)${NC}"
            echo -e "  Active: ${GREEN}$(echo $active | xargs)${NC} | Idle: ${YELLOW}$(echo $idle | xargs)${NC} | Idle in TX: ${RED}$(echo $idle_tx | xargs)${NC}"
            echo -e "  Client Connections: ${BLUE}$(echo $client | xargs)${NC}"
            echo -e "  App Connections: ${BLUE}$(echo $app | xargs)${NC}"
            echo -e "  Avg Connection Age: ${CYAN}$(echo $avg_age | xargs)s${NC}"
        done
    else
        echo -e "  ${RED}Unable to fetch connection statistics${NC}"
    fi
    echo ""
}

# Function to show database health
show_database_health() {
    echo -e "${YELLOW}💚 DATABASE HEALTH CHECK${NC}"
    echo "----------------------------------------"
    
    HEALTH_CHECK=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "
        SELECT 
            metric_name,
            current_value,
            threshold_value,
            status,
            recommendation
        FROM education.connection_pool_health()
        ORDER BY CASE WHEN status = 'WARNING' THEN 1 ELSE 2 END;
    " 2>/dev/null)
    
    if [ $? -eq 0 ] && [ -n "$HEALTH_CHECK" ]; then
        echo "$HEALTH_CHECK" | while IFS='|' read -r metric current threshold status recommendation; do
            metric=$(echo $metric | xargs)
            current=$(echo $current | xargs)
            threshold=$(echo $threshold | xargs)
            status=$(echo $status | xargs)
            recommendation=$(echo $recommendation | xargs)
            
            if [ "$status" = "WARNING" ]; then
                echo -e "  🔴 $metric: ${RED}$current${NC} (threshold: $threshold)"
                echo -e "      └─ $recommendation"
            else
                echo -e "  🟢 $metric: ${GREEN}$current${NC} (threshold: $threshold)"
            fi
        done
    else
        echo -e "  ${RED}Unable to fetch health statistics${NC}"
    fi
    echo ""
}

# Function to show cache performance
show_cache_performance() {
    echo -e "${YELLOW}🚀 CACHE PERFORMANCE${NC}"
    echo "----------------------------------------"
    
    CACHE_STATS=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "
        SELECT 
            cache_type,
            hit_ratio_percentage,
            cache_hits,
            disk_reads
        FROM education.cache_hit_ratio
        ORDER BY cache_type;
    " 2>/dev/null)
    
    if [ $? -eq 0 ] && [ -n "$CACHE_STATS" ]; then
        echo "$CACHE_STATS" | while IFS='|' read -r cache_type hit_ratio hits reads; do
            cache_type=$(echo $cache_type | xargs)
            hit_ratio=$(echo $hit_ratio | xargs)
            hits=$(echo $hits | xargs)
            reads=$(echo $reads | xargs)
            
            if (( $(echo "$hit_ratio >= 95" | bc -l) )); then
                color=$GREEN
                status="🟢"
            elif (( $(echo "$hit_ratio >= 85" | bc -l) )); then
                color=$YELLOW
                status="🟡"
            else
                color=$RED
                status="🔴"
            fi
            
            echo -e "  $status $cache_type: ${color}${hit_ratio}%${NC} (hits: $hits, reads: $reads)"
        done
    else
        echo -e "  ${RED}Unable to fetch cache statistics${NC}"
    fi
    echo ""
}

# Function to show index usage
show_index_usage() {
    echo -e "${YELLOW}📈 TOP INDEX USAGE${NC}"
    echo "----------------------------------------"
    
    INDEX_STATS=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "
        SELECT 
            tablename,
            indexname,
            idx_scan,
            usage_level
        FROM education.index_usage_stats
        WHERE idx_scan > 0
        ORDER BY idx_scan DESC
        LIMIT 10;
    " 2>/dev/null)
    
    if [ $? -eq 0 ] && [ -n "$INDEX_STATS" ]; then
        printf "  %-20s %-25s %-10s %s\n" "TABLE" "INDEX" "SCANS" "USAGE"
        echo "  ----------------------------------------------------------------"
        echo "$INDEX_STATS" | while IFS='|' read -r table index scans usage; do
            table=$(echo $table | xargs | cut -c1-18)
            index=$(echo $index | xargs | cut -c1-23)
            scans=$(echo $scans | xargs)
            usage=$(echo $usage | xargs)
            
            case $usage in
                "HIGH_USAGE") color=$GREEN ;;
                "MEDIUM_USAGE") color=$YELLOW ;;
                "LOW_USAGE") color=$MAGENTA ;;
                *) color=$NC ;;
            esac
            
            printf "  %-20s %-25s ${color}%-10s %s${NC}\n" "$table" "$index" "$scans" "$usage"
        done
    else
        echo -e "  ${RED}Unable to fetch index statistics${NC}"
    fi
    echo ""
}

# Function to show slow queries
show_slow_queries() {
    echo -e "${YELLOW}🐌 SLOW QUERIES (>5s avg)${NC}"
    echo "----------------------------------------"
    
    SLOW_QUERIES=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "
        SELECT 
            avg_duration_ms,
            total_calls,
            LEFT(query_text, 80) as query_preview
        FROM education.identify_slow_queries(5)
        ORDER BY avg_duration_ms DESC
        LIMIT 5;
    " 2>/dev/null)
    
    if [ $? -eq 0 ] && [ -n "$SLOW_QUERIES" ]; then
        echo "$SLOW_QUERIES" | while IFS='|' read -r duration calls query; do
            duration=$(echo $duration | xargs)
            calls=$(echo $calls | xargs)
            query=$(echo $query | xargs)
            
            echo -e "  🔴 ${RED}${duration}ms${NC} (${calls} calls) - ${query}..."
        done
    else
        echo -e "  ${GREEN}✅ No slow queries detected or pg_stat_statements not available${NC}"
    fi
    echo ""
}

# Function to show long running queries
show_long_running_queries() {
    echo -e "${YELLOW}⏱️  LONG RUNNING QUERIES (>5min)${NC}"
    echo "----------------------------------------"
    
    LONG_QUERIES=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "
        SELECT 
            EXTRACT(EPOCH FROM duration)::INTEGER as duration_seconds,
            usename,
            LEFT(query, 60) as query_preview,
            state
        FROM education.long_running_queries
        LIMIT 5;
    " 2>/dev/null)
    
    if [ $? -eq 0 ] && [ -n "$LONG_QUERIES" ]; then
        echo "$LONG_QUERIES" | while IFS='|' read -r duration user query state; do
            duration=$(echo $duration | xargs)
            user=$(echo $user | xargs)
            query=$(echo $query | xargs)
            state=$(echo $state | xargs)
            
            minutes=$((duration / 60))
            seconds=$((duration % 60))
            
            echo -e "  🔴 ${RED}${minutes}m ${seconds}s${NC} - User: $user - State: $state"
            echo -e "      └─ ${query}..."
        done
    else
        echo -e "  ${GREEN}✅ No long running queries detected${NC}"
    fi
    echo ""
}

# Function to show table sizes
show_table_sizes() {
    echo -e "${YELLOW}💾 TABLE SIZES${NC}"
    echo "----------------------------------------"
    
    TABLE_SIZES=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "
        SELECT 
            tablename,
            pg_size_pretty(pg_total_relation_size('education.'||tablename)) as total_size,
            pg_size_pretty(pg_relation_size('education.'||tablename)) as table_size,
            n_tup_ins + n_tup_upd + n_tup_del as total_operations
        FROM pg_tables t
        JOIN pg_stat_user_tables s ON t.tablename = s.relname
        WHERE t.schemaname = 'education'
        ORDER BY pg_total_relation_size('education.'||tablename) DESC
        LIMIT 8;
    " 2>/dev/null)
    
    if [ $? -eq 0 ] && [ -n "$TABLE_SIZES" ]; then
        printf "  %-20s %-12s %-12s %s\n" "TABLE" "TOTAL SIZE" "TABLE SIZE" "OPERATIONS"
        echo "  ----------------------------------------------------------------"
        echo "$TABLE_SIZES" | while IFS='|' read -r table total_size table_size operations; do
            table=$(echo $table | xargs | cut -c1-18)
            total_size=$(echo $total_size | xargs)
            table_size=$(echo $table_size | xargs)
            operations=$(echo $operations | xargs)
            
            printf "  %-20s %-12s %-12s %s\n" "$table" "$total_size" "$table_size" "$operations"
        done
    else
        echo -e "  ${RED}Unable to fetch table sizes${NC}"
    fi
    echo ""
}

# Function to show maintenance recommendations
show_maintenance_recommendations() {
    echo -e "${YELLOW}🔧 MAINTENANCE RECOMMENDATIONS${NC}"
    echo "----------------------------------------"
    
    # Check for unused indexes
    UNUSED_INDEXES=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "
        SELECT COUNT(*) FROM education.index_usage_stats WHERE usage_level = 'UNUSED';
    " 2>/dev/null || echo "0")
    
    # Check last analyze time
    LAST_ANALYZE=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "
        SELECT MAX(last_analyze) FROM pg_stat_user_tables WHERE schemaname = 'education';
    " 2>/dev/null || echo "Unknown")
    
    if [ "$UNUSED_INDEXES" -gt 0 ]; then
        echo -e "  🔴 Found $UNUSED_INDEXES unused indexes - consider dropping them"
    else
        echo -e "  🟢 All indexes are being used"
    fi
    
    echo -e "  📊 Last table analysis: $(echo $LAST_ANALYZE | xargs)"
    
    # Connection pool recommendations
    TOTAL_CONN=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "
        SELECT total_connections FROM education.connection_stats;
    " 2>/dev/null || echo "0")
    
    if [ "$TOTAL_CONN" -gt 150 ]; then
        echo -e "  🔴 High connection count ($TOTAL_CONN) - consider connection pooling"
    elif [ "$TOTAL_CONN" -gt 100 ]; then
        echo -e "  🟡 Moderate connection count ($TOTAL_CONN) - monitor closely"
    else
        echo -e "  🟢 Connection count is healthy ($TOTAL_CONN)"
    fi
    
    echo ""
}

# Function to show real-time updates
monitor_realtime() {
    while true; do
        show_header
        show_connection_stats
        show_database_health
        show_cache_performance
        show_index_usage
        show_slow_queries
        show_long_running_queries
        show_table_sizes
        show_maintenance_recommendations
        
        echo -e "${CYAN}================================================================${NC}"
        echo -e "${BLUE}Press Ctrl+C to exit | Refreshing every ${REFRESH_INTERVAL} seconds...${NC}"
        echo -e "${CYAN}================================================================${NC}"
        
        sleep $REFRESH_INTERVAL
    done
}

# Function to show one-time report
show_report() {
    show_header
    show_connection_stats
    show_database_health
    show_cache_performance
    show_index_usage
    show_slow_queries
    show_long_running_queries
    show_table_sizes
    show_maintenance_recommendations
}

# Main execution
main() {
    check_connection
    
    case "${1:-monitor}" in
        "monitor"|"-m"|"--monitor")
            echo -e "${GREEN}Starting real-time monitoring...${NC}"
            echo -e "${YELLOW}Press Ctrl+C to exit${NC}"
            sleep 2
            monitor_realtime
            ;;
        "report"|"-r"|"--report")
            show_report
            ;;
        "help"|"-h"|"--help")
            echo "Usage: $0 [monitor|report|help]"
            echo ""
            echo "Commands:"
            echo "  monitor (default) - Real-time monitoring with auto-refresh"
            echo "  report           - One-time performance report"
            echo "  help             - Show this help message"
            echo ""
            echo "Environment variables:"
            echo "  DB_HOST          - Database host (default: localhost)"
            echo "  DB_PORT          - Database port (default: 5432)"
            echo "  DB_NAME          - Database name (default: adaptive_learning)"
            echo "  DB_USER          - Database user (default: adaptive_user)"
            echo "  DB_PASSWORD      - Database password"
            echo "  REFRESH_INTERVAL - Refresh interval in seconds (default: 5)"
            ;;
        *)
            echo -e "${RED}Unknown command: $1${NC}"
            echo "Use '$0 help' for usage information"
            exit 1
            ;;
    esac
}

# Handle script interruption gracefully
trap 'echo -e "\n${YELLOW}Monitoring stopped by user${NC}"; exit 0' INT TERM

# Run main function
main "$@"