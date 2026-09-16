// Фон из изометрических кубиков (фирменная сетка из гайдбука «Кубики»).
// Медленная волна + подъём кубиков у курсора. При первом визите кубики проявляются от центра.
// Пауза в скрытой вкладке; без анимации при «уменьшить движение»; на сенсорных экранах только проявление.
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse = window.matchMedia('(pointer: coarse)').matches;
  var intro = document.documentElement.classList.contains('intro') && !reduce;

  var c = document.createElement('canvas');
  c.className = 'cubes';
  c.setAttribute('aria-hidden', 'true');
  document.body.insertBefore(c, document.body.firstChild);
  var ctx = c.getContext('2d');

  var S = 22;                              // ребро куба, px
  var A = S * Math.cos(Math.PI / 6);       // половина ширины шестиугольника
  var B = S / 2;
  var W = 0, H = 0, cells = [];
  var t0 = performance.now(), last = 0;
  var mx = -9999, my = -9999, tx = -9999, ty = -9999, amp = 0, moved = 0;

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    c.width = W * dpr; c.height = H * dpr;
    c.style.width = W + 'px'; c.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cells = [];
    for (var row = 0, y = -S; y < H + 2 * S; y += 1.5 * S, row++) {
      for (var x = (row % 2 ? A : 0) - A; x < W + 2 * A; x += 2 * A) cells.push(x, y);
    }
  }

  function face(p) {
    ctx.beginPath();
    ctx.moveTo(p[0], p[1]);
    for (var i = 2; i < p.length; i += 2) ctx.lineTo(p[i], p[i + 1]);
    ctx.closePath();
    ctx.fill();
  }

  function cube(x, y, k, a) {
    if (a <= 0) return;
    y -= k * 5;                            // волна приподнимает куб
    if (k > 0.03) {
      ctx.fillStyle = 'rgba(37,55,70,' + (0.045 * k * a) + ')';
      face([x - A, y - B, x, y, x, y + S, x - A, y + B]);
      ctx.fillStyle = 'rgba(37,55,70,' + (0.09 * k * a) + ')';
      face([x, y, x + A, y - B, x + A, y + B, x, y + S]);
    }
    ctx.strokeStyle = 'rgba(37,55,70,' + ((0.045 + 0.12 * k) * a) + ')';
    ctx.beginPath();
    ctx.moveTo(x, y - S); ctx.lineTo(x + A, y - B); ctx.lineTo(x + A, y + B);
    ctx.lineTo(x, y + S); ctx.lineTo(x - A, y + B); ctx.lineTo(x - A, y - B); ctx.closePath();
    ctx.moveTo(x - A, y - B); ctx.lineTo(x, y); ctx.lineTo(x + A, y - B);
    ctx.moveTo(x, y); ctx.lineTo(x, y + S);
    ctx.stroke();
  }

  function draw(now, still) {
    var t = (now - t0) / 1000;
    ctx.clearRect(0, 0, W, H);
    ctx.lineWidth = 1;
    mx += (tx - mx) * 0.12; my += (ty - my) * 0.12;
    amp += ((now - moved < 1200 ? 1 : 0) - amp) * 0.05;
    var cx = W / 2, cy = H / 2, front = t * 950, animate = !still;
    for (var i = 0; i < cells.length; i += 2) {
      var x = cells[i], y = cells[i + 1], k = 0, a = 1;
      if (intro) {
        var d = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy));
        a = Math.max(0, Math.min(1, (front - d) / 140));
        var r = d - front;
        k += Math.exp(-(r * r) / 3600);
      }
      if (animate) {
        var w = Math.sin((x * 0.6 + y * 0.8) * 0.006 - t * 0.55);
        if (w > 0) k += Math.pow(w, 8) * 0.75;
        var dx = x - mx, dy = y - my;
        k += Math.exp(-(dx * dx + dy * dy) / 7000) * amp * 0.8;
      }
      cube(x, y, Math.min(1, k), a);
    }
    if (intro && front > Math.hypot(W, H)) intro = false;
  }

  var running = false;
  function frame(now) {
    if (!running) return;
    if (now - last > 33) { last = now; draw(now, false); }   // ~30 кадров в секунду
    requestAnimationFrame(frame);
  }
  function introOnly(now) {                                  // сенсорные экраны: только проявление
    draw(now, true);
    if (intro) requestAnimationFrame(introOnly);
  }

  resize();
  window.addEventListener('resize', function () { resize(); if (!running) draw(performance.now(), true); });

  if (reduce) { intro = false; draw(t0, true); return; }
  if (coarse) { requestAnimationFrame(introOnly); return; }

  window.addEventListener('pointermove', function (e) { tx = e.clientX; ty = e.clientY; moved = performance.now(); if (mx < -9000) { mx = tx; my = ty; } }, { passive: true });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) running = false;
    else if (!running) { running = true; requestAnimationFrame(frame); }
  });
  running = true;
  requestAnimationFrame(frame);
})();
