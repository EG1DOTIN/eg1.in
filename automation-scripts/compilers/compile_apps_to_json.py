#!/usr/bin/env python3
"""
compile_apps_to_json.py
-----------------------
Reads all Markdown (.md) application documents in data/apps/, parses YAML frontmatter
and Markdown descriptions, and compiles them into data/apps.json for high-speed,
zero-database delivery on the frontend.

Usage:
    E:/ALL/CODE/PYTHON/TestPy/.venv/Scripts/python.exe automation-scripts/compilers/compile_apps_to_json.py
"""

import sys
import re
import json
import yaml
import markdown
from pathlib import Path
from typing import Any, Dict, Tuple

# Ensure UTF-8 output encoding across environments
for stream in (sys.stdout, sys.stderr):
    reconfig = getattr(stream, "reconfigure", None)
    if callable(reconfig):
        try:
            reconfig(encoding="utf-8", errors="replace")
        except Exception:
            pass

ROOT_DIR = Path(__file__).resolve().parents[2]
APPS_DIR = ROOT_DIR / "data" / "apps"
OUTPUT_JSON = ROOT_DIR / "data" / "apps.json"


def slugify(text: str) -> str:
    """Converts a title or name into a clean, URL-friendly slug."""
    if not text:
        return "app"
    s = text.strip().lower()
    s = re.sub(r"[^a-z0-9\s-]", "", s)
    s = re.sub(r"[\s-]+", "-", s)
    return s.strip("-") or "app"


def parse_frontmatter_and_content(file_path: Path) -> Tuple[Dict[str, Any], str]:
    """Extracts YAML frontmatter and markdown body from a file."""
    with open(file_path, "r", encoding="utf-8") as f:
        text = f.read()

    frontmatter_match = re.match(
        r"^---\s*\n(.*?)\n---\s*\n(.*)$", text, re.DOTALL)
    if frontmatter_match:
        yaml_str = frontmatter_match.group(1)
        body = frontmatter_match.group(2)
        try:
            meta = yaml.safe_load(yaml_str) or {}
        except Exception as e:
            print(f"⚠️ Error parsing YAML in {file_path.name}: {e}")
            meta = {}
        return meta, body
    return {}, text


def md_to_html(md_text: str) -> str:
    """Converts Markdown text to clean HTML."""
    if not md_text or not md_text.strip():
        return ""
    return markdown.markdown(
        md_text.strip(),
        extensions=[
            "fenced_code",
            "tables",
            "nl2br",
            "sane_lists",
        ]
    )


def compile_apps():
    """Reads data/apps/*.md and compiles data/apps.json."""
    if not APPS_DIR.exists():
        print(f"Directory not found: {APPS_DIR}")
        sys.exit(1)

    md_files = sorted(list(APPS_DIR.glob("*.md")))
    if not md_files:
        print(f"⚠️ No markdown files found in {APPS_DIR}")
        return

    apps_list = []

    for fpath in md_files:
        meta, body_md = parse_frontmatter_and_content(fpath)
        if not meta:
            continue

        product_name = str(meta.get("product_name")
                           or meta.get("name") or fpath.stem).strip()
        slug = str(meta.get("slug") or slugify(product_name)).strip()
        app_id = str(meta.get("id") or fpath.stem).strip()

        # Render full description from markdown body if present, else fallback to meta
        body_html = md_to_html(body_md)
        if not body_html:
            body_html = str(meta.get("full_description")
                            or meta.get("description") or "").strip()

        # Handle version structure
        ver_val = meta.get("version")
        if isinstance(ver_val, dict):
            version_dict = {
                "version-string": str(ver_val.get("version-string") or ver_val.get("version_string") or "1.0.0"),
                "fetch-github": str(ver_val.get("fetch-github") or ver_val.get("fetch_github") or "false").lower()
            }
        elif isinstance(ver_val, str):
            version_dict = {
                "version-string": ver_val,
                "fetch-github": "false"
            }
        else:
            version_dict = {
                "version-string": "1.0.0",
                "fetch-github": "false"
            }

        app_item: Dict[str, Any] = {
            "id": app_id,
            "product_name": product_name,
            "name": product_name,
            "slug": slug,
            "categories": str(meta.get("categories") or meta.get("category") or "General"),
            "category": str(meta.get("category") or meta.get("categories") or "General"),
            "product_type": str(meta.get("product_type") or "WebApp"),
            "version": version_dict,
            "active": str(meta.get("active") if "active" in meta else "1"),
            "icon": str(meta.get("icon") or meta.get("imageUrl") or ""),
            "imageUrl": str(meta.get("imageUrl") or meta.get("icon") or ""),
            "short_description": str(meta.get("short_description") or meta.get("description") or ""),
            "description": str(meta.get("description") or meta.get("short_description") or ""),
            "full_description": body_html,
            "webapp_link": str(meta.get("webapp_link") or ""),
            "attach_upload_file_1": str(meta.get("attach_upload_file_1") or ""),
            "attach_upload_file_2": str(meta.get("attach_upload_file_2") or ""),
            "downloaded": str(meta.get("downloaded") or "0"),
            "paid_version": str(meta.get("paid_version") or "false"),
            "show_download": str(meta.get("show_download") or "false"),
            "createdAt": str(meta.get("createdAt") or ""),
            "updatedAt": str(meta.get("updatedAt") or "")
        }

        # Resolve Button 1
        if "button1" in meta and isinstance(meta["button1"], dict):
            app_item["button1"] = meta["button1"]
        elif app_item["product_type"] == "WebApp" and app_item["webapp_link"]:
            app_item["button1"] = {
                "LAUNCH": app_item["webapp_link"],
                "sameTab": "false"
            }
        else:
            app_item["button1"] = {
                "VIEW DETAILS": f"apps.html?title={slug}",
                "sameTab": "true"
            }

        # Resolve Button 2
        if "button2" in meta and isinstance(meta["button2"], dict):
            app_item["button2"] = meta["button2"]
        elif meta.get("attach_upload_file_1"):
            app_item["button2"] = {
                "DOWNLOAD": str(meta["attach_upload_file_1"]),
                "sameTab": "true"
            }

        apps_list.append(app_item)

    # Write output to data/apps.json
    with open(OUTPUT_JSON, "w", encoding="utf-8") as out:
        json.dump(apps_list, out, indent=2, ensure_ascii=False)
        out.write("\n")

    print(
        f"✅ Successfully compiled {len(apps_list)} applications from {APPS_DIR} into {OUTPUT_JSON}!")


if __name__ == "__main__":
    compile_apps()
