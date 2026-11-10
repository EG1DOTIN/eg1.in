# EG1 Public Data Stores (`public/data/`)

This directory contains the primary static JSON databases feeding the `eg1.in` web portal.

---

## 🗄️ Datasets & Schemas

### 1. `apps/*.md` — Applications & Projects Catalog (Modular Markdown)
Each application is defined as an individual Markdown file in `public/data/apps/<app-slug>.md` with YAML frontmatter.
```yaml
---
id: "pyegclamui"
name: "pyEGClamUI"
slug: "pyegclamui"
category: "Security/Tools"
product_type: "Desktop App"
version:
  version-string: "3.2.0"
  fetch-github: "false"
active: "1"
createdAt: "2026-10-01T00:00:00+05:30"
updatedAt: "2026-11-10T17:09:50.021856+05:30"
icon: "./assets/img/apps/egav.png"
short_description: "An open-source, cross-platform desktop GUI for ClamAV antivirus engine. Built with Python and PySide6 (Qt)."
---
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
