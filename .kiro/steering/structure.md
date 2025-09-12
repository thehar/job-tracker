# Project Structure & Organization

## Root Directory Structure
```
job-tracker/
├── index.html              # Main application HTML (single page)
├── styles.css              # Complete application styles (~1300+ lines)
├── js/                     # JavaScript modules (modular architecture)
├── images/                 # Static assets
├── sample_import.csv       # Sample CSV for testing imports
├── .cursor/                # Cursor AI development rules
├── .kiro/                  # Kiro steering rules
├── .git/                   # Git repository
├── .gitignore             # Git ignore patterns
├── README.md              # Project documentation
├── CONTRIBUTING.md        # Development guidelines
├── CHANGELOG.md           # Version history
└── LICENSE                # MIT license
```

## JavaScript Module Organization (`js/`)
Each JavaScript file represents a focused module with single responsibility:

- **`app.js`** - Application entry point, global initialization, error handling
- **`auth.js`** - Authentication system, password management, session control
- **`data.js`** - Data utilities, localStorage operations, validation helpers
- **`csv.js`** - CSV import/export functionality, parsing, validation
- **`job-tracker.js`** - Core job CRUD operations, form management, UI rendering
- **`dashboard.js`** - Analytics dashboard, Chart.js integration, visualizations
- **`settings.js`** - Custom statuses/stages management, drag-and-drop functionality
- **`weekly-report.js`** - Report generation, analysis, export capabilities
- **`notifications.js`** - Toast notification system, user feedback
- **`advanced-analytics.js`** - Extended analytics features

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
- `jobTracker_jobs` - Array of job application objects
- `jobTracker_password` - SHA-256 hashed password
- `jobTracker_session` - Current session timestamp
- `jobTracker_customStatuses` - User-defined status list
- `jobTracker_customStages` - User-defined stage list

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