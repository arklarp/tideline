// The pilot: a small warm light on a rope. Hold to throw a line to the next mast and swing, let
// go to fly, lean with the arrow keys to pump the arc. Gravity does the rest, and the trail is
// the only scoreboard the player ever needs to read.

import { PHYSICS, COURSE } from './config.js';

export class Player {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = COURSE.startX;
    this.y = 300;
    this.vx = 330;
    this.vy = -140;
    this.rope = null;          // { anchor, length }
    this.cooldown = 0;
    this.trail = [];
    this.alive = true;
    this.strokes = 0;
    this.spin = 0;
  }

  get speed() {
    return Math.hypot(this.vx, this.vy);
  }

  attach(anchor) {
    const length = Math.hypot(anchor.x - this.x, anchor.y - this.y);
    this.rope = { anchor, length: Math.max(PHYSICS.ropeMin, length) };
    this.strokes += 1;
  }

  detach() {
    if (!this.rope) return false;
    this.rope = null;
    this.cooldown = PHYSICS.attachGrace;
    return true;
  }

  update(dt, input, world) {
    this.cooldown = Math.max(0, this.cooldown - dt);
    const held = input.held;

    if (this.rope) {
      if (!held) {
        this.detach();
      } else {
        this.swing(dt, input);
        return;
      }
    }

    if (held && !this.rope && this.cooldown <= 0) {
      const anchor = world.findAnchor(this, PHYSICS.ropeReach);
      if (anchor) this.attach(anchor);
    }

    // Free flight: gravity, a little drag, a ceiling on speed.
    this.vy += PHYSICS.gravity * dt;
    this.vx -= this.vx * PHYSICS.airDrag * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (input.axis !== 0) this.vx += input.axis * 260 * dt;

    const speed = this.speed;
    if (speed > PHYSICS.maxSpeed) {
      const scale = PHYSICS.maxSpeed / speed;
      this.vx *= scale;
      this.vy *= scale;
    }
    this.spin += this.vx * dt * 0.004;
    this.pushTrail();
  }

  // Pendulum: pull toward the anchor, add gravity's tangential share, then reel in while held.
  swing(dt, input) {
    const rope = this.rope;
    const anchor = rope.anchor;
    const dx = this.x - anchor.x;
    const dy = this.y - anchor.y;
    const length = Math.hypot(dx, dy) || 1;
    const nx = dx / length;
    const ny = dy / length;

    this.vy += PHYSICS.gravity * dt;

    // Reeling the line in winds the swing tighter and faster, which is the pilot's throttle.
    if (length > PHYSICS.ropeMin) rope.length = Math.max(PHYSICS.ropeMin, rope.length - PHYSICS.reelSpeed * dt);

    this.vx += input.axis * PHYSICS.swingPump * nx * ny * dt;
    this.vy += input.axis * PHYSICS.swingPump * nx * nx * dt;

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Snap back onto the circle the rope allows, keeping only the tangential speed.
    const cx = this.x - anchor.x;
    const cy = this.y - anchor.y;
    const distance = Math.hypot(cx, cy) || 1;
    const ux = cx / distance;
    const uy = cy / distance;
    this.x = anchor.x + ux * rope.length;
    this.y = anchor.y + uy * rope.length;
    const radial = this.vx * ux + this.vy * uy;
    this.vx -= ux * radial;
    this.vy -= uy * radial;
    this.vx *= 1 - 0.35 * dt;
    this.vy *= 1 - 0.35 * dt;

    const speed = this.speed;
    if (speed > PHYSICS.maxSpeed) {
      const scale = PHYSICS.maxSpeed / speed;
      this.vx *= scale;
      this.vy *= scale;
    }
    this.spin += (this.vx * 0.004 + 0.02) * dt * 60;
    this.pushTrail();
  }

  pushTrail() {
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 46) this.trail.shift();
  }

  // Trail points fade with age; the renderer asks for a weight per point instead of guessing.
  trailWeight(index) {
    return index / Math.max(1, this.trail.length - 1);
  }
}