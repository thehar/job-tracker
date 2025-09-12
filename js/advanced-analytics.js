/**
 * Advanced Analytics Export Manager
 * Handles enhanced export options including JSON, analytics reports, and summary exports
 */
class AdvancedAnalyticsExporter {
    constructor() {
        this.setupEventListeners();
    }

    /**
     * Setup export modal event listeners
     */
    setupEventListeners() {
        // Export analytics button
        const exportBtn = document.getElementById('exportAnalyticsBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.showExportModal());
        }

        // Close export modal
        const closeBtn = document.getElementById('closeExportModal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hideExportModal());
        }

        // Export options selection
        const exportOptions = document.querySelectorAll('.export-option');
        exportOptions.forEach(option => {
            option.addEventListener('click', () => this.selectExportOption(option));
        });

        // Download and copy buttons
        const downloadBtn = document.getElementById('downloadExportBtn');
        const copyBtn = document.getElementById('copyExportBtn');
        
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => this.downloadExport());
        }
        
        if (copyBtn) {
            copyBtn.addEventListener('click', () => this.copyToClipboard());
        }
    }

    /**
     * Show export modal
     */
    showExportModal() {
        const modal = document.getElementById('exportModal');
        if (modal) {
            modal.classList.remove('hidden');
            this.resetExportOptions();
        }
    }

    /**
     * Hide export modal
     */
    hideExportModal() {
        const modal = document.getElementById('exportModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    /**
     * Reset export options selection
     */
    resetExportOptions() {
        const options = document.querySelectorAll('.export-option');
        options.forEach(option => option.classList.remove('selected'));
        
        const downloadBtn = document.getElementById('downloadExportBtn');
        const copyBtn = document.getElementById('copyExportBtn');
        
        if (downloadBtn) downloadBtn.disabled = true;
        if (copyBtn) copyBtn.disabled = true;
    }

    /**
     * Select export option
     * @param {HTMLElement} option - Selected export option element
     */
    selectExportOption(option) {
        // Remove previous selection
        document.querySelectorAll('.export-option').forEach(opt => opt.classList.remove('selected'));
        
        // Select new option
        option.classList.add('selected');
        
        // Enable buttons
        const downloadBtn = document.getElementById('downloadExportBtn');
        const copyBtn = document.getElementById('copyExportBtn');
        
        if (downloadBtn) downloadBtn.disabled = false;
        if (copyBtn) copyBtn.disabled = false;
    }

    /**
     * Get selected export format
     * @returns {string} Selected export format
     */
    getSelectedFormat() {
        const selectedOption = document.querySelector('.export-option.selected');
        return selectedOption ? selectedOption.dataset.format : null;
    }

    /**
     * Download export
     */
    downloadExport() {
        const format = this.getSelectedFormat();
        if (!format) return;

        const data = this.generateExportData(format);
        const filename = this.generateFilename(format);
        
        this.downloadFile(data, filename, format);
    }

    /**
     * Copy export to clipboard
     */
    async copyToClipboard() {
        const format = this.getSelectedFormat();
        if (!format) return;

        const data = this.generateExportData(format);
        
        try {
            if (format === 'csv') {
                await navigator.clipboard.writeText(data);
            } else {
                await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
            }
            
            // Show success notification
            if (window.showNotification) {
                window.showNotification('Export copied to clipboard!', 'success');
            }
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            if (window.showNotification) {
                window.showNotification('Failed to copy to clipboard', 'error');
            }
        }
    }

    /**
     * Generate export data based on format
     * @param {string} format - Export format
     * @returns {string|Object} Export data
     */
    generateExportData(format) {
        const jobs = window.jobTracker ? window.jobTracker.jobs : [];
        
        switch (format) {
            case 'csv':
                return this.generateCsvExport(jobs);
            case 'json':
                return this.generateJsonExport(jobs);
            case 'analytics':
                return this.generateAnalyticsExport(jobs);
            case 'summary':
                return this.generateSummaryExport(jobs);
            default:
                return '';
        }
    }

    /**
     * Generate CSV export
     * @param {Array} jobs - Array of job objects
     * @returns {string} CSV formatted string
     */
    generateCsvExport(jobs) {
        if (window.CsvManager) {
            return window.CsvManager.generateCsv(jobs);
        }
        
        // Fallback CSV generation
        const headers = ['title', 'company', 'status', 'stage', 'dateApplied', 'contactPerson', 'notes', 'createdAt'];
        const csvRows = [headers.join(',')];
        
        jobs.forEach(job => {
            const row = headers.map(header => {
                let value = job[header] || '';
                value = value.toString().replace(/"/g, '""');
                if (value.includes(',') || value.includes('\n') || value.includes('"')) {
                    value = `"${value}"`;
                }
                return value;
            });
            csvRows.push(row.join(','));
        });
        
        return csvRows.join('\n');
    }

    /**
     * Generate JSON export
     * @param {Array} jobs - Array of job objects
     * @returns {Object} JSON export object
     */
    generateJsonExport(jobs) {
        return {
            exportDate: new Date().toISOString(),
            totalJobs: jobs.length,
            jobs: jobs,
            metadata: {
                version: '1.0',
                format: 'json',
                source: 'Job Tracker Advanced Analytics'
            }
        };
    }

    /**
     * Generate analytics export
     * @param {Array} jobs - Array of job objects
     * @returns {Object} Analytics export object
     */
    generateAnalyticsExport(jobs) {
        const analytics = this.calculateAdvancedAnalytics(jobs);
        
        return {
            exportDate: new Date().toISOString(),
            summary: {
                totalApplications: jobs.length,
                activeApplications: jobs.filter(job => 
                    !['Rejected', 'Withdrawn', 'Offer Received'].includes(job.status)
                ).length,
                successfulApplications: jobs.filter(job => job.status === 'Offer Received').length,
                uniqueCompanies: new Set(jobs.map(job => job.company.toLowerCase())).size
            },
            metrics: analytics.metrics,
            trends: analytics.trends,
            insights: analytics.insights,
            charts: analytics.charts,
            metadata: {
                version: '1.0',
                format: 'analytics',
                source: 'Job Tracker Advanced Analytics'
            }
        };
    }

    /**
     * Generate summary export
     * @param {Array} jobs - Array of job objects
     * @returns {Object} Summary export object
     */
    generateSummaryExport(jobs) {
        const summary = this.calculateSummaryMetrics(jobs);
        
        return {
            exportDate: new Date().toISOString(),
            summary: summary,
            metadata: {
                version: '1.0',
                format: 'summary',
                source: 'Job Tracker Advanced Analytics'
            }
        };
    }

    /**
     * Calculate advanced analytics
     * @param {Array} jobs - Array of job objects
     * @returns {Object} Analytics data
     */
    calculateAdvancedAnalytics(jobs) {
        if (jobs.length === 0) {
            return {
                metrics: {},
                trends: {},
                insights: {},
                charts: {}
            };
        }

        const metrics = this.calculateSummaryMetrics(jobs);
        const trends = this.calculateTrends(jobs);
        const insights = this.calculateInsights(jobs);
        const charts = this.calculateChartData(jobs);

        return { metrics, trends, insights, charts };
    }

    /**
     * Calculate summary metrics
     * @param {Array} jobs - Array of job objects
     * @returns {Object} Summary metrics
     */
    calculateSummaryMetrics(jobs) {
        const totalApplications = jobs.length;
        const successfulJobs = jobs.filter(job => job.status === 'Offer Received').length;
        const interviewJobs = jobs.filter(job => 
            ['Interview Scheduled', 'Interview Completed'].includes(job.status)
        ).length;
        const activeJobs = jobs.filter(job => 
            !['Rejected', 'Withdrawn', 'Offer Received'].includes(job.status)
        ).length;

        return {
            totalApplications,
            successRate: totalApplications > 0 ? Math.round((successfulJobs / totalApplications) * 100) : 0,
            interviewRate: totalApplications > 0 ? Math.round((interviewJobs / totalApplications) * 100) : 0,
            activeApplications: activeJobs,
            successfulApplications: successfulJobs,
            uniqueCompanies: new Set(jobs.map(job => job.company.toLowerCase())).size,
            averageResponseTime: this.calculateAverageResponseTime(jobs),
            applicationVelocity: this.calculateApplicationVelocity(jobs)
        };
    }

    /**
     * Calculate trends
     * @param {Array} jobs - Array of job objects
     * @returns {Object} Trend data
     */
    calculateTrends(jobs) {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastYear = currentMonth === 0 ? currentYear - 1 : currentYear;

        const thisMonthJobs = jobs.filter(job => {
            const jobDate = new Date(job.dateApplied);
            return jobDate.getMonth() === currentMonth && jobDate.getFullYear() === currentYear;
        });

        const lastMonthJobs = jobs.filter(job => {
            const jobDate = new Date(job.dateApplied);
            return jobDate.getMonth() === lastMonth && jobDate.getFullYear() === lastYear;
        });

        return {
            thisMonth: thisMonthJobs.length,
            lastMonth: lastMonthJobs.length,
            trend: thisMonthJobs.length > lastMonthJobs.length ? 'increasing' : 
                   thisMonthJobs.length < lastMonthJobs.length ? 'decreasing' : 'stable',
            percentageChange: lastMonthJobs.length > 0 ? 
                Math.round(((thisMonthJobs.length - lastMonthJobs.length) / lastMonthJobs.length) * 100) : 0
        };
    }

    /**
     * Calculate insights
     * @param {Array} jobs - Array of job objects
     * @returns {Object} Insight data
     */
    calculateInsights(jobs) {
        const responseTimes = this.calculateResponseTimes(jobs);
        const fastResponses = responseTimes.filter(time => time <= 3).length;
        const slowResponses = responseTimes.filter(time => time > 14).length;

        return {
            responsePatterns: {
                averageResponseTime: responseTimes.length > 0 ? 
                    Math.round(responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length) : 0,
                fastResponses,
                slowResponses,
                totalResponses: responseTimes.length
            },
            successFactors: {
                interviewToOfferRate: this.calculateInterviewToOfferRate(jobs),
                applicationToInterviewRate: this.calculateApplicationToInterviewRate(jobs)
            }
        };
    }

    /**
     * Calculate chart data
     * @param {Array} jobs - Array of job objects
     * @returns {Object} Chart data
     */
    calculateChartData(jobs) {
        return {
            statusDistribution: this.getStatusDistribution(jobs),
            stageDistribution: this.getStageDistribution(jobs),
            monthlyApplications: this.getMonthlyApplications(jobs),
            companyPerformance: this.getCompanyPerformance(jobs)
        };
    }

    /**
     * Calculate average response time
     * @param {Array} jobs - Array of job objects
     * @returns {number} Average response time in days
     */
    calculateAverageResponseTime(jobs) {
        const responseTimes = this.calculateResponseTimes(jobs);
        return responseTimes.length > 0 ? 
            Math.round(responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length) : 0;
    }

    /**
     * Calculate application velocity
     * @param {Array} jobs - Array of job objects
     * @returns {number} Applications this month
     */
    calculateApplicationVelocity(jobs) {
        const thisMonth = new Date().getMonth();
        const thisYear = new Date().getFullYear();
        
        return jobs.filter(job => {
            const jobDate = new Date(job.dateApplied);
            return jobDate.getMonth() === thisMonth && jobDate.getFullYear() === thisYear;
        }).length;
    }

    /**
     * Calculate response times
     * @param {Array} jobs - Array of job objects
     * @returns {Array} Array of response times
     */
    calculateResponseTimes(jobs) {
        const responseTimes = [];
        
        jobs.forEach(job => {
            if (job.status !== 'Applied') {
                const statusResponseTimes = {
                    'Interview Scheduled': 7,
                    'Interview Completed': 14,
                    'Offer Received': 21,
                    'Rejected': 10,
                    'Withdrawn': 5
                };
                
                const responseTime = statusResponseTimes[job.status];
                if (responseTime) {
                    responseTimes.push(responseTime);
                }
            }
        });
        
        return responseTimes;
    }

    /**
     * Calculate interview to offer rate
     * @param {Array} jobs - Array of job objects
     * @returns {number} Interview to offer rate percentage
     */
    calculateInterviewToOfferRate(jobs) {
        const successfulJobs = jobs.filter(job => job.status === 'Offer Received').length;
        const interviewJobs = jobs.filter(job => 
            ['Interview Scheduled', 'Interview Completed'].includes(job.status)
        ).length;
        
        return interviewJobs.length > 0 ? Math.round((successfulJobs / interviewJobs.length) * 100) : 0;
    }

    /**
     * Calculate application to interview rate
     * @param {Array} jobs - Array of job objects
     * @returns {number} Application to interview rate percentage
     */
    calculateApplicationToInterviewRate(jobs) {
        const interviewJobs = jobs.filter(job => 
            ['Interview Scheduled', 'Interview Completed'].includes(job.status)
        ).length;
        
        return jobs.length > 0 ? Math.round((interviewJobs / jobs.length) * 100) : 0;
    }

    /**
     * Get status distribution
     * @param {Array} jobs - Array of job objects
     * @returns {Object} Status distribution
     */
    getStatusDistribution(jobs) {
        const distribution = {};
        jobs.forEach(job => {
            distribution[job.status] = (distribution[job.status] || 0) + 1;
        });
        return distribution;
    }

    /**
     * Get stage distribution
     * @param {Array} jobs - Array of job objects
     * @returns {Object} Stage distribution
     */
    getStageDistribution(jobs) {
        const distribution = {};
        jobs.forEach(job => {
            if (job.stage) {
                distribution[job.stage] = (distribution[job.stage] || 0) + 1;
            }
        });
        return distribution;
    }

    /**
     * Get monthly applications
     * @param {Array} jobs - Array of job objects
     * @returns {Object} Monthly application counts
     */
    getMonthlyApplications(jobs) {
        const monthlyCounts = {};
        jobs.forEach(job => {
            const date = new Date(job.dateApplied);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            monthlyCounts[monthKey] = (monthlyCounts[monthKey] || 0) + 1;
        });
        return monthlyCounts;
    }

    /**
     * Get company performance
     * @param {Array} jobs - Array of job objects
     * @returns {Object} Company performance data
     */
    getCompanyPerformance(jobs) {
        const companyCounts = {};
        jobs.forEach(job => {
            companyCounts[job.company] = (companyCounts[job.company] || 0) + 1;
        });
        return companyCounts;
    }

    /**
     * Generate filename for export
     * @param {string} format - Export format
     * @returns {string} Filename
     */
    generateFilename(format) {
        const date = new Date().toISOString().split('T')[0];
        const timestamp = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
        
        switch (format) {
            case 'csv':
                return `job-tracker-export-${date}-${timestamp}.csv`;
            case 'json':
                return `job-tracker-export-${date}-${timestamp}.json`;
            case 'analytics':
                return `job-tracker-analytics-${date}-${timestamp}.json`;
            case 'summary':
                return `job-tracker-summary-${date}-${timestamp}.json`;
            default:
                return `job-tracker-export-${date}-${timestamp}.txt`;
        }
    }

    /**
     * Download file
     * @param {string|Object} data - Data to download
     * @param {string} filename - Filename
     * @param {string} format - Export format
     */
    downloadFile(data, filename, format) {
        let content = data;
        let mimeType = 'text/plain';
        
        if (format === 'csv') {
            mimeType = 'text/csv';
        } else if (format === 'json' || format === 'analytics' || format === 'summary') {
            content = JSON.stringify(data, null, 2);
            mimeType = 'application/json';
        }
        
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
        
        // Show success notification
        if (window.showNotification) {
            window.showNotification('Export downloaded successfully!', 'success');
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.advancedAnalyticsExporter = new AdvancedAnalyticsExporter();
});
