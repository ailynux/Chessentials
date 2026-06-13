(function () {
  var toggle = document.getElementById('menu-toggle');
  var drawer = document.getElementById('nav-drawer');
  var backdrop = document.getElementById('nav-backdrop');
  var closeBtn = document.getElementById('nav-close');

  function setMenuOpen(open) {
    if (!toggle || !drawer) return;
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    drawer.classList.toggle('is-open', open);
    drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
    toggle.classList.toggle('is-open', open);
    document.body.classList.toggle('nav-open', open);
  }

  if (toggle && drawer) {
    toggle.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      setMenuOpen(!drawer.classList.contains('is-open'));
    });

    if (backdrop) {
      backdrop.addEventListener('click', function () {
        setMenuOpen(false);
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        setMenuOpen(false);
      });
    }

    drawer.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        setMenuOpen(false);
      });
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
