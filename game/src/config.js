// TIDELINE — the numbers that shape the swing, in one place.
// World units are CSS pixels at a 1x device ratio; the renderer scales for dense screens.

export const DESIGN = { width: 1200, height: 800 };

export const PHYSICS = {
  gravity: 1820,        // px per second squared, the only force while no rope holds
  maxSpeed: 1900,       // a hard ceiling, so a lucky release cannot tunnel through the city
  airDrag: 0.06,        // fraction of horizontal speed shed per second, keeps long flights honest
  ropeMin: 88,          // shortest a rope reels in to
  ropeReach: 520,       // longest throw that still finds a mast
  reelSpeed: 340,       // px per second the rope shortens while the button is held
  swingPump: 640,       // tangential push the arrow keys add while swinging
  attachGrace: 0.12,    // seconds after a release before a new throw is allowed
};

export const TIDE = {
  start: 648,           // world y of the waterline on the first frame
  creep: 14,            // px per second the flood climbs on its own
  perSpark: 26,         // px it jumps each time the play takes a spark
  foamDepth: 30,
};

export const COURSE = {
  startX: 200,
  length: 8200,         // x of the beacon
  sparks: 13,
  firstAnchor: 520,
  anchorGap: [330, 520],
  anchorHeight: [150, 460],
};

export const PALETTE = {
  skyTop: '#090615',
  skyMid: '#391b4d',
  skyLow: '#a8435a',
  sun: '#ffb066',
  sunCore: '#fff0c8',
  haze: '#f0855c',
  waterTop: '#150a22',
  waterDeep: '#05030b',
  window: '#ffd9a0',
  windowCool: '#8be8ff',
  neon: ['#ff4f9a', '#4fe3ff', '#ffd166', '#a97bff', '#7dffb0'],
  rope: '#9ff3ff',
  spark: '#ffe9a8',
  player: '#fff8e2',
  trail: '#ff9ad5',
  ui: '#f6efff',
  uiDim: '#9a90b8',
};