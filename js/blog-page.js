/**
 * Blog Page Controller (js/blog-page.js)
 * ---------------------------------------
 * Powers blog.html using 100% PURE MARKDOWN (.md) files from data/blog/
 * - Direct fetching of data/blog/id<id>.md
 * - Fast client-side YAML frontmatter parser
 * - Dynamic Markdown-to-HTML rendering with marked.js & GFM tables
 * - Code syntax highlighting with Highlight.js and 1-click Copy button
 * - Zero Firestore database read operations!
 */
(function () {
    'use strict';

    var urlParams = new URLSearchParams(window.location.search);
    var blogIdParam = urlParams.get('id');
    var titleParam = urlParams.get('title') || urlParams.get('id?title');
    var catParam = urlParams.get('cat');
    var searchParam = urlParams.get('search');

    var allBlogs = [];
    var filteredBlogs = [];
    var currentPage = 1;
    var blogsPerPage = 18;

    var DEFAULT_PLACEHOLDER_ICON = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'><circle cx='60' cy='60' r='58' fill='%23000000'/><circle cx='60' cy='60' r='54' fill='none' stroke='%23ffffff' stroke-width='4'/><text x='50%25' y='68%25' font-family='Great Vibes, Georgia, serif' font-style='italic' font-weight='bold' font-size='50' fill='%23ffffff' text-anchor='middle'>EG1</text></svg>";

    // Known list of Markdown blog IDs in data/blog/
    var KNOWN_BLOG_IDS = [
        "70", "69", "68", "67", "64", "63", "62", "61", "60", "59", "58", "57", "56", "55",
        "54", "53", "51", "50", "49", "48", "47", "46", "45", "44", "43", "42", "41", "40",
        "39", "38", "37", "36", "35", "21", "20", "19", "18", "17", "16", "15", "14", "13",
        "12", "11", "10", "7", "6"
    ];

    // If a custom ID is requested via URL, dynamically include it in our scan
    if (blogIdParam) {
        var requestedCleanId = String(blogIdParam).trim().replace(/^id/i, '');
        if (!KNOWN_BLOG_IDS.includes(requestedCleanId)) {
            KNOWN_BLOG_IDS.unshift(requestedCleanId);
        }
    }

    // Configure marked.js options for GFM, tables, and line breaks
    if (typeof marked !== 'undefined') {
        marked.setOptions({
            gfm: true,
            breaks: true,
            headerIds: true,
            mangle: false
        });
    }

    // ── Helper Utilities ────────────────────────────────────────────────────────

    function normalizeBlogId(value) {
        if (!value) return '';
        return String(value).trim().replace(/^id/i, '');
    }

    function escapeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function sanitizeRichText(value) {
        return String(value == null ? '' : value)
            .replace(/<script[\s\S]*?<\/script>/gi, '')
            .replace(/on\w+\s*=\s*("[^"]*"|'[^']*')/gi, '')
            .replace(/javascript:/gi, '');
    }

    function formatBlogDate(value) {
        if (!value) return 'N/A';
        var parsed = new Date(value);
        return isNaN(parsed.getTime()) ? 'N/A' : parsed.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    function getBlogSlug(blog) {
        if (!blog) return 'article';
        if (blog.slug) return blog.slug;
        var title = String(blog.heading || blog.title || ('article-' + (blog.id || ''))).trim();
        var s = title
            .replace(/c\+\+/gi, 'cpp')
            .replace(/c#/gi, 'csharp')
            .replace(/f#/gi, 'fsharp')
            .replace(/\.net\b/gi, 'dotnet')
            .replace(/&/g, ' and ')
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/[\s-]+/g, '-');
        return s || ('article-' + (blog.id || ''));
    }

    function getBlogUrl(blog) {
        var slug = getBlogSlug(blog);
        return 'blog/' + slug + '.html';
    }

    // ── Pure JavaScript YAML Frontmatter Parser ────────────────────────────────

    function parseFrontmatterAndMarkdown(rawText) {
        if (!rawText) return { metadata: {}, body: '' };

        var match = rawText.match(/^---\s*[\r\n]+([\s\S]*?)[\r\n]+---\s*[\r\n]+([\s\S]*)$/);
        if (!match) {
            return { metadata: {}, body: rawText };
        }

        var yamlContent = match[1];
        var markdownBody = match[2];
        var metadata = {};

        var lines = yamlContent.split(/\r?\n/);
        var currentKey = null;

        lines.forEach(function (line) {
            var trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) return;

            var colonIdx = line.indexOf(':');
            if (colonIdx !== -1) {
                var key = line.slice(0, colonIdx).trim();
                var rawVal = line.slice(colonIdx + 1).trim();

                // Clean string quotes & unescape sequences
                if ((rawVal.startsWith('"') && rawVal.endsWith('"')) || (rawVal.startsWith("'") && rawVal.endsWith("'"))) {
                    rawVal = rawVal.slice(1, -1);
                    rawVal = rawVal.replace(/\\n/g, ' ').replace(/\\r/g, '').replace(/\\t/g, ' ').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
                } else if (rawVal.startsWith('[') && rawVal.endsWith(']')) {
                    // Parse simple array: ["c", "tutorials"]
                    var inner = rawVal.slice(1, -1);
                    rawVal = inner.split(',').map(function (item) {
                        return item.trim().replace(/^["']|["']$/g, '');
                    }).filter(Boolean);
                } else {
                    rawVal = rawVal.replace(/\\n/g, ' ').replace(/\\r/g, '').replace(/\\t/g, ' ').replace(/\\"/g, '"');
                }

                metadata[key] = (typeof rawVal === 'string') ? rawVal.trim() : rawVal;
                currentKey = key;
            }
        });

        return { metadata: metadata, body: markdownBody };
    }

    // ── Direct Markdown Fetcher ────────────────────────────────────────────────

    window.MarkdownStore = {
        _cache: {},

        fetchSingleBlog: async function (blogId) {
            var cleanId = normalizeBlogId(blogId);
            if (this._cache[cleanId]) {
                return this._cache[cleanId];
            }

            var candidateUrls = [
                'data/blog/id' + cleanId + '.md',
                'data/blog/' + cleanId + '.md',
                'data/' + cleanId + '.md'
            ];

            for (var i = 0; i < candidateUrls.length; i++) {
                var url = candidateUrls[i];
                try {
                    var resp = await fetch(url);
                    if (resp.ok) {
                        var text = await resp.text();
                        var parsed = parseFrontmatterAndMarkdown(text);
                        var meta = parsed.metadata;
                        var bodyMd = parsed.body;

                        // Render Markdown to HTML directly in browser
                        var bodyHtml = typeof marked !== 'undefined' ? marked.parse(bodyMd) : bodyMd;

                        var blogItem = {
                            id: meta.id || cleanId,
                            title: meta.title || meta.heading || ('Blog ' + cleanId),
                            heading: meta.heading || meta.title || ('Blog ' + cleanId),
                            category: meta.category || 'General',
                            tags: Array.isArray(meta.tags) ? meta.tags : [meta.category || 'General'],
                            author: meta.author || 'EG1',
                            createdAt: meta.createdAt || meta.release_date || '',
                            release_date: meta.release_date || meta.createdAt || '',
                            output_image: meta.output_image || meta.imageUrl || ('cblog/id' + cleanId + '.webp'),
                            short_description: meta.short_description || meta.description || '',
                            full_description: bodyHtml,
                            raw_markdown: bodyMd,
                            end_description: meta.end_description || '',
                            active: meta.active || '1'
                        };

                        this._cache[cleanId] = blogItem;
                        return blogItem;
                    }
                } catch (e) {
                    // Try next candidate
                }
            }

            return null;
        },

        fetchAllBlogs: async function () {
            // Check localStorage cache first for fast repeat loads
            try {
                localStorage.removeItem('eg1_direct_md_cache');
                localStorage.removeItem('eg1_direct_md_cache_v2');
                localStorage.removeItem('eg1_direct_md_cache_v3');
                localStorage.removeItem('eg1_direct_md_cache_v4');
                var cached = localStorage.getItem('eg1_direct_md_cache_v5');
                if (cached) {
                    var parsedCache = JSON.parse(cached);
                    if (Array.isArray(parsedCache) && parsedCache.length > 0) {
                        return parsedCache;
                    }
                }
            } catch (e) {}

            console.log('[MarkdownBlog] Fetching all .md files in parallel from data/blog/ (0 Firestore Reads)...');
            var promises = KNOWN_BLOG_IDS.map(function (id) {
                return MarkdownStore.fetchSingleBlog(id);
            });

            var results = await Promise.all(promises);
            var validBlogs = results.filter(Boolean);

            // Sort blogs descending by numeric ID
            validBlogs.sort(function (a, b) {
                var numA = Number(normalizeBlogId(a.id));
                var numB = Number(normalizeBlogId(b.id));
                if (!isNaN(numA) && !isNaN(numB)) {
                    return numB - numA;
                }
                return String(b.id).localeCompare(String(a.id), undefined, { numeric: true });
            });

            // Save to localStorage for instant subsequent loads
            try {
                localStorage.setItem('eg1_direct_md_cache_v5', JSON.stringify(validBlogs));
            } catch (e) {}

            return validBlogs;
        }
    };

    // ── Code Block Initializer with Highlighting & Copy Buttons ────────────────

    function initializeCodeBlocks() {
        document.querySelectorAll('.ai-blog-content pre').forEach(function (pre) {
            var code = pre.querySelector('code') || pre;

            // Apply Highlight.js syntax highlighting
            if (typeof hljs !== 'undefined' && typeof hljs.highlightElement === 'function') {
                hljs.highlightElement(code);
            }

            // Prevent duplicate wrapper
            if (pre.parentElement && pre.parentElement.classList.contains('code-wrapper')) {
                return;
            }

            // Detect language
            var language = 'CODE';
            if (pre.classList) {
                pre.classList.forEach(function (cls) {
                    if (cls.startsWith('language-')) {
                        language = cls.replace('language-', '').toUpperCase();
                    }
                });
            }
            if (code.classList) {
                code.classList.forEach(function (cls) {
                    if (cls.startsWith('language-')) {
                        language = cls.replace('language-', '').toUpperCase();
                    }
                });
            }

            // Create wrapper
            var wrapper = document.createElement('div');
            wrapper.className = 'code-wrapper';

            var header = document.createElement('div');
            header.className = 'code-header';

            var lang = document.createElement('span');
            lang.innerText = language;

            var copyBtn = document.createElement('button');
            copyBtn.className = 'code-copy-btn';
            copyBtn.innerText = 'Copy';
            copyBtn.onclick = function () {
                var text = code.innerText;
                navigator.clipboard.writeText(text).then(function () {
                    copyBtn.innerText = 'Copied!';
                    setTimeout(function () {
                        copyBtn.innerText = 'Copy';
                    }, 2000);
                });
            };

            header.appendChild(lang);
            header.appendChild(copyBtn);
            wrapper.appendChild(header);
            wrapper.appendChild(pre.cloneNode(true));
            pre.parentElement.replaceChild(wrapper, pre);
        });
    }

    // ── Card Renderer ──────────────────────────────────────────────────────────

    function renderBlogCardGrid(blog) {
        var imageUrl = blog.output_image || blog.imageUrl || DEFAULT_PLACEHOLDER_ICON;
        var title = escapeHtml(blog.heading || blog.title || 'Untitled');
        var category = escapeHtml(blog.category || (blog.tags && blog.tags.length > 0 ? blog.tags[0] : 'Uncategorized'));
        var rawDesc = blog.short_description || blog.description || '';
        var plainDesc = rawDesc.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        var shortDesc = plainDesc.length > 120 ? plainDesc.substring(0, 120) + '...' : plainDesc;
        var blogUrl = getBlogUrl(blog);

        return [
            '<div class="col-md-4 margin-bottom blog-item-container">',
            '    <div class="our-product blogs blog-grid-card" data-url="' + escapeHtml(blogUrl) + '" role="link" tabindex="0" style="cursor:pointer;">',
            '        <div class="row">',
            '            <div class="col-md-12 left">',
            '                <div class="blogimg">',
            '                    <a href="' + escapeHtml(blogUrl) + '">',
            '                        <img src="' + imageUrl + '" alt="' + title + '" loading="lazy" style="width: 100%; height: 200px; object-fit: cover;" />',
            '                    </a>',
            '                </div>',
            '                <div class="blogbody">',
            '                    <a href="' + escapeHtml(blogUrl) + '">',
            '                        <h3 class="blogs-title">' + title + '</h3>',
            '                        <p>',
            '                          <small>',
            '                            <i class="icon icon-list-alt"></i>&nbsp;' + category,
            '                          </small>',
            '                        </p>',
            '                        <div class="shortcontent">' + escapeHtml(shortDesc) + '</div>',
            '                    </a>',
            '                </div>',
            '            </div>',
            '        </div>',
            '    </div>',
            '</div>'
        ].join('\n');
    }

    // ── Category Links Loader ──────────────────────────────────────────────────

    async function loadCategoryLinks(listElementId, blogs) {
        var categorySet = new Set();
        (blogs || []).forEach(function (b) {
            if (b.category) categorySet.add(b.category);
        });
        var categories = Array.from(categorySet).sort();
        var categoryHtml = '';
        categories.forEach(function (catName) {
            categoryHtml +=
                '<li><a href="blog.html?cat=' +
                encodeURIComponent(catName) +
                '" class="category-link">' +
                escapeHtml(catName) +
                '</a></li>';
        });
        var el = document.getElementById(listElementId);
        if (el) el.innerHTML = categoryHtml;
    }

    // ── Blog Detail View (Loads Single .md Directly!) ──────────────────────────

    async function loadBlogDetail(targetId) {
        var blogContainer = document.getElementById('blogContainer');
        if (!blogContainer) return;

        blogContainer.innerHTML = '<div class="loading-message"><span class="loader"></span> Loading article...</div>';

        var blog = await MarkdownStore.fetchSingleBlog(targetId);

        if (!blog && titleParam) {
            var all = await MarkdownStore.fetchAllBlogs();
            blog = all.find(function (b) {
                return (b.title || '').toLowerCase() === titleParam.toLowerCase();
            });
        }

        if (!blog) {
            blogContainer.innerHTML = '<div class="alert alert-danger">Blog post not found. <a href="blog.html">Back to blog</a></div>';
            return;
        }

        var title = escapeHtml(blog.heading || blog.title || 'Untitled Blog');
        var imageUrl = escapeHtml(blog.output_image || DEFAULT_PLACEHOLDER_ICON);
        var category = escapeHtml(blog.category || 'Uncategorized');
        var description = sanitizeRichText(blog.short_description || '');
        var endDescription = sanitizeRichText(blog.end_description || '');
        var content = sanitizeRichText(blog.full_description || '<p>No content available</p>');
        var createdDate = formatBlogDate(blog.createdAt || blog.release_date);

        document.title = title + ' - EG1 Blog';
        var titleEl = document.getElementById('blogTitle');
        if (titleEl) titleEl.innerText = title;

        var headerEl = document.getElementById('Content3Header');
        if (headerEl) headerEl.style.display = '';

        var blogHtml = [
            '<div class="our-product">',
            '  <div class="row">',
            '    <div class="col-md-12">',
            '      <div class="blog-featured-image-container">',
            '        <img src="' + imageUrl + '" alt="' + title + '" class="blog-featured-image" loading="lazy" />',
            '      </div>',
            '    </div>',
            '  </div>',
            '  <div class="row mrgin-top20">',
            '    <div class="col-md-12 left">',
            '      <h3 class="blog-detail-title">' + title + '</h3>',
            '      <div class="blog-detail-meta">',
            '        <span class="blog-meta-item"><i class="icon icon-list-alt"></i> ' + category + '</span>',
            '        <span class="blog-meta-item"><i class="icon icon-calendar"></i> ' + createdDate + '</span>',
            '      </div>',
            '    </div>',
            '  </div>'
        ];

        if (description) {
            var renderedDesc = typeof marked !== 'undefined' ? marked.parseInline(description) : escapeHtml(description);
            blogHtml.push(
                '  <div class="row mrgin-top20">',
                '    <div class="col-md-12 left" style="text-align: left;">',
                '      <p class="blog-description">' + renderedDesc + '</p>',
                '    </div>',
                '  </div>'
            );
        }

        blogHtml.push(
            '  <div class="row mrgin-top20">',
            '    <div class="col-md-12">',
            '      <div class="ai-blog-content" style="background: transparent; text-align: left;">',
            '        <div style="word-break: break-word; overflow-wrap: break-word;">' + content + '</div>',
            '      </div>',
            '    </div>',
            '  </div>'
        );

        if (endDescription) {
            blogHtml.push(
                '  <div class="row mrgin-top20">',
                '    <div class="col-md-12 left" style="text-align: left;">',
                '      ' + endDescription,
                '    </div>',
                '  </div>'
            );
        }

        if (blog.tags && blog.tags.length > 0) {
            blogHtml.push('  <div class="row mrgin-top15"><div class="col-md-12"><div class="blog-tags-detail">');
            blog.tags.forEach(function (tag) {
                blogHtml.push('<a href="blog.html?cat=' + encodeURIComponent(tag) + '" class="tag-link">#' + escapeHtml(tag) + '</a>');
            });
            blogHtml.push('</div></div></div>');
        }

        // ── Single Minimalist Share Button (Bottom of Center Article Block) ─
        var shareSlug = window.ACTIVE_BLOG_SLUG || getBlogSlug(blog);
        var canonicalUrl = 'https://www.eg1.in/blog/' + shareSlug + '.html';

        blogHtml.push(
            '  <div class="row mrgin-top15">',
            '    <div class="col-md-12">',
            '      <div class="blog-share-action-bar">',
            '        <button type="button" class="btn btn-share-single" id="btnShareArticle" data-url="' + escapeHtml(canonicalUrl) + '" title="Share this tutorial"><i class="fa fa-share-alt"></i> <span id="shareBtnLabel">Share</span></button>',
            '      </div>',
            '    </div>',
            '  </div>'
        );

        blogHtml.push(
            '  <div class="row mrgin-top15">',
            '    <div class="col-md-12">',
            '      <div class="blog-back-section">',
            '        <a href="blog.html" class="btn btn-primary">← Back to Blog</a>',
            '      </div>',
            '    </div>',
            '  </div>',
            '</div>'
        );

        blogContainer.innerHTML = blogHtml.join('');
        $('#blogContainer').removeClass('col-md-12 col-md-9').addClass('col-md-8');
        $('#sidebarColumn, #sidebarContainer, #previousTopics, #relatedBlogsGrid').show();

        initializeCodeBlocks();
        initializeShareButtons(blog, canonicalUrl);

        // Load sidebar topics in background
        loadSidebarTopics(blog);
    }

    // ── Interactive Share Button Event Handlers ─────────────────────────────────

    function initializeShareButtons(blog, canonicalUrl) {
        var shareTitle = blog.heading || blog.title || 'EG1 Tutorial';
        var shareText = 'Check out this tutorial on EG1: ' + shareTitle;

        $('#btnShareArticle').off('click').on('click', async function (e) {
            e.preventDefault();
            var $label = $('#shareBtnLabel');

            function showCopyFeedback() {
                var $toast = $('.share-copy-toast');
                if (!$toast.length) {
                    $toast = $('<div class="share-copy-toast"><i class="fa fa-check-circle"></i> Link copied to clipboard!</div>');
                    $('body').append($toast);
                }
                $toast.addClass('show');
                $label.text('Copied!');
                setTimeout(function () {
                    $toast.removeClass('show');
                    $label.text('Share');
                }, 2500);
            }

            if (navigator.share) {
                try {
                    await navigator.share({
                        title: shareTitle,
                        text: shareText,
                        url: canonicalUrl
                    });
                } catch (err) {
                    if (err && err.name !== 'AbortError') {
                        fallbackCopy(canonicalUrl, showCopyFeedback);
                    }
                }
            } else if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(canonicalUrl).then(showCopyFeedback).catch(function () {
                    fallbackCopy(canonicalUrl, showCopyFeedback);
                });
            } else {
                fallbackCopy(canonicalUrl, showCopyFeedback);
            }
        });

        function fallbackCopy(text, callback) {
            var temp = document.createElement('textarea');
            temp.value = text;
            temp.style.position = 'fixed';
            temp.style.opacity = '0';
            document.body.appendChild(temp);
            temp.select();
            try {
                document.execCommand('copy');
                if (callback) callback();
            } catch (err) {}
            document.body.removeChild(temp);
        }
    }

    // ── Sidebar Topics ─────────────────────────────────────────────────────────

    async function loadSidebarTopics(currentBlog) {
        var blogs = await MarkdownStore.fetchAllBlogs();
        var currentId = currentBlog ? normalizeBlogId(currentBlog.id) : (normalizeBlogId(blogIdParam) || '');

        var previous = blogs.filter(function (b) {
            return normalizeBlogId(b.id) !== currentId;
        }).slice(0, 10);

        var prevHtml = '<div class="sidebar-topic-list"><h3>Previous Topics</h3><ul>';
        previous.forEach(function (b) {
            var title = escapeHtml(b.heading || b.title || 'Untitled');
            var category = escapeHtml(b.category || 'tutorials');
            var bUrl = getBlogUrl(b);
            prevHtml += '<li><a href="' + escapeHtml(bUrl) + '"><span class="topic-badge"><i class="fa fa-list-alt"></i> ' + category + '</span> ' + title + '</a></li>';
        });
        prevHtml += '</ul></div>';

        var prevEl = document.getElementById('previousTopics');
        if (prevEl) {
            prevEl.innerHTML = prevHtml;
            prevEl.style.display = '';
        }

        var relatedBlogs = [];
        if (currentBlog) {
            var currentCat = String(currentBlog.category || '').toLowerCase();
            relatedBlogs = blogs.filter(function (b) {
                return String(b.category || '').toLowerCase() === currentCat && normalizeBlogId(b.id) !== currentId;
            }).slice(0, 10);
        }

        var relHtml = '<div class="sidebar-topic-list"><h3>Related Topics</h3><ul>';
        relatedBlogs.forEach(function (b) {
            var title = escapeHtml(b.heading || b.title || 'Untitled');
            var category = escapeHtml(b.category || 'tutorials');
            var bUrl = getBlogUrl(b);
            relHtml += '<li><a href="' + escapeHtml(bUrl) + '"><span class="topic-badge"><i class="fa fa-list-alt"></i> ' + category + '</span> ' + title + '</a></li>';
        });
        relHtml += '</ul></div>';

        var relEl = document.getElementById('relatedBlogsGrid');
        if (relEl) {
            relEl.innerHTML = relHtml;
            relEl.style.display = '';
        }

        await loadCategoryLinks('category-list', blogs);
    }

    // ── Latest Blog View ───────────────────────────────────────────────────────

    async function renderLatestBlogView(blogs) {
        $('#blogContainer').removeClass('col-md-12 col-md-9').addClass('col-md-8');
        $('#sidebarColumn, #sidebarContainer').show();

        if (!blogs || blogs.length === 0) {
            $('#blogContainer').html('<div class="alert alert-warning">No blogs found in data/blog/</div>');
            return;
        }

        var latestBlog = blogs[0];
        var createdDate = formatBlogDate(latestBlog.createdAt || latestBlog.release_date);
        var title = escapeHtml(latestBlog.heading || latestBlog.title || 'Untitled Blog');
        var imageUrl = escapeHtml(latestBlog.output_image || DEFAULT_PLACEHOLDER_ICON);
        var category = escapeHtml(latestBlog.category || 'Uncategorized');
        var content = sanitizeRichText(latestBlog.full_description || '<p>No content available</p>');
        var description = sanitizeRichText(latestBlog.short_description || '');
        var endDescription = sanitizeRichText(latestBlog.end_description || '');

        var blogHtml = [
            '<div class="our-product">',
            '  <div class="row">',
            '    <div class="col-md-12">',
            '      <div class="blog-featured-image-container">',
            '        <img src="' + imageUrl + '" alt="' + title + '" class="blog-featured-image" loading="lazy" />',
            '      </div>',
            '    </div>',
            '  </div>',
            '  <div class="row mrgin-top20">',
            '    <div class="col-md-12 left">',
            '      <h3 class="blog-detail-title">' + title + '</h3>',
            '      <div class="blog-detail-meta">',
            '        <span class="blog-meta-item"><i class="icon icon-list-alt"></i> ' + category + '</span>',
            '        <span class="blog-meta-item"><i class="icon icon-calendar"></i> ' + createdDate + '</span>',
            '      </div>',
            '    </div>',
            '  </div>'
        ];

        if (description) {
            var renderedDesc = typeof marked !== 'undefined' ? marked.parseInline(description) : escapeHtml(description);
            blogHtml.push(
                '  <div class="row mrgin-top20">',
                '    <div class="col-md-12 left" style="text-align: left;">',
                '      <p class="blog-description">' + renderedDesc + '</p>',
                '    </div>',
                '  </div>'
            );
        }

        blogHtml.push(
            '  <div class="row mrgin-top20">',
            '    <div class="col-md-12">',
            '      <div class="ai-blog-content" style="background: transparent; text-align: left;">',
            '        <div style="word-break: break-word; overflow-wrap: break-word;">' + content + '</div>',
            '      </div>',
            '    </div>',
            '  </div>'
        );

        if (endDescription) {
            blogHtml.push(
                '  <div class="row mrgin-top20">',
                '    <div class="col-md-12 left" style="text-align: left;">',
                '      ' + endDescription,
                '    </div>',
                '  </div>'
            );
        }

        blogHtml.push('</div>');
        $('#blogContainer').html(blogHtml.join(''));
        initializeCodeBlocks();

        var previous = blogs.slice(1, 11);
        if (previous.length > 0) {
            var prevHtml = '<div class="sidebar-topic-list"><h3>Previous Topics</h3><ul>';
            previous.forEach(function (b) {
                var titleText = escapeHtml(b.heading || b.title || 'Untitled');
                var categoryText = escapeHtml(b.category || 'tutorials');
                var bUrl = getBlogUrl(b);
                prevHtml += '<li><a href="' + escapeHtml(bUrl) + '"><span class="topic-badge"><i class="fa fa-list-alt"></i> ' + categoryText + '</span> ' + titleText + '</a></li>';
            });
            prevHtml += '</ul></div>';
            $('#previousTopics').html(prevHtml).show();
            $('#relatedBlogsGrid').empty().hide();
        }
    }

    // ── Paginated Grid View ────────────────────────────────────────────────────

    function buildPaginationRange(currentPage, totalPages, maxVisible) {
        var safeMaxVisible = Math.max(1, Math.min(maxVisible || 5, totalPages || 1));
        var pages = [];
        if (totalPages <= 1) return pages;

        var start = Math.max(1, currentPage - Math.floor(safeMaxVisible / 2));
        var end = start + safeMaxVisible - 1;

        if (end > totalPages) {
            end = totalPages;
            start = Math.max(1, end - safeMaxVisible + 1);
        }

        if (start > 1) {
            pages.push(1);
            if (start > 2) pages.push('ellipsis');
        }

        for (var idx = start; idx <= end; idx += 1) {
            pages.push(idx);
        }

        if (end < totalPages) {
            if (end < totalPages - 1) pages.push('ellipsis');
            pages.push(totalPages);
        }

        return pages;
    }

    function renderBlogsGrid(blogs) {
        $('#blogContainer').removeClass('col-md-12 col-md-9').addClass('col-md-8');
        $('#sidebarColumn, #sidebarContainer').show();
        $('#previousTopics, #relatedBlogsGrid').empty().hide();

        if (!blogs || blogs.length === 0) {
            $('#blogContainer').html('<div class="alert alert-warning">No results found</div>');
            return;
        }

        var limitPerPage = blogsPerPage || 18;
        var totalPages = Math.ceil(blogs.length / limitPerPage);

        // Calculate slice
        var startIdx = (currentPage - 1) * limitPerPage;
        var endIdx = startIdx + limitPerPage;
        var paginatedBlogs = blogs.slice(startIdx, endIdx);

        var html = '<div class="row mrgin-top10">';
        paginatedBlogs.forEach(function (b) {
            html += renderBlogCardGrid(b);
        });
        html += '</div>';

        // Render pagination controls
        if (totalPages > 1) {
            var prevDisabled = currentPage === 1 ? 'disabled' : '';
            var nextDisabled = currentPage === totalPages ? 'disabled' : '';

            html += '<div id="pagination-controls" class="row blog-item-container" style="margin-top: 20px;">';
            html += '<div class="col-md-12"><div class="text-center"><div class="btn-group">';
            html += '<button class="btn btn-default bg-pager" data-action="prev" ' + prevDisabled + '>&laquo; Previous</button>';

            var paginationRange = buildPaginationRange(currentPage, totalPages, 5);
            paginationRange.forEach(function (pageNumber) {
                if (pageNumber === 'ellipsis') {
                    html += '<span class="btn btn-default bg-pager disabled">…</span>';
                    return;
                }
                var activeClass = pageNumber === currentPage ? 'btn-primary disabled' : 'btn-default bg-pager pagination-btn';
                var dataPage = pageNumber === currentPage ? '' : ' data-action="page" data-page="' + pageNumber + '"';
                html += '<button class="btn ' + activeClass + '"' + dataPage + '>' + pageNumber + '</button>';
            });
            html += '<button class="btn btn-default bg-pager" data-action="next" ' + nextDisabled + '>Next &raquo;</button>';
            html += '</div></div></div></div>';
        }

        $('#blogContainer').html(html);
    }

    function searchBlogs() {
        var searchTerm = ($('#txtSearch').val() || '').trim();
        if (searchTerm) {
            window.location.href = 'blog.html?search=' + encodeURIComponent(searchTerm);
        } else {
            window.location.href = 'blog.html';
        }
    }

    // ── Initialization ─────────────────────────────────────────────────────────

    async function init() {
        try {
            // Check if viewing a static blog page (window.ACTIVE_BLOG_ID is set in HTML)
            if (window.ACTIVE_BLOG_ID) {
                $('#Content3Header').hide();
                await loadBlogDetail(window.ACTIVE_BLOG_ID);
                return;
            }

            // If someone opened blog.html?id=... on legacy entry point, redirect to static URL
            if (blogIdParam) {
                var targetBlog = await MarkdownStore.fetchSingleBlog(blogIdParam);
                if (targetBlog) {
                    var targetUrl = getBlogUrl(targetBlog);
                    window.location.replace(targetUrl);
                    return;
                }
                $('#Content3Header').hide();
                await loadBlogDetail(blogIdParam);
                return;
            }

            allBlogs = await MarkdownStore.fetchAllBlogs();
            filteredBlogs = allBlogs.slice();

            await loadCategoryLinks('category-list', allBlogs);

            if (titleParam) {
                $('#Content3Header').hide();
                await loadBlogDetail(titleParam);
                return;
            }

            if (catParam) {
                var catLower = catParam.toLowerCase();
                filteredBlogs = allBlogs.filter(function (blog) {
                    return (blog.tags && Array.isArray(blog.tags) && blog.tags.some(function (t) { return String(t).toLowerCase() === catLower; })) ||
                        (blog.category && String(blog.category).toLowerCase() === catLower);
                });
                currentPage = 1;
                $('#Content3Header').show();
                $('#blogPageTitleText').text('Category: ' + catParam);
                renderBlogsGrid(filteredBlogs);
            } else if (searchParam) {
                $('#txtSearch').val(searchParam);
                var term = searchParam.toLowerCase();
                filteredBlogs = allBlogs.filter(function (blog) {
                    return (blog.title && blog.title.toLowerCase().includes(term)) ||
                        (blog.heading && blog.heading.toLowerCase().includes(term)) ||
                        (blog.short_description && blog.short_description.toLowerCase().includes(term)) ||
                        (blog.tags && blog.tags.some(function (t) { return String(t).toLowerCase().includes(term); }));
                });
                currentPage = 1;
                $('#Content3Header').show();
                $('#blogPageTitleText').text('Search: "' + searchParam + '"');
                renderBlogsGrid(filteredBlogs);
            } else {
                $('#Content3Header').show();
                $('#blogPageTitleText').text('Blog');
                await renderLatestBlogView(allBlogs);
            }
        } catch (err) {
            console.error('[MarkdownBlog] Error initializing:', err);
            $('#blogContainer').html('<div class="alert alert-danger">Error loading Markdown blogs: ' + escapeHtml(err.message) + '</div>');
        }
    }

    $(document).ready(function () {
        init();

        $(document).on('click', '[data-action="next"]', function () {
            var totalPages = Math.ceil(filteredBlogs.length / blogsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                renderBlogsGrid(filteredBlogs);
                window.scrollTo(0, 0);
            }
        });

        $(document).on('click', '[data-action="prev"]', function () {
            if (currentPage > 1) {
                currentPage--;
                renderBlogsGrid(filteredBlogs);
                window.scrollTo(0, 0);
            }
        });

        $(document).on('click', '[data-action="page"]', function () {
            var target = Number($(this).data('page'));
            if (target && target !== currentPage) {
                currentPage = target;
                renderBlogsGrid(filteredBlogs);
                window.scrollTo(0, 0);
            }
        });

        $(document).on('click', '#btnSearchBlog', function (e) {
            e.preventDefault();
            searchBlogs();
        });

        $(document).on('keydown', '#txtSearch', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                searchBlogs();
            }
        });

        $(document).on('click', '.blog-grid-card', function (e) {
            if (!$(e.target).closest('a').length) {
                var url = $(this).data('url');
                if (url) window.location.href = url;
            }
        });
    });
})();
