// Production Configuration
// This file contains production-ready settings for the Raja Mantri Chor Sipahi game

const config = {
    // Server Configuration
    port: process.env.PORT || 3001,
    environment: process.env.NODE_ENV || 'development',
    
    // CORS Configuration
    cors: {
        origin: process.env.CORS_ORIGIN || '*',
        credentials: true
    },
    
    // Socket.IO Configuration
    socketIO: {
        cors: {
            origin: process.env.SOCKET_CORS_ORIGIN || '*',
            methods: ['GET', 'POST']
        },
        transports: ['websocket', 'polling']
    },
    
    // Game Configuration
    game: {
        maxRooms: parseInt(process.env.MAX_ROOMS) || 100,
        maxPlayersPerRoom: parseInt(process.env.MAX_PLAYERS_PER_ROOM) || 5,
        roomCodeLength: parseInt(process.env.ROOM_CODE_LENGTH) || 6,
        maxRounds: 15,
        minRounds: 1
    },
    
    // Security Configuration
    security: {
        rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
        rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
    },
    
    // Logging Configuration
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        enableConsole: process.env.NODE_ENV !== 'production'
    }
};

module.exports = config;
