/**
 * AdminPanelUI Component
 * Handles UI creation and DOM manipulation for the admin panel
 */
class AdminPanelUI {
    constructor() {
        this.adminSection = null;
        this.adminTab = null;
    }

    /**
     * Create admin section HTML
     * @returns {HTMLElement} The created admin section element
     */
    createAdminSection() {
        const adminSection = document.createElement('div');
        adminSection.id = 'adminSection';
        adminSection.className = 'admin-section hidden';
        
        adminSection.innerHTML = `
            <div class="admin-header">
                <h2>Admin Panel</h2>
                <p class="admin-subtitle">PWA Installation Analytics & System Management</p>
            </div>
            
            <div class="admin-content">
                <!-- PWA Installation Analytics -->
                <div class="admin-card">
                    <h3>PWA Installation Analytics</h3>
                    <div class="analytics-grid">
                        <div class="analytics-card">
                            <div class="analytics-label">Total Prompts</div>
                            <div class="analytics-value" id="adminTotalPrompts">-</div>
                        </div>
                        <div class="analytics-card">
                            <div class="analytics-label">Install Clicks</div>
                            <div class="analytics-value" id="adminInstallClicks">-</div>
                        </div>
                        <div class="analytics-card">
                            <div class="analytics-label">Conversion Rate</div>
                            <div class="analytics-value" id="adminConversionRate">-</div>
                        </div>
                        <div class="analytics-card">
                            <div class="analytics-label">Install Success</div>
                            <div class="analytics-value" id="adminInstallSuccess">-</div>
                        </div>
                    </div>
                    
                    <div class="admin-actions">
                        <button id="refreshAnalyticsBtn" class="btn btn-primary">Refresh Analytics</button>
                        <button id="exportAnalyticsBtn" class="btn btn-secondary">Export Data</button>
                        <button id="resetAnalyticsBtn" class="btn btn-danger">Reset Analytics</button>
                    </div>
                </div>

                <!-- PWA Installation Status -->
                <div class="admin-card">
                    <h3>PWA Installation Status</h3>
                    <div class="status-grid">
                        <div class="status-item">
                            <span class="status-label">Installation Status:</span>
                            <span class="status-value" id="adminInstallStatus">-</span>
                        </div>
                        <div class="status-item">
                            <span class="status-label">Session Count:</span>
                            <span class="status-value" id="adminSessionCount">-</span>
                        </div>
                        <div class="status-item">
                            <span class="status-label">Prompt Count:</span>
                            <span class="status-value" id="adminPromptCount">-</span>
                        </div>
                        <div class="status-item">
                            <span class="status-label">Dismissal Count:</span>
                            <span class="status-value" id="adminDismissalCount">-</span>
                        </div>
                    </div>
                    
                    <div class="admin-actions">
                        <button id="triggerInstallBtn" class="btn btn-primary">Trigger Install Prompt</button>
                        <button id="resetInstallPrefsBtn" class="btn btn-warning">Reset Install Preferences</button>
                    </div>
                </div>

                <!-- System Information -->
                <div class="admin-card">
                    <h3>System Information</h3>
                    <div class="system-info">
                        <div class="info-item">
                            <span class="info-label">Browser:</span>
                            <span class="info-value" id="adminBrowserInfo">-</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Platform:</span>
                            <span class="info-value" id="adminPlatformInfo">-</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">PWA Support:</span>
                            <span class="info-value" id="adminPWASupport">-</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Service Worker:</span>
                            <span class="info-value" id="adminServiceWorker">-</span>
                        </div>
                    </div>
                </div>

                <!-- Recent Activity -->
                <div class="admin-card">
                    <h3>Recent PWA Events</h3>
                    <div class="recent-events" id="adminRecentEvents">
                        <p class="no-events">No recent events</p>
                    </div>
                </div>
            </div>
        `;
        
        // Insert admin section after dashboard section
        const dashboardSection = document.getElementById('dashboardSection');
        if (dashboardSection && dashboardSection.parentNode) {
            dashboardSection.parentNode.insertBefore(adminSection, dashboardSection.nextSibling);
        } else {
            // Fallback: append to body
            document.body.appendChild(adminSection);
        }
        
        this.adminSection = adminSection;
        return adminSection;
    }

    /**
     * Ensure admin tab exists in navigation
     * @returns {HTMLElement} The admin tab element
     */
    ensureAdminTabExists() {
        const adminTab = document.getElementById('adminTab');
        if (!adminTab) {
            const tabContainer = document.querySelector('.tab-container');
            if (tabContainer) {
                const adminTabElement = document.createElement('button');
                adminTabElement.id = 'adminTab';
                adminTabElement.className = 'tab';
                adminTabElement.textContent = 'Admin';
                adminTabElement.title = 'Admin Panel (Alt+A)';
                
                tabContainer.appendChild(adminTabElement);
                this.adminTab = adminTabElement;
                return adminTabElement;
            }
        }
        this.adminTab = adminTab;
        return adminTab;
    }

    /**
     * Create admin panel UI if it doesn't exist
     * @returns {Object} Object containing adminSection and adminTab elements
     */
    createAdminPanelUI() {
        // Check if admin section already exists
        let adminSection = document.getElementById('adminSection');
        if (!adminSection) {
            adminSection = this.createAdminSection();
        } else {
            this.adminSection = adminSection;
        }
        
        // Ensure admin tab exists
        const adminTab = this.ensureAdminTabExists();
        
        return {
            adminSection,
            adminTab
        };
    }

    /**
     * Show admin panel
     */
    showAdminPanel() {
        try {
            const adminSection = document.getElementById('adminSection');
            const adminTab = document.getElementById('adminTab');
            
            if (adminSection && adminTab) {
                // Hide other sections
                const jobsSection = document.querySelector('.main-content');
                const dashboardSection = document.getElementById('dashboardSection');
                
                if (jobsSection) jobsSection.classList.add('hidden');
                if (dashboardSection) dashboardSection.classList.add('hidden');
                
                // Show admin section
                adminSection.classList.remove('hidden');
                
                // Update tab states
                const allTabs = document.querySelectorAll('.tab');
                allTabs.forEach(tab => tab.classList.remove('active'));
                adminTab.classList.add('active');
                
                console.log('[AdminPanelUI] Admin panel shown');
                return true;
            }
            return false;
        } catch (error) {
            console.error('[AdminPanelUI] Error showing admin panel:', error);
            return false;
        }
    }

    /**
     * Hide admin panel
     */
    hideAdminPanel() {
        try {
            const adminSection = document.getElementById('adminSection');
            const adminTab = document.getElementById('adminTab');
            
            if (adminSection && adminTab) {
                adminSection.classList.add('hidden');
                adminTab.classList.remove('active');
                
                console.log('[AdminPanelUI] Admin panel hidden');
                return true;
            }
            return false;
        } catch (error) {
            console.error('[AdminPanelUI] Error hiding admin panel:', error);
            return false;
        }
    }

    /**
     * Update element text content
     * @param {string} id - Element ID
     * @param {string} value - New text value
     */
    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    /**
     * Update recent events display
     * @param {Array} events - Array of recent events
     */
    updateRecentEvents(events) {
        try {
            const recentEventsContainer = document.getElementById('adminRecentEvents');
            if (!recentEventsContainer) return;

            if (!events || events.length === 0) {
                recentEventsContainer.innerHTML = '<p class="no-events">No recent events</p>';
                return;
            }

            const eventsHtml = events.map(event => `
                <div class="event-item">
                    <span class="event-type">${event.type}</span>
                    <span class="event-time">${new Date(event.timestamp).toLocaleString()}</span>
                    <span class="event-platform">${event.platform || 'Unknown'}</span>
                </div>
            `).join('');

            recentEventsContainer.innerHTML = eventsHtml;
            
            console.log('[AdminPanelUI] Recent events updated');
        } catch (error) {
            console.error('[AdminPanelUI] Error updating recent events:', error);
        }
    }

    /**
     * Get admin section element
     * @returns {HTMLElement|null} Admin section element
     */
    getAdminSection() {
        return this.adminSection || document.getElementById('adminSection');
    }

    /**
     * Get admin tab element
     * @returns {HTMLElement|null} Admin tab element
     */
    getAdminTab() {
        return this.adminTab || document.getElementById('adminTab');
    }

    /**
     * Check if admin panel is visible
     * @returns {boolean} True if admin panel is visible
     */
    isVisible() {
        const adminSection = this.getAdminSection();
        return adminSection && !adminSection.classList.contains('hidden');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminPanelUI;
} else {
    window.AdminPanelUI = AdminPanelUI;
}
