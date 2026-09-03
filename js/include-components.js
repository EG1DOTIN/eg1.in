/**
 * Load and initialize reusable header and footer components
 * This script should be included in the <head> section of each page
 */

// Immediate Theme Pre-loader to prevent FOUC
(function () {
    try {
        var savedTheme = localStorage.getItem('eg1_theme') || 'light-gray';
        document.documentElement.setAttribute('data-theme', savedTheme);
    } catch (e) {
        document.documentElement.setAttribute('data-theme', 'light-gray');
    }
})();

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

    // Dynamic dark crystal gradient theme transition
    slides.className = "row mainContentHeader crystal-theme-" + slideIndex;

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

    // Load header component (includes textual EG1 logo with Great Vibes font, theme toggle & notification bell)
    $.get('components/header.html', function (headerData) {
        $('#header-placeholder').html(headerData);
        decodeLogoByline();
        initializeThemeToggle();
        initializeNotificationBell();

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

        // Fetch about content from DataCache (data/website_content.json, 0 Firestore reads)
        const FOOTER_ABOUT_MAX_LENGTH = 135;
        var footerAboutRetries = 0;

        async function fetchFooterAbout() {
            if (typeof DataCache !== 'undefined' && typeof DataCache.getPageContent === 'function') {
                try {
                    const aboutPage = await DataCache.getPageContent('about');
                    if (aboutPage && (aboutPage.title || aboutPage.content)) {
                        const tempDiv = document.createElement('div');

                        // Helper function to extract text while stripping heading elements (h1-h6) and normalizing whitespace
                        function extractCleanText(htmlContent) {
                            if (!htmlContent) return '';
                            tempDiv.innerHTML = htmlContent;
                            tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(function (h) {
                                h.remove();
                            });
                            return (tempDiv.textContent || tempDiv.innerText || '')
                                .replace(/\s+/g, ' ')
                                .replace(/^ABOUT\s*EG1\s*[:-]?\s*/i, '')
                                .trim();
                        }

                        // Try title first, fallback to content if title had only heading tags
                        let cleanText = extractCleanText(aboutPage.title);
                        if (!cleanText && aboutPage.content) {
                            cleanText = extractCleanText(aboutPage.content);
                        }

                        if (cleanText) {
                            let snippet = cleanText;
                            if (cleanText.length > FOOTER_ABOUT_MAX_LENGTH) {
                                const truncated = cleanText.slice(0, FOOTER_ABOUT_MAX_LENGTH);
                                const lastSpace = truncated.lastIndexOf(' ');
                                snippet = (lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated).trim() + '...';
                            }

                            const aboutTextEl = document.getElementById('footer-about-text');
                            if (aboutTextEl) {
                                aboutTextEl.textContent = snippet;
                            }
                        }
                    }
                } catch (err) {
                    console.warn('Error loading footer about snippet:', err);
                }
            } else if (footerAboutRetries < 20) {
                footerAboutRetries++;
                setTimeout(fetchFooterAbout, 50);
            }
        }
        fetchFooterAbout();
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
    function getViewportWidth() {
        return window.innerWidth || document.documentElement.clientWidth || $(window).width() || (document.body && document.body.clientWidth) || 1200;
    }

    // Mark parent menu items with sub-nav
    $(".nav li").each(function () {
        if ($(this).children(".sub-nav, ul").length > 0) {
            $(this).addClass("has-submenu");
            $(this).children("a").first().addClass("parent");
        }
    });

    // Toggle menu click handler (mobile hamburger)
    $(".toggleMenu").off('click').on('click', function (e) {
        e.preventDefault();
        $(this).toggleClass("active");
        $(".nav").toggleClass("mobile-open").slideToggle(200);
    });

    // Parent item click toggle handler (works on both desktop and mobile)
    $(document).off('click.submenuToggle', '.nav li.has-submenu > a').on('click.submenuToggle', '.nav li.has-submenu > a', function (e) {
        e.preventDefault();
        e.stopPropagation();
        this.blur();
        var $parentLi = $(this).parent("li");
        var isOpen = $parentLi.hasClass("open") || $parentLi.hasClass("hover");

        if (isOpen) {
            $parentLi.removeClass("open hover");
            $(this).attr("aria-expanded", "false");
        } else {
            $(".nav li.has-submenu").removeClass("open hover").find("> a").attr("aria-expanded", "false");
            $parentLi.addClass("open hover");
            $(this).attr("aria-expanded", "true");
        }
    });

    // Close open submenus when clicking anywhere outside
    $(document).off('click.closeSubmenu').on('click.closeSubmenu', function (e) {
        if (!$(e.target).closest(".nav li.has-submenu").length) {
            $(".nav li.has-submenu").removeClass("open hover").find("> a").attr("aria-expanded", "false");
        }
    });

    // Initial menu adjustment
    adjustMenu();

    // Handle window resize and orientation change
    $(window).off('resize.menu orientationchange.menu').on('resize.menu orientationchange.menu', function () {
        adjustMenu();
    });

    // Function to adjust menu based on screen width
    function adjustMenu() {
        var ww = getViewportWidth();
        $(".menu").show();

        if (ww < 920) {
            $(".toggleMenu").show();
            if (!$(".toggleMenu").hasClass("active")) {
                $(".nav").removeClass("mobile-open").hide();
            } else {
                $(".nav").addClass("mobile-open").show();
            }
            $(".nav li").off('mouseenter mouseleave');
        } else {
            $(".toggleMenu").removeClass("active").hide();
            $(".nav").removeClass("mobile-open").removeAttr("style").show();
            $(".nav li.has-submenu").off('mouseenter mouseleave').on('mouseenter', function () {
                $(this).addClass("hover");
            }).on('mouseleave', function () {
                if (!$(this).hasClass("open")) {
                    $(this).removeClass("hover");
                }
            });
        }
    }
}

/**
 * Sets the active state on the navigation menu based on the current URL.
 */
function initializeNavigation() {
    // Add active class on sublink click
    $(".nav li:not(.has-submenu) > a, .sub-nav li a").click(function () {
        $(this).parents("li").addClass("active");
        $(this).parents("li").siblings().removeClass("active");
    });

    // Set active link based on current URL
    var currentPath = window.location.pathname.split('/').pop() || 'index.html';
    $(".nav a").each(function () {
        var href = this.getAttribute('href') || '';
        if (href === '#' || href.startsWith('javascript:')) return;
        var linkPath = href.split('/').pop();
        if (linkPath && (linkPath === currentPath || (currentPath === '' && linkPath === 'index.html'))) {
            $(this).parents("li").addClass("active");
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

/**
 * Initializes and binds the header theme toggle switch.
 */
function initializeThemeToggle() {
    var currentTheme = document.documentElement.getAttribute('data-theme') || 'light-gray';
    updateThemeUI(currentTheme);

    $(document).off('click', '#themeToggleBtn').on('click', '#themeToggleBtn', function (e) {
        e.preventDefault();
        var cur = document.documentElement.getAttribute('data-theme') || 'light-gray';
        var next = cur === 'dark-gray' ? 'light-gray' : 'dark-gray';
        setTheme(next);
    });
}

/**
 * Updates the theme attribute, persists preference, and syncs UI.
 * @param {string} themeName - 'light-gray' or 'dark-gray'
 */
function setTheme(themeName) {
    document.documentElement.setAttribute('data-theme', themeName);
    try {
        localStorage.setItem('eg1_theme', themeName);
    } catch (e) {
        console.warn('Could not persist theme to localStorage:', e);
    }
    updateThemeUI(themeName);
}

/**
 * Updates header toggle button state, aria tags, and logo styling.
 * @param {string} themeName - 'light-gray' or 'dark-gray'
 */
function updateThemeUI(themeName) {
    var btn = $('#themeToggleBtn');
    if (!btn.length) return;

    var isDark = themeName === 'dark-gray';
    if (isDark) {
        btn.addClass('is-dark').removeClass('is-light');
        btn.attr('aria-checked', 'true');
        btn.attr('title', 'Switch to Light Gray theme');
        $('#theme-toggle-text').text('Dark Gray');
        $('#header-logo-badge').removeClass('theme-light').addClass('theme-dark');
    } else {
        btn.addClass('is-light').removeClass('is-dark');
        btn.attr('aria-checked', 'false');
        btn.attr('title', 'Switch to Dark Gray theme');
        $('#theme-toggle-text').text('Light Gray');
        $('#header-logo-badge').removeClass('theme-dark').addClass('theme-light');
    }
}

/**
 * Initializes the header notification bell, fetching updates from data/updates.json
 * and managing the updates dropdown popover panel with unread badge tracking.
 */
function initializeNotificationBell() {
    var $bellBtn = $('#notificationBellBtn');
    var $panel = $('#updatesDropdownPanel');
    var $badge = $('#notificationBadge');
    var $list = $('#updatesListContainer');

    if (!$bellBtn.length) return;

    var updatesData = [];

    // Load updates from data/updates.json
    $.getJSON('data/updates.json', function (data) {
        if (!Array.isArray(data) || data.length === 0) {
            $badge.hide();
            return;
        }

        updatesData = data;
        renderUpdates(updatesData);
        updateUnreadBadge(updatesData);
    }).fail(function (err) {
        console.warn('Could not load data/updates.json:', err);
        $list.html('<div class="updates-empty">No updates available at this moment.</div>');
    });

    function getSeenUpdates() {
        try {
            var seen = localStorage.getItem('eg1_seen_updates');
            return seen ? JSON.parse(seen) : [];
        } catch (e) {
            return [];
        }
    }

    function markAllAsSeen(updates) {
        try {
            var ids = updates.map(function (u) { return u.id; });
            localStorage.setItem('eg1_seen_updates', JSON.stringify(ids));
        } catch (e) {
            console.warn('Error saving seen updates:', e);
        }
    }

    function markSingleAsSeen(updateId) {
        if (!updateId) return;
        try {
            var seen = getSeenUpdates();
            if (seen.indexOf(updateId) === -1) {
                seen.push(updateId);
                localStorage.setItem('eg1_seen_updates', JSON.stringify(seen));
            }
        } catch (e) {
            console.warn('Error saving seen update:', e);
        }
    }

    function updateUnreadBadge(updates) {
        var data = updates || updatesData;
        var seenIds = getSeenUpdates();
        var unreadCount = data.filter(function (u) {
            return seenIds.indexOf(u.id) === -1;
        }).length;

        if (unreadCount > 0) {
            $badge.text(unreadCount > 9 ? '9+' : unreadCount).show();
            $bellBtn.addClass('has-unread');
        } else {
            $badge.hide();
            $bellBtn.removeClass('has-unread');
        }
    }

    window.markUpdateAsSeen = markSingleAsSeen;
    window.refreshNotificationBadge = function () {
        updateUnreadBadge(updatesData);
    };

    /**
     * Shared SVG icon resolver for update categories
     * Available globally on window.getUpdateIconSvg
     */
    function getUpdateIconSvg(iconType, category, size) {
        var iconSize = size || 16;
        var type = (iconType || category || '').toLowerCase();
        if (type.indexOf('bug') !== -1 || type.indexOf('fix') !== -1 || type === 'refresh') {
            return '<svg viewBox="0 0 24 24" width="' + iconSize + '" height="' + iconSize + '" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg>';
        } else if (type.indexOf('opt') !== -1 || type.indexOf('data') !== -1 || type === 'database') {
            return '<svg viewBox="0 0 24 24" width="' + iconSize + '" height="' + iconSize + '" fill="currentColor"><path d="M12 3c-4.42 0-8 1.34-8 3v12c0 1.66 3.58 3 8 3s8-1.34 8-3V6c0-1.66-3.58-3-8-3zm0 2c3.87 0 6 1.05 6 1s-2.13 1-6 1-6-1.05-6-1 2.13-1 6-1zm0 5c3.87 0 6 1.05 6 1s-2.13 1-6 1-6-1.05-6-1 2.13-1 6-1zm0 5c3.87 0 6 1.05 6 1s-2.13 1-6 1-6-1.05-6-1 2.13-1 6-1zm0 5c-3.87 0-6-1.05-6-1s2.13-1 6-1 6 1.05 6 1-2.13 1-6 1z"/></svg>';
        } else {
            return '<svg viewBox="0 0 24 24" width="' + iconSize + '" height="' + iconSize + '" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
        }
    }
    window.getUpdateIconSvg = getUpdateIconSvg;

    /**
     * Shared category CSS class resolver
     * Available globally on window.getCategoryClass
     */
    function getCategoryClass(category) {
        var cat = (category || '').toLowerCase();
        if (cat.indexOf('bug') !== -1 || cat.indexOf('fix') !== -1) return 'cat-bugfixes';
        if (cat.indexOf('opt') !== -1 || cat.indexOf('data') !== -1) return 'cat-optimization';
        if (cat.indexOf('feat') !== -1 || cat.indexOf('new') !== -1) return 'cat-feature';
        if (cat.indexOf('app') !== -1) return 'cat-app';
        return 'cat-release';
    }
    window.getCategoryClass = getCategoryClass;

    function renderUpdates(updates) {
        var seenIds = getSeenUpdates();
        var html = '';

        updates.forEach(function (update) {
            var isUnread = seenIds.indexOf(update.id) === -1;
            var categoryText = (update.category || update.badge || 'UPDATE').toUpperCase();
            var catClass = getCategoryClass(update.category || update.badge);
            var iconSvg = getUpdateIconSvg(update.icon, update.category);
            var linkUrl = update.link || '#';
            var targetAttr = linkUrl.startsWith('http') ? ' target="_blank" rel="noopener noreferrer"' : '';
            var versionHtml = update.version ? '<span class="update-ver-pill">v' + $('<div>').text(update.version.replace(/^v/, '')).html() + '</span>' : '';
            var unreadDotHtml = isUnread ? '<span class="update-unread-dot" title="Unread"></span>' : '';

            html += '<a href="' + linkUrl + '" class="update-card-item' + (isUnread ? ' is-unread' : '') + '"' + targetAttr + ' data-id="' + $('<div>').text(update.id).html() + '">';
            html += '  <div class="update-icon-box ' + catClass + '">' + iconSvg + '</div>';
            html += '  <div class="update-card-content">';
            html += '    <div class="update-card-topbar">';
            html += '      <span class="update-cat-pill ' + catClass + '">' + $('<div>').text(categoryText).html() + '</span>';
            html += '      ' + versionHtml;
            html += '      <span class="update-date-text">' + $('<div>').text(update.date || '').html() + '</span>';
            html += '      ' + unreadDotHtml;
            html += '    </div>';
            html += '    <h4 class="update-card-title">' + $('<div>').text(update.title).html() + '</h4>';
            html += '    <p class="update-card-desc">' + $('<div>').text(update.description || '').html() + '</p>';
            html += '  </div>';
            html += '</a>';
        });

        $list.html(html);
    }

    // Toggle dropdown on bell click
    $(document).off('click', '#notificationBellBtn').on('click', '#notificationBellBtn', function (e) {
        e.preventDefault();
        e.stopPropagation();

        var isVisible = $panel.is(':visible');
        if (isVisible) {
            $panel.fadeOut(150);
            $bellBtn.attr('aria-expanded', 'false');
        } else {
            $panel.fadeIn(150);
            $bellBtn.attr('aria-expanded', 'true');
        }
    });

    // Individual update card item click handler (marks item as seen in localStorage and updates UI)
    $(document).off('click', '.update-card-item').on('click', '.update-card-item', function (e) {
        var $item = $(this);
        var updateId = $item.attr('data-id') || $item.data('id');
        var href = $item.attr('href');

        if (updateId) {
            markSingleAsSeen(updateId);
            $item.removeClass('is-unread');
            $item.find('.update-unread-dot').fadeOut(150, function () {
                $(this).remove();
            });
            updateUnreadBadge(updatesData);
        }

        // If link is a placeholder '#', prevent page jump
        if (!href || href === '#' || href.indexOf('javascript:') === 0) {
            e.preventDefault();
        }
    });

    // Mark all read button handler
    $(document).off('click', '#markAllReadBtn').on('click', '#markAllReadBtn', function (e) {
        e.preventDefault();
        e.stopPropagation();
        markAllAsSeen(updatesData);
        $badge.fadeOut(200);
        $bellBtn.removeClass('has-unread');
        $('.update-card-item').removeClass('is-unread');
        $('.update-unread-dot').fadeOut(200, function () {
            $(this).remove();
        });
    });

    // Close when clicking outside panel
    $(document).off('click.updatesPanel').on('click.updatesPanel', function (e) {
        if (!$(e.target).closest('#notificationBellContainer').length) {
            if ($panel.is(':visible')) {
                $panel.fadeOut(150);
                $bellBtn.attr('aria-expanded', 'false');
            }
        }
    });
}

// Global handler for reopening cookie/telemetry consent from privacy policy
$(document).on('click', '#btnReopenConsent', function (e) {
    e.preventDefault();
    if (window.EG1Tracker && typeof window.EG1Tracker.showConsentBanner === 'function') {
        window.EG1Tracker.showConsentBanner();
    }
});



