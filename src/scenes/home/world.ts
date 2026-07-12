import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Group,
  LineBasicMaterial,
  LineSegments,
  Points,
  PointsMaterial,
} from 'three';
import { glowTexture, hash, tint } from './lib';
import type { SceneTheme } from './theme';
import { flightCurve } from './path';
import { particleBudget } from './quality';

const GRID_Y = -4;
const Z_NEAR = 30;
const Z_FAR = -280;

function gridFloor(theme: SceneTheme): LineSegments {
  const pts: number[] = [];
  for (let x = -60; x <= 60; x += 4) pts.push(x, GRID_Y, Z_NEAR, x, GRID_Y, Z_FAR);
  for (let z = Z_NEAR; z >= Z_FAR; z -= 4) pts.push(-60, GRID_Y, z, 60, GRID_Y, z);
  const geom = new BufferGeometry();
  geom.setAttribute('position', new BufferAttribute(new Float32Array(pts), 3));
  const mat = new LineBasicMaterial({
    color: theme.accent.clone(),
    transparent: true,
    opacity: 0.22,
  });
  return new LineSegments(geom, mat);
}

/** Ambient drift field, grid floor, and "packets" travelling the flight path. */
export function createWorld(theme: SceneTheme) {
  const group = new Group();
  const dot = glowTexture(64);

  group.add(gridFloor(theme));

  const count = particleBudget();
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (hash(i) - 0.5) * 52;
    positions[i * 3 + 1] = -3.5 + hash(i + 9e3) * 10.5;
    positions[i * 3 + 2] = Z_NEAR - 6 - hash(i + 5e4) * 282;
  }
  const particleGeom = new BufferGeometry();
  particleGeom.setAttribute('position', new BufferAttribute(positions, 3));
  const particles = new Points(
    particleGeom,
    new PointsMaterial({
      color: theme.accent.clone(),
      size: 0.35,
      map: dot,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      blending: AdditiveBlending,
      sizeAttenuation: true,
    })
  );
  group.add(particles);

  // Bright motes racing along the camera route — the "you are travelling" cue.
  const route = flightCurve.getSpacedPoints(720);
  const PACKETS = 24;
  const packetPos = new Float32Array(PACKETS * 3);
  const packetGeom = new BufferGeometry();
  packetGeom.setAttribute('position', new BufferAttribute(packetPos, 3));
  const packets = new Points(
    packetGeom,
    new PointsMaterial({
      color: theme.accent.clone(),
      size: 0.6,
      map: dot,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: AdditiveBlending,
      sizeAttenuation: true,
    })
  );
  group.add(packets);

  function update(t: number) {
    particles.position.y = Math.sin(t * 0.25) * 0.4;
    particles.position.x = Math.sin(t * 0.11) * 0.6;

    const attr = packetGeom.getAttribute('position') as BufferAttribute;
    for (let i = 0; i < PACKETS; i++) {
      const u = (hash(i + 777) + t * (0.006 + hash(i + 42) * 0.014)) % 1;
      const p = route[Math.floor(u * (route.length - 1))];
      // Offset below and beside the path so packets never sit inside the lens.
      attr.setXYZ(i, p.x + 2.2, p.y - 2.4, p.z);
    }
    attr.needsUpdate = true;
  }

  function setTheme(next: SceneTheme) {
    tint(group, next.accent);
  }

  return { group, update, setTheme };
}
