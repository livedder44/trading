
const $ = (s, r=document)=>r.querySelector(s);
const $$ = (s, r=document)=>[...r.querySelectorAll(s)];

const burger = $('.burger');
const nav = $('#primary-nav');

function toggleNav(open) {
  if (!nav || !burger) return;
  nav.classList.toggle('primary-nav--open', open);
  burger.setAttribute('aria-expanded', String(open));
  document.body.classList.toggle('no-scroll', open);
  if (!open) closeAllLangs(); 
}

if (burger && nav) {
  burger.addEventListener('click', () => {
    const willOpen = !nav.classList.contains('primary-nav--open');
    toggleNav(willOpen);
  });

  $$('.primary-nav__link', nav).forEach(a =>
    a.addEventListener('click', () => toggleNav(false))
  );

  document.addEventListener('click', (e) => {
    if (!nav.classList.contains('primary-nav--open')) return;
    if (!nav.contains(e.target) && !burger.contains(e.target)) {
      toggleNav(false);
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('primary-nav--open')) {
      toggleNav(false);
    }
  });
}

$$('[data-scroll]').forEach(a => {
  a.addEventListener('click', (e) => {
    const href = a.getAttribute('href') || '';
    if (!href.startsWith('#')) return;
    const target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

const langWidgets = $$('[data-lang]');
const LANG_MAP = { EN: 'en', UA: 'uk' };

function getCookie(name){
  return document.cookie.split('; ').find(r => r.startsWith(name + '='))?.split('=')[1] || '';
}
function setCookieAllHosts(name, value) {
  const base = `${name}=${value}; path=/`;
  document.cookie = base;
  const d = location.hostname;
  if (d && d !== 'localhost' && d.indexOf('.') !== -1) {
    document.cookie = `${name}=${value}; path=/; domain=.${d}`;
  }
}

function applyGoogleTranslate(lang2, {reload=true} = {}) {
  if (location.protocol === 'file:') return;
  const value = `/auto/${lang2}`;
  const ck = getCookie('googtrans');
  if (ck === value || ck === encodeURIComponent(value)) {
    if (reload) location.reload();
    return;
  }
  setCookieAllHosts('googtrans', value);
  if (reload) location.reload();
}

let currentLang = (() => {
  try {
    const saved = localStorage.getItem('lang_ui');
    if (saved && (saved in LANG_MAP)) return saved;
  } catch {}
  for (const w of langWidgets) {
    const t = $('.lang__current', w)?.textContent?.trim();
    if (t) return t;
  }
  return 'EN';
})();

function setLangDisplay(value) {
  langWidgets.forEach((w) => {
    const currentEl = $('.lang__current', w);
    if (currentEl) currentEl.textContent = value;
    $$('.lang__opt', w).forEach((opt) => {
      const isSelected = (opt.dataset.value || opt.textContent.trim()) === value;
      opt.setAttribute('aria-selected', String(isSelected));
    });
  });
}

function toggleList(widget, open) {
  const btn = $('.lang__btn', widget);
  const list = $('.lang__list', widget);
  if (!btn || !list) return;
  btn.setAttribute('aria-expanded', String(open));
  list.hidden = !open;
  widget.classList.toggle('is-open', open);
}

function closeAllLangs(except) {
  langWidgets.forEach((w) => {
    if (except && w === except) return;
    toggleList(w, false);
  });
}

langWidgets.forEach((widget) => {
  const btn = $('.lang__btn', widget);
  const list = $('.lang__list', widget);
  if (!btn || !list) return;

  btn.setAttribute('aria-expanded', 'false');
  list.hidden = true;
  widget.classList.remove('is-open');

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const willOpen = btn.getAttribute('aria-expanded') !== 'true';
    closeAllLangs(widget);
    toggleList(widget, willOpen);
  });

  list.addEventListener('click', (e) => {
    const li = e.target.closest('.lang__opt');
    if (!li) return;
    const nextLang = li.dataset.value || li.textContent.trim();
    currentLang = nextLang;
    setLangDisplay(currentLang);
    try { localStorage.setItem('lang_ui', currentLang); } catch {}
    const code = LANG_MAP[currentLang] || 'en';
    applyGoogleTranslate(code, { reload: true });
    toggleList(widget, false);
  });
});

document.addEventListener('click', (e) => {
  if (!e.target.closest('[data-lang]')) closeAllLangs();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeAllLangs();
});

setLangDisplay(currentLang);

(function () {
  const root = document.querySelector('#testimonials');
  if (!root) return;

  const DATA_URL = new URL('./assets/data/reviews.json', document.baseURI).href;

  const card    = root.querySelector('.tcard');
  const avatar  = root.querySelector('.tcard__avatar');
  const nameEl  = root.querySelector('.tcard__name');
  const roleEl  = root.querySelector('.tcard__role');
  const textEl  = root.querySelector('.tcard__text');
  const idxEl   = root.querySelector('.tcard__index');
  const ttlEl   = root.querySelector('.tcard__total');

  const prevBtns = [...root.querySelectorAll('.tnav--prev')];
  const nextBtns = [...root.querySelectorAll('.tnav--next')];

  if (!card || !avatar || !nameEl || !roleEl || !textEl || !idxEl || !ttlEl || !prevBtns.length || !nextBtns.length) {
    console.warn('[Testimonials] Missing hooks');
    return;
  }

  let data = [];
  let i = 0;

  const pad2 = (n) => String(n).padStart(2, '0');

  function updateNav() {
    const atStart = i <= 0;
    const atEnd   = i >= data.length - 1;

    prevBtns.forEach(b => b.disabled = atStart);
    nextBtns.forEach(b => b.disabled = atEnd);
  }

  function render(idx) {
    const it = data[idx];
    if (!it) return;

    const img = new Image();
    img.onload = () => { avatar.src = it.photo; avatar.alt = `${it.name} photo`; };
    img.onerror = () => { avatar.src = 'assets/img/reviews/placeholder.png'; avatar.alt = 'Reviewer photo'; };
    img.src = it.photo;

    nameEl.textContent = it.name;
    roleEl.textContent = it.position;
    textEl.textContent = it.review;

    idxEl.textContent = pad2(idx + 1);
    ttlEl.textContent = pad2(data.length);

    updateNav();
  }

  function go(delta = 0) {
    const len = data.length;
    if (!len) return;

    let next = i + delta;
    if (next < 0) next = 0;
    if (next > len - 1) next = len - 1;

    if (next === i) return;
    i = next;
    render(i);
  }

  prevBtns.forEach(b => b.addEventListener('click', () => go(-1)));
  nextBtns.forEach(b => b.addEventListener('click', () => go(1)));

  root.tabIndex = -1;
  root.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft')  go(-1);
    if (e.key === 'ArrowRight') go(1);
  });

  let startX = 0, swiping = false;
  const TH = 40;
  root.addEventListener('touchstart', (e) => {
    if (!e.changedTouches[0]) return;
    startX = e.changedTouches[0].clientX;
    swiping = true;
  }, { passive: true });

  root.addEventListener('touchend', (e) => {
    if (!swiping || !e.changedTouches[0]) return;
    const dx = e.changedTouches[0].clientX - startX;
    if (dx > TH)  go(-1);
    if (dx < -TH) go(1);
    swiping = false;
  });

  fetch(DATA_URL, { cache: 'no-store' })
    .then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status} for ${DATA_URL}`);
      return r.json();
    })
    .then(arr => {
      data = (Array.isArray(arr) ? arr : [])
        .filter(x => x && x.name && x.position && x.review && x.photo);

      if (!data.length) throw new Error('No valid items');

      i = 0;
      render(i); 
    })
    .catch(err => {
      console.error('[Testimonials] Load error:', err);

      data = [{
        name: 'Soon™',
        position: 'Reviews incoming',
        review: 'We’re collecting fresh reviews. Please check back later.',
        photo: 'assets/img/reviews/placeholder.png'
      }];
      i = 0;
      render(i);
    });
})();

(function () {
  const root = document.querySelector('#testimonials');
  if (!root) return;

  const headerNav = root.querySelector('.testimonials__header .testimonials__nav');
  const viewport  = root.querySelector('.testimonials__viewport');
  const card      = root.querySelector('.tcard');
  if (!headerNav || !viewport || !card) return;

  const initialPrev = headerNav.querySelector('.tnav--prev');
  const initialNext = headerNav.querySelector('.tnav--next');
  const counter     = card.querySelector('.tcard__counter');

  if (!initialPrev || !initialNext || !counter) return;

  const prevBtn = initialPrev;
  const nextBtn = initialNext;

  let leftWrap   = null;
  let rightWrap  = null;
  let bar        = null; 
  let barCounter = null;

  function cleanupAll() {

    if (prevBtn && prevBtn.parentNode !== headerNav) headerNav.appendChild(prevBtn);
    if (nextBtn && nextBtn.parentNode !== headerNav) headerNav.appendChild(nextBtn);

    if (counter && counter.parentNode !== card) card.appendChild(counter);

    leftWrap?.remove();  leftWrap = null;
    rightWrap?.remove(); rightWrap = null;
    bar?.remove();       bar = null;
    barCounter = null;

    root.classList.remove('tnav-moved');
    root.classList.remove('tcount-moved');

    headerNav.style.removeProperty('display');
  }

  function applyDesktop() {
    cleanupAll();

  }

  function applyMid() { 
    cleanupAll();

    leftWrap = document.createElement('div');
    leftWrap.className = 'testimonials__side-btn testimonials__side-btn--prev';

    rightWrap = document.createElement('div');
    rightWrap.className = 'testimonials__side-btn testimonials__side-btn--next';

    leftWrap.appendChild(prevBtn);
    rightWrap.appendChild(nextBtn);

    viewport.prepend(leftWrap);
    viewport.appendChild(rightWrap);

    headerNav.style.setProperty('display', 'none', 'important');
    root.classList.add('tnav-moved');
  }

  function applyMobile() {
    cleanupAll();

    bar = document.createElement('div');
    bar.className = 'testimonials__bar';

    barCounter = document.createElement('div');
    barCounter.className = 'testimonials__bar-counter';

    bar.appendChild(prevBtn);
    barCounter.appendChild(counter);
    bar.appendChild(barCounter);
    bar.appendChild(nextBtn);

    viewport.appendChild(bar);

    headerNav.style.setProperty('display', 'none', 'important');

    root.classList.add('tnav-moved');
    root.classList.add('tcount-moved');
  }

  function isMobile()  { return window.matchMedia('(max-width: 768px)').matches; }
  function isMid()     { return window.matchMedia('(max-width: 1440px) and (min-width: 768px)').matches; }

  function applyLayout() {
    if (isMobile())       applyMobile();
    else if (isMid())     applyMid();
    else                  applyDesktop();
  }

  applyLayout();
  window.addEventListener('resize', applyLayout);
  window.addEventListener('orientationchange', applyLayout);
})();

(function () {
  const root = document.querySelector('#faq');
  if (!root) return;

  const items = [...root.querySelectorAll('.faq-item')];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function animateOpen(li){
    const btn   = li.querySelector('.faq-item__btn');
    const panel = li.querySelector('.faq-item__panel');
    panel.hidden = false;
    panel.style.paddingBottom = '32px';
    panel.style.height = 'auto';
    const target = panel.scrollHeight;
    panel.style.height = '0px';
    panel.getBoundingClientRect();

    li.classList.add('faq-item--open');
    btn.setAttribute('aria-expanded', 'true');

    if (reduceMotion){
      panel.style.height = 'auto';
      return;
    }

    panel.style.height = target + 'px';

    const onEnd = (e) => {
      if (e.propertyName !== 'height') return;
      panel.style.height = 'auto';
      panel.removeEventListener('transitionend', onEnd);
    };
    panel.addEventListener('transitionend', onEnd);
  }

  function animateClose(li){
    const btn   = li.querySelector('.faq-item__btn');
    const panel = li.querySelector('.faq-item__panel');

    const current = panel.scrollHeight;
    panel.style.height = current + 'px'; 
    panel.getBoundingClientRect();

    li.classList.remove('faq-item--open');
    btn.setAttribute('aria-expanded', 'false');

    if (reduceMotion){
      panel.style.height = '0px';
      panel.style.paddingBottom = '0';
      panel.hidden = true;
      return;
    }

    panel.style.height = '0px';
    panel.style.paddingBottom = '0';

    const onEnd = (e) => {
      if (e.propertyName !== 'height') return;
      panel.hidden = true;  
      panel.removeEventListener('transitionend', onEnd);
    };
    panel.addEventListener('transitionend', onEnd);
  }

  function openItem(li){
    items.forEach(other => { if (other !== li && other.classList.contains('faq-item--open')) animateClose(other); });
    animateOpen(li);
  }

  function toggle(li){
    if (li.classList.contains('faq-item--open')) animateClose(li);
    else openItem(li);
  }

  items.forEach(li => {
    const btn   = li.querySelector('.faq-item__btn');
    const panel = li.querySelector('.faq-item__panel');
    const isOpen = li.classList.contains('faq-item--open');

    btn.setAttribute('aria-expanded', String(isOpen));
    if (isOpen){
      panel.hidden = false;
      panel.style.height = 'auto';
      panel.style.paddingBottom = '32px';
    }else{
      panel.hidden = true;
      panel.style.height = '0px';
      panel.style.paddingBottom = '0';
    }

    btn.addEventListener('click', (e) => { e.preventDefault(); toggle(li); });
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(li); }
    });
  });
})();

document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('.contact__form');
  if (!form) return;

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
  const get = (name) => form.querySelector(`[name="${name}"]`);
  const fields = [...form.querySelectorAll('.contact__field')];

  function setError(el, msg) {
    const wrap = el.closest('.contact__field');
    el.classList.add('is-error');
    el.classList.remove('is-success');
    if (wrap) {
      wrap.classList.add('has-error');
      const em = wrap.querySelector('.contact__error');
      if (em) em.textContent = msg;
    }
  }
  function clearError(el) {
    const wrap = el.closest('.contact__field');
    el.classList.remove('is-error');
    if (wrap) wrap.classList.remove('has-error');
  }
  function setSuccess(el) {
    clearError(el);
    el.classList.add('is-success');
  }

  function validate() {
    let ok = true;
    const name    = get('name');
    const email   = get('email');
    const message = get('message');

    if (!name.value.trim()) { setError(name, 'This field is required'); ok = false; }
    else setSuccess(name);

    const ev = email.value.trim();
    if (!ev) { setError(email, 'This field is required'); ok = false; }
    else if (!emailRe.test(ev)) { setError(email, 'Incorrect email type'); ok = false; }
    else setSuccess(email);

    if (!message.value.trim()) { setError(message, 'This field is required'); ok = false; }
    else setSuccess(message);

    return ok;
  }

  form.addEventListener('input', (e) => {
    const el = e.target;
    if (!el.matches('input, textarea')) return;
    if (el.name === 'email') {
      const v = el.value.trim();
      if (v && emailRe.test(v)) setSuccess(el);
      else el.classList.remove('is-success');
    } else {
      if (el.value.trim()) setSuccess(el);
      else el.classList.remove('is-success');
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validate()) return;
    form.reset();
    fields.forEach(w => {
      const el = w.querySelector('input, textarea');
      if (el) el.classList.remove('is-success', 'is-error');
      w.classList.remove('has-error');
    });
  });
});
