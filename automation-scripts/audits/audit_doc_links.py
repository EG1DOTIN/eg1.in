#!/usr/bin/env python3
"""
audit_doc_links.py
------------------
Audits all markdown documentation files in eg1.in/ (docs/*.md and README.md)
to verify that all relative file links resolve to valid existing files and headings.
"""

import sys
import re
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent.parent

LINK_PATTERN = re.compile(r'\[([^\]]+)\]\(([^)]+)\)')


def get_slug(heading: str) -> str:
    slug = heading.strip().lower()
    slug = re.sub(r'[^\w\s-]', '', slug)
    slug = re.sub(r'[\s_]+', '-', slug)
    return slug


def audit_markdown_file(file_path: Path) -> list:
    errors = []
    content = file_path.read_text(encoding="utf-8")

    headings = {get_slug(line.lstrip('#').strip()) for line in content.splitlines() if line.startswith('#')}

    for match in LINK_PATTERN.finditer(content):
        _, target = match.groups()
        target = target.strip()

        if target.startswith(('http://', 'https://', 'mailto:', 'tel:', '#')):
            if target.startswith('#'):
                anchor = target[1:].lower()
                if anchor and anchor not in headings:
                    errors.append(f"{file_path.name}: Broken local anchor '#{anchor}'")
            continue

        parts = target.split('#', 1)
        rel_path = parts[0]
        anchor = parts[1].lower() if len(parts) > 1 else None

        resolved_file = (file_path.parent / rel_path).resolve()

        if not resolved_file.exists():
            errors.append(f"{file_path.name}: Broken link '{target}' -> file not found at {rel_path}")
        elif anchor and resolved_file.suffix.lower() == '.md':
            target_content = resolved_file.read_text(encoding="utf-8", errors="replace")
            target_headings = {get_slug(line.lstrip('#').strip()) for line in target_content.splitlines() if line.startswith('#')}
            if anchor not in target_headings:
                errors.append(f"{file_path.name}: Broken heading anchor '#{anchor}' in {rel_path}")

    return errors


def main() -> int:
    md_files = list(ROOT_DIR.glob("*.md")) + list((ROOT_DIR / "docs").glob("*.md"))
    all_errors = []

    for md_file in md_files:
        errs = audit_markdown_file(md_file)
        all_errors.extend(errs)

    if all_errors:
        print(f"❌ Found {len(all_errors)} broken markdown link(s) across {len(md_files)} files:")
        for err in all_errors:
            print(f"   • {err}")
        return 1

    print(f"✅ Documentation link audit passed cleanly ({len(md_files)} documentation files scanned).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
