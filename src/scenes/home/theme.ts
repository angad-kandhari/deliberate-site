import { Color } from 'three';

export interface SceneTheme {
  paper: Color;
  accent: Color;
  ink: Color;
  muted: Color;
  line: Color;
  dark: boolean;
}

let probe: HTMLElement | null = null;

/**
 * Resolve a CSS custom property to a concrete color. Tokens may be var()
 * chains or color-mix() expressions that THREE.Color can't parse, so we let
 * the browser compute them on a probe element and read back rgb().
 */
function resolve(varName: string): Color {
  if (!probe) {
    probe = document.createElement('span');
    probe.style.display = 'none';
    document.body.appendChild(probe);
  }
  probe.style.color = `var(${varName})`;
  return new Color().setStyle(getComputedStyle(probe).color);
}

export function readTheme(): SceneTheme {
  return {
    paper: resolve('--paper'),
    accent: resolve('--accent'),
    ink: resolve('--ink'),
    muted: resolve('--muted'),
    line: resolve('--line'),
    dark: document.documentElement.getAttribute('data-theme') === 'dark',
  };
}

/** Re-read tokens whenever the ThemeToggle flips data-theme on <html>. */
export function onThemeChange(cb: (theme: SceneTheme) => void): void {
  new MutationObserver(() => cb(readTheme())).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });
}
