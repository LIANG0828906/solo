export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  prevX: number;
  prevY: number;
  hueOffset: number;
}

export interface FluidArtOptions {
  particleCount: number;
  trailLength: number;
  noiseScale: number;
  forceRadius: number;
}

export interface SimulationParams {
  speedMultiplier: number;
  hueScrollSpeed: number;
  particleSize: number;
  mouseForceStrength: number;
}

export interface MouseState {
  isDown: boolean;
  x: number;
  y: number;
  prevX: number;
  prevY: number;
}

export interface Vortex {
  x: number;
  y: number;
  startTime: number;
  duration: number;
  radius: number;
  strength: number;
  clockwise: boolean;
}

class PerlinNoise {
  private permutation: number[];

  constructor(seed: number = Math.random() * 10000) {
    this.permutation = this.generatePermutation(seed);
  }

  private generatePermutation(seed: number): number[] {
    const p: number[] = [];
    for (let i = 0; i < 256; i++) {
      p[i] = i;
    }
    let s = seed;
    for (let i = 255; i > 0; i--) {
      s = (s * 16807) % 2147483647;
      const j = s % (i + 1);
      [p[i], p[j]] = [p[j], p[i]];
    }
    const perm: number[] = new Array(512);
    for (let i = 0; i < 512; i++) {
      perm[i] = p[i & 255];
    }
    return perm;
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(a: number, b: number, t: number): number {
    return a + t * (b - a);
  }

  private grad(hash: number, x: number, y: number): number {
    const h = hash & 3;
    const u = h < 2 ? x : y;
    const v = h < 2 ? y : x;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  noise2D(x: number, y: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    x -= Math.floor(x);
    y -= Math.floor(y);
    const u = this.fade(x);
    const v = this.fade(y);
    const A = this.permutation[X] + Y;
    const B = this.permutation[X + 1] + Y;
    return this.lerp(
      this.lerp(
        this.grad(this.permutation[A], x, y),
        this.grad(this.permutation[B], x - 1, y),
        u
      ),
      this.lerp(
        this.grad(this.permutation[A + 1], x, y - 1),
        this.grad(this.permutation[B + 1], x - 1, y - 1),
        u
      ),
      v
    );
  }

  reseed(seed: number): void {
    this.permutation = this.generatePermutation(seed);
  }
}

export class FluidArtEngine {
  public particles: Particle[] = [];
  public width: number;
  public height: number;
  public params: SimulationParams;
  public mouse: MouseState;
  public vortexes: Vortex[] = [];

  private noise: PerlinNoise;
  private options: FluidArtOptions;
  private offscreenCanvas: HTMLCanvasElement;
  private offscreenCtx: CanvasRenderingContext2D;
  private time: number = 0;
  private hueBase: number = 0;

  constructor(
    width: number,
    height: number,
    options: Partial<FluidArtOptions> = {}
  ) {
    this.width = width;
    this.height = height;
    this.options = {
      particleCount: 2000,
      trailLength: 15,
      noiseScale: 0.003,
      forceRadius: 80,
      ...options
    };
    this.params = {
      speedMultiplier: 1.0,
      hueScrollSpeed: 1.0,
      particleSize: 2,
      mouseForceStrength: 50
    };
    this.mouse = {
      isDown: false,
      x: -9999,
      y: -9999,
      prevX: -9999,
      prevY: -9999
    };
    this.noise = new PerlinNoise();

    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvas.width = width;
    this.offscreenCanvas.height = height;
    const ctx = this.offscreenCanvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get offscreen canvas context');
    }
    this.offscreenCtx = ctx;

    this.initParticles();
  }

  public initParticles(): void {
    const area = this.width * this.height;
    const count = Math.max(500, Math.floor(area * 0.003));
    this.particles = new Array(count);
    for (let i = 0; i < count; i++) {
      this.particles[i] = {
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: 0,
        vy: 0,
        prevX: 0,
        prevY: 0,
        hueOffset: Math.random() * 360
      };
    }
  }

  public resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.offscreenCanvas.width = width;
    this.offscreenCanvas.height = height;
    this.initParticles();
  }

  public reseed(): void {
    this.noise.reseed(Math.random() * 10000);
  }

  public clearTrails(): void {
    this.offscreenCtx.fillStyle = '#000000';
    this.offscreenCtx.fillRect(0, 0, this.width, this.height);
  }

  public reset(): void {
    this.clearTrails();
    this.reseed();
    this.initParticles();
    this.vortexes = [];
    this.hueBase = 0;
    this.time = 0;
  }

  public addVortex(x: number, y: number): void {
    this.vortexes.push({
      x,
      y,
      startTime: performance.now(),
      duration: 500,
      radius: 120,
      strength: 80,
      clockwise: true
    });
  }

  public setMousePosition(x: number, y: number): void {
    this.mouse.prevX = this.mouse.x;
    this.mouse.prevY = this.mouse.y;
    this.mouse.x = x;
    this.mouse.y = y;
  }

  public resetMouse(): void {
    this.mouse.x = -9999;
    this.mouse.y = -9999;
    this.mouse.prevX = -9999;
    this.mouse.prevY = -9999;
  }

  private noiseField(x: number, y: number, t: number): { vx: number; vy: number } {
    const scale = this.options.noiseScale;
    const angle = this.noise.noise2D(x * scale + t * 0.0003, y * scale + t * 0.0005) * Math.PI * 4;
    return {
      vx: Math.cos(angle),
      vy: Math.sin(angle)
    };
  }

  private getMouseForce(px: number, py: number): { fx: number; fy: number } {
    if (this.mouse.x < 0 || this.mouse.y < 0) {
      return { fx: 0, fy: 0 };
    }

    const dx = px - this.mouse.x;
    const dy = py - this.mouse.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const radius = this.options.forceRadius;

    if (dist > radius) {
      return { fx: 0, fy: 0 };
    }

    const falloff = 1 - dist / radius;
    const strength = this.params.mouseForceStrength * falloff * falloff * 0.05;

    let moveX = 0;
    let moveY = 0;
    if (this.mouse.prevX >= 0 && this.mouse.prevY >= 0) {
      moveX = this.mouse.x - this.mouse.prevX;
      moveY = this.mouse.y - this.mouse.prevY;
    }

    return {
      fx: moveX * strength * 0.5 - dx * strength * 0.02,
      fy: moveY * strength * 0.5 - dy * strength * 0.02
    };
  }

  private getVortexForce(px: number, py: number, now: number): { fx: number; fy: number } {
    let totalFx = 0;
    let totalFy = 0;

    for (let i = this.vortexes.length - 1; i >= 0; i--) {
      const v = this.vortexes[i];
      const elapsed = now - v.startTime;
      if (elapsed >= v.duration) {
        this.vortexes.splice(i, 1);
        continue;
      }

      const dx = px - v.x;
      const dy = py - v.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > v.radius || dist < 1) continue;

      const timeFactor = 1 - elapsed / v.duration;
      const distFactor = 1 - dist / v.radius;
      const strength = v.strength * timeFactor * distFactor * distFactor * 0.02;

      const dir = v.clockwise ? 1 : -1;
      totalFx += (-dy / dist) * strength * dir;
      totalFy += (dx / dist) * strength * dir;
    }

    return { fx: totalFx, fy: totalFy };
  }

  private getParticleHue(px: number, py: number): number {
    const nx = px / this.width;
    const ny = py / this.height;
    const positionHue = (nx * 0.6 + ny * 0.4) * 360;
    return ((positionHue + this.hueBase) % 360 + 360) % 360;
  }

  public update(deltaTime: number): void {
    this.time += deltaTime;
    this.hueBase = (this.hueBase + this.params.hueScrollSpeed * deltaTime * 0.02) % 360;

    const now = performance.now();
    const fadeAlpha = 1 - (1 / this.options.trailLength);

    this.offscreenCtx.fillStyle = `rgba(0, 0, 0, ${fadeAlpha})`;
    this.offscreenCtx.fillRect(0, 0, this.width, this.height);

    const speed = this.params.speedMultiplier * 1.2;
    const size = this.params.particleSize;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.prevX = p.x;
      p.prevY = p.y;

      const field = this.noiseField(p.x, p.y, this.time);
      let vx = field.vx * speed;
      let vy = field.vy * speed;

      const mouseForce = this.getMouseForce(p.x, p.y);
      vx += mouseForce.fx;
      vy += mouseForce.fy;

      const vortexForce = this.getVortexForce(p.x, p.y, now);
      vx += vortexForce.fx;
      vy += vortexForce.fy;

      p.vx = p.vx * 0.92 + vx * 0.08;
      p.vy = p.vy * 0.92 + vy * 0.08;

      p.x += p.vx;
      p.y += p.vy;

      if (p.x < -10) p.x = this.width + 10;
      else if (p.x > this.width + 10) p.x = -10;
      if (p.y < -10) p.y = this.height + 10;
      else if (p.y > this.height + 10) p.y = -10;

      const hue = this.getParticleHue(p.x, p.y);

      this.offscreenCtx.beginPath();
      this.offscreenCtx.moveTo(p.prevX, p.prevY);
      this.offscreenCtx.lineTo(p.x, p.y);
      this.offscreenCtx.strokeStyle = `hsla(${hue.toFixed(1)}, 85%, 60%, 0.85)`;
      this.offscreenCtx.lineWidth = size;
      this.offscreenCtx.lineCap = 'round';
      this.offscreenCtx.stroke();

      this.offscreenCtx.beginPath();
      this.offscreenCtx.arc(p.x, p.y, size * 0.5, 0, Math.PI * 2);
      this.offscreenCtx.fillStyle = `hsla(${hue.toFixed(1)}, 90%, 70%, 0.6)`;
      this.offscreenCtx.fill();
    }
  }

  public render(targetCtx: CanvasRenderingContext2D): void {
    targetCtx.drawImage(this.offscreenCanvas, 0, 0);
  }

  public getParticleCount(): number {
    return this.particles.length;
  }

  public exportHighResPNG(exportWidth: number = 1920, exportHeight: number = 1080): string {
    const scaleX = exportWidth / this.width;
    const scaleY = exportHeight / this.height;
    const scale = Math.max(scaleX, scaleY);

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = exportWidth;
    exportCanvas.height = exportHeight;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get export canvas context');
    }

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, exportWidth, exportHeight);

    const offsetX = (exportWidth - this.width * scale) / 2;
    const offsetY = (exportHeight - this.height * scale) / 2;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(
      this.offscreenCanvas,
      offsetX,
      offsetY,
      this.width * scale,
      this.height * scale
    );

    return exportCanvas.toDataURL('image/png', 1.0);
  }
}
