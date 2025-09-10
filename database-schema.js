// Database Schema for 10k User Scale
// MongoDB/PostgreSQL integration for Raja Mantri Chor Sipahi

// Room Schema
const roomSchema = {
    _id: ObjectId,
    code: String, // 6-character room code
    hostId: ObjectId,
    maxPlayers: Number,
    totalRounds: Number,
    currentRound: Number,
    gameState: String, // 'waiting', 'playing', 'round_end', 'ended'
    players: [{
        id: ObjectId,
        name: String,
        role: String,
        isHost: Boolean,
        roleRevealed: Boolean,
        score: Number
    }],
    scores: Map, // playerId -> scoreData
    mantriGuess: {
        mantriId: ObjectId,
        guessedPlayerId: ObjectId,
        timestamp: Date
    },
    createdAt: Date,
    updatedAt: Date,
    expiresAt: Date // TTL for cleanup
};

// Player Schema
const playerSchema = {
    _id: ObjectId,
    name: String,
    socketId: String,
    roomId: ObjectId,
    isOnline: Boolean,
    lastSeen: Date,
    totalGamesPlayed: Number,
    totalWins: Number,
    createdAt: Date
};

// Game Session Schema
const gameSessionSchema = {
    _id: ObjectId,
    roomId: ObjectId,
    players: [ObjectId],
    rounds: [{
        roundNumber: Number,
        roles: Map, // playerId -> role
        mantriGuess: Object,
        result: String,
        scores: Map
    }],
    finalScores: Map,
    winner: ObjectId,
    duration: Number, // in minutes
    createdAt: Date
};

// Chat Message Schema
const chatMessageSchema = {
    _id: ObjectId,
    roomId: ObjectId,
    playerId: ObjectId,
    message: String,
    timestamp: Date,
    type: String // 'text', 'system', 'game_event'
};

// Indexes for Performance
const indexes = [
    // Room indexes
    { collection: 'rooms', index: { code: 1 }, unique: true },
    { collection: 'rooms', index: { hostId: 1 } },
    { collection: 'rooms', index: { gameState: 1 } },
    { collection: 'rooms', index: { expiresAt: 1 }, expireAfterSeconds: 0 },
    
    // Player indexes
    { collection: 'players', index: { socketId: 1 }, unique: true },
    { collection: 'players', index: { roomId: 1 } },
    { collection: 'players', index: { isOnline: 1 } },
    
    // Game session indexes
    { collection: 'gameSessions', index: { roomId: 1 } },
    { collection: 'gameSessions', index: { createdAt: -1 } },
    
    // Chat indexes
    { collection: 'chatMessages', index: { roomId: 1, timestamp: -1 } }
];
