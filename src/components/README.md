# EG1 Brand Components Directory (`src/components/`)

This directory houses site-specific brand compositions, wrappers, and visual identity components for the `eg1.in` web portal.

---

## 🎨 Brand Components Overview

| Component File | Role & Customization |
|---|---|
| [`Eg1Header.tsx`](file:///home/gautam/AntigravityProjects/EG1-LIVE-WEBSITES/EG1-WEBSITE/eg1.in/src/components/Eg1Header.tsx) | Configures the generic `Header` from `eg-web-core` with EG1 typography, notification bell, GitHub fork ribbon, and navigation structure from `siteConfig.tsx`. |
| [`Eg1Footer.tsx`](file:///home/gautam/AntigravityProjects/EG1-LIVE-WEBSITES/EG1-WEBSITE/eg1.in/src/components/Eg1Footer.tsx) | 4-Column footer with dynamic about text, social links, contact CTA, and consent reopen modal. |
| [`Eg1Logo.tsx`](file:///home/gautam/AntigravityProjects/EG1-LIVE-WEBSITES/EG1-WEBSITE/eg1.in/src/components/Eg1Logo.tsx) | Procedural vector logo featuring the signature Great Vibes script font, golden gradient, and responsive size scaling. |

---

## 🔧 Customizing Header Navigation & Socials

To modify header menus, navigation links, or footer social channels, edit [`src/config/siteConfig.tsx`](file:///home/gautam/AntigravityProjects/EG1-LIVE-WEBSITES/EG1-WEBSITE/eg1.in/src/config/siteConfig.tsx):
- `EG1_NAV_LINKS`: Array of top-level links and dropdown menus.
- `EG1_SOCIAL_LINKS`: Array of social channels (GitHub, YouTube, Twitter/X, Instagram).
- `EG1_SITE_CONFIG`: Application name, descriptions, and repo URLs.

