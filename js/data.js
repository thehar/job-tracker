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
        return storedJobs ? JSON.parse(storedJobs) : [];
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
            applicationSource: formData.applicationSource ? formData.applicationSource.trim() : '',
            contactPerson: formData.contactPerson ? formData.contactPerson.trim() : '',
            notes: formData.notes ? formData.notes.trim() : '',
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
            applicationSource: formData.applicationSource ? formData.applicationSource.trim() : '',
            contactPerson: formData.contactPerson ? formData.contactPerson.trim() : '',
            notes: formData.notes ? formData.notes.trim() : '',
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
