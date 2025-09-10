#!/bin/bash

# Phase 1 Pre-Deployment Testing Suite
# Comprehensive testing before going live

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Test results tracking
TESTS_PASSED=0
TESTS_FAILED=0
TOTAL_TESTS=0

# Function to print colored output
print_header() {
    echo -e "${PURPLE}================================${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}================================${NC}"
}

print_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((TESTS_PASSED++))
}

print_error() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((TESTS_FAILED++))
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_result="$3"
    
    print_test "$test_name"
    ((TOTAL_TESTS++))
    
    if eval "$test_command" > /dev/null 2>&1; then
        print_success "$test_name"
        return 0
    else
        print_error "$test_name"
        return 1
    fi
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a port is open
port_open() {
    local port="$1"
    netstat -tuln | grep -q ":$port "
}

# Function to check if a service is running
service_running() {
    local service="$1"
    systemctl is-active --quiet "$service"
}

# Function to check file permissions
check_file_permissions() {
    local file="$1"
    local expected_perms="$2"
    
    if [ -f "$file" ]; then
        local actual_perms=$(stat -c "%a" "$file")
        if [ "$actual_perms" = "$expected_perms" ]; then
            return 0
        else
            print_warning "File $file has permissions $actual_perms, expected $expected_perms"
            return 1
        fi
    else
        print_error "File $file does not exist"
        return 1
    fi
}

# Function to check environment variables
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

# Function to test HTTP endpoint
test_http_endpoint() {
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

# Function to test WebSocket connection
test_websocket() {
    local url="$1"
    local timeout="${2:-10}"
    
    # Use wscat if available, otherwise use curl
    if command_exists wscat; then
        timeout "$timeout" wscat -c "$url" -x "ping" > /dev/null 2>&1
    else
        # Fallback to curl for WebSocket testing
        curl -s --max-time "$timeout" "$url" > /dev/null 2>&1
    fi
}

# Function to check database connection
test_database_connection() {
    local db_type="$1"
    local connection_string="$2"
    
    case "$db_type" in
        "mongodb")
            if command_exists mongosh; then
                mongosh "$connection_string" --eval "db.runCommand('ping')" > /dev/null 2>&1
            elif command_exists mongo; then
                mongo "$connection_string" --eval "db.runCommand('ping')" > /dev/null 2>&1
            else
                print_warning "MongoDB client not found, skipping connection test"
                return 0
            fi
            ;;
        "redis")
            if command_exists redis-cli; then
                redis-cli -u "$connection_string" ping > /dev/null 2>&1
            else
                print_warning "Redis client not found, skipping connection test"
                return 0
            fi
            ;;
        *)
            print_warning "Unknown database type: $db_type"
            return 1
            ;;
    esac
}

# Function to check SSL certificate
test_ssl_certificate() {
    local domain="$1"
    local port="${2:-443}"
    
    if command_exists openssl; then
        local cert_info=$(echo | openssl s_client -servername "$domain" -connect "$domain:$port" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)
        
        if [ -n "$cert_info" ]; then
            print_success "SSL certificate for $domain is valid"
            return 0
        else
            print_error "SSL certificate for $domain is invalid or not found"
            return 1
        fi
    else
        print_warning "OpenSSL not found, skipping SSL certificate test"
        return 0
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

# Function to run load test
run_load_test() {
    local url="$1"
    local concurrent_users="$2"
    local duration_seconds="$3"
    
    if command_exists ab; then
        print_test "Load testing $url with $concurrent_users concurrent users for ${duration_seconds}s"
        
        local result=$(ab -n 1000 -c "$concurrent_users" -t "$duration_seconds" "$url" 2>&1)
        
        if echo "$result" | grep -q "Failed requests: 0"; then
            print_success "Load test passed: 0 failed requests"
            return 0
        else
            local failed_requests=$(echo "$result" | grep "Failed requests:" | awk '{print $3}')
            print_error "Load test failed: $failed_requests failed requests"
            return 1
        fi
    else
        print_warning "Apache Bench (ab) not found, skipping load test"
        return 0
    fi
}

# Main testing function
main() {
    print_header "🧪 PHASE 1 PRE-DEPLOYMENT TESTING SUITE"
    echo "Testing Raja Mantri Chor Sipahi before deployment..."
    echo ""
    
    # System Requirements Tests
    print_header "🔧 SYSTEM REQUIREMENTS"
    
    run_test "Node.js 18.x installed" "node --version | grep -q 'v18'"
    run_test "npm installed" "command_exists npm"
    run_test "PM2 installed" "command_exists pm2"
    run_test "Git installed" "command_exists git"
    run_test "curl installed" "command_exists curl"
    run_test "wget installed" "command_exists wget"
    
    # File System Tests
    print_header "📁 FILE SYSTEM"
    
    run_test "Application directory exists" "[ -d /var/www/raja-mantri-game ]"
    run_test "Logs directory exists" "[ -d /var/www/raja-mantri-game/logs ]"
    run_test "package.json exists" "[ -f /var/www/raja-mantri-game/package.json ]"
    run_test "server.js exists" "[ -f /var/www/raja-mantri-game/server.js ]"
    run_test "ecosystem.config.js exists" "[ -f /var/www/raja-mantri-game/ecosystem.config.js ]"
    run_test ".env file exists" "[ -f /var/www/raja-mantri-game/.env ]"
    
    # File Permissions Tests
    print_header "🔐 FILE PERMISSIONS"
    
    check_file_permissions "/var/www/raja-mantri-game/server.js" "644"
    check_file_permissions "/var/www/raja-mantri-game/ecosystem.config.js" "644"
    check_file_permissions "/var/www/raja-mantri-game/.env" "600"
    check_file_permissions "/var/www/raja-mantri-game/deploy.sh" "755"
    check_file_permissions "/var/www/raja-mantri-game/backup.sh" "755"
    check_file_permissions "/var/www/raja-mantri-game/monitor.sh" "755"
    
    # Environment Variables Tests
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
    
    # Network Tests
    print_header "🌐 NETWORK CONNECTIVITY"
    
    run_test "Port 22 (SSH) is open" "port_open 22"
    run_test "Port 80 (HTTP) is open" "port_open 80"
    run_test "Port 443 (HTTPS) is open" "port_open 443"
    run_test "Port 3001 (App) is open" "port_open 3001"
    
    # Database Connection Tests
    print_header "🗄️ DATABASE CONNECTIONS"
    
    if [ -n "$MONGODB_URI" ]; then
        test_database_connection "mongodb" "$MONGODB_URI"
    else
        print_warning "MONGODB_URI not set, skipping MongoDB connection test"
    fi
    
    if [ -n "$REDIS_URL" ]; then
        test_database_connection "redis" "$REDIS_URL"
    else
        print_warning "REDIS_URL not set, skipping Redis connection test"
    fi
    
    # Application Tests
    print_header "🚀 APPLICATION TESTS"
    
    # Check if PM2 is running
    if pm2 list | grep -q "raja-mantri-game"; then
        print_success "PM2 application is running"
        
        # Test HTTP endpoints
        local app_url="http://localhost:3001"
        local domain_url="https://your-domain.com"  # Replace with actual domain
        
        test_http_endpoint "$app_url/health" "200"
        test_http_endpoint "$app_url/health/detailed" "200"
        test_http_endpoint "$app_url/ready" "200"
        
        # Test WebSocket connection
        if test_websocket "$app_url/socket.io"; then
            print_success "WebSocket connection test passed"
        else
            print_error "WebSocket connection test failed"
        fi
        
        # Test static files
        test_http_endpoint "$app_url" "200"
        test_http_endpoint "$app_url/style.css" "200"
        test_http_endpoint "$app_url/script.js" "200"
        
    else
        print_error "PM2 application is not running"
    fi
    
    # SSL Certificate Tests
    print_header "🔒 SSL CERTIFICATE"
    
    # Test SSL certificate (replace with actual domain)
    local domain="your-domain.com"
    if [ "$domain" != "your-domain.com" ]; then
        test_ssl_certificate "$domain"
    else
        print_warning "Domain not configured, skipping SSL certificate test"
    fi
    
    # System Resource Tests
    print_header "💻 SYSTEM RESOURCES"
    
    check_disk_space "/var/www/raja-mantri-game" "10"  # Minimum 10GB
    check_memory_usage "80"  # Maximum 80% memory usage
    check_cpu_usage "80"     # Maximum 80% CPU usage
    
    # Security Tests
    print_header "🛡️ SECURITY"
    
    run_test "Firewall is enabled" "ufw status | grep -q 'Status: active'"
    run_test "SSH key authentication enabled" "[ -f ~/.ssh/authorized_keys ]"
    run_test "Root login disabled" "! grep -q 'PermitRootLogin yes' /etc/ssh/sshd_config"
    
    # Performance Tests
    print_header "⚡ PERFORMANCE"
    
    local app_url="http://localhost:3001"
    run_load_test "$app_url/health" "10" "30"  # 10 concurrent users for 30 seconds
    
    # Monitoring Tests
    print_header "📊 MONITORING"
    
    run_test "PM2 monitoring enabled" "pm2 list | grep -q 'raja-mantri-game'"
    run_test "Log files are being created" "[ -f /var/www/raja-mantri-game/logs/combined.log ]"
    run_test "Backup script is executable" "[ -x /var/www/raja-mantri-game/backup.sh ]"
    run_test "Monitor script is executable" "[ -x /var/www/raja-mantri-game/monitor.sh ]"
    
    # Final Results
    print_header "📋 TEST RESULTS SUMMARY"
    
    echo "Total Tests: $TOTAL_TESTS"
    echo "Passed: $TESTS_PASSED"
    echo "Failed: $TESTS_FAILED"
    echo ""
    
    if [ $TESTS_FAILED -eq 0 ]; then
        print_success "🎉 ALL TESTS PASSED! Ready for deployment!"
        echo ""
        echo "Next steps:"
        echo "1. Deploy to production server"
        echo "2. Configure domain and SSL"
        echo "3. Start monitoring"
        echo "4. Launch your game! 🎮"
        exit 0
    else
        print_error "❌ $TESTS_FAILED tests failed. Please fix issues before deployment."
        echo ""
        echo "Failed tests need to be addressed before going live."
        echo "Check the output above for specific error details."
        exit 1
    fi
}

# Run the main function
main "$@"
