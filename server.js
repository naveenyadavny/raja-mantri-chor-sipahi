/*
 * Copyright (c) 2024 Raja Mantri Chor Sipahi Game
 * All rights reserved.
 * 
 * This software is proprietary and confidential.
 * Unauthorized copying, distribution, or modification is prohibited.
 * 
 * Raja Mantri Chor Sipahi - Multiplayer Game
 * Developed with Node.js, Express, and Socket.IO
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Game state management
const rooms = new Map();
const players = new Map();

// Room structure with round management

// Role definitions
const ROLES = {
    3: ['mantri', 'chor', 'sipahi'],
    4: ['raja', 'mantri', 'chor', 'sipahi'],
    5: ['raja', 'mantri', 'chor', 'sipahi', 'rani']
};

// Scoring system
const ROLE_SCORES = {
    'raja': 1000,
    'rani': 900,
    'mantri': 800,
    'sipahi': 500,
    'chor': 0
};

// Game phases
const GAME_PHASES = {
    WAITING: 'waiting',
    PLAYING: 'playing',
    MANTRI_GUESSING: 'mantri_guessing',
    RAJA_DECIDING: 'raja_deciding',
    ROUND_END: 'round_end',
    GAME_END: 'game_end'
};

// Calculate round scores
function calculateRoundScores(room) {
    const roundScores = [];
    
    room.players.forEach(player => {
        const baseScore = ROLE_SCORES[player.role] || 0;
        const playerScore = {
            playerId: player.id,
            playerName: player.name,
            role: player.role,
            baseScore: baseScore,
            finalScore: baseScore,
            bonus: 0,
            penalty: 0
        };
        
        roundScores.push(playerScore);
        
        // Update total score tracking
        if (!room.scores.has(player.id)) {
            room.scores.set(player.id, { total: 0, rounds: [] });
        }
        
        const playerScoreData = room.scores.get(player.id);
        playerScoreData.rounds.push({
            round: room.currentRound,
            score: playerScore.finalScore,
            role: player.role
        });
        playerScoreData.total += playerScore.finalScore;
    });
    
    return roundScores.sort((a, b) => b.finalScore - a.finalScore);
}

// Calculate final scores
function calculateFinalScores(room) {
    const finalScores = [];
    
    room.scores.forEach((scoreData, playerId) => {
        const player = room.players.find(p => p.id === playerId);
        if (player) {
            finalScores.push({
                playerId: playerId,
                playerName: player.name,
                totalScore: scoreData.total,
                rounds: scoreData.rounds
            });
        }
    });
    
    return finalScores.sort((a, b) => b.totalScore - a.totalScore);
}

// Handle Mantri-Chor guessing and point exchange
function handleMantriChorGuessing(room, mantriId, guessedChorId, isCorrect) {
    const mantri = room.players.find(p => p.id === mantriId);
    const chor = room.players.find(p => p.id === guessedChorId);
    
    if (!mantri || !chor) return null;
    
    const mantriScore = room.scores.get(mantriId);
    const chorScore = room.scores.get(guessedChorId);
    
    if (!mantriScore || !chorScore) return null;
    
    if (isCorrect) {
        // Mantri guessed correctly - Mantri gets bonus, Chor gets penalty
        const bonus = 200;
        const penalty = 200;
        
        mantriScore.total += bonus;
        chorScore.total -= penalty;
        
        return {
            mantriBonus: bonus,
            chorPenalty: penalty,
            message: `${mantri.name} correctly identified ${chor.name} as the Chor!`
        };
    } else {
        // Mantri guessed wrong - Exchange points
        const mantriPoints = mantriScore.total;
        const chorPoints = chorScore.total;
        
        mantriScore.total = chorPoints;
        chorScore.total = mantriPoints;
        
        return {
            pointExchange: true,
            mantriNewScore: chorPoints,
            chorNewScore: mantriPoints,
            message: `${mantri.name} guessed wrong! Points exchanged with ${chor.name}.`
        };
    }
}

// Generate room code
function generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Create room
function createRoom(maxPlayers, totalRounds = 3) {
    const roomCode = generateRoomCode();
    const room = {
        code: roomCode,
        maxPlayers: maxPlayers,
        totalRounds: totalRounds,
        players: [],
        gameState: 'waiting',
        roles: [...ROLES[maxPlayers]],
        currentRound: 1,
        playerNames: new Map(),
        scores: new Map(), // playerId -> { total: 0, rounds: [] }
        roundResults: [],
        createdAt: new Date()
    };
    
    rooms.set(roomCode, room);
    console.log(`Room created: ${roomCode}, Max Players: ${maxPlayers}, Total Rounds: ${totalRounds}`);
    return room;
}

// Add player to room
function addPlayerToRoom(roomCode, playerId, playerName, isHost = false) {
    const room = rooms.get(roomCode);
    if (!room) return null;
    
    if (room.players.length >= room.maxPlayers) {
        return { error: 'Room is full' };
    }
    
    const player = {
        id: playerId,
        name: playerName,
        isHost: isHost,
        role: null,
        roleRevealed: false,
        joinedAt: new Date()
    };
    
    room.players.push(player);
    room.playerNames.set(playerId, playerName);
    players.set(playerId, { roomCode, playerName });
    
    // Initialize score tracking
    if (!room.scores.has(playerId)) {
        room.scores.set(playerId, { total: 0, rounds: [] });
    }
    
    return { room, player };
}

// Remove player from room
function removePlayerFromRoom(playerId) {
    const playerData = players.get(playerId);
    if (!playerData) return null;
    
    const room = rooms.get(playerData.roomCode);
    if (!room) return null;
    
    room.players = room.players.filter(p => p.id !== playerId);
    players.delete(playerId);
    
    // If room is empty, delete it
    if (room.players.length === 0) {
        rooms.delete(playerData.roomCode);
        return { roomDeleted: true };
    }
    
    // If host left, assign new host to the next player who joined
    if (room.players.length > 0 && !room.players.some(p => p.isHost)) {
        // Sort players by join order (assuming they were added in chronological order)
        // The first player in the array is the next oldest player
        room.players[0].isHost = true;
        console.log(`New host assigned: ${room.players[0].name} (was next player to join)`);
    }
    
    return { room };
}

// Assign roles to players
function assignRoles(room) {
    console.log('=== ASSIGNING ROLES ===');
    console.log('Room:', room.code);
    console.log('Current round:', room.currentRound);
    console.log('Available roles:', room.roles);
    console.log('Players:', room.players.map(p => ({ name: p.name, currentRole: p.role })));
    
    const availableRoles = [...room.roles];
    
    // Proper Fisher-Yates shuffle algorithm for true randomization
    for (let i = availableRoles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [availableRoles[i], availableRoles[j]] = [availableRoles[j], availableRoles[i]];
    }
    
    console.log('Shuffled roles:', availableRoles);
    
    room.players.forEach((player, index) => {
        const oldRole = player.role;
        player.role = availableRoles[index];
        player.roleRevealed = false;
        
        console.log(`${player.name}: ${oldRole} → ${player.role}`);
        
        // Initialize score for this round
        const baseScore = ROLE_SCORES[player.role] || 0;
        if (!room.scores.has(player.id)) {
            room.scores.set(player.id, { total: 0, rounds: [] });
        }
        
        // Update total score with new role
        const playerScoreData = room.scores.get(player.id);
        if (room.currentRound === 1) {
            // First round - set initial score
            playerScoreData.total = baseScore;
        } else {
            // Subsequent rounds - add to existing total
            playerScoreData.total += baseScore;
        }
        playerScoreData.rounds.push({
            round: room.currentRound,
            score: baseScore,
            role: player.role
        });
        
        console.log(`Assigned role ${player.role} to ${player.name} (score: ${baseScore}, total: ${playerScoreData.total})`);
    });
    
    room.gameState = 'playing';
    console.log('=== ROLES ASSIGNED ===');
}

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);
    
    // Create room
    socket.on('createRoom', (data) => {
        try {
            const { playerName, maxPlayers, totalRounds } = data;
            
            console.log('=== CREATE ROOM DEBUG ===');
            console.log('Received data:', data);
            console.log('Player name:', playerName);
            console.log('Max players:', maxPlayers);
            console.log('Total rounds:', totalRounds);
            
            if (!playerName || !maxPlayers || maxPlayers < 3 || maxPlayers > 5) {
                socket.emit('error', { message: 'Invalid room creation data' });
                return;
            }
            
            const room = createRoom(maxPlayers, totalRounds !== undefined ? totalRounds : 3);
            console.log('Created room with totalRounds:', room.totalRounds);
            const result = addPlayerToRoom(room.code, socket.id, playerName, true);
            
            if (result.error) {
                socket.emit('error', { message: result.error });
                return;
            }
            
            socket.join(room.code);
            socket.emit('roomCreated', {
                roomCode: room.code,
                maxPlayers: room.maxPlayers,
                totalRounds: room.totalRounds,
                playerName: playerName
            });
            
            // Notify all players in room
            io.to(room.code).emit('playerJoined', {
                playerName: playerName,
                playerCount: room.players.length,
                maxPlayers: room.maxPlayers,
                totalRounds: room.totalRounds,
                players: room.players.map(p => ({
                    name: p.name,
                    isHost: p.isHost,
                    roleRevealed: p.roleRevealed,
                    role: p.role
                }))
            });
            
            console.log(`Room created: ${room.code} by ${playerName} (${totalRounds} rounds)`);
        } catch (error) {
            console.error('Error creating room:', error);
            socket.emit('error', { message: 'Failed to create room' });
        }
    });
    
    // Join room
    socket.on('joinRoom', (data) => {
        try {
            const { playerName, roomCode } = data;
            
            if (!playerName || !roomCode) {
                socket.emit('error', { message: 'Invalid join data' });
                return;
            }
            
            const room = rooms.get(roomCode.toUpperCase());
            if (!room) {
                socket.emit('error', { message: 'Room not found' });
                return;
            }
            
            if (room.gameState !== 'waiting') {
                socket.emit('error', { message: 'Game already started' });
                return;
            }
            
            const result = addPlayerToRoom(roomCode.toUpperCase(), socket.id, playerName);
            
            if (result.error) {
                socket.emit('error', { message: result.error });
                return;
            }
            
            socket.join(roomCode.toUpperCase());
            socket.emit('roomJoined', {
                roomCode: room.code,
                maxPlayers: room.maxPlayers,
                totalRounds: room.totalRounds,
                playerName: playerName
            });
            
            // Notify all players in room
            io.to(room.code).emit('playerJoined', {
                playerName: playerName,
                playerCount: room.players.length,
                maxPlayers: room.maxPlayers,
                totalRounds: room.totalRounds,
                players: room.players.map(p => ({
                    name: p.name,
                    isHost: p.isHost,
                    roleRevealed: p.roleRevealed,
                    role: p.role
                }))
            });
            
            console.log(`${playerName} joined room: ${room.code}`);
        } catch (error) {
            console.error('Error joining room:', error);
            socket.emit('error', { message: 'Failed to join room' });
        }
    });
    
    // Start game
    socket.on('startGame', () => {
        try {
            const playerData = players.get(socket.id);
            if (!playerData) return;
            
            const room = rooms.get(playerData.roomCode);
            if (!room) return;
            
            const player = room.players.find(p => p.id === socket.id);
            if (!player || !player.isHost) {
                socket.emit('error', { message: 'Only host can start the game' });
                return;
            }
            
            if (room.players.length < 3) {
                socket.emit('error', { message: 'Need at least 3 players to start' });
                return;
            }
            
            assignRoles(room);
            
            // Send role to each player
            room.players.forEach(player => {
                const playerSocket = io.sockets.sockets.get(player.id);
                if (playerSocket) {
                    console.log(`Sending gameStarted to ${player.name} with role: ${player.role}`);
                    playerSocket.emit('gameStarted', {
                        playerRole: player.role,
                        players: room.players.map(p => ({
                            id: p.id,
                            name: p.name,
                            isHost: p.isHost,
                            roleRevealed: p.roleRevealed,
                            role: p.role
                        }))
                    });
                }
            });
            
            console.log(`Game started in room: ${room.code}`);
        } catch (error) {
            console.error('Error starting game:', error);
            socket.emit('error', { message: 'Failed to start game' });
        }
    });
    
    // Reveal role
    socket.on('revealRole', () => {
        try {
            const playerData = players.get(socket.id);
            if (!playerData) return;
            
            const room = rooms.get(playerData.roomCode);
            if (!room) return;
            
            const player = room.players.find(p => p.id === socket.id);
            if (!player) return;
            
            player.roleRevealed = true;
            
            // Notify all players in room
            io.to(room.code).emit('roleRevealed', {
                playerName: player.name,
                role: player.role,
                players: room.players.map(p => ({
                    name: p.name,
                    isHost: p.isHost,
                    roleRevealed: p.roleRevealed,
                    role: p.role
                }))
            });
            
            console.log(`${player.name} revealed their role: ${player.role}`);
        } catch (error) {
            console.error('Error revealing role:', error);
            socket.emit('error', { message: 'Failed to reveal role' });
        }
    });
    
    // Confirm player names and start game
    socket.on('confirmPlayerNames', (data) => {
        try {
            const playerData = players.get(socket.id);
            if (!playerData) return;
            
            const room = rooms.get(playerData.roomCode);
            if (!room) return;
            
            const player = room.players.find(p => p.id === socket.id);
            if (!player || !player.isHost) {
                socket.emit('error', { message: 'Only host can confirm names' });
                return;
            }
            
            const { playerNames } = data;
            
            // Update player names in room
            playerNames.forEach(({ playerId, playerName }) => {
                if (room.playerNames.has(playerId)) {
                    room.playerNames.set(playerId, playerName);
                    const roomPlayer = room.players.find(p => p.id === playerId);
                    if (roomPlayer) {
                        roomPlayer.name = playerName;
                    }
                }
            });
            
            // Start the first round
            room.gameState = 'playing';
            room.currentRound = 1;
            
            // Assign roles for first round
            assignRoles(room);
            
            // Notify all players
            io.to(room.code).emit('gameStarted', {
                currentRound: room.currentRound,
                totalRounds: room.totalRounds,
                players: room.players.map(p => ({
                    id: p.id,
                    name: p.name,
                    role: p.role,
                    isHost: p.isHost
                }))
            });
            
            console.log(`Game started in room ${room.code} - Round ${room.currentRound}/${room.totalRounds}`);
        } catch (error) {
            console.error('Error confirming player names:', error);
            socket.emit('error', { message: 'Failed to confirm names' });
        }
    });
    
    // Next round
    socket.on('nextRound', () => {
        try {
            const playerData = players.get(socket.id);
            if (!playerData) return;
            
            const room = rooms.get(playerData.roomCode);
            if (!room) return;
            
            const player = room.players.find(p => p.id === socket.id);
            if (!player || !player.isHost) {
                socket.emit('error', { message: 'Only host can start next round' });
                return;
            }
            
            // Only allow next round if current round is completed (decision maker has evaluated)
            if (room.gameState !== GAME_PHASES.ROUND_END) {
                console.log(`Next round blocked: Current game state is ${room.gameState}, expected ${GAME_PHASES.ROUND_END}`);
                socket.emit('error', { message: 'Current round must be completed before starting next round' });
                return;
            }
            
            room.currentRound++;
            
            console.log(`=== NEXT ROUND DEBUG ===`);
            console.log(`Current round: ${room.currentRound}`);
            console.log(`Total rounds: ${room.totalRounds}`);
            console.log(`Game should end: ${room.currentRound > room.totalRounds}`);
            
            // Check if this is the final round
            if (room.currentRound > room.totalRounds) {
                // Game ended - calculate final scores
                room.gameState = GAME_PHASES.GAME_END;
                
                const finalScores = Array.from(room.scores.entries()).map(([playerId, scoreData]) => {
                    const player = room.players.find(p => p.id === playerId);
                    return {
                        playerName: player.name,
                        totalScore: scoreData.total,
                        rounds: scoreData.rounds
                    };
                }).sort((a, b) => b.totalScore - a.totalScore);
                
                // Notify all players that game has ended
                console.log('=== GAME END DEBUG ===');
                console.log('Sending gameEnded event to room:', room.code);
                console.log('Final scores:', finalScores);
                console.log('Winner:', finalScores[0]);
                
                io.to(room.code).emit('gameEnded', {
                    finalScores: finalScores,
                    winner: finalScores[0]
                });
                
                console.log(`Game ended in room: ${room.code}. Winner: ${finalScores[0].playerName} with ${finalScores[0].totalScore} points`);
                return;
            }
            
            // Assign new roles for the new round
            assignRoles(room);
            
            // Reset role reveals for new round
            room.players.forEach(p => {
                p.roleRevealed = false;
            });
            
            // Notify all players
            const nextRoundData = {
                currentRound: room.currentRound,
                totalRounds: room.totalRounds,
                players: room.players.map(p => ({
                    id: p.id,
                    name: p.name,
                    isHost: p.isHost,
                    roleRevealed: p.roleRevealed,
                    role: p.role
                }))
            };
            
            console.log('Sending nextRound data:', nextRoundData);
            io.to(room.code).emit('nextRound', nextRoundData);
            
            console.log(`Round ${room.currentRound} started in room: ${room.code}`);
        } catch (error) {
            console.error('Error starting next round:', error);
            socket.emit('error', { message: 'Failed to start next round' });
        }
    });
    
    // Leave room
    socket.on('leaveRoom', () => {
        try {
            const playerData = players.get(socket.id);
            if (!playerData) return;
            
            const result = removePlayerFromRoom(socket.id);
            if (!result) return;
            
            socket.leave(playerData.roomCode);
            
            if (result.roomDeleted) {
                console.log(`Room deleted: ${playerData.roomCode}`);
            } else {
                // Check if host was reassigned
                const newHost = result.room.players.find(p => p.isHost);
                const wasHostReassigned = playerData.isHost && newHost;
                
                // Notify remaining players
                io.to(playerData.roomCode).emit('playerLeft', {
                    playerName: playerData.playerName,
                    players: result.room.players.map(p => ({
                        name: p.name,
                        isHost: p.isHost,
                        roleRevealed: p.roleRevealed,
                        role: p.role
                    })),
                    newHost: wasHostReassigned ? {
                        name: newHost.name,
                        message: `${newHost.name} is now the host`
                    } : null
                });
                
                console.log(`${playerData.playerName} left room: ${playerData.roomCode}`);
                if (wasHostReassigned) {
                    console.log(`Host reassigned to: ${newHost.name}`);
                }
            }
        } catch (error) {
            console.error('Error leaving room:', error);
        }
    });
    
    // Mantri makes a guess about who is the Chor
    socket.on('mantriGuess', (data) => {
        console.log('=== SERVER: MANTRI GUESS RECEIVED ===');
        console.log('Data received:', data);
        console.log('Socket ID:', socket.id);
        
        try {
            const playerData = players.get(socket.id);
            console.log('Player data:', playerData);
            
            if (!playerData) {
                console.log('ERROR: No player data found');
                socket.emit('error', { message: 'Player not found' });
                return;
            }
            
            const room = rooms.get(playerData.roomCode);
            console.log('Room data:', room ? 'found' : 'not found');
            
            if (!room) {
                console.log('ERROR: No room found');
                socket.emit('error', { message: 'Room not found' });
                return;
            }
            
            const player = room.players.find(p => p.id === socket.id);
            console.log('Player found:', player ? player.name : 'not found');
            console.log('Player role:', player ? player.role : 'no role');
            
            if (!player || player.role !== 'mantri') {
                console.log('ERROR: Player is not Mantri');
                socket.emit('error', { message: 'Only Mantri can make guesses' });
                return;
            }
            
            const { guessedChorId } = data;
            const guessedPlayer = room.players.find(p => p.id === guessedChorId);
            console.log('Guessed player:', guessedPlayer ? guessedPlayer.name : 'not found');
            
            if (!guessedPlayer) {
                console.log('ERROR: Guessed player not found');
                socket.emit('error', { message: 'Invalid player selected' });
                return;
            }
            
            // Determine if the guess was correct
            const actualChor = room.players.find(p => p.role === 'chor');
            const wasCorrect = guessedPlayer.id === actualChor.id;
            
            console.log(`GUESS EVALUATION: ${player.name} guessed ${guessedPlayer.name} as Chor`);
            console.log(`Actual Chor: ${actualChor.name} (${actualChor.id})`);
            console.log(`Guessed Chor: ${guessedPlayer.name} (${guessedPlayer.id})`);
            console.log(`Was correct: ${wasCorrect}`);
            
            // Handle scoring based on guess result
            if (!wasCorrect) {
                // Mantri guessed wrong - exchange points with Chor
                console.log('Mantri guessed wrong - exchanging points between Mantri and Chor');
                const mantriScore = room.scores.get(player.id) || { total: 0, rounds: [] };
                const chorScore = room.scores.get(actualChor.id) || { total: 0, rounds: [] };
                
                const tempTotal = mantriScore.total;
                mantriScore.total = chorScore.total;
                chorScore.total = tempTotal;
                
                room.scores.set(player.id, mantriScore);
                room.scores.set(actualChor.id, chorScore);
                
                console.log(`Points exchanged: ${player.name} now has ${mantriScore.total}, ${actualChor.name} now has ${chorScore.total}`);
            } else {
                console.log('Mantri guessed correctly - no score changes');
            }
            
            // Reveal all roles to all players
            room.players.forEach(p => {
                p.roleRevealed = true;
            });
            
            // Send result to all players with revealed roles
            console.log('=== SENDING MANTRI GUESS RESULT TO ALL PLAYERS ===');
            console.log('Room code:', room.code);
            console.log('Players in room:', room.players.map(p => p.name));
            console.log('Event data:', {
                mantriName: player.name,
                guessedChorName: guessedPlayer.name,
                actualChorName: actualChor.name,
                wasCorrect: wasCorrect,
                message: wasCorrect ? 
                    `🎉 ${player.name} correctly guessed ${guessedPlayer.name} as the Chor!` :
                    `❌ ${player.name} guessed ${guessedPlayer.name}, but the actual Chor was ${actualChor.name}!`,
                revealedRoles: room.players.map(p => ({
                    playerName: p.name,
                    role: p.role,
                    roleRevealed: true
                })),
                scores: Array.from(room.scores.entries()).map(([playerId, scoreData]) => {
                    const player = room.players.find(p => p.id === playerId);
                    return {
                        playerName: player.name,
                        totalScore: scoreData.total
                    };
                })
            });
            
            io.to(room.code).emit('mantriGuessResult', {
                mantriName: player.name,
                guessedChorName: guessedPlayer.name,
                actualChorName: actualChor.name,
                wasCorrect: wasCorrect,
                message: wasCorrect ? 
                    `🎉 ${player.name} correctly guessed ${guessedPlayer.name} as the Chor!` :
                    `❌ ${player.name} guessed ${guessedPlayer.name}, but the actual Chor was ${actualChor.name}!`,
                revealedRoles: room.players.map(p => ({
                    playerName: p.name,
                    role: p.role,
                    roleRevealed: true
                })),
                scores: Array.from(room.scores.entries()).map(([playerId, scoreData]) => {
                    const player = room.players.find(p => p.id === playerId);
                    return {
                        playerName: player.name,
                        totalScore: scoreData.total
                    };
                })
            });
            
            console.log('=== MANTRI GUESS RESULT EVENT SENT ===');
            
            // Update game state to allow next round
            room.gameState = GAME_PHASES.ROUND_END;
            
            console.log('=== SERVER: GUESS RESULT SENT TO ALL PLAYERS ===');
            
        } catch (error) {
            console.error('ERROR in mantriGuess handler:', error);
            socket.emit('error', { message: 'Failed to process guess' });
        }
    });
    
    // Play Again - reset game state to allow new players to join
    socket.on('playAgain', () => {
        try {
            const playerData = players.get(socket.id);
            if (!playerData) return;
            
            const room = rooms.get(playerData.roomCode);
            if (!room) return;
            
            const player = room.players.find(p => p.id === socket.id);
            if (!player || !player.isHost) return; // Only host can trigger play again
            
            console.log(`=== PLAY AGAIN TRIGGERED BY HOST: ${player.name} ===`);
            
            // Reset game state to waiting
            room.gameState = 'waiting';
            room.currentRound = 1;
            
            // Reset all player states
            room.players.forEach(p => {
                p.roleRevealed = false;
                p.role = '';
            });
            
            // Clear scores for new game
            room.scores.clear();
            
            // Notify all players to move to waiting room
            io.to(room.code).emit('playAgainReset', {
                message: 'Game reset for new round! New players can join.',
                roomCode: room.code,
                maxPlayers: room.maxPlayers,
                totalRounds: room.totalRounds
            });
            
            console.log(`Room ${room.code} reset for new game`);
            
        } catch (error) {
            console.error('Error in playAgain handler:', error);
            socket.emit('error', { message: 'Failed to reset game' });
        }
    });
    
    // Update room settings (host only)
    socket.on('updateRoomSettings', (data) => {
        try {
            const playerData = players.get(socket.id);
            if (!playerData) return;
            
            const room = rooms.get(playerData.roomCode);
            if (!room) return;
            
            const player = room.players.find(p => p.id === socket.id);
            if (!player || !player.isHost) return; // Only host can update settings
            
            console.log(`=== UPDATE ROOM SETTINGS BY HOST: ${player.name} ===`);
            console.log('New settings:', data);
            
            // Validate settings
            if (data.maxPlayers && data.maxPlayers >= room.players.length) {
                room.maxPlayers = data.maxPlayers;
            }
            
            if (data.totalRounds && data.totalRounds > 0) {
                room.totalRounds = data.totalRounds;
            }
            
            // Notify all players about the updated settings
            io.to(room.code).emit('roomSettingsUpdated', {
                maxPlayers: room.maxPlayers,
                totalRounds: room.totalRounds,
                message: 'Room settings updated!'
            });
            
            console.log(`Room ${room.code} settings updated: maxPlayers=${room.maxPlayers}, totalRounds=${room.totalRounds}`);
            
        } catch (error) {
            console.error('Error in updateRoomSettings handler:', error);
            socket.emit('error', { message: 'Failed to update room settings' });
        }
    });
    
    // Chat message handling
    socket.on('chatMessage', (data) => {
        try {
            const playerData = players.get(socket.id);
            if (!playerData) return;
            
            const room = rooms.get(playerData.roomCode);
            if (!room) return;
            
            const player = room.players.find(p => p.id === socket.id);
            if (!player) return;
            
            // Validate message
            if (!data.message || data.message.trim().length === 0) return;
            if (data.message.length > 200) return;
            
            // Sanitize message (basic XSS protection)
            const sanitizedMessage = data.message.trim().substring(0, 200);
            
            // Send message to all players in the room
            io.to(room.code).emit('chatMessage', {
                senderId: socket.id,
                senderName: player.name,
                message: sanitizedMessage,
                timestamp: new Date().toISOString()
            });
            
            console.log(`Chat message from ${player.name}: ${sanitizedMessage}`);
            
        } catch (error) {
            console.error('Error handling chat message:', error);
        }
    });
    
    // Raja decides if Mantri's guess was correct
    socket.on('rajaDecision', (data) => {
        try {
            const playerData = players.get(socket.id);
            if (!playerData) return;
            
            const room = rooms.get(playerData.roomCode);
            if (!room) return;
            
            const player = room.players.find(p => p.id === socket.id);
            // In 3-player games, Sipahi makes decisions. In 4-5 player games, Raja makes decisions.
            const isDecisionMaker = (room.maxPlayers === 3 && player.role === 'sipahi') || 
                                   (room.maxPlayers > 3 && player.role === 'raja');
            
            if (!player || !isDecisionMaker) {
                const decisionRole = room.maxPlayers === 3 ? 'Sipahi' : 'Raja';
                socket.emit('error', { message: `Only ${decisionRole} can make decisions` });
                return;
            }
            
            if (!room.mantriGuess) {
                socket.emit('error', { message: 'No Mantri guess to evaluate' });
                return;
            }
            
            const { isCorrect } = data;
            const actualChor = room.players.find(p => p.role === 'chor');
            const wasActuallyCorrect = room.mantriGuess.guessedChorId === actualChor.id;
            
            // Handle the scoring based on Raja's decision
            const result = handleMantriChorGuessing(
                room, 
                room.mantriGuess.mantriId, 
                room.mantriGuess.guessedChorId, 
                isCorrect
            );
            
            if (result) {
                // Update game state
                room.gameState = GAME_PHASES.ROUND_END;
                console.log(`Round completed: Game state set to ${room.gameState}`);
                
                // Notify all players
                io.to(room.code).emit('rajaDecided', {
                    rajaName: player.name,
                    mantriName: room.mantriGuess.mantriName,
                    guessedChorName: room.mantriGuess.guessedChorName,
                    actualChorName: actualChor.name,
                    rajaDecision: isCorrect,
                    wasActuallyCorrect: wasActuallyCorrect,
                    result: result,
                    currentScores: Array.from(room.scores.entries()).map(([playerId, scoreData]) => ({
                        playerId: playerId,
                        playerName: room.playerNames.get(playerId),
                        totalScore: scoreData.total
                    }))
                });
                
                console.log(`Raja ${player.name} decided Mantri's guess was ${isCorrect ? 'correct' : 'wrong'}`);
            }
            
            // Clear the guess
            room.mantriGuess = null;
        } catch (error) {
            console.error('Error handling Raja decision:', error);
            socket.emit('error', { message: 'Failed to process decision' });
        }
    });
    
    // Disconnect
    socket.on('disconnect', () => {
        try {
            const playerData = players.get(socket.id);
            if (!playerData) return;
            
            const result = removePlayerFromRoom(socket.id);
            if (!result) return;
            
            if (result.roomDeleted) {
                console.log(`Room deleted: ${playerData.roomCode}`);
            } else {
                // Check if host was reassigned
                const newHost = result.room.players.find(p => p.isHost);
                const wasHostReassigned = playerData.isHost && newHost;
                
                // Notify remaining players
                io.to(playerData.roomCode).emit('playerLeft', {
                    playerName: playerData.playerName,
                    players: result.room.players.map(p => ({
                        name: p.name,
                        isHost: p.isHost,
                        roleRevealed: p.roleRevealed,
                        role: p.role
                    })),
                    newHost: wasHostReassigned ? {
                        name: newHost.name,
                        message: `${newHost.name} is now the host`
                    } : null
                });
                
                console.log(`${playerData.playerName} disconnected from room: ${playerData.roomCode}`);
                if (wasHostReassigned) {
                    console.log(`Host reassigned to: ${newHost.name}`);
                }
            }
        } catch (error) {
            console.error('Error handling disconnect:', error);
        }
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        message: 'Raja Mantri Chori Sipahi Server is running',
        activeRooms: rooms.size,
        activePlayers: players.size,
        timestamp: new Date().toISOString()
    });
});

// Server info endpoint
app.get('/info', (req, res) => {
    res.json({
        game: 'Raja Mantri Chori Sipahi',
        version: '1.0.0',
        activeRooms: rooms.size,
        activePlayers: players.size,
        supportedPlayers: [3, 4, 5],
        roles: ROLES,
        uptime: process.uptime()
    });
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🎮 Raja Mantri Chori Sipahi Server running on port ${PORT}`);
    console.log(`🌐 Server accessible at: http://localhost:${PORT}`);
    console.log(`📱 Mobile-friendly web interface ready!`);
    console.log(`🔗 Share this URL with players: http://[YOUR_LAPTOP_IP]:${PORT}`);
    console.log(`📊 API endpoints:`);
    console.log(`   GET  /health - Server health check`);
    console.log(`   GET  /info - Server information`);
    console.log(`   WebSocket - Real-time multiplayer communication`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});
