/* =========== ACTIVE NAV LINK =========== */
(function () {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href').split('/').pop().split('#')[0] || 'index.html';
    if (href === path) a.classList.add('nav-active');
  });
})();

/* =========== I18N =========== */
const STORAGE_KEY = 'mimora-lang';
function setLang(lang) {
  localStorage.setItem(STORAGE_KEY, lang);
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-en],[data-ru]').forEach(el => {
    const v = el.getAttribute('data-' + lang);
    if (v !== null) el.textContent = v;
  });
  document.querySelectorAll('[data-en-placeholder],[data-ru-placeholder]').forEach(el => {
    const v = el.getAttribute('data-' + lang + '-placeholder');
    if (v !== null) el.placeholder = v;
  });
  document.querySelectorAll('.lang button').forEach(b => {
    b.classList.toggle('active', b.dataset.lang === lang);
  });
}
document.querySelectorAll('.lang button').forEach(b => {
  b.addEventListener('click', () => setLang(b.dataset.lang));
});
setLang(localStorage.getItem(STORAGE_KEY) || 'ru');

/* =========== LENIS SMOOTH SCROLL =========== */
(function () {
  if (typeof Lenis === 'undefined') return;
  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    smoothTouch: false,
    wheelMultiplier: 1,
    touchMultiplier: 2,
  });
  // Sync GSAP ScrollTrigger with Lenis
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  } else {
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }
  // Hand off anchor clicks to Lenis for smooth in-page nav
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id && id.length > 1) {
        const target = document.querySelector(id);
        if (target) {
          e.preventDefault();
          lenis.scrollTo(target, { offset: -16 });
        }
      }
    });
  });
  window.__lenis = lenis;
})();

/* =========== HOW IT WORKS SCROLL-PINNED =========== */
(function () {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  const section = document.querySelector('.how-it-works');
  if (!section) return;
  const totalSteps = 4;
  const scrollHint = document.getElementById('howScrollHint');
  ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: 'bottom bottom',
    scrub: 1,
    onUpdate: (self) => {
      const progress = self.progress;
      const activeStep = Math.min(totalSteps, Math.floor(progress * totalSteps) + 1);

      // Hide scroll hint once user starts scrolling
      if (scrollHint && progress > 0.02) scrollHint.classList.add('hidden');

      // Left text block
      section.querySelectorAll('.how-step').forEach(el => {
        el.classList.toggle('active', parseInt(el.dataset.step, 10) === activeStep);
      });

      // Layered scene
      section.querySelectorAll('.scene-group').forEach(group => {
        const step = parseInt(group.dataset.step, 10);
        const isActive = step === activeStep;
        group.classList.toggle('active', isActive);

        const main = group.querySelector('.card-main');
        const auxs = group.querySelectorAll('.card-aux');

        if (isActive) {
          if (main) {
            main.style.transform = 'translate(-50%, -50%) scale(1)';
            main.style.opacity = '1';
            main.style.filter = 'blur(0px)';
          }
          auxs.forEach((aux, i) => {
            const delay = 0.1 + i * 0.08;
            aux.style.transitionDelay = delay + 's';
            aux.style.transform = 'translate(calc(-50% + var(--x)), calc(-50% + var(--y))) rotate(var(--rot)) scale(1)';
            aux.style.opacity = '1';
            aux.style.filter = 'blur(0px)';
          });
        } else {
          if (main) {
            const offsetX = step < activeStep ? '-30%' : '30%';
            main.style.transform = 'translate(calc(-50% + ' + offsetX + '), -50%) scale(0.7)';
            main.style.opacity = '0';
            main.style.filter = 'blur(6px)';
          }
          auxs.forEach(aux => {
            aux.style.transitionDelay = '0s';
            aux.style.transform = 'translate(calc(-50% + var(--x) * 1.5), calc(-50% + var(--y) * 1.5)) rotate(var(--rot)) scale(0.6)';
            aux.style.opacity = '0';
            aux.style.filter = 'blur(6px)';
          });
        }
      });

      // Progress dots
      section.querySelectorAll('.how-progress .dot').forEach((el, i) => {
        el.classList.toggle('active', i + 1 === activeStep);
      });
    }
  });
})();

/* =========== REVEAL ON SCROLL =========== */
// Auto-stagger: when an element with .reveal-group enters, its .reveal
// children animate sequentially with a 100ms delay between them.
document.querySelectorAll('.reveal-group').forEach(g => {
  [...g.querySelectorAll('.reveal')].forEach((el, i) => {
    if (!el.style.transitionDelay) el.style.transitionDelay = (i * 100) + 'ms';
  });
});
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('in');
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.02, rootMargin: '0px 0px -20px 0px' });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

/* =========== NAV LIGHT/DARK SWITCH =========== */
const nav = document.getElementById('nav');
const sections = [...document.querySelectorAll('[data-bg]')];
function updateNavTheme() {
  const navRect = nav.getBoundingClientRect();
  const probeY = navRect.bottom + 4;
  let mode = 'dark';
  for (const s of sections) {
    const r = s.getBoundingClientRect();
    if (r.top <= probeY && r.bottom > probeY) {
      mode = s.getAttribute('data-bg');
      break;
    }
  }
  nav.classList.toggle('light', mode === 'light');
}
window.addEventListener('scroll', updateNavTheme, { passive: true });
window.addEventListener('resize', updateNavTheme);
updateNavTheme();

/* =========== WAITLIST =========== */
function waitlistSubmit(form) {
  const btn = form.querySelector('button');
  const lang = localStorage.getItem(STORAGE_KEY) || 'ru';
  btn.innerHTML = lang === 'ru' ? '✓ Вы в списке' : '✓ You\'re in';
  btn.style.background = '#fff';
  setTimeout(() => form.reset(), 1200);
}

/* =========== PROBLEM - STICKY SCROLL =========== */
(function () {
  const outer = document.querySelector('.prob-scroll-outer');
  const panels = document.querySelectorAll('.prob-panel');
  const dots = document.querySelectorAll('.prob-dot');
  if (!outer || !panels.length) return;

  const STEPS = panels.length;

  function setStep(idx) {
    panels.forEach((p, i) => p.classList.toggle('active', i === idx));
    dots.forEach((d, i) => d.classList.toggle('active', i === idx));
  }

  dots.forEach(d => d.addEventListener('click', () => setStep(+d.dataset.step)));

  function update(progress) {
    const step = Math.min(STEPS - 1, Math.floor(progress * STEPS));
    setStep(step);
  }

  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    ScrollTrigger.create({
      trigger: outer,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate(self) { update(self.progress); },
    });
  } else {
    function onScroll() {
      const rect = outer.getBoundingClientRect();
      const total = outer.offsetHeight - window.innerHeight;
      const scrolled = -rect.top;
      const progress = Math.max(0, Math.min(1, scrolled / total));
      update(progress);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
})();

/* =========== PRICING TITLE - EMERGE FROM UNDER MANIFESTO =========== */
(function () {
  const title = document.querySelector('.price-head-title');
  const manifesto = document.querySelector('#manifesto-block');

  if (!title) return;

  // No GSAP or mobile: just show it
  if (!manifesto || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined'
    || window.innerWidth <= 768) {
    gsap.set(title, { y: 0 });
    return;
  }

  // Start: title is hidden above the clip area (behind the green block)
  gsap.set(title, { y: '-110%', opacity: 0 });

  gsap.to(title, {
    y: '0%',
    opacity: 1,
    ease: 'none',
    scrollTrigger: {
      trigger: manifesto,
      start: 'bottom 80%',
      end: 'bottom 20%',
      scrub: 0.4,
    }
  });
})();

/* =========== TECH TITLE - EMERGE FROM UNDER HELIXA GREEN =========== */
(function () {
  const title = document.querySelector('.tech-head-title');
  const helixa = document.querySelector('#helixa-green-block');

  if (!title) return;

  // No GSAP or mobile: just show it
  if (!helixa || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined'
    || window.innerWidth <= 768) {
    gsap.set(title, { y: 0 });
    return;
  }

  // Start: title is hidden above the clip area (behind the green block)
  gsap.set(title, { y: '-110%', opacity: 0 });

  gsap.to(title, {
    y: '0%',
    opacity: 1,
    ease: 'none',
    scrollTrigger: {
      trigger: helixa,
      start: 'bottom 80%',
      end: 'bottom 20%',
      scrub: 0.4,
    }
  });
})();

/* =========== MOBILE MENU =========== */
(function () {
  const btn = document.getElementById('hamburger');
  const menu = document.getElementById('mobileMenu');
  if (!btn || !menu) return;

  function openMenu() {
    menu.classList.add('open');
    btn.classList.add('open');
    // Pause Lenis smooth scroll while menu is open
    if (window.__lenis) window.__lenis.stop();
  }
  function closeMenu() {
    menu.classList.remove('open');
    btn.classList.remove('open');
    if (window.__lenis) window.__lenis.start();
  }

  btn.addEventListener('click', () => {
    menu.classList.contains('open') ? closeMenu() : openMenu();
  });

  // Close button inside the menu
  const closeBtn = document.getElementById('mobileMenuClose');
  if (closeBtn) closeBtn.addEventListener('click', closeMenu);

  // Close when a link is tapped
  menu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', closeMenu);
  });

  // Close on lang button press inside menu
  menu.querySelectorAll('.lang button').forEach(b => {
    b.addEventListener('click', closeMenu);
  });

  // Close on Escape key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeMenu();
  });
})();

/* =========== FOOTER WATERMARK HOVER =========== */
(function () {
  const foot = document.querySelector('.foot');
  const wm = document.querySelector('.foot-watermark');
  if (!foot || !wm) return;
  // Activate watermark whenever cursor is anywhere over the footer -
  // makes the hit area generous and prevents flicker when crossing letters.
  foot.addEventListener('mouseenter', () => wm.classList.add('is-active'));
  foot.addEventListener('mouseleave', () => wm.classList.remove('is-active'));
})();
