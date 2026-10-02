#!/usr/bin/env python3
"""
SEO Tags Sync & Audit Tool (automation-scripts/sync_seo_tags.py)
----------------------------------------------------------------
Maintains 100% single-source-of-truth consistency between
'data/website_content.json' (seo section) and all static HTML pages.

Usage:
  # Sync mode (updates HTML pages to match JSON):
  python automation-scripts/sync_seo_tags.py

  # Audit/Check mode (validates with 0 modifications):
  python automation-scripts/sync_seo_tags.py --check
"""

import json
import re
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[2]
CONFIG_PATH = ROOT_DIR / "data" / "website_content.json"


def load_seo_config():
    if not CONFIG_PATH.exists():
        print(f"[ERROR] SEO configuration file not found at: {CONFIG_PATH}")
        sys.exit(1)
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    seo_data = data.get("seo", {})
    if not seo_data:
        print("[ERROR] No 'seo' section found in website_content.json!")
        sys.exit(1)
    return seo_data


def generate_seo_head_block(page_file: str, meta: dict) -> str:
    """Generates the standardized SEO head block for a page."""
    title = meta.get("title", "EG1")
    description = meta.get("description", "")
    canonical = meta.get("canonical", f"https://www.eg1.in/{page_file}")

    og = meta.get("og", {})
    og_type = og.get("type", "website")
    og_site_name = og.get("site_name", "EG1")
    og_url = og.get("url", canonical)
    og_title = og.get("title", title)
    og_description = og.get("description", description)
    og_image = og.get(
        "image", "https://www.eg1.in/img/eg1-social-preview.webp")
    og_width = og.get("image_width", "1200")
    og_height = og.get("image_height", "630")

    twitter = meta.get("twitter", {})
    tw_card = twitter.get("card", "summary_large_image")
    tw_url = twitter.get("url", canonical)
    tw_title = twitter.get("title", title)
    tw_description = twitter.get("description", description)
    tw_image = twitter.get("image", og_image)

    lines = [
        f"    <title>{title}</title>",
        '    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=2, user-scalable=no" />',
        '    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />',
        '    <meta charset="UTF-8" />',
        f'    <meta name="title" content="{title}" />',
        f'    <meta name="description" content="{description}" />',
        f'    <link rel="canonical" href="{canonical}" />',
        "",
        "    <!-- Open Graph / Facebook / WhatsApp -->",
        f'    <meta property="og:type" content="{og_type}" />',
        f'    <meta property="og:site_name" content="{og_site_name}" />',
        f'    <meta property="og:url" content="{og_url}" />',
        f'    <meta property="og:title" content="{og_title}" />',
        f'    <meta property="og:description" content="{og_description}" />',
        f'    <meta property="og:image" content="{og_image}" />',
        f'    <meta property="og:image:width" content="{og_width}" />',
        f'    <meta property="og:image:height" content="{og_height}" />',
        "",
        "    <!-- Twitter / X -->",
        f'    <meta name="twitter:card" content="{tw_card}" />',
        f'    <meta name="twitter:url" content="{tw_url}" />',
        f'    <meta name="twitter:title" content="{tw_title}" />',
        f'    <meta name="twitter:description" content="{tw_description}" />',
        f'    <meta name="twitter:image" content="{tw_image}" />',
    ]
    return "\n".join(lines)


def process_html_file(file_path: Path, seo_meta: dict, check_only: bool = False) -> bool:
    """Syncs or checks SEO head tags for an HTML file."""
    if not file_path.exists():
        print(f"[WARN] File not found: {file_path.name}")
        return False

    content = file_path.read_text(encoding="utf-8")

    # Find <head> tag
    head_start = re.search(r"<head\b[^>]*>", content, re.IGNORECASE)
    if not head_start:
        print(f"[WARN] No <head> tag found in {file_path.name}")
        return False

    head_content = content[head_start.end():]
    head_seo_regex = re.compile(
        r"(<title>[\s\S]*?)(?=\s*<!-- Stylesheets -->|\s*<link\s+href=[\"']css/|\s*<link\s+rel=[\"']stylesheet[\"'])",
        re.IGNORECASE
    )

    match = head_seo_regex.search(head_content)
    if not match:
        print(f"[WARN] Could not locate SEO block in {file_path.name}")
        return False

    new_seo_block = generate_seo_head_block(file_path.name, seo_meta)

    # Normalize existing matched block for comparison
    existing_block = match.group(1).strip()
    target_block = new_seo_block.strip()

    # Also check if any obsolete keywords tag remains
    has_keywords = bool(
        re.search(r'<meta\s+name=["\']keywords["\']', content, re.IGNORECASE))

    is_identical = (existing_block == target_block) and (not has_keywords)

    if check_only:
        if is_identical:
            print(
                f"  [OK] {file_path.name} is in 100% sync with website_content.json.")
            return True
        else:
            print(
                f"  [DRIFT] {file_path.name} differs from website_content.json or contains obsolete keywords tag.")
            return False

    # Sync mode: replace block and ensure no stray keywords tag remains
    abs_start = head_start.end() + match.start(1)
    abs_end = head_start.end() + match.end(1)
    updated_content = content[:abs_start] + \
        new_seo_block + "\n\n" + content[abs_end:]
    # Remove any extra keywords meta tag if present elsewhere in head
    updated_content = re.sub(
        r'\s*<meta\s+name=["\']keywords["\'][\s\S]*?/>', '', updated_content, flags=re.IGNORECASE)

    file_path.write_text(updated_content, encoding="utf-8")
    print(
        f"  [SYNCED] {file_path.name} updated with clean SEO tags from website_content.json.")
    return True


def main():
    check_mode = "--check" in sys.argv or "--audit" in sys.argv
    action_label = "Checking & Auditing" if check_mode else "Synchronizing"
    print(f"=== {action_label} SEO Tags Across All Static HTML Pages ===")

    seo_config = load_seo_config()
    all_ok = True

    for page_file, meta in seo_config.items():
        file_path = ROOT_DIR / page_file
        res = process_html_file(file_path, meta, check_only=check_mode)
        if not res:
            all_ok = False

    print("\n" + "=" * 55)
    if check_mode:
        if all_ok:
            print(
                "[SUCCESS] All static HTML pages match 'website_content.json' perfectly!")
            sys.exit(0)
        else:
            print(
                "[FAIL] SEO drift detected. Run 'python automation-scripts/sync_seo_tags.py' to auto-sync.")
            sys.exit(1)
    else:
        print(
            "[SUCCESS] All static HTML pages synchronized with single source of truth!")


if __name__ == "__main__":
    main()
