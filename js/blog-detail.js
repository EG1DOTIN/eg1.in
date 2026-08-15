/**
 * Legacy blog detail renderer.
 *
 * This module is retained for compatibility with older detail pages and now
 * reads the flattened blog documents provided by DataCache after the Firestore
 * migration.
 */
(function () {
    'use strict';

    const urlParams = new URLSearchParams(window.location.search);
    const blogId = urlParams.get('id');
    const titleParam = urlParams.get('title') || urlParams.get('id?title');

    function normalizeBlogId(value) {
        return String(value == null ? '' : value).trim();
    }

    function formatDate(value) {
        if (!value) {
            return 'N/A';
        }
        if (typeof value.toDate === 'function') {
            value = value.toDate();
        }
        if (value instanceof Date) {
            return value.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric'});
        }
        const parsed = new Date(value);
        if (isNaN(parsed.getTime())) {
            return 'N/A';
        }
        return parsed.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    async function loadBlogDetail() {
        try {
            const blogPost = document.getElementById('blogPost');
            if (!blogPost) {
                return;
            }
            if (!blogId && !titleParam) {
                blogPost.innerHTML = '<div class="error-message">Blog not found. <a href="blog.html">Back to blogs</a></div>';
                return;
            }

            const blogs = await DataCache.getBlogs(true);
            let blog = null;
            if (blogId) {
                blog = blogs.find(function (item) {
                    return normalizeBlogId(item.id) === normalizeBlogId(blogId);
                });
            }
            if (!blog && titleParam) {
                const target = titleParam.trim().toLowerCase();
                const targetSlug = target.replace(/[-_\s]+/g, ' ');
                blog = blogs.find(function (item) {
                    const t = (item.heading || item.title || '').trim().toLowerCase();
                    return t === target || (t && t.replace(/[-_\s]+/g, ' ') === targetSlug);
                });
            }

            if (!blog) {
                blogPost.innerHTML = '<div class="error-message">Blog not found. <a href="blog.html">Back to blogs</a></div>';
                return;
            }

            const createdDate = formatDate(blog.createdAt || blog.release_date);
            const title = blog.heading || blog.title || 'Untitled Blog';
            const imageUrl = blog.output_image || blog.imageUrl || 'img/eg1logo.webp';
            const author = blog.author || 'Unknown Author';
            const category = blog.category || (blog.tags && blog.tags.length > 0 ? blog.tags[0] : 'Uncategorized');
            const content = blog.full_description || blog.content || '<p>No content available</p>';
            const description = blog.short_description || blog.description || '';
            const endDescription = blog.end_description || '';

            let html = [
                '<div class="blog-header">',
                imageUrl ? '<img src="' + imageUrl + '" alt="' + title + '" class="blog-featured-image" loading="lazy" onerror="this.style.display=\'none\'">' : '',
                '<h1>' + title + '</h1>',
                '<div class="blog-meta-detail">',
                '<span class="author"><i class="fas fa-user"></i> ' + author + '</span>',
                '<span class="date"><i class="fas fa-calendar"></i> ' + createdDate + '</span>',
                '</div>'
            ];

            if (blog.tags && blog.tags.length > 0) {
                html.push('<div class="blog-tags-detail">');
                blog.tags.forEach(function (tag) {
                    html.push('<a href="blog.html?cat=' + encodeURIComponent(tag) + '" class="tag-link">#' + tag + '</a>');
                });
                html.push('</div>');
            }

            html.push('</div>');
            html.push('<div class="blog-body">' + description + '<div class="ai-blog-content">' + content + '</div>' + endDescription + '</div>');
            html.push('<div class="blog-footer"><p><strong>Last updated:</strong> ' + formatDate(blog.updatedAt) + '</p></div>');

            blogPost.innerHTML = html.join('');
            document.title = title + ' - EG1';
        } catch (error) {
            console.error('Error loading blog detail:', error);
            const blogPost = document.getElementById('blogPost');
            if (blogPost) {
                blogPost.innerHTML = '<div class="error-message">Error loading blog: ' + error.message + '</div>';
            }
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        if (typeof waitForFirebase === 'function') {
            waitForFirebase(function () {
                if (typeof window.trackPageVisit === 'function') {
                    window.trackPageVisit('blog-detail');
                }
                loadBlogDetail();
            });
        } else {
            loadBlogDetail();
        }
    });
})();
