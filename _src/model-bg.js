// Фон «белый архитектурный макет»: поле матовых белых блоков с мягкими тенями.
// Медленная волна приподнимает блоки, у курсора блоки поднимаются выше; при первом визите макет «вырастает» от центра.
// Исходник. Собирается в assets/model-bg.js (обычный скрипт, работает при открытии файла с диска):
//   rolldown _src/model-bg.js --format iife --minify -o assets/model-bg.js
import {
  WebGLRenderer, Scene, Color, Fog, OrthographicCamera, HemisphereLight, DirectionalLight,
  BoxGeometry, MeshStandardMaterial, InstancedMesh, Matrix4, Plane, Vector3, Vector2, Raycaster,
  PCFSoftShadowMap, NeutralToneMapping, SRGBColorSpace
} from '/Users/user/Клауд/кирпич-3d/viewer/node_modules/three/build/three.module.js';

const CFG = {
  cols: 56, rows: 56, gap: 0.08,
  view: 15,              // сколько единиц сцены по высоте экрана
  base: [0.25, 1.6],    // диапазон высот «застройки» в покое
  wave: 1.1, waveSpeed: 0.5, waveWidth: 7,
  cursor: 1.4, cursorRadius: 2.6,
};

(function () {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = matchMedia('(pointer: coarse)').matches;
  const lite = coarse || (navigator.hardwareConcurrency || 8) <= 4;
  let intro = document.documentElement.classList.contains('intro') && !reduce;

  let renderer;
  try {
    renderer = new WebGLRenderer({ antialias: !lite, powerPreference: 'low-power' });
  } catch (e) { return; }                       // нет WebGL: остаётся белый фон страницы

  const canvas = renderer.domElement;
  canvas.className = 'model-bg';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.insertBefore(canvas, document.body.firstChild);

  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, lite ? 1 : 1.5));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = NeutralToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;

  const scene = new Scene();
  scene.background = new Color(0xffffff);
  scene.fog = new Fog(0xffffff, 58, 100);   // камера ~50 единиц от центра: дымка только на дальнем краю поля

  // Изометрия как в гайдбуке: камера по диагонали сверху
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 200);
  camera.position.set(34, 26, 34);
  camera.lookAt(0, 0, 0);

  scene.add(new HemisphereLight(0xffffff, 0xb9c3cb, 1.5));
  const sun = new DirectionalLight(0xffffff, 1.6);
  sun.position.set(-18, 22, 6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(lite ? 1024 : 2048, lite ? 1024 : 2048);
  const sc = sun.shadow.camera;
  sc.left = -34; sc.right = 34; sc.top = 34; sc.bottom = -34; sc.near = 1; sc.far = 80;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  sun.shadow.radius = 4;
  scene.add(sun);

  const geo = new BoxGeometry(1 - CFG.gap, 1, 1 - CFG.gap);
  geo.translate(0, 0.5, 0);                     // основание блока на земле
  const mat = new MeshStandardMaterial({ color: 0xffffff, roughness: 0.92, metalness: 0 });
  const count = CFG.cols * CFG.rows;
  const mesh = new InstancedMesh(geo, mat, count);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);

  // Позиции и «застройка» в покое: мягкий шум, квантованный по этажам
  const px = new Float32Array(count), pz = new Float32Array(count), base = new Float32Array(count);
  const hash = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
  const m = new Matrix4();
  for (let r = 0, i = 0; r < CFG.rows; r++) {
    for (let c = 0; c < CFG.cols; c++, i++) {
      const x = c - CFG.cols / 2 + 0.5, z = r - CFG.rows / 2 + 0.5;
      px[i] = x; pz[i] = z;
      const n = 0.5 * Math.sin(x * 0.35) * Math.cos(z * 0.3) + 0.5 * hash(Math.floor(x / 3), Math.floor(z / 3));
      const t = Math.pow(Math.round(Math.max(0, Math.min(1, n * 0.5 + 0.5)) * 5) / 5, 2);
      base[i] = CFG.base[0] + t * (CFG.base[1] - CFG.base[0]);
      m.makeTranslation(x, 0, z);
      mesh.setMatrixAt(i, m);
    }
  }
  const arr = mesh.instanceMatrix.array;       // [i*16+5] — масштаб по высоте

  // Курсор: точка на плоскости земли
  const ray = new Raycaster(), ground = new Plane(new Vector3(0, 1, 0), 0), ndc = new Vector2(), hit = new Vector3();
  let cx = 999, cz = 999, tcx = 999, tcz = 999, amp = 0, moved = -1e9;
  addEventListener('pointermove', (e) => {
    ndc.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    if (ray.ray.intersectPlane(ground, hit)) {
      tcx = hit.x; tcz = hit.z; moved = performance.now();
      if (cx > 900) { cx = tcx; cz = tcz; }
    }
  }, { passive: true });

  function resize() {
    const w = innerWidth, h = innerHeight, a = w / h, v = CFG.view;
    camera.left = -v * a / 2; camera.right = v * a / 2; camera.top = v / 2; camera.bottom = -v / 2;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
  }
  resize();
  addEventListener('resize', () => { resize(); if (!running) draw(performance.now(), true); });

  const t0 = performance.now();
  function draw(now, still) {
    const t = (now - t0) / 1000;
    cx += (tcx - cx) * 0.08; cz += (tcz - cz) * 0.08;
    amp += ((now - moved < 1500 ? 1 : 0) - amp) * 0.04;
    const front = t * 16;                       // скорость «вырастания», единиц в секунду
    const rr = CFG.cursorRadius * CFG.cursorRadius * 2;
    for (let i = 0; i < count; i++) {
      const x = px[i], z = pz[i];
      let h = base[i];
      if (!still) {
        const w = Math.sin((x + z) / CFG.waveWidth - t * CFG.waveSpeed);
        if (w > 0) h += Math.pow(w, 10) * CFG.wave;
        const dx = x - cx, dz = z - cz;
        h += Math.exp(-(dx * dx + dz * dz) / rr) * CFG.cursor * amp;
      }
      if (intro) {
        const d = Math.sqrt(x * x + z * z);
        const k = Math.max(0, Math.min(1, (front - d) / 6));
        h = 0.02 + h * (k * k * (3 - 2 * k));
      }
      arr[i * 16 + 5] = h;
    }
    mesh.instanceMatrix.needsUpdate = true;
    renderer.render(scene, camera);
    if (intro && front > 50) intro = false;
  }

  let running = false, last = 0;
  const fps = lite ? 24 : 40;
  function loop(now) {
    if (!running) return;
    if (now - last >= 1000 / fps) { last = now; draw(now, false); }
    requestAnimationFrame(loop);
  }
  function introOnly(now) {                     // телефоны: только «вырастание», потом статика
    draw(now, true);
    if (intro) requestAnimationFrame(introOnly);
  }

  if (reduce) { draw(t0, true); return; }
  if (coarse) { requestAnimationFrame(introOnly); return; }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) running = false;
    else if (!running) { running = true; requestAnimationFrame(loop); }
  });
  running = true;
  requestAnimationFrame(loop);
})();
