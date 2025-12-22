/**
 * AdminPanelActions Component
 * Handles action handlers for admin panel operations (export, reset, etc.)
 */
class AdminPanelActions {
    constructor(analytics, pwaManager, notificationHandler) {
        this.analytics = analytics;
        this.pwaManager = pwaManager;
        this.notificationHandler = notificationHandler;
    }

    /**
     * Export analytics data with user interaction
     * @returns {Promise<boolean>} True if export was successful
     */
    async exportAnalytics() {
        try {
            if (!this.analytics) {
                this.showNotification('Analytics not available', 'error');
                return false;
            }

            const format = prompt('Choose export format:\n1. JSON\n2. CSV\n3. Summary Report\n\nEnter 1, 2, or 3:');
            if (!format) return false;

            let exportFormat = 'json';
            let fileExtension = 'json';
            let mimeType = 'application/json';

            if (format === '2') {
                exportFormat = 'csv';
                fileExtension = 'csv';
                mimeType = 'text/csv';
            } else if (format === '3') {
                exportFormat = 'summary';
                fileExtension = 'txt';
                mimeType = 'text/plain';
            }

            const exportData = this.analytics.exportAnalytics(exportFormat);
            
            if (!exportData || exportData.trim() === '') {
                this.showNotification('No data to export', 'warning');
                return false;
            }

            // Create download
            const blob = new Blob([exportData], { type: mimeType });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `pwa-analytics-${new Date().toISOString().split('T')[0]}.${fileExtension}`;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.showNotification(`Analytics exported as ${exportFormat.toUpperCase()}!`, 'success');
            return true;
            
        } catch (error) {
            console.error('[AdminPanelActions] Error exporting analytics:', error);
            this.showNotification('Error exporting analytics', 'error');
            return false;
        }
    }

    /**
     * Reset analytics data with confirmation
     * @returns {Promise<boolean>} True if reset was successful
     */
    async resetAnalytics() {
        try {
            if (!this.analytics) {
                this.showNotification('Analytics not available', 'error');
                return false;
            }

            const confirmed = confirm(
                'Are you sure you want to reset all analytics data? This action cannot be undone.'
            );

            if (confirmed) {
                const success = this.analytics.resetAnalytics();
                if (success) {
                    this.showNotification('Analytics reset successfully!', 'success');
                    return true;
                } else {
                    this.showNotification('Failed to reset analytics', 'error');
                    return false;
                }
            }
            return false;
        } catch (error) {
            console.error('[AdminPanelActions] Error resetting analytics:', error);
            this.showNotification('Error resetting analytics', 'error');
            return false;
        }
    }

    /**
     * Trigger install prompt
     * @returns {Promise<boolean>} True if prompt was triggered successfully
     */
    async triggerInstallPrompt() {
        try {
            if (!this.pwaManager) {
                this.showNotification('PWA Manager not available', 'error');
                return false;
            }

            const success = this.pwaManager.manualInstallTrigger();
            if (success) {
                this.showNotification('Install prompt triggered!', 'success');
                return true;
            } else {
                this.showNotification('Install prompt not available', 'warning');
                return false;
            }
        } catch (error) {
            console.error('[AdminPanelActions] Error triggering install prompt:', error);
            this.showNotification('Error triggering install prompt', 'error');
            return false;
        }
    }

    /**
     * Reset install preferences with confirmation
     * @returns {Promise<boolean>} True if reset was successful
     */
    async resetInstallPreferences() {
        try {
            if (!this.pwaManager) {
                this.showNotification('PWA Manager not available', 'error');
                return false;
            }

            const confirmed = confirm(
                'Are you sure you want to reset install preferences? This will clear all installation data.'
            );

            if (confirmed) {
                this.pwaManager.resetInstallationPreferences();
                this.showNotification('Install preferences reset successfully!', 'success');
                return true;
            }
            return false;
        } catch (error) {
            console.error('[AdminPanelActions] Error resetting install preferences:', error);
            this.showNotification('Error resetting install preferences', 'error');
            return false;
        }
    }

    /**
     * Refresh analytics data
     * @returns {Promise<boolean>} True if refresh was successful
     */
    async refreshAnalytics() {
        try {
            if (this.analytics) {
                this.analytics.refreshAnalytics();
                return true;
            }
            return false;
        } catch (error) {
            console.error('[AdminPanelActions] Error refreshing analytics:', error);
            return false;
        }
    }

    /**
     * Clear cache (if service worker is available)
     * @returns {Promise<boolean>} True if cache was cleared successfully
     */
    async clearCache() {
        try {
            if (!navigator.serviceWorker.controller) {
                this.showNotification('Service worker not available', 'warning');
                return false;
            }

            const result = await this.clearServiceWorkerCache();
            if (result.success) {
                this.showNotification('Cache cleared successfully!', 'success');
                return true;
            } else {
                this.showNotification(`Failed to clear cache: ${result.error}`, 'error');
                return false;
            }
        } catch (error) {
            console.error('[AdminPanelActions] Error clearing cache:', error);
            this.showNotification('Error clearing cache', 'error');
            return false;
        }
    }

    /**
     * Clear service worker cache
     * @returns {Promise<Object>} Result object with success status
     */
    clearServiceWorkerCache() {
        return new Promise((resolve) => {
            if (!navigator.serviceWorker.controller) {
                resolve({ success: false, error: 'Service worker not available' });
                return;
            }

            const messageChannel = new MessageChannel();
            messageChannel.port1.onmessage = (event) => {
                resolve(event.data);
            };

            navigator.serviceWorker.controller.postMessage(
                { type: 'CLEAR_CACHE' },
                [messageChannel.port2]
            );

            // Timeout after 5 seconds
            setTimeout(() => resolve({ success: false, error: 'Timeout' }), 5000);
        });
    }

    /**
     * Show notification using available notification system
     * @param {string} message - Notification message
     * @param {string} type - Notification type ('success', 'error', 'warning', 'info')
     */
    showNotification(message, type = 'info') {
        try {
            if (this.notificationHandler) {
                this.notificationHandler(message, type);
                return;
            }

            // Fallback to available notification systems
            if (window.showPWANotification) {
                window.showPWANotification(message, type);
            } else if (window.NotificationManager) {
                switch (type) {
                    case 'success':
                        NotificationManager.success(message);
                        break;
                    case 'error':
                        NotificationManager.error(message);
                        break;
                    case 'warning':
                        NotificationManager.warning(message);
                        break;
                    default:
                        NotificationManager.info(message);
                        break;
                }
            } else if (window.showNotification) {
                window.showNotification(message, type);
            } else {
                console.log(`[AdminPanelActions] ${type.toUpperCase()}: ${message}`);
            }
        } catch (error) {
            console.error('[AdminPanelActions] Error showing notification:', error);
        }
    }

    /**
     * Set analytics instance
     * @param {Object} analytics - Analytics instance
     */
    setAnalytics(analytics) {
        this.analytics = analytics;
    }

    /**
     * Set PWA manager instance
     * @param {Object} pwaManager - PWA manager instance
     */
    setPWAManager(pwaManager) {
        this.pwaManager = pwaManager;
    }

    /**
     * Set notification handler
     * @param {Function} handler - Notification handler function
     */
    setNotificationHandler(handler) {
        this.notificationHandler = handler;
    }

    /**
     * Get available actions
     * @returns {Array} Array of available action names
     */
    getAvailableActions() {
        const actions = [];
        
        if (this.analytics) {
            actions.push('exportAnalytics', 'resetAnalytics', 'refreshAnalytics');
        }
        
        if (this.pwaManager) {
            actions.push('triggerInstallPrompt', 'resetInstallPreferences');
        }
        
        actions.push('clearCache');
        
        return actions;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminPanelActions;
} else {
    window.AdminPanelActions = AdminPanelActions;
}
