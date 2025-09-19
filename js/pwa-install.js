/**
 * PWA Installation Constants
 * Common constants used across PWA installation components
 */
const PWA_CONSTANTS = {
    // Installation statuses
    STATUS: {
        NOT_PROMPTED: 'not_prompted',
        PROMPTED: 'prompted',
        DISMISSED: 'dismissed',
        DONT_ASK: 'dont_ask',
        INSTALLED: 'installed',
        INSTALLING: 'installing'
    },

    // Log prefixes
    LOG_PREFIX: {
        INSTALL_STORAGE: '[InstallStorage]',
        PWA_INSTALL: '[PWAInstall]'
    },

    // Common error messages
    ERROR_MESSAGES: {
        STORAGE_INIT: 'Error initializing preferences:',
        STORAGE_GET: 'Error getting',
        STORAGE_SET: 'Error setting',
        STORAGE_INCREMENT: 'Error incrementing',
        STORAGE_VALIDATION: 'Storage validation failed:',
        INIT_FAILED: 'Error initializing',
        CRITICAL_ERROR: 'Critical error in',
        CLEANUP_ERROR: 'Error during cleanup:',
        TRACKING_FAILED: 'Failed to track error:'
    },

    // Common success messages
    SUCCESS_MESSAGES: {
        INIT_SUCCESS: 'initialized successfully',
        CLEANUP_SUCCESS: 'cleaned up',
        RESET_SUCCESS: 'Installation data reset'
    },

    // Common fallback values
    FALLBACK_VALUES: {
        ZERO: 0,
        NULL: null,
        EMPTY_STRING: '',
        NOT_PROMPTED: 'not_prompted'
    },

    // Validation constraints
    VALIDATION: {
        MAX_STRING_LENGTH: 1000,
        MAX_OBJECT_DEPTH: 5,
        MAX_ARRAY_LENGTH: 100,
        ALLOWED_PREFERENCE_KEYS: ['dontAskAgain', 'manualTriggerAvailable', 'theme', 'language'],
        SAFE_HTML_TAGS: ['b', 'i', 'em', 'strong', 'span'],
        MAX_SESSION_COUNT: 999999,
        MAX_DISMISSAL_COUNT: 100
    },

    // Common log prefixes
    LOG_PREFIX: {
        INSTALL_STORAGE: '[InstallStorage]',
        PWA_INSTALL: '[PWAInstall]',
        INSTALL_UI: '[InstallPromptUI]',
        INSTALL_ANALYTICS: '[InstallAnalytics]'
    }
};

/**
 * Common utility functions for PWA installation
 */
const PWA_UTILS = {
    /**
     * Standardized error logging with consistent format
     * @param {string} component - Component name (use PWA_CONSTANTS.LOG_PREFIX)
     * @param {string} operation - Operation that failed
     * @param {Error} error - Error object
     * @param {*} fallbackValue - Value to return on error
     * @returns {*} Fallback value
     */
    handleError(component, operation, error, fallbackValue = null) {
        console.error(`${component} Error in ${operation}:`, error);
        return fallbackValue;
    },

    /**
     * Validate and sanitize string input
     * @param {*} input - Input to validate
     * @param {number} maxLength - Maximum allowed length
     * @returns {string} Sanitized string
     */
    validateString(input, maxLength = PWA_CONSTANTS.VALIDATION.MAX_STRING_LENGTH) {
        if (typeof input !== 'string') {
            throw new Error('Input must be a string');
        }
        
        if (input.length > maxLength) {
            throw new Error(`String exceeds maximum length of ${maxLength}`);
        }
        
        // Remove potentially dangerous characters
        return input.replace(/[<>\"'&]/g, '').trim();
    },

    /**
     * Validate installation status
     * @param {*} status - Status to validate
     * @returns {string} Valid status
     */
    validateStatus(status) {
        const validStatuses = Object.values(PWA_CONSTANTS.STATUS);
        if (!validStatuses.includes(status)) {
            throw new Error(`Invalid installation status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
        }
        return status;
    },

    /**
     * Validate and sanitize number input
     * @param {*} input - Input to validate
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} Valid number
     */
    validateNumber(input, min = 0, max = Number.MAX_SAFE_INTEGER) {
        const num = parseInt(input);
        if (isNaN(num)) {
            throw new Error('Input must be a valid number');
        }
        if (num < min || num > max) {
            throw new Error(`Number must be between ${min} and ${max}`);
        }
        return num;
    },

    /**
     * Validate and sanitize object input
     * @param {*} input - Input to validate
     * @param {Array} allowedKeys - Allowed object keys
     * @returns {Object} Sanitized object
     */
    validateObject(input, allowedKeys = null) {
        if (typeof input !== 'object' || input === null || Array.isArray(input)) {
            throw new Error('Input must be a plain object');
        }

        // Check object depth to prevent deeply nested objects
        if (this.getObjectDepth(input) > PWA_CONSTANTS.VALIDATION.MAX_OBJECT_DEPTH) {
            throw new Error(`Object depth exceeds maximum of ${PWA_CONSTANTS.VALIDATION.MAX_OBJECT_DEPTH}`);
        }

        const sanitized = {};
        for (const [key, value] of Object.entries(input)) {
            // Validate key
            const sanitizedKey = this.validateString(key, 50);
            
            // Check if key is allowed
            if (allowedKeys && !allowedKeys.includes(sanitizedKey)) {
                console.warn(`Ignoring disallowed key: ${sanitizedKey}`);
                continue;
            }

            // Sanitize value based on type
            if (typeof value === 'string') {
                sanitized[sanitizedKey] = this.validateString(value);
            } else if (typeof value === 'number') {
                sanitized[sanitizedKey] = this.validateNumber(value);
            } else if (typeof value === 'boolean') {
                sanitized[sanitizedKey] = Boolean(value);
            } else if (value === null || value === undefined) {
                sanitized[sanitizedKey] = value;
            } else {
                console.warn(`Ignoring unsupported value type for key ${sanitizedKey}:`, typeof value);
            }
        }

        return sanitized;
    },

    /**
     * Get object depth for validation
     * @param {Object} obj - Object to check
     * @param {number} depth - Current depth
     * @returns {number} Maximum depth
     */
    getObjectDepth(obj, depth = 0) {
        if (typeof obj !== 'object' || obj === null) {
            return depth;
        }

        let maxDepth = depth;
        for (const value of Object.values(obj)) {
            if (typeof value === 'object' && value !== null) {
                maxDepth = Math.max(maxDepth, this.getObjectDepth(value, depth + 1));
            }
        }
        return maxDepth;
    },

    /**
     * Validate and parse JSON safely
     * @param {string} jsonString - JSON string to parse
     * @returns {*} Parsed object
     */
    validateJSON(jsonString) {
        if (typeof jsonString !== 'string') {
            throw new Error('JSON input must be a string');
        }

        if (jsonString.length > PWA_CONSTANTS.VALIDATION.MAX_STRING_LENGTH) {
            throw new Error('JSON string too large');
        }

        try {
            const parsed = JSON.parse(jsonString);
            
            // Additional validation for objects
            if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
                return this.validateObject(parsed);
            }
            
            return parsed;
        } catch (error) {
            throw new Error(`Invalid JSON: ${error.message}`);
        }
    },

    /**
     * Sanitize text content for DOM insertion
     * @param {*} input - Input to sanitize
     * @returns {string} Safe text content
     */
    sanitizeTextContent(input) {
        if (typeof input !== 'string') {
            input = String(input);
        }
        
        // Remove HTML tags and potentially dangerous characters
        return input
            .replace(/<[^>]*>/g, '') // Remove HTML tags
            .replace(/javascript:/gi, '') // Remove javascript: URLs
            .replace(/on\w+\s*=/gi, '') // Remove event handlers
            .trim();
    },

    /**
     * Safe localStorage operation with error handling
     * @param {string} operation - 'get' or 'set'
     * @param {string} key - Storage key
     * @param {*} value - Value to set (for set operations)
     * @param {*} fallback - Fallback value for get operations
     * @returns {*} Retrieved value or success boolean
     */
    safeStorage(operation, key, value = null, fallback = null) {
        try {
            if (operation === 'get') {
                return localStorage.getItem(key) || fallback;
            } else if (operation === 'set') {
                localStorage.setItem(key, value);
                return true;
            }
        } catch (error) {
            console.error(`${PWA_CONSTANTS.LOG_PREFIX.INSTALL_STORAGE} Storage ${operation} failed for key ${key}:`, error);
            return operation === 'get' ? fallback : false;
        }
    }
};

/**
 * Installation Storage Manager
 * Handles localStorage operations for PWA installation preferences and tracking
 */
class InstallationStorage {
    constructor() {
        this.storageKeys = {
            installationStatus: 'jobTracker_installStatus',
            promptCount: 'jobTracker_promptCount',
            lastPromptDate: 'jobTracker_lastPromptDate',
            dismissalCount: 'jobTracker_dismissalCount',
            firstVisitDate: 'jobTracker_firstVisit',
            sessionCount: 'jobTracker_sessionCount',
            lastActivity: 'jobTracker_lastActivity',
            installDate: 'jobTracker_installDate',
            userPreferences: 'jobTracker_installPreferences'
        };

        // Initialize default preferences if not exists
        this.initializePreferences();
    }

    /**
     * Helper method for consistent error logging
     * @param {string} operation - The operation that failed
     * @param {Error} error - The error object
     * @param {*} fallbackValue - Value to return on error
     * @returns {*} The fallback value
     */
    logError(operation, error, fallbackValue = null) {
        console.error(`${PWA_CONSTANTS.LOG_PREFIX.INSTALL_STORAGE} ${PWA_CONSTANTS.ERROR_MESSAGES.STORAGE_GET} ${operation}:`, error);
        return fallbackValue;
    }

    /**
     * Helper method for consistent set operation error logging
     * @param {string} operation - The operation that failed
     * @param {Error} error - The error object
     */
    logSetError(operation, error) {
        console.error(`${PWA_CONSTANTS.LOG_PREFIX.INSTALL_STORAGE} ${PWA_CONSTANTS.ERROR_MESSAGES.STORAGE_SET} ${operation}:`, error);
    }

    /**
     * Initialize default installation preferences
     */
    initializePreferences() {
        try {
            const existingPrefs = this.getUserPreferences();
            if (!existingPrefs) {
                const defaultPrefs = {
                    dontAskAgain: false,
                    manualTriggerAvailable: true
                };
                this.setUserPreferences(defaultPrefs);
            }
        } catch (error) {
            this.logSetError('preferences initialization', error);
        }
    }

    /**
     * Get installation status
     * @returns {string} Current installation status
     */
    getInstallationStatus() {
        try {
            return localStorage.getItem(this.storageKeys.installationStatus) || PWA_CONSTANTS.STATUS.NOT_PROMPTED;
        } catch (error) {
            return this.logError('installation status', error, PWA_CONSTANTS.STATUS.NOT_PROMPTED);
        }
    }

    /**
     * Set installation status
     * @param {string} status - Installation status ('not_prompted', 'prompted', 'dismissed', 'dont_ask', 'installed')
     */
    setInstallationStatus(status) {
        try {
            // Validate and sanitize the status input
            const validatedStatus = PWA_UTILS.validateStatus(status);
            PWA_UTILS.safeStorage('set', this.storageKeys.installationStatus, validatedStatus);
        } catch (error) {
            PWA_UTILS.handleError(PWA_CONSTANTS.LOG_PREFIX.INSTALL_STORAGE, 'setInstallationStatus', error);
        }
    }

    /**
     * Get prompt count
     * @returns {number} Number of times prompt has been shown
     */
    getPromptCount() {
        try {
            return parseInt(localStorage.getItem(this.storageKeys.promptCount) || '0');
        } catch (error) {
            return this.logError('prompt count', error, 0);
        }
    }

    /**
     * Increment prompt count
     * @returns {number} New prompt count
     */
    incrementPromptCount() {
        try {
            const currentCount = this.getPromptCount();
            const newCount = currentCount + 1;
            localStorage.setItem(this.storageKeys.promptCount, newCount.toString());
            return newCount;
        } catch (error) {
            console.error('[InstallStorage] Error incrementing prompt count:', error);
            return 0;
        }
    }

    /**
     * Get last prompt date
     * @returns {string|null} ISO date string of last prompt or null
     */
    getLastPromptDate() {
        try {
            return localStorage.getItem(this.storageKeys.lastPromptDate);
        } catch (error) {
            console.error('[InstallStorage] Error getting last prompt date:', error);
            return null;
        }
    }

    /**
     * Set last prompt date to now
     */
    setLastPromptDate() {
        try {
            localStorage.setItem(this.storageKeys.lastPromptDate, new Date().toISOString());
        } catch (error) {
            console.error('[InstallStorage] Error setting last prompt date:', error);
        }
    }

    /**
     * Get dismissal count
     * @returns {number} Number of times prompt has been dismissed
     */
    getDismissalCount() {
        try {
            return parseInt(localStorage.getItem(this.storageKeys.dismissalCount) || '0');
        } catch (error) {
            console.error('[InstallStorage] Error getting dismissal count:', error);
            return 0;
        }
    }

    /**
     * Increment dismissal count
     * @returns {number} New dismissal count
     */
    incrementDismissalCount() {
        try {
            const currentCount = this.getDismissalCount();
            const newCount = currentCount + 1;
            localStorage.setItem(this.storageKeys.dismissalCount, newCount.toString());
            return newCount;
        } catch (error) {
            console.error('[InstallStorage] Error incrementing dismissal count:', error);
            return 0;
        }
    }

    /**
     * Get first visit date
     * @returns {string|null} ISO date string of first visit or null
     */
    getFirstVisitDate() {
        try {
            return localStorage.getItem(this.storageKeys.firstVisitDate);
        } catch (error) {
            console.error('[InstallStorage] Error getting first visit date:', error);
            return null;
        }
    }

    /**
     * Set first visit date if not already set
     * @returns {string} ISO date string of first visit
     */
    setFirstVisitDate() {
        try {
            const existing = this.getFirstVisitDate();
            if (!existing) {
                const now = new Date().toISOString();
                localStorage.setItem(this.storageKeys.firstVisitDate, now);
                return now;
            }
            return existing;
        } catch (error) {
            console.error('[InstallStorage] Error setting first visit date:', error);
            return new Date().toISOString();
        }
    }

    /**
     * Get session count
     * @returns {number} Number of user sessions
     */
    getSessionCount() {
        try {
            return parseInt(localStorage.getItem(this.storageKeys.sessionCount) || '0');
        } catch (error) {
            console.error('[InstallStorage] Error getting session count:', error);
            return 0;
        }
    }

    /**
     * Set session count
     * @param {number} count - New session count
     */
    setSessionCount(count) {
        try {
            // Validate session count with proper bounds
            const validatedCount = PWA_UTILS.validateNumber(count, 0, PWA_CONSTANTS.VALIDATION.MAX_SESSION_COUNT);
            localStorage.setItem(this.storageKeys.sessionCount, validatedCount.toString());
        } catch (error) {
            this.logSetError('session count', error);
        }
    }

    /**
     * Increment session count
     * @returns {number} New session count
     */
    incrementSessionCount() {
        try {
            const currentCount = this.getSessionCount();
            const newCount = currentCount + 1;
            this.setSessionCount(newCount);
            return newCount;
        } catch (error) {
            console.error('[InstallStorage] Error incrementing session count:', error);
            return 0;
        }
    }

    /**
     * Get last activity timestamp
     * @returns {number|null} Timestamp of last activity or null
     */
    getLastActivity() {
        try {
            const timestamp = localStorage.getItem(this.storageKeys.lastActivity);
            return timestamp ? parseInt(timestamp) : null;
        } catch (error) {
            console.error('[InstallStorage] Error getting last activity:', error);
            return null;
        }
    }

    /**
     * Set last activity to now
     */
    setLastActivity() {
        try {
            localStorage.setItem(this.storageKeys.lastActivity, Date.now().toString());
        } catch (error) {
            console.error('[InstallStorage] Error setting last activity:', error);
        }
    }

    /**
     * Check if this is a new session (more than 30 minutes since last activity)
     * @returns {boolean} True if this is a new session
     */
    isNewSession() {
        try {
            const lastActivity = this.getLastActivity();
            if (!lastActivity) {
                return true; // First session
            }

            const now = Date.now();
            const thirtyMinutes = 30 * 60 * 1000;
            return (now - lastActivity) > thirtyMinutes;
        } catch (error) {
            console.error('[InstallStorage] Error checking new session:', error);
            return true;
        }
    }

    /**
     * Track a new session if applicable
     * @returns {number} Current session count
     */
    trackSession() {
        try {
            // Set first visit date if not set
            this.setFirstVisitDate();

            // Check if this is a new session
            if (this.isNewSession()) {
                this.incrementSessionCount();
            }

            // Update last activity
            this.setLastActivity();

            return this.getSessionCount();
        } catch (error) {
            console.error('[InstallStorage] Error tracking session:', error);
            return 0;
        }
    }

    /**
     * Get job application count from DataManager
     * @returns {number} Number of job applications
     */
    getJobApplicationCount() {
        try {
            if (window.DataManager && typeof window.DataManager.loadJobs === 'function') {
                const jobs = window.DataManager.loadJobs();
                return jobs.length;
            }

            // Fallback: try to get jobs directly from localStorage
            const jobsData = localStorage.getItem('jobTracker_jobs');
            if (jobsData) {
                const jobs = JSON.parse(jobsData);
                return Array.isArray(jobs) ? jobs.length : 0;
            }

            return 0;
        } catch (error) {
            console.error('[InstallStorage] Error getting job application count:', error);
            return 0;
        }
    }

    /**
     * Get install date
     * @returns {string|null} ISO date string of installation or null
     */
    getInstallDate() {
        try {
            return localStorage.getItem(this.storageKeys.installDate);
        } catch (error) {
            console.error('[InstallStorage] Error getting install date:', error);
            return null;
        }
    }

    /**
     * Set install date to now
     */
    setInstallDate() {
        try {
            localStorage.setItem(this.storageKeys.installDate, new Date().toISOString());
        } catch (error) {
            console.error('[InstallStorage] Error setting install date:', error);
        }
    }

    /**
     * Get user preferences
     * @returns {Object|null} User preferences object or null
     */
    getUserPreferences() {
        try {
            const prefsData = localStorage.getItem(this.storageKeys.userPreferences);
            if (!prefsData) {
                return null;
            }
            
            // Validate and parse JSON safely
            const parsed = PWA_UTILS.validateJSON(prefsData);
            
            // Additional validation for preferences object
            if (typeof parsed === 'object' && parsed !== null) {
                return PWA_UTILS.validateObject(parsed, PWA_CONSTANTS.VALIDATION.ALLOWED_PREFERENCE_KEYS);
            }
            
            return parsed;
        } catch (error) {
            return this.logError('user preferences', error, null);
        }
    }

    /**
     * Set user preferences
     * @param {Object} preferences - User preferences object
     */
    setUserPreferences(preferences) {
        try {
            // Validate and sanitize preferences object
            const validatedPreferences = PWA_UTILS.validateObject(
                preferences, 
                PWA_CONSTANTS.VALIDATION.ALLOWED_PREFERENCE_KEYS
            );
            
            // Safely serialize and store
            const serialized = JSON.stringify(validatedPreferences);
            if (serialized.length > PWA_CONSTANTS.VALIDATION.MAX_STRING_LENGTH) {
                throw new Error('Preferences object too large');
            }
            
            localStorage.setItem(this.storageKeys.userPreferences, serialized);
        } catch (error) {
            this.logSetError('user preferences', error);
        }
    }

    /**
     * Update specific user preference
     * @param {string} key - Preference key
     * @param {*} value - Preference value
     */
    updateUserPreference(key, value) {
        try {
            // Validate preference key
            const validatedKey = PWA_UTILS.validateString(key, 50);
            if (!PWA_CONSTANTS.VALIDATION.ALLOWED_PREFERENCE_KEYS.includes(validatedKey)) {
                throw new Error(`Invalid preference key: ${validatedKey}`);
            }
            
            // Validate preference value based on type
            let validatedValue;
            if (typeof value === 'string') {
                validatedValue = PWA_UTILS.validateString(value);
            } else if (typeof value === 'number') {
                validatedValue = PWA_UTILS.validateNumber(value);
            } else if (typeof value === 'boolean') {
                validatedValue = Boolean(value);
            } else if (value === null || value === undefined) {
                validatedValue = value;
            } else {
                throw new Error(`Unsupported preference value type: ${typeof value}`);
            }
            
            const currentPrefs = this.getUserPreferences() || {};
            currentPrefs[validatedKey] = validatedValue;
            this.setUserPreferences(currentPrefs);
        } catch (error) {
            this.logSetError('user preference', error);
        }
    }

    /**
     * Get days since last prompt
     * @returns {number} Number of days since last prompt (0 if never prompted)
     */
    getDaysSinceLastPrompt() {
        try {
            const lastPromptDate = this.getLastPromptDate();
            if (!lastPromptDate) {
                return 0;
            }

            const now = Date.now();
            const lastPrompt = new Date(lastPromptDate).getTime();
            return Math.floor((now - lastPrompt) / (1000 * 60 * 60 * 24));
        } catch (error) {
            console.error('[InstallStorage] Error calculating days since last prompt:', error);
            return 0;
        }
    }

    /**
     * Check if prompt should be delayed due to recent dismissal
     * @param {number} delayDays - Number of days to delay (default: 7)
     * @returns {boolean} True if prompt should be delayed
     */
    shouldDelayPrompt(delayDays = 7) {
        try {
            const daysSinceLastPrompt = this.getDaysSinceLastPrompt();
            return daysSinceLastPrompt > 0 && daysSinceLastPrompt < delayDays;
        } catch (error) {
            console.error('[InstallStorage] Error checking prompt delay:', error);
            return false;
        }
    }

    /**
     * Get complete installation data summary
     * @returns {Object} Complete installation data
     */
    getInstallationData() {
        try {
            const preferences = this.getUserPreferences() || {};

            return {
                installationStatus: this.getInstallationStatus(),
                promptCount: this.getPromptCount(),
                lastPromptDate: this.getLastPromptDate(),
                dismissalCount: this.getDismissalCount(),
                firstVisitDate: this.getFirstVisitDate(),
                sessionCount: this.getSessionCount(),
                jobApplicationCount: this.getJobApplicationCount(),
                installDate: this.getInstallDate(),
                userPreferences: preferences,
                daysSinceLastPrompt: this.getDaysSinceLastPrompt(),
                shouldDelayPrompt: this.shouldDelayPrompt()
            };
        } catch (error) {
            console.error('[InstallStorage] Error getting installation data:', error);
            return {
                installationStatus: 'not_prompted',
                promptCount: 0,
                lastPromptDate: null,
                dismissalCount: 0,
                firstVisitDate: null,
                sessionCount: 0,
                jobApplicationCount: 0,
                installDate: null,
                userPreferences: { dontAskAgain: false, manualTriggerAvailable: true },
                daysSinceLastPrompt: 0,
                shouldDelayPrompt: false
            };
        }
    }

    /**
     * Reset all installation preferences and data
     * @param {boolean} keepFirstVisit - Whether to keep the first visit date (default: true)
     */
    resetInstallationData(keepFirstVisit = true) {
        try {
            const firstVisit = keepFirstVisit ? this.getFirstVisitDate() : null;

            // Remove all installation-related data
            Object.values(this.storageKeys).forEach(key => {
                localStorage.removeItem(key);
            });

            // Restore first visit date if requested
            if (firstVisit && keepFirstVisit) {
                localStorage.setItem(this.storageKeys.firstVisitDate, firstVisit);
            }

            // Reinitialize default preferences
            this.initializePreferences();

            console.log('[InstallStorage] Installation data reset');
        } catch (error) {
            console.error('[InstallStorage] Error resetting installation data:', error);
        }
    }

    /**
     * Export installation data for analytics
     * @returns {Object} Exportable installation data
     */
    exportInstallationData() {
        try {
            const data = this.getInstallationData();

            return {
                ...data,
                exportDate: new Date().toISOString(),
                dataVersion: '1.0'
            };
        } catch (error) {
            console.error('[InstallStorage] Error exporting installation data:', error);
            return null;
        }
    }

    /**
     * Validate storage integrity
     * @returns {boolean} True if storage is valid
     */
    validateStorage() {
        try {
            // Check if localStorage is available
            if (typeof Storage === 'undefined') {
                return false;
            }

            // Test localStorage functionality
            const testKey = 'jobTracker_storageTest';
            localStorage.setItem(testKey, 'test');
            const testValue = localStorage.getItem(testKey);
            localStorage.removeItem(testKey);

            if (testValue !== 'test') {
                return false;
            }

            // Validate existing data types
            const sessionCount = this.getSessionCount();
            const promptCount = this.getPromptCount();
            const dismissalCount = this.getDismissalCount();

            if (isNaN(sessionCount) || isNaN(promptCount) || isNaN(dismissalCount)) {
                console.warn('[InstallStorage] Invalid numeric data detected, resetting...');
                this.resetInstallationData();
            }

            return true;
        } catch (error) {
            console.error('[InstallStorage] Storage validation failed:', error);
            return false;
        }
    }
}

/**
 * PWA Installation Manager
 * Handles Progressive Web App installation prompts and logic
 */
class PWAInstallManager {
    constructor(options = {}) {
        this.deferredPrompt = null;
        this.isInstalled = false;
        this.installPromptUI = null;
        this.eligibilityThresholds = {
            minSessions: options.minSessions || 3,
            minJobApplications: options.minJobApplications || 2
        };

        // Error handling state
        this.errorCount = 0;
        this.maxErrors = 5;
        this.isDisabled = false;
        this.fallbackMode = false;

        try {
            // Initialize storage manager with error recovery
            this.storage = this.initializeStorageWithFallback();

            // Initialize analytics manager with error recovery
            this.analytics = this.initializeAnalyticsWithFallback();

            // Initialize cross-platform detector with error recovery
            this.detector = this.initializeDetectorWithFallback();

            // Validate browser compatibility
            this.validateBrowserCompatibility();

            console.log('[PWAInstall] PWAInstallManager initialized successfully');
        } catch (error) {
            this.handleCriticalError('constructor', error);
        }
    }

    /**
     * Helper method for consistent PWA manager error logging
     * @param {string} operation - The operation that failed
     * @param {Error} error - The error object
     * @param {*} fallbackValue - Value to return on error
     * @returns {*} The fallback value
     */
    logPWAError(operation, error, fallbackValue = null) {
        console.error(`${PWA_CONSTANTS.LOG_PREFIX.PWA_INSTALL} ${PWA_CONSTANTS.ERROR_MESSAGES.INIT_FAILED} ${operation}:`, error);
        return fallbackValue;
    }

    /**
     * Initialize storage with fallback mechanisms
     * @returns {InstallationStorage|Object} Storage instance or fallback
     */
    initializeStorageWithFallback() {
        try {
            const storage = new InstallationStorage();

            // Validate storage functionality
            if (!storage.validateStorage()) {
                console.warn('[PWAInstall] Storage validation failed, using fallback mode');
                return this.createFallbackStorage();
            }

            return storage;
        } catch (error) {
            this.logPWAError('storage', error);
            this.trackError('storage_init_failed', error);
            return this.createFallbackStorage();
        }
    }

    /**
     * Initialize analytics with fallback mechanisms
     * @returns {InstallAnalytics|Object} Analytics instance or fallback
     */
    initializeAnalyticsWithFallback() {
        try {
            return new InstallAnalytics();
        } catch (error) {
            this.logPWAError('analytics', error);
            this.trackError('analytics_init_failed', error);
            return this.createFallbackAnalytics();
        }
    }

    /**
     * Initialize detector with fallback mechanisms
     * @returns {CrossPlatformDetector|Object} Detector instance or fallback
     */
    initializeDetectorWithFallback() {
        try {
            return new CrossPlatformDetector();
        } catch (error) {
            this.logPWAError('detector', error);
            this.trackError('detector_init_failed', error);
            return this.createFallbackDetector();
        }
    }

    /**
     * Create fallback storage that works in memory
     * @returns {Object} Fallback storage implementation
     */
    createFallbackStorage() {
        const fallbackData = {
            installationStatus: 'not_prompted',
            promptCount: 0,
            sessionCount: 1,
            userPreferences: { dontAskAgain: false, manualTriggerAvailable: true }
        };

        return {
            getInstallationStatus: () => fallbackData.installationStatus,
            setInstallationStatus: (status) => { fallbackData.installationStatus = status; },
            getPromptCount: () => fallbackData.promptCount,
            incrementPromptCount: () => ++fallbackData.promptCount,
            getSessionCount: () => fallbackData.sessionCount,
            trackSession: () => fallbackData.sessionCount,
            getJobApplicationCount: () => 0,
            getDismissalCount: () => 0,
            incrementDismissalCount: () => 0,
            getUserPreferences: () => fallbackData.userPreferences,
            updateUserPreference: (key, value) => { fallbackData.userPreferences[key] = value; },
            shouldDelayPrompt: () => false,
            getInstallationData: () => fallbackData,
            validateStorage: () => false
        };
    }

    /**
     * Create fallback analytics that logs to console
     * @returns {Object} Fallback analytics implementation
     */
    createFallbackAnalytics() {
        return {
            trackPromptShown: (context) => console.log('[PWAInstall] Analytics fallback: prompt shown', context),
            trackInstallClick: (context) => console.log('[PWAInstall] Analytics fallback: install clicked', context),
            trackDismiss: (context) => console.log('[PWAInstall] Analytics fallback: dismissed', context),
            trackDontAskAgain: (context) => console.log('[PWAInstall] Analytics fallback: dont ask again', context),
            trackInstallSuccess: (context) => console.log('[PWAInstall] Analytics fallback: install success', context),
            trackInstructionsShown: (type, context) => console.log('[PWAInstall] Analytics fallback: instructions shown', type, context),
            trackError: (error, context) => console.log('[PWAInstall] Analytics fallback: error tracked', error, context),
            getInstallMetrics: () => ({ summary: {}, events: [], funnel: {}, platformBreakdown: {}, timelineData: [], recentActivity: [] })
        };
    }

    /**
     * Create fallback detector with basic browser detection
     * @returns {Object} Fallback detector implementation
     */
    createFallbackDetector() {
        const userAgent = navigator.userAgent.toLowerCase();
        const isChrome = userAgent.includes('chrome') && !userAgent.includes('edg');
        const isEdge = userAgent.includes('edg');
        const isSafari = userAgent.includes('safari') && !userAgent.includes('chrome');
        const isFirefox = userAgent.includes('firefox');

        return {
            platform: { name: 'unknown', isMobile: /mobile|android|iphone|ipad/.test(userAgent) },
            browser: {
                name: isChrome ? 'chrome' : isEdge ? 'edge' : isSafari ? 'safari' : isFirefox ? 'firefox' : 'unknown',
                version: '0'
            },
            supportsInstallPrompt: () => isChrome || isEdge,
            supportsStandaloneMode: () => true,
            isStandalone: () => window.matchMedia && window.matchMedia('(display-mode: standalone)').matches,
            getInstallationInstructions: () => ({
                platform: 'generic',
                supported: false,
                message: 'Installation support detection failed, but you may still be able to install this app through your browser menu.'
            })
        };
    }

    /**
     * Validate browser compatibility and set appropriate modes
     */
    validateBrowserCompatibility() {
        try {
            // Check for critical browser features
            const hasLocalStorage = typeof Storage !== 'undefined';
            const hasServiceWorker = 'serviceWorker' in navigator;
            const hasPromiseSupport = typeof Promise !== 'undefined';
            const hasES6Support = typeof Symbol !== 'undefined';

            if (!hasLocalStorage) {
                console.warn('[PWAInstall] localStorage not supported, using fallback mode');
                this.fallbackMode = true;
            }

            if (!hasServiceWorker) {
                console.warn('[PWAInstall] Service Worker not supported, PWA features limited');
            }

            if (!hasPromiseSupport || !hasES6Support) {
                console.warn('[PWAInstall] Modern JavaScript features not supported, some functionality may be limited');
                this.fallbackMode = true;
            }

            // Check if PWA installation is supported at all
            const pwaSupport = this.detector.getPWASupport ? this.detector.getPWASupport() : { isPartiallySupported: false };
            if (!pwaSupport.isPartiallySupported) {
                console.info('[PWAInstall] PWA installation not supported in this browser');
                this.isDisabled = true;
            }

        } catch (error) {
            console.error('[PWAInstall] Error validating browser compatibility:', error);
            this.fallbackMode = true;
        }
    }

    /**
     * Initialize the PWA installation manager
     */
    init() {
        try {
            // Check if manager is disabled due to critical errors
            if (this.isDisabled) {
                console.info('[PWAInstall] PWA installation manager is disabled due to browser incompatibility');
                return;
            }

            // Check if already installed
            this.isInstalled = this.checkIfInstalled();

            if (this.isInstalled) {
                console.log('[PWAInstall] App is already installed');
                this.updateInstallationStatus('installed');
                return;
            }

            // Track session with error handling
            this.trackSessionSafely();

            // Set up event listeners with error handling
            this.setupEventListenersSafely();

            // Check eligibility and show prompt if appropriate
            this.checkEligibilityAndPromptSafely();

            console.log('[PWAInstall] PWAInstallManager initialized successfully');
        } catch (error) {
            this.handleCriticalError('init', error);
        }
    }

    /**
     * Handle critical errors that may disable the manager
     * @param {string} operation - The operation that failed
     * @param {Error} error - The error that occurred
     */
    handleCriticalError(operation, error) {
        this.errorCount++;

        console.error(`[PWAInstall] Critical error in ${operation}:`, error);

        // Track error if analytics is available
        if (this.analytics && typeof this.analytics.trackError === 'function') {
            try {
                this.analytics.trackError(error, { operation, errorCount: this.errorCount });
            } catch (analyticsError) {
                console.error('[PWAInstall] Failed to track error:', analyticsError);
            }
        }

        // Disable manager if too many errors occur
        if (this.errorCount >= this.maxErrors) {
            console.error('[PWAInstall] Too many errors occurred, disabling PWA installation manager');
            this.isDisabled = true;
            this.cleanup();
        }
    }

    /**
     * Track errors for analytics and debugging
     * @param {string} type - Error type
     * @param {Error} error - The error object
     * @param {Object} context - Additional context
     */
    trackError(type, error, context = {}) {
        try {
            if (this.analytics && typeof this.analytics.trackError === 'function') {
                this.analytics.trackError(error, { type, ...context });
            }

            // Also log to console for debugging
            console.error(`[PWAInstall] ${type}:`, error, context);
        } catch (trackingError) {
            console.error('[PWAInstall] Failed to track error:', trackingError);
        }
    }

    /**
     * Safely track session with error handling
     */
    trackSessionSafely() {
        try {
            this.trackSession();
        } catch (error) {
            this.trackError('session_tracking_failed', error);
            // Continue execution - session tracking failure shouldn't stop the manager
        }
    }

    /**
     * Safely set up event listeners with error handling
     */
    setupEventListenersSafely() {
        try {
            this.setupEventListeners();
        } catch (error) {
            this.trackError('event_listeners_setup_failed', error);
            // Try to set up individual listeners with fallbacks
            this.setupEventListenersWithFallback();
        }
    }

    /**
     * Set up event listeners with individual error handling
     */
    setupEventListenersWithFallback() {
        // beforeinstallprompt event listener with error handling
        try {
            window.addEventListener('beforeinstallprompt', (event) => {
                try {
                    this.onBeforeInstallPrompt(event);
                } catch (error) {
                    this.trackError('beforeinstallprompt_handler_failed', error);
                }
            });
        } catch (error) {
            this.trackError('beforeinstallprompt_listener_setup_failed', error);
        }

        // appinstalled event listener with error handling
        try {
            window.addEventListener('appinstalled', (event) => {
                try {
                    this.onAppInstalled(event);
                } catch (error) {
                    this.trackError('appinstalled_handler_failed', error);
                }
            });
        } catch (error) {
            this.trackError('appinstalled_listener_setup_failed', error);
        }

        // Standalone mode change listener with error handling
        try {
            if ('matchMedia' in window) {
                const standaloneQuery = window.matchMedia('(display-mode: standalone)');
                standaloneQuery.addEventListener('change', (event) => {
                    try {
                        if (event.matches) {
                            this.onAppInstalled();
                        }
                    } catch (error) {
                        this.trackError('standalone_change_handler_failed', error);
                    }
                });
            }
        } catch (error) {
            this.trackError('standalone_listener_setup_failed', error);
        }
    }

    /**
     * Safely check eligibility and show prompt with error handling
     */
    checkEligibilityAndPromptSafely() {
        try {
            this.checkEligibilityAndPrompt();
        } catch (error) {
            this.trackError('eligibility_check_failed', error);
            // Don't show prompt if eligibility check fails
        }
    }

    /**
     * Clean up resources and event listeners
     */
    cleanup() {
        try {
            // Hide any visible prompts
            if (this.installPromptUI && this.installPromptUI.isVisible) {
                this.installPromptUI.hide();
            }

            // Clear deferred prompt
            this.deferredPrompt = null;

            // Remove event listeners (if possible)
            // Note: We can't easily remove the listeners we added, but we can prevent them from doing anything
            this.isDisabled = true;

            console.log('[PWAInstall] PWA installation manager cleaned up');
        } catch (error) {
            console.error('[PWAInstall] Error during cleanup:', error);
        }
    }

    /**
     * Set up event listeners for PWA installation events
     */
    setupEventListeners() {
        // Listen for beforeinstallprompt event
        window.addEventListener('beforeinstallprompt', (event) => {
            console.log('[PWAInstall] beforeinstallprompt event fired');
            this.onBeforeInstallPrompt(event);
        });

        // Listen for appinstalled event
        window.addEventListener('appinstalled', (event) => {
            console.log('[PWAInstall] App was installed');
            this.onAppInstalled(event);
        });

        // Listen for standalone mode changes
        if ('matchMedia' in window) {
            const standaloneQuery = window.matchMedia('(display-mode: standalone)');
            standaloneQuery.addEventListener('change', (event) => {
                if (event.matches) {
                    console.log('[PWAInstall] App entered standalone mode');
                    this.onAppInstalled();
                }
            });
        }
    }

    /**
     * Handle beforeinstallprompt event
     * @param {Event} event - The beforeinstallprompt event
     */
    onBeforeInstallPrompt(event) {
        try {
            // Prevent the default browser prompt
            event.preventDefault();

            // Store the event for later use
            this.deferredPrompt = event;

            console.log('[PWAInstall] Install prompt deferred');

            // Check if we should show our custom prompt
            if (this.shouldShowPrompt()) {
                this.showInstallPrompt();
            }
        } catch (error) {
            console.error('[PWAInstall] Error handling beforeinstallprompt:', error);
        }
    }

    /**
     * Handle app installed event
     * @param {Event} event - The appinstalled event
     */
    onAppInstalled(event) {
        try {
            console.log('[PWAInstall] App installation completed');

            // Update installation status
            this.isInstalled = true;
            this.updateInstallationStatus('installed');

            // Clear the deferred prompt
            this.deferredPrompt = null;

            // Track installation success
            this.trackInstallationSuccess();

            // Show success notification using integrated notification system
            if (window.showPWANotification) {
                window.showPWANotification('App installed successfully! You can now access it from your home screen.', 'success');
            } else if (window.NotificationManager) {
                NotificationManager.success('App installed successfully! You can now access it from your home screen.');
            } else if (window.showNotification) {
                window.showNotification('App installed successfully! You can now access it from your home screen.', 'success');
            }
        } catch (error) {
            console.error('[PWAInstall] Error handling app installed:', error);
        }
    }

    /**
     * Check if the app is already installed
     * @returns {boolean} True if app is installed
     */
    checkIfInstalled() {
        try {
            // Check if running in standalone mode
            if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
                return true;
            }

            // Check if running as PWA on iOS
            if (window.navigator.standalone === true) {
                return true;
            }

            // Check stored installation status
            const storedStatus = this.storage.getInstallationStatus();
            return storedStatus === 'installed';
        } catch (error) {
            console.error('[PWAInstall] Error checking installation status:', error);
            return false;
        }
    }

    /**
     * Track user session for eligibility checking
     */
    trackSession() {
        try {
            const sessionCount = this.storage.trackSession();
            console.log('[PWAInstall] Session tracked. Total sessions:', sessionCount);
        } catch (error) {
            console.error('[PWAInstall] Error tracking session:', error);
        }
    }

    /**
     * Check eligibility for showing installation prompt
     * @returns {boolean} True if eligible for prompt
     */
    checkEligibility() {
        try {
            // Return false if manager is disabled
            if (this.isDisabled) {
                return false;
            }

            // Don't show if already installed
            if (this.isInstalled) {
                return false;
            }

            // Check installation status with fallback
            let installStatus;
            try {
                installStatus = this.storage.getInstallationStatus();
            } catch (error) {
                this.trackError('get_installation_status_failed', error);
                installStatus = 'not_prompted'; // Safe fallback
            }

            if (installStatus === 'dont_ask') {
                return false;
            }

            // Check user preferences with fallback
            let userPrefs;
            try {
                userPrefs = this.storage.getUserPreferences();
            } catch (error) {
                this.trackError('get_user_preferences_failed', error);
                userPrefs = { dontAskAgain: false }; // Safe fallback
            }

            if (userPrefs && userPrefs.dontAskAgain) {
                return false;
            }

            // Check dismissal count with fallback
            let dismissalCount;
            try {
                dismissalCount = this.storage.getDismissalCount();
            } catch (error) {
                this.trackError('get_dismissal_count_failed', error);
                dismissalCount = 0; // Safe fallback
            }

            if (dismissalCount >= 3) {
                try {
                    this.storage.setInstallationStatus('dont_ask');
                    this.storage.updateUserPreference('dontAskAgain', true);
                } catch (error) {
                    this.trackError('update_dont_ask_status_failed', error);
                }
                return false;
            }

            // Check if we should delay prompt due to recent dismissal
            let shouldDelay;
            try {
                shouldDelay = this.storage.shouldDelayPrompt(7);
            } catch (error) {
                this.trackError('check_delay_prompt_failed', error);
                shouldDelay = false; // Safe fallback - don't delay if we can't check
            }

            if (shouldDelay) {
                try {
                    const daysSinceLastPrompt = this.storage.getDaysSinceLastPrompt();
                    console.log('[PWAInstall] Too soon since last prompt. Days since last:', daysSinceLastPrompt);
                } catch (error) {
                    console.log('[PWAInstall] Too soon since last prompt (exact days unavailable)');
                }
                return false;
            }

            // Check session count with fallback
            let sessionCount;
            try {
                sessionCount = this.storage.getSessionCount();
            } catch (error) {
                this.trackError('get_session_count_failed', error);
                sessionCount = 1; // Safe fallback
            }

            if (sessionCount < this.eligibilityThresholds.minSessions) {
                console.log('[PWAInstall] Not enough sessions. Current:', sessionCount, 'Required:', this.eligibilityThresholds.minSessions);
                return false;
            }

            // Check job application count with fallback
            let jobCount;
            try {
                jobCount = this.storage.getJobApplicationCount();
            } catch (error) {
                this.trackError('get_job_count_failed', error);
                jobCount = 0; // Safe fallback
            }

            if (jobCount < this.eligibilityThresholds.minJobApplications) {
                console.log('[PWAInstall] Not enough job applications. Current:', jobCount, 'Required:', this.eligibilityThresholds.minJobApplications);
                return false;
            }

            console.log('[PWAInstall] Eligibility check passed. Sessions:', sessionCount, 'Jobs:', jobCount);
            return true;
        } catch (error) {
            this.trackError('eligibility_check_critical_error', error);
            return false;
        }
    }

    /**
     * Check if we should show the installation prompt
     * @returns {boolean} True if prompt should be shown
     */
    shouldShowPrompt() {
        try {
            // Check basic eligibility
            if (!this.checkEligibility()) {
                return false;
            }

            // Check if browser supports installation
            if (!this.deferredPrompt && !this.supportsManualInstall()) {
                console.log('[PWAInstall] Browser does not support PWA installation');
                return false;
            }

            return true;
        } catch (error) {
            console.error('[PWAInstall] Error checking if should show prompt:', error);
            return false;
        }
    }

    /**
     * Check if browser supports manual installation instructions
     * @returns {boolean} True if manual install is supported
     */
    supportsManualInstall() {
        try {
            // Initialize detector if not already done
            if (!this.detector) {
                this.detector = new CrossPlatformDetector();
            }

            // iOS Safari supports manual installation
            if (this.detector.platform.name === 'ios' && this.detector.browser.name === 'safari') {
                return true;
            }

            // Firefox supports PWA installation (with some limitations)
            if (this.detector.browser.name === 'firefox' && parseFloat(this.detector.browser.version) >= 85) {
                return true;
            }

            // Other browsers may have some form of manual installation
            return this.detector.supportsStandaloneMode();
        } catch (error) {
            console.error('[PWAInstall] Error checking manual install support:', error);
            return false;
        }
    }

    /**
     * Check eligibility and show prompt if appropriate
     */
    checkEligibilityAndPrompt() {
        try {
            if (this.shouldShowPrompt()) {
                // Delay showing prompt slightly to avoid interrupting user
                setTimeout(() => {
                    this.showInstallPrompt();
                }, 2000);
            }
        } catch (error) {
            console.error('[PWAInstall] Error in checkEligibilityAndPrompt:', error);
        }
    }

    /**
     * Show the installation prompt using custom UI
     */
    showInstallPrompt() {
        try {
            // Check if manager is disabled
            if (this.isDisabled) {
                console.log('[PWAInstall] Cannot show prompt - manager is disabled');
                return;
            }

            console.log('[PWAInstall] Showing installation prompt');

            // Track prompt shown with error handling
            this.trackPromptShownSafely();

            // Try to create and show custom UI prompt
            if (this.tryShowCustomPrompt()) {
                return; // Success
            }

            // Fallback to browser prompt if custom UI failed
            if (this.tryShowBrowserPrompt()) {
                return; // Success
            }

            // Final fallback - show simple notification
            this.showFallbackPrompt();

        } catch (error) {
            this.trackError('show_install_prompt_failed', error);
            this.showFallbackPrompt();
        }
    }

    /**
     * Try to show custom UI prompt
     * @returns {boolean} True if successful
     */
    tryShowCustomPrompt() {
        try {
            if (window.InstallPromptUI) {
                this.installPromptUI = new window.InstallPromptUI(this);
                this.installPromptUI.show();
                return true;
            }
            return false;
        } catch (error) {
            this.trackError('custom_prompt_ui_failed', error);
            return false;
        }
    }

    /**
     * Try to show browser's native prompt
     * @returns {boolean} True if successful
     */
    tryShowBrowserPrompt() {
        try {
            if (this.deferredPrompt) {
                return this.showBrowserPrompt();
            }
            return false;
        } catch (error) {
            this.trackError('browser_prompt_failed', error);
            return false;
        }
    }

    /**
     * Show fallback prompt using basic notification
     */
    showFallbackPrompt() {
        try {
            const message = 'Install this app for a better experience! Look for install options in your browser menu.';

            // Try different notification methods
            if (window.showPWANotification) {
                window.showPWANotification(message, 'info');
            } else if (window.NotificationManager && window.NotificationManager.info) {
                window.NotificationManager.info(message);
            } else if (window.showNotification) {
                window.showNotification(message, 'info');
            } else {
                // Last resort - browser alert
                console.log('[PWAInstall] Fallback prompt:', message);
                // Don't use alert() as it's intrusive - just log
            }
        } catch (error) {
            this.trackError('fallback_prompt_failed', error);
            console.log('[PWAInstall] All prompt methods failed, installation prompt could not be shown');
        }
    }

    /**
     * Safely track prompt shown event
     */
    trackPromptShownSafely() {
        try {
            this.trackPromptShown();
        } catch (error) {
            this.trackError('track_prompt_shown_failed', error);
            // Continue execution - tracking failure shouldn't stop the prompt
        }
    }

    /**
     * Show browser's native installation prompt (fallback)
     * @returns {boolean} True if successful
     */
    showBrowserPrompt() {
        try {
            if (!this.deferredPrompt) {
                console.log('[PWAInstall] No deferred prompt available for browser prompt');
                return false;
            }

            // Show the native browser prompt
            this.deferredPrompt.prompt();

            // Handle the user's choice with comprehensive error handling
            this.deferredPrompt.userChoice
                .then((choiceResult) => {
                    try {
                        if (choiceResult.outcome === 'accepted') {
                            console.log('[PWAInstall] User accepted the install prompt');
                            this.trackInstallAcceptedSafely();
                        } else {
                            console.log('[PWAInstall] User dismissed the install prompt');
                            this.trackPromptDismissedSafely();
                        }
                    } catch (error) {
                        this.trackError('user_choice_handling_failed', error);
                    } finally {
                        // Always clear the deferred prompt
                        this.deferredPrompt = null;
                    }
                })
                .catch((error) => {
                    this.trackError('user_choice_promise_failed', error);
                    this.deferredPrompt = null;
                });

            return true;
        } catch (error) {
            this.trackError('show_browser_prompt_failed', error);

            // Try to show manual installation instructions as fallback
            this.showManualInstallationInstructions();
            return false;
        }
    }

    /**
     * Show manual installation instructions when native prompt fails
     */
    showManualInstallationInstructions() {
        try {
            const message = 'Install this app for a better experience! Check your browser menu for "Install" or "Add to Home Screen".';

            // Try different notification methods with error handling
            if (this.tryShowNotification(message)) {
                return;
            }

            // Fallback to console log
            console.log('[PWAInstall] Manual installation instructions:', message);
        } catch (error) {
            this.trackError('manual_instructions_failed', error);
        }
    }

    /**
     * Try to show notification using available notification systems
     * @param {string} message - Message to show
     * @returns {boolean} True if successful
     */
    tryShowNotification(message) {
        try {
            if (window.showPWANotification) {
                window.showPWANotification(message, 'info');
                return true;
            }
        } catch (error) {
            this.trackError('pwa_notification_failed', error);
        }

        try {
            if (window.NotificationManager && window.NotificationManager.info) {
                window.NotificationManager.info(message);
                return true;
            }
        } catch (error) {
            this.trackError('notification_manager_failed', error);
        }

        try {
            if (window.showNotification) {
                window.showNotification(message, 'info');
                return true;
            }
        } catch (error) {
            this.trackError('show_notification_failed', error);
        }

        return false;
    }

    /**
     * Safely track install acceptance
     */
    trackInstallAcceptedSafely() {
        try {
            if (this.analytics && typeof this.analytics.trackInstallClick === 'function') {
                this.analytics.trackInstallClick({ source: 'browser_prompt' });
            }
        } catch (error) {
            this.trackError('track_install_accepted_failed', error);
        }
    }

    /**
     * Safely track prompt dismissal
     */
    trackPromptDismissedSafely() {
        try {
            if (this.analytics && typeof this.analytics.trackDismiss === 'function') {
                this.analytics.trackDismiss({ source: 'browser_prompt' });
            }

            // Update storage
            if (this.storage && typeof this.storage.incrementDismissalCount === 'function') {
                this.storage.incrementDismissalCount();
                this.storage.setLastPromptDate();
            }
        } catch (error) {
            this.trackError('track_prompt_dismissed_failed', error);
        }
    }

    /**
     * Handle "Install Now" button click
     */
    handleInstallClick() {
        try {
            console.log('[PWAInstall] Install button clicked');

            // Track install acceptance
            this.trackInstallAccepted();

            if (this.deferredPrompt) {
                // Use native browser installation flow
                this.deferredPrompt.prompt();

                this.deferredPrompt.userChoice
                    .then((choiceResult) => {
                        try {
                            if (choiceResult.outcome === 'accepted') {
                                console.log('[PWAInstall] User accepted native install prompt');
                                // Installation success will be tracked by onAppInstalled event
                                this.analytics.trackInstallClick({ source: 'native_prompt' });
                            } else {
                                console.log('[PWAInstall] User cancelled native install prompt');
                                // Reset status since user cancelled at native level
                                this.storage.setInstallationStatus('dismissed');
                                this.analytics.trackDismiss({ source: 'native_prompt' });
                            }
                        } catch (error) {
                            this.trackError('native_prompt_choice_handling_failed', error);
                        } finally {
                            this.deferredPrompt = null;
                        }
                    })
                    .catch((error) => {
                        this.trackError('native_prompt_choice_promise_failed', error);
                        this.deferredPrompt = null;
                        // Fallback to manual instructions if native prompt fails
                        try {
                            this.showManualInstallInstructions();
                        } catch (fallbackError) {
                            this.trackError('manual_instructions_fallback_failed', fallbackError);
                        }
                    });
            } else {
                // No native prompt available, show manual installation instructions
                this.showManualInstallInstructions();
            }

            // Hide the custom prompt
            if (this.installPromptUI) {
                this.installPromptUI.hide();
                this.installPromptUI = null;
            }
        } catch (error) {
            console.error('[PWAInstall] Error handling install click:', error);
        }
    }

    /**
     * Handle "Not Now" button click (dismissal)
     */
    handleDismiss() {
        try {
            console.log('[PWAInstall] Prompt dismissed by user');

            // Track dismissal and check for automatic "don't ask again"
            const newDismissalCount = this.storage.incrementDismissalCount();

            // Auto "don't ask again" after 3 dismissals
            if (newDismissalCount >= 3) {
                this.storage.setInstallationStatus('dont_ask');
                this.storage.updateUserPreference('dontAskAgain', true);
                console.log('[PWAInstall] Auto "don\'t ask again" triggered after 3 dismissals');

                // Show notification about the automatic setting
                if (window.showPWANotification) {
                    window.showPWANotification('Installation prompts have been disabled. You can still install from Settings if needed.', 'info');
                } else if (window.NotificationManager) {
                    NotificationManager.info('Installation prompts have been disabled. You can still install from Settings if needed.');
                } else if (window.showNotification) {
                    window.showNotification('Installation prompts have been disabled. You can still install from Settings if needed.', 'info');
                }
            } else {
                this.storage.setInstallationStatus('dismissed');
                console.log(`[PWAInstall] Prompt dismissed. ${3 - newDismissalCount} dismissals remaining before auto-disable.`);
            }

            // Hide the prompt
            if (this.installPromptUI) {
                this.installPromptUI.hide();
                this.installPromptUI = null;
            }
        } catch (error) {
            console.error('[PWAInstall] Error handling dismiss:', error);
        }
    }

    /**
     * Handle "Don't Ask Again" button click
     */
    handleDontAskAgain() {
        try {
            console.log('[PWAInstall] User selected "Don\'t Ask Again"');

            // Set permanent "don't ask again" status
            this.storage.setInstallationStatus('dont_ask');
            this.storage.updateUserPreference('dontAskAgain', true);

            // Show confirmation notification
            if (window.showPWANotification) {
                window.showPWANotification('Installation prompts disabled. You can re-enable them in Settings if needed.', 'info');
            } else if (window.NotificationManager) {
                NotificationManager.info('Installation prompts disabled. You can re-enable them in Settings if needed.');
            } else if (window.showNotification) {
                window.showNotification('Installation prompts disabled. You can re-enable them in Settings if needed.', 'info');
            }

            // Hide the prompt
            if (this.installPromptUI) {
                this.installPromptUI.hide();
                this.installPromptUI = null;
            }
        } catch (error) {
            console.error('[PWAInstall] Error handling don\'t ask again:', error);
        }
    }

    /**
     * Handle instruction acknowledgment ("Got It" button click)
     */
    handleInstructionsAcknowledged() {
        try {
            console.log('[PWAInstall] User acknowledged installation instructions');

            // Mark as prompted but don't count as dismissal
            this.storage.setInstallationStatus('prompted');
            this.storage.setLastPromptDate();

            // Show helpful notification
            if (window.showPWANotification) {
                window.showPWANotification('You can install the app anytime from your browser menu or Settings.', 'info');
            } else if (window.NotificationManager) {
                NotificationManager.info('You can install the app anytime from your browser menu or Settings.');
            } else if (window.showNotification) {
                window.showNotification('You can install the app anytime from your browser menu or Settings.', 'info');
            }

            // Hide the prompt
            if (this.installPromptUI) {
                this.installPromptUI.hide();
                this.installPromptUI = null;
            }
        } catch (error) {
            console.error('[PWAInstall] Error handling instructions acknowledged:', error);
        }
    }

    /**
     * Show manual installation instructions for browsers without native support
     */
    showManualInstallInstructions() {
        try {
            const userAgent = navigator.userAgent.toLowerCase();
            let instructions = '';

            if (userAgent.includes('safari') && userAgent.includes('mobile')) {
                // Safari on iOS
                instructions = 'To install: Tap the Share button, then "Add to Home Screen"';
            } else if (userAgent.includes('firefox')) {
                // Firefox
                instructions = 'To install: Look for the "Install" option in your browser menu';
            } else {
                // Generic instructions
                instructions = 'To install: Look for "Install App" or "Add to Home Screen" in your browser menu';
            }

            if (window.showPWANotification) {
                window.showPWANotification(instructions, 'info');
            } else if (window.NotificationManager) {
                NotificationManager.info(instructions);
            } else if (window.showNotification) {
                window.showNotification(instructions, 'info');
            }

            console.log('[PWAInstall] Manual installation instructions shown:', instructions);
        } catch (error) {
            console.error('[PWAInstall] Error showing manual install instructions:', error);
        }
    }

    /**
     * Update installation status in storage
     * @param {string} status - New installation status
     */
    updateInstallationStatus(status) {
        try {
            this.storage.setInstallationStatus(status);
            console.log('[PWAInstall] Installation status updated to:', status);
        } catch (error) {
            console.error('[PWAInstall] Error updating installation status:', error);
        }
    }

    /**
     * Track that a prompt was shown
     */
    trackPromptShown() {
        try {
            const newCount = this.storage.incrementPromptCount();
            this.storage.setLastPromptDate();
            this.storage.setInstallationStatus('prompted');

            // Track in analytics system
            this.analytics.trackPromptShown({
                source: 'automatic',
                trigger: 'eligibility_met',
                promptCount: newCount,
                sessionCount: this.storage.getSessionCount(),
                jobCount: this.storage.getJobApplicationCount()
            });

            console.log('[PWAInstall] Prompt shown tracked. Total prompts:', newCount);
        } catch (error) {
            console.error('[PWAInstall] Error tracking prompt shown:', error);
        }
    }

    /**
     * Track that user accepted installation
     */
    trackInstallAccepted() {
        try {
            this.updateInstallationStatus('installing');

            // Track in analytics system
            this.analytics.trackInstallClick({
                method: 'prompt_button',
                promptCount: this.storage.getPromptCount(),
                sessionCount: this.storage.getSessionCount(),
                jobCount: this.storage.getJobApplicationCount()
            });

            console.log('[PWAInstall] Install acceptance tracked');
        } catch (error) {
            console.error('[PWAInstall] Error tracking install acceptance:', error);
        }
    }

    /**
     * Track that user dismissed the prompt
     */
    trackPromptDismissed() {
        try {
            const newDismissalCount = this.storage.incrementDismissalCount();

            // Auto "don't ask again" after 3 dismissals
            if (newDismissalCount >= 3) {
                this.storage.setInstallationStatus('dont_ask');
                this.storage.updateUserPreference('dontAskAgain', true);

                // Track "don't ask again" in analytics
                this.analytics.trackDontAskAgain({
                    trigger: 'auto_after_dismissals',
                    dismissalCount: newDismissalCount,
                    sessionCount: this.storage.getSessionCount()
                });

                console.log('[PWAInstall] Auto "don\'t ask again" triggered after 3 dismissals');
            } else {
                this.storage.setInstallationStatus('dismissed');

                // Track dismissal in analytics
                this.analytics.trackDismiss({
                    reason: 'not_now',
                    dismissalCount: newDismissalCount,
                    sessionCount: this.storage.getSessionCount(),
                    jobCount: this.storage.getJobApplicationCount()
                });
            }

            console.log('[PWAInstall] Prompt dismissal tracked. Total dismissals:', newDismissalCount);
        } catch (error) {
            console.error('[PWAInstall] Error tracking prompt dismissal:', error);
        }
    }

    /**
     * Track successful installation
     */
    trackInstallationSuccess() {
        try {
            this.storage.setInstallationStatus('installed');
            this.storage.setInstallDate();

            // Track in analytics system
            this.analytics.trackInstallSuccess({
                method: 'pwa_prompt',
                totalPrompts: this.storage.getPromptCount(),
                totalDismissals: this.storage.getDismissalCount(),
                sessionCount: this.storage.getSessionCount(),
                jobCount: this.storage.getJobApplicationCount(),
                daysSinceFirstVisit: this.calculateDaysSinceFirstVisit()
            });

            console.log('[PWAInstall] Installation success tracked');
        } catch (error) {
            console.error('[PWAInstall] Error tracking installation success:', error);
        }
    }

    /**
     * Get current installation status
     * @returns {Object} Installation status information
     */
    getInstallationStatus() {
        try {
            const storageData = this.storage.getInstallationData();

            return {
                isInstalled: this.isInstalled,
                status: storageData.installationStatus,
                sessionCount: storageData.sessionCount,
                promptCount: storageData.promptCount,
                dismissalCount: storageData.dismissalCount,
                lastPromptDate: storageData.lastPromptDate,
                firstVisitDate: storageData.firstVisitDate,
                jobApplicationCount: storageData.jobApplicationCount,
                installDate: storageData.installDate,
                userPreferences: storageData.userPreferences,
                daysSinceLastPrompt: storageData.daysSinceLastPrompt,
                eligibilityMet: this.checkEligibility(),
                deferredPromptAvailable: !!this.deferredPrompt
            };
        } catch (error) {
            console.error('[PWAInstall] Error getting installation status:', error);
            return {
                isInstalled: false,
                status: 'error',
                sessionCount: 0,
                promptCount: 0,
                dismissalCount: 0,
                jobApplicationCount: 0,
                eligibilityMet: false,
                deferredPromptAvailable: false
            };
        }
    }

    /**
     * Calculate days since first visit
     * @returns {number} Number of days since first visit
     */
    calculateDaysSinceFirstVisit() {
        try {
            const firstVisitDate = this.storage.getFirstVisitDate();
            if (!firstVisitDate) {
                return 0;
            }

            const now = Date.now();
            const firstVisit = new Date(firstVisitDate).getTime();
            return Math.floor((now - firstVisit) / (1000 * 60 * 60 * 24));
        } catch (error) {
            console.error('[PWAInstall] Error calculating days since first visit:', error);
            return 0;
        }
    }

    /**
     * Reset installation preferences (for testing or user request)
     */
    resetInstallationPreferences() {
        try {
            this.storage.resetInstallationData(true); // Keep first visit date

            this.isInstalled = false;
            this.deferredPrompt = null;

            // Clean up any active UI
            if (this.installPromptUI) {
                this.installPromptUI.destroy();
                this.installPromptUI = null;
            }

            console.log('[PWAInstall] Installation preferences reset');
        } catch (error) {
            console.error('[PWAInstall] Error resetting installation preferences:', error);
        }
    }

    /**
     * Manually trigger installation prompt (for Settings integration)
     * @returns {boolean} True if prompt was shown, false if not eligible
     */
    manualInstallTrigger() {
        try {
            // Check if already installed
            if (this.isInstalled) {
                if (window.showPWANotification) {
                    window.showPWANotification('App is already installed!', 'info');
                } else if (window.NotificationManager) {
                    NotificationManager.info('App is already installed!');
                } else if (window.showNotification) {
                    window.showNotification('App is already installed!', 'info');
                }
                return false;
            }

            // Check if user has disabled prompts
            const userPrefs = this.storage.getUserPreferences();
            if (userPrefs && userPrefs.dontAskAgain) {
                // Allow manual trigger even if "don't ask again" is set
                console.log('[PWAInstall] Manual trigger overriding "don\'t ask again" setting');
            }

            // Show prompt regardless of normal eligibility criteria for manual trigger
            if (this.deferredPrompt || this.supportsManualInstall()) {
                this.showInstallPrompt();
                return true;
            } else {
                if (window.showPWANotification) {
                    window.showPWANotification('Installation is not supported in this browser.', 'info');
                } else if (window.NotificationManager) {
                    NotificationManager.info('Installation is not supported in this browser.');
                } else if (window.showNotification) {
                    window.showNotification('Installation is not supported in this browser.', 'warning');
                }
                return false;
            }
        } catch (error) {
            console.error('[PWAInstall] Error in manual install trigger:', error);
            return false;
        }
    }
}

// Make classes available globally
window.InstallationStorage = InstallationStorage;
window.PWAInstallManager = PWAInstallManager;