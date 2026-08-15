/**
 * Legacy blog grid renderer.
 *
 * This module is kept for compatibility with older blog views that still load
 * a separate blog grid script. It uses the shared DataCache layer so the UI
 * continues to work after the Firestore migration.
 */
(function () {
    'use strict';

    let allBlogs = [];
    let filteredBlogs = [];
    let currentPage = 1;
    const itemsPerPage = 9;
    let allTags = new Set();

    function normalizeBlogId(value) {
        return String(value == null ? '' : value).trim();
    }

    function setActiveTag(tagName) {
        document.querySelectorAll('.tag-btn').forEach(function (button) {
            button.classList.toggle('active', button.getAttribute('data-tag') === tagName);
        });
    }

    async function loadBlogs() {
        try {
            const blogsGrid = document.getElementById('blogsGrid');
            if (!blogsGrid) {
                return;
            }

            blogsGrid.innerHTML = '<div class="loading-message"><span class="loader"></span> Loading blogs...</div>';

            const blogs = await DataCache.getBlogs();
            if (!blogs || blogs.length === 0) {
                blogsGrid.innerHTML = '<div class="no-blogs">No blogs found. Check back soon!</div>';
                return;
            }

            allBlogs = blogs;
            allTags = new Set();
            blogs.forEach(function (blog) {
                if (blog.tags && Array.isArray(blog.tags)) {
                    blog.tags.forEach(function (tag) {
                        allTags.add(tag);
                    });
                }
            });

            displayTags();
            filteredBlogs = [...allBlogs];
            displayBlogs();
        } catch (error) {
            console.error('Error loading blogs:', error);
            const blogsGrid = document.getElementById('blogsGrid');
            if (blogsGrid) {
                blogsGrid.innerHTML = '<div class="error-message">Error loading blogs: ' + error.message + '</div>';
            }
        }
    }

    function displayBlogs() {
        const blogsGrid = document.getElementById('blogsGrid');
        const pagination = document.getElementById('pagination');
        const pageInfo = document.getElementById('pageInfo');
        if (!blogsGrid) {
            return;
        }

        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const pageBlog = filteredBlogs.slice(start, end);

        if (pageBlog.length === 0) {
            blogsGrid.innerHTML = '<div class="no-blogs">No blogs match your search.</div>';
            if (pagination) {
                pagination.style.display = 'none';
            }
            return;
        }

        let html = '';
        pageBlog.forEach(function (blog) {
            const createdDate = blog.createdAt ? new Date(blog.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';
            const shortDescription = (blog.short_description || blog.description || blog.content || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
            const previewText = shortDescription.length > 120 ? shortDescription.substring(0, 120) + '...' : shortDescription;
            const imageUrl = blog.output_image || blog.imageUrl || 'img/eg1logo.webp';

            html += [
                '<div class="blog-card">',
                '  <div class="blog-image">',
                '    <img src="' + imageUrl + '" alt="' + (blog.heading || blog.title || 'Blog') + '" loading="lazy" onerror="this.src=\'img/eg1logo.webp\'">',
                '  </div>',
                '  <div class="blog-content">',
                '    <h3 class="blog-title">' + (blog.heading || blog.title || 'Untitled Blog') + '</h3>',
                '    <p class="blog-description">' + previewText + '</p>',
                '    <div class="blog-meta">',
                '      <span class="author">' + (blog.author || 'Unknown') + '</span>',
                '      <span class="date">' + createdDate + '</span>',
                '    </div>',
                '    <div class="blog-tags">',
                (blog.tags || []).map(function (tag) {
                    return '<span class="tag">' + tag + '</span>';
                }).join(''),
                '    </div>',
                '    <a href="blog.html?id=' + encodeURIComponent(blog.id) + '" class="read-more">Read More →</a>',
                '  </div>',
                '</div>'
            ].join('');
        });

        blogsGrid.innerHTML = html;

        if (pagination) {
            if (filteredBlogs.length > itemsPerPage) {
                pagination.style.display = 'flex';
                if (pageInfo) {
                    pageInfo.textContent = 'Page ' + currentPage + ' of ' + Math.ceil(filteredBlogs.length / itemsPerPage);
                }
            } else {
                pagination.style.display = 'none';
            }
        }
    }

    function displayTags() {
        const tagFilter = document.getElementById('tagFilter');
        if (!tagFilter) {
            return;
        }

        let html = '<button class="tag-btn active" data-tag="all" onclick="filterByTag(\'all\')">All</button>';
        allTags.forEach(function (tag) {
            html += '<button class="tag-btn" data-tag="' + tag + '" onclick="filterByTag(\'' + tag + '\')">' + tag + '</button>';
        });
        tagFilter.innerHTML = html;
    }

    function filterByTag(tag) {
        if (tag === 'all') {
            filteredBlogs = [...allBlogs];
        } else {
            filteredBlogs = allBlogs.filter(function (blog) {
                return blog.tags && blog.tags.includes(tag);
            });
        }

        setActiveTag(tag);
        currentPage = 1;
        displayBlogs();
    }

    function resetTagFilter() {
        filteredBlogs = [...allBlogs];
        setActiveTag('all');
        currentPage = 1;
        displayBlogs();
    }

    function filterBlogs() {
        const searchInput = document.getElementById('searchInput');
        const searchTerm = (searchInput ? searchInput.value : '').toLowerCase();

        filteredBlogs = allBlogs.filter(function (blog) {
            return (blog.title && blog.title.toLowerCase().includes(searchTerm)) ||
                (blog.heading && blog.heading.toLowerCase().includes(searchTerm)) ||
                (blog.description && blog.description.toLowerCase().includes(searchTerm)) ||
                (blog.short_description && blog.short_description.toLowerCase().includes(searchTerm)) ||
                (blog.author && blog.author.toLowerCase().includes(searchTerm)) ||
                (blog.tags && blog.tags.some(function (tag) {
                    return tag.toLowerCase().includes(searchTerm);
                }));
        });

        currentPage = 1;
        displayBlogs();
    }

    function nextPage() {
        const maxPages = Math.ceil(filteredBlogs.length / itemsPerPage);
        if (currentPage < maxPages) {
            currentPage++;
            displayBlogs();
            window.scrollTo(0, 0);
        }
    }

    function previousPage() {
        if (currentPage > 1) {
            currentPage--;
            displayBlogs();
            window.scrollTo(0, 0);
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        if (typeof window.trackPageVisit === 'function') {
            window.trackPageVisit('blogs');
        }

        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('keyup', filterBlogs);
        }

        loadBlogs();
    });

    window.filterByTag = filterByTag;
    window.resetTagFilter = resetTagFilter;
    window.nextPage = nextPage;
    window.previousPage = previousPage;
})();
