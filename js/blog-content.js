/**
 * blog-content.js
 * Fetches Blog page content ("title" and "content" fields) from
 * data/website_content.json via DataCache (0 Firestore Reads) and populates the page header.
 * Falls back to the static HTML already in blog.html if the fetch
 * fails or returns no data, so the page never ends up blank.
 */
document.addEventListener("DOMContentLoaded", function () {
    loadBlogPageContent();
});

async function loadBlogPageContent() {
    var titleEl = document.getElementById("blogPageTitleText");
    var contentEl = document.getElementById("blogPageContentText");

    try {
        var data = await DataCache.getPageContent("blog");
        console.log("Fetched Blog page content:", data);
        if (!data) {
            console.warn("No content found for page 'blog'. Using default static content.");
            return;
        }

        if (data.title && titleEl) {
            titleEl.innerHTML = data.title;
        }

        if (data.content && contentEl) {
            contentEl.innerHTML = data.content;
        }
    } catch (e) {
        console.error("Error loading Blog page content:", e.message);
        // Static fallback content already present in the HTML remains visible.
    }
}
