import {
  Particle,
  ElementType,
  SelectionRect,
  CollectedElements,
  ELEMENT_COLORS,
  MAX_PARTICLES,
  MAX_CACHE_PER_ELEMENT,
  TRAIL_LENGTH,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  HUD_HEIGHT
} from '../types';

export class CollectorModule {
  private particles: Particle[] = [];
  private particleIdCounter: number = 0;
  private lastSpawnTime: number = 0;
  private spawnInterval: number = 2000;
  private selection: SelectionRect = {
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
    isActive: false
  };
  private cache: CollectedElements = {
    fire: 0,
    water: 0,
    wind: 0,
    earth: 0,
    shadow: 0
  };
  private cacheLimit: number = MAX_CACHE_PER_ELEMENT;
  private level: number = 1;
  private canvas: HTMLCanvasElement;
  private shadowEnabled: boolean = false;
  private onCacheUpdated?: (cache: CollectedElements) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.bindEvents();
  }

  setCacheUpdatedCallback(callback: (cache: CollectedElements) => void): void {
    this.onCacheUpdated = callback;
  }

  getCache(): CollectedElements {
    return { ...this.cache };
  }

  getSelection(): SelectionRect {
    return { ...this.selection };
  }

  getParticles(): Particle[] {
    return this.particles;
  }

  getCacheLimit(): number {
    return this.cacheLimit;
  }

  setLevel(level: number): void {
    this.level = level;
    this.spawnInterval = Math.max(500, 2000 * Math.pow(0.9, level - 1));
    this.shadowEnabled = level >= 2;
  }

  resetCache(): void {
    this.cache = { fire: 0, water: 0, wind: 0, earth: 0, shadow: 0 };
    this.cacheLimit = MAX_CACHE_PER_ELEMENT;
    this.notifyCacheUpdate();
  }

  clearCacheForActivation(): void {
    this.cache.fire = 0;
    this.cache.water = 0;
    this.cache.wind = 0;
    this.cache.earth = 0;
    this.notifyCacheUpdate();
  }

  update(currentTime: number): void {
    if (currentTime - this.lastSpawnTime > this.spawnInterval) {
      this.spawnParticles();
      this.lastSpawnTime = currentTime;
    }

    this.updateParticles();
    this.checkParticleSleeping();
  }

  render(ctx: CanvasRenderingContext2D, currentTime: number): void {
    this.renderParticles(ctx);
    this.renderSelection(ctx, currentTime);
  }

  private bindEvents(): void {
    this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
    this.canvas.addEventListener('mouseleave', this.onMouseUp.bind(this));
  }

  private onMouseDown(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    this.selection.startX = (e.clientX - rect.left) * scaleX;
    this.selection.startY = (e.clientY - rect.top) * scaleY;
    this.selection.endX = this.selection.startX;
    this.selection.endY = this.selection.startY;
    this.selection.isActive = true;
  }

  private onMouseMove(e: MouseEvent): void {
    if (!this.selection.isActive) return;
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    this.selection.endX = (e.clientX - rect.left) * scaleX;
    this.selection.endY = (e.clientY - rect.top) * scaleY;
  }

  private onMouseUp(): void {
    if (!this.selection.isActive) return;
    this.selection.isActive = false;
    this.collectElementsInSelection();
  }

  private collectElementsInSelection(): void {
    const minX = Math.min(this.selection.startX, this.selection.endX);
    const maxX = Math.max(this.selection.startX, this.selection.endX);
    const minY = Math.min(this.selection.startY, this.selection.endY);
    const maxY = Math.max(this.selection.startY, this.selection.endY);

    if (maxX - minX < 5 || maxY - minY < 5) return;

    const collected: CollectedElements = { fire: 0, water: 0, wind: 0, earth: 0, shadow: 0 };
    const particlesToRemove: number[] = [];

    for (const particle of this.particles) {
      if (particle.isSleeping) continue;
      if (
        particle.x >= minX &&
        particle.x <= maxX &&
        particle.y >= minY &&
        particle.y <= maxY
      ) {
        collected[particle.type]++;
        particlesToRemove.push(particle.id);
      }
    }

    for (const type of ['fire', 'water', 'wind', 'earth'] as ElementType[]) {
      const space = this.cacheLimit - this.cache[type];
      const toAdd = Math.min(collected[type], Math.max(0, space));
      this.cache[type] += toAdd;
    }

    if (collected.shadow > 0) {
      this.cacheLimit = Math.max(1, this.cacheLimit - collected.shadow);
      for (const type of ['fire', 'water', 'wind', 'earth'] as ElementType[]) {
        if (this.cache[type] > this.cacheLimit) {
          this.cache[type] = this.cacheLimit;
        }
      }
    }

    this.particles = this.particles.filter(p => !particlesToRemove.includes(p.id));
    this.notifyCacheUpdate();
  }

  private notifyCacheUpdate(): void {
    if (this.onCacheUpdated) {
      this.onCacheUpdated({ ...this.cache });
    }
  }

  private spawnParticles(): void {
    const types: ElementType[] = ['fire', 'fire', 'fire', 'water', 'water', 'wind', 'wind', 'earth'];
    if (this.shadowEnabled && Math.random() < 0.3) {
      types.push('shadow');
    }

    const count = Math.min(3 + Math.floor(this.level / 2), MAX_PARTICLES - this.particles.length);
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= MAX_PARTICLES) break;

      const type = types[Math.floor(Math.random() * types.length)];
      const particle: Particle = {
        id: this.particleIdCounter++,
        type,
        x: Math.random() * (CANVAS_WIDTH - 40) + 20,
        y: Math.random() * (CANVAS_HEIGHT - HUD_HEIGHT - 40) + HUD_HEIGHT + 20,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        radius: 4 + Math.random() * 4,
        birthTime: performance.now(),
        isSleeping: false,
        trail: []
      };
      this.particles.push(particle);
    }
  }

  private updateParticles(): void {
    for (const particle of this.particles) {
      if (particle.isSleeping) continue;

      particle.trail.unshift({ x: particle.x, y: particle.y, alpha: 1 });
      if (particle.trail.length > TRAIL_LENGTH) {
        particle.trail.pop();
      }
      for (let i = 0; i < particle.trail.length; i++) {
        particle.trail[i].alpha = 1 - i / TRAIL_LENGTH;
      }

      particle.x += particle.vx;
      particle.y += particle.vy;

      if (particle.x <= particle.radius || particle.x >= CANVAS_WIDTH - particle.radius) {
        particle.vx *= -1;
        particle.x = Math.max(particle.radius, Math.min(CANVAS_WIDTH - particle.radius, particle.x));
      }
      if (particle.y <= HUD_HEIGHT + particle.radius || particle.y >= CANVAS_HEIGHT - particle.radius) {
        particle.vy *= -1;
        particle.y = Math.max(HUD_HEIGHT + particle.radius, Math.min(CANVAS_HEIGHT - particle.radius, particle.y));
      }
    }
  }

  private checkParticleSleeping(): void {
    if (this.particles.length <= MAX_PARTICLES) return;

    const sorted = [...this.particles]
      .filter(p => !p.isSleeping)
      .sort((a, b) => a.birthTime - b.birthTime);

    const toSleep = sorted.length - MAX_PARTICLES;
    for (let i = 0; i < toSleep && i < sorted.length; i++) {
      const p = this.particles.find(pp => pp.id === sorted[i].id);
      if (p) {
        p.isSleeping = true;
      }
    }
  }

  private renderParticles(ctx: CanvasRenderingContext2D): void {
    const selectionBounds = this.getSelectionBounds();

    for (const particle of this.particles) {
      if (particle.isSleeping) continue;

      for (let i = particle.trail.length - 1; i >= 0; i--) {
        const point = particle.trail[i];
        ctx.beginPath();
        ctx.arc(point.x, point.y, particle.radius * (1 - i / TRAIL_LENGTH) * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = this.hexToRgba(ELEMENT_COLORS[particle.type], point.alpha * 0.4);
        ctx.fill();
      }

      const isSelected = this.isParticleInSelection(particle, selectionBounds);
      const displayRadius = isSelected ? particle.radius * 1.5 : particle.radius;

      if (isSelected) {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, displayRadius + 6, 0, Math.PI * 2);
        ctx.fillStyle = this.hexToRgba('#FFFFFF', 0.3);
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(particle.x, particle.y, displayRadius, 0, Math.PI * 2);
      const gradient = ctx.createRadialGradient(
        particle.x, particle.y, 0,
        particle.x, particle.y, displayRadius
      );
      gradient.addColorStop(0, this.hexToRgba('#FFFFFF', 0.8));
      gradient.addColorStop(0.4, ELEMENT_COLORS[particle.type]);
      gradient.addColorStop(1, this.hexToRgba(ELEMENT_COLORS[particle.type], 0.7));
      ctx.fillStyle = gradient;
      ctx.fill();
    }
  }

  private renderSelection(ctx: CanvasRenderingContext2D, currentTime: number): void {
    if (!this.selection.isActive) return;

    const minX = Math.min(this.selection.startX, this.selection.endX);
    const minY = Math.min(this.selection.startY, this.selection.endY);
    const width = Math.abs(this.selection.endX - this.selection.startX);
    const height = Math.abs(this.selection.endY - this.selection.startY);

    if (width < 2 || height < 2) return;

    ctx.fillStyle = 'rgba(78, 205, 196, 0.15)';
    ctx.fillRect(minX, minY, width, height);

    const pulse = 0.5 + 0.5 * Math.sin(currentTime * 0.008);
    ctx.save();
    ctx.setLineDash([8, 4]);
    ctx.lineDashOffset = -currentTime * 0.03;
    ctx.strokeStyle = `rgba(78, 205, 196, ${0.6 + 0.4 * pulse})`;
    ctx.lineWidth = 2;
    ctx.strokeRect(minX, minY, width, height);
    ctx.restore();
  }

  private getSelectionBounds(): { minX: number; maxX: number; minY: number; maxY: number } | null {
    if (!this.selection.isActive) return null;
    return {
      minX: Math.min(this.selection.startX, this.selection.endX),
      maxX: Math.max(this.selection.startX, this.selection.endX),
      minY: Math.min(this.selection.startY, this.selection.endY),
      maxY: Math.max(this.selection.startY, this.selection.endY)
    };
  }

  private isParticleInSelection(particle: Particle, bounds: { minX: number; maxX: number; minY: number; maxY: number } | null): boolean {
    if (!bounds) return false;
    return (
      particle.x >= bounds.minX &&
      particle.x <= bounds.maxX &&
      particle.y >= bounds.minY &&
      particle.y <= bounds.maxY
    );
  }

  private hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
}
