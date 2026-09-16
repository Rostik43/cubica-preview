// Кубика, вариант 3: общие части страниц (пиктограммы, меню, заставка, фильтры, поиск).
(function () {
  // Значки проектов: объёмные схемы из изометрических блоков [x, y, z, ширина, глубина, высота].
  // Порядок в списке = порядок отрисовки (сначала дальние).
  var M = {
    krasnaya: [[0,0,0,1,3,4],[1,0,2.3,1,3,1.7],[2,0,0,1,3,4]],
    loft: [[0,0,0,3,1,3],[0,1,0,1,1,3],[2,1,0,1,1,3],[0,2,0,3,1,3]],
    sun: [[0,0,0,3,2,1],[0,0,1,2,2,1],[0,0,2,1,2,1]],
    scand: [[0,0,0,1,2,4],[1.6,0,0,1,2,3],[3.2,0,0,1,2,4]],
    nevsky: [[0,0,0,1,2,5],[1,0,0,2,2,1.2]],
    sunvill: [[0,0,0,1,1,2],[1.5,0,0,1,1,2],[0,1.5,0,1,1,2],[1.5,1.5,0,1,1,2]],
    kquarter: [[1.5,0,0,2,1,3],[0,0,0,1,3,4],[1.5,2,0,2,1,3]],
    ktowers: [[0,0,0,1,1,6],[2,0,0,1,1,4.5],[0,2,0,3,1,1.5]],
    kevening: [[0,0,0,3,1,3],[0,1,0,1,2,5]],
    kcourt: [[0,0,0,4,4,.25],[.5,.5,.25,.25,.25,1.3],[3.25,.5,.25,.25,.25,1.3],[.5,3.25,.25,.25,.25,1.3],[.4,.4,1.55,3.2,3.2,.2],[3.25,3.25,.25,.25,.25,1.3]],
    kplan: (function () { var r = []; for (var i = 0; i < 3; i++) for (var j = 0; j < 3; j++) r.push([i * 1.4, j * 1.4, 0, 1, 1, (i + j) % 2 ? .5 : .9]); return r; })()
  };
  var CO = Math.cos(Math.PI / 6);
  function P(x, y, z) { return [(x - y) * CO, (x + y) * .5 - z]; }
  function massSvg(list) {
    var polys = [], all = [];
    list.forEach(function (b) {
      var x = b[0], y = b[1], z = b[2], X = x + b[3], Y = y + b[4], Z = z + b[5];
      [['l', [[x, Y, z], [X, Y, z], [X, Y, Z], [x, Y, Z]]],
       ['r', [[X, y, z], [X, Y, z], [X, Y, Z], [X, y, Z]]],
       ['t', [[x, y, Z], [X, y, Z], [X, Y, Z], [x, Y, Z]]]].forEach(function (f) {
        var pts = f[1].map(function (p) { var q = P(p[0], p[1], p[2]); all.push(q); return q; });
        polys.push([f[0], pts]);
      });
    });
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    all.forEach(function (q) { minX = Math.min(minX, q[0]); maxX = Math.max(maxX, q[0]); minY = Math.min(minY, q[1]); maxY = Math.max(maxY, q[1]); });
    var sc = 40 / Math.max(maxX - minX, maxY - minY);
    var ox = (48 - (maxX - minX) * sc) / 2, oy = (48 - (maxY - minY) * sc) / 2;
    return '<svg viewBox="0 0 48 48" aria-hidden="true">' + polys.map(function (f) {
      return '<polygon class="' + f[0] + '" points="' + f[1].map(function (q) {
        return ((q[0] - minX) * sc + ox).toFixed(1) + ',' + ((q[1] - minY) * sc + oy).toFixed(1);
      }).join(' ') + '"/>';
    }).join('') + '</svg>';
  }
  document.querySelectorAll('[data-pict]').forEach(function (el) {
    el.classList.add('mass');
    el.innerHTML = massSvg(M[el.dataset.pict] || []);
  });

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
