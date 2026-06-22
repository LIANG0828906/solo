import { CONFIG } from './types';
import type { PlayerState, Position, Direction, DungeonMap } from './types';
import { TileType } from './types';

export class Player {
  state: PlayerState;

  constructor(startPosition: Position) {
    this.state = {
      position: { ...startPosition },
      targetPosition: { ...startPosition },
      health: CONFIG.PLAYER_MAX_HEALTH,
      maxHealth: CONFIG.PLAYER_MAX_HEALTH,
      attack: CONFIG.PLAYER_BASE_ATTACK,
      baseAttack: CONFIG.PLAYER_BASE_ATTACK,
      coins: 0,
      experience: 0,
      kills: 0,
      isMoving: false,
      moveStartTime: 0,
    };
  }

  tryMove(
    direction: Direction,
    dungeon: DungeonMap,
    currentTime: number,
    lastInputTime: number
  ): { moved: boolean; newLastInputTime: number } {
    if (currentTime - lastInputTime < CONFIG.PLAYER_MOVE_COOLDOWN) {
      return { moved: false, newLastInputTime: lastInputTime };
    }

    if (this.state.isMoving) {
      return { moved: false, newLastInputTime: lastInputTime };
    }

    const delta: Position = { x: 0, y: 0 };
    switch (direction) {
      case 'up':
        delta.y = -1;
        break;
      case 'down':
        delta.y = 1;
        break;
      case 'left':
        delta.x = -1;
        break;
      case 'right':
        delta.x = 1;
        break;
    }

    const newX = this.state.position.x + delta.x;
    const newY = this.state.position.y + delta.y;

    if (!this.isValidMove(newX, newY, dungeon)) {
      return { moved: false, newLastInputTime: currentTime };
    }

    this.state.targetPosition = { x: newX, y: newY };
    this.state.isMoving = true;
    this.state.moveStartTime = currentTime;

    return { moved: true, newLastInputTime: currentTime };
  }

  updateMovement(currentTime: number): void {
    if (!this.state.isMoving) return;

    const elapsed = currentTime - this.state.moveStartTime;

    if (elapsed >= CONFIG.MOVE_ANIMATION_DURATION) {
      this.state.position = { ...this.state.targetPosition };
      this.state.isMoving = false;
    }
  }

  getInterpolatedPosition(currentTime: number): Position {
    if (!this.state.isMoving) {
      return { ...this.state.position };
    }

    const elapsed = currentTime - this.state.moveStartTime;
    const progress = Math.min(elapsed / CONFIG.MOVE_ANIMATION_DURATION, 1);
    const easedProgress = this.easeOutQuad(progress);

    return {
      x: this.state.position.x + (this.state.targetPosition.x - this.state.position.x) * easedProgress,
      y: this.state.position.y + (this.state.targetPosition.y - this.state.position.y) * easedProgress,
    };
  }

  takeDamage(damage: number): void {
    this.state.health = Math.max(0, this.state.health - damage);
  }

  heal(amount: number): void {
    this.state.health = Math.min(this.state.maxHealth, this.state.health + amount);
  }

  addCoins(amount: number): void {
    this.state.coins += amount;
  }

  addExperience(amount: number): void {
    this.state.experience += amount;
  }

  addKill(): void {
    this.state.kills += 1;
  }

  increaseAttack(bonus: number): void {
    this.state.attack += bonus;
  }

  isAlive(): boolean {
    return this.state.health > 0;
  }

  private isValidMove(x: number, y: number, dungeon: DungeonMap): boolean {
    if (x < 0 || x >= dungeon.width || y < 0 || y >= dungeon.height) {
      return false;
    }

    const tile = dungeon.tiles[y][x];
    return tile === TileType.FLOOR || tile === TileType.EXIT;
  }

  private easeOutQuad(t: number): number {
    return t * (2 - t);
  }

  reset(position: Position): void {
    this.state = {
      position: { ...position },
      targetPosition: { ...position },
      health: CONFIG.PLAYER_MAX_HEALTH,
      maxHealth: CONFIG.PLAYER_MAX_HEALTH,
      attack: CONFIG.PLAYER_BASE_ATTACK,
      baseAttack: CONFIG.PLAYER_BASE_ATTACK,
      coins: 0,
      experience: 0,
      kills: 0,
      isMoving: false,
      moveStartTime: 0,
    };
  }
}
