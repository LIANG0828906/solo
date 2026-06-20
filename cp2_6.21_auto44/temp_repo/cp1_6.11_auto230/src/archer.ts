export interface ArcherState {
  pullDistance: number;
  aimAngle: number;
  arrowsRemaining: number;
  isDrawing: boolean;
  bowBendAmount: number;
  handPosition: { x: number; y: number };
  bowAnchor: { x: number; y: number };
}

export interface ShootParams {
  initialSpeed: number;
  angle: number;
  startX: number;
  startY: number;
}

const COLORS = {
  ARCHER_SILHOUETTE: '#1A1A1A',
  BOW_BROWN: '#5C3A21',
  STRING_GRAY: '#CCCCCC',
  CROSSHAIR: '#FF0000',
  ARROW_SHAFT: '#3A2512',
  ARROW_TIP: '#888888'
};

const SIZES = {
  ARCHER_HEIGHT: 160,
  MIN_PULL_PERCENT: 30,
  MAX_SPEED: 20,
  MIN_SPEED: 6,
  ARROWS_PER_ROUND: 10,
  VIBRATION_FRAMES: 5,
  VIBRATION_AMPLITUDE: 2,
  CROSSHAIR_SIZE: 6,
  MAX_PULL_PIXELS: 120
};

export class Archer {
  private canvasWidth: number;
  private canvasHeight: number;
  private pullDistance: number = 0;
  private aimAngle: number = 0;
  private arrowsRemaining: number = SIZES.ARROWS_PER_ROUND;
  private isDrawing: boolean = false;
  private bowBendAmount: number = 0;
  private handPos: { x: number; y: number };
  private bowAnchor: { x: number; y: number };
  private stringRestPos: { x: number; y: number };
  private vibrationFrames: number = 0;
  private mouseStartX: number = 0;
  private mouseStartY: number = 0;

  constructor(canvasWidth: number, canvasHeight: number) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    const groundY = canvasHeight * 0.75;
    const archerBottomY = groundY;
    const archerTopY = archerBottomY - SIZES.ARCHER_HEIGHT;
    const archerX = canvasWidth * 0.18;

    this.bowAnchor = {
      x: archerX + 25,
      y: archerTopY + SIZES.ARCHER_HEIGHT * 0.42
    };
    this.stringRestPos = { ...this.bowAnchor };
    this.handPos = { ...this.bowAnchor };
  }

  resize(canvasWidth: number, canvasHeight: number): void {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    const groundY = canvasHeight * 0.75;
    const archerBottomY = groundY;
    const archerTopY = archerBottomY - SIZES.ARCHER_HEIGHT;
    const archerX = canvasWidth * 0.18;

    this.bowAnchor = {
      x: archerX + 25,
      y: archerTopY + SIZES.ARCHER_HEIGHT * 0.42
    };
    if (!this.isDrawing) {
      this.stringRestPos = { ...this.bowAnchor };
      this.handPos = { ...this.bowAnchor };
    }
  }

  startPull(mouseX: number, mouseY: number): void {
    if (this.arrowsRemaining <= 0 || this.vibrationFrames > 0) return;
    this.isDrawing = true;
    this.mouseStartX = mouseX;
    this.mouseStartY = mouseY;
    this.handPos = { ...this.bowAnchor };
    this.pullDistance = 0;
    this.bowBendAmount = 0;
    this.calculateAim(mouseX, mouseY);
  }

  updatePull(mouseX: number, mouseY: number): void {
    if (!this.isDrawing) return;
    const dx = mouseX - this.mouseStartX;
    const dy = mouseY - this.mouseStartY;
    let dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > SIZES.MAX_PULL_PIXELS) dist = SIZES.MAX_PULL_PIXELS;

    const pullPct = Math.min(100, (dist / SIZES.MAX_PULL_PIXELS) * 100);
    this.pullDistance = pullPct;
    this.bowBendAmount = pullPct / 100;

    const angle = Math.atan2(this.bowAnchor.y - mouseY, mouseX - this.bowAnchor.x);
    this.aimAngle = angle;

    const pullBackDist = (pullPct / 100) * 70;
    const baseAngle = this.aimAngle + Math.PI;
    this.handPos = {
      x: this.bowAnchor.x + Math.cos(baseAngle) * pullBackDist,
      y: this.bowAnchor.y + Math.sin(baseAngle) * pullBackDist
    };
  }

  private calculateAim(mouseX: number, mouseY: number): void {
    const angle = Math.atan2(this.bowAnchor.y - mouseY, mouseX - this.bowAnchor.x);
    this.aimAngle = angle;
  }

  release(): ShootParams | null {
    if (!this.isDrawing) return null;
    const wasDrawing = this.isDrawing;
    this.isDrawing = false;

    if (this.pullDistance < SIZES.MIN_PULL_PERCENT) {
      this.handPos = { ...this.bowAnchor };
      this.pullDistance = 0;
      this.bowBendAmount = 0;
      return null;
    }

    const t = this.pullDistance / 100;
    const speed = SIZES.MIN_SPEED + (SIZES.MAX_SPEED - SIZES.MIN_SPEED) * t;

    this.vibrationFrames = SIZES.VIBRATION_FRAMES;
    this.arrowsRemaining--;
    this.handPos = { ...this.bowAnchor };
    this.pullDistance = 0;
    this.bowBendAmount = 0;

    if (!wasDrawing) return null;
    return {
      initialSpeed: speed,
      angle: this.aimAngle,
      startX: this.bowAnchor.x,
      startY: this.bowAnchor.y
    };
  }

  resetRound(): void {
    this.arrowsRemaining = SIZES.ARROWS_PER_ROUND;
    this.pullDistance = 0;
    this.bowBendAmount = 0;
    this.isDrawing = false;
    this.handPos = { ...this.bowAnchor };
    this.vibrationFrames = 0;
  }

  getState(): ArcherState {
    return {
      pullDistance: this.pullDistance,
      aimAngle: this.aimAngle,
      arrowsRemaining: this.arrowsRemaining,
      isDrawing: this.isDrawing,
      bowBendAmount: this.bowBendAmount,
      handPosition: { ...this.handPos },
      bowAnchor: { ...this.bowAnchor }
    };
  }

  isNearString(mouseX: number, mouseY: number, threshold: number = 40): boolean {
    const dx = mouseX - this.stringRestPos.x;
    const dy = mouseY - this.stringRestPos.y;
    return Math.sqrt(dx * dx + dy * dy) <= threshold;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    this.updateVibration();
    this.drawSilhouette(ctx);
    this.drawBow(ctx);
    if (this.isDrawing) {
      this.drawAimingArrow(ctx);
      this.drawCrosshair(ctx);
      this.drawPullIndicator(ctx);
    }
  }

  private updateVibration(): void {
    if (this.vibrationFrames > 0) {
      this.vibrationFrames--;
    }
  }

  private drawSilhouette(ctx: CanvasRenderingContext2D): void {
    const groundY = this.canvasHeight * 0.75;
    const archerBottomY = groundY;
    const archerTopY = archerBottomY - SIZES.ARCHER_HEIGHT;
    const archerX = this.canvasWidth * 0.18;
    const centerX = archerX + 15;

    ctx.save();
    ctx.fillStyle = COLORS.ARCHER_SILHOUETTE;

    ctx.beginPath();
    ctx.ellipse(centerX, archerTopY + 18, 13, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillRect(centerX - 10, archerTopY + 32, 20, 48);

    ctx.beginPath();
    ctx.moveTo(centerX - 10, archerTopY + 80);
    ctx.lineTo(centerX - 16, archerBottomY);
    ctx.lineTo(centerX - 4, archerBottomY);
    ctx.lineTo(centerX, archerTopY + 95);
    ctx.lineTo(centerX + 4, archerBottomY);
    ctx.lineTo(centerX + 16, archerBottomY);
    ctx.lineTo(centerX + 10, archerTopY + 80);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(centerX - 8, archerTopY + 40);
    ctx.quadraticCurveTo(
      this.bowAnchor.x - 15,
      archerTopY + 45,
      this.bowAnchor.x,
      this.bowAnchor.y
    );
    ctx.lineWidth = 8;
    ctx.strokeStyle = COLORS.ARCHER_SILHOUETTE;
    ctx.lineCap = 'round';
    ctx.stroke();

    if (this.isDrawing) {
      ctx.beginPath();
      ctx.moveTo(centerX + 5, archerTopY + 42);
      ctx.quadraticCurveTo(
        this.handPos.x + 10,
        this.handPos.y - 5,
        this.handPos.x,
        this.handPos.y
      );
      ctx.lineWidth = 7;
      ctx.strokeStyle = COLORS.ARCHER_SILHOUETTE;
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    ctx.restore();
  }

  private drawBow(ctx: CanvasRenderingContext2D): void {
    const bend = this.bowBendAmount;
    const vibrationOffset = this.vibrationFrames > 0
      ? Math.sin((SIZES.VIBRATION_FRAMES - this.vibrationFrames) * Math.PI * 0.8) * SIZES.VIBRATION_AMPLITUDE * (this.vibrationFrames / SIZES.VIBRATION_FRAMES)
      : 0;

    ctx.save();
    ctx.translate(this.bowAnchor.x, this.bowAnchor.y);
    ctx.rotate(this.aimAngle);

    ctx.strokeStyle = COLORS.BOW_BROWN;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';

    const bowLength = 75;
    const maxBend = 25;
    const bendDepth = bend * maxBend;

    ctx.beginPath();
    ctx.moveTo(0, -bowLength);
    ctx.quadraticCurveTo(-bendDepth - vibrationOffset, -bowLength * 0.5, -bendDepth * 0.6 - vibrationOffset * 0.5, 0);
    ctx.quadraticCurveTo(-bendDepth - vibrationOffset, bowLength * 0.5, 0, bowLength);
    ctx.stroke();

    ctx.strokeStyle = COLORS.STRING_GRAY;
    ctx.lineWidth = 1.2;

    const stringPull = bend * 45 + vibrationOffset;
    ctx.beginPath();
    ctx.moveTo(0, -bowLength);
    ctx.lineTo(-stringPull, 0);
    ctx.lineTo(0, bowLength);
    ctx.stroke();

    ctx.restore();
  }

  private drawAimingArrow(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.translate(this.bowAnchor.x, this.bowAnchor.y);
    ctx.rotate(this.aimAngle);

    const arrowLength = 60;
    const stringPull = this.bowBendAmount * 45;
    const startX = -stringPull;

    ctx.strokeStyle = COLORS.ARROW_SHAFT;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(startX, 0);
    ctx.lineTo(startX + arrowLength, 0);
    ctx.stroke();

    ctx.fillStyle = COLORS.ARROW_TIP;
    ctx.beginPath();
    ctx.moveTo(startX + arrowLength, 0);
    ctx.lineTo(startX + arrowLength - 8, -4);
    ctx.lineTo(startX + arrowLength - 8, 4);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(startX, 0);
    ctx.lineTo(startX - 6, -5);
    ctx.lineTo(startX - 2, 0);
    ctx.lineTo(startX - 6, 5);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  private drawCrosshair(ctx: CanvasRenderingContext2D): void {
    const targetX = this.canvasWidth * 0.62;
    const targetY = this.canvasHeight * 0.42;

    const dx = targetX - this.bowAnchor.x;
    const dy = targetY - this.bowAnchor.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const dirX = dx / dist;
    const dirY = dy / dist;

    let t = 1;
    const speed = 6 + this.bowBendAmount * 14;
    const steps = 300;
    let x = this.bowAnchor.x;
    let y = this.bowAnchor.y;
    let vx = dirX * speed;
    let vy = dirY * speed;
    const gravity = 0.12;

    for (let i = 0; i < steps; i++) {
      x += vx;
      y += vy;
      vy += gravity;
      if (x >= targetX - 5) { t = i / steps; break; }
    }

    const chX = x;
    const chY = y;
    const s = SIZES.CROSSHAIR_SIZE;

    ctx.save();
    ctx.strokeStyle = COLORS.CROSSHAIR;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.85;

    ctx.beginPath();
    ctx.arc(chX, chY, s + 2, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(chX - s - 4, chY);
    ctx.lineTo(chX - s, chY);
    ctx.moveTo(chX + s, chY);
    ctx.lineTo(chX + s + 4, chY);
    ctx.moveTo(chX, chY - s - 4);
    ctx.lineTo(chX, chY - s);
    ctx.moveTo(chX, chY + s);
    ctx.lineTo(chX, chY + s + 4);
    ctx.stroke();

    ctx.restore();
  }

  private drawPullIndicator(ctx: CanvasRenderingContext2D): void {
    const x = this.canvasWidth * 0.08;
    const y = this.canvasHeight * 0.45;
    const barW = 14;
    const barH = 140;

    ctx.save();
    ctx.fillStyle = 'rgba(26, 26, 26, 0.7)';
    this.roundRect(ctx, x - 6, y - 26, barW + 36, barH + 42, 6);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '14px "KaiTi", "楷体", serif';
    ctx.textAlign = 'center';
    ctx.fillText('拉力', x + barW / 2 + 12, y - 22);

    ctx.fillStyle = '#333333';
    this.roundRect(ctx, x, y, barW, barH, 4);
    ctx.fill();

    const pct = Math.min(100, this.pullDistance);
    const fillH = (pct / 100) * barH;
    const fillY = y + barH - fillH;

    let color = '#4CAF50';
    if (pct >= SIZES.MIN_PULL_PERCENT) color = pct >= 80 ? '#FF4500' : '#FFD700';
    const grad = ctx.createLinearGradient(x, fillY, x, y + barH);
    grad.addColorStop(0, color);
    grad.addColorStop(1, '#8B0000');
    ctx.fillStyle = grad;
    this.roundRect(ctx, x, fillY, barW, fillH, 4);
    ctx.fill();

    const minY = y + barH - (SIZES.MIN_PULL_PERCENT / 100) * barH;
    ctx.strokeStyle = pct >= SIZES.MIN_PULL_PERCENT ? '#00FF00' : '#FFFFFF';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 2]);
    ctx.beginPath();
    ctx.moveTo(x - 2, minY);
    ctx.lineTo(x + barW + 2, minY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 13px "KaiTi", "楷体", serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${pct.toFixed(0)}%`, x + barW + 4, y + barH - 6);

    ctx.restore();
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
}
