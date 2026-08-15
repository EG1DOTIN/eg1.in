// Analytics Module

// ── Server-side pagination state ──────────────────────────────────────────────
const ANALYTICS_PAGE_SIZE = 15;
let analyticsCursors  = [null];
let analyticsPage     = 1;
let analyticsHasMore  = false;
let analyticsStartDate = null;
let analyticsEndDate   = null;
// ─────────────────────────────────────────────────────────────────────────────

// Load analytics data – server-side paginated
async function loadAnalyticsData() {
    const tableBody = document.getElementById('analyticsTableBody');
    tableBody.innerHTML = '<tr><td colspan="6" class="no-data">Loading...</td></tr>';

    try {
        const startOfDay = new Date(analyticsStartDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(analyticsEndDate);
        endOfDay.setHours(23, 59, 59, 999);

        let query = db.collection('analytics')
            .where('timestamp', '>=', startOfDay)
            .where('timestamp', '<=', endOfDay)
            .orderBy('timestamp', 'desc')
            .limit(ANALYTICS_PAGE_SIZE + 1);

        const cursorDoc = analyticsCursors[analyticsPage - 1];
        if (cursorDoc) {
            query = query.startAfter(cursorDoc);
        }

        const snapshot = await query.get();

        if (snapshot.empty) {
            tableBody.innerHTML = '<tr><td colspan="6" class="no-data">No analytics data found</td></tr>';
            analyticsHasMore = false;
            renderAnalyticsPagination();
            return;
        }

        const docs = snapshot.docs;
        analyticsHasMore = docs.length > ANALYTICS_PAGE_SIZE;
        const pageDocs   = analyticsHasMore ? docs.slice(0, ANALYTICS_PAGE_SIZE) : docs;

        if (analyticsHasMore) {
            analyticsCursors[analyticsPage] = pageDocs[pageDocs.length - 1];
        }

        const from = (analyticsPage - 1) * ANALYTICS_PAGE_SIZE + 1;
        const to   = from + pageDocs.length - 1;

        let html = '';
        pageDocs.forEach(doc => {
            const data      = doc.data();
            const timestamp = data.timestamp
                ? new Date(data.timestamp.toDate()).toLocaleString()
                : 'N/A';

            html += '<tr>' +
                '<td>' + timestamp + '</td>' +
                '<td>' + (data.country     || 'N/A') + '</td>' +
                '<td>' + (data.ipAddress   || 'N/A') + '</td>' +
                '<td>' + (data.deviceOS    || 'N/A') + '</td>' +
                '<td>' + (data.browser     || 'N/A') + '</td>' +
                '<td>' + (data.pageVisited || 'N/A') + '</td>' +
            '</tr>';
        });

        tableBody.innerHTML = html;
        renderAnalyticsPagination(from, to);

    } catch (error) {
        console.error('Error loading analytics:', error);
        tableBody.innerHTML = '<tr><td colspan="6" class="no-data">Error loading data: ' + error.message + '</td></tr>';
    }
}

// Render pagination controls for analytics
function renderAnalyticsPagination(from, to) {
    const controls = document.getElementById('analyticsPagination');
    if (!controls) return;

    const prevDisabled = analyticsPage === 1 ? 'disabled' : '';
    const nextDisabled = !analyticsHasMore   ? 'disabled' : '';
    const info         = (from && to) ? 'Page ' + analyticsPage + ' &nbsp;(' + from + '&ndash;' + to + ' shown)' : 'Page ' + analyticsPage;

    controls.innerHTML =
        '<span class="pagination-info">' + info + '</span>' +
        '<button class="pg-btn" data-table="analytics" data-dir="prev" ' + prevDisabled + '>\u2039 Prev</button>' +
        '<button class="pg-btn active">' + analyticsPage + '</button>' +
        '<button class="pg-btn" data-table="analytics" data-dir="next" ' + nextDisabled + '>Next \u203a</button>';
}

// Filter analytics – triggered by the Filter button; always resets to page 1
function filterAnalytics() {
    const startVal = document.getElementById('startDate').value
        || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endVal = document.getElementById('endDate').value
        || new Date().toISOString().split('T')[0];

    // Reset cursors whenever date range changes
    analyticsCursors  = [null];
    analyticsPage     = 1;
    analyticsHasMore  = false;
    analyticsStartDate = startVal;
    analyticsEndDate   = endVal;

    loadAnalyticsData();
}

// Track visitor (called from main website)
async function trackVisitor(pageVisited) {
    try {
        await db.collection('analytics').add({
            timestamp:   new Date(),
            pageVisited: pageVisited,
            userAgent:   navigator.userAgent,
            url:         window.location.href,
        });
    } catch (error) {
        console.error('Error tracking visitor:', error);
    }
}

// Update today's visitors count on dashboard
async function updateTodayVisitors() {
    try {
        const today    = new Date(); today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
        const snapshot = await db.collection('analytics')
            .where('timestamp', '>=', today)
            .where('timestamp', '<',  tomorrow)
            .get();
        document.getElementById('todayVisitors').textContent = snapshot.size;
    } catch (error) {
        console.error('Error updating today visitors:', error);
    }
}

// Update total visitors count on dashboard
async function updateTotalVisitors() {
    try {
        const snapshot = await db.collection('analytics').get();
        document.getElementById('totalVisitors').textContent = snapshot.size;
    } catch (error) {
        console.error('Error updating total visitors:', error);
    }
}

console.log('Analytics module loaded');
