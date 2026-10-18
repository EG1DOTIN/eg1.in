# Page Details: Updates & Release Log (updates.html)

Technical code architecture, JSON data schema, execution logic, algorithm specifications, Mermaid flowcharts, code links, and notification bell popover synchronization for the EG1 Updates & Release Log Page.

---

## 🔗 Associated Code Files

- **HTML Template**: [updates.html](../../updates.html)
- **Controller Logic**: [js/updates.js](../../assets/js/modules/updates.js)
- **Data Source**: [data/updates.json](../../data/updates.json)
- **Shell & Navigation Components**: 
  - Header: [components/header.html](../../components/header.html)
  - Footer: [components/footer.html](../../components/footer.html)
  - Navigation Component Script: [js/include-components.js](../../assets/js/core/include-components.js)
- **Stylesheets**: [css/theme.css](../../assets/css/core/theme.css), [css/common.css](../../assets/css/core/common.css), [css/menuCss.css](../../assets/css/core/menuCss.css), [css/responsive.css](../../assets/css/core/responsive.css)

---

## 🎨 UI Wireframe & Layout

```
+-------------------------------------------------------------------------+
| [EG1 Logo]  [Home] [Apps] [Explore v] [About] [Contact]   (Bell)[Theme] |
|                             |-> Updates                                 |
|                             |-> Blog                                    |
+-------------------------------------------------------------------------+
| [=================== Image Slider Header Banner =====================]  |
| "UPDATES & RELEASES - Release changelogs & software updates"             |
+-------------------------------------------------------------------------+
| FILTER TABS:  [ All (2) ]  [ Website (1) ]  [ Apps (1) ]                |
+-------------------------------------------------------------------------+
| TIMELINE CARDS CONTAINER (#updatesTimelineContainer)                   |
|                                                                         |
| +---------------------------------------------------------------------+ |
| | [Globe Icon]  EG1 Website v3.0.0               [Aug 29, 2026] [v3.0]| |
| | Major platform evolution featuring dynamic theme engine...          | |
| | - Dynamic Light & Dark Gray theme switcher with zero-flicker        | |
| | - Interactive Notification Bell popover dropdown in navigation     | |
| | - Enhanced Explore navigation with click-to-toggle dropdown         | |
| | [Browse Updates ->]                                                 | |
| +---------------------------------------------------------------------+ |
|                                                                         |
| +---------------------------------------------------------------------+ |
| | [App Icon]    Marwadi Chess v3.7.1             [Aug 24, 2026] [v3.7]| |
| | Production release introducing comprehensive PGN replay...          | |
| | - Live PGN interactive game viewer with Move-by-Move controls       | |
| | - Real-time Stockfish engine evaluation and analysis                | |
| | [Launch App ->]                                                     | |
| +---------------------------------------------------------------------+ |
+-------------------------------------------------------------------------+
| FOOTER (Logo Badge, About Snippet, Follow Links, Contact CTA, Copyright)|
+-------------------------------------------------------------------------+
```

---

## ⚡ Mermaid System & Data Flowchart

```mermaid
flowchart TD
    Init["Visitor Opens updates.html"] --> Shell["Inject Header & Footer: js/include-components.js"]
    Shell --> InitUpdates["updates.js: initializeUpdatesPage()"]
    
    InitUpdates --> FetchJSON["Fetch data/updates.json"]
    FetchJSON --> CheckRes{"Fetch Successful?"}
    CheckRes -->|"Success"| ParseJSON["Parse JSON Updates Array"]
    CheckRes -->|"Error"| RenderError["Render User-Friendly Error Notice"]

    ParseJSON --> StoreGlobal["Store allUpdates globally"]
    StoreGlobal --> UpdateCounts["Calculate Filter Tab Counts: All, Website, Apps"]
    UpdateCounts --> RenderCards["Render Timeline Cards via DOM Fragment"]
    RenderCards --> AttachFilters["Bind Filter Tab Click Listeners"]
    AttachFilters --> Done["Render Complete"]

    %% Filter Click Subflow
    FilterClick["User Clicks Filter Tab: data-filter"] --> FilterArray["Filter allUpdates by category or target"]
    FilterArray --> ReRender["Re-render Timeline DOM Cards"]
```

---

## 🗄️ JSON Data Schema (`data/updates.json`)

The updates log is managed through a structured client-side JSON repository:

```json
{
  "updates": [
    {
      "id": "eg1-v3-release",
      "version": "3.0.0",
      "title": "EG1 Website v3.0.0 Released",
      "date": "Aug 29, 2026",
      "type": "website",
      "category": "major",
      "target": "website",
      "description": "Major platform evolution featuring dynamic Light/Dark theme switching, interactive Notification Bell, and modernized UI styling.",
      "highlights": [
        "Dynamic Light & Dark Gray theme switcher with instant zero-flicker pre-load",
        "Interactive Notification Bell popover dropdown in header navigation",
        "Enhanced Explore navigation with click-to-toggle submenu",
        "Slight Dark Gray button aesthetic and blended seamless navbar"
      ],
      "link": "updates.html",
      "linkText": "Browse Updates"
    },
    {
      "id": "marwadi-chess-v371",
      "version": "3.7.1",
      "title": "Marwadi Chess v3.7.1 Released",
      "date": "Aug 24, 2026",
      "type": "app",
      "category": "release",
      "target": "mchess",
      "description": "Production release introducing interactive PGN replays, live broadcast viewer, and engine analysis.",
      "highlights": [
        "Interactive PGN replay with Move-by-Move controls",
        "Real-time Stockfish engine evaluation",
        "Dark mode chessboard UI optimization"
      ],
      "link": "apps.html?id=marwadi-chess",
      "linkText": "Launch App"
    }
  ]
}
```

---

## 🔔 Header Notification Bell & Popover Integration

The notification bell icon (`#notificationBellBtn`) in [components/header.html](../../components/header.html) is managed dynamically by [js/include-components.js](../../assets/js/core/include-components.js):

1. **Unread Badge Calculation**:
   - Reads `localStorage.getItem("eg1_seen_updates_v1")`.
   - Compares latest update IDs against seen IDs.
   - If unseen updates exist, displays the unread badge (`.notification-badge`) with count and adds the `.has-unread` shake animation.
2. **Popover Dropdown**:
   - Clicking the bell toggles the `#notificationBellPopover` dropdown panel.
   - Shows compact preview cards with direct links to [updates.html](../../updates.html).
   - "Mark all as read" button saves all current IDs to `localStorage` and dismisses the unread badge.

---

## 🎨 Category & Vector Icon Resolver

Both the header notification popover ([js/include-components.js](../../assets/js/core/include-components.js)) and the updates timeline ([js/updates.js](../../assets/js/modules/updates.js)) utilize `normalizeUpdateCategory(category)`, `getUpdateIconSvg(iconType, category, size)`, and `getCategoryClass(category)` to render fixed vector icons and theme-adaptive badge colors across 6 standard categories:

| Category | Normalized Key | Rendered Vector Icon | Theme CSS Class | Color Accent |
| :--- | :--- | :--- | :--- | :--- |
| **ENHANCEMENT** | `enhancement` | Lucide double sparkle stars (`✨`) | `.cat-enhancement` | Sky Blue (`#0ea5e9` / `#38bdf8`) |
| **OPTIMIZATION** | `optimization` | Speedometer gauge | `.cat-optimization` | Royal Blue (`#3b82f6` / `#60a5fa`) |
| **FEATURE** | `feature` | 5-pointed star (`★`) | `.cat-feature` | Amber Gold (`#f59e0b` / `#fbbf24`) |
| **BUG-FIX** | `bugfix` | Maintenance wrench tool (`🔧`) | `.cat-bug-fix` | Dark Green (`#16a34a` / `#22c55e` / `#166534`) |
| **APP** | `app` | 4-tile application grid | `.cat-app` | Purple (`#8b5cf6` / `#a78bfa`) |
| **OTHER** | `other` | Information circle (`ⓘ`) | `.cat-other` | Slate Gray (`#94a3b8`) |

### Action Button Logic
Timeline cards dynamically generate contextual call-to-action button labels based on the item's `type`:
- **`type: "website"`**: Button label renders as **`Release Notes →`**, directly linking to the closed pull requests and release changelogs.
- **`type: "app"`**: Button label renders as **`Open Application ↗`** (for external URLs) or **`Open Application →`** (for internal links), launching the application.

---

## 🔒 Security & Code Standards

- **Strict Separation of Concerns**: All timeline rendering, filtering, and icon generators reside in [js/updates.js](../../assets/js/modules/updates.js). No inline scripts or inline event handlers are embedded in [updates.html](../../updates.html).
- **XSS Prevention**: All strings from `updates.json` are sanitized via `escapeHtml()` and DOM text nodes before being rendered into the DOM.
- **Automated Validation**: Verified 100% compliant with [automation-scripts/audits/audit_code_standards.py](../../automation-scripts/audits/audit_code_standards.py) and [automation-scripts/audits/validate_theme_assets.py](../../automation-scripts/audits/validate_theme_assets.py).
