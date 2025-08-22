/**
 * Weekly Report Manager
 * Handles weekly report generation, analysis, and export functionality
 */
class WeeklyReportManager {
    constructor(jobTracker) {
        this.jobTracker = jobTracker;
        this.setupEventListeners();
    }

    /**
     * Setup weekly report event listeners
     */
    setupEventListeners() {
        // Weekly report button
        document.getElementById('weeklyReportBtn').addEventListener('click', () => {
            this.generateReport();
        });

        // Modal close events
        document.getElementById('closeWeeklyReport').addEventListener('click', () => {
            this.closeModal();
        });

        // Close modal when clicking outside
        document.getElementById('weeklyReportModal').addEventListener('click', (e) => {
            if (e.target.id === 'weeklyReportModal') {
                this.closeModal();
            }
        });

        // Copy to clipboard
        document.getElementById('copyReportBtn').addEventListener('click', () => {
            this.copyToClipboard();
        });

        // Email report
        document.getElementById('emailReportBtn').addEventListener('click', () => {
            this.emailReport();
        });
    }

    /**
     * Generate weekly report and show modal
     */
    generateReport() {
        const jobs = this.jobTracker.jobs;
        const reportData = this.analyzeWeeklyData(jobs);
        const reportText = this.formatReport(reportData);
        
        // Update modal content
        document.getElementById('reportPeriod').textContent = reportData.period;
        document.getElementById('reportText').value = reportText;
        
        // Show modal
        document.getElementById('weeklyReportModal').classList.remove('hidden');
    }

    /**
     * Analyze job data for the past 7 days
     * @param {Array} jobs - Array of job objects
     * @returns {Object} Analysis results
     */
    analyzeWeeklyData(jobs) {
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        // Format period
        const period = `${DataManager.formatDate(oneWeekAgo)} - ${DataManager.formatDate(now)}`;
        
        // Applications added in last 7 days
        const recentApplications = jobs.filter(job => {
            const createdDate = new Date(job.createdAt);
            return createdDate >= oneWeekAgo;
        });

        // Applications updated in last 7 days
        const recentUpdates = jobs.filter(job => {
            if (!job.updatedAt) return false;
            const updatedDate = new Date(job.updatedAt);
            return updatedDate >= oneWeekAgo;
        });

        // Overall statistics
        const totalApplications = jobs.length;
        const statusCounts = this.getStatusBreakdown(jobs);
        const stageCounts = this.getStageBreakdown(jobs);
        
        // Weekly changes
        const weeklyStatusChanges = this.getWeeklyStatusChanges(recentUpdates);
        
        // Calculate success metrics
        const successMetrics = this.calculateSuccessMetrics(jobs);
        
        // Recent company applications
        const recentCompanies = recentApplications.map(job => ({
            company: job.company,
            title: job.title,
            status: job.status,
            dateApplied: job.dateApplied
        }));

        return {
            period,
            recentApplications,
            recentUpdates,
            totalApplications,
            statusCounts,
            stageCounts,
            weeklyStatusChanges,
            successMetrics,
            recentCompanies,
            weeklyCount: recentApplications.length,
            updatesCount: recentUpdates.length
        };
    }

    /**
     * Get status breakdown for all jobs
     * @param {Array} jobs - Array of job objects
     * @returns {Object} Status counts
     */
    getStatusBreakdown(jobs) {
        const counts = {};
        const statuses = window.settingsManager ? window.settingsManager.statuses : [
            'Applied', 'Interview Scheduled', 'Interview Completed', 'Offer Received', 'Rejected', 'Withdrawn'
        ];
        
        statuses.forEach(status => counts[status] = 0);
        jobs.forEach(job => {
            if (counts.hasOwnProperty(job.status)) {
                counts[job.status]++;
            }
        });
        
        return counts;
    }

    /**
     * Get stage breakdown for all jobs
     * @param {Array} jobs - Array of job objects
     * @returns {Object} Stage counts
     */
    getStageBreakdown(jobs) {
        const counts = {};
        const stages = window.settingsManager ? window.settingsManager.stages : [
            'Application Submitted', 'Phone Screen', 'Technical Interview', 'Onsite Interview', 'Final Round', 'Negotiation'
        ];
        
        stages.forEach(stage => counts[stage] = 0);
        jobs.forEach(job => {
            if (job.stage && counts.hasOwnProperty(job.stage)) {
                counts[job.stage]++;
            }
        });
        
        return counts;
    }

    /**
     * Get weekly status changes
     * @param {Array} recentUpdates - Recently updated jobs
     * @returns {Array} Array of status changes
     */
    getWeeklyStatusChanges(recentUpdates) {
        const changes = [];
        recentUpdates.forEach(job => {
            changes.push({
                company: job.company,
                title: job.title,
                status: job.status,
                updatedAt: job.updatedAt
            });
        });
        return changes;
    }

    /**
     * Calculate success metrics
     * @param {Array} jobs - Array of job objects
     * @returns {Object} Success metrics
     */
    calculateSuccessMetrics(jobs) {
        const total = jobs.length;
        const offers = jobs.filter(job => job.status === 'Offer Received').length;
        const rejected = jobs.filter(job => job.status === 'Rejected').length;
        const active = jobs.filter(job => 
            !['Rejected', 'Withdrawn', 'Offer Received'].includes(job.status)
        ).length;
        
        const successRate = total > 0 ? Math.round((offers / total) * 100) : 0;
        const rejectionRate = total > 0 ? Math.round((rejected / total) * 100) : 0;
        
        return {
            total,
            offers,
            rejected,
            active,
            successRate,
            rejectionRate
        };
    }

    /**
     * Format report data into readable text
     * @param {Object} data - Report data
     * @returns {string} Formatted report text
     */
    formatReport(data) {
        const report = [];
        
        // Header
        report.push('📊 WEEKLY JOB SEARCH REPORT');
        report.push('═'.repeat(50));
        report.push(`📅 Report Period: ${data.period}`);
        report.push(`📋 Generated: ${DataManager.formatDateTime(new Date())}`);
        report.push('');

        // Executive Summary
        report.push('📈 EXECUTIVE SUMMARY');
        report.push('─'.repeat(30));
        report.push(`• Total Applications: ${data.totalApplications}`);
        report.push(`• New Applications This Week: ${data.weeklyCount}`);
        report.push(`• Status Updates This Week: ${data.updatesCount}`);
        report.push(`• Success Rate: ${data.successMetrics.successRate}% (${data.successMetrics.offers} offers)`);
        report.push(`• Active Applications: ${data.successMetrics.active}`);
        report.push('');

        // New Applications This Week
        if (data.recentApplications.length > 0) {
            report.push('🆕 NEW APPLICATIONS THIS WEEK');
            report.push('─'.repeat(30));
            data.recentCompanies.forEach(app => {
                report.push(`• ${app.company} - ${app.title}`);
                report.push(`  Status: ${app.status} | Applied: ${DataManager.formatDate(new Date(app.dateApplied))}`);
            });
            report.push('');
        }

        // Status Changes This Week
        if (data.weeklyStatusChanges.length > 0) {
            report.push('🔄 STATUS UPDATES THIS WEEK');
            report.push('─'.repeat(30));
            data.weeklyStatusChanges.forEach(change => {
                report.push(`• ${change.company} - ${change.title}`);
                report.push(`  New Status: ${change.status} | Updated: ${DataManager.formatDate(new Date(change.updatedAt))}`);
            });
            report.push('');
        }

        // Current Status Breakdown
        report.push('📊 CURRENT STATUS BREAKDOWN');
        report.push('─'.repeat(30));
        Object.entries(data.statusCounts).forEach(([status, count]) => {
            if (count > 0) {
                const percentage = Math.round((count / data.totalApplications) * 100);
                report.push(`• ${status}: ${count} (${percentage}%)`);
            }
        });
        report.push('');

        // Stage Analysis
        const activeStages = Object.entries(data.stageCounts).filter(([stage, count]) => count > 0);
        if (activeStages.length > 0) {
            report.push('🎯 CURRENT STAGE BREAKDOWN');
            report.push('─'.repeat(30));
            activeStages.forEach(([stage, count]) => {
                report.push(`• ${stage}: ${count}`);
            });
            report.push('');
        }

        // Key Metrics
        report.push('📈 KEY METRICS');
        report.push('─'.repeat(30));
        report.push(`• Success Rate: ${data.successMetrics.successRate}%`);
        report.push(`• Rejection Rate: ${data.successMetrics.rejectionRate}%`);
        report.push(`• Active Pipeline: ${data.successMetrics.active} applications`);
        report.push(`• Weekly Activity: ${data.weeklyCount} new applications`);
        report.push('');

        // Next Steps
        report.push('🎯 RECOMMENDED NEXT STEPS');
        report.push('─'.repeat(30));
        
        if (data.weeklyCount === 0) {
            report.push('• Consider increasing application volume this week');
        }
        
        if (data.successMetrics.active > 10) {
            report.push('• Follow up on pending applications');
        }
        
        if (data.successMetrics.successRate < 5 && data.totalApplications > 10) {
            report.push('• Review and optimize application strategy');
        }
        
        report.push('• Continue tracking and analyzing application data');
        report.push('• Set weekly targets for new applications');
        report.push('');

        // Footer
        report.push('─'.repeat(50));
        report.push('Generated by Job Tracker - Keep pushing forward! 💪');

        return report.join('\n');
    }

    /**
     * Copy report to clipboard
     */
    async copyToClipboard() {
        const reportText = document.getElementById('reportText').value;
        
        try {
            await navigator.clipboard.writeText(reportText);
            NotificationManager.show('Report copied to clipboard!', 'success');
        } catch (err) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = reportText;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            try {
                document.execCommand('copy');
                NotificationManager.show('Report copied to clipboard!', 'success');
            } catch (err) {
                NotificationManager.show('Failed to copy report', 'error');
            }
            
            document.body.removeChild(textArea);
        }
    }

    /**
     * Open email client with report
     */
    emailReport() {
        const reportText = document.getElementById('reportText').value;
        const subject = document.getElementById('emailSubject').value || 'Weekly Job Search Report';
        const recipient = document.getElementById('emailRecipient').value || '';
        
        // Create mailto link
        const encodedSubject = encodeURIComponent(subject);
        const encodedBody = encodeURIComponent(reportText);
        const mailtoLink = `mailto:${recipient}?subject=${encodedSubject}&body=${encodedBody}`;
        
        // Open email client
        try {
            window.location.href = mailtoLink;
            NotificationManager.show('Email client opened!', 'success');
        } catch (err) {
            NotificationManager.show('Failed to open email client', 'error');
        }
    }

    /**
     * Close weekly report modal
     */
    closeModal() {
        document.getElementById('weeklyReportModal').classList.add('hidden');
    }
}
