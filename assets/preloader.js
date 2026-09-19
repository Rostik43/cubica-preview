// Прелоадер: фирменный экран с логотипом и полосой прогресса.
// Прогресс настоящий: считаются обложки и шрифты. Жёсткий предел — сайт открывается даже если что-то не догрузилось.
// Показывается один раз за визит; при переходе по страницам сайта больше не появляется.
(function () {
  var MIN = 500, MAX = 1800;            // мс: минимальный показ и предел ожидания
  var pre = document.getElementById('pre');
  if (!pre) return;
  var bar = pre.querySelector('.pre__bar i');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function done(instant) {
    if (pre._done) return;
    pre._done = true;
    if (instant) { pre.remove(); return; }
    if (bar) bar.style.transform = 'scaleX(1)';
    setTimeout(function () {
      pre.classList.add('pre--out');
      setTimeout(function () { pre.remove(); }, 700);
    }, 180);
  }

  var seen = false;
  try { seen = sessionStorage.getItem('cubica-pre') === '1'; sessionStorage.setItem('cubica-pre', '1'); } catch (e) {}
  if (seen || reduce) { done(true); return; }

  // Считаем то, что видно сразу: обложки проектов и шрифты
  var imgs = [].slice.call(document.querySelectorAll('img:not([loading="lazy"])'));
  var total = imgs.length + 1, ready = 0, t0 = performance.now();

  function tick() {
    ready++;
    if (bar) bar.style.transform = 'scaleX(' + Math.min(1, ready / total).toFixed(3) + ')';
    if (ready >= total) finish();
  }
  function finish() {
    var wait = Math.max(0, MIN - (performance.now() - t0));
    setTimeout(function () { done(false); }, wait);
  }

  imgs.forEach(function (img) {
    if (img.complete) tick();
    else { img.addEventListener('load', tick, { once: true }); img.addEventListener('error', tick, { once: true }); }
  });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(tick); else tick();

  setTimeout(function () { finish(); }, MAX);   // предел: дальше не ждём

  // Мягкое проявление фото: пока файл не пришёл, на месте кадра светлый прямоугольник
  function watch(img) {
    if (img.complete && img.naturalWidth) { img.classList.add('ready'); return; }
    img.addEventListener('load', function () { img.classList.add('ready'); }, { once: true });
    img.addEventListener('error', function () { img.classList.add('ready'); }, { once: true });
  }
  [].forEach.call(document.images, watch);
})();
