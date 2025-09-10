/*
 * Copyright (c) 2024 Raja Mantri Chor Sipahi Game
 * All rights reserved.
 * 
 * This software is proprietary and confidential.
 * Unauthorized copying, distribution, or modification is prohibited.
 * 
 * Raja Mantri Chor Sipahi - Client-side Game Logic
 * Developed with JavaScript, Socket.IO Client
 */

// Game State Management
class GameManager {
    constructor() {
        this.socket = null;
        this.currentScreen = 'mainMenu';
        this.playerName = '';
        this.roomCode = '';
        this.isHost = false;
        this.playerRole = '';
        this.isRoleRevealed = false; // Track if current player has revealed their role
        this.hasSubmittedGuess = false; // Track if Mantri has submitted their guess
        this.totalRounds = 3; // Default total rounds
        this.gameState = 'waiting';
        this.players = [];
        this.maxPlayers = 3;
        
        // Mobile detection
        this.isMobile = this.detectMobile();
        this.connectionRetries = 0;
        this.maxRetries = 3;
        
        this.initializeEventListeners();
        this.connectToServer();
    }
    
    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    initializeEventListeners() {
        // Main menu buttons
        document.getElementById('createRoomBtn').addEventListener('click', () => this.showScreen('createRoom'));
        document.getElementById('joinRoomBtn').addEventListener('click', () => this.showScreen('joinRoom'));
        document.getElementById('rulesBtn').addEventListener('click', () => this.showScreen('rulesScreen'));
        
        // Back buttons
        document.getElementById('backToMenu').addEventListener('click', () => this.showScreen('mainMenu'));
        document.getElementById('backToMenu2').addEventListener('click', () => this.showScreen('mainMenu'));
        document.getElementById('backToMenu3').addEventListener('click', () => this.showScreen('mainMenu'));
        
        // Create room
        document.getElementById('createRoomConfirm').addEventListener('click', () => this.createRoom());
        
        // Join room
        document.getElementById('joinRoomConfirm').addEventListener('click', () => this.joinRoom());
        
        // Waiting room
        document.getElementById('startGameBtn').addEventListener('click', () => this.startGame());
        document.getElementById('leaveRoomBtn').addEventListener('click', () => this.leaveRoom());
        document.getElementById('copyRoomCode').addEventListener('click', () => this.copyRoomCode());
        
        // Game screen
        document.getElementById('leaveGameBtn').addEventListener('click', () => this.leaveRoom());
        document.getElementById('revealRoleBtn').addEventListener('click', () => this.revealRole());
        document.getElementById('showSlipBtn').addEventListener('click', () => this.showSlip());
        document.getElementById('mantriGuessBtn').addEventListener('click', () => this.startMantriGuessing());
        document.getElementById('submitMantriGuessBtn').addEventListener('click', () => {
            console.log('Submit button clicked!');
            this.submitMantriGuess();
        });
        document.getElementById('rajaDecisionBtn').addEventListener('click', () => this.showRajaDecision());
        document.getElementById('correctGuessBtn').addEventListener('click', () => this.makeRajaDecision(true));
        document.getElementById('wrongGuessBtn').addEventListener('click', () => this.makeRajaDecision(false));
        document.getElementById('nextRoundBtn').addEventListener('click', () => this.nextRound());
        document.getElementById('endGameBtn').addEventListener('click', () => this.endGame());
        
        // Chat functionality
        document.getElementById('sendChatBtn').addEventListener('click', () => {
            this.sendChatMessage();
        });
        
        document.getElementById('chatInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendChatMessage();
            }
        });
        
        document.getElementById('toggleChatBtn').addEventListener('click', () => {
            this.toggleChat();
        });
        
        // Player name confirmation
        document.getElementById('confirmNames').addEventListener('click', () => this.confirmPlayerNames());
        
        // Enter key handlers
        document.getElementById('playerName').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.createRoom();
        });
        
        document.getElementById('joinPlayerName').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.joinRoom();
        });
        
        document.getElementById('roomCode').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.joinRoom();
        });
        
        // Play Again screen
        document.getElementById('startNewGameBtn').addEventListener('click', () => this.startNewGame());
        document.getElementById('backToMenuBtn').addEventListener('click', () => this.showScreen('mainMenu'));
        document.getElementById('copyPlayAgainRoomCode').addEventListener('click', () => this.copyPlayAgainRoomCode());
        document.getElementById('updateSettingsBtn').addEventListener('click', () => this.updateRoomSettings());
    }
    
    connectToServer() {
        // Enhanced Socket.IO connection for mobile compatibility
        this.socket = io({
            transports: ['websocket', 'polling'],
            upgrade: true,
            rememberUpgrade: true,
            timeout: 20000,
            forceNew: true,
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
            maxReconnectionAttempts: 5
        });
        
        this.socket.on('connect', () => {
            console.log('Connected to server:', this.socket.id);
            this.updateConnectionStatus('connected', 'Connected');
        });
        
        this.socket.on('disconnect', (reason) => {
            console.log('Disconnected from server:', reason);
            this.updateConnectionStatus('disconnected', 'Disconnected');
        });
        
        this.socket.on('connect_error', (error) => {
            console.error('Connection error:', error);
            this.updateConnectionStatus('error', 'Connection Error');
        });
        
        this.socket.on('reconnect', (attemptNumber) => {
            console.log('Reconnected after', attemptNumber, 'attempts');
            this.updateConnectionStatus('connected', 'Reconnected');
        });
        
        this.socket.on('reconnect_error', (error) => {
            console.error('Reconnection error:', error);
            this.updateConnectionStatus('error', 'Reconnection Failed');
            this.handleConnectionError();
        });
        
        // Add connection timeout handling
        setTimeout(() => {
            if (!this.socket.connected) {
                console.log('Connection timeout, attempting retry...');
                this.handleConnectionError();
            }
        }, 10000);
        
        // Initialize all socket listeners
        this.initializeSocketListeners();
    }
    
    handleConnectionError() {
        this.connectionRetries++;
        if (this.connectionRetries <= this.maxRetries) {
            console.log(`Retrying connection (${this.connectionRetries}/${this.maxRetries})...`);
            this.updateConnectionStatus('retrying', `Retrying... (${this.connectionRetries}/${this.maxRetries})`);
            
            setTimeout(() => {
                this.connectToServer();
            }, 2000 * this.connectionRetries); // Exponential backoff
        } else {
            console.error('Max connection retries reached');
            this.updateConnectionStatus('error', 'Connection Failed');
            this.showToast('Connection failed. Please check your internet connection and try refreshing the page.', 'error');
        }
    }
    
    // Add all the socket event listeners
    initializeSocketListeners() {
        this.socket.on('roomCreated', (data) => {
            this.roomCode = data.roomCode;
            this.isHost = true;
            this.maxPlayers = data.maxPlayers;
            this.totalRounds = data.totalRounds; // Store totalRounds from server
            console.log('Room created with totalRounds:', this.totalRounds);
            this.showScreen('waitingRoom');
            this.updateRoomInfo();
            this.showToast('Room created successfully!', 'success');
        });
        
        this.socket.on('roomJoined', (data) => {
            this.roomCode = data.roomCode;
            this.isHost = false;
            this.maxPlayers = data.maxPlayers;
            this.totalRounds = data.totalRounds; // Store totalRounds from server
            console.log('Room joined with totalRounds:', this.totalRounds);
            this.showScreen('waitingRoom');
            this.updateRoomInfo();
            this.showToast('Joined room successfully!', 'success');
        });
        
        this.socket.on('playerJoined', (data) => {
            this.players = data.players;
            // Update totalRounds if provided (for players joining existing rooms)
            if (data.totalRounds) {
                this.totalRounds = data.totalRounds;
                console.log('Updated totalRounds from playerJoined:', this.totalRounds);
            }
            this.updatePlayersList();
            this.updateRoomInfo(); // Refresh room info display
            this.showToast(`${data.playerName} joined the room`, 'success');
        });
        
        this.socket.on('playerLeft', (data) => {
            this.players = data.players;
            
            // Check if current player is now the host
            const currentPlayer = this.players.find(p => p.name === this.playerName);
            if (currentPlayer && currentPlayer.isHost) {
                this.isHost = true;
            }
            
            this.updatePlayersList();
            this.updateRoomInfo(); // Update host controls visibility
            
            // Show appropriate message
            if (data.newHost) {
                this.showToast(`${data.playerName} left. ${data.newHost.message}`, 'info');
            } else {
                this.showToast(`${data.playerName} left the room`, 'warning');
            }
        });
        
        this.socket.on('gameStarted', (data) => {
            console.log('Received gameStarted data:', data);
            this.gameState = 'playing';
            
            // Handle individual player data (has playerRole)
            if (data.playerRole) {
                this.playerRole = data.playerRole;
                console.log('Set playerRole to:', this.playerRole);
                this.players = data.players;
                this.showScreen('gameScreen');
                
                // Reset show slip button text for new game
                const showSlipBtn = document.getElementById('showSlipBtn');
                if (showSlipBtn) {
                    showSlipBtn.innerHTML = '<i class="fas fa-eye"></i> Show My Slip';
                }
                
                this.updateGameScreen();
                this.showToast('Game started!', 'success');
            }
            
            // Handle broadcast data (has currentRound and totalRounds)
            if (data.currentRound && data.totalRounds) {
                console.log('Received round info:', data.currentRound, '/', data.totalRounds);
                this.updateRoundInfo(data.currentRound, data.totalRounds);
            }
        });
        
        this.socket.on('roleRevealed', (data) => {
            this.updateGamePlayers();
            
            // Only update current player's role display if they revealed their own role
            if (data.playerName === this.playerName) {
                this.isRoleRevealed = true;
                this.updateRoleDisplay();
            }
            
            this.showToast(`${data.playerName} revealed their role!`, 'info');
        });
        
        this.socket.on('gameEnded', (data) => {
            console.log('Game ended:', data);
            this.showGameEndResults(data);
        });
        
        this.socket.on('mantriGuessResult', (data) => {
            console.log('=== RECEIVED MANTRI GUESS RESULT ===');
            console.log('Data received:', data);
            console.log('Was correct:', data.wasCorrect);
            console.log('Revealed roles:', data.revealedRoles);
            console.log('Scores:', data.scores);
            
            // Show result to all players
            this.showToast(data.message, data.wasCorrect ? 'success' : 'error');
            
            // Update player roles with revealed information
            if (data.revealedRoles) {
                console.log('Updating players with revealed roles...');
                this.updatePlayersWithRevealedRoles(data.revealedRoles);
            }
            
            // Update scores display
            if (data.scores) {
                console.log('Updating scores display...');
                this.updateScoresDisplay(data.scores);
            }
            
            // Show the guess result summary
            console.log('Showing guess result summary...');
            this.showGuessResultSummary(data);
            
            // Hide mantri guessing section
            const mantriGuessingSection = document.getElementById('mantriGuessingSection');
            if (mantriGuessingSection) {
                mantriGuessingSection.style.display = 'none';
                console.log('Hidden mantri guessing section');
            }
            
            // Show next round button for host
            if (this.isHost) {
                const nextRoundBtn = document.getElementById('nextRoundBtn');
                if (nextRoundBtn) {
                    // Check if this is the last round
                    const currentRound = parseInt(document.getElementById('currentRound').textContent);
                    const totalRounds = parseInt(document.getElementById('gameTotalRounds').textContent);
                    
                    if (currentRound >= totalRounds) {
                        // Last round - show "Final Results" instead
                        nextRoundBtn.textContent = 'Final Results';
                        nextRoundBtn.style.display = 'block';
                        console.log('Shown Final Results button for host (last round)');
                    } else {
                        // Not last round - show "Start Next Round"
                        nextRoundBtn.textContent = 'Start Next Round';
                        nextRoundBtn.style.display = 'block';
                        console.log('Shown Start Next Round button for host');
                    }
                }
            }
            
            console.log('=== MANTRI GUESS RESULT PROCESSING COMPLETE ===');
        });
        
        this.socket.on('nextRound', (data) => {
            console.log('=== RECEIVED NEXT ROUND ===');
            console.log('Next round data:', data);
            console.log('Players data from server:', data.players);
            
            this.showToast(`Round ${data.currentRound} started!`, 'success');
            this.updateRoundInfo(data.currentRound, data.totalRounds);
            
            // CRITICAL: Update players array with fresh server data
            this.players = data.players;
            console.log('Updated players array with server data:', this.players);
            
            // CRITICAL: Update current player's role from server data
            const currentPlayer = data.players.find(p => p.id === this.socket.id);
            if (currentPlayer) {
                console.log('Updating current player role:', this.playerRole, '→', currentPlayer.role);
                this.playerRole = currentPlayer.role;
            }
            
            this.updateGamePlayers(data.players);
            this.hideAllActionButtons();
            
            // Clear previous round results
            this.clearPreviousRoundResults();
            
            // Reset role reveal and guess submission for new round
            this.isRoleRevealed = false;
            this.hasSubmittedGuess = false;
            this.updateRoleDisplay();
            
            // Reset show slip button text
            const showSlipBtn = document.getElementById('showSlipBtn');
            if (showSlipBtn) {
                showSlipBtn.innerHTML = '<i class="fas fa-eye"></i> Show My Slip';
            }
            
            this.showRoleBasedButtons();
        });
        
        // Chat functionality
        this.socket.on('chatMessage', (data) => {
            this.addChatMessage(data);
        });
        
        this.socket.on('playAgainReset', (data) => {
            console.log('Received playAgainReset:', data);
            
            // Reset game state
            this.gameState = 'waiting';
            this.isRoleRevealed = false;
            this.hasSubmittedGuess = false;
            
            // Clear previous game results
            this.clearPreviousRoundResults();
            const gameEndContainer = document.getElementById('gameEndContainer');
            if (gameEndContainer) {
                gameEndContainer.remove();
            }
            
            // Move to waiting room
            this.showScreen('waitingRoom');
            this.updateRoomInfo();
            this.updatePlayersList();
            
            this.showToast(data.message, 'success');
        });
        
        this.socket.on('roomSettingsUpdated', (data) => {
            console.log('Received roomSettingsUpdated:', data);
            
            // Update local settings
            this.maxPlayers = data.maxPlayers;
            this.totalRounds = data.totalRounds;
            
            // Update UI
            this.updateRoomInfo();
            this.updatePlayersList();
            
            this.showToast(data.message, 'success');
        });
        
        this.socket.on('error', (error) => {
            this.showToast(error.message, 'error');
        });
    }
    
    showScreen(screenName) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Show target screen
        document.getElementById(screenName).classList.add('active');
        this.currentScreen = screenName;
    }
    
    createRoom() {
        const playerName = document.getElementById('playerName').value.trim();
        const roomSize = parseInt(document.getElementById('roomSize').value);
        
        if (!playerName) {
            this.showToast('Please enter your name', 'error');
            return;
        }
        
        this.playerName = playerName;
        this.maxPlayers = roomSize;
        
        const totalRounds = parseInt(document.getElementById('totalRounds').value);
        
        this.socket.emit('createRoom', {
            playerName: this.playerName,
            maxPlayers: this.maxPlayers,
            totalRounds: totalRounds
        });
    }
    
    joinRoom() {
        const playerName = document.getElementById('joinPlayerName').value.trim();
        const roomCode = document.getElementById('roomCode').value.trim().toUpperCase();
        
        if (!playerName) {
            this.showToast('Please enter your name', 'error');
            return;
        }
        
        if (!roomCode) {
            this.showToast('Please enter room code', 'error');
            return;
        }
        
        this.playerName = playerName;
        
        this.socket.emit('joinRoom', {
            playerName: this.playerName,
            roomCode: roomCode
        });
    }
    
    startGame() {
        if (!this.isHost) return;
        
        if (this.players.length < 3) {
            this.showToast('Need at least 3 players to start', 'error');
            return;
        }
        
        this.socket.emit('startGame');
    }
    
    leaveRoom() {
        this.socket.emit('leaveRoom');
        this.resetGame();
        this.showScreen('mainMenu');
    }
    
    revealRole() {
        this.socket.emit('revealRole');
    }
    
    nextRound() {
        this.socket.emit('nextRound');
    }
    
    showSlip() {
        if (!this.isRoleRevealed) {
            // First time showing slip
            this.socket.emit('showSlip');
            this.isRoleRevealed = true;
            this.updateRoleDisplay();
            this.showRoleBasedButtons();
            
            // Change button to "Hide My Slip"
            const showSlipBtn = document.getElementById('showSlipBtn');
            if (showSlipBtn) {
                showSlipBtn.innerHTML = '<i class="fas fa-eye-slash"></i> Hide My Slip';
            }
        } else {
            // Hide slip
            this.isRoleRevealed = false;
            this.updateRoleDisplay();
            this.hideAllActionButtons();
            
            // Change button back to "Show My Slip"
            const showSlipBtn = document.getElementById('showSlipBtn');
            if (showSlipBtn) {
                showSlipBtn.innerHTML = '<i class="fas fa-eye"></i> Show My Slip';
                showSlipBtn.style.display = 'block';
            }
        }
    }
    
    startMantriGuessing() {
        // Show player selection for Mantri to guess
        const section = document.getElementById('mantriGuessingSection');
        const playerList = document.getElementById('playerSelectionList');
        const submitBtn = document.getElementById('submitMantriGuessBtn');
        
        // Clear previous selections
        playerList.innerHTML = '';
        submitBtn.style.display = 'none';
        this.selectedPlayerId = null;
        
        // Add other players as options (exclude self only)
        console.log('=== MANTRI GUESSING DEBUG ===');
        console.log('Current player:', this.playerName, 'Socket ID:', this.socket.id);
        console.log('Current player role:', this.playerRole);
        console.log('Available players with roles:', this.players.map(p => ({ name: p.name, role: p.role, id: p.id, roleRevealed: p.roleRevealed })));
        
        this.players.forEach(player => {
            console.log('=== PROCESSING PLAYER ===');
            console.log('Player object:', player);
            console.log('Player ID:', player.id);
            console.log('Player name:', player.name);
            console.log('Player role:', player.role);
            
            // Mantri can only guess Chor and Sipahi (traditional game rule)
            const isSelf = (player.id === this.socket.id) || (player.name === this.playerName);
            const isChor = player.role === 'chor';
            const isSipahi = player.role === 'sipahi';
            
            console.log(`Player ${player.name}: isSelf=${isSelf}, isChor=${isChor}, isSipahi=${isSipahi}`);
            
            if (!isSelf && (isChor || isSipahi)) {
                console.log('Creating button for player:', player.name);
                const button = document.createElement('button');
                button.className = 'player-selection-btn';
                button.textContent = player.name;
                
                // Store player ID in a closure to avoid undefined issues
                const playerId = player.id;
                button.onclick = () => {
                    console.log('=== BUTTON CLICKED ===');
                    console.log('Button clicked for player:', player.name);
                    console.log('Player ID from closure:', playerId);
                    this.selectPlayerForGuess(playerId, button);
                };
                playerList.appendChild(button);
                console.log(`Added ${player.name} as guessing option with ID: ${playerId}`);
            }
        });
        
        section.style.display = 'block';
        document.getElementById('mantriGuessBtn').style.display = 'none';
    }
    
    selectPlayerForGuess(playerId, button) {
        console.log('=== PLAYER SELECTION DEBUG ===');
        console.log('Player selected for guess:', playerId);
        console.log('Button text:', button.textContent);
        console.log('Button element:', button);
        console.log('Current selectedPlayerId before:', this.selectedPlayerId);
        
        // Remove previous selection
        document.querySelectorAll('.player-selection-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        // Mark current selection
        button.classList.add('selected');
        this.selectedPlayerId = playerId;
        
        console.log('selectedPlayerId set to:', this.selectedPlayerId);
        console.log('Button classes after selection:', button.className);
        
        // Show submit button
        const submitBtn = document.getElementById('submitMantriGuessBtn');
        submitBtn.style.display = 'block';
        console.log('Submit button display:', submitBtn.style.display);
        console.log('=== PLAYER SELECTION COMPLETE ===');
    }
    
    submitMantriGuess() {
        console.log('=== SUBMIT GUESS DEBUG ===');
        console.log('selectedPlayerId:', this.selectedPlayerId);
        console.log('hasSubmittedGuess:', this.hasSubmittedGuess);
        console.log('socket connected:', this.socket ? this.socket.connected : 'no socket');
        
        if (!this.selectedPlayerId) {
            console.log('ERROR: No player selected');
            this.showToast('Please select a player first!', 'error');
            return;
        }
        
        if (this.hasSubmittedGuess) {
            console.log('ERROR: Already submitted');
            this.showToast('You have already submitted your guess!', 'error');
            return;
        }
        
        console.log('Sending mantriGuess event...');
        this.socket.emit('mantriGuess', { guessedChorId: this.selectedPlayerId });
        
        // Mark as submitted
        this.hasSubmittedGuess = true;
        
        // Hide the guessing section
        document.getElementById('mantriGuessingSection').style.display = 'none';
        document.getElementById('submitMantriGuessBtn').style.display = 'none';
        
        this.showToast('Guess submitted successfully!', 'success');
        console.log('=== SUBMIT COMPLETE ===');
    }
    
    showRajaDecision() {
        // Update the decision maker text based on game type
        const decisionMaker = this.maxPlayers === 3 ? 'Sipahi' : 'Raja';
        const decisionTitle = document.querySelector('#rajaDecisionSection h4');
        decisionTitle.innerHTML = `<i class="fas fa-gavel"></i> ${decisionMaker}'s Decision`;
        
        // Update button text
        const decisionBtn = document.getElementById('rajaDecisionBtn');
        decisionBtn.innerHTML = `<i class="fas fa-gavel"></i> Make ${decisionMaker} Decision`;
        
        document.getElementById('rajaDecisionSection').style.display = 'block';
        document.getElementById('rajaDecisionBtn').style.display = 'none';
    }
    
    makeRajaDecision(isCorrect) {
        this.socket.emit('rajaDecision', { isCorrect: isCorrect });
        document.getElementById('rajaDecisionSection').style.display = 'none';
    }
    
    confirmPlayerNames() {
        const playerNames = [];
        const inputs = document.querySelectorAll('#playerNameInputs input');
        
        inputs.forEach(input => {
            const playerId = input.dataset.playerId;
            const playerName = input.value.trim();
            if (playerId && playerName) {
                playerNames.push({ playerId, playerName });
            }
        });
        
        if (playerNames.length === this.players.length) {
            this.socket.emit('confirmPlayerNames', { playerNames });
        } else {
            this.showToast('Please enter names for all players', 'error');
        }
    }
    
    endGame() {
        this.socket.emit('endGame');
    }
    
    copyRoomCode() {
        navigator.clipboard.writeText(this.roomCode).then(() => {
            this.showToast('Room code copied!', 'success');
        });
    }
    
    updateRoomInfo() {
        console.log('=== UPDATE ROOM INFO DEBUG ===');
        console.log('Room code:', this.roomCode);
        console.log('Max players:', this.maxPlayers);
        console.log('Total rounds:', this.totalRounds);
        
        document.getElementById('currentRoomCode').textContent = this.roomCode;
        document.getElementById('maxPlayers').textContent = this.maxPlayers;
        document.getElementById('totalRoundsDisplay').textContent = this.totalRounds;
        document.getElementById('gameRoomCode').textContent = this.roomCode;
        document.getElementById('gamePlayerCount').textContent = this.players.length;
        document.getElementById('gameTotalRounds').textContent = this.totalRounds;
        
        // Show/hide host controls
        const hostControls = document.getElementById('hostControls');
        if (hostControls) {
            hostControls.style.display = this.isHost ? 'block' : 'none';
        }
        
        // Update host settings dropdowns
        if (this.isHost) {
            const waitingMaxPlayers = document.getElementById('waitingMaxPlayers');
            const waitingRounds = document.getElementById('waitingRounds');
            if (waitingMaxPlayers) waitingMaxPlayers.value = this.maxPlayers;
            if (waitingRounds) waitingRounds.value = this.totalRounds;
        }
        
        console.log('Updated totalRoundsDisplay to:', this.totalRounds);
        console.log('Updated totalRounds to:', this.totalRounds);
    }
    
    updatePlayersList() {
        const container = document.getElementById('playersContainer');
        container.innerHTML = '';
        
        this.players.forEach(player => {
            const playerElement = document.createElement('div');
            playerElement.className = 'player-item';
            
            if (player.isHost) {
                playerElement.classList.add('is-host');
            }
            
            if (player.name === this.playerName) {
                playerElement.classList.add('is-you');
            }
            
            playerElement.innerHTML = `
                <div class="player-avatar">${player.name.charAt(0).toUpperCase()}</div>
                <div class="player-name">${player.name}</div>
                <div class="player-status">${player.isHost ? 'Host' : 'Player'}</div>
            `;
            
            container.appendChild(playerElement);
        });
        
        // Update player count and room details display
        document.getElementById('playerCount').textContent = this.players.length;
        document.getElementById('maxPlayers').textContent = this.maxPlayers;
        document.getElementById('totalRoundsDisplay').textContent = this.totalRounds;
        
        // Enable start button if host and enough players
        const startBtn = document.getElementById('startGameBtn');
        if (this.isHost && this.players.length >= 3) {
            startBtn.disabled = false;
        } else {
            startBtn.disabled = true;
        }
    }
    
    updateGameScreen() {
        this.updateRoomInfo();
        this.updateRoleDisplay();
        this.updateGamePlayers();
        this.updateGameStatus();
        this.showRoleBasedButtons();
    }
    
    updateRoundInfo(currentRound, totalRounds) {
        document.getElementById('currentRound').textContent = currentRound;
        document.getElementById('gameTotalRounds').textContent = totalRounds;
    }
    
    updateCurrentScores(scores) {
        const container = document.getElementById('roundScores');
        container.innerHTML = '';
        
        scores.forEach((score, index) => {
            const scoreItem = document.createElement('div');
            scoreItem.className = 'score-item';
            if (index === 0) scoreItem.classList.add('winner');
            
            scoreItem.innerHTML = `
                <span class="player-name">${score.playerName}</span>
                <span class="player-score">${score.totalScore}</span>
            `;
            
            container.appendChild(scoreItem);
        });
        
        document.getElementById('roundResults').style.display = 'block';
    }
    
    hideAllActionButtons() {
        document.getElementById('revealRoleBtn').style.display = 'none';
        document.getElementById('showSlipBtn').style.display = 'none';
        document.getElementById('mantriGuessBtn').style.display = 'none';
        document.getElementById('submitMantriGuessBtn').style.display = 'none';
        document.getElementById('rajaDecisionBtn').style.display = 'none';
        document.getElementById('nextRoundBtn').style.display = 'none';
        document.getElementById('endGameBtn').style.display = 'none';
    }
    
    showRoleBasedButtons() {
        // Only show role-specific buttons if player has revealed their role
        if (!this.isRoleRevealed) {
            // Show "Show My Slip" button for all players who haven't revealed their role
            document.getElementById('showSlipBtn').style.display = 'block';
            return;
        }
        
        // Show buttons based on player role (only after role is revealed)
        switch(this.playerRole) {
            case 'mantri':
                document.getElementById('mantriGuessBtn').style.display = 'block';
                break;
            case 'raja':
            case 'sipahi':
            case 'chor':
            case 'rani':
                // These roles just wait - no special actions needed
                break;
            default:
                document.getElementById('showSlipBtn').style.display = 'block';
                break;
        }
        
        // Host can always end game, but next round button is only shown after decision maker evaluates
        if (this.isHost) {
            document.getElementById('endGameBtn').style.display = 'block';
        }
    }
    
    showPlayerNameInputs() {
        const section = document.getElementById('playerNamesSection');
        const inputsContainer = document.getElementById('playerNameInputs');
        
        inputsContainer.innerHTML = '';
        
        this.players.forEach(player => {
            const inputDiv = document.createElement('div');
            inputDiv.className = 'player-name-input';
            
            inputDiv.innerHTML = `
                <label>${player.name}:</label>
                <input type="text" data-player-id="${player.id}" placeholder="Enter name" value="${player.name}" maxlength="20">
            `;
            
            inputsContainer.appendChild(inputDiv);
        });
        
        section.style.display = 'block';
        document.getElementById('confirmNames').style.display = 'block';
    }
    
    updateRoleDisplay() {
        console.log('updateRoleDisplay called with playerRole:', this.playerRole, 'isRoleRevealed:', this.isRoleRevealed);
        
        if (!this.isRoleRevealed) {
            // Show unknown role until player reveals it
            document.getElementById('roleIcon').className = 'fas fa-question';
            document.getElementById('playerRole').textContent = 'Unknown';
            document.getElementById('roleDescription').textContent = 'Click "Show My Slip" to reveal your role';
            document.getElementById('roleIcon').style.color = '#666';
            return;
        }
        
        const roleData = this.getRoleData(this.playerRole);
        console.log('roleData:', roleData);
        
        document.getElementById('roleIcon').className = `fas ${roleData.icon}`;
        document.getElementById('playerRole').textContent = roleData.name;
        document.getElementById('roleDescription').textContent = roleData.description;
        
        // Update role icon color
        const roleIcon = document.getElementById('roleIcon');
        roleIcon.style.color = roleData.color;
    }
    
    updateGamePlayers() {
        const container = document.getElementById('gamePlayersContainer');
        container.innerHTML = '';
        
        this.players.forEach(player => {
            const playerElement = document.createElement('div');
            playerElement.className = 'game-player';
            
            if (player.name === this.playerName) {
                playerElement.classList.add('is-you');
            }
            
            const roleData = player.roleRevealed ? this.getRoleData(player.role) : { name: 'Hidden', color: '#666' };
            
            playerElement.innerHTML = `
                <div class="game-player-avatar">${player.name.charAt(0).toUpperCase()}</div>
                <div class="game-player-name">${player.name}</div>
                <div class="game-player-role" style="color: ${roleData.color}">${roleData.name}</div>
            `;
            
            container.appendChild(playerElement);
        });
    }
    
    updateScoresDisplay(scores) {
        // Create or update scores display
        let scoresContainer = document.getElementById('scoresContainer');
        if (!scoresContainer) {
            scoresContainer = document.createElement('div');
            scoresContainer.id = 'scoresContainer';
            scoresContainer.className = 'scores-display';
            scoresContainer.innerHTML = '<h3>Current Scores</h3>';
            
            // Insert after game status section
            const gameStatus = document.querySelector('.game-status');
            if (gameStatus) {
                gameStatus.parentNode.insertBefore(scoresContainer, gameStatus.nextSibling);
            }
        }
        
        // Sort scores by total score (descending)
        const sortedScores = scores.sort((a, b) => b.totalScore - a.totalScore);
        
        scoresContainer.innerHTML = `
            <h3>Current Scores</h3>
            <div class="scores-list">
                ${sortedScores.map(score => `
                    <div class="score-item">
                        <span class="player-name">${score.playerName}</span>
                        <span class="score-value">${score.totalScore}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    updatePlayersWithRevealedRoles(revealedRoles) {
        // Update the players array with revealed roles
        this.players.forEach(player => {
            const revealedRole = revealedRoles.find(r => r.playerName === player.name);
            if (revealedRole) {
                player.role = revealedRole.role;
                player.roleRevealed = true;
            }
        });
        
        // Update the game players display
        this.updateGamePlayers();
        
        // Update the waiting room players display if we're still there
        this.updatePlayersList();
    }
    
    clearPreviousRoundResults() {
        // Clear guess result summary
        const resultContainer = document.getElementById('guessResultContainer');
        if (resultContainer) {
            resultContainer.remove();
        }
        
        // Clear scores display
        const scoresContainer = document.getElementById('scoresContainer');
        if (scoresContainer) {
            scoresContainer.remove();
        }
        
        // Reset all players' roleRevealed status
        this.players.forEach(player => {
            player.roleRevealed = false;
        });
        
        // Update game players display to show "Hidden" again
        this.updateGamePlayers();
        
        // Hide mantri guessing section if it's visible
        const mantriGuessingSection = document.getElementById('mantriGuessingSection');
        if (mantriGuessingSection) {
            mantriGuessingSection.style.display = 'none';
        }
        
        console.log('Previous round results cleared');
    }
    
    showGuessResultSummary(data) {
        // Create or update guess result summary
        let resultContainer = document.getElementById('guessResultContainer');
        if (!resultContainer) {
            resultContainer = document.createElement('div');
            resultContainer.id = 'guessResultContainer';
            resultContainer.className = 'guess-result-summary';
            
            // Insert after scores container
            const scoresContainer = document.getElementById('scoresContainer');
            if (scoresContainer) {
                scoresContainer.parentNode.insertBefore(resultContainer, scoresContainer.nextSibling);
            }
        }
        
        const roleData = this.getRoleData;
        const resultIcon = data.wasCorrect ? '🎉' : '❌';
        const resultColor = data.wasCorrect ? '#4CAF50' : '#F44336';
        
        resultContainer.innerHTML = `
            <div class="guess-result-header" style="background-color: ${resultColor}">
                <h3>${resultIcon} Round Result</h3>
            </div>
            <div class="guess-result-content">
                <div class="guess-details">
                    <p><strong>Mantri:</strong> ${data.mantriName}</p>
                    <p><strong>Guessed:</strong> ${data.guessedChorName}</p>
                    <p><strong>Actual Chor:</strong> ${data.actualChorName}</p>
                    <p><strong>Result:</strong> ${data.wasCorrect ? 'Correct!' : 'Wrong!'}</p>
                </div>
                <div class="revealed-roles">
                    <h4>All Roles Revealed:</h4>
                    <div class="roles-grid">
                        ${data.revealedRoles.map(role => {
                            const roleInfo = this.getRoleData(role.role);
                            return `
                                <div class="role-reveal-item">
                                    <div class="role-icon" style="background-color: ${roleInfo.color}">
                                        <i class="fas ${roleInfo.icon}"></i>
                                    </div>
                                    <div class="role-details">
                                        <div class="player-name">${role.playerName}</div>
                                        <div class="role-name" style="color: ${roleInfo.color}">${roleInfo.name}</div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;
    }
    
    // Chat functionality
    sendChatMessage() {
        const chatInput = document.getElementById('chatInput');
        const message = chatInput.value.trim();
        
        if (!message) return;
        
        if (message.length > 200) {
            this.showToast('Message too long! Maximum 200 characters.', 'error');
            return;
        }
        
        // Send message to server
        this.socket.emit('chatMessage', {
            message: message
        });
        
        // Clear input
        chatInput.value = '';
    }
    
    addChatMessage(data) {
        const chatMessages = document.getElementById('chatMessages');
        const messageElement = document.createElement('div');
        
        const isOwnMessage = data.senderId === this.socket.id;
        const messageClass = isOwnMessage ? 'own-message' : 'other-message';
        
        const timestamp = new Date(data.timestamp).toLocaleTimeString();
        
        messageElement.className = `chat-message ${messageClass}`;
        messageElement.innerHTML = `
            <div class="message-sender">${data.senderName}</div>
            <div class="message-text">${this.escapeHtml(data.message)}</div>
            <div class="message-time">${timestamp}</div>
        `;
        
        chatMessages.appendChild(messageElement);
        
        // Auto-scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Limit number of messages to prevent memory issues
        const messages = chatMessages.children;
        if (messages.length > 100) {
            chatMessages.removeChild(messages[0]);
        }
    }
    
    toggleChat() {
        const chatContainer = document.getElementById('chatContainer');
        const toggleBtn = document.getElementById('toggleChatBtn');
        const icon = toggleBtn.querySelector('i');
        
        if (chatContainer.classList.contains('collapsed')) {
            chatContainer.classList.remove('collapsed');
            icon.className = 'fas fa-chevron-down';
        } else {
            chatContainer.classList.add('collapsed');
            icon.className = 'fas fa-chevron-up';
        }
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    showGameEndResults(data) {
        // Clear any existing results
        this.clearPreviousRoundResults();
        
        // Create game end results container
        const gameEndContainer = document.createElement('div');
        gameEndContainer.id = 'gameEndContainer';
        gameEndContainer.className = 'game-end-results';
        
        // Insert after game status section
        const gameStatus = document.querySelector('.game-status');
        if (gameStatus) {
            gameStatus.parentNode.insertBefore(gameEndContainer, gameStatus.nextSibling);
        }
        
        const winner = data.winner;
        const winnerIcon = '🏆';
        
        gameEndContainer.innerHTML = `
            <div class="game-end-header" style="background: linear-gradient(135deg, #FFD700, #FFA500);">
                <h2>${winnerIcon} Game Complete! ${winnerIcon}</h2>
                <h3>Winner: ${winner.playerName} with ${winner.totalScore} points!</h3>
            </div>
            <div class="game-end-content">
                <div class="final-scores">
                    <h4>Final Leaderboard</h4>
                    <div class="leaderboard">
                        ${data.finalScores.map((player, index) => {
                            const rank = index + 1;
                            const rankIcon = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;
                            return `
                                <div class="leaderboard-item ${index === 0 ? 'winner' : ''}">
                                    <div class="rank">${rankIcon}</div>
                                    <div class="player-info">
                                        <div class="player-name">${player.playerName}</div>
                                        <div class="total-score">${player.totalScore} points</div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
                <div class="game-end-actions">
                    <button class="btn btn-primary" onclick="gameManager.showPlayAgainScreen()">
                        <i class="fas fa-redo"></i> Play Again
                    </button>
                    <button class="btn btn-secondary" onclick="location.reload()">
                        <i class="fas fa-home"></i> Back to Menu
                    </button>
                </div>
            </div>
        `;
        
        // Hide all game action buttons
        this.hideAllActionButtons();
        
        // Show toast
        this.showToast(`🎉 Game Complete! ${winner.playerName} wins with ${winner.totalScore} points!`, 'success');
    }
    
    updateGameStatus() {
        const statusElement = document.getElementById('gameStatus');
        
        switch (this.gameState) {
            case 'waiting':
                statusElement.textContent = 'Waiting for game to start...';
                break;
            case 'playing':
                statusElement.textContent = 'Game in progress - Try to identify other players\' roles!';
                break;
            case 'ended':
                statusElement.textContent = 'Game ended!';
                break;
        }
    }
    
    getRoleData(role) {
        const roleData = {
            'raja': {
                name: 'Raja (King)',
                icon: 'fa-crown',
                color: '#FFD700',
                description: 'You are the King! Your goal is to identify the Chor (thief) and maintain order in your kingdom.'
            },
            'mantri': {
                name: 'Mantri (Minister)',
                icon: 'fa-user-tie',
                color: '#4CAF50',
                description: 'You are the Minister! Help identify the Chor while maintaining your cover.'
            },
            'chor': {
                name: 'Chor (Thief)',
                icon: 'fa-mask',
                color: '#f44336',
                description: 'You are the Thief! Avoid being identified by other players.'
            },
            'sipahi': {
                name: 'Sipahi (Soldier)',
                icon: 'fa-shield-alt',
                color: '#2196F3',
                description: 'You are the Soldier! Protect the kingdom and help catch the Chor.'
            },
            'rani': {
                name: 'Rani (Queen)',
                icon: 'fa-gem',
                color: '#9C27B0',
                description: 'You are the Queen! Use your royal influence to help the kingdom succeed.'
            }
        };
        
        return roleData[role] || { name: 'Unknown', icon: 'fa-question', color: '#666', description: 'Unknown role' };
    }
    
    updateConnectionStatus(status, text) {
        const statusElement = document.getElementById('connectionStatus');
        const textElement = document.getElementById('connectionText');
        
        statusElement.className = `connection-status ${status}`;
        textElement.textContent = text;
    }
    
    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = type === 'success' ? 'fa-check-circle' : 
                    type === 'error' ? 'fa-exclamation-circle' : 
                    type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle';
        
        toast.innerHTML = `
            <i class="fas ${icon}"></i>
            <span>${message}</span>
        `;
        
        container.appendChild(toast);
        
        // Remove toast after 3 seconds
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
    
    resetGame() {
        this.roomCode = '';
        this.isHost = false;
        this.playerRole = '';
        this.isRoleRevealed = false; // Reset role reveal flag
        this.hasSubmittedGuess = false; // Reset guess submission flag
        this.gameState = 'waiting';
        this.players = [];
        this.maxPlayers = 3;
        
        // Clear form inputs
        document.getElementById('playerName').value = '';
        document.getElementById('joinPlayerName').value = '';
        document.getElementById('roomCode').value = '';
    }
    
    // Play Again functionality
    showPlayAgainScreen() {
        // Instead of showing Play Again screen, move everyone to waiting room
        // This allows new players to join using the room code
        
        // Reset game state
        this.gameState = 'waiting';
        this.isRoleRevealed = false;
        this.hasSubmittedGuess = false;
        
        // Clear previous game results
        this.clearPreviousRoundResults();
        const gameEndContainer = document.getElementById('gameEndContainer');
        if (gameEndContainer) {
            gameEndContainer.remove();
        }
        
        this.socket.emit('playAgain');
    }
    
    updateCurrentPlayersList() {
        const container = document.getElementById('currentPlayersList');
        container.innerHTML = '';
        
        this.players.forEach(player => {
            const playerItem = document.createElement('div');
            playerItem.className = 'current-player-item';
            playerItem.innerHTML = `
                <span class="player-name">${player.name}</span>
                <button class="remove-btn" onclick="gameManager.removePlayer('${player.id}')">
                    <i class="fas fa-times"></i> Remove
                </button>
            `;
            container.appendChild(playerItem);
        });
    }
    
    setupPlayAgainSettings() {
        // Set current settings
        document.getElementById('playAgainRounds').value = this.totalRounds;
        document.getElementById('playAgainMaxPlayers').value = this.maxPlayers;
        
        // Update room code display
        document.getElementById('playAgainRoomCode').textContent = this.roomCode;
    }
    
    copyPlayAgainRoomCode() {
        navigator.clipboard.writeText(this.roomCode).then(() => {
            this.showToast('Room code copied!', 'success');
        });
    }
    
    updateRoomSettings() {
        const maxPlayers = parseInt(document.getElementById('waitingMaxPlayers').value);
        const rounds = parseInt(document.getElementById('waitingRounds').value);
        
        if (this.players.length > maxPlayers) {
            this.showToast(`Cannot reduce max players below current player count (${this.players.length})`, 'error');
            return;
        }
        
        this.socket.emit('updateRoomSettings', {
            maxPlayers: maxPlayers,
            totalRounds: rounds
        });
    }
    
    removePlayer(playerId) {
        if (this.players.length <= 2) {
            this.showToast('Need at least 2 players', 'error');
            return;
        }
        
        const player = this.players.find(p => p.id === playerId);
        if (player) {
            this.players = this.players.filter(p => p.id !== playerId);
            this.updateCurrentPlayersList();
            this.showToast(`${player.name} removed from game`, 'info');
        }
    }
    
    startNewGame() {
        const rounds = parseInt(document.getElementById('playAgainRounds').value);
        const maxPlayers = parseInt(document.getElementById('playAgainMaxPlayers').value);
        
        if (this.players.length < 2) {
            this.showToast('Need at least 2 players', 'error');
            return;
        }
        
        if (this.players.length > maxPlayers) {
            this.showToast(`Too many players for ${maxPlayers} player game`, 'error');
            return;
        }
        
        // Update game settings
        this.totalRounds = rounds;
        this.maxPlayers = maxPlayers;
        
        // Reset game state
        this.gameState = 'waiting';
        this.isRoleRevealed = false;
        this.hasSubmittedGuess = false;
        
        // Clear previous game results
        this.clearPreviousRoundResults();
        const gameEndContainer = document.getElementById('gameEndContainer');
        if (gameEndContainer) {
            gameEndContainer.remove();
        }
        
        // Move everyone to joining screen (waiting room)
        this.showScreen('waitingRoom');
        this.updateRoomInfo();
        this.updatePlayersList();
        
        this.showToast('New game setup complete! Ready to start.', 'success');
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.gameManager = new GameManager();
});

// Legal Document Functions
function showTermsOfService() {
    const modal = document.getElementById('termsModal');
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeTermsModal() {
    const modal = document.getElementById('termsModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

function showPrivacyPolicy() {
    const modal = document.getElementById('privacyModal');
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closePrivacyModal() {
    const modal = document.getElementById('privacyModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Close modals when clicking outside
window.onclick = function(event) {
    const termsModal = document.getElementById('termsModal');
    const privacyModal = document.getElementById('privacyModal');
    
    if (event.target === termsModal) {
        closeTermsModal();
    }
    if (event.target === privacyModal) {
        closePrivacyModal();
    }
}

// Close modals with Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeTermsModal();
        closePrivacyModal();
    }
});
