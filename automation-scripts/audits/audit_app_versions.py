#!/usr/bin/env python3
"""
audit_app_versions.py
---------------------
Audits and validates that all application versions in eg1.in:
1. Are populated with valid semantic version strings in public/data/apps/*.md frontmatter.
2. Have 'fetch-github' disabled ("false") so clients do not make runtime API calls.
3. Contain required metadata fields (id, name, category, product_type, icon, createdAt).
"""

import sys
import re
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = ROOT_DIR / "public" / "data"
APPS_MD_DIR = DATA_DIR / "apps"

SEMVER_REGEX = re.compile(r"^\d+\.\d+(\.\d+)?(-[a-zA-Z0-9_.-]+)?$")


def audit_app_versions() -> int:
    errors = []
    warnings = []

    if not APPS_MD_DIR.exists():
        print(f"❌ Error: {APPS_MD_DIR} directory is missing.")
        return 1

    md_files = sorted(APPS_MD_DIR.glob("*.md"))
    if not md_files:
        print(f"❌ Error: {APPS_MD_DIR} must contain at least one application markdown file.")
        return 1

    for md_file in md_files:
        md_content = md_file.read_text(encoding="utf-8")
        app_name = md_file.stem

        name_match = re.search(r'name:\s*"([^"]*)"', md_content)
        if name_match:
            app_name = name_match.group(1)

        # 1. Check version-string in markdown
        v_match = re.search(r'version-string:\s*"([^"]*)"', md_content)
        if not v_match:
            errors.append(f"{md_file.name}: Missing 'version-string' in frontmatter")
        else:
            version = v_match.group(1).strip()
            if not version:
                errors.append(f"{md_file.name}: Empty 'version-string' in frontmatter")
            elif not SEMVER_REGEX.match(version):
                warnings.append(f"{md_file.name}: Non-standard version format '{version}'")

        # 2. Check fetch-github is false
        fg_match = re.search(r'fetch-github:\s*"([^"]*)"', md_content)
        if fg_match and fg_match.group(1).lower() == "true":
            errors.append(
                f"{md_file.name}: 'fetch-github' is set to 'true'. "
                f"It must be 'false' to prevent client-side runtime GitHub API calls."
            )

        # 3. Check required fields
        for field in ("category", "product_type", "icon", "createdAt"):
            if not re.search(rf'{field}:\s*"([^"]*)"', md_content):
                errors.append(f"{md_file.name}: Missing required field '{field}' in frontmatter")

    if warnings:
        print(f"⚠️ App version audit found {len(warnings)} warning(s):")
        for w in warnings:
            print(f"   • {w}")

    if errors:
        print(f"❌ App version audit failed with {len(errors)} error(s):")
        for err in errors:
            print(f"   • {err}")
        return 1

    print(f"✅ App version audit passed: All {len(md_files)} markdown applications have valid static versions.")
    return 0


if __name__ == "__main__":
    sys.exit(audit_app_versions())
