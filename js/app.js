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

/**
 * Initialize the Job Tracker application
 */
document.addEventListener('DOMContentLoaded', () => {
    // Initialize offline detection
    initializeOfflineDetection();
    
    // Start with authentication
    authManager = new AuthManager();
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
        
    } catch (error) {
        console.error('[App] Service worker registration failed:', error);
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
 * Show notification that app is ready for offline use
 */
function showOfflineReadyNotification() {
    if (window.showNotification) {
        window.showNotification('App is ready for offline use!', 'success');
    }
}

/**
 * Show notification that an update is available
 */
function showUpdateNotification() {
    if (window.showNotification) {
        const message = 'A new version is available. Refresh to update.';
        window.showNotification(message, 'info');
    }
}

/**
 * Force service worker update (for manual refresh)
 */
window.updateServiceWorker = async function() {
    if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
            registration.update();
        }
    }
};

/**
 * Get service worker status information
 */
window.getServiceWorkerStatus = async function() {
    if (!('serviceWorker' in navigator)) {
        return { supported: false };
    }
    
    const registration = await navigator.serviceWorker.getRegistration();
    return {
        supported: true,
        registered: !!registration,
        controlled: !!navigator.serviceWorker.controller,
        scope: registration?.scope
    };
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
    
    if (window.showNotification) {
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
    
    if (window.showNotification) {
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
        onlineIndicator.innerHTML = `
            <span class="offline-icon">✅</span>
            <span class="offline-text">Back online - all features available</span>
        `;
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
 * Initialize offline settings functionality
 */
function initializeOfflineSettings() {
    // Cache management buttons
    const refreshCacheBtn = document.getElementById('refreshCacheBtn');
    const clearCacheBtn = document.getElementById('clearCacheBtn');
    const checkCacheBtn = document.getElementById('checkCacheBtn');

    if (refreshCacheBtn) {
        refreshCacheBtn.addEventListener('click', handleRefreshCache);
    }

    if (clearCacheBtn) {
        clearCacheBtn.addEventListener('click', handleClearCache);
    }

    if (checkCacheBtn) {
        checkCacheBtn.addEventListener('click', handleCheckCache);
    }

    // Update status when offline tab is opened
    const offlineTab = document.querySelector('[data-tab="offline"]');
    if (offlineTab) {
        offlineTab.addEventListener('click', updateOfflineStatus);
    }

    // Initial status update
    updateOfflineStatus();
}

/**
 * Update offline settings status display
 */
async function updateOfflineStatus() {
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
            console.error('Error updating SW status:', error);
            if (swStatus) {
                swStatus.textContent = 'Error';
                swStatus.className = 'status-value error';
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
        showCacheResult(`Cache refresh failed: ${error.message}`, 'error');
    }

    // Update status
    setTimeout(updateOfflineStatus, 1000);
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
        showCacheResult(`Clear cache failed: ${error.message}`, 'error');
    }

    // Update status
    setTimeout(updateOfflineStatus, 1000);
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
        showCacheResult(`Check failed: ${error.message}`, 'error');
    }

    updateOfflineStatus();
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