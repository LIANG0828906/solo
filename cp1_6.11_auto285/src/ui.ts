import { Puppet, PuppetData } from './puppet';
import { Light } from './light';

export class UI {
  canvasWidth: number;
  canvasHeight: number;
  screenX: number;
  screenY: number;
  screenWidth: number = 1200;
  screenHeight: number = 600;

  lanternPhase: number = 0;
  activePortrait: string = '';
  portraitTimer: number = 0;
  portraitAlpha: number = 0;
  hoveredButton: number = -1;

  actionLabels: string[] = ['翻筋斗', '舞金箍棒', '变巨猿', '召唤筋斗云'];
  buttonRects: { x: number; y: number; w: number; h: number }[] = [];
  characterButtons: { x: number; y: number; w: number; h: number }[] = [];

  constructor(canvasWidth: number, canvasHeight: number) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.screenX = (canvasWidth - this.screenWidth) / 2;
    this.screenY = 80;
  }

  update(dt: number): void {
    this.lanternPhase += (dt / 1000) * Math.PI;
    if (this.portraitTimer > 0) {
      this.portraitTimer -= dt;
      if (this.portraitTimer < 500) {
        this.portraitAlpha = this.portraitTimer / 500;
      } else {
        this.portraitAlpha = 1;
      }
      if (this.portraitTimer <= 0) {
        this.portraitAlpha = 0;
        this.activePortrait = '';
      }
    }
  }

  showPortrait(name: string): void {
    this.activePortrait = name;
    this.portraitTimer = 2000;
    this.portraitAlpha = 1;
  }

  drawBackground(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#3E2723';
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

    const grainSize = 4;
    ctx.save();
    ctx.globalAlpha = 0.05;
    for (let gx = 0; gx < this.canvasWidth; gx += grainSize) {
      for (let gy = 0; gy < this.canvasHeight; gy += grainSize) {
        if (Math.random() > 0.5) {
          ctx.fillStyle = Math.random() > 0.5 ? '#4E342E' : '#2C1A0E';
          ctx.fillRect(gx, gy, grainSize, grainSize);
        }
      }
    }
    ctx.restore();
  }

  drawStage(ctx: CanvasRenderingContext2D): void {
    this.drawPillars(ctx);
    this.drawScreen(ctx);
    this.drawLanterns(ctx);
    this.drawTitle(ctx);
    this.drawControlArea(ctx);
  }

  drawPillars(ctx: CanvasRenderingContext2D): void {
    const pillarW = 30;
    const pillarH = this.screenHeight + 40;
    const leftX = this.screenX - pillarW - 5;
    const rightX = this.screenX + this.screenWidth + 5;

    this.drawSinglePillar(ctx, leftX, this.screenY - 20, pillarW, pillarH);
    this.drawSinglePillar(ctx, rightX, this.screenY - 20, pillarW, pillarH);
  }

  drawSinglePillar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
    const grd = ctx.createLinearGradient(x, y, x + w, y);
    grd.addColorStop(0, '#8B1A1A');
    grd.addColorStop(0.3, '#B71C1C');
    grd.addColorStop(0.7, '#B71C1C');
    grd.addColorStop(1, '#8B1A1A');
    ctx.fillStyle = grd;
    ctx.fillRect(x, y, w, h);

    ctx.strokeStyle = '#FFC107';
    ctx.lineWidth = 1;

    const capH = 15;
    ctx.fillStyle = '#FFC107';
    ctx.fillRect(x - 4, y, w + 8, capH);
    ctx.fillRect(x - 4, y + h - capH, w + 8, capH);

    for (let i = 0; i < 3; i++) {
      const cy = y + capH + 20 + i * 50;
      ctx.beginPath();
      ctx.arc(x + w / 2, cy, 6, 0, Math.PI * 2);
      ctx.strokeStyle = '#FFC107';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + w / 2 - 4, cy);
      ctx.lineTo(x + w / 2 + 4, cy);
      ctx.stroke();
    }
  }

  drawScreen(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    ctx.shadowColor = 'rgba(255,213,79,0.3)';
    ctx.shadowBlur = 40;
    ctx.fillStyle = 'rgba(255,253,240,0.92)';
    ctx.fillRect(this.screenX, this.screenY, this.screenWidth, this.screenHeight);
    ctx.shadowBlur = 0;

    for (let i = 0; i < 800; i++) {
      const tx = this.screenX + Math.random() * this.screenWidth;
      const ty = this.screenY + Math.random() * this.screenHeight;
      ctx.fillStyle = `rgba(200,190,170,${Math.random() * 0.08})`;
      ctx.fillRect(tx, ty, Math.random() * 3 + 1, 1);
    }

    for (let sy = 0; sy < this.screenHeight; sy += 6) {
      ctx.fillStyle = `rgba(180,170,150,${0.02 + Math.random() * 0.02})`;
      ctx.fillRect(this.screenX, this.screenY + sy, this.screenWidth, 1);
    }

    ctx.strokeStyle = '#1A237E';
    ctx.lineWidth = 6;
    ctx.strokeRect(this.screenX - 3, this.screenY - 3, this.screenWidth + 6, this.screenHeight + 6);

    ctx.restore();
  }

  drawLanterns(ctx: CanvasRenderingContext2D): void {
    const swingAngle = Math.sin(this.lanternPhase) * (10 * Math.PI / 180);
    const lanternR = 25;

    const positions = [
      { x: this.screenX + 50, y: this.screenY - 30 },
      { x: this.screenX + 100, y: this.screenY - 25 },
      { x: this.screenX + this.screenWidth - 50, y: this.screenY - 30 },
      { x: this.screenX + this.screenWidth - 100, y: this.screenY - 25 },
    ];

    for (const pos of positions) {
      ctx.save();
      ctx.translate(pos.x, pos.y);
      ctx.rotate(swingAngle);

      ctx.strokeStyle = '#8D6E63';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -40);
      ctx.lineTo(0, -lanternR);
      ctx.stroke();

      const grd = ctx.createRadialGradient(0, 0, 3, 0, 0, lanternR);
      grd.addColorStop(0, '#FF9800');
      grd.addColorStop(0.6, '#F44336');
      grd.addColorStop(1, '#D32F2F');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.ellipse(0, 0, lanternR * 0.8, lanternR, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFC107';
      ctx.fillRect(-6, -lanternR - 2, 12, 4);
      ctx.fillRect(-6, lanternR - 2, 12, 4);

      ctx.restore();
    }
  }

  drawTitle(ctx: CanvasRenderingContext2D): void {
    const titleY = this.screenY - 50;
    const centerX = this.screenX + this.screenWidth / 2;
    const text = '大鬧天宮';
    const fontSize = 36;

    ctx.save();
    ctx.font = `bold ${fontSize}px KaiTi, STKaiti, 楷体, serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.strokeStyle = '#B8860B';
    ctx.lineWidth = 4;
    ctx.strokeText(text, centerX, titleY);

    ctx.fillStyle = '#FFD54F';
    ctx.fillText(text, centerX, titleY);

    ctx.restore();
  }

  drawControlArea(ctx: CanvasRenderingContext2D): void {
    const ctrlY = this.screenY + this.screenHeight + 30;
    const ctrlH = 110;
    const ctrlX = this.screenX;
    const ctrlW = this.screenWidth;

    const woodGrd = ctx.createLinearGradient(ctrlX, ctrlY, ctrlX, ctrlY + ctrlH);
    woodGrd.addColorStop(0, '#8D6E63');
    woodGrd.addColorStop(0.3, '#795548');
    woodGrd.addColorStop(0.7, '#6D4C41');
    woodGrd.addColorStop(1, '#5D4037');
    ctx.fillStyle = woodGrd;
    ctx.fillRect(ctrlX, ctrlY, ctrlW, ctrlH);

    for (let i = 0; i < 40; i++) {
      ctx.strokeStyle = `rgba(93,64,55,${0.2 + Math.random() * 0.15})`;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      const ly = ctrlY + (ctrlH / 40) * i;
      ctx.moveTo(ctrlX, ly + Math.random() * 2);
      ctx.lineTo(ctrlX + ctrlW, ly + Math.random() * 2);
      ctx.stroke();
    }

    this.buttonRects = [];
    const btnW = 100;
    const btnH = 40;
    const btnY1 = ctrlY + 10;
    const totalW1 = this.actionLabels.length * (btnW + 20) - 20;
    const startX1 = ctrlX + (ctrlW - totalW1) / 2;

    for (let i = 0; i < this.actionLabels.length; i++) {
      const bx = startX1 + i * (btnW + 20);
      this.buttonRects.push({ x: bx, y: btnY1, w: btnW, h: btnH });
      this.drawActionButton(ctx, bx, btnY1, btnW, btnH, this.actionLabels[i], i === this.hoveredButton);
    }

    this.characterButtons = [];
    const charNames = ['孫悟空', '二郎神', '持琵琶', '持伞', '持蛇', '持劍'];
    const btnW2 = 80;
    const btnH2 = 32;
    const btnY2 = ctrlY + 60;
    const totalW2 = charNames.length * (btnW2 + 12) - 12;
    const startX2 = ctrlX + (ctrlW - totalW2) / 2;

    for (let i = 0; i < charNames.length; i++) {
      const bx = startX2 + i * (btnW2 + 12);
      this.characterButtons.push({ x: bx, y: btnY2, w: btnW2, h: btnH2 });
      this.drawCharButton(ctx, bx, btnY2, btnW2, btnH2, `${i + 1} ${charNames[i]}`);
    }
  }

  drawActionButton(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, label: string, hovered: boolean): void {
    ctx.save();

    if (hovered) {
      ctx.shadowColor = '#FFD54F';
      ctx.shadowBlur = 20;
    }

    const grd = ctx.createLinearGradient(x, y, x, y + h);
    grd.addColorStop(0, '#D2B48C');
    grd.addColorStop(1, '#A0845C');
    ctx.fillStyle = grd;

    const r = 4;
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
    ctx.fill();

    ctx.strokeStyle = '#8D6E63';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.font = '14px KaiTi, STKaiti, 楷体, serif';
    ctx.fillStyle = '#FFD54F';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x + w / 2, y + h / 2);

    ctx.restore();
  }

  drawCharButton(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, label: string): void {
    ctx.save();

    ctx.fillStyle = 'rgba(62,39,35,0.8)';
    const r = 3;
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
    ctx.fill();

    ctx.strokeStyle = '#8D6E63';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = '12px KaiTi, STKaiti, 楷体, serif';
    ctx.fillStyle = '#FFD54F';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x + w / 2, y + h / 2);

    ctx.restore();
  }

  drawPortrait(ctx: CanvasRenderingContext2D, puppetData: PuppetData | null): void {
    if (!puppetData || this.portraitAlpha <= 0) return;

    const cx = this.screenX + 50;
    const cy = this.screenY + 50;
    const r = 25;

    ctx.save();
    ctx.globalAlpha = this.portraitAlpha;

    ctx.beginPath();
    ctx.arc(cx, cy, r + 2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(62,39,35,0.85)';
    ctx.fill();
    ctx.strokeStyle = '#FFC107';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();

    puppetData.headDraw(ctx, cx, cy, 1.5);
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = this.portraitAlpha;
    ctx.font = '14px KaiTi, STKaiti, 楷体, serif';
    ctx.fillStyle = '#1A1A1A';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(puppetData.name, cx, cy + r + 8);
    ctx.restore();
  }

  getClickedActionButton(mx: number, my: number): number {
    for (let i = 0; i < this.buttonRects.length; i++) {
      const b = this.buttonRects[i];
      if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
        return i;
      }
    }
    return -1;
  }

  getClickedCharButton(mx: number, my: number): number {
    for (let i = 0; i < this.characterButtons.length; i++) {
      const b = this.characterButtons[i];
      if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
        return i;
      }
    }
    return -1;
  }

  setHoveredButton(index: number): void {
    this.hoveredButton = index;
  }
}
