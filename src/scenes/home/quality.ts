export const isCoarsePointer = () => window.matchMedia('(pointer: coarse)').matches;

/** Cap device pixel ratio — retina at 2, touch devices at 1.5 to save fill rate. */
export const maxPixelRatio = () =>
  Math.min(window.devicePixelRatio || 1, isCoarsePointer() ? 1.5 : 2);

export const particleBudget = () => (isCoarsePointer() ? 500 : 1200);
