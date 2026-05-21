/* =========== ACTIVE NAV LINK =========== */
(function(){
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href').split('/').pop().split('#')[0] || 'index.html';
    if (href === path) a.classList.add('nav-active');
  });
})();

/* =========== I18N =========== */
const STORAGE_KEY = 'mimora-lang';
function setLang(lang){
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
(function(){
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
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined'){
    gsap.registerPlugin(ScrollTrigger);
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  } else {
    function raf(time){
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }
  // Hand off anchor clicks to Lenis for smooth in-page nav
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id && id.length > 1){
        const target = document.querySelector(id);
        if (target){
          e.preventDefault();
          lenis.scrollTo(target, { offset: -16 });
        }
      }
    });
  });
  window.__lenis = lenis;
})();

/* =========== HOW IT WORKS SCROLL-PINNED =========== */
(function(){
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

        if (isActive){
          if (main){
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
          if (main){
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
    if (e.isIntersecting){
      e.target.classList.add('in');
      io.unobserve(e.target);
    }
  });
}, {threshold:.12, rootMargin:'0px 0px -60px 0px'});
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

/* =========== NAV LIGHT/DARK SWITCH =========== */
const nav = document.getElementById('nav');
const sections = [...document.querySelectorAll('[data-bg]')];
function updateNavTheme(){
  const navRect = nav.getBoundingClientRect();
  const probeY = navRect.bottom + 4;
  let mode = 'dark';
  for (const s of sections){
    const r = s.getBoundingClientRect();
    if (r.top <= probeY && r.bottom > probeY){
      mode = s.getAttribute('data-bg');
      break;
    }
  }
  nav.classList.toggle('light', mode === 'light');
}
window.addEventListener('scroll', updateNavTheme, {passive:true});
window.addEventListener('resize', updateNavTheme);
updateNavTheme();

/* =========== WAITLIST =========== */
function waitlistSubmit(form){
  const btn = form.querySelector('button');
  const lang = localStorage.getItem(STORAGE_KEY) || 'ru';
  btn.innerHTML = lang === 'ru' ? '✓ Вы в списке' : '✓ You\'re in';
  btn.style.background = '#fff';
  setTimeout(() => form.reset(), 1200);
}

/* =========== PRICING TITLE - EMERGE FROM UNDER MANIFESTO =========== */
(function(){
  const title     = document.querySelector('.price-head-title');
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
      end:   'bottom 20%',
      scrub: 0.4,
    }
  });
})();

/* =========== MOBILE MENU =========== */
(function(){
  const btn  = document.getElementById('hamburger');
  const menu = document.getElementById('mobileMenu');
  if (!btn || !menu) return;

  function openMenu(){
    menu.classList.add('open');
    btn.classList.add('open');
    // Pause Lenis smooth scroll while menu is open
    if (window.__lenis) window.__lenis.stop();
  }
  function closeMenu(){
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
(function(){
  const foot = document.querySelector('.foot');
  const wm = document.querySelector('.foot-watermark');
  if (!foot || !wm) return;
  // Activate watermark whenever cursor is anywhere over the footer -
  // makes the hit area generous and prevents flicker when crossing letters.
  foot.addEventListener('mouseenter', () => wm.classList.add('is-active'));
  foot.addEventListener('mouseleave', () => wm.classList.remove('is-active'));
})();

/* =========== HERO CANVAS ANIMATION =========== */
(function(){
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;
  const label = document.getElementById('heroPhaseLabel');
  const ctx = canvas.getContext('2d');
  let W=0, H=0, dpr=Math.min(window.devicePixelRatio||1, 2);

  function resize(){
    const r = canvas.getBoundingClientRect();
    W = r.width; H = r.height;
    canvas.width = W*dpr; canvas.height = H*dpr;
    ctx.setTransform(dpr,0,0,dpr,0,0);
    layoutTargets();
  }

  // Palette of highlight tints
  const TINTS = [
    [192, 204, 114],   // classic lime
    [214, 224, 140],   // bright lime
    [255, 252, 210],   // warm cream
    [168, 196,  90],   // deep green-lime
    [240, 240, 180],   // light gold
    [200, 220, 130],   // mid lime
  ];

  const N = 1000;
  const dots = [];
  for (let i=0;i<N;i++){
    dots.push({
      x: Math.random()*800, y: Math.random()*500,
      tx: 0, ty: 0,
      ox: 0, oy: 0,
      r: 0.7 + Math.random()*2.8,          // wider size range
      a: 0.25 + Math.random()*0.45,
      lime: Math.random() < 0.15,
      phase: Math.random()*Math.PI*2,
      // highlight lifecycle
      hlAlpha:  0,                           // current highlight opacity 0-1
      hlTarget: 0,                           // target (1=active, 0=off)
      hlColor:  TINTS[0],
      hlSize:   1,                           // extra radius when lit
      hlLife:   0,                           // ms alive
      hlDur:    0,                           // total duration
      activateAt: Math.random() * 3000,     // stagger initial activation
    });
  }

  // Pre-compute three target layouts
  let targetsByPhase = [[],[],[]];
  function layoutTargets(){
    targetsByPhase = [[],[],[]];
    const cx = W/2, cy = H/2;
    // Constrain globe + map to a centered square so they stay visually anchored,
    // while crowd uses the full canvas.
    const D = Math.min(W, H, 760);
    const R = D * 0.42;

    // Phase 0: crowd (irregular grid) - fills the full hero, edge-to-edge
    const cols = 22;
    const rows = Math.ceil(N/cols);
    for (let i=0;i<N;i++){
      const c = i % cols;
      const r = Math.floor(i/cols);
      const offsetX = (r%2)*0.5;
      const x = cx + ((c - cols/2 + 0.5 + offsetX) * (W*1.08/cols));
      const y = cy - H*0.50 + r*(H*1.00/(rows-1)) + (Math.random()-.5)*8;
      targetsByPhase[0].push({x,y});
    }

    // Phase 1: globe (sphere) - 3D points, rotated each frame, fixed size
    for (let i=0;i<N;i++){
      const phi = Math.acos(1 - 2*(i+0.5)/N);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      const sx = Math.cos(theta)*Math.sin(phi);
      const sy = Math.cos(phi);
      const sz = Math.sin(theta)*Math.sin(phi);
      targetsByPhase[1].push({x3d: sx, y3d: sy, z3d: sz, R, cx, cy});
    }

    // Phase 2: simplified world-map silhouette - fills canvas, preserves aspect
    const map = WORLD_POINTS;
    const mapBounds = {minx: -170, maxx: 180, miny: -58, maxy: 82};
    const mapW = mapBounds.maxx - mapBounds.minx;
    const mapH = mapBounds.maxy - mapBounds.miny;
    const baseScale = Math.min(W / mapW, H / mapH);
    const scale = baseScale * 0.88;
    const sw = mapW * scale;
    const sh = mapH * scale;
    const sx0 = cx - sw / 2;
    const sy0 = cy - sh / 2;
    for (let i=0;i<N;i++){
      const p = map[i % map.length];
      const px = sx0 + ((p[0]-mapBounds.minx)/mapW) * sw;
      const py = sy0 + ((mapBounds.maxy-p[1])/mapH) * sh;
      targetsByPhase[2].push({x:px + (Math.random()-.5)*3, y:py + (Math.random()-.5)*3});
    }
  }

  // Sparse points approximating world continents
  const WORLD_POINTS = [
    // Greenland
    [-45,82],[-37,82],[-30,82],[-50,80],[-40,80],[-32,80],[-25,80],[-55,78],[-45,78],[-35,78],[-25,78],[-20,78],[-58,76],[-48,76],[-38,76],[-28,76],[-22,76],[-55,74],[-44,74],[-32,74],[-22,74],[-52,72],[-40,72],[-28,72],[-22,72],[-50,70],[-38,70],[-28,70],[-22,70],[-48,68],[-40,68],[-30,68],[-25,68],[-48,67],[-44,67],[-40,67],[-36,67],[-32,67],[-28,67],[-24,67],[-20,67],[-18,66],[-46,65],[-22,65],[-16,65],[-19,64],[-58,63],[-44,63],[-42,63],[-40,63],[-36,63],[-32,63],[-28,63],[-24,63],[-20,63],[-16,63],[-44,61],
    // Northern Canada + Alaska arctic
    [-85,78],[-75,78],[-95,77],[-80,77],[-90,76],[-120,75],[-112,75],[-122,73],[-95,73],[-82,73],[-75,73],[-118,72],[-105,72],[-100,72],[-78,72],[-156,71],[-148,71],[-110,71],[-72,71],[-150,70],[-144,70],[-68,70],[-90,69],[-80,69],[-85,68],[-158,67],[-154,67],[-150,67],[-146,67],[-142,67],[-138,67],[-134,67],[-130,67],[-126,67],[-122,67],[-118,67],[-114,67],[-110,67],[-106,67],[-102,67],[-98,67],[-94,67],[-90,67],[-86,67],[-82,67],[-78,67],[-74,67],
    // North America (Alaska, Canada, USA, Mexico, Florida)
    [-162,67],[-162,63],[-158,63],[-154,63],[-150,63],[-146,63],[-142,63],[-138,63],[-134,63],[-130,63],[-126,63],[-122,63],[-118,63],[-114,63],[-110,63],[-106,63],[-102,63],[-98,63],[-94,63],[-90,63],[-86,63],[-82,63],[-78,63],[-74,63],[-70,63],[-66,63],[-62,63],[-158,59],[-154,59],[-150,59],[-146,59],[-142,59],[-138,59],[-134,59],[-130,59],[-126,59],[-122,59],[-118,59],[-114,59],[-110,59],[-106,59],[-102,59],[-98,59],[-94,59],[-90,59],[-86,59],[-82,59],[-78,59],[-74,59],[-70,59],[-66,59],[-62,59],[-58,59],[-132,55],[-128,55],[-124,55],[-120,55],[-116,55],[-112,55],[-108,55],[-104,55],[-100,55],[-96,55],[-92,55],[-88,55],[-84,55],[-80,55],[-76,55],[-72,55],[-68,55],[-64,55],[-60,55],[-126,51],[-122,51],[-118,51],[-114,51],[-110,51],[-106,51],[-102,51],[-98,51],[-94,51],[-90,51],[-86,51],[-82,51],[-78,51],[-74,51],[-70,51],[-66,51],[-62,51],[-58,51],[-54,51],[-123,47],[-119,47],[-115,47],[-111,47],[-107,47],[-103,47],[-99,47],[-95,47],[-91,47],[-87,47],[-83,47],[-79,47],[-75,47],[-71,47],[-67,47],[-122,43],[-118,43],[-114,43],[-110,43],[-106,43],[-102,43],[-98,43],[-94,43],[-90,43],[-86,43],[-82,43],[-78,43],[-74,43],[-70,43],[-120,39],[-116,39],[-112,39],[-108,39],[-104,39],[-100,39],[-96,39],[-92,39],[-88,39],[-84,39],[-80,39],[-76,39],[-72,39],[-116,35],[-112,35],[-108,35],[-104,35],[-100,35],[-96,35],[-92,35],[-88,35],[-84,35],[-80,35],[-113,31],[-109,31],[-105,31],[-101,31],[-97,31],[-93,31],[-89,31],[-85,31],[-81,31],[-110,27],[-106,27],[-102,27],[-98,27],[-94,27],[-90,27],[-86,27],[-82,27],[-106,23],[-102,23],[-98,23],[-94,23],[-90,23],[-82,22],[-78,22],[-156,20],[-98,19],[-94,19],[-90,19],[-72,19],[-90,15],[-86,15],[-84,11],[-80,11],[-76,7],[-72,7],
    // South America
    [-78,3],[-74,3],[-70,3],[-66,3],[-62,3],[-58,3],[-54,3],[-50,3],[-76,-1],[-72,-1],[-68,-1],[-64,-1],[-60,-1],[-56,-1],[-52,-1],[-48,-1],[-76,-5],[-72,-5],[-68,-5],[-64,-5],[-60,-5],[-56,-5],[-52,-5],[-48,-5],[-44,-5],[-40,-5],[-36,-5],[-75,-9],[-71,-9],[-67,-9],[-63,-9],[-59,-9],[-55,-9],[-51,-9],[-47,-9],[-43,-9],[-39,-9],[-35,-9],[-74,-13],[-70,-13],[-66,-13],[-62,-13],[-58,-13],[-54,-13],[-50,-13],[-46,-13],[-42,-13],[-38,-13],[-70,-17],[-66,-17],[-62,-17],[-58,-17],[-54,-17],[-50,-17],[-46,-17],[-42,-17],[-68,-21],[-64,-21],[-60,-21],[-56,-21],[-52,-21],[-48,-21],[-44,-21],[-40,-21],[-69,-25],[-65,-25],[-61,-25],[-57,-25],[-53,-25],[-49,-25],[-70,-29],[-66,-29],[-62,-29],[-58,-29],[-54,-29],[-70,-33],[-66,-33],[-62,-33],[-58,-33],[-71,-37],[-67,-37],[-63,-37],[-59,-37],[-72,-41],[-68,-41],[-64,-41],[-73,-45],[-69,-45],[-65,-45],[-73,-49],[-69,-49],[-70,-53],
    // Europe (UK, Ireland, mainland)
    [10,65],[20,64],[6,63],[7,63],[11,63],[14,63],[15,63],[19,63],[23,63],[27,63],[31,63],[35,63],[-6,59],[-2,59],[2,59],[6,59],[10,59],[14,59],[18,59],[22,59],[26,59],[30,59],[34,59],[-2,58],[-4,56],[-8,55],[0,55],[4,55],[8,55],[12,55],[16,55],[20,55],[24,55],[28,55],[32,55],[-6,54],[-9,52],[0,52],[-8,51],[1,51],[5,51],[9,51],[13,51],[17,51],[21,51],[25,51],[29,51],[33,51],[-3,47],[1,47],[5,47],[9,47],[13,47],[17,47],[21,47],[25,47],[29,47],[33,47],[-7,43],[-3,43],[1,43],[10,43],[14,43],[18,43],[22,43],[26,43],[30,43],[34,43],[-7,39],[-3,39],[1,39],[5,39],[12,39],[16,39],[20,39],[24,39],[28,39],[32,39],[-8,35],[-4,35],[0,35],[5,35],[9,35],[13,35],[28,35],[32,35],
    // Scandinavia north + Svalbard
    [20,79],[16,78],[24,78],[26,70],[28,70],[22,69],[32,69],[18,68],[10,67],[14,67],[18,67],[22,67],[26,67],[30,67],[34,67],[14,66],
    // Africa
    [-10,31],[-6,31],[-2,31],[2,31],[6,31],[10,31],[14,31],[18,31],[22,31],[26,31],[30,31],[35,31],[39,31],[43,31],[47,31],[51,31],[55,31],[59,31],[-13,27],[-9,27],[-5,27],[-1,27],[3,27],[7,27],[11,27],[15,27],[19,27],[23,27],[27,27],[31,27],[36,27],[40,27],[44,27],[48,27],[52,27],[56,27],[60,27],[-15,23],[-11,23],[-7,23],[-3,23],[1,23],[5,23],[9,23],[13,23],[17,23],[21,23],[25,23],[29,23],[33,23],[37,23],[42,23],[46,23],[50,23],[54,23],[58,23],[-15,19],[-11,19],[-7,19],[-3,19],[1,19],[5,19],[9,19],[13,19],[17,19],[21,19],[25,19],[29,19],[33,19],[37,19],[46,19],[50,19],[54,19],[58,19],[-14,15],[-10,15],[-6,15],[-2,15],[2,15],[6,15],[10,15],[14,15],[18,15],[22,15],[26,15],[30,15],[34,15],[38,15],[42,15],[-13,11],[-9,11],[-5,11],[-1,11],[3,11],[7,11],[11,11],[15,11],[19,11],[23,11],[27,11],[31,11],[35,11],[39,11],[43,11],[-11,7],[-7,7],[-3,7],[1,7],[5,7],[9,7],[13,7],[17,7],[21,7],[25,7],[29,7],[33,7],[37,7],[41,7],[10,3],[14,3],[18,3],[22,3],[26,3],[30,3],[10,-1],[14,-1],[18,-1],[22,-1],[26,-1],[30,-1],[34,-1],[38,-1],[42,-1],[12,-5],[16,-5],[20,-5],[24,-5],[28,-5],[32,-5],[36,-5],[40,-5],[14,-9],[18,-9],[22,-9],[26,-9],[30,-9],[34,-9],[38,-9],[14,-13],[18,-13],[22,-13],[26,-13],[30,-13],[34,-13],[38,-13],[44,-14],[14,-17],[18,-17],[22,-17],[26,-17],[30,-17],[34,-17],[47,-18],[16,-21],[20,-21],[24,-21],[28,-21],[32,-21],[48,-22],[18,-25],[22,-25],[26,-25],[30,-25],[45,-25],[20,-29],[24,-29],[28,-29],[20,-33],[24,-33],[28,-33],
    // Northern Siberia (Yamal, Taymyr, Chukotka)
    [98,80],[95,79],[100,79],[103,78],[105,78],[104,77],[100,76],[108,76],[140,75],[145,75],[150,75],[54,74],[96,74],[70,73],[114,73],[56,72],[72,72],[92,72],[118,72],[122,72],[58,71],[66,71],[68,71],[128,71],[144,71],[60,70],[86,70],[134,70],[140,70],[150,70],[62,69],[76,69],[82,69],[156,69],[170,69],[40,68],[48,68],[162,68],[38,67],[42,67],[46,67],[50,67],[54,67],[58,67],[62,67],[66,67],[70,67],[74,67],[78,67],[82,67],[86,67],[90,67],[94,67],[98,67],[102,67],[106,67],[110,67],[114,67],[118,67],[122,67],[126,67],[130,67],[134,67],[138,67],[142,67],[146,67],[150,67],[154,67],[158,67],[162,67],[166,67],[168,67],[170,67],[174,67],[174,67],[178,67],[178,67],
    // Asia (mainland)
    [39,63],[43,63],[47,63],[51,63],[55,63],[59,63],[63,63],[67,63],[71,63],[75,63],[79,63],[83,63],[87,63],[91,63],[95,63],[99,63],[103,63],[107,63],[111,63],[115,63],[119,63],[123,63],[127,63],[131,63],[135,63],[139,63],[143,63],[147,63],[151,63],[155,63],[38,59],[42,59],[46,59],[50,59],[54,59],[58,59],[62,59],[66,59],[70,59],[74,59],[78,59],[82,59],[86,59],[90,59],[94,59],[98,59],[102,59],[106,59],[110,59],[114,59],[118,59],[122,59],[126,59],[130,59],[134,59],[138,59],[142,59],[146,59],[150,59],[154,59],[36,55],[40,55],[44,55],[48,55],[52,55],[56,55],[60,55],[64,55],[68,55],[72,55],[76,55],[80,55],[84,55],[88,55],[92,55],[96,55],[100,55],[104,55],[108,55],[112,55],[116,55],[120,55],[124,55],[128,55],[132,55],[136,55],[140,55],[144,55],[148,55],[152,55],[37,51],[41,51],[45,51],[49,51],[53,51],[57,51],[61,51],[65,51],[69,51],[73,51],[77,51],[81,51],[85,51],[89,51],[93,51],[97,51],[101,51],[105,51],[109,51],[113,51],[117,51],[121,51],[125,51],[129,51],[133,51],[137,51],[141,51],[145,51],[149,51],[153,51],[37,47],[41,47],[45,47],[49,47],[53,47],[57,47],[61,47],[65,47],[69,47],[73,47],[77,47],[81,47],[85,47],[89,47],[93,47],[97,47],[101,47],[105,47],[109,47],[113,47],[117,47],[121,47],[125,47],[129,47],[133,47],[137,47],[141,47],[145,44],[38,43],[42,43],[46,43],[50,43],[54,43],[58,43],[62,43],[66,43],[70,43],[74,43],[78,43],[82,43],[86,43],[90,43],[94,43],[98,43],[102,43],[106,43],[110,43],[114,43],[118,43],[122,43],[126,43],[130,43],[134,43],[138,43],[142,43],[143,43],[141,41],[36,39],[40,39],[44,39],[48,39],[52,39],[56,39],[60,39],[64,39],[68,39],[72,39],[76,39],[80,39],[84,39],[88,39],[92,39],[96,39],[100,39],[104,39],[108,39],[112,39],[116,39],[120,39],[124,39],[128,39],[132,39],[136,39],[140,39],[140,38],[138,36],[36,35],[40,35],[44,35],[48,35],[52,35],[56,35],[60,35],[64,35],[68,35],[72,35],[102,35],[106,35],[110,35],[114,35],[118,35],[122,35],[136,35],[131,34],[133,34],[129,32],[63,31],[67,31],[71,31],[75,31],[79,31],[90,31],[94,31],[98,31],[102,31],[106,31],[110,31],[114,31],[118,31],[122,31],[64,27],[68,27],[72,27],[76,27],[80,27],[90,27],[94,27],[98,27],[102,27],[106,27],[110,27],[114,27],[118,27],[122,27],[121,24],[62,23],[66,23],[70,23],[74,23],[78,23],[94,23],[98,23],[102,23],[106,23],[62,19],[66,19],[70,19],[74,19],[78,19],[96,19],[100,19],[104,19],[108,19],[120,18],[75,15],[79,15],[99,15],[103,15],[107,15],[121,14],[78,11],[99,11],[103,11],[107,11],[123,11],[81,8],[80,7],[99,7],[103,7],[107,7],[125,7],[97,3],[101,3],[105,3],[109,3],[113,3],[117,3],[121,3],[125,3],[129,3],[133,3],[137,3],
    // Southeast Asia + Indonesia + Philippines + New Guinea
    [99,-1],[100,-1],[103,-1],[107,-1],[111,-1],[115,-1],[119,-1],[123,-1],[127,-1],[131,-1],[135,-1],[139,-1],[143,-1],[147,-1],[103,-3],[102,-5],[106,-5],[110,-5],[114,-5],[118,-5],[122,-5],[126,-5],[130,-5],[134,-5],[138,-5],[142,-5],[144,-5],[146,-5],[150,-5],[148,-8],[112,-9],[116,-9],[120,-9],[124,-9],[128,-9],[132,-9],[136,-9],[140,-9],[144,-9],[148,-9],[151,-9],
    // Australia + Tasmania + New Zealand
    [124,-13],[128,-13],[132,-13],[136,-13],[140,-13],[144,-13],[124,-17],[128,-17],[132,-17],[136,-17],[140,-17],[144,-17],[148,-17],[116,-21],[120,-21],[124,-21],[128,-21],[132,-21],[136,-21],[140,-21],[144,-21],[148,-21],[152,-21],[115,-25],[119,-25],[123,-25],[127,-25],[131,-25],[135,-25],[139,-25],[143,-25],[147,-25],[151,-25],[117,-29],[121,-29],[125,-29],[129,-29],[133,-29],[137,-29],[141,-29],[145,-29],[149,-29],[117,-33],[121,-33],[125,-33],[129,-33],[133,-33],[137,-33],[141,-33],[145,-33],[149,-33],[142,-37],[146,-37],[172,-37],[145,-41],[174,-41],[170,-44],[168,-46],
    // Other
    [159,63],[163,63],[167,63],[171,63],[175,63],[179,63],[-42,59],[158,59],[162,59],[166,59],[170,59],[174,59],[178,59],[156,55],[160,55],[164,55],[168,55],[172,55],[176,55],[180,55],[157,51],[161,51],[165,51],[169,51],[173,51],[177,51],[20,-37],
  ];

  // Phase cycle: 0,1,2 with 4s hold + 2s morph
  const PHASE_HOLD = 4000, PHASE_MORPH = 1800;
  let t0 = performance.now();
  let prevNow = 0;

  // Schedule next wave of highlights
  let nextWave = 0;
  function scheduleWave(now){
    const count = 4 + Math.floor(Math.random() * 7); // 4-10 dots per wave
    for (let j = 0; j < count; j++){
      const idx = Math.floor(Math.random() * N);
      const d = dots[idx];
      if (d.hlAlpha > 0.1) continue; // skip already lit dots
      d.activateAt  = now + j * (60 + Math.random() * 140); // stagger 60-200ms apart
      d.hlColor     = TINTS[Math.floor(Math.random() * TINTS.length)];
      d.hlSize      = 0.8 + Math.random() * 4.5;            // size 0.8→5.3 extra radius
      d.hlDur       = 900 + Math.random() * 1400;           // lifetime 0.9-2.3s
      d.hlLife      = -1;                                    // -1 = waiting to activate
    }
    nextWave = now + 260 + Math.random() * 200;
  }

  function getPhaseState(now){
    const cycle = PHASE_HOLD + PHASE_MORPH;
    const total = (now - t0);
    const segIdx = Math.floor(total / cycle) % 3;
    const segTime = total - Math.floor(total/cycle)*cycle;
    let from = segIdx, to = (segIdx + 1) % 3;
    let mix = 0;
    if (segTime > PHASE_HOLD){
      mix = (segTime - PHASE_HOLD) / PHASE_MORPH;
      mix = Math.min(1, Math.max(0, mix));
      mix = mix < 0.5 ? 4*mix*mix*mix : 1 - Math.pow(-2*mix+2,3)/2;
    }
    return {from, to, mix};
  }

  function tick(now){
    if (!W || !H) { requestAnimationFrame(tick); return; }
    const {from, to, mix} = getPhaseState(now);
    const dt = Math.min(50, prevNow ? now - prevNow : 16);
    prevNow = now;

    // Wave scheduler
    if (now >= nextWave) scheduleWave(now);

    // Update each dot's highlight lifecycle
    for (let i = 0; i < N; i++){
      const d = dots[i];
      if (d.hlLife === -1){
        // waiting
        if (now >= d.activateAt) d.hlLife = 0;
      } else if (d.hlLife >= 0 && d.hlDur > 0){
        d.hlLife += dt;
        const p = d.hlLife / d.hlDur;
        if (p < 0.18)       d.hlTarget = p / 0.18;             // fade in
        else if (p < 0.65)  d.hlTarget = 1;                    // hold
        else if (p < 1)     d.hlTarget = 1 - (p - 0.65)/0.35; // fade out
        else { d.hlTarget = 0; d.hlLife = 0; d.hlDur = 0; }   // reset
      }
      // smooth alpha interpolation
      d.hlAlpha += (d.hlTarget - d.hlAlpha) * 0.07;
    }

    ctx.clearRect(0,0,W,H);

    // background subtle radial vignette
    const grd = ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,Math.max(W,H)*0.6);
    grd.addColorStop(0, 'rgba(192,204,114,0.04)');
    grd.addColorStop(1, 'rgba(18,18,18,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0,0,W,H);

    const phaseNames = ['CROWD · PHASE 01', 'GLOBE · PHASE 02', 'WORLD MAP · PHASE 03'];
    if (label) label.textContent = '[ ' + phaseNames[mix < 0.5 ? from : to] + ' ]';

    // Globe rotation - Y-axis spin, continuous
    const cx = W/2, cy = H/2;
    const rotY = (now * 0.0006);
    const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
    // slight axial tilt for character
    const tilt = -0.32;
    const cosT = Math.cos(tilt), sinT = Math.sin(tilt);

    function getTarget(phase, i){
      const arr = targetsByPhase[phase];
      if (!arr) return null;
      const t = arr[i];
      if (!t) return null;
      if (phase === 1 && t.x3d !== undefined){
        // rotate 3D point around Y, then tilt around X, project
        const x1 = t.x3d * cosY + t.z3d * sinY;
        const z1 = -t.x3d * sinY + t.z3d * cosY;
        const y2 = t.y3d * cosT - z1 * sinT;
        const z2 = t.y3d * sinT + z1 * cosT;
        return { x: cx + x1 * t.R, y: cy + y2 * t.R, depth: z2 };
      }
      return { x: t.x, y: t.y, depth: 0 };
    }

    for (let i=0;i<N;i++){
      const d = dots[i];
      const a = getTarget(from, i);
      const b = getTarget(to, i);
      if (!a || !b) continue;
      const tx = a.x + (b.x - a.x) * mix;
      const ty = a.y + (b.y - a.y) * mix;
      // depth: dim back-facing globe dots, bright front
      let depth = a.depth + (b.depth - a.depth) * mix;
      // for non-globe phases depth is 0 -> no effect
      const onGlobe = (from === 1 || to === 1);
      const depthAlpha = onGlobe ? (0.35 + 0.65 * ((depth + 1) / 2)) : 1;
      // subtle wobble
      d.phase += 0.01;
      const wx = Math.sin(d.phase + i)*0.6;
      const wy = Math.cos(d.phase*1.3 + i)*0.6;
      // ease toward target (snappier so rotation stays crisp)
      const ease = onGlobe ? 0.25 : 0.08;
      d.x += (tx + wx - d.x) * ease;
      d.y += (ty + wy - d.y) * ease;

      const hl = d.hlAlpha;
      const isLit = hl > 0.01 || d.lime;
      const dotR = d.r + (isLit ? d.hlSize * hl : 0);

      ctx.beginPath();
      ctx.arc(d.x, d.y, dotR, 0, Math.PI*2);
      if (isLit && hl > 0.01){
        const [cr,cg,cb] = d.hlColor;
        const a = (0.55 + 0.45 * hl) * depthAlpha;
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${a.toFixed(3)})`;
      } else if (d.lime){
        ctx.fillStyle = 'rgba(192,204,114,' + ((0.4 + Math.sin(d.phase*2)*0.15) * depthAlpha) + ')';
      } else {
        ctx.fillStyle = 'rgba(255,255,255,' + (d.a * 0.5 * depthAlpha) + ')';
      }
      ctx.fill();

      // soft glow ring for highlighted dots
      if (hl > 0.05){
        const [cr,cg,cb] = d.hlColor;
        ctx.beginPath();
        ctx.arc(d.x, d.y, dotR + 2.5 + d.hlSize * 0.5, 0, Math.PI*2);
        ctx.strokeStyle = `rgba(${cr},${cg},${cb},${(0.18 * hl * depthAlpha).toFixed(3)})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', resize);
  resize();
  requestAnimationFrame(tick);
})();