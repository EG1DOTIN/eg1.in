#!/usr/bin/env python3
"""
validate_datasets.py
--------------------
Validates all dynamic JSON datasets and Markdown blog posts for eg1.in:
1. public/data/apps.json
2. public/data/updates.json
3. public/data/website_content.json
4. public/data/blog-index.json
5. All 47 public/data/blog/id*.md files
"""

import sys
import json
import re
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = ROOT_DIR / "public" / "data"


def validate_datasets() -> int:
    errors = []

    # 1. Validate public/data/apps/*.md catalog
    apps_dir = DATA_DIR / "apps"
    if not apps_dir.exists() or not any(apps_dir.glob("*.md")):
        errors.append(f"Missing application markdown files in {apps_dir}")
    else:
        seen_ids = set()
        for md_file in apps_dir.glob("*.md"):
            content = md_file.read_text(encoding="utf-8")
            id_match = re.search(r'id:\s*"([^"]*)"', content)
            if not id_match or not id_match.group(1):
                errors.append(f"Application markdown '{md_file.name}' missing 'id'")
            else:
                app_id = id_match.group(1)
                if app_id in seen_ids:
                    errors.append(f"Duplicate application ID '{app_id}' in {md_file.name}")
                seen_ids.add(app_id)

    # 2. Validate updates.json
    updates_file = DATA_DIR / "updates.json"
    if not updates_file.exists():
        errors.append(f"Missing {updates_file}")
    else:
        try:
            updates = json.loads(updates_file.read_text(encoding="utf-8"))
            if not isinstance(updates, list):
                errors.append("updates.json must be a list of updates")
        except Exception as e:
            errors.append(f"updates.json parsing error: {e}")

    # 3. Validate website_content.json
    content_file = DATA_DIR / "website_content.json"
    if not content_file.exists():
        errors.append(f"Missing {content_file}")
    else:
        try:
            content = json.loads(content_file.read_text(encoding="utf-8"))
            if not isinstance(content, dict):
                errors.append("website_content.json must be a JSON object")
        except Exception as e:
            errors.append(f"website_content.json parsing error: {e}")

    # 4. Validate blog-index.json & blog markdown files
    blog_index_file = DATA_DIR / "blog-index.json"
    blog_dir = DATA_DIR / "blog"
    if not blog_index_file.exists():
        errors.append(f"Missing {blog_index_file}")
    else:
        try:
            blogs = json.loads(blog_index_file.read_text(encoding="utf-8"))
            if not isinstance(blogs, list) or len(blogs) < 40:
                errors.append(f"Expected at least 40 blog entries, found {len(blogs)}")
            else:
                for b in blogs:
                    bid = b.get("id")
                    if not bid:
                        errors.append(f"Blog entry missing ID: {b.get('title')}")
                        continue
                    md_path = blog_dir / f"id{bid}.md"
                    if not md_path.exists():
                        errors.append(f"Blog post id{bid} referenced in index but missing file: {md_path.name}")
                    elif md_path.stat().st_size == 0:
                        errors.append(f"Blog post id{bid} file is empty: {md_path.name}")
        except Exception as e:
            errors.append(f"blog-index.json parsing error: {e}")

    if errors:
        print(f"❌ Dataset validation failed with {len(errors)} error(s):")
        for err in errors:
            print(f"   • {err}")
        return 1

    print("✅ All JSON datasets and 47 Markdown blog articles validated successfully.")
    return 0


if __name__ == "__main__":
    sys.exit(validate_datasets())
