// Products Management Module

let editingProductId = null;

// ── Server-side pagination state ──────────────────────────────────────────────
const PRODUCTS_PAGE_SIZE = 15;
let productsCursors  = [null];
let productsPage     = 1;
let productsHasMore  = false;
// ─────────────────────────────────────────────────────────────────────────────

// Show product form
function showProductForm() {
    document.getElementById('productForm').style.display = 'block';
    document.getElementById('productsList').style.display = 'none';
    resetProductForm();
}

// Hide product form
function hideProductForm() {
    document.getElementById('productForm').style.display = 'none';
    document.getElementById('productsList').style.display = 'block';
    resetProductForm();
}

// Reset product form
function resetProductForm() {
    document.getElementById('productFormElement').reset();
    editingProductId = null;
    document.querySelector('#productFormElement button[type="submit"]').textContent = 'Save Product';
    document.getElementById('webappLinkGroup').style.display = 'none';
}

// Save product
document.getElementById('productFormElement').addEventListener('submit', async (e) => {
    e.preventDefault();

    const messageElement = document.getElementById('productFormMessage');
    messageElement.classList.remove('show', 'success', 'error');

    try {
        const name             = document.getElementById('productName').value;
        const version          = document.getElementById('productVersion').value;
        const category         = document.getElementById('productCategory').value;
        const productType      = document.getElementById('productType').value;
        const webappLink       = document.getElementById('webappLink').value;
        const shortDescription = document.getElementById('productShortDescription').value;
        const fullDescription  = tinymce.get('productFullDescription')
            ? tinymce.get('productFullDescription').getContent() : '';
        const paidVersion  = document.getElementById('productPaidVersion').checked  ? 'true' : 'false';
        const showDownload = document.getElementById('productShowDownload').checked ? 'true' : 'false';
        const downloaded   = document.getElementById('productDownloaded').value || '0';

        let iconUrl    = document.getElementById('productImageUrl').value;
        let attachUrl1 = document.getElementById('productAttachUrl1').value;
        let attachUrl2 = document.getElementById('productAttachUrl2').value;

        const storageRef = firebase.storage().ref();

        const imageFile = document.getElementById('productImage').files[0];
        if (imageFile) {
            const fileName = 'products/' + Date.now() + '_' + imageFile.name;
            const imageRef = storageRef.child(fileName);
            await imageRef.put(imageFile);
            iconUrl = await imageRef.getDownloadURL();
        }

        const attach1File = document.getElementById('productAttachFile1').files[0];
        if (attach1File) {
            const fileName = 'downloads/' + Date.now() + '_' + attach1File.name;
            const fileRef  = storageRef.child(fileName);
            await fileRef.put(attach1File);
            attachUrl1 = await fileRef.getDownloadURL();
        }

        const attach2File = document.getElementById('productAttachFile2').files[0];
        if (attach2File) {
            const fileName = 'downloads/' + Date.now() + '_' + attach2File.name;
            const fileRef  = storageRef.child(fileName);
            await fileRef.put(attach2File);
            attachUrl2 = await fileRef.getDownloadURL();
        }

        const productData = {
            product_name:         name,
            version:              version,
            categories:           category,
            product_type:         productType,
            webapp_link:          webappLink,
            short_description:    shortDescription,
            full_description:     fullDescription,
            paid_version:         paidVersion,
            show_download:        showDownload,
            downloaded:           downloaded,
            icon:                 iconUrl,
            attach_upload_file_1: attachUrl1,
            attach_upload_file_2: attachUrl2,
            updatedAt:            new Date()
        };

        if (editingProductId) {
            await db.collection('products').doc(editingProductId).update(productData);
            messageElement.textContent = 'Product updated successfully!';
        } else {
            productData.createdAt = new Date();
            productData.active    = '1';
            await db.collection('products').add(productData);
            messageElement.textContent = 'Product created successfully!';
        }

        localStorage.removeItem('eg1_products_cache');
        localStorage.removeItem('eg1_products_cache_time');
        messageElement.classList.add('show', 'success');

        setTimeout(() => {
            hideProductForm();
            productsCursors = [null]; productsPage = 1; productsHasMore = false;
            loadProductsList();
        }, 1500);

    } catch (error) {
        console.error('Error saving product:', error);
        messageElement.textContent = 'Error: ' + error.message;
        messageElement.classList.add('show', 'error');
    }
});

// Load products list – server-side paginated
async function loadProductsList() {
    const tableBody = document.getElementById('productsTableBody');
    tableBody.innerHTML = '<tr><td colspan="4"><span class="loading"></span> Loading...</td></tr>';

    try {
        let query = db.collection('products')
            .orderBy('createdAt', 'desc')
            .limit(PRODUCTS_PAGE_SIZE + 1);

        const cursorDoc = productsCursors[productsPage - 1];
        if (cursorDoc) {
            query = query.startAfter(cursorDoc);
        }

        const snapshot = await query.get();

        if (snapshot.empty) {
            tableBody.innerHTML = '<tr><td colspan="4" class="no-data">No results found</td></tr>';
            productsHasMore = false;
            renderProductsPagination();
            return;
        }

        const docs = snapshot.docs;
        productsHasMore = docs.length > PRODUCTS_PAGE_SIZE;
        const pageDocs  = productsHasMore ? docs.slice(0, PRODUCTS_PAGE_SIZE) : docs;

        if (productsHasMore) {
            productsCursors[productsPage] = pageDocs[pageDocs.length - 1];
        }

        const from = (productsPage - 1) * PRODUCTS_PAGE_SIZE + 1;
        const to   = from + pageDocs.length - 1;

        let html = '';
        pageDocs.forEach(doc => {
            const data        = doc.data();
            const createdDate = data.createdAt
                ? new Date(data.createdAt.toDate()).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                : 'N/A';
            const isActive = data.active !== false && data.active !== '0' && data.active !== 0;

            html += '<tr>' +
                '<td>' + (data.product_name || data.name || 'Untitled') + '</td>' +
                '<td>' + (data.categories || data.category || 'N/A') + '</td>' +
                '<td>' + createdDate + '</td>' +
                '<td class="action-buttons" style="align-items:center;">' +
                    '<button class="btn-edit"   data-id="' + doc.id + '" data-action="edit-product">Edit</button>' +
                    '<button class="btn-delete" data-id="' + doc.id + '" data-action="delete-product">Delete</button>' +
                    '<label class="switch" title="Toggle Visibility">' +
                        '<input type="checkbox" data-id="' + doc.id + '" data-action="toggle-product"' +
                            (isActive ? ' checked' : '') + '>' +
                        '<span class="slider round"></span>' +
                    '</label>' +
                '</td>' +
            '</tr>';
        });

        tableBody.innerHTML = html;
        renderProductsPagination(from, to);

        if (productsPage === 1) updateProductsCount();

    } catch (error) {
        console.error('Error loading products:', error);
        tableBody.innerHTML = '<tr><td colspan="4" class="no-data">Error loading products: ' + error.message + '</td></tr>';
    }
}

// Render pagination controls for products
function renderProductsPagination(from, to) {
    const controls = document.getElementById('productsPagination');
    if (!controls) return;

    const prevDisabled = productsPage === 1 ? 'disabled' : '';
    const nextDisabled = !productsHasMore   ? 'disabled' : '';
    const info         = (from && to) ? 'Page ' + productsPage + ' &nbsp;(' + from + '&ndash;' + to + ' shown)' : 'Page ' + productsPage;

    controls.innerHTML =
        '<span class="pagination-info">' + info + '</span>' +
        '<button class="pg-btn" data-table="products" data-dir="prev" ' + prevDisabled + '>\u2039 Prev</button>' +
        '<button class="pg-btn active">' + productsPage + '</button>' +
        '<button class="pg-btn" data-table="products" data-dir="next" ' + nextDisabled + '>Next \u203a</button>';
}

// Edit product
async function editProduct(productId) {
    try {
        const doc = await db.collection('products').doc(productId).get();
        if (!doc.exists) { alert('Product not found'); return; }
        showProductForm();

        editingProductId = productId;
        document.querySelector('#productFormElement button[type="submit"]').textContent = 'Update Product';

        const data = doc.data();
        document.getElementById('productName').value          = data.product_name || data.name || '';
        document.getElementById('productVersion').value       = data.version || '';
        document.getElementById('productCategory').value      = data.categories || data.category || '';

        const typeSelect = document.getElementById('productType');
        typeSelect.value = data.product_type || 'Desktop App';
        document.getElementById('webappLinkGroup').style.display = typeSelect.value === 'WebApp' ? 'block' : 'none';
        document.getElementById('webappLink').value = data.webapp_link || '';

        document.getElementById('productShortDescription').value = data.short_description || data.description || '';
        if (tinymce.get('productFullDescription')) {
            tinymce.get('productFullDescription').setContent(data.full_description || '');
        }
        document.getElementById('productPaidVersion').checked  = (data.paid_version === 'true');
        document.getElementById('productShowDownload').checked = (data.show_download === 'true') || (data.show_download === undefined);
        document.getElementById('productDownloaded').value     = data.downloaded || '0';
        document.getElementById('productImageUrl').value       = data.icon || data.imageUrl || '';
        document.getElementById('productAttachUrl1').value     = data.attach_upload_file_1 || '';
        document.getElementById('productAttachUrl2').value     = data.attach_upload_file_2 || '';
    } catch (error) {
        console.error('Error editing product:', error);
        alert('Error loading product: ' + error.message);
    }
}

// Delete product
async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
        await db.collection('products').doc(productId).delete();
        localStorage.removeItem('eg1_products_cache');
        localStorage.removeItem('eg1_products_cache_time');
        productsCursors = [null]; productsPage = 1; productsHasMore = false;
        loadProductsList();
        alert('Product deleted successfully');
    } catch (error) {
        console.error('Error deleting product:', error);
        alert('Error deleting product: ' + error.message);
    }
}

// Toggle Product Active Status
async function toggleProductActive(productId, isActive) {
    try {
        await db.collection('products').doc(productId).update({ active: isActive ? '1' : '0' });
        localStorage.removeItem('eg1_products_cache');
        localStorage.removeItem('eg1_products_cache_time');
    } catch (error) {
        console.error('Error updating product visibility:', error);
        alert('Error updating product visibility: ' + error.message);
        loadProductsList();
    }
}

// Update products count on dashboard
async function updateProductsCount() {
    try {
        const snapshot = await db.collection('products').get();
        document.getElementById('totalProducts').textContent = snapshot.size;
    } catch (error) {
        console.error('Error updating products count:', error);
    }
}

console.log('Products module loaded');
