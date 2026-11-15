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

### 2. `blog/id*.md` — Technical Blog Articles (Modular Markdown)
Each technical blog post is stored as an individual Markdown article in `public/data/blog/id<id>.md` (e.g. `id70.md`) with YAML frontmatter:
```yaml
---
id: "70"
title: "Getting Started with Python AsyncIO"
heading: "Getting Started with Python AsyncIO"
category: "Python"
tags: ["Python", "AsyncIO", "Tutorials"]
author: "EG1"
createdAt: "2026-08-30"
release_date: "2026-08-30"
updatedAt: "2026-08-30T12:00:00.000Z"
output_image: "assets/img/blog/id70.webp"
short_description: "Learn how to use async/await in Python to build high-concurrency applications."
end_description: ""
metaKeyword: "NA"
metaDescription: "Learn how to use async/await in Python to build high-concurrency applications."
active: "1"
---

# Introduction to AsyncIO
...
```

### 3. `blog-index.json` — Pre-Indexed Blog Dataset (0 Firestore Reads)
Pre-indexes all 47+ articles for instant page rendering, tag filtering, and pagination without individual network queries:
```json
[
  {
    "id": "70",
    "slug": "getting-started-with-python-asyncio",
    "title": "Getting Started with Python AsyncIO",
    "description": "Learn how to use async/await in Python to build high-concurrency applications.",
    "content": "# Introduction to AsyncIO\n...",
    "date": "2026-08-30",
    "author": "EG1",
    "tags": ["Python", "AsyncIO", "Tutorials"],
    "readingTime": "1 min read"
  }
]
```

### 4. `website_content.json` — Static Page Snippets & SEO Metadata
Stores static page content templates (such as `pages.homepage`, `pages.about`, `pages.contact`) and default SEO metadata.

### 5. `updates.json` — Product Changelog & Releases
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

---

## 📖 Step-by-Step Guides
For complete step-by-step procedures to add applications, blog articles, and release updates, refer to the [Developer Guide](../../docs/DEVELOPER_GUIDE.md#3-procedure-content-management-apps-blogs--updates).
