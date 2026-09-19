// Живые кубы: маленькие каркасные кубы из гайдбука живут в левом поле страницы.
// Прокрутка медленно вращает и смещает их, курсор рядом разворачивает куб и делает линии заметнее.
// Не заходят на фото и текст: рисуются только в свободной полосе слева. На телефоне и при «уменьшить движение» — статика.
(function () {
  var CFG = {
    count: 9,            // сколько кубов на страницу
    size: [26, 52],      // радиус куба, px
    line: 0.16,          // яркость линии в покое (0..1)
    lineNear: 0.5,       // яркость рядом с курсором
    near: 190,           // радиус влияния курсора, px
    lift: 10,            // на сколько куб приподнимается у курсора, px
    drift: 0.12,         // насколько куб отстаёт от прокрутки (параллакс)
    minGutter: 150       // если поле уже — кубы не показываем
  };

  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse = matchMedia('(pointer: coarse)').matches;
  var main = document.querySelector('main');
  if (!main) return;

  var cv = document.createElement('canvas');
  cv.className = 'live-cubes';
  cv.setAttribute('aria-hidden', 'true');
  document.body.insertBefore(cv, document.body.firstChild);
  var ctx = cv.getContext('2d');

  var W = 0, H = 0, gutter = 0, docH = 0, list = [];
  var mx = -9999, my = -9999, tx = -9999, ty = -9999;

  function rnd(a, b) { return a + Math.random() * (b - a); }

  function build() {
    var dpr = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // свободная полоса слева: до первого содержимого страницы
    var probe = main.querySelector('.row__meta, .passport, .about__side, .proj__title') || main;
    gutter = Math.max(0, probe.getBoundingClientRect().left);
    docH = document.documentElement.scrollHeight;

    list = [];
    if (gutter < CFG.minGutter || coarse) return;     // узкое поле: кубов нет
    for (var i = 0; i < CFG.count; i++) {
      var r = rnd(CFG.size[0], CFG.size[1]);
      list.push({
        x: rnd(r + 16, gutter - r - 16),
        y: rnd(0, docH),                               // координата по документу
        r: r,
        s: rnd(0.6, 1.4)                               // своя скорость
      });
    }
  }

  // Куб в фирменной изометрии (как в гайдбуке): три грани, всегда один и тот же разворот.
  // Живость даёт не вращение, а подъём и подсветка рядом с курсором плюс параллакс при прокрутке.
  var COS30 = Math.cos(Math.PI / 6);
  function cube(c, sy) {
    var y = c.y - sy * (1 - CFG.drift * c.s);          // параллакс: куб отстаёт от прокрутки
    y = ((y % (docH + H)) + docH + H) % (docH + H) - H / 2;
    if (y < -140 || y > H + 140) return;

    var dx = c.x - mx, dy = y - my;
    var k = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) / CFG.near);   // близость курсора 0..1
    var e = k * k * (3 - 2 * k);
    var r = c.r * (1 + 0.08 * e);
    y -= e * CFG.lift;                                  // рядом с курсором куб приподнимается

    var a = COS30 * r, b = r / 2;
    var top = [[c.x, y - r], [c.x + a, y - b], [c.x, y], [c.x - a, y - b]];
    var left = [[c.x - a, y - b], [c.x, y], [c.x, y + r], [c.x - a, y + b]];
    var right = [[c.x, y], [c.x + a, y - b], [c.x + a, y + b], [c.x, y + r]];
    var alpha = CFG.line + (CFG.lineNear - CFG.line) * e;

    ctx.lineWidth = 1;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(37,55,70,' + alpha.toFixed(3) + ')';
    [[top, 'rgba(37,55,70,' + (0.02 + 0.05 * e).toFixed(3) + ')'],
     [left, 'rgba(37,55,70,' + (0.04 + 0.07 * e).toFixed(3) + ')'],
     [right, 'rgba(37,55,70,' + (0.06 + 0.09 * e).toFixed(3) + ')']].forEach(function (pair) {
      var q = pair[0];
      ctx.beginPath();
      ctx.moveTo(q[0][0], q[0][1]);
      for (var i = 1; i < 4; i++) ctx.lineTo(q[i][0], q[i][1]);
      ctx.closePath();
      ctx.fillStyle = pair[1];
      ctx.fill();
      ctx.stroke();
    });
    if (e > 0.75) {                                     // самый близкий к курсору куб получает фирменный акцент
      ctx.strokeStyle = 'rgba(175,39,47,' + ((e - 0.75) * 2).toFixed(3) + ')';
      ctx.beginPath();
      ctx.moveTo(top[0][0], top[0][1]);
      for (var i = 1; i < 4; i++) ctx.lineTo(top[i][0], top[i][1]);
      ctx.closePath();
      ctx.stroke();
    }
  }

  function draw() {
    raf = 0;
    ctx.clearRect(0, 0, W, H);
    if (!list.length) return;
    mx += (tx - mx) * 0.12; my += (ty - my) * 0.12;
    var sy = scrollY;
    for (var i = 0; i < list.length; i++) cube(list[i], sy);
    if (Math.abs(tx - mx) > 0.5 || Math.abs(ty - my) > 0.5) ping();   // доводим плавное движение к курсору
  }

  var raf = 0;
  function ping() { if (!raf) raf = requestAnimationFrame(draw); }

  build(); draw();
  addEventListener('resize', function () { build(); ping(); });
  if (reduce) return;                                   // без движения: одна отрисовка

  addEventListener('scroll', ping, { passive: true });
  addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse') return;
    tx = e.clientX; ty = e.clientY;
    if (mx < -9000) { mx = tx; my = ty; }
    ping();
  }, { passive: true });
  addEventListener('pointerleave', function () { tx = -9999; ty = -9999; ping(); });
})();
