/**
 * InstallPromptUI Component
 * Creates and manages the custom PWA installation prompt interface
 */
class InstallPromptUI {
    constructor(manager) {
        this.manager = manager;
        this.element = null;
        this.isVisible = false;
        this.animationDuration = 300;
        this.detector = new CrossPlatformDetector();
        this.instructionType = this.determineInstructionType();
    }

    /**
     * Determine what type of installation instructions to show
     * @returns {string} Instruction type ('native', 'ios', 'firefox', 'generic')
     */
    determineInstructionType() {
        // Check if browser supports native installation prompts
        if (this.detector.supportsInstallPrompt() && this.manager.deferredPrompt) {
            return 'native';
        }

        // iOS Safari manual instructions
        if (this.detector.platform.name === 'ios' && this.detector.browser.name === 'safari') {
            return 'ios';
        }

        // Firefox-specific instructions
        if (this.detector.browser.name === 'firefox') {
            return 'firefox';
        }

        // Generic instructions for unsupported browsers
        return 'generic';
    }

    /**
     * Create the installation prompt UI element
     */
    create() {
        try {
            if (this.element) {
                return this.element;
            }

            // Store the previously focused element for restoration
            try {
                this.previouslyFocusedElement = document.activeElement;
            } catch (error) {
                console.warn('[InstallPromptUI] Could not store previously focused element:', error);
                this.previouslyFocusedElement = null;
            }

            // Create main container with error handling
            try {
                this.element = document.createElement('div');
                this.element.className = 'pwa-install-prompt';
                this.element.setAttribute('role', 'dialog');
                this.element.setAttribute('aria-labelledby', 'install-prompt-title');
                this.element.setAttribute('aria-describedby', 'install-prompt-description');
                this.element.setAttribute('aria-modal', 'true');
                this.element.setAttribute('aria-live', 'polite');
            } catch (error) {
                console.error('[InstallPromptUI] Error creating main container:', error);
                return this.createFallbackElement();
            }

            // Create backdrop with error handling
            let backdrop;
            try {
                backdrop = document.createElement('div');
                backdrop.className = 'install-prompt-backdrop';
                backdrop.setAttribute('aria-hidden', 'true');
                backdrop.addEventListener('click', () => this.handleOutsideClickSafely());
            } catch (error) {
                console.error('[InstallPromptUI] Error creating backdrop:', error);
                backdrop = null;
            }

            // Create prompt container with error handling
            let promptContainer;
            try {
                promptContainer = document.createElement('div');
                promptContainer.className = 'install-prompt-container';
                promptContainer.setAttribute('role', 'document');
            } catch (error) {
                console.error('[InstallPromptUI] Error creating prompt container:', error);
                return this.createFallbackElement();
            }

            // Create content based on instruction type with error handling
            try {
                if (this.instructionType === 'native') {
                    this.createNativePrompt(promptContainer);
                } else {
                    this.createInstructionPrompt(promptContainer);
                }
            } catch (error) {
                console.error('[InstallPromptUI] Error creating prompt content:', error);
                this.createFallbackContent(promptContainer);
            }

            // Assemble the element with error handling
            try {
                if (backdrop) {
                    this.element.appendChild(backdrop);
                }
                this.element.appendChild(promptContainer);
            } catch (error) {
                console.error('[InstallPromptUI] Error assembling prompt element:', error);
                return this.createFallbackElement();
            }

            // Add keyboard event listeners with error handling
            try {
                this.element.addEventListener('keydown', (e) => this.handleKeyDownSafely(e));
            } catch (error) {
                console.error('[InstallPromptUI] Error adding keyboard listeners:', error);
            }

            return this.element;
        } catch (error) {
            console.error('[InstallPromptUI] Critical error in create():', error);
            return this.createFallbackElement();
        }
    }

    /**
     * Create a fallback element when main creation fails
     * @returns {HTMLElement} Simple fallback element
     */
    createFallbackElement() {
        try {
            const fallback = document.createElement('div');
            fallback.className = 'pwa-install-prompt pwa-install-fallback';
            
            // Create container
            const container = document.createElement('div');
            container.className = 'install-prompt-container';
            
            // Create header
            const header = document.createElement('div');
            header.className = 'install-prompt-header';
            
            const title = document.createElement('h3');
            title.textContent = 'Install Job Tracker';
            
            const subtitle = document.createElement('p');
            subtitle.textContent = 'Get the full app experience';
            
            header.appendChild(title);
            header.appendChild(subtitle);
            
            // Create actions
            const actions = document.createElement('div');
            actions.className = 'install-prompt-actions';
            
            const closeBtn = document.createElement('button');
            closeBtn.className = 'btn btn-primary install-btn';
            closeBtn.textContent = 'Close';
            closeBtn.setAttribute('type', 'button');
            closeBtn.addEventListener('click', () => {
                fallback.style.display = 'none';
            });
            
            actions.appendChild(closeBtn);
            container.appendChild(header);
            container.appendChild(actions);
            fallback.appendChild(container);
            
            return fallback;
        } catch (error) {
            console.error('[InstallPromptUI] Even fallback element creation failed:', error);
            return document.createElement('div');
        }
    }

    /**
     * Create fallback content when content creation fails
     * @param {HTMLElement} container - Container to add content to
     */
    createFallbackContent(container) {
        try {
            // Create header
            const header = document.createElement('div');
            header.className = 'install-prompt-header';
            
            const title = document.createElement('h3');
            title.id = 'install-prompt-title';
            title.textContent = 'Install Job Tracker';
            
            const message = document.createElement('p');
            message.textContent = 'Installation prompt could not be fully loaded, but you can still install this app.';
            
            header.appendChild(title);
            header.appendChild(message);
            
            // Create actions
            const actions = document.createElement('div');
            actions.className = 'install-prompt-actions';
            
            const installBtn = document.createElement('button');
            installBtn.className = 'btn btn-primary install-btn';
            installBtn.textContent = 'Try Install';
            installBtn.setAttribute('type', 'button');
            installBtn.addEventListener('click', () => this.handleInstallClickSafely());
            
            const closeBtn = document.createElement('button');
            closeBtn.className = 'btn btn-secondary not-now-btn';
            closeBtn.textContent = 'Close';
            closeBtn.setAttribute('type', 'button');
            closeBtn.addEventListener('click', () => this.handleNotNowClickSafely());
            
            actions.appendChild(installBtn);
            actions.appendChild(closeBtn);
            
            container.appendChild(header);
            container.appendChild(actions);
        } catch (error) {
            console.error('[InstallPromptUI] Error creating fallback content:', error);
        }
    }

    /**
     * Create native installation prompt (Chrome/Edge with beforeinstallprompt)
     */
    createNativePrompt(container) {
        // Create header with app icon and title
        const header = document.createElement('div');
        header.className = 'install-prompt-header';

        const appIcon = document.createElement('div');
        appIcon.className = 'install-prompt-icon';
        appIcon.textContent = '📊';
        appIcon.setAttribute('aria-hidden', 'true');

        const titleSection = document.createElement('div');
        titleSection.className = 'install-prompt-title-section';

        const title = document.createElement('h3');
        title.id = 'install-prompt-title';
        title.className = 'install-prompt-title';
        title.textContent = 'Install Job Tracker';

        const subtitle = document.createElement('p');
        subtitle.className = 'install-prompt-subtitle';
        subtitle.textContent = 'Get the full app experience';

        titleSection.appendChild(title);
        titleSection.appendChild(subtitle);
        header.appendChild(appIcon);
        header.appendChild(titleSection);

        // Create benefits section
        const benefitsSection = document.createElement('div');
        benefitsSection.className = 'install-prompt-benefits';
        benefitsSection.id = 'install-prompt-description';

        const benefitsTitle = document.createElement('h4');
        benefitsTitle.className = 'install-benefits-title';
        benefitsTitle.textContent = 'Benefits of installing:';

        const benefitsList = document.createElement('ul');
        benefitsList.className = 'install-benefits-list';
        benefitsList.setAttribute('role', 'list');

        const benefits = [
            { icon: '🚀', text: 'Faster loading and better performance' },
            { icon: '📱', text: 'Easy access from your home screen' },
            { icon: '🔒', text: 'Works offline - access your data anywhere' },
            { icon: '🎯', text: 'No browser tabs needed' }
        ];

        benefits.forEach(benefit => {
            const listItem = document.createElement('li');
            listItem.className = 'install-benefit-item';
            listItem.setAttribute('role', 'listitem');

            const icon = document.createElement('span');
            icon.className = 'install-benefit-icon';
            icon.textContent = benefit.icon;
            icon.setAttribute('aria-hidden', 'true');

            const text = document.createElement('span');
            text.className = 'install-benefit-text';
            text.textContent = benefit.text;

            listItem.appendChild(icon);
            listItem.appendChild(text);
            benefitsList.appendChild(listItem);
        });

        benefitsSection.appendChild(benefitsTitle);
        benefitsSection.appendChild(benefitsList);

        // Create actions section
        const actionsSection = document.createElement('div');
        actionsSection.className = 'install-prompt-actions';

        const installButton = document.createElement('button');
        installButton.className = 'btn btn-primary install-btn';
        installButton.textContent = 'Install Now';
        installButton.setAttribute('aria-describedby', 'install-prompt-description');
        installButton.setAttribute('aria-label', 'Install Job Tracker app now for better performance and offline access');
        installButton.setAttribute('type', 'button');
        installButton.addEventListener('click', () => this.handleInstallClick());

        const notNowButton = document.createElement('button');
        notNowButton.className = 'btn btn-secondary not-now-btn';
        notNowButton.textContent = 'Not Now';
        notNowButton.setAttribute('aria-label', 'Dismiss installation prompt for now, may show again later');
        notNowButton.setAttribute('type', 'button');
        notNowButton.addEventListener('click', () => this.handleNotNowClick());

        const dontAskButton = document.createElement('button');
        dontAskButton.className = 'btn btn-text dont-ask-btn';
        dontAskButton.textContent = "Don't Ask Again";
        dontAskButton.setAttribute('aria-label', 'Permanently disable installation prompts');
        dontAskButton.setAttribute('type', 'button');
        dontAskButton.addEventListener('click', () => this.handleDontAskClick());

        actionsSection.appendChild(installButton);
        actionsSection.appendChild(notNowButton);
        actionsSection.appendChild(dontAskButton);

        // Assemble the prompt
        container.appendChild(header);
        container.appendChild(benefitsSection);
        container.appendChild(actionsSection);
    }

    /**
     * Create instruction-based prompt (iOS, Firefox, Generic)
     */
    createInstructionPrompt(container) {
        const instructions = this.detector.getInstallationInstructions();
        
        // Create header with app icon and title
        const header = document.createElement('div');
        header.className = 'install-prompt-header';

        const appIcon = document.createElement('div');
        appIcon.className = 'install-prompt-icon';
        appIcon.textContent = '📊';
        appIcon.setAttribute('aria-hidden', 'true');

        const titleSection = document.createElement('div');
        titleSection.className = 'install-prompt-title-section';

        const title = document.createElement('h3');
        title.id = 'install-prompt-title';
        title.className = 'install-prompt-title';
        title.textContent = 'Install Job Tracker';

        const subtitle = document.createElement('p');
        subtitle.className = 'install-prompt-subtitle';
        subtitle.textContent = this.getSubtitleForInstructionType();

        titleSection.appendChild(title);
        titleSection.appendChild(subtitle);
        header.appendChild(appIcon);
        header.appendChild(titleSection);

        // Create instructions section
        const instructionsSection = document.createElement('div');
        instructionsSection.className = 'install-prompt-instructions';
        instructionsSection.id = 'install-prompt-description';

        if (instructions.supported) {
            this.createSupportedInstructions(instructionsSection, instructions);
        } else {
            this.createUnsupportedInstructions(instructionsSection, instructions);
        }

        // Create actions section
        const actionsSection = document.createElement('div');
        actionsSection.className = 'install-prompt-actions';

        if (instructions.supported) {
            const gotItButton = document.createElement('button');
            gotItButton.className = 'btn btn-primary install-btn';
            gotItButton.textContent = 'Got It';
            gotItButton.setAttribute('aria-label', 'Acknowledge installation instructions and close prompt');
            gotItButton.setAttribute('type', 'button');
            gotItButton.addEventListener('click', () => this.handleGotItClick());

            const notNowButton = document.createElement('button');
            notNowButton.className = 'btn btn-secondary not-now-btn';
            notNowButton.textContent = 'Not Now';
            notNowButton.setAttribute('aria-label', 'Dismiss installation instructions for now, may show again later');
            notNowButton.setAttribute('type', 'button');
            notNowButton.addEventListener('click', () => this.handleNotNowClick());

            const dontAskButton = document.createElement('button');
            dontAskButton.className = 'btn btn-text dont-ask-btn';
            dontAskButton.textContent = "Don't Ask Again";
            dontAskButton.setAttribute('aria-label', 'Permanently disable installation prompts');
            dontAskButton.setAttribute('type', 'button');
            dontAskButton.addEventListener('click', () => this.handleDontAskClick());

            actionsSection.appendChild(gotItButton);
            actionsSection.appendChild(notNowButton);
            actionsSection.appendChild(dontAskButton);
        } else {
            const closeButton = document.createElement('button');
            closeButton.className = 'btn btn-primary install-btn';
            closeButton.textContent = 'Close';
            closeButton.setAttribute('aria-label', 'Close installation information dialog');
            closeButton.setAttribute('type', 'button');
            closeButton.addEventListener('click', () => this.handleNotNowClick());

            const dontAskButton = document.createElement('button');
            dontAskButton.className = 'btn btn-text dont-ask-btn';
            dontAskButton.textContent = "Don't Ask Again";
            dontAskButton.setAttribute('aria-label', 'Permanently disable installation prompts');
            dontAskButton.setAttribute('type', 'button');
            dontAskButton.addEventListener('click', () => this.handleDontAskClick());

            actionsSection.appendChild(closeButton);
            actionsSection.appendChild(dontAskButton);
        }

        // Assemble the prompt
        container.appendChild(header);
        container.appendChild(instructionsSection);
        container.appendChild(actionsSection);
    }

    /**
     * Get subtitle text based on instruction type
     */
    getSubtitleForInstructionType() {
        switch (this.instructionType) {
            case 'ios':
                return 'Follow these steps to install on iOS';
            case 'firefox':
                return 'Install as an app in Firefox';
            case 'generic':
                return 'Installation options for your browser';
            default:
                return 'Get the full app experience';
        }
    }

    /**
     * Create supported installation instructions
     */
    createSupportedInstructions(container, instructions) {
        const instructionsTitle = document.createElement('h4');
        instructionsTitle.className = 'install-instructions-title';
        instructionsTitle.textContent = 'How to install:';

        const stepsList = document.createElement('ol');
        stepsList.className = 'install-steps-list';
        stepsList.setAttribute('role', 'list');
        stepsList.setAttribute('aria-label', 'Installation steps');

        instructions.steps.forEach((step, index) => {
            const listItem = document.createElement('li');
            listItem.className = 'install-step-item';
            listItem.setAttribute('role', 'listitem');
            listItem.setAttribute('aria-label', `Step ${index + 1} of ${instructions.steps.length}: ${step.instruction}`);

            const stepNumber = document.createElement('span');
            stepNumber.className = 'install-step-number';
            stepNumber.textContent = step.step;
            stepNumber.setAttribute('aria-hidden', 'true');

            const stepIcon = document.createElement('span');
            stepIcon.className = 'install-step-icon';
            stepIcon.textContent = step.icon;
            stepIcon.setAttribute('aria-hidden', 'true');

            const stepText = document.createElement('span');
            stepText.className = 'install-step-text';
            stepText.textContent = step.instruction;

            listItem.appendChild(stepNumber);
            listItem.appendChild(stepIcon);
            listItem.appendChild(stepText);
            stepsList.appendChild(listItem);
        });

        container.appendChild(instructionsTitle);
        container.appendChild(stepsList);

        // Add notes if available
        if (instructions.notes && instructions.notes.length > 0) {
            const notesSection = document.createElement('div');
            notesSection.className = 'install-notes-section';

            const notesTitle = document.createElement('h5');
            notesTitle.className = 'install-notes-title';
            notesTitle.textContent = 'Important notes:';

            const notesList = document.createElement('ul');
            notesList.className = 'install-notes-list';
            notesList.setAttribute('role', 'list');
            notesList.setAttribute('aria-label', 'Important installation notes');

            instructions.notes.forEach(note => {
                const noteItem = document.createElement('li');
                noteItem.className = 'install-note-item';
                noteItem.setAttribute('role', 'listitem');
                noteItem.textContent = note;
                notesList.appendChild(noteItem);
            });

            notesSection.appendChild(notesTitle);
            notesSection.appendChild(notesList);
            container.appendChild(notesSection);
        }
    }

    /**
     * Create unsupported browser instructions
     */
    createUnsupportedInstructions(container, instructions) {
        const messageSection = document.createElement('div');
        messageSection.className = 'install-unsupported-message';

        const messageIcon = document.createElement('div');
        messageIcon.className = 'install-message-icon';
        messageIcon.textContent = '⚠️';
        messageIcon.setAttribute('aria-hidden', 'true');

        const messageText = document.createElement('p');
        messageText.className = 'install-message-text';
        messageText.textContent = instructions.message;

        messageSection.appendChild(messageIcon);
        messageSection.appendChild(messageText);
        container.appendChild(messageSection);

        // Add alternatives if available
        if (instructions.alternatives && instructions.alternatives.length > 0) {
            const alternativesSection = document.createElement('div');
            alternativesSection.className = 'install-alternatives-section';

            const alternativesTitle = document.createElement('h4');
            alternativesTitle.className = 'install-alternatives-title';
            alternativesTitle.textContent = 'Alternative options:';

            const alternativesList = document.createElement('ul');
            alternativesList.className = 'install-alternatives-list';
            alternativesList.setAttribute('role', 'list');
            alternativesList.setAttribute('aria-label', 'Alternative installation options');

            instructions.alternatives.forEach(alt => {
                const altItem = document.createElement('li');
                altItem.className = 'install-alternative-item';
                altItem.setAttribute('role', 'listitem');

                const altTitle = document.createElement('strong');
                altTitle.className = 'install-alternative-title';
                altTitle.textContent = alt.option;

                const altDesc = document.createElement('span');
                altDesc.className = 'install-alternative-desc';
                altDesc.textContent = ': ' + alt.description;

                altItem.appendChild(altTitle);
                altItem.appendChild(altDesc);
                alternativesList.appendChild(altItem);
            });

            alternativesSection.appendChild(alternativesTitle);
            alternativesSection.appendChild(alternativesList);
            container.appendChild(alternativesSection);
        }

        // Add recommended browsers if available
        if (instructions.recommendedBrowsers && instructions.recommendedBrowsers.length > 0) {
            const browsersSection = document.createElement('div');
            browsersSection.className = 'install-browsers-section';

            const browsersTitle = document.createElement('h4');
            browsersTitle.className = 'install-browsers-title';
            browsersTitle.textContent = 'Recommended browsers:';

            const browsersList = document.createElement('ul');
            browsersList.className = 'install-browsers-list';
            browsersList.setAttribute('role', 'list');
            browsersList.setAttribute('aria-label', 'Recommended browsers for installation');

            instructions.recommendedBrowsers.forEach(browser => {
                const browserItem = document.createElement('li');
                browserItem.className = 'install-browser-item';
                browserItem.setAttribute('role', 'listitem');
                browserItem.textContent = `${browser.name} ${browser.minVersion}+`;
                browsersList.appendChild(browserItem);
            });

            browsersSection.appendChild(browsersTitle);
            browsersSection.appendChild(browsersList);
            container.appendChild(browsersSection);
        }
    }

    /**
     * Show the installation prompt with animation
     */
    show() {
        if (this.isVisible) {
            return;
        }

        if (!this.element) {
            this.create();
        }

        // Add to DOM
        document.body.appendChild(this.element);
        
        // Disable scrolling on body to prevent background interaction
        document.body.style.overflow = 'hidden';
        
        // Force reflow for animation
        this.element.offsetHeight;
        
        // Add visible class for animation
        this.element.classList.add('visible');
        this.isVisible = true;

        // Announce to screen readers
        this.announceToScreenReader('Installation prompt opened. Use Tab to navigate, Escape to close.');

        // Focus management for accessibility
        this.focusFirstElement();

        // Trap focus within the modal
        this.trapFocus();
    }

    /**
     * Hide the installation prompt with animation
     */
    hide() {
        if (!this.isVisible || !this.element) {
            return;
        }

        this.element.classList.remove('visible');
        this.isVisible = false;

        // Restore scrolling on body
        document.body.style.overflow = '';

        // Restore focus to previously focused element
        if (this.previouslyFocusedElement && typeof this.previouslyFocusedElement.focus === 'function') {
            try {
                this.previouslyFocusedElement.focus();
            } catch (e) {
                // Fallback if element is no longer focusable
                document.body.focus();
            }
        }

        // Announce to screen readers
        this.announceToScreenReader('Installation prompt closed.');

        // Remove from DOM after animation
        setTimeout(() => {
            if (this.element && this.element.parentNode) {
                this.element.parentNode.removeChild(this.element);
            }
        }, this.animationDuration);
    }

    /**
     * Destroy the prompt and clean up
     */
    destroy() {
        // Restore scrolling on body
        document.body.style.overflow = '';

        // Restore focus if needed
        if (this.previouslyFocusedElement && typeof this.previouslyFocusedElement.focus === 'function') {
            try {
                this.previouslyFocusedElement.focus();
            } catch (e) {
                // Fallback if element is no longer focusable
                document.body.focus();
            }
        }

        if (this.element) {
            if (this.element.parentNode) {
                this.element.parentNode.removeChild(this.element);
            }
            this.element = null;
        }
        this.isVisible = false;
        this.previouslyFocusedElement = null;
    }

    /**
     * Handle install button click (native installation)
     */
    handleInstallClick() {
        this.handleInstallClickSafely();
    }

    /**
     * Safely handle install button click with error handling
     */
    handleInstallClickSafely() {
        try {
            if (this.manager && typeof this.manager.handleInstallClick === 'function') {
                this.manager.handleInstallClick();
            } else {
                console.warn('[InstallPromptUI] Manager or handleInstallClick method not available');
            }
        } catch (error) {
            console.error('[InstallPromptUI] Error handling install click:', error);
        } finally {
            this.hideSafely();
        }
    }

    /**
     * Handle "Got It" button click (instruction acknowledgment)
     */
    handleGotItClick() {
        this.handleGotItClickSafely();
    }

    /**
     * Safely handle "Got It" button click with error handling
     */
    handleGotItClickSafely() {
        try {
            // Track that user acknowledged the instructions
            if (this.manager && this.manager.analytics && typeof this.manager.analytics.trackInstructionsShown === 'function') {
                this.manager.analytics.trackInstructionsShown(this.instructionType);
            }
            
            // Mark as prompted but not dismissed negatively
            if (this.manager && typeof this.manager.handleInstructionsAcknowledged === 'function') {
                this.manager.handleInstructionsAcknowledged();
            }
        } catch (error) {
            console.error('[InstallPromptUI] Error handling got it click:', error);
        } finally {
            this.hideSafely();
        }
    }

    /**
     * Handle "Not Now" button click
     */
    handleNotNowClick() {
        this.handleNotNowClickSafely();
    }

    /**
     * Safely handle "Not Now" button click with error handling
     */
    handleNotNowClickSafely() {
        try {
            if (this.manager && typeof this.manager.handleDismiss === 'function') {
                this.manager.handleDismiss();
            } else {
                console.warn('[InstallPromptUI] Manager or handleDismiss method not available');
            }
        } catch (error) {
            console.error('[InstallPromptUI] Error handling not now click:', error);
        } finally {
            this.hideSafely();
        }
    }

    /**
     * Handle "Don't Ask Again" button click
     */
    handleDontAskClick() {
        this.handleDontAskClickSafely();
    }

    /**
     * Safely handle "Don't Ask Again" button click with error handling
     */
    handleDontAskClickSafely() {
        try {
            if (this.manager && typeof this.manager.handleDontAskAgain === 'function') {
                this.manager.handleDontAskAgain();
            } else {
                console.warn('[InstallPromptUI] Manager or handleDontAskAgain method not available');
            }
        } catch (error) {
            console.error('[InstallPromptUI] Error handling dont ask click:', error);
        } finally {
            this.hideSafely();
        }
    }

    /**
     * Handle outside click (backdrop click)
     */
    handleOutsideClick() {
        this.handleOutsideClickSafely();
    }

    /**
     * Safely handle outside click with error handling
     */
    handleOutsideClickSafely() {
        try {
            this.handleNotNowClickSafely();
        } catch (error) {
            console.error('[InstallPromptUI] Error handling outside click:', error);
            this.hideSafely();
        }
    }

    /**
     * Handle keyboard navigation
     */
    handleKeyDown(event) {
        this.handleKeyDownSafely(event);
    }

    /**
     * Safely handle keyboard navigation with error handling
     */
    handleKeyDownSafely(event) {
        try {
            if (event.key === 'Escape') {
                event.preventDefault();
                this.handleNotNowClickSafely();
                return;
            }

            if (event.key === 'Tab') {
                this.handleTabNavigationSafely(event);
                return;
            }
        } catch (error) {
            console.error('[InstallPromptUI] Error handling keyboard navigation:', error);
        }
    }

    /**
     * Safely handle tab navigation with error handling
     */
    handleTabNavigationSafely(event) {
        try {
            this.handleTabNavigation(event);
        } catch (error) {
            console.error('[InstallPromptUI] Error in tab navigation:', error);
            // Don't prevent default if there's an error - let browser handle it
        }
    }

    /**
     * Safely hide the prompt with error handling
     */
    hideSafely() {
        try {
            this.hide();
        } catch (error) {
            console.error('[InstallPromptUI] Error hiding prompt:', error);
            // Force cleanup if hide fails
            this.forceCleanup();
        }
    }

    /**
     * Force cleanup when normal hide fails
     */
    forceCleanup() {
        try {
            // Restore body overflow
            if (document.body) {
                document.body.style.overflow = '';
            }

            // Remove element from DOM
            if (this.element && this.element.parentNode) {
                this.element.parentNode.removeChild(this.element);
            }

            // Reset state
            this.element = null;
            this.isVisible = false;

            console.log('[InstallPromptUI] Force cleanup completed');
        } catch (error) {
            console.error('[InstallPromptUI] Error in force cleanup:', error);
        }
    }

    /**
     * Focus the first interactive element
     */
    focusFirstElement() {
        const firstButton = this.element.querySelector('.install-btn');
        if (firstButton) {
            firstButton.focus();
        }
    }

    /**
     * Trap focus within the modal for accessibility
     */
    trapFocus() {
        const focusableElements = this.element.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        this.element.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement.focus();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement.focus();
                    }
                }
            }
        });
    }

    /**
     * Handle tab navigation within the modal
     */
    handleTabNavigation(event) {
        const focusableElements = Array.from(
            this.element.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            )
        );

        if (focusableElements.length === 0) return;

        const currentIndex = focusableElements.indexOf(document.activeElement);
        
        if (event.shiftKey) {
            // Shift + Tab (backwards)
            if (currentIndex <= 0) {
                event.preventDefault();
                focusableElements[focusableElements.length - 1].focus();
            }
        } else {
            // Tab (forwards)
            if (currentIndex >= focusableElements.length - 1) {
                event.preventDefault();
                focusableElements[0].focus();
            }
        }
    }

    /**
     * Announce messages to screen readers
     */
    announceToScreenReader(message) {
        // Create a temporary live region for announcements
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = message;
        
        document.body.appendChild(announcement);
        
        // Remove after announcement
        setTimeout(() => {
            if (announcement.parentNode) {
                announcement.parentNode.removeChild(announcement);
            }
        }, 1000);
    }

    /**
     * Enhanced focus management with better error handling
     */
    focusFirstElement() {
        const focusableElements = this.element.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length > 0) {
            try {
                focusableElements[0].focus();
            } catch (e) {
                // Fallback to container if first element can't be focused
                try {
                    this.element.focus();
                } catch (e2) {
                    console.warn('[InstallPromptUI] Could not set initial focus');
                }
            }
        }
    }

    /**
     * Enhanced focus trapping with better keyboard support
     */
    trapFocus() {
        const focusableElements = this.element.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        // Enhanced keyboard event handler
        const keydownHandler = (e) => {
            // Handle Tab key for focus trapping
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement.focus();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement.focus();
                    }
                }
            }
            
            // Handle arrow keys for button navigation
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                const currentIndex = Array.from(focusableElements).indexOf(document.activeElement);
                if (currentIndex !== -1) {
                    e.preventDefault();
                    let nextIndex;
                    if (e.key === 'ArrowDown') {
                        nextIndex = (currentIndex + 1) % focusableElements.length;
                    } else {
                        nextIndex = (currentIndex - 1 + focusableElements.length) % focusableElements.length;
                    }
                    focusableElements[nextIndex].focus();
                }
            }
            
            // Handle Home/End keys
            if (e.key === 'Home') {
                e.preventDefault();
                firstElement.focus();
            } else if (e.key === 'End') {
                e.preventDefault();
                lastElement.focus();
            }
        };

        this.element.addEventListener('keydown', keydownHandler);
        
        // Store reference for cleanup
        this.focusTrapHandler = keydownHandler;
    }
}

// Make InstallPromptUI available globally
window.InstallPromptUI = InstallPromptUI;