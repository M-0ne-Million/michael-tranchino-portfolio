import {
  THREE, V3, ACCENT, LANTERN, mobile, rnd, anim, scene, camera,
  bMat, groundMat, roofMat, BOX, ROOF,
} from './core.js';
import { DISTRICTS } from './landmarks.js';

export const petalCenter = new V3();

export function buildSky() {
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400), groundMat);
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  const n = 1800, pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const th = rnd() * Math.PI * 2, ph = Math.acos(rnd() * .92);
    pos.set([Math.cos(th) * Math.sin(ph) * 1000, Math.cos(ph) * 1000, Math.sin(th) * Math.sin(ph) * 1000], i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  scene.add(new THREE.Points(g, new THREE.PointsMaterial({ size: 1.2, sizeAttenuation: false, color: '#d8d4ff', transparent: true, opacity: .7, fog: false })));

  // ukiyo-e style moon: soft halo plus a warm disc with a few maria
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const x = c.getContext('2d');
  const halo = x.createRadialGradient(256, 256, 60, 256, 256, 256);
  halo.addColorStop(0, 'rgba(255,236,214,.35)');
  halo.addColorStop(1, 'rgba(255,236,214,0)');
  x.fillStyle = halo;
  x.fillRect(0, 0, 512, 512);
  const disc = x.createRadialGradient(236, 236, 10, 256, 256, 92);
  disc.addColorStop(0, '#fff6ea');
  disc.addColorStop(1, '#f1dcc4');
  x.fillStyle = disc;
  x.beginPath(); x.arc(256, 256, 92, 0, Math.PI * 2); x.fill();
  x.fillStyle = 'rgba(190,160,140,.18)';
  [[220, 230, 22], [292, 270, 16], [250, 300, 12], [300, 210, 10]].forEach(([a, b, r]) => { x.beginPath(); x.arc(a, b, r, 0, Math.PI * 2); x.fill(); });
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, fog: false, depthWrite: false, transparent: true }));
  moon.position.set(620, 400, -520);
  moon.scale.setScalar(260);
  scene.add(moon);
}

const nearSeg = (x, z, [a, b], w) => {
  const abx = b.x - a.x, abz = b.z - a.z;
  const t = Math.max(0, Math.min(1, ((x - a.x) * abx + (z - a.z) * abz) / (abx * abx + abz * abz)));
  return Math.hypot(x - a.x - abx * t, z - a.z - abz * t) < w;
};

// Filler skyline: towers with pagoda roofs and eave tiers, all instanced.
export function buildSkyline(powerLine) {
  const lots = [], roofs = [], R = mobile ? 120 : 152;
  for (let bx = -10; bx < 10; bx++) for (let bz = -10; bz < 10; bz++) {
    const cx = bx * 16 + 8, cz = bz * 16 + 8, dc = Math.hypot(cx, cz);
    if (dc > R) continue;
    if (DISTRICTS.some(d => Math.hypot(cx - d.v.x, cz - d.v.z) < d.clear)) continue;
    if (nearSeg(cx, cz, powerLine, 9)) continue;
    const base = 5 + 40 * Math.exp(-dc / 70) * (.75 + rnd() * .5);
    if (rnd() < .18) lots.push([cx, cz, 8 + rnd() * 3, base * (1.1 + rnd() * .8), 8 + rnd() * 3]);
    else for (const [ox, oz] of [[-3.2, -3.2], [3.2, -3.2], [-3.2, 3.2], [3.2, 3.2]]) {
      if (rnd() < .15) continue;
      lots.push([cx + ox, cz + oz, 3 + rnd() * 2.4, base * (.25 + rnd() * .95), 3 + rnd() * 2.4]);
    }
  }
  lots.forEach(([x, z, w, h, d]) => {
    const s = Math.max(w, d);
    if (rnd() < .55) roofs.push([x, h - .3, z, s * .9, Math.min(w, d) * .55]);
    if (h > 26 && rnd() < .6) for (let y = h * .4; y < h - 6; y += Math.max(7, h * .22)) roofs.push([x, y, z, s * .98, 1.6]);
  });
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
  const towers = new THREE.InstancedMesh(BOX.clone().translate(0, .5, 0), bMat, lots.length);
  lots.forEach(([x, z, w, h, d], i) => towers.setMatrixAt(i, m4.compose(new V3(x, 0, z), q, new V3(w, h, d))));
  scene.add(towers);
  const rm = new THREE.InstancedMesh(ROOF, roofMat, roofs.length);
  roofs.forEach(([x, y, z, r, h], i) => rm.setMatrixAt(i, m4.compose(new V3(x, y, z), q, new V3(r, h, r))));
  scene.add(rm);
}

// Sky traffic: light streaks gliding along the road grid at altitude.
export function buildTraffic() {
  const N = mobile ? 30 : 100, cars = [];
  const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(.35, .22, 3.2), new THREE.MeshBasicMaterial(), N);
  const warm = new THREE.Color('#ffe6c8').multiplyScalar(2.4), red = ACCENT.clone().multiplyScalar(2.6);
  for (let i = 0; i < N; i++) {
    const dir = rnd() < .5 ? 1 : -1;
    cars.push({ x: rnd() < .5, lane: 16 * Math.round((rnd() * 2 - 1) * 8) + dir * 1.1, y: 18 + rnd() * 44, s: (14 + rnd() * 26) * dir, p: rnd() * 300 - 150 });
    mesh.setColorAt(i, dir > 0 ? warm : red);
  }
  scene.add(mesh);
  const m4 = new THREE.Matrix4(), qx = new THREE.Quaternion().setFromAxisAngle(new V3(0, 1, 0), Math.PI / 2), q0 = new THREE.Quaternion(), one = new V3(1, 1, 1), pos = new V3();
  anim.push((t, dt) => {
    cars.forEach((c, i) => {
      c.p += c.s * dt;
      if (c.p > 150) c.p = -150; else if (c.p < -150) c.p = 150;
      if (c.x) pos.set(c.p, c.y, c.lane); else pos.set(c.lane, c.y, c.p);
      mesh.setMatrixAt(i, m4.compose(pos, c.x ? qx : q0, one));
    });
    mesh.instanceMatrix.needsUpdate = true;
  });
}

// Paper lanterns rising slowly over the city; they shrink away near the lens.
export function buildLanterns() {
  const N = mobile ? 40 : 150, ls = [];
  const mesh = new THREE.InstancedMesh(new THREE.SphereGeometry(.55, 10, 8), new THREE.MeshBasicMaterial({ color: LANTERN.clone().multiplyScalar(2.2) }), N);
  for (let i = 0; i < N; i++) {
    const a = rnd() * Math.PI * 2, r = 20 + Math.sqrt(rnd()) * 130;
    ls.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, y: rnd() * 150, v: 1.2 + rnd() * 1.8, ph: rnd() * 6 });
  }
  scene.add(mesh);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new V3(), pos = new V3();
  anim.push((t, dt) => {
    ls.forEach((l, i) => {
      l.y += l.v * dt;
      if (l.y > 150) l.y = 0;
      pos.set(l.x + Math.sin(t * .3 + l.ph) * 2, l.y, l.z + Math.cos(t * .25 + l.ph) * 2);
      const k = Math.min(1, Math.max(0, (pos.distanceTo(camera.position) - 30) / 40));
      sc.set(k, k * 1.35, k);
      mesh.setMatrixAt(i, m4.compose(pos, q, sc));
    });
    mesh.instanceMatrix.needsUpdate = true;
  });
}

// Sakura petals drifting in a volume that follows the camera's focus.
export function buildPetals() {
  const N = mobile ? 260 : 1100, S = 120, base = new Float32Array(N * 3), pos = new Float32Array(N * 3), vel = [];
  for (let i = 0; i < N; i++) {
    base.set([rnd() * S, rnd() * 70, rnd() * S], i * 3);
    vel.push(1.5 + rnd() * 2, rnd() * 6);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ size: .32, color: new THREE.Color('#ffc2d4').multiplyScalar(1.2), transparent: true, opacity: .8, depthWrite: false })));
  const wrap = (v, c, s) => ((v - c + s / 2) % s + s) % s - s / 2 + c;
  anim.push(t => {
    for (let i = 0; i < N; i++) {
      const fall = vel[i * 2], ph = vel[i * 2 + 1];
      pos[i * 3] = wrap(base[i * 3] + t * 2.2 + Math.sin(t * .8 + ph) * 2, petalCenter.x, S);
      pos[i * 3 + 1] = wrap(base[i * 3 + 1] - t * fall, 35 + petalCenter.y * .5, 70);
      pos[i * 3 + 2] = wrap(base[i * 3 + 2] + Math.cos(t * .6 + ph) * 2, petalCenter.z, S);
    }
    geo.attributes.position.needsUpdate = true;
  });
}
