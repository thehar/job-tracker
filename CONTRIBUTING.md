# Contributing to Job Tracker

Thank you for your interest in contributing to Job Tracker! We welcome contributions from developers of all skill levels.

## 🚀 Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/thehar/job-tracker.git
   cd job-tracker
   ```
3. **Open `index.html`** in your browser to test the application
4. **Make your changes** and test thoroughly
5. **Submit a pull request**

## 📋 Development Guidelines

### Code Style
- **Vanilla JavaScript** - No frameworks or heavy dependencies
- **ES6+ Features** - Use modern JavaScript where supported by target browsers
- **Consistent Naming** - Use camelCase for variables and functions, PascalCase for classes
- **Documentation** - Add JSDoc comments for public methods and classes
- **Accessibility** - Follow WCAG 2.1 AA guidelines

### File Organization
- **Modular Structure** - Keep related functionality in separate files
- **Clear Separation** - Separate data, UI, and business logic
- **Single Responsibility** - Each class/function should have one clear purpose

### Browser Support
Target browsers:
- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

Required APIs:
- Web Crypto API
- Local Storage
- File API
- Clipboard API (with fallbacks)

## 🐛 Reporting Bugs

When reporting bugs, please include:

1. **Clear description** of the issue
2. **Steps to reproduce** the problem
3. **Expected behavior** vs actual behavior
4. **Browser and version** information
5. **Screenshots** if applicable
6. **Console errors** if any

## 💡 Feature Requests

For new features:

1. **Check existing issues** to avoid duplicates
2. **Describe the problem** the feature would solve
3. **Explain your proposed solution** with examples
4. **Consider alternatives** and their trade-offs
5. **Think about implementation** complexity and browser support

## 🔧 Pull Request Process

1. **Create a feature branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** with clear, focused commits:
   ```bash
   git commit -m "Add: feature description"
   git commit -m "Fix: bug description"
   git commit -m "Update: documentation/refactor description"
   ```

3. **Test thoroughly**:
   - Test on multiple browsers
   - Verify accessibility with screen readers
   - Check mobile responsiveness
   - Test with and without data

4. **Update documentation** if needed:
   - Update README.md for new features
   - Add JSDoc comments for new methods
   - Update CHANGELOG.md

5. **Submit your pull request**:
   - Use a clear, descriptive title
   - Reference any related issues
   - Describe changes and testing performed
   - Include screenshots for UI changes

## 🎨 UI/UX Guidelines

### Design Principles
- **Mobile First** - Design for mobile, enhance for desktop
- **Accessibility** - Usable by everyone, including assistive technologies
- **Performance** - Fast and responsive interactions
- **Consistency** - Follow established patterns and styling

### Color and Theme
- Maintain the dark blue theme (`#0a1929` primary background)
- Use the established color palette for consistency
- Ensure sufficient color contrast (WCAG AA compliance)
- Support for future light mode theme

### Components
- Follow existing component patterns
- Use semantic HTML elements
- Include proper ARIA labels and roles
- Maintain keyboard navigation support

## 🧪 Testing

### Manual Testing Checklist
- [ ] Authentication flow works correctly
- [ ] Job CRUD operations function properly
- [ ] CSV import/export works with sample data
- [ ] Dashboard charts render correctly
- [ ] Weekly reports generate accurately
- [ ] Settings save and load properly
- [ ] All forms validate correctly
- [ ] Responsive design works on mobile
- [ ] Keyboard navigation is functional
- [ ] Screen reader accessibility works

### Browser Testing
Test your changes in:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

### Performance Testing
- Check application startup time
- Verify smooth interactions with large datasets
- Test offline functionality
- Monitor memory usage

## 📚 Code Examples

### Adding a New Feature
```javascript
/**
 * Example feature class following project patterns
 */
class NewFeature {
    constructor(dependencies) {
        this.dependency = dependencies;
        this.setupEventListeners();
    }

    /**
     * Setup event listeners for the feature
     */
    setupEventListeners() {
        // Event listener setup
    }

    /**
     * Public method with JSDoc documentation
     * @param {string} param - Description of parameter
     * @returns {Object} Description of return value
     */
    publicMethod(param) {
        // Implementation
    }
}
```

### Adding UI Components
```html
<!-- Semantic HTML with accessibility -->
<section role="region" aria-labelledby="section-title">
    <h2 id="section-title">Section Title</h2>
    <form role="form" aria-labelledby="form-title">
        <div class="form-group">
            <label for="input-id">Label Text</label>
            <input type="text" id="input-id" name="input-name" 
                   required aria-describedby="input-help">
            <div id="input-help" class="sr-only">Help text for screen readers</div>
        </div>
    </form>
</section>
```

## 🏆 Recognition

Contributors will be recognized in:
- README.md contributors section
- CHANGELOG.md for significant contributions
- GitHub contributor graphs
- Special mentions for major features

## 📞 Getting Help

- **GitHub Issues** - For bugs and feature requests
- **Code Review** - Maintainers will provide feedback on pull requests

## 📝 License

By contributing to Job Tracker, you agree that your contributions will be licensed under the MIT License.

---

Thank you for helping make Job Tracker better for everyone! 🎉
