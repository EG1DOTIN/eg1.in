// Website Content Management Module

let currentContentPage = 'homepage';

// Reset content tabs to default state (called when switching sections)
function resetContentTabs() {
    currentContentPage = 'homepage';

    // Reset active tab button to Home Page
    const tabs = document.querySelectorAll('.content-tabs .tab-btn');
    tabs.forEach(tab => tab.classList.remove('active'));
    if (tabs.length > 0) {
        tabs[0].classList.add('active');
    }

    // Load homepage content
    loadContentData('homepage');
}

// Show content tab
function showContentTab(pageType, clickedBtn) {
    currentContentPage = pageType;
    
    // Update active tab
    const tabs = document.querySelectorAll('.content-tabs .tab-btn');
    tabs.forEach(tab => tab.classList.remove('active'));
    if (clickedBtn) {
        clickedBtn.classList.add('active');
    }
    
    // Load content
    loadContentData(pageType);
}

// Load content data
async function loadContentData(pageType) {
    try {
        const doc = await db.collection('website_content').doc("pages").get();
        
        if (doc.exists) {
            const data = doc.data();
            document.getElementById('contentTitle').value = data[pageType]?.title || '';
            tinymce.get('contentEditor').setContent(data[pageType]?.content || '');
        } else {
            document.getElementById('contentTitle').value = '';
            tinymce.get('contentEditor').setContent('');
        }
    } catch (error) {
        console.error('Error loading content:', error);
        alert('Error loading content: ' + error.message);
    }
}

// Save content
document.getElementById('contentFormElement').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const messageElement = document.getElementById('contentFormMessage');
    messageElement.classList.remove('show', 'success', 'error');
    
    try {
        const title = document.getElementById('contentTitle').value;
        const content = tinymce.get('contentEditor').getContent();
        
        const contentData = {
            title: title,
            content: content,
            updatedAt: new Date()
        };
        
        await db.collection('website_content').doc("pages").set({ [currentContentPage]: contentData }, { merge: true });
        
        localStorage.removeItem('eg1_pages_cache');
        localStorage.removeItem('eg1_pages_cache_time');
        localStorage.removeItem('eg1_news_cache');
        localStorage.removeItem('eg1_news_cache_time');
        
        messageElement.textContent = 'Content saved successfully!';
        messageElement.classList.add('show', 'success');
        
        setTimeout(() => {
            messageElement.classList.remove('show', 'success');
        }, 3000);
        
    } catch (error) {
        console.error('Error saving content:', error);
        messageElement.textContent = 'Error: ' + error.message;
        messageElement.classList.add('show', 'error');
    }
});

console.log('Contents module loaded');
