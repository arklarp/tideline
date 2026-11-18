// Everything the player looks at. World units are 1440 wide whatever the window, so the swing
// feels the same on a laptop and on a big screen; the canvas is scaled to fit once per resize.

import { DESIGN, PALETTE } from './config.js';
import { drawSky, drawCityStrip, drawWater, HORIZON } from './city.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.scale = 1;
    this.view = { w: DESIGN.width, h: DESIGN.height };
    this.layers = [];
    this.resize();
  }

  // The parallax strips are built by the city generator with the world's own seed.
  setCity(layers) {
    this.layers = layers;
  }

  resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const cssWidth = window.innerWidth;
    const cssHeight = window.innerHeight;
    this.canvas.width = Math.round(cssWidth * dpr);
    this.canvas.height = Math.round(cssHeight * dpr);
    this.scale = (cssWidth / DESIGN.width) * dpr;
    this.view.w = DESIGN.width;
    this.view.h = cssHeight / (cssWidth / DESIGN.width);
  }

  draw(state) {
    const ctx = this.ctx;
    const { world, player, effects, time, shake } = state;
    const { w, h } = this.view;
    ctx.setTransform(this.scale, 0, 0, this.scale, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const cam = {
      x: world.camera.x + (shake ? Math.sin(time * 61) * 7 * shake : 0),
      y: world.camera.y + (shake ? Math.cos(time * 47) * 5 * shake : 0),
    };
    const sunX = 1040 - cam.x * 0.05;
    const sunY = 470 - cam.y * 0.1;

    drawSky(ctx, w, h, time, sunX, sunY);
    for (const layer of this.layers) drawCityStrip(ctx, layer, cam.x, w, h);

    // The drowned street: a dark band under the skyline, so the towers stand in the city's own
    // shadow instead of floating on a strip of sunset.
    const bandTop = HORIZON + 24 - cam.y * 0.18;
    if (bandTop < h) {
      const band = ctx.createLinearGradient(0, bandTop, 0, h);
      band.addColorStop(0, '#0d0718');
      band.addColorStop(1, '#06030c');
      ctx.fillStyle = band;
      ctx.fillRect(0, bandTop, w, h - bandTop);
    }

    this.drawBeacon(ctx, world, cam, w, state.lit, time);
    drawWater(ctx, w, h, world.waterY - cam.y, time, cam.x, sunX);
    effects.drawEmbers(ctx, cam, w, h);

    ctx.save();
    ctx.translate(-cam.x, -cam.y);
    this.drawMasts(ctx, world, time, player);
    this.drawSparks(ctx, world, time);
    if (player.rope) this.drawRope(ctx, player, time);
    this.drawTrail(ctx, player);
    if (player.alive) this.drawPilot(ctx, player, time);
    ctx.restore();

    effects.drawBits(ctx, cam);
    this.drawFloodWarning(ctx, world, cam, w, h);
    this.drawVignette(ctx, w, h);
  }

  drawMasts(ctx, world, time, player) {
    for (const anchor of world.anchors) {
      const distance = Math.abs(anchor.x - player.x);
      if (distance > 1800) continue;
      const alpha = distance > 1200 ? 0.25 : 1;
      ctx.globalAlpha = alpha;

      // The pylon: a tapered mast rising out of the flood, dark against the sky, rimmed in its
      // own colour. It has to read as structure, or the rope looks tied to nothing.
      const footY = world.waterY + 40;
      const width = 9;
      const hull = ctx.createLinearGradient(anchor.x - width, 0, anchor.x + width, 0);
      hull.addColorStop(0, '#0a0714');
      hull.addColorStop(0.65, '#141021');
      hull.addColorStop(1, '#06040d');
      ctx.fillStyle = hull;
      ctx.beginPath();
      ctx.moveTo(anchor.x - width * 0.45, anchor.y);
      ctx.lineTo(anchor.x + width * 0.45, anchor.y);
      ctx.lineTo(anchor.x + width * 1.5, footY);
      ctx.lineTo(anchor.x - width * 1.5, footY);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = anchor.hue;
      ctx.globalAlpha = alpha * 0.5;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(anchor.x + width * 0.45, anchor.y);
      ctx.lineTo(anchor.x + width * 1.5, footY);
      ctx.stroke();
      ctx.globalAlpha = alpha;

      // Cross-braces every so often, so the taper has scale.
      ctx.strokeStyle = 'rgba(150,170,220,0.18)';
      ctx.lineWidth = 1;
      for (let y = anchor.y + 60; y < footY; y += 90) {
        const t = (y - anchor.y) / (footY - anchor.y);
        const half = width * (0.45 + t * 1.05);
        ctx.beginPath();
        ctx.moveTo(anchor.x - half, y);
        ctx.lineTo(anchor.x + half, y + 16);
        ctx.stroke();
      }

      // The light at the top, and the ring it casts: the mast's own halo.
      const pulse = 0.55 + 0.45 * Math.sin(time * 2.4 + anchor.pulse);
      ctx.shadowColor = anchor.hue;
      ctx.shadowBlur = 30 * pulse;
      ctx.fillStyle = anchor.hue;
      ctx.beginPath();
      ctx.arc(anchor.x, anchor.y, 7.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.strokeStyle = anchor.hue;
      ctx.globalAlpha = alpha * 0.45 * pulse;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(anchor.x, anchor.y, 18 + pulse * 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = alpha;
    }
    ctx.globalAlpha = 1;
  }

  drawSparks(ctx, world, time) {
    for (const spark of world.sparks) {
      if (spark.taken) continue;
      const bob = Math.sin(time * 2.1 + spark.phase) * 8;
      const y = spark.y + bob;

      // A soft halo first: at a glance the player should see a lit thing, not a shape.
      ctx.save();
      const halo = ctx.createRadialGradient(spark.x, y, 2, spark.x, y, 46);
      halo.addColorStop(0, 'rgba(255,233,168,0.5)');
      halo.addColorStop(0.45, 'rgba(255,200,130,0.16)');
      halo.addColorStop(1, 'rgba(255,190,120,0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(spark.x, y, 46, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.translate(spark.x, y);
      ctx.rotate(time * spark.spin);
      ctx.shadowColor = PALETTE.spark;
      ctx.shadowBlur = 34;
      ctx.fillStyle = PALETTE.spark;
      ctx.beginPath();
      ctx.moveTo(0, -17);
      ctx.lineTo(10, 0);
      ctx.lineTo(0, 17);
      ctx.lineTo(-10, 0);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#fffdf2';
      ctx.beginPath();
      ctx.moveTo(0, -11);
      ctx.lineTo(6, 0);
      ctx.lineTo(0, 11);
      ctx.lineTo(-6, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      ctx.globalAlpha = 0.4;
      ctx.strokeStyle = PALETTE.spark;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(spark.x, y, 28 + Math.sin(time * 3 + spark.phase) * 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  drawRope(ctx, player, time) {
    const rope = player.rope;
    const ax = rope.anchor.x;
    const ay = rope.anchor.y;
    const distance = Math.hypot(player.x - ax, player.y - ay);
    const sag = Math.min(34, distance * 0.07);
    const midX = (ax + player.x) / 2 + sag * 0.5;
    const midY = (ay + player.y) / 2 + sag;

    const path = () => {
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.quadraticCurveTo(midX, midY, player.x, player.y);
    };

    ctx.save();
    ctx.lineCap = 'round';
    // Three passes: a wide soft halo, the line itself, then a white core that reads at any size.
    ctx.strokeStyle = 'rgba(120,226,255,0.22)';
    ctx.lineWidth = 11;
    path();
    ctx.stroke();
    ctx.strokeStyle = PALETTE.rope;
    ctx.lineWidth = 4.2;
    path();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 1.6;
    path();
    ctx.stroke();

    // The clamp on the mast, so the line visibly holds something.
    ctx.fillStyle = PALETTE.rope;
    ctx.fillRect(ax - 4, ay - 11, 8, 5);
    ctx.beginPath();
    ctx.arc(ax, ay, 10, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(160,240,255,0.55)';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // A pulse of light travelling down the line: the tether is alive, not a rope.
    const t = (time * 0.9) % 1;
    const px = (1 - t) * (1 - t) * ax + 2 * (1 - t) * t * midX + t * t * player.x;
    const py = (1 - t) * (1 - t) * ay + 2 * (1 - t) * t * midY + t * t * player.y;
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(px, py, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawTrail(ctx, player) {
    const points = player.trail;
    if (points.length < 2) return;
    for (let i = 1; i < points.length; i += 1) {
      const weight = i / points.length;
      ctx.globalAlpha = weight * 0.55;
      ctx.strokeStyle = i % 7 === 0 ? PALETTE.player : PALETTE.trail;
      ctx.lineWidth = 1 + weight * 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(points[i - 1].x, points[i - 1].y);
      ctx.lineTo(points[i].x, points[i].y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  drawPilot(ctx, player, time) {
    const tilt = Math.max(-0.5, Math.min(0.5, Math.atan2(player.vy, Math.abs(player.vx) + 200) * 0.6));
    ctx.save();
    ctx.translate(player.x, player.y);

    // Warm air around the lantern: the pilot's own little sunset.
    const halo = ctx.createRadialGradient(0, 0, 4, 0, 0, 62);
    halo.addColorStop(0, 'rgba(255,226,170,0.30)');
    halo.addColorStop(0.5, 'rgba(255,170,150,0.10)');
    halo.addColorStop(1, 'rgba(255,150,150,0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(0, 0, 62, 0, Math.PI * 2);
    ctx.fill();

    ctx.rotate(tilt);
    ctx.scale(1.45, 1.45);

    // The scarf first, so it streams behind the body.
    ctx.strokeStyle = 'rgba(255,138,205,0.85)';
    ctx.lineWidth = 3.4;
    ctx.lineCap = 'round';
    const flutter = Math.sin(time * 7.5) * 4;
    ctx.beginPath();
    ctx.moveTo(-3, -8);
    ctx.quadraticCurveTo(-22, -14 + flutter, -38, -4 + flutter * 0.6);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,138,205,0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-3, -6);
    ctx.quadraticCurveTo(-20, -2 - flutter, -34, 8 - flutter * 0.5);
    ctx.stroke();

    // The keeper: drawn in lantern light, not in shadow — a warm figure that pops off the drowned
    // city. A thin dark edge keeps it from melting into the glow.
    ctx.beginPath();
    ctx.moveTo(-7, -12);
    ctx.quadraticCurveTo(6, -16, 9, -9);
    ctx.lineTo(11, 6);
    ctx.quadraticCurveTo(10, 16, 2, 17);
    ctx.quadraticCurveTo(-6, 16, -8, 6);
    ctx.quadraticCurveTo(-11, -4, -7, -12);
    ctx.closePath();
    const coat = ctx.createLinearGradient(0, -16, 0, 18);
    coat.addColorStop(0, '#fff6dc');
    coat.addColorStop(0.55, '#ffcf94');
    coat.addColorStop(1, '#ff9d6b');
    ctx.shadowColor = 'rgba(255,196,130,0.9)';
    ctx.shadowBlur = 26;
    ctx.fillStyle = coat;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(70,26,34,0.85)';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // Head, tucked into the collar.
    ctx.fillStyle = '#fffaf0';
    ctx.beginPath();
    ctx.arc(3, -17, 5.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(70,26,34,0.6)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // The lantern: the only bright thing the player owns.
    ctx.shadowColor = '#ffd48a';
    ctx.shadowBlur = 22;
    ctx.fillStyle = '#fff2c8';
    ctx.fillRect(12, 2, 9, 12);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(120,90,60,0.9)';
    ctx.lineWidth = 1.4;
    ctx.strokeRect(12, 2, 9, 12);
    ctx.beginPath();
    ctx.moveTo(16.5, 2);
    ctx.lineTo(16.5, -2);
    ctx.stroke();

    ctx.restore();
  }

  drawBeacon(ctx, world, cam, width, lit, time) {
    const x = world.beacon.x - cam.x;
    if (x < -420 || x > width + 700) return;
    const baseY = HORIZON - cam.y * 0.55;
    const towerTop = baseY - 300;

    // The tower: banded, with a lantern room and a roof, so it reads as a lighthouse and not a pole.
    const tower = ctx.createLinearGradient(x - 26, 0, x + 26, 0);
    tower.addColorStop(0, '#0b0716');
    tower.addColorStop(0.6, '#171122');
    tower.addColorStop(1, '#070510');
    ctx.fillStyle = tower;
    ctx.fillRect(x - 26, towerTop, 52, 320);
    ctx.fillStyle = 'rgba(255,240,200,0.07)';
    for (let band = 0; band < 4; band += 1) ctx.fillRect(x - 26, towerTop + 60 + band * 62, 52, 14);
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(x - 26, towerTop, 6, 320);

    // The lamp room: a dark gallery with a lit pane.
    ctx.fillStyle = '#120d1c';
    ctx.fillRect(x - 26, towerTop - 46, 52, 48);
    ctx.fillStyle = '#0d0916';
    ctx.beginPath();
    ctx.moveTo(x - 30, towerTop - 46);
    ctx.lineTo(x, towerTop - 72);
    ctx.lineTo(x + 30, towerTop - 46);
    ctx.closePath();
    ctx.fill();

    const glow = 0.35 + lit * 0.65;
    const lampY = towerTop - 22;
    ctx.shadowColor = '#ffe9a8';
    ctx.shadowBlur = 70 * glow;
    ctx.fillStyle = `rgba(255,233,168,${0.3 + lit * 0.7})`;
    ctx.beginPath();
    ctx.arc(x, lampY, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // The flare: the lamp's own little sun, which is what the player has been running toward.
    const flare = ctx.createRadialGradient(x, lampY, 2, x, lampY, 190 * glow + 20);
    flare.addColorStop(0, `rgba(255,246,214,${0.55 * lit})`);
    flare.addColorStop(0.3, `rgba(255,220,150,${0.22 * lit})`);
    flare.addColorStop(1, 'rgba(255,200,120,0)');
    ctx.fillStyle = flare;
    ctx.beginPath();
    ctx.arc(x, lampY, 210, 0, Math.PI * 2);
    ctx.fill();

    // The beam sweeps both ways once the lighthouse is lit; before that it is only a promise.
    if (lit > 0.02) {
      const angle = Math.sin(time * 0.5) * 0.7;
      for (const side of [-1, 1]) {
        ctx.save();
        ctx.translate(x, lampY);
        ctx.rotate(-Math.PI / 2 + angle * side);
        const reach = 1500;
        const body = ctx.createLinearGradient(0, 0, 0, -reach);
        body.addColorStop(0, `rgba(255,240,190,${0.5 * lit})`);
        body.addColorStop(0.35, `rgba(255,226,160,${0.16 * lit})`);
        body.addColorStop(1, 'rgba(255,214,150,0)');
        ctx.fillStyle = body;
        ctx.beginPath();
        ctx.moveTo(-12, 0);
        ctx.lineTo(-190, -reach);
        ctx.lineTo(190, -reach);
        ctx.lineTo(12, 0);
        ctx.closePath();
        ctx.fill();

        // A brighter core inside the cone, so the beam has an edge rather than a fog.
        const core = ctx.createLinearGradient(0, 0, 0, -reach);
        core.addColorStop(0, `rgba(255,252,232,${0.32 * lit})`);
        core.addColorStop(1, 'rgba(255,252,232,0)');
        ctx.fillStyle = core;
        ctx.beginPath();
        ctx.moveTo(-5, 0);
        ctx.lineTo(-58, -reach);
        ctx.lineTo(58, -reach);
        ctx.lineTo(5, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    }
  }

  drawFloodWarning(ctx, world, cam, width, height) {
    const waterScreen = world.waterY - cam.y;
    const margin = height - waterScreen;
    if (margin > 300) return;
    const danger = Math.min(1, Math.max(0, 1 - margin / 300));
    const wash = ctx.createLinearGradient(0, height * 0.5, 0, height);
    wash.addColorStop(0, 'rgba(255,60,90,0)');
    wash.addColorStop(1, `rgba(255,60,90,${0.18 * danger})`);
    ctx.fillStyle = wash;
    ctx.fillRect(0, height * 0.5, width, height * 0.5);
  }

  drawVignette(ctx, width, height) {
    const vignette = ctx.createRadialGradient(width / 2, height * 0.45, height * 0.35, width / 2, height * 0.5, height * 0.95);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);
  }
}