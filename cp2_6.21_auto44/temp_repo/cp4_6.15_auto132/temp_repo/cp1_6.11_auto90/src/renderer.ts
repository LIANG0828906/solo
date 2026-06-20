import type { BattleState, BattleUnitState, VisualEffect } from './types.js';

const CELL_SIZE = 70;
const ICON_SIZE = 50;
const HP_BAR_HEIGHT = 6;
const HP_BAR_Y_OFFSET = 8;

export class BattleRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private stonePattern: CanvasPattern | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.width = canvas.width;
    this.height = canvas.height;
    this.generateStonePattern();
  }

  private generateStonePattern(): void {
    const patternCanvas = document.createElement('canvas');
    patternCanvas.width = 128;
    patternCanvas.height = 128;
    const pctx = patternCanvas.getContext('2d')!;

    pctx.fillStyle = '#2A2A3A';
    pctx.fillRect(0, 0, 128, 128);

    for (let i = 0; i < 20; i++) {
      const x = Math.random() * 128;
      const y = Math.random() * 128;
      const size = 3 + Math.random() * 8;
      const shade = 30 + Math.floor(Math.random() * 30);
      pctx.fillStyle = `rgb(${shade}, ${shade}, ${shade + 10})`;
      pctx.beginPath();
      pctx.arc(x, y, size, 0, Math.PI * 2);
      pctx.fill();
    }

    const tileSize = 32;
    pctx.strokeStyle = '#1A1A2A';
    pctx.lineWidth = 1;
    for (let x = 0; x <= 128; x += tileSize) {
      for (let y = 0; y <= 128; y += tileSize) {
        const offsetY = (Math.floor(y / tileSize) % 2) * (tileSize / 2);
        pctx.strokeRect(x + offsetY, y, tileSize, tileSize);
      }
    }

    this.stonePattern = this.ctx.createPattern(patternCanvas, 'repeat');
  }

  resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    this.width = width;
    this.height = height;
  }

  render(state: BattleState): void {
    this.ctx.clearRect(0, 0, this.width, this.height);

    this.drawBackground();
    this.drawGridLines(state);

    state.playerUnits.forEach(u => this.drawUnit(u));
    state.enemyUnits.forEach(u => this.drawUnit(u));

    state.effects.forEach(effect => this.drawVisualEffect(effect));

    if (state.phase === 'ended' && state.winner) {
      this.drawVictoryOverlay(state.winner);
    }
  }

  private drawBackground(): void {
    if (this.stonePattern) {
      this.ctx.fillStyle = this.stonePattern;
    } else {
      this.ctx.fillStyle = '#2A2A3A';
    }
    this.ctx.fillRect(0, 0, this.width, this.height);

    const gradient = this.ctx.createLinearGradient(0, 0, this.width, 0);
    gradient.addColorStop(0, 'rgba(34, 197, 94, 0.05)');
    gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(1, 'rgba(233, 69, 96, 0.05)');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.ctx.strokeStyle = 'rgba(15, 52, 96, 0.6)';
    this.ctx.lineWidth = 3;
    this.ctx.setLineDash([10, 10]);
    this.ctx.beginPath();
    this.ctx.moveTo(this.width / 2, 20);
    this.ctx.lineTo(this.width / 2, this.height - 20);
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    this.ctx.fillStyle = 'rgba(34, 197, 94, 0.15)';
    this.ctx.font = 'bold 16px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('◄ 我方阵营', this.width * 0.25, 30);

    this.ctx.fillStyle = 'rgba(233, 69, 96, 0.15)';
    this.ctx.fillText('敌方阵营 ►', this.width * 0.75, 30);
  }

  private drawGridLines(state: BattleState): void {
    this.ctx.strokeStyle = 'rgba(42, 42, 74, 0.4)';
    this.ctx.lineWidth = 1;

    const drawTeamGrid = (units: BattleUnitState[], isEnemy: boolean) => {
      const cols = 3;
      const rows = Math.ceil(units.length / cols);
      if (rows === 0) return;

      const marginX = this.width * 0.08;
      const marginY = this.height * 0.15;
      const gridWidth = this.width * 0.38;
      const gridHeight = this.height * 0.7;
      const cellWidth = gridWidth / cols;
      const cellHeight = gridHeight / Math.max(rows, 1);
      const baseX = isEnemy ? this.width - marginX - gridWidth : marginX;

      for (let r = 0; r <= rows; r++) {
        const y = marginY + cellHeight * r;
        this.ctx.beginPath();
        this.ctx.moveTo(baseX, y);
        this.ctx.lineTo(baseX + gridWidth, y);
        this.ctx.stroke();
      }

      for (let c = 0; c <= cols; c++) {
        const x = baseX + cellWidth * c;
        this.ctx.beginPath();
        this.ctx.moveTo(x, marginY);
        this.ctx.lineTo(x, marginY + cellHeight * Math.max(rows, 1));
        this.ctx.stroke();
      }
    };

    drawTeamGrid(state.playerUnits, false);
    drawTeamGrid(state.enemyUnits, true);
  }

  private drawUnit(unit: BattleUnitState): void {
    const x = unit.screenX;
    const y = unit.screenY;

    let scale = 1;
    let offsetX = 0;
    let shakeX = 0;

    if (unit.animationState === 'attacking' || unit.animationState === 'returning') {
      scale = 1.1;
    } else if (unit.animationState === 'hurt') {
      const phase = (unit.animationProgress % 200) / 200;
      shakeX = Math.sin(phase * Math.PI * 4) * 3;
    } else if (unit.animationState === 'dead') {
      scale = 0.05;
    }

    if (unit.animationState === 'dead') {
      this.ctx.globalAlpha = 0.3;
    }

    this.drawUnitCard(x + shakeX + offsetX, y, scale, unit);

    this.ctx.globalAlpha = 1;
  }

  private drawUnitCard(x: number, y: number, scale: number, unit: BattleUnitState): void {
    const iconRadius = (ICON_SIZE / 2) * scale;
    const cardHeight = ICON_SIZE * scale + HP_BAR_HEIGHT + 20;

    const cardGradient = this.ctx.createLinearGradient(x - iconRadius - 5, y - cardHeight / 2, x + iconRadius + 5, y + cardHeight / 2);
    if (unit.isEnemy) {
      cardGradient.addColorStop(0, 'rgba(233, 69, 96, 0.3)');
      cardGradient.addColorStop(1, 'rgba(233, 69, 96, 0.1)');
    } else {
      cardGradient.addColorStop(0, 'rgba(34, 197, 94, 0.3)');
      cardGradient.addColorStop(1, 'rgba(34, 197, 94, 0.1)');
    }

    this.ctx.fillStyle = cardGradient;
    this.ctx.beginPath();
    this.roundRect(x - iconRadius - 8, y - cardHeight / 2, (iconRadius + 8) * 2, cardHeight, 8);
    this.ctx.fill();

    this.ctx.strokeStyle = unit.unit.color;
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.roundRect(x - iconRadius - 8, y - cardHeight / 2, (iconRadius + 8) * 2, cardHeight, 8);
    this.ctx.stroke();

    const safeRadius = Math.max(0, iconRadius - 2);

    this.ctx.fillStyle = unit.unit.color;
    this.ctx.beginPath();
    this.ctx.arc(x, y - 5, safeRadius, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(x, y - 5, safeRadius, 0, Math.PI * 2);
    this.ctx.stroke();

    this.ctx.font = `${Math.round(28 * scale)}px sans-serif`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillStyle = '#1A1A2E';
    this.ctx.fillText(unit.unit.icon, x, y - 5);

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(x - iconRadius + 2, y - iconRadius + 2, 22 * scale, 14 * scale);
    this.ctx.fillStyle = '#C9A96E';
    this.ctx.font = `bold ${Math.round(10 * scale)}px sans-serif`;
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';
    this.ctx.fillText(`Lv${unit.unit.level}`, x - iconRadius + 4, y - iconRadius + 3);

    const hpX = x - iconRadius;
    const hpY = y + ICON_SIZE / 2 * scale - 2 + HP_BAR_Y_OFFSET;
    const hpWidth = iconRadius * 2;
    const hpHeight = HP_BAR_HEIGHT;

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    this.beginRoundedRect(hpX, hpY, hpWidth, hpHeight, 3);
    this.ctx.fill();

    const hpRatio = unit.unit.currentHp / unit.unit.stats.hp;
    const actualHpWidth = Math.max(0, hpWidth * hpRatio);

    let hpColor = '#22C55E';
    if (hpRatio <= 0.3) hpColor = '#E94560';
    else if (hpRatio <= 0.6) hpColor = '#F59E0B';

    const hpGradient = this.ctx.createLinearGradient(hpX, hpY, hpX, hpY + hpHeight);
    hpGradient.addColorStop(0, this.lightenColor(hpColor, 20));
    hpGradient.addColorStop(1, hpColor);

    this.ctx.fillStyle = hpGradient;
    this.beginRoundedRect(hpX, hpY, actualHpWidth, hpHeight, 3);
    this.ctx.fill();

    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.lineWidth = 1;
    this.beginRoundedRect(hpX, hpY, hpWidth, hpHeight, 3);
    this.ctx.stroke();

    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = `bold ${Math.round(9 * scale)}px sans-serif`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(
      `${Math.ceil(unit.unit.currentHp)}/${unit.unit.stats.hp}`,
      x,
      hpY + hpHeight / 2
    );

    this.ctx.fillStyle = '#EAEAEA';
    this.ctx.font = `bold ${Math.round(11 * scale)}px sans-serif`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';
    this.ctx.fillText(unit.unit.name, x, y + cardHeight / 2 - 14);

    if (unit.unit.effects.length > 0) {
      this.ctx.fillStyle = 'rgba(192, 132, 252, 0.2)';
      this.ctx.beginPath();
      this.ctx.arc(x, y - 5, iconRadius + 4, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  private drawVisualEffect(effect: VisualEffect): void {
    const t = effect.progress / effect.duration;

    switch (effect.type) {
      case 'aura':
        this.drawAura(effect, t);
        break;
      case 'arrow':
        this.drawArrow(effect, t);
        break;
      case 'shadow':
        this.drawShadow(effect, t);
        break;
      case 'damage_text':
        this.drawFloatingText(effect, t, true);
        break;
      case 'heal_text':
        this.drawFloatingText(effect, t, false);
        break;
    }
  }

  private drawAura(effect: VisualEffect, t: number): void {
    const radius = 20 + t * 50;
    const alpha = 1 - t;

    this.ctx.save();
    this.ctx.globalAlpha = alpha * 0.6;
    this.ctx.strokeStyle = effect.color;
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
    this.ctx.stroke();

    this.ctx.globalAlpha = alpha * 0.2;
    this.ctx.fillStyle = effect.color;
    this.ctx.beginPath();
    this.ctx.arc(effect.x, effect.y, radius * 0.8, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();
  }

  private drawArrow(effect: VisualEffect, t: number): void {
    if (effect.targetX === undefined || effect.targetY === undefined) return;

    const x = effect.x + (effect.targetX - effect.x) * t;
    const y = effect.y + (effect.targetY - effect.y) * t;
    const angle = Math.atan2(effect.targetY - effect.y, effect.targetX - effect.x);

    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.rotate(angle);

    this.ctx.strokeStyle = effect.color;
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(-20, 0);
    this.ctx.lineTo(10, 0);
    this.ctx.stroke();

    this.ctx.fillStyle = effect.color;
    this.ctx.beginPath();
    this.ctx.moveTo(10, 0);
    this.ctx.lineTo(0, -4);
    this.ctx.lineTo(0, 4);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.strokeStyle = effect.color;
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(-20, 0);
    this.ctx.lineTo(-26, -3);
    this.ctx.moveTo(-20, 0);
    this.ctx.lineTo(-26, 3);
    this.ctx.stroke();

    this.ctx.restore();
  }

  private drawShadow(effect: VisualEffect, t: number): void {
    const alpha = Math.sin(t * Math.PI);
    const size = 30 + t * 20;

    this.ctx.save();
    this.ctx.globalAlpha = alpha * 0.7;
    this.ctx.strokeStyle = effect.color;
    this.ctx.lineWidth = 3;

    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2 + t * Math.PI * 2;
      const offsetX = Math.cos(angle) * size * 0.5;
      const offsetY = Math.sin(angle) * size * 0.5;

      this.ctx.beginPath();
      this.ctx.moveTo(effect.x, effect.y);
      this.ctx.quadraticCurveTo(
        effect.x + offsetX * 1.5,
        effect.y + offsetY * 0.5,
        effect.x + offsetX,
        effect.y + offsetY
      );
      this.ctx.stroke();
    }

    this.ctx.globalAlpha = alpha * 0.3;
    this.ctx.fillStyle = effect.color;
    this.ctx.beginPath();
    this.ctx.arc(effect.x, effect.y, size * 0.6, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.restore();
  }

  private drawFloatingText(effect: VisualEffect, t: number, isDamage: boolean): void {
    const alpha = 1 - t;
    const yOffset = -t * 40;
    const scale = 1 + t * 0.3;

    this.ctx.save();
    this.ctx.globalAlpha = alpha;
    this.ctx.translate(effect.x, effect.y + yOffset);
    this.ctx.scale(scale, scale);

    this.ctx.font = 'bold 20px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.lineWidth = 3;
    this.ctx.strokeText(effect.value || '', 0, 0);

    this.ctx.fillStyle = effect.color;
    this.ctx.fillText(effect.value || '', 0, 0);

    this.ctx.restore();
  }

  private drawVictoryOverlay(winner: 'player' | 'enemy'): void {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    const text = winner === 'player' ? '★ 战斗胜利！★' : '✘ 战斗失败 ✘';
    const color = winner === 'player' ? '#C9A96E' : '#E94560';

    this.ctx.font = 'bold 60px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    for (let i = 1; i <= 5; i++) {
      this.ctx.arc(this.width / 2, this.height / 2, 60 + i * 20, 0, Math.PI * 2);
    }

    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.arc(this.width / 2, this.height / 2, 80, 0, Math.PI * 2);
    this.ctx.stroke();

    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.lineWidth = 6;
    this.ctx.strokeText(text, this.width / 2, this.height / 2);

    this.ctx.fillStyle = color;
    this.ctx.fillText(text, this.width / 2, this.height / 2);
  }

  private beginRoundedRect(x: number, y: number, w: number, h: number, r: number): void {
    this.ctx.beginPath();
    this.ctx.moveTo(x + r, y);
    this.ctx.lineTo(x + w - r, y);
    this.ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    this.ctx.lineTo(x + w, y + h - r);
    this.ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    this.ctx.lineTo(x + r, y + h);
    this.ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    this.ctx.lineTo(x, y + r);
    this.ctx.quadraticCurveTo(x, y, x + r, y);
    this.ctx.closePath();
  }

  private roundRect(x: number, y: number, w: number, h: number, r: number): void {
    this.ctx.moveTo(x + r, y);
    this.ctx.lineTo(x + w - r, y);
    this.ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    this.ctx.lineTo(x + w, y + h - r);
    this.ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    this.ctx.lineTo(x + r, y + h);
    this.ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    this.ctx.lineTo(x, y + r);
    this.ctx.quadraticCurveTo(x, y, x + r, y);
  }

  private lightenColor(color: string, percent: number): string {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
    const B = Math.min(255, (num & 0x0000FF) + amt);
    return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
  }
}
