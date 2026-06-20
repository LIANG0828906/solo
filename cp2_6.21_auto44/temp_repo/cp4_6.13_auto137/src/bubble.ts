import { random } from './utils';

export type BubbleColor = 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple';
export type BubblePattern = 'star' | 'heart' | 'circle' | 'triangle' | 'diamond' | 'hexagon';
export type BubbleType = 'normal' | 'striped' | 'bomb' | 'comet';

export interface BubbleConfig {
  color: BubbleColor;
  secondaryColor?: BubbleColor;
  pattern: BubblePattern;
  diameter: number;
  x: number;
  y: number;
  speed: number;
  type: BubbleType;
}

const COLOR_MAP: Record<BubbleColor, string> = {
  red: '#ff6b6b',
  orange: '#ffa94d',
  yellow: '#ffd43b',
  green: '#51cf66',
  blue: '#4dabf7',
  purple: '#da77f2'
};

const COLOR_GLOW_MAP: Record<BubbleColor, string> = {
  red: '#ff8787',
  orange: '#ffb86c',
  yellow: '#ffe066',
  green: '#69db7c',
  blue: '#74c0fc',
  purple: '#e599f7'
};

const PATTERN_MAP: Record<BubbleColor, BubblePattern> = {
  red: 'star',
  orange: 'heart',
  yellow: 'circle',
  green: 'triangle',
  blue: 'diamond',
  purple: 'hexagon'
};

export class Bubble {
  x: number;
  y: number;
  diameter: number;
  radius: number;
  color: BubbleColor;
  secondaryColor?: BubbleColor;
  pattern: BubblePattern;
  speed: number;
  type: BubbleType;
  
  wobbleOffset: number;
  wobbleSpeed: number;
  wobbleAmount: number;
  
  animationState: 'idle' | 'popping' | 'shaking' | 'darkening';
  animationProgress: number;
  popScale: number;
  popRotation: number;
  shakeOffset: number;
  darkenAmount: number;
  
  glowPulse: number;
  glowIntensity: number;
  lastTrailEmitTime: number = 0;

  constructor(config: BubbleConfig) {
    this.x = config.x;
    this.y = config.y;
    this.diameter = config.diameter;
    this.radius = config.diameter / 2;
    this.color = config.color;
    this.secondaryColor = config.secondaryColor;
    this.pattern = config.pattern;
    this.speed = config.speed;
    this.type = config.type;
    
    this.wobbleOffset = random(0, Math.PI * 2);
    this.wobbleSpeed = random(0.02, 0.04);
    this.wobbleAmount = random(10, 25);
    
    this.animationState = 'idle';
    this.animationProgress = 0;
    this.popScale = 1;
    this.popRotation = 0;
    this.shakeOffset = 0;
    this.darkenAmount = 0;
    
    this.glowPulse = random(0, Math.PI * 2);
    this.glowIntensity = config.type === 'bomb' ? 1.5 : config.type === 'comet' ? 1.2 : 1;
    this.lastTrailEmitTime = 0;
  }

  update(deltaTime: number, _currentTime?: number): void {
    if (this.animationState === 'popping') {
      this.animationProgress += deltaTime / 300;
      const t = Math.min(this.animationProgress, 1);
      this.popScale = 1 + t * 0.5;
      this.popRotation = t * Math.PI * 2;
      return;
    }
    
    if (this.animationState === 'shaking') {
      this.animationProgress += deltaTime / 200;
      this.shakeOffset = Math.sin(this.animationProgress * 30) * 5;
      if (this.animationProgress >= 1) {
        this.animationState = 'idle';
        this.animationProgress = 0;
        this.shakeOffset = 0;
      }
      return;
    }
    
    if (this.animationState === 'darkening') {
      this.animationProgress += deltaTime / 300;
      this.darkenAmount = Math.sin(Math.min(this.animationProgress, 1) * Math.PI) * 0.5;
      if (this.animationProgress >= 1) {
        this.animationState = 'idle';
        this.animationProgress = 0;
        this.darkenAmount = 0;
      }
      return;
    }
    
    this.y -= this.speed;
    this.wobbleOffset += this.wobbleSpeed;
    this.x += Math.sin(this.wobbleOffset) * this.wobbleAmount * 0.02;
    this.glowPulse += 0.05;
  }

  shouldEmitTrail(currentTime: number, interval: number = 30): boolean {
    if (this.type !== 'comet') return false;
    if (this.animationState !== 'idle') return false;
    if (currentTime - this.lastTrailEmitTime >= interval) {
      this.lastTrailEmitTime = currentTime;
      return true;
    }
    return false;
  }

  getTrailPosition(): { x: number; y: number } {
    return { x: this.x, y: this.y + this.radius * 0.5 };
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.translate(this.x + this.shakeOffset, this.y);
    
    if (this.animationState === 'popping') {
      const t = Math.min(this.animationProgress, 1);
      const scale = this.popScale * (1 - t * 0.5);
      const alpha = 1 - t;
      ctx.scale(scale, scale);
      ctx.globalAlpha = alpha;
      ctx.rotate(this.popRotation);
    }
    
    if (this.darkenAmount > 0) {
      ctx.globalAlpha = 1 - this.darkenAmount;
    }
    
    this.renderBubble(ctx);
    
    ctx.restore();
  }

  private renderBubble(ctx: CanvasRenderingContext2D): void {
    const r = this.radius;
    const glowSize = r * (1.2 + Math.sin(this.glowPulse) * 0.1) * this.glowIntensity;
    
    const gradient = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 0, 0, 0, glowSize);
    const baseColor = COLOR_MAP[this.color];
    const glowColor = COLOR_GLOW_MAP[this.color];
    
    if (this.type === 'striped' && this.secondaryColor) {
      this.renderStripedBubble(ctx, r, gradient, baseColor, glowColor);
    } else if (this.type === 'bomb') {
      this.renderBombBubble(ctx, r, gradient, baseColor, glowColor);
    } else {
      this.renderNormalBubble(ctx, r, gradient, baseColor, glowColor);
    }
    
    this.renderPattern(ctx, r * 0.5);
    
    const highlightGradient = ctx.createRadialGradient(-r * 0.4, -r * 0.4, 0, -r * 0.2, -r * 0.2, r * 0.5);
    highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
    highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = highlightGradient;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
  }

  private renderNormalBubble(
    ctx: CanvasRenderingContext2D,
    r: number,
    gradient: CanvasGradient,
    baseColor: string,
    _glowColor: string
  ): void {
    gradient.addColorStop(0, baseColor);
    gradient.addColorStop(0.7, this.adjustBrightness(baseColor, -20));
    gradient.addColorStop(1, this.adjustBrightness(baseColor, -40));
    
    ctx.shadowColor = baseColor;
    ctx.shadowBlur = 20;
    ctx.fillStyle = gradient;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  private renderStripedBubble(
    ctx: CanvasRenderingContext2D,
    r: number,
    _gradient: CanvasGradient,
    color1: string,
    _glowColor: string
  ): void {
    const color2 = COLOR_MAP[this.secondaryColor!];
    
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.clip();
    
    const gradient1 = ctx.createLinearGradient(-r, -r, r, r);
    gradient1.addColorStop(0, color1);
    gradient1.addColorStop(0.5, this.adjustBrightness(color1, -20));
    
    ctx.fillStyle = gradient1;
    ctx.fillRect(-r, -r, r * 2, r);
    
    const gradient2 = ctx.createLinearGradient(-r, 0, r, r * 2);
    gradient2.addColorStop(0.5, this.adjustBrightness(color2, -20));
    gradient2.addColorStop(1, color2);
    
    ctx.fillStyle = gradient2;
    ctx.fillRect(-r, 0, r * 2, r);
    
    ctx.shadowColor = color1;
    ctx.shadowBlur = 10;
    
    ctx.restore();
    
    ctx.shadowColor = color2;
    ctx.shadowBlur = 15;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  private renderBombBubble(
    ctx: CanvasRenderingContext2D,
    r: number,
    _gradient: CanvasGradient,
    _baseColor: string,
    _glowColor: string
  ): void {
    const pulse = 1 + Math.sin(this.glowPulse * 2) * 0.1;
    
    ctx.shadowColor = '#ff4444';
    ctx.shadowBlur = 25 * pulse;
    
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 1.2);
    gradient.addColorStop(0, '#ff6666');
    gradient.addColorStop(0.5, '#cc3333');
    gradient.addColorStop(1, '#991111');
    
    ctx.fillStyle = gradient;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(0, 0, r * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    
    ctx.strokeStyle = '#ffff66';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.6, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.fillStyle = '#ffff66';
    ctx.font = `bold ${r * 0.6}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('💣', 0, 0);
  }

  private renderPattern(ctx: CanvasRenderingContext2D, size: number): void {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
    ctx.shadowBlur = 5;
    
    switch (this.pattern) {
      case 'star':
        this.drawStar(ctx, 0, 0, 5, size, size * 0.4);
        break;
      case 'heart':
        this.drawHeart(ctx, 0, 0, size);
        break;
      case 'circle':
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.7, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'triangle':
        this.drawTriangle(ctx, 0, -size * 0.1, size);
        break;
      case 'diamond':
        this.drawDiamond(ctx, 0, 0, size);
        break;
      case 'hexagon':
        this.drawHexagon(ctx, 0, 0, size);
        break;
    }
    
    ctx.restore();
  }

  private drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number): void {
    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (Math.PI * i) / spikes - Math.PI / 2;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.fill();
  }

  private drawHeart(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number): void {
    ctx.beginPath();
    const s = size * 0.7;
    ctx.moveTo(cx, cy + s * 0.5);
    ctx.bezierCurveTo(cx - s, cy - s * 0.5, cx - s, cy - s, cx, cy - s * 0.3);
    ctx.bezierCurveTo(cx + s, cy - s, cx + s, cy - s * 0.5, cx, cy + s * 0.5);
    ctx.fill();
  }

  private drawTriangle(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number): void {
    const h = size * 0.9;
    ctx.beginPath();
    ctx.moveTo(cx, cy - h / 2);
    ctx.lineTo(cx - size * 0.6, cy + h / 2);
    ctx.lineTo(cx + size * 0.6, cy + h / 2);
    ctx.closePath();
    ctx.fill();
  }

  private drawDiamond(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number): void {
    ctx.beginPath();
    ctx.moveTo(cx, cy - size);
    ctx.lineTo(cx + size * 0.6, cy);
    ctx.lineTo(cx, cy + size);
    ctx.lineTo(cx - size * 0.6, cy);
    ctx.closePath();
    ctx.fill();
  }

  private drawHexagon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number): void {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 2;
      const x = cx + Math.cos(angle) * size * 0.7;
      const y = cy + Math.sin(angle) * size * 0.7;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.fill();
  }

  containsPoint(px: number, py: number): boolean {
    if (!this.isClickable()) return false;
    
    let localX = px - (this.x + this.shakeOffset);
    let localY = py - this.y;
    
    if (this.animationState === 'popping') {
      const t = Math.min(this.animationProgress, 1);
      const scale = this.popScale * (1 - t * 0.5);
      const rotation = this.popRotation;
      
      const cos = Math.cos(-rotation);
      const sin = Math.sin(-rotation);
      const rotatedX = localX * cos - localY * sin;
      const rotatedY = localX * sin + localY * cos;
      
      localX = rotatedX / scale;
      localY = rotatedY / scale;
    }
    
    const distSq = localX * localX + localY * localY;
    return distSq <= this.radius * this.radius;
  }

  isClickable(): boolean {
    return this.animationState === 'idle';
  }

  pop(): void {
    if (this.animationState === 'idle') {
      this.animationState = 'popping';
      this.animationProgress = 0;
    }
  }

  shake(): void {
    if (this.animationState === 'idle') {
      this.animationState = 'shaking';
      this.animationProgress = 0;
    }
  }

  darken(): void {
    if (this.animationState === 'idle') {
      this.animationState = 'darkening';
      this.animationProgress = 0;
    }
  }

  isPopped(): boolean {
    return this.animationState === 'popping' && this.animationProgress >= 1;
  }

  isOffScreen(): boolean {
    return this.y < -this.radius * 2;
  }

  matchesTarget(targetColor: BubbleColor): boolean {
    if (this.type === 'bomb') return false;
    if (this.type === 'striped') {
      return this.color === targetColor || this.secondaryColor === targetColor;
    }
    return this.color === targetColor;
  }

  getColors(): BubbleColor[] {
    if (this.type === 'striped' && this.secondaryColor) {
      return [this.color, this.secondaryColor];
    }
    return [this.color];
  }

  private adjustBrightness(hex: string, amount: number): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return hex;
    
    let r = parseInt(result[1], 16) + amount;
    let g = parseInt(result[2], 16) + amount;
    let b = parseInt(result[3], 16) + amount;
    
    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));
    
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }

  static getPatternForColor(color: BubbleColor): BubblePattern {
    return PATTERN_MAP[color];
  }

  static getHexColor(color: BubbleColor): string {
    return COLOR_MAP[color];
  }
}

export { COLOR_MAP, PATTERN_MAP };
