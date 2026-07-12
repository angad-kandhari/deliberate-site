import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Group,
  LineBasicMaterial,
  LineSegments,
  OctahedronGeometry,
  Vector3,
} from 'three';
import { edgeLines, hash, tint, type Station } from '../lib';
import type { SceneTheme } from '../theme';

/** 12 specialized skills in 5 category clusters, spoked to the foundation hub. */
const CLUSTERS: { dir: Vector3; n: number }[] = [
  { dir: new Vector3(1, 0.45, 0), n: 3 },
  { dir: new Vector3(-0.8, 0.7, 0.4), n: 3 },
  { dir: new Vector3(0.2, -0.8, 0.6), n: 2 },
  { dir: new Vector3(-0.6, -0.45, -0.7), n: 2 },
  { dir: new Vector3(0.7, 0.1, -0.8), n: 2 },
];

export function createSkills(theme: SceneTheme): Station {
  const group = new Group();

  const hub = edgeLines(new OctahedronGeometry(1.2), theme.accent, 0.95);
  group.add(hub);

  const cubeGeom = new BoxGeometry(0.9, 0.9, 0.9);
  const nodes: { obj: ReturnType<typeof edgeLines>; base: Vector3; phase: number }[] = [];
  let idx = 0;
  for (const cluster of CLUSTERS) {
    const base = cluster.dir.clone().normalize().multiplyScalar(5.6);
    for (let i = 0; i < cluster.n; i++) {
      const cube = edgeLines(cubeGeom, theme.accent, 0.85);
      const spread = new Vector3(
        (hash(idx * 3 + 1) - 0.5) * 3.2,
        (hash(idx * 3 + 2) - 0.5) * 3.2,
        (hash(idx * 3 + 3) - 0.5) * 3.2
      );
      cube.position.copy(base).add(spread);
      cube.rotation.set(hash(idx) * Math.PI, hash(idx + 50) * Math.PI, 0);
      group.add(cube);
      nodes.push({ obj: cube, base: cube.position.clone(), phase: hash(idx + 99) * Math.PI * 2 });
      idx++;
    }
  }

  // Spokes hub → cubes; endpoints follow the bobbing cubes each frame.
  const spokePos = new Float32Array(nodes.length * 6);
  const spokeGeom = new BufferGeometry();
  spokeGeom.setAttribute('position', new BufferAttribute(spokePos, 3));
  const spokes = new LineSegments(
    spokeGeom,
    new LineBasicMaterial({ color: theme.accent.clone(), transparent: true, opacity: 0.28 })
  );
  group.add(spokes);

  return {
    group,
    update(sp, t) {
      group.rotation.y = t * 0.07 + sp * 0.8;
      hub.rotation.y = t * 0.5;
      hub.rotation.z = t * 0.2;
      const attr = spokeGeom.getAttribute('position') as BufferAttribute;
      nodes.forEach((n, i) => {
        n.obj.position.y = n.base.y + Math.sin(t * 0.8 + n.phase) * 0.3;
        n.obj.rotation.y += 0.0015;
        attr.setXYZ(i * 2, 0, 0, 0);
        attr.setXYZ(i * 2 + 1, n.obj.position.x, n.obj.position.y, n.obj.position.z);
      });
      attr.needsUpdate = true;
    },
    setTheme(next) {
      tint(group, next.accent);
    },
  };
}
