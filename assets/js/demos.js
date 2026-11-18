/*!
 * جشنواره — صفحه‌ی انتخاب لندینگ‌ها | نسخه‌ی 1.7.1
 * صفحه‌ی بارگذاری، موج WebGL، اشیای شناور گریزان، اسلایدر، نشانگر سفارشی،
 * آشکار شدن تیترها، شمارنده و فیلتر دموها — بدون هیچ کتابخانه‌ی خارجی.
 */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement, body = doc.body;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var mm = function (q) { return window.matchMedia && window.matchMedia(q).matches; };
  var reduce = mm('(prefers-reduced-motion: reduce)');
  var fine = mm('(hover: hover) and (pointer: fine)');
  var raf = window.requestAnimationFrame || function (f) { return setTimeout(f, 16); };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var FA = '۰۱۲۳۴۵۶۷۸۹';
  var toFa = function (s) { return String(s).replace(/\d/g, function (d) { return FA[d]; }); };
  var ptr = { x: -9999, y: -9999, nx: 0, ny: 0, has: false };
  window.addEventListener('pointermove', function (e) {
    ptr.x = e.clientX; ptr.y = e.clientY; ptr.has = true;
    ptr.nx = e.clientX / window.innerWidth - .5; ptr.ny = e.clientY / window.innerHeight - .5;
  }, { passive: true });

  /* ---------- فیلتر دموها ---------- */
  var chips = $$('.chip-btn'), cards = $$('.demo-card');
  chips.forEach(function (c) {
    c.addEventListener('click', function () {
      chips.forEach(function (x) { x.setAttribute('aria-pressed', x === c ? 'true' : 'false'); });
      var g = c.dataset.g;
      cards.forEach(function (card) { card.classList.toggle('is-hidden', g !== 'همه' && card.dataset.group !== g); card.classList.add('is-in'); });
    });
  });

  /* ---------- ساعت و تاریخ تهران ---------- */
  (function clock() {
    var t = $('[data-time]'), d = $('[data-date]');
    if (!t) return;
    function tick() {
      var now = new Date();
      try {
        t.textContent = new Intl.DateTimeFormat('fa-IR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Tehran' }).format(now);
        d.textContent = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Tehran' }).format(now);
      } catch (e) { t.textContent = toFa(('0' + now.getHours()).slice(-2) + ':' + ('0' + now.getMinutes()).slice(-2)); }
    }
    tick(); setInterval(tick, 1000);
  })();

  /* ---------- سربرگ هنگام اسکرول ---------- */
  var head = $('.d-header');
  window.addEventListener('scroll', function () { head.classList.toggle('is-scrolled', window.scrollY > 40); }, { passive: true });

  /* ---------- شکستن تیترها به کلمه ---------- */
  function split(el) {
    var i = 0;
    Array.prototype.slice.call(el.childNodes).forEach(function walk(node) {
      if (node.nodeType === 3) {
        var frag = doc.createDocumentFragment();
        node.textContent.split(/(\s+)/).forEach(function (p) {
          if (!p) return;
          if (/^\s+$/.test(p)) { frag.appendChild(doc.createTextNode(p)); return; }
          var w = doc.createElement('span'); w.className = 'ws';
          var s = doc.createElement('span'); s.textContent = p; s.style.setProperty('--i', i++);
          w.appendChild(s); frag.appendChild(w);
        });
        node.parentNode.replaceChild(frag, node);
      } else if (node.nodeType === 1) Array.prototype.slice.call(node.childNodes).forEach(walk);
    });
  }
  var heroSplit = $$('.d-hero [data-split]');
  $$('[data-split]').forEach(function (el) { if (!reduce) split(el); });
  $$('.d-sub .ws>span').forEach(function (s) { s.style.setProperty('--dl', '350ms'); });

  /* ---------- مشاهده‌گر ورود ---------- */
  function onIn(el, cb) {
    if (!('IntersectionObserver' in window)) { cb(el); return; }
    var io = new IntersectionObserver(function (en) { en.forEach(function (x) { if (x.isIntersecting) { cb(x.target); io.unobserve(x.target); } }); }, { rootMargin: '0px 0px -8% 0px' });
    io.observe(el);
  }
  $$('.reveal, .df-word, [data-split]').forEach(function (el) {
    if (heroSplit.indexOf(el) > -1) return;
    onIn(el, function (t) { t.classList.add('is-in'); });
  });

  /* ---------- شمارنده‌ی اعداد ---------- */
  $$('[data-count]').forEach(function (el) {
    var raw = el.textContent.trim(), n = parseInt(raw.replace(/[۰-۹]/g, function (d) { return FA.indexOf(d); }), 10);
    if (isNaN(n) || reduce) return;
    el.textContent = toFa(0);
    onIn(el, function () {
      var t0 = null;
      raf(function step(t) { if (!t0) t0 = t; var p = clamp((t - t0) / 1700, 0, 1); el.textContent = toFa(Math.round(n * (1 - Math.pow(1 - p, 3)))); if (p < 1) raf(step); });
    });
  });

  /* ---------- صفحه‌ی بارگذاری با شمارنده ---------- */
  function ready() {
    body.classList.add('is-ready');
    heroSplit.forEach(function (el) { el.classList.add('is-in'); });
  }
  (function loader() {
    var ld = $('.ld'), seen = false;
    try { seen = sessionStorage.getItem('jashn_hub') === '1'; sessionStorage.setItem('jashn_hub', '1'); } catch (e) { /* */ }
    if (!ld || reduce || seen) { if (ld) ld.parentNode.removeChild(ld); ready(); return; }
    var num = $('.ld-num', ld), bar = $('.ld-track span', ld), t0 = Date.now(), loaded = doc.readyState === 'complete';
    window.addEventListener('load', function () { loaded = true; });
    root.style.overflow = 'hidden';
    raf(function f() {
      var el = Date.now() - t0, t = clamp(el / 1300, 0, 1), p = t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      num.textContent = toFa(('00' + Math.round(p * 100)).slice(-3)); bar.style.setProperty('--p', p);
      if (t < 1 || (!loaded && el < 2800)) { raf(f); return; }
      ld.classList.add('is-out'); root.style.overflow = '';
      setTimeout(ready, 250);
      setTimeout(function () { if (ld.parentNode) ld.parentNode.removeChild(ld); }, 950);
    });
  })();

  /* ---------- اسلایدر کارت هیرو ---------- */
  (function hc() {
    var items = $$('.hc-item'), dots = $$('.hc-dots i'), i = 0, timer;
    if (!items.length) return;
    function show(n) {
      var old = items[i];
      i = (n + items.length) % items.length;
      old.classList.remove('is-on'); old.classList.add('is-out');
      setTimeout(function () { old.classList.remove('is-out'); }, 500);
      items[i].classList.add('is-on');
      dots.forEach(function (d, k) { d.classList.toggle('is-on', k === i % dots.length); });
    }
    function auto() { clearInterval(timer); if (!reduce) timer = setInterval(function () { show(i + 1); }, 3800); }
    $$('[data-hc]').forEach(function (b) { b.addEventListener('click', function () { show(i + (+b.dataset.hc)); auto(); }); });
    dots[0].classList.add('is-on'); auto();
  })();

  if (reduce) return;

  /* ---------- موج مایع طلایی با WebGL ---------- */
  (function shader() {
    var cv = $('.d-shader'), hero = $('.d-hero');
    if (!cv) return;
    var gl = cv.getContext('webgl', { antialias: false }) || cv.getContext('experimental-webgl');
    if (!gl) return;
    var vs = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
    var fs = ['precision mediump float;uniform float uT;uniform vec2 uR;uniform vec2 uM;uniform float uS;',
      'void main(){vec2 uv=(gl_FragCoord.xy-.5*uR)/uR.y;float t=uT*.08;float sd=uS*5.;vec2 w=uv;',
      'w.x+=sin(uv.y*2.5+t*.2+sd)*.35;w.y+=cos(uv.x*2.5-t*.15-sd*.8)*.35;',
      'w.x+=sin(uv.y*1.2-t*.1-sd*1.5)*.25;w.y+=cos(uv.x*1.2+t*.18+sd*1.2)*.25;w+=uM*.05;',
      'vec2 d1=vec2(cos(.6),sin(.6)),d2=vec2(cos(-.7),sin(-.7)),d3=vec2(cos(1.2),sin(1.2));',
      'float w1=sin(dot(w,d1)*2.4+t);float w2=cos(dot(w,d2)*3.2-t*1.4+w1*.4);float w3=sin(dot(w,d3)*4.+t*1.8+w2*.5);',
      'float f=w1*.5+w2*.35+w3*.15;float sh=pow(max(0.,1.-abs(f-.1)),2.5);float sp=pow(max(0.,1.-abs(f-.15)),8.);',
      'float k=smoothstep(0.,1.,uS);',
      'vec3 cs=mix(vec3(.004,.003,.006),vec3(.003,.003,.008),k);vec3 c1=mix(vec3(.11,.055,.02),vec3(.03,.04,.09),k);',
      'vec3 c2=mix(vec3(.06,.03,.012),vec3(.015,.02,.05),k);vec3 cc=mix(vec3(.62,.42,.2),vec3(.35,.38,.62),k);',
      'vec3 c=cs;c=mix(c,c2,smoothstep(-.6,.2,f));c=mix(c,c1,smoothstep(0.,.8,f));c+=cc*(sh*.35+sp*.7)*.9;',
      'c*=1.-dot(uv,uv)*.15;gl_FragColor=vec4(c,1.);}'].join('');
    function mk(t, s) { var o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return o; }
    var pr = gl.createProgram(); gl.attachShader(pr, mk(gl.VERTEX_SHADER, vs)); gl.attachShader(pr, mk(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return;
    gl.useProgram(pr);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var uT = gl.getUniformLocation(pr, 'uT'), uR = gl.getUniformLocation(pr, 'uR'), uM = gl.getUniformLocation(pr, 'uM'), uS = gl.getUniformLocation(pr, 'uS');
    function rs() { var r = Math.min(window.devicePixelRatio || 1, 1.5); cv.width = hero.offsetWidth * r; cv.height = hero.offsetHeight * r; gl.viewport(0, 0, cv.width, cv.height); gl.uniform2f(uR, cv.width, cv.height); }
    rs(); window.addEventListener('resize', rs);
    var vis = true, m = [0, 0], sc = 0, t0 = Date.now();
    if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { vis = e[0].isIntersecting; }).observe(hero);
    raf(function loop() {
      raf(loop);
      if (!vis || doc.hidden) return;
      m[0] += (ptr.nx - m[0]) * .05; m[1] += (-ptr.ny - m[1]) * .05;
      sc += (clamp(window.scrollY / (hero.offsetHeight || 1), 0, 1) - sc) * .05;
      gl.uniform1f(uT, (Date.now() - t0) / 1000); gl.uniform2f(uM, m[0], m[1]); gl.uniform1f(uS, sc);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    });
  })();

  /* ---------- اشیای شناور که از نشانگر فرار می‌کنند ---------- */
  (function floats() {
    var els = $$('.fl'), wrap = $('.d-floats'), hero = $('.d-hero'), vis = true;
    if (!els.length) return;
    if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { vis = e[0].isIntersecting; }).observe(hero);
    var st = els.map(function (el, i) { return { el: el, rx: 0, ry: 0, a: (i * 37) % 30 - 15, d: +el.dataset.depth || 1, dur: [5, 7, 6, 8, 5.5, 6.5, 9, 11, 10][i % 9], ph: i * .7 }; });
    var mx = 0, my = 0;
    raf(function loop() {
      raf(loop);
      if (!vis) return;
      var time = Date.now() / 1000;
      mx += (ptr.nx - mx) * .05; my += (ptr.ny - my) * .05;
      wrap.style.transform = 'translate3d(' + (mx * 40) + 'px,' + (my * 40) + 'px,0)';
      st.forEach(function (s) {
        var r = s.el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        var dx = ptr.x - cx, dy = ptr.y - cy, dist = Math.sqrt(dx * dx + dy * dy) || 1, tx = 0, ty = 0, sp = 1;
        if (dist < 260) { var f = (260 - dist) / 260; tx = dx / dist * f * -110; ty = dy / dist * f * -110; sp = 1 + f * 5; }
        s.rx += (tx - s.rx) * .08; s.ry += (ty - s.ry) * .08; s.a += .05 * sp;
        var ph = (time + s.ph) * (Math.PI * 2 / s.dur);
        s.el.style.transform = 'translate3d(' + (s.rx + mx * 30 * s.d).toFixed(1) + 'px,' + (s.ry + my * 30 * s.d + Math.sin(ph) * 16).toFixed(1) + 'px,0) rotate(' + (s.a + Math.cos(ph) * 7).toFixed(1) + 'deg)';
      });
    });
  })();

  if (!fine) return;

  /* ---------- دکمه‌های مغناطیسی ---------- */
  $$('.pill').forEach(function (b) {
    b.addEventListener('mousemove', function (e) {
      var r = b.getBoundingClientRect();
      b.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * .25) + 'px,' + ((e.clientY - r.top - r.height / 2) * .35) + 'px)';
    });
    b.addEventListener('mouseleave', function () { b.style.transform = ''; });
  });

  /* ---------- شیب سه‌بعدی کارت دموها ---------- */
  cards.forEach(function (c) {
    c.addEventListener('mousemove', function (e) {
      var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      c.style.transform = 'perspective(900px) rotateY(' + (x * 8).toFixed(2) + 'deg) rotateX(' + (-y * 6).toFixed(2) + 'deg) translateY(-6px)';
    });
    c.addEventListener('mouseleave', function () { c.style.transform = ''; });
  });

  /* ---------- نشانگر: حلقه + برچسب شیشه‌ای ---------- */
  (function cursor() {
    var ring = doc.createElement('div'), pill = doc.createElement('div');
    ring.className = 'cur cur-ring'; pill.className = 'cur cur-pill';
    ring.setAttribute('aria-hidden', 'true'); pill.setAttribute('aria-hidden', 'true');
    body.appendChild(ring); body.appendChild(pill);
    var cx = 0, cy = 0, sc = 0, target = 0, first = true;
    doc.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      if (first) { cx = e.clientX; cy = e.clientY; first = false; }
      ring.classList.add('is-on'); pill.classList.add('is-on');
      var lab = e.target.closest && e.target.closest('[data-cursor]');
      var act = !lab && e.target.closest && e.target.closest('a, button');
      ring.classList.toggle('is-big', !!act || !!lab);
      if (lab) { if (pill.textContent !== lab.dataset.cursor) pill.textContent = lab.dataset.cursor; target = 1; }
      else if (e.target.closest && e.target.closest('.d-hero') && !act) { if (pill.textContent !== 'سلام! خوش آمدید') pill.textContent = 'سلام! خوش آمدید'; target = 1; }
      else target = 0;
    }, { passive: true });
    doc.addEventListener('mouseleave', function () { target = 0; ring.classList.remove('is-on'); });
    raf(function loop() {
      raf(loop);
      cx += (ptr.x - cx) * .08; cy += (ptr.y - cy) * .08; sc += (target - sc) * .15;
      ring.style.transform = 'translate3d(' + ptr.x + 'px,' + ptr.y + 'px,0)';
      pill.style.transform = 'translate3d(' + (cx + 24) + 'px,' + (cy + 24) + 'px,0) translate(-50%,-50%) scale(' + sc.toFixed(3) + ')';
    });
  })();
})();
