$(document).ready(function () {
    var slideIndex = 0;
    showSlides();

    function showSlides() {
        var slides = document.getElementById("mainContentHeaderslide");
        if (!slides) return;
        var urlString;
        slideIndex++;
        if (slideIndex > 6) { slideIndex = 1 }
        urlString = 'url(img/home' + slideIndex + '.png)';
        slides.style.backgroundImage = urlString;
        setTimeout(showSlides, 5000);
    }
});
