// Кубика, вариант 3: общие части страниц (пиктограммы, меню, заставка, фильтры, поиск).
(function () {
  // Пиктограммы проектов: простая геометрия 40×40, белая линия на gunmetal
  var P = {
    krasnaya: '<path d="M9 31V11h22v20M16 31v-7a4 4 0 0 1 8 0v7"/>',
    loft: '<rect x="9" y="9" width="22" height="22"/><rect x="15" y="15" width="10" height="10"/>',
    sun: '<circle cx="20" cy="15" r="5"/><path d="M9 25h22M9 31h22"/>',
    scand: '<path d="M9 31V18l5.5-7 5.5 7 5.5-7 5.5 7v13z"/>',
    nevsky: '<path d="M9 31v-9h7v-6h7v-7h8v22z"/>',
    sunvill: '<circle cx="27" cy="13" r="4"/><path d="M9 31V19h9v12M18 31V23h8v8"/>',
    kquarter: '<path d="M9 31V10h8v21M21 31V15h10v16"/>',
    ktowers: '<path d="M10 31V8h6v23M20 31V17h11v14"/>',
    kevening: '<path d="M9 31V19h11v12M22 31V9h9v22"/><rect class="f" x="25" y="13" width="3" height="3"/>',
    kcourt: '<path d="M9 14h22M9 20h22M13 14v17M27 14v17"/>',
    kplan: '<rect x="9" y="9" width="22" height="22"/><path d="M20 9v22M9 20h22"/><rect class="f" x="12" y="12" width="5" height="5"/>'
  };
  document.querySelectorAll('[data-pict]').forEach(function (el) {
    el.classList.add('pict');
    el.innerHTML = '<svg viewBox="0 0 40 40" aria-hidden="true">' + (P[el.dataset.pict] || '') + '</svg>';
  });

  // Заставка один раз за сессию
  var intro = document.querySelector('.intro');
  if (intro) {
    var seen = false;
    try { seen = sessionStorage.getItem('cubica-intro') === '1'; sessionStorage.setItem('cubica-intro', '1'); } catch (e) {}
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (seen || reduce) intro.classList.add('gone');
    else setTimeout(function () { intro.classList.add('gone'); }, 900);
  }

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
  var items = [].slice.call(document.querySelectorAll('.item[data-tags]'));
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
