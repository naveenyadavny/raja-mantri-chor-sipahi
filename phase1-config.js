# Phase 1: Single Server Configuration
# Handles 0-1k concurrent users
# Cost: $0-500/month

# Server Specifications
server_specs = {
    # Recommended VPS/Dedicated Server
    cpu: "4 cores",
    memory: "8GB RAM",
    storage: "100GB SSD",
    bandwidth: "1TB/month",
    
    # Cloud Provider Options
    providers: {
        # DigitalOcean
        digitalocean: {
            droplet: "c-4", # 4 vCPU, 8GB RAM
            cost: "$48/month",
            features: ["SSD", "99.99% uptime", "Global datacenters"]
        },
        
        # AWS EC2
        aws: {
            instance: "t3.large", # 2 vCPU, 8GB RAM
            cost: "$60/month",
            features: ["Free tier eligible", "Auto-scaling", "Load balancer"]
        },
        
        # Linode
        linode: {
            plan: "Dedicated 8GB", # 4 vCPU, 8GB RAM
            cost: "$40/month",
            features: ["SSD", "99.9% uptime", "24/7 support"]
        },
        
        # Vultr
        vultr: {
            plan: "High Frequency", # 4 vCPU, 8GB RAM
            cost: "$48/month",
            features: ["NVMe SSD", "99.99% uptime", "Global locations"]
        }
    }
}

# Application Configuration
app_config = {
    # Node.js Application
    nodejs: {
        version: "18.x",
        pm2: true, # Process manager
        cluster_mode: true, # Use all CPU cores
        instances: "max" # Use all available cores
    },
    
    # Database
    database: {
        # MongoDB Atlas (Free tier)
        mongodb: {
            provider: "MongoDB Atlas",
            tier: "M0 Sandbox", # Free tier
            storage: "512MB",
            connections: "100",
            cost: "$0/month"
        },
        
        # Redis (In-memory cache)
        redis: {
            provider: "Redis Cloud",
            tier: "Fixed 30MB", # Free tier
            memory: "30MB",
            connections: "30",
            cost: "$0/month"
        }
    },
    
    # CDN and Static Assets
    cdn: {
        provider: "CloudFlare", # Free tier
        features: ["Global CDN", "SSL", "DDoS protection"],
        cost: "$0/month"
    },
    
    # Monitoring
    monitoring: {
        # Basic monitoring with PM2
        pm2_monitoring: {
            features: ["Process monitoring", "Logs", "Restart on crash"],
            cost: "$0/month"
        },
        
        # Uptime monitoring
        uptime: {
            provider: "UptimeRobot", # Free tier
            checks: "50 monitors",
            interval: "5 minutes",
            cost: "$0/month"
        }
    }
}

# Deployment Strategy
deployment = {
    # Single Server Setup
    server_setup: [
        "Install Node.js 18.x",
        "Install PM2 process manager",
        "Setup MongoDB Atlas connection",
        "Setup Redis Cloud connection",
        "Configure CloudFlare CDN",
        "Setup basic monitoring",
        "Configure SSL certificates",
        "Setup automated backups"
    ],
    
    # Security Measures
    security: [
        "Firewall configuration",
        "SSH key authentication",
        "Regular security updates",
        "SSL/TLS encryption",
        "Environment variables for secrets"
    ],
    
    # Performance Optimization
    performance: [
        "PM2 cluster mode",
        "Gzip compression",
        "Static file caching",
        "Database connection pooling",
        "Redis caching layer"
    ]
}

# Cost Breakdown
cost_breakdown = {
    # Monthly Costs
    monthly: {
        server: "$40-60", # VPS/Dedicated server
        database: "$0", # Free tiers
        cdn: "$0", # CloudFlare free
        monitoring: "$0", # Free tools
        total: "$40-60/month"
    },
    
    # One-time Setup Costs
    setup: {
        domain: "$10-15/year",
        ssl_certificate: "$0", # Let's Encrypt free
        initial_setup: "$0", # DIY
        total: "$10-15/year"
    }
}

module.exports = {
    server_specs,
    app_config,
    deployment,
    cost_breakdown
};
