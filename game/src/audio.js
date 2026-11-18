// All sound is synthesised at run time: no files, no network. The pad is a slow chord under the
// play, the spark is a small bell that climbs with the streak, and the flood gets a rumble that
// grows as it gets closer, which is the only warning the player needs.

const CHORD = [146.83, 220.0, 293.66, 369.99];

export class Sound {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.padGain = null;
    this.rumbleGain = null;
    this.rumbleFilter = null;
    this.ready = false;
  }

  // Browsers only let audio start from a gesture, so the first input opens the graph.
  unlock() {
    if (this.ready) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const Fleet = window.AudioContext || window.webkitAudioContext;
    if (!Fleet) return;
    try {
      this.ctx = new Fleet();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
      this.buildPad();
      this.buildRumble();
      this.ready = true;
    } catch (error) {
      this.ready = false;
    }
  }

  buildPad() {
    const ctx = this.ctx;
    this.padGain = ctx.createGain();
    this.padGain.gain.value = 0.0001;
    this.padGain.connect(this.master);
    CHORD.forEach((hz, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = index === 0 ? 'sine' : 'triangle';
      osc.frequency.value = hz;
      osc.detune.value = index % 2 === 0 ? -6 : 7;
      gain.gain.value = index === 0 ? 0.5 : 0.18;
      osc.connect(gain).connect(this.padGain);
      osc.start();
      // A slow sweep on each voice keeps the chord from sounding like a held synth patch.
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 0.06 + index * 0.017;
      lfoGain.gain.value = 3.5;
      lfo.connect(lfoGain).connect(osc.detune);
      lfo.start();
    });
    this.padGain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 4);
  }

  buildRumble() {
    const ctx = this.ctx;
    const length = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    this.rumbleFilter = ctx.createBiquadFilter();
    this.rumbleFilter.type = 'lowpass';
    this.rumbleFilter.frequency.value = 220;
    this.rumbleGain = ctx.createGain();
    this.rumbleGain.gain.value = 0.0001;
    source.connect(this.rumbleFilter).connect(this.rumbleGain).connect(this.master);
    source.start();
  }

  // How close the flood is: 0 far, 1 touching the soles.
  setTension(amount) {
    if (!this.ready) return;
    const now = this.ctx.currentTime;
    const gain = 0.02 + amount * amount * 0.22;
    this.rumbleGain.gain.setTargetAtTime(gain, now, 0.3);
    this.rumbleFilter.frequency.setTargetAtTime(180 + amount * 700, now, 0.3);
  }

  tone(hz, duration, type, volume, slideTo) {
    if (!this.ready) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(hz, now);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, now + duration);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain).connect(this.master);
    osc.start(now);
    osc.stop(now + duration + 0.05);
  }

  spark(streak) {
    const scale = [0, 2, 4, 7, 9, 12, 14, 16][Math.min(7, streak)];
    const hz = 440 * Math.pow(2, scale / 12);
    this.tone(hz, 0.5, 'triangle', 0.16);
    this.tone(hz * 2, 0.24, 'sine', 0.07);
  }

  throwRope() {
    this.tone(320, 0.18, 'sawtooth', 0.045, 720);
  }

  release() {
    this.tone(660, 0.22, 'triangle', 0.05, 260);
  }

  splash() {
    this.tone(180, 0.9, 'sine', 0.2, 40);
    this.tone(90, 1.1, 'triangle', 0.14, 30);
  }

  win() {
    [0, 4, 7, 12, 16].forEach((step, index) => {
      const hz = 392 * Math.pow(2, step / 12);
      setTimeout(() => this.tone(hz, 0.7, 'triangle', 0.12), index * 110);
    });
  }
}