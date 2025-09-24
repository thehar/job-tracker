/**
 * Notifications Settings Integration Tests
 */
class NotificationsSettingsIntegrationTests {
    constructor() {
        this.testResults = [];
        this.passedTests = 0;
        this.totalTests = 0;
    }

    assert(condition, message) {
        this.totalTests++;
        if (condition) { this.passedTests++; this.testResults.push(`✅ ${message}`); }
        else { this.testResults.push(`❌ ${message}`); }
    }

    runAllTests() {
        console.log('🧪 NotificationsSettingsIntegrationTests...');
        try {
            // Ensure DOM elements exist
            const enabled = document.getElementById('notificationsEnabled');
            const interviews = document.getElementById('notifTypeInterviews');
            const saveBtn = document.getElementById('saveNotificationPrefsBtn');
            this.assert(!!enabled && !!interviews && !!saveBtn, 'Settings controls should exist');

            // Toggle and save
            enabled.checked = true;
            interviews.checked = true;
            saveBtn.click();

            // Verify saved
            const prefs = NotificationStorage.loadPreferences();
            this.assert(prefs.enabled === true && prefs.types.interviews === true, 'Preferences should save correctly');
        } catch (e) {
            console.error(e);
        }

        console.log('\n📊 Test Results:');
        this.testResults.forEach(r => console.log(r));
        const passRate = ((this.passedTests / this.totalTests) * 100).toFixed(1);
        console.log(`\n✨ Tests completed: ${this.passedTests}/${this.totalTests} passed (${passRate}%)`);
        return { passed: this.passedTests, total: this.totalTests, passRate, allPassed: this.passedTests === this.totalTests };
    }
}

if (typeof window !== 'undefined') {
    window.NotificationsSettingsIntegrationTests = NotificationsSettingsIntegrationTests;
} else if (typeof module !== 'undefined' && module.exports) {
    module.exports = NotificationsSettingsIntegrationTests;
}

