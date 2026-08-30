# EG1 - Official Website & Digital Platform

[![Website](https://img.shields.io/badge/Website-eg1.in-0284c7?style=flat-square&logo=google-chrome&logoColor=white)](https://www.eg1.in)
[![Version](https://img.shields.io/badge/Version-3.0.0-10b981?style=flat-square)](updates.html)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

**EG1** ([eg1.in](https://www.eg1.in)) is a personal hobby platform for open source and creative digital projects, presenting practical engineering software/tools, interactive web applications for real-world use and technical articles/blog posts.

---

## 🚀 Version 3.0.0 Highlights

| Feature | Description |
| :--- | :--- |
| **🎨 Dual Theme System** | High-contrast Light Gray and Dark Gray themes with instant zero-flicker loading and persistent preference memory. |
| **🔔 Changelog & Notification Center** | Real-time updates dropdown with unread badge tracking, animated alerts, and category filtering. |
| **📱 Mobile-First Responsive Design** | Fluid layouts, optimized touch targets, and sticky navigation tailored for mobile, tablet, and desktop viewports. |
| **⚡ Fast Content Loading** | Instant page interactions, optimized vector icons, and streamlined reading experiences. |

---

## 🗺️ Website Navigation & Visitor Flow

```mermaid
flowchart TD
    Visitor(["Visitor Enters eg1.in"]) --> Home["Home Page (index.html)"]

    subgraph GlobalShell["Shared Website Shell"]
        Header["Header & Theme Switcher (Light / Dark)"]
        NotificationCenter["Notification Bell & Updates Dropdown"]
        Footer["Footer & Social Channels"]
    end

    Home --> GlobalShell

    Header --> NavHome["Home Page"]
    Header --> NavApps["Applications Catalog"]
    Header --> NavUpdates["Changelog & Releases"]
    Header --> NavBlog["Technical Blog"]
    Header --> NavAbout["About Platform"]
    Header --> NavContact["Contact Portal"]

    NavApps -->|"Explore Tools"| AppCatalog["Software & Web Apps Showcase"]
    NavUpdates -->|"Filter Updates"| UpdateTimeline["Categorized Platform Releases"]
    NavBlog -->|"Search & Read"| BlogArticles["Categorized Tutorials & Code Guides"]
    NavContact -->|"Send Message"| ContactForm["Interactive Visitor Message Form"]
    Footer --> PrivacyPage["Privacy Policy (privacypolicy.html)"]
```

## 📄 Website Pages Directory

| Page | File | Description & Key Features |
| :--- | :--- | :--- |
| **Home** | [`index.html`] | Main landing page featuring an animated slideshow banner, quick access to featured software. |
| **Apps** | [`apps.html`] | Showcase of open-source digital projects/Software/applications. |
| **Blog** | [`blog.html`] | Multi-mode technical blog with keyword search, category filtering, code syntax highlighting, and article reader. |
| **Contact** | [`contact.html`] | Visitor communication portal featuring an interactive contact form with math-based anti-spam verification. |
| **About** | [`about.html`] | Overview of the EG1 platform, vision, mission, and open-source research background. |
| **Privacy Policy** | [`privacypolicy.html`] | Comprehensive privacy terms, cookies information, data protection guidelines, and user rights. |

---

## 📜 License & Legal Notice

This project is licensed under the terms of the **MIT License**. See the [LICENSE](LICENSE) file for complete details.
