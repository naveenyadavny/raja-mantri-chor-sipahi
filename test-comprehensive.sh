#!/bin/bash

# Comprehensive Testing Workflow
# Complete testing pipeline for Phase 1 deployment

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Test results tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

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
    ((PASSED_TESTS++))
}

print_error() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((FAILED_TESTS++))
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    
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
                print_warning "MongoDB client not found, skipping connection test"
                return 0
            fi
            ;;
        "redis")
            if command -v redis-cli >/dev/null 2>&1; then
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
    
    if command -v ab >/dev/null 2>&1; then
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

# Function to run unit tests
run_unit_tests() {
    print_test "Running unit tests..."
    
    if [ -f "/var/www/raja-mantri-game/test-unit.js" ]; then
        cd /var/www/raja-mantri-game
        if node test-unit.js > /dev/null 2>&1; then
            print_success "Unit tests passed"
            return 0
        else
            print_error "Unit tests failed"
            return 1
        fi
    else
        print_warning "Unit test file not found, skipping unit tests"
        return 0
    fi
}

# Function to run integration tests
run_integration_tests() {
    print_test "Running integration tests..."
    
    # Test room creation and joining
    local test_room="test-room-$(date +%s)"
    local test_player="test-player-$(date +%s)"
    
    # Test room creation
    if curl -s -X POST "http://localhost:3001/api/rooms" \
        -H "Content-Type: application/json" \
        -d "{\"playerName\":\"$test_player\",\"maxPlayers\":5,\"totalRounds\":3}" \
        | grep -q "roomCode"; then
        print_success "Room creation integration test passed"
    else
        print_error "Room creation integration test failed"
        return 1
    fi
    
    # Test room joining
    if curl -s -X POST "http://localhost:3001/api/rooms/join" \
        -H "Content-Type: application/json" \
        -d "{\"roomCode\":\"$test_room\",\"playerName\":\"$test_player\"}" \
        | grep -q "success"; then
        print_success "Room joining integration test passed"
    else
        print_error "Room joining integration test failed"
        return 1
    fi
    
    return 0
}

# Function to run performance tests
run_performance_tests() {
    print_test "Running performance tests..."
    
    local app_url="http://localhost:3001"
    
    # Test response time
    local start_time=$(date +%s%3N)
    curl -s "$app_url/health" > /dev/null
    local end_time=$(date +%s%3N)
    local response_time=$((end_time - start_time))
    
    if [ "$response_time" -lt 200 ]; then
        print_success "Response time test passed: ${response_time}ms"
    else
        print_error "Response time test failed: ${response_time}ms"
        return 1
    fi
    
    # Test concurrent connections
    run_load_test "$app_url/health" "10" "30"
    
    return 0
}

# Function to run security tests
run_security_tests() {
    print_test "Running security tests..."
    
    # Test firewall
    if ufw status | grep -q "Status: active"; then
        print_success "Firewall is active"
    else
        print_error "Firewall is not active"
        return 1
    fi
    
    # Test SSH configuration
    if grep -q "PermitRootLogin no" /etc/ssh/sshd_config; then
        print_success "SSH root login is disabled"
    else
        print_warning "SSH root login is enabled"
    fi
    
    # Test SSL certificate
    local domain="your-domain.com"
    if [ "$domain" != "your-domain.com" ]; then
        check_ssl_certificate "$domain"
    else
        print_warning "Domain not configured, skipping SSL certificate test"
    fi
    
    return 0
}

# Function to run monitoring tests
run_monitoring_tests() {
    print_test "Running monitoring tests..."
    
    # Test PM2 status
    if pm2 list | grep -q "raja-mantri-game"; then
        print_success "PM2 application is running"
    else
        print_error "PM2 application is not running"
        return 1
    fi
    
    # Test log files
    if [ -d "/var/www/raja-mantri-game/logs" ]; then
        local log_files=$(find "/var/www/raja-mantri-game/logs" -name "*.log" -type f | wc -l)
        if [ "$log_files" -gt 0 ]; then
            print_success "Log files found: $log_files files"
        else
            print_error "No log files found"
            return 1
        fi
    else
        print_error "Log directory does not exist"
        return 1
    fi
    
    # Test backup files
    if [ -d "/var/backups/raja-mantri-game" ]; then
        local backup_files=$(find "/var/backups/raja-mantri-game" -name "*.tar.gz" -type f | wc -l)
        if [ "$backup_files" -gt 0 ]; then
            print_success "Backup files found: $backup_files files"
        else
            print_warning "No backup files found"
        fi
    else
        print_warning "Backup directory does not exist"
    fi
    
    return 0
}

# Main testing function
main() {
    print_header "🧪 COMPREHENSIVE TESTING WORKFLOW"
    echo "Running complete test suite for Raja Mantri Chor Sipahi..."
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
    
    run_test "server.js is readable" "file_readable /var/www/raja-mantri-game/server.js"
    run_test "ecosystem.config.js is readable" "file_readable /var/www/raja-mantri-game/ecosystem.config.js"
    run_test ".env file is readable" "file_readable /var/www/raja-mantri-game/.env"
    run_test "deploy.sh is executable" "[ -x /var/www/raja-mantri-game/deploy.sh ]"
    run_test "backup.sh is executable" "[ -x /var/www/raja-mantri-game/backup.sh ]"
    run_test "monitor.sh is executable" "[ -x /var/www/raja-mantri-game/monitor.sh ]"
    
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
        check_database_connection "mongodb" "$MONGODB_URI"
    else
        print_warning "MONGODB_URI not set, skipping MongoDB connection test"
    fi
    
    if [ -n "$REDIS_URL" ]; then
        check_database_connection "redis" "$REDIS_URL"
    else
        print_warning "REDIS_URL not set, skipping Redis connection test"
    fi
    
    # Application Tests
    print_header "🚀 APPLICATION"
    
    # Test HTTP endpoints
    local app_url="http://localhost:3001"
    check_http_endpoint "$app_url/health" "200"
    check_http_endpoint "$app_url/health/detailed" "200"
    check_http_endpoint "$app_url/ready" "200"
    check_http_endpoint "$app_url" "200"
    
    # Unit Tests
    print_header "🧪 UNIT TESTS"
    run_unit_tests
    
    # Integration Tests
    print_header "🔗 INTEGRATION TESTS"
    run_integration_tests
    
    # Performance Tests
    print_header "⚡ PERFORMANCE TESTS"
    run_performance_tests
    
    # Security Tests
    print_header "🛡️ SECURITY TESTS"
    run_security_tests
    
    # Monitoring Tests
    print_header "📊 MONITORING TESTS"
    run_monitoring_tests
    
    # System Resources Tests
    print_header "💻 SYSTEM RESOURCES"
    
    check_disk_space "/var/www/raja-mantri-game" "10"  # Minimum 10GB
    check_memory_usage "80"  # Maximum 80% memory usage
    check_cpu_usage "80"     # Maximum 80% CPU usage
    
    # Final Results
    print_header "📋 TEST RESULTS SUMMARY"
    
    echo "Total Tests: $TOTAL_TESTS"
    echo "Passed: $PASSED_TESTS"
    echo "Failed: $FAILED_TESTS"
    echo ""
    
    if [ $FAILED_TESTS -eq 0 ]; then
        print_success "🎉 ALL TESTS PASSED! Ready for deployment!"
        echo ""
        echo "Next steps:"
        echo "1. Deploy to production server"
        echo "2. Configure domain and SSL"
        echo "3. Start monitoring"
        echo "4. Launch your game! 🎮"
        exit 0
    else
        print_error "❌ $FAILED_TESTS tests failed. Please fix issues before deployment."
        echo ""
        echo "Failed tests need to be addressed before going live."
        echo "Check the output above for specific error details."
        exit 1
    fi
}

# Run the main function
main "$@"
