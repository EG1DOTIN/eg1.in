#!/usr/bin/env python3
"""
generate_app_pages.py
---------------------
Generates standalone, SEO-optimized static HTML pages for applications in data/apps/
(saved to apps/<app-slug>.html) whenever an app features a "View Details" / "Details" action.

Apps with direct external links only (e.g. Launch & Source without a details view)
are intentionally skipped, keeping the apps/ directory lean and focused.

Each generated page contains:
1. Complete Open Graph (og:) & Twitter Card tags pre-rendered for rich link previews.
2. Canonical links and Schema.org SoftwareApplication structured data.
3. Clean asset resolution using <base href="../"> and theme pre-loader.
4. Pre-rendered markdown body, dynamic action buttons, and a theme-aware Share button.
5. Back to all apps navigation link.

Usage:
    E:/ALL/CODE/PYTHON/TestPy/.venv/Scripts/python.exe automation-scripts/generators/generate_app_pages.py
"""

import sys
import re
import json
import html
import yaml
from pathlib import Path
from typing import Any, Dict, Tuple, Optional

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
        return "untitled-app"
    s = text.strip()
    s = re.sub(r"c\+\+", "cpp", s, flags=re.IGNORECASE)
    s = re.sub(r"c#", "csharp", s, flags=re.IGNORECASE)
    s = re.sub(r"&", " and ", s)
    s = re.sub(r"[^a-zA-Z0-9\s-]", "", s).lower().strip()
    s = re.sub(r"[\s-]+", "-", s)
    return s or "app"


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


def has_details_button(meta: Dict[str, Any], slug: str) -> bool:
    """
    Determines if the application needs a dedicated static details page.
    Returns True ONLY if:
    - button1 or button2 has a label containing 'DETAIL' or 'VIEW APP', OR
    - button1 or button2 targets an internal details route ('apps.html?title=', 'apps/'), OR
    - the app has substantial markdown body content intended for a detail view.
    """
    for btn_key in ["button1", "button2"]:
        btn_val = meta.get(btn_key)
        if not btn_val:
            continue

        if isinstance(btn_val, dict):
            for k, v in btn_val.items():
                k_upper = str(k).upper()
                if "DETAIL" in k_upper or "VIEW APP" in k_upper:
                    return True
                v_str = str(v).lower()
                if f"apps.html?title={slug}" in v_str or f"apps/{slug}" in v_str or "apps.html?id=" in v_str:
                    return True
        elif isinstance(btn_val, str):
            val_lower = btn_val.lower()
            if f"apps.html?title={slug}" in val_lower or f"apps/{slug}" in val_lower:
                return True

    return False


def clean_description(meta: Dict[str, Any], body: str) -> str:
    """Extracts a clean short description for SEO meta tags."""
    desc = meta.get("short_description") or meta.get("description") or ""
    if desc and desc != "NA":
        clean = re.sub(r"<[^>]+>", " ", str(desc))
        clean = re.sub(r"\s+", " ", clean).strip()
        if len(clean) > 20:
            return clean[:200]

    for line in body.split("\n"):
        line = line.strip()
        if line and not line.startswith("#") and not line.startswith("|") and not line.startswith("!") and not line.startswith("["):
            clean = re.sub(r"[*_`]", "", line)
            clean = re.sub(r"\s+", " ", clean).strip()
            if len(clean) > 20:
                return clean[:200]

    return "Explore fast, reliable, and modern desktop and web applications crafted by EG1."


def parse_action_button(btn_config: Any, fallback_label: str, fallback_url: Optional[str], default_class: str) -> Optional[Dict[str, str]]:
    """Normalizes button configuration into label, url, target, icon, and btnClass."""
    if not btn_config and not fallback_url:
        return None

    label = fallback_label
    url = fallback_url or "#"
    same_tab = True
    icon = ""
    custom_class = ""

    if isinstance(btn_config, dict):
        if "sameTab" in btn_config:
            same_tab = str(btn_config["sameTab"]).lower() in ["true", "1"]
        elif "sametab" in btn_config:
            same_tab = str(btn_config["sametab"]).lower() in ["true", "1"]

        if "icon" in btn_config:
            icon = str(btn_config["icon"])
        if "class" in btn_config:
            custom_class = str(btn_config["class"])
        elif "btnClass" in btn_config:
            custom_class = str(btn_config["btnClass"])

        if "label" in btn_config and "url" in btn_config:
            label = str(btn_config["label"])
            url = str(btn_config["url"])
        else:
            metadata_keys = {"sametab", "target", "icon",
                             "class", "btnclass", "rel", "label", "url"}
            for k, v in btn_config.items():
                if str(k).lower() not in metadata_keys and isinstance(v, (str, int, float)):
                    label = str(k)
                    url = str(v)
                    break
    elif isinstance(btn_config, str):
        url = btn_config

    if not url and fallback_url:
        url = fallback_url
    if not label and fallback_label:
        label = fallback_label
    if not url or url == "#":
        if not fallback_url:
            return None

    # Normalize icon exactly as js/app.js does
    if icon:
        icon = icon.strip()
        if " " not in icon and not icon.startswith("fa-") and not icon.startswith("icon-"):
            icon = f"icon icon-{icon}"
        elif " " not in icon and icon.startswith("icon-"):
            icon = f"icon {icon}"
        elif " " not in icon and icon.startswith("fa-"):
            icon = f"fa {icon}"
    else:
        lbl_upper = (label or "").upper()
        if "DOWNLOAD" in lbl_upper or "DOWN" in lbl_upper:
            icon = "icon icon-download"
        elif "KEY" in lbl_upper or "REGISTER" in lbl_upper:
            icon = "icon icon-key"
        elif "VIEW" in lbl_upper or "DETAIL" in lbl_upper or "READ" in lbl_upper:
            icon = "icon icon-newspaper-o"
        elif "PLAY" in lbl_upper or "GAME" in lbl_upper or "CHESS" in lbl_upper:
            icon = "icon icon-gamepad"
        elif "OPEN" in lbl_upper or "VISIT" in lbl_upper or "WEB" in lbl_upper or "LAUNCH" in lbl_upper:
            icon = "icon icon-external-link"
        elif "GITHUB" in lbl_upper or "CODE" in lbl_upper or "SOURCE" in lbl_upper:
            icon = "icon icon-github"
        else:
            icon = "icon icon-arrow-right"

    target_attr = "" if same_tab else 'target="_blank" rel="noopener noreferrer"'
    final_class = custom_class if custom_class else default_class

    return {
        "label": label,
        "url": url,
        "target": target_attr,
        "icon": icon,
        "class": final_class
    }


def render_markdown_body(body: str) -> str:
    """Converts markdown body to HTML with table and code block support."""
    try:
        import markdown
        html_body = markdown.markdown(
            body, extensions=["extra", "tables", "fenced_code"])
        return html_body
    except ImportError:
        # Fallback simple converter
        paras = [f"<p>{p.strip()}</p>" for p in body.split("\n\n")
                 if p.strip()]
        return "\n".join(paras)


def generate_app_html(meta: Dict[str, Any], body: str, slug: str, app_id: str) -> str:
    """Generates the static HTML markup for a standalone application detail page."""
    name = meta.get("name") or meta.get(
        "product_name") or slug.replace("-", " ").title()
    esc_title = html.escape(name)
    description = clean_description(meta, body)
    esc_desc = html.escape(description)

    # Resolve version
    version_meta = meta.get("version")
    if isinstance(version_meta, dict):
        version = str(version_meta.get("version-string")
                      or version_meta.get("versionString") or "1.0.0")
    elif version_meta:
        version = str(version_meta)
    else:
        version = "1.0.0"

    # Resolve icon
    raw_icon = str(meta.get("icon") or meta.get("imageUrl") or "").strip()
    placeholder_icon = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='16' fill='%231e293b'/><text x='50%' y='63%' font-family='sans-serif' font-weight='bold' font-size='38' fill='%2338bdf8' text-anchor='middle'>EG1</text></svg>"
    icon_src = raw_icon if raw_icon else placeholder_icon

    # Canonical & Social URLs
    page_url = f"https://www.eg1.in/apps/{slug}"
    image_url = f"https://www.eg1.in/{raw_icon}" if (raw_icon and not raw_icon.startswith(
        "data:") and not raw_icon.startswith("http")) else "https://www.eg1.in/img/eg1-social-banner.png"

    # Action buttons: exclude redundant "View Details" buttons since user is already on the details page
    btn1 = parse_action_button(meta.get("button1"), "LAUNCH", meta.get(
        "webapp_link"), "btn btn-theme-primary")
    btn2 = parse_action_button(meta.get("button2"), "DOWNLOAD", meta.get(
        "attach_upload_file_1"), "btn btn-theme-secondary")

    visible_buttons = []
    for btn in [btn1, btn2]:
        if not btn:
            continue
        lbl_upper = btn["label"].upper()
        if "DETAIL" in lbl_upper or "VIEW APP" in lbl_upper:
            continue
        visible_buttons.append(btn)

    actions_html = ""
    if visible_buttons:
        btn_items = []
        for b in visible_buttons:
            btn_items.append(
                f'<a href="{b["url"]}" {b["target"]} class="{b["class"]}"><i class="{b["icon"]}"></i>&nbsp;{html.escape(b["label"])}</a>')
        actions_html = f'<div class="app-detail-actions">{"".join(btn_items)}</div>'

    # Render body
    rendered_body = render_markdown_body(
        body) if body.strip() else f"<p>{esc_desc}</p>"

    return f"""<!doctype html>
<html lang="en">

<head>
    <base href="../">
    <script>(function(){{try{{var t=localStorage.getItem('eg1_theme')||'light-gray';document.documentElement.setAttribute('data-theme',t);}}catch(e){{document.documentElement.setAttribute('data-theme','light-gray');}}}})();</script>
    <title>{esc_title} - EG1 Applications</title>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=2, user-scalable=no" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta charset="UTF-8" />
    <meta name="title" content="{esc_title} - EG1 Applications" />
    <meta name="description" content="{esc_desc}" />
    <link rel="canonical" href="{page_url}" />

    <!-- Open Graph / Facebook / WhatsApp -->
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="EG1" />
    <meta property="og:url" content="{page_url}" />
    <meta property="og:title" content="{esc_title} - EG1 Applications" />
    <meta property="og:description" content="{esc_desc}" />
    <meta property="og:image" content="{image_url}" />
    <meta property="og:image:alt" content="{esc_title}" />

    <!-- Twitter / X -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="{page_url}" />
    <meta name="twitter:title" content="{esc_title} - EG1 Applications" />
    <meta name="twitter:description" content="{esc_desc}" />
    <meta name="twitter:image" content="{image_url}" />

    <!-- Schema.org SoftwareApplication Structured Data -->
    <script type="application/ld+json">
    {{
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "{esc_title}",
      "description": "{esc_desc}",
      "applicationCategory": "{html.escape(str(meta.get('category', 'Utilities')))}",
      "softwareVersion": "{version}",
      "url": "{page_url}",
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
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'><circle cx='60' cy='60' r='58' fill='%23000000'/><circle cx='60' cy='60' r='54' fill='none' stroke='%23ffffff' stroke-width='4'/><text x='50%25' y='68%25' font-family='Great Vibes, Georgia, serif' font-style='italic' font-weight='bold' font-size='50' fill='%23ffffff' text-anchor='middle'>EG1</text></svg>" />

    <!-- Application Context -->
    <script>
        window.ACTIVE_APP_ID = "{app_id}";
        window.ACTIVE_APP_SLUG = "{slug}";
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
                    <h1><span>{esc_title}</span></h1>
                </div>
            </div>

            <!-- App Detail Card -->
            <div class="box-90 content">
                <div class="row">
                    <div class="col-md-12">
                        <div class="app-detail-card">
                            <div class="app-detail-header">
                                <img src="{icon_src}" onerror="this.onerror=null;this.src=window.DEFAULT_APP_ICON||window.DEFAULT_PLACEHOLDER_ICON;" class="app-detail-icon" alt="{esc_title}" />
                                <div class="app-detail-info">
                                    <h2 class="app-detail-title">{esc_title}</h2>
                                    <div class="app-detail-version"><strong>Version:</strong> <span data-product-version-id="{app_id}">{version}</span></div>
                                    <div class="app-detail-description">
                                        {rendered_body}
                                    </div>
                                    {actions_html}
                                </div>
                            </div>
                            <div class="app-detail-footer">
                                <a href="apps.html" class="btn btn-back-apps"><i class="fa fa-arrow-left icon icon-arrow-left"></i>&nbsp;Back to all apps</a>
                                <button type="button" class="btn btn-share-app" id="btnShareApp" data-title="{esc_title}" data-desc="{esc_desc}" data-url="{page_url}">
                                    <i class="fa fa-share-alt icon icon-share"></i>&nbsp;Share
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Footer loaded by include-components.js -->
            <div id="footer-placeholder"></div>
        </div>
    </center>

    <!-- Shared Application Scripts -->
    <script src="js/app.js" type="text/javascript"></script>
    <script src="js/share-app.js" type="text/javascript"></script>
</body>

</html>
"""


WORKSPACE_ROOT = Path(__file__).resolve().parents[2]


def main():
    apps_dir = WORKSPACE_ROOT / "data" / "apps"
    out_dir = WORKSPACE_ROOT / "apps"
    out_dir.mkdir(exist_ok=True)

    if not apps_dir.exists():
        print(f"❌ Error: {apps_dir} directory not found.")
        sys.exit(1)

    # Clean out any old generated html files to avoid orphaned filenames
    for old_file in out_dir.glob("*.html"):
        try:
            old_file.unlink()
        except Exception:
            pass

    slug_map: Dict[str, str] = {}
    id_map: Dict[str, str] = {}
    generated_count = 0
    skipped_count = 0

    md_files = sorted(apps_dir.glob("*.md"))
    print(
        f"Inspecting {len(md_files)} application markdown files in '{apps_dir}/'...")

    for f in md_files:
        meta, body = parse_frontmatter(f)
        app_id = str(meta.get("id") or f.stem).strip()
        slug = str(meta.get("slug") or slugify(meta.get("name")
                   or meta.get("product_name") or f.stem)).strip()
        active = str(meta.get("active", "1")).strip().lower()

        if active in ["0", "false", "no"]:
            print(f"  ⏭️  Skipping '{f.name}' (active: {active})")
            continue

        # Check if the app actually needs a detail page
        if not has_details_button(meta, slug):
            print(
                f"  ⏭️  Skipping '{f.name}' (no View Details button; direct Launch/Source app)")
            skipped_count += 1
            continue

        slug_map[slug] = app_id
        id_map[app_id] = slug

        # Generate static HTML page
        html_code = generate_app_html(meta, body, slug, app_id)
        out_file = out_dir / f"{slug}.html"
        with open(out_file, "w", encoding="utf-8") as out_fp:
            out_fp.write(html_code)

        print(f"  ✨ Generated: apps/{slug}.html")
        generated_count += 1

    # Save slug mappings dataset for audit & reference
    data_dir = WORKSPACE_ROOT / "automation-scripts" / "data"
    data_dir.mkdir(parents=True, exist_ok=True)
    map_file = data_dir / "app_slugs.json"

    map_data = {
        "idToSlug": id_map,
        "slugToId": slug_map
    }
    with open(map_file, "w", encoding="utf-8") as map_fp:
        json.dump(map_data, map_fp, indent=2)

    print(f"\n==================================================")
    print(
        f"✅ Generated {generated_count} static application pages in '{out_dir}/'!")
    print(
        f"ℹ️  Skipped {skipped_count} direct-action application(s) without details view.")
    print(f"✅ Saved application slug mapping to '{map_file}'.")


if __name__ == "__main__":
    main()
