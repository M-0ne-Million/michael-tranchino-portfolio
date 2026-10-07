import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { V3, U, mobile, reduce, anim, scene, camera, composer, labelRenderer, resize } from './core.js';
import { DISTRICTS, BUILDERS, CORE_VIEW, radial, getPowerLine } from './landmarks.js';
import { buildCircus } from './circus.js';
import { petalCenter, buildSky, buildSkyline, buildTraffic, buildLanterns, buildPetals } from './atmosphere.js';
import { goTo } from '../tour.js';

const TAU = Math.PI * 2;
const KEYS = ['th', 'R', 'H', 'tth', 'tr', 'ty', 'shift'];
const HOLD = .2; // the camera rests at each district while its panel is being read

// One shot per tour stop, in polar coordinates around the city centre, so moving between
// shots is always a calm orbit in the same direction.
function makeShots(stops) {
  let prevTh = -Infinity;
  return stops.map(sec => {
    let s;
    if (sec.id === 'hero') {
      s = { th: -3.95, R: mobile ? 380 : 330, H: mobile ? 260 : 190, tth: CORE_VIEW, tr: 0, ty: 12, shift: mobile ? 0 : -75 };
    } else {
      const d = DISTRICTS.find(x => x.id === sec.id);
      const dr = Math.hypot(d.v.x, d.v.z);
      const th = d.id === 'core' ? CORE_VIEW : radial(d) + (d.dth ?? 0);
      s = {
        th, R: dr + (d.r ?? 56) * (mobile ? 1.35 : 1), H: d.h ?? 26,
        tth: d.id === 'core' ? th : radial(d), tr: dr, ty: (d.ty ?? 16) - (mobile ? 14 : 0),
        shift: mobile ? 0 : d.sh ?? -15,
      };
    }
    while (s.th < prevTh) { s.th += TAU; s.tth += TAU; }
    prevTh = s.th;
    return s;
  });
}

function shotAt(shots, p, out) {
  const i = Math.min(Math.floor(p), shots.length - 2);
  const t = Math.min(1, Math.max(0, (p - i - HOLD) / (1 - 2 * HOLD)));
  const e = t * t * t * (t * (t * 6 - 15) + 10);
  for (const k of KEYS) out[k] = shots[i][k] + (shots[i + 1][k] - shots[i][k]) * e;
  return out;
}

export function startCity(tour, onFirstFrame) {
  buildSky();
  DISTRICTS.forEach(d => (d.id === 'circuit' ? buildCircus : BUILDERS[d.id])(d));
  buildSkyline(getPowerLine());
  buildTraffic();
  buildLanterns();
  buildPetals();

  const tags = DISTRICTS.map(d => {
    const el = document.createElement('div');
    el.className = 'tag off';
    el.innerHTML = `${d.name}<span lang="ja">${d.kj}</span>`;
    el.addEventListener('click', () => goTo(d.id));
    const o = new CSS2DObject(el);
    o.position.set(d.v.x, d.lh, d.v.z);
    scene.add(o);
    return el;
  });
  const highlight = id => tags.forEach((el, k) => {
    el.classList.toggle('dim', DISTRICTS[k].id !== id);
    el.classList.toggle('off', id === 'hero');
  });
  tour.onActive(highlight);
  highlight(tour.stops[Math.max(0, tour.active)].id);

  const shots = makeShots(tour.stops);
  const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
  addEventListener('pointermove', e => { pointer.x = e.clientX / innerWidth - .5; pointer.y = e.clientY / innerHeight - .5; }, { passive: true });
  addEventListener('resize', resize);

  const camPos = new V3(), camTgt = new V3(), up = new V3(0, 1, 0), right = new V3(), cur = {};
  let prog = 0, intro = reduce ? 1 : 0;

  function updateCamera(dt) {
    prog = reduce ? tour.progTarget : prog + (tour.progTarget - prog) * (1 - Math.exp(-dt * 2.4));
    shotAt(shots, prog, cur);
    if (intro < 1) { // descent from orbit on first load
      intro = Math.min(1, intro + dt / 4);
      const k = 1 - Math.pow(1 - intro, 3);
      cur.th -= (1 - k) * .9;
      cur.R *= 1 + (1 - k) * .8;
      cur.H += (1 - k) * 380;
    }
    camPos.set(Math.cos(cur.th) * cur.R, cur.H, Math.sin(cur.th) * cur.R);
    camTgt.set(Math.cos(cur.tth) * cur.tr, cur.ty, Math.sin(cur.tth) * cur.tr);
    petalCenter.copy(camTgt).lerp(camPos, .35);
    right.subVectors(camTgt, camPos).cross(up).normalize();
    camTgt.addScaledVector(right, cur.shift);
    pointer.sx += (pointer.x - pointer.sx) * (1 - Math.exp(-dt * 2));
    pointer.sy += (pointer.y - pointer.sy) * (1 - Math.exp(-dt * 2));
    if (!reduce && !mobile) camPos.addScaledVector(right, pointer.sx * 3).addScaledVector(up, -pointer.sy * 2);
    camera.position.copy(camPos);
    camera.lookAt(camTgt);
  }

  let last = performance.now(), time = 0, first = true;
  function frame(now) {
    const dt = Math.min(.05, Math.max(0, (now - last) / 1000)); // rAF timestamps can precede `last`
    last = now;
    const step = reduce ? dt * .25 : dt;
    time += step;
    U.uTime.value = time;
    anim.forEach(f => f(time, step));
    updateCamera(dt);
    composer.render();
    labelRenderer.render(scene, camera);
    if (first) { first = false; onFirstFrame(); }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
