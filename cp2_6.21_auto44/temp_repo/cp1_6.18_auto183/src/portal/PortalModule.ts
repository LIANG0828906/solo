import {
  PortalState,
  LevelRequirement,
  CollectedElements,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PORTAL_RADIUS,
  LAYER_ANIM_DURATION,
  ELEMENT_COLORS
} from '../types';
import { drawRoundRect } from '../utils/CanvasUtils';

export interface ActivationResult {
  success: boolean;
  combo: number;
}

export class PortalModule {
  private state: PortalState = {
    isActive: false,
    activationProgress: 0,
    currentLayer: 0,
    totalLayers: 3,
    layerAnimProgress: 0,
    isFlashing: false
  };
  private requirement: LevelRequirement = {
    fire: 3,
    water: 2,
    wind: 1,
    earth: 0
  };
  private level: number = 1;
  private combo: number = 0;
  private canvas: HTMLCanvasElement;
  private isHovering: boolean = false;
  private hoverProgress: number = 0;
  private particleBursts: { x: number; y: number; vx: number; vy: number; life: number; color: string }[] = [];
  private onActivationSuccess?: () => void;
  private onActivationFail?: () => void;
  private activationStartTime: number = 0;
  private isActivating: boolean = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.bindEvents();
  }

  setActivationCallbacks(success: () => void, fail: () => void): void {
    this.onActivationSuccess = success;
    this.onActivationFail = fail;
  }

  getState(): PortalState {
    return { ...this.state };
  }

  getRequirement(): LevelRequirement {
    return { ...this.requirement };
  }

  getCombo(): number {
    return this.combo;
  }

  setLevel(level: number): void {
    this.level = level;
    this.generateRequirement();
    this.resetPortal();
  }

  resetPortal(): void {
    this.state = {
      isActive: false,
      activationProgress: 0,
      currentLayer: 0,
      totalLayers: 3,
      layerAnimProgress: 0,
      isFlashing: false
    };
    this.isActivating = false;
    this.particleBursts = [];
  }

  tryActivate(cache: CollectedElements): boolean {
    if (this.isActivating || this.state.isActive) return false;

    if (this.matchesRequirement(cache)) {
      this.combo++;
      this.startActivation();
      if (this.onActivationSuccess) {
        this.onActivationSuccess();
      }
      return true;
    } else {
      this.combo = 0;
      if (this.onActivationFail) {
        this.onActivationFail();
      }
      return false;
    }
  }

  getComboMultiplier(): number {
    if (this.combo >= 5) return 3;
    if (this.combo >= 3) return 2;
    if (this.combo >= 2) return 1.5;
    return 1;
  }

  update(deltaTime: number): void {
    if (this.isActivating && !this.state.isActive) {
      this.updateActivation(deltaTime);
    }

    const targetHover = this.isHovering ? 1 : 0;
    this.hoverProgress += (targetHover - this.hoverProgress) * Math.min(1, deltaTime / 300);

    for (let i = this.particleBursts.length - 1; i >= 0; i--) {
      const p = this.particleBursts[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.98;
      p.vy *= 0.98;
      p.life -= deltaTime;
      if (p.life <= 0) {
        this.particleBursts.splice(i, 1);
      }
    }
  }

  render(ctx: CanvasRenderingContext2D, currentTime: number): void {
    this.renderPortal(ctx, currentTime);
    this.renderBurstParticles(ctx);
  }

  private bindEvents(): void {
    this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.canvas.addEventListener('click', this.onClick.bind(this));
  }

  private onMouseMove(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const centerX = CANVAS_WIDTH / 2;
    const centerY = CANVAS_HEIGHT / 2 + 100;
    const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
    this.isHovering = dist <= PORTAL_RADIUS + 20;
    this.canvas.style.cursor = this.isHovering ? 'pointer' : 'crosshair';
  }

  private onClick(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const centerX = CANVAS_WIDTH / 2;
    const centerY = CANVAS_HEIGHT / 2 + 100;
    const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);

    if (dist <= PORTAL_RADIUS + 20) {
      this.dispatchTryActivate();
    }
  }

  private dispatchTryActivate(): void {
    const event = new CustomEvent('portal-try-activate');
    this.canvas.dispatchEvent(event);
  }

  private matchesRequirement(cache: CollectedElements): boolean {
    return (
      cache.fire >= this.requirement.fire &&
      cache.water >= this.requirement.water &&
      cache.wind >= this.requirement.wind &&
      cache.earth >= this.requirement.earth
    );
  }

  private generateRequirement(): void {
    const baseTotal = 5 + this.level;
    const types: (keyof LevelRequirement)[] = ['fire', 'water', 'wind', 'earth'];
    const req: LevelRequirement = { fire: 0, water: 0, wind: 0, earth: 0 };

    let remaining = baseTotal;
    for (let i = 0; i < types.length - 1; i++) {
      const maxVal = Math.min(Math.ceil(baseTotal / 2), remaining - (types.length - 1 - i));
      req[types[i]] = Math.max(0, Math.floor(Math.random() * (maxVal + 1)));
      remaining -= req[types[i]];
    }
    req[types[types.length - 1]] = Math.max(0, remaining);

    const sum = req.fire + req.water + req.wind + req.earth;
    if (sum < 3) {
      req.fire = Math.max(req.fire, 3);
    }

    this.requirement = req;
  }

  private startActivation(): void {
    this.isActivating = true;
    this.activationStartTime = performance.now();
    this.state.currentLayer = 0;
    this.state.layerAnimProgress = 0;
    this.spawnBurstParticles();
  }

  private updateActivation(deltaTime: number): void {
    if (this.state.currentLayer >= this.state.totalLayers) {
      this.state.isActive = true;
      this.state.activationProgress = 1;
      this.state.isFlashing = true;
      this.isActivating = false;
      this.spawnBurstParticles();
      this.spawnBurstParticles();
      return;
    }

    this.state.layerAnimProgress += deltaTime / LAYER_ANIM_DURATION;
    this.state.activationProgress = (this.state.currentLayer + Math.min(1, this.state.layerAnimProgress)) / this.state.totalLayers;

    if (this.state.layerAnimProgress >= 1) {
      this.state.currentLayer++;
      this.state.layerAnimProgress = 0;
      this.spawnBurstParticles();
    }
  }

  private spawnBurstParticles(): void {
    const centerX = CANVAS_WIDTH / 2;
    const centerY = CANVAS_HEIGHT / 2 + 100;
    const colors = [ELEMENT_COLORS.fire, ELEMENT_COLORS.water, ELEMENT_COLORS.wind, ELEMENT_COLORS.earth, '#FFD700'];

    for (let i = 0; i < 30; i++) {
      const angle = (Math.PI * 2 * i) / 30 + Math.random() * 0.3;
      const speed = 2 + Math.random() * 4;
      this.particleBursts.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 800 + Math.random() * 400,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
  }

  private renderPortal(ctx: CanvasRenderingContext2D, currentTime: number): void {
    const centerX = CANVAS_WIDTH / 2;
    const centerY = CANVAS_HEIGHT / 2 + 100;
    const baseRadius = PORTAL_RADIUS;
    const hoverScale = 1 + this.hoverProgress * 0.05;

    ctx.save();
    ctx.translate(centerX, centerY);

    const glowIntensity = this.state.isActive ? 0.8 : this.isActivating ? 0.4 + 0.2 * Math.sin(currentTime * 0.01) : 0.15;
    ctx.shadowColor = this.state.isActive ? '#FFD700' : '#4ECDC4';
    ctx.shadowBlur = 40 * glowIntensity * hoverScale;

    for (let i = this.state.totalLayers; i >= 1; i--) {
      const layerRadius = (baseRadius * i) / this.state.totalLayers * hoverScale;
      const layerProgress = this.state.currentLayer > i - 1
        ? 1
        : this.state.currentLayer === i - 1
          ? this.state.layerAnimProgress
          : 0;

      if (layerProgress > 0) {
        this.renderActivatedLayer(ctx, layerRadius, layerProgress, i, currentTime);
      } else {
        this.renderDeactivatedLayer(ctx, layerRadius, i);
      }
    }

    if (this.state.isActive) {
      this.renderActiveCore(ctx, baseRadius * 0.5, currentTime);
    } else {
      this.renderInactiveCore(ctx, baseRadius * 0.5);
    }

    if (this.state.isFlashing) {
      const flashAlpha = 0.3 + 0.3 * Math.sin(currentTime * 0.02);
      ctx.beginPath();
      ctx.arc(0, 0, baseRadius * 1.2 * hoverScale, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 215, 0, ${flashAlpha})`;
      ctx.fill();
    }

    ctx.restore();
    this.renderRequirement(ctx, centerX, centerY + baseRadius + 50);
  }

  private renderActivatedLayer(
    ctx: CanvasRenderingContext2D,
    radius: number,
    progress: number,
    layerIndex: number,
    currentTime: number
  ): void {
    const colors = ['#4ECDC4', '#95E1D3', '#FFD700'];
    const color = colors[layerIndex - 1] || '#FFD700';
    const drawRadius = radius * progress;

    if (drawRadius <= 0) return;

    ctx.beginPath();
    ctx.arc(0, 0, drawRadius, 0, Math.PI * 2);

    const gradient = ctx.createRadialGradient(0, 0, drawRadius * 0.7, 0, 0, drawRadius);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
    gradient.addColorStop(0.5, this.hexToRgba(color, 0.3 + 0.3 * Math.sin(currentTime * 0.005 + layerIndex)));
    gradient.addColorStop(1, this.hexToRgba(color, 0.9));

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 8 * progress;
    ctx.stroke();
  }

  private renderDeactivatedLayer(ctx: CanvasRenderingContext2D, radius: number, layerIndex: number): void {
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(100, 100, 120, ${0.3 + layerIndex * 0.1})`;
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 8]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  private renderActiveCore(ctx: CanvasRenderingContext2D, radius: number, currentTime: number): void {
    const pulse = 1 + 0.1 * Math.sin(currentTime * 0.01);
    const r = radius * pulse;

    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.3, 'rgba(255, 215, 0, 0.9)');
    gradient.addColorStop(0.7, 'rgba(255, 150, 50, 0.6)');
    gradient.addColorStop(1, 'rgba(255, 100, 50, 0)');

    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
  }

  private renderInactiveCore(ctx: CanvasRenderingContext2D, radius: number): void {
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
    gradient.addColorStop(0, 'rgba(80, 80, 100, 0.6)');
    gradient.addColorStop(1, 'rgba(40, 40, 60, 0.3)');

    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
  }

  private renderBurstParticles(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particleBursts) {
      const alpha = Math.min(1, p.life / 500);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3 * alpha, 0, Math.PI * 2);
      ctx.fillStyle = this.hexToRgba(p.color, alpha);
      ctx.fill();
    }
  }

  private renderRequirement(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    const types: (keyof LevelRequirement)[] = ['fire', 'water', 'wind', 'earth'];
    const boxSize = 16;
    const gap = 8;
    const totalWidth = types.length * (boxSize + gap) + 60;
    let startX = x - totalWidth / 2;

    ctx.font = '14px monospace';
    ctx.fillStyle = '#F5F5F5';
    ctx.textBaseline = 'middle';
    ctx.fillText('需求:', startX, y);
    startX += 45;

    for (const type of types) {
      if (this.requirement[type] === 0) continue;

      drawRoundRect(ctx, startX, y - boxSize / 2, boxSize, boxSize, 4);
      ctx.fillStyle = ELEMENT_COLORS[type];
      ctx.fill();

      ctx.fillStyle = '#F5F5F5';
      ctx.font = '14px monospace';
      ctx.textBaseline = 'middle';
      ctx.fillText(`×${this.requirement[type]}`, startX + boxSize + 4, y);

      startX += boxSize + 28;
    }
  }

  private hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
}
