#!/bin/bash

# Raja Mantri Chor Sipahi - Deployment Script
# This script helps you deploy your game to various platforms

echo "🎮 Raja Mantri Chor Sipahi - Deployment Helper"
echo "=============================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first:"
    echo "   https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Test the server
echo "🧪 Testing the server..."
timeout 5s node server.js &
SERVER_PID=$!
sleep 2

if kill -0 $SERVER_PID 2>/dev/null; then
    echo "✅ Server starts successfully"
    kill $SERVER_PID
else
    echo "❌ Server failed to start"
    exit 1
fi

echo ""
echo "🚀 Deployment Options:"
echo "======================"
echo ""
echo "1. 🌐 Heroku (Free tier available)"
echo "   - Install Heroku CLI: brew install heroku/brew/heroku"
echo "   - Login: heroku login"
echo "   - Create app: heroku create your-game-name"
echo "   - Deploy: git add . && git commit -m 'Deploy' && git push heroku main"
echo ""
echo "2. 🚄 Railway (Modern alternative)"
echo "   - Sign up at: https://railway.app"
echo "   - Connect GitHub repository"
echo "   - Deploy automatically"
echo ""
echo "3. 🌊 DigitalOcean App Platform"
echo "   - Create account at: https://www.digitalocean.com"
echo "   - Create new app from GitHub"
echo "   - Configure build settings"
echo ""
echo "4. 🖥️  VPS Deployment (More control)"
echo "   - Get VPS (DigitalOcean Droplet, Linode, etc.)"
echo "   - Install Node.js on server"
echo "   - Upload files and run: npm install --production"
echo "   - Use PM2: npm install -g pm2 && pm2 start server.js"
echo ""

# Ask user what they want to do
echo "What would you like to do?"
echo "1) Start local server for testing"
echo "2) Show Heroku deployment steps"
echo "3) Show Railway deployment steps"
echo "4) Show VPS deployment steps"
echo "5) Exit"

read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        echo "🚀 Starting local server..."
        echo "Open http://localhost:3001 in your browser"
        node server.js
        ;;
    2)
        echo "📋 Heroku Deployment Steps:"
        echo "=========================="
        echo "1. Install Heroku CLI:"
        echo "   brew install heroku/brew/heroku"
        echo ""
        echo "2. Login to Heroku:"
        echo "   heroku login"
        echo ""
        echo "3. Create Heroku app:"
        echo "   heroku create your-game-name"
        echo ""
        echo "4. Initialize git (if not already):"
        echo "   git init"
        echo "   git add ."
        echo "   git commit -m 'Initial commit'"
        echo ""
        echo "5. Deploy:"
        echo "   git push heroku main"
        echo ""
        echo "6. Open your app:"
        echo "   heroku open"
        ;;
    3)
        echo "📋 Railway Deployment Steps:"
        echo "============================"
        echo "1. Sign up at: https://railway.app"
        echo "2. Connect your GitHub account"
        echo "3. Create new project from GitHub"
        echo "4. Select your repository"
        echo "5. Railway will automatically detect Node.js"
        echo "6. Deploy and get your public URL"
        echo ""
        echo "Note: Make sure your code is pushed to GitHub first!"
        ;;
    4)
        echo "📋 VPS Deployment Steps:"
        echo "======================="
        echo "1. Get a VPS (DigitalOcean Droplet, Linode, Vultr)"
        echo "2. Connect via SSH"
        echo "3. Install Node.js:"
        echo "   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -"
        echo "   sudo apt-get install -y nodejs"
        echo ""
        echo "4. Upload your files (use SCP, SFTP, or Git)"
        echo "5. Install dependencies:"
        echo "   npm install --production"
        echo ""
        echo "6. Install PM2 for process management:"
        echo "   npm install -g pm2"
        echo "   pm2 start server.js --name 'raja-mantri-game'"
        echo "   pm2 startup"
        echo "   pm2 save"
        echo ""
        echo "7. Configure firewall (open port 3001)"
        echo "8. Optional: Set up Nginx reverse proxy"
        ;;
    5)
        echo "👋 Goodbye! Your game is ready for deployment."
        exit 0
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again."
        exit 1
        ;;
esac
