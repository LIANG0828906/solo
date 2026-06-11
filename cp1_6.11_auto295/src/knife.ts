import {
  KnifeState,
  Ingredient,
  CutPiece,
  Vec2,
  Particle,
  COLORS,
  IngredientType
} from './types';

const CANVAS_W = 600;
const CANVAS_H = 400;
const BOARD_CX = 300;
const BOARD_CY = 220;
const BOARD_R = 170;

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function createKnife(): KnifeState {
  return {
    x: 120,
    y: 90,
    width: 130,
    height: 36,
    angle: -0.25,
    dragging: false,
    flashTimer: 0,
    cutting: false,
    cutStart: null,
    cutEnd: null
  };
}

export function drawBoard(ctx: CanvasRenderingContext2D): void {
  ctx.save();

  const bgGrad = ctx.createRadialGradient(BOARD_CX, BOARD_CY, 20, BOARD_CX, BOARD_CY, BOARD_R + 20);
  bgGrad.addColorStop(0, COLORS.wallCream);
  bgGrad.addColorStop(1, '#F0E0B8');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  ctx.shadowColor = 'rgba(47,47,47,0.35)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 6;

  ctx.beginPath();
  ctx.arc(BOARD_CX, BOARD_CY, BOARD_R, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.boardYellow;
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.strokeStyle = 'rgba(139, 115, 85, 0.55)';
  ctx.lineWidth = 1.2;
  for (let i = 1; i <= 8; i++) {
    ctx.beginPath();
    ctx.arc(BOARD_CX, BOARD_CY, BOARD_R - i * 18, 0, Math.PI * 2);
    ctx.globalAlpha = 0.35 - i * 0.03;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  ctx.beginPath();
  ctx.arc(BOARD_CX, BOARD_CY, BOARD_R, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(93, 58, 26, 0.85)';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(BOARD_CX, BOARD_CY, BOARD_R - 6, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(139, 115, 85, 0.6)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();
}

export function drawKnife(ctx: CanvasRenderingContext2D, knife: KnifeState): void {
  ctx.save();
  ctx.translate(knife.x, knife.y);
  ctx.rotate(knife.angle);

  const w = knife.width;
  const h = knife.height;

  if (knife.flashTimer > 0) {
    ctx.shadowColor = 'rgba(255,255,255,0.9)';
    ctx.shadowBlur = 20;
  }

  const bladeGrad = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
  if (knife.flashTimer > 0) {
    const t = knife.flashTimer / 0.2;
    bladeGrad.addColorStop(0, '#FFFFFF');
    bladeGrad.addColorStop(0.3, `rgba(240,240,255,${0.6 + t * 0.4})`);
    bladeGrad.addColorStop(0.6, COLORS.knifeSilver);
    bladeGrad.addColorStop(1, '#8A8A8A');
  } else {
    bladeGrad.addColorStop(0, '#F0F0F0');
    bladeGrad.addColorStop(0.4, COLORS.knifeSilver);
    bladeGrad.addColorStop(1, '#7F7F7F');
  }

  ctx.beginPath();
  ctx.moveTo(0, -h / 2);
  ctx.lineTo(w - 40, -h / 2 + 2);
  ctx.quadraticCurveTo(w - 15, -h / 2 + 4, w - 10, 0);
  ctx.quadraticCurveTo(w - 15, h / 2 - 4, w - 40, h / 2 - 2);
  ctx.lineTo(0, h / 2);
  ctx.closePath();
  ctx.fillStyle = bladeGrad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(47,47,47,0.6)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, -h / 2 + 2);
  ctx.lineTo(w - 30, -h / 2 + 4);
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.shadowBlur = 0;

  const handleGrad = ctx.createLinearGradient(-40, 0, 0, 0);
  handleGrad.addColorStop(0, '#5C1A00');
  handleGrad.addColorStop(0.5, COLORS.handleRed);
  handleGrad.addColorStop(1, '#A53200');
  ctx.fillStyle = handleGrad;
  ctx.beginPath();
  ctx.roundRect(-40, -h / 2 + 3, 42, h - 6, 4);
  ctx.fill();
  ctx.strokeStyle = 'rgba(47,47,47,0.5)';
  ctx.lineWidth = 1;
  ctx.stroke();

  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(-30 + i * 12, 0, 2, 0, Math.PI * 2);
    ctx.fillStyle = '#FFD700';
    ctx.fill();
    ctx.strokeStyle = 'rgba(47,47,47,0.4)';
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }

  ctx.restore();
}

export function drawIngredient(ctx: CanvasRenderingContext2D, ing: Ingredient): void {
  if (ing.cutPieces.length > 0) {
    drawCutPieces(ctx, ing);
    return;
  }
  ctx.save();
  ctx.translate(ing.x, ing.y);
  ctx.shadowColor = 'rgba(47,47,47,0.3)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 2;

  const grad = ctx.createRadialGradient(-ing.width * 0.2, -ing.height * 0.25, 4, 0, 0, Math.max(ing.width, ing.height) * 0.7);
  grad.addColorStop(0, lightenColor(ing.baseColor, 25));
  grad.addColorStop(0.7, ing.baseColor);
  grad.addColorStop(1, darkenColor(ing.baseColor, 20));
  ctx.fillStyle = grad;

  switch (ing.originalShape) {
    case 'round':
      ctx.beginPath();
      ctx.ellipse(0, 0, ing.width / 2, ing.height / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'oval':
      ctx.beginPath();
      ctx.ellipse(0, 0, ing.width / 2, ing.height / 2.2, 0, 0, Math.PI * 2);
      ctx.fill();
      if (ing.type === 'fish') {
        ctx.save();
        ctx.translate(ing.width / 2 - 4, 0);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(14, -ing.height / 2.8);
        ctx.lineTo(14, ing.height / 2.8);
        ctx.closePath();
        ctx.fillStyle = darkenColor(ing.baseColor, 10);
        ctx.fill();
        ctx.restore();
        for (let i = -3; i <= 3; i++) {
          ctx.beginPath();
          ctx.arc(i * 8, 0, 1.5, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(180,180,180,0.6)';
          ctx.fill();
        }
      }
      break;
    case 'leaf':
      ctx.beginPath();
      ctx.moveTo(0, -ing.height / 2);
      ctx.quadraticCurveTo(ing.width / 2, -ing.height / 4, ing.width / 2 - 5, ing.height / 2);
      ctx.quadraticCurveTo(0, ing.height / 2 - 5, -ing.width / 2 + 5, ing.height / 2);
      ctx.quadraticCurveTo(-ing.width / 2, -ing.height / 4, 0, -ing.height / 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(34,100,34,0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, -ing.height / 2 + 5);
      ctx.lineTo(0, ing.height / 2 - 5);
      ctx.stroke();
      break;
    default:
      ctx.beginPath();
      ctx.roundRect(-ing.width / 2, -ing.height / 2, ing.width, ing.height, 6);
      ctx.fill();
  }
  ctx.restore();
}

export function drawCutPieces(ctx: CanvasRenderingContext2D, ing: Ingredient): void {
  ing.cutPieces.forEach((piece) => {
    if (piece.inPot) return;
    ctx.save();
    ctx.translate(piece.x, piece.y);
    ctx.rotate(piece.textureAngle * 0.1);
    const cooked = mixColor(ing.baseColor, ing.cookedColor, piece.cookingProgress);
    ctx.fillStyle = cooked;
    ctx.shadowColor = 'rgba(47,47,47,0.25)';
    ctx.shadowBlur = 2;
    ctx.beginPath();
    if (piece.width > 4 && piece.height > 4) {
      ctx.roundRect(-piece.width / 2, -piece.height / 2, piece.width, piece.height, 1.5);
    } else {
      ctx.ellipse(0, 0, piece.width / 2, piece.height / 2, 0, 0, Math.PI * 2);
    }
    ctx.fill();

    ctx.strokeStyle = `rgba(255,255,255,0.35)`;
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(-piece.width / 3, 0);
    ctx.lineTo(piece.width / 3, 0);
    ctx.stroke();
    ctx.restore();
  });
}

export function detectKnifeHit(knife: KnifeState, ing: Ingredient): boolean {
  if (ing.cutPieces.length === 0) {
    const dx = knife.x + 30 - ing.x;
    const dy = knife.y - ing.y;
    return Math.abs(dx) < ing.width / 2 + knife.width / 3 &&
           Math.abs(dy) < ing.height / 2 + knife.height / 2;
  }
  return false;
}

export function performCut(
  ing: Ingredient,
  direction: Vec2,
  particles: Particle[]
): CutPiece[] {
  const newPieces: CutPiece[] = [];
  const angle = Math.atan2(direction.y, direction.x);
  let pieceW = 6;
  let pieceH = 6;

  switch (ing.type) {
    case 'radish':
      pieceW = 7; pieceH = 7; break;
    case 'fish':
      pieceW = 10; pieceH = 2; break;
    case 'cabbage':
      pieceW = 9; pieceH = 5; break;
    case 'pork':
      pieceW = 8; pieceH = 6; break;
  }

  const cols = Math.max(3, Math.floor(ing.width / pieceW));
  const rows = Math.max(2, Math.floor(ing.height / pieceH));

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const lx = (c - cols / 2 + 0.5) * pieceW + (Math.random() - 0.5) * 2;
      const ly = (r - rows / 2 + 0.5) * pieceH + (Math.random() - 0.5) * 2;
      newPieces.push({
        id: uid(),
        parentId: ing.id,
        x: ing.x + lx,
        y: ing.y + ly,
        localX: lx,
        localY: ly,
        width: pieceW * (0.8 + Math.random() * 0.4),
        height: pieceH * (0.8 + Math.random() * 0.4),
        color: ing.baseColor,
        textureAngle: angle,
        cookingProgress: 0,
        inPot: false,
        potX: 0,
        potY: 0,
        dragging: false
      });
    }
  }

  for (let i = 0; i < 14; i++) {
    particles.push({
      x: ing.x + (Math.random() - 0.5) * ing.width,
      y: ing.y + (Math.random() - 0.5) * ing.height,
      vx: (Math.random() - 0.5) * 80,
      vy: -Math.random() * 80 - 20,
      life: 0.5,
      maxLife: 0.5,
      size: 1.5 + Math.random() * 2,
      color: lightenColor(ing.baseColor, 15)
    });
  }

  return newPieces;
}

export function hitTestIngredient(
  mx: number,
  my: number,
  ingredients: Ingredient[]
): { ingredient: Ingredient | null; piece: CutPiece | null } {
  for (let i = ingredients.length - 1; i >= 0; i--) {
    const ing = ingredients[i];
    for (let j = ing.cutPieces.length - 1; j >= 0; j--) {
      const p = ing.cutPieces[j];
      if (p.inPot) continue;
      if (Math.abs(mx - p.x) < p.width / 2 + 4 && Math.abs(my - p.y) < p.height / 2 + 4) {
        return { ingredient: ing, piece: p };
      }
    }
    if (ing.cutPieces.length === 0) {
      if (Math.abs(mx - ing.x) < ing.width / 2 + 4 && Math.abs(my - ing.y) < ing.height / 2 + 4) {
        return { ingredient: ing, piece: null };
      }
    }
  }
  return { ingredient: null, piece: null };
}

export function hitTestKnife(mx: number, my: number, knife: KnifeState): boolean {
  const dx = mx - knife.x;
  const dy = my - knife.y;
  return Math.abs(dx) < knife.width / 2 && Math.abs(dy) < knife.height;
}

function lightenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, ((num >> 16) & 255) + percent);
  const g = Math.min(255, ((num >> 8) & 255) + percent);
  const b = Math.min(255, (num & 255) + percent);
  return `rgb(${r},${g},${b})`;
}

function darkenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, ((num >> 16) & 255) - percent);
  const g = Math.max(0, ((num >> 8) & 255) - percent);
  const b = Math.max(0, (num & 255) - percent);
  return `rgb(${r},${g},${b})`;
}

export function mixColor(c1: string, c2: string, t: number): string {
  const p1 = parseColor(c1);
  const p2 = parseColor(c2);
  const r = Math.round(p1.r + (p2.r - p1.r) * t);
  const g = Math.round(p1.g + (p2.g - p1.g) * t);
  const b = Math.round(p1.b + (p2.b - p1.b) * t);
  return `rgb(${r},${g},${b})`;
}

function parseColor(c: string): { r: number; g: number; b: number } {
  if (c.startsWith('rgb')) {
    const m = c.match(/\d+/g)!;
    return { r: +m[0], g: +m[1], b: +m[2] };
  }
  const num = parseInt(c.replace('#', ''), 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

export function createIngredient(type: IngredientType, x: number, y: number, preset: typeof import('./types').INGREDIENT_PRESETS[IngredientType]): Ingredient {
  return {
    id: uid(),
    ...preset,
    x,
    y,
    cutPieces: [],
    cookingProgress: 0,
    inPot: false,
    dragging: false
  };
}

export const BOARD = { CX: BOARD_CX, CY: BOARD_CY, R: BOARD_R, W: CANVAS_W, H: CANVAS_H };
