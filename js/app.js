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
  PRODUCTS_CACHE_KEY: 'eg1_apps_md_cache_v2',

  // Known list of Markdown applications in data/apps/
  KNOWN_APP_SLUGS: [
    'marwadi-chess',
    'test1-app',
    'test2-app'
  ],

  getRequestedAppSlug: function () {
    try {
      if (typeof window !== 'undefined' && window.location && window.location.search) {
        var params = new URLSearchParams(window.location.search);
        var title = params.get('title') || params.get('id');
        if (title) {
          return title.trim().toLowerCase().replace(/_/g, '-');
        }
      }
    } catch (e) {}
    return null;
  },

  parseAppFrontmatterAndMarkdown: function (rawText, defaultSlug) {
    if (!rawText) return null;
    var match = rawText.match(/^---\s*[\r\n]+([\s\S]*?)[\r\n]+---\s*[\r\n]*([\s\S]*)$/);
    if (!match) return null;

    var yamlContent = match[1];
    var markdownBody = (match[2] || '').trim();
    var meta = {};
    var lines = yamlContent.split(/\r?\n/);
    var currentParentKey = null;

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      var isIndented = /^(\s{2,}|\t)/.test(line);
      var colonIdx = line.indexOf(':');
      if (colonIdx === -1) continue;

      var rawKey = line.slice(0, colonIdx).trim();
      var rawVal = line.slice(colonIdx + 1).trim();
      var hadQuotes = (rawVal.startsWith('"') && rawVal.endsWith('"')) || (rawVal.startsWith("'") && rawVal.endsWith("'"));

      // Unquote strings
      if (hadQuotes) {
        rawVal = rawVal.slice(1, -1);
      }

      if (isIndented && currentParentKey) {
        if (!meta[currentParentKey] || typeof meta[currentParentKey] !== 'object') {
          meta[currentParentKey] = {};
        }
        meta[currentParentKey][rawKey] = rawVal;
      } else {
        if (rawVal === '' && !hadQuotes) {
          currentParentKey = rawKey;
          meta[currentParentKey] = {};
        } else {
          currentParentKey = null;
          meta[rawKey] = rawVal;
        }
      }
    }

    // Convert markdown body to HTML using marked.js if present
    var bodyHtml = '';
    if (typeof marked !== 'undefined' && typeof marked.parse === 'function') {
      try {
        bodyHtml = marked.parse(markdownBody);
      } catch (e) {
        bodyHtml = '<p>' + markdownBody.replace(/\n\n+/g, '</p><p>') + '</p>';
      }
    } else if (typeof marked === 'function') {
      try {
        bodyHtml = marked(markdownBody);
      } catch (e) {
        bodyHtml = '<p>' + markdownBody.replace(/\n\n+/g, '</p><p>') + '</p>';
      }
    } else {
      bodyHtml = '<p>' + markdownBody.replace(/\n\n+/g, '</p><p>') + '</p>';
    }

    var productName = meta.product_name || meta.name || defaultSlug || 'Unknown App';
    var slug = meta.slug || (defaultSlug || productName.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/[\s-]+/g, '-'));
    var appId = meta.id || slug;

    var versionObj = { 'version-string': '1.0.0', 'fetch-github': 'false' };
    if (meta.version && typeof meta.version === 'object') {
      versionObj = {
        'version-string': String(meta.version['version-string'] || meta.version.versionString || meta.version.version || '1.0.0'),
        'fetch-github': String(meta.version['fetch-github'] || meta.version.fetchGithub || 'false').toLowerCase()
      };
    } else if (typeof meta.version === 'string') {
      versionObj = {
        'version-string': meta.version,
        'fetch-github': 'false'
      };
    }

    var defaultBtn1 = (meta.product_type === 'WebApp' && meta.webapp_link)
      ? { LAUNCH: meta.webapp_link, sameTab: 'false' }
      : { 'VIEW DETAILS': 'apps.html?title=' + slug, sameTab: 'true' };

    var defaultBtn2 = meta.attach_upload_file_1
      ? { DOWNLOAD: meta.attach_upload_file_1, sameTab: 'true' }
      : null;

    return {
      id: appId,
      product_name: productName,
      name: productName,
      slug: slug,
      category: meta.category || meta.categories || 'General',
      categories: meta.categories || meta.category || 'General',
      product_type: meta.product_type || 'Desktop App',
      version: versionObj,
      active: String(meta.active !== undefined ? meta.active : '1'),
      icon: (typeof meta.icon === 'string' && meta.icon.trim()) || (typeof meta.imageUrl === 'string' && meta.imageUrl.trim()) || '',
      imageUrl: (typeof meta.imageUrl === 'string' && meta.imageUrl.trim()) || (typeof meta.icon === 'string' && meta.icon.trim()) || '',
      short_description: meta.short_description || meta.description || '',
      description: meta.description || meta.short_description || '',
      full_description: bodyHtml || meta.short_description || meta.description || '',
      webapp_link: meta.webapp_link || '',
      attach_upload_file_1: meta.attach_upload_file_1 || '',
      attach_upload_file_2: meta.attach_upload_file_2 || '',
      downloaded: meta.downloaded || '0',
      paid_version: String(meta.paid_version || 'false'),
      show_download: String(meta.show_download || 'false'),
      createdAt: meta.createdAt || '',
      updatedAt: meta.updatedAt || '',
      button1: meta.button1 || defaultBtn1,
      button2: meta.button2 || defaultBtn2
    };
  },

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
        localStorage.removeItem('eg1_products_cache_v2');
        localStorage.removeItem('eg1_products_cache_v2_time');
        localStorage.removeItem(this.PRODUCTS_CACHE_KEY);
        localStorage.removeItem(this.PRODUCTS_CACHE_KEY + '_time');
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
      var cached = this._getPersistentCache(this.PRODUCTS_CACHE_KEY);
      if (cached && Array.isArray(cached) && cached.length > 0) {
        this.products = cached;
        this.lastFetchSource.products = 'localStorage (0 reads)';
        return this.products;
      }
    }

    try {
      console.log("[DataCache] Fetching applications directly from Markdown (.md) in data/apps/ (0 Firestore reads)...");
      var slugs = this.KNOWN_APP_SLUGS.slice();
      var requestedSlug = this.getRequestedAppSlug();
      if (requestedSlug && !slugs.includes(requestedSlug)) {
        slugs.unshift(requestedSlug);
      }

      var self = this;
      var fetchPromises = slugs.map(async function (slug) {
        try {
          var res = await fetch('data/apps/' + slug + '.md');
          if (!res.ok) return null;
          var text = await res.text();
          return self.parseAppFrontmatterAndMarkdown(text, slug);
        } catch (err) {
          console.warn('[DataCache] Failed to load markdown app for slug:', slug, err);
          return null;
        }
      });

      var loadedApps = await Promise.all(fetchPromises);
      var validApps = loadedApps.filter(function (a) { return a !== null; });

      this.products = validApps.filter(function (p) {
        return p.active === "1" || p.active === 1 || p.active === true || !p.hasOwnProperty('active');
      });
      this._setPersistentCache(this.PRODUCTS_CACHE_KEY, this.products);
      this.lastFetchSource.products = 'direct markdown (.md, 0 Firestore reads)';
    } catch (e) {
      this.lastError = e;
      console.error("Error fetching apps from data/apps/*.md:", e.message);
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
var DEFAULT_APP_ICON = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='16' fill='%231e293b'/><text x='50%' y='63%' font-family='sans-serif' font-weight='bold' font-size='38' fill='%2338bdf8' text-anchor='middle'>EG1</text></svg>";
var DEFAULT_PLACEHOLDER_ICON = DEFAULT_APP_ICON;
window.DEFAULT_APP_ICON = DEFAULT_APP_ICON;
window.DEFAULT_PLACEHOLDER_ICON = DEFAULT_APP_ICON;

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

    if (typeof url === "string" && url.includes("apps.html?title=")) {
      url = url.replace(/apps\.html\?title=([^&#]+)/, "apps/$1.html");
    }

    const target = sameTab ? "" : 'target="_blank" rel="noopener noreferrer"';

    if (icon) {
      icon = icon.trim();
      if (!icon.includes(" ") && !icon.startsWith("fa-") && !icon.startsWith("icon-")) {
        icon = "icon icon-" + icon;
      } else if (!icon.includes(" ") && icon.startsWith("icon-")) {
        icon = "icon " + icon;
      } else if (!icon.includes(" ") && icon.startsWith("fa-")) {
        icon = "fa " + icon;
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
    const DEFAULT_ICON = window.DEFAULT_APP_ICON || "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='16' fill='%231e293b'/><text x='50%' y='63%' font-family='sans-serif' font-weight='bold' font-size='38' fill='%2338bdf8' text-anchor='middle'>EG1</text></svg>";
    const rawIcon = (product.icon && typeof product.icon === 'string') ? product.icon.trim() : '';
    const rawImg = (product.imageUrl && typeof product.imageUrl === 'string') ? product.imageUrl.trim() : '';
    const iconUrl = rawIcon || rawImg || DEFAULT_ICON;
    const productName = product.product_name || product.name || "Unknown Product";
    const version = DataCache.resolveProductVersion(product);
    const shortDesc = product.short_description || product.description || "";
    const paidVersion = product.paid_version || "false";
    const productType = product.product_type || "Desktop App";
    const webappLink = product.webapp_link || "#";

    // Resolve Button 1 (Left / Primary Action)
    const appSlug = product.slug || (product.product_name || product.name || ('app-' + product.id)).trim().toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/[\s-]+/g, '-');
    const defaultDetailLink = (productType === "WebApp" && webappLink) ? webappLink : `apps/${appSlug}.html`;
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
      fallbackBtn2Url = `apps.html?title=${appSlug}`;
      fallbackBtn2Label = "View App";
      fallbackBtn2Class = "btn btn-primary btn-down";
    } else if (product.show_download === "true" || product.show_download === true) {
      fallbackBtn2Url = product.attach_upload_file_1 || `apps.html?title=${appSlug}`;
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
                            <img src="${iconUrl}" onerror="this.onerror=null;this.src=window.DEFAULT_APP_ICON;" class="home-product-icon" alt="${productName}" />
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
                                <div class="col-md-2 col-sm-3 col-xs-12">
                                    <div class="product-icon">
                                        <img src="${iconUrl}" onerror="this.onerror=null;this.src=window.DEFAULT_APP_ICON;" width="55px" height="55px" style="object-fit:contain; border-radius:6px;" alt="${productName}" />
                                    </div>
                                </div>
                                <div class="col-md-10 col-sm-9 col-xs-12 border">
                                    <div class="our-product-header">
                                        <a href="${btn1 ? btn1.url : '#'}" ${btn1 ? btn1.target : ''} class="link-name">${productName}</a>
                                        <span class="our-product-version">Version: <span data-product-version-id="${product.id}">${version}</span></span>
                                    </div>
                                    <div class="our-product-desc-wrap">
                                        <p class="our-product-desc">${shortDesc}</p>
                                    </div>
                                    <div class="our-product-actions">
                                        ${btn1 ? `<a href="${btn1.url}" ${btn1.target} class="${btn1.btnClass}"><i class="${btn1.icon}"></i>&nbsp;${btn1.label}</a>` : ""}
                                        ${btn2 ? `<a href="${btn2.url}" ${btn2.target} class="${btn2.btnClass}"><i class="${btn2.icon}"></i>&nbsp;${btn2.label}</a>` : ""}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
    }
  }
};

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
