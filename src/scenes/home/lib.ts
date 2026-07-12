import {
  BufferGeometry,
  CanvasTexture,
  Color,
  EdgesGeometry,
  Group,
  LineBasicMaterial,
  LineSegments,
  Object3D,
  SRGBColorSpace,
} from 'three';
import type { SceneTheme } from './theme';

/** One stop on the flight path. Groups are positioned by the entry module. */
export interface Station {
  group: Group;
  /** sp: 0→1 progress through the station's scroll span; t: elapsed seconds. */
  update(sp: number, t: number): void;
  setTheme(theme: SceneTheme): void;
}

export const clamp01 = (x: number) => Math.min(Math.max(x, 0), 1);
export const easeInOut = (x: number) => x * x * (3 - 2 * x);

/** Deterministic pseudo-random in [0,1) — keeps scene layout stable across loads. */
export const hash = (i: number) => {
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

/** Soft radial glow, drawn white so materials can tint it per theme. */
export function glowTexture(size = 128): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.35, 'rgba(255,255,255,0.4)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

/** A single character drawn white on transparent, for tintable glyph sprites. */
export function glyphTexture(ch: string, fontFamily: string, size = 96): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d')!;
  g.font = `600 ${Math.round(size * 0.72)}px ${fontFamily}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = '#ffffff';
  g.fillText(ch, size / 2, size / 2);
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

/** Wireframe edges of a geometry as a fog-aware line object. */
export function edgeLines(geometry: BufferGeometry, color: Color, opacity = 1): LineSegments {
  const mat = new LineBasicMaterial({ color: color.clone(), transparent: true, opacity });
  return new LineSegments(new EdgesGeometry(geometry), mat);
}

/** Recolor every material under a root — the world is monochrome accent by design. */
export function tint(root: Object3D, color: Color): void {
  root.traverse((o) => {
    const mat = (o as { material?: { color?: Color } }).material;
    if (mat?.color) mat.color.copy(color);
  });
}
