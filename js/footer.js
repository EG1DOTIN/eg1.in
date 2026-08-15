// Load footer component
function loadFooter() {
    fetch('components/footer.html')
        .then(response => response.text())
        .then(data => {
            // Insert footer at the end of main container
            const mainDiv = document.querySelector('.main-wrapper') || document.querySelector('center > div');
            if (mainDiv) {
                const footerContainer = document.createElement('div');
                footerContainer.innerHTML = data;
                mainDiv.appendChild(footerContainer);

                // Fetch about content from DataCache
                if (typeof waitForFirebase === 'function') {
                    waitForFirebase(async () => {
                        if (typeof DataCache !== 'undefined') {
                            const aboutPage = await DataCache.getPageContent('about');
                            if (aboutPage && aboutPage.title) {
                                const tempDiv = document.createElement('div');
                                tempDiv.innerHTML = aboutPage.title;
                                const text = tempDiv.textContent || tempDiv.innerText || '';
                                
                                const targetString = 'A personal hobb';
                                const startIndex = text.indexOf(targetString);
                                if (startIndex !== -1) {
                                    let snippet = text.substring(startIndex, startIndex + 146);
                                    if (snippet.length === 146 && text.length > startIndex + 146) {
                                        snippet += '...';
                                    }
                                    const aboutTextEl = document.getElementById('footer-about-text');
                                    if (aboutTextEl) {
                                        aboutTextEl.textContent = snippet;
                                    }
                                }
                            }
                        }
                    });
                }
            }
        })
        .catch(error => console.error('Error loading footer:', error));
}

// Load footer when document is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadFooter);
} else {
    loadFooter();
}
