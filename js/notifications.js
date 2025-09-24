/**
 * Notification Manager
 * Handles showing success, error, and info notifications to users
 */
class NotificationManager {
    /**
     * Show a notification to the user
     * @param {string} message - Message to display
     * @param {string} type - Type of notification ('success', 'error', 'info')
     */
    static show(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 1001;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            max-width: 300px;
            word-wrap: break-word;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        `;
        
        // Set background color based on type
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            info: '#3b82f6'
        };
        notification.style.backgroundColor = colors[type] || colors.info;
        
        // Add to DOM
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    /**
     * Show success notification
     * @param {string} message - Success message
     */
    static success(message) {
        this.show(message, 'success');
    }

    /**
     * Show error notification
     * @param {string} message - Error message
     */
    static error(message) {
        this.show(message, 'error');
    }

    /**
     * Show info notification
     * @param {string} message - Info message
     */
    static info(message) {
        this.show(message, 'info');
    }
}

/**
 * System Notification Manager
 * Handles Notification API permissions and Service Worker messaging
 */
class SystemNotificationManager {
    /**
     * Request notification permission from the user
     * @returns {Promise<NotificationPermission>}
     */
    static async requestPermission() {
        try {
            if (!('Notification' in window)) {
                NotificationManager.error('Notifications are not supported in this browser');
                return 'denied';
            }
            const result = await Notification.requestPermission();
            return result;
        } catch (error) {
            console.error('[Notifications] Permission request failed:', error);
            return Notification.permission;
        }
    }

    /**
     * Send a notification via the service worker
     * @param {string} title
     * @param {NotificationOptions} options
     */
    static async send(title, options = {}) {
        try {
            if (!('serviceWorker' in navigator)) {
                NotificationManager.error('Service Worker not available');
                return false;
            }
            const registration = await navigator.serviceWorker.getRegistration();
            if (!registration || !navigator.serviceWorker.controller) {
                NotificationManager.error('Service Worker not controlling the page yet');
                return false;
            }
            navigator.serviceWorker.controller.postMessage({
                type: 'SHOW_NOTIFICATION',
                data: { title, options }
            });
            return true;
        } catch (error) {
            console.error('[Notifications] Failed to send notification:', error);
            return false;
        }
    }
}

/**
 * Reminder Scheduler
 * Schedules local reminders for interviews and follow-ups, with catch-up delivery on load
 */
class ReminderScheduler {
    constructor() {
        this.timeoutIdByReminderId = new Map();
        this.rehydrate();
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.rehydrate();
            }
        });
        window.addEventListener('focus', () => this.rehydrate());
    }

    getPreferences() {
        return NotificationStorage.loadPreferences();
    }

    getReminders() {
        return NotificationStorage.loadReminders();
    }

    saveReminders(reminders) {
        NotificationStorage.saveReminders(reminders);
    }

    rehydrate() {
        const reminders = this.getReminders();
        const now = Date.now();
        // Deliver missed
        reminders
            .filter(r => !r.delivered && r.fireAt <= now)
            .forEach(r => this.deliverReminder(r));
        // Schedule future
        reminders
            .filter(r => !r.delivered && r.fireAt > now)
            .forEach(r => this.scheduleTimeout(r));
    }

    scheduleForJob(job) {
        const prefs = this.getPreferences();
        if (!prefs.enabled) return;

        const newReminders = [];
        const now = Date.now();

        // Interview reminders
        if (prefs.types.interviews && job.interviewDate) {
            const interviewMs = new Date(job.interviewDate).getTime();
            if (!isNaN(interviewMs)) {
                (prefs.timing.interviews || []).forEach(offsetMin => {
                    const fireAt = interviewMs - offsetMin * 60 * 1000;
                    if (fireAt > now - 60000) { // ignore stale beyond 1 min
                        newReminders.push(this.createReminder(job.id, 'interview', fireAt));
                    }
                });
            }
        }

        // Follow-up reminders
        if (prefs.types.followUps) {
            let baseDateStr = job.followUpDate || job.dateApplied;
            const baseMs = new Date(baseDateStr).getTime();
            if (!isNaN(baseMs)) {
                (prefs.timing.followUps || []).forEach(offsetMin => {
                    const fireAt = baseMs + offsetMin * 60 * 1000; // offsets are minutes
                    if (fireAt > now - 60000) {
                        newReminders.push(this.createReminder(job.id, 'followUp', fireAt));
                    }
                });
            }
        }

        if (newReminders.length === 0) return;

        const reminders = this.getReminders();
        const merged = reminders.concat(newReminders);
        this.saveReminders(merged);
        newReminders.forEach(r => this.scheduleTimeout(r));
    }

    rescheduleForJob(job) {
        const reminders = this.getReminders();
        // clear pending timeouts for this job
        reminders.filter(r => r.jobId === job.id && !r.delivered).forEach(r => {
            const t = this.timeoutIdByReminderId.get(r.id);
            if (t) clearTimeout(t);
            this.timeoutIdByReminderId.delete(r.id);
        });
        const remaining = reminders.filter(r => r.jobId !== job.id || r.delivered);
        this.saveReminders(remaining);
        this.scheduleForJob(job);
    }

    createReminder(jobId, type, fireAt) {
        return {
            id: `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
            jobId,
            type,
            fireAt,
            createdAt: Date.now(),
            delivered: false
        };
    }

    scheduleTimeout(reminder) {
        const delay = Math.max(0, reminder.fireAt - Date.now());
        const id = setTimeout(() => this.deliverReminder(reminder), delay);
        this.timeoutIdByReminderId.set(reminder.id, id);
    }

    deliverReminder(reminder) {
        // Lookup job details for message
        const job = (window.jobTracker && window.jobTracker.jobs || []).find(j => j.id === reminder.jobId);
        const title = 'Job Tracker Reminder';
        const body = job ? this.composeBody(reminder, job) : 'You have a pending job reminder';
        SystemNotificationManager.send(title, {
            body,
            tag: `jt-${reminder.type}-${reminder.jobId}`
        });
        // Mark delivered and persist
        const reminders = this.getReminders();
        const idx = reminders.findIndex(r => r.id === reminder.id);
        if (idx !== -1) {
            reminders[idx].delivered = true;
            this.saveReminders(reminders);
        }
        // Save history
        const history = NotificationStorage.loadHistory();
        history.unshift({
            id: `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
            reminderId: reminder.id,
            shownAt: Date.now(),
            outcome: 'delivered',
            title,
            body
        });
        NotificationStorage.saveHistory(history.slice(0, 1000)); // cap history
    }

    composeBody(reminder, job) {
        if (reminder.type === 'interview') {
            return `Interview for ${job.title} at ${job.company} soon.`;
        }
        if (reminder.type === 'followUp') {
            return `Follow up on ${job.title} at ${job.company}.`;
        }
        return `Update for ${job.title} at ${job.company}.`;
    }
}

// Singleton getter
window.getReminderScheduler = function() {
    if (!window.__jtReminderScheduler) {
        window.__jtReminderScheduler = new ReminderScheduler();
    }
    return window.__jtReminderScheduler;
};
