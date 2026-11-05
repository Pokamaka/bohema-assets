/* Богема · Яндекс Метрика. Настройки приходят из админки через #site-data (ключ ym). */
(() => {
  'use strict';
  let cfg;
  try { cfg = JSON.parse(document.getElementById('site-data').textContent).ym; } catch { return; }
  if (!cfg || !/^\d{4,12}$/.test(String(cfg.id))) return;
  const ID = +cfg.id;
  const KEY = 'bohema-cookie';
  const store = { get: () => { try { return localStorage.getItem(KEY); } catch { return null; } }, set: v => { try { localStorage.setItem(KEY, v); } catch { /* private mode */ } } };

  let started = false;
  const queue = [];
  function start() {
    if (started) return; started = true;
    /* external: the counter is installed by the site builder (e.g. Tilda) — only send goals */
    if (cfg.external) { setInterval(() => { while (queue.length && window.ym) window.ym.apply(null, queue.shift()); }, 1000); return; }
    /* official loader, moved out of inline <script> to keep CSP strict */
    (function (m, e, t, r, i) {
      m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
      m[i].l = 1 * new Date();
      for (let j = 0; j < e.scripts.length; j++) if (e.scripts[j].src === r) return;
      const k = e.createElement(t), a = e.getElementsByTagName(t)[0];
      k.async = 1; k.src = r; a.parentNode.insertBefore(k, a);
    })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js?id=' + ID, 'ym');
    window.ym(ID, 'init', {
      ssr: true,
      clickmap: !!cfg.clickmap,
      trackLinks: !!cfg.trackLinks,
      accurateTrackBounce: !!cfg.accurateTrackBounce,
      webvisor: !!cfg.webvisor,
    });
    while (queue.length) window.ym.apply(null, queue.shift());
  }

  /* public helper: window.bohemaGoal('book_submit', {table: '...'}) — also for the future booking widget */
  const sent = new Set();
  window.bohemaGoal = (goal, params, once) => {
    if (once) { if (sent.has(goal + JSON.stringify(params || {}))) return; sent.add(goal + JSON.stringify(params || {})); }
    const args = [ID, 'reachGoal', goal, params || {}];
    if (started && window.ym && !queue.length) window.ym.apply(null, args); else if (cfg.consent !== 'consent' || store.get() === 'yes') queue.push(args);
  };

  /* ---------- cookie notice / consent ---------- */
  const mode = cfg.consent || 'notice'; // off | notice | consent
  const answered = store.get();
  if (mode === 'consent') { if (answered === 'yes') start(); }
  else start();
  if (mode !== 'off' && !answered) {
    const bar = document.createElement('div');
    bar.className = 'cookie';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', 'Уведомление о cookie');
    const p = document.createElement('p');
    p.textContent = cfg.text || 'Мы используем cookie и Яндекс Метрику, чтобы сайт работал лучше.';
    const more = document.createElement('a');
    more.href = '/privacy'; more.textContent = 'Подробнее';
    p.append(' ', more);
    const ok = document.createElement('button');
    ok.type = 'button'; ok.className = 'btn btn--sm'; ok.textContent = mode === 'consent' ? 'Согласен' : 'Хорошо';
    ok.addEventListener('click', () => { store.set('yes'); bar.remove(); start(); });
    bar.append(p, ok);
    if (mode === 'consent') {
      const no = document.createElement('button');
      no.type = 'button'; no.className = 'cookie__no'; no.textContent = 'Только необходимые';
      no.addEventListener('click', () => { store.set('no'); bar.remove(); });
      bar.append(no);
    }
    const add = () => document.body.append(bar);
    document.body ? add() : document.addEventListener('DOMContentLoaded', add);
  }

  /* ---------- automatic goals: contacts and outgoing actions ---------- */
  const sectionOf = el => (el.closest('section[id], header, footer') || {}).id || (el.closest('footer') ? 'footer' : el.closest('header') ? 'header' : '');
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href') || '';
    const from = sectionOf(a);
    if (href.startsWith('tel:')) window.bohemaGoal('call', { from });
    else if (href.startsWith('mailto:')) window.bohemaGoal(/subject=/i.test(href) || from === 'events' ? 'event_request' : 'email', { from });
    else if (/t\.me\//.test(href)) window.bohemaGoal('messenger', { channel: 'Telegram', from });
    else if (/wa\.me\/|whatsapp/.test(href)) window.bohemaGoal('messenger', { channel: 'WhatsApp', from });
    else if (/instagram\.com/.test(href)) window.bohemaGoal('social', { channel: 'Instagram', from });
    else if (/vk\.com/.test(href)) window.bohemaGoal('social', { channel: 'ВКонтакте', from });
    else if (/yandex\.[a-z]+\/maps/.test(href)) window.bohemaGoal('route', { from });
    const card = a.closest('.acard, .afisha__main, [data-afisha]');
    if (card) { const t = card.querySelector('h3, h2'); window.bohemaGoal('afisha_click', { card: t ? t.textContent.trim() : '' }); }
  }, true);

  /* ---------- which sections people actually reach ---------- */
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => entries.forEach(en => {
      if (!en.isIntersecting) return;
      io.unobserve(en.target);
      const h = en.target.querySelector('h2');
      window.bohemaGoal('section_view', { section: h ? h.textContent.trim() : en.target.id }, true);
    }), { threshold: 0, rootMargin: '0px 0px -40% 0px' });
    const watch = () => document.querySelectorAll('main section[id]').forEach(s => { if (s.id !== 'top') io.observe(s); });
    document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', watch) : watch();
  }
})();
