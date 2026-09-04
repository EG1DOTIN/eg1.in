$(document).ready(async function () {
    try {
        var products = await DataCache.getProducts();

        if (!products || products.length === 0) {
            $('#downloadContainer').html('<div class="alert alert-warning">No results found</div>');
            return;
        }

        // Get product ID from URL
        var urlParams = new URLSearchParams(window.location.search);
        var productId = urlParams.get('id') || '1';

        // Find the product
        var product = products.find(p => p.id == productId);

        if (product) {
            var file1 = product.attach_upload_file_1 || '#';
            var file2 = product.attach_upload_file_2 || '';
            var version = (typeof DataCache !== 'undefined' && typeof DataCache.resolveProductVersion === 'function')
                ? DataCache.resolveProductVersion(product)
                : (product.version || '1.0.0');

            var downloadHtml = '<div class="row">' +
                '<div class="col-md-12 left">' +
                '<h3>' + (product.product_name || product.name || 'Unknown Product') + ' - Downloads</h3>' +
                '<p>Version: <span data-product-version-id="' + product.id + '">' + version + '</span></p>' +
                '<p>Total Downloads: ' + (product.downloaded || product.downloadCount || 0) + '</p>' +
                '<hr />' +
                '<h4>Download Options:</h4>' +
                '<p>' +
                '<a href="' + file1 + '" class="btn btn-success btn-lg" target="_blank"><i class="icon icon-download"></i>&nbsp;Download File 1</a>' +
                (file2 ? '&nbsp;&nbsp;<a href="' + file2 + '" class="btn btn-info btn-lg" target="_blank"><i class="icon icon-download"></i>&nbsp;Download File 2</a>' : '') +
                '</p>' +
                '<p style="margin-top: 20px;">' +
                '<a href="apps.html?id=' + product.id + '" class="btn btn-primary">Back to Product Details</a>' +
                '</p>' +
                '</div>' +
                '</div>';
            $('#downloadContainer').html(downloadHtml);

            if (typeof DataCache !== 'undefined' && typeof DataCache.syncGithubVersions === 'function') {
                DataCache.syncGithubVersions([product]);
            }
        } else {
            $('#downloadContainer').html('<div class="alert alert-warning">Product not found</div>');
        }
    } catch (e) {
        console.error("Error loading products on download page:", e);
        $('#downloadContainer').html('<div class="alert alert-danger">Error loading product data.</div>');
    }
});

