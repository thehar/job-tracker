/**
 * Settings Manager for Custom Statuses and Stages
 * Handles user preferences, custom statuses/stages, and form updates
 */
class SettingsManager {
    constructor() {
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
        this.setupEventListeners();
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
     * Save custom statuses to localStorage
     */
    saveStatuses() {
        localStorage.setItem('jobTracker_statuses', JSON.stringify(this.statuses));
        this.updateForms();
        NotificationManager.show('Statuses saved successfully!', 'success');
    }

    /**
     * Save custom stages to localStorage
     */
    saveStages() {
        localStorage.setItem('jobTracker_stages', JSON.stringify(this.stages));
        this.updateForms();
        NotificationManager.show('Stages saved successfully!', 'success');
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
    }

    /**
     * Switch between settings tabs
     * @param {string} tabName - Name of tab to switch to
     */
    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.settings-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.settings-tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}Tab`).classList.add('active');

        // Render appropriate content
        if (tabName === 'statuses') {
            this.renderStatuses();
        } else if (tabName === 'stages') {
            this.renderStages();
        } else if (tabName === 'installation') {
            this.renderInstallationTab();
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
}
