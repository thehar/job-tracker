/**
 * Data Management System
 * Handles job data storage, retrieval, and validation
 */
class DataManager {
    /**
     * Load jobs from localStorage
     * @returns {Array} Array of job objects
     */
    static loadJobs() {
        const storedJobs = localStorage.getItem('jobTracker_jobs');
        const jobs = storedJobs ? JSON.parse(storedJobs) : [];
        
        // Data migration: Add applicationSource field to existing jobs
        const migratedJobs = jobs.map(job => {
            if (!job.hasOwnProperty('applicationSource')) {
                return {
                    ...job,
                    applicationSource: '' // Default to empty string for existing jobs
                };
            }
            return job;
        });
        
        // Save migrated data back if any migration occurred
        if (migratedJobs.some((job, index) => !jobs[index].hasOwnProperty('applicationSource'))) {
            this.saveJobs(migratedJobs);
        }
        
        return migratedJobs;
    }

    /**
     * Save jobs to localStorage
     * @param {Array} jobs - Array of job objects to save
     */
    static saveJobs(jobs) {
        localStorage.setItem('jobTracker_jobs', JSON.stringify(jobs));
    }

    /**
     * Validate job data
     * @param {Object} jobData - Job data to validate
     * @returns {boolean} True if valid, false otherwise
     */
    static validateJobData(jobData) {
        const requiredFields = ['title', 'company', 'status', 'dateApplied'];
        return requiredFields.every(field => 
            jobData[field] && jobData[field].trim()
        );
    }

    /**
     * Create a new job object with proper structure
     * @param {Object} formData - Form data from job form
     * @returns {Object} Structured job object
     */
    static createJobObject(formData) {
        return {
            id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9),
            title: formData.title.trim(),
            company: formData.company.trim(),
            status: formData.status.trim(),
            stage: formData.stage ? formData.stage.trim() : '',
            dateApplied: formData.dateApplied.trim(),
            interviewDate: formData.interviewDate ? formData.interviewDate.trim() : '',
            followUpDate: formData.followUpDate ? formData.followUpDate.trim() : '',
            applicationSource: formData.applicationSource ? formData.applicationSource.trim() : '',
            contactPerson: formData.contactPerson ? formData.contactPerson.trim() : '',
            notes: formData.notes ? formData.notes.trim() : '',
            calendarSync: formData.calendarSync ? {
                enabled: formData.calendarSync === 'true',
                lastSynced: null,
                provider: null,
                events: []
            } : null,
            createdAt: new Date().toISOString()
        };
    }

    /**
     * Update existing job object
     * @param {Object} existingJob - Existing job object
     * @param {Object} formData - New form data
     * @returns {Object} Updated job object
     */
    static updateJobObject(existingJob, formData) {
        return {
            ...existingJob,
            title: formData.title.trim(),
            company: formData.company.trim(),
            status: formData.status.trim(),
            stage: formData.stage ? formData.stage.trim() : '',
            dateApplied: formData.dateApplied.trim(),
            interviewDate: formData.interviewDate ? formData.interviewDate.trim() : '',
            followUpDate: formData.followUpDate ? formData.followUpDate.trim() : '',
            applicationSource: formData.applicationSource ? formData.applicationSource.trim() : '',
            contactPerson: formData.contactPerson ? formData.contactPerson.trim() : '',
            notes: formData.notes ? formData.notes.trim() : '',
            calendarSync: formData.calendarSync ? {
                ...existingJob.calendarSync,
                enabled: formData.calendarSync === 'true',
                lastSynced: existingJob.calendarSync?.lastSynced || null,
                provider: existingJob.calendarSync?.provider || null,
                events: existingJob.calendarSync?.events || []
            } : existingJob.calendarSync,
            updatedAt: new Date().toISOString()
        };
    }

    /**
     * Check if date string is valid
     * @param {string} dateString - Date string to validate
     * @returns {boolean} True if valid date
     */
    static isValidDate(dateString) {
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date);
    }

    /**
     * Format date for display
     * @param {string|Date} date - Date to format
     * @returns {string} Formatted date string
     */
    static formatDate(date) {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        return dateObj.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    /**
     * Format date and time for display
     * @param {string|Date} date - Date to format
     * @returns {string} Formatted date time string
     */
    static formatDateTime(date) {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        return dateObj.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Calculate days between two dates
     * @param {string|Date} date1 - First date
     * @param {string|Date} date2 - Second date (defaults to now)
     * @returns {number} Number of days difference
     */
    static calculateDaysBetween(date1, date2 = new Date()) {
        const firstDate = typeof date1 === 'string' ? new Date(date1) : date1;
        const secondDate = typeof date2 === 'string' ? new Date(date2) : date2;
        return Math.floor((secondDate - firstDate) / (1000 * 60 * 60 * 24));
    }

    /**
     * Escape HTML characters for safe display
     * @param {string} text - Text to escape
     * @returns {string} HTML-safe text
     */
    static escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Get form data from a form element
     * @param {string} formId - ID of the form element
     * @returns {Object} Form data as key-value pairs
     */
    static getFormData(formId) {
        const form = document.getElementById(formId);
        const formData = new FormData(form);
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            data[key] = value.trim();
        }
        
        return data;
    }

    /**
     * Reset a form to its default state
     * @param {string} formId - ID of the form to reset
     */
    static resetForm(formId) {
        const form = document.getElementById(formId);
        form.reset();
        
        // Set default date to today if form has dateApplied field
        const dateField = form.querySelector('#dateApplied');
        if (dateField) {
            dateField.value = new Date().toISOString().split('T')[0];
        }
    }

    /**
     * Deduplicate jobs based on title and company
     * @param {Array} existingJobs - Current job list
     * @param {Array} newJobs - New jobs to check for duplicates
     * @returns {Array} Filtered array without duplicates
     */
    static deduplicateJobs(existingJobs, newJobs) {
        const existingKeys = new Set(
            existingJobs.map(job => `${job.title.toLowerCase()}-${job.company.toLowerCase()}`)
        );
        
        return newJobs.filter(job => {
            const key = `${job.title.toLowerCase()}-${job.company.toLowerCase()}`;
            if (existingKeys.has(key)) {
                console.log(`Skipping duplicate job: ${job.title} at ${job.company}`);
                return false;
            }
            existingKeys.add(key);
            return true;
        });
    }
}

/**
 * Notification-related storage helpers
 */
class NotificationStorage {
    /**
     * Load notification preferences from localStorage
     * @returns {Object}
     */
    static loadPreferences() {
        const defaults = {
            enabled: false,
            types: { interviews: true, followUps: true, statusChanges: false },
            timing: { interviews: [1440, 120, 30], followUps: [72] }
        };
        try {
            const stored = localStorage.getItem('jobTracker_notificationPreferences');
            if (!stored) return defaults;
            const parsed = JSON.parse(stored);
            return {
                ...defaults,
                ...parsed,
                types: { ...defaults.types, ...(parsed.types || {}) },
                timing: { ...defaults.timing, ...(parsed.timing || {}) }
            };
        } catch (error) {
            console.warn('[NotificationStorage] Failed to load preferences:', error);
            return defaults;
        }
    }

    /**
     * Save notification preferences to localStorage
     * @param {Object} prefs
     */
    static savePreferences(prefs) {
        try {
            localStorage.setItem('jobTracker_notificationPreferences', JSON.stringify(prefs));
        } catch (error) {
            console.error('[NotificationStorage] Failed to save preferences:', error);
        }
    }

    /**
     * Load scheduled reminders array
     * @returns {Array}
     */
    static loadReminders() {
        try {
            const stored = localStorage.getItem('jobTracker_scheduledReminders');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.warn('[NotificationStorage] Failed to load reminders:', error);
            return [];
        }
    }

    /**
     * Save scheduled reminders array
     * @param {Array} reminders
     */
    static saveReminders(reminders) {
        try {
            localStorage.setItem('jobTracker_scheduledReminders', JSON.stringify(reminders));
        } catch (error) {
            console.error('[NotificationStorage] Failed to save reminders:', error);
        }
    }

    /**
     * Load notification history entries
     * @returns {Array}
     */
    static loadHistory() {
        try {
            const stored = localStorage.getItem('jobTracker_notificationHistory');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.warn('[NotificationStorage] Failed to load history:', error);
            return [];
        }
    }

    /**
     * Save notification history entries
     * @param {Array} history
     */
    static saveHistory(history) {
        try {
            localStorage.setItem('jobTracker_notificationHistory', JSON.stringify(history));
        } catch (error) {
            console.error('[NotificationStorage] Failed to save history:', error);
        }
    }
}
