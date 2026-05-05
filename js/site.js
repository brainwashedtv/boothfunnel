// BoothFunnel — shared site JS
// FAQ accordion + small UI niceties.
(function () {
  document.addEventListener('click', function (e) {
    var q = e.target.closest('.bf-faq-q');
    if (!q) return;
    var item = q.parentElement;
    item.classList.toggle('bf-open');
  });
})();
