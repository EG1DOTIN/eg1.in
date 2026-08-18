// Blogs Management Module

let editingBlogId = null;
let originalBlogCategory = null;
let originalBlogPageKey = null;

// ── Client-side pagination state ──────────────────────────────────────────────
const BLOGS_PAGE_SIZE = 15;
let blogsPage      = 1;
let blogsHasMore   = false;
let allBlogsFlat   = [];
let blogsSelectedCategory = 'all';

function getBlogDateValue(blog) {
    return blog && (blog.createdAt || blog.release_date);
}

function parseBlogDate(value) {
    if (!value) return null;
    if (typeof value.toDate === 'function') return value.toDate();
    if (typeof value.seconds === 'number') return new Date(value.seconds * 1000);
    if (value instanceof Date) return value;

    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
}

function formatBlogDateForUi(value) {
    const parsed = parseBlogDate(value);
    if (!parsed) return 'N/A';
    return parsed.toLocaleDateString('en-US', { year: 'numeric',month: 'short',day: 'numeric' });
}

function formatBlogDateForFirestore(date) {
    const value = date instanceof Date ? date : new Date(date);
    if (isNaN(value.getTime())) return '';

    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getBlogSortTime(blog) {
    const parsed = parseBlogDate(getBlogDateValue(blog));
    return parsed ? parsed.getTime() : 0;
}

function getBlogSortId(blog) {
    const rawId = String((blog && blog.id) || '').trim();
    const numericId = Number(rawId);
    return !isNaN(numericId) ? numericId : rawId;
}

function sortBlogsByIdThenDate(a, b) {
    const idA = getBlogSortId(a);
    const idB = getBlogSortId(b);

    if (typeof idA === 'number' && typeof idB === 'number' && idA !== idB) {
        return idB - idA;
    }

    const idCompare = String(idB).localeCompare(String(idA), undefined, { numeric: true, sensitivity: 'base' });
    if (idCompare !== 0) return idCompare;

    return getBlogSortTime(b) - getBlogSortTime(a);
}

function stripBlogMetadata(blog) {
    const cleanBlog = Object.assign({}, blog || {});
    delete cleanBlog.id;
    delete cleanBlog._categoryId;
    delete cleanBlog._pageKey;
    return cleanBlog;
}
// ─────────────────────────────────────────────────────────────────────────────

function getBlogCategoryName(blog) {
    return blog && (blog.category || (blog.tags && blog.tags.length ? blog.tags[0] : 'Uncategorized'));
}

function getFilteredBlogsForView() {
    if (!blogsSelectedCategory || blogsSelectedCategory === 'all') return allBlogsFlat;
    const selectedCategory = blogsSelectedCategory.toLowerCase();
    return allBlogsFlat.filter((blog) => String(getBlogCategoryName(blog) || '').toLowerCase() === selectedCategory);
}

function buildPaginationRange(currentPage, totalPages, maxVisible) {
    const safeMaxVisible = Math.max(1, Math.min(maxVisible || 5, totalPages || 1));
    const pages = [];
    if (totalPages <= 1) return pages;

    let start = Math.max(1, currentPage - Math.floor(safeMaxVisible / 2));
    let end = start + safeMaxVisible - 1;

    if (end > totalPages) {
        end = totalPages;
        start = Math.max(1, end - safeMaxVisible + 1);
    }

    if (start > 1) {
        pages.push(1);
        if (start > 2) pages.push('ellipsis');
    }

    for (let index = start; index <= end; index += 1) {
        pages.push(index);
    }

    if (end < totalPages) {
        if (end < totalPages - 1) pages.push('ellipsis');
        pages.push(totalPages);
    }

    return pages;
}

function populateBlogCategoryFilter(blogs) {
    const select = document.getElementById('blogCategoryFilter');
    const datalist = document.getElementById('blogCategoryList');
    if (!select) return;

    const categories = Array.from(new Set((blogs || [])
        .map((blog) => getBlogCategoryName(blog))
        .filter(Boolean)
        .map((value) => String(value).trim())))
        .sort((a, b) => a.localeCompare(b));

    const currentValue = select.value || blogsSelectedCategory || 'all';
    select.innerHTML = '<option value="all">All Categories</option>' +
        categories.map((category) => '<option value="' + category + '">' + category + '</option>').join('');

    if (datalist) {
        datalist.innerHTML = categories.map((category) => '<option value="' + category + '">').join('');
    }

    if (categories.includes(currentValue)) {
        select.value = currentValue;
    } else {
        select.value = 'all';
    }

    blogsSelectedCategory = select.value;
}

function setBlogCategoryFilter(category) {
    blogsSelectedCategory = category || 'all';
    blogsPage = 1;
    renderBlogsListMemory();
}

// Fetch all blogs flat (adapted from mchess)
async function fetchAllBlogsFlat() {
    var cacheKey = 'eg1_blogs_cache_v2';
    var isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:';
    var ttl = isDev ? 60000 : 3600000; // 60s on dev, 1 hour in prod
    var cachedData = localStorage.getItem(cacheKey);
    var cachedTime = localStorage.getItem(cacheKey + '_time');
    var cacheValid = cachedData && cachedTime && (Date.now() - parseInt(cachedTime) < ttl);

    if (cacheValid) {
        return JSON.parse(cachedData);
    }

    const snap = await db.collection('eg1_blog').get();
    let blogs = [];
    snap.forEach(doc => {
        const catData = doc.data();
        const catName = doc.id; // Category name
        for (const [key, value] of Object.entries(catData)) {
            if (key.startsWith('page')) {
                for (const [blogId, blogData] of Object.entries(value)) {
                    blogs.push({ id: blogId, _categoryId: catName, _pageKey: key, ...blogData });
                }
            }
        }
    });
    blogs.sort(sortBlogsByIdThenDate);

    localStorage.setItem(cacheKey, JSON.stringify(blogs));
    localStorage.setItem(cacheKey + '_time', Date.now().toString());

    return blogs;
}

// Show blog form
function showBlogForm() {
    document.getElementById('blogForm').style.display = 'block';
    document.getElementById('blogsList').style.display = 'none';
    resetBlogForm();
}

// Hide blog form
function hideBlogForm() {
    document.getElementById('blogForm').style.display = 'none';
    document.getElementById('blogsList').style.display = 'block';
    resetBlogForm();
}

// Reset blog form
function resetBlogForm() {
    document.getElementById('blogFormElement').reset();
    editingBlogId = null;
    originalBlogCategory = null;
    originalBlogPageKey = null;
    if (typeof tinymce !== 'undefined' && tinymce.get('blogContent')) {
        tinymce.get('blogContent').setContent('');
    }
    document.querySelector('#blogFormElement button[type="submit"]').textContent = 'Save Blog';

    // Clear any leftover success/error message from a previous save,
    // otherwise it stays visible and looks like it fired again on open.
    const messageElement = document.getElementById('blogFormMessage');
    if (messageElement) {
        messageElement.textContent = '';
        messageElement.classList.remove('show', 'success', 'error');
    }
}

// Insert into category logic (from mchess)
async function writeBlogToCategory(catRef, id, blogData, pageKey) {
    const existingDoc = await catRef.get();
    if (!existingDoc.exists) {
        const createPayload = {};
        createPayload[pageKey] = {};
        createPayload[pageKey][id] = blogData;
        await catRef.set(createPayload, { merge: true });
        return;
    }

    const updatePayload = {};
    updatePayload[`${pageKey}.${id}`] = blogData;
    await catRef.update(updatePayload);
}

async function insertIntoCategory(catRef, id, blogData) {
    var catDoc = await catRef.get();
    var pageToUse = 'page1';
    if (catDoc.exists) {
        var catData = catDoc.data();
        var maxPage = 1;
        for (var key of Object.keys(catData)) {
            if (key.startsWith('page')) {
                var pageNum = parseInt(key.replace('page', ''));
                if (pageNum > maxPage) maxPage = pageNum;
            }
        }
        if (Object.keys(catData['page' + maxPage] || {}).length < 18) {
            pageToUse = 'page' + maxPage;
        } else {
            pageToUse = 'page' + (maxPage + 1);
        }
    }
    await writeBlogToCategory(catRef, id, blogData, pageToUse);
}

// Save blog
document.getElementById('blogFormElement').addEventListener('submit', async (e) => {
    e.preventDefault();

    const messageElement = document.getElementById('blogFormMessage');
    messageElement.classList.remove('show', 'success', 'error');

    try {
        const heading          = document.getElementById('blogHeading').value;
        const category         = (document.getElementById('blogCategory').value || '').trim() || 'Uncategorized';
        const shortDescription = document.getElementById('blogShortDescription').value;
        const fullDescription  = (typeof tinymce !== 'undefined' && tinymce.get('blogContent')) ? tinymce.get('blogContent').getContent() : document.getElementById('blogContent').value;
        const endDescription   = document.getElementById('blogEndDescription').value;
        const author           = document.getElementById('blogAuthor').value;
        let   imageUrl         = document.getElementById('blogImageUrl').value;

        const storageRef = firebase.storage().ref();

        const imageFile = document.getElementById('blogImage').files[0];
        if (imageFile) {
            const fileName = 'blogs/' + Date.now() + '_' + imageFile.name;
            const imageRef = storageRef.child(fileName);
            await imageRef.put(imageFile);
            imageUrl = await imageRef.getDownloadURL();
        }

        let blogData = {
            heading:           heading,
            category:          category,
            short_description: shortDescription,
            full_description:  fullDescription,
            end_description:   endDescription,
            author:            author,
            output_image:      imageUrl,
            updatedAt:         new Date().toISOString()
        };

        var catRef = db.collection('eg1_blog').doc(category);

        if (editingBlogId) {
            const oldBlog = allBlogsFlat.find(b => String(b.id) === String(editingBlogId));
            // Merge into a NEW object: old fields first (e.g. createdAt, active),
            // then the freshly-submitted blogData on top so edits actually win.
            blogData = Object.assign({}, stripBlogMetadata(oldBlog), blogData);
            if (originalBlogCategory && originalBlogCategory !== category) {
                // Category changed: delete from old category
                var oldRef = db.collection('eg1_blog').doc(originalBlogCategory);
                var deletePayload = {};
                deletePayload[`${originalBlogPageKey}.${editingBlogId}`] = firebase.firestore.FieldValue.delete();
                await oldRef.update(deletePayload);
            }
            
            if (originalBlogCategory === category && originalBlogPageKey) {
                await writeBlogToCategory(catRef, editingBlogId, blogData, originalBlogPageKey);
            } else {
                await insertIntoCategory(catRef, editingBlogId, blogData);
            }
            messageElement.textContent = 'Blog updated successfully!';
        } else {
            blogData.createdAt = new Date().toISOString();
            var newId = Date.now().toString();
            await insertIntoCategory(catRef, newId, blogData);
            messageElement.textContent = 'Blog created successfully!';
        }

        messageElement.classList.add('show', 'success');

        localStorage.removeItem('eg1_blogs_cache_v2');
        localStorage.removeItem('eg1_blogs_cache_v2_time');
        localStorage.removeItem('eg1_blogs_cache');
        localStorage.removeItem('eg1_blogs_cache_time');
        
        setTimeout(() => {
            hideBlogForm();
            blogsGoToPage(1);
        }, 1500);

    } catch (error) {
        console.error('Error saving blog:', error);
        messageElement.textContent = 'Error: ' + error.message;
        messageElement.classList.add('show', 'error');
    }
});

// Navigate to a specific page number (1-based)
async function blogsGoToPage(page) {
    if (page < 1) return;
    blogsPage = page;
    await loadBlogsList();
}

// Load blogs list
async function loadBlogsList() {
    const tableBody = document.getElementById('blogsTableBody');
    tableBody.innerHTML = '<tr><td colspan="4"><span class="loading"></span> Loading...</td></tr>';

    try {
        const blogs = await fetchAllBlogsFlat();
        allBlogsFlat = blogs;
        populateBlogCategoryFilter(blogs);
        renderBlogsListMemory();
        if (blogsPage === 1) updateBlogsCount();
    } catch (error) {
        console.error('Error loading blogs:', error);
        tableBody.innerHTML = '<tr><td colspan="4" class="no-data">Error loading blogs: ' + error.message + '</td></tr>';
    }
}

function renderBlogsListMemory() {
    const tableBody = document.getElementById('blogsTableBody');
    tableBody.innerHTML = '';

    const visibleBlogs = getFilteredBlogsForView();
    const totalPages = Math.max(1, Math.ceil(visibleBlogs.length / BLOGS_PAGE_SIZE));
    if (blogsPage > totalPages) {
        blogsPage = totalPages;
    }

    if (visibleBlogs.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" class="no-data">No blogs found for this category</td></tr>';
        blogsHasMore = false;
        renderBlogsPagination(0, 0, 0);
        return;
    }

    const from = (blogsPage - 1) * BLOGS_PAGE_SIZE;
    const to = from + BLOGS_PAGE_SIZE;
    const pageDocs = visibleBlogs.slice(from, to);
    blogsHasMore = to < visibleBlogs.length;

    let html = '';
    pageDocs.forEach(data => {
        const createdDate = formatBlogDateForUi(getBlogDateValue(data));

        html += '<tr>' +
            '<td>' + (data.heading || data.title || 'Untitled') + '</td>' +
            '<td>' + (data.author || 'N/A') + '</td>' +
            '<td>' + createdDate + '</td>' +
            '<td class="action-buttons" style="align-items:center;">' +
                '<button class="btn-edit"   data-id="' + data.id + '" data-action="edit-blog">Edit</button>' +
                '<button class="btn-delete" data-id="' + data.id + '" data-action="delete-blog">Delete</button>' +
                '<label class="switch" title="Toggle Visibility">' +
                    '<input type="checkbox" data-id="' + data.id + '" data-action="toggle-blog"' +
                        (data.active !== false && data.active !== '0' ? ' checked' : '') + '>' +
                    '<span class="slider round"></span>' +
                '</label>' +
            '</td>' +
        '</tr>';
    });

    tableBody.innerHTML = html;
    renderBlogsPagination(from + 1, Math.min(to, visibleBlogs.length), visibleBlogs.length);
}

// Render pagination controls
function renderBlogsPagination(from, to, totalCount) {
    const controls = document.getElementById('blogsPagination');
    if (!controls) return;

    const totalPages = Math.max(1, Math.ceil(totalCount / BLOGS_PAGE_SIZE));
    const prevDisabled = blogsPage === 1 ? 'disabled' : '';
    const nextDisabled = blogsPage >= totalPages ? 'disabled' : '';
    const info = totalCount ? 'Page ' + blogsPage + ' &nbsp;(' + from + '&ndash;' + to + ' shown)' : 'Page ' + blogsPage;

    controls.innerHTML =
        '<span class="pagination-info">' + info + '</span>' +
        '<button class="pg-btn" data-table="blogs" data-dir="prev" ' + prevDisabled + '>&#8249; Prev</button>' +
        '<button class="pg-btn active">' + blogsPage + '</button>' +
        '<button class="pg-btn" data-table="blogs" data-dir="next" ' + nextDisabled + '>Next &#8250;</button>';
}

// Edit blog
async function editBlog(blogId) {
    try {
        const blog = allBlogsFlat.find(b => String(b.id) === String(blogId));
        if (!blog) { alert('Blog not found'); return; }
        showBlogForm();

        editingBlogId = blogId;
        originalBlogCategory = blog._categoryId;
        originalBlogPageKey = blog._pageKey;

        document.querySelector('#blogFormElement button[type="submit"]').textContent = 'Update Blog';

        document.getElementById('blogHeading').value          = blog.heading || blog.title || '';
        document.getElementById('blogCategory').value         = blog.category || (blog.tags ? blog.tags.join(', ') : '');
        document.getElementById('blogShortDescription').value = blog.short_description || blog.description || '';
        document.getElementById('blogEndDescription').value   = blog.end_description || '';
        document.getElementById('blogAuthor').value           = blog.author || '';
        document.getElementById('blogImageUrl').value         = blog.output_image || blog.imageUrl || '';

        if (tinymce.get('blogContent')) {
            tinymce.get('blogContent').setContent(blog.full_description || blog.content || '');
        }
    } catch (error) {
        console.error('Error editing blog:', error);
        alert('Error loading blog: ' + error.message);
    }
}

// Delete blog
async function deleteBlog(blogId) {
    if (!confirm('Are you sure you want to delete this blog?')) return;
    try {
        const blog = allBlogsFlat.find(b => String(b.id) === String(blogId));
        if (blog && blog._categoryId && blog._pageKey) {
            var deletePayload = {};
            deletePayload[`${blog._pageKey}.${blogId}`] = firebase.firestore.FieldValue.delete();
            await db.collection('eg1_blog').doc(blog._categoryId).update(deletePayload);
            
            localStorage.removeItem('eg1_blogs_cache_v2');
            localStorage.removeItem('eg1_blogs_cache_v2_time');
            localStorage.removeItem('eg1_blogs_cache');
            localStorage.removeItem('eg1_blogs_cache_time');
            blogsPage = 1;
            loadBlogsList();
            alert('Blog deleted successfully');
        } else {
            alert('Blog metadata missing, cannot delete.');
        }
    } catch (error) {
        console.error('Error deleting blog:', error);
        alert('Error deleting blog: ' + error.message);
    }
}

// Toggle Blog Active Status
async function toggleBlogActive(blogId, isActive) {
    try {
        const blog = allBlogsFlat.find(b => String(b.id) === String(blogId));
        if (blog && blog._categoryId && blog._pageKey) {
            var updatePayload = {};
            // Maintain existing fields but update active
            var updatedBlogData = Object.assign({}, blog);
            delete updatedBlogData.id;
            delete updatedBlogData._categoryId;
            delete updatedBlogData._pageKey;
            updatedBlogData.active = isActive ? '1' : '0';
            
            updatePayload[`${blog._pageKey}.${blogId}`] = updatedBlogData;
            await db.collection('eg1_blog').doc(blog._categoryId).update(updatePayload);
            
            localStorage.removeItem('eg1_blogs_cache_v2');
            localStorage.removeItem('eg1_blogs_cache_v2_time');
            localStorage.removeItem('eg1_blogs_cache');
            localStorage.removeItem('eg1_blogs_cache_time');
            // reload list
            loadBlogsList();
        }
    } catch (error) {
        console.error('Error updating blog visibility:', error);
        alert('Error updating blog visibility: ' + error.message);
        loadBlogsList();
    }
}

// Update blog count on dashboard
function updateBlogsCount() {
    document.getElementById('totalBlogs').textContent = allBlogsFlat.length;
}

console.log('Blogs module loaded');
