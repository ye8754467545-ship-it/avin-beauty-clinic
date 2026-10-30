(function () {
  'use strict';
  var root = document.documentElement;
  var reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  function store(key, value) { try { localStorage.setItem(key, value); } catch (e) {} }
  function digits(n, lang) { return Number(n).toLocaleString(lang === 'fa' ? 'fa-IR' : 'en-US'); }

  var messages = {
    fa: {
      name: 'لطفاً نام خود را وارد کنید.',
      phone: 'لطفاً یک شماره تماس درست وارد کنید.',
      done: 'این فرم نمایشی است و اطلاعاتی ارسال یا ذخیره نشد. در سایت واقعی، نوبت شما اینجا ثبت می‌شود.'
    },
    en: {
      name: 'Please enter your name.',
      phone: 'Please enter a valid phone number.',
      done: 'This is a demo form, so nothing was sent or saved. On a real site, your visit would be booked here.'
    }
  };

  /* Language: Persian lives in the HTML, English in data-en attributes. */
  var attrs = ['aria-label', 'alt'];
  function faKey(attr) { return 'fa' + attr.replace('-', ''); }
  var translated = $$('[data-en]');
  translated.forEach(function (el) { el.dataset.fa = el.textContent; });
  attrs.forEach(function (attr) {
    $$('[data-en-' + attr + ']').forEach(function (el) { el.dataset[faKey(attr)] = el.getAttribute(attr) || ''; });
  });

  function renderStats(lang) {
    $$('[data-stat]').forEach(function (el) {
      var n = digits(el.dataset.current || el.dataset.stat, lang);
      if (el.dataset.suffix) n += lang === 'fa' ? '٪' : '%';
      if (el.dataset.prefix) n += '+';
      if (el.dataset.unitFa) n += lang === 'fa' ? el.dataset.unitFa : el.dataset.unitEn;
      el.textContent = n;
    });
    var trust = $('#trust-count');
    trust.textContent = digits(trust.dataset.current || trust.dataset.count, lang);
  }

  function setLang(lang) {
    root.lang = lang;
    root.dir = lang === 'fa' ? 'rtl' : 'ltr';
    translated.forEach(function (el) { el.textContent = lang === 'en' ? el.dataset.en : el.dataset.fa; });
    attrs.forEach(function (attr) {
      $$('[data-en-' + attr + ']').forEach(function (el) {
        el.setAttribute(attr, lang === 'en' ? el.getAttribute('data-en-' + attr) : el.dataset[faKey(attr)]);
      });
    });
    renderStats(lang);
    splitStory();
    var msg = $('#form-msg');
    msg.textContent = '';
    msg.className = 'form-msg';
    store('avin-lang', lang);
  }
  $('#lang-btn').addEventListener('click', function () { setLang(root.lang === 'fa' ? 'en' : 'fa'); });

  /* Day and night: the header button and the routine switch share one state. */
  function setTheme(theme) {
    root.dataset.theme = theme;
    $$('[data-set-theme]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.setTheme === theme)); });
    $('meta[name=theme-color]').content = theme === 'night' ? '#110e18' : '#ffffff';
    store('avin-theme', theme);
    document.dispatchEvent(new CustomEvent('avin:theme', { detail: theme }));
  }
  $('#theme-btn').addEventListener('click', function () { setTheme(root.dataset.theme === 'night' ? 'day' : 'night'); });
  $$('[data-set-theme]').forEach(function (b) {
    b.addEventListener('click', function () { setTheme(b.dataset.setTheme); });
  });

  /* Mobile menu */
  var menuBtn = $('#menu-btn');
  var nav = $('#main-nav');
  function closeMenu() { nav.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); }
  menuBtn.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', String(open));
  });
  nav.addEventListener('click', function (e) { if (e.target.tagName === 'A') closeMenu(); });

  /* Story text lights up word by word with scroll. */
  var storyEl = $('#story-text');
  var storyWords = [];
  function splitStory() {
    var words = storyEl.textContent.trim().split(/\s+/);
    storyEl.textContent = '';
    storyWords = words.map(function (word, i) {
      var span = document.createElement('span');
      span.className = 'w';
      span.textContent = word;
      storyEl.appendChild(span);
      if (i < words.length - 1) storyEl.appendChild(document.createTextNode(' '));
      return span;
    });
    onScroll();
  }

  var header = $('.site-header');
  var story = $('#story');
  function onScroll() {
    header.classList.toggle('stuck', scrollY > 40);
    var r = story.getBoundingClientRect();
    var p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - innerHeight)));
    var lit = Math.ceil(p * 1.15 * storyWords.length);
    storyWords.forEach(function (w, i) { w.classList.toggle('on', i < lit); });
  }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);

  /* Reveal on scroll */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('seen'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    $$('.reveal').forEach(function (el, i) {
      el.style.transitionDelay = (i % 4) * 70 + 'ms';
      io.observe(el);
    });
  } else {
    $$('.reveal').forEach(function (el) { el.classList.add('seen'); });
  }

  /* Hero numbers count up once. */
  function countUp(el, from, to, duration) {
    if (reduceMotion) return;
    var start = performance.now();
    (function tick(now) {
      var t = Math.min(1, (now - start) / duration);
      el.dataset.current = Math.round(from + (to - from) * (1 - Math.pow(1 - t, 3)));
      renderStats(root.lang);
      if (t < 1) requestAnimationFrame(tick);
      else delete el.dataset.current;
    })(start);
  }

  /* Scan boxes follow the face. Keyframes were measured from the hero video,
     in pixels of a 480x540 crop of its central half, every 0.871s. */
  var track = [
    [[240,125],[210,115],[210,110],[190,100],[190,100],[200,100],[230,100],[235,110],[240,120],[240,125]],
    [[295,235],[270,225],[240,225],[230,230],[230,230],[250,230],[275,230],[295,230],[295,235],[295,235]],
    [[240,310],[220,300],[205,300],[200,295],[195,295],[205,295],[220,285],[238,298],[240,310],[240,310]]
  ];
  var video = $('#hero-video');
  var scans = $$('.scan');
  var heroVisible = true;
  function placeScans() {
    var step = 0.871;
    var t = (video.currentTime || 0) / step;
    var i = Math.min(8, Math.floor(t));
    var f = Math.min(1, t - i);
    scans.forEach(function (box, n) {
      var a = track[n][i], b = track[n][i + 1];
      var x = a[0] + (b[0] - a[0]) * f;
      var y = a[1] + (b[1] - a[1]) * f;
      box.style.left = (25 + x / 480 * 50).toFixed(2) + '%';
      box.style.top = (y / 540 * 100).toFixed(2) + '%';
    });
  }
  (function loop() {
    if (heroVisible) placeScans();
    requestAnimationFrame(loop);
  })();
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      heroVisible = entries[0].isIntersecting;
      if (reduceMotion) return;
      if (heroVisible) { var p = video.play(); if (p) p.catch(function () {}); } else video.pause();
    }).observe($('#hero'));
  }
  if (reduceMotion) { video.removeAttribute('autoplay'); video.pause(); }
  scans.forEach(function (box, n) { setTimeout(function () { box.classList.add('on'); }, reduceMotion ? 0 : 900 + n * 350); });

  /* Service cards tilt toward the pointer. */
  if (!reduceMotion && matchMedia('(hover: hover)').matches) {
    $$('.service').forEach(function (card) {
      var img = $('.service-img', card);
      card.addEventListener('pointermove', function (e) {
        var r = img.getBoundingClientRect();
        img.style.setProperty('--ry', ((e.clientX - r.left) / r.width - 0.5) * 12 + 'deg');
        img.style.setProperty('--rx', (0.5 - (e.clientY - r.top) / r.height) * 12 + 'deg');
      });
      card.addEventListener('pointerleave', function () {
        img.style.setProperty('--ry', '0deg');
        img.style.setProperty('--rx', '0deg');
      });
    });
  }

  /* Demo booking form: validates, but never sends anything. */
  var form = $('#book-form');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var t = messages[root.lang];
    var msg = $('#form-msg');
    var phone = form.phone.value.replace(/[۰-۹]/g, function (d) { return '۰۱۲۳۴۵۶۷۸۹'.indexOf(d); }).replace(/[\s-]/g, '');
    var nameBad = form.name.value.trim().length < 2;
    var phoneBad = !/^\+?\d{8,14}$/.test(phone);
    form.name.setAttribute('aria-invalid', String(nameBad));
    form.phone.setAttribute('aria-invalid', String(phoneBad));
    if (nameBad || phoneBad) {
      msg.className = 'form-msg error';
      msg.textContent = nameBad ? t.name : t.phone;
      (nameBad ? form.name : form.phone).focus();
      return;
    }
    form.reset();
    msg.className = 'form-msg';
    msg.textContent = t.done;
  });

  var saved = root.lang === 'en' ? 'en' : 'fa';
  setLang(saved);
  setTheme(root.dataset.theme === 'night' ? 'night' : 'day');
  countUp($('#trust-count'), 9700, 10000, 2600);
  $$('[data-stat]').forEach(function (el) { countUp(el, 0, Number(el.dataset.stat), 1800); });
})();
