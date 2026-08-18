/**
 * @file visitor-tracker.js
 * @description Standalone, modular, plug-and-play visitor tracking module for EG1 and affiliated webapps (e.g. MChess).
 *              Captures non-invasive telemetry (GeoIP, OS, Browser, Page, Screen) and stores it in Firestore
 *              using the Batched Bucket Pattern (50 records per doc) to optimize read/write quotas.
 *              Includes self-contained dynamic Firebase SDK loader and Notice with Opt-Out consent banner.
 * @license MIT
 */

(function () {
    'use strict';

    // Firebase Public Config (Safe for public client-side telemetry with Firestore Rules enabled)
    const TRACKER_FIREBASE_CONFIG = {
        apiKey: "AIzaSyAdniLkdFBjIGKotTy-JUeXnrbAQSzbiGM",
        authDomain: "eg1-admin.firebaseapp.com",
        projectId: "eg1-admin",
        storageBucket: "eg1-admin.firebasestorage.app",
        messagingSenderId: "130172618069",
        appId: "1:130172618069:web:927b97a603635e58c3dbdc"
    };

    // Configuration constants
    const BUCKET_PAGE_SIZE = 50;
    const SESSION_STORAGE_KEY = 'eg1_v_sess';
    const CONSENT_STORAGE_KEY = 'eg1_analytics_consent';
    const GEO_TIMEOUT_MS = 3500;

    /**
     * Dynamically loads a script if needed.
     * @param {string} src
     * @returns {Promise<void>}
     */
    function loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * Ensures Firebase App and Firestore SDKs are initialized.
     * @returns {Promise<firebase.firestore.Firestore>}
     */
    async function ensureFirebase() {
        if (!window.firebase) {
            await loadScript('https://www.gstatic.com/firebasejs/10.5.0/firebase-app-compat.js');
        }
        if (!window.firebase.firestore) {
            await loadScript('https://www.gstatic.com/firebasejs/10.5.0/firebase-firestore-compat.js');
        }

        if (!window.firebase.apps || window.firebase.apps.length === 0) {
            window.firebase.initializeApp(TRACKER_FIREBASE_CONFIG);
        }

        return window.firebase.firestore();
    }

    /**
     * Shows a non-intrusive, floating consent & opt-out banner if choice is not yet saved.
     */
    function initConsentBanner() {
        try {
            if (localStorage.getItem(CONSENT_STORAGE_KEY)) {
                return; // User has already chosen OK or Decline
            }
        } catch {
            return;
        }

        if (document.getElementById('analytics-consent-banner')) return;

        const banner = document.createElement('div');
        banner.id = 'analytics-consent-banner';
        banner.innerHTML = `
            <div style="
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                width: calc(100% - 32px);
                max-width: 680px;
                background: rgba(15, 23, 42, 0.94);
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
                color: #f8fafc;
                border: 1px solid rgba(255, 255, 255, 0.15);
                border-radius: 12px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
                padding: 14px 20px;
                z-index: 999999;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 16px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                font-size: 13.5px;
                line-height: 1.5;
                box-sizing: border-box;
                animation: eg1BannerSlideUp 0.35s ease-out;
            ">
                <div style="flex: 1; min-width: 220px;">
                    <span>We collect anonymous information to optimize tools/Apps performance.</span>
                    <a href="privacypolicy.html" style="color: #60a5fa; text-decoration: underline; margin-left: 6px; font-weight: 500;">Privacy Policy</a>
                </div>
                <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
                    <button id="analytics-btn-decline" type="button" style="
                        background: rgba(255, 255, 255, 0.08);
                        color: #cbd5e1;
                        border: 1px solid rgba(255, 255, 255, 0.22);
                        padding: 7px 15px;
                        border-radius: 6px;
                        font-size: 13px;
                        font-weight: 500;
                        cursor: pointer;
                        transition: all 0.2s ease;
                    ">Decline</button>
                    <button id="analytics-btn-ok" type="button" style="
                        background: #2563eb;
                        color: #ffffff;
                        border: none;
                        padding: 7px 18px;
                        border-radius: 6px;
                        font-size: 13px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.2s ease;
                    ">OK</button>
                </div>
            </div>
            <style>
                @keyframes eg1BannerSlideUp {
                    from { opacity: 0; transform: translate(-50%, 20px); }
                    to { opacity: 1; transform: translate(-50%, 0); }
                }
                #analytics-btn-decline:hover {
                    background: rgba(239, 68, 68, 0.2) !important;
                    color: #fca5a5 !important;
                    border-color: #ef4444 !important;
                }
                #analytics-btn-ok:hover {
                    background: #1d4ed8 !important;
                }
                @media (max-width: 580px) {
                    #analytics-consent-banner > div {
                        flex-direction: column !important;
                        text-align: center !important;
                        gap: 12px !important;
                        padding: 14px 16px !important;
                    }
                    #analytics-consent-banner > div > div:last-child {
                        width: 100% !important;
                        justify-content: center !important;
                    }
                }
            </style>
        `;

        document.body.appendChild(banner);

        const okBtn = document.getElementById('analytics-btn-ok');
        const declineBtn = document.getElementById('analytics-btn-decline');

        if (okBtn) {
            okBtn.addEventListener('click', function () {
                try { localStorage.setItem(CONSENT_STORAGE_KEY, 'granted'); } catch {}
                banner.remove();
            });
        }

        if (declineBtn) {
            declineBtn.addEventListener('click', function () {
                try {
                    localStorage.setItem(CONSENT_STORAGE_KEY, 'denied');
                    sessionStorage.removeItem(SESSION_STORAGE_KEY);
                } catch {}
                banner.remove();
            });
        }
    }

    /**
     * Parse OS from user agent string safely.
     * @param {string} ua 
     * @returns {string} Detected OS
     */
    function detectOS(ua) {
        if (/windows phone/i.test(ua)) return 'Windows Phone';
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
        if (/edg\//i.test(ua)) return 'Microsoft Edge';
        if (/samsungbrowser/i.test(ua)) return 'Samsung Internet';
        if (/opr\//i.test(ua) || /opera/i.test(ua)) return 'Opera';
        if (/chrome|crios/i.test(ua) && !/edg\//i.test(ua) && !/opr\//i.test(ua)) return 'Chrome';
        if (/firefox|fxios/i.test(ua)) return 'Firefox';
        if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) return 'Safari';
        if (/msie|trident/i.test(ua)) return 'Internet Explorer';
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
            // Primary provider: ipapi.co (provides City, Region, Country, Org/ISP, IP, Postal)
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
                        org: data.org || data.asn || 'Unknown',
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
                    city: 'Unknown',
                    region: 'Unknown',
                    country: 'Unknown',
                    org: 'Unknown',
                    postal: 'Unknown'
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
        // 1. Opt-out & Consent Check
        try {
            if (localStorage.getItem(CONSENT_STORAGE_KEY) === 'denied') {
                return; // User has chosen to decline telemetry
            }
        } catch {
            // Local storage access error, proceed
        }

        // 2. Session Deduplication (Log once per browser session)
        try {
            if (sessionStorage.getItem(SESSION_STORAGE_KEY)) {
                return; // Session already recorded
            }
        } catch {
            // Local storage access error, continue
        }

        // 3. Gather Client Environment Metadata
        const ua = navigator.userAgent || '';
        const os = detectOS(ua);
        const browser = detectBrowser(ua);
        const pageVisited = window.location.pathname + (window.location.search || '');
        
        let referrer = 'Direct';
        if (document.referrer) {
            try {
                referrer = new URL(document.referrer, window.location.href).hostname || 'Direct';
            } catch {
                referrer = 'Unknown';
            }
        }

        const screenRes = (window.screen && window.screen.width && window.screen.height)
            ? (window.screen.width + 'x' + window.screen.height)
            : 'Unknown';
        const timezone = (typeof Intl !== 'undefined' && Intl.DateTimeFormat)
            ? Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown'
            : 'Unknown';
        const language = navigator.language || 'en';

        // 4. Auto-detect application / project name
        let appName = window.location.hostname || 'eg1.in';
        const currentScript = document.currentScript || document.querySelector('script[src*="visitor-tracker.js"]');
        if (currentScript && currentScript.getAttribute('data-app')) {
            appName = currentScript.getAttribute('data-app');
        }

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
            const db = await ensureFirebase();
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

                    if (data.todayDate === todayStr) {
                        todayCount = data.todayCount || 0;
                    } else {
                        todayDate = todayStr;
                        todayCount = 0;
                    }
                }

                // Check if current page bucket is full (50 records per page)
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
                    totalVisitors: totalVisitors + 1,
                    todayDate: todayDate,
                    todayCount: todayCount + 1,
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

    // Auto-execute when page is ready (non-blocking)
    function onPageReady() {
        initConsentBanner();
        setTimeout(runTracker, 400);
    }

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        onPageReady();
    } else {
        window.addEventListener('DOMContentLoaded', onPageReady);
    }

    // Expose manual API for SPA route changes, opt-in/opt-out toggling, or diagnostic resets
    window.EG1Tracker = {
        track: runTracker,
        resetSession: function () {
            try { sessionStorage.removeItem(SESSION_STORAGE_KEY); } catch { /* no-op */ }
        },
        optOut: function () {
            try {
                localStorage.setItem(CONSENT_STORAGE_KEY, 'denied');
                sessionStorage.removeItem(SESSION_STORAGE_KEY);
            } catch {}
        },
        optIn: function () {
            try {
                localStorage.setItem(CONSENT_STORAGE_KEY, 'granted');
                runTracker();
            } catch {}
        },
        showConsentBanner: function () {
            try { localStorage.removeItem(CONSENT_STORAGE_KEY); } catch {}
            initConsentBanner();
        }
    };

})();
