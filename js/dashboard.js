/**
 * Dashboard Manager
 * Handles analytics dashboard, charts, and data visualization
 */
class Dashboard {
    constructor(jobTracker) {
        this.jobTracker = jobTracker;
        this.charts = {};
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
    }

    /**
     * Setup tab switching between Jobs and Dashboard
     */
    setupTabSwitching() {
        const jobsTab = document.getElementById('jobsTab');
        const dashboardTab = document.getElementById('dashboardTab');
        const jobsSection = document.querySelector('.main-content');
        const dashboardSection = document.getElementById('dashboardSection');

        if (jobsTab && dashboardTab && jobsSection && dashboardSection) {
            jobsTab.addEventListener('click', () => {
                this.switchToJobsView();
            });

            dashboardTab.addEventListener('click', () => {
                this.switchToDashboardView();
            });
        }
    }

    /**
     * Switch to jobs view
     */
    switchToJobsView() {
        const jobsTab = document.getElementById('jobsTab');
        const dashboardTab = document.getElementById('dashboardTab');
        const jobsSection = document.querySelector('.main-content');
        const dashboardSection = document.getElementById('dashboardSection');

        if (jobsTab && dashboardTab && jobsSection && dashboardSection) {
            jobsTab.classList.add('active');
            dashboardTab.classList.remove('active');
            jobsSection.classList.remove('hidden');
            dashboardSection.classList.add('hidden');
        }
    }

    /**
     * Switch to dashboard view
     */
    switchToDashboardView() {
        const jobsTab = document.getElementById('jobsTab');
        const dashboardTab = document.getElementById('dashboardTab');
        const jobsSection = document.querySelector('.main-content');
        const dashboardSection = document.getElementById('dashboardSection');

        if (jobsTab && dashboardTab && jobsSection && dashboardSection) {
            jobsTab.classList.remove('active');
            dashboardTab.classList.add('active');
            jobsSection.classList.add('hidden');
            dashboardSection.classList.remove('hidden');

            // Refresh dashboard when switching to it
            this.refresh();
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
}