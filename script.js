/* ==================================================================
   VIVOOK · script.js
   Animaciones / interacciones del sitio.

   Bloques:
     1. Counters (stats animadas al hacer scroll)
     2. Role tabs (Soluciones para cada rol)
     3. Scroll reveal (fade-in + translateY al entrar al viewport)
     4. Sticky header (cambia de fondo al pasar el hero)
================================================================== */

(function () {
  'use strict';

  /* ---------- 2. Role tabs ---------- */
  const tabs = document.querySelectorAll('.role-tab');
  const contents = document.querySelectorAll('.role-content');
  if (tabs.length && contents.length) {
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const role = tab.dataset.role;
        tabs.forEach((t) => t.classList.toggle('is-active', t === tab));
        contents.forEach((c) => c.classList.toggle('is-active', c.id === 'role-' + role));
      });
    });
  }

  /* ---------- 1. Counters ---------- */
  const counters = document.querySelectorAll('.stat__num[data-count]');
  if (!counters.length) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const formatNumber = (n) => n.toLocaleString('en-US');

  const animateCounter = (el) => {
    const target = parseInt(el.dataset.count, 10);
    const suffix = el.dataset.suffix || '';

    if (reduced || !Number.isFinite(target)) {
      el.textContent = formatNumber(target) + suffix;
      return;
    }

    const duration = 1800;          // ms
    const easeOut = (t) => 1 - Math.pow(1 - t, 3);
    const start = performance.now();

    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const value = Math.floor(target * easeOut(t));
      el.textContent = formatNumber(value) + suffix;
      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        el.textContent = formatNumber(target) + suffix;
      }
    };

    requestAnimationFrame(tick);
  };

  // Si no hay soporte para IntersectionObserver, anima al cargar
  if (!('IntersectionObserver' in window)) {
    counters.forEach(animateCounter);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.4 }
  );

  counters.forEach((el) => observer.observe(el));

  /* ---------- 3. Scroll reveal ---------- */
  const reveals = document.querySelectorAll('.reveal');
  if (reveals.length && 'IntersectionObserver' in window) {
    const revealObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
    );
    reveals.forEach((el) => revealObs.observe(el));
  } else {
    // Fallback: si no hay observer, mostrar todo
    reveals.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------- 4. Sticky header ---------- */
  const header = document.querySelector('.site-header');
  if (header) {
    const threshold = 80;
    let ticking = false;
    const update = () => {
      header.classList.toggle('is-scrolled', window.scrollY > threshold);
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });
    update();
  }
})();
