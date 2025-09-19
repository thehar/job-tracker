/**
 * PWA Installation Integration Test Runner
 * Comprehensive testing suite for the complete PWA installation flow
 */

class PWAIntegrationTestRunner {
    constructor() {
        this.testSuites = {
            eligibility: new EligibilityTestSuite(),
            crossBrowser: new CrossBrowserTestSuite(),
            analytics: new AnalyticsTestSuite(),
            accessibility: new AccessibilityTestSuite(),
            endToEnd: new EndToEndTestSuite()
        };
        this.results = {};
        this.startTime = null;
        this.endTime = null;
    }

    async runAllTests() {
        console.log('🚀 Starting PWA Installation Integration Tests...');
        this.startTime = Date.now();
        
        for (const [suiteName, suite] of Object.entries(this.testSuites)) {
            console.log(`\n📋 Running ${suiteName} tests...`);
            try {
                this.results[suiteName] = await suite.run();
                const passed = this.results[suiteName].filter(r => r.passed).length;
                const total = this.results[suiteName].length;
                console.log(`✅ ${suiteName}: ${passed}/${total} tests passed`);
            } catch (error) {
                console.error(`❌ ${suiteName} test suite failed:`, error);
                this.results[suiteName] = [{ 
                    name: 'Suite Execution', 
                    passed: false, 
                    error: error.message 
                }];
            }
        }
        
        this.endTime = Date.now();
        this.generateReport();
        return this.results;
    }

    generateReport() {
        const totalTests = Object.values(this.results).flat().length;
        const passedTests = Object.values(this.results).flat().filter(r => r.passed).length;
        const duration = this.endTime - this.startTime;
        
        console.log('\n📊 PWA Installation Integration Test Report');
        console.log('='.repeat(50));
        console.log(`Total Tests: ${totalTests}`);
        console.log(`Passed: ${passedTests}`);
        console.log(`Failed: ${totalTests - passedTests}`);
        console.log(`Pass Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
        console.log(`Duration: ${duration}ms`);
        console.log('='.repeat(50));
        
        // Detailed results by suite
        for (const [suiteName, results] of Object.entries(this.results)) {
            console.log(`\n${suiteName.toUpperCase()} RESULTS:`);
            results.forEach(result => {
                const status = result.passed ? '✅' : '❌';
                console.log(`  ${status} ${result.name}: ${result.message || 'OK'}`);
                if (result.error) {
                    console.log(`    Error: ${result.error}`);
                }
            });
        }
    }

    exportResults() {
        const report = {
            timestamp: new Date().toISOString(),
            duration: this.endTime - this.startTime,
            summary: {
                totalTests: Object.values(this.results).flat().length,
                passedTests: Object.values(this.results).flat().filter(r => r.passed).length,
                failedTests: Object.values(this.results).flat().filter(r => !r.passed).length
            },
            results: this.results,
            environment: {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                language: navigator.language,
                cookieEnabled: navigator.cookieEnabled,
                onLine: navigator.onLine
            }
        };
        
        return report;
    }
}

class EligibilityTestSuite {
    async run() {
        const tests = [];
        const pwaManager = new PWAInstallManager();
        const storage = new InstallationStorage();
        
        // Test 1: Fresh user eligibility
        storage.reset();
        tests.push({
            name: 'Fresh user should not be eligible',
            passed: !pwaManager.checkEligibility(),
            message: 'Fresh users should not see installation prompts'
        });
        
        // Test 2: Session count requirement
        storage.setSessionCount(3);
        storage.setJobCount(1);
        tests.push({
            name: 'Insufficient jobs should not be eligible',
            passed: !pwaManager.checkEligibility(),
            message: 'Users with insufficient job applications should not be eligible'
        });
        
        // Test 3: Job count requirement
        storage.setSessionCount(2);
        storage.setJobCount(2);
        tests.push({
            name: 'Insufficient sessions should not be eligible',
            passed: !pwaManager.checkEligibility(),
            message: 'Users with insufficient sessions should not be eligible'
        });
        
        // Test 4: Both requirements met
        storage.setSessionCount(3);
        storage.setJobCount(2);
        tests.push({
            name: 'Meeting both requirements should be eligible',
            passed: pwaManager.checkEligibility(),
            message: 'Users meeting both criteria should be eligible'
        });
        
        // Test 5: Already installed
        storage.setInstallationStatus('installed');
        tests.push({
            name: 'Installed users should not be eligible',
            passed: !pwaManager.checkEligibility(),
            message: 'Already installed users should not see prompts'
        });
        
        // Test 6: Don't ask again preference
        storage.setInstallationStatus('dont_ask');
        tests.push({
            name: 'Don\'t ask again users should not be eligible',
            passed: !pwaManager.checkEligibility(),
            message: 'Users who chose "don\'t ask again" should not see prompts'
        });
        
        // Test 7: Dismissal count limit
        storage.setInstallationStatus('dismissed');
        storage.setDismissalCount(3);
        tests.push({
            name: 'Users with 3+ dismissals should not be eligible',
            passed: !pwaManager.checkEligibility(),
            message: 'Users who dismissed 3+ times should not see prompts'
        });
        
        return tests;
    }
}

class CrossBrowserTestSuite {
    async run() {
        const tests = [];
        const detector = new CrossPlatformDetector();
        
        // Test browser detection
        const browserInfo = detector.getBrowserInfo();
        tests.push({
            name: 'Browser detection',
            passed: browserInfo && browserInfo.name,
            message: `Detected: ${browserInfo?.name || 'Unknown'} ${browserInfo?.version || ''}`
        });
        
        // Test platform detection
        const platformInfo = detector.getPlatformInfo();
        tests.push({
            name: 'Platform detection',
            passed: platformInfo && platformInfo.name,
            message: `Detected: ${platformInfo?.name || 'Unknown'}`
        });
        
        // Test PWA support detection
        const supportsInstall = detector.supportsInstallPrompt();
        tests.push({
            name: 'PWA install support detection',
            passed: typeof supportsInstall === 'boolean',
            message: `Install support: ${supportsInstall ? 'Yes' : 'No'}`
        });
        
        // Test standalone mode detection
        const isStandalone = detector.isStandalone();
        tests.push({
            name: 'Standalone mode detection',
            passed: typeof isStandalone === 'boolean',
            message: `Standalone mode: ${isStandalone ? 'Yes' : 'No'}`
        });
        
        // Test iOS detection and instructions
        if (platformInfo?.name === 'iOS') {
            const instructions = detector.getIOSInstructions();
            tests.push({
                name: 'iOS installation instructions',
                passed: instructions && instructions.length > 0,
                message: `Instructions provided: ${instructions ? 'Yes' : 'No'}`
            });
        }
        
        // Test Firefox detection and instructions
        if (browserInfo?.name === 'Firefox') {
            const instructions = detector.getFirefoxInstructions();
            tests.push({
                name: 'Firefox installation instructions',
                passed: instructions && instructions.length > 0,
                message: `Instructions provided: ${instructions ? 'Yes' : 'No'}`
            });
        }
        
        return tests;
    }
}

class AnalyticsTestSuite {
    async run() {
        const tests = [];
        const analytics = new InstallAnalytics();
        
        // Test event tracking
        analytics.trackPromptShown();
        analytics.trackInstallClick();
        analytics.trackDismiss();
        analytics.trackInstallSuccess();
        
        const metrics = analytics.getInstallMetrics();
        
        tests.push({
            name: 'Event tracking',
            passed: metrics.events && metrics.events.length === 4,
            message: `Tracked ${metrics.events?.length || 0} events`
        });
        
        tests.push({
            name: 'Metrics calculation',
            passed: metrics.summary && typeof metrics.summary.conversionRate === 'number',
            message: `Conversion rate: ${metrics.summary?.conversionRate || 0}%`
        });
        
        // Test analytics export
        const exportData = analytics.exportAnalytics();
        tests.push({
            name: 'Analytics export',
            passed: exportData && exportData.events && exportData.summary,
            message: 'Export data structure valid'
        });
        
        // Test dashboard integration (if available)
        if (typeof window.updateInstallationMetrics === 'function') {
            try {
                window.updateInstallationMetrics();
                tests.push({
                    name: 'Dashboard integration',
                    passed: true,
                    message: 'Dashboard metrics updated successfully'
                });
            } catch (error) {
                tests.push({
                    name: 'Dashboard integration',
                    passed: false,
                    message: 'Dashboard update failed',
                    error: error.message
                });
            }
        }
        
        return tests;
    }
}

class AccessibilityTestSuite {
    async run() {
        const tests = [];
        
        // Create a test installation prompt to check accessibility
        const pwaManager = new PWAInstallManager();
        const promptUI = new InstallPromptUI(pwaManager);
        
        try {
            promptUI.create();
            const promptElement = promptUI.element;
            
            if (promptElement) {
                // Test ARIA labels
                const hasAriaLabel = promptElement.getAttribute('aria-label') || 
                                   promptElement.getAttribute('aria-labelledby');
                tests.push({
                    name: 'ARIA labels',
                    passed: !!hasAriaLabel,
                    message: hasAriaLabel ? 'ARIA labels present' : 'Missing ARIA labels'
                });
                
                // Test role attribute
                const hasRole = promptElement.getAttribute('role');
                tests.push({
                    name: 'ARIA role',
                    passed: hasRole === 'dialog' || hasRole === 'alertdialog',
                    message: `Role: ${hasRole || 'none'}`
                });
                
                // Test keyboard navigation
                const focusableElements = promptElement.querySelectorAll(
                    'button, [tabindex]:not([tabindex="-1"])'
                );
                tests.push({
                    name: 'Focusable elements',
                    passed: focusableElements.length > 0,
                    message: `Found ${focusableElements.length} focusable elements`
                });
                
                // Test button accessibility
                const buttons = promptElement.querySelectorAll('button');
                let allButtonsAccessible = true;
                buttons.forEach(button => {
                    if (!button.textContent.trim() && !button.getAttribute('aria-label')) {
                        allButtonsAccessible = false;
                    }
                });
                tests.push({
                    name: 'Button accessibility',
                    passed: allButtonsAccessible,
                    message: allButtonsAccessible ? 'All buttons have labels' : 'Some buttons missing labels'
                });
                
                // Test focus management
                try {
                    const firstButton = buttons[0];
                    if (firstButton) {
                        firstButton.focus();
                        tests.push({
                            name: 'Focus management',
                            passed: document.activeElement === firstButton,
                            message: 'Focus can be programmatically managed'
                        });
                    }
                } catch (error) {
                    tests.push({
                        name: 'Focus management',
                        passed: false,
                        message: 'Focus management failed',
                        error: error.message
                    });
                }
            }
            
            // Clean up
            promptUI.destroy();
            
        } catch (error) {
            tests.push({
                name: 'Accessibility test setup',
                passed: false,
                message: 'Failed to create test prompt',
                error: error.message
            });
        }
        
        // Test CSS custom properties for high contrast
        const computedStyle = getComputedStyle(document.documentElement);
        const hasContrastVars = computedStyle.getPropertyValue('--primary-color') && 
                               computedStyle.getPropertyValue('--text-color');
        tests.push({
            name: 'High contrast support',
            passed: hasContrastVars,
            message: hasContrastVars ? 'Contrast variables defined' : 'Missing contrast variables'
        });
        
        return tests;
    }
}

class EndToEndTestSuite {
    async run() {
        const tests = [];
        const pwaManager = new PWAInstallManager();
        const storage = new InstallationStorage();
        
        // Test complete flow
        try {
            // Step 1: Reset and setup eligibility
            storage.reset();
            storage.setSessionCount(3);
            storage.setJobCount(2);
            
            const eligible = pwaManager.checkEligibility();
            tests.push({
                name: 'User eligibility setup',
                passed: eligible,
                message: eligible ? 'User meets eligibility criteria' : 'User does not meet criteria'
            });
            
            // Step 2: Test prompt display
            if (eligible) {
                try {
                    await pwaManager.showInstallPrompt();
                    tests.push({
                        name: 'Install prompt display',
                        passed: true,
                        message: 'Prompt displayed without errors'
                    });
                } catch (error) {
                    tests.push({
                        name: 'Install prompt display',
                        passed: false,
                        message: 'Prompt display failed',
                        error: error.message
                    });
                }
            }
            
            // Step 3: Test user interactions
            const interactions = [
                { name: 'Install click', method: 'handleInstallClick' },
                { name: 'Dismiss click', method: 'handleDismiss' },
                { name: 'Don\'t ask again', method: 'handleDontAskAgain' }
            ];
            
            for (const interaction of interactions) {
                try {
                    if (typeof pwaManager[interaction.method] === 'function') {
                        pwaManager[interaction.method]();
                        tests.push({
                            name: interaction.name,
                            passed: true,
                            message: `${interaction.method} executed successfully`
                        });
                    } else {
                        tests.push({
                            name: interaction.name,
                            passed: false,
                            message: `Method ${interaction.method} not found`
                        });
                    }
                } catch (error) {
                    tests.push({
                        name: interaction.name,
                        passed: false,
                        message: `${interaction.method} failed`,
                        error: error.message
                    });
                }
            }
            
            // Step 4: Test state persistence
            const currentStatus = storage.getInstallationStatus();
            tests.push({
                name: 'State persistence',
                passed: currentStatus !== null,
                message: `Current status: ${currentStatus}`
            });
            
            // Step 5: Test analytics integration
            const analytics = new InstallAnalytics();
            const metrics = analytics.getInstallMetrics();
            tests.push({
                name: 'Analytics integration',
                passed: metrics && metrics.events && metrics.events.length > 0,
                message: `Analytics tracking ${metrics?.events?.length || 0} events`
            });
            
        } catch (error) {
            tests.push({
                name: 'End-to-end flow',
                passed: false,
                message: 'E2E test failed',
                error: error.message
            });
        }
        
        return tests;
    }
}

// Error handling and graceful degradation tests
class ErrorHandlingTestSuite {
    async run() {
        const tests = [];
        
        // Test localStorage unavailable
        const originalSetItem = localStorage.setItem;
        localStorage.setItem = () => { throw new Error('Storage unavailable'); };
        
        try {
            const storage = new InstallationStorage();
            storage.setInstallationStatus('test');
            tests.push({
                name: 'Storage error handling',
                passed: false,
                message: 'Expected storage error but none thrown'
            });
        } catch (error) {
            tests.push({
                name: 'Storage error handling',
                passed: true,
                message: 'Storage errors handled gracefully'
            });
        } finally {
            localStorage.setItem = originalSetItem;
        }
        
        // Test DOM manipulation errors
        const originalCreateElement = document.createElement;
        document.createElement = () => { throw new Error('DOM unavailable'); };
        
        try {
            const pwaManager = new PWAInstallManager();
            const promptUI = new InstallPromptUI(pwaManager);
            promptUI.create();
            tests.push({
                name: 'DOM error handling',
                passed: false,
                message: 'Expected DOM error but none thrown'
            });
        } catch (error) {
            tests.push({
                name: 'DOM error handling',
                passed: true,
                message: 'DOM errors handled gracefully'
            });
        } finally {
            document.createElement = originalCreateElement;
        }
        
        return tests;
    }
}

// Export for use in other test files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PWAIntegrationTestRunner;
} else if (typeof window !== 'undefined') {
    window.PWAIntegrationTestRunner = PWAIntegrationTestRunner;
}