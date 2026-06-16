import { eventBus } from './eventBus';
import { PlayerModule, PowerupType } from './player';
import { v4 as uuidv4 } from 'uuid';

export type ObstacleKind = 'laser_grid' | 'drone' | 'energy_wall';
export type ItemKind = ObstacleKind | PowerupType;

export interface WorldItem {
  id: string;
  kind: ItemKind;
  lane: number;
  z: number;
  length: number;
  height: number;
  isPowerup: boolean;
  fadeOut: boolean;
  fadeTimer: number;
  collected: boolean;
  passed: boolean;
}

interface ObstacleTemplate {
  kind: ObstacleKind;
  minLength: number;
  maxLength: number;
  height: number;
  lanes: 'single' | 'double' | 'triple';
  weight: number;
}

interface PowerupTemplate {
  kind: PowerupType;
  duration: number;
  weight: number;
}

const OBSTACLE_TEMPLATES: ObstacleTemplate[] = [
  { kind: 'laser_grid', minLength: 40, maxLength: 80, height: 60, lanes: 'single', weight: 40 },
  { kind: 'drone', minLength: 50, maxLength: 70, height: 90, lanes: 'single', weight: 30 },
  { kind: 'energy_wall', minLength: 30, maxLength: 60, height: 140, lanes: 'single', weight: 20 },
  { kind: 'laser_grid', minLength: 40, maxLength: 70, height: 60, lanes: 'double', weight: 10 }
];

const POWERUP_TEMPLATES: PowerupTemplate[] = [
  { kind: 'speed', duration: 6, weight: 35 },
  { kind: 'shield', duration: 8, weight: 35 },
  { kind: 'magnet', duration: 10, weight: 30 }
];

const MIN_SPAWN_GAP = 200;
const POWERUP_CHANCE = 0.25;

export class ObstacleModule {
  public items: WorldItem[] = [];
  private player: PlayerModule;
  private laneWidth: number;
  private lastSpawnZ: number = 0;
  private despawnZ: number = -500;
  private spawnZ: number = 2000;
  private distanceTraveled: number = 0;

  constructor(player: PlayerModule, laneWidth: number) {
    this.player = player;
    this.laneWidth = laneWidth;
  }

  reset(): void {
    this.items = [];
    this.lastSpawnZ = 0;
    this.distanceTraveled = 0;
  }

  private weightedRandom<T extends { weight: number }>(templates: T[]): T {
    const total = templates.reduce((s, t) => s + t.weight, 0);
    let r = Math.random() * total;
    for (const t of templates) {
      r -= t.weight;
      if (r <= 0) return t;
    }
    return templates[0];
  }

  private getDifficultyMultiplier(): number {
    const d = this.distanceTraveled / 1000;
    return 1 + d * 0.15;
  }

  private getSpawnInterval(): number {
    const base = 300;
    const min = 150;
    const d = this.distanceTraveled / 5000;
    return Math.max(min, base - d * 60);
  }

  private pickLanes(pattern: 'single' | 'double' | 'triple'): number[] {
    if (pattern === 'triple') return [0, 1, 2];
    if (pattern === 'double') {
      const start = Math.floor(Math.random() * 2);
      return [start, start + 1];
    }
    return [Math.floor(Math.random() * 3)];
  }

  private spawnObstacle(z: number): void {
    const template = this.weightedRandom(OBSTACLE_TEMPLATES);
    const lanes = this.pickLanes(template.lanes);
    const length = template.minLength + Math.random() * (template.maxLength - template.minLength);

    for (const lane of lanes) {
      this.items.push({
        id: uuidv4(),
        kind: template.kind,
        lane,
        z,
        length,
        height: template.height,
        isPowerup: false,
        fadeOut: false,
        fadeTimer: 0,
        collected: false,
        passed: false
      });
    }
  }

  private spawnPowerup(z: number): void {
    const template = this.weightedRandom(POWERUP_TEMPLATES);
    const lane = Math.floor(Math.random() * 3);
    this.items.push({
      id: uuidv4(),
      kind: template.kind,
      lane,
      z,
      length: 40,
      height: 50,
      isPowerup: true,
      fadeOut: false,
      fadeTimer: 0,
      collected: false,
      passed: false
    });
  }

  private trySpawn(): void {
    const nextZ = this.lastSpawnZ + this.getSpawnInterval();
    if (nextZ >= this.spawnZ) return;

    const z = Math.max(this.lastSpawnZ + MIN_SPAWN_GAP, nextZ);

    if (Math.random() < POWERUP_CHANCE) {
      this.spawnPowerup(z);
    } else {
      this.spawnObstacle(z);
    }
    this.lastSpawnZ = z;
  }

  clearAllObstacles(): void {
    for (const item of this.items) {
      if (!item.isPowerup && !item.fadeOut) {
        item.fadeOut = true;
        item.fadeTimer = 0.5;
      }
    }
  }

  update(dt: number): void {
    const speed = this.player.getEffectiveSpeed();
    this.distanceTraveled += speed * dt;

    const playerBox = this.player.getCollisionBox();
    const magnetActive = this.player.hasPowerup('magnet');
    const shieldActive = this.player.hasPowerup('shield');

    for (const item of this.items) {
      item.z -= speed * dt;

      if (item.fadeOut) {
        item.fadeTimer -= dt;
        continue;
      }

      if (!item.collected && !item.passed) {
        const inCollisionRange = item.z < 80 && item.z + item.length > -20;
        if (inCollisionRange) {
          const laneMatch = magnetActive && item.isPowerup
            ? Math.abs(item.lane - playerBox.lane) <= 1
            : item.lane === playerBox.lane;

          if (laneMatch) {
            const verticalOverlap = playerBox.y < item.height;
            if (verticalOverlap) {
              if (item.isPowerup) {
                item.collected = true;
                const tpl = POWERUP_TEMPLATES.find(t => t.kind === item.kind)!;
                this.player.addPowerup(item.kind as PowerupType, tpl.duration);
              } else {
                if (shieldActive) {
                  item.fadeOut = true;
                  item.fadeTimer = 0.3;
                  this.player.state.powerups.delete('shield');
                } else {
                  eventBus.emit('collision', { item });
                  this.player.kill();
                }
              }
            }
          }
        }
      }

      if (item.z + item.length < -20 && !item.passed) {
        item.passed = true;
      }
    }

    this.items = this.items.filter((item) => {
      if (item.fadeOut && item.fadeTimer <= 0) return false;
      if (item.z < this.despawnZ) return false;
      if (item.collected && !item.fadeOut) {
        item.fadeOut = true;
        item.fadeTimer = 0.2;
      }
      return true;
    });

    while (this.lastSpawnZ < this.spawnZ) {
      this.trySpawn();
      if (this.lastSpawnZ < this.spawnZ - 1000) {
        this.lastSpawnZ = this.spawnZ - 800;
      } else {
        break;
      }
    }
  }
}
