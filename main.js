import * as THREE from "three";

const root = document.documentElement;
root.classList.add("js");
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = matchMedia("(pointer: fine)").matches;

/* ---------- Particle field: one cloud that morphs per section ---------- */
function initSpace() {
  const canvas = document.getElementById("space");
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: "high-performance" });
  } catch (e) { return; } // CSS gradient background stays as fallback

  const mobile = innerWidth < 768;
  const N = mobile ? 1800 : 4200;
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.setSize(innerWidth, innerHeight, false);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 100);
  camera.position.set(0, 0, 9);

  const rand = (a = 1) => (Math.random() * 2 - 1) * a;

  // Formation generators, each returns N*3 positions
  const make = (fn) => { const a = new Float32Array(N * 3); for (let i = 0; i < N; i++) fn(i, a, i * 3); return a; };
  const forms = {
    sphere: make((i, a, k) => {
      const y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), th = i * 2.399963;
      const R = 2.5 + rand(0.06);
      a[k] = Math.cos(th) * r * R; a[k + 1] = y * R; a[k + 2] = Math.sin(th) * r * R;
    }),
    galaxy: make((i, a, k) => {
      const arm = i % 3, r = Math.pow(Math.random(), 0.65) * 4.2, ang = r * 1.35 + (arm * Math.PI * 2) / 3 + rand(0.35);
      a[k] = Math.cos(ang) * r; a[k + 1] = rand(0.18) * (1.2 - r / 4.2); a[k + 2] = Math.sin(ang) * r;
    }),
    helix: make((i, a, k) => {
      const t = i / N, strand = i % 3, ang = t * Math.PI * 12 + (strand === 1 ? Math.PI : 0);
      const r = strand === 2 ? Math.random() * 1.3 : 1.3; // third set forms the rungs
      a[k] = Math.cos(ang) * r + rand(0.05); a[k + 1] = (t - 0.5) * 7.5; a[k + 2] = Math.sin(ang) * r + rand(0.05);
    }),
    knot: make((i, a, k) => {
      const u = (i / N) * Math.PI * 2, p = 2, q = 3, rr = Math.cos(q * u) + 2.1;
      const tube = 0.28 * Math.sqrt(Math.random()), ta = Math.random() * Math.PI * 2;
      a[k] = rr * Math.cos(p * u) * 0.95 + Math.cos(ta) * tube;
      a[k + 1] = rr * Math.sin(p * u) * 0.95 + Math.sin(ta) * tube;
      a[k + 2] = -Math.sin(q * u) * 0.95 + rand(tube);
    }),
    grid: make((i, a, k) => {
      const cols = Math.round(Math.sqrt(N * 1.8)), x = (i % cols) / cols, z = Math.floor(i / cols) / (N / cols);
      const X = (x - 0.5) * 11, Z = (z - 0.5) * 7;
      a[k] = X; a[k + 1] = Math.sin(X * 0.9) * Math.cos(Z * 1.1) * 0.55 - 0.6; a[k + 2] = Z;
    }),
  };
  // where each formation sits (desktop) and its resting tilt
  const layout = {
    sphere: { x: 2.7, rx: 0.2 }, galaxy: { x: 0, rx: 0.55 }, helix: { x: 3.4, rx: 0.15 },
    knot: { x: 0, rx: 0.3 }, grid: { x: 0, rx: 0.25 },
  };

  const pos = forms.sphere.slice();
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const col = new Float32Array(N * 3);
  const c1 = new THREE.Color("#9cc9ff"), c2 = new THREE.Color("#4f86e8"), c3 = new THREE.Color("#f5c542"), tmp = new THREE.Color();
  for (let i = 0; i < N; i++) {
    const r = Math.random();
    tmp.copy(r < 0.16 ? c3 : c1).lerp(c2, r < 0.16 ? 0 : Math.random() * 0.7);
    col.set([tmp.r, tmp.g, tmp.b], i * 3);
  }
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));

  // soft round sprite
  const sc = document.createElement("canvas"); sc.width = sc.height = 64;
  const g = sc.getContext("2d"), grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, "rgba(255,255,255,1)"); grd.addColorStop(0.35, "rgba(255,255,255,.55)"); grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
  const mat = new THREE.PointsMaterial({
    size: mobile ? 0.07 : 0.06, map: new THREE.CanvasTexture(sc), vertexColors: true,
    transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true,
  });
  const group = new THREE.Group();
  group.add(new THREE.Points(geo, mat));
  scene.add(group);

  let target = forms.sphere, place = layout.sphere;
  const setForm = (name) => {
    if (!forms[name]) return;
    target = forms[name]; place = layout[name];
    if (reduce) { pos.set(target); geo.attributes.position.needsUpdate = true; applyPlace(1); render(); }
  };
  const applyPlace = (t) => {
    const x = innerWidth < 1024 ? 0 : place.x;
    group.position.x += (x - group.position.x) * t;
    group.rotation.x += (place.rx - group.rotation.x) * t;
  };

  // pointer in world space (z = 0 plane) for repulsion + camera parallax
  const ndc = new THREE.Vector2(9, 9), ray = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const hit = new THREE.Vector3(), local = new THREE.Vector3();
  let pointerActive = false;
  if (finePointer && !reduce) {
    addEventListener("pointermove", (e) => {
      ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
      pointerActive = true;
    }, { passive: true });
    document.addEventListener("pointerleave", () => { pointerActive = false; });
  }

  const render = () => renderer.render(scene, camera);
  addEventListener("resize", () => {
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight, false);
    if (reduce) { applyPlace(1); render(); }
  });

  // section -> formation, chosen by whichever section crosses the middle of the screen
  const sio = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setForm(e.target.dataset.form)),
    { rootMargin: "-50% 0px -50% 0px" });
  document.querySelectorAll("[data-form]").forEach((s) => sio.observe(s));

  if (reduce) { applyPlace(1); render(); return; }

  const R = 1.6, R2 = R * R;
  const tick = () => {
    applyPlace(0.04);
    group.rotation.y += 0.0016;
    camera.position.x += (ndc.x * (pointerActive ? 0.5 : 0) - camera.position.x) * 0.04;
    camera.position.y += (ndc.y * (pointerActive ? 0.35 : 0) - camera.position.y) * 0.04;
    camera.lookAt(0, 0, 0);

    let mx = 1e9, my = 1e9, mz = 1e9;
    if (pointerActive) {
      ray.setFromCamera(ndc, camera);
      if (ray.ray.intersectPlane(plane, hit)) { group.updateMatrixWorld(); local.copy(hit); group.worldToLocal(local); mx = local.x; my = local.y; mz = local.z; }
    }
    for (let k = 0; k < N * 3; k += 3) {
      let x = pos[k], y = pos[k + 1], z = pos[k + 2];
      x += (target[k] - x) * 0.05; y += (target[k + 1] - y) * 0.05; z += (target[k + 2] - z) * 0.05;
      const dx = x - mx, dy = y - my, dz = z - mz, d2 = dx * dx + dy * dy + dz * dz;
      if (d2 < R2) { const d = Math.sqrt(d2) || 0.001, f = (1 - d / R) * 0.22 / d; x += dx * f; y += dy * f; z += dz * f; }
      pos[k] = x; pos[k + 1] = y; pos[k + 2] = z;
    }
    geo.attributes.position.needsUpdate = true;
    render();
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
initSpace();

/* ---------- Typed role line ---------- */
(() => {
  const el = document.getElementById("typed");
  if (reduce) return;
  const words = ["building scalable systems", "shipping real-time POS systems", "wiring AI into real products", "keeping payments idempotent"];
  let w = 0, i = words[0].length, del = true;
  const step = () => {
    const word = words[w];
    i += del ? -1 : 1;
    el.textContent = word.slice(0, i);
    let wait = del ? 28 : 55;
    if (!del && i === word.length) { del = true; wait = 2200; }
    else if (del && i === 0) { del = false; w = (w + 1) % words.length; wait = 300; }
    setTimeout(step, wait);
  };
  setTimeout(step, 2600);
})();

/* ---------- Reveals, counters, nav state ---------- */
const io = new IntersectionObserver((es) => es.forEach((e) => {
  if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
}), { threshold: 0.12 });
document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

const cio = new IntersectionObserver((es) => es.forEach((e) => {
  if (!e.isIntersecting) return;
  cio.unobserve(e.target);
  const end = +e.target.dataset.count;
  if (reduce) { e.target.textContent = end.toLocaleString("en-US"); return; }
  const t0 = performance.now();
  const run = (t) => {
    const p = Math.min((t - t0) / 1500, 1);
    e.target.textContent = Math.round(end * (1 - Math.pow(1 - p, 4))).toLocaleString("en-US");
    if (p < 1) requestAnimationFrame(run);
  };
  requestAnimationFrame(run);
}), { threshold: 0.6 });
document.querySelectorAll("[data-count]").forEach((el) => cio.observe(el));

const nav = document.querySelector(".nav");
new IntersectionObserver(([e]) => nav.classList.toggle("solid", !e.isIntersecting), { rootMargin: "-80px 0px 0px 0px" })
  .observe(document.querySelector(".hero .kicker"));

/* ---------- Card tilt + spotlight, magnetic buttons (pointer devices only) ---------- */
if (finePointer && !reduce) {
  document.querySelectorAll(".tilt").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      card.style.setProperty("--mx", px * 100 + "%");
      card.style.setProperty("--my", py * 100 + "%");
      card.style.transform = `perspective(900px) rotateX(${(0.5 - py) * 5}deg) rotateY(${(px - 0.5) * 6}deg)`;
    });
    card.addEventListener("pointerleave", () => { card.style.transform = ""; });
  });
  document.querySelectorAll(".magnetic").forEach((b) => {
    b.addEventListener("pointermove", (e) => {
      const r = b.getBoundingClientRect();
      b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.2}px, ${(e.clientY - r.top - r.height / 2) * 0.3}px)`;
    });
    b.addEventListener("pointerleave", () => { b.style.transform = ""; });
  });
}
