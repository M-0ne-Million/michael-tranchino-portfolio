import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { THREE } from './core.js';

/*
 * Collapse every static mesh and line that shares a material into a single draw call.
 * The city is built from hundreds of small pieces (columns, torii, roofs, rings); merged,
 * it renders with a few dozen draw calls, which is what keeps phones smooth.
 * Anything flagged userData.dynamic (and its children) is left untouched.
 */
export function mergeStatic(scene) {
  scene.updateMatrixWorld(true);
  const meshes = new Map(), lines = new Map(), merged = [];
  const bucket = (map, o) => {
    if (!map.has(o.material)) map.set(o.material, []);
    map.get(o.material).push(o);
  };
  const walk = o => {
    if (o.userData.dynamic) return;
    const m = o.material;
    if (m && !Array.isArray(m) && !m.transparent) {
      if (o.isMesh && !o.isInstancedMesh) bucket(meshes, o);
      else if (o.isLine && !m.isLineDashedMaterial) bucket(lines, o);
    }
    o.children.forEach(walk);
  };
  walk(scene);

  for (const [material, list] of meshes) {
    if (list.length < 2) continue;
    const geos = list.map(o => {
      const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
      for (const name of Object.keys(g.attributes)) if (name !== 'position' && name !== 'normal') g.deleteAttribute(name);
      g.morphAttributes = {};
      g.clearGroups();
      return g.applyMatrix4(o.matrixWorld);
    });
    const geo = mergeGeometries(geos, false);
    geos.forEach(g => g.dispose());
    if (!geo) continue;
    merged.push(new THREE.Mesh(geo, material));
    list.forEach(o => o.removeFromParent());
  }

  const v = new THREE.Vector3(), w = new THREE.Vector3();
  for (const [material, list] of lines) {
    if (list.length < 2) continue;
    const out = [];
    for (const o of list) {
      const p = o.geometry.attributes.position, n = p.count, mw = o.matrixWorld;
      const push = (i, j) => {
        v.fromBufferAttribute(p, i).applyMatrix4(mw);
        w.fromBufferAttribute(p, j).applyMatrix4(mw);
        out.push(v.x, v.y, v.z, w.x, w.y, w.z);
      };
      if (o.isLineSegments) for (let i = 0; i + 1 < n; i += 2) push(i, i + 1);
      else {
        for (let i = 0; i + 1 < n; i++) push(i, i + 1);
        if (o.isLineLoop) push(n - 1, 0);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(out, 3));
    merged.push(new THREE.LineSegments(geo, material));
    list.forEach(o => o.removeFromParent());
  }

  merged.forEach(o => {
    o.matrixAutoUpdate = false;
    o.updateMatrix();
    scene.add(o);
  });
}
