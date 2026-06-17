import { BattleEngine, BattleState, GridCell, Combo } from '../engine/battleEngine';
import { Card, Element, CardLevel, getElementSymbol, getElementColor } from '../engine/cardEngine';
import { HUD } from '../ui/hud';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface Animation {
  type: 'pulse' | 'snap' | 'flash' | 'combo';
  x: number;
  y: number;
  elapsed: number;
  duration: number;
  color?: string;
  data?: unknown;
}

const CANVAS_W = 480;
const CANVAS_H = 800;
const HUD_HEIGHT = 60;
const GRID_ROWS = 3;
const GRID_COLS = 3;
const CELL_W = 100;
const CELL_H = 120;
const CELL_GAP = 10;
const CARD_W = 80;
const CARD_H = 110;
const CARD_RADIUS = 8;
const GRID_TOTAL_W = GRID_COLS * CELL_W + (GRID_COLS - 1) * CELL_GAP;
const GRID_TOTAL_H = GRID_ROWS * CELL_H + (GRID_ROWS - 1) * CELL_GAP;
const GRID_X = (CANVAS_W - GRID_TOTAL_W) / 2;
const GRID_Y = HUD_HEIGHT + 80;
const HAND_Y = GRID_Y + GRID_TOTAL_H + 40;
const HAND_CARD_GAP = 12;
const ENEMY_AREA_Y = HUD_HEIGHT + 5;
const BG_COLOR = '#1A1A2E';
const GRID_LINE_COLOR = '#E94560';
const MOBILE_SCALE = 0.7;
const LONG_PRESS_DURATION = 500;
const SNAP_DURATION = 0.3;
const FLASH_DURATION = 0.2;

export class GameRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private battleEngine: BattleEngine;
  private hud: HUD;
  private scale: number = 1;
  private offsetX: number = 0;
  private offsetY: number = 0;

  private particles: Particle[] = [];
  private animations: Animation[] = [];
  private lastTime: number = 0;

  private dragging: boolean = false;
  private dragCard: Card | null = null;
  private dragX: number = 0;
  private dragY: number = 0;
  private dragStartX: number = 0;
  private dragStartY: number = 0;

  private clickCard: Card | null = null;
  private clickTimer: number = 0;
  private longPressTriggered: boolean = false;
  private showPreview: boolean = false;
  private previewCard: Card | null = null;

  private selectedHandIdx: number = -1;
  private detailCard: Card | null = null;

  private flashAlpha: number = 0;
  private enemyFlashAlpha: number = 0;

  private comboTexts: { text: string; x: number; y: number; alpha: number; vy: number }[] = [];

  constructor(canvas: HTMLCanvasElement, battleEngine: BattleEngine) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.battleEngine = battleEngine;
    this.hud = new HUD();

    this.resize();
    this.bindEvents();

    this.battleEngine.onStateChange((state) => {
      this.onStateChange(state);
    });
  }

  private resize() {
    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;

    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';

    const scaleX = w / CANVAS_W;
    const scaleY = h / CANVAS_H;
    this.scale = Math.min(scaleX, scaleY);
    this.offsetX = (w - CANVAS_W * this.scale) / 2;
    this.offsetY = (h - CANVAS_H * this.scale) / 2;

    if (w < 600) {
      this.scale *= MOBILE_SCALE;
      this.offsetX = (w - CANVAS_W * this.scale) / 2;
      this.offsetY = (h - CANVAS_H * this.scale) / 2;
    }
  }

  private screenToGame(sx: number, sy: number): { x: number; y: number } {
    return {
      x: (sx - this.offsetX) / this.scale,
      y: (sy - this.offsetY) / this.scale
    };
  }

  private bindEvents() {
    window.addEventListener('resize', () => this.resize());

    this.canvas.addEventListener('mousedown', (e) => this.onPointerDown(e.clientX, e.clientY));
    this.canvas.addEventListener('mousemove', (e) => this.onPointerMove(e.clientX, e.clientY));
    this.canvas.addEventListener('mouseup', (e) => this.onPointerUp(e.clientX, e.clientY));

    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const t = e.touches[0];
      this.onPointerDown(t.clientX, t.clientY);
    }, { passive: false });
    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const t = e.touches[0];
      this.onPointerMove(t.clientX, t.clientY);
    }, { passive: false });
    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      const t = e.changedTouches[0];
      this.onPointerUp(t.clientX, t.clientY);
    }, { passive: false });
  }

  private onPointerDown(sx: number, sy: number) {
    const { x, y } = this.screenToGame(sx, sy);
    const state = this.battleEngine.getState();

    if (this.showPreview) {
      this.showPreview = false;
      this.previewCard = null;
      return;
    }

    if (state.gameOver) {
      this.battleEngine.restart();
      return;
    }

    const handIdx = this.getHandCardAt(x, y, state);
    if (handIdx >= 0) {
      this.dragCard = state.hand[handIdx];
      this.selectedHandIdx = handIdx;
      this.dragX = x;
      this.dragY = y;
      this.dragStartX = x;
      this.dragStartY = y;
      this.clickCard = this.dragCard;
      this.clickTimer = 0;
      this.longPressTriggered = false;
      this.dragging = false;
      this.battleEngine.selectCard(this.dragCard!);
      return;
    }

    const gridPos = this.getGridCellAt(x, y);
    if (gridPos && state.selectedCard && !state.grid[gridPos.row][gridPos.col].card) {
      this.battleEngine.placeCard(gridPos.row, gridPos.col);
    }
  }

  private onPointerMove(sx: number, sy: number) {
    const { x, y } = this.screenToGame(sx, sy);

    if (this.dragCard) {
      const dx = x - this.dragStartX;
      const dy = y - this.dragStartY;
      if (Math.sqrt(dx * dx + dy * dy) > 5) {
        this.dragging = true;
      }
      this.dragX = x;
      this.dragY = y;
    }
  }

  private onPointerUp(sx: number, sy: number) {
    const { x, y } = this.screenToGame(sx, sy);
    const state = this.battleEngine.getState();

    if (this.dragCard && this.dragging) {
      const gridPos = this.getGridCellAt(x, y);
      if (gridPos && !state.grid[gridPos.row][gridPos.col].card) {
        this.addSnapAnimation(gridPos.row, gridPos.col);
        this.battleEngine.placeCard(gridPos.row, gridPos.col);
        this.spawnPlacementParticles(gridPos.row, gridPos.col, this.dragCard.element);
      } else {
        this.battleEngine.deselectCard();
      }
    } else if (this.clickCard && !this.dragging) {
      if (this.detailCard && this.detailCard.id === this.clickCard.id) {
        this.detailCard = null;
      } else {
        this.detailCard = this.clickCard;
      }
    }

    this.dragCard = null;
    this.dragging = false;
    this.selectedHandIdx = -1;
  }

  private getHandCardAt(x: number, y: number, state: BattleState): number {
    const handCount = state.hand.length;
    const totalHandW = handCount * CARD_W + (handCount - 1) * HAND_CARD_GAP;
    const startX = (CANVAS_W - totalHandW) / 2;

    for (let i = 0; i < handCount; i++) {
      const cx = startX + i * (CARD_W + HAND_CARD_GAP);
      const cy = HAND_Y;
      if (x >= cx && x <= cx + CARD_W && y >= cy && y <= cy + CARD_H) {
        return i;
      }
    }
    return -1;
  }

  private getGridCellAt(x: number, y: number): { row: number; col: number } | null {
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const cx = GRID_X + c * (CELL_W + CELL_GAP);
        const cy = GRID_Y + r * (CELL_H + CELL_GAP);
        if (x >= cx && x <= cx + CELL_W && y >= cy && y <= cy + CELL_H) {
          return { row: r, col: c };
        }
      }
    }
    return null;
  }

  private onStateChange(state: BattleState) {
    if (state.message === '游戏结束') {
      this.flashAlpha = 0.8;
    }

    const killedEnemies = state.enemies.filter(e => e.hp <= 0);
    if (killedEnemies.length > 0) {
      this.enemyFlashAlpha = 1.0;
    }
  }

  private addSnapAnimation(row: number, col: number) {
    const cx = GRID_X + col * (CELL_W + CELL_GAP) + CELL_W / 2;
    const cy = GRID_Y + row * (CELL_H + CELL_GAP) + CELL_H / 2;
    this.animations.push({
      type: 'snap',
      x: cx,
      y: cy,
      elapsed: 0,
      duration: SNAP_DURATION
    });
  }

  private spawnPlacementParticles(row: number, col: number, element: Element) {
    const cx = GRID_X + col * (CELL_W + CELL_GAP) + CELL_W / 2;
    const cy = GRID_Y + row * (CELL_H + CELL_GAP) + CELL_H / 2;
    const color = getElementColor(element);

    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 80;
      this.particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.5 + Math.random() * 0.5,
        maxLife: 1,
        color,
        size: 2 + Math.random() * 4
      });
    }
  }

  private spawnComboParticles(combos: Combo[]) {
    for (const combo of combos) {
      const color = getElementColor(combo.element);
      for (const pos of combo.positions) {
        const cx = GRID_X + pos.col * (CELL_W + CELL_GAP) + CELL_W / 2;
        const cy = GRID_Y + pos.row * (CELL_H + CELL_GAP) + CELL_H / 2;
        for (let i = 0; i < 15; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 50 + Math.random() * 100;
          this.particles.push({
            x: cx,
            y: cy,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 0.6 + Math.random() * 0.4,
            maxLife: 1,
            color,
            size: 3 + Math.random() * 5
          });
        }
      }

      const midPos = combo.positions[Math.floor(combo.positions.length / 2)];
      const tx = GRID_X + midPos.col * (CELL_W + CELL_GAP) + CELL_W / 2;
      const ty = GRID_Y + midPos.row * (CELL_H + CELL_GAP) + CELL_H / 2;
      this.comboTexts.push({
        text: `连击 x${combo.multiplier.toFixed(1)}`,
        x: tx,
        y: ty - 20,
        alpha: 1,
        vy: -30
      });
    }
  }

  private spawnDefeatParticles() {
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 150;
      this.particles.push({
        x: CANVAS_W / 2,
        y: ENEMY_AREA_Y + 40,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.8 + Math.random() * 0.5,
        maxLife: 1.3,
        color: '#FFD700',
        size: 3 + Math.random() * 6
      });
    }
  }

  render(timestamp: number) {
    const dt = this.lastTime ? (timestamp - this.lastTime) / 1000 : 0.016;
    this.lastTime = timestamp;

    this.battleEngine.update(dt);
    this.updateAnimations(dt);
    this.updateParticles(dt);
    this.updateComboTexts(dt);

    const state = this.battleEngine.getState();
    const ctx = this.ctx;
    const dpr = window.devicePixelRatio || 1;

    ctx.save();
    ctx.scale(dpr, dpr);

    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, this.canvas.width / dpr, this.canvas.height / dpr);

    ctx.save();
    ctx.translate(this.offsetX, this.offsetY);
    ctx.scale(this.scale, this.scale);

    this.drawGrid(ctx, state, dt);
    this.drawEnemies(ctx, state);
    this.drawHand(ctx, state);
    this.drawDragCard(ctx, state);
    this.drawParticles(ctx);
    this.drawComboTexts(ctx);
    this.drawAnimations(ctx);
    this.drawDetailPanel(ctx, state);
    this.drawPreview(ctx, state);
    this.drawMessage(ctx, state);
    this.drawFlash(ctx);
    this.drawGameOver(ctx, state);

    ctx.restore();

    ctx.save();
    ctx.translate(this.offsetX, 0);
    ctx.scale(this.scale, this.scale);
    this.hud.render(ctx, state, CANVAS_W);
    ctx.restore();

    ctx.restore();

    requestAnimationFrame((t) => this.render(t));
  }

  private drawGrid(ctx: CanvasRenderingContext2D, state: BattleState, dt: number) {
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const x = GRID_X + c * (CELL_W + CELL_GAP);
        const y = GRID_Y + r * (CELL_H + CELL_GAP);
        const cell = state.grid[r][c];

        ctx.strokeStyle = GRID_LINE_COLOR;
        ctx.lineWidth = 2;
        ctx.shadowColor = GRID_LINE_COLOR;
        ctx.shadowBlur = 6;

        this.roundRect(ctx, x, y, CELL_W, CELL_H, 4);
        ctx.stroke();

        ctx.shadowBlur = 0;

        if (cell.element) {
          const baseColor = getElementColor(cell.element);
          const pulse = 1 + 0.1 * Math.sin(cell.pulsePhase);
          ctx.globalAlpha = 0.3 * pulse;
          ctx.fillStyle = baseColor;
          this.roundRect(ctx, x, y, CELL_W, CELL_H, 4);
          ctx.fill();
          ctx.globalAlpha = 1;
        }

        if (cell.card) {
          this.drawCard(ctx, cell.card, x + (CELL_W - CARD_W) / 2, y + (CELL_H - CARD_H) / 2, 1);

          if (cell.areaEffects.length > 0) {
            const effectColor = getElementColor(cell.areaEffects[0].sourceElement);
            ctx.globalAlpha = 0.3 + 0.2 * Math.sin(Date.now() / 200);
            ctx.fillStyle = effectColor;
            this.roundRect(ctx, x + 2, y + 2, CELL_W - 4, CELL_H - 4, 4);
            ctx.fill();
            ctx.globalAlpha = 1;
          }
        } else {
          if (state.selectedCard) {
            ctx.globalAlpha = 0.15;
            ctx.fillStyle = getElementColor(state.selectedCard.element);
            this.roundRect(ctx, x, y, CELL_W, CELL_H, 4);
            ctx.fill();
            ctx.globalAlpha = 1;
          }
        }
      }
    }
  }

  private drawCard(ctx: CanvasRenderingContext2D, card: Card, x: number, y: number, scale: number) {
    const w = CARD_W * scale;
    const h = CARD_H * scale;
    const elementColor = getElementColor(card.element);

    ctx.fillStyle = '#2A2A4A';
    this.roundRect(ctx, x, y, w, h, CARD_RADIUS * scale);
    ctx.fill();

    ctx.strokeStyle = elementColor;
    ctx.lineWidth = 2 * scale;
    this.roundRect(ctx, x, y, w, h, CARD_RADIUS * scale);
    ctx.stroke();

    if (card.level === CardLevel.Advanced) {
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 1.5 * scale;
      this.roundRect(ctx, x + 3 * scale, y + 3 * scale, w - 6 * scale, h - 6 * scale, (CARD_RADIUS - 2) * scale);
      ctx.stroke();
    }

    ctx.fillStyle = elementColor;
    ctx.font = `bold ${28 * scale}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(getElementSymbol(card.element), x + w / 2, y + h / 2 - 12 * scale);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = `${12 * scale}px sans-serif`;
    ctx.fillText(`ATK ${card.attack}`, x + w / 2, y + h / 2 + 14 * scale);

    if (card.level === CardLevel.Advanced) {
      ctx.fillStyle = '#FFD700';
      ctx.font = `bold ${9 * scale}px sans-serif`;
      ctx.fillText('★ 高级', x + w / 2, y + h - 12 * scale);
    }

    ctx.fillStyle = '#AAA';
    ctx.font = `${9 * scale}px sans-serif`;
    ctx.fillText(card.name, x + w / 2, y + 10 * scale);
  }

  private drawEnemies(ctx: CanvasRenderingContext2D, state: BattleState) {
    if (state.enemies.length === 0) return;

    const enemyW = 90;
    const enemyH = 65;
    const totalW = state.enemies.length * enemyW + (state.enemies.length - 1) * 10;
    const startX = (CANVAS_W - totalW) / 2;

    for (let i = 0; i < state.enemies.length; i++) {
      const enemy = state.enemies[i];
      const x = startX + i * (enemyW + 10);
      const y = ENEMY_AREA_Y;

      const elementColor = getElementColor(enemy.element);

      ctx.fillStyle = '#2A2A3E';
      this.roundRect(ctx, x, y, enemyW, enemyH, 6);
      ctx.fill();

      ctx.strokeStyle = elementColor;
      ctx.lineWidth = 1.5;
      this.roundRect(ctx, x, y, enemyW, enemyH, 6);
      ctx.stroke();

      ctx.fillStyle = elementColor;
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(getElementSymbol(enemy.element), x + enemyW / 2, y + 20);

      ctx.fillStyle = '#CCC';
      ctx.font = '10px sans-serif';
      ctx.fillText(enemy.name, x + enemyW / 2, y + 36);

      const hpRatio = enemy.hp / enemy.maxHp;
      const barW = enemyW - 10;
      ctx.fillStyle = '#333';
      ctx.fillRect(x + 5, y + enemyH - 12, barW, 6);
      ctx.fillStyle = hpRatio > 0.5 ? '#32CD32' : hpRatio > 0.25 ? '#FFD700' : '#FF4500';
      ctx.fillRect(x + 5, y + enemyH - 12, barW * hpRatio, 6);

      ctx.fillStyle = '#FFF';
      ctx.font = '8px sans-serif';
      ctx.fillText(`${enemy.hp}/${enemy.maxHp}`, x + enemyW / 2, y + enemyH - 6);

      const resistText = Object.entries(enemy.resistances)
        .map(([el, val]) => `${getElementSymbol(el as Element)}${Math.round((1 - val) * 100)}%`)
        .join(' ');
      ctx.fillStyle = '#888';
      ctx.font = '7px sans-serif';
      ctx.fillText(resistText, x + enemyW / 2, y + 50);
    }
  }

  private drawHand(ctx: CanvasRenderingContext2D, state: BattleState) {
    const hand = state.hand;
    const count = hand.length;
    const totalW = count * CARD_W + (count - 1) * HAND_CARD_GAP;
    const startX = (CANVAS_W - totalW) / 2;

    for (let i = 0; i < count; i++) {
      const card = hand[i];
      const x = startX + i * (CARD_W + HAND_CARD_GAP);
      const y = HAND_Y;

      const isSelected = state.selectedCard && state.selectedCard.id === card.id;
      const yOffset = isSelected ? -10 : 0;

      this.drawCard(ctx, card, x, y + yOffset, 1);
    }
  }

  private drawDragCard(ctx: CanvasRenderingContext2D, state: BattleState) {
    if (!this.dragging || !this.dragCard) return;

    ctx.save();
    ctx.globalAlpha = 0.9;
    this.drawCard(ctx, this.dragCard, this.dragX - CARD_W * 0.55, this.dragY - CARD_H * 0.55, 1.1);
    ctx.restore();
  }

  private drawParticles(ctx: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  private drawComboTexts(ctx: CanvasRenderingContext2D) {
    for (const ct of this.comboTexts) {
      ctx.globalAlpha = ct.alpha;
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(ct.text, ct.x, ct.y);
    }
    ctx.globalAlpha = 1;
  }

  private drawAnimations(ctx: CanvasRenderingContext2D) {
    for (const anim of this.animations) {
      if (anim.type === 'snap') {
        const progress = anim.elapsed / anim.duration;
        const ease = 1 - Math.pow(1 - progress, 3);
        const scale = 1 + 0.15 * (1 - ease);
        ctx.globalAlpha = 1 - ease * 0.5;
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 2;
        const r = 30 * scale;
        ctx.beginPath();
        ctx.arc(anim.x, anim.y, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }
  }

  private drawDetailPanel(ctx: CanvasRenderingContext2D, state: BattleState) {
    if (!this.detailCard) return;

    const card = this.detailCard;
    const panelW = 200;
    const panelH = 160;
    const px = (CANVAS_W - panelW) / 2;
    const py = HAND_Y - 170;

    ctx.fillStyle = 'rgba(20, 20, 40, 0.92)';
    this.roundRect(ctx, px, py, panelW, panelH, 10);
    ctx.fill();

    ctx.strokeStyle = getElementColor(card.element);
    ctx.lineWidth = 1.5;
    this.roundRect(ctx, px, py, panelW, panelH, 10);
    ctx.stroke();

    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(card.name, px + panelW / 2, py + 24);

    ctx.fillStyle = getElementColor(card.element);
    ctx.font = '12px sans-serif';
    ctx.fillText(`元素: ${getElementSymbol(card.element)}`, px + panelW / 2, py + 48);

    ctx.fillStyle = '#CCC';
    ctx.font = '12px sans-serif';
    ctx.fillText(`攻击力: ${card.attack}`, px + panelW / 2, py + 68);

    ctx.fillText(`等级: ${card.level === CardLevel.Advanced ? '高级' : '普通'}`, px + panelW / 2, py + 88);

    if (card.areaEffect) {
      ctx.fillStyle = '#FFD700';
      ctx.fillText(`效果: ${card.areaEffect.type} (${card.areaEffect.duration}回合)`, px + panelW / 2, py + 108);
    }

    const synthesis = card.level === CardLevel.Normal
      ? '三张同色成行 → 高级符文'
      : '已为最高等级';
    ctx.fillStyle = '#888';
    ctx.font = '10px sans-serif';
    ctx.fillText(`合成: ${synthesis}`, px + panelW / 2, py + 135);
  }

  private drawPreview(ctx: CanvasRenderingContext2D, state: BattleState) {
    if (!this.showPreview || !this.previewCard) return;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    const scale = 2;
    const w = CARD_W * scale;
    const h = CARD_H * scale;
    const px = (CANVAS_W - w) / 2;
    const py = (CANVAS_H - h) / 2;

    ctx.fillStyle = 'rgba(30, 30, 50, 0.8)';
    this.roundRect(ctx, px - 20, py - 20, w + 40, h + 40, 16);
    ctx.fill();

    this.drawCard(ctx, this.previewCard, px, py, scale);

    ctx.fillStyle = '#888';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('点击任意处关闭', CANVAS_W / 2, py + h + 35);
  }

  private drawMessage(ctx: CanvasRenderingContext2D, state: BattleState) {
    if (!state.message || state.messageTimer <= 0) return;

    const alpha = Math.min(1, state.messageTimer);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.shadowColor = '#000';
    ctx.shadowBlur = 4;
    ctx.fillText(state.message, CANVAS_W / 2, GRID_Y + GRID_TOTAL_H / 2);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }

  private drawFlash(ctx: CanvasRenderingContext2D) {
    if (this.enemyFlashAlpha > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${this.enemyFlashAlpha * 0.3})`;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    }
  }

  private drawGameOver(ctx: CanvasRenderingContext2D, state: BattleState) {
    if (!state.gameOver) return;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    ctx.fillStyle = '#E94560';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('游戏结束', CANVAS_W / 2, CANVAS_H / 2 - 30);

    ctx.fillStyle = '#FFD700';
    ctx.font = '20px sans-serif';
    ctx.fillText(`最终积分: ${state.score}`, CANVAS_W / 2, CANVAS_H / 2 + 10);

    ctx.fillStyle = '#AAA';
    ctx.font = '16px sans-serif';
    ctx.fillText('点击重新开始', CANVAS_W / 2, CANVAS_H / 2 + 50);
  }

  private updateAnimations(dt: number) {
    for (const anim of this.animations) {
      anim.elapsed += dt;
    }
    this.animations = this.animations.filter(a => a.elapsed < a.duration);

    if (this.flashAlpha > 0) {
      this.flashAlpha = Math.max(0, this.flashAlpha - dt * 4);
    }
    if (this.enemyFlashAlpha > 0) {
      this.enemyFlashAlpha = Math.max(0, this.enemyFlashAlpha - dt / FLASH_DURATION);
    }

    if (this.clickCard && !this.longPressTriggered) {
      this.clickTimer += dt * 1000;
      if (this.clickTimer >= LONG_PRESS_DURATION) {
        this.longPressTriggered = true;
        this.showPreview = true;
        this.previewCard = this.clickCard;
      }
    }
  }

  private updateParticles(dt: number) {
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 50 * dt;
      p.life -= dt;
    }
    this.particles = this.particles.filter(p => p.life > 0);
  }

  private updateComboTexts(dt: number) {
    for (const ct of this.comboTexts) {
      ct.y += ct.vy * dt;
      ct.alpha -= dt * 0.8;
    }
    this.comboTexts = this.comboTexts.filter(ct => ct.alpha > 0);
  }

  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number, y: number,
    w: number, h: number,
    r: number
  ) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}
