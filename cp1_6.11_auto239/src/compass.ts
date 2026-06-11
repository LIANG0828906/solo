import { twentyFourMountains, eightTrigrams, getMountainByAngle, getTrigramByAngle } from './stars';

export interface CompassState {
  rotation: number;
  targetRotation: number;
  angularVelocity: number;
  isDragging: boolean;
  highlightedAngle: number | null;
  taijiRotation: number;
}

export interface RippleEffect {
  x: number;
  y: number;
  startTime: number;
  duration: number;
}

const CANVAS_CENTER = 300;
const COMPASS_RADIUS = 225;
const DAMPING = 0.9;

export function createCompassState(): CompassState {
  return {
    rotation: 0,
    targetRotation: 0,
    angularVelocity: 0,
    isDragging: false,
    highlightedAngle: null,
    taijiRotation: 0
  };
}

export function updateCompassPhysics(state: CompassState, deltaTime: number): void {
  if (!state.isDragging) {
    state.angularVelocity *= DAMPING;
    state.rotation += state.angularVelocity * deltaTime * 60;
  }
  
  state.taijiRotation += deltaTime * 0.2;
  
  if (state.rotation >= 360) state.rotation -= 360;
  if (state.rotation < 0) state.rotation += 360;
}

export function getAngleFromPoint(px: number, py: number): number {
  const dx = px - CANVAS_CENTER;
  const dy = py - CANVAS_CENTER;
  let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
  if (angle < 0) angle += 360;
  return angle;
}

export function isPointInCompass(px: number, py: number): boolean {
  const dx = px - CANVAS_CENTER;
  const dy = py - CANVAS_CENTER;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance <= COMPASS_RADIUS;
}

export function getCurrentMountain(state: CompassState): typeof twentyFourMountains[0] | null {
  return getMountainByAngle(state.rotation);
}

export function getCurrentTrigram(state: CompassState): typeof eightTrigrams[0] | null {
  return getTrigramByAngle(state.rotation);
}

export function drawCompass(
  ctx: CanvasRenderingContext2D,
  state: CompassState,
  time: number
): void {
  ctx.clearRect(0, 0, 600, 600);
  
  drawBackgroundStars(ctx, time);
  
  ctx.save();
  ctx.translate(CANVAS_CENTER, CANVAS_CENTER);
  ctx.rotate(state.rotation * Math.PI / 180);
  
  drawOuterRing(ctx);
  drawSixtyJiaziScale(ctx);
  drawTwentyFourMountains(ctx, state);
  drawEightTrigrams(ctx, state);
  drawTaiji(ctx, state.taijiRotation);
  
  ctx.restore();
  
  drawCompassFrame(ctx);
}

function drawBackgroundStars(ctx: CanvasRenderingContext2D, time: number): void {
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    const seed = i * 12345.6789;
    const x = ((Math.sin(seed) * 0.5 + 0.5) * 600);
    const y = ((Math.cos(seed * 1.3) * 0.5 + 0.5) * 600);
    const size = (Math.sin(seed * 2.1) * 0.5 + 0.5) * 2 + 0.5;
    const twinkle = Math.sin(time * 0.002 + seed) * 0.3 + 0.7;
    
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${twinkle * 0.6})`;
    ctx.fill();
  }
}

function drawOuterRing(ctx: CanvasRenderingContext2D): void {
  const gradient = ctx.createRadialGradient(0, 0, COMPASS_RADIUS - 20, 0, 0, COMPASS_RADIUS + 10);
  gradient.addColorStop(0, '#8B7355');
  gradient.addColorStop(0.5, '#A0826D');
  gradient.addColorStop(1, '#6B5344');
  
  ctx.beginPath();
  ctx.arc(0, 0, COMPASS_RADIUS + 5, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();
  
  ctx.beginPath();
  ctx.arc(0, 0, COMPASS_RADIUS - 2, 0, Math.PI * 2);
  ctx.fillStyle = '#0A0E27';
  ctx.fill();
  
  const innerGradient = ctx.createRadialGradient(0, 0, 50, 0, 0, COMPASS_RADIUS - 5);
  innerGradient.addColorStop(0, '#1A1525');
  innerGradient.addColorStop(0.7, '#0F0D1A');
  innerGradient.addColorStop(1, '#1A1525');
  
  ctx.beginPath();
  ctx.arc(0, 0, COMPASS_RADIUS - 5, 0, Math.PI * 2);
  ctx.fillStyle = innerGradient;
  ctx.fill();
}

function drawSixtyJiaziScale(ctx: CanvasRenderingContext2D): void {
  const outerRadius = COMPASS_RADIUS - 8;
  const innerRadius = COMPASS_RADIUS - 20;
  
  for (let i = 0; i < 60; i++) {
    const angle = (i * 6 - 90) * Math.PI / 180;
    const isMajor = i % 5 === 0;
    
    const x1 = Math.cos(angle) * outerRadius;
    const y1 = Math.sin(angle) * outerRadius;
    const x2 = Math.cos(angle) * (isMajor ? innerRadius : innerRadius + 8);
    const y2 = Math.sin(angle) * (isMajor ? innerRadius : innerRadius + 8);
    
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = isMajor ? 1.5 : 0.8;
    ctx.stroke();
  }
  
  for (let i = 0; i < 360; i += 10) {
    const angle = (i - 90) * Math.PI / 180;
    const x = Math.cos(angle) * (outerRadius + 8);
    const y = Math.sin(angle) * (outerRadius + 8);
    
    ctx.font = '10px "STKaiti", "KaiTi", serif';
    ctx.fillStyle = '#D4AF37';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle + Math.PI / 2);
    ctx.fillText(i.toString(), 0, 0);
    ctx.restore();
  }
}

function drawTwentyFourMountains(
  ctx: CanvasRenderingContext2D,
  state: CompassState
): void {
  const outerRadius = COMPASS_RADIUS - 30;
  const innerRadius = COMPASS_RADIUS - 70;
  
  ctx.beginPath();
  ctx.arc(0, 0, outerRadius + 2, 0, Math.PI * 2);
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 1;
  ctx.stroke();
  
  ctx.beginPath();
  ctx.arc(0, 0, innerRadius - 2, 0, Math.PI * 2);
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 1;
  ctx.stroke();
  
  for (const mountain of twentyFourMountains) {
    const angle = (mountain.angle - 90) * Math.PI / 180;
    const isHighlighted = state.highlightedAngle !== null && 
      Math.abs(((mountain.angle - state.rotation + 360) % 360)) < 15;
    
    if (isHighlighted) {
      const highlightGradient = ctx.createRadialGradient(
        Math.cos(angle) * (outerRadius + innerRadius) / 2,
        Math.sin(angle) * (outerRadius + innerRadius) / 2,
        0,
        Math.cos(angle) * (outerRadius + innerRadius) / 2,
        Math.sin(angle) * (outerRadius + innerRadius) / 2,
        20
      );
      highlightGradient.addColorStop(0, 'rgba(255, 215, 0, 0.6)');
      highlightGradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
      
      ctx.beginPath();
      ctx.arc(
        Math.cos(angle) * (outerRadius + innerRadius) / 2,
        Math.sin(angle) * (outerRadius + innerRadius) / 2,
        20,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = highlightGradient;
      ctx.fill();
    }
    
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * innerRadius, Math.sin(angle) * innerRadius);
    ctx.lineTo(Math.cos(angle) * outerRadius, Math.sin(angle) * outerRadius);
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)';
    ctx.lineWidth = 0.5;
    ctx.stroke();
    
    const textX = Math.cos(angle) * (outerRadius + innerRadius) / 2;
    const textY = Math.sin(angle) * (outerRadius + innerRadius) / 2;
    
    ctx.save();
    ctx.translate(textX, textY);
    ctx.rotate(angle + Math.PI / 2);
    
    ctx.font = 'bold 16px "STKaiti", "KaiTi", "楷体", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    if (isHighlighted) {
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 15;
    }
    
    const elementColors: Record<string, string> = {
      '水': '#4A90D9',
      '木': '#4CAF50',
      '火': '#E53935',
      '金': '#FFD700',
      '土': '#8D6E63'
    };
    
    ctx.fillStyle = elementColors[mountain.element] || '#FFFFFF';
    ctx.fillText(mountain.name, 0, 0);
    
    ctx.shadowBlur = 0;
    ctx.restore();
  }
}

function drawEightTrigrams(
  ctx: CanvasRenderingContext2D,
  state: CompassState
): void {
  const outerRadius = COMPASS_RADIUS - 80;
  const innerRadius = COMPASS_RADIUS - 140;
  
  ctx.beginPath();
  ctx.arc(0, 0, outerRadius + 2, 0, Math.PI * 2);
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 1;
  ctx.stroke();
  
  ctx.beginPath();
  ctx.arc(0, 0, innerRadius - 2, 0, Math.PI * 2);
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 1;
  ctx.stroke();
  
  for (const trigram of eightTrigrams) {
    const angle = (trigram.angle - 90) * Math.PI / 180;
    const centerX = Math.cos(angle) * (outerRadius + innerRadius) / 2;
    const centerY = Math.sin(angle) * (outerRadius + innerRadius) / 2;
    
    const isHighlighted = state.highlightedAngle !== null &&
      Math.abs(((trigram.angle - state.rotation + 360) % 360)) < 30;
    
    if (isHighlighted) {
      const highlightGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 25);
      highlightGradient.addColorStop(0, 'rgba(255, 215, 0, 0.5)');
      highlightGradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, 25, 0, Math.PI * 2);
      ctx.fillStyle = highlightGradient;
      ctx.fill();
    }
    
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(angle + Math.PI / 2);
    
    const lineWidth = 20;
    const lineHeight = 3;
    const lineGap = 4;
    
    for (let i = 0; i < 3; i++) {
      const yOffset = (i - 1) * (lineHeight + lineGap);
      
      if (trigram.lines[i] === 1) {
        ctx.fillStyle = isHighlighted ? '#FFD700' : '#FFFFFF';
        ctx.fillRect(-lineWidth / 2, yOffset - lineHeight / 2, lineWidth, lineHeight);
      } else {
        ctx.fillStyle = isHighlighted ? '#FFD700' : '#FFFFFF';
        ctx.fillRect(-lineWidth / 2, yOffset - lineHeight / 2, lineWidth * 0.4, lineHeight);
        ctx.fillRect(lineWidth * 0.1, yOffset - lineHeight / 2, lineWidth * 0.4, lineHeight);
      }
    }
    
    ctx.font = '11px "STKaiti", "KaiTi", serif';
    ctx.fillStyle = '#D4AF37';
    ctx.textAlign = 'center';
    ctx.fillText(trigram.name, 0, lineHeight * 2 + lineGap * 2);
    
    ctx.restore();
  }
}

function drawTaiji(ctx: CanvasRenderingContext2D, rotation: number): void {
  const radius = 60;
  
  ctx.save();
  ctx.rotate(rotation);
  
  const gradient = ctx.createRadialGradient(0, 0, radius * 0.8, 0, 0, radius + 5);
  gradient.addColorStop(0, 'rgba(212, 175, 55, 0.3)');
  gradient.addColorStop(1, 'rgba(212, 175, 55, 0)');
  
  ctx.beginPath();
  ctx.arc(0, 0, radius + 5, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();
  
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  
  ctx.beginPath();
  ctx.arc(0, 0, radius, -Math.PI / 2, Math.PI / 2);
  ctx.fillStyle = '#000000';
  ctx.fill();
  
  ctx.beginPath();
  ctx.arc(0, -radius / 2, radius / 2, 0, Math.PI * 2);
  ctx.fillStyle = '#000000';
  ctx.fill();
  
  ctx.beginPath();
  ctx.arc(0, radius / 2, radius / 2, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  
  ctx.beginPath();
  ctx.arc(0, -radius / 2, radius / 6, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  
  ctx.beginPath();
  ctx.arc(0, radius / 2, radius / 6, 0, Math.PI * 2);
  ctx.fillStyle = '#000000';
  ctx.fill();
  
  ctx.beginPath();
  ctx.arc(0, 0, radius + 2, 0, Math.PI * 2);
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 2;
  ctx.stroke();
  
  ctx.restore();
}

function drawCompassFrame(ctx: CanvasRenderingContext2D): void {
  const outerGradient = ctx.createRadialGradient(
    CANVAS_CENTER, CANVAS_CENTER, COMPASS_RADIUS + 10,
    CANVAS_CENTER, CANVAS_CENTER, COMPASS_RADIUS + 30
  );
  outerGradient.addColorStop(0, 'rgba(212, 175, 55, 0.3)');
  outerGradient.addColorStop(0.5, 'rgba(139, 115, 85, 0.5)');
  outerGradient.addColorStop(1, 'rgba(139, 115, 85, 0)');
  
  ctx.beginPath();
  ctx.arc(CANVAS_CENTER, CANVAS_CENTER, COMPASS_RADIUS + 30, 0, Math.PI * 2);
  ctx.fillStyle = outerGradient;
  ctx.fill();
  
  ctx.beginPath();
  ctx.arc(CANVAS_CENTER, CANVAS_CENTER, COMPASS_RADIUS + 8, 0, Math.PI * 2);
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 3;
  ctx.stroke();
  
  ctx.beginPath();
  ctx.arc(CANVAS_CENTER, CANVAS_CENTER, COMPASS_RADIUS + 12, 0, Math.PI * 2);
  ctx.strokeStyle = '#8B7355';
  ctx.lineWidth = 2;
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(CANVAS_CENTER, CANVAS_CENTER - COMPASS_RADIUS - 25);
  ctx.lineTo(CANVAS_CENTER - 8, CANVAS_CENTER - COMPASS_RADIUS - 10);
  ctx.lineTo(CANVAS_CENTER + 8, CANVAS_CENTER - COMPASS_RADIUS - 10);
  ctx.closePath();
  ctx.fillStyle = '#FF4444';
  ctx.fill();
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 1;
  ctx.stroke();
}

export function drawRipple(
  ctx: CanvasRenderingContext2D,
  ripple: RippleEffect,
  currentTime: number
): void {
  const elapsed = currentTime - ripple.startTime;
  const progress = elapsed / ripple.duration;
  
  if (progress >= 1) return;
  
  const radius = 10 + progress * 30;
  const opacity = 1 - progress;
  
  ctx.beginPath();
  ctx.arc(ripple.x, ripple.y, radius, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(255, 215, 0, ${opacity})`;
  ctx.lineWidth = 2;
  ctx.stroke();
}
