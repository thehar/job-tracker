# 📊 Job Tracker

A modern, client-side job application tracking system with analytics, CSV import/export, and weekly reporting features. Built with vanilla HTML, CSS, and JavaScript - no frameworks, no backend required.

![Job Tracker Screenshot](https://via.placeholder.com/800x400/0a1929/e8f4fd?text=Job+Tracker+Dashboard)

## ✨ Features

### 🎯 Core Job Tracking
- **Add, Edit, Delete Jobs** - Complete CRUD operations for job applications
- **Rich Job Details** - Title, Company, Status, Stage, Date Applied, Contact Person, Notes
- **Status & Stage Tracking** - Monitor your application progress through customizable stages
- **Smart Filtering** - Filter applications by status or view all at once

### 📈 Analytics Dashboard
- **Interactive Charts** - Status distribution, stage breakdown, timeline, and success metrics
- **Summary Cards** - Total applications, success rate, active applications, and more
- **Company Status** - Track current status for each company you've applied to
- **Visual Insights** - Beautiful Chart.js visualizations with responsive design

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
- **Offline Capable** - Works completely offline, no internet required

### ⚙️ Customization
- **Custom Statuses** - Define your own application statuses
- **Custom Stages** - Create personalized interview stages
- **Drag & Drop Reordering** - Organize your custom lists with intuitive drag & drop
- **Persistent Settings** - All customizations saved to local storage

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
- Web Crypto API (for password hashing)
- Local Storage (for data persistence)
- Modern JavaScript (ES6+)

## 🏗️ Project Structure

```
job-tracker/
├── index.html              # Main application HTML
├── styles.css              # All application styles
├── js/
│   ├── app.js              # Application entry point
│   ├── auth.js             # Authentication management
│   ├── data.js             # Data management utilities
│   ├── csv.js              # CSV import/export functionality
│   ├── job-tracker.js      # Main job tracking logic
│   ├── dashboard.js        # Analytics and dashboard
│   ├── settings.js         # Settings and customization
│   ├── weekly-report.js    # Weekly report generation
│   └── notifications.js    # User notification system
├── sample_import.csv       # Sample CSV for testing imports
└── README.md              # This file
```

## 💻 Development

### Code Organization
- **Modular Architecture** - Each feature in its own JavaScript file
- **Clean Separation** - Data, UI, and business logic separated
- **ES6 Classes** - Modern JavaScript class-based organization
- **Event-Driven** - Loose coupling through event delegation

### Key Classes
- `AuthManager` - Handles authentication and security
- `JobTracker` - Core job CRUD operations
- `Dashboard` - Analytics and visualization
- `DataManager` - Data utilities and validation
- `CsvManager` - Import/export functionality
- `SettingsManager` - User preferences and customization
- `WeeklyReportManager` - Report generation and analysis

### Accessibility Features
- **ARIA Labels** - Proper screen reader support
- **Keyboard Navigation** - Full keyboard accessibility
- **Semantic HTML** - Meaningful HTML structure
- **Color Contrast** - WCAG compliant color schemes
- **Responsive Design** - Works on all device sizes

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

## 🚧 Future Enhancements

- [ ] **Service Worker** - Full offline capability with caching
- [ ] **Data Sync** - Optional cloud backup (keeping privacy focus)
- [ ] **Email Integration** - Direct integration with email services
- [ ] **Calendar Integration** - Sync interview dates with calendar apps
- [ ] **AI Insights** - Advanced analytics and job market insights
- [ ] **Mobile App** - React Native or PWA mobile application
- [ ] **Teams Support** - Collaborative job tracking for groups

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

### Code Style
- Use ES6+ features where supported
- Follow consistent naming conventions
- Add JSDoc comments for public methods
- Test across multiple browsers

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Chart.js** - Beautiful charts and visualizations
- **Web Crypto API** - Secure client-side encryption
- **Modern Browser APIs** - File API, Clipboard API, Local Storage
- **Cursor** - Barebones generated using Cursor: see PROMPT.md

## 📞 Support

- **Issues** - Report bugs or request features via GitHub Issues

---

**Made with ❤️ for job seekers everywhere. Good luck with your search! 🎯**