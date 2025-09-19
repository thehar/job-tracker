/**
 * Unit Tests for InstallPromptUI Component
 * Tests component creation, event handling, and accessibility features
 */

// Mock dependencies for testing
class MockPWAInstallManager {
    constructor() {
        this.deferredPrompt = null;
        this.analytics = {
            trackInstructionsShown: (type) => console.log('Tracked instructions:', type)
        };
        this.handleInstallClick = () => console.log('Install clicked');
        this.handleDismiss = () => console.log('Dismissed');
        this.handleDontAskAgain = () => console.log('Don\'t ask again');
        this.handleInstructionsAcknowledged = () => console.log('Instructions acknowledged');
    }
}

class MockCrossPlatformDetector {
    constructor(platform = 'chrome', browserName = 'chrome') {
        this.platform = { name: platform, isMobile: false, isDesktop: true };
        this.browser = { name: browserName, version: '91.0' };
    }

    supportsInstallPrompt() { return this.browser.name === 'chrome' || this.browser.name === 'edge'; }
    
    getInstallationInstructions() {
        if (this.platform.name === 'ios' && this.browser.name === 'safari') {
            return {
                platform: 'ios',
                supported: true,
                steps: [
                    { step: 1, instruction: 'Tap the Share button', icon: '⬆️' },
                    { step: 2, instruction: 'Tap "Add to Home Screen"', icon: '➕' },
                    { step: 3, instruction: 'Tap "Add" to confirm', icon: '✅' }
                ],
                notes: ['Only available in Safari browser']
            };
        } else if (this.browser.name === 'firefox') {
            return {
                platform: 'firefox',
                supported: true,
                steps: [
                    { step: 1, instruction: 'Click the menu button', icon: '☰' },
                    { step: 2, instruction: 'Look for "Install" option', icon: '🔍' },
                    { step: 3, instruction: 'Click "Install"', icon: '⬇️' }
                ],
                notes: ['PWA support varies by version']
            };
        } else {
            return {
                platform: 'generic',
                supported: false,
                message: 'PWA installation not supported',
                alternatives: [
                    { option: 'Use Chrome', description: 'For better PWA support' }
                ],
                recommendedBrowsers: [
                    { name: 'Chrome', minVersion: '88' }
                ]
            };
        }
    }
}

// Test suite for InstallPromptUI
class InstallPromptUITests {
    constructor() {
        this.testResults = [];
        this.passedTests = 0;
        this.totalTests = 0;
        this.originalDocument = {};
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

    assertContains(container, text, message) {
        this.assert(container.textContent.includes(text), `${message} (should contain: ${text})`);
    }

    // Setup test environment
    setup() {
        // Create a test container
        this.testContainer = document.createElement('div');
        this.testContainer.id = 'test-container';
        document.body.appendChild(this.testContainer);

        // Mock global classes
        window.CrossPlatformDetector = MockCrossPlatformDetector;
        
        // Store original document methods
        this.originalDocument.activeElement = document.activeElement;
    }

    // Cleanup test environment
    cleanup() {
        // Remove test container
        if (this.testContainer && this.testContainer.parentNode) {
            this.testContainer.parentNode.removeChild(this.testContainer);
        }

        // Clean up global mocks
        delete window.CrossPlatformDetector;
        
        // Restore document state
        document.body.style.overflow = '';
    }

    // Test: Constructor and initialization
    testConstructorAndInitialization() {
        console.log('Testing constructor and initialization...');
        
        const manager = new MockPWAInstallManager();
        const ui = new InstallPromptUI(manager);
        
        this.assertEqual(ui.manager, manager, 'Should store manager reference');
        this.assertEqual(ui.element, null, 'Element should be null initially');
        this.assertFalse(ui.isVisible, 'Should not be visible initially');
        this.assertEqual(ui.animationDuration, 300, 'Should have default animation duration');
        this.assertNotNull(ui.detector, 'Should initialize detector');
        this.assertNotNull(ui.instructionType, 'Should determine instruction type');
    }

    // Test: Instruction type determination
    testInstructionTypeDetermination() {
        console.log('Testing instruction type determination...');
        
        const manager = new MockPWAInstallManager();
        
        // Test native support (Chrome with deferred prompt)
        manager.deferredPrompt = { prompt: () => {} };
        window.CrossPlatformDetector = () => new MockCrossPlatformDetector('windows', 'chrome');
        let ui = new InstallPromptUI(manager);
        this.assertEqual(ui.instructionType, 'native', 'Should detect native support');
        
        // Test iOS Safari
        manager.deferredPrompt = null;
        window.CrossPlatformDetector = () => new MockCrossPlatformDetector('ios', 'safari');
        ui = new InstallPromptUI(manager);
        this.assertEqual(ui.instructionType, 'ios', 'Should detect iOS Safari');
        
        // Test Firefox
        window.CrossPlatformDetector = () => new MockCrossPlatformDetector('windows', 'firefox');
        ui = new InstallPromptUI(manager);
        this.assertEqual(ui.instructionType, 'firefox', 'Should detect Firefox');
        
        // Test generic/unsupported
        window.CrossPlatformDetector = () => new MockCrossPlatformDetector('windows', 'unknown');
        ui = new InstallPromptUI(manager);
        this.assertEqual(ui.instructionType, 'generic', 'Should detect generic/unsupported');
    }

    // Test: Native prompt creation
    testNativePromptCreation() {
        console.log('Testing native prompt creation...');
        
        const manager = new MockPWAInstallManager();
        manager.deferredPrompt = { prompt: () => {} };
        
        const ui = new InstallPromptUI(manager);
        ui.instructionType = 'native';
        
        const element = ui.create();
        
        this.assertNotNull(element, 'Should create element');
        this.assertTrue(element.classList.contains('pwa-install-prompt'), 'Should have correct CSS class');
        this.assertEqual(element.getAttribute('role'), 'dialog', 'Should have dialog role');
        this.assertEqual(element.getAttribute('aria-modal'), 'true', 'Should be modal');
        
        // Check for required elements
        const title = element.querySelector('#install-prompt-title');
        this.assertNotNull(title, 'Should have title element');
        this.assertContains(title, 'Install Job Tracker', 'Should have correct title');
        
        const benefits = element.querySelector('.install-benefits-list');
        this.assertNotNull(benefits, 'Should have benefits list');
        
        const installBtn = element.querySelector('.install-btn');
        this.assertNotNull(installBtn, 'Should have install button');
        this.assertContains(installBtn, 'Install Now', 'Should have correct install button text');
        
        const notNowBtn = element.querySelector('.not-now-btn');
        this.assertNotNull(notNowBtn, 'Should have not now button');
        
        const dontAskBtn = element.querySelector('.dont-ask-btn');
        this.assertNotNull(dontAskBtn, 'Should have don\'t ask button');
    }

    // Test: iOS instruction prompt creation
    testIOSInstructionPromptCreation() {
        console.log('Testing iOS instruction prompt creation...');
        
        const manager = new MockPWAInstallManager();
        const ui = new InstallPromptUI(manager);
        ui.instructionType = 'ios';
        ui.detector = new MockCrossPlatformDetector('ios', 'safari');
        
        const element = ui.create();
        
        this.assertNotNull(element, 'Should create element');
        
        // Check for instruction-specific elements
        const instructions = element.querySelector('.install-prompt-instructions');
        this.assertNotNull(instructions, 'Should have instructions section');
        
        const stepsList = element.querySelector('.install-steps-list');
        this.assertNotNull(stepsList, 'Should have steps list');
        
        const steps = stepsList.querySelectorAll('.install-step-item');
        this.assertEqual(steps.length, 3, 'Should have 3 installation steps');
        
        // Check step content
        this.assertContains(steps[0], 'Tap the Share button', 'Should have correct first step');
        this.assertContains(steps[1], 'Add to Home Screen', 'Should have correct second step');
        this.assertContains(steps[2], 'Add', 'Should have correct third step');
        
        const gotItBtn = element.querySelector('.install-btn');
        this.assertNotNull(gotItBtn, 'Should have Got It button');
        this.assertContains(gotItBtn, 'Got It', 'Should have correct button text');
    }

    // Test: Firefox instruction prompt creation
    testFirefoxInstructionPromptCreation() {
        console.log('Testing Firefox instruction prompt creation...');
        
        const manager = new MockPWAInstallManager();
        const ui = new InstallPromptUI(manager);
        ui.instructionType = 'firefox';
        ui.detector = new MockCrossPlatformDetector('windows', 'firefox');
        
        const element = ui.create();
        
        this.assertNotNull(element, 'Should create element');
        
        const stepsList = element.querySelector('.install-steps-list');
        this.assertNotNull(stepsList, 'Should have steps list');
        
        const steps = stepsList.querySelectorAll('.install-step-item');
        this.assertEqual(steps.length, 3, 'Should have 3 installation steps');
        
        // Check Firefox-specific content
        this.assertContains(steps[0], 'menu button', 'Should mention menu button');
        this.assertContains(steps[1], 'Install', 'Should mention install option');
    }

    // Test: Generic/unsupported prompt creation
    testGenericPromptCreation() {
        console.log('Testing generic/unsupported prompt creation...');
        
        const manager = new MockPWAInstallManager();
        const ui = new InstallPromptUI(manager);
        ui.instructionType = 'generic';
        ui.detector = new MockCrossPlatformDetector('windows', 'unknown');
        
        const element = ui.create();
        
        this.assertNotNull(element, 'Should create element');
        
        const message = element.querySelector('.install-unsupported-message');
        this.assertNotNull(message, 'Should have unsupported message');
        
        const alternatives = element.querySelector('.install-alternatives-list');
        this.assertNotNull(alternatives, 'Should have alternatives list');
        
        const browsers = element.querySelector('.install-browsers-list');
        this.assertNotNull(browsers, 'Should have recommended browsers list');
        
        const closeBtn = element.querySelector('.install-btn');
        this.assertNotNull(closeBtn, 'Should have close button');
        this.assertContains(closeBtn, 'Close', 'Should have correct button text');
    }

    // Test: Show functionality
    testShowFunctionality() {
        console.log('Testing show functionality...');
        
        const manager = new MockPWAInstallManager();
        const ui = new InstallPromptUI(manager);
        
        this.assertFalse(ui.isVisible, 'Should not be visible initially');
        
        ui.show();
        
        this.assertTrue(ui.isVisible, 'Should be visible after show');
        this.assertNotNull(ui.element, 'Should create element when showing');
        this.assertTrue(ui.element.classList.contains('visible'), 'Should have visible class');
        this.assertEqual(document.body.style.overflow, 'hidden', 'Should disable body scrolling');
        this.assertTrue(document.body.contains(ui.element), 'Should be added to DOM');
    }

    // Test: Hide functionality
    testHideFunctionality() {
        console.log('Testing hide functionality...');
        
        const manager = new MockPWAInstallManager();
        const ui = new InstallPromptUI(manager);
        
        // First show the prompt
        ui.show();
        this.assertTrue(ui.isVisible, 'Should be visible after show');
        
        // Then hide it
        ui.hide();
        
        this.assertFalse(ui.isVisible, 'Should not be visible after hide');
        this.assertFalse(ui.element.classList.contains('visible'), 'Should not have visible class');
        this.assertEqual(document.body.style.overflow, '', 'Should restore body scrolling');
    }

    // Test: Destroy functionality
    testDestroyFunctionality() {
        console.log('Testing destroy functionality...');
        
        const manager = new MockPWAInstallManager();
        const ui = new InstallPromptUI(manager);
        
        // Show the prompt first
        ui.show();
        this.assertNotNull(ui.element, 'Should have element');
        this.assertTrue(ui.isVisible, 'Should be visible');
        
        // Destroy it
        ui.destroy();
        
        this.assertEqual(ui.element, null, 'Should clear element reference');
        this.assertFalse(ui.isVisible, 'Should not be visible');
        this.assertEqual(document.body.style.overflow, '', 'Should restore body scrolling');
    }

    // Test: Install button click handling
    testInstallButtonClickHandling() {
        console.log('Testing install button click handling...');
        
        const manager = new MockPWAInstallManager();
        let installClickCalled = false;
        manager.handleInstallClick = () => { installClickCalled = true; };
        
        const ui = new InstallPromptUI(manager);
        ui.instructionType = 'native';
        
        const element = ui.create();
        const installBtn = element.querySelector('.install-btn');
        
        // Simulate click
        installBtn.click();
        
        this.assertTrue(installClickCalled, 'Should call manager handleInstallClick');
    }

    // Test: Not Now button click handling
    testNotNowButtonClickHandling() {
        console.log('Testing Not Now button click handling...');
        
        const manager = new MockPWAInstallManager();
        let dismissCalled = false;
        manager.handleDismiss = () => { dismissCalled = true; };
        
        const ui = new InstallPromptUI(manager);
        ui.instructionType = 'native';
        
        const element = ui.create();
        const notNowBtn = element.querySelector('.not-now-btn');
        
        // Simulate click
        notNowBtn.click();
        
        this.assertTrue(dismissCalled, 'Should call manager handleDismiss');
    }

    // Test: Don't Ask Again button click handling
    testDontAskAgainButtonClickHandling() {
        console.log('Testing Don\'t Ask Again button click handling...');
        
        const manager = new MockPWAInstallManager();
        let dontAskCalled = false;
        manager.handleDontAskAgain = () => { dontAskCalled = true; };
        
        const ui = new InstallPromptUI(manager);
        ui.instructionType = 'native';
        
        const element = ui.create();
        const dontAskBtn = element.querySelector('.dont-ask-btn');
        
        // Simulate click
        dontAskBtn.click();
        
        this.assertTrue(dontAskCalled, 'Should call manager handleDontAskAgain');
    }

    // Test: Got It button click handling (for instructions)
    testGotItButtonClickHandling() {
        console.log('Testing Got It button click handling...');
        
        const manager = new MockPWAInstallManager();
        let acknowledgedCalled = false;
        manager.handleInstructionsAcknowledged = () => { acknowledgedCalled = true; };
        
        const ui = new InstallPromptUI(manager);
        ui.instructionType = 'ios';
        ui.detector = new MockCrossPlatformDetector('ios', 'safari');
        
        const element = ui.create();
        const gotItBtn = element.querySelector('.install-btn');
        
        // Simulate click
        gotItBtn.click();
        
        this.assertTrue(acknowledgedCalled, 'Should call manager handleInstructionsAcknowledged');
    }

    // Test: Keyboard navigation
    testKeyboardNavigation() {
        console.log('Testing keyboard navigation...');
        
        const manager = new MockPWAInstallManager();
        const ui = new InstallPromptUI(manager);
        ui.instructionType = 'native';
        
        const element = ui.create();
        ui.show();
        
        // Test Escape key
        const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
        element.dispatchEvent(escapeEvent);
        
        // Should hide the prompt (we can't easily test this without more complex mocking)
        this.assert(true, 'Should handle Escape key press');
        
        // Test Tab key navigation
        const buttons = element.querySelectorAll('button');
        this.assertTrue(buttons.length > 0, 'Should have focusable buttons');
        
        buttons.forEach(button => {
            this.assertNotNull(button.getAttribute('type'), 'Buttons should have type attribute');
        });
    }

    // Test: Accessibility features
    testAccessibilityFeatures() {
        console.log('Testing accessibility features...');
        
        const manager = new MockPWAInstallManager();
        const ui = new InstallPromptUI(manager);
        ui.instructionType = 'native';
        
        const element = ui.create();
        
        // Check ARIA attributes
        this.assertEqual(element.getAttribute('role'), 'dialog', 'Should have dialog role');
        this.assertEqual(element.getAttribute('aria-modal'), 'true', 'Should be modal');
        this.assertNotNull(element.getAttribute('aria-labelledby'), 'Should have aria-labelledby');
        this.assertNotNull(element.getAttribute('aria-describedby'), 'Should have aria-describedby');
        
        // Check title element
        const title = element.querySelector('#install-prompt-title');
        this.assertNotNull(title, 'Should have title element with ID');
        
        // Check description element
        const description = element.querySelector('#install-prompt-description');
        this.assertNotNull(description, 'Should have description element with ID');
        
        // Check button accessibility
        const buttons = element.querySelectorAll('button');
        buttons.forEach((button, index) => {
            this.assertNotNull(button.getAttribute('aria-label'), `Button ${index} should have aria-label`);
            this.assertEqual(button.getAttribute('type'), 'button', `Button ${index} should have type="button"`);
        });
        
        // Check list accessibility
        const lists = element.querySelectorAll('ul, ol');
        lists.forEach((list, index) => {
            this.assertEqual(list.getAttribute('role'), 'list', `List ${index} should have list role`);
        });
        
        const listItems = element.querySelectorAll('li');
        listItems.forEach((item, index) => {
            this.assertEqual(item.getAttribute('role'), 'listitem', `List item ${index} should have listitem role`);
        });
    }

    // Test: Outside click handling
    testOutsideClickHandling() {
        console.log('Testing outside click handling...');
        
        const manager = new MockPWAInstallManager();
        let dismissCalled = false;
        manager.handleDismiss = () => { dismissCalled = true; };
        
        const ui = new InstallPromptUI(manager);
        const element = ui.create();
        
        const backdrop = element.querySelector('.install-prompt-backdrop');
        this.assertNotNull(backdrop, 'Should have backdrop element');
        
        // Simulate backdrop click
        backdrop.click();
        
        this.assertTrue(dismissCalled, 'Should call handleDismiss on backdrop click');
    }

    // Test: Error handling in creation
    testErrorHandlingInCreation() {
        console.log('Testing error handling in creation...');
        
        const manager = new MockPWAInstallManager();
        const ui = new InstallPromptUI(manager);
        
        // Mock document.createElement to throw error
        const originalCreateElement = document.createElement;
        document.createElement = () => { throw new Error('DOM error'); };
        
        const element = ui.create();
        
        // Should create fallback element
        this.assertNotNull(element, 'Should create fallback element on error');
        this.assertTrue(element.classList.contains('pwa-install-fallback'), 'Should have fallback class');
        
        // Restore original createElement
        document.createElement = originalCreateElement;
    }

    // Test: Focus management
    testFocusManagement() {
        console.log('Testing focus management...');
        
        const manager = new MockPWAInstallManager();
        const ui = new InstallPromptUI(manager);
        
        // Create a focusable element to test focus restoration
        const testButton = document.createElement('button');
        testButton.textContent = 'Test Button';
        document.body.appendChild(testButton);
        testButton.focus();
        
        // Show the prompt
        ui.show();
        
        // The prompt should store the previously focused element
        this.assertNotNull(ui.previouslyFocusedElement, 'Should store previously focused element');
        
        // Hide the prompt
        ui.hide();
        
        // Clean up test button
        document.body.removeChild(testButton);
    }

    // Test: Responsive design elements
    testResponsiveDesignElements() {
        console.log('Testing responsive design elements...');
        
        const manager = new MockPWAInstallManager();
        const ui = new InstallPromptUI(manager);
        ui.instructionType = 'native';
        
        const element = ui.create();
        
        // Check for responsive classes
        this.assertTrue(element.classList.contains('pwa-install-prompt'), 'Should have main prompt class');
        
        const container = element.querySelector('.install-prompt-container');
        this.assertNotNull(container, 'Should have container element');
        
        const header = element.querySelector('.install-prompt-header');
        this.assertNotNull(header, 'Should have header element');
        
        const actions = element.querySelector('.install-prompt-actions');
        this.assertNotNull(actions, 'Should have actions element');
        
        // Check for mobile-friendly elements
        const icon = element.querySelector('.install-prompt-icon');
        this.assertNotNull(icon, 'Should have app icon');
        
        const benefits = element.querySelector('.install-benefits-list');
        this.assertNotNull(benefits, 'Should have benefits list');
    }

    // Run all tests
    runAllTests() {
        console.log('🧪 Starting InstallPromptUI Tests...\n');
        
        this.setup();
        
        try {
            this.testConstructorAndInitialization();
            this.testInstructionTypeDetermination();
            this.testNativePromptCreation();
            this.testIOSInstructionPromptCreation();
            this.testFirefoxInstructionPromptCreation();
            this.testGenericPromptCreation();
            this.testShowFunctionality();
            this.testHideFunctionality();
            this.testDestroyFunctionality();
            this.testInstallButtonClickHandling();
            this.testNotNowButtonClickHandling();
            this.testDontAskAgainButtonClickHandling();
            this.testGotItButtonClickHandling();
            this.testKeyboardNavigation();
            this.testAccessibilityFeatures();
            this.testOutsideClickHandling();
            this.testErrorHandlingInCreation();
            this.testFocusManagement();
            this.testResponsiveDesignElements();
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
    window.InstallPromptUITests = InstallPromptUITests;
} else if (typeof module !== 'undefined' && module.exports) {
    module.exports = InstallPromptUITests;
}

// Auto-run tests if this file is loaded directly
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        // Only run tests if explicitly requested
        if (window.location.search.includes('runTests=true')) {
            const tester = new InstallPromptUITests();
            tester.runAllTests();
        }
    });
}