import type { AudioAnalysis } from './audioEngine';

export interface NoteVisual {
  id: number;
  y: number;
  lane: number;
  alpha: number;
}

export interface HitEffect {
  id: number;
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  startTime: number;
  duration: number;
  color: string;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  active: boolean;
}

interface WaveFrame {
  left: Float32Array;
  right: Float32Array;
  mix: Float32Array;
  timestamp: number;
  bands: { low: number; mid: number; high: number };
}

const LANE_KEYS = ['S', 'D', 'F', 'J', 'K', 'L'];
const LANE_COLORS = [
  '#ff6b6b', '#ffa502', '#2ed573',
  '#1e90ff', '#a55eea', '#ff4757'
];

const TRAIL_TIME = 500;
const MAX_TRAIL_OFFSET = 30;

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width = 0;
  private height = 0;
  private dpr = 1;

  private waveHistory: WaveFrame[] = [];
  private readonly trailTime = TRAIL_TIME;
  private readonly maxTrailOffset = MAX_TRAIL_OFFSET;

  private readonly maxParticles = 300;
  private particlePool: Particle[] = [];

  private fireworkParticles: Particle[] = [];
  private fireworkActive = false;
  private fireworkStartTime = 0;
  private readonly fireworkDuration = 1000;

  private hitEffects: HitEffect[] = [];
  private effectIdCounter = 0;

  private laneCenters: number[] = [];
  private judgeLineY = 0;
  private noteHeight = 30;
  private noteWidth = 60;

  private fps = 0;
  private frameCount = 0;
  private fpsUpdateTime = 0;

  private handleResize: () => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Cannot get 2D context');
    this.ctx = ctx;
    this.initParticlePool();
    this.handleResize = () => this.resize();
    window.addEventListener('resize', this.handleResize);
    this.resize();
  }

  private initParticlePool(): void {
    for (let i = 0; i < this.maxParticles; i++) {
      this.particlePool.push({
        x: 0, y: 0, vx: 0, vy: 0,
        life: 0, maxLife: 0, color: '#ffffff', size: 2, active: false
      });
    }
  }

  resize(): void {
    this.dpr = window.devicePixelRatio || 1;
    this.width = this.canvas.clientWidth;
    this.height = this.canvas.clientHeight;

    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(this.dpr, this.dpr);

    this.judgeLineY = this.height * 0.85;

    const laneCount = 6;
    const laneSpacing = this.width / (laneCount + 1);
    this.laneCenters = [];
    for (let i = 0; i < laneCount; i++) {
      this.laneCenters.push(laneSpacing * (i + 1));
    }

    this.noteWidth = Math.min(80, laneSpacing * 0.8);
    this.noteHeight = Math.max(20, this.height * 0.04);
  }

  update(
    analysis: AudioAnalysis | null,
    notes: NoteVisual[],
    deltaTime: number,
    currentTime: number
  ): void {
    this.calculateFPS(currentTime);

    if (analysis) {
      this.updateWaveHistory(analysis);
      this.spawnSpectrumParticles(analysis.bands, currentTime);
    }

    this.updateParticles(deltaTime);
    this.updateHitEffects(currentTime);
    this.updateFireworks(currentTime);
    this.draw(notes, currentTime);
  }

  private calculateFPS(currentTime: number): void {
    this.frameCount++;
    if (currentTime - this.fpsUpdateTime >= 1000) {
      this.fps = Math.round(this.frameCount * 1000 / (currentTime - this.fpsUpdateTime));
      this.frameCount = 0;
      this.fpsUpdateTime = currentTime;
    }
  }

  private updateWaveHistory(analysis: AudioAnalysis): void {
    const frame: WaveFrame = {
      left: new Float32Array(analysis.timeDomainLeft),
      right: new Float32Array(analysis.timeDomainRight),
      mix: new Float32Array(analysis.timeDomain),
      timestamp: performance.now(),
      bands: { low: analysis.bands.low, mid: analysis.bands.mid, high: analysis.bands.high }
    };
    this.waveHistory.push(frame);

    const now = performance.now();
    while (this.waveHistory.length > 0 && now - this.waveHistory[0].timestamp > this.trailTime) {
      this.waveHistory.shift();
    }
  }

  private spawnSpectrumParticles(bands: { low: number; mid: number; high: number }, currentTime: number): void {
    const spawnLow = Math.floor(bands.low * 4);
    const spawnMid = Math.floor(bands.mid * 3);
    const spawnHigh = Math.floor(bands.high * 3);

    for (let i = 0; i < spawnLow; i++) {
      this.spawnParticle(bands.low, 'low', currentTime);
    }
    for (let i = 0; i < spawnMid; i++) {
      this.spawnParticle(bands.mid, 'mid', currentTime);
    }
    for (let i = 0; i < spawnHigh; i++) {
      this.spawnParticle(bands.high, 'high', currentTime);
    }
  }

  private spawnParticle(strength: number, band: 'low' | 'mid' | 'high', currentTime: number): void {
    const particle = this.particlePool.find(p => !p.active);
    if (!particle) return;

    const centerX = this.width / 2 + (Math.random() - 0.5) * this.width * 0.6;
    const centerY = this.height * 0.5 + (Math.random() - 0.5) * this.height * 0.4;

    const angle = Math.random() * Math.PI * 2;
    const speed = 50 + strength * 200;

    particle.x = centerX;
    particle.y = centerY;
    particle.vx = Math.cos(angle) * speed;
    particle.vy = Math.sin(angle) * speed;
    particle.life = currentTime;
    particle.maxLife = currentTime + 500 + Math.random() * 500;
    particle.size = 2 + strength * 4;
    particle.active = true;

    const hue = band === 'low'
      ? Math.random() * 30
      : band === 'mid'
      ? 120 + Math.random() * 40
      : 220 + Math.random() * 60;

    particle.color = `hsla(${hue}, 100%, 60%, `;
  }

  triggerFirework(currentTime: number): void {
    this.fireworkActive = true;
    this.fireworkStartTime = currentTime;
    this.fireworkParticles = [];

    const colors = ['#ff6b6b', '#ffa502', '#2ed573', '#1e90ff', '#a55eea', '#ff4757', '#00ffff', '#ffd700'];

    for (let i = 0; i < 50; i++) {
      const x = this.width * (0.2 + Math.random() * 0.6);
      const y = this.height * (0.2 + Math.random() * 0.6);
      const angle = Math.random() * Math.PI * 2;
      const speed = 100 + Math.random() * 200;

      this.fireworkParticles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: currentTime,
        maxLife: currentTime + this.fireworkDuration,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 3 + Math.random() * 4,
        active: true
      });
    }
  }

  addHitEffect(lane: number, currentTime: number): void {
    const x = this.laneCenters[lane];
    const y = this.judgeLineY;

    this.hitEffects.push({
      id: this.effectIdCounter++,
      x, y,
      radius: 10,
      maxRadius: 60,
      startTime: currentTime,
      duration: 300,
      color: LANE_COLORS[lane]
    });
  }

  private updateParticles(deltaTime: number): void {
    const dt = deltaTime / 1000;
    const now = performance.now();

    for (const particle of this.particlePool) {
      if (!particle.active) continue;

      if (now >= particle.maxLife) {
        particle.active = false;
        continue;
      }

      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vx *= 0.98;
      particle.vy *= 0.98;
    }
  }

  private updateHitEffects(currentTime: number): void {
    this.hitEffects = this.hitEffects.filter(effect => {
      const elapsed = currentTime - effect.startTime;
      if (elapsed >= effect.duration) return false;

      const progress = elapsed / effect.duration;
      effect.radius = 10 + (effect.maxRadius - 10) * progress;
      return true;
    });
  }

  private updateFireworks(currentTime: number): void {
    if (!this.fireworkActive) return;

    const elapsed = currentTime - this.fireworkStartTime;
    if (elapsed >= this.fireworkDuration) {
      this.fireworkActive = false;
      this.fireworkParticles = [];
      return;
    }

    const dt = 16 / 1000;
    for (const particle of this.fireworkParticles) {
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy += 200 * dt;
      particle.vx *= 0.99;
      particle.vy *= 0.99;
    }
  }

  private draw(notes: NoteVisual[], currentTime: number): void {
    this.ctx.fillStyle = '#0a0a1a';
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.drawLanes();
    this.drawJudgeLine();
    this.drawWaveforms();
    this.drawSpectrumParticles();
    this.drawNotes(notes);
    this.drawHitEffects(currentTime);
    this.drawFireworks(currentTime);
    this.drawFPS();
  }

  private drawLanes(): void {
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    this.ctx.lineWidth = 1;

    for (let i = 0; i <= this.laneCenters.length; i++) {
      const x = i === 0
        ? this.laneCenters[0] - this.noteWidth
        : i === this.laneCenters.length
        ? this.laneCenters[this.laneCenters.length - 1] + this.noteWidth
        : (this.laneCenters[i - 1] + this.laneCenters[i]) / 2;

      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.judgeLineY);
      this.ctx.stroke();
    }

    for (let i = 0; i < this.laneCenters.length; i++) {
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      this.ctx.fillRect(
        this.laneCenters[i] - this.noteWidth / 2,
        0,
        this.noteWidth,
        this.judgeLineY
      );
    }
  }

  private drawJudgeLine(): void {
    const gradient = this.ctx.createLinearGradient(0, this.judgeLineY, this.width, this.judgeLineY);
    gradient.addColorStop(0, 'rgba(0, 255, 255, 0)');
    gradient.addColorStop(0.3, 'rgba(0, 255, 255, 0.8)');
    gradient.addColorStop(0.7, 'rgba(153, 51, 255, 0.8)');
    gradient.addColorStop(1, 'rgba(153, 51, 255, 0)');

    this.ctx.strokeStyle = gradient;
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.judgeLineY);
    this.ctx.lineTo(this.width, this.judgeLineY);
    this.ctx.stroke();

    this.ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
    for (let i = 0; i < this.laneCenters.length; i++) {
      this.ctx.fillRect(
        this.laneCenters[i] - this.noteWidth / 2,
        this.judgeLineY - 2,
        this.noteWidth,
        4
      );
    }
  }

  private drawWaveforms(): void {
    if (this.waveHistory.length === 0) return;

    const now = performance.now();
    const baseY = this.height * 0.35;
    const amplitude = this.height * 0.12;

    for (let i = 0; i < this.waveHistory.length; i++) {
      const frame = this.waveHistory[i];
      const age = now - frame.timestamp;
      const ageRatio = age / this.trailTime;
      const alpha = Math.max(0, (1 - ageRatio)) * 0.8;
      const offset = ageRatio * this.maxTrailOffset;

      this.drawWaveform(frame.left, baseY - 40 + offset, amplitude, 'low', frame.bands.low, alpha);
      this.drawWaveform(frame.right, baseY + offset, amplitude, 'mid', frame.bands.mid, alpha);
      this.drawWaveform(frame.mix, baseY + 40 + offset, amplitude, 'high', frame.bands.high, alpha);
    }
  }

  private drawWaveform(
    data: Float32Array,
    baseY: number,
    amplitude: number,
    band: 'low' | 'mid' | 'high',
    intensity: number,
    alpha: number
  ): void {
    const colors = band === 'low'
      ? { start: [255, 0, 0], end: [255, 165, 0] }
      : band === 'mid'
      ? { start: [0, 255, 0], end: [0, 255, 200] }
      : { start: [0, 100, 255], end: [150, 0, 255] };

    const t = Math.min(1, intensity);
    const r = Math.round(colors.start[0] + (colors.end[0] - colors.start[0]) * t);
    const g = Math.round(colors.start[1] + (colors.end[1] - colors.start[1]) * t);
    const b = Math.round(colors.start[2] + (colors.end[2] - colors.start[2]) * t);

    this.ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();

    const step = this.width / (data.length - 1);

    for (let i = 0; i < data.length; i++) {
      const x = i * step;
      const y = baseY + data[i] * amplitude;

      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        const prevX = (i - 1) * step;
        const prevY = baseY + data[i - 1] * amplitude;
        const cpx = (prevX + x) / 2;
        this.ctx.quadraticCurveTo(prevX, prevY, cpx, (prevY + y) / 2);
      }
    }

    this.ctx.stroke();
  }

  private drawSpectrumParticles(): void {
    const now = performance.now();

    for (const particle of this.particlePool) {
      if (!particle.active) continue;

      const lifeProgress = (particle.maxLife - now) / (particle.maxLife - particle.life);
      const alpha = Math.max(0, lifeProgress);

      this.ctx.fillStyle = particle.color + alpha + ')';
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  private drawNotes(notes: NoteVisual[]): void {
    for (const note of notes) {
      const x = this.laneCenters[note.lane] - this.noteWidth / 2;
      const y = note.y - this.noteHeight / 2;

      const gradient = this.ctx.createLinearGradient(x, y, x + this.noteWidth, y + this.noteHeight);
      const baseColor = LANE_COLORS[note.lane];
      gradient.addColorStop(0, baseColor + Math.floor(note.alpha * 120).toString(16).padStart(2, '0'));
      gradient.addColorStop(1, baseColor + Math.floor(note.alpha * 200).toString(16).padStart(2, '0'));

      this.ctx.fillStyle = gradient;
      this.ctx.strokeStyle = baseColor + Math.floor(note.alpha * 255).toString(16).padStart(2, '0');
      this.ctx.lineWidth = 2;

      this.ctx.beginPath();
      this.roundRect(x, y, this.noteWidth, this.noteHeight, 6);
      this.ctx.fill();
      this.ctx.stroke();

      this.ctx.fillStyle = `rgba(255, 255, 255, ${note.alpha * 0.9})`;
      this.ctx.font = 'bold 16px Consolas, monospace';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(LANE_KEYS[note.lane], this.laneCenters[note.lane], note.y);
    }
  }

  private drawHitEffects(currentTime: number): void {
    for (const effect of this.hitEffects) {
      const elapsed = currentTime - effect.startTime;
      const progress = elapsed / effect.duration;
      const alpha = 1 - progress;

      const gradient = this.ctx.createRadialGradient(
        effect.x, effect.y, 0,
        effect.x, effect.y, effect.radius
      );
      gradient.addColorStop(0, effect.color + '00');
      gradient.addColorStop(0.5, effect.color + Math.floor(alpha * 150).toString(16).padStart(2, '0'));
      gradient.addColorStop(1, effect.color + '00');

      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.strokeStyle = effect.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
      this.ctx.stroke();
    }
  }

  private drawFireworks(currentTime: number): void {
    if (!this.fireworkActive) return;

    const elapsed = currentTime - this.fireworkStartTime;
    const alpha = Math.max(0, 1 - elapsed / this.fireworkDuration);

    for (const particle of this.fireworkParticles) {
      this.ctx.fillStyle = particle.color + Math.floor(alpha * 200).toString(16).padStart(2, '0');
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.fillStyle = particle.color + Math.floor(alpha * 50).toString(16).padStart(2, '0');
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size * 2 * alpha, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  private drawFPS(): void {
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.font = '12px Consolas, monospace';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`${this.fps} FPS`, 10, this.height - 10);
  }

  private roundRect(x: number, y: number, w: number, h: number, r: number): void {
    this.ctx.moveTo(x + r, y);
    this.ctx.lineTo(x + w - r, y);
    this.ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    this.ctx.lineTo(x + w, y + h - r);
    this.ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    this.ctx.lineTo(x + r, y + h);
    this.ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    this.ctx.lineTo(x, y + r);
    this.ctx.quadraticCurveTo(x, y, x + r, y);
    this.ctx.closePath();
  }

  getJudgeLineY(): number {
    return this.judgeLineY;
  }

  getLaneCenters(): number[] {
    return this.laneCenters;
  }

  getNoteHeight(): number {
    return this.noteHeight;
  }

  getHeight(): number {
    return this.height;
  }

  destroy(): void {
    window.removeEventListener('resize', this.handleResize);
  }
}
