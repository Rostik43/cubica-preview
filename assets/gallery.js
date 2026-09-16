// Горизонтальная галерея проекта с параллаксом внутри рамок (по мотивам Codrops Horizontal Parallax Gallery, DOM-версия).
// Источник истины: положение прокрутки страницы. Секция в потоке, сцена прилипает, дорожка сдвигается вбок.
// «Уменьшить движение» и узкие экраны: без закрепления, галерея листается пальцем.
(function () {
  var CONFIG = {
    parallax: 0.1,   // насколько фото смещается внутри рамки (доля ширины рамки)
    smooth: 0.14,    // сглаживание движения дорожки (1 = без сглаживания)
    staticBelow: 860 // ширина экрана, ниже которой галерея без закрепления
  };

  var section = document.querySelector('.hgal');
  if (!section) return;
  var stage = section.querySelector('.hgal__stage');
  var track = section.querySelector('.hgal__track');
  var bar = section.querySelector('.hgal__bar i');
  var frames = [].slice.call(section.querySelectorAll('.hgal__frame'));
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  var distance = 0, stageH = 0, target = 0, current = 0, raf = 0, active = false;

  function measure() {
    var isStatic = reduce.matches || window.innerWidth < CONFIG.staticBelow;
    section.classList.toggle('is-static', isStatic);
    active = !isStatic;
    if (!active) { section.style.height = ''; return; }
    stageH = stage.offsetHeight;
    distance = Math.max(0, track.scrollWidth - window.innerWidth);
    // высота секции = высота сцены + путь дорожки: на каждый пиксель прокрутки приходится пиксель сдвига
    section.style.height = (stageH + distance) + 'px';
    update();
  }

  function progress() {
    var r = section.getBoundingClientRect();
    var travel = r.height - stageH;
    if (travel <= 0) return 0;
    var stick = parseFloat(getComputedStyle(stage).top) || 0;   // сцена прилипает под верхней панелью
    return Math.min(1, Math.max(0, (stick - r.top) / travel));
  }

  function render() {
    raf = 0;
    current += (target - current) * CONFIG.smooth;
    if (Math.abs(target - current) < 0.3) current = target;
    track.style.transform = 'translate3d(' + (-current).toFixed(2) + 'px,0,0)';
    if (bar) bar.style.transform = 'scaleX(' + (distance ? current / distance : 0).toFixed(4) + ')';
    var vw = window.innerWidth;
    frames.forEach(function (f) {
      var b = f.getBoundingClientRect();
      if (b.right < -200 || b.left > vw + 200) return;             // вне экрана не считаем
      var offset = (b.left + b.width / 2 - vw / 2) / vw;           // -1…1 относительно центра экрана
      f.firstElementChild.style.transform = 'translate3d(' + (-offset * b.width * CONFIG.parallax).toFixed(2) + 'px,0,0)';
    });
    if (current !== target) raf = requestAnimationFrame(render);
  }

  function update() {
    if (!active) return;
    target = progress() * distance;
    if (!raf) raf = requestAnimationFrame(render);
  }

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', measure);
  if (reduce.addEventListener) reduce.addEventListener('change', measure);
  // размеры кадров известны из aspect-ratio, но шрифты меняют ширину подписи: перемеряем после загрузки
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  window.addEventListener('load', measure);
  measure();
  current = target;
  render();
})();
