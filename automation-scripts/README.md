# Automation Scripts & Maintenance Tools Hub (`automation-scripts/`)

This directory contains automated maintenance, asset generation, audit validation, and CI/CD testing utility scripts for the EG1 web platform, organized into specialized functional subdirectories.

---

## 📂 Directory Organization

```
automation-scripts/
├── audits/                    # Code standards, theme tokens & markdown link validators
│   ├── audit_code_standards.py
│   ├── audit_doc_links.py
│   └── validate_theme_assets.py
│
├── generators/                # Static SEO HTML pages & metadata generators
│   ├── generate_blog_pages.py
│   ├── generate_app_pages.py
│   └── sync_seo_tags.py
│
├── compilers/                 # Markdown to JSON dataset bundle compilers
│   ├── compile_md_to_json.py
│   └── compile_apps_to_json.py
│
├── data/                      # Internal bidirectional slug and ID mapping datasets
│   ├── app_slugs.json
│   └── blog_slugs.json
│
├── run_all_checks.py          # Master unified audit runner and verification dashboard
└── README.md                  # Comprehensive tool documentation and usage manual (this file)
```

> **Private Developer Tools**: Sensitive database extraction/seeders and heavy image synthesis tools are maintained in private local tooling (`gitignore/local-tools/`).

---

## 🚀 Unified Master Audit Runner

### `run_all_checks.py`
Single consolidated runner executing the entire suite of repository quality checks, static page generators, SEO validations, and JavaScript syntax audits in ~1.3 seconds with an aggregated status dashboard.

- **Audits Included**:
  1. Code Standards & Structural Hygiene ([audits/audit_code_standards.py](audits/audit_code_standards.py))
  2. Theme System & Token Integrity ([audits/validate_theme_assets.py](audits/validate_theme_assets.py))
  3. Markdown Documentation Link Audit ([audits/audit_doc_links.py](audits/audit_doc_links.py))
  4. Static Blog Pages Generator ([generators/generate_blog_pages.py](generators/generate_blog_pages.py))
  5. Static Applications Pages Generator ([generators/generate_app_pages.py](generators/generate_app_pages.py))
  6. Static SEO Meta Tags Sync Verification ([generators/sync_seo_tags.py](generators/sync_seo_tags.py))
  7. JavaScript Syntax & Node Parse Verification (`node -c ...`)

- **Execution**:
  ```bash
  E:/ALL/CODE/PYTHON/TestPy/.venv/Scripts/python.exe automation-scripts/run_all_checks.py
  ```

---

## 🔍 Audits & Validation (`automation-scripts/audits/`)

### 1. `audits/audit_code_standards.py`
- **Purpose**: Audits all production HTML, CSS, and JS files for strict separation of concerns, absence of inline `<style>`/`<script>` blocks, and semantic standards.
- **Execution**:
  ```bash
  E:/ALL/CODE/PYTHON/TestPy/.venv/Scripts/python.exe automation-scripts/audits/audit_code_standards.py
  ```

### 2. `audits/validate_theme_assets.py`
- **Purpose**: Verifies that the Light Gray / Dark Gray theme system is fully consistent across the codebase (CSS braces, pre-loaders, header switcher, and script bindings).
- **Execution**:
  ```bash
  E:/ALL/CODE/PYTHON/TestPy/.venv/Scripts/python.exe automation-scripts/audits/validate_theme_assets.py
  ```

### 3. `audits/audit_doc_links.py`
- **Purpose**: Recursively audits all Markdown documentation files in `docs/` and verifies that 100% of relative links resolve to valid, existing target files on disk.
- **Execution**:
  ```bash
  E:/ALL/CODE/PYTHON/TestPy/.venv/Scripts/python.exe automation-scripts/audits/audit_doc_links.py
  ```

---

## ⚡ Generators (`automation-scripts/generators/`)

### 4. `generators/generate_blog_pages.py`
- **Purpose**: Generates individual static SEO-friendly HTML files in [blog/](../blog/) from Markdown files in [data/blog/](../data/blog/).
- **Features**:
  - **Programming-Aware Slugification**: Converts programming terms cleanly (e.g. `C++` &rarr; `cpp`, `C#` &rarr; `csharp`, `F#` &rarr; `fsharp`, `.NET` &rarr; `dotnet`, `&` &rarr; `and`).
  - **SEO & Social Metadata**: Injects pre-rendered Open Graph tags, Twitter cards, and JSON-LD structured schemas (`BlogPosting`).
  - **Mapping Dataset**: Outputs bidirectional slug mapping dictionary to [automation-scripts/data/blog_slugs.json](data/blog_slugs.json).
- **Execution**:
  ```bash
  E:/ALL/CODE/PYTHON/TestPy/.venv/Scripts/python.exe automation-scripts/generators/generate_blog_pages.py
  ```

### 5. `generators/generate_app_pages.py`
- **Purpose**: Generates individual static SEO-optimized HTML pages in [apps/](../apps/) from Markdown files in [data/apps/](../data/apps/).
- **Features**:
  - Generates detail pages for applications featuring a "View Details" action.
  - Pre-renders Schema.org `SoftwareApplication` JSON-LD, Open Graph, Twitter cards, and canonical links.
  - Injects themed action buttons and the interactive Share Button ([js/share-app.js](../js/share-app.js)).
  - Outputs slug mappings to [automation-scripts/data/app_slugs.json](data/app_slugs.json).
- **Execution**:
  ```bash
  E:/ALL/CODE/PYTHON/TestPy/.venv/Scripts/python.exe automation-scripts/generators/generate_app_pages.py
  ```

### 6. `generators/sync_seo_tags.py`
- **Purpose**: Dual-mode SEO synchronization and auditing tool. Uses [data/website_content.json](../data/website_content.json) (`seo` section) as the single source of truth to validate and auto-synchronize `<head>` metadata across all 7 root static HTML pages ([index.html](../index.html), [apps.html](../apps.html), [blog.html](../blog.html), [about.html](../about.html), [contact.html](../contact.html), [updates.html](../updates.html), [privacypolicy.html](../privacypolicy.html)).
- **Execution**:
  ```bash
  # Check / Audit mode (zero edits, returns non-zero exit code if drift detected):
  E:/ALL/CODE/PYTHON/TestPy/.venv/Scripts/python.exe automation-scripts/generators/sync_seo_tags.py --check

  # Sync mode (updates all static HTML files with clean metadata):
  E:/ALL/CODE/PYTHON/TestPy/.venv/Scripts/python.exe automation-scripts/generators/sync_seo_tags.py
  ```

---

## 🗜️ Compilers (`automation-scripts/compilers/`)

### 7. `compilers/compile_md_to_json.py`
- **Purpose**: Compilation utility to bundle Markdown files in `data/blog/*.md` into a single JSON dataset (`data/blogs.json`).
- **Execution**:
  ```bash
  E:/ALL/CODE/PYTHON/TestPy/.venv/Scripts/python.exe automation-scripts/compilers/compile_md_to_json.py
  ```

### 8. `compilers/compile_apps_to_json.py`
- **Purpose**: Compilation utility to bundle Markdown application files in `data/apps/*.md` into `data/apps.json`.
- **Execution**:
  ```bash
  E:/ALL/CODE/PYTHON/TestPy/.venv/Scripts/python.exe automation-scripts/compilers/compile_apps_to_json.py
  ```

---

## 📁 Internal Data Directory

- **`automation-scripts/data/`**: Internal data mappings used exclusively by automation scripts:
  - `blog_slugs.json`: Bidirectional ID-to-slug mapping dictionary generated by `generate_blog_pages.py`.
  - `app_slugs.json`: Bidirectional ID-to-slug mapping dictionary generated by `generate_app_pages.py`.
