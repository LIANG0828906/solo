import { useAudioStore, COLOR_THEMES } from './audioEngine';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  hue: number;
}

export class Visualizer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private rafId: number = 0;
  private running: boolean = false;
  private triangleAngle: number = 0;
  private particles: Particle[] = [];
  private lastTime: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    const loop = (time: number) => {
      if (!this.running) return;
      this.render(time);
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }

  resize(): void {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
  }

  private render(time: number): void {
    const dt = (time - this.lastTime) / 1000;
    this.lastTime = time;
    const store = useAudioStore.getState();
    const { energyPeak, averageFrequency, beatIntensity, visualMode, frequencyData, timeDomainData, colorThemeIndex } = store;
    const theme = COLOR_THEMES[colorThemeIndex];
    const w = this.canvas.getBoundingClientRect().width;
    const h = this.canvas.getBoundingClientRect().height;

    this.ctx.clearRect(0, 0, w, h);
    this.drawBackground(w, h);

    if (visualMode === 'full') {
      this.drawCircle(w, h, energyPeak, averageFrequency, theme);
      this.drawTriangles(w, h, beatIntensity, dt, theme);
      this.drawWaveforms(w, h, frequencyData, timeDomainData, theme);
    } else {
      this.drawCircle(w, h, energyPeak, averageFrequency, theme);
      this.drawParticles(w, h, energyPeak, averageFrequency, dt, theme);
    }
  }

  private drawBackground(w: number, h: number): void {
    const cx = w / 2;
    const cy = h / 2;
    const r = Math.max(w, h) * 0.8;
    const gradient = this.ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    gradient.addColorStop(0, '#0d0d2b');
    gradient.addColorStop(1, '#1a0a2e');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, w, h);
  }

  private drawCircle(w: number, h: number, energy: number, freq: number, theme: typeof COLOR_THEMES[number]): void {
    const cx = w / 2;
    const cy = h / 2;
    const minR = 30;
    const maxR = 150;
    const radius = minR + (maxR - minR) * energy;

    const t = freq;
    const r = Math.round(0 * (1 - t) + 255 * t);
    const g = Math.round(210 * (1 - t) + 105 * t);
    const b = Math.round(255 * (1 - t) + 180 * t);

    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, radius, 0, Math.PI * 2);

    const gradient = this.ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.9)`);
    gradient.addColorStop(0.7, `rgba(${r}, ${g}, ${b}, 0.5)`);
    gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.1)`);
    this.ctx.fillStyle = gradient;
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    this.ctx.strokeStyle = theme.primary;
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
    this.ctx.restore();
  }

  private drawTriangles(w: number, h: number, beatIntensity: number, dt: number, theme: typeof COLOR_THEMES[number]): void {
    const cx = w / 2;
    const cy = h / 2;
    const count = 6;
    const baseRadius = 180;
    const expandRadius = 60 * beatIntensity;

    this.triangleAngle += (0.5 + beatIntensity * 3) * dt;

    this.ctx.save();
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + this.triangleAngle;
      const dist = baseRadius + expandRadius;
      const tx = cx + Math.cos(angle) * dist;
      const ty = cy + Math.sin(angle) * dist;
      const size = 20 + beatIntensity * 25;

      this.ctx.save();
      this.ctx.translate(tx, ty);
      this.ctx.rotate(angle + this.triangleAngle * 2);
      this.ctx.beginPath();
      for (let j = 0; j < 3; j++) {
        const a = (Math.PI * 2 * j) / 3 - Math.PI / 2;
        const px = Math.cos(a) * size;
        const py = Math.sin(a) * size;
        if (j === 0) this.ctx.moveTo(px, py);
        else this.ctx.lineTo(px, py);
      }
      this.ctx.closePath();
      this.ctx.fillStyle = 'rgba(255, 0, 144, 0.5)';
      this.ctx.fill();
      this.ctx.strokeStyle = 'rgba(255, 0, 144, 0.8)';
      this.ctx.lineWidth = 1.5;
      this.ctx.stroke();
      this.ctx.restore();
    }
    this.ctx.restore();
  }

  private drawWaveforms(w: number, h: number, frequencyData: Uint8Array, timeDomainData: Uint8Array, theme: typeof COLOR_THEMES[number]): void {
    if (!frequencyData.length || !timeDomainData.length) return;

    const lineCount = Math.max(8, Math.min(16, Math.floor(frequencyData.length / 32)));
    const segmentSize = Math.floor(frequencyData.length / lineCount);

    this.ctx.save();
    this.ctx.lineWidth = 2;
    this.ctx.globalAlpha = 0.7;

    for (let i = 0; i < lineCount; i++) {
      const hue = (i / lineCount) * 360;
      this.ctx.strokeStyle = `hsl(${hue}, 80%, 60%)`;
      this.ctx.beginPath();

      const yOffset = (h / (lineCount + 1)) * (i + 1);
      const step = Math.max(1, Math.floor(timeDomainData.length / w));

      for (let x = 0; x < w; x++) {
        const idx = Math.min(x * step, timeDomainData.length - 1);
        const v = timeDomainData[idx] / 128.0;

        const segIdx = Math.min(i, Math.floor(frequencyData.length / segmentSize) - 1);
        const segStart = segIdx * segmentSize;
        let segEnergy = 0;
        for (let s = segStart; s < segStart + segmentSize && s < frequencyData.length; s++) {
          segEnergy += frequencyData[s];
        }
        segEnergy = segEnergy / segmentSize / 255;

        const amplitude = 20 + segEnergy * 60;
        const y = yOffset + (v - 1) * amplitude;

        if (x === 0) this.ctx.moveTo(x, y);
        else this.ctx.lineTo(x, y);
      }
      this.ctx.stroke();
    }
    this.ctx.restore();
  }

  private drawParticles(w: number, h: number, energy: number, freq: number, dt: number, theme: typeof COLOR_THEMES[number]): void {
    const cx = w / 2;
    const cy = h / 2;
    const spawnCount = Math.floor(energy * 8) + 1;

    for (let i = 0; i < spawnCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + energy * 200;
      this.particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 1 + Math.random() * 2,
        size: 2 + Math.random() * 4 + energy * 4,
        hue: (freq * 360 + Math.random() * 60) % 360,
      });
    }

    this.ctx.save();
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.98;
      p.vy *= 0.98;
      const alpha = 1 - p.life / p.maxLife;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      this.ctx.fillStyle = `hsla(${p.hue}, 80%, 60%, ${alpha * 0.8})`;
      this.ctx.fill();
    }
    if (this.particles.length > 500) {
      this.particles.splice(0, this.particles.length - 500);
    }
    this.ctx.restore();
  }

  drawLoading(time: number): void {
    const w = this.canvas.getBoundingClientRect().width;
    const h = this.canvas.getBoundingClientRect().height;
    const cx = w / 2;
    const cy = h / 2;
    const ringCount = 5;

    this.ctx.clearRect(0, 0, w, h);
    this.drawBackground(w, h);

    this.ctx.save();
    for (let i = 0; i < ringCount; i++) {
      const radius = 30 + i * 20;
      const speed = (i % 2 === 0 ? 1 : -1) * (0.5 + i * 0.3);
      const angle = time * 0.001 * speed;
      const alpha = 0.3 + (i / ringCount) * 0.5;

      this.ctx.beginPath();
      this.ctx.arc(cx, cy, radius, angle, angle + Math.PI * 1.5);
      this.ctx.strokeStyle = `rgba(0, 210, 255, ${alpha})`;
      this.ctx.lineWidth = 3;
      this.ctx.lineCap = 'round';
      this.ctx.stroke();
    }
    this.ctx.restore();
  }
}
