/**
 * Main Job Tracker Application
 * Handles job CRUD operations, form management, and UI interactions
 * Enhanced to use state manager for reactive updates
 */
class JobTracker {
    constructor() {
        this.jobs = [];
        this.currentFilter = '';
        this.stateManager = null;
        this.unsubscribers = [];
        this.init();
    }

    /**
     * Initialize the job tracker
     */
    init() {
        this.setupEventListeners();
        this.loadJobs();
        this.renderJobs();
        this.updateStats();
        this.setDefaultDate();
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
        } else {
            console.warn('[JobTracker] State manager not available during setup');
        }
    }

    /**
     * Setup state manager subscriptions
     */
    setupStateSubscriptions() {
        if (!this.stateManager) return;

        // Subscribe to job changes
        const unsubscribeJobs = this.stateManager.subscribe('state:jobs:changed', (jobs) => {
            try {
                this.jobs = jobs;
                this.renderJobs();
                this.updateStats();
            } catch (error) {
                console.error('[JobTracker] Error in state subscription callback:', error);
            }
        });

        this.unsubscribers.push(unsubscribeJobs);
    }

    /**
     * Load jobs from storage (deprecated - use state manager instead)
     */
    loadJobs() {
        // This method is kept for backward compatibility but should not be used
        // when state manager is available. Jobs are loaded via state subscription.
        if (!this.stateManager) {
            this.jobs = DataManager.loadJobs();
        }
    }

    /**
     * Save jobs to storage
     */
    async saveJobs() {
        await DataManager.saveJobs(this.jobs);
    }

    /**
     * Setup event listeners for job management
     */
    setupEventListeners() {
        // Form submission
        document.getElementById('jobForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addJob();
        });

        // Filter change
        document.getElementById('statusFilter').addEventListener('change', (e) => {
            this.currentFilter = e.target.value;
            this.renderJobs();
        });

        // Clear filters
        document.getElementById('clearFilters').addEventListener('click', () => {
            this.clearFilters();
        });

        // Add sample data
        document.getElementById('addSampleData').addEventListener('click', () => {
            this.addSampleData();
        });

        // CSV import
        document.getElementById('csvFileInput').addEventListener('change', (e) => {
            this.handleCsvImport(e);
        });

        // CSV export
        document.getElementById('exportCsv').addEventListener('click', () => {
            this.exportCsv();
        });

        // Modal close events
        document.getElementById('closeModal').addEventListener('click', () => {
            this.closeEditModal();
        });

        document.getElementById('cancelEdit').addEventListener('click', () => {
            this.closeEditModal();
        });

        // Close modal when clicking outside
        document.getElementById('editModal').addEventListener('click', (e) => {
            if (e.target.id === 'editModal') {
                this.closeEditModal();
            }
        });

        // Edit form submission
        document.getElementById('editForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateJob();
        });

        // Calendar action buttons
        document.getElementById('jobsList').addEventListener('click', (e) => {
            const button = e.target.closest('button[data-action^="add-"]');
            if (!button) return;

            const action = button.dataset.action;
            const jobId = button.dataset.jobId;

            if (window.calendarIntegration) {
                window.calendarIntegration.handleCalendarAction(action, jobId);
            }
        });

        // Event delegation for job action buttons
        document.getElementById('jobsList').addEventListener('click', (e) => {
            const button = e.target.closest('button[data-action]');
            if (!button) return;

            const action = button.dataset.action;
            const jobId = button.dataset.jobId;

            if (action === 'edit') {
                this.editJob(jobId);
            } else if (action === 'delete') {
                this.deleteJob(jobId);
            }
        });
    }

    /**
     * Set default date to today
     */
    setDefaultDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('dateApplied').value = today;
    }

    /**
     * Add a new job
     */
    async addJob() {
        const formData = DataManager.getFormData('jobForm');

        if (!DataManager.validateJobData(formData)) {
            NotificationManager.show('Please fill in all required fields!', 'error');
            return;
        }

        try {
            let newJob;
            
            // Use state manager if available
            if (this.stateManager) {
                newJob = await this.stateManager.addJob(formData);
            } else {
                // Fallback to direct manipulation
                newJob = DataManager.createJobObject(formData);
                this.jobs.unshift(newJob);
                this.saveJobs();
                this.renderJobs();
                this.updateStats();
            }

            DataManager.resetForm('jobForm');

            // Update dashboard if it exists
            if (window.dashboard) {
                window.dashboard.refresh();
            }

            NotificationManager.show('Job added successfully!', 'success');
            // Schedule reminders for this job
            try { window.getReminderScheduler()?.scheduleForJob(newJob); } catch (e) { /* no-op */ }
            
        } catch (error) {
            console.error('[JobTracker] Failed to add job:', error);
            NotificationManager.show('Failed to add job. Please try again.', 'error');
        }
    }

    /**
     * Update existing job
     */
    async updateJob() {
        const formData = DataManager.getFormData('editForm');
        const jobId = document.getElementById('editJobId').value;

        if (!DataManager.validateJobData(formData)) {
            NotificationManager.show('Please fill in all required fields!', 'error');
            return;
        }

        try {
            let updatedJob;
            
            // Use state manager if available
            if (this.stateManager) {
                updatedJob = await this.stateManager.updateJob(jobId, formData);
            } else {
                // Fallback to direct manipulation
                const jobIndex = this.jobs.findIndex(job => job.id === jobId);
                if (jobIndex === -1) {
                    NotificationManager.show('Job not found!', 'error');
                    return;
                }

                updatedJob = DataManager.updateJobObject(this.jobs[jobIndex], formData);
                this.jobs[jobIndex] = updatedJob;
                this.saveJobs();
                this.renderJobs();
                this.updateStats();
            }

            this.closeEditModal();

            // Update dashboard if it exists
            if (window.dashboard) {
                window.dashboard.refresh();
            }

            NotificationManager.show('Job updated successfully!', 'success');
            // Reschedule reminders for this job
            try { window.getReminderScheduler()?.rescheduleForJob(updatedJob); } catch (e) { /* no-op */ }
            
        } catch (error) {
            console.error('[JobTracker] Failed to update job:', error);
            NotificationManager.show('Failed to update job. Please try again.', 'error');
        }
    }

    /**
     * Delete a job
     * @param {string} jobId - ID of job to delete
     */
    async deleteJob(jobId) {
        if (confirm('Are you sure you want to delete this job application?')) {
            try {
                // Use state manager if available
                if (this.stateManager) {
                    await this.stateManager.deleteJob(jobId);
                } else {
                    // Fallback to direct manipulation
                    this.jobs = this.jobs.filter(job => job.id !== jobId);
                    this.saveJobs();
                    this.renderJobs();
                    this.updateStats();
                }

                // Update dashboard if it exists
                if (window.dashboard) {
                    window.dashboard.refresh();
                }

                NotificationManager.show('Job deleted successfully!', 'success');
                
            } catch (error) {
                console.error('[JobTracker] Failed to delete job:', error);
                NotificationManager.show('Failed to delete job. Please try again.', 'error');
            }
        }
    }

    /**
     * Edit a job - populate edit form and show modal
     * @param {string} jobId - ID of job to edit
     */
    editJob(jobId) {
        const job = this.jobs.find(job => job.id === jobId);
        if (!job) return;

        // Populate edit form
        document.getElementById('editJobId').value = job.id;
        document.getElementById('editTitle').value = job.title;
        document.getElementById('editCompany').value = job.company;
        document.getElementById('editStatus').value = job.status;
        document.getElementById('editStage').value = job.stage || '';
        document.getElementById('editDateApplied').value = job.dateApplied;
        document.getElementById('editInterviewDate').value = job.interviewDate || '';
        document.getElementById('editFollowUpDate').value = job.followUpDate || '';
        document.getElementById('editApplicationSource').value = job.applicationSource || '';
        document.getElementById('editContactPerson').value = job.contactPerson || '';
        document.getElementById('editNotes').value = job.notes || '';
        document.getElementById('editCalendarSync').checked = job.calendarSync?.enabled || false;

        // Show modal
        document.getElementById('editModal').classList.remove('hidden');
    }

    /**
     * Close edit modal
     */
    closeEditModal() {
        document.getElementById('editModal').classList.add('hidden');
        document.getElementById('editForm').reset();
    }

    /**
     * Clear all filters
     */
    clearFilters() {
        this.currentFilter = '';
        document.getElementById('statusFilter').value = '';
        this.renderJobs();
    }

    /**
     * Render jobs list in the UI
     */
    renderJobs() {
        const jobsList = document.getElementById('jobsList');
        const noJobs = document.getElementById('noJobs');

        let filteredJobs = this.jobs;

        if (this.currentFilter) {
            filteredJobs = this.jobs.filter(job => job.status === this.currentFilter);
        }

        if (filteredJobs.length === 0) {
            jobsList.innerHTML = '';
            noJobs.classList.remove('hidden');
            return;
        }

        noJobs.classList.add('hidden');

        jobsList.innerHTML = filteredJobs.map(job => this.createJobCard(job)).join('');
    }

    /**
     * Create HTML for a job card
     * @param {Object} job - Job object
     * @returns {string} HTML string for job card
     */
    createJobCard(job) {
        const statusClass = this.getStatusClass(job.status);
        const formattedDate = DataManager.formatDate(job.dateApplied);

        return `
            <div class="job-card">
                <div class="job-card-header">
                    <div>
                        <div class="job-title">${DataManager.escapeHtml(job.title)}</div>
                        <div class="job-company">${DataManager.escapeHtml(job.company)}</div>
                    </div>
                    <div class="job-status ${statusClass}">${DataManager.escapeHtml(job.status)}</div>
                </div>
                
                <div class="job-details">
                    <div class="job-detail">
                        <span class="job-detail-label">Applied:</span>
                        <span>${formattedDate}</span>
                    </div>
                    ${job.applicationSource ? `
                        <div class="job-detail">
                            <span class="job-detail-label">Source:</span>
                            <span>${DataManager.escapeHtml(job.applicationSource)}</span>
                        </div>
                    ` : ''}
                    ${job.stage ? `
                        <div class="job-detail">
                            <span class="job-detail-label">Stage:</span>
                            <span>${DataManager.escapeHtml(job.stage)}</span>
                        </div>
                    ` : ''}
                    ${job.contactPerson ? `
                        <div class="job-detail">
                            <span class="job-detail-label">Contact:</span>
                            <span>${DataManager.escapeHtml(job.contactPerson)}</span>
                        </div>
                    ` : ''}
                    <div class="job-detail">
                        <span class="job-detail-label">Added:</span>
                        <span>${DataManager.formatDate(job.createdAt)}</span>
                    </div>
                    ${job.interviewDate ? `
                        <div class="job-detail">
                            <span class="job-detail-label">Interview:</span>
                            <span>${DataManager.formatDateTime(job.interviewDate)}</span>
                        </div>
                    ` : ''}
                    ${job.followUpDate ? `
                        <div class="job-detail">
                            <span class="job-detail-label">Follow-up:</span>
                            <span>${DataManager.formatDate(job.followUpDate)}</span>
                        </div>
                    ` : ''}
                </div>
                
                ${job.notes ? `
                    <div class="job-notes">
                        <div class="job-notes-text">${DataManager.escapeHtml(job.notes)}</div>
                    </div>
                ` : ''}
                
                <div class="job-actions">
                    <button class="btn btn-secondary btn-sm" data-action="edit" data-job-id="${job.id}">
                        Edit
                    </button>
                    <button class="btn btn-danger btn-sm" data-action="delete" data-job-id="${job.id}">
                        Delete
                    </button>
                    ${window.calendarIntegration ? window.calendarIntegration.getCalendarButtons(job) : ''}
                </div>
            </div>
        `;
    }

    /**
     * Get CSS class for job status
     * @param {string} status - Job status
     * @returns {string} CSS class name
     */
    getStatusClass(status) {
        const statusMap = {
            'Applied': 'status-applied',
            'Interview Scheduled': 'status-interview-scheduled',
            'Interview Completed': 'status-interview-completed',
            'Offer Received': 'status-offer-received',
            'Rejected': 'status-rejected',
            'Withdrawn': 'status-withdrawn'
        };
        return statusMap[status] || 'status-applied';
    }

    /**
     * Update statistics display
     */
    updateStats() {
        const totalJobs = document.getElementById('totalJobs');
        if (totalJobs) {
            totalJobs.textContent = this.jobs.length;
        }
    }

    /**
     * Add sample data for demonstration
     */
    addSampleData() {
        if (this.jobs.length > 0) {
            if (!confirm('This will add 6 sample jobs with diverse application sources to demonstrate the tracking features. Continue?')) {
                return;
            }
        }

        const baseTime = Date.now();
        const sampleJobs = [
            {
                id: `${baseTime}_sample_1_${Math.random().toString(36).substr(2, 9)}`,
                title: 'Frontend Developer',
                company: 'Tech Corp',
                status: 'Applied',
                stage: 'Application Submitted',
                dateApplied: '2024-09-09',
                applicationSource: 'LinkedIn',
                contactPerson: 'John Smith',
                notes: 'Applied through LinkedIn. Company looks promising with good benefits.',
                createdAt: '2024-12-09T10:00:00.000Z'
            },
            {
                id: `${baseTime}_sample_2_${Math.random().toString(36).substr(2, 9)}`,
                title: 'Software Engineer',
                company: 'Startup Inc',
                status: 'Interview Scheduled',
                stage: 'Phone Screen',
                dateApplied: '2024-10-08',
                applicationSource: 'Indeed',
                contactPerson: 'Sarah Johnson',
                notes: 'Phone interview scheduled for next week. Excited about the role!',
                createdAt: '2024-12-08T14:30:00.000Z'
            },
            {
                id: `${baseTime}_sample_3_${Math.random().toString(36).substr(2, 9)}`,
                title: 'Full Stack Developer',
                company: 'Enterprise Solutions',
                status: 'Rejected',
                stage: 'Technical Interview',
                dateApplied: '2024-11-07',
                applicationSource: 'Company Website',
                contactPerson: 'Mike Wilson',
                notes: 'Did well in technical interview but they went with another candidate.',
                createdAt: '2024-12-07T09:15:00.000Z'
            },
            {
                id: `${baseTime}_sample_4_${Math.random().toString(36).substr(2, 9)}`,
                title: 'Backend Developer',
                company: 'FinTech Solutions',
                status: 'Interview Completed',
                stage: 'Final Round',
                dateApplied: '2024-12-06',
                applicationSource: 'Referral',
                contactPerson: 'Emma Davis',
                notes: 'Referred by a former colleague. Great team culture and interesting projects.',
                createdAt: '2024-12-06T11:20:00.000Z'
            },
            {
                id: `${baseTime}_sample_5_${Math.random().toString(36).substr(2, 9)}`,
                title: 'DevOps Engineer',
                company: 'Cloud Innovations',
                status: 'Applied',
                stage: 'Application Submitted',
                dateApplied: '2024-12-05',
                applicationSource: 'Glassdoor',
                contactPerson: '',
                notes: 'Found this role on Glassdoor. Company has excellent reviews.',
                createdAt: '2024-12-05T16:45:00.000Z'
            },
            {
                id: `${baseTime}_sample_6_${Math.random().toString(36).substr(2, 9)}`,
                title: 'Product Manager',
                company: 'Growth Dynamics',
                status: 'Offer Received',
                stage: 'Negotiation',
                dateApplied: '2024-12-04',
                applicationSource: 'Recruiter',
                contactPerson: 'Alex Chen',
                notes: 'Contacted by recruiter. Received offer, negotiating salary and benefits.',
                createdAt: '2024-12-04T09:30:00.000Z'
            }
        ];

        // Debug: Check if all jobs are created properly
        console.log('Sample jobs array length:', sampleJobs.length);
        console.log('Sample jobs:', sampleJobs);
        
        // Add jobs one by one to avoid spread operator issues
        sampleJobs.forEach((job, index) => {
            console.log(`Adding job ${index + 1}:`, job.title, job.applicationSource);
            this.jobs.unshift(job);
        });
        
        console.log('Total jobs after adding:', this.jobs.length);
        
        this.saveJobs();
        this.renderJobs();
        this.updateStats();

        // Update dashboard if it exists
        if (window.dashboard) {
            window.dashboard.refresh();
        }

        NotificationManager.show(`${sampleJobs.length} sample jobs added with diverse application sources!`, 'success');
    }

    /**
     * Handle CSV file import
     * @param {Event} event - File input change event
     */
    async handleCsvImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const text = await CsvManager.readFileAsText(file);
            const importedJobs = CsvManager.parseCsv(text);

            if (importedJobs.length === 0) {
                NotificationManager.show('No valid data found in CSV file', 'error');
                return;
            }

            // Validate and process imported jobs
            const validJobs = CsvManager.validateImportedJobs(importedJobs);

            if (validJobs.length === 0) {
                NotificationManager.show('No valid jobs found in CSV file', 'error');
                return;
            }

            // Deduplicate jobs based on title + company
            const newJobs = DataManager.deduplicateJobs(this.jobs, validJobs);

            // Add imported jobs
            this.jobs.unshift(...newJobs);
            this.saveJobs();
            this.renderJobs();
            this.updateStats();

            // Update dashboard if it exists
            if (window.dashboard) {
                window.dashboard.refresh();
            }

            NotificationManager.show(`Successfully imported ${newJobs.length} jobs from CSV`, 'success');

            // Reset file input
            event.target.value = '';

        } catch (error) {
            console.error('CSV import error:', error);
            NotificationManager.show(`Error importing CSV: ${error.message}`, 'error');
            event.target.value = '';
        }
    }

    /**
     * Export jobs as CSV file
     */
    exportCsv() {
        try {
            const csvContent = CsvManager.generateCsv(this.jobs);
            const filename = `job_applications_${new Date().toISOString().split('T')[0]}.csv`;

            CsvManager.downloadCsv(csvContent, filename);
            NotificationManager.show('CSV exported successfully!', 'success');

        } catch (error) {
            console.error('CSV export error:', error);
            NotificationManager.show(`Error exporting CSV: ${error.message}`, 'error');
        }
    }

    /**
     * Update validation lists (called by settings manager)
     */
    updateValidationLists() {
        // This method is called by the settings manager to update validation
        // The actual validation logic is now dynamic based on current settings
    }

    /**
     * Cleanup method to unsubscribe from state manager
     */
    cleanup() {
        this.unsubscribers.forEach(unsubscribe => {
            try {
                unsubscribe();
            } catch (error) {
                console.warn('[JobTracker] Error during cleanup:', error);
            }
        });
        this.unsubscribers = [];
    }
}
