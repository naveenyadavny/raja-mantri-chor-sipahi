#!/bin/bash

# Phase 1 Deployment Script for Raja Mantri Chor Sipahi
# Single Server Setup (0-1k users)
# Cost: $40-60/month

set -e  # Exit on any error

echo "🚀 Starting Phase 1 Deployment for Raja Mantri Chor Sipahi"
echo "📊 Target: 0-1k concurrent users"
echo "💰 Cost: $40-60/month"
echo "⏱️  Timeline: Months 1-3"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root for security reasons"
   exit 1
fi

# Update system packages
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
print_status "Installing Node.js 18.x..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify Node.js installation
node_version=$(node --version)
npm_version=$(npm --version)
print_success "Node.js installed: $node_version"
print_success "npm installed: $npm_version"

# Install PM2 globally
print_status "Installing PM2 process manager..."
sudo npm install -g pm2

# Verify PM2 installation
pm2_version=$(pm2 --version)
print_success "PM2 installed: $pm2_version"

# Install additional system dependencies
print_status "Installing system dependencies..."
sudo apt-get install -y curl wget git unzip

# Create application directory
print_status "Setting up application directory..."
sudo mkdir -p /var/www/raja-mantri-game
sudo chown $USER:$USER /var/www/raja-mantri-game
cd /var/www/raja-mantri-game

# Clone repository (replace with your actual repo)
print_status "Cloning application repository..."
if [ ! -d ".git" ]; then
    print_warning "Please clone your repository manually:"
    echo "git clone https://github.com/yourusername/raja-mantri-chori-sipahi.git ."
    echo "Then run this script again."
    exit 1
fi

# Install application dependencies
print_status "Installing application dependencies..."
npm install

# Create logs directory
print_status "Creating logs directory..."
mkdir -p logs

# Create environment file template
print_status "Creating environment configuration..."
cat > .env.example << EOF
# Phase 1 Environment Configuration
NODE_ENV=production
PORT=3001

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/raja-mantri
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=your-super-secret-jwt-key-here
SESSION_SECRET=your-super-secret-session-key-here

# Monitoring
PM2_MONITORING=true
LOG_LEVEL=info

# CDN Configuration
CDN_URL=https://your-domain.com
STATIC_ASSETS_URL=https://your-domain.com/assets
EOF

print_warning "Please copy .env.example to .env and configure your environment variables:"
echo "cp .env.example .env"
echo "nano .env"

# Setup firewall
print_status "Configuring firewall..."
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw allow 3001/tcp # Application port
sudo ufw --force enable

print_success "Firewall configured"

# Setup SSL with Let's Encrypt (optional)
print_status "Setting up SSL with Let's Encrypt..."
if command -v certbot &> /dev/null; then
    print_success "Certbot is already installed"
else
    print_status "Installing Certbot..."
    sudo apt-get install -y certbot python3-certbot-nginx
fi

# Create PM2 startup script
print_status "Setting up PM2 startup script..."
pm2 startup
print_warning "Please run the command shown above to enable PM2 startup"

# Create systemd service for PM2
print_status "Creating systemd service..."
sudo tee /etc/systemd/system/raja-mantri-game.service > /dev/null << EOF
[Unit]
Description=Raja Mantri Chor Sipahi Game
After=network.target

[Service]
Type=forking
User=$USER
WorkingDirectory=/var/www/raja-mantri-game
ExecStart=/usr/bin/pm2 start ecosystem.config.js --env production
ExecReload=/usr/bin/pm2 reload ecosystem.config.js --env production
ExecStop=/usr/bin/pm2 stop ecosystem.config.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd and enable service
sudo systemctl daemon-reload
sudo systemctl enable raja-mantri-game.service

print_success "Systemd service created and enabled"

# Create backup script
print_status "Creating backup script..."
cat > backup.sh << 'EOF'
#!/bin/bash
# Backup script for Raja Mantri Chor Sipahi

BACKUP_DIR="/var/backups/raja-mantri-game"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup application files
tar -czf $BACKUP_DIR/app_$DATE.tar.gz /var/www/raja-mantri-game --exclude=node_modules --exclude=logs

# Backup database (if using local MongoDB)
if command -v mongodump &> /dev/null; then
    mongodump --out $BACKUP_DIR/db_$DATE
fi

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
find $BACKUP_DIR -name "db_*" -mtime +7 -exec rm -rf {} \;

echo "Backup completed: $DATE"
EOF

chmod +x backup.sh

# Setup cron job for backups
print_status "Setting up automated backups..."
(crontab -l 2>/dev/null; echo "0 2 * * * /var/www/raja-mantri-game/backup.sh") | crontab -

print_success "Automated backups configured (daily at 2 AM)"

# Create monitoring script
print_status "Creating monitoring script..."
cat > monitor.sh << 'EOF'
#!/bin/bash
# Monitoring script for Raja Mantri Chor Sipahi

# Check if PM2 is running
if ! pm2 list | grep -q "raja-mantri-game"; then
    echo "ERROR: Raja Mantri game is not running!"
    pm2 start ecosystem.config.js --env production
    exit 1
fi

# Check memory usage
MEMORY_USAGE=$(pm2 jlist | jq -r '.[] | select(.name=="raja-mantri-game") | .monit.memory')
if [ "$MEMORY_USAGE" -gt 1000000000 ]; then  # 1GB in bytes
    echo "WARNING: High memory usage: $MEMORY_USAGE bytes"
fi

# Check CPU usage
CPU_USAGE=$(pm2 jlist | jq -r '.[] | select(.name=="raja-mantri-game") | .monit.cpu')
if [ "$CPU_USAGE" -gt 80 ]; then
    echo "WARNING: High CPU usage: $CPU_USAGE%"
fi

echo "Monitoring check completed at $(date)"
EOF

chmod +x monitor.sh

# Setup cron job for monitoring
(crontab -l 2>/dev/null; echo "*/5 * * * * /var/www/raja-mantri-game/monitor.sh") | crontab -

print_success "Automated monitoring configured (every 5 minutes)"

# Create deployment script
print_status "Creating deployment script..."
cat > deploy.sh << 'EOF'
#!/bin/bash
# Deployment script for Raja Mantri Chor Sipahi

set -e

echo "🚀 Deploying Raja Mantri Chor Sipahi..."

# Pull latest changes
git pull origin main

# Install dependencies
npm install

# Run tests (if available)
if [ -f "package.json" ] && grep -q '"test"' package.json; then
    npm test
fi

# Restart application
pm2 reload ecosystem.config.js --env production

echo "✅ Deployment completed successfully!"
EOF

chmod +x deploy.sh

print_success "Deployment script created"

# Final setup instructions
echo ""
echo "🎉 Phase 1 Setup Completed!"
echo ""
echo "📋 Next Steps:"
echo "1. Configure your environment variables:"
echo "   cp .env.example .env"
echo "   nano .env"
echo ""
echo "2. Start your application:"
echo "   pm2 start ecosystem.config.js --env production"
echo ""
echo "3. Check application status:"
echo "   pm2 status"
echo "   pm2 logs"
echo ""
echo "4. Setup your domain and SSL:"
echo "   sudo certbot --nginx -d your-domain.com"
echo ""
echo "5. Monitor your application:"
echo "   pm2 monit"
echo ""
echo "💰 Monthly Cost Breakdown:"
echo "   Server: $40-60"
echo "   Database: $0 (Free tiers)"
echo "   CDN: $0 (CloudFlare free)"
echo "   Monitoring: $0 (Free tools)"
echo "   Total: $40-60/month"
echo ""
echo "📊 Performance Targets:"
echo "   Concurrent Users: 0-1,000"
echo "   Response Time: <200ms"
echo "   Uptime: 99.5%"
echo "   Memory Usage: <1GB"
echo ""
echo "🔧 Useful Commands:"
echo "   pm2 status          # Check app status"
echo "   pm2 logs            # View logs"
echo "   pm2 monit           # Monitor performance"
echo "   pm2 restart all     # Restart all apps"
echo "   ./deploy.sh         # Deploy updates"
echo "   ./backup.sh         # Manual backup"
echo "   ./monitor.sh        # Check system health"
echo ""
print_success "Phase 1 setup completed successfully! 🎮"
