#!/bin/bash

# Quick Local Deployment Script
# Test your Raja Mantri Chor Sipahi game locally before production

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Function to print colored output
print_header() {
    echo -e "${PURPLE}================================${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}================================${NC}"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Check if Node.js is installed
check_nodejs() {
    if command -v node >/dev/null 2>&1; then
        local node_version=$(node --version)
        print_success "Node.js installed: $node_version"
        return 0
    else
        print_error "Node.js is not installed. Please install Node.js 18.x or higher."
        return 1
    fi
}

# Check if npm is installed
check_npm() {
    if command -v npm >/dev/null 2>&1; then
        local npm_version=$(npm --version)
        print_success "npm installed: $npm_version"
        return 0
    else
        print_error "npm is not installed. Please install npm."
        return 1
    fi
}

# Install dependencies
install_dependencies() {
    print_info "Installing dependencies..."
    if npm install; then
        print_success "Dependencies installed successfully"
        return 0
    else
        print_error "Failed to install dependencies"
        return 1
    fi
}

# Create .env file if it doesn't exist
create_env_file() {
    if [ ! -f ".env" ]; then
        print_info "Creating .env file..."
        cat > .env << EOF
# Raja Mantri Chor Sipahi Environment Configuration
NODE_ENV=development
PORT=3001

# Database Configuration (Free tiers)
MONGODB_URI=mongodb://localhost:27017/raja-mantri-dev
REDIS_URL=redis://localhost:6379

# Security (Generate your own secrets)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
SESSION_SECRET=your-super-secret-session-key-change-this-in-production

# Monitoring
PM2_MONITORING=true
LOG_LEVEL=info

# Domain (Update with your actual domain)
CDN_URL=http://localhost:3001
STATIC_ASSETS_URL=http://localhost:3001/assets
EOF
        print_success ".env file created"
        print_warning "Please update the JWT_SECRET and SESSION_SECRET in .env file"
    else
        print_info ".env file already exists"
    fi
}

# Test the application
test_application() {
    print_info "Testing application..."
    
    # Start the application in background
    print_info "Starting application..."
    node server.js &
    local app_pid=$!
    
    # Wait for application to start
    sleep 5
    
    # Test if application is running
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        print_success "Application is running on http://localhost:3001"
        
        # Test main page
        if curl -s http://localhost:3001 > /dev/null 2>&1; then
            print_success "Main page is accessible"
        else
            print_error "Main page is not accessible"
        fi
        
        # Test health endpoint
        if curl -s http://localhost:3001/health > /dev/null 2>&1; then
            print_success "Health endpoint is working"
        else
            print_error "Health endpoint is not working"
        fi
        
        # Stop the application
        kill $app_pid 2>/dev/null || true
        print_success "Application test completed"
        return 0
    else
        print_error "Application failed to start"
        kill $app_pid 2>/dev/null || true
        return 1
    fi
}

# Show deployment options
show_deployment_options() {
    print_header "🚀 DEPLOYMENT OPTIONS"
    
    echo "Your Raja Mantri Chor Sipahi game is ready for deployment!"
    echo ""
    echo "Choose your deployment option:"
    echo ""
    echo "1. 🏠 Local Testing (Current)"
    echo "   - Run locally for development"
    echo "   - Cost: $0"
    echo "   - Command: npm start"
    echo ""
    echo "2. ☁️  Cloud Deployment (Recommended)"
    echo "   - Deploy to cloud provider"
    echo "   - Cost: $40-60/month"
    echo "   - Providers: DigitalOcean, Linode, Vultr, AWS"
    echo "   - Command: ./phase1-deploy.sh"
    echo ""
    echo "3. 🆓 Free Hosting"
    echo "   - Deploy to free hosting platforms"
    echo "   - Cost: $0"
    echo "   - Providers: Heroku, Railway, Render"
    echo "   - Command: ./heroku-deploy-guide.sh"
    echo ""
    echo "4. 🏢 Enterprise Deployment"
    echo "   - Scale to 100k+ users"
    echo "   - Cost: $500k+/month"
    echo "   - Multi-region, enterprise-grade"
    echo "   - Command: Follow enterprise architecture guide"
    echo ""
}

# Main deployment function
main() {
    print_header "🎮 RAJA MANTRI CHOR SIPAHI DEPLOYMENT"
    echo "Deploying your multiplayer game..."
    echo ""
    
    # Check prerequisites
    print_header "🔧 CHECKING PREREQUISITES"
    
    if ! check_nodejs; then
        print_error "Please install Node.js first: https://nodejs.org/"
        exit 1
    fi
    
    if ! check_npm; then
        print_error "Please install npm first"
        exit 1
    fi
    
    # Install dependencies
    print_header "📦 INSTALLING DEPENDENCIES"
    if ! install_dependencies; then
        print_error "Failed to install dependencies"
        exit 1
    fi
    
    # Create environment file
    print_header "🌍 SETTING UP ENVIRONMENT"
    create_env_file
    
    # Test application
    print_header "🧪 TESTING APPLICATION"
    if ! test_application; then
        print_error "Application test failed. Please check the logs."
        exit 1
    fi
    
    # Show deployment options
    show_deployment_options
    
    print_header "🎉 READY FOR DEPLOYMENT!"
    
    echo "Your game is ready! Here's what you can do next:"
    echo ""
    echo "🚀 Quick Start:"
    echo "   npm start                    # Run locally"
    echo "   ./phase1-deploy.sh           # Deploy to cloud"
    echo "   ./heroku-deploy-guide.sh     # Deploy to Heroku"
    echo ""
    echo "🧪 Testing:"
    echo "   npm run test:all            # Run all tests"
    echo "   ./test-comprehensive.sh     # Comprehensive testing"
    echo ""
    echo "📊 Monitoring:"
    echo "   npm run pm2:start          # Start with PM2"
    echo "   npm run pm2:monit          # Monitor performance"
    echo ""
    echo "🎮 Your game will be available at:"
    echo "   Local: http://localhost:3001"
    echo "   Production: https://your-domain.com"
    echo ""
    print_success "Deployment preparation completed! 🎮"
}

# Run the main function
main "$@"
