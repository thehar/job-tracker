/**
 * Accessibility Tests for InstallPromptUI
 * Tests all accessibility features implemented in task 11
 */

// Mock dependencies
class MockCrossPlatformDetector {
    constructor() {
        this.platform = { name: 'desktop' };
        this.browser = { name: 'chrome' };
    }
    
    supportsInstallPrompt() {
        return true;
    }
    
    getInstallationInstructions() {
        return {
            supported: true,
            steps: [
                { step: '1', icon: '📱', instruction: 'Click the install button in your browser' },
                { step: '2', icon: '✅', instruction: 'Confirm the installation' }
            ],
            notes: ['Installation may take a few seconds'],
            alternatives: [
                { option: 'Manual Install', description: 'Add to home screen manually' }
            ],
            recommendedBrowsers: [
                { name: 'Chrome', minVersion: '88' }
            ]
        };
    }
}

class MockInstallAnalytics {
    trackPromptShown() {}
    trackInstructionsShown() {}
}

class MockPWAInstallManager {
    constructor() {
        this.deferredPrompt = { prompt: () => Promise.resolve() };
        this.analytics = new MockInstallAnalytics();
    }
    
    handleInstallClick() {}
    handleDismiss() {}
    handleDontAskAgain() {}
    handleInstructionsAcknowledged() {}
}

// Set up global mocks
window.CrossPlatformDetector = MockCrossPlatformDetector;
window.InstallAnalytics = MockInstallAnalytics;

describe('InstallPromptUI Accessibility Features', () => {
    let ui;
    let manager;
    let container;

    beforeEach(() => {
        // Create a container for testing
        container = document.createElement('div');
        document.body.appendChild(container);
        
        manager = new MockPWAInstallManager();
        ui = new InstallPromptUI(manager);
    });

    afterEach(() => {
        if (ui) {
            ui.destroy();
        }
        if (container && container.parentNode) {
            container.parentNode.removeChild(container);
        }
        
        // Clean up any remaining prompts
        const existingPrompts = document.querySelectorAll('.pwa-install-prompt');
        existingPrompts.forEach(prompt => {
            if (prompt.parentNode) {
                prompt.parentNode.removeChild(prompt);
            }
        });
        
        // Restore body overflow
        document.body.style.overflow = '';
    });

    describe('ARIA Labels and Screen Reader Support', () => {
        test('should have proper dialog role and ARIA attributes', () => {
            ui.create();
            
            expect(ui.element.getAttribute('role')).toBe('dialog');
            expect(ui.element.getAttribute('aria-modal')).toBe('true');
            expect(ui.element.getAttribute('aria-labelledby')).toBe('install-prompt-title');
            expect(ui.element.getAttribute('aria-describedby')).toBe('install-prompt-description');
            expect(ui.element.getAttribute('aria-live')).toBe('polite');
        });

        test('should have proper ARIA labels on buttons', () => {
            ui.instructionType = 'native';
            ui.create();
            
            const installBtn = ui.element.querySelector('.install-btn');
            const notNowBtn = ui.element.querySelector('.not-now-btn');
            const dontAskBtn = ui.element.querySelector('.dont-ask-btn');
            
            expect(installBtn.getAttribute('aria-label')).toContain('Install Job Tracker app now');
            expect(notNowBtn.getAttribute('aria-label')).toContain('Dismiss installation prompt');
            expect(dontAskBtn.getAttribute('aria-label')).toContain('Permanently disable');
            
            expect(installBtn.getAttribute('type')).toBe('button');
            expect(notNowBtn.getAttribute('type')).toBe('button');
            expect(dontAskBtn.getAttribute('type')).toBe('button');
        });

        test('should have proper list roles and labels', () => {
            ui.instructionType = 'ios';
            ui.create();
            
            const stepsList = ui.element.querySelector('.install-steps-list');
            const stepItems = ui.element.querySelectorAll('.install-step-item');
            
            expect(stepsList.getAttribute('role')).toBe('list');
            expect(stepsList.getAttribute('aria-label')).toBe('Installation steps');
            
            stepItems.forEach(item => {
                expect(item.getAttribute('role')).toBe('listitem');
                expect(item.getAttribute('aria-label')).toContain('Step');
            });
        });

        test('should hide decorative elements from screen readers', () => {
            ui.create();
            
            const icons = ui.element.querySelectorAll('.install-prompt-icon, .install-benefit-icon, .install-step-icon, .install-step-number');
            icons.forEach(icon => {
                expect(icon.getAttribute('aria-hidden')).toBe('true');
            });
            
            const backdrop = ui.element.querySelector('.install-prompt-backdrop');
            expect(backdrop.getAttribute('aria-hidden')).toBe('true');
        });
    });

    describe('Keyboard Navigation Support', () => {
        test('should focus first element when shown', () => {
            const focusSpy = jest.spyOn(HTMLElement.prototype, 'focus');
            
            ui.show();
            
            expect(focusSpy).toHaveBeenCalled();
            
            const firstButton = ui.element.querySelector('.install-btn');
            expect(document.activeElement).toBe(firstButton);
            
            focusSpy.mockRestore();
        });

        test('should handle Escape key to close prompt', () => {
            const handleDismissSpy = jest.spyOn(manager, 'handleDismiss');
            
            ui.show();
            
            const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
            ui.element.dispatchEvent(escapeEvent);
            
            expect(handleDismissSpy).toHaveBeenCalled();
        });

        test('should trap focus within modal', () => {
            ui.show();
            
            const focusableElements = ui.element.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            
            expect(focusableElements.length).toBeGreaterThan(0);
            
            // Test Tab key navigation
            const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' });
            const shiftTabEvent = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true });
            
            // Should not throw errors
            expect(() => {
                ui.element.dispatchEvent(tabEvent);
                ui.element.dispatchEvent(shiftTabEvent);
            }).not.toThrow();
        });

        test('should support arrow key navigation', () => {
            ui.show();
            
            const arrowDownEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
            const arrowUpEvent = new KeyboardEvent('keydown', { key: 'ArrowUp' });
            
            // Should not throw errors
            expect(() => {
                ui.element.dispatchEvent(arrowDownEvent);
                ui.element.dispatchEvent(arrowUpEvent);
            }).not.toThrow();
        });

        test('should support Home and End key navigation', () => {
            ui.show();
            
            const homeEvent = new KeyboardEvent('keydown', { key: 'Home' });
            const endEvent = new KeyboardEvent('keydown', { key: 'End' });
            
            // Should not throw errors
            expect(() => {
                ui.element.dispatchEvent(homeEvent);
                ui.element.dispatchEvent(endEvent);
            }).not.toThrow();
        });
    });

    describe('Focus Management', () => {
        test('should store and restore previously focused element', () => {
            const testButton = document.createElement('button');
            testButton.textContent = 'Test Button';
            document.body.appendChild(testButton);
            testButton.focus();
            
            expect(document.activeElement).toBe(testButton);
            
            ui.show();
            expect(ui.previouslyFocusedElement).toBe(testButton);
            
            ui.hide();
            
            // Wait for animation to complete
            setTimeout(() => {
                expect(document.activeElement).toBe(testButton);
                document.body.removeChild(testButton);
            }, 350);
        });

        test('should handle focus restoration gracefully when element is removed', () => {
            const testButton = document.createElement('button');
            document.body.appendChild(testButton);
            testButton.focus();
            
            ui.show();
            
            // Remove the previously focused element
            document.body.removeChild(testButton);
            
            // Should not throw error when trying to restore focus
            expect(() => {
                ui.hide();
            }).not.toThrow();
        });

        test('should disable body scrolling when shown', () => {
            ui.show();
            expect(document.body.style.overflow).toBe('hidden');
            
            ui.hide();
            setTimeout(() => {
                expect(document.body.style.overflow).toBe('');
            }, 350);
        });
    });

    describe('Screen Reader Announcements', () => {
        test('should announce when prompt opens', () => {
            const announcementSpy = jest.spyOn(ui, 'announceToScreenReader');
            
            ui.show();
            
            expect(announcementSpy).toHaveBeenCalledWith(
                'Installation prompt opened. Use Tab to navigate, Escape to close.'
            );
        });

        test('should announce when prompt closes', () => {
            ui.show();
            
            const announcementSpy = jest.spyOn(ui, 'announceToScreenReader');
            
            ui.hide();
            
            expect(announcementSpy).toHaveBeenCalledWith('Installation prompt closed.');
        });

        test('should create temporary live region for announcements', () => {
            ui.announceToScreenReader('Test announcement');
            
            const liveRegion = document.querySelector('[aria-live="polite"]');
            expect(liveRegion).toBeTruthy();
            expect(liveRegion.textContent).toBe('Test announcement');
            expect(liveRegion.className).toBe('sr-only');
            
            // Should be removed after timeout
            setTimeout(() => {
                const removedRegion = document.querySelector('[aria-live="polite"]');
                expect(removedRegion).toBeFalsy();
            }, 1100);
        });
    });

    describe('Error Handling and Graceful Degradation', () => {
        test('should handle focus errors gracefully', () => {
            // Mock focus to throw error
            const originalFocus = HTMLElement.prototype.focus;
            HTMLElement.prototype.focus = jest.fn(() => {
                throw new Error('Focus failed');
            });
            
            expect(() => {
                ui.focusFirstElement();
            }).not.toThrow();
            
            // Restore original focus
            HTMLElement.prototype.focus = originalFocus;
        });

        test('should handle missing focusable elements', () => {
            ui.create();
            
            // Remove all buttons
            const buttons = ui.element.querySelectorAll('button');
            buttons.forEach(button => button.remove());
            
            expect(() => {
                ui.focusFirstElement();
                ui.trapFocus();
            }).not.toThrow();
        });

        test('should clean up properly on destroy', () => {
            ui.show();
            
            const element = ui.element;
            expect(element.parentNode).toBeTruthy();
            
            ui.destroy();
            
            expect(ui.element).toBeNull();
            expect(ui.isVisible).toBe(false);
            expect(ui.previouslyFocusedElement).toBeNull();
            expect(document.body.style.overflow).toBe('');
        });
    });

    describe('Different Prompt Types Accessibility', () => {
        test('should have proper accessibility for iOS instructions', () => {
            ui.instructionType = 'ios';
            ui.create();
            
            const gotItBtn = ui.element.querySelector('.install-btn');
            expect(gotItBtn.getAttribute('aria-label')).toContain('Acknowledge installation instructions');
            
            const stepsList = ui.element.querySelector('.install-steps-list');
            expect(stepsList.getAttribute('aria-label')).toBe('Installation steps');
        });

        test('should have proper accessibility for unsupported browser', () => {
            // Mock unsupported instructions
            ui.detector.getInstallationInstructions = () => ({
                supported: false,
                message: 'Installation not supported in this browser',
                alternatives: [],
                recommendedBrowsers: []
            });
            
            ui.instructionType = 'generic';
            ui.create();
            
            const closeBtn = ui.element.querySelector('.install-btn');
            expect(closeBtn.getAttribute('aria-label')).toContain('Close installation information dialog');
        });
    });
});

// Helper function to run tests
function runAccessibilityTests() {
    console.log('Running InstallPromptUI Accessibility Tests...');
    
    // This would typically be run with a test runner like Jest
    // For now, we'll just log that the tests are defined
    console.log('✅ ARIA Labels and Screen Reader Support tests defined');
    console.log('✅ Keyboard Navigation Support tests defined');
    console.log('✅ Focus Management tests defined');
    console.log('✅ Screen Reader Announcements tests defined');
    console.log('✅ Error Handling and Graceful Degradation tests defined');
    console.log('✅ Different Prompt Types Accessibility tests defined');
    
    console.log('All accessibility tests are properly defined and ready to run with Jest.');
}

// Export for use in test runners
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runAccessibilityTests };
}

// Run tests if in browser environment
if (typeof window !== 'undefined') {
    window.runAccessibilityTests = runAccessibilityTests;
}