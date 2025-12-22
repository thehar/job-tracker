/**
 * AdminPanelEvents Component
 * Handles event listener management for the admin panel
 */
class AdminPanelEvents {
    constructor(adminPanel) {
        this.adminPanel = adminPanel;
        this.eventListeners = new Map();
        this.isInitialized = false;
    }

    /**
     * Initialize event listeners
     */
    init() {
        if (this.isInitialized) {
            console.warn('[AdminPanelEvents] Already initialized');
            return;
        }

        try {
            this.setupKeyboardShortcuts();
            this.setupAdminTabEvents();
            this.setupAdminSectionEvents();
            this.setupPWAEvents();
            
            this.isInitialized = true;
            console.log('[AdminPanelEvents] Event listeners initialized');
        } catch (error) {
            console.error('[AdminPanelEvents] Error initializing event listeners:', error);
        }
    }

    /**
     * Set up keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        const keydownHandler = (event) => {
            // Alt + A to toggle admin panel
            if (event.altKey && event.key === 'a') {
                event.preventDefault();
                if (this.adminPanel && this.adminPanel.toggleAdminPanel) {
                    this.adminPanel.toggleAdminPanel();
                }
            }
            
            // Escape to close admin panel
            if (event.key === 'Escape' && this.adminPanel && this.adminPanel.isVisible) {
                if (this.adminPanel.hideAdminPanel) {
                    this.adminPanel.hideAdminPanel();
                }
            }
        };

        document.addEventListener('keydown', keydownHandler);
        this.eventListeners.set('keydown', keydownHandler);
    }

    /**
     * Set up admin tab events
     */
    setupAdminTabEvents() {
        const adminTab = document.getElementById('adminTab');
        if (adminTab) {
            const clickHandler = () => {
                if (this.adminPanel && this.adminPanel.showAdminPanel) {
                    this.adminPanel.showAdminPanel();
                }
            };

            adminTab.addEventListener('click', clickHandler);
            this.eventListeners.set('adminTabClick', { element: adminTab, handler: clickHandler });
        }
    }

    /**
     * Set up admin section button events
     */
    setupAdminSectionEvents() {
        // Refresh analytics button
        const refreshBtn = document.getElementById('refreshAnalyticsBtn');
        if (refreshBtn) {
            const clickHandler = () => {
                if (this.adminPanel && this.adminPanel.refreshAnalytics) {
                    this.adminPanel.refreshAnalytics();
                }
            };

            refreshBtn.addEventListener('click', clickHandler);
            this.eventListeners.set('refreshAnalyticsClick', { element: refreshBtn, handler: clickHandler });
        }

        // Export analytics button
        const exportBtn = document.getElementById('exportAnalyticsBtn');
        if (exportBtn) {
            const clickHandler = () => {
                if (this.adminPanel && this.adminPanel.exportAnalytics) {
                    this.adminPanel.exportAnalytics();
                }
            };

            exportBtn.addEventListener('click', clickHandler);
            this.eventListeners.set('exportAnalyticsClick', { element: exportBtn, handler: clickHandler });
        }

        // Reset analytics button
        const resetBtn = document.getElementById('resetAnalyticsBtn');
        if (resetBtn) {
            const clickHandler = () => {
                if (this.adminPanel && this.adminPanel.resetAnalytics) {
                    this.adminPanel.resetAnalytics();
                }
            };

            resetBtn.addEventListener('click', clickHandler);
            this.eventListeners.set('resetAnalyticsClick', { element: resetBtn, handler: clickHandler });
        }

        // Trigger install button
        const triggerBtn = document.getElementById('triggerInstallBtn');
        if (triggerBtn) {
            const clickHandler = () => {
                if (this.adminPanel && this.adminPanel.triggerInstallPrompt) {
                    this.adminPanel.triggerInstallPrompt();
                }
            };

            triggerBtn.addEventListener('click', clickHandler);
            this.eventListeners.set('triggerInstallClick', { element: triggerBtn, handler: clickHandler });
        }

        // Reset install preferences button
        const resetPrefsBtn = document.getElementById('resetInstallPrefsBtn');
        if (resetPrefsBtn) {
            const clickHandler = () => {
                if (this.adminPanel && this.adminPanel.resetInstallPreferences) {
                    this.adminPanel.resetInstallPreferences();
                }
            };

            resetPrefsBtn.addEventListener('click', clickHandler);
            this.eventListeners.set('resetInstallPrefsClick', { element: resetPrefsBtn, handler: clickHandler });
        }
    }

    /**
     * Set up PWA events
     */
    setupPWAEvents() {
        const pwaEventHandler = (event) => {
            if (this.adminPanel && this.adminPanel.handlePWAEvent) {
                this.adminPanel.handlePWAEvent(event.detail);
            }
        };

        document.addEventListener('pwa-install-event', pwaEventHandler);
        this.eventListeners.set('pwaInstallEvent', { element: document, handler: pwaEventHandler });
    }

    /**
     * Add custom event listener
     * @param {string} eventType - Event type
     * @param {HTMLElement} element - Element to attach listener to
     * @param {Function} handler - Event handler function
     * @param {string} key - Unique key for this listener
     */
    addEventListener(eventType, element, handler, key) {
        try {
            element.addEventListener(eventType, handler);
            this.eventListeners.set(key, { element, handler, eventType });
            console.log(`[AdminPanelEvents] Added event listener: ${key}`);
        } catch (error) {
            console.error(`[AdminPanelEvents] Error adding event listener ${key}:`, error);
        }
    }

    /**
     * Remove event listener by key
     * @param {string} key - Event listener key
     */
    removeEventListener(key) {
        try {
            const listener = this.eventListeners.get(key);
            if (listener) {
                listener.element.removeEventListener(listener.eventType, listener.handler);
                this.eventListeners.delete(key);
                console.log(`[AdminPanelEvents] Removed event listener: ${key}`);
            }
        } catch (error) {
            console.error(`[AdminPanelEvents] Error removing event listener ${key}:`, error);
        }
    }

    /**
     * Remove all event listeners
     */
    removeAllEventListeners() {
        try {
            for (const [key, listener] of this.eventListeners) {
                if (listener.element && listener.handler) {
                    listener.element.removeEventListener(listener.eventType, listener.handler);
                }
            }
            this.eventListeners.clear();
            this.isInitialized = false;
            console.log('[AdminPanelEvents] All event listeners removed');
        } catch (error) {
            console.error('[AdminPanelEvents] Error removing all event listeners:', error);
        }
    }

    /**
     * Re-setup admin section events (useful when UI is recreated)
     */
    reSetupAdminSectionEvents() {
        // Remove existing admin section event listeners
        const adminSectionKeys = [
            'refreshAnalyticsClick',
            'exportAnalyticsClick', 
            'resetAnalyticsClick',
            'triggerInstallClick',
            'resetInstallPrefsClick'
        ];

        adminSectionKeys.forEach(key => {
            this.removeEventListener(key);
        });

        // Re-setup admin section events
        this.setupAdminSectionEvents();
    }

    /**
     * Get event listener count
     * @returns {number} Number of active event listeners
     */
    getEventListenerCount() {
        return this.eventListeners.size;
    }

    /**
     * Get all event listener keys
     * @returns {Array} Array of event listener keys
     */
    getEventListenerKeys() {
        return Array.from(this.eventListeners.keys());
    }

    /**
     * Check if event listener exists
     * @param {string} key - Event listener key
     * @returns {boolean} True if listener exists
     */
    hasEventListener(key) {
        return this.eventListeners.has(key);
    }

    /**
     * Set admin panel reference
     * @param {Object} adminPanel - Admin panel instance
     */
    setAdminPanel(adminPanel) {
        this.adminPanel = adminPanel;
    }

    /**
     * Check if events are initialized
     * @returns {boolean} True if initialized
     */
    isEventsInitialized() {
        return this.isInitialized;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminPanelEvents;
} else {
    window.AdminPanelEvents = AdminPanelEvents;
}
