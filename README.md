# 📊 Job Tracker

A modern, client-side job application tracking system with analytics, CSV import/export, and weekly reporting features. Built with vanilla HTML, CSS, and JavaScript - no frameworks, no backend required. Features a beautiful dark theme with responsive design and comprehensive job search management tools.

![Job Tracker Screenshot](https://github.com/thehar/job-tracker/blob/395c870fccf7b577be11a0a402f610716ced1b5b/images/screenshot.png)

## ✨ Features

### 🎯 Core Job Tracking
- **Add, Edit, Delete Jobs** - Complete CRUD operations for job applications
- **Rich Job Details** - Title, Company, Status, Stage, Date Applied, Contact Person, Notes
- **Status & Stage Tracking** - Monitor your application progress through customizable stages
- **Smart Filtering** - Filter applications by status or view all at once

### 📈 Analytics Dashboard
- **Interactive Charts** - Status distribution, stage breakdown, application sources, and source performance
- **Summary Cards** - Total applications, top source, active applications, interview rates, and more
- **Application Source Tracking** - Monitor which platforms yield the best results
- **Source Performance Analytics** - Interview rates by application source for strategic insights
- **Company Status** - Track current status for each company you've applied to
- **Visual Insights** - Beautiful Chart.js visualizations with responsive design

### 🔧 Admin Panel
- **PWA Installation Analytics** - Comprehensive tracking of app installation metrics
- **Installation Funnel Charts** - Visual breakdown of prompts shown, clicks, and successful installs
- **Platform & Browser Analytics** - Detailed breakdown by device and browser type
- **Real-time Metrics** - Live tracking of installation events and conversion rates
- **Export & Reset** - Export analytics data in multiple formats (JSON, CSV, Summary)
- **Keyboard Navigation** - Full keyboard accessibility with Alt+A shortcut
- **Responsive Design** - Optimized for all screen sizes with mobile-first approach

### 📊 Weekly Reports
- **Automated Analysis** - 7-day period analysis of your job search activity
- **Actionable Insights** - AI-driven recommendations for improving your job search
- **Export Options** - Copy to clipboard or email directly from the app
- **Progress Tracking** - Monitor weekly application volume and status changes

### 📋 CSV Import/Export
- **Bulk Import** - Upload CSV files to import multiple applications at once
- **Data Validation** - Automatic validation and deduplication of imported data
- **Easy Export** - Download your complete job data as CSV for backup or analysis
- **Sample Data** - Includes sample CSV template for easy getting started

### 🔐 Security & Privacy
- **Client-Side Only** - All data stays on your device, never uploaded to servers
- **Password Protection** - SHA-256 encrypted password protection for your data
- **Session Management** - Secure login/logout with automatic session handling
- **Full Offline Support** - Complete functionality offline with Service Worker caching
- **Data Encryption** - All sensitive data is hashed and stored securely

### 🌐 Offline & PWA Features
- **Service Worker** - Intelligent caching with multiple strategies for optimal performance
- **Offline Indicator** - Real-time connection status with visual feedback
- **Cache Management** - Manual cache control with refresh, clear, and status monitoring
- **Background Updates** - Automatic cache updates when online for fresh content
- **PWA Ready** - Progressive Web App with manifest and offline-first architecture
- **Smart Caching** - Network-first for HTML, cache-first for assets, stale-while-revalidate for CDN
- **Cross-Platform Installation** - Native prompts for Chrome, custom instructions for iOS/Safari/Firefox
- **Installation Analytics** - Track installation prompts, clicks, and success rates
- **Installation Settings** - Customize prompt behavior and preferences

### ⚙️ Customization
- **Custom Statuses** - Define your own application statuses
- **Custom Stages** - Create personalized interview stages
- **Drag & Drop Reordering** - Organize your custom lists with intuitive drag & drop
- **Persistent Settings** - All customizations saved to local storage
- **Theme Consistency** - Beautiful dark theme with blue accents throughout

## 📈 Current Status

**Latest Updates (v1.3.0):**
- ✅ **Admin Panel** - Complete admin panel with PWA installation analytics dashboard
- ✅ **PWA Installation System** - Cross-platform installation prompts and comprehensive tracking
- ✅ **Installation Analytics** - Real-time metrics, funnel charts, and platform/browser breakdown
- ✅ **Enhanced Accessibility** - ARIA attributes, keyboard navigation (Alt+A), screen reader support
- ✅ **Export & Reset** - Analytics data export in JSON/CSV/Summary formats with reset functionality
- ✅ **Responsive Design** - Mobile, tablet, desktop optimized admin panel
- ✅ **Application Source Tracking** - Comprehensive tracking of job application sources with analytics
- ✅ **Source Performance Analytics** - Interview rates by platform for strategic job search optimization
- ✅ **Service Worker Implementation** - Full offline capability with intelligent caching strategies
- ✅ **Advanced Analytics Export** - Multiple export formats with comprehensive metrics and insights

**Project Health:**
- **Code Quality**: Excellent - Modern practices, modular architecture, comprehensive error handling
- **Accessibility**: WCAG 2.1 AA compliant with full keyboard navigation and screen reader support
- **Performance**: Optimized with Service Worker caching, lazy loading, and efficient data structures
- **Offline Support**: Complete offline functionality with intelligent cache management
- **PWA Ready**: Progressive Web App with manifest, Service Worker, and offline-first design
- **Browser Support**: Modern browsers with Service Worker, Web Crypto API, and ES6+ support

## 🚀 Quick Start

1. **Download or Clone**
   ```bash
   git clone https://github.com/thehar/job-tracker.git
   cd job-tracker
   ```

2. **Open in Browser**
   - Simply open `index.html` in any modern web browser
   - No installation, no build process, no dependencies

3. **Set Your Password**
   - On first visit, create a secure password
   - This encrypts and protects your job data

4. **Start Tracking**
   - Add your first job application
   - Explore the dashboard and weekly reports
   - Import existing data via CSV if needed

## 📱 Browser Compatibility

- **Chrome** 88+ ✅
- **Firefox** 85+ ✅
- **Safari** 14+ ✅
- **Edge** 88+ ✅

**Required Features:**
- Service Worker API (for offline functionality and PWA features)
- Web Crypto API (for password hashing and security)
- Local Storage (for data persistence)
- Modern JavaScript (ES6+, async/await, classes)
- CSS Grid & Flexbox support
- Fetch API (for network requests and caching)
- File API (for CSV import/export)
- Clipboard API (for copy functionality with fallbacks)

## 🏗️ Project Structure

```
job-tracker/
├── index.html              # Main application HTML with PWA features
├── styles.css              # All application styles (1500+ lines, well-organized)
├── sw.js                   # Service Worker for offline functionality and caching
├── manifest.json           # PWA manifest for app installation and branding
├── js/                     # Modular JavaScript architecture (15 files)
│   ├── app.js              # Application entry point, SW registration, PWA installation
│   ├── auth.js             # Authentication management and security
│   ├── data.js             # Data management utilities and localStorage
│   ├── csv.js              # CSV import/export functionality
│   ├── job-tracker.js      # Main job tracking CRUD operations
│   ├── dashboard.js        # Analytics, Chart.js visualizations, admin panel
│   ├── settings.js         # Settings, customization, PWA installation preferences
│   ├── weekly-report.js    # Weekly report generation and analysis
│   ├── notifications.js    # User notification system
│   ├── advanced-analytics.js # Advanced export and analytics features
│   ├── cross-platform-detector.js # Cross-platform detection for PWA installation
│   ├── install-analytics.js # PWA installation analytics tracking
│   ├── install-prompt-ui.js # Installation prompt UI components
│   ├── pwa-install.js      # PWA installation manager and handlers
│   └── tests/              # Comprehensive test suite (10 test files)
├── .cursor/                # Cursor AI development rules
├── .kiro/                  # Kiro AI steering rules and configuration
├── sample_import.csv       # Sample CSV for testing imports
├── CHANGELOG.md            # Project change history
├── CONTRIBUTING.md         # Contribution guidelines
├── LICENSE                 # MIT License
└── README.md              # This file
```

## 💻 Development

### Code Organization
- **Modular Architecture** - Each feature in its own JavaScript file
- **Clean Separation** - Data, UI, and business logic separated
- **ES6 Classes** - Modern JavaScript class-based organization
- **Event-Driven** - Loose coupling through event delegation
- **CSS Architecture** - Well-organized, responsive CSS with proper property ordering

### Key Classes
- `AuthManager` - Handles authentication and security
- `JobTracker` - Core job CRUD operations
- `Dashboard` - Analytics, visualization, and admin panel management
- `DataManager` - Data utilities and validation
- `CsvManager` - Import/export functionality
- `SettingsManager` - User preferences, customization, and PWA settings
- `WeeklyReportManager` - Report generation and analysis
- `AdvancedAnalyticsExporter` - Multi-format export and advanced analytics
- `NotificationManager` - Toast notifications and user feedback
- `PWAInstallManager` - PWA installation prompts and management
- `InstallAnalytics` - Installation analytics tracking and metrics
- `CrossPlatformDetector` - Platform detection for installation prompts
- `InstallPromptUI` - Installation prompt UI components
- **Service Worker** - Offline caching, intelligent strategies, and PWA functionality

### Accessibility Features
- **ARIA Labels** - Proper screen reader support
- **Keyboard Navigation** - Full keyboard accessibility
- **Semantic HTML** - Meaningful HTML structure
- **Color Contrast** - WCAG compliant color schemes
- **Responsive Design** - Works on all device sizes
- **Screen Reader Support** - Hidden text and skip links for accessibility

## 🔧 Customization

### Adding Custom Statuses
1. Go to Settings (gear icon)
2. Click "Statuses" tab
3. Add, edit, or reorder your custom statuses
4. Save changes

### Adding Custom Stages
1. Go to Settings
2. Click "Stages" tab  
3. Add, edit, or reorder your interview stages
4. Save changes

### CSV Import Format
Your CSV should include these columns:
```csv
title,company,status,stage,dateApplied,contactPerson,notes,createdAt
```

See `sample_import.csv` for a complete example.

### Offline Usage
1. **First Visit** - Load the app while online to cache all assets
2. **Go Offline** - Disconnect from internet or use airplane mode
3. **Full Functionality** - All features work normally offline
4. **Cache Management** - Use Settings > Offline tab to manage cache
5. **Automatic Sync** - Changes sync automatically when back online

### 📍 Application Source Tracking
- **Source Field** - Track where each application comes from (LinkedIn, Indeed, Company Website, etc.)
- **Top Source Metric** - See your most-used application platform at a glance
- **Source Distribution Chart** - Visual breakdown of applications by source
- **Source Performance Analytics** - Interview rates by platform to optimize your strategy
- **9 Predefined Sources** - LinkedIn, Indeed, Company Website, Glassdoor, AngelList, Referral, Recruiter, Job Fair, Other
- **Strategic Insights** - Data-driven decisions on where to focus your job search efforts

### 🎯 Advanced Analytics & Export
- **Multiple Export Formats** - CSV, JSON, Analytics Reports, Summary Reports
- **Advanced Metrics** - Response times, application velocity, source performance
- **Trend Analysis** - Monthly comparisons, performance insights
- **Company Performance** - Track success rates by company
- **Interactive Export Modal** - Choose format and download or copy to clipboard

## 🚧 Future Enhancements

- [ ] **Data Sync** - Optional cloud backup (keeping privacy focus)
- [ ] **Email Integration** - Direct integration with email services
- [ ] **Calendar Integration** - Sync interview dates with calendar apps
- [ ] **AI Insights** - Machine learning-powered job market insights
- [ ] **Background Sync** - Sync data changes when connection restored
- [ ] **Push Notifications** - Interview reminders and follow-up alerts
- [ ] **Teams Support** - Collaborative job tracking for groups
- [ ] **Export Formats** - Additional export options (PDF, Excel)
- [x] **App Installation** - Enhanced PWA installation prompts with analytics

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork the Repository**
2. **Create a Feature Branch** (`git checkout -b feature/amazing-feature`)
3. **Commit Changes** (`git commit -m 'Add amazing feature'`)
4. **Push to Branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Development Guidelines
- **Vanilla JS Only** - No frameworks or heavy dependencies
- **Mobile First** - Design for mobile, enhance for desktop
- **Accessibility** - Follow WCAG 2.1 guidelines
- **Performance** - Keep it fast and lightweight
- **Documentation** - Comment your code and update README
- **CSS Standards** - Follow alphabetical property ordering and modern CSS practices

### Code Style
- Use ES6+ features where supported
- Follow consistent naming conventions
- Add JSDoc comments for public methods
- Test across multiple browsers
- Maintain CSS property alphabetical ordering
- Use semantic HTML and proper accessibility attributes

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Chart.js** - Beautiful charts and visualizations
- **Web Crypto API** - Secure client-side encryption
- **Modern Browser APIs** - File API, Clipboard API, Local Storage
- **Cursor** - Barebones generated using Cursor: see PROMPT.md
- **CSS Linting Tools** - For [CSS maintaining code quality and standards](https://github.com/CSSLint/csslint)

## 📞 Support

- **Issues** - Report bugs or request features via GitHub Issues
- **Contributions** - Pull requests and improvements welcome

## 🎨 Design Features

- **Dark Theme** - Easy on the eyes with blue accent colors
- **Responsive Layout** - Works perfectly on desktop, tablet, and mobile
- **Modern UI** - Clean, professional interface with smooth animations
- **Accessibility First** - Built with screen readers and keyboard navigation in mind

---

**Made with ❤️ for job seekers everywhere. Good luck with your search! 🎯**