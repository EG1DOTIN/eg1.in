# EG1 Public Data Stores (`public/data/`)

This directory contains the primary static JSON databases feeding the `eg1.in` web portal.

---

## 🗄️ JSON Files & Schemas

### 1. `apps.json` — Applications & Projects Catalog
Contains an array of applications featured across the homepage and the `/apps` catalog.
```json
{
  "id": "pyegclamui",
  "name": "pyEGClamUI",
  "category": "Security",
  "description": "An open-source desktop GUI for the ClamAV antivirus engine built with Python and PySide6.",
  "status": "Production",
  "version": "3.2.0",
  "tags": ["Security", "Desktop", "ClamAV", "PySide6"],
  "product_type": "DesktopApp",
  "webapp_link": "",
  "attach_upload_file_1": "https://github.com/EG1DOTIN/pyEGClamUI/releases",
  "markdownBody": "### Features\n- Real-time scanning..."
}
```

### 2. `website_content.json` — Technical Blog & Announcements
Stores the 47+ technical blog posts and announcements.
```json
{
  "announcements": [
    {
      "id": "1",
      "title": "Welcome to EG1 v4",
      "date": "October 2026",
      "content": "Announcement summary..."
    }
  ],
  "blog_posts": [
    {
      "id": "70",
      "title": "Dual-Tier Adaptive Architecture in Python",
      "date": "October 2026",
      "category": "Architecture",
      "author": "EG1",
      "summary": "Building resilient GUIs across modern and legacy hardware.",
      "readTime": "6 min read",
      "markdown": "## Guide Body\n\nFull markdown content..."
    }
  ]
}
```

### 3. `updates.json` — Product Changelog & Releases
Feeds the `/updates` release timeline and the header notification bell.
```json
{
  "id": "v4-0-0",
  "title": "EG1 Portal v4.0.0 Architecture Overhaul",
  "date": "October 2026",
  "badge": "Major Release",
  "badgeType": "emerald",
  "summary": "Complete rebuild with React 18, Vite, and eg-web-core modular architecture.",
  "link": "updates#v4-0-0"
}
```
