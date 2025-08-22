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
}
