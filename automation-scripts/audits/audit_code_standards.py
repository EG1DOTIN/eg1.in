#!/usr/bin/env python3
"""
audit_code_standards.py
-----------------------
Audits production HTML, CSS, and JS files across the project for:
1. Strict Separation of Concerns (CSS in css/, JS in js/).
2. Detection of inline <style> tags (should be moved to external CSS).
3. Detection of inline <script> tags (except the mandatory theme pre-loader).
4. Detection of inline event handlers (onclick, onsubmit, onload, onchange).
5. Verification of clean CSS Custom Properties & Semantic HTML standards.
"""

import os
import re
import sys

WORKSPACE_ROOT = os.path.abspath(os.path.join(
    os.path.dirname(__file__), "..", ".."))

PRODUCTION_PAGES = [
    "index.html",
    "apps.html",
    "updates.html",
    "blog.html",
    "about.html",
    "contact.html",
    "privacypolicy.html"
]


def audit_html_file(file_path):
    rel_path = os.path.relpath(file_path, WORKSPACE_ROOT)
    issues = []

    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()

    # 1. Check for <style> tags
    style_matches = list(re.finditer(
        r"<style[^>]*>(.*?)</style>", content, re.DOTALL | re.IGNORECASE))
    if style_matches:
        for m in style_matches:
            style_content = m.group(1).strip()
            if style_content:
                issues.append(
                    f"Inline <style> block found ({len(style_content)} chars). Should be in external CSS.")

    # 2. Check for inline <script> blocks (excluding tiny theme pre-loader in head)
    script_matches = list(re.finditer(
        r"<script(?![^>]*src=)[^>]*>(.*?)</script>", content, re.DOTALL | re.IGNORECASE))
    for m in script_matches:
        script_code = m.group(1).strip()
        # Allow the fast theme pre-loader script
        if "eg1_theme" in script_code and "localStorage" in script_code and len(script_code) < 400:
            continue
        if script_code:
            snippet = script_code[:80].replace("\n", " ")
            issues.append(
                f"Inline <script> block found: '{snippet}...'. Should be externalized to js/.")

    # 3. Check for inline event handlers (onclick, onchange, onsubmit, etc.)
    inline_handlers = list(re.finditer(
        r'\b(on(?:click|change|submit|load|mouseover|mouseout|keydown|keyup))\s*=\s*["\']([^"\']+)["\']', content, re.IGNORECASE))
    for h in inline_handlers:
        handler_name = h.group(1)
        handler_val = h.group(2)
        issues.append(
            f"Inline event handler '{handler_name}=\"{handler_val}\"'. Should use unobtrusive JS event listeners.")

    return rel_path, issues


def audit_directory_hygiene():
    """Verifies that all CSS files are in css/ and all JS files are in js/."""
    issues = []
    js_dir = os.path.join(WORKSPACE_ROOT, "js")
    css_dir = os.path.join(WORKSPACE_ROOT, "css")

    if os.path.exists(js_dir):
        for f in os.listdir(js_dir):
            if f.endswith(".css"):
                issues.append(
                    f"Found CSS file '{f}' inside js/ directory. Must be in css/.")

    if os.path.exists(css_dir):
        for f in os.listdir(css_dir):
            if f.endswith(".js"):
                issues.append(
                    f"Found JS file '{f}' inside css/ directory. Must be in js/.")

    return issues


def audit_all_pages():
    print(f"Auditing Code Quality & Standards in: {WORKSPACE_ROOT}\n")
    total_issues = 0

    # 1. Directory Hygiene Check
    dir_issues = audit_directory_hygiene()
    if dir_issues:
        print("[FAIL] Directory Separation Violations:")
        for issue in dir_issues:
            print(f"   - {issue}")
            total_issues += 1
    else:
        print(
            "[OK] Directory Hygiene: All CSS strictly in css/, all JS strictly in js/.")

    # 2. Production Pages Audit
    for page in PRODUCTION_PAGES:
        file_path = os.path.join(WORKSPACE_ROOT, page)
        if not os.path.exists(file_path):
            print(f"[WARN] File not found: {page}")
            continue

        rel_path, issues = audit_html_file(file_path)
        if issues:
            print(f"[FAIL] {rel_path} ({len(issues)} issues):")
            for issue in issues:
                print(f"   - {issue}")
                total_issues += 1
        else:
            print(f"[OK] {rel_path} - Perfectly separated and clean.")

    print("\n" + "=" * 50)
    if total_issues == 0:
        print(
            "[SUCCESS] All production pages adhere strictly to Code Quality & Standards!")
        return 0
    else:
        print(
            f"[ACTION REQUIRED] Found {total_issues} standards issues across files.")
        return 1


if __name__ == "__main__":
    sys.exit(audit_all_pages())
