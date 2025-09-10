# Phase 1 Quick Reference Card
## Raja Mantri Chor Sipahi - Single Server Setup

### 🚀 **Quick Deploy (5 Minutes)**
```bash
# 1. Create server (Ubuntu 20.04, 4 CPU, 8GB RAM)
# 2. SSH into server
ssh root@your-server-ip

# 3. Run deployment script
wget https://raw.githubusercontent.com/yourusername/raja-mantri-chori-sipahi/main/phase1-deploy.sh
chmod +x phase1-deploy.sh
./phase1-deploy.sh

# 4. Configure environment
cd /var/www/raja-mantri-game
cp .env.example .env
nano .env

# 5. Start application
pm2 start ecosystem.config.js --env production
```

### 💰 **Cost Breakdown**
| Service | Provider | Cost/Month |
|---------|----------|------------|
| Server | DigitalOcean/Linode | $40-60 |
| Database | MongoDB Atlas M0 | $0 |
| Cache | Redis Cloud 30MB | $0 |
| CDN | CloudFlare Free | $0 |
| SSL | Let's Encrypt | $0 |
| Monitoring | UptimeRobot Free | $0 |
| **Total** | | **$40-60** |

### 📊 **Performance Targets**
- **Concurrent Users:** 0-1,000
- **Response Time:** <200ms
- **Uptime:** 99.5%
- **Memory Usage:** <1GB
- **CPU Usage:** <80%

### 🔧 **Essential Commands**
```bash
# Check status
pm2 status
pm2 logs
pm2 monit

# Restart application
pm2 restart all

# Deploy updates
./deploy.sh

# Manual backup
./backup.sh

# Check system health
./monitor.sh
```

### 🛡️ **Security Checklist**
- [ ] Firewall configured (UFW)
- [ ] SSL certificate installed (Let's Encrypt)
- [ ] Environment variables secured
- [ ] SSH key authentication enabled
- [ ] Regular security updates enabled

### 📈 **Scaling Triggers**
Move to Phase 2 when:
- **Users:** >1,000 concurrent
- **Memory:** >80% consistently
- **CPU:** >80% consistently
- **Response Time:** >200ms
- **Revenue:** >$5,000/month

### 🚨 **Emergency Contacts**
- **GitHub Issues:** [Create Issue](https://github.com/yourusername/raja-mantri-chori-sipahi/issues)
- **Email Support:** support@your-domain.com
- **Emergency:** 4-8 hour response

### 📚 **Key Files**
- `ecosystem.config.js` - PM2 configuration
- `phase1-deploy.sh` - Deployment script
- `phase1-monitoring.js` - Monitoring setup
- `.env` - Environment variables
- `PHASE1_SETUP_GUIDE.md` - Detailed guide

### 🎯 **Success Metrics**
- **User Growth:** 100-500 new users/month
- **Retention:** 60-70%
- **Session Duration:** 15-20 minutes
- **Revenue:** $500-2,000/month
- **Uptime:** 99.5%+

---

**🎮 Ready to launch your Raja Mantri Chor Sipahi game!**

This Phase 1 setup will handle your first 1,000 users with enterprise-grade reliability at a fraction of the cost. Perfect for validating your game concept and building your user base before scaling to Phase 2.
