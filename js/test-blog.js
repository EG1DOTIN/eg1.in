function log(message, type = 'info') {
    const output = document.getElementById('consoleOutput');
    const timestamp = new Date().toLocaleTimeString();
    const color = type === 'error' ? '#f48771' : type === 'success' ? '#89d185' : '#858585';
    output.innerHTML += `<div style="color: ${color};">[${timestamp}] ${message}</div>`;
    output.scrollTop = output.scrollHeight;
    console.log(message);
}

function updateStatus(message, type = 'info') {
    const status = document.getElementById('status');
    status.className = `status ${type}`;
    status.innerHTML = message;
}

function clearConsole() {
    document.getElementById('consoleOutput').innerHTML = '';
}

async function testFirebaseConnection() {
    log('Testing Firebase connection...', 'info');
    try {
        if (typeof firebase === 'undefined') {
            log('❌ Firebase SDK not loaded', 'error');
            updateStatus('❌ Firebase SDK not loaded', 'error');
            return;
        }

        if (typeof db === 'undefined') {
            log('❌ Firestore database (db) not initialized', 'error');
            updateStatus('❌ Firestore database not initialized', 'error');
            return;
        }

        log('✅ Firebase SDK loaded', 'success');
        log('✅ Firestore database initialized', 'success');

        // Test a simple query
        const snapshot = await db.collection('eg1_blog').limit(1).get();
        log(`✅ Can query Firestore: Database appears to be working`, 'success');
        updateStatus('✅ Firebase and Firestore are connected and working', 'success');
    } catch (error) {
        log(`❌ Firebase error: ${error.message}`, 'error');
        updateStatus(`❌ Firebase error: ${error.message}`, 'error');
    }
}

async function countBlogs() {
    log('Counting blogs in Firestore...', 'info');
    try {
        if (!db) {
            log('❌ Firestore not initialized', 'error');
            return;
        }
        const snapshot = await db.collection("eg1_blog").get();

        if (snapshot.empty) {
            log('❌ No blogs found in Firestore', 'error');
            updateStatus('❌ No blogs in Firestore', 'error');
            return;
        }

        this.blogs = [];
        snapshot.docs.forEach((doc) => {
            const catData = doc.data();
            for (const [key, value] of Object.entries(catData)) {
                if (key.startsWith('page')) {
                    for (const [blogId, blogData] of Object.entries(value)) {
                        // Add the flattened blog
                        this.blogs.push({ id: blogId, ...blogData });
                    }
                }
            }
        });
        const count = this.blogs.length;

        if (count === 0) {
            log(`⚠️  No blogs found in Firestore! Collection is empty.`, 'error');
            updateStatus(`⚠️  No blogs in Firestore - Collection is empty`, 'error');
        } else {
            log(`✅ Found ${count} blog(s) in Firestore`, 'success');
            updateStatus(`✅ Found ${count} blog(s) in Firestore`, 'success');
        }
    } catch (error) {
        log(`❌ Error counting blogs: ${error.message}`, 'error');
        updateStatus(`❌ Error: ${error.message}`, 'error');
    }
}

async function listAllBlogs() {
    log('Fetching all blogs...', 'info');
    try {
        if (!db) {
            log('❌ Firestore not initialized', 'error');
            return;
        }

        const snapshot = await db.collection('eg1_blog').get();

        if (snapshot.empty) {
            log('❌ No blogs found in Firestore', 'error');
            updateStatus('❌ No blogs in Firestore', 'error');
            return;
        }

        this.blogs = [];
        log(`   Doc_ID   |  Blog_ID  |   category    |   Title   |   Has Content     `, 'info');
        snapshot.docs.forEach((doc, index) => {
            const catData = doc.data();
            for (const [key, value] of Object.entries(catData)) {
                if (key.startsWith('page')) {
                    for (const [blogId, blogData] of Object.entries(value)) {
                        const title = blogData.heading || blogData.title || 'Untitled';
                        // Add the flattened blog
                        this.blogs.push({ id: blogId, ...blogData });
                        const hasContent = blogData.short_description || blogData.full_description || blogData.end_description || blogData.content;
                        log(`${index + 1}. <strong>${doc.id}</strong> | <strong>${blogId}</strong> | ${blogData.category} | ${title} | ${hasContent ? 'Yes' : 'No'}`, 'info');
                    }
                }
            }
        })

        log(`Found ${this.blogs.length} blog(s):`, 'success');

        updateStatus(`✅ Listed ${this.blogs.length} blog(s) - Check console above`, 'success');
    } catch (error) {
        log(`❌ Error listing blogs: ${error.message}`, 'error');
        updateStatus(`❌ Error: ${error.message}`, 'error');
    }
}

async function testDataCache() {
    log('Testing DataCache & Read Count Verification...', 'info');
    try {
        if (typeof DataCache === 'undefined') {
            log('❌ DataCache not found', 'error');
            updateStatus('❌ DataCache not available', 'error');
            return;
        }

        log('Call 1: DataCache.getBlogs()...', 'info');
        const blogs1 = await DataCache.getBlogs();
        const source1 = DataCache.lastFetchSource.blogs || 'unknown';
        log(`📊 Call 1 Result: ${blogs1.length} blogs fetched | Source: ${source1}`, 'success');

        log('Call 2 (Immediate Cache Verification): DataCache.getBlogs()...', 'info');
        const blogs2 = await DataCache.getBlogs();
        const source2 = DataCache.lastFetchSource.blogs || 'unknown';
        log(`📊 Call 2 Result: ${blogs2.length} blogs fetched | Source: ${source2}`, 'success');

        if (source2.includes('0 reads') || source2.includes('memory') || source2.includes('localStorage')) {
            log('🎉 CACHE VERIFICATION SUCCESSFUL: 0 Firestore DB reads on 2nd access!', 'success');
            updateStatus(`✅ DataCache Verified - Call 1: [${source1}] | Call 2: [0 Firestore Reads (Cache Hit)]`, 'success');
        } else {
            log('⚠️ Warning: Call 2 triggered network reads.', 'warning');
            updateStatus(`⚠️ Call 1: ${source1} | Call 2: ${source2}`, 'warning');
        }
    } catch (error) {
        log(`❌ DataCache error: ${error.message}`, 'error');
        updateStatus(`❌ DataCache error: ${error.message}`, 'error');
    }
}

// Auto-run on page load
window.addEventListener('load', () => {
    log('Debug page loaded. Running tests...', 'info');
    setTimeout(() => testFirebaseConnection(), 500);
});
