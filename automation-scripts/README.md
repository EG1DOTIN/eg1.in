# Automation Scripts & Quality Audits Directory (`eg1.in`)

This directory provides the local automation and continuous integration scripts for the **EG1 Web Portal & Applications Catalog** (`eg1.in`).

---

## 📂 Directory Contents

| Script / Directory | Purpose |
| :--- | :--- |
| **`sync_app_versions_from_github.py`** | Connects to external GitHub repositories (e.g. `EG1DOTIN/pyEGClamUI`, `EG1DOTIN/mchess.eg1.in`), resolves latest release tags, and synchronizes `public/data/apps.json` and `public/data/apps/*.md`. |
| **`run_all_checks.py`** | Consolidated CI and local verification runner that executes all audits and production build tests. |
| **`audits/`** | Specialized audit scripts: dataset integrity, application versions, doc links, and code standards. |
| **`requirements.txt`** | Python dependencies (zero third-party dependencies required; uses Python 3 standard library). |

---

## 🚀 How to Synchronize Application Versions

When an external project (such as **pyEGClamUI** or **Marwadi Chess**) publishes a new release on GitHub:

```bash
python3 automation-scripts/sync_app_versions_from_github.py
```

### What this does:
1. Queries `https://api.github.com/repos/{repo}/releases/latest` for each mapped application.
2. Updates `apps.json` with the new version and timestamp.
3. Updates `public/data/apps/{slug}.md` frontmatter (`version-string`) and sets `fetch-github: "false"`.
4. Eliminates runtime client-side calls to GitHub API, ensuring **0ms load time and zero rate limits** for visitors.

---

## 🔍 Quality Audits (`audits/`)

Execute individual audits or the full test runner:

```bash
# Run the complete test suite:
python3 automation-scripts/run_all_checks.py

# Run only the application version audit:
python3 automation-scripts/audits/audit_app_versions.py

# Run only dataset validation:
python3 automation-scripts/audits/validate_datasets.py

# Run only markdown link audit:
python3 automation-scripts/audits/audit_doc_links.py

# Run code standards & security audit:
python3 automation-scripts/audits/audit_code_standards.py
```

