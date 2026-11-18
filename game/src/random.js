// A tiny seeded generator: one seed always draws the same skyline, the same sparks and the same
// mast heights, so a screenshot, a replay and a submitted run all show one fixed city.

export function makeRng(seed) {
  let state = (seed >>> 0) || 0x9e3779b9;
  const next = () => {
    state ^= state << 13; state >>>= 0;
    state ^= state >>> 17;
    state ^= state << 5; state >>>= 0;
    return state / 0x100000000;
  };
  next.range = (low, high) => low + (high - low) * next();
  next.int = (low, high) => Math.floor(next.range(low, high + 1));
  next.pick = (list) => list[Math.min(list.length - 1, Math.floor(next() * list.length))];
  next.chance = (p) => next() < p;
  return next;
}

// Three sine ripples that never repeat exactly: a shoreline that breathes and glints.
export function waveAt(x, t, amplitude, wavelength) {
  const k = (Math.PI * 2) / wavelength;
  return (
    Math.sin(x * k + t * 1.6) * amplitude +
    Math.sin(x * k * 2.3 - t * 2.4) * amplitude * 0.4 +
    Math.sin(x * k * 0.55 + t * 0.9) * amplitude * 0.7
  );
}