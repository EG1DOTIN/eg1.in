// Load header component
function loadHeader() {
    fetch('components/header.html')
        .then(response => response.text())
        .then(data => {
            // Insert header at the beginning of main container
            const mainDiv = document.querySelector('.main-wrapper') || document.querySelector('center > div');
            if (mainDiv && mainDiv.firstChild) {
                mainDiv.insertBefore(document.createElement('div'), mainDiv.firstChild);
                mainDiv.firstChild.innerHTML = data;
            }
            
            // Initialize navigation
            initializeNavigation();
            
            // Initialize fixed nav on scroll
            initializeFixedNav();
        })
        .catch(error => console.error('Error loading header:', error));
}

// Initialize navigation active state
function initializeNavigation() {
    $(document).ready(function () {
        // Add active class on link click
        $(".nav li a").click(function () {
            $(this).parent().addClass("active");
            $(this).parent().siblings().removeClass("active");
        });

        // Set active link based on current URL
        var url = window.location.href;
        $(".nav a").each(function () {
            if (url == this.href) {
                $(this).closest("li").addClass("active");
            }
        });
        
        // Handle menu toggle
        handleMenuToggle();
    });
}

// Handle responsive menu toggle
function handleMenuToggle() {
    if (typeof nav !== 'undefined' && nav.length > 0) {
        // nav.js already handles this
        return;
    }
    
    var toggleMenu = document.querySelector('.toggleMenu');
    var menu = document.querySelector('.menu');
    
    if (toggleMenu && menu) {
        toggleMenu.addEventListener('click', function(e) {
            e.preventDefault();
            menu.classList.toggle('active');
        });
    }
}

// Initialize fixed navigation on scroll
function initializeFixedNav() {
    $(document).ready(function () {
        var nav = $(".navbar");

        $(window).scroll(function () {
            if ($(this).scrollTop() > 117) {
                nav.addClass("f-nav");
            } else {
                nav.removeClass("f-nav");
            }
        });
    });
}

// Load header when document is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadHeader);
} else {
    loadHeader();
}
