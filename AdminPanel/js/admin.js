// ── Theme Switcher Module ───────────────────────────────────────────────────

/**
 * Initializes Admin Theme from localStorage or defaults to 'light-gray'.
 */
function initAdminTheme() {
    var savedTheme = localStorage.getItem('eg1_theme') || 'light-gray';
    setAdminTheme(savedTheme, false);
}

/**
 * Sets the active theme on the document and optionally saves to localStorage.
 * @param {string} themeName - 'light-gray' or 'dark-gray'
 * @param {boolean} persist - whether to save to localStorage
 */
function setAdminTheme(themeName, persist) {
    if (persist === undefined) persist = true;
    document.documentElement.setAttribute('data-theme', themeName);
    if (persist) {
        localStorage.setItem('eg1_theme', themeName);
    }

    var isDark = (themeName === 'dark-gray' || themeName === 'dark');
    var labelEl = document.getElementById('themeToggleLabel');
    if (labelEl) {
        labelEl.textContent = isDark ? 'Dark Gray' : 'Light Gray';
    }

    var btn = document.getElementById('themeToggleBtn');
    if (btn) {
        btn.setAttribute('aria-checked', isDark ? 'true' : 'false');
    }
}

/**
 * Toggles between 'light-gray' and 'dark-gray' themes.
 */
function toggleAdminTheme() {
    var currentTheme = document.documentElement.getAttribute('data-theme') || localStorage.getItem('eg1_theme') || 'light-gray';
    var isDark = (currentTheme === 'dark-gray' || currentTheme === 'dark');
    var newTheme = isDark ? 'light-gray' : 'dark-gray';
    setAdminTheme(newTheme, true);
}

// Automatically initialize theme as soon as script runs
initAdminTheme();

// Load dashboard stats
async function loadDashboardStats() {
    try {
        if (typeof updateVisitorStats === 'function') {
            await updateVisitorStats();
        }
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

// Auto-save interval for dashboard stats
setInterval(() => {
    if (document.getElementById('dashboard').classList.contains('active')) {
        loadDashboardStats();
    }
}, 30000); // Refresh every 30 seconds

// Single delegated event handler for pagination + table actions
document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-action], [data-table]');
    if (!btn) return;

    var action = btn.dataset.action;
    var id     = btn.dataset.id;

    // ── Table row actions ────────────────────────────────────────────────
    if (action === 'delete-message')  { deleteMessage(id);  return; }

    // ── Pagination Prev / Next / Page Number ───────────────────────────
    var table = btn.dataset.table;
    var dir   = btn.dataset.dir;
    if (!table || btn.disabled || btn.hasAttribute('disabled')) return;

    if (btn.dataset.page) {
        if (table === 'messages') { messagesPage = Number(btn.dataset.page); loadMessagesList(); }
        if (table === 'analytics') { analyticsPage = Number(btn.dataset.page); loadAnalyticsData(); }
        return;
    }

    if (!dir) return;

    if (table === 'messages') {
        if (dir === 'next') { messagesPage++;                            loadMessagesList(); }
        if (dir === 'prev') { messagesPage = Math.max(1, messagesPage - 1); loadMessagesList(); }
    }
    if (table === 'analytics') {
        if (dir === 'next') { analyticsPage++;                             loadAnalyticsData(); }
        if (dir === 'prev') { analyticsPage = Math.max(1, analyticsPage - 1); loadAnalyticsData(); }
    }
});

console.log('Admin panel module loaded');
