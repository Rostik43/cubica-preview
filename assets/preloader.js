// Прелоадер: фирменный синий экран, кубы вычерчиваются по изометрической сетке (как в гайдбуке),
// затем проявляется логотип и экран уходит вверх.
// Уходит, когда готовы шрифты и обложки первого экрана, но не раньше, чем дочертятся кубы,
// и не позже жёсткого предела: сайт открывается в любом случае.
(function () {
  var STEP = 320, MAX = 3600;           // мс: пауза между кубами и предел ожидания
  // Мягкое проявление фото: пока файл не пришёл, на месте кадра светлая заливка.
  // Включается всегда, даже если прелоадер пропущен (повторный заход), иначе фото останутся невидимыми.
  function watch(img) {
    if (img.complete && img.naturalWidth) { img.classList.add('ready'); return; }
    img.addEventListener('load', function () { img.classList.add('ready'); }, { once: true });
    img.addEventListener('error', function () { img.classList.add('ready'); }, { once: true });
  }
  [].forEach.call(document.images, watch);
  document.documentElement.classList.add('js-img');   // прятать фото до загрузки, только когда скрипт точно работает

  var pre = document.getElementById('pre');
  if (!pre) return;
  var cubes = [].slice.call(pre.querySelectorAll('.cube'));
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function hide(instant) {
    if (pre._done) return;
    pre._done = true;
    if (instant) { pre.remove(); return; }
    cubes.forEach(function (c) { c.classList.add('on'); });
    pre.classList.add('logo');
    setTimeout(function () {
      pre.classList.add('pre--out');
      setTimeout(function () { pre.remove(); }, 900);
    }, 650);   // пауза с готовой композицией перед уходом занавеса
  }

  var seen = false;
  try { seen = sessionStorage.getItem('cubica-pre') === '1'; sessionStorage.setItem('cubica-pre', '1'); } catch (e) {}
  if (seen || reduce) { hide(true); return; }

  // Кубы вычерчиваются один за другим
  var drawn = false;
  cubes.forEach(function (c, i) {
    setTimeout(function () {
      c.classList.add('on');
      if (i === cubes.length - 1) { drawn = true; pre.classList.add('logo'); maybe(); }
    }, 200 + i * STEP);
  });

  // Готовность: шрифты и обложки, которые видны сразу
  var imgs = [].slice.call(document.querySelectorAll('img:not([loading="lazy"])'));
  var total = imgs.length + 1, ready = 0, loaded = false;
  function tick() { if (++ready >= total) { loaded = true; maybe(); } }
  function maybe() { if (drawn && loaded) hide(false); }

  imgs.forEach(function (img) {
    if (img.complete) tick();
    else { img.addEventListener('load', tick, { once: true }); img.addEventListener('error', tick, { once: true }); }
  });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(tick); else tick();

  setTimeout(function () { hide(false); }, MAX);

})();
