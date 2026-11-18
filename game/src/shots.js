// The screenshots that ship with the entry are taken from the running game: this module sets a
// deterministic autopilot loose for a fixed number of frames, then freezes the frame. One seed in,
// the same three images out, every time.

import { PALETTE } from './config.js';

const FIXED = 1 / 60;

// A simple pilot: throw the line whenever it is free, let it go when it has carried the swing
// above its mast. It is not good at the game, which is exactly what a screenshot needs.
function autopilot(input, player, world) {
  let previous = input.held;
  if (player.rope) {
    input.held = player.y > player.rope.anchor.y + 70;
  } else {
    input.held = Boolean(world.findAnchor(player, 520));
  }
  input.justPressed = input.held && !previous;
  input.justReleased = !input.held && previous;
  input.axis = 0;
}

function advance(context, frames, options = {}) {
  const { state, world, player, effects, step, input } = context;
  for (let i = 0; i < frames; i += 1) {
    autopilot(input, player, world);
    step(FIXED);
    // Keep the staging frames alive: the tide is held down so a stray frame never ends the shot.
    if (options.holdTide) world.waterY = Math.min(world.waterY, options.holdTide);
    if (state.screen !== 'play' && options.keepPlaying) {
      state.screen = 'play';
      player.alive = true;
    }
    if (state.time > 400) break;
  }
  input.endFrame();
}

export function stageShot(name, context) {
  const { state, world, player, effects, step, draw, input, renderer } = context;
  state.time = 0;
  effects.shake = 0;

  if (name === 'start') {
    advance(context, 90, { keepPlaying: false });
    state.screen = 'title';
    draw();
    return;
  }

  if (name === 'play') {
    state.screen = 'play';
    state.startedAt = 0;
    // Run the autopilot until it is mid-swing with a full trail and a few sparks taken: that is
    // the frame that shows the game best, and the same seed always stops on the same frame.
    for (let i = 0; i < 1500; i += 1) {
      autopilot(input, player, world);
      step(FIXED);
      world.waterY = Math.min(world.waterY, 700);
      if (state.screen !== 'play') {
        state.screen = 'play';
        player.alive = true;
      }
      const screenY = player.y - world.camera.y;
      const ready = player.rope
        && player.trail.length > 24
        && world.taken >= 4
        && screenY > 120
        && screenY < 420
        && player.x - world.camera.x > 260
        && player.x - world.camera.x < 760;
      if (ready) {
        draw();
        return;
      }
    }
    draw();
    return;
  }

  if (name === 'win') {
    state.screen = 'play';
    for (const spark of world.sparks) spark.taken = true;
    world.taken = world.sparks.length;
    player.x = world.beacon.x - 210;
    player.y = 296;
    player.vx = 520;
    player.vy = -240;
    player.rope = null;
    player.alive = true;
    player.strokes = 24;
    player.trail = [];
    for (let i = 0; i < 34; i += 1) {
      player.trail.push({
        x: player.x - i * 17,
        y: player.y + 40 - Math.sin(i * 0.32) * 70 - i * 1.6,
      });
    }
    world.camera.x = player.x - 700;
    world.camera.y = -70;
    state.lit = 1;
    // The beam's sweep is a function of time: this value parks it on a dramatic diagonal.
    state.time = 114;
    state.startedAt = 39.8;
    effects.burst(world.beacon.x, 220, '#ffe9a8', 46, 300);
    state.screen = 'win';
    draw();
    return;
  }

  // The last shot: the tide at the pilot's heels.
  state.screen = 'play';
  advance(context, 300, { holdTide: 690 });
  world.waterY = player.y + 34;
  effects.splash(player.x + 90, world.waterY);
  effects.shake = 0.7;
  state.screen = 'lose';
  state.startedAt = 0;
  state.time = 51.6;
  state.lit = world.taken / world.sparks.length;
  draw();
  void PALETTE;
}