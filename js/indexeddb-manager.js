/**
 * IndexedDB Manager
 * Handles all IndexedDB operations for the Job Tracker application
 * Provides high-performance storage with proper indexing and error handling
 */
class IndexedDBManager {
    constructor() {
        this.dbName = 'JobTrackerDB';
        this.version = 1;
        this.db = null;
        this.initialized = false;
        this.retryCount = 0;
        this.maxRetries = 3;
    }

    /**
     * Initialize IndexedDB
     */
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => {
                console.error('[IndexedDBManager] Failed to open database:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                this.initialized = true;
                this.retryCount = 0;
                console.log('[IndexedDBManager] Database opened successfully');
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                this.createObjectStores(db);
                console.log('[IndexedDBManager] Database schema created/updated');
            };

            // Handle database connection errors
            request.onblocked = () => {
                console.warn('[IndexedDBManager] Database upgrade blocked. Please close other tabs.');
                reject(new Error('Database upgrade blocked. Please close other tabs.'));
            };
        });
    }

    /**
     * Create object stores with proper indexing
     */
    createObjectStores(db) {
        // Jobs store - main data store
        if (!db.objectStoreNames.contains('jobs')) {
            const jobsStore = db.createObjectStore('jobs', { keyPath: 'id' });
            // Create indexes for efficient querying
            jobsStore.createIndex('company', 'company', { unique: false });
            jobsStore.createIndex('status', 'status', { unique: false });
            jobsStore.createIndex('dateApplied', 'dateApplied', { unique: false });
            jobsStore.createIndex('applicationSource', 'applicationSource', { unique: false });
            jobsStore.createIndex('createdAt', 'createdAt', { unique: false });
            jobsStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        // Settings store - user preferences
        if (!db.objectStoreNames.contains('settings')) {
            const settingsStore = db.createObjectStore('settings', { keyPath: 'key' });
            settingsStore.createIndex('category', 'category', { unique: false });
        }

        // Analytics store - PWA and performance data
        if (!db.objectStoreNames.contains('analytics')) {
            const analyticsStore = db.createObjectStore('analytics', { keyPath: 'key' });
            analyticsStore.createIndex('category', 'category', { unique: false });
            analyticsStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Cache store - performance optimization
        if (!db.objectStoreNames.contains('cache')) {
            const cacheStore = db.createObjectStore('cache', { keyPath: 'key' });
            cacheStore.createIndex('expires', 'expires', { unique: false });
        }

        // Migration store - track data migrations
        if (!db.objectStoreNames.contains('migrations')) {
            db.createObjectStore('migrations', { keyPath: 'version' });
        }
    }

    /**
     * Get all jobs with optional filtering
     */
    async getJobs(filters = {}) {
        return new Promise((resolve, reject) => {
            if (!this.initialized || !this.db) {
                reject(new Error('Database not initialized'));
                return;
            }

            const transaction = this.db.transaction(['jobs'], 'readonly');
            const store = transaction.objectStore('jobs');
            const request = store.getAll();

            request.onsuccess = () => {
                let jobs = request.result || [];
                
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

                resolve(jobs);
            };

            request.onerror = () => {
                console.error('[IndexedDBManager] Failed to get jobs:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Save jobs (replace all)
     */
    async saveJobs(jobs) {
        return new Promise((resolve, reject) => {
            if (!this.initialized) {
                reject(new Error('Database not initialized'));
                return;
            }

            const transaction = this.db.transaction(['jobs'], 'readwrite');
            const store = transaction.objectStore('jobs');

            // Clear existing jobs
            const clearRequest = store.clear();
            
            clearRequest.onsuccess = () => {
                if (jobs.length === 0) {
                    resolve();
                    return;
                }

                // Use put() instead of add() for better performance and to handle updates
                let completed = 0;
                let hasError = false;

                jobs.forEach(job => {
                    const putRequest = store.put(job);
                    putRequest.onsuccess = () => {
                        completed++;
                        if (completed === jobs.length && !hasError) {
                            resolve();
                        }
                    };
                    putRequest.onerror = () => {
                        if (!hasError) {
                            hasError = true;
                            console.error('[IndexedDBManager] Failed to save job:', putRequest.error);
                            reject(putRequest.error);
                        }
                    };
                });
            };

            clearRequest.onerror = () => {
                console.error('[IndexedDBManager] Failed to clear jobs:', clearRequest.error);
                reject(clearRequest.error);
            };
        });
    }

    /**
     * Add a single job
     */
    async addJob(job) {
        return new Promise((resolve, reject) => {
            if (!this.initialized) {
                reject(new Error('Database not initialized'));
                return;
            }

            const transaction = this.db.transaction(['jobs'], 'readwrite');
            const store = transaction.objectStore('jobs');
            const request = store.add(job);

            request.onsuccess = () => {
                resolve(job);
            };

            request.onerror = () => {
                console.error('[IndexedDBManager] Failed to add job:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Update a single job
     */
    async updateJob(jobId, job) {
        return new Promise((resolve, reject) => {
            if (!this.initialized) {
                reject(new Error('Database not initialized'));
                return;
            }

            const transaction = this.db.transaction(['jobs'], 'readwrite');
            const store = transaction.objectStore('jobs');
            const request = store.put({ ...job, id: jobId });

            request.onsuccess = () => {
                resolve(job);
            };

            request.onerror = () => {
                console.error('[IndexedDBManager] Failed to update job:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Delete a single job
     */
    async deleteJob(jobId) {
        return new Promise((resolve, reject) => {
            if (!this.initialized) {
                reject(new Error('Database not initialized'));
                return;
            }

            const transaction = this.db.transaction(['jobs'], 'readwrite');
            const store = transaction.objectStore('jobs');
            const request = store.delete(jobId);

            request.onsuccess = () => {
                resolve();
            };

            request.onerror = () => {
                console.error('[IndexedDBManager] Failed to delete job:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Get settings
     */
    async getSettings() {
        return new Promise((resolve, reject) => {
            if (!this.initialized) {
                reject(new Error('Database not initialized'));
                return;
            }

            const transaction = this.db.transaction(['settings'], 'readonly');
            const store = transaction.objectStore('settings');
            const request = store.getAll();

            request.onsuccess = () => {
                const settings = {};
                request.result.forEach(item => {
                    settings[item.key] = item.value;
                });
                resolve(settings);
            };

            request.onerror = () => {
                console.error('[IndexedDBManager] Failed to get settings:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Save settings
     */
    async saveSettings(settings) {
        return new Promise((resolve, reject) => {
            if (!this.initialized) {
                reject(new Error('Database not initialized'));
                return;
            }

            const transaction = this.db.transaction(['settings'], 'readwrite');
            const store = transaction.objectStore('settings');

            // Clear existing settings
            const clearRequest = store.clear();
            
            clearRequest.onsuccess = () => {
                const entries = Object.entries(settings);
                if (entries.length === 0) {
                    resolve();
                    return;
                }

                let completed = 0;
                let hasError = false;

                entries.forEach(([key, value]) => {
                    const addRequest = store.add({ 
                        key, 
                        value, 
                        category: this.getSettingCategory(key),
                        timestamp: new Date().toISOString()
                    });
                    addRequest.onsuccess = () => {
                        completed++;
                        if (completed === entries.length && !hasError) {
                            resolve();
                        }
                    };
                    addRequest.onerror = () => {
                        if (!hasError) {
                            hasError = true;
                            console.error('[IndexedDBManager] Failed to save setting:', addRequest.error);
                            reject(addRequest.error);
                        }
                    };
                });
            };

            clearRequest.onerror = () => {
                console.error('[IndexedDBManager] Failed to clear settings:', clearRequest.error);
                reject(clearRequest.error);
            };
        });
    }

    /**
     * Get analytics data
     */
    async getAnalytics() {
        return new Promise((resolve, reject) => {
            if (!this.initialized) {
                reject(new Error('Database not initialized'));
                return;
            }

            const transaction = this.db.transaction(['analytics'], 'readonly');
            const store = transaction.objectStore('analytics');
            const request = store.getAll();

            request.onsuccess = () => {
                const analytics = {};
                request.result.forEach(item => {
                    analytics[item.key] = item.value;
                });
                resolve(analytics);
            };

            request.onerror = () => {
                console.error('[IndexedDBManager] Failed to get analytics:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Save analytics data
     */
    async saveAnalytics(analytics) {
        return new Promise((resolve, reject) => {
            if (!this.initialized) {
                reject(new Error('Database not initialized'));
                return;
            }

            const transaction = this.db.transaction(['analytics'], 'readwrite');
            const store = transaction.objectStore('analytics');

            // Clear existing analytics
            const clearRequest = store.clear();
            
            clearRequest.onsuccess = () => {
                const entries = Object.entries(analytics);
                if (entries.length === 0) {
                    resolve();
                    return;
                }

                let completed = 0;
                let hasError = false;

                entries.forEach(([key, value]) => {
                    const addRequest = store.add({ 
                        key, 
                        value, 
                        category: this.getAnalyticsCategory(key),
                        timestamp: new Date().toISOString()
                    });
                    addRequest.onsuccess = () => {
                        completed++;
                        if (completed === entries.length && !hasError) {
                            resolve();
                        }
                    };
                    addRequest.onerror = () => {
                        if (!hasError) {
                            hasError = true;
                            console.error('[IndexedDBManager] Failed to save analytics:', addRequest.error);
                            reject(addRequest.error);
                        }
                    };
                });
            };

            clearRequest.onerror = () => {
                console.error('[IndexedDBManager] Failed to clear analytics:', clearRequest.error);
                reject(clearRequest.error);
            };
        });
    }

    /**
     * Clear all data
     */
    async clearAll() {
        return new Promise((resolve, reject) => {
            if (!this.initialized) {
                reject(new Error('Database not initialized'));
                return;
            }

            const transaction = this.db.transaction(['jobs', 'settings', 'analytics', 'cache'], 'readwrite');
            const stores = ['jobs', 'settings', 'analytics', 'cache'];
            let completed = 0;
            let hasError = false;

            stores.forEach(storeName => {
                const store = transaction.objectStore(storeName);
                const request = store.clear();
                request.onsuccess = () => {
                    completed++;
                    if (completed === stores.length && !hasError) {
                        resolve();
                    }
                };
                request.onerror = () => {
                    if (!hasError) {
                        hasError = true;
                        console.error(`[IndexedDBManager] Failed to clear ${storeName}:`, request.error);
                        reject(request.error);
                    }
                };
            });
        });
    }

    /**
     * Get database statistics
     */
    async getDatabaseStats() {
        return new Promise((resolve, reject) => {
            if (!this.initialized) {
                reject(new Error('Database not initialized'));
                return;
            }

            const transaction = this.db.transaction(['jobs', 'settings', 'analytics', 'cache'], 'readonly');
            const stores = ['jobs', 'settings', 'analytics', 'cache'];
            let totalSize = 0;
            let completed = 0;
            const stats = {};

            stores.forEach(storeName => {
                const store = transaction.objectStore(storeName);
                const request = store.getAll();
                request.onsuccess = () => {
                    const data = JSON.stringify(request.result);
                    const size = new Blob([data]).size;
                    totalSize += size;
                    stats[storeName] = {
                        count: request.result.length,
                        size: size,
                        sizeMB: (size / (1024 * 1024)).toFixed(2)
                    };
                    completed++;
                    if (completed === stores.length) {
                        stats.total = {
                            size: totalSize,
                            sizeMB: (totalSize / (1024 * 1024)).toFixed(2)
                        };
                        resolve(stats);
                    }
                };
                request.onerror = () => {
                    console.error(`[IndexedDBManager] Failed to get stats for ${storeName}:`, request.error);
                    reject(request.error);
                };
            });
        });
    }

    /**
     * Check if migration has been completed
     */
    async isMigrationComplete(version) {
        return new Promise((resolve, reject) => {
            if (!this.initialized || !this.db) {
                reject(new Error('Database not initialized'));
                return;
            }

            const transaction = this.db.transaction(['migrations'], 'readonly');
            const store = transaction.objectStore('migrations');
            const request = store.get(version);

            request.onsuccess = () => {
                resolve(!!request.result);
            };

            request.onerror = () => {
                console.error('[IndexedDBManager] Failed to check migration:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Mark migration as complete
     */
    async markMigrationComplete(version) {
        return new Promise((resolve, reject) => {
            if (!this.initialized) {
                reject(new Error('Database not initialized'));
                return;
            }

            const transaction = this.db.transaction(['migrations'], 'readwrite');
            const store = transaction.objectStore('migrations');
            const request = store.put({
                version,
                completedAt: new Date().toISOString()
            });

            request.onsuccess = () => {
                resolve();
            };

            request.onerror = () => {
                console.error('[IndexedDBManager] Failed to mark migration complete:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Get setting category for organization
     */
    getSettingCategory(key) {
        if (key.includes('status')) return 'statuses';
        if (key.includes('stage')) return 'stages';
        if (key.includes('calendar')) return 'calendar';
        if (key.includes('notification')) return 'notifications';
        if (key.includes('pwa') || key.includes('install')) return 'pwa';
        return 'general';
    }

    /**
     * Get analytics category for organization
     */
    getAnalyticsCategory(key) {
        if (key.includes('install')) return 'install';
        if (key.includes('performance')) return 'performance';
        if (key.includes('user')) return 'user';
        return 'general';
    }

    /**
     * Close database connection
     */
    close() {
        if (this.db) {
            this.db.close();
            this.db = null;
            this.initialized = false;
            console.log('[IndexedDBManager] Database connection closed');
        }
    }

    /**
     * Check if database is available
     */
    isAvailable() {
        return this.initialized && this.db !== null;
    }
}
