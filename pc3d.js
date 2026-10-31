/* MYPC 3D-PC: Scroll-Story und Vollbild-Studio
   Das Modell ist frei nachgebaut (Panorama-Gehäuse wie das KRUX Atron), keine fremden 3D-Dateien. */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const $ = id => document.getElementById(id);
const stage = $('stage'), canvas = $('pc'), scrolly = $('erleben');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ============ Renderer, Szene, Licht ============ */
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: true }); }
catch (e) { $('loading').textContent = 'Dein Gerät unterstützt leider keine 3D-Ansicht.'; throw e; }
// Auflösung passt sich der Leistung an (siehe adapt), Start: höchstens 1.5-fach
let quality = Math.min(devicePixelRatio || 1, 1.5);
renderer.setPixelRatio(quality);
renderer.setClearColor(0x000000, 1);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.shadowMap.autoUpdate = false; // Schatten nur neu, wenn sich Teile bewegen

const scene = new THREE.Scene();
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(renderer), .04).texture;

const camera = new THREE.PerspectiveCamera(30, 1, .1, 200);
const controls = new OrbitControls(camera, canvas);
controls.enabled = false;
controls.enableDamping = true; controls.dampingFactor = .08;
controls.enablePan = false; controls.minDistance = 4.5; controls.maxDistance = 34;
controls.maxPolarAngle = 1.56; controls.rotateSpeed = .8; controls.autoRotateSpeed = 1.4;

const composer = new EffectComposer(renderer);
composer.setPixelRatio(quality);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), .55, .45, 1);
composer.addPass(bloom);
composer.addPass(new OutputPass());

scene.add(new THREE.HemisphereLight(0xc9ccff, 0x050507, .4));
const key = new THREE.DirectionalLight(0xffffff, 1.8);
key.position.set(6, 11, 9); key.castShadow = true;
key.shadow.mapSize.set(1024, 1024); key.shadow.bias = -.0004; key.shadow.normalBias = .02;
Object.assign(key.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 1, far: 40 });
scene.add(key);
const rim = new THREE.DirectionalLight(0x8b5cf6, 1.3); rim.position.set(-9, 6, -7); scene.add(rim);
const fill = new THREE.DirectionalLight(0x9fdcff, .45); fill.position.set(8, 3, -4); scene.add(fill);
const inner = [new THREE.PointLight(0x8b5cf6, 0, 7, 2), new THREE.PointLight(0x8b5cf6, 0, 7, 2)];
inner[0].position.set(-.4, 3.2, .7); inner[1].position.set(.5, 1, .7);
scene.add(...inner);

/* ============ Hilfen ============ */
const rr = (a, b) => a + Math.random() * (b - a);
const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
const easeInOut = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
// dunkles Studio: Spiegelungen der Umgebung bewusst schwach; Standard-Material ist deutlich schneller als Physical
const std = (color, o = {}) => { const { clearcoat, clearcoatRoughness, ...rest } = o; return new THREE.MeshStandardMaterial({ color, roughness: .5, metalness: .2, envMapIntensity: .45, ...rest }); };
const blackMetal = () => std('#0d0d11', { metalness: .6, roughness: .42, clearcoat: .3, clearcoatRoughness: .45 });
const heatsink = () => std('#2e3138', { metalness: .85, roughness: .32 });
const silver = () => std('#c3c7cf', { metalness: 1, roughness: .28 });
function box(w, h, d, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); return m;
}
function tex(w, h, draw, color = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  if (color) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return t;
}
function roundRect(sh, x, y, w, h, r) {
  sh.moveTo(x + r, y); sh.lineTo(x + w - r, y); sh.quadraticCurveTo(x + w, y, x + w, y + r);
  sh.lineTo(x + w, y + h - r); sh.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  sh.lineTo(x + r, y + h); sh.quadraticCurveTo(x, y + h, x, y + h - r);
  sh.lineTo(x, y + r); sh.quadraticCurveTo(x, y, x + r, y);
}
const FONT = 'Inter, Arial, sans-serif';

/* ============ Texturen ============ */
const radialTex = tex(256, 256, (c, w, h) => {
  const g = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
  g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(.35, 'rgba(255,255,255,.32)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = g; c.fillRect(0, 0, w, h);
});
const pcbTex = tex(1024, 1280, (c, w, h) => {
  c.fillStyle = '#101216'; c.fillRect(0, 0, w, h);
  c.strokeStyle = 'rgba(80,92,110,.32)'; c.lineWidth = 2;
  for (let i = 0; i < 200; i++) {
    let x = Math.random() * w, y = Math.random() * h; c.beginPath(); c.moveTo(x, y);
    for (let k = 0; k < 4; k++) { if (Math.random() < .5) x += rr(-170, 170); else y += rr(-170, 170); c.lineTo(x, y); }
    c.stroke();
  }
  c.fillStyle = 'rgba(42,48,58,.95)';
  for (let i = 0; i < 80; i++) c.fillRect(Math.random() * w, Math.random() * h, rr(8, 42), rr(6, 26));
  c.fillStyle = 'rgba(255,255,255,.4)'; c.font = `600 36px ${FONT}`; c.fillText('B650 GAMING X AX V2', 520, 1190);
});
const finU = tex(512, 64, (c, w, h) => { c.fillStyle = '#15161b'; c.fillRect(0, 0, w, h); c.fillStyle = '#3b3e46'; for (let x = 0; x < w; x += 8) c.fillRect(x, 0, 3, h); });
const finV = tex(64, 512, (c, w, h) => { c.fillStyle = '#15161b'; c.fillRect(0, 0, w, h); c.fillStyle = '#3b3e46'; for (let y = 0; y < h; y += 8) c.fillRect(0, y, w, 3); });
const meshTex = tex(256, 256, (c, w, h) => {
  c.fillStyle = '#fff'; c.fillRect(0, 0, w, h); c.fillStyle = '#000';
  const s = 16;
  for (let y = 0, row = 0; y < h + s; y += s * .866, row++)
    for (let x = (row % 2) * s / 2; x < w + s; x += s) { c.beginPath(); c.arc(x, y, s * .34, 0, 7); c.fill(); }
}, false);
meshTex.wrapS = meshTex.wrapT = THREE.RepeatWrapping; meshTex.repeat.set(6, 4);
const trayTex = tex(1024, 1024, (c, w, h) => {
  c.fillStyle = '#0b0b0e'; c.fillRect(0, 0, w, h);
  c.fillStyle = '#040405'; c.strokeStyle = '#1c1c22'; c.lineWidth = 6;
  for (const [x, y, ww, hh] of [[590, 110, 60, 150], [590, 300, 60, 150], [590, 490, 60, 150], [200, 905, 220, 50], [500, 905, 220, 50]]) {
    c.beginPath(); c.roundRect(x, y, ww, hh, 24); c.fill(); c.stroke();
  }
});
const gpuSideTex = tex(1140, 200, (c, w, h) => {
  const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#1e1e26'); g.addColorStop(1, '#0c0c10');
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  c.fillStyle = 'rgba(255,255,255,.07)'; c.fillRect(0, h * .74, w, 3);
  c.font = `700 64px ${FONT}`; c.fillStyle = '#ececf2'; c.textAlign = 'right'; c.textBaseline = 'middle';
  c.fillText('RTX 5070', w - 60, h * .44);
});
const backplateTex = tex(1024, 400, (c, w, h) => {
  c.fillStyle = '#18181e'; c.fillRect(0, 0, w, h);
  c.strokeStyle = 'rgba(255,255,255,.05)'; c.lineWidth = 2;
  for (let x = -h; x < w; x += 26) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x + h, h); c.stroke(); }
  c.fillStyle = '#0f0f13'; c.fillRect(w * .62, h * .2, w * .3, h * .6);
});
const ramTex = tex(256, 512, (c, w, h) => {
  c.fillStyle = '#25272e'; c.fillRect(0, 0, w, h);
  c.strokeStyle = 'rgba(255,255,255,.12)'; c.lineWidth = 4;
  for (let y = -w; y < h; y += 70) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y + w * .6); c.stroke(); }
  c.fillStyle = '#17181d'; c.fillRect(0, h * .42, w, h * .16);
});
const cpuTex = tex(256, 256, (c, w, h) => {
  const g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#d4d7dd'); g.addColorStop(1, '#9ea2aa');
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  c.fillStyle = '#41444b'; c.textAlign = 'center';
  c.font = `800 62px ${FONT}`; c.fillText('AMD', w / 2, 110);
  c.font = `600 22px ${FONT}`; c.fillText('RYZEN 7 7800X3D', w / 2, 158);
});
const ssdTex = tex(700, 200, (c, w, h) => {
  c.fillStyle = '#141418'; c.fillRect(0, 0, w, h);
  c.fillStyle = '#f2f2f5'; c.font = `800 64px ${FONT}`; c.fillText('KIOXIA', 34, 92);
  c.fillStyle = '#a1a1a6'; c.font = `600 30px ${FONT}`; c.fillText('EXCERIA PLUS G3 · 1TB', 36, 150);
});
const psuSideTex = tex(256, 256, (c, w, h) => { c.fillStyle = '#121215'; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(255,255,255,.05)'; for (let x = 0; x < w; x += 6) c.fillRect(x, 0, 2, h); });
const psuLabelTex = tex(700, 400, (c, w, h) => {
  c.fillStyle = '#101013'; c.fillRect(0, 0, w, h);
  c.fillStyle = '#ececf0'; c.font = `800 120px ${FONT}`; c.fillText('XPG', 60, 170);
  c.font = `600 54px ${FONT}`; c.fillText('KYBER 750W', 62, 252);
  c.fillStyle = '#d6b15e'; c.font = `600 32px ${FONT}`; c.fillText('80 PLUS GOLD · ATX 3.1', 64, 322);
});
const logoTex = tex(512, 112, (c, w, h) => {
  c.font = `italic 800 76px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillStyle = '#ffffff'; c.fillText('MYPC', w / 2, h / 2 + 4);
});

/* ============ Bauteil-Verwaltung ============ */
const pc = new THREE.Group(); scene.add(pc);
const comps = {};
function comp(id) {
  const group = new THREE.Group(); pc.add(group);
  return comps[id] = { id, group, items: [], amt: 0, fade: 1, fadeT: 1, mats: [] };
}
// Teil mit Explosionsrichtung; win = Teilbereich innerhalb des Bauteil-Fortschritts,
// fadeOut = Teil verschwindet, während es wegfliegt (Glas, Seitenwand)
function part(c, obj, dir = [0, 0, 0], win = null, fadeOut = false) {
  c.group.add(obj);
  const it = { obj, base: obj.position.clone(), dir: new THREE.Vector3(...dir), win, fadeMats: null };
  if (fadeOut) { it.fadeMats = []; obj.traverse(o => { if (o.isMesh) it.fadeMats.push(o.material); }); }
  c.items.push(it);
  return obj;
}
const rgbList = [];
function rgbMat(k = 3, off = 0) {
  const m = new THREE.MeshStandardMaterial({ color: 0x050505, emissive: 0x8b5cf6, emissiveIntensity: k, roughness: .4 });
  rgbList.push({ m, k, off, comp: null });
  return m;
}
const rotors = [];
function fan(size, depth, off, opts = {}) {
  const g = new THREE.Group(), s = size / 2, r = s * .92;
  if (opts.frame !== false) {
    const sh = new THREE.Shape(); roundRect(sh, -s, -s, size, size, s * .12);
    const hole = new THREE.Path(); hole.absarc(0, 0, r, 0, Math.PI * 2, true); sh.holes.push(hole);
    const fg = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: false, curveSegments: 40 }); fg.translate(0, 0, -depth / 2);
    g.add(new THREE.Mesh(fg, std('#111115', { metalness: .1, roughness: .55 })));
    // Infinity-Ringe vorne und hinten
    const ring = new THREE.TorusGeometry(r * .995, size * .018, 10, 72);
    g.add(new THREE.Mesh(mergeGeometries([ring.clone().translate(0, 0, depth / 2 - .012), ring.translate(0, 0, -depth / 2 + .012)]), rgbMat(3.4, off)));
    g.add(new THREE.Mesh(new THREE.TorusGeometry(r * .86, size * .008, 8, 72), rgbMat(1.3, off + .04)));
  } else {
    g.add(new THREE.Mesh(new THREE.TorusGeometry(r, size * .03, 10, 64), std('#1a1a1f', { metalness: .4, roughness: .4 })));
  }
  const rotor = new THREE.Group();
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(s * .32, s * .32, depth * .62, 36), std('#0c0c0f', { roughness: .45 }));
  hub.rotation.x = Math.PI / 2; rotor.add(hub);
  const cap = new THREE.Mesh(new THREE.CircleGeometry(s * .2, 32), opts.frame === false ? std('#26262c', { metalness: .6, roughness: .3 }) : rgbMat(1.1, off));
  cap.position.z = depth * .31 + .002; rotor.add(cap);
  const bs = new THREE.Shape();
  bs.moveTo(-s * .1, s * .3); bs.quadraticCurveTo(s * .34, s * .46, s * .22, r * .96);
  bs.quadraticCurveTo(-s * .05, r * .9, -s * .2, s * .6); bs.quadraticCurveTo(-s * .2, s * .42, -s * .1, s * .3);
  const n = opts.blades || 7, blade = new THREE.ShapeGeometry(bs, 10).rotateY(.42), blades = [];
  for (let i = 0; i < n; i++) blades.push(blade.clone().rotateZ(i / n * Math.PI * 2));
  rotor.add(new THREE.Mesh(mergeGeometries(blades), std('#1b1b22', { metalness: 0, roughness: .32, side: THREE.DoubleSide })));
  g.add(rotor); rotors.push(rotor);
  return g;
}

/* ============ Das Modell ============
   Achsen: x = vorne(+)/hinten(-), y = oben, z = Glasseite(+) / rechte Seitenwand(-).
   Hauptkammer z -0.64…1.45, hintere Kammer (Netzteil, Kabel) z -1.45…-0.64. */

// Gehäuse (bleibt stehen)
const cCase = comp('case');
const caseMat = blackMetal();
part(cCase, box(4.5, .26, 2.9, caseMat, 0, .17, 0));
const footMat = std('#141418', { roughness: .7 });
for (const [x, z] of [[-1.95, -1.2], [1.95, -1.2], [-1.95, 1.2], [1.95, 1.2]]) {
  const f = new THREE.Mesh(new THREE.CylinderGeometry(.16, .18, .05, 24), footMat); f.position.set(x, .025, z); part(cCase, f);
}
part(cCase, box(.1, 4.04, 2.9, caseMat, -2.2, 2.32, 0));
part(cCase, box(4.4, 4.04, .04, std('#ffffff', { map: trayTex, roughness: .7, metalness: .2 }), 0, 2.32, -.64));
part(cCase, box(.06, 4.04, .78, caseMat, 2.22, 2.32, -1.04));
part(cCase, box(4.3, .025, .025, rgbMat(2.2, 0), -.03, .315, 1.38));
part(cCase, box(.025, .025, 2.0, rgbMat(2.2, .1), 2.16, .315, .38));
const logo = new THREE.Mesh(new THREE.PlaneGeometry(1.0, .22), new THREE.MeshBasicMaterial({ map: logoTex, transparent: true, depthWrite: false }));
logo.position.set(0, .17, 1.452); part(cCase, logo);
// Kabel in der hinteren Kammer und das 24-Pin-Kabel
const cableMat = std('#0b0b0d', { roughness: .8 });
for (const pts of [
  [[.24, 3.05, -.48], [.55, 3.05, -.5], [.62, 2.95, -.8], [.95, 2.1, -1.0], [1.1, 1.2, -1.0]],
  [[-1.55, 4.12, -.5], [-1.45, 4.2, -.8], [-.5, 3.9, -1.05], [.7, 2.2, -1.1], [1.0, 1.2, -1.12]],
  [[.5, 3.6, -.8], [.8, 2.8, -1.2], [1.4, 1.2, -1.2]]
]) {
  const curve = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p)));
  part(cCase, new THREE.Mesh(new THREE.TubeGeometry(curve, 40, .055, 10), cableMat));
}

// Dach mit Lochgitter
const cRoof = comp('roof');
part(cRoof, box(4.5, .12, 2.9, std('#0d0d11', { metalness: .6, roughness: .45, alphaMap: meshTex, alphaTest: .5, alphaToCoverage: true, side: THREE.DoubleSide }), 0, 4.4, 0), [0, 2.6, 0]);

// Glas: Seite und Front ohne Strebe
const cGlass = comp('glass');
const glassMat = () => new THREE.MeshStandardMaterial({ color: '#aab4d8', metalness: 0, roughness: .06, transparent: true, opacity: .1, envMapIntensity: .3, side: THREE.DoubleSide, depthWrite: false });
const gSide = new THREE.Mesh(new THREE.PlaneGeometry(4.42, 4.04), glassMat()); gSide.position.set(.03, 2.32, 1.44);
const gFront = new THREE.Mesh(new THREE.PlaneGeometry(2.08, 4.04), glassMat()); gFront.rotation.y = Math.PI / 2; gFront.position.set(2.24, 2.32, .4);
part(cGlass, gSide, [0, .3, 3.6], [0, .75], true);
part(cGlass, gFront, [3.4, .3, 0], [.25, 1], true);

// Mainboard (Anker, bleibt stehen)
const cBoard = comp('board');
part(cBoard, box(2.28, 2.85, .03, std('#ffffff', { map: pcbTex, roughness: .65, metalness: .1 }), -.88, 2.745, -.605));
part(cBoard, box(.48, .48, .03, silver(), -.95, 3.35, -.575));
part(cBoard, box(1.25, .27, .22, heatsink(), -1.1, 3.93, -.475));
part(cBoard, box(.27, 1.1, .22, heatsink(), -1.75, 3.2, -.475));
part(cBoard, box(.32, .72, .28, std('#1b1d23', { metalness: .5, roughness: .4 }), -1.86, 3.68, -.445));
for (const x of [-.445, -.36, -.275, -.19]) part(cBoard, box(.045, 1.32, .07, std('#1a1b20'), x, 3.26, -.55));
part(cBoard, box(1.05, .07, .08, silver(), -1.28, 2.38, -.545));
part(cBoard, box(.35, .06, .07, std('#1a1b20'), -1.6, 1.52, -.55));
part(cBoard, box(.5, .45, .1, heatsink(), -.35, 1.55, -.535));
part(cBoard, box(.12, .6, .14, std('#111114'), .17, 3.05, -.52));
part(cBoard, box(.3, .1, .12, std('#111114'), -1.6, 4.1, -.53));

// Prozessor
const cCpu = comp('cpu');
const chip = new THREE.Group(); chip.position.set(-.95, 3.35, -.56);
chip.add(box(.42, .42, .015, std('#1f3b2b', { roughness: .6 }), 0, 0, -.01));
chip.add(box(.36, .36, .035, std('#ffffff', { map: cpuTex, metalness: .8, roughness: .42 }), 0, 0, .012));
part(cCpu, chip, [0, .25, 1.9]);

// CPU-Kühler: Lamellenturm mit zwei ARGB-Lüftern (Push-Pull)
const cCool = comp('cooler');
const K = new THREE.Group(); K.position.set(-.95, 3.35, .16);
const finMat = t => std('#ffffff', { map: t, metalness: .7, roughness: .4 });
const coolTop = blackMetal();
K.add(new THREE.Mesh(new THREE.BoxGeometry(.5, 1.15, 1.42), [finMat(finU), finMat(finU), finMat(finV), finMat(finV), coolTop, coolTop]));
const pipeMat = std('#1d1e22', { metalness: .9, roughness: .3 });
for (const y of [-.42, -.14, .14, .42]) {
  const p = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, .1, 16), pipeMat); p.rotation.x = Math.PI / 2; p.position.set(0, y, .76); K.add(p);
}
K.add(box(.46, .46, .06, std('#2a2b30', { metalness: .9, roughness: .3 }), 0, 0, -.69));
for (const sx of [1, -1]) {
  const f = fan(1.12, .25, sx > 0 ? .5 : .6); f.rotation.y = sx * Math.PI / 2; f.position.set(sx * .375, 0, .02); K.add(f);
}
part(cCool, K, [0, .55, 3.4]);

// Arbeitsspeicher
const cRam = comp('ram');
[-.36, -.19].forEach((x, i) => {
  const st = new THREE.Group(); st.position.set(x, 3.26, -.37);
  st.add(new THREE.Mesh(new THREE.BoxGeometry(.075, 1.26, .38), std('#ffffff', { map: ramTex, metalness: .65, roughness: .38 })));
  st.add(box(.07, 1.2, .07, rgbMat(1.7, .2 + i * .15), 0, 0, .225));
  part(cRam, st, [i ? .18 : -.18, .45, 2.3]);
});

// SSD (M.2)
const cSsd = comp('ssd');
const ssd = new THREE.Group(); ssd.position.set(-.95, 2.6, -.575);
ssd.add(box(.78, .2, .02, std('#0f1a14', { roughness: .6 })));
const ssdLabel = new THREE.Mesh(new THREE.PlaneGeometry(.62, .17), std('#ffffff', { map: ssdTex, roughness: .5, metalness: 0 }));
ssdLabel.position.set(.05, 0, .0115); ssd.add(ssdLabel);
part(cSsd, ssd, [.25, .05, 1.9]);

// Grafikkarte
const cGpu = comp('gpu');
const G = new THREE.Group(); G.position.set(-.66, 2.09, .03);
const shroud = std('#16161b', { metalness: .55, roughness: .35, clearcoat: .4 });
G.add(new THREE.Mesh(new THREE.BoxGeometry(2.85, .5, 1.18), [
  shroud, shroud, std('#ffffff', { map: backplateTex, metalness: .7, roughness: .35 }), shroud,
  std('#ffffff', { map: gpuSideTex, metalness: .5, roughness: .35, clearcoat: .4 }), shroud
]));
[-.95, 0, .95].forEach((x, i) => {
  const f = fan(.86, .06, .7 + i * .05, { frame: false, blades: 9 }); f.rotation.x = Math.PI / 2; f.position.set(x, -.27, 0); G.add(f);
});
G.add(box(1.6, .035, .02, rgbMat(2.8, .35), -.35, .17, .595));
G.add(box(.04, .62, 1.32, silver(), -1.45, -.02, -.02));
G.add(box(1.0, .04, .03, std('#c8a24a', { metalness: 1, roughness: .3 }), -.6, .27, -.575));
G.add(box(.22, .08, .14, std('#111114'), 1.0, .29, .1));
part(cGpu, G, [0, .3, 2.7]);

// Lüfter: 3 an der Seite, 3 oben, 3 unten, 1 hinten
const cFans = comp('fans');
[1.32, 2.47, 3.62].forEach((y, i) => { const f = fan(1.12, .23, i * .08); f.position.set(1.45, y, -.5); part(cFans, f, [.5, 0, 2.2]); });
[-1.45, -.3, .85].forEach((x, i) => { const f = fan(1.12, .23, .3 + i * .08); f.rotation.x = Math.PI / 2; f.position.set(x, 4.225, .38); part(cFans, f, [0, 1.5, 0]); });
[-1.45, -.3, .85].forEach((x, i) => { const f = fan(1.12, .23, .6 + i * .08); f.rotation.x = -Math.PI / 2; f.position.set(x, .415, .38); part(cFans, f, [(i - 1) * .35, 0, 2.6]); });
{ const f = fan(1.12, .23, .9); f.rotation.y = Math.PI / 2; f.position.set(-2.04, 3.45, .25); part(cFans, f, [-1.8, 0, 0]); }

// Netzteil in der hinteren Kammer, davor die rechte Seitenwand
const cPsu = comp('psu');
part(cPsu, box(4.5, 4.16, .05, Object.assign(blackMetal(), { transparent: true }), 0, 2.32, -1.425), [0, 0, -3], [0, .55], true);
const P = new THREE.Group(); P.position.set(1.25, .72, -1.04);
const psuSide = std('#ffffff', { map: psuSideTex, metalness: .5, roughness: .45 });
P.add(new THREE.Mesh(new THREE.BoxGeometry(1.35, .78, .7), [psuSide, psuSide, psuSide, psuSide, psuSide, std('#ffffff', { map: psuLabelTex, metalness: .4, roughness: .45 })]));
part(cPsu, P, [.6, 0, -2.6], [.3, 1]);

// Zuordnung für Klicks, Ausblenden und RGB
const compList = Object.values(comps);
const pickables = [];
for (const c of compList) {
  const set = new Set();
  c.group.traverse(o => {
    if (!o.isMesh) return;
    o.userData.comp = c.id;
    o.castShadow = c.id !== 'glass'; o.receiveShadow = true;
    if (c.id !== 'glass') pickables.push(o);
    (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => set.add(m));
  });
  c.mats = [...set].map(m => ({ m, op: m.opacity, tr: m.transparent, dw: m.depthWrite }));
  for (const e of rgbList) if (set.has(e.m)) e.comp = c;
}

/* ============ Boden, Glow, Luftstrom ============ */
const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.ShadowMaterial({ opacity: .6 }));
floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
const glowMat = new THREE.MeshBasicMaterial({ map: radialTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: .5 });
const glow = new THREE.Mesh(new THREE.PlaneGeometry(13, 13), glowMat);
glow.rotation.x = -Math.PI / 2; glow.position.y = .004; scene.add(glow);

const AIR = 380;
const airPos = new Float32Array(AIR * 3), airCol = new Float32Array(AIR * 3);
const airGeo = new THREE.BufferGeometry();
airGeo.setAttribute('position', new THREE.BufferAttribute(airPos, 3));
airGeo.setAttribute('color', new THREE.BufferAttribute(airCol, 3));
const airMat = new THREE.PointsMaterial({ size: .22, map: radialTex, vertexColors: true, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
const air = new THREE.Points(airGeo, airMat); air.frustumCulled = false; air.visible = false; scene.add(air);
const cold = new THREE.Color('#38bdf8'), warm = new THREE.Color('#fb7185'), tmpC = new THREE.Color(), fv = new THREE.Vector3();
const flowAt = p => {
  if (p.y > 3.85) return fv.set(-.1, 1, 0);                       // oben raus
  if (p.x < -1.55 && p.y > 2.75) return fv.set(-1, .2, 0);         // hinten raus
  if (p.y < .9 && p.x < 1) return fv.set(-.05, 1, .05);            // Bodenlüfter drücken hoch
  return fv.set(-.6, .55, p.z < .25 ? .55 : -.05).normalize();     // Seitenlüfter: quer durch den PC
};
const airParts = Array.from({ length: AIR }, () => ({ p: new THREE.Vector3(), age: 0, life: 1, sp: 1 }));
function airSpawn(a) {
  if (Math.random() < .5) a.p.set(rr(-1.9, 1.35), .55, rr(-.15, .9)); else a.p.set(rr(.95, 1.95), rr(.8, 3.9), -.32);
  a.life = rr(2.2, 3.6); a.sp = rr(.9, 1.5); a.age = 0;
}
function airStep(a, dt) {
  a.p.addScaledVector(flowAt(a.p), a.sp * dt); a.age += dt;
  if (a.age > a.life || a.p.y > 4.9 || a.p.x < -2.6) airSpawn(a);
}
airParts.forEach(a => { airSpawn(a); const n = Math.random() * 100; for (let k = 0; k < n; k++) airStep(a, 1 / 30); });

/* ============ Zustand ============ */
let mode = 'story', pS = 0, time = 0;
let explodeT = 0, explodeTarget = 0;
let powerOn = true, power = 1, glassOn = true, glassVis = 1, airOn = false, airVis = 0;
let selected = null, fly = null, hoverEvt = null, down = null, framing = 0, lastExplode = 0;
const RGB = { mypc: '#8b5cf6', cyan: '#22d3ee', rot: '#ef4444', gruen: '#22c55e', weiss: '#e5e7eb', regenbogen: null };
let rgbMode = 'mypc';
const rgbColor = new THREE.Color(RGB.mypc), liveColor = new THREE.Color(RGB.mypc);

// Bauteil-Fortschritt im Studio (Regler 0…1) und in der Story (Scroll 0…1)
const WIN = { glass: [0, .3], roof: [.06, .36], fans: [.14, .5], gpu: [.24, .6], cooler: [.34, .7], ram: [.44, .78], ssd: [.52, .84], psu: [.4, .86], cpu: [.62, .95] };
const STORY = { glass: [.07, .13], gpu: [.21, .27], cooler: [.35, .41], cpu: [.38, .43], ram: [.48, .53], ssd: [.5, .55], fans: [.61, .66], roof: [.61, .66], psu: [.73, .79] };
// Kamera-Einstellungen der Story: von, bis, Winkel, Neigung, Abstand, Ziel xyz, Bildgröße, Versatz x/y (Desktop), Versatz y und Größenfaktor (Handy)
const SHOTS = [
  [0,   .06,  .62, 1.30, 26.0,  0.00, 2.20,  0.00,  5.8,  0,   -.27, -.27, 1.5],
  [.13, .21,  .98, 1.24, 15.5,  0.30, 2.25,  0.90,  8.0, -.17,  0,    .14, 1],
  [.26, .34,  .95, 1.15, 11.5, -0.60, 2.20,  1.60,  6.0, -.17,  0,    .14, 1],
  [.40, .48, -.32, 1.02, 10.5, -0.95, 3.45,  1.70,  5.2, -.17,  0,    .14, 1],
  [.53, .61,  .48, 1.06, 10.0, -0.45, 3.15,  1.30,  4.9, -.17,  0,    .14, 1],
  [.65, .73, 1.05, 1.18, 17.0,  0.20, 2.70,  0.90,  8.5, -.17,  0,    .14, 1],
  [.77, .85, 1.95, 1.12, 13.0,  1.30, 1.30, -1.90,  7.0, -.17,  0,    .14, 1],
  [.92, 1,    .72, 1.12, 22.0,  0.30, 2.80,  0.90, 11.5, -.12,  0,    .1,  1]
];
function shot(p) {
  let i = 0; while (i < SHOTS.length - 1 && p >= SHOTS[i + 1][0]) i++;
  const a = SHOTS[i];
  if (i === SHOTS.length - 1 || p <= a[1]) return a;
  const b = SHOTS[i + 1], k = ss(a[1], b[0], p);
  return a.map((v, j) => j < 2 ? v : j === 2 ? v + wrap(b[2] - v) * k : v + (b[j] - v) * k);
}
const cur = { az: SHOTS[0][2], pol: SHOTS[0][3], dist: SHOTS[0][4], t: new THREE.Vector3(SHOTS[0][5], SHOTS[0][6], SHOTS[0][7]), ox: 0, oy: SHOTS[0][10] };

function storyProgress() {
  const total = scrolly.offsetHeight - innerHeight;
  return total > 0 ? Math.min(1, Math.max(0, -scrolly.getBoundingClientRect().top / total)) : 0;
}
function applyOffset(ox, oy) {
  const w = stage.clientWidth, h = stage.clientHeight;
  if (Math.abs(ox) < .001 && Math.abs(oy) < .001) { if (camera.view && camera.view.enabled) camera.clearViewOffset(); }
  else camera.setViewOffset(w, h, ox * w, oy * h, w, h);
}
function storyCamera(dt, snap = false) {
  const s = shot(pS), narrow = stage.clientWidth < 900;
  const amp = reduced ? 0 : .04 + .22 * (1 - ss(0, .06, pS));
  const az = s[2] + Math.sin(time * .22) * amp;
  const vfov = THREE.MathUtils.degToRad(camera.fov), hfov = 2 * Math.atan(Math.tan(vfov / 2) * camera.aspect);
  const size = s[8] * (narrow ? s[12] : 1);
  const dist = Math.max(s[4], (size / 2) / Math.tan(Math.min(vfov, hfov) / 2) * 1.08);
  const k = snap ? 1 : Math.min(1, dt * 3.5);
  cur.az += wrap(az - cur.az) * k; cur.pol += (s[3] - cur.pol) * k; cur.dist += (dist - cur.dist) * k;
  cur.t.x += (s[5] - cur.t.x) * k; cur.t.y += (s[6] - cur.t.y) * k; cur.t.z += (s[7] - cur.t.z) * k;
  cur.ox += ((narrow ? 0 : s[9]) - cur.ox) * k; cur.oy += ((narrow ? s[11] : s[10]) - cur.oy) * k;
  const sp = Math.sin(cur.pol);
  camera.position.set(cur.t.x + cur.dist * sp * Math.sin(cur.az), cur.t.y + cur.dist * Math.cos(cur.pol), cur.t.z + cur.dist * sp * Math.cos(cur.az));
  camera.lookAt(cur.t);
  applyOffset(cur.ox, cur.oy);
}

/* ============ Studio-Oberfläche ============ */
const INFO = {
  gpu:    { kind: 'Grafikkarte', name: 'NVIDIA RTX 5070', spec: '12 GB Grafikspeicher · PCIe x16', text: 'Berechnet jedes Bild, das du siehst. Ihre Lüfter sitzen auf der Unterseite und holen sich frische Luft von den Bodenlüftern.' },
  cpu:    { kind: 'Prozessor', name: 'AMD Ryzen 7 7800X3D', spec: '8 Kerne · 16 Threads · 3D V-Cache', text: 'Das Gehirn des PCs. Der zusätzliche 3D V-Cache macht ihn zu einem Prozessor, der für Spiele gebaut ist.' },
  cooler: { kind: 'CPU-Kühler', name: 'ARCTIC Freezer 36 Black ARGB', spec: 'Tower-Kühler · 2 ARGB-Lüfter (Push-Pull)', text: 'Heatpipes leiten die Wärme vom Prozessor in die Lamellen, zwei Lüfter pusten sie weg.' },
  ram:    { kind: 'Arbeitsspeicher', name: '32 GB DDR5-6000 CL30', spec: '2 × 16 GB · Patriot Viper Venom RGB', text: 'Das EXPO-Profil ist schon aktiviert, damit der Speicher mit voller Geschwindigkeit läuft.' },
  board:  { kind: 'Mainboard', name: 'B650 GAMING X AX V2', spec: 'Sockel AM5 · DDR5', text: 'Verbindet alle Teile miteinander. Das aktuelle BIOS ist bei Lieferung schon aufgespielt.' },
  ssd:    { kind: 'SSD', name: '1 TB KIOXIA EXCERIA PLUS G3', spec: 'NVMe · Lesen 5.000 MB/s · Schreiben 3.900 MB/s', text: 'Hier liegt Windows 11 Pro, schon installiert und aktiviert.' },
  psu:    { kind: 'Netzteil', name: 'ADATA XPG KYBER 750 W', spec: 'ATX 3.1 · 80+ Gold', text: 'Versorgt alle Teile mit Strom und sitzt unsichtbar in der hinteren Kammer hinter der Seitenwand.' },
  fans:   { kind: 'Lüfter', name: '10 × KRUX Corvus ARGB', spec: '6 × Reverse · 4 × Regular', text: 'Im 3D-Modell: drei unten, drei an der Seite, drei oben, einer hinten. Die Lüfterkurven stellt MYPC vor dem Versand ein.' },
  case:   { kind: 'Gehäuse', name: 'KRUX Atron, schwarz', spec: 'Panoramaglas · zwei Kammern', text: 'Glasfront und Glasseite treffen sich ohne Strebe. Netzteil und Kabel verschwinden in der hinteren Kammer.' }
};
const ALIAS = { roof: 'case', glass: 'case' };
const ui = {
  parts: $('st-parts'), info: $('st-info'), slider: $('st-explode'), power: $('st-power'),
  glass: $('st-glass'), air: $('st-air'), spin: $('st-spin'), tip: $('tip'), toast: $('toast'), help: $('st-help')
};
ui.parts.innerHTML = Object.entries(INFO).map(([id, v]) => `<button class="part-btn" data-part="${id}" aria-pressed="false"><i></i>${v.kind}</button>`).join('');
ui.parts.addEventListener('click', e => { const b = e.target.closest('[data-part]'); if (b) select(selected === b.dataset.part ? null : b.dataset.part); });

function select(id) {
  selected = id;
  for (const c of compList) c.fadeT = !id || (ALIAS[c.id] || c.id) === id ? 1 : .1;
  ui.parts.querySelectorAll('[data-part]').forEach(b => b.setAttribute('aria-pressed', b.dataset.part === id));
  if (!id) { ui.info.hidden = true; return; }
  const v = INFO[id];
  $('info-kind').textContent = v.kind; $('info-name').textContent = v.name; $('info-spec').textContent = v.spec; $('info-text').textContent = v.text;
  ui.info.hidden = false;
  if (mode === 'studio') focusOn(id);
}
$('info-close').addEventListener('click', () => select(null));

const tmpBox = new THREE.Box3(), tmpV = new THREE.Vector3(), tmpT = new THREE.Vector3();
const partsOf = id => compList.filter(c => (ALIAS[c.id] || c.id) === id);
function boxOf(id) { tmpBox.makeEmpty(); partsOf(id).forEach(c => tmpBox.expandByObject(c.group)); return tmpBox; }
function focusOn(id) {
  const b = boxOf(id);
  startFly(b.getCenter(new THREE.Vector3()), THREE.MathUtils.clamp(b.getSize(tmpV).length() * 1.45 + 2.4, 5, 26), null, id);
}
// id: Bauteil, dem das Ziel folgt, solange es sich noch bewegt
function startFly(to, d1, dir1 = null, id = null) {
  fly = { t: 0, from: controls.target.clone(), to, d0: camera.position.distanceTo(controls.target), d1, dir0: camera.position.clone().sub(controls.target).normalize(), dir1, id };
}

const setPressed = (el, on) => el.setAttribute('aria-pressed', on);
function setPower(on) { powerOn = on; setPressed(ui.power, on); }
function setGlass(on) { glassOn = on; setPressed(ui.glass, on); }
function setAir(on) { airOn = on; setPressed(ui.air, on); }
function setSpin(on) { controls.autoRotate = on; setPressed(ui.spin, on); }
function setRgb(name) {
  rgbMode = name; if (RGB[name]) rgbColor.set(RGB[name]);
  document.querySelectorAll('#st-rgb .sw').forEach(b => setPressed(b, b.dataset.rgb === name));
}
setRgb('mypc');
ui.power.addEventListener('click', () => setPower(!powerOn));
ui.glass.addEventListener('click', () => setGlass(!glassOn));
ui.air.addEventListener('click', () => setAir(!airOn));
ui.spin.addEventListener('click', () => setSpin(!controls.autoRotate));
$('st-rgb').addEventListener('click', e => { const b = e.target.closest('[data-rgb]'); if (b) setRgb(b.dataset.rgb); });
ui.slider.addEventListener('input', () => { explodeTarget = explodeT = +ui.slider.value; });
$('st-reset').addEventListener('click', resetStudio);
$('st-close').addEventListener('click', closeStudio);
const toggleHelp = on => { ui.help.hidden = !on; };
$('st-help-btn').addEventListener('click', () => toggleHelp(ui.help.hidden));
$('st-help-close').addEventListener('click', () => toggleHelp(false));

function resetStudio() {
  explodeTarget = 0; select(null); setGlass(true); setAir(false); setPower(true); setRgb('mypc'); setSpin(false);
  startFly(new THREE.Vector3(0, 2.2, 0), 15, new THREE.Vector3(Math.sin(.62), .27, Math.cos(.62)).normalize());
}

function openStudio() {
  if (mode === 'studio') return;
  mode = 'studio';
  stage.classList.add('studio'); document.documentElement.classList.add('lock');
  $('studio-ui').setAttribute('aria-hidden', 'false');
  controls.target.copy(cur.t); controls.enabled = true; controls.update();
  explodeTarget = explodeT = Math.min(1, Math.max(0, (pS - .06) / .75));
  ui.slider.value = explodeT;
  setGlass(true); setAir(false); setPower(true); setSpin(false); select(null);
  try { if (stage.requestFullscreen && !document.fullscreenElement) stage.requestFullscreen().catch(() => {}); } catch (e) { /* Vollbild nicht erlaubt: bleibt als Overlay */ }
  ui.toast.classList.add('on'); setTimeout(() => ui.toast.classList.remove('on'), 3800);
  resize(); kick();
}
function closeStudio() {
  if (mode !== 'studio') return;
  mode = 'story'; select(null); toggleHelp(false); fly = null;
  stage.classList.remove('studio'); document.documentElement.classList.remove('lock');
  $('studio-ui').setAttribute('aria-hidden', 'true');
  controls.enabled = false; controls.autoRotate = false;
  ui.tip.style.opacity = 0; canvas.classList.remove('pick');
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  // Story-Kamera übernimmt den aktuellen Blickwinkel und gleitet zurück
  const off = camera.position.clone().sub(controls.target);
  cur.t.copy(controls.target); cur.dist = off.length(); cur.pol = Math.acos(off.y / cur.dist); cur.az = Math.atan2(off.x, off.z);
  resize();
}
document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && mode === 'studio') closeStudio(); });
document.addEventListener('click', e => { if (e.target.closest('[data-open-studio]')) { e.preventDefault(); openStudio(); } });

addEventListener('keydown', e => {
  if (mode !== 'studio' || e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key.toLowerCase();
  if (k === 'escape') { if (!ui.help.hidden) toggleHelp(false); else if (selected) select(null); else closeStudio(); }
  else if (k === 'e') explodeTarget = explodeT > .5 ? 0 : 1;
  else if (k === 'p') setPower(!powerOn);
  else if (k === 'r') { const names = Object.keys(RGB); setRgb(names[(names.indexOf(rgbMode) + 1) % names.length]); }
  else if (k === 'g') setGlass(!glassOn);
  else if (k === 'l') setAir(!airOn);
  else if (k === 'd') setSpin(!controls.autoRotate);
  else if (k === '0') resetStudio();
  else return;
  e.preventDefault();
});

// Klicken und Zeigen
const raycaster = new THREE.Raycaster(), ndc = new THREE.Vector2();
function pick(x, y) {
  const r = canvas.getBoundingClientRect();
  ndc.set((x - r.left) / r.width * 2 - 1, -(y - r.top) / r.height * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  const hit = raycaster.intersectObjects(pickables, false).find(h => {
    const m = Array.isArray(h.object.material) ? h.object.material[0] : h.object.material;
    return h.object.visible && (m.userData.k ?? 1) > .3;
  });
  return hit ? (ALIAS[hit.object.userData.comp] || hit.object.userData.comp) : null;
}
canvas.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY }; });
canvas.addEventListener('pointerup', e => {
  if (mode !== 'studio' || !down) return;
  if (Math.hypot(e.clientX - down.x, e.clientY - down.y) < 6) { const id = pick(e.clientX, e.clientY); select(id === selected ? null : id); }
  down = null;
});
canvas.addEventListener('pointermove', e => { if (mode === 'studio' && e.pointerType === 'mouse') hoverEvt = e; });
canvas.addEventListener('pointerleave', () => { hoverEvt = null; ui.tip.style.opacity = 0; canvas.classList.remove('pick'); });

/* ============ Animation ============ */
function update(dt) {
  pS += (storyProgress() - pS) * Math.min(1, dt * 6);
  if (Math.abs(explodeTarget - explodeT) > .0005) { explodeT += (explodeTarget - explodeT) * Math.min(1, dt * 4); if (mode === 'studio') ui.slider.value = explodeT; }
  power += ((powerOn ? 1 : 0) - power) * Math.min(1, dt * (powerOn ? 1.6 : 2.4));
  const glassTarget = mode === 'studio' ? (glassOn ? 1 : 0) : 1 - ss(.15, .21, pS);
  glassVis += (glassTarget - glassVis) * Math.min(1, dt * 6);
  const airTarget = mode === 'studio' ? (airOn ? 1 : 0) : ss(.6, .64, pS) * (1 - ss(.74, .77, pS));
  airVis += (airTarget - airVis) * Math.min(1, dt * 4);

  // Zerlegen
  for (const c of compList) {
    const w = mode === 'studio' ? WIN[c.id] : STORY[c.id];
    const tgt = w ? ss(w[0], w[1], mode === 'studio' ? explodeT : pS) : 0;
    const before = c.amt;
    c.amt += (tgt - c.amt) * Math.min(1, dt * 7); c.tgt = tgt;
    if (Math.abs(c.amt - before) > 1e-4) renderer.shadowMap.needsUpdate = true;
    for (const it of c.items) {
      const a = it.win ? ss(it.win[0], it.win[1], c.amt) : c.amt;
      it.obj.position.copy(it.base).addScaledVector(it.dir, a);
      if (it.fadeMats) for (const m of it.fadeMats) m.userData.k = 1 - ss(.45, 1, a);
    }
    // Ausblenden, wenn ein anderes Teil ausgewählt ist
    c.fade += (c.fadeT - c.fade) * Math.min(1, dt * 8);
    const g = c.id === 'glass' ? glassVis : 1;
    for (const e of c.mats) {
      const o = e.op * c.fade * g * (e.m.userData.k ?? 1);
      e.m.opacity = o;
      const tr = e.tr || o < .999;
      if (e.m.transparent !== tr) { e.m.transparent = tr; e.m.needsUpdate = true; }
      e.m.depthWrite = e.dw && o >= .999;
    }
    if (c.id === 'glass') c.group.visible = g > .01;
  }

  // Lüfter und RGB
  const spin = power * 11 * dt;
  for (const r of rotors) r.rotation.z -= spin;
  if (rgbMode === 'regenbogen') liveColor.setHSL((time * .06) % 1, .85, .55); else liveColor.lerp(rgbColor, Math.min(1, dt * 6));
  for (const e of rgbList) {
    if (rgbMode === 'regenbogen') e.m.emissive.setHSL((time * .06 + e.off) % 1, .85, .55); else e.m.emissive.copy(liveColor);
    e.m.emissiveIntensity = e.k * power * (e.comp ? e.comp.fade : 1);
  }
  // Innenbeleuchtung nur im zusammengebauten PC, sonst blendet sie auf den ausgebauten Teilen
  const apart = mode === 'studio' ? explodeT : ss(.07, .6, pS);
  for (const l of inner) { l.color.copy(liveColor); l.intensity = 7 * power * (1 - .85 * apart); }
  glowMat.color.copy(liveColor); glowMat.opacity = .5 * power;

  // Luftstrom
  air.visible = airVis > .01;
  if (air.visible) {
    for (let i = 0; i < AIR; i++) {
      const a = airParts[i]; airStep(a, dt * (.4 + .6 * power));
      airPos[i * 3] = a.p.x; airPos[i * 3 + 1] = a.p.y; airPos[i * 3 + 2] = a.p.z;
      tmpC.copy(cold).lerp(warm, Math.min(1, a.age / a.life * 1.2));
      airCol[i * 3] = tmpC.r; airCol[i * 3 + 1] = tmpC.g; airCol[i * 3 + 2] = tmpC.b;
    }
    airGeo.attributes.position.needsUpdate = true; airGeo.attributes.color.needsUpdate = true;
    airMat.opacity = airVis * .9;
  }

  // Kamera
  if (mode === 'studio') {
    if (fly) {
      fly.t = Math.min(1, fly.t + dt / .9);
      if (fly.id) boxOf(fly.id).getCenter(fly.to);
      const k = easeInOut(fly.t);
      const dir = camera.position.clone().sub(controls.target).normalize();
      if (fly.dir1) dir.copy(fly.dir0).lerp(fly.dir1, k).normalize();
      controls.target.lerpVectors(fly.from, fly.to, k);
      camera.position.copy(controls.target).addScaledVector(dir, THREE.MathUtils.lerp(fly.d0, fly.d1, k));
      if (fly.t >= 1) fly = null;
    } else if (selected && partsOf(selected).some(c => Math.abs((c.tgt ?? 0) - c.amt) > .002)) {
      // ausgewähltes Teil fährt noch: Kamera gleitet mit
      boxOf(selected).getCenter(tmpT).sub(controls.target).multiplyScalar(Math.min(1, dt * 5));
      controls.target.add(tmpT); camera.position.add(tmpT);
    }
    if (Math.abs(explodeT - lastExplode) > 1e-4) framing = .6;
    lastExplode = explodeT;
    if (framing > 0 && !fly && !selected) {
      framing -= dt;
      const want = (15 + explodeT * 9) * Math.max(1, Math.pow(1.25 / camera.aspect, .8));
      const k = Math.min(1, dt * 2.5), off = camera.position.clone().sub(controls.target);
      controls.target.y += (2.2 + explodeT * .7 - controls.target.y) * k;
      off.setLength(off.length() + (want - off.length()) * k);
      camera.position.copy(controls.target).add(off);
    }
    controls.update();
    // freie Fläche zwischen Bauteil-Liste und Infokarte als Bildmitte nutzen
    const sr = stage.getBoundingClientRect(), wide = sr.width >= 820;
    let oxT = 0, oyT = 0;
    if (wide) {
      const left = ui.parts.getBoundingClientRect().right - sr.left;
      const right = ui.info.hidden ? 0 : sr.right - ui.info.getBoundingClientRect().left;
      oxT = (right - left) / 2 / sr.width;
    } else oyT = selected ? .17 : .08;
    cur.ox += (oxT - cur.ox) * Math.min(1, dt * 5); cur.oy += (oyT - cur.oy) * Math.min(1, dt * 5);
    applyOffset(cur.ox, cur.oy);
    if (hoverEvt && !down) {
      const id = pick(hoverEvt.clientX, hoverEvt.clientY);
      canvas.classList.toggle('pick', !!id);
      if (id) {
        const r = stage.getBoundingClientRect();
        ui.tip.textContent = INFO[id].kind;
        ui.tip.style.transform = `translate(${hoverEvt.clientX - r.left + 14}px, ${hoverEvt.clientY - r.top + 14}px)`;
      }
      ui.tip.style.opacity = id ? 1 : 0;
      hoverEvt = null;
    }
  } else {
    storyCamera(dt);
  }
}

function resize() {
  const w = stage.clientWidth, h = stage.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false); composer.setSize(w, h);
  camera.aspect = w / h; camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(stage);
resize();

let running = false, inView = true, ready = false;
const clock = new THREE.Clock();
// wird es ruckelig, sinkt die Auflösung schrittweise; als letzte Stufe fällt der Glow weg
let slow = 0;
function adapt(raw) {
  if (raw > .25) return; // Ruckler durch Tab-Wechsel o. Ä. nicht mitzählen
  slow = raw > 1 / 24 ? slow + raw : Math.max(0, slow - raw * .5);
  if (slow < 1.2) return;
  slow = 0;
  if (quality > .75) { quality = Math.max(.75, quality - .25); renderer.setPixelRatio(quality); composer.setPixelRatio(quality); resize(); }
  else bloom.enabled = false;
}
function loop() {
  if (!(inView || mode === 'studio') || document.hidden) { running = false; return; }
  requestAnimationFrame(loop);
  const raw = clock.getDelta(), dt = Math.min(raw, .05); time += dt;
  update(dt);
  composer.render();
  if (ready) adapt(raw);
  if (!ready) { ready = true; stage.classList.add('ready'); document.body.classList.add('three-ready'); }
}
function kick() { if (!running) { running = true; clock.getDelta(); requestAnimationFrame(loop); } }
new IntersectionObserver(([e]) => { inView = e.isIntersecting; if (inView) kick(); }, { rootMargin: '200px' }).observe(scrolly);
document.addEventListener('visibilitychange', () => { if (!document.hidden) kick(); });

pS = storyProgress();
storyCamera(0, true);
renderer.shadowMap.needsUpdate = true;
kick();
