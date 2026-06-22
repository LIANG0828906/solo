import type { VisualMode, VisualizerParams } from './types';

interface Particle {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
  size: number;
  baseSize: number;
  hue: number;
  saturation: number;
  lightness: number;
  alpha: number;
  freqBand: number;
  rippleWhite: number;
  rippleScale: number;
  angle: number;
  orbitRadius: number;
  orbitSpeed: number;
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  startTime: number;
  duration: number;
  thickness: number;
  alpha: number;
  prevRadius: number;
}

export class Visualizer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private params: VisualizerParams;
  private particles: Particle[] = [];
  private ripples: Ripple[] = [];
  private mouseX = -1000;
  private mouseY = -1000;
  private mouseInCanvas = false;
  private attractionRadius = 0;
  private maxAttractionRadius = 200;
  private attractionGlowAlpha = 0;
  private running = false;
  private rafId: number | null = null;
  private lastTime = 0;
  private bgHueOffset = 0;
  private modeTransition = 1;
  private prevMode: VisualMode = 'particles';
  private frequencyData: Uint8Array = new Uint8Array(0);
  private fpsFrames = 0;
  private fpsTime = 0;
  private currentFps = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.params = {
      mode: 'particles',
      particleCount: 300,
      particleSize: 3,
      speed: 1,
      colorSaturation: 80,
      backgroundBlur: 4,
      mouseColorMode: false,
    };
    this.initParticles();
  }

  private initParticles(): void {
    const count = this.params.particleCount;
    const w = this.canvas.width;
    const h = this.canvas.height;

    if (this.particles.length > count) {
      this.particles.length = count;
      return;
    }

    while (this.particles.length < count) {
      const band = Math.random();
      this.particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        baseX: Math.random() * w,
        baseY: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: this.params.particleSize,
        baseSize: this.params.particleSize,
        hue: band * 360,
        saturation: this.params.colorSaturation,
        lightness: 55,
        alpha: 0.6 + Math.random() * 0.4,
        freqBand: band,
        rippleWhite: 0,
        rippleScale: 0,
        angle: Math.random() * Math.PI * 2,
        orbitRadius: 30 + Math.random() * 120,
        orbitSpeed: (0.2 + Math.random() * 0.8) * (Math.random() > 0.5 ? 1 : -1),
      });
    }
  }

  setParams(params: Partial<VisualizerParams>): void {
    const oldMode = this.params.mode;
    this.params = { ...this.params, ...params };

    if (params.particleCount !== undefined && params.particleCount !== this.particles.length) {
      this.adjustParticleCount();
    }

    if (params.mode !== undefined && params.mode !== oldMode) {
      this.prevMode = oldMode;
      this.modeTransition = 0;
      this.resetParticlePositions();
    }

    if (params.particleSize !== undefined) {
      for (const p of this.particles) {
        p.baseSize = params.particleSize!;
        p.size = p.baseSize + p.rippleScale * p.baseSize;
      }
    }

    if (params.colorSaturation !== undefined) {
      for (const p of this.particles) {
        p.saturation = params.colorSaturation!;
      }
    }
  }

  private adjustParticleCount(): void {
    const count = this.params.particleCount;
    const w = this.canvas.width;
    const h = this.canvas.height;

    if (this.particles.length > count) {
      this.particles.length = count;
    }

    while (this.particles.length < count) {
      const band = Math.random();
      this.particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        baseX: Math.random() * w,
        baseY: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: this.params.particleSize,
        baseSize: this.params.particleSize,
        hue: band * 360,
        saturation: this.params.colorSaturation,
        lightness: 55,
        alpha: 0.6 + Math.random() * 0.4,
        freqBand: band,
        rippleWhite: 0,
        rippleScale: 0,
        angle: Math.random() * Math.PI * 2,
        orbitRadius: 30 + Math.random() * 120,
        orbitSpeed: (0.2 + Math.random() * 0.8) * (Math.random() > 0.5 ? 1 : -1),
      });
    }
  }

  private resetParticlePositions(): void {
    const w = this.canvas.width;
    const h = this.canvas.height;
    for (const p of this.particles) {
      p.baseX = Math.random() * w;
      p.baseY = Math.random() * h;
      p.angle = Math.random() * Math.PI * 2;
    }
  }

  handleMouseMove(x: number, y: number): void {
    this.mouseX = x;
    this.mouseY = y;
    this.mouseInCanvas = true;
  }

  handleMouseLeave(): void {
    this.mouseInCanvas = false;
  }

  handleMouseClick(x: number, y: number): void {
    this.ripples.push({
      x,
      y,
      radius: 0,
      maxRadius: 300,
      startTime: performance.now(),
      duration: 500,
      thickness: 40,
      alpha: 1,
      prevRadius: 0,
    });
  }

  updateFrequencyData(data: Uint8Array): void {
    this.frequencyData = data;
  }

  resize(w: number, h: number): void {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.ctx.scale(dpr, dpr);
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.resetParticlePositions();
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.loop();
  }

  stop(): void {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private loop(): void {
    if (!this.running) return;
    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;

    this.fpsFrames++;
    this.fpsTime += dt;
    if (this.fpsTime >= 1) {
      this.currentFps = this.fpsFrames;
      this.fpsFrames = 0;
      this.fpsTime = 0;
    }

    this.update(dt, now);
    this.render();

    this.rafId = requestAnimationFrame(() => this.loop());
  }

  getFps(): number {
    return this.currentFps;
  }

  private update(dt: number, now: number): void {
    const speed = this.params.speed;
    const w = this.canvas.width / (window.devicePixelRatio || 1);
    const h = this.canvas.height / (window.devicePixelRatio || 1);

    if (this.modeTransition < 1) {
      this.modeTransition = Math.min(1, this.modeTransition + dt * 4);
    }

    if (this.mouseInCanvas) {
      this.attractionRadius = this.lerp(this.attractionRadius, this.maxAttractionRadius, dt * 3);
      this.attractionGlowAlpha = this.lerp(this.attractionGlowAlpha, 0.15, dt * 5);
    } else {
      this.attractionRadius = this.lerp(this.attractionRadius, 0, dt * 3);
      this.attractionGlowAlpha = this.lerp(this.attractionGlowAlpha, 0, dt * 5);
    }

    this.ripples = this.ripples.filter(r => {
      const elapsed = now - r.startTime;
      const progress = elapsed / r.duration;
      r.prevRadius = r.radius;
      r.radius = r.maxRadius * this.easeOutCubic(progress);
      r.alpha = 1 - this.easeOutCubic(progress);
      return progress < 1;
    });

    const freqLen = this.frequencyData.length;

    for (const p of this.particles) {
      let freqValue = 0;
      if (freqLen > 0) {
        const idx = Math.floor(p.freqBand * freqLen * 0.6);
        freqValue = (this.frequencyData[Math.min(idx, freqLen - 1)] || 0) / 255;
      }

      p.hue = p.freqBand * 360;
      p.lightness = 40 + freqValue * 30;

      if (this.params.mouseColorMode && this.mouseInCanvas) {
        const mx = this.mouseX / w;
        const my = this.mouseY / h;
        p.hue = mx * 360;
        p.lightness = 30 + (1 - my) * 50;
      }

      p.size = p.baseSize + freqValue * p.baseSize * 1.5;

      this.updateParticleByMode(p, dt, speed, freqValue, w, h);

      if (this.mouseInCanvas && this.attractionRadius > 5) {
        const dx = this.mouseX - p.x;
        const dy = this.mouseY - p.y;
        const distSq = dx * dx + dy * dy;
        const attractRadSq = this.attractionRadius * this.attractionRadius;

        if (distSq < attractRadSq) {
          const dist = Math.sqrt(distSq);
          if (dist > 3) {
            const deadZone = 12;
            const effectiveDist = Math.max(dist - deadZone, 0);
            const maxEffectiveDist = this.attractionRadius - deadZone;
            const normalizedDist = maxEffectiveDist > 0 ? effectiveDist / maxEffectiveDist : 0;
            const forceMag = Math.exp(-normalizedDist * 3) * 160 * dt;
            const dirX = dx / dist;
            const dirY = dy / dist;
            p.vx += dirX * forceMag;
            p.vy += dirY * forceMag;
          }
        }
      }

      for (const r of this.ripples) {
        const dx = p.x - r.x;
        const dy = p.y - r.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const ringInner = r.prevRadius - r.thickness * 0.5;
        const ringOuter = r.radius + r.thickness * 0.5;

        if (dist >= ringInner && dist <= ringOuter) {
          const distFromFront = Math.abs(dist - r.radius);
          const intensity = (1 - distFromFront / (r.thickness * 0.5)) * r.alpha;

          if (intensity > 0) {
            p.rippleWhite = Math.max(p.rippleWhite, intensity * 0.95);
            p.rippleScale = Math.max(p.rippleScale, intensity * 2.0);

            const pushForce = intensity * 60 * dt;
            if (dist > 1) {
              p.vx += (dx / dist) * pushForce;
              p.vy += (dy / dist) * pushForce;
            }
          }
        }
      }

      p.rippleWhite = this.lerp(p.rippleWhite, 0, dt * 4);
      p.rippleScale = this.lerp(p.rippleScale, 0, dt * 4);

      p.size += p.rippleScale * p.baseSize;

      p.x += p.vx;
      p.y += p.vy;

      p.vx *= 0.95;
      p.vy *= 0.95;

      if (p.x < 0) { p.x = 0; p.vx *= -0.5; }
      if (p.x > w) { p.x = w; p.vx *= -0.5; }
      if (p.y < 0) { p.y = 0; p.vy *= -0.5; }
      if (p.y > h) { p.y = h; p.vy *= -0.5; }
    }

    this.bgHueOffset += dt * 8 * speed;
  }

  private updateParticleByMode(p: Particle, dt: number, speed: number, freqValue: number, w: number, h: number): void {
    switch (this.params.mode) {
      case 'particles': {
        const drift = 20 * speed * dt;
        p.baseX += (Math.random() - 0.5) * drift;
        p.baseY += (Math.random() - 0.5) * drift;
        p.baseX = Math.max(0, Math.min(w, p.baseX));
        p.baseY = Math.max(0, Math.min(h, p.baseY));

        const returnForce = 0.5 * dt;
        p.vx += (p.baseX - p.x) * returnForce;
        p.vy += (p.baseY - p.y) * returnForce;
        break;
      }
      case 'bars': {
        const barIndex = Math.floor(p.freqBand * 32);
        const barX = (barIndex / 32) * w + (w / 64);
        const targetY = h * 0.5 - freqValue * h * 0.4;
        p.baseX = barX;
        p.baseY = this.lerp(p.baseY, targetY, dt * 6);
        p.vx += (p.baseX - p.x) * 2 * dt;
        p.vy += (p.baseY - p.y) * 2 * dt;
        break;
      }
      case 'stars': {
        p.angle += p.orbitSpeed * speed * dt;
        const cx = w / 2;
        const cy = h / 2;
        const dynamicRadius = p.orbitRadius * (1 + freqValue * 0.3);
        p.baseX = cx + Math.cos(p.angle) * dynamicRadius;
        p.baseY = cy + Math.sin(p.angle) * dynamicRadius;
        const returnForce = 3 * dt;
        p.vx += (p.baseX - p.x) * returnForce;
        p.vy += (p.baseY - p.y) * returnForce;
        break;
      }
    }
  }

  private render(): void {
    const dpr = window.devicePixelRatio || 1;
    const w = this.canvas.width / dpr;
    const h = this.canvas.height / dpr;

    this.ctx.save();
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    this.renderBackground(w, h);

    const modeAlpha = this.modeTransition;

    switch (this.params.mode) {
      case 'particles':
        this.renderParticles(w, h, modeAlpha);
        break;
      case 'bars':
        this.renderBars(w, h, modeAlpha);
        break;
      case 'stars':
        this.renderStars(w, h, modeAlpha);
        break;
    }

    this.renderRipples(w, h);

    if (this.mouseInCanvas && this.attractionRadius > 10) {
      this.renderAttractionZone(w, h);
    }

    this.renderFps(w, h);

    this.ctx.restore();
  }

  private renderBackground(w: number, h: number): void {
    this.ctx.fillStyle = 'rgba(10, 10, 15, 0.2)';
    this.ctx.fillRect(0, 0, w, h);

    if (this.params.backgroundBlur > 0) {
      this.ctx.filter = `blur(${this.params.backgroundBlur}px)`;
    }

    const hue1 = (this.bgHueOffset + 300) % 360;
    const hue2 = (this.bgHueOffset + 180) % 360;

    const grad = this.ctx.createRadialGradient(
      w * 0.3, h * 0.4, 0,
      w * 0.3, h * 0.4, w * 0.6
    );
    grad.addColorStop(0, `hsla(${hue1}, 70%, 8%, 0.06)`);
    grad.addColorStop(1, 'transparent');
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, w, h);

    const grad2 = this.ctx.createRadialGradient(
      w * 0.7, h * 0.6, 0,
      w * 0.7, h * 0.6, w * 0.5
    );
    grad2.addColorStop(0, `hsla(${hue2}, 70%, 8%, 0.04)`);
    grad2.addColorStop(1, 'transparent');
    this.ctx.fillStyle = grad2;
    this.ctx.fillRect(0, 0, w, h);

    this.ctx.filter = 'none';
  }

  private renderParticles(_w: number, _h: number, alpha: number): void {
    for (const p of this.particles) {
      const finalAlpha = p.alpha * alpha;
      const whiteness = p.rippleWhite;

      let r: number, g: number, b: number;
      const hsl = this.hslToRgb(p.hue / 360, p.saturation / 100, p.lightness / 100);
      r = hsl[0] + (255 - hsl[0]) * whiteness;
      g = hsl[1] + (255 - hsl[1]) * whiteness;
      b = hsl[2] + (255 - hsl[2]) * whiteness;

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(${r|0},${g|0},${b|0},${finalAlpha})`;
      this.ctx.fill();

      if (p.size > 2) {
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(${r|0},${g|0},${b|0},${finalAlpha * 0.15})`;
        this.ctx.fill();
      }
    }
  }

  private renderBars(w: number, h: number, alpha: number): void {
    const barCount = 64;
    const barWidth = w / barCount;
    const freqLen = this.frequencyData.length;

    for (const p of this.particles) {
      const barIdx = Math.floor(p.freqBand * barCount);
      if (barIdx >= barCount) continue;

      const freqIdx = Math.floor(p.freqBand * freqLen * 0.6);
      const freqVal = freqLen > 0 ? (this.frequencyData[Math.min(freqIdx, freqLen - 1)] || 0) / 255 : 0;

      const x = barIdx * barWidth;
      const barH = freqVal * h * 0.7;
      const y = h - barH;

      const whiteness = p.rippleWhite;
      const hsl = this.hslToRgb(p.hue / 360, p.saturation / 100, p.lightness / 100);
      const r = hsl[0] + (255 - hsl[0]) * whiteness;
      const g = hsl[1] + (255 - hsl[1]) * whiteness;
      const b = hsl[2] + (255 - hsl[2]) * whiteness;

      const grad = this.ctx.createLinearGradient(x, h, x, y);
      grad.addColorStop(0, `rgba(${r|0},${g|0},${b|0},${0.8 * alpha})`);
      grad.addColorStop(1, `rgba(${r|0},${g|0},${b|0},${0.1 * alpha})`);

      this.ctx.fillStyle = grad;
      this.ctx.fillRect(x + 1, y, barWidth - 2, barH);
    }
  }

  private renderStars(_w: number, _h: number, alpha: number): void {
    for (const p of this.particles) {
      const finalAlpha = p.alpha * alpha;
      const whiteness = p.rippleWhite;

      const hsl = this.hslToRgb(p.hue / 360, p.saturation / 100, Math.min(80, p.lightness) / 100);
      const r = hsl[0] + (255 - hsl[0]) * whiteness;
      const g = hsl[1] + (255 - hsl[1]) * whiteness;
      const b = hsl[2] + (255 - hsl[2]) * whiteness;

      const rayLen = p.size * 2.5;

      this.ctx.strokeStyle = `rgba(${r|0},${g|0},${b|0},${finalAlpha * 0.5})`;
      this.ctx.lineWidth = 0.5;
      this.ctx.beginPath();
      this.ctx.moveTo(p.x - rayLen, p.y);
      this.ctx.lineTo(p.x + rayLen, p.y);
      this.ctx.moveTo(p.x, p.y - rayLen);
      this.ctx.lineTo(p.x, p.y + rayLen);
      this.ctx.stroke();

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size * 0.8, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(${r|0},${g|0},${b|0},${finalAlpha})`;
      this.ctx.fill();

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(${r|0},${g|0},${b|0},${finalAlpha * 0.08})`;
      this.ctx.fill();
    }
  }

  private renderRipples(_w: number, _h: number): void {
    for (const r of this.ripples) {
      const coreWidth = 2 + r.alpha * 2;
      this.ctx.beginPath();
      this.ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      this.ctx.strokeStyle = `rgba(255, 255, 255, ${r.alpha * 0.8})`;
      this.ctx.lineWidth = coreWidth;
      this.ctx.stroke();

      const glowWidth = r.thickness * r.alpha * 0.6;
      this.ctx.beginPath();
      this.ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      this.ctx.strokeStyle = `rgba(0, 255, 255, ${r.alpha * 0.25})`;
      this.ctx.lineWidth = glowWidth;
      this.ctx.stroke();

      if (r.alpha > 0.3) {
        const innerRadius = r.radius * 0.85;
        this.ctx.beginPath();
        this.ctx.arc(r.x, r.y, innerRadius, 0, Math.PI * 2);
        this.ctx.strokeStyle = `rgba(170, 255, 0, ${r.alpha * 0.15})`;
        this.ctx.lineWidth = coreWidth * 0.5;
        this.ctx.stroke();
      }

      const grad = this.ctx.createRadialGradient(
        r.x, r.y, r.radius * 0.9,
        r.x, r.y, r.radius * 1.1
      );
      grad.addColorStop(0, 'transparent');
      grad.addColorStop(0.5, `rgba(0, 255, 255, ${r.alpha * 0.08})`);
      grad.addColorStop(1, 'transparent');
      this.ctx.fillStyle = grad;
      this.ctx.beginPath();
      this.ctx.arc(r.x, r.y, r.radius * 1.1, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  private renderAttractionZone(_w: number, _h: number): void {
    const grad = this.ctx.createRadialGradient(
      this.mouseX, this.mouseY, 0,
      this.mouseX, this.mouseY, this.attractionRadius
    );
    grad.addColorStop(0, `rgba(0, 255, 255, ${this.attractionGlowAlpha})`);
    grad.addColorStop(0.5, `rgba(255, 0, 128, ${this.attractionGlowAlpha * 0.5})`);
    grad.addColorStop(1, 'transparent');

    this.ctx.fillStyle = grad;
    this.ctx.fillRect(
      this.mouseX - this.attractionRadius,
      this.mouseY - this.attractionRadius,
      this.attractionRadius * 2,
      this.attractionRadius * 2
    );
  }

  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * Math.min(1, Math.max(0, t));
  }

  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  private hslToRgb(h: number, s: number, l: number): [number, number, number] {
    let r: number, g: number, b: number;
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number): number => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    return [r * 255, g * 255, b * 255];
  }

  private renderFps(w: number, _h: number): void {
    const fps = this.currentFps;
    const color = fps >= 55 ? 'rgba(170,255,0,0.6)' : fps >= 30 ? 'rgba(255,200,0,0.7)' : 'rgba(255,60,60,0.8)';
    this.ctx.font = '11px "JetBrains Mono", monospace';
    this.ctx.fillStyle = color;
    this.ctx.textAlign = 'right';
    this.ctx.fillText(`${fps} FPS | ${this.particles.length} particles`, w - 12, 18);
    this.ctx.textAlign = 'left';
  }
}
