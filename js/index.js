async function initializeHomePage() {
    try {
        // Load News from static JSON (data/website_content.json, 0 Firestore reads)
        var newsData = await DataCache.getNews();

        if (newsData && newsData.length > 0) {
            if (newsData[0].title) {
                $("#Content3Header h1").text(newsData[0].title);
            }
            var newsHtml = "";

            newsData.forEach(function (news) {
                newsHtml +=
                    '<div class="row">' +
                    '<div class="col-md-12" style="color:white">' +
                    news.description +
                    "</div></div>";
            });

            $("#newsContainer").html(newsHtml);
        } else {
            $("#newsContainer").html(
                '<div style="color:white">No news available</div>',
            );
        }

        // Load Products/Apps from static JSON (data/apps.json, 0 Firestore reads)
        var products = await DataCache.getProducts();

        if (products && products.length > 0) {
            var productHtml = "";

            products.forEach(function (product) {
                productHtml +=
                    RenderHelpers.renderProductCard(
                        product,
                        true,
                    );
            });

            $("#productContainer").html(productHtml);

            // Fetch latest GitHub versions in background if products have GitHub links
            if (typeof DataCache.syncGithubVersions === "function") {
                DataCache.syncGithubVersions(products);
            }

            // Prevent double slick initialization
            if (!$(".regular").hasClass("slick-initialized")) {
                $(".regular").slick({
                    dots: false,
                    infinite: false,
                    slidesToShow: 3,
                    slidesToScroll: 1,
                    responsive: [
                        {
                            breakpoint: 1024,
                            settings: {
                                slidesToShow: 2,
                                slidesToScroll: 1,
                            },
                        },
                        {
                            breakpoint: 600,
                            settings: {
                                slidesToShow: 1,
                                slidesToScroll: 1,
                            },
                        },
                    ],
                });
            }
        } else {
            $("#productContainer").html(
                '<div class="alert alert-warning">No results found</div>',
            );
        }
    } catch (err) {
        console.error("Error initializing home page data:", err);

        $("#productContainer").html(
            '<div class="alert alert-danger">' +
                err.message +
                "</div>",
        );
    }
}

$(document).ready(function () {
    initializeHomePage();
});

