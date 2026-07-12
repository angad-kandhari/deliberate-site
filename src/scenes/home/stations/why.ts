import { AdditiveBlending, Group, Sprite, SpriteMaterial, Vector3 } from 'three';
import { glowTexture, glyphTexture, hash, tint, type Station } from '../lib';
import type { SceneTheme } from '../theme';

const GLYPHS = '{}[]()<>/;$#~%&*+=?'.split('');
const SPRITE_COUNT = 26;

/**
 * Sparse closing station: a large glow and drifting code glyphs. Glyph
 * textures wait for JetBrains Mono (with a timeout fallback to monospace)
 * so this is the only place the canvas-font risk lives — purely decorative.
 */
export function createWhy(theme: SceneTheme): Station {
  const group = new Group();
  let accent = theme.accent.clone();

  const glow = new Sprite(
    new SpriteMaterial({
      map: glowTexture(),
      color: accent.clone(),
      transparent: true,
      opacity: 0.4,
      blending: AdditiveBlending,
      depthWrite: false,
    })
  );
  glow.scale.setScalar(16);
  group.add(glow);

  const drifters: { sprite: Sprite; base: Vector3; phase: number; speed: number }[] = [];

  const fontReady = 'fonts' in document
    ? Promise.race([
        document.fonts.load('600 96px "JetBrains Mono"'),
        new Promise((res) => setTimeout(res, 1500)),
      ])
    : Promise.resolve();

  fontReady
    .catch(() => {})
    .then(() => {
      const family = '"JetBrains Mono", ui-monospace, monospace';
      const textures = GLYPHS.map((ch) => glyphTexture(ch, family));
      for (let i = 0; i < SPRITE_COUNT; i++) {
        const sprite = new Sprite(
          new SpriteMaterial({
            map: textures[i % textures.length],
            color: accent.clone(),
            transparent: true,
            opacity: 0.28 + hash(i) * 0.3,
            blending: AdditiveBlending,
            depthWrite: false,
          })
        );
        const base = new Vector3(
          (hash(i * 7 + 1) - 0.5) * 16,
          (hash(i * 7 + 2) - 0.5) * 9,
          (hash(i * 7 + 3) - 0.5) * 12
        );
        sprite.position.copy(base);
        sprite.scale.setScalar(0.7 + hash(i * 7 + 4) * 0.8);
        group.add(sprite);
        drifters.push({ sprite, base, phase: hash(i + 33) * Math.PI * 2, speed: 0.2 + hash(i + 66) * 0.4 });
      }
    });

  return {
    group,
    update(_sp, t) {
      group.rotation.y = t * 0.03;
      for (const d of drifters) {
        d.sprite.position.set(
          d.base.x + Math.sin(t * d.speed + d.phase) * 0.8,
          d.base.y + Math.sin(t * d.speed * 0.7 + d.phase * 2) * 0.6,
          d.base.z + Math.cos(t * d.speed * 0.5 + d.phase) * 0.8
        );
      }
    },
    setTheme(next) {
      accent = next.accent.clone();
      tint(group, next.accent);
    },
  };
}
