(function () {
  var toggle = document.getElementById('menu-toggle');
  var mobile = document.getElementById('nav-mobile');
  if (toggle && mobile) {
    toggle.addEventListener('click', function () {
      mobile.classList.toggle('open');
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
