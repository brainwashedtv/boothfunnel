// BoothFunnel — shared site JS
// FAQ accordion + intro overlay handling.
(function () {
  document.addEventListener('click', function (e) {
    var q = e.target.closest('.bf-faq-q');
    if (!q) return;
    var item = q.parentElement;
    item.classList.toggle('bf-open');
  });
})();

// Scroll-triggered fade-in for major sections
(function () {
  if (!('IntersectionObserver' in window)) return;
  // Tag every major section so they fade in as the user scrolls past them
  var targets = document.querySelectorAll('.bf-section, .bf-section-tight, .bf-cta-banner');
  targets.forEach(function (el) { el.classList.add('bf-fade'); });
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
  targets.forEach(function (el) { io.observe(el); });
})();

// Contact page: pre-select the topic dropdown from ?topic=... query string.
// Bulk-from-checkout and other deep-links land with the right topic chosen.
(function () {
  var topicSelect = document.getElementById('contact-topic');
  if (!topicSelect) return;
  try {
    var t = new URLSearchParams(window.location.search).get('topic');
    if (!t) return;
    var opt = topicSelect.querySelector('option[value="' + t.replace(/"/g, '') + '"]');
    if (opt) topicSelect.value = t;
  } catch (_) { /* old browser, no-op */ }
})();

// Intro overlay — show on first page of a session, skip thereafter.
// Bulletproof: multiple removal triggers so the overlay can never get stuck.
(function () {
  var intro = document.getElementById('bf-intro');
  if (!intro) return;

  function kill() {
    if (!intro || !intro.parentNode) return;
    intro.classList.add('is-done');
    intro.style.display = 'none';
    intro.style.visibility = 'hidden';
    try { intro.parentNode.removeChild(intro); } catch (_) {}
  }

  // Skip if user has seen it already in this session
  try {
    if (sessionStorage.getItem('bf-intro-seen')) { kill(); return; }
    sessionStorage.setItem('bf-intro-seen', '1');
  } catch (_) { /* private mode — just play it */ }

  // Primary trigger: remove after the animation duration
  setTimeout(kill, 2200);

  // Belt-and-suspenders: also listen for animationend
  intro.addEventListener('animationend', function (e) {
    if (e.animationName === 'bf-flash') kill();
  });

  // Hard fallback: if anything goes wrong (animation paused, JS err, etc),
  // ensure the overlay is gone within 4 seconds no matter what.
  setTimeout(kill, 4000);
})();
