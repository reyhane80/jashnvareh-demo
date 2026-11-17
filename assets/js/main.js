/*!
 * جشنواره — مجموعه‌ی ۱۵ لندینگ فروش ویژه | نسخه‌ی 1.1.0
 * اسکریپت مشترک همه‌ی لندینگ‌ها (جاوااسکریپت خالص، بدون کتابخانه).
 *
 * تنظیمات هر صفحه از ویژگی‌های data روی تگ <body> خوانده می‌شود:
 *   data-store        شناسه‌ی یکتای فروشگاه (برای ذخیره‌ی سبد خرید)
 *   data-free-ship    حداقل مبلغ ارسال رایگان (تومان)
 *   data-ship-cost    هزینه‌ی ارسال (تومان)
 *
 * اطلاعات هر محصول روی خود کارت محصول (ویژگی‌های data-*) نوشته شده است؛
 * برای تغییر نام، قیمت یا عکس فقط همان کارت را ویرایش کنید.
 */
(function () {
  'use strict';

  var body = document.body;
  var STORE = body.dataset.store || 'store';
  var FREE_SHIP = +body.dataset.freeShip || 0;
  var SHIP_COST = +body.dataset.shipCost || 0;
  var KEY_CART = 'jashn_cart_' + STORE;
  var KEY_WISH = 'jashn_wish_' + STORE;

  /* ---------- ابزارها ---------- */
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var fa = function (n) { return Number(n).toLocaleString('fa-IR'); };
  var money = function (n) { return fa(n) + ' <small>تومان</small>'; };
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* حالت خصوصی مرورگر */ } }
  };
  var icon = function (id) { return '<svg class="icon" aria-hidden="true"><use href="#i-' + id + '"/></svg>'; };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  /* ---------- پیام کوتاه (Toast) ---------- */
  var toastWrap = document.createElement('div');
  toastWrap.className = 'toast-wrap';
  toastWrap.setAttribute('aria-live', 'polite');
  body.appendChild(toastWrap);
  function toast(msg, ic) {
    var t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = icon(ic || 'check') + '<span>' + msg + '</span>';
    toastWrap.appendChild(t);
    setTimeout(function () { t.classList.add('out'); setTimeout(function () { t.remove(); }, 320); }, 2600);
  }

  /* ---------- قفل اسکرول و مدیریت پنجره‌ها ---------- */
  var openLayers = [];
  var lastFocus = null;
  function openLayer(el) {
    lastFocus = document.activeElement;
    el.classList.add('is-open');
    el.removeAttribute('aria-hidden');
    openLayers.push(el);
    body.classList.add('no-scroll');
    var f = el.querySelector('[data-autofocus]') || el.querySelector('button, a, input');
    if (f) setTimeout(function () { f.focus(); }, 60);
  }
  function closeLayer(el) {
    el.classList.remove('is-open');
    el.setAttribute('aria-hidden', 'true');
    openLayers = openLayers.filter(function (x) { return x !== el; });
    if (!openLayers.length) body.classList.remove('no-scroll');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && openLayers.length) closeLayer(openLayers[openLayers.length - 1]);
  });
  $$('[data-close]').forEach(function (b) {
    b.addEventListener('click', function () { closeLayer(b.closest('.drawer, .modal')); });
  });
  $$('[data-open]').forEach(function (b) {
    b.addEventListener('click', function (e) {
      var t = document.getElementById(b.dataset.open);
      if (t) { e.preventDefault(); openLayer(t); }
    });
  });

  /* ---------- نوار اعلان ---------- */
  var topbar = $('.topbar');
  if (topbar) {
    if (store.get('jashn_topbar_' + STORE, false)) topbar.classList.add('is-hidden');
    var tc = $('.topbar-close', topbar);
    if (tc) tc.addEventListener('click', function () { topbar.classList.add('is-hidden'); store.set('jashn_topbar_' + STORE, true); });
  }

  /* ---------- هدر چسبان، دکمه‌ی بالا و لینک فعال منو ---------- */
  var header = $('.header');
  var toTop = $('.to-top');
  var navLinks = $$('.nav a[href^="#"]');
  var sections = navLinks.map(function (a) { return document.querySelector(a.getAttribute('href')); });
  var ticking = false;
  function onScroll() {
    var y = window.scrollY;
    if (header) header.classList.toggle('is-scrolled', y > 10);
    if (toTop) toTop.classList.toggle('is-visible', y > 700);
    var current = -1;
    sections.forEach(function (s, i) { if (s && s.getBoundingClientRect().top < 160) current = i; });
    navLinks.forEach(function (a, i) { a.classList.toggle('is-active', i === current); });
    ticking = false;
  }
  window.addEventListener('scroll', function () { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } }, { passive: true });
  onScroll();
  if (toTop) toTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
  $$('.mobile-nav a').forEach(function (a) {
    a.addEventListener('click', function () { var d = a.closest('.drawer'); if (d) closeLayer(d); });
  });

  /* ---------- انیمیشن ورود ---------- */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    $$('.reveal').forEach(function (el) { io.observe(el); });
  } else {
    $$('.reveal').forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- شمارش معکوس ----------
   * روی عنصر .countdown یکی از این دو را بگذارید:
   *   data-deadline="2026-12-21T23:59:00+03:30"  تاریخ پایان ثابت
   *   data-days="3"                               پایان متحرک: چند روز بعد از اولین بازدید هر کاربر
   */
  $$('.countdown').forEach(function (cd) {
    var end;
    if (cd.hasAttribute('data-daily')) {
      var mid = new Date(); mid.setHours(24, 0, 0, 0); end = mid.getTime();
    } else if (cd.dataset.deadline) {
      end = new Date(cd.dataset.deadline).getTime();
    } else {
      var k = 'jashn_cd_' + STORE;
      end = store.get(k, 0);
      var span = (+cd.dataset.days || 3) * 864e5;
      if (!end || end < Date.now()) { end = Date.now() + span; store.set(k, end); }
    }
    var parts = { d: $('[data-cd="d"]', cd), h: $('[data-cd="h"]', cd), m: $('[data-cd="m"]', cd), s: $('[data-cd="s"]', cd) };
    function pad(n) { return String(n < 10 ? '0' + n : n).replace(/\d/g, function (x) { return '۰۱۲۳۴۵۶۷۸۹'[x]; }); }
    function tick() {
      var diff = Math.max(0, end - Date.now());
      var d = Math.floor(diff / 864e5), h = Math.floor(diff / 36e5) % 24, m = Math.floor(diff / 6e4) % 60, s = Math.floor(diff / 1e3) % 60;
      if (parts.d) parts.d.textContent = pad(d);
      if (parts.h) parts.h.textContent = pad(h);
      if (parts.m) parts.m.textContent = pad(m);
      if (parts.s) parts.s.textContent = pad(s);
      if (!diff) {
        if (cd.hasAttribute('data-daily')) { var m2 = new Date(); m2.setHours(24, 0, 0, 0); end = m2.getTime(); return; }
        cd.classList.add('is-ended'); clearInterval(timer);
      }
    }
    var timer = setInterval(tick, 1000);
    tick();
  });

  /* ---------- اطلاعات محصول از روی کارت ---------- */
  function readProduct(el) {
    var d = el.dataset;
    return { id: d.id, name: d.name, price: +d.price, old: +d.old || 0, img: d.img, desc: d.desc || '', cat: d.catName || '', rating: d.rating || '', reviews: d.reviews || '' };
  }
  function findProduct(id) {
    var el = document.querySelector('[data-product][data-id="' + id + '"]');
    return el ? readProduct(el) : null;
  }

  /* ---------- سبد خرید ---------- */
  var cart = store.get(KEY_CART, []);
  var cartBody = $('#cart-items');
  var cartFoot = $('#cart-foot');
  var cartCounts = $$('[data-cart-count]');

  function saveCart() { store.set(KEY_CART, cart); renderCart(); }
  function cartTotal() { return cart.reduce(function (s, i) { return s + i.price * i.qty; }, 0); }
  function cartQty() { return cart.reduce(function (s, i) { return s + i.qty; }, 0); }
  function addToCart(p, qty) {
    qty = qty || 1;
    var ex = cart.find(function (i) { return i.id === p.id; });
    if (ex) ex.qty = Math.min(99, ex.qty + qty);
    else cart.push({ id: p.id, name: p.name, price: p.price, img: p.img, qty: qty });
    saveCart();
    toast('«' + esc(p.name) + '» به سبد خرید اضافه شد', 'check');
    $$('.cart-btn').forEach(function (b) { b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); });
  }
  function renderCart() {
    var q = cartQty();
    cartCounts.forEach(function (c) { c.textContent = q ? fa(q) : ''; if (q) c.removeAttribute('data-zero'); else c.setAttribute('data-zero', ''); });
    if (!cartBody) return;
    showStep('items');
    if (!cart.length) {
      cartBody.innerHTML = '<div class="empty-state"><span class="es-icon">' + icon('bag') + '</span><h3>سبد خرید شما خالی است</h3><p>محصولات پیشنهادی جشنواره را ببینید و به سبد اضافه کنید.</p><button type="button" class="btn btn--primary btn--sm" data-cart-shop>مشاهده‌ی محصولات</button></div>';
      cartFoot.hidden = true;
      var shop = $('[data-cart-shop]', cartBody);
      if (shop) shop.addEventListener('click', function () { closeLayer($('#cart')); location.hash = '#products'; });
      return;
    }
    cartFoot.hidden = false;
    cartBody.innerHTML = cart.map(function (i) {
      return '<div class="cart-item" data-id="' + esc(i.id) + '">' +
        '<img src="' + esc(i.img) + '" alt="" width="72" height="72" loading="lazy">' +
        '<div><h4>' + esc(i.name) + '</h4><div class="price-now">' + money(i.price) + '</div>' +
        '<div class="qty" role="group" aria-label="تعداد"><button type="button" data-q="+1" aria-label="افزایش">' + icon('plus') + '</button>' +
        '<input type="number" min="1" max="99" value="' + i.qty + '" aria-label="تعداد" inputmode="numeric">' +
        '<button type="button" data-q="-1" aria-label="کاهش">' + icon('minus') + '</button></div></div>' +
        '<button type="button" class="cart-remove" aria-label="حذف از سبد">' + icon('trash') + '</button></div>';
    }).join('');
    var total = cartTotal();
    var ship = FREE_SHIP && total >= FREE_SHIP ? 0 : SHIP_COST;
    $('[data-sum="sub"]').innerHTML = money(total);
    $('[data-sum="ship"]').innerHTML = ship ? money(ship) : 'رایگان';
    $('[data-sum="total"]').innerHTML = money(total + ship);
    var fs = $('[data-free-ship-msg]');
    if (fs && FREE_SHIP) {
      var left = FREE_SHIP - total;
      fs.innerHTML = (left > 0 ? fa(left) + ' تومان تا ارسال رایگان مانده است' : 'ارسال سفارش شما رایگان است') +
        '<div class="sold-bar"><span style="--p:' + Math.min(100, total / FREE_SHIP * 100) + '%"></span></div>';
    }
  }
  if (cartBody) {
    cartBody.addEventListener('click', function (e) {
      var row = e.target.closest('.cart-item'); if (!row) return;
      var item = cart.find(function (i) { return i.id === row.dataset.id; }); if (!item) return;
      var qb = e.target.closest('[data-q]');
      if (qb) { item.qty = Math.max(1, Math.min(99, item.qty + (+qb.dataset.q))); saveCart(); }
      if (e.target.closest('.cart-remove')) { cart = cart.filter(function (i) { return i !== item; }); saveCart(); toast('از سبد خرید حذف شد', 'trash'); }
    });
    cartBody.addEventListener('change', function (e) {
      if (!e.target.matches('input')) return;
      var row = e.target.closest('.cart-item');
      var item = cart.find(function (i) { return i.id === row.dataset.id; });
      item.qty = Math.max(1, Math.min(99, parseInt(e.target.value, 10) || 1)); saveCart();
    });
  }

  /* مراحل سبد: اقلام ← فرم ← تأیید */
  function showStep(step) {
    $$('[data-step]').forEach(function (s) { s.hidden = s.dataset.step !== step; });
    if (cartFoot && step !== 'items') cartFoot.hidden = true;
    var title = $('#cart-title');
    if (title) title.textContent = { items: 'سبد خرید', form: 'اطلاعات ارسال', done: 'سفارش ثبت شد' }[step];
  }
  $$('[data-go-step]').forEach(function (b) {
    b.addEventListener('click', function () { showStep(b.dataset.goStep); var f = $('[data-step="' + b.dataset.goStep + '"] input'); if (f) f.focus(); });
  });

  var checkout = $('#checkout-form');
  if (checkout) {
    var rules = {
      name: function (v) { return v.trim().length >= 3 || 'نام و نام خانوادگی را کامل بنویسید.'; },
      phone: function (v) { var n = v.replace(/[۰-۹]/g, function (d) { return '۰۱۲۳۴۵۶۷۸۹'.indexOf(d); }).replace(/\D/g, ''); return /^09\d{9}$/.test(n) || 'شماره‌ی موبایل باید ۱۱ رقم و با ۰۹ شروع شود.'; },
      address: function (v) { return v.trim().length >= 10 || 'آدرس را کامل‌تر بنویسید.'; }
    };
    checkout.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      Object.keys(rules).forEach(function (k) {
        var input = checkout.elements[k]; if (!input) return;
        var res = rules[k](input.value);
        var field = input.closest('.field');
        field.classList.toggle('has-error', res !== true);
        if (res !== true) { $('.field-error', field).textContent = res; if (ok) input.focus(); ok = false; }
      });
      if (!ok) return;
      /* در نسخه‌ی واقعی، این‌جا اطلاعات را به درگاه پرداخت یا سرور خود بفرستید. */
      var code = 'JS-' + Math.floor(100000 + Math.random() * 899999);
      $('[data-order-code]').textContent = code;
      $('[data-order-name]').textContent = checkout.elements.name.value.trim();
      cart = []; store.set(KEY_CART, cart);
      checkout.reset();
      renderCart();
      showStep('done');
    });
    $$('input, textarea', checkout).forEach(function (i) {
      i.addEventListener('input', function () { i.closest('.field').classList.remove('has-error'); });
    });
  }

  /* ---------- دکمه‌های افزودن به سبد ---------- */
  document.addEventListener('click', function (e) {
    var add = e.target.closest('[data-add]');
    if (add) {
      e.preventDefault();
      var src = add.closest('[data-product]') || document.querySelector('[data-product][data-id="' + add.dataset.add + '"]');
      if (!src) return;
      var qtyInput = add.dataset.qty ? document.getElementById(add.dataset.qty) : null;
      addToCart(readProduct(src), qtyInput ? Math.max(1, parseInt(qtyInput.value, 10) || 1) : 1);
      if (add.closest('.modal')) closeLayer(add.closest('.modal'));
    }
    var all = e.target.closest('[data-add-all]');
    if (all) {
      var box = all.closest('section');
      $$('[data-product]', box).forEach(function (el) {
        var p = readProduct(el), ex = cart.find(function (i) { return i.id === p.id; });
        if (ex) ex.qty = Math.min(99, ex.qty + 1); else cart.push({ id: p.id, name: p.name, price: p.price, img: p.img, qty: 1 });
      });
      saveCart(); toast('همه‌ی محصولات این ست به سبد اضافه شد', 'check'); openLayer($('#cart'));
    }
    var buy = e.target.closest('[data-buy-now]');
    if (buy) {
      e.preventDefault();
      var s2 = buy.closest('[data-product]');
      if (s2) { addToCart(readProduct(s2), 1); openLayer($('#cart')); }
    }
  });

  /* ---------- تعداد در محصول ویژه ---------- */
  $$('.qty[data-standalone]').forEach(function (q) {
    var input = $('input', q);
    $$('[data-q]', q).forEach(function (b) {
      b.addEventListener('click', function () { input.value = Math.max(1, Math.min(99, (parseInt(input.value, 10) || 1) + (+b.dataset.q))); });
    });
  });

  /* ---------- علاقه‌مندی ---------- */
  var wish = store.get(KEY_WISH, []);
  var wishCounts = $$('[data-wish-count]');
  function renderWish() {
    $$('[data-wish]').forEach(function (b) {
      var on = wish.indexOf(b.dataset.wish) > -1;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', on);
    });
    wishCounts.forEach(function (c) { c.textContent = wish.length ? fa(wish.length) : ''; if (wish.length) c.removeAttribute('data-zero'); else c.setAttribute('data-zero', ''); });
  }
  document.addEventListener('click', function (e) {
    var w = e.target.closest('[data-wish]'); if (!w) return;
    var id = w.dataset.wish, i = wish.indexOf(id);
    if (i > -1) { wish.splice(i, 1); toast('از علاقه‌مندی‌ها حذف شد', 'heart'); }
    else { wish.push(id); toast('به علاقه‌مندی‌ها اضافه شد', 'heart'); }
    store.set(KEY_WISH, wish); renderWish(); renderWishList();
  });
  var wishBody = $('#wish-items');
  function renderWishList() {
    if (!wishBody) return;
    var items = wish.map(findProduct).filter(Boolean);
    if (!items.length) {
      wishBody.innerHTML = '<div class="empty-state"><span class="es-icon">' + icon('heart') + '</span><h3>فهرست علاقه‌مندی‌ها خالی است</h3><p>روی آیکون قلب هر محصول بزنید تا این‌جا ذخیره شود.</p><button type="button" class="btn btn--primary btn--sm" data-go-products>مشاهده‌ی محصولات</button></div>';
      return;
    }
    wishBody.innerHTML = items.map(function (p) {
      return '<div class="wish-item" data-product data-id="' + esc(p.id) + '" data-name="' + esc(p.name) + '" data-price="' + p.price + '" data-old="' + p.old + '" data-img="' + esc(p.img) + '" data-desc="' + esc(p.desc) + '" data-cat-name="' + esc(p.cat) + '" data-rating="' + esc(p.rating) + '" data-reviews="' + esc(p.reviews) + '">' +
        '<img src="' + esc(p.img) + '" alt="" width="72" height="72" loading="lazy">' +
        '<div><h4>' + esc(p.name) + '</h4><div class="price-now">' + money(p.price) + '</div><button type="button" class="btn btn--primary" data-add>' + icon('bag') + 'افزودن به سبد</button></div>' +
        '<button type="button" class="cart-remove" data-wish="' + esc(p.id) + '" aria-label="حذف از علاقه‌مندی‌ها">' + icon('trash') + '</button></div>';
    }).join('');
  }
  document.addEventListener('click', function (e) {
    var g = e.target.closest('[data-go-products]'); if (!g) return;
    var layer = g.closest('.drawer'); if (layer) closeLayer(layer);
    document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
  });

  /* ---------- پیش‌نمایش سریع محصول ---------- */
  var qv = $('#quickview');
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-quick], [data-quick-id]'); if (!b || !qv) return;
    e.preventDefault();
    var card = b.dataset.quickId ? document.querySelector('[data-product][data-id="' + b.dataset.quickId + '"]') : b.closest('[data-product]');
    if (!card) return;
    var p = readProduct(card);
    var off = p.old ? Math.round((1 - p.price / p.old) * 100) : 0;
    $('.qv-media img', qv).src = p.img;
    $('.qv-media img', qv).alt = p.name;
    $('[data-qv="cat"]', qv).textContent = p.cat;
    $('[data-qv="name"]', qv).textContent = p.name;
    $('[data-qv="desc"]', qv).textContent = p.desc;
    $('[data-qv="rating"]', qv).innerHTML = '<span class="stars"><i style="--w:' + (p.rating / 5 * 100) + '%"></i></span> ' + fa(p.rating) + ' از ' + fa(p.reviews) + ' نظر';
    $('[data-qv="price"]', qv).innerHTML = '<span class="price-now">' + money(p.price) + '</span>' + (p.old ? '<span class="price-old">' + fa(p.old) + '</span><span class="chip">' + fa(off) + '٪ تخفیف</span>' : '');
    var holder = $('[data-qv="holder"]', qv);
    ['id', 'name', 'price', 'old', 'img', 'desc', 'catName', 'rating', 'reviews'].forEach(function (k) { holder.dataset[k] = card.dataset[k] || ''; });
    $('[data-qv="wish"]', qv).dataset.wish = p.id;
    renderWish();
    openLayer(qv);
  });

  /* ---------- فیلتر دسته‌ها ---------- */
  var tabs = $$('.filter-tab');
  var cards = $$('.products .card');
  var moreBtn = $('[data-more]');
  var LIMIT = 8;
  var expanded = false;
  function applyFilter(cat) {
    tabs.forEach(function (t) { t.setAttribute('aria-pressed', t.dataset.filter === cat ? 'true' : 'false'); });
    var shown = 0;
    cards.forEach(function (c) {
      var match = cat === 'all' || c.dataset.cat === cat;
      var visible = match && (expanded || cat !== 'all' || shown < LIMIT);
      if (match) shown++;
      c.classList.toggle('is-hidden', !visible);
    });
    if (moreBtn) moreBtn.hidden = expanded || cat !== 'all' || cards.length <= LIMIT;
  }
  tabs.forEach(function (t) { t.addEventListener('click', function () { applyFilter(t.dataset.filter); }); });
  if (moreBtn) moreBtn.addEventListener('click', function () { expanded = true; applyFilter('all'); });
  if (tabs.length) applyFilter('all');
  /* کلیک روی دسته‌بندی‌ها: فیلتر و رفتن به محصولات */
  $$('[data-cat-link]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      expanded = true;
      applyFilter(a.dataset.catLink);
      document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
    });
  });

  /* ---------- اسلایدر نظرات ---------- */
  $$('.slider').forEach(function (sl) {
    var track = $('.slider-track', sl);
    var scope = sl.closest('section') || sl.parentNode;
    var prev = $('[data-dir="prev"]', scope), next = $('[data-dir="next"]', scope);
    var dotsWrap = $('.slider-dots', sl);
    var items = track.children;
    function step() { return items[0] ? items[0].getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 20) : 300; }
    /* در صفحه‌ی راست‌به‌چپ، scrollLeft منفی است */
    function pos() { return Math.abs(track.scrollLeft); }
    function update() {
      var max = track.scrollWidth - track.clientWidth - 4;
      if (dotsWrap) {
        var idx = Math.round(pos() / step());
        $$('button', dotsWrap).forEach(function (d, i) { d.setAttribute('aria-current', i === idx ? 'true' : 'false'); });
      }
    }
    if (dotsWrap) {
      dotsWrap.innerHTML = Array.prototype.map.call(items, function (_, i) { return '<button type="button" aria-label="نظر ' + fa(i + 1) + '"></button>'; }).join('');
      $$('button', dotsWrap).forEach(function (d, i) { d.addEventListener('click', function () { track.scrollTo({ left: -i * step(), behavior: 'smooth' }); }); });
    }
    function atEnd() { return pos() >= track.scrollWidth - track.clientWidth - 4; }
    function goNext() { if (atEnd()) track.scrollTo({ left: 0, behavior: 'smooth' }); else track.scrollBy({ left: -step(), behavior: 'smooth' }); }
    function goPrev() { if (pos() <= 4) track.scrollTo({ left: -(track.scrollWidth - track.clientWidth), behavior: 'smooth' }); else track.scrollBy({ left: step(), behavior: 'smooth' }); }
    if (prev) prev.addEventListener('click', function () { goPrev(); restart(); });
    if (next) next.addEventListener('click', function () { goNext(); restart(); });
    /* حرکت خودکار؛ با رفتن نشانگر یا لمس متوقف می‌شود */
    var auto = null, paused = false;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function restart() { if (reduce) return; clearInterval(auto); auto = setInterval(function () { if (!paused && !document.hidden) goNext(); }, +sl.dataset.autoplay || 5500); }
    ['mouseenter', 'focusin', 'touchstart'].forEach(function (ev) { sl.addEventListener(ev, function () { paused = true; }, { passive: true }); });
    ['mouseleave', 'focusout'].forEach(function (ev) { sl.addEventListener(ev, function () { paused = false; }); });
    sl.addEventListener('touchend', function () { setTimeout(function () { paused = false; }, 4000); }, { passive: true });
    track.addEventListener('scroll', function () { requestAnimationFrame(update); }, { passive: true });
    window.addEventListener('resize', update);
    restart();
    update();
  });

  /* ---------- سوالات متداول ---------- */
  $$('.faq-item').forEach(function (item) {
    var q = $('.faq-q', item);
    q.addEventListener('click', function () {
      var open = item.classList.toggle('is-open');
      q.setAttribute('aria-expanded', open);
    });
  });

  /* ---------- خبرنامه ---------- */
  $$('.news-form').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = $('input', f), msg = f.parentNode.querySelector('.news-msg');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim())) {
        msg.textContent = 'لطفاً یک ایمیل معتبر وارد کنید.'; input.focus(); return;
      }
      msg.innerHTML = 'عضویت شما ثبت شد. کد تخفیف شما: <span class="coupon"><span>' + esc(f.dataset.code) + '</span><button type="button" data-copy="' + esc(f.dataset.code) + '">کپی</button></span>';
      input.value = '';
    });
  });
  document.addEventListener('click', function (e) {
    var c = e.target.closest('[data-copy]'); if (!c) return;
    var text = c.dataset.copy;
    var done = function () { toast('کد تخفیف کپی شد', 'check'); };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, done);
    else { var t = document.createElement('textarea'); t.value = text; body.appendChild(t); t.select(); try { document.execCommand('copy'); } catch (er) { /* */ } t.remove(); done(); }
  });

  /* ---------- گالری (نمایش بزرگ عکس) ---------- */
  var lb = $('#lightbox');
  $$('[data-lightbox]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      if (!lb) return;
      e.preventDefault();
      var img = $('img', lb); img.src = a.getAttribute('href'); img.alt = $('img', a).alt;
      openLayer(lb);
    });
  });

  /* ---------- اجرای اولیه ---------- */
  renderCart();
  renderWish();
  renderWishList();
})();
