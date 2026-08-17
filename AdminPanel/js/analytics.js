// Analytics Module (Firestore Batched Bucket Pattern)

let analyticsPage = 1;
let analyticsTotalPages = 1;

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
 * Load analytics data from the batched page documents.
 * 1 UI page = 1 Document read (containing up to 25–50 logs).
 */
async function loadAnalyticsData() {
    const tableBody = document.getElementById('analyticsTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = '<tr><td colspan="7" class="no-data">Loading analytics data...</td></tr>';

    try {
        const metaSnap = await db.collection('visitor_analytics').doc('meta').get();

        if (!metaSnap.exists) {
            tableBody.innerHTML = '<tr><td colspan="7" class="no-data">No visitor analytics data found yet.</td></tr>';
            renderAnalyticsPagination(0, 0, 1);
            return;
        }

        const metaData = metaSnap.data() || {};
        const maxPage = metaData.currentPage || 1;
        const totalCount = metaData.totalVisitors || 0;

        if (totalCount === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" class="no-data">No visitor analytics data recorded yet.</td></tr>';
            renderAnalyticsPagination(0, 0, 1);
            return;
        }

        analyticsTotalPages = maxPage;
        if (analyticsPage > maxPage) analyticsPage = maxPage;
        if (analyticsPage < 1) analyticsPage = 1;

        // Page 1 in UI corresponds to the latest page bucket in Firestore
        const targetBucketNum = maxPage - analyticsPage + 1;
        const pageDoc = await db.collection('visitor_analytics').doc('page_' + targetBucketNum).get();

        if (!pageDoc.exists) {
            tableBody.innerHTML = '<tr><td colspan="7" class="no-data">No records on this page.</td></tr>';
            renderAnalyticsPagination(0, 0, maxPage);
            return;
        }

        const pageData = pageDoc.data() || {};
        const logs = pageData.logs || [];

        if (logs.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" class="no-data">No records found.</td></tr>';
            renderAnalyticsPagination(0, 0, maxPage);
            return;
        }

        // Show newest first within the page
        const reversedLogs = [...logs].reverse();

        let html = '';
        reversedLogs.forEach(entry => {
            const timeFormatted = entry.timestamp
                ? new Date(entry.timestamp).toLocaleString()
                : 'N/A';

            const locParts = [];
            if (entry.city && entry.city !== 'Unknown' && entry.city !== 'N/A') locParts.push(entry.city);
            if (entry.country && entry.country !== 'Unknown' && entry.country !== 'N/A') locParts.push(entry.country);
            const locationStr = locParts.length > 0 ? locParts.join(', ') : 'Unknown';

            const ispStr = (entry.org && entry.org !== 'Unknown' && entry.org !== 'N/A')
                ? `<div style="font-size: 0.8em; color: #888; margin-top: 2px;">${escapeHtml(entry.org)}</div>`
                : '';

            html += '<tr>' +
                '<td>' + escapeHtml(timeFormatted) + '</td>' +
                '<td><span style="display:inline-block; padding: 2px 6px; background: rgba(59,130,246,0.1); color: #2563eb; border-radius: 4px; font-weight: 500; font-size: 0.85em;">' + escapeHtml(entry.appName || 'eg1.in') + '</span></td>' +
                '<td>' + escapeHtml(locationStr) + '</td>' +
                '<td>' + escapeHtml(entry.ip || 'Unknown') + ispStr + '</td>' +
                '<td>' + escapeHtml(entry.os || 'Unknown') + '</td>' +
                '<td>' + escapeHtml(entry.browser || 'Unknown') + '</td>' +
                '<td><code>' + escapeHtml(entry.pageVisited || '/') + '</code></td>' +
            '</tr>';
        });

        tableBody.innerHTML = html;

        const from = (analyticsPage - 1) * 25 + 1;
        const to = from + logs.length - 1;
        renderAnalyticsPagination(from, to, maxPage);

    } catch (error) {
        console.error('Error loading analytics:', error);
        tableBody.innerHTML = '<tr><td colspan="7" class="no-data">Error loading data: ' + escapeHtml(error.message) + '</td></tr>';
    }
}

/**
 * Render pagination controls for analytics.
 */
function renderAnalyticsPagination(from, to, maxPages) {
    const controls = document.getElementById('analyticsPagination');
    if (!controls) return;

    const prevDisabled = analyticsPage <= 1 ? 'disabled' : '';
    const nextDisabled = analyticsPage >= maxPages ? 'disabled' : '';
    const info = (from && to) ? `Page ${analyticsPage} of ${maxPages} &nbsp;(${to - from + 1} logs shown)` : `Page ${analyticsPage}`;

    controls.innerHTML =
        '<span class="pagination-info">' + info + '</span>' +
        '<button class="pg-btn" data-table="analytics" data-dir="prev" ' + prevDisabled + '>\u2039 Newer</button>' +
        '<button class="pg-btn active">' + analyticsPage + '</button>' +
        '<button class="pg-btn" data-table="analytics" data-dir="next" ' + nextDisabled + '>Older \u203a</button>';
}

/**
 * Filter analytics (reloads page 1).
 */
function filterAnalytics() {
    analyticsPage = 1;
    loadAnalyticsData();
}

/**
 * Update today's visitors count on dashboard using 1 single read on meta document.
 */
async function updateTodayVisitors() {
    try {
        const metaSnap = await db.collection('visitor_analytics').doc('meta').get();
        if (metaSnap.exists) {
            const data = metaSnap.data() || {};
            const todayStr = getTodayDateString();
            const count = (data.todayDate === todayStr) ? (data.todayCount || 0) : 0;
            const el = document.getElementById('todayVisitors');
            if (el) el.textContent = count;
        } else {
            const el = document.getElementById('todayVisitors');
            if (el) el.textContent = 0;
        }
    } catch (error) {
        console.error('Error updating today visitors:', error);
    }
}

/**
 * Update total visitors count on dashboard using 1 single read on meta document.
 */
async function updateTotalVisitors() {
    try {
        const metaSnap = await db.collection('visitor_analytics').doc('meta').get();
        if (metaSnap.exists) {
            const data = metaSnap.data() || {};
            const el = document.getElementById('totalVisitors');
            if (el) el.textContent = data.totalVisitors || 0;
        } else {
            const el = document.getElementById('totalVisitors');
            if (el) el.textContent = 0;
        }
    } catch (error) {
        console.error('Error updating total visitors:', error);
    }
}

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

console.log('Visitor Analytics module loaded (Bucket pattern)');
