/* ==================================================================
   VIVOOK · script.js
   Animaciones / interacciones del sitio.

   Bloques:
     1. Counters (stats animadas al hacer scroll)
     2. Role tabs (Soluciones para cada rol)
     3. Scroll reveal (fade-in + translateY al entrar al viewport)
     4. Sticky header (cambia de fondo al pasar el hero)
     5. Pricing calculator (resalta el plan según viviendas)
     6. Feature modals (popups con tablas comparativas)
     7. Mobile menu (hamburger + dropdowns en acordeón)
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
  if (counters.length) {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const formatNumber = (n) => n.toLocaleString('en-US');

    const animateCounter = (el) => {
      const target = parseInt(el.dataset.count, 10);
      const suffix = el.dataset.suffix || '';

      if (reduced || !Number.isFinite(target)) {
        el.textContent = formatNumber(target) + suffix;
        return;
      }

      const duration = 1800;
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

    if (!('IntersectionObserver' in window)) {
      counters.forEach(animateCounter);
    } else {
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
    }
  }

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
  // `.hero` es el hero oscuro del index. En páginas sin él (precios, etc.)
  // el header arranca siempre en estado "scrolled" para que el logo dark sea visible.
  const hasDarkHero = document.querySelector('.hero');

  if (header) {
    if (!hasDarkHero) {
      header.classList.add('is-scrolled');
    } else {
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
  }

  /* ---------- 5. Pricing calculator (viviendas + moneda) ---------- */
  const pricingInput = document.querySelector('#pricing-units');
  const currencySelect = document.querySelector('#pricing-currency');
  const plans = document.querySelectorAll('.plan[data-min][data-max]');

  if (plans.length) {
    const ranges = Array.from(plans).map((el) => ({
      el,
      min: parseInt(el.dataset.min, 10),
      max: parseInt(el.dataset.max, 10),
    }));

    // --- Plan recomendado según viviendas ---
    const updateRecommended = (n) => {
      plans.forEach((p) => p.classList.remove('plan--is-recommended', 'is-recommended'));
      if (!Number.isFinite(n) || n < 1) {
        const fallback = document.querySelector('.plan[data-plan="pro"]');
        if (fallback) fallback.classList.add('plan--is-recommended');
        return;
      }
      const match = ranges.find((r) => n >= r.min && n <= r.max);
      if (match) match.el.classList.add('is-recommended');
    };

    if (pricingInput) {
      pricingInput.addEventListener('input', (e) => {
        updateRecommended(parseInt(e.target.value, 10));
      });
      if (pricingInput.value) updateRecommended(parseInt(pricingInput.value, 10));
    }

    // --- Switch de moneda (MXN ↔ USD) ---
    const updateCurrency = (currency) => {
      plans.forEach((plan) => {
        const amount = plan.querySelector('.plan__amount');
        const unit = plan.querySelector('.plan__unit');
        const alt = plan.querySelector('.plan__alt');
        const note = plan.querySelector('.plan__price-note');

        // Elite no tiene precios variables
        if (!plan.dataset.mxnMain) return;

        if (currency === 'usd') {
          if (amount) amount.textContent = plan.dataset.usdMain;
          if (unit) unit.textContent = 'USD/mes';
          if (alt) alt.style.display = 'none';
          if (note) note.textContent = 'Cargo único mensual';
        } else {
          if (amount) amount.textContent = plan.dataset.mxnMain;
          if (unit) unit.textContent = 'MXN/mes';
          if (alt) {
            alt.style.display = '';
            alt.textContent = plan.dataset.mxnAlt;
          }
          if (note) note.textContent = 'Cargo automático mensual';
        }
      });
    };

    if (currencySelect) {
      currencySelect.addEventListener('change', (e) => {
        updateCurrency(e.target.value);
      });
    }
  }

  /* ---------- 6. Feature modals ---------- */
  const modalTriggers = document.querySelectorAll('[data-modal-id]');
  const modals = document.querySelectorAll('.modal');
  if (modalTriggers.length && modals.length) {
    let lastFocused = null;

    const openModal = (modal) => {
      lastFocused = document.activeElement;
      modal.hidden = false;
      // forzar reflow para que la transición de opacity funcione
      // eslint-disable-next-line no-unused-expressions
      modal.offsetHeight;
      modal.classList.add('is-open');
      document.body.classList.add('modal-open');

      // Foco al botón de cerrar
      const closeBtn = modal.querySelector('.modal__close');
      if (closeBtn) closeBtn.focus();
    };

    const closeModal = (modal) => {
      modal.classList.remove('is-open');
      document.body.classList.remove('modal-open');
      // Esperar a que termine la transición antes de hidden
      setTimeout(() => {
        modal.hidden = true;
        if (lastFocused && typeof lastFocused.focus === 'function') {
          lastFocused.focus();
        }
      }, 250);
    };

    // Abrir
    modalTriggers.forEach((trigger) => {
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        const id = trigger.dataset.modalId;
        const modal = document.getElementById(id);
        if (modal) openModal(modal);
      });
    });

    // Cerrar (X o backdrop)
    modals.forEach((modal) => {
      modal.querySelectorAll('[data-modal-close]').forEach((btn) => {
        btn.addEventListener('click', () => closeModal(modal));
      });
    });

    // ESC para cerrar
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const openModalEl = document.querySelector('.modal.is-open');
        if (openModalEl) closeModal(openModalEl);
      }
    });

    // Trap focus dentro del modal (Tab/Shift+Tab)
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;
      const openModalEl = document.querySelector('.modal.is-open');
      if (!openModalEl) return;
      const focusables = openModalEl.querySelectorAll(
        'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  }

  /* ---------- 7. Mobile menu (hamburger + acordeón) ---------- */
  const menuToggle = document.querySelector('.menu-toggle');
  const navMain = document.querySelector('#main-nav');
  const navClose = document.querySelector('.nav__close');

  if (menuToggle && navMain) {
    // Crear un backdrop dinámicamente
    const backdrop = document.createElement('div');
    backdrop.className = 'menu-backdrop';
    document.body.appendChild(backdrop);

    const openMenu = () => {
      navMain.classList.add('is-open');
      menuToggle.classList.add('is-active');
      menuToggle.setAttribute('aria-expanded', 'true');
      backdrop.classList.add('is-visible');
      document.body.classList.add('menu-open');
    };

    const closeMenu = () => {
      navMain.classList.remove('is-open');
      menuToggle.classList.remove('is-active');
      menuToggle.setAttribute('aria-expanded', 'false');
      backdrop.classList.remove('is-visible');
      document.body.classList.remove('menu-open');
      // Cerrar dropdowns abiertos también
      document.querySelectorAll('.nav-item.is-open').forEach((el) => el.classList.remove('is-open'));
    };

    menuToggle.addEventListener('click', () => {
      navMain.classList.contains('is-open') ? closeMenu() : openMenu();
    });

    if (navClose) navClose.addEventListener('click', closeMenu);
    backdrop.addEventListener('click', closeMenu);

    // ESC para cerrar
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navMain.classList.contains('is-open')) closeMenu();
    });

    // Cerrar al click en un link interno del nav (excepto trigger de dropdown)
    navMain.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        // Si el link tiene clase nav-trigger Y estamos en mobile, no cerrar (es solo expandir)
        if (link.classList.contains('nav-trigger') && window.innerWidth <= 980) return;
        closeMenu();
      });
    });

    // Cerrar al cambiar de mobile a desktop
    window.addEventListener('resize', () => {
      if (window.innerWidth > 980 && navMain.classList.contains('is-open')) {
        closeMenu();
      }
    });

    // Dropdowns en mobile: click expande/colapsa
    document.querySelectorAll('.nav-item.has-dropdown .nav-trigger').forEach((trigger) => {
      trigger.addEventListener('click', (e) => {
        if (window.innerWidth > 980) return; // en desktop usa hover normal
        e.preventDefault();
        const item = trigger.closest('.nav-item');
        item.classList.toggle('is-open');
      });
    });
  }
})();
