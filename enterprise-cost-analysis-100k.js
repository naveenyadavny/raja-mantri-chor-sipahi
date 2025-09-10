// Enterprise Cost Analysis for 100k Concurrent Users
// Multi-region, multi-cloud cost breakdown

const enterpriseCostAnalysis = {
    // Infrastructure Costs (Monthly)
    infrastructure: {
        // Compute Resources
        compute: {
            // Game Service Instances
            gameService: {
                instances: 100,
                type: 'c5.2xlarge', // 8 vCPU, 16GB RAM
                costPerInstance: 280, // $280/month
                total: 28000 // $28,000/month
            },
            
            // Room Service Instances
            roomService: {
                instances: 50,
                type: 'c5.xlarge', // 4 vCPU, 8GB RAM
                costPerInstance: 140, // $140/month
                total: 7000 // $7,000/month
            },
            
            // User Service Instances
            userService: {
                instances: 30,
                type: 'c5.large', // 2 vCPU, 4GB RAM
                costPerInstance: 70, // $70/month
                total: 2100 // $2,100/month
            },
            
            // Chat Service Instances
            chatService: {
                instances: 40,
                type: 'c5.xlarge', // 4 vCPU, 8GB RAM
                costPerInstance: 140, // $140/month
                total: 5600 // $5,600/month
            },
            
            // Analytics Service Instances
            analyticsService: {
                instances: 20,
                type: 'c5.2xlarge', // 8 vCPU, 16GB RAM
                costPerInstance: 280, // $280/month
                total: 5600 // $5,600/month
            },
            
            // API Gateway Instances
            apiGateway: {
                instances: 50,
                type: 'c5.large', // 2 vCPU, 4GB RAM
                costPerInstance: 70, // $70/month
                total: 3500 // $3,500/month
            },
            
            totalCompute: 56800 // $56,800/month
        },

        // Database Costs
        database: {
            // MongoDB Sharded Cluster
            mongodb: {
                shards: 20,
                replicaSets: 3,
                totalInstances: 60,
                type: 'r5.2xlarge', // 8 vCPU, 64GB RAM
                costPerInstance: 500, // $500/month
                total: 30000 // $30,000/month
            },
            
            // Redis Cluster
            redis: {
                nodes: 30,
                type: 'r5.xlarge', // 4 vCPU, 32GB RAM
                costPerInstance: 250, // $250/month
                total: 7500 // $7,500/month
            },
            
            // Time Series Database
            timeseries: {
                instances: 10,
                type: 'r5.large', // 2 vCPU, 16GB RAM
                costPerInstance: 125, // $125/month
                total: 1250 // $1,250/month
            },
            
            // Search Engine
            search: {
                instances: 15,
                type: 'r5.xlarge', // 4 vCPU, 32GB RAM
                costPerInstance: 250, // $250/month
                total: 3750 // $3,750/month
            },
            
            totalDatabase: 42500 // $42,500/month
        },

        // Network and Load Balancing
        network: {
            // Load Balancers
            loadBalancers: {
                instances: 20,
                type: 'nlb',
                costPerInstance: 50, // $50/month
                total: 1000 // $1,000/month
            },
            
            // Data Transfer
            dataTransfer: {
                outbound: 100, // TB/month
                costPerTB: 90, // $90/TB
                total: 9000 // $9,000/month
            },
            
            // CDN
            cdn: {
                provider: 'cloudflare',
                bandwidth: 1000, // TB/month
                costPerTB: 10, // $10/TB
                total: 10000 // $10,000/month
            },
            
            totalNetwork: 20000 // $20,000/month
        },

        // Storage
        storage: {
            // Block Storage
            blockStorage: {
                size: 100, // TB
                costPerTB: 100, // $100/TB
                total: 10000 // $10,000/month
            },
            
            // Object Storage
            objectStorage: {
                size: 500, // TB
                costPerTB: 20, // $20/TB
                total: 10000 // $10,000/month
            },
            
            // Backup Storage
            backupStorage: {
                size: 200, // TB
                costPerTB: 15, // $15/TB
                total: 3000 // $3,000/month
            },
            
            totalStorage: 23000 // $23,000/month
        },

        // Monitoring and Security
        monitoring: {
            // Monitoring Tools
            monitoringTools: {
                datadog: 2000, // $2,000/month
                newrelic: 1500, // $1,500/month
                prometheus: 500, // $500/month
                total: 4000 // $4,000/month
            },
            
            // Security Tools
            securityTools: {
                waf: 1000, // $1,000/month
                ddosProtection: 2000, // $2,000/month
                sslCertificates: 500, // $500/month
                total: 3500 // $3,500/month
            },
            
            totalMonitoring: 7500 // $7,500/month
        },

        // Total Infrastructure Cost
        totalInfrastructure: 149800 // $149,800/month
    },

    // Operational Costs
    operational: {
        // Team Costs
        team: {
            // Engineering Team
            engineering: {
                seniorEngineers: 10,
                costPerEngineer: 15000, // $15,000/month
                total: 150000 // $150,000/month
            },
            
            // DevOps Team
            devops: {
                engineers: 5,
                costPerEngineer: 12000, // $12,000/month
                total: 60000 // $60,000/month
            },
            
            // SRE Team
            sre: {
                engineers: 3,
                costPerEngineer: 14000, // $14,000/month
                total: 42000 // $42,000/month
            },
            
            // Security Team
            security: {
                engineers: 2,
                costPerEngineer: 13000, // $13,000/month
                total: 26000 // $26,000/month
            },
            
            totalTeam: 278000 // $278,000/month
        },

        // Support and Maintenance
        support: {
            // 24/7 Support
            support24x7: {
                engineers: 8,
                costPerEngineer: 8000, // $8,000/month
                total: 64000 // $64,000/month
            },
            
            // Third-party Support
            thirdPartySupport: {
                mongodb: 5000, // $5,000/month
                redis: 3000, // $3,000/month
                cloudflare: 2000, // $2,000/month
                total: 10000 // $10,000/month
            },
            
            totalSupport: 74000 // $74,000/month
        },

        // Total Operational Cost
        totalOperational: 352000 // $352,000/month
    },

    // Revenue Projections
    revenueProjections: {
        // Ad Revenue (100k users)
        adRevenue: {
            dailyActiveUsers: 100000,
            avgSessionTime: 20, // minutes
            adImpressionsPerSession: 5,
            dailyImpressions: 500000,
            monthlyImpressions: 15000000,
            cpm: 3, // $3 per 1000 impressions
            monthlyAdRevenue: 45000 // $45,000/month
        },
        
        // Premium Features
        premiumFeatures: {
            premiumUsers: 10000, // 10% conversion
            monthlyFee: 10, // $10/month
            monthlyRevenue: 100000 // $100,000/month
        },
        
        // In-Game Purchases
        inGamePurchases: {
            payingUsers: 20000, // 20% conversion
            avgSpendPerUser: 15, // $15/month
            monthlyRevenue: 300000 // $300,000/month
        },
        
        // Enterprise Licenses
        enterpriseLicenses: {
            enterpriseClients: 50,
            licenseFee: 5000, // $5,000/month
            monthlyRevenue: 250000 // $250,000/month
        },
        
        // API Access
        apiAccess: {
            apiCalls: 1000000000, // 1B calls/month
            costPerCall: 0.001, // $0.001/call
            monthlyRevenue: 1000000 // $1,000,000/month
        },
        
        totalMonthlyRevenue: 1695000 // $1,695,000/month
    },

    // ROI Analysis
    roi: {
        monthlyCosts: 501800, // $501,800/month
        monthlyRevenue: 1695000, // $1,695,000/month
        monthlyProfit: 1193200, // $1,193,200/month
        profitMargin: 70.4, // 70.4%
        breakEvenUsers: 29500, // Users needed to break even
        annualProfit: 14318400 // $14,318,400/year
    },

    // Scaling Timeline
    scalingTimeline: {
        phase1: {
            users: '0-1k',
            cost: '$0-500/month',
            infrastructure: 'Single server',
            timeline: 'Month 1-3'
        },
        phase2: {
            users: '1k-10k',
            cost: '$500-5k/month',
            infrastructure: 'Load balancer + Database',
            timeline: 'Month 4-12'
        },
        phase3: {
            users: '10k-50k',
            cost: '$5k-25k/month',
            infrastructure: 'Microservices + Multi-region',
            timeline: 'Year 2'
        },
        phase4: {
            users: '50k-100k',
            cost: '$25k-50k/month',
            infrastructure: 'Enterprise architecture',
            timeline: 'Year 3+'
        }
    }
};

module.exports = {
    enterpriseCostAnalysis
};
