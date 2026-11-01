# Pages & Features Guide — EG1 Portal

Comprehensive guide to each application page and view implemented in [`eg1.in`](../src/pages/).

---

## 🗺️ Page Implementation Matrix

| File | Route | Focus | Key Components Consumed |
| :--- | :--- | :--- | :--- |
| [`HomePage.tsx`](../src/pages/HomePage.tsx) | `/`, `index.html` | Hero, Catalog & News | `ImageSlider`, `Button`, `Badge` |
| [`AppsPage.tsx`](../src/pages/AppsPage.tsx) | `apps.html` | Application Catalog | `MarkdownViewer`, `Button`, `Modal` |
| [`BlogPage.tsx`](../src/pages/BlogPage.tsx) | `blog.html` | 47 Technical Blogs | `MarkdownViewer`, `DataCache` |
| [`UpdatesPage.tsx`](../src/pages/UpdatesPage.tsx) | `updates.html` | Changelog Timeline | `Badge`, `DataCache` |
| [`AboutPage.tsx`](../src/pages/AboutPage.tsx) | `about.html` | Company Mission | `Eg1Logo`, `Container` |
| [`ContactPage.tsx`](../src/pages/ContactPage.tsx) | `contact.html` | Inquiries & Anti-Spam | `ContactForm`, Firestore client |
| [`PrivacyPolicyPage.tsx`](../src/pages/PrivacyPolicyPage.tsx) | `privacypolicy.html` | GDPR & Privacy Disclosures | `ConsentControl` |
| [`AdminPage.tsx`](../src/pages/AdminPage.tsx) | `admin.html`, `/admin` | 2FA Management Console | `AdminAuthGuard`, `AdminLayout`, `AdminAnalyticsView`, `AdminMessagesView`, `AdminBlogEditor` |

---

## 1. Home Page (`HomePage.tsx`)

The landing page provides an immediate interactive introduction to the EG1 ecosystem:
- **Hero Image Slider**: Utilizes [`ImageSlider`](https://github.com/EG1DOTIN/eg-web-core/blob/main/docs/layout-components.md) with crystal glassmorphism styling, automated slide rotation, dot indicators, and direct CTA actions.
- **Featured Applications Showcase**: Displays top applications loaded via `useProducts('data/apps.json')` with platform badges and launch buttons.
- **Latest Updates & News**: Presents recent highlights loaded via `useNews('data/website_content.json')`.
- **Dynamic About Excerpt**: Pulls company summary excerpt with `Read more →` navigation to `about.html`.

---

## 2. Applications Catalog (`AppsPage.tsx`)

A dedicated software showcase:
- **Category Filter Tabs**: Allows visitors to toggle between *All Applications*, *Desktop Tools*, *Web Apps*, and *Games*.
- **Detailed Specifications**: Displays versioning, platform compatibility badges (Linux, Windows, Web), and repository links.
- **Markdown Descriptions**: Ingests detailed application overview documents from `data/apps/*.md` via [`DataCache`](https://github.com/EG1DOTIN/eg-web-core/blob/main/docs/hooks-and-services.md).

---

## 3. Technical Blog & Tutorials (`BlogPage.tsx`)

The technical article archive featuring 47 migrated Markdown tutorials:
- **Dynamic Content Loading**: Articles are stored as structured `.md` files in `public/data/blog/` and cataloged in `blog-index.json`.
- **Search & Taxonomy**: Instant real-time title/content search and category filtering (*Programming, Tutorial, Architecture, Security, Announcements*).
- **Hardened Rendering**: Powered by [`MarkdownViewer`](https://github.com/EG1DOTIN/eg-web-core/blob/main/docs/domain-modules.md) with syntax highlighting and automatic DOMPurify sanitization.
- **Reading Time Indicator**: Computes estimated reading time based on article word count.

---

## 4. Updates & Changelog (`UpdatesPage.tsx`)

A clean chronological release history:
- **Data Source**: Loaded dynamically from `data/updates.json`.
- **Version Taxonomy**: Categorizes releases with visual badges (*Major Release, Enhancement, Bugfix, Security Advisory*).
- **Anchor Linking**: Supports deep linking directly to specific release notes (e.g., `#v2-4-0`).

---

## 5. About Us Page (`AboutPage.tsx`)

The company background and founder journey:
- **Interactive Journey Timeline**: Chronological milestones tracking the development of EG1 from initial open-source releases to the modern platform.
- **Mission Statement**: Core values emphasizing security, high-performance web engineering, and open-source contributions.
- **Technology Stack Grid**: Interactive showcase of modern technologies used across the EG1 ecosystem.

---

## 6. Contact Us & Anti-Spam (`ContactPage.tsx`)

Secure contact and inquiry interface:
- **Anti-Spam Math CAPTCHA**: Procedurally generated math challenges preventing automated bot submissions.
- **Input Validation**: Real-time email syntax and field length validation.
- **Firestore Direct Dispatch**: Writes sanitized inquiries to the `messages` collection for administrator review.

---

## 7. Privacy Policy (`PrivacyPolicyPage.tsx`)

Complete privacy and data handling disclosures:
- **GDPR & CCPA Compliance**: Transparent breakdown of data collection practices, anonymous telemetry, and third-party services.
- **Cookie & Telemetry Controls**: Interactive toggle allowing users to opt in or opt out of anonymous analytics tracking.

---

## 8. Admin Console (`AdminPage.tsx`)

Hardened management suite isolated from public layout:
- **Authentication**: Protected by [`AdminAuthGuard`](https://github.com/EG1DOTIN/eg-web-core/blob/main/docs/admin-suite.md) with Google OAuth whitelist (`eg1dotin@gmail.com`) and 16-digit salted SHA-256 PIN.
- **Branded Layout**: Responsive [`AdminLayout`](https://github.com/EG1DOTIN/eg-web-core/blob/main/docs/admin-suite.md) with collapsible sidebar, user avatar, and light/dark theme switcher.
- **Integrated Views**:
  - **Visitor Analytics**: Multi-domain telemetry grid consuming 50-record bucket documents.
  - **Contact Inquiries**: Review and manage messages submitted via the contact form.
  - **Article Editor**: Live split-screen Markdown authoring studio with frontmatter generator.
- **Exit Action**: Header button allowing one-click return to `index.html`.
