import {
  PotState,
  Flame,
  Particle,
  CutPiece,
  Ingredient,
  COLORS
} from './types';
import { mixColor } from './knife';

const CANVAS_W = 600;
const CANVAS_H = 400;
const POT_CX = 300;
const POT_CY = 250;
const POT_R = 150;

export function createPot(): PotState {
  return {
    x: POT_CX,
    y: POT_CY,
    radius: POT_R,
    cooking: false,
    stirAngle: 0,
    stirDirection: 1
  };
}

export function createFlames(): Flame[] {
  const flames: Flame[] = [];
  const count = 7;
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    flames.push({
      x: POT_CX - 100 + t * 200,
      baseY: POT_CY + POT_R - 5,
      height: 30,
      phase: Math.random() * Math.PI * 2,
      speed: 2 + Math.random() * 2,
      width: 16 + Math.random() * 10
    });
  }
  return flames;
}

export function drawStove(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  const bgGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
  bgGrad.addColorStop(0, COLORS.wallCream);
  bgGrad.addColorStop(1, '#E8D8A8');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  ctx.fillStyle = COLORS.brickGray;
  ctx.fillRect(40, POT_CY + 10, CANVAS_W - 80, CANVAS_H - POT_CY - 10);

  const brickGrad = ctx.createLinearGradient(40, POT_CY + 10, 40, CANVAS_H);
  brickGrad.addColorStop(0, 'rgba(255,255,255,0.1)');
  brickGrad.addColorStop(1, 'rgba(0,0,0,0.15)');
  ctx.fillStyle = brickGrad;
  ctx.fillRect(40, POT_CY + 10, CANVAS_W - 80, CANVAS_H - POT_CY - 10);

  ctx.strokeStyle = 'rgba(47,47,47,0.4)';
  ctx.lineWidth = 1;
  for (let row = 0; row < 5; row++) {
    const yy = POT_CY + 20 + row * 28;
    ctx.beginPath();
    ctx.moveTo(40, yy);
    ctx.lineTo(CANVAS_W - 40, yy);
    ctx.stroke();
    const offset = row % 2 === 0 ? 0 : 30;
    for (let col = 0; col < 10; col++) {
      const xx = 40 + offset + col * 60;
      if (xx < CANVAS_W - 40) {
        ctx.beginPath();
        ctx.moveTo(xx, yy);
        ctx.lineTo(xx, yy + 28);
        ctx.stroke();
      }
    }
  }

  ctx.fillStyle = '#2A2A2A';
  ctx.beginPath();
  ctx.ellipse(POT_CX, POT_CY + POT_R - 12, POT_R - 30, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawPot(ctx: CanvasRenderingContext2D, pot: PotState): void {
  ctx.save();

  ctx.shadowColor = 'rgba(47,47,47,0.5)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 6;

  const bodyGrad = ctx.createRadialGradient(POT_CX, POT_CY - 20, 10, POT_CX, POT_CY, POT_R + 20);
  bodyGrad.addColorStop(0, '#5A5A5A');
  bodyGrad.addColorStop(0.5, COLORS.potDark);
  bodyGrad.addColorStop(1, '#1A1A1A');

  ctx.beginPath();
  ctx.ellipse(POT_CX, POT_CY, POT_R, POT_R * 0.55, 0, 0, Math.PI * 2);
  ctx.fillStyle = bodyGrad;
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.beginPath();
  ctx.ellipse(POT_CX, POT_CY - 8, POT_R - 10, (POT_R - 10) * 0.45, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#111';
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(POT_CX, POT_CY - 10, POT_R - 18, (POT_R - 18) * 0.4, 0, 0, Math.PI * 2);
  const oilGrad = ctx.createRadialGradient(POT_CX - 30, POT_CY - 20, 5, POT_CX, POT_CY, POT_R);
  oilGrad.addColorStop(0, 'rgba(255,200,100,0.3)');
  oilGrad.addColorStop(0.5, 'rgba(180,100,40,0.2)');
  oilGrad.addColorStop(1, 'rgba(60,30,10,0.35)');
  ctx.fillStyle = oilGrad;
  ctx.fill();

  ctx.strokeStyle = '#1A1A1A';
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.ellipse(POT_CX, POT_CY, POT_R, POT_R * 0.55, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(POT_CX, POT_CY - 8, POT_R - 5, (POT_R - 5) * 0.5, 0, 0, Math.PI);
  ctx.strokeStyle = '#4A4A4A';
  ctx.lineWidth = 2;
  ctx.stroke();

  const hlGrad = ctx.createLinearGradient(POT_CX - POT_R, POT_CY - 10, POT_CX + POT_R, POT_CY - 10);
  hlGrad.addColorStop(0, 'rgba(255,255,255,0)');
  hlGrad.addColorStop(0.3, 'rgba(255,255,255,0.15)');
  hlGrad.addColorStop(0.7, 'rgba(255,255,255,0.15)');
  hlGrad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = hlGrad;
  ctx.fillRect(POT_CX - POT_R, POT_CY - 14, POT_R * 2, 3);

  ctx.restore();
}

export function drawFlames(ctx: CanvasRenderingContext2D, flames: Flame[], time: number): void {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  flames.forEach((f) => {
    const wobble = Math.sin(time * f.speed + f.phase) * 6;
    const h = f.height * (0.7 + Math.sin(time * f.speed * 1.3 + f.phase) * 0.3);
    const grad = ctx.createLinearGradient(f.x, f.baseY, f.x + wobble, f.baseY - h);
    grad.addColorStop(0, COLORS.flameRed);
    grad.addColorStop(0.4, '#FF6600');
    grad.addColorStop(0.75, COLORS.flameOrange);
    grad.addColorStop(1, 'rgba(255,220,100,0)');

    ctx.beginPath();
    ctx.moveTo(f.x - f.width / 2, f.baseY);
    ctx.quadraticCurveTo(f.x - f.width / 2 + wobble, f.baseY - h * 0.5, f.x + wobble, f.baseY - h);
    ctx.quadraticCurveTo(f.x + f.width / 2 + wobble, f.baseY - h * 0.5, f.x + f.width / 2, f.baseY);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(f.x - f.width / 4, f.baseY);
    ctx.quadraticCurveTo(f.x - f.width / 4 + wobble * 0.5, f.baseY - h * 0.6, f.x + wobble * 0.5, f.baseY - h * 0.85);
    ctx.quadraticCurveTo(f.x + f.width / 4 + wobble * 0.5, f.baseY - h * 0.6, f.x + f.width / 4, f.baseY);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,255,180,0.5)';
    ctx.fill();
  });
  ctx.restore();
}

export function drawPotContents(
  ctx: CanvasRenderingContext2D,
  ingredients: Ingredient[],
  pot: PotState,
  time: number
): void {
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(POT_CX, POT_CY - 10, POT_R - 22, (POT_R - 22) * 0.4, 0, 0, Math.PI * 2);
  ctx.clip();

  ingredients.forEach((ing) => {
    ing.cutPieces.forEach((piece) => {
      if (!piece.inPot) return;
      const wobbleX = Math.sin(time * 2 + piece.potX) * 3;
      const wobbleY = Math.cos(time * 2.2 + piece.potY) * 2;
      const px = POT_CX + piece.potX + wobbleX;
      const py = POT_CY - 10 + piece.potY + wobbleY;

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(piece.textureAngle * 0.1 + time * 0.3);
      const color = mixColor(ing.baseColor, ing.cookedColor, piece.cookingProgress);
      ctx.fillStyle = color;
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 2;
      ctx.beginPath();
      if (piece.width > 3 && piece.height > 3) {
        ctx.roundRect(-piece.width / 2, -piece.height / 2, piece.width, piece.height, 1);
      } else {
        ctx.ellipse(0, 0, piece.width / 2, piece.height / 2, 0, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.restore();
    });
  });

  ctx.restore();
}

export function drawSpatula(ctx: CanvasRenderingContext2D, pot: PotState, time: number): void {
  if (!pot.cooking) return;
  ctx.save();
  const cycleT = (time % 1.5) / 1.5;
  const angle = Math.sin(cycleT * Math.PI * 2) * 0.9;
  const cx = POT_CX;
  const cy = POT_CY - 10;

  ctx.translate(cx, cy);
  ctx.rotate(angle);

  ctx.strokeStyle = '#4A4A4A';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(110, -30);
  ctx.stroke();

  ctx.save();
  ctx.translate(110, -30);
  ctx.rotate(-0.3);
  ctx.fillStyle = '#C0C0C0';
  ctx.beginPath();
  ctx.moveTo(-12, -4);
  ctx.lineTo(14, -10);
  ctx.lineTo(22, 0);
  ctx.lineTo(14, 10);
  ctx.lineTo(-12, 4);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#8A8A8A';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  ctx.strokeStyle = '#6B3410';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-10, 5);
  ctx.lineTo(-60, 20);
  ctx.stroke();

  ctx.restore();
}

export function drawSteam(ctx: CanvasRenderingContext2D, particles: Particle[]): void {
  ctx.save();
  particles.forEach((p) => {
    const alpha = (p.life / p.maxLife) * 0.5;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.fill();
  });
  ctx.restore();
}

export function emitSteam(particles: Particle[]): void {
  if (particles.length > 120) return;
  for (let i = 0; i < 2; i++) {
    particles.push({
      x: POT_CX + (Math.random() - 0.5) * (POT_R * 1.2),
      y: POT_CY - 40 - Math.random() * 10,
      vx: (Math.random() - 0.5) * 25,
      vy: -40 - Math.random() * 20,
      life: 2.0,
      maxLife: 2.0,
      size: 3 + Math.random() * 3,
      color: 'rgba(255,255,255,0.5)'
    });
  }
}

export function updateParticles(particles: Particle[], dt: number): void {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.vr !== undefined) p.rotation = (p.rotation || 0) + p.vr * dt;
    p.life -= dt;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

export function isInsidePot(x: number, y: number): boolean {
  const dx = x - POT_CX;
  const dy = (y - (POT_CY - 10)) / 0.5;
  return dx * dx + dy * dy < (POT_R - 20) * (POT_R - 20);
}

export function placeInPot(piece: CutPiece): void {
  const angle = Math.random() * Math.PI * 2;
  const r = Math.random() * (POT_R - 40);
  piece.potX = Math.cos(angle) * r;
  piece.potY = Math.sin(angle) * r * 0.45;
  piece.inPot = true;
}

export function updateCooking(ingredients: Ingredient[], dt: number, pot: PotState): void {
  if (!pot.cooking) return;
  ingredients.forEach((ing) => {
    ing.cutPieces.forEach((piece) => {
      if (piece.inPot && piece.cookingProgress < 1) {
        piece.cookingProgress = Math.min(1, piece.cookingProgress + dt * 0.25);
      }
    });
  });
}

export const POT = { CX: POT_CX, CY: POT_CY, R: POT_R, W: CANVAS_W, H: CANVAS_H };
