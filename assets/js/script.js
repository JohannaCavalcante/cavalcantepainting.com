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
        item.hidden = !(value === 'All' || item.getAttribute('data-cat') === value);
      });
    });
  }

  // ---------- Gallery: enlarge a photo ----------
  var dialog = document.querySelector('[data-lightbox-dialog]');
  if (dialog && gallery) {
    var big = dialog.querySelector('[data-lightbox-img]');
    var caption = dialog.querySelector('[data-lightbox-cap]');
    gallery.addEventListener('click', function (event) {
      var button = event.target.closest('[data-lightbox]');
      if (!button) return;
      big.src = button.getAttribute('data-lightbox');
      big.alt = button.getAttribute('data-caption');
      caption.textContent = button.getAttribute('data-caption');
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else window.open(big.src, '_blank');
    });
    dialog.addEventListener('click', function (event) {
      if (event.target === dialog || event.target.closest('[data-lightbox-close]')) dialog.close();
    });
  }
})();
