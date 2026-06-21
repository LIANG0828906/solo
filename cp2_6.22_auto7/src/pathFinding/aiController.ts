import * as PIXI from 'pixi.js';
import { AStar, PathPoint } from './astar';
import { Tile } from '../mapGen/mapGenerator';

export interface AIControllerOptions {
  tileSize: number;
  speed: number;
  mapContainer: PIXI.Container;
  onPathUpdate?: (path: PathPoint[]) => void;
}

export enum AIState {
  IDLE = 'idle',
  PATHFINDING = 'pathfinding'
}

export class AIController {
  private sprite: PIXI.Graphics;
  private glowSprite: PIXI.Graphics;
  private tileSize: number;
  private speed: number;
  private path: PathPoint[] = [];
  private currentPathIndex: number = 0;
  private targetPosition: { x: number; y: number };
  private gridPosition: { x: number; y: number };
  private astar: AStar;
  private state: AIState = AIState.IDLE;
  private pulseTime: number = 0;
  private pathUpdateInterval: number = 200;
  private lastPathUpdate: number = 0;
  private mapContainer: PIXI.Container;
  private pathGraphics: PIXI.Graphics;
  private showPath: boolean = false;

  constructor(
    startPos: { x: number; y: number },
    tiles: Tile[][],
    options: AIControllerOptions
  ) {
    this.tileSize = options.tileSize;
    this.speed = options.speed;
    this.mapContainer = options.mapContainer;
    this.gridPosition = { ...startPos };
    this.targetPosition = {
      x: startPos.x * this.tileSize + this.tileSize / 2,
      y: startPos.y * this.tileSize + this.tileSize / 2
    };

    this.astar = new AStar(tiles);

    this.sprite = new PIXI.Graphics();
    this.glowSprite = new PIXI.Graphics();
    this.pathGraphics = new PIXI.Graphics();

    this.drawMonster();
    this.updatePosition();

    this.mapContainer.addChild(this.pathGraphics);
    this.mapContainer.addChild(this.glowSprite);
    this.mapContainer.addChild(this.sprite);
  }

  private drawMonster(): void {
    this.sprite.clear();
    const size = this.tileSize * 0.35;

    this.sprite.beginFill(0xff4a4a);
    this.sprite.moveTo(0, -size);
    this.sprite.lineTo(size * 0.8, size * 0.6);
    this.sprite.lineTo(-size * 0.8, size * 0.6);
    this.sprite.closePath();
    this.sprite.endFill();

    this.sprite.beginFill(0x2a0a0a);
    this.sprite.drawCircle(-size * 0.25, 0, size * 0.12);
    this.sprite.drawCircle(size * 0.25, 0, size * 0.12);
    this.sprite.endFill();
  }

  private drawGlow(scale: number): void {
    this.glowSprite.clear();
    const size = this.tileSize * 0.6 * scale;
    this.glowSprite.beginFill(0xff4a4a, 0.15);
    this.glowSprite.drawCircle(0, 0, size);
    this.glowSprite.endFill();
  }

  public update(deltaTime: number, playerGridPos: { x: number; y: number }, currentTime: number): void {
    this.pulseTime += deltaTime * 0.05;
    const pulseScale = 1 + Math.sin(this.pulseTime) * 0.15;
    this.sprite.scale.set(pulseScale);
    this.drawGlow(pulseScale);

    if (currentTime - this.lastPathUpdate > this.pathUpdateInterval) {
      this.updatePath(playerGridPos);
      this.lastPathUpdate = currentTime;
    }

    this.moveAlongPath(deltaTime);
    this.updatePosition();
  }

  private updatePath(playerGridPos: { x: number; y: number }): void {
    if (
      this.gridPosition.x === playerGridPos.x &&
      this.gridPosition.y === playerGridPos.y
    ) {
      this.state = AIState.IDLE;
      return;
    }

    this.state = AIState.PATHFINDING;
    const path = this.astar.findPath(this.gridPosition, playerGridPos);

    if (path.length > 0) {
      this.path = path;
      this.currentPathIndex = 0;
      if (this.showPath) {
        this.drawPathLine();
      }
    } else {
      this.state = AIState.IDLE;
    }
  }

  private moveAlongPath(deltaTime: number): void {
    if (this.path.length === 0 || this.currentPathIndex >= this.path.length) {
      this.state = AIState.IDLE;
      return;
    }

    const targetPoint = this.path[this.currentPathIndex];
    const targetX = targetPoint.x * this.tileSize + this.tileSize / 2;
    const targetY = targetPoint.y * this.tileSize + this.tileSize / 2;

    const dx = targetX - this.targetPosition.x;
    const dy = targetY - this.targetPosition.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 1) {
      this.targetPosition.x = targetX;
      this.targetPosition.y = targetY;
      this.gridPosition = { ...targetPoint };
      this.currentPathIndex++;
    } else {
      const moveDistance = this.speed * deltaTime * 0.06;
      const ratio = Math.min(moveDistance / distance, 1);
      this.targetPosition.x += dx * ratio;
      this.targetPosition.y += dy * ratio;
    }
  }

  private updatePosition(): void {
    this.sprite.x = this.targetPosition.x;
    this.sprite.y = this.targetPosition.y;
    this.glowSprite.x = this.targetPosition.x;
    this.glowSprite.y = this.targetPosition.y;
  }

  private drawPathLine(): void {
    this.pathGraphics.clear();
    if (this.path.length < 2) return;

    this.pathGraphics.lineStyle(2, 0x4a4aff, 0.7);

    for (let i = 0; i < this.path.length; i++) {
      const point = this.path[i];
      const px = point.x * this.tileSize + this.tileSize / 2;
      const py = point.y * this.tileSize + this.tileSize / 2;

      if (i === 0) {
        this.pathGraphics.moveTo(px, py);
      } else {
        this.pathGraphics.lineTo(px, py);
      }
    }
  }

  public togglePathDisplay(show: boolean): void {
    this.showPath = show;
    this.pathGraphics.visible = show;
    if (show && this.path.length > 0) {
      this.drawPathLine();
    } else {
      this.pathGraphics.clear();
    }
  }

  public getGridPosition(): { x: number; y: number } {
    return { ...this.gridPosition };
  }

  public getState(): AIState {
    return this.state;
  }

  public updateMap(tiles: Tile[][]): void {
    this.astar.updateMap(tiles);
  }

  public destroy(): void {
    this.mapContainer.removeChild(this.sprite);
    this.mapContainer.removeChild(this.glowSprite);
    this.mapContainer.removeChild(this.pathGraphics);
    this.sprite.destroy();
    this.glowSprite.destroy();
    this.pathGraphics.destroy();
  }
}
