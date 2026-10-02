#!/usr/bin/env python3
"""
compile_md_to_json.py
---------------------
Reads all Markdown (.md) blog files in data/blog/, parses YAML frontmatter and
Markdown content into HTML, and compiles data/blogs.json for zero-latency static delivery.

Usage:
    # Compile all markdown files in data/blog/ into data/blogs.json:
    E:/ALL/CODE/PYTHON/TestPy/.venv/Scripts/python.exe automation-scripts/compilers/compile_md_to_json.py
"""

import sys
import re
import json
import yaml
import markdown
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

# Ensure UTF-8 output encoding across environments
for stream in (sys.stdout, sys.stderr):
    reconfig = getattr(stream, "reconfigure", None)
    if callable(reconfig):
        try:
            reconfig(encoding="utf-8", errors="replace")
        except Exception:
            pass


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
    """Converts Markdown text to HTML with fenced code and table support."""
    if not md_text or not md_text.strip():
        return ""
    return markdown.markdown(
        md_text,
        extensions=[
            "fenced_code",
            "tables",
            "nl2br",
            "sane_lists",
        ]
    )


def compile_blogs(
    blog_dir: Optional[Path] = None,
    output_json: Optional[Path] = None
) -> List[Dict[str, Any]]:
    """Compiles all .md files in blog_dir into output_json."""
    repo_root = Path(__file__).resolve().parents[2]
    data_dir = repo_root / "data"
    input_dir = blog_dir or (data_dir / "blog")
    json_path = output_json or (data_dir / "blogs.json")

    if not input_dir.exists():
        print(f"❌ Blog directory does not exist: {input_dir}")
        return []

    md_files = list(input_dir.glob("*.md"))
    print(f"📖 Found {len(md_files)} Markdown blog file(s) in '{input_dir}'...")

    compiled_blogs: List[Dict[str, Any]] = []

    for md_file in md_files:
        meta, body_md = parse_frontmatter_and_content(md_file)

        # Derive ID from frontmatter or filename (e.g. id12.md -> "12")
        blog_id = str(meta.get("id", "")).strip()
        if not blog_id:
            m = re.search(r"(\d+)", md_file.stem)
            blog_id = m.group(1) if m else md_file.stem

        title = str(meta.get("title") or meta.get(
            "heading") or "Untitled Blog").strip()
        heading = str(meta.get("heading") or meta.get(
            "title") or title).strip()
        category = str(meta.get("category") or "General").strip()
        tags = meta.get("tags")
        if not tags or not isinstance(tags, list):
            tags = [category] if category else ["General"]
        tags = [str(t).strip() for t in tags if str(t).strip()]

        author = str(meta.get("author") or "EG1").strip()
        created_at = str(meta.get("createdAt") or meta.get(
            "release_date") or "").strip()
        release_date = str(meta.get("release_date")
                           or meta.get("createdAt") or "").strip()
        updated_at = str(meta.get("updatedAt") or "").strip()
        output_image = str(meta.get("output_image") or meta.get(
            "imageUrl") or f"img/blog/id{blog_id}.webp").strip()

        short_desc = str(meta.get("short_description")
                         or meta.get("description") or "").strip()
        end_desc = str(meta.get("end_description") or "").strip()
        meta_keyword = str(meta.get("metaKeyword") or "").strip()
        meta_desc = str(meta.get("metaDescription") or "").strip()
        active = str(meta.get("active") if "active" in meta else "1").strip()

        # Convert body markdown to HTML
        body_html = md_to_html(body_md)

        blog_entry = {
            "id": blog_id,
            "title": title,
            "heading": heading,
            "category": category,
            "tags": tags,
            "author": author,
            "createdAt": created_at,
            "release_date": release_date,
            "updatedAt": updated_at,
            "output_image": output_image,
            "short_description": short_desc,
            "full_description": body_html,
            "end_description": end_desc,
            "markdown_file": f"data/blog/{md_file.name}",
            "metaKeyword": meta_keyword,
            "metaDescription": meta_desc,
            "active": active,
        }
        compiled_blogs.append(blog_entry)

    # Sort blogs descending by numeric ID if possible
    def sort_key(b: Dict[str, Any]):
        raw = b.get("id", "")
        try:
            return (0, int(raw))
        except ValueError:
            return (1, str(raw))

    compiled_blogs.sort(key=sort_key, reverse=True)

    json_path.parent.mkdir(parents=True, exist_ok=True)
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(compiled_blogs, f, indent=2, ensure_ascii=False)

    size_kb = json_path.stat().st_size / 1024.0
    print("=" * 60)
    print(
        f"✅ Compiled {len(compiled_blogs)} blog(s) -> {json_path} ({size_kb:.2f} KB)")
    print("=" * 60)

    return compiled_blogs


if __name__ == "__main__":
    compile_blogs()
