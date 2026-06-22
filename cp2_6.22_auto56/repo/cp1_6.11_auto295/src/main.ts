import {
  createMenuBar,
  createCanvas,
  createSpiceRack,
  createDishPlate,
  createIngredientTray
} from './ui';
import {
  createKnife,
  drawBoard,
  drawKnife,
  drawIngredient,
  hitTestKnife,
  hitTestIngredient,
  detectKnifeHit,
  performCut,
  createIngredient,
  BOARD,
  mixColor
} from './knife';
import {
  createPot,
  createFlames,
  drawStove,
  drawPot,
  drawFlames,
  drawPotContents,
  drawSpatula,
  drawSteam,
  emitSteam,
  updateParticles,
  isInsidePot,
  placeInPot,
  updateCooking,
  POT
} from './cook';
import {
  addSpice,
  drawSpiceParticles,
  drawAuras,
  updateAuras,
  drawSettledSpices,
  settleSpiceParticles
} from './spice';
import {
  KnifeState,
  Ingredient,
  Particle,
  Flame,
  PotState,
  SpiceAura,
  SpiceType,
  INGREDIENT_PRESETS,
  IngredientType,
  CutPiece,
  COLORS
} from './types';

const app = document.getElementById('app')!;

const title = document.createElement('div');
title.className = 'app-title';
title.textContent = '宋 代 庖 厨';
const subtitle = document.createElement('div');
subtitle.className = 'app-subtitle';
subtitle.textContent = '— 烹 饪 模 拟 器 —';
app.appendChild(title);
app.appendChild(subtitle);

const menuBar = createMenuBar();
app.appendChild(menuBar);

const workspace = document.createElement('div');
workspace.className = 'workspace';
app.appendChild(workspace);

const ingredientTray = createIngredientTray(
  [
    { type: 'radish', name: '白萝卜', color: '#FAFAFA' },
    { type: 'cabbage', name: '白菜', color: '#90EE90' },
    { type: 'pork', name: '猪肉', color: '#F08080' },
    { type: 'fish', name: '鲤鱼', color: '#E8E8E8' }
  ],
  (type) => {
    if (ingredients.length >= 5) return;
    const preset = INGREDIENT_PRESETS[type as IngredientType];
    const angle = Math.random() * Math.PI * 2;
    const r = 40 + Math.random() * 60;
    const x = BOARD.CX + Math.cos(angle) * r;
    const y = BOARD.CY + Math.sin(angle) * r * 0.9;
    ingredients.push(createIngredient(type as IngredientType, x, y, preset));
  }
);
workspace.appendChild(ingredientTray);

const boardWrapper = document.createElement('div');
boardWrapper.className = 'canvas-wrapper section';
const boardLabel = document.createElement('div');
boardLabel.className = 'section-label';
boardLabel.textContent = '砧 板 区';
boardWrapper.appendChild(boardLabel);
const boardCanvas = createCanvas(BOARD.W, BOARD.H, 'board-canvas');
boardWrapper.appendChild(boardCanvas);
workspace.appendChild(boardWrapper);

const potWrapper = document.createElement('div');
potWrapper.className = 'canvas-wrapper section';
const potLabel = document.createElement('div');
potLabel.className = 'section-label';
potLabel.textContent = '灶 台 区';
potWrapper.appendChild(potLabel);
const potCanvas = createCanvas(POT.W, POT.H, 'pot-canvas');
potWrapper.appendChild(potCanvas);
workspace.appendChild(potWrapper);

const spiceRack = createSpiceRack((type) => {
  if (!pot.cooking && !hasAnyInPot()) return;
  addSpice(type, spiceParticles, auras);
  particleTypeMap.clear();
  spiceParticles.forEach((p) => {
    if (!particleTypeMap.has(p)) particleTypeMap.set(p, type);
  });
});
workspace.appendChild(spiceRack);

const bottomArea = document.createElement('div');
bottomArea.className = 'bottom-area';
app.appendChild(bottomArea);

const { container: plateContainer, canvas: plateCanvas } = createDishPlate();
bottomArea.appendChild(plateContainer);

const tipBox = document.createElement('div');
tipBox.style.cssText = `
  max-width: 380px;
  padding: 16px 20px;
  background: rgba(245, 222, 179, 0.6);
  border: 1px solid rgba(93, 58, 26, 0.3);
  border-radius: 8px;
  font-family: 'ZCOOL XiaoWei', 'KaiTi', serif;
  font-size: 13px;
  color: ${COLORS.woodBrown};
  line-height: 1.9;
  letter-spacing: 1px;
`;
tipBox.innerHTML = `
  <div style="font-family:'Ma Shan Zheng',serif; font-size:16px; margin-bottom:6px; color:${COLORS.handleRed}; letter-spacing:3px;">操 作 指 南</div>
  · 点击左侧「食材架」往砧板添加食材<br/>
  · 拖拽菜刀划过食材，即可切成丁/片/条<br/>
  · 把切好的食材小块拖入右侧铁锅<br/>
  · 锅中有食材后自动点火、翻炒、冒蒸汽<br/>
  · 点击右侧香料罐为菜肴添香<br/>
  · 烹饪完成后菜自动盛入青花盘
`;
bottomArea.appendChild(tipBox);

const boardCtx = boardCanvas.getContext('2d')!;
const potCtx = potCanvas.getContext('2d')!;
const plateCtx = plateCanvas.getContext('2d')!;

const knife: KnifeState = createKnife();
const pot: PotState = createPot();
const flames: Flame[] = createFlames();
const ingredients: Ingredient[] = [];
const cutParticles: Particle[] = [];
const steamParticles: Particle[] = [];
const spiceParticles: Particle[] = [];
const auras: SpiceAura[] = [];
const settledSpices: Array<{ x: number; y: number; type: SpiceType; rotation: number }> = [];
const particleTypeMap = new Map<Particle, SpiceType>();
const dishedItems: Array<{ x: number; y: number; w: number; h: number; color: string; rot: number }> = [];

let draggingKnife = false;
let draggingPiece: { piece: CutPiece; ingredient: Ingredient; offsetX: number; offsetY: number } | null = null;
let knifePrevX = knife.x;
let knifePrevY = knife.y;
let lastTime = performance.now();
let served = false;

function hasAnyInPot(): boolean {
  return ingredients.some((ing) => ing.cutPieces.some((p) => p.inPot));
}

function isAllCooked(): boolean {
  const inPot = ingredients.flatMap((ing) => ing.cutPieces.filter((p) => p.inPot));
  if (inPot.length === 0) return false;
  return inPot.every((p) => p.cookingProgress >= 1);
}

function serveDish(): void {
  if (served) return;
  served = true;
  dishedItems.length = 0;
  const cx = plateCanvas.width / 2;
  const cy = plateCanvas.height / 2;
  ingredients.forEach((ing) => {
    ing.cutPieces.forEach((piece, idx) => {
      if (piece.inPot) {
        const angle = (idx / 30) * Math.PI * 2 + Math.random() * 0.5;
        const r = 30 + Math.random() * 55;
        dishedItems.push({
          x: cx + Math.cos(angle) * r,
          y: cy + Math.sin(angle) * r * 0.6,
          w: piece.width * 1.8,
          h: piece.height * 1.8,
          color: mixColor(ing.baseColor, ing.cookedColor, 1),
          rot: piece.textureAngle + Math.random()
        });
      }
    });
  });
  settledSpices.forEach((s) => {
    dishedItems.push({
      x: cx + (s.x - POT.CX) * 0.5,
      y: cy + (s.y - (POT.CY - 10)) * 0.4,
      w: 4,
      h: 4,
      color: '#8B4513',
      rot: s.rotation
    });
  });
}

function getCanvasPos(e: MouseEvent | Touch, canvas: HTMLCanvasElement): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY
  };
}

boardCanvas.addEventListener('mousedown', (e) => {
  const { x, y } = getCanvasPos(e, boardCanvas);
  if (hitTestKnife(x, y, knife)) {
    draggingKnife = true;
    knife.dragging = true;
    knifePrevX = knife.x;
    knifePrevY = knife.y;
    boardCanvas.style.cursor = 'grabbing';
    return;
  }
  const hit = hitTestIngredient(x, y, ingredients);
  if (hit.piece) {
    hit.piece.dragging = true;
    draggingPiece = {
      piece: hit.piece,
      ingredient: hit.ingredient!,
      offsetX: x - hit.piece.x,
      offsetY: y - hit.piece.y
    };
  }
});

boardCanvas.addEventListener('mousemove', (e) => {
  const { x, y } = getCanvasPos(e, boardCanvas);
  if (draggingKnife) {
    const dx = x - knifePrevX;
    const dy = y - knifePrevY;
    const dist = Math.hypot(dx, dy);
    if (dist > 0.5) {
      knife.angle = Math.atan2(dy, dx);
    }
    knife.x = Math.max(60, Math.min(BOARD.W - 80, x));
    knife.y = Math.max(40, Math.min(BOARD.H - 40, y));
    if (dist > 3) {
      knife.flashTimer = 0.2;
      ingredients.forEach((ing) => {
        if (detectKnifeHit(knife, ing)) {
          const dir = { x: dx, y: dy };
          const pieces = performCut(ing, dir, cutParticles);
          ing.cutPieces.push(...pieces);
        }
      });
    }
    knifePrevX = knife.x;
    knifePrevY = knife.y;
  } else if (draggingPiece) {
    draggingPiece.piece.x = x - draggingPiece.offsetX;
    draggingPiece.piece.y = y - draggingPiece.offsetY;
  } else if (hitTestKnife(x, y, knife)) {
    boardCanvas.style.cursor = 'grab';
  } else {
    boardCanvas.style.cursor = 'default';
  }
});

window.addEventListener('mouseup', (e) => {
  if (draggingKnife) {
    draggingKnife = false;
    knife.dragging = false;
    boardCanvas.style.cursor = 'default';
  }
  if (draggingPiece) {
    draggingPiece.piece.dragging = false;
    if (e.target === potCanvas || potWrapper.contains(e.target as Node)) {
      const rect = potCanvas.getBoundingClientRect();
      const scaleX = potCanvas.width / rect.width;
      const scaleY = potCanvas.height / rect.height;
      const px = (e.clientX - rect.left) * scaleX;
      const py = (e.clientY - rect.top) * scaleY;
      if (isInsidePot(px, py)) {
        placeInPot(draggingPiece.piece);
        pot.cooking = true;
      }
    }
    draggingPiece = null;
  }
});

potCanvas.addEventListener('mouseup', (e) => {
  if (!draggingPiece) return;
  const { x, y } = getCanvasPos(e, potCanvas);
  if (isInsidePot(x, y)) {
    placeInPot(draggingPiece.piece);
    pot.cooking = true;
    draggingPiece.piece.dragging = false;
    draggingPiece = null;
  }
});

function drawPlate(ctx: CanvasRenderingContext2D): void {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  dishedItems.forEach((d) => {
    ctx.save();
    ctx.translate(d.x, d.y);
    ctx.rotate(d.rot * 0.2);
    ctx.fillStyle = d.color;
    ctx.shadowColor = 'rgba(0,0,0,0.15)';
    ctx.shadowBlur = 2;
    if (d.w > 3 && d.h > 3) {
      ctx.beginPath();
      ctx.roundRect(-d.w / 2, -d.h / 2, d.w, d.h, 1);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(d.w, d.h) / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  });
}

function loop(now: number): void {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  const time = now / 1000;

  if (knife.flashTimer > 0) knife.flashTimer = Math.max(0, knife.flashTimer - dt);
  updateParticles(cutParticles, dt);
  updateParticles(steamParticles, dt);
  updateParticles(spiceParticles, dt);
  updateAuras(auras, dt);
  updateCooking(ingredients, dt, pot);
  settleSpiceParticles(spiceParticles, settledSpices, particleTypeMap);

  if (pot.cooking) {
    if (Math.random() < 0.9) emitSteam(steamParticles);
  }

  if (pot.cooking && isAllCooked() && !served) {
    setTimeout(() => serveDish(), 800);
  }

  boardCtx.clearRect(0, 0, BOARD.W, BOARD.H);
  drawBoard(boardCtx);
  ingredients.forEach((ing) => drawIngredient(boardCtx, ing));
  cutParticles.forEach((p) => {
    boardCtx.globalAlpha = p.life / p.maxLife;
    boardCtx.fillStyle = p.color;
    boardCtx.beginPath();
    boardCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    boardCtx.fill();
  });
  boardCtx.globalAlpha = 1;
  drawKnife(boardCtx, knife);

  potCtx.clearRect(0, 0, POT.W, POT.H);
  drawStove(potCtx);
  if (pot.cooking) drawFlames(potCtx, flames, time);
  drawPot(potCtx, pot);
  drawPotContents(potCtx, ingredients, pot, time);
  drawSettledSpices(potCtx, settledSpices);
  drawAuras(potCtx, auras);
  drawSpiceParticles(potCtx, spiceParticles);
  drawSpatula(potCtx, pot, time);
  drawSteam(potCtx, steamParticles);

  drawPlate(plateCtx);

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
