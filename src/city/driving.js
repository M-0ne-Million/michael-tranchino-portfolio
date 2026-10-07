import { THREE, rnd } from './core.js';

/*
 * Race simulation for the Circuit district.
 * Each car is driven by a simple driver model on a shared track:
 *  - corner speed is limited by tyre grip plus aero downforce: v^2 = mu g R / (1 - mu ClA rho R / 2m)
 *  - on the straights it accelerates within power, traction (RWD vs AWD) and drag limits,
 *    and brakes as late as its grip allows for the next corner
 *  - it follows a racing line (wide, apex, wide), attacks slower cars on the free side,
 *    brakes later while attacking, and never closes the door on a car alongside
 *  - rear-wheel drive cars sometimes power-oversteer out of the turns (drift) and spin the tyres.
 */

export const SCALE = 2.4; // physics runs in metres; the circuit is a 1:2.4 model
export const LS = 46;     // straight length, scene units
export const RC = 11.6;   // centreline radius of the turns, scene units
const HALF = 3;           // usable half-width of the racing band around the centreline
const LAP = 2 * LS + 2 * Math.PI * RC;
const G = 9.81, RHO = 1.2;
export const CAR_LEN = 5.8, CAR_WID = 2.4; // scene units, scaled cars

// Concept specs, not manufacturer data.
export const PHYS = {
  lambo:  { m: 1550, kw: 600, mu: 1.45, cda: .75, cla: 1.1, rwd: false, drift: .25 },
  nine:   { m: 1500, kw: 480, mu: 1.4,  cda: .65, cla: .8,  rwd: true,  drift: .45 },
  six:    { m: 1850, kw: 440, mu: 1.25, cda: .7,  cla: .2,  rwd: true,  drift: .55 },
  cls:    { m: 1900, kw: 430, mu: 1.2,  cda: .68, cla: .15, rwd: false, drift: .12 },
  sclass: { m: 2200, kw: 450, mu: 1.15, cda: .72, cla: .1,  rwd: false, drift: .05 },
  five:   { m: 1950, kw: 460, mu: 1.25, cda: .7,  cla: .2,  rwd: true,  drift: .55 },
};

const traction = p => p.mu * G * (p.rwd ? .58 : .9);
const accel = (p, v) => (Math.min(p.kw * 1000 / Math.max(v, 2) / p.m, traction(p)) * p.m - .5 * RHO * p.cda * v * v - .015 * p.m * G) / p.m;
const brake = (p, v, push) => p.mu * push * G * .95 + .5 * RHO * (p.cda + p.cla * p.mu) * v * v / p.m;
const cornerSpeed = (p, Rm, push) => Math.sqrt(p.mu * push * G * Rm / Math.max(.3, 1 - p.mu * push * p.cla * RHO * Rm / (2 * p.m)));

// Track frame: s = distance along the centreline, d = lateral offset (positive = outside of the turns).
const F = { arc: false, u: 0, h: 0 };
export function trackFrame(s, d, pos) {
  s = ((s % LAP) + LAP) % LAP;
  const half = Math.PI * RC;
  if (s < LS) { pos.set(-LS / 2 + s, 0, -(RC + d)); F.arc = false; F.u = s / LS; F.h = 0; return F; }
  s -= LS;
  if (s < half) {
    const u = s / half, a = -Math.PI / 2 + u * Math.PI;
    pos.set(LS / 2 + Math.cos(a) * (RC + d), 0, Math.sin(a) * (RC + d));
    F.arc = true; F.u = u; F.h = a + Math.PI / 2; return F;
  }
  s -= half;
  if (s < LS) { pos.set(LS / 2 - s, 0, RC + d); F.arc = false; F.u = s / LS; F.h = Math.PI; return F; }
  s -= LS;
  const u = s / half, a = Math.PI / 2 + u * Math.PI;
  pos.set(-LS / 2 + Math.cos(a) * (RC + d), 0, Math.sin(a) * (RC + d));
  F.arc = true; F.u = u; F.h = a + Math.PI / 2; return F;
}

// Racing line: wide on the straights, clip the apex mid-corner, run wide on exit.
const lineOffset = f => (f.arc ? 2.4 - 5.2 * Math.sin(Math.PI * f.u) : 2.4);
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const signedGap = (a, b) => { let g = (((b - a) % LAP) + LAP) % LAP; if (g > LAP / 2) g -= LAP; return g; };

export function createDriver(type, s0) {
  return { type, p: PHYS[type], s: s0, d: 2.4, dd: 0, v: 16, a: 0, alat: 0, beta: 0, bias: (rnd() - .5) * .8, mode: 'race', target: null, side: 0, wasArc: false, driftPlan: false, spin: 0, state: '' };
}

export function stepDriver(k, cars, dt, pos) {
  const p = k.p;
  const f = trackFrame(k.s, k.d, pos);
  const arc = f.arc, u = f.u;
  if (arc && !k.wasArc) k.driftPlan = rnd() < p.drift; // decide at turn-in
  k.wasArc = arc;

  const push = k.mode === 'pass' ? 1.05 : 1; // attacking: closer to the limit
  const vc = cornerSpeed(p, (RC + 1.2) * SCALE, push);
  let vT;
  if (arc) vT = u > .5 ? vc * (1 + (u - .5) * .55) : vc; // radius opens up after the apex
  else vT = Math.sqrt(vc * vc + 2 * brake(p, vc, push) * (1 - u) * LS * SCALE);

  // traffic
  let dT = lineOffset(f) + k.bias, cap = Infinity;
  for (const o of cars) {
    if (o === k) continue;
    const gap = signedGap(k.s, o.s), lat = o.d - k.d;
    if (gap > 0 && gap < 16 && Math.abs(lat) < CAR_WID + .1) {
      if (k.mode !== 'pass' && gap < 14 && (vT > o.v + .6 || k.v > o.v + .4)) {
        k.mode = 'pass'; k.target = o;
        k.side = o.d > 0 ? -1 : 1; // go for the free side
      }
      if (gap < CAR_LEN + 1.6) cap = Math.min(cap, Math.max(0, o.v - 1 + (gap - CAR_LEN - .6) * 1.5)); // no contact
    }
  }
  if (k.mode === 'pass') {
    const o = k.target, gap = signedGap(k.s, o.s);
    let want = o.d + k.side * (CAR_WID + .4);
    if (Math.abs(want) > HALF) { k.side = -k.side; want = o.d + k.side * (CAR_WID + .4); } // no room: switch side
    dT = want;
    if (gap < -CAR_LEN - 1 || gap > 22) { k.mode = 'race'; k.target = null; }
  }
  for (const o of cars) { // alongside: leave a car's width
    if (o === k || Math.abs(signedGap(k.s, o.s)) > CAR_LEN + .4) continue;
    if (o.d > k.d) dT = Math.min(dT, o.d - CAR_WID - .1); else dT = Math.max(dT, o.d + CAR_WID + .1);
  }
  dT = clamp(dT, -HALF, HALF);
  const rate = 1.6 + k.v / 14;
  k.dd = clamp((dT - k.d) * 2.2, -rate, rate);
  k.d = clamp(k.d + k.dd * dt, -HALF, HALF);

  // longitudinal
  vT = Math.max(0, Math.min(vT, cap));
  const v0 = k.v;
  if (k.v < vT) k.v = Math.min(vT, k.v + accel(p, k.v) * dt);
  else k.v = Math.max(vT, k.v - brake(p, k.v, push) * dt);

  // power oversteer on corner exit
  const drifting = arc && u > .35 && k.driftPlan;
  if (drifting) k.v *= 1 - .06 * dt; // scrub
  k.beta += ((drifting ? (p.rwd ? .38 : .2) * Math.sin(Math.min(1, (u - .35) / .5) * Math.PI * .9) : 0) - k.beta) * Math.min(1, dt * 3);

  const a = dt > 0 ? (k.v - v0) / dt : 0;
  k.a += (a - k.a) * Math.min(1, dt * 6);
  const R = (RC + k.d) * SCALE;
  k.alat = arc ? k.v * k.v / R : 0;
  k.spin = drifting || (p.rwd && k.a > traction(p) * .8) ? 1.6 : 1; // wheelspin
  const ds = k.v / SCALE * dt * (arc ? RC / (RC + k.d) : 1);
  k.s = (k.s + ds) % LAP;
  k.state = Math.abs(k.beta) > .12 ? 'DRIFT' : k.mode === 'pass' ? 'PASS' : k.a < -3 ? 'BRAKE' : '';
  return { h: f.h - Math.atan2(k.dd, Math.max(1, k.v / SCALE)), smoking: Math.abs(k.beta) > .12 || k.spin > 1 || k.a < -13 };
}

// Tyre smoke: pooled particles with per-particle alpha.
export function createSmoke(parent) {
  const N = 320, pos = new Float32Array(N * 3), col = new Float32Array(N * 4), life = new Float32Array(N), vel = new Float32Array(N * 3);
  let head = 0;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = gr;
  x.fillRect(0, 0, 64, 64);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 4));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 2.6, map: new THREE.CanvasTexture(c), vertexColors: true, transparent: true, depthWrite: false }));
  pts.frustumCulled = false;
  parent.add(pts);
  return {
    emit(px, py, pz) {
      const i = head;
      head = (head + 1) % N;
      pos.set([px + (rnd() - .5) * .5, py, pz + (rnd() - .5) * .5], i * 3);
      vel.set([(rnd() - .5) * 1.2, .7 + rnd() * .8, (rnd() - .5) * 1.2], i * 3);
      life[i] = 1;
    },
    update(dt) {
      for (let i = 0; i < N; i++) {
        if (life[i] > 0) {
          life[i] -= dt * .65;
          for (let k = 0; k < 3; k++) { pos[i * 3 + k] += vel[i * 3 + k] * dt; vel[i * 3 + k] *= 1 - dt * .6; }
        }
        col.set([.36, .36, .4, Math.max(0, life[i]) * .32], i * 4);
      }
      geo.attributes.position.needsUpdate = true;
      geo.attributes.color.needsUpdate = true;
    },
  };
}
