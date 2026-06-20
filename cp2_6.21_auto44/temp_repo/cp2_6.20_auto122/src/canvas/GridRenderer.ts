import type { GridCell, GameObject, PlayerState, TerrainTheme } from '../store/gameStore';
import { CELL_SIZE, GRID_COLS, GRID_ROWS } from '../store/gameStore';

const THEME_COLORS: Record<TerrainTheme, { primary: string; secondary: string }> = {
  grass: { primary: '#4ade80', secondary: '#22c55e' },
  stone: { primary: '#9ca3af', secondary: '#6b7280' },
  dirt: { primary: '#92400e', secondary: '#78350f' },
};

export class GridRenderer {
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');
    this.ctx = ctx;
    this.width = GRID_COLS * CELL_SIZE;
    this.height = GRID_ROWS * CELL_SIZE;
    canvas.width = this.width;
    canvas.height = this.height;
  }

  private drawTerrain(grid: GridCell[][]): void {
    for (let y = 0; y < GRID_ROWS; y++) {
      for (let x = 0; x < GRID_COLS; x++) {
        const cell = grid[y]?.[x];
        if (!cell) continue;

        const px = x * CELL_SIZE;
        const py = y * CELL_SIZE;

        if (cell.filled) {
          const colors = THEME_COLORS[cell.theme];

          this.ctx.fillStyle = colors.primary;
          this.ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);

          this.ctx.fillStyle = colors.secondary;
          this.ctx.fillRect(px, py + CELL_SIZE - 8, CELL_SIZE, 8);

          if (cell.theme === 'grass') {
            this.ctx.fillStyle = '#86efac';
            for (let i = 0; i < 3; i++) {
              const gx = px + 8 + i * 14;
              this.ctx.fillRect(gx, py + 2, 2, 6);
              this.ctx.fillRect(gx + 4, py + 4, 2, 4);
            }
          } else if (cell.theme === 'stone') {
            this.ctx.fillStyle = '#d1d5db';
            this.ctx.fillRect(px + 4, py + 4, 8, 8);
            this.ctx.fillRect(px + 20, py + 12, 10, 10);
            this.ctx.fillRect(px + 8, py + 24, 12, 8);
          } else if (cell.theme === 'dirt') {
            this.ctx.fillStyle = '#a16207';
            this.ctx.fillRect(px + 6, py + 8, 6, 6);
            this.ctx.fillRect(px + 24, py + 16, 8, 8);
            this.ctx.fillRect(px + 12, py + 30, 10, 6);
          }
        }
      }
    }
  }

  private drawGridLines(): void {
    this.ctx.strokeStyle = '#333333';
    this.ctx.lineWidth = 1;

    for (let x = 0; x <= GRID_COLS; x++) {
      this.ctx.beginPath();
      this.ctx.moveTo(x * CELL_SIZE + 0.5, 0);
      this.ctx.lineTo(x * CELL_SIZE + 0.5, this.height);
      this.ctx.stroke();
    }

    for (let y = 0; y <= GRID_ROWS; y++) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y * CELL_SIZE + 0.5);
      this.ctx.lineTo(this.width, y * CELL_SIZE + 0.5);
      this.ctx.stroke();
    }
  }

  private drawSpawn(obj: GameObject, selected: boolean): void {
    const px = obj.gridX * CELL_SIZE;
    const py = obj.gridY * CELL_SIZE;
    const cx = px + CELL_SIZE / 2;
    const cy = py + CELL_SIZE / 2;

    this.ctx.fillStyle = selected ? '#60a5fa' : '#3b82f6';
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, 14, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, 8, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#3b82f6';
    this.ctx.font = 'bold 10px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('P', cx, cy);

    if (selected) {
      this.ctx.strokeStyle = '#93c5fd';
      this.ctx.lineWidth = 2;
      this.ctx.setLineDash([4, 4]);
      this.ctx.strokeRect(px + 2, py + 2, CELL_SIZE - 4, CELL_SIZE - 4);
      this.ctx.setLineDash([]);
    }
  }

  private drawSpike(obj: GameObject, selected: boolean): void {
    const px = obj.gridX * CELL_SIZE;
    const py = obj.gridY * CELL_SIZE;

    this.ctx.fillStyle = selected ? '#f87171' : '#ef4444';
    this.ctx.beginPath();
    this.ctx.moveTo(px + CELL_SIZE / 2, py + 6);
    this.ctx.lineTo(px + CELL_SIZE - 6, py + CELL_SIZE - 6);
    this.ctx.lineTo(px + 6, py + CELL_SIZE - 6);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.fillStyle = '#fca5a5';
    this.ctx.beginPath();
    this.ctx.moveTo(px + CELL_SIZE / 2, py + 10);
    this.ctx.lineTo(px + CELL_SIZE / 2 + 6, py + 24);
    this.ctx.lineTo(px + CELL_SIZE / 2 - 2, py + 24);
    this.ctx.closePath();
    this.ctx.fill();

    if (selected) {
      this.ctx.strokeStyle = '#fca5a5';
      this.ctx.lineWidth = 2;
      this.ctx.setLineDash([4, 4]);
      this.ctx.strokeRect(px + 2, py + 2, CELL_SIZE - 4, CELL_SIZE - 4);
      this.ctx.setLineDash([]);
    }
  }

  private drawMovingPlatform(obj: GameObject, selected: boolean): void {
    const px = obj.gridX * CELL_SIZE;
    const py = obj.gridY * CELL_SIZE;

    this.ctx.fillStyle = selected ? '#fdba74' : '#f97316';
    this.ctx.fillRect(px + 4, py + 16, CELL_SIZE - 8, 16);

    this.ctx.fillStyle = '#fed7aa';
    this.ctx.fillRect(px + 4, py + 16, CELL_SIZE - 8, 4);

    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();
    this.ctx.moveTo(px + 8, py + 24);
    this.ctx.lineTo(px + 14, py + 20);
    this.ctx.lineTo(px + 14, py + 28);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.moveTo(px + CELL_SIZE - 8, py + 24);
    this.ctx.lineTo(px + CELL_SIZE - 14, py + 20);
    this.ctx.lineTo(px + CELL_SIZE - 14, py + 28);
    this.ctx.closePath();
    this.ctx.fill();

    if (selected) {
      this.ctx.strokeStyle = '#fdba74';
      this.ctx.lineWidth = 2;
      this.ctx.setLineDash([4, 4]);
      this.ctx.strokeRect(px + 2, py + 2, CELL_SIZE - 4, CELL_SIZE - 4);
      this.ctx.setLineDash([]);
    }
  }

  private drawCoin(obj: GameObject, selected: boolean, time: number): void {
    const px = obj.gridX * CELL_SIZE;
    const py = obj.gridY * CELL_SIZE;
    const cx = px + CELL_SIZE / 2;
    const cy = py + CELL_SIZE / 2 + Math.sin(time * 0.003) * 2;

    this.ctx.fillStyle = selected ? '#fcd34d' : '#fbbf24';
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, 12, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#fef08a';
    this.ctx.beginPath();
    this.ctx.arc(cx - 2, cy - 2, 5, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#d97706';
    this.ctx.font = 'bold 12px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('$', cx, cy + 1);

    if (selected) {
      this.ctx.strokeStyle = '#fde047';
      this.ctx.lineWidth = 2;
      this.ctx.setLineDash([4, 4]);
      this.ctx.strokeRect(px + 2, py + 2, CELL_SIZE - 4, CELL_SIZE - 4);
      this.ctx.setLineDash([]);
    }
  }

  private drawObjects(objects: GameObject[], selectedId: string | null, time: number): void {
    for (const obj of objects) {
      const selected = obj.id === selectedId;
      switch (obj.type) {
        case 'spawn':
          this.drawSpawn(obj, selected);
          break;
        case 'spike':
          this.drawSpike(obj, selected);
          break;
        case 'movingPlatform':
          this.drawMovingPlatform(obj, selected);
          break;
        case 'coin':
          this.drawCoin(obj, selected, time);
          break;
      }
    }
  }

  private drawPlayer(player: PlayerState): void {
    this.ctx.fillStyle = '#3b82f6';
    this.ctx.fillRect(player.x, player.y, player.width, player.height);

    this.ctx.fillStyle = '#60a5fa';
    this.ctx.fillRect(player.x + 2, player.y + 2, player.width - 6, 4);

    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(player.x + 3, player.y + 5, 3, 3);
    this.ctx.fillRect(player.x + 10, player.y + 5, 3, 3);

    this.ctx.fillStyle = '#1e3a5f';
    this.ctx.fillRect(player.x + 4, player.y + 6, 1, 1);
    this.ctx.fillRect(player.x + 11, player.y + 6, 1, 1);
  }

  private drawHoveredCell(hovered: { x: number; y: number } | null, isPlaying: boolean): void {
    if (!hovered || isPlaying) return;

    const px = hovered.x * CELL_SIZE;
    const py = hovered.y * CELL_SIZE;

    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    this.ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);

    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(px + 1, py + 1, CELL_SIZE - 2, CELL_SIZE - 2);
  }

  public drawFrame(
    grid: GridCell[][],
    objects: GameObject[],
    selectedObjectId: string | null,
    hoveredCell: { x: number; y: number } | null,
    isPlaying: boolean,
    player: PlayerState,
    time: number
  ): void {
    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.drawTerrain(grid);
    this.drawObjects(objects, selectedObjectId, time);
    this.drawGridLines();
    this.drawHoveredCell(hoveredCell, isPlaying);

    if (isPlaying) {
      this.drawPlayer(player);
    }
  }

  public resize(): void {
    const canvas = this.ctx.canvas;
    canvas.width = this.width;
    canvas.height = this.height;
  }
}
