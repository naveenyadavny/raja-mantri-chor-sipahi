// Phase 1 Monitoring Configuration
// Basic monitoring for single server setup

const monitoringConfig = {
    // PM2 Monitoring
    pm2: {
        enabled: true,
        features: [
            'Process monitoring',
            'Memory usage tracking',
            'CPU usage tracking',
            'Restart on crash',
            'Log rotation',
            'Health checks'
        ],
        alerts: {
            memoryThreshold: 80, // Alert if memory usage > 80%
            cpuThreshold: 80,   // Alert if CPU usage > 80%
            restartThreshold: 5 // Alert if restarts > 5 in 1 hour
        }
    },

    // Uptime Monitoring
    uptime: {
        provider: 'UptimeRobot',
        tier: 'Free',
        features: [
            '50 monitors',
            '5-minute intervals',
            'Email alerts',
            'SMS alerts (limited)',
            'Webhook notifications'
        ],
        monitors: [
            {
                name: 'Main Application',
                url: 'https://your-domain.com',
                type: 'HTTP',
                interval: 5
            },
            {
                name: 'Health Check',
                url: 'https://your-domain.com/health',
                type: 'HTTP',
                interval: 5
            },
            {
                name: 'Socket.IO',
                url: 'https://your-domain.com/socket.io',
                type: 'HTTP',
                interval: 5
            }
        ]
    },

    // Log Monitoring
    logs: {
        // PM2 Logs
        pm2Logs: {
            enabled: true,
            rotation: true,
            maxSize: '10M',
            maxFiles: 5,
            compress: true
        },
        
        // Application Logs
        appLogs: {
            level: 'info',
            format: 'combined',
            fields: ['timestamp', 'level', 'message', 'userId', 'roomId']
        },
        
        // Error Tracking
        errorTracking: {
            enabled: true,
            captureUnhandledRejections: true,
            captureUncaughtExceptions: true
        }
    },

    // Performance Monitoring
    performance: {
        // Response Time Monitoring
        responseTime: {
            enabled: true,
            threshold: 200, // Alert if response time > 200ms
            sampleRate: 0.1 // Monitor 10% of requests
        },
        
        // Memory Monitoring
        memory: {
            enabled: true,
            threshold: 1024, // Alert if memory > 1GB
            checkInterval: 30000 // Check every 30 seconds
        },
        
        // CPU Monitoring
        cpu: {
            enabled: true,
            threshold: 80, // Alert if CPU > 80%
            checkInterval: 30000 // Check every 30 seconds
        }
    },

    // Database Monitoring
    database: {
        // MongoDB Monitoring
        mongodb: {
            enabled: true,
            connectionPool: {
                maxConnections: 100,
                minConnections: 5,
                alertThreshold: 80 // Alert if connections > 80
            },
            queryPerformance: {
                enabled: true,
                slowQueryThreshold: 100 // Alert if query > 100ms
            }
        },
        
        // Redis Monitoring
        redis: {
            enabled: true,
            memoryUsage: {
                enabled: true,
                threshold: 25, // Alert if memory > 25MB
                checkInterval: 60000 // Check every minute
            },
            connectionCount: {
                enabled: true,
                threshold: 25 // Alert if connections > 25
            }
        }
    },

    // Alert Configuration
    alerts: {
        // Email Alerts
        email: {
            enabled: true,
            recipients: ['admin@your-domain.com'],
            smtp: {
                host: 'smtp.gmail.com',
                port: 587,
                secure: false,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            }
        },
        
        // Slack Alerts
        slack: {
            enabled: false, // Enable when you have Slack webhook
            webhook: process.env.SLACK_WEBHOOK_URL,
            channel: '#alerts'
        },
        
        // SMS Alerts
        sms: {
            enabled: false, // Enable when you have SMS service
            provider: 'twilio',
            phoneNumber: process.env.ADMIN_PHONE
        }
    },

    // Health Check Endpoints
    healthChecks: {
        // Basic Health Check
        basic: {
            path: '/health',
            method: 'GET',
            response: {
                status: 'ok',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                version: process.env.npm_package_version
            }
        },
        
        // Detailed Health Check
        detailed: {
            path: '/health/detailed',
            method: 'GET',
            checks: [
                'database',
                'redis',
                'memory',
                'cpu',
                'disk'
            ]
        },
        
        // Readiness Check
        readiness: {
            path: '/ready',
            method: 'GET',
            checks: [
                'database',
                'redis',
                'application'
            ]
        }
    }
};

// Monitoring Implementation
class Phase1Monitor {
    constructor() {
        this.alerts = [];
        this.metrics = {
            responseTime: [],
            memoryUsage: [],
            cpuUsage: [],
            errorCount: 0,
            requestCount: 0
        };
    }

    // Start monitoring
    start() {
        console.log('🔍 Starting Phase 1 monitoring...');
        
        // Start PM2 monitoring
        this.startPM2Monitoring();
        
        // Start performance monitoring
        this.startPerformanceMonitoring();
        
        // Start health checks
        this.startHealthChecks();
        
        console.log('✅ Monitoring started successfully');
    }

    // PM2 Monitoring
    startPM2Monitoring() {
        setInterval(() => {
            // Check PM2 status
            const pm2Status = this.getPM2Status();
            
            if (pm2Status.memory > monitoringConfig.pm2.alerts.memoryThreshold) {
                this.sendAlert('HIGH_MEMORY', `Memory usage: ${pm2Status.memory}%`);
            }
            
            if (pm2Status.cpu > monitoringConfig.pm2.alerts.cpuThreshold) {
                this.sendAlert('HIGH_CPU', `CPU usage: ${pm2Status.cpu}%`);
            }
        }, 30000); // Check every 30 seconds
    }

    // Performance Monitoring
    startPerformanceMonitoring() {
        setInterval(() => {
            const memoryUsage = process.memoryUsage();
            const cpuUsage = process.cpuUsage();
            
            // Track metrics
            this.metrics.memoryUsage.push(memoryUsage.heapUsed);
            this.metrics.cpuUsage.push(cpuUsage.user);
            
            // Keep only last 100 measurements
            if (this.metrics.memoryUsage.length > 100) {
                this.metrics.memoryUsage.shift();
                this.metrics.cpuUsage.shift();
            }
            
            // Check thresholds
            if (memoryUsage.heapUsed > monitoringConfig.performance.memory.threshold * 1024 * 1024) {
                this.sendAlert('HIGH_MEMORY', `Memory usage: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`);
            }
        }, 30000);
    }

    // Health Checks
    startHealthChecks() {
        // Basic health check
        setInterval(() => {
            this.performHealthCheck();
        }, 60000); // Check every minute
    }

    // Get PM2 Status
    getPM2Status() {
        // This would integrate with PM2 API
        return {
            memory: Math.random() * 100, // Placeholder
            cpu: Math.random() * 100,    // Placeholder
            uptime: process.uptime()
        };
    }

    // Perform Health Check
    async performHealthCheck() {
        try {
            // Check database connection
            const dbHealth = await this.checkDatabaseHealth();
            
            // Check Redis connection
            const redisHealth = await this.checkRedisHealth();
            
            // Check application health
            const appHealth = this.checkApplicationHealth();
            
            if (!dbHealth || !redisHealth || !appHealth) {
                this.sendAlert('HEALTH_CHECK_FAILED', 'One or more health checks failed');
            }
        } catch (error) {
            this.sendAlert('HEALTH_CHECK_ERROR', error.message);
        }
    }

    // Check Database Health
    async checkDatabaseHealth() {
        // Implement database health check
        return true; // Placeholder
    }

    // Check Redis Health
    async checkRedisHealth() {
        // Implement Redis health check
        return true; // Placeholder
    }

    // Check Application Health
    checkApplicationHealth() {
        // Check if application is responding
        return true; // Placeholder
    }

    // Send Alert
    sendAlert(type, message) {
        const alert = {
            type,
            message,
            timestamp: new Date().toISOString(),
            severity: this.getSeverity(type)
        };
        
        this.alerts.push(alert);
        
        // Send email alert
        if (monitoringConfig.alerts.email.enabled) {
            this.sendEmailAlert(alert);
        }
        
        // Send Slack alert
        if (monitoringConfig.alerts.slack.enabled) {
            this.sendSlackAlert(alert);
        }
        
        console.log(`🚨 Alert: ${type} - ${message}`);
    }

    // Get Alert Severity
    getSeverity(type) {
        const severityMap = {
            'HIGH_MEMORY': 'warning',
            'HIGH_CPU': 'warning',
            'HEALTH_CHECK_FAILED': 'critical',
            'HEALTH_CHECK_ERROR': 'critical'
        };
        
        return severityMap[type] || 'info';
    }

    // Send Email Alert
    sendEmailAlert(alert) {
        // Implement email sending
        console.log(`📧 Email alert sent: ${alert.message}`);
    }

    // Send Slack Alert
    sendSlackAlert(alert) {
        // Implement Slack notification
        console.log(`💬 Slack alert sent: ${alert.message}`);
    }

    // Get Metrics Summary
    getMetricsSummary() {
        return {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            cpu: process.cpuUsage(),
            alerts: this.alerts.length,
            requests: this.metrics.requestCount,
            errors: this.metrics.errorCount
        };
    }
}

module.exports = {
    monitoringConfig,
    Phase1Monitor
};
