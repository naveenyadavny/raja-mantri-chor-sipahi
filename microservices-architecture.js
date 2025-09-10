// Microservices Architecture for 10k Users
// Service definitions and communication patterns

const microservices = {
    // Core Game Service
    gameService: {
        port: 3001,
        responsibilities: [
            'Game logic execution',
            'Role assignment',
            'Score calculation',
            'Round management'
        ],
        scaling: 'horizontal',
        instances: 5,
        loadBalancer: 'nginx'
    },
    
    // Room Management Service
    roomService: {
        port: 3002,
        responsibilities: [
            'Room creation/deletion',
            'Player joining/leaving',
            'Room state management',
            'Room cleanup'
        ],
        scaling: 'horizontal',
        instances: 3,
        database: 'mongodb'
    },
    
    // User Management Service
    userService: {
        port: 3003,
        responsibilities: [
            'User authentication',
            'User profiles',
            'User statistics',
            'Session management'
        ],
        scaling: 'horizontal',
        instances: 2,
        database: 'mongodb'
    },
    
    // Chat Service
    chatService: {
        port: 3004,
        responsibilities: [
            'Real-time messaging',
            'Message history',
            'Chat moderation',
            'Emoji reactions'
        ],
        scaling: 'horizontal',
        instances: 3,
        database: 'mongodb'
    },
    
    // Notification Service
    notificationService: {
        port: 3005,
        responsibilities: [
            'Push notifications',
            'Email notifications',
            'In-game alerts',
            'System announcements'
        ],
        scaling: 'horizontal',
        instances: 2,
        external: ['firebase', 'sendgrid']
    },
    
    // Analytics Service
    analyticsService: {
        port: 3006,
        responsibilities: [
            'User behavior tracking',
            'Game performance metrics',
            'Revenue tracking',
            'A/B testing'
        ],
        scaling: 'horizontal',
        instances: 2,
        database: 'mongodb'
    }
};

// Service Communication
const serviceCommunication = {
    // API Gateway
    apiGateway: {
        port: 80,
        responsibilities: [
            'Request routing',
            'Load balancing',
            'Rate limiting',
            'Authentication',
            'SSL termination'
        ],
        technology: 'nginx'
    },
    
    // Message Queue
    messageQueue: {
        technology: 'redis',
        useCases: [
            'Inter-service communication',
            'Event broadcasting',
            'Task queuing',
            'Session management'
        ]
    },
    
    // Service Discovery
    serviceDiscovery: {
        technology: 'consul',
        responsibilities: [
            'Service registration',
            'Health checking',
            'Load balancing',
            'Failover'
        ]
    }
};

// Load Balancing Strategy
const loadBalancing = {
    strategy: 'round_robin',
    healthChecks: {
        interval: '30s',
        timeout: '5s',
        retries: 3
    },
    failover: {
        enabled: true,
        threshold: 3
    }
};

// Scaling Configuration
const scalingConfig = {
    // Horizontal Pod Autoscaler (Kubernetes)
    hpa: {
        minReplicas: 2,
        maxReplicas: 20,
        targetCPU: 70,
        targetMemory: 80
    },
    
    // Vertical scaling
    verticalScaling: {
        cpu: '2-8 cores',
        memory: '4-32GB',
        storage: '100GB-1TB'
    },
    
    // Database scaling
    databaseScaling: {
        readReplicas: 5,
        writeReplicas: 2,
        sharding: true,
        connectionPool: 100
    }
};

module.exports = {
    microservices,
    serviceCommunication,
    loadBalancing,
    scalingConfig
};
