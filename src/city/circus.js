import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  THREE, V3, V2, ACCENT, GOLD, anim, renderer,
  marble, darkMat, hot, ROOF, box, column, torii, group,
} from './core.js';
import { radial } from './landmarks.js';
import { SCALE, LS, CAR_LEN, createDriver, stepDriver, createSmoke } from './driving.js';

const pmrem = new THREE.PMREMGenerator(renderer);
const env = pmrem.fromScene(new RoomEnvironment(), .04).texture;
pmrem.dispose();

/*
 * Concept cars inspired by the body styles Michael loves. Proportions and signature lines only:
 * no badges, grilles or logos. Units are metres.
 * top: side profile from the nose (x = 0) to the tail; glass: greenhouse outline;
 * axles: front/rear wheel x; belt: shoulder height where the sides start tucking in.
 */
const CARS = {
  // four-door coupe: long hood, arched roof flowing into a short deck (CLS-like)
  cls: {
    L: 5, W: 1.9, r: .37, axles: [.95, 3.89], belt: .95, lights: 'bar',
    top: [[0, .42], [.06, .62], [.35, .74], [1, .82], [1.75, .93], [2.35, 1.36], [2.9, 1.43], [3.6, 1.36], [4.35, 1.07], [4.85, 1.02], [5, .86], [5, .5]],
    glass: [[1.86, .96], [2.37, 1.33], [2.9, 1.4], [3.6, 1.33], [4.25, 1.05]],
  },
  // flagship limousine: long wheelbase, upright formal roof (S-Class-like)
  sclass: {
    L: 5.2, W: 1.95, r: .39, axles: [.97, 4.07], belt: 1, lights: 'bar',
    top: [[0, .46], [.06, .7], [.3, .82], [1.1, .9], [1.65, 1], [2.2, 1.43], [2.8, 1.51], [3.85, 1.49], [4.35, 1.17], [4.95, 1.09], [5.18, .95], [5.2, .5]],
    glass: [[1.76, 1.01], [2.23, 1.4], [3.82, 1.46], [4.3, 1.14]],
  },
  // executive sport sedan with a kinked rear side window (5 Series-like)
  five: {
    L: 5.06, W: 1.9, r: .38, axles: [.93, 3.92], belt: .97, lights: 'twin',
    top: [[0, .44], [.06, .66], [.3, .79], [1.05, .87], [1.7, .97], [2.25, 1.39], [2.85, 1.48], [3.7, 1.44], [4.25, 1.12], [4.85, 1.06], [5.05, .9], [5.06, .5]],
    glass: [[1.8, .98], [2.27, 1.36], [3.7, 1.41], [3.86, 1.27], [4.12, 1.12]],
  },
  // two-door grand tourer with a very long hood (6 Series coupe-like)
  six: {
    L: 4.9, W: 1.9, r: .38, axles: [.92, 3.77], belt: .93, lights: 'twin',
    top: [[0, .42], [.06, .62], [.35, .74], [1.2, .83], [1.95, .92], [2.45, 1.3], [2.95, 1.37], [3.6, 1.3], [4.35, 1.04], [4.8, .98], [4.9, .82], [4.9, .5]],
    glass: [[2.05, .93], [2.47, 1.27], [2.95, 1.34], [3.55, 1.28], [4.1, 1.02]],
  },
  // mid-engine wedge with faceted surfaces (Lamborghini-like)
  lambo: {
    L: 4.95, W: 2.04, r: .39, axles: [1.15, 3.85], belt: .78, lights: 'y', angular: true,
    top: [[0, .36], [.05, .5], [.6, .62], [1.45, .77], [2.35, 1.13], [3, 1.16], [3.6, 1.08], [4.4, .98], [4.9, .96], [4.95, .6]],
    glass: [[1.58, .78], [2.37, 1.1], [2.95, 1.13], [3.3, 1.05], [3.4, .82]],
  },
  // rear-engine sports car: roof sloping all the way to the tail, round headlamps (911-like)
  nine: {
    L: 4.52, W: 1.85, r: .37, axles: [1, 3.45], belt: .86, lights: 'round',
    top: [[0, .4], [.06, .6], [.25, .72], [.55, .75], [1.2, .79], [1.6, .85], [2.05, 1.24], [2.45, 1.3], [3, 1.22], [3.8, 1.01], [4.35, .93], [4.5, .8], [4.52, .5]],
    glass: [[1.7, .87], [2.08, 1.21], [2.45, 1.27], [2.95, 1.19], [3.3, .99]],
  },
};

const SILL = .24;

function bodyShape({ top, axles, r, angular }) {
  const s = new THREE.Shape();
  const x0 = top[0][0], xn = top[top.length - 1][0], R = r + .07;
  s.moveTo(x0, SILL);
  s.lineTo(...top[0]);
  if (angular) top.slice(1).forEach(([x, y]) => s.lineTo(x, y));
  else s.splineThru(top.slice(1).map(([x, y]) => new V2(x, y)));
  s.lineTo(xn, SILL);
  for (const ax of [axles[1], axles[0]]) { // walk back to the nose, cutting both wheel arches
    s.lineTo(ax + R, SILL);
    s.lineTo(ax + R, r);
    s.absarc(ax, r, R, 0, Math.PI, false);
    s.lineTo(ax - R, SILL);
  }
  s.lineTo(x0, SILL);
  return s;
}

// Tuck the sides in above the shoulder and round the nose and tail in plan view.
function sculpt(geo, L, belt) {
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    let k = 1 - Math.min(1, Math.max(0, (p.getY(i) - belt) / .55)) * .24;
    const e = Math.abs(p.getX(i)) / (L / 2);
    if (e > .7) k *= .78 + .22 * Math.sqrt(Math.max(0, 1 - ((e - .7) / .3) ** 2));
    p.setZ(i, p.getZ(i) * k);
  }
  geo.computeVertexNormals();
  return geo;
}

const TRAIL = (() => {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 4;
  const x = c.getContext('2d'), gr = x.createLinearGradient(0, 0, 64, 0);
  gr.addColorStop(0, 'rgba(255,255,255,0)');
  gr.addColorStop(1, 'rgba(255,255,255,1)');
  x.fillStyle = gr;
  x.fillRect(0, 0, 64, 4);
  return {
    geo: new THREE.PlaneGeometry(1.4, .06).rotateX(-Math.PI / 2).translate(-.7, 0, 0),
    mat: new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), color: ACCENT.clone().multiplyScalar(1.8), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }),
  };
})();
const glassMat = new THREE.MeshPhysicalMaterial({ color: '#04050a', metalness: .95, roughness: .05, envMap: env, envMapIntensity: .45 });
const headMat = hot('#fff1de', 2.2);
const tailMat = hot(ACCENT, 2.2);
const sillMat = hot(GOLD, 1.5);
const rimMat = hot('#dfe6ff', 1.6);
const TIRE = new THREE.CylinderGeometry(1, 1, .28, 28).rotateX(Math.PI / 2);
const RIM = new THREE.TorusGeometry(.74, .035, 6, 36);
const LAMP = new THREE.CylinderGeometry(.11, .11, .05, 18).rotateZ(Math.PI / 2);

function makeCar(spec, paint) {
  const { L, W, r, axles, belt, top, glass, lights } = spec;
  const car = new THREE.Group();
  // geometry is built nose at x = 0, then centred and flipped so the nose points along +x
  const body = sculpt(new THREE.ExtrudeGeometry(bodyShape(spec), { depth: W - .16, bevelEnabled: true, bevelThickness: .08, bevelSize: .08, bevelSegments: 2, curveSegments: 20 })
    .translate(-L / 2, 0, -(W - .16) / 2), L, belt).rotateY(Math.PI);
  const cabin = sculpt(new THREE.ExtrudeGeometry(new THREE.Shape(glass.map(([x, y]) => new V2(x, y))), { depth: W + .02, bevelEnabled: false })
    .translate(-L / 2, 0, -(W + .02) / 2), L, belt).rotateY(Math.PI);
  car.add(new THREE.Mesh(body, new THREE.MeshPhysicalMaterial({ color: paint, metalness: .55, roughness: .3, clearcoat: 1, clearcoatRoughness: .08, envMap: env, envMapIntensity: .22 })));
  car.add(new THREE.Mesh(cabin, glassMat));

  const fx = ax => L / 2 - ax; // nose-based x to car-centred x
  const wheels = [];
  for (const ax of axles) for (const sz of [-1, 1]) {
    const w = new THREE.Group();
    w.position.set(fx(ax), r, 0);
    car.add(w);
    const tire = new THREE.Mesh(TIRE, darkMat);
    tire.scale.set(r, r, 1);
    tire.position.z = sz * (W / 2 - .16);
    w.add(tire);
    const rim = new THREE.Mesh(RIM, rimMat);
    rim.scale.setScalar(r);
    rim.position.z = sz * (W / 2 - .01);
    w.add(rim);
    for (const rot of [0, Math.PI / 2]) { // spokes make the wheel spin readable
      const sp = box(w, 0, sz * (W / 2 - .01), r * 1.4, .05, .02, rimMat, -.025);
      sp.position.y = 0;
      sp.rotation.z = rot;
    }
    wheels.push(w);
  }
  car.userData.wheels = wheels;
  // gold light line along the sills, between the wheels
  const sillLen = axles[1] - axles[0] - 2 * (r + .12);
  for (const sz of [-1, 1]) box(car, fx((axles[0] + axles[1]) / 2), sz * (W / 2 - .02), sillLen, .035, .02, sillMat, .3);

  const hy = top[1][1] + .04, nose = L / 2 - .02;
  if (lights === 'bar') box(car, nose, 0, .04, .05, W * .72, headMat, hy);
  if (lights === 'twin') for (const sz of [-1, 1]) box(car, nose, sz * W * .24, .04, .06, W * .26, headMat, hy);
  if (lights === 'y') for (const sz of [-1, 1]) for (const tilt of [-.55, .55]) {
    box(car, nose - .05, sz * W * .3, .04, .04, .32, headMat, hy).rotation.x = tilt * sz;
  }
  if (lights === 'round') for (const sz of [-1, 1]) {
    const lamp = new THREE.Mesh(LAMP, headMat);
    lamp.position.set(L / 2 - .32, .8, sz * W * .32);
    car.add(lamp);
  }
  const ty = top[top.length - 2][1] - .1;
  const tail = box(car, -L / 2 + .02, 0, .04, .06, W * .74, tailMat.clone(), ty);
  car.userData.tail = tail.material;
  car.userData.trails = [-1, 1].map(sz => {
    const t = new THREE.Mesh(TRAIL.geo, TRAIL.mat);
    t.position.set(-L / 2, ty + .03, sz * W * .32);
    car.add(t);
    return t;
  });
  return car;
}

/* ---------- track ---------- */

// Point on a stadium-shaped loop of radius R (used to draw the track).
function trackAt(s, R, pos) {
  const half = Math.PI * R, P = 2 * LS + 2 * half;
  s = ((s % P) + P) % P;
  if (s < LS) { pos.set(-LS / 2 + s, 0, -R); return 0; }
  s -= LS;
  if (s < half) { const a = -Math.PI / 2 + s / R; pos.set(LS / 2 + Math.cos(a) * R, 0, Math.sin(a) * R); return a + Math.PI / 2; }
  s -= half;
  if (s < LS) { pos.set(LS / 2 - s, 0, R); return Math.PI; }
  s -= LS;
  const a = Math.PI / 2 + s / R;
  pos.set(-LS / 2 + Math.cos(a) * R, 0, Math.sin(a) * R);
  return a + Math.PI / 2;
}
function loopPts(R, y) {
  const P = 2 * LS + 2 * Math.PI * R, pts = [], v = new V3();
  for (let s = 0; s < P; s += .5) { trackAt(s, R, v); pts.push(new V3(v.x, y, v.z)); }
  return pts;
}
const CAR_SCALE = 1.15;

const loop = (R, y, mat) => new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(loopPts(R, y)), mat);

// Circus: a Circus Maximus for concept cars, with spina, obelisk and turning posts.
export function buildCircus(d) {
  const g = group(d);
  g.rotation.y = -radial(d) - Math.PI / 2; // long axis tangent to the city, near straight faces the camera
  const surf = new THREE.ShapeGeometry(new THREE.Shape(loopPts(16.4, 0).map(p => new V2(p.x, -p.z))), 8).rotateX(-Math.PI / 2);
  const asphalt = new THREE.Mesh(surf, new THREE.MeshStandardMaterial({ color: '#0c0c12', roughness: .9, metalness: .1 }));
  asphalt.position.y = .05;
  g.add(asphalt);
  g.add(loop(15.8, .1, new THREE.LineBasicMaterial({ color: ACCENT.clone().multiplyScalar(2.2) })));
  g.add(loop(7.4, .1, new THREE.LineBasicMaterial({ color: GOLD.clone().multiplyScalar(1.8) })));
  for (const R of [11.6]) {
    const l = loop(R, .08, new THREE.LineDashedMaterial({ color: '#8d93b8', dashSize: 1.2, gapSize: 1.6, transparent: true, opacity: .5 }));
    l.computeLineDistances();
    g.add(l);
  }

  box(g, 0, 0, LS, 1.2, 3, marble);
  const ob = new THREE.Mesh(new THREE.CylinderGeometry(.5, 1, 18, 4), marble);
  ob.rotation.y = Math.PI / 4;
  ob.position.y = 10.2;
  g.add(ob);
  const tip = new THREE.Mesh(new THREE.CylinderGeometry(0, .5, 1.4, 4), hot(GOLD, 2.6));
  tip.rotation.y = Math.PI / 4;
  tip.position.y = 19.9;
  g.add(tip);
  for (const sx of [-1, 1]) for (const sz of [-.9, 0, .9]) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0, .55, 4, 12), marble);
    m.position.set(sx * (LS / 2 - .6), 3.2, sz);
    g.add(m);
  }
  // stands: two low steps on the camera side, a roofed cavea on the far side
  for (let i = 0; i < 2; i++) box(g, 0, -(17.6 + i * 1.6), LS + 6, (i + 1) * .7, 1.6, marble);
  for (let i = 0; i < 4; i++) box(g, 0, 17.6 + i * 1.6, LS + 6, (i + 1) * 1.1, 1.6, marble);
  for (let x = -LS / 2 - 2; x <= LS / 2 + 2; x += 6.25) column(g, x, 23.6, .45, 9);
  const canopy = new THREE.Mesh(ROOF, new THREE.MeshStandardMaterial({ color: '#16131c', roughness: .8, metalness: .3, side: THREE.DoubleSide }));
  canopy.scale.set((LS + 10) / 1.41, 3.4, 9 / 1.41);
  canopy.position.set(0, 9, 20.4);
  g.add(canopy);
  torii(g, 0, 11.6, 10, 7, Math.PI / 2);

  // six cars share the track; a driver model handles lines, braking, overtakes and drifts (driving.js)
  const pos = new V3(), smoke = createSmoke(g), rear = new V3();
  const cars = [['lambo', '#d63a1c'], ['nine', '#a9abb0'], ['six', '#1c2230'], ['cls', '#101116'], ['sclass', '#8e9298'], ['five', '#2b3340']]
    .map(([type, paint], i) => {
      const c = makeCar(CARS[type], paint);
      c.scale.setScalar(CAR_SCALE);
      c.rotation.order = 'YZX';
      g.add(c);
      return Object.assign(createDriver(type, i * 27), { c });
    });

  const rows = new Map([...document.querySelectorAll('.telemetry [data-car]')].map(el => [el.dataset.car, el]));
  let tick = 0;
  anim.push((t, dt) => {
    const steps = dt > .02 ? 2 : 1; // substeps keep the driver model stable on slow frames
    for (let n = 0; n < steps; n++) {
      for (const k of cars) {
        const { h, smoking } = stepDriver(k, cars, dt / steps, pos);
        if (n < steps - 1) continue;
        const yaw = h + k.beta; // drift: the nose points further into the turn than the path
        k.c.position.set(pos.x, .06, pos.z);
        // body pitch from longitudinal load transfer, roll away from the corner
        k.c.rotation.set(-Math.min(.06, k.alat * .0045), -yaw, Math.max(-.05, Math.min(.04, k.a * .004)));
        const spin = k.v / SCALE / (CARS[k.type].r * CAR_SCALE) * dt * k.spin;
        k.c.userData.wheels.forEach(w => { w.rotation.z -= spin; });
        k.c.userData.tail.color.copy(ACCENT).multiplyScalar(k.a < -3 ? 6 : 2.2); // brake lights
        k.c.userData.trails.forEach(tr => { tr.scale.x = Math.min(1, k.v / 50); });
        if (smoking && Math.random() < dt * 40) {
          rear.set(Math.cos(yaw), 0, Math.sin(yaw)).multiplyScalar(-CAR_LEN * .32).add(k.c.position);
          smoke.emit(rear.x, .5, rear.z);
        }
      }
    }
    smoke.update(dt);
    if ((tick += dt) > .15) {
      tick = 0;
      for (const k of cars) {
        const row = rows.get(k.type);
        if (!row) continue;
        row.querySelector('b').textContent = Math.round(k.v * 3.6);
        row.querySelector('em').textContent = `${(k.alat / 9.81).toFixed(2)} g`;
        row.querySelector('small').textContent = k.state;
        row.dataset.state = k.state;
      }
    }
  });
}
