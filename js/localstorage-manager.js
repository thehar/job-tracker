/**
 * LocalStorage Manager (Fallback)
 * Provides localStorage-based storage when IndexedDB is not available
 * Maintains compatibility with existing localStorage structure
 */
class LocalStorageManager {
    constructor() {
        this.keys = {
            jobs: 'jobTracker_jobs',
            settings: 'jobTracker_settings',
            analytics: 'jobTracker_analytics',
            // Legacy keys for backward compatibility
            statuses: 'jobTracker_statuses',
            stages: 'jobTracker_stages',
            calendar: 'jobTracker_calendarSettings',
            notifications: 'jobTracker_notificationPreferences',
            installAnalytics: 'jobTracker_installAnalytics'
        };
        this.initialized = false;
    }

    /**
     * Initialize (no-op for localStorage)
     */
    async init() {
        try {
            // Test localStorage availability
            const testKey = 'jobTracker_storageTest';
            localStorage.setItem(testKey, 'test');
            const testValue = localStorage.getItem(testKey);
            localStorage.removeItem(testKey);
            
            if (testValue !== 'test') {
                throw new Error('localStorage not available');
            }
            
            this.initialized = true;
            console.log('[LocalStorageManager] Using localStorage fallback');
            return Promise.resolve();
        } catch (error) {
            console.error('[LocalStorageManager] localStorage not available:', error);
            throw error;
        }
    }

    /**
     * Get all jobs with optional filtering
     */
    async getJobs(filters = {}) {
        try {
            const stored = localStorage.getItem(this.keys.jobs);
            let jobs = stored ? JSON.parse(stored) : [];
            
            // Apply filters
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
        } catch (error) {
            console.error('[LocalStorageManager] Failed to get jobs:', error);
            return [];
        }
    }

    /**
     * Save jobs
     */
    async saveJobs(jobs) {
        try {
            localStorage.setItem(this.keys.jobs, JSON.stringify(jobs));
        } catch (error) {
            console.error('[LocalStorageManager] Failed to save jobs:', error);
            throw error;
        }
    }

    /**
     * Add a single job
     */
    async addJob(job) {
        try {
            const jobs = await this.getJobs();
            jobs.push(job);
            await this.saveJobs(jobs);
            return job;
        } catch (error) {
            console.error('[LocalStorageManager] Failed to add job:', error);
            throw error;
        }
    }

    /**
     * Update a single job
     */
    async updateJob(jobId, job) {
        try {
            const jobs = await this.getJobs();
            const index = jobs.findIndex(j => j.id === jobId);
            if (index !== -1) {
                jobs[index] = { ...job, id: jobId };
                await this.saveJobs(jobs);
            }
            return job;
        } catch (error) {
            console.error('[LocalStorageManager] Failed to update job:', error);
            throw error;
        }
    }

    /**
     * Delete a single job
     */
    async deleteJob(jobId) {
        try {
            const jobs = await this.getJobs();
            const filteredJobs = jobs.filter(job => job.id !== jobId);
            await this.saveJobs(filteredJobs);
        } catch (error) {
            console.error('[LocalStorageManager] Failed to delete job:', error);
            throw error;
        }
    }

    /**
     * Get settings (with legacy key support)
     */
    async getSettings() {
        try {
            const settings = {};
            
            // Try new unified settings first
            const stored = localStorage.getItem(this.keys.settings);
            if (stored) {
                const parsed = JSON.parse(stored);
                Object.assign(settings, parsed);
            } else {
                // Fall back to legacy keys
                const legacySettings = await this.loadLegacySettings();
                Object.assign(settings, legacySettings);
            }
            
            return settings;
        } catch (error) {
            console.error('[LocalStorageManager] Failed to get settings:', error);
            return {};
        }
    }

    /**
     * Load settings from legacy localStorage keys
     */
    async loadLegacySettings() {
        const settings = {};
        
        try {
            // Load statuses
            const statuses = localStorage.getItem(this.keys.statuses);
            if (statuses) {
                settings.statuses = JSON.parse(statuses);
            }

            // Load stages
            const stages = localStorage.getItem(this.keys.stages);
            if (stages) {
                settings.stages = JSON.parse(stages);
            }

            // Load calendar settings
            const calendar = localStorage.getItem(this.keys.calendar);
            if (calendar) {
                settings.calendar = JSON.parse(calendar);
            }

            // Load notification preferences
            const notifications = localStorage.getItem(this.keys.notifications);
            if (notifications) {
                settings.notifications = JSON.parse(notifications);
            }

        } catch (error) {
            console.warn('[LocalStorageManager] Failed to load legacy settings:', error);
        }

        return settings;
    }

    /**
     * Save settings
     */
    async saveSettings(settings) {
        try {
            localStorage.setItem(this.keys.settings, JSON.stringify(settings));
        } catch (error) {
            console.error('[LocalStorageManager] Failed to save settings:', error);
            throw error;
        }
    }

    /**
     * Get analytics data
     */
    async getAnalytics() {
        try {
            const analytics = {};
            
            // Try new unified analytics first
            const stored = localStorage.getItem(this.keys.analytics);
            if (stored) {
                const parsed = JSON.parse(stored);
                Object.assign(analytics, parsed);
            } else {
                // Fall back to legacy analytics
                const legacyAnalytics = await this.loadLegacyAnalytics();
                Object.assign(analytics, legacyAnalytics);
            }
            
            return analytics;
        } catch (error) {
            console.error('[LocalStorageManager] Failed to get analytics:', error);
            return {};
        }
    }

    /**
     * Load analytics from legacy localStorage keys
     */
    async loadLegacyAnalytics() {
        const analytics = {};
        
        try {
            // Load install analytics
            const installAnalytics = localStorage.getItem(this.keys.installAnalytics);
            if (installAnalytics) {
                analytics.install = JSON.parse(installAnalytics);
            }

        } catch (error) {
            console.warn('[LocalStorageManager] Failed to load legacy analytics:', error);
        }

        return analytics;
    }

    /**
     * Save analytics data
     */
    async saveAnalytics(analytics) {
        try {
            localStorage.setItem(this.keys.analytics, JSON.stringify(analytics));
        } catch (error) {
            console.error('[LocalStorageManager] Failed to save analytics:', error);
            throw error;
        }
    }

    /**
     * Clear all data
     */
    async clearAll() {
        try {
            // Clear all keys
            Object.values(this.keys).forEach(key => {
                localStorage.removeItem(key);
            });
            
            // Clear any other jobTracker keys
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('jobTracker_')) {
                    keysToRemove.push(key);
                }
            }
            
            keysToRemove.forEach(key => {
                localStorage.removeItem(key);
            });
            
        } catch (error) {
            console.error('[LocalStorageManager] Failed to clear data:', error);
            throw error;
        }
    }

    /**
     * Get storage statistics
     */
    async getDatabaseStats() {
        try {
            const stats = {};
            let totalSize = 0;
            
            Object.entries(this.keys).forEach(([name, key]) => {
                const data = localStorage.getItem(key);
                if (data) {
                    const size = new Blob([data]).size;
                    totalSize += size;
                    stats[name] = {
                        count: data ? 1 : 0,
                        size: size,
                        sizeMB: (size / (1024 * 1024)).toFixed(2)
                    };
                } else {
                    stats[name] = {
                        count: 0,
                        size: 0,
                        sizeMB: '0.00'
                    };
                }
            });
            
            stats.total = {
                size: totalSize,
                sizeMB: (totalSize / (1024 * 1024)).toFixed(2)
            };
            
            return stats;
        } catch (error) {
            console.error('[LocalStorageManager] Failed to get stats:', error);
            return {};
        }
    }

    /**
     * Check if migration has been completed
     */
    async isMigrationComplete(version) {
        try {
            const migrationKey = `jobTracker_migration_${version}`;
            return localStorage.getItem(migrationKey) === 'true';
        } catch (error) {
            console.error('[LocalStorageManager] Failed to check migration:', error);
            return false;
        }
    }

    /**
     * Mark migration as complete
     */
    async markMigrationComplete(version) {
        try {
            const migrationKey = `jobTracker_migration_${version}`;
            localStorage.setItem(migrationKey, 'true');
        } catch (error) {
            console.error('[LocalStorageManager] Failed to mark migration complete:', error);
            throw error;
        }
    }

    /**
     * Check if storage is available
     */
    isAvailable() {
        return this.initialized;
    }

    /**
     * Get storage type
     */
    getStorageType() {
        return 'localStorage';
    }
}
