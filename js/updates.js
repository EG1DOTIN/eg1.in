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
         * @param {string} iconType 
         * @param {string} category 
         * @returns {string} SVG markup string
         */
        function getUpdateIconSvg(iconType, category) {
            var type = (iconType || category || '').toLowerCase();
            if (type.indexOf('bug') !== -1 || type.indexOf('fix') !== -1 || type === 'refresh') {
                return '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg>';
            } else if (type.indexOf('opt') !== -1 || type.indexOf('data') !== -1 || type === 'database') {
                return '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 3c-4.42 0-8 1.34-8 3v12c0 1.66 3.58 3 8 3s8-1.34 8-3V6c0-1.66-3.58-3-8-3zm0 2c3.87 0 6 1.05 6 1s-2.13 1-6 1-6-1.05-6-1 2.13-1 6-1zm0 5c3.87 0 6 1.05 6 1s-2.13 1-6 1-6-1.05-6-1 2.13-1 6-1zm0 5c3.87 0 6 1.05 6 1s-2.13 1-6 1-6-1.05-6-1 2.13-1 6-1zm0 5c-3.87 0-6-1.05-6-1s2.13-1 6-1 6 1.05 6 1-2.13 1-6 1z"/></svg>';
            } else if (type.indexOf('app') !== -1 || type.indexOf('mobile') !== -1) {
                return '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>';
            } else {
                return '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
            }
        }

        /**
         * Resolves category CSS class for badges and icon containers
         * @param {string} category 
         * @returns {string} CSS class name
         */
        function getCategoryClass(category) {
            var cat = (category || '').toLowerCase();
            if (cat.indexOf('bug') !== -1 || cat.indexOf('fix') !== -1) return 'cat-bugfixes';
            if (cat.indexOf('opt') !== -1 || cat.indexOf('data') !== -1) return 'cat-optimization';
            if (cat.indexOf('feat') !== -1 || cat.indexOf('new') !== -1) return 'cat-feature';
            if (cat.indexOf('app') !== -1) return 'cat-app';
            return 'cat-release';
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
                var categoryLabel = (update.category || update.badge || 'UPDATE').toUpperCase();
                var versionHtml = update.version ? '<span class="updates-card-version">v' + $('<div>').text(update.version.replace(/^v/, '')).html() + '</span>' : '';
                var typeLabel = update.type ? (update.type === 'website' ? 'Core Website' : 'Application') : '';
                var linkUrl = update.link || '#';
                var isExternal = linkUrl.startsWith('http');
                var targetAttr = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
                var btnText = isExternal ? 'Open Application &nearr;' : 'View Details &rarr;';

                html += '<article class="updates-timeline-card">';
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
                html += '      <a href="' + linkUrl + '" class="updates-card-link-btn"' + targetAttr + '>' + btnText + '</a>';
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

        // Initialize timeline load
        fetchUpdates();
    });
})();
