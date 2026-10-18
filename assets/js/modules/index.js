/**
 * EG1 Homepage Controller (assets/js/modules/index.js)
 * ----------------------------------------------------
 * Orchestrates dynamic loading for:
 * 1. Hero banner title with {version} placeholder hydration from data/website_content.json
 * 2. Dynamic website version check from data/updates.json
 * 3. Optional announcements from data/website_content.json
 *
 * Engineered with modern ES6+ JavaScript, zero Firestore reads,
 * and zero layout shifts.
 */

// Safe HTML entity escaping helper
function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Loads and hydrates the hero title and announcements:
 * - Reads template title (with {version} placeholder) from data/website_content.json via DataCache
 * - Resolves the latest version number from data/updates.json
 * - Replaces {version} dynamically with the active release version (e.g. v3.8.0)
 */
async function loadHeroFromContentAndUpdates() {
    var rawTemplateTitle = "";
    var activeAnnouncements = [];

    try {
        // 1. Fetch homepage content from website_content.json via DataCache
        var newsData = await DataCache.getNews(true);
        if (newsData && newsData.length > 0) {
            rawTemplateTitle = (newsData[0].title || "").trim();
            activeAnnouncements = newsData.filter(function (n) {
                return n.description && n.description.trim().length > 0 && n.description.toLowerCase() !== "welcome to eg1";
            });
        }
    } catch (e) {
        console.warn("[HomePage] Could not load content from website_content.json:", e);
    }

    try {
        // 2. Fetch updates to resolve latest release version from updates.json
        var updates = await $.getJSON("data/updates.json");
        var versionString = "v3.8.0";

        if (Array.isArray(updates)) {
            var latestRelease = updates.find(function (u) {
                return u.type === 'website' && u.version && typeof u.version === 'string' && u.version.trim().length > 0;
            });

            if (!latestRelease) {
                latestRelease = updates.find(function (u) {
                    return u.version && typeof u.version === 'string' && u.version.trim().length > 0;
                });
            }

            if (latestRelease && latestRelease.version) {
                var cleanVersion = latestRelease.version.trim();
                versionString = cleanVersion.toLowerCase().startsWith('v')
                    ? ('v' + cleanVersion.replace(/^[vV]/, ''))
                    : ('v' + cleanVersion);
            }
        }

        // 3. Resolve the template title with the dynamic version
        var defaultTemplate = 'EG1 <sup class="eg1-hero-version">{version}</sup> - An open-source hub for innovative and creative projects';
        var finalTemplate = (rawTemplateTitle && rawTemplateTitle.toLowerCase() !== "welcome to eg1")
            ? rawTemplateTitle
            : defaultTemplate;

        // Remove any carets '^' from the template or version
        finalTemplate = finalTemplate.replace(/\^/g, '');

        // If template doesn't have <sup> tag around {version} or version string, wrap it
        if (finalTemplate.indexOf('<sup') === -1) {
            finalTemplate = finalTemplate.replace(/(\{version\}|[vV]?\d+[\w.-]*)/, '<sup class="eg1-hero-version">$1</sup>');
        }

        // Ensure hyphen separator is always present before "An open-source..."
        if (finalTemplate.indexOf(' - An open-source') === -1) {
            finalTemplate = finalTemplate.replace(/<\/sup>\s*(?!-\s*)An\s+open-source/i, '</sup> - An open-source');
        }

        var resolvedHtml = finalTemplate.replace(/\{version\}/gi, versionString);
        $("#homepageHeroTitle").html(resolvedHtml).css({
            "text-transform": "none",
            "font-family": "Georgia, 'Times New Roman', Times, serif",
            "font-style": "normal",
            "font-weight": "400",
            "color": "var(--banner-heading-color, var(--theme-accent-highlight, #b8860b))"
        });
        if ($("#heroVersionTag").length) {
            $("#heroVersionTag").text(versionString).css({
                "text-transform": "none",
                "font-family": "Georgia, 'Times New Roman', Times, serif",
                "font-style": "normal",
                "font-weight": "400"
            });
        }

    } catch (e) {
        console.warn("[HomePage] Could not resolve version or render title:", e);
    }

    // Render announcements if any
    if (activeAnnouncements.length > 0) {
        var newsHtml = "";
        activeAnnouncements.forEach(function (news) {
            newsHtml +=
                '<div class="row">' +
                '<div class="col-md-12" style="color:rgba(255,255,255,0.92); margin-top:10px; font-size:0.92rem;">' +
                escapeHtml(news.description) +
                "</div></div>";
        });
        $("#newsContainer").html(newsHtml).show();
    } else {
        $("#newsContainer").hide();
    }
}

$(document).ready(function () {
    loadHeroFromContentAndUpdates();
});
