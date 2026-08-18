// Analytics Module (Firestore Batched Bucket Pattern)
// ═══════════════════════════════════════════════════════════════════════════════
// Efficient 1-Read Statistics & Batched Page Log Display
// ═══════════════════════════════════════════════════════════════════════════════

let analyticsPage = 1;
let analyticsTotalPages = 1;
let currentBucketLogs = [];

/**
 * Get ISO Date String (YYYY-MM-DD) for comparing today's date.
 * @returns {string}
 */
function getTodayDateString() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
}

/**
 * Update all visitor stats cards (Dashboard and Analytics section) in 1 single Firestore read.
 * @returns {Promise<Object>} The meta data object.
 */
async function updateVisitorStats() {
    try {
        const metaSnap = await db.collection('visitor_analytics').doc('meta').get();
        if (metaSnap.exists) {
            const data = metaSnap.data() || {};
            const todayStr = getTodayDateString();
            const todayCount = (data.todayDate === todayStr) ? (data.todayCount || 0) : 0;
            const totalCount = data.totalVisitors || 0;
            const totalPages = data.currentPage || 1;

            // Update Dashboard cards
            const dashToday = document.getElementById('todayVisitors');
            if (dashToday) dashToday.textContent = todayCount.toLocaleString();

            const dashTotal = document.getElementById('totalVisitors');
            if (dashTotal) dashTotal.textContent = totalCount.toLocaleString();

            // Update Analytics Section cards
            const anaToday = document.getElementById('analyticsTodayVisitors');
            if (anaToday) anaToday.textContent = todayCount.toLocaleString();

            const anaTotal = document.getElementById('analyticsTotalVisitors');
            if (anaTotal) anaTotal.textContent = totalCount.toLocaleString();

            const anaPages = document.getElementById('analyticsTotalPages');
            if (anaPages) anaPages.textContent = totalPages.toLocaleString();

            return data;
        } else {
            // Reset all counters to 0 if meta document doesn't exist yet
            ['todayVisitors', 'totalVisitors', 'analyticsTodayVisitors', 'analyticsTotalVisitors'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.textContent = '0';
            });
            const anaPages = document.getElementById('analyticsTotalPages');
            if (anaPages) anaPages.textContent = '1';
            return {};
        }
    } catch (error) {
        console.error('Error updating visitor stats:', error);
        return {};
    }
}

// Backward-compatibility aliases
async function updateTodayVisitors() { return updateVisitorStats(); }
async function updateTotalVisitors() { return updateVisitorStats(); }

/**
 * Load analytics data from the batched page documents.
 * 1 UI page = 1 Document read (containing up to 50 logs).
 */
async function loadAnalyticsData() {
    const tableBody = document.getElementById('analyticsTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = '<tr><td colspan="7" class="no-data">Loading analytics data...</td></tr>';

    try {
        // Fetch meta document (1 read) to determine page boundaries and update stats cards
        const metaData = await updateVisitorStats();
        const maxPage = metaData.currentPage || 1;
        const totalCount = metaData.totalVisitors || 0;

        if (totalCount === 0 && !metaData.currentPage) {
            tableBody.innerHTML = '<tr><td colspan="7" class="no-data">No visitor analytics data recorded yet.</td></tr>';
            renderAnalyticsPagination(0, 0, 1);
            return;
        }

        analyticsTotalPages = maxPage;
        if (analyticsPage > maxPage) analyticsPage = maxPage;
        if (analyticsPage < 1) analyticsPage = 1;

        // Page 1 in UI corresponds to the latest page bucket in Firestore (e.g. page_5)
        const targetBucketNum = maxPage - analyticsPage + 1;
        const pageDoc = await db.collection('visitor_analytics').doc('page_' + targetBucketNum).get();

        if (!pageDoc.exists) {
            tableBody.innerHTML = '<tr><td colspan="7" class="no-data">No records on bucket page ' + targetBucketNum + '.</td></tr>';
            renderAnalyticsPagination(0, 0, maxPage);
            return;
        }

        const pageData = pageDoc.data() || {};
        const logs = pageData.logs || [];

        if (logs.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" class="no-data">No records found in this bucket.</td></tr>';
            renderAnalyticsPagination(0, 0, maxPage);
            return;
        }

        // Show newest first within the page
        currentBucketLogs = [...logs].reverse();
        renderAnalyticsTable(currentBucketLogs, maxPage);

    } catch (error) {
        console.error('Error loading analytics:', error);
        tableBody.innerHTML = '<tr><td colspan="7" class="no-data">Error loading data: ' + escapeHtml(error.message) + '</td></tr>';
    }
}

/**
 * Filter and render the current bucket logs in the table.
 * @param {Array} logs - Array of visitor log objects.
 * @param {number} maxPage - Total number of bucket pages.
 */
function renderAnalyticsTable(logs, maxPage) {
    const tableBody = document.getElementById('analyticsTableBody');
    if (!tableBody) return;

    // Apply UI filters (App / Search term)
    const appFilter = document.getElementById('analyticsAppFilter');
    const selectedApp = appFilter ? appFilter.value.trim().toLowerCase() : '';

    const searchInput = document.getElementById('analyticsSearchInput');
    const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';

    let filteredLogs = logs;

    if (selectedApp) {
        filteredLogs = filteredLogs.filter(entry => {
            const app = (entry.appName || 'eg1.in').toLowerCase();
            return app.includes(selectedApp);
        });
    }

    if (searchTerm) {
        filteredLogs = filteredLogs.filter(entry => {
            const haystack = [
                entry.ip || '',
                entry.city || '',
                entry.region || '',
                entry.country || '',
                entry.postal || '',
                entry.org || '',
                entry.os || '',
                entry.browser || '',
                entry.pageVisited || '',
                entry.appName || ''
            ].join(' ').toLowerCase();
            return haystack.includes(searchTerm);
        });
    }

    if (filteredLogs.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="no-data">No records match the selected filter.</td></tr>';
        renderAnalyticsPagination(0, 0, maxPage || analyticsTotalPages);
        return;
    }

    let html = '';
    filteredLogs.forEach(entry => {
        const timeFormatted = entry.timestamp
            ? new Date(entry.timestamp).toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            })
            : 'N/A';

        const locParts = [];
        if (entry.city && entry.city !== 'Unknown' && entry.city !== 'N/A') locParts.push(entry.city);
        if (entry.region && entry.region !== 'Unknown' && entry.region !== 'N/A') locParts.push(entry.region);
        if (entry.country && entry.country !== 'Unknown' && entry.country !== 'N/A') locParts.push(entry.country);
        const locationStr = locParts.length > 0 ? locParts.join(', ') : 'Unknown';

        const ispStr = (entry.org && entry.org !== 'Unknown' && entry.org !== 'N/A')
            ? `<div style="font-size: 0.8em; color: #888; margin-top: 2px;">${escapeHtml(entry.org)}</div>`
            : '';

        const isEg1 = (entry.appName && entry.appName.includes('eg1')) || !entry.appName;
        const appBadgeColor = isEg1 ? '#059669' : '#2563eb';
        const appBadgeBg = isEg1 ? 'rgba(5, 150, 105, 0.1)' : 'rgba(37, 99, 235, 0.1)';

        html += '<tr>' +
            '<td><i class="far fa-clock" style="color:#888; margin-right:4px;"></i>' + escapeHtml(timeFormatted) + '</td>' +
            '<td><span style="display:inline-block; padding: 3px 8px; background: ' + appBadgeBg + '; color: ' + appBadgeColor + '; border-radius: 4px; font-weight: 600; font-size: 0.85em;">' + escapeHtml(entry.appName || 'eg1.in') + '</span></td>' +
            '<td><i class="fas fa-map-marker-alt" style="color:#ef4444; margin-right:4px;"></i>' + escapeHtml(locationStr) + '</td>' +
            '<td><strong>' + escapeHtml(entry.ip || 'Unknown') + '</strong>' + ispStr + '</td>' +
            '<td><i class="fas fa-desktop" style="color:#64748b; margin-right:4px;"></i>' + escapeHtml(entry.os || 'Unknown') + '</td>' +
            '<td><i class="fab fa-chrome" style="color:#3b82f6; margin-right:4px;"></i>' + escapeHtml(entry.browser || 'Unknown') + '</td>' +
            '<td><code>' + escapeHtml(entry.pageVisited || '/') + '</code></td>' +
        '</tr>';
    });

    tableBody.innerHTML = html;

    const from = (analyticsPage - 1) * 50 + 1;
    const to = from + filteredLogs.length - 1;
    renderAnalyticsPagination(from, to, maxPage || analyticsTotalPages);
}

/**
 * Render pagination controls for analytics.
 */
function renderAnalyticsPagination(from, to, maxPages) {
    const controls = document.getElementById('analyticsPagination');
    if (!controls) return;

    const prevDisabled = analyticsPage <= 1 ? 'disabled' : '';
    const nextDisabled = analyticsPage >= maxPages ? 'disabled' : '';
    const info = (from && to) ? `Page ${analyticsPage} of ${maxPages} &nbsp;(${to - from + 1} logs shown)` : `Page ${analyticsPage} of ${maxPages}`;

    controls.innerHTML =
        '<span class="pagination-info">' + info + '</span>' +
        '<button class="pg-btn" data-table="analytics" data-dir="prev" ' + prevDisabled + '>\u2039 Newer</button>' +
        '<button class="pg-btn active">' + analyticsPage + '</button>' +
        '<button class="pg-btn" data-table="analytics" data-dir="next" ' + nextDisabled + '>Older \u203a</button>';
}

/**
 * Filter analytics (in-memory if bucket loaded, otherwise loads page 1).
 */
function filterAnalytics() {
    if (currentBucketLogs && currentBucketLogs.length > 0) {
        renderAnalyticsTable(currentBucketLogs, analyticsTotalPages);
    } else {
        analyticsPage = 1;
        loadAnalyticsData();
    }
}

// Global click listener for analytics pagination buttons
document.addEventListener('click', function(e) {
    const btn = e.target.closest('[data-table="analytics"][data-dir]');
    if (!btn || btn.disabled || btn.hasAttribute('disabled')) return;

    const dir = btn.dataset.dir;
    if (dir === 'next') {
        analyticsPage++;
        loadAnalyticsData();
    } else if (dir === 'prev') {
        analyticsPage = Math.max(1, analyticsPage - 1);
        loadAnalyticsData();
    }
});

/**
 * Helper to escape HTML characters.
 */
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Expose functions globally
window.loadAnalyticsData = loadAnalyticsData;
window.filterAnalytics = filterAnalytics;
window.updateVisitorStats = updateVisitorStats;
window.updateTodayVisitors = updateTodayVisitors;
window.updateTotalVisitors = updateTotalVisitors;

console.log('Visitor Analytics module loaded (Bucket pattern with 1-read optimization & live search)');
