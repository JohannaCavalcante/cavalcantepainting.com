/* Cavalcante Painting Company
   Alpine.js handles the mobile menu and the FAQ accordion (see the markup).
   This file handles the consent bar, the hero photos and the gallery. */

(function () {
  'use strict';

  // ---------- Cookie consent (Google Consent Mode v2) ----------
  var KEY = 'cp_consent';
  var bar = document.getElementById('consent-bar');

  function stored() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function save(value) {
    try { localStorage.setItem(KEY, value); } catch (e) {}
  }
  function hideBar() {
    if (!bar) return;
    bar.hidden = true;
    document.body.classList.remove('has-consent');
  }
  function showBar() {
    if (!bar) return;
    bar.hidden = false;
    document.body.classList.add('has-consent');
    syncHeight();
  }
  function syncHeight() {
    if (bar && !bar.hidden) document.body.style.setProperty('--consent-h', (bar.offsetHeight + 16) + 'px');
  }

  if (bar) {
    if (!stored()) showBar();
    document.getElementById('consent-accept').addEventListener('click', function () {
      if (typeof gtag === 'function') gtag('consent', 'update', { analytics_storage: 'granted' });
      save('granted');
      hideBar();
    });
    document.getElementById('consent-decline').addEventListener('click', function () {
      // Consent stays denied; only the choice is remembered so the bar does not come back.
      save('denied');
      hideBar();
    });
    // The bar height changes when fonts and styles finish loading and when the screen is resized.
    window.addEventListener('resize', syncHeight);
    window.addEventListener('load', syncHeight);
    if (typeof ResizeObserver === 'function') new ResizeObserver(syncHeight).observe(bar);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(syncHeight);
    [300, 1000, 2500].forEach(function (ms) { setTimeout(syncHeight, ms); });
  }

  // ---------- Estimate buttons: a small menu with WhatsApp, Text us and Call us ----------
  // On phones the menu becomes a sheet at the bottom of the screen (moved to <body> so nothing covers it).
  var phoneScreen = window.matchMedia('(max-width: 767px)');
  var openEst = null;
  var backdrop = null;
  var closeEst = function (focusButton) {
    if (!openEst) return;
    var o = openEst;
    openEst = null;
    o.menu.hidden = true;
    o.button.setAttribute('aria-expanded', 'false');
    if (o.menu.parentNode !== o.home) o.home.appendChild(o.menu);
    if (backdrop) backdrop.hidden = true;
    document.body.classList.remove('est-open');
    if (focusButton) o.button.focus();
  };
  document.querySelectorAll('[data-est]').forEach(function (button) {
    var menu = document.getElementById(button.getAttribute('aria-controls'));
    if (!menu) return;
    var home = menu.parentNode;
    button.addEventListener('click', function (event) {
      event.preventDefault();
      var wasOpen = openEst && openEst.button === button;
      closeEst(false);
      if (wasOpen) return;
      if (phoneScreen.matches) {
        if (!backdrop) {
          backdrop = document.createElement('div');
          backdrop.className = 'est-backdrop';
          backdrop.hidden = true;
          backdrop.addEventListener('click', function () { closeEst(true); });
          document.body.appendChild(backdrop);
        }
        document.body.appendChild(menu);
        backdrop.hidden = false;
        document.body.classList.add('est-open');
      }
      menu.classList.remove('est-above');
      menu.hidden = false;
      // on larger screens, open upwards when there is no room below the button
      if (!phoneScreen.matches && menu.getBoundingClientRect().bottom > window.innerHeight &&
          button.getBoundingClientRect().top > menu.offsetHeight + 16) menu.classList.add('est-above');
      button.setAttribute('aria-expanded', 'true');
      openEst = { button: button, menu: menu, home: home };
      var first = menu.querySelector('a');
      if (first) first.focus();
    });
    menu.addEventListener('click', function (event) {
      if (event.target.closest('a')) closeEst(false);
    });
  });
  document.addEventListener('click', function (event) {
    if (openEst && !openEst.menu.contains(event.target) && !openEst.button.contains(event.target)) closeEst(false);
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && openEst) closeEst(true);
  });

  // ---------- Hero: alternate the photos every 5 seconds ----------
  var hero = document.querySelector('[data-hero]');
  if (hero) {
    var slides = hero.querySelectorAll('.hero-slide');
    var current = 0;
    if (slides.length > 1) {
      setInterval(function () {
        slides[current].classList.remove('is-on');
        current = (current + 1) % slides.length;
        slides[current].classList.add('is-on');
      }, 5000);
    }
  }

  // ---------- Gallery: filters ----------
  var filters = document.querySelector('[data-filters]');
  var gallery = document.querySelector('[data-gallery]');
  if (filters && gallery) {
    filters.addEventListener('click', function (event) {
      var button = event.target.closest('[data-filter]');
      if (!button) return;
      var value = button.getAttribute('data-filter');
      filters.querySelectorAll('[data-filter]').forEach(function (b) {
        var on = b === button;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      gallery.querySelectorAll('[data-cat]').forEach(function (item) {
        // a photo can belong to more than one filter: data-cat="Painting, Cabinets & Wood Spray"
        item.hidden = !(value === 'All' || item.getAttribute('data-cat').split(/\s*,\s*/).indexOf(value) >= 0);
        // All keeps the page order (a mix of services); inside a filter the photos follow their own order (data-rank)
        item.style.order = value === 'All' ? '' : item.getAttribute('data-rank');
      });
    });
  }

  // ---------- Gallery: enlarge a photo, with arrows to the previous and next ----------
  var dialog = document.querySelector('[data-lightbox-dialog]');
  if (dialog && gallery) {
    var big = dialog.querySelector('[data-lightbox-img]');
    var caption = dialog.querySelector('[data-lightbox-cap]');
    var current = null;
    var show = function (button) {
      current = button;
      big.src = button.getAttribute('data-lightbox');
      big.alt = button.getAttribute('data-caption');
      caption.textContent = button.getAttribute('data-caption');
    };
    // Moves only through the photos of the filter that is selected
    var step = function (direction) {
      var list = Array.prototype.slice.call(gallery.querySelectorAll('.gitem:not([hidden]) [data-lightbox]'));
      // follow the order on screen: inside a filter that is data-rank, in All the page order
      list.sort(function (a, b) {
        return (Number(a.parentNode.style.order) || 0) - (Number(b.parentNode.style.order) || 0);
      });
      var index = list.indexOf(current);
      if (index < 0 || list.length < 2) return;
      show(list[(index + direction + list.length) % list.length]);
    };
    gallery.addEventListener('click', function (event) {
      var button = event.target.closest('[data-lightbox]');
      if (!button) return;
      show(button);
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else window.open(big.src, '_blank');
    });
    dialog.addEventListener('click', function (event) {
      if (event.target.closest('[data-lightbox-prev]')) step(-1);
      else if (event.target.closest('[data-lightbox-next]')) step(1);
      else if (event.target === dialog || event.target.closest('[data-lightbox-close]')) dialog.close();
    });
    dialog.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowLeft') step(-1);
      if (event.key === 'ArrowRight') step(1);
    });
    // Swipe left or right on a phone
    var touchX = null;
    dialog.addEventListener('touchstart', function (event) { touchX = event.changedTouches[0].clientX; }, { passive: true });
    dialog.addEventListener('touchend', function (event) {
      if (touchX === null) return;
      var moved = event.changedTouches[0].clientX - touchX;
      touchX = null;
      if (Math.abs(moved) > 50) step(moved < 0 ? 1 : -1);
    }, { passive: true });
  }
})();
