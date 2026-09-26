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

    // Content hidden by a reveal that never fires is content nobody sees. Reveal
    // anything still waiting that has reached the viewport.
    addEventListener('load', () => {
      setTimeout(() => {
        items.forEach((el) => {
          if (el.classList.contains('in')) return;
          const r = el.getBoundingClientRect();
          if (r.top < innerHeight && r.bottom > 0) el.classList.add('in');
        });
      }, 1200);
    });
  }

  /* ── Prism demo film ────────────────────────────────────────────────────── */

  const film = document.getElementById('film');

  if (film) {
    const scenes = [...film.querySelectorAll('.scene')];
    const dots = [...film.querySelectorAll('.film-dot')];
    const caption = document.getElementById('film-caption');
    const bar = document.getElementById('film-bar');
    const sweep = film.querySelector('.film-sweep');
    const appName = document.getElementById('film-app');

    // Per scene: caption, how long it holds, and what the window is called.
    const BEATS = [
      { cap: 'The problem', hold: 2600, app: 'Ledger.xlsx' },
      { cap: 'Questions a spreadsheet cannot answer', hold: 4200, app: 'Ledger.xlsx' },
      { cap: 'Clarity', hold: 2600, app: 'Prism' },
      { cap: 'The same file, made legible', hold: 4200, app: 'Prism' },
      { cap: 'Open any figure to the lines behind it', hold: 4200, app: 'Prism' },
      { cap: 'Reach', hold: 2600, app: 'Campaigns' },
      { cap: 'Marketing with something true to say', hold: 4200, app: 'Campaigns' },
      { cap: 'Proof', hold: 2600, app: 'Results' },
      { cap: 'What came back, measured', hold: 4600, app: 'Results' },
    ];

    let current = 0;
    let timer = null;
    let startedAt = null;
    let raf = null;
    let playing = false;

    const countUp = (scene) => {
      scene.querySelectorAll('[data-count]').forEach((el) => {
        const target = Number(el.dataset.count);
        const prefix = el.dataset.prefix || '';
        const suffix = el.dataset.suffix || '';
        const from = performance.now();
        const DURATION = 1100;

        const tick = (now) => {
          const t = Math.min((now - from) / DURATION, 1);
          const value = Math.round(target * (1 - Math.pow(1 - t, 3)));
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
        const t = Math.min((now - startedAt) / BEATS[current].hold, 1);
        bar.style.width = `${t * 100}%`;
        if (t < 1 && playing) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };

    const markAct = () => {
      const act = Number(scenes[current].dataset.act);
      dots.forEach((d, i) => d.classList.toggle('is-active', i === act));
    };

    const show = (next) => {
      scenes[current]?.classList.remove('is-active');
      current = next;
      scenes[current].classList.add('is-active');
      markAct();

      // Restart the sweep by taking the class off and forcing a reflow.
      sweep.classList.remove('run');
      void sweep.offsetWidth;
      sweep.classList.add('run');

      appName.textContent = BEATS[current].app;

      caption.classList.add('swap');
      setTimeout(() => {
        caption.textContent = BEATS[current].cap;
        caption.classList.remove('swap');
      }, 260);

      if (scenes[current].querySelector('[data-count]')) countUp(scenes[current]);

      startedAt = performance.now();
      trackProgress();

      clearTimeout(timer);
      if (playing) {
        timer = setTimeout(() => show((current + 1) % scenes.length), BEATS[current].hold);
      }
    };

    dots.forEach((dot) =>
      dot.addEventListener('click', () => {
        playing = false; // a deliberate click stops the reel; the visitor is steering
        clearTimeout(timer);
        cancelAnimationFrame(raf);
        show(Number(dot.dataset.go));
        bar.style.width = '100%';
      }),
    );

    const startFilm = () => {
      if (playing) return;
      playing = true;
      startedAt = performance.now();
      trackProgress();
      timer = setTimeout(() => show(1), BEATS[0].hold);
    };

    // Roughly in view. A cheap second opinion so the reel is never left unstarted.
    const filmInView = () => {
      const r = film.getBoundingClientRect();
      return r.top < innerHeight * 0.9 && r.bottom > innerHeight * 0.1;
    };

    if (motionOk) {
      if ('IntersectionObserver' in window) {
        const filmIO = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
              startFilm();
              filmIO.disconnect();
            });
          },
          { threshold: 0.35 },
        );
        filmIO.observe(film);
      }

      if (filmInView()) {
        startFilm();
      } else {
        const onScroll = () => {
          if (!filmInView()) return;
          startFilm();
          removeEventListener('scroll', onScroll);
        };
        addEventListener('scroll', onScroll, { passive: true });
      }
    } else {
      // No motion: hold the frame that says the most on its own.
      scenes[0].classList.remove('is-active');
      scenes[3].classList.add('is-active');
      current = 3;
      markAct();
      appName.textContent = BEATS[3].app;
      caption.textContent = BEATS[3].cap;
      scenes[3].querySelectorAll('[data-count]').forEach((el) => {
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

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!validate()) {
      form.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }

    const f = form.elements;
    const payload = {
      name: f.name.value.trim(),
      email: f.email.value.trim(),
      business: f.company.value.trim() || '—',
      topic: f.topic.value,
      message: f.message.value.trim(),
      _subject: `New enquiry — ${f.topic.value}`,
      _template: 'table',
      _captcha: 'false',
    };

    // A bot that fills every field it finds gives itself away here.
    if (f.website && f.website.value) return;

    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    button.textContent = 'Sending…';
    note.classList.remove('ok', 'bad');
    note.textContent = '';

    try {
      const res = await fetch(`https://formsubmit.co/ajax/${EMAIL}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Server replied ${res.status}`);

      form.reset();
      note.textContent = 'Thank you — your message is on its way. We usually reply within a day.';
      note.classList.add('ok');
      button.textContent = 'Message sent';
    } catch (err) {
      // Never swallow this: a silent failure loses an enquiry without anyone knowing.
      const body = [
        `Name: ${payload.name}`,
        `Email: ${payload.email}`,
        `Business: ${payload.business}`,
        `Topic: ${payload.topic}`,
        '',
        payload.message,
      ].join('\n');

      note.innerHTML =
        `That didn’t send. Please email <a href="mailto:${EMAIL}?subject=${encodeURIComponent(payload._subject)}&body=${encodeURIComponent(body)}">${EMAIL}</a> ` +
        `or call <a href="tel:+16788158688">(678) 815-8688</a>.`;
      note.classList.add('bad');
      button.disabled = false;
      button.textContent = 'Try again';
    }
  });

  // Clear an error as soon as the visitor starts fixing it.
  form.addEventListener('input', (e) => {
    const el = e.target;
    if (el.getAttribute('aria-invalid') === 'true') setError(el, '');
  });
})();
