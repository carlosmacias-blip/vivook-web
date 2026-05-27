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
     8. Contact form (submit AJAX a Web3Forms)
     9. Upcoming events (próximas capacitaciones desde Google Calendar)
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

  /* ---------- 3. Scroll reveal: desactivado (el contenido se muestra de inmediato) ---------- */

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

  /* ---------- 4b. Sticky CTA: aparece tras pasar el hero ---------- */
  const stickyCta = document.querySelector('.sticky-cta');
  if (stickyCta) {
    const heroEl = document.querySelector(
      '.hero, .modulo-hero, .diff-hero, .legal-hero, .contact-hero, .features-hero, .learn-hero, .academy-hero, .pricing-hero, .partners-hero'
    );
    let ctaTicking = false;
    const updateStickyCta = () => {
      const threshold = heroEl ? heroEl.offsetHeight - 120 : window.innerHeight * 0.6;
      stickyCta.classList.toggle('is-visible', window.scrollY > threshold);
      ctaTicking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ctaTicking) {
        requestAnimationFrame(updateStickyCta);
        ctaTicking = true;
      }
    }, { passive: true });
    updateStickyCta();
  }

  /* ---------- 4c. Tilt 3D en .browser-frame (sigue el cursor) ---------- */
  const tiltEls = document.querySelectorAll('.browser-frame');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (tiltEls.length && !reducedMotion && window.matchMedia('(hover: hover)').matches) {
    const MAX = 9; // grados máximos de inclinación
    tiltEls.forEach((el) => {
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;   // 0..1
        const py = (e.clientY - r.top) / r.height;   // 0..1
        const rotY = (px - 0.5) * 2 * MAX;
        const rotX = -(py - 0.5) * 2 * MAX;
        el.classList.add('is-tilting');
        el.style.transform = `perspective(900px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg)`;
      });
      el.addEventListener('mouseleave', () => {
        el.classList.remove('is-tilting');
        el.style.transform = '';
      });
    });
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
      // Restaurar preferencia guardada
      try {
        const saved = localStorage.getItem('vivook-currency');
        if (saved && (saved === 'mxn' || saved === 'usd')) {
          currencySelect.value = saved;
          updateCurrency(saved);
        }
      } catch (_) { /* localStorage bloqueado (ej. modo privado) */ }

      currencySelect.addEventListener('change', (e) => {
        updateCurrency(e.target.value);
        try { localStorage.setItem('vivook-currency', e.target.value); } catch (_) {}
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

  /* ---------- 8. Contact form (Web3Forms via AJAX) ---------- */
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    const submitBtn = document.getElementById('contact-submit');
    const submitLabel = contactForm.querySelector('.contact-form__submit-label');
    const successBox = contactForm.querySelector('.contact-form__status--success');
    const errorBox = contactForm.querySelector('.contact-form__status--error');

    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Reset UI
      if (successBox) successBox.hidden = true;
      if (errorBox) errorBox.hidden = true;

      // Disable + show loading
      submitBtn.disabled = true;
      const originalLabel = submitLabel.textContent;
      submitLabel.textContent = 'Enviando...';

      try {
        const formData = new FormData(contactForm);
        const response = await fetch(contactForm.action, {
          method: 'POST',
          body: formData,
          headers: { Accept: 'application/json' },
        });

        const data = await response.json().catch(() => ({}));

        if (response.ok && data.success !== false) {
          contactForm.reset();
          if (successBox) successBox.hidden = false;
          submitLabel.textContent = 'Enviado ✓';
          // Volver al estado normal después de 3 segundos
          setTimeout(() => {
            submitLabel.textContent = originalLabel;
            submitBtn.disabled = false;
          }, 3000);
        } else {
          throw new Error(data.message || 'Error en el envío');
        }
      } catch (err) {
        if (errorBox) errorBox.hidden = false;
        submitLabel.textContent = originalLabel;
        submitBtn.disabled = false;
        console.error('Contact form error:', err);
      }
    });
  }

  /* ---------- 9a. Toggle "Ver calendario completo" ---------- */
  const calendarToggle = document.getElementById('toggle-calendar');
  const fullCalendar = document.getElementById('full-calendar');
  if (calendarToggle && fullCalendar) {
    calendarToggle.addEventListener('click', () => {
      const isOpen = !fullCalendar.hidden;
      fullCalendar.hidden = isOpen;
      calendarToggle.setAttribute('aria-expanded', String(!isOpen));
      const label = calendarToggle.querySelector(':not(.toggle-arrow)');
      // El label es el primer text node + el span flecha. Cambio solo el text:
      calendarToggle.childNodes[0].nodeValue = isOpen ? 'Ver calendario completo ' : 'Ocultar calendario ';
      if (!isOpen) {
        fullCalendar.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  /* ---------- 9. Upcoming events (Google Calendar API) ----------
     Carga los próximos N eventos del Google Calendar público.
     Necesita:
       - GOOGLE_API_KEY: API key de Google Cloud (Calendar API habilitada)
       - CALENDAR_ID: ID del calendario público
     Si la API key no está configurada, deja el placeholder visible.
  -------------------------------------------------------------- */
  const upcomingList = document.getElementById('upcoming-list');
  if (upcomingList) {
    const GOOGLE_API_KEY = 'YOUR_GOOGLE_API_KEY_HERE';
    const CALENDAR_ID = 'abits.com_pm2aj26u62lbr2fck2i9343khk@group.calendar.google.com';
    const MAX_EVENTS = 3;

    // Si aún no se configuró la key, no llamar al API
    if (GOOGLE_API_KEY === 'YOUR_GOOGLE_API_KEY_HERE') return;

    const months = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];

    const formatTime = (date) => {
      const h = date.getHours();
      const m = String(date.getMinutes()).padStart(2, '0');
      const ampm = h >= 12 ? 'pm' : 'am';
      const hour12 = h % 12 || 12;
      return `${hour12}:${m} ${ampm}`;
    };

    const renderEvent = (event) => {
      const start = event.start.dateTime ? new Date(event.start.dateTime) : new Date(event.start.date);
      const day = start.getDate();
      const month = months[start.getMonth()];
      const time = event.start.dateTime ? formatTime(start) : 'Todo el día';
      const title = event.summary || '(sin título)';
      const desc = event.description
        ? event.description.replace(/<[^>]*>/g, '').slice(0, 120) + (event.description.length > 120 ? '...' : '')
        : 'Únete a este webinar en vivo.';
      const link = event.htmlLink || '#';

      return `
        <a href="${link}" target="_blank" rel="noopener" class="next-card">
          <div class="next-card__date">
            <span class="next-card__day">${day}</span>
            <span class="next-card__month">${month}</span>
          </div>
          <div class="next-card__body">
            <p class="next-card__time">${time}</p>
            <h3 class="next-card__title">${title}</h3>
            <p class="next-card__desc">${desc}</p>
          </div>
          <span class="next-card__cta">Apuntarme →</span>
        </a>
      `;
    };

    const renderEmpty = () => `
      <div class="next-card next-card--skeleton" style="grid-column: 1 / -1; text-align: center; padding: 32px;">
        <p style="color: var(--ink-500); font-size: 14px; margin: 0;">
          No hay capacitaciones agendadas próximamente. Revisa el calendario o vuelve pronto.
        </p>
      </div>
    `;

    const fetchEvents = async () => {
      const timeMin = new Date().toISOString();
      const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events`
        + `?key=${GOOGLE_API_KEY}`
        + `&timeMin=${encodeURIComponent(timeMin)}`
        + `&maxResults=${MAX_EVENTS}`
        + `&singleEvents=true`
        + `&orderBy=startTime`;

      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const events = data.items || [];

        if (events.length === 0) {
          upcomingList.innerHTML = renderEmpty();
        } else {
          upcomingList.innerHTML = events.map(renderEvent).join('');
        }
      } catch (err) {
        console.warn('No se pudieron cargar las próximas capacitaciones:', err);
        upcomingList.innerHTML = renderEmpty();
      }
    };

    fetchEvents();
  }

  /* ---------- 10. Partners (filtro por país + modal) ---------- */
  const partnersGrid = document.getElementById('partners-grid');
  const partnerModal = document.getElementById('partner-modal');

  if (partnersGrid && partnerModal) {
    // Orden aleatorio en cada carga para que ningún partner quede siempre primero
    const shuffleGrid = () => {
      const items = Array.from(partnersGrid.children);
      // Fisher-Yates shuffle
      for (let i = items.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [items[i], items[j]] = [items[j], items[i]];
      }
      // Re-append en el nuevo orden (appendChild mueve nodos existentes)
      items.forEach((item) => partnersGrid.appendChild(item));
    };
    shuffleGrid();

    const cards = partnersGrid.querySelectorAll('.partner-card');
    const filterTabs = document.querySelectorAll('.filter-tab');
    const emptyMsg = document.getElementById('partners-empty');

    // --- Filtro ---
    const applyFilter = (filter) => {
      let visible = 0;
      cards.forEach((card) => {
        const matches = filter === 'all' || card.dataset.country === filter;
        card.classList.toggle('is-hidden', !matches);
        if (matches) visible++;
      });
      if (emptyMsg) emptyMsg.hidden = visible > 0;
    };

    filterTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        filterTabs.forEach((t) => {
          const active = t === tab;
          t.classList.toggle('is-active', active);
          t.setAttribute('aria-selected', String(active));
        });
        applyFilter(tab.dataset.filter);
      });
    });

    // --- Modal ---
    const modalLogo     = document.getElementById('partner-modal-logo');
    const modalName     = document.getElementById('partner-modal-name');
    const modalCountry  = document.getElementById('partner-modal-country');
    const modalCity     = document.getElementById('partner-modal-city');
    const modalCitySep  = partnerModal.querySelector('.partner-modal__city-sep');
    const modalContacts = document.getElementById('partner-modal-contacts');

    const COUNTRY_LABEL = {
      mexico: 'México', dominicana: 'República Dominicana', ecuador: 'Ecuador',
      panama: 'Panamá', 'costa-rica': 'Costa Rica', guatemala: 'Guatemala',
      bolivia: 'Bolivia', otros: 'Otros',
    };

    let lastFocused = null;

    const buildContact = (variant, iconId, label, value, href) => {
      const tagOpen  = href ? `<a class="partner-contact partner-contact--${variant}" href="${href}" target="_blank" rel="noopener">` : `<div class="partner-contact partner-contact--${variant}">`;
      const tagClose = href ? '</a>' : '</div>';
      return `${tagOpen}
        <span class="partner-contact__icon">
          <svg aria-hidden="true"><use href="assets/icons.svg#${iconId}"/></svg>
        </span>
        <div class="partner-contact__body">
          <span class="partner-contact__label">${label}</span>
          <span class="partner-contact__value">${value}</span>
        </div>
        ${href ? '<span class="partner-contact__arrow" aria-hidden="true">→</span>' : ''}
      ${tagClose}`;
    };

    const modalContact = document.getElementById('partner-modal-contact');

    const openModal = (card) => {
      lastFocused = document.activeElement;
      const data = card.dataset;
      const img = card.querySelector('img');

      modalLogo.src = img ? img.src : '';
      modalLogo.alt = img ? img.alt : '';
      modalName.textContent = data.name || '—';
      modalCountry.textContent = COUNTRY_LABEL[data.country] || data.country || '';
      if (data.city) {
        modalCity.textContent = data.city;
        modalCitySep.hidden = false;
      } else {
        modalCity.textContent = '';
        modalCitySep.hidden = true;
      }
      // Contacto principal (persona) — opcional
      if (modalContact) {
        if (data.contact) {
          modalContact.textContent = data.contact;
          modalContact.hidden = false;
        } else {
          modalContact.hidden = true;
        }
      }

      const parts = [];
      // Phones: pueden ser uno o varios separados por |
      if (data.phones) {
        const list = data.phones.split('|').map((p) => p.trim()).filter(Boolean);
        list.forEach((display) => {
          const tel = display.replace(/[^\d+]/g, '');
          parts.push(buildContact('phone', 'message-circle', 'Teléfono', display, `tel:${tel}`));
        });
      }
      if (data.whatsapp) {
        parts.push(buildContact('wa', 'whatsapp', 'WhatsApp', '+' + data.whatsapp, `https://wa.me/${data.whatsapp}`));
      }
      // Emails: pueden ser uno o varios separados por |
      if (data.emails) {
        const list = data.emails.split('|').map((e) => e.trim()).filter(Boolean);
        list.forEach((em) => {
          parts.push(buildContact('email', 'mail', 'Email', em, `mailto:${em}`));
        });
      }
      if (data.website) {
        const displayUrl = data.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
        parts.push(buildContact('web', 'document', 'Sitio web', displayUrl, data.website));
      }
      modalContacts.innerHTML = parts.join('');

      partnerModal.hidden = false;
      // Force reflow for transition
      // eslint-disable-next-line no-unused-expressions
      partnerModal.offsetHeight;
      partnerModal.classList.add('is-open');
      document.body.classList.add('partner-modal-open');

      const closeBtn = partnerModal.querySelector('.partner-modal__close');
      if (closeBtn) closeBtn.focus();
    };

    const closeModal = () => {
      partnerModal.classList.remove('is-open');
      document.body.classList.remove('partner-modal-open');
      setTimeout(() => {
        partnerModal.hidden = true;
        if (lastFocused && typeof lastFocused.focus === 'function') {
          lastFocused.focus();
        }
      }, 250);
    };

    cards.forEach((card) => {
      card.addEventListener('click', () => openModal(card));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openModal(card);
        }
      });
    });

    partnerModal.querySelectorAll('[data-modal-close]').forEach((btn) => {
      btn.addEventListener('click', closeModal);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !partnerModal.hidden) {
        closeModal();
      }
    });
  }
})();
