/**
 * InstallAnalytics - Tracks PWA installation events and provides analytics
 * Part of the Enhanced PWA Installation Prompts feature
 */
class InstallAnalytics {
    constructor() {
        this.storageKey = 'jobTracker_installAnalytics';
        this.init();
    }

    init() {
        // Ensure analytics data structure exists
        if (!this.getAnalyticsData()) {
            this.initializeAnalyticsData();
        }
    }

    /**
     * Initialize empty analytics data structure
     */
    initializeAnalyticsData() {
        const initialData = {
            events: [],
            summary: {
                totalPrompts: 0,
                installClicks: 0,
                dismissals: 0,
                dontAskAgainClicks: 0,
                installSuccess: false,
                conversionRate: 0,
                firstPromptDate: null,
                lastEventDate: null
            }
        };
        
        this.saveAnalyticsData(initialData);
        return initialData;
    }

    /**
     * Get analytics data from localStorage with enhanced error handling
     * @returns {Object} Analytics data object
     */
    getAnalyticsData() {
        try {
            // Check if localStorage is available
            if (typeof Storage === 'undefined') {
                console.warn('[InstallAnalytics] localStorage not available, using fallback');
                return this.getFallbackData();
            }

            const data = localStorage.getItem(this.storageKey);
            if (!data) {
                return null;
            }

            // Validate JSON length before parsing
            if (data.length > 50000) { // 50KB limit for analytics data
                console.warn('[InstallAnalytics] Analytics data too large, reinitializing');
                return this.initializeAnalyticsData();
            }
            
            const parsedData = JSON.parse(data);
            
            // Validate data structure
            if (!this.validateAnalyticsData(parsedData)) {
                console.warn('[InstallAnalytics] Invalid analytics data structure, reinitializing');
                return this.initializeAnalyticsData();
            }

            // Sanitize events array to prevent excessive data
            if (parsedData.events && Array.isArray(parsedData.events)) {
                // Limit to last 1000 events to prevent memory issues
                if (parsedData.events.length > 1000) {
                    parsedData.events = parsedData.events.slice(-1000);
                    console.warn('[InstallAnalytics] Trimmed analytics events to last 1000 entries');
                }
                
                // Validate each event
                parsedData.events = parsedData.events.filter(event => {
                    return event && 
                           typeof event === 'object' && 
                           typeof event.type === 'string' && 
                           typeof event.timestamp === 'string' &&
                           event.type.length < 100 &&
                           event.timestamp.length < 50;
                });
            }

            return parsedData;
        } catch (error) {
            console.error('[InstallAnalytics] Error reading analytics data:', error);
            
            // Try to recover by reinitializing
            try {
                return this.initializeAnalyticsData();
            } catch (recoveryError) {
                console.error('[InstallAnalytics] Recovery failed, using fallback:', recoveryError);
                return this.getFallbackData();
            }
        }
    }

    /**
     * Save analytics data to localStorage with enhanced error handling
     * @param {Object} data - Analytics data to save
     */
    saveAnalyticsData(data) {
        try {
            // Check if localStorage is available
            if (typeof Storage === 'undefined') {
                console.warn('[InstallAnalytics] localStorage not available, cannot save data');
                return;
            }

            // Validate data before saving
            if (!this.validateAnalyticsData(data)) {
                console.error('[InstallAnalytics] Invalid data structure, cannot save');
                return;
            }

            // Try to save data
            const serializedData = JSON.stringify(data);
            localStorage.setItem(this.storageKey, serializedData);
        } catch (error) {
            console.error('[InstallAnalytics] Error saving analytics data:', error);
            
            // Check if it's a quota exceeded error
            if (error.name === 'QuotaExceededError' || error.code === 22) {
                console.warn('[InstallAnalytics] Storage quota exceeded, attempting cleanup');
                this.cleanupOldData(data);
            }
        }
    }

    /**
     * Validate analytics data structure
     * @param {Object} data - Data to validate
     * @returns {boolean} True if valid
     */
    validateAnalyticsData(data) {
        try {
            if (!data || typeof data !== 'object') {
                return false;
            }

            // Check required properties
            if (!Array.isArray(data.events)) {
                return false;
            }

            if (!data.summary || typeof data.summary !== 'object') {
                return false;
            }

            // Check summary structure
            const requiredSummaryFields = ['totalPrompts', 'installClicks', 'dismissals', 'conversionRate'];
            for (const field of requiredSummaryFields) {
                if (typeof data.summary[field] !== 'number') {
                    return false;
                }
            }

            return true;
        } catch (error) {
            console.error('[InstallAnalytics] Error validating data:', error);
            return false;
        }
    }

    /**
     * Get fallback data when localStorage fails
     * @returns {Object} Fallback analytics data
     */
    getFallbackData() {
        return {
            events: [],
            summary: {
                totalPrompts: 0,
                installClicks: 0,
                dismissals: 0,
                dontAskAgainClicks: 0,
                installSuccess: false,
                conversionRate: 0,
                firstPromptDate: null,
                lastEventDate: null
            }
        };
    }

    /**
     * Clean up old data when storage quota is exceeded
     * @param {Object} currentData - Current data to save
     */
    cleanupOldData(currentData) {
        try {
            // Keep only the last 50 events
            if (currentData.events && currentData.events.length > 50) {
                currentData.events = currentData.events.slice(-50);
                console.log('[InstallAnalytics] Cleaned up old events, keeping last 50');
            }

            // Try to save the cleaned data
            const serializedData = JSON.stringify(currentData);
            localStorage.setItem(this.storageKey, serializedData);
            console.log('[InstallAnalytics] Successfully saved cleaned data');
        } catch (error) {
            console.error('[InstallAnalytics] Cleanup failed:', error);
            // Last resort - clear all analytics data
            try {
                localStorage.removeItem(this.storageKey);
                console.warn('[InstallAnalytics] Cleared all analytics data due to storage issues');
            } catch (clearError) {
                console.error('[InstallAnalytics] Could not clear analytics data:', clearError);
            }
        }
    }

    /**
     * Create a new analytics event
     * @param {string} type - Event type
     * @param {Object} additionalData - Additional event data
     * @returns {Object} Event object
     */
    createEvent(type, additionalData = {}) {
        const event = {
            type,
            timestamp: new Date().toISOString(),
            platform: this.getPlatformInfo(),
            browser: this.getBrowserInfo(),
            sessionCount: this.getSessionCount(),
            jobCount: this.getJobCount(),
            ...additionalData
        };

        return event;
    }

    /**
     * Safely create a new analytics event with error handling
     * @param {string} type - Event type
     * @param {Object} additionalData - Additional event data
     * @returns {Object|null} Event object or null if failed
     */
    createEventSafely(type, additionalData = {}) {
        try {
            return {
                type: type || 'unknown',
                timestamp: new Date().toISOString(),
                platform: this.getPlatformInfoSafely(),
                browser: this.getBrowserInfoSafely(),
                sessionCount: this.getSessionCountSafely(),
                jobCount: this.getJobCountSafely(),
                ...additionalData
            };
        } catch (error) {
            console.error('[InstallAnalytics] Error creating event:', error);
            return {
                type: type || 'unknown',
                timestamp: new Date().toISOString(),
                platform: 'unknown',
                browser: 'unknown',
                sessionCount: 0,
                jobCount: 0,
                error: error.message
            };
        }
    }

    /**
     * Safely update conversion rate with error handling
     * @param {Object} data - Analytics data
     */
    updateConversionRateSafely(data) {
        try {
            this.updateConversionRate(data);
        } catch (error) {
            console.error('[InstallAnalytics] Error updating conversion rate:', error);
            // Set safe fallback
            if (data.summary) {
                data.summary.conversionRate = 0;
            }
        }
    }

    /**
     * Handle tracking errors
     * @param {string} method - Method that failed
     * @param {Error} error - Error that occurred
     * @param {Object} context - Context data
     */
    handleTrackingError(method, error, context = {}) {
        try {
            console.error(`[InstallAnalytics] Tracking error in ${method}:`, error);
            
            // Try to save error event if possible
            const errorEvent = {
                type: 'tracking_error',
                timestamp: new Date().toISOString(),
                method,
                error: error.message,
                context
            };

            // Try to get existing data and add error event
            let data = this.getFallbackData();
            try {
                const existingData = this.getAnalyticsData();
                if (existingData) {
                    data = existingData;
                }
            } catch (getError) {
                console.error('[InstallAnalytics] Could not get existing data for error tracking:', getError);
            }

            data.events.push(errorEvent);
            this.saveAnalyticsData(data);
        } catch (handlingError) {
            console.error('[InstallAnalytics] Error handling tracking error:', handlingError);
        }
    }

    /**
     * Safely get platform information
     * @returns {string} Platform name
     */
    getPlatformInfoSafely() {
        try {
            return this.getPlatformInfo();
        } catch (error) {
            console.error('[InstallAnalytics] Error getting platform info:', error);
            return 'unknown';
        }
    }

    /**
     * Safely get browser information
     * @returns {string} Browser name
     */
    getBrowserInfoSafely() {
        try {
            return this.getBrowserInfo();
        } catch (error) {
            console.error('[InstallAnalytics] Error getting browser info:', error);
            return 'unknown';
        }
    }

    /**
     * Safely get session count
     * @returns {number} Session count
     */
    getSessionCountSafely() {
        try {
            return this.getSessionCount();
        } catch (error) {
            console.error('[InstallAnalytics] Error getting session count:', error);
            return 0;
        }
    }

    /**
     * Safely get job count
     * @returns {number} Job count
     */
    getJobCountSafely() {
        try {
            return this.getJobCount();
        } catch (error) {
            console.error('[InstallAnalytics] Error getting job count:', error);
            return 0;
        }
    }

    /**
     * Track when installation prompt is shown
     * @param {Object} context - Additional context data
     */
    trackPromptShown(context = {}) {
        try {
            let data = this.getAnalyticsData();
            if (!data) {
                data = this.initializeAnalyticsData();
            }

            const event = this.createEventSafely('prompt_shown', context);
            if (!event) {
                console.error('[InstallAnalytics] Failed to create prompt shown event');
                return;
            }

            // Add event with error handling
            if (!Array.isArray(data.events)) {
                data.events = [];
            }
            data.events.push(event);
            
            // Update summary with error handling
            if (!data.summary) {
                data.summary = {};
            }
            data.summary.totalPrompts = (data.summary.totalPrompts || 0) + 1;
            
            if (!data.summary.firstPromptDate) {
                data.summary.firstPromptDate = event.timestamp;
            }
            data.summary.lastEventDate = event.timestamp;

            this.updateConversionRateSafely(data);
            this.saveAnalyticsData(data);

            console.log('[InstallAnalytics] Prompt shown tracked:', event);
        } catch (error) {
            console.error('[InstallAnalytics] Error tracking prompt shown:', error);
            this.handleTrackingError('trackPromptShown', error, context);
        }
    }

    /**
     * Track when user clicks install button
     * @param {Object} context - Additional context data
     */
    trackInstallClick(context = {}) {
        let data = this.getAnalyticsData();
        if (!data) {
            data = this.initializeAnalyticsData();
        }

        const event = this.createEvent('install_clicked', context);
        data.events.push(event);
        
        // Update summary
        data.summary.installClicks++;
        data.summary.lastEventDate = event.timestamp;

        this.updateConversionRate(data);
        this.saveAnalyticsData(data);

        console.log('[InstallAnalytics] Install click tracked:', event);
    }

    /**
     * Track when user dismisses prompt (Not Now)
     * @param {Object} context - Additional context data
     */
    trackDismiss(context = {}) {
        let data = this.getAnalyticsData();
        if (!data) {
            data = this.initializeAnalyticsData();
        }

        const event = this.createEvent('dismissed', context);
        data.events.push(event);
        
        // Update summary
        data.summary.dismissals++;
        data.summary.lastEventDate = event.timestamp;

        this.updateConversionRate(data);
        this.saveAnalyticsData(data);

        console.log('[InstallAnalytics] Dismiss tracked:', event);
    }

    /**
     * Track when user clicks "Don't Ask Again"
     * @param {Object} context - Additional context data
     */
    trackDontAskAgain(context = {}) {
        let data = this.getAnalyticsData();
        if (!data) {
            data = this.initializeAnalyticsData();
        }

        const event = this.createEvent('dont_ask_again', context);
        data.events.push(event);
        
        // Update summary
        data.summary.dontAskAgainClicks++;
        data.summary.lastEventDate = event.timestamp;

        this.updateConversionRate(data);
        this.saveAnalyticsData(data);

        console.log('[InstallAnalytics] Don\'t ask again tracked:', event);
    }

    /**
     * Track successful installation
     * @param {Object} context - Additional context data
     */
    trackInstallSuccess(context = {}) {
        let data = this.getAnalyticsData();
        if (!data) {
            data = this.initializeAnalyticsData();
        }

        const event = this.createEvent('install_success', context);
        data.events.push(event);
        
        // Update summary
        data.summary.installSuccess = true;
        data.summary.lastEventDate = event.timestamp;

        this.updateConversionRate(data);
        this.saveAnalyticsData(data);

        console.log('[InstallAnalytics] Install success tracked:', event);
    }

    /**
     * Track when installation instructions are shown
     * @param {string} instructionType - Type of instructions ('ios', 'firefox', 'generic')
     * @param {Object} context - Additional context data
     */
    trackInstructionsShown(instructionType, context = {}) {
        let data = this.getAnalyticsData();
        if (!data) {
            data = this.initializeAnalyticsData();
        }

        const event = this.createEvent('instructions_shown', {
            instructionType,
            ...context
        });
        data.events.push(event);
        
        // Update summary
        if (!data.summary.instructionsShown) {
            data.summary.instructionsShown = {};
        }
        if (!data.summary.instructionsShown[instructionType]) {
            data.summary.instructionsShown[instructionType] = 0;
        }
        data.summary.instructionsShown[instructionType]++;
        data.summary.lastEventDate = event.timestamp;

        this.saveAnalyticsData(data);

        console.log('[InstallAnalytics] Install success tracked:', event);
    }

    /**
     * Track error events
     * @param {Error} error - Error object
     * @param {Object} context - Additional context data
     */
    trackError(error, context = {}) {
        let data = this.getAnalyticsData();
        if (!data) {
            data = this.initializeAnalyticsData();
        }

        const event = this.createEvent('error', {
            errorMessage: error.message,
            errorStack: error.stack,
            ...context
        });
        data.events.push(event);
        data.summary.lastEventDate = event.timestamp;

        this.saveAnalyticsData(data);

        console.log('[InstallAnalytics] Error tracked:', event);
    }

    /**
     * Update conversion rate in summary
     * @param {Object} data - Analytics data
     */
    updateConversionRate(data) {
        if (data.summary.totalPrompts > 0) {
            data.summary.conversionRate = (data.summary.installClicks / data.summary.totalPrompts) * 100;
        } else {
            data.summary.conversionRate = 0;
        }
    }

    /**
     * Get installation metrics for dashboard display
     * @returns {Object} Formatted metrics object
     */
    getInstallMetrics() {
        let data = this.getAnalyticsData();
        if (!data) {
            data = this.initializeAnalyticsData();
        }

        const metrics = {
            summary: { ...data.summary },
            events: [...data.events],
            funnel: this.calculateInstallationFunnel(data),
            platformBreakdown: this.calculatePlatformBreakdown(data),
            timelineData: this.calculateTimelineData(data),
            recentActivity: this.getRecentActivity(data)
        };

        return metrics;
    }

    /**
     * Calculate installation funnel metrics
     * @param {Object} data - Analytics data
     * @returns {Object} Funnel metrics
     */
    calculateInstallationFunnel(data) {
        const funnel = {
            promptsShown: data.summary.totalPrompts,
            installClicks: data.summary.installClicks,
            dismissals: data.summary.dismissals,
            dontAskAgain: data.summary.dontAskAgainClicks,
            installSuccess: data.summary.installSuccess ? 1 : 0,
            clickThroughRate: 0,
            installationRate: 0
        };

        if (funnel.promptsShown > 0) {
            funnel.clickThroughRate = (funnel.installClicks / funnel.promptsShown) * 100;
        }

        if (funnel.installClicks > 0) {
            funnel.installationRate = (funnel.installSuccess / funnel.installClicks) * 100;
        }

        return funnel;
    }

    /**
     * Calculate platform/browser breakdown
     * @param {Object} data - Analytics data
     * @returns {Object} Platform breakdown
     */
    calculatePlatformBreakdown(data) {
        const breakdown = {
            platforms: {},
            browsers: {}
        };

        data.events.forEach(event => {
            // Platform breakdown
            if (event.platform) {
                if (!breakdown.platforms[event.platform]) {
                    breakdown.platforms[event.platform] = {
                        prompts: 0,
                        installs: 0,
                        dismissals: 0
                    };
                }

                if (event.type === 'prompt_shown') {
                    breakdown.platforms[event.platform].prompts++;
                } else if (event.type === 'install_success') {
                    breakdown.platforms[event.platform].installs++;
                } else if (event.type === 'dismissed') {
                    breakdown.platforms[event.platform].dismissals++;
                }
            }

            // Browser breakdown
            if (event.browser) {
                if (!breakdown.browsers[event.browser]) {
                    breakdown.browsers[event.browser] = {
                        prompts: 0,
                        installs: 0,
                        dismissals: 0
                    };
                }

                if (event.type === 'prompt_shown') {
                    breakdown.browsers[event.browser].prompts++;
                } else if (event.type === 'install_success') {
                    breakdown.browsers[event.browser].installs++;
                } else if (event.type === 'dismissed') {
                    breakdown.browsers[event.browser].dismissals++;
                }
            }
        });

        return breakdown;
    }

    /**
     * Calculate timeline data for charts
     * @param {Object} data - Analytics data
     * @returns {Array} Timeline data points
     */
    calculateTimelineData(data) {
        const timeline = [];
        const eventsByDate = {};

        data.events.forEach(event => {
            const date = event.timestamp.split('T')[0]; // Get date part only
            
            if (!eventsByDate[date]) {
                eventsByDate[date] = {
                    date,
                    prompts: 0,
                    installs: 0,
                    dismissals: 0
                };
            }

            if (event.type === 'prompt_shown') {
                eventsByDate[date].prompts++;
            } else if (event.type === 'install_success') {
                eventsByDate[date].installs++;
            } else if (event.type === 'dismissed') {
                eventsByDate[date].dismissals++;
            }
        });

        // Convert to array and sort by date
        Object.values(eventsByDate).forEach(dayData => {
            timeline.push(dayData);
        });

        timeline.sort((a, b) => new Date(a.date) - new Date(b.date));

        return timeline;
    }

    /**
     * Get recent activity (last 10 events)
     * @param {Object} data - Analytics data
     * @returns {Array} Recent events
     */
    getRecentActivity(data) {
        return data.events
            .slice(-10)
            .reverse()
            .map(event => ({
                type: event.type,
                timestamp: event.timestamp,
                platform: event.platform,
                browser: event.browser
            }));
    }

    /**
     * Export analytics data in various formats
     * @param {string} format - Export format ('json', 'csv', 'summary')
     * @returns {string} Formatted export data
     */
    exportAnalytics(format = 'json') {
        let data = this.getAnalyticsData();
        if (!data) {
            data = this.initializeAnalyticsData();
        }

        switch (format.toLowerCase()) {
            case 'json':
                return JSON.stringify(data, null, 2);
            
            case 'csv':
                return this.exportToCSV(data);
            
            case 'summary':
                return this.exportSummary(data);
            
            default:
                return JSON.stringify(data, null, 2);
        }
    }

    /**
     * Export analytics data as CSV
     * @param {Object} data - Analytics data
     * @returns {string} CSV formatted data
     */
    exportToCSV(data) {
        const headers = ['Timestamp', 'Event Type', 'Platform', 'Browser', 'Session Count', 'Job Count'];
        const rows = [headers.join(',')];

        data.events.forEach(event => {
            const row = [
                event.timestamp,
                event.type,
                event.platform || '',
                event.browser || '',
                event.sessionCount || 0,
                event.jobCount || 0
            ];
            rows.push(row.join(','));
        });

        return rows.join('\n');
    }

    /**
     * Export summary report
     * @param {Object} data - Analytics data
     * @returns {string} Summary report
     */
    exportSummary(data) {
        const metrics = this.getInstallMetrics();
        
        return `PWA Installation Analytics Summary
Generated: ${new Date().toISOString()}

OVERVIEW
========
Total Prompts Shown: ${metrics.summary.totalPrompts}
Install Button Clicks: ${metrics.summary.installClicks}
Dismissals: ${metrics.summary.dismissals}
"Don't Ask Again" Clicks: ${metrics.summary.dontAskAgainClicks}
Installation Success: ${metrics.summary.installSuccess ? 'Yes' : 'No'}
Conversion Rate: ${metrics.summary.conversionRate.toFixed(2)}%

FUNNEL METRICS
==============
Click-through Rate: ${metrics.funnel.clickThroughRate.toFixed(2)}%
Installation Rate: ${metrics.funnel.installationRate.toFixed(2)}%

PLATFORM BREAKDOWN
==================
${Object.entries(metrics.platformBreakdown.platforms).map(([platform, stats]) => 
    `${platform}: ${stats.prompts} prompts, ${stats.installs} installs`
).join('\n')}

BROWSER BREAKDOWN
=================
${Object.entries(metrics.platformBreakdown.browsers).map(([browser, stats]) => 
    `${browser}: ${stats.prompts} prompts, ${stats.installs} installs`
).join('\n')}
`;
    }

    /**
     * Reset all analytics data
     */
    resetAnalytics() {
        this.initializeAnalyticsData();
        console.log('[InstallAnalytics] Analytics data reset');
    }

    /**
     * Get empty metrics structure
     * @returns {Object} Empty metrics
     */
    getEmptyMetrics() {
        return {
            summary: {
                totalPrompts: 0,
                installClicks: 0,
                dismissals: 0,
                dontAskAgainClicks: 0,
                installSuccess: false,
                conversionRate: 0,
                firstPromptDate: null,
                lastEventDate: null
            },
            events: [],
            funnel: {
                promptsShown: 0,
                installClicks: 0,
                dismissals: 0,
                dontAskAgain: 0,
                installSuccess: 0,
                clickThroughRate: 0,
                installationRate: 0
            },
            platformBreakdown: {
                platforms: {},
                browsers: {}
            },
            timelineData: [],
            recentActivity: []
        };
    }

    /**
     * Get platform information
     * @returns {string} Platform name
     */
    getPlatformInfo() {
        const userAgent = navigator.userAgent.toLowerCase();
        
        if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
            return 'iOS';
        } else if (userAgent.includes('android')) {
            return 'Android';
        } else if (userAgent.includes('mac')) {
            return 'macOS';
        } else if (userAgent.includes('win')) {
            return 'Windows';
        } else if (userAgent.includes('linux')) {
            return 'Linux';
        }
        
        return 'Unknown';
    }

    /**
     * Get browser information
     * @returns {string} Browser name
     */
    getBrowserInfo() {
        const userAgent = navigator.userAgent.toLowerCase();
        
        if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
            return 'Chrome';
        } else if (userAgent.includes('firefox')) {
            return 'Firefox';
        } else if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
            return 'Safari';
        } else if (userAgent.includes('edg')) {
            return 'Edge';
        }
        
        return 'Unknown';
    }

    /**
     * Get current session count from existing storage
     * @returns {number} Session count
     */
    getSessionCount() {
        try {
            // Try to get session count from existing analytics or estimate
            const existingAnalytics = localStorage.getItem('jobTracker_analytics');
            if (existingAnalytics) {
                const analytics = JSON.parse(existingAnalytics);
                // Estimate sessions based on existing analytics data
                return analytics.sessions || 1;
            }
            
            // Fallback: estimate based on localStorage usage
            const hasJobs = localStorage.getItem('jobTracker_jobs');
            const hasPassword = localStorage.getItem('jobTracker_password');
            
            if (hasJobs && hasPassword) {
                // User has been using the app, estimate at least 3 sessions
                return 3;
            } else if (hasJobs || hasPassword) {
                // Some usage, estimate 1-2 sessions
                return 2;
            }
            
            return 1; // First session
        } catch (error) {
            return 1;
        }
    }

    /**
     * Get current job count from existing storage
     * @returns {number} Job count
     */
    getJobCount() {
        try {
            const jobs = localStorage.getItem('jobTracker_jobs');
            return jobs ? JSON.parse(jobs).length : 0;
        } catch (error) {
            return 0;
        }
    }
}

// Make InstallAnalytics available globally
window.InstallAnalytics = InstallAnalytics;