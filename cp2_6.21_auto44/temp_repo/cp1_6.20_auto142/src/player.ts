import type { Direction, Position, PlayerState } from './types';
import { GAME_CONFIG } from './constants';

export class Player {
  public state: PlayerState;

  constructor() {
    this.state = {
      position: { ...GAME_CONFIG.startPosition },
      hp: GAME_CONFIG.maxHp,
      maxHp: GAME_CONFIG.maxHp,
      coins: 0,
      direction: 'down',
      slowUntil: 0
    };
  }

  public getPosition(): Position {
    return { ...this.state.position };
  }

  public setPosition(pos: Position): void {
    this.state.position = { ...pos };
  }

  public getDirection(): Direction {
    return this.state.direction;
  }

  public setDirection(dir: Direction): void {
    this.state.direction = dir;
  }

  public getHp(): number {
    return this.state.hp;
  }

  public getMaxHp(): number {
    return this.state.maxHp;
  }

  public takeDamage(amount: number): void {
    this.state.hp = Math.max(0, this.state.hp - amount);
  }

  public heal(amount: number): void {
    this.state.hp = Math.min(this.state.maxHp, this.state.hp + amount);
  }

  public getCoins(): number {
    return this.state.coins;
  }

  public addCoins(amount: number): void {
    this.state.coins += amount;
  }

  public isSlowed(now: number): boolean {
    return now < this.state.slowUntil;
  }

  public applySlow(durationMs: number): void {
    this.state.slowUntil = performance.now() + durationMs;
  }

  public getMoveCooldown(now: number): number {
    const baseCooldown = GAME_CONFIG.moveCooldown;
    return this.isSlowed(now) ? baseCooldown * 2 : baseCooldown;
  }

  public getStatusText(now: number): string {
    if (this.isSlowed(now)) {
      const remaining = Math.ceil((this.state.slowUntil - now) / 1000);
      return `减速中 (${remaining}s)`;
    }
    if (this.state.hp <= 0) {
      return '已死亡';
    }
    return '正常';
  }

  public isAlive(): boolean {
    return this.state.hp > 0;
  }
}
