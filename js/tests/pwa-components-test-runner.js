/**
 * PWA Components Test Runner
 * Comprehensive test runner for all PWA installation components
 */

class PWAComponentsTestRunner {
    constructor() {
        this.testSuites = [];
        this.results = {
            totalSuites: 0,
            passedSuites: 0,
            totalTests: 0,
            passedTests: 0,
            startTime: null,
            endTime: null,
            duration: 0
        };
        this.verbose = false;
    }

    /**
     * Add a test suite to the runner
     * @param {string} name - Test suite name
     * @param {Function} testClass - Test class constructor
     * @param {Object} options - Test options
     */
    addTestSuite(name, testClass, options = {}) {
        this.testSuites.push({
            name,
            testClass,
            options,
            results: null
        });
    }

    /**
     * Run all test suites
     * @param {Object} options - Runner options
     */
    async runAllTests(options = {}) {
        this.verbose = options.verbose || false;
        this.results.startTime = Date.now();
        
        console.log('🚀 Starting PWA Components Test Suite');
        console.log('=====================================\n');

        // Run each test suite
        for (const suite of this.testSuites) {
            await this.runTestSuite(suite);
        }

        this.results.endTime = Date.now();
        this.results.duration = this.results.endTime - this.results.startTime;

        // Print final summary
        this.printFinalSummary();

        return this.results;
    }

    /**
     * Run a single test suite
     * @param {Object} suite - Test suite configuration
     */
    async runTestSuite(suite) {
        console.log(`\n🧪 Running ${suite.name} Tests`);
        console.log('─'.repeat(50));

        try {
            const testInstance = new suite.testClass();
            let results = testInstance.runAllTests();
            if (results && typeof results.then === 'function') {
                // Support async test suites that return a Promise
                results = await results;
            }

            suite.results = results;
            this.results.totalSuites++;
            if (results && typeof results.total === 'number' && typeof results.passed === 'number') {
                this.results.totalTests += results.total;
                this.results.passedTests += results.passed;
            }

            if (results && results.allPassed) {
                this.results.passedSuites++;
                console.log(`✅ ${suite.name}: ALL TESTS PASSED (${results.passed}/${results.total})`);
            } else {
                const passed = results && typeof results.passed === 'number' ? results.passed : 0;
                const total = results && typeof results.total === 'number' ? results.total : 1;
                console.log(`❌ ${suite.name}: SOME TESTS FAILED (${passed}/${total})`);
            }

        } catch (error) {
            console.error(`💥 ${suite.name}: TEST SUITE FAILED TO RUN`);
            console.error('Error:', error.message);
            
            suite.results = {
                passed: 0,
                total: 1,
                passRate: 0,
                allPassed: false,
                error: error.message
            };
            
            this.results.totalSuites++;
            this.results.totalTests += 1;
        }
    }

    /**
     * Print final test summary
     */
    printFinalSummary() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 FINAL TEST RESULTS SUMMARY');
        console.log('='.repeat(60));

        // Overall statistics
        const overallPassRate = this.results.totalTests > 0 
            ? ((this.results.passedTests / this.results.totalTests) * 100).toFixed(1)
            : 0;

        console.log(`\n📈 Overall Statistics:`);
        console.log(`   Test Suites: ${this.results.passedSuites}/${this.results.totalSuites} passed`);
        console.log(`   Individual Tests: ${this.results.passedTests}/${this.results.totalTests} passed`);
        console.log(`   Success Rate: ${overallPassRate}%`);
        console.log(`   Duration: ${this.results.duration}ms`);

        // Suite-by-suite breakdown
        console.log(`\n📋 Suite Breakdown:`);
        this.testSuites.forEach(suite => {
            const status = suite.results && suite.results.allPassed ? '✅' : '❌';
            const rate = suite.results && suite.results.passRate !== undefined ? `${suite.results.passRate}%` : 'ERROR';
            const count = suite.results && suite.results.passed !== undefined && suite.results.total !== undefined ? `${suite.results.passed}/${suite.results.total}` : '0/0';
            
            console.log(`   ${status} ${suite.name}: ${count} (${rate})`);
            
            if (suite.results?.error) {
                console.log(`      Error: ${suite.results.error}`);
            }
        });

        // Final verdict
        console.log('\n🎯 Final Verdict:');
        if (this.results.passedSuites === this.results.totalSuites && this.results.passedTests === this.results.totalTests) {
            console.log('🎉 ALL TESTS PASSED! PWA components are working correctly.');
        } else if (this.results.passedTests > 0) {
            console.log('⚠️  SOME TESTS FAILED. Please review the failing components.');
        } else {
            console.log('💥 ALL TESTS FAILED. Critical issues detected in PWA components.');
        }

        console.log('\n' + '='.repeat(60));
    }

    /**
     * Run tests for specific components only
     * @param {Array} componentNames - Names of components to test
     */
    async runSpecificTests(componentNames) {
        const filteredSuites = this.testSuites.filter(suite => 
            componentNames.includes(suite.name)
        );

        if (filteredSuites.length === 0) {
            console.log('❌ No matching test suites found for:', componentNames);
            return;
        }

        console.log(`🎯 Running specific tests for: ${componentNames.join(', ')}`);
        
        const originalSuites = this.testSuites;
        this.testSuites = filteredSuites;
        
        const results = await this.runAllTests();
        
        this.testSuites = originalSuites;
        return results;
    }

    /**
     * Generate test report in various formats
     * @param {string} format - Report format ('console', 'json', 'html')
     */
    generateReport(format = 'console') {
        switch (format.toLowerCase()) {
            case 'json':
                return this.generateJSONReport();
            case 'html':
                return this.generateHTMLReport();
            case 'console':
            default:
                return this.generateConsoleReport();
        }
    }

    /**
     * Generate JSON report
     */
    generateJSONReport() {
        return JSON.stringify({
            summary: this.results,
            suites: this.testSuites.map(suite => ({
                name: suite.name,
                results: suite.results,
                options: suite.options
            })),
            timestamp: new Date().toISOString()
        }, null, 2);
    }

    /**
     * Generate HTML report
     */
    generateHTMLReport() {
        const overallPassRate = this.results.totalTests > 0 
            ? ((this.results.passedTests / this.results.totalTests) * 100).toFixed(1)
            : 0;

        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PWA Components Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .stat-value { font-size: 2em; font-weight: bold; color: #007bff; }
        .stat-label { color: #666; margin-top: 5px; }
        .suite { margin-bottom: 20px; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; }
        .suite-header { background: #f8f9fa; padding: 15px; font-weight: bold; }
        .suite-content { padding: 15px; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .progress-bar { width: 100%; height: 20px; background: #e9ecef; border-radius: 10px; overflow: hidden; margin: 10px 0; }
        .progress-fill { height: 100%; background: #28a745; transition: width 0.3s ease; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>PWA Components Test Report</h1>
            <p>Generated on ${new Date().toLocaleString()}</p>
        </div>
        
        <div class="summary">
            <div class="stat-card">
                <div class="stat-value">${this.results.passedSuites}/${this.results.totalSuites}</div>
                <div class="stat-label">Test Suites Passed</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${this.results.passedTests}/${this.results.totalTests}</div>
                <div class="stat-label">Individual Tests Passed</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${overallPassRate}%</div>
                <div class="stat-label">Success Rate</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${this.results.duration}ms</div>
                <div class="stat-label">Duration</div>
            </div>
        </div>
        
        <h2>Test Suite Details</h2>
        ${this.testSuites.map(suite => `
            <div class="suite">
                <div class="suite-header ${suite.results?.allPassed ? 'passed' : 'failed'}">
                    ${suite.results?.allPassed ? '✅' : '❌'} ${suite.name}
                    <span style="float: right;">${suite.results ? `${suite.results.passed}/${suite.results.total} (${suite.results.passRate}%)` : 'ERROR'}</span>
                </div>
                <div class="suite-content">
                    ${suite.results ? `
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${suite.results.passRate}%"></div>
                        </div>
                        ${suite.results.error ? `<p class="failed">Error: ${suite.results.error}</p>` : ''}
                    ` : '<p class="failed">Test suite failed to run</p>'}
                </div>
            </div>
        `).join('')}
    </div>
</body>
</html>`;
    }

    /**
     * Generate console report
     */
    generateConsoleReport() {
        let report = '\n📊 PWA Components Test Report\n';
        report += '='.repeat(40) + '\n';
        
        const overallPassRate = this.results.totalTests > 0 
            ? ((this.results.passedTests / this.results.totalTests) * 100).toFixed(1)
            : 0;

        report += `Overall Success Rate: ${overallPassRate}%\n`;
        report += `Test Suites: ${this.results.passedSuites}/${this.results.totalSuites}\n`;
        report += `Individual Tests: ${this.results.passedTests}/${this.results.totalTests}\n`;
        report += `Duration: ${this.results.duration}ms\n\n`;

        this.testSuites.forEach(suite => {
            const status = suite.results?.allPassed ? '✅' : '❌';
            const rate = suite.results ? `${suite.results.passRate}%` : 'ERROR';
            report += `${status} ${suite.name}: ${rate}\n`;
        });

        return report;
    }

    /**
     * Save report to file (browser download)
     * @param {string} format - Report format
     * @param {string} filename - File name
     */
    saveReport(format = 'json', filename = null) {
        if (typeof window === 'undefined') {
            console.log('File saving only available in browser environment');
            return;
        }

        const report = this.generateReport(format);
        const timestamp = new Date().toISOString().split('T')[0];
        const defaultFilename = `pwa-test-report-${timestamp}.${format}`;
        const finalFilename = filename || defaultFilename;

        const blob = new Blob([report], { 
            type: format === 'html' ? 'text/html' : 
                  format === 'json' ? 'application/json' : 'text/plain' 
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = finalFilename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log(`📄 Report saved as: ${finalFilename}`);
    }
}

// Initialize and configure the test runner
function initializePWATestRunner() {
    const runner = new PWAComponentsTestRunner();

    // Add all PWA component test suites
    if (typeof PWAInstallManagerTests !== 'undefined') {
        runner.addTestSuite('PWAInstallManager', PWAInstallManagerTests);
    }

    if (typeof InstallPromptUITests !== 'undefined') {
        runner.addTestSuite('InstallPromptUI', InstallPromptUITests);
    }

    if (typeof InstallAnalyticsTests !== 'undefined') {
        runner.addTestSuite('InstallAnalytics', InstallAnalyticsTests);
    }

    if (typeof CrossPlatformDetectorTest !== 'undefined') {
        runner.addTestSuite('CrossPlatformDetector', CrossPlatformDetectorTest);
    }

    if (typeof InstallationStorageTests !== 'undefined') {
        runner.addTestSuite('InstallationStorage', InstallationStorageTests);
    }

    // Notifications test suites
    if (typeof NotificationsPermissionTests !== 'undefined') {
        runner.addTestSuite('NotificationsPermission', NotificationsPermissionTests, { async: true });
    }
    if (typeof ReminderSchedulerTests !== 'undefined') {
        runner.addTestSuite('ReminderScheduler', ReminderSchedulerTests);
    }
    if (typeof NotificationsSettingsIntegrationTests !== 'undefined') {
        runner.addTestSuite('NotificationsSettingsIntegration', NotificationsSettingsIntegrationTests);
    }

    return runner;
}

// Auto-run tests if this file is loaded directly
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        // Check if we should run tests automatically
        const urlParams = new URLSearchParams(window.location.search);
        const runTests = urlParams.get('runTests');
        const testComponents = urlParams.get('components');
        const verbose = urlParams.get('verbose') === 'true';
        const saveReport = urlParams.get('saveReport');

        if (runTests === 'true') {
            const runner = initializePWATestRunner();
            
            if (testComponents) {
                // Run specific components
                const components = testComponents.split(',').map(c => c.trim());
                runner.runSpecificTests(components).then(results => {
                    if (saveReport) {
                        runner.saveReport(saveReport);
                    }
                });
            } else {
                // Run all tests
                runner.runAllTests({ verbose }).then(results => {
                    if (saveReport) {
                        runner.saveReport(saveReport);
                    }
                });
            }
        }
    });
}

// Make available globally
if (typeof window !== 'undefined') {
    window.PWAComponentsTestRunner = PWAComponentsTestRunner;
    window.initializePWATestRunner = initializePWATestRunner;
} else if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PWAComponentsTestRunner, initializePWATestRunner };
}