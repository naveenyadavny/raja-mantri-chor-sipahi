// Ad Management System for Raja Mantri Chor Sipahi
// This file handles ad placement and management

/*
 * Copyright (c) 2024 Raja Mantri Chor Sipahi Game
 * All rights reserved.
 * 
 * This software is proprietary and confidential.
 * Unauthorized copying, distribution, or modification is prohibited.
 * 
 * Raja Mantri Chor Sipahi - Ad Management System
 * Developed with JavaScript for revenue optimization
 */

class AdManager {
    constructor() {
        this.adSpaces = {
            'banner-top': document.querySelector('.ad-banner-top'),
            'banner-bottom': document.querySelector('.ad-banner-bottom'),
            'sidebar': document.querySelector('.ad-sidebar')
        };
        
        this.isAdBlocked = false;
        this.adRevenue = 0;
        this.init();
    }
    
    init() {
        // Check if ad blocker is active
        this.checkAdBlocker();
        
        // Initialize ad spaces
        this.initializeAdSpaces();
        
        // Set up ad refresh intervals
        this.setupAdRefresh();
        
        console.log('Ad Manager initialized');
    }
    
    checkAdBlocker() {
        // Simple ad blocker detection
        const testAd = document.createElement('div');
        testAd.innerHTML = '&nbsp;';
        testAd.className = 'adsbox';
        testAd.style.position = 'absolute';
        testAd.style.left = '-999px';
        document.body.appendChild(testAd);
        
        setTimeout(() => {
            if (testAd.offsetHeight === 0) {
                this.isAdBlocked = true;
                console.log('Ad blocker detected');
                this.handleAdBlocker();
            }
            document.body.removeChild(testAd);
        }, 100);
    }
    
    handleAdBlocker() {
        // Show message to users with ad blockers
        const message = document.createElement('div');
        message.className = 'ad-blocker-message';
        message.innerHTML = `
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; margin: 10px; border-radius: 5px; text-align: center;">
                <i class="fas fa-info-circle"></i>
                <span>Please consider disabling your ad blocker to support the game!</span>
            </div>
        `;
        
        // Insert message at the top of the page
        document.body.insertBefore(message, document.body.firstChild);
        
        // Remove message after 5 seconds
        setTimeout(() => {
            if (message.parentNode) {
                message.parentNode.removeChild(message);
            }
        }, 5000);
    }
    
    initializeAdSpaces() {
        Object.keys(this.adSpaces).forEach(key => {
            const adSpace = this.adSpaces[key];
            if (adSpace) {
                this.setupAdSpace(adSpace, key);
            }
        });
    }
    
    setupAdSpace(adSpace, type) {
        // Add click tracking
        adSpace.addEventListener('click', () => {
            this.trackAdClick(type);
        });
        
        // Add hover effects
        adSpace.addEventListener('mouseenter', () => {
            adSpace.style.transform = 'scale(1.02)';
        });
        
        adSpace.addEventListener('mouseleave', () => {
            adSpace.style.transform = 'scale(1)';
        });
    }
    
    setupAdRefresh() {
        // Refresh ads every 30 seconds (when real ads are implemented)
        setInterval(() => {
            this.refreshAds();
        }, 30000);
    }
    
    refreshAds() {
        // This will be used when real ads are implemented
        console.log('Refreshing ads...');
    }
    
    trackAdClick(adType) {
        // Track ad clicks for analytics
        console.log(`Ad clicked: ${adType}`);
        this.adRevenue += 0.01; // Example: $0.01 per click
        
        // Send analytics data (when analytics is implemented)
        this.sendAnalytics('ad_click', {
            ad_type: adType,
            timestamp: new Date().toISOString(),
            revenue: 0.01
        });
    }
    
    trackAdView(adType) {
        // Track ad views for analytics
        console.log(`Ad viewed: ${adType}`);
        
        // Send analytics data
        this.sendAnalytics('ad_view', {
            ad_type: adType,
            timestamp: new Date().toISOString()
        });
    }
    
    sendAnalytics(event, data) {
        // Placeholder for analytics integration
        // This will be implemented when analytics service is added
        console.log('Analytics:', event, data);
    }
    
    // Method to replace placeholder with real ads
    loadRealAd(adType, adCode) {
        const adSpace = this.adSpaces[adType];
        if (adSpace) {
            adSpace.innerHTML = adCode;
            this.trackAdView(adType);
        }
    }
    
    // Method to hide/show ads based on user preferences
    toggleAds(show) {
        Object.values(this.adSpaces).forEach(adSpace => {
            if (adSpace) {
                adSpace.style.display = show ? 'flex' : 'none';
            }
        });
    }
    
    // Get ad revenue statistics
    getAdStats() {
        return {
            revenue: this.adRevenue,
            adBlocked: this.isAdBlocked,
            adSpaces: Object.keys(this.adSpaces).length
        };
    }
}

// Initialize Ad Manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adManager = new AdManager();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdManager;
}
