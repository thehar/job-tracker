/**
 * Unit Tests for InstallationStorage Class
 * Tests localStorage operations and data persistence for PWA installation preferences
 */

// Mock localStorage for testing
class MockLocalStorage {
    constructor() {
        this.store = {};
    }

    getItem(key) {
        return this.store[key] || null;
    }

    setItem(key, value) {
        this.store[key] = String(value);
    }

    removeItem(key) {
        delete this.store[key];
    }

    clear() {
        this.store = {};
    }
}

// Test suite for InstallationStorage
class InstallationStorageTests {
    constructor() {
        this.originalLocalStorage = window.localStorage;
        this.mockStorage = new MockLocalStorage();
        this.testResults = [];
        this.passedTests = 0;
        this.totalTests = 0;
    }

    // Setup test environment
    setup() {
        // Replace localStorage with mock
        Object.defineProperty(window, 'localStorage', {
            value: this.mockStorage,
            writable: true
        });

        // Mock DataManager for job count testing
        window.DataManager = {
            loadJobs: () => [
                { id: 1, title: 'Test Job 1' },
                { id: 2, title: 'Test Job 2' },
                { id: 3, title: 'Test Job 3' }
            ]
        };
    }

    // Cleanup test environment
    cleanup() {
        Object.defineProperty(window, 'localStorage', {
            value: this.originalLocalStorage,
            writable: true
        });
        delete window.DataManager;
    }

    // Test helper methods
    assert(condition, message) {
        this.totalTests++;
        if (condition) {
            this.passedTests++;
            this.testResults.push(`✅ ${message}`);
        } else {
            this.testResults.push(`❌ ${message}`);
        }
    }

    assertEqual(actual, expected, message) {
        this.assert(actual === expected, `${message} (expected: ${expected}, actual: ${actual})`);
    }

    assertNotNull(value, message) {
        this.assert(value !== null && value !== undefined, message);
    }

    // Test: Constructor and initialization
    testConstructorAndInitialization() {
        console.log('Testing constructor and initialization...');
        
        const storage = new InstallationStorage();
        
        this.assertNotNull(storage.storageKeys, 'Storage keys should be defined');
        this.assertEqual(typeof storage.storageKeys, 'object', 'Storage keys should be an object');
        
        // Check that default preferences are initialized
        const prefs = storage.getUserPreferences();
        this.assertNotNull(prefs, 'Default preferences should be initialized');
        this.assertEqual(prefs.dontAskAgain, false, 'Default dontAskAgain should be false');
        this.assertEqual(prefs.manualTriggerAvailable, true, 'Default manualTriggerAvailable should be true');
    }

    // Test: Installation status operations
    testInstallationStatus() {
        console.log('Testing installation status operations...');
        
        const storage = new InstallationStorage();
        
        // Test default status
        this.assertEqual(storage.getInstallationStatus(), 'not_prompted', 'Default status should be not_prompted');
        
        // Test setting valid statuses
        const validStatuses = ['not_prompted', 'prompted', 'dismissed', 'dont_ask', 'installed', 'installing'];
        validStatuses.forEach(status => {
            storage.setInstallationStatus(status);
            this.assertEqual(storage.getInstallationStatus(), status, `Status should be set to ${status}`);
        });
    }

    // Test: Prompt count operations
    testPromptCount() {
        console.log('Testing prompt count operations...');
        
        const storage = new InstallationStorage();
        
        // Test default count
        this.assertEqual(storage.getPromptCount(), 0, 'Default prompt count should be 0');
        
        // Test incrementing
        const newCount1 = storage.incrementPromptCount();
        this.assertEqual(newCount1, 1, 'First increment should return 1');
        this.assertEqual(storage.getPromptCount(), 1, 'Prompt count should be 1 after increment');
        
        const newCount2 = storage.incrementPromptCount();
        this.assertEqual(newCount2, 2, 'Second increment should return 2');
        this.assertEqual(storage.getPromptCount(), 2, 'Prompt count should be 2 after second increment');
    }

    // Test: Dismissal count operations
    testDismissalCount() {
        console.log('Testing dismissal count operations...');
        
        const storage = new InstallationStorage();
        
        // Test default count
        this.assertEqual(storage.getDismissalCount(), 0, 'Default dismissal count should be 0');
        
        // Test incrementing
        const newCount1 = storage.incrementDismissalCount();
        this.assertEqual(newCount1, 1, 'First increment should return 1');
        this.assertEqual(storage.getDismissalCount(), 1, 'Dismissal count should be 1 after increment');
        
        const newCount2 = storage.incrementDismissalCount();
        this.assertEqual(newCount2, 2, 'Second increment should return 2');
        this.assertEqual(storage.getDismissalCount(), 2, 'Dismissal count should be 2 after second increment');
    }

    // Test: Session tracking
    testSessionTracking() {
        console.log('Testing session tracking...');
        
        const storage = new InstallationStorage();
        
        // Test default session count
        this.assertEqual(storage.getSessionCount(), 0, 'Default session count should be 0');
        
        // Test setting session count
        storage.setSessionCount(5);
        this.assertEqual(storage.getSessionCount(), 5, 'Session count should be set to 5');
        
        // Test incrementing session count
        const newCount = storage.incrementSessionCount();
        this.assertEqual(newCount, 6, 'Incremented session count should be 6');
        this.assertEqual(storage.getSessionCount(), 6, 'Session count should be 6 after increment');
        
        // Test new session detection
        this.assert(storage.isNewSession(), 'Should detect new session when no last activity');
        
        // Set recent activity
        storage.setLastActivity();
        this.assert(!storage.isNewSession(), 'Should not detect new session with recent activity');
    }

    // Test: Date operations
    testDateOperations() {
        console.log('Testing date operations...');
        
        const storage = new InstallationStorage();
        
        // Test first visit date
        this.assertEqual(storage.getFirstVisitDate(), null, 'Default first visit date should be null');
        
        const firstVisit = storage.setFirstVisitDate();
        this.assertNotNull(firstVisit, 'First visit date should be set');
        this.assertEqual(storage.getFirstVisitDate(), firstVisit, 'First visit date should match set value');
        
        // Test that setting again doesn't change the date
        const secondCall = storage.setFirstVisitDate();
        this.assertEqual(secondCall, firstVisit, 'Second call should return same first visit date');
        
        // Test last prompt date
        this.assertEqual(storage.getLastPromptDate(), null, 'Default last prompt date should be null');
        
        storage.setLastPromptDate();
        this.assertNotNull(storage.getLastPromptDate(), 'Last prompt date should be set');
        
        // Test install date
        this.assertEqual(storage.getInstallDate(), null, 'Default install date should be null');
        
        storage.setInstallDate();
        this.assertNotNull(storage.getInstallDate(), 'Install date should be set');
    }

    // Test: User preferences
    testUserPreferences() {
        console.log('Testing user preferences...');
        
        const storage = new InstallationStorage();
        
        // Test default preferences
        const defaultPrefs = storage.getUserPreferences();
        this.assertNotNull(defaultPrefs, 'Default preferences should exist');
        this.assertEqual(defaultPrefs.dontAskAgain, false, 'Default dontAskAgain should be false');
        
        // Test setting preferences
        const newPrefs = { dontAskAgain: true, manualTriggerAvailable: false };
        storage.setUserPreferences(newPrefs);
        
        const retrievedPrefs = storage.getUserPreferences();
        this.assertEqual(retrievedPrefs.dontAskAgain, true, 'dontAskAgain should be updated');
        this.assertEqual(retrievedPrefs.manualTriggerAvailable, false, 'manualTriggerAvailable should be updated');
        
        // Test updating individual preference
        storage.updateUserPreference('dontAskAgain', false);
        const updatedPrefs = storage.getUserPreferences();
        this.assertEqual(updatedPrefs.dontAskAgain, false, 'Individual preference should be updated');
    }

    // Test: Job application count integration
    testJobApplicationCount() {
        console.log('Testing job application count integration...');
        
        const storage = new InstallationStorage();
        
        // Test with mocked DataManager
        const jobCount = storage.getJobApplicationCount();
        this.assertEqual(jobCount, 3, 'Should return correct job count from DataManager');
        
        // Test fallback to localStorage
        delete window.DataManager;
        this.mockStorage.setItem('jobTracker_jobs', JSON.stringify([
            { id: 1, title: 'Job 1' },
            { id: 2, title: 'Job 2' }
        ]));
        
        const fallbackCount = storage.getJobApplicationCount();
        this.assertEqual(fallbackCount, 2, 'Should return correct job count from localStorage fallback');
        
        // Restore DataManager
        window.DataManager = {
            loadJobs: () => [
                { id: 1, title: 'Test Job 1' },
                { id: 2, title: 'Test Job 2' },
                { id: 3, title: 'Test Job 3' }
            ]
        };
    }

    // Test: Days since last prompt calculation
    testDaysSinceLastPrompt() {
        console.log('Testing days since last prompt calculation...');
        
        const storage = new InstallationStorage();
        
        // Test with no last prompt
        this.assertEqual(storage.getDaysSinceLastPrompt(), 0, 'Should return 0 when no last prompt');
        
        // Test with recent prompt (today)
        storage.setLastPromptDate();
        this.assertEqual(storage.getDaysSinceLastPrompt(), 0, 'Should return 0 for today\'s prompt');
        
        // Test with old prompt (manually set)
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        this.mockStorage.setItem(storage.storageKeys.lastPromptDate, threeDaysAgo.toISOString());
        
        const daysSince = storage.getDaysSinceLastPrompt();
        this.assertEqual(daysSince, 3, 'Should return 3 for prompt from 3 days ago');
        
        // Test prompt delay logic
        this.assert(storage.shouldDelayPrompt(7), 'Should delay prompt when less than 7 days');
        this.assert(!storage.shouldDelayPrompt(2), 'Should not delay prompt when more than 2 days');
    }

    // Test: Complete installation data
    testInstallationData() {
        console.log('Testing complete installation data...');
        
        const storage = new InstallationStorage();
        
        // Set some test data
        storage.setInstallationStatus('prompted');
        storage.incrementPromptCount();
        storage.incrementDismissalCount();
        storage.setFirstVisitDate();
        storage.incrementSessionCount();
        
        const data = storage.getInstallationData();
        
        this.assertNotNull(data, 'Installation data should be returned');
        this.assertEqual(data.installationStatus, 'prompted', 'Status should match');
        this.assertEqual(data.promptCount, 1, 'Prompt count should match');
        this.assertEqual(data.dismissalCount, 1, 'Dismissal count should match');
        this.assertEqual(data.sessionCount, 1, 'Session count should match');
        this.assertEqual(data.jobApplicationCount, 3, 'Job count should match');
        this.assertNotNull(data.userPreferences, 'User preferences should be included');
    }

    // Test: Data export functionality
    testDataExport() {
        console.log('Testing data export functionality...');
        
        const storage = new InstallationStorage();
        
        // Set some test data
        storage.setInstallationStatus('dismissed');
        storage.incrementPromptCount();
        
        const exportData = storage.exportInstallationData();
        
        this.assertNotNull(exportData, 'Export data should be returned');
        this.assertNotNull(exportData.exportDate, 'Export date should be included');
        this.assertEqual(exportData.dataVersion, '1.0', 'Data version should be included');
        this.assertEqual(exportData.installationStatus, 'dismissed', 'Status should be included in export');
    }

    // Test: Data reset functionality
    testDataReset() {
        console.log('Testing data reset functionality...');
        
        const storage = new InstallationStorage();
        
        // Set some test data
        storage.setInstallationStatus('dismissed');
        storage.incrementPromptCount();
        storage.incrementDismissalCount();
        storage.setFirstVisitDate();
        const firstVisit = storage.getFirstVisitDate();
        
        // Reset data (keeping first visit)
        storage.resetInstallationData(true);
        
        this.assertEqual(storage.getInstallationStatus(), 'not_prompted', 'Status should be reset');
        this.assertEqual(storage.getPromptCount(), 0, 'Prompt count should be reset');
        this.assertEqual(storage.getDismissalCount(), 0, 'Dismissal count should be reset');
        this.assertEqual(storage.getFirstVisitDate(), firstVisit, 'First visit should be preserved');
        
        // Reset data (not keeping first visit)
        storage.resetInstallationData(false);
        this.assertEqual(storage.getFirstVisitDate(), null, 'First visit should be reset');
    }

    // Test: Storage validation
    testStorageValidation() {
        console.log('Testing storage validation...');
        
        const storage = new InstallationStorage();
        
        // Test with valid storage
        this.assert(storage.validateStorage(), 'Storage validation should pass with mock localStorage');
        
        // Test with invalid numeric data
        this.mockStorage.setItem(storage.storageKeys.sessionCount, 'invalid');
        this.mockStorage.setItem(storage.storageKeys.promptCount, 'also_invalid');
        
        // Validation should still pass but reset invalid data
        this.assert(storage.validateStorage(), 'Storage validation should handle invalid data');
        this.assertEqual(storage.getSessionCount(), 0, 'Invalid session count should be reset');
        this.assertEqual(storage.getPromptCount(), 0, 'Invalid prompt count should be reset');
    }

    // Test: Error handling
    testErrorHandling() {
        console.log('Testing error handling...');
        
        const storage = new InstallationStorage();
        
        // Test with broken localStorage (simulate quota exceeded)
        const originalSetItem = this.mockStorage.setItem;
        this.mockStorage.setItem = () => {
            throw new Error('QuotaExceededError');
        };
        
        // Methods should not throw errors
        try {
            storage.setInstallationStatus('test');
            storage.incrementPromptCount();
            storage.setUserPreferences({ test: true });
            this.assert(true, 'Methods should handle localStorage errors gracefully');
        } catch (error) {
            this.assert(false, 'Methods should not throw errors when localStorage fails');
        }
        
        // Restore localStorage
        this.mockStorage.setItem = originalSetItem;
    }

    // Run all tests
    runAllTests() {
        console.log('🧪 Starting InstallationStorage Tests...\n');
        
        this.setup();
        
        try {
            this.testConstructorAndInitialization();
            this.testInstallationStatus();
            this.testPromptCount();
            this.testDismissalCount();
            this.testSessionTracking();
            this.testDateOperations();
            this.testUserPreferences();
            this.testJobApplicationCount();
            this.testDaysSinceLastPrompt();
            this.testInstallationData();
            this.testDataExport();
            this.testDataReset();
            this.testStorageValidation();
            this.testErrorHandling();
        } finally {
            this.cleanup();
        }
        
        // Print results
        console.log('\n📊 Test Results:');
        this.testResults.forEach(result => console.log(result));
        
        const passRate = ((this.passedTests / this.totalTests) * 100).toFixed(1);
        console.log(`\n✨ Tests completed: ${this.passedTests}/${this.totalTests} passed (${passRate}%)`);
        
        if (this.passedTests === this.totalTests) {
            console.log('🎉 All tests passed!');
        } else {
            console.log('❌ Some tests failed. Please review the implementation.');
        }
        
        return {
            passed: this.passedTests,
            total: this.totalTests,
            passRate: passRate,
            allPassed: this.passedTests === this.totalTests
        };
    }
}

// Export for use in browser or Node.js
if (typeof window !== 'undefined') {
    window.InstallationStorageTests = InstallationStorageTests;
} else if (typeof module !== 'undefined' && module.exports) {
    module.exports = InstallationStorageTests;
}