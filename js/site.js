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

// Intro overlay — show on first page of a session, skip thereafter
(function () {
  var intro = document.getElementById('bf-intro');
  if (!intro) return;
  // Skip if user has seen it already in this session
  try {
    if (sessionStorage.getItem('bf-intro-seen')) {
      intro.parentNode && intro.parentNode.removeChild(intro);
      return;
    }
    sessionStorage.setItem('bf-intro-seen', '1');
  } catch (_) { /* private mode etc — just play it */ }
  // Remove from DOM after the flash animation finishes so it doesn't capture pointer/scroll
  setTimeout(function () {
    intro.classList.add('is-done');
    setTimeout(function () {
      intro.parentNode && intro.parentNode.removeChild(intro);
    }, 100);
  }, 2200);
})();
