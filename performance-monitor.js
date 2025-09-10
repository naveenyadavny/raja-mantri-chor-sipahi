// Performance Monitoring for Raja Mantri Chor Sipahi
// This file monitors server performance and user capacity

class PerformanceMonitor {
    constructor() {
        this.stats = {
            totalConnections: 0,
            activeRooms: 0,
            totalPlayers: 0,
            memoryUsage: 0,
            uptime: 0,
            startTime: Date.now()
        };
        
        this.connectionLimits = {
            maxConnections: 1000,
            maxRooms: 200,
            maxPlayersPerRoom: 5
        };
        
        this.startMonitoring();
    }
    
    startMonitoring() {
        // Monitor every 30 seconds
        setInterval(() => {
            this.updateStats();
            this.checkLimits();
            this.logStats();
        }, 30000);
        
        // Monitor memory every 5 minutes
        setInterval(() => {
            this.checkMemoryUsage();
        }, 300000);
    }
    
    updateStats() {
        this.stats.totalConnections = this.getTotalConnections();
        this.stats.activeRooms = this.getActiveRooms();
        this.stats.totalPlayers = this.getTotalPlayers();
        this.stats.memoryUsage = process.memoryUsage();
        this.stats.uptime = Date.now() - this.stats.startTime;
    }
    
    getTotalConnections() {
        // This would be implemented with actual socket connections
        return global.io ? global.io.engine.clientsCount : 0;
    }
    
    getActiveRooms() {
        // This would be implemented with actual room data
        return global.rooms ? global.rooms.size : 0;
    }
    
    getTotalPlayers() {
        // This would be implemented with actual player data
        return global.players ? global.players.size : 0;
    }
    
    checkLimits() {
        const warnings = [];
        
        if (this.stats.totalConnections > this.connectionLimits.maxConnections * 0.8) {
            warnings.push(`High connection count: ${this.stats.totalConnections}/${this.connectionLimits.maxConnections}`);
        }
        
        if (this.stats.activeRooms > this.connectionLimits.maxRooms * 0.8) {
            warnings.push(`High room count: ${this.stats.activeRooms}/${this.connectionLimits.maxRooms}`);
        }
        
        if (warnings.length > 0) {
            console.warn('⚠️ Performance Warnings:', warnings);
        }
    }
    
    checkMemoryUsage() {
        const memUsage = process.memoryUsage();
        const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
        
        if (heapUsedMB > 100) {
            console.warn(`⚠️ High memory usage: ${heapUsedMB}MB`);
        }
        
        if (heapUsedMB > 200) {
            console.error(`🚨 Critical memory usage: ${heapUsedMB}MB`);
        }
    }
    
    logStats() {
        const uptimeHours = Math.round(this.stats.uptime / 1000 / 60 / 60 * 10) / 10;
        const memUsageMB = Math.round(this.stats.memoryUsage.heapUsed / 1024 / 1024);
        
        console.log(`
📊 Server Stats:
├── Connections: ${this.stats.totalConnections}/${this.connectionLimits.maxConnections}
├── Active Rooms: ${this.stats.activeRooms}/${this.connectionLimits.maxRooms}
├── Total Players: ${this.stats.totalPlayers}
├── Memory Usage: ${memUsageMB}MB
└── Uptime: ${uptimeHours}h
        `);
    }
    
    getCapacityInfo() {
        return {
            current: {
                connections: this.stats.totalConnections,
                rooms: this.stats.activeRooms,
                players: this.stats.totalPlayers,
                memoryMB: Math.round(this.stats.memoryUsage.heapUsed / 1024 / 1024)
            },
            limits: this.connectionLimits,
            utilization: {
                connections: Math.round((this.stats.totalConnections / this.connectionLimits.maxConnections) * 100),
                rooms: Math.round((this.stats.activeRooms / this.connectionLimits.maxRooms) * 100)
            }
        };
    }
    
    // Method to get current capacity status
    getCapacityStatus() {
        const utilization = this.getCapacityInfo().utilization;
        
        if (utilization.connections > 90 || utilization.rooms > 90) {
            return 'CRITICAL';
        } else if (utilization.connections > 70 || utilization.rooms > 70) {
            return 'HIGH';
        } else if (utilization.connections > 50 || utilization.rooms > 50) {
            return 'MEDIUM';
        } else {
            return 'LOW';
        }
    }
}

// Export for use in server.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceMonitor;
}

// Initialize if running in browser
if (typeof window !== 'undefined') {
    window.PerformanceMonitor = PerformanceMonitor;
}
