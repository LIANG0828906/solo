import { GameEngine, PlayerId, Direction } from '../game/GameEngine';
import { Cell } from '../game/Board';
import {
  COLORS, DiceVisualState, createDiceVisual, updateDiceVisual,
  drawDice, drawDiceNumberPop, drawAttackProjectile, drawLowHpAura,
  updateParticles, drawParticles, spawnParticles,
  playDiceClick, playAttackHit, playEventSound,
} from './effects';

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private engine: GameEngine;
  private width = 0;
  private height = 0;
  private cellSize = 0;
  private boardOriginX = 0;
  private boardOriginY = 0;
  private boardSizePx = 0;
  private topBarHeight = 160;
  private backgroundCache: HTMLCanvasElement | null = null;
  private diceVisual: DiceVisualState | null = null;
  private lastFrameTime = 0;
  private frameElapsed = 0;
  private lastDiceAudioTime = 0;
  private lastEventTriggered: string | null = null;
  private gameOverStartTime = 0;
  private onDirectionInput?: (dir: Direction) => void;

  constructor(canvas: HTMLCanvasElement, engine: GameEngine) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    this.ctx = ctx;
    this.engine = engine;
    this.resize();
    window.addEventListener('resize', this.onResize.bind(this));
  }

  public setDirectionHandler(handler: (dir: Direction) => void): void {
    this.onDirectionInput = handler;
  }

  private onResize(): void {
    this.resize();
    this.backgroundCache = null;
  }

  private resize(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const viewW = window.innerWidth;
    const viewH = window.innerHeight;
    this.canvas.style.width = viewW + 'px';
    this.canvas.style.height = viewH + 'px';
    this.canvas.width = Math.floor(viewW * dpr);
    this.canvas.height = Math.floor(viewH * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.width = viewW;
    this.height = viewH;
    this.computeBoardLayout();
  }

  private computeBoardLayout(): void {
    const maxBoardW = this.width - 40;
    const maxBoardH = this.height - this.topBarHeight - 40;
    this.boardSizePx = Math.max(240, Math.min(maxBoardW, maxBoardH));
    this.cellSize = this.boardSizePx / 8;
    this.boardOriginX = (this.width - this.boardSizePx) / 2;
    this.boardOriginY = this.topBarHeight + (this.height - this.topBarHeight - this.boardSizePx) / 2;
  }

  private ensureBackgroundCache(): void {
    if (this.backgroundCache) return;
    const off = document.createElement('canvas');
    off.width = this.width;
    off.height = this.height;
    const octx = off.getContext('2d')!;
    this.drawWoodBackground(octx);
    this.drawBoardBase(octx);
    this.backgroundCache = off;
  }

  private drawWoodBackground(ctx: CanvasRenderingContext2D): void {
    const grad = ctx.createLinearGradient(0, 0, 0, this.height);
    grad.addColorStop(0, '#1a0f0a');
    grad.addColorStop(0.5, '#25160f');
    grad.addColorStop(1, '#120806');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.save();
    ctx.globalAlpha = 0.06;
    for (let i = 0; i < 80; i++) {
      const y = Math.random() * this.height;
      const h = 0.8 + Math.random() * 2.5;
      const w = this.width * (0.3 + Math.random() * 0.7);
      const x = Math.random() * (this.width - w);
      const shade = Math.random() < 0.5 ? '#000000' : '#8B4513';
      ctx.fillStyle = shade;
      ctx.fillRect(x, y, w, h);
    }
    ctx.restore();
  }

  private drawBoardBase(ctx: CanvasRenderingContext2D): void {
    const ox = this.boardOriginX;
    const oy = this.boardOriginY;
    const s = this.boardSizePx;

    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 30;
    ctx.shadowOffsetY = 10;
    ctx.fillStyle = COLORS.woodDark;
    this.roundRect(ctx, ox - 14, oy - 14, s + 28, s + 28, 12);
    ctx.fill();
    ctx.restore();

    const frameGrad = ctx.createLinearGradient(ox, oy, ox + s, oy + s);
    frameGrad.addColorStop(0, '#8B6914');
    frameGrad.addColorStop(0.5, COLORS.gold);
    frameGrad.addColorStop(1, '#8B6914');
    ctx.strokeStyle = frameGrad;
    ctx.lineWidth = 4;
    this.roundRect(ctx, ox - 10, oy - 10, s + 20, s + 20, 10);
    ctx.stroke();

    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        this.drawCell(ctx, x, y);
      }
    }

    this.drawStartMarkers(ctx);
  }

  private drawCell(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    const ox = this.boardOriginX + x * this.cellSize;
    const oy = this.boardOriginY + y * this.cellSize;
    const cs = this.cellSize;

    const isLight = (x + y) % 2 === 0;
    const c1 = isLight ? '#6D4C41' : '#5D4037';
    const c2 = isLight ? '#8D6E63' : '#6D4C41';
    const grad = ctx.createLinearGradient(ox, oy + cs, ox + cs, oy);
    grad.addColorStop(0, c1);
    grad.addColorStop(1, c2);
    ctx.fillStyle = grad;
    ctx.fillRect(ox, oy, cs, cs);

    ctx.save();
    ctx.globalAlpha = 0.12;
    const grainCount = 10;
    for (let i = 0; i < grainCount; i++) {
      const gx = ox + Math.random() * cs;
      const gy = oy + Math.random() * cs;
      const gs = 0.8 + Math.random() * 1.6;
      ctx.fillStyle = Math.random() < 0.5 ? '#000' : '#D4A574';
      ctx.fillRect(gx, gy, gs, gs);
    }
    ctx.restore();

    ctx.strokeStyle = 'rgba(255, 215, 0, 0.28)';
    ctx.lineWidth = 1;
    ctx.strokeRect(ox + 0.5, oy + 0.5, cs - 1, cs - 1);
  }

  private drawStartMarkers(ctx: CanvasRenderingContext2D): void {
    const positions: [number, number, string][] = [
      [0, 0, COLORS.red],
      [7, 7, COLORS.blue],
    ];
    positions.forEach(([x, y, color]) => {
      const ox = this.boardOriginX + x * this.cellSize;
      const oy = this.boardOriginY + y * this.cellSize;
      const cs = this.cellSize;
      const inset = cs * 0.12;
      const size = cs * 0.14;
      this.drawCrown(ctx, ox + inset, oy + inset, size, color);
      this.drawCrown(ctx, ox + cs - inset - size, oy + inset, size, color);
      this.drawCrown(ctx, ox + inset, oy + cs - inset - size, size, color);
      this.drawCrown(ctx, ox + cs - inset - size, oy + cs - inset - size, size, color);
    });
  }

  private drawCrown(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color: string): void {
    ctx.save();
    ctx.fillStyle = COLORS.gold;
    ctx.strokeStyle = COLORS.goldDark;
    ctx.lineWidth = 1;
    ctx.shadowColor = color;
    ctx.shadowBlur = s * 0.4;
    ctx.beginPath();
    ctx.moveTo(x, y + s);
    ctx.lineTo(x, y + s * 0.4);
    ctx.lineTo(x + s * 0.25, y + s * 0.7);
    ctx.lineTo(x + s * 0.5, y);
    ctx.lineTo(x + s * 0.75, y + s * 0.7);
    ctx.lineTo(x + s, y + s * 0.4);
    ctx.lineTo(x + s, y + s);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  public handleKey(e: KeyboardEvent): void {
    const dirMap: Record<string, Direction> = {
      ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
      w: 'up', s: 'down', a: 'left', d: 'right',
      W: 'up', S: 'down', A: 'left', D: 'right',
    };
    const dir = dirMap[e.key];
    if (dir && this.onDirectionInput) {
      e.preventDefault();
      this.onDirectionInput(dir);
    }
  }

  private roundRect(
    ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number
  ): void {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  public render(time: number): void {
    const dt = Math.min(50, time - this.lastFrameTime);
    this.lastFrameTime = time;
    this.frameElapsed += dt;

    this.engine.update(dt);
    updateParticles(dt);
    this.handleDiceAudio();
    this.handleEventSounds();
    this.handleAttackSounds();
    this.ensureBackgroundCache();

    this.ctx.clearRect(0, 0, this.width, this.height);
    if (this.backgroundCache) {
      this.ctx.drawImage(this.backgroundCache, 0, 0);
    }

    this.drawCellEvents();
    this.drawHighlightedCell();
    this.drawMovePath();
    this.drawPlayers();
    this.drawAttackFX();
    this.drawDiceEffects();
    drawParticles(this.ctx);
    this.drawTopBar();
    this.drawControlsHint();
    this.drawGameOver();
  }

  private handleDiceAudio(): void {
    if (this.engine.dice && this.engine.phase === 'diceRolling') {
      const elapsed = performance.now() - this.engine.dice.rollStartTime;
      if (elapsed - this.lastDiceAudioTime > 130 && elapsed < 1500) {
        playDiceClick(0.6 + Math.random() * 0.6);
        this.lastDiceAudioTime = elapsed;
      }
      if (elapsed >= 1050 && this.lastDiceAudioTime < 1050) {
        playDiceClick(1.2);
        this.lastDiceAudioTime = 1050;
      }
    }
  }

  private handleEventSounds(): void {
    if (this.engine.currentEvent && this.engine.phase === 'eventTriggering') {
      const key = `${this.engine.currentEvent.cell.x},${this.engine.currentEvent.cell.y},${this.engine.currentEvent.type}`;
      if (this.lastEventTriggered !== key) {
        const t = this.engine.currentEvent.type;
        if (t) playEventSound(t);
        this.lastEventTriggered = key;
      }
    } else {
      this.lastEventTriggered = null;
    }
  }

  private handleAttackSounds(): void {
    if (this.engine.currentAttack && this.engine.phase === 'attacking') {
      const elapsed = performance.now() - this.engine.currentAttack.startTime;
      if (elapsed > 500 && elapsed < 530) {
        playAttackHit();
      }
    }
  }

  private drawCellEvents(): void {
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const cell = this.engine.board.getCell(x, y);
        if (!cell || !cell.eventActive || !cell.eventType) continue;
        this.drawCellEvent(cell);
      }
    }
  }

  private drawCellEvent(cell: Cell): void {
    const ox = this.boardOriginX + cell.x * this.cellSize;
    const oy = this.boardOriginY + cell.y * this.cellSize;
    const cs = this.cellSize;
    const time = this.frameElapsed;
    const blink = 0.6 + Math.sin(time * 0.012) * 0.4;

    let color = COLORS.trap;
    let symbol = '!';
    if (cell.eventType === 'boost') { color = COLORS.boost; symbol = '»'; }
    else if (cell.eventType === 'heal') { color = COLORS.heal; symbol = '+'; }

    this.ctx.save();
    this.ctx.globalAlpha = 0.35 + blink * 0.3;
    this.ctx.fillStyle = color;
    this.ctx.fillRect(ox, oy, cs, cs);
    this.ctx.restore();

    this.ctx.save();
    this.ctx.translate(ox + cs / 2, oy + cs / 2);
    const scale = 0.9 + Math.sin(time * 0.01) * 0.15;
    this.ctx.scale(scale, scale);
    this.ctx.globalAlpha = 0.95;

    if (cell.eventType === 'heal') {
      this.ctx.fillStyle = COLORS.heal;
      this.ctx.shadowColor = COLORS.heal;
      this.ctx.shadowBlur = 16;
      const barW = cs * 0.42;
      const barH = cs * 0.12;
      this.ctx.fillRect(-barW / 2, -barH / 2, barW, barH);
      this.ctx.fillRect(-barH / 2, -barW / 2, barH, barW);
    } else if (cell.eventType === 'boost') {
      this.ctx.fillStyle = COLORS.boost;
      this.ctx.shadowColor = COLORS.boost;
      this.ctx.shadowBlur = 16;
      this.ctx.beginPath();
      this.ctx.moveTo(-cs * 0.08, -cs * 0.25);
      this.ctx.lineTo(cs * 0.12, -cs * 0.02);
      this.ctx.lineTo(-cs * 0.02, -cs * 0.02);
      this.ctx.lineTo(cs * 0.08, cs * 0.25);
      this.ctx.lineTo(-cs * 0.12, cs * 0.02);
      this.ctx.lineTo(cs * 0.02, cs * 0.02);
      this.ctx.closePath();
      this.ctx.fill();
    } else {
      this.ctx.fillStyle = COLORS.trap;
      this.ctx.shadowColor = COLORS.trap;
      this.ctx.shadowBlur = 16;
      this.ctx.beginPath();
      this.ctx.moveTo(0, -cs * 0.28);
      this.ctx.lineTo(cs * 0.25, cs * 0.22);
      this.ctx.lineTo(-cs * 0.25, cs * 0.22);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.shadowBlur = 0;
      this.ctx.font = `bold ${cs * 0.22}px Georgia, serif`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText('!', 0, cs * 0.06);
    }
    this.ctx.restore();
  }

  private drawHighlightedCell(): void {
    const cell = this.engine.highlightedCell;
    if (!cell) return;
    const ox = this.boardOriginX + cell.x * this.cellSize;
    const oy = this.boardOriginY + cell.y * this.cellSize;
    const cs = this.cellSize;
    const time = this.frameElapsed;
    const pulse = 0.6 + Math.sin(time * 0.01) * 0.4;
    const color = this.engine.currentPlayer === 'red' ? COLORS.red : COLORS.blue;

    this.ctx.save();
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 3;
    this.ctx.globalAlpha = 0.5 + pulse * 0.5;
    this.ctx.shadowColor = color;
    this.ctx.shadowBlur = 12;
    this.roundRect(this.ctx, ox + 2, oy + 2, cs - 4, cs - 4, 4);
    this.ctx.stroke();
    this.ctx.restore();
  }

  private drawMovePath(): void {
    const path = this.engine.movePath;
    if (path.length < 2) return;
    const color = this.engine.currentPlayer === 'red' ? COLORS.red : COLORS.blue;

    this.ctx.save();
    this.ctx.strokeStyle = color;
    this.ctx.globalAlpha = 0.55;
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([8, 6]);
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    this.ctx.beginPath();
    path.forEach((p, i) => {
      const cx = this.boardOriginX + p.x * this.cellSize + this.cellSize / 2;
      const cy = this.boardOriginY + p.y * this.cellSize + this.cellSize / 2;
      if (i === 0) this.ctx.moveTo(cx, cy);
      else this.ctx.lineTo(cx, cy);
    });
    this.ctx.stroke();
    this.ctx.restore();
  }

  private drawPlayers(): void {
    (['red', 'blue'] as PlayerId[]).forEach(id => {
      this.drawPlayer(id);
    });
  }

  private drawPlayer(id: PlayerId): void {
    const p = this.engine.players[id];
    let cx = this.boardOriginX + p.x * this.cellSize + this.cellSize / 2;
    let cy = this.boardOriginY + p.y * this.cellSize + this.cellSize / 2;

    if (p.hitShakeTime > 0) {
      const intensity = (p.hitShakeTime / 300) * 3;
      cx += (Math.random() - 0.5) * intensity * 2;
      cy += (Math.random() - 0.5) * intensity * 2;
    }

    const radius = this.cellSize * 0.34;
    const color = id === 'red' ? COLORS.red : COLORS.blue;
    const colorLight = id === 'red' ? COLORS.redLight : COLORS.blueLight;

    if (p.hp < 3 && p.hp > 0) {
      drawLowHpAura(this.ctx, cx, cy, radius, this.frameElapsed);
    }

    this.ctx.save();
    this.ctx.shadowColor = 'rgba(0,0,0,0.6)';
    this.ctx.shadowBlur = 10;
    this.ctx.shadowOffsetY = 4;

    const grad = this.ctx.createRadialGradient(
      cx - radius * 0.3, cy - radius * 0.3, radius * 0.1,
      cx, cy, radius
    );
    grad.addColorStop(0, colorLight);
    grad.addColorStop(0.6, color);
    grad.addColorStop(1, id === 'red' ? '#922B21' : '#1F618D');

    let fillColor: string | CanvasGradient = grad;
    if (p.hitFlashTime > 0) {
      const a = p.hitFlashTime / 300;
      fillColor = `rgba(255, 80, 80, ${0.5 + a * 0.5})`;
    }

    this.ctx.fillStyle = fillColor;
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();

    this.ctx.save();
    this.ctx.strokeStyle = '#FFD700';
    this.ctx.lineWidth = 2;
    this.ctx.globalAlpha = 0.7;
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    this.ctx.stroke();
    this.ctx.restore();

    this.ctx.save();
    this.ctx.fillStyle = '#FFFFFF';
    const eyeY = cy - radius * 0.05;
    const eyeSpacing = radius * 0.3;
    const eyeR = radius * 0.13;
    this.ctx.beginPath();
    this.ctx.arc(cx - eyeSpacing, eyeY, eyeR, 0, Math.PI * 2);
    this.ctx.arc(cx + eyeSpacing, eyeY, eyeR, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.fillStyle = '#000000';
    this.ctx.beginPath();
    this.ctx.arc(cx - eyeSpacing + 1, eyeY + 1, eyeR * 0.5, 0, Math.PI * 2);
    this.ctx.arc(cx + eyeSpacing + 1, eyeY + 1, eyeR * 0.5, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();

    this.drawHealthBar(cx, cy - radius - 14, p.displayHp / p.maxHp, id);
  }

  private drawHealthBar(cx: number, cy: number, ratio: number, id: PlayerId): void {
    const w = 40;
    const h = 6;
    const x = cx - w / 2;
    const r = Math.max(0, Math.min(1, ratio));

    this.ctx.save();
    this.ctx.fillStyle = 'rgba(0,0,0,0.65)';
    this.roundRect(this.ctx, x - 1, cy - 1, w + 2, h + 2, 3);
    this.ctx.fill();
    this.ctx.strokeStyle = 'rgba(255,215,0,0.5)';
    this.ctx.lineWidth = 1;
    this.roundRect(this.ctx, x, cy, w, h, 2);
    this.ctx.stroke();

    const grad = this.ctx.createLinearGradient(x, cy, x, cy + h);
    if (r > 0.5) {
      grad.addColorStop(0, '#58D68D');
      grad.addColorStop(1, COLORS.heal);
    } else if (r > 0.25) {
      grad.addColorStop(0, '#F7DC6F');
      grad.addColorStop(1, '#F39C12');
    } else {
      grad.addColorStop(0, '#F1948A');
      grad.addColorStop(1, COLORS.trap);
    }
    this.ctx.fillStyle = grad;
    this.roundRect(this.ctx, x, cy, Math.max(0, w * r), h, 2);
    this.ctx.fill();
    this.ctx.restore();
  }

  private drawAttackFX(): void {
    if (!this.engine.currentAttack) return;
    const atk = this.engine.currentAttack;
    const elapsed = performance.now() - atk.startTime;
    const progress = Math.min(1, elapsed / 600);
    if (progress >= 1) return;

    const fromP = this.engine.players[atk.attacker];
    const toP = this.engine.players[atk.defender];
    const fromX = this.boardOriginX + fromP.x * this.cellSize + this.cellSize / 2;
    const fromY = this.boardOriginY + fromP.y * this.cellSize + this.cellSize / 2;
    const toX = this.boardOriginX + toP.x * this.cellSize + this.cellSize / 2;
    const toY = this.boardOriginY + toP.y * this.cellSize + this.cellSize / 2;

    drawAttackProjectile(
      this.ctx, fromX, fromY, toX, toY, progress,
      atk.attacker, this.cellSize
    );
  }

  private drawDiceEffects(): void {
    const dice = this.engine.dice;
    if (!dice) return;
    const centerX = this.width / 2;
    const rollCenterY = this.boardOriginY + this.boardSizePx / 2;
    const diceSize = Math.min(72, this.cellSize * 1.2);

    if (this.engine.phase === 'diceRolling') {
      const elapsed = performance.now() - dice.rollStartTime;
      if (!this.diceVisual) {
        this.diceVisual = createDiceVisual(
          centerX,
          -diceSize * 2,
          dice.value,
          this.engine.currentPlayer
        );
      }
      updateDiceVisual(this.diceVisual, elapsed, 1500, rollCenterY, diceSize);
      drawDice(this.ctx, this.diceVisual, dice.value, diceSize, this.engine.currentPlayer, 0);
    } else if (this.engine.phase === 'diceHolding') {
      const holdElapsed = performance.now() - dice.holdStartTime;
      if (!this.diceVisual) {
        this.diceVisual = createDiceVisual(
          centerX,
          rollCenterY,
          dice.value,
          this.engine.currentPlayer
        );
        this.diceVisual.showValue = true;
        this.diceVisual.landed = true;
        this.diceVisual.bounced = true;
      }
      this.diceVisual.x = centerX;
      this.diceVisual.y = rollCenterY;
      this.diceVisual.showValue = true;
      this.diceVisual.landed = true;
      this.diceVisual.scale = 1.0 + Math.sin(holdElapsed * 0.005) * 0.03;
      drawDice(this.ctx, this.diceVisual, dice.value, diceSize, this.engine.currentPlayer, holdElapsed);

      if (dice.phase === 'numberPop' && dice.popStartTime > 0) {
        const popElapsed = performance.now() - dice.popStartTime;
        drawDiceNumberPop(this.ctx, centerX, rollCenterY, dice.value, popElapsed, this.engine.currentPlayer);
      }
    } else {
      this.diceVisual = null;
    }
  }

  private drawTopBar(): void {
    const ctx = this.ctx;
    const barY = 20;

    ctx.save();
    const headerGrad = ctx.createLinearGradient(0, barY, 0, barY + this.topBarHeight - 20);
    headerGrad.addColorStop(0, 'rgba(20, 10, 6, 0.9)');
    headerGrad.addColorStop(1, 'rgba(20, 10, 6, 0.6)');
    ctx.fillStyle = headerGrad;
    this.roundRect(ctx, 20, barY, this.width - 40, this.topBarHeight - 30, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
    ctx.lineWidth = 1;
    this.roundRect(ctx, 20, barY, this.width - 40, this.topBarHeight - 30, 10);
    ctx.stroke();
    ctx.restore();

    this.drawPlayerStatus(40, barY + 14, 'red');
    this.drawPlayerStatus(this.width - 220, barY + 14, 'blue');
    this.drawTurnInfo(barY + 18);
    this.drawEventLog(40, barY + 70);
    this.drawMovesInfo(this.width - 220, barY + 70);
  }

  private drawPlayerStatus(x: number, y: number, id: PlayerId): void {
    const ctx = this.ctx;
    const p = this.engine.players[id];
    const color = id === 'red' ? COLORS.red : COLORS.blue;
    const name = this.engine.playerName(id);

    ctx.save();
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(x + 16, y + 16, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(x + 10, y + 14, 3, 0, Math.PI * 2);
    ctx.arc(x + 22, y + 14, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px Georgia, "SimSun", serif';
    ctx.textBaseline = 'middle';
    ctx.fillText(name, x + 42, y + 8);

    const barW = 140, barH = 10;
    const bx = x + 42, by = y + 20;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    this.roundRect(ctx, bx, by, barW, barH, 4);
    ctx.fill();
    const r = Math.max(0, p.displayHp / p.maxHp);
    const grad = ctx.createLinearGradient(bx, by, bx, by + barH);
    if (r > 0.5) { grad.addColorStop(0, '#58D68D'); grad.addColorStop(1, COLORS.heal); }
    else if (r > 0.25) { grad.addColorStop(0, '#F7DC6F'); grad.addColorStop(1, '#F39C12'); }
    else { grad.addColorStop(0, '#F1948A'); grad.addColorStop(1, COLORS.trap); }
    ctx.fillStyle = grad;
    this.roundRect(ctx, bx, by, Math.max(0, barW * r), barH, 4);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,215,0,0.4)';
    ctx.lineWidth = 1;
    this.roundRect(ctx, bx, by, barW, barH, 4);
    ctx.stroke();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 11px Arial, sans-serif';
    ctx.fillText(`${Math.ceil(p.displayHp)}/${p.maxHp}`, bx + barW + 6, by + 5);
    ctx.restore();
  }

  private drawTurnInfo(y: number): void {
    const ctx = this.ctx;
    const cx = this.width / 2;
    const color = this.engine.currentPlayer === 'red' ? COLORS.red : COLORS.blue;
    const name = this.engine.playerName(this.engine.currentPlayer);
    const phase = this.engine.phase;

    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.font = 'bold 18px Georgia, "SimSun", serif';
    ctx.fillText(`${name}回合`, cx, y);

    let info = '';
    if (phase === 'diceRolling') info = '骰子滚动中...';
    else if (phase === 'diceHolding') info = this.engine.dice ? `骰子: ${this.engine.dice.value}` : '';
    else if (phase === 'moving') info = `剩余步数: ${this.engine.movesLeft}`;
    else if (phase === 'attacking') info = '攻击中!';
    else if (phase === 'eventTriggering') info = '触发事件!';
    else if (phase === 'gameOver') info = '游戏结束';
    else if (phase === 'idle') info = '按任意方向键开始';

    ctx.fillStyle = '#FFFFFF';
    ctx.shadowBlur = 4;
    ctx.font = '13px Georgia, "SimSun", serif';
    ctx.fillText(info, cx, y + 22);
    ctx.restore();
  }

  private drawEventLog(x: number, y: number): void {
    const ctx = this.ctx;
    const logs = this.engine.logs;
    const maxShow = 5;
    const start = Math.max(0, logs.length - maxShow);

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    this.roundRect(ctx, x, y, 240, 78, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,215,0,0.2)';
    ctx.lineWidth = 1;
    this.roundRect(ctx, x, y, 240, 78, 6);
    ctx.stroke();

    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 11px Georgia, "SimSun", serif';
    ctx.fillText('事件日志', x + 8, y + 12);

    ctx.font = '10.5px Arial, "SimSun", sans-serif';
    ctx.textBaseline = 'top';
    for (let i = 0; i < maxShow && start + i < logs.length; i++) {
      const log = logs[start + i];
      const idx = i;
      ctx.fillStyle = log.color || '#FFFFFF';
      const alpha = 0.55 + (idx / maxShow) * 0.45;
      ctx.globalAlpha = alpha;
      ctx.fillText('• ' + log.text, x + 10, y + 20 + idx * 12);
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  private drawMovesInfo(x: number, y: number): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    this.roundRect(ctx, x, y, 180, 78, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,215,0,0.2)';
    ctx.lineWidth = 1;
    this.roundRect(ctx, x, y, 180, 78, 6);
    ctx.stroke();

    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 11px Georgia, "SimSun", serif';
    ctx.fillText('操作提示', x + 8, y + 12);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '10.5px Arial, "SimSun", sans-serif';
    ctx.textBaseline = 'top';
    const lines = [
      '方向键/WASD 移动角色',
      '相邻对手自动攻击',
      `当前骰子: ${this.engine.dice?.value ?? '-'}`
    ];
    lines.forEach((l, i) => ctx.fillText(l, x + 10, y + 22 + i * 15));
    ctx.restore();
  }

  private drawControlsHint(): void {
    if (this.engine.phase !== 'idle') return;
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = 0.85 + Math.sin(this.frameElapsed * 0.005) * 0.15;
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    const w = 320, h = 60;
    const x = this.width / 2 - w / 2;
    const y = this.boardOriginY + this.boardSizePx + 20;
    this.roundRect(ctx, x, y, w, h, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,215,0,0.5)';
    ctx.lineWidth = 1;
    this.roundRect(ctx, x, y, w, h, 8);
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 15px Georgia, "SimSun", serif';
    ctx.fillText('骰子争锋', this.width / 2, y + 22);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '12px Arial, "SimSun", sans-serif';
    ctx.fillText('按任意方向键 / WASD 开始游戏', this.width / 2, y + 42);
    ctx.restore();
  }

  private drawGameOver(): void {
    if (this.engine.phase !== 'gameOver' || !this.engine.winner) return;
    if (this.gameOverStartTime === 0) {
      this.gameOverStartTime = performance.now();
      const cx = this.width / 2;
      const cy = this.height / 2;
      const palette = this.engine.winner === 'red'
        ? [COLORS.red, COLORS.redLight, '#FFFFFF', '#FFD700', '#FF6347']
        : [COLORS.blue, COLORS.blueLight, '#FFFFFF', '#FFD700', '#00CED1'];
      for (let i = 0; i < 10; i++) {
        setTimeout(() => {
          spawnParticles(
            cx + (Math.random() - 0.5) * 300,
            cy + (Math.random() - 0.5) * 200,
            14,
            { colorPalette: palette, size: 4, maxLife: 1200, gravity: 0.04, vx: 4, vy: -3 }
          );
        }, i * 80);
      }
    }

    const elapsed = performance.now() - this.gameOverStartTime;
    const ctx = this.ctx;
    const winner = this.engine.winner;
    const color = winner === 'red' ? COLORS.red : COLORS.blue;
    const colorLight = winner === 'red' ? COLORS.redLight : COLORS.blueLight;

    ctx.save();
    const maskAlpha = Math.min(1, elapsed / 400);
    ctx.fillStyle = `rgba(5, 2, 1, ${0.75 * maskAlpha})`;
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.restore();

    const cx = this.width / 2;
    const cy = this.height / 2;
    let textScale = 1;
    if (elapsed < 600) {
      const t = elapsed / 600;
      if (t < 0.7) textScale = 0.3 + (t / 0.7) * 0.9;
      else textScale = 1.2 - ((t - 0.7) / 0.3) * 0.2;
    }

    if (elapsed > 300) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(textScale, textScale);
      ctx.globalAlpha = Math.min(1, (elapsed - 300) / 200);

      for (let i = 0; i < 3; i++) {
        const r = 100 + i * 20 + Math.sin(elapsed * 0.003) * 8;
        const alpha = (0.25 - i * 0.07);
        const g = ctx.createRadialGradient(0, 0, 20, 0, 0, r);
        g.addColorStop(0, `${winner === 'red' ? '231,76,60' : '52,152,219'}, ${alpha + 0.1}`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeStyle = 'rgba(0,0,0,0.7)';
      ctx.lineWidth = 8;
      ctx.font = 'bold 52px Georgia, "SimSun", serif';
      const winText = `${this.engine.playerName(winner)}获胜!`;
      ctx.strokeText(winText, 0, 0);

      const textGrad = ctx.createLinearGradient(0, -40, 0, 40);
      textGrad.addColorStop(0, '#FFFFFF');
      textGrad.addColorStop(0.4, colorLight);
      textGrad.addColorStop(1, color);
      ctx.fillStyle = textGrad;
      ctx.shadowColor = color;
      ctx.shadowBlur = 24;
      ctx.fillText(winText, 0, 0);

      ctx.shadowBlur = 0;
      ctx.fillStyle = '#DDDDDD';
      ctx.font = '14px Arial, "SimSun", sans-serif';
      ctx.fillText('刷新页面重新开始', 0, 58);
      ctx.restore();
    }
  }
}
