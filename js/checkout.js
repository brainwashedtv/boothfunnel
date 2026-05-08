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

  // Logo upload state — populated when the user drops a file in step 3.
  var logoState = { url: '', filename: '', uploading: false };

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
      if (name === 'logo_url' || name === 'logo_filename') return; // file-state, not a form field
      var inputs = form.querySelectorAll('[name="' + name + '"]');
      if (!inputs.length) return;
      if (inputs[0].type === 'file') return; // can't programmatically restore a File object
      if (inputs[0].type === 'radio') {
        inputs.forEach(function (i) { i.checked = (i.value === saved[name]); });
        if (name === 'plan') updatePlanHighlight();
      } else {
        inputs[0].value = saved[name];
      }
    });
    if (saved.logo_url) {
      logoState.url = saved.logo_url;
      logoState.filename = saved.logo_filename || '';
      var dz = document.getElementById('bf-dropzone');
      var t = document.getElementById('bf-dropzone-title');
      var s = document.getElementById('bf-dropzone-sub');
      if (dz) dz.classList.add('is-uploaded');
      if (t) t.textContent = logoState.filename || 'Logo uploaded';
      if (s) s.textContent = 'Uploaded ✓  Click to replace';
    }
  }

  function collect() {
    var data = {};
    new FormData(form).forEach(function (v, k) {
      // Skip the file input — its bytes live in Vercel Blob; we forward the URL only.
      if (typeof File !== 'undefined' && v instanceof File) return;
      data[k] = v;
    });
    if (logoState.url) {
      data.logo_url = logoState.url;
      data.logo_filename = logoState.filename;
    }
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

  // ---- Group / Bulk / multi-location short-circuit ----
  // "group" (5-49), "bulk" (50+), and the legacy "multi" all bypass self-serve checkout
  // and land on /contact so we can scope the rollout manually.
  function maybeRedirectMulti() {
    var plan = (collect().plan || '').toLowerCase();
    if (plan === 'group' || plan === 'bulk' || plan === 'multi') {
      persist();
      window.location.href = '/contact?topic=' + encodeURIComponent(plan);
      return true;
    }
    return false;
  }

  // ---- Review pane render ----
  function renderReview() {
    var d = collect();
    var planLabels = {
      flexible: 'Flexible — $495/mo billed monthly. 3-month minimum, then cancel any time. 100-contacts-month-1 money-back guarantee.',
      annual:   'Annual — $4,380 today, covers all 12 months ($365/mo effective rate). Renews annually.',
      group:    'Group · 5–49 booths — $325/mo per booth, sales-led rollout.',
      bulk:     'Bulk · 50+ booths — $285/mo per booth, sales-led rollout.',
      // Legacy:
      growth:   'Growth — $499/mo',
      multi:    'Multi-location — custom',
    };
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
      (d.logo_url ? '<br>Logo: <a href="' + esc(d.logo_url) + '" target="_blank" rel="noopener">' + esc(d.logo_filename || 'view') + '</a>' : '') +
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
    if (logoState.uploading) {
      status.style.color = 'var(--bf-danger)';
      status.textContent = 'Your logo is still uploading. One sec.';
      return;
    }
    var data = collect();
    if (!data.plan) { status.textContent = 'Pick a plan first.'; return; }
    if (data.plan === 'group' || data.plan === 'bulk' || data.plan === 'multi') return maybeRedirectMulti();

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

  // ---- Logo upload (step 3) ----
  var dropzone = document.getElementById('bf-dropzone');
  var fileInput = document.getElementById('brand-logo');
  var dzTitle = document.getElementById('bf-dropzone-title');
  var dzSub = document.getElementById('bf-dropzone-sub');
  var dzStatus = document.getElementById('bf-dropzone-status');
  var dzProgress = document.getElementById('bf-dropzone-progress');

  function setDzStatus(msg, isError) {
    if (!dzStatus) return;
    dzStatus.textContent = msg || '';
    dzStatus.style.color = isError ? 'var(--bf-danger)' : 'var(--bf-muted)';
  }

  function uploadLogo(file) {
    if (!file) return;
    if (file.size > 6 * 1024 * 1024) {
      setDzStatus('That file is over 6 MB. Try compressing or send as SVG.', true);
      return;
    }
    logoState.uploading = true;
    if (dropzone) dropzone.classList.add('is-uploading');
    if (dzProgress) dzProgress.hidden = false;
    setDzStatus('Uploading ' + file.name + '…');

    var qs = '?filename=' + encodeURIComponent(file.name);
    fetch('/api/upload-logo' + qs, {
      method: 'POST',
      headers: { 'Content-Type': file.type || 'application/octet-stream' },
      body: file,
    })
      .then(function (r) {
        if (!r.ok) throw new Error('upload failed (' + r.status + ')');
        return r.json();
      })
      .then(function (j) {
        if (!j.url) throw new Error('no url');
        logoState.url = j.url;
        logoState.filename = file.name;
        logoState.uploading = false;
        if (dropzone) {
          dropzone.classList.remove('is-uploading');
          dropzone.classList.add('is-uploaded');
        }
        if (dzProgress) dzProgress.hidden = true;
        if (dzTitle) dzTitle.textContent = file.name;
        if (dzSub) dzSub.textContent = 'Uploaded ✓  Click to replace';
        setDzStatus('Logo saved.');
        persist();
      })
      .catch(function (err) {
        logoState.uploading = false;
        if (dropzone) dropzone.classList.remove('is-uploading');
        if (dzProgress) dzProgress.hidden = true;
        setDzStatus('Upload failed. Email it to hello@boothfunnel.com or try again.', true);
        console && console.error && console.error(err);
      });
  }

  if (fileInput) {
    fileInput.addEventListener('change', function (e) {
      if (e.target.files && e.target.files[0]) uploadLogo(e.target.files[0]);
    });
  }
  if (dropzone) {
    ['dragenter', 'dragover'].forEach(function (ev) {
      dropzone.addEventListener(ev, function (e) {
        e.preventDefault(); e.stopPropagation();
        dropzone.classList.add('is-dragging');
      });
    });
    ['dragleave', 'drop'].forEach(function (ev) {
      dropzone.addEventListener(ev, function (e) {
        e.preventDefault(); e.stopPropagation();
        dropzone.classList.remove('is-dragging');
      });
    });
    dropzone.addEventListener('drop', function (e) {
      var dt = e.dataTransfer;
      if (dt && dt.files && dt.files[0]) {
        if (fileInput) {
          try { fileInput.files = dt.files; } catch (_) {}
        }
        uploadLogo(dt.files[0]);
      }
    });
  }

  // ---- Wire it up ----
  form.addEventListener('click', function (e) {
    if (e.target.matches('[data-next]')) {
      if (!validateStep(current)) return;
      if (current === 3 && logoState.uploading) {
        setDzStatus('Hang on — your logo is still uploading.', true);
        return;
      }
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
