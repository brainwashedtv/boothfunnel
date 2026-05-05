// BoothFunnel — 6-step checkout controller
// Vanilla JS, no framework. State is held on `formData` and persisted to
// sessionStorage so accidental refresh doesn't wipe everything out.
(function () {
  'use strict';

  var form = document.getElementById('bf-checkout');
  if (!form) return;

  var stepper = document.getElementById('bf-stepper');
  var panes = form.querySelectorAll('.bf-step-pane');
  var status = document.getElementById('bf-checkout-status');
  var review = document.getElementById('bf-review');
  var STORAGE_KEY = 'bf_checkout_v1';
  var current = 1;
  var totalSteps = panes.length;

  // ---- State persistence ----
  function readSaved() {
    try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}'); }
    catch (e) { return {}; }
  }
  function persist() {
    var data = collect();
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) {}
  }
  function hydrate() {
    var saved = readSaved();
    Object.keys(saved).forEach(function (name) {
      var inputs = form.querySelectorAll('[name="' + name + '"]');
      if (!inputs.length) return;
      if (inputs[0].type === 'radio') {
        inputs.forEach(function (i) { i.checked = (i.value === saved[name]); });
        // Also restore the .bf-selected highlight on plan options.
        if (name === 'plan') updatePlanHighlight();
      } else {
        inputs[0].value = saved[name];
      }
    });
  }

  function collect() {
    var data = {};
    new FormData(form).forEach(function (v, k) { data[k] = v; });
    return data;
  }

  // ---- Stepper UI ----
  function show(step) {
    current = Math.max(1, Math.min(totalSteps, step));
    panes.forEach(function (p) {
      p.classList.toggle('bf-active', Number(p.dataset.pane) === current);
    });
    stepper.querySelectorAll('.bf-stepper-item').forEach(function (s) {
      var n = Number(s.dataset.step);
      s.classList.toggle('bf-active', n === current);
      s.classList.toggle('bf-done', n < current);
    });
    if (current === 5) renderReview();
    window.scrollTo({ top: form.getBoundingClientRect().top + window.scrollY - 24, behavior: 'smooth' });
  }

  // ---- Validation ----
  function validateStep(step) {
    var pane = form.querySelector('[data-pane="' + step + '"]');
    var required = pane.querySelectorAll('[required]');
    for (var i = 0; i < required.length; i++) {
      if (!required[i].value.trim()) {
        required[i].focus();
        required[i].style.borderColor = 'var(--bf-danger)';
        setTimeout(function (el) { el.style.borderColor = ''; }.bind(null, required[i]), 1800);
        return false;
      }
    }
    return true;
  }

  // ---- Plan picker visual highlight ----
  function updatePlanHighlight() {
    form.querySelectorAll('.bf-plan-option').forEach(function (label) {
      var input = label.querySelector('input[type="radio"]');
      label.classList.toggle('bf-selected', input && input.checked);
    });
  }

  // ---- Multi-location short-circuit ----
  function maybeRedirectMulti() {
    var plan = (collect().plan || '').toLowerCase();
    if (plan === 'multi') {
      // Save what they've entered so the contact form can pre-fill if we ever want to.
      persist();
      window.location.href = '/contact?topic=multi';
      return true;
    }
    return false;
  }

  // ---- Review pane render ----
  function renderReview() {
    var d = collect();
    var planLabels = { starter: 'Starter — $299/mo', growth: 'Growth — $499/mo', multi: 'Multi-location — custom' };
    review.innerHTML =
      '<strong>Venue</strong><br>' + esc(d.venue_name || '—') + ' · ' + esc(d.venue_type || '') + '<br>' +
      esc(d.contact_name || '') + ' · ' + esc(d.contact_email || '') +
      (d.contact_phone ? ' · ' + esc(d.contact_phone) : '') +
      '<br><br><strong>Plan</strong><br>' + esc(planLabels[d.plan] || d.plan || '—') +
      '<br><br><strong>Branding</strong><br>' +
      esc(d.brand_display || '—') +
      (d.brand_color ? ' · color ' + esc(d.brand_color) : '') +
      (d.brand_hashtag ? ' · ' + esc(d.brand_hashtag) : '') +
      (d.brand_instagram ? ' · ' + esc(d.brand_instagram) : '') +
      '<br><br><strong>Ship to</strong><br>' +
      esc(d.ship_address1 || '') + (d.ship_address2 ? ', ' + esc(d.ship_address2) : '') + '<br>' +
      esc(d.ship_city || '') + ', ' + esc(d.ship_state || '') + ' ' + esc(d.ship_zip || '') +
      '<br>Connectivity: ' + (d.ship_network === 'cellular' ? 'built-in cellular' : 'venue Wi-Fi');
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c];
    });
  }

  // ---- Stripe handoff ----
  function payWithStripe() {
    if (!validateStep(5)) return;
    var data = collect();
    if (!data.plan) { status.textContent = 'Pick a plan first.'; return; }
    if (data.plan === 'multi') return maybeRedirectMulti();

    status.style.color = 'var(--bf-muted)';
    status.textContent = 'Connecting to Stripe...';
    fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
      .then(function (r) {
        if (!r.ok) throw new Error('checkout-session failed');
        return r.json();
      })
      .then(function (j) {
        if (!j.url) throw new Error('no redirect url');
        persist();
        window.location.href = j.url;
      })
      .catch(function () {
        status.style.color = 'var(--bf-danger)';
        status.textContent = 'Something went wrong. Try again, or email hello@boothfunnel.com.';
      });
  }

  // ---- Wire it up ----
  form.addEventListener('click', function (e) {
    if (e.target.matches('[data-next]')) {
      if (!validateStep(current)) return;
      persist();
      if (current === 2 && maybeRedirectMulti()) return;
      show(current + 1);
    } else if (e.target.matches('[data-prev]')) {
      show(current - 1);
    }
  });
  form.addEventListener('change', function (e) {
    if (e.target.name === 'plan') updatePlanHighlight();
    persist();
  });
  form.addEventListener('input', persist);

  document.getElementById('bf-pay').addEventListener('click', payWithStripe);

  hydrate();
  updatePlanHighlight();
})();
