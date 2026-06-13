(function () {
  var toggle = document.getElementById('menu-toggle');
  var mobile = document.getElementById('nav-mobile');

  function setMenuOpen(open) {
    if (!toggle || !mobile) return;
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    mobile.hidden = !open;
    mobile.classList.toggle('open', open);
    toggle.classList.toggle('open', open);
    document.body.classList.toggle('nav-open', open);
  }

  if (toggle && mobile) {
    toggle.addEventListener('click', function () {
      setMenuOpen(!mobile.classList.contains('open'));
    });

    mobile.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        setMenuOpen(false);
      });
    });

    document.addEventListener('click', function (e) {
      if (!mobile.classList.contains('open')) return;
      if (toggle.contains(e.target) || mobile.contains(e.target)) return;
      setMenuOpen(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setMenuOpen(false);
    });
  }

  document.querySelectorAll('.accordion-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var expanded = btn.getAttribute('aria-expanded') === 'true';
      var body = btn.parentElement.querySelector('.accordion-body');
      btn.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      if (body) body.classList.toggle('open', !expanded);
    });
  });

  var year = document.getElementById('current-year');
  if (year) year.textContent = new Date().getFullYear();
})();
