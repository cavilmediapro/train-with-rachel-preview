/* Train with Rachel — behaviours. Vanilla JS, no build step. */
(function () {
  var rm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var PHONE = '5096558330';

  /* tracking: GTM dataLayer events (IDs are added at launch) */
  window.dataLayer = window.dataLayer || [];
  function track(ev, data) { try { window.dataLayer.push(Object.assign({ event: ev }, data || {})); } catch (e) {} }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a'); if (!a) return;
    var h = a.getAttribute('href') || '';
    if (h.indexOf('sms:') === 0) track('text_click', { label: a.dataset.label || a.textContent.trim() });
    else if (h.indexOf('tel:') === 0) track('call_click', { label: a.dataset.label || a.textContent.trim() });
    else if (a.classList.contains('btn')) track('cta_click', { label: a.textContent.trim(), href: h });
  });

  /* header: hide on scroll down, return on scroll up */
  var hdr = document.querySelector('.hdr'), last = 0;
  if (hdr) window.addEventListener('scroll', function () {
    var y = window.scrollY; hdr.classList.toggle('hide', y > last && y > 80 && !document.body.classList.contains('menu-open')); last = y;
  }, { passive: true });

  /* phone menu */
  var menu = document.getElementById('menu');
  document.querySelectorAll('.mbtn').forEach(function (b) {
    b.addEventListener('click', function () {
      var open = !menu.classList.contains('open');
      menu.classList.toggle('open', open); document.body.classList.toggle('menu-open', open);
      document.querySelectorAll('.mbtn').forEach(function (x) { x.setAttribute('aria-expanded', open ? 'true' : 'false'); x.textContent = open ? 'Close' : 'Menu'; });
      if (open) { var f = menu.querySelector('a'); if (f) f.focus(); }
    });
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu && menu.classList.contains('open')) document.querySelector('.menu .mbtn').click(); });

  /* reveals: once, IntersectionObserver */
  var revealEls = document.querySelectorAll('.reveal, .unmask, .sms, .ticker');
  function show(el) {
    if (el.classList.contains('sms')) el.classList.add('play');
    else if (el.classList.contains('ticker')) tick(el);
    else el.classList.add('in');
  }
  if (rm || !('IntersectionObserver' in window)) { revealEls.forEach(function (el) { if (el.classList.contains('ticker')) { el.textContent = (el.dataset.prefix || '') + el.dataset.to + (el.dataset.suffix || ''); } else show(el); }); }
  else {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
    revealEls.forEach(function (el) { io.observe(el); });
    /* belt and braces: anything already scrolled past gets shown, so nothing can stay hidden */
    var sweep = function () { var line = window.scrollY + window.innerHeight * 0.92; revealEls.forEach(function (el) { if (el.classList.contains('in') || el.classList.contains('play') || el.dataset.done) return; var top = el.getBoundingClientRect().top + window.scrollY; if (top < line) { el.dataset.done = '1'; show(el); io.unobserve(el); } }); };
    window.addEventListener('scroll', sweep, { passive: true }); window.addEventListener('load', sweep); setTimeout(sweep, 300);
  }

  /* number ticker: real numbers only */
  function tick(el) {
    var to = parseFloat(el.dataset.to), dur = 1300, pre = el.dataset.prefix || '', suf = el.dataset.suffix || '', t0 = performance.now();
    (function step(t) { var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3); el.textContent = pre + Math.round(to * e) + suf; if (p < 1) requestAnimationFrame(step); })(t0);
  }

  /* card deck: tap cycles; Save opens a text with the workout name */
  document.querySelectorAll('.deck').forEach(function (deck) {
    function order() { [].forEach.call(deck.children, function (c, i) { c.style.zIndex = String(10 - i); }); }
    order();
    deck.addEventListener('click', function (e) {
      if (e.target.closest('a')) return;
      deck.appendChild(deck.firstElementChild); order(); track('card_flip', {});
    });
    deck.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { if (e.target === deck) { e.preventDefault(); deck.click(); } } });
  });
  document.querySelectorAll('.cardx').forEach(function (c) {
    var save = c.querySelector('.pill'); var name = c.querySelector('h4') ? c.querySelector('h4').textContent.trim() : 'a workout';
    if (save) { save.href = 'sms:' + PHONE + '?&body=' + encodeURIComponent('Hi Rachel! I saved "' + name + '" on your site. Can we set up a session?'); save.addEventListener('click', function () { track('card_save', { workout: name }); }); }
  });

  /* marquee: duplicate once for a seamless loop */
  document.querySelectorAll('.marquee').forEach(function (m) { var t = m.querySelector('.track'); if (!t || rm) return; t.innerHTML += t.innerHTML; if (m.dataset.speed) m.style.setProperty('--speed', m.dataset.speed + 's'); });

  /* contact form: Formspree when configured, otherwise point to text */
  var form = document.getElementById('contact-form');
  if (form) form.addEventListener('submit', function (e) {
    e.preventDefault();
    var action = form.getAttribute('action') || '';
    var msg = form.querySelector('.msg'); msg.innerHTML = '';
    if (action.indexOf('TODO') >= 0) { msg.innerHTML = '<p class="err">The form isn\'t connected yet. Text Rachel instead: <a href="sms:' + PHONE + '">(509) 655-8330</a>.</p>'; return; }
    var fd = new FormData(form);
    fetch(action, { method: 'POST', body: fd, headers: { Accept: 'application/json' } }).then(function (r) {
      if (r.ok) { form.reset(); msg.innerHTML = '<p class="ok">Sent. Rachel usually replies within the hour.</p>'; track('form_submit', {}); }
      else throw new Error('bad');
    }).catch(function () { msg.innerHTML = '<p class="err">That didn\'t send. Text Rachel instead: <a href="sms:' + PHONE + '">(509) 655-8330</a>.</p>'; });
  });

  /* thread CTA tracking */
  document.querySelectorAll('.sms .btn').forEach(function (b) { b.addEventListener('click', function () { track('thread_cta', {}); }); });
})();
