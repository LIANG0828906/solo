import {
  AnimationParticle,
  TrailParticle,
  Point,
  CANVAS_CONFIG,
  VORTEX_CONFIG,
  PULSE_CONFIG,
  WAVE_CONFIG,
} from './types';

export type ActiveAnimationType =
  | { kind: 'VORTEX'; startTime: number; particles: AnimationParticle[]; centerX: number; centerY: number }
  | { kind: 'PULSE'; startTime: number; phase: number; centerX: number; centerY: number; size: number }
  | { kind: 'WAVE'; startTime: number; items: WaveItem[] }
  | { kind: 'FLASH'; startTime: number; flashCount: number; showPopup: boolean; popupText: string };

interface WaveItem {
  baseX: number;
  baseY: number;
  size: number;
  color: string;
  phaseOffset: number;
}

export class AnimationEngine {
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;

  private trailParticles: TrailParticle[] = [];
  private activeAnimations: ActiveAnimationType[] = [];
  private rafId: number | null = null;
  private onFrameCallback: (() => void) | null = null;
  private flashOverlay = 0;
  private lastTrailPoint: Point | null = null;
  private isDrawingPath = false;
  private currentPath: Point[] = [];

  constructor(ctx: CanvasRenderingContext2D, width: number, height: number) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
  }

  setSize(w: number, h: number) {
    this.width = w;
    this.height = h;
  }

  setOnFrame(cb: () => void) {
    this.onFrameCallback = cb;
  }

  start() {
    if (this.rafId !== null) return;
    const loop = () => {
      this.render();
      if (this.onFrameCallback) this.onFrameCallback();
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  stop() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  beginPathDrawing() {
    this.isDrawingPath = true;
    this.currentPath = [];
    this.lastTrailPoint = null;
  }

  addPathPoint(p: Point) {
    if (!this.isDrawingPath) return;
    this.currentPath.push(p);
    if (!this.lastTrailPoint) {
      this.spawnTrailParticles(p.x, p.y);
    } else {
      const dx = p.x - this.lastTrailPoint.x;
      const dy = p.y - this.lastTrailPoint.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const steps = Math.max(1, Math.floor(dist / 8));
      for (let i = 0; i < steps; i++) {
        const t = i / steps;
        this.spawnTrailParticles(
          this.lastTrailPoint.x + dx * t,
          this.lastTrailPoint.y + dy * t
        );
      }
    }
    this.lastTrailPoint = p;
  }

  endPathDrawing() {
    this.isDrawingPath = false;
    const path = this.currentPath.slice();
    this.currentPath = [];
    this.lastTrailPoint = null;
    return path;
  }

  private spawnTrailParticles(x: number, y: number) {
    const count = 2;
    for (let i = 0; i < count; i++) {
      if (this.trailParticles.length >= CANVAS_CONFIG.TRAIL_MAX_PARTICLES) {
        this.trailParticles.shift();
      }
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 0.8;
      this.trailParticles.push({
        x,
        y,
        size:
          CANVAS_CONFIG.TRAIL_MIN_SIZE +
          Math.random() * (CANVAS_CONFIG.TRAIL_MAX_SIZE - CANVAS_CONFIG.TRAIL_MIN_SIZE),
        life: 1,
        maxLife: 1,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
      });
    }
  }

  triggerVortex(cx: number, cy: number) {
    const particles: AnimationParticle[] = [];
    for (let i = 0; i < VORTEX_CONFIG.PARTICLE_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 20 + Math.random() * 180;
      particles.push({
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
        size: 2 + Math.random() * 4,
        color: this.lerpColor(
          VORTEX_CONFIG.COLOR_START,
          VORTEX_CONFIG.COLOR_END,
          Math.random()
        ),
        life: 1,
        maxLife: 1,
        angle,
        radius,
        angularSpeed: 0.02 + Math.random() * 0.04,
      });
    }
    this.activeAnimations.push({
      kind: 'VORTEX',
      startTime: performance.now(),
      particles,
      centerX: cx,
      centerY: cy,
    });
  }

  triggerPulse(cx: number, cy: number) {
    this.activeAnimations.push({
      kind: 'PULSE',
      startTime: performance.now(),
      phase: 0,
      centerX: cx,
      centerY: cy,
      size: 80,
    });
  }

  triggerWave() {
    const items: WaveItem[] = [];
    const colors = ['#00FFAA', '#FF6B6B', '#4ECDC4', '#FFE66D', '#C44DFF'];
    const cols = 5;
    const rows = 3;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        items.push({
          baseX: (this.width / (cols + 1)) * (c + 1),
          baseY: (this.height / (rows + 1)) * (r + 1),
          size: 18 + Math.random() * 12,
          color: colors[(r + c) % colors.length],
          phaseOffset: (c + r) * 0.4,
        });
      }
    }
    this.activeAnimations.push({
      kind: 'WAVE',
      startTime: performance.now(),
      items,
    });
  }

  triggerFlash(text: string = '✨ 手势识别成功！') {
    this.activeAnimations.push({
      kind: 'FLASH',
      startTime: performance.now(),
      flashCount: 0,
      showPopup: false,
      popupText: text,
    });
  }

  clearAll() {
    this.activeAnimations = [];
    this.trailParticles = [];
    this.flashOverlay = 0;
  }

  private render() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.drawGridBackground();
    this.updateAndDrawTrail();
    this.drawCurrentPath();
    this.updateAndDrawAnimations();
    this.drawFlashOverlay();
  }

  private drawGridBackground() {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = 0.06;
    ctx.strokeStyle = '#00FFAA';
    ctx.lineWidth = 1;
    const grid = 40;
    for (let x = 0; x < this.width; x += grid) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
      ctx.stroke();
    }
    for (let y = 0; y < this.height; y += grid) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawCurrentPath() {
    if (this.currentPath.length < 2) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = CANVAS_CONFIG.TRAIL_COLOR;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = CANVAS_CONFIG.TRAIL_COLOR;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(this.currentPath[0].x, this.currentPath[0].y);
    for (let i = 1; i < this.currentPath.length; i++) {
      ctx.lineTo(this.currentPath[i].x, this.currentPath[i].y);
    }
    ctx.stroke();
    ctx.restore();
  }

  private updateAndDrawTrail() {
    const ctx = this.ctx;
    const alive: TrailParticle[] = [];
    for (const p of this.trailParticles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.life -= 0.025;
      if (p.life > 0) {
        alive.push(p);
        const alpha = Math.max(0, p.life / p.maxLife);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = CANVAS_CONFIG.TRAIL_COLOR;
        ctx.shadowColor = CANVAS_CONFIG.TRAIL_COLOR;
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
    this.trailParticles = alive;
  }

  private updateAndDrawAnimations() {
    const now = performance.now();
    const alive: ActiveAnimationType[] = [];
    for (const anim of this.activeAnimations) {
      let finished = false;
      switch (anim.kind) {
        case 'VORTEX':
          finished = this.updateVortex(anim, now);
          break;
        case 'PULSE':
          finished = this.updatePulse(anim, now);
          break;
        case 'WAVE':
          finished = this.updateWave(anim, now);
          break;
        case 'FLASH':
          finished = this.updateFlash(anim, now);
          break;
      }
      if (!finished) alive.push(anim);
    }
    this.activeAnimations = alive;
  }

  private updateVortex(anim: Extract<ActiveAnimationType, { kind: 'VORTEX' }>, now: number): boolean {
    const elapsed = now - anim.startTime;
    const progress = Math.min(1, elapsed / VORTEX_CONFIG.DURATION);
    if (progress >= 1) return true;

    const ctx = this.ctx;
    for (const p of anim.particles) {
      if (p.angle === undefined || p.radius === undefined || p.angularSpeed === undefined) continue;
      p.angle += p.angularSpeed;
      p.radius *= 0.998;
      const alpha = 1 - progress;
      const t = (now - anim.startTime) / 1000;
      const wobble = Math.sin(t * 3 + p.radius * 0.01) * 4;
      const x = anim.centerX + Math.cos(p.angle) * p.radius + wobble;
      const y = anim.centerY + Math.sin(p.angle) * p.radius + wobble;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(x, y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    return false;
  }

  private updatePulse(anim: Extract<ActiveAnimationType, { kind: 'PULSE' }>, now: number): boolean {
    const elapsed = now - anim.startTime;
    const totalDuration = PULSE_CONFIG.PERIOD * PULSE_CONFIG.REPEAT;
    if (elapsed >= totalDuration) return true;

    const cycleProgress = (elapsed % PULSE_CONFIG.PERIOD) / PULSE_CONFIG.PERIOD;
    const pulse = Math.sin(cycleProgress * Math.PI * 2) * 0.5 + 0.5;
    const scale = 1 + (PULSE_CONFIG.AMPLITUDE - 1) * pulse;
    const size = anim.size * scale;
    const alpha = 1 - elapsed / totalDuration;

    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = alpha * 0.9;
    ctx.translate(anim.centerX, anim.centerY);

    const colors = ['#FF6B6B', '#00FFAA', '#4ECDC4'];
    for (let layer = 0; layer < 3; layer++) {
      const s = size * (1 - layer * 0.2);
      ctx.strokeStyle = colors[layer % colors.length];
      ctx.lineWidth = 3;
      ctx.shadowColor = colors[layer % colors.length];
      ctx.shadowBlur = 20;
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        const angle = (i / 3) * Math.PI * 2 - Math.PI / 2;
        const x = Math.cos(angle) * s;
        const y = Math.sin(angle) * s;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    }

    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(angle) * size * 0.6;
      const y = Math.sin(angle) * size * 0.6;
      ctx.fillStyle = colors[i];
      ctx.shadowColor = colors[i];
      ctx.shadowBlur = 30;
      ctx.beginPath();
      ctx.arc(x, y, 6 * scale, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
    return false;
  }

  private updateWave(anim: Extract<ActiveAnimationType, { kind: 'WAVE' }>, now: number): boolean {
    const elapsed = now - anim.startTime;
    const totalDuration = WAVE_CONFIG.PERIOD * 3;
    if (elapsed >= totalDuration) return true;

    const t = elapsed / (WAVE_CONFIG.PERIOD / (Math.PI * 2));
    const alpha = 1 - elapsed / totalDuration;
    const ctx = this.ctx;

    ctx.save();
    ctx.globalAlpha = alpha;
    for (const item of anim.items) {
      const yOffset = Math.sin(t + item.phaseOffset) * WAVE_CONFIG.AMPLITUDE * 0.4;
      const xOffset = Math.cos(t * 0.7 + item.phaseOffset) * 20;
      const x = item.baseX + xOffset;
      const y = item.baseY + yOffset;
      const scale = 1 + Math.sin(t * 1.5 + item.phaseOffset) * 0.2;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.sin(t + item.phaseOffset) * 0.2);
      ctx.fillStyle = item.color;
      ctx.shadowColor = item.color;
      ctx.shadowBlur = 22;
      this.drawStar(ctx, 0, 0, 5, item.size * scale, item.size * 0.45 * scale);
      ctx.fill();
      ctx.restore();
    }

    ctx.strokeStyle = '#00FFAA';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00FFAA';
    ctx.shadowBlur = 10;
    ctx.globalAlpha = alpha * 0.5;
    ctx.beginPath();
    for (let x = 0; x <= this.width; x += 5) {
      const y =
        this.height / 2 +
        Math.sin((x / this.width) * Math.PI * 4 + t) * WAVE_CONFIG.AMPLITUDE * 0.35;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return false;
  }

  private updateFlash(anim: Extract<ActiveAnimationType, { kind: 'FLASH' }>, now: number): boolean {
    const elapsed = now - anim.startTime;
    const flashInterval = 180;
    const totalFlashes = 3;
    const totalFlashTime = flashInterval * totalFlashes * 2;

    if (elapsed < totalFlashTime) {
      const flashIdx = Math.floor(elapsed / flashInterval);
      const isOn = flashIdx % 2 === 0;
      this.flashOverlay = isOn ? 0.55 : 0;
      anim.flashCount = flashIdx;
    } else {
      this.flashOverlay = Math.max(0, this.flashOverlay - 0.03);
      anim.showPopup = true;
    }

    if (anim.showPopup) {
      this.drawPopup(anim.popupText, 1 - Math.min(1, (elapsed - totalFlashTime) / 600));
    }

    return elapsed > totalFlashTime + 2600;
  }

  private drawPopup(text: string, appearProgress: number) {
    const ctx = this.ctx;
    const w = 380;
    const h = 140;
    const x = (this.width - w) / 2;
    const y = (this.height - h) / 2;
    const p = Math.min(1, appearProgress * 2);
    const scale = 0.8 + p * 0.2;

    ctx.save();
    ctx.translate(this.width / 2, this.height / 2);
    ctx.scale(scale, scale);
    ctx.translate(-this.width / 2, -this.height / 2);
    ctx.globalAlpha = Math.min(1, appearProgress * 2);

    ctx.fillStyle = 'rgba(26, 26, 46, 0.92)';
    ctx.strokeStyle = '#00FFAA';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00FFAA';
    ctx.shadowBlur = 30;
    this.roundRect(ctx, x, y, w, h, 16);
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, this.width / 2, this.height / 2 - 10);

    ctx.fillStyle = '#00FFAA';
    ctx.font = '14px system-ui, -apple-system, sans-serif';
    ctx.fillText('Gesture Triggered Successfully', this.width / 2, this.height / 2 + 24);
    ctx.restore();
  }

  private drawFlashOverlay() {
    if (this.flashOverlay <= 0.01) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = this.flashOverlay;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.restore();
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  private drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outer: number, inner: number) {
    let rot = (Math.PI / 2) * 3;
    const step = Math.PI / spikes;
    ctx.beginPath();
    ctx.moveTo(cx, cy - outer);
    for (let i = 0; i < spikes; i++) {
      let x = cx + Math.cos(rot) * outer;
      let y = cy + Math.sin(rot) * outer;
      ctx.lineTo(x, y);
      rot += step;
      x = cx + Math.cos(rot) * inner;
      y = cy + Math.sin(rot) * inner;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outer);
    ctx.closePath();
  }

  private lerpColor(a: string, b: string, t: number): string {
    const pa = this.parseHex(a);
    const pb = this.parseHex(b);
    const r = Math.round(pa[0] + (pb[0] - pa[0]) * t);
    const g = Math.round(pa[1] + (pb[1] - pa[1]) * t);
    const bl = Math.round(pa[2] + (pb[2] - pa[2]) * t);
    return `rgb(${r},${g},${bl})`;
  }

  private parseHex(hex: string): [number, number, number] {
    const h = hex.replace('#', '');
    return [
      parseInt(h.substring(0, 2), 16),
      parseInt(h.substring(2, 4), 16),
      parseInt(h.substring(4, 6), 16),
    ];
  }

  getAnimationCount(): number {
    return this.activeAnimations.length;
  }
}
