import { CatmullRomCurve3, PerspectiveCamera, Vector3 } from 'three';
import { clamp01, easeInOut } from './lib';

export interface StationDef {
  /** Matches the section id in index.astro. */
  id: string;
  /** Where the station structure sits. */
  center: Vector3;
  /** Where the camera parks to view it. */
  view: Vector3;
}

/** Stations descend into -Z; camera viewpoints alternate sides for an S-curve. */
export const STATIONS: StationDef[] = [
  { id: 'hero',       center: new Vector3(0, 0, 0),        view: new Vector3(0, 0.6, 14) },
  { id: 'foundation', center: new Vector3(-14, 0, -60),    view: new Vector3(-7, 1, -47) },
  { id: 'skills',     center: new Vector3(14, 1, -120),    view: new Vector3(9, 1.5, -106) },
  { id: 'install',    center: new Vector3(-10, -1, -180),  view: new Vector3(-4, 0.5, -166) },
  { id: 'why',        center: new Vector3(0, 2, -240),     view: new Vector3(0, 2, -228) },
];

export const flightCurve = new CatmullRomCurve3(
  STATIONS.map((s) => s.view),
  false,
  'centripetal'
);

const SEGMENTS = STATIONS.length - 1;

/**
 * Sideways gaze bias per station (world units along camera-right). The HUD
 * panels slide aside on wide screens; this pushes each structure toward the
 * empty half of the frame instead of hiding it behind the panel.
 */
const LOOK_BIAS = [0, 5, -5, 5, 0];

// Panels only slide aside on wide viewports (matches the CSS breakpoint);
// keep the structures centered behind the panel on narrow screens.
const wideViewport = window.matchMedia('(min-width: 90rem)');
let biasScale = wideViewport.matches ? 1 : 0;
wideViewport.addEventListener('change', () => {
  biasScale = wideViewport.matches ? 1 : 0;
});

const _dir = new Vector3();
const _right = new Vector3();
const UP = new Vector3(0, 1, 0);

/**
 * Pose the camera for a continuous station parameter c ∈ [0, SEGMENTS]:
 * integer values park at a station's viewpoint looking at its structure;
 * fractional values fly the curve while the gaze hands over to the next stop.
 */
export function poseCamera(c: number, camera: PerspectiveCamera, lookTarget: Vector3): void {
  const cc = Math.min(Math.max(c, 0), SEGMENTS);
  flightCurve.getPoint(cc / SEGMENTS, camera.position);
  const i = Math.min(Math.floor(cc), SEGMENTS - 1);
  const f = easeInOut(clamp01(cc - i));
  lookTarget.lerpVectors(STATIONS[i].center, STATIONS[i + 1].center, f);

  const bias = (LOOK_BIAS[i] + (LOOK_BIAS[i + 1] - LOOK_BIAS[i]) * f) * biasScale;
  if (bias !== 0) {
    _dir.subVectors(lookTarget, camera.position).normalize();
    _right.crossVectors(_dir, UP).normalize();
    lookTarget.addScaledVector(_right, bias);
  }
}
