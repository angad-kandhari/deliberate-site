import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Group,
  Line,
  LineBasicMaterial,
  MathUtils,
  PerspectiveCamera,
  Vector3,
} from 'three';
import { edgeLines, tint, type Station } from '../lib';
import type { SceneTheme } from '../theme';

/** How far in front of the camera the DOM terminal's plane sits (world units). */
const FIT_DISTANCE = 11;

export interface HeroStation extends Station {
  /** Size/place the bezel so it wraps the DOM terminal panel on screen. */
  fitTo(camera: PerspectiveCamera): void;
}

/**
 * A wireframe CRT shell built in unit space and scaled to the real DOM
 * terminal's bounding rect each frame while the camera is at the hero
 * station. Once the camera departs, the last fit is left frozen in world
 * space so the shell visibly recedes behind you.
 */
export function createHero(theme: SceneTheme): HeroStation {
  const group = new Group();

  const shell = edgeLines(new BoxGeometry(1, 1, 1), theme.accent, 0.8);
  shell.position.z = -0.5; // front face at local z=0, body extruded backwards

  const divider = new BufferGeometry();
  divider.setAttribute(
    'position',
    new BufferAttribute(new Float32Array([-0.5, 0.42, 0, 0.5, 0.42, 0]), 3)
  );
  const bar = new Line(
    divider,
    new LineBasicMaterial({ color: theme.accent.clone(), transparent: true, opacity: 0.6 })
  );

  group.add(shell, bar);

  const fwd = new Vector3();
  const right = new Vector3();
  const up = new Vector3();
  let panel: HTMLElement | null | undefined;

  function fitTo(camera: PerspectiveCamera) {
    if (panel === undefined) panel = document.querySelector<HTMLElement>('.screen');
    if (!panel) return;
    const rect = panel.getBoundingClientRect();
    if (rect.width === 0) return;

    const viewH = 2 * FIT_DISTANCE * Math.tan(MathUtils.degToRad(camera.fov) / 2);
    const viewW = viewH * camera.aspect;
    const cx = ((rect.left + rect.width / 2) / window.innerWidth) * 2 - 1;
    const cy = -((rect.top + rect.height / 2) / window.innerHeight) * 2 + 1;

    fwd.set(0, 0, -1).applyQuaternion(camera.quaternion);
    right.set(1, 0, 0).applyQuaternion(camera.quaternion);
    up.set(0, 1, 0).applyQuaternion(camera.quaternion);

    const w = (rect.width / window.innerWidth) * viewW;
    const h = (rect.height / window.innerHeight) * viewH;

    group.quaternion.copy(camera.quaternion);
    group.scale.set(w * 1.05, h * 1.1, w * 0.28);
    group.position
      .copy(camera.position)
      .addScaledVector(fwd, FIT_DISTANCE)
      .addScaledVector(right, (cx * viewW) / 2)
      .addScaledVector(up, (cy * viewH) / 2);
  }

  return {
    group,
    fitTo,
    update() {},
    setTheme(next) {
      tint(group, next.accent);
    },
  };
}
