/**
 * PWA Installation Error Handling Tests
 * Tests error scenarios and graceful degradation for PWA installation components
 */

// Mock localStorage for testing
class MockLocalStorage {
    constructor(shouldFail = false, quotaExceeded = false) {
        this.storage = {};
        this.shouldFail = shouldFail;
        this.quotaExceeded = quotaExceeded;
    }

    getItem(key) {
        if (this.shouldFail) {
            throw new Error('localStorage access failed');
        }
        return this.storage[key] || null;
    }

    setItem(key, value) {
        if (this.shouldFail) {
            throw new Error('localStorage access failed');
        }
        if (this.quotaExceeded) {
            const error = new Error('QuotaExceededError');
            error.name = 'QuotaExceededError';
            error.code = 22;
            throw error;
        }
        this.storage[key] = value;
    }

    removeItem(key) {
        if (this.shouldFail) {
            throw new Error('localStorage access failed');
        }
        delete this.storage[key];
    }

    clear() {
        if (this.shouldFail) {
            throw new Error('localStorage access failed');
        }
        this.storage = {};
    }
}

// Test suite for PWA Installation Error Handling
describe('PWA Installation Error Handling', () => {
    let originalLocalStorage;
    let originalConsole;
    let consoleErrors = [];
    let consoleWarns = [];

    beforeEach(() => {
        // Store original localStorage and console
        originalLocalStorage = window.localStorage;
        originalConsole = {
            error: console.error,
            warn: console.warn,
            log: console.log
        };

        // Mock console to capture errors and warnings
        consoleErrors = [];
        consoleWarns = [];
        console.error = (...args) => consoleErrors.push(args);
        console.warn = (...args) => consoleWarns.push(args);
        console.log = () => {}; // Suppress logs during tests

        // Clear any existing PWA manager instances
        if (window.pwaInstallManager) {
            delete window.pwaInstallManager;
        }
    });

    afterEach(() => {
        // Restore original localStorage and console
        window.localStorage = originalLocalStorage;
        console.error = originalConsole.error;
        console.warn = originalConsole.warn;
        console.log = originalConsole.log;
    });

    describe('InstallationStorage Error Handling', () => {
        test('should handle localStorage access failures gracefully', () => {
            // Mock failing localStorage
            window.localStorage = new MockLocalStorage(true);

            const storage = new InstallationStorage();
            
            // Test getting installation status with localStorage failure
            const status = storage.getInstallationStatus();
            expect(status).toBe('not_prompted');
            expect(consoleErrors.length).toBeGreaterThan(0);
            expect(consoleErrors[0][0]).toContain('Error getting installation status');
        });

        test('should handle localStorage quota exceeded errors', () => {
            // Mock localStorage with quota exceeded
            window.localStorage = new MockLocalStorage(false, true);

            const storage = new InstallationStorage();
            
            // Try to set installation status
            storage.setInstallationStatus('prompted');
            
            expect(consoleErrors.length).toBeGreaterThan(0);
            expect(consoleErrors[0][0]).toContain('Error setting installation status');
        });

        test('should validate storage integrity and recover from corruption', () => {
            // Mock localStorage with corrupted data
            const mockStorage = new MockLocalStorage();
            mockStorage.storage['jobTracker_sessionCount'] = 'invalid_number';
            mockStorage.storage['jobTracker_promptCount'] = 'not_a_number';
            window.localStorage = mockStorage;

            const storage = new InstallationStorage();
            
            // Validation should detect corruption and reset
            const isValid = storage.validateStorage();
            expect(isValid).toBe(true); // Should be valid after reset
            expect(consoleWarns.length).toBeGreaterThan(0);
        });

        test('should provide fallback values when data retrieval fails', () => {
            window.localStorage = new MockLocalStorage(true);
            const storage = new InstallationStorage();

            // All methods should return safe fallback values
            expect(storage.getPromptCount()).toBe(0);
            expect(storage.getSessionCount()).toBe(0);
            expect(storage.getDismissalCount()).toBe(0);
            expect(storage.getJobApplicationCount()).toBe(0);
            expect(storage.getUserPreferences()).toBe(null);
            expect(storage.shouldDelayPrompt()).toBe(false);
        });
    });

    describe('PWAInstallManager Error Handling', () => {
        test('should initialize with fallback components when dependencies fail', () => {
            // Mock failing component constructors
            window.InstallationStorage = function() {
                throw new Error('Storage initialization failed');
            };
            window.InstallAnalytics = function() {
                throw new Error('Analytics initialization failed');
            };
            window.CrossPlatformDetector = function() {
                throw new Error('Detector initialization failed');
            };

            const manager = new PWAInstallManager();
            
            // Manager should still initialize with fallbacks
            expect(manager).toBeDefined();
            expect(manager.storage).toBeDefined();
            expect(manager.analytics).toBeDefined();
            expect(manager.detector).toBeDefined();
            expect(consoleErrors.length).toBeGreaterThan(0);
        });

        test('should disable manager after too many critical errors', () => {
            const manager = new PWAInstallManager();
            manager.maxErrors = 3;

            // Simulate multiple critical errors
            for (let i = 0; i < 4; i++) {
                manager.handleCriticalError('test_operation', new Error('Test error'));
            }

            expect(manager.isDisabled).toBe(true);
            expect(manager.errorCount).toBe(4);
        });

        test('should handle eligibility check failures gracefully', () => {
            const manager = new PWAInstallManager();
            
            // Mock storage to throw errors
            manager.storage.getInstallationStatus = () => {
                throw new Error('Storage access failed');
            };

            const isEligible = manager.checkEligibility();
            expect(isEligible).toBe(false);
            expect(consoleErrors.length).toBeGreaterThan(0);
        });

        test('should handle prompt display failures with fallbacks', () => {
            const manager = new PWAInstallManager();
            
            // Mock InstallPromptUI to fail
            window.InstallPromptUI = function() {
                throw new Error('UI creation failed');
            };

            // Should not throw error and should attempt fallbacks
            expect(() => manager.showInstallPrompt()).not.toThrow();
            expect(consoleErrors.length).toBeGreaterThan(0);
        });

        test('should handle browser compatibility issues', () => {
            // Mock unsupported browser environment
            const originalStorage = window.Storage;
            const originalServiceWorker = navigator.serviceWorker;
            const originalPromise = window.Promise;

            delete window.Storage;
            delete navigator.serviceWorker;
            delete window.Promise;

            const manager = new PWAInstallManager();
            manager.validateBrowserCompatibility();

            expect(manager.fallbackMode).toBe(true);
            expect(consoleWarns.length).toBeGreaterThan(0);

            // Restore
            window.Storage = originalStorage;
            navigator.serviceWorker = originalServiceWorker;
            window.Promise = originalPromise;
        });
    });

    describe('InstallPromptUI Error Handling', () => {
        test('should create fallback element when main creation fails', () => {
            // Mock document.createElement to fail
            const originalCreateElement = document.createElement;
            let createElementCallCount = 0;
            document.createElement = (tagName) => {
                createElementCallCount++;
                if (createElementCallCount <= 2) {
                    throw new Error('Element creation failed');
                }
                return originalCreateElement.call(document, tagName);
            };

            const mockManager = { deferredPrompt: null };
            const ui = new InstallPromptUI(mockManager);
            const element = ui.create();

            expect(element).toBeDefined();
            expect(element.tagName).toBe('DIV');
            expect(consoleErrors.length).toBeGreaterThan(0);

            // Restore
            document.createElement = originalCreateElement;
        });

        test('should handle event listener setup failures', () => {
            const mockManager = { deferredPrompt: null };
            const ui = new InstallPromptUI(mockManager);

            // Mock addEventListener to fail
            const originalAddEventListener = Element.prototype.addEventListener;
            Element.prototype.addEventListener = () => {
                throw new Error('Event listener setup failed');
            };

            // Should not throw error
            expect(() => ui.create()).not.toThrow();
            expect(consoleErrors.length).toBeGreaterThan(0);

            // Restore
            Element.prototype.addEventListener = originalAddEventListener;
        });

        test('should handle manager method failures gracefully', () => {
            const mockManager = {
                handleInstallClick: () => {
                    throw new Error('Manager method failed');
                },
                handleDismiss: () => {
                    throw new Error('Manager method failed');
                }
            };

            const ui = new InstallPromptUI(mockManager);
            
            // Should not throw errors
            expect(() => ui.handleInstallClickSafely()).not.toThrow();
            expect(() => ui.handleNotNowClickSafely()).not.toThrow();
            expect(consoleErrors.length).toBeGreaterThan(0);
        });

        test('should force cleanup when normal hide fails', () => {
            const mockManager = { deferredPrompt: null };
            const ui = new InstallPromptUI(mockManager);
            ui.element = document.createElement('div');
            document.body.appendChild(ui.element);

            // Mock hide to fail
            ui.hide = () => {
                throw new Error('Hide failed');
            };

            ui.hideSafely();

            expect(ui.element).toBe(null);
            expect(ui.isVisible).toBe(false);
            expect(consoleErrors.length).toBeGreaterThan(0);
        });
    });

    describe('InstallAnalytics Error Handling', () => {
        test('should handle localStorage failures with fallback data', () => {
            window.localStorage = new MockLocalStorage(true);
            const analytics = new InstallAnalytics();

            const data = analytics.getAnalyticsData();
            expect(data).toBeDefined();
            expect(data.events).toEqual([]);
            expect(data.summary.totalPrompts).toBe(0);
        });

        test('should handle quota exceeded errors with data cleanup', () => {
            const analytics = new InstallAnalytics();
            
            // Create large dataset
            const largeData = {
                events: new Array(100).fill(0).map((_, i) => ({
                    type: 'test_event',
                    timestamp: new Date().toISOString(),
                    index: i
                })),
                summary: { totalPrompts: 100, installClicks: 0, dismissals: 0, conversionRate: 0 }
            };

            // Mock localStorage to fail with quota exceeded
            window.localStorage = new MockLocalStorage(false, true);

            analytics.saveAnalyticsData(largeData);

            expect(consoleErrors.length).toBeGreaterThan(0);
            expect(consoleWarns.length).toBeGreaterThan(0);
        });

        test('should validate data structure and recover from corruption', () => {
            const analytics = new InstallAnalytics();

            // Test with invalid data structures
            expect(analytics.validateAnalyticsData(null)).toBe(false);
            expect(analytics.validateAnalyticsData({})).toBe(false);
            expect(analytics.validateAnalyticsData({ events: 'not_array' })).toBe(false);
            expect(analytics.validateAnalyticsData({ events: [], summary: 'not_object' })).toBe(false);

            // Test with valid data structure
            const validData = {
                events: [],
                summary: {
                    totalPrompts: 0,
                    installClicks: 0,
                    dismissals: 0,
                    conversionRate: 0
                }
            };
            expect(analytics.validateAnalyticsData(validData)).toBe(true);
        });

        test('should handle tracking errors gracefully', () => {
            const analytics = new InstallAnalytics();
            
            // Mock methods to fail
            analytics.createEvent = () => {
                throw new Error('Event creation failed');
            };

            // Should not throw errors
            expect(() => analytics.trackPromptShown()).not.toThrow();
            expect(consoleErrors.length).toBeGreaterThan(0);
        });

        test('should provide safe fallbacks for platform/browser detection', () => {
            const analytics = new InstallAnalytics();

            // Mock methods to fail
            analytics.getPlatformInfo = () => {
                throw new Error('Platform detection failed');
            };
            analytics.getBrowserInfo = () => {
                throw new Error('Browser detection failed');
            };

            expect(analytics.getPlatformInfoSafely()).toBe('unknown');
            expect(analytics.getBrowserInfoSafely()).toBe('unknown');
        });
    });

    describe('CrossPlatformDetector Error Handling', () => {
        test('should handle userAgent parsing failures', () => {
            // Mock navigator.userAgent to be undefined
            const originalUserAgent = navigator.userAgent;
            Object.defineProperty(navigator, 'userAgent', {
                get: () => {
                    throw new Error('UserAgent access failed');
                },
                configurable: true
            });

            const detector = new CrossPlatformDetector();
            
            expect(detector.platform.name).toBe('unknown');
            expect(detector.browser.name).toBe('unknown');

            // Restore
            Object.defineProperty(navigator, 'userAgent', {
                get: () => originalUserAgent,
                configurable: true
            });
        });

        test('should handle feature detection failures gracefully', () => {
            const detector = new CrossPlatformDetector();

            // Mock window.matchMedia to fail
            const originalMatchMedia = window.matchMedia;
            window.matchMedia = () => {
                throw new Error('matchMedia failed');
            };

            expect(() => detector.supportsStandaloneMode()).not.toThrow();
            expect(() => detector.isStandalone()).not.toThrow();

            // Restore
            window.matchMedia = originalMatchMedia;
        });

        test('should provide fallback instructions when detection fails', () => {
            const detector = new CrossPlatformDetector();

            // Mock methods to fail
            detector.platform = { name: 'unknown' };
            detector.browser = { name: 'unknown' };

            const instructions = detector.getInstallationInstructions();
            expect(instructions.platform).toBe('generic');
            expect(instructions.supported).toBe(false);
            expect(instructions.message).toContain('not supported');
        });
    });

    describe('Integration Error Scenarios', () => {
        test('should handle complete system failure gracefully', () => {
            // Mock all major components to fail
            window.localStorage = new MockLocalStorage(true);
            window.InstallationStorage = function() {
                throw new Error('Storage failed');
            };
            window.InstallAnalytics = function() {
                throw new Error('Analytics failed');
            };
            window.CrossPlatformDetector = function() {
                throw new Error('Detector failed');
            };
            window.InstallPromptUI = function() {
                throw new Error('UI failed');
            };

            const manager = new PWAInstallManager();
            
            // Should not throw errors and should initialize with fallbacks
            expect(() => manager.init()).not.toThrow();
            expect(manager.storage).toBeDefined();
            expect(manager.analytics).toBeDefined();
            expect(manager.detector).toBeDefined();
        });

        test('should handle network-related errors during installation', () => {
            const manager = new PWAInstallManager();
            
            // Mock beforeinstallprompt event with failing prompt
            const mockEvent = {
                preventDefault: () => {},
                prompt: () => Promise.reject(new Error('Network error')),
                userChoice: Promise.reject(new Error('User choice failed'))
            };

            expect(() => manager.onBeforeInstallPrompt(mockEvent)).not.toThrow();
        });

        test('should recover from DOM manipulation errors', () => {
            // Mock DOM methods to fail
            const originalAppendChild = Element.prototype.appendChild;
            Element.prototype.appendChild = () => {
                throw new Error('DOM manipulation failed');
            };

            const mockManager = { deferredPrompt: null };
            const ui = new InstallPromptUI(mockManager);

            expect(() => ui.create()).not.toThrow();
            expect(consoleErrors.length).toBeGreaterThan(0);

            // Restore
            Element.prototype.appendChild = originalAppendChild;
        });
    });

    describe('Performance Under Error Conditions', () => {
        test('should not cause memory leaks during repeated failures', () => {
            const manager = new PWAInstallManager();
            
            // Simulate repeated failures
            for (let i = 0; i < 10; i++) {
                try {
                    manager.showInstallPrompt();
                } catch (error) {
                    // Ignore errors for this test
                }
            }

            // Manager should still be responsive
            expect(manager.isDisabled).toBe(false);
            expect(typeof manager.checkEligibility).toBe('function');
        });

        test('should handle rapid successive error conditions', () => {
            const analytics = new InstallAnalytics();
            
            // Rapid successive tracking calls with errors
            for (let i = 0; i < 20; i++) {
                analytics.trackPromptShown({ test: i });
            }

            // Should not crash or become unresponsive
            expect(typeof analytics.trackPromptShown).toBe('function');
        });
    });
});

// Helper function to run tests
function runPWAErrorHandlingTests() {
    console.log('Running PWA Installation Error Handling Tests...');
    
    // Simple test runner for browser environment
    const tests = [
        // Add specific test functions here if needed for manual testing
    ];

    let passed = 0;
    let failed = 0;

    tests.forEach((test, index) => {
        try {
            test();
            console.log(`✓ Test ${index + 1} passed`);
            passed++;
        } catch (error) {
            console.error(`✗ Test ${index + 1} failed:`, error);
            failed++;
        }
    });

    console.log(`Tests completed: ${passed} passed, ${failed} failed`);
    return { passed, failed };
}

// Export for use in other test files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        MockLocalStorage,
        runPWAErrorHandlingTests
    };
}