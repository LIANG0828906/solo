import { GameEngine, Arrow, Ripple } from './game';

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private bgOffset: number;
  private mouseX: number;
  private mouseY: number;
  private buttonHover: boolean;
  private restartButtonRect: { x: number; y: number; w: number; h: number } | null;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
    this.bgOffset = 0;
    this.mouseX = 0;
    this.mouseY = 0;
    this.buttonHover = false;
    this.restartButtonRect = null;
  }

  setMousePos(x: number, y: number): void {
    this.mouseX = x;
    this.mouseY = y;

    if (this.restartButtonRect) {
      const r = this.restartButtonRect;
      this.buttonHover = x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
    } else {
      this.buttonHover = false;
    }
  }

  isButtonClicked(x: number, y: number): boolean {
    if (!this.restartButtonRect) return false;
    const r = this.restartButtonRect;
    return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  }

  render(game: GameEngine, timestamp: number): void {
    const ctx = this.ctx;
    const w = game.canvasWidth;
    const h = game.canvasHeight;

    this.bgOffset += 0.2 * game.scale;
    if (this.bgOffset > w * 2) this.bgOffset = 0;

    ctx.clearRect(0, 0, w, h);

    this.drawBackground(game);
    this.drawGround(game);
    this.drawScene(game);
    this.drawArrows(game);
    this.drawEffects(game);
    this.drawUI(game);

    if (game.gameEnded) {
      this.drawGameEndDialog(game);
    }
  }

  private drawBackground(game: GameEngine): void {
    const ctx = this.ctx;
    const w = game.canvasWidth;
    const h = game.canvasHeight;

    const skyGrad = ctx.createLinearGradient(0, 0, 0, game.groundY);
    skyGrad.addColorStop(0, '#E8E4D9');
    skyGrad.addColorStop(0.5, '#CFE3ED');
    skyGrad.addColorStop(1, '#B8D5E3');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, game.groundY);

    this.drawMountains(game);
    this.drawClouds(game);
    this.drawTrees(game);
    this.drawFence(game);
  }

  private drawMountains(game: GameEngine): void {
    const ctx = this.ctx;
    const w = game.canvasWidth;
    const h = game.canvasHeight;
    const s = game.scale;
    const offset = this.bgOffset % (w * 1.5);

    ctx.save();
    ctx.globalAlpha = 0.45;

    for (let layer = 0; layer < 3; layer++) {
      const layerOffset = offset * (0.3 + layer * 0.15);
      const baseY = game.groundY - 40 * s - layer * 60 * s;
      const peakH = (80 + layer * 40) * s;
      const color = layer === 0 ? '#7FA8BE' : layer === 1 ? '#93B7CC' : '#A9C6D9';

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(-layerOffset, baseY);

      for (let x = -layerOffset; x < w * 2 - layerOffset + 200; x += 120 * s) {
        const seed = Math.floor((x + layerOffset) / (120 * s));
        const peakVariation = Math.sin(seed * 1.7) * 0.3 + 0.7;
        const peakY = baseY - peakH * peakVariation;
        ctx.lineTo(x + 60 * s, peakY);
        ctx.lineTo(x + 120 * s, baseY);
      }

      ctx.lineTo(w * 2, game.groundY);
      ctx.lineTo(-200, game.groundY);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  private drawClouds(game: GameEngine): void {
    const ctx = this.ctx;
    const w = game.canvasWidth;
    const s = game.scale;
    const offset = this.bgOffset % (w * 1.2);

    ctx.save();
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = '#FFFFFF';

    const cloudPositions = [
      { x: 0.1, y: 0.15, size: 1.0 },
      { x: 0.3, y: 0.08, size: 1.2 },
      { x: 0.55, y: 0.18, size: 0.9 },
      { x: 0.75, y: 0.1, size: 1.1 },
      { x: 0.95, y: 0.22, size: 0.8 },
      { x: 1.15, y: 0.12, size: 1.0 },
    ];

    for (const cp of cloudPositions) {
      const cx = (cp.x * w - offset * 0.4) % (w * 1.2) - 100;
      const cy = cp.y * game.groundY;
      const size = cp.size * s;

      this.drawCloud(ctx, cx, cy, size);
    }

    ctx.restore();
  }

  private drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number): void {
    ctx.beginPath();
    ctx.arc(x, y, 20 * scale, 0, Math.PI * 2);
    ctx.arc(x + 25 * scale, y - 10 * scale, 25 * scale, 0, Math.PI * 2);
    ctx.arc(x + 50 * scale, y, 22 * scale, 0, Math.PI * 2);
    ctx.arc(x + 30 * scale, y + 8 * scale, 20 * scale, 0, Math.PI * 2);
    ctx.arc(x + 60 * scale, y + 5 * scale, 18 * scale, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawTrees(game: GameEngine): void {
    const ctx = this.ctx;
    const w = game.canvasWidth;
    const s = game.scale;
    const offset = this.bgOffset % (w * 1.2);
    const groundY = game.groundY;

    const treePositions = [0.05, 0.2, 0.4, 0.6, 0.8, 0.95, 1.1, 1.3];

    for (const tp of treePositions) {
      const tx = (tp * w - offset * 0.8) % (w * 1.2) - 50;
      const seed = Math.floor(tp * 100);
      const sizeVar = 0.8 + Math.sin(seed) * 0.3;
      this.drawTree(ctx, tx, groundY, s * sizeVar, seed);
    }
  }

  private drawTree(ctx: CanvasRenderingContext2D, x: number, groundY: number, s: number, seed: number): void {
    const trunkH = 70 * s;
    const trunkW = 8 * s;

    ctx.fillStyle = '#5C4033';
    ctx.fillRect(x - trunkW / 2, groundY - trunkH, trunkW, trunkH);

    const foliageColors = ['#2E8B57', '#3CB371', '#228B22'];
    const colorIdx = Math.abs(seed) % 3;
    ctx.fillStyle = foliageColors[colorIdx];
    ctx.globalAlpha = 0.85;

    const cx = x;
    const cy = groundY - trunkH - 10 * s;

    ctx.beginPath();
    ctx.arc(cx, cy, 30 * s, 0, Math.PI * 2);
    ctx.arc(cx - 20 * s, cy + 10 * s, 22 * s, 0, Math.PI * 2);
    ctx.arc(cx + 22 * s, cy + 8 * s, 25 * s, 0, Math.PI * 2);
    ctx.arc(cx - 5 * s, cy - 20 * s, 20 * s, 0, Math.PI * 2);
    ctx.arc(cx + 12 * s, cy - 15 * s, 22 * s, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;
  }

  private drawFence(game: GameEngine): void {
    const ctx = this.ctx;
    const w = game.canvasWidth;
    const s = game.scale;
    const offset = this.bgOffset % (w * 1.2);
    const baseY = game.groundY - 35 * s;
    const fenceH = 30 * s;

    ctx.fillStyle = '#8B5A2B';
    ctx.strokeStyle = '#5C3317';
    ctx.lineWidth = 1;

    const postW = 6 * s;
    const postSpacing = 35 * s;
    const startX = -offset % postSpacing;

    for (let x = startX; x < w + postSpacing; x += postSpacing) {
      ctx.fillRect(x, baseY - fenceH, postW, fenceH + 5 * s);
      ctx.strokeRect(x, baseY - fenceH, postW, fenceH + 5 * s);

      ctx.beginPath();
      ctx.moveTo(x + postW / 2, baseY - fenceH - 5 * s);
      ctx.lineTo(x + postW / 2 - 4 * s, baseY - fenceH);
      ctx.lineTo(x + postW / 2 + 4 * s, baseY - fenceH);
      ctx.closePath();
      ctx.fill();
    }

    ctx.fillRect(0, baseY - fenceH * 0.85, w, 4 * s);
    ctx.fillRect(0, baseY - fenceH * 0.35, w, 4 * s);
  }

  private drawGround(game: GameEngine): void {
    const ctx = this.ctx;
    const w = game.canvasWidth;
    const h = game.canvasHeight;
    const s = game.scale;
    const groundY = game.groundY;

    const groundGrad = ctx.createLinearGradient(0, groundY, 0, h);
    groundGrad.addColorStop(0, '#C9C196');
    groundGrad.addColorStop(1, '#9E9670');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, groundY, w, h - groundY);

    const brickW = 30 * s;
    const brickH = 10 * s;
    const brickLineY = groundY;

    for (let row = 0; row < 3; row++) {
      const rowY = brickLineY + row * brickH;
      const offset = (row % 2) * (brickW / 2);

      for (let x = -brickW + offset; x < w + brickW; x += brickW) {
        const isAlt = (Math.floor((x + offset) / brickW) + row) % 2 === 0;
        ctx.fillStyle = isAlt ? '#BDB76B' : '#D3D3D3';
        ctx.fillRect(x, rowY, brickW - 1, brickH - 1);

        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, rowY, brickW - 1, brickH - 1);
      }
    }
  }

  private drawScene(game: GameEngine): void {
    this.drawPlayer(game);
    this.drawPot(game);
  }

  private drawPlayer(game: GameEngine): void {
    const ctx = this.ctx;
    const s = game.scale;
    const px = game.getPlayerStandX();
    const groundY = game.groundY;
    const isPlayerA = game.currentPlayerIndex === 0;

    const robeColor = isPlayerA ? '#F0FFFF' : '#FFF8DC';
    const sashColor = isPlayerA ? '#191970' : '#800020';

    ctx.save();
    ctx.translate(px, groundY);

    ctx.fillStyle = '#654321';
    ctx.fillRect(-12 * s, -20 * s, 10 * s, 20 * s);
    ctx.fillRect(2 * s, -20 * s, 10 * s, 20 * s);

    ctx.fillStyle = '#2F2F2F';
    ctx.fillRect(-14 * s, -8 * s, 14 * s, 8 * s);
    ctx.fillRect(0, -8 * s, 14 * s, 8 * s);

    ctx.fillStyle = robeColor;
    ctx.beginPath();
    ctx.moveTo(-30 * s, -130 * s);
    ctx.quadraticCurveTo(-35 * s, -70 * s, -35 * s, -20 * s);
    ctx.lineTo(35 * s, -20 * s);
    ctx.quadraticCurveTo(35 * s, -70 * s, 30 * s, -130 * s);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = sashColor;
    ctx.fillRect(-32 * s, -85 * s, 64 * s, 8 * s);

    ctx.beginPath();
    ctx.moveTo(-28 * s, -77 * s);
    ctx.lineTo(-28 * s, -50 * s);
    ctx.lineTo(-25 * s, -50 * s);
    ctx.lineTo(-25 * s, -77 * s);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#F5DEB3';
    ctx.beginPath();
    ctx.arc(0, -140 * s, 15 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#1A1A1A';
    ctx.beginPath();
    ctx.arc(0, -147 * s, 13 * s, Math.PI, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1A1A1A';
    ctx.fillRect(-5 * s, -142 * s, 3 * s, 3 * s);
    ctx.fillRect(2 * s, -142 * s, 3 * s, 3 * s);

    ctx.strokeStyle = '#1A1A1A';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, -136 * s, 4 * s, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();

    ctx.fillStyle = '#F5DEB3';
    ctx.save();
    ctx.translate(20 * s, -110 * s);
    ctx.rotate(-0.3);
    ctx.fillRect(0, 0, 30 * s, 6 * s);
    ctx.restore();

    if (game.charging || !game.activeArrow) {
      this.drawPlayerArrow(game);
    }

    ctx.restore();
  }

  private drawPlayerArrow(game: GameEngine): void {
    const ctx = this.ctx;
    const s = game.scale;
    const arrowLen = GameEngine.ARROW_LENGTH * s;
    const thickness = GameEngine.ARROW_THICKNESS * s;

    const startX = game.getPlayerStandX() + 20 * s;
    const startY = game.getPlayerHandY();

    let angle = -Math.PI / 4;
    if (game.charging) {
      angle = -(Math.PI / 4 - (game.chargeValue / 100) * (Math.PI / 6));
    }

    ctx.save();
    ctx.translate(startX, startY);
    ctx.rotate(angle);

    ctx.fillStyle = '#D2B48C';
    ctx.fillRect(-arrowLen * 0.5, -thickness / 2, arrowLen * 0.85, thickness);

    ctx.strokeStyle = '#8B7355';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 4; i++) {
      const ly = -arrowLen * 0.5 + i * arrowLen * 0.2;
      ctx.beginPath();
      ctx.moveTo(ly, -thickness / 2);
      ctx.lineTo(ly + 2, thickness / 2);
      ctx.stroke();
    }

    ctx.fillStyle = '#B8860B';
    ctx.beginPath();
    ctx.moveTo(arrowLen * 0.35, -thickness);
    ctx.lineTo(arrowLen * 0.5, 0);
    ctx.lineTo(arrowLen * 0.35, thickness);
    ctx.lineTo(arrowLen * 0.3, -thickness / 3);
    ctx.lineTo(arrowLen * 0.3, thickness / 3);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#8B6914';
    ctx.lineWidth = 0.5;
    ctx.stroke();

    ctx.fillStyle = '#FFF0F5';
    const featherStart = -arrowLen * 0.5;
    for (let i = 0; i < 3; i++) {
      const fx = featherStart + i * 6 * s;
      ctx.beginPath();
      ctx.moveTo(fx, 0);
      ctx.quadraticCurveTo(fx - 6 * s, -8 * s, fx - 12 * s, -12 * s);
      ctx.quadraticCurveTo(fx - 4 * s, -4 * s, fx, 0);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(fx, 0);
      ctx.quadraticCurveTo(fx - 6 * s, 8 * s, fx - 12 * s, 12 * s);
      ctx.quadraticCurveTo(fx - 4 * s, 4 * s, fx, 0);
      ctx.fill();
    }

    ctx.restore();
  }

  private drawPot(game: GameEngine): void {
    const ctx = this.ctx;
    const s = game.scale;
    const pot = game.pot;
    const potX = pot.x;
    const potBottomY = pot.groundY;
    const potTopY = potBottomY - pot.height;
    const mouthR = pot.mouthDiameter / 2;
    const bodyR = pot.bodyDiameter / 2;

    ctx.save();

    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(potX, potBottomY + 3 * s, bodyR + 8 * s, 6 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    const bodyGrad = ctx.createLinearGradient(potX - bodyR, 0, potX + bodyR, 0);
    bodyGrad.addColorStop(0, '#1A2A3A');
    bodyGrad.addColorStop(0.3, '#2E4A62');
    bodyGrad.addColorStop(0.5, '#3D5C78');
    bodyGrad.addColorStop(0.7, '#2E4A62');
    bodyGrad.addColorStop(1, '#1A2A3A');

    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.moveTo(potX - bodyR * 1.1, potBottomY);
    ctx.quadraticCurveTo(potX - bodyR * 1.3, potBottomY - pot.height * 0.3, potX - bodyR, potBottomY - pot.height * 0.5);
    ctx.quadraticCurveTo(potX - bodyR * 0.95, potTopY + 15 * s, potX - mouthR, potTopY);
    ctx.lineTo(potX + mouthR, potTopY);
    ctx.quadraticCurveTo(potX + bodyR * 0.95, potTopY + 15 * s, potX + bodyR, potBottomY - pot.height * 0.5);
    ctx.quadraticCurveTo(potX + bodyR * 1.3, potBottomY - pot.height * 0.3, potX + bodyR * 1.1, potBottomY);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#1A2A3A';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#1A2A3A';
    ctx.beginPath();
    ctx.ellipse(potX, potTopY, mouthR, 6 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    const innerGrad = ctx.createRadialGradient(potX, potTopY + 2 * s, 0, potX, potTopY + 2 * s, mouthR * 0.9);
    innerGrad.addColorStop(0, '#0A141F');
    innerGrad.addColorStop(0.7, '#12202F');
    innerGrad.addColorStop(1, '#1A2A3A');
    ctx.fillStyle = innerGrad;
    ctx.beginPath();
    ctx.ellipse(potX, potTopY + 5 * s, mouthR * 0.88, mouthR * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#3D5C78';
    ctx.beginPath();
    ctx.ellipse(potX, potTopY, mouthR + 4 * s, 4 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1A2A3A';
    ctx.lineWidth = 1;
    ctx.stroke();

    this.drawPotPattern(ctx, potX, potTopY + 1 * s, mouthR, s);

    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.ellipse(potX, potBottomY - pot.height * 0.7, bodyR * 0.85, mouthR * 0.2, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;

    ctx.restore();
  }

  private drawPotPattern(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, s: number): void {
    ctx.save();
    ctx.strokeStyle = '#D4AF37';
    ctx.globalAlpha = 0.6;
    ctx.lineWidth = 1;

    const steps = 24;
    const patternW = (Math.PI * 2 * (radius + 2 * s)) / steps;

    for (let i = 0; i < steps; i++) {
      const angle1 = (i / steps) * Math.PI * 2;
      const angle2 = ((i + 0.5) / steps) * Math.PI * 2;
      const angle3 = ((i + 1) / steps) * Math.PI * 2;

      const r1 = radius + 1 * s;
      const p1x = cx + Math.cos(angle1) * r1;
      const p1y = cy + Math.sin(angle1) * r1 * 0.25;

      const r2 = radius + 3 * s;
      const p2x = cx + Math.cos(angle2) * r2;
      const p2y = cy + Math.sin(angle2) * r2 * 0.25;

      const p3x = cx + Math.cos(angle3) * r1;
      const p3y = cy + Math.sin(angle3) * r1 * 0.25;

      ctx.beginPath();
      ctx.moveTo(p1x, p1y);
      ctx.lineTo(p2x, p2y);
      ctx.lineTo(p3x, p3y);
      ctx.stroke();
    }

    ctx.restore();
  }

  private drawArrows(game: GameEngine): void {
    for (const arrow of game.arrows) {
      this.drawArrowTrail(game, arrow);
    }
    for (const arrow of game.arrows) {
      this.drawArrow(game, arrow);
    }
  }

  private drawArrow(game: GameEngine, arrow: Arrow): void {
    const ctx = this.ctx;
    const s = game.scale;
    const arrowLen = GameEngine.ARROW_LENGTH * s;
    const thickness = GameEngine.ARROW_THICKNESS * s;

    ctx.save();
    ctx.translate(arrow.x, arrow.y);
    ctx.rotate(arrow.angle);

    ctx.fillStyle = '#D2B48C';
    ctx.fillRect(-arrowLen * 0.5, -thickness / 2, arrowLen * 0.85, thickness);

    ctx.strokeStyle = '#8B7355';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 4; i++) {
      const ly = -arrowLen * 0.5 + i * arrowLen * 0.2;
      ctx.beginPath();
      ctx.moveTo(ly, -thickness / 2);
      ctx.lineTo(ly + 2 * s, thickness / 2);
      ctx.stroke();
    }

    ctx.fillStyle = '#B8860B';
    ctx.beginPath();
    ctx.moveTo(arrowLen * 0.35, -thickness * 1.2);
    ctx.lineTo(arrowLen * 0.5, 0);
    ctx.lineTo(arrowLen * 0.35, thickness * 1.2);
    ctx.lineTo(arrowLen * 0.3, -thickness / 2);
    ctx.lineTo(arrowLen * 0.3, thickness / 2);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#8B6914';
    ctx.lineWidth = 0.5;
    ctx.stroke();

    ctx.fillStyle = '#FFF0F5';
    const featherStart = -arrowLen * 0.5;
    for (let i = 0; i < 3; i++) {
      const fx = featherStart + i * 6 * s;
      ctx.beginPath();
      ctx.moveTo(fx, 0);
      ctx.quadraticCurveTo(fx - 6 * s, -9 * s, fx - 12 * s, -13 * s);
      ctx.quadraticCurveTo(fx - 4 * s, -5 * s, fx, 0);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(fx, 0);
      ctx.quadraticCurveTo(fx - 6 * s, 9 * s, fx - 12 * s, 13 * s);
      ctx.quadraticCurveTo(fx - 4 * s, 5 * s, fx, 0);
      ctx.fill();
    }

    ctx.restore();
  }

  private drawArrowTrail(game: GameEngine, arrow: Arrow): void {
    const ctx = this.ctx;
    const s = game.scale;

    for (let i = 0; i < arrow.trail.length; i++) {
      const t = arrow.trail[i];
      const alpha = t.life * 0.6;
      const size = (3 + (i / arrow.trail.length) * 2) * s;

      ctx.save();
      ctx.globalAlpha = alpha;

      const grad = ctx.createRadialGradient(t.x, t.y, 0, t.x, t.y, size);
      grad.addColorStop(0, '#00BFFF');
      grad.addColorStop(1, 'rgba(0, 191, 255, 0)');
      ctx.fillStyle = grad;

      ctx.beginPath();
      ctx.arc(t.x, t.y, size, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  private drawEffects(game: GameEngine): void {
    this.drawRipples(game);
  }

  private drawRipples(game: GameEngine): void {
    const ctx = this.ctx;

    for (const ripple of game.ripples) {
      const alpha = ripple.life / ripple.maxLife;

      ctx.save();
      ctx.globalAlpha = alpha * 0.8;
      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(ripple.x, ripple.y, ripple.radius, ripple.radius * 0.3, 0, 0, Math.PI * 2);
      ctx.stroke();

      if (ripple.radius > 10) {
        ctx.globalAlpha = alpha * 0.4;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(ripple.x, ripple.y, ripple.radius * 0.6, ripple.radius * 0.18, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  private drawUI(game: GameEngine): void {
    this.drawRoundIndicator(game);
    this.drawChargeBar(game);
    this.drawScorePanel(game);
    this.drawHintMessage(game);
  }

  private drawRoundIndicator(game: GameEngine): void {
    const ctx = this.ctx;
    const s = game.scale;
    const padding = 16 * s;
    const x = padding;
    const y = padding;

    const roundText = game.getRoundChinese();
    const playerText = game.getCurrentPlayer().name;
    const fontSize = 20 * s;

    ctx.save();
    ctx.font = `${fontSize}px "KaiTi", "STKaiti", "楷体", serif`;
    const textW1 = ctx.measureText(roundText).width;
    const textW2 = ctx.measureText(playerText).width;
    const maxW = Math.max(textW1, textW2);
    const boxW = maxW + 32 * s;
    const boxH = fontSize * 2.5 + 16 * s;

    ctx.fillStyle = 'rgba(237, 228, 212, 0.7)';
    this.roundRect(ctx, x, y, boxW, boxH, 10 * s);
    ctx.fill();

    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 2;
    this.roundRect(ctx, x, y, boxW, boxH, 10 * s);
    ctx.stroke();

    ctx.fillStyle = '#333333';
    ctx.textBaseline = 'top';
    ctx.fillText(roundText, x + (boxW - textW1) / 2, y + 8 * s);

    ctx.fillStyle = game.currentPlayerIndex === 0 ? '#191970' : '#800020';
    ctx.font = `bold ${fontSize}px "KaiTi", "STKaiti", "楷体", serif`;
    ctx.fillText(playerText, x + (boxW - textW2) / 2, y + fontSize + 12 * s);

    ctx.restore();
  }

  private drawChargeBar(game: GameEngine): void {
    const ctx = this.ctx;
    const s = game.scale;
    const barW = 100 * s;
    const barH = 12 * s;
    const x = 16 * s;
    const y = game.canvasHeight - 100 * s;

    ctx.save();

    ctx.fillStyle = '#333333';
    this.roundRect(ctx, x, y, barW, barH, 4 * s);
    ctx.fill();

    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 1.5;
    this.roundRect(ctx, x, y, barW, barH, 4 * s);
    ctx.stroke();

    if (game.charging || game.chargeValue > 0) {
      const fillW = (game.chargeValue / 100) * (barW - 4 * s);
      const grad = ctx.createLinearGradient(x, y, x + barW, y);

      if (game.chargeValue <= 30) {
        const t = game.chargeValue / 30;
        grad.addColorStop(0, '#2E8B57');
        grad.addColorStop(1, this.lerpColor('#2E8B57', '#8B0000', t * 0.3));
      } else {
        grad.addColorStop(0, '#8B7355');
        grad.addColorStop(0.3, this.lerpColor('#2E8B57', '#8B0000', 0.5));
        const t = (game.chargeValue - 30) / 70;
        grad.addColorStop(1, this.lerpColor('#8B0000', '#FF0000', t * 0.3));
      }

      ctx.fillStyle = grad;
      this.roundRect(ctx, x + 2 * s, y + 2 * s, fillW, barH - 4 * s, 2 * s);
      ctx.fill();
    }

    ctx.fillStyle = '#1A1A1A';
    ctx.font = `${12 * s}px "KaiTi", "STKaiti", "楷体", serif`;
    ctx.textBaseline = 'top';
    const label = `蓄力: ${Math.floor(game.chargeValue)}%`;
    ctx.fillText(label, x, y - 18 * s);

    ctx.restore();
  }

  private lerpColor(a: string, b: string, t: number): string {
    const ah = parseInt(a.replace('#', ''), 16);
    const bh = parseInt(b.replace('#', ''), 16);
    const ar = (ah >> 16) & 0xff;
    const ag = (ah >> 8) & 0xff;
    const ab = ah & 0xff;
    const br = (bh >> 16) & 0xff;
    const bg = (bh >> 8) & 0xff;
    const bb = bh & 0xff;
    const rr = Math.round(ar + (br - ar) * t);
    const rg = Math.round(ag + (bg - ag) * t);
    const rb = Math.round(ab + (bb - ab) * t);
    return '#' + ((1 << 24) | (rr << 16) | (rg << 8) | rb).toString(16).slice(1);
  }

  private drawScorePanel(game: GameEngine): void {
    const ctx = this.ctx;
    const s = game.scale;
    const w = game.canvasWidth;
    const h = game.canvasHeight;

    const panelW = w * 0.5;
    const panelH = 70 * s;
    const x = (w - panelW) / 2;
    const y = h - panelH - 16 * s;

    ctx.save();

    ctx.shadowColor = 'rgba(212, 175, 55, 0.3)';
    ctx.shadowBlur = 15 * s;

    ctx.fillStyle = '#EDE4D4';
    this.roundRect(ctx, x, y, panelW, panelH, 12 * s);
    ctx.fill();

    ctx.shadowBlur = 0;

    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 2;
    this.roundRect(ctx, x, y, panelW, panelH, 12 * s);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(212, 175, 55, 0.3)';
    ctx.lineWidth = 1;
    this.roundRect(ctx, x + 4 * s, y + 4 * s, panelW - 8 * s, panelH - 8 * s, 10 * s);
    ctx.stroke();

    const stats = game.getRoundStats();
    const titleFont = `${14 * s}px "STXingkai", "华文行楷", "KaiTi", serif`;
    const valueFont = `bold ${18 * s}px "STXingkai", "华文行楷", "KaiTi", serif`;

    const playerName = game.getCurrentPlayer().name;
    const playerLabel = `${playerName}本轮统计`;

    if (game.roundStatsVisible) {
      ctx.fillStyle = '#1A1A1A';
      ctx.font = `bold ${18 * s}px "STXingkai", "华文行楷", "KaiTi", serif`;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      ctx.fillText(playerLabel, x + panelW / 2, y + 16 * s);

      ctx.textAlign = 'left';
      const sectionW = panelW / 3;

      ctx.font = titleFont;
      ctx.fillStyle = '#555555';
      ctx.fillText('投中数量', x + sectionW * 0.5 - ctx.measureText('投中数量').width / 2, y + 38 * s);
      ctx.fillText('未中数量', x + sectionW * 1.5 - ctx.measureText('未中数量').width / 2, y + 38 * s);
      ctx.fillText('总得分', x + sectionW * 2.5 - ctx.measureText('总得分').width / 2, y + 38 * s);

      ctx.font = valueFont;
      ctx.fillStyle = '#2E8B57';
      const v1 = `${stats.hits}`;
      ctx.fillText(v1, x + sectionW * 0.5 - ctx.measureText(v1).width / 2, y + 58 * s);

      ctx.fillStyle = '#8B0000';
      const v2 = `${stats.misses}`;
      ctx.fillText(v2, x + sectionW * 1.5 - ctx.measureText(v2).width / 2, y + 58 * s);

      ctx.fillStyle = '#1A1A1A';
      const v3 = `${stats.score}分`;
      ctx.fillText(v3, x + sectionW * 2.5 - ctx.measureText(v3).width / 2, y + 58 * s);
    } else {
      ctx.fillStyle = '#1A1A1A';
      ctx.font = titleFont;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';

      const items = [
        { label: '甲方', value: `${game.players[0].totalScore}分`, color: '#191970' },
        { label: '回合', value: `${game.currentRound}/${GameEngine.TOTAL_ROUNDS}`, color: '#1A1A1A' },
        { label: '箭支', value: `${game.arrowsInRound}/${GameEngine.ARROWS_PER_ROUND}`, color: '#1A1A1A' },
        { label: '乙方', value: `${game.players[1].totalScore}分`, color: '#800020' },
      ];

      const sectionW = panelW / items.length;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        ctx.fillStyle = '#555555';
        ctx.font = titleFont;
        ctx.fillText(item.label, x + sectionW * (i + 0.5), y + 22 * s);
        ctx.fillStyle = item.color;
        ctx.font = valueFont;
        ctx.fillText(item.value, x + sectionW * (i + 0.5), y + 48 * s);
      }
    }

    ctx.restore();
  }

  private drawHintMessage(game: GameEngine): void {
    if (!game.hintMessage) return;

    const ctx = this.ctx;
    const s = game.scale;
    const w = game.canvasWidth;
    const h = game.canvasHeight;

    const progress = 1 - game.hintMessage.life / game.hintMessage.maxLife;
    let scaleFactor: number;
    if (progress < 0.5) {
      scaleFactor = 0.5 + progress * 1.5;
    } else {
      scaleFactor = 1.25 - (progress - 0.5) * 0.5;
    }

    const alpha = progress < 0.9 ? 1 : (1 - progress) / 0.1;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(w / 2, h * 0.35);
    ctx.scale(scaleFactor, scaleFactor);

    ctx.shadowColor = '#D4AF37';
    ctx.shadowBlur = 20 * s;
    ctx.fillStyle = '#D4AF37';
    ctx.font = `bold ${40 * s}px "STXingkai", "华文行楷", "KaiTi", serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(game.hintMessage.text, 0, 0);

    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#8B6914';
    ctx.lineWidth = 1.5;
    ctx.strokeText(game.hintMessage.text, 0, 0);

    ctx.restore();
  }

  private drawGameEndDialog(game: GameEngine): void {
    const ctx = this.ctx;
    const s = game.scale;
    const w = game.canvasWidth;
    const h = game.canvasHeight;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(0, 0, w, h);

    const dialogW = Math.min(500 * s, w * 0.8);
    const dialogH = 320 * s;
    const x = (w - dialogW) / 2;
    const y = (h - dialogH) / 2;

    this.drawScrollFrame(ctx, x, y, dialogW, dialogH, s);

    ctx.fillStyle = '#1A1A1A';
    ctx.font = `bold ${36 * s}px "STLiti", "华文隶书", "LiSu", "隶书", serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    const winner = game.getWinner();
    const titleText = winner ? `${winner.name}获胜` : '平局';
    ctx.fillText(titleText, x + dialogW / 2, y + 40 * s);

    ctx.font = `${24 * s}px "STXingkai", "华文行楷", "KaiTi", serif`;
    ctx.fillStyle = '#555555';
    const scoreText = `最终比分  甲方 ${game.players[0].totalScore} : ${game.players[1].totalScore} 乙方`;
    ctx.fillText(scoreText, x + dialogW / 2, y + 100 * s);

    const btnW = 120 * s;
    const btnH = 50 * s;
    const btnX = x + (dialogW - btnW) / 2;
    const btnY = y + dialogH - 90 * s;
    this.restartButtonRect = { x: btnX, y: btnY, w: btnW, h: btnH };

    this.drawSealButton(ctx, btnX, btnY, btnW, btnH, this.buttonHover, s);

    ctx.fillStyle = '#5C0000';
    ctx.font = `bold ${20 * s}px "STZhongsong", "华文中宋", "SimSun", serif`;
    ctx.textBaseline = 'middle';
    ctx.fillText('再战一局', x + dialogW / 2, btnY + btnH / 2);

    ctx.restore();
  }

  private drawScrollFrame(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    s: number
  ): void {
    const poleH = 20 * s;
    const poleR = 8 * s;

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 20 * s;

    ctx.fillStyle = '#F5DEB3';
    this.roundRect(ctx, x, y + poleH, w, h - poleH * 2, 4 * s);
    ctx.fill();

    ctx.shadowBlur = 0;

    const paperGrad = ctx.createLinearGradient(x, y, x + w, y + h);
    paperGrad.addColorStop(0, 'rgba(139, 69, 19, 0.05)');
    paperGrad.addColorStop(0.5, 'rgba(139, 69, 19, 0)');
    paperGrad.addColorStop(1, 'rgba(139, 69, 19, 0.08)');
    ctx.fillStyle = paperGrad;
    this.roundRect(ctx, x, y + poleH, w, h - poleH * 2, 4 * s);
    ctx.fill();

    ctx.strokeStyle = 'rgba(107, 66, 38, 0.3)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 5; i++) {
      const ly = y + poleH + (i * (h - poleH * 2)) / 5;
      ctx.beginPath();
      ctx.moveTo(x + 10 * s, ly);
      ctx.lineTo(x + w - 10 * s, ly);
      ctx.globalAlpha = 0.3;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    ctx.fillStyle = '#6B4226';
    this.roundRect(ctx, x - 4 * s, y, w + 8 * s, poleH + 4 * s, 6 * s);
    ctx.fill();

    ctx.fillStyle = '#5C3317';
    this.roundRect(ctx, x - 4 * s, y, poleR, poleH + 4 * s, 6 * s);
    ctx.fill();
    this.roundRect(ctx, x + w - poleR + 4 * s, y, poleR, poleH + 4 * s, 6 * s);
    ctx.fill();

    ctx.fillStyle = '#D4AF37';
    ctx.beginPath();
    ctx.arc(x + poleR / 2, y + poleH / 2 + 2 * s, 3 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + w - poleR / 2, y + poleH / 2 + 2 * s, 3 * s, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#6B4226';
    this.roundRect(ctx, x - 4 * s, y + h - poleH - 4 * s, w + 8 * s, poleH + 4 * s, 6 * s);
    ctx.fill();

    ctx.fillStyle = '#5C3317';
    this.roundRect(ctx, x - 4 * s, y + h - poleH - 4 * s, poleR, poleH + 4 * s, 6 * s);
    ctx.fill();
    this.roundRect(ctx, x + w - poleR + 4 * s, y + h - poleH - 4 * s, poleR, poleH + 4 * s, 6 * s);
    ctx.fill();

    ctx.fillStyle = '#D4AF37';
    ctx.beginPath();
    ctx.arc(x + poleR / 2, y + h - poleH / 2 - 2 * s, 3 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + w - poleR / 2, y + h - poleH / 2 - 2 * s, 3 * s, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.5;
    this.roundRect(ctx, x + 8 * s, y + poleH + 8 * s, w - 16 * s, h - poleH * 2 - 16 * s, 2 * s);
    ctx.stroke();
    ctx.globalAlpha = 1;

    ctx.restore();
  }

  private drawSealButton(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    hover: boolean,
    s: number
  ): void {
    ctx.save();

    if (hover) {
      ctx.shadowColor = 'rgba(212, 175, 55, 0.6)';
      ctx.shadowBlur = 20 * s;
    }

    ctx.fillStyle = '#8B0000';
    this.roundRect(ctx, x, y, w, h, 4 * s);
    ctx.fill();

    ctx.strokeStyle = '#5C0000';
    ctx.lineWidth = 3;
    this.roundRect(ctx, x + 1, y + 1, w - 2, h - 2, 4 * s);
    ctx.stroke();

    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.6;
    this.roundRect(ctx, x + 4 * s, y + 4 * s, w - 8 * s, h - 8 * s, 2 * s);
    ctx.stroke();
    ctx.globalAlpha = 1;

    ctx.fillStyle = '#5C0000';
    ctx.font = `${10 * s}px serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const corners = ['印', '印', '印', '印'];
    ctx.globalAlpha = 0.3;
    ctx.fillText(corners[0], x + 3 * s, y + 2 * s);
    ctx.textAlign = 'right';
    ctx.fillText(corners[1], x + w - 3 * s, y + 2 * s);
    ctx.textBaseline = 'bottom';
    ctx.fillText(corners[2], x + w - 3 * s, y + h - 2 * s);
    ctx.textAlign = 'left';
    ctx.fillText(corners[3], x + 3 * s, y + h - 2 * s);
    ctx.globalAlpha = 1;

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
}
