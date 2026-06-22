import { TileType, Direction, CameraState, CollapseEvent } from './types';
import { CONFIG, COLORS, TILE_COLORS, MAP_WIDTH, RENDER_BUFFER } from './constants';
import { CaveMap } from './map';
import { Player } from './player';
import { ParticleSystem } from './particles';
import { intToRgb } from './utils';

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private backBuffer: HTMLCanvasElement;
  private backCtx: CanvasRenderingContext2D;
  private scale: number = 2;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.ctx.imageSmoothingEnabled = false;

    this.backBuffer = document.createElement('canvas');
    this.backCtx = this.backBuffer.getContext('2d')!;
    this.backCtx.imageSmoothingEnabled = false;

    this.resize();
  }

  public resize(): void {
    const baseWidth = 400;
    const baseHeight = 300;
    
    this.scale = 2;
    
    const canvasWidth = baseWidth * this.scale;
    const canvasHeight = baseHeight * this.scale;

    this.canvas.width = canvasWidth;
    this.canvas.height = canvasHeight;
    this.backBuffer.width = baseWidth;
    this.backBuffer.height = baseHeight;

    this.ctx.imageSmoothingEnabled = false;
    this.backCtx.imageSmoothingEnabled = false;
  }

  public getCanvasWidth(): number {
    return this.backBuffer.width;
  }

  public getCanvasHeight(): number {
    return this.backBuffer.height;
  }

  public clear(): void {
    this.backCtx.fillStyle = COLORS.BACKGROUND;
    this.backCtx.fillRect(0, 0, this.backBuffer.width, this.backBuffer.height);
  }

  public renderMap(
    map: CaveMap,
    camera: CameraState,
    collapse: CollapseEvent | null
  ): void {
    const { startY, endY } = map.getVisibleTiles(camera.y, this.getCanvasHeight() * this.scale);
    
    const startTileX = Math.max(0, Math.floor(camera.x / CONFIG.TILE_SIZE) - RENDER_BUFFER);
    const endTileX = Math.min(MAP_WIDTH, Math.ceil((camera.x + this.getCanvasWidth() * this.scale) / CONFIG.TILE_SIZE) + RENDER_BUFFER);

    for (let y = startY; y < endY; y++) {
      for (let x = startTileX; x < endTileX; x++) {
        const tile = map.getTile(x * CONFIG.TILE_SIZE, y * CONFIG.TILE_SIZE);
        if (tile && tile.type !== TileType.EMPTY) {
          this.renderTile(tile, camera);
        }
      }
    }

    this.renderEdgeGlow(camera);

    if (collapse) {
      this.renderCollapseWarning(collapse, camera);
    }
  }

  private renderTile(tile: any, camera: CameraState): void {
    const screenX = tile.x * CONFIG.TILE_SIZE - camera.x;
    const screenY = tile.y * CONFIG.TILE_SIZE - camera.y;

    if (screenX + CONFIG.TILE_SIZE < 0 || screenX > this.getCanvasWidth() * this.scale) return;
    if (screenY + CONFIG.TILE_SIZE < 0 || screenY > this.getCanvasHeight() * this.scale) return;

    if (tile.texture && tile.texture.length > 0) {
      for (let py = 0; py < CONFIG.TILE_SIZE; py++) {
        for (let px = 0; px < CONFIG.TILE_SIZE; px++) {
          const color = tile.texture[py]?.[px];
          if (color !== undefined) {
            this.backCtx.fillStyle = intToRgb(color);
            this.backCtx.fillRect(
              Math.floor((screenX + px) / this.scale),
              Math.floor((screenY + py) / this.scale),
              1,
              1
            );
          }
        }
      }
    } else {
      this.backCtx.fillStyle = TILE_COLORS[tile.type];
      this.backCtx.fillRect(
        Math.floor(screenX / this.scale),
        Math.floor(screenY / this.scale),
        Math.floor(CONFIG.TILE_SIZE / this.scale),
        Math.floor(CONFIG.TILE_SIZE / this.scale)
      );
    }

    if (tile.type !== TileType.WALL) {
      this.backCtx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      const px = Math.floor(screenX / this.scale);
      const py = Math.floor(screenY / this.scale);
      const size = Math.floor(CONFIG.TILE_SIZE / this.scale);
      this.backCtx.fillRect(px + 2, py + 2, 2, 2);
      this.backCtx.fillRect(px + size - 4, py + size - 4, 2, 2);
    }
  }

  private renderEdgeGlow(camera: CameraState): void {
    const gradient = this.backCtx.createLinearGradient(0, 0, 20, 0);
    gradient.addColorStop(0, COLORS.EDGE_GLOW);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    this.backCtx.fillStyle = gradient;
    this.backCtx.fillRect(0, 0, 20, this.getCanvasHeight());

    const mapWidthPixels = MAP_WIDTH * CONFIG.TILE_SIZE;
    const rightEdge = (mapWidthPixels - camera.x) / this.scale;
    const gradient2 = this.backCtx.createLinearGradient(rightEdge - 20, 0, rightEdge, 0);
    gradient2.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient2.addColorStop(1, COLORS.EDGE_GLOW);
    
    this.backCtx.fillStyle = gradient2;
    this.backCtx.fillRect(rightEdge - 20, 0, 20, this.getCanvasHeight());
  }

  private renderCollapseWarning(collapse: CollapseEvent, camera: CameraState): void {
    const halfSize = Math.floor(collapse.size / 2);
    const x = (collapse.x - halfSize) * CONFIG.TILE_SIZE - camera.x;
    const y = (collapse.y - halfSize) * CONFIG.TILE_SIZE - camera.y;
    const width = collapse.size * CONFIG.TILE_SIZE;
    const height = collapse.size * CONFIG.TILE_SIZE;

    const flashIntensity = Math.sin(Date.now() / 100) * 0.3 + 0.3;
    
    this.backCtx.fillStyle = `rgba(255, 100, 100, ${flashIntensity})`;
    this.backCtx.fillRect(
      Math.floor(x / this.scale),
      Math.floor(y / this.scale),
      Math.floor(width / this.scale),
      Math.floor(height / this.scale)
    );

    this.backCtx.strokeStyle = '#FF0000';
    this.backCtx.lineWidth = 1;
    this.backCtx.strokeRect(
      Math.floor(x / this.scale),
      Math.floor(y / this.scale),
      Math.floor(width / this.scale),
      Math.floor(height / this.scale)
    );
  }

  public renderPlayer(player: Player, camera: CameraState): void {
    const screenX = player.getX() - camera.x;
    const screenY = player.getY() - camera.y;

    this.drawPixelCharacter(
      screenX / this.scale,
      screenY / this.scale,
      player.getDirection(),
      player.getFrame(),
      player.isHeartFlashing() ? player.getHeartFlashState() : true
    );
  }

  private drawPixelCharacter(
    x: number,
    y: number,
    direction: Direction,
    frame: number,
    visible: boolean
  ): void {
    if (!visible) return;

    const px = Math.floor(x);
    const py = Math.floor(y);

    this.backCtx.fillStyle = '#4A3728';
    this.backCtx.fillRect(px + 4, py + 8, 8, 8);

    this.backCtx.fillStyle = '#D4A574';
    this.backCtx.fillRect(px + 5, py + 2, 6, 6);

    this.backCtx.fillStyle = '#FFD700';
    this.backCtx.fillRect(px + 4, py, 8, 3);
    this.backCtx.fillRect(px + 3, py + 2, 10, 2);

    this.backCtx.fillStyle = '#000000';
    if (direction === Direction.LEFT) {
      this.backCtx.fillRect(px + 5, py + 4, 1, 1);
    } else if (direction === Direction.RIGHT) {
      this.backCtx.fillRect(px + 10, py + 4, 1, 1);
    } else {
      this.backCtx.fillRect(px + 6, py + 4, 1, 1);
      this.backCtx.fillRect(px + 9, py + 4, 1, 1);
    }

    this.backCtx.fillStyle = '#2C1810';
    const legOffset = frame % 2 === 0 ? 0 : 1;
    
    if (direction === Direction.UP || direction === Direction.DOWN) {
      this.backCtx.fillRect(px + 4 + legOffset, py + 14, 3, 2);
      this.backCtx.fillRect(px + 9 - legOffset, py + 14, 3, 2);
    } else {
      this.backCtx.fillRect(px + 4, py + 14, 3, 2);
      this.backCtx.fillRect(px + 9, py + 14, 3, 2);
    }

    this.backCtx.fillStyle = '#654321';
    if (direction === Direction.DOWN) {
      this.backCtx.fillRect(px + 6, py + 16, 4, 6);
    } else if (direction === Direction.UP) {
      this.backCtx.fillRect(px + 6, py + 4, 4, 6);
    } else if (direction === Direction.LEFT) {
      this.backCtx.fillRect(px + 1, py + 8, 4, 6);
    } else if (direction === Direction.RIGHT) {
      this.backCtx.fillRect(px + 11, py + 8, 4, 6);
    }

    this.backCtx.fillStyle = '#8B4513';
    if (direction === Direction.DOWN) {
      this.backCtx.fillRect(px + 7, py + 18, 2, 4);
    } else if (direction === Direction.UP) {
      this.backCtx.fillRect(px + 7, py + 6, 2, 4);
    } else if (direction === Direction.LEFT) {
      this.backCtx.fillRect(px + 2, py + 10, 2, 4);
    } else if (direction === Direction.RIGHT) {
      this.backCtx.fillRect(px + 12, py + 10, 2, 4);
    }
  }

  public renderParticles(particles: ParticleSystem, camera: CameraState, shakeX: number, shakeY: number): void {
    particles.render(this.backCtx, camera.x, camera.y, shakeX, shakeY);
  }

  public renderUI(
    depth: number,
    inventory: { copper: number; silver: number; gold: number; diamond: number },
    totalOres: number,
    health: number,
    maxHealth: number,
    gameTime: number,
    heartFlashing: boolean,
    heartFlashState: boolean
  ): void {
    const panelX = 10;
    const panelY = 10;
    const panelWidth = 150;
    const panelHeight = 180;

    this.backCtx.fillStyle = COLORS.UI_BG;
    this.backCtx.fillRect(panelX, panelY, panelWidth, panelHeight);
    
    this.backCtx.strokeStyle = COLORS.UI_BORDER;
    this.backCtx.lineWidth = 2;
    this.backCtx.strokeRect(panelX, panelY, panelWidth, panelHeight);

    this.backCtx.fillStyle = COLORS.UI_TEXT;
    this.backCtx.font = '8px "Courier New", monospace';
    this.backCtx.textAlign = 'left';

    let y = panelY + 15;
    this.backCtx.fillText(`深度: ${depth}米`, panelX + 8, y);
    y += 15;

    this.backCtx.fillText('背包:', panelX + 8, y);
    y += 12;

    const ores = [
      { name: '铜', count: inventory.copper, color: COLORS.COPPER },
      { name: '银', count: inventory.silver, color: COLORS.SILVER },
      { name: '金', count: inventory.gold, color: COLORS.GOLD },
      { name: '钻石', count: inventory.diamond, color: COLORS.DIAMOND }
    ];

    for (const ore of ores) {
      this.backCtx.fillStyle = ore.color;
      this.backCtx.fillRect(panelX + 12, y - 6, 6, 6);
      this.backCtx.fillStyle = COLORS.UI_TEXT;
      this.backCtx.fillText(`${ore.name}: ${ore.count}`, panelX + 24, y);
      y += 12;
    }

    y += 5;
    this.backCtx.fillText(`总计: ${totalOres}/${CONFIG.MAX_ORES}`, panelX + 8, y);
    y += 15;

    this.backCtx.fillText('生命:', panelX + 8, y);
    for (let i = 0; i < maxHealth; i++) {
      const heartX = panelX + 50 + i * 12;
      const heartY = y - 8;
      
      if (i < health) {
        if (heartFlashing && !heartFlashState) {
          this.backCtx.fillStyle = COLORS.HEART_EMPTY;
        } else {
          this.backCtx.fillStyle = COLORS.HEART;
        }
        this.drawHeart(heartX, heartY);
      } else {
        this.backCtx.fillStyle = COLORS.HEART_EMPTY;
        this.drawHeart(heartX, heartY);
      }
    }
    y += 15;

    this.backCtx.fillText(`时间: ${gameTime.toFixed(1)}s`, panelX + 8, y);
  }

  private drawHeart(x: number, y: number): void {
    const pattern = [
      [0, 1, 1, 0, 1, 1, 0],
      [1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1],
      [0, 1, 1, 1, 1, 1, 0],
      [0, 0, 1, 1, 1, 0, 0],
      [0, 0, 0, 1, 0, 0, 0]
    ];

    for (let py = 0; py < pattern.length; py++) {
      for (let px = 0; px < pattern[py].length; px++) {
        if (pattern[py][px]) {
          this.backCtx.fillRect(x + px, y + py, 1, 1);
        }
      }
    }
  }

  public renderFlash(camera: CameraState): void {
    if (camera.flashTime > 0) {
      const alpha = camera.flashTime / 200 * 0.3;
      this.backCtx.fillStyle = `rgba(255, 0, 0, ${alpha})`;
      this.backCtx.fillRect(0, 0, this.getCanvasWidth(), this.getCanvasHeight());
    }
  }

  public renderGameOver(): void {
    this.backCtx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.backCtx.fillRect(0, 0, this.getCanvasWidth(), this.getCanvasHeight());

    this.backCtx.fillStyle = '#FF0000';
    this.backCtx.font = 'bold 16px "Courier New", monospace';
    this.backCtx.textAlign = 'center';
    this.backCtx.fillText('矿工遇难', this.getCanvasWidth() / 2, this.getCanvasHeight() / 2 - 10);

    this.backCtx.fillStyle = '#FFFFFF';
    this.backCtx.font = '8px "Courier New", monospace';
    this.backCtx.fillText('按 R 键重新开始', this.getCanvasWidth() / 2, this.getCanvasHeight() / 2 + 15);
  }

  public renderVictory(
    inventory: { copper: number; silver: number; gold: number; diamond: number },
    depth: number,
    gameTime: number,
    multiplier: number
  ): void {
    this.backCtx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    this.backCtx.fillRect(0, 0, this.getCanvasWidth(), this.getCanvasHeight());

    const centerX = this.getCanvasWidth() / 2;
    let y = 30;

    this.backCtx.fillStyle = '#FFD700';
    this.backCtx.font = 'bold 14px "Courier New", monospace';
    this.backCtx.textAlign = 'center';
    this.backCtx.fillText('满载而归！', centerX, y);
    y += 25;

    this.backCtx.fillStyle = '#FFFFFF';
    this.backCtx.font = '8px "Courier New", monospace';
    this.backCtx.fillText('--- 收集统计 ---', centerX, y);
    y += 15;

    const totalValue = 
      inventory.copper * 1 * multiplier +
      inventory.silver * 3 * multiplier +
      inventory.gold * 10 * multiplier +
      inventory.diamond * 50 * multiplier;

    this.backCtx.fillStyle = COLORS.COPPER;
    this.backCtx.fillText(`铜矿石: ${inventory.copper} 个`, centerX, y);
    y += 12;
    
    this.backCtx.fillStyle = COLORS.SILVER;
    this.backCtx.fillText(`银矿石: ${inventory.silver} 个`, centerX, y);
    y += 12;
    
    this.backCtx.fillStyle = COLORS.GOLD;
    this.backCtx.fillText(`金矿石: ${inventory.gold} 个`, centerX, y);
    y += 12;
    
    this.backCtx.fillStyle = COLORS.DIAMOND;
    this.backCtx.fillText(`钻石: ${inventory.diamond} 个`, centerX, y);
    y += 15;

    this.backCtx.fillStyle = '#FFFFFF';
    this.backCtx.fillText(`最大深度: ${depth} 米`, centerX, y);
    y += 12;
    this.backCtx.fillText(`游戏时间: ${gameTime.toFixed(1)} 秒`, centerX, y);
    y += 12;
    this.backCtx.fillText(`价值倍率: x${multiplier.toFixed(1)}`, centerX, y);
    y += 15;

    this.backCtx.fillStyle = '#FFD700';
    this.backCtx.font = 'bold 10px "Courier New", monospace';
    this.backCtx.fillText(`总价值: ${Math.floor(totalValue)} 金币`, centerX, y);
    y += 25;

    this.backCtx.fillStyle = '#FFFFFF';
    this.backCtx.font = '8px "Courier New", monospace';
    this.backCtx.fillText('按 R 键重新开始', centerX, y);
  }

  public present(): void {
    this.ctx.drawImage(
      this.backBuffer,
      0, 0, this.backBuffer.width, this.backBuffer.height,
      0, 0, this.canvas.width, this.canvas.height
    );
  }
}
