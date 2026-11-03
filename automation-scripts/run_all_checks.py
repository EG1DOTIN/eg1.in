#!/usr/bin/env python3
"""
run_all_checks.py
-----------------
Consolidated master automation runner for eg1.in.
Executes dataset validation, markdown documentation link audits,
code quality standards, source project protection, and production build.

Usage:
    python automation-scripts/run_all_checks.py
"""

import sys
import time
import subprocess
from pathlib import Path
from typing import List

ROOT_DIR = Path(__file__).resolve().parent.parent

for stream in (sys.stdout, sys.stderr):
    reconfig = getattr(stream, "reconfigure", None)
    if callable(reconfig):
        try:
            reconfig(encoding="utf-8", errors="replace")
        except Exception:
            pass


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
                cwd=str(ROOT_DIR),
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace",
                shell=(sys.platform == "win32" and cmd[0] in ("npm", "npx"))
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
    print(" 🚀  EG1 PORTAL CONSOLIDATED AUTOMATION & QUALITY AUDIT SUITE")
    print("=" * 76)
    print(f" Root Directory: {ROOT_DIR}")
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
            name="1. Dynamic Datasets & 47 Blog Articles Audit",
            command=["{PYTHON}", "automation-scripts/audits/validate_datasets.py"],
            description="Validates apps.json, updates.json, website_content.json, and blog posts"
        ),
        CheckTask(
            name="2. Application Versions & Static Metadata Audit",
            command=["{PYTHON}", "automation-scripts/audits/audit_app_versions.py"],
            description="Validates static app versions in apps.json and disables runtime GitHub queries"
        ),
        CheckTask(
            name="3. Documentation Links & Anchors Audit",
            command=["{PYTHON}", "automation-scripts/audits/audit_doc_links.py"],
            description="Verifies all relative links and anchors in docs/ and README.md resolve"
        ),
        CheckTask(
            name="4. Code Standards & Security Hygiene Audit",
            command=["{PYTHON}", "automation-scripts/audits/audit_code_standards.py"],
            description="Validates rel='noopener noreferrer', index.html meta tags, and secrets"
        ),
        CheckTask(
            name="5. TypeScript & Vite Production Bundle",
            command=["npm", "run", "build"],
            description="Validates clean compilation (tsc && vite build) with zero errors"
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
