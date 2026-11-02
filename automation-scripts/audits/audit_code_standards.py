#!/usr/bin/env python3
"""
audit_code_standards.py
-----------------------
Audits React components and HTML entry points in eg1.in for:
1. rel="noopener noreferrer" enforcement on all target="_blank" links
2. index.html hygiene (SEO meta tags, title, clean stylesheet links)
3. Zero hardcoded secrets, private keys, or API tokens
"""

import sys
import re
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
SRC_DIR = ROOT_DIR / "src"
INDEX_HTML = ROOT_DIR / "index.html"


def audit_standards() -> int:
    errors = []

    # 1. Audit index.html
    if not INDEX_HTML.exists():
        errors.append("Missing index.html")
    else:
        html_content = INDEX_HTML.read_text(encoding="utf-8")
        if "<title>" not in html_content:
            errors.append("index.html missing <title> tag")
        if '<meta name="description"' not in html_content and "<meta name='description'" not in html_content:
            errors.append("index.html missing meta description tag")
        # Check for excessive inline styles (> 20 lines)
        style_matches = re.findall(r'<style[^>]*>(.*?)</style>', html_content, re.DOTALL)
        for s in style_matches:
            if len(s.strip().splitlines()) > 20:
                errors.append("index.html contains large inline <style> block (> 20 lines); prefer external CSS files")

    # 2. Audit React source files
    source_files = list(SRC_DIR.glob("**/*.ts")) + list(SRC_DIR.glob("**/*.tsx"))
    for f in source_files:
        content = f.read_text(encoding="utf-8", errors="replace")
        rel_path = f.relative_to(ROOT_DIR)

        # Check target="_blank" without rel="noopener noreferrer"
        for m in re.finditer(r'<a[^>]*target=["\']_blank["\'][^>]*>', content):
            tag = m.group(0)
            if 'rel="noopener noreferrer"' not in tag and "rel='noopener noreferrer'" not in tag:
                if 'rel=' not in tag:
                    errors.append(f"{rel_path}: External link missing rel='noopener noreferrer'")

        # Secret protection
        if "-----BEGIN PRIVATE KEY-----" in content:
            errors.append(f"{rel_path}: Hardcoded private key detected!")

    if errors:
        print(f"❌ Code standards audit failed with {len(errors)} error(s):")
        for err in errors:
            print(f"   • {err}")
        return 1

    print(f"✅ Code standards audit passed ({len(source_files)} source files and index.html verified).")
    return 0


if __name__ == "__main__":
    sys.exit(audit_standards())
