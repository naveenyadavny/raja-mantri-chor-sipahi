# Phase 1 Setup Guide: Raja Mantri Chor Sipahi
## Single Server Deployment (0-1k Users)

### 📊 **Phase 1 Overview**
- **Target Users:** 0-1,000 concurrent
- **Monthly Cost:** $40-60
- **Timeline:** Months 1-3
- **Infrastructure:** Single server
- **Uptime Target:** 99.5%
- **Response Time:** <200ms

---

## 🚀 **Quick Start (5 Minutes)**

### **Step 1: Choose Your Server Provider**
```bash
# Recommended providers for Phase 1:
# 1. DigitalOcean Droplet (c-4): $48/month
# 2. Linode Dedicated 8GB: $40/month  
# 3. Vultr High Frequency: $48/month
# 4. AWS EC2 t3.large: $60/month
```

### **Step 2: Deploy Your Server**
```bash
# 1. Create Ubuntu 20.04/22.04 server
# 2. SSH into your server
ssh root@your-server-ip

# 3. Run the Phase 1 deployment script
wget https://raw.githubusercontent.com/yourusername/raja-mantri-chori-sipahi/main/phase1-deploy.sh
chmod +x phase1-deploy.sh
./phase1-deploy.sh
```

### **Step 3: Configure Your Application**
```bash
# 1. Clone your repository
cd /var/www/raja-mantri-game
git clone https://github.com/yourusername/raja-mantri-chori-sipahi.git .

# 2. Configure environment
cp .env.example .env
nano .env

# 3. Start your application
pm2 start ecosystem.config.js --env production
```

### **Step 4: Setup Domain & SSL**
```bash
# 1. Point your domain to server IP
# 2. Install SSL certificate
sudo certbot --nginx -d your-domain.com

# 3. Test your application
curl https://your-domain.com/health
```

---

## 🔧 **Detailed Setup Instructions**

### **Server Requirements**
```yaml
Minimum Specifications:
  CPU: 4 cores
  RAM: 8GB
  Storage: 100GB SSD
  Bandwidth: 1TB/month
  OS: Ubuntu 20.04/22.04

Recommended Providers:
  DigitalOcean: c-4 droplet ($48/month)
  Linode: Dedicated 8GB ($40/month)
  Vultr: High Frequency ($48/month)
  AWS: t3.large ($60/month)
```

### **Software Stack**
```yaml
Runtime:
  Node.js: 18.x
  PM2: Latest (Process Manager)
  
Database:
  MongoDB: Atlas M0 (Free tier)
  Redis: Cloud 30MB (Free tier)
  
CDN:
  CloudFlare: Free tier
  
Monitoring:
  PM2: Built-in monitoring
  UptimeRobot: Free tier
  Let's Encrypt: Free SSL
```

### **Environment Configuration**
```bash
# .env file configuration
NODE_ENV=production
PORT=3001

# Database URLs (Free tiers)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/raja-mantri
REDIS_URL=redis://username:password@redis-host:port

# Security
JWT_SECRET=your-super-secret-jwt-key-here
SESSION_SECRET=your-super-secret-session-key-here

# Monitoring
PM2_MONITORING=true
LOG_LEVEL=info

# Domain
CDN_URL=https://your-domain.com
STATIC_ASSETS_URL=https://your-domain.com/assets
```

---

## 📈 **Performance Optimization**

### **PM2 Cluster Mode**
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'raja-mantri-game',
    script: 'server.js',
    instances: 'max', // Use all CPU cores
    exec_mode: 'cluster', // Cluster mode
    max_memory_restart: '1G', // Restart if memory > 1GB
    node_args: '--max-old-space-size=1024' // Limit Node.js memory
  }]
};
```

### **Database Optimization**
```javascript
// MongoDB connection optimization
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI, {
  maxPoolSize: 10, // Maintain up to 10 socket connections
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  bufferMaxEntries: 0, // Disable mongoose buffering
  bufferCommands: false // Disable mongoose buffering
});

// Redis connection optimization
const redis = require('redis');
const client = redis.createClient({
  url: process.env.REDIS_URL,
  retry_strategy: (options) => {
    if (options.error && options.error.code === 'ECONNREFUSED') {
      return new Error('The server refused the connection');
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
      return new Error('Retry time exhausted');
    }
    if (options.attempt > 10) {
      return undefined;
    }
    return Math.min(options.attempt * 100, 3000);
  }
});
```

### **Static Asset Optimization**
```javascript
// Express static file serving
app.use(express.static('public', {
  maxAge: '1d', // Cache static files for 1 day
  etag: true,
  lastModified: true
}));

// Gzip compression
const compression = require('compression');
app.use(compression());
```

---

## 🔍 **Monitoring & Alerting**

### **PM2 Monitoring**
```bash
# Check application status
pm2 status

# View logs
pm2 logs

# Monitor performance
pm2 monit

# Restart application
pm2 restart all

# Check memory usage
pm2 jlist
```

### **Health Check Endpoints**
```javascript
// Basic health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version
  });
});

// Detailed health check
app.get('/health/detailed', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    checks: {
      database: await checkDatabase(),
      redis: await checkRedis(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    }
  };
  res.json(health);
});
```

### **Uptime Monitoring**
```yaml
# UptimeRobot configuration
Monitors:
  - Name: Main Application
    URL: https://your-domain.com
    Type: HTTP
    Interval: 5 minutes
    
  - Name: Health Check
    URL: https://your-domain.com/health
    Type: HTTP
    Interval: 5 minutes
    
  - Name: Socket.IO
    URL: https://your-domain.com/socket.io
    Type: HTTP
    Interval: 5 minutes
```

---

## 🛡️ **Security Configuration**

### **Firewall Setup**
```bash
# Configure UFW firewall
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw allow 3001/tcp # Application port
sudo ufw --force enable
```

### **SSL Certificate**
```bash
# Install Let's Encrypt SSL
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### **Application Security**
```javascript
// Security middleware
const helmet = require('helmet');
app.use(helmet());

// Rate limiting
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});
app.use(limiter);

// CORS configuration
const cors = require('cors');
app.use(cors({
  origin: ['https://your-domain.com'],
  credentials: true
}));
```

---

## 📊 **Cost Breakdown**

### **Monthly Costs**
```yaml
Infrastructure:
  Server: $40-60
  Domain: $1-2
  SSL: $0 (Let's Encrypt)
  
Services:
  MongoDB Atlas: $0 (Free tier)
  Redis Cloud: $0 (Free tier)
  CloudFlare: $0 (Free tier)
  UptimeRobot: $0 (Free tier)
  
Total: $41-62/month
```

### **Scaling Thresholds**
```yaml
Phase 1 Limits:
  Concurrent Users: 1,000
  Memory Usage: 1GB
  CPU Usage: 80%
  Response Time: 200ms
  
When to Scale:
  - Memory usage consistently > 80%
  - CPU usage consistently > 80%
  - Response time > 200ms
  - User complaints about performance
  - Planning for > 1k users
```

---

## 🚨 **Troubleshooting**

### **Common Issues**

#### **High Memory Usage**
```bash
# Check memory usage
pm2 jlist
free -h

# Restart application
pm2 restart all

# Check for memory leaks
pm2 logs --lines 100
```

#### **High CPU Usage**
```bash
# Check CPU usage
top
htop

# Check PM2 processes
pm2 monit

# Restart application
pm2 restart all
```

#### **Database Connection Issues**
```bash
# Check MongoDB connection
mongo "mongodb+srv://username:password@cluster.mongodb.net/raja-mantri"

# Check Redis connection
redis-cli -h redis-host -p port -a password ping
```

#### **SSL Certificate Issues**
```bash
# Check SSL certificate
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Test SSL
curl -I https://your-domain.com
```

### **Emergency Procedures**

#### **Application Down**
```bash
# 1. Check PM2 status
pm2 status

# 2. Restart application
pm2 restart all

# 3. Check logs
pm2 logs --lines 50

# 4. If still down, restart server
sudo reboot
```

#### **Database Down**
```bash
# 1. Check MongoDB Atlas dashboard
# 2. Check Redis Cloud dashboard
# 3. Restart application
pm2 restart all

# 4. Check connection strings
cat .env | grep -E "(MONGODB|REDIS)"
```

---

## 📈 **Next Steps: Phase 2**

### **When to Move to Phase 2**
- **User Growth:** >1,000 concurrent users
- **Performance Issues:** Response time >200ms
- **Resource Constraints:** Memory/CPU consistently >80%
- **Business Growth:** Revenue >$5,000/month

### **Phase 2 Preparation**
```yaml
Infrastructure Changes:
  - Load balancer (Nginx)
  - Database scaling (MongoDB Atlas M10)
  - Redis scaling (Redis Cloud 100MB)
  - CDN optimization
  - Advanced monitoring

Cost Increase:
  - Server: $40-60 → $200-400
  - Database: $0 → $57
  - Total: $41-62 → $257-457/month
```

---

## 🎯 **Success Metrics**

### **Performance Targets**
```yaml
Response Time: <200ms
Uptime: 99.5%
Memory Usage: <1GB
CPU Usage: <80%
Error Rate: <0.1%
Concurrent Users: 1,000
```

### **Business Metrics**
```yaml
User Acquisition: 100-500 new users/month
Retention Rate: 60-70%
Session Duration: 15-20 minutes
Revenue per User: $0.50-2.00/month
Monthly Revenue: $500-2,000
```

---

## 📞 **Support & Resources**

### **Documentation**
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Redis Cloud Documentation](https://docs.redislabs.com/)
- [CloudFlare Documentation](https://developers.cloudflare.com/)

### **Community Support**
- [GitHub Issues](https://github.com/yourusername/raja-mantri-chori-sipahi/issues)
- [Discord Server](https://discord.gg/your-discord)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/raja-mantri)

### **Professional Support**
- **Email:** support@your-domain.com
- **Response Time:** 24-48 hours
- **Emergency:** 4-8 hours

---

**🎮 Your Raja Mantri Chor Sipahi game is now ready for Phase 1 deployment!**

This setup will handle 0-1,000 concurrent users with 99.5% uptime at a cost of $40-60/month. The foundation is solid and ready to scale to Phase 2 when you reach 1,000+ users.
