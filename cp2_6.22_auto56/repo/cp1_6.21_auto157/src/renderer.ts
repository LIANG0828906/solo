import type { Element } from './elements';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
}

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private ripples: Ripple[] = [];
  private animationId: number | null = null;
  private lastTime: number = 0;
  private lowEndDevice: boolean;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('无法获取Canvas上下文');
    this.ctx = ctx;
    this.lowEndDevice = this.detectLowEndDevice();
    this.resize();
    this.setupResizeListener();
    this.startLoop();
  }

  private detectLowEndDevice(): boolean {
    const cores = navigator.hardwareConcurrency || 4;
    const memory = (navigator as unknown as { deviceMemory?: number }).deviceMemory || 4;
    return cores <= 2 || memory <= 2;
  }

  private resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
  }

  private setupResizeListener(): void {
    window.addEventListener('resize', () => this.resize());
  }

  private startLoop(): void {
    const loop = (time: number) => {
      const delta = time - this.lastTime;
      this.lastTime = time;
      this.update(delta / 1000);
      this.render();
      this.animationId = requestAnimationFrame(loop);
    };
    this.animationId = requestAnimationFrame(loop);
  }

  private update(delta: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * delta * 60;
      p.y += p.vy * delta * 60;
      p.vy += delta * 30;
      p.life -= delta;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const r = this.ripples[i];
      r.radius += delta * 200;
      r.alpha -= delta * 2;
      if (r.alpha <= 0 || r.radius >= r.maxRadius) {
        this.ripples.splice(i, 1);
      }
    }
  }

  private render(): void {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    this.ctx.clearRect(0, 0, w, h);

    for (const r of this.ripples) {
      this.ctx.beginPath();
      this.ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      this.ctx.strokeStyle = `rgba(251, 191, 36, ${Math.max(0, r.alpha)})`;
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }

    for (const p of this.particles) {
      const alpha = p.life / p.maxLife;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      this.ctx.fillStyle = p.color.replace('1)', `${alpha})`);
      this.ctx.fill();
      
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size * alpha * 2, 0, Math.PI * 2);
      this.ctx.fillStyle = p.color.replace('1)', `${alpha * 0.3})`);
      this.ctx.fill();
    }
  }

  spawnParticleBurst(x: number, y: number, element: Element): void {
    const particleCount = this.lowEndDevice ? 30 : Math.floor(Math.random() * 51) + 50;
    const colors = element.colors;
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.3;
      const speed = 2 + Math.random() * 4;
      const color = Math.random() > 0.5 
        ? this.hexToRgba(colors[0], 1)
        : this.hexToRgba(colors[1], 1);
      
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        color,
        size: 3 + Math.random() * 4,
        life: 1.5,
        maxLife: 1.5
      });
    }

    this.playTone(element);
  }

  spawnRipple(x: number, y: number): void {
    this.ripples.push({
      x,
      y,
      radius: 5,
      maxRadius: 80,
      alpha: 0.8
    });
  }

  private hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  drawElementIcon(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, element: Element): void {
    const gradient = ctx.createRadialGradient(
      x - size * 0.2, y - size * 0.2, 0,
      x, y, size * 0.6
    );
    gradient.addColorStop(0, element.colors[0]);
    gradient.addColorStop(1, element.colors[1]);

    ctx.beginPath();
    ctx.arc(x, y, size * 0.45, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x, y, size * 0.45, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = `${size * 0.45}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(element.symbol, x, y);
  }

  private playTone(element: Element): void {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const audioCtx = new AudioCtx();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      const frequencies: Record<string, number> = {
        fire: 440, water: 330, earth: 220, wind: 550,
        steam: 392, lava: 294, dust: 494, storm: 349,
        magma: 262, mud: 196, lightning: 880, energy: 660
      };

      oscillator.frequency.value = frequencies[element.id] || 440;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);

      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.5);
    } catch {
    }
  }

  playErrorSound(): void {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const audioCtx = new AudioCtx();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.frequency.value = 150;
      oscillator.type = 'sawtooth';
      gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);

      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.2);
    } catch {
    }
  }

  destroy(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
  }
}
