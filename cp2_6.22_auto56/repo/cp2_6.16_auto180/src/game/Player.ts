import { TrashType, TRASH_SCORES } from './types';

export interface PlayerState {
  x: number;
  y: number;
  speed: number;
  shield: number;
  maxShield: number;
  basketCapacity: number;
  currentItems: TrashType[];
  level: number;
  exp: number;
  moveSpeedLevel: number;
  basketLevel: number;
  shieldLevel: number;
  shieldHitTimer: number;
  stripes: number;
}

const MOVE_SPEED_BASE = 2;
const MOVE_SPEED_PER_LEVEL = 0.5;
const MOVE_SPEED_MAX = 4;

const BASKET_BASE = 8;
const BASKET_PER_LEVEL = 2;
const BASKET_MAX = 20;

const SHIELD_BASE = 100;
const SHIELD_PER_LEVEL = 20;
const SHIELD_MAX = 300;

export class Player {
  state: PlayerState;

  constructor(x: number, y: number) {
    this.state = {
      x,
      y,
      speed: MOVE_SPEED_BASE,
      shield: SHIELD_BASE,
      maxShield: SHIELD_BASE,
      basketCapacity: BASKET_BASE,
      currentItems: [],
      level: 1,
      exp: 0,
      moveSpeedLevel: 0,
      basketLevel: 0,
      shieldLevel: 0,
      shieldHitTimer: 0,
      stripes: 0,
    };
  }

  move(dx: number, dy: number, worldW: number, worldH: number) {
    const s = this.state.speed;
    this.state.x = Math.max(20, Math.min(worldW - 20, this.state.x + dx * s));
    this.state.y = Math.max(20, Math.min(worldH - 20, this.state.y + dy * s));
  }

  canPickup(): boolean {
    return this.state.currentItems.length < this.state.basketCapacity;
  }

  pickup(type: TrashType): number {
    if (!this.canPickup()) return 0;
    this.state.currentItems.push(type);
    const score = TRASH_SCORES[type];
    this.state.exp += score;
    return score;
  }

  depositAll(stationType: TrashType): { correct: TrashType[]; wrong: TrashType[] } {
    const correct: TrashType[] = [];
    const wrong: TrashType[] = [];
    for (const item of this.state.currentItems) {
      if (item === stationType) {
        correct.push(item);
      } else {
        wrong.push(item);
      }
    }
    this.state.currentItems = [];
    return { correct, wrong };
  }

  takeDamage(amount: number) {
    this.state.shield = Math.max(0, this.state.shield - amount);
    this.state.shieldHitTimer = 0.3;
  }

  update(dt: number) {
    if (this.state.shieldHitTimer > 0) {
      this.state.shieldHitTimer = Math.max(0, this.state.shieldHitTimer - dt);
    }
  }

  getUpgradeCost(currentLevel: number): number {
    return 100 + currentLevel * 50;
  }

  upgradeMoveSpeed(): boolean {
    if (this.state.speed >= MOVE_SPEED_MAX) return false;
    this.state.moveSpeedLevel++;
    this.state.speed = Math.min(MOVE_SPEED_MAX, MOVE_SPEED_BASE + this.state.moveSpeedLevel * MOVE_SPEED_PER_LEVEL);
    this.state.stripes = this.state.moveSpeedLevel;
    return true;
  }

  upgradeBasket(): boolean {
    if (this.state.basketCapacity >= BASKET_MAX) return false;
    this.state.basketLevel++;
    this.state.basketCapacity = Math.min(BASKET_MAX, BASKET_BASE + this.state.basketLevel * BASKET_PER_LEVEL);
    return true;
  }

  upgradeShield(): boolean {
    if (this.state.maxShield >= SHIELD_MAX) return false;
    this.state.shieldLevel++;
    this.state.maxShield = Math.min(SHIELD_MAX, SHIELD_BASE + this.state.shieldLevel * SHIELD_PER_LEVEL);
    this.state.shield = this.state.maxShield;
    return true;
  }

  isDead(): boolean {
    return this.state.shield <= 0;
  }
}
