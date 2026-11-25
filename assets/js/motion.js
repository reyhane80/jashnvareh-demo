/*!
 * جشنواره — حرکت‌ها و افکت‌های تصویری | نسخه‌ی 1.8.0
 * بدون هیچ کتابخانه‌ی خارجی. همه‌ی بخش‌ها با «کاهش حرکت» سیستم‌عامل خاموش می‌شوند.
 *
 * فهرست:
 *  ۱. صفحه‌ی بارگذاری (body[data-loader]: counter | curtain)
 *  ۲. آشکار شدن کلمه‌به‌کلمه‌ی تیترها و متن‌ها
 *  ۳. شمارنده‌ی اعداد، آشکار شدن تصاویر، پارالاکس
 *  ۴. دکمه‌های مغناطیسی
 *  ۵. اسلایدر پیشنهاد شگفت‌انگیز
 *  ۶. افکت هیرو (section.hero[data-fx]):
 *     liquid | hearts | petals | doodles | snow | bubbles | embers | steam | sparks | stars | shader | cursor | tilt
 *
 * برای خاموش کردن افکت هیرو، ویژگی data-fx را از تگ section.hero حذف کنید.
 * برای حذف صفحه‌ی بارگذاری، ویژگی data-loader را از تگ body و div.loader را حذف کنید.
 */
(function () {
  'use strict';
  window.__jReady = (window.__jReady || 0) + 1; /* اعلام آماده بودن اسکریپت */
  var doc = document, root = doc.documentElement, body = doc.body;
  var mq = function (q) { return window.matchMedia && window.matchMedia(q).matches; };
  var reduce = mq('(prefers-reduced-motion: reduce)');
  var fine = mq('(hover: hover) and (pointer: fine)');
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var FA = '۰۱۲۳۴۵۶۷۸۹';
  var toFa = function (s) { return String(s).replace(/\d/g, function (d) { return FA[d]; }); };
  var raf = window.requestAnimationFrame || function (f) { return setTimeout(f, 16); };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var easeInOut = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var easeOut = function (t) { return 1 - Math.pow(1 - t, 3); };

  /* ---------- ۱. صفحه‌ی بارگذاری ---------- */
  var isReady = false, readyCbs = [];
  function onReady(fn) { if (isReady) fn(); else readyCbs.push(fn); }
  function setReady() {
    if (isReady) return; isReady = true;
    body.classList.add('is-ready');
    readyCbs.forEach(function (f) { f(); });
  }
  (function loader() {
    var ld = $('.loader');
    var key = 'jashn_loader_' + (body.dataset.store || '');
    var seen = false;
    try { seen = sessionStorage.getItem(key) === '1'; sessionStorage.setItem(key, '1'); } catch (e) { /* */ }
    if (!ld || reduce || seen) { if (ld) ld.parentNode.removeChild(ld); setReady(); return; }
    var num = $('.ld-num', ld), bar = $('.ld-bar span', ld);
    var MIN = 1200, MAX = 2600, t0 = Date.now(), loaded = doc.readyState === 'complete';
    window.addEventListener('load', function () { loaded = true; });
    root.style.overflow = 'hidden';
    function frame() {
      var el = Date.now() - t0, p = easeInOut(clamp(el / MIN, 0, 1));
      var v = Math.round(p * 100);
      if (num) num.textContent = toFa(('00' + v).slice(-3));
      if (bar) bar.style.setProperty('--p', p);
      if (p < 1 || (!loaded && el < MAX)) { raf(frame); return; }
      ld.classList.add('is-out');
      root.style.overflow = '';
      setTimeout(setReady, 260);
      setTimeout(function () { if (ld.parentNode) ld.parentNode.removeChild(ld); }, 950);
    }
    raf(frame);
  })();

  /* ---------- مشاهده‌گر ورود به صفحه ---------- */
  var watch = (function () {
    if (!('IntersectionObserver' in window)) return function (el) { el.classList.add('is-in'); };
    var io = new IntersectionObserver(function (ens) {
      ens.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); if (en.target._onIn) en.target._onIn(); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0 });
    return function (el, cb) { if (cb) el._onIn = cb; io.observe(el); };
  })();

  /* ---------- ۲. شکستن تیتر به کلمه‌ها (فارسی کلمه‌به‌کلمه، چون حروف به هم متصل‌اند) ---------- */
  function splitWords(el) {
    var i = 0;
    function wrap(node) {
      var w = doc.createElement('span'); w.className = 'ws';
      var s = doc.createElement('span'); s.style.setProperty('--i', i++);
      w.appendChild(s); node.parentNode.replaceChild(w, node); s.appendChild(node);
    }
    function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (ch) {
        if (ch.nodeType === 3) {
          var parts = ch.textContent.split(/(\s+)/), frag = doc.createDocumentFragment();
          parts.forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(doc.createTextNode(p)); return; }
            var w = doc.createElement('span'); w.className = 'ws';
            var s = doc.createElement('span'); s.textContent = p; s.style.setProperty('--i', i++);
            w.appendChild(s); frag.appendChild(w);
          });
          node.replaceChild(frag, ch);
        } else if (ch.nodeType === 1 && ch.tagName !== 'BR') {
          wrap(ch); /* عنصرهای داخلی (مثل em) یک واحد حساب می‌شوند تا استایلشان نشکند */
        }
      });
    }
    walk(el);
    el.classList.add('is-split');
  }
  function splitFade(el) {
    var i = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (ch) {
        if (ch.nodeType === 3) {
          var frag = doc.createDocumentFragment();
          ch.textContent.split(/(\s+)/).forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(doc.createTextNode(p)); return; }
            var s = doc.createElement('span'); s.className = 'wf'; s.textContent = p; s.style.setProperty('--i', i++); frag.appendChild(s);
          });
          node.replaceChild(frag, ch);
        } else if (ch.nodeType === 1) walk(ch);
      });
    })(el);
    el.classList.add('is-words');
  }
  if (!reduce) {
    $$('.section-title, [data-split], .featured-body h2').forEach(function (el) { splitWords(el); watch(el); });
    $$('[data-words]').forEach(function (el) { splitFade(el); watch(el); });
    var ht = $('.hero-title');
    if (ht) { splitWords(ht); onReady(function () { setTimeout(function () { ht.classList.add('is-in'); }, 60); }); }
  }

  /* ---------- ۳. شمارنده‌ی اعداد ---------- */
  function countUp(el) {
    var raw = el.textContent.trim();
    var lat = raw.replace(/[۰-۹]/g, function (d) { return FA.indexOf(d); });
    var m = lat.match(/^([^\d]*)([\d٬,]+(?:[٫.]\d+)?)(.*)$/);
    if (!m) return;
    var sep = /[٬,]/.test(m[2]), dec = /[٫.]/.test(m[2]);
    var target = parseFloat(m[2].replace(/[٬,]/g, '').replace('٫', '.'));
    var dp = dec ? (m[2].split(/[٫.]/)[1] || '').length : 0;
    function fmt(v) {
      var s = v.toFixed(dp).split('.');
      var int = sep ? s[0].replace(/\B(?=(\d{3})+(?!\d))/g, '٬') : s[0];
      return m[1] + toFa(int + (s[1] ? '٫' + s[1] : '')) + toFa(m[3]);
    }
    el.textContent = fmt(0);
    watch(el, function () {
      var t0 = null;
      function step(t) { if (!t0) t0 = t; var p = clamp((t - t0) / 1600, 0, 1); el.textContent = fmt(target * easeOut(p)); if (p < 1) raf(step); else el.textContent = raw; }
      raf(step);
    });
  }
  if (!reduce) $$('.stat b').forEach(countUp);

  /* ---------- آشکار شدن تصاویر و نام بزرگ فوتر ---------- */
  $$('[data-plate], .fb-word').forEach(function (el) { if (reduce) el.classList.add('is-in'); else watch(el); });

  /* ---------- پارالاکس با اسکرول ---------- */
  var par = reduce ? [] : $$('[data-parallax], .hero--cover .hero-bg, .hero--wave .hero-bg').map(function (el) { return { el: el, k: 0.08 }; })
    .concat($$('[data-drift]').map(function (el) { return { el: el, drift: +el.dataset.drift }; }));
  if (par.length) {
    var pTick = false;
    var runPar = function () {
      pTick = false;
      var vh = window.innerHeight;
      par.forEach(function (p) {
        var r = p.el.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) return;
        var prog = clamp((vh - r.top) / (vh + r.height), 0, 1) - .5;
        if (p.drift) p.el.style.transform = 'translate3d(' + (prog * p.drift * 16) + '%,0,0)';
        else p.el.style.transform = 'translate3d(0,' + (prog * r.height * p.k) + 'px,0)';
      });
    };
    window.addEventListener('scroll', function () { if (!pTick) { pTick = true; raf(runPar); } }, { passive: true });
    window.addEventListener('resize', runPar);
    runPar();
  }

  /* ---------- ۴. دکمه‌های مغناطیسی ---------- */
  if (fine && !reduce) {
    $$('.hero .btn--primary, .fb-cta .btn, .pinned .news-form .btn').forEach(function (b) {
      b.classList.add('is-mag');
      b.addEventListener('mousemove', function (e) {
        var r = b.getBoundingClientRect();
        b.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * .25) + 'px,' + ((e.clientY - r.top - r.height / 2) * .35) + 'px)';
      });
      b.addEventListener('mouseleave', function () { b.style.transform = ''; });
    });
  }

  /* ---------- ۵. اسلایدر پیشنهاد شگفت‌انگیز ---------- */
  $$('.amz').forEach(function (box) {
    var track = $('.amz-track', box), prev = $('[data-amz="prev"]', box), next = $('[data-amz="next"]', box);
    if (!track) return;
    function step() { var c = track.firstElementChild; return c ? (c.getBoundingClientRect().width + 2) * 2 : 300; }
    function upd() {
      var pos = Math.abs(track.scrollLeft), max = track.scrollWidth - track.clientWidth - 4;
      if (prev) prev.disabled = pos <= 4;
      if (next) next.disabled = pos >= max;
    }
    /* در صفحه‌ی راست‌به‌چپ، حرکت به جلو یعنی scrollLeft منفی */
    if (next) next.addEventListener('click', function () { track.scrollBy({ left: -step(), behavior: 'smooth' }); });
    if (prev) prev.addEventListener('click', function () { track.scrollBy({ left: step(), behavior: 'smooth' }); });
    track.addEventListener('scroll', function () { raf(upd); }, { passive: true });
    window.addEventListener('resize', upd);
    upd();
  });

  /* =====================================================================
     ۶. افکت هیرو
     ===================================================================== */
  var hero = $('.hero[data-fx]');
  if (!hero || reduce) return;
  var fx = hero.dataset.fx;
  var visible = true;
  if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }).observe(hero);
  var ptr = { x: -9999, y: -9999, nx: 0, ny: 0, has: false };
  window.addEventListener('pointermove', function (e) {
    ptr.x = e.clientX; ptr.y = e.clientY; ptr.has = true;
    ptr.nx = e.clientX / window.innerWidth - .5; ptr.ny = e.clientY / window.innerHeight - .5;
  }, { passive: true });
  function layer(cls) { var l = doc.createElement('div'); l.className = 'fx-layer ' + (cls || ''); l.setAttribute('aria-hidden', 'true'); hero.insertBefore(l, hero.firstChild); return l; }
  function dpr() { return Math.min(window.devicePixelRatio || 1, 2); }
  function hexRgb(h) { h = (h || '').trim().replace('#', ''); if (h.length === 3) h = h.replace(/./g, '$&$&'); var n = parseInt(h, 16); return isNaN(n) ? [255, 255, 255] : [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  var css = getComputedStyle(root);
  var C1 = hexRgb(css.getPropertyValue('--primary')), C2 = hexRgb(css.getPropertyValue('--accent'));

  /* ----- liquid: نقاشی تصویر دوم با رد نشانگر ----- */
  if (fx === 'liquid') onReady(function () {
    var base = $('.hero-bg img, .hero-media > img', hero);
    if (!base) return;
    var host = base.parentNode;
    if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
    var cv = doc.createElement('canvas'); cv.className = 'fx-liquid'; cv.setAttribute('aria-hidden', 'true');
    host.insertBefore(cv, base.nextSibling);
    var ctx = cv.getContext('2d'), cover = doc.createElement('canvas'), brush = doc.createElement('canvas');
    var bctx = brush.getContext('2d'), im = new Image(), R = 0, D = 0, pts = [], last = null, idle = 0, ok = false, box;
    var DECAY = 0.016;
    function size() {
      var r = dpr();
      cv.style.left = base.offsetLeft + 'px'; cv.style.top = base.offsetTop + 'px'; cv.style.right = cv.style.bottom = 'auto';
      cv.style.width = base.offsetWidth + 'px'; cv.style.height = base.offsetHeight + 'px';
      cv.width = Math.max(1, Math.round(base.offsetWidth * r)); cv.height = Math.max(1, Math.round(base.offsetHeight * r));
      cover.width = cv.width; cover.height = cv.height;
      if (im.naturalWidth) {
        var s = Math.max(cv.width / im.naturalWidth, cv.height / im.naturalHeight), w = im.naturalWidth * s, h = im.naturalHeight * s;
        cover.getContext('2d').drawImage(im, (cv.width - w) / 2, (cv.height - h) / 2, w, h);
      }
      R = Math.min(143, base.offsetWidth * .22) * r; D = Math.ceil(R * 2); brush.width = brush.height = D;
    }
    function stamp(x, y) {
      bctx.globalCompositeOperation = 'source-over'; bctx.clearRect(0, 0, D, D);
      var g = bctx.createRadialGradient(D / 2, D / 2, 0, D / 2, D / 2, D / 2);
      g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.55, 'rgba(255,255,255,.82)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      bctx.fillStyle = g; bctx.fillRect(0, 0, D, D);
      bctx.globalCompositeOperation = 'source-in';
      bctx.drawImage(cover, x - D / 2, y - D / 2, D, D, 0, 0, D, D);
      ctx.globalCompositeOperation = 'source-over'; ctx.drawImage(brush, x - D / 2, y - D / 2);
    }
    function push(cx, cy) {
      box = cv.getBoundingClientRect();
      var r = dpr(), x = (cx - box.left) * r, y = (cy - box.top) * r;
      if (x < -R || y < -R || x > cv.width + R || y > cv.height + R) { last = null; return; }
      if (last) {
        var dx = x - last.x, dy = y - last.y, dist = Math.sqrt(dx * dx + dy * dy), st = Math.max(R * .3, 1), n = Math.min(Math.ceil(dist / st), 60);
        for (var i = 1; i <= n; i++) pts.push({ x: last.x + dx * i / n, y: last.y + dy * i / n });
      } else pts.push({ x: x, y: y });
      last = { x: x, y: y };
      kick();
    }
    var running = false;
    function kick() { if (!running && ok) { running = true; idle = 0; raf(tick); } }
    function tick() {
      var drawing = pts.length > 0;
      if (drawing) idle = 0; else idle++;
      var fade = drawing ? DECAY : Math.min(DECAY + idle * .004, .5);
      ctx.globalCompositeOperation = 'destination-out'; ctx.fillStyle = 'rgba(0,0,0,' + fade + ')'; ctx.fillRect(0, 0, cv.width, cv.height);
      if (drawing) { pts.forEach(function (p) { stamp(p.x, p.y); }); pts = []; }
      if (idle > 120) { ctx.clearRect(0, 0, cv.width, cv.height); running = false; return; }
      raf(tick);
    }
    window.addEventListener('pointermove', function (e) { if (visible) push(e.clientX, e.clientY); }, { passive: true });
    window.addEventListener('resize', function () { size(); });
    im.onload = function () {
      ok = true; size();
      /* یک حرکت نمایشی کوتاه تا کاربر متوجه افکت شود */
      var b = cv.getBoundingClientRect(), t0 = null;
      function demo(t) {
        if (!t0) t0 = t; var p = clamp((t - t0) / 1400, 0, 1);
        push(b.left + b.width * (.2 + .6 * p), b.top + b.height * (.55 + Math.sin(p * Math.PI * 2) * .18));
        if (p < 1 && !ptr.has) raf(demo); else last = null;
      }
      setTimeout(function () { raf(demo); }, 500);
    };
    im.src = hero.dataset.fxImg;
  });

  /* ----- اشکال شناور که از نشانگر فرار می‌کنند ----- */
  var SHAPES = {
    hearts: ['<path d="M12 21s-8-4.9-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 6.1-8 11-8 11Z" fill="currentColor"/>'],
    petals: ['<g fill="currentColor"><circle cx="12" cy="6.5" r="3.6"/><circle cx="17.2" cy="10.3" r="3.6"/><circle cx="15.2" cy="16.4" r="3.6"/><circle cx="8.8" cy="16.4" r="3.6"/><circle cx="6.8" cy="10.3" r="3.6"/></g><circle cx="12" cy="12" r="2.4" fill="#fff" opacity=".7"/>',
             '<path d="M12 3c4 3 5 9 0 18-5-9-4-15 0-18Z" fill="currentColor"/>'],
    doodles: ['<path d="m12 3 2.6 5.6 6 .7-4.5 4.1 1.3 6L12 16.4 6.6 19.4l1.3-6L3.4 9.3l6-.7Z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/>',
              '<circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2.6"/>',
              '<path d="M12 4 21 19H3Z" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/>',
              '<path d="M2 14c3-6 5-6 7 0s4 6 7 0 4-6 6 0" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
              '<path d="M12 4v16M4 12h16" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/>'],
    snow: ['<g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7"/><path d="m9.5 3.5 2.5 2 2.5-2M9.5 20.5l2.5-2 2.5 2M4 10.2l3-.7-.9-3M20 13.8l-3 .7.9 3M4 13.8l3 .7-.9 3M20 10.2l-3-.7.9-3"/></g>',
           '<path d="m12 3 2.4 6.1L21 9.6l-5 4.2 1.6 6.4L12 16.7l-5.6 3.5L8 13.8 3 9.6l6.6-.5Z" fill="currentColor"/>',
           '<circle cx="12" cy="12" r="6" fill="currentColor"/>']
  };
  if (SHAPES[fx]) {
    var lay = layer('fx-repel'), items = [], seedN = 7;
    var rnd = function () { seedN = (seedN * 9301 + 49297) % 233280; return seedN / 233280; };
    var count = window.innerWidth < 700 ? 8 : 15;
    for (var i = 0; i < count; i++) {
      var s = doc.createElement('span'), sz = 16 + rnd() * 38, list = SHAPES[fx];
      s.className = 'fx-shape';
      s.innerHTML = '<svg viewBox="0 0 24 24">' + list[i % list.length] + '</svg>';
      s.style.width = s.style.height = sz + 'px';
      s.style.left = (4 + rnd() * 92) + '%'; s.style.top = (6 + rnd() * 86) + '%';
      s.style.opacity = (.18 + rnd() * .42).toFixed(2);
      if (i % 3 === 1) s.style.color = 'var(--accent)';
      lay.appendChild(s);
      items.push({ el: s, rx: 0, ry: 0, a: rnd() * 360, dur: 5 + (i % 6), ph: i * .7, depth: .4 + rnd() * .8 });
    }
    var mx = 0, my = 0;
    (function loop() {
      raf(loop);
      if (!visible) return;
      var time = Date.now() / 1000;
      mx += (ptr.nx - mx) * .05; my += (ptr.ny - my) * .05;
      items.forEach(function (it, i) {
        var r = it.el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        var dx = ptr.x - cx, dy = ptr.y - cy, dist = Math.sqrt(dx * dx + dy * dy) || 1, tx = 0, ty = 0, sp = 1;
        if (dist < 200) { var f = (200 - dist) / 200; tx = dx / dist * f * -90; ty = dy / dist * f * -90; sp = 1 + f * 5; }
        it.rx += (tx - it.rx) * .1; it.ry += (ty - it.ry) * .1; it.a += .2 * sp;
        var ph = (time + it.ph) * (Math.PI * 2 / it.dur);
        var px = mx * 50 * it.depth, py = my * 50 * it.depth;
        it.el.style.transform = 'translate3d(' + (it.rx + px).toFixed(1) + 'px,' + (it.ry + py + Math.sin(ph) * 14).toFixed(1) + 'px,0) rotate(' + (it.a + Math.cos(ph) * 8).toFixed(1) + 'deg)';
      });
    })();
  }

  /* ----- حباب، جرقه‌ی شمع و بخار ----- */
  if (fx === 'bubbles' || fx === 'embers' || fx === 'steam') {
    var bl = layer('fx-' + fx), live = 0;
    var cfg = { bubbles: [420, 10, 34, 4, 10, .55, 0, 100], embers: [380, 3, 8, 5, 9, .9, 0, 100], steam: [650, 50, 110, 6, 11, .5, 2, 48] }[fx];
    setInterval(function () {
      if (!visible || doc.hidden || live > 40) return;
      var b = doc.createElement('span'), sz = cfg[1] + Math.random() * (cfg[2] - cfg[1]), d = cfg[3] + Math.random() * (cfg[4] - cfg[3]);
      b.className = 'fx-bubble';
      b.style.width = b.style.height = sz + 'px';
      b.style.left = (cfg[6] + Math.random() * (cfg[7] - cfg[6])) + '%';
      b.style.setProperty('--o', (cfg[5] * (.5 + Math.random() * .5)).toFixed(2));
      b.style.setProperty('--dx', ((Math.random() - .3) * 80).toFixed(0) + 'px');
      b.style.animationDuration = d + 's';
      bl.appendChild(b); live++;
      setTimeout(function () { b.parentNode && b.parentNode.removeChild(b); live--; }, d * 1000);
    }, cfg[0]);
  }

  /* ----- canvas مشترک برای جرقه و ستاره ----- */
  function canvasLayer() {
    var l = layer(), cv = doc.createElement('canvas'); cv.className = 'fx-canvas'; l.appendChild(cv);
    var c = cv.getContext('2d'), o = { cv: cv, c: c, w: 0, h: 0 };
    function rs() { var r = dpr(); o.w = hero.offsetWidth; o.h = hero.offsetHeight; cv.width = o.w * r; cv.height = o.h * r; c.setTransform(r, 0, 0, r, 0, 0); }
    rs(); window.addEventListener('resize', rs);
    return o;
  }
  function sprite(rgb) {
    var s = doc.createElement('canvas'); s.width = s.height = 32; var c = s.getContext('2d');
    var g = c.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.25, 'rgba(' + rgb + ',.9)'); g.addColorStop(.6, 'rgba(' + rgb + ',.25)'); g.addColorStop(1, 'rgba(' + rgb + ',0)');
    c.fillStyle = g; c.fillRect(0, 0, 32, 32); return s;
  }

  /* ----- جرقه‌های نئونی (با سرعت اسکرول تندتر می‌شوند) ----- */
  if (fx === 'sparks') {
    var S = canvasLayer(), sp1 = sprite(C1.join(',')), sp2 = sprite(C2.join(',')), parts = [], lastY = window.scrollY, vel = 0;
    for (var k = 0; k < 140; k++) parts.push({ x: Math.random() * S.w, y: Math.random() * S.h, vy: 20 + Math.random() * 50, vx: (Math.random() - .5) * 14, sw: .5 + Math.random() * 1.5, sr: 6 + Math.random() * 18, ph: Math.random() * 6.3, s: 6 + Math.random() * 10, c: Math.random() < .6 ? sp1 : sp2 });
    var tPrev = 0;
    (function loop(t) {
      raf(loop);
      if (!visible) return;
      var dt = Math.min(.05, (t - tPrev) / 1000 || .016); tPrev = t;
      var y = window.scrollY; vel += (Math.abs(y - lastY) - vel) * .1; lastY = y;
      var mul = 1 + Math.min(vel, 60) / 8;
      S.c.clearRect(0, 0, S.w, S.h); S.c.globalCompositeOperation = 'lighter';
      var time = t / 1000;
      parts.forEach(function (p) {
        p.y -= p.vy * dt * mul; p.x += (p.vx + Math.sin(time * p.sw + p.ph) * p.sr) * dt;
        if (p.y < -20) { p.y = S.h + 10; p.x = Math.random() * S.w; }
        var a = clamp(p.y / S.h, 0, 1);
        S.c.globalAlpha = .35 + a * .6;
        S.c.drawImage(p.c, p.x - p.s / 2, p.y - p.s / 2, p.s, p.s);
      });
      S.c.globalAlpha = 1; S.c.globalCompositeOperation = 'source-over';
    })(0);
  }

  /* ----- آسمان پرستاره با شهاب ----- */
  if (fx === 'stars') {
    var T = canvasLayer(), stars = [], shoot = null, gold = sprite(C1.join(',')), white = sprite('255,255,255');
    for (var q = 0; q < 170; q++) stars.push({ x: Math.random(), y: Math.random(), s: 2 + Math.random() * 6, ph: Math.random() * 6.3, sp: .6 + Math.random() * 1.8, d: .3 + Math.random(), g: Math.random() < .3 });
    var smx = 0, smy = 0;
    (function loop(t) {
      raf(loop);
      if (!visible) return;
      var time = t / 1000; smx += (ptr.nx - smx) * .04; smy += (ptr.ny - smy) * .04;
      T.c.clearRect(0, 0, T.w, T.h);
      stars.forEach(function (s) {
        T.c.globalAlpha = .25 + .75 * (.5 + .5 * Math.sin(time * s.sp + s.ph));
        T.c.drawImage(s.g ? gold : white, s.x * T.w - smx * 30 * s.d - s.s / 2, s.y * T.h - smy * 30 * s.d - s.s / 2, s.s, s.s);
      });
      if (!shoot && Math.random() < .006) shoot = { x: Math.random() * T.w * .6 + T.w * .3, y: Math.random() * T.h * .4, l: 0 };
      if (shoot) {
        shoot.l += .022;
        var x2 = shoot.x - shoot.l * 260, y2 = shoot.y + shoot.l * 130, g = T.c.createLinearGradient(shoot.x - (shoot.l - .25) * 260, shoot.y + (shoot.l - .25) * 130, x2, y2);
        g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,245,210,' + (1 - shoot.l) + ')');
        T.c.globalAlpha = 1; T.c.strokeStyle = g; T.c.lineWidth = 1.6; T.c.beginPath();
        T.c.moveTo(shoot.x - Math.max(0, shoot.l - .25) * 260, shoot.y + Math.max(0, shoot.l - .25) * 130); T.c.lineTo(x2, y2); T.c.stroke();
        if (shoot.l >= 1) shoot = null;
      }
      T.c.globalAlpha = 1;
    })(0);
  }

  /* ----- موج فلز مایع با WebGL (بدون کتابخانه) ----- */
  if (fx === 'shader') (function () {
    var l = layer('fx-shader'), cv = doc.createElement('canvas'); cv.className = 'fx-canvas'; l.appendChild(cv);
    var gl = cv.getContext('webgl', { antialias: false, premultipliedAlpha: false }) || cv.getContext('experimental-webgl');
    if (!gl) { l.parentNode.removeChild(l); return; }
    var vs = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
    var fs = ['precision mediump float;uniform float uT;uniform vec2 uR;uniform vec2 uM;uniform float uS;uniform vec3 uC;',
      'void main(){vec2 uv=(gl_FragCoord.xy-.5*uR)/uR.y;float t=uT*.08;float sd=uS*5.;vec2 w=uv;',
      'w.x+=sin(uv.y*2.5+t*.2+sd)*.35;w.y+=cos(uv.x*2.5-t*.15-sd*.8)*.35;',
      'w.x+=sin(uv.y*1.2-t*.1-sd*1.5)*.25;w.y+=cos(uv.x*1.2+t*.18+sd*1.2)*.25;',
      'w+=vec2(uS*.04,-uS*.02)+uM*.05;',
      'vec2 d1=vec2(cos(.6),sin(.6)),d2=vec2(cos(-.7),sin(-.7)),d3=vec2(cos(1.2),sin(1.2));',
      'float w1=sin(dot(w,d1)*2.4+t);float w2=cos(dot(w,d2)*3.2-t*1.4+w1*.4);float w3=sin(dot(w,d3)*4.+t*1.8+w2*.5);',
      'float f=w1*.5+w2*.35+w3*.15;float sh=pow(max(0.,1.-abs(f-.1)),2.5);float sp=pow(max(0.,1.-abs(f-.15)),8.);',
      'vec3 c=vec3(.972,.978,1.);c=mix(c,vec3(.915,.932,.99),smoothstep(-.6,.2,f));c=mix(c,vec3(.86,.89,.985),smoothstep(0.,.8,f)*.7);',
      'c=mix(c,uC,sp*.32);c+=sh*.035;c*=1.-dot(uv,uv)*.03;gl_FragColor=vec4(c,1.);}'].join('');
    function sh(t, s) { var o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return o; }
    var pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { l.parentNode.removeChild(l); return; }
    gl.useProgram(pr);
    var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var uT = gl.getUniformLocation(pr, 'uT'), uR = gl.getUniformLocation(pr, 'uR'), uM = gl.getUniformLocation(pr, 'uM'), uS = gl.getUniformLocation(pr, 'uS'), uC = gl.getUniformLocation(pr, 'uC');
    gl.uniform3f(uC, C1[0] / 255, C1[1] / 255, C1[2] / 255);
    function rs() { var r = Math.min(dpr(), 1.5); cv.width = hero.offsetWidth * r; cv.height = hero.offsetHeight * r; gl.viewport(0, 0, cv.width, cv.height); gl.uniform2f(uR, cv.width, cv.height); }
    rs(); window.addEventListener('resize', rs);
    var m = [0, 0], sc = 0, t0 = Date.now();
    (function loop() {
      raf(loop);
      if (!visible) return;
      m[0] += (ptr.nx - m[0]) * .05; m[1] += (-ptr.ny - m[1]) * .05;
      sc += (clamp(window.scrollY / (hero.offsetHeight || 1), 0, 1) - sc) * .05;
      gl.uniform1f(uT, (Date.now() - t0) / 1000); gl.uniform2f(uM, m[0], m[1]); gl.uniform1f(uS, sc);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    })();
  })();

  /* ----- نشانگر سفارشی: حلقه + برچسب شیشه‌ای ----- */
  if (fx === 'cursor' && fine) (function () {
    var ring = doc.createElement('div'), pill = doc.createElement('div');
    ring.className = 'fx-cursor fx-ring'; pill.className = 'fx-cursor fx-pill';
    ring.setAttribute('aria-hidden', 'true'); pill.setAttribute('aria-hidden', 'true');
    body.appendChild(ring); body.appendChild(pill);
    var cx = 0, cy = 0, sc = 0, target = 0, first = true;
    var LABELS = [['.card, .amz-card, .look-item', '<b>مشاهده</b> و خرید'], ['.banner, .gallery a, .cat', '<b>بزن</b> بریم'], ['.hero', '<b>تخفیف</b> جشنواره']];
    doc.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      if (first) { cx = e.clientX; cy = e.clientY; first = false; }
      ring.classList.add('is-on'); pill.classList.add('is-on');
      var t = e.target, act = t.closest && t.closest('a, button, input, textarea, select, label');
      ring.classList.toggle('is-big', !!act);
      var lab = null;
      if (!act) for (var i = 0; i < LABELS.length; i++) if (t.closest && t.closest(LABELS[i][0])) { lab = LABELS[i][1]; break; }
      if (lab && pill._l !== lab) { pill.innerHTML = lab; pill._l = lab; }
      target = lab ? 1 : 0;
    }, { passive: true });
    doc.addEventListener('mouseleave', function () { target = 0; ring.classList.remove('is-on'); });
    (function loop() {
      raf(loop);
      cx += (ptr.x - cx) * .09; cy += (ptr.y - cy) * .09; sc += (target - sc) * .15;
      ring.style.transform = 'translate3d(' + ptr.x + 'px,' + ptr.y + 'px,0)';
      pill.style.transform = 'translate3d(' + (cx + 26) + 'px,' + (cy + 26) + 'px,0) translate(-50%,-50%) scale(' + sc.toFixed(3) + ')';
    })();
  })();

  /* ----- شیب سه‌بعدی داشبورد با حرکت نشانگر ----- */
  if (fx === 'tilt' && fine) (function () {
    var el = $('.dash', hero); if (!el) return;
    var rx = 0, ry = 0, tx = 0, ty = 0;
    hero.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect();
      ty = clamp((e.clientX - r.left - r.width / 2) / r.width, -.6, .6) * 14;
      tx = -clamp((e.clientY - r.top - r.height / 2) / r.height, -.6, .6) * 10;
    });
    hero.addEventListener('pointerleave', function () { tx = ty = 0; });
    (function loop() {
      raf(loop);
      if (!visible) return;
      rx += (tx - rx) * .08; ry += (ty - ry) * .08;
      el.style.transform = 'perspective(1100px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)';
    })();
  })();
})();
