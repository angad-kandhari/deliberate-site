import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Group,
  LineBasicMaterial,
  LineLoop,
  Object3D,
  Sprite,
  SpriteMaterial,
  Vector3,
} from 'three';
import { clamp01, easeInOut, glowTexture, tint, type Station } from '../lib';
import type { SceneTheme } from '../theme';

const HALF = 2.6;

const FACE_NORMALS = [
  new Vector3(1, 0, 0),
  new Vector3(-1, 0, 0),
  new Vector3(0, 1, 0),
  new Vector3(0, -1, 0),
  new Vector3(0, 0, 1),
  new Vector3(0, 0, -1),
];

/** Package box whose six face outlines fly in and assemble as you scroll. */
export function createInstall(theme: SceneTheme): Station {
  const group = new Group();

  const square = new BufferGeometry();
  square.setAttribute(
    'position',
    new BufferAttribute(
      new Float32Array([-HALF, -HALF, 0, HALF, -HALF, 0, HALF, HALF, 0, -HALF, HALF, 0]),
      3
    )
  );

  const faces: { inner: Object3D; tiltDir: number }[] = [];
  const zAxis = new Vector3(0, 0, 1);
  FACE_NORMALS.forEach((normal, i) => {
    // Outer group turns face-local +z into the outward normal; the inner
    // object then only slides/tilts along local z during assembly.
    const outer = new Group();
    outer.quaternion.setFromUnitVectors(zAxis, normal);
    const inner = new Group();
    const outline = new LineLoop(
      square,
      new LineBasicMaterial({ color: theme.accent.clone(), transparent: true, opacity: 0.9 })
    );
    inner.add(outline);
    outer.add(inner);
    group.add(outer);
    faces.push({ inner, tiltDir: i % 2 ? 1 : -1 });
  });

  const glow = new Sprite(
    new SpriteMaterial({
      map: glowTexture(),
      color: theme.accent.clone(),
      transparent: true,
      opacity: 0.1,
      blending: AdditiveBlending,
      depthWrite: false,
    })
  );
  glow.scale.setScalar(8);
  group.add(glow);

  return {
    group,
    update(sp, t) {
      const e = easeInOut(clamp01((sp - 0.05) / 0.6));
      faces.forEach((f, i) => {
        f.inner.position.z = HALF + (1 - e) * 6;
        f.inner.rotation.x = (1 - e) * 0.9 * f.tiltDir + Math.sin(t * 0.7 + i) * 0.05 * (1 - e);
      });
      group.rotation.y = t * 0.12;
      glow.material.opacity = 0.1 + e * 0.3;
    },
    setTheme(next) {
      tint(group, next.accent);
    },
  };
}
