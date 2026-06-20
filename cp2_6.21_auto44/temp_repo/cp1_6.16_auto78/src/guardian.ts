import { CONFIG, AURORA_COLORS } from './config';

interface Particle {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  size: number;
  colorIndex: number;
  vx: number;
  vy: number;
  alpha: number;
  phase: number;
  pulseSpeed: number;
}

export class Guardian {
  private particles: Particle[] = [];
  private x: number = 0;
  private y: number = 0;
  private active: boolean = false;
  private appearProgress: number = 0;
  private actionPhase: number = 0;
  private actionType: 'raise' | 'glow' = 'raise';
  private time: number = 0;
  private audioContext: AudioContext | null = null;

  constructor(audioContext: AudioContext | null) {
    this.audioContext = audioContext;
  }

  init(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.active = true;
    this.appearProgress = 0;
    this.actionPhase = 0;
    this.time = 0;
    this.particles = [];
    this.actionType = Math.random() > 0.5 ? 'raise' : 'glow';

    for (let i = 0; i < CONFIG.GUARDIAN_PARTICLE_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 30 + Math.random() * 80;
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;

      this.particles.push({
        x: px,
        y: py,
        baseX: px,
        baseY: py,
        size: CONFIG.GUARDIAN_PARTICLE_MIN_SIZE + Math.random() * (CONFIG.GUARDIAN_PARTICLE_MAX_SIZE - CONFIG.GUARDIAN_PARTICLE_MIN_SIZE),
        colorIndex: Math.floor(Math.random() * AURORA_COLORS.length),
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        alpha: 0,
        phase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.5 + Math.random() * 1,
      });
    }

    this.playVictorySound();
  }

  update(deltaTime: number, screenScale: number): void {
    if (!this.active) return;

    const dt = deltaTime / 1000;
    this.time += dt;

    if (this.appearProgress < 1) {
      this.appearProgress += dt * 0.5;
      this.appearProgress = Math.min(this.appearProgress, 1);
    }

    if (this.appearProgress >= 0.5 && this.actionPhase < 1) {
      this.actionPhase += dt * 0.3;
      this.actionPhase = Math.min(this.actionPhase, 1);
    }

    const appearEase = 1 - Math.pow(1 - this.appearProgress, 3);

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.phase += dt * p.pulseSpeed;

      const particleY = i / this.particles.length;
      let targetY = this.y - 60 * screenScale + particleY * 120 * screenScale;
      let targetX = this.x + Math.sin(this.time * 2 + i * 0.3) * 30 * screenScale;

      if (this.actionType === 'raise' && this.actionPhase > 0) {
        const raiseAmount = Math.sin(this.actionPhase * Math.PI) * 50 * screenScale;
        if (particleY < 0.3) {
          targetY -= raiseAmount;
        }
      }

      p.baseX += (targetX - p.baseX) * dt * 2;
      p.baseY += (targetY - p.baseY) * dt * 2;

      p.x = p.baseX + Math.sin(p.phase) * 5 * screenScale;
      p.y = p.baseY + Math.cos(p.phase * 0.7) * 3 * screenScale;

      const baseAlpha = 0.6 + Math.sin(p.phase) * 0.3;
      p.alpha = baseAlpha * appearEase;

      p.colorIndex = Math.floor((this.time * 10 + i) % AURORA_COLORS.length);
    }
  }

  draw(ctx: CanvasRenderingContext2D, screenScale: number): void {
    if (!this.active) return;

    const appearEase = 1 - Math.pow(1 - this.appearProgress, 3);

    if (this.actionType === 'glow' && this.actionPhase > 0.3) {
      const glowRadius = 80 * screenScale + Math.sin(this.time * 3) * 20 * screenScale;
      const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, glowRadius);
      const color = AURORA_COLORS[Math.floor(this.time * 5) % AURORA_COLORS.length];
      gradient.addColorStop(0, color.glow.replace('0.6', String(0.4 * appearEase)));
      gradient.addColorStop(0.5, color.glow.replace('0.6', String(0.1 * appearEase)));
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(this.x, this.y, glowRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const p of this.particles) {
      const color = AURORA_COLORS[p.colorIndex];

      const glowGradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
      glowGradient.addColorStop(0, color.glow.replace('0.6', String(p.alpha * 0.5)));
      glowGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowColor = color.hex;
      ctx.shadowBlur = 10 * screenScale;
      ctx.fillStyle = color.hex;
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * screenScale, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    }
  }

  private playVictorySound(): void {
    if (!this.audioContext) return;

    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, i) => {
      const oscillator = this.audioContext!.createOscillator();
      const gainNode = this.audioContext!.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext!.destination);

      oscillator.frequency.value = freq;
      oscillator.type = 'sine';

      const startTime = this.audioContext!.currentTime + i * 0.15;
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.8);

      oscillator.start(startTime);
      oscillator.stop(startTime + 0.8);
    });
  }

  isActive(): boolean {
    return this.active;
  }

  reset(): void {
    this.active = false;
    this.particles = [];
  }
}
