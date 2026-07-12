import { AdditiveBlending, BoxGeometry, Group, OctahedronGeometry, Sprite, SpriteMaterial } from 'three';
import { edgeLines, glowTexture, tint, type Station } from '../lib';
import type { SceneTheme } from '../theme';

/** Wireframe monolith with an inner core and a ring of nine principle ticks. */
export function createFoundation(theme: SceneTheme): Station {
  const group = new Group();

  const monolith = edgeLines(new BoxGeometry(6, 9, 6), theme.accent, 0.9);
  const core = edgeLines(new OctahedronGeometry(2.4), theme.accent, 0.7);

  const ring = new Group();
  for (let i = 0; i < 9; i++) {
    const tick = edgeLines(new BoxGeometry(0.18, 1.2, 0.18), theme.accent, 0.85);
    const a = (i / 9) * Math.PI * 2;
    tick.position.set(Math.cos(a) * 6.6, 0, Math.sin(a) * 6.6);
    ring.add(tick);
  }

  const glow = new Sprite(
    new SpriteMaterial({
      map: glowTexture(),
      color: theme.accent.clone(),
      transparent: true,
      opacity: 0.3,
      blending: AdditiveBlending,
      depthWrite: false,
    })
  );
  glow.scale.setScalar(10);

  group.add(monolith, core, ring, glow);

  return {
    group,
    update(sp, t) {
      monolith.rotation.y = Math.sin(t * 0.1) * 0.06;
      core.rotation.y = t * 0.4 + sp * 2.5;
      core.rotation.x = t * 0.17;
      ring.rotation.y = -t * 0.06 - sp * Math.PI;
    },
    setTheme(next) {
      tint(group, next.accent);
    },
  };
}
