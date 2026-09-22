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
