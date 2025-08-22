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
    // Start with authentication
    authManager = new AuthManager();
});

/**
 * Handle service worker registration for offline capabilities
 * (Future enhancement)
 */
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Service worker registration would go here
        console.log('Job Tracker loaded successfully');
    });
}

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
