/**
 * Dashboard Manager
 * Handles analytics dashboard, charts, and data visualization
 * Enhanced to use state manager for reactive updates
 */
class Dashboard {
    constructor(jobTracker) {
        this.jobTracker = jobTracker;
        this.stateManager = null;
        this.unsubscribers = [];
        this.charts = {
            // Job tracking charts
            statusChart: null,
            stageChart: null,
            sourceChart: null,
            sourcePerformanceChart: null,
            timelineChart: null,
            sourceTimelineChart: null,
            stageTimelineChart: null,
            submissionRateChart: null,
            // Installation analytics charts
            installFunnelChart: null,
            platformBreakdownChart: null,
            browserBreakdownChart: null,
            installTimelineChart: null
        };
        this.chartCreationQueue = [];
        this.isCreatingChart = false;
        this.isUpdatingCharts = false;
        this.cachedInstallAnalytics = null;
        this.lastAnalyticsUpdate = 0;
        this.init();
    }

    /**
     * Process chart creation queue
     */
    processChartQueue() {
        if (this.isCreatingChart || this.chartCreationQueue.length === 0) {
            return;
        }
        
        this.isCreatingChart = true;
        const chartMethod = this.chartCreationQueue.shift();
        
        try {
            chartMethod();
        } catch (error) {
            console.error('[Dashboard] Error in chart queue processing:', error);
        } finally {
            this.isCreatingChart = false;
            // Process next chart after a shorter delay for better performance
            setTimeout(() => this.processChartQueue(), 16); // ~60fps
        }
    }

    /**
     * Add chart method to queue
     */
    queueChartUpdate(chartMethod) {
        this.chartCreationQueue.push(chartMethod);
        this.processChartQueue();
    }

    /**
     * Safely destroy a chart instance
     */
    destroyChart(chart) {
        if (chart && typeof chart.destroy === 'function') {
            try {
                chart.destroy();
            } catch (error) {
                console.warn('[Dashboard] Error destroying chart:', error);
            }
        }
    }

    /**
     * Destroy all charts globally
     */
    destroyAllCharts() {
        if (typeof Chart !== 'undefined') {
            // Method 1: Use Chart.instances if available
            if (Chart.instances) {
                Object.keys(Chart.instances).forEach(key => {
                    try {
                        Chart.instances[key].destroy();
                    } catch (error) {
                        console.warn('[Dashboard] Error destroying chart instance:', error);
                    }
                });
            }
            
            // Method 2: Use Chart.getChart for all known canvas elements
            const canvasIds = ['statusChart', 'stageChart', 'sourceChart', 'sourcePerformanceChart', 
                              'timelineChart', 'sourceTimelineChart', 'stageTimelineChart', 'submissionRateChart'];
            
            // Multiple cleanup passes to ensure all charts are destroyed
            for (let pass = 0; pass < 3; pass++) {
                canvasIds.forEach(canvasId => {
                    const canvas = document.getElementById(canvasId);
                    if (canvas && Chart.getChart) {
                        try {
                            const existingChart = Chart.getChart(canvas);
                            if (existingChart) {
                                console.log(`[Dashboard] Pass ${pass + 1}: Destroying existing chart on ${canvasId}`);
                                existingChart.destroy();
                            }
                        } catch (error) {
                            console.warn(`[Dashboard] Pass ${pass + 1}: Error destroying chart on ${canvasId}:`, error);
                        }
                    }
                });
            }
        }
    }

    /**
     * Check if an element is visible and has layout
     */
    isElementVisible(el) {
        if (!el) return false;
        if (el.offsetParent === null) return false;
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
    }

    /**
     * Run a callback as soon as an element becomes visible, prioritizing next-frame latency
     * Uses requestAnimationFrame with IntersectionObserver/ResizeObserver fallbacks.
     */
    runWhenVisibleRAF(el, cb) {
        if (!el || typeof cb !== 'function') return;

        const cleanup = [];
        let triggered = false;

        const trigger = () => {
            if (triggered) return;
            triggered = true;
            try { cb(); } catch (e) { console.warn('[Dashboard] runWhenVisibleRAF callback error:', e); }
            // cleanup observers/listeners
            cleanup.forEach(fn => { try { fn(); } catch (_) {} });
        };

        // Immediate check on next frame for fastest path
        const rafId = requestAnimationFrame(() => {
            if (this.isElementVisible(el)) {
                trigger();
            }
        });
        cleanup.push(() => cancelAnimationFrame(rafId));

        // IntersectionObserver: fires when element enters viewport and has layout
        if ('IntersectionObserver' in window) {
            const io = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && this.isElementVisible(el)) {
                        trigger();
                    }
                });
            }, { root: null, threshold: 0 });
            io.observe(el);
            cleanup.push(() => io.disconnect());
        }

        // ResizeObserver: fires when element gains non-zero size
        if ('ResizeObserver' in window) {
            const ro = new ResizeObserver(() => {
                if (this.isElementVisible(el)) {
                    trigger();
                }
            });
            ro.observe(el);
            cleanup.push(() => ro.disconnect());
        }

        // Fallback RAF loop (bounded) in case observers are unavailable
        let framesLeft = 60; // ~1s at 60fps max
        const loop = () => {
            if (triggered) return;
            if (this.isElementVisible(el)) {
                trigger();
                return;
            }
            if (framesLeft-- > 0) {
                requestAnimationFrame(loop);
            }
        };
        requestAnimationFrame(loop);
    }

    // Backward-compatible alias to match earlier plan wording
    runWhenVisible(el, cb) {
        this.runWhenVisibleRAF(el, cb);
    }

    /**
     * Reset canvas to clean state
     */
    resetCanvas(canvas) {
        if (!canvas) return;

        try {
            // Force destroy any existing chart
            if (typeof Chart !== 'undefined' && Chart.getChart) {
                const existingChart = Chart.getChart(canvas);
                if (existingChart) {
                    console.log('[Dashboard] Found existing chart on canvas, destroying it');
                    existingChart.destroy();
                }
            }

            // Remove Chart.js specific properties
            if (canvas.chartjs) {
                delete canvas.chartjs;
            }

            // Clear all Chart.js attributes
            canvas.removeAttribute('data-chartjs-chart');
            canvas.removeAttribute('data-chartjs-chart-id');

            // Get context and clear multiple times
            const ctx = canvas.getContext('2d');
            
            // Clear the canvas multiple times to ensure it's clean
            for (let i = 0; i < 3; i++) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }

            // Force canvas size reset
            const currentWidth = canvas.width;
            const currentHeight = canvas.height;
            canvas.width = currentWidth;
            canvas.height = currentHeight;

            // Clear again after size reset
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Reset canvas style
            canvas.style.width = '';
            canvas.style.height = '';

        } catch (error) {
            console.warn('[Dashboard] Error resetting canvas:', error);
        }
    }

    /**
     * Recreate canvas element completely
     */
    recreateCanvas(canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return null;

        const parent = canvas.parentNode;
        const newCanvas = canvas.cloneNode(false);
        
        // Remove all Chart.js specific attributes
        newCanvas.removeAttribute('data-chartjs-chart');
        if (newCanvas.chartjs) {
            delete newCanvas.chartjs;
        }

        parent.replaceChild(newCanvas, canvas);
        return newCanvas;
    }

    /**
     * Initialize dashboard
     */
    init() {
        this.setupEventListeners();
        this.setupTabSwitching();
        this.setupStateManager();
        // Ensure dashboard is visible when initialized
        this.switchToDashboardView();
        this.refresh();
    }

    /**
     * Setup state manager integration
     */
    setupStateManager() {
        // State manager should be ready by the time this component is created
        if (isStateManagerAvailable()) {
            this.stateManager = getStateManager();
            this.setupStateSubscriptions();
        } else {
            console.warn('[Dashboard] State manager not available during setup');
        }
    }

    /**
     * Setup state manager subscriptions
     */
    setupStateSubscriptions() {
        if (!this.stateManager) return;

        // Subscribe to job changes
        const unsubscribeJobs = this.stateManager.subscribe('state:jobs:changed', (jobs) => {
            try {
                this.refresh();
            } catch (error) {
                console.error('[Dashboard] Error in jobs state subscription callback:', error);
            }
        });

        // Subscribe to settings changes
        const unsubscribeSettings = this.stateManager.subscribe('state:settings:changed', (settings) => {
            try {
                this.refresh();
            } catch (error) {
                console.error('[Dashboard] Error in settings state subscription callback:', error);
            }
        });

        // Subscribe to analytics changes
        const unsubscribeAnalytics = this.stateManager.subscribe('state:analytics:changed', (analytics) => {
            try {
                this.refresh();
            } catch (error) {
                console.error('[Dashboard] Error in analytics state subscription callback:', error);
            }
        });

        this.unsubscribers.push(unsubscribeJobs, unsubscribeSettings, unsubscribeAnalytics);
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Weekly report button
        const weeklyReportBtn = document.getElementById('weeklyReportBtn');
        if (weeklyReportBtn) {
            weeklyReportBtn.addEventListener('click', () => {
                if (window.weeklyReportManager) {
                    window.weeklyReportManager.generateReport();
                }
            });
        }

        // Installation analytics export button
        const exportInstallBtn = document.getElementById('exportInstallAnalyticsBtn');
        if (exportInstallBtn) {
            exportInstallBtn.addEventListener('click', () => {
                this.exportInstallationAnalytics();
            });
        }

        // Reset installation analytics button
        const resetInstallBtn = document.getElementById('resetInstallAnalyticsBtn');
        if (resetInstallBtn) {
            resetInstallBtn.addEventListener('click', () => {
                this.resetInstallationAnalytics();
            });
        }

        // Calendar sync for upcoming interviews
        const syncUpcomingInterviewsBtn = document.getElementById('syncUpcomingInterviews');
        if (syncUpcomingInterviewsBtn) {
            syncUpcomingInterviewsBtn.addEventListener('click', () => {
                this.syncUpcomingInterviewsToCalendar();
            });
        }
    }

    /**
     * Setup tab switching between Jobs, Dashboard, and Admin
     */
    setupTabSwitching() {
        const jobsTab = document.getElementById('jobsTab');
        const dashboardTab = document.getElementById('dashboardTab');
        const adminTab = document.getElementById('adminTab');
        const jobsSection = document.querySelector('.main-content');
        const dashboardSection = document.getElementById('dashboardSection');
        const adminSection = document.getElementById('adminSection');

        // Array of all tabs for keyboard navigation
        const tabs = [jobsTab, dashboardTab, adminTab].filter(tab => tab);

        if (jobsTab && dashboardTab && jobsSection && dashboardSection) {
            jobsTab.addEventListener('click', () => {
                this.switchToJobsView();
            });

            dashboardTab.addEventListener('click', () => {
                this.switchToDashboardView();
            });
        }

        if (adminTab && adminSection) {
            adminTab.addEventListener('click', () => {
                this.switchToAdminView();
            });
        }

        // Add keyboard navigation for tabs
        tabs.forEach((tab, index) => {
            if (tab) {
                tab.addEventListener('keydown', (e) => {
                    this.handleTabKeydown(e, tabs, index);
                });
            }
        });

        // Initialize tab states
        this.initializeTabStates();
    }

    /**
     * Switch to jobs view
     */
    switchToJobsView() {
        const jobsTab = document.getElementById('jobsTab');
        const dashboardTab = document.getElementById('dashboardTab');
        const adminTab = document.getElementById('adminTab');
        const jobsSection = document.querySelector('.main-content');
        const dashboardSection = document.getElementById('dashboardSection');
        const adminSection = document.getElementById('adminSection');

        if (jobsTab && dashboardTab && jobsSection && dashboardSection) {
            // Update tab states
            jobsTab.classList.add('active');
            jobsTab.setAttribute('aria-selected', 'true');
            jobsTab.setAttribute('tabindex', '0');
            
            dashboardTab.classList.remove('active');
            dashboardTab.setAttribute('aria-selected', 'false');
            dashboardTab.setAttribute('tabindex', '-1');
            
            if (adminTab) {
                adminTab.classList.remove('active');
                adminTab.setAttribute('aria-selected', 'false');
                adminTab.setAttribute('tabindex', '-1');
            }
            
            // Update section visibility
            jobsSection.classList.remove('hidden');
            jobsSection.setAttribute('aria-hidden', 'false');
            dashboardSection.classList.add('hidden');
            dashboardSection.setAttribute('aria-hidden', 'true');
            if (adminSection) {
                adminSection.classList.add('hidden');
                adminSection.setAttribute('aria-hidden', 'true');
            }
            
            // Announce the change to screen readers
            this.announceTabChange('Jobs view');
        }
    }

    /**
     * Switch to dashboard view
     */
    switchToDashboardView() {
        const jobsTab = document.getElementById('jobsTab');
        const dashboardTab = document.getElementById('dashboardTab');
        const adminTab = document.getElementById('adminTab');
        const jobsSection = document.querySelector('.main-content');
        const dashboardSection = document.getElementById('dashboardSection');
        const adminSection = document.getElementById('adminSection');

        if (jobsTab && dashboardTab && jobsSection && dashboardSection) {
            // Update tab states
            jobsTab.classList.remove('active');
            jobsTab.setAttribute('aria-selected', 'false');
            jobsTab.setAttribute('tabindex', '-1');
            
            dashboardTab.classList.add('active');
            dashboardTab.setAttribute('aria-selected', 'true');
            dashboardTab.setAttribute('tabindex', '0');
            
            if (adminTab) {
                adminTab.classList.remove('active');
                adminTab.setAttribute('aria-selected', 'false');
                adminTab.setAttribute('tabindex', '-1');
            }
            
            // Update section visibility
            jobsSection.classList.add('hidden');
            jobsSection.setAttribute('aria-hidden', 'true');
            dashboardSection.classList.remove('hidden');
            dashboardSection.setAttribute('aria-hidden', 'false');
            if (adminSection) {
                adminSection.classList.add('hidden');
                adminSection.setAttribute('aria-hidden', 'true');
            }

            // Announce the change to screen readers
            this.announceTabChange('Dashboard view');

            // Defer heavy operations to next frame to keep UI responsive
            requestAnimationFrame(() => {
                this.refresh();
            });
        }
    }

    /**
     * Switch to admin view
     */
    switchToAdminView() {
        const jobsTab = document.getElementById('jobsTab');
        const dashboardTab = document.getElementById('dashboardTab');
        const adminTab = document.getElementById('adminTab');
        const jobsSection = document.querySelector('.main-content');
        const dashboardSection = document.getElementById('dashboardSection');
        const adminSection = document.getElementById('adminSection');

        if (adminTab && adminSection) {
            // Update tab states
            if (jobsTab) {
                jobsTab.classList.remove('active');
                jobsTab.setAttribute('aria-selected', 'false');
                jobsTab.setAttribute('tabindex', '-1');
            }
            if (dashboardTab) {
                dashboardTab.classList.remove('active');
                dashboardTab.setAttribute('aria-selected', 'false');
                dashboardTab.setAttribute('tabindex', '-1');
            }
            adminTab.classList.add('active');
            adminTab.setAttribute('aria-selected', 'true');
            adminTab.setAttribute('tabindex', '0');

            // Update section visibility
            if (jobsSection) {
                jobsSection.classList.add('hidden');
                jobsSection.setAttribute('aria-hidden', 'true');
            }
            if (dashboardSection) {
                dashboardSection.classList.add('hidden');
                dashboardSection.setAttribute('aria-hidden', 'true');
            }
            
            // Show only the adminSection
            adminSection.classList.remove('hidden');
            adminSection.setAttribute('aria-hidden', 'false');

            // Announce the change to screen readers
            this.announceTabChange('Admin panel view');

            // Refresh admin panel content when switched to (similar to dashboard refresh)
            this.refreshAdminPanel();
        }
    }

    /**
     * Refresh admin panel content
     */
    refreshAdminPanel() {
        // This method can be extended to refresh admin-specific content
        // For now, we'll just log that the admin panel was refreshed
        console.log('[Dashboard] Admin panel refreshed');
        
        // If there are admin-specific refresh methods, they can be called here
        // For example: this.updateAdminStats(), this.refreshAdminCharts(), etc.
    }

    /**
     * Announce tab change to screen readers
     * @param {string} tabName - Name of the tab being switched to
     */
    announceTabChange(tabName) {
        // Create or update a live region for announcements
        let announcementRegion = document.getElementById('tab-announcement');
        if (!announcementRegion) {
            announcementRegion = document.createElement('div');
            announcementRegion.id = 'tab-announcement';
            announcementRegion.setAttribute('aria-live', 'polite');
            announcementRegion.setAttribute('aria-atomic', 'true');
            announcementRegion.className = 'sr-only';
            document.body.appendChild(announcementRegion);
        }
        
        // Announce the tab change
        announcementRegion.textContent = `Switched to ${tabName}`;
        
        // Clear the announcement after a short delay
        setTimeout(() => {
            if (announcementRegion) {
                announcementRegion.textContent = '';
            }
        }, 1000);
    }

    /**
     * Handle keyboard navigation for tabs
     * @param {KeyboardEvent} e - Keyboard event
     * @param {Array} tabs - Array of tab elements
     * @param {number} currentIndex - Current tab index
     */
    handleTabKeydown(e, tabs, currentIndex) {
        const { key } = e;
        
        switch (key) {
            case 'ArrowRight':
            case 'ArrowDown':
                e.preventDefault();
                const nextIndex = (currentIndex + 1) % tabs.length;
                this.focusTab(tabs[nextIndex]);
                break;
                
            case 'ArrowLeft':
            case 'ArrowUp':
                e.preventDefault();
                const prevIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1;
                this.focusTab(tabs[prevIndex]);
                break;
                
            case 'Home':
                e.preventDefault();
                this.focusTab(tabs[0]);
                break;
                
            case 'End':
                e.preventDefault();
                this.focusTab(tabs[tabs.length - 1]);
                break;
                
            case 'Enter':
            case ' ':
                e.preventDefault();
                this.activateTab(tabs[currentIndex]);
                break;
        }
    }

    /**
     * Focus a tab and switch to its view
     * @param {HTMLElement} tab - Tab element to focus
     */
    focusTab(tab) {
        if (!tab) return;
        
        tab.focus();
        
        // Switch to the appropriate view based on tab ID
        switch (tab.id) {
            case 'jobsTab':
                this.switchToJobsView();
                break;
            case 'dashboardTab':
                this.switchToDashboardView();
                break;
            case 'adminTab':
                this.switchToAdminView();
                break;
        }
    }

    /**
     * Activate a tab (same as clicking it)
     * @param {HTMLElement} tab - Tab element to activate
     */
    activateTab(tab) {
        if (!tab) return;
        
        // Trigger click event
        tab.click();
    }

    /**
     * Initialize tab states with proper ARIA attributes
     */
    initializeTabStates() {
        const jobsTab = document.getElementById('jobsTab');
        const dashboardTab = document.getElementById('dashboardTab');
        const adminTab = document.getElementById('adminTab');
        
        // Set initial tabindex values
        if (jobsTab) {
            jobsTab.setAttribute('tabindex', '0');
        }
        if (dashboardTab) {
            dashboardTab.setAttribute('tabindex', '-1');
        }
        if (adminTab) {
            adminTab.setAttribute('tabindex', '-1');
        }
        
        // Set initial aria-hidden values for sections
        const jobsSection = document.querySelector('.main-content');
        const dashboardSection = document.getElementById('dashboardSection');
        const adminSection = document.getElementById('adminSection');
        
        if (jobsSection) {
            jobsSection.setAttribute('aria-hidden', 'false');
        }
        if (dashboardSection) {
            dashboardSection.setAttribute('aria-hidden', 'true');
        }
        if (adminSection) {
            adminSection.setAttribute('aria-hidden', 'true');
        }
    }

    /**
     * Refresh dashboard data and charts
     */
    refresh() {
        let jobs = [];
        
        // Get jobs from state manager if available, otherwise fallback to jobTracker
        if (this.stateManager) {
            jobs = this.stateManager.getStateSlice('jobs') || [];
        } else if (this.jobTracker && this.jobTracker.jobs) {
            jobs = this.jobTracker.jobs;
        } else {
            return;
        }

        // Update summary cards immediately (lightweight)
        this.updateSummaryCards(jobs);
        this.updateCompanyStatus(jobs);
        
        // Defer heavy operations to prevent blocking UI
        requestAnimationFrame(() => {
            // Break chart updates into smaller chunks to prevent blocking
            this.updateChartsInBatches(jobs);
        });
        
        // Defer installation analytics to next frame (heaviest operation)
        setTimeout(() => {
            this.updateInstallationAnalytics();
        }, 0);
    }

    /**
     * Update summary cards with current data
     */
    updateSummaryCards(jobs = []) {
        // Use provided jobs or fallback to jobTracker
        if (!jobs.length && this.jobTracker && this.jobTracker.jobs) {
            jobs = this.jobTracker.jobs;
        }

        // Total applications
        const totalElement = document.getElementById('totalApplications');
        if (totalElement) {
            totalElement.textContent = jobs.length;
        }

        // Top application source
        const topSource = this.calculateTopApplicationSource(jobs);
        const topSourceElement = document.getElementById('topSource');
        if (topSourceElement) {
            topSourceElement.textContent = topSource;
            topSourceElement.classList.add('text-metric');
        }

        // Active applications
        const activeJobs = jobs.filter(job =>
            !['Rejected', 'Withdrawn', 'Offer Received'].includes(job.status)
        ).length;
        const activeElement = document.getElementById('activeApplications');
        if (activeElement) {
            activeElement.textContent = activeJobs;
        }

        // Days since last application
        const daysSinceLastApp = this.calculateDaysSinceLastApplication(jobs);
        const avgResponseElement = document.getElementById('avgResponseTime');
        if (avgResponseElement) {
            avgResponseElement.textContent = daysSinceLastApp;
        }

        // Interview rate
        const interviewJobs = jobs.filter(job =>
            ['Interview Scheduled', 'Interview Completed'].includes(job.status)
        ).length;
        const interviewRate = jobs.length > 0 ? Math.round((interviewJobs / jobs.length) * 100) : 0;
        const interviewElement = document.getElementById('interviewRate');
        if (interviewElement) {
            interviewElement.textContent = `${interviewRate}%`;
        }

        // Average response days (mock calculation)
        const avgDaysElement = document.getElementById('avgResponseDays');
        if (avgDaysElement) {
            avgDaysElement.textContent = this.calculateAverageResponseDays(jobs);
        }

        // Application velocity (this month)
        const thisMonthApps = this.calculateThisMonthApplications(jobs);
        const velocityElement = document.getElementById('applicationVelocity');
        if (velocityElement) {
            velocityElement.textContent = thisMonthApps;
        }

        // Unique companies
        const uniqueCompanies = new Set(jobs.map(job => job.company.toLowerCase())).size;
        const companiesElement = document.getElementById('uniqueCompanies');
        if (companiesElement) {
            companiesElement.textContent = uniqueCompanies;
        }

        // Upcoming interviews (next 7 days)
        const now = Date.now();
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        const upcomingCount = jobs.filter(job => {
            if (!job.interviewDate) return false;
            const t = new Date(job.interviewDate).getTime();
            return !isNaN(t) && t >= now && t <= now + sevenDays;
        }).length;
        const upcomingEl = document.getElementById('upcomingInterviews');
        if (upcomingEl) upcomingEl.textContent = upcomingCount;
    }

    /**
     * Calculate days since last application
     */
    calculateDaysSinceLastApplication(jobs) {
        if (jobs.length === 0) return 0;

        const sortedJobs = jobs.sort((a, b) => new Date(b.dateApplied) - new Date(a.dateApplied));
        const lastAppDate = new Date(sortedJobs[0].dateApplied);
        const today = new Date();
        const diffTime = Math.abs(today - lastAppDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return diffDays;
    }

    /**
     * Calculate average response days (mock)
     */
    calculateAverageResponseDays(jobs) {
        // This is a simplified calculation
        const respondedJobs = jobs.filter(job => job.status !== 'Applied');
        return respondedJobs.length > 0 ? Math.round(Math.random() * 10 + 5) : 0;
    }

    /**
     * Calculate this month's applications
     */
    calculateThisMonthApplications(jobs) {
        const thisMonth = new Date().getMonth();
        const thisYear = new Date().getFullYear();

        return jobs.filter(job => {
            const jobDate = new Date(job.dateApplied);
            return jobDate.getMonth() === thisMonth && jobDate.getFullYear() === thisYear;
        }).length;
    }

    /**
     * Calculate top application source
     */
    calculateTopApplicationSource(jobs) {
        if (jobs.length === 0) return 'None';

        const sourceCounts = {};
        jobs.forEach(job => {
            const source = job.applicationSource || 'Unknown';
            sourceCounts[source] = (sourceCounts[source] || 0) + 1;
        });

        const topSource = Object.entries(sourceCounts)
            .sort(([, a], [, b]) => b - a)[0];

        return topSource ? topSource[0] : 'Unknown';
    }

    /**
     * Calculate source performance (interview rate by source)
     */
    calculateSourcePerformance(jobs) {
        const sourceStats = this.calculateSourceStats(jobs);
        const performance = {};

        Object.entries(sourceStats).forEach(([source, stats]) => {
            performance[source] = stats.total > 0 ?
                Math.round((stats.interviews / stats.total) * 100) : 0;
        });

        return performance;
    }

    /**
     * Calculate detailed source statistics
     */
    calculateSourceStats(jobs) {
        const sourceStats = {};

        jobs.forEach(job => {
            const source = job.applicationSource || 'Unknown';
            if (!sourceStats[source]) {
                sourceStats[source] = { total: 0, interviews: 0 };
            }

            sourceStats[source].total++;

            // Count interviews (scheduled or completed)
            if (['Interview Scheduled', 'Interview Completed', 'Offer Received'].includes(job.status)) {
                sourceStats[source].interviews++;
            }
        });

        return sourceStats;
    }

    /**
     * Update charts in batches to prevent blocking UI
     */
    updateChartsInBatches(jobs) {
        // Prevent multiple updates
        if (this.isUpdatingCharts) {
            return;
        }
        
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js not loaded');
            return;
        }
        
        // Check if dashboard section is visible before updating charts
        const dashboardSection = document.getElementById('dashboardSection');
        if (!dashboardSection || dashboardSection.classList.contains('hidden') || dashboardSection.offsetParent === null) {
            console.info('[Dashboard] Dashboard section not visible, rechecking next frame');
            requestAnimationFrame(() => this.updateChartsInBatches(jobs));
            return;
        }
        
        this.isUpdatingCharts = true;

        // Use existing queue system that works properly
        this.queueChartUpdate(() => this.updateStatusChart());
        this.queueChartUpdate(() => this.updateStageChart());
        this.queueChartUpdate(() => this.updateSourceChart());
        this.queueChartUpdate(() => this.updateSourcePerformanceChart());
        this.queueChartUpdate(() => this.updateTimelineChart());
        this.queueChartUpdate(() => this.updateSourceTimelineChart());
        this.queueChartUpdate(() => this.updateStageTimelineChart());
        this.queueChartUpdate(() => this.updateSubmissionRateChart());
        
        setTimeout(() => {
            this.isUpdatingCharts = false;
        }, 1000);
    }

    /**
     * Update charts
     */
    updateCharts() {
        // Prevent multiple simultaneous chart updates
        if (this.isUpdatingCharts) {
            return;
        }
        
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js not loaded');
            return;
        }
        
        this.isUpdatingCharts = true;

        // Queue all chart updates to prevent simultaneous creation
        this.queueChartUpdate(() => this.updateStatusChart());
        this.queueChartUpdate(() => this.updateStageChart());
        this.queueChartUpdate(() => this.updateSourceChart());
        this.queueChartUpdate(() => this.updateSourcePerformanceChart());
        this.queueChartUpdate(() => this.updateTimelineChart());
        this.queueChartUpdate(() => this.updateSourceTimelineChart());
        this.queueChartUpdate(() => this.updateStageTimelineChart());
        this.queueChartUpdate(() => this.updateSubmissionRateChart());
        
        // Reset the flag after a delay to allow for future updates
        setTimeout(() => {
            this.isUpdatingCharts = false;
        }, 1000);
    }

    /**
     * Update status chart
     */
    updateStatusChart() {
        const canvas = document.getElementById('statusChart');
        if (!canvas) {
            console.warn('[Dashboard] statusChart canvas not found');
            return;
        }
        
        // Check if canvas is actually visible/rendered
        if (!this.isElementVisible(canvas)) {
            console.info('[Dashboard] statusChart canvas not visible, deferring');
            this.runWhenVisibleRAF(canvas, () => this.queueChartUpdate(() => this.updateStatusChart()));
            return;
        }

        if (typeof Chart === 'undefined') {
            console.warn('[Dashboard] Chart.js not available for status chart');
            return;
        }

        const jobs = this.jobTracker.jobs || [];
        const statusCounts = {};

        jobs.forEach(job => {
            statusCounts[job.status] = (statusCounts[job.status] || 0) + 1;
        });

        // If chart exists, update data in place
        if (this.charts.statusChart) {
            this.charts.statusChart.data.labels = Object.keys(statusCounts);
            this.charts.statusChart.data.datasets[0].data = Object.values(statusCounts);
            this.charts.statusChart.update('none'); // 'none' = no animation for instant update
            return;
        }

        // Destroy any Chart.js instance on canvas before creating new one
        if (typeof Chart !== 'undefined' && Chart.getChart) {
            const existingChart = Chart.getChart(canvas);
            if (existingChart) {
                existingChart.destroy();
            }
        }

        // Only create if chart doesn't exist
        const ctx = canvas.getContext('2d');
        if (!ctx || !ctx.canvas) {
            console.info('[Dashboard] sourcePerformanceChart context unavailable, deferring');
            this.runWhenVisibleRAF(canvas, () => this.queueChartUpdate(() => this.updateSourcePerformanceChart()));
            return;
        }
        if (!ctx || !ctx.canvas) {
            console.info('[Dashboard] statusChart context unavailable, deferring');
            this.runWhenVisibleRAF(canvas, () => this.queueChartUpdate(() => this.updateStatusChart()));
            return;
        }
        const totalJobs = jobs.length;

        // Create new chart
        try {
            this.charts.statusChart = new Chart(canvas, {
            type: 'doughnut',
            data: {
                labels: Object.keys(statusCounts),
                datasets: [{
                    data: Object.values(statusCounts),
                    backgroundColor: [
                        '#3b82f6', '#10b981', '#f59e0b',
                        '#ef4444', '#8b5cf6', '#6b7280'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            generateLabels: function (chart) {
                                const data = chart.data;
                                if (data.labels.length && data.datasets.length) {
                                    return data.labels.map((label, i) => {
                                        const count = data.datasets[0].data[i];
                                        const percentage = totalJobs > 0 ? Math.round((count / totalJobs) * 100) : 0;
                                        return {
                                            text: `${label} (${count} - ${percentage}%)`,
                                            fillStyle: data.datasets[0].backgroundColor[i],
                                            strokeStyle: data.datasets[0].backgroundColor[i],
                                            lineWidth: 0,
                                            hidden: false,
                                            index: i
                                        };
                                    });
                                }
                                return [];
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const label = context.label || '';
                                const count = context.parsed;
                                const percentage = totalJobs > 0 ? Math.round((count / totalJobs) * 100) : 0;
                                return `${label}: ${count} jobs (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
        } catch (error) {
            console.error('[Dashboard] Error creating status chart:', error);
            this.charts.statusChart = null;
        }
    }

    /**
     * Update stage chart
     */
    updateStageChart() {
        const canvas = document.getElementById('stageChart');
        if (!canvas) {
            console.warn('[Dashboard] stageChart canvas not found');
            return;
        }
        
        // Check if canvas is actually visible/rendered
        if (!this.isElementVisible(canvas)) {
            console.info('[Dashboard] stageChart canvas not visible, deferring');
            this.runWhenVisibleRAF(canvas, () => this.queueChartUpdate(() => this.updateStageChart()));
            return;
        }

        if (typeof Chart === 'undefined') {
            console.warn('[Dashboard] Chart.js not available for stage chart');
            return;
        }

        const jobs = this.jobTracker.jobs || [];
        const stageCounts = {};

        jobs.forEach(job => {
            if (job.stage) {
                stageCounts[job.stage] = (stageCounts[job.stage] || 0) + 1;
            }
        });

        // If chart exists, update data in place
        if (this.charts.stageChart) {
            this.charts.stageChart.data.labels = Object.keys(stageCounts);
            this.charts.stageChart.data.datasets[0].data = Object.values(stageCounts);
            this.charts.stageChart.update('none');
            return;
        }

        // Destroy any Chart.js instance on canvas before creating new one
        if (typeof Chart !== 'undefined' && Chart.getChart) {
            const existingChart = Chart.getChart(canvas);
            if (existingChart) {
                existingChart.destroy();
            }
        }

        // Only create if chart doesn't exist
        const ctx = canvas.getContext('2d');
        if (!ctx || !ctx.canvas) {
            console.info('[Dashboard] timelineChart context unavailable, deferring');
            this.runWhenVisibleRAF(canvas, () => this.queueChartUpdate(() => this.updateTimelineChart()));
            return;
        }
        if (!ctx || !ctx.canvas) {
            console.info('[Dashboard] stageChart context unavailable, deferring');
            this.runWhenVisibleRAF(canvas, () => this.queueChartUpdate(() => this.updateStageChart()));
            return;
        }
        const totalStageJobs = Object.values(stageCounts).reduce((sum, count) => sum + count, 0);

        // Create new chart
        try {
            this.charts.stageChart = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: Object.keys(stageCounts),
                datasets: [{
                    label: 'Applications',
                    data: Object.values(stageCounts),
                    backgroundColor: '#3b82f6'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const count = context.parsed.y;
                                const percentage = totalStageJobs > 0 ? Math.round((count / totalStageJobs) * 100) : 0;
                                return `${context.dataset.label}: ${count} jobs (${percentage}%)`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
        } catch (error) {
            console.error('[Dashboard] Error creating stage chart:', error);
            this.charts.stageChart = null;
        }
    }

    /**
     * Update application source chart
     */
    updateSourceChart() {
        const canvas = document.getElementById('sourceChart');
        if (!canvas) {
            console.warn('[Dashboard] sourceChart canvas not found');
            return;
        }
        
        // Check if canvas is actually visible/rendered
        if (!this.isElementVisible(canvas)) {
            console.info('[Dashboard] sourceChart canvas not visible, deferring');
            this.runWhenVisibleRAF(canvas, () => this.queueChartUpdate(() => this.updateSourceChart()));
            return;
        }

        if (typeof Chart === 'undefined') {
            console.warn('[Dashboard] Chart.js not available for source chart');
            return;
        }

        const jobs = this.jobTracker.jobs || [];
        const sourceCounts = {};

        jobs.forEach(job => {
            const source = job.applicationSource || 'Unknown';
            sourceCounts[source] = (sourceCounts[source] || 0) + 1;
        });

        // If chart exists, update data in place
        if (this.charts.sourceChart) {
            this.charts.sourceChart.data.labels = Object.keys(sourceCounts);
            this.charts.sourceChart.data.datasets[0].data = Object.values(sourceCounts);
            this.charts.sourceChart.update('none');
            return;
        }

        // Destroy any Chart.js instance on canvas before creating new one
        if (typeof Chart !== 'undefined' && Chart.getChart) {
            const existingChart = Chart.getChart(canvas);
            if (existingChart) {
                existingChart.destroy();
            }
        }

        // Only create if chart doesn't exist
        const ctx = canvas.getContext('2d');
        if (!ctx || !ctx.canvas) {
            console.info('[Dashboard] sourceTimelineChart context unavailable, deferring');
            this.runWhenVisibleRAF(canvas, () => this.queueChartUpdate(() => this.updateSourceTimelineChart()));
            return;
        }
        if (!ctx || !ctx.canvas) {
            console.info('[Dashboard] sourceChart context unavailable, deferring');
            this.runWhenVisibleRAF(canvas, () => this.queueChartUpdate(() => this.updateSourceChart()));
            return;
        }
        const totalSourceJobs = jobs.length;

        // Create new chart
        try {
            this.charts.sourceChart = new Chart(canvas, {
            type: 'doughnut',
            data: {
                labels: Object.keys(sourceCounts),
                datasets: [{
                    data: Object.values(sourceCounts),
                    backgroundColor: [
                        '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
                        '#8b5cf6', '#6b7280', '#06b6d4', '#84cc16',
                        '#f97316', '#ec4899'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            generateLabels: function (chart) {
                                const data = chart.data;
                                if (data.labels.length && data.datasets.length) {
                                    return data.labels.map((label, i) => {
                                        const count = data.datasets[0].data[i];
                                        const percentage = totalSourceJobs > 0 ? Math.round((count / totalSourceJobs) * 100) : 0;
                                        return {
                                            text: `${label} (${count} - ${percentage}%)`,
                                            fillStyle: data.datasets[0].backgroundColor[i],
                                            strokeStyle: data.datasets[0].backgroundColor[i],
                                            lineWidth: 0,
                                            hidden: false,
                                            index: i
                                        };
                                    });
                                }
                                return [];
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const label = context.label || '';
                                const count = context.parsed;
                                const percentage = totalSourceJobs > 0 ? Math.round((count / totalSourceJobs) * 100) : 0;
                                return `${label}: ${count} jobs (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
        } catch (error) {
            console.error('[Dashboard] Error creating source chart:', error);
            this.charts.sourceChart = null;
        }
    }

    /**
     * Update source performance chart
     */
    updateSourcePerformanceChart() {
        const canvas = document.getElementById('sourcePerformanceChart');
        if (!canvas) return;

        if (typeof Chart === 'undefined') {
            console.warn('[Dashboard] Chart.js not available for source performance chart');
            return;
        }

        const jobs = this.jobTracker.jobs || [];
        const sourcePerformance = this.calculateSourcePerformance(jobs);

        // If chart exists, update data in place
        if (this.charts.sourcePerformanceChart) {
            this.charts.sourcePerformanceChart.data.labels = Object.keys(sourcePerformance);
            this.charts.sourcePerformanceChart.data.datasets[0].data = Object.values(sourcePerformance);
            this.charts.sourcePerformanceChart.update('none');
            return;
        }

        // Destroy any Chart.js instance on canvas before creating new one
        if (typeof Chart !== 'undefined' && Chart.getChart) {
            const existingChart = Chart.getChart(canvas);
            if (existingChart) {
                existingChart.destroy();
            }
        }

        // Only create if chart doesn't exist
        const ctx = canvas.getContext('2d');
        if (!ctx || !ctx.canvas) {
            console.info('[Dashboard] stageTimelineChart context unavailable, deferring');
            this.runWhenVisibleRAF(canvas, () => this.queueChartUpdate(() => this.updateStageTimelineChart()));
            return;
        }
        const sourceStats = this.calculateSourceStats(jobs);

        // Create new chart with error handling
        try {
            this.charts.sourcePerformanceChart = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: Object.keys(sourcePerformance),
                datasets: [{
                    label: 'Interview Rate (%)',
                    data: Object.values(sourcePerformance),
                    backgroundColor: '#3b82f6'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const source = context.label;
                                const percentage = context.parsed.y;
                                const stats = sourceStats[source];
                                if (stats) {
                                    return [
                                        `Interview Rate: ${percentage}%`,
                                        `Interviews: ${stats.interviews}`,
                                        `Total Applications: ${stats.total}`
                                    ];
                                }
                                return `Interview Rate: ${percentage}%`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function (value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
        } catch (error) {
            console.error('[Dashboard] Error creating source performance chart:', error);
            this.charts.sourcePerformanceChart = null;
        }
    }

    /**
     * Update timeline chart
     */
    updateTimelineChart() {
        const canvas = document.getElementById('timelineChart');
        if (!canvas) return;

        const jobs = this.jobTracker.jobs || [];
        const monthlyData = {};

        jobs.forEach(job => {
            const date = new Date(job.dateApplied);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
        });

        // Sort by date
        const sortedMonths = Object.keys(monthlyData).sort();
        const labels = sortedMonths.map(month => {
            const [year, monthNum] = month.split('-');
            const date = new Date(year, monthNum - 1);
            return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        });
        const data = sortedMonths.map(month => monthlyData[month]);

        // If chart exists, update data in place
        if (this.charts.timelineChart) {
            this.charts.timelineChart.data.labels = labels;
            this.charts.timelineChart.data.datasets[0].data = data;
            this.charts.timelineChart.update('none');
            return;
        }

        // Destroy any Chart.js instance on canvas before creating new one
        if (typeof Chart !== 'undefined' && Chart.getChart) {
            const existingChart = Chart.getChart(canvas);
            if (existingChart) {
                existingChart.destroy();
            }
        }

        // Only create if chart doesn't exist
        const ctx = canvas.getContext('2d');
        if (!ctx || !ctx.canvas) {
            console.info('[Dashboard] submissionRateChart context unavailable, deferring');
            this.runWhenVisibleRAF(canvas, () => this.queueChartUpdate(() => this.updateSubmissionRateChart()));
            return;
        }

        // Create new chart with error handling
        try {
            this.charts.timelineChart = new Chart(canvas, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Applications',
                    data: data,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const count = context.parsed.y;
                                const month = context.label;
                                return `${month}: ${count} application${count !== 1 ? 's' : ''}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
        } catch (error) {
            console.error('[Dashboard] Error creating timeline chart:', error);
            this.charts.timelineChart = null;
        }
    }

    /**
     * Update company status section
     */
    updateCompanyStatus() {
        const container = document.getElementById('companyStatusList');
        if (!container) return;

        const jobs = this.jobTracker.jobs || [];
        const activeJobs = jobs.filter(job =>
            !['Rejected', 'Withdrawn', 'Offer Received'].includes(job.status)
        );

        if (activeJobs.length === 0) {
            container.innerHTML = '<p class="no-active-applications">No active applications</p>';
            return;
        }

        const companyGroups = {};
        activeJobs.forEach(job => {
            if (!companyGroups[job.company]) {
                companyGroups[job.company] = [];
            }
            companyGroups[job.company].push(job);
        });

        const html = Object.entries(companyGroups).map(([company, companyJobs]) => {
            const jobsHtml = companyJobs.map(job => `
                <div class="company-job">
                    <span class="job-title">${this.escapeHtml(job.title)}</span>
                    <span class="job-status ${this.getStatusClass(job.status)}">${this.escapeHtml(job.status)}</span>
                </div>
            `).join('');

            return `
                <div class="company-status-item">
                    <div class="company-name">${this.escapeHtml(company)}</div>
                    <div class="company-jobs">
                        ${jobsHtml}
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = html;
    }

    /**
     * Get CSS class for job status
     */
    getStatusClass(status) {
        const statusMap = {
            'Applied': 'status-applied',
            'Interview Scheduled': 'status-interview-scheduled',
            'Interview Completed': 'status-interview-completed',
            'Offer Received': 'status-offer-received',
            'Rejected': 'status-rejected',
            'Withdrawn': 'status-withdrawn'
        };
        return statusMap[status] || 'status-applied';
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Update source timeline chart - shows top sources over time
     */
    updateSourceTimelineChart() {
        const canvas = document.getElementById('sourceTimelineChart');
        if (!canvas) return;

        if (typeof Chart === 'undefined') {
            console.warn('[Dashboard] Chart.js not available for source timeline chart');
            return;
        }

        const jobs = this.jobTracker.jobs || [];
        const monthlySourceData = this.calculateMonthlySourceData(jobs);

        // Get top 3 sources for the legend
        const allSources = {};
        jobs.forEach(job => {
            const source = job.applicationSource || 'Unknown';
            allSources[source] = (allSources[source] || 0) + 1;
        });

        const topSources = Object.entries(allSources)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([source]) => source);

        const datasets = topSources.map((source, index) => ({
            label: source,
            data: monthlySourceData.months.map(month => monthlySourceData.sources[source]?.[month] || 0),
            borderColor: ['#3b82f6', '#10b981', '#f59e0b'][index],
            backgroundColor: ['rgba(59, 130, 246, 0.1)', 'rgba(16, 185, 129, 0.1)', 'rgba(245, 158, 11, 0.1)'][index],
            fill: false,
            tension: 0.4
        }));

        // If chart exists, update data in place
        if (this.charts.sourceTimelineChart) {
            this.charts.sourceTimelineChart.data.labels = monthlySourceData.labels;
            this.charts.sourceTimelineChart.data.datasets = datasets;
            this.charts.sourceTimelineChart.update('none');
            return;
        }

        // Destroy any Chart.js instance on canvas before creating new one
        if (typeof Chart !== 'undefined' && Chart.getChart) {
            const existingChart = Chart.getChart(canvas);
            if (existingChart) {
                existingChart.destroy();
            }
        }

        // Only create if chart doesn't exist
        const ctx = canvas.getContext('2d');

        // Create new chart with error handling
        try {
            this.charts.sourceTimelineChart = new Chart(canvas, {
            type: 'line',
            data: {
                labels: monthlySourceData.labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const count = context.parsed.y;
                                const source = context.dataset.label;
                                return `${source}: ${count} application${count !== 1 ? 's' : ''}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
        } catch (error) {
            console.error('[Dashboard] Error creating source timeline chart:', error);
            this.charts.sourceTimelineChart = null;
        }
    }

    /**
     * Update stage timeline chart - shows stage distribution over time
     */
    updateStageTimelineChart() {
        const canvas = document.getElementById('stageTimelineChart');
        if (!canvas) return;

        if (typeof Chart === 'undefined') {
            console.warn('[Dashboard] Chart.js not available for stage timeline chart');
            return;
        }

        const jobs = this.jobTracker.jobs || [];
        const monthlyStageData = this.calculateMonthlyStageData(jobs);

        // Get top 3 stages for the legend
        const allStages = {};
        jobs.forEach(job => {
            if (job.stage) {
                allStages[job.stage] = (allStages[job.stage] || 0) + 1;
            }
        });

        const topStages = Object.entries(allStages)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([stage]) => stage);

        const datasets = topStages.map((stage, index) => ({
            label: stage,
            data: monthlyStageData.months.map(month => monthlyStageData.stages[stage]?.[month] || 0),
            borderColor: ['#8b5cf6', '#06b6d4', '#84cc16'][index],
            backgroundColor: ['rgba(139, 92, 246, 0.1)', 'rgba(6, 182, 212, 0.1)', 'rgba(132, 204, 22, 0.1)'][index],
            fill: false,
            tension: 0.4
        }));

        // If chart exists, update data in place
        if (this.charts.stageTimelineChart) {
            this.charts.stageTimelineChart.data.labels = monthlyStageData.labels;
            this.charts.stageTimelineChart.data.datasets = datasets;
            this.charts.stageTimelineChart.update('none');
            return;
        }

        // Destroy any Chart.js instance on canvas before creating new one
        if (typeof Chart !== 'undefined' && Chart.getChart) {
            const existingChart = Chart.getChart(canvas);
            if (existingChart) {
                existingChart.destroy();
            }
        }

        // Only create if chart doesn't exist
        const ctx = canvas.getContext('2d');

        // Create new chart with error handling
        try {
            this.charts.stageTimelineChart = new Chart(canvas, {
            type: 'line',
            data: {
                labels: monthlyStageData.labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const count = context.parsed.y;
                                const stage = context.dataset.label;
                                return `${stage}: ${count} application${count !== 1 ? 's' : ''}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
        } catch (error) {
            console.error('[Dashboard] Error creating stage timeline chart:', error);
            this.charts.stageTimelineChart = null;
        }
    }

    /**
     * Update submission rate chart - shows applications per week/month
     */
    updateSubmissionRateChart() {
        const canvas = document.getElementById('submissionRateChart');
        if (!canvas) return;

        if (typeof Chart === 'undefined') {
            console.warn('[Dashboard] Chart.js not available for submission rate chart');
            return;
        }

        const jobs = this.jobTracker.jobs || [];
        const submissionRateData = this.calculateSubmissionRateData(jobs);

        // If chart exists, update data in place
        if (this.charts.submissionRateChart) {
            this.charts.submissionRateChart.data.labels = submissionRateData.labels;
            this.charts.submissionRateChart.data.datasets[0].data = submissionRateData.weeklyData;
            this.charts.submissionRateChart.update('none');
            return;
        }

        // Destroy any Chart.js instance on canvas before creating new one
        if (typeof Chart !== 'undefined' && Chart.getChart) {
            const existingChart = Chart.getChart(canvas);
            if (existingChart) {
                existingChart.destroy();
            }
        }

        // Only create if chart doesn't exist
        const ctx = canvas.getContext('2d');

        // Create new chart with error handling
        try {
            this.charts.submissionRateChart = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: submissionRateData.labels,
                datasets: [{
                    label: 'Applications per Week',
                    data: submissionRateData.weeklyData,
                    backgroundColor: 'rgba(59, 130, 246, 0.6)',
                    borderColor: '#3b82f6',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const count = context.parsed.y;
                                const week = context.label;
                                return `${week}: ${count} application${count !== 1 ? 's' : ''} submitted`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
        } catch (error) {
            console.error('[Dashboard] Error creating submission rate chart:', error);
            this.charts.submissionRateChart = null;
        }
    }

    /**
     * Calculate monthly source data for timeline chart
     */
    calculateMonthlySourceData(jobs) {
        const monthlyData = {};
        const sourceData = {};

        jobs.forEach(job => {
            const date = new Date(job.dateApplied);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const source = job.applicationSource || 'Unknown';

            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = 0;
            }
            if (!sourceData[source]) {
                sourceData[source] = {};
            }
            if (!sourceData[source][monthKey]) {
                sourceData[source][monthKey] = 0;
            }

            monthlyData[monthKey]++;
            sourceData[source][monthKey]++;
        });

        const sortedMonths = Object.keys(monthlyData).sort();
        const labels = sortedMonths.map(month => {
            const [year, monthNum] = month.split('-');
            const date = new Date(year, monthNum - 1);
            return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        });

        return {
            months: sortedMonths,
            labels: labels,
            sources: sourceData
        };
    }

    /**
     * Calculate monthly stage data for timeline chart
     */
    calculateMonthlyStageData(jobs) {
        const monthlyData = {};
        const stageData = {};

        jobs.forEach(job => {
            if (job.stage) {
                const date = new Date(job.dateApplied);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                const stage = job.stage;

                if (!monthlyData[monthKey]) {
                    monthlyData[monthKey] = 0;
                }
                if (!stageData[stage]) {
                    stageData[stage] = {};
                }
                if (!stageData[stage][monthKey]) {
                    stageData[stage][monthKey] = 0;
                }

                monthlyData[monthKey]++;
                stageData[stage][monthKey]++;
            }
        });

        const sortedMonths = Object.keys(monthlyData).sort();
        const labels = sortedMonths.map(month => {
            const [year, monthNum] = month.split('-');
            const date = new Date(year, monthNum - 1);
            return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        });

        return {
            months: sortedMonths,
            labels: labels,
            stages: stageData
        };
    }

    /**
     * Calculate submission rate data (weekly applications)
     */
    calculateSubmissionRateData(jobs) {
        const weeklyData = {};

        jobs.forEach(job => {
            const date = new Date(job.dateApplied);
            // Get the start of the week (Sunday)
            const startOfWeek = new Date(date);
            startOfWeek.setDate(date.getDate() - date.getDay());
            const weekKey = startOfWeek.toISOString().split('T')[0];

            if (!weeklyData[weekKey]) {
                weeklyData[weekKey] = 0;
            }
            weeklyData[weekKey]++;
        });

        const sortedWeeks = Object.keys(weeklyData).sort();
        const labels = sortedWeeks.map(week => {
            const date = new Date(week);
            return `Week of ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
        });
        const data = sortedWeeks.map(week => weeklyData[week]);

        return {
            labels: labels,
            weeklyData: data
        };
    }

    /**
     * Update installation analytics section
     */
    updateInstallationAnalytics() {
        // Check if installation analytics section exists
        const installSection = document.querySelector('.installation-analytics-section');
        if (!installSection) {
            console.log('[Dashboard] Installation analytics section not found in DOM');
            return;
        }

        // Initialize InstallAnalytics if not available
        if (!window.InstallAnalytics) {
            console.warn('[Dashboard] InstallAnalytics not available');
            this.showInstallationAnalyticsError('InstallAnalytics class not loaded');
            return;
        }

        try {
            // Use cached analytics if available and recent (within 5 seconds)
            const now = Date.now();
            if (!this.cachedInstallAnalytics || (now - this.lastAnalyticsUpdate) > 5000) {
                this.cachedInstallAnalytics = new window.InstallAnalytics();
                this.lastAnalyticsUpdate = now;
            }
            
            const metrics = this.cachedInstallAnalytics.getInstallMetrics();

            this.updateInstallationSummaryCards(metrics);
            this.updateInstallationCharts(metrics);
            
            console.log('[Dashboard] Installation analytics updated successfully');
        } catch (error) {
            console.error('[Dashboard] Error updating installation analytics:', error);
            this.showInstallationAnalyticsError(error.message);
        }
    }

    /**
     * Show error message in installation analytics section
     * @param {string} message - Error message
     */
    showInstallationAnalyticsError(message) {
        const totalPromptsElement = document.getElementById('totalInstallPrompts');
        if (totalPromptsElement) {
            totalPromptsElement.textContent = 'Error';
            totalPromptsElement.style.color = '#ef4444';
        }

        console.error('[Dashboard] Installation analytics error:', message);
    }

    /**
     * Update installation summary cards
     * @param {Object} metrics - Installation metrics
     */
    updateInstallationSummaryCards(metrics) {
        // Total prompts
        const totalPromptsElement = document.getElementById('totalInstallPrompts');
        if (totalPromptsElement) {
            totalPromptsElement.textContent = metrics.summary.totalPrompts;
        }

        // Install clicks
        const installClicksElement = document.getElementById('installClicks');
        if (installClicksElement) {
            installClicksElement.textContent = metrics.summary.installClicks;
        }

        // Conversion rate
        const conversionRateElement = document.getElementById('conversionRate');
        if (conversionRateElement) {
            conversionRateElement.textContent = `${metrics.summary.conversionRate.toFixed(1)}%`;
        }

        // Install success
        const installSuccessElement = document.getElementById('installSuccess');
        if (installSuccessElement) {
            installSuccessElement.textContent = metrics.summary.installSuccess ? 'Yes' : 'No';
            installSuccessElement.style.color = metrics.summary.installSuccess ? '#10b981' : '#ef4444';
        }
    }

    /**
     * Update installation charts
     * @param {Object} metrics - Installation metrics
     */
    updateInstallationCharts(metrics) {
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js not loaded');
            return;
        }

        this.updateInstallFunnelChart(metrics);
        this.updatePlatformBreakdownChart(metrics);
        this.updateBrowserBreakdownChart(metrics);
        this.updateInstallTimelineChart(metrics);
    }

    /**
     * Update installation funnel chart
     * @param {Object} metrics - Installation metrics
     */
    updateInstallFunnelChart(metrics) {
        const canvas = document.getElementById('installFunnelChart');
        if (!canvas) return;

        // Destroy existing chart
        if (this.charts.installFunnelChart) {
            this.charts.installFunnelChart.destroy();
        }

        // Also destroy any Chart.js instance on canvas
        if (typeof Chart !== 'undefined' && Chart.getChart) {
            const existingChart = Chart.getChart(canvas);
            if (existingChart) {
                existingChart.destroy();
            }
        }

        const ctx = canvas.getContext('2d');

        const funnelData = [
            { label: 'Prompts Shown', value: metrics.funnel.promptsShown },
            { label: 'Install Clicks', value: metrics.funnel.installClicks },
            { label: 'Install Success', value: metrics.funnel.installSuccess }
        ];

        if (!canvas.isConnected || !this.isElementVisible(canvas)) {
            console.info('[Dashboard] installFunnelChart not ready for binding, deferring');
            this.runWhenVisibleRAF(canvas, () => this.updateInstallFunnelChart(metrics));
            return;
        }
        this.charts.installFunnelChart = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: funnelData.map(item => item.label),
                datasets: [{
                    label: 'Count',
                    data: funnelData.map(item => item.value),
                    backgroundColor: ['#3b82f6', '#10b981', '#f59e0b']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed.y;
                                const total = metrics.funnel.promptsShown;
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return `${context.label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    /**
     * Update platform breakdown chart
     * @param {Object} metrics - Installation metrics
     */
    updatePlatformBreakdownChart(metrics) {
        const canvas = document.getElementById('platformBreakdownChart');
        if (!canvas) return;

        // Destroy existing chart
        if (this.charts.platformBreakdownChart) {
            this.charts.platformBreakdownChart.destroy();
        }

        // Also destroy any Chart.js instance on canvas
        if (typeof Chart !== 'undefined' && Chart.getChart) {
            const existingChart = Chart.getChart(canvas);
            if (existingChart) {
                existingChart.destroy();
            }
        }

        const ctx = canvas.getContext('2d');

        const platforms = Object.keys(metrics.platformBreakdown.platforms);
        const promptCounts = platforms.map(platform => 
            metrics.platformBreakdown.platforms[platform].prompts
        );

        if (platforms.length === 0) {
            // Show empty state
            this.charts.platformBreakdownChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['No Data'],
                    datasets: [{
                        data: [1],
                        backgroundColor: ['#6b7280']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
            return;
        }

        if (!canvas.isConnected || !this.isElementVisible(canvas)) {
            console.info('[Dashboard] platformBreakdownChart not ready for binding, deferring');
            this.runWhenVisibleRAF(canvas, () => this.updatePlatformBreakdownChart(metrics));
            return;
        }
        this.charts.platformBreakdownChart = new Chart(canvas, {
            type: 'doughnut',
            data: {
                labels: platforms,
                datasets: [{
                    data: promptCounts,
                    backgroundColor: [
                        '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
                        '#8b5cf6', '#6b7280', '#06b6d4', '#84cc16'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const platform = context.label;
                                const prompts = context.parsed;
                                const installs = metrics.platformBreakdown.platforms[platform].installs;
                                return `${platform}: ${prompts} prompts, ${installs} installs`;
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Update browser breakdown chart
     * @param {Object} metrics - Installation metrics
     */
    updateBrowserBreakdownChart(metrics) {
        const canvas = document.getElementById('browserBreakdownChart');
        if (!canvas) return;

        // Destroy existing chart
        if (this.charts.browserBreakdownChart) {
            this.charts.browserBreakdownChart.destroy();
        }

        // Also destroy any Chart.js instance on canvas
        if (typeof Chart !== 'undefined' && Chart.getChart) {
            const existingChart = Chart.getChart(canvas);
            if (existingChart) {
                existingChart.destroy();
            }
        }

        const ctx = canvas.getContext('2d');

        const browsers = Object.keys(metrics.platformBreakdown.browsers);
        const promptCounts = browsers.map(browser => 
            metrics.platformBreakdown.browsers[browser].prompts
        );

        if (browsers.length === 0) {
            // Show empty state
            this.charts.browserBreakdownChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['No Data'],
                    datasets: [{
                        data: [1],
                        backgroundColor: ['#6b7280']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
            return;
        }

        if (!canvas.isConnected || !this.isElementVisible(canvas)) {
            console.info('[Dashboard] browserBreakdownChart not ready for binding, deferring');
            this.runWhenVisibleRAF(canvas, () => this.updateBrowserBreakdownChart(metrics));
            return;
        }
        this.charts.browserBreakdownChart = new Chart(canvas, {
            type: 'doughnut',
            data: {
                labels: browsers,
                datasets: [{
                    data: promptCounts,
                    backgroundColor: [
                        '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
                        '#8b5cf6', '#6b7280', '#06b6d4', '#84cc16'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const browser = context.label;
                                const prompts = context.parsed;
                                const installs = metrics.platformBreakdown.browsers[browser].installs;
                                return `${browser}: ${prompts} prompts, ${installs} installs`;
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Update installation timeline chart
     * @param {Object} metrics - Installation metrics
     */
    updateInstallTimelineChart(metrics) {
        const canvas = document.getElementById('installTimelineChart');
        if (!canvas) return;

        // Destroy existing chart
        if (this.charts.installTimelineChart) {
            this.charts.installTimelineChart.destroy();
        }

        // Also destroy any Chart.js instance on canvas
        if (typeof Chart !== 'undefined' && Chart.getChart) {
            const existingChart = Chart.getChart(canvas);
            if (existingChart) {
                existingChart.destroy();
            }
        }

        const ctx = canvas.getContext('2d');

        const timelineData = metrics.timelineData;

        if (timelineData.length === 0) {
            // Show empty state
            this.charts.installTimelineChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: ['No Data'],
                    datasets: [{
                        label: 'No Events',
                        data: [0],
                        borderColor: '#6b7280',
                        backgroundColor: 'rgba(107, 114, 128, 0.1)'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });
            return;
        }

        const labels = timelineData.map(item => {
            const date = new Date(item.date);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });

        if (!canvas.isConnected || !this.isElementVisible(canvas)) {
            console.info('[Dashboard] installTimelineChart not ready for binding, deferring');
            this.runWhenVisibleRAF(canvas, () => this.updateInstallTimelineChart(metrics));
            return;
        }
        this.charts.installTimelineChart = new Chart(canvas, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Prompts',
                        data: timelineData.map(item => item.prompts),
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        fill: false,
                        tension: 0.4
                    },
                    {
                        label: 'Installs',
                        data: timelineData.map(item => item.installs),
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        fill: false,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed.y;
                                const label = context.dataset.label;
                                return `${label}: ${value}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    /**
     * Export installation analytics data
     */
    exportInstallationAnalytics() {
        if (!window.InstallAnalytics) {
            console.warn('[Dashboard] InstallAnalytics not available');
            if (window.notifications) {
                window.notifications.show('Installation analytics not available', 'error');
            }
            return;
        }

        try {
            const analytics = new window.InstallAnalytics();
            
            // Create export modal or dropdown
            const exportOptions = [
                { label: 'JSON Format', format: 'json' },
                { label: 'CSV Format', format: 'csv' },
                { label: 'Summary Report', format: 'summary' }
            ];

            // Simple prompt for format selection
            const formatChoice = prompt(
                'Choose export format:\n1. JSON\n2. CSV\n3. Summary Report\n\nEnter 1, 2, or 3:'
            );

            if (!formatChoice || formatChoice === 'null') {
                return; // User cancelled
            }

            let format = 'json';
            let fileExtension = 'json';
            let mimeType = 'application/json';

            if (formatChoice === '2') {
                format = 'csv';
                fileExtension = 'csv';
                mimeType = 'text/csv';
            } else if (formatChoice === '3') {
                format = 'summary';
                fileExtension = 'txt';
                mimeType = 'text/plain';
            }

            const exportData = analytics.exportAnalytics(format);
            
            if (!exportData || exportData.trim() === '') {
                if (window.notifications) {
                    window.notifications.show('No installation analytics data to export', 'warning');
                }
                return;
            }
            
            // Create download
            const blob = new Blob([exportData], { type: mimeType });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `installation-analytics-${new Date().toISOString().split('T')[0]}.${fileExtension}`;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            // Show success notification
            if (window.notifications) {
                window.notifications.show(`Installation analytics exported as ${format.toUpperCase()}!`, 'success');
            }
            
            console.log('[Dashboard] Installation analytics exported successfully');
        } catch (error) {
            console.error('[Dashboard] Error exporting installation analytics:', error);
            if (window.notifications) {
                window.notifications.show('Error exporting installation analytics', 'error');
            }
        }
    }

    /**
     * Reset installation analytics data
     */
    resetInstallationAnalytics() {
        if (!window.InstallAnalytics) {
            console.warn('[Dashboard] InstallAnalytics not available');
            return;
        }

        const confirmed = confirm(
            'Are you sure you want to reset all installation analytics data? This action cannot be undone.'
        );

        if (confirmed) {
            try {
                const analytics = new window.InstallAnalytics();
                analytics.resetAnalytics();
                
                // Refresh the analytics display
                this.updateInstallationAnalytics();

                // Show success notification
                if (window.notifications) {
                    window.notifications.show('Installation analytics reset successfully!', 'success');
                }
            } catch (error) {
                console.error('[Dashboard] Error resetting installation analytics:', error);
                if (window.notifications) {
                    window.notifications.show('Error resetting installation analytics', 'error');
                }
            }
        }
    }

    /**
     * Sync upcoming interviews to calendar
     */
    syncUpcomingInterviewsToCalendar() {
        if (!window.calendarIntegration) {
            NotificationManager.show('Calendar integration not available', 'error');
            return;
        }

        try {
            const jobs = this.jobTracker.jobs;
            const now = Date.now();
            const sevenDays = 7 * 24 * 60 * 60 * 1000;
            
            // Find upcoming interviews
            const upcomingInterviews = jobs.filter(job => {
                if (!job.interviewDate) return false;
                const interviewTime = new Date(job.interviewDate).getTime();
                return !isNaN(interviewTime) && interviewTime >= now && interviewTime <= now + sevenDays;
            });

            if (upcomingInterviews.length === 0) {
                NotificationManager.show('No upcoming interviews found in the next 7 days', 'info');
                return;
            }

            // Sync each upcoming interview
            let syncedCount = 0;
            upcomingInterviews.forEach(job => {
                if (window.calendarIntegration.settings.enabled) {
                    window.calendarIntegration.syncJobToCalendar(job);
                    syncedCount++;
                }
            });

            if (syncedCount > 0) {
                NotificationManager.show(`Synced ${syncedCount} upcoming interviews to calendar`, 'success');
            } else {
                NotificationManager.show('Calendar integration is disabled. Enable it in Settings > Calendar', 'warning');
            }

        } catch (error) {
            console.error('[Dashboard] Error syncing upcoming interviews:', error);
            NotificationManager.show('Failed to sync upcoming interviews to calendar', 'error');
        }
    }

    /**
     * Cleanup method to unsubscribe from state manager
     */
    cleanup() {
        this.unsubscribers.forEach(unsubscribe => {
            try {
                unsubscribe();
            } catch (error) {
                console.warn('[Dashboard] Error during cleanup:', error);
            }
        });
        this.unsubscribers = [];
    }
}