import type { Character, CollisionPolygon, Tile, Point } from '@/store/mapStore';
import { CollisionEngine, Rect } from '@/modules/engine/CollisionEngine';

export interface SimulatorState {
  character: Character;
  isRunning: boolean;
}

export class PreviewSimulator {
  private character: Character;
  private collisionPolygons: CollisionPolygon[];
  private tiles: Tile[];
  private gridSize: number;
  private isRunning: boolean;
  private animationFrameId: number | null = null;
  private lastTime: number = 0;
  private onUpdate: ((character: Character) => void) | null = null;
  private gravity: number = 800;
  private moveSpeed: number = 120;
  private jumpForce: number = -350;
  private characterWidth: number = 24;
  private characterHeight: number = 36;
  private walkAnimationTimer: number = 0;
  private walkFrameDuration: number = 0.15;

  constructor(
    initialCharacter: Character,
    collisionPolygons: CollisionPolygon[],
    tiles: Tile[],
    gridSize: number
  ) {
    this.character = { ...initialCharacter };
    this.collisionPolygons = collisionPolygons;
    this.tiles = tiles;
    this.gridSize = gridSize;
    this.isRunning = false;
  }

  setOnUpdate(callback: (character: Character) => void): void {
    this.onUpdate = callback;
  }

  updateCollisionData(polygons: CollisionPolygon[], tiles: Tile[]): void {
    this.collisionPolygons = polygons;
    this.tiles = tiles;
  }

  setCharacter(character: Character): void {
    this.character = { ...character };
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.character.isWalking = true;
    this.character.velocityX = this.moveSpeed;
    this.loop();
  }

  stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  reset(): void {
    this.stop();
    const leftMostTile = this.tiles.reduce(
      (min, t) => (t.x < min.x ? t : min),
      this.tiles[0]
    );
    this.character = {
      x: leftMostTile ? leftMostTile.x * this.gridSize : 100,
      y: 200,
      velocityX: 0,
      velocityY: 0,
      isJumping: false,
      isWalking: false,
      walkFrame: 0,
      facingRight: true,
    };
    this.walkAnimationTimer = 0;
  }

  private loop(): void {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.05);
    this.lastTime = currentTime;

    this.update(deltaTime);

    if (this.onUpdate) {
      this.onUpdate({ ...this.character });
    }

    this.animationFrameId = requestAnimationFrame(() => this.loop());
  }

  update(deltaTime: number): void {
    if (!this.character.isWalking && !this.character.isJumping) {
      return;
    }

    this.applyGravity(deltaTime);
    this.updatePosition(deltaTime);
    this.handleCollisions();
    this.checkPlatformEdge();
    this.updateWalkAnimation(deltaTime);
  }

  private applyGravity(deltaTime: number): void {
    this.character.velocityY += this.gravity * deltaTime;
  }

  private updatePosition(deltaTime: number): void {
    this.character.x += this.character.velocityX * deltaTime;
    this.character.y += this.character.velocityY * deltaTime;
  }

  private getCharacterRect(): Rect {
    return {
      x: this.character.x - this.characterWidth / 2,
      y: this.character.y - this.characterHeight,
      width: this.characterWidth,
      height: this.characterHeight,
    };
  }

  private handleCollisions(): void {
    const charRect = this.getCharacterRect();
    const collisions = CollisionEngine.checkMultipleCollisions(
      charRect,
      this.collisionPolygons
    );

    for (const collision of collisions) {
      if (!collision.collided || !collision.direction || !collision.overlap) {
        continue;
      }

      switch (collision.direction) {
        case 'top':
          this.character.y += collision.overlap;
          this.character.velocityY = Math.max(0, this.character.velocityY);
          this.character.isJumping = false;
          break;
        case 'bottom':
          this.character.y -= collision.overlap;
          this.character.velocityY = Math.min(0, this.character.velocityY);
          break;
        case 'left':
          this.character.x += collision.overlap;
          this.character.velocityX = Math.max(0, this.character.velocityX);
          break;
        case 'right':
          this.character.x -= collision.overlap;
          this.character.velocityX = Math.min(0, this.character.velocityX);
          this.stopWalking();
          break;
      }
    }
  }

  private stopWalking(): void {
    this.character.isWalking = false;
    this.character.velocityX = 0;
  }

  private checkPlatformEdge(): void {
    if (this.character.isJumping) return;

    const charRect = this.getCharacterRect();
    const footX = charRect.x + charRect.width / 2;
    const footY = charRect.y + charRect.height + 5;

    const groundCheck: Rect = {
      x: footX - 2,
      y: footY,
      width: 4,
      height: 10,
    };

    const hasGround = this.collisionPolygons.some(polygon =>
      CollisionEngine.rectIntersectsPolygon(groundCheck, polygon.vertices)
    );

    if (!hasGround) {
      this.jump();
    }
  }

  private jump(): void {
    if (!this.character.isJumping) {
      this.character.velocityY = this.jumpForce;
      this.character.isJumping = true;
    }
  }

  private updateWalkAnimation(deltaTime: number): void {
    if (!this.character.isWalking || this.character.isJumping) {
      this.character.walkFrame = 0;
      return;
    }

    this.walkAnimationTimer += deltaTime;
    if (this.walkAnimationTimer >= this.walkFrameDuration) {
      this.walkAnimationTimer = 0;
      this.character.walkFrame = (this.character.walkFrame + 1) % 4;
    }
  }

  getCharacter(): Character {
    return { ...this.character };
  }

  getState(): SimulatorState {
    return {
      character: { ...this.character },
      isRunning: this.isRunning,
    };
  }

  getTilesBelow(x: number, y: number): Tile[] {
    const gridX = Math.floor(x / this.gridSize);
    const gridY = Math.floor(y / this.gridSize);
    
    return this.tiles.filter(
      tile => tile.x === gridX && tile.y >= gridY
    ).sort((a, b) => a.y - b.y);
  }

  checkTileCollision(x: number, y: number): boolean {
    const gridX = Math.floor(x / this.gridSize);
    const gridY = Math.floor(y / this.gridSize);
    
    return this.tiles.some(
      tile => tile.x === gridX && tile.y === gridY && tile.type === 'wall'
    );
  }

  worldToGrid(worldX: number, worldY: number): Point {
    return {
      x: Math.floor(worldX / this.gridSize),
      y: Math.floor(worldY / this.gridSize),
    };
  }

  gridToWorld(gridX: number, gridY: number): Point {
    return {
      x: gridX * this.gridSize,
      y: gridY * this.gridSize,
    };
  }
}
