#!/bin/bash

# Pre-Deployment Validation Script
# Comprehensive validation before going live

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Validation results
VALIDATION_PASSED=0
VALIDATION_FAILED=0
TOTAL_VALIDATIONS=0

# Function to print colored output
print_header() {
    echo -e "${PURPLE}================================${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}================================${NC}"
}

print_validation() {
    echo -e "${BLUE}[VALIDATE]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((VALIDATION_PASSED++))
}

print_error() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((VALIDATION_FAILED++))
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Function to run a validation
run_validation() {
    local validation_name="$1"
    local validation_command="$2"
    
    print_validation "$validation_name"
    ((TOTAL_VALIDATIONS++))
    
    if eval "$validation_command" > /dev/null 2>&1; then
        print_success "$validation_name"
        return 0
    else
        print_error "$validation_name"
        return 1
    fi
}

# Function to check if a service is running
service_running() {
    local service="$1"
    systemctl is-active --quiet "$service"
}

# Function to check if a port is open
port_open() {
    local port="$1"
    netstat -tuln | grep -q ":$port "
}

# Function to check file exists and is readable
file_readable() {
    local file="$1"
    [ -f "$file" ] && [ -r "$file" ]
}

# Function to check directory exists and is writable
directory_writable() {
    local dir="$1"
    [ -d "$dir" ] && [ -w "$dir" ]
}

# Function to check environment variable
check_env_var() {
    local var_name="$1"
    local var_value="${!var_name}"
    
    if [ -n "$var_value" ]; then
        print_success "Environment variable $var_name is set"
        return 0
    else
        print_error "Environment variable $var_name is not set"
        return 1
    fi
}

# Function to check SSL certificate
check_ssl_certificate() {
    local domain="$1"
    local port="${2:-443}"
    
    if command -v openssl >/dev/null 2>&1; then
        local cert_info=$(echo | openssl s_client -servername "$domain" -connect "$domain:$port" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)
        
        if [ -n "$cert_info" ]; then
            print_success "SSL certificate for $domain is valid"
            return 0
        else
            print_error "SSL certificate for $domain is invalid or not found"
            return 1
        fi
    else
        print_warning "OpenSSL not found, skipping SSL certificate validation"
        return 0
    fi
}

# Function to check database connection
check_database_connection() {
    local db_type="$1"
    local connection_string="$2"
    
    case "$db_type" in
        "mongodb")
            if command -v mongosh >/dev/null 2>&1; then
                mongosh "$connection_string" --eval "db.runCommand('ping')" > /dev/null 2>&1
            elif command -v mongo >/dev/null 2>&1; then
                mongo "$connection_string" --eval "db.runCommand('ping')" > /dev/null 2>&1
            else
                print_warning "MongoDB client not found, skipping connection validation"
                return 0
            fi
            ;;
        "redis")
            if command -v redis-cli >/dev/null 2>&1; then
                redis-cli -u "$connection_string" ping > /dev/null 2>&1
            else
                print_warning "Redis client not found, skipping connection validation"
                return 0
            fi
            ;;
        *)
            print_warning "Unknown database type: $db_type"
            return 1
            ;;
    esac
}

# Function to check HTTP endpoint
check_http_endpoint() {
    local url="$1"
    local expected_status="$2"
    local timeout="${3:-10}"
    
    local status_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$timeout" "$url")
    
    if [ "$status_code" = "$expected_status" ]; then
        print_success "HTTP endpoint $url returned status $status_code"
        return 0
    else
        print_error "HTTP endpoint $url returned status $status_code, expected $expected_status"
        return 1
    fi
}

# Function to check disk space
check_disk_space() {
    local path="$1"
    local min_space_gb="$2"
    
    local available_space=$(df "$path" | awk 'NR==2 {print $4}')
    local available_gb=$((available_space / 1024 / 1024))
    
    if [ "$available_gb" -ge "$min_space_gb" ]; then
        print_success "Disk space check: ${available_gb}GB available (minimum: ${min_space_gb}GB)"
        return 0
    else
        print_error "Disk space check: ${available_gb}GB available (minimum: ${min_space_gb}GB)"
        return 1
    fi
}

# Function to check memory usage
check_memory_usage() {
    local max_usage_percent="$1"
    
    local memory_usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    
    if [ "$memory_usage" -le "$max_usage_percent" ]; then
        print_success "Memory usage: ${memory_usage}% (maximum: ${max_usage_percent}%)"
        return 0
    else
        print_error "Memory usage: ${memory_usage}% (maximum: ${max_usage_percent}%)"
        return 1
    fi
}

# Function to check CPU usage
check_cpu_usage() {
    local max_usage_percent="$1"
    
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')
    
    if [ "$cpu_usage" -le "$max_usage_percent" ]; then
        print_success "CPU usage: ${cpu_usage}% (maximum: ${max_usage_percent}%)"
        return 0
    else
        print_error "CPU usage: ${cpu_usage}% (maximum: ${max_usage_percent}%)"
        return 1
    fi
}

# Function to check PM2 status
check_pm2_status() {
    if command -v pm2 >/dev/null 2>&1; then
        if pm2 list | grep -q "raja-mantri-game"; then
            print_success "PM2 application is running"
            return 0
        else
            print_error "PM2 application is not running"
            return 1
        fi
    else
        print_error "PM2 is not installed"
        return 1
    fi
}

# Function to check log files
check_log_files() {
    local log_dir="/var/www/raja-mantri-game/logs"
    
    if [ -d "$log_dir" ]; then
        local log_files=$(find "$log_dir" -name "*.log" -type f | wc -l)
        if [ "$log_files" -gt 0 ]; then
            print_success "Log files found: $log_files files"
            return 0
        else
            print_error "No log files found in $log_dir"
            return 1
        fi
    else
        print_error "Log directory $log_dir does not exist"
        return 1
    fi
}

# Function to check backup files
check_backup_files() {
    local backup_dir="/var/backups/raja-mantri-game"
    
    if [ -d "$backup_dir" ]; then
        local backup_files=$(find "$backup_dir" -name "*.tar.gz" -type f | wc -l)
        if [ "$backup_files" -gt 0 ]; then
            print_success "Backup files found: $backup_files files"
            return 0
        else
            print_warning "No backup files found in $backup_dir"
            return 0
        fi
    else
        print_warning "Backup directory $backup_dir does not exist"
        return 0
    fi
}

# Function to check cron jobs
check_cron_jobs() {
    local cron_jobs=$(crontab -l 2>/dev/null | grep -c "raja-mantri-game" || true)
    
    if [ "$cron_jobs" -gt 0 ]; then
        print_success "Cron jobs found: $cron_jobs jobs"
        return 0
    else
        print_warning "No cron jobs found for raja-mantri-game"
        return 0
    fi
}

# Function to check firewall status
check_firewall_status() {
    if command -v ufw >/dev/null 2>&1; then
        if ufw status | grep -q "Status: active"; then
            print_success "Firewall is active"
            return 0
        else
            print_warning "Firewall is not active"
            return 0
        fi
    else
        print_warning "UFW firewall not found"
        return 0
    fi
}

# Function to check SSH configuration
check_ssh_config() {
    local ssh_config="/etc/ssh/sshd_config"
    
    if [ -f "$ssh_config" ]; then
        if grep -q "PermitRootLogin no" "$ssh_config"; then
            print_success "SSH root login is disabled"
            return 0
        else
            print_warning "SSH root login is enabled"
            return 0
        fi
    else
        print_warning "SSH config file not found"
        return 0
    fi
}

# Main validation function
main() {
    print_header "🔍 PRE-DEPLOYMENT VALIDATION"
    echo "Validating Raja Mantri Chor Sipahi before deployment..."
    echo ""
    
    # System Requirements Validation
    print_header "🔧 SYSTEM REQUIREMENTS"
    
    run_validation "Node.js 18.x installed" "node --version | grep -q 'v18'"
    run_validation "npm installed" "command -v npm"
    run_validation "PM2 installed" "command -v pm2"
    run_validation "Git installed" "command -v git"
    run_validation "curl installed" "command -v curl"
    run_validation "wget installed" "command -v wget"
    
    # File System Validation
    print_header "📁 FILE SYSTEM"
    
    run_validation "Application directory exists" "[ -d /var/www/raja-mantri-game ]"
    run_validation "Logs directory exists" "[ -d /var/www/raja-mantri-game/logs ]"
    run_validation "package.json exists" "[ -f /var/www/raja-mantri-game/package.json ]"
    run_validation "server.js exists" "[ -f /var/www/raja-mantri-game/server.js ]"
    run_validation "ecosystem.config.js exists" "[ -f /var/www/raja-mantri-game/ecosystem.config.js ]"
    run_validation ".env file exists" "[ -f /var/www/raja-mantri-game/.env ]"
    
    # File Permissions Validation
    print_header "🔐 FILE PERMISSIONS"
    
    run_validation "server.js is readable" "file_readable /var/www/raja-mantri-game/server.js"
    run_validation "ecosystem.config.js is readable" "file_readable /var/www/raja-mantri-game/ecosystem.config.js"
    run_validation ".env file is readable" "file_readable /var/www/raja-mantri-game/.env"
    run_validation "deploy.sh is executable" "[ -x /var/www/raja-mantri-game/deploy.sh ]"
    run_validation "backup.sh is executable" "[ -x /var/www/raja-mantri-game/backup.sh ]"
    run_validation "monitor.sh is executable" "[ -x /var/www/raja-mantri-game/monitor.sh ]"
    
    # Environment Variables Validation
    print_header "🌍 ENVIRONMENT VARIABLES"
    
    # Source the .env file
    if [ -f "/var/www/raja-mantri-game/.env" ]; then
        source "/var/www/raja-mantri-game/.env"
    fi
    
    check_env_var "NODE_ENV"
    check_env_var "PORT"
    check_env_var "MONGODB_URI"
    check_env_var "REDIS_URL"
    check_env_var "JWT_SECRET"
    check_env_var "SESSION_SECRET"
    
    # Network Validation
    print_header "🌐 NETWORK CONNECTIVITY"
    
    run_validation "Port 22 (SSH) is open" "port_open 22"
    run_validation "Port 80 (HTTP) is open" "port_open 80"
    run_validation "Port 443 (HTTPS) is open" "port_open 443"
    run_validation "Port 3001 (App) is open" "port_open 3001"
    
    # Database Connection Validation
    print_header "🗄️ DATABASE CONNECTIONS"
    
    if [ -n "$MONGODB_URI" ]; then
        check_database_connection "mongodb" "$MONGODB_URI"
    else
        print_warning "MONGODB_URI not set, skipping MongoDB connection validation"
    fi
    
    if [ -n "$REDIS_URL" ]; then
        check_database_connection "redis" "$REDIS_URL"
    else
        print_warning "REDIS_URL not set, skipping Redis connection validation"
    fi
    
    # Application Validation
    print_header "🚀 APPLICATION"
    
    check_pm2_status
    
    # Test HTTP endpoints
    local app_url="http://localhost:3001"
    check_http_endpoint "$app_url/health" "200"
    check_http_endpoint "$app_url/health/detailed" "200"
    check_http_endpoint "$app_url/ready" "200"
    check_http_endpoint "$app_url" "200"
    
    # SSL Certificate Validation
    print_header "🔒 SSL CERTIFICATE"
    
    # Test SSL certificate (replace with actual domain)
    local domain="your-domain.com"
    if [ "$domain" != "your-domain.com" ]; then
        check_ssl_certificate "$domain"
    else
        print_warning "Domain not configured, skipping SSL certificate validation"
    fi
    
    # System Resources Validation
    print_header "💻 SYSTEM RESOURCES"
    
    check_disk_space "/var/www/raja-mantri-game" "10"  # Minimum 10GB
    check_memory_usage "80"  # Maximum 80% memory usage
    check_cpu_usage "80"     # Maximum 80% CPU usage
    
    # Security Validation
    print_header "🛡️ SECURITY"
    
    check_firewall_status
    check_ssh_config
    
    # Monitoring Validation
    print_header "📊 MONITORING"
    
    check_log_files
    check_backup_files
    check_cron_jobs
    
    # Final Results
    print_header "📋 VALIDATION RESULTS SUMMARY"
    
    echo "Total Validations: $TOTAL_VALIDATIONS"
    echo "Passed: $VALIDATION_PASSED"
    echo "Failed: $VALIDATION_FAILED"
    echo ""
    
    if [ $VALIDATION_FAILED -eq 0 ]; then
        print_success "🎉 ALL VALIDATIONS PASSED! Ready for deployment!"
        echo ""
        echo "Next steps:"
        echo "1. Deploy to production server"
        echo "2. Configure domain and SSL"
        echo "3. Start monitoring"
        echo "4. Launch your game! 🎮"
        exit 0
    else
        print_error "❌ $VALIDATION_FAILED validations failed. Please fix issues before deployment."
        echo ""
        echo "Failed validations need to be addressed before going live."
        echo "Check the output above for specific error details."
        exit 1
    fi
}

# Run the main function
main "$@"
