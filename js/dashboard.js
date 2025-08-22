/**
 * Dashboard Analytics Manager
 * Handles dashboard visualization, charts, and analytics
 */
class Dashboard {
    constructor(jobTracker) {
        this.jobTracker = jobTracker;
        this.charts = {};
        this.currentView = 'jobs';
        this.setupEventListeners();
    }

    /**
     * Setup dashboard event listeners
     */
    setupEventListeners() {
        // Tab navigation
        document.getElementById('jobsTab').addEventListener('click', () => {
            this.switchToView('jobs');
        });

        document.getElementById('dashboardTab').addEventListener('click', () => {
            this.switchToView('dashboard');
        });
    }

    /**
     * Switch between jobs and dashboard views
     * @param {string} view - View to switch to ('jobs' or 'dashboard')
     */
    switchToView(view) {
        this.currentView = view;
        
        // Update tab states
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        if (view === 'jobs') {
            document.getElementById('jobsTab').classList.add('active');
            document.querySelector('.main-content').classList.remove('hidden');
            document.getElementById('dashboardSection').classList.add('hidden');
        } else {
            document.getElementById('dashboardTab').classList.add('active');
            document.querySelector('.main-content').classList.add('hidden');
            document.getElementById('dashboardSection').classList.remove('hidden');
            this.updateDashboard();
        }
    }

    /**
     * Update all dashboard components
     */
    updateDashboard() {
        const jobs = this.jobTracker.jobs;
        
        if (jobs.length === 0) {
            this.showEmptyState();
            return;
        }

        this.updateSummaryCards(jobs);
        this.updateCharts(jobs);
    }

    /**
     * Show empty state when no jobs exist
     */
    showEmptyState() {
        const dashboardGrid = document.querySelector('.dashboard-grid');
        dashboardGrid.innerHTML = `
            <div class="dashboard-empty">
                <h3>No Data Available</h3>
                <p>Add some job applications to see analytics and insights</p>
                <button class="btn btn-primary" onclick="window.dashboard.switchToView('jobs')">
                    Add Your First Job
                </button>
            </div>
        `;
    }

    /**
     * Update summary cards with current statistics
     * @param {Array} jobs - Array of job objects
     */
    updateSummaryCards(jobs) {
        // Total applications
        document.getElementById('totalApplications').textContent = jobs.length;

        // Success rate (offers received / total applications)
        const successfulJobs = jobs.filter(job => job.status === 'Offer Received').length;
        const successRate = jobs.length > 0 ? Math.round((successfulJobs / jobs.length) * 100) : 0;
        document.getElementById('successRate').textContent = `${successRate}%`;

        // Active applications (not rejected or withdrawn)
        const activeJobs = jobs.filter(job => 
            !['Rejected', 'Withdrawn', 'Offer Received'].includes(job.status)
        ).length;
        document.getElementById('activeApplications').textContent = activeJobs;

        // Days since last application
        if (jobs.length > 0) {
            const sortedJobs = jobs.sort((a, b) => new Date(b.dateApplied) - new Date(a.dateApplied));
            const lastApplied = new Date(sortedJobs[0].dateApplied);
            const today = new Date();
            const daysSince = Math.floor((today - lastApplied) / (1000 * 60 * 60 * 24));
            document.getElementById('avgResponseTime').textContent = daysSince;
        } else {
            document.getElementById('avgResponseTime').textContent = '0';
        }
    }

    /**
     * Update all charts
     * @param {Array} jobs - Array of job objects
     */
    updateCharts(jobs) {
        this.createStatusChart(jobs);
        this.createStageChart(jobs);
        this.createTimelineChart(jobs);
        this.createSuccessChart(jobs);
        this.updateCompanyStatus(jobs);
    }

    /**
     * Create or update status distribution chart
     * @param {Array} jobs - Array of job objects
     */
    createStatusChart(jobs) {
        const statusCounts = this.getStatusCounts(jobs);
        const ctx = document.getElementById('statusChart').getContext('2d');
        
        if (this.charts.status) {
            this.charts.status.destroy();
        }

        this.charts.status = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(statusCounts),
                datasets: [{
                    data: Object.values(statusCounts),
                    backgroundColor: [
                        '#3b82f6', '#f59e0b', '#10b981', 
                        '#06b6d4', '#ef4444', '#8b5cf6'
                    ],
                    borderWidth: 2,
                    borderColor: '#1e293b'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#e8f4fd',
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                }
            }
        });
    }

    /**
     * Create or update stage distribution chart
     * @param {Array} jobs - Array of job objects
     */
    createStageChart(jobs) {
        const stageCounts = this.getStageCounts(jobs);
        const ctx = document.getElementById('stageChart').getContext('2d');
        
        if (this.charts.stage) {
            this.charts.stage.destroy();
        }

        // Handle empty data
        const labels = Object.keys(stageCounts);
        const data = Object.values(stageCounts);
        
        if (labels.length === 0) {
            this.createPlaceholderChart(ctx, 'stage', 'bar');
            return;
        }

        this.charts.stage = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Applications',
                    data: data,
                    backgroundColor: '#3b82f6',
                    borderColor: '#1e40af',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#94a3b8' },
                        grid: { color: '#334155' }
                    },
                    x: {
                        ticks: { color: '#94a3b8' },
                        grid: { color: '#334155' }
                    }
                }
            }
        });
    }

    /**
     * Create or update timeline chart
     * @param {Array} jobs - Array of job objects
     */
    createTimelineChart(jobs) {
        const timelineData = this.getTimelineData(jobs);
        const ctx = document.getElementById('timelineChart').getContext('2d');
        
        if (this.charts.timeline) {
            this.charts.timeline.destroy();
        }

        // Handle empty data
        if (timelineData.labels.length === 0) {
            this.createPlaceholderChart(ctx, 'timeline', 'line');
            return;
        }

        this.charts.timeline = new Chart(ctx, {
            type: 'line',
            data: {
                labels: timelineData.labels,
                datasets: [{
                    label: 'Applications',
                    data: timelineData.data,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: '#e8f4fd' }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#94a3b8' },
                        grid: { color: '#334155' }
                    },
                    x: {
                        ticks: { color: '#94a3b8' },
                        grid: { color: '#334155' }
                    }
                }
            }
        });
    }

    /**
     * Create or update success vs rejection chart
     * @param {Array} jobs - Array of job objects
     */
    createSuccessChart(jobs) {
        const successData = this.getSuccessData(jobs);
        const ctx = document.getElementById('successChart').getContext('2d');
        
        if (this.charts.success) {
            this.charts.success.destroy();
        }

        this.charts.success = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Success', 'Rejected', 'In Progress'],
                datasets: [{
                    data: [successData.success, successData.rejected, successData.inProgress],
                    backgroundColor: ['#10b981', '#ef4444', '#f59e0b'],
                    borderWidth: 2,
                    borderColor: '#1e293b'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#e8f4fd',
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                }
            }
        });
    }

    /**
     * Create placeholder chart for empty data
     * @param {Object} ctx - Chart context
     * @param {string} type - Chart type identifier
     * @param {string} chartType - Chart.js chart type
     */
    createPlaceholderChart(ctx, type, chartType) {
        this.charts[type] = new Chart(ctx, {
            type: chartType,
            data: {
                labels: ['No Data'],
                datasets: [{
                    label: 'Applications',
                    data: [0],
                    backgroundColor: '#475569',
                    borderColor: '#334155',
                    borderWidth: chartType === 'line' ? 2 : 1,
                    ...(chartType === 'line' && {
                        fill: true,
                        tension: 0.4
                    })
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 1,
                        ticks: { color: '#94a3b8' },
                        grid: { color: '#334155' }
                    },
                    x: {
                        ticks: { color: '#94a3b8' },
                        grid: { color: '#334155' }
                    }
                }
            }
        });
    }

    /**
     * Get status counts for all defined statuses
     * @param {Array} jobs - Array of job objects
     * @returns {Object} Status counts object
     */
    getStatusCounts(jobs) {
        const counts = {};
        const validStatuses = window.settingsManager ? window.settingsManager.statuses : [
            'Applied', 'Interview Scheduled', 'Interview Completed', 'Offer Received', 'Rejected', 'Withdrawn'
        ];
        
        // Initialize counts for all valid statuses
        validStatuses.forEach(status => {
            counts[status] = 0;
        });
        
        // Count actual job statuses
        jobs.forEach(job => {
            if (counts.hasOwnProperty(job.status)) {
                counts[job.status]++;
            }
        });
        
        return counts;
    }

    /**
     * Get stage counts for all defined stages
     * @param {Array} jobs - Array of job objects
     * @returns {Object} Stage counts object
     */
    getStageCounts(jobs) {
        const counts = {};
        const validStages = window.settingsManager ? window.settingsManager.stages : [
            'Application Submitted', 'Phone Screen', 'Technical Interview', 'Onsite Interview', 'Final Round', 'Negotiation'
        ];
        
        // Initialize counts for all valid stages
        validStages.forEach(stage => {
            counts[stage] = 0;
        });
        
        // Count actual job stages
        jobs.forEach(job => {
            if (job.stage && counts.hasOwnProperty(job.stage)) {
                counts[job.stage]++;
            }
        });
        
        return counts;
    }

    /**
     * Get timeline data grouped by month
     * @param {Array} jobs - Array of job objects
     * @returns {Object} Timeline data with labels and values
     */
    getTimelineData(jobs) {
        // Group jobs by month
        const monthCounts = {};
        jobs.forEach(job => {
            const date = new Date(job.dateApplied);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
        });

        // Sort by month and create labels
        const sortedMonths = Object.keys(monthCounts).sort();
        const labels = sortedMonths.map(month => {
            const [year, monthNum] = month.split('-');
            const date = new Date(year, monthNum - 1);
            return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        });
        const data = sortedMonths.map(month => monthCounts[month]);

        return { labels, data };
    }

    /**
     * Get success metrics data
     * @param {Array} jobs - Array of job objects
     * @returns {Object} Success metrics
     */
    getSuccessData(jobs) {
        const success = jobs.filter(job => job.status === 'Offer Received').length;
        const rejected = jobs.filter(job => job.status === 'Rejected').length;
        const inProgress = jobs.filter(job => 
            !['Offer Received', 'Rejected', 'Withdrawn'].includes(job.status)
        ).length;

        return { success, rejected, inProgress };
    }

    /**
     * Update company status section
     * @param {Array} jobs - Array of job objects
     */
    updateCompanyStatus(jobs) {
        const companyStatusList = document.getElementById('companyStatusList');
        
        if (!companyStatusList) {
            return;
        }
        
        // Filter for active companies (not rejected or withdrawn)
        const activeJobs = jobs.filter(job => 
            !['Rejected', 'Withdrawn'].includes(job.status)
        );
        
        if (activeJobs.length === 0) {
            companyStatusList.innerHTML = `
                <div class="company-status-empty">
                    <p>No active applications at the moment.</p>
                </div>
            `;
            return;
        }
        
        // Group by company and get the most recent status for each
        const companyMap = new Map();
        activeJobs.forEach(job => {
            const companyKey = job.company.toLowerCase();
            if (!companyMap.has(companyKey) || 
                new Date(job.dateApplied) > new Date(companyMap.get(companyKey).dateApplied)) {
                companyMap.set(companyKey, job);
            }
        });
        
        // Convert to array and sort by most recent application
        const companyStatuses = Array.from(companyMap.values())
            .sort((a, b) => new Date(b.dateApplied) - new Date(a.dateApplied));
        
        // Render company status items
        companyStatusList.innerHTML = companyStatuses.map(job => {
            const daysAgo = DataManager.calculateDaysBetween(job.dateApplied);
            const statusClass = this.getCompanyStatusClass(job.status);
            
            return `
                <div class="company-status-item">
                    <div class="company-name">${DataManager.escapeHtml(job.company)}</div>
                    <div class="company-details">
                        <div class="job-title">${DataManager.escapeHtml(job.title)}</div>
                        <div class="company-status-badge ${statusClass}">${DataManager.escapeHtml(job.status)}</div>
                    </div>
                    <div class="company-meta">
                        <span>Applied ${daysAgo} days ago</span>
                        ${job.stage ? `<span>Stage: ${DataManager.escapeHtml(job.stage)}</span>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Get CSS class for company status badge
     * @param {string} status - Job status
     * @returns {string} CSS class name
     */
    getCompanyStatusClass(status) {
        const statusMap = {
            'Applied': 'applied',
            'Interview Scheduled': 'interview-scheduled',
            'Interview Completed': 'interview-completed',
            'Offer Received': 'offer-received'
        };
        return statusMap[status] || 'applied';
    }

    /**
     * Refresh dashboard if currently viewing dashboard
     */
    refresh() {
        if (this.currentView === 'dashboard') {
            this.updateDashboard();
        }
    }
}
