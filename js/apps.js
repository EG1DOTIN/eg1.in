/**
 * @file apps.js
 * @description Controller logic for apps.html (catalog and product detail views).
 */

(function () {
    'use strict';

    var allProducts = [];

    async function initializeApps() {
        try {
            console.log('apps.html: Loading products directly from Markdown (.md)...');
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
            var appTitleParam = urlParams.get("title");
            var productId = urlParams.get("id");

            function getAppSlug(p) {
                if (p.slug) return p.slug;
                var name = (p.product_name || p.name || ('app-' + p.id)).trim().toLowerCase();
                return name.replace(/[^a-z0-9\s-]/g, '').replace(/[\s-]+/g, '-');
            }

            if (appTitleParam || productId) {
                var selectedProduct = activeProducts.find(function (product) {
                    if (appTitleParam) {
                        var slug = getAppSlug(product);
                        var cleanParam = appTitleParam.toLowerCase().trim();
                        var normParam = cleanParam.replace(/_/g, '-');
                        return slug === cleanParam ||
                               slug === normParam ||
                               String(product.name || product.product_name || '').toLowerCase() === cleanParam;
                    }
                    if (productId) {
                        return String(product.id) === String(productId);
                    }
                    return false;
                });

                if (!selectedProduct) {
                    $("#productContainer").html(
                        '<div class="alert alert-warning" style="margin:20px;">The requested application could not be found.</div>'
                    );
                    return;
                }

                // Seamlessly forward legacy query URLs to the canonical static page
                var targetSlug = getAppSlug(selectedProduct);
                if (selectedProduct.product_type === "WebApp" && selectedProduct.webapp_link && selectedProduct.webapp_link !== "#") {
                    window.location.replace(selectedProduct.webapp_link);
                    return;
                } else if (targetSlug) {
                    window.location.replace('apps/' + encodeURIComponent(targetSlug) + '.html');
                    return;
                }

                var defaultAppIcon = window.DEFAULT_APP_ICON || window.DEFAULT_PLACEHOLDER_ICON || "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='16' fill='%231e293b'/><text x='50%' y='63%' font-family='sans-serif' font-weight='bold' font-size='38' fill='%2338bdf8' text-anchor='middle'>EG1</text></svg>";
                var selectedVersion = (typeof DataCache !== 'undefined' && typeof DataCache.resolveProductVersion === 'function')
                    ? DataCache.resolveProductVersion(selectedProduct)
                    : (selectedProduct.version || '1.0.0');

                var productType = selectedProduct.product_type || "Desktop App";
                var webappLink = selectedProduct.webapp_link || "#";
                var defaultDetailLink = (productType === "WebApp" && webappLink) ? webappLink : ('apps.html?title=' + getAppSlug(selectedProduct));
                var defaultDetailSameTab = productType !== "WebApp";
                var btn1 = (typeof RenderHelpers !== 'undefined' && typeof RenderHelpers.parseButton === 'function')
                    ? RenderHelpers.parseButton(
                        selectedProduct.button1,
                        productType === "WebApp" ? "LAUNCH" : "VIEW DETAILS",
                        defaultDetailLink,
                        defaultDetailSameTab,
                        "btn btn-theme-primary"
                    )
                    : null;

                var btn2 = (typeof RenderHelpers !== 'undefined' && typeof RenderHelpers.parseButton === 'function')
                    ? RenderHelpers.parseButton(
                        selectedProduct.button2,
                        "DOWNLOAD",
                        selectedProduct.attach_upload_file_1 || null,
                        true,
                        "btn btn-theme-secondary"
                    )
                    : null;

                // Collect actionable buttons for the detail view
                // Exclude redundant "VIEW DETAILS" button or self-links because the visitor is already viewing the details!
                var visibleBtns = [];
                [btn1, btn2].forEach(function (btn) {
                    if (!btn) return;
                    var labelUpper = (btn.label || '').toUpperCase().trim();
                    var isDetailLabel = labelUpper === 'VIEW DETAILS' || labelUpper === 'DETAILS' || labelUpper === 'VIEW APP';
                    var normBtnUrl = (btn.url || '').toLowerCase().replace(/_/g, '-');
                    var normSlug = getAppSlug(selectedProduct).toLowerCase().replace(/_/g, '-');
                    var isSelfLink = (normBtnUrl.indexOf('apps.html?title=' + normSlug) !== -1) ||
                                     (btn.url.indexOf('apps.html?id=' + selectedProduct.id) !== -1);
                    if (isDetailLabel || isSelfLink) {
                        return; // Omit redundant "View Details" button from detail page
                    }
                    visibleBtns.push(btn);
                });

                var actionsHtml = '';
                if (visibleBtns.length > 0) {
                    actionsHtml = '<div class="app-detail-actions">' +
                        visibleBtns.map(function (b) {
                            return '<a href="' + b.url + '" ' + b.target + ' class="' + b.btnClass + '"><i class="' + b.icon + '"></i>&nbsp;' + b.label + '</a>';
                        }).join('') +
                    '</div>';
                }

                var fullDesc = selectedProduct.full_description || selectedProduct.description || selectedProduct.short_description || 'No description available.';
                var rawIcon = (typeof selectedProduct.icon === 'string') ? selectedProduct.icon.trim() : '';
                var rawImg = (typeof selectedProduct.imageUrl === 'string') ? selectedProduct.imageUrl.trim() : '';
                var resolvedIcon = rawIcon || rawImg || defaultAppIcon;

                var detailHtml = [
                    '<div class="app-detail-card">',
                    '  <div class="app-detail-header">',
                    '    <img src="' + resolvedIcon + '" onerror="this.onerror=null;this.src=window.DEFAULT_APP_ICON||window.DEFAULT_PLACEHOLDER_ICON;" class="app-detail-icon" alt="' + (selectedProduct.product_name || selectedProduct.name || 'Product Icon') + '" />',
                    '    <div class="app-detail-info">',
                    '      <h2 class="app-detail-title">' + (selectedProduct.product_name || selectedProduct.name || 'Unknown Product') + '</h2>',
                    '      <div class="app-detail-version"><strong>Version:</strong> <span data-product-version-id="' + selectedProduct.id + '">' + selectedVersion + '</span></div>',
                    '      <div class="app-detail-description">' + fullDesc + '</div>',
                    '      ' + actionsHtml,
                    '    </div>',
                    '  </div>',
                    '  <div class="app-detail-footer">',
                    '    <a href="apps.html" class="btn btn-back-apps">&larr; Back to all apps</a>',
                    '  </div>',
                    '</div>'
                ];

                $("#productContainer").html(detailHtml.join(""));

                if (typeof DataCache !== 'undefined' && typeof DataCache.syncGithubVersions === 'function') {
                    DataCache.syncGithubVersions([selectedProduct]);
                }
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

            if (typeof DataCache !== 'undefined' && typeof DataCache.syncGithubVersions === 'function') {
                DataCache.syncGithubVersions(activeProducts);
            }
        } catch (err) {
            console.error("Error loading products in apps.js:", err);
            $("#productContainer").html(
                '<div class="alert alert-danger" style="margin:20px;">' + err.message + '</div>'
            );
        }
    }

    $(document).ready(function () {
        console.log('apps.html: DOM ready, initializing apps...');
        initializeApps();
    });

    function CopyToClipboard(containerid) {
        var container = document.getElementById(containerid);
        if (!container) return;

        var text = container.innerText || container.textContent || '';
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(function () {
                $("#clipmsg").html(
                    "<span style='margin-left:20px;background-color:#000;color:#fff;padding:3px 10px;margin-top:3px;font-size:12px;border-radius:3px;'>Copied</span>"
                );
            }).catch(function () {
                fallbackCopy(container);
            });
        } else {
            fallbackCopy(container);
        }

        function fallbackCopy(element) {
            if (window.getSelection) {
                var range = document.createRange();
                range.selectNode(element);
                window.getSelection().removeAllRanges();
                window.getSelection().addRange(range);
                try {
                    document.execCommand("copy");
                    $("#clipmsg").html(
                        "<span style='margin-left:20px;background-color:#000;color:#fff;padding:3px 10px;margin-top:3px;font-size:12px;border-radius:3px;'>Copied</span>"
                    );
                } catch (e) {
                    console.error("Copy failed:", e);
                }
                window.getSelection().removeAllRanges();
            }
        }
    }

    // Expose global methods
    window.initializeApps = initializeApps;
    window.CopyToClipboard = CopyToClipboard;
})();
