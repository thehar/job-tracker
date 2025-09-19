/**
 * Cross-Platform Detector Tests
 * Comprehensive tests for browser detection accuracy and edge cases
 */

// Mock user agents for testing
const mockUserAgents = {
    chrome: {
        desktop: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        mobile: 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
        old: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.149 Safari/537.36'
    },
    edge: {
        desktop: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59',
        mobile: 'Mozilla/5.0 (Linux; Android 10; HD1913) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36 EdgA/46.3.4.5155'
    },
    firefox: {
        desktop: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
        mobile: 'Mozilla/5.0 (Mobile; rv:89.0) Gecko/89.0 Firefox/89.0',
        old: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:70.0) Gecko/20100101 Firefox/70.0'
    },
    safari: {
        desktop: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
        ios: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1',
        ipad: 'Mozilla/5.0 (iPad; CPU OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1',
        old: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.2 Safari/605.1.15'
    },
    samsung: {
        mobile: 'Mozilla/5.0 (Linux; Android 11; SAMSUNG SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/14.2 Chrome/87.0.4280.141 Mobile Safari/537.36'
    },
    opera: {
        desktop: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 OPR/77.0.4054.172'
    },
    unknown: 'Mozilla/5.0 (Unknown Device) UnknownBrowser/1.0'
};

// Test utilities
class CrossPlatformDetectorTest {
    constructor() {
        this.originalUserAgent = navigator.userAgent;
        this.originalNavigator = { ...navigator };
        this.testResults = [];
    }

    /**
     * Mock navigator.userAgent for testing
     * @param {string} userAgent - User agent string to mock
     */
    mockUserAgent(userAgent) {
        Object.defineProperty(navigator, 'userAgent', {
            get: () => userAgent,
            configurable: true
        });
    }

    /**
     * Mock window properties for testing
     * @param {Object} properties - Properties to mock
     */
    mockWindowProperties(properties) {
        this.originalWindow = {};
        Object.keys(properties).forEach(key => {
            this.originalWindow[key] = window[key];
            window[key] = properties[key];
        });
    }

    /**
     * Restore original navigator and window properties
     */
    restoreMocks() {
        Object.defineProperty(navigator, 'userAgent', {
            get: () => this.originalUserAgent,
            configurable: true
        });

        if (this.originalWindow) {
            Object.keys(this.originalWindow).forEach(key => {
                window[key] = this.originalWindow[key];
            });
        }
    }

    /**
     * Run a test and record results
     * @param {string} testName - Name of the test
     * @param {Function} testFunction - Test function to run
     */
    runTest(testName, testFunction) {
        try {
            console.log(`Running test: ${testName}`);
            const result = testFunction();
            this.testResults.push({
                name: testName,
                passed: true,
                result: result,
                error: null
            });
            console.log(`✅ ${testName} - PASSED`);
            return result;
        } catch (error) {
            this.testResults.push({
                name: testName,
                passed: false,
                result: null,
                error: error.message
            });
            console.error(`❌ ${testName} - FAILED:`, error.message);
            return null;
        }
    }

    /**
     * Assert that two values are equal
     * @param {*} actual - Actual value
     * @param {*} expected - Expected value
     * @param {string} message - Error message
     */
    assertEqual(actual, expected, message = '') {
        if (actual !== expected) {
            throw new Error(`${message} - Expected: ${expected}, Actual: ${actual}`);
        }
    }

    /**
     * Assert that a value is true
     * @param {*} value - Value to check
     * @param {string} message - Error message
     */
    assertTrue(value, message = '') {
        if (!value) {
            throw new Error(`${message} - Expected true, got: ${value}`);
        }
    }

    /**
     * Assert that a value is false
     * @param {*} value - Value to check
     * @param {string} message - Error message
     */
    assertFalse(value, message = '') {
        if (value) {
            throw new Error(`${message} - Expected false, got: ${value}`);
        }
    }

    /**
     * Test Chrome browser detection
     */
    testChromeDetection() {
        return this.runTest('Chrome Detection', () => {
            // Test desktop Chrome
            this.mockUserAgent(mockUserAgents.chrome.desktop);
            let detector = new CrossPlatformDetector();
            this.assertEqual(detector.browser.name, 'chrome', 'Desktop Chrome browser name');
            this.assertEqual(detector.browser.engine, 'blink', 'Chrome engine');
            this.assertTrue(detector.browser.version.startsWith('91'), 'Chrome version');

            // Test mobile Chrome
            this.mockUserAgent(mockUserAgents.chrome.mobile);
            detector = new CrossPlatformDetector();
            this.assertEqual(detector.browser.name, 'chrome', 'Mobile Chrome browser name');
            this.assertEqual(detector.platform.name, 'android', 'Android platform');
            this.assertTrue(detector.platform.isMobile, 'Mobile platform');

            return 'Chrome detection tests passed';
        });
    }

    /**
     * Test Edge browser detection
     */
    testEdgeDetection() {
        return this.runTest('Edge Detection', () => {
            // Test desktop Edge
            this.mockUserAgent(mockUserAgents.edge.desktop);
            let detector = new CrossPlatformDetector();
            this.assertEqual(detector.browser.name, 'edge', 'Desktop Edge browser name');
            this.assertEqual(detector.browser.engine, 'blink', 'Edge engine');
            this.assertTrue(detector.browser.version.startsWith('91'), 'Edge version');

            return 'Edge detection tests passed';
        });
    }

    /**
     * Test Firefox browser detection
     */
    testFirefoxDetection() {
        return this.runTest('Firefox Detection', () => {
            // Test desktop Firefox
            this.mockUserAgent(mockUserAgents.firefox.desktop);
            let detector = new CrossPlatformDetector();
            this.assertEqual(detector.browser.name, 'firefox', 'Desktop Firefox browser name');
            this.assertEqual(detector.browser.engine, 'gecko', 'Firefox engine');
            this.assertTrue(detector.browser.version.startsWith('89'), 'Firefox version');

            // Test old Firefox
            this.mockUserAgent(mockUserAgents.firefox.old);
            detector = new CrossPlatformDetector();
            this.assertEqual(detector.browser.name, 'firefox', 'Old Firefox browser name');
            this.assertTrue(detector.browser.version.startsWith('70'), 'Old Firefox version');

            return 'Firefox detection tests passed';
        });
    }

    /**
     * Test Safari browser detection
     */
    testSafariDetection() {
        return this.runTest('Safari Detection', () => {
            // Test desktop Safari
            this.mockUserAgent(mockUserAgents.safari.desktop);
            let detector = new CrossPlatformDetector();
            this.assertEqual(detector.browser.name, 'safari', 'Desktop Safari browser name');
            this.assertEqual(detector.browser.engine, 'webkit', 'Safari engine');
            this.assertEqual(detector.platform.name, 'macos', 'macOS platform');

            // Test iOS Safari
            this.mockUserAgent(mockUserAgents.safari.ios);
            detector = new CrossPlatformDetector();
            this.assertEqual(detector.browser.name, 'safari', 'iOS Safari browser name');
            this.assertEqual(detector.platform.name, 'ios', 'iOS platform');
            this.assertTrue(detector.platform.isMobile, 'iOS mobile');

            // Test iPad Safari
            this.mockUserAgent(mockUserAgents.safari.ipad);
            detector = new CrossPlatformDetector();
            this.assertEqual(detector.platform.name, 'ios', 'iPad platform');
            this.assertTrue(detector.platform.isTablet, 'iPad tablet');

            return 'Safari detection tests passed';
        });
    }

    /**
     * Test Samsung Internet detection
     */
    testSamsungDetection() {
        return this.runTest('Samsung Internet Detection', () => {
            this.mockUserAgent(mockUserAgents.samsung.mobile);
            const detector = new CrossPlatformDetector();
            this.assertEqual(detector.browser.name, 'samsung', 'Samsung browser name');
            this.assertEqual(detector.browser.engine, 'blink', 'Samsung engine');
            this.assertTrue(detector.browser.version.startsWith('14'), 'Samsung version');

            return 'Samsung Internet detection tests passed';
        });
    }

    /**
     * Test Opera browser detection
     */
    testOperaDetection() {
        return this.runTest('Opera Detection', () => {
            this.mockUserAgent(mockUserAgents.opera.desktop);
            const detector = new CrossPlatformDetector();
            this.assertEqual(detector.browser.name, 'opera', 'Opera browser name');
            this.assertEqual(detector.browser.engine, 'blink', 'Opera engine');

            return 'Opera detection tests passed';
        });
    }

    /**
     * Test platform detection accuracy
     */
    testPlatformDetection() {
        return this.runTest('Platform Detection', () => {
            // Test Windows
            this.mockUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
            let detector = new CrossPlatformDetector();
            this.assertEqual(detector.platform.name, 'windows', 'Windows platform');
            this.assertTrue(detector.platform.isDesktop, 'Windows desktop');

            // Test macOS
            this.mockUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15');
            detector = new CrossPlatformDetector();
            this.assertEqual(detector.platform.name, 'macos', 'macOS platform');
            this.assertTrue(detector.platform.isDesktop, 'macOS desktop');

            // Test Linux
            this.mockUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36');
            detector = new CrossPlatformDetector();
            this.assertEqual(detector.platform.name, 'linux', 'Linux platform');
            this.assertTrue(detector.platform.isDesktop, 'Linux desktop');

            return 'Platform detection tests passed';
        });
    }

    /**
     * Test PWA support detection
     */
    testPWASupport() {
        return this.runTest('PWA Support Detection', () => {
            // Mock modern Chrome with PWA support
            this.mockUserAgent(mockUserAgents.chrome.desktop);
            this.mockWindowProperties({
                onbeforeinstallprompt: {},
                matchMedia: (query) => ({
                    matches: query === '(display-mode: standalone)',
                    addEventListener: () => {}
                })
            });

            const detector = new CrossPlatformDetector();
            const pwaSupport = detector.getPWASupport();

            this.assertTrue(pwaSupport.serviceWorker, 'Service Worker support');
            this.assertTrue(pwaSupport.installPrompt, 'Install prompt support');
            this.assertTrue(pwaSupport.isFullySupported, 'Full PWA support');

            return 'PWA support detection tests passed';
        });
    }

    /**
     * Test standalone mode detection
     */
    testStandaloneModeDetection() {
        return this.runTest('Standalone Mode Detection', () => {
            // Test standalone mode detection
            this.mockUserAgent(mockUserAgents.chrome.desktop);
            this.mockWindowProperties({
                matchMedia: (query) => ({
                    matches: query === '(display-mode: standalone)',
                    addEventListener: () => {}
                })
            });

            const detector = new CrossPlatformDetector();
            this.assertTrue(detector.isStandalone(), 'Standalone mode detected');

            // Test non-standalone mode
            this.mockWindowProperties({
                matchMedia: (query) => ({
                    matches: false,
                    addEventListener: () => {}
                })
            });

            const detector2 = new CrossPlatformDetector();
            this.assertFalse(detector2.isStandalone(), 'Non-standalone mode detected');

            return 'Standalone mode detection tests passed';
        });
    }

    /**
     * Test installation instructions generation
     */
    testInstallationInstructions() {
        return this.runTest('Installation Instructions', () => {
            // Test iOS Safari instructions
            this.mockUserAgent(mockUserAgents.safari.ios);
            let detector = new CrossPlatformDetector();
            let instructions = detector.getInstallationInstructions();
            this.assertEqual(instructions.platform, 'ios', 'iOS instructions platform');
            this.assertTrue(instructions.supported, 'iOS Safari supported');
            this.assertTrue(instructions.steps.length > 0, 'iOS has installation steps');

            // Test Firefox instructions
            this.mockUserAgent(mockUserAgents.firefox.desktop);
            detector = new CrossPlatformDetector();
            instructions = detector.getInstallationInstructions();
            this.assertEqual(instructions.platform, 'firefox', 'Firefox instructions platform');

            // Test Chrome native support
            this.mockUserAgent(mockUserAgents.chrome.desktop);
            this.mockWindowProperties({
                onbeforeinstallprompt: {}
            });
            detector = new CrossPlatformDetector();
            instructions = detector.getInstallationInstructions();
            this.assertEqual(instructions.platform, 'native', 'Chrome native support');

            return 'Installation instructions tests passed';
        });
    }

    /**
     * Test edge cases and error handling
     */
    testEdgeCases() {
        return this.runTest('Edge Cases', () => {
            // Test unknown browser
            this.mockUserAgent(mockUserAgents.unknown);
            let detector = new CrossPlatformDetector();
            this.assertEqual(detector.browser.name, 'unknown', 'Unknown browser detected');
            this.assertEqual(detector.platform.name, 'unknown', 'Unknown platform detected');

            // Test empty user agent
            this.mockUserAgent('');
            detector = new CrossPlatformDetector();
            this.assertEqual(detector.browser.name, 'unknown', 'Empty user agent handled');

            // Test malformed user agent
            this.mockUserAgent('malformed/user/agent/string');
            detector = new CrossPlatformDetector();
            this.assertEqual(detector.browser.name, 'unknown', 'Malformed user agent handled');

            return 'Edge cases tests passed';
        });
    }

    /**
     * Test version parsing accuracy
     */
    testVersionParsing() {
        return this.runTest('Version Parsing', () => {
            // Test Chrome version parsing
            this.mockUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
            let detector = new CrossPlatformDetector();
            this.assertEqual(detector.browser.version, '91.0.4472.124', 'Chrome version parsing');

            // Test Firefox version parsing
            this.mockUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0');
            detector = new CrossPlatformDetector();
            this.assertEqual(detector.browser.version, '89.0', 'Firefox version parsing');

            // Test Safari version parsing
            this.mockUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15');
            detector = new CrossPlatformDetector();
            this.assertEqual(detector.browser.version, '14.1.1', 'Safari version parsing');

            return 'Version parsing tests passed';
        });
    }

    /**
     * Test environment summary generation
     */
    testEnvironmentSummary() {
        return this.runTest('Environment Summary', () => {
            this.mockUserAgent(mockUserAgents.chrome.desktop);
            const detector = new CrossPlatformDetector();
            const summary = detector.getEnvironmentSummary();

            this.assertTrue(summary.platform !== undefined, 'Platform info included');
            this.assertTrue(summary.browser !== undefined, 'Browser info included');
            this.assertTrue(summary.pwaSupport !== undefined, 'PWA support info included');
            this.assertTrue(summary.installationInstructions !== undefined, 'Installation instructions included');
            this.assertTrue(summary.capabilities !== undefined, 'Capabilities info included');
            this.assertTrue(summary.timestamp !== undefined, 'Timestamp included');

            return 'Environment summary tests passed';
        });
    }

    /**
     * Run all tests
     */
    runAllTests() {
        console.log('🧪 Starting CrossPlatformDetector Tests...\n');

        this.testChromeDetection();
        this.testEdgeDetection();
        this.testFirefoxDetection();
        this.testSafariDetection();
        this.testSamsungDetection();
        this.testOperaDetection();
        this.testPlatformDetection();
        this.testPWASupport();
        this.testStandaloneModeDetection();
        this.testInstallationInstructions();
        this.testEdgeCases();
        this.testVersionParsing();
        this.testEnvironmentSummary();

        // Restore original state
        this.restoreMocks();

        // Print summary
        this.printTestSummary();
    }

    /**
     * Print test results summary
     */
    printTestSummary() {
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(test => test.passed).length;
        const failedTests = totalTests - passedTests;

        console.log('\n📊 Test Results Summary:');
        console.log(`Total Tests: ${totalTests}`);
        console.log(`✅ Passed: ${passedTests}`);
        console.log(`❌ Failed: ${failedTests}`);
        console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);

        if (failedTests > 0) {
            console.log('\n❌ Failed Tests:');
            this.testResults
                .filter(test => !test.passed)
                .forEach(test => {
                    console.log(`  - ${test.name}: ${test.error}`);
                });
        }

        return {
            total: totalTests,
            passed: passedTests,
            failed: failedTests,
            successRate: Math.round((passedTests / totalTests) * 100)
        };
    }

    /**
     * Get test results for external use
     */
    getTestResults() {
        return {
            results: this.testResults,
            summary: this.printTestSummary()
        };
    }
}

// Make test class available globally for manual testing
window.CrossPlatformDetectorTest = CrossPlatformDetectorTest;

// Auto-run tests if this file is loaded directly
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        // Only run tests if explicitly requested
        if (window.location.search.includes('runTests=true')) {
            const tester = new CrossPlatformDetectorTest();
            tester.runAllTests();
        }
    });
}