// ═══════════════════════════════════════════════════
//  Anuja Portfolio — Full Interactive JS
//  Cursor: dot + lagging ring + spotlight + canvas trail
//  Background: grid glow follows mouse
//  Extras: scroll reveal, nav highlight, tilt, parallax
// ═══════════════════════════════════════════════════

// ── Hide default cursor ──
document.documentElement.style.cursor = 'none';

// ── Grab elements ──
const spotlight   = document.getElementById('cursor-spotlight');
const gridLight   = document.getElementById('cursor-grid-light');
const cursorDot   = document.getElementById('cursor-dot');
const canvas      = document.getElementById('trail-canvas');
const ctx         = canvas.getContext('2d');

// ── Resize canvas to fill viewport ──
function resizeCanvas() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// ═══════════════════════════════════════════════════
//  CURSOR STATE
// ═══════════════════════════════════════════════════
let mouseX = -999, mouseY = -999;   // raw mouse position
let dotX   = -999, dotY   = -999;   // snaps instantly
let eyeX   = -999, eyeY   = -999;   // eye pair follows with lag

const EYE_EASE       = 0.10;  // lag factor (lower = more drag)
const MAX_IRIS_OFFSET = 8;    // max px iris moves inside eyeball

// Half the eye-pair width (38px ball × 2 + 8px gap = 84px total)
// Left iris center relative to eye-cursor center: -23px, right: +23px
const EYE_HALF_GAP = 23;

// Grab eye elements
const eyeCursor = document.getElementById('eye-cursor');
const irisLeft  = document.getElementById('iris-left');
const irisRight = document.getElementById('iris-right');

// Trail particles pool
const particles = [];
const MAX_PARTICLES = 28;

class Particle {
  constructor(x, y) {
    this.x     = x;
    this.y     = y;
    this.vx    = (Math.random() - 0.5) * 1.2;
    this.vy    = (Math.random() - 0.5) * 1.2 - 0.4;
    this.life  = 1.0;
    this.decay = 0.028 + Math.random() * 0.018;
    this.r     = 2.5 + Math.random() * 3.5;
    const hue  = 355 + Math.round((Math.random() - 0.5) * 20);
    this.color = `hsla(${hue}, 70%, 48%,`;
  }
  update() {
    this.x    += this.vx;
    this.y    += this.vy;
    this.vy   += 0.04;
    this.r    *= 0.97;
    this.life -= this.decay;
  }
  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, Math.max(this.r, 0.1), 0, Math.PI * 2);
    ctx.fillStyle = `${this.color}${this.life.toFixed(2)})`;
    ctx.fill();
  }
}

let lastSpawn = 0;
function spawnParticle(x, y) {
  const now = performance.now();
  if (now - lastSpawn < 18) return;
  lastSpawn = now;
  if (particles.length >= MAX_PARTICLES) particles.shift();
  particles.push(new Particle(x, y));
}

// ── Click sparks ──
const sparks = [];
class Spark {
  constructor(x, y) {
    this.x    = x; this.y = y;
    const ang = Math.random() * Math.PI * 2;
    const spd = 2 + Math.random() * 4;
    this.vx   = Math.cos(ang) * spd;
    this.vy   = Math.sin(ang) * spd;
    this.life = 1.0;
    this.r    = 1.5 + Math.random() * 2;
  }
  update() {
    this.x += this.vx; this.y += this.vy;
    this.vx *= 0.92;   this.vy *= 0.92;
    this.life -= 0.045;
  }
  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, Math.max(this.r * this.life, 0.1), 0, Math.PI * 2);
    ctx.fillStyle = `rgba(212,43,43,${(this.life * 0.9).toFixed(2)})`;
    ctx.fill();
  }
}

document.addEventListener('click', (e) => {
  const ripple = document.createElement('div');
  ripple.className = 'cursor-ripple';
  ripple.style.left = e.clientX + 'px';
  ripple.style.top  = e.clientY + 'px';
  document.body.appendChild(ripple);
  ripple.addEventListener('animationend', () => ripple.remove());
  for (let i = 0; i < 16; i++) sparks.push(new Spark(e.clientX, e.clientY));
});

// ═══════════════════════════════════════════════════
//  MOUSE MOVE — positions + spotlight
// ═══════════════════════════════════════════════════
document.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;

  dotX = mouseX; dotY = mouseY;
  cursorDot.style.left = dotX + 'px';
  cursorDot.style.top  = dotY + 'px';

  document.documentElement.style.setProperty('--cx', mouseX + 'px');
  document.documentElement.style.setProperty('--cy', mouseY + 'px');
  spotlight.style.background = `radial-gradient(600px circle at ${mouseX}px ${mouseY}px, rgba(212,43,43,0.08) 0%, rgba(212,43,43,0.03) 30%, transparent 70%)`;
  gridLight.style.background = `radial-gradient(320px circle at ${mouseX}px ${mouseY}px, rgba(255,255,255,0.6) 0%, transparent 70%)`;

  spawnParticle(mouseX, mouseY);
});

// ═══════════════════════════════════════════════════
//  HOVER STATE — irises dilate on interactive elements
// ═══════════════════════════════════════════════════
const hoverTargets = document.querySelectorAll(
  'a, button, .project-item, .exp-item, .service-item, .btn-pill, .btn-outline'
);
hoverTargets.forEach(el => {
  el.addEventListener('mouseenter', () => {
    [irisLeft, irisRight].forEach(iris => {
      if (iris) { iris.style.width = '24px'; iris.style.height = '24px'; }
    });
    document.documentElement.style.cursor = 'none';
  });
  el.addEventListener('mouseleave', () => {
    [irisLeft, irisRight].forEach(iris => {
      if (iris) { iris.style.width = ''; iris.style.height = ''; }
    });
  });
});

// ── Helper: compute iris offset for one eye ──
function gazeOffset(eyeCenterX, eyeCenterY) {
  const dx   = mouseX - eyeCenterX;
  const dy   = mouseY - eyeCenterY;
  const ang  = Math.atan2(dy, dx);
  const dist = Math.min(Math.hypot(dx, dy), MAX_IRIS_OFFSET);
  return {
    x: dist * Math.cos(ang),
    y: dist * Math.sin(ang)
  };
}

// ═══════════════════════════════════════════════════
//  ANIMATION LOOP — eye lag + dual-iris gaze + trail
// ═══════════════════════════════════════════════════
function animate() {
  // Lerp eye pair toward cursor with lag
  eyeX += (mouseX - eyeX) * EYE_EASE;
  eyeY += (mouseY - eyeY) * EYE_EASE;

  eyeCursor.style.left = eyeX + 'px';
  eyeCursor.style.top  = eyeY + 'px';

  // Each iris tracks from its own screen-space center
  const leftCenter  = { x: eyeX - EYE_HALF_GAP, y: eyeY };
  const rightCenter = { x: eyeX + EYE_HALF_GAP, y: eyeY };

  const lo = gazeOffset(leftCenter.x,  leftCenter.y);
  const ro = gazeOffset(rightCenter.x, rightCenter.y);

  if (irisLeft)  irisLeft.style.transform  = `translate(calc(-50% + ${lo.x.toFixed(2)}px), calc(-50% + ${lo.y.toFixed(2)}px))`;
  if (irisRight) irisRight.style.transform = `translate(calc(-50% + ${ro.x.toFixed(2)}px), calc(-50% + ${ro.y.toFixed(2)}px))`;

  // Canvas trail & sparks
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update(); particles[i].draw();
    if (particles[i].life <= 0) particles.splice(i, 1);
  }
  for (let i = sparks.length - 1; i >= 0; i--) {
    sparks[i].update(); sparks[i].draw();
    if (sparks[i].life <= 0) sparks.splice(i, 1);
  }

  requestAnimationFrame(animate);
}
animate();


// ═══════════════════════════════════════════════════
//  NAVBAR — scroll shadow
// ═══════════════════════════════════════════════════
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 20);
});

// ═══════════════════════════════════════════════════
//  SCROLL REVEAL — IntersectionObserver
// ═══════════════════════════════════════════════════
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

// Project items have their own opacity/transform
document.querySelectorAll('.project-item').forEach(el => revealObserver.observe(el));

// Generic reveal for other sections
const toReveal = document.querySelectorAll(
  '.section-label, .section-title-large, .intro-strip, .exp-item, .about-inner, .contact-inner, .footer-inner'
);
toReveal.forEach(el => {
  el.classList.add('reveal');
  revealObserver.observe(el);
});

// ── Service items: staggered slide-in ──
const serviceObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      serviceObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -30px 0px' });

document.querySelectorAll('.service-item').forEach(el => serviceObserver.observe(el));

// ═══════════════════════════════════════════════════
//  ACTIVE NAV — highlight current section
// ═══════════════════════════════════════════════════
const navLinks = document.querySelectorAll('.nav-link:not(.nav-link-filled)');
const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(l => { l.style.background = ''; l.style.color = ''; });
      const active = document.querySelector(`.nav-link[href="#${entry.target.id}"]`);
      if (active && !active.classList.contains('nav-link-filled')) {
        active.style.background = 'rgba(212,43,43,0.08)';
      }
    }
  });
}, { threshold: 0.4 });

document.querySelectorAll('section[id]').forEach(s => sectionObserver.observe(s));

// ═══════════════════════════════════════════════════
//  PROJECT CARDS — 3D tilt on hover
// ═══════════════════════════════════════════════════
document.querySelectorAll('.project-item').forEach(item => {
  item.addEventListener('mousemove', (e) => {
    const rect = item.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width  - 0.5;
    const y = (e.clientY - rect.top)  / rect.height - 0.5;
    const img = item.querySelector('.project-image img');
    if (img) img.style.transform = `scale(1.04) rotateY(${x * 7}deg) rotateX(${-y * 5}deg)`;
  });
  item.addEventListener('mouseleave', () => {
    const img = item.querySelector('.project-image img');
    if (img) img.style.transform = '';
  });
});

// ═══════════════════════════════════════════════════
//  HERO — parallax on inline images with mouse
// ═══════════════════════════════════════════════════
const hero       = document.querySelector('.hero');
const inlineImgs = document.querySelectorAll('.inline-img');

if (hero) {
  hero.addEventListener('mousemove', (e) => {
    const rect = hero.getBoundingClientRect();
    const cx   = (e.clientX - rect.left  - rect.width  / 2) / rect.width;
    const cy   = (e.clientY - rect.top   - rect.height / 2) / rect.height;
    inlineImgs.forEach((img, i) => {
      const depth = (i + 1) * 10;
      img.style.transform = `translate(${cx * depth}px, ${cy * depth}px) rotate(${cx * 5}deg)`;
    });
  });
  hero.addEventListener('mouseleave', () => {
    inlineImgs.forEach(img => { img.style.transform = ''; });
  });
}

// ═══════════════════════════════════════════════════
//  MAGNETIC BUTTONS — subtle pull toward cursor
// ═══════════════════════════════════════════════════
document.querySelectorAll('.btn-pill, .btn-outline, .nav-link').forEach(btn => {
  btn.addEventListener('mousemove', (e) => {
    const rect = btn.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width  / 2) * 0.25;
    const y = (e.clientY - rect.top  - rect.height / 2) * 0.25;
    btn.style.transform = `translate(${x}px, ${y}px)`;
  });
  btn.addEventListener('mouseleave', () => {
    btn.style.transform = '';
  });
});

// ═══════════════════════════════════════════════════
//  PAGE LOAD — fade in
// ═══════════════════════════════════════════════════
window.addEventListener('load', () => {
  document.body.style.opacity = '0';
  document.body.style.transition = 'opacity 0.5s ease';
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.body.style.opacity = '1';
    });
  });
});

// ═══════════════════════════════════════════════════
//  HERO SLIDESHOWS — cycle photos every 2 seconds
// ═══════════════════════════════════════════════════
function startSlideshow(slideshowId, interval, startDelay) {
  setTimeout(() => {
    const slides = document.querySelectorAll(`#${slideshowId} .slide-img`);
    if (!slides.length) return;
    let current = 0;
    setInterval(() => {
      slides[current].classList.remove('slide-active');
      current = (current + 1) % slides.length;
      slides[current].classList.add('slide-active');
    }, interval);
  }, startDelay);
}

// Slideshow 1 — between "Product" and "Designer" (starts immediately)
startSlideshow('hero-slideshow',   2000, 0);

// Slideshow 2 — after "crafting design solutions" (1 second offset)
startSlideshow('hero-slideshow-2', 2000, 1000);

// Slideshow 3 — before "visual stories" (500ms offset)
startSlideshow('hero-slideshow-3', 2000, 500);

// ═══════════════════════════════════════════════════
//  PROJECT CARD CAROUSEL
// ═══════════════════════════════════════════════════
(function() {
  const carousel   = document.getElementById('projectCarousel');
  const prevBtn    = document.getElementById('carousel-prev');
  const nextBtn    = document.getElementById('carousel-next');
  const dots       = document.querySelectorAll('.carousel-dot');
  if (!carousel) return;

  let currentIndex = 0;
  const cards      = carousel.querySelectorAll('.project-card');
  const total      = cards.length;

  function getCardWidth() {
    if (!cards[0]) return 0;
    const style = getComputedStyle(carousel);
    const gap   = parseFloat(style.gap) || 24;
    return cards[0].getBoundingClientRect().width + gap;
  }

  function goTo(index) {
    currentIndex = Math.max(0, Math.min(index, total - 1));
    carousel.style.transform = `translateX(-${currentIndex * getCardWidth()}px)`;

    // update dots
    dots.forEach((d, i) => d.classList.toggle('active', i === currentIndex));

    // update button states
    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex >= total - 1;
  }

  prevBtn.addEventListener('click', () => goTo(currentIndex - 1));
  nextBtn.addEventListener('click', () => goTo(currentIndex + 1));

  dots.forEach((dot) => {
    dot.addEventListener('click', () => goTo(parseInt(dot.dataset.index)));
  });

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft')  goTo(currentIndex - 1);
    if (e.key === 'ArrowRight') goTo(currentIndex + 1);
  });

  // Drag to scroll
  let dragStart = 0, isDragging = false;

  carousel.addEventListener('mousedown', (e) => {
    isDragging = true;
    dragStart  = e.clientX;
    carousel.classList.add('dragging');
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
  });

  window.addEventListener('mouseup', (e) => {
    if (!isDragging) return;
    isDragging = false;
    carousel.classList.remove('dragging');
    const delta = dragStart - e.clientX;
    if (Math.abs(delta) > 60) goTo(delta > 0 ? currentIndex + 1 : currentIndex - 1);
  });

  // Touch swipe
  let touchStart = 0;
  carousel.addEventListener('touchstart', (e) => { touchStart = e.touches[0].clientX; }, { passive: true });
  carousel.addEventListener('touchend',   (e) => {
    const delta = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(delta) > 50) goTo(delta > 0 ? currentIndex + 1 : currentIndex - 1);
  });

  // Recompute on resize
  window.addEventListener('resize', () => goTo(currentIndex));

  // Init
  goTo(0);
})();

// ═══════════════════════════════════════════════════
//  ANIMATED BACKGROUND — Floating UI/Design Shapes
// ═══════════════════════════════════════════════════
(function () {
  const bgCanvas = document.getElementById('bg-canvas');
  if (!bgCanvas) return;
  const bgCtx = bgCanvas.getContext('2d');

  function resizeBg() {
    bgCanvas.width  = window.innerWidth;
    bgCanvas.height = window.innerHeight;
  }
  resizeBg();
  window.addEventListener('resize', resizeBg);

  const RED   = 'rgba(212, 43, 43,';
  const PEACH = 'rgba(220, 90, 70,';

  // Shape types reflecting UI/UX design tools
  const TYPES = ['card', 'circle', 'pill', 'cross', 'dot', 'frame', 'tag', 'ring'];

  class BgShape {
    constructor(init) {
      this.spawn(init);
    }

    spawn(init) {
      this.type   = TYPES[Math.floor(Math.random() * TYPES.length)];
      this.x      = Math.random() * (bgCanvas.width  + 200) - 100;
      this.y      = init
                      ? Math.random() * bgCanvas.height
                      : bgCanvas.height + 80;
      this.size   = 18 + Math.random() * 70;
      this.speed  = 0.08 + Math.random() * 0.22;
      this.dx     = (Math.random() - 0.5) * 0.25;
      this.rot    = Math.random() * Math.PI * 2;
      this.rotSpd = (Math.random() - 0.5) * 0.004;
      this.alpha  = 0.028 + Math.random() * 0.055;
      this.color  = Math.random() > 0.5 ? RED : PEACH;
      this.lw     = 1 + Math.random() * 1.2;
    }

    update() {
      this.y   -= this.speed;
      this.x   += this.dx;
      this.rot += this.rotSpd;
      if (this.y < -120) this.spawn(false);
    }

    draw() {
      bgCtx.save();
      bgCtx.translate(this.x, this.y);
      bgCtx.rotate(this.rot);

      bgCtx.strokeStyle = `${this.color}${this.alpha})`;
      bgCtx.fillStyle   = `${this.color}${(this.alpha * 0.18).toFixed(3)})`;
      bgCtx.lineWidth   = this.lw;
      bgCtx.lineCap     = 'round';
      bgCtx.lineJoin    = 'round';

      const s = this.size;

      switch (this.type) {
        // ── UI card / rectangle ──
        case 'card': {
          const w = s * 1.55, h = s;
          bgCtx.beginPath();
          bgCtx.roundRect(-w / 2, -h / 2, w, h, s * 0.14);
          bgCtx.stroke();
          bgCtx.fill();
          // header bar inside card
          bgCtx.beginPath();
          bgCtx.roundRect(-w / 2 + 4, -h / 2 + 4, w - 8, h * 0.22, 3);
          bgCtx.fillStyle = `${this.color}${(this.alpha * 0.35).toFixed(3)})`;
          bgCtx.fill();
          break;
        }

        // ── Circle / avatar ──
        case 'circle': {
          bgCtx.beginPath();
          bgCtx.arc(0, 0, s / 2, 0, Math.PI * 2);
          bgCtx.stroke();
          bgCtx.fill();
          break;
        }

        // ── Pill / button ──
        case 'pill': {
          const pw = s * 2.2, ph = s * 0.48;
          bgCtx.beginPath();
          bgCtx.roundRect(-pw / 2, -ph / 2, pw, ph, ph / 2);
          bgCtx.stroke();
          break;
        }

        // ── Crosshair / anchor point ──
        case 'cross': {
          const arm = s * 0.48;
          bgCtx.beginPath();
          bgCtx.moveTo(-arm, 0); bgCtx.lineTo(arm, 0);
          bgCtx.moveTo(0, -arm); bgCtx.lineTo(0, arm);
          bgCtx.stroke();
          // small center dot
          bgCtx.beginPath();
          bgCtx.arc(0, 0, 2.5, 0, Math.PI * 2);
          bgCtx.fillStyle = `${this.color}${(this.alpha * 1.5).toFixed(3)})`;
          bgCtx.fill();
          break;
        }

        // ── Dot ──
        case 'dot': {
          bgCtx.beginPath();
          bgCtx.arc(0, 0, Math.max(s * 0.14, 2), 0, Math.PI * 2);
          bgCtx.fillStyle = `${this.color}${(this.alpha * 1.8).toFixed(3)})`;
          bgCtx.fill();
          break;
        }

        // ── Corner-bracket frame (Figma-style selection) ──
        case 'frame': {
          const half = s / 2, arm2 = s * 0.25;
          bgCtx.beginPath();
          // top-left
          bgCtx.moveTo(-half + arm2, -half);
          bgCtx.lineTo(-half, -half);
          bgCtx.lineTo(-half, -half + arm2);
          // top-right
          bgCtx.moveTo(half - arm2, -half);
          bgCtx.lineTo(half, -half);
          bgCtx.lineTo(half, -half + arm2);
          // bottom-right
          bgCtx.moveTo(half, half - arm2);
          bgCtx.lineTo(half, half);
          bgCtx.lineTo(half - arm2, half);
          // bottom-left
          bgCtx.moveTo(-half + arm2, half);
          bgCtx.lineTo(-half, half);
          bgCtx.lineTo(-half, half - arm2);
          bgCtx.stroke();
          break;
        }

        // ── Tag / badge ──
        case 'tag': {
          const tw = s * 1.3, th = s * 0.42;
          bgCtx.beginPath();
          bgCtx.roundRect(-tw / 2, -th / 2, tw, th, th / 2);
          bgCtx.stroke();
          break;
        }

        // ── Ring (double circle) ──
        case 'ring': {
          bgCtx.beginPath();
          bgCtx.arc(0, 0, s / 2, 0, Math.PI * 2);
          bgCtx.stroke();
          bgCtx.beginPath();
          bgCtx.arc(0, 0, s / 2 * 0.62, 0, Math.PI * 2);
          bgCtx.stroke();
          break;
        }
      }

      bgCtx.restore();
    }
  }

  // Populate pool
  const BG_SHAPES = Array.from({ length: 32 }, () => new BgShape(true));

  function animateBg() {
    bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
    BG_SHAPES.forEach(sh => { sh.update(); sh.draw(); });
    requestAnimationFrame(animateBg);
  }

  animateBg();
})();

