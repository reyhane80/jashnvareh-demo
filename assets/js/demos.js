/*! جشنواره — صفحه‌ی انتخاب لندینگ‌ها | نسخه‌ی 1.3.1 */
(function () {
  'use strict';
  var chips = document.querySelectorAll('.chip-btn');
  var cards = document.querySelectorAll('.demo-card');
  chips.forEach(function (c) {
    c.addEventListener('click', function () {
      chips.forEach(function (x) { x.setAttribute('aria-pressed', x === c ? 'true' : 'false'); });
      var g = c.dataset.g;
      cards.forEach(function (card) { card.classList.toggle('is-hidden', g !== 'همه' && card.dataset.group !== g); });
    });
  });
  var items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('is-in'); io.unobserve(x.target); } });
    }, { rootMargin: '0px 0px -5% 0px' });
    items.forEach(function (i) { io.observe(i); });
  } else { items.forEach(function (i) { i.classList.add('is-in'); }); }
})();
