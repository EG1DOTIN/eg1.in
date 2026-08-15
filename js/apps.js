var allProducts = [];

async function initializeApps() {
    try {
        waitForFirebase(async function () {
            try {
                console.log('apps.html: Firebase ready callback fired');
                var products = await DataCache.getProducts();

                if (!products || products.length === 0) {
                    $("#productContainer").html(
                        '<div class="alert alert-warning" style="margin:20px;">No results found</div>'
                    );
                    return;
                }

                var activeProducts = products.filter(function (p) {
                    return p.active === "1" || p.active === true || p.active === 1 || !p.hasOwnProperty('active');
                });

                if (activeProducts.length === 0) {
                    $("#productContainer").html(
                        '<div class="alert alert-warning" style="margin:20px;">No active applications found.</div>'
                    );
                    return;
                }

                var urlParams = new URLSearchParams(window.location.search);
                var productId = urlParams.get("id");

                if (productId) {
                    var selectedProduct = activeProducts.find(function (product) {
                        return String(product.id) === String(productId);
                    });

                    if (!selectedProduct) {
                        $("#productContainer").html(
                            '<div class="alert alert-warning" style="margin:20px;">The requested application could not be found.</div>'
                        );
                        return;
                    }

                    var otherApps = activeProducts.filter(function (product) {
                        return String(product.id) !== String(selectedProduct.id);
                    });

                    var detailHtml = [
                        '<div class="row" style="margin-bottom:20px;">',
                        '<div class="col-md-12 left">',
                        '<a href="apps.html" class="btn btn-default">← Back to all apps</a>',
                        '</div>',
                        '</div>',
                        '<div class="row">',
                        '<div class="col-md-2">',
                        '<img src="' + (selectedProduct.icon || selectedProduct.imageUrl || 'img/eg1logo.webp') + '" style="width:100%; max-width:140px;" />',
                        '</div>',
                        '<div class="col-md-10 left">',
                        '<h2 class="color-lightblack">' + (selectedProduct.product_name || selectedProduct.name || 'Unknown Product') + '</h2>',
                        '<p><strong>Version:</strong> ' + (selectedProduct.version || '1.0') + '</p>',
                        '<p>' + (selectedProduct.full_description || selectedProduct.description || 'No description available.') + '</p>',
                        '</div>',
                        '</div>',
                        '<hr />',
                        '<div class="row">',
                        '<div class="col-md-12 left">',
                        '<h3>Other apps</h3>',
                        '</div>',
                        '</div>'
                    ];

                    if (otherApps.length > 0) {
                        otherApps.forEach(function (product) {
                            detailHtml.push(
                                '<div class="row margin-bottom">',
                                '<div class="col-md-12">',
                                '<a href="apps.html?id=' + product.id + '" class="link-name">' + (product.product_name || product.name || 'Unknown Product') + '</a>',
                                '</div>',
                                '</div>'
                            );
                        });
                    }

                    $("#productContainer").html(detailHtml.join(""));
                    return;
                }

                var productHtml = "";
                activeProducts.forEach(function (product) {
                    try {
                        productHtml += RenderHelpers.renderProductCard(product, false);
                    } catch (err) {
                        console.error("Error rendering product card:", err);
                    }
                });
                $("#productContainer").html(productHtml);
            } catch (err) {
                console.error(err);
                $("#productContainer").html(
                    '<div class="alert alert-danger" style="margin:20px;">' + err.message + '</div>'
                );
            }
        });
    } catch (e) {
        console.error(e);
    }
}

$(document).ready(function () {
    console.log('apps.html: DOM ready, initializing apps...');
    initializeApps();
});

function CopyToClipboard(containerid) {
    if (document.selection) {
        var range = document.body.createTextRange();
        range.moveToElementText(
            document.getElementById(containerid),
        );
        range.select().createTextRange();
        document.execCommand("copy");
        $("#clipmsg").html(
            "<span style='margin-left:20px;background-color:#000;color:#fff;padding:3px 10px;margin-top:3px;font-size:12px;border-radius:3px;'>Copied</span>",
        );
    } else if (window.getSelection) {
        var range = document.createRange();
        range.selectNode(document.getElementById(containerid));
        window.getSelection().addRange(range);
        document.execCommand("copy");
        $("#clipmsg").html(
            "<span style='margin-left:20px;background-color:#000;color:#fff;padding:3px 10px;margin-top:3px;font-size:12px;border-radius:3px;'>Copied</span>",
        );
    }
}
