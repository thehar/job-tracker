# Project Structure & Organization

## Root Directory Structure
```
job-tracker/
├── index.html              # Main application HTML with PWA features
├── styles.css              # Complete application styles (1500+ lines, well-organized)
├── sw.js                   # Service Worker for offline functionality and caching
├── manifest.json           # PWA manifest for app installation and branding
├── js/                     # JavaScript modules (modular architecture, 10 files)
├── images/                 # Static assets (screenshots, etc.)
├── sample_import.csv       # Sample CSV for testing imports
├── .cursor/                # Cursor AI development rules
├── .kiro/                  # Kiro steering rules and configuration
├── .git/                   # Git repository
├── .gitignore             # Git ignore patterns
├── README.md              # Project documentation
├── CONTRIBUTING.md        # Development guidelines
├── CHANGELOG.md           # Version history
└── LICENSE                # MIT license
```

## JavaScript Module Organization (`js/`)
Each JavaScript file represents a focused module with single responsibility:

- **`app.js`** - Application entry point, Service Worker registration, offline detection, global initialization
- **`auth.js`** - Authentication system, password management, session control
- **`data.js`** - Data utilities, localStorage operations, validation helpers
- **`csv.js`** - CSV import/export functionality, parsing, validation
- **`job-tracker.js`** - Core job CRUD operations, form management, UI rendering
- **`dashboard.js`** - Analytics dashboard, Chart.js integration, visualizations
- **`settings.js`** - Custom statuses/stages management, drag-and-drop functionality, cache management
- **`weekly-report.js`** - Report generation, analysis, export capabilities
- **`notifications.js`** - Toast notification system, user feedback
- **`advanced-analytics.js`** - Extended analytics features, multi-format export

## File Naming Conventions
- **HTML**: Single `index.html` file (SPA architecture)
- **CSS**: Single `styles.css` file with organized sections
- **JavaScript**: Kebab-case filenames (`job-tracker.js`, `weekly-report.js`)
- **Classes**: PascalCase (`JobTracker`, `AuthManager`, `DataManager`)
- **Methods/Variables**: camelCase (`addJob`, `currentFilter`, `isAuthenticated`)

## CSS Organization (within `styles.css`)
Styles are organized in logical sections:
1. **Reset & Base** - CSS reset, global styles, accessibility
2. **Layout** - Container, grid, flexbox utilities
3. **Components** - Buttons, forms, cards, modals
4. **Authentication** - Login/setup forms, auth modal
5. **Job Management** - Job cards, forms, filters
6. **Dashboard** - Charts, summary cards, analytics
7. **Settings** - Settings modal, custom lists
8. **Responsive** - Media queries for different screen sizes

## Data Storage Structure
All data stored in browser localStorage with consistent naming:
- `jobTracker_jobs` - Array of job application objects (includes applicationSource field)
- `jobTracker_password` - SHA-256 hashed password
- `jobTracker_session` - Current session timestamp
- `jobTracker_customStatuses` - User-defined status list
- `jobTracker_customStages` - User-defined stage list

## Cache Storage Structure
Service Worker manages multiple cache stores:
- `job-tracker-v1.1` - Core application assets (HTML, CSS, JS, static files)
- `job-tracker-v1.1-cdn` - CDN resources (Chart.js)
- Automatic cache versioning and cleanup on updates

## Component Architecture Patterns
Each JavaScript class follows consistent patterns:

```javascript
class ComponentName {
    constructor(dependencies) {
        // Initialize properties
        this.init();
    }

    init() {
        // Setup component
        this.setupEventListeners();
        this.render();
    }

    setupEventListeners() {
        // Bind DOM events
    }

    render() {
        // Update UI
    }
}
```

## Folder Structure Rules
- **No nested folders** in `js/` - keep flat structure for simplicity
- **Single CSS file** - avoid CSS fragmentation
- **Assets in `images/`** - screenshots, icons, static content
- **Documentation at root** - README, CONTRIBUTING, CHANGELOG
- **Configuration files at root** - .gitignore, LICENSE

## Import/Export Patterns
Since this uses vanilla JS without modules:
- **No ES6 imports/exports** - all scripts loaded via `<script>` tags
- **Global namespace** - classes attached to `window` object
- **Dependency order** - scripts loaded in correct sequence in HTML
- **Class instantiation** - done in `app.js` after DOM ready
- **Service Worker** - Separate script with its own scope and lifecycle

## Development File Organization
- **`.cursor/rules/`** - Cursor AI development standards
- **`.kiro/steering/`** - Kiro AI guidance documents
- **`.vscode/`** - VS Code workspace settings
- **`.git/`** - Git version control

## Accessibility Structure
- **Semantic HTML** - Proper heading hierarchy, landmarks, form labels
- **ARIA attributes** - Screen reader support, live regions
- **Skip links** - Keyboard navigation shortcuts
- **Focus management** - Logical tab order, visible focus indicators