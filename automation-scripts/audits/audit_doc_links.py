#!/usr/bin/env python3
"""
audit_doc_links.py
------------------
Recursively scans all markdown files in docs/ and verifies that all relative links
resolve to existing files on disk.
"""

import os
import re
import sys
from urllib.parse import unquote

DOCS_DIR = os.path.abspath(os.path.join(
    os.path.dirname(__file__), "..", "..", "docs"))
GITIGNORE_DOCS_DIR = os.path.abspath(os.path.join(
    os.path.dirname(__file__), "..", "..", "gitignore", "docs"))
WORKSPACE_ROOT = os.path.abspath(os.path.join(
    os.path.dirname(__file__), "..", ".."))


def audit_markdown_file(file_path):
    broken_links = []
    file_dir = os.path.dirname(file_path)

    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()

    # Find standard markdown links: [text](link)
    links = re.findall(r'\[([^\]]+)\]\(([^)]+)\)', content)

    for text, link in links:
        # Ignore external http/https/mailto links, anchors, and mermaid text
        if link.startswith(("http://", "https://", "mailto:", "#", "javascript:")):
            continue

        # Remove fragment/anchor part
        clean_link = link.split("#")[0].split("?")[0]
        if not clean_link:
            continue

        clean_link = unquote(clean_link)

        target_path = os.path.normpath(os.path.join(file_dir, clean_link))

        if not os.path.exists(target_path):
            broken_links.append((link, target_path))

    return broken_links


def fix_common_relative_paths():
    """Audits markdown links across docs/ and gitignore/docs/"""
    target_dirs = [DOCS_DIR]
    if os.path.exists(GITIGNORE_DOCS_DIR):
        target_dirs.append(GITIGNORE_DOCS_DIR)

    total_broken = 0

    for d in target_dirs:
        rel_target = os.path.relpath(d, WORKSPACE_ROOT)
        print(f"Auditing and verifying all markdown links in {rel_target}...\n")
        for root, _, files in os.walk(d):
            for f in sorted(files):
                if f.endswith(".md"):
                    file_path = os.path.join(root, f)
                    rel_doc = os.path.relpath(file_path, WORKSPACE_ROOT)
                    broken = audit_markdown_file(file_path)
                    if broken:
                        print(f"[BROKEN LINKS] in {rel_doc}:")
                        for orig, resolved in broken:
                            print(f"   - '{orig}' -> target not found: {resolved}")
                            total_broken += 1
                    else:
                        print(f"[OK] {rel_doc}")

    print("\n" + "=" * 50)
    if total_broken == 0:
        print("[SUCCESS] All documentation links resolve perfectly!")
        return 0
    else:
        print(f"[ACTION REQUIRED] Found {total_broken} broken relative links.")
        return 1


if __name__ == "__main__":
    sys.exit(fix_common_relative_paths())
