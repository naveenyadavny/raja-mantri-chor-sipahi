// Enterprise Architecture for 100k Concurrent Users
// Multi-region, multi-cloud, high-availability design

const enterpriseArchitecture = {
    // Global Infrastructure
    regions: {
        primary: {
            location: 'us-east-1', // Virginia
            capacity: '40%', // 40k users
            services: ['game', 'room', 'user', 'chat', 'analytics'],
            databases: ['mongodb-primary', 'redis-primary']
        },
        secondary: {
            location: 'eu-west-1', // Ireland
            capacity: '30%', // 30k users
            services: ['game', 'room', 'user', 'chat'],
            databases: ['mongodb-secondary', 'redis-secondary']
        },
        tertiary: {
            location: 'ap-southeast-1', // Singapore
            capacity: '20%', // 20k users
            services: ['game', 'room', 'user'],
            databases: ['mongodb-tertiary', 'redis-tertiary']
        },
        edge: {
            location: 'global',
            capacity: '10%', // 10k users
            services: ['cdn', 'edge-compute'],
            databases: ['edge-cache']
        }
    },

    // Service Architecture
    services: {
        // API Gateway Cluster
        apiGateway: {
            instances: 50,
            technology: 'nginx-plus',
            capacity: '100k requests/second',
            features: ['rate-limiting', 'circuit-breaker', 'load-balancing']
        },

        // Game Service Cluster
        gameService: {
            instances: 100,
            technology: 'node.js',
            capacity: '50k concurrent games',
            scaling: 'auto-scale',
            regions: ['primary', 'secondary', 'tertiary']
        },

        // Room Management Cluster
        roomService: {
            instances: 50,
            technology: 'node.js',
            capacity: '30k active rooms',
            scaling: 'auto-scale',
            regions: ['primary', 'secondary', 'tertiary']
        },

        // User Management Cluster
        userService: {
            instances: 30,
            technology: 'node.js',
            capacity: '100k users',
            scaling: 'auto-scale',
            regions: ['primary', 'secondary']
        },

        // Chat Service Cluster
        chatService: {
            instances: 40,
            technology: 'node.js',
            capacity: '100k concurrent chats',
            scaling: 'auto-scale',
            regions: ['primary', 'secondary']
        },

        // Analytics Service Cluster
        analyticsService: {
            instances: 20,
            technology: 'node.js',
            capacity: '1M events/minute',
            scaling: 'auto-scale',
            regions: ['primary']
        },

        // Notification Service Cluster
        notificationService: {
            instances: 25,
            technology: 'node.js',
            capacity: '500k notifications/hour',
            scaling: 'auto-scale',
            regions: ['primary', 'secondary']
        }
    },

    // Database Architecture
    databases: {
        // MongoDB Sharded Cluster
        mongodb: {
            shards: 20,
            replicaSets: 3, // per shard
            totalInstances: 60,
            technology: 'mongodb-enterprise',
            capacity: '100k concurrent connections',
            features: ['sharding', 'replication', 'backup', 'monitoring']
        },

        // Redis Cluster
        redis: {
            nodes: 30,
            technology: 'redis-enterprise',
            capacity: '1M operations/second',
            features: ['clustering', 'persistence', 'backup']
        },

        // Time Series Database
        timeseries: {
            technology: 'influxdb',
            instances: 10,
            capacity: '10M data points/second',
            useCase: 'real-time analytics'
        },

        // Search Engine
        search: {
            technology: 'elasticsearch',
            instances: 15,
            capacity: '100k searches/second',
            useCase: 'user search, game history'
        }
    },

    // CDN and Edge Computing
    cdn: {
        provider: 'cloudflare',
        edgeLocations: 200,
        capacity: '10TB/day',
        features: ['edge-compute', 'ddos-protection', 'ssl-termination']
    },

    // Message Queue System
    messaging: {
        technology: 'apache-kafka',
        brokers: 20,
        capacity: '1M messages/second',
        features: ['partitioning', 'replication', 'fault-tolerance']
    },

    // Load Balancing
    loadBalancing: {
        global: {
            technology: 'cloudflare',
            capacity: '100k requests/second',
            features: ['geo-routing', 'failover', 'ddos-protection']
        },
        regional: {
            technology: 'nginx-plus',
            capacity: '50k requests/second',
            features: ['health-checks', 'circuit-breaker', 'rate-limiting']
        },
        service: {
            technology: 'istio',
            capacity: '10k requests/second',
            features: ['service-mesh', 'traffic-management', 'security']
        }
    }
};

// High Availability Configuration
const highAvailability = {
    // Multi-Region Setup
    multiRegion: {
        enabled: true,
        regions: 3,
        failoverTime: '30 seconds',
        dataReplication: 'real-time'
    },

    // Database High Availability
    databaseHA: {
        mongodb: {
            replicaSets: 3,
            failoverTime: '10 seconds',
            backupFrequency: 'hourly',
            retentionPeriod: '30 days'
        },
        redis: {
            clusterMode: true,
            failoverTime: '5 seconds',
            backupFrequency: 'daily',
            retentionPeriod: '7 days'
        }
    },

    // Service High Availability
    serviceHA: {
        healthChecks: {
            interval: '10 seconds',
            timeout: '5 seconds',
            retries: 3
        },
        circuitBreaker: {
            enabled: true,
            threshold: 5,
            timeout: '30 seconds'
        },
        autoScaling: {
            minInstances: 10,
            maxInstances: 100,
            scaleUpThreshold: 70,
            scaleDownThreshold: 30
        }
    }
};

// Security Architecture
const securityArchitecture = {
    // Network Security
    networkSecurity: {
        vpc: 'isolated',
        subnets: 'private',
        securityGroups: 'restrictive',
        waf: 'enabled',
        ddosProtection: 'enabled'
    },

    // Application Security
    applicationSecurity: {
        authentication: 'oauth2+jwt',
        authorization: 'rbac',
        encryption: 'tls-1.3',
        secretsManagement: 'vault',
        apiSecurity: 'rate-limiting'
    },

    // Data Security
    dataSecurity: {
        encryptionAtRest: 'aes-256',
        encryptionInTransit: 'tls-1.3',
        dataMasking: 'enabled',
        auditLogging: 'enabled',
        compliance: ['gdpr', 'ccpa', 'sox']
    }
};

module.exports = {
    enterpriseArchitecture,
    highAvailability,
    securityArchitecture
};
