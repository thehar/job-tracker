/**
 * Authentication Manager
 * Handles user authentication, password management, and session control
 */
class AuthManager {
    constructor() {
        this.isAuthenticated = false;
        // In-memory backoff for failed attempts
        this.failedAttempts = 0;
        this.maxBackoffMs = 5000;
        this.baseBackoffMs = 200;
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

    // ===== Password storage (PBKDF2) =====
    getAuthRecord() {
        try {
            const raw = localStorage.getItem('jobTracker_auth');
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    setAuthRecord(record) {
        localStorage.setItem('jobTracker_auth', JSON.stringify(record));
    }

    clearLegacyPassword() {
        localStorage.removeItem('jobTracker_password');
    }

    async pbkdf2Derive(password, saltBytes, iterations = 150000) {
        const enc = new TextEncoder();
        const keyMaterial = await crypto.subtle.importKey(
            'raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveBits']
        );
        const bits = await crypto.subtle.deriveBits(
            { name: 'PBKDF2', salt: saltBytes, iterations, hash: 'SHA-256' },
            keyMaterial,
            256
        );
        return new Uint8Array(bits);
    }

    bytesToHex(bytes) {
        return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    bytesToBase64(bytes) {
        let binary = '';
        bytes.forEach(b => binary += String.fromCharCode(b));
        return btoa(binary);
    }

    base64ToBytes(b64) {
        const binary = atob(b64);
        const arr = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
        return arr;
    }

    async createAuthRecord(password) {
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const iterations = 150000;
        const hashBytes = await this.pbkdf2Derive(password, salt, iterations);
        return {
            version: 'pbkdf2',
            algo: 'PBKDF2-HMAC-SHA-256',
            iterations,
            salt: this.bytesToBase64(salt),
            hash: this.bytesToHex(hashBytes)
        };
    }

    async verifyPassword(password, record) {
        if (!record || record.version !== 'pbkdf2') return false;
        const saltBytes = this.base64ToBytes(record.salt);
        const derived = await this.pbkdf2Derive(password, saltBytes, record.iterations);
        const derivedHex = this.bytesToHex(derived);
        return derivedHex === record.hash;
    }

    /**
     * Handle user login
     */
    async handleLogin() {
        const password = document.getElementById('password').value;
        const legacyHash = localStorage.getItem('jobTracker_password');
        const record = this.getAuthRecord();

        const doBackoff = async () => {
            const delay = Math.min(this.maxBackoffMs, this.baseBackoffMs * Math.pow(2, this.failedAttempts));
            if (delay > 0) await new Promise(r => setTimeout(r, delay));
        };

        // No credentials yet -> setup flow
        if (!record && !legacyHash) {
            this.showSetupForm();
            return;
        }

        // Prefer PBKDF2 record
        if (record) {
            const ok = await this.verifyPassword(password, record);
            if (ok) {
                this.failedAttempts = 0;
                this.authenticate();
                return;
            }
            await doBackoff();
            this.failedAttempts++;
            this.showError('Incorrect password');
            return;
        }

        // Legacy fallback (migrate on success)
        if (legacyHash) {
            const enc = new TextEncoder();
            const buf = await crypto.subtle.digest('SHA-256', enc.encode(password));
            const hex = this.bytesToHex(new Uint8Array(buf));
            if (hex === legacyHash) {
                // migrate
                const newRecord = await this.createAuthRecord(password);
                this.setAuthRecord(newRecord);
                this.clearLegacyPassword();
                this.failedAttempts = 0;
                this.authenticate();
                return;
            }
            await doBackoff();
            this.failedAttempts++;
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

        if (newPassword.length < 10) {
            this.showError('Password must be at least 10 characters long');
            return;
        }

        const record = await this.createAuthRecord(newPassword);
        this.setAuthRecord(record);
        this.clearLegacyPassword();

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
        const record = this.getAuthRecord();
        const legacyHash = localStorage.getItem('jobTracker_password');
        let verified = false;
        if (record) {
            verified = await this.verifyPassword(currentPassword, record);
        } else if (legacyHash) {
            const enc = new TextEncoder();
            const buf = await crypto.subtle.digest('SHA-256', enc.encode(currentPassword));
            const hex = this.bytesToHex(new Uint8Array(buf));
            verified = (hex === legacyHash);
        }
        if (!verified) {
            this.showError('Current password is incorrect');
            return;
        }

        if (newPassword !== confirmPassword) {
            this.showError('New passwords do not match');
            return;
        }

        if (newPassword.length < 10) {
            this.showError('Password must be at least 10 characters long');
            return;
        }

        const newRecord = await this.createAuthRecord(newPassword);
        this.setAuthRecord(newRecord);
        this.clearLegacyPassword();
        
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
