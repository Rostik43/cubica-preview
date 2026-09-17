// Кубика, вариант 3: общие части страниц (пиктограммы, меню, заставка, фильтры, поиск).
(function () {
  // Меню
  var menu = document.getElementById('menu');
  var opener = document.querySelector('[data-menu-open]');
  function setMenu(open) {
    menu.classList.toggle('open', open);
    opener.setAttribute('aria-expanded', open);
    if (open) menu.querySelector('a, button').focus(); else opener.focus();
  }
  if (menu && opener) {
    opener.addEventListener('click', function () { setMenu(true); });
    menu.querySelector('[data-menu-close]').addEventListener('click', function () { setMenu(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu.classList.contains('open')) setMenu(false); });
    menu.querySelectorAll('a[href^="#"]').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  }

  // Фильтры и поиск (только на главной)
  var items = [].slice.call(document.querySelectorAll('[data-tags]'));
  if (!items.length) return;
  var btns = [].slice.call(document.querySelectorAll('.filters button'));
  var input = document.querySelector('.search input');
  var empty = document.querySelector('.empty');
  var state = { key: 'all', q: '' };

  function apply() {
    var shown = 0;
    items.forEach(function (it) {
      var tags = it.dataset.tags.split(' ');
      var okF = state.key === 'all' || tags.indexOf(state.key) > -1;
      var okQ = !state.q || it.textContent.toLowerCase().indexOf(state.q) > -1;
      it.hidden = !(okF && okQ);
      if (!it.hidden) shown++;
    });
    empty.hidden = shown > 0;
    window.dispatchEvent(new Event('hgal:measure'));
  }
  btns.forEach(function (b) {
    b.addEventListener('click', function () {
      state.key = b.dataset.key;
      btns.forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
      apply();
      window.scrollTo({ top: 0 });
    });
  });
  input.addEventListener('input', function () { state.q = input.value.trim().toLowerCase(); apply(); });

  // Сменяющиеся подсказки в поиске, как у референса
  var hints = ['Ижевск', 'Казань', 'Красная', 'Двор', 'Генплан'];
  var h = 0;
  setInterval(function () {
    if (document.activeElement === input || input.value) return;
    h = (h + 1) % hints.length;
    input.placeholder = hints[h];
  }, 2200);
})();
