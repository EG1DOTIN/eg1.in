// Analytics Module (Firestore Batched Bucket Pattern + Smart Sorting & Pagination)
// ═══════════════════════════════════════════════════════════════════════════════
// Complete 16-Field Telemetry, Multi-Type Column Sorting, & Bucket Pagination
// ═══════════════════════════════════════════════════════════════════════════════

let analyticsBucketPage = 1;
let analyticsTotalBuckets = 1;
let currentBucketLogs = [];
let loadedBucketsCache = {};
let analyticsSortKey = 'timestamp';
let analyticsSortDir = 'desc';
let analyticsSortType = 'date';
let analyticsSortHeaderHelper = null;

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
            const totalBuckets = data.currentPage || 1;

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
            if (anaPages) anaPages.textContent = totalBuckets.toLocaleString();

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

    tableBody.innerHTML = '<tr><td colspan="8" class="no-data"><span class="loading"></span> Loading analytics data...</td></tr>';

    try {
        // Fetch meta document (1 read) to determine page boundaries and update stats cards
        const metaData = await updateVisitorStats();
        const maxBucket = metaData.currentPage || 1;
        const totalCount = metaData.totalVisitors || 0;

        if (totalCount === 0 && !metaData.currentPage) {
            tableBody.innerHTML = '<tr><td colspan="8" class="no-data">No visitor analytics data recorded yet.</td></tr>';
            renderAnalyticsPaginationUI(0, 0, 0, 1);
            return;
        }

        analyticsTotalBuckets = maxBucket;
        if (analyticsBucketPage > maxBucket) analyticsBucketPage = maxBucket;
        if (analyticsBucketPage < 1) analyticsBucketPage = 1;

        // UI Page 1 corresponds to the latest bucket in Firestore (e.g. page_3)
        const targetBucketNum = maxBucket - analyticsBucketPage + 1;
        let logs = [];

        if (loadedBucketsCache[targetBucketNum]) {
            logs = loadedBucketsCache[targetBucketNum];
        } else {
            const pageDoc = await db.collection('visitor_analytics').doc('page_' + targetBucketNum).get();

            if (!pageDoc.exists) {
                tableBody.innerHTML = '<tr><td colspan="8" class="no-data">No records found in bucket ' + targetBucketNum + '.</td></tr>';
                renderAnalyticsPaginationUI(0, 0, totalCount, maxBucket);
                return;
            }

            const pageData = pageDoc.data() || {};
            const rawLogs = pageData.logs || [];
            
            // Extract complete 16-field telemetry metadata from each visitor log record
            logs = rawLogs.map((entry, idx) => {
                const locParts = [];
                if (entry.city && entry.city !== 'Unknown' && entry.city !== 'N/A') locParts.push(entry.city);
                if (entry.region && entry.region !== 'Unknown' && entry.region !== 'N/A') locParts.push(entry.region);
                if (entry.country && entry.country !== 'Unknown' && entry.country !== 'N/A') locParts.push(entry.country);
                const locationStr = locParts.length > 0 ? locParts.join(', ') : 'Unknown';

                return {
                    id: entry.id || `v_log_${targetBucketNum}_${idx}`,
                    timestamp: entry.timestamp || '',
                    appName: entry.appName || 'eg1.in',
                    pageVisited: entry.pageVisited || '/',
                    referrer: entry.referrer || 'Direct',
                    ip: entry.ip || 'Unknown',
                    city: entry.city || 'Unknown',
                    region: entry.region || 'Unknown',
                    country: entry.country || 'Unknown',
                    postal: entry.postal || 'N/A',
                    org: entry.org || '',
                    timezone: entry.timezone || 'Unknown',
                    os: entry.os || 'Unknown',
                    browser: entry.browser || 'Unknown',
                    screen: entry.screen || 'N/A',
                    language: entry.language || 'en',
                    location: locationStr,
                    raw: entry
                };
            });

            loadedBucketsCache[targetBucketNum] = logs;
        }

        currentBucketLogs = logs;

        // Attach sortable headers if not attached yet
        initAnalyticsSorting();

        // Render current bucket's logs with filtering and active sorting
        filterAnalytics(totalCount, maxBucket);

    } catch (error) {
        console.error('Error loading analytics:', error);
        tableBody.innerHTML = '<tr><td colspan="8" class="no-data">Error loading data: ' + escapeHtml(error.message) + '</td></tr>';
    }
}

/**
 * Attaches sortable headers to the analytics table.
 */
function initAnalyticsSorting() {
    if (!analyticsSortHeaderHelper && window.TableToolkit) {
        analyticsSortHeaderHelper = window.TableToolkit.attachSortableHeaders('#analyticsTable', {
            activeKey: analyticsSortKey,
            activeDir: analyticsSortDir,
            onSort: (key, dir, type) => {
                analyticsSortKey = key;
                analyticsSortDir = dir;
                analyticsSortType = type;
                filterAnalytics();
            }
        });
    }
}

/**
 * Filter and sort current bucket logs, then render table rows and pagination controls.
 * @param {number} [totalVisitorCount] 
 * @param {number} [maxBuckets] 
 */
function filterAnalytics(totalVisitorCount, maxBuckets) {
    const appFilter = document.getElementById('analyticsAppFilter');
    const selectedApp = appFilter ? appFilter.value.trim().toLowerCase() : '';

    const searchInput = document.getElementById('analyticsSearchInput');
    const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';

    let filtered = [...currentBucketLogs];

    if (selectedApp) {
        filtered = filtered.filter(item => {
            const app = (item.appName || 'eg1.in').toLowerCase();
            return app.includes(selectedApp);
        });
    }

    if (searchTerm) {
        filtered = filtered.filter(item => {
            const haystack = [
                item.ip || '',
                item.location || '',
                item.org || '',
                item.os || '',
                item.browser || '',
                item.pageVisited || '',
                item.appName || '',
                item.referrer || '',
                item.timezone || '',
                item.postal || '',
                item.screen || '',
                item.language || '',
                item.timestamp || ''
            ].join(' ').toLowerCase();

            return haystack.includes(searchTerm);
        });
    }

    // Apply active column sorting
    if (analyticsSortKey && window.TableToolkit) {
        filtered = window.TableToolkit.sortDataset(filtered, analyticsSortKey, analyticsSortDir, analyticsSortType);
    }

    // Render table rows
    renderAnalyticsRows(filtered);

    // Calculate record range for pagination summary
    const totalCount = totalVisitorCount || parseInt(document.getElementById('analyticsTotalVisitors')?.textContent.replace(/,/g, ''), 10) || filtered.length;
    const maxB = maxBuckets || analyticsTotalBuckets;

    // Calculate approximate record index (Page 1 = newest records)
    let from = 1;
    if (analyticsBucketPage > 1) {
        const remainder = totalCount % 50 || 50;
        from = remainder + (analyticsBucketPage - 2) * 50 + 1;
    }
    const to = Math.min(from + filtered.length - 1, totalCount);

    renderAnalyticsPaginationUI(from, to, totalCount, maxB);
}

/**
 * Renders table body rows.
 * @param {Array<Object>} rows 
 */
function renderAnalyticsRows(rows) {
    const tableBody = document.getElementById('analyticsTableBody');
    if (!tableBody) return;

    if (!rows || rows.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" class="no-data">No records match the selected filter on this page.</td></tr>';
        return;
    }

    let html = '';
    rows.forEach(item => {
        const timeFormatted = item.timestamp
            ? new Date(item.timestamp).toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            })
            : 'N/A';

        const isEg1 = (item.appName && item.appName.includes('eg1')) || !item.appName;
        const appBadgeColor = isEg1 ? '#059669' : '#2563eb';
        const appBadgeBg = isEg1 ? 'rgba(5, 150, 105, 0.1)' : 'rgba(37, 99, 235, 0.1)';

        const ispStr = (item.org && item.org !== 'Unknown' && item.org !== 'N/A')
            ? `<div style="font-size: 0.8em; color: var(--secondary-color); margin-top: 2px;">${escapeHtml(item.org)}</div>`
            : '';

        const postalStr = (item.postal && item.postal !== 'Unknown' && item.postal !== 'N/A')
            ? ` <small style="color: var(--secondary-color);">(${escapeHtml(item.postal)})</small>`
            : '';

        const refStr = (item.referrer && item.referrer !== 'Direct' && item.referrer !== 'Unknown')
            ? `<div style="font-size: 0.75em; color: var(--secondary-color); margin-top: 2px;"><i class="fas fa-link"></i> ${escapeHtml(item.referrer)}</div>`
            : '';

        const screenStr = (item.screen && item.screen !== 'Unknown' && item.screen !== 'N/A')
            ? `<div style="font-size: 0.75em; color: var(--secondary-color); margin-top: 2px;"><i class="fas fa-expand"></i> ${escapeHtml(item.screen)} • ${escapeHtml(item.language)}</div>`
            : `<div style="font-size: 0.75em; color: var(--secondary-color); margin-top: 2px;">${escapeHtml(item.language)}</div>`;

        html += '<tr>' +
            '<td><i class="far fa-clock" style="color:var(--secondary-color); margin-right:4px;"></i>' + escapeHtml(timeFormatted) + 
                '<div style="font-size: 0.75em; color: var(--secondary-color); margin-top: 2px;">' + escapeHtml(item.timezone) + '</div></td>' +
            '<td><span style="display:inline-block; padding: 3px 8px; background: ' + appBadgeBg + '; color: ' + appBadgeColor + '; border-radius: 4px; font-weight: 600; font-size: 0.85em;">' + escapeHtml(item.appName) + '</span>' + refStr + '</td>' +
            '<td><i class="fas fa-map-marker-alt" style="color:#ef4444; margin-right:4px;"></i>' + escapeHtml(item.location) + postalStr + '</td>' +
            '<td><strong>' + escapeHtml(item.ip) + '</strong>' + ispStr + '</td>' +
            '<td><i class="fas fa-desktop" style="color:#64748b; margin-right:4px;"></i>' + escapeHtml(item.os) + screenStr + '</td>' +
            '<td><i class="fab fa-chrome" style="color:#3b82f6; margin-right:4px;"></i>' + escapeHtml(item.browser) + '</td>' +
            '<td><code>' + escapeHtml(item.pageVisited) + '</code></td>' +
            '<td><button class="btn-primary" style="padding: 4px 8px; font-size: 12px; width: auto; margin-top: 0;" onclick="showVisitorDetails(\'' + escapeHtml(item.id) + '\')" title="View Full Telemetry"><i class="fas fa-eye"></i></button></td>' +
        '</tr>';
    });

    tableBody.innerHTML = html;
}

/**
 * Renders the pagination controls for Analytics across Firestore buckets.
 * @param {number} from 
 * @param {number} to 
 * @param {number} totalItems 
 * @param {number} totalPages 
 */
function renderAnalyticsPaginationUI(from, to, totalItems, totalPages) {
    if (window.TableToolkit && typeof window.TableToolkit.renderPaginationUI === 'function') {
        window.TableToolkit.renderPaginationUI('#analyticsPagination', {
            totalItems: totalItems,
            totalPages: totalPages,
            currentPage: analyticsBucketPage,
            from: from,
            to: to
        }, (targetPage) => {
            changeAnalyticsBucketPage(targetPage);
        });
    }
}

/**
 * Switches to a specific analytics bucket page.
 * @param {number} targetPage 
 */
function changeAnalyticsBucketPage(targetPage) {
    if (targetPage < 1 || targetPage > analyticsTotalBuckets || targetPage === analyticsBucketPage) return;
    analyticsBucketPage = targetPage;
    loadAnalyticsData();
}

/**
 * Shows comprehensive modal/alert with all 16 visitor telemetry properties.
 * @param {string} logId 
 */
function showVisitorDetails(logId) {
    const item = currentBucketLogs.find(l => l.id === logId);
    if (!item) return;

    const details = `
🌐 Full Visitor Telemetry Record:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Log UUID: ${item.id}
• Timestamp (ISO): ${item.timestamp}
• App / Subdomain: ${item.appName}
• Page Visited: ${item.pageVisited}
• Traffic Referrer: ${item.referrer}
• IP Address: ${item.ip}
• Network / ISP Org: ${item.org || 'N/A'}
• Location: ${item.city}, ${item.region}, ${item.country}
• Postal Code: ${item.postal}
• Timezone: ${item.timezone}
• Operating System: ${item.os}
• Browser: ${item.browser}
• Screen Resolution: ${item.screen}
• Browser Language: ${item.language}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `;
    alert(details);
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

// Expose functions globally
window.loadAnalyticsData = loadAnalyticsData;
window.filterAnalytics = filterAnalytics;
window.changeAnalyticsBucketPage = changeAnalyticsBucketPage;
window.showVisitorDetails = showVisitorDetails;
window.updateVisitorStats = updateVisitorStats;
window.updateTodayVisitors = updateTodayVisitors;
window.updateTotalVisitors = updateTotalVisitors;

console.log('Visitor Analytics module loaded (16-field telemetry + TableToolkit Sorting & Pagination)');
