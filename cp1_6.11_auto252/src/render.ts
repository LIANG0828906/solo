import type { FurnaceState, FlameParticle, Bubble, Ripple, ThrownHerb } from './furnace';
import { getShakeOffset } from './furnace';
import type { Herb } from './danfang';
import { getElementName } from './danfang';

export interface RenderContext {
  ctx: CanvasRenderingContext2D;
  rippleCtx: CanvasRenderingContext2D;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  furnaceWidth: number;
  furnaceHeight: number;
  liquidY: number;
  mouthY: number;
}

export function createRenderContext(
  canvas: HTMLCanvasElement,
  rippleCanvas: HTMLCanvasElement
): RenderContext {
  const ctx = canvas.getContext('2d')!;
  const rippleCtx = rippleCanvas.getContext('2d')!;
  
  resizeCanvas(canvas, rippleCanvas);
  
  return {
    ctx,
    rippleCtx,
    width: canvas.width,
    height: canvas.height,
    centerX: canvas.width / 2,
    centerY: canvas.height / 2,
    furnaceWidth: canvas.width * 0.6,
    furnaceHeight: canvas.height * 0.6,
    liquidY: canvas.height / 2 + canvas.height * 0.1,
    mouthY: canvas.height / 2 - canvas.height * 0.15
  };
}

export function resizeCanvas(canvas: HTMLCanvasElement, rippleCanvas: HTMLCanvasElement): void {
  const container = canvas.parentElement!;
  const containerRect = container.getBoundingClientRect();
  
  const isMobile = window.innerWidth <= 768;
  const scale = isMobile ? 0.6 : 1;
  const baseSize = Math.min(containerRect.width, containerRect.height) * scale;
  
  canvas.width = baseSize;
  canvas.height = baseSize;
  rippleCanvas.width = baseSize;
  rippleCanvas.height = baseSize;
}

export function getFurnaceDimensions(rc: RenderContext) {
  return {
    centerX: rc.width / 2,
    centerY: rc.height / 2,
    furnaceWidth: rc.width * 0.6,
    furnaceHeight: rc.height * 0.6,
    liquidY: rc.height / 2 + rc.height * 0.1,
    mouthY: rc.height / 2 - rc.height * 0.15,
    mouthRadius: rc.width * 0.3
  };
}

function drawFurnaceBody(rc: RenderContext, state: FurnaceState): void {
  const { ctx, centerX, centerY, furnaceWidth, furnaceHeight } = rc;
  const shake = getShakeOffset(state);
  
  ctx.save();
  ctx.translate(shake.x, shake.y);
  
  const bodyGradient = ctx.createLinearGradient(
    centerX - furnaceWidth / 2, centerY,
    centerX + furnaceWidth / 2, centerY
  );
  bodyGradient.addColorStop(0, '#3E2723');
  bodyGradient.addColorStop(0.3, '#6B4226');
  bodyGradient.addColorStop(0.7, '#6B4226');
  bodyGradient.addColorStop(1, '#3E2723');
  
  ctx.beginPath();
  ctx.ellipse(centerX, centerY + furnaceHeight * 0.1, furnaceWidth / 2, furnaceHeight / 2, 0, 0, Math.PI * 2);
  ctx.fillStyle = bodyGradient;
  ctx.fill();
  
  ctx.strokeStyle = '#2D1F15';
  ctx.lineWidth = 4;
  ctx.stroke();
  
  const rimGradient = ctx.createRadialGradient(
    centerX, centerY - furnaceHeight * 0.15, 0,
    centerX, centerY - furnaceHeight * 0.15, furnaceWidth / 2
  );
  rimGradient.addColorStop(0, '#8B4513');
  rimGradient.addColorStop(0.7, '#6B4226');
  rimGradient.addColorStop(1, '#3E2723');
  
  ctx.beginPath();
  ctx.ellipse(centerX, centerY - furnaceHeight * 0.15, furnaceWidth / 2, furnaceHeight * 0.15, 0, 0, Math.PI * 2);
  ctx.fillStyle = rimGradient;
  ctx.fill();
  ctx.strokeStyle = '#2D1F15';
  ctx.lineWidth = 3;
  ctx.stroke();
  
  drawDecorativePatterns(ctx, centerX, centerY, furnaceWidth, furnaceHeight);
  
  drawEars(ctx, centerX, centerY, furnaceWidth, furnaceHeight);
  
  drawLegs(ctx, centerX, centerY, furnaceWidth, furnaceHeight);
  
  ctx.restore();
}

function drawDecorativePatterns(
  ctx: CanvasRenderingContext2D,
  centerX: number, centerY: number,
  furnaceWidth: number, furnaceHeight: number
): void {
  ctx.save();
  ctx.strokeStyle = '#5C7A4F';
  ctx.lineWidth = 2;
  
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const x1 = centerX + Math.cos(angle) * furnaceWidth * 0.3;
    const y1 = centerY + furnaceHeight * 0.1 + Math.sin(angle) * furnaceHeight * 0.25;
    const x2 = centerX + Math.cos(angle) * furnaceWidth * 0.4;
    const y2 = centerY + furnaceHeight * 0.1 + Math.sin(angle) * furnaceHeight * 0.35;
    
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(x2, y2, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#5C7A4F';
    ctx.fill();
  }
  
  ctx.beginPath();
  ctx.ellipse(centerX, centerY + furnaceHeight * 0.1, furnaceWidth * 0.35, furnaceHeight * 0.3, 0, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(92, 122, 79, 0.5)';
  ctx.lineWidth = 1;
  ctx.stroke();
  
  ctx.restore();
}

function drawEars(
  ctx: CanvasRenderingContext2D,
  centerX: number, centerY: number,
  furnaceWidth: number, furnaceHeight: number
): void {
  const earY = centerY - furnaceHeight * 0.15;
  
  ctx.save();
  
  const earGradient = ctx.createLinearGradient(0, earY - 30, 0, earY + 30);
  earGradient.addColorStop(0, '#5C7A4F');
  earGradient.addColorStop(0.5, '#6B4226');
  earGradient.addColorStop(1, '#5C7A4F');
  
  [-1, 1].forEach(side => {
    const earX = centerX + side * (furnaceWidth / 2 + 20);
    
    ctx.beginPath();
    ctx.moveTo(earX - side * 15, earY - 25);
    ctx.quadraticCurveTo(earX - side * 40, earY, earX - side * 15, earY + 25);
    ctx.lineTo(earX + side * 15, earY + 25);
    ctx.quadraticCurveTo(earX + side * 40, earY, earX + side * 15, earY - 25);
    ctx.closePath();
    
    ctx.fillStyle = earGradient;
    ctx.fill();
    ctx.strokeStyle = '#2D1F15';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.beginPath();
    ctx.ellipse(earX, earY, 20, 15, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(30, 30, 30, 0.8)';
    ctx.fill();
  });
  
  ctx.restore();
}

function drawLegs(
  ctx: CanvasRenderingContext2D,
  centerX: number, centerY: number,
  furnaceWidth: number, furnaceHeight: number
): void {
  const legTopY = centerY + furnaceHeight * 0.4;
  const legBottomY = centerY + furnaceHeight * 0.55;
  
  ctx.save();
  
  const legGradient = ctx.createLinearGradient(0, legTopY, 0, legBottomY);
  legGradient.addColorStop(0, '#6B4226');
  legGradient.addColorStop(0.5, '#5C7A4F');
  legGradient.addColorStop(1, '#3E2723');
  
  const legPositions = [-furnaceWidth * 0.25, 0, furnaceWidth * 0.25];
  
  legPositions.forEach(offset => {
    const legX = centerX + offset;
    
    ctx.beginPath();
    ctx.moveTo(legX - 15, legTopY);
    ctx.lineTo(legX - 20, legBottomY - 10);
    ctx.lineTo(legX - 10, legBottomY);
    ctx.lineTo(legX + 10, legBottomY);
    ctx.lineTo(legX + 20, legBottomY - 10);
    ctx.lineTo(legX + 15, legTopY);
    ctx.closePath();
    
    ctx.fillStyle = legGradient;
    ctx.fill();
    ctx.strokeStyle = '#2D1F15';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(legX - 12, legTopY + 15);
    ctx.lineTo(legX + 12, legTopY + 15);
    ctx.strokeStyle = '#5C7A4F';
    ctx.lineWidth = 3;
    ctx.stroke();
  });
  
  ctx.restore();
}

function drawFurnaceInterior(rc: RenderContext, state: FurnaceState): void {
  const { ctx, centerX, furnaceWidth, centerY, furnaceHeight } = rc;
  const shake = getShakeOffset(state);
  
  ctx.save();
  ctx.translate(shake.x, shake.y);
  
  const mouthY = centerY - furnaceHeight * 0.15;
  const liquidY = centerY + furnaceHeight * 0.1;
  
  ctx.beginPath();
  ctx.ellipse(centerX, mouthY, furnaceWidth / 2 - 10, furnaceHeight * 0.12, 0, 0, Math.PI * 2);
  const interiorGradient = ctx.createRadialGradient(
    centerX, mouthY, 0,
    centerX, mouthY, furnaceWidth / 2
  );
  interiorGradient.addColorStop(0, '#1A0A00');
  interiorGradient.addColorStop(0.5, '#2D1810');
  interiorGradient.addColorStop(1, '#1A0A00');
  ctx.fillStyle = interiorGradient;
  ctx.fill();
  
  drawLiquid(ctx, centerX, liquidY, furnaceWidth, state.liquidColor);
  
  ctx.restore();
}

function drawLiquid(
  ctx: CanvasRenderingContext2D,
  centerX: number, liquidY: number,
  furnaceWidth: number, color: string
): void {
  ctx.save();
  
  const liquidGradient = ctx.createRadialGradient(
    centerX, liquidY, 0,
    centerX, liquidY, furnaceWidth * 0.4
  );
  liquidGradient.addColorStop(0, lightenColor(color, 30));
  liquidGradient.addColorStop(0.5, color);
  liquidGradient.addColorStop(1, darkenColor(color, 30));
  
  ctx.beginPath();
  ctx.ellipse(centerX, liquidY, furnaceWidth * 0.4, furnaceWidth * 0.12, 0, 0, Math.PI * 2);
  ctx.fillStyle = liquidGradient;
  ctx.fill();
  
  ctx.beginPath();
  ctx.ellipse(centerX, liquidY - 3, furnaceWidth * 0.35, furnaceWidth * 0.08, 0, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(255, 255, 255, 0.2)`;
  ctx.fill();
  
  ctx.restore();
}

function drawFlameParticles(rc: RenderContext, state: FurnaceState): void {
  const { ctx, centerX, furnaceWidth, centerY, furnaceHeight } = rc;
  const shake = getShakeOffset(state);
  
  ctx.save();
  ctx.translate(shake.x, shake.y);
  
  const mouthY = centerY - furnaceHeight * 0.15;
  
  state.flameParticles.forEach(p => {
    ctx.save();
    ctx.globalAlpha = p.alpha;
    
    const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
    gradient.addColorStop(0, p.color);
    gradient.addColorStop(0.5, adjustColorAlpha(p.color, 0.7));
    gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
    
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    
    ctx.restore();
  });
  
  if (state.temperature > 200) {
    const glowIntensity = Math.min(state.temperature / 600, 1);
    const glowGradient = ctx.createRadialGradient(
      centerX, mouthY, 0,
      centerX, mouthY, furnaceWidth * 0.5
    );
    glowGradient.addColorStop(0, `rgba(255, 100, 0, ${0.3 * glowIntensity})`);
    glowGradient.addColorStop(0.5, `rgba(255, 50, 0, ${0.15 * glowIntensity})`);
    glowGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
    
    ctx.globalCompositeOperation = 'lighter';
    ctx.beginPath();
    ctx.ellipse(centerX, mouthY, furnaceWidth * 0.5, furnaceWidth * 0.3, 0, 0, Math.PI * 2);
    ctx.fillStyle = glowGradient;
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }
  
  ctx.restore();
}

function drawBubbles(rc: RenderContext, state: FurnaceState): void {
  const { ctx, centerX, furnaceWidth, centerY, furnaceHeight } = rc;
  const shake = getShakeOffset(state);
  
  ctx.save();
  ctx.translate(shake.x, shake.y);
  
  const liquidY = centerY + furnaceHeight * 0.1;
  
  state.bubbles.forEach(b => {
    ctx.save();
    ctx.globalAlpha = b.alpha;
    
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    
    const gradient = ctx.createRadialGradient(
      b.x - b.radius * 0.3, b.y - b.radius * 0.3, 0,
      b.x, b.y, b.radius
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.5, `rgba(200, 200, 255, 0.3)`);
    gradient.addColorStop(1, `rgba(150, 150, 200, 0.1)`);
    
    ctx.fillStyle = gradient;
    ctx.fill();
    
    ctx.strokeStyle = `rgba(255, 255, 255, 0.5)`;
    ctx.lineWidth = 1;
    ctx.stroke();
    
    ctx.restore();
  });
  
  ctx.restore();
}

function drawRipples(rc: RenderContext, state: FurnaceState): void {
  const { rippleCtx, centerX, furnaceWidth, centerY, furnaceHeight } = rc;
  const shake = getShakeOffset(state);
  
  rippleCtx.clearRect(0, 0, rc.width, rc.height);
  rippleCtx.save();
  rippleCtx.translate(shake.x, shake.y);
  
  const liquidY = centerY + furnaceHeight * 0.1;
  
  state.ripples.forEach(r => {
    rippleCtx.save();
    rippleCtx.globalAlpha = r.alpha;
    
    rippleCtx.beginPath();
    rippleCtx.ellipse(r.x, liquidY, r.radius, r.radius * 0.3, 0, 0, Math.PI * 2);
    rippleCtx.strokeStyle = `rgba(255, 255, 255, 0.6)`;
    rippleCtx.lineWidth = r.lineWidth;
    rippleCtx.stroke();
    
    rippleCtx.restore();
  });
  
  rippleCtx.restore();
}

function drawThrownHerbs(rc: RenderContext, state: FurnaceState): void {
  const { ctx } = rc;
  const shake = getShakeOffset(state);
  
  ctx.save();
  ctx.translate(shake.x, shake.y);
  
  state.thrownHerbs.forEach(h => {
    if (!h.active) return;
    
    ctx.save();
    ctx.translate(h.x, h.y);
    ctx.rotate(h.rotation);
    
    const size = 30;
    
    ctx.beginPath();
    ctx.roundRect(-size / 2, -size / 3, size, size * 0.66, 4);
    
    const gradient = ctx.createLinearGradient(-size / 2, -size / 3, size / 2, size / 3);
    gradient.addColorStop(0, '#5D4037');
    gradient.addColorStop(1, '#4E342E');
    ctx.fillStyle = gradient;
    ctx.fill();
    
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 12px LiShu, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(h.herb.name, 0, 0);
    
    ctx.restore();
  });
  
  ctx.restore();
}

function drawFlash(rc: RenderContext, state: FurnaceState): void {
  const { ctx, centerX, centerY } = rc;
  
  if (state.flashIntensity > 0) {
    ctx.save();
    ctx.globalAlpha = state.flashIntensity * 0.5;
    
    const gradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, rc.width * 0.6
    );
    gradient.addColorStop(0, 'rgba(255, 200, 100, 0.8)');
    gradient.addColorStop(0.5, 'rgba(255, 150, 50, 0.4)');
    gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
    
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, rc.width, rc.height);
    
    ctx.restore();
  }
}

export function render(rc: RenderContext, state: FurnaceState): void {
  const { ctx, width, height } = rc;
  
  ctx.clearRect(0, 0, width, height);
  
  drawFurnaceInterior(rc, state);
  
  drawFlameParticles(rc, state);
  
  drawBubbles(rc, state);
  
  drawFurnaceBody(rc, state);
  
  drawThrownHerbs(rc, state);
  
  drawRipples(rc, state);
  
  drawFlash(rc, state);
}

export function drawManualChart(
  canvas: HTMLCanvasElement,
  tempHistory: { time: number; temp: number }[]
): void {
  const ctx = canvas.getContext('2d')!;
  const width = canvas.width;
  const height = canvas.height;
  
  ctx.clearRect(0, 0, width, height);
  
  ctx.fillStyle = 'rgba(255, 248, 220, 0.8)';
  ctx.fillRect(0, 0, width, height);
  
  ctx.strokeStyle = 'rgba(139, 69, 19, 0.3)';
  ctx.lineWidth = 1;
  
  for (let i = 0; i <= 4; i++) {
    const y = (height / 4) * i;
    ctx.beginPath();
    ctx.moveTo(30, y);
    ctx.lineTo(width - 10, y);
    ctx.stroke();
    
    const tempLabel = 1200 - (1200 / 4) * i;
    ctx.fillStyle = '#8B4513';
    ctx.font = '10px KaiTi, serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${tempLabel}°C`, 25, y + 3);
  }
  
  ctx.strokeStyle = 'rgba(139, 69, 19, 0.2)';
  for (let i = 0; i <= 5; i++) {
    const x = 30 + ((width - 40) / 5) * i;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  
  if (tempHistory.length < 2) {
    ctx.fillStyle = '#8B4513';
    ctx.font = '14px KaiTi, serif';
    ctx.textAlign = 'center';
    ctx.fillText('暂无炉温数据', width / 2, height / 2);
    return;
  }
  
  const startTime = tempHistory[0].time;
  const endTime = tempHistory[tempHistory.length - 1].time;
  const timeRange = Math.max(endTime - startTime, 1);
  
  ctx.beginPath();
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  
  tempHistory.forEach((point, i) => {
    const x = 30 + ((point.time - startTime) / timeRange) * (width - 40);
    const y = height - ((point.temp / 1200) * height) - 5;
    
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  
  ctx.stroke();
  
  ctx.beginPath();
  const optimalY1 = height - ((600 / 1200) * height) - 5;
  const optimalY2 = height - ((900 / 1200) * height) - 5;
  ctx.fillStyle = 'rgba(255, 215, 0, 0.1)';
  ctx.fillRect(30, optimalY2, width - 40, optimalY1 - optimalY2);
  
  ctx.fillStyle = '#FFD700';
  ctx.font = '10px KaiTi, serif';
  ctx.textAlign = 'left';
  ctx.fillText('← 最佳区间 (600-900°C)', 35, optimalY2 - 5);
}

function lightenColor(color: string, percent: number): string {
  const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!match) return color;
  
  const r = Math.min(255, parseInt(match[1]) + percent);
  const g = Math.min(255, parseInt(match[2]) + percent);
  const b = Math.min(255, parseInt(match[3]) + percent);
  
  return `rgb(${r}, ${g}, ${b})`;
}

function darkenColor(color: string, percent: number): string {
  const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!match) return color;
  
  const r = Math.max(0, parseInt(match[1]) - percent);
  const g = Math.max(0, parseInt(match[2]) - percent);
  const b = Math.max(0, parseInt(match[3]) - percent);
  
  return `rgb(${r}, ${g}, ${b})`;
}

function adjustColorAlpha(color: string, alpha: number): string {
  const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!match) return color;
  
  const r = parseInt(match[1]);
  const g = parseInt(match[2]);
  const b = parseInt(match[3]);
  
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
