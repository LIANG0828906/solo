import { TILE_SIZE, Position, KeyColor, TileType, MAP_WIDTH, MAP_HEIGHT } from './types';
import { GameMap } from './Map';
import { audioManager } from './Audio';

export class Player {
  private gridX: number;
  private gridY: number;
  private renderX: number;
  private renderY: number;
  private targetX: number;
  private targetY: number;
  private health: number = 100;
  private maxHealth: number = 100;
  private score: number = 0;
  private keys: Set<KeyColor> = new Set();
  private moving: boolean = false;
  private moveProgress: number = 0;
  private direction: 'left' | 'right' | 'up' | 'down' = 'down';
  private walkFrame: number = 0;
  private walkTimer: number = 0;
  private scalePulse: number = 1;
  private hurtFlash: number = 0;
  private wallBounce: number = 0;
  private attacking: boolean = false;
  private attackTimer: number = 0;
  private attackCooldown: number = 0;
  private moveCooldown: number = 0;
  private healthFlash: number = 0;
  private bounceDirection: Position = { x: 0, y: 0 };

  constructor(spawn: Position) {
    this.gridX = spawn.x;
    this.gridY = spawn.y;
    this.renderX = spawn.x * TILE_SIZE;
    this.renderY = spawn.y * TILE_SIZE;
    this.targetX = this.renderX;
    this.targetY = this.renderY;
  }

  update(deltaTime: number, map: GameMap): void {
    if (this.moving) {
      this.moveProgress += deltaTime / 100;
      if (this.moveProgress >= 1) {
        this.moveProgress = 1;
        this.moving = false;
        this.renderX = this.targetX;
        this.renderY = this.targetY;
        this.gridX = Math.round(this.targetX / TILE_SIZE);
        this.gridY = Math.round(this.targetY / TILE_SIZE);
        this.moveCooldown = 50;
      } else {
        const easeProgress = this.easeOutQuad(this.moveProgress);
        this.renderX = this.lerp(this.targetX - TILE_SIZE * this.getDirectionVector().x, this.targetX, easeProgress);
        this.renderY = this.lerp(this.targetY - TILE_SIZE * this.getDirectionVector().y, this.targetY, easeProgress);
      }
      this.scalePulse = 1 + Math.sin(this.moveProgress * Math.PI) * 0.15;
      this.walkTimer += deltaTime;
      if (this.walkTimer > 50) {
        this.walkFrame = (this.walkFrame + 1) % 2;
        this.walkTimer = 0;
      }
    } else {
      this.scalePulse = 1 + (this.scalePulse - 1) * 0.9;
    }

    if (this.wallBounce > 0) {
      this.wallBounce -= deltaTime;
    }

    if (this.hurtFlash > 0) {
      this.hurtFlash -= deltaTime;
    }

    if (this.healthFlash > 0) {
      this.healthFlash -= deltaTime;
    }

    if (this.attacking) {
      this.attackTimer -= deltaTime;
      if (this.attackTimer <= 0) {
        this.attacking = false;
      }
    }

    if (this.attackCooldown > 0) {
      this.attackCooldown -= deltaTime;
    }

    if (this.moveCooldown > 0) {
      this.moveCooldown -= deltaTime;
    }

    this.checkTileInteraction(map);
  }

  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  private easeOutQuad(t: number): number {
    return t * (2 - t);
  }

  private getDirectionVector(): Position {
    switch (this.direction) {
      case 'left': return { x: -1, y: 0 };
      case 'right': return { x: 1, y: 0 };
      case 'up': return { x: 0, y: -1 };
      case 'down': return { x: 0, y: 1 };
    }
  }

  move(direction: 'left' | 'right' | 'up' | 'down', map: GameMap): boolean {
    if (this.moving || this.moveCooldown > 0) return false;

    this.direction = direction;
    const dir = this.getDirectionVector();
    const newX = this.gridX + dir.x;
    const newY = this.gridY + dir.y;

    if (newX < 0 || newX >= MAP_WIDTH || newY < 0 || newY >= MAP_HEIGHT) {
      this.triggerWallBounce(dir);
      return false;
    }

    const tile = map.getTileAt(newX, newY);
    if (tile === TileType.WALL) {
      this.triggerWallBounce(dir);
      return false;
    }

    const chest = map.getChests().find(c => c.x === newX && c.y === newY && !c.opened && !c.opening);
    if (chest) {
      if (this.keys.has(chest.keyRequired)) {
        this.keys.delete(chest.keyRequired);
        map.openChest(chest);
        this.addScore(100);
        audioManager.playChestOpen();
      } else {
        this.triggerWallBounce(dir);
        return false;
      }
    }

    this.targetX = newX * TILE_SIZE;
    this.targetY = newY * TILE_SIZE;
    this.moving = true;
    this.moveProgress = 0;

    return true;
  }

  private triggerWallBounce(dir: Position): void {
    this.wallBounce = 50;
    this.hurtFlash = 50;
    this.bounceDirection = { ...dir };
    audioManager.playWallHit();
  }

  private checkTileInteraction(map: GameMap): void {
    const tile = map.getTileAt(this.gridX, this.gridY);
    
    if (tile === TileType.KEY_RED) {
      this.keys.add(KeyColor.RED);
      map.setTileAt(this.gridX, this.gridY, TileType.FLOOR);
      audioManager.playKeyPickup();
    } else if (tile === TileType.KEY_BLUE) {
      this.keys.add(KeyColor.BLUE);
      map.setTileAt(this.gridX, this.gridY, TileType.FLOOR);
      audioManager.playKeyPickup();
    } else if (tile === TileType.KEY_GOLD) {
      this.keys.add(KeyColor.GOLD);
      map.setTileAt(this.gridX, this.gridY, TileType.FLOOR);
      audioManager.playKeyPickup();
    }
  }

  attack(): { hit: boolean; direction: Position } {
    if (this.attacking || this.attackCooldown > 0) {
      return { hit: false, direction: { x: 0, y: 0 } };
    }

    this.attacking = true;
    this.attackTimer = 200;
    this.attackCooldown = 400;
    audioManager.playAttack();

    return {
      hit: true,
      direction: this.getDirectionVector()
    };
  }

  takeDamage(amount: number): void {
    this.health = Math.max(0, this.health - amount);
    this.hurtFlash = 200;
    this.healthFlash = 500;
    audioManager.playHurt();
  }

  isAtExit(map: GameMap): boolean {
    const exit = map.getExitPos();
    return this.gridX === exit.x && this.gridY === exit.y;
  }

  getPosition(): Position {
    return { x: this.gridX, y: this.gridY };
  }

  getRenderPosition(): Position {
    let x = this.renderX;
    let y = this.renderY;

    if (this.wallBounce > 0) {
      const bounceAmount = Math.sin((50 - this.wallBounce) / 50 * Math.PI) * 6;
      x -= this.bounceDirection.x * bounceAmount;
      y -= this.bounceDirection.y * bounceAmount;
    }

    return { x, y };
  }

  getHealth(): number {
    return this.health;
  }

  getMaxHealth(): number {
    return this.maxHealth;
  }

  getScore(): number {
    return this.score;
  }

  addScore(points: number): void {
    this.score += points;
  }

  getKeys(): KeyColor[] {
    return Array.from(this.keys);
  }

  hasKey(color: KeyColor): boolean {
    return this.keys.has(color);
  }

  getScale(): number {
    return this.scalePulse;
  }

  getWalkFrame(): number {
    return this.moving ? this.walkFrame : 0;
  }

  getDirection(): 'left' | 'right' | 'up' | 'down' {
    return this.direction;
  }

  isHurtFlashing(): boolean {
    return this.hurtFlash > 0;
  }

  isHealthFlashing(): boolean {
    return this.healthFlash > 0;
  }

  isAttacking(): boolean {
    return this.attacking;
  }

  getAttackProgress(): number {
    return this.attacking ? 1 - this.attackTimer / 200 : 0;
  }

  isMoving(): boolean {
    return this.moving;
  }

  reset(spawn: Position): void {
    this.gridX = spawn.x;
    this.gridY = spawn.y;
    this.renderX = spawn.x * TILE_SIZE;
    this.renderY = spawn.y * TILE_SIZE;
    this.targetX = this.renderX;
    this.targetY = this.renderY;
    this.moving = false;
    this.moveProgress = 0;
    this.health = this.maxHealth;
    this.keys.clear();
  }

  heal(amount: number): void {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }
}
