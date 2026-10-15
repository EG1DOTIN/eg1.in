/**
 * about.js
 * Fetches About page content ("title" and "content" fields) from
 * data/website_content.json via DataCache (0 Firestore Reads) and populates the page.
 * Falls back to the static HTML already in about.html if the fetch
 * fails or returns no data, so the page never ends up blank.
 */
document.addEventListener("DOMContentLoaded", function () {
    loadAboutContent();
});

async function loadAboutContent() {
    var titleEl = document.getElementById("aboutTitleText");
    var contentEl = document.getElementById("aboutContentText");

    try {
        var data = await DataCache.getPageContent("about");
        // console.log("Fetched About page content:", data);
        if (!data) {
            console.warn("No content found for page 'about'. Using default static content.");
            return;
        }

        if (data.title && titleEl) {
            titleEl.innerHTML = data.title;
        }

        if (data.content && contentEl) {
            contentEl.innerHTML = data.content;
        }
    } catch (e) {
        console.error("Error loading About page content:", e.message);
        // Static fallback content already present in the HTML remains visible.
    }
}
