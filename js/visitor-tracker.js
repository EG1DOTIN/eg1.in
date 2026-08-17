/**
 * @file visitor-tracker.js
 * @description Standalone, modular, plug-and-play visitor tracking module for EG1 and affiliated webapps (e.g. MChess).
 *              Captures non-invasive telemetry (GeoIP, OS, Browser, Page) and stores it in Firestore
 *              using the Batched Bucket Pattern (25 records per doc) to optimize read/write quotas.
 * @license MIT
 */

(function () {
    'use strict';

    // Configuration constants
    const BUCKET_PAGE_SIZE = 25;
    const SESSION_STORAGE_KEY = 'eg1_v_sess';
    const GEO_TIMEOUT_MS = 3500;

    /**
     * Parse OS from user agent string safely.
     * @param {string} ua 
     * @returns {string} Detected OS
     */
    function detectOS(ua) {
        if (/windows nt 10.0/i.test(ua)) return 'Windows 10/11';
        if (/windows nt 6.3/i.test(ua)) return 'Windows 8.1';
        if (/windows nt 6.2/i.test(ua)) return 'Windows 8';
        if (/windows nt 6.1/i.test(ua)) return 'Windows 7';
        if (/windows/i.test(ua)) return 'Windows';
        if (/android/i.test(ua)) return 'Android';
        if (/iphone|ipad|ipod/i.test(ua)) return 'iOS';
        if (/macintosh|mac os x/i.test(ua)) return 'macOS';
        if (/cros/i.test(ua)) return 'ChromeOS';
        if (/linux/i.test(ua)) return 'Linux';
        return 'Unknown OS';
    }

    /**
     * Parse Browser from user agent string safely.
     * @param {string} ua 
     * @returns {string} Detected Browser
     */
    function detectBrowser(ua) {
        if (/edg\//i.test(ua)) return 'Edge';
        if (/samsungbrowser/i.test(ua)) return 'Samsung Internet';
        if (/chrome|crios/i.test(ua) && !/edg\//i.test(ua) && !/opr\//i.test(ua)) return 'Chrome';
        if (/firefox|fxios/i.test(ua)) return 'Firefox';
        if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) return 'Safari';
        if (/opr\//i.test(ua)) return 'Opera';
        return 'Unknown Browser';
    }

    /**
     * Get ISO Date String (YYYY-MM-DD) for daily counter partitioning.
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
     * Fetch GeoIP data with fast timeout and fallback.
     * @returns {Promise<Object>} Geo metadata
     */
    async function fetchGeoLocation() {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), GEO_TIMEOUT_MS);

        try {
            // Primary provider: ipapi.co (provides City, Region, Country, Org/ISP, IP)
            const response = await fetch('https://ipapi.co/json/', { signal: controller.signal });
            clearTimeout(timeoutId);
            if (response.ok) {
                const data = await response.json();
                if (data && data.ip) {
                    return {
                        ip: data.ip || 'Unknown',
                        city: data.city || 'Unknown',
                        region: data.region || 'Unknown',
                        country: data.country_name || data.country || 'Unknown',
                        org: data.org || 'Unknown',
                        postal: data.postal || 'Unknown'
                    };
                }
            }
        } catch {
            // Timeout or network block on primary provider — fallback to ipify
        } finally {
            clearTimeout(timeoutId);
        }

        // Secondary fallback provider for IP only
        try {
            const fbController = new AbortController();
            const fbTimeout = setTimeout(() => fbController.abort(), 2000);
            const ipRes = await fetch('https://api.ipify.org?format=json', { signal: fbController.signal });
            clearTimeout(fbTimeout);
            if (ipRes.ok) {
                const ipData = await ipRes.json();
                return {
                    ip: ipData.ip || 'Unknown',
                    city: 'N/A',
                    region: 'N/A',
                    country: 'N/A',
                    org: 'N/A',
                    postal: 'N/A'
                };
            }
        } catch {
            // Fully offline or blocked
        }

        return {
            ip: 'Unknown',
            city: 'Unknown',
            region: 'Unknown',
            country: 'Unknown',
            org: 'Unknown',
            postal: 'Unknown'
        };
    }

    /**
     * Main tracker execution logic.
     */
    async function runTracker() {
        // 1. Session Deduplication (Log once per browser session)
        try {
            if (sessionStorage.getItem(SESSION_STORAGE_KEY)) {
                return; // Session already recorded
            }
        } catch {
            // Local storage access error (e.g. strict private mode), continue
        }

        // 2. Wait for Firebase SDK and Firestore to be available
        let attempts = 0;
        while ((typeof firebase === 'undefined' || !firebase.firestore) && attempts < 30) {
            await new Promise(res => setTimeout(res, 150));
            attempts++;
        }

        if (typeof firebase === 'undefined' || !firebase.firestore) {
            console.warn('[EG1 Tracker] Firebase Firestore SDK not detected. Skipping tracking.');
            return;
        }

        const db = firebase.firestore();

        // 3. Auto-detect application / project name
        let appName = window.location.hostname || 'eg1.in';
        const currentScript = document.currentScript || document.querySelector('script[src*="visitor-tracker.js"]');
        if (currentScript && currentScript.getAttribute('data-app')) {
            appName = currentScript.getAttribute('data-app');
        }

        // 4. Gather Client Environment Metadata
        const ua = navigator.userAgent || '';
        const os = detectOS(ua);
        const browser = detectBrowser(ua);
        const pageVisited = window.location.pathname + (window.location.search || '');
        const referrer = document.referrer ? new URL(document.referrer, window.location.href).hostname : 'Direct';
        const screenRes = (window.screen && window.screen.width && window.screen.height)
            ? (window.screen.width + 'x' + window.screen.height)
            : 'Unknown';
        const timezone = (typeof Intl !== 'undefined' && Intl.DateTimeFormat)
            ? Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown'
            : 'Unknown';
        const language = navigator.language || 'en';

        // 5. Fetch GeoIP in parallel
        const geo = await fetchGeoLocation();

        // 6. Assemble the Log Record
        const logId = (typeof crypto !== 'undefined' && crypto.randomUUID)
            ? crypto.randomUUID()
            : 'v_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);

        const logEntry = {
            id: logId,
            timestamp: new Date().toISOString(),
            appName: appName,
            pageVisited: pageVisited || '/',
            referrer: referrer,
            ip: geo.ip,
            city: geo.city,
            region: geo.region,
            country: geo.country,
            org: geo.org,
            postal: geo.postal,
            timezone: timezone,
            os: os,
            browser: browser,
            screen: screenRes,
            language: language
        };

        // 7. Write to Firestore via Bucket Transaction
        try {
            const metaRef = db.collection('visitor_analytics').doc('meta');
            const todayStr = getTodayDateString();

            await db.runTransaction(async (transaction) => {
                const metaSnap = await transaction.get(metaRef);

                let currentPage = 1;
                let currentCount = 0;
                let totalVisitors = 0;
                let todayDate = todayStr;
                let todayCount = 0;

                if (metaSnap.exists) {
                    const data = metaSnap.data() || {};
                    currentPage = data.currentPage || 1;
                    currentCount = data.currentCount || 0;
                    totalVisitors = data.totalVisitors || 0;
                    todayDate = data.todayDate || todayStr;
                    todayCount = data.todayCount || 0;
                }

                // Daily visitor counter logic
                if (todayDate !== todayStr) {
                    todayDate = todayStr;
                    todayCount = 1;
                } else {
                    todayCount++;
                }

                totalVisitors++;

                // Check if current page bucket is full
                if (currentCount >= BUCKET_PAGE_SIZE) {
                    currentPage++;
                    currentCount = 0;
                }

                const pageRef = db.collection('visitor_analytics').doc('page_' + currentPage);

                // Append log entry to active page document
                transaction.set(pageRef, {
                    pageNum: currentPage,
                    lastUpdated: new Date().toISOString(),
                    logs: firebase.firestore.FieldValue.arrayUnion(logEntry)
                }, { merge: true });

                // Update meta document
                transaction.set(metaRef, {
                    currentPage: currentPage,
                    currentCount: currentCount + 1,
                    totalVisitors: totalVisitors,
                    todayDate: todayDate,
                    todayCount: todayCount,
                    lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
            });

            // Mark session as logged
            try {
                sessionStorage.setItem(SESSION_STORAGE_KEY, '1');
            } catch {
                // Ignore storage errors
            }

            // Dispatch diagnostic event
            if (typeof window !== 'undefined' && window.dispatchEvent) {
                window.dispatchEvent(new CustomEvent('eg1:visitor-tracked', { detail: logEntry }));
            }
        } catch (err) {
            console.warn('[EG1 Tracker] Logging error (non-critical):', err.message);
            if (typeof window !== 'undefined' && window.dispatchEvent) {
                window.dispatchEvent(new CustomEvent('eg1:visitor-tracker-error', { detail: err.message }));
            }
        }
    }

    // Auto-execute when page is fully ready (non-blocking)
    if (document.readyState === 'complete') {
        setTimeout(runTracker, 200);
    } else {
        window.addEventListener('load', () => setTimeout(runTracker, 200));
    }

    // Expose optional manual API for SPA route changes if needed
    window.EG1Tracker = {
        track: runTracker,
        resetSession: function () {
            try { sessionStorage.removeItem(SESSION_STORAGE_KEY); } catch { /* no-op */ }
        }
    };

})();
