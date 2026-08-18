/**
 * Load and initialize reusable header and footer components
 * This script should be included in the <head> section of each page
 */

// Global slider variables
var slideIndex = 0;
var sliderTimeout;

/**
 * Advances the background slider image.
 * Called recursively via setTimeout.
 */
function showSlides() {
    var slides = document.getElementById("mainContentHeaderslide");
    if (!slides) return;

    slideIndex++;
    if (slideIndex > 6) {
        slideIndex = 1;
    }

    slides.style.backgroundImage = "url(img/home" + slideIndex + ".webp)";

    clearTimeout(sliderTimeout);
    sliderTimeout = setTimeout(showSlides, 5000);
}

/**
 * Loads header, footer, and slider components via AJAX, and initializes UI scripts.
 * The header and footer HTML components include the textual EG1 logo styled with
 * Great Vibes font and ultra-dim micro-byline.
 */
function initializeComponents() {
    // Automatically load visitor analytics tracker asynchronously on all pages
    loadVisitorTracker();

    // Load header component (includes textual EG1 logo with Great Vibes font)
    $.get('components/header.html', function (headerData) {
        $('#header-placeholder').html(headerData);
        decodeLogoByline();

        // Initialize responsive menu and navigation after header is loaded
        setTimeout(function () {
            initializeResponsiveMenu();
            initializeNavigation();
            initializeFixedNav();
        }, 100);
    });

    // Load footer component (includes textual EG1 logo with Great Vibes font)
    $.get('components/footer.html', function (footerData) {
        $('#footer-placeholder').html(footerData);
        decodeLogoByline();

        // Fetch about content from DataCache
        if (typeof waitForFirebase === 'function') {
            waitForFirebase(async () => {
                if (typeof DataCache !== 'undefined') {
                    const aboutPage = await DataCache.getPageContent('about');
                    if (aboutPage && aboutPage.title) {
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = aboutPage.title;
                        const text = tempDiv.textContent || tempDiv.innerText || '';

                        const targetString = 'A personal hobb';
                        const startIndex = text.indexOf(targetString);
                        if (startIndex !== -1) {
                            let snippet = text.substring(startIndex, startIndex + 146);
                            if (snippet.length === 146 && text.length > startIndex + 146) {
                                snippet += '...';
                            }
                            const aboutTextEl = document.getElementById('footer-about-text');
                            if (aboutTextEl) {
                                aboutTextEl.textContent = snippet;
                            }
                        }
                    }
                }
            });
        }
    });

    // Load slider component
    var contentHeader = $('#Content3Header');
    if (contentHeader.length > 0) {
        $.get('components/image_slider.html', function (sliderData) {
            var sliderElement = $(sliderData);
            contentHeader.before(sliderElement);
            sliderElement.find('#scrlbar').append(contentHeader);
            contentHeader.show();
            showSlides();
        });
    } else {
        // Fallback for pages that might still have the old structure
        if ($('#mainContentHeaderslide').length > 0) {
            showSlides();
        }
    }
}

/**
 * Initializes the responsive navigation menu for mobile and desktop views.
 * Binds resize and click events to handle menu visibility.
 */
function initializeResponsiveMenu() {
    var ww = document.body.clientWidth;

    // Mark parent menu items
    $(".nav li a").each(function () {
        if ($(this).next().length > 0) {
            $(this).addClass("parent");
        }
    });

    // Toggle menu click handler
    $(".toggleMenu").click(function (e) {
        e.preventDefault();
        $(this).toggleClass("active");
        $(".nav").toggle();
    });

    // Initial menu adjustment
    adjustMenu();

    // Handle window resize and orientation change
    $(window).bind('resize orientationchange', function () {
        ww = document.body.clientWidth;
        adjustMenu();
    });

    // Function to adjust menu based on screen width
    function adjustMenu() {
        ww = document.body.clientWidth;
        if (ww < 920) {
            $(".toggleMenu").css("display", "inline-block");
            if (!$(".toggleMenu").hasClass("active")) {
                $(".nav").hide();
            } else {
                $(".nav").show();
            }
            $(".nav li").unbind('mouseenter mouseleave');
            $(".nav li a.parent").unbind('click').bind('click', function (e) {
                e.preventDefault();
                $(this).parent("li").toggleClass("hover");
            });
        }
        else if (ww >= 920) {
            $(".toggleMenu").css("display", "none");
            $(".nav").show();
            $(".nav li").removeClass("hover");
            $(".nav li a").unbind('click');
            $(".nav li").unbind('mouseenter mouseleave').bind('mouseenter mouseleave', function () {
                $(this).toggleClass('hover');
            });
        }
    }
}

/**
 * Sets the active state on the navigation menu based on the current URL.
 */
function initializeNavigation() {
    // Add active class on link click
    $(".nav li a").click(function () {
        $(this).parent().addClass("active");
        $(this).parent().siblings().removeClass("active");
    });

    // Set active link based on current URL
    var url = window.location.href;
    $(".nav a").each(function () {
        if (url == this.href) {
            $(this).closest("li").addClass("active");
        }
    });
}

/**
 * Initializes a fixed navigation bar that sticks to the top of the viewport when scrolling.
 */
function initializeFixedNav() {
    var nav = $(".navbar");
    var navPlaceholder = $('<div class="nav-placeholder" style="display: none;"></div>');
    nav.before(navPlaceholder);

    $(window).scroll(function () {
        if ($(this).scrollTop() > 117) {
            nav.addClass("f-nav");
            navPlaceholder.height(nav.outerHeight()).show();
        } else {
            nav.removeClass("f-nav");
            navPlaceholder.hide();
        }
    });
}

// Initialize components when jQuery is ready
$(document).ready(function () {
    initializeComponents();
});

/**
 * Decodes the Base64 encoded logo micro-byline attribute at runtime.
 * Prevents plain text indexing/searching of creator name in raw HTML files.
 */
function decodeLogoByline() {
    $('.eg1-logo-byline[data-info]').each(function () {
        try {
            var encodedStr = $(this).attr('data-info');
            if (encodedStr) {
                $(this).text(atob(encodedStr));
            }
        } catch (e) {
            // Silently ignore decode errors
        }
    });
}

/**
 * Dynamically loads js/visitor-tracker.js asynchronously.
 * Ensures visitor tracking is active on all pages with zero per-page boilerplate.
 */
function loadVisitorTracker() {
    if (!document.querySelector('script[src*="visitor-tracker.js"]')) {
        var script = document.createElement('script');
        script.src = 'js/visitor-tracker.js';
        script.async = true;
        document.head.appendChild(script);
    }
}

