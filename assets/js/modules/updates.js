/**
 * @file updates.js
 * @description Logic for loading, rendering, and filtering website & application updates on updates.html.
 */

(function () {
    'use strict';

    $(document).ready(function () {
        var allUpdates = [];
        var currentFilter = 'all';

        /**
         * Returns appropriate SVG icon based on category or icon type
         * Always uses fixed, recommended icons for:
         * ENHANCEMENT, OPTIMIZATION, FEATURE, BUG-FIX, APP, OTHER
         * @param {string} iconType 
         * @param {string} category 
         * @returns {string} SVG markup string
         */
        function getUpdateIconSvg(iconType, category) {
            if (typeof window.getUpdateIconSvg === 'function') {
                return window.getUpdateIconSvg(iconType, category, 24);
            }
            var raw = (category || iconType || '').trim().toLowerCase();
            if (raw.indexOf('enhanc') !== -1) {
                // Sparkles icon
                return '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/></svg>';
            } else if (raw.indexOf('opt') !== -1) {
                // Speedometer / Gauge icon
                return '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/></svg>';
            } else if (raw.indexOf('feat') !== -1) {
                // Feature Star icon
                return '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
            } else if (raw.indexOf('bug') !== -1 || raw.indexOf('fix') !== -1 || raw.indexOf('repair') !== -1) {
                // Tool / Wrench icon (bug fixed / maintenance)
                return '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>';
            } else if (raw.indexOf('app') !== -1) {
                // App grid icon
                return '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="7" x="3" y="3" rx="1.5"/><rect width="7" height="7" x="14" y="3" rx="1.5"/><rect width="7" height="7" x="14" y="14" rx="1.5"/><rect width="7" height="7" x="3" y="14" rx="1.5"/></svg>';
            } else {
                // Info circle icon
                return '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
            }
        }

        /**
         * Resolves category CSS class for badges and icon containers
         * @param {string} category 
         * @returns {string} CSS class name
         */
        function getCategoryClass(category) {
            if (typeof window.getCategoryClass === 'function') {
                return window.getCategoryClass(category);
            }
            var cat = (category || '').trim().toLowerCase();
            if (cat.indexOf('enhanc') !== -1) return 'cat-enhancement';
            if (cat.indexOf('opt') !== -1) return 'cat-optimization';
            if (cat.indexOf('feat') !== -1) return 'cat-feature';
            if (cat.indexOf('bug') !== -1 || cat.indexOf('fix') !== -1 || cat.indexOf('repair') !== -1) return 'cat-bug-fix';
            if (cat.indexOf('app') !== -1) return 'cat-app';
            return 'cat-other';
        }

        /**
         * Renders timeline update cards into #updatesPageListContainer
         * @param {Array} updates 
         * @param {string} filter 
         */
        function renderTimeline(updates, filter) {
            var $container = $('#updatesPageListContainer');
            var filtered = updates;

            if (filter && filter !== 'all') {
                filtered = updates.filter(function (item) {
                    return (item.type || '').toLowerCase() === filter.toLowerCase();
                });
            }

            if (!filtered || filtered.length === 0) {
                $container.html('<div class="updates-empty-box"><p>No updates found matching the selected filter.</p></div>');
                return;
            }

            var html = '';
            filtered.forEach(function (update) {
                var catClass = getCategoryClass(update.category || update.badge);
                var iconSvg = getUpdateIconSvg(update.icon, update.category);
                var categoryLabel = (typeof window.normalizeUpdateCategory === 'function')
                    ? window.normalizeUpdateCategory(update.category || update.badge)
                    : (function(cat) {
                        var raw = (cat || '').trim().toUpperCase();
                        if (raw.indexOf('ENHANC') !== -1) return 'ENHANCEMENT';
                        if (raw.indexOf('OPT') !== -1) return 'OPTIMIZATION';
                        if (raw.indexOf('FEAT') !== -1) return 'FEATURE';
                        if (raw.indexOf('BUG') !== -1 || raw.indexOf('FIX') !== -1) return 'BUG-FIX';
                        if (raw.indexOf('APP') !== -1) return 'APP';
                        return raw || 'OTHER';
                    })(update.category || update.badge);
                var versionHtml = update.version ? '<span class="updates-card-version">v' + $('<div>').text(update.version.replace(/^v/, '')).html() + '</span>' : '';
                var typeLabel = update.type ? (update.type === 'website' ? 'Core Website' : 'Application') : '';
                var linkUrl = update.link || '#';
                var isExternal = linkUrl.startsWith('http');
                var targetAttr = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
                
                // Requirement: if type is "website", label is "Release Notes"; if "app", label is "Open Application"
                var updateType = (update.type || '').trim().toLowerCase();
                var btnText = '';
                if (updateType === 'app') {
                    btnText = isExternal ? 'Open Application &nearr;' : 'Open Application &rarr;';
                } else if (updateType === 'website') {
                    btnText = 'Release Notes &rarr;';
                } else {
                    btnText = isExternal ? 'Open Application &nearr;' : 'Release Notes &rarr;';
                }

                html += '<article class="updates-timeline-card" data-id="' + $('<div>').text(update.id).html() + '">';
                html += '  <div class="updates-timeline-icon ' + catClass + '">' + iconSvg + '</div>';
                html += '  <div class="updates-card-body">';
                html += '    <div class="updates-card-meta">';
                html += '      <span class="updates-card-category ' + catClass + '">' + $('<div>').text(categoryLabel).html() + '</span>';
                html += '      ' + versionHtml;
                if (typeLabel) {
                    html += '      <span class="updates-card-type">' + $('<div>').text(typeLabel).html() + '</span>';
                }
                html += '      <time class="updates-card-date"><i class="fa fa-calendar-o" aria-hidden="true"></i> ' + $('<div>').text(update.date || '').html() + '</time>';
                html += '    </div>';
                html += '    <h3 class="updates-card-title">' + $('<div>').text(update.title).html() + '</h3>';
                html += '    <p class="updates-card-desc">' + $('<div>').text(update.description || '').html() + '</p>';
                html += '    <div class="updates-card-action">';
                html += '      <a href="' + linkUrl + '" class="updates-card-link-btn" data-id="' + $('<div>').text(update.id).html() + '"' + targetAttr + '>' + btnText + '</a>';
                html += '    </div>';
                html += '  </div>';
                html += '</article>';
            });

            $container.html(html);
        }

        /**
         * Updates count badges on filter tab buttons
         * @param {Array} updates 
         */
        function updateTabCounts(updates) {
            var total = updates.length;
            var websiteCount = updates.filter(function (u) { return (u.type || '').toLowerCase() === 'website'; }).length;
            var appCount = updates.filter(function (u) { return (u.type || '').toLowerCase() === 'app'; }).length;

            $('#countAll').text('(' + total + ')');
            $('#countWebsite').text('(' + websiteCount + ')');
            $('#countApps').text('(' + appCount + ')');
        }

        /**
         * Fetches update items from data/updates.json
         */
        function fetchUpdates() {
            $.getJSON('data/updates.json')
                .done(function (data) {
                    var updatesList = Array.isArray(data) ? data : (data && Array.isArray(data.updates) ? data.updates : []);
                    if (updatesList && updatesList.length > 0) {
                        allUpdates = updatesList;
                        updateTabCounts(allUpdates);
                        renderTimeline(allUpdates, currentFilter);
                    } else {
                        $('#updatesPageListContainer').html('<div class="updates-empty-box"><p>No updates currently available.</p></div>');
                    }
                })
                .fail(function (err) {
                    console.error('Failed to load updates.json:', err);
                    $('#updatesPageListContainer').html('<div class="updates-empty-box"><p>Unable to load updates at this time. Please try again later.</p></div>');
                });
        }

        // Attach filter tab click listeners
        $('.updates-filter-btn').on('click', function () {
            $('.updates-filter-btn').removeClass('active');
            $(this).addClass('active');
            currentFilter = $(this).data('filter') || 'all';
            renderTimeline(allUpdates, currentFilter);
        });

        // Mark update as seen when timeline card link is clicked
        $(document).on('click', '.updates-card-link-btn', function () {
            var updateId = $(this).attr('data-id') || $(this).closest('.updates-timeline-card').attr('data-id');
            if (updateId) {
                if (typeof window.markUpdateAsSeen === 'function') {
                    window.markUpdateAsSeen(updateId);
                    if (typeof window.refreshNotificationBadge === 'function') {
                        window.refreshNotificationBadge();
                    }
                } else {
                    try {
                        var seen = localStorage.getItem('eg1_seen_updates');
                        var seenIds = seen ? JSON.parse(seen) : [];
                        if (seenIds.indexOf(updateId) === -1) {
                            seenIds.push(updateId);
                            localStorage.setItem('eg1_seen_updates', JSON.stringify(seenIds));
                        }
                    } catch (e) {
                        console.warn('Error saving seen update:', e);
                    }
                }
            }
        });

        // Initialize timeline load
        fetchUpdates();
    });
})();
