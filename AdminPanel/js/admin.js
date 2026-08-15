// Main Admin Panel Module

// Initialize TinyMCE Editor
function initializeTinyMCE() {
    tinymce.init({
        selector: 'textarea#blogContent,textarea#contentEditor,textarea#productFullDescription',
        plugins: 'image link lists code table codesample',
        toolbar: 'undo redo | styles | formatselect | bold italic underline backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | image link code codesample table',
        height: 400,
        image_upload_handler: handleImageUpload,
        file_picker_types: 'image',
        file_picker_callback: function (callback, value, meta) {
            if (meta.filetype === 'image') {
                const input = document.createElement('input');
                input.setAttribute('type', 'file');
                input.setAttribute('accept', 'image/*');
                input.onchange = async function () {
                    const file = this.files[0];
                    try {
                        const fileName = 'tinymce/' + Date.now() + '_' + file.name;
                        const uploadTask = await firebase.storage().ref(fileName).put(file);
                        const url = await uploadTask.ref.getDownloadURL();
                        callback(url, { title: file.name });
                    } catch (error) {
                        alert('Error uploading image: ' + error.message);
                    }
                };
                input.click();
            }
        }
    });
}

// Handle image upload
async function handleImageUpload(blobInfo, success, failure) {
    try {
        const fileName = 'tinymce/' + Date.now() + '_' + blobInfo.filename();
        const uploadTask = await firebase.storage().ref(fileName).put(blobInfo.blob());
        const url = await uploadTask.ref.getDownloadURL();
        success(url);
    } catch (error) {
        failure('Error uploading image: ' + error.message);
    }
}

// Load dashboard stats
async function loadDashboardStats() {
    try {
        updateTotalVisitors();
        updateTodayVisitors();
        
        if (typeof fetchAllBlogsFlat === 'function') {
            allBlogsFlat = await fetchAllBlogsFlat();
        }
        updateBlogsCount();
        
        if (typeof fetchAllProducts === 'function') {
            await fetchAllProducts();
        }
        updateProductsCount();
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

// Auto-save interval for dashboard stats
setInterval(() => {
    if (document.getElementById('dashboard').classList.contains('active')) {
        loadDashboardStats();
    }
}, 30000); // Refresh every 30 seconds

// Single delegated event handler for pagination + table actions
document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-action], [data-table]');
    if (!btn) return;

    var action = btn.dataset.action;
    var id     = btn.dataset.id;

    // ── Table row actions ────────────────────────────────────────────────
    if (action === 'edit-blog')       { editBlog(id);    return; }
    if (action === 'delete-blog')     { deleteBlog(id);  return; }
    if (action === 'edit-product')    { editProduct(id);    return; }
    if (action === 'delete-product')  { deleteProduct(id);  return; }
    if (action === 'delete-message')  { deleteMessage(id);  return; }

    // ── Pagination Prev / Next / Page Number ───────────────────────────
    var table = btn.dataset.table;
    var dir   = btn.dataset.dir;
    if (!table || btn.disabled || btn.hasAttribute('disabled')) return;

    if (btn.dataset.page) {
        if (table === 'blogs') { blogsGoToPage(Number(btn.dataset.page)); }
        if (table === 'products') { productsPage = Number(btn.dataset.page); loadProductsList(); }
        if (table === 'messages') { messagesPage = Number(btn.dataset.page); loadMessagesList(); }
        if (table === 'analytics') { analyticsPage = Number(btn.dataset.page); loadAnalyticsData(); }
        return;
    }

    if (!dir) return;

    if (table === 'blogs') {
        if (dir === 'next') { blogsPage++;                        loadBlogsList(); }
        if (dir === 'prev') { blogsPage = Math.max(1, blogsPage - 1); loadBlogsList(); }
    }
    if (table === 'products') {
        if (dir === 'next') { productsPage++;                           loadProductsList(); }
        if (dir === 'prev') { productsPage = Math.max(1, productsPage - 1); loadProductsList(); }
    }
    if (table === 'messages') {
        if (dir === 'next') { messagesPage++;                            loadMessagesList(); }
        if (dir === 'prev') { messagesPage = Math.max(1, messagesPage - 1); loadMessagesList(); }
    }
    if (table === 'analytics') {
        if (dir === 'next') { analyticsPage++;                             loadAnalyticsData(); }
        if (dir === 'prev') { analyticsPage = Math.max(1, analyticsPage - 1); loadAnalyticsData(); }
    }
});

// Toggle handlers via delegation (checkboxes)
document.addEventListener('change', function (e) {
    var el = e.target;
    if (!el.dataset.action) return;
    if (el.dataset.action === 'toggle-blog')    { toggleBlogActive(el.dataset.id, el.checked);    return; }
    if (el.dataset.action === 'toggle-product') { toggleProductActive(el.dataset.id, el.checked); return; }
});

console.log('Admin panel module loaded');
