import { Tower, TowerType, TOWER_CONFIGS } from './tower';
import { PathPoint } from './enemy';

export interface UIState {
  score: number;
  lives: number;
  wave: number;
  gold: number;
  selectedTowerType: TowerType | null;
  gameOver: boolean;
  audioData: Uint8Array;
  time: number;
  canvasWidth: number;
  canvasHeight: number;
}

export interface TowerPanelSlot {
  type: TowerType;
  x: number;
  y: number;
  width: number;
  height: number;
}

export class UIRenderer {
  private towerSlots: TowerPanelSlot[] = [];
  private hoveredTower: Tower | null = null;
  private mouseX: number = 0;
  private mouseY: number = 0;

  constructor() {}

  setMousePosition(x: number, y: number): void {
    this.mouseX = x;
    this.mouseY = y;
  }

  setHoveredTower(tower: Tower | null): void {
    this.hoveredTower = tower;
  }

  getTowerSlots(): TowerPanelSlot[] {
    return this.towerSlots;
  }

  updateTowerSlots(canvasWidth: number, canvasHeight: number): void {
    const panelX = 20;
    const panelY = 80;
    const slotSize = 64;
    const gap = 16;
    const types: TowerType[] = ['arrow', 'cannon', 'magic'];

    this.towerSlots = types.map((type, i) => ({
      type,
      x: panelX + 16,
      y: panelY + 20 + i * (slotSize + gap),
      width: slotSize,
      height: slotSize
    }));
  }

  isPointInSlot(x: number, y: number): TowerType | null {
    for (const slot of this.towerSlots) {
      if (x >= slot.x && x <= slot.x + slot.width &&
          y >= slot.y && y <= slot.y + slot.height) {
        return slot.type;
      }
    }
    return null;
  }

  draw(ctx: CanvasRenderingContext2D, state: UIState, towers: Tower[], path: PathPoint[]): void {
    this.updateTowerSlots(state.canvasWidth, state.canvasHeight);
    this.drawPath(ctx, path, state.time);
    this.drawStatusBar(ctx, state);
    this.drawTowerPanel(ctx, state);
    this.drawWaveform(ctx, state);
    this.drawHoverRange(ctx, state, towers);
    this.drawPlacementPreview(ctx, state);
    if (state.gameOver) this.drawGameOver(ctx, state);
  }

  private drawPath(ctx: CanvasRenderingContext2D, path: PathPoint[], time: number): void {
    if (path.length < 2) return;

    ctx.save();
    ctx.strokeStyle = 'rgba(100, 200, 255, 0.4)';
    ctx.lineWidth = 40;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(100, 200, 255, 0.3)';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) {
      ctx.lineTo(path[i].x, path[i].y);
    }
    ctx.stroke();
    ctx.restore();

    ctx.save();
    const dashOffset = (time * 0.05) % 24;
    ctx.strokeStyle = 'rgba(150, 220, 255, 0.8)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.setLineDash([12, 12]);
    ctx.lineDashOffset = -dashOffset;
    ctx.shadowColor = 'rgba(150, 220, 255, 0.8)';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) {
      ctx.lineTo(path[i].x, path[i].y);
    }
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.fillStyle = '#66bb6a';
    ctx.shadowColor = 'rgba(102, 187, 106, 0.8)';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(path[0].x, path[0].y, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.fillStyle = '#ef5350';
    ctx.shadowColor = 'rgba(239, 83, 80, 0.8)';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(path[path.length - 1].x, path[path.length - 1].y, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawStatusBar(ctx: CanvasRenderingContext2D, state: UIState): void {
    const barHeight = 60;
    ctx.save();
    ctx.fillStyle = 'rgba(26, 26, 46, 0.3)';
    ctx.fillRect(0, 0, state.canvasWidth, barHeight);
    ctx.strokeStyle = 'rgba(123, 47, 247, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, barHeight);
    ctx.lineTo(state.canvasWidth, barHeight);
    ctx.stroke();
    ctx.restore();

    const rightX = state.canvasWidth - 30;
    ctx.save();
    ctx.font = 'bold 22px Orbitron, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = '#ffd54f';
    ctx.shadowColor = 'rgba(255, 213, 79, 0.6)';
    ctx.shadowBlur = 10;
    ctx.fillText(`SCORE ${state.score}`, rightX, 20);

    ctx.fillStyle = '#7b2ff7';
    ctx.shadowColor = 'rgba(123, 47, 247, 0.6)';
    ctx.shadowBlur = 10;
    ctx.fillText(`WAVE ${state.wave}`, rightX - 180, 20);

    const lifeColor = state.lives > 10 ? '#66bb6a' : state.lives > 5 ? '#ffa726' : '#ef5350';
    ctx.fillStyle = lifeColor;
    ctx.shadowColor = lifeColor;
    ctx.shadowBlur = 10;
    ctx.fillText(`LIVES ${state.lives}`, rightX - 340, 20);

    ctx.fillStyle = '#ffd700';
    ctx.shadowColor = 'rgba(255, 215, 0, 0.6)';
    ctx.shadowBlur = 10;
    ctx.fillText(`GOLD ${state.gold}`, rightX - 480, 20);

    ctx.restore();
  }

  private drawTowerPanel(ctx: CanvasRenderingContext2D, state: UIState): void {
    const panelX = 20;
    const panelY = 80;
    const panelWidth = 96;
    const types: TowerType[] = ['arrow', 'cannon', 'magic'];
    const slotSize = 64;
    const gap = 16;
    const panelHeight = 20 + types.length * (slotSize + gap) + 20;

    ctx.save();
    ctx.fillStyle = 'rgba(26, 26, 46, 0.3)';
    ctx.strokeStyle = 'rgba(123, 47, 247, 0.3)';
    ctx.lineWidth = 1;
    this.roundRect(ctx, panelX, panelY, panelWidth, panelHeight, 8);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    for (let i = 0; i < types.length; i++) {
      const type = types[i];
      const config = TOWER_CONFIGS[type];
      const slot = this.towerSlots[i];
      const isSelected = state.selectedTowerType === type;
      const canAfford = state.gold >= config.cost;

      const pulse = isSelected ? 1 + 0.15 * Math.sin(state.time * 0.0125) : 1;
      const cx = slot.x + slot.width / 2;
      const cy = slot.y + slot.height / 2;
      const radius = (slot.width / 2 - 4) * pulse;

      ctx.save();
      ctx.shadowColor = isSelected ? config.glowColor : 'transparent';
      ctx.shadowBlur = isSelected ? 20 : 0;
      ctx.fillStyle = canAfford ? '#1a1a2e' : 'rgba(26, 26, 46, 0.5)';
      ctx.strokeStyle = canAfford ? config.color : 'rgba(100, 100, 100, 0.5)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.shadowBlur = 0;
      ctx.fillStyle = canAfford ? config.color : 'rgba(100, 100, 100, 0.5)';
      if (type === 'arrow') {
        ctx.beginPath();
        ctx.moveTo(cx, cy - 14);
        ctx.lineTo(cx + 10, cy + 10);
        ctx.lineTo(cx - 10, cy + 10);
        ctx.closePath();
        ctx.fill();
      } else if (type === 'cannon') {
        ctx.fillRect(cx - 14, cy - 7, 28, 14);
        ctx.beginPath();
        ctx.arc(cx + 12, cy, 6, 0, Math.PI * 2);
        ctx.fill();
      } else if (type === 'magic') {
        ctx.beginPath();
        for (let j = 0; j < 6; j++) {
          const angle = (Math.PI / 3) * j - Math.PI / 6;
          const px = cx + 12 * Math.cos(angle);
          const py = cy + 12 * Math.sin(angle);
          if (j === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      ctx.save();
      ctx.font = 'bold 12px Rajdhani, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = canAfford ? '#ffd700' : 'rgba(150, 150, 150, 0.7)';
      ctx.fillText(`${config.cost}`, cx, slot.y + slot.height + 12);
      ctx.restore();
    }
  }

  private drawWaveform(ctx: CanvasRenderingContext2D, state: UIState): void {
    const barX = 300;
    const barY = 15;
    const barWidth = 200;
    const barHeight = 30;
    const barCount = 32;
    const barSpacing = barWidth / barCount;

    ctx.save();
    ctx.strokeStyle = 'rgba(123, 47, 247, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    for (let i = 0; i < barCount; i++) {
      const dataIndex = Math.floor((i / barCount) * state.audioData.length);
      const value = state.audioData[dataIndex] / 255;
      const h = value * barHeight * 0.9;
      const x = barX + i * barSpacing + 1;
      const y = barY + barHeight - h;
      const w = barSpacing - 2;

      const gradient = ctx.createLinearGradient(x, y, x, barY + barHeight);
      gradient.addColorStop(0, '#7b2ff7');
      gradient.addColorStop(1, '#4fc3f7');
      ctx.fillStyle = gradient;
      ctx.shadowColor = 'rgba(123, 47, 247, 0.6)';
      ctx.shadowBlur = 5;
      ctx.fillRect(x, y, Math.max(w, 1), h);
    }
    ctx.restore();
  }

  private drawHoverRange(ctx: CanvasRenderingContext2D, state: UIState, towers: Tower[]): void {
    if (this.hoveredTower) {
      this.hoveredTower.drawRange(ctx, state.time);
    }
  }

  private drawPlacementPreview(ctx: CanvasRenderingContext2D, state: UIState): void {
    if (!state.selectedTowerType) return;

    const config = TOWER_CONFIGS[state.selectedTowerType];
    const canPlace = state.gold >= config.cost;

    ctx.save();
    const alpha = 0.2 + 0.1 * Math.sin(state.time * 0.005);
    ctx.strokeStyle = canPlace ? `rgba(255, 255, 255, ${alpha})` : `rgba(239, 83, 80, ${alpha})`;
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.arc(this.mouseX, this.mouseY, config.range, 0, Math.PI * 2);
    ctx.stroke();

    ctx.globalAlpha = 0.6;
    ctx.fillStyle = '#1a1a2e';
    ctx.strokeStyle = canPlace ? config.color : '#ef5350';
    ctx.lineWidth = 3;
    ctx.setLineDash([]);
    ctx.shadowColor = canPlace ? config.glowColor : 'rgba(239, 83, 80, 0.5)';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(this.mouseX, this.mouseY, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  private drawGameOver(ctx: CanvasRenderingContext2D, state: UIState): void {
    ctx.save();
    ctx.fillStyle = 'rgba(26, 26, 46, 0.85)';
    ctx.fillRect(0, 0, state.canvasWidth, state.canvasHeight);

    ctx.font = 'bold 72px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ef5350';
    ctx.shadowColor = 'rgba(239, 83, 80, 0.8)';
    ctx.shadowBlur = 30;
    ctx.fillText('GAME OVER', state.canvasWidth / 2, state.canvasHeight / 2 - 60);

    ctx.font = 'bold 32px Orbitron, sans-serif';
    ctx.fillStyle = '#ffd54f';
    ctx.shadowColor = 'rgba(255, 213, 79, 0.6)';
    ctx.shadowBlur = 15;
    ctx.fillText(`FINAL SCORE: ${state.score}`, state.canvasWidth / 2, state.canvasHeight / 2 + 10);

    ctx.font = 'bold 24px Rajdhani, sans-serif';
    ctx.fillStyle = '#a0a0c0';
    ctx.shadowBlur = 0;
    ctx.fillText(`Reached Wave ${state.wave}`, state.canvasWidth / 2, state.canvasHeight / 2 + 60);
    ctx.restore();
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
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
