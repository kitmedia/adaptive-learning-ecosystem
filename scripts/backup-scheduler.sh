#!/bin/bash

# 📅 Adaptive Learning Ecosystem - Backup Scheduler
# EbroValley Digital - Automated Backup Scheduling System
# Version: 1.0.0

set -euo pipefail

# ========================================
# CONFIGURATION
# ========================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_SCRIPT="${SCRIPT_DIR}/backup-system.sh"
CRON_USER="${CRON_USER:-$(whoami)}"
CRON_FILE="/tmp/adaptive-learning-cron"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# ========================================
# HELPER FUNCTIONS
# ========================================

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

error() {
    echo -e "${RED}❌ ERROR: $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  WARNING: $1${NC}"
}

info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

# ========================================
# CRON MANAGEMENT FUNCTIONS
# ========================================

# Install cron jobs for automated backups
install_cron_jobs() {
    log "Installing automated backup cron jobs..."
    
    # Get current crontab
    crontab -l 2>/dev/null > "$CRON_FILE" || touch "$CRON_FILE"
    
    # Remove existing adaptive learning backup jobs
    sed -i '/# Adaptive Learning Ecosystem Backup/,/# End Adaptive Learning Ecosystem Backup/d' "$CRON_FILE"
    
    # Add new backup schedule
    cat >> "$CRON_FILE" << EOF

# Adaptive Learning Ecosystem Backup Schedule
# Generated on $(date)

# Daily full backup at 2:00 AM with comprehensive options
0 2 * * * $BACKUP_SCRIPT backup full --retention-days 30 --max-backups 10 --include-media >/var/log/adaptive-learning-backup.log 2>&1

# Hourly incremental backup during business hours (9 AM - 6 PM) weekdays
0 9-18 * * 1-5 $BACKUP_SCRIPT backup incremental --retention-days 7 >/var/log/adaptive-learning-backup.log 2>&1

# Weekly cleanup on Sundays at 3:00 AM
0 3 * * 0 $BACKUP_SCRIPT cleanup >/var/log/adaptive-learning-backup.log 2>&1

# Monthly verification of all backups on 1st day at 4:00 AM  
0 4 1 * * find ${PROJECT_ROOT}/backups -name "adaptive-learning-backup_*.tar.gz" -exec $BACKUP_SCRIPT verify {} \; >/var/log/adaptive-learning-backup.log 2>&1

# Weekly monitoring health check on Saturdays at 1:00 AM
0 1 * * 6 $BACKUP_SCRIPT list >/var/log/adaptive-learning-backup.log 2>&1

# End Adaptive Learning Ecosystem Backup
EOF
    
    # Install the new crontab
    crontab "$CRON_FILE"
    rm -f "$CRON_FILE"
    
    success "Backup cron jobs installed successfully"
    info "Schedule:"
    info "  - Daily full backup: 2:00 AM"
    info "  - Hourly incremental: 9 AM - 6 PM (weekdays)"
    info "  - Weekly cleanup: Sunday 3:00 AM"
    info "  - Monthly verification: 1st day 4:00 AM"
}

# Remove backup cron jobs
remove_cron_jobs() {
    log "Removing automated backup cron jobs..."
    
    # Get current crontab
    if crontab -l 2>/dev/null > "$CRON_FILE"; then
        # Remove adaptive learning backup jobs
        sed -i '/# Adaptive Learning Ecosystem Backup/,/# End Adaptive Learning Ecosystem Backup/d' "$CRON_FILE"
        
        # Install cleaned crontab
        crontab "$CRON_FILE"
        rm -f "$CRON_FILE"
        
        success "Backup cron jobs removed successfully"
    else
        warning "No crontab found for user $CRON_USER"
    fi
}

# Show current backup schedule
show_schedule() {
    log "Current backup schedule:"
    echo
    
    if crontab -l 2>/dev/null | grep -q "Adaptive Learning Ecosystem Backup"; then
        echo "📅 Automated Backup Schedule:"
        echo "=============================="
        crontab -l 2>/dev/null | sed -n '/# Adaptive Learning Ecosystem Backup/,/# End Adaptive Learning Ecosystem Backup/p' | grep -v '^#'
        echo
        
        echo "📊 Schedule Summary:"
        echo "  🔄 Full Backup: Daily at 2:00 AM"
        echo "  ⚡ Incremental: Hourly 9-18 (Mon-Fri)"
        echo "  🧹 Cleanup: Weekly on Sunday 3:00 AM"
        echo "  🔍 Verification: Monthly on 1st at 4:00 AM"
    else
        warning "No automated backup schedule found"
        info "Use 'install' command to set up automated backups"
    fi
}

# Test backup scheduling
test_schedule() {
    log "Testing backup system..."
    
    # Check if backup script exists and is executable
    if [[ ! -f "$BACKUP_SCRIPT" ]]; then
        error "Backup script not found: $BACKUP_SCRIPT"
        return 1
    fi
    
    if [[ ! -x "$BACKUP_SCRIPT" ]]; then
        error "Backup script is not executable: $BACKUP_SCRIPT"
        return 1
    fi
    
    success "Backup script found and executable"
    
    # Test backup system
    log "Running test backup..."
    if "$BACKUP_SCRIPT" backup incremental --test; then
        success "Test backup completed successfully"
    else
        error "Test backup failed"
        return 1
    fi
    
    # Check cron service
    if command -v systemctl &> /dev/null; then
        if systemctl is-active --quiet cron || systemctl is-active --quiet crond; then
            success "Cron service is running"
        else
            warning "Cron service is not running"
            info "Start with: sudo systemctl start cron"
        fi
    elif command -v service &> /dev/null; then
        if service cron status &> /dev/null || service crond status &> /dev/null; then
            success "Cron service is running"
        else
            warning "Cron service is not running"
        fi
    else
        info "Cannot check cron service status"
    fi
    
    success "Backup system test completed"
}

# Create systemd timer as alternative to cron
create_systemd_timer() {
    log "Creating systemd timer for backup automation..."
    
    local service_file="/etc/systemd/system/adaptive-learning-backup.service"
    local timer_file="/etc/systemd/system/adaptive-learning-backup.timer"
    
    # Check if we have permission to create systemd files
    if [[ ! -w "/etc/systemd/system" ]]; then
        error "Permission denied: Cannot create systemd files"
        info "Run with sudo or use cron instead"
        return 1
    fi
    
    # Create service file
    cat > "$service_file" << EOF
[Unit]
Description=Adaptive Learning Ecosystem Backup Service
After=network.target

[Service]
Type=oneshot
User=$CRON_USER
WorkingDirectory=$PROJECT_ROOT
ExecStart=$BACKUP_SCRIPT backup full
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF
    
    # Create timer file
    cat > "$timer_file" << EOF
[Unit]
Description=Adaptive Learning Ecosystem Backup Timer
Requires=adaptive-learning-backup.service

[Timer]
OnCalendar=daily
Persistent=true
RandomizedDelaySec=300

[Install]
WantedBy=timers.target
EOF
    
    # Reload systemd and enable timer
    systemctl daemon-reload
    systemctl enable adaptive-learning-backup.timer
    systemctl start adaptive-learning-backup.timer
    
    success "Systemd timer created and enabled"
    info "Service: $service_file"
    info "Timer: $timer_file"
    info "Status: systemctl status adaptive-learning-backup.timer"
}

# Remove systemd timer
remove_systemd_timer() {
    log "Removing systemd timer..."
    
    local service_file="/etc/systemd/system/adaptive-learning-backup.service"
    local timer_file="/etc/systemd/system/adaptive-learning-backup.timer"
    
    # Stop and disable timer
    systemctl stop adaptive-learning-backup.timer 2>/dev/null || true
    systemctl disable adaptive-learning-backup.timer 2>/dev/null || true
    
    # Remove files
    rm -f "$service_file" "$timer_file"
    
    # Reload systemd
    systemctl daemon-reload
    
    success "Systemd timer removed"
}

# ========================================
# MONITORING FUNCTIONS
# ========================================

# Check backup health
check_backup_health() {
    log "Checking backup system health..."
    echo
    
    local backup_dir="${PROJECT_ROOT}/backups"
    local issues=0
    
    # Check backup directory
    if [[ -d "$backup_dir" ]]; then
        success "Backup directory exists: $backup_dir"
        
        # Check backup files
        local backup_count=$(find "$backup_dir" -name "*.tar.gz" | wc -l)
        if [[ $backup_count -gt 0 ]]; then
            success "Found $backup_count backup files"
            
            # Check latest backup age
            local latest_backup=$(find "$backup_dir" -name "*.tar.gz" -printf '%T@ %p\n' | sort -nr | head -1 | cut -d' ' -f2-)
            if [[ -n "$latest_backup" ]]; then
                local backup_age=$(($(date +%s) - $(stat -c%Y "$latest_backup")))
                local hours_old=$((backup_age / 3600))
                
                if [[ $hours_old -lt 25 ]]; then
                    success "Latest backup is $hours_old hours old"
                else
                    warning "Latest backup is $hours_old hours old (>24h)"
                    ((issues++))
                fi
            fi
        else
            warning "No backup files found"
            ((issues++))
        fi
        
        # Check disk space
        local available_space=$(df "$backup_dir" | awk 'NR==2 {print $4}')
        local available_gb=$((available_space / 1024 / 1024))
        
        if [[ $available_gb -gt 5 ]]; then
            success "Available disk space: ${available_gb}GB"
        else
            warning "Low disk space: ${available_gb}GB"
            ((issues++))
        fi
    else
        error "Backup directory not found: $backup_dir"
        ((issues++))
    fi
    
    # Check cron jobs
    if crontab -l 2>/dev/null | grep -q "Adaptive Learning Ecosystem Backup"; then
        success "Backup cron jobs are installed"
    else
        warning "No backup cron jobs found"
        info "Run: $0 install"
        ((issues++))
    fi
    
    # Summary
    echo
    if [[ $issues -eq 0 ]]; then
        success "Backup system health: EXCELLENT ✨"
    elif [[ $issues -le 2 ]]; then
        warning "Backup system health: GOOD (${issues} issues found)"
    else
        error "Backup system health: NEEDS ATTENTION (${issues} issues found)"
    fi
    
    return $issues
}

# Generate backup report
generate_report() {
    log "Generating backup system report..."
    
    local report_file="${PROJECT_ROOT}/backups/backup-report-$(date +%Y%m%d).txt"
    local backup_dir="${PROJECT_ROOT}/backups"
    
    {
        echo "🎓 ADAPTIVE LEARNING ECOSYSTEM - BACKUP REPORT"
        echo "=============================================="
        echo "Generated: $(date)"
        echo "Host: $(hostname)"
        echo "User: $(whoami)"
        echo
        
        echo "📊 BACKUP STATISTICS"
        echo "===================="
        
        if [[ -d "$backup_dir" ]]; then
            local total_backups=$(find "$backup_dir" -name "*.tar.gz" | wc -l)
            local total_size=$(find "$backup_dir" -name "*.tar.gz" -exec du -cb {} + | tail -1 | cut -f1)
            local total_size_gb=$((total_size / 1024 / 1024 / 1024))
            
            echo "Total Backups: $total_backups"
            echo "Total Size: ${total_size_gb}GB"
            echo
            
            echo "📅 RECENT BACKUPS"
            echo "=================="
            find "$backup_dir" -name "*.tar.gz" -printf '%TY-%Tm-%Td %TH:%TM  %f  %s bytes\n' | sort -r | head -10
            echo
        fi
        
        echo "⚙️  BACKUP CONFIGURATION"
        echo "========================"
        echo "Backup Script: $BACKUP_SCRIPT"
        echo "Project Root: $PROJECT_ROOT"
        echo "Backup Directory: $backup_dir"
        echo
        
        echo "📅 SCHEDULED JOBS"
        echo "================="
        if crontab -l 2>/dev/null | grep -q "Adaptive Learning"; then
            crontab -l 2>/dev/null | grep -A10 -B2 "Adaptive Learning"
        else
            echo "No scheduled backup jobs found"
        fi
        echo
        
        echo "🏥 SYSTEM HEALTH"
        echo "================"
        df -h "$backup_dir" 2>/dev/null || echo "Backup directory not found"
        echo
        
    } > "$report_file"
    
    success "Report generated: $report_file"
    
    # Display summary
    echo
    info "📋 Report Summary:"
    if [[ -d "$backup_dir" ]]; then
        local backup_count=$(find "$backup_dir" -name "*.tar.gz" | wc -l)
        echo "  - Backups found: $backup_count"
        
        if [[ $backup_count -gt 0 ]]; then
            local latest=$(find "$backup_dir" -name "*.tar.gz" -printf '%TY-%Tm-%Td %TH:%TM\n' | sort -r | head -1)
            echo "  - Latest backup: $latest"
        fi
    fi
}

# ========================================
# MAIN FUNCTIONS
# ========================================

show_help() {
    cat << EOF
🎓 Adaptive Learning Ecosystem - Backup Scheduler

Usage: $0 [COMMAND] [OPTIONS]

Commands:
    install         Install automated backup cron jobs
    remove          Remove automated backup cron jobs
    schedule        Show current backup schedule
    test            Test backup system functionality
    health          Check backup system health
    report          Generate backup system report
    systemd-install Create systemd timer (requires sudo)
    systemd-remove  Remove systemd timer (requires sudo)
    help            Show this help message

Examples:
    $0 install       # Install daily automated backups
    $0 schedule      # Show current backup schedule
    $0 health        # Check system health
    $0 test          # Test backup functionality

Environment Variables:
    CRON_USER       User for cron jobs (default: current user)

Note: This script manages the scheduling of backups.
      Use backup-system.sh directly for manual backups.

EOF
}

main() {
    echo -e "${PURPLE}
╔══════════════════════════════════════════════════════════════╗
║         📅 ADAPTIVE LEARNING BACKUP SCHEDULER               ║
║               EbroValley Digital - v1.0.0                   ║
╚══════════════════════════════════════════════════════════════╝
${NC}"
    
    local command="${1:-help}"
    
    case "$command" in
        install)
            install_cron_jobs
            ;;
        remove)
            remove_cron_jobs
            ;;
        schedule)
            show_schedule
            ;;
        test)
            test_schedule
            ;;
        health)
            check_backup_health
            ;;
        report)
            generate_report
            ;;
        systemd-install)
            create_systemd_timer
            ;;
        systemd-remove)
            remove_systemd_timer
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            error "Unknown command: $command"
            echo "Use '$0 help' for usage information"
            exit 1
            ;;
    esac
}

# Check prerequisites
if [[ ! -f "$BACKUP_SCRIPT" ]]; then
    error "Backup script not found: $BACKUP_SCRIPT"
    exit 1
fi

# Run main function
main "$@"