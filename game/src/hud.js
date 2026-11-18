// Type, bars and the two cards that open and close a run. Everything is drawn on the canvas with
// the system sans face, so there is no font file to load and nothing to fetch.

import { PALETTE, COURSE } from './config.js';

const FACE = '700 34px system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
const SMALL = '600 15px system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
const TINY = '700 12px system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

function spaced(ctx, text, x, y, gap) {
  let cursor = x;
  for (const letter of text) {
    ctx.fillText(letter, cursor, y);
    cursor += ctx.measureText(letter).width + gap;
  }
  return cursor - gap;
}

function textWidth(ctx, text, gap) {
  let width = 0;
  for (const letter of text) width += ctx.measureText(letter).width + gap;
  return width - gap;
}

export function drawHud(ctx, state, view) {
  const { world, player } = state;
  const taken = world.taken;
  const total = world.sparks.length;

  // Spark pips across the top left: one diamond per spark, lit as they are taken.
  ctx.save();
  ctx.font = TINY;
  ctx.fillStyle = PALETTE.uiDim;
  ctx.fillText('SPARKS', 48, 46);
  for (let i = 0; i < total; i += 1) {
    const x = 48 + i * 18;
    const y = 62;
    ctx.beginPath();
    ctx.moveTo(x, y - 5);
    ctx.lineTo(x + 4, y);
    ctx.lineTo(x, y + 5);
    ctx.lineTo(x - 4, y);
    ctx.closePath();
    if (i < taken) {
      ctx.fillStyle = PALETTE.spark;
      ctx.shadowColor = PALETTE.spark;
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;
    } else {
      ctx.strokeStyle = 'rgba(246,239,255,0.28)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  // The run's progress toward the beacon, as a hairline with a small tower at its end.
  const barX = 48;
  const barY = view.h - 54;
  const barW = Math.min(520, view.w - 96);
  const progress = world.progress(player);
  ctx.fillStyle = 'rgba(246,239,255,0.16)';
  ctx.fillRect(barX, barY, barW, 2);
  ctx.fillStyle = 'rgba(255,233,168,0.9)';
  ctx.fillRect(barX, barY, barW * progress, 2);
  ctx.fillStyle = PALETTE.uiDim;
  ctx.font = TINY;
  ctx.fillText('THE BEACON', barX, barY - 10);
  ctx.fillRect(barX + barW - 2, barY - 12, 4, 16);

  // The tide, spelled out as a distance: how many pixels of air are left under the pilot.
  const air = Math.max(0, Math.round(world.waterY - player.y));
  const danger = air < 170;
  const label = danger ? `TIDE  ${air}` : `AIR  ${air}`;
  ctx.font = TINY;
  const labelWidth = ctx.measureText(label).width;
  ctx.fillStyle = 'rgba(8,5,16,0.55)';
  ctx.beginPath();
  ctx.roundRect(view.w - 48 - labelWidth - 20, view.h - 74, labelWidth + 20, 30, 8);
  ctx.fill();
  ctx.textAlign = 'right';
  ctx.fillStyle = danger ? '#ff8090' : PALETTE.uiDim;
  ctx.fillText(label, view.w - 58, view.h - 54);
  ctx.textAlign = 'left';

  // A hint that fades out after the first few seconds of a run.
  if (state.time - state.startedAt < 5.5 && state.screen === 'play') {
    const fade = Math.min(1, (5.5 - (state.time - state.startedAt)) / 1.6);
    ctx.globalAlpha = fade * 0.75;
    ctx.font = SMALL;
    ctx.fillStyle = PALETTE.ui;
    ctx.textAlign = 'center';
    ctx.fillText('HOLD  to throw the line   ·   RELEASE  to fly   ·   ←  →  to lean', view.w / 2, view.h - 92);
    ctx.textAlign = 'left';
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

export function drawTitle(ctx, state, view) {
  const { world, time } = state;
  ctx.save();
  ctx.fillStyle = 'rgba(6,4,14,0.42)';
  ctx.fillRect(0, 0, view.w, view.h);

  ctx.textAlign = 'center';
  ctx.font = '700 46px system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
  ctx.fillStyle = PALETTE.ui;
  ctx.shadowColor = 'rgba(255,150,190,0.6)';
  ctx.shadowBlur = 40;
  const title = 'TIDELINE';
  const x = view.w / 2 - textWidth(ctx, title, 20) / 2;
  spaced(ctx, title, x, view.h * 0.44, 20);
  ctx.shadowBlur = 0;

  ctx.font = SMALL;
  ctx.fillStyle = 'rgba(246,239,255,0.8)';
  ctx.fillText('swing the last line across a drowning city and relight the beacon', view.w / 2, view.h * 0.44 + 34);

  ctx.font = TINY;
  ctx.fillStyle = 'rgba(200,190,220,0.55)';
  ctx.fillText('HOLD TO THROW   ·   RELEASE TO FLY   ·   ARROWS TO LEAN   ·   TAKE 13 SPARKS', view.w / 2, view.h - 74);

  const pulse = 0.55 + 0.45 * Math.sin(time * 2.6);
  ctx.globalAlpha = pulse;
  ctx.font = SMALL;
  ctx.fillStyle = PALETTE.spark;
  ctx.fillText('press any key to begin', view.w / 2, view.h * 0.74);
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
  ctx.restore();
}

export function drawEnd(ctx, state, view) {
  const won = state.screen === 'win';
  const elapsed = state.time - state.startedAt;
  ctx.save();
  ctx.fillStyle = won ? 'rgba(8,6,18,0.38)' : 'rgba(10,4,10,0.5)';
  ctx.fillRect(0, 0, view.w, view.h);

  ctx.textAlign = 'center';
  ctx.font = FACE;
  ctx.fillStyle = won ? '#ffe9a8' : '#ff8fa3';
  ctx.shadowColor = won ? 'rgba(255,233,168,0.6)' : 'rgba(255,90,120,0.5)';
  ctx.shadowBlur = 30;
  const headline = won ? 'THE BEAM HOLDS' : 'THE TIDE TOOK YOU';
  const x = view.w / 2 - textWidth(ctx, headline, 10) / 2;
  spaced(ctx, headline, x, view.h * 0.44, 10);
  ctx.shadowBlur = 0;

  ctx.font = SMALL;
  ctx.fillStyle = 'rgba(246,239,255,0.8)';
  const line = won
    ? `${state.world.taken} sparks carried · ${elapsed.toFixed(1)}s · ${state.player.strokes} line${state.player.strokes === 1 ? '' : 's'} thrown`
    : `${state.world.taken} of ${state.world.sparks.length} sparks · ${Math.round(state.world.progress(state.player) * 100)}% of the way · ${elapsed.toFixed(1)}s`;
  ctx.fillText(line, view.w / 2, view.h * 0.44 + 38);

  ctx.font = TINY;
  ctx.fillStyle = PALETTE.uiDim;
  ctx.fillText(won ? 'the lighthouse burns again, and the city keeps its name' : 'the water keeps what it takes', view.w / 2, view.h * 0.44 + 66);

  const pulse = 0.55 + 0.45 * Math.sin(state.time * 2.6);
  ctx.globalAlpha = pulse;
  ctx.font = SMALL;
  ctx.fillStyle = PALETTE.ui;
  ctx.fillText('press  R  to run it again', view.w / 2, view.h * 0.7);
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
  ctx.restore();
}