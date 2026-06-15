import {
  Star,
  StarFragment,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  STAR_MAP_CENTER_X,
  STAR_MAP_CENTER_Y,
  STAR_MAP_RADIUS,
  getRotatedStarPos,
} from './starMap';
import { NavigationState, calculateHorizonPoint } from './navigation';

export interface VisualEffect {
  type: 'pulse' | 'ripple' | 'fadeIn';
  startTime: number;
  duration: number;
  x: number;
  y: number;
  color: string;
  maxRadius?: number;
}

export class StarMapRenderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private allStars: Star[] = [];
  private starSelectionFade: Map<number, number> = new Map();

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('无法获取Canvas上下文');
    this.ctx = ctx;
  }

  public setAllStars(stars: Star[]): void {
    this.allStars = stars;
  }

  public clear(): void {
    this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  public drawStarMapBackground(rotationDeg: number = 0): void {
    const ctx = this.ctx;
    
    ctx.save();
    ctx.beginPath();
    ctx.arc(STAR_MAP_CENTER_X, STAR_MAP_CENTER_Y, STAR_MAP_RADIUS, 0, Math.PI * 2);
    ctx.clip();
    
    const bgGrad = ctx.createRadialGradient(
      STAR_MAP_CENTER_X, STAR_MAP_CENTER_Y, 0,
      STAR_MAP_CENTER_X, STAR_MAP_CENTER_Y, STAR_MAP_RADIUS
    );
    bgGrad.addColorStop(0, '#0B0D1A');
    bgGrad.addColorStop(0.8, '#0B0D1A');
    bgGrad.addColorStop(1, '#14182D');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(
      STAR_MAP_CENTER_X - STAR_MAP_RADIUS,
      STAR_MAP_CENTER_Y - STAR_MAP_RADIUS,
      STAR_MAP_RADIUS * 2,
      STAR_MAP_RADIUS * 2
    );
    
    ctx.restore();
    
    this.drawEdgeTexture();
  }

  private drawEdgeTexture(): void {
    const ctx = this.ctx;
    
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      const r = STAR_MAP_RADIUS - i * 8;
      ctx.arc(STAR_MAP_CENTER_X, STAR_MAP_CENTER_Y, r, 0, Math.PI * 2);
      const alpha = 0.12 - i * 0.03;
      ctx.strokeStyle = `rgba(139, 115, 85, ${alpha})`;
      ctx.lineWidth = 10 - i * 3;
      ctx.stroke();
    }
    
    ctx.beginPath();
    ctx.arc(STAR_MAP_CENTER_X, STAR_MAP_CENTER_Y, STAR_MAP_RADIUS - 2, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(139, 115, 85, 0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  public drawFragment(fragment: StarFragment, currentTime: number): void {
    const ctx = this.ctx;
    const { shape, currentX, currentY, currentRotation, stars, isLocked, scale } = fragment;
    
    ctx.save();
    ctx.translate(currentX, currentY);
    ctx.rotate(currentRotation);
    ctx.translate(-STAR_MAP_CENTER_X, -STAR_MAP_CENTER_Y);
    ctx.scale(scale, scale);
    
    ctx.save();
    this.buildFragmentPath(shape);
    ctx.clip();
    
    ctx.fillStyle = '#0B0D1A';
    const r = STAR_MAP_RADIUS + 20;
    ctx.fillRect(STAR_MAP_CENTER_X - r, STAR_MAP_CENTER_Y - r, r * 2, r * 2);
    
    for (const star of stars) {
      this.drawSingleStar(star, false, currentTime, 0);
    }
    
    ctx.restore();
    
    this.buildFragmentPath(shape);
    ctx.strokeStyle = isLocked ? '#D4A017' : '#4A3728';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.stroke();
    
    if (isLocked) {
      this.buildFragmentPath(shape);
      const glowGrad = ctx.createRadialGradient(
        currentX, currentY, STAR_MAP_RADIUS * 0.5,
        currentX, currentY, STAR_MAP_RADIUS
      );
      glowGrad.addColorStop(0, 'rgba(212, 160, 23, 0)');
      glowGrad.addColorStop(1, 'rgba(212, 160, 23, 0.15)');
      ctx.fillStyle = glowGrad;
      ctx.fill();
    }
    
    ctx.restore();
  }

  private buildFragmentPath(shape: FragmentShape): void {
    const ctx = this.ctx;
    const { bezierPoints, innerArcStart, innerArcEnd } = shape;
    
    const startPoint = this.getArcPoint(innerArcStart);
    const bezierStart = this.getBezierStart(innerArcStart, bezierPoints);
    
    ctx.beginPath();
    ctx.moveTo(startPoint.x, startPoint.y);
    ctx.arc(STAR_MAP_CENTER_X, STAR_MAP_CENTER_Y, STAR_MAP_RADIUS - 4, innerArcStart, innerArcEnd);
    const bezierEndX = bezierPoints.ex;
    const bezierEndY = bezierPoints.ey;
    ctx.lineTo(bezierEndX, bezierEndY);
    ctx.bezierCurveTo(
      bezierPoints.cp2x, bezierPoints.cp2y,
      bezierPoints.cp1x, bezierPoints.cp1y,
      bezierStart.x, bezierStart.y
    );
    ctx.closePath();
  }

  private getArcPoint(angle: number): { x: number; y: number } {
    return {
      x: STAR_MAP_CENTER_X + Math.cos(angle) * (STAR_MAP_RADIUS - 4),
      y: STAR_MAP_CENTER_Y + Math.sin(angle) * (STAR_MAP_RADIUS - 4),
    };
  }

  private getBezierStart(
    startAngle: number,
    bp: { cp1x: number; cp1y: number; cp2x: number; cp2y: number; ex: number; ey: number }
  ): { x: number; y: number } {
    const dx1 = bp.cp1x - STAR_MAP_CENTER_X;
    const dy1 = bp.cp1y - STAR_MAP_CENTER_Y;
    const r1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
    return {
      x: STAR_MAP_CENTER_X + Math.cos(startAngle + 0.25) * r1,
      y: STAR_MAP_CENTER_Y + Math.sin(startAngle + 0.25) * r1,
    };
  }

  public drawSingleStar(
    star: Star,
    isSelected: boolean,
    currentTime: number,
    rotationDeg: number,
    enhanced: boolean = false
  ): void {
    const ctx = this.ctx;
    const pos = rotationDeg !== 0
      ? getRotatedStarPos(star, rotationDeg)
      : { x: star.x, y: star.y };
    
    let size = star.size;
    let alpha = star.brightness;
    
    if (enhanced) {
      size *= 1.3;
      alpha = Math.min(1, alpha * 1.3);
    }
    
    if (size > 0.6) {
      const glowR = size * 4;
      const glowGrad = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, glowR);
      glowGrad.addColorStop(0, `rgba(255, 248, 230, ${alpha * 0.4})`);
      glowGrad.addColorStop(1, 'rgba(255, 248, 230, 0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, glowR, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.fillStyle = star.color;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    
    if (isSelected) {
      this.drawSelectionHalo(pos.x, pos.y, currentTime, star.id);
    }
  }

  private drawSelectionHalo(x: number, y: number, currentTime: number, starId: number): void {
    const ctx = this.ctx;
    const cycle = 1500;
    const t = (currentTime % cycle) / cycle;
    const pulse = Math.sin(t * Math.PI * 2);
    const alpha = 0.5 + 0.3 * pulse;
    const radius = 6 + 1 * pulse;
    
    let fadeProgress = this.starSelectionFade.get(starId) ?? 1;
    if (fadeProgress < 1) {
      fadeProgress = Math.min(1, fadeProgress + 0.05);
      this.starSelectionFade.set(starId, fadeProgress);
    }
    
    ctx.save();
    ctx.globalAlpha = alpha * fadeProgress;
    
    const haloGrad = ctx.createRadialGradient(x, y, 0, x, y, radius + 4);
    haloGrad.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    haloGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
    haloGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.arc(x, y, radius + 4, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * fadeProgress})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.restore();
  }

  public triggerStarSelectionFade(starId: number): void {
    this.starSelectionFade.set(starId, 0);
  }

  public drawNavigationLine(
    star: Star,
    rotationDeg: number
  ): void {
    const ctx = this.ctx;
    const starPos = getRotatedStarPos(star, rotationDeg);
    const horizonPos = calculateHorizonPoint(star, rotationDeg);
    
    ctx.save();
    ctx.globalAlpha = 0.7;
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(starPos.x, starPos.y);
    ctx.lineTo(horizonPos.x, horizonPos.y);
    ctx.stroke();
    
    const dx = horizonPos.x - starPos.x;
    const dy = horizonPos.y - starPos.y;
    const angle = Math.atan2(dy, dx);
    const arrowSize = 8;
    
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.moveTo(horizonPos.x, horizonPos.y);
    ctx.lineTo(
      horizonPos.x - arrowSize * Math.cos(angle - Math.PI / 6),
      horizonPos.y - arrowSize * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      horizonPos.x - arrowSize * Math.cos(angle + Math.PI / 6),
      horizonPos.y - arrowSize * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
  }

  public drawCompass(
    cx: number,
    cy: number,
    compassAngle: number,
    directionText: string
  ): void {
    const ctx = this.ctx;
    
    ctx.save();
    
    ctx.beginPath();
    ctx.arc(cx, cy, 60, 0, Math.PI * 2);
    ctx.strokeStyle = '#4A3728';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(cx, cy, 40, 0, Math.PI * 2);
    ctx.strokeStyle = '#6B5B4A';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(cx, cy, 20, 0, Math.PI * 2);
    ctx.strokeStyle = '#8B7355';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    ctx.save();
    ctx.translate(cx, cy);
    const needleRad = (compassAngle * Math.PI) / 180;
    ctx.rotate(needleRad);
    
    ctx.fillStyle = '#D4A017';
    ctx.beginPath();
    ctx.moveTo(0, -20);
    ctx.lineTo(5, 0);
    ctx.lineTo(0, 5);
    ctx.lineTo(-5, 0);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#8B7355';
    ctx.beginPath();
    ctx.moveTo(0, 20);
    ctx.lineTo(5, 0);
    ctx.lineTo(0, -5);
    ctx.lineTo(-5, 0);
    ctx.closePath();
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#4A3728';
    ctx.fill();
    
    ctx.restore();
    
    ctx.fillStyle = '#8B7355';
    ctx.font = '10px SimSun, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('北', cx, cy - 50);
    ctx.fillText('南', cx, cy + 50);
    ctx.fillText('东', cx + 50, cy);
    ctx.fillText('西', cx - 50, cy);
    
    ctx.restore();
    
    ctx.save();
    ctx.font = '16px SimSun, serif';
    ctx.fillStyle = '#8B7355';
    ctx.textAlign = 'center';
    ctx.fillText(directionText, cx, cy + 80);
    ctx.restore();
  }

  public drawCompleteText(): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.font = 'bold 32px SimSun, "Noto Serif SC", serif';
    ctx.fillStyle = '#D4A017';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    
    ctx.shadowColor = 'rgba(212, 160, 23, 0.5)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetY = 2;
    
    const y = STAR_MAP_CENTER_Y - STAR_MAP_RADIUS - 20;
    ctx.fillText('星图已修复', STAR_MAP_CENTER_X, y);
    ctx.restore();
  }

  public drawVisualEffects(effects: VisualEffect[], currentTime: number): VisualEffect[] {
    const ctx = this.ctx;
    const remaining: VisualEffect[] = [];
    
    for (const effect of effects) {
      const elapsed = currentTime - effect.startTime;
      const progress = elapsed / effect.duration;
      
      if (progress >= 1) continue;
      remaining.push(effect);
      
      if (effect.type === 'pulse') {
        const maxR = effect.maxRadius ?? STAR_MAP_RADIUS + 50;
        const r = maxR * progress;
        const alpha = 1 - progress;
        
        const grad = ctx.createRadialGradient(
          effect.x, effect.y, r * 0.3,
          effect.x, effect.y, r
        );
        grad.addColorStop(0, `rgba(255, 215, 0, ${alpha * 0.4})`);
        grad.addColorStop(0.5, `rgba(255, 215, 0, ${alpha * 0.2})`);
        grad.addColorStop(1, `rgba(255, 215, 0, 0)`);
        
        ctx.save();
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, r, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = `rgba(255, 215, 0, ${alpha * 0.6})`;
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();
      } else if (effect.type === 'ripple') {
        const maxR = effect.maxRadius ?? 400;
        const r = maxR * progress;
        const alpha = 1 - progress;
        
        ctx.save();
        ctx.strokeStyle = `rgba(139, 115, 85, ${alpha * 0.7})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, r, 0, Math.PI * 2);
        ctx.stroke();
        
        if (progress < 0.7) {
          ctx.strokeStyle = `rgba(139, 115, 85, ${(alpha - 0.3) * 0.7})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(effect.x, effect.y, r * 0.7, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      }
    }
    
    return remaining;
  }

  public drawAllStarsNavMode(
    nav: NavigationState,
    currentTime: number
  ): void {
    const selectedId = nav.selectedStar?.id ?? -1;
    
    for (const star of this.allStars) {
      const isSelected = star.id === selectedId;
      const enhanced = star.id === selectedId || star.isKey;
      this.drawSingleStar(star, isSelected, currentTime, nav.currentRotation, enhanced);
    }
  }

  public getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }
}

interface FragmentShape {
  bezierPoints: { cp1x: number; cp1y: number; cp2x: number; cp2y: number; ex: number; ey: number };
  innerArcStart: number;
  innerArcEnd: number;
}
