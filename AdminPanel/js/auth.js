/**
 * @file auth.js
 * @description Admin Panel Authentication — Three-Layer Security System:
 *   Layer 1: Google Sign-In with email whitelist (only authorized admin Gmail allowed).
 *   Layer 2: 16-digit Security PIN verified via SHA-256 hash comparison against Firestore.
 *   Layer 3: Login attempt logging (paginated, 18 entries/doc) and IP-based lockout
 *            after 3 failed attempts (24-hour block).
 * @project EG1 Website Portal - Admin Panel
 */

// ─── Global State ──────────────────────────────────────────────────────────────
let currentUser = null;
let isPinVerified = false;

// ─── Configuration ─────────────────────────────────────────────────────────────

// ⚠️ IMPORTANT: Replace this with your actual admin Gmail address before deploying.
// Only this Google account will be allowed to sign in to the admin panel.
const ALLOWED_ADMIN_EMAIL = "eg1dotin@gmail.com";

// Google Auth Provider instance
const googleProvider = new firebase.auth.GoogleAuthProvider();

// Salt used when hashing the 16-digit PIN before comparing with Firestore.
// Even if exposed in DevTools, a 16-digit numeric PIN has 10^16 combinations —
// brute-forcing at 1 billion hashes/sec would take ~115 days.
const PIN_SALT = "EG1_ADMIN_SECURE_SALT_2026";

// Max failed attempts before a 24-hour IP lockout is applied
const MAX_FAIL_ATTEMPTS = 3;
const LOCKOUT_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Max log entries per Firestore document (keeps reads efficient — 1 doc read per page)
const LOGS_PER_PAGE = 18;

// ─── Utility: SHA-256 Hash ─────────────────────────────────────────────────────

/**
 * Computes a salted SHA-256 hash of the given PIN using the browser Web Crypto API.
 * @param {string} pin - Raw 16-digit PIN string (no formatting).
 * @param {string} salt - Secret salt string appended before hashing.
 * @returns {Promise<string>} Hex-encoded SHA-256 hash string.
 */
async function computePinHash(pin, salt) {
    const encoder = new TextEncoder();
    const data = encoder.encode(pin + salt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ─── Utility: Get Client IP ────────────────────────────────────────────────────

/**
 * Fetches the public IP address of the client using ipify.org.
 * Returns "unknown" if the request fails (offline, firewall, etc.).
 * @returns {Promise<string>} IPv4 address string.
 */
async function getClientIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(3000) });
        const data = await response.json();
        return data.ip || 'unknown';
    } catch {
        return 'unknown';
    }
}

// ─── Utility: Sanitize IP for Firestore Doc ID ───────────────────────────────

/**
 * Converts an IP address like "103.12.34.56" into a safe Firestore document ID "103_12_34_56".
 * Firestore doc IDs cannot contain dots.
 * @param {string} ip - Raw IP address string.
 * @returns {string} Sanitized document-safe IP key.
 */
function sanitizeIPKey(ip) {
    return ip.replace(/\./g, '_').replace(/[^a-zA-Z0-9_]/g, '');
}

// ─── Login Attempt Logging (Paginated, 18 entries per doc) ────────────────────

/**
 * Logs an admin login attempt into Firestore `admin_login_log` collection.
 *
 * Pagination strategy:
 *   - A `meta` document stores { currentPage, currentCount }.
 *   - Each `page_N` document stores an array of up to 18 log entries.
 *   - When a page fills up (count = 18), a new page is started.
 *   - This means reading one page = exactly 1 Firestore document read, keeping usage low.
 *
 * @param {Object} logEntry - Login attempt metadata to log.
 */
async function logLoginAttempt(logEntry) {
    try {
        const db = firebase.firestore();
        const metaRef = db.collection('admin_login_log').doc('meta');

        await db.runTransaction(async (transaction) => {
            const metaSnap = await transaction.get(metaRef);

            let currentPage = 1;
            let currentCount = 0;

            if (metaSnap.exists) {
                currentPage = metaSnap.data().currentPage || 1;
                currentCount = metaSnap.data().currentCount || 0;
            }

            // If current page is full, advance to next page
            if (currentCount >= LOGS_PER_PAGE) {
                currentPage++;
                currentCount = 0;
            }

            const pageRef = db.collection('admin_login_log').doc('page_' + currentPage);

            // Append log entry to the current page's logs array
            transaction.set(pageRef, {
                pageNum: currentPage,
                logs: firebase.firestore.FieldValue.arrayUnion({
                    ...logEntry,
                    timestamp: new Date().toISOString() // ISO string used inside array (server timestamp not allowed in arrays)
                })
            }, { merge: true });

            // Update meta document with new page/count state
            transaction.set(metaRef, {
                currentPage: currentPage,
                currentCount: currentCount + 1,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });
        });
    } catch (err) {
        console.warn('Login attempt logging failed (non-critical):', err.message);
    }
}

// ─── IP Lockout System ────────────────────────────────────────────────────────

/**
 * Checks if a given IP address is currently locked out due to too many failed attempts.
 * @param {string} ip - Client IP address string.
 * @returns {Promise<{locked: boolean, unlocksAt: Date|null}>}
 */
async function checkLockout(ip) {
    try {
        const db = firebase.firestore();
        const lockRef = db.collection('admin_lockout').doc(sanitizeIPKey(ip));
        const lockSnap = await lockRef.get();

        if (!lockSnap.exists) return { locked: false, unlocksAt: null };

        const data = lockSnap.data();
        if (!data.lockedUntil) return { locked: false, unlocksAt: null };

        const lockedUntil = data.lockedUntil.toDate ? data.lockedUntil.toDate() : new Date(data.lockedUntil);
        const now = new Date();

        if (now < lockedUntil) {
            return { locked: true, unlocksAt: lockedUntil };
        } else {
            // Lockout expired — reset the counter
            await lockRef.update({ failCount: 0, lockedUntil: null });
            return { locked: false, unlocksAt: null };
        }
    } catch (err) {
        console.warn('Lockout check failed:', err.message);
        return { locked: false, unlocksAt: null }; // Fail open to not block legitimate admin
    }
}

/**
 * Records a failed login attempt for the given IP. If total failures >= MAX_FAIL_ATTEMPTS,
 * applies a 24-hour lockout to that IP in Firestore.
 * @param {string} ip - Client IP address.
 * @param {string} email - Email address used in the attempt.
 * @param {string} outcome - Which step failed: 'fail_unauthorized', 'fail_google', or 'fail_pin'.
 */
async function recordFailedAttempt(ip, email, outcome) {
    try {
        const db = firebase.firestore();
        const lockRef = db.collection('admin_lockout').doc(sanitizeIPKey(ip));
        const lockSnap = await lockRef.get();

        const currentCount = lockSnap.exists ? (lockSnap.data().failCount || 0) : 0;
        const newCount = currentCount + 1;

        const update = {
            ipAddress: ip,
            email: email,
            failCount: newCount,
            lastFailAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (newCount >= MAX_FAIL_ATTEMPTS) {
            const unlocksAt = new Date(Date.now() + LOCKOUT_DURATION_MS);
            update.lockedUntil = firebase.firestore.Timestamp.fromDate(unlocksAt);
            update.lockedAt = firebase.firestore.FieldValue.serverTimestamp();
            console.warn(`IP ${ip} locked out until ${unlocksAt.toISOString()} after ${newCount} failed attempts.`);
        }

        await lockRef.set(update, { merge: true });

        // Log the failed attempt
        await logLoginAttempt({
            email: email,
            ipAddress: ip,
            outcome: outcome,
            userAgent: navigator.userAgent,
            uid: null
        });

    } catch (err) {
        console.warn('Failed attempt recording error:', err.message);
    }
}

// ─── Auth State Listener ──────────────────────────────────────────────────────

/**
 * Listens for Firebase Auth state changes.
 * Enforces two-factor flow: Google Sign-In → 16-digit PIN check.
 */
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        // Verify the signed-in user is the authorized admin
        if (user.email !== ALLOWED_ADMIN_EMAIL) {
            console.warn('Unauthorized Google account detected:', user.email);
            firebase.auth().signOut();
            return;
        }

        currentUser = user;

        if (isPinVerified) {
            showAdminPanel();
            document.getElementById('userName').textContent = user.email;
        } else {
            showPinPage();
        }
    } else {
        currentUser = null;
        isPinVerified = false;
        showLoginPage();
    }
});

// ─── Google Sign-In (Layer 1: Google Account Auth) ─────────────────────────────

/**
 * Handles Google Sign-In button click.
 * Opens Google popup, verifies the email is the authorized admin, and proceeds to PIN.
 */
document.getElementById('googleSignInBtn').addEventListener('click', async () => {
    const errorElement = document.getElementById('loginError');
    errorElement.textContent = '';
    errorElement.classList.remove('show');

    const ip = await getClientIP();

    // Check lockout before allowing sign-in
    const lockStatus = await checkLockout(ip);
    if (lockStatus.locked) {
        const hrs = Math.ceil((lockStatus.unlocksAt - new Date()) / 3600000);
        errorElement.textContent = `Too many failed attempts. Access blocked for ${hrs} hour(s). Try again later.`;
        errorElement.classList.add('show');
        return;
    }

    try {
        // Set session persistence (cleared when browser tab closes)
        await firebase.auth().setPersistence(firebase.auth.Auth.Persistence.SESSION);

        // Open Google Sign-In popup
        const result = await firebase.auth().signInWithPopup(googleProvider);

        // Verify the signed-in Google account is the authorized admin
        if (result.user.email !== ALLOWED_ADMIN_EMAIL) {
            // Unauthorized account — sign out immediately and record attempt
            await firebase.auth().signOut();
            errorElement.textContent = 'Unauthorized Google account. Access denied.';
            errorElement.classList.add('show');
            await recordFailedAttempt(ip, result.user.email, 'fail_unauthorized');
            return;
        }

        // Auth state listener handles navigation to PIN screen
        errorElement.textContent = '';

    } catch (error) {
        // Handle popup closed or other Google errors
        if (error.code === 'auth/popup-closed-by-user') {
            errorElement.textContent = 'Sign-in cancelled.';
        } else if (error.code === 'auth/cancelled-popup-request') {
            // Ignore duplicate popup requests
            return;
        } else {
            errorElement.textContent = 'Sign-in failed: ' + error.message;
            await recordFailedAttempt(ip, 'google-popup', 'fail_google');
        }
        errorElement.classList.add('show');
    }
});

// ─── PIN Form (Layer 2: 16-Digit PIN + SHA-256) ────────────────────────────────

/**
 * Auto-advances focus to next PIN segment input when 4 digits are entered.
 */
['pinSeg1', 'pinSeg2', 'pinSeg3', 'pinSeg4'].forEach((id, idx, arr) => {
    const input = document.getElementById(id);
    if (!input) return;
    input.addEventListener('input', () => {
        // Only allow numeric digits
        input.value = input.value.replace(/\D/g, '');
        if (input.value.length === 4 && idx < arr.length - 1) {
            document.getElementById(arr[idx + 1]).focus();
        }
    });
    // Backspace on empty field moves focus back
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && input.value.length === 0 && idx > 0) {
            document.getElementById(arr[idx - 1]).focus();
        }
    });
});

/**
 * Handles 16-digit PIN form submission.
 * Combines 4 segments, computes SHA-256 hash, and compares with stored `pinHash` in Firestore.
 * Records failed PIN attempts and enforces IP lockout.
 */
document.getElementById('firestorePinForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Combine 4 groups into one 16-digit PIN string
    const seg1 = document.getElementById('pinSeg1').value;
    const seg2 = document.getElementById('pinSeg2').value;
    const seg3 = document.getElementById('pinSeg3').value;
    const seg4 = document.getElementById('pinSeg4').value;
    const fullPin = seg1 + seg2 + seg3 + seg4;

    const errorElement = document.getElementById('pinError');

    if (fullPin.length !== 16) {
        errorElement.textContent = 'Please enter all 16 digits (4 groups of 4).';
        errorElement.classList.add('show');
        return;
    }

    errorElement.textContent = 'Verifying...';
    errorElement.classList.remove('show');

    const ip = await getClientIP();

    // Check lockout before processing PIN
    const lockStatus = await checkLockout(ip);
    if (lockStatus.locked) {
        const hrs = Math.ceil((lockStatus.unlocksAt - new Date()) / 3600000);
        errorElement.textContent = `Too many failed attempts. Access blocked for ${hrs} hour(s).`;
        errorElement.classList.add('show');
        logout();
        return;
    }

    try {
        // Fetch admin security document from Firestore
        const docRef = firebase.firestore().collection('admin_security').doc(currentUser.uid);
        const docSnap = await docRef.get();

        // Compute SHA-256 hash of the entered PIN + salt
        const enteredHash = await computePinHash(fullPin, PIN_SALT);

        if (docSnap.exists && docSnap.data().pinHash === enteredHash) {
            // ✅ PIN correct — grant access and log successful login
            isPinVerified = true;
            errorElement.textContent = '';

            await logLoginAttempt({
                email: currentUser.email,
                ipAddress: ip,
                outcome: 'success',
                userAgent: navigator.userAgent,
                uid: currentUser.uid
            });

            showAdminPanel();
            document.getElementById('userName').textContent = currentUser.email;
        } else {
            // ❌ PIN wrong — record failure and possibly lock out
            errorElement.textContent = 'Incorrect PIN.';
            errorElement.classList.add('show');
            await recordFailedAttempt(ip, currentUser.email, 'fail_pin');
        }
    } catch (error) {
        errorElement.textContent = 'Error verifying PIN: ' + error.message;
        errorElement.classList.add('show');
    }
});

// ─── Logout ───────────────────────────────────────────────────────────────────

/**
 * Signs out current user from Firebase Auth (Google session) and resets local PIN state.
 */
function logout() {
    firebase.auth().signOut().then(() => {
        currentUser = null;
        isPinVerified = false;
        showLoginPage();
    }).catch((error) => {
        alert('Error logging out: ' + error.message);
    });
}

// ─── View Navigation ──────────────────────────────────────────────────────────

/**
 * Displays the Google Sign-In button (Step 1 of auth flow).
 */
function showLoginPage() {
    document.getElementById('loginContainer').style.display = 'flex';
    document.getElementById('adminDashboard').style.display = 'none';

    document.getElementById('googleLoginSection').style.display = 'block';
    const pinForm = document.getElementById('firestorePinForm');
    if (pinForm) {
        pinForm.style.display = 'none';
        pinForm.reset();
    }
    // Clear any previous error messages
    const loginError = document.getElementById('loginError');
    if (loginError) loginError.textContent = '';
}

/**
 * Displays the 16-digit PIN entry form (Step 2 of auth flow).
 */
function showPinPage() {
    document.getElementById('loginContainer').style.display = 'flex';
    document.getElementById('adminDashboard').style.display = 'none';
    document.getElementById('googleLoginSection').style.display = 'none';
    document.getElementById('firestorePinForm').style.display = 'block';
    // Auto-focus first PIN segment
    setTimeout(() => {
        const seg1 = document.getElementById('pinSeg1');
        if (seg1) seg1.focus();
    }, 100);
}

/**
 * Displays the main Admin Dashboard upon full authentication.
 */
function showAdminPanel() {
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'flex';
    startIdleTimer();
}

// ─── Admin CMS Section Tabs ───────────────────────────────────────────────────

/**
 * Navigates between Admin CMS section tabs (Blogs, Products, Messages, Analytics, Content).
 * @param {string} sectionId - Target section container element ID.
 */
function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

    document.getElementById(sectionId).classList.add('active');
    event.target.closest('.nav-link').classList.add('active');

    // Load section-specific data
    if (sectionId === 'analytics') {
        if (typeof loadAnalyticsData === 'function') loadAnalyticsData();
        if (typeof updateVisitorStats === 'function') updateVisitorStats();
    }
    else if (sectionId === 'blogs') loadBlogsList();
    else if (sectionId === 'products') loadProductsList();
    else if (sectionId === 'contents') resetContentTabs();
    else if (sectionId === 'messages') loadMessagesList();
    else if (sectionId === 'dashboard') loadDashboardStats();
}

// ─── Initializer ──────────────────────────────────────────────────────────────

/**
 * Initializes TinyMCE WYSIWYG editor and loads dashboard stats on page load.
 */
document.addEventListener('DOMContentLoaded', function () {
    initializeTinyMCE();
    loadDashboardStats();
});

// ─── Idle Auto-Logout (10 minutes) ───────────────────────────────────────────

let idleTime = 0;
let idleInterval;

/** Resets idle timer counter on any user activity. */
function resetIdleTimer() { idleTime = 0; }

/**
 * Starts a 1-minute interval timer. Logs out the admin after 10 minutes of inactivity.
 */
function startIdleTimer() {
    if (idleInterval) clearInterval(idleInterval);
    idleTime = 0;
    idleInterval = setInterval(() => {
        idleTime++;
        if (idleTime >= 10 && currentUser && isPinVerified) {
            logout();
            alert('You have been logged out due to 10 minutes of inactivity.');
        }
    }, 60000);
}

// Activity events reset idle timer
document.addEventListener('mousemove', resetIdleTimer);
document.addEventListener('keypress', resetIdleTimer);
document.addEventListener('click', resetIdleTimer);
document.addEventListener('scroll', resetIdleTimer);

console.log('Auth module loaded — EG1 Admin v4 (Google Sign-In + 16-digit PIN + IP Lockout + Paginated Logging)');