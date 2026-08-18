/**
 * Global application configuration and utility functions.
 * Contains methods to load external JSON data and parse URL parameters.
 */
var AppConfig = {
  dataPath: "data/",
  imagePath: "img/",

  // Load JSON data
  loadData: function (filename) {
    return $.ajax({
      url: this.dataPath + filename,
      dataType: "json",
      async: false,
    }).responseJSON;
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
 * Cache controller for retrieving and storing application data from Firestore.
 *
 * This helper centralizes data access for products, news, and blogs so the UI
 * can stay consistent after database structure changes. Blog content is loaded
 * from the flattened eg1_blog collection and normalized into a single array of
 * blog objects with the same field names used by the web page templates.
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

  isDev: function() {
    try {
      var host = window.location.hostname;
      return host === 'localhost' || host === '127.0.0.1' || window.location.protocol === 'file:';
    } catch (e) {
      return false;
    }
  },

  getCacheTTL: function() {
    return this.isDev() ? this.CACHE_TTL_DEV : this.CACHE_TTL_PROD;
  },

  _getPersistentCache: function(key) {
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

  _setPersistentCache: function(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      localStorage.setItem(key + '_time', Date.now().toString());
    } catch (e) {
      console.warn("LocalStorage write error for " + key + ":", e);
    }
  },

  BLOGS_CACHE_KEY: 'eg1_blogs_cache_v2',

  clearCache: function(type) {
    try {
      if (!type || type === 'blogs') {
        this.blogs = null;
        localStorage.removeItem(this.BLOGS_CACHE_KEY);
        localStorage.removeItem(this.BLOGS_CACHE_KEY + '_time');
        localStorage.removeItem('eg1_blogs_cache');
        localStorage.removeItem('eg1_blogs_cache_time');
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
      console.log("[DataCache] Fetching products from Firestore (Network Read)...");
      const snapshot = await db.collection("products").get();
      var allProducts = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      this.products = allProducts.filter(function(p) {
        return p.active === "1" || p.active === 1 || p.active === true || !p.hasOwnProperty('active');
      });
      this._setPersistentCache('eg1_products_cache', this.products);
      this.lastFetchSource.products = 'network (' + snapshot.docs.length + ' reads)';
    } catch (e) {
      this.lastError = e;
      console.error("Error fetching products [" + e.code + "]:", e.message);
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
      console.log("[DataCache] Fetching news from Firestore (Network Read)...");
      const snapshot = await db
        .collection("website_content")
        .doc("pages")
        .get();
      if (snapshot.exists) {
        this.pages = snapshot.data();
        this._setPersistentCache('eg1_pages_cache', this.pages);
        this.news = [{ id: "1", description: snapshot.data().homepage.content, title: snapshot.data().homepage.title }];
        this._setPersistentCache('eg1_news_cache', this.news);
        this.lastFetchSource.news = 'network (1 read)';
      } else {
        this.news = [];
      }
    } catch (e) {
      this.lastError = e;
      console.error("Error fetching news [" + e.code + "]:", e.message);
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
      console.log("[DataCache] Fetching pages from Firestore (Network Read)...");
      const snapshot = await db.collection("website_content").doc("pages").get();
      if (snapshot.exists) {
        this.pages = snapshot.data();
        this._setPersistentCache('eg1_pages_cache', this.pages);
        this.lastFetchSource.pages = 'network (1 read)';
      } else {
        this.pages = {};
      }
    } catch (e) {
      console.error("Error fetching pages:", e.message);
      this.pages = {};
    }
    return this.pages[pageId] || null;
  },

  /**
   * Loads the flattened blog collection used by the migrated Firestore schema.
   * Uses persistent localStorage caching to avoid impacting Firestore usage limits.
   */
  getBlogs: async function (forceRefresh) {
    if (this.blogs && !forceRefresh) {
      this.lastFetchSource.blogs = 'memory (0 reads)';
      return (this.blogs || []).filter(function(b) {
        return b.active === "1" || b.active === 1 || b.active === true || !b.hasOwnProperty('active');
      });
    }

    if (!forceRefresh) {
      var cached = this._getPersistentCache(this.BLOGS_CACHE_KEY);
      if (cached) {
        this.blogs = cached;
        this.lastFetchSource.blogs = 'localStorage (0 reads)';
        console.log("[DataCache] Using cached blogs from localStorage (0 Firestore reads)");
        return (this.blogs || []).filter(function(b) {
          return b.active === "1" || b.active === 1 || b.active === true || !b.hasOwnProperty('active');
        });
      }
    }

    try {
      if (!isFirebaseReady()) {
        throw new Error("Firebase not ready. db object is undefined");
      }
      console.log("[DataCache] Fetching blogs from Firestore (Network Read)...");

      // Fetch all blogs without orderBy to prevent silent exclusion of missing fields
      const snapshot = await db.collection("eg1_blog").get();
      this.blogs = [];
      snapshot.docs.forEach((doc) => {
        const catData = doc.data();
        const catName = doc.id;
        for (const [key, value] of Object.entries(catData)) {
          if (key.startsWith('page') && value && typeof value === 'object') {
            const sortedPageEntries = Object.entries(value).sort(function (a, b) {
              const idA = String(a[0]);
              const idB = String(b[0]);
              const numA = Number(idA);
              const numB = Number(idB);
              if (!isNaN(numA) && !isNaN(numB)) {
                return numB - numA;
              }
              return idB.localeCompare(idA, undefined, { numeric: true, sensitivity: 'base' });
            });

            sortedPageEntries.forEach(([blogId, blogData]) => {
              if (!blogData || typeof blogData !== 'object') {
                return;
              }

              const normalizedBlogData = Object.assign({}, blogData);
              if (normalizedBlogData.createdAt && typeof normalizedBlogData.createdAt.toDate === "function") {
                normalizedBlogData.createdAt = normalizedBlogData.createdAt.toDate();
              } else if (normalizedBlogData.release_date && typeof normalizedBlogData.release_date.toDate === "function") {
                normalizedBlogData.createdAt = normalizedBlogData.release_date.toDate();
              }
              if (normalizedBlogData.updatedAt && typeof normalizedBlogData.updatedAt.toDate === "function") {
                normalizedBlogData.updatedAt = normalizedBlogData.updatedAt.toDate();
              }

              this.blogs.push({ id: blogId, category: catName, ...normalizedBlogData });
            });
          }
        }
      });
      console.log("Successfully loaded " + this.blogs.length + " blogs from network");
      this._setPersistentCache(this.BLOGS_CACHE_KEY, this.blogs);
      this.lastFetchSource.blogs = 'network (' + snapshot.docs.length + ' doc reads)';
      this.lastError = null;
    } catch (e) {
      this.lastError = e;
      console.error("Error fetching blogs [" + e.code + "]:", e.message);
      console.error("Full error:", e);
      this.blogs = [];
    }
    // Only return active blogs (active === "1" or active === 1 or active === true, or no active field)
    return (this.blogs || []).filter(function(b) {
      return b.active === "1" || b.active === 1 || b.active === true || !b.hasOwnProperty('active');
    });
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
    return blogs.filter((b) => b.tags && b.tags.includes(category));
  },
};

/**
 * Utility functions for rendering dynamic HTML components.
 * Contains methods to generate HTML strings for products and blogs.
 */
var RenderHelpers = {
  renderProductCard: function (product, isHomepage) {
    const iconUrl = product.icon || product.imageUrl || "img/eg1logo.webp";
    const productName = product.product_name || product.name || "Unknown Product";
    const version = product.version || "1.0";
    const shortDesc = product.short_description || product.description || "";
    const paidVersion = product.paid_version || "false";
    const productType = product.product_type || "Desktop App";
    const webappLink = product.webapp_link || "#";
    const detailLink = (productType === "WebApp" && webappLink) ? webappLink : `apps.html?id=${product.id}`;
    // 2. Add a conditional target attribute (only "_blank" for WebApp)
    const linkTarget = (productType === "WebApp" && webappLink) ? 'target="_blank" rel="noopener noreferrer"' : '';

    if (isHomepage) {
      return `
                <div class="col-md-4 col-sm-4 col-xs-12">
                    <div class="box box-widget home-product-card box-shadow-bottom">
                        <div class="home-product-header">
                            <img src="${iconUrl}" class="home-product-icon" alt="${productName}" />
                            <div class="home-product-title-wrap">
                                <h4 class="home-product-title">${productName}</h4>
                                <h5 class="home-product-version">Version ${version}</h5>
                            </div>
                        </div>
                        <div class="home-product-body">
                            <p class="home-product-desc">${shortDesc}</p>
                        </div>
                        <div class="home-product-actions">
                            <a href="${detailLink}" ${linkTarget} class="btn btn-primary btn-read"><i class="icon icon-newspaper-o"></i>&nbsp;VIEW DETAILS</a>
                            ${(product.show_download === "true" || product.show_download === undefined) ? `<a href="download.html?id=${product.id}" class="btn btn-success btn-down"><i class="icon icon-download"></i>&nbsp;DOWNLOAD</a>` : ""}
                            ${paidVersion === "true" ? `<a href="get-registration-key.html?id=${product.id}" class="btn btn-primary"><i class="icon icon-key"></i>&nbsp;Get Key</a>` : ""}
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
                                            <a href="${detailLink}" class="link-name">${productName}</a>
                                        </div>
                                        <div class="col-md-12 left">
                                            <h5>Version:&nbsp;${version}</h5>
                                        </div>
                                    </div>
                                    <div class="row">
                                        <div class="col-md-12 left" style="text-align: left;">
                                            <p>${shortDesc}</p>
                                        </div>
                                    </div>
                                    <div class="row">
                                        <div class="col-md-5">
                                            <a href="${detailLink}" ${linkTarget} class="btn btn-primary btn-read"><i class="icon icon-newspaper-o"></i>&nbsp;VIEW DETAILS</a>
                                        </div>
                                        <div class="col-md-7">
                                            ${(product.show_download === "true" || product.show_download === undefined) ? `<a href="download.html?id=${product.id}" class="btn btn-success btn-down margin-r-5"><i class="icon icon-download"></i>&nbsp;DOWNLOAD</a>` : ""}
                                            ${paidVersion === "true" ? `<a href="get-registration-key.html?id=${product.id}" class="btn btn-primary btn-down margin-r-5"><i class="icon icon-key"></i>&nbsp;Get Key</a>` : ""}
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
    const imageUrl = blog.output_image || blog.imageUrl || "img/eg1logo.webp";
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
                                        <img src="${imageUrl}" alt="${title}" loading="lazy" onerror="this.src='img/eg1logo.webp'" style="width: 100%;" />
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
                                        ${
                                          content
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
    const imageUrl = blog.output_image || blog.imageUrl || "img/eg1logo.webp";
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
                                    <img src="${imageUrl}" alt="${title}" loading="lazy" onerror="this.src='img/eg1logo.webp'" style="width: 100%; height: 200px; object-fit: cover;" />
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
    const imageUrl = blog.output_image || blog.imageUrl || 'img/eg1logo.webp';
    const title    = blog.heading || blog.title || 'Untitled';
    const category = blog.category || (blog.tags && blog.tags.length > 0 ? blog.tags[0] : 'Uncategorized');
    const author   = blog.author || 'Admin';
    const description = blog.short_description || blog.description || '';
    const shortDesc   = description.length > 150
      ? description.substring(0, 150) + '...'
      : description;

    return `
      <a href="blog.html?id=${blog.id}" class="blog-list-card">
        <div class="blog-list-image">
          <img src="${imageUrl}" alt="${title}" loading="lazy" onerror="this.src='img/eg1logo.webp'" />
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
        hljs.highlightElement(code);

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
// Populates a <ul> element (by id) with links from the eg1_blog collection
// ---------------------------------------------------------------------------
async function loadCategoryLinks(listElementId) {
    try {
        var blogs = await DataCache.getBlogs();
        var categorySet = new Set();
        blogs.forEach(function(b) {
            if (b.category) categorySet.add(b.category);
        });
        var categories = Array.from(categorySet).sort();
        var categoryHtml = '';
        categories.forEach(function(catName) {
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
                (blog.title        && blog.title.toLowerCase().includes(term)) ||
                (blog.heading      && blog.heading.toLowerCase().includes(term)) ||
                (blog.description  && blog.description.toLowerCase().includes(term)) ||
                (blog.short_description && blog.short_description.toLowerCase().includes(term)) ||
                (blog.tags         && blog.tags.some(function (tag) {
                    return tag.toLowerCase().includes(term);
                }))
            );
        });
    }
    currentPage = 1;
    renderBlogsGrid(filteredBlogs);
}

$(document).ready(function () {
  // Initialize any page-specific functionality
});


/**
 * Fetches Apps page content ("title" and "content" fields) from
 * Firestore (website_content -> pages -> apps) and populates the page.
 * Falls back to the static HTML already in apps.html if the fetch
 * fails or returns no data, so the page never ends up blank.
 */
document.addEventListener("DOMContentLoaded", function () {
    if (typeof isFirebaseReady === "function" && !isFirebaseReady()) {
        waitForFirebase(loadAppsContent);
    } else {
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
