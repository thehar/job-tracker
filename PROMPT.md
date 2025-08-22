## 🧱 **Project Overview**

**Goal**: A privacy-focused, mobile-friendly job tracker web app using **pure HTML, JavaScript, and CSS**. Data is stored in `localStorage`. Includes CSV import/export, analytics dashboard, password protection, and weekly email summaries.

---

# 🔨 Phase-by-Phase Breakdown

---

### ✅ **Phase 1: Project Structure & Basic Job Tracker**

**Prompt**:

> Build the foundation for a personal job tracking app using only HTML, CSS, and JavaScript.
>
> Requirements:
>
> * Create a homepage (`index.html`) that displays a list of job applications.
> * Each job includes:
>
>   * Title
>   * Company
>   * Status
>   * Date Applied
>   * Contact Person
>   * Notes
>   * Stage
> * Add a form to add a new job.
> * Store jobs in `localStorage`.
> * Render the job list dynamically from stored data.
>
> UI:
>
> * Use CSS Grid or Flexbox for layout.
> * Make it mobile responsive.
>
> No authentication or analytics yet. Keep the JS modular and clean.

---

### 🔐 **Phase 2: Basic Password Authentication**

**Prompt**:

> Add basic password authentication to the job tracker.
>
> Requirements:
>
> * On app load, check if the user is logged in.
> * If not, show a password prompt.
> * Store a hashed password in `localStorage` (use SHA-256 via Web Crypto API).
> * On correct password entry, store a session flag in `localStorage`.
> * Add a "Log out" option.
> * Allow changing the password in a settings section.
>
> Do not use external auth libraries. Keep everything client-side.

---

### 📄 **Phase 3: CSV Import and Export**

**Prompt**:

> Add CSV import and export functionality to the job tracker app.
>
> Requirements:
>
> * CSV Import:
>
>   * Add a file upload field
>   * Parse CSV (assume fields match the internal schema)
>   * Validate fields: title, company, status, dateApplied, contactPerson, notes, stage
>   * Deduplicate jobs based on title + company
> * CSV Export:
>
>   * Add a button to download the current job data as a CSV file
>
> Use the browser File API and Blob API. Use no external libraries unless necessary.

---

### 📊 **Phase 4: Analytics Dashboard**

**Prompt**:

> Add a dashboard page that displays analytics about the job applications using Chart.js.
>
> Requirements:
>
> * Use Chart.js via CDN
> * Visualizations to include:
>
>   * Total number of applications
>   * Success/fail rate (based on status values like "Offer", "Rejected")
>   * Count of jobs by stage/status
>   * Jobs over time (line chart using `dateApplied`)
> * Keep the dashboard responsive for mobile
> * Fetch all data from `localStorage`

---

### ⚙️ **Phase 5: Settings Panel & Customizable Status/Stages**

**Prompt**:

> Add a settings panel where the user can:
>
> * Customize the list of statuses and stages
> * Save these preferences in `localStorage`
> * Modify the add/edit job form to use the custom statuses/stages
>
> Bonus:
>
> * Allow reordering of stages via drag-and-drop (optional)

---

### 📬 **Phase 6: Weekly Summary Email Generator**

**Prompt**:

> Add a weekly summary feature to the job tracker.
>
> Requirements:
>
> * Analyze job data to find:
>
>   * Applications added in the past 7 days
>   * Changes in status
>   * Updated statistics (applied, interviews, offers, etc.)
> * Format this as a plain text summary
> * Add a button to:
>
>   * Copy the summary to clipboard
>   * Open the user's email client with a `mailto:` link containing the summary
>   * Optionally integrate with EmailJS to send the summary
>
> Everything should remain client-side and work offline (except EmailJS, if used).

---

## 🧩 Optional Final Phase: Polish and Cleanup

**Prompt**:

> Clean up the codebase:
>
> * Organize JavaScript into modular files (e.g., `auth.js`, `data.js`, `dashboard.js`, etc.)
> * Use semantic HTML and accessibility best practices
> * Ensure mobile responsiveness and cross-browser compatibility
> * Add comments and documentation
> * Prepare for GitHub open-source release with a README

---
