#!/usr/bin/env python3
"""
sync_app_versions_from_github.py
--------------------------------
Synchronizes application version metadata from external GitHub repositories
into static Markdown frontmatter in public/data/apps/*.md for eg1.in.

Eliminates client-side runtime calls to api.github.com by baking release versions
directly into the repository at build/release time.
"""

import os
import sys
import json
import re
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
ROOT_DIR = SCRIPT_DIR.parent
DATA_DIR = ROOT_DIR / "public" / "data"
APPS_MD_DIR = DATA_DIR / "apps"

# Explicit mapping of application slugs to their upstream GitHub repositories
APP_REPO_MAPPING = {
    "eg-web-core": "EG1DOTIN/eg-web-core",
    "pyegclamui": "EG1DOTIN/pyEGClamUI",
    "marwadi-chess": "EG1DOTIN/mchess.eg1.in",
}


def fetch_latest_release_from_github(repo_slug: str) -> str | None:
    """Fetches the latest release tag from GitHub Releases API with fallback to tags."""
    headers = {
        "User-Agent": "EG1-AppVersionSync/1.0",
        "Accept": "application/vnd.github.v3+json",
    }
    token = os.environ.get("GITHUB_TOKEN")
    if token:
        headers["Authorization"] = f"Bearer {token}"

    # 1. Try Releases API
    release_url = f"https://api.github.com/repos/{repo_slug}/releases/latest"
    req = urllib.request.Request(release_url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=12) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            tag = data.get("tag_name") or data.get("name")
            if tag:
                clean_ver = tag.strip().lstrip("vV")
                return clean_ver
    except Exception as e:
        print(f"   [INFO] Could not fetch latest release for {repo_slug} ({e}), trying tags...")

    # 2. Fallback to Tags API
    tags_url = f"https://api.github.com/repos/{repo_slug}/tags?per_page=1"
    req_tags = urllib.request.Request(tags_url, headers=headers)
    try:
        with urllib.request.urlopen(req_tags, timeout=12) as resp:
            tags = json.loads(resp.read().decode("utf-8"))
            if isinstance(tags, list) and len(tags) > 0:
                tag = tags[0].get("name", "")
                if tag:
                    clean_ver = tag.strip().lstrip("vV")
                    return clean_ver
    except Exception as e:
        print(f"   [WARN] Could not fetch tags for {repo_slug}: {e}")

    return None


def sync_app_versions() -> int:
    print("=" * 70)
    print(" 🚀  EG1.IN — APPLICATION VERSIONS SYNCHRONIZATION")
    print("=" * 70)
    print(f" Markdown Dir: {APPS_MD_DIR}")
    print("=" * 70)

    if not APPS_MD_DIR.exists():
        print(f"❌ Error: {APPS_MD_DIR} directory does not exist!")
        return 1

    md_files = sorted(APPS_MD_DIR.glob("*.md"))
    if not md_files:
        print(f"❌ Error: No markdown files found in {APPS_MD_DIR}")
        return 1

    now_iso = datetime.now(timezone.utc).astimezone().isoformat()
    synced_count = 0

    for md_file in md_files:
        app_slug = md_file.stem
        md_content = md_file.read_text(encoding="utf-8")

        name_match = re.search(r'name:\s*"([^"]*)"', md_content)
        app_name = name_match.group(1) if name_match else app_slug

        slug_match = re.search(r'slug:\s*"([^"]*)"', md_content)
        if slug_match:
            app_slug = slug_match.group(1)

        repo_slug = APP_REPO_MAPPING.get(app_slug) or APP_REPO_MAPPING.get(md_file.stem)

        # Autodiscover GitHub repo from frontmatter if not in map
        if not repo_slug:
            src_match = re.search(r'github\.com/([a-zA-Z0-9_.-]+/[a-zA-Z0-9_.-]+)', md_content)
            if src_match:
                repo_slug = src_match.group(1).rstrip("/\"'")

        if not repo_slug:
            print(f" • [{app_slug}] {app_name}: No GitHub repository mapped, skipping.")
            continue

        print(f" • Querying GitHub for '{app_name}' ({repo_slug})...")
        latest_version = fetch_latest_release_from_github(repo_slug)

        # Current version in frontmatter
        v_match = re.search(r'version-string:\s*"([^"]*)"', md_content)
        current_version = v_match.group(1) if v_match else "1.0.0"

        if not latest_version:
            print(f"   ⚠️ Could not resolve version for {repo_slug}. Keeping current '{current_version}'.")
            continue

        # Update matching Markdown file in public/data/apps/
        try:
            # Update version-string
            md_content = re.sub(
                r'(version-string:\s*)"[^"]*"',
                rf'\g<1>"{latest_version}"',
                md_content
            )
            # Ensure fetch-github is false
            md_content = re.sub(
                r'(fetch-github:\s*)"[^"]*"',
                r'\g<1>"false"',
                md_content
            )
            # Update updatedAt
            md_content = re.sub(
                r'(updatedAt:\s*)"[^"]*"',
                rf'\g<1>"{now_iso}"',
                md_content
            )
            md_file.write_text(md_content, encoding="utf-8")
            synced_count += 1
            print(f"   ✅ Version synced: {current_version} -> {latest_version} in {md_file.name}")
        except Exception as e:
            print(f"   ⚠️ Error updating {md_file.name}: {e}")

    print("=" * 70)
    print(f"🎉 Successfully synchronized {synced_count} application version(s) in {APPS_MD_DIR}!")
    print("=" * 70)
    return 0


if __name__ == "__main__":
    sys.exit(sync_app_versions())
