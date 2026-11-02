# EG1 Portal Documentation Hub

Welcome to the technical documentation for **EG1 Portal** ([`eg1.in`](../)). This portal is built with React 18, TypeScript, and Vite, consuming the generic component framework [`eg-web-core`](https://github.com/EG1DOTIN/eg-web-core).

---

## 📚 Documentation Index

| Document | Focus & Scope | Key Topics Covered |
| :--- | :--- | :--- |
| **[Architecture & Data Flow](./architecture.md)** | System architecture, data flow, telemetry & caching | `DataCache` pattern, Batched Bucket telemetry, routing normalizer, theme tokens |
| **[Pages & Feature Guide](./pages-and-features.md)** | Detailed implementation breakdown of all 8 pages | Home, Apps Catalog, Technical Blog, Updates, About, Contact, Privacy, Admin Suite |
| **[EG-Web-Core Library Docs](https://github.com/EG1DOTIN/eg-web-core/blob/main/docs/README.md)** | Shared component specifications | UI Primitives, Layouts, Hooks, Services, Admin Suite |

---

## 🧭 System Overview

```mermaid
graph LR
    subgraph Client["Consumer Portal (eg1.in)"]
        UI["Pages & Views (8 Pages)"]
        Brand["Eg1Logo & Custom Styling"]
        Router["App.tsx Routing Engine"]
    end

    subgraph Core["Shared Library (eg-web-core)"]
        Primitives["Header, Footer, MarkdownViewer, ImageSlider"]
        Services["DataCache, VisitorTracker, AdminAuthService"]
        Tokens["Design System & Theme Engine"]
    end

    subgraph Data["Data Stores"]
        StaticData["Public JSON & Markdown (data/)"]
        Firebase["Firebase Auth & Firestore (Admin / Telemetry)"]
    end

    UI --> Router
    Router --> Primitives
    UI --> Services
    Services --> StaticData
    Services --> Firebase
    Brand --> UI
```

---

## 🛡️ Guidelines & Rules Compliance

1. **Modernized Consumer Architecture (Critical Rule 1)**:
   - This project is an independent, modernized React 18 + Vite + TypeScript application consuming `eg-web-core` as a modular dependency (`github:EG1DOTIN/eg-web-core`).
   - All generic, reusable components, styling, logic, hooks, and helpers are maintained in `eg-web-core`, while site-specific branding, customized wrappers, and domain pages reside strictly within this repository.
2. **Generic Core Library (Critical Rule 5)**:
   - All site branding (`Eg1Logo`, domain names, allowed admin emails) resides strictly inside this consumer project.
   - Core library components receive configuration via props and presets.
3. **Cross-Consumer Stability (Critical Rule 6)**:
   - Zero-regression builds confirmed with sibling projects `mchess.eg1.in` and `av.eg1.in`.
