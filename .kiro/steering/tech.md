# Technology Stack & Build System

## Tech Stack
- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES6+)
- **Charts**: Chart.js 3.9.1 (CDN)
- **Storage**: Browser localStorage
- **Security**: Web Crypto API (SHA-256 hashing)
- **File Operations**: File API, Blob API, Clipboard API

## Browser Requirements
- **Chrome** 88+ ✅
- **Firefox** 85+ ✅  
- **Safari** 14+ ✅
- **Edge** 88+ ✅

Required browser features:
- Web Crypto API for password hashing
- Local Storage for data persistence
- Modern JavaScript (ES6+ classes, async/await, modules)
- CSS Grid & Flexbox support

## Build System
**No build system required** - this is a key architectural decision. The application runs directly in the browser without compilation, bundling, or preprocessing.

## Development Commands
Since there's no build system, development is straightforward:

```bash
# Clone the repository
git clone https://github.com/thehar/job-tracker.git
cd job-tracker

# Open in browser (no server required)
open index.html
# OR serve locally if needed
python -m http.server 8000
# OR
npx serve .
```

## External Dependencies
- **Chart.js**: Loaded via CDN (`https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js`)
- **Service Worker**: Native browser API for offline functionality and PWA features
- **No package.json**: Intentionally avoided to maintain zero-dependency approach
- **No node_modules**: All dependencies are either vanilla JS or CDN-loaded

## Architecture Patterns
- **Modular JavaScript**: Each feature in separate JS file with ES6 classes
- **Event-Driven**: Loose coupling through DOM events and callbacks  
- **Data Layer**: Centralized data management through `DataManager` class
- **Component-Based**: UI components as classes with lifecycle methods
- **Progressive Enhancement**: Core functionality works without JavaScript

## File Loading Order
Scripts must be loaded in dependency order (see index.html):
1. `notifications.js` - Base notification system
2. `data.js` - Data management utilities
3. `csv.js` - CSV operations
4. `auth.js` - Authentication system
5. `job-tracker.js` - Core job management
6. `dashboard.js` - Analytics (depends on Chart.js)
7. `settings.js` - Settings management
8. `weekly-report.js` - Report generation
9. `advanced-analytics.js` - Extended analytics and export
10. `app.js` - Application initialization, Service Worker registration (must be last)

## Development Workflow
- **No compilation**: Edit files directly, refresh browser
- **No hot reload**: Manual browser refresh required (Service Worker handles caching)
- **Debugging**: Browser DevTools, console logging, Service Worker debugging
- **Testing**: Manual testing in target browsers, offline testing
- **Cache Management**: Use Settings > Offline tab for cache control during development