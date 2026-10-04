// A small canvas particle engine for the finale: confetti, fireworks, hearts and gold dust.
// It only draws while something is alive, so it costs nothing the rest of the time.

const GOLD = ['#e9c978', '#d8b25e', '#f4dfa4', '#c79a3e'];
const ROSE = ['#e8a0a8', '#d97c88', '#f2c1c6', '#c9737f'];
const SOFT = ['#fff8ea', '#f6dcd6', '#fbe9c8'];
const CONFETTI = [...GOLD, ...ROSE, ...SOFT];
const FIREWORK = [
  ['#f3d98b', '#d9a93f', '#fff3c9'],
  ['#f0a3ad', '#d9707e', '#ffe0e3'],
  ['#e8c07a', '#c98d3a', '#fff0cc'],
  ['#efb9c4', '#cf6f86', '#fff1f3'],
];

const rand = (min, max) => min + Math.random() * (max - min);
const pick = (list) => list[Math.floor(Math.random() * list.length)];

const HEART_PATH =
  'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z';

export class Effects {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.timers = new Set();
    this.raf = 0;
    this.last = 0;
    this.ambient = false;
    this.ambientClock = 0;
    this.reduced = false;
    this.sprites = new Map();
    this.heart = new Path2D(HEART_PATH); // created here: Path2D does not exist on the server
    this.resize = this.resize.bind(this);
    this.frame = this.frame.bind(this);
    this.resize();
    window.addEventListener('resize', this.resize);
  }

  get width() {
    return this.canvas.clientWidth;
  }

  get height() {
    return this.canvas.clientHeight;
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.dpr = dpr;
  }

  destroy() {
    window.removeEventListener('resize', this.resize);
    cancelAnimationFrame(this.raf);
    this.timers.forEach(clearTimeout);
    this.timers.clear();
    this.particles = [];
  }

  later(ms, fn) {
    const id = setTimeout(() => {
      this.timers.delete(id);
      fn();
    }, ms);
    this.timers.add(id);
  }

  // A soft glowing dot, drawn once per colour and reused (much cheaper than shadowBlur).
  sprite(color) {
    let canvas = this.sprites.get(color);
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.width = canvas.height = 64;
      const c = canvas.getContext('2d');
      const g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(0.18, color);
      g.addColorStop(0.5, `${color}88`);
      g.addColorStop(1, `${color}00`);
      c.fillStyle = g;
      c.fillRect(0, 0, 64, 64);
      this.sprites.set(color, canvas);
    }
    return canvas;
  }

  add(p) {
    if (this.particles.length > 700) this.particles.shift();
    this.particles.push(p);
    this.start();
  }

  start() {
    if (this.raf) return;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  // ---------- emitters ----------

  confetti(x, y, { count = 70, angle = -Math.PI / 2, spread = 0.9, power = 1 } = {}) {
    for (let i = 0; i < count; i += 1) {
      const a = angle + rand(-spread, spread);
      const v = rand(380, 900) * power;
      this.add({
        type: 'confetti',
        x,
        y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        w: rand(6, 11),
        h: rand(3, 6),
        round: Math.random() < 0.25,
        rot: rand(0, 6.28),
        vr: rand(-9, 9),
        flip: rand(0, 6.28),
        color: pick(CONFETTI),
        life: 0,
        max: rand(3.4, 5.6),
        drag: rand(1.6, 2.4),
        gravity: rand(620, 820),
      });
    }
  }

  shower(count = 40) {
    for (let i = 0; i < count; i += 1) {
      this.add({
        type: 'confetti',
        x: rand(0, this.width),
        y: rand(-60, -10),
        vx: rand(-60, 60),
        vy: rand(60, 220),
        w: rand(6, 10),
        h: rand(3, 5),
        round: Math.random() < 0.3,
        rot: rand(0, 6.28),
        vr: rand(-5, 5),
        flip: rand(0, 6.28),
        color: pick(CONFETTI),
        life: 0,
        max: rand(5, 8),
        drag: 0.9,
        gravity: rand(120, 200),
      });
    }
  }

  firework(x, targetY, scale = 1) {
    const palette = pick(FIREWORK);
    this.add({
      type: 'rocket',
      scale,
      x,
      y: this.height + 10,
      vx: rand(-30, 30),
      vy: -rand(620, 820),
      targetY,
      palette,
      life: 0,
      max: 3,
    });
  }

  explode(x, y, palette, scale = 1) {
    const count = Math.round(64 * scale);
    const power = rand(230, 330) * (0.5 + scale / 2);
    for (let i = 0; i < count; i += 1) {
      const a = (i / count) * Math.PI * 2 + rand(-0.05, 0.05);
      const v = power * rand(0.55, 1);
      this.add({
        type: 'spark',
        x,
        y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        color: pick(palette),
        size: rand(0.8, 1.5),
        life: 0,
        max: rand(1.1, 1.8),
        drag: 1.9,
        gravity: 150,
      });
    }
    // a few slow glitter sparks that fall like golden rain
    for (let i = 0; i < Math.round(16 * scale); i += 1) {
      const a = rand(0, 6.28);
      const v = rand(30, 110);
      this.add({
        type: 'spark',
        x,
        y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        color: palette[0],
        size: rand(0.5, 0.9),
        life: 0,
        max: rand(1.8, 2.8),
        drag: 1.2,
        gravity: 120,
        twinkle: true,
      });
    }
  }

  hearts(count = 24, { x, y, spreadX = this.width } = {}) {
    for (let i = 0; i < count; i += 1) {
      this.add({
        type: 'heart',
        x: x ?? rand(0, spreadX),
        y: y ?? this.height + rand(10, 80),
        vx: rand(-40, 40),
        vy: -rand(70, 190),
        size: rand(10, 24),
        sway: rand(0, 6.28),
        swayRate: rand(1, 2.2),
        color: pick(Math.random() < 0.7 ? ROSE : GOLD),
        life: 0,
        max: rand(4.5, 8),
      });
    }
  }

  dust(count = 10) {
    for (let i = 0; i < count; i += 1) {
      this.add({
        type: 'dust',
        x: rand(0, this.width),
        y: rand(-20, this.height * 0.9),
        vx: rand(-10, 10),
        vy: rand(10, 36),
        size: rand(0.5, 1.2),
        color: pick(GOLD),
        phase: rand(0, 6.28),
        life: 0,
        max: rand(5, 9),
      });
    }
  }

  /**
   * The show at the end.
   * intensity "full": big confetti, many fireworks. "gentle": light confetti, a few small fireworks,
   * and more hearts and gold dust.
   */
  celebrate({ origin, reduced = false, intensity = 'full' } = {}) {
    this.reduced = reduced;
    const w = this.width;
    const h = this.height;

    if (reduced) {
      this.hearts(14);
      this.dust(16);
      this.setAmbient(true);
      return;
    }

    const ox = origin?.x ?? w / 2;
    const oy = origin?.y ?? h * 0.8;

    if (intensity === 'gentle') {
      this.confetti(ox, oy, { count: 38, spread: 0.8, power: 0.85 });
      this.dust(22);
      this.later(120, () => this.hearts(28));
      const shots = [
        [0.3, 0.34, 600],
        [0.7, 0.3, 1200],
        [0.5, 0.2, 2100],
        [0.18, 0.4, 3000],
        [0.82, 0.38, 3700],
      ];
      shots.forEach(([fx, fy, at]) => this.later(at, () => this.firework(w * fx, h * fy, 0.62)));
      this.later(1500, () => this.shower(16));
      this.later(3400, () => this.shower(14));
      this.later(2600, () => this.hearts(16));
      this.later(5000, () => this.setAmbient(true));
      return;
    }

    this.confetti(ox, oy, { count: 90, spread: 0.7, power: 1.05 });
    this.later(60, () => this.confetti(0, h, { count: 70, angle: -1.15, spread: 0.45 }));
    this.later(60, () => this.confetti(w, h, { count: 70, angle: -Math.PI + 1.15, spread: 0.45 }));
    this.later(120, () => this.hearts(26));

    const shots = [
      [0.5, 0.3, 250],
      [0.24, 0.4, 600],
      [0.76, 0.36, 900],
      [0.4, 0.22, 1500],
      [0.62, 0.28, 1850],
      [0.14, 0.3, 2400],
      [0.86, 0.26, 2700],
      [0.5, 0.4, 3400],
      [0.3, 0.24, 4100],
      [0.7, 0.22, 4500],
      [0.5, 0.18, 5300],
      [0.2, 0.36, 5800],
      [0.8, 0.34, 6200],
    ];
    shots.forEach(([fx, fy, at]) => this.later(at, () => this.firework(w * fx, h * fy)));

    this.later(1800, () => this.shower(36));
    this.later(3600, () => this.confetti(w * 0.5, h, { count: 60, spread: 0.6, power: 1.1 }));
    this.later(4800, () => this.shower(36));
    this.later(6000, () => this.hearts(20));

    this.later(7000, () => this.setAmbient(true));
  }

  /** Slow golden dust and hearts that keep the finale alive. */
  setAmbient(on) {
    this.ambient = on;
    if (on) this.start();
  }

  // ---------- drawing ----------

  frame(now) {
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;

    if (this.ambient) {
      this.ambientClock += dt;
      if (this.ambientClock > (this.reduced ? 0.9 : 0.45)) {
        this.ambientClock = 0;
        if (this.particles.length < 70) {
          if (Math.random() < 0.65) this.dust(1);
          else this.hearts(1);
        }
      }
    }

    const { ctx, dpr } = this;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, this.width, this.height);

    // Particles born during this frame (a rocket exploding) land in the new list and start next frame.
    const current = this.particles;
    this.particles = [];
    for (const p of current) {
      p.life += dt;
      if (p.life >= p.max) continue;
      if (this.step(p, dt)) continue;
      this.draw(p);
      this.particles.push(p);
    }

    ctx.globalAlpha = 1;
    if (this.particles.length || this.ambient || this.timers.size) {
      this.raf = requestAnimationFrame(this.frame);
    } else {
      this.raf = 0;
      ctx.clearRect(0, 0, this.width, this.height);
    }
  }

  // Moves a particle. Returns true when it should be removed.
  step(p, dt) {
    switch (p.type) {
      case 'rocket':
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 120 * dt;
        p.trail = p.trail ?? [];
        p.trail.push([p.x, p.y]);
        if (p.trail.length > 9) p.trail.shift();
        if (p.y <= p.targetY || p.vy > -80) {
          this.explode(p.x, p.y, p.palette, p.scale);
          return true;
        }
        return false;
      case 'heart':
        p.sway += p.swayRate * dt;
        p.x += (p.vx + Math.sin(p.sway) * 38) * dt;
        p.y += p.vy * dt;
        return false;
      case 'dust':
        p.phase += dt * 2;
        p.x += (p.vx + Math.sin(p.phase) * 8) * dt;
        p.y += p.vy * dt;
        return false;
      default: {
        const k = Math.exp(-p.drag * dt);
        p.vx *= k;
        p.vy = p.vy * k + p.gravity * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.type === 'confetti') {
          p.rot += p.vr * dt;
          p.flip += 7 * dt;
        }
        return p.y > this.height + 80;
      }
    }
  }

  draw(p) {
    const { ctx } = this;
    const t = p.life / p.max;
    const fade = t < 0.1 ? t / 0.1 : t > 0.7 ? Math.max(0, (1 - t) / 0.3) : 1;

    if (p.type === 'confetti') {
      ctx.globalAlpha = fade;
      ctx.fillStyle = p.color;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.scale(1, Math.cos(p.flip));
      if (p.round) {
        ctx.beginPath();
        ctx.arc(0, 0, p.h, 0, 6.28);
        ctx.fill();
      } else {
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      }
      ctx.restore();
    } else if (p.type === 'spark') {
      const flicker = p.twinkle ? 0.55 + 0.45 * Math.sin(p.life * 28 + p.x) : 1;
      ctx.globalAlpha = fade * flicker;
      const speed = Math.hypot(p.vx, p.vy);
      if (speed > 40) {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.size * 1.6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 0.045, p.y - p.vy * 0.045);
        ctx.stroke();
      }
      const s = 14 * p.size;
      ctx.drawImage(this.sprite(p.color), p.x - s / 2, p.y - s / 2, s, s);
    } else if (p.type === 'rocket') {
      const trail = p.trail ?? [];
      ctx.lineCap = 'round';
      for (let i = 1; i < trail.length; i += 1) {
        ctx.globalAlpha = (i / trail.length) * 0.7;
        ctx.strokeStyle = p.palette[0];
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(trail[i - 1][0], trail[i - 1][1]);
        ctx.lineTo(trail[i][0], trail[i][1]);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.drawImage(this.sprite(p.palette[2]), p.x - 9, p.y - 9, 18, 18);
    } else if (p.type === 'heart') {
      ctx.globalAlpha = fade * 0.9;
      ctx.fillStyle = p.color;
      const s = p.size / 24;
      ctx.save();
      ctx.translate(p.x - p.size / 2, p.y - p.size / 2);
      ctx.rotate(Math.sin(p.sway) * 0.25);
      ctx.scale(s, s);
      ctx.fill(this.heart);
      ctx.restore();
    } else if (p.type === 'dust') {
      ctx.globalAlpha = fade * (0.55 + 0.45 * Math.sin(p.phase * 3));
      const s = 18 * p.size;
      ctx.drawImage(this.sprite(p.color), p.x - s / 2, p.y - s / 2, s, s);
    }
  }
}
