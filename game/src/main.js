// TIDELINE — the loop. One canvas, four screens (title, play, win, lose), a fixed seed for the
// city and a small screenshot harness so the three shots that ship with the entry are taken from
// the real game rather than mocked up.

import { World } from './world.js';
import { Player } from './player.js';
import { Renderer } from './render.js';
import { Input } from './input.js';
import { Sound } from './audio.js';
import { Effects } from './effects.js';
import { buildCity } from './city.js';
import { makeRng } from './random.js';
import { TIDE } from './config.js';
import { drawHud, drawTitle, drawEnd } from './hud.js';
import { stageShot } from './shots.js';

const params = new URLSearchParams(window.location.search);
const seed = Number(params.get('seed') || 7) || 7;
const shot = params.get('shot');

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = new World(seed);
const player = new Player();
const renderer = new Renderer(canvas);
const effects = new Effects(seed);
const input = new Input(canvas);
const sound = new Sound();

world.citySeed = seed;
renderer.setCity(buildCity(makeRng(seed ^ 0x2545f491)));

const state = {
  world,
  player,
  effects,
  time: 0,
  startedAt: 0,
  screen: 'title',
  lit: 0,
  streak: 0,
  message: '',
};

function announce(text) {
  if (status && status.textContent !== text) status.textContent = text;
}

function start() {
  sound.unlock();
  player.reset();
  world.waterY = TIDE.start;
  world.taken = 0;
  world.time = 0;
  for (const spark of world.sparks) spark.taken = false;
  state.startedAt = state.time;
  state.screen = 'play';
  state.lit = 0;
  state.streak = 0;
  effects.bits.length = 0;
  announce('Run started. Thirteen sparks to the beacon.');
}

function step(dt) {
  state.time += dt;

  if (state.screen === 'title') {
    world.update(dt, player);
    effects.update(dt);
    if (input.anyKey || input.justPressed) start();
    return;
  }

  if (state.screen === 'play') {
    player.update(dt, input, world);
    world.update(dt, player);
    effects.update(dt);

    const spark = world.collect(player);
    if (spark) {
      state.streak += 1;
      effects.burst(spark.x, spark.y, '#ffe9a8', 26, 260);
      sound.spark(state.streak);
      announce(`Spark ${world.taken} of ${world.sparks.length}.`);
    }
    if (world.taken > 0 && Math.random() < 0.06) state.streak = Math.max(0, state.streak - 1);

    state.lit = world.taken / world.sparks.length;
    sound.setTension(Math.max(0, 1 - (world.waterY - player.y) / 420));

    if (player.rope && input.justPressed) sound.throwRope();
    if (input.justReleased && player.strokes > 0) sound.release();

    if (world.drowned(player)) {
      player.alive = false;
      effects.splash(player.x, world.waterY);
      sound.splash();
      state.screen = 'lose';
      announce('The tide took you.');
      return;
    }
    if (world.reachedBeacon(player)) {
      state.lit = 1;
      sound.win();
      state.screen = 'win';
      effects.burst(world.beacon.x, world.beacon.y, '#ffe9a8', 60, 420);
      announce('The beam holds. The lighthouse burns again.');
      return;
    }
    if (input.restart) start();
    return;
  }

  // Win and lose screens keep the sky moving, so the last frame is never a still.
  world.update(dt * 0.5, player);
  effects.update(dt);
  if (input.restart) start();
}

function draw() {
  renderer.draw({
    world,
    player,
    effects,
    time: state.time,
    shake: effects.shake,
    lit: state.lit,
  });
  if (state.screen === 'title') drawTitle(renderer.ctx, state, renderer.view);
  else if (state.screen === 'play') drawHud(renderer.ctx, state, renderer.view);
  else drawEnd(renderer.ctx, state, renderer.view);
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.034, Math.max(0.001, (now - last) / 1000));
  last = now;
  step(dt);
  draw();
  input.endFrame();
  requestAnimationFrame(frame);
}

window.addEventListener('resize', () => renderer.resize());

// A read-only handle for play-testing and the screenshot harness: the live state, for probes.
window.__tideline = { state, world, player, renderer };

// Screenshot staging: ?shot=start|play|win|lose&seed=N sets a deterministic frame and stops the
// clock, so the three images in screenshots/ are the game itself, captured in a browser.
if (shot) {
  stageShot(shot, { state, world, player, effects, step, draw, input, renderer });
} else {
  requestAnimationFrame(frame);
}