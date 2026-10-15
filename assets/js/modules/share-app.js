/**
 * share-app.js
 * ------------
 * Provides native Web Share API functionality with an animated
 * copy-to-clipboard toast fallback for EG1 application detail pages.
 */
(function () {
  'use strict';

  function showShareToast(message) {
    var existingToast = document.getElementById('eg1ShareToast');
    if (existingToast && existingToast.parentNode) {
      existingToast.parentNode.removeChild(existingToast);
    }

    var toast = document.createElement('div');
    toast.id = 'eg1ShareToast';
    toast.className = 'share-toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.innerHTML = '<i class="fa fa-check-circle"></i>&nbsp;<span>' + (message || 'Link copied to clipboard!') + '</span>';

    document.body.appendChild(toast);

    // Trigger enter transition
    window.requestAnimationFrame(function () {
      toast.classList.add('show');
    });

    // Auto-remove after 2.5s
    setTimeout(function () {
      toast.classList.remove('show');
      setTimeout(function () {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 2500);
  }

  function copyToClipboard(textToCopy) {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      return navigator.clipboard.writeText(textToCopy);
    }

    return new Promise(function (resolve, reject) {
      try {
        var textArea = document.createElement('textarea');
        textArea.value = textToCopy;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        var success = document.execCommand('copy');
        document.body.removeChild(textArea);
        if (success) {
          resolve();
        } else {
          reject(new Error('execCommand copy failed'));
        }
      } catch (err) {
        reject(err);
      }
    });
  }

  function initShareButton() {
    var shareBtn = document.getElementById('btnShareApp');
    if (!shareBtn) {
      shareBtn = document.querySelector('.btn-share-app');
    }
    if (!shareBtn) return;

    shareBtn.addEventListener('click', function (e) {
      e.preventDefault();

      var title = shareBtn.getAttribute('data-title') || document.title || 'EG1 Application';
      var text = shareBtn.getAttribute('data-desc') || 'Check out this application on EG1';
      var url = shareBtn.getAttribute('data-url') || window.location.href;

      if (navigator.share) {
        navigator.share({
          title: title,
          text: text,
          url: url
        }).catch(function (err) {
          // User cancelled or aborted share sheet
          if (err && err.name !== 'AbortError') {
            fallbackCopy(url);
          }
        });
      } else {
        fallbackCopy(url);
      }
    });

    function fallbackCopy(urlToCopy) {
      copyToClipboard(urlToCopy)
        .then(function () {
          showShareToast('Application link copied to clipboard!');
        })
        .catch(function () {
          showShareToast('Link: ' + urlToCopy);
        });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initShareButton);
  } else {
    initShareButton();
  }
})();
