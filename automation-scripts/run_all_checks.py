#!/usr/bin/env python3
"""
run_all_checks.py
-----------------
Consolidated master automation runner for the EG1 repository.
Executes all code quality, theme system, doc link, SEO, page generation,
and JavaScript syntax audits in a single command.

Preserves all individual scripts in automation-scripts/ while providing a unified
CI/CD and pre-commit verification dashboard.

Usage:
    E:/ALL/CODE/PYTHON/TestPy/.venv/Scripts/python.exe automation-scripts/run_all_checks.py
"""

import sys
import time
import subprocess
from pathlib import Path
from typing import List

# Ensure UTF-8 output encoding across environments
for stream in (sys.stdout, sys.stderr):
    reconfig = getattr(stream, "reconfigure", None)
    if callable(reconfig):
        try:
            reconfig(encoding="utf-8", errors="replace")
        except Exception:
            pass

WORKSPACE_ROOT = Path(__file__).resolve().parent.parent


class CheckTask:
    def __init__(self, name: str, command: List[str], description: str):
        self.name = name
        self.command = command
        self.description = description
        self.duration = 0.0
        self.success = False
        self.output = ""
        self.error = ""

    def run(self, python_exe: str) -> bool:
        cmd = []
        for part in self.command:
            if part == "{PYTHON}":
                cmd.append(python_exe)
            else:
                cmd.append(part)

        start_time = time.time()
        try:
            res = subprocess.run(
                cmd,
                cwd=str(WORKSPACE_ROOT),
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace"
            )
            self.duration = time.time() - start_time
            self.output = res.stdout.strip()
            self.error = res.stderr.strip()
            self.success = (res.returncode == 0)
        except Exception as e:
            self.duration = time.time() - start_time
            self.success = False
            self.error = str(e)

        return self.success


def print_banner():
    print("\n" + "=" * 76)
    print(" 🚀  EG1 CONSOLIDATED AUTOMATION & QUALITY AUDIT SUITE")
    print("=" * 76)
    print(f" Workspace Root: {WORKSPACE_ROOT}")
    print(f" Interpreter:    {sys.executable}")
    print("=" * 76 + "\n")


def print_summary_table(tasks: List[CheckTask], total_duration: float):
    print("\n" + "=" * 76)
    print(f"{'CHECK / AUDIT TASK':<45} | {'STATUS':<10} | {'DURATION':<10}")
    print("-" * 76)

    all_passed = True
    for t in tasks:
        status_str = "✅ PASS" if t.success else "❌ FAIL"
        if not t.success:
            all_passed = False
        dur_str = f"{t.duration:.2f}s"
        print(f"{t.name:<45} | {status_str:<10} | {dur_str:<10}")

    print("-" * 76)
    overall = "🎉 ALL CHECKS PASSED!" if all_passed else "⚠️ SOME CHECKS FAILED!"
    print(f" Overall Status: {overall} (Total Time: {total_duration:.2f}s)")
    print("=" * 76 + "\n")

    if not all_passed:
        print("--- Detailed Failure Reports ---")
        for t in tasks:
            if not t.success:
                print(f"\n[FAILED]: {t.name}")
                print(f"Command: {' '.join(t.command)}")
                if t.error:
                    print(f"Error:\n{t.error}")
                if t.output:
                    print(f"Output:\n{t.output}")
        print("\n" + "=" * 76)


def main():
    print_banner()

    python_exe = sys.executable

    tasks = [
        CheckTask(
            name="1. Code Standards & Structural Hygiene",
            command=[
                "{PYTHON}", "automation-scripts/audits/audit_code_standards.py"],
            description="Audits CSS/JS separation, semantic tags, and production hygiene"
        ),
        CheckTask(
            name="2. Theme System & Token Integrity",
            command=[
                "{PYTHON}", "automation-scripts/audits/validate_theme_assets.py"],
            description="Validates CSS brace balance, theme tokens, and header/preloader hooks"
        ),
        CheckTask(
            name="3. Markdown Documentation Link Audit",
            command=[
                "{PYTHON}", "automation-scripts/audits/audit_doc_links.py"],
            description="Verifies all internal markdown document links resolve without broken paths"
        ),
        CheckTask(
            name="4. Static Blog Pages Generator",
            command=[
                "{PYTHON}", "automation-scripts/generators/generate_blog_pages.py"],
            description="Generates standalone SEO-optimized blog articles into blog/<slug>.html"
        ),
        CheckTask(
            name="5. Static Applications Pages Generator",
            command=[
                "{PYTHON}", "automation-scripts/generators/generate_app_pages.py"],
            description="Generates standalone SEO-optimized app detail pages into apps/<slug>.html"
        ),
        CheckTask(
            name="6. Static SEO Meta Tags Sync Verification",
            command=[
                "{PYTHON}", "automation-scripts/generators/sync_seo_tags.py", "--check"],
            description="Verifies static HTML titles and meta descriptions match website_content.json"
        ),
        CheckTask(
            name="7. JavaScript Syntax & Parsing Audit",
            command=[
                "node", "-c",
                "js/app.js",
                "js/apps.js",
                "js/share-app.js",
                "js/index.js",
                "js/blog-page.js",
                "js/updates.js",
                "js/include-components.js",
                "js/contact.js",
                "AdminPanel/js/auth.js"
            ],
            description="Verifies clean node parse syntax across all primary frontend scripts"
        ),
    ]

    suite_start = time.time()
    for task in tasks:
        print(f"▶️  Running: {task.name} ... ", end="", flush=True)
        task.run(python_exe)
        if task.success:
            print(f"✅ ({task.duration:.2f}s)")
        else:
            print(f"❌ FAILED ({task.duration:.2f}s)")

    total_duration = time.time() - suite_start
    print_summary_table(tasks, total_duration)

    all_passed = all(t.success for t in tasks)
    sys.exit(0 if all_passed else 1)


if __name__ == "__main__":
    main()
