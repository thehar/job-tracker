/**
 * Calendar Integration Manager
 * Handles calendar sync functionality for job applications
 */
class CalendarIntegration {
    constructor() {
        this.settings = this.loadSettings();
        this.init();
    }

    /**
     * Initialize calendar integration
     */
    init() {
        this.setupEventListeners();
        this.updateUI();
    }

    /**
     * Load calendar settings from localStorage
     * @returns {Object} Calendar settings
     */
    loadSettings() {
        const defaults = {
            enabled: false,
            provider: 'google', // google, outlook, apple, ical
            autoSync: true,
            syncInterviews: true,
            syncFollowUps: false,
            eventDuration: 60, // minutes
            reminderMinutes: [60, 15] // 1 hour and 15 minutes before
        };

        try {
            const stored = localStorage.getItem('jobTracker_calendarSettings');
            if (!stored) return defaults;
            const parsed = JSON.parse(stored);
            const settings = { ...defaults, ...parsed };
            console.log('[CalendarIntegration] Loaded settings:', settings);
            return settings;
        } catch (error) {
            console.warn('[CalendarIntegration] Failed to load settings:', error);
            return defaults;
        }
    }

    /**
     * Save calendar settings to localStorage
     * @param {Object} settings - Settings to save
     */
    saveSettings(settings) {
        try {
            this.settings = { ...this.settings, ...settings };
            localStorage.setItem('jobTracker_calendarSettings', JSON.stringify(this.settings));
            console.log('[CalendarIntegration] Saved settings:', this.settings);
            this.updateUI();
        } catch (error) {
            console.error('[CalendarIntegration] Failed to save settings:', error);
        }
    }

    /**
     * Update UI based on calendar settings
     */
    updateUI() {
        const syncActions = document.getElementById('calendarSyncActions');
        if (syncActions) {
            syncActions.style.display = this.settings.enabled ? 'flex' : 'none';
        }
    }

    /**
     * Setup event listeners for calendar integration
     */
    setupEventListeners() {
        // Listen for job updates to sync calendar events
        document.addEventListener('jobUpdated', (e) => {
            if (this.settings.enabled && this.settings.autoSync) {
                this.syncJobToCalendar(e.detail.job);
            }
        });

        // Listen for job deletions to remove calendar events
        document.addEventListener('jobDeleted', (e) => {
            if (this.settings.enabled) {
                this.removeJobFromCalendar(e.detail.jobId);
            }
        });
    }

    /**
     * Generate calendar event data from job
     * @param {Object} job - Job object
     * @returns {Object} Calendar event data
     */
    generateEventData(job) {
        // Ensure settings are loaded
        if (!this.settings) {
            this.settings = this.loadSettings();
        }
        
        const events = [];

        // Interview event
        if (job.interviewDate && this.settings.syncInterviews) {
            const interviewDate = new Date(job.interviewDate);
            const endDate = new Date(interviewDate.getTime() + (this.settings.eventDuration * 60000));

            events.push({
                title: `Interview: ${job.title} at ${job.company}`,
                description: this.generateEventDescription(job, 'interview'),
                startDate: interviewDate,
                endDate: endDate,
                location: job.notes || '',
                reminders: this.settings.reminderMinutes,
                type: 'interview'
            });
        }

        // Follow-up event
        if (job.followUpDate && this.settings.syncFollowUps) {
            const followUpDate = new Date(job.followUpDate);
            followUpDate.setHours(9, 0, 0, 0); // Set to 9 AM
            const endDate = new Date(followUpDate.getTime() + (30 * 60000)); // 30 minutes

            events.push({
                title: `Follow-up: ${job.title} at ${job.company}`,
                description: this.generateEventDescription(job, 'followup'),
                startDate: followUpDate,
                endDate: endDate,
                location: '',
                reminders: [1440], // 24 hours before
                type: 'followup'
            });
        }

        return events;
    }

    /**
     * Generate event description
     * @param {Object} job - Job object
     * @param {string} type - Event type (interview/followup)
     * @returns {string} Event description
     */
    generateEventDescription(job, type) {
        let description = `Job Application: ${job.title} at ${job.company}\n`;
        description += `Status: ${job.status}\n`;
        description += `Stage: ${job.stage || 'N/A'}\n`;
        description += `Applied: ${job.dateApplied}\n`;
        
        if (job.contactPerson) {
            description += `Contact: ${job.contactPerson}\n`;
        }
        
        if (job.applicationSource) {
            description += `Source: ${job.applicationSource}\n`;
        }

        if (job.notes) {
            description += `\nNotes: ${job.notes}`;
        }

        if (type === 'followup') {
            description += `\n\nThis is a follow-up reminder for your job application.`;
        }

        return description;
    }

    /**
     * Generate Google Calendar URL
     * @param {Object} event - Event data
     * @returns {string} Google Calendar URL
     */
    generateGoogleCalendarUrl(event) {
        const baseUrl = 'https://calendar.google.com/calendar/render';
        const params = new URLSearchParams({
            action: 'TEMPLATE',
            text: event.title,
            dates: `${this.formatDateForGoogle(event.startDate)}/${this.formatDateForGoogle(event.endDate)}`,
            details: event.description,
            location: event.location,
            trp: 'false'
        });

        // Add reminders
        event.reminders.forEach((minutes, index) => {
            params.append(`remind[${index}]`, minutes);
        });

        return `${baseUrl}?${params.toString()}`;
    }

    /**
     * Generate Outlook Calendar URL
     * @param {Object} event - Event data
     * @returns {string} Outlook Calendar URL
     */
    generateOutlookCalendarUrl(event) {
        const baseUrl = 'https://outlook.live.com/calendar/0/deeplink/compose';
        const params = new URLSearchParams({
            subject: event.title,
            startdt: event.startDate.toISOString(),
            enddt: event.endDate.toISOString(),
            body: event.description,
            location: event.location
        });

        return `${baseUrl}?${params.toString()}`;
    }

    /**
     * Generate Apple Calendar URL
     * @param {Object} event - Event data
     * @returns {string} Apple Calendar URL
     */
    generateAppleCalendarUrl(event) {
        const baseUrl = 'webcal://p28-caldav.icloud.com/published/2/';
        // Apple Calendar URLs are more complex, so we'll use a simpler approach
        return this.generateICalData(event);
    }

    /**
     * Generate iCal data
     * @param {Object} event - Event data
     * @returns {string} iCal formatted data
     */
    generateICalData(event) {
        const now = new Date();
        const uid = `job-tracker-${event.startDate.getTime()}@jobtracker.app`;
        
        let ical = 'BEGIN:VCALENDAR\n';
        ical += 'VERSION:2.0\n';
        ical += 'PRODID:-//Job Tracker//Job Tracker//EN\n';
        ical += 'BEGIN:VEVENT\n';
        ical += `UID:${uid}\n`;
        ical += `DTSTAMP:${this.formatDateForICal(now)}\n`;
        ical += `DTSTART:${this.formatDateForICal(event.startDate)}\n`;
        ical += `DTEND:${this.formatDateForICal(event.endDate)}\n`;
        ical += `SUMMARY:${event.title}\n`;
        ical += `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}\n`;
        ical += `LOCATION:${event.location}\n`;
        
        // Add reminders
        event.reminders.forEach(minutes => {
            ical += 'BEGIN:VALARM\n';
            ical += `TRIGGER:-PT${minutes}M\n`;
            ical += 'ACTION:DISPLAY\n';
            ical += `DESCRIPTION:${event.title}\n`;
            ical += 'END:VALARM\n';
        });
        
        ical += 'END:VEVENT\n';
        ical += 'END:VCALENDAR\n';
        
        return ical;
    }

    /**
     * Format date for Google Calendar
     * @param {Date} date - Date to format
     * @returns {string} Formatted date
     */
    formatDateForGoogle(date) {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    }

    /**
     * Format date for iCal
     * @param {Date} date - Date to format
     * @returns {string} Formatted date
     */
    formatDateForICal(date) {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    }

    /**
     * Sync job to calendar
     * @param {Object} job - Job object
     */
    async syncJobToCalendar(job) {
        if (!this.settings.enabled) return;

        try {
            const events = this.generateEventData(job);
            
            for (const event of events) {
                await this.addEventToCalendar(event);
            }

            // Update job with calendar sync metadata
            this.updateJobCalendarMetadata(job.id, events);
            
        } catch (error) {
            console.error('[CalendarIntegration] Failed to sync job to calendar:', error);
            NotificationManager.show('Failed to sync to calendar. Please try again.', 'error');
        }
    }

    /**
     * Add event to calendar based on provider
     * @param {Object} event - Event data
     */
    async addEventToCalendar(event) {
        switch (this.settings.provider) {
            case 'google':
                this.openCalendarUrl(this.generateGoogleCalendarUrl(event));
                break;
            case 'outlook':
                this.openCalendarUrl(this.generateOutlookCalendarUrl(event));
                break;
            case 'apple':
                this.downloadICalFile(event);
                break;
            case 'ical':
                this.downloadICalFile(event);
                break;
            default:
                this.openCalendarUrl(this.generateGoogleCalendarUrl(event));
        }
    }

    /**
     * Open calendar URL in new tab
     * @param {string} url - Calendar URL
     */
    openCalendarUrl(url) {
        const newWindow = window.open(url, '_blank', 'width=800,height=600');
        if (!newWindow) {
            NotificationManager.show('Please allow popups to add events to your calendar', 'warning');
        }
    }

    /**
     * Download iCal file
     * @param {Object} event - Event data
     */
    downloadICalFile(event) {
        const icalData = this.generateICalData(event);
        const blob = new Blob([icalData], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    /**
     * Update job with calendar sync metadata
     * @param {string} jobId - Job ID
     * @param {Array} events - Generated events
     */
    async updateJobCalendarMetadata(jobId, events) {
        // Try to use state manager first
        if (isStateManagerAvailable()) {
            try {
                const stateManager = getStateManager();
                const jobs = stateManager.getStateSlice('jobs') || [];
                const jobIndex = jobs.findIndex(job => job.id === jobId);
                
                if (jobIndex !== -1) {
                    const updatedJobs = [...jobs];
                    updatedJobs[jobIndex] = {
                        ...updatedJobs[jobIndex],
                        calendarSync: {
                            enabled: true,
                            lastSynced: new Date().toISOString(),
                            provider: this.settings.provider,
                            events: events.map(event => ({
                                type: event.type,
                                title: event.title,
                                startDate: event.startDate.toISOString(),
                                endDate: event.endDate.toISOString()
                            }))
                        }
                    };
                    
                    await stateManager.setState({ jobs: updatedJobs });
                    return;
                }
            } catch (error) {
                console.warn('[CalendarIntegration] State manager update failed, falling back to DataManager:', error);
            }
        }
        
        // Fallback to DataManager
        const jobs = DataManager.loadJobs();
        const jobIndex = jobs.findIndex(job => job.id === jobId);
        
        if (jobIndex !== -1) {
            jobs[jobIndex].calendarSync = {
                enabled: true,
                lastSynced: new Date().toISOString(),
                provider: this.settings.provider,
                events: events.map(event => ({
                    type: event.type,
                    title: event.title,
                    startDate: event.startDate.toISOString(),
                    endDate: event.endDate.toISOString()
                }))
            };
            
            await DataManager.saveJobs(jobs);
        }
    }

    /**
     * Remove job from calendar
     * @param {string} jobId - Job ID
     */
    removeJobFromCalendar(jobId) {
        // Try to use state manager first
        if (isStateManagerAvailable()) {
            try {
                const stateManager = getStateManager();
                const jobs = stateManager.getStateSlice('jobs') || [];
                const job = jobs.find(job => job.id === jobId);
                
                if (job && job.calendarSync) {
                    // Note: We can't actually remove events from external calendars
                    // This is a limitation of web-based calendar integration
                    console.log(`Calendar event removal not supported for job: ${jobId}`);
                }
                return;
            } catch (error) {
                console.warn('[CalendarIntegration] State manager access failed, falling back to DataManager:', error);
            }
        }
        
        // Fallback to DataManager
        const jobs = DataManager.loadJobs();
        const job = jobs.find(job => job.id === jobId);
        
        if (job && job.calendarSync) {
            // Note: We can't actually remove events from external calendars
            // This is a limitation of web-based calendar integration
            console.log(`Calendar event removal not supported for job: ${jobId}`);
        }
    }

    /**
     * Get calendar sync status for a job
     * @param {Object} job - Job object
     * @returns {Object} Sync status
     */
    getJobSyncStatus(job) {
        if (!job.calendarSync) {
            return { synced: false, provider: null, lastSynced: null };
        }

        return {
            synced: job.calendarSync.enabled,
            provider: job.calendarSync.provider,
            lastSynced: job.calendarSync.lastSynced,
            events: job.calendarSync.events || []
        };
    }

    /**
     * Check if job has calendar events
     * @param {Object} job - Job object
     * @returns {boolean} True if job has calendar events
     */
    hasCalendarEvents(job) {
        // Ensure settings are loaded
        if (!this.settings) {
            this.settings = this.loadSettings();
        }
        
        if (!this.settings.enabled) return false;
        return job.interviewDate || (job.followUpDate && this.settings.syncFollowUps);
    }

    /**
     * Get calendar action buttons for job card
     * @param {Object} job - Job object
     * @returns {string} HTML for calendar buttons
     */
    getCalendarButtons(job) {
        // Ensure settings are loaded
        if (!this.settings) {
            this.settings = this.loadSettings();
        }
        
        if (!this.settings.enabled) {
            return '';
        }

        if (!this.hasCalendarEvents(job)) {
            return '';
        }

        const syncStatus = this.getJobSyncStatus(job);
        const hasInterview = !!job.interviewDate;
        const hasFollowUp = !!job.followUpDate && this.settings.syncFollowUps;

        let buttons = '<div class="calendar-actions">';
        
        if (hasInterview) {
            buttons += `<button class="btn btn-sm btn-calendar" data-action="add-interview" data-job-id="${job.id}" title="Add interview to calendar">
                📅 Interview
            </button>`;
        }
        
        if (hasFollowUp) {
            buttons += `<button class="btn btn-sm btn-calendar" data-action="add-followup" data-job-id="${job.id}" title="Add follow-up to calendar">
                🔔 Follow-up
            </button>`;
        }

        if (syncStatus.synced) {
            buttons += `<span class="calendar-synced" title="Synced to ${syncStatus.provider} calendar">
                ✅ Synced
            </span>`;
        }

        buttons += '</div>';
        return buttons;
    }

    /**
     * Handle calendar button clicks
     * @param {string} action - Action type
     * @param {string} jobId - Job ID
     */
    handleCalendarAction(action, jobId) {
        // Try to use state manager first
        let job = null;
        if (isStateManagerAvailable()) {
            try {
                const stateManager = getStateManager();
                const jobs = stateManager.getStateSlice('jobs') || [];
                job = jobs.find(job => job.id === jobId);
            } catch (error) {
                console.warn('[CalendarIntegration] State manager access failed, falling back to DataManager:', error);
            }
        }
        
        // Fallback to DataManager if state manager failed or not available
        if (!job) {
            const jobs = DataManager.loadJobs();
            job = jobs.find(job => job.id === jobId);
        }
        
        if (!job) return;

        if (action === 'add-interview' && job.interviewDate) {
            const event = this.generateEventData(job).find(e => e.type === 'interview');
            if (event) {
                this.addEventToCalendar(event);
                this.updateJobCalendarMetadata(jobId, [event]);
            }
        } else if (action === 'add-followup' && job.followUpDate) {
            const event = this.generateEventData(job).find(e => e.type === 'followup');
            if (event) {
                this.addEventToCalendar(event);
                this.updateJobCalendarMetadata(jobId, [event]);
            }
        }
    }
}

// Initialize calendar integration
window.calendarIntegration = new CalendarIntegration();
