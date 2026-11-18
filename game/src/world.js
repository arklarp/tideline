// The course: a fixed sequence of masts to swing from, thirteen sparks strung between them, the
// rising flood and the beacon at the end. Everything is generated from one seed, so the city the
// player sees in a screenshot is the city they will meet when they play.

import { COURSE, TIDE, PALETTE } from './config.js';
import { makeRng } from './random.js';

export class World {
  constructor(seed) {
    this.seed = seed;
    const rng = makeRng(seed);
    this.anchors = [];
    this.sparks = [];
    this.beacon = { x: COURSE.length, y: 300 };

    let x = COURSE.firstAnchor;
    let y = 300;
    while (x < COURSE.length - 260) {
      const drift = rng.range(-150, 150);
      y = Math.min(COURSE.anchorHeight[1], Math.max(COURSE.anchorHeight[0], y + drift));
      this.anchors.push({
        x,
        y,
        hue: rng.pick(PALETTE.neon),
        pulse: rng.range(0, Math.PI * 2),
        height: rng.range(60, 150),
      });
      x += rng.range(COURSE.anchorGap[0], COURSE.anchorGap[1]);
    }

    const span = (this.anchors[this.anchors.length - 1].x - COURSE.firstAnchor) / (COURSE.sparks + 1);
    for (let i = 1; i <= COURSE.sparks; i += 1) {
      const sx = COURSE.firstAnchor + span * i;
      const near = this.anchorNear(sx);
      this.sparks.push({
        x: sx,
        y: Math.min(TIDE.start - 150, near.y + rng.range(90, 200)),
        taken: false,
        phase: rng.range(0, Math.PI * 2),
        spin: rng.range(-1.6, 1.6),
      });
    }

    this.waterY = TIDE.start;
    this.time = 0;
    this.taken = 0;
    this.camera = { x: COURSE.startX - 480, y: 300 };
  }

  anchorNear(x) {
    let best = this.anchors[0];
    let bestGap = Infinity;
    for (const anchor of this.anchors) {
      const gap = Math.abs(anchor.x - x);
      if (gap < bestGap) {
        bestGap = gap;
        best = anchor;
      }
    }
    return best;
  }

  // A mast worth throwing at: inside reach, not the one we just left, and not straight below.
  findAnchor(player, reach) {
    let best = null;
    let bestScore = -Infinity;
    for (const anchor of this.anchors) {
      const dx = anchor.x - player.x;
      const dy = anchor.y - player.y;
      if (dx < -40) continue;
      const distance = Math.hypot(dx, dy);
      if (distance > reach || distance < 40) continue;
      const score = dx * 1.1 - Math.abs(dy) * 0.35 - distance * 0.25;
      if (score > bestScore) {
        bestScore = score;
        best = anchor;
      }
    }
    return best;
  }

  update(dt, player) {
    this.time += dt;
    const target = TIDE.start - this.taken * TIDE.perSpark + this.time * TIDE.creep;
    this.waterY = Math.max(this.waterY, target);

    // Camera: keeps the pilot a third in from the left, low enough that the flood stays in shot.
    const wantX = player.x - 520;
    const wantY = Math.min(400, Math.max(-140, player.y - 340));
    this.camera.x += (wantX - this.camera.x) * Math.min(1, dt * 5.5);
    this.camera.y += (wantY - this.camera.y) * Math.min(1, dt * 3.2);
  }

  // Returns the spark the pilot just swallowed, if any.
  collect(player) {
    for (const spark of this.sparks) {
      if (spark.taken) continue;
      if (Math.hypot(spark.x - player.x, spark.y - player.y) < 52) {
        spark.taken = true;
        this.taken += 1;
        return spark;
      }
    }
    return null;
  }

  drowned(player) {
    return player.y > this.waterY - 12;
  }

  reachedBeacon(player) {
    return player.x > this.beacon.x - 90;
  }

  progress(player) {
    return Math.min(1, Math.max(0, (player.x - COURSE.startX) / (this.beacon.x - COURSE.startX)));
  }
}