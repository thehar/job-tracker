/**
 * Unit Tests for PWAInstallManager Class
 * Tests eligibility logic, state management, and core functionality
 */

// Mock dependencies for testing
class MockInstallationStorage {
    constructor() {
        this.data = {
            installationStatus: 'not_prompted',
            promptCount: 0,
            sessionCount: 1,
            dismissalCount: 0,
            userPreferences: { dontAskAgain: false, manualTriggerAvailable: true }
        };
    }

    getInstallationStatus() { return this.data.installationStatus; }
    setInstallationStatus(status) { this.data.installationStatus = status; }
    getPromptCount() { return this.data.promptCount; }
    incrementPromptCount() { return ++this.data.promptCount; }
    getSessionCount() { return this.data.sessionCount; }
    trackSession() { return this.data.sessionCount; }
    getJobApplicationCount() { return 3; }
    getDismissalCount() { return this.data.dismissalCount; }
    incrementDismissalCount() { return ++this.data.dismissalCount; }
    getUserPreferences() { return this.data.userPreferences; }
    updateUserPreference(key, value) { this.data.userPreferences[key] = value; }
    shouldDelayPrompt() { return false; }
    getInstallationData() { return this.data; }
    validateStorage() { return true; }
}

class MockInstallAnalytics {
    constructor() {
        this.events = [];
    }

    trackPromptShown(context) { this.events.push({ type: 'prompt_shown', context }); }
    trackInstallClick(context) { this.events.push({ type: 'install_clicked', context }); }
    trackDismiss(context) { this.events.push({ type: 'dismissed', context }); }
    trackDontAskAgain(context) { this.events.push({ type: 'dont_ask_again', context }); }
    trackInstallSuccess(context) { this.events.push({ type: 'install_success', context }); }
    trackInstructionsShown(type, context) { this.events.push({ type: 'instructions_shown', instructionType: type, context }); }
    trackError(error, context) { this.events.push({ type: 'error', error: error.message, context }); }
    getInstallMetrics() { return { summary: {}, events: this.events }; }
}

class MockCrossPlatformDetector {
    constructor() {
        this.platform = { name: 'windows', isMobile: false, isDesktop: true };
        this.browser = { name: 'chrome', version: '91.0.4472.124' };
    }

    supportsInstallPrompt() { return true; }
    supportsStandaloneMode() { return true; }
    isStandalone() { return false; }
    getPWASupport() { return { isPartiallySupported: true, isFullySupported: true }; }
    getInstallationInstructions() { 
        return { platform: 'native', supported: true, message: 'Native support available' }; 
    }
}

class MockInstallPromptUI {
    constructor(manager) {
        this.manager = manager;
        this.isVisible = false;
        this.element = null;
    }

    create() { 
        this.element = document.createElement('div');
        return this.element;
    }
    show() { this.isVisible = true; }
    hide() { this.isVisible = false; }
    destroy() { this.element = null; this.isVisible = false; }
}

// Test suite for PWAInstallManager
class PWAInstallManagerTests {
    constructor() {
        this.testResults = [];
        this.passedTests = 0;
        this.totalTests = 0;
        this.originalWindow = {};
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

    assertTrue(value, message) {
        this.assert(value === true, message);
    }

    assertFalse(value, message) {
        this.assert(value === false, message);
    }

    // Setup test environment
    setup() {
        // Mock window properties
        this.originalWindow.onbeforeinstallprompt = window.onbeforeinstallprompt;
        this.originalWindow.matchMedia = window.matchMedia;
        
        window.onbeforeinstallprompt = {};
        window.matchMedia = (query) => ({
            matches: query === '(display-mode: standalone)' ? false : true,
            addEventListener: () => {}
        });

        // Mock global classes
        window.InstallationStorage = MockInstallationStorage;
        window.InstallAnalytics = MockInstallAnalytics;
        window.CrossPlatformDetector = MockCrossPlatformDetector;
        window.InstallPromptUI = MockInstallPromptUI;
    }

    // Cleanup test environment
    cleanup() {
        // Restore window properties
        Object.keys(this.originalWindow).forEach(key => {
            window[key] = this.originalWindow[key];
        });

        // Clean up global mocks
        delete window.InstallationStorage;
        delete window.InstallAnalytics;
        delete window.CrossPlatformDetector;
        delete window.InstallPromptUI;
    }

    // Test: Constructor and initialization
    testConstructorAndInitialization() {
        console.log('Testing constructor and initialization...');
        
        const manager = new PWAInstallManager();
        
        this.assertNotNull(manager.storage, 'Storage should be initialized');
        this.assertNotNull(manager.analytics, 'Analytics should be initialized');
        this.assertNotNull(manager.detector, 'Detector should be initialized');
        this.assertEqual(manager.deferredPrompt, null, 'Deferred prompt should be null initially');
        this.assertEqual(manager.isInstalled, false, 'Should not be installed initially');
        this.assertEqual(manager.eligibilityThresholds.minSessions, 3, 'Default min sessions should be 3');
        this.assertEqual(manager.eligibilityThresholds.minJobApplications, 2, 'Default min job applications should be 2');
    }

    // Test: Custom options in constructor
    testConstructorWithOptions() {
        console.log('Testing constructor with custom options...');
        
        const options = {
            minSessions: 5,
            minJobApplications: 4
        };
        
        const manager = new PWAInstallManager(options);
        
        this.assertEqual(manager.eligibilityThresholds.minSessions, 5, 'Custom min sessions should be set');
        this.assertEqual(manager.eligibilityThresholds.minJobApplications, 4, 'Custom min job applications should be set');
    }

    // Test: Eligibility checking logic
    testEligibilityChecking() {
        console.log('Testing eligibility checking logic...');
        
        const manager = new PWAInstallManager();
        
        // Test with insufficient sessions and jobs
        manager.storage.data.sessionCount = 1;
        manager.storage.getJobApplicationCount = () => 1;
        this.assertFalse(manager.checkEligibility(), 'Should not be eligible with insufficient sessions and jobs');
        
        // Test with sufficient sessions but insufficient jobs
        manager.storage.data.sessionCount = 5;
        manager.storage.getJobApplicationCount = () => 1;
        this.assertFalse(manager.checkEligibility(), 'Should not be eligible with insufficient jobs');
        
        // Test with insufficient sessions but sufficient jobs
        manager.storage.data.sessionCount = 1;
        manager.storage.getJobApplicationCount = () => 5;
        this.assertFalse(manager.checkEligibility(), 'Should not be eligible with insufficient sessions');
        
        // Test with sufficient sessions and jobs
        manager.storage.data.sessionCount = 5;
        manager.storage.getJobApplicationCount = () => 5;
        this.assertTrue(manager.checkEligibility(), 'Should be eligible with sufficient sessions and jobs');
        
        // Test with "don't ask again" preference
        manager.storage.data.userPreferences.dontAskAgain = true;
        this.assertFalse(manager.checkEligibility(), 'Should not be eligible when user chose "don\'t ask again"');
        
        // Test when already installed
        manager.storage.data.userPreferences.dontAskAgain = false;
        manager.storage.data.installationStatus = 'installed';
        this.assertFalse(manager.checkEligibility(), 'Should not be eligible when already installed');
        
        // Test with prompt delay
        manager.storage.data.installationStatus = 'dismissed';
        manager.storage.shouldDelayPrompt = () => true;
        this.assertFalse(manager.checkEligibility(), 'Should not be eligible when prompt should be delayed');
    }

    // Test: Installation status checking
    testInstallationStatusChecking() {
        console.log('Testing installation status checking...');
        
        const manager = new PWAInstallManager();
        
        // Mock standalone mode detection
        manager.detector.isStandalone = () => false;
        this.assertFalse(manager.checkIfInstalled(), 'Should not be installed in browser mode');
        
        manager.detector.isStandalone = () => true;
        this.assertTrue(manager.checkIfInstalled(), 'Should be installed in standalone mode');
        
        // Test with installation status in storage
        manager.detector.isStandalone = () => false;
        manager.storage.data.installationStatus = 'installed';
        this.assertTrue(manager.checkIfInstalled(), 'Should be installed based on storage status');
    }

    // Test: Session tracking
    testSessionTracking() {
        console.log('Testing session tracking...');
        
        const manager = new PWAInstallManager();
        const initialSessionCount = manager.storage.getSessionCount();
        
        manager.trackSession();
        
        // Session tracking should be called on storage
        this.assertEqual(manager.storage.getSessionCount(), initialSessionCount, 'Session count should be tracked');
    }

    // Test: Event listener setup
    testEventListenerSetup() {
        console.log('Testing event listener setup...');
        
        const manager = new PWAInstallManager();
        let beforeInstallPromptCalled = false;
        let appInstalledCalled = false;
        
        // Mock event listener addition
        const originalAddEventListener = window.addEventListener;
        window.addEventListener = (event, handler) => {
            if (event === 'beforeinstallprompt') {
                beforeInstallPromptCalled = true;
            } else if (event === 'appinstalled') {
                appInstalledCalled = true;
            }
        };
        
        manager.setupEventListeners();
        
        this.assertTrue(beforeInstallPromptCalled, 'Should set up beforeinstallprompt event listener');
        this.assertTrue(appInstalledCalled, 'Should set up appinstalled event listener');
        
        // Restore original addEventListener
        window.addEventListener = originalAddEventListener;
    }

    // Test: Before install prompt event handling
    testBeforeInstallPromptHandling() {
        console.log('Testing before install prompt event handling...');
        
        const manager = new PWAInstallManager();
        
        // Mock event
        const mockEvent = {
            preventDefault: () => {},
            prompt: () => Promise.resolve({ outcome: 'accepted' })
        };
        
        manager.onBeforeInstallPrompt(mockEvent);
        
        this.assertEqual(manager.deferredPrompt, mockEvent, 'Should store deferred prompt');
    }

    // Test: App installed event handling
    testAppInstalledHandling() {
        console.log('Testing app installed event handling...');
        
        const manager = new PWAInstallManager();
        
        manager.onAppInstalled();
        
        this.assertEqual(manager.storage.getInstallationStatus(), 'installed', 'Should update installation status');
        this.assertTrue(manager.isInstalled, 'Should set installed flag');
        this.assertEqual(manager.deferredPrompt, null, 'Should clear deferred prompt');
        
        // Check analytics tracking
        const installSuccessEvents = manager.analytics.events.filter(e => e.type === 'install_success');
        this.assertEqual(installSuccessEvents.length, 1, 'Should track install success event');
    }

    // Test: Install button click handling
    testInstallClickHandling() {
        console.log('Testing install button click handling...');
        
        const manager = new PWAInstallManager();
        
        // Test without deferred prompt
        manager.handleInstallClick();
        
        const installClickEvents = manager.analytics.events.filter(e => e.type === 'install_clicked');
        this.assertEqual(installClickEvents.length, 1, 'Should track install click even without deferred prompt');
        
        // Test with deferred prompt
        manager.deferredPrompt = {
            prompt: () => Promise.resolve(),
            userChoice: Promise.resolve({ outcome: 'accepted' })
        };
        
        manager.handleInstallClick();
        
        const updatedInstallClickEvents = manager.analytics.events.filter(e => e.type === 'install_clicked');
        this.assertEqual(updatedInstallClickEvents.length, 2, 'Should track install click with deferred prompt');
    }

    // Test: Dismiss handling
    testDismissHandling() {
        console.log('Testing dismiss handling...');
        
        const manager = new PWAInstallManager();
        const initialDismissalCount = manager.storage.getDismissalCount();
        
        manager.handleDismiss();
        
        this.assertEqual(manager.storage.getDismissalCount(), initialDismissalCount + 1, 'Should increment dismissal count');
        this.assertEqual(manager.storage.getInstallationStatus(), 'dismissed', 'Should update installation status');
        
        const dismissEvents = manager.analytics.events.filter(e => e.type === 'dismissed');
        this.assertEqual(dismissEvents.length, 1, 'Should track dismiss event');
    }

    // Test: Don't ask again handling
    testDontAskAgainHandling() {
        console.log('Testing don\'t ask again handling...');
        
        const manager = new PWAInstallManager();
        
        manager.handleDontAskAgain();
        
        this.assertEqual(manager.storage.getInstallationStatus(), 'dont_ask', 'Should update installation status');
        this.assertTrue(manager.storage.getUserPreferences().dontAskAgain, 'Should set don\'t ask again preference');
        
        const dontAskEvents = manager.analytics.events.filter(e => e.type === 'dont_ask_again');
        this.assertEqual(dontAskEvents.length, 1, 'Should track don\'t ask again event');
    }

    // Test: Instructions acknowledged handling
    testInstructionsAcknowledgedHandling() {
        console.log('Testing instructions acknowledged handling...');
        
        const manager = new PWAInstallManager();
        
        manager.handleInstructionsAcknowledged();
        
        this.assertEqual(manager.storage.getInstallationStatus(), 'prompted', 'Should update installation status to prompted');
        
        const instructionEvents = manager.analytics.events.filter(e => e.type === 'instructions_shown');
        this.assertEqual(instructionEvents.length, 1, 'Should track instructions shown event');
    }

    // Test: Show install prompt
    testShowInstallPrompt() {
        console.log('Testing show install prompt...');
        
        const manager = new PWAInstallManager();
        
        manager.showInstallPrompt();
        
        this.assertNotNull(manager.installPromptUI, 'Should create install prompt UI');
        this.assertTrue(manager.installPromptUI.isVisible, 'Should show install prompt UI');
        this.assertEqual(manager.storage.getInstallationStatus(), 'prompted', 'Should update installation status');
        
        const promptEvents = manager.analytics.events.filter(e => e.type === 'prompt_shown');
        this.assertEqual(promptEvents.length, 1, 'Should track prompt shown event');
    }

    // Test: Hide install prompt
    testHideInstallPrompt() {
        console.log('Testing hide install prompt...');
        
        const manager = new PWAInstallManager();
        
        // First show the prompt
        manager.showInstallPrompt();
        this.assertTrue(manager.installPromptUI.isVisible, 'Prompt should be visible');
        
        // Then hide it
        manager.hideInstallPrompt();
        this.assertFalse(manager.installPromptUI.isVisible, 'Prompt should be hidden');
    }

    // Test: Manual installation trigger
    testManualInstallationTrigger() {
        console.log('Testing manual installation trigger...');
        
        const manager = new PWAInstallManager();
        
        // Test when eligible
        manager.storage.data.sessionCount = 5;
        manager.storage.getJobApplicationCount = () => 5;
        
        const result = manager.triggerManualInstallation();
        
        this.assertTrue(result, 'Should return true for successful manual trigger');
        this.assertNotNull(manager.installPromptUI, 'Should create install prompt UI');
        
        // Test when not eligible
        manager.storage.data.userPreferences.dontAskAgain = true;
        
        const result2 = manager.triggerManualInstallation();
        
        this.assertFalse(result2, 'Should return false when not eligible');
    }

    // Test: Installation status update
    testInstallationStatusUpdate() {
        console.log('Testing installation status update...');
        
        const manager = new PWAInstallManager();
        
        manager.updateInstallationStatus('installed');
        
        this.assertEqual(manager.storage.getInstallationStatus(), 'installed', 'Should update storage status');
        this.assertTrue(manager.isInstalled, 'Should update manager installed flag');
    }

    // Test: Error handling
    testErrorHandling() {
        console.log('Testing error handling...');
        
        const manager = new PWAInstallManager();
        
        // Test with broken storage
        manager.storage.validateStorage = () => { throw new Error('Storage error'); };
        
        // Should not throw error
        try {
            manager.checkEligibility();
            this.assert(true, 'Should handle storage errors gracefully');
        } catch (error) {
            this.assert(false, 'Should not throw errors when storage fails');
        }
        
        // Check error tracking
        const errorEvents = manager.analytics.events.filter(e => e.type === 'error');
        this.assertTrue(errorEvents.length > 0, 'Should track errors in analytics');
    }

    // Test: Cleanup functionality
    testCleanup() {
        console.log('Testing cleanup functionality...');
        
        const manager = new PWAInstallManager();
        
        // Create some state
        manager.showInstallPrompt();
        manager.deferredPrompt = { test: 'prompt' };
        
        manager.cleanup();
        
        this.assertEqual(manager.deferredPrompt, null, 'Should clear deferred prompt');
        this.assertEqual(manager.installPromptUI, null, 'Should clear install prompt UI');
    }

    // Test: Fallback mode handling
    testFallbackMode() {
        console.log('Testing fallback mode handling...');
        
        // Mock localStorage failure
        const originalLocalStorage = window.localStorage;
        delete window.localStorage;
        
        const manager = new PWAInstallManager();
        
        this.assertTrue(manager.fallbackMode, 'Should enable fallback mode when localStorage unavailable');
        this.assertNotNull(manager.storage, 'Should create fallback storage');
        
        // Restore localStorage
        window.localStorage = originalLocalStorage;
    }

    // Run all tests
    runAllTests() {
        console.log('🧪 Starting PWAInstallManager Tests...\n');
        
        this.setup();
        
        try {
            this.testConstructorAndInitialization();
            this.testConstructorWithOptions();
            this.testEligibilityChecking();
            this.testInstallationStatusChecking();
            this.testSessionTracking();
            this.testEventListenerSetup();
            this.testBeforeInstallPromptHandling();
            this.testAppInstalledHandling();
            this.testInstallClickHandling();
            this.testDismissHandling();
            this.testDontAskAgainHandling();
            this.testInstructionsAcknowledgedHandling();
            this.testShowInstallPrompt();
            this.testHideInstallPrompt();
            this.testManualInstallationTrigger();
            this.testInstallationStatusUpdate();
            this.testErrorHandling();
            this.testCleanup();
            this.testFallbackMode();
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
    window.PWAInstallManagerTests = PWAInstallManagerTests;
} else if (typeof module !== 'undefined' && module.exports) {
    module.exports = PWAInstallManagerTests;
}

// Auto-run tests if this file is loaded directly
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        // Only run tests if explicitly requested
        if (window.location.search.includes('runTests=true')) {
            const tester = new PWAInstallManagerTests();
            tester.runAllTests();
        }
    });
}