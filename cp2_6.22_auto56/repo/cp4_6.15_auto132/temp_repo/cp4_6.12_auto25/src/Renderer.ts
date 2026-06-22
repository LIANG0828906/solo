import { Editor } from './Editor';
import { TileType, ToolType } from './types';

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private editor: Editor;
  private animationTime: number = 0;
  private animationFrameId: number | null = null;

  constructor(canvas: HTMLCanvasElement, editor: Editor) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Cannot get 2D context');
    this.ctx = ctx;
    this.editor = editor;

    this.canvas.width = editor.getGridWidth() * editor.getTileSize();
    this.canvas.height = editor.getGridHeight() * editor.getTileSize();

    this.editor.onUpdate(() => this.render());
  }

  startAnimation(): void {
    if (this.animationFrameId !== null) return;
    const animate = (time: number) => {
      this.animationTime = time;
      this.render();
      this.animationFrameId = requestAnimationFrame(animate);
    };
    this.animationFrameId = requestAnimationFrame(animate);
  }

  stopAnimation(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  render(): void {
    const ctx = this.ctx;

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawBackground();
    this.drawGrid();
    this.drawTiles();
    this.drawEntities();
    this.drawEnemyPaths();
    this.drawHoverHighlight();
    this.drawNotification();
  }

  private drawBackground(): void {
    const ctx = this.ctx;
    const gradient = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#1E1E2E');
    gradient.addColorStop(1, '#2A2A4A');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private drawGrid(): void {
    const ctx = this.ctx;
    const tileSize = this.editor.getTileSize();
    const gridWidth = this.editor.getGridWidth();
    const gridHeight = this.editor.getGridHeight();

    ctx.strokeStyle = 'rgba(58, 58, 74, 0.3)';
    ctx.lineWidth = 1;

    for (let x = 0; x <= gridWidth; x++) {
      ctx.beginPath();
      ctx.moveTo(x * tileSize, 0);
      ctx.lineTo(x * tileSize, gridHeight * tileSize);
      ctx.stroke();
    }

    for (let y = 0; y <= gridHeight; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * tileSize);
      ctx.lineTo(gridWidth * tileSize, y * tileSize);
      ctx.stroke();
    }
  }

  private drawTiles(): void {
    const tiles = this.editor.getTiles();
    const tileSize = this.editor.getTileSize();

    for (let y = 0; y < tiles.length; y++) {
      for (let x = 0; x < tiles[y].length; x++) {
        const tile = tiles[y][x];
        if (tile !== TileType.EMPTY) {
          this.drawTile(x, y, tile, tileSize);
        }
      }
    }
  }

  private drawTile(gridX: number, gridY: number, type: TileType, size: number): void {
    const ctx = this.ctx;
    const x = gridX * size;
    const y = gridY * size;

    let mainColor = '';
    let borderColor = '';
    let highlightColor = '';

    switch (type) {
      case TileType.GRASS:
        mainColor = '#4CAF50';
        borderColor = '#2E7D32';
        highlightColor = '#81C784';
        break;
      case TileType.DIRT:
        mainColor = '#8D6E63';
        borderColor = '#5D4037';
        highlightColor = '#A1887F';
        break;
      case TileType.STONE:
        mainColor = '#757575';
        borderColor = '#424242';
        highlightColor = '#9E9E9E';
        break;
    }

    ctx.fillStyle = mainColor;
    ctx.fillRect(x, y, size, size);

    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, size - 2, size - 2);

    if (type === TileType.GRASS) {
      ctx.fillStyle = highlightColor;
      ctx.fillRect(x + 2, y + 2, size - 4, 6);
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = highlightColor;
      ctx.fillRect(x + size - 6, y + 2, 4, size - 4);
      ctx.globalAlpha = 1;
    } else {
      ctx.strokeStyle = highlightColor;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.3;
      ctx.strokeRect(x + 3, y + 3, size - 6, size - 6);
      ctx.globalAlpha = 1;
    }
  }

  private drawEntities(): void {
    const tileSize = this.editor.getTileSize();
    const time = this.animationTime;

    const coins = this.editor.getCoins();
    coins.forEach(coin => {
      this.drawCoin(coin.gridX, coin.gridY, tileSize, time);
    });

    const healthPickups = this.editor.getHealthPickups();
    healthPickups.forEach(health => {
      this.drawHealth(health.gridX, health.gridY, tileSize, time);
    });

    const enemies = this.editor.getEnemies();
    enemies.forEach(enemy => {
      const isSelected = enemy.id === this.editor.getSelectedEnemyId();
      this.drawEnemy(enemy.gridX, enemy.gridY, tileSize, isSelected);
    });
  }

  private drawCoin(gridX: number, gridY: number, size: number, time: number): void {
    const ctx = this.ctx;
    const cx = gridX * size + size / 2;
    const cy = gridY * size + size / 2;
    const radius = size * 0.35;

    const pulse = 0.5 + 0.5 * Math.sin((time / 1000) * (Math.PI * 2) / 0.6);
    const alpha = 0.5 + pulse * 0.5;

    ctx.save();
    ctx.globalAlpha = alpha;

    const gradient = ctx.createRadialGradient(cx - 2, cy - 2, 0, cx, cy, radius);
    gradient.addColorStop(0, '#FFD700');
    gradient.addColorStop(0.7, '#FFA500');
    gradient.addColorStop(1, '#FF8C00');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#B8860B';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.arc(cx - radius * 0.3, cy - radius * 0.3, radius * 0.25, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private drawHealth(gridX: number, gridY: number, size: number, time: number): void {
    const ctx = this.ctx;
    const cx = gridX * size + size / 2;
    const cy = gridY * size + size / 2;
    const hSize = size * 0.4;

    const pulse = 0.5 + 0.5 * Math.sin((time / 1000) * (Math.PI * 2) / 0.6);
    const alpha = 0.5 + pulse * 0.5;

    ctx.save();
    ctx.globalAlpha = alpha;

    ctx.fillStyle = '#E53935';
    ctx.beginPath();
    ctx.moveTo(cx, cy + hSize * 0.5);
    ctx.bezierCurveTo(cx - hSize, cy, cx - hSize, cy - hSize, cx, cy - hSize * 0.3);
    ctx.bezierCurveTo(cx + hSize, cy - hSize, cx + hSize, cy, cx, cy + hSize * 0.5);
    ctx.fill();

    ctx.strokeStyle = '#B71C1C';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  }

  private drawEnemy(gridX: number, gridY: number, size: number, selected: boolean): void {
    const ctx = this.ctx;
    const cx = gridX * size + size / 2;
    const cy = gridY * size + size / 2;
    const radius = size * 0.4;

    if (selected) {
      ctx.strokeStyle = '#4CAF50';
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 3]);
      ctx.beginPath();
      ctx.arc(cx, cy, radius + 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.fillStyle = '#E91E63';
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#AD1457';
    ctx.beginPath();
    ctx.ellipse(cx, cy + radius * 0.2, radius, radius * 0.6, 0, 0, Math.PI);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(cx - radius * 0.3, cy - radius * 0.2, radius * 0.25, 0, Math.PI * 2);
    ctx.arc(cx + radius * 0.3, cy - radius * 0.2, radius * 0.25, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(cx - radius * 0.25, cy - radius * 0.15, radius * 0.12, 0, Math.PI * 2);
    ctx.arc(cx + radius * 0.35, cy - radius * 0.15, radius * 0.12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#F48FB1';
    ctx.fillRect(cx - radius * 0.5, cy - radius, radius * 0.3, radius * 0.3);
    ctx.fillRect(cx + radius * 0.2, cy - radius, radius * 0.3, radius * 0.3);

    ctx.fillStyle = '#FCE4EC';
    ctx.fillRect(cx - radius * 0.45, cy - radius * 0.9, radius * 0.2, radius * 0.15);
    ctx.fillRect(cx + radius * 0.25, cy - radius * 0.9, radius * 0.2, radius * 0.15);
  }

  private drawEnemyPaths(): void {
    const ctx = this.ctx;
    const tileSize = this.editor.getTileSize();
    const enemies = this.editor.getEnemies();

    enemies.forEach(enemy => {
      if (enemy.path.length < 2) return;

      const isSelected = enemy.id === this.editor.getSelectedEnemyId();

      ctx.strokeStyle = isSelected ? 'rgba(76, 175, 80, 0.7)' : 'rgba(150, 150, 150, 0.5)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();

      enemy.path.forEach((point, index) => {
        const px = point.x * tileSize + tileSize / 2;
        const py = point.y * tileSize + tileSize / 2;
        if (index === 0) {
          ctx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
        }
      });

      ctx.stroke();
      ctx.setLineDash([]);

      enemy.path.forEach((point, index) => {
        const px = point.x * tileSize + tileSize / 2;
        const py = point.y * tileSize + tileSize / 2;
        const radius = index === 0 ? 6 : 4;

        ctx.fillStyle = isSelected ? '#4CAF50' : '#888888';
        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = isSelected ? '#2E7D32' : '#555555';
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    });
  }

  private drawHoverHighlight(): void {
    const hovered = this.editor.getHoveredTile();
    if (!hovered) return;

    const tileSize = this.editor.getTileSize();
    const tool = this.editor.getCurrentTool();
    const x = hovered.x * tileSize;
    const y = hovered.y * tileSize;

    const ctx = this.ctx;
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.8;
    ctx.strokeRect(x + 1, y + 1, tileSize - 2, tileSize - 2);
    ctx.globalAlpha = 1;

    if (tool !== ToolType.SELECT && tool !== ToolType.ENEMY) {
      ctx.globalAlpha = 0.3;
      let color = '';
      switch (tool) {
        case ToolType.GRASS: color = '#4CAF50'; break;
        case ToolType.DIRT: color = '#8D6E63'; break;
        case ToolType.STONE: color = '#757575'; break;
        case ToolType.COIN: color = '#FFD700'; break;
        case ToolType.HEALTH: color = '#E53935'; break;
      }
      if (color) {
        ctx.fillStyle = color;
        ctx.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4);
      }
      ctx.globalAlpha = 1;
    }
  }

  private drawNotification(): void {
    const notification = this.editor.getNotification();
    if (!notification) return;

    const ctx = this.ctx;
    const padding = 12;
    const fontSize = 16;

    ctx.font = `${fontSize}px monospace`;
    const textWidth = ctx.measureText(notification).width;

    const boxWidth = textWidth + padding * 2;
    const boxHeight = fontSize + padding;
    const x = (this.canvas.width - boxWidth) / 2;
    const y = 20;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(x, y, boxWidth, boxHeight);

    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, boxWidth, boxHeight);

    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(notification, this.canvas.width / 2, y + boxHeight / 2);

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }
}
