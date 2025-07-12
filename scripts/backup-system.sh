#!/bin/bash

# 💾 Adaptive Learning Ecosystem - Automated Backup System
# EbroValley Digital - Enterprise-Grade Backup Solution
# Version: 1.0.0

set -euo pipefail

# ========================================
# CONFIGURATION
# ========================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Backup configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_BASE_DIR="${BACKUP_BASE_DIR:-${PROJECT_ROOT}/backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="adaptive-learning-backup-${TIMESTAMP}"
BACKUP_DIR="${BACKUP_BASE_DIR}/${BACKUP_NAME}"
LOG_FILE="${BACKUP_DIR}/backup.log"
RETENTION_DAYS=${RETENTION_DAYS:-30}
MAX_BACKUPS=${MAX_BACKUPS:-10}

# SQLite Database Configuration
SQLITE_DB_PATH="${PROJECT_ROOT}/database/adaptive_learning.db"
REDIS_DATA_DIR="${PROJECT_ROOT}/redis-data"
REDIS_CONFIG="${PROJECT_ROOT}/redis.conf"

# Service directories
SERVICES_DIR="${PROJECT_ROOT}/services"
API_GATEWAY_DIR="${PROJECT_ROOT}/api-gateway"
FRONTEND_DIR="${PROJECT_ROOT}/frontend"
DATABASE_SCHEMAS_DIR="${PROJECT_ROOT}/database"

# Configuration files directory
CONFIG_FILE="${PROJECT_ROOT}/.backup-config"

# Default values for configuration
DEFAULT_RETENTION_DAYS=30
DEFAULT_MAX_BACKUPS=10
DEFAULT_COMPRESSION="gzip"
DEFAULT_BACKUP_TYPE="incremental"

# Components to backup
declare -A BACKUP_COMPONENTS=(
    ["database"]="SQLite database files and schemas"
    ["redis"]="Redis data snapshots and configurations"
    ["services"]="Microservices code and configurations"
    ["api-gateway"]="API Gateway configuration and code"
    ["frontend"]="React frontend application"
    ["uploads"]="User uploaded content and media"
    ["logs"]="Application and system logs"
    ["config"]="Environment and system configurations"
    ["monitoring"]="Prometheus and Grafana configurations"
    ["scripts"]="Backup and automation scripts"
)

# Services to backup individually
SERVICES=("ai-tutor" "analytics" "assessment" "collaboration" "content-management" "content-intelligence" "notifications" "progress-tracking")

# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    # Only use tee if LOG_FILE directory exists
    if [[ -n "$LOG_FILE" ]] && [[ -d "$(dirname "$LOG_FILE")" ]]; then
        echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
    else
        echo "[$timestamp] [$level] $message"
    fi
}

log_info() { log "INFO" "$@"; }
log_warn() { log "WARN" "$@"; }
log_error() { log "ERROR" "$@"; }
log_success() { log "SUCCESS" "$@"; }

ensure_dir() {
    local dir="$1"
    if [[ ! -d "$dir" ]]; then
        mkdir -p "$dir"
        log_info "Created directory: $dir"
    fi
}

get_timestamp() {
    date '+%Y%m%d_%H%M%S'
}

get_size() {
    local path="$1"
    if [[ -f "$path" ]]; then
        stat -f%z "$path" 2>/dev/null || stat -c%s "$path" 2>/dev/null || echo "0"
    elif [[ -d "$path" ]]; then
        du -sb "$path" 2>/dev/null | cut -f1 || echo "0"
    else
        echo "0"
    fi
}

format_size() {
    local bytes="$1"
    if (( bytes >= 1073741824 )); then
        echo "$(( bytes / 1073741824 ))GB"
    elif (( bytes >= 1048576 )); then
        echo "$(( bytes / 1048576 ))MB"
    elif (( bytes >= 1024 )); then
        echo "$(( bytes / 1024 ))KB"
    else
        echo "${bytes}B"
    fi
}

check_dependencies() {
    local deps=("tar" "gzip" "gpg")
    local optional_deps=("sqlite3" "redis-cli")
    local missing=()
    local missing_optional=()
    
    # Check required dependencies
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            missing+=("$dep")
        fi
    done
    
    # Check optional dependencies  
    for dep in "${optional_deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            missing_optional+=("$dep")
        fi
    done
    
    if [[ ${#missing[@]} -gt 0 ]]; then
        log_error "Missing required dependencies: ${missing[*]}"
        log_error "Please install missing dependencies and try again"
        log_info "Install commands:"
        log_info "  Ubuntu/Debian: sudo apt install tar gzip gnupg"
        log_info "  CentOS/RHEL: sudo yum install tar gzip gnupg2"
        exit 1
    fi
    
    if [[ ${#missing_optional[@]} -gt 0 ]]; then
        log_warn "Missing optional dependencies: ${missing_optional[*]}"
        log_info "Some backup features may be limited"
        log_info "To install: sudo apt install sqlite3 redis-tools"
    fi
}

load_config() {
    if [[ -f "$CONFIG_FILE" ]]; then
        source "$CONFIG_FILE"
        log_info "Loaded configuration from $CONFIG_FILE"
    else
        log_warn "No configuration file found at $CONFIG_FILE, using defaults"
    fi
}

save_config() {
    cat > "$CONFIG_FILE" << EOF
# Backup Configuration
RETENTION_DAYS=${RETENTION_DAYS:-$DEFAULT_RETENTION_DAYS}
MAX_BACKUPS=${MAX_BACKUPS:-$DEFAULT_MAX_BACKUPS}
COMPRESSION=${COMPRESSION:-$DEFAULT_COMPRESSION}
ENCRYPTION_ENABLED=${ENCRYPTION_ENABLED:-false}
BACKUP_TYPE=${BACKUP_TYPE:-$DEFAULT_BACKUP_TYPE}
INCLUDE_MEDIA=${INCLUDE_MEDIA:-true}
INCLUDE_LOGS=${INCLUDE_LOGS:-false}
NOTIFICATION_EMAIL=${NOTIFICATION_EMAIL:-}
EOF
    log_info "Configuration saved to $CONFIG_FILE"
}

# =============================================================================
# BACKUP FUNCTIONS
# =============================================================================

backup_sqlite_database() {
    local backup_dir="$1"
    local sqlite_backup_dir="$backup_dir/database"
    
    ensure_dir "$sqlite_backup_dir"
    log_info "Backing up SQLite database to $sqlite_backup_dir"
    
    # Check if SQLite database exists
    if [[ ! -f "$SQLITE_DB_PATH" ]]; then
        log_warn "SQLite database not found at: $SQLITE_DB_PATH"
        return 0
    fi
    
    # Check if sqlite3 command is available
    if ! command -v sqlite3 &> /dev/null; then
        log_warn "sqlite3 command not available, copying database file directly"
        local sqlite_backup_file="$sqlite_backup_dir/adaptive_learning_${TIMESTAMP}.db"
        cp "$SQLITE_DB_PATH" "$sqlite_backup_file"
        local size=$(get_size "$sqlite_backup_file")
        log_success "SQLite file copy completed: $(format_size $size)"
    else
        # Create SQLite backup using .backup command
        local sqlite_backup_file="$sqlite_backup_dir/adaptive_learning_${TIMESTAMP}.db"
        local sqlite_dump_file="$sqlite_backup_dir/adaptive_learning_${TIMESTAMP}.sql"
        
        # Binary backup using SQLite .backup command
        log_info "Creating binary SQLite backup"
        if sqlite3 "$SQLITE_DB_PATH" ".backup '$sqlite_backup_file'"; then
            local size=$(get_size "$sqlite_backup_file")
            log_success "SQLite binary backup completed: $(format_size $size)"
        else
            log_error "SQLite binary backup failed"
            return 1
        fi
        
        # Text dump backup for maximum compatibility
        log_info "Creating SQL dump backup"
        if sqlite3 "$SQLITE_DB_PATH" ".dump" > "$sqlite_dump_file"; then
            local size=$(get_size "$sqlite_dump_file")
            log_success "SQLite SQL dump completed: $(format_size $size)"
        else
            log_error "SQLite SQL dump failed"
            return 1
        fi
    fi
    
    # Backup database schemas and migrations
    if [[ -d "$DATABASE_SCHEMAS_DIR" ]]; then
        log_info "Backing up database schemas"
        cp -r "$DATABASE_SCHEMAS_DIR"/*.sql "$sqlite_backup_dir/" 2>/dev/null || true
        cp -r "$DATABASE_SCHEMAS_DIR"/init "$sqlite_backup_dir/" 2>/dev/null || true
        cp -r "$DATABASE_SCHEMAS_DIR"/migrations "$sqlite_backup_dir/" 2>/dev/null || true
        log_success "Database schemas backed up"
    fi
    
    # Calculate total database backup size
    local total_size=$(get_size "$sqlite_backup_dir")
    log_success "Complete database backup: $(format_size $total_size)"
    
    echo "$sqlite_backup_dir"
}

backup_redis_data() {
    local backup_dir="$1"
    local redis_backup_dir="$backup_dir/redis"
    
    ensure_dir "$redis_backup_dir"
    log_info "Backing up Redis data to $redis_backup_dir"
    
    # Check if redis-cli is available
    if ! command -v redis-cli &> /dev/null; then
        log_warn "redis-cli not available, looking for Redis dump files"
        # Look for existing dump files
        local redis_dump_files=()
        [[ -f "${PROJECT_ROOT}/dump.rdb" ]] && redis_dump_files+=("${PROJECT_ROOT}/dump.rdb")
        [[ -f "${PROJECT_ROOT}/redis-data/dump.rdb" ]] && redis_dump_files+=("${PROJECT_ROOT}/redis-data/dump.rdb")
        
        if [[ ${#redis_dump_files[@]} -gt 0 ]]; then
            for dump_file in "${redis_dump_files[@]}"; do
                if [[ -f "$dump_file" ]]; then
                    cp "$dump_file" "$redis_backup_dir/dump_${TIMESTAMP}.rdb"
                    local size=$(get_size "$dump_file")
                    log_success "Redis dump copied: $(format_size $size)"
                    break
                fi
            done
        else
            log_warn "No Redis dump files found"
        fi
        return 0
    fi
    
    # Check if Redis is running
    if ! redis-cli -p 6380 ping &>/dev/null; then
        log_warn "Redis not responding on port 6380, skipping Redis backup"
        return 0
    fi
    
    # Create Redis backup using BGSAVE
    log_info "Triggering Redis background save"
    redis-cli -p 6380 BGSAVE
    
    # Wait for BGSAVE to complete
    while [[ "$(redis-cli -p 6380 LASTSAVE)" == "$(redis-cli -p 6380 LASTSAVE)" ]]; do
        sleep 1
        log_info "Waiting for Redis BGSAVE to complete..."
    done
    
    # Copy Redis dump file if it exists
    local redis_dump_files=()
    [[ -f "${PROJECT_ROOT}/dump.rdb" ]] && redis_dump_files+=("${PROJECT_ROOT}/dump.rdb")
    [[ -f "${PROJECT_ROOT}/redis-data/dump.rdb" ]] && redis_dump_files+=("${PROJECT_ROOT}/redis-data/dump.rdb")
    [[ -f "/var/lib/redis/dump.rdb" ]] && redis_dump_files+=("/var/lib/redis/dump.rdb")
    
    if [[ ${#redis_dump_files[@]} -gt 0 ]]; then
        for dump_file in "${redis_dump_files[@]}"; do
            if [[ -f "$dump_file" ]]; then
                cp "$dump_file" "$redis_backup_dir/dump_${TIMESTAMP}.rdb"
                local size=$(get_size "$dump_file")
                log_success "Redis dump copied: $(format_size $size)"
                break
            fi
        done
    else
        log_warn "No Redis dump file found"
    fi
    
    # Backup Redis configuration
    if [[ -f "$REDIS_CONFIG" ]]; then
        cp "$REDIS_CONFIG" "$redis_backup_dir/"
        log_success "Redis configuration backed up"
    fi
    
    # Export Redis data as JSON for additional safety
    log_info "Exporting Redis keys to JSON backup"
    local redis_json_backup="$redis_backup_dir/redis_data_${TIMESTAMP}.json"
    {
        echo "{"
        local first=true
        redis-cli -p 6380 --scan | while read -r key; do
            if [[ "$first" == "true" ]]; then
                first=false
            else
                echo ","
            fi
            local key_type=$(redis-cli -p 6380 TYPE "$key")
            local key_ttl=$(redis-cli -p 6380 TTL "$key")
            echo -n "  \"$key\": {"
            echo -n "\"type\": \"$key_type\", \"ttl\": $key_ttl, \"value\": "
            
            case "$key_type" in
                "string")
                    redis-cli -p 6380 GET "$key" | jq -R
                    ;;
                "hash")
                    redis-cli -p 6380 HGETALL "$key" | jq -R | jq -s 'map(select(length > 0)) | . as $arr | reduce range(0; length; 2) as $i ({}; .[$arr[$i]] = $arr[$i+1])'
                    ;;
                "list")
                    redis-cli -p 6380 LRANGE "$key" 0 -1 | jq -R | jq -s
                    ;;
                "set")
                    redis-cli -p 6380 SMEMBERS "$key" | jq -R | jq -s
                    ;;
                "zset")
                    redis-cli -p 6380 ZRANGE "$key" 0 -1 WITHSCORES | jq -R | jq -s
                    ;;
                *)
                    echo "null"
                    ;;
            esac
            echo -n "}"
        done
        echo
        echo "}"
    } > "$redis_json_backup"
    
    local total_size=$(get_size "$redis_backup_dir")
    log_success "Complete Redis backup: $(format_size $total_size)"
    
    echo "$redis_backup_dir"
}

backup_services() {
    local backup_dir="$1"
    local services_dir="$backup_dir/services"
    
    ensure_dir "$services_dir"
    log_info "Backing up services to $services_dir"
    
    for service in "${SERVICES[@]}"; do
        local service_path="$PROJECT_ROOT/services/$service"
        if [[ -d "$service_path" ]]; then
            local service_backup="$services_dir/$service.tar.gz"
            
            log_info "Backing up service: $service"
            
            if tar -czf "$service_backup" -C "$PROJECT_ROOT/services" "$service"; then
                local size=$(get_size "$service_backup")
                log_info "Service $service backed up: $(format_size $size)"
            else
                log_error "Failed to backup service: $service"
                return 1
            fi
        else
            log_warn "Service directory not found: $service_path"
        fi
    done
    
    log_success "All services backed up successfully"
}

backup_api_gateway() {
    local backup_dir="$1"
    local gateway_backup="$backup_dir/api-gateway.tar.gz"
    
    log_info "Backing up API Gateway"
    
    if [[ -d "$PROJECT_ROOT/api-gateway" ]]; then
        if tar -czf "$gateway_backup" -C "$PROJECT_ROOT" "api-gateway"; then
            local size=$(get_size "$gateway_backup")
            log_success "API Gateway backed up: $(format_size $size)"
        else
            log_error "Failed to backup API Gateway"
            return 1
        fi
    else
        log_warn "API Gateway directory not found"
    fi
}

backup_frontend() {
    local backup_dir="$1"
    local frontend_backup="$backup_dir/frontend.tar.gz"
    
    log_info "Backing up Frontend"
    
    if [[ -d "$FRONTEND_DIR" ]]; then
        # Exclude node_modules and build artifacts
        if tar -czf "$frontend_backup" \
            -C "$PROJECT_ROOT" \
            --exclude="frontend/node_modules" \
            --exclude="frontend/dist" \
            --exclude="frontend/.vite" \
            --exclude="frontend/.next" \
            "frontend"; then
            
            local size=$(get_size "$frontend_backup")
            log_success "Frontend backed up: $(format_size $size)"
        else
            log_error "Failed to backup Frontend"
            return 1
        fi
    else
        log_warn "Frontend directory not found"
    fi
}

backup_database_schemas() {
    local backup_dir="$1"
    local schemas_backup="$backup_dir/database-schemas.tar.gz"
    
    log_info "Backing up Database Schemas"
    
    if [[ -d "$PROJECT_ROOT/database" ]]; then
        if tar -czf "$schemas_backup" -C "$PROJECT_ROOT" "database"; then
            local size=$(get_size "$schemas_backup")
            log_success "Database schemas backed up: $(format_size $size)"
        else
            log_error "Failed to backup database schemas"
            return 1
        fi
    else
        log_warn "Database schemas directory not found"
    fi
}

backup_configuration() {
    local backup_dir="$1"
    local config_backup="$backup_dir/configuration.tar.gz"
    
    log_info "Backing up Configuration files"
    
    local config_files=()
    
    # Collect configuration files
    [[ -f "$PROJECT_ROOT/.env" ]] && config_files+=(".env")
    [[ -f "$PROJECT_ROOT/docker-compose.yml" ]] && config_files+=("docker-compose.yml")
    [[ -f "$PROJECT_ROOT/package.json" ]] && config_files+=("package.json")
    [[ -f "$CONFIG_FILE" ]] && config_files+=("$(basename "$CONFIG_FILE")")
    [[ -d "$PROJECT_ROOT/scripts" ]] && config_files+=("scripts")
    [[ -d "$PROJECT_ROOT/docs" ]] && config_files+=("docs")
    
    if [[ ${#config_files[@]} -gt 0 ]]; then
        if tar -czf "$config_backup" -C "$PROJECT_ROOT" "${config_files[@]}"; then
            local size=$(get_size "$config_backup")
            log_success "Configuration backed up: $(format_size $size)"
        else
            log_error "Failed to backup configuration"
            return 1
        fi
    else
        log_warn "No configuration files found to backup"
    fi
}

backup_media() {
    local backup_dir="$1"
    local media_backup="$backup_dir/media.tar.gz"
    
    if [[ "${INCLUDE_MEDIA:-true}" == "true" ]]; then
        log_info "Backing up Media files"
        
        local media_dirs=("$PROJECT_ROOT/uploads" "$PROJECT_ROOT/media" "$PROJECT_ROOT/assets")
        local found_media=false
        
        for media_dir in "${media_dirs[@]}"; do
            if [[ -d "$media_dir" ]]; then
                found_media=true
                break
            fi
        done
        
        if [[ "$found_media" == "true" ]]; then
            local tar_args=("-czf" "$media_backup" "-C" "$PROJECT_ROOT")
            
            for media_dir in "${media_dirs[@]}"; do
                if [[ -d "$media_dir" ]]; then
                    tar_args+=("$(basename "$media_dir")")
                fi
            done
            
            if tar "${tar_args[@]}"; then
                local size=$(get_size "$media_backup")
                log_success "Media files backed up: $(format_size $size)"
            else
                log_error "Failed to backup media files"
                return 1
            fi
        else
            log_info "No media directories found to backup"
        fi
    else
        log_info "Media backup disabled"
    fi
}

backup_logs() {
    local backup_dir="$1"
    local logs_backup="$backup_dir/logs.tar.gz"
    
    if [[ "${INCLUDE_LOGS:-false}" == "true" ]]; then
        log_info "Backing up Log files"
        
        local log_dirs=("$PROJECT_ROOT/logs" "$BACKUP_BASE_DIR")
        local found_logs=false
        
        for log_dir in "${log_dirs[@]}"; do
            if [[ -d "$log_dir" ]] && [[ "$(ls -A "$log_dir" 2>/dev/null)" ]]; then
                found_logs=true
                break
            fi
        done
        
        if [[ "$found_logs" == "true" ]]; then
            local tar_args=("-czf" "$logs_backup" "-C" "$PROJECT_ROOT")
            
            for log_dir in "${log_dirs[@]}"; do
                if [[ -d "$log_dir" ]] && [[ "$(ls -A "$log_dir" 2>/dev/null)" ]]; then
                    tar_args+=("$(basename "$log_dir")")
                fi
            done
            
            if tar "${tar_args[@]}"; then
                local size=$(get_size "$logs_backup")
                log_success "Log files backed up: $(format_size $size)"
            else
                log_error "Failed to backup log files"
                return 1
            fi
        else
            log_info "No log files found to backup"
        fi
    else
        log_info "Log backup disabled"
    fi
}

backup_monitoring_config() {
    local backup_dir="$1"
    local monitoring_backup="$backup_dir/monitoring.tar.gz"
    
    log_info "Backing up Monitoring configuration"
    
    if [[ -d "$PROJECT_ROOT/monitoring" ]]; then
        if tar -czf "$monitoring_backup" -C "$PROJECT_ROOT" "monitoring"; then
            local size=$(get_size "$monitoring_backup")
            log_success "Monitoring configuration backed up: $(format_size $size)"
        else
            log_error "Failed to backup monitoring configuration"
            return 1
        fi
    else
        log_warn "Monitoring directory not found"
    fi
}

backup_scripts() {
    local backup_dir="$1"
    local scripts_backup="$backup_dir/scripts.tar.gz"
    
    log_info "Backing up Scripts and automation"
    
    if [[ -d "$PROJECT_ROOT/scripts" ]]; then
        if tar -czf "$scripts_backup" -C "$PROJECT_ROOT" "scripts"; then
            local size=$(get_size "$scripts_backup")
            log_success "Scripts backed up: $(format_size $size)"
        else
            log_error "Failed to backup scripts"
            return 1
        fi
    else
        log_warn "Scripts directory not found"
    fi
}

create_backup_manifest() {
    local backup_dir="$1"
    local manifest_file="$backup_dir/MANIFEST.json"
    
    log_info "Creating backup manifest"
    
    local timestamp=$(date -u '+%Y-%m-%dT%H:%M:%SZ')
    local hostname=$(hostname)
    local total_size=0
    
    # Calculate total size
    for file in "$backup_dir"/*.tar.gz "$backup_dir"/*.sql; do
        if [[ -f "$file" ]]; then
            local size=$(get_size "$file")
            total_size=$((total_size + size))
        fi
    done
    
    cat > "$manifest_file" << EOF
{
  "backup_info": {
    "timestamp": "$timestamp",
    "hostname": "$hostname",
    "backup_type": "${BACKUP_TYPE:-$DEFAULT_BACKUP_TYPE}",
    "version": "1.0.0",
    "total_size_bytes": $total_size,
    "total_size_formatted": "$(format_size $total_size)"
  },
  "components": {
EOF

    local first=true
    
    # Add database info
    local db_dir="$backup_dir/database"
    if [[ -d "$db_dir" ]]; then
        [[ "$first" == "false" ]] && echo "    ," >> "$manifest_file"
        local size=$(get_size "$db_dir")
        cat >> "$manifest_file" << EOF
    "database": {
      "directory": "database",
      "size_bytes": $size,
      "size_formatted": "$(format_size $size)",
      "files": [
EOF
        local db_first=true
        for db_file in "$db_dir"/*; do
            if [[ -f "$db_file" ]]; then
                [[ "$db_first" == "false" ]] && echo "        ," >> "$manifest_file"
                local file_size=$(get_size "$db_file")
                echo "        {\"file\": \"$(basename "$db_file")\", \"size\": $file_size}" >> "$manifest_file"
                db_first=false
            fi
        done
        echo "      ]" >> "$manifest_file"
        echo "    }" >> "$manifest_file"
        first=false
    fi
    
    # Add Redis info
    local redis_dir="$backup_dir/redis"
    if [[ -d "$redis_dir" ]]; then
        [[ "$first" == "false" ]] && echo "    ," >> "$manifest_file"
        local size=$(get_size "$redis_dir")
        cat >> "$manifest_file" << EOF
    "redis": {
      "directory": "redis",
      "size_bytes": $size,
      "size_formatted": "$(format_size $size)"
    }
EOF
        first=false
    fi
    
    # Add other components
    local components=("services" "api-gateway" "frontend" "configuration" "media" "logs" "monitoring" "scripts")
    
    for component in "${components[@]}"; do
        local component_file="$backup_dir/$component.tar.gz"
        if [[ -f "$component_file" ]]; then
            [[ "$first" == "false" ]] && echo "    ," >> "$manifest_file"
            local size=$(get_size "$component_file")
            cat >> "$manifest_file" << EOF
    "$component": {
      "file": "$(basename "$component_file")",
      "size_bytes": $size,
      "size_formatted": "$(format_size $size)"
    }
EOF
            first=false
        fi
    done
    
    cat >> "$manifest_file" << EOF
  }
}
EOF
    
    log_success "Backup manifest created: $manifest_file"
}

encrypt_backup() {
    local backup_dir="$1"
    
    if [[ "${ENCRYPTION_ENABLED:-false}" == "true" ]]; then
        log_info "Encrypting backup files"
        
        local encryption_key="${ENCRYPTION_KEY:-backup@ebrovalley.com}"
        
        for file in "$backup_dir"/*.tar.gz "$backup_dir"/*.sql; do
            if [[ -f "$file" ]]; then
                log_info "Encrypting $(basename "$file")"
                
                if gpg --batch --yes --trust-model always \
                    --recipient "$encryption_key" \
                    --encrypt "$file"; then
                    
                    rm "$file"
                    log_success "Encrypted: $(basename "$file")"
                else
                    log_error "Failed to encrypt: $(basename "$file")"
                    return 1
                fi
            fi
        done
        
        log_success "All backup files encrypted"
    else
        log_info "Encryption disabled"
    fi
}

create_final_archive() {
    local backup_dir="$1"
    local final_archive="$2"
    
    log_info "Creating final backup archive: $final_archive"
    
    if tar -czf "$final_archive" -C "$(dirname "$backup_dir")" "$(basename "$backup_dir")"; then
        local size=$(get_size "$final_archive")
        log_success "Final backup archive created: $(format_size $size)"
        
        # Remove temporary backup directory
        rm -rf "$backup_dir"
        log_info "Temporary backup directory removed"
    else
        log_error "Failed to create final backup archive"
        return 1
    fi
}

# =============================================================================
# RESTORE FUNCTIONS
# =============================================================================

list_backups() {
    log_info "Available backups:"
    echo
    
    if [[ ! -d "$BACKUP_BASE_DIR" ]] || [[ ! "$(ls -A "$BACKUP_BASE_DIR"/*.tar.gz 2>/dev/null)" ]]; then
        echo "No backups found in $BACKUP_BASE_DIR"
        return
    fi
    
    local count=0
    for backup in "$BACKUP_BASE_DIR"/*.tar.gz; do
        if [[ -f "$backup" ]]; then
            local filename=$(basename "$backup")
            local size=$(get_size "$backup")
            local date=$(stat -f%SB -t%Y-%m-%d\ %H:%M:%S "$backup" 2>/dev/null || \
                        stat -c%y "$backup" 2>/dev/null | cut -d. -f1)
            
            echo "  $((++count)). $filename"
            echo "     Size: $(format_size $size)"
            echo "     Date: $date"
            echo
        fi
    done
}

extract_backup() {
    local backup_file="$1"
    local extract_dir="$2"
    
    log_info "Extracting backup: $backup_file"
    
    ensure_dir "$extract_dir"
    
    if tar -xzf "$backup_file" -C "$extract_dir"; then
        log_success "Backup extracted to: $extract_dir"
    else
        log_error "Failed to extract backup"
        return 1
    fi
}

restore_sqlite_database() {
    local db_dir="$1"
    
    log_info "Restoring SQLite database from: $db_dir"
    
    if [[ ! -d "$db_dir" ]]; then
        log_error "Database directory not found: $db_dir"
        return 1
    fi
    
    # Create backup of current database first
    local current_backup="${BACKUP_BASE_DIR}/pre_restore_$(get_timestamp).db"
    ensure_dir "$(dirname "$current_backup")"
    
    if [[ -f "$SQLITE_DB_PATH" ]]; then
        log_info "Creating backup of current database before restore"
        cp "$SQLITE_DB_PATH" "$current_backup"
        log_success "Current database backed up to: $current_backup"
    fi
    
    # Find the database files to restore
    local sqlite_backup_file=$(find "$db_dir" -name "*.db" | head -1)
    local sqlite_dump_file=$(find "$db_dir" -name "*.sql" | head -1)
    
    if [[ -n "$sqlite_backup_file" && -f "$sqlite_backup_file" ]]; then
        log_info "Restoring from binary SQLite backup: $sqlite_backup_file"
        ensure_dir "$(dirname "$SQLITE_DB_PATH")"
        cp "$sqlite_backup_file" "$SQLITE_DB_PATH"
        log_success "SQLite database restored from binary backup"
    elif [[ -n "$sqlite_dump_file" && -f "$sqlite_dump_file" ]]; then
        log_info "Restoring from SQL dump: $sqlite_dump_file"
        ensure_dir "$(dirname "$SQLITE_DB_PATH")"
        sqlite3 "$SQLITE_DB_PATH" < "$sqlite_dump_file"
        log_success "SQLite database restored from SQL dump"
    else
        log_error "No valid SQLite backup files found in $db_dir"
        return 1
    fi
    
    # Verify restored database
    if sqlite3 "$SQLITE_DB_PATH" "PRAGMA integrity_check;" | grep -q "ok"; then
        log_success "Database integrity check passed"
    else
        log_warn "Database integrity check failed"
    fi
    
    log_success "SQLite database restore completed"
}

# =============================================================================
# MAINTENANCE FUNCTIONS
# =============================================================================

cleanup_old_backups() {
    local retention_days="${RETENTION_DAYS:-$DEFAULT_RETENTION_DAYS}"
    local max_backups="${MAX_BACKUPS:-$DEFAULT_MAX_BACKUPS}"
    
    log_info "Cleaning up old backups (retention: ${retention_days} days, max: ${max_backups})"
    
    if [[ ! -d "$BACKUP_BASE_DIR" ]]; then
        log_info "No backup directory found, nothing to clean"
        return
    fi
    
    # Remove backups older than retention period
    find "$BACKUP_BASE_DIR" -name "*.tar.gz" -mtime +$retention_days -delete 2>/dev/null || true
    
    # Keep only the latest N backups
    local backup_count=$(ls -1 "$BACKUP_BASE_DIR"/*.tar.gz 2>/dev/null | wc -l)
    
    if [[ $backup_count -gt $max_backups ]]; then
        local to_remove=$((backup_count - max_backups))
        log_info "Removing $to_remove old backups to maintain max limit"
        
        ls -1t "$BACKUP_BASE_DIR"/*.tar.gz | tail -n $to_remove | xargs rm -f
    fi
    
    log_success "Backup cleanup completed"
}

verify_backup() {
    local backup_file="$1"
    
    log_info "Verifying backup integrity: $backup_file"
    
    if [[ ! -f "$backup_file" ]]; then
        log_error "Backup file not found: $backup_file"
        return 1
    fi
    
    # Test archive integrity
    if tar -tzf "$backup_file" > /dev/null 2>&1; then
        log_success "Backup archive integrity verified"
    else
        log_error "Backup archive is corrupted"
        return 1
    fi
    
    # Check if manifest exists in archive
    if tar -tzf "$backup_file" | grep -q "MANIFEST.json"; then
        log_success "Backup manifest found"
    else
        log_warn "Backup manifest not found (older backup format)"
    fi
    
    log_success "Backup verification completed"
}

send_notification() {
    local subject="$1"
    local message="$2"
    local status="${3:-info}"
    
    if [[ -n "${NOTIFICATION_EMAIL:-}" ]] && command -v mail &> /dev/null; then
        echo "$message" | mail -s "$subject" "$NOTIFICATION_EMAIL"
        log_info "Notification sent to: $NOTIFICATION_EMAIL"
    fi
    
    # Could add other notification methods here (Slack, Discord, etc.)
}

# =============================================================================
# MAIN FUNCTIONS
# =============================================================================

perform_backup() {
    local backup_type="${1:-$DEFAULT_BACKUP_TYPE}"
    local timestamp=$(get_timestamp)
    local backup_name="adaptive-learning-backup_${timestamp}"
    local temp_backup_dir="${BACKUP_BASE_DIR}/temp_${backup_name}"
    local final_backup_file="${BACKUP_BASE_DIR}/${backup_name}.tar.gz"
    
    log_info "🚀 Starting $backup_type backup: $backup_name"
    
    # Initialize
    ensure_dir "$BACKUP_BASE_DIR"
    ensure_dir "$temp_backup_dir"
    
    local start_time=$(date +%s)
    local success=true
    
    # Perform backup components
    {
        backup_sqlite_database "$temp_backup_dir" &&
        backup_redis_data "$temp_backup_dir" &&
        backup_services "$temp_backup_dir" &&
        backup_api_gateway "$temp_backup_dir" &&
        backup_frontend "$temp_backup_dir" &&
        backup_configuration "$temp_backup_dir" &&
        backup_media "$temp_backup_dir" &&
        backup_logs "$temp_backup_dir" &&
        backup_monitoring_config "$temp_backup_dir" &&
        backup_scripts "$temp_backup_dir" &&
        create_backup_manifest "$temp_backup_dir" &&
        encrypt_backup "$temp_backup_dir" &&
        create_final_archive "$temp_backup_dir" "$final_backup_file"
    } || success=false
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    if [[ "$success" == "true" ]]; then
        local size=$(get_size "$final_backup_file")
        log_success "✅ Backup completed successfully in ${duration}s"
        log_success "📦 Backup file: $final_backup_file ($(format_size $size))"
        
        # Cleanup and verify
        cleanup_old_backups
        verify_backup "$final_backup_file"
        
        send_notification \
            "✅ Backup Successful - Adaptive Learning Ecosystem" \
            "Backup completed successfully in ${duration}s. File: $final_backup_file ($(format_size $size))" \
            "success"
    else
        log_error "❌ Backup failed after ${duration}s"
        
        # Cleanup failed backup
        [[ -d "$temp_backup_dir" ]] && rm -rf "$temp_backup_dir"
        [[ -f "$final_backup_file" ]] && rm -f "$final_backup_file"
        
        send_notification \
            "❌ Backup Failed - Adaptive Learning Ecosystem" \
            "Backup failed after ${duration}s. Check logs for details." \
            "error"
        
        return 1
    fi
}

perform_restore() {
    local backup_file="$1"
    local components="${2:-all}"
    
    if [[ ! -f "$backup_file" ]]; then
        log_error "Backup file not found: $backup_file"
        return 1
    fi
    
    log_info "Starting restore from: $backup_file"
    log_info "Components to restore: $components"
    
    # Verify backup first
    if ! verify_backup "$backup_file"; then
        log_error "Backup verification failed, aborting restore"
        return 1
    fi
    
    local temp_restore_dir="$BACKUP_DIR/temp_restore_$(get_timestamp)"
    ensure_dir "$temp_restore_dir"
    
    # Extract backup
    if ! extract_backup "$backup_file" "$temp_restore_dir"; then
        rm -rf "$temp_restore_dir"
        return 1
    fi
    
    # Find the actual backup directory (it's nested)
    local actual_backup_dir=$(find "$temp_restore_dir" -name "backup_*" -type d | head -1)
    
    if [[ -z "$actual_backup_dir" ]]; then
        log_error "Could not find backup directory in archive"
        rm -rf "$temp_restore_dir"
        return 1
    fi
    
    log_info "Backup extracted to: $actual_backup_dir"
    
    # Restore components based on selection
    local success=true
    
    if [[ "$components" == "all" ]] || [[ "$components" == *"database"* ]]; then
        local db_dir=$(find "$actual_backup_dir" -name "database" -type d | head -1)
        if [[ -n "$db_dir" && -d "$db_dir" ]]; then
            restore_sqlite_database "$db_dir" || success=false
        fi
    fi
    
    # Add other component restore logic here as needed
    
    # Cleanup
    rm -rf "$temp_restore_dir"
    
    if [[ "$success" == "true" ]]; then
        log_success "Restore completed successfully"
        send_notification \
            "Restore Successful - Adaptive Learning Ecosystem" \
            "Restore completed successfully from: $backup_file"
    else
        log_error "Restore failed"
        send_notification \
            "Restore Failed - Adaptive Learning Ecosystem" \
            "Restore failed from: $backup_file. Check logs for details." \
            "error"
        return 1
    fi
}

# =============================================================================
# CLI INTERFACE
# =============================================================================

show_help() {
    cat << EOF
🎓 Adaptive Learning Ecosystem - Enterprise Backup System
EbroValley Digital - Production Grade Backup Solution

Usage: $0 [COMMAND] [OPTIONS]

Commands:
    backup [type]           Create a comprehensive backup (type: full, incremental)
    restore <file> [comp]   Restore from backup file (comp: all, database, services)
    list                    List available backups with details
    verify <file>           Verify backup integrity and completeness
    cleanup                 Clean up old backups based on retention policy
    config                  Configure backup settings interactively
    help                    Show this comprehensive help message

Backup Types:
    full                    Complete backup of all components
    incremental             Backup only changed files (default)

Restore Components:
    all                     Restore everything (default)
    database                Restore only SQLite database
    services                Restore only microservices
    redis                   Restore only Redis data
    config                  Restore only configuration files

Options:
    --retention-days N      Keep backups for N days (default: 30)
    --max-backups N         Keep maximum N backups (default: 10)
    --no-encryption         Disable GPG backup encryption
    --include-media         Include media files in backup
    --include-logs          Include log files in backup
    --notification-email E  Send notifications to email address
    --test                  Perform test backup without creating files

Components Backed Up:
    📊 SQLite Database      - Binary backup + SQL dump + schemas
    🔴 Redis Data          - RDB dump + JSON export + configuration
    🚀 Microservices       - All 8 services with configurations
    🌐 API Gateway         - NestJS gateway with JWT configuration
    ⚛️ React Frontend      - Source code (excluding node_modules)
    📊 Monitoring Stack    - Prometheus + Grafana configurations
    🔧 Scripts & Tools     - Backup and automation scripts
    ⚙️ System Config       - Environment files and settings

Examples:
    $0 backup full --include-media --include-logs
    $0 backup incremental
    $0 restore adaptive-learning-backup_20250712_143000.tar.gz all
    $0 restore backup.tar.gz database
    $0 list
    $0 verify adaptive-learning-backup_20250712_143000.tar.gz
    $0 cleanup
    $0 config

Environment Variables:
    BACKUP_BASE_DIR         Base directory for backups (default: ./backups)
    RETENTION_DAYS          Days to keep backups (default: 30)
    MAX_BACKUPS             Maximum number of backups (default: 10)
    ENCRYPTION_ENABLED      Enable GPG encryption (default: false)
    ENCRYPTION_KEY          GPG encryption key (default: backup@ebrovalley.com)
    INCLUDE_MEDIA           Include media files (default: true)
    INCLUDE_LOGS            Include log files (default: false)
    NOTIFICATION_EMAIL      Email for backup notifications

Directory Structure:
    adaptive-learning-ecosystem/
    ├── database/           SQLite database and schemas
    ├── services/           8 Python microservices
    ├── api-gateway/        NestJS API Gateway
    ├── frontend/           React application
    ├── monitoring/         Prometheus & Grafana
    ├── scripts/            Backup and automation scripts
    └── backups/            Generated backup files

Backup File Naming:
    adaptive-learning-backup_YYYYMMDD_HHMMSS.tar.gz

For support: https://github.com/ebrovalley/adaptive-learning-ecosystem

EOF
}

parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --retention-days)
                RETENTION_DAYS="$2"
                shift 2
                ;;
            --max-backups)
                MAX_BACKUPS="$2"
                shift 2
                ;;
            --no-encryption)
                ENCRYPTION_ENABLED=false
                shift
                ;;
            --include-media)
                INCLUDE_MEDIA=true
                shift
                ;;
            --include-logs)
                INCLUDE_LOGS=true
                shift
                ;;
            --notification-email)
                NOTIFICATION_EMAIL="$2"
                shift 2
                ;;
            --test)
                TEST_MODE=true
                shift
                ;;
            *)
                break
                ;;
        esac
    done
}

configure_backup() {
    echo "Backup System Configuration"
    echo "=========================="
    echo
    
    read -p "Retention days [$DEFAULT_RETENTION_DAYS]: " RETENTION_DAYS
    RETENTION_DAYS=${RETENTION_DAYS:-$DEFAULT_RETENTION_DAYS}
    
    read -p "Max backups [$DEFAULT_MAX_BACKUPS]: " MAX_BACKUPS
    MAX_BACKUPS=${MAX_BACKUPS:-$DEFAULT_MAX_BACKUPS}
    
    read -p "Enable encryption? [y/N]: " encrypt
    if [[ "$encrypt" =~ ^[Yy]$ ]]; then
        ENCRYPTION_ENABLED=true
        read -p "Encryption key [backup@ebrovalley.com]: " ENCRYPTION_KEY
        ENCRYPTION_KEY=${ENCRYPTION_KEY:-backup@ebrovalley.com}
    else
        ENCRYPTION_ENABLED=false
    fi
    
    read -p "Include media files? [Y/n]: " media
    if [[ "$media" =~ ^[Nn]$ ]]; then
        INCLUDE_MEDIA=false
    else
        INCLUDE_MEDIA=true
    fi
    
    read -p "Include log files? [y/N]: " logs
    if [[ "$logs" =~ ^[Yy]$ ]]; then
        INCLUDE_LOGS=true
    else
        INCLUDE_LOGS=false
    fi
    
    read -p "Notification email (optional): " NOTIFICATION_EMAIL
    
    save_config
    echo
    echo "Configuration saved successfully!"
}

main() {
    echo -e "${PURPLE}
╔══════════════════════════════════════════════════════════════╗
║      🎓 ADAPTIVE LEARNING ECOSYSTEM - BACKUP SYSTEM         ║
║                EbroValley Digital - v2.0.0                  ║
║             Enterprise-Grade SQLite Backup Solution         ║
╚══════════════════════════════════════════════════════════════╝
${NC}"
    
    # Setup
    check_dependencies
    load_config
    
    # Parse global arguments
    parse_arguments "$@"
    
    # Get command
    local command="${1:-help}"
    shift || true
    
    case "$command" in
        backup)
            local backup_type="${1:-incremental}"
            if [[ "${TEST_MODE:-false}" == "true" ]]; then
                log_info "🧪 Running in TEST MODE - no files will be created"
                backup_type="test-${backup_type}"
            fi
            perform_backup "$backup_type"
            ;;
        restore)
            local backup_file="$1"
            local components="${2:-all}"
            if [[ -z "$backup_file" ]]; then
                echo "❌ Error: backup file required"
                echo "Usage: $0 restore <backup_file> [components]"
                exit 1
            fi
            perform_restore "$backup_file" "$components"
            ;;
        list)
            list_backups
            ;;
        verify)
            local backup_file="$1"
            if [[ -z "$backup_file" ]]; then
                echo "❌ Error: backup file required"
                echo "Usage: $0 verify <backup_file>"
                exit 1
            fi
            verify_backup "$backup_file"
            ;;
        cleanup)
            cleanup_old_backups
            ;;
        config)
            configure_backup
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            echo "❌ Error: unknown command '$command'"
            echo "Use '$0 help' for usage information"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"