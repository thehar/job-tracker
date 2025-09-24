/**
 * Reminder Scheduler Tests
 */
class ReminderSchedulerTests {
    constructor() {
        this.testResults = [];
        this.passedTests = 0;
        this.totalTests = 0;
        this._origStorage = null;
        this._origJobs = null;
    }

    assert(condition, message) {
        this.totalTests++;
        if (condition) { this.passedTests++; this.testResults.push(`✅ ${message}`); }
        else { this.testResults.push(`❌ ${message}`); }
    }

    setup() {
        // Mock storage helpers
        this._origStorage = {
            loadPreferences: NotificationStorage.loadPreferences,
            savePreferences: NotificationStorage.savePreferences,
            loadReminders: NotificationStorage.loadReminders,
            saveReminders: NotificationStorage.saveReminders,
            loadHistory: NotificationStorage.loadHistory,
            saveHistory: NotificationStorage.saveHistory
        };
        NotificationStorage.loadPreferences = () => ({ enabled: true, types: { interviews: true, followUps: true }, timing: { interviews: [30], followUps: [60] } });
        let reminders = [];
        let history = [];
        NotificationStorage.loadReminders = () => reminders;
        NotificationStorage.saveReminders = (arr) => { reminders = arr; };
        NotificationStorage.loadHistory = () => history;
        NotificationStorage.saveHistory = (arr) => { history = arr; };

        // Mock jobs
        this._origJobs = window.jobTracker;
        window.jobTracker = { jobs: [] };

        // Mock SystemNotificationManager
        this._origSend = SystemNotificationManager.send;
        SystemNotificationManager.send = async () => true;
    }

    cleanup() {
        // Restore storage
        NotificationStorage.loadPreferences = this._origStorage.loadPreferences;
        NotificationStorage.savePreferences = this._origStorage.savePreferences;
        NotificationStorage.loadReminders = this._origStorage.loadReminders;
        NotificationStorage.saveReminders = this._origStorage.saveReminders;
        NotificationStorage.loadHistory = this._origStorage.loadHistory;
        NotificationStorage.saveHistory = this._origStorage.saveHistory;
        // Restore jobs
        window.jobTracker = this._origJobs;
        SystemNotificationManager.send = this._origSend;
    }

    testScheduleForFutureInterview() {
        const scheduler = new ReminderScheduler();
        const in45Min = new Date(Date.now() + 45 * 60000).toISOString();
        const job = { id: 'j1', title: 'SWE', company: 'ACME', dateApplied: new Date().toISOString().split('T')[0], interviewDate: in45Min };
        scheduler.scheduleForJob(job);
        const reminders = NotificationStorage.loadReminders();
        this.assert(reminders.some(r => r.jobId === 'j1' && r.type === 'interview'), 'Should schedule interview reminder');
    }

    testCatchUpDelivery() {
        const scheduler = new ReminderScheduler();
        const past5Min = Date.now() - 5 * 60000;
        const r = scheduler.createReminder('j2', 'followUp', past5Min);
        NotificationStorage.saveReminders([r]);
        scheduler.rehydrate();
        const updated = NotificationStorage.loadReminders();
        this.assert(updated[0].delivered === true, 'Should deliver missed reminder on rehydrate');
    }

    runAllTests() {
        console.log('🧪 ReminderSchedulerTests...');
        this.setup();
        try {
            this.testScheduleForFutureInterview();
            this.testCatchUpDelivery();
        } finally {
            this.cleanup();
        }

        console.log('\n📊 Test Results:');
        this.testResults.forEach(r => console.log(r));
        const passRate = ((this.passedTests / this.totalTests) * 100).toFixed(1);
        console.log(`\n✨ Tests completed: ${this.passedTests}/${this.totalTests} passed (${passRate}%)`);
        return { passed: this.passedTests, total: this.totalTests, passRate, allPassed: this.passedTests === this.totalTests };
    }
}

if (typeof window !== 'undefined') {
    window.ReminderSchedulerTests = ReminderSchedulerTests;
} else if (typeof module !== 'undefined' && module.exports) {
    module.exports = ReminderSchedulerTests;
}

