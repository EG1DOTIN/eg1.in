// App Users Management Module
// Handles viewing and managing registered users across EG1 apps/products from Firestore 'dummy-app-users'
// Integrated with TableToolkit for smart sorting and universal pagination

let allAppUsers = [];
let appUsersTableController = null;
const APP_USERS_PAGE_SIZE = 10;

/**
 * Fetches all registered users from Firestore 'dummy-app-users'
 */
async function loadAppUsersData() {
    try {
        const tableBody = document.getElementById('appUsersTableBody');
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="7" class="no-data"><span class="loading"></span> Loading registered users...</td></tr>';
        }

        const snapshot = await db.collection('dummy-app-users').get();
        allAppUsers = [];
        
        snapshot.forEach(doc => {
            const data = doc.data();
            allAppUsers.push({
                id: doc.id,
                userId: data.userId || doc.id,
                name: data.name || 'Anonymous User',
                email: data.email || 'N/A',
                appName: data.appName || 'General App',
                appId: data.appId || '',
                registeredAt: data.registeredAt || '',
                lastLogin: data.lastLogin || '',
                status: data.status || 'active',
                country: data.country || 'N/A',
                device: data.device || 'N/A',
                version: data.version || '1.0.0'
            });
        });

        updateAppUsersStats();
        populateAppFilterDropdown();
        initAppUsersTableController();
        filterAppUsers();
    } catch (error) {
        console.error('Error fetching app users:', error);
        const tableBody = document.getElementById('appUsersTableBody');
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="7" class="no-data" style="color: var(--danger-color);">Error loading users from Firestore: ' + (error.message || error) + '</td></tr>';
        }
    }
}

/**
 * Updates Dashboard stat count for Total App Users
 */
function updateAppUsersStats() {
    const totalCountEl = document.getElementById('totalAppUsers');
    if (totalCountEl) {
        totalCountEl.textContent = allAppUsers.length;
    }
    const sectionCountEl = document.getElementById('appUsersTotalCount');
    if (sectionCountEl) {
        sectionCountEl.textContent = allAppUsers.length;
    }
}

/**
 * Populates unique apps in the filter dropdown
 */
function populateAppFilterDropdown() {
    const filterSelect = document.getElementById('appUserFilter');
    if (!filterSelect) return;

    const appSet = new Set();
    allAppUsers.forEach(u => {
        if (u.appName) appSet.add(u.appName);
    });

    const apps = Array.from(appSet).sort();
    
    // Populate dropdown options
    if (filterSelect.options.length <= 1) {
        let html = '<option value="all">All Apps / Products</option>';
        apps.forEach(app => {
            const selected = (app === 'Marwadi Chess') ? 'selected' : '';
            html += `<option value="${escapeHtml(app)}" ${selected}>${escapeHtml(app)}</option>`;
        });
        filterSelect.innerHTML = html;
    }
}

/**
 * Initializes the standalone DataTableController for App Users.
 */
function initAppUsersTableController() {
    if (!appUsersTableController && window.TableToolkit) {
        appUsersTableController = new window.TableToolkit.DataTableController({
            data: allAppUsers,
            pageSize: APP_USERS_PAGE_SIZE,
            initialSortKey: 'registeredAt',
            initialSortDir: 'desc',
            initialSortType: 'date',
            table: '#appUsersTable',
            pagination: '#appUsersPagination',
            onRender: renderAppUsersRows
        });
    } else if (appUsersTableController) {
        appUsersTableController.setData(allAppUsers);
    }
}

/**
 * Filters the users based on selected app, status, and search query
 */
function filterAppUsers() {
    const filterSelect = document.getElementById('appUserFilter');
    const selectedApp = filterSelect ? filterSelect.value : 'Marwadi Chess';

    const statusSelect = document.getElementById('appUserStatusFilter');
    const selectedStatus = statusSelect ? statusSelect.value : 'all';

    const searchInput = document.getElementById('appUserSearchInput');
    const searchQuery = searchInput ? searchInput.value.trim().toLowerCase() : '';

    if (!appUsersTableController) {
        initAppUsersTableController();
    }

    if (appUsersTableController) {
        appUsersTableController.filter(user => {
            // App Filter
            if (selectedApp && selectedApp !== 'all') {
                if (user.appName !== selectedApp && user.appId !== selectedApp) {
                    return false;
                }
            }

            // Status Filter
            if (selectedStatus && selectedStatus !== 'all') {
                if (user.status !== selectedStatus) {
                    return false;
                }
            }

            // Search Filter
            if (searchQuery) {
                const matchName = user.name.toLowerCase().includes(searchQuery);
                const matchEmail = user.email.toLowerCase().includes(searchQuery);
                const matchId = user.userId.toLowerCase().includes(searchQuery);
                const matchCountry = user.country.toLowerCase().includes(searchQuery);
                if (!matchName && !matchEmail && !matchId && !matchCountry) {
                    return false;
                }
            }

            return true;
        });
    }
}

/**
 * Renders the sliced page rows into the App Users table.
 * @param {Array<Object>} users 
 * @param {Object} meta 
 */
function renderAppUsersRows(users, meta) {
    const tableBody = document.getElementById('appUsersTableBody');
    if (!tableBody) return;

    if (!users || users.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="no-data">No registered users found matching the selected filters.</td></tr>';
        return;
    }

    let rowsHtml = '';
    users.forEach(user => {
        const regDate = user.registeredAt ? new Date(user.registeredAt).toLocaleDateString(undefined, {
            year: 'numeric', month: 'short', day: 'numeric'
        }) : 'N/A';

        const isActive = user.status === 'active';
        const statusBadge = isActive
            ? '<span class="badge-status active"><i class="fas fa-check-circle"></i> Active</span>'
            : '<span class="badge-status inactive"><i class="fas fa-times-circle"></i> Inactive</span>';

        rowsHtml += `
            <tr>
                <td><code>${escapeHtml(user.userId)}</code></td>
                <td>
                    <div style="font-weight: 600; color: var(--text-color);">${escapeHtml(user.name)}</div>
                    <small style="color: var(--secondary-color);">${escapeHtml(user.country || 'N/A')}</small>
                </td>
                <td>${escapeHtml(user.email)}</td>
                <td><span class="app-tag">${escapeHtml(user.appName)}</span></td>
                <td>${regDate}</td>
                <td>${statusBadge}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-primary" style="padding: 4px 8px; font-size: 12px; width: auto; margin-top: 0;"
                            onclick="showUserDetails('${escapeHtml(user.userId)}')" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-secondary" style="padding: 4px 8px; font-size: 12px; width: auto; margin-top: 0;"
                            onclick="toggleUserStatus('${escapeHtml(user.id)}', '${user.status}')"
                            title="${isActive ? 'Deactivate User' : 'Activate User'}">
                            <i class="fas ${isActive ? 'fa-ban' : 'fa-check'}"></i>
                        </button>
                        <button class="btn-danger" style="padding: 4px 8px; font-size: 12px; width: auto; margin-top: 0; background: var(--danger-color); color: #fff; border: none; border-radius: 4px; cursor: pointer;"
                            onclick="deleteAppUser('${escapeHtml(user.id)}')" title="Delete User">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });

    tableBody.innerHTML = rowsHtml;
}

/**
 * Toggles user active/inactive status in Firestore
 */
async function toggleUserStatus(docId, currentStatus) {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
        await db.collection('dummy-app-users').doc(docId).update({
            status: newStatus
        });
        
        const user = allAppUsers.find(u => u.id === docId);
        if (user) user.status = newStatus;
        
        filterAppUsers();
    } catch (error) {
        alert('Error updating user status: ' + error.message);
    }
}

/**
 * Deletes user from Firestore
 */
async function deleteAppUser(docId) {
    if (!confirm('Are you sure you want to delete this registered user?')) return;
    try {
        await db.collection('dummy-app-users').doc(docId).delete();
        allAppUsers = allAppUsers.filter(u => u.id !== docId);
        updateAppUsersStats();
        if (appUsersTableController) {
            appUsersTableController.setData(allAppUsers);
        }
        filterAppUsers();
    } catch (error) {
        alert('Error deleting user: ' + error.message);
    }
}

/**
 * Displays full details of a registered user in an alert/modal
 */
function showUserDetails(userId) {
    const user = allAppUsers.find(u => u.userId === userId || u.id === userId);
    if (!user) return;

    const details = `
👤 User Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━
• User ID: ${user.userId}
• Name: ${user.name}
• Email: ${user.email}
• Application: ${user.appName} (${user.appId})
• App Version: ${user.version}
• Country: ${user.country}
• Registered Device: ${user.device}
• Registered On: ${user.registeredAt}
• Last Active: ${user.lastLogin || 'N/A'}
• Status: ${user.status.toUpperCase()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `;
    alert(details);
}

/**
 * Helper to escape HTML characters
 */
function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Expose globally
window.loadAppUsersData = loadAppUsersData;
window.filterAppUsers = filterAppUsers;
window.showUserDetails = showUserDetails;
window.toggleUserStatus = toggleUserStatus;
window.deleteAppUser = deleteAppUser;
