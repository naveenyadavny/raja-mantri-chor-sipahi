# Cost Analysis for 10k Concurrent Users
# Monthly infrastructure costs breakdown

const costAnalysis = {
    // Cloud Provider Options
    providers: {
        // AWS
        aws: {
            ec2: {
                instances: 20, // Game service instances
                type: 't3.large', // 2 vCPU, 8GB RAM
                costPerInstance: 60, // $60/month
                total: 1200 // $1200/month
            },
            rds: {
                type: 'db.r5.large', // MongoDB Atlas
                cost: 200 // $200/month
            },
            elb: {
                type: 'Application Load Balancer',
                cost: 20 // $20/month
            },
            redis: {
                type: 'ElastiCache r5.large',
                cost: 150 // $150/month
            },
            total: 1570 // $1570/month
        },
        
        // Google Cloud
        gcp: {
            compute: {
                instances: 20,
                type: 'e2-standard-2', // 2 vCPU, 8GB RAM
                costPerInstance: 50, // $50/month
                total: 1000 // $1000/month
            },
            cloudSQL: {
                type: 'db-standard-2',
                cost: 180 // $180/month
            },
            loadBalancer: {
                cost: 25 // $25/month
            },
            memorystore: {
                cost: 120 // $120/month
            },
            total: 1325 // $1325/month
        },
        
        // DigitalOcean
        digitalocean: {
            droplets: {
                instances: 20,
                type: 's-4vcpu-8gb', // 4 vCPU, 8GB RAM
                costPerInstance: 48, // $48/month
                total: 960 // $960/month
            },
            managedDatabase: {
                type: 'db-s-2vcpu-4gb',
                cost: 120 // $120/month
            },
            loadBalancer: {
                cost: 15 // $15/month
            },
            total: 1095 // $1095/month
        },
        
        // Azure
        azure: {
            virtualMachines: {
                instances: 20,
                type: 'Standard_B2s', // 2 vCPU, 4GB RAM
                costPerInstance: 45, // $45/month
                total: 900 // $900/month
            },
            cosmosDB: {
                type: 'Standard',
                cost: 200 // $200/month
            },
            loadBalancer: {
                cost: 25 // $25/month
            },
            total: 1125 // $1125/month
        }
    },
    
    // Additional Costs
    additionalCosts: {
        cdn: {
            cloudflare: 20, // $20/month
            awsCloudFront: 50 // $50/month
        },
        monitoring: {
            datadog: 100, // $100/month
            newrelic: 80 // $80/month
        },
        security: {
            ssl: 0, // Free with Let's Encrypt
            waf: 50 // $50/month
        },
        backup: {
            automated: 30 // $30/month
        }
    },
    
    // Revenue Projections
    revenueProjections: {
        // Ad Revenue (10k users)
        adRevenue: {
            dailyActiveUsers: 10000,
            avgSessionTime: 15, // minutes
            adImpressionsPerSession: 3,
            dailyImpressions: 30000,
            monthlyImpressions: 900000,
            cpm: 2, // $2 per 1000 impressions
            monthlyAdRevenue: 1800 // $1800/month
        },
        
        // Premium Features
        premiumFeatures: {
            premiumUsers: 500, // 5% conversion
            monthlyFee: 5, // $5/month
            monthlyRevenue: 2500 // $2500/month
        },
        
        // In-Game Purchases
        inGamePurchases: {
            payingUsers: 1000, // 10% conversion
            avgSpendPerUser: 3, // $3/month
            monthlyRevenue: 3000 // $3000/month
        },
        
        totalMonthlyRevenue: 7300 // $7300/month
    },
    
    // ROI Analysis
    roi: {
        monthlyCosts: 1570, // AWS (highest cost)
        monthlyRevenue: 7300,
        monthlyProfit: 5730,
        profitMargin: 78.5, // 78.5%
        breakEvenUsers: 2150 // Users needed to break even
    }
};

// Scaling Timeline
const scalingTimeline = {
    phase1: {
        users: '0-100',
        cost: '$0-50/month',
        infrastructure: 'Single server',
        timeline: 'Month 1-2'
    },
    phase2: {
        users: '100-1000',
        cost: '$50-200/month',
        infrastructure: 'Load balancer + Database',
        timeline: 'Month 3-6'
    },
    phase3: {
        users: '1000-5000',
        cost: '$200-800/month',
        infrastructure: 'Microservices + Redis',
        timeline: 'Month 7-12'
    },
    phase4: {
        users: '5000-10000',
        cost: '$800-1600/month',
        infrastructure: 'Full microservices + CDN',
        timeline: 'Year 2+'
    }
};

module.exports = {
    costAnalysis,
    scalingTimeline
};
