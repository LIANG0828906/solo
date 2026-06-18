import { MonsterType, Position } from './types';

export interface WaveMonster {
  type: MonsterType;
  delay: number;
}

export class WaveManager {
  private spawnQueue: WaveMonster[] = [];
  private spawnTimer: number = 0;
  private isSpawning: boolean = false;

  public getMonsterStats(type: MonsterType) {
    switch (type) {
      case 'skeleton':
        return {
          hp: 50,
          speed: 2,
          goldDrop: 5,
          immuneToPhysical: false,
        };
      case 'golem':
        return {
          hp: 200,
          speed: 0.8,
          goldDrop: 15,
          immuneToPhysical: false,
        };
      case 'ghost':
        return {
          hp: 30,
          speed: 3,
          goldDrop: 10,
          immuneToPhysical: true,
        };
    }
  }

  public getMonsterCount(wave: number): number {
    return Math.min(8 + Math.floor((wave - 1) * 2.5), 30);
  }

  public generateWave(wave: number): WaveMonster[] {
    const monsters: WaveMonster[] = [];
    const count = this.getMonsterCount(wave);
    let delay = 0;

    for (let i = 0; i < count; i++) {
      let type: MonsterType;
      const rand = Math.random();

      if (wave <= 2) {
        type = 'skeleton';
      } else if (wave <= 4) {
        type = rand < 0.7 ? 'skeleton' : 'ghost';
      } else if (wave <= 6) {
        if (rand < 0.5) type = 'skeleton';
        else if (rand < 0.8) type = 'ghost';
        else type = 'golem';
      } else {
        if (rand < 0.35) type = 'skeleton';
        else if (rand < 0.65) type = 'ghost';
        else type = 'golem';
      }

      monsters.push({ type, delay });
      delay += 800 + Math.random() * 400;
    }

    return monsters;
  }

  public startWave(wave: number): void {
    this.spawnQueue = this.generateWave(wave);
    this.spawnTimer = 0;
    this.isSpawning = true;
  }

  public update(
    deltaTime: number,
    spawnCallback: (type: MonsterType, startPos: Position) => void,
    startPos: Position
  ): boolean {
    if (!this.isSpawning || this.spawnQueue.length === 0) {
      return false;
    }

    this.spawnTimer += deltaTime;

    while (this.spawnQueue.length > 0 && this.spawnTimer >= this.spawnQueue[0].delay) {
      const monster = this.spawnQueue.shift()!;
      spawnCallback(monster.type, startPos);
    }

    if (this.spawnQueue.length === 0) {
      this.isSpawning = false;
    }

    return this.isSpawning;
  }

  public isWaveComplete(): boolean {
    return !this.isSpawning && this.spawnQueue.length === 0;
  }

  public reset(): void {
    this.spawnQueue = [];
    this.spawnTimer = 0;
    this.isSpawning = false;
  }
}
