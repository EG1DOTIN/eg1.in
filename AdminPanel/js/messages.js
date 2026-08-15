// Messages Management Module

// ── Server-side pagination state ──────────────────────────────────────────────
const MESSAGES_PAGE_SIZE = 15;
let messagesCursors  = [null];
let messagesPage     = 1;
let messagesHasMore  = false;
// ─────────────────────────────────────────────────────────────────────────────

// Load messages list – server-side paginated
async function loadMessagesList() {
    const tableBody = document.getElementById('messagesTableBody');
    tableBody.innerHTML = '<tr><td colspan="6"><span class="loading"></span> Loading...</td></tr>';

    try {
        let query = db.collection('messages')
            .orderBy('createdAt', 'desc')
            .limit(MESSAGES_PAGE_SIZE + 1);

        const cursorDoc = messagesCursors[messagesPage - 1];
        if (cursorDoc) {
            query = query.startAfter(cursorDoc);
        }

        const snapshot = await query.get();

        if (snapshot.empty) {
            tableBody.innerHTML = '<tr><td colspan="6" class="no-data">No messages found</td></tr>';
            messagesHasMore = false;
            renderMessagesPagination();
            return;
        }

        const docs = snapshot.docs;
        messagesHasMore = docs.length > MESSAGES_PAGE_SIZE;
        const pageDocs  = messagesHasMore ? docs.slice(0, MESSAGES_PAGE_SIZE) : docs;

        if (messagesHasMore) {
            messagesCursors[messagesPage] = pageDocs[pageDocs.length - 1];
        }

        const from = (messagesPage - 1) * MESSAGES_PAGE_SIZE + 1;
        const to   = from + pageDocs.length - 1;

        let html = '';
        pageDocs.forEach(doc => {
            const data        = doc.data();
            const createdDate = data.createdAt
                ? new Date(data.createdAt.toDate()).toLocaleString()
                : 'N/A';

            html += '<tr>' +
                '<td>' + (data.name    || 'N/A') + '</td>' +
                '<td>' + (data.email   || 'N/A') + '</td>' +
                '<td>' + (data.contact || 'N/A') + '</td>' +
                '<td>' + createdDate + '</td>' +
                '<td><div style="max-height:100px;overflow-y:auto;">' + (data.message || 'N/A') + '</div></td>' +
                '<td class="action-buttons">' +
                    '<button class="btn-delete" data-id="' + doc.id + '" data-action="delete-message">Delete</button>' +
                '</td>' +
            '</tr>';
        });

        tableBody.innerHTML = html;
        renderMessagesPagination(from, to);

    } catch (error) {
        console.error('Error loading messages:', error);
        tableBody.innerHTML = '<tr><td colspan="6" class="no-data">Error loading messages: ' + error.message + '</td></tr>';
    }
}

// Render pagination controls for messages
function renderMessagesPagination(from, to) {
    const controls = document.getElementById('messagesPagination');
    if (!controls) return;

    const prevDisabled = messagesPage === 1 ? 'disabled' : '';
    const nextDisabled = !messagesHasMore   ? 'disabled' : '';
    const info         = (from && to) ? 'Page ' + messagesPage + ' &nbsp;(' + from + '&ndash;' + to + ' shown)' : 'Page ' + messagesPage;

    controls.innerHTML =
        '<span class="pagination-info">' + info + '</span>' +
        '<button class="pg-btn" data-table="messages" data-dir="prev" ' + prevDisabled + '>\u2039 Prev</button>' +
        '<button class="pg-btn active">' + messagesPage + '</button>' +
        '<button class="pg-btn" data-table="messages" data-dir="next" ' + nextDisabled + '>Next \u203a</button>';
}

// Delete message
async function deleteMessage(messageId) {
    if (!confirm('Are you sure you want to delete this message?')) return;
    try {
        await db.collection('messages').doc(messageId).delete();
        messagesCursors = [null]; messagesPage = 1; messagesHasMore = false;
        loadMessagesList();
        alert('Message deleted successfully');
    } catch (error) {
        console.error('Error deleting message:', error);
        alert('Error deleting message: ' + error.message);
    }
}

console.log('Messages module loaded');
