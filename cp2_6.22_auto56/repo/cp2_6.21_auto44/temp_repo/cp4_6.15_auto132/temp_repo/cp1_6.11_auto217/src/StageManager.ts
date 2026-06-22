import { ShadowPuppet, Point } from './ShadowPuppet';

export interface ActionButton {
  id: 'up' | 'down' | 'attack' | 'block';
  label: string;
  icon: string;
  x: number;
  y: number;
  radius: number;
  pressed: boolean;
  pressedAt: number;
}

export type GameState = 'playing' | 'ended';
export type Winner = 'wusong' | 'tiger' | null;

export interface OilLamp {
  x: number;
  y: number;
  radius: number;
  angle: number;
  dragging: boolean;
}

export interface EndPanel {
  visible: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  restartButton: { x: number; y: number; w: number; h: number; hovered: boolean };
}

export class StageManager {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  public wusong: ShadowPuppet;
  public tiger: ShadowPuppet;
  public lamp: OilLamp;
  public gameState: GameState;
  public winner: Winner;
  public round: number;
  public combo: number;
  public lastHitTime: number;
  public comboFlash: { active: boolean; startTime: number; duration: number };

  public actionButtons: ActionButton[];
  public showButtons: boolean;
  public mousePos: Point;

  public endPanel: EndPanel;

  public statusBar: {
    x: number;
    y: number;
    width: number;
    height: number;
  };

  public curtainWave: number = 0;
  private lastTigerAttack: number = 0;
  private nextTigerDelay: number = 2000 + Math.random() * 2000;
  private tigerTarget: Point | null = null;

  private woodPattern: HTMLCanvasElement | null = null;
  private paperPattern: HTMLCanvasElement | null = null;

  private readonly STAGE_W = 900;
  private readonly STAGE_H = 600;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context not available');
    this.ctx = ctx;

    const wusongStartX = 300;
    const tigerStartX = 600;
    const groundY = 480;

    this.wusong = new ShadowPuppet('wusong', wusongStartX, groundY);
    this.tiger = new ShadowPuppet('tiger', tigerStartX, groundY - 10);

    this.lamp = {
      x: 450,
      y: 60,
      radius: 15,
      angle: 90,
      dragging: false
    };

    this.gameState = 'playing';
    this.winner = null;
    this.round = 1;
    this.combo = 0;
    this.lastHitTime = 0;
    this.comboFlash = { active: false, startTime: 0, duration: 2000 };

    this.actionButtons = [
      { id: 'up', label: '上', icon: '↑', x: 0, y: 0, radius: 20, pressed: false, pressedAt: 0 },
      { id: 'down', label: '下', icon: '↓', x: 0, y: 0, radius: 20, pressed: false, pressedAt: 0 },
      { id: 'attack', label: '攻', icon: '⚔', x: 0, y: 0, radius: 20, pressed: false, pressedAt: 0 },
      { id: 'block', label: '防', icon: '◈', x: 0, y: 0, radius: 20, pressed: false, pressedAt: 0 }
    ];
    this.showButtons = false;
    this.mousePos = { x: -1, y: -1 };

    this.endPanel = {
      visible: false,
      x: 250,
      y: 180,
      width: 400,
      height: 300,
      restartButton: { x: 320, y: 380, w: 160, h: 48, hovered: false }
    };

    this.statusBar = {
      x: 50,
      y: 600,
      width: 800,
      height: 60
    };

    this.createPatterns();
  }

  private createPatterns(): void {
    const wood = document.createElement('canvas');
    wood.width = 100;
    wood.height = 100;
    const wctx = wood.getContext('2d')!;
    const grad = wctx.createLinearGradient(0, 0, 100, 100);
    grad.addColorStop(0, '#8B4513');
    grad.addColorStop(0.3, '#A0522D');
    grad.addColorStop(0.6, '#8B4513');
    grad.addColorStop(1, '#6B3410');
    wctx.fillStyle = grad;
    wctx.fillRect(0, 0, 100, 100);
    wctx.strokeStyle = 'rgba(60, 20, 0, 0.3)';
    wctx.lineWidth = 1;
    for (let i = 0; i < 12; i++) {
      wctx.beginPath();
      const y = Math.random() * 100;
      wctx.moveTo(0, y);
      wctx.bezierCurveTo(25, y + (Math.random() - 0.5) * 8, 50, y + (Math.random() - 0.5) * 8, 100, y + (Math.random() - 0.5) * 6);
      wctx.stroke();
    }
    this.woodPattern = wood;

    const paper = document.createElement('canvas');
    paper.width = 900;
    paper.height = 600;
    const pctx = paper.getContext('2d')!;
    pctx.fillStyle = 'rgba(255, 252, 245, 0.95)';
    pctx.fillRect(0, 0, 900, 600);

    const drawWindowPattern = (cx: number, cy: number, size: number) => {
      pctx.strokeStyle = 'rgba(139, 37, 0, 0.06)';
      pctx.lineWidth = 1;
      const s = size;
      for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * Math.PI * 2;
        pctx.beginPath();
        pctx.moveTo(cx, cy);
        pctx.lineTo(cx + Math.cos(ang) * s, cy + Math.sin(ang) * s);
        pctx.stroke();
      }
      pctx.strokeRect(cx - s, cy - s, s * 2, s * 2);
      pctx.beginPath();
      pctx.moveTo(cx - s, cy);
      pctx.lineTo(cx + s, cy);
      pctx.moveTo(cx, cy - s);
      pctx.lineTo(cx, cy + s);
      pctx.stroke();
      pctx.beginPath();
      pctx.arc(cx, cy, s * 0.5, 0, Math.PI * 2);
      pctx.stroke();
      pctx.beginPath();
      pctx.moveTo(cx - s * 0.7, cy - s * 0.7);
      pctx.lineTo(cx + s * 0.7, cy + s * 0.7);
      pctx.moveTo(cx + s * 0.7, cy - s * 0.7);
      pctx.lineTo(cx - s * 0.7, cy + s * 0.7);
      pctx.stroke();
    };

    for (let gy = 60; gy < 600; gy += 120) {
      for (let gx = 60; gx < 900; gx += 120) {
        drawWindowPattern(gx, gy, 40);
      }
    }
    this.paperPattern = paper;
  }

  public reset(): void {
    this.wusong.reset(300, 480);
    this.tiger.reset(600, 470);
    this.gameState = 'playing';
    this.winner = null;
    this.round = 1;
    this.combo = 0;
    this.lastHitTime = 0;
    this.comboFlash.active = false;
    this.endPanel.visible = false;
    this.lastTigerAttack = 0;
    this.nextTigerDelay = 2000 + Math.random() * 2000;
    this.tigerTarget = null;
  }

  public handleMouseMove(x: number, y: number): void {
    this.mousePos = { x, y };

    if (this.lamp.dragging) {
      this.lamp.x = Math.max(40, Math.min(this.STAGE_W - 40, x));
      this.lamp.y = Math.max(30, Math.min(120, y));
      const dx = x - 450;
      const dy = y - 300;
      this.lamp.angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    }

    if (this.gameState === 'playing') {
      const hoverWusong = this.wusong.containsPoint(x, y);
      this.showButtons = hoverWusong;

      if (hoverWusong) {
        this.updateButtonPositions();
      }
    }

    if (this.endPanel.visible) {
      const btn = this.endPanel.restartButton;
      btn.hovered =
        x >= btn.x && x <= btn.x + btn.w &&
        y >= btn.y && y <= btn.y + btn.h;
    }
  }

  public handleMouseDown(x: number, y: number): void {
    const dist = Math.sqrt((x - this.lamp.x) ** 2 + (y - this.lamp.y) ** 2);
    if (dist <= this.lamp.radius + 10) {
      this.lamp.dragging = true;
      return;
    }

    if (this.gameState === 'playing' && this.showButtons) {
      for (const btn of this.actionButtons) {
        const d = Math.sqrt((x - btn.x) ** 2 + (y - btn.y) ** 2);
        if (d <= btn.radius) {
          btn.pressed = true;
          btn.pressedAt = performance.now();
          this.executeAction(btn.id);
          return;
        }
      }
    }

    if (this.endPanel.visible) {
      const btn = this.endPanel.restartButton;
      if (x >= btn.x && x <= btn.x + btn.w &&
          y >= btn.y && y <= btn.y + btn.h) {
        this.reset();
      }
    }
  }

  public handleMouseUp(): void {
    this.lamp.dragging = false;
    for (const btn of this.actionButtons) {
      btn.pressed = false;
    }
  }

  private updateButtonPositions(): void {
    const wx = this.wusong.x;
    const wy = this.wusong.y - this.wusong.height / 2;
    const offset = 70;

    this.actionButtons[0].x = wx;
    this.actionButtons[0].y = wy - offset;
    this.actionButtons[1].x = wx;
    this.actionButtons[1].y = wy + offset;
    this.actionButtons[2].x = wx + offset;
    this.actionButtons[2].y = wy;
    this.actionButtons[3].x = wx - offset;
    this.actionButtons[3].y = wy;
  }

  private executeAction(action: 'up' | 'down' | 'attack' | 'block'): void {
    const now = performance.now();

    switch (action) {
      case 'up':
        this.wusong.startMove(0, -40, 300, now);
        break;
      case 'down':
        this.wusong.startMove(0, 40, 300, now);
        break;
      case 'attack':
        if (this.wusong.startAttack(now)) {
          setTimeout(() => this.checkWusongHit(now + 150), 150);
        }
        break;
      case 'block':
        this.wusong.startBlock(now);
        break;
    }
  }

  private checkWusongHit(_startTime: number): void {
    if (this.gameState !== 'playing') return;
    const now = performance.now();
    if (this.wusong.checkCollision(this.tiger, 35)) {
      this.tiger.takeHit(2, 60, now);
      this.combo++;
      this.round++;
      this.lastHitTime = now;

      if (this.combo > 3) {
        this.comboFlash.active = true;
        this.comboFlash.startTime = now;
      }

      if (this.tiger.hp <= 0) {
        this.endGame('wusong');
      }
    }
  }

  private triggerTigerAI(now: number): void {
    if (this.gameState !== 'playing') return;

    const directions = [
      { dx: -100, dy: 0 },
      { dx: 0, dy: -30 },
      { dx: 0, dy: 30 }
    ];
    const dir = directions[Math.floor(Math.random() * directions.length)];

    this.tiger.facingRight = false;
    if (this.tiger.startAttack(now)) {
      this.tigerTarget = {
        x: this.wusong.x + 80 + dir.dx * 0.3,
        y: this.tiger.y + dir.dy
      };

      const checkDelay = 100;
      setTimeout(() => this.checkTigerHit(now + checkDelay), checkDelay);
    }
  }

  private checkTigerHit(_startTime: number): void {
    if (this.gameState !== 'playing') return;
    const now = performance.now();

    if (this.tigerTarget) {
      const speed = 100;
      const dx = this.tigerTarget.x - this.tiger.x;
      const dy = this.tigerTarget.y - this.tiger.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const duration = Math.min(400, (dist / speed) * 1000);
      this.tiger.startMove(dx, dy, duration, now);
      this.tigerTarget = null;
    }

    if (this.tiger.checkCollision(this.wusong, 10)) {
      if (this.wusong.isBlocking(now)) {
        this.tiger.takeHit(1, 80, now);
        this.round++;
      } else {
        this.wusong.takeHit(2, 30, now);
        this.combo = 0;
        this.round++;
      }
    }

    if (this.tiger.hp <= 0) {
      this.endGame('wusong');
    } else if (this.wusong.hp <= 0) {
      this.endGame('tiger');
    }
  }

  private endGame(winner: Winner): void {
    this.gameState = 'ended';
    this.winner = winner;
    this.endPanel.visible = true;
  }

  public update(delta: number, now: number): void {
    this.curtainWave += delta * 0.002;

    this.wusong.update(delta, now);
    this.tiger.update(delta, now);

    if (this.gameState === 'playing') {
      if (now - this.lastTigerAttack > this.nextTigerDelay &&
          this.tiger.animation.state === 'idle') {
        this.triggerTigerAI(now);
        this.lastTigerAttack = now;
        this.nextTigerDelay = 2000 + Math.random() * 2000;
      }

      if (this.comboFlash.active) {
        if (now - this.comboFlash.startTime >= this.comboFlash.duration) {
          this.comboFlash.active = false;
        }
      }

      if (now - this.lastHitTime > 2500 && this.combo > 0) {
        this.combo = 0;
      }
    }

    for (const btn of this.actionButtons) {
      if (btn.pressed && now - btn.pressedAt > 150) {
        btn.pressed = false;
      }
    }
  }

  public draw(now: number): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawStageBackground();
    this.drawCurtain();
    this.drawScreen(now);

    const lampRad = (this.lamp.angle * Math.PI) / 180;
    const lampDy = Math.abs(Math.sin(lampRad)) * 40 + 20;
    const lampOpacity = 0.25 + Math.abs(Math.cos(lampRad)) * 0.2;

    this.wusong.drawShadow(ctx, this.lamp.angle + 90, lampDy * 0.8, lampOpacity);
    this.tiger.drawShadow(ctx, this.lamp.angle + 90, lampDy, lampOpacity * 0.85);

    this.wusong.draw(ctx);
    this.tiger.draw(ctx);

    this.drawOilLamp(now);

    if (this.gameState === 'playing' && this.showButtons) {
      this.drawActionButtons(now);
    }

    this.drawStatusBar();

    if (this.comboFlash.active) {
      this.drawComboFlash(now);
    }

    if (this.endPanel.visible) {
      this.drawEndPanel();
    }
  }

  private drawStageBackground(): void {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#3E1500');
    bg.addColorStop(0.5, '#5C1A00');
    bg.addColorStop(1, '#3E1500');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(222, 184, 135, 0.08)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      const x = 20 + i * 220;
      ctx.beginPath();
      ctx.moveTo(x, 20);
      ctx.lineTo(x + 40, 10);
      ctx.lineTo(x + 80, 20);
      ctx.stroke();
    }
  }

  private drawCurtain(): void {
    const ctx = this.ctx;
    const screenX = 0;
    const screenY = 0;
    const screenW = this.STAGE_W;
    const waveH = 50;

    const grad = ctx.createLinearGradient(0, screenY, 0, screenY + waveH + 20);
    grad.addColorStop(0, '#8B2500');
    grad.addColorStop(0.5, '#A0522D');
    grad.addColorStop(1, '#8B2500');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(screenX, screenY);
    ctx.lineTo(screenX + screenW, screenY);
    ctx.lineTo(screenX + screenW, screenY + waveH);

    for (let x = screenX + screenW; x >= screenX; x -= 30) {
      const wave = Math.sin((x / 30) + this.curtainWave) * 8;
      ctx.lineTo(x, screenY + waveH + wave);
    }
    ctx.lineTo(screenX, screenY + waveH);
    ctx.closePath();
    ctx.fill();

    for (let i = 0; i < 12; i++) {
      const x = screenX + 37.5 + i * 75;
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(x, screenY + waveH + 8 + Math.sin((i + this.curtainWave * 2)) * 2, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawScreen(_now: number): void {
    const ctx = this.ctx;
    const screenX = 0;
    const screenY = 50;
    const screenW = this.STAGE_W;
    const screenH = this.STAGE_H - 50;

    if (this.paperPattern) {
      ctx.drawImage(this.paperPattern, screenX, screenY);
    }

    const overlay = ctx.createLinearGradient(screenX, screenY, screenX, screenY + screenH);
    overlay.addColorStop(0, 'rgba(139, 37, 0, 0.05)');
    overlay.addColorStop(0.5, 'rgba(139, 37, 0, 0.02)');
    overlay.addColorStop(1, 'rgba(139, 37, 0, 0.08)');
    ctx.fillStyle = overlay;
    ctx.fillRect(screenX, screenY, screenW, screenH);

    ctx.strokeStyle = '#8B2500';
    ctx.lineWidth = 4;
    ctx.strokeRect(screenX + 4, screenY + 4, screenW - 8, screenH - 8);

    ctx.strokeStyle = 'rgba(222, 184, 135, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(screenX + 10, screenY + 10, screenW - 20, screenH - 20);

    ctx.fillStyle = 'rgba(139, 37, 0, 0.08)';
    ctx.fillRect(screenX, screenY + screenH - 80, screenW, 80);

    ctx.strokeStyle = 'rgba(222, 184, 135, 0.25)';
    ctx.lineWidth = 1;
    const groundY = screenY + screenH - 40;
    for (let x = 30; x < screenW - 30; x += 15) {
      ctx.beginPath();
      ctx.moveTo(x, groundY + Math.sin(x * 0.1) * 2);
      ctx.lineTo(x + 10, groundY + 2 + Math.sin(x * 0.1 + 1) * 2);
      ctx.stroke();
    }
  }

  private drawOilLamp(now: number): void {
    const ctx = this.ctx;
    const { x, y, radius } = this.lamp;

    const flicker = 1 + Math.sin(now * 0.02) * 0.1 + Math.sin(now * 0.05) * 0.05;
    const glowR = radius * 4 * flicker;

    const glow = ctx.createRadialGradient(x, y, 0, x, y, glowR);
    glow.addColorStop(0, 'rgba(255, 215, 0, 0.5)');
    glow.addColorStop(0.3, 'rgba(255, 200, 50, 0.3)');
    glow.addColorStop(0.6, 'rgba(255, 160, 0, 0.1)');
    glow.addColorStop(1, 'rgba(255, 120, 0, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, glowR, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#8B4513';
    ctx.fillRect(x - 18, y + 5, 36, 15);
    ctx.fillStyle = '#6B3410';
    ctx.fillRect(x - 15, y + 20, 30, 8);

    const flameH = 20 * flicker;
    const flame = ctx.createRadialGradient(x, y - 5, 0, x, y - 5, 15);
    flame.addColorStop(0, '#FFFFFF');
    flame.addColorStop(0.3, '#FFD700');
    flame.addColorStop(0.6, '#FF8C00');
    flame.addColorStop(1, 'rgba(255, 60, 0, 0)');
    ctx.fillStyle = flame;
    ctx.beginPath();
    ctx.moveTo(x, y - 15 - flameH);
    ctx.bezierCurveTo(x + 10, y - 15, x + 6, y, x, y + 5);
    ctx.bezierCurveTo(x - 6, y, x - 10, y - 15, x, y - 15 - flameH);
    ctx.fill();

    const ang = (this.lamp.angle * Math.PI) / 180;
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(ang) * 40, y + Math.sin(ang) * 40);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  private drawActionButtons(_now: number): void {
    const ctx = this.ctx;

    for (const btn of this.actionButtons) {
      const pressDarken = btn.pressed ? 0.6 : 1;
      const r = btn.radius;
      const x = btn.x;
      const y = btn.y;

      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetY = 2;

      const bgGrad = ctx.createRadialGradient(x - 5, y - 5, 0, x, y, r);
      bgGrad.addColorStop(0, `rgba(205, 133, 63, ${0.9 * pressDarken})`);
      bgGrad.addColorStop(1, `rgba(139, 105, 20, ${0.9 * pressDarken})`);

      ctx.fillStyle = bgGrad;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowColor = 'transparent';
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 22px "ZCOOL XiaoWei", KaiTi, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(btn.icon, x, y + 1);

      ctx.restore();
    }
  }

  private drawStatusBar(): void {
    const ctx = this.ctx;
    const { x, width, height } = this.statusBar;
    const canvasH = this.canvas.height;

    const barY = canvasH - height;

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 2;

    ctx.fillStyle = 'rgba(47, 27, 14, 0.92)';
    this.roundRect(ctx, x, barY, width, height, 8);
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#FFD700';
    ctx.font = '14px "ZCOOL XiaoWei", KaiTi, serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('武松', x + 20, barY + 15);

    const wuBarX = x + 65;
    const wuBarW = 200;
    const wuBarH = 20;
    const wuBarY = barY + 25;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.roundRect(ctx, wuBarX, wuBarY, wuBarW, wuBarH, 4);
    ctx.fill();

    const wuFillW = (this.wusong.hp / this.wusong.maxHp) * wuBarW;
    const wuGrad = ctx.createLinearGradient(wuBarX, wuBarY, wuBarX, wuBarY + wuBarH);
    wuGrad.addColorStop(0, '#FF4444');
    wuGrad.addColorStop(1, '#DC143C');
    ctx.fillStyle = wuGrad;
    this.roundRect(ctx, wuBarX, wuBarY, wuFillW, wuBarH, 4);
    ctx.fill();
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${this.wusong.hp}/${this.wusong.maxHp}`, wuBarX + wuBarW - 6, wuBarY + wuBarH / 2);

    const centerX = x + width / 2;

    ctx.fillStyle = '#FF8C00';
    ctx.font = '14px "ZCOOL XiaoWei", KaiTi, serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText('老虎', centerX - 70, barY + 15);

    const tigerBarW = 200;
    const tigerBarX = centerX - 20;
    const tigerBarH = 20;
    const tigerBarY = barY + 25;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.roundRect(ctx, tigerBarX, tigerBarY, tigerBarW, tigerBarH, 4);
    ctx.fill();

    const tigerFillW = (this.tiger.hp / this.tiger.maxHp) * tigerBarW;
    const tigerGrad = ctx.createLinearGradient(tigerBarX, tigerBarY, tigerBarX, tigerBarY + tigerBarH);
    tigerGrad.addColorStop(0, '#FFB347');
    tigerGrad.addColorStop(1, '#FF8C00');
    ctx.fillStyle = tigerGrad;
    this.roundRect(ctx, tigerBarX, tigerBarY, tigerFillW, tigerBarH, 4);
    ctx.fill();
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${this.tiger.hp}/${this.tiger.maxHp}`, tigerBarX + tigerBarW - 6, tigerBarY + tigerBarH / 2);

    ctx.fillStyle = '#FFD700';
    ctx.font = '14px "ZCOOL XiaoWei", KaiTi, serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`回合 ${this.round}`, x + width - 140, barY + 15);
    ctx.fillText(`连击 x${this.combo}`, x + width - 140, barY + 40);

    ctx.restore();
  }

  private drawComboFlash(now: number): void {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    const t = (now - this.comboFlash.startTime) / this.comboFlash.duration;
    const alpha = Math.sin(t * Math.PI) * 0.6;

    const grad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.2, w / 2, h / 2, Math.max(w, h) * 0.8);
    grad.addColorStop(0, 'rgba(255, 215, 0, 0)');
    grad.addColorStop(0.7, `rgba(255, 215, 0, ${alpha * 0.4})`);
    grad.addColorStop(1, `rgba(255, 215, 0, ${alpha})`);

    ctx.save();
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  private drawEndPanel(): void {
    const ctx = this.ctx;
    const { x, y, width, height, restartButton } = this.endPanel;

    ctx.save();

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 4;

    if (this.woodPattern) {
      const pattern = ctx.createPattern(this.woodPattern, 'repeat');
      if (pattern) ctx.fillStyle = pattern;
      else ctx.fillStyle = '#8B4513';
    } else {
      ctx.fillStyle = '#8B4513';
    }

    this.roundRect(ctx, x, y, width, height, 12);
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
    ctx.lineWidth = 1;
    this.roundRect(ctx, x + 10, y + 10, width - 20, height - 20, 8);
    ctx.stroke();

    const title = this.winner === 'wusong' ? '武松打虎' : '老虎反杀';
    const subtitle = this.winner === 'wusong' ? '英雄豪情传千古' : '胜败乃兵家常事';
    const scoreColor = this.winner === 'wusong' ? '#FFD700' : '#FF6B6B';

    ctx.fillStyle = scoreColor;
    ctx.font = 'bold 42px "ZCOOL XiaoWei", KaiTi, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, x + width / 2, y + 80);

    ctx.font = '20px "ZCOOL XiaoWei", KaiTi, serif';
    ctx.fillStyle = '#DEB887';
    ctx.fillText(subtitle, x + width / 2, y + 130);

    const totalRounds = this.round;
    const rating = this.winner === 'wusong'
      ? totalRounds <= 8 ? '★★★ 完美' : totalRounds <= 12 ? '★★ 精彩' : '★ 胜利'
      : '——';

    ctx.fillStyle = '#FFD700';
    ctx.font = '16px "ZCOOL XiaoWei", KaiTi, serif';
    ctx.fillText(`总回合数：${totalRounds}`, x + width / 2, y + 175);
    ctx.fillText(`剧情评分：${rating}`, x + width / 2, y + 205);

    const btn = restartButton;
    const buttonColor = btn.hovered ? '#A0522D' : '#8B3A3A';
    const buttonLight = btn.hovered ? '#C07050' : '#A05030';

    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 2;

    const btnGrad = ctx.createLinearGradient(btn.x, btn.y, btn.x, btn.y + btn.h);
    btnGrad.addColorStop(0, buttonLight);
    btnGrad.addColorStop(1, buttonColor);
    ctx.fillStyle = btnGrad;
    this.roundRect(ctx, btn.x, btn.y, btn.w, btn.h, 6);
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 20px "ZCOOL XiaoWei", KaiTi, serif';
    ctx.fillText('重新开始', btn.x + btn.w / 2, btn.y + btn.h / 2 + 2);

    ctx.restore();
  }

  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ): void {
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
