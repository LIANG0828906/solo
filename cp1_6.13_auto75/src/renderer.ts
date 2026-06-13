import type { GameState, Tower, Monster, Particle, AttackLine } from './types';
import {
  HEX_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, TOWER_CONFIGS,
  hexToPixel, getHexCorners, getGridOffset, GRID_WIDTH, GRID_HEIGHT, isOnPath
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

    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.01)';
    for (let i = 0; i < 50; i++) {
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

  private drawTower(tower: Tower, deltaTime: number): void {
    const config = TOWER_CONFIGS[tower.type];
    const { x, y } = tower.pixelPosition;
    const cx = x + this.gridOffset.x;
    const cy = y + this.gridOffset.y;

    let scale = 1;
    if (tower.buildAnimation > 0) {
      const progress = 1 - tower.buildAnimation / 0.4;
      scale = 0.5 + progress * 0.5;
    }

    let rotation = 0;
    if (tower.upgradeAnimation > 0) {
      const progress = 1 - tower.upgradeAnimation / 0.5;
      rotation = progress * Math.PI * 2;
    }

    if (tower.rangeAnimation > 0) {
      const progress = 1 - tower.rangeAnimation / 0.3;
      const range = config.range * (1 + (tower.level - 1) * 0.2);
      const rangePixels = range * HEX_SIZE * Math.sqrt(3);
      const alpha = (1 - progress) * 0.5;
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, rangePixels * (0.5 + progress * 0.5), 0, Math.PI * 2);
      this.ctx.strokeStyle = config.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
      this.ctx.lineWidth = 3;
      this.ctx.stroke();
    }

    this.ctx.save();
    this.ctx.translate(cx, cy);
    this.ctx.scale(scale, scale);
    this.ctx.rotate(rotation);

    const size = HEX_SIZE * 0.6;
    const darkFactor = 1 + (tower.level - 1) * 0.15;

    this.ctx.beginPath();
    this.ctx.arc(0, size * 0.3, size * 0.4, 0, Math.PI * 2);
    this.ctx.fillStyle = config.darkColor;
    this.ctx.fill();

    this.drawCrystal(0, -size * 0.2, size * 0.5, config.color, darkFactor, tower.level);

    if (tower.level > 1) {
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = 'bold 10px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('★'.repeat(tower.level - 1), 0, size * 0.55);
    }

    this.ctx.restore();
  }

  private drawCrystal(x: number, y: number, size: number, color: string, darkFactor: number, level: number): void {
    const gradient = this.ctx.createRadialGradient(x, y - size * 0.2, 0, x, y, size);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.3, this.adjustBrightness(color, 1.5));
    gradient.addColorStop(0.7, this.adjustBrightness(color, darkFactor));
    gradient.addColorStop(1, this.adjustBrightness(color, darkFactor * 0.7));

    this.ctx.beginPath();
    this.ctx.moveTo(x, y - size);
    this.ctx.lineTo(x + size * 0.6, y - size * 0.3);
    this.ctx.lineTo(x + size * 0.4, y + size * 0.5);
    this.ctx.lineTo(x - size * 0.4, y + size * 0.5);
    this.ctx.lineTo(x - size * 0.6, y - size * 0.3);
    this.ctx.closePath();
    this.ctx.fillStyle = gradient;
    this.ctx.fill();

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
      this.ctx.arc(x, y, size * 0.2, 0, Math.PI * 2);
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    }
  }

  private adjustBrightness(color: string, factor: number): string {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `#${Math.min(255, Math.floor(r * factor)).toString(16).padStart(2, '0')}${Math.min(255, Math.floor(g * factor)).toString(16).padStart(2, '0')}${Math.min(255, Math.floor(b * factor)).toString(16).padStart(2, '0')}`;
  }

  private drawMonsters(state: GameState, deltaTime: number): void {
    for (const monster of state.monsters) {
      this.drawMonster(monster, deltaTime);
    }
  }

  private drawMonster(monster: Monster, deltaTime: number): void {
    const { x, y } = monster.position;
    const cx = x + this.gridOffset.x;
    const cy = y + this.gridOffset.y;
    const size = monster.type === 'elite' ? HEX_SIZE * 0.45 : HEX_SIZE * 0.35;

    for (let i = monster.trail.length - 1; i >= 0; i--) {
      const t = monster.trail[i];
      const alpha = t.alpha * 0.3;
      this.ctx.beginPath();
      this.ctx.arc(t.x + this.gridOffset.x, t.y + this.gridOffset.y, size * (0.3 + i * 0.05), 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(200, 80, 80, ${alpha})`;
      this.ctx.fill();
    }

    if (monster.hitFlash > 0) {
      this.ctx.shadowColor = '#ffffff';
      this.ctx.shadowBlur = 20;
    }

    const bodyColor = monster.type === '