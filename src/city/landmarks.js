import {
  THREE, V3, V2, ACCENT, GOLD, rnd, anim, scene,
  bMat, marble, darkMat, roofMat, hot, glow, BOX, GABLE,
  box, cyl, roof, column, torii, group,
} from './core.js';

// One district per CV section. p = position, clear = radius kept free of filler towers,
// lh = label height, r/h/ty = camera distance, height and look-at height, dth = camera angle offset.
export const DISTRICTS = [
  { id: 'core',     name: 'Core',     kj: '中心', p: [0, 0],     clear: 36, lh: 110, r: 105, h: 70, ty: 40 },
  { id: 'turbine',  name: 'Turbine',  kj: '動力', p: [-72, -28], clear: 26, lh: 44,  r: 62,  h: 40, ty: 16, dth: .4 },
  { id: 'labs',     name: 'Labs',     kj: '工房', p: [-30, -86], clear: 22, lh: 32,  r: 62,  h: 52, ty: 6 },
  { id: 'foundry',  name: 'Foundry',  kj: '工場', p: [68, -54],  clear: 26, lh: 38,  r: 70,  h: 58, ty: 10 },
  { id: 'beacon',   name: 'Beacon',   kj: '灯台', p: [76, 38],   clear: 30, lh: 74,  r: 82,  h: 64, ty: 28 },
  { id: 'stack',    name: 'Stack',    kj: '技術', p: [14, 88],   clear: 22, lh: 42,  r: 66,  h: 56, ty: 10 },
  { id: 'academy',  name: 'Academy',  kj: '学舎', p: [-64, 62],  clear: 30, lh: 42,  r: 70,  h: 54, ty: 10 },
  { id: 'circuit',  name: 'Circuit',  kj: '車',   p: [-136, 63], clear: 46, lh: 24,  r: 100, h: 58, ty: 0, sh: -30 },
  { id: 'uplink',   name: 'Uplink',   kj: '通信', p: [-120, 2],  clear: 16, lh: 98,  r: 92,  h: 62, ty: 46 },
];
DISTRICTS.forEach(d => { d.v = new V3(d.p[0], 0, d.p[1]); });
export const radial = d => Math.atan2(d.v.z, d.v.x);
export const CORE_VIEW = -3.5; // camera azimuth for the Core shot

// Core: Roman podium and colonnade carrying a five-tier pagoda.
function buildCore(d) {
  const g = group(d);
  box(g, 0, 0, 36, 2, 36, marble);
  box(g, 0, 0, 33, 2, 33, marble, 2);
  for (let i = 0; i < 20; i++) {
    const a = i / 20 * Math.PI * 2;
    column(g, Math.cos(a) * 14.6, Math.sin(a) * 14.6, .75, 12, 4);
  }
  const ent = new THREE.Mesh(new THREE.CylinderGeometry(15.6, 15.6, 1.6, 48, 1, true), marble);
  ent.position.y = 16.8;
  g.add(ent);
  let y = 4;
  [[17, 14], [14.5, 10], [12, 10], [10, 9.5], [8, 9]].forEach(([w, h]) => {
    box(g, 0, 0, w, h, w, bMat, y);
    y += h;
    roof(g, 0, y - 1, 0, w * .95, 4.4);
  });
  y += 2;
  cyl(g, 0, 0, .3, 26, hot(GOLD, 1.6), y);
  for (let i = 0; i < 9; i++) {
    const t = new THREE.Mesh(new THREE.TorusGeometry(1.7 - i * .1, .1, 6, 32), hot(GOLD, 2.4));
    t.rotation.x = Math.PI / 2;
    t.position.y = y + 4 + i * 1.6;
    g.add(t);
  }
  const jewel = new THREE.Mesh(new THREE.SphereGeometry(.9, 16, 12), hot(ACCENT, 4));
  jewel.position.y = y + 27;
  g.add(jewel);
  const halos = [22, 28].map((r, i) => {
    const t = new THREE.Mesh(new THREE.TorusGeometry(r, .08, 6, 200), hot(i ? GOLD : ACCENT, 2));
    t.position.y = 46 + i * 16;
    t.rotation.x = Math.PI / 2 + (i ? .14 : -.1);
    t.userData.dynamic = true;
    g.add(t);
    return t;
  });
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(.4, .8, 700, 16, 1, true), glow(.14));
  beam.position.y = y + 380;
  g.add(beam);
  torii(scene, Math.cos(CORE_VIEW) * 30, Math.sin(CORE_VIEW) * 30, 22, 26, Math.PI / 2 - CORE_VIEW);
  anim.push(t => halos.forEach((r, i) => { r.rotation.z = t * (.1 + i * .05) * (i ? -1 : 1); }));
}

// Point cloud of a centrifugal impeller (a nod to the impeller viewer project).
function impeller() {
  const pts = [], B = 9;
  for (let b = 0; b < B; b++) {
    const a0 = b / B * Math.PI * 2;
    for (let i = 0; i < 950; i++) {
      const r = 2.5 + rnd() * 9.5, t = (r - 2.5) / 9.5, a = a0 + Math.log(r / 2.5) * 1.15;
      pts.push(Math.cos(a) * r, rnd() * (6 * (1 - t) + 1.3), Math.sin(a) * r);
    }
  }
  for (let i = 0; i < 2600; i++) {
    const r = Math.sqrt(rnd()) * 12.5, a = rnd() * Math.PI * 2;
    pts.push(Math.cos(a) * r, -.25 - (1 - r / 12.5) * .9 * rnd(), Math.sin(a) * r);
  }
  for (let i = 0; i < 900; i++) {
    const y = rnd() * 7, r = 2.6 * (1 - y / 7.6), a = rnd() * Math.PI * 2;
    pts.push(Math.cos(a) * r, y, Math.sin(a) * r);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  return new THREE.Points(geo, new THREE.PointsMaterial({ size: .2, color: ACCENT.clone().multiplyScalar(1.5), transparent: true, opacity: .95, blending: THREE.AdditiveBlending, depthWrite: false }));
}

// Volute: a spiral tube whose section grows as it wraps, like a turbo housing. Axis = +z.
function voluteGeo(rc0, rc1, r0, r1, turns = .92, seg = 96, rad = 24) {
  const pos = [], idx = [];
  for (let i = 0; i <= seg; i++) {
    const t = i / seg, a = t * turns * Math.PI * 2, rc = rc0 + (rc1 - rc0) * t, r = r0 + (r1 - r0) * t;
    for (let j = 0; j <= rad; j++) {
      const f = j / rad * Math.PI * 2, k = rc + Math.cos(f) * r;
      pos.push(Math.cos(a) * k, Math.sin(a) * k, Math.sin(f) * r);
    }
  }
  for (let i = 0; i < seg; i++) for (let j = 0; j < rad; j++) {
    const a = i * (rad + 1) + j, b = a + rad + 1;
    idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

// Glowing line along the outer edge of a volute, so its snail silhouette reads at night.
function voluteEdge(rc0, rc1, r0, r1, mat, turns = .92) {
  const pts = [];
  for (let i = 0; i <= 120; i++) {
    const t = i / 120, a = t * turns * Math.PI * 2, k = rc0 + (rc1 - rc0) * t + r0 + (r1 - r0) * t + .05;
    pts.push(new V3(Math.cos(a) * k, Math.sin(a) * k, 0));
  }
  return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 200, .12, 6), mat);
}

// Straight duct leaving a volute tangentially at its widest end.
function voluteOutlet(rc1, r1, turns, len, mat) {
  const a = turns * Math.PI * 2, tan = new V3(-Math.sin(a), Math.cos(a), 0);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r1, len, 24, 1, true), mat);
  m.quaternion.setFromUnitVectors(new V3(0, 1, 0), tan);
  m.position.set(Math.cos(a) * rc1, Math.sin(a) * rc1, 0).addScaledVector(tan, len / 2);
  return m;
}

const titanium = new THREE.MeshStandardMaterial({ color: '#4a505e', emissive: '#151821', metalness: .85, roughness: .3, side: THREE.DoubleSide });
const heatMat = new THREE.MeshStandardMaterial({ color: '#2a0d06', emissive: ACCENT, emissiveIntensity: .9, metalness: .6, roughness: .4, side: THREE.DoubleSide });

// Turbine: a giant futuristic turbocharger powering the city (Baker Hughes builds turbomachinery).
// Cold compressor side faces the camera with its wheel spinning in the inlet, hot turbine side glows behind.
let powerLine;
function buildTurbine(d) {
  const g = group(d);
  box(g, 0, 0, 34, 2, 34, marble);
  const turbo = new THREE.Group();
  turbo.position.y = 17;
  turbo.rotation.y = Math.PI / 2 - (radial(d) + (d.dth ?? 0)); // shaft axis points at the camera
  g.add(turbo);

  const comp = new THREE.Group();
  comp.position.z = 4;
  turbo.add(comp);
  comp.add(new THREE.Mesh(voluteGeo(7, 9.6, 1.8, 3.8), titanium));
  comp.add(voluteEdge(7, 9.6, 1.8, 3.8, hot(GOLD, 2)));
  const outlet = voluteOutlet(9.6, 3.8, .92, 9, titanium);
  comp.add(outlet);
  const back = new THREE.Mesh(new THREE.CylinderGeometry(9, 9, 1.4, 48), titanium);
  back.rotation.x = Math.PI / 2;
  back.position.z = -2.4;
  comp.add(back);
  const bell = new THREE.Mesh(new THREE.LatheGeometry([[4.4, 0], [4.5, 1.4], [5.2, 2.8], [6.6, 3.5]].map(([x, y]) => new V2(x, y)), 48), titanium);
  bell.rotation.x = Math.PI / 2;
  bell.position.z = .4;
  comp.add(bell);
  const lip = new THREE.Mesh(new THREE.TorusGeometry(6.6, .14, 8, 64), hot(GOLD, 2.2));
  lip.position.z = 3.9;
  comp.add(lip);
  const wheel = new THREE.Group();
  wheel.userData.dynamic = true;
  wheel.position.z = .2;
  comp.add(wheel);
  const imp = impeller();
  imp.rotation.x = Math.PI / 2;
  imp.scale.setScalar(.36);
  wheel.add(imp);

  // centre housing on the shaft, with gold bearing rings
  const core = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 6.5, 40), titanium);
  core.rotation.x = Math.PI / 2;
  core.position.z = -2;
  turbo.add(core);
  for (const z of [-.2, -3.8]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(3.35, .16, 8, 48), hot(GOLD, 2.4));
    ring.position.z = z;
    turbo.add(ring);
  }

  // hot turbine side with exhaust
  const hotSide = new THREE.Group();
  hotSide.position.z = -8;
  hotSide.rotation.z = Math.PI;
  turbo.add(hotSide);
  hotSide.add(new THREE.Mesh(voluteGeo(6, 8.6, 1.6, 3.3), heatMat));
  hotSide.add(voluteEdge(6, 8.6, 1.6, 3.3, hot(ACCENT, 2.6)));
  hotSide.add(voluteOutlet(8.6, 3.3, .92, 6, heatMat));
  const tback = new THREE.Mesh(new THREE.CylinderGeometry(8, 8, 1.2, 48), heatMat);
  tback.rotation.x = Math.PI / 2;
  tback.position.z = 2.2;
  hotSide.add(tback);
  const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(3, 3.6, 6, 32, 1, true), heatMat);
  exhaust.rotation.x = Math.PI / 2;
  exhaust.position.z = -3.4;
  hotSide.add(exhaust);
  const flame = new THREE.Mesh(new THREE.CircleGeometry(2.9, 32), glow(.9));
  flame.position.z = -2;
  flame.rotation.y = Math.PI;
  hotSide.add(flame);

  // pylons
  for (const z of [4, -8]) {
    const p = box(turbo, 0, z, 3, 8, 5, darkMat, -17);
    p.position.y = -12;
  }

  // power line: from the compressor outlet to the Core, energy packets flowing inside a glass duct
  g.updateMatrixWorld(true);
  const start = outlet.localToWorld(new V3(0, 4.5, 0));
  const dir = d.v.clone().negate().normalize();
  const end = dir.clone().multiplyScalar(-22);
  const mid = start.clone().lerp(end, .45).setY(7);
  const curve = new THREE.CatmullRomCurve3([start, start.clone().lerp(mid, .3).setY(start.y - 2), mid, end.clone().setY(6)]);
  scene.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 160, 1, 14), glow(.12)));
  scene.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 160, .22, 8), hot(GOLD, 1.3)));
  for (let t = .1; t < 1; t += .1) {
    const p = curve.getPointAt(t);
    box(scene, p.x, p.z, .8, p.y - 1, .8, darkMat);
  }
  const packets = [0, 1, 2, 3, 4, 5, 6, 7].map(() => { const m = new THREE.Mesh(new THREE.SphereGeometry(.6, 10, 8), hot(GOLD, 3.6)); m.userData.dynamic = true; scene.add(m); return m; });
  powerLine = [start, end];

  anim.push((t, dt) => {
    wheel.rotation.z -= dt * 7;
    heatMat.emissiveIntensity = .85 + Math.sin(t * 3) * .2 + Math.sin(t * 17) * .05;
    flame.material.opacity = .7 + Math.sin(t * 23) * .15;
    packets.forEach((m, i) => m.position.copy(curve.getPointAt((t * .08 + i / packets.length) % 1)));
  });
}

// Labs: round Roman tholoi, each with a hologram project floating inside.
function buildLabs(d) {
  const g = group(d);
  box(g, 0, 0, 6, 22, 6); roof(g, 0, 21.4, 0, 6.4, 4);
  const holos = [];
  for (let i = 0; i < 5; i++) {
    const a = i / 5 * Math.PI * 2 + .3, x = Math.cos(a) * 14, z = Math.sin(a) * 14;
    cyl(g, x, z, 4.2, 1.2, marble);
    for (let k = 0; k < 8; k++) {
      const b = k / 8 * Math.PI * 2;
      column(g, x + Math.cos(b) * 3.3, z + Math.sin(b) * 3.3, .32, 6.5, 1.2);
    }
    const dome = new THREE.Mesh(new THREE.SphereGeometry(4, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), roofMat);
    dome.position.set(x, 7.7, z);
    g.add(dome);
    const holo = new THREE.Mesh(new THREE.OctahedronGeometry(1.5, 0), new THREE.MeshBasicMaterial({ color: ACCENT.clone().multiplyScalar(2.4), wireframe: true }));
    holo.position.set(x, 4.5, z);
    holo.userData.dynamic = true;
    g.add(holo);
    holos.push([holo, i]);
  }
  anim.push(t => holos.forEach(([m, i]) => { m.rotation.y = t * .9 + i; m.position.y = 4.5 + Math.sin(t * 1.6 + i) * .5; }));
}

// Foundry: gabled halls, a gantry crane shaped like two torii, a robotic arm.
function buildFoundry(d) {
  const g = group(d);
  [-12, 0, 12].forEach((z, i) => {
    const h = 8 + i;
    box(g, -6, z, 26, h, 9);
    const r = new THREE.Mesh(GABLE, roofMat);
    r.scale.set(10, 6, 27);
    r.rotation.y = Math.PI / 2;
    r.position.set(-6, h, z);
    g.add(r);
  });
  const X = 25;
  torii(g, X, -4.5, 26, 26);
  torii(g, X, 4.5, 26, 26);
  const trolley = box(g, X, 0, 3, 1.6, 10, darkMat, 21.5);
  const cable = box(g, X, 0, .12, 10, .12, hot('#ffffff', 1.4), 11.5);
  const crate = box(g, X, 0, 6, 2.8, 2.8, hot(ACCENT, 1.3), 9);
  [trolley, cable, crate].forEach(m => { m.userData.dynamic = true; });
  const arm = new THREE.Group();
  arm.position.set(-6, 10, 20);
  arm.userData.dynamic = true;
  g.add(arm);
  arm.add(new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2, 1.6, 16), darkMat));
  const shoulder = new THREE.Group();
  shoulder.position.y = 1;
  arm.add(shoulder);
  const upper = new THREE.Mesh(BOX, darkMat);
  upper.scale.set(1, 8, 1);
  upper.position.y = 4;
  shoulder.add(upper);
  const elbow = new THREE.Group();
  elbow.position.y = 8;
  shoulder.add(elbow);
  const fore = new THREE.Mesh(BOX, darkMat);
  fore.scale.set(.8, 6, .8);
  fore.position.y = 3;
  elbow.add(fore);
  [shoulder, elbow].forEach(j => j.add(new THREE.Mesh(new THREE.SphereGeometry(.75, 12, 8), hot(ACCENT, 2.6))));
  const tool = new THREE.Mesh(new THREE.SphereGeometry(.45, 10, 8), hot(GOLD, 3));
  tool.position.y = 6;
  elbow.add(tool);
  anim.push(t => {
    trolley.position.x = cable.position.x = crate.position.x = X + Math.sin(t * .5) * 8;
    crate.position.y = 10.4 + Math.sin(t * .9) * 2;
    arm.rotation.y = t * .6;
    shoulder.rotation.z = -.5 + Math.sin(t * 1.3) * .35;
    elbow.rotation.z = 1.2 + Math.sin(t * 1.3 + 1) * .4;
  });
}

// Beacon: a giant stone lantern (toro) whose firebox is the Guardians beacon.
function buildBeacon(d) {
  const g = group(d);
  cyl(g, 0, 0, 10, 3, marble, 0, 9);
  cyl(g, 0, 0, 7, 4, marble, 3, 6);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 3.2, 34, 6), bMat);
  shaft.position.y = 24;
  g.add(shaft);
  cyl(g, 0, 0, 4, 3, marble, 41, 6);
  [[-3, -3], [3, -3], [-3, 3], [3, 3]].forEach(([x, z]) => box(g, x, z, .9, 8, .9, darkMat, 44));
  box(g, 0, 0, 7.4, .8, 7.4, darkMat, 44);
  box(g, 0, 0, 7.4, .8, 7.4, darkMat, 51.2);
  const fire = box(g, 0, 0, 5.4, 6, 5.4, hot(ACCENT, 3.2).clone(), 45);
  roof(g, 0, 52, 0, 8.4, 5);
  const jewel = new THREE.Mesh(new THREE.SphereGeometry(1.3, 20, 14), hot(GOLD, 3));
  jewel.position.y = 58.2;
  g.add(jewel);
  const shield = new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(30, 2)),
    new THREE.LineBasicMaterial({ color: '#c9b8ff', transparent: true, opacity: .12, blending: THREE.AdditiveBlending, depthWrite: false }));
  shield.position.y = 10;
  g.add(shield);
  box(g, -13, 9, 7, 14, 7); roof(g, -13, 13.6, 9, 6.6, 4);
  box(g, 12, -11, 8, 18, 6); roof(g, 12, 17.6, -11, 7.2, 4);
  const pulses = [0, 1, 2].map(() => {
    const m = new THREE.Mesh(new THREE.RingGeometry(.96, 1, 96), glow(1));
    m.rotation.x = -Math.PI / 2;
    m.position.y = 48;
    g.add(m);
    return m;
  });
  anim.push(t => {
    fire.material.color.copy(ACCENT).multiplyScalar(2.6 + Math.sin(t * 4) * .8);
    shield.rotation.y = t * .05;
    pulses.forEach((p, i) => {
      const s = (t * .32 + i / 3) % 1;
      p.scale.set(1 + s * 44, 1 + s * 44, 1);
      p.material.opacity = (1 - s) * .85;
    });
  });
}

// Stack: a forest of marble columns, one per technology, crossed by a scanner.
function buildStack(d) {
  const g = group(d);
  box(g, 0, 0, 32, 1.2, 32, marble);
  for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) column(g, (i - 2) * 5.6, (j - 2) * 5.6, .95, 8 + rnd() * 24, 1.2);
  const scanner = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), glow(.2));
  scanner.rotation.x = -Math.PI / 2;
  g.add(scanner);
  const edge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(30, 30)), new THREE.LineBasicMaterial({ color: ACCENT.clone().multiplyScalar(2.5) }));
  edge.rotation.x = -Math.PI / 2;
  edge.userData.dynamic = true;
  g.add(edge);
  for (let z = 22; z < 68; z += 4.2) torii(scene, 16, z, 4.4, 6.5);
  anim.push(t => { scanner.position.y = edge.position.y = 2 + (Math.sin(t * .7) * .5 + .5) * 32; });
}

function sakura(parent, x, z, s = 1) {
  cyl(parent, x, z, .35 * s, 5 * s, darkMat);
  const pos = [];
  for (let i = 0; i < 260; i++) {
    const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * 4.2 * s;
    pos.push(x + Math.cos(a) * r, 5 * s + rnd() * 3.4 * s * (1 - r / (4.6 * s)), z + Math.sin(a) * r);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  parent.add(new THREE.Points(geo, new THREE.PointsMaterial({ size: .5, color: new THREE.Color('#ffb3cb').multiplyScalar(1.3), transparent: true, opacity: .9, blending: THREE.AdditiveBlending, depthWrite: false })));
}

// Academy: Pantheon-style dome with oculus and a pedimented portico, framed by sakura.
function buildAcademy(d) {
  const g = group(d);
  cyl(g, 0, 0, 15, 12, marble);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(15, 48, 24, 0, Math.PI * 2, .14, Math.PI / 2 - .14), marble);
  dome.position.y = 12;
  g.add(dome);
  const oculus = new THREE.Mesh(new THREE.TorusGeometry(2.1, .22, 8, 40), hot(ACCENT, 3));
  oculus.rotation.x = Math.PI / 2;
  oculus.position.y = 12 + 15 * Math.cos(.14);
  g.add(oculus);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 500, 20, 1, true), glow(.1, GOLD));
  beam.position.y = 280;
  g.add(beam);
  const pg = new THREE.Group();
  pg.rotation.y = -radial(d); // portico faces outward, towards the camera
  g.add(pg);
  box(pg, 18, 0, 10, 1.2, 20, marble);
  for (let k = 0; k < 8; k++) column(pg, 22, -7.7 + k * 2.2, .62, 11, 1.2);
  for (let k = 0; k < 4; k++) column(pg, 18.6, -5.5 + k * 3.66, .62, 11, 1.2);
  box(pg, 18.4, 0, 9, 1.3, 19.4, marble, 12.2);
  const ped = new THREE.Mesh(GABLE, marble);
  ped.scale.set(19.4, 9, 9);
  ped.rotation.y = Math.PI / 2;
  ped.position.set(18.4, 13.5, 0);
  pg.add(ped);
  [30, 80, 200, 260, 320].forEach(deg => sakura(g, Math.cos(deg * Math.PI / 180) * 22, Math.sin(deg * Math.PI / 180) * 22, 1.1));
}

// Uplink: Trajan-style column; its 23-turn spiral carries packets to the sky.
class Helix extends THREE.Curve {
  getPoint(t, o = new V3()) {
    const a = t * 23 * Math.PI * 2, r = 3.2 - .3 * t;
    return o.set(Math.cos(a) * r, 11 + t * 64, Math.sin(a) * r);
  }
}
function buildUplink(d) {
  const g = group(d);
  box(g, 0, 0, 10, 10, 10, marble);
  cyl(g, 0, 0, 3.1, 66, marble, 10, 2.8);
  box(g, 0, 0, 7, 1.5, 7, marble, 76);
  const helix = new Helix();
  g.add(new THREE.Mesh(new THREE.TubeGeometry(helix, 900, .13, 5, false), hot(ACCENT, 1.4)));
  cyl(g, 0, 0, .25, 9, darkMat, 77.5);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(.9, 14, 10), hot(GOLD, 3.6));
  tip.position.y = 87;
  g.add(tip);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(.4, .4, 700, 12, 1, true), glow(.2));
  beam.position.y = 88 + 350;
  g.add(beam);
  const pk = new V3();
  const packets = [0, 1, 2, 3, 4, 5, 6, 7].map(() => { const m = new THREE.Mesh(new THREE.SphereGeometry(.5, 10, 8), hot(GOLD, 4)); m.userData.dynamic = true; g.add(m); return m; });
  anim.push(t => packets.forEach((m, i) => {
    const s = (t * .045 + i / packets.length) % 1.4;
    if (s < 1) m.position.copy(helix.getPoint(s, pk));
    else m.position.set(0, 88 + (s - 1) * 900, 0);
  }));
}

export const BUILDERS = {
  core: buildCore, turbine: buildTurbine, labs: buildLabs, foundry: buildFoundry,
  beacon: buildBeacon, stack: buildStack, academy: buildAcademy, uplink: buildUplink,
};

// Segment covered by the Turbine power line, so the skyline keeps it clear of towers.
export const getPowerLine = () => powerLine;
