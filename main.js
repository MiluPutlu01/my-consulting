/* M-Y Consulting — no dependencies, no third-party requests. */

(() => {
  'use strict';

  document.getElementById('year').textContent = String(new Date().getFullYear());

  /* ── Sticky nav ─────────────────────────────────────────────────────────── */

  const nav = document.getElementById('nav');
  const onScroll = () => nav.classList.toggle('stuck', window.scrollY > 24);
  onScroll();
  addEventListener('scroll', onScroll, { passive: true });

  /* ── Mobile menu ────────────────────────────────────────────────────────── */

  const toggle = document.querySelector('.nav-toggle');
  const menu = document.getElementById('mobile-menu');

  const setMenu = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    menu.hidden = !open;
  };

  toggle.addEventListener('click', () => setMenu(menu.hidden));
  menu.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') setMenu(false);
  });
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setMenu(false);
  });

  /* ── Reveal on scroll ───────────────────────────────────────────────────── */

  const items = document.querySelectorAll('.reveal');
  const motionOk = !matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!motionOk || !('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('in'));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (!entry.isIntersecting) return;
          // Stagger only within a batch, so a long list doesn't crawl in.
          setTimeout(() => entry.target.classList.add('in'), Math.min(i, 5) * 70);
          io.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
    );
    items.forEach((el) => io.observe(el));
  }

  /* ── Prism demo film ────────────────────────────────────────────────────── */

  const film = document.getElementById('film');

  if (film) {
    const scenes = [...film.querySelectorAll('.scene')];
    const dots = [...film.querySelectorAll('.film-dot')];
    const caption = document.getElementById('film-caption');
    const bar = document.getElementById('film-bar');

    const CAPTIONS = [
      'The spreadsheet you already have',
      'A live view of the business',
      'Where it is heading',
      'Open any number to the lines behind it',
      'And what to do about it',
    ];
    const HOLD = [3600, 4200, 4200, 4200, 4600];

    let current = 0;
    let timer = null;
    let started = null;
    let raf = null;

    const countUp = (scene) => {
      scene.querySelectorAll('[data-count]').forEach((el) => {
        const target = Number(el.dataset.count);
        const prefix = el.dataset.prefix || '';
        const suffix = el.dataset.suffix || '';
        const started = performance.now();
        const DURATION = 1100;

        const tick = (now) => {
          const t = Math.min((now - started) / DURATION, 1);
          const eased = 1 - Math.pow(1 - t, 3);
          const value = Math.round(target * eased);
          el.textContent =
            prefix + (target >= 1000 ? value.toLocaleString() : String(value)) + suffix;
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    };

    const trackProgress = () => {
      cancelAnimationFrame(raf);
      const step = (now) => {
        const t = Math.min((now - started) / HOLD[current], 1);
        bar.style.width = `${t * 100}%`;
        if (t < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };

    const show = (next, auto = false) => {
      scenes[current]?.classList.remove('is-active');
      dots[current]?.classList.remove('is-active');

      current = next;

      scenes[current].classList.add('is-active');
      dots[current].classList.add('is-active');

      caption.classList.add('swap');
      setTimeout(() => {
        caption.textContent = CAPTIONS[current];
        caption.classList.remove('swap');
      }, 260);

      if (current === 1) countUp(scenes[1]);

      started = performance.now();
      trackProgress();

      clearTimeout(timer);
      if (auto || timer !== null) {
        timer = setTimeout(() => show((current + 1) % scenes.length, true), HOLD[current]);
      }
    };

    dots.forEach((dot) =>
      dot.addEventListener('click', () => {
        clearTimeout(timer);
        timer = null; // a deliberate click stops the reel; the visitor is steering now
        show(Number(dot.dataset.go));
        bar.style.width = '100%';
        cancelAnimationFrame(raf);
      }),
    );

    // Only run once the film is actually on screen, and only if motion is welcome.
    if (motionOk && 'IntersectionObserver' in window) {
      const filmIO = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            timer = setTimeout(() => show(1, true), HOLD[0]);
            started = performance.now();
            trackProgress();
            filmIO.disconnect();
          });
        },
        { threshold: 0.35 },
      );
      filmIO.observe(film);
    } else {
      // No motion: show the dashboard frame, which says the most on its own.
      scenes[0].classList.remove('is-active');
      scenes[1].classList.add('is-active');
      dots[0].classList.remove('is-active');
      dots[1].classList.add('is-active');
      caption.textContent = CAPTIONS[1];
      scenes[1].querySelectorAll('[data-count]').forEach((el) => {
        const n = Number(el.dataset.count);
        el.textContent = (el.dataset.prefix || '') + n.toLocaleString() + (el.dataset.suffix || '');
      });
    }
  }

  /* ── Contact form ───────────────────────────────────────────────────────── */

  const form = document.getElementById('contact-form');
  const note = document.getElementById('form-note');
  const EMAIL = 'milanpatel476@gmail.com';

  const errorFor = (id) => form.querySelector(`.err[data-for="${id}"]`);

  const setError = (field, message) => {
    const slot = errorFor(field.id);
    if (slot) slot.textContent = message;
    field.setAttribute('aria-invalid', message ? 'true' : 'false');
    return !message;
  };

  const validate = () => {
    const name = form.elements.name;
    const email = form.elements.email;
    const message = form.elements.message;

    const okName = setError(name, name.value.trim() ? '' : 'Please add your name.');
    const okEmail = setError(
      email,
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()) ? '' : 'Please add a valid email.',
    );
    const okMessage = setError(
      message,
      message.value.trim().length >= 10 ? '' : 'A sentence or two is plenty.',
    );

    return okName && okEmail && okMessage;
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    if (!validate()) {
      form.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }

    const f = form.elements;
    const subject = `New enquiry — ${f.topic.value}`;
    const body = [
      `Name: ${f.name.value.trim()}`,
      `Email: ${f.email.value.trim()}`,
      f.company.value.trim() ? `Business: ${f.company.value.trim()}` : null,
      `Topic: ${f.topic.value}`,
      '',
      f.message.value.trim(),
    ]
      .filter(Boolean)
      .join('\n');

    location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    note.textContent = 'Opening your email app — press send there and it’s on its way.';
    note.classList.add('ok');
  });

  // Clear an error as soon as the visitor starts fixing it.
  form.addEventListener('input', (e) => {
    const el = e.target;
    if (el.getAttribute('aria-invalid') === 'true') setError(el, '');
  });
})();
