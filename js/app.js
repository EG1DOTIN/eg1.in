/**
 * Global application configuration and utility functions.
 * Contains methods to load external JSON data and parse URL parameters.
 */
var AppConfig = {
  dataPath: "data/",
  imagePath: "img/",

  // Load JSON data asynchronously
  loadData: async function (filename) {
    try {
      const response = await fetch(this.dataPath + filename);
      return await response.json();
    } catch (e) {
      console.error("Error loading data from " + filename + ":", e);
      return null;
    }
  },

  // Get query parameter from URL
  getQueryParam: function (param) {
    var searchParams = new URLSearchParams(window.location.search);
    return searchParams.get(param);
  },
};

/**
 * Checks if the Firebase SDK and Firestore database instances are initialized.
 * @returns {boolean} True if Firebase is ready, false otherwise.
 */
function isFirebaseReady() {
  try {
    if (typeof firebase === "undefined") {
      console.log("Waiting for Firebase SDK...");
      return false;
    }
    if (typeof db === "undefined") {
      console.log("Waiting for Firestore db...");
      return false;
    }
    console.log("✓ Firebase is ready");
    return true;
  } catch (e) {
    console.error("Error checking Firebase readiness:", e);
    return false;
  }
}

/**
 * Waits for Firebase to initialize before executing a callback.
 * Checks readiness recursively with a timeout.
 * @param {Function} callback - The function to execute once Firebase is ready.
 * @param {number} attempts - Current attempt count (default: 0).
 * @param {number} maxAttempts - Maximum attempts before forcing execution (default: 100).
 */
function waitForFirebase(callback, attempts = 0, maxAttempts = 100) {
  if (isFirebaseReady()) {
    callback();
  } else if (attempts < maxAttempts) {
    setTimeout(() => waitForFirebase(callback, attempts + 1, maxAttempts), 100);
  } else {
    console.error("Firebase failed to initialize after " + (maxAttempts * 100 / 1000) + " seconds");
    console.warn("Attempting to proceed anyway...");
    if (typeof db !== "undefined") {
      console.log("db object is now available, proceeding...");
      callback();
    } else {
      console.error("Cannot proceed - db is still undefined. Check Firebase configuration and network.");
      callback();
    }
  }
}

/**
 * Cache controller for retrieving and storing application data.
 *
 * This helper centralizes data access for products, news, and blogs.
 * Blog content is loaded directly from Markdown (.md) files in data/blog/
 * with zero Firestore database dependencies.
 */
var DataCache = {
  products: null,
  news: null,
  blogs: null,
  pages: null,
  lastError: null,
  CACHE_TTL_DEV: 60000,       // 60 seconds TTL on localhost / dev
  CACHE_TTL_PROD: 3600000,    // 1 hour TTL in production
  lastFetchSource: {}, // Stores 'network' or 'cache' for diagnostics

  isDev: function () {
    try {
      var host = window.location.hostname;
      return host === 'localhost' || host === '127.0.0.1' || window.location.protocol === 'file:';
    } catch (e) {
      return false;
    }
  },

  getCacheTTL: function () {
    return this.isDev() ? this.CACHE_TTL_DEV : this.CACHE_TTL_PROD;
  },

  _getPersistentCache: function (key) {
    try {
      // Force refresh on demand via URL query param (e.g. ?refresh=1 or ?nocache=1)
      if (window.location.search.indexOf('nocache') !== -1 || window.location.search.indexOf('refresh') !== -1) {
        return null;
      }
      var data = localStorage.getItem(key);
      var time = localStorage.getItem(key + '_time');
      var ttl = this.getCacheTTL();
      if (data && time && (Date.now() - parseInt(time, 10) < ttl)) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn("LocalStorage read error for " + key + ":", e);
    }
    return null;
  },

  _setPersistentCache: function (key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      localStorage.setItem(key + '_time', Date.now().toString());
    } catch (e) {
      console.warn("LocalStorage write error for " + key + ":", e);
    }
  },

  BLOGS_CACHE_KEY: 'eg1_direct_md_cache_v5',

  clearCache: function (type) {
    try {
      if (!type || type === 'blogs') {
        this.blogs = null;
        localStorage.removeItem(this.BLOGS_CACHE_KEY);
        localStorage.removeItem('eg1_direct_md_cache');
        localStorage.removeItem('eg1_direct_md_cache_v2');
        localStorage.removeItem('eg1_direct_md_cache_v3');
        localStorage.removeItem('eg1_direct_md_cache_v4');
        localStorage.removeItem('eg1_blogs_cache_v2');
      }
      if (!type || type === 'products') {
        this.products = null;
        localStorage.removeItem('eg1_products_cache');
        localStorage.removeItem('eg1_products_cache_time');
      }
      if (!type || type === 'pages') {
        this.pages = null;
        localStorage.removeItem('eg1_pages_cache');
        localStorage.removeItem('eg1_pages_cache_time');
      }
      if (!type || type === 'news') {
        this.news = null;
        localStorage.removeItem('eg1_news_cache');
        localStorage.removeItem('eg1_news_cache_time');
      }
      console.log("[DataCache] Cleared cache for type:", type || 'ALL');
    } catch (e) {
      console.error("[DataCache] Error clearing cache:", e);
    }
  },

  /**
   * Extracts 'owner/repo' from a URL string if it points to GitHub.
   */
  extractGithubRepo: function (url) {
    if (!url || typeof url !== 'string') return null;
    const match = url.match(/github\.com\/([^\/]+)\/([^\/\s#?]+)/i);
    if (match) {
      const owner = match[1];
      let repo = match[2];
      if (repo.endsWith('.git')) repo = repo.slice(0, -4);
      const reserved = ['features', 'about', 'topics', 'collections', 'site', 'orgs', 'users', 'pricing', 'explore'];
      if (reserved.includes(owner.toLowerCase())) return null;
      return owner + '/' + repo;
    }
    return null;
  },

  /**
   * Finds any GitHub repository referenced in a product (in button1, button2, or webapp_link).
   */
  findGithubRepoInProduct: function (product) {
    if (!product) return null;
    const urls = [];
    if (product.button1 && typeof product.button1 === 'object') {
      Object.values(product.button1).forEach(function (v) { if (typeof v === 'string') urls.push(v); });
    } else if (typeof product.button1 === 'string') {
      urls.push(product.button1);
    }
    if (product.button2 && typeof product.button2 === 'object') {
      Object.values(product.button2).forEach(function (v) { if (typeof v === 'string') urls.push(v); });
    } else if (typeof product.button2 === 'string') {
      urls.push(product.button2);
    }
    if (product.webapp_link && typeof product.webapp_link === 'string') {
      urls.push(product.webapp_link);
    }

    for (var i = 0; i < urls.length; i++) {
      var repo = this.extractGithubRepo(urls[i]);
      if (repo) return repo;
    }
    return null;
  },

  /**
   * Asynchronously fetches latest release/tag version from GitHub with persistent caching.
   * TTL: 1 hour (3600 seconds) to avoid GitHub rate limits.
   */
  getGithubVersion: async function (repo) {
    if (!repo) return null;
    const cacheKey = 'eg1_gh_version_' + repo.replace(/[^a-zA-Z0-9_]/g, '_');
    const cached = this._getPersistentCache(cacheKey);
    if (cached && typeof cached === 'string') {
      return cached;
    }

    try {
      // 1. Try /releases/latest
      const res = await fetch('https://api.github.com/repos/' + repo + '/releases/latest', {
        headers: { 'Accept': 'application/vnd.github.v3+json' }
      });
      if (res.ok) {
        const data = await res.json();
        let tag = data.tag_name || data.name;
        if (tag) {
          tag = tag.trim().replace(/^v/i, '');
          this._setPersistentCache(cacheKey, tag);
          return tag;
        }
      }

      // 2. Fallback to /tags if no official release exists
      const tagsRes = await fetch('https://api.github.com/repos/' + repo + '/tags?per_page=1', {
        headers: { 'Accept': 'application/vnd.github.v3+json' }
      });
      if (tagsRes.ok) {
        const tagsData = await tagsRes.json();
        if (Array.isArray(tagsData) && tagsData.length > 0 && tagsData[0].name) {
          const tag = tagsData[0].name.trim().replace(/^v/i, '');
          this._setPersistentCache(cacheKey, tag);
          return tag;
        }
      }
    } catch (e) {
      console.warn('[DataCache] Could not fetch GitHub version for ' + repo + ':', e.message);
    }
    return null;
  },

  /**
   * Resolves the version for a product synchronously:
   * 1. If "version" is an object with "fetch-github": "true", checks for cached GitHub version.
   *    If not cached or fetch-github is false, uses "version-string" (e.g. "3.7.1").
   * 2. If "version" is a plain string/number, uses that value.
   * 3. If no "version" key in the JSON, defaults to "1.0.0".
   */
  resolveProductVersion: function (product) {
    if (!product || product.version === undefined || product.version === null) {
      return '1.0.0';
    }

    // 1. If version is an object: { "version-string": "3.7.1", "fetch-github": "true" }
    if (typeof product.version === 'object') {
      const isFetchGithub = product.version['fetch-github'] === true ||
        String(product.version['fetch-github']).toLowerCase() === 'true' ||
        product.version.fetchGithub === true ||
        String(product.version.fetchGithub).toLowerCase() === 'true';

      const fallbackString = product.version['version-string'] || product.version.versionString || '1.0.0';

      if (isFetchGithub) {
        const repo = this.findGithubRepoInProduct(product);
        if (repo) {
          const cacheKey = 'eg1_gh_version_' + repo.replace(/[^a-zA-Z0-9_]/g, '_');
          const cached = this._getPersistentCache(cacheKey);
          if (cached && typeof cached === 'string' && cached.trim().length > 0) {
            return cached.trim();
          }
        }
      }
      return String(fallbackString || '1.0.0').trim();
    }

    // 2. If version is a plain string or number
    if (typeof product.version === 'string' && product.version.trim().length > 0) {
      return product.version.trim();
    }
    if (typeof product.version === 'number') {
      return String(product.version);
    }

    // 3. Default fallback
    return '1.0.0';
  },

  /**
   * Background synchronizer that fetches live GitHub versions for products
   * where product.version['fetch-github'] is set to true.
   */
  syncGithubVersions: async function (products) {
    if (!products || !Array.isArray(products)) return;
    const self = this;
    for (var i = 0; i < products.length; i++) {
      (async function (prod) {
        if (!prod || !prod.version || typeof prod.version !== 'object') return;
        var isFetchGithub = prod.version['fetch-github'] === true ||
          String(prod.version['fetch-github']).toLowerCase() === 'true' ||
          prod.version.fetchGithub === true ||
          String(prod.version.fetchGithub).toLowerCase() === 'true';
        if (!isFetchGithub) return;

        var repo = self.findGithubRepoInProduct(prod);
        if (!repo) return;
        var version = await self.getGithubVersion(repo);
        if (version) {
          prod.resolvedVersion = version;
          var elements = document.querySelectorAll('[data-product-version-id="' + prod.id + '"]');
          elements.forEach(function (el) {
            if (el.tagName === 'H5' && el.classList.contains('home-product-version')) {
              el.textContent = 'Version ' + version;
            } else if (el.tagName === 'SPAN') {
              el.textContent = version;
            } else {
              el.textContent = 'Version: ' + version;
            }
          });
        }
      })(products[i]);
    }
  },

  getProducts: async function (forceRefresh) {
    if (this.products && !forceRefresh) {
      this.lastFetchSource.products = 'memory';
      return this.products;
    }

    if (!forceRefresh) {
      var cached = this._getPersistentCache('eg1_products_cache');
      if (cached) {
        this.products = cached;
        this.lastFetchSource.products = 'localStorage (0 reads)';
        return this.products;
      }
    }

    try {
      console.log("[DataCache] Fetching products/apps from static JSON (data/apps.json, 0 Firestore Reads)...");
      const response = await fetch("data/apps.json");
      if (!response.ok) {
        throw new Error("HTTP " + response.status + " while fetching data/apps.json");
      }
      var allProducts = await response.json();
      this.products = (allProducts || []).filter(function (p) {
        return p.active === "1" || p.active === 1 || p.active === true || !p.hasOwnProperty('active');
      });
      this._setPersistentCache('eg1_products_cache', this.products);
      this.lastFetchSource.products = 'static JSON (0 Firestore reads)';
    } catch (e) {
      this.lastError = e;
      console.error("Error fetching apps from data/apps.json:", e.message);
      this.products = [];
    }
    return this.products;
  },

  getNews: async function (forceRefresh) {
    if (this.news && !forceRefresh) {
      this.lastFetchSource.news = 'memory';
      return this.news;
    }

    if (!forceRefresh) {
      var cached = this._getPersistentCache('eg1_news_cache');
      if (cached) {
        this.news = cached;
        this.lastFetchSource.news = 'localStorage (0 reads)';
        return this.news;
      }
    }

    try {
      console.log("[DataCache] Fetching news from static JSON (data/website_content.json, 0 Firestore Reads)...");
      const response = await fetch("data/website_content.json");
      if (!response.ok) {
        throw new Error("HTTP " + response.status + " while fetching data/website_content.json");
      }
      const data = await response.json();
      const pages = (data && data.pages) ? data.pages : (data || {});
      this.pages = pages;
      this._setPersistentCache('eg1_pages_cache', this.pages);
      if (pages.homepage) {
        this.news = [{ id: "1", description: pages.homepage.content || "", title: pages.homepage.title || "" }];
        this._setPersistentCache('eg1_news_cache', this.news);
      } else {
        this.news = [];
      }
      this.lastFetchSource.news = 'static JSON (0 Firestore reads)';
    } catch (e) {
      this.lastError = e;
      console.error("Error fetching news from data/website_content.json:", e.message);
      this.news = [];
    }
    return this.news;
  },

  getPageContent: async function (pageId, forceRefresh) {
    if (this.pages && this.pages[pageId] && !forceRefresh) {
      this.lastFetchSource.pages = 'memory';
      return this.pages[pageId];
    }

    if (!forceRefresh) {
      var cached = this._getPersistentCache('eg1_pages_cache');
      if (cached) {
        this.pages = cached;
        this.lastFetchSource.pages = 'localStorage (0 reads)';
        return this.pages[pageId] || null;
      }
    }

    try {
      console.log("[DataCache] Fetching pages from static JSON (data/website_content.json, 0 Firestore Reads)...");
      const response = await fetch("data/website_content.json");
      if (!response.ok) {
        throw new Error("HTTP " + response.status + " while fetching data/website_content.json");
      }
      const data = await response.json();
      this.pages = (data && data.pages) ? data.pages : (data || {});
      this._setPersistentCache('eg1_pages_cache', this.pages);
      this.lastFetchSource.pages = 'static JSON (0 Firestore reads)';
    } catch (e) {
      console.error("Error fetching pages from data/website_content.json:", e.message);
      this.pages = {};
    }
    return this.pages[pageId] || null;
  },

  /**
   * Loads all blog posts directly from Markdown (.md) files in data/blog/
   * with zero Firestore read operations.
   */
  getBlogs: async function (forceRefresh) {
    if (this.blogs && this.blogs.length > 0 && !forceRefresh) {
      this.lastFetchSource.blogs = 'memory (0 reads)';
      return this.blogs;
    }

    if (!forceRefresh) {
      var cached = this._getPersistentCache('eg1_direct_md_cache_v5');
      if (cached && Array.isArray(cached) && cached.length > 0) {
        this.blogs = cached;
        this.lastFetchSource.blogs = 'localStorage (0 reads)';
        return this.blogs;
      }
    }

    if (typeof MarkdownStore !== 'undefined' && typeof MarkdownStore.fetchAllBlogs === 'function') {
      try {
        this.blogs = await MarkdownStore.fetchAllBlogs();
        this.lastFetchSource.blogs = 'direct markdown (.md, 0 Firestore reads)';
        return this.blogs;
      } catch (e) {
        console.error("Error loading blogs from MarkdownStore:", e);
      }
    }

    return this.blogs || [];
  },

  getProductById: async function (id) {
    var products = await this.getProducts();
    return products.find((p) => p.id == id);
  },

  /**
   * Resolves a blog by the route identifier used in blog.html?id=<id>.
   */
  getBlogById: async function (id) {
    var blogs = await this.getBlogs();
    return blogs.find((b) => b.id == id);
  },

  filterProductsByCategory: async function (category) {
    var products = await this.getProducts();
    if (category === "all") return products;
    return products.filter((p) => p.category === category);
  },

  filterBlogsByCategory: async function (category) {
    var blogs = await this.getBlogs();
    if (category === "all") return blogs;
    var catLower = String(category).toLowerCase();
    return blogs.filter(function (b) {
      return (b.tags && Array.isArray(b.tags) && b.tags.some(function (t) { return String(t).toLowerCase() === catLower; })) ||
        (b.category && String(b.category).toLowerCase() === catLower);
    });
  },
};

/**
 * Default SVG data URI placeholder for products and blogs when no image is specified.
 */
var DEFAULT_PLACEHOLDER_ICON = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%23050814'/><text x='50%' y='62%' font-family='serif' font-size='42' fill='%23ffffff' text-anchor='middle'>EG1</text></svg>";
window.DEFAULT_PLACEHOLDER_ICON = DEFAULT_PLACEHOLDER_ICON;

/**
 * Utility functions for rendering dynamic HTML components.
 * Contains methods to generate HTML strings for products and blogs.
 */
var RenderHelpers = {
  DEFAULT_ICON: DEFAULT_PLACEHOLDER_ICON,

  /**
   * Parses button configuration from product JSON.
   * Supports formats like:
   *   "button1": { "VIEW DETAILS": "https://mchess.eg1.in", "sameTab": "false" }
   *   "button2": { "DOWNLOAD": "https://eg1.in/anydownload", "sameTab": "true" }
   *   "button1": { label: "OPEN APP", url: "https://...", sameTab: false, icon: "icon icon-play" }
   *   "button1": "https://example.com"
   */
  parseButton: function (btnConfig, fallbackLabel, fallbackUrl, fallbackSameTab, defaultBtnClass) {
    if (!btnConfig && !fallbackUrl) return null;

    if (!btnConfig) {
      if (!fallbackUrl || fallbackUrl === "#") return null;
      const isInternal = (typeof fallbackSameTab === "boolean")
        ? fallbackSameTab
        : (fallbackUrl.startsWith("#") || fallbackUrl.startsWith("/") || !fallbackUrl.startsWith("http"));
      return {
        label: fallbackLabel || "VIEW DETAILS",
        url: fallbackUrl,
        sameTab: isInternal,
        target: isInternal ? "" : 'target="_blank" rel="noopener noreferrer"',
        icon: (fallbackLabel || "").toUpperCase().includes("DOWN") ? "icon icon-download" : "icon icon-newspaper-o",
        btnClass: defaultBtnClass || "btn btn-primary"
      };
    }

    if (typeof btnConfig === "string") {
      const isInternal = btnConfig.startsWith("#") || btnConfig.startsWith("/") || !btnConfig.startsWith("http");
      return {
        label: fallbackLabel || "VIEW DETAILS",
        url: btnConfig,
        sameTab: isInternal,
        target: isInternal ? "" : 'target="_blank" rel="noopener noreferrer"',
        icon: (fallbackLabel || "").toUpperCase().includes("DOWN") ? "icon icon-download" : "icon icon-newspaper-o",
        btnClass: defaultBtnClass || "btn btn-primary"
      };
    }

    let label = "";
    let url = "";
    let sameTab = false;
    let icon = "";
    let customClass = "";

    if (btnConfig.hasOwnProperty("sameTab")) {
      sameTab = btnConfig.sameTab === true || String(btnConfig.sameTab).toLowerCase() === "true";
    } else if (btnConfig.hasOwnProperty("sametab")) {
      sameTab = btnConfig.sametab === true || String(btnConfig.sametab).toLowerCase() === "true";
    }

    if (btnConfig.hasOwnProperty("icon")) {
      icon = btnConfig.icon;
    }
    if (btnConfig.hasOwnProperty("class") || btnConfig.hasOwnProperty("btnClass")) {
      customClass = btnConfig.class || btnConfig.btnClass;
    }

    if (btnConfig.label && btnConfig.url) {
      label = btnConfig.label;
      url = btnConfig.url;
    } else {
      const metadataKeys = ["sametab", "target", "icon", "class", "btnclass", "rel"];
      for (const [k, v] of Object.entries(btnConfig)) {
        if (!metadataKeys.includes(k.toLowerCase()) && typeof v === "string") {
          label = k;
          url = v;
          break;
        }
      }
    }

    if (!url && fallbackUrl) url = fallbackUrl;
    if (!label && fallbackLabel) label = fallbackLabel;
    if (!url) return null;

    const target = sameTab ? "" : 'target="_blank" rel="noopener noreferrer"';

    if (icon) {
      icon = icon.trim();
      if (!icon.includes(" ") && !icon.startsWith("fa-") && !icon.startsWith("icon-")) {
        icon = "icon icon-" + icon;
      } else if (!icon.includes(" ") && icon.startsWith("icon-")) {
        icon = "icon " + icon;
      }
    } else {
      const upperLabel = (label || "").toUpperCase();
      if (upperLabel.includes("DOWNLOAD") || upperLabel.includes("DOWN")) {
        icon = "icon icon-download";
      } else if (upperLabel.includes("KEY") || upperLabel.includes("REGISTER")) {
        icon = "icon icon-key";
      } else if (upperLabel.includes("VIEW") || upperLabel.includes("DETAIL") || upperLabel.includes("READ")) {
        icon = "icon icon-newspaper-o";
      } else if (upperLabel.includes("PLAY") || upperLabel.includes("GAME") || upperLabel.includes("CHESS")) {
        icon = "icon icon-gamepad";
      } else if (upperLabel.includes("OPEN") || upperLabel.includes("VISIT") || upperLabel.includes("WEB")) {
        icon = "icon icon-external-link";
      }
      else if (upperLabel.includes("GITHUB") || upperLabel.includes("CODE") || upperLabel.includes("SOURCE")) {
        icon = "icon icon-github";
      }
      else {
        icon = "icon icon-arrow-right";
      }
    }

    return {
      label: label || "VIEW DETAILS",
      url: url,
      sameTab: sameTab,
      target: target,
      icon: icon,
      btnClass: customClass || defaultBtnClass || "btn btn-primary"
    };
  },

  renderProductCard: function (product, isHomepage) {
    const iconUrl = product.icon || product.imageUrl || DEFAULT_PLACEHOLDER_ICON;
    const productName = product.product_name || product.name || "Unknown Product";
    const version = DataCache.resolveProductVersion(product);
    const shortDesc = product.short_description || product.description || "";
    const paidVersion = product.paid_version || "false";
    const productType = product.product_type || "Desktop App";
    const webappLink = product.webapp_link || "#";

    // Resolve Button 1 (Left / Primary Action)
    const defaultDetailLink = (productType === "WebApp" && webappLink) ? webappLink : `apps.html?id=${product.id}`;
    const defaultDetailSameTab = productType !== "WebApp";
    const btn1 = this.parseButton(
      product.button1,
      "VIEW DETAILS",
      defaultDetailLink,
      defaultDetailSameTab,
      "btn btn-primary btn-read"
    );

    // Resolve Button 2 (Right / Secondary Action)
    let fallbackBtn2Url = null;
    let fallbackBtn2Label = "DOWNLOAD";
    let fallbackBtn2Class = "btn btn-success btn-down";
    if (product.button2 !== undefined) {
      fallbackBtn2Url = null;
    } else if (paidVersion === "true") {
      fallbackBtn2Url = `get-registration-key.html?id=${product.id}`;
      fallbackBtn2Label = "Get Key";
      fallbackBtn2Class = "btn btn-primary btn-down";
    } else if (product.show_download === "true" || product.show_download === undefined) {
      fallbackBtn2Url = `download.html?id=${product.id}`;
      fallbackBtn2Label = "DOWNLOAD";
      fallbackBtn2Class = "btn btn-success btn-down";
    }

    const btn2 = this.parseButton(
      product.button2,
      fallbackBtn2Label,
      fallbackBtn2Url,
      true,
      fallbackBtn2Class
    );

    if (isHomepage) {
      return `
                <div class="col-md-4 col-sm-4 col-xs-12">
                    <div class="box box-widget home-product-card box-shadow-bottom">
                        <div class="home-product-header">
                            <img src="${iconUrl}" class="home-product-icon" alt="${productName}" />
                            <div class="home-product-title-wrap">
                                <h4 class="home-product-title">${productName}</h4>
                                <h5 class="home-product-version" data-product-version-id="${product.id}">Version ${version}</h5>
                            </div>
                        </div>
                        <div class="home-product-body">
                            <p class="home-product-desc">${shortDesc}</p>
                        </div>
                        <div class="home-product-actions">
                            ${btn1 ? `<a href="${btn1.url}" ${btn1.target} class="${btn1.btnClass}"><i class="${btn1.icon}"></i>&nbsp;${btn1.label}</a>` : ""}
                            ${btn2 ? `<a href="${btn2.url}" ${btn2.target} class="${btn2.btnClass}"><i class="${btn2.icon}"></i>&nbsp;${btn2.label}</a>` : ""}
                        </div>
                    </div>
                </div>
            `;
    } else {
      return `
                <div class="row">
                    <div class="col-md-12 margin-bottom">
                        <div class="our-product">
                            <div class="row">
                                <div class="col-md-2">
                                    <div class="product-icon">
                                        <img src="${iconUrl}" width="55px" />
                                    </div>
                                </div>
                                <div class="col-md-10 border">
                                    <div class="row">
                                        <div class="col-md-12">
                                            <a href="${btn1 ? btn1.url : '#'}" ${btn1 ? btn1.target : ''} class="link-name">${productName}</a>
                                        </div>
                                        <div class="col-md-12 left">
                                            <h5>Version:&nbsp;<span data-product-version-id="${product.id}">${version}</span></h5>
                                        </div>
                                    </div>
                                    <div class="row">
                                        <div class="col-md-12 left" style="text-align: left;">
                                            <p>${shortDesc}</p>
                                        </div>
                                    </div>
                                    <div class="row">
                                        <div class="col-md-5">
                                            ${btn1 ? `<a href="${btn1.url}" ${btn1.target} class="${btn1.btnClass}"><i class="${btn1.icon}"></i>&nbsp;${btn1.label}</a>` : ""}
                                        </div>
                                        <div class="col-md-7">
                                            ${btn2 ? `<a href="${btn2.url}" ${btn2.target} class="${btn2.btnClass} margin-r-5"><i class="${btn2.icon}"></i>&nbsp;${btn2.label}</a>` : ""}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
    }
  },

  renderBlogCard: function (blog) {
    const imageUrl = blog.output_image || blog.imageUrl || DEFAULT_PLACEHOLDER_ICON;
    const title = blog.heading || blog.title || "Untitled";
    const category = blog.category || (blog.tags && blog.tags.length > 0 ? blog.tags[0] : "Uncategorized");
    const author = blog.author || "Admin";
    const description = blog.short_description || blog.description || "";
    const content = blog.full_description || blog.content || "";
    const endDescription = blog.end_description || "";

    return `
            <div class="row">
                <div class="col-md-12 margin-bottom">
                    <div class="our-product">
                        <div class="row">
                            <div class="col-md-12">
                                <div class="row">
                                    <div class="col-lg-10 col-md-10 col-sm-12 col-xs-12">
                                        <img src="${imageUrl}" alt="${title}" loading="lazy" style="width: 100%;" />
                                    </div>
                                    <div class="col-lg-12 col-md-12 col-sm-12 col-xs-12 left">
                                        <h3 class="text-blue"><a href="blog.html?id=${blog.id}">${title}</a></h3>
                                        <p>
                                            <i class="icon icon-list-alt"></i>&nbsp;${category}
                                            | <i class="icon icon-user"></i>&nbsp;${author}
                                        </p>
                                    </div>
                                </div>
                                <div class="row mrgin-top20">
                                    <div class="col-md-12 left" style="text-align: left;">
                                        ${description}
                                    </div>
                                </div>
                                <div class="row mrgin-top20">
                                    <div class="col-md-12">
                                        ${content
        ? `
                                        <div class='ai-blog-content' style='padding: 12px 10px; background: transparent; text-align: left;'>
                                            <div style="word-break: break-word; overflow-wrap: break-word;">${content}</div>
                                        </div>
                                        `
        : ""
      }
                                    </div>
                                </div>
                                ${endDescription ? `
                                <div class="row mrgin-top20">
                                    <div class="col-md-12 left" style="text-align: left;">
                                        ${endDescription}
                                    </div>
                                </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
  },

  renderBlogCardGrid: function (blog) {
    const imageUrl = blog.output_image || blog.imageUrl || DEFAULT_PLACEHOLDER_ICON;
    const title = blog.heading || blog.title || "Untitled";
    const category = blog.category || (blog.tags && blog.tags.length > 0 ? blog.tags[0] : "Uncategorized");
    const author = blog.author || "Admin";
    const rawDesc = blog.short_description || blog.description || "";

    // Strip HTML tags BEFORE truncating — cutting through an open tag like
    // "<h3>What is C</h3><p>C is a computer..." leaves unclosed tags in the
    // card which explode the card height and break the grid layout entirely.
    const plainDesc = rawDesc.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const shortDesc = plainDesc.length > 120 ? plainDesc.substring(0, 120) + '...' : plainDesc;

    return `
            <div class="col-md-4 margin-bottom blog-item-container">
                <div class="our-product blogs blog-grid-card" data-url="blog.html?id=${blog.id}" role="link" tabindex="0" style="cursor:pointer;">
                    <div class="row">
                        <div class="col-md-12 left">
                            <div class="blogimg">
                                <a href="blog.html?id=${blog.id}">
                                    <img src="${imageUrl}" alt="${title}" loading="lazy" style="width: 100%; height: 200px; object-fit: cover;" />
                                </a>
                            </div>
                            <div class="blogbody">
                                <a href="blog.html?id=${blog.id}">
                                    <h3 class="blogs-title">${title}</h3>
                                    <p>
                                      <small>
                                        <i class="icon icon-list-alt"></i>&nbsp;${category}  
                                        <!-- | <i class="icon icon-user"></i>&nbsp;${author} -->
                                      </small>
                                    </p>
                                    <div class="shortcontent">${shortDesc}</div>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
  },
  // List-style card matching the reference site (eg1.in/Blogs.aspx)
  // Used for categories where blogs have content/diagram images (not portrait thumbnails)
  renderBlogListCard: function (blog) {
    const imageUrl = blog.output_image || blog.imageUrl || DEFAULT_PLACEHOLDER_ICON;
    const title = blog.heading || blog.title || 'Untitled';
    const category = blog.category || (blog.tags && blog.tags.length > 0 ? blog.tags[0] : 'Uncategorized');
    const author = blog.author || 'Admin';
    const description = blog.short_description || blog.description || '';
    const shortDesc = description.length > 150
      ? description.substring(0, 150) + '...'
      : description;

    return `
      <a href="blog.html?id=${blog.id}" class="blog-list-card">
        <div class="blog-list-image">
          <img src="${imageUrl}" alt="${title}" loading="lazy" />
        </div>
        <div class="blog-list-body">
          <h3 class="blog-list-title">${title}</h3>
          <p class="blog-list-category">
            <i class="icon icon-list-alt"></i> ${category}
          </p>
          ${shortDesc ? `<p class="blog-list-description">${shortDesc}</p>` : ''}
          <div class="blog-list-footer">
            <span class="blog-list-author"><i class="icon icon-user"></i> ${author}</span>
          </div>
        </div>
      </a>`;
  },
};
// ---------------------------------------------------------------------------
// Shared: Code block syntax highlighting + copy button
// Used by both blog.html
// ---------------------------------------------------------------------------
function initializeCodeBlocks() {
  document.querySelectorAll('.ai-blog-content pre').forEach(pre => {
    const code = pre.querySelector('code');
    if (!code) return;

    // Syntax highlighting
    if (typeof hljs !== 'undefined' && typeof hljs.highlightElement === 'function') {
      hljs.highlightElement(code);
    }

    // Prevent duplicate initialization
    if (pre.parentElement.classList.contains('code-wrapper'))
      return;

    // Detect language
    let language = "Code";
    pre.classList.forEach(cls => {
      if (cls.startsWith("language-")) {
        language = cls.replace("language-", "");
      }
    });

    // Wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'code-wrapper';

    // Header
    const header = document.createElement('div');
    header.className = 'code-header';

    // Language label
    const lang = document.createElement('span');
    lang.innerText = language;

    // Copy button
    const copyBtn = document.createElement('button');
    copyBtn.innerText = 'Copy';
    copyBtn.onclick = () => {
      const text = code.innerText;
      navigator.clipboard.writeText(text).then(() => {
        copyBtn.innerText = 'Copied!';
        setTimeout(() => {
          copyBtn.innerText = 'Copy';
        }, 2000);
      });
    };

    header.appendChild(lang);
    header.appendChild(copyBtn);
    wrapper.appendChild(header);
    wrapper.appendChild(pre.cloneNode(true));
    pre.parentElement.replaceChild(wrapper, pre);
  });
}

// ---------------------------------------------------------------------------
// Shared: Category links loader
// Populates a <ul> element (by id) with category links from Markdown blogs
// ---------------------------------------------------------------------------
async function loadCategoryLinks(listElementId) {
  try {
    var blogs = await DataCache.getBlogs();
    var categorySet = new Set();
    blogs.forEach(function (b) {
      if (b.category) categorySet.add(b.category);
    });
    var categories = Array.from(categorySet).sort();
    var categoryHtml = '';
    categories.forEach(function (catName) {
      categoryHtml +=
        '<li><a href="blog.html?cat=' +
        encodeURIComponent(catName) +
        '" class="category-link">' +
        catName +
        '</a></li>';
    });
    var el = document.getElementById(listElementId);
    if (el) el.innerHTML = categoryHtml;
  } catch (error) {
    console.error('Error loading categories:', error);
  }
}

// ---------------------------------------------------------------------------
// Shared: Search blogs
// On blog.html  — filters and re-renders the grid in place.
// redirects to blog.html with ?search= so the full
//                     blog list page handles the search properly.
// ---------------------------------------------------------------------------
function searchBlogs() {
  var searchTerm = (document.getElementById('txtSearch') || {}).value || '';
  searchTerm = searchTerm.trim();

  // redirect to blog.html with the search term
  if (typeof allBlogs === 'undefined' || typeof renderBlogsGrid === 'undefined') {
    if (searchTerm) {
      window.location.href = 'blog.html?search=' + encodeURIComponent(searchTerm);
    } else {
      window.location.href = 'blog.html';
    }
    return;
  }

  // blog.html: filter in place (existing behaviour)
  var term = searchTerm.toLowerCase();
  if (!term) {
    filteredBlogs = [...allBlogs];
  } else {
    filteredBlogs = allBlogs.filter(function (blog) {
      return (
        (blog.title && blog.title.toLowerCase().includes(term)) ||
        (blog.heading && blog.heading.toLowerCase().includes(term)) ||
        (blog.description && blog.description.toLowerCase().includes(term)) ||
        (blog.short_description && blog.short_description.toLowerCase().includes(term)) ||
        (blog.tags && blog.tags.some(function (tag) {
          return tag.toLowerCase().includes(term);
        }))
      );
    });
  }
  currentPage = 1;
  if ($('#Content3Header').length) {
    $('#Content3Header').show();
  }
  renderBlogsGrid(filteredBlogs);
}

$(document).ready(function () {
  // Initialize any page-specific functionality
});


/**
 * Fetches Apps page content ("title" and "content" fields) from
 * data/website_content.json (0 Firestore Reads) and populates the page.
 * Falls back to the static HTML already in apps.html if the fetch
 * fails or returns no data, so the page never ends up blank.
 */
document.addEventListener("DOMContentLoaded", function () {
  if (document.getElementById("appsTitleText") || document.getElementById("appsContentText")) {
    loadAppsContent();
  }
});

async function loadAppsContent() {
  var titleEl = document.getElementById("appsTitleText");
  var contentEl = document.getElementById("appsContentText");

  try {
    var data = await DataCache.getPageContent("apps");
    // console.log("Fetched Apps page content:", data);
    if (!data) {
      console.warn("No content found for page 'apps'. Using default static content.");
      return;
    }

    if (data.title && titleEl) {
      titleEl.innerHTML = data.title;
    }

    if (data.content && contentEl) {
      contentEl.innerHTML = data.content;
    }
  } catch (e) {
    console.error("Error loading Apps page content:", e.message);
    // Static fallback content already present in the HTML remains visible.
  }
}
