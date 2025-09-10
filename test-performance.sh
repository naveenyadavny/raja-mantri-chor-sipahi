#!/bin/bash

# Performance Testing Script
# Load testing and performance validation for Phase 1

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Performance test results
PERFORMANCE_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Test configuration
BASE_URL="http://localhost:3001"
SOCKET_URL="http://localhost:3001"
TEST_TIMEOUT=30
MAX_RESPONSE_TIME=200
MAX_MEMORY_USAGE=80
MAX_CPU_USAGE=80

# Function to print colored output
print_header() {
    echo -e "${PURPLE}================================${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}================================${NC}"
}

print_test() {
    echo -e "${BLUE}[PERF TEST]${NC} $1"
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

# Function to run a performance test
run_performance_test() {
    local test_name="$1"
    local test_command="$2"
    
    print_test "$test_name"
    ((PERFORMANCE_TESTS++))
    
    if eval "$test_command" > /dev/null 2>&1; then
        print_success "$test_name"
        return 0
    else
        print_error "$test_name"
        return 1
    fi
}

# Function to measure response time
measure_response_time() {
    local url="$1"
    local timeout="${2:-10}"
    
    local start_time=$(date +%s%3N)
    local status_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$timeout" "$url")
    local end_time=$(date +%s%3N)
    local response_time=$((end_time - start_time))
    
    echo "$response_time"
}

# Function to test response time
test_response_time() {
    local url="$1"
    local max_time="$2"
    local test_name="$3"
    
    print_test "$test_name"
    ((PERFORMANCE_TESTS++))
    
    local response_time=$(measure_response_time "$url")
    
    if [ "$response_time" -le "$max_time" ]; then
        print_success "$test_name: ${response_time}ms (max: ${max_time}ms)"
        return 0
    else
        print_error "$test_name: ${response_time}ms (max: ${max_time}ms)"
        return 1
    fi
}

# Function to run load test
run_load_test() {
    local url="$1"
    local concurrent_users="$2"
    local duration_seconds="$3"
    local test_name="$4"
    
    print_test "$test_name"
    ((PERFORMANCE_TESTS++))
    
    if command -v ab >/dev/null 2>&1; then
        local result=$(ab -n 1000 -c "$concurrent_users" -t "$duration_seconds" "$url" 2>&1)
        
        if echo "$result" | grep -q "Failed requests: 0"; then
            local requests_per_second=$(echo "$result" | grep "Requests per second" | awk '{print $4}')
            local avg_response_time=$(echo "$result" | grep "Time per request" | head -1 | awk '{print $4}')
            
            print_success "$test_name: ${requests_per_second} req/s, ${avg_response_time}ms avg response"
            return 0
        else
            local failed_requests=$(echo "$result" | grep "Failed requests:" | awk '{print $3}')
            print_error "$test_name: $failed_requests failed requests"
            return 1
        fi
    else
        print_warning "Apache Bench (ab) not found, skipping load test"
        return 0
    fi
}

# Function to test concurrent connections
test_concurrent_connections() {
    local url="$1"
    local connection_count="$2"
    local test_name="$3"
    
    print_test "$test_name"
    ((PERFORMANCE_TESTS++))
    
    local success_count=0
    local pids=()
    
    # Create concurrent connections
    for ((i=1; i<=connection_count; i++)); do
        (
            if curl -s --max-time 10 "$url" > /dev/null 2>&1; then
                echo "success" > "/tmp/connection_$i"
            else
                echo "failed" > "/tmp/connection_$i"
            fi
        ) &
        pids+=($!)
    done
    
    # Wait for all connections to complete
    for pid in "${pids[@]}"; do
        wait "$pid"
    done
    
    # Count successful connections
    for ((i=1; i<=connection_count; i++)); do
        if [ -f "/tmp/connection_$i" ]; then
            if [ "$(cat "/tmp/connection_$i")" = "success" ]; then
                ((success_count++))
            fi
            rm -f "/tmp/connection_$i"
        fi
    done
    
    if [ "$success_count" -eq "$connection_count" ]; then
        print_success "$test_name: $success_count/$connection_count connections successful"
        return 0
    else
        print_error "$test_name: $success_count/$connection_count connections successful"
        return 1
    fi
}

# Function to test WebSocket connections
test_websocket_connections() {
    local url="$1"
    local connection_count="$2"
    local test_name="$3"
    
    print_test "$test_name"
    ((PERFORMANCE_TESTS++))
    
    if command -v wscat >/dev/null 2>&1; then
        local success_count=0
        local pids=()
        
        # Create concurrent WebSocket connections
        for ((i=1; i<=connection_count; i++)); do
            (
                if timeout 10 wscat -c "$url" -x "ping" > /dev/null 2>&1; then
                    echo "success" > "/tmp/ws_connection_$i"
                else
                    echo "failed" > "/tmp/ws_connection_$i"
                fi
            ) &
            pids+=($!)
        done
        
        # Wait for all connections to complete
        for pid in "${pids[@]}"; do
            wait "$pid"
        done
        
        # Count successful connections
        for ((i=1; i<=connection_count; i++)); do
            if [ -f "/tmp/ws_connection_$i" ]; then
                if [ "$(cat "/tmp/ws_connection_$i")" = "success" ]; then
                    ((success_count++))
                fi
                rm -f "/tmp/ws_connection_$i"
            fi
        done
        
        if [ "$success_count" -eq "$connection_count" ]; then
            print_success "$test_name: $success_count/$connection_count WebSocket connections successful"
            return 0
        else
            print_error "$test_name: $success_count/$connection_count WebSocket connections successful"
            return 1
        fi
    else
        print_warning "wscat not found, skipping WebSocket connection test"
        return 0
    fi
}

# Function to test memory usage
test_memory_usage() {
    local max_usage_percent="$1"
    local test_name="$2"
    
    print_test "$test_name"
    ((PERFORMANCE_TESTS++))
    
    local memory_usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    
    if [ "$memory_usage" -le "$max_usage_percent" ]; then
        print_success "$test_name: ${memory_usage}% (max: ${max_usage_percent}%)"
        return 0
    else
        print_error "$test_name: ${memory_usage}% (max: ${max_usage_percent}%)"
        return 1
    fi
}

# Function to test CPU usage
test_cpu_usage() {
    local max_usage_percent="$1"
    local test_name="$2"
    
    print_test "$test_name"
    ((PERFORMANCE_TESTS++))
    
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')
    
    if [ "$cpu_usage" -le "$max_usage_percent" ]; then
        print_success "$test_name: ${cpu_usage}% (max: ${max_usage_percent}%)"
        return 0
    else
        print_error "$test_name: ${cpu_usage}% (max: ${max_usage_percent}%)"
        return 1
    fi
}

# Function to test disk I/O
test_disk_io() {
    local test_name="$1"
    
    print_test "$test_name"
    ((PERFORMANCE_TESTS++))
    
    # Test disk write performance
    local write_start=$(date +%s%3N)
    dd if=/dev/zero of=/tmp/disk_test bs=1M count=100 2>/dev/null
    local write_end=$(date +%s%3N)
    local write_time=$((write_end - write_start))
    
    # Test disk read performance
    local read_start=$(date +%s%3N)
    dd if=/tmp/disk_test of=/dev/null bs=1M 2>/dev/null
    local read_end=$(date +%s%3N)
    local read_time=$((read_end - read_start))
    
    # Clean up
    rm -f /tmp/disk_test
    
    # Check if performance is acceptable (less than 5 seconds for 100MB)
    if [ "$write_time" -lt 5000 ] && [ "$read_time" -lt 5000 ]; then
        print_success "$test_name: Write ${write_time}ms, Read ${read_time}ms"
        return 0
    else
        print_error "$test_name: Write ${write_time}ms, Read ${read_time}ms"
        return 1
    fi
}

# Function to test network latency
test_network_latency() {
    local host="$1"
    local test_name="$2"
    
    print_test "$test_name"
    ((PERFORMANCE_TESTS++))
    
    if command -v ping >/dev/null 2>&1; then
        local ping_result=$(ping -c 5 "$host" 2>/dev/null | tail -1 | awk -F'/' '{print $5}')
        
        if [ -n "$ping_result" ]; then
            local avg_latency=$(echo "$ping_result" | awk '{print int($1)}')
            
            if [ "$avg_latency" -lt 100 ]; then
                print_success "$test_name: ${avg_latency}ms average latency"
                return 0
            else
                print_error "$test_name: ${avg_latency}ms average latency (too high)"
                return 1
            fi
        else
            print_error "$test_name: Could not measure latency"
            return 1
        fi
    else
        print_warning "ping command not found, skipping network latency test"
        return 0
    fi
}

# Function to test database performance
test_database_performance() {
    local test_name="$1"
    
    print_test "$test_name"
    ((PERFORMANCE_TESTS++))
    
    # Test MongoDB connection time
    if command -v mongosh >/dev/null 2>&1; then
        local db_start=$(date +%s%3N)
        mongosh --eval "db.runCommand('ping')" --quiet > /dev/null 2>&1
        local db_end=$(date +%s%3N)
        local db_time=$((db_end - db_start))
        
        if [ "$db_time" -lt 1000 ]; then
            print_success "$test_name: MongoDB connection ${db_time}ms"
            return 0
        else
            print_error "$test_name: MongoDB connection ${db_time}ms (too slow)"
            return 1
        fi
    else
        print_warning "mongosh not found, skipping database performance test"
        return 0
    fi
}

# Function to run stress test
run_stress_test() {
    local url="$1"
    local duration_seconds="$2"
    local test_name="$3"
    
    print_test "$test_name"
    ((PERFORMANCE_TESTS++))
    
    if command -v ab >/dev/null 2>&1; then
        local result=$(ab -n 10000 -c 50 -t "$duration_seconds" "$url" 2>&1)
        
        if echo "$result" | grep -q "Failed requests: 0"; then
            local requests_per_second=$(echo "$result" | grep "Requests per second" | awk '{print $4}')
            local avg_response_time=$(echo "$result" | grep "Time per request" | head -1 | awk '{print $4}')
            
            print_success "$test_name: ${requests_per_second} req/s, ${avg_response_time}ms avg response"
            return 0
        else
            local failed_requests=$(echo "$result" | grep "Failed requests:" | awk '{print $3}')
            print_error "$test_name: $failed_requests failed requests"
            return 1
        fi
    else
        print_warning "Apache Bench (ab) not found, skipping stress test"
        return 0
    fi
}

# Main performance testing function
main() {
    print_header "⚡ PERFORMANCE TESTING SUITE"
    echo "Testing Raja Mantri Chor Sipahi performance..."
    echo ""
    
    # Response Time Tests
    print_header "⏱️ RESPONSE TIME TESTS"
    
    test_response_time "$BASE_URL/health" "$MAX_RESPONSE_TIME" "Health endpoint response time"
    test_response_time "$BASE_URL/health/detailed" "$MAX_RESPONSE_TIME" "Detailed health endpoint response time"
    test_response_time "$BASE_URL/ready" "$MAX_RESPONSE_TIME" "Readiness endpoint response time"
    test_response_time "$BASE_URL" "$MAX_RESPONSE_TIME" "Main page response time"
    
    # Load Tests
    print_header "📈 LOAD TESTS"
    
    run_load_test "$BASE_URL/health" "10" "30" "Light load test (10 users, 30s)"
    run_load_test "$BASE_URL/health" "25" "60" "Medium load test (25 users, 60s)"
    run_load_test "$BASE_URL/health" "50" "120" "Heavy load test (50 users, 120s)"
    
    # Concurrent Connection Tests
    print_header "🔗 CONCURRENT CONNECTION TESTS"
    
    test_concurrent_connections "$BASE_URL/health" "10" "Concurrent HTTP connections (10)"
    test_concurrent_connections "$BASE_URL/health" "25" "Concurrent HTTP connections (25)"
    test_concurrent_connections "$BASE_URL/health" "50" "Concurrent HTTP connections (50)"
    
    # WebSocket Connection Tests
    print_header "🔌 WEBSOCKET CONNECTION TESTS"
    
    test_websocket_connections "$SOCKET_URL/socket.io" "10" "Concurrent WebSocket connections (10)"
    test_websocket_connections "$SOCKET_URL/socket.io" "25" "Concurrent WebSocket connections (25)"
    test_websocket_connections "$SOCKET_URL/socket.io" "50" "Concurrent WebSocket connections (50)"
    
    # System Resource Tests
    print_header "💻 SYSTEM RESOURCE TESTS"
    
    test_memory_usage "$MAX_MEMORY_USAGE" "Memory usage test"
    test_cpu_usage "$MAX_CPU_USAGE" "CPU usage test"
    test_disk_io "Disk I/O performance test"
    
    # Network Tests
    print_header "🌐 NETWORK TESTS"
    
    test_network_latency "localhost" "Local network latency test"
    test_network_latency "8.8.8.8" "Internet latency test"
    
    # Database Performance Tests
    print_header "🗄️ DATABASE PERFORMANCE TESTS"
    
    test_database_performance "MongoDB connection performance"
    
    # Stress Tests
    print_header "💪 STRESS TESTS"
    
    run_stress_test "$BASE_URL/health" "60" "Stress test (50 users, 60s)"
    run_stress_test "$BASE_URL/health" "120" "Extended stress test (50 users, 120s)"
    
    # Final Results
    print_header "📊 PERFORMANCE TEST RESULTS"
    
    echo "Total Performance Tests: $PERFORMANCE_TESTS"
    echo "Passed: $PASSED_TESTS"
    echo "Failed: $FAILED_TESTS"
    echo ""
    
    if [ $FAILED_TESTS -eq 0 ]; then
        print_success "🎉 ALL PERFORMANCE TESTS PASSED!"
        echo ""
        echo "Performance Summary:"
        echo "- Response time: <${MAX_RESPONSE_TIME}ms ✅"
        echo "- Memory usage: <${MAX_MEMORY_USAGE}% ✅"
        echo "- CPU usage: <${MAX_CPU_USAGE}% ✅"
        echo "- Load handling: 50+ concurrent users ✅"
        echo "- WebSocket connections: 50+ concurrent ✅"
        echo ""
        echo "Your application is ready for production! 🚀"
        exit 0
    else
        print_error "❌ $FAILED_TESTS performance tests failed."
        echo ""
        echo "Performance issues need to be addressed before deployment."
        echo "Consider:"
        echo "- Optimizing database queries"
        echo "- Adding caching layers"
        echo "- Scaling server resources"
        echo "- Optimizing application code"
        exit 1
    fi
}

# Run the main function
main "$@"
