import Phaser from 'phaser';
import { DEFAULT_LEVEL } from './levelConfig';
import type { PathPoint } from './commandExecutor';

const GRID_COLOR = 0x81C784;
const GRID_BG_COLOR = 0xe8f5e9;
const PATH_COLOR = 0xffffff;
const TURTLE_COLOR = 0xff5722;
const FLOWER_COLORS = [0xffb74d, 0xce93d8];
const FLASH_COLOR = 0x4caf50;

interface DecorData {
  x: number;
  y: number;
  color: number;
}

export class GardenScene extends Phaser.Scene {
  private gridGraphics!: Phaser.GameObjects.Graphics;
  private pathGraphics!: Phaser.GameObjects.Graphics;
  private decorGraphics!: Phaser.GameObjects.Graphics;
  private turtleContainer!: Phaser.GameObjects.Container;
  private turtleBody!: Phaser.GameObjects.Arc;
  private turtleDirection!: Phaser.GameObjects.Triangle;
  private decorItems: DecorData[] = [];
  private flashRects: Phaser.GameObjects.Rectangle[] = [];
  private pathDots: Phaser.GameObjects.Arc[] = [];
  private currentPath: PathPoint[] = [];
  private isAnimating = false;
  private onAnimComplete?: () => void;
  private gridOffsetX = 0;
  private gridOffsetY = 0;

  constructor() {
    super({ key: 'GardenScene' });
  }

  init(data: { onAnimComplete?: () => void }) {
    this.onAnimComplete = data.onAnimComplete;
  }

  create() {
    const cam = this.cameras.main;
    const gridW = DEFAULT_LEVEL.gridCols * DEFAULT_LEVEL.cellSize;
    const gridH = DEFAULT_LEVEL.gridRows * DEFAULT_LEVEL.cellSize;
    this.gridOffsetX = (cam.width - gridW) / 2;
    this.gridOffsetY = (cam.height - gridH) / 2;

    this.decorGraphics = this.add.graphics();
    this.gridGraphics = this.add.graphics();
    this.pathGraphics = this.add.graphics();

    this.generateDecor();
    this.drawGrid();
    this.drawDecor();
    this.createTurtle();
  }

  private generateDecor() {
    this.decorItems = [];
    for (let r = 0; r < DEFAULT_LEVEL.gridRows; r++) {
      for (let c = 0; c < DEFAULT_LEVEL.gridCols; c++) {
        if (Math.random() < 0.3) {
          this.decorItems.push({
            x: c * DEFAULT_LEVEL.cellSize + DEFAULT_LEVEL.cellSize / 2 + (Math.random() - 0.5) * 20,
            y: r * DEFAULT_LEVEL.cellSize + DEFAULT_LEVEL.cellSize / 2 + (Math.random() - 0.5) * 20,
            color: FLOWER_COLORS[Math.floor(Math.random() * FLOWER_COLORS.length)],
          });
        }
      }
    }
  }

  private drawGrid() {
    const g = this.gridGraphics;
    const cs = DEFAULT_LEVEL.cellSize;
    g.clear();

    g.fillStyle(GRID_BG_COLOR, 1);
    g.fillRect(this.gridOffsetX, this.gridOffsetY, DEFAULT_LEVEL.gridCols * cs, DEFAULT_LEVEL.gridRows * cs);

    g.lineStyle(1, GRID_COLOR, 1);
    for (let c = 0; c <= DEFAULT_LEVEL.gridCols; c++) {
      g.lineBetween(this.gridOffsetX + c * cs, this.gridOffsetY, this.gridOffsetX + c * cs, this.gridOffsetY + DEFAULT_LEVEL.gridRows * cs);
    }
    for (let r = 0; r <= DEFAULT_LEVEL.gridRows; r++) {
      g.lineBetween(this.gridOffsetX, this.gridOffsetY + r * cs, this.gridOffsetX + DEFAULT_LEVEL.gridCols * cs, this.gridOffsetY + r * cs);
    }
  }

  private drawDecor() {
    const g = this.decorGraphics;
    g.clear();
    for (const d of this.decorItems) {
      g.fillStyle(d.color, 0.7);
      g.fillCircle(this.gridOffsetX + d.x, this.gridOffsetY + d.y, 3);
    }
  }

  private createTurtle() {
    const cs = DEFAULT_LEVEL.cellSize;
    const sx = this.gridOffsetX + DEFAULT_LEVEL.startPos.x * cs + cs / 2;
    const sy = this.gridOffsetY + DEFAULT_LEVEL.startPos.y * cs + cs / 2;

    this.turtleBody = this.add.circle(0, 0, 12, TURTLE_COLOR);
    this.turtleDirection = this.add.triangle(0, -2, 0, -8, -5, 4, 5, 4, 0xffffff);

    this.turtleContainer = this.add.container(sx, sy, [this.turtleBody, this.turtleDirection]);
    this.turtleContainer.setDepth(10);
    this.turtleContainer.setRotation(Phaser.Math.DegToRad(DEFAULT_LEVEL.startAngle));
  }

  getGridPosition(gridX: number, gridY: number): { x: number; y: number } {
    const cs = DEFAULT_LEVEL.cellSize;
    return {
      x: this.gridOffsetX + gridX * cs + cs / 2,
      y: this.gridOffsetY + gridY * cs + cs / 2,
    };
  }

  animatePath(path: PathPoint[]): Promise<void> {
    return new Promise((resolve) => {
      if (path.length === 0) { resolve(); return; }

      this.currentPath = path;
      this.isAnimating = true;

      const cs = DEFAULT_LEVEL.cellSize;
      const start = this.getGridPosition(path[0].x, path[0].y);
      this.turtleContainer.setPosition(start.x, start.y);
      this.turtleContainer.setRotation(Phaser.Math.DegToRad(path[0].angle));

      let segIndex = 1;

      const nextSegment = () => {
        if (segIndex >= path.length) {
          this.isAnimating = false;
          this.startPathDots();
          this.onAnimComplete?.();
          resolve();
          return;
        }

        const prev = path[segIndex - 1];
        const curr = path[segIndex];
        const from = this.getGridPosition(prev.x, prev.y);
        const to = this.getGridPosition(curr.x, curr.y);
        const targetAngle = Phaser.Math.DegToRad(curr.angle);

        const moved = prev.x !== curr.x || prev.y !== curr.y;
        const turned = prev.angle !== curr.angle;

        const timeline = this.tweens.createTimeline();

        if (turned) {
          timeline.add({
            targets: this.turtleContainer,
            rotation: targetAngle,
            duration: 300,
            ease: 'Power2',
          });
        }

        if (moved) {
          timeline.add({
            targets: this.turtleContainer,
            x: to.x,
            y: to.y,
            duration: 500,
            ease: 'Power2',
            onUpdate: () => {
              this.drawPathSegment(
                from.x, from.y,
                this.turtleContainer.x, this.turtleContainer.y
              );
            },
            onComplete: () => {
              this.drawPathSegment(from.x, from.y, to.x, to.y);
              this.flashCell(curr.x, curr.y);
            },
          });
        }

        if (!moved && !turned) {
          timeline.add({ targets: {}, duration: 0 });
        }

        timeline.add({
          targets: {},
          duration: 200,
          onComplete: () => {
            segIndex++;
            nextSegment();
          },
        });

        timeline.play();
      };

      nextSegment();
    });
  }

  private drawPathSegment(fromX: number, fromY: number, toX: number, toY: number) {
    this.pathGraphics.lineStyle(2, PATH_COLOR, 1);
    this.pathGraphics.lineBetween(fromX, fromY, toX, toY);
  }

  private flashCell(gx: number, gy: number) {
    const cs = DEFAULT_LEVEL.cellSize;
    const px = this.gridOffsetX + gx * cs;
    const py = this.gridOffsetY + gy * cs;
    const rect = this.add.rectangle(px + cs / 2, py + cs / 2, cs, cs, FLASH_COLOR, 0.4);
    rect.setDepth(5);
    this.flashRects.push(rect);
    this.tweens.add({
      targets: rect,
      alpha: 0,
      duration: 500,
      onComplete: () => {
        rect.destroy();
        this.flashRects = this.flashRects.filter((r) => r !== rect);
      },
    });
  }

  private startPathDots() {
    this.clearPathDots();
    if (this.currentPath.length < 2) return;

    const totalLen = this.computePathLength();
    const interval = 10;
    const dotCount = Math.floor(totalLen / interval);

    for (let i = 0; i < dotCount; i++) {
      const t = (i * interval) / totalLen;
      const pos = this.getPointAlongPath(t);
      const dot = this.add.circle(pos.x, pos.y, 2, 0xffffff, 0.8);
      dot.setDepth(8);
      this.pathDots.push(dot);
    }

    if (this.pathDots.length > 0) {
      this.animateDots(0);
    }
  }

  private animateDots(offset: number) {
    if (!this.isAnimating && this.pathDots.length === 0) return;

    this.time.delayedCall(100, () => {
      const next = (offset + 1) % 20;
      for (let i = 0; i < this.pathDots.length; i++) {
        const visible = ((i + offset) % 20) < 4;
        this.pathDots[i].setAlpha(visible ? 0.9 : 0.2);
      }
      this.animateDots(next);
    });
  }

  private computePathLength(): number {
    let len = 0;
    for (let i = 1; i < this.currentPath.length; i++) {
      const prev = this.getGridPosition(this.currentPath[i - 1].x, this.currentPath[i - 1].y);
      const curr = this.getGridPosition(this.currentPath[i].x, this.currentPath[i].y);
      len += Phaser.Math.Distance.Between(prev.x, prev.y, curr.x, curr.y);
    }
    return len;
  }

  private getPointAlongPath(t: number): { x: number; y: number } {
    const totalLen = this.computePathLength();
    let target = t * totalLen;
    for (let i = 1; i < this.currentPath.length; i++) {
      const prev = this.getGridPosition(this.currentPath[i - 1].x, this.currentPath[i - 1].y);
      const curr = this.getGridPosition(this.currentPath[i].x, this.currentPath[i].y);
      const segLen = Phaser.Math.Distance.Between(prev.x, prev.y, curr.x, curr.y);
      if (target <= segLen && segLen > 0) {
        const ratio = target / segLen;
        return {
          x: prev.x + (curr.x - prev.x) * ratio,
          y: prev.y + (curr.y - prev.y) * ratio,
        };
      }
      target -= segLen;
    }
    const last = this.currentPath[this.currentPath.length - 1];
    return this.getGridPosition(last.x, last.y);
  }

  private clearPathDots() {
    for (const d of this.pathDots) d.destroy();
    this.pathDots = [];
  }

  reset() {
    this.isAnimating = false;
    this.clearPathDots();
    this.pathGraphics.clear();
    for (const r of this.flashRects) r.destroy();
    this.flashRects = [];

    const cs = DEFAULT_LEVEL.cellSize;
    const sx = this.gridOffsetX + DEFAULT_LEVEL.startPos.x * cs + cs / 2;
    const sy = this.gridOffsetY + DEFAULT_LEVEL.startPos.y * cs + cs / 2;
    this.turtleContainer.setPosition(sx, sy);
    this.turtleContainer.setRotation(Phaser.Math.DegToRad(DEFAULT_LEVEL.startAngle));
  }
}
