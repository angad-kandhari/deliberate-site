import { Clock, FogExp2, PerspectiveCamera, Scene, Vector3 } from 'three';
import { clamp01, type Station } from './lib';
import { onThemeChange, readTheme } from './theme';
import { createRenderer } from './renderer';
import { poseCamera, STATIONS } from './path';
import { createScrollController } from './scroll';
import { createWorld } from './world';
import { createHero } from './stations/hero';
import { createFoundation } from './stations/foundation';
import { createSkills } from './stations/skills';
import { createInstall } from './stations/install';
import { createWhy } from './stations/why';

const BASE_FOG = 0.016;

/**
 * Boot the immersive homepage scene. No-ops unless the inline gate in
 * Layout.astro decided this client should get it (WebGL available,
 * no reduced-motion preference).
 */
export function initHomeScene(): void {
  if (!document.documentElement.classList.contains('immersive')) return;
  const w = window as { __deliberateHomeScene?: boolean };
  if (w.__deliberateHomeScene) return;
  w.__deliberateHomeScene = true;

  const sectionEls = STATIONS.map((s) => document.getElementById(s.id));
  if (sectionEls.some((el) => !el)) return;

  const theme = readTheme();
  const { renderer, resize } = createRenderer();
  const scene = new Scene();
  const fog = new FogExp2(theme.paper.getHex(), BASE_FOG);
  scene.fog = fog;
  const camera = new PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 320);

  const world = createWorld(theme);
  scene.add(world.group);

  const hero = createHero(theme);
  const stations: Station[] = [
    hero,
    createFoundation(theme),
    createSkills(theme),
    createInstall(theme),
    createWhy(theme),
  ];
  stations.forEach((s, i) => {
    if (s !== hero) s.group.position.copy(STATIONS[i].center);
    scene.add(s.group);
  });

  const scroll = createScrollController(sectionEls as HTMLElement[]);

  onThemeChange((next) => {
    fog.color.copy(next.paper);
    world.setTheme(next);
    stations.forEach((s) => s.setTheme(next));
  });

  const mouse = { tx: 0, ty: 0, x: 0, y: 0 };
  window.addEventListener(
    'pointermove',
    (e) => {
      mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.ty = (e.clientY / window.innerHeight) * 2 - 1;
    },
    { passive: true }
  );

  window.addEventListener(
    'resize',
    () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      resize();
      scroll.measure();
    },
    { passive: true }
  );

  const look = new Vector3();
  const right = new Vector3();
  const up = new Vector3();
  const clock = new Clock();
  let rafId = 0;
  let running = false;

  function frame() {
    rafId = requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.1);
    const t = clock.elapsedTime;

    const { c, sps } = scroll.update(dt);
    poseCamera(c, camera, look);

    // Mouse parallax + idle sway, in the camera's previous-frame basis.
    mouse.x += (mouse.tx - mouse.x) * (1 - Math.exp(-3 * dt));
    mouse.y += (mouse.ty - mouse.y) * (1 - Math.exp(-3 * dt));
    right.set(1, 0, 0).applyQuaternion(camera.quaternion);
    up.set(0, 1, 0).applyQuaternion(camera.quaternion);
    camera.position
      .addScaledVector(right, mouse.x * 0.35)
      .addScaledVector(up, -mouse.y * 0.25 + Math.sin(t * 0.4) * 0.1);
    camera.lookAt(look);

    if (c < 0.12) hero.fitTo(camera);
    stations.forEach((s, i) => s.update(sps[i], t));
    // Space opens up at the closing station.
    fog.density = BASE_FOG - clamp01(sps[4] * 1.5) * 0.008;
    world.update(t);

    renderer.render(scene, camera);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(rafId);
      running = false;
    } else if (!running) {
      running = true;
      clock.getDelta(); // swallow the hidden gap
      frame();
    }
  });

  running = true;
  frame();
}
