import { WebGLRenderer } from 'three';
import { maxPixelRatio } from './quality';

/**
 * Transparent full-viewport canvas behind the page. z-index -1 keeps it
 * under all in-flow content while the body background (propagated to the
 * viewport) still paints behind it, so light/dark flips are free.
 */
export function createRenderer() {
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, {
    position: 'fixed',
    inset: '0',
    zIndex: '-1',
    pointerEvents: 'none',
    display: 'block',
  });

  const renderer = new WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setClearColor(0x000000, 0);

  const resize = () => {
    renderer.setPixelRatio(maxPixelRatio());
    renderer.setSize(window.innerWidth, window.innerHeight);
  };
  resize();
  document.body.prepend(canvas);

  return { renderer, canvas, resize };
}
