import { Hive, Position, Particle } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class HiveManager {
  private hive: Hive;

  constructor(initialHive: Hive) {
    this.hive = { ...initialHive };
  }

  getHive(): Hive {
    return { ...this.hive };
  }

  setHive(hive: Hive): void {
    this.hive = { ...hive };
  }

  update(dt: number): { hive: Hive; particles: Particle[] } {
    const particles: Particle[] = [];

    this.hive.glowPhase += dt * (Math.PI * 2 / 4);

    if (this.hive.upgradeAnimation > 0) {
      this.hive.upgradeAnimation = Math.max(0, this.hive.upgradeAnimation - dt);
      
      for (let i = 0; i < 3; i++) {
        particles.push({
          id: uuidv4(),
          position: { ...this.hive.position },
          velocity: { x: (Math.random() - 0.5) * 60, y: (Math.random() - 0.5) * 60 },
          life: 0.5,
          maxLife: 0.5,
          color: 'rgba(255, 215, 0, 0.8)',
          size: 4 + Math.random() * 4,
        });
      }
    }

    return { hive: { ...this.hive }, particles };
  }

  upgrade(): boolean {
    if (this.hive.level >= this.hive.maxLevel) return false;
    const cost = this.hive.upgradeCosts[this.hive.level - 1];
    if (this.hive.honey < cost) return false;

    this.hive.honey -= cost;
    this.hive.level += 1;
    this.hive.beeSlots += 3;
    this.hive.maxShield += 200;
    this.hive.shield = this.hive.maxShield;
    this.hive.maxHoney += 300;
    this.hive.glowRadius += 20;
    this.hive.upgradeAnimation = 0.8;

    return true;
  }

  addHoney(amount: number): number {
    const actual = Math.min(amount, this.hive.maxHoney - this.hive.honey);
    this.hive.honey += actual;
    return actual;
  }

  consumeHoney(amount: number): boolean {
    if (this.hive.honey < amount) return false;
    this.hive.honey -= amount;
    return true;
  }

  damage(amount: number): { shield: number; destroyed: boolean } {
    this.hive.shield = Math.max(0, this.hive.shield - amount);
    return {
      shield: this.hive.shield,
      destroyed: this.hive.shield <= 0,
    };
  }

  canAffordUpgrade(): boolean {
    if (this.hive.level >= this.hive.maxLevel) return false;
    return this.hive.honey >= this.hive.upgradeCosts[this.hive.level - 1];
  }

  getUpgradeCost(): number {
    if (this.hive.level >= this.hive.maxLevel) return Infinity;
    return this.hive.upgradeCosts[this.hive.level - 1];
  }

  getPosition(): Position {
    return { ...this.hive.position };
  }
}
