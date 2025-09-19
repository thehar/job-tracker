/**
 * Job Tracker Application Entry Point
 * Initializes the application and handles global setup
 */

// Global application variables
let authManager;
let jobTracker;
let dashboard;
let settingsManager;
let weeklyReportManager;
let pwaInstallManager;
let adminPanel;

/**
 * Initialize the Job Tracker application
 */
document.addEventListener('DOMContentLoaded', () => {
    // Initialize offline detection
    initializeOfflineDetection();
    
    // Start with authentication
    authManager = new AuthManager();
    
    // Initialize admin panel after a short delay to ensure other components are ready
    setTimeout(() => {
        initializeAdminPanel();
    }, 1000);
});

/**
 * Handle service worker registration for offline capabilities
 */
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        registerServiceWorker();
        console.log('Job Tracker loaded successfully');
    });
}

/**
 * Register service worker for offline functionality
 */
async function registerServiceWorker() {
    try {
        console.log('[App] Registering service worker...');
        
        const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/'
        });
        
        console.log('[App] Service worker registered successfully:', registration.scope);
        
        // Handle service worker updates
        registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            console.log('[App] New service worker found, installing...');
            
            newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed') {
                    if (navigator.serviceWorker.controller) {
                        // New service worker available
                        console.log('[App] New service worker available');
                        showUpdateNotification();
                    } else {
                        // First time installation
                        console.log('[App] Service worker installed for first time');
                        showOfflineReadyNotification();
                    }
                }
            });
        });
        
        // Listen for service worker messages
        navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
        
        // Check if we're already controlled by a service worker
        if (navigator.serviceWorker.controller) {
            console.log('[App] Page is controlled by service worker');
        }
        
        // Initialize PWA installation manager after service worker registration
        // Add a small delay to ensure all dependencies are loaded
        setTimeout(() => {
            initializePWAInstallManager();
        }, 100);
        
    } catch (error) {
        console.error('[App] Service worker registration failed:', error);
        
        // Provide user feedback about offline functionality
        if (window.NotificationManager) {
            NotificationManager.warning('Offline features may not be available. Some functionality may be limited.');
        }
        
        // Still initialize PWA manager even if service worker fails
        setTimeout(() => {
            try {
                initializePWAInstallManager();
            } catch (pwaError) {
                console.error('[App] PWA manager initialization failed after SW failure:', pwaError);
            }
        }, 100);
        
        // Track the error for analytics if available
        if (window.analytics && typeof window.analytics.trackError === 'function') {
            window.analytics.trackError(error, { context: 'service_worker_registration' });
        }
    }
}

/**
 * Handle messages from service worker
 * @param {MessageEvent} event - Message event from service worker
 */
function handleServiceWorkerMessage(event) {
    const { type, data } = event.data;
    
    switch (type) {
        case 'CACHE_UPDATED':
            console.log('[App] Cache updated by service worker');
            break;
            
        case 'OFFLINE_READY':
            showOfflineReadyNotification();
            break;
            
        default:
            console.log('[App] Unknown service worker message:', type);
    }
}

/**
 * Initialize PWA Installation Manager
 */
function initializePWAInstallManager() {
    try {
        if (typeof PWAInstallManager !== 'undefined') {
            pwaInstallManager = new PWAInstallManager();
            
            // Check if app is already installed before initializing
            const isInstalled = checkIfAppInstalled();
            if (isInstalled) {
                console.log('[App] App is already installed, updating status');
                pwaInstallManager.storage.setInstallationStatus('installed');
                pwaInstallManager.isInstalled = true;
                
                // Track installation if not already tracked
                const installDate = pwaInstallManager.storage.getInstallDate();
                if (!installDate) {
                    pwaInstallManager.storage.setInstallDate();
                    pwaInstallManager.analytics.trackInstallSuccess({
                        source: 'app_launch_detection',
                        detectionMethod: 'standalone_mode'
                    });
                }
            }
            
            // Initialize the manager
            pwaInstallManager.init();
            
            // Set up app installed event listener for future installations
            setupAppInstalledListener();
            
            console.log('[App] PWA Install Manager initialized successfully');
        } else {
            console.warn('[App] PWAInstallManager class not available');
        }
    } catch (error) {
        console.error('[App] Error initializing PWA Install Manager:', error);
        
        // Show user-friendly notification if PWA features fail
        if (window.NotificationManager) {
            NotificationManager.info('Some installation features may not be available in this browser.');
        }
    }
}

/**
 * Show notification that app is ready for offline use
 */
function showOfflineReadyNotification() {
    showPWANotification('App is ready for offline use!', 'success');
}

/**
 * Show PWA installation related notifications
 * @param {string} message - Notification message
 * @param {string} type - Notification type ('success', 'error', 'info')
 */
function showPWANotification(message, type = 'info') {
    try {
        if (window.NotificationManager) {
            switch (type) {
                case 'success':
                    NotificationManager.success(message);
                    break;
                case 'error':
                    NotificationManager.error(message);
                    break;
                case 'info':
                default:
                    NotificationManager.info(message);
                    break;
            }
        } else if (window.showNotification) {
            window.showNotification(message, type);
        } else {
            console.log(`[App] PWA Notification (${type}): ${message}`);
        }
    } catch (error) {
        console.error('[App] Error showing PWA notification:', error);
    }
}

/**
 * Make PWA notification function available to PWA Install Manager
 */
window.showPWANotification = showPWANotification;

/**
 * Get PWA Install Manager instance (for Settings integration)
 * @returns {PWAInstallManager|null} PWA Install Manager instance or null
 */
window.getPWAInstallManager = function() {
    return pwaInstallManager || null;
};

/**
 * Manually trigger PWA installation (for Settings integration)
 * @returns {boolean} True if installation was triggered successfully
 */
window.triggerPWAInstall = function() {
    try {
        if (pwaInstallManager && typeof pwaInstallManager.manualInstall === 'function') {
            return pwaInstallManager.manualInstall();
        } else {
            console.warn('[App] PWA Install Manager not available for manual installation');
            showPWANotification('Installation feature is not available.', 'error');
            return false;
        }
    } catch (error) {
        console.error('[App] Error triggering manual PWA installation:', error);
        showPWANotification('Failed to trigger installation.', 'error');
        return false;
    }
};

/**
 * Reset PWA installation preferences (for Settings integration)
 * @returns {boolean} True if reset was successful
 */
window.resetPWAInstallPreferences = function() {
    try {
        if (pwaInstallManager && pwaInstallManager.storage) {
            pwaInstallManager.storage.resetInstallationData();
            console.log('[App] PWA installation preferences reset');
            if (window.NotificationManager) {
                NotificationManager.success('Installation preferences have been reset.');
            }
            return true;
        } else {
            console.warn('[App] PWA Install Manager not available for reset');
            return false;
        }
    } catch (error) {
        console.error('[App] Error resetting PWA installation preferences:', error);
        if (window.NotificationManager) {
            NotificationManager.error('Failed to reset installation preferences.');
        }
        return false;
    }
};

/**
 * Verify PWA installation integration on app startup
 */
function verifyPWAIntegration() {
    try {
        console.group('[App] PWA Integration Verification');
        
        // Check required classes
        const requiredClasses = [
            'PWAInstallManager',
            'InstallAnalytics', 
            'InstallPromptUI',
            'CrossPlatformDetector',
            'InstallationStorage'
        ];
        
        let allClassesAvailable = true;
        requiredClasses.forEach(className => {
            if (window[className]) {
                console.log(`✓ ${className} is available`);
            } else {
                console.error(`✗ ${className} is NOT available`);
                allClassesAvailable = false;
            }
        });
        
        // Check PWA manager initialization
        if (pwaInstallManager) {
            console.log('✓ PWA Install Manager is initialized');
            console.log('  - Installation status:', pwaInstallManager.storage.getInstallationStatus());
            console.log('  - Is installed:', pwaInstallManager.isInstalled);
            console.log('  - Session count:', pwaInstallManager.storage.getSessionCount());
        } else {
            console.error('✗ PWA Install Manager is NOT initialized');
            allClassesAvailable = false;
        }
        
        // Check notification integration
        if (window.showPWANotification) {
            console.log('✓ PWA notification integration is available');
        } else {
            console.error('✗ PWA notification integration is NOT available');
        }
        
        // Check global functions
        const globalFunctions = [
            'getPWAInstallManager',
            'getPWAInstallStatus', 
            'triggerPWAInstall',
            'resetPWAInstallPreferences'
        ];
        
        globalFunctions.forEach(funcName => {
            if (window[funcName]) {
                console.log(`✓ ${funcName} is available globally`);
            } else {
                console.error(`✗ ${funcName} is NOT available globally`);
                allClassesAvailable = false;
            }
        });
        
        console.log(`PWA Integration Status: ${allClassesAvailable ? 'SUCCESS' : 'FAILED'}`);
        console.groupEnd();
        
        return allClassesAvailable;
    } catch (error) {
        console.error('[App] Error verifying PWA integration:', error);
        return false;
    }
}

// Run verification after a delay to ensure all components are loaded
setTimeout(() => {
    verifyPWAIntegration();
}, 500);

/**
 * Show notification that an update is available
 */
function showUpdateNotification() {
    showPWANotification('A new version is available. Refresh to update.', 'info');
}

/**
 * Force service worker update (for manual refresh)
 */
window.updateServiceWorker = async function() {
    try {
        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.getRegistration();
            if (registration) {
                await registration.update();
                console.log('[App] Service worker update initiated successfully');
                
                if (window.NotificationManager) {
                    NotificationManager.info('Checking for updates...');
                }
            } else {
                console.warn('[App] No service worker registration found for update');
                if (window.NotificationManager) {
                    NotificationManager.warning('No service worker found to update');
                }
            }
        } else {
            console.warn('[App] Service workers not supported for update');
            if (window.NotificationManager) {
                NotificationManager.warning('Service workers not supported in this browser');
            }
        }
    } catch (error) {
        console.error('[App] Service worker update failed:', error);
        if (window.NotificationManager) {
            NotificationManager.error('Failed to update service worker. Please refresh manually.');
        }
        
        // Track error for analytics
        if (window.analytics && typeof window.analytics.trackError === 'function') {
            window.analytics.trackError(error, { context: 'service_worker_update' });
        }
    }
};

/**
 * Get service worker status information
 */
window.getServiceWorkerStatus = async function() {
    try {
        if (!('serviceWorker' in navigator)) {
            return { 
                supported: false, 
                error: 'Service workers not supported in this browser' 
            };
        }
        
        const registration = await navigator.serviceWorker.getRegistration();
        return {
            supported: true,
            registered: !!registration,
            controlled: !!navigator.serviceWorker.controller,
            scope: registration?.scope,
            state: registration?.active?.state || 'unknown'
        };
    } catch (error) {
        console.error('[App] Failed to get service worker status:', error);
        
        // Track error for analytics
        if (window.analytics && typeof window.analytics.trackError === 'function') {
            window.analytics.trackError(error, { context: 'service_worker_status_check' });
        }
        
        return {
            supported: true,
            registered: false,
            controlled: false,
            error: error.message,
            fallback: true
        };
    }
};

/**
 * Handle unhandled errors and show user-friendly messages
 */
window.addEventListener('error', (event) => {
    console.error('Application error:', event.error);
    if (window.NotificationManager) {
        NotificationManager.error('An unexpected error occurred. Please try again.');
    }
});

/**
 * Handle unhandled promise rejections
 */
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    if (window.NotificationManager) {
        NotificationManager.error('An unexpected error occurred. Please try again.');
    }
    event.preventDefault();
});

/**
 * Cleanup function for when the page is being unloaded
 */
window.addEventListener('beforeunload', () => {
    // Cleanup any ongoing operations
    if (jobTracker) {
        jobTracker.saveJobs();
    }
});

/**
 * Initialize offline detection and UI updates
 */
function initializeOfflineDetection() {
    // Set initial state
    updateOfflineStatus();
    
    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    console.log('[App] Offline detection initialized');
}

/**
 * Handle when the app goes offline
 */
function handleOffline() {
    console.log('[App] Application went offline');
    showOfflineIndicator();
    
    if (window.NotificationManager) {
        NotificationManager.info('You are now offline. Changes will be saved locally.');
    } else if (window.showNotification) {
        window.showNotification('You are now offline. Changes will be saved locally.', 'warning');
    }
}

/**
 * Handle when the app comes back online
 */
function handleOnline() {
    console.log('[App] Application came back online');
    hideOfflineIndicator();
    showOnlineIndicator();
    
    if (window.NotificationManager) {
        NotificationManager.success('You are back online!');
    } else if (window.showNotification) {
        window.showNotification('You are back online!', 'success');
    }
    
    // Hide online indicator after 3 seconds
    setTimeout(hideOnlineIndicator, 3000);
}

/**
 * Update offline status based on navigator.onLine
 */
function updateOfflineStatus() {
    if (navigator.onLine) {
        hideOfflineIndicator();
    } else {
        showOfflineIndicator();
    }
}

/**
 * Show the offline indicator
 */
function showOfflineIndicator() {
    const indicator = document.getElementById('offlineIndicator');
    if (indicator) {
        indicator.classList.remove('hidden');
        indicator.setAttribute('aria-label', 'You are currently offline');
    }
}

/**
 * Hide the offline indicator
 */
function hideOfflineIndicator() {
    const indicator = document.getElementById('offlineIndicator');
    if (indicator) {
        indicator.classList.add('hidden');
        indicator.removeAttribute('aria-label');
    }
}

/**
 * Show temporary online indicator
 */
function showOnlineIndicator() {
    // Create temporary online indicator
    const existingIndicator = document.querySelector('.online-indicator');
    if (existingIndicator) {
        existingIndicator.remove();
    }
    
    const header = document.querySelector('.header');
    if (header) {
        const onlineIndicator = document.createElement('div');
        onlineIndicator.className = 'online-indicator';
        
        const icon = document.createElement('span');
        icon.className = 'offline-icon';
        icon.textContent = '✅';
        
        const text = document.createElement('span');
        text.className = 'offline-text';
        text.textContent = 'Back online - all features available';
        
        onlineIndicator.appendChild(icon);
        onlineIndicator.appendChild(text);
        onlineIndicator.setAttribute('role', 'status');
        onlineIndicator.setAttribute('aria-live', 'polite');
        onlineIndicator.setAttribute('aria-label', 'You are back online');
        
        header.appendChild(onlineIndicator);
    }
}

/**
 * Hide the online indicator
 */
function hideOnlineIndicator() {
    const indicator = document.querySelector('.online-indicator');
    if (indicator) {
        indicator.remove();
    }
}

/**
 * Get current network status
 */
window.getNetworkStatus = function() {
    return {
        online: navigator.onLine,
        connection: navigator.connection || navigator.mozConnection || navigator.webkitConnection,
        serviceWorkerReady: !!navigator.serviceWorker?.controller
    };
};

/**
 * Check if the app is currently installed (running in standalone mode)
 * @returns {boolean} True if app is installed
 */
function checkIfAppInstalled() {
    try {
        // Check if running in standalone mode (PWA installed)
        if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
            return true;
        }
        
        // Check iOS Safari standalone mode
        if (window.navigator.standalone === true) {
            return true;
        }
        
        // Check if running in fullscreen mode (Android PWA)
        if (window.matchMedia && window.matchMedia('(display-mode: fullscreen)').matches) {
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('[App] Error checking installation status:', error);
        return false;
    }
}

/**
 * Set up app installed event listener for future installations
 */
function setupAppInstalledListener() {
    try {
        // Listen for appinstalled event (Chrome/Edge)
        window.addEventListener('appinstalled', handleAppInstalled);
        
        // Listen for display-mode changes (when app enters standalone mode)
        if (window.matchMedia) {
            const standaloneQuery = window.matchMedia('(display-mode: standalone)');
            standaloneQuery.addEventListener('change', handleDisplayModeChange);
        }
        
        console.log('[App] App installed event listeners set up');
    } catch (error) {
        console.error('[App] Error setting up app installed listeners:', error);
    }
}

/**
 * Handle app installed event
 * @param {Event} event - The appinstalled event
 */
function handleAppInstalled(event) {
    try {
        console.log('[App] App installation detected via appinstalled event');
        
        if (pwaInstallManager) {
            // Update installation status
            pwaInstallManager.isInstalled = true;
            pwaInstallManager.storage.setInstallationStatus('installed');
            pwaInstallManager.storage.setInstallDate();
            
            // Track successful installation
            pwaInstallManager.analytics.trackInstallSuccess({
                source: 'appinstalled_event',
                timestamp: new Date().toISOString()
            });
            
            // Clear any deferred prompt
            pwaInstallManager.deferredPrompt = null;
        }
        
        // Show success notification using existing notification system
        if (window.NotificationManager) {
            NotificationManager.success('App installed successfully! You can now access it from your home screen.');
        } else if (window.showNotification) {
            window.showNotification('App installed successfully! You can now access it from your home screen.', 'success');
        }
        
        console.log('[App] App installation handled successfully');
    } catch (error) {
        console.error('[App] Error handling app installed event:', error);
    }
}

/**
 * Handle display mode changes (when app enters/exits standalone mode)
 * @param {MediaQueryListEvent} event - The display mode change event
 */
function handleDisplayModeChange(event) {
    try {
        if (event.matches) {
            // App entered standalone mode
            console.log('[App] App entered standalone mode');
            
            if (pwaInstallManager && !pwaInstallManager.isInstalled) {
                // This might be a new installation
                handleAppInstalled({ type: 'display-mode-change' });
            }
        }
    } catch (error) {
        console.error('[App] Error handling display mode change:', error);
    }
}

/**
 * Get PWA installation status (for debugging and testing)
 */
window.getPWAInstallStatus = function() {
    if (pwaInstallManager) {
        return {
            ...pwaInstallManager.getInstallationStatus(),
            isCurrentlyInstalled: checkIfAppInstalled(),
            managerInitialized: true
        };
    }
    return { 
        error: 'PWA Install Manager not initialized',
        isCurrentlyInstalled: checkIfAppInstalled(),
        managerInitialized: false
    };
};

/**
 * Initialize offline settings functionality
 */
function initializeOfflineSettings() {
    // Cache management buttons
    const refreshCacheBtn = document.getElementById('refreshCacheBtn');
    const clearCacheBtn = document.getElementById('clearCacheBtn');
    const checkCacheBtn = document.getElementById('checkCacheBtn');

    // Helper function to add accessible click and keyboard handlers
    function addAccessibleEventListener(element, handler) {
        if (!element || typeof handler !== 'function') return;
        
        element.addEventListener('click', handler);
        element.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handler();
            }
        });
    }

    // Add accessible event listeners to cache management buttons
    addAccessibleEventListener(refreshCacheBtn, handleRefreshCache);
    addAccessibleEventListener(clearCacheBtn, handleClearCache);
    addAccessibleEventListener(checkCacheBtn, handleCheckCache);

    // Update status when offline tab is opened
    const offlineTab = document.querySelector('[data-tab="offline"]');
    addAccessibleEventListener(offlineTab, updateOfflineSettingsDisplay);

    // Initial status update
    updateOfflineSettingsDisplay();
}

/**
 * Update offline settings status display
 */
async function updateOfflineSettingsDisplay() {
    const swStatus = document.getElementById('swStatus');
    const swVersion = document.getElementById('swVersion');
    const cachedAssets = document.getElementById('cachedAssets');
    const networkStatus = document.getElementById('networkStatus');
    const lastOnline = document.getElementById('lastOnline');

    // Update network status
    if (networkStatus) {
        const isOnline = navigator.onLine;
        networkStatus.textContent = isOnline ? 'Online' : 'Offline';
        networkStatus.className = `status-value ${isOnline ? 'online' : 'offline'}`;
    }

    // Update last online time
    if (lastOnline) {
        const lastOnlineTime = localStorage.getItem('lastOnlineTime');
        if (lastOnlineTime) {
            const date = new Date(lastOnlineTime);
            lastOnline.textContent = date.toLocaleString();
        } else {
            lastOnline.textContent = 'Unknown';
        }
    }

    // Update service worker status
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.getRegistration();
            const isControlled = !!navigator.serviceWorker.controller;

            if (swStatus) {
                if (registration && isControlled) {
                    swStatus.textContent = 'Active';
                    swStatus.className = 'status-value online';
                } else if (registration) {
                    swStatus.textContent = 'Registered';
                    swStatus.className = 'status-value';
                } else {
                    swStatus.textContent = 'Not Registered';
                    swStatus.className = 'status-value error';
                }
            }

            // Get cache status from service worker
            if (isControlled) {
                const cacheStatus = await getServiceWorkerCacheStatus();
                if (swVersion) {
                    swVersion.textContent = cacheStatus.version || 'Unknown';
                }
                if (cachedAssets) {
                    cachedAssets.textContent = cacheStatus.totalAssets || '0';
                }
            }

        } catch (error) {
            console.error('[App] Error updating service worker status:', error);
            
            // Provide detailed error information in UI
            if (swStatus) {
                swStatus.textContent = 'Error';
                swStatus.className = 'status-value error';
                swStatus.title = `Service worker status check failed: ${error.message}`;
            }
            
            // Try to provide fallback information
            try {
                if (swVersion) {
                    swVersion.textContent = 'Unknown';
                }
                if (cachedAssets) {
                    cachedAssets.textContent = 'Unknown';
                }
            } catch (fallbackError) {
                console.error('[App] Error setting fallback status values:', fallbackError);
            }
            
            // Track error for analytics
            if (window.analytics && typeof window.analytics.trackError === 'function') {
                window.analytics.trackError(error, { context: 'offline_settings_display_update' });
            }
        }
    } else {
        if (swStatus) {
            swStatus.textContent = 'Not Supported';
            swStatus.className = 'status-value error';
        }
    }
}

/**
 * Get cache status from service worker
 */
async function getServiceWorkerCacheStatus() {
    return new Promise((resolve) => {
        if (!navigator.serviceWorker.controller) {
            resolve({});
            return;
        }

        const messageChannel = new MessageChannel();
        messageChannel.port1.onmessage = (event) => {
            resolve(event.data);
        };

        navigator.serviceWorker.controller.postMessage(
            { type: 'GET_CACHE_STATUS' },
            [messageChannel.port2]
        );

        // Timeout after 5 seconds
        setTimeout(() => resolve({}), 5000);
    });
}

/**
 * Handle refresh cache button click
 */
async function handleRefreshCache() {
    const resultDiv = document.getElementById('cacheActionResult');
    showCacheResult('Refreshing cache...', 'info');

    try {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            // Force service worker update
            const registration = await navigator.serviceWorker.getRegistration();
            if (registration) {
                await registration.update();
            }

            // Precache assets
            const result = await precacheAssets();
            if (result.success) {
                showCacheResult(`Cache refreshed! ${result.cachedAssets} assets cached.`, 'success');
            } else {
                showCacheResult(`Cache refresh failed: ${result.error}`, 'error');
            }
        } else {
            showCacheResult('Service worker not available', 'error');
        }
    } catch (error) {
        console.error('[App] Cache refresh failed:', error);
        showCacheResult(`Cache refresh failed: ${error.message}`, 'error');
        
        // Try alternative refresh method
        try {
            if ('serviceWorker' in navigator) {
                const registration = await navigator.serviceWorker.getRegistration();
                if (registration) {
                    // Force a hard refresh as fallback
                    showCacheResult('Attempting alternative refresh method...', 'info');
                    await registration.update();
                    showCacheResult('Alternative refresh completed. Please reload the page.', 'warning');
                }
            }
        } catch (fallbackError) {
            console.error('[App] Alternative refresh method also failed:', fallbackError);
            showCacheResult('All refresh methods failed. Please reload the page manually.', 'error');
        }
        
        // Track error for analytics
        if (window.analytics && typeof window.analytics.trackError === 'function') {
            window.analytics.trackError(error, { context: 'cache_refresh' });
        }
    }

    // Update status with error handling
    setTimeout(async () => {
        try {
            await updateOfflineSettingsDisplay();
        } catch (statusError) {
            console.error('[App] Failed to update status after cache refresh:', statusError);
        }
    }, 1000);
}

/**
 * Handle clear cache button click
 */
async function handleClearCache() {
    const resultDiv = document.getElementById('cacheActionResult');
    showCacheResult('Clearing cache...', 'info');

    try {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            const result = await clearServiceWorkerCache();
            if (result.success) {
                showCacheResult('Cache cleared successfully!', 'success');
            } else {
                showCacheResult('Failed to clear cache', 'error');
            }
        } else {
            showCacheResult('Service worker not available', 'error');
        }
    } catch (error) {
        console.error('[App] Clear cache failed:', error);
        showCacheResult(`Clear cache failed: ${error.message}`, 'error');
        
        // Provide user guidance for manual cache clearing
        if (error.name === 'SecurityError') {
            showCacheResult('Security error: Try clearing browser cache manually via browser settings.', 'warning');
        } else if (error.name === 'QuotaExceededError') {
            showCacheResult('Storage quota exceeded: Some cache may remain. Try clearing browser data.', 'warning');
        }
        
        // Track error for analytics
        if (window.analytics && typeof window.analytics.trackError === 'function') {
            window.analytics.trackError(error, { context: 'cache_clear' });
        }
    }

    // Update status with error handling
    setTimeout(async () => {
        try {
            await updateOfflineSettingsDisplay();
        } catch (statusError) {
            console.error('[App] Failed to update status after cache clear:', statusError);
        }
    }, 1000);
}

/**
 * Handle check cache button click
 */
async function handleCheckCache() {
    showCacheResult('Checking cache status...', 'info');

    try {
        const cacheStatus = await getServiceWorkerCacheStatus();
        const message = `Cache Status: ${cacheStatus.totalAssets || 0} assets cached, Version: ${cacheStatus.version || 'Unknown'}`;
        showCacheResult(message, 'success');
    } catch (error) {
        console.error('[App] Cache status check failed:', error);
        showCacheResult(`Check failed: ${error.message}`, 'error');
        
        // Try to provide partial information
        try {
            if ('serviceWorker' in navigator) {
                const registration = await navigator.serviceWorker.getRegistration();
                if (registration) {
                    showCacheResult('Service worker is registered, but cache details unavailable.', 'warning');
                } else {
                    showCacheResult('No service worker registration found.', 'warning');
                }
            } else {
                showCacheResult('Service workers not supported in this browser.', 'warning');
            }
        } catch (fallbackError) {
            console.error('[App] Fallback cache check also failed:', fallbackError);
        }
        
        // Track error for analytics
        if (window.analytics && typeof window.analytics.trackError === 'function') {
            window.analytics.trackError(error, { context: 'cache_status_check' });
        }
    }

    // Update status with error handling
    try {
        await updateOfflineSettingsDisplay();
    } catch (statusError) {
        console.error('[App] Failed to update status after cache check:', statusError);
    }
}

/**
 * Show cache operation result
 */
function showCacheResult(message, type) {
    const resultDiv = document.getElementById('cacheActionResult');
    if (resultDiv) {
        resultDiv.textContent = message;
        resultDiv.className = `cache-result ${type}`;
        resultDiv.classList.remove('hidden');

        // Hide after 5 seconds for non-error messages
        if (type !== 'error') {
            setTimeout(() => {
                resultDiv.classList.add('hidden');
            }, 5000);
        }
    }
}

/**
 * Precache assets via service worker
 */
async function precacheAssets() {
    return new Promise((resolve) => {
        if (!navigator.serviceWorker.controller) {
            resolve({ success: false, error: 'Service worker not available' });
            return;
        }

        const messageChannel = new MessageChannel();
        messageChannel.port1.onmessage = (event) => {
            resolve(event.data);
        };

        navigator.serviceWorker.controller.postMessage(
            { type: 'PRECACHE_ASSETS' },
            [messageChannel.port2]
        );

        // Timeout after 10 seconds
        setTimeout(() => resolve({ success: false, error: 'Timeout' }), 10000);
    });
}

/**
 * Clear service worker cache
 */
async function clearServiceWorkerCache() {
    return new Promise((resolve) => {
        if (!navigator.serviceWorker.controller) {
            resolve({ success: false, error: 'Service worker not available' });
            return;
        }

        const messageChannel = new MessageChannel();
        messageChannel.port1.onmessage = (event) => {
            resolve(event.data);
        };

        navigator.serviceWorker.controller.postMessage(
            { type: 'CLEAR_CACHE' },
            [messageChannel.port2]
        );

        // Timeout after 5 seconds
        setTimeout(() => resolve({ success: false, error: 'Timeout' }), 5000);
    });
}

/**
 * Track online/offline times
 */
function trackOnlineStatus() {
    if (navigator.onLine) {
        localStorage.setItem('lastOnlineTime', new Date().toISOString());
    }
}

// Initialize offline settings when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Track online status
    trackOnlineStatus();
    window.addEventListener('online', trackOnlineStatus);
    
    // Initialize offline settings after a short delay to ensure other components are ready
    setTimeout(initializeOfflineSettings, 1000);
});

/**
 * Admin Panel Manager
 * Handles admin panel functionality including PWA installation analytics
 */
class AdminPanel {
    constructor() {
        this.isVisible = false;
        this.analytics = null;
        this.pwaManager = null;
        this.init();
    }

    /**
     * Initialize admin panel
     */
    init() {
        try {
            console.log('[AdminPanel] Initializing admin panel...');
            
            // Get references to PWA components
            this.pwaManager = window.getPWAInstallManager();
            this.analytics = window.InstallAnalytics ? new window.InstallAnalytics() : null;
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Set up keyboard shortcuts
            this.setupKeyboardShortcuts();
            
            // Create admin panel UI if it doesn't exist
            this.createAdminPanelUI();
            
            console.log('[AdminPanel] Admin panel initialized successfully');
        } catch (error) {
            console.error('[AdminPanel] Error initializing admin panel:', error);
        }
    }

    /**
     * Set up event listeners for admin panel
     */
    setupEventListeners() {
        // Listen for admin tab clicks
        const adminTab = document.getElementById('adminTab');
        if (adminTab) {
            adminTab.addEventListener('click', () => {
                this.showAdminPanel();
            });
        }

        // Listen for PWA installation events to update admin panel
        if (this.pwaManager) {
            // We'll listen for custom events that the PWA manager can dispatch
            document.addEventListener('pwa-install-event', (event) => {
                this.handlePWAEvent(event.detail);
            });
        }
    }

    /**
     * Set up keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            // Alt + A to toggle admin panel
            if (event.altKey && event.key === 'a') {
                event.preventDefault();
                this.toggleAdminPanel();
            }
            
            // Escape to close admin panel
            if (event.key === 'Escape' && this.isVisible) {
                this.hideAdminPanel();
            }
        });
    }

    /**
     * Create admin panel UI if it doesn't exist
     */
    createAdminPanelUI() {
        // Check if admin section already exists
        let adminSection = document.getElementById('adminSection');
        if (!adminSection) {
            adminSection = this.createAdminSection();
        }
        
        // Ensure admin tab exists
        this.ensureAdminTabExists();
    }

    /**
     * Create admin section HTML
     */
    createAdminSection() {
        const adminSection = document.createElement('div');
        adminSection.id = 'adminSection';
        adminSection.className = 'admin-section hidden';
        
        adminSection.innerHTML = `
            <div class="admin-header">
                <h2>Admin Panel</h2>
                <p class="admin-subtitle">PWA Installation Analytics & System Management</p>
            </div>
            
            <div class="admin-content">
                <!-- PWA Installation Analytics -->
                <div class="admin-card">
                    <h3>PWA Installation Analytics</h3>
                    <div class="analytics-grid">
                        <div class="analytics-card">
                            <div class="analytics-label">Total Prompts</div>
                            <div class="analytics-value" id="adminTotalPrompts">-</div>
                        </div>
                        <div class="analytics-card">
                            <div class="analytics-label">Install Clicks</div>
                            <div class="analytics-value" id="adminInstallClicks">-</div>
                        </div>
                        <div class="analytics-card">
                            <div class="analytics-label">Conversion Rate</div>
                            <div class="analytics-value" id="adminConversionRate">-</div>
                        </div>
                        <div class="analytics-card">
                            <div class="analytics-label">Install Success</div>
                            <div class="analytics-value" id="adminInstallSuccess">-</div>
                        </div>
                    </div>
                    
                    <div class="admin-actions">
                        <button id="refreshAnalyticsBtn" class="btn btn-primary">Refresh Analytics</button>
                        <button id="exportAnalyticsBtn" class="btn btn-secondary">Export Data</button>
                        <button id="resetAnalyticsBtn" class="btn btn-danger">Reset Analytics</button>
                    </div>
                </div>

                <!-- PWA Installation Status -->
                <div class="admin-card">
                    <h3>PWA Installation Status</h3>
                    <div class="status-grid">
                        <div class="status-item">
                            <span class="status-label">Installation Status:</span>
                            <span class="status-value" id="adminInstallStatus">-</span>
                        </div>
                        <div class="status-item">
                            <span class="status-label">Session Count:</span>
                            <span class="status-value" id="adminSessionCount">-</span>
                        </div>
                        <div class="status-item">
                            <span class="status-label">Prompt Count:</span>
                            <span class="status-value" id="adminPromptCount">-</span>
                        </div>
                        <div class="status-item">
                            <span class="status-label">Dismissal Count:</span>
                            <span class="status-value" id="adminDismissalCount">-</span>
                        </div>
                    </div>
                    
                    <div class="admin-actions">
                        <button id="triggerInstallBtn" class="btn btn-primary">Trigger Install Prompt</button>
                        <button id="resetInstallPrefsBtn" class="btn btn-warning">Reset Install Preferences</button>
                    </div>
                </div>

                <!-- System Information -->
                <div class="admin-card">
                    <h3>System Information</h3>
                    <div class="system-info">
                        <div class="info-item">
                            <span class="info-label">Browser:</span>
                            <span class="info-value" id="adminBrowserInfo">-</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Platform:</span>
                            <span class="info-value" id="adminPlatformInfo">-</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">PWA Support:</span>
                            <span class="info-value" id="adminPWASupport">-</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Service Worker:</span>
                            <span class="info-value" id="adminServiceWorker">-</span>
                        </div>
                    </div>
                </div>

                <!-- Recent Activity -->
                <div class="admin-card">
                    <h3>Recent PWA Events</h3>
                    <div class="recent-events" id="adminRecentEvents">
                        <p class="no-events">No recent events</p>
                    </div>
                </div>
            </div>
        `;
        
        // Insert admin section after dashboard section
        const dashboardSection = document.getElementById('dashboardSection');
        if (dashboardSection && dashboardSection.parentNode) {
            dashboardSection.parentNode.insertBefore(adminSection, dashboardSection.nextSibling);
        } else {
            // Fallback: append to body
            document.body.appendChild(adminSection);
        }
        
        // Set up admin section event listeners
        this.setupAdminSectionEventListeners();
        
        return adminSection;
    }

    /**
     * Ensure admin tab exists in navigation
     */
    ensureAdminTabExists() {
        const adminTab = document.getElementById('adminTab');
        if (!adminTab) {
            const tabContainer = document.querySelector('.tab-container');
            if (tabContainer) {
                const adminTabElement = document.createElement('button');
                adminTabElement.id = 'adminTab';
                adminTabElement.className = 'tab';
                adminTabElement.textContent = 'Admin';
                adminTabElement.title = 'Admin Panel (Alt+A)';
                
                tabContainer.appendChild(adminTabElement);
                
                // Add click event listener
                adminTabElement.addEventListener('click', () => {
                    this.showAdminPanel();
                });
            }
        }
    }

    /**
     * Set up event listeners for admin section buttons
     */
    setupAdminSectionEventListeners() {
        // Refresh analytics button
        const refreshBtn = document.getElementById('refreshAnalyticsBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshAnalytics();
            });
        }

        // Export analytics button
        const exportBtn = document.getElementById('exportAnalyticsBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportAnalytics();
            });
        }

        // Reset analytics button
        const resetBtn = document.getElementById('resetAnalyticsBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetAnalytics();
            });
        }

        // Trigger install button
        const triggerBtn = document.getElementById('triggerInstallBtn');
        if (triggerBtn) {
            triggerBtn.addEventListener('click', () => {
                this.triggerInstallPrompt();
            });
        }

        // Reset install preferences button
        const resetPrefsBtn = document.getElementById('resetInstallPrefsBtn');
        if (resetPrefsBtn) {
            resetPrefsBtn.addEventListener('click', () => {
                this.resetInstallPreferences();
            });
        }
    }

    /**
     * Show admin panel
     */
    showAdminPanel() {
        try {
            const adminSection = document.getElementById('adminSection');
            const adminTab = document.getElementById('adminTab');
            
            if (adminSection && adminTab) {
                // Hide other sections
                const jobsSection = document.querySelector('.main-content');
                const dashboardSection = document.getElementById('dashboardSection');
                
                if (jobsSection) jobsSection.classList.add('hidden');
                if (dashboardSection) dashboardSection.classList.add('hidden');
                
                // Show admin section
                adminSection.classList.remove('hidden');
                
                // Update tab states
                const allTabs = document.querySelectorAll('.tab');
                allTabs.forEach(tab => tab.classList.remove('active'));
                adminTab.classList.add('active');
                
                this.isVisible = true;
                
                // Refresh admin panel data
                this.refreshAdminData();
                
                console.log('[AdminPanel] Admin panel shown');
            }
        } catch (error) {
            console.error('[AdminPanel] Error showing admin panel:', error);
        }
    }

    /**
     * Hide admin panel
     */
    hideAdminPanel() {
        try {
            const adminSection = document.getElementById('adminSection');
            const adminTab = document.getElementById('adminTab');
            
            if (adminSection && adminTab) {
                adminSection.classList.add('hidden');
                adminTab.classList.remove('active');
                
                this.isVisible = false;
                
                console.log('[AdminPanel] Admin panel hidden');
            }
        } catch (error) {
            console.error('[AdminPanel] Error hiding admin panel:', error);
        }
    }

    /**
     * Toggle admin panel visibility
     */
    toggleAdminPanel() {
        if (this.isVisible) {
            this.hideAdminPanel();
        } else {
            this.showAdminPanel();
        }
    }

    /**
     * Refresh admin panel data
     */
    refreshAdminData() {
        this.refreshAnalytics();
        this.refreshPWAStatus();
        this.refreshSystemInfo();
        this.refreshRecentEvents();
    }

    /**
     * Refresh analytics data
     */
    refreshAnalytics() {
        try {
            if (!this.analytics) {
                console.warn('[AdminPanel] Analytics not available');
                return;
            }

            const metrics = this.analytics.getInstallMetrics();
            
            // Update analytics cards
            this.updateElement('adminTotalPrompts', metrics.summary.totalPrompts);
            this.updateElement('adminInstallClicks', metrics.summary.installClicks);
            this.updateElement('adminConversionRate', `${metrics.summary.conversionRate.toFixed(1)}%`);
            this.updateElement('adminInstallSuccess', metrics.summary.installSuccess ? 'Yes' : 'No');
            
            console.log('[AdminPanel] Analytics refreshed');
        } catch (error) {
            console.error('[AdminPanel] Error refreshing analytics:', error);
        }
    }

    /**
     * Refresh PWA installation status
     */
    refreshPWAStatus() {
        try {
            if (!this.pwaManager) {
                console.warn('[AdminPanel] PWA Manager not available');
                return;
            }

            const status = this.pwaManager.getInstallationStatus();
            
            // Update status elements
            this.updateElement('adminInstallStatus', status.status || 'Unknown');
            this.updateElement('adminSessionCount', status.sessionCount || 0);
            this.updateElement('adminPromptCount', status.promptCount || 0);
            this.updateElement('adminDismissalCount', status.dismissalCount || 0);
            
            console.log('[AdminPanel] PWA status refreshed');
        } catch (error) {
            console.error('[AdminPanel] Error refreshing PWA status:', error);
        }
    }

    /**
     * Refresh system information
     */
    refreshSystemInfo() {
        try {
            // Get browser info
            const userAgent = navigator.userAgent;
            const browserInfo = this.getBrowserInfo(userAgent);
            const platformInfo = this.getPlatformInfo(userAgent);
            
            this.updateElement('adminBrowserInfo', browserInfo);
            this.updateElement('adminPlatformInfo', platformInfo);
            
            // Check PWA support
            const pwaSupport = this.checkPWASupport();
            this.updateElement('adminPWASupport', pwaSupport);
            
            // Check service worker status
            const swStatus = this.getServiceWorkerStatus();
            this.updateElement('adminServiceWorker', swStatus);
            
            console.log('[AdminPanel] System info refreshed');
        } catch (error) {
            console.error('[AdminPanel] Error refreshing system info:', error);
        }
    }

    /**
     * Refresh recent events
     */
    refreshRecentEvents() {
        try {
            const recentEventsContainer = document.getElementById('adminRecentEvents');
            if (!recentEventsContainer) return;

            if (!this.analytics) {
                recentEventsContainer.innerHTML = '<p class="no-events">Analytics not available</p>';
                return;
            }

            const metrics = this.analytics.getInstallMetrics();
            const recentEvents = metrics.recentActivity || [];

            if (recentEvents.length === 0) {
                recentEventsContainer.innerHTML = '<p class="no-events">No recent events</p>';
                return;
            }

            const eventsHtml = recentEvents.map(event => `
                <div class="event-item">
                    <span class="event-type">${event.type}</span>
                    <span class="event-time">${new Date(event.timestamp).toLocaleString()}</span>
                    <span class="event-platform">${event.platform || 'Unknown'}</span>
                </div>
            `).join('');

            recentEventsContainer.innerHTML = eventsHtml;
            
            console.log('[AdminPanel] Recent events refreshed');
        } catch (error) {
            console.error('[AdminPanel] Error refreshing recent events:', error);
        }
    }

    /**
     * Update element text content
     */
    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    /**
     * Get browser information
     */
    getBrowserInfo(userAgent) {
        const ua = userAgent.toLowerCase();
        if (ua.includes('chrome') && !ua.includes('edg')) return 'Chrome';
        if (ua.includes('firefox')) return 'Firefox';
        if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari';
        if (ua.includes('edg')) return 'Edge';
        return 'Unknown';
    }

    /**
     * Get platform information
     */
    getPlatformInfo(userAgent) {
        const ua = userAgent.toLowerCase();
        if (ua.includes('iphone') || ua.includes('ipad')) return 'iOS';
        if (ua.includes('android')) return 'Android';
        if (ua.includes('mac')) return 'macOS';
        if (ua.includes('win')) return 'Windows';
        if (ua.includes('linux')) return 'Linux';
        return 'Unknown';
    }

    /**
     * Check PWA support
     */
    checkPWASupport() {
        const hasServiceWorker = 'serviceWorker' in navigator;
        const hasManifest = document.querySelector('link[rel="manifest"]') !== null;
        const hasHTTPS = location.protocol === 'https:' || location.hostname === 'localhost';
        
        if (hasServiceWorker && hasManifest && hasHTTPS) {
            return 'Full Support';
        } else if (hasServiceWorker || hasManifest) {
            return 'Partial Support';
        } else {
            return 'No Support';
        }
    }

    /**
     * Get service worker status
     */
    getServiceWorkerStatus() {
        if (!('serviceWorker' in navigator)) {
            return 'Not Supported';
        }
        
        if (navigator.serviceWorker.controller) {
            return 'Active';
        } else {
            return 'Not Active';
        }
    }

    /**
     * Export analytics data
     */
    exportAnalytics() {
        try {
            if (!this.analytics) {
                this.showNotification('Analytics not available', 'error');
                return;
            }

            const format = prompt('Choose export format:\n1. JSON\n2. CSV\n3. Summary Report\n\nEnter 1, 2, or 3:');
            if (!format) return;

            let exportFormat = 'json';
            let fileExtension = 'json';
            let mimeType = 'application/json';

            if (format === '2') {
                exportFormat = 'csv';
                fileExtension = 'csv';
                mimeType = 'text/csv';
            } else if (format === '3') {
                exportFormat = 'summary';
                fileExtension = 'txt';
                mimeType = 'text/plain';
            }

            const exportData = this.analytics.exportAnalytics(exportFormat);
            
            if (!exportData || exportData.trim() === '') {
                this.showNotification('No data to export', 'warning');
                return;
            }

            // Create download
            const blob = new Blob([exportData], { type: mimeType });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `pwa-analytics-${new Date().toISOString().split('T')[0]}.${fileExtension}`;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.showNotification(`Analytics exported as ${exportFormat.toUpperCase()}!`, 'success');
            
        } catch (error) {
            console.error('[AdminPanel] Error exporting analytics:', error);
            this.showNotification('Error exporting analytics', 'error');
        }
    }

    /**
     * Reset analytics data
     */
    resetAnalytics() {
        try {
            if (!this.analytics) {
                this.showNotification('Analytics not available', 'error');
                return;
            }

            const confirmed = confirm(
                'Are you sure you want to reset all analytics data? This action cannot be undone.'
            );

            if (confirmed) {
                this.analytics.resetAnalytics();
                this.refreshAnalytics();
                this.showNotification('Analytics reset successfully!', 'success');
            }
        } catch (error) {
            console.error('[AdminPanel] Error resetting analytics:', error);
            this.showNotification('Error resetting analytics', 'error');
        }
    }

    /**
     * Trigger install prompt
     */
    triggerInstallPrompt() {
        try {
            if (!this.pwaManager) {
                this.showNotification('PWA Manager not available', 'error');
                return;
            }

            const success = this.pwaManager.manualInstallTrigger();
            if (success) {
                this.showNotification('Install prompt triggered!', 'success');
            } else {
                this.showNotification('Install prompt not available', 'warning');
            }
        } catch (error) {
            console.error('[AdminPanel] Error triggering install prompt:', error);
            this.showNotification('Error triggering install prompt', 'error');
        }
    }

    /**
     * Reset install preferences
     */
    resetInstallPreferences() {
        try {
            if (!this.pwaManager) {
                this.showNotification('PWA Manager not available', 'error');
                return;
            }

            const confirmed = confirm(
                'Are you sure you want to reset install preferences? This will clear all installation data.'
            );

            if (confirmed) {
                this.pwaManager.resetInstallationPreferences();
                this.refreshPWAStatus();
                this.showNotification('Install preferences reset successfully!', 'success');
            }
        } catch (error) {
            console.error('[AdminPanel] Error resetting install preferences:', error);
            this.showNotification('Error resetting install preferences', 'error');
        }
    }

    /**
     * Handle PWA events
     */
    handlePWAEvent(eventData) {
        try {
            console.log('[AdminPanel] PWA event received:', eventData);
            
            // Refresh relevant data based on event type
            if (eventData.type === 'install_success' || eventData.type === 'prompt_shown') {
                this.refreshAnalytics();
                this.refreshPWAStatus();
                this.refreshRecentEvents();
            }
        } catch (error) {
            console.error('[AdminPanel] Error handling PWA event:', error);
        }
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        try {
            if (window.showPWANotification) {
                window.showPWANotification(message, type);
            } else if (window.NotificationManager) {
                switch (type) {
                    case 'success':
                        NotificationManager.success(message);
                        break;
                    case 'error':
                        NotificationManager.error(message);
                        break;
                    case 'warning':
                        NotificationManager.warning(message);
                        break;
                    default:
                        NotificationManager.info(message);
                        break;
                }
            } else if (window.showNotification) {
                window.showNotification(message, type);
            } else {
                console.log(`[AdminPanel] ${type.toUpperCase()}: ${message}`);
            }
        } catch (error) {
            console.error('[AdminPanel] Error showing notification:', error);
        }
    }
}

/**
 * Initialize admin panel
 */
function initializeAdminPanel() {
    try {
        if (!adminPanel) {
            adminPanel = new AdminPanel();
            console.log('[App] Admin panel initialized');
        }
    } catch (error) {
        console.error('[App] Error initializing admin panel:', error);
    }
}

/**
 * Get admin panel instance (for external access)
 */
window.getAdminPanel = function() {
    return adminPanel || null;
};

/**
 * Show admin panel (for external access)
 */
window.showAdminPanel = function() {
    if (adminPanel) {
        adminPanel.showAdminPanel();
    }
};

/**
 * Hide admin panel (for external access)
 */
window.hideAdminPanel = function() {
    if (adminPanel) {
        adminPanel.hideAdminPanel();
    }
};

/**
 * Toggle admin panel (for external access)
 */
window.toggleAdminPanel = function() {
    if (adminPanel) {
        adminPanel.toggleAdminPanel();
    }
};