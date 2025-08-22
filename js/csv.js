/**
 * CSV Manager for Import/Export
 * Handles CSV parsing, generation, and file operations
 */
class CsvManager {
    /**
     * Parse CSV text into array of objects
     * @param {string} csvText - Raw CSV text
     * @returns {Array} Array of job objects
     */
    static parseCsv(csvText) {
        const lines = csvText.split('\n');
        if (lines.length < 2) {
            throw new Error('CSV must have at least a header row and one data row');
        }

        // Parse header row
        const headers = this.parseCsvRow(lines[0]);
        
        // Parse data rows
        const data = [];
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim()) {
                const row = this.parseCsvRow(lines[i]);
                if (row.length === headers.length) {
                    const job = {};
                    headers.forEach((header, index) => {
                        job[header.trim()] = row[index].trim();
                    });
                    data.push(job);
                }
            }
        }

        return data;
    }

    /**
     * Parse a single CSV row, handling quotes and commas
     * @param {string} row - CSV row string
     * @returns {Array} Array of cell values
     */
    static parseCsvRow(row) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < row.length; i++) {
            const char = row[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current);
        return result;
    }

    /**
     * Generate CSV string from job array
     * @param {Array} jobs - Array of job objects
     * @returns {string} CSV formatted string
     */
    static generateCsv(jobs) {
        const headers = ['title', 'company', 'status', 'stage', 'dateApplied', 'contactPerson', 'notes', 'createdAt'];
        const csvRows = [headers.join(',')];
        
        jobs.forEach(job => {
            const row = headers.map(header => {
                let value = job[header] || '';
                // Escape quotes and wrap in quotes if contains comma or newline
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
     * Download CSV content as a file
     * @param {string} csvContent - CSV content to download
     * @param {string} filename - Name of the file to download
     */
    static downloadCsv(csvContent, filename) {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
    }

    /**
     * Validate imported job data
     * @param {Array} importedJobs - Array of imported job objects
     * @returns {Array} Array of valid job objects
     */
    static validateImportedJobs(importedJobs) {
        const validJobs = [];
        const requiredFields = ['title', 'company', 'status', 'dateApplied'];
        
        // Get current valid statuses from settings manager
        const validStatuses = window.settingsManager ? window.settingsManager.statuses : [
            'Applied', 'Interview Scheduled', 'Interview Completed', 'Offer Received', 'Rejected', 'Withdrawn'
        ];
        
        importedJobs.forEach((job, index) => {
            // Check required fields
            const hasRequiredFields = requiredFields.every(field => 
                job[field] && job[field].trim()
            );
            
            if (!hasRequiredFields) {
                console.warn(`Job ${index + 1} missing required fields:`, job);
                return;
            }

            // Validate status
            if (!validStatuses.includes(job.status)) {
                console.warn(`Job ${index + 1} has invalid status: ${job.status}`);
                return;
            }

            // Validate date format
            if (!DataManager.isValidDate(job.dateApplied)) {
                console.warn(`Job ${index + 1} has invalid date: ${job.dateApplied}`);
                return;
            }

            // Create valid job object
            const validJob = DataManager.createJobObject(job);
            validJobs.push(validJob);
        });

        return validJobs;
    }

    /**
     * Read file as text using FileReader API
     * @param {File} file - File object to read
     * @returns {Promise<string>} Promise that resolves to file content
     */
    static readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }
}
