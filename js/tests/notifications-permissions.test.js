/**
 * Notifications Permission Tests
 */
class NotificationsPermissionTests {
    constructor() {
        this.testResults = [];
        this.passedTests = 0;
        this.totalTests = 0;
        this._origNotification = null;
    }

    assert(condition, message) {
        this.totalTests++;
        if (condition) { this.passedTests++; this.testResults.push(`✅ ${message}`); }
        else { this.testResults.push(`❌ ${message}`); }
    }

    assertEqual(actual, expected, message) {
        this.assert(actual === expected, `${message} (expected: ${expected}, actual: ${actual})`);
    }

    setup() {
        // Mock Notification API
        this._origNotification = window.Notification;
        window.Notification = {
            permission: 'default',
            requestPermission: () => Promise.resolve('granted')
        };

        // Ensure SystemNotificationManager exists
        if (typeof SystemNotificationManager === 'undefined') {
            throw new Error('SystemNotificationManager not loaded');
        }
    }

    cleanup() {
        if (this._origNotification) window.Notification = this._origNotification;
    }

    testRequestPermissionResolves() {
        return SystemNotificationManager.requestPermission().then(result => {
            this.assertEqual(result, 'granted', 'requestPermission should resolve to granted');
        });
    }

    testSendWithoutSWFailsGracefully() {
        // Mock absence of SW
        const origSW = navigator.serviceWorker;
        navigator.serviceWorker = {};
        return SystemNotificationManager.send('Test', { body: 'x' }).then(success => {
            this.assertEqual(success, false, 'send should return false without SW');
            navigator.serviceWorker = origSW;
        });
    }

    runAllTests() {
        console.log('🧪 NotificationsPermissionTests...');
        this.setup();
        const done = () => {
            // Print results
            console.log('\n📊 Test Results:');
            this.testResults.forEach(r => console.log(r));
            const passRate = ((this.passedTests / this.totalTests) * 100).toFixed(1);
            console.log(`\n✨ Tests completed: ${this.passedTests}/${this.totalTests} passed (${passRate}%)`);
            this.cleanup();
            return { passed: this.passedTests, total: this.totalTests, passRate, allPassed: this.passedTests === this.totalTests };
        };

        // Chain async tests
        return this.testRequestPermissionResolves()
            .then(() => this.testSendWithoutSWFailsGracefully())
            .then(done)
            .catch(err => { console.error(err); return done(); });
    }
}

if (typeof window !== 'undefined') {
    window.NotificationsPermissionTests = NotificationsPermissionTests;
} else if (typeof module !== 'undefined' && module.exports) {
    module.exports = NotificationsPermissionTests;
}

