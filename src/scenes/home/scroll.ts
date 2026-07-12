import { clamp01, easeInOut } from './lib';

export interface ScrollFrame {
  /** Continuous camera station parameter (0..sections-1). */
  c: number;
  /** Per-section progress 0..1, from real (unsmoothed) scroll. */
  sps: number[];
}

/** Fraction of each section's span spent parked at its station before flying on. */
const DWELL = 0.5;

/**
 * Maps page scroll to camera progress. The camera chases scroll through a
 * frame-rate-independent lerp; panel progress (--sp) follows raw scroll so
 * sticky panels never lag the finger.
 */
export function createScrollController(sections: HTMLElement[]) {
  let tops: number[] = [];
  let maxY = 1;
  let smoothY = window.scrollY;
  const sps = sections.map(() => 0);
  const written = sections.map(() => -1);

  function measure() {
    const y = window.scrollY;
    tops = sections.map((el) => el.getBoundingClientRect().top + y);
    maxY = Math.max(
      document.documentElement.scrollHeight - window.innerHeight,
      tops[tops.length - 1] + 1
    );
  }
  measure();

  function spanEnd(i: number): number {
    return i < tops.length - 1 ? tops[i + 1] : maxY;
  }

  function cameraParam(y: number): number {
    const n = tops.length;
    if (y <= tops[0]) return 0;
    for (let i = 0; i < n; i++) {
      const start = tops[i];
      const end = spanEnd(i);
      if (y >= end) continue;
      if (i === n - 1) return i;
      const u = (y - start) / (end - start);
      return u <= DWELL ? i : i + easeInOut((u - DWELL) / (1 - DWELL));
    }
    return n - 1;
  }

  function update(dt: number): ScrollFrame {
    const y = window.scrollY;
    const dist = Math.abs(y - smoothY);
    // Boost the chase for big jumps (hash deep links) so flights stay brisk.
    const k = dist > window.innerHeight * 1.2 ? 9 : 4.5;
    smoothY = dist < 0.5 ? y : smoothY + (y - smoothY) * (1 - Math.exp(-k * dt));

    for (let i = 0; i < sections.length; i++) {
      sps[i] = clamp01((y - tops[i]) / (spanEnd(i) - tops[i]));
      const rounded = Math.round(sps[i] * 500) / 500;
      if (rounded !== written[i]) {
        written[i] = rounded;
        sections[i].style.setProperty('--sp', String(rounded));
      }
    }
    return { c: cameraParam(smoothY), sps };
  }

  return { update, measure };
}
