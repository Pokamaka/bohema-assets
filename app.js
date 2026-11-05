(() => {
  const goal = (g, p, once) => { try { window.bohemaGoal && window.bohemaGoal(g, p, once); } catch { /* analytics must never break the site */ } };
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const msk = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Moscow' }));
  const today = msk.getDay();
  const isWeekend = d => d === 5 || d === 6 || d === 0;

  $$('.hours [data-d]').forEach(r => r.dataset.d.split(' ').includes(String(today)) && r.classList.add('is-today'));
  $$('.pcard[data-days]').forEach(c => c.dataset.days.split(' ').includes(String(today)) && c.classList.add('is-today'));

  /* ---------- background picker ---------- */
  const privLinks = $$('a[href^="/privacy"]');
  const syncPrivacy = () => privLinks.forEach(a => a.setAttribute('href', '/privacy?bg=' + (root.dataset.bgKey || 'leopard-live') + (root.hasAttribute('data-wine') ? '&wine=1' : '')));
  const sw = $$('.bgpick button[data-bg]');
  const setBg = v => { root.dataset.bg = v === 'leopard-live' ? 'leopard' : v; root.toggleAttribute('data-live', v === 'leopard-live'); root.dataset.bgKey = v; syncPrivacy(); sw.forEach(b => b.setAttribute('aria-checked', b.dataset.bg === v)); };
  const q = new URLSearchParams(location.search).get('bg');
  const BGS = ['espresso', 'black', 'burgundy', 'leopard', 'leopard-live', 'felt', 'brick', 'cognac', 'sand'];
  setBg(q && BGS.includes(q) ? q : (root.dataset.bgKey || 'leopard-live'));
  sw.forEach(b => b.addEventListener('click', () => { setBg(b.dataset.bg); goal('bg_change', { bg: b.textContent.trim() }); }));

  /* ---------- tabs (generic) ---------- */
  const tabSets = $$('[role=tablist]');
  const selectTab = (tab) => {
    const list = tab.closest('[role=tablist]');
    $$('[role=tab]', list).forEach(t => {
      const on = t === tab;
      t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1;
      $('#' + t.getAttribute('aria-controls')).hidden = !on;
    });
  };
  tabSets.forEach(list => {
    const tabs = $$('[role=tab]', list);
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => { selectTab(t); const sec = t.closest('section'); goal(sec && sec.id === 'menu' ? 'menu_tab' : 'tab_open', { tab: t.textContent.trim() }); });
      t.addEventListener('keydown', e => {
        const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
        if (d) { const n = tabs[(i + d + tabs.length) % tabs.length]; selectTab(n); n.focus(); }
      });
    });
  });

  /* ---------- tables ---------- */
  const DATA = (() => { try { return JSON.parse($('#site-data').textContent); } catch { return { tables: {}, prices: [] }; } })();
  const TABLES = DATA.tables;
  const tableSvg = ft => {
    const w = ft === 9 ? 280 : 250, h = w / 2, r = 14; // outer frame
    const p = 9; // pocket radius
    const pockets = [[r, r], [w / 2, r - 3], [w - r, r], [r, h - r], [w / 2, h - r + 3], [w - r, h - r]]
      .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${p}" fill="#0c0907"/>`).join('');
    const dots = [w * .25, w * .5, w * .75].map(x => `<circle cx="${x}" cy="${r / 2}" r="1.6" fill="#E9D7B5"/><circle cx="${x}" cy="${h - r / 2}" r="1.6" fill="#E9D7B5"/>`).join('');
    return `<svg viewBox="0 0 ${w} ${h}" aria-hidden="true">
      <rect x="0" y="0" width="${w}" height="${h}" rx="10" fill="var(--rail)"/>
      <rect class="t-felt" x="${r}" y="${r}" width="${w - 2 * r}" height="${h - 2 * r}" rx="3"/>
      <line x1="${w * .25}" y1="${r}" x2="${w * .25}" y2="${h - r}" stroke="rgba(255,255,255,.18)" stroke-width="1"/>
      <circle cx="${w * .25}" cy="${h / 2}" r="2" fill="rgba(255,255,255,.55)"/>
      <circle cx="${w * .72}" cy="${h / 2}" r="5" fill="#F3EADC"/>
      <circle cx="${w * .76}" cy="${h / 2 - 5}" r="5" fill="#C0392B"/>
      <circle cx="${w * .76}" cy="${h / 2 + 5}" r="5" fill="#E2B42B"/>
      <circle cx="${w * .8}" cy="${h / 2}" r="5" fill="#111"/>
      ${pockets}${dots}
    </svg>`;
  };
  const escH = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  $$('[data-tables]').forEach(g => {
    const ids = g.dataset.tables.split(' ').filter(Boolean);
    g.innerHTML = ids.map(id => {
      const t = TABLES[id]; if (!t) return '';
      const fc = t.color, fs = t.sel;
      return `<button type="button" role="radio" class="tbtn tbtn--${t.ft}" data-id="${id}" style="--felt:${fc};--felt-sel:${fs}" aria-checked="false" aria-label="${escH(t.name)}, ${t.ft} футов">
        ${tableSvg(t.ft)}
        <span class="tbtn__row">${ids.length > 1 ? `<b>${escH(t.name)}</b>` : `<b>Стол</b><span>${t.ft} футов</span>`}</span>
      </button>`;
    }).join('');
  });
  const tbtns = $$('.tbtn');
  let current = '1';
  const pickTable = id => {
    if (!TABLES[id]) return;
    current = String(id);
    tbtns.forEach(b => { const on = b.dataset.id === current; b.setAttribute('aria-checked', on); b.tabIndex = on ? 0 : -1; });
    const t = TABLES[current];
    $('[data-t-name]').textContent = t.name;
    $('[data-t-size]').textContent = `${t.hall} · ${t.ft} футов${t.field ? ` · поле ${t.field}` : ''}`;
  };
  tbtns.forEach((b, i) => {
    b.addEventListener('click', () => { pickTable(b.dataset.id); const t = TABLES[b.dataset.id]; if (t) goal('table_pick', { table: t.name, hall: t.hall }); });
    b.addEventListener('keydown', e => {
      const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (d) { e.preventDefault(); const n = tbtns[(i + d + tbtns.length) % tbtns.length]; pickTable(n.dataset.id); n.focus(); }
    });
  });
  pickTable(1);

  /* ---------- booking: Restoplace ---------- */
  const BK = DATA.booking || { mode: 'off' };
  const f = $('.bform'), msg = $('.bform__msg');
  const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  // official widget.js is loaded and has built its modal → let it handle the click
  const rpWidget = () => BK.mode === 'widget' && !!document.getElementById('restoplace-modal');
  // "link" mode: widget page in our own window, with the table / date / guests already chosen
  const dlg = $('.rpw'), frame = dlg && $('iframe', dlg);
  const rpUrl = (o = {}) => {
    const u = new URL(BK.url);
    const p = { nostep: BK.address ? 1 : '', address: BK.address, step_type: BK.step, source: BK.source, ...o };
    Object.entries(p).forEach(([k, v]) => v !== '' && v != null && v !== 0 && u.searchParams.set(k, v));
    return u.toString();
  };
  const openRp = (o, from) => {
    goal('book_open', { from, mode: BK.mode });
    if (BK.mode !== 'link' || !dlg) return false;
    const url = rpUrl(o);
    if (frame.src !== url) frame.src = url;
    $('.rpw__ext', dlg).href = url;
    if (typeof dlg.showModal !== 'function') { window.open(url, '_blank', 'noopener'); return true; }
    dlg.showModal(); root.classList.add('rpw-open');
    return true;
  };
  if (dlg) {
    $('.rpw__x', dlg).addEventListener('click', () => dlg.close());
    dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('close', () => root.classList.remove('rpw-open'));
  }

  /* any "book" link: open Restoplace (or our booking tab), preselect table */
  $$('[data-book]').forEach(a => a.addEventListener('click', e => {
    const sec = a.closest('section[id], header, footer');
    const from = sec ? (sec.id || sec.tagName.toLowerCase()) : '';
    goal('book_click', { from });
    if (a.dataset.table) pickTable(a.dataset.table);
    const t = TABLES[current];
    if (BK.mode === 'widget' && rpWidget()) { e.preventDefault(); goal('book_open', { from, mode: 'widget' }); return; }
    // widget script blocked or not loaded yet → its page in a new tab, if the link is known
    if (BK.mode === 'widget' && BK.url) { e.preventDefault(); window.open(BK.url, '_blank', 'noopener'); goal('book_open', { from, mode: 'widget-link' }); return; }
    if (BK.mode === 'link' && openRp({ open_item: t && t.rp, date: '' }, from)) { e.preventDefault(); return; }
    selectTab($('#t-book'));
  }));

  /* ---------- booking form ---------- */
  f.date.value = iso(msk); f.date.min = iso(msk);
  const hoursWord = n => n === 1 ? 'час' : 'часа';
  const calc = () => {
    const d = new Date(f.date.value + 'T12:00').getDay();
    const dur = +f.querySelector('[name=dur]:checked').value;
    const card = DATA.prices.find(p => p.days.includes(d)) || DATA.prices[0] || { price: 0 };
    const rate = card.price;
    $('[data-sum]').textContent = (rate * dur).toLocaleString('ru-RU') + ' ₽';
    $('[data-sum-note]').textContent = `${isWeekend(d) ? 'Выходной' : 'Будний день'} · ${dur} ${hoursWord(dur)}`;
  };
  f.addEventListener('change', calc); f.addEventListener('input', calc); calc();
  const submitGoal = () => {
    const d = new Date(f.date.value + 'T12:00').getDay(), dur = +f.querySelector('[name=dur]:checked').value;
    const card = DATA.prices.find(p => p.days.includes(d)) || DATA.prices[0] || { price: 0 };
    goal('book_submit', { table: TABLES[current].name, hall: TABLES[current].hall, hours: dur, day: isWeekend(d) ? 'выходной' : 'будний', time: f.time ? f.time.value : '', sum: card.price * dur, mode: BK.mode });
  };
  const btn = $('button[type=submit]', f);
  const say = (kind, text) => { msg.className = 'bform__msg' + (kind ? ' ' + kind : ''); msg.textContent = text; };
  f.addEventListener('submit', async e => {
    e.preventDefault();
    if (BK.mode === 'widget' && !rpWidget() && BK.url) { window.open(BK.url, '_blank', 'noopener'); return; }
    if (BK.mode === 'widget') { if (!rpWidget()) say('bad', 'Окно брони ещё загружается — нажмите ещё раз через секунду или позвоните нам.'); else goal('book_open', { from: 'form', mode: 'widget' }); return; }
    if (BK.mode === 'link') { openRp({ open_item: TABLES[current].rp, date: f.date.value, count: f.count.value }, 'form'); return; }
    if (f.phone.value.replace(/\D/g, '').length < 10) {
      f.phone.classList.add('err'); f.phone.focus();
      say('bad', 'Укажите телефон — перезвоним и подтвердим бронь.'); return;
    }
    f.phone.classList.remove('err');
    const dt = new Date(f.date.value + 'T12:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
    if (BK.mode !== 'api') { say('ok', `Заявка принята: ${TABLES[current].name}, ${dt}, ${f.time.value}. Скоро перезвоним.`); submitGoal(); return; }
    btn.disabled = true; say('', 'Бронируем…');
    try {
      const r = await fetch('api/public/book', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ table: current, date: f.date.value, time: f.time.value, hours: f.querySelector('[name=dur]:checked').value, count: f.count.value, name: f.name.value, phone: f.phone.value, website: f.website.value }) });
      const j = await r.json().catch(() => ({}));
      if (r.ok) { say('ok', `Готово: ${TABLES[current].name}, ${dt}, ${f.time.value}. Бронь в системе, мы позвоним для подтверждения.`); submitGoal(); }
      else {
        const alt = (j.alternatives || []).map(x => String(x).slice(11, 16)).filter(Boolean);
        say('bad', (j.error || 'Не получилось забронировать — позвоните нам.') + (alt.length ? ` Свободно: ${alt.join(', ')}.` : ''));
      }
    } catch { say('bad', 'Нет связи. Попробуйте ещё раз или позвоните нам.'); }
    btn.disabled = false;
  });

  /* ---------- autoplay carousels with progress dots ---------- */
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const autoCarousel = (track, { interval = 5500, label = 'Фото' } = {}) => {
    const wrap = $(`.pdots[data-for="${track.id}"]`);
    const items = [...track.children];
    let stops = [], dots = [], cur = 0, elapsed = 0, last = 0, paused = false, visible = true, raf = 0;
    const padL = () => parseFloat(getComputedStyle(track).paddingLeft) || 0;
    const measure = () => {
      const max = track.scrollWidth - track.clientWidth;
      const base = items[0].offsetLeft - padL();
      stops = [];
      for (const it of items) {
        const x = Math.min(it.offsetLeft - padL() - base, max);
        if (!stops.length || x - stops[stops.length - 1] > 4) stops.push(x);
        if (x >= max - 1) break;
      }
      if (!stops.length) stops = [0];
      wrap.innerHTML = stops.map((_, i) => `<button type="button" class="pdot" aria-label="${label} ${i + 1}"><i></i></button>`).join('');
      dots = $$('.pdot', wrap);
      dots.forEach((d, i) => d.addEventListener('click', () => go(i, true)));
      setCur(Math.min(cur, stops.length - 1), false);
    };
    const nearest = () => { let b = 0; stops.forEach((x, i) => { if (Math.abs(x - track.scrollLeft) < Math.abs(stops[b] - track.scrollLeft)) b = i; }); return b; };
    const paint = () => dots.forEach((d, i) => d.querySelector('i').style.setProperty('--p', i === cur ? Math.min(elapsed / interval, 1) : 0));
    const setCur = (i, reset) => {
      if (i !== cur || reset) { cur = i; elapsed = 0; }
      dots.forEach((d, k) => k === cur ? d.setAttribute('aria-current', 'true') : d.removeAttribute('aria-current'));
      paint();
    };
    let jumping = false;
    const go = (i, user) => {
      const n = (i + stops.length) % stops.length;
      jumping = true; setCur(n, true);
      track.scrollTo({ left: stops[n], behavior: 'smooth' });
      clearTimeout(go.t); go.t = setTimeout(() => (jumping = false), 700);
    };
    track.addEventListener('scroll', () => { if (!jumping) { const n = nearest(); if (n !== cur) setCur(n, true); } }, { passive: true });
    const tick = t => {
      const dt = last ? t - last : 0; last = t;
      if (!paused && visible && !document.hidden && !reduceMotion) {
        elapsed += dt;
        if (elapsed >= interval) go(cur + 1); else paint();
      }
      raf = requestAnimationFrame(tick);
    };
    const zone = track.closest('.hcar, .gallery-wrap') || track;
    zone.addEventListener('mouseenter', () => (paused = true));
    zone.addEventListener('mouseleave', () => (paused = false));
    zone.addEventListener('focusin', () => (paused = true));
    zone.addEventListener('focusout', () => (paused = false));
    track.addEventListener('touchstart', () => (paused = true), { passive: true });
    track.addEventListener('touchend', () => setTimeout(() => (paused = false), 2500), { passive: true });
    new IntersectionObserver(es => es.forEach(e => (visible = e.isIntersecting)), { threshold: .15 }).observe(track);
    let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(measure, 150); });
    measure();
    track.querySelectorAll('img').forEach(im => im.complete || im.addEventListener('load', () => { clearTimeout(rt); rt = setTimeout(measure, 120); }, { once: true }));
    raf = requestAnimationFrame(tick);
    return { go: d => go(cur + d, true) };
  };

  const heroTrack = $('#hero-track');
  if (heroTrack) {
    const hc = autoCarousel(heroTrack, { interval: 5500 });
    $$('.hcar__btn').forEach(b => b.addEventListener('click', () => hc.go(+b.dataset.dir)));
  }
  const moodTrack = $('#mood-track');
  if (moodTrack) {
    const mc = autoCarousel(moodTrack, { interval: 5500 });
    $$('.arrows[data-for="mood-track"] .arrow').forEach(b => b.addEventListener('click', () => mc.go(+b.dataset.dir)));
    $('.arrows[data-for="mood-track"]').classList.add('is-on');
  }

  /* ---------- hall card photo switcher ---------- */
  $$('.hcard').forEach(card => {
    const main = $('.hmain', card), th = $$('.hthumb', card);
    th.forEach(b => b.addEventListener('click', () => {
      goal('hall_photo', { hall: ($('h3', card) || {}).textContent || '' }, true);
      const k = b.dataset.src;
      main.style.opacity = .2;
      const img = new Image();
      img.onload = () => { main.srcset = `${k}-800.webp 800w, ${k}-1280.webp ${b.dataset.w || 1280}w`; main.src = `${k}-1280.webp`; main.alt = b.getAttribute('aria-label'); main.style.opacity = 1; };
      img.src = `${k}-800.webp`;
      th.forEach(x => x === b ? x.setAttribute('aria-current', 'true') : x.removeAttribute('aria-current'));
    }));
  });

  /* ---------- carousels with working arrows ---------- */
  $$('.arrows:not([data-for="mood-track"])').forEach(box => {
    const track = $('#' + box.dataset.for);
    const [prev, next] = $$('.arrow', box);
    const step = () => Math.max(track.clientWidth * .8, (track.firstElementChild?.getBoundingClientRect().width || 300) + 12);
    const update = () => {
      const scrollable = track.scrollWidth > track.clientWidth + 4;
      box.classList.toggle('is-on', scrollable);
      prev.disabled = track.scrollLeft <= 4;
      next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
    };
    prev.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
    next.addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));
    track.addEventListener('scroll', update, { passive: true });
    addEventListener('resize', update);
    update();
  });


  /* ---------- easter egg: sink the 8-ball ---------- */
  (() => {
    const felt = $('#egg-felt'); if (!felt) return;
    const ball = $('.egg__ball', felt), aim = $('.egg__aim', felt), line = $('line', aim), tip = $('circle', aim);
    const pockets = $$('.egg__pocket', felt), score = $('.egg__score'), dlg = $('.prize'), edlg = $('.eggdlg'), trig = $('.egg-trigger');
    let W = 0, H = 0, R = 16, x = 0, y = 0, vx = 0, vy = 0, moving = false, drag = null, shots = 0, sunk = false, raf = 0;
    const PR = 17; // pocket capture radius
    const pocketPos = () => pockets.map(p => ({ el: p, x: p.offsetLeft + p.offsetWidth / 2, y: p.offsetTop + p.offsetHeight / 2 }));
    const size = () => { W = felt.clientWidth; H = felt.clientHeight; };
    const place = () => { ball.style.transform = `translate(${x}px, ${y}px)`; };
    const reset = () => { size(); x = W * .25; y = H / 2; vx = vy = 0; sunk = false; ball.classList.remove('sink'); ball.style.opacity = ''; place(); };
    const step = () => {
      x += vx; y += vy; vx *= .986; vy *= .986;
      let near = null, nd = 1e9;
      for (const p of pocketPos()) { const d = Math.hypot(p.x - x, p.y - y); if (d < nd) { nd = d; near = p; } }
      if (nd < PR + R * .55) return sink(near);
      if (nd > PR + R * 2.4) { // no cushion in the pocket mouth
        if (x < R) { x = R; vx = -vx * .78; } if (x > W - R) { x = W - R; vx = -vx * .78; }
        if (y < R) { y = R; vy = -vy * .78; } if (y > H - R) { y = H - R; vy = -vy * .78; }
      } else if (x < -R || x > W + R || y < -R || y > H + R) return sink(near);
      place();
      if (Math.hypot(vx, vy) < .06) { moving = false; vx = vy = 0; return; }
      raf = requestAnimationFrame(step);
    };
    const shoot = (dx, dy) => {
      size(); shots++; vx = dx; vy = dy; moving = true; cancelAnimationFrame(raf);
      score.textContent = `Удар № ${shots}`;
      raf = requestAnimationFrame(step);
    };
    const sink = p => {
      moving = false; sunk = true;
      p.el.classList.add('hit');
      ball.classList.add('sink');
      ball.style.transform = `translate(${p.x}px, ${p.y}px) scale(.35)`;
      setTimeout(() => {
        p.el.classList.remove('hit');
        $('[data-prize-shots]').textContent = shots === 1 ? 'С первого удара. Снимаем шляпу.' : `Забито с ${shots}-го удара. Код откроется совсем скоро.`;
        edlg.close();
        confetti();
        dlg.showModal();
        goal('egg_win', { shots });
      }, 520);
    };
    const local = e => { const r = felt.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    ball.addEventListener('pointerdown', e => {
      if (moving || sunk) return;
      e.preventDefault(); ball.setPointerCapture(e.pointerId);
      drag = { id: e.pointerId }; aim.classList.add('on');
    });
    ball.addEventListener('pointermove', e => {
      if (!drag) return;
      const [px, py] = local(e);
      let dx = x - px, dy = y - py; const len = Math.hypot(dx, dy), max = Math.min(160, W * .4);
      if (len > max) { dx *= max / len; dy *= max / len; }
      drag.dx = dx; drag.dy = dy;
      const k = 2.2;
      line.setAttribute('x1', x); line.setAttribute('y1', y);
      line.setAttribute('x2', x + dx * k); line.setAttribute('y2', y + dy * k);
      tip.setAttribute('cx', x + dx * k); tip.setAttribute('cy', y + dy * k);
      ball.style.transform = `translate(${x - dx * .12}px, ${y - dy * .12}px)`;
    });
    const release = () => {
      if (!drag) return;
      aim.classList.remove('on');
      const { dx = 0, dy = 0 } = drag; drag = null; place();
      if (Math.hypot(dx, dy) > 8) shoot(dx * .2, dy * .2);
    };
    ball.addEventListener('pointerup', release);
    ball.addEventListener('pointercancel', release);
    ball.addEventListener('keydown', e => {
      if ((e.key === 'Enter' || e.key === ' ') && !moving && !sunk) {
        e.preventDefault();
        const ps = pocketPos(), p = ps[Math.floor(Math.random() * ps.length)];
        const a = Math.atan2(p.y - y, p.x - x) + (Math.random() - .5) * .35, sp = 14 + Math.random() * 6;
        shoot(Math.cos(a) * sp, Math.sin(a) * sp);
      }
    });
    const openEgg = () => { edlg.showModal(); requestAnimationFrame(reset); };
    trig.addEventListener('click', () => { openEgg(); goal('egg_open'); });
    $('[data-egg-close]', edlg).addEventListener('click', () => edlg.close());
    edlg.addEventListener('click', e => { if (e.target === edlg) edlg.close(); });
    $$('[data-close]', dlg).forEach(b => b.addEventListener('click', () => dlg.close()));
    $('[data-replay]', dlg).addEventListener('click', () => setTimeout(openEgg, 60));
    dlg.addEventListener('close', () => { shots = 0; score.textContent = ''; });
    dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
    const confetti = () => {
      if (reduceMotion) return;
      const cv = document.createElement('canvas'); cv.className = 'confetti'; document.body.appendChild(cv);
      const ctx = cv.getContext('2d'), dpr = Math.min(devicePixelRatio || 1, 2);
      cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; ctx.scale(dpr, dpr);
      const cols = ['#E6955A', '#F3EADC', '#B4520F', '#2A9D86', '#C0392B', '#E2B42B'];
      const parts = Array.from({ length: 140 }, () => ({ x: innerWidth / 2, y: innerHeight * .55, vx: (Math.random() - .5) * 16, vy: -Math.random() * 16 - 6, r: Math.random() * 6 + 3, c: cols[Math.random() * cols.length | 0], a: Math.random() * 6, va: (Math.random() - .5) * .3, round: Math.random() < .35 }));
      let t0 = performance.now();
      const fr = t => {
        ctx.clearRect(0, 0, innerWidth, innerHeight);
        parts.forEach(p => { p.vy += .42; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.a += p.va; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillStyle = p.c; if (p.round) { ctx.beginPath(); ctx.arc(0, 0, p.r * .6, 0, 7); ctx.fill(); } else ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); ctx.restore(); });
        if (t - t0 < 2600) requestAnimationFrame(fr); else cv.remove();
      };
      requestAnimationFrame(fr);
    };
    let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { if (!moving && edlg.open) reset(); }, 150); });
  })();

  /* ---------- price cards: deal-in + tilt ---------- */
  (() => {
    const cards = $$('.pcard'); if (!cards.length) return;
    const io = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('dealt', e.isIntersecting)), { threshold: .25 });
    cards.forEach(c => io.observe(c));
    if (reduceMotion || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    cards.forEach(c => {
      c.addEventListener('pointermove', e => {
        const r = c.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
        c.classList.add('is-tilting');
        c.style.setProperty('--ry', (px * 10).toFixed(2) + 'deg'); c.style.setProperty('--rx', (-py * 8).toFixed(2) + 'deg');
      });
      c.addEventListener('pointerleave', () => { c.classList.remove('is-tilting'); c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); });
    });
  })();

  /* ---------- burgundy accents on/off (prototype panel) ---------- */
  (() => {
    const t = $('[data-wine-toggle]'); if (!t) return;
    const set = on => { t.setAttribute('aria-pressed', on); root.toggleAttribute('data-wine', on); syncPrivacy(); };
    const wq = new URLSearchParams(location.search).get('wine');
    set(wq === '1' ? true : wq === '0' ? false : root.hasAttribute('data-wine'));
    t.addEventListener('click', () => set(t.getAttribute('aria-pressed') !== 'true'));
  })();

  /* ---------- afisha on/off (prototype panel) ---------- */
  (() => {
    const t = $('[data-afisha-toggle]'), sec = $('#afisha'); if (!t || !sec) return;
    const links = $$('[data-afisha-link]');
    const set = on => { t.setAttribute('aria-pressed', on); sec.hidden = !on; links.forEach(l => l.hidden = !on); };
    set(new URLSearchParams(location.search).get('afisha') !== '0');
    t.addEventListener('click', () => set(t.getAttribute('aria-pressed') !== 'true'));
  })();

  /* ---------- mobile CTA hides on booking & footer ---------- */
  const fab = $('.fab');
  const hideOn = new Set();
  const io2 = new IntersectionObserver(es => {
    es.forEach(e => e.isIntersecting ? hideOn.add(e.target) : hideOn.delete(e.target));
    fab.classList.toggle('hide', hideOn.size > 0);
  });
  [$('#book'), $('.ftr')].forEach(el => io2.observe(el));

  /* ---------- reveal ---------- */
  const els = $$('.shead, .halls, .evstrip, .booking, .pcards, .menu, .booth, .perks, .band, .steps, .map, .contacts__grid');
  els.forEach(el => el.classList.add('rv'));
  const io = new IntersectionObserver(es => es.forEach(x => x.isIntersecting && (x.target.classList.add('in'), io.unobserve(x.target))), { rootMargin: '0px 0px -10% 0px' });
  els.forEach(el => io.observe(el));
})();

/* menu item photo zoom */
(() => {
  document.addEventListener('click', e => {
    const b = e.target.closest('.mthumb'); if (!b) return;
    const prev = document.activeElement;
    const box = document.createElement('div'); box.className = 'mzoom'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', b.getAttribute('aria-label'));
    const im = document.createElement('img'); im.src = b.dataset.full; im.alt = b.querySelector('img')?.alt || '';
    const x = document.createElement('button'); x.type = 'button'; x.setAttribute('aria-label', 'Закрыть'); x.textContent = '×';
    box.append(im, x); document.body.append(box); document.documentElement.style.overflow = 'hidden'; x.focus();
    const close = () => { box.remove(); document.documentElement.style.overflow = ''; document.removeEventListener('keydown', onKey); prev && prev.focus(); };
    const onKey = ev => { if (ev.key === 'Escape') close(); };
    box.addEventListener('click', close); document.addEventListener('keydown', onKey);
  });
})();
