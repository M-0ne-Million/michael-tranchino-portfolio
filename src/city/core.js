import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';

export { THREE };
export const V3 = THREE.Vector3;
export const V2 = THREE.Vector2;
export const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const mobile = matchMedia('(max-width: 767px)').matches;

export const ACCENT = new THREE.Color('#f0462b');
export const GOLD = new THREE.Color('#e8b04f');
export const LANTERN = new THREE.Color('#ffb15a');

let seed = 11;
export const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

// Per-frame callbacks: (time, dt) => void
export const anim = [];

/* ---------- renderer, scene, post ---------- */
export const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('city'), antialias: false, powerPreference: 'high-performance' });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;

export const scene = new THREE.Scene();
scene.background = new THREE.Color('#070812');
scene.fog = new THREE.FogExp2('#0a0c19', 0.0026);
export const camera = new THREE.PerspectiveCamera(mobile ? 62 : 48, innerWidth / innerHeight, 0.5, 2500);

scene.add(new THREE.HemisphereLight('#5a5f9a', '#0b0810', 0.75));
const moonLight = new THREE.DirectionalLight('#dfe2ff', 0.9);
moonLight.position.set(520, 330, -420);
scene.add(moonLight);

export const labelRenderer = new CSS2DRenderer({ element: document.getElementById('labels') });
labelRenderer.setSize(innerWidth, innerHeight);

export const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new V2(innerWidth, innerHeight), 0.8, 0.5, 0.42);
composer.addPass(bloom);
composer.addPass(new OutputPass());

/* ---------- adaptive quality ---------- */
// Tiers trade resolution and bloom for frame rate. Phones start one tier down; any device
// that can't hold ~45 fps steps down further (never back up, to avoid flicker).
const TIERS = [
  { dpr: 1.75, bloom: 1 },
  { dpr: 1.25, bloom: .5 },
  { dpr: 1, bloom: 0 },
  { dpr: .75, bloom: 0 },
];
let tier = mobile ? 1 : 0;
const bloomSetSize = bloom.setSize.bind(bloom);
bloom.setSize = (w, h) => {
  const k = TIERS[tier].bloom || .5;
  bloomSetSize(Math.max(1, Math.round(w * k)), Math.max(1, Math.round(h * k)));
};

export function resize() {
  const dpr = Math.min(devicePixelRatio, TIERS[tier].dpr);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(dpr);
  renderer.setSize(innerWidth, innerHeight);
  composer.setPixelRatio(dpr);
  composer.setSize(innerWidth, innerHeight);
  labelRenderer.setSize(innerWidth, innerHeight);
}
resize();

export function render() {
  if (TIERS[tier].bloom) composer.render();
  else renderer.render(scene, camera);
}

let acc = 0, frames = 0, warmup = 1.5;
export function adapt(dt) {
  if ((warmup -= dt) > 0 || tier === TIERS.length - 1 || document.hidden) return;
  acc += dt;
  if (++frames < 90) return;
  if (acc / frames > 1 / 45) {
    tier++;
    resize();
    warmup = 1.5;
  }
  acc = frames = 0;
}

/* ---------- materials ---------- */
export const U = { uTime: { value: 0 }, uAccent: { value: ACCENT.clone() } };
const HASH = 'float h13(vec3 p){p=fract(p*.1031);p+=dot(p,p.zyx+31.32);return fract((p.x+p.y)*p.z);}\n';

// Injects world position/normal so window and road patterns stay crisp at any scale.
function worldPatch(mat, key, body) {
  mat.customProgramCacheKey = () => key;
  mat.onBeforeCompile = sh => {
    sh.uniforms.uTime = U.uTime;
    sh.uniforms.uAccent = U.uAccent;
    sh.vertexShader = 'varying vec3 vWPos;\nvarying vec3 vWN;\n' + sh.vertexShader.replace('#include <project_vertex>', `#include <project_vertex>
      vec4 wp_ = vec4(transformed, 1.0); vec3 wn_ = objectNormal;
      #ifdef USE_INSTANCING
        wp_ = instanceMatrix * wp_; wn_ = mat3(instanceMatrix) * wn_;
      #endif
      vWPos = (modelMatrix * wp_).xyz; vWN = normalize(mat3(modelMatrix) * wn_);`);
    sh.fragmentShader = 'varying vec3 vWPos;\nvarying vec3 vWN;\nuniform float uTime;\nuniform vec3 uAccent;\n' + HASH +
      sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n' + body);
  };
  return mat;
}

// Shoji-style windows: warm paper light split by a lattice, a few vermilion ones.
const WINDOWS = `{
  vec3 an = abs(vWN);
  if (an.y < .5) {
    bool xf = an.x > an.z;
    vec2 c = xf ? vWPos.zy : vWPos.xy;
    float other = xf ? vWPos.x : vWPos.z;
    vec2 g = c / vec2(2.2, 2.4);
    vec2 id = floor(g); vec2 f = fract(g);
    float w = step(.14, f.x) * step(f.x, .86) * step(.3, f.y) * step(f.y, .78);
    vec2 q = fract((f - vec2(.14, .3)) / vec2(.72, .48) * vec2(3., 2.));
    float lattice = step(.09, q.x) * step(.1, q.y);
    float r = h13(vec3(id, floor(other * 2.)));
    float lit = step(.72, r);
    vec3 col = r > .975 ? uAccent * 1.5 : mix(vec3(1., .66, .36), vec3(1., .9, .76), h13(vec3(id.yx, 3.))) * .5;
    float flick = r > .993 ? step(.5, fract(uTime * .5 + r * 13.)) : 1.;
    totalEmissiveRadiance += w * mix(.25, 1., lattice) * lit * col * flick * smoothstep(.6, 2.2, vWPos.y);
  }
}`;
// Roman grid: cardo and decumanus maximus glow gold, the rest are vermilion lanes.
const ROADS = `{
  vec2 p = vWPos.xz;
  vec2 g = abs(fract(p / 16. + .5) - .5) * 16.;
  float m = min(g.x, g.y);
  float along = g.x < g.y ? p.y : p.x;
  float road = 1. - smoothstep(1.7, 2.1, m);
  float lane = 1. - smoothstep(.05, .16, m);
  float dash = step(.55, fract(along / 3.));
  float fade = exp(-length(p) / 170.);
  float pulse = smoothstep(.965, 1., fract(along / 70. - uTime * .12 + h13(vec3(floor(p / 16.), 1.))));
  float axis = (1. - smoothstep(.12, .4, abs(p.x))) + (1. - smoothstep(.12, .4, abs(p.y)));
  totalEmissiveRadiance += uAccent * lane * (dash * .3 + pulse * 2.6) * fade + vec3(.3, .28, .5) * road * .035 * fade
    + vec3(1., .72, .36) * axis * .8 * exp(-length(p) / 240.);
}`;
// Marble lit from below, like monuments at night.
const MARBLE = `{
  totalEmissiveRadiance += vec3(1., .7, .45) * .2 * exp(-max(vWPos.y, 0.) * .08);
}`;

export const bMat = worldPatch(new THREE.MeshStandardMaterial({ color: '#0f0e14', roughness: .55, metalness: .55 }), 'windows', WINDOWS);
export const groundMat = worldPatch(new THREE.MeshStandardMaterial({ color: '#08080f', roughness: .38, metalness: .8 }), 'roads', ROADS);
export const marble = worldPatch(new THREE.MeshStandardMaterial({ color: '#77726c', roughness: .5, metalness: .05 }), 'marble', MARBLE);
export const darkMat = new THREE.MeshStandardMaterial({ color: '#0d0c12', roughness: .6, metalness: .5 });
export const roofMat = new THREE.MeshStandardMaterial({ color: '#16131c', roughness: .42, metalness: .75, side: THREE.DoubleSide });
export const lacquer = new THREE.MeshStandardMaterial({ color: '#c8341f', emissive: '#c8341f', emissiveIntensity: .6, roughness: .35 });
// Shared per colour and intensity, so merged geometry can batch them (clone before animating one).
const hotCache = new Map();
export const hot = (c = ACCENT, k = 3) => {
  const key = new THREE.Color(c).getHexString() + k;
  if (!hotCache.has(key)) hotCache.set(key, new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(k) }));
  return hotCache.get(key);
};
export const glow = (o = 1, c = ACCENT) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false });

/* ---------- shared geometry + builders ---------- */
export const BOX = new THREE.BoxGeometry(1, 1, 1);
const CYL = new THREE.CylinderGeometry(1, 1, 1, 14);
// Pagoda roof: square plan, concave pitch, eaves flicking up at the edge.
export const ROOF = new THREE.LatheGeometry([[.86, 0], [1, .16], [.74, .34], [.46, .62], [.18, 1]].map(([x, y]) => new V2(x, y)), 4, Math.PI / 4);
const EAVE = new THREE.BufferGeometry().setFromPoints([0, 1, 2, 3].map(k => {
  const a = Math.PI / 4 + k * Math.PI / 2;
  return new V3(Math.sin(a), .16, Math.cos(a));
}));
const eaveMat = new THREE.LineBasicMaterial({ color: GOLD.clone().multiplyScalar(2.2) });
export const GABLE = new THREE.ExtrudeGeometry(new THREE.Shape([new V2(-.5, 0), new V2(.5, 0), new V2(0, .5)]), { depth: 1, bevelEnabled: false }).translate(0, 0, -.5);

export function box(parent, x, z, w, h, d, mat = bMat, y = 0) {
  const m = new THREE.Mesh(BOX, mat);
  m.scale.set(w, h, d);
  m.position.set(x, y + h / 2, z);
  parent.add(m);
  return m;
}

export function cyl(parent, x, z, r, h, mat = marble, y = 0, rt = r) {
  const tapered = rt !== r;
  const m = new THREE.Mesh(tapered ? new THREE.CylinderGeometry(rt, r, 1, 14) : CYL, mat);
  m.scale.set(tapered ? 1 : r, h, tapered ? 1 : r);
  m.position.set(x, y + h / 2, z);
  parent.add(m);
  return m;
}

export function roof(parent, x, y, z, R, h, eave = true) {
  const m = new THREE.Mesh(ROOF, roofMat);
  m.scale.set(R, h, R);
  m.position.set(x, y, z);
  parent.add(m);
  if (eave) {
    const l = new THREE.LineLoop(EAVE, eaveMat);
    l.scale.copy(m.scale);
    l.position.copy(m.position);
    parent.add(l);
  }
  return m;
}

export function column(parent, x, z, r, h, y = 0) {
  box(parent, x, z, r * 2.6, r * .7, r * 2.6, marble, y);
  cyl(parent, x, z, r, h - r * 1.4, marble, y + r * .7, r * .88);
  box(parent, x, z, r * 2.8, r * .7, r * 2.8, marble, y + h - r * .7);
}

export function torii(parent, x, z, w, h, rotY = 0) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  parent.add(g);
  const r = w * .045;
  for (const s of [-1, 1]) cyl(g, s * w * .36, 0, r, h * .97, lacquer);
  box(g, 0, 0, w * .9, h * .06, r * 1.5, lacquer, h * .7);
  box(g, 0, 0, w * 1.04, h * .06, r * 2.2, lacquer, h * .86);
  for (const s of [-1, 1]) box(g, s * w * .28, 0, w * .62, h * .075, r * 2.8, darkMat, h * .93).rotation.z = s * .07;
  return g;
}

export function group(d) {
  const g = new THREE.Group();
  g.position.copy(d.v);
  scene.add(g);
  return g;
}
