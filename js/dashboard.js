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

        // Success rate
        const successfulJobs = jobs.filter(job => job.status === 'Offer Received').length;
        const successRate = jobs.length > 0 ? Math.round((successfulJobs / jobs.length) * 100) : 0;
        const successElement = document.getElementById('successRate');
        if (successElement) {
            successElement.textContent = `${successRate}%`;
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
     * Update charts
     */
    updateCharts() {
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js not loaded');
            return;
        }

        this.updateStatusChart();
        this.updateStageChart();
        this.updateSuccessChart();
        this.updateTimelineChart();
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
                        position: 'bottom'
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
     * Update success chart
     */
    updateSuccessChart() {
        const canvas = document.getElementById('successChart');
        if (!canvas) return;

        const jobs = this.jobTracker.jobs || [];
        const successfulJobs = jobs.filter(job => job.status === 'Offer Received').length;
        const rejectedJobs = jobs.filter(job => job.status === 'Rejected').length;
        const pendingJobs = jobs.length - successfulJobs - rejectedJobs;

        const ctx = canvas.getContext('2d');
        
        // Destroy existing chart
        if (this.charts.successChart) {
            this.charts.successChart.destroy();
        }

        this.charts.successChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Success', 'Rejected', 'Pending'],
                datasets: [{
                    data: [successfulJobs, rejectedJobs, pendingJobs],
                    backgroundColor: ['#10b981', '#ef4444', '#f59e0b']
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
}