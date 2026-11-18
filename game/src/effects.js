// Particles, kept dumb and cheap: sparks of light thrown off a pickup, embers drifting up from
// the flood, a burst of spray when the pilot goes under. One array, one draw call per kind.

import { PALETTE } from './config.js';
import { makeRng } from './random.js';

export class Effects {
  constructor(seed) {
    this.rng = makeRng(seed ^ 0x5f3759df);
    this.bits = [];
    this.embers = [];
    this.shake = 0;
    for (let i = 0; i < 46; i += 1) {
      this.embers.push({
        x: this.rng.range(0, 1600),
        y: this.rng.range(0, 900),
        speed: this.rng.range(6, 26),
        drift: this.rng.range(-12, 12),
        size: this.rng.range(0.8, 2.2),
        alpha: this.rng.range(0.1, 0.4),
      });
    }
  }

  burst(x, y, colour, count, power) {
    for (let i = 0; i < count; i += 1) {
      const angle = this.rng.range(0, Math.PI * 2);
      const speed = this.rng.range(power * 0.25, power);
      this.bits.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - power * 0.15,
        life: this.rng.range(0.45, 1.1),
        age: 0,
        size: this.rng.range(1.2, 3.4),
        colour,
      });
    }
  }

  splash(x, y) {
    this.burst(x, y, '#bfe9ff', 34, 420);
    this.shake = 1;
  }

  update(dt) {
    for (let i = this.bits.length - 1; i >= 0; i -= 1) {
      const bit = this.bits[i];
      bit.age += dt;
      if (bit.age >= bit.life) {
        this.bits.splice(i, 1);
        continue;
      }
      bit.vy += 620 * dt;
      bit.x += bit.vx * dt;
      bit.y += bit.vy * dt;
      bit.vx *= 1 - 1.1 * dt;
    }
    this.shake = Math.max(0, this.shake - dt * 2.2);
    for (const ember of this.embers) {
      ember.y -= ember.speed * dt;
      ember.x += ember.drift * dt;
      if (ember.y < -20) {
        ember.y = 920;
        ember.x = this.rng.range(0, 1600);
      }
    }
  }

  drawBits(ctx, camera) {
    for (const bit of this.bits) {
      const fade = 1 - bit.age / bit.life;
      ctx.globalAlpha = fade;
      ctx.fillStyle = bit.colour;
      ctx.beginPath();
      ctx.arc(bit.x - camera.x, bit.y - camera.y, bit.size * fade + 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  drawEmbers(ctx, camera, width, height) {
    ctx.fillStyle = PALETTE.spark;
    for (const ember of this.embers) {
      const x = ((ember.x - camera.x * 0.9) % (width + 40) + width + 40) % (width + 40) - 20;
      const y = ember.y - (camera.y * 0.35) % height;
      ctx.globalAlpha = ember.alpha;
      ctx.beginPath();
      ctx.arc(x, y, ember.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}