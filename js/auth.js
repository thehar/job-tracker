/**
 * Authentication Manager
 * Handles user authentication, password management, and session control
 */
class AuthManager {
    constructor() {
        this.isAuthenticated = false;
        this.init();
    }

    /**
     * Initialize authentication system
     */
    async init() {
        await this.checkAuthStatus();
        this.setupEventListeners();
    }

    /**
     * Check if user is authenticated based on session and stored password
     */
    async checkAuthStatus() {
        const session = localStorage.getItem('jobTracker_session');
        const hashedPassword = localStorage.getItem('jobTracker_password');
        
        if (session && hashedPassword) {
            this.isAuthenticated = true;
            this.showMainApp();
        } else {
            this.isAuthenticated = false;
            this.showAuthModal();
        }
    }

    /**
     * Setup authentication event listeners
     */
    setupEventListeners() {
        // Login form
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Setup form (first time)
        document.getElementById('setupForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSetup();
        });

        // Change password form
        document.getElementById('changePasswordForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleChangePassword();
        });

        // Settings button
        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.showSettings();
        });

        // Close settings
        document.getElementById('closeSettings').addEventListener('click', () => {
            this.hideSettings();
        });

        // Logout button
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });

        // Close settings when clicking outside
        document.getElementById('settingsModal').addEventListener('click', (e) => {
            if (e.target.id === 'settingsModal') {
                this.hideSettings();
            }
        });
    }

    /**
     * Hash password using SHA-256
     * @param {string} password - Plain text password
     * @returns {Promise<string>} - Hashed password
     */
    async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    }

    /**
     * Handle user login
     */
    async handleLogin() {
        const password = document.getElementById('password').value;
        const storedHash = localStorage.getItem('jobTracker_password');
        
        if (!storedHash) {
            this.showSetupForm();
            return;
        }

        const inputHash = await this.hashPassword(password);
        
        if (inputHash === storedHash) {
            this.authenticate();
        } else {
            this.showError('Incorrect password');
        }
    }

    /**
     * Handle initial password setup
     */
    async handleSetup() {
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (newPassword !== confirmPassword) {
            this.showError('Passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            this.showError('Password must be at least 6 characters long');
            return;
        }

        const hashedPassword = await this.hashPassword(newPassword);
        localStorage.setItem('jobTracker_password', hashedPassword);
        
        this.authenticate();
    }

    /**
     * Handle password change
     */
    async handleChangePassword() {
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('settingsNewPassword').value;
        const confirmPassword = document.getElementById('settingsConfirmPassword').value;
        
        // Verify current password
        const storedHash = localStorage.getItem('jobTracker_password');
        const currentHash = await this.hashPassword(currentPassword);
        
        if (currentHash !== storedHash) {
            this.showError('Current password is incorrect');
            return;
        }

        if (newPassword !== confirmPassword) {
            this.showError('New passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            this.showError('Password must be at least 6 characters long');
            return;
        }

        const newHashedPassword = await this.hashPassword(newPassword);
        localStorage.setItem('jobTracker_password', newHashedPassword);
        
        this.hideSettings();
        NotificationManager.show('Password changed successfully!', 'success');
        
        // Clear the form
        document.getElementById('changePasswordForm').reset();
    }

    /**
     * Authenticate user and initialize application
     */
    authenticate() {
        this.isAuthenticated = true;
        localStorage.setItem('jobTracker_session', Date.now().toString());
        this.hideAuthModal();
        this.showMainApp();
        
        // Initialize application components
        if (!window.jobTracker) {
            window.jobTracker = new JobTracker();
            window.dashboard = new Dashboard(window.jobTracker);
            window.settingsManager = new SettingsManager();
            window.weeklyReportManager = new WeeklyReportManager(window.jobTracker);
        }
    }

    /**
     * Log out user
     */
    logout() {
        if (confirm('Are you sure you want to log out?')) {
            this.isAuthenticated = false;
            localStorage.removeItem('jobTracker_session');
            this.showAuthModal();
            this.hideMainApp();
            
            // Clear application components
            if (window.jobTracker) {
                window.jobTracker = null;
                window.dashboard = null;
                window.settingsManager = null;
                window.weeklyReportManager = null;
            }
        }
    }

    /**
     * Show authentication modal
     */
    showAuthModal() {
        const authModal = document.getElementById('authModal');
        authModal.classList.remove('hidden');
        authModal.style.display = 'flex';
        
        // Show appropriate form
        const hasPassword = localStorage.getItem('jobTracker_password');
        if (hasPassword) {
            document.getElementById('loginForm').classList.remove('hidden');
            document.getElementById('setupForm').classList.add('hidden');
            document.getElementById('authTitle').textContent = 'Welcome Back';
        } else {
            document.getElementById('loginForm').classList.add('hidden');
            document.getElementById('setupForm').classList.remove('hidden');
            document.getElementById('authTitle').textContent = 'Welcome to Job Tracker';
        }
    }

    /**
     * Hide authentication modal
     */
    hideAuthModal() {
        document.getElementById('authModal').style.display = 'none';
    }

    /**
     * Show main application
     */
    showMainApp() {
        document.getElementById('mainApp').classList.remove('hidden');
    }

    /**
     * Hide main application
     */
    hideMainApp() {
        document.getElementById('mainApp').classList.add('hidden');
    }

    /**
     * Show settings modal
     */
    showSettings() {
        document.getElementById('settingsModal').classList.remove('hidden');
        document.getElementById('changePasswordForm').reset();
    }

    /**
     * Hide settings modal
     */
    hideSettings() {
        document.getElementById('settingsModal').classList.add('hidden');
    }

    /**
     * Show setup form (for first-time users)
     */
    showSetupForm() {
        document.getElementById('loginForm').classList.add('hidden');
        document.getElementById('setupForm').classList.remove('hidden');
        document.getElementById('authTitle').textContent = 'Create Your Password';
        document.getElementById('newPassword').focus();
    }

    /**
     * Show error message
     * @param {string} message - Error message to display
     */
    showError(message) {
        NotificationManager.show(message, 'error');
    }
}
