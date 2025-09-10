module.exports = {
  apps: [{
    name: 'raja-mantri-game',
    script: 'server.js',
    instances: 'max', // Use all CPU cores
    exec_mode: 'cluster', // Cluster mode for better performance
    env: {
      NODE_ENV: 'development',
      PORT: 3001,
      MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/raja-mantri',
      REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001,
      MONGODB_URI: process.env.MONGODB_URI,
      REDIS_URL: process.env.REDIS_URL
    },
    // Performance settings
    max_memory_restart: '1G', // Restart if memory usage exceeds 1GB
    node_args: '--max-old-space-size=1024', // Limit Node.js memory to 1GB
    
    // Logging
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Auto-restart settings
    watch: false, // Don't watch files in production
    ignore_watch: ['node_modules', 'logs'],
    
    // Health monitoring
    min_uptime: '10s', // Minimum uptime before considering app stable
    max_restarts: 10, // Maximum restarts in 1 minute
    
    // Advanced settings
    kill_timeout: 5000, // Time to wait before force killing
    wait_ready: true, // Wait for ready event
    listen_timeout: 10000, // Time to wait for listen event
    
    // Environment-specific settings
    env_development: {
      NODE_ENV: 'development',
      PORT: 3001,
      MONGODB_URI: 'mongodb://localhost:27017/raja-mantri-dev',
      REDIS_URL: 'redis://localhost:6379'
    },
    
    env_staging: {
      NODE_ENV: 'staging',
      PORT: 3001,
      MONGODB_URI: process.env.MONGODB_URI_STAGING,
      REDIS_URL: process.env.REDIS_URL_STAGING
    }
  }],
  
  // Deployment configuration
  deploy: {
    production: {
      user: 'deploy',
      host: ['your-server-ip'],
      ref: 'origin/main',
      repo: 'https://github.com/yourusername/raja-mantri-chori-sipahi.git',
      path: '/var/www/raja-mantri-game',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    },
    
    staging: {
      user: 'deploy',
      host: ['staging-server-ip'],
      ref: 'origin/develop',
      repo: 'https://github.com/yourusername/raja-mantri-chori-sipahi.git',
      path: '/var/www/raja-mantri-game-staging',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env staging',
      'pre-setup': ''
    }
  }
};