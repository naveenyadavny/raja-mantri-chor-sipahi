#!/bin/bash

echo "🎮 Setting up Raja Mantri Chori Sipahi Multiplayer Game..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "Visit: https://nodejs.org/"
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

# Get local IP address
echo "🌐 Getting your laptop's IP address..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    IP=$(hostname -I | awk '{print $1}')
else
    echo "❌ Unsupported operating system"
    exit 1
fi

echo "📍 Your laptop's IP address: $IP"
echo ""
echo "🎯 Game Features:"
echo "✅ Mobile-friendly responsive design"
echo "✅ Real-time multiplayer with Socket.IO"
echo "✅ Room creation and joining system"
echo "✅ Role assignment (Raja, Mantri, Chori, Sipahi, Rani)"
echo "✅ 3-5 players support"
echo "✅ Touch-optimized interface"
echo ""
echo "🚀 Ready to start the game server!"
echo "Run: npm start"
echo ""
echo "📱 How to play:"
echo "1. Start the server: npm start"
echo "2. Open browser: http://$IP:3001"
echo "3. Create a room or join with room code"
echo "4. Share the URL with friends"
echo "5. Start playing when everyone joins!"
echo ""
echo "🌐 Game URL: http://$IP:3001"
echo "📱 Mobile URL: http://$IP:3001 (same URL, mobile-optimized)"
echo ""
echo "🎮 Game Rules:"
echo "• 3 players: Mantri, Chor, Sipahi"
echo "• 4 players: Raja, Mantri, Chor, Sipahi"
echo "• 5 players: Raja, Mantri, Chor, Sipahi, Rani"
echo "• Raja (4-5P) tries to identify the Chor"
echo "• Chor tries to avoid detection"
echo "• Other roles help their respective sides"
echo ""
echo "Ready to start? Run: npm start"
