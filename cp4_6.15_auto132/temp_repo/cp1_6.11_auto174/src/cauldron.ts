import { Ingredient, ElementType } from './reactionEngine';

interface Droplet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  ingredientId: string;
  elementType: ElementType;
  life: number;
  maxLife: number;
  blending: { targetColor: string; progress: number } | null;
  settled: boolean;
}

export class Cauldron {
  public centerX: number;
  public centerY: number;
  public radius: number;
  private droplets: Droplet[] = [];
  private ingredients: Ingredient[] = [];
  private maxDroplets = 10;
  private saturationPerDroplet = 0.2;
  private resetFlash = 0;

  constructor(centerX: number, centerY: number, radius: number) {
    this.centerX = centerX;
    this.centerY = centerY;
    this.radius = radius;
  }

  public setPosition(centerX: number, centerY: number, radius: number): void {
    this.centerX = centerX;
    this.centerY = centerY;
    this.radius = radius;
  }

  public addIngredient(ingredient: Ingredient, dropX?: number, dropY?: number): void {
    if (this.droplets.length >= this.maxDroplets) {
      this.droplets.shift();
      const idx = this.ingredients.findIndex((i) => i.id === ingredient.id);
      if (idx !== -1) this.ingredients.splice(idx, 1);
    }

    let startX: number;
    let startY: number;
    if (dropX !== undefined && dropY !== undefined) {
      startX = dropX;
      startY = dropY;
    } else {
      const angle = Math.random() * Math.PI * 2;
      startX = this.centerX + Math.cos(angle) * this.radius * 0.5;
      startY = this.centerY - this.radius * 0.3;
    }

    const dx = this.centerX - startX;
    const dy = this.centerY - startY;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const speed = 80 + Math.random() * 60;

    const droplet: Droplet = {
      x: startX,
      y: startY,
      vx: (dx / dist) * speed,
      vy: (dy / dist) * speed,
      radius: 10 + Math.random() * 8,
      color: ingredient.color,
      ingredientId: ingredient.id,
      elementType: ingredient.elementType,
      life: 0,
      maxLife: 15,
      blending: null,
      settled: false,
    };

    this.droplets.push(droplet);
    if (!this.ingredients.find((i) => i.id === ingredient.id)) {
      this.ingredients.push(ingredient);
    }

    this.checkAndBlend(droplet);
  }

  private checkAndBlend(newDroplet: Droplet): void {
    for (const d of this.droplets) {
      if (d === newDroplet) continue;
      const dx = d.x - newDroplet.x;
      const dy = d.y - newDroplet.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < d.radius + newDroplet.radius + 20) {
        newDroplet.blending = {
          targetColor: this.blendColors(d.color, newDroplet.color),
          progress: 0,
        };
        d.blending = {
          targetColor: this.blendColors(newDroplet.color, d.color),
          progress: 0,
        };
      }
    }
  }

  private blendColors(color1: string, color2: string): string {
    const r1 = parseInt(color1.slice(1, 3), 16);
    const g1 = parseInt(color1.slice(3, 5), 16);
    const b1 = parseInt(color1.slice(5, 7), 16);
    const r2 = parseInt(color2.slice(1, 3), 16);
    const g2 = parseInt(color2.slice(3, 5), 16);
    const b2 = parseInt(color2.slice(5, 7), 16);

    const r = Math.round((r1 + r2) / 2);
    const g = Math.round((g1 + g2) / 2);
    const b = Math.round((b1 + b2) / 2);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  public update(deltaTime: number): void {
    if (this.resetFlash > 0) {
      this.resetFlash = Math.max(0, this.resetFlash - deltaTime);
    }

    for (let i = this.droplets.length - 1; i >= 0; i--) {
      const d = this.droplets[i];
      d.life += deltaTime;

      if (d.blending) {
        d.blending.progress = Math.min(1, d.blending.progress + deltaTime * 2);
        if (d.blending.progress >= 1) {
          d.color = d.blending.targetColor;
          d.blending = null;
        }
      }

      if (!d.settled) {
        d.vy += 120 * deltaTime;
        d.x += d.vx * deltaTime;
        d.y += d.vy * deltaTime;

        const dx = d.x - this.centerX;
        const dy = d.y - this.centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxR = this.radius * 0.8;

        if (dist > maxR - d.radius * 0.5) {
          const nx = dx / dist;
          const ny = dy / dist;
          d.x = this.centerX + nx * (maxR - d.radius * 0.5);
          d.y = this.centerY + ny * (maxR - d.radius * 0.5);
          const dot = d.vx * nx + d.vy * ny;
          d.vx -= 1.8 * dot * nx;
          d.vy -= 1.8 * dot * ny;
          d.vx *= 0.5;
          d.vy *= 0.5;

          if (Math.abs(d.vx) < 10 && Math.abs(d.vy) < 10 && d.life > 0.3) {
            d.settled = true;
          }
        }
      } else {
        d.x += Math.sin(d.life * 2 + i) * 8 * deltaTime;
        d.y += Math.cos(d.life * 1.5 + i * 0.7) * 5 * deltaTime;
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    this.renderCauldronBody(ctx);
    this.renderLiquid(ctx);
    this.renderDroplets(ctx);
    this.renderProgressBar(ctx);

    if (this.resetFlash > 0) {
      const alpha = 0.6 + 0.4 * Math.sin(this.resetFlash * 40);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha * (this.resetFlash / 0.3)})`;
      ctx.beginPath();
      ctx.arc(this.centerX, this.centerY, this.radius * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private renderCauldronBody(ctx: CanvasRenderingContext2D): void {
    const r = this.radius;
    const x = this.centerX;
    const y = this.centerY;

    ctx.save();
    const bodyGrad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.2, x, y, r);
    bodyGrad.addColorStop(0, '#2D1B4E');
    bodyGrad.addColorStop(0.7, '#1A0A2E');
    bodyGrad.addColorStop(1, '#0D0515');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    const rimGrad = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
    rimGrad.addColorStop(0, '#B87333');
    rimGrad.addColorStop(0.5, '#D4A855');
    rimGrad.addColorStop(1, '#8B5A2B');
    ctx.strokeStyle = rimGrad;
    ctx.lineWidth = r * 0.08;
    ctx.beginPath();
    ctx.arc(x, y, r - r * 0.04, 0, Math.PI * 2);
    ctx.stroke();

    ctx.globalAlpha = 0.2;
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const ix = x + Math.cos(angle) * r * 0.5;
      const texGrad = ctx.createLinearGradient(ix, y - r, ix, y + r);
      texGrad.addColorStop(0, 'rgba(212, 168, 85, 0)');
      texGrad.addColorStop(0.5, 'rgba(212, 168, 85, 0.6)');
      texGrad.addColorStop(1, 'rgba(212, 168, 85, 0)');
      ctx.strokeStyle = texGrad;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ix, y - r * 0.9);
      ctx.lineTo(ix + Math.sin(angle) * 5, y + r * 0.9);
      ctx.stroke();
    }
    ctx.restore();
  }

  private renderLiquid(ctx: CanvasRenderingContext2D): void {
    const r = this.radius * 0.8;
    const x = this.centerX;
    const y = this.centerY;

    let avgColor = '#2D1B4E';
    if (this.droplets.length > 0) {
      let totalR = 0, totalG = 0, totalB = 0;
      for (const d of this.droplets) {
        totalR += parseInt(d.color.slice(1, 3), 16);
        totalG += parseInt(d.color.slice(3, 5), 16);
        totalB += parseInt(d.color.slice(5, 7), 16);
      }
      const n = this.droplets.length;
      avgColor = `#${Math.round(totalR / n).toString(16).padStart(2, '0')}${Math.round(totalG / n).toString(16).padStart(2, '0')}${Math.round(totalB / n).toString(16).padStart(2, '0')}`;
    }

    const saturation = this.getSaturation();
    const alpha = 0.4 + saturation * 0.5;

    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r * 0.95, 0, Math.PI * 2);
    ctx.clip();

    const liquidGrad = ctx.createRadialGradient(x, y - r * 0.2, r * 0.1, x, y, r);
    liquidGrad.addColorStop(0, this.adjustColorBrightness(avgColor, 1.3, alpha));
    liquidGrad.addColorStop(0.6, this.hexToRgba(avgColor, alpha));
    liquidGrad.addColorStop(1, this.adjustColorBrightness(avgColor, 0.6, alpha * 0.8));
    ctx.fillStyle = liquidGrad;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);

    if (this.droplets.length > 0) {
      const time = performance.now() / 1000;
      ctx.globalAlpha = 0.15;
      for (let i = 0; i < 3; i++) {
        const offset = Math.sin(time * 1.5 + i * 2) * r * 0.1;
        ctx.beginPath();
        ctx.ellipse(x + offset, y + r * 0.2 + i * 5, r * (0.8 - i * 0.2), r * 0.06, 0, 0, Math.PI * 2);
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  private renderDroplets(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, this.radius * 0.78, 0, Math.PI * 2);
    ctx.clip();

    for (const d of this.droplets) {
      let color = d.color;
      if (d.blending) {
        color = this.interpolateColor(d.color, d.blending.targetColor, d.blending.progress);
      }

      const grad = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.radius);
      grad.addColorStop(0, this.adjustColorBrightness(color, 1.4, 1));
      grad.addColorStop(0.5, this.hexToRgba(color, 0.9));
      grad.addColorStop(1, this.adjustColorBrightness(color, 0.6, 0.7));
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.beginPath();
      ctx.arc(d.x - d.radius * 0.3, d.y - d.radius * 0.3, d.radius * 0.25, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private renderProgressBar(ctx: CanvasRenderingContext2D): void {
    const w = this.radius * 1.8;
    const h = 10;
    const x = this.centerX - w / 2;
    const y = this.centerY + this.radius + 18;
    const saturation = this.getSaturation();

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, h / 2);
    ctx.fill();

    const fillW = w * saturation;
    if (fillW > 2) {
      const grad = ctx.createLinearGradient(x, y, x + w, y);
      grad.addColorStop(0, '#4A90D9');
      grad.addColorStop(1, '#FF6B6B');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x + 1, y + 1, fillW - 2, h - 2, (h - 2) / 2);
      ctx.fill();

      if (saturation >= 1) {
        ctx.shadowColor = '#FF6B6B';
        ctx.shadowBlur = 10;
        ctx.strokeStyle = 'rgba(255, 107, 107, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, h / 2);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  public getIngredients(): Ingredient[] {
    return this.ingredients;
  }

  public getIngredientIds(): string[] {
    return this.ingredients.map((i) => i.id);
  }

  public getSaturation(): number {
    return Math.min(1, this.droplets.length * this.saturationPerDroplet);
  }

  public canReact(): boolean {
    return this.ingredients.length >= 3 && this.getSaturation() >= 1;
  }

  public reset(): void {
    this.droplets = [];
    this.ingredients = [];
    this.resetFlash = 0.3;
  }

  public clearForReaction(): void {
    this.droplets = [];
    this.ingredients = [];
  }

  public getElementRatio(): { nature: number; magic: number; darkness: number } {
    let nature = 0, magic = 0, darkness = 0;
    for (const ing of this.ingredients) {
      switch (ing.elementType) {
        case 'nature': nature += 0.1; break;
        case 'magic': magic += 0.1; break;
        case 'darkness': darkness += 0.1; break;
      }
    }
    return {
      nature: Math.min(1, nature),
      magic: Math.min(1, magic),
      darkness: Math.min(1, darkness),
    };
  }

  private hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  private adjustColorBrightness(hex: string, factor: number, alpha: number): string {
    const r = Math.min(255, Math.round(parseInt(hex.slice(1, 3), 16) * factor));
    const g = Math.min(255, Math.round(parseInt(hex.slice(3, 5), 16) * factor));
    const b = Math.min(255, Math.round(parseInt(hex.slice(5, 7), 16) * factor));
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  private interpolateColor(c1: string, c2: string, t: number): string {
    const r1 = parseInt(c1.slice(1, 3), 16);
    const g1 = parseInt(c1.slice(3, 5), 16);
    const b1 = parseInt(c1.slice(5, 7), 16);
    const r2 = parseInt(c2.slice(1, 3), 16);
    const g2 = parseInt(c2.slice(3, 5), 16);
    const b2 = parseInt(c2.slice(5, 7), 16);
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  public containsPoint(px: number, py: number): boolean {
    const dx = px - this.centerX;
    const dy = py - this.centerY;
    return dx * dx + dy * dy <= this.radius * this.radius;
  }
}
