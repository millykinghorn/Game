// Obstacles: people in the way, spilled drinks, drinks being sloshed across the aisle.
import * as THREE from './three.module.js';
import { makePerson, animatePerson } from './world.js';
import { laneX } from './level1.js';

const HIT_X = 0.42;      // how close (sideways) counts as a bump
const HIT_D = 0.35;      // how close (forwards) counts as a bump

function splashBlob() {
  const g = new THREE.Group();
  const m = new THREE.MeshStandardMaterial({ color: '#f6b93b', emissive: '#a86400', emissiveIntensity: 0.5, transparent: true, opacity: 0.85, flatShading: true });
  for (let i = 0; i < 7; i++) {
    const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.07 + Math.random() * 0.06, 0), m);
    b.position.set((Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.25);
    g.add(b);
  }
  g.visible = false;
  return g;
}

function puddleMesh() {
  const shape = new THREE.Shape();
  const n = 9;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2, r = 0.32 + Math.random() * 0.14;
    const x = Math.cos(a) * r * 1.3, y = Math.sin(a) * r;
    i ? shape.lineTo(x, y) : shape.moveTo(x, y);
  }
  const m = new THREE.Mesh(new THREE.ShapeGeometry(shape),
    new THREE.MeshStandardMaterial({ color: '#e9a23b', emissive: '#6b3d00', emissiveIntensity: 0.35, transparent: true, opacity: 0.75, roughness: 0.1, metalness: 0.2 }));
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.035;
  return m;
}

export class Obstacles {
  constructor(scene, level) {
    this.level = level;
    this.group = new THREE.Group();
    scene.add(this.group);
    this.items = level.obstacles.map((o) => this.create(o));
  }

  create(o) {
    const it = { ...o, hit: false };
    if (o.type === 'stand' || o.type === 'walk' || o.type === 'dance') {
      it.mesh = makePerson({ drink: o.drink ?? Math.random() < 0.3 });
      it.x = laneX(o.lane ?? o.from, o.d);
      if (o.type === 'walk') { it.x0 = laneX(o.from, o.d); it.x1 = laneX(o.to, o.d); }
      if (o.type === 'dance') { it.cx = laneX(o.lane, o.d); it.range = o.range ?? 0.45; }
      it.mesh.rotation.y = o.type === 'stand' ? Math.random() * Math.PI * 2 : 0;
      it.mesh.position.set(it.x, 0, -o.d);
      this.group.add(it.mesh);
    } else if (o.type === 'puddle') {
      it.x = laneX(o.lane, o.d);
      it.mesh = puddleMesh();
      it.mesh.position.set(it.x, 0.035, -o.d);
      this.group.add(it.mesh);
    } else if (o.type === 'throw') {
      // thrower stands at the side, facing across the aisle; they wind up then slosh a drink sideways
      it.mesh = makePerson({ drink: true, top: '#e76f51' });
      it.mesh.position.set(o.x, 0, -o.d);
      it.mesh.rotation.y = o.toward > 0 ? -Math.PI / 2 : Math.PI / 2;
      this.group.add(it.mesh);
      it.blob = splashBlob();
      this.group.add(it.blob);
      it.state = 'wait'; it.t = 0;
      it.windup = 0.9; it.flySpeed = 4.8;
      // start early enough that the splash crosses the aisle just as the player arrives
      const crossTime = Math.abs(laneX(2, o.d) - o.x) / it.flySpeed;
      it.trigger = o.d - level_speed(this.level) * (it.windup + crossTime) - 0.6;
    }
    return it;
  }

  reset() {
    for (const it of this.items) {
      it.hit = false;
      if (it.type === 'throw') {
        it.state = 'wait'; it.t = 0; it.blob.visible = false;
        it.mesh.userData.arms[1].rotation.set(1.1, 0, 0.12);
        if (it.mesh.userData.glass) it.mesh.userData.glass.visible = true;
        if (it.splat) { this.group.remove(it.splat); it.splat = null; }
      }
    }
  }

  // advance animations; playerD lets throwers react to the player
  update(dt, t, playerD) {
    for (const it of this.items) {
      const near = Math.abs(it.d - playerD) < 25;    // skip far-off animation work
      switch (it.type) {
        case 'stand':
          if (near) animatePerson(it.mesh, t, 'idle');
          break;
        case 'walk': {
          const k = 0.5 - 0.5 * Math.cos((t / it.period) * Math.PI * 2 + (it.d % 3));
          const nx = it.x0 + (it.x1 - it.x0) * k;
          const dir = Math.sign(nx - it.x) || 1;
          it.x = nx;
          it.mesh.position.x = nx;
          it.mesh.rotation.y = dir > 0 ? -Math.PI / 2 : Math.PI / 2;
          if (near) animatePerson(it.mesh, t, 'walk');
          break;
        }
        case 'dance': {
          it.x = it.cx + Math.sin(t * 1.3 + it.d) * it.range;
          it.mesh.position.x = it.x;
          it.mesh.rotation.y = Math.sin(t * 0.9 + it.d) * 1.2;
          if (near) animatePerson(it.mesh, t, 'dance');
          break;
        }
        case 'throw': this.updateThrow(it, dt, playerD); break;
      }
    }
  }

  updateThrow(it, dt, playerD) {
    const arm = it.mesh.userData.arms[1];
    const glass = it.mesh.userData.glass;
    if (it.state === 'wait') {
      animatePerson(it.mesh, it.d, 'idle');
      if (playerD >= it.trigger && playerD < it.d) { it.state = 'windup'; it.t = 0; }
    } else if (it.state === 'windup') {
      it.t += dt;
      const k = Math.min(1, it.t / it.windup);
      arm.rotation.x = 1.1 + k * 1.6;                  // raise the glass up overhead
      glass.material.emissiveIntensity = 0.3 + Math.abs(Math.sin(it.t * 14)) * 0.9; // warning flash
      if (it.t >= it.windup) {
        it.state = 'fly'; it.t = 0;
        glass.visible = false;
        it.blob.visible = true;
        it.bx = it.x0b = it.mesh.position.x + it.toward * 0.4;
      }
    } else if (it.state === 'fly') {
      it.t += dt;
      arm.rotation.x = Math.max(1.1, arm.rotation.x - dt * 8);
      it.bx = it.x0b + it.toward * it.flySpeed * it.t;
      const span = Math.abs(laneX(it.toward > 0 ? 4 : 0, it.d) - it.x0b) + 0.6;
      const k = Math.min(1, (it.flySpeed * it.t) / span);
      it.blob.position.set(it.bx, 1.4 - k * k * 1.0 + Math.sin(k * Math.PI) * 0.35, -it.d);
      it.blob.rotation.z += dt * 6;
      if (k >= 1) {
        it.state = 'done'; it.blob.visible = false;
        it.splat = puddleMesh(); it.splat.position.set(it.bx, 0.03, -it.d); it.splat.scale.setScalar(1.4);
        this.group.add(it.splat);
      }
    }
  }

  // returns { type: 'hit' | 'slip' } or null
  collide(px, pd) {
    for (const it of this.items) {
      if (Math.abs(it.d - pd) > 2) continue;
      if (it.type === 'puddle') {
        if (!it.hit && Math.abs(it.x - px) < 0.45 && Math.abs(it.d - pd) < 0.3) { it.hit = true; return { type: 'slip', item: it }; }
      } else if (it.type === 'throw') {
        if (it.state === 'fly' && Math.abs(it.bx - px) < 0.45 && Math.abs(it.d - pd) < 0.55) {
          it.state = 'done'; it.blob.visible = false;
          return { type: 'splash', item: it };
        }
      } else if (Math.abs(it.x - px) < HIT_X && Math.abs(it.d - pd) < HIT_D) {
        return { type: 'hit', item: it };
      }
    }
    return null;
  }
}

function level_speed(level) { return level.speed; }
