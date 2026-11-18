// One input surface for mouse, keyboard and touch. The game only asks three questions: is the
// throw held, which way is the pilot leaning, and did anything just happen this frame.

export class Input {
  constructor(target) {
    this.held = false;
    this.axis = 0;
    this.justPressed = false;
    this.justReleased = false;
    this.anyKey = false;
    this.keys = new Set();
    this.sinceGesture = 0;

    const press = (event) => {
      const code = event.code || '';
      this.anyKey = true;
      if (code === 'Space' || code === 'ArrowUp' || code === 'KeyW') {
        event.preventDefault();
        this.setHeld(true);
      }
      if (code === 'ArrowLeft' || code === 'KeyA') this.keys.add('left');
      if (code === 'ArrowRight' || code === 'KeyD') this.keys.add('right');
      if (code === 'KeyR' || code === 'Enter') this.restart = true;
      this.updateAxis();
    };
    const lift = (event) => {
      const code = event.code || '';
      if (code === 'Space' || code === 'ArrowUp' || code === 'KeyW') this.setHeld(false);
      if (code === 'ArrowLeft' || code === 'KeyA') this.keys.delete('left');
      if (code === 'ArrowRight' || code === 'KeyD') this.keys.delete('right');
      this.updateAxis();
    };

    window.addEventListener('keydown', press);
    window.addEventListener('keyup', lift);
    window.addEventListener('blur', () => { this.keys.clear(); this.updateAxis(); this.setHeld(false); });
    target.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      this.pointer = true;
      this.anyKey = true;
      this.setHeld(true);
    });
    window.addEventListener('pointerup', () => this.setHeld(false));
    target.addEventListener('contextmenu', (event) => event.preventDefault());
  }

  setHeld(next) {
    if (next === this.held) return;
    this.held = next;
    if (next) {
      this.justPressed = true;
      this.sinceGesture = 0;
    } else {
      this.justReleased = true;
    }
  }

  updateAxis() {
    let axis = 0;
    if (this.keys.has('left')) axis -= 1;
    if (this.keys.has('right')) axis += 1;
    this.axis = axis;
  }

  // Called once per frame by the loop, after the game has read the edge flags.
  endFrame() {
    this.justPressed = false;
    this.justReleased = false;
    this.restart = false;
    this.anyKey = false;
  }
}