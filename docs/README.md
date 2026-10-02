# EG1 Platform - Technical Documentation Hub (`docs/`)

Welcome to the technical documentation for the **EG1** web platform ([eg1.in](https://www.eg1.in)).

---

## 📂 Documentation Directory Structure

```
docs/
├── README.md                          # Master public documentation index (this file)
└── pages/                             # Granular specifications for active public pages
    ├── details-home.md                # Home page (index.html) architecture
    ├── details-apps.md                # Applications catalog & detail view (apps.html)
    ├── details-blog.md                # Technical blog engine (blog.html)
    ├── details-about.md               # About page (about.html)
    ├── details-contact.md             # Contact form & anti-spam CAPTCHA (contact.html)
    ├── details-updates.md             # Updates & release log timeline (updates.html)
    ├── details-download.md            # Software download portal (download.html)
    └── details-privacy.md             # Privacy policy & consent controls (privacypolicy.html)
```

---

## 🧭 Public Pages Documentation

- 🏠 **[Home Page (index.html)](pages/details-home.md)**: Dynamic announcement banner, carousel slider, 1-hour TTL LocalStorage caching.
- 📦 **[Applications Showcase (apps.html)](pages/details-apps.md)**: Product catalog, dynamic dual-action buttons, and 3-tier versioning.
- 📝 **[Technical Blog (blog.html)](pages/details-blog.md)**: Pure Markdown reader, fluid typography, Highlight.js syntax highlighting, and static SEO routing.
- ℹ️ **[About Page (about.html)](pages/details-about.md)**: Platform mission, open-source approach, and dynamic content resolution.
- 📬 **[Contact Portal (contact.html)](pages/details-contact.md)**: Rate-limiting sliding window and arithmetic anti-spam CAPTCHA challenge.
- 🔔 **[Updates Timeline (updates.html)](pages/details-updates.md)**: Version 3.0.0 release log, JSON data schema, and notification bell popover synchronization.
- 📥 **[Downloads Portal (download.html)](pages/details-download.md)**: Installer download resolution and dynamic back-button routing.
- 🔒 **[Privacy Policy (privacypolicy.html)](pages/details-privacy.md)**: Telemetry opt-out consent banner controls and anonymous telemetry policies.

---

## 🛠️ Build & Quality Verification

All quality audits, link checkers, and static page compilers live in [`automation-scripts/`](../automation-scripts/README.md):

```bash
# Run all pre-deploy audits and page generators in a single command:
E:/ALL/CODE/PYTHON/TestPy/.venv/Scripts/python.exe automation-scripts/run_all_checks.py
```
