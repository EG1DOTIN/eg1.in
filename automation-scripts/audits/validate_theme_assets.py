"""
validate_theme_assets.py

Automated test and audit script for EG1 Light Gray / Dark Gray Theme System.
Validates CSS syntax, HTML pre-loaders, component tags, and JavaScript bindings.
"""

import os
import re
import sys

# Ensure UTF-8 stdout on Windows
reconfigure_fn = getattr(sys.stdout, "reconfigure", None)
if callable(reconfigure_fn):
    reconfigure_fn(encoding="utf-8")


def check_file_exists(path):
    if not os.path.exists(path):
        print(f"[FAIL] Missing file: {path}")
        return False
    print(f"[OK] Found: {path}")
    return True


def validate_css_braces(css_path):
    with open(css_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Strip comments and strings
    clean = re.sub(r"/\*.*?\*/", "", content, flags=re.DOTALL)
    open_b = clean.count("{")
    close_b = clean.count("}")
    if open_b != close_b:
        print(
            f"[FAIL] CSS brace mismatch in {css_path}: {open_b} open vs {close_b} close")
        return False
    print(f"[OK] CSS braces balanced in {css_path} ({open_b} blocks)")
    return True


def validate_header_component(header_path):
    with open(header_path, "r", encoding="utf-8") as f:
        content = f.read()

    required_tokens = [
        'id="themeToggleBtn"',
        'class="theme-toggle-btn',
        'theme-icon-sun',
        'theme-icon-moon',
        'theme-toggle-label',
        'id="header-logo-badge"'
    ]
    all_ok = True
    for token in required_tokens:
        if token not in content:
            print(f"[FAIL] Missing token '{token}' in {header_path}")
            all_ok = False
        else:
            print(f"[OK] Token verified in header: '{token}'")
    return all_ok


def validate_js_component(js_path):
    with open(js_path, "r", encoding="utf-8") as f:
        content = f.read()

    required_funcs = [
        "initializeThemeToggle",
        "setTheme",
        "updateThemeUI",
        "eg1_theme"
    ]
    all_ok = True
    for func in required_funcs:
        if func not in content:
            print(f"[FAIL] Missing function/token '{func}' in {js_path}")
            all_ok = False
        else:
            print(f"[OK] Verified JS token: '{func}'")
    return all_ok


def validate_html_preloaders(html_files):
    all_ok = True
    for hf in html_files:
        if not os.path.exists(hf):
            continue
        with open(hf, "r", encoding="utf-8") as f:
            content = f.read()
        if "eg1_theme" not in content or "data-theme" not in content:
            print(f"[FAIL] Missing theme pre-loader in {hf}")
            all_ok = False
        else:
            print(f"[OK] Theme pre-loader verified in {hf}")
    return all_ok


def main():
    base_dir = os.path.dirname(os.path.dirname(
        os.path.dirname(os.path.abspath(__file__))))
    print(f"Auditing Theme System in: {base_dir}\n")

    css_theme = os.path.join(base_dir, "css", "theme.css")
    css_common = os.path.join(base_dir, "css", "common.css")
    css_admin = os.path.join(base_dir, "AdminPanel", "css", "admin-style.css")
    header_comp = os.path.join(base_dir, "components", "header.html")
    include_js = os.path.join(base_dir, "js", "include-components.js")

    html_pages = [
        os.path.join(base_dir, "index.html"),
        os.path.join(base_dir, "apps.html"),
        os.path.join(base_dir, "blog.html"),
        os.path.join(base_dir, "about.html"),
        os.path.join(base_dir, "contact.html"),
        os.path.join(base_dir, "download.html"),
        os.path.join(base_dir, "get-registration-key.html"),
        os.path.join(base_dir, "privacypolicy.html"),
        os.path.join(base_dir, "updates.html"),
        os.path.join(base_dir, "test.html"),
        os.path.join(base_dir, "AdminPanel", "index.html")
    ]

    success = True
    success &= check_file_exists(css_theme) and validate_css_braces(css_theme)
    success &= check_file_exists(
        css_common) and validate_css_braces(css_common)
    success &= check_file_exists(css_admin) and validate_css_braces(css_admin)
    success &= check_file_exists(
        header_comp) and validate_header_component(header_comp)
    success &= check_file_exists(
        include_js) and validate_js_component(include_js)
    success &= validate_html_preloaders(html_pages)

    if success:
        print("\n[SUCCESS] ALL THEME SYSTEM AUDIT CHECKS PASSED SUCCESSFULLY!")
        return 0
    else:
        print("\n[FAIL] SOME AUDIT CHECKS FAILED.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
