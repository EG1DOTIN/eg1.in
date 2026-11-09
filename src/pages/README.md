# EG1 Pages Directory (`src/pages/`)

This directory contains the view controllers and pages for the EG1 Web Portal.

---

## 📑 Pages Inventory & Route Mapping

| Page File | Clean URL Route | Purpose & Primary Subsystems |
|---|---|---|
| [`HomePage.tsx`](./HomePage.tsx) | `/` or `/index` | Interactive Hero crystal banner, featured application grid, latest news carousel |
| [`AppsPage.tsx`](./AppsPage.tsx) | `/apps` | Searchable application catalog, category filtering, detailed Markdown spec view (`/apps?title=slug`) |
| [`AboutPage.tsx`](./AboutPage.tsx) | `/about` | Interactive milestones timeline, mission statement, technology stack showcase |
| [`BlogPage.tsx`](./BlogPage.tsx) | `/blog` | 47+ technical articles with syntax-highlighted code, search, category chips, pagination |
| [`UpdatesPage.tsx`](./UpdatesPage.tsx) | `/updates` | Timeline of release milestones, changelogs, tag filters (Production, Major, Security) |
| [`ContactPage.tsx`](./ContactPage.tsx) | `/contact` | Math CAPTCHA inquiry form, 24-hr client rate limiter, offline queue, Firestore persistence |
| [`PrivacyPolicyPage.tsx`](./PrivacyPolicyPage.tsx) | `/privacypolicy` | GDPR/CCPA privacy policy with live 1-click consent reset and telemetry audit details |
| [`AdminPage.tsx`](./AdminPage.tsx) | `/admin` | 2FA protected dashboard (OAuth + 16-Digit PIN), message manager, telemetry logs |

---

## 🔄 Client-Side Routing Architecture

1. All internal routes use **clean paths** (`apps`, `about`, `blog`, `updates`, `contact`, `privacypolicy`, `admin`) without `.html` extensions.
2. In [`src/App.tsx`](../App.tsx), `normalizePath` strips query parameters, hashes, leading slashes, and legacy `.html` extensions.
3. Both clean paths (`/contact`) and legacy links (`/contact.html`) resolve seamlessly to the same page component.

