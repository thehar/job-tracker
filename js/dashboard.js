/**
 * Dashboard Manager
 * Handles analytics dashboard, charts, and data visualization
 */
class Dashboard {
    constructor(jobTracker) {
        this.jobTracker = jobTracker;
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
        this.init();
    }

    /**
     * Initialize dashboard
     */
    init() {
        this.setupEventListeners();
        this.setupTabSwitching();
        this.refresh();
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

            // Refresh dashboard when switching to it
            this.refresh();
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
        if (!this.jobTracker || !this.jobTracker.jobs) {
            return;
        }

        this.updateSummaryCards();
        this.updateCharts();
        this.updateCompanyStatus();
        this.updateInstallationAnalytics();
    }

    /**
     * Update summary cards with current data
     */
    updateSummaryCards() {
        const jobs = this.jobTracker.jobs || [];

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
     * Update charts
     */
    updateCharts() {
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js not loaded');
            return;
        }

        this.updateStatusChart();
        this.updateStageChart();
        this.updateSourceChart();
        this.updateSourcePerformanceChart();
        this.updateTimelineChart();

        // Update new timeline trend charts
        this.updateSourceTimelineChart();
        this.updateStageTimelineChart();
        this.updateSubmissionRateChart();
    }

    /**
     * Update status chart
     */
    updateStatusChart() {
        const canvas = document.getElementById('statusChart');
        if (!canvas) return;

        const jobs = this.jobTracker.jobs || [];
        const statusCounts = {};

        jobs.forEach(job => {
            statusCounts[job.status] = (statusCounts[job.status] || 0) + 1;
        });

        const ctx = canvas.getContext('2d');

        // Destroy existing chart
        if (this.charts.statusChart) {
            this.charts.statusChart.destroy();
        }

        const totalJobs = jobs.length;

        this.charts.statusChart = new Chart(ctx, {
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
    }

    /**
     * Update stage chart
     */
    updateStageChart() {
        const canvas = document.getElementById('stageChart');
        if (!canvas) return;

        const jobs = this.jobTracker.jobs || [];
        const stageCounts = {};

        jobs.forEach(job => {
            if (job.stage) {
                stageCounts[job.stage] = (stageCounts[job.stage] || 0) + 1;
            }
        });

        const ctx = canvas.getContext('2d');

        // Destroy existing chart
        if (this.charts.stageChart) {
            this.charts.stageChart.destroy();
        }

        const totalStageJobs = Object.values(stageCounts).reduce((sum, count) => sum + count, 0);

        this.charts.stageChart = new Chart(ctx, {
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
    }

    /**
     * Update application source chart
     */
    updateSourceChart() {
        const canvas = document.getElementById('sourceChart');
        if (!canvas) return;

        const jobs = this.jobTracker.jobs || [];
        const sourceCounts = {};

        jobs.forEach(job => {
            const source = job.applicationSource || 'Unknown';
            sourceCounts[source] = (sourceCounts[source] || 0) + 1;
        });

        const ctx = canvas.getContext('2d');

        // Destroy existing chart
        if (this.charts.sourceChart) {
            this.charts.sourceChart.destroy();
        }

        const totalSourceJobs = jobs.length;

        this.charts.sourceChart = new Chart(ctx, {
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
    }

    /**
     * Update source performance chart
     */
    updateSourcePerformanceChart() {
        const canvas = document.getElementById('sourcePerformanceChart');
        if (!canvas) return;

        const jobs = this.jobTracker.jobs || [];
        const sourcePerformance = this.calculateSourcePerformance(jobs);

        const ctx = canvas.getContext('2d');

        // Destroy existing chart
        if (this.charts.sourcePerformanceChart) {
            this.charts.sourcePerformanceChart.destroy();
        }

        // Calculate source stats for enhanced tooltips
        const sourceStats = this.calculateSourceStats(jobs);

        this.charts.sourcePerformanceChart = new Chart(ctx, {
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

        const ctx = canvas.getContext('2d');

        // Destroy existing chart
        if (this.charts.timelineChart) {
            this.charts.timelineChart.destroy();
        }

        this.charts.timelineChart = new Chart(ctx, {
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

        const jobs = this.jobTracker.jobs || [];
        const monthlySourceData = this.calculateMonthlySourceData(jobs);

        const ctx = canvas.getContext('2d');

        // Destroy existing chart
        if (this.charts.sourceTimelineChart) {
            this.charts.sourceTimelineChart.destroy();
        }

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

        this.charts.sourceTimelineChart = new Chart(ctx, {
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
    }

    /**
     * Update stage timeline chart - shows stage distribution over time
     */
    updateStageTimelineChart() {
        const canvas = document.getElementById('stageTimelineChart');
        if (!canvas) return;

        const jobs = this.jobTracker.jobs || [];
        const monthlyStageData = this.calculateMonthlyStageData(jobs);

        const ctx = canvas.getContext('2d');

        // Destroy existing chart
        if (this.charts.stageTimelineChart) {
            this.charts.stageTimelineChart.destroy();
        }

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

        this.charts.stageTimelineChart = new Chart(ctx, {
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
    }

    /**
     * Update submission rate chart - shows applications per week/month
     */
    updateSubmissionRateChart() {
        const canvas = document.getElementById('submissionRateChart');
        if (!canvas) return;

        const jobs = this.jobTracker.jobs || [];
        const submissionRateData = this.calculateSubmissionRateData(jobs);

        const ctx = canvas.getContext('2d');

        // Destroy existing chart
        if (this.charts.submissionRateChart) {
            this.charts.submissionRateChart.destroy();
        }

        this.charts.submissionRateChart = new Chart(ctx, {
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
            const analytics = new window.InstallAnalytics();
            const metrics = analytics.getInstallMetrics();

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

        const ctx = canvas.getContext('2d');

        // Destroy existing chart
        if (this.charts.installFunnelChart) {
            this.charts.installFunnelChart.destroy();
        }

        const funnelData = [
            { label: 'Prompts Shown', value: metrics.funnel.promptsShown },
            { label: 'Install Clicks', value: metrics.funnel.installClicks },
            { label: 'Install Success', value: metrics.funnel.installSuccess }
        ];

        this.charts.installFunnelChart = new Chart(ctx, {
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

        const ctx = canvas.getContext('2d');

        // Destroy existing chart
        if (this.charts.platformBreakdownChart) {
            this.charts.platformBreakdownChart.destroy();
        }

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

        this.charts.platformBreakdownChart = new Chart(ctx, {
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

        const ctx = canvas.getContext('2d');

        // Destroy existing chart
        if (this.charts.browserBreakdownChart) {
            this.charts.browserBreakdownChart.destroy();
        }

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

        this.charts.browserBreakdownChart = new Chart(ctx, {
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

        const ctx = canvas.getContext('2d');

        // Destroy existing chart
        if (this.charts.installTimelineChart) {
            this.charts.installTimelineChart.destroy();
        }

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

        this.charts.installTimelineChart = new Chart(ctx, {
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
}