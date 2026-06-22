import type { GameState, Tower, Monster, Particle, AttackLine } from './types';
import {
  HEX_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, TOWER_CONFIGS,
  hexToPixel, getHexCorners, getGridOffset, GRID_WIDTH, GRID_HEIGHT, isOnPath,
  getTowerRange
} from './config';

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private gridOffset: { x: number; y: number };
  private attackLines: AttackLine[] = [];

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
    this.gridOffset = getGridOffset();
  }

  public addAttackLine(from: { x: number; y: number }, to: { x: number; y: number }, color: string): void {
    this.attackLines.push({ from, to, color, life: 0.15 });
  }

  public render(state: GameState, deltaTime: number): void {
    this.clear();
    this.drawBackground();
    this.drawGrid(state);
    this.drawPath(state);
    this.drawTowers(state, deltaTime);
    this.drawMonsters(state, deltaTime);
    this.drawParticles(state);
    this.drawAttackLines(deltaTime);
    this.drawHoverPreview(state);
    this.drawSelectedTowerRange(state);
  }

  private clear(): void {
    this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  private drawBackground(): void {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, COLORS.backgroundStart);
    gradient.addColorStop(1, COLORS.backgroundEnd);
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.015)';
    for (let i = 0; i < 60; i++) {
      const x = (i * 137) % CANVAS_WIDTH;
      const y = (i * 97) % CANVAS_HEIGHT;
      const r = 1 + (i % 3);
      this.ctx.beginPath();
      this.ctx.arc(x, y, r, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  private drawGrid(state: GameState): void {
    for (let q = 0; q < GRID_WIDTH; q++) {
      for (let r = 0; r < GRID_HEIGHT; r++) {
        const hex = { q, r };
        if (isOnPath(hex, state.path)) continue;

        const pixel = hexToPixel(hex, HEX_SIZE);
        const cx = pixel.x + this.gridOffset.x;
        const cy = pixel.y + this.gridOffset.y;

        const isHovered = state.hoveredCell && state.hoveredCell.q === q && state.hoveredCell.r === r;
        const hasTower = state.towers.some(t => t.position.q === q && t.position.r === r);

        this.drawHex(cx, cy, HEX_SIZE * 0.95, isHovered && !hasTower ? COLORS.gridHover : COLORS.gridDefault);
      }
    }
  }

  private drawPath(state: GameState): void {
    for (const hex of state.path) {
      const pixel = hexToPixel(hex, HEX_SIZE);
      const cx = pixel.x + this.gridOffset.x;
      const cy = pixel.y + this.gridOffset.y;

      const isHovered = state.hoveredCell && state.hoveredCell.q === hex.q && state.hoveredCell.r === hex.r;
      const hasTower = state.towers.some(t => t.position.q === hex.q && t.position.r === hex.r);

      this.drawHex(cx, cy, HEX_SIZE * 0.95, isHovered && !hasTower ? '#fff0a0' : COLORS.path, COLORS.pathBorder, 2);
    }

    if (state.path.length > 1) {
      this.ctx.strokeStyle = 'rgba(240, 208, 96, 0.3)';
      this.ctx.lineWidth = 4;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
      this.ctx.beginPath();
      const firstPixel = hexToPixel(state.path[0], HEX_SIZE);
      this.ctx.moveTo(firstPixel.x + this.gridOffset.x, firstPixel.y + this.gridOffset.y);
      for (let i = 1; i < state.path.length; i++) {
        const pixel = hexToPixel(state.path[i], HEX_SIZE);
        this.ctx.lineTo(pixel.x + this.gridOffset.x, pixel.y + this.gridOffset.y);
      }
      this.ctx.stroke();
    }
  }

  private drawHex(cx: number, cy: number, size: number, fillColor: string, strokeColor?: string, lineWidth: number = 1): void {
    const corners = getHexCorners(cx, cy, size);
    this.ctx.beginPath();
    this.ctx.moveTo(corners[0].x, corners[0].y);
    for (let i = 1; i < 6; i++) {
      this.ctx.lineTo(corners[i].x, corners[i].y);
    }
    this.ctx.closePath();
    this.ctx.fillStyle = fillColor;
    this.ctx.fill();

    if (strokeColor) {
      this.ctx.strokeStyle = strokeColor;
      this.ctx.lineWidth = lineWidth;
      this.ctx.stroke();
    }
  }

  private drawTowers(state: GameState, deltaTime: number): void {
    for (const tower of state.towers) {
      this.drawTower(tower, deltaTime);
    }
  }

  private drawTower(tower: Tower, _deltaTime: number): void {
    const config = TOWER_CONFIGS[tower.type];
    const { x, y } = tower.pixelPosition;
    const cx = x + this.gridOffset.x;
    const cy = y + this.gridOffset.y;

    let scale = 1;
    if (tower.buildAnimation > 0) {
      const progress = 1 - tower.buildAnimation / 0.4;
      const eased = 1 - Math.pow(1 - progress, 3);
      scale = 0.5 + eased * 0.5;
    }

    let rotation = 0;
    let upgradeFlash = 0;
    if (tower.upgradeAnimation > 0) {
      const progress = 1 - tower.upgradeAnimation / 0.5;
      rotation = progress * Math.PI * 2;
      upgradeFlash = Math.sin(progress * Math.PI) * 0.6;
    }

    if (tower.rangeAnimation > 0) {
      const progress = 1 - tower.rangeAnimation / 0.3;
      const range = getTowerRange(tower.type, tower.level);
      const rangePixels = range * HEX_SIZE * Math.sqrt(3);
      const alpha = (1 - progress) * 0.5;
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, rangePixels * (0.5 + progress * 0.5), 0, Math.PI * 2);
      const alphaHex = Math.floor(alpha * 255).toString(16).padStart(2, '0');
      this.ctx.strokeStyle = config.color + alphaHex;
      this.ctx.lineWidth = 3;
      this.ctx.stroke();
    }

    this.ctx.save();
    this.ctx.translate(cx, cy);
    this.ctx.scale(scale, scale);
    this.ctx.rotate(rotation);

    const size = HEX_SIZE * 0.6;
    const darkFactor = 1 + (tower.level - 1) * 0.2;

    this.ctx.beginPath();
    this.ctx.arc(0, size * 0.3, size * 0.4, 0, Math.PI * 2);
    this.ctx.fillStyle = config.darkColor;
    this.ctx.fill();
    this.ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    this.drawCrystal(0, -size * 0.2, size * 0.5, config.color, darkFactor, tower.level);

    if (upgradeFlash > 0) {
      this.ctx.globalAlpha = upgradeFlash;
      this.ctx.shadowColor = '#ffffff';
      this.ctx.shadowBlur = 30;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, size * 0.8, 0, Math.PI * 2);
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
      this.ctx.globalAlpha = 1;
    }

    if (tower.level > 1) {
      this.ctx.fillStyle = '#ffd700';
      this.ctx.font = 'bold 12px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('★'.repeat(tower.level - 1), 0, size * 0.6);
    }

    this.ctx.restore();
  }

  private drawCrystal(x: number, y: number, size: number, color: string, darkFactor: number, level: number): void {
    const gradient = this.ctx.createRadialGradient(x, y - size * 0.2, 0, x, y, size);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.3, this.adjustBrightness(color, 1.5));
    gradient.addColorStop(0.7, this.adjustBrightness(color, 1 / darkFactor + 1));
    gradient.addColorStop(1, this.adjustBrightness(color, (1 / darkFactor + 1) * 0.6));

    this.ctx.beginPath();
    this.ctx.moveTo(x, y - size);
    this.ctx.lineTo(x + size * 0.6, y - size * 0.3);
    this.ctx.lineTo(x + size * 0.4, y + size * 0.5);
    this.ctx.lineTo(x - size * 0.4, y + size * 0.5);
    this.ctx.lineTo(x - size * 0.6, y - size * 0.3);
    this.ctx.closePath();
    this.ctx.fillStyle = gradient;
    this.ctx.fill();

    this.ctx.strokeStyle = this.adjustBrightness(color, 0.5);
    this.ctx.lineWidth = 1.5;
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.moveTo(x, y - size);
    this.ctx.lineTo(x - size * 0.1, y - size * 0.1);
    this.ctx.lineTo(x - size * 0.4, y + size * 0.5);
    this.ctx.closePath();
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.fill();

    if (level >= 3) {
      this.ctx.shadowColor = color;
      this.ctx.shadowBlur = 15;
      this.ctx.beginPath();
      this.ctx.arc(x, y, size * 0.15, 0, Math.PI * 2);
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    }
  }

  private adjustBrightness(color: string, factor: number): string {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    const nr = Math.min(255, Math.max(0, Math.floor(r * factor)));
    const ng = Math.min(255, Math.max(0, Math.floor(g * factor)));
    const nb = Math.min(255, Math.max(0, Math.floor(b * factor)));
    return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`;
  }

  private drawMonsters(state: GameState, _deltaTime: number): void {
    for (const monster of state.monsters) {
      this.drawMonster(monster);
    }
  }

  private drawMonster(monster: Monster): void {
    const { x, y } = monster.position;
    const cx = x + this.gridOffset.x;
    const cy = y + this.gridOffset.y;
    const size = monster.type === 'elite' ? HEX_SIZE * 0.45 : HEX_SIZE * 0.35;

    for (let i = monster.trail.length - 1; i >= 0; i--) {
      const t = monster.trail[i];
      const alpha = t.alpha * 0.25;
      this.ctx.beginPath();
      this.ctx.arc(t.x + this.gridOffset.x, t.y + this.gridOffset.y, size * (0.3 + i * 0.04), 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(180, 70, 70, ${alpha})`;
      this.ctx.fill();
    }

    if (monster.hitFlash > 0) {
      this.ctx.shadowColor = '#ffffff';
      this.ctx.shadowBlur = 25;
    }

    const bodyColor = monster.type === 'elite' ? '#8b30a0' : '#a04050';
    const bodyDark = monster.type === 'elite' ? '#5b2070' : '#702030';

    this.ctx.beginPath();
    this.ctx.arc(cx, cy, size, 0, Math.PI * 2);
    const bodyGrad = this.ctx.createRadialGradient(cx - size * 0.3, cy - size * 0.3, 0, cx, cy, size);
    bodyGrad.addColorStop(0, this.adjustBrightness(bodyColor, 1.3));
    bodyGrad.addColorStop(0.6, bodyColor);
    bodyGrad.addColorStop(1, bodyDark);
    this.ctx.fillStyle = bodyGrad;
    this.ctx.fill();
    this.ctx.strokeStyle = bodyDark;
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    this.ctx.shadowBlur = 0;

    const eyeSize = size * 0.2;
    const eyeY = cy - size * 0.15;
    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();
    this.ctx.arc(cx - size * 0.3, eyeY, eyeSize, 0, Math.PI * 2);
    this.ctx.arc(cx + size * 0.3, eyeY, eyeSize, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#000000';
    this.ctx.beginPath();
    this.ctx.arc(cx - size * 0.3, eyeY, eyeSize * 0.5, 0, Math.PI * 2);
    this.ctx.arc(cx + size * 0.3, eyeY, eyeSize * 0.5, 0, Math.PI * 2);
    this.ctx.fill();

    if (monster.type === 'elite') {
      this.ctx.fillStyle = '#ffd700';
      this.ctx.font = 'bold 10px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('◆', cx, cy - size - 5);
    }

    const hpRatio = monster.health / monster.maxHealth;
    const barWidth = size * 2;
    const barHeight = 5;
    const barX = cx - barWidth / 2;
    const barY = cy - size - 12;

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);

    this.ctx.fillStyle = '#333333';
    this.ctx.fillRect(barX, barY, barWidth, barHeight);

    const hpColor = hpRatio > 0.5 ? '#40ff60' : hpRatio > 0.25 ? '#ffc040' : '#ff4040';
    this.ctx.fillStyle = hpColor;
    this.ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight);

    if (monster.effects.frost.remaining > 0) {
      this.ctx.strokeStyle = 'rgba(96, 208, 255, 0.8)';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, size + 4, 0, Math.PI * 2);
      this.ctx.stroke();
    }
    if (monster.effects.fire.remaining > 0) {
      this.ctx.strokeStyle = 'rgba(255, 96, 64, 0.8)';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, size + 7, 0, Math.PI * 2);
      this.ctx.stroke();
    }
    if (monster.effects.lightning.remaining > 0) {
      this.ctx.fillStyle = 'rgba(192, 96, 255, 0.4)';
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, size + 2, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  private drawParticles(state: GameState): void {
    for (const particle of state.particles) {
      const alpha = particle.life / particle.maxLife;
      this.ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      
      if (particle.type === 'lightning' && particle.life > particle.maxLife * 0.5) {
        this.ctx.shadowColor = '#ffffff';
        this.ctx.shadowBlur = 15;
      }

      this.ctx.fillStyle = particle.color;
      this.ctx.beginPath();
      this.ctx.arc(
        particle.x + this.gridOffset.x,
        particle.y + this.gridOffset.y,
        particle.size * alpha,
        0,
        Math.PI * 2
      );
      this.ctx.fill();

      this.ctx.shadowBlur = 0;
    }
    this.ctx.globalAlpha = 1;
  }

  private drawAttackLines(deltaTime: number): void {
    for (let i = this.attackLines.length - 1; i >= 0; i--) {
      const line = this.attackLines[i];
      const alpha = line.life / 0.15;
      
      this.ctx.strokeStyle = line.color;
      this.ctx.globalAlpha = alpha;
      this.ctx.lineWidth = 3;
      this.ctx.lineCap = 'round';
      this.ctx.shadowColor = line.color;
      this.ctx.shadowBlur = 10;
      
      this.ctx.beginPath();
      this.ctx.moveTo(line.from.x + this.gridOffset.x, line.from.y + this.gridOffset.y);
      this.ctx.lineTo(line.to.x + this.gridOffset.x, line.to.y + this.gridOffset.y);
      this.ctx.stroke();

      this.ctx.shadowBlur = 0;
      this.ctx.globalAlpha = 1;

      line.life -= deltaTime;
      if (line.life <= 0) {
        this.attackLines.splice(i, 1);
      }
    }
  }

  private drawHoverPreview(state: GameState): void {
    if (!state.hoveredCell || !state.selectedTowerType) return;

    const hex = state.hoveredCell;
    if (hex.q < 0 || hex.q >= GRID_WIDTH || hex.r < 0 || hex.r >= GRID_HEIGHT) return;

    const hasTower = state.towers.some(t => t.position.q === hex.q && t.position.r === hex.r);
    if (hasTower) return;

    const pixel = hexToPixel(hex, HEX_SIZE);
    const cx = pixel.x + this.gridOffset.x;
    const cy = pixel.y + this.gridOffset.y;
    const config = TOWER_CONFIGS[state.selectedTowerType];
    const canAfford = state.energy >= config.cost;

    this.ctx.globalAlpha = 0.5;
    this.drawHex(cx, cy, HEX_SIZE * 0.95, canAfford ? config.color : COLORS.warning);
    
    const range = config.range;
    const rangePixels = range * HEX_SIZE * Math.sqrt(3);
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, rangePixels, 0, Math.PI * 2);
    this.ctx.fillStyle = canAfford ? `${config.color}22` : `${COLORS.warning}22`;
    this.ctx.fill();
    this.ctx.strokeStyle = canAfford ? config.color : COLORS.warning;
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 5]);
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    this.ctx.globalAlpha = 1;
  }

  private drawSelectedTowerRange(state: GameState): void {
    if (!state.selectedTower) return;

    const tower = state.selectedTower;
    const { x, y } = tower.pixelPosition;
    const cx = x + this.gridOffset.x;
    const cy = y + this.gridOffset.y;
    const range = getTowerRange(tower.type, tower.level);
    const rangePixels = range * HEX_SIZE * Math.sqrt(3);
    const config = TOWER_CONFIGS[tower.type];

    this.ctx.beginPath();
    this.ctx.arc(cx, cy, rangePixels, 0, Math.PI * 2);
    this.ctx.fillStyle = `${config.color}1a`;
    this.ctx.fill();
    this.ctx.strokeStyle = `${config.color}aa`;
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([8, 4]);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
  }
}
