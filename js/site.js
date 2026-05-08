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
  // Remove from DOM after the animation finishes so it doesn't capture pointer/scroll
  setTimeout(function () {
    intro.classList.add('is-done');
    setTimeout(function () {
      intro.parentNode && intro.parentNode.removeChild(intro);
    }, 100);
  }, 2100);
})();
