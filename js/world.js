// Builds the bar: courtyard (exterior) + interior, from Milly's floorplan.
// Coordinates: x = across (left -, right +), y = up, z = -distance from the street edge.
// Distances (d) are in metres from the street edge; world z = -d.
import * as THREE from './three.module.js';

export const LAYOUT = {
  width: 12.8,            // x from -6.4 to 6.4
  courtyardEnd: 13,       // shopfront wall
  door: { x: -1.1, w: 3.0 },
  booths: [ [13.75, 16.5], [19.3, 22.05], [24.75, 27.5] ], // left side, x -5.6..-2.6
  bar: { x0: 2.9, x1: 5.9, d0: 18.75, d1: 29.75 },
  smoking: { x0: 0.75, x1: 5.6, d0: 5.25, d1: 12.25 },
  dance: { x0: -5.4, x1: 5.6, d0: 33.25, d1: 41.5 },
  dj: { x0: -1.5, x1: 1.5, d0: 42, d1: 43.5 },
  end: 44.75,
  char2: { x: 0, d: 41.2 },
};

const W = LAYOUT.width / 2;
const z = (d) => -d;

// ---------- helpers ----------
function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.85, metalness: 0, ...opts });
}
function glow(color) { return new THREE.MeshBasicMaterial({ color }); }

// box spanning x0..x1, y0..y1, d0..d1
function box(parent, x0, x1, y0, y1, d0, d1, material) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(d1 - d0)), material);
  m.position.set((x0 + x1) / 2, (y0 + y1) / 2, -(d0 + d1) / 2);
  parent.add(m);
  return m;
}

function canvasTex(w, h, draw, repeat) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  return t;
}

// ---------- textures ----------
function tileTex(base, line, rx, ry) {
  return canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    g.strokeStyle = line; g.lineWidth = 3; g.strokeRect(1.5, 1.5, w - 3, h - 3);
  }, [rx, ry]);
}
function concreteTex() {
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#8c8c90'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) {
      const v = 100 + Math.random() * 40 | 0;
      g.fillStyle = `rgba(${v},${v},${v - 4},0.35)`;
      g.fillRect(Math.random() * w, Math.random() * h, 3, 3);
    }
  }, [4, 4]);
}
function stripeTex(cols, n) {
  return canvasTex(512, 64, (g, w, h) => {
    for (let i = 0; i < n; i++) { g.fillStyle = cols[i % cols.length]; g.fillRect(i * w / n, 0, w / n + 1, h); }
  });
}
function signTex(text, sub) {
  return canvasTex(1024, 192, (g, w, h) => {
    g.fillStyle = '#f4f1ea'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#c9342f';
    g.font = 'bold 78px "Comic Sans MS", "Chalkboard SE", sans-serif';
    g.textAlign = 'center'; g.fillText(text, w / 2, 92);
    g.fillStyle = '#1f2d5a'; g.font = 'bold 62px "Comic Sans MS", "Chalkboard SE", sans-serif';
    g.fillText(sub, w / 2, 168);
  });
}
function windowTex() {
  // lit shop window with bunting flags
  return canvasTex(256, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#ffb35c'); gr.addColorStop(1, '#ff6f61');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    const flags = ['#d62828', '#2a9d8f', '#f4d35e', '#3a86ff', '#ffffff', '#06d6a0', '#ef476f'];
    for (let i = 0; i < 8; i++) { g.fillStyle = flags[i % flags.length]; g.fillRect(i * 32 + 2, 8, 28, 22); }
    for (let i = 0; i < 70; i++) {               // fairy lights
      g.fillStyle = ['#fff6c0', '#ff9ff3', '#7bf1ff'][i % 3];
      g.beginPath(); g.arc(Math.random() * w, 50 + Math.random() * (h - 60), 2.2, 0, 7); g.fill();
    }
    g.fillStyle = 'rgba(255,240,90,0.85)'; g.fillRect(20, 110, 120, 110); // yellow poster
    g.fillStyle = '#222'; g.font = 'bold 22px sans-serif'; g.fillText('DUMPLINGS', 28, 170);
  });
}
function woodTex(c1, c2) {
  return canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = c1; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 16) { g.fillStyle = c2; g.fillRect(0, y, w, 2); }
    for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(0,0,0,0.08)'; g.fillRect(Math.random() * w, Math.random() * h, 20, 1); }
  }, [2, 1]);
}

// ---------- people ----------
const SKIN = ['#f1c7a5', '#d9a07a', '#a8714f', '#7a4b33', '#e8b896'];
const TOPS = ['#2b2d42', '#8d99ae', '#ef476f', '#118ab2', '#073b4c', '#6a4c93', '#e9c46a', '#264653', '#f4a261', '#ffffff', '#3d405b'];
const LEGS = ['#22223b', '#4a4e69', '#2f3e46', '#5c4033', '#1b263b'];
const HAIR = ['#1b1b1b', '#3b2416', '#6f4e37', '#c69c6d', '#8b2e16'];
const pick = (a) => a[Math.random() * a.length | 0];

export function makePerson({ top = pick(TOPS), legs = pick(LEGS), skin = pick(SKIN), hair = pick(HAIR), height = 1.62 + Math.random() * 0.22, drink = Math.random() < 0.4 } = {}) {
  const p = new THREE.Group();
  const s = height / 1.75;
  const legM = mat(legs), topM = mat(top), skinM = mat(skin), hairM = mat(hair);
  // body sits in its own group so it can bob/sway; limbs pivot at hips/shoulders
  const body = new THREE.Group(); p.add(body);
  const legPivots = [];
  for (const side of [-1, 1]) {
    const hip = new THREE.Group(); hip.position.set(side * 0.1, 0.86, 0);
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.85, 0.17), legM);
    leg.position.y = -0.43; hip.add(leg); body.add(hip); legPivots.push(hip);
  }
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.62, 6), topM);
  torso.position.y = 1.14; body.add(torso);
  const arms = [];
  for (const side of [-1, 1]) {
    const sh = new THREE.Group(); sh.position.set(side * 0.29, 1.4, 0);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.58, 0.11), topM);
    arm.position.y = -0.28; sh.add(arm);
    sh.rotation.z = side * 0.12; body.add(sh); arms.push(sh);
  }
  const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.15, 0), skinM);
  head.position.y = 1.6; body.add(head);
  const hairM2 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16, 0), hairM);
  hairM2.position.set(0, 1.65, 0.03); hairM2.scale.set(1, 0.7, 1); body.add(hairM2);
  let glass = null;
  if (drink) {
    arms[1].rotation.x = 1.1;
    glass = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.038, 0.14, 6), mat('#f6b93b', { transparent: true, opacity: 0.9, emissive: '#7a4a00', emissiveIntensity: 0.3 }));
    glass.position.set(0, -0.6, 0); arms[1].add(glass);
  }
  // soft blob shadow
  const sh = new THREE.Mesh(new THREE.CircleGeometry(0.32, 10), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false }));
  sh.rotation.x = -Math.PI / 2; sh.position.y = 0.012; p.add(sh);
  p.scale.setScalar(s);
  p.userData = { arms, legs: legPivots, body, glass, phase: Math.random() * 10 };
  return p;
}

// ---------- character 2 ----------
// Football-style shirt: black base with brushy red / blue / purple / pink camo strokes
// (pattern only, no crests or sponsor logos).
function shirtTex() {
  return canvasTex(512, 256, (g, w, h) => {
    g.fillStyle = '#141018'; g.fillRect(0, 0, w, h);
    const cols = ['#d7263d', '#2340c8', '#8e4fc9', '#e86ac8', '#d7263d', '#2340c8'];
    for (let i = 0; i < 46; i++) {
      g.fillStyle = cols[i % cols.length];
      g.globalAlpha = 0.75 + Math.random() * 0.25;
      g.beginPath();
      const x = Math.random() * w, y = Math.random() * h, len = 60 + Math.random() * 140, th = 14 + Math.random() * 26;
      g.moveTo(x, y);
      g.bezierCurveTo(x + len * 0.3, y - th, x + len * 0.7, y + th, x + len, y + (Math.random() - 0.5) * th);
      g.lineTo(x + len, y + th);
      g.bezierCurveTo(x + len * 0.6, y + th * 1.6, x + len * 0.3, y + th * 0.4, x, y + th);
      g.fill();
    }
    g.globalAlpha = 1;
  });
}
function haloTex() {
  return canvasTex(128, 128, (g, w, h) => {
    const r = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    r.addColorStop(0, 'rgba(255,247,220,0.9)');
    r.addColorStop(0.45, 'rgba(255,230,170,0.35)');
    r.addColorStop(1, 'rgba(255,220,150,0)');
    g.fillStyle = r; g.fillRect(0, 0, w, h);
  });
}

export function makeCharacter2() {
  const p = new THREE.Group();
  const body = new THREE.Group(); p.add(body);   // everything that dances
  const lift = { emissive: '#fff2d6', emissiveIntensity: 0.06 };       // slight inner glow
  const skinM = mat('#e8b896', lift), hairM = mat('#5a3825', lift);
  const shirtM = mat('#ffffff', { map: shirtTex(), emissive: '#ffffff', emissiveIntensity: 0.35, emissiveMap: null });
  shirtM.emissiveMap = shirtM.map;  // shirt glows in its own colours instead of washing out
  const collarM = mat('#141018', lift);
  const skirtM = mat('#fbf8f2', { emissive: '#fff6e6', emissiveIntensity: 0.22 });

  // long white skirt, flared, down to the ankles
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.36, 0.86, 12), skirtM);
  skirt.position.y = 0.5; body.add(skirt);
  for (const side of [-1, 1]) {                                           // shoes peeking out
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.07, 0.2), mat('#f2f2f2', lift));
    shoe.position.set(side * 0.09, 0.035, -0.03); body.add(shoe);
  }
  // shirt (torso + short sleeves), slightly fitted
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.6, 10), shirtM);
  torso.position.y = 1.2; body.add(torso);
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.018, 4, 10), collarM);
  collar.rotation.x = Math.PI / 2; collar.position.y = 1.5; body.add(collar);
  const arms = [];
  for (const side of [-1, 1]) {
    const arm = new THREE.Group();
    const sleeve = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.22, 0.12), shirtM);
    sleeve.position.y = -0.1; arm.add(sleeve);
    const fore = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.36, 0.08), skinM);
    fore.position.y = -0.38; arm.add(fore);
    arm.position.set(side * 0.25, 1.46, 0);
    arm.rotation.z = side * 0.12;
    body.add(arm); arms.push(arm);
  }
  // head + long hair
  const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.14, 1), skinM);
  head.position.y = 1.68; body.add(head);
  const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(0.15, 1), hairM);
  crown.position.set(0, 1.72, 0.03); crown.scale.set(1.02, 0.85, 1); body.add(crown);
  for (const side of [-1, 1]) {                                           // eyes
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.03, 0.02), mat('#2a1a12'));
    eye.position.set(side * 0.05, 1.7, -0.13); body.add(eye);
  }
  const smile = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.012, 0.02), mat('#a8434a'));
  smile.position.set(0, 1.62, -0.135); body.add(smile);
  const long = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.42, 0.1), hairM);
  long.position.set(0, 1.48, 0.1); body.add(long);

  // halo of light around her (additive sprite)
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex(), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.55 }));
  halo.scale.set(1.9, 2.4, 1); halo.position.y = 1.05; p.add(halo);
  const glowLight = new THREE.PointLight('#fff1d0', 1.2, 2.5, 1.5);
  glowLight.position.set(0, 1.3, -0.5); p.add(glowLight);

  const sh = new THREE.Mesh(new THREE.CircleGeometry(0.34, 12), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.25, depthWrite: false }));
  sh.rotation.x = -Math.PI / 2; sh.position.y = 0.012; p.add(sh);

  p.userData = { arms, halo, body };
  return p;
}

// Dance loop for character 2 (t in seconds): sway hips, bob, arms up in turn.
export function danceCharacter2(c2, t) {
  const { arms, body, halo } = c2.userData;
  const beat = t * Math.PI * 2 * 1.05;            // ~126 bpm sway
  body.rotation.z = Math.sin(beat / 2) * 0.09;
  body.position.y = Math.abs(Math.sin(beat)) * 0.05;
  body.rotation.y = Math.sin(beat / 4) * 0.25;
  arms[0].rotation.z = -(2.3 + Math.sin(beat / 2) * 0.5);
  arms[1].rotation.z = 2.3 - Math.sin(beat / 2 + 1.4) * 0.5;
  arms[0].rotation.x = Math.sin(beat) * 0.2;
  arms[1].rotation.x = -Math.sin(beat) * 0.2;
  halo.material.opacity = 0.5 + Math.sin(beat / 2) * 0.08;
}

// Simple idle/dance/walk animation for crowd members.
export function animatePerson(p, t, mode = 'idle', amount = 1) {
  const u = p.userData; const ph = u.phase + t;
  if (mode === 'dance') {
    u.body.position.y = Math.abs(Math.sin(ph * 6.6)) * 0.06 * amount;
    u.body.rotation.z = Math.sin(ph * 3.3) * 0.12 * amount;
    u.arms[0].rotation.z = -(1.9 + Math.sin(ph * 3.3) * 0.7);
    if (!u.glass) u.arms[1].rotation.z = 1.9 + Math.sin(ph * 3.3 + 1.6) * 0.7;
    u.legs[0].rotation.x = Math.sin(ph * 6.6) * 0.2; u.legs[1].rotation.x = -Math.sin(ph * 6.6) * 0.2;
  } else if (mode === 'walk') {
    const s = Math.sin(ph * 8) * 0.5 * amount;
    u.legs[0].rotation.x = s; u.legs[1].rotation.x = -s;
    u.arms[0].rotation.x = -s * 0.8; if (!u.glass) u.arms[1].rotation.x = s * 0.8;
    u.body.position.y = Math.abs(Math.cos(ph * 8)) * 0.03 * amount;
  } else {
    u.body.rotation.z = Math.sin(ph * 1.3) * 0.03;
    u.body.rotation.y = Math.sin(ph * 0.7) * 0.08;
  }
}

function place(parent, obj, x, d, faceDeg = 0) {
  obj.position.set(x, obj.position.y, z(d));
  obj.rotation.y = THREE.MathUtils.degToRad(faceDeg);
  parent.add(obj);
  return obj;
}

// ---------- festoon lights ----------
function festoon(parent, strands, colours) {
  const pts = [];
  for (const [a, b, sag, n] of strands) {
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const p = new THREE.Vector3().lerpVectors(a, b, t);
      p.y -= Math.sin(t * Math.PI) * sag;
      pts.push(p);
    }
    // wire
    const curve = [];
    for (let i = 0; i <= 20; i++) { const t = i / 20; const p = new THREE.Vector3().lerpVectors(a, b, t); p.y -= Math.sin(t * Math.PI) * sag; curve.push(p); }
    parent.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve), new THREE.LineBasicMaterial({ color: 0x1a1a1a })));
  }
  const inst = new THREE.InstancedMesh(new THREE.SphereGeometry(0.05, 6, 4), new THREE.MeshBasicMaterial(), pts.length);
  const m = new THREE.Matrix4(); const c = new THREE.Color();
  pts.forEach((p, i) => { m.makeTranslation(p.x, p.y - 0.06, p.z); inst.setMatrixAt(i, m); inst.setColorAt(i, c.set(colours[i % colours.length])); });
  parent.add(inst);
}

// ---------- plants ----------
function wisteria(parent, x, d, top, len) {
  const g = new THREE.Group();
  const leafM = mat('#4f8a3a'), flowerM = mat('#6f4fc0'), flowerM2 = mat('#9a7be0');
  const vine = new THREE.Mesh(new THREE.BoxGeometry(0.03, len, 0.03), mat('#3c6b2c'));
  vine.position.y = top - len / 2; g.add(vine);
  for (let i = 0; i < 9; i++) {
    const y = top - 0.15 - (i / 9) * len * 0.9;
    const f = new THREE.Mesh(new THREE.IcosahedronGeometry(0.09 + Math.random() * 0.05, 0), i % 2 ? flowerM : flowerM2);
    f.position.set((Math.random() - 0.5) * 0.18, y, (Math.random() - 0.5) * 0.18); g.add(f);
    const l = new THREE.Mesh(new THREE.TetrahedronGeometry(0.08, 0), leafM);
    l.position.set((Math.random() - 0.5) * 0.3, y + 0.05, (Math.random() - 0.5) * 0.3); g.add(l);
  }
  g.position.set(x, 0, z(d)); parent.add(g);
}
function planter(parent, x, y, d) {
  box(parent, x - 0.25, x + 0.25, y, y + 0.22, d - 0.15, d + 0.15, mat('#f2c230'));
  for (let i = 0; i < 6; i++) {
    const l = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.3, 4), mat('#5a9a3a'));
    l.position.set(x - 0.18 + i * 0.07, y + 0.36, z(d) + (Math.random() - 0.5) * 0.15);
    l.rotation.z = (Math.random() - 0.5) * 0.6; parent.add(l);
  }
}
function palm(parent, x, y, d) {
  const g = new THREE.Group();
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.17, 0.35, 7), mat('#2e8b57'));
  pot.position.y = 0.17; g.add(pot);
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.6, 5), mat('#6b4f2a'));
  trunk.position.y = 0.6; g.add(trunk);
  const leafM = mat('#4c8c3c');
  for (let i = 0; i < 9; i++) {
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.75, 3), leafM);
    const a = (i / 9) * Math.PI * 2;
    leaf.position.set(Math.cos(a) * 0.25, 0.95, Math.sin(a) * 0.25);
    leaf.rotation.set(Math.sin(a) * 1.1, 0, -Math.cos(a) * 1.1);
    g.add(leaf);
  }
  g.position.set(x, y, z(d)); parent.add(g);
}

// =====================================================================
export function buildWorld(scene) {
  const world = new THREE.Group(); scene.add(world);
  const L = LAYOUT;

  // ---------------- STREET ----------------
  box(world, -12, 12, -0.05, 0, -8, 0, mat('#3a3a40'));
  box(world, -12, 12, 0, 0.08, -0.4, 0, mat('#9a9a96')); // kerb

  // ---------------- COURTYARD ----------------
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(L.width, L.courtyardEnd), mat('#ffffff', { map: concreteTex() }));
  ground.rotation.x = -Math.PI / 2; ground.position.set(0, 0.01, z(L.courtyardEnd / 2)); world.add(ground);
  box(world, L.door.x - 0.6, L.door.x + 0.6, 0.01, 0.03, 0.6, L.courtyardEnd, mat('#b3212b')); // red carpet

  // left turquoise pallet wall + kiosk
  const teal = mat('#3fe0d0'), tealDark = mat('#22bfb0');
  for (let y = 0.1; y < 2.4; y += 0.22) box(world, -W, -W + 0.12, y, y + 0.16, 0, L.courtyardEnd, teal);
  for (let d = 0.5; d < L.courtyardEnd; d += 1.2) box(world, -W + 0.12, -W + 0.2, 0, 2.4, d, d + 0.12, tealDark);
  // kiosk: a pallet booth jutting in from the left, near the door (like the photo)
  const kx0 = -W, kx1 = -3.4;
  for (let y = 0.05; y < 1.05; y += 0.17) box(world, kx0, kx1, y, y + 0.12, 8.6, 8.75, teal);  // front face (slats)
  box(world, kx1 - 0.12, kx1, 0, 1.1, 8.6, 12.6, tealDark);
  box(world, kx0, kx1 + 0.15, 1.05, 1.12, 8.5, 12.6, mat('#7be0d4'));   // counter top
  box(world, kx1 - 0.1, kx1, 1.1, 2.6, 8.6, 8.7, mat('#e04f3f'));        // red post
  const kSign = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.55), mat('#ffffff', { map: signTex('DUMPLING', 'HATCH') }));
  kSign.position.set(-4.6, 2.05, z(8.55)); world.add(kSign);
  box(world, kx0, kx1, 1.7, 1.78, 8.5, 12.6, mat('#e8b04b')); // awning lights
  for (let i = 0; i < 3; i++) planter(world, -W + 0.4 + i * 1.0, 0.55, 8.4);
  for (let d = 2; d < 8; d += 2.4) planter(world, -W + 0.45, 0.9, d);

  // right: brick-ish wall
  box(world, W - 0.2, W, 0, 3.4, 0, L.courtyardEnd, mat('#a65e4b'));
  // smoking area: raised deck with turquoise railing + picnic tables
  const S = L.smoking;
  box(world, S.x0, S.x1 + 0.6, 0, 0.3, S.d0, S.d1 + 0.6, mat('#8a8a8a'));
  const rail = mat('#6fe0d2');
  for (let d = S.d0; d <= S.d1; d += 1.4) box(world, S.x0, S.x0 + 0.1, 0, 1.3, d, d + 0.1, rail);
  box(world, S.x0, S.x0 + 0.1, 1.2, 1.32, S.d0, S.d1 + 0.1, rail);
  box(world, S.x0, S.x0 + 0.1, 0.75, 0.82, S.d0, S.d1 + 0.1, rail);
  box(world, S.x0, S.x1, 1.2, 1.32, S.d0, S.d0 + 0.1, rail);
  const plank = mat('#b48a5a');
  for (const d of [6.4, 9.6]) {
    box(world, 2.3, 4.8, 1.0, 1.08, d, d + 1.6, plank);              // table top
    box(world, 2.3, 4.8, 0.65, 0.72, d - 0.45, d - 0.2, plank);       // bench
    box(world, 2.3, 4.8, 0.65, 0.72, d + 1.8, d + 2.05, plank);
    for (const x of [2.5, 4.6]) box(world, x, x + 0.08, 0.3, 1.0, d + 0.7, d + 0.9, plank);
  }

  // roof: wooden beams + translucent corrugated panels
  const beam = mat('#a8693a');
  for (let d = 0.6; d < L.courtyardEnd; d += 1.6) box(world, -W, W, 3.25, 3.4, d, d + 0.16, beam);
  for (const x of [-3, 0, 3]) box(world, x - 0.05, x + 0.05, 3.3, 3.45, 0, L.courtyardEnd, mat('#8c8c8c'));
  const roof = new THREE.Mesh(new THREE.PlaneGeometry(L.width, L.courtyardEnd),
    new THREE.MeshStandardMaterial({ color: '#e9eef2', transparent: true, opacity: 0.55, side: THREE.DoubleSide, emissive: '#3b4a6b', emissiveIntensity: 0.5 }));
  roof.rotation.x = Math.PI / 2; roof.position.set(0, 3.5, z(L.courtyardEnd / 2)); world.add(roof);
  // wooden post by the smoking area
  box(world, S.x0 + 0.5, S.x0 + 0.65, 0.3, 3.3, S.d1 - 0.2, S.d1, beam);

  // festoon lights zig-zagging across
  const strands = [];
  for (let d = 1.4; d < L.courtyardEnd - 0.5; d += 1.6) {
    strands.push([new THREE.Vector3(-W + 0.3, 3.15, z(d)), new THREE.Vector3(W - 0.3, 3.15, z(d + 0.8)), 0.45, 18]);
  }
  festoon(world, strands, ['#ff4d4d', '#5dff7a', '#ffb347', '#6ea8ff', '#fff3b0']);

  // wisteria + vines hanging from beams
  for (const [x, d, len] of [[-2.6, 5.0, 1.3], [-0.4, 5.2, 0.9], [0.4, 8.2, 1.0], [-3.6, 10.5, 0.8], [1.6, 3.3, 1.1], [-1.8, 2.0, 0.7], [0.0, 11.3, 0.6]]) {
    wisteria(world, x, d, 3.25, len);
  }

  // ---------------- SHOPFRONT (courtyard end) ----------------
  const F = L.courtyardEnd, dx0 = L.door.x - L.door.w / 2, dx1 = L.door.x + L.door.w / 2;
  const facade = mat('#efece4');
  box(world, -W, dx0, 0, 3.3, F, F + 0.3, facade);
  box(world, dx1, W, 0, 3.3, F, F + 0.3, facade);
  box(world, dx0, dx1, 2.45, 3.3, F, F + 0.3, facade);
  // lit windows
  const winM = new THREE.MeshBasicMaterial({ map: windowTex() });
  for (const [x0, x1] of [[-W + 0.4, dx0 - 0.4], [dx1 + 0.4, W - 0.4]]) {
    const w = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, 1.7), winM);
    w.position.set((x0 + x1) / 2, 1.55, z(F) + 0.01); world.add(w);
    box(world, x0 - 0.06, x1 + 0.06, 0.65, 0.7, F - 0.06, F, mat('#ffffff'));
  }
  // sign over the door (placeholder name)
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.6), mat('#ffffff', { map: signTex('MARKET ROAD BAR', '( No. 49 )'), emissive: '#ffffff', emissiveIntensity: 0.25, emissiveMap: null }));
  sign.position.set(L.door.x, 2.8, z(F) + 0.02); world.add(sign);
  // red door frame + open doors
  const red = mat('#c0392b');
  box(world, dx0, dx0 + 0.12, 0, 2.45, F - 0.05, F + 0.35, red);
  box(world, dx1 - 0.12, dx1, 0, 2.45, F - 0.05, F + 0.35, red);
  box(world, dx0, dx1, 2.33, 2.45, F - 0.05, F + 0.35, red);
  for (const side of [-1, 1]) {
    const door = new THREE.Group();
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(L.door.w / 2 - 0.1, 2.2, 0.05), mat('#b03028'));
    leaf.position.x = -side * (L.door.w / 4 - 0.05); door.add(leaf);
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(L.door.w / 2 - 0.4, 1.6), new THREE.MeshStandardMaterial({ color: '#9fc7d6', transparent: true, opacity: 0.4 }));
    glass.position.set(-side * (L.door.w / 4 - 0.05), 0.1, 0.03); door.add(glass);
    door.position.set(side < 0 ? dx0 + 0.12 : dx1 - 0.12, 1.1, z(F) + 0.05);
    door.rotation.y = side * -1.25; door.position.x += side * 0; world.add(door);
  }
  box(world, dx0 + 0.1, dx1 - 0.1, 0.01, 0.025, F - 0.6, F + 0.4, mat('#2b2b2b')); // door mat

  // ---------------- INTERIOR ----------------
  const ID0 = F + 0.3, ID1 = L.end, IH = 2.9;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(L.width, ID1 - ID0), mat('#ffffff', { map: tileTex('#d8c3a0', '#b59f7c', 16, 40) }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0.005, z((ID0 + ID1) / 2)); world.add(floor);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(L.width, ID1 - ID0), mat('#ffffff', { map: tileTex('#5a3a2a', '#3a2418', 10, 24) }));
  ceil.rotation.x = Math.PI / 2; ceil.position.set(0, IH, z((ID0 + ID1) / 2)); world.add(ceil);
  box(world, -W - 0.2, -W, 0, IH, ID0, ID1, mat('#7a2e2a'));           // left wall, deep red
  box(world, W, W + 0.2, 0, IH, ID0, ID1, mat('#6b3a28'));             // right wall, brown
  box(world, -W, W, 0, IH, ID1, ID1 + 0.2, mat('#2a1f3d'));            // back wall
  // wainscot
  box(world, -W, -W + 0.05, 0, 1.0, ID0, ID1, mat('#4a2a1c'));
  box(world, W - 0.05, W, 0, 1.0, ID0, ID1, mat('#4a2a1c'));
  // ceiling panel lights
  for (let d = ID0 + 1.5; d < L.dance.d0; d += 3.2)
    for (const x of [-3.2, 0.2]) box(world, x - 0.5, x + 0.5, IH - 0.03, IH - 0.01, d, d + 0.5, glow('#ffe7b0'));

  // booths (left)
  const wood = mat('#ffffff', { map: woodTex('#8a5a33', '#5e3b1f') });
  const seat = mat('#2f8f83');
  for (const [d0, d1] of L.booths) {
    box(world, -5.6, -2.6, 0, 0.45, d0, d0 + 0.6, seat); box(world, -5.6, -2.6, 0.45, 1.25, d0, d0 + 0.18, seat);
    box(world, -5.6, -2.6, 0, 0.45, d1 - 0.6, d1, seat); box(world, -5.6, -2.6, 0.45, 1.25, d1 - 0.18, d1, seat);
    box(world, -5.4, -2.9, 0.72, 0.78, d0 + 0.8, d1 - 0.8, wood);
    box(world, -4.2, -4.0, 0, 0.72, (d0 + d1) / 2 - 0.1, (d0 + d1) / 2 + 0.1, mat('#3a2a1a'));
    // warm wall lamp
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), glow('#ffcf7a'));
    lamp.position.set(-W + 0.25, 1.8, z((d0 + d1) / 2)); world.add(lamp);
    const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.08, 6), glow('#ffb347'));
    candle.position.set(-4.15, 0.83, z((d0 + d1) / 2)); world.add(candle);
  }

  // bar counter (right)
  const B = L.bar;
  const barWood = mat('#ffffff', { map: woodTex('#a07444', '#6e4b29') });
  box(world, B.x0, B.x0 + 0.6, 0, 1.08, B.d0, B.d1, barWood);
  box(world, B.x0, B.x1 - 0.4, 0, 1.08, B.d0, B.d0 + 0.6, barWood);
  box(world, B.x0, B.x1 - 0.4, 0, 1.08, B.d1 - 0.6, B.d1, barWood);
  box(world, B.x0 - 0.1, B.x0 + 0.7, 1.08, 1.14, B.d0 - 0.1, B.d1 + 0.1, mat('#3fb5a8')); // teal top like the photo
  box(world, B.x0 + 0.02, B.x0 + 0.06, 0.15, 0.2, B.d0, B.d1, mat('#c9a227'));             // brass foot rail
  for (const d of [B.d0 + 0.8, B.d0 + 5.5, B.d1 - 0.9]) palm(world, B.x0 + 0.3, 1.14, d);
  // back bar: shelves + bottles
  box(world, W - 0.45, W - 0.05, 0, 1.0, B.d0, B.d1, mat('#4a2e1c'));
  for (const y of [1.45, 1.9]) {
    box(world, W - 0.4, W - 0.05, y, y + 0.04, B.d0, B.d1, mat('#5a3a22'));
    for (let d = B.d0 + 0.3; d < B.d1; d += 0.28) {
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.3, 6), glow(pick(['#2e7d32', '#b8860b', '#8e2430', '#4fc3f7', '#e0c080'])));
      b.position.set(W - 0.22, y + 0.19, z(d)); world.add(b);
    }
  }
  box(world, W - 0.08, W - 0.04, 1.3, 2.3, B.d0, B.d1, glow('#ff9e5e')); // warm backlight strip
  // pendant globe lamps over the bar
  for (let d = B.d0 + 1; d < B.d1; d += 2.2) {
    const cord = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.6, 0.01), mat('#111'));
    cord.position.set(B.x0 + 0.3, IH - 0.3, z(d)); world.add(cord);
    const g = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 8), glow('#ffd18a'));
    g.position.set(B.x0 + 0.3, IH - 0.7, z(d)); world.add(g);
  }
  // stools
  for (let d = B.d0 + 0.6; d < B.d1; d += 1.0) {
    box(world, B.x0 - 0.45, B.x0 - 0.39, 0, 0.72, d - 0.03, d + 0.03, mat('#222'));
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.06, 8), mat('#c0392b'));
    top.position.set(B.x0 - 0.42, 0.75, z(d)); world.add(top);
  }

  // dance floor
  const D = L.dance;
  const df = new THREE.Mesh(new THREE.PlaneGeometry(D.x1 - D.x0, D.d1 - D.d0),
    mat('#ffffff', { map: stripeTex(['#e63946', '#f1faee', '#1d3557', '#f1faee'], 24), emissive: '#ffffff', emissiveIntensity: 0.08 }));
  df.rotation.x = -Math.PI / 2; df.position.set((D.x0 + D.x1) / 2, 0.02, z((D.d0 + D.d1) / 2)); world.add(df);
  // disco ball
  const ball = new THREE.Mesh(new THREE.IcosahedronGeometry(0.32, 1), new THREE.MeshStandardMaterial({ color: '#dfe6ee', metalness: 0.9, roughness: 0.15, flatShading: true, emissive: '#555a66' }));
  ball.position.set(0, IH - 0.55, z((D.d0 + D.d1) / 2)); world.add(ball);
  box(world, -0.01, 0.01, IH - 0.25, IH, (D.d0 + D.d1) / 2 - 0.01, (D.d0 + D.d1) / 2 + 0.01, mat('#111'));
  // light sparkles on walls
  for (let i = 0; i < 60; i++) {
    const s = new THREE.Mesh(new THREE.CircleGeometry(0.04 + Math.random() * 0.04, 6), glow(pick(['#ffffff', '#ff8fd1', '#8fe9ff', '#fff59d'])));
    const side = Math.random() < 0.5 ? -1 : 1;
    s.position.set(side * (W - 0.01), 0.8 + Math.random() * 1.9, z(D.d0 - 3 + Math.random() * (D.d1 - D.d0 + 5)));
    s.rotation.y = -side * Math.PI / 2; world.add(s);
  }

  // DJ booth
  const J = L.dj;
  box(world, J.x0, J.x1, 0, 1.05, J.d0, J.d1, mat('#1d1d24'));
  box(world, J.x0 + 0.05, J.x1 - 0.05, 0.4, 0.75, J.d0 - 0.01, J.d0, glow('#ff3fa4'));   // glowing front panel
  box(world, J.x0 - 0.1, J.x1 + 0.1, 1.05, 1.1, J.d0 - 0.1, J.d1, mat('#2a2a33'));
  for (const x of [-0.9, 0.9]) {
    const deck = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.03, 12), mat('#111')); deck.position.set(x, 1.13, z(J.d0 + 0.5)); world.add(deck);
  }
  box(world, -0.25, 0.25, 1.1, 1.38, J.d0 + 0.4, J.d0 + 0.42, glow('#bfe3ff')); // laptop
  for (const x of [J.x0 - 0.8, J.x1 + 0.3]) box(world, x, x + 0.5, 0, 1.6, J.d0, J.d0 + 0.5, mat('#141414')); // speakers
  // neon strip on back wall
  box(world, -4, 4, 2.2, 2.26, ID1 - 0.05, ID1, glow('#7a5cff'));
  box(world, -4, 4, 2.4, 2.46, ID1 - 0.05, ID1, glow('#ff4fa3'));

  // ---------------- LIGHTS ----------------
  scene.add(new THREE.HemisphereLight('#9fb6ff', '#3a2a22', 0.55));
  const dusk = new THREE.DirectionalLight('#ffd6a8', 0.6); dusk.position.set(-6, 10, 4); scene.add(dusk);
  const warm = (c, i, x, y, d, r) => { const l = new THREE.PointLight(c, i, r, 1.6); l.position.set(x, y, z(d)); scene.add(l); };
  warm('#ffb46b', 14, -1, 2.8, 4, 12);     // courtyard festoon glow
  warm('#ffb46b', 12, -1, 2.8, 10, 10);
  warm('#ffae5c', 12, -1, 1.8, 13.8, 7);   // spill from doorway
  warm('#ff9a4d', 16, 0, 2.5, 18, 11);     // interior
  warm('#ffa35c', 16, 2, 2.5, 25, 11);
  warm('#ff5ec4', 18, -3, 2.5, 36, 10);    // dance floor colours
  warm('#5ec8ff', 18, 3, 2.5, 39, 10);
  warm('#ffcf8a', 22, 0, 2.4, 40.2, 6);      // soft key on character 2

  return { world, ball };
}

// ---------- crowd for the style frames (gameplay will place its own) ----------
export function addCrowd(scene) {
  const g = new THREE.Group(); scene.add(g);
  const L = LAYOUT;
  // courtyard smokers + people
  place(g, makePerson(), 2.0, 7.8, 200);
  place(g, makePerson(), 3.6, 8.4, 150);
  place(g, makePerson({ drink: true }), -3.2, 6.2, 60);
  place(g, makePerson(), -0.2, 9.4, 170);
  place(g, makePerson(), 1.3, 11.6, 230);
  // interior: bar queue, booths, standers
  for (let d = 19.5; d < 29; d += 1.5) place(g, makePerson({ drink: Math.random() < 0.5 }), 2.2 + Math.random() * 0.3, d + Math.random() * 0.4, -80 + Math.random() * 40);
  place(g, makePerson(), -1.6, 18.0, 30);
  place(g, makePerson({ drink: true }), 0.6, 23.0, 200);
  place(g, makePerson(), -0.8, 26.5, 120);
  place(g, makePerson(), 1.2, 30.5, 180);
  place(g, makePerson(), -2.4, 31.5, 90);
  // dancers
  for (let i = 0; i < 12; i++) {
    const x = L.dance.x0 + 0.6 + Math.random() * (L.dance.x1 - L.dance.x0 - 1.2);
    const d = L.dance.d0 + 0.5 + Math.random() * (L.dance.d1 - L.dance.d0 - 2.5);
    if (Math.abs(x) < 1.4) continue;
    const p = place(g, makePerson(), x, d, Math.random() * 360);
    animatePerson(p, Math.random() * 3, 'dance');
  }
  // character 2: waiting by the DJ booth, glowing softly
  const c2 = place(g, makeCharacter2(), L.char2.x, L.char2.d, 180);
  danceCharacter2(c2, 0.4);
  // soft pool of light so she stands out
  const pool = new THREE.Mesh(new THREE.CircleGeometry(0.9, 20), new THREE.MeshBasicMaterial({ color: '#fff0c8', transparent: true, opacity: 0.35, depthWrite: false }));
  pool.rotation.x = -Math.PI / 2; pool.position.set(L.char2.x, 0.03, z(L.char2.d)); g.add(pool);
  return { crowd: g, char2: c2 };
}
