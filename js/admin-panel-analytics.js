/**
 * AdminPanelAnalytics Component
 * Handles analytics data management and display for the admin panel
 */
class AdminPanelAnalytics {
    constructor(analytics, ui) {
        this.analytics = analytics;
        this.ui = ui;
    }

    /**
     * Refresh analytics data and update UI
     */
    refreshAnalytics() {
        try {
            if (!this.analytics) {
                console.warn('[AdminPanelAnalytics] Analytics not available');
                this.updateAnalyticsUI({
                    totalPrompts: '-',
                    installClicks: '-',
                    conversionRate: '-',
                    installSuccess: '-'
                });
                return;
            }

            const metrics = this.analytics.getInstallMetrics();
            
            // Update analytics cards
            this.updateAnalyticsUI({
                totalPrompts: metrics.summary.totalPrompts,
                installClicks: metrics.summary.installClicks,
                conversionRate: `${metrics.summary.conversionRate.toFixed(1)}%`,
                installSuccess: metrics.summary.installSuccess ? 'Yes' : 'No'
            });
            
            console.log('[AdminPanelAnalytics] Analytics refreshed');
        } catch (error) {
            console.error('[AdminPanelAnalytics] Error refreshing analytics:', error);
            this.updateAnalyticsUI({
                totalPrompts: 'Error',
                installClicks: 'Error',
                conversionRate: 'Error',
                installSuccess: 'Error'
            });
        }
    }

    /**
     * Update analytics UI elements
     * @param {Object} data - Analytics data to display
     */
    updateAnalyticsUI(data) {
        if (this.ui) {
            this.ui.updateElement('adminTotalPrompts', data.totalPrompts);
            this.ui.updateElement('adminInstallClicks', data.installClicks);
            this.ui.updateElement('adminConversionRate', data.conversionRate);
            this.ui.updateElement('adminInstallSuccess', data.installSuccess);
        }
    }

    /**
     * Refresh recent events and update UI
     */
    refreshRecentEvents() {
        try {
            if (!this.analytics) {
                console.warn('[AdminPanelAnalytics] Analytics not available');
                if (this.ui) {
                    this.ui.updateRecentEvents([]);
                }
                return;
            }

            const metrics = this.analytics.getInstallMetrics();
            const recentEvents = metrics.recentActivity || [];

            if (this.ui) {
                this.ui.updateRecentEvents(recentEvents);
            }
            
            console.log('[AdminPanelAnalytics] Recent events refreshed');
        } catch (error) {
            console.error('[AdminPanelAnalytics] Error refreshing recent events:', error);
            if (this.ui) {
                this.ui.updateRecentEvents([]);
            }
        }
    }

    /**
     * Export analytics data
     * @param {string} format - Export format ('json', 'csv', 'summary')
     * @returns {string|null} Exported data or null if error
     */
    exportAnalytics(format = 'json') {
        try {
            if (!this.analytics) {
                console.warn('[AdminPanelAnalytics] Analytics not available');
                return null;
            }

            const exportData = this.analytics.exportAnalytics(format);
            
            if (!exportData || exportData.trim() === '') {
                console.warn('[AdminPanelAnalytics] No data to export');
                return null;
            }

            console.log(`[AdminPanelAnalytics] Analytics exported as ${format.toUpperCase()}`);
            return exportData;
        } catch (error) {
            console.error('[AdminPanelAnalytics] Error exporting analytics:', error);
            return null;
        }
    }

    /**
     * Reset analytics data
     * @returns {boolean} True if reset successful
     */
    resetAnalytics() {
        try {
            if (!this.analytics) {
                console.warn('[AdminPanelAnalytics] Analytics not available');
                return false;
            }

            this.analytics.resetAnalytics();
            this.refreshAnalytics();
            this.refreshRecentEvents();
            
            console.log('[AdminPanelAnalytics] Analytics reset successfully');
            return true;
        } catch (error) {
            console.error('[AdminPanelAnalytics] Error resetting analytics:', error);
            return false;
        }
    }

    /**
     * Get analytics metrics
     * @returns {Object|null} Analytics metrics or null if not available
     */
    getMetrics() {
        try {
            if (!this.analytics) {
                return null;
            }
            return this.analytics.getInstallMetrics();
        } catch (error) {
            console.error('[AdminPanelAnalytics] Error getting metrics:', error);
            return null;
        }
    }

    /**
     * Check if analytics is available
     * @returns {boolean} True if analytics is available
     */
    isAvailable() {
        return this.analytics !== null && this.analytics !== undefined;
    }

    /**
     * Set analytics instance
     * @param {Object} analytics - Analytics instance
     */
    setAnalytics(analytics) {
        this.analytics = analytics;
    }

    /**
     * Set UI instance
     * @param {Object} ui - UI instance
     */
    setUI(ui) {
        this.ui = ui;
    }

    /**
     * Handle PWA events for analytics updates
     * @param {Object} eventData - PWA event data
     */
    handlePWAEvent(eventData) {
        try {
            console.log('[AdminPanelAnalytics] PWA event received:', eventData);
            
            // Refresh relevant data based on event type
            if (eventData.type === 'install_success' || 
                eventData.type === 'prompt_shown' || 
                eventData.type === 'install_clicked' ||
                eventData.type === 'install_dismissed') {
                this.refreshAnalytics();
                this.refreshRecentEvents();
            }
        } catch (error) {
            console.error('[AdminPanelAnalytics] Error handling PWA event:', error);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminPanelAnalytics;
} else {
    window.AdminPanelAnalytics = AdminPanelAnalytics;
}
