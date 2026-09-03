# EG1 Data Directory & Static Datasets

This directory houses the structured, static JSON datasets utilized by the **EG1** platform ([eg1.in](https://www.eg1.in)) for ultra-fast client-side delivery, zero-latency rendering, and minimizing Firestore database read operations.

---

## 📁 Dataset Catalog

| File | Description | Primary Consumers |
| :--- | :--- | :--- |
| [`apps.json`](apps.json) | Software & Web Application catalog with metadata, versioning, links, and status. | [`apps.html`](../apps.html), [`js/app.js`](../js/app.js) |
| [`website_content.json`](website_content.json) | Static page copy, hero text, and single source of truth for `"seo"` tags (titles, descriptions, Open Graph, Twitter cards, canonical URLs, and `img/eg1-social-preview.webp`). | Root HTML pages via [`automation-scripts/sync_seo_tags.py`](../automation-scripts/sync_seo_tags.py), [`index.html`](../index.html), [`about.html`](../about.html), [`js/about.js`](../js/about.js) |
| [`updates.json`](updates.json) | Release notes, changelog history, version badges, and notification center items. | [`updates.html`](../updates.html), [`js/updates.js`](../js/updates.js), [`js/include-components.js`](../js/include-components.js) |
| [`blog/*.md`](blog/) | Pure Markdown blog articles with YAML frontmatter (47+ articles). | [`blog.html`](../blog.html), [`js/blog-page.js`](../js/blog-page.js), [`automation-scripts/generate_blog_pages.py`](../automation-scripts/generate_blog_pages.py) |

---

## 🎛️ Apps Schema & Custom Button Configuration

Each entry in [`apps.json`](apps.json) supports dynamic button configuration (`button1` for left/primary action, `button2` for right/secondary action) and explicit versioning configuration:

```json
{
  "id": "YDLLCZ0ur2gTbkwQtDQV",
  "product_name": "Marwadi Chess",
  "version": {
    "version-string": "3.7.1",
    "fetch-github": "false"
  },
  "active": "1",
  "icon": "./img/apps/mchess-webapp.webp",
  "short_description": "<p>...</p>",
  "button1": {
    "VIEW DETAILS": "http://mchess.eg1.in/",
    "sameTab": "false"
  }
}
```

- **Key (Button Label)**: Defines the button label text (e.g. `"VIEW DETAILS"`, `"DOWNLOAD"`, `"OPEN APP"`).
- **Value (Link URL)**: Destination URL or relative route to open.
- **`sameTab`**: Set `"true"` to navigate in the same browser tab, or `"false"` to open in a new tab (`target="_blank"`).
- **`icon`** *(Optional)*: Explicitly specify a custom icon class (e.g. `"icon-github"`, `"icon-cloud-download"`, `"icon-code"`, `"icon-star"`, `"icon-shield"`).
- **Auto Icons**: If `icon` is omitted, the engine automatically selects matching icons based on the label (e.g., download, key, newspaper/details, gamepad/play, external-link).

### 🏷️ App Version Resolution

App versioning across cards, catalog views, and detail pages is resolved simply and explicitly:
1. **`fetch-github: "true"`**: If `product.version["fetch-github"]` is `"true"`, the engine queries GitHub for the latest release/tag and caches it (1-hour TTL). If not yet cached or offline, it uses `version-string`.
2. **`version-string` (Static)**: If `fetch-github` is `"false"` (or if `version` is a string), it uses `version-string` (e.g., `"3.7.1"`).
3. **Default Fallback**: If the `version` key is omitted in the JSON, the app automatically defaults to `"1.0.0"`.

---

## 🛡️ License, Project Terms & Branding Notice

### 1. Data Formats & Schemas (MIT License)
The data formats, JSON schemas, architecture, and synchronization tooling are open-sourced under the terms of the **[MIT License](LICENSE)**. Anyone is free to adapt, fork, and use these schemas and tools for their own applications.

### 2. Individual Open-Source Projects (`apps.json`)
The digital products, applications, and tools listed in [`apps.json`](apps.json) (such as **Marwadi Chess / MChess**, **EGClamNetAntivirus**, etc.) are independent open-source projects.
- Anyone is free to use, run, fork, and contribute to these projects under their respective open-source licenses and source repositories (e.g., individual project LICENSE files).

### 3. Trademark & Branding Protection
The names **"EG1"**, **"EG1.in"**, **"EG1DOTIN"**, logos, emblems, SVGs, and visual trade dress are exclusive trademarks owned by **EG1 (Gautam Jangid)**. 
- You may **NOT** use EG1 platform brand names, logos, or trademarks for commercial endorsement, unauthorized promotion, or impersonation.

### 4. Platform Website Content (`website_content.json`)
- The platform-specific editorial copy, mission text, and contact notes in [`website_content.json`](website_content.json) belong to EG1.
- If you use this repository or schema for your own website or application, replace the EG1-specific website copy and platform branding with your own authentic content.

For full legal terms, please review the **[data/LICENSE](LICENSE)** file.
