#!/usr/bin/env python3
"""
audit_app_versions.py
---------------------
Audits and validates that all application versions in eg1.in:
1. Are populated with valid semantic version strings in public/data/apps.json.
2. Match their corresponding markdown frontmatter in public/data/apps/*.md.
3. Have 'fetch-github' disabled ("false") so clients do not make runtime API calls.
"""

import sys
import json
import re
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = ROOT_DIR / "public" / "data"
APPS_JSON = DATA_DIR / "apps.json"
APPS_MD_DIR = DATA_DIR / "apps"

SEMVER_REGEX = re.compile(r"^\d+\.\d+(\.\d+)?(-[a-zA-Z0-9_.-]+)?$")


def audit_app_versions() -> int:
    errors = []
    warnings = []

    if not APPS_JSON.exists():
        print(f"❌ Error: {APPS_JSON} is missing.")
        return 1

    try:
        apps = json.loads(APPS_JSON.read_text(encoding="utf-8"))
    except Exception as e:
        print(f"❌ Error parsing {APPS_JSON}: {e}")
        return 1

    if not isinstance(apps, list) or len(apps) == 0:
        print(f"❌ Error: {APPS_JSON} must contain a non-empty list of applications.")
        return 1

    for app in apps:
        app_id = app.get("slug") or app.get("id")
        app_name = app.get("name") or app.get("title") or app_id
        version = app.get("version", "").strip()

        # 1. Validate version string
        if not version:
            errors.append(f"App '{app_name}' ({app_id}) has empty or missing version in apps.json")
        elif not SEMVER_REGEX.match(version):
            warnings.append(f"App '{app_name}' ({app_id}) has non-standard version format: '{version}'")

        # 2. Validate markdown frontmatter
        md_file = APPS_MD_DIR / f"{app_id}.md"
        if not md_file.exists():
            errors.append(f"Missing markdown frontmatter file for app '{app_name}': {md_file.name}")
        else:
            md_content = md_file.read_text(encoding="utf-8")

            # Check version-string in markdown
            v_match = re.search(r'version-string:\s*"([^"]*)"', md_content)
            if not v_match:
                errors.append(f"{md_file.name}: Missing 'version-string' in frontmatter")
            else:
                md_version = v_match.group(1).strip()
                if md_version != version:
                    errors.append(
                        f"Version mismatch for '{app_name}': apps.json has '{version}', "
                        f"but {md_file.name} has '{md_version}'. "
                        f"Run 'python3 automation-scripts/sync_app_versions_from_github.py' to synchronize."
                    )

            # Check fetch-github is false
            fg_match = re.search(r'fetch-github:\s*"([^"]*)"', md_content)
            if fg_match and fg_match.group(1).lower() == "true":
                errors.append(
                    f"{md_file.name}: 'fetch-github' is set to 'true'. "
                    f"It must be 'false' to prevent client-side runtime GitHub API calls."
                )

    if warnings:
        print(f"⚠️ App version audit found {len(warnings)} warning(s):")
        for w in warnings:
            print(f"   • {w}")

    if errors:
        print(f"❌ App version audit failed with {len(errors)} error(s):")
        for err in errors:
            print(f"   • {err}")
        return 1

    print(f"✅ App version audit passed: All {len(apps)} applications have synchronized static versions.")
    return 0


if __name__ == "__main__":
    sys.exit(audit_app_versions())

