// Game loop: auto-run, tap left/right to change lane, bumps, timer, ending.
import * as THREE from './three.module.js';
import { buildWorld, makePerson, makeCharacter2, danceCharacter2, animatePerson, LAYOUT } from './world.js';
import { LEVEL1, laneX } from './level1.js';
import { Obstacles } from './obstacles.js';

const LV = LEVEL1;
const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);

// ---------- renderer / scene ----------
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
$('game').appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, 1, 0.05, 80);
const fog = new THREE.Fog('#2b3561', 25, 60);
scene.fog = fog;
scene.background = new THREE.Color('#2b3561');
const SKY_OUT = new THREE.Color('#2b3561'), SKY_IN = new THREE.Color('#1a1020');
const FOG_OUT = new THREE.Color('#2b3561'), FOG_IN = new THREE.Color('#2a1610');

const { ball } = buildWorld(scene);

// background crowd
const decor = [];
for (const [x, d, face, pose] of LV.decor) {
  const p = makePerson({ drink: pose === 'seat' ? false : undefined });
  const s = p.scale.y;
  let y = (x > 0.75 && d > 5.25 && d < 12.85) ? 0.3 : 0;      // up on the smoking deck
  if (pose === 'seat') {
    const seatH = d > 13.3 ? 0.45 : 0.72;
    y = seatH - 0.86 * s;
    p.userData.legs.forEach((l) => (l.rotation.x = 1.45));
  }
  p.position.set(x, y, -d);
  p.rotation.y = THREE.MathUtils.degToRad(face);
  p.userData.pose = pose; p.userData.d = d;
  scene.add(p); decor.push(p);
}

// character 2, dancing by the DJ booth
const c2 = makeCharacter2();
c2.position.set(LAYOUT.char2.x, 0, -LAYOUT.char2.d);
c2.rotation.y = Math.PI;
scene.add(c2);
const pool = new THREE.Mesh(new THREE.CircleGeometry(0.9, 20), new THREE.MeshBasicMaterial({ color: '#fff0c8', transparent: true, opacity: 0.35, depthWrite: false }));
pool.rotation.x = -Math.PI / 2; pool.position.set(LAYOUT.char2.x, 0.03, -LAYOUT.char2.d); scene.add(pool);

const obstacles = new Obstacles(scene, LV);

// ---------- state ----------
const S = {
  mode: 'title', t: 0, d: 0, lane: 2, x: laneX(2, 0), elapsed: 0, penalty: 0,
  invuln: 0, knockV: 0, slip: 0, shake: 0, roll: 0, wobble: 0, endT: 0, hits: 0, splashes: 0, slips: 0,
  endShown: false, completeShown: false,
};
let best = null;
try { const v = parseFloat(localStorage.getItem('atb-best-l1')); if (v > 0) best = v; } catch (e) { /* storage unavailable */ }

function fmt(s) {
  const m = Math.floor(s / 60), r = s - m * 60;
  return `${m}:${r < 10 ? '0' : ''}${r.toFixed(1)}`;
}
function showBest() {
  const txt = best ? `Best time: ${fmt(best)}` : '';
  $('best-title').textContent = txt; $('best-final').textContent = txt;
}
showBest();
$('level-name').textContent = LV.title; $('level-sub').textContent = LV.subtitle;

function resetRun() {
  Object.assign(S, { d: params.has('d') ? parseFloat(params.get('d')) : 0, lane: 2, elapsed: 0, penalty: 0, invuln: 0, knockV: 0, slip: 0,
    shake: 0, roll: 0, wobble: 0, endT: 0, hits: 0, splashes: 0, slips: 0, endShown: false, completeShown: false });
  S.x = laneX(2, S.d);
  obstacles.reset();
  $('message').classList.add('hidden');
  $('complete').classList.add('hidden');
}

function start() {
  resetRun();
  S.mode = 'run';
  $('title').classList.add('hidden');
  $('hud').classList.remove('hidden');
  const hint = $('tap-hint'); hint.classList.remove('hidden');
  hint.style.animation = 'none'; void hint.offsetWidth; hint.style.animation = '';
}

// ---------- input ----------
function step(dir) {
  if (S.mode !== 'run' || S.slip > 0) return;
  const nl = Math.max(0, Math.min(4, S.lane + dir));
  if (nl !== S.lane) { S.lane = nl; }
  else { S.wobble = 0.12 * dir; }        // bump against the edge
}
window.addEventListener('pointerdown', (e) => {
  if (e.target.closest('button')) return;
  if (S.mode === 'title') return start();
  if (S.mode === 'run') { e.preventDefault(); step(e.clientX < window.innerWidth / 2 ? -1 : 1); }
}, { passive: false });
window.addEventListener('keydown', (e) => {
  if (e.repeat) return;
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') step(-1);
  else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') step(1);
  else if ((e.key === ' ' || e.key === 'Enter') && S.mode === 'title') start();
});
$('start').addEventListener('click', start);
$('retry').addEventListener('click', start);
document.addEventListener('gesturestart', (e) => e.preventDefault());

// ---------- feedback ----------
function popup(text, cls = '') {
  const el = document.createElement('div');
  el.className = 'popup ' + cls; el.textContent = text;
  $('popups').appendChild(el);
  setTimeout(() => el.remove(), 950);
}
let splashTimer = 0;
function splashScreen() {
  const el = $('splash'); el.classList.add('on');
  clearTimeout(splashTimer);
  splashTimer = setTimeout(() => el.classList.remove('on'), 650);
}
function buzz(ms) { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) { /* not supported */ } }

function onCollision(c) {
  if (c.type === 'hit') {
    S.penalty += LV.hitPenalty; S.hits++;
    S.knockV = 4.2; S.invuln = 1.0; S.shake = 0.35;
    popup(`+${LV.hitPenalty}s`); buzz(60);
  } else if (c.type === 'splash') {
    S.penalty += LV.hitPenalty; S.splashes++;
    S.knockV = 2.0; S.invuln = 1.0; S.shake = 0.25;
    popup(`Splash! +${LV.hitPenalty}s`); splashScreen(); buzz(80);
  } else if (c.type === 'slip') {
    S.penalty += LV.slipPenalty; S.slips++;
    const dir = S.lane === 0 ? 1 : S.lane === 4 ? -1 : (Math.random() < 0.5 ? -1 : 1);
    S.lane += dir; S.slip = 0.55; S.wobble = 0.35 * dir; S.invuln = 0.4;
    popup(`Whoa! +${LV.slipPenalty}s`, 'slip'); buzz(30);
  }
}

// ---------- camera ----------
const lookTarget = new THREE.Vector3();
const endCamFrom = new THREE.Vector3(), endLookFrom = new THREE.Vector3();
const C2_HEAD = new THREE.Vector3(LAYOUT.char2.x, 1.25, -LAYOUT.char2.d);
const ease = (k) => k * k * (3 - 2 * k);

function updateEnvironment() {
  const k = Math.min(1, Math.max(0, (S.d - 11) / 4));       // courtyard → inside
  fog.color.copy(FOG_OUT).lerp(FOG_IN, k);
  fog.near = 25 - k * 7; fog.far = 60 - k * 10;
  scene.background.copy(SKY_OUT).lerp(SKY_IN, k);
}

function updateCamera(dt) {
  if (S.mode === 'ending' || S.mode === 'done') {
    const k = ease(Math.min(1, S.endT / 1.8));
    const camTo = new THREE.Vector3(LAYOUT.char2.x, 1.5, -(LAYOUT.char2.d - 3.0));
    camera.position.lerpVectors(endCamFrom, camTo, k);
    lookTarget.lerpVectors(endLookFrom, C2_HEAD, k);
    camera.up.set(0, 1, 0);
    camera.lookAt(lookTarget);
    return;
  }
  const bob = S.mode === 'run' && S.knockV <= 0 ? Math.sin(S.d * 4.2) * 0.025 : 0;
  const sh = S.shake > 0 ? S.shake * 0.25 : 0;
  camera.position.set(S.x + (Math.random() - 0.5) * sh, 1.6 + bob + (Math.random() - 0.5) * sh, -S.d);
  lookTarget.set(laneX(2, S.d + 6) * 0.35 + S.x * 0.65, 1.42, -(S.d + 6));
  camera.lookAt(lookTarget);
  camera.rotateZ(-S.roll - S.wobble);
}

// ---------- loop ----------
const clock = new THREE.Clock();
function frame() {
  update(Math.min(clock.getDelta(), 0.05));
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

function update(dt) {
  S.t += dt;

  if (S.mode === 'run') {
    S.elapsed += dt;
    if (S.knockV > 0) { S.d -= S.knockV * dt; S.knockV = Math.max(0, S.knockV - 14 * dt); }
    else S.d += LV.speed * dt;
    S.d = Math.max(0, S.d);
    S.invuln -= dt; S.slip -= dt; S.shake = Math.max(0, S.shake - dt);
    const tx = laneX(S.lane, S.d);
    const prev = S.x;
    S.x += (tx - S.x) * (1 - Math.exp(-dt * (S.slip > 0 ? 8 : 14)));
    S.roll += (((S.x - prev) / Math.max(dt, 1e-3)) * 0.035 - S.roll) * (1 - Math.exp(-dt * 10));
    S.wobble *= Math.exp(-dt * 6);

    if (S.invuln <= 0) { const c = obstacles.collide(S.x, S.d); if (c) onCollision(c); }

    $('timer').textContent = fmt(S.elapsed + S.penalty);
    $('progress-fill').style.width = `${Math.min(100, (S.d / LV.endD) * 100)}%`;

    if (S.d >= LV.endD) {
      S.mode = 'ending'; S.endT = 0;
      endCamFrom.copy(camera.position); endLookFrom.copy(lookTarget);
      $('tap-hint').classList.add('hidden');
    }
  } else if (S.mode === 'ending' || S.mode === 'done') {
    S.endT += dt;
    if (!S.endShown && S.endT > 1.4) {
      S.endShown = true;
      $('message-text').textContent = LV.message;
      $('message').classList.remove('hidden');
    }
    if (!S.completeShown && S.endT > 4.6) {
      S.completeShown = true; S.mode = 'done';
      const total = S.elapsed + S.penalty;
      const isBest = (!best || total < best) && !params.has('d');
      if (isBest && !params.has('d')) { best = total; try { localStorage.setItem('atb-best-l1', String(total)); } catch (e) { /* ignore */ } }
      $('final-time').textContent = fmt(total);
      const bumps = S.hits + S.splashes + S.slips;
      $('final-detail').textContent = bumps === 0 ? 'Not a single bump. Smooth.' :
        `${S.hits} bump${S.hits === 1 ? '' : 's'}, ${S.splashes} splash${S.splashes === 1 ? '' : 'es'}, ${S.slips} slip${S.slips === 1 ? '' : 's'}`;
      showBest();
      if (isBest && bumps >= 0) $('best-final').textContent = `New best time!`;
      $('message').classList.add('hidden');
      $('hud').classList.add('hidden');
      $('complete').classList.remove('hidden');
    }
  }

  obstacles.update(dt, S.t, S.mode === 'title' ? 0 : S.d);
  danceCharacter2(c2, S.t);
  ball.rotation.y += dt * 0.6;
  for (const p of decor) {
    if (Math.abs(p.userData.d - S.d) > 22) continue;
    if (p.userData.pose === 'dance') animatePerson(p, S.t, 'dance', 0.8);
    else if (p.userData.pose === 'idle') animatePerson(p, S.t, 'idle');
  }

  updateEnvironment();
  updateCamera(dt);
}

function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.fov = w / h < 1.2 ? 80 : 70;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();
update(0);
if (!params.has('test')) requestAnimationFrame(frame);

// handle for automated testing
// sim(seconds, bot) advances the game in fixed 1/60 s steps; bot(S) may return -1/0/1 each step.
window.__game = {
  S, start, step, obstacles, renderer,
  render() { renderer.render(scene, camera); },
  sim(seconds, bot) {
    for (let i = 0; i < Math.round(seconds * 60); i++) {
      if (bot && S.mode === 'run') { const m = bot(S, obstacles, laneX); if (m) step(m); }
      update(1 / 60);
    }
    return { mode: S.mode, d: S.d, hits: S.hits, splashes: S.splashes, slips: S.slips, time: S.elapsed + S.penalty };
  },
};
