import { v4 as uuidv4 } from 'uuid';
import { MonsterData, MonsterType, Vector2, WaveConfig } from './types';
import { eventBus } from './EventBus';

const MONSTER_STATS: Record<MonsterType, {
  health: number;
  speed: number;
  shield: number;
  scale: number;
  reward: number;
}> = {
  normal: { health: 50, speed: 1.5, shield: 0, scale: 0.5, reward: 10 },
  fast: { health: 30, speed: 3, shield: 0, scale: 0.4, reward: 15 },
  tank: { health: 150, speed: 0.8, shield: 0, scale: 0.7, reward: 25 },
  shield: { health: 60, speed: 1.2, shield: 40, scale: 0.55, reward: 20 },
  boss: { health: 500, speed: 0.6, shield: 100, scale: 1.5, reward: 100 },
};

export class MonsterManager {
  private monsters: Map<string, MonsterData> = new Map();
  private pathPoints: Vector2[] = [];
  private spawnQueue: { type: MonsterType; delay: number; spawned: boolean }[] = [];
  private spawnTimer: number = 0;
  private currentWave: number = 0;
  private waves: WaveConfig[] = [];
  private waveInProgress: boolean = false;
  private monstersRemaining: number = 0;
  private waveDelay: number = 0;

  setPath(points: Vector2[]): void {
    this.pathPoints = points;
  }

  setWaves(waves: WaveConfig[]): void {
    this.waves = waves;
  }

  getCurrentWave(): number {
    return this.currentWave;
  }

  getTotalWaves(): number {
    return this.waves.length;
  }

  getMonstersRemaining(): number {
    return this.monstersRemaining + this.spawnQueue.filter((s) => !s.spawned).length;
  }

  isWaveInProgress(): boolean {
    return this.waveInProgress;
  }

  startWave(waveNumber: number): boolean {
    if (waveNumber < 1 || waveNumber > this.waves.length) return false;
    if (this.waveInProgress) return false;

    const wave = this.waves[waveNumber - 1];
    this.currentWave = waveNumber;
    this.waveInProgress = true;
    this.spawnQueue = [];
    this.spawnTimer = 0;
    this.monstersRemaining = 0;

    const waveMultiplier = 1 + (waveNumber - 1) * 0.15;

    for (const monsterGroup of wave.monsters) {
      for (let i = 0; i < monsterGroup.count; i++) {
        this.spawnQueue.push({
          type: monsterGroup.type,
          delay: monsterGroup.delay * i + (this.spawnQueue.length > 0 ? 500 : 0),
          spawned: false,
        });
        this.monstersRemaining++;
      }
    }

    eventBus.emit('wave:start', { waveNumber });

    if (wave.isBoss) {
      eventBus.emit('boss:appear', {});
    }

    return true;
  }

  private spawnMonster(type: MonsterType): MonsterData {
    const stats = MONSTER_STATS[type];
    const waveMultiplier = 1 + (this.currentWave - 1) * 0.15;

    const monster: MonsterData = {
      id: uuidv4(),
      type,
      position: { ...this.pathPoints[0] },
      health: stats.health * waveMultiplier,
      maxHealth: stats.health * waveMultiplier,
      shield: stats.shield * waveMultiplier,
      maxShield: stats.shield * waveMultiplier,
      speed: stats.speed,
      baseSpeed: stats.speed,
      pathIndex: 0,
      pathProgress: 0,
      isSlowed: false,
      slowTimer: 0,
      scale: stats.scale,
    };

    this.monsters.set(monster.id, monster);
    eventBus.emit('monster:spawned', { monster });

    return monster;
  }

  getMonsters(): MonsterData[] {
    return Array.from(this.monsters.values());
  }

  getMonster(id: string): MonsterData | undefined {
    return this.monsters.get(id);
  }

  damageMonster(
    monsterId: string,
    damage: number,
    beamType: 'red' | 'blue' | 'yellow',
    isAmplified: boolean = false
  ): boolean {
    const monster = this.monsters.get(monsterId);
    if (!monster) return false;

    let actualDamage = damage;

    if (monster.shield > 0) {
      if (beamType === 'yellow' || isAmplified) {
        const shieldDamage = actualDamage * 1.5;
        if (monster.shield >= shieldDamage) {
          monster.shield -= shieldDamage;
          actualDamage = 0;
        } else {
          actualDamage -= monster.shield / 1.5;
          monster.shield = 0;
        }
      } else {
        const shieldDamage = actualDamage * 0.3;
        if (monster.shield >= shieldDamage) {
          monster.shield -= shieldDamage;
        } else {
          monster.shield = 0;
        }
        actualDamage *= 0.3;
      }
    }

    if (actualDamage > 0) {
      monster.health -= actualDamage;
    }

    if (beamType === 'blue') {
      monster.isSlowed = true;
      monster.slowTimer = 2;
      monster.speed = monster.baseSpeed * 0.5;
    }

    eventBus.emit('monster:hit', { monsterId, damage: actualDamage, type: beamType });

    if (monster.health <= 0) {
      this.killMonster(monsterId);
      return true;
    }

    return false;
  }

  private killMonster(monsterId: string): void {
    const monster = this.monsters.get(monsterId);
    if (!monster) return;

    const stats = MONSTER_STATS[monster.type];
    const reward = stats.reward;

    eventBus.emit('monster:killed', { monster });
    eventBus.emit('particle:explosion', {
      position: { ...monster.position },
      color: monster.type === 'boss' ? '#ffd700' : '#ff6b6b',
      count: monster.type === 'boss' ? 50 : 20,
    });

    this.monsters.delete(monsterId);
    this.monstersRemaining--;

    if (monster.type === 'boss') {
      eventBus.emit('boss:killed', {});
    }

    if (this.monstersRemaining <= 0 && this.spawnQueue.every((s) => s.spawned)) {
      this.waveInProgress = false;
      eventBus.emit('wave:complete', { waveNumber: this.currentWave });
    }
  }

  update(deltaTime: number, speedMultiplier: number = 1): void {
    const dt = deltaTime * speedMultiplier;

    this.spawnTimer += dt * 1000;
    for (const spawn of this.spawnQueue) {
      if (!spawn.spawned && this.spawnTimer >= spawn.delay) {
        this.spawnMonster(spawn.type);
        spawn.spawned = true;
      }
    }

    for (const monster of this.monsters.values()) {
      if (monster.isSlowed) {
        monster.slowTimer -= dt;
        if (monster.slowTimer <= 0) {
          monster.isSlowed = false;
          monster.speed = monster.baseSpeed;
        }
      }

      this.moveMonster(monster, dt);
    }
  }

  private moveMonster(monster: MonsterData, dt: number): void {
    if (monster.pathIndex >= this.pathPoints.length - 1) {
      this.monsterReachedEnd(monster.id);
      return;
    }

    const currentPoint = this.pathPoints[monster.pathIndex];
    const nextPoint = this.pathPoints[monster.pathIndex + 1];

    const dx = nextPoint.x - currentPoint.x;
    const dy = nextPoint.y - currentPoint.y;
    const segmentLength = Math.sqrt(dx * dx + dy * dy);

    const moveDistance = monster.speed * dt;
    monster.pathProgress += moveDistance / segmentLength;

    while (monster.pathProgress >= 1 && monster.pathIndex < this.pathPoints.length - 1) {
      monster.pathProgress -= 1;
      monster.pathIndex++;

      if (monster.pathIndex >= this.pathPoints.length - 1) {
        this.monsterReachedEnd(monster.id);
        return;
      }
    }

    if (monster.pathIndex < this.pathPoints.length - 1) {
      const curr = this.pathPoints[monster.pathIndex];
      const next = this.pathPoints[monster.pathIndex + 1];

      monster.position.x = curr.x + (next.x - curr.x) * monster.pathProgress;
      monster.position.y = curr.y + (next.y - curr.y) * monster.pathProgress;
    }
  }

  private monsterReachedEnd(monsterId: string): void {
    const monster = this.monsters.get(monsterId);
    if (!monster) return;

    eventBus.emit('monster:reachedEnd', { monster });
    this.monsters.delete(monsterId);
    this.monstersRemaining--;

    if (this.monstersRemaining <= 0 && this.spawnQueue.every((s) => s.spawned)) {
      this.waveInProgress = false;
      eventBus.emit('wave:complete', { waveNumber: this.currentWave });
    }
  }

  clear(): void {
    this.monsters.clear();
    this.spawnQueue = [];
    this.waveInProgress = false;
    this.currentWave = 0;
    this.monstersRemaining = 0;
  }
}

export default MonsterManager;
