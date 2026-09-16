// Главная: раскрытие проекта в списке.
// Клик по названию или обложке открывает проект: обложка превращается в ленту всех фото, слева появляются сведения.
// Открыт всегда один проект. Лента листается кнопками, клавишами ←/→, перетаскиванием мышью и жестом тачпада.
(function () {
  var rows = [].slice.call(document.querySelectorAll('.row'));
  if (!rows.length) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var openRow = null;

  function frames(row) { return [].slice.call(row.querySelectorAll('.shot')); }

  function current(row) {
    var strip = row.querySelector('.strip');
    var list = frames(row), left = strip.scrollLeft, best = 0;
    list.forEach(function (f, i) { if (Math.abs(f.offsetLeft - strip.offsetLeft - left) < Math.abs(list[best].offsetLeft - strip.offsetLeft - left)) best = i; });
    return best;
  }

  function sync(row) {
    var count = row.querySelector('.row__count');
    if (!count) return;
    var strip = row.querySelector('.strip');
    var n = frames(row).length, i = current(row);
    var atEnd = strip.scrollLeft + strip.clientWidth >= strip.scrollWidth - 4;
    if (atEnd) i = n - 1;
    count.textContent = (i + 1) + ' / ' + n;
    row.querySelector('[data-step="-1"]').disabled = strip.scrollLeft < 4;
    row.querySelector('[data-step="1"]').disabled = atEnd;
  }

  // Своя анимация прокрутки ленты: предсказуемая, одинаковая во всех браузерах.
  // Пока лента едет, следующее нажатие считается от цели, а не от текущего положения.
  function glide(row, to) {
    var strip = row.querySelector('.strip');
    cancelAnimationFrame(row._raf);
    if (reduce) { strip.scrollLeft = to; row._target = null; sync(row); return; }
    var from = strip.scrollLeft, t0 = performance.now(), dur = 650;
    strip.classList.add('drag');                       // без привязки к кадрам на время анимации
    (function step(now) {
      var p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 4);
      strip.scrollLeft = from + (to - from) * e;
      if (p < 1) row._raf = requestAnimationFrame(step);
      else { strip.classList.remove('drag'); row._target = null; sync(row); }
    })(t0);
  }
  function go(row, step) {
    var strip = row.querySelector('.strip');
    var list = frames(row);
    var from = row._target != null ? row._target : current(row);
    var i = Math.max(0, Math.min(list.length - 1, from + step));
    var max = strip.scrollWidth - strip.clientWidth;
    row._target = i;
    glide(row, Math.min(max, list[i].offsetLeft - strip.offsetLeft));
  }

  function setOpen(row, open) {
    var btn = row.querySelector('.row__toggle');
    var strip = row.querySelector('.strip');
    row.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open);
    if (open) {
      if (openRow && openRow !== row) setOpen(openRow, false);
      openRow = row;
      strip.scrollLeft = 0;
      sync(row);
      // дождаться раскрытия и показать проект целиком
      setTimeout(function () {
        var top = row.getBoundingClientRect().top;
        if (top < 0 || top > window.innerHeight * 0.35) row.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      }, reduce ? 0 : 120);
    } else {
      if (openRow === row) openRow = null;
      strip.scrollLeft = 0;
    }
  }

  rows.forEach(function (row) {
    var strip = row.querySelector('.strip');
    var btn = row.querySelector('.row__toggle');

    btn.addEventListener('click', function () { setOpen(row, !row.classList.contains('open')); });
    row.querySelector('.row__close').addEventListener('click', function () { setOpen(row, false); btn.focus(); });
    row.querySelectorAll('[data-step]').forEach(function (b) {
      b.addEventListener('click', function () { go(row, +b.dataset.step); });
    });
    strip.addEventListener('scroll', function () { sync(row); }, { passive: true });

    // Перетаскивание ленты мышью; клик без перетаскивания: открыть проект или следующее фото
    var down = false, moved = false, startX = 0, startLeft = 0;
    strip.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse') return;
      down = true; moved = false; startX = e.clientX; startLeft = strip.scrollLeft;
      cancelAnimationFrame(row._raf); row._target = null;
    });
    window.addEventListener('pointermove', function (e) {
      if (!down || !row.classList.contains('open')) return;
      var dx = e.clientX - startX;
      if (Math.abs(dx) > 5) { moved = true; strip.classList.add('drag'); }
      if (moved) strip.scrollLeft = startLeft - dx;
    });
    window.addEventListener('pointerup', function () {
      if (!down) return;
      down = false;
      if (moved) { row._target = null; go(row, 0); }
    });
    strip.addEventListener('click', function (e) {
      if (moved) { e.preventDefault(); return; }
      if (!row.classList.contains('open')) setOpen(row, true);
      else {
        var shot = e.target.closest('.shot');
        var list = frames(row);
        go(row, list.indexOf(shot) <= current(row) ? 1 : list.indexOf(shot) - current(row));
      }
    });
  });

  document.addEventListener('keydown', function (e) {
    if (!openRow || document.querySelector('.menu.open')) return;
    if (e.target.matches && e.target.matches('input, textarea')) return;
    if (e.key === 'ArrowRight') { go(openRow, 1); e.preventDefault(); }
    else if (e.key === 'ArrowLeft') { go(openRow, -1); e.preventDefault(); }
    else if (e.key === 'Escape') { var r = openRow; setOpen(r, false); r.querySelector('.row__toggle').focus(); }
  });

  // Фильтр или поиск скрыли открытый проект: закрываем его
  window.addEventListener('hgal:measure', function () {
    if (openRow && openRow.hidden) setOpen(openRow, false);
  });

  // Ссылка вида index.html#kzn1 открывает нужный проект
  var fromHash = location.hash && document.getElementById(location.hash.slice(1));
  if (fromHash && fromHash.classList.contains('row')) setOpen(fromHash, true);
})();
