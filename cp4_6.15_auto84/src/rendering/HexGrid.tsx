import { Container, Graphics } from 'pixi.js';
import { HexCell, TerrainType, axialToPixel } from '../game/UnitData';

const HEX_SIZE = 40;
const SQRT3 = Math.sqrt(3);

export class HexGridRenderer {
  private container: Container;
  private gridGraphics: Graphics;
  private terrainGraphics: Graphics;
  private highlightGraphics: Graphics;
  private tick: number = 0;

  constructor(parent: Container) {
    this.container = new Container();
    this.gridGraphics = new Graphics();
    this.terrainGraphics = new Graphics();
    this.highlightGraphics = new Graphics();
    this.container.addChild(this.gridGraphics);
    this.container.addChild(this.terrainGraphics);
    this.container.addChild(this.highlightGraphics);
    parent.addChild(this.container);
  }

  drawGrid(cells: HexCell[]): void {
    this.gridGraphics.clear();
    for (const cell of cells) {
      const { x, y } = axialToPixel(cell.q, cell.r, HEX_SIZE);
      this.drawHexOutline(this.gridGraphics, x, y, 0x1a2444, 0.4);
    }
  }

  drawTerrain(cells: HexCell[]): void {
    this.terrainGraphics.clear();
    for (const cell of cells) {
      const { x, y } = axialToPixel(cell.q, cell.r, HEX_SIZE);
      switch (cell.terrain) {
        case 'nebula':
          this.drawNebula(x, y);
          break;
        case 'asteroid':
          this.drawAsteroid(x, y);
          break;
        case 'station':
          this.drawStation(x, y);
          break;
      }
    }
  }

  drawHighlights(moveCells: HexCell[], attackCells: HexCell[]): void {
    this.highlightGraphics.clear();
    for (const cell of moveCells) {
      const { x, y } = axialToPixel(cell.q, cell.r, HEX_SIZE);
      this.highlightGraphics.beginFill(0x00d4ff, 0.15);
      this.drawHexPath(this.highlightGraphics, x, y);
      this.highlightGraphics.endFill();
      this.highlightGraphics.lineStyle(1, 0x00d4ff, 0.3);
      this.drawHexPath(this.highlightGraphics, x, y);
      this.highlightGraphics.lineStyle(0);
    }
    for (const cell of attackCells) {
      const { x, y } = axialToPixel(cell.q, cell.r, HEX_SIZE);
      this.highlightGraphics.beginFill(0xff4d2a, 0.12);
      this.highlightGraphics.drawCircle(x, y, HEX_SIZE * 0.6);
      this.highlightGraphics.endFill();
      this.highlightGraphics.lineStyle(2, 0xff4d2a, 0.4);
      this.highlightGraphics.drawCircle(x, y, HEX_SIZE * 0.6);
      this.highlightGraphics.lineStyle(0);
    }
  }

  animateTerrain(): void {
    this.tick++;
    this.terrainGraphics.clear();
  }

  drawAnimatedTerrain(cells: HexCell[], tick: number): void {
    this.terrainGraphics.clear();
    for (const cell of cells) {
      const { x, y } = axialToPixel(cell.q, cell.r, HEX_SIZE);
      switch (cell.terrain) {
        case 'nebula':
          this.drawAnimatedNebula(x, y, tick);
          break;
        case 'asteroid':
          this.drawAnimatedAsteroid(x, y, tick);
          break;
        case 'station':
          this.drawAnimatedStation(x, y, tick);
          break;
      }
    }
  }

  clearHighlights(): void {
    this.highlightGraphics.clear();
  }

  getContainer(): Container {
    return this.container;
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }

  private drawHexOutline(g: Graphics, cx: number, cy: number, color: number, alpha: number): void {
    g.lineStyle(1, color, alpha);
    this.drawHexPath(g, cx, cy);
    g.lineStyle(0);
  }

  private drawHexPath(g: Graphics, cx: number, cy: number): void {
    g.moveTo(cx + HEX_SIZE * SQRT3 / 2, cy - HEX_SIZE / 2);
    for (let i = 1; i <= 6; i++) {
      const angle = (Math.PI / 180) * (60 * i - 30);
      g.lineTo(cx + HEX_SIZE * Math.cos(angle), cy + HEX_SIZE * Math.sin(angle));
    }
    g.closePath();
  }

  private drawNebula(cx: number, cy: number): void {
    this.terrainGraphics.beginFill(0x8b00ff, 0.2);
    this.terrainGraphics.drawCircle(cx, cy, HEX_SIZE * 0.5);
    this.terrainGraphics.endFill();
  }

  private drawAnimatedNebula(cx: number, cy: number, tick: number): void {
    const phase = tick * 0.03;
    for (let i = 0; i < 3; i++) {
      const angle = phase + (Math.PI * 2 * i) / 3;
      const radius = HEX_SIZE * 0.3 + Math.sin(phase + i) * 4;
      const ox = Math.cos(angle) * radius * 0.3;
      const oy = Math.sin(angle) * radius * 0.3;
      this.terrainGraphics.beginFill(0x8b00ff, 0.15 + Math.sin(phase + i * 2) * 0.05);
      this.terrainGraphics.drawCircle(cx + ox, cy + oy, radius);
      this.terrainGraphics.endFill();
    }
    this.terrainGraphics.beginFill(0x9d4edd, 0.1);
    this.terrainGraphics.drawCircle(cx, cy, HEX_SIZE * 0.35);
    this.terrainGraphics.endFill();
  }

  private drawAsteroid(cx: number, cy: number): void {
    this.terrainGraphics.beginFill(0x442200, 0.3);
    this.terrainGraphics.drawCircle(cx, cy, HEX_SIZE * 0.4);
    this.terrainGraphics.endFill();
    this.terrainGraphics.beginFill(0x663300, 0.4);
    this.terrainGraphics.drawCircle(cx - 5, cy - 3, 4);
    this.terrainGraphics.drawCircle(cx + 6, cy + 2, 3);
    this.terrainGraphics.drawCircle(cx, cy + 5, 3.5);
    this.terrainGraphics.endFill();
  }

  private drawAnimatedAsteroid(cx: number, cy: number, tick: number): void {
    const flash = Math.sin(tick * 0.1) > 0.7 ? 0.3 : 0;
    this.terrainGraphics.beginFill(0x442200, 0.3);
    this.terrainGraphics.drawCircle(cx, cy, HEX_SIZE * 0.4);
    this.terrainGraphics.endFill();
    this.terrainGraphics.beginFill(0x663300, 0.5);
    this.terrainGraphics.drawCircle(cx - 5, cy - 3, 4);
    this.terrainGraphics.drawCircle(cx + 6, cy + 2, 3);
    this.terrainGraphics.drawCircle(cx, cy + 5, 3.5);
    this.terrainGraphics.endFill();
    if (flash > 0) {
      this.terrainGraphics.beginFill(0xff2200, flash);
      this.terrainGraphics.drawCircle(cx, cy, HEX_SIZE * 0.5);
      this.terrainGraphics.endFill();
      this.terrainGraphics.lineStyle(2, 0xff4400, 0.6);
      const crackLen = HEX_SIZE * 0.3;
      this.terrainGraphics.moveTo(cx - crackLen, cy - crackLen * 0.5);
      this.terrainGraphics.lineTo(cx, cy);
      this.terrainGraphics.lineTo(cx + crackLen * 0.7, cy + crackLen * 0.3);
      this.terrainGraphics.lineStyle(0);
    }
  }

  private drawStation(cx: number, cy: number): void {
    this.terrainGraphics.beginFill(0x0044aa, 0.2);
    this.terrainGraphics.drawCircle(cx, cy, HEX_SIZE * 0.35);
    this.terrainGraphics.endFill();
    this.terrainGraphics.beginFill(0x0066cc, 0.3);
    this.terrainGraphics.drawRect(cx - 6, cy - 6, 12, 12);
    this.terrainGraphics.endFill();
  }

  private drawAnimatedStation(cx: number, cy: number, tick: number): void {
    const phase = tick * 0.04;
    this.terrainGraphics.beginFill(0x0044aa, 0.15);
    this.terrainGraphics.drawCircle(cx, cy, HEX_SIZE * 0.35);
    this.terrainGraphics.endFill();
    this.terrainGraphics.beginFill(0x1166dd, 0.35);
    this.terrainGraphics.drawRect(cx - 6, cy - 6, 12, 12);
    this.terrainGraphics.endFill();
    this.terrainGraphics.lineStyle(2, 0x00d4ff, 0.4 + Math.sin(phase) * 0.2);
    this.terrainGraphics.drawCircle(cx, cy, HEX_SIZE * 0.45 + Math.sin(phase) * 3);
    this.terrainGraphics.lineStyle(0);
    const ringAngle = phase * 2;
    this.terrainGraphics.lineStyle(1.5, 0x00d4ff, 0.3);
    this.terrainGraphics.arc(cx, cy, HEX_SIZE * 0.5, ringAngle, ringAngle + Math.PI * 1.2);
    this.terrainGraphics.lineStyle(0);
  }
}
