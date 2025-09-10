# Raja Mantri Chor Sipahi - Multiplayer Game

A real-time multiplayer web game based on the traditional Indian game "Raja Mantri Chor Sipahi" (King, Minister, Thief, Soldier).

## 🎮 Game Features

- **3-5 Players:** Dynamic role assignment based on player count
- **Real-time Multiplayer:** WebSocket-based communication
- **Mobile Friendly:** Responsive design for all devices
- **Host Controls:** Room management and settings
- **Chat System:** Real-time messaging between players
- **Auto Host Promotion:** Seamless host transfer when players leave

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm (v8 or higher)

### Installation

1. **Clone/Download** the project files
2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the server:**
   ```bash
   npm start
   ```

4. **Open your browser** and go to `http://localhost:3001`

## 🌐 Deployment Options

### Option 1: Heroku (Free Tier)

1. **Install Heroku CLI:**
   ```bash
   # macOS
   brew install heroku/brew/heroku
   
   # Windows
   # Download from https://devcenter.heroku.com/articles/heroku-cli
   ```

2. **Login to Heroku:**
   ```bash
   heroku login
   ```

3. **Create Heroku app:**
   ```bash
   heroku create your-game-name
   ```

4. **Deploy:**
   ```bash
   git add .
   git commit -m "Initial deployment"
   git push heroku main
   ```

5. **Open your app:**
   ```bash
   heroku open
   ```

### Option 2: Railway (Modern Alternative)

1. **Sign up** at [railway.app](https://railway.app)
2. **Connect GitHub** repository
3. **Deploy** automatically
4. **Get public URL** instantly

### Option 3: DigitalOcean App Platform

1. **Create account** at [DigitalOcean](https://www.digitalocean.com)
2. **Create new app** from GitHub
3. **Configure build settings:**
   - Build Command: `npm install`
   - Run Command: `npm start`
4. **Deploy** and get public URL

### Option 4: VPS Deployment (More Control)

1. **Get VPS** (DigitalOcean Droplet, Linode, etc.)
2. **Install Node.js:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **Upload files** to server
4. **Install dependencies:**
   ```bash
   npm install --production
   ```

5. **Use PM2** for process management:
   ```bash
   npm install -g pm2
   pm2 start server.js --name "raja-mantri-game"
   pm2 startup
   pm2 save
   ```

6. **Configure reverse proxy** (Nginx):
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## 🔧 Environment Configuration

### Production Settings

Create a `.env` file for production:
```env
NODE_ENV=production
PORT=3001
```

### Server Configuration

The server automatically:
- Serves static files (HTML, CSS, JS)
- Handles WebSocket connections
- Manages game rooms and players
- Provides real-time communication

## 📱 Mobile Optimization

The game is fully responsive and optimized for:
- **iOS Safari**
- **Android Chrome**
- **Mobile browsers**
- **Touch interactions**

## 🎯 Game Rules

### Roles by Player Count:
- **3 Players:** Mantri, Chor, Sipahi
- **4 Players:** Raja, Mantri, Chor, Sipahi
- **5 Players:** Raja, Rani, Mantri, Chor, Sipahi

### Scoring System:
- **Raja:** 1000 points
- **Rani:** 900 points
- **Mantri:** 800 points
- **Sipahi:** 500 points
- **Chor:** 0 points

### Game Flow:
1. Players join room with code
2. Host starts game
3. Roles assigned randomly
4. Players reveal roles
5. Mantri guesses Chor
6. Points exchanged if wrong guess
7. Next round or game end

## 🛠️ Development

### Local Development:
```bash
npm run dev  # Uses nodemon for auto-restart
```

### File Structure:
```
raja-mantri-chori-sipahi/
├── index.html          # Main game interface
├── style.css           # Game styling
├── script.js           # Client-side logic
├── server.js           # Server-side logic
├── package.json        # Dependencies
└── README.md           # This file
```

## 🔒 Security Considerations

- **Input validation** on server-side
- **Rate limiting** for socket connections
- **CORS** properly configured
- **No sensitive data** stored

## 📊 Performance

- **Lightweight:** Minimal dependencies
- **Fast:** WebSocket real-time communication
- **Scalable:** Can handle multiple rooms
- **Efficient:** Optimized for mobile devices

## 🐛 Troubleshooting

### Common Issues:

1. **Port already in use:**
   ```bash
   # Kill process using port 3001
   lsof -ti:3001 | xargs kill -9
   ```

2. **Socket connection failed:**
   - Check firewall settings
   - Verify port accessibility
   - Ensure WebSocket support

3. **Mobile not working:**
   - Check HTTPS requirement
   - Verify touch event handling
   - Test on different devices

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review server logs
3. Test on different browsers/devices

## 🎉 Enjoy Your Game!

Your Raja Mantri Chor Sipahi game is ready to play! Share the URL with friends and enjoy multiplayer gaming.

---

**Built with ❤️ using Node.js, Express, and Socket.IO**