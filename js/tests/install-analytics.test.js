/**
 * Unit tests for InstallAnalytics class
 * Tests analytics data accuracy and storage functionality
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

// Test suite for InstallAnalytics
function runInstallAnalyticsTests() {
    console.log('Running InstallAnalytics Tests...');
    
    let originalLocalStorage;
    let mockLocalStorage;
    let analytics;

    // Setup before each test
    function setup() {
        originalLocalStorage = window.localStorage;
        mockLocalStorage = new MockLocalStorage();
        Object.defineProperty(window, 'localStorage', {
            value: mockLocalStorage,
            writable: true
        });
        analytics = new InstallAnalytics();
    }

    // Cleanup after each test
    function cleanup() {
        Object.defineProperty(window, 'localStorage', {
            value: originalLocalStorage,
            writable: true
        });
    }

    // Test 1: Initialization creates proper data structure
    function testInitialization() {
        setup();
        
        const data = analytics.getAnalyticsData();
        
        console.assert(data !== null, 'Analytics data should be initialized');
        console.assert(Array.isArray(data.events), 'Events should be an array');
        console.assert(typeof data.summary === 'object', 'Summary should be an object');
        console.assert(data.summary.totalPrompts === 0, 'Initial total prompts should be 0');
        console.assert(data.summary.installClicks === 0, 'Initial install clicks should be 0');
        console.assert(data.summary.dismissals === 0, 'Initial dismissals should be 0');
        console.assert(data.summary.installSuccess === false, 'Initial install success should be false');
        console.assert(data.summary.conversionRate === 0, 'Initial conversion rate should be 0');
        
        cleanup();
        console.log('✓ Initialization test passed');
    }

    // Test 2: Track prompt shown updates data correctly
    function testTrackPromptShown() {
        setup();
        
        analytics.trackPromptShown({ source: 'automatic' });
        
        const data = analytics.getAnalyticsData();
        
        console.assert(data.events.length === 1, 'Should have 1 event after tracking prompt');
        console.assert(data.events[0].type === 'prompt_shown', 'Event type should be prompt_shown');
        console.assert(data.summary.totalPrompts === 1, 'Total prompts should be 1');
        console.assert(data.summary.firstPromptDate !== null, 'First prompt date should be set');
        console.assert(data.summary.lastEventDate !== null, 'Last event date should be set');
        
        // Track another prompt
        analytics.trackPromptShown();
        const updatedData = analytics.getAnalyticsData();
        
        console.assert(updatedData.events.length === 2, 'Should have 2 events after second prompt');
        console.assert(updatedData.summary.totalPrompts === 2, 'Total prompts should be 2');
        
        cleanup();
        console.log('✓ Track prompt shown test passed');
    }

    // Test 3: Track install click updates data correctly
    function testTrackInstallClick() {
        setup();
        
        // First show a prompt, then track install click
        analytics.trackPromptShown();
        analytics.trackInstallClick({ method: 'button' });
        
        const data = analytics.getAnalyticsData();
        
        console.assert(data.events.length === 2, 'Should have 2 events');
        console.assert(data.events[1].type === 'install_clicked', 'Second event should be install_clicked');
        console.assert(data.summary.installClicks === 1, 'Install clicks should be 1');
        console.assert(data.summary.conversionRate === 100, 'Conversion rate should be 100% (1/1)');
        
        cleanup();
        console.log('✓ Track install click test passed');
    }

    // Test 4: Track dismiss updates data correctly
    function testTrackDismiss() {
        setup();
        
        analytics.trackPromptShown();
        analytics.trackDismiss({ reason: 'not_now' });
        
        const data = analytics.getAnalyticsData();
        
        console.assert(data.events.length === 2, 'Should have 2 events');
        console.assert(data.events[1].type === 'dismissed', 'Second event should be dismissed');
        console.assert(data.summary.dismissals === 1, 'Dismissals should be 1');
        console.assert(data.summary.conversionRate === 0, 'Conversion rate should be 0% (0/1)');
        
        cleanup();
        console.log('✓ Track dismiss test passed');
    }

    // Test 5: Track don't ask again updates data correctly
    function testTrackDontAskAgain() {
        setup();
        
        analytics.trackPromptShown();
        analytics.trackDontAskAgain();
        
        const data = analytics.getAnalyticsData();
        
        console.assert(data.events.length === 2, 'Should have 2 events');
        console.assert(data.events[1].type === 'dont_ask_again', 'Second event should be dont_ask_again');
        console.assert(data.summary.dontAskAgainClicks === 1, 'Don\'t ask again clicks should be 1');
        
        cleanup();
        console.log('✓ Track don\'t ask again test passed');
    }

    // Test 6: Track install success updates data correctly
    function testTrackInstallSuccess() {
        setup();
        
        analytics.trackPromptShown();
        analytics.trackInstallClick();
        analytics.trackInstallSuccess();
        
        const data = analytics.getAnalyticsData();
        
        console.assert(data.events.length === 3, 'Should have 3 events');
        console.assert(data.events[2].type === 'install_success', 'Third event should be install_success');
        console.assert(data.summary.installSuccess === true, 'Install success should be true');
        
        cleanup();
        console.log('✓ Track install success test passed');
    }

    // Test 7: Conversion rate calculation is accurate
    function testConversionRateCalculation() {
        setup();
        
        // Show 4 prompts, 1 install click
        analytics.trackPromptShown();
        analytics.trackPromptShown();
        analytics.trackPromptShown();
        analytics.trackPromptShown();
        analytics.trackInstallClick();
        
        const data = analytics.getAnalyticsData();
        
        console.assert(data.summary.totalPrompts === 4, 'Should have 4 total prompts');
        console.assert(data.summary.installClicks === 1, 'Should have 1 install click');
        console.assert(data.summary.conversionRate === 25, 'Conversion rate should be 25% (1/4)');
        
        cleanup();
        console.log('✓ Conversion rate calculation test passed');
    }

    // Test 8: Event data includes required fields
    function testEventDataStructure() {
        setup();
        
        analytics.trackPromptShown({ customField: 'test' });
        
        const data = analytics.getAnalyticsData();
        const event = data.events[0];
        
        console.assert(typeof event.type === 'string', 'Event should have type');
        console.assert(typeof event.timestamp === 'string', 'Event should have timestamp');
        console.assert(typeof event.platform === 'string', 'Event should have platform');
        console.assert(typeof event.browser === 'string', 'Event should have browser');
        console.assert(typeof event.sessionCount === 'number', 'Event should have sessionCount');
        console.assert(typeof event.jobCount === 'number', 'Event should have jobCount');
        console.assert(event.customField === 'test', 'Event should include custom fields');
        
        // Validate timestamp format (ISO string)
        const timestamp = new Date(event.timestamp);
        console.assert(!isNaN(timestamp.getTime()), 'Timestamp should be valid ISO string');
        
        cleanup();
        console.log('✓ Event data structure test passed');
    }

    // Test 9: Get install metrics returns proper structure
    function testGetInstallMetrics() {
        setup();
        
        // Create some test data
        analytics.trackPromptShown();
        analytics.trackInstallClick();
        analytics.trackDismiss();
        
        const metrics = analytics.getInstallMetrics();
        
        console.assert(typeof metrics.summary === 'object', 'Metrics should have summary');
        console.assert(Array.isArray(metrics.events), 'Metrics should have events array');
        console.assert(typeof metrics.funnel === 'object', 'Metrics should have funnel');
        console.assert(typeof metrics.platformBreakdown === 'object', 'Metrics should have platform breakdown');
        console.assert(Array.isArray(metrics.timelineData), 'Metrics should have timeline data');
        console.assert(Array.isArray(metrics.recentActivity), 'Metrics should have recent activity');
        
        // Test funnel calculations
        console.assert(typeof metrics.funnel.clickThroughRate === 'number', 'Funnel should have click-through rate');
        console.assert(typeof metrics.funnel.installationRate === 'number', 'Funnel should have installation rate');
        
        cleanup();
        console.log('✓ Get install metrics test passed');
    }

    // Test 10: Platform and browser breakdown calculation
    function testPlatformBreakdown() {
        setup();
        
        // Mock different platforms/browsers by modifying events
        analytics.trackPromptShown();
        analytics.trackInstallClick();
        
        const data = analytics.getAnalyticsData();
        // Manually set platform/browser for testing
        data.events[0].platform = 'macOS';
        data.events[0].browser = 'Chrome';
        data.events[1].platform = 'macOS';
        data.events[1].browser = 'Chrome';
        analytics.saveAnalyticsData(data);
        
        const metrics = analytics.getInstallMetrics();
        const breakdown = metrics.platformBreakdown;
        
        console.assert(breakdown.platforms.macOS.prompts === 1, 'macOS should have 1 prompt');
        console.assert(breakdown.browsers.Chrome.prompts === 1, 'Chrome should have 1 prompt');
        
        cleanup();
        console.log('✓ Platform breakdown test passed');
    }

    // Test 11: Export functionality works correctly
    function testExportFunctionality() {
        setup();
        
        analytics.trackPromptShown();
        analytics.trackInstallClick();
        
        // Test JSON export
        const jsonExport = analytics.exportAnalytics('json');
        console.assert(typeof jsonExport === 'string', 'JSON export should be string');
        console.assert(jsonExport.includes('prompt_shown'), 'JSON export should contain event data');
        
        // Test CSV export
        const csvExport = analytics.exportAnalytics('csv');
        console.assert(typeof csvExport === 'string', 'CSV export should be string');
        console.assert(csvExport.includes('Timestamp'), 'CSV export should have headers');
        console.assert(csvExport.includes('prompt_shown'), 'CSV export should contain event data');
        
        // Test summary export
        const summaryExport = analytics.exportAnalytics('summary');
        console.assert(typeof summaryExport === 'string', 'Summary export should be string');
        console.assert(summaryExport.includes('PWA Installation Analytics Summary'), 'Summary should have title');
        
        cleanup();
        console.log('✓ Export functionality test passed');
    }

    // Test 12: Reset analytics clears all data
    function testResetAnalytics() {
        setup();
        
        // Add some data
        analytics.trackPromptShown();
        analytics.trackInstallClick();
        
        let data = analytics.getAnalyticsData();
        console.assert(data.events.length === 2, 'Should have events before reset');
        console.assert(data.summary.totalPrompts === 1, 'Should have prompts before reset');
        
        // Reset analytics
        analytics.resetAnalytics();
        
        data = analytics.getAnalyticsData();
        console.assert(data.events.length === 0, 'Should have no events after reset');
        console.assert(data.summary.totalPrompts === 0, 'Should have no prompts after reset');
        console.assert(data.summary.installSuccess === false, 'Install success should be false after reset');
        
        cleanup();
        console.log('✓ Reset analytics test passed');
    }

    // Test 13: Error handling for corrupted localStorage
    function testErrorHandling() {
        setup();
        
        // Corrupt the localStorage data
        mockLocalStorage.setItem('jobTracker_installAnalytics', 'invalid json');
        
        // Should handle corrupted data gracefully
        const data = analytics.getAnalyticsData();
        console.assert(data === null, 'Should return null for corrupted data');
        
        // Should reinitialize when tracking events
        analytics.trackPromptShown();
        const newData = analytics.getAnalyticsData();
        console.assert(newData !== null, 'Should reinitialize after corruption');
        console.assert(newData.events.length === 1, 'Should track events after reinitializing');
        
        cleanup();
        console.log('✓ Error handling test passed');
    }

    // Test 14: Timeline data calculation
    function testTimelineDataCalculation() {
        setup();
        
        // Create events on different dates by manually setting timestamps
        analytics.trackPromptShown();
        analytics.trackInstallClick();
        
        const data = analytics.getAnalyticsData();
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        // Modify timestamps for testing
        data.events[0].timestamp = `${yesterday}T10:00:00.000Z`;
        data.events[1].timestamp = `${today}T10:00:00.000Z`;
        analytics.saveAnalyticsData(data);
        
        const metrics = analytics.getInstallMetrics();
        const timeline = metrics.timelineData;
        
        console.assert(Array.isArray(timeline), 'Timeline should be an array');
        console.assert(timeline.length >= 1, 'Timeline should have data points');
        console.assert(timeline[0].date, 'Timeline points should have dates');
        
        cleanup();
        console.log('✓ Timeline data calculation test passed');
    }

    // Test 15: Recent activity tracking
    function testRecentActivity() {
        setup();
        
        // Add multiple events
        for (let i = 0; i < 5; i++) {
            analytics.trackPromptShown();
        }
        
        const metrics = analytics.getInstallMetrics();
        const recentActivity = metrics.recentActivity;
        
        console.assert(Array.isArray(recentActivity), 'Recent activity should be an array');
        console.assert(recentActivity.length === 5, 'Should have 5 recent activities');
        console.assert(recentActivity[0].type === 'prompt_shown', 'Most recent should be first');
        console.assert(recentActivity[0].timestamp, 'Activities should have timestamps');
        
        cleanup();
        console.log('✓ Recent activity test passed');
    }

    // Run all tests
    try {
        testInitialization();
        testTrackPromptShown();
        testTrackInstallClick();
        testTrackDismiss();
        testTrackDontAskAgain();
        testTrackInstallSuccess();
        testConversionRateCalculation();
        testEventDataStructure();
        testGetInstallMetrics();
        testPlatformBreakdown();
        testExportFunctionality();
        testResetAnalytics();
        testErrorHandling();
        testTimelineDataCalculation();
        testRecentActivity();
        
        console.log('\n✅ All InstallAnalytics tests passed!');
        return true;
    } catch (error) {
        console.error('\n❌ InstallAnalytics test failed:', error);
        return false;
    }
}

// Export for use in test runner
if (typeof window !== 'undefined') {
    window.runInstallAnalyticsTests = runInstallAnalyticsTests;
}

// Auto-run tests if this file is loaded directly
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        runInstallAnalyticsTests();
    });
}