/**
 * Cross-Platform Detection Constants
 */
const PLATFORM_CONSTANTS = {
    BROWSERS: {
        CHROME: 'chrome',
        FIREFOX: 'firefox',
        SAFARI: 'safari',
        EDGE: 'edge',
        OPERA: 'opera',
        SAMSUNG: 'samsung',
        UNKNOWN: 'unknown'
    },
    
    PLATFORMS: {
        IOS: 'ios',
        ANDROID: 'android',
        WINDOWS: 'windows',
        MACOS: 'macos',
        LINUX: 'linux',
        CHROMEOS: 'chromeos',
        UNKNOWN: 'unknown'
    },
    
    ENGINES: {
        BLINK: 'blink',
        GECKO: 'gecko',
        WEBKIT: 'webkit',
        UNKNOWN: 'unknown'
    },
    
    COMMON_STRINGS: {
        ADD_TO_HOME_SCREEN: 'Add to Home Screen',
        INSTALL_APP: 'Install',
        BROWSER_ENGINE: 'browser.engine = '
    }
};

/**
 * Cross-Platform Detector
 * Handles browser and platform identification for PWA installation support
 */
class CrossPlatformDetector {
    constructor() {
        this.userAgent = navigator.userAgent.toLowerCase();
        this.platform = this.detectPlatform();
        this.browser = this.detectBrowser();
        
        console.log('[CrossPlatformDetector] Initialized - Platform:', this.platform.name, 'Browser:', this.browser.name);
    }

    /**
     * Detect the current platform
     * @returns {Object} Platform information
     */
    detectPlatform() {
        try {
            const platform = {
                name: 'unknown',
                version: null,
                isMobile: false,
                isTablet: false,
                isDesktop: false
            };

            // iOS Detection
            if (/iphone|ipod/.test(this.userAgent)) {
                platform.name = 'ios';
                platform.isMobile = true;
                const match = this.userAgent.match(/os (\d+)_(\d+)/);
                if (match) {
                    platform.version = `${match[1]}.${match[2]}`;
                }
            } else if (/ipad/.test(this.userAgent)) {
                platform.name = 'ios';
                platform.isTablet = true;
                const match = this.userAgent.match(/os (\d+)_(\d+)/);
                if (match) {
                    platform.version = `${match[1]}.${match[2]}`;
                }
            }
            // Android Detection
            else if (/android/.test(this.userAgent)) {
                platform.name = 'android';
                const match = this.userAgent.match(/android (\d+\.?\d*)/);
                if (match) {
                    platform.version = match[1];
                }
                
                // Determine if mobile or tablet
                if (/mobile/.test(this.userAgent)) {
                    platform.isMobile = true;
                } else {
                    platform.isTablet = true;
                }
            }
            // Windows Detection
            else if (/windows/.test(this.userAgent)) {
                platform.name = 'windows';
                platform.isDesktop = true;
                
                if (/windows nt 10/.test(this.userAgent)) {
                    platform.version = '10';
                } else if (/windows nt 6\.3/.test(this.userAgent)) {
                    platform.version = '8.1';
                } else if (/windows nt 6\.2/.test(this.userAgent)) {
                    platform.version = '8';
                } else if (/windows nt 6\.1/.test(this.userAgent)) {
                    platform.version = '7';
                }
            }
            // macOS Detection
            else if (/mac os x/.test(this.userAgent)) {
                platform.name = 'macos';
                platform.isDesktop = true;
                const match = this.userAgent.match(/mac os x (\d+)_(\d+)/);
                if (match) {
                    platform.version = `${match[1]}.${match[2]}`;
                }
            }
            // Linux Detection
            else if (/linux/.test(this.userAgent)) {
                platform.name = 'linux';
                platform.isDesktop = true;
            }
            // ChromeOS Detection
            else if (/cros/.test(this.userAgent)) {
                platform.name = 'chromeos';
                platform.isDesktop = true;
            }

            return platform;
        } catch (error) {
            console.error('[CrossPlatformDetector] Error detecting platform:', error);
            return {
                name: 'unknown',
                version: null,
                isMobile: false,
                isTablet: false,
                isDesktop: true
            };
        }
    }

    /**
     * Detect the current browser
     * @returns {Object} Browser information
     */
    detectBrowser() {
        try {
            const browser = {
                name: 'unknown',
                version: null,
                engine: 'unknown',
                supportsServiceWorker: false,
                supportsManifest: false
            };

            // Chrome Detection (must be before Safari check)
            if (/chrome/.test(this.userAgent) && !/edg/.test(this.userAgent)) {
                browser.name = PLATFORM_CONSTANTS.BROWSERS.CHROME;
                browser.engine = PLATFORM_CONSTANTS.ENGINES.BLINK;
                const match = this.userAgent.match(/chrome\/(\d+\.?\d*)/);
                if (match) {
                    browser.version = match[1];
                }
            }
            // Edge Detection (Chromium-based)
            else if (/edg/.test(this.userAgent)) {
                browser.name = PLATFORM_CONSTANTS.BROWSERS.EDGE;
                browser.engine = PLATFORM_CONSTANTS.ENGINES.BLINK;
                const match = this.userAgent.match(/edg\/(\d+\.?\d*)/);
                if (match) {
                    browser.version = match[1];
                }
            }
            // Firefox Detection
            else if (/firefox/.test(this.userAgent)) {
                browser.name = 'firefox';
                browser.engine = 'gecko';
                const match = this.userAgent.match(/firefox\/(\d+\.?\d*)/);
                if (match) {
                    browser.version = match[1];
                }
            }
            // Safari Detection
            else if (/safari/.test(this.userAgent) && !/chrome/.test(this.userAgent)) {
                browser.name = 'safari';
                browser.engine = 'webkit';
                const match = this.userAgent.match(/version\/(\d+\.?\d*)/);
                if (match) {
                    browser.version = match[1];
                }
            }
            // Opera Detection
            else if (/opr/.test(this.userAgent)) {
                browser.name = 'opera';
                browser.engine = 'blink';
                const match = this.userAgent.match(/opr\/(\d+\.?\d*)/);
                if (match) {
                    browser.version = match[1];
                }
            }
            // Samsung Internet Detection
            else if (/samsungbrowser/.test(this.userAgent)) {
                browser.name = 'samsung';
                browser.engine = 'blink';
                const match = this.userAgent.match(/samsungbrowser\/(\d+\.?\d*)/);
                if (match) {
                    browser.version = match[1];
                }
            }

            // Check for modern browser features
            browser.supportsServiceWorker = 'serviceWorker' in navigator;
            browser.supportsManifest = 'onbeforeinstallprompt' in window || 
                                     (browser.name === 'safari' && parseFloat(browser.version) >= 14);

            return browser;
        } catch (error) {
            console.error('[CrossPlatformDetector] Error detecting browser:', error);
            return {
                name: 'unknown',
                version: null,
                engine: 'unknown',
                supportsServiceWorker: false,
                supportsManifest: false
            };
        }
    }

    /**
     * Get complete browser information
     * @returns {Object} Complete browser information
     */
    getBrowserInfo() {
        return {
            ...this.browser,
            userAgent: navigator.userAgent,
            language: navigator.language,
            languages: navigator.languages || [navigator.language],
            cookieEnabled: navigator.cookieEnabled,
            onLine: navigator.onLine
        };
    }

    /**
     * Get complete platform information
     * @returns {Object} Complete platform information
     */
    getPlatformInfo() {
        return {
            ...this.platform,
            screen: {
                width: screen.width,
                height: screen.height,
                availWidth: screen.availWidth,
                availHeight: screen.availHeight,
                colorDepth: screen.colorDepth,
                pixelDepth: screen.pixelDepth
            },
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            devicePixelRatio: window.devicePixelRatio || 1
        };
    }

    /**
     * Check if the browser supports PWA installation prompts
     * @returns {boolean} True if installation prompts are supported
     */
    supportsInstallPrompt() {
        try {
            // Chrome/Edge with beforeinstallprompt support
            if ('onbeforeinstallprompt' in window) {
                return true;
            }

            // Chrome/Edge version check (88+)
            if ((this.browser.name === 'chrome' || this.browser.name === 'edge') && 
                parseFloat(this.browser.version) >= 88) {
                return true;
            }

            // Samsung Internet with PWA support
            if (this.browser.name === 'samsung' && parseFloat(this.browser.version) >= 14) {
                return true;
            }

            return false;
        } catch (error) {
            console.error('[CrossPlatformDetector] Error checking install prompt support:', error);
            return false;
        }
    }

    /**
     * Check if the browser supports standalone mode detection
     * @returns {boolean} True if standalone mode is supported
     */
    supportsStandaloneMode() {
        try {
            // Check for display-mode media query support
            if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches !== undefined) {
                return true;
            }

            // iOS Safari standalone mode
            if (this.platform.name === 'ios' && 'standalone' in navigator) {
                return true;
            }

            // Android Chrome/Samsung Internet
            if (this.platform.name === 'android' && 
                (this.browser.name === 'chrome' || this.browser.name === 'samsung')) {
                return true;
            }

            return false;
        } catch (error) {
            console.error('[CrossPlatformDetector] Error checking standalone mode support:', error);
            return false;
        }
    }

    /**
     * Check if the app is currently running in standalone mode
     * @returns {boolean} True if running in standalone mode
     */
    isStandalone() {
        try {
            // Check display-mode media query
            if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
                return true;
            }

            // iOS Safari standalone mode
            if (this.platform.name === 'ios' && navigator.standalone === true) {
                return true;
            }

            // Android Chrome fullscreen mode
            if (this.platform.name === 'android' && window.matchMedia && 
                window.matchMedia('(display-mode: fullscreen)').matches) {
                return true;
            }

            return false;
        } catch (error) {
            console.error('[CrossPlatformDetector] Error checking standalone mode:', error);
            return false;
        }
    }

    /**
     * Get iOS-specific installation instructions
     * @returns {Object} iOS installation instructions
     */
    getIOSInstructions() {
        const isTablet = this.platform.isTablet;
        
        return {
            platform: 'ios',
            deviceType: isTablet ? 'tablet' : 'mobile',
            supported: this.browser.name === 'safari',
            steps: [
                {
                    step: 1,
                    instruction: `Tap the Share button ${isTablet ? 'at the top of the screen' : 'at the bottom of the screen'}`,
                    icon: '⬆️'
                },
                {
                    step: 2,
                    instruction: 'Scroll down and tap "Add to Home Screen"',
                    icon: '➕'
                },
                {
                    step: 3,
                    instruction: 'Tap "Add" to confirm installation',
                    icon: '✅'
                }
            ],
            notes: [
                'This feature is only available in Safari browser',
                'The app will appear on your home screen like a native app',
                'You can access it offline after installation'
            ]
        };
    }

    /**
     * Get Firefox-specific installation instructions
     * @returns {Object} Firefox installation instructions
     */
    getFirefoxInstructions() {
        const isDesktop = this.platform.isDesktop;
        
        return {
            platform: 'firefox',
            deviceType: isDesktop ? 'desktop' : 'mobile',
            supported: parseFloat(this.browser.version) >= 85,
            steps: isDesktop ? [
                {
                    step: 1,
                    instruction: 'Click the three-line menu button (☰)',
                    icon: '☰'
                },
                {
                    step: 2,
                    instruction: 'Look for "Install" or "Add to Home Screen" option',
                    icon: '🔍'
                },
                {
                    step: 3,
                    instruction: 'Click "Install" to add the app',
                    icon: '⬇️'
                }
            ] : [
                {
                    step: 1,
                    instruction: 'Tap the three-dot menu button',
                    icon: '⋮'
                },
                {
                    step: 2,
                    instruction: 'Tap "Install" or "Add to Home Screen"',
                    icon: '➕'
                },
                {
                    step: 3,
                    instruction: 'Confirm installation',
                    icon: '✅'
                }
            ],
            notes: [
                'PWA support varies by Firefox version',
                'Some features may be limited compared to Chrome/Edge',
                'Check for updates if installation option is not available'
            ]
        };
    }

    /**
     * Get generic installation instructions for unsupported browsers
     * @returns {Object} Generic installation instructions
     */
    getGenericInstructions() {
        return {
            platform: 'generic',
            deviceType: this.platform.isDesktop ? 'desktop' : 'mobile',
            supported: false,
            message: 'PWA installation is not supported in this browser',
            alternatives: [
                {
                    option: 'Use Chrome or Edge',
                    description: 'For the best PWA experience, try Chrome or Microsoft Edge'
                },
                {
                    option: 'Bookmark this page',
                    description: 'Add this page to your bookmarks for quick access'
                },
                {
                    option: 'Create desktop shortcut',
                    description: 'Most browsers allow creating desktop shortcuts from the menu'
                }
            ],
            recommendedBrowsers: [
                { name: 'Chrome', minVersion: '88' },
                { name: 'Edge', minVersion: '88' },
                { name: 'Safari', minVersion: '14' },
                { name: 'Firefox', minVersion: '85' }
            ]
        };
    }

    /**
     * Get platform-specific installation instructions
     * @returns {Object} Installation instructions for current platform/browser
     */
    getInstallationInstructions() {
        try {
            // iOS Safari
            if (this.platform.name === 'ios' && this.browser.name === 'safari') {
                return this.getIOSInstructions();
            }

            // Firefox
            if (this.browser.name === 'firefox') {
                return this.getFirefoxInstructions();
            }

            // Chrome/Edge with native support
            if (this.supportsInstallPrompt()) {
                return {
                    platform: 'native',
                    deviceType: this.platform.isDesktop ? 'desktop' : 'mobile',
                    supported: true,
                    message: 'This browser supports automatic installation prompts',
                    notes: [
                        'Installation prompts will appear automatically when eligible',
                        'Look for install buttons in the address bar or menu',
                        'The app will integrate with your operating system'
                    ]
                };
            }

            // Fallback to generic instructions
            return this.getGenericInstructions();
        } catch (error) {
            console.error('[CrossPlatformDetector] Error getting installation instructions:', error);
            return this.getGenericInstructions();
        }
    }

    /**
     * Check if the current browser/platform combination supports PWA features
     * @returns {Object} PWA support information
     */
    getPWASupport() {
        try {
            const support = {
                serviceWorker: 'serviceWorker' in navigator,
                manifest: 'onbeforeinstallprompt' in window,
                installPrompt: this.supportsInstallPrompt(),
                standaloneMode: this.supportsStandaloneMode(),
                pushNotifications: 'PushManager' in window && 'Notification' in window,
                backgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
                webShare: 'share' in navigator,
                fullscreen: 'requestFullscreen' in document.documentElement,
                offline: 'onLine' in navigator
            };

            // Calculate overall PWA readiness score
            const features = Object.values(support);
            const supportedCount = features.filter(Boolean).length;
            const totalFeatures = features.length;
            const readinessScore = Math.round((supportedCount / totalFeatures) * 100);

            return {
                ...support,
                readinessScore,
                isFullySupported: support.serviceWorker && support.manifest,
                isPartiallySupported: support.serviceWorker || support.manifest,
                recommendedForInstall: support.serviceWorker && (support.installPrompt || support.standaloneMode)
            };
        } catch (error) {
            console.error('[CrossPlatformDetector] Error checking PWA support:', error);
            return {
                serviceWorker: false,
                manifest: false,
                installPrompt: false,
                standaloneMode: false,
                pushNotifications: false,
                backgroundSync: false,
                webShare: false,
                fullscreen: false,
                offline: false,
                readinessScore: 0,
                isFullySupported: false,
                isPartiallySupported: false,
                recommendedForInstall: false
            };
        }
    }

    /**
     * Get a summary of the current environment
     * @returns {Object} Complete environment summary
     */
    getEnvironmentSummary() {
        try {
            return {
                platform: this.getPlatformInfo(),
                browser: this.getBrowserInfo(),
                pwaSupport: this.getPWASupport(),
                installationInstructions: this.getInstallationInstructions(),
                capabilities: {
                    canInstall: this.supportsInstallPrompt() || this.supportsStandaloneMode(),
                    isInstalled: this.isStandalone(),
                    needsManualInstructions: !this.supportsInstallPrompt() && this.supportsStandaloneMode()
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('[CrossPlatformDetector] Error getting environment summary:', error);
            return {
                platform: { name: 'unknown' },
                browser: { name: 'unknown' },
                pwaSupport: { isFullySupported: false },
                installationInstructions: this.getGenericInstructions(),
                capabilities: {
                    canInstall: false,
                    isInstalled: false,
                    needsManualInstructions: false
                },
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Log detailed environment information for debugging
     */
    logEnvironmentInfo() {
        try {
            const summary = this.getEnvironmentSummary();
            
            console.group('[CrossPlatformDetector] Environment Information');
            console.log('Platform:', summary.platform.name, summary.platform.version);
            console.log('Browser:', summary.browser.name, summary.browser.version);
            console.log('PWA Readiness Score:', summary.pwaSupport.readinessScore + '%');
            console.log('Can Install:', summary.capabilities.canInstall);
            console.log('Is Installed:', summary.capabilities.isInstalled);
            console.log('Needs Manual Instructions:', summary.capabilities.needsManualInstructions);
            console.table(summary.pwaSupport);
            console.groupEnd();
        } catch (error) {
            console.error('[CrossPlatformDetector] Error logging environment info:', error);
        }
    }
}

// Make CrossPlatformDetector available globally
window.CrossPlatformDetector = CrossPlatformDetector;