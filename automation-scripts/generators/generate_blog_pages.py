#!/usr/bin/env python3
"""
generate_blog_pages.py
-----------------------
Generates standalone, SEO-optimized static HTML pages for every Markdown blog
article in data/blog/ (saved to blog/<blog-title-slug>.html).

Each generated page contains:
1. Complete Open Graph (og:) & Twitter Card tags pre-rendered with the blog's
   title, description, and thumbnail (img/blog/id<id>.webp).
2. Canonical links and JSON-LD BlogPosting structured data.
3. Clean asset resolution using <base href="../">.
4. Auto-generated slug mapping saved to data/blog_slugs.json.

Usage:
    E:/ALL/CODE/PYTHON/TestPy/.venv/Scripts/python.exe automation-scripts/generators/generate_blog_pages.py
"""

import sys
import re
import json
import html
import yaml
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


def slugify(text: str) -> str:
    """Converts a title into a clean, URL-friendly slug."""
    if not text:
        return "untitled-post"
    s = text.strip()
    # Replace special programming languages and symbols before punctuation stripping
    s = re.sub(r"c\+\+", "cpp", s, flags=re.IGNORECASE)
    s = re.sub(r"c#", "csharp", s, flags=re.IGNORECASE)
    s = re.sub(r"f#", "fsharp", s, flags=re.IGNORECASE)
    s = re.sub(r"\.net\b", "dotnet", s, flags=re.IGNORECASE)
    s = re.sub(r"&", " and ", s)
    # Remove non-alphanumeric chars except space and hyphen
    s = re.sub(r"[^a-zA-Z0-9\s-]", "", s).lower().strip()
    # Replace whitespace and repeated hyphens with single hyphen
    s = re.sub(r"[\s-]+", "-", s)
    return s or "article"


def parse_frontmatter(file_path: Path) -> Tuple[Dict[str, Any], str]:
    """Parses YAML frontmatter and body from a markdown file."""
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    match = re.match(r"^---\s*\n(.*?)\n---\s*\n(.*)$", content, re.DOTALL)
    if match:
        yaml_str = match.group(1)
        body = match.group(2)
        try:
            meta = yaml.safe_load(yaml_str) or {}
        except Exception as e:
            print(f"⚠️ Error parsing YAML in {file_path.name}: {e}")
            meta = {}
        return meta, body
    return {}, content


def clean_description(meta: Dict[str, Any], body: str) -> str:
    """Extracts a clean short description for SEO meta tags."""
    desc = meta.get("short_description") or meta.get(
        "metaDescription") or meta.get("description") or ""
    if desc and desc != "NA":
        # Strip any HTML or markdown syntax
        clean = re.sub(r"<[^>]+>", " ", str(desc))
        clean = re.sub(r"\s+", " ", clean).strip()
        if len(clean) > 20:
            return clean[:200]

    # Fallback to first text line in markdown body
    for line in body.split("\n"):
        line = line.strip()
        if line and not line.startswith("#") and not line.startswith("|") and not line.startswith("!") and not line.startswith("["):
            clean = re.sub(r"[*_`]", "", line)
            clean = re.sub(r"\s+", " ", clean).strip()
            if len(clean) > 20:
                return clean[:200]

    return "Explore technical articles, programming tutorials, engineering source code, and practical software tools by EG1."


def generate_html_content(meta: Dict[str, Any], body: str, slug: str, blog_id: str) -> str:
    """Generates the static HTML markup for a single blog post."""
    title = meta.get("title") or meta.get("heading") or f"Article #{blog_id}"
    esc_title = html.escape(title)
    description = clean_description(meta, body)
    esc_desc = html.escape(description)

    image_rel = meta.get("output_image") or meta.get(
        "imageUrl") or f"img/blog/id{blog_id}.webp"
    # Ensure image path has no leading slash for consistency
    image_rel = image_rel.lstrip("/")
    image_url = f"https://www.eg1.in/{image_rel}"
    page_url = f"https://www.eg1.in/blog/{slug}.html"

    category = meta.get("category") or "Tutorials"
    author = meta.get("author") or "EG1"
    date = meta.get("release_date") or meta.get("createdAt") or "2026-01-01"

    return f"""<!doctype html>
<html lang="en">

<head>
    <base href="../">
    <script>(function(){{try{{var t=localStorage.getItem('eg1_theme')||'light-gray';document.documentElement.setAttribute('data-theme',t);}}catch(e){{document.documentElement.setAttribute('data-theme','light-gray');}}}})();</script>
    <title>{esc_title} - EG1 Blog</title>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=2, user-scalable=no" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta charset="UTF-8" />
    <meta name="title" content="{esc_title} - EG1 Blog" />
    <meta name="description" content="{esc_desc}" />
    <meta name="author" content="{html.escape(author)}" />
    <link rel="canonical" href="{page_url}" />

    <!-- Open Graph / Facebook / WhatsApp -->
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="EG1" />
    <meta property="og:url" content="{page_url}" />
    <meta property="og:title" content="{esc_title}" />
    <meta property="og:description" content="{esc_desc}" />
    <meta property="og:image" content="{image_url}" />
    <meta property="og:image:alt" content="{esc_title}" />

    <!-- Twitter / X -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="{page_url}" />
    <meta name="twitter:title" content="{esc_title}" />
    <meta name="twitter:description" content="{esc_desc}" />
    <meta name="twitter:image" content="{image_url}" />

    <!-- Schema.org Article Structured Data -->
    <script type="application/ld+json">
    {{
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": "{esc_title}",
      "description": "{esc_desc}",
      "image": "{image_url}",
      "url": "{page_url}",
      "datePublished": "{date}",
      "author": {{
        "@type": "Person",
        "name": "{html.escape(author)}"
      }},
      "publisher": {{
        "@type": "Organization",
        "name": "EG1",
        "url": "https://www.eg1.in"
      }}
    }}
    </script>

    <!-- Stylesheets -->
    <link href="css/main.css" rel="stylesheet" type="text/css" />
    <link href="css/responsive.css" rel="stylesheet" type="text/css" />
    <link href="css/font-awesome.css" rel="stylesheet" type="text/css" />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="css/fonts.css" rel="stylesheet" type="text/css" />
    <link href="css/common.css" rel="stylesheet" type="text/css" />
    <link href="css/menuCss.css" rel="stylesheet" type="text/css" />
    <link href="css/theme.css" rel="stylesheet" type="text/css" />
    <link href="css/scrollbar.css" rel="stylesheet" type="text/css" />
    <link href="css/socialbuttons.css" rel="stylesheet" type="text/css" />
    <link href="css/slick.css" rel="stylesheet" type="text/css" />
    <link href="css/slick-theme.css" rel="stylesheet" type="text/css" />
    <link href="css/blog-detail.css" rel="stylesheet" type="text/css" />
    <link href="css/blog-grid.css" rel="stylesheet" type="text/css" />
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'><circle cx='60' cy='60' r='58' fill='%23000000'/><circle cx='60' cy='60' r='54' fill='none' stroke='%23ffffff' stroke-width='4'/><text x='50%25' y='68%25' font-family='Great Vibes, Georgia, serif' font-style='italic' font-weight='bold' font-size='50' fill='%23ffffff' text-anchor='middle'>EG1</text></svg>" />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/styles/github-dark.min.css">

    <!-- Active Article Context -->
    <script>
        window.ACTIVE_BLOG_ID = "{blog_id}";
        window.ACTIVE_BLOG_SLUG = "{slug}";
    </script>

    <!-- Scripts -->
    <script src="js/jquery-2.1.1.min.js" type="text/javascript"></script>
    <script src="js/include-components.js" type="text/javascript"></script>
</head>

<body>
    <center>
        <div>
            <!-- Header loaded by include-components.js -->
            <div id="header-placeholder"></div>

            <!-- Main Content Header -->
            <div class="box-100 bg-E3 main-master">
                <div id="Content3Header" class="col-md-12">
                    <h1 id="blogTitle"><span id="blogPageTitleText">{esc_title}</span></h1>
                </div>
            </div>

            <!-- Content shell for detail view and sidebar -->
            <div class="box-90 content">
                <div class="row">
                    <div class="col-md-8" id="blogContainer">
                        <div class="loading-message">
                            <span class="loader"></span> Loading article...
                        </div>
                    </div>
                    <div class="col-md-4" id="sidebarColumn">
                        <div class="sidebar" id="sidebarContainer">
                            <div class="row">
                                <div class="col-md-12 margin-bottom">
                                    <div class="input-group input-group-lg">
                                        <input type="text" id="txtSearch" class="form-control"
                                            placeholder="search blog here" />
                                        <span class="input-group-btn">
                                            <button id="btnSearchBlog" class="btn btn-default bg-f2">
                                                Search
                                            </button>
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-12">
                                    <div class="box box-solid box-black">
                                        <div class="box-header">
                                            Category</div>
                                        <div class="box-body">
                                            <ul class="mrgin-top10 abc row" id="category-list">
                                                <!-- Categories will be loaded here -->
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div id="previousTopics" class="sidebar-section">
                                <!-- Previous topics will be loaded here -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Footer loaded by include-components.js -->
            <div id="footer-placeholder"></div>
        </div>
    </center>

    <!-- Highlight.js and Marked.js -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/marked/4.3.0/marked.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/highlight.min.js"></script>
    <script src="js/slick.min.js" type="text/javascript"></script>
    <script src="js/app.js" type="text/javascript"></script>
    <script src="js/blog-page.js" type="text/javascript"></script>
</body>

</html>
"""


WORKSPACE_ROOT = Path(__file__).resolve().parents[2]


def main():
    blog_dir = WORKSPACE_ROOT / "data" / "blog"
    out_dir = WORKSPACE_ROOT / "blog"
    out_dir.mkdir(exist_ok=True)

    # Clean out any old generated html files to avoid orphaned filenames
    for old_file in out_dir.glob("*.html"):
        try:
            old_file.unlink()
        except Exception:
            pass

    if not blog_dir.exists():
        print(f"❌ Error: {blog_dir} directory not found.")
        sys.exit(1)

    slug_map: Dict[str, str] = {}
    id_map: Dict[str, str] = {}
    generated_count = 0

    md_files = sorted(blog_dir.glob("*.md"))
    print(f"Processing {len(md_files)} blog markdown files...")

    for f in md_files:
        meta, body = parse_frontmatter(f)
        blog_id = str(meta.get("id") or f.stem.replace("id", "")).strip()
        title = meta.get("title") or f.stem

        slug = slugify(title)
        # Ensure unique slug
        base_slug = slug
        counter = 1
        while slug in slug_map and slug_map[slug] != blog_id:
            slug = f"{base_slug}-{counter}"
            counter += 1

        slug_map[slug] = blog_id
        id_map[blog_id] = slug

        # Generate HTML page
        html_code = generate_html_content(meta, body, slug, blog_id)
        out_file = out_dir / f"{slug}.html"
        with open(out_file, "w", encoding="utf-8") as out_fp:
            out_fp.write(html_code)

        generated_count += 1

    # Save slug mappings dataset for audit & reference
    data_dir = WORKSPACE_ROOT / "automation-scripts" / "data"
    data_dir.mkdir(parents=True, exist_ok=True)
    map_file = data_dir / "blog_slugs.json"

    map_data = {
        "idToSlug": id_map,
        "slugToId": slug_map
    }
    with open(map_file, "w", encoding="utf-8") as map_fp:
        json.dump(map_data, map_fp, indent=2)

    print(f"✅ Generated {generated_count} static blog pages in '{out_dir}/'!")
    print(f"✅ Saved slug mapping dataset to '{map_file}'.")


if __name__ == "__main__":
    main()
