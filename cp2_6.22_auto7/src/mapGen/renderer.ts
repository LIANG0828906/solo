import * as PIXI from 'pixi.js';
import { MapData, TileType } from './mapGenerator';

export interface RendererOptions {
  tileSize: number;
  app: PIXI.Application;
}

export class MapRenderer {
  private app: PIXI.Application;
  private tileSize: number;
  private mapContainer: PIXI.Container;
  private gridLayer: PIXI.Container;
  private tileContainer: PIXI.Container;
  private waterSprites: PIXI.Graphics[] = [];
  private grassDetails: PIXI.Graphics[] = [];
  private mapData: MapData | null = null;
  private showGrid: boolean = false;
  private showPathMarkers: boolean = false;

  constructor(options: RendererOptions) {
    this.app = options.app;
    this.tileSize = options.tileSize;
    this.mapContainer = new PIXI.Container();
    this.tileContainer = new PIXI.Container();
    this.gridLayer = new PIXI.Container();
    this.mapContainer.addChild(this.tileContainer);
    this.mapContainer.addChild(this.gridLayer);
    this.app.stage.addChild(this.mapContainer);
  }

  public getContainer(): PIXI.Container {
    return this.mapContainer;
  }

  public render(mapData: MapData): void {
    this.mapData = mapData;
    this.clear();
    this.renderTiles(mapData);
    this.renderGrid(mapData);
  }

  private clear(): void {
    this.tileContainer.removeChildren();
    this.gridLayer.removeChildren();
    this.waterSprites = [];
    this.grassDetails = [];
  }

  private renderTiles(mapData: MapData): void {
    for (let y = 0; y < mapData.height; y++) {
      for (let x = 0; x < mapData.width; x++) {
        const tile = mapData.tiles[y][x];
        const tileGraphics = new PIXI.Graphics();
        const px = x * this.tileSize;
        const py = y * this.tileSize;

        switch (tile.type) {
          case TileType.GRASS:
            this.drawGrassTile(tileGraphics, px, py);
            const detail = this.addGrassDetail(x, y);
            if (detail) {
              this.grassDetails.push(detail);
              this.tileContainer.addChild(detail);
            }
            break;
          case TileType.WATER:
            this.drawWaterTile(tileGraphics, px, py);
            this.waterSprites.push(tileGraphics);
            break;
          case TileType.WALL:
            this.drawWallTile(tileGraphics, px, py);
            break;
        }

        this.tileContainer.addChild(tileGraphics);
      }
    }
  }

  private drawGrassTile(graphics: PIXI.Graphics, x: number, y: number): void {
    graphics.beginFill(0x4a7a4a);
    graphics.drawRect(x, y, this.tileSize, this.tileSize);
    graphics.endFill();
  }

  private addGrassDetail(tileX: number, tileY: number): PIXI.Graphics | null {
    if (Math.random() > 0.4) return null;

    const detail = new PIXI.Graphics();
    const count = Math.floor(Math.random() * 3) + 1;

    for (let i = 0; i < count; i++) {
      const gx = tileX * this.tileSize + Math.random() * this.tileSize;
      const gy = tileY * this.tileSize + Math.random() * this.tileSize;
      const size = 2 + Math.random() * 3;

      detail.beginFill(0x5a9a5a);
      detail.drawRect(gx, gy, size, size);
      detail.endFill();
    }

    return detail;
  }

  private drawWaterTile(graphics: PIXI.Graphics, x: number, y: number): void {
    graphics.beginFill(0x1a3a5a);
    graphics.drawRect(x, y, this.tileSize, this.tileSize);
    graphics.endFill();

    graphics.beginFill(0x2a5a7a, 0.5);
    const waveY = y + this.tileSize * 0.3;
    graphics.drawRect(x + 4, waveY, this.tileSize - 8, 3);
    graphics.endFill();
  }

  private drawWallTile(graphics: PIXI.Graphics, x: number, y: number): void {
    graphics.beginFill(0x3a3a3a);
    graphics.drawRect(x, y, this.tileSize, this.tileSize);
    graphics.endFill();

    graphics.lineStyle(1, 0x2a2a2a, 1);
    const brickHeight = this.tileSize / 3;
    const brickWidth = this.tileSize / 2;

    for (let row = 0; row < 3; row++) {
      const offset = row % 2 === 0 ? 0 : brickWidth / 2;
      for (let col = -1; col < 3; col++) {
        const bx = x + col * brickWidth + offset;
        const by = y + row * brickHeight;
        graphics.drawRect(bx, by, brickWidth, brickHeight);
      }
    }
  }

  private renderGrid(mapData: MapData): void {
    const gridGraphics = new PIXI.Graphics();
    gridGraphics.lineStyle(1, 0xffffff, 0.15);

    for (let x = 0; x <= mapData.width; x++) {
      const px = x * this.tileSize;
      gridGraphics.moveTo(px, 0);
      gridGraphics.lineTo(px, mapData.height * this.tileSize);
    }

    for (let y = 0; y <= mapData.height; y++) {
      const py = y * this.tileSize;
      gridGraphics.moveTo(0, py);
      gridGraphics.lineTo(mapData.width * this.tileSize, py);
    }

    this.gridLayer.addChild(gridGraphics);
    this.gridLayer.visible = this.showGrid;
  }

  public update(_deltaTime: number): void {
    const time = Date.now() / 1000;
    this.waterSprites.forEach((sprite, index) => {
      const offset = Math.sin(time * 2 + index * 0.5) * 2;
      sprite.y = offset * 0.3;
    });
  }

  public toggleGrid(): void {
    this.showGrid = !this.showGrid;
    this.gridLayer.visible = this.showGrid;
  }

  public togglePathMarkers(): void {
    this.showPathMarkers = !this.showPathMarkers;
  }

  public isShowPathMarkers(): boolean {
    return this.showPathMarkers;
  }

  public getTileSize(): number {
    return this.tileSize;
  }

  public getMapSize(): { width: number; height: number } | null {
    if (!this.mapData) return null;
    return {
      width: this.mapData.width * this.tileSize,
      height: this.mapData.height * this.tileSize
    };
  }
}
