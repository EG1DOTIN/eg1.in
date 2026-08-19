/**
 * Blog page controller for blog.html.
 *
 * Supports three rendering modes:
 * 1. blog.html?id=<id> -> detailed blog view.
 * 2. blog.html -> latest blog preview with sidebar.
 * 3. blog.html?cat=<category> or blog.html?search=<query> -> paginated blog grid.
 *
 * This script keeps the UI logic separate from the HTML template and uses the
 * shared DataCache layer so the page works with the flattened Firestore blog
 * structure introduced by the migration.
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

    function normalizeBlogId(value) {
        return String(value == null ? '' : value).trim();
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
        if (!value) {
            return 'N/A';
        }
        if (typeof value.toDate === 'function') {
            value = value.toDate();
        }
        if (value instanceof Date) {
            return value.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
        }
        var parsed = new Date(value);
        return isNaN(parsed.getTime()) ? 'N/A' : parsed.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    function findBlogById(blogs, requestedId) {
        var normalizedId = normalizeBlogId(requestedId);
        if (!normalizedId) {
            return null;
        }
        return (blogs || []).find(function (blog) {
            return normalizeBlogId(blog.id) === normalizedId;
        }) || null;
    }

    function findBlogByTitle(blogs, titleQuery) {
        if (!titleQuery) return null;
        var target = titleQuery.trim().toLowerCase();
        var targetSlug = target.replace(/[-_\s]+/g, ' ');

        var match = (blogs || []).find(function (b) {
            var blogTitle = b.heading || b.title || '';
            return blogTitle.trim().toLowerCase() === target;
        });
        if (match) return match;

        return (blogs || []).find(function (b) {
            var blogTitle = b.heading || b.title || '';
            if (!blogTitle) return false;
            var bSlug = blogTitle.trim().toLowerCase().replace(/[-_\s]+/g, ' ');
            return bSlug === targetSlug;
        }) || null;
    }

    async function loadBlogDetail() {
        try {
            await waitForFirebase(async function () {
                try {
                    var blogContainer = document.getElementById('blogContainer');
                    if (!blogContainer) {
                        return;
                    }

                    var blogs = await DataCache.getBlogs();
                    var blog = null;
                    if (blogIdParam) {
                        blog = findBlogById(blogs, blogIdParam);
                    }
                    if (!blog && titleParam) {
                        blog = findBlogByTitle(blogs, titleParam);
                    }

                    if (!blog) {
                        blogContainer.innerHTML = '<div class="alert alert-danger">Blog not found. <a href="blog.html">Back to blog</a></div>';
                        return;
                    }

                    var title = escapeHtml(blog.heading || blog.title || 'Untitled Blog');
                    var imageUrl = escapeHtml(blog.output_image || blog.imageUrl || "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%23050814'/><text x='50%' y='62%' font-family='serif' font-size='42' fill='%23ffffff' text-anchor='middle'>EG1</text></svg>");
                    var author = escapeHtml(blog.author || 'Unknown Author');
                    var category = escapeHtml(blog.category || (blog.tags && blog.tags.length > 0 ? blog.tags[0] : 'Uncategorized'));
                    var description = sanitizeRichText(blog.short_description || blog.description || '');
                    var endDescription = sanitizeRichText(blog.end_description || '');
                    var content = sanitizeRichText(blog.full_description || blog.content || '<p>No content available</p>');
                    var createdDate = formatBlogDate(blog.createdAt || blog.release_date);

                    document.title = title + ' - EG1';
                    document.getElementById('blogTitle').innerText = title;

                    await loadCategoryLinks('category-list');
                    document.getElementById('Content3Header').style.display = '';

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
                        '        <!-- <span class="blog-meta-item"><i class="icon icon-user"></i> ' + author + '</span> -->',
                        '        <span class="blog-meta-item"><i class="icon icon-calendar"></i> ' + createdDate + '</span>',
                        '      </div>',
                        '    </div>',
                        '  </div>'
                    ];

                    if (description) {
                        blogHtml.push(
                            '  <div class="row mrgin-top20">',
                            '    <div class="col-md-12 left" style="text-align: left;">',
                            '      <p class="blog-description">' + description + '</p>',
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
                        blogHtml.push(
                            '  <div class="row mrgin-top20">',
                            '    <div class="col-md-12">',
                            '      <div class="blog-tags-detail">'
                        );
                        blog.tags.forEach(function (tag) {
                            blogHtml.push('<a href="blog.html?cat=' + encodeURIComponent(tag) + '" class="tag-link">#' + escapeHtml(tag) + '</a>');
                        });
                        blogHtml.push(
                            '      </div>',
                            '    </div>',
                            '  </div>'
                        );
                    }

                    blogHtml.push(
                        '  <div class="row mrgin-top30">',
                        '    <div class="col-md-12">',
                        '      <a href="blog.html" class="btn btn-primary">← Back to Blog</a>',
                        '    </div>',
                        '  </div>',
                        '</div>'
                    );

                    blogContainer.innerHTML = blogHtml.join('');
                    $('#blogContainer').removeClass('col-md-12').removeClass('col-md-8').removeClass('col-md-9').addClass('col-md-8');
                    $('#sidebarColumn').show();
                    $('#sidebarContainer').show();
                    $('#previousTopics').show();
                    $('#relatedBlogsGrid').show();

                    if (typeof initializeCodeBlocks === 'function') {
                        initializeCodeBlocks();
                    }
                } catch (error) {
                    console.error('Error loading blog detail:', error);
                    blogContainer.innerHTML = '<div class="alert alert-danger">Error loading blog: ' + escapeHtml(error.message) + '</div>';
                }
            });
        } catch (error) {
            console.error('Error:', error);
            if (document.getElementById('blogContainer')) {
                document.getElementById('blogContainer').innerHTML = '<div class="alert alert-danger">Error: ' + escapeHtml(error.message) + '</div>';
            }
        }
    }

    async function loadSidebarTopics() {
        try {
            await waitForFirebase(async function () {
                try {
                    var blogs = await DataCache.getBlogs();
                    var currentBlog = null;
                    if (blogIdParam) {
                        currentBlog = findBlogById(blogs, blogIdParam);
                    }
                    if (!currentBlog && titleParam) {
                        currentBlog = findBlogByTitle(blogs, titleParam);
                    }

                    var currentId = currentBlog ? currentBlog.id : (blogIdParam || '');

                    var previous = (blogs || []).filter(function (blog) {
                        return normalizeBlogId(blog.id) !== normalizeBlogId(currentId);
                    }).slice(0, 10);

                    var prevHtml = '<div class="sidebar-topic-list"><h3>Previous Topics</h3><ul>';
                    previous.forEach(function (blog) {
                        var title = escapeHtml(blog.heading || blog.title || 'Untitled');
                        var category = escapeHtml(blog.category || (blog.tags && blog.tags.length > 0 ? blog.tags[0] : 'tutorials'));
                        prevHtml += '<li><a href="blog.html?id=' + encodeURIComponent(blog.id) + '"><span class="topic-badge"><i class="fa fa-list-alt"></i> ' + category + '</span> ' + title + '</a></li>';
                    });
                    prevHtml += '</ul></div>';
                    var prevEl = document.getElementById('previousTopics');
                    if (prevEl) {
                        prevEl.innerHTML = prevHtml;
                        prevEl.style.display = '';
                    }

                    var relatedBlogs = [];
                    if (currentBlog) {
                        var sameCategoryBlogs = (blogs || []).filter(function (blog) {
                            var currentCategory = (currentBlog.category || (currentBlog.tags && currentBlog.tags.length > 0 ? currentBlog.tags[0] : '')).toLowerCase();
                            var blogCategory = (blog.category || (blog.tags && blog.tags.length > 0 ? blog.tags[0] : '')).toLowerCase();
                            return blogCategory === currentCategory;
                        });

                        var currentIndex = sameCategoryBlogs.findIndex(function (blog) {
                            return normalizeBlogId(blog.id) === normalizeBlogId(currentId);
                        });

                        if (sameCategoryBlogs.length > 1 && currentIndex !== -1) {
                            var newer = sameCategoryBlogs.slice(0, currentIndex).reverse();
                            var older = sameCategoryBlogs.slice(currentIndex + 1);
                            var takeNewer = Math.min(5, newer.length);
                            var takeOlder = Math.min(5, older.length);
                            if (takeNewer < 5) {
                                takeOlder = Math.min(10 - takeNewer, older.length);
                            }
                            if (takeOlder < 5) {
                                takeNewer = Math.min(10 - takeOlder, newer.length);
                            }
                            var finalNewer = newer.slice(0, takeNewer).reverse();
                            var finalOlder = older.slice(0, takeOlder);
                            relatedBlogs = finalNewer.concat(finalOlder);
                        } else {
                            relatedBlogs = (blogs || []).filter(function (blog) {
                                return normalizeBlogId(blog.id) !== normalizeBlogId(currentId);
                            }).slice(0, 1);
                        }
                    }

                    var relHtml = '<div class="sidebar-topic-list"><h3>Related Topics</h3><ul>';
                    relatedBlogs.forEach(function (blog) {
                        var title = escapeHtml(blog.heading || blog.title || 'Untitled');
                        var category = escapeHtml(blog.category || (blog.tags && blog.tags.length > 0 ? blog.tags[0] : 'tutorials'));
                        relHtml += '<li><a href="blog.html?id=' + encodeURIComponent(blog.id) + '"><span class="topic-badge"><i class="fa fa-list-alt"></i> ' + category + '</span> ' + title + '</a></li>';
                    });
                    relHtml += '</ul></div>';
                    var relEl = document.getElementById('relatedBlogsGrid');
                    if (relEl) {
                        relEl.innerHTML = relHtml;
                        relEl.style.display = '';
                    }
                } catch (error) {
                    console.error('Error loading sidebar topics:', error);
                }
            });
        } catch (error) {
            console.error(error);
        }
    }

    function renderLatestBlogView(blogs) {
        $('#blogContainer').removeClass('col-md-12').removeClass('col-md-8').removeClass('col-md-9').addClass('col-md-8');
        $('#sidebarColumn').show();
        $('#sidebarContainer').show();

        if (!blogs || blogs.length === 0) {
            $('#blogContainer').html('<div class="alert alert-warning">No results found</div>');
            return;
        }

        var latestBlog = blogs.slice().reduce(function (best, current) {
            var idA = Number(String(best.id || '').trim());
            var idB = Number(String(current.id || '').trim());
            if (!isNaN(idA) && !isNaN(idB)) {
                return idB > idA ? current : best;
            }
            return String(current.id || '').localeCompare(String(best.id || ''), undefined, { numeric: true, sensitivity: 'base' }) > 0 ? current : best;
        }, blogs[0]);

        var createdDate = formatBlogDate(latestBlog.createdAt || latestBlog.release_date);
        var title = escapeHtml(latestBlog.heading || latestBlog.title || 'Untitled Blog');
        var imageUrl = escapeHtml(latestBlog.output_image || latestBlog.imageUrl || "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%23050814'/><text x='50%' y='62%' font-family='serif' font-size='42' fill='%23ffffff' text-anchor='middle'>EG1</text></svg>");
        var author = escapeHtml(latestBlog.author || 'Unknown Author');
        var category = escapeHtml(latestBlog.category || (latestBlog.tags && latestBlog.tags.length > 0 ? latestBlog.tags[0] : 'Uncategorized'));
        var content = sanitizeRichText(latestBlog.full_description || latestBlog.content || '<p>No content available</p>');
        var description = sanitizeRichText(latestBlog.short_description || latestBlog.description || '');
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
            '        <!-- <span class="blog-meta-item"><i class="icon icon-user"></i> ' + author + '</span> -->',
            '        <span class="blog-meta-item"><i class="icon icon-calendar"></i> ' + createdDate + '</span>',
            '      </div>',
            '    </div>',
            '  </div>'
        ];

        if (description) {
            blogHtml.push(
                '  <div class="row mrgin-top20">',
                '    <div class="col-md-12 left" style="text-align: left;">',
                '      <p class="blog-description">' + description + '</p>',
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

        if (latestBlog.tags && latestBlog.tags.length > 0) {
            blogHtml.push('  <div class="row mrgin-top20"><div class="col-md-12"><div class="blog-tags-detail">');
            latestBlog.tags.forEach(function (tag) {
                blogHtml.push('<a href="blog.html?cat=' + encodeURIComponent(tag) + '" class="tag-link">#' + escapeHtml(tag) + '</a>');
            });
            blogHtml.push('</div></div></div>');
        }

        blogHtml.push('</div>');
        $('#blogContainer').html(blogHtml.join(''));

        if (typeof initializeCodeBlocks === 'function') {
            initializeCodeBlocks();
        }

        var previous = blogs.slice(1, 11);
        if (previous.length > 0) {
            var prevHtml = '<div class="sidebar-topic-list"><h3>Previous Topics</h3><ul>';
            previous.forEach(function (blog) {
                var titleText = escapeHtml(blog.heading || blog.title || 'Untitled');
                var categoryText = escapeHtml(blog.category || (blog.tags && blog.tags.length > 0 ? blog.tags[0] : 'tutorials'));
                prevHtml += '<li><a href="blog.html?id=' + encodeURIComponent(blog.id) + '"><span class="topic-badge"><i class="fa fa-list-alt"></i> ' + categoryText + '</span> ' + titleText + '</a></li>';
            });
            prevHtml += '</ul></div>';
            $('#previousTopics').html(prevHtml).show();
            $('#relatedBlogsGrid').empty().hide();
        } else {
            $('#previousTopics').empty().hide();
            $('#relatedBlogsGrid').empty().hide();
        }
    }

    function buildPaginationRange(currentPage, totalPages, maxVisible) {
        var safeMaxVisible = Math.max(1, Math.min(maxVisible || 5, totalPages || 1));
        var pages = [];
        if (totalPages <= 1) {
            return pages;
        }

        var start = Math.max(1, currentPage - Math.floor(safeMaxVisible / 2));
        var end = start + safeMaxVisible - 1;

        if (end > totalPages) {
            end = totalPages;
            start = Math.max(1, end - safeMaxVisible + 1);
        }

        if (start > 1) {
            pages.push(1);
            if (start > 2) {
                pages.push('ellipsis');
            }
        }

        for (var index = start; index <= end; index += 1) {
            pages.push(index);
        }

        if (end < totalPages) {
            if (end < totalPages - 1) {
                pages.push('ellipsis');
            }
            pages.push(totalPages);
        }

        return pages;
    }

    function renderBlogsGrid(blogs) {
        $('#blogContainer').removeClass('col-md-12').removeClass('col-md-8').removeClass('col-md-9').addClass('col-md-8');
        $('#sidebarColumn').show();
        $('#sidebarContainer').show();
        $('#previousTopics').empty().hide();
        $('#relatedBlogsGrid').empty().hide();

        if (!blogs || blogs.length === 0) {
            $('#blogContainer').html('<div class="alert alert-warning">No results found</div>');
            return;
        }

        var sortedBlogs = blogs.slice().sort(function (a, b) {
            var idA = String(a.id || '');
            var idB = String(b.id || '');
            var numA = Number(idA);
            var numB = Number(idB);
            if (!isNaN(numA) && !isNaN(numB)) {
                return numA - numB;
            }
            return idA.localeCompare(idB, undefined, { numeric: true, sensitivity: 'base' });
        });

        var limitPerPage = typeof blogsPerPage !== 'undefined' ? blogsPerPage : 18;
        var totalPages = Math.ceil(sortedBlogs.length / limitPerPage);
        var start = (currentPage - 1) * limitPerPage;
        var pageBlogs = sortedBlogs.slice(start, start + limitPerPage);

        var html = '<div class="row">';
        pageBlogs.forEach(function (blog) {
            try {
                html += RenderHelpers.renderBlogCardGrid(blog);
            } catch (error) {
                console.error('Render error:', error);
            }
        });
        html += '</div>';

        if (totalPages > 1) {
            var prevDisabled = currentPage === 1 ? 'disabled' : '';
            var nextDisabled = currentPage >= totalPages ? 'disabled' : '';
            html += '<div id="pagination-controls" class="row blog-item-container" style="margin-top: 20px;">';
            html += '<div class="col-md-12"><div class="text-center"><div class="btn-group">';
            html += '<button class="btn btn-default bg-pager" data-action="prev" ' + prevDisabled + '>&laquo; Previous</button>';
            var pageNumbers = buildPaginationRange(currentPage, totalPages, 5);
            pageNumbers.forEach(function (pageNumber) {
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

    function nextPage() {
        var totalPages = Math.ceil(filteredBlogs.length / blogsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderBlogsGrid(filteredBlogs);
            window.scrollTo(0, 0);
        }
    }

    function previousPage() {
        if (currentPage > 1) {
            currentPage--;
            renderBlogsGrid(filteredBlogs);
            window.scrollTo(0, 0);
        }
    }

    function goToPage(pageNumber) {
        var totalPages = Math.ceil(filteredBlogs.length / blogsPerPage);
        var targetPage = Math.max(1, Math.min(totalPages, Number(pageNumber) || 1));
        if (targetPage !== currentPage) {
            currentPage = targetPage;
            renderBlogsGrid(filteredBlogs);
            window.scrollTo(0, 0);
        }
    }

    async function initializeBlogsHome() {
        try {
            if (blogIdParam || titleParam) {
                document.getElementById('Content3Header').style.display = 'none';
                await loadBlogDetail();
                await loadSidebarTopics();
                return;
            }

            await waitForFirebase(async function () {
                try {
                    allBlogs = await DataCache.getBlogs();
                    filteredBlogs = allBlogs.slice();

                    if (!allBlogs || allBlogs.length === 0) {
                        $('#blogContainer').html('<div class="alert alert-warning">No blogs found</div>');
                        return;
                    }

                    try {
                        await loadCategoryLinks('category-list');
                    } catch (error) {
                        console.error('Error fetching categories:', error);
                        $('#category-list').html('<li><a href="blog.html" class="category-link">All</a></li>');
                    }

                    if (catParam) {
                        var categoryLower = catParam.toLowerCase();
                        filteredBlogs = allBlogs.filter(function (blog) {
                            return (blog.tags && Array.isArray(blog.tags) && blog.tags.some(function (tag) {
                                return tag.toLowerCase() === categoryLower;
                            })) || (blog.category && blog.category.toLowerCase() === categoryLower);
                        });
                        filteredBlogs.sort(function (a, b) {
                            var idA = String(a.id || '');
                            var idB = String(b.id || '');
                            var numA = Number(idA);
                            var numB = Number(idB);
                            if (!isNaN(numA) && !isNaN(numB)) {
                                return numA - numB;
                            }
                            return idA.localeCompare(idB, undefined, { numeric: true, sensitivity: 'base' });
                        });
                        currentPage = 1;
                        $('#Content3Header').show();
                        renderBlogsGrid(filteredBlogs);
                    } else if (searchParam) {
                        document.getElementById('txtSearch').value = searchParam;
                        var term = searchParam.toLowerCase();
                        filteredBlogs = allBlogs.filter(function (blog) {
                            return (blog.title && blog.title.toLowerCase().includes(term)) ||
                                (blog.heading && blog.heading.toLowerCase().includes(term)) ||
                                (blog.description && blog.description.toLowerCase().includes(term)) ||
                                (blog.short_description && blog.short_description.toLowerCase().includes(term)) ||
                                (blog.tags && blog.tags.some(function (tag) {
                                    return tag.toLowerCase().includes(term);
                                }));
                        });
                        filteredBlogs.sort(function (a, b) {
                            var idA = String(a.id || '');
                            var idB = String(b.id || '');
                            var numA = Number(idA);
                            var numB = Number(idB);
                            if (!isNaN(numA) && !isNaN(numB)) {
                                return numA - numB;
                            }
                            return idA.localeCompare(idB, undefined, { numeric: true, sensitivity: 'base' });
                        });
                        currentPage = 1;
                        $('#Content3Header').show();
                        renderBlogsGrid(filteredBlogs);
                    } else {
                        var latestByDate = allBlogs.slice().sort(function (a, b) {
                            var timeA = a.createdAt ? (typeof a.createdAt.toDate === 'function' ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime()) : 0;
                            var timeB = b.createdAt ? (typeof b.createdAt.toDate === 'function' ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime()) : 0;
                            return timeB - timeA;
                        });
                        renderLatestBlogView(latestByDate);
                    }
                } catch (error) {
                    console.error(error);
                    $('#blogContainer').html('<div class="alert alert-danger">' + escapeHtml(error.message) + '</div>');
                }
            });
        } catch (error) {
            console.error(error);
        }
    }

    $(document).ready(function () {
        window.allBlogs = allBlogs;
        window.filteredBlogs = filteredBlogs;
        window.currentPage = currentPage;
        window.renderBlogsGrid = renderBlogsGrid;
        window.nextPage = nextPage;
        window.previousPage = previousPage;
        initializeBlogsHome();

        $(document).on('click', '[data-action="next"]', function () {
            nextPage();
        });
        $(document).on('click', '[data-action="prev"]', function () {
            previousPage();
        });
        $(document).on('click', '[data-action="page"]', function () {
            goToPage($(this).data('page'));
        });
    });
})();
