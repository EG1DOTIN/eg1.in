
(function ($) {
  'use strict';

  // Main function
  $.socialButtons = function( options ){
    
    // Define the defaults
    var defaults = { 
      effect  : '', // slide-on-scroll
      buttons : {
        'facebook':   { class: 'facebook',  use: false, icon: 'facebook',    link: '', title: 'Follow on Facebook' },
        'google':     { class: 'gplus',     use: false, icon: 'google-plus', link: '', title: 'Visit on Google Plus' },
        'linkedin':   { class: 'linkedin',  use: false, icon: 'linkedin',    link: '', title: 'Visit on LinkedIn' },
        'twitter':    { class: 'twitter',   use: false, icon: 'twitter',     link: '', title: 'Follow on Twitter' },
        'youtube':    { class: 'youtube', use: false, icon: 'youtube',   link: '', title: 'visit on youtube' }
      }
    };

    // Merge defaults and options
    var s,
        settings = options;
    for (s in defaults.buttons) {
      if (options.buttons[s]) {
        settings.buttons[s] = $.extend( defaults.buttons[s], options.buttons[s] );
      }
    }
    
    // Define the container for the buttons
    var oContainer = $("#contact-buttons-bar");

    // Check if the container is already on the page
    if ( oContainer.length === 0 ) {
      
      // Insert the container element
      $('body').append('<div id="contact-buttons-bar">');
      
      // Get the just inserted element
      oContainer = $("#contact-buttons-bar");
      
      // Add class for effect
      oContainer.addClass(settings.effect);
      
      // Add show/hide button
      var sShowHideBtn = '<button class="contact-button-link show-hide-contact-bar"><span class="icon icon-angle-left"></span></button>';
      oContainer.append(sShowHideBtn);
      
      var i;
      for ( i in settings.buttons ) {
        var bs = settings.buttons[i],
            sLink = bs.link,
            active = bs.use;
        
        // Check if element is active
        if (active) {
          
          // Change the link for phone and email when needed
          if (bs.type === 'phone') {
            sLink = 'tel:' + bs.link;
          } else if (bs.type === 'email') {
            sLink = 'mailto:' + bs.link;
          }
          
          // Insert the links
          var sIcon = '<span class="icon icon-' + bs.icon + '"></span>',
              sButton = '<a href="' + sLink + 
                          '" class="contact-button-link cb-ancor ' + bs.class + '" ' + 
                          (bs.title ? 'title="' + bs.title + '"' : '') + 
                          (bs.extras ? bs.extras : '') + 
                          '>' + sIcon + '</a>';
          oContainer.append(sButton);
        }
      }
      
      // Make the buttons visible
      setTimeout(function(){
        oContainer.animate({ left : 0 });
      }, 200);
      
      // Show/hide buttons
      $('body').on('click', '.show-hide-contact-bar', function(e){
        e.preventDefault();
        e.stopImmediatePropagation();
        $('.show-hide-contact-bar').find('.fa').toggleClass('fa-angle-right fa-angle-left');
        oContainer.find('.cb-ancor').toggleClass('cb-hidden');
      });
    }
  };
  
  // Slide on scroll effect
  $(function(){
    
    // Define element to slide
    var el = $("#contact-buttons-bar.slide-on-scroll");
    
    // Load top default
    el.attr('data-top', el.css('top'));
    
    // Listen to scroll
    $(window).scroll(function() {
      clearTimeout( $.data( this, "scrollCheck" ) );
      $.data( this, "scrollCheck", setTimeout(function() {
        var nTop = $(window).scrollTop() + parseInt(el.attr('data-top'));
        el.animate({
          top : nTop
        }, 500);
      }, 250) );
    });
  });
  
 }( jQuery ));

// Google Fonts
WebFontConfig = {
    google: { families: ['Lato:400,700,300:latin'] }
};
(function () {
    var wf = document.createElement('script');
    wf.src = ('https:' == document.location.protocol ? 'https' : 'http') +
    '://ajax.googleapis.com/ajax/libs/webfont/1/webfont.js';
    wf.type = 'text/javascript';
    wf.async = 'true';
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(wf, s);
})();

// Initialize Share-Buttons
$.socialButtons({
    effect: 'slide-on-scroll',
    buttons: {
        'facebook': { class: 'facebook', use: true, link: 'https://facebook.com/eg1dotin', extras: 'target="_blank"' },
        'X': { class: 'twitter', use: true, link: 'https://x.com/eg1dotin' , extras: 'target="_blank"'},
        'google': { class: 'gplus', use: true, link: 'https://plus.google.com/EG1DOTIN' , extras: 'target="_blank"'},
        'youtube': { class: 'youtube', use: true, link: 'https://youtube.com/channel/UCozNmrss2AVE7naw4neqHGg' , extras: 'target="_blank"'}

    }
});