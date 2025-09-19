/**
 * Integration tests for InstallAnalytics with PWAInstallManager
 * Tests the complete analytics tracking system integration
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
        this.store[key] = value;
    }

    removeItem(key) {
        delete this.store[key];
    }

    clear() {
        this.store = {};
    }
}

// Mock InstallPromptUI for testing
class MockInstallPromptUI {
    constructor(manager) {
        this.manager = manager;
        this.isVisible = false;
    }

    show() {
        this.isVisible = true;
        console.log('[MockUI] Prompt shown');
    }

    hide() {
        this.isVisible = false;
        console.log('[MockUI] Prompt hidden');
    }

    destroy() {
        this.isVisible = false;
        console.log('[MockUI] Prompt destroyed');
    }

    simulateInstallClick() {
        this.manager.handleInstallClick();
    }

    simulateDismiss() {
        this.manager.handlePromptDismiss();
    }

    simulateDontAskAgain() {
        this.manager.handleDontAskAgain();
    }
}

// Test suite for InstallAnalytics integration
function runInstallAnalyticsIntegrationTests() {
    console.log('Running InstallAnalytics Integration Tests...');
    
    let originalLocalStorage;
    let mockLocalStorage;
    let pwaManager;
    let analytics;

    // Setup before each test
    function setup() {
        originalLocalStorage = window.localStorage;
        mockLocalStorage = new MockLocalStorage();
        Object.defineProperty(window, 'localStorage', {
            value: mockLocalStorage,
            writable: true
        });

        // Mock InstallPromptUI
        window.InstallPromptUI = MockInstallPromptUI;

        // Create PWA manager (which creates analytics internally)
        pwaManager = new PWAInstallManager({
            minSessions: 1,
            minJobApplications: 1
        });

        // Get reference to analytics from manager
        analytics = pwaManager.analytics;

        // Add some job data for eligibility
        mockLocalStorage.setItem('jobTracker_jobs', JSON.stringify([
            { id: 1, title: 'Test Job 1' },
            { id: 2, title: 'Test Job 2' }
        ]));
    }

    // Cleanup after each test
    function cleanup() {
        Object.defineProperty(window, 'localStorage', {
            value: originalLocalStorage,
            writable: true
        });
        delete window.InstallPromptUI;
    }

    // Test 1: PWA manager creates analytics instance
    function testPWAManagerCreatesAnalytics() {
        setup();
        
        console.assert(pwaManager.analytics instanceof InstallAnalytics, 'PWA manager should create InstallAnalytics instance');
        console.assert(analytics !== null, 'Analytics should be accessible');
        
        cleanup();
        console.log('✓ PWA manager creates analytics test passed');
    }

    // Test 2: Prompt shown triggers analytics tracking
    function testPromptShownTriggersAnalytics() {
        setup();
        
        // Initialize and track session to meet eligibility
        pwaManager.init();
        
        // Manually trigger prompt shown
        pwaManager.trackPromptShown();
        
        const analyticsData = analytics.getAnalyticsData();
        
        console.assert(analyticsData.events.length === 1, 'Should have 1 analytics event');
        console.assert(analyticsData.events[0].type === 'prompt_shown', 'Event should be prompt_shown');
        console.assert(analyticsData.summary.totalPrompts === 1, 'Summary should show 1 prompt');
        
        // Check event data includes context
        const event = analyticsData.events[0];
        console.assert(event.source === 'automatic', 'Event should have source');
        console.assert(event.trigger === 'eligibility_met', 'Event should have trigger');
        console.assert(typeof event.sessionCount === 'number', 'Event should have session count');
        console.assert(typeof event.jobCount === 'number', 'Event should have job count');
        
        cleanup();
        console.log('✓ Prompt shown triggers analytics test passed');
    }

    // Test 3: Install acceptance triggers analytics tracking
    function testInstallAcceptanceTriggersAnalytics() {
        setup();
        
        pwaManager.init();
        pwaManager.trackPromptShown();
        pwaManager.trackInstallAccepted();
        
        const analyticsData = analytics.getAnalyticsData();
        
        console.assert(analyticsData.events.length === 2, 'Should have 2 analytics events');
        console.assert(analyticsData.events[1].type === 'install_clicked', 'Second event should be install_clicked');
        console.assert(analyticsData.summary.installClicks === 1, 'Summary should show 1 install click');
        console.assert(analyticsData.summary.conversionRate === 100, 'Conversion rate should be 100%');
        
        // Check event data
        const installEvent = analyticsData.events[1];
        console.assert(installEvent.method === 'prompt_button', 'Event should have method');
        console.assert(typeof installEvent.promptCount === 'number', 'Event should have prompt count');
        
        cleanup();
        console.log('✓ Install acceptance triggers analytics test passed');
    }

    // Test 4: Prompt dismissal triggers analytics tracking
    function testPromptDismissalTriggersAnalytics() {
        setup();
        
        pwaManager.init();
        pwaManager.trackPromptShown();
        pwaManager.trackPromptDismissed();
        
        const analyticsData = analytics.getAnalyticsData();
        
        console.assert(analyticsData.events.length === 2, 'Should have 2 analytics events');
        console.assert(analyticsData.events[1].type === 'dismissed', 'Second event should be dismissed');
        console.assert(analyticsData.summary.dismissals === 1, 'Summary should show 1 dismissal');
        
        // Check event data
        const dismissEvent = analyticsData.events[1];
        console.assert(dismissEvent.reason === 'not_now', 'Event should have reason');
        console.assert(typeof dismissEvent.dismissalCount === 'number', 'Event should have dismissal count');
        
        cleanup();
        console.log('✓ Prompt dismissal triggers analytics test passed');
    }

    // Test 5: Multiple dismissals trigger "don't ask again" analytics
    function testMultipleDismissalsTriggersAnalytics() {
        setup();
        
        pwaManager.init();
        
        // Simulate 3 dismissals to trigger auto "don't ask again"
        for (let i = 0; i < 3; i++) {
            pwaManager.trackPromptShown();
            pwaManager.trackPromptDismissed();
        }
        
        const analyticsData = analytics.getAnalyticsData();
        
        // Should have 3 prompt_shown + 2 dismissed + 1 dont_ask_again = 6 events
        console.assert(analyticsData.events.length === 6, 'Should have 6 analytics events');
        
        // Find the "don't ask again" event
        const dontAskEvent = analyticsData.events.find(e => e.type === 'dont_ask_again');
        console.assert(dontAskEvent !== undefined, 'Should have dont_ask_again event');
        console.assert(dontAskEvent.trigger === 'auto_after_dismissals', 'Event should have correct trigger');
        console.assert(analyticsData.summary.dontAskAgainClicks === 1, 'Summary should show 1 dont ask again');
        
        cleanup();
        console.log('✓ Multiple dismissals trigger analytics test passed');
    }

    // Test 6: Installation success triggers analytics tracking
    function testInstallationSuccessTriggersAnalytics() {
        setup();
        
        pwaManager.init();
        pwaManager.trackPromptShown();
        pwaManager.trackInstallAccepted();
        pwaManager.trackInstallationSuccess();
        
        const analyticsData = analytics.getAnalyticsData();
        
        console.assert(analyticsData.events.length === 3, 'Should have 3 analytics events');
        console.assert(analyticsData.events[2].type === 'install_success', 'Third event should be install_success');
        console.assert(analyticsData.summary.installSuccess === true, 'Summary should show install success');
        
        // Check event data includes comprehensive context
        const successEvent = analyticsData.events[2];
        console.assert(successEvent.method === 'pwa_prompt', 'Event should have method');
        console.assert(typeof successEvent.totalPrompts === 'number', 'Event should have total prompts');
        console.assert(typeof successEvent.totalDismissals === 'number', 'Event should have total dismissals');
        console.assert(typeof successEvent.daysSinceFirstVisit === 'number', 'Event should have days since first visit');
        
        cleanup();
        console.log('✓ Installation success triggers analytics test passed');
    }

    // Test 7: Analytics data persists across PWA manager instances
    function testAnalyticsDataPersistence() {
        setup();
        
        // Create first manager and track some events
        const manager1 = new PWAInstallManager();
        manager1.init();
        manager1.trackPromptShown();
        manager1.trackInstallAccepted();
        
        // Create second manager and verify data persists
        const manager2 = new PWAInstallManager();
        const analyticsData = manager2.analytics.getAnalyticsData();
        
        console.assert(analyticsData.events.length === 2, 'Analytics data should persist across instances');
        console.assert(analyticsData.summary.totalPrompts === 1, 'Prompt count should persist');
        console.assert(analyticsData.summary.installClicks === 1, 'Install clicks should persist');
        
        cleanup();
        console.log('✓ Analytics data persistence test passed');
    }

    // Test 8: Analytics metrics calculation with PWA data
    function testAnalyticsMetricsWithPWAData() {
        setup();
        
        pwaManager.init();
        
        // Simulate a complete user journey
        pwaManager.trackPromptShown();
        pwaManager.trackPromptDismissed();
        pwaManager.trackPromptShown();
        pwaManager.trackInstallAccepted();
        pwaManager.trackInstallationSuccess();
        
        const metrics = analytics.getInstallMetrics();
        
        // Verify funnel metrics
        console.assert(metrics.funnel.promptsShown === 2, 'Funnel should show 2 prompts');
        console.assert(metrics.funnel.installClicks === 1, 'Funnel should show 1 install click');
        console.assert(metrics.funnel.dismissals === 1, 'Funnel should show 1 dismissal');
        console.assert(metrics.funnel.installSuccess === 1, 'Funnel should show 1 install success');
        console.assert(metrics.funnel.clickThroughRate === 50, 'Click-through rate should be 50%');
        console.assert(metrics.funnel.installationRate === 100, 'Installation rate should be 100%');
        
        // Verify timeline data
        console.assert(Array.isArray(metrics.timelineData), 'Should have timeline data');
        console.assert(metrics.timelineData.length > 0, 'Timeline should have data points');
        
        // Verify recent activity
        console.assert(Array.isArray(metrics.recentActivity), 'Should have recent activity');
        console.assert(metrics.recentActivity.length === 5, 'Should show last 5 activities');
        
        cleanup();
        console.log('✓ Analytics metrics with PWA data test passed');
    }

    // Test 9: Error handling in analytics integration
    function testErrorHandlingInIntegration() {
        setup();
        
        // Corrupt analytics data
        mockLocalStorage.setItem('jobTracker_installAnalytics', 'invalid json');
        
        // PWA manager should handle corrupted analytics gracefully
        const manager = new PWAInstallManager();
        manager.init();
        
        // Should be able to track events even with corrupted initial data
        manager.trackPromptShown();
        
        const analyticsData = manager.analytics.getAnalyticsData();
        console.assert(analyticsData !== null, 'Should recover from corrupted data');
        console.assert(analyticsData.events.length === 1, 'Should track new events after recovery');
        
        cleanup();
        console.log('✓ Error handling in integration test passed');
    }

    // Test 10: Analytics export includes PWA context
    function testAnalyticsExportIncludesPWAContext() {
        setup();
        
        pwaManager.init();
        pwaManager.trackPromptShown();
        pwaManager.trackInstallAccepted();
        
        // Test JSON export
        const jsonExport = analytics.exportAnalytics('json');
        console.assert(typeof jsonExport === 'string', 'JSON export should be string');
        console.assert(jsonExport.includes('sessionCount'), 'Export should include session context');
        console.assert(jsonExport.includes('jobCount'), 'Export should include job context');
        
        // Test summary export
        const summaryExport = analytics.exportAnalytics('summary');
        console.assert(summaryExport.includes('PWA Installation Analytics Summary'), 'Summary should have title');
        console.assert(summaryExport.includes('Conversion Rate'), 'Summary should include conversion rate');
        
        cleanup();
        console.log('✓ Analytics export includes PWA context test passed');
    }

    // Run all integration tests
    try {
        testPWAManagerCreatesAnalytics();
        testPromptShownTriggersAnalytics();
        testInstallAcceptanceTriggersAnalytics();
        testPromptDismissalTriggersAnalytics();
        testMultipleDismissalsTriggersAnalytics();
        testInstallationSuccessTriggersAnalytics();
        testAnalyticsDataPersistence();
        testAnalyticsMetricsWithPWAData();
        testErrorHandlingInIntegration();
        testAnalyticsExportIncludesPWAContext();
        
        console.log('\n✅ All InstallAnalytics integration tests passed!');
        return true;
    } catch (error) {
        console.error('\n❌ InstallAnalytics integration test failed:', error);
        return false;
    }
}

// Export for use in test runner
if (typeof window !== 'undefined') {
    window.runInstallAnalyticsIntegrationTests = runInstallAnalyticsIntegrationTests;
}

// Auto-run tests if this file is loaded directly
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        // Wait for other scripts to load
        setTimeout(() => {
            if (window.InstallAnalytics && window.PWAInstallManager) {
                runInstallAnalyticsIntegrationTests();
            } else {
                console.error('Required classes not available for integration tests');
            }
        }, 100);
    });
}