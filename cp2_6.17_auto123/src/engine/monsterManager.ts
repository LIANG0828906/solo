import { v4 as uuidv4 } from 'uuid';
import type { Monster, MonsterType, MonsterDef, WaveConfig, Cell, BurnEffect } from '../types';

export const MONSTER_DEFS: Record<MonsterType, MonsterDef> = {
  normal: {
    type: 'normal',
    color: '#8B4513',
    hp: 80,
    speed: 1,
    defense: 0,
    goldReward: 15,
    size: 16,
  },
  elite: {
    type: 'elite',
    color: '#800020',
    hp: 150,
    speed: 0.8,
    defense: 0.1,
    goldReward: 30,
    size: 16,
  },
  boss: {
    type: 'boss',
    color: '#4B0082',
    hp: 400,
    speed: 0.6,
    defense: 0.2,
    goldReward: 100,
    size: 16,
  },
};

export class MonsterManager {
  private monsters: Map<string, Monster> = new Map();
  private spawnQueue: MonsterType[] = [];
  private spawnTimer: number = 0;
  private spawnInterval: number = 0.8;
  private path: Cell[] = [];
  private hpMultiplier: number = 1;

  setPath(path: Cell[]): void {
    this.path = path;
  }

  setHpMultiplier(multiplier: number): void {
    this.hpMultiplier = multiplier;
  }

  prepareWave(config: WaveConfig): void {
    this.spawnQueue = [];
    this.spawnTimer = 0;
    this.spawnInterval = config.spawnInterval;

    const { totalMonsters, eliteRatio, hasBoss } = config;

    for (let i = 0; i < totalMonsters; i++) {
      const isElite = Math.random() < eliteRatio;
      this.spawnQueue.push(isElite ? 'elite' : 'normal');
    }

    if (hasBoss) {
      this.spawnQueue.push('boss');
    }
  }

  update(deltaTime: number): { spawned: Monster[]; goldEarned: number; livesLost: number } {
    const spawned: Monster[] = [];
    let goldEarned = 0;
    let livesLost = 0;

    if (this.spawnQueue.length > 0) {
      this.spawnTimer += deltaTime;
      if (this.spawnTimer >= this.spawnInterval) {
        this.spawnTimer = 0;
        const type = this.spawnQueue.shift()!;
        const monster = this.createMonster(type);
        if (monster) {
          spawned.push(monster);
        }
      }
    }

    for (const monster of this.monsters.values()) {
      if (monster.burnEffect) {
        monster.burnEffect.remainingTime -= deltaTime;
        const burnDamage = monster.burnEffect.damage * deltaTime;
        monster.hp -= burnDamage * (1 - monster.defense);
        if (monster.burnEffect.remainingTime <= 0) {
          monster.burnEffect = null;
        }
      }

      this.moveMonster(monster, deltaTime);

      if (this.reachedEnd(monster)) {
        livesLost += 1;
        this.removeMonster(monster.id);
      } else if (monster.hp <= 0) {
        goldEarned += monster.goldReward;
        this.removeMonster(monster.id);
      }
    }

    return { spawned, goldEarned, livesLost };
  }

  private createMonster(type: MonsterType): Monster | null {
    if (this.path.length === 0) return null;

    const def = MONSTER_DEFS[type];
    const startCell = this.path[0];
    const hp = def.hp * this.hpMultiplier;

    const monster: Monster = {
      id: uuidv4(),
      type: def.type,
      hp,
      maxHp: hp,
      speed: def.speed,
      defense: def.defense,
      goldReward: def.goldReward,
      color: def.color,
      size: def.size,
      pathIndex: 0,
      progress: 0,
      x: startCell.x,
      y: startCell.y,
      burnEffect: null,
    };

    this.monsters.set(monster.id, monster);
    return monster;
  }

  private moveMonster(monster: Monster, deltaTime: number): void {
    if (monster.pathIndex >= this.path.length - 1) return;

    monster.progress += monster.speed * deltaTime;

    while (monster.progress >= 1 && monster.pathIndex < this.path.length - 1) {
      monster.progress -= 1;
      monster.pathIndex += 1;
    }

    if (monster.pathIndex >= this.path.length - 1) {
      const lastCell = this.path[this.path.length - 1];
      monster.x = lastCell.x;
      monster.y = lastCell.y;
      monster.progress = 0;
      return;
    }

    const current = this.path[monster.pathIndex];
    const next = this.path[monster.pathIndex + 1];
    monster.x = current.x + (next.x - current.x) * monster.progress;
    monster.y = current.y + (next.y - current.y) * monster.progress;
  }

  private reachedEnd(monster: Monster): boolean {
    return monster.pathIndex >= this.path.length - 1 && monster.progress >= 1;
  }

  applyDamage(monsterId: string, damage: number, burnEffect?: BurnEffect): void {
    const monster = this.monsters.get(monsterId);
    if (!monster) return;

    const actualDamage = damage * (1 - monster.defense);
    monster.hp -= actualDamage;

    if (burnEffect) {
      monster.burnEffect = { ...burnEffect };
    }
  }

  getMonster(monsterId: string): Monster | undefined {
    return this.monsters.get(monsterId);
  }

  getAllMonsters(): Monster[] {
    return Array.from(this.monsters.values());
  }

  getActiveCount(): number {
    return this.monsters.size;
  }

  getQueueCount(): number {
    return this.spawnQueue.length;
  }

  isWaveComplete(): boolean {
    return this.spawnQueue.length === 0 && this.monsters.size === 0;
  }

  private removeMonster(monsterId: string): void {
    this.monsters.delete(monsterId);
  }

  clearAll(): void {
    this.monsters.clear();
    this.spawnQueue = [];
    this.spawnTimer = 0;
  }
}
