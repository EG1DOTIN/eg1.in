# Page Details: Home Page (index.html)

Technical code architecture, execution logic, algorithm specifications, Mermaid flowcharts, code links, and Firestore collection mappings for the EG1 Home Landing Page.

---

## 🔗 Associated Code Files

- **HTML Template**: [index.html](../../index.html)
- **Controller Logic**: [js/index.js](../../assets/js/modules/index.js)
- **Data Engine**: [js/app.js](../../assets/js/core/app.js)
- **Shell Components**: 
  - Header: [components/header.html](../../components/header.html)
  - Footer: [components/footer.html](../../components/footer.html)
  - Slider: [components/image_slider.html](../../components/image_slider.html)
- **Stylesheets**: [css/main.css](../../assets/css/core/main.css), [css/common.css](../../assets/css/core/common.css), [css/responsive.css](../../assets/css/core/responsive.css), [css/homepage.css](../../assets/css/pages/homepage.css)

---

## 🎨 UI Wireframe & Layout

```
+-------------------------------------------------------------------------+
| [EG1 Logo]        [Home] [Apps] [Explore v] [About] [Contact] (Bell)[🌓]|
+-------------------------------------------------------------------------+
| [=================== Image Slider Header Banner =====================]  |
| "EG1 ^v3.7.0 - An open-source hub for innovative and creative projects"  |
+-------------------------------------------------------------------------+
| ANNOUNCEMENTS / NEWS CONTAINER (#newsContainer)                         |
| "A platform for solutions, coding, programming, innovations..."        |
+-------------------------------------------------------------------------+
| FEATURED APPLICATIONS (Slick Carousel Slider .regular)                  |
| +-------------------+  +-------------------+  +-------------------+     |
| | [App Icon]        |  | [App Icon]        |  | [App Icon]        |     |
| | Product Title     |  | Product Title     |  | Product Title     |     |
| | Version 1.0       |  | Version 1.0       |  | Version 1.0       |     |
| | Short Description |  | Short Description |  | Short Description |     |
| | [View] [Download] |  | [View] [Download] |  | [View] [Download] |     |
| +-------------------+  +-------------------+  +-------------------+     |
+-------------------------------------------------------------------------+
| COMMUNITY JOURNEY BANNER (.eg1-community-banner)                        |
| "Join the Open-Source Journey" | [★ Star on GitHub]                     |
+-------------------------------------------------------------------------+
| FOOTER (Logo Badge, About Snippet, Follow Links, Contact CTA, Copyright)|
+-------------------------------------------------------------------------+
```

---

## ⚡ Mermaid System & Data Flowchart

```mermaid
flowchart TD
    Init["Visitor Loads index.html"] --> Shell["Inject Header, Footer, Image Slider"]
    Shell --> InitPage["index.js: initializeHomePage()"]
    
    InitPage --> FetchNews["DataCache.getNews()"]
    FetchNews --> CacheCheck1{"Valid LocalStorage Cache?"}
    CacheCheck1 -->|"Cache Hit"| PopNews["Populate #newsContainer"]
    CacheCheck1 -->|"Cache Miss"| ReadPagesDoc["Fetch Static data/website_content.json"]
    ReadPagesDoc --> SaveCache1["Update LocalStorage Cache"]
    SaveCache1 --> PopNews

    InitPage --> FetchProds["DataCache.getProducts()"]
    FetchProds --> CacheCheck2{"Valid LocalStorage Cache?"}
    CacheCheck2 -->|"Cache Hit"| FilterActive["Filter Active Products"]
    CacheCheck2 -->|"Cache Miss"| ReadProdsColl["Fetch Static data/apps.json"]
    ReadProdsColl --> SaveCache2["Update LocalStorage Cache"]
    SaveCache2 --> FilterActive

    FilterActive --> RenderCards["RenderProductCard with dynamic button1/button2"]
    RenderCards --> InitSlick["Initialize Slick Carousel .regular"]
    InitSlick --> SyncVersions["Background: DataCache.syncGithubVersions()"]
    SyncVersions --> Done["Render Complete"]
```

---

## 💻 Code-Side Implementation & Algorithm Details

### 1. Zero-Read Static JSON Caching Algorithm (`DataCache`)
The home page utilizes the `DataCache` pattern defined in [js/app.js](../../assets/js/core/app.js). Product catalog entries and announcement copy are served from static JSON files (`data/apps.json`, `data/website_content.json`) with an in-browser `localStorage` cache:

```javascript
// Key Method: DataCache.getProducts() in js/app.js
getProducts: async function () {
    var cached = this._getPersistentCache("eg1_products_cache");
    if (cached) return cached;

    // Load from local static JSON dataset (0 Firestore reads)
    var response = await fetch("data/apps.json");
    var data = await response.json();
    this._setPersistentCache("eg1_products_cache", data);
    return data;
}
```

### 2. Dynamic Dual Buttons & Background GitHub Version Sync
In [js/app.js](../../assets/js/core/app.js), `RenderHelpers.renderProductCard` dynamically parses `button1` and `button2` objects, and stamps elements with `data-product-version-id` for live background GitHub version resolution via `DataCache.syncGithubVersions()`.

### 3. Dynamic Slick Carousel Initialization
In [js/index.js](../../assets/js/modules/index.js), once cards are appended to `.regular`, the Slick carousel library is instantiated with responsive breakpoint rules:

```javascript
// Key Method: initializeHomePage() in js/index.js
$('.regular').slick({
    dots: true,
    infinite: true,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    responsive: [
        { breakpoint: 992, settings: { slidesToShow: 2 } },
        { breakpoint: 600, settings: { slidesToShow: 1 } }
    ]
});
```

### 4. Dynamic Hero Banner Hydration & Release Version Interpolation
In [js/index.js](../../assets/js/modules/index.js), `loadHeroFromContentAndUpdates()` dynamically resolves the hero template string from `data/website_content.json` and interpolates the active release version from `data/updates.json`:

```javascript
// Dynamic hero version interpolation
var updates = await $.getJSON("data/updates.json");
var versionString = "v3.7.0";
var latestRelease = updates.find(function (u) {
    return u.type === 'website' && u.version && typeof u.version === 'string' && u.version.trim().length > 0;
});
if (latestRelease && latestRelease.version) {
    versionString = "v" + latestRelease.version.replace(/^v/i, "");
}
var formattedHeading = rawTemplateTitle.replace(/\{version\}/g, versionString);
```

---

## 🗄️ Dataset & Schema Mappings

- **File [data/website_content.json](../../data/website_content.json)**: Static announcement copy and section metadata (`pages.homepage`).
- **Directory [data/apps/](../../data/apps/)**: Collection of Markdown application files rendered inside the carousel slider.

