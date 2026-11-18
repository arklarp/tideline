// The city is drawn once into a few offscreen strips and then repeated with parallax: three
// distances of towers, each hazier and smaller than the one in front, so the swing reads as
// movement even when the pilot hangs still.

import { PALETTE } from './config.js';
import { waveAt } from './random.js';

export const TILE = 2400;
export const HORIZON = 660;

const LAYERS = [
  { factor: 0.16, baseY: 636, height: [70, 210], width: [34, 92], fill: '#2a1739', wash: 0.55, windows: 0.05, lights: 0.1 },
  { factor: 0.34, baseY: 656, height: [120, 320], width: [50, 120], fill: '#1b0f2a', wash: 0.28, windows: 0.12, lights: 0.22 },
  { factor: 0.58, baseY: 690, height: [200, 470], width: [70, 160], fill: '#0d0718', wash: 0.1, windows: 0.2, lights: 0.4 },
];

function makeStrip() {
  const canvas = document.createElement('canvas');
  canvas.width = TILE;
  canvas.height = 900;
  return canvas;
}

function paintLayer(rng, spec) {
  const canvas = makeStrip();
  const ctx = canvas.getContext('2d');
  let x = -60;
  while (x < TILE + 60) {
    const width = rng.range(spec.width[0], spec.width[1]);
    const top = spec.baseY - rng.range(spec.height[0], spec.height[1]);
    const gap = rng.range(6, 34);
    const body = ctx.createLinearGradient(0, top, 0, spec.baseY);
    body.addColorStop(0, spec.fill);
    body.addColorStop(1, '#07040e');
    ctx.fillStyle = body;
    ctx.fillRect(x, top, width, spec.baseY - top + 30);

    // A roof deck, then the small things that make a skyline read as inhabited.
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fillRect(x, top, width, 3);
    if (rng.chance(0.45)) {
      const mastX = x + width * rng.range(0.2, 0.8);
      const mastTop = top - rng.range(18, 70);
      ctx.fillStyle = 'rgba(255,255,255,0.07)';
      ctx.fillRect(mastX, mastTop, 2, top - mastTop);
      const neon = rng.pick(PALETTE.neon);
      ctx.fillStyle = neon;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.arc(mastX + 1, mastTop, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    if (rng.chance(0.3)) {
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      ctx.fillRect(x + width * 0.12, top - rng.range(8, 26), width * 0.5, 6);
    }

    // Windows: a grid of small warm and cool rectangles, mostly dark.
    const cols = Math.max(1, Math.floor(width / 16));
    const rows = Math.max(1, Math.floor((spec.baseY - top) / 20));
    for (let c = 0; c < cols; c += 1) {
      for (let r = 0; r < rows; r += 1) {
        if (!rng.chance(spec.windows)) continue;
        const lit = rng.chance(spec.lights);
        const wx = x + 6 + c * 16;
        const wy = top + 14 + r * 20;
        if (wx + 6 > x + width - 4) continue;
        ctx.fillStyle = lit
          ? (rng.chance(0.25) ? PALETTE.windowCool : PALETTE.window)
          : 'rgba(255,255,255,0.035)';
        ctx.globalAlpha = lit ? rng.range(0.45, 0.95) : 1;
        ctx.fillRect(wx, wy, 5, 7);
      }
    }
    ctx.globalAlpha = 1;
    x += width + gap;
  }

  // A wash of sky colour pushes each strip further back into the haze.
  if (spec.wash > 0) {
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = `rgba(58,27,77,${spec.wash})`;
    ctx.fillRect(0, 0, TILE, 900);
    ctx.globalCompositeOperation = 'source-over';
  }
  return canvas;
}

export function buildCity(rng) {
  return LAYERS.map((spec) => ({
    factor: spec.factor,
    baseY: spec.baseY,
    canvas: paintLayer(rng, spec),
  }));
}

export function drawSky(ctx, width, height, time, sunX, sunY) {
  const sky = ctx.createLinearGradient(0, 0, 0, height * 0.85);
  sky.addColorStop(0, PALETTE.skyTop);
  sky.addColorStop(0.42, PALETTE.skyMid);
  sky.addColorStop(0.72, '#7d2f52');
  sky.addColorStop(1, PALETTE.skyLow);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  // A band of haze along the horizon, thicker near the sun.
  const haze = ctx.createLinearGradient(0, height * 0.45, 0, height * 0.9);
  haze.addColorStop(0, 'rgba(240,133,92,0)');
  haze.addColorStop(1, 'rgba(240,133,92,0.28)');
  ctx.fillStyle = haze;
  ctx.fillRect(0, height * 0.45, width, height * 0.45);

  // The sun: a low disc with a soft bloom, its light smeared sideways by the air.
  const bloom = ctx.createRadialGradient(sunX, sunY, 8, sunX, sunY, 340);
  bloom.addColorStop(0, 'rgba(255,214,150,0.65)');
  bloom.addColorStop(0.28, 'rgba(255,160,96,0.2)');
  bloom.addColorStop(1, 'rgba(255,120,90,0)');
  ctx.fillStyle = bloom;
  ctx.fillRect(sunX - 360, sunY - 360, 720, 720);
  ctx.fillStyle = PALETTE.sun;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 74, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.sunCore;
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  ctx.arc(sunX, sunY - 6, 58, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Cut the disc with a few horizontal slats: the classic setting-sun read, done cheaply.
  ctx.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 5; i += 1) {
    const y = sunY + 6 + i * 15;
    ctx.fillRect(sunX - 80, y, 160, 3 + i * 1.6);
  }
  ctx.globalCompositeOperation = 'source-over';

  // Stars above the haze.
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  for (let i = 0; i < 90; i += 1) {
    const x = (i * 137.51) % width;
    const y = ((i * 71.3) % (height * 0.5)) + 8;
    const twinkle = 0.35 + 0.65 * Math.abs(Math.sin(time * 0.7 + i));
    ctx.globalAlpha = twinkle * 0.5;
    ctx.fillRect(x, y, 1.6, 1.6);
  }
  ctx.globalAlpha = 1;
}

export function drawCityStrip(ctx, layer, cameraX, width, height) {
  const offset = -((cameraX * layer.factor) % TILE);
  for (let x = offset - TILE; x < width + TILE; x += TILE) {
    ctx.drawImage(layer.canvas, Math.round(x), 0);
  }
}

export function drawWater(ctx, width, height, surfaceY, time, cameraX, lightX) {
  if (surfaceY > height) return;
  const top = Math.max(0, surfaceY);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, top, width, height - top);
  ctx.clip();

  // Body: a cold, deep sea, lighter right under the surface so the buildings sit on it.
  const body = ctx.createLinearGradient(0, top, 0, height);
  body.addColorStop(0, '#24304d');
  body.addColorStop(0.06, '#151a30');
  body.addColorStop(0.45, '#0b0a1c');
  body.addColorStop(1, PALETTE.waterDeep);
  ctx.fillStyle = body;
  ctx.fillRect(0, top, width, height - top);

  // Submerged silhouettes: the towers continue under the surface, dark and wavering, which is what
  // sells a flood rather than a floor.
  for (let i = 0; i < 14; i += 1) {
    const bx = ((i * 271.3 - cameraX * 0.42) % (width + 320)) - 160;
    const bw = 42 + ((i * 37) % 70);
    const depth = 60 + ((i * 53) % 190);
    const sway = Math.sin(time * 0.8 + i) * 5;
    ctx.fillStyle = 'rgba(8,10,24,0.55)';
    ctx.beginPath();
    ctx.moveTo(bx + sway, top);
    ctx.lineTo(bx + bw + sway, top);
    ctx.lineTo(bx + bw - 6 + sway, top + depth);
    ctx.lineTo(bx + 6 + sway, top + depth);
    ctx.closePath();
    ctx.fill();
  }

  // Long swell lines: broad, low-contrast bands that give the surface a direction.
  for (let i = 0; i < 7; i += 1) {
    const y = top + 18 + i * 34;
    if (y > height) break;
    ctx.beginPath();
    for (let x = 0; x <= width; x += 22) {
      const wy = y + waveAt(x * 1.4 + cameraX, time * 0.8 + i, 3.4, 420);
      if (x === 0) ctx.moveTo(x, wy);
      else ctx.lineTo(x, wy);
    }
    ctx.strokeStyle = `rgba(150,190,255,${0.09 - i * 0.008})`;
    ctx.lineWidth = 6;
    ctx.stroke();
  }

  // The sun's reflection: a broken, breathing ladder of light under the disc.
  const column = Math.max(46, width * 0.1);
  for (let i = 0; i < 46; i += 1) {
    const y = top + i * 6;
    if (y > height) break;
    const spread = column * (0.6 + i * 0.05);
    const wobble = Math.sin(time * 1.7 + i * 0.6) * (4 + i * 1.1);
    const alpha = Math.max(0, 0.28 - i * 0.006);
    const shade = i % 3 === 0 ? '255,196,132' : '255,150,110';
    ctx.fillStyle = `rgba(${shade},${alpha})`;
    const barWidth = spread * (0.5 + 0.5 * Math.abs(Math.sin(i * 1.7)));
    ctx.fillRect(lightX - barWidth / 2 + wobble, y, barWidth, 2.6);
  }

  // Glints that drift with the camera, denser near the surface.
  for (let i = 0; i < 90; i += 1) {
    const gx = ((i * 197.3 - cameraX * 0.5 + time * 26) % (width + 200)) - 100;
    const depth = Math.pow((i * 53.7) % 100, 1.35) / 100;
    const gy = top + 8 + depth * Math.max(20, height - top - 16);
    const length = 5 + ((i * 13) % 22);
    ctx.fillStyle = i % 4 === 0 ? 'rgba(255,206,160,0.5)' : 'rgba(190,225,255,0.45)';
    ctx.globalAlpha = 0.1 + 0.22 * Math.abs(Math.sin(time * 1.4 + i * 0.8));
    ctx.fillRect(gx, gy, length, 1.6);
  }
  ctx.globalAlpha = 1;

  // The foam line: a bright, restless edge, with spray flecks riding on it.
  const edge = (x) => top + waveAt(x + cameraX, time, 5, 260);
  ctx.beginPath();
  ctx.moveTo(0, edge(0));
  for (let x = 0; x <= width; x += 14) ctx.lineTo(x, edge(x));
  ctx.strokeStyle = 'rgba(214,246,255,0.95)';
  ctx.lineWidth = 3;
  ctx.shadowColor = 'rgba(150,220,255,0.9)';
  ctx.shadowBlur = 18;
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.fillStyle = 'rgba(230,250,255,0.9)';
  for (let i = 0; i < 40; i += 1) {
    const fx = ((i * 231.7 - cameraX * 0.9 + time * 34) % (width + 120)) - 60;
    const fy = edge(fx) - 3 - ((i * 17) % 12);
    ctx.globalAlpha = 0.25 + 0.35 * Math.abs(Math.sin(time * 2.1 + i));
    ctx.fillRect(fx, fy, 3 + ((i * 7) % 6), 1.6);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}