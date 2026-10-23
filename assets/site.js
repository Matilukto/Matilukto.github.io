/* Matt De Leon portfolio: shared behaviour for the home page and project pages */
(function () {
  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  window.addEventListener('load', function () {
    setTimeout(function () { root.classList.add('ready'); }, 50);
  });

  /* ---------- theme ---------- */
  function setTheme(t) {
    root.setAttribute('data-theme', t);
    try { localStorage.setItem('md-theme', t); } catch (e) {}
  }
  document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      setTheme(root.getAttribute('data-theme') === 'light' ? 'dark' : 'light');
    });
  });

  /* ---------- mobile menu ---------- */
  var menuBtn = document.querySelector('.menu-btn');
  var tabs = document.querySelector('.tabs');
  if (menuBtn && tabs) {
    menuBtn.addEventListener('click', function () {
      var open = tabs.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    tabs.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        tabs.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- letters that jump on hover ---------- */
  document.querySelectorAll('[data-jump]').forEach(function (el) {
    var text = el.textContent.trim().replace(/\s+/g, ' ');
    el.setAttribute('aria-label', text);
    el.textContent = '';
    text.split(' ').forEach(function (word, i, all) {
      var w = document.createElement('span');
      w.className = 'jw';
      w.setAttribute('aria-hidden', 'true');
      word.split('').forEach(function (ch) {
        var l = document.createElement('span');
        l.className = 'jl' + (ch === '.' ? ' dot-accent' : '');
        l.textContent = ch;
        w.appendChild(l);
      });
      el.appendChild(w);
      if (i < all.length - 1) el.appendChild(document.createTextNode(' '));
    });
  });

  /* ---------- active tab while reading ---------- */
  var tabLinks = Array.prototype.slice.call(document.querySelectorAll('.tabs a[href^="#"]'));
  if (tabLinks.length && 'IntersectionObserver' in window) {
    var byId = {};
    tabLinks.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        tabLinks.forEach(function (a) { a.classList.remove('active'); });
        if (byId[en.target.id]) byId[en.target.id].classList.add('active');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(byId).forEach(function (id) {
      var s = document.getElementById(id);
      if (s) io.observe(s);
    });
  }

  /* ---------- Leo the lion ---------- */
  var COLORS = { M: '#9A4E12', m: '#D9822B', F: '#F2C14E', E: '#1A1A1A', N: '#5A3A22', W: '#FFF4D6', P: '#E86A6A' };
  var leoState = { ex: 0, ey: 0, blink: false, talk: false };
  var leoGrids = [];

  function leoRows() {
    var base = [
      '...MMMMMMMM...',
      '..MmmmmmmmmM..',
      '.MmmFFmmFFmmM.',
      'MmmFFFFFFFFmmM',
      'MmFFFFFFFFFFmM',
      'MmFFFFFFFFFFmM',
      'MmFFFFFFFFFFmM',
      'MmFFFFFFFFFFmM',
      'MmFFFWNNWFFFmM',
      leoState.talk ? 'MmFFWWEEWWFFmM' : 'MmFFWWWWWWFFmM',
      leoState.talk ? '.MmFFWPPWFFmM.' : '.MmFFWWWWFFmM.',
      '..MmmFFFFmmM..',
      '...MMmmmmMM...',
      '....MMMMMM....'
    ].map(function (r) { return r.split(''); });
    var top = 5 + leoState.ey;
    var rows = leoState.blink ? [top + 1] : [top, top + 1];
    [3 + leoState.ex, 9 + leoState.ex].forEach(function (c) {
      rows.forEach(function (r) { base[r][c] = 'E'; base[r][c + 1] = 'E'; });
    });
    return base;
  }
  function paintLeo() {
    var rows = leoRows();
    leoGrids.forEach(function (g) {
      var cells = g.children, k = 0;
      rows.forEach(function (r) {
        r.forEach(function (ch) { cells[k++].style.background = ch === '.' ? 'transparent' : COLORS[ch]; });
      });
    });
  }
  document.querySelectorAll('.leo-grid').forEach(function (g) {
    for (var i = 0; i < 196; i++) g.appendChild(document.createElement('i'));
    leoGrids.push(g);
  });
  if (leoGrids.length) {
    paintLeo();
    if (!reduceMotion) {
      setInterval(function () {
        leoState.blink = true; paintLeo();
        setTimeout(function () { leoState.blink = false; paintLeo(); }, 160);
      }, 3800);
    }
  }

  var leoFace = document.getElementById('leo-face');
  var leoBtn = document.querySelector('.leo');
  var leoMsg = document.getElementById('leo-msg');
  var messages = ['Psst, press me.', "Rawr! I'm Leo, Matt's sidekick."];
  var msgIndex = 0, jumps = 0, talkTimer;
  if (leoBtn && leoFace) {
    leoBtn.addEventListener('click', function () {
      msgIndex = (msgIndex + 1) % messages.length;
      if (leoMsg) leoMsg.textContent = messages[msgIndex];
      leoState.talk = true; paintLeo();
      clearTimeout(talkTimer);
      talkTimer = setTimeout(function () { leoState.talk = false; paintLeo(); }, 500);
      if (!reduceMotion) {
        jumps++;
        leoFace.classList.remove('jump-a', 'jump-b');
        leoFace.classList.add(jumps % 2 ? 'jump-a' : 'jump-b');
      }
    });
  }

  /* ---------- mouse: Leo's eyes, hero dots, card tilt ---------- */
  var dotfield = document.querySelector('.dotfield');
  var hero = document.querySelector('.hero');
  var flipper = document.querySelector('.flipper');
  var flipped = false, tiltX = 0, tiltY = 0, pending = null;

  function applyCard() {
    if (!flipper) return;
    flipper.style.transform = 'rotateX(' + tiltX.toFixed(2) + 'deg) rotateY(' + ((flipped ? 180 : 0) + tiltY).toFixed(2) + 'deg)';
  }
  document.querySelectorAll('[data-flip]').forEach(function (b) {
    b.addEventListener('click', function () { flipped = !flipped; applyCard(); });
  });

  function onMove(x, y) {
    if (leoFace) {
      var r = leoFace.getBoundingClientRect();
      var dx = x - (r.left + r.width / 2), dy = y - (r.top + r.height / 2);
      var ex = Math.abs(dx) < 50 ? 0 : (dx < 0 ? -1 : 1);
      var ey = Math.abs(dy) < 50 ? 0 : (dy < 0 ? -1 : 1);
      if (ex !== leoState.ex || ey !== leoState.ey) { leoState.ex = ex; leoState.ey = ey; paintLeo(); }
    }
    if (dotfield) {
      var f = dotfield.getBoundingClientRect();
      dotfield.style.setProperty('--mx', (x - f.left) + 'px');
      dotfield.style.setProperty('--my', (y - f.top) + 'px');
    }
    if (hero && flipper && !reduceMotion) {
      var h = hero.getBoundingClientRect();
      if (y >= h.top && y <= h.bottom) {
        var mx = Math.min(1, Math.max(0, (x - h.left) / h.width));
        var my = Math.min(1, Math.max(0, (y - h.top) / h.height));
        tiltX = (0.5 - my) * 10;
        tiltY = (mx - 0.5) * 14 * (flipped ? -1 : 1);
      } else { tiltX = 0; tiltY = 0; }
      applyCard();
    }
  }
  window.addEventListener('mousemove', function (e) {
    var x = e.clientX, y = e.clientY;
    if (pending) return;
    pending = requestAnimationFrame(function () { pending = null; onMove(x, y); });
  });
  document.addEventListener('mouseleave', function () {
    if (dotfield) { dotfield.style.setProperty('--mx', '-999px'); dotfield.style.setProperty('--my', '-999px'); }
    tiltX = 0; tiltY = 0; applyCard();
  });

  /* ---------- intro loader ---------- */
  var loader = document.querySelector('.loader');
  function runIntro() {
    if (!loader) return;
    var pct = loader.querySelector('.pct'), bar = loader.querySelector('.bar i'), n = 0;
    loader.classList.remove('done');
    loader.style.display = 'flex';
    if (reduceMotion) { loader.classList.add('done'); return; }
    var t = setInterval(function () {
      n = Math.min(100, n + 4 + Math.floor(Math.random() * 7));
      pct.textContent = n + '%';
      bar.style.width = n + '%';
      if (n >= 100) {
        clearInterval(t);
        setTimeout(function () { loader.classList.add('done'); }, 250);
        setTimeout(function () { loader.style.display = 'none'; }, 750);
      }
    }, 60);
  }
  if (loader) {
    // play the intro once per visit; coming back from a project page skips it
    var seen = false;
    try { seen = !!sessionStorage.getItem('md-intro'); sessionStorage.setItem('md-intro', '1'); } catch (e) {}
    if (seen) loader.style.display = 'none'; else runIntro();
    var replay = document.querySelector('[data-replay]');
    if (replay) replay.addEventListener('click', function () { window.scrollTo(0, 0); runIntro(); });
  }

  /* ---------- contact: copy buttons ---------- */
  function copyText(text, done) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text); done(); });
    } else { fallbackCopy(text); done(); }
  }
  function fallbackCopy(text) {
    var t = document.createElement('textarea');
    t.value = text; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.opacity = '0';
    document.body.appendChild(t); t.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(t);
  }
  document.querySelectorAll('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      copyText(b.getAttribute('data-copy'), function () {
        b.classList.add('done');
        setTimeout(function () { b.classList.remove('done'); }, 1600);
      });
    });
  });

  /* ---------- contact form, sent through EmailJS ---------- */
  var EMAILJS = {
    service: 'service_0vdtmje',
    publicKey: 'j-KHA2iNu48FCcG6T',
    toMatt: 'template_5d3z6pn',
    autoReply: 'template_ehcqdje'
  };
  var form = document.getElementById('contact-form');
  if (form) {
    var status = form.querySelector('.c-status');
    var sendBtn = form.querySelector('.send');
    var msg = form.elements.message;
    var count = form.querySelector('.count');
    var defaultNote = status.innerHTML;
    var direct = 'Email me directly at <a href="mailto:matttyronedeleon@gmail.com">matttyronedeleon@gmail.com</a>.';
    msg.addEventListener('input', function () { count.textContent = msg.value.length + '/1000'; });
    form.querySelectorAll('.in').forEach(function (el) {
      el.addEventListener('input', function () {
        el.classList.remove('bad');
        if (status.classList.contains('err')) setStatus('', defaultNote);
      });
    });
    function setStatus(cls, html) { status.className = 'c-status' + (cls ? ' ' + cls : ''); status.innerHTML = html; }
    function send(template, params) {
      return fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service_id: EMAILJS.service, template_id: template, user_id: EMAILJS.publicKey, template_params: params })
      }).then(function (r) { if (!r.ok) throw new Error('EmailJS ' + r.status); });
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (form.elements.company_site.value) return; // bots fill the hidden field
      var bad = [];
      ['first_name', 'last_name', 'email', 'message'].forEach(function (n) {
        var el = form.elements[n];
        el.value = el.value.trim();
        if (!el.value || (n === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value))) { el.classList.add('bad'); bad.push(el); }
      });
      if (bad.length) { bad[0].focus(); setStatus('err', 'Please fill in your name, a valid email and a message.'); return; }
      var params = {
        topic: form.querySelector('input[name="topic"]:checked').value,
        first_name: form.elements.first_name.value,
        last_name: form.elements.last_name.value,
        email: form.elements.email.value,
        message: form.elements.message.value
      };
      if (EMAILJS.toMatt.indexOf('TEMPLATE_') === 0) { setStatus('err', 'The form isn\'t connected yet. ' + direct); return; }
      sendBtn.disabled = true;
      sendBtn.querySelector('span').textContent = 'Sending...';
      send(EMAILJS.toMatt, params).then(function () {
        send(EMAILJS.autoReply, params).catch(function () {});
        form.reset(); count.textContent = '0/1000';
        setStatus('ok', 'Thanks, ' + params.first_name.replace(/[<>&"]/g, '') + '! Your message is on its way. Check your inbox for a confirmation.');
      }).catch(function () {
        setStatus('err', 'Sorry, that didn\'t send. ' + direct);
      }).then(function () {
        sendBtn.disabled = false;
        sendBtn.querySelector('span').textContent = 'Send message';
      });
    });
    form.addEventListener('reset', function () { setTimeout(function () { if (!status.classList.contains('ok')) setStatus('', defaultNote); }, 0); });
  }

  /* ---------- click a screenshot to zoom ---------- */
  var shots = document.querySelectorAll('img.shot');
  if (shots.length) {
    var lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-label', 'Screenshot');
    var big = document.createElement('img');
    lb.appendChild(big);
    document.body.appendChild(lb);
    function close() { lb.classList.remove('open'); }
    lb.addEventListener('click', close);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    shots.forEach(function (img) {
      img.addEventListener('click', function () {
        big.src = img.currentSrc || img.src;
        big.alt = img.alt;
        lb.classList.add('open');
      });
    });
  }
})();
