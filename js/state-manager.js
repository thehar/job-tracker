/**
 * Enhanced State Management System with IndexedDB
 * Centralized state management with event-driven updates and IndexedDB persistence
 * Maintains full backward compatibility with existing localStorage structure
 */
class StateManager {
    constructor() {
        this.state = {
            jobs: [],
            user: null,
            settings: {
                statuses: [],
                stages: [],
                calendar: {},
                notifications: {},
                pwa: {}
            },
            analytics: {
                install: {},
                performance: {}
            },
            ui: {
                currentView: 'jobs',
                filters: {},
                modals: {
                    settings: false,
                    edit: false,
                    admin: false
                }
            },
            cache: {
                lastUpdated: null,
                version: '1.0.0',
                migrationComplete: false
            }
        };
        
        this.subscribers = new Map();
        this.storage = null;
        this.useIndexedDB = false;
        this.initialized = false;
        this.migrationComplete = false;
        this.migrationVersion = '1.0.0';
        
        // Don't call init() in constructor - it's async and will cause issues
        // init() will be called explicitly by initializeStateManager()
    }

    /**
     * Initialize the state manager
     */
    async init() {
        try {
            console.log('[StateManager] Initializing enhanced state management...');
            
            // Check IndexedDB support
            this.useIndexedDB = await this.checkIndexedDBSupport();
            
            if (this.useIndexedDB) {
                this.storage = new IndexedDBManager();
                await this.storage.init();
                // Add a small delay to ensure database is fully ready
                await new Promise(resolve => setTimeout(resolve, 100));
                console.log('[StateManager] Using IndexedDB for enhanced storage');
            } else {
                this.storage = new LocalStorageManager();
                await this.storage.init();
                console.log('[StateManager] Using localStorage fallback');
            }
            
            // Load initial state
            await this.loadInitialState();
            
            // Check and perform migration if needed
            if (this.useIndexedDB && !this.migrationComplete) {
                try {
                    await this.performMigration();
                } catch (error) {
                    console.warn('[StateManager] Migration failed, continuing with current state:', error.message);
                    this.migrationComplete = true; // Prevent retry in same session
                }
            }
            
            this.initialized = true;
            console.log('[StateManager] Initialization complete');
            
            // Emit initialization complete event
            this.emit('stateManager:initialized', this.state);
            
        } catch (error) {
            console.error('[StateManager] Initialization failed:', error);
            // Fallback to localStorage
            this.useIndexedDB = false;
            this.storage = new LocalStorageManager();
            try {
                await this.storage.init();
                await this.loadInitialState();
                this.initialized = true;
            } catch (fallbackError) {
                console.error('[StateManager] Fallback initialization failed:', fallbackError);
                throw fallbackError;
            }
        }
    }

    /**
     * Check if IndexedDB is supported
     */
    async checkIndexedDBSupport() {
        if (!('indexedDB' in window)) {
            return false;
        }
        
        try {
            // Test IndexedDB functionality
            const testDB = await this.openTestDatabase();
            testDB.close();
            return true;
        } catch (error) {
            console.warn('[StateManager] IndexedDB not supported:', error);
            return false;
        }
    }

    /**
     * Open a test database to verify IndexedDB support
     */
    openTestDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('test_db', 1);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
            request.onupgradeneeded = () => {
                // Create test object store
                request.result.createObjectStore('test');
            };
        });
    }

    /**
     * Load initial state from storage
     */
    async loadInitialState() {
        try {
            // Ensure storage is ready before loading
            if (!this.storage || !this.storage.initialized) {
                throw new Error('Storage not ready');
            }
            
            const [jobs, settings, analytics] = await Promise.all([
                this.storage.getJobs(),
                this.storage.getSettings(),
                this.storage.getAnalytics()
            ]);

            // Clean and validate job data
            this.state.jobs = (jobs || []).map(job => DataManager.cleanJobData(job)).filter(job => job);
            this.state.settings = { ...this.getDefaultSettings(), ...settings };
            this.state.analytics = { ...this.getDefaultAnalytics(), ...analytics };
            this.state.cache.lastUpdated = new Date().toISOString();
            
            // Remove any duplicate jobs and track if any were removed
            const originalJobCount = this.state.jobs.length;
            this.removeDuplicateJobs();
            
            // Only persist if duplicates were actually removed
            if (this.state.jobs.length !== originalJobCount) {
                await this.persistStateChanges({ jobs: this.state.jobs });
            }

            console.log('[StateManager] Initial state loaded:', {
                jobs: this.state.jobs.length,
                settings: Object.keys(this.state.settings).length,
                analytics: Object.keys(this.state.analytics).length,
                storageType: this.useIndexedDB ? 'IndexedDB' : 'localStorage'
            });

        } catch (error) {
            console.error('[StateManager] Failed to load initial state:', error);
            // Use default state
            this.state.settings = this.getDefaultSettings();
            this.state.analytics = this.getDefaultAnalytics();
        }
    }

    /**
     * Perform migration from localStorage to IndexedDB
     */
    async performMigration() {
        try {
            // Ensure storage is ready before migration
            if (!this.storage || !this.storage.initialized) {
                throw new Error('Storage not ready for migration');
            }
            
            // Check if migration has already been completed
            const migrationComplete = await this.storage.isMigrationComplete(this.migrationVersion);
            if (migrationComplete) {
                this.migrationComplete = true;
                console.log('[StateManager] Migration already completed');
                return;
            }
            
            // Additional check: if we already have jobs in IndexedDB, don't migrate
            const existingJobs = await this.storage.getJobs();
            if (existingJobs && existingJobs.length > 0) {
                console.log(`[StateManager] Found ${existingJobs.length} existing jobs in IndexedDB, skipping migration`);
                this.migrationComplete = true;
                return;
            }

            console.log('[StateManager] Starting data migration from localStorage...');
            
            // Migrate jobs
            const jobs = this.loadJobsFromLocalStorage();
            if (jobs.length > 0) {
                // Clean job data before saving
                const cleanedJobs = jobs.map(job => DataManager.cleanJobData(job)).filter(job => job);
                await this.storage.saveJobs(cleanedJobs);
                console.log(`[StateManager] Migrated ${cleanedJobs.length} jobs`);
            }

            // Migrate settings
            const settings = this.loadSettingsFromLocalStorage();
            if (Object.keys(settings).length > 0) {
                await this.storage.saveSettings(settings);
                console.log('[StateManager] Migrated settings');
            }

            // Migrate analytics
            const analytics = this.loadAnalyticsFromLocalStorage();
            if (Object.keys(analytics).length > 0) {
                await this.storage.saveAnalytics(analytics);
                console.log('[StateManager] Migrated analytics');
            }

            // Mark migration as complete
            try {
                await this.storage.markMigrationComplete(this.migrationVersion);
                this.migrationComplete = true;
                this.state.cache.migrationComplete = true;
                console.log('[StateManager] Data migration complete');
            } catch (error) {
                // If marking migration complete fails, check if it's already complete
                const alreadyComplete = await this.storage.isMigrationComplete(this.migrationVersion);
                if (alreadyComplete) {
                    this.migrationComplete = true;
                    this.state.cache.migrationComplete = true;
                    console.log('[StateManager] Migration was already marked complete');
                } else {
                    throw error; // Re-throw if it's a different error
                }
            }
            
            // Reload state with migrated data
            await this.loadInitialState();
            
        } catch (error) {
            console.error('[StateManager] Migration failed:', error);
            // Continue without migration
            this.migrationComplete = true;
        }
    }

    /**
     * Load jobs from localStorage for migration
     */
    loadJobsFromLocalStorage() {
        try {
            const storedJobs = localStorage.getItem('jobTracker_jobs');
            const jobs = storedJobs ? JSON.parse(storedJobs) : [];
            
            // Apply existing data migration (applicationSource field)
            const migratedJobs = jobs.map(job => {
                if (!job.hasOwnProperty('applicationSource')) {
                    return {
                        ...job,
                        applicationSource: ''
                    };
                }
                return job;
            });
            
            return migratedJobs;
        } catch (error) {
            console.warn('[StateManager] Failed to load jobs from localStorage:', error);
            return [];
        }
    }

    /**
     * Load settings from localStorage for migration
     */
    loadSettingsFromLocalStorage() {
        const settings = {};
        
        try {
            // Load statuses
            const statuses = localStorage.getItem('jobTracker_statuses');
            if (statuses) {
                settings.statuses = JSON.parse(statuses);
            }

            // Load stages
            const stages = localStorage.getItem('jobTracker_stages');
            if (stages) {
                settings.stages = JSON.parse(stages);
            }

            // Load calendar settings
            const calendar = localStorage.getItem('jobTracker_calendarSettings');
            if (calendar) {
                settings.calendar = JSON.parse(calendar);
            }

            // Load notification preferences
            const notifications = localStorage.getItem('jobTracker_notificationPreferences');
            if (notifications) {
                settings.notifications = JSON.parse(notifications);
            }

        } catch (error) {
            console.warn('[StateManager] Failed to load settings from localStorage:', error);
        }

        return settings;
    }

    /**
     * Load analytics from localStorage for migration
     */
    loadAnalyticsFromLocalStorage() {
        const analytics = {};
        
        try {
            // Load install analytics
            const installAnalytics = localStorage.getItem('jobTracker_installAnalytics');
            if (installAnalytics) {
                analytics.install = JSON.parse(installAnalytics);
            }

        } catch (error) {
            console.warn('[StateManager] Failed to load analytics from localStorage:', error);
        }

        return analytics;
    }

    /**
     * Get default settings
     */
    getDefaultSettings() {
        return {
            statuses: [
                'Applied', 'Interview Scheduled', 'Interview Completed',
                'Offer Received', 'Rejected', 'Withdrawn'
            ],
            stages: [
                'Application Submitted', 'Phone Screen', 'Technical Interview',
                'Onsite Interview', 'Final Round', 'Negotiation'
            ],
            calendar: {
                enabled: false,
                provider: 'google',
                autoSync: true,
                syncInterviews: true,
                syncFollowUps: false,
                eventDuration: 60,
                reminderMinutes: [60, 15]
            },
            notifications: {
                enabled: false,
                types: { interviews: true, followUps: true, statusChanges: false },
                timing: { interviews: [1440, 120, 30], followUps: [72] }
            },
            pwa: {
                installPrompted: false,
                installDismissed: false,
                installCount: 0
            }
        };
    }

    /**
     * Get default analytics
     */
    getDefaultAnalytics() {
        return {
            install: {
                promptsShown: 0,
                promptsClicked: 0,
                installsCompleted: 0,
                platformBreakdown: {},
                browserBreakdown: {},
                timeline: []
            },
            performance: {
                loadTimes: [],
                errorCount: 0,
                userActions: []
            }
        };
    }

    /**
     * Subscribe to state changes
     */
    subscribe(key, callback) {
        if (!this.subscribers.has(key)) {
            this.subscribers.set(key, new Set());
        }
        this.subscribers.get(key).add(callback);
        
        // Return unsubscribe function
        return () => {
            const callbacks = this.subscribers.get(key);
            if (callbacks) {
                callbacks.delete(callback);
                if (callbacks.size === 0) {
                    this.subscribers.delete(key);
                }
            }
        };
    }

    /**
     * Emit state change events
     */
    emit(key, data) {
        const callbacks = this.subscribers.get(key);
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('[StateManager] Error in subscriber callback:', error);
                }
            });
        }
    }

    /**
     * Get current state
     */
    getState() {
        return { ...this.state };
    }

    /**
     * Remove duplicate jobs based on multiple criteria
     */
    removeDuplicateJobs() {
        const originalCount = this.state.jobs.length;
        console.log(`[StateManager] Checking for duplicates in ${originalCount} jobs...`);
        
        // First, ensure all jobs have IDs
        this.state.jobs.forEach((job, index) => {
            if (!job.id) {
                job.id = `job_${Date.now()}_${index}`;
            }
        });
        
        // Remove duplicates based on ID
        const seen = new Set();
        const uniqueJobs = this.state.jobs.filter(job => {
            if (seen.has(job.id)) {
                console.log(`[StateManager] Found duplicate job with ID: ${job.id}`);
                return false;
            }
            seen.add(job.id);
            return true;
        });
        
        // Also check for duplicates based on company + position + date
        const contentSeen = new Set();
        const finalJobs = uniqueJobs.filter(job => {
            const key = `${job.company}_${job.position}_${job.dateApplied}`;
            if (contentSeen.has(key)) {
                console.log(`[StateManager] Found duplicate job content: ${job.company} - ${job.position}`);
                return false;
            }
            contentSeen.add(key);
            return true;
        });
        
        if (finalJobs.length !== originalCount) {
            console.log(`[StateManager] Removed ${originalCount - finalJobs.length} duplicate jobs (${originalCount} -> ${finalJobs.length})`);
            this.state.jobs = finalJobs;
            // Don't persist here - let the caller decide when to persist
            // this.persistStateChanges({ jobs: finalJobs });
        } else {
            console.log(`[StateManager] No duplicates found`);
        }
    }

    /**
     * Get specific state slice
     */
    getStateSlice(key) {
        return this.state[key];
    }

    /**
     * Update state and persist changes
     */
    async setState(updates, persist = true) {
        try {
            // Update state
            const oldState = { ...this.state };
            this.state = { ...this.state, ...updates };
            this.state.cache.lastUpdated = new Date().toISOString();

            // Persist changes if requested
            if (persist) {
                await this.persistStateChanges(updates);
            }

            // Emit change events
            this.emit('state:changed', { oldState, newState: this.state, updates });

            // Emit specific change events
            Object.keys(updates).forEach(key => {
                this.emit(`state:${key}:changed`, updates[key]);
            });

        } catch (error) {
            console.error('[StateManager] Failed to update state:', error);
            throw error;
        }
    }

    /**
     * Persist state changes to storage
     */
    async persistStateChanges(updates) {
        try {
            const promises = [];

            if (updates.jobs) {
                promises.push(this.storage.saveJobs(updates.jobs));
            }

            if (updates.settings) {
                promises.push(this.storage.saveSettings(updates.settings));
            }

            if (updates.analytics) {
                promises.push(this.storage.saveAnalytics(updates.analytics));
            }

            await Promise.all(promises);

        } catch (error) {
            console.error('[StateManager] Failed to persist state changes:', error);
            throw error;
        }
    }

    /**
     * Add a job
     */
    async addJob(jobData) {
        try {
            const job = DataManager.createJobObject(jobData);
            const newJobs = [...this.state.jobs, job];
            
            await this.setState({ jobs: newJobs });
            this.emit('job:added', job);
            
            return job;
        } catch (error) {
            console.error('[StateManager] Failed to add job:', error);
            throw error;
        }
    }

    /**
     * Update a job
     */
    async updateJob(jobId, jobData) {
        try {
            const jobIndex = this.state.jobs.findIndex(job => job.id === jobId);
            if (jobIndex === -1) {
                throw new Error('Job not found');
            }

            const updatedJob = DataManager.updateJobObject(this.state.jobs[jobIndex], jobData);
            const newJobs = [...this.state.jobs];
            newJobs[jobIndex] = updatedJob;

            await this.setState({ jobs: newJobs });
            this.emit('job:updated', updatedJob);

            return updatedJob;
        } catch (error) {
            console.error('[StateManager] Failed to update job:', error);
            throw error;
        }
    }

    /**
     * Delete a job
     */
    async deleteJob(jobId) {
        try {
            const newJobs = this.state.jobs.filter(job => job.id !== jobId);
            await this.setState({ jobs: newJobs });
            this.emit('job:deleted', jobId);
        } catch (error) {
            console.error('[StateManager] Failed to delete job:', error);
            throw error;
        }
    }

    /**
     * Update settings
     */
    async updateSettings(settings) {
        try {
            const newSettings = { ...this.state.settings, ...settings };
            await this.setState({ settings: newSettings });
            this.emit('settings:updated', newSettings);
        } catch (error) {
            console.error('[StateManager] Failed to update settings:', error);
            throw error;
        }
    }

    /**
     * Update analytics
     */
    async updateAnalytics(analytics) {
        try {
            const newAnalytics = { ...this.state.analytics, ...analytics };
            await this.setState({ analytics: newAnalytics });
            this.emit('analytics:updated', newAnalytics);
        } catch (error) {
            console.error('[StateManager] Failed to update analytics:', error);
            throw error;
        }
    }

    /**
     * Get jobs with optional filtering
     */
    getJobs(filters = {}) {
        let jobs = [...this.state.jobs];

        if (filters.status) {
            jobs = jobs.filter(job => job.status === filters.status);
        }

        if (filters.company) {
            jobs = jobs.filter(job => 
                job.company.toLowerCase().includes(filters.company.toLowerCase())
            );
        }

        if (filters.dateRange) {
            const { start, end } = filters.dateRange;
            jobs = jobs.filter(job => {
                const jobDate = new Date(job.dateApplied);
                return jobDate >= start && jobDate <= end;
            });
        }

        if (filters.applicationSource) {
            jobs = jobs.filter(job => job.applicationSource === filters.applicationSource);
        }

        return jobs;
    }

    /**
     * Get job by ID
     */
    getJobById(jobId) {
        return this.state.jobs.find(job => job.id === jobId);
    }

    /**
     * Clear all data
     */
    async clearAllData() {
        try {
            await this.storage.clearAll();
            this.state = {
                ...this.state,
                jobs: [],
                analytics: this.getDefaultAnalytics()
            };
            this.emit('data:cleared');
        } catch (error) {
            console.error('[StateManager] Failed to clear data:', error);
            throw error;
        }
    }

    /**
     * Export all data
     */
    async exportData() {
        return {
            jobs: this.state.jobs,
            settings: this.state.settings,
            analytics: this.state.analytics,
            exportDate: new Date().toISOString(),
            version: this.state.cache.version,
            storageType: this.useIndexedDB ? 'IndexedDB' : 'localStorage'
        };
    }

    /**
     * Import data
     */
    async importData(data) {
        try {
            if (data.jobs) {
                await this.setState({ jobs: data.jobs });
            }
            if (data.settings) {
                await this.setState({ settings: data.settings });
            }
            if (data.analytics) {
                await this.setState({ analytics: data.analytics });
            }
            
            this.emit('data:imported', data);
        } catch (error) {
            console.error('[StateManager] Failed to import data:', error);
            throw error;
        }
    }

    /**
     * Get storage statistics
     */
    async getStorageStats() {
        try {
            return await this.storage.getDatabaseStats();
        } catch (error) {
            console.error('[StateManager] Failed to get storage stats:', error);
            return {};
        }
    }

    /**
     * Check if state manager is ready
     */
    isReady() {
        return this.initialized;
    }

    /**
     * Get storage type
     */
    getStorageType() {
        return this.useIndexedDB ? 'IndexedDB' : 'localStorage';
    }

    /**
     * Check if migration is complete
     */
    isMigrationComplete() {
        return this.migrationComplete;
    }

    /**
     * Force duplicate removal (for debugging)
     */
    forceRemoveDuplicates() {
        console.log('[StateManager] Force removing duplicates...');
        this.removeDuplicateJobs();
        return this.state.jobs.length;
    }
}

// Global state manager instance
let stateManager;

/**
 * Initialize the state manager
 */
async function initializeStateManager() {
    if (!stateManager) {
        stateManager = new StateManager();
        await stateManager.init();
        window.stateManager = stateManager;
    }
    return stateManager;
}

/**
 * Get the state manager instance
 */
function getStateManager() {
    if (!stateManager) {
        throw new Error('State manager not initialized. Call initializeStateManager() first.');
    }
    return stateManager;
}

/**
 * Check if state manager is available
 */
function isStateManagerAvailable() {
    return stateManager && stateManager.isReady();
}
