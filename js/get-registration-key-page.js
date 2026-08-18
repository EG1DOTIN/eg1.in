$(document).ready(function () {
    var slideIndex = 0;
    showSlides();

    function showSlides() {
        var slides = document.getElementById("mainContentHeaderslide");
        if (!slides) return;
        var urlString;
        slideIndex++;
        if (slideIndex > 6) { slideIndex = 1 }
        urlString = 'url(img/home' + slideIndex + '.webp)';
        slides.style.backgroundImage = urlString;
        setTimeout(showSlides, 5000);
    }
});

$(document).ready(async function () {
    waitForFirebase(async function () {
        var products = await DataCache.getProducts();

        if (!products || products.length === 0) {
            $('#registrationContainer').html('<div class="alert alert-warning">No results found</div>');
            return;
        }

        // Get product ID from URL
        var urlParams = new URLSearchParams(window.location.search);
        var productId = urlParams.get('id') || '1';

        // Find the product
        var product = products.find(p => p.id == productId);

        if (product) {
            var productName = product.product_name || product.name || 'Unknown Product';
            var registrationHtml = '<div class="row">' +
                '<div class="col-md-12 left">' +
                '<h3>' + productName + ' - Registration Key</h3>' +
                '<p>Version: ' + (product.version || '1.0') + '</p>' +
                '<hr />' +
                '<h4>Request Registration Key</h4>' +
                '<p>To get a registration key for <strong>' + productName + '</strong>, please send us a message via our Contact form.</p>' +
                '<p style="margin-top: 20px;">' +
                '<a href="contact.html" class="btn btn-primary">Send Request via Contact Form</a>' +
                '&nbsp;&nbsp;' +
                '<a href="apps.html?id=' + product.id + '" class="btn btn-default" style="background:#ddd; padding:6px 12px; border-radius:4px; text-decoration:none; color:#333;">Back to Product</a>' +
                '</p>' +
                '</div>' +
                '</div>';
            $('#registrationContainer').html(registrationHtml);
        } else {
            $('#registrationContainer').html('<div class="alert alert-warning">Product not found</div>');
        }
    });
});
