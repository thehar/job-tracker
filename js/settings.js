/**
 * Settings Manager for Custom Statuses and Stages
 * Handles user preferences, custom statuses/stages, and form updates
 * Enhanced to use state manager for centralized state management
 */
class SettingsManager {
    constructor() {
        this.stateManager = null;
        this.unsubscribers = [];
        this.defaultStatuses = [
            'Applied',
            'Interview Scheduled', 
            'Interview Completed',
            'Offer Received',
            'Rejected',
            'Withdrawn'
        ];
        
        this.defaultStages = [
            'Application Submitted',
            'Phone Screen',
            'Technical Interview',
            'Onsite Interview',
            'Final Round',
            'Negotiation'
        ];
        
        this.statuses = this.loadStatuses();
        this.stages = this.loadStages();
        this.calendarSettings = this.loadCalendarSettings();
        this.setupEventListeners();
        this.setupStateManager();
    }

    /**
     * Setup state manager integration
     */
    setupStateManager() {
        // State manager should be ready by the time this component is created
        if (isStateManagerAvailable()) {
            this.stateManager = getStateManager();
            this.setupStateSubscriptions();
            this.loadSettingsFromStateManager();
        } else {
            console.warn('[SettingsManager] State manager not available during setup');
        }
    }

    /**
     * Setup state manager subscriptions
     */
    setupStateSubscriptions() {
        if (!this.stateManager) return;

        // Subscribe to settings changes
        const unsubscribeSettings = this.stateManager.subscribe('state:settings:changed', (settings) => {
            this.statuses = settings.statuses || this.statuses;
            this.stages = settings.stages || this.stages;
            this.calendarSettings = settings.calendar || this.calendarSettings;
            this.updateForms();
        });

        this.unsubscribers.push(unsubscribeSettings);
    }

    /**
     * Load settings from state manager
     */
    loadSettingsFromStateManager() {
        if (!this.stateManager) return;

        try {
            const settings = this.stateManager.getStateSlice('settings');
            if (settings) {
                this.statuses = settings.statuses || this.statuses;
                this.stages = settings.stages || this.stages;
                this.calendarSettings = settings.calendar || this.calendarSettings;
            }
        } catch (error) {
            console.warn('[SettingsManager] Failed to load settings from state manager, using defaults:', error);
            // Fallback to default values if state manager fails
        }
    }

    /**
     * Load custom statuses from localStorage
     * @returns {Array} Array of status strings
     */
    loadStatuses() {
        const stored = localStorage.getItem('jobTracker_statuses');
        return stored ? JSON.parse(stored) : [...this.defaultStatuses];
    }

    /**
     * Load custom stages from localStorage
     * @returns {Array} Array of stage strings
     */
    loadStages() {
        const stored = localStorage.getItem('jobTracker_stages');
        return stored ? JSON.parse(stored) : [...this.defaultStages];
    }

    /**
     * Save custom statuses
     */
    async saveStatuses() {
        try {
            if (this.stateManager) {
                await this.stateManager.updateSettings({ statuses: this.statuses });
            } else {
                localStorage.setItem('jobTracker_statuses', JSON.stringify(this.statuses));
            }
            this.updateForms();
            NotificationManager.show('Statuses saved successfully!', 'success');
        } catch (error) {
            console.error('[SettingsManager] Failed to save statuses:', error);
            NotificationManager.show('Failed to save statuses. Please try again.', 'error');
        }
    }

    /**
     * Save custom stages
     */
    async saveStages() {
        try {
            if (this.stateManager) {
                await this.stateManager.updateSettings({ stages: this.stages });
            } else {
                localStorage.setItem('jobTracker_stages', JSON.stringify(this.stages));
            }
            this.updateForms();
            NotificationManager.show('Stages saved successfully!', 'success');
        } catch (error) {
            console.error('[SettingsManager] Failed to save stages:', error);
            NotificationManager.show('Failed to save stages. Please try again.', 'error');
        }
    }

    /**
     * Load calendar settings from localStorage
     * @returns {Object} Calendar settings object
     */
    loadCalendarSettings() {
        const defaults = {
            enabled: false,
            provider: 'google',
            autoSync: true,
            syncInterviews: true,
            syncFollowUps: false,
            eventDuration: 60,
            reminderMinutes: [60, 15]
        };

        try {
            const stored = localStorage.getItem('jobTracker_calendarSettings');
            if (!stored) return defaults;
            const parsed = JSON.parse(stored);
            return { ...defaults, ...parsed };
        } catch (error) {
            console.warn('[SettingsManager] Failed to load calendar settings:', error);
            return defaults;
        }
    }

    /**
     * Save calendar settings
     * @param {Object} settings - Calendar settings to save
     */
    async saveCalendarSettings(settings) {
        try {
            this.calendarSettings = { ...this.calendarSettings, ...settings };
            
            if (this.stateManager) {
                await this.stateManager.updateSettings({ calendar: this.calendarSettings });
            } else {
                localStorage.setItem('jobTracker_calendarSettings', JSON.stringify(this.calendarSettings));
            }
            
            // Update calendar integration if available
            if (window.calendarIntegration) {
                window.calendarIntegration.saveSettings(this.calendarSettings);
            }
            
            NotificationManager.show('Calendar settings saved successfully!', 'success');
        } catch (error) {
            console.error('[SettingsManager] Failed to save calendar settings:', error);
            NotificationManager.show('Failed to save calendar settings', 'error');
        }
    }

    /**
     * Setup settings event listeners
     */
    setupEventListeners() {
        // Settings tab switching
        document.querySelectorAll('.settings-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchTab(tab.dataset.tab);
            });
        });

        // Status management
        document.getElementById('addStatusBtn').addEventListener('click', () => {
            this.addStatus();
        });

        document.getElementById('saveStatusesBtn').addEventListener('click', () => {
            this.saveStatuses();
        });

        document.getElementById('resetStatusesBtn').addEventListener('click', () => {
            this.resetStatuses();
        });

        // Stage management
        document.getElementById('addStageBtn').addEventListener('click', () => {
            this.addStage();
        });

        document.getElementById('saveStagesBtn').addEventListener('click', () => {
            this.saveStages();
        });

        document.getElementById('resetStagesBtn').addEventListener('click', () => {
            this.resetStages();
        });

        // Calendar settings
        document.getElementById('saveCalendarSettingsBtn').addEventListener('click', () => {
            this.saveCalendarSettingsFromForm();
        });

        document.getElementById('resetCalendarSettingsBtn').addEventListener('click', () => {
            this.resetCalendarSettings();
        });

        document.getElementById('testCalendarBtn').addEventListener('click', () => {
            this.testCalendarIntegration();
        });

        // Refresh calendar settings when calendar tab is opened
        document.querySelector('[data-tab="calendar"]').addEventListener('click', () => {
            this.refreshCalendarSettings();
        });

        // Enter key support for inputs
        document.getElementById('newStatusInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addStatus();
        });

        document.getElementById('newStageInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addStage();
        });

        // Installation management
        document.getElementById('manualInstallBtn').addEventListener('click', () => {
            this.triggerManualInstall();
        });

        document.getElementById('resetInstallPrefsBtn').addEventListener('click', () => {
            this.resetInstallationPreferences();
        });

        document.getElementById('checkInstallStatusBtn').addEventListener('click', () => {
            this.checkInstallationStatus();
        });

        // Notifications management
        const permissionBtn = document.getElementById('requestNotificationPermissionBtn');
        const testBtn = document.getElementById('sendTestNotificationBtn');
        const savePrefsBtn = document.getElementById('saveNotificationPrefsBtn');
        const clearHistoryBtn = document.getElementById('clearNotificationHistoryBtn');
        if (permissionBtn) {
            permissionBtn.addEventListener('click', async () => {
                const perm = await SystemNotificationManager.requestPermission();
                this.updateNotificationPermissionStatus(perm);
            });
        }
        if (testBtn) {
            testBtn.addEventListener('click', async () => {
                if (Notification.permission !== 'granted') {
                    NotificationManager.error('Please grant notification permission first');
                    return;
                }
                await SystemNotificationManager.send('Job Tracker', {
                    body: 'Test notification from Job Tracker',
                    icon: '/images/screenshot.png',
                    tag: 'jt-test'
                });
            });
        }
        if (savePrefsBtn) {
            savePrefsBtn.addEventListener('click', () => {
                this.saveNotificationPreferencesFromUI();
            });
        }
        if (clearHistoryBtn) {
            clearHistoryBtn.addEventListener('click', () => {
                localStorage.setItem('jobTracker_notificationHistory', JSON.stringify([]));
                this.showNotificationPrefsResult('Notification history cleared', 'success');
            });
        }
    }

    /**
     * Switch between settings tabs
     * @param {string} tabName - Name of tab to switch to
     */
    switchTab(tabName) {
        console.log('[SettingsManager] switchTab called with:', tabName);
        
        // Update tab buttons
        document.querySelectorAll('.settings-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        const tabButton = document.querySelector(`[data-tab="${tabName}"]`);
        if (tabButton) {
            tabButton.classList.add('active');
            console.log('[SettingsManager] Tab button activated:', tabName);
        } else {
            console.warn('[SettingsManager] Tab button not found:', tabName);
        }

        // Update tab content
        document.querySelectorAll('.settings-tab-content').forEach(content => {
            content.classList.remove('active');
        });
        const tabContent = document.getElementById(`${tabName}Tab`);
        if (tabContent) {
            tabContent.classList.add('active');
            console.log('[SettingsManager] Tab content activated:', `${tabName}Tab`);
        } else {
            console.warn('[SettingsManager] Tab content not found:', `${tabName}Tab`);
        }

        // Render appropriate content
        if (tabName === 'statuses') {
            this.renderStatuses();
        } else if (tabName === 'stages') {
            this.renderStages();
        } else if (tabName === 'calendar') {
            console.log('[SettingsManager] Rendering calendar tab...');
            this.renderCalendarTab();
        } else if (tabName === 'installation') {
            this.renderInstallationTab();
        } else if (tabName === 'notifications') {
            this.renderNotificationsTab();
        }
    }

    /**
     * Render statuses list with drag & drop
     */
    renderStatuses() {
        const statusesList = document.getElementById('statusesList');
        statusesList.innerHTML = this.statuses.map((status, index) => `
            <div class="custom-list-item" data-index="${index}" draggable="true">
                <div class="drag-handle">⋮⋮</div>
                <div class="item-text">${DataManager.escapeHtml(status)}</div>
                <div class="item-actions">
                    <button class="btn-edit" onclick="window.settingsManager.editStatus(${index})">Edit</button>
                    <button class="btn-delete" onclick="window.settingsManager.deleteStatus(${index})">Delete</button>
                </div>
            </div>
        `).join('');
        
        this.setupDragAndDrop('statusesList', 'statuses');
    }

    /**
     * Render notifications tab content
     */
    renderNotificationsTab() {
        // Reflect permission
        this.updateNotificationPermissionStatus(Notification.permission);

        // Load prefs
        const prefs = NotificationStorage.loadPreferences();
        const enabled = document.getElementById('notificationsEnabled');
        const typeInterviews = document.getElementById('notifTypeInterviews');
        const typeFollowUps = document.getElementById('notifTypeFollowUps');
        const typeStatus = document.getElementById('notifTypeStatusChanges');
        if (enabled) enabled.checked = !!prefs.enabled;
        if (typeInterviews) typeInterviews.checked = !!prefs.types.interviews;
        if (typeFollowUps) typeFollowUps.checked = !!prefs.types.followUps;
        if (typeStatus) typeStatus.checked = !!prefs.types.statusChanges;

        // Interview offsets
        const interviewCheckboxes = document.querySelectorAll('.notifInterviewOffset');
        interviewCheckboxes.forEach(cb => {
            cb.checked = prefs.timing.interviews.includes(parseInt(cb.value, 10));
        });
        // Follow-up offsets
        const followUpCheckboxes = document.querySelectorAll('.notifFollowUpOffset');
        followUpCheckboxes.forEach(cb => {
            cb.checked = prefs.timing.followUps.includes(parseInt(cb.value, 10));
        });
    }

    /**
     * Update permission status UI
     * @param {NotificationPermission} perm
     */
    updateNotificationPermissionStatus(perm) {
        const el = document.getElementById('notificationPermissionStatus');
        if (el) el.textContent = perm || 'default';
    }

    /**
     * Save preferences from the Notifications tab UI
     */
    saveNotificationPreferencesFromUI() {
        const prefs = NotificationStorage.loadPreferences();
        const enabled = document.getElementById('notificationsEnabled')?.checked || false;
        const interviews = document.getElementById('notifTypeInterviews')?.checked || false;
        const followUps = document.getElementById('notifTypeFollowUps')?.checked || false;
        const statusChanges = document.getElementById('notifTypeStatusChanges')?.checked || false;
        const interviewOffsets = Array.from(document.querySelectorAll('.notifInterviewOffset'))
            .filter(cb => cb.checked)
            .map(cb => parseInt(cb.value, 10));
        const followUpOffsets = Array.from(document.querySelectorAll('.notifFollowUpOffset'))
            .filter(cb => cb.checked)
            .map(cb => parseInt(cb.value, 10));

        const updated = {
            ...prefs,
            enabled,
            types: { interviews, followUps, statusChanges },
            timing: { interviews: interviewOffsets, followUps: followUpOffsets }
        };

        NotificationStorage.savePreferences(updated);
        this.showNotificationPrefsResult('Notification preferences saved', 'success');
    }

    /**
     * Show preferences save result
     */
    showNotificationPrefsResult(message, type = 'info') {
        const resultDiv = document.getElementById('notificationPrefsResult');
        if (!resultDiv) return;
        resultDiv.textContent = message;
        resultDiv.className = `cache-result ${type}`;
        resultDiv.classList.remove('hidden');
        setTimeout(() => resultDiv.classList.add('hidden'), 4000);
    }

    /**
     * Render stages list with drag & drop
     */
    renderStages() {
        const stagesList = document.getElementById('stagesList');
        stagesList.innerHTML = this.stages.map((stage, index) => `
            <div class="custom-list-item" data-index="${index}" draggable="true">
                <div class="drag-handle">⋮⋮</div>
                <div class="item-text">${DataManager.escapeHtml(stage)}</div>
                <div class="item-actions">
                    <button class="btn-edit" onclick="window.settingsManager.editStage(${index})">Edit</button>
                    <button class="btn-delete" onclick="window.settingsManager.deleteStage(${index})">Delete</button>
                </div>
            </div>
        `).join('');
        
        this.setupDragAndDrop('stagesList', 'stages');
    }

    /**
     * Setup drag and drop functionality
     * @param {string} listId - ID of the list container
     * @param {string} type - Type of items ('statuses' or 'stages')
     */
    setupDragAndDrop(listId, type) {
        const list = document.getElementById(listId);
        const items = list.querySelectorAll('.custom-list-item');
        
        items.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', item.dataset.index);
                item.classList.add('dragging');
            });
            
            item.addEventListener('dragend', () => {
                item.classList.remove('dragging');
            });
        });

        list.addEventListener('dragover', (e) => {
            e.preventDefault();
            const draggingItem = list.querySelector('.dragging');
            if (!draggingItem) return;
            
            const afterElement = this.getDragAfterElement(list, e.clientY);
            if (afterElement) {
                list.insertBefore(draggingItem, afterElement);
            } else {
                list.appendChild(draggingItem);
            }
        });

        list.addEventListener('drop', (e) => {
            e.preventDefault();
            this.updateOrder(listId, type);
        });
    }

    /**
     * Get element after which to insert dragged item
     * @param {HTMLElement} container - Container element
     * @param {number} y - Y coordinate
     * @returns {HTMLElement|null} Element to insert before
     */
    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.custom-list-item:not(.dragging)')];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    /**
     * Update order after drag and drop
     * @param {string} listId - ID of the list container
     * @param {string} type - Type of items ('statuses' or 'stages')
     */
    updateOrder(listId, type) {
        const list = document.getElementById(listId);
        const items = list.querySelectorAll('.custom-list-item');
        const newOrder = Array.from(items).map(item => parseInt(item.dataset.index));
        
        if (type === 'statuses') {
            this.statuses = newOrder.map(index => this.statuses[index]);
        } else {
            this.stages = newOrder.map(index => this.stages[index]);
        }
        
        // Update data-index attributes
        items.forEach((item, index) => {
            item.dataset.index = index;
        });
    }

    /**
     * Add new status
     */
    addStatus() {
        const input = document.getElementById('newStatusInput');
        const status = input.value.trim();
        
        if (status && !this.statuses.includes(status)) {
            this.statuses.push(status);
            input.value = '';
            this.renderStatuses();
        } else if (this.statuses.includes(status)) {
            NotificationManager.show('Status already exists', 'error');
        }
    }

    /**
     * Add new stage
     */
    addStage() {
        const input = document.getElementById('newStageInput');
        const stage = input.value.trim();
        
        if (stage && !this.stages.includes(stage)) {
            this.stages.push(stage);
            input.value = '';
            this.renderStages();
        } else if (this.stages.includes(stage)) {
            NotificationManager.show('Stage already exists', 'error');
        }
    }

    /**
     * Edit status at index
     * @param {number} index - Index of status to edit
     */
    editStatus(index) {
        const newStatus = prompt('Edit status:', this.statuses[index]);
        if (newStatus && newStatus.trim() && newStatus.trim() !== this.statuses[index]) {
            if (this.statuses.includes(newStatus.trim())) {
                NotificationManager.show('Status already exists', 'error');
                return;
            }
            this.statuses[index] = newStatus.trim();
            this.renderStatuses();
        }
    }

    /**
     * Edit stage at index
     * @param {number} index - Index of stage to edit
     */
    editStage(index) {
        const newStage = prompt('Edit stage:', this.stages[index]);
        if (newStage && newStage.trim() && newStage.trim() !== this.stages[index]) {
            if (this.stages.includes(newStage.trim())) {
                NotificationManager.show('Stage already exists', 'error');
                return;
            }
            this.stages[index] = newStage.trim();
            this.renderStages();
        }
    }

    /**
     * Delete status at index
     * @param {number} index - Index of status to delete
     */
    deleteStatus(index) {
        if (confirm(`Are you sure you want to delete "${this.statuses[index]}"?`)) {
            this.statuses.splice(index, 1);
            this.renderStatuses();
        }
    }

    /**
     * Delete stage at index
     * @param {number} index - Index of stage to delete
     */
    deleteStage(index) {
        if (confirm(`Are you sure you want to delete "${this.stages[index]}"?`)) {
            this.stages.splice(index, 1);
            this.renderStages();
        }
    }

    /**
     * Reset statuses to default
     */
    resetStatuses() {
        if (confirm('Reset to default statuses? This will remove all custom statuses.')) {
            this.statuses = [...this.defaultStatuses];
            this.renderStatuses();
        }
    }

    /**
     * Reset stages to default
     */
    resetStages() {
        if (confirm('Reset to default stages? This will remove all custom stages.')) {
            this.stages = [...this.defaultStages];
            this.renderStages();
        }
    }

    /**
     * Update all form dropdowns with current settings
     */
    updateForms() {
        // Update job form status dropdown
        const statusSelect = document.getElementById('status');
        if (statusSelect) {
            statusSelect.innerHTML = '<option value="">Select Status</option>' + 
                this.statuses.map(status => `<option value="${status}">${status}</option>`).join('');
        }

        // Update job form stage dropdown
        const stageSelect = document.getElementById('stage');
        if (stageSelect) {
            stageSelect.innerHTML = '<option value="">Select Stage</option>' + 
                this.stages.map(stage => `<option value="${stage}">${stage}</option>`).join('');
        }

        // Update edit form status dropdown
        const editStatusSelect = document.getElementById('editStatus');
        if (editStatusSelect) {
            editStatusSelect.innerHTML = this.statuses.map(status => `<option value="${status}">${status}</option>`).join('');
        }

        // Update edit form stage dropdown
        const editStageSelect = document.getElementById('editStage');
        if (editStageSelect) {
            editStageSelect.innerHTML = '<option value="">Select Stage</option>' + 
                this.stages.map(stage => `<option value="${stage}">${stage}</option>`).join('');
        }

        // Update filter dropdown
        const filterSelect = document.getElementById('statusFilter');
        if (filterSelect) {
            filterSelect.innerHTML = '<option value="">All Statuses</option>' + 
                this.statuses.map(status => `<option value="${status}">${status}</option>`).join('');
        }

        // Update CSV import validation
        if (window.jobTracker) {
            window.jobTracker.updateValidationLists();
        }
    }

    /**
     * Render installation tab content
     */
    renderInstallationTab() {
        try {
            const pwaManager = window.getPWAInstallManager();
            
            if (!pwaManager) {
                this.showInstallationError('PWA Install Manager not available');
                return;
            }

            // Update installation status
            const installStatus = pwaManager.getInstallationStatus();
            const isInstalled = pwaManager.isInstalled || installStatus.isInstalled;
            
            document.getElementById('installationStatus').textContent = 
                isInstalled ? 'Installed' : installStatus.status || 'Not Installed';

            // Update platform support
            const detector = pwaManager.detector;
            if (detector) {
                const browserInfo = detector.getBrowserInfo();
                const platformInfo = detector.getPlatformInfo();
                
                document.getElementById('platformSupport').textContent = 
                    detector.supportsInstallPrompt() ? 'Supported' : 'Limited Support';
                
                document.getElementById('browserInfo').textContent = 
                    `${browserInfo.name} ${browserInfo.version} on ${platformInfo.os}`;
            }

            // Update installation preferences
            const storage = pwaManager.storage;
            if (storage) {
                document.getElementById('promptCount').textContent = storage.getPromptCount() || '0';
                
                const lastPrompt = storage.getLastPromptDate();
                document.getElementById('lastPromptDate').textContent = 
                    lastPrompt ? new Date(lastPrompt).toLocaleDateString() : 'Never';
                
                const dontAsk = storage.getDontAskAgain();
                document.getElementById('dontAskAgain').textContent = dontAsk ? 'Yes' : 'No';
            }

            // Update button states
            const manualInstallBtn = document.getElementById('manualInstallBtn');
            if (isInstalled) {
                manualInstallBtn.textContent = 'Already Installed';
                manualInstallBtn.disabled = true;
                manualInstallBtn.classList.add('btn-disabled');
            } else {
                manualInstallBtn.innerHTML = '<span class="btn-icon">📱</span>Install App';
                manualInstallBtn.disabled = false;
                manualInstallBtn.classList.remove('btn-disabled');
            }

        } catch (error) {
            console.error('[Settings] Error rendering installation tab:', error);
            this.showInstallationError('Error loading installation information');
        }
    }

    /**
     * Trigger manual installation
     */
    triggerManualInstall() {
        try {
            const result = window.triggerPWAInstall();
            
            if (result && result.success) {
                this.showInstallationResult('Installation triggered successfully!', 'success');
                // Refresh the tab after a short delay
                setTimeout(() => {
                    this.renderInstallationTab();
                }, 1000);
            } else {
                const message = result && result.message ? result.message : 'Installation not available';
                this.showInstallationResult(message, 'warning');
            }
        } catch (error) {
            console.error('[Settings] Error triggering manual install:', error);
            this.showInstallationResult('Error triggering installation', 'error');
        }
    }

    /**
     * Reset installation preferences
     */
    resetInstallationPreferences() {
        if (confirm('Reset installation preferences? This will clear all installation history and re-enable prompts.')) {
            try {
                window.resetPWAInstallPreferences();
                this.showInstallationResult('Installation preferences reset successfully!', 'success');
                // Refresh the tab
                setTimeout(() => {
                    this.renderInstallationTab();
                }, 500);
            } catch (error) {
                console.error('[Settings] Error resetting installation preferences:', error);
                this.showInstallationResult('Error resetting preferences', 'error');
            }
        }
    }

    /**
     * Check installation status
     */
    checkInstallationStatus() {
        try {
            const status = window.getPWAInstallStatus();
            
            if (status) {
                console.log('[Settings] Installation Status:', status);
                this.showInstallationResult('Status checked - see console for details', 'info');
                // Refresh the tab to show updated information
                this.renderInstallationTab();
            } else {
                this.showInstallationResult('Unable to check installation status', 'warning');
            }
        } catch (error) {
            console.error('[Settings] Error checking installation status:', error);
            this.showInstallationResult('Error checking status', 'error');
        }
    }

    /**
     * Show installation result message
     * @param {string} message - Message to display
     * @param {string} type - Type of message (success, error, warning, info)
     */
    showInstallationResult(message, type = 'info') {
        const resultDiv = document.getElementById('installationActionResult');
        resultDiv.textContent = message;
        resultDiv.className = `installation-result ${type}`;
        resultDiv.classList.remove('hidden');
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            resultDiv.classList.add('hidden');
        }, 5000);
    }

    /**
     * Show installation error message
     * @param {string} message - Error message to display
     */
    showInstallationError(message) {
        // Update all status fields to show error state
        document.getElementById('installationStatus').textContent = 'Error';
        document.getElementById('platformSupport').textContent = 'Unknown';
        document.getElementById('browserInfo').textContent = 'Unknown';
        document.getElementById('promptCount').textContent = '-';
        document.getElementById('lastPromptDate').textContent = '-';
        document.getElementById('dontAskAgain').textContent = '-';
        
        // Disable install button
        const manualInstallBtn = document.getElementById('manualInstallBtn');
        manualInstallBtn.textContent = 'Not Available';
        manualInstallBtn.disabled = true;
        manualInstallBtn.classList.add('btn-disabled');
        
        this.showInstallationResult(message, 'error');
    }

    /**
     * Save calendar settings from form
     */
    saveCalendarSettingsFromForm() {
        try {
            const settings = {
                enabled: document.getElementById('calendarEnabled').checked,
                provider: document.getElementById('calendarProvider').value,
                autoSync: document.getElementById('autoSyncEnabled').checked,
                syncInterviews: document.getElementById('syncInterviews').checked,
                syncFollowUps: document.getElementById('syncFollowUps').checked,
                eventDuration: parseInt(document.getElementById('eventDuration').value) || 60,
                reminderMinutes: document.getElementById('reminderMinutes').value
                    .split(',')
                    .map(m => parseInt(m.trim()))
                    .filter(m => !isNaN(m))
            };

            this.saveCalendarSettings(settings);
            this.renderCalendarTab();
        } catch (error) {
            console.error('[Settings] Error saving calendar settings:', error);
            NotificationManager.show('Failed to save calendar settings', 'error');
        }
    }

    /**
     * Reset calendar settings to default
     */
    resetCalendarSettings() {
        if (confirm('Are you sure you want to reset calendar settings to default?')) {
            this.calendarSettings = this.loadCalendarSettings();
            this.renderCalendarTab();
            NotificationManager.show('Calendar settings reset to default', 'success');
        }
    }

    /**
     * Test calendar integration
     */
    testCalendarIntegration() {
        if (!window.calendarIntegration) {
            NotificationManager.show('Calendar integration not available', 'error');
            return;
        }

        try {
            // Create a test event
            const testEvent = {
                title: 'Test: Job Tracker Calendar Integration',
                description: 'This is a test event from Job Tracker to verify calendar integration is working properly.',
                startDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
                endDate: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000), // Tomorrow + 1 hour
                location: 'Test Location',
                reminders: [60, 15],
                type: 'test'
            };

            window.calendarIntegration.addEventToCalendar(testEvent);
            NotificationManager.show('Test calendar event created! Check your calendar app.', 'success');
        } catch (error) {
            console.error('[Settings] Error testing calendar integration:', error);
            NotificationManager.show('Failed to test calendar integration', 'error');
        }
    }

    /**
     * Refresh calendar settings from localStorage
     */
    refreshCalendarSettings() {
        this.calendarSettings = this.loadCalendarSettings();
        this.renderCalendarTab();
    }

    /**
     * Render calendar settings tab
     */
    renderCalendarTab() {
        console.log('[SettingsManager] renderCalendarTab called');
        console.log('[SettingsManager] calendarSettings:', this.calendarSettings);
        
        if (!this.calendarSettings) {
            console.warn('[SettingsManager] calendarSettings is null/undefined, reloading...');
            this.calendarSettings = this.loadCalendarSettings();
            console.log('[SettingsManager] reloaded calendarSettings:', this.calendarSettings);
        }

        // Populate form fields
        const calendarEnabled = document.getElementById('calendarEnabled');
        const calendarProvider = document.getElementById('calendarProvider');
        const autoSyncEnabled = document.getElementById('autoSyncEnabled');
        const syncInterviews = document.getElementById('syncInterviews');
        const syncFollowUps = document.getElementById('syncFollowUps');
        const eventDuration = document.getElementById('eventDuration');
        const reminderMinutes = document.getElementById('reminderMinutes');
        
        if (calendarEnabled) calendarEnabled.checked = this.calendarSettings.enabled;
        if (calendarProvider) calendarProvider.value = this.calendarSettings.provider;
        if (autoSyncEnabled) autoSyncEnabled.checked = this.calendarSettings.autoSync;
        if (syncInterviews) syncInterviews.checked = this.calendarSettings.syncInterviews;
        if (syncFollowUps) syncFollowUps.checked = this.calendarSettings.syncFollowUps;
        if (eventDuration) eventDuration.value = this.calendarSettings.eventDuration;
        if (reminderMinutes) reminderMinutes.value = this.calendarSettings.reminderMinutes.join(', ');
        
        console.log('[SettingsManager] Form fields populated');
        
        // Update calendar integration settings
        if (window.calendarIntegration) {
            window.calendarIntegration.settings = this.calendarSettings;
            window.calendarIntegration.updateUI();
            console.log('[SettingsManager] Calendar integration updated');
        } else {
            console.warn('[SettingsManager] Calendar integration not found');
        }
    }

    /**
     * Cleanup method to unsubscribe from state manager
     */
    cleanup() {
        this.unsubscribers.forEach(unsubscribe => {
            try {
                unsubscribe();
            } catch (error) {
                console.warn('[SettingsManager] Error during cleanup:', error);
            }
        });
        this.unsubscribers = [];
    }
}
