export type EnemyType = 'skeleton' | 'fire_elemental' | 'ice_elemental' | 'shadow';

export interface Enemy {
  id: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  displayHp: number;
  speed: number;
  type: EnemyType;
  size: number;
  hitFlashTimer: number;
  hitFlashCount: number;
  knockbackX: number;
  knockbackTimer: number;
  alive: boolean;
  deathAnimation: number;
  bobOffset: number;
  bobSpeed: number;
}

export interface DamageEvent {
  enemyId: number;
  damage: number;
  color: string;
  x: number;
  y: number;
}

export interface DeathEvent {
  enemy: Enemy;
  scoreReward: number;
}

export interface EnemyEvents {
  onDeath?: (event: DeathEvent) => void;
  onDamage?: (event: DamageEvent) => void;
}

interface EnemyConfig {
  baseHp: number;
  baseSpeed: number;
  size: number;
  scoreReward: number;
}

const ENEMY_CONFIGS: Record<EnemyType, EnemyConfig> = {
  skeleton: {
    baseHp: 60,
    baseSpeed: 45,
    size: 32,
    scoreReward: 10,
  },
  fire_elemental: {
    baseHp: 40,
    baseSpeed: 75,
    size: 28,
    scoreReward: 15,
  },
  ice_elemental: {
    baseHp: 100,
    baseSpeed: 28,
    size: 36,
    scoreReward: 20,
  },
  shadow: {
    baseHp: 70,
    baseSpeed: 50,
    size: 30,
    scoreReward: 30,
  },
};

const HP_DISPLAY_TRANSITION_MS = 200;
const HIT_FLASH_DURATION_MS = 100;
const HIT_FLASH_TOTAL_TIMES = 2;
const KNOCKBACK_DURATION_MS = 200;
const DEATH_ANIMATION_DURATION_MS = 500;

export class EnemyManager {
  private enemies: Enemy[] = [];
  private nextId: number = 1;
  private spawnTimer: number = 0;
  private spawnInterval: number = 3000;
  private canvasWidth: number;
  private canvasHeight: number;
  private events: EnemyEvents;

  constructor(canvasWidth: number, canvasHeight: number, events?: EnemyEvents) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.events = events ?? {};
    this.scheduleNextSpawn();
  }

  update(deltaTime: number, now: number): void {
    this.spawnTimer -= deltaTime;
    if (this.spawnTimer <= 0) {
      this.spawnEnemy();
      this.scheduleNextSpawn();
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];

      if (enemy.alive) {
        enemy.x += enemy.speed * deltaTime;

        if (enemy.knockbackTimer > 0) {
          const knockbackProgress = 1 - enemy.knockbackTimer / KNOCKBACK_DURATION_MS;
          const easeOut = 1 - Math.pow(1 - knockbackProgress, 2);
          enemy.x += enemy.knockbackX * (1 - easeOut) * deltaTime * 0.01;
          enemy.knockbackTimer -= deltaTime;
        }

        if (enemy.hitFlashTimer > 0) {
          const prev = enemy.hitFlashTimer;
          enemy.hitFlashTimer -= deltaTime;
          if (prev > 0 && enemy.hitFlashTimer <= 0 && enemy.hitFlashCount > 1) {
            enemy.hitFlashCount--;
            enemy.hitFlashTimer = HIT_FLASH_DURATION_MS;
          }
        }

        if (enemy.displayHp !== enemy.hp) {
          const diff = enemy.hp - enemy.displayHp;
          const step = (diff / HP_DISPLAY_TRANSITION_MS) * deltaTime;
          if (Math.abs(step) >= Math.abs(diff)) {
            enemy.displayHp = enemy.hp;
          } else {
            enemy.displayHp += step;
          }
        }

        enemy.bobOffset = Math.sin(now * 0.003 * enemy.bobSpeed) * 4;

        if (enemy.x - enemy.size > this.canvasWidth) {
          enemy.alive = false;
          enemy.deathAnimation = 0.001;
        }
      } else {
        enemy.deathAnimation += deltaTime / DEATH_ANIMATION_DURATION_MS;
      }

      if (enemy.deathAnimation >= 1) {
        this.enemies.splice(i, 1);
      }
    }
  }

  spawnEnemy(): void {
    const types: EnemyType[] = ['skeleton', 'fire_elemental', 'ice_elemental', 'shadow'];
    const type = types[Math.floor(Math.random() * types.length)];
    const config = ENEMY_CONFIGS[type];

    const difficultyFactor = 1;
    const hp = Math.round(config.baseHp * difficultyFactor);
    const speed = config.baseSpeed * (0.9 + Math.random() * 0.2);

    const marginY = 80;
    const y = marginY + Math.random() * (this.canvasHeight - marginY * 2);

    const enemy: Enemy = {
      id: this.nextId++,
      x: -config.size,
      y,
      hp,
      maxHp: hp,
      displayHp: hp,
      speed,
      type,
      size: config.size,
      hitFlashTimer: 0,
      hitFlashCount: 0,
      knockbackX: 0,
      knockbackTimer: 0,
      alive: true,
      deathAnimation: 0,
      bobOffset: 0,
      bobSpeed: 0.8 + Math.random() * 0.6,
    };

    this.enemies.push(enemy);
  }

  dealDamage(
    enemyId: number,
    damage: number,
    spellColor: string,
    knockbackForce: number
  ): boolean {
    const enemy = this.enemies.find((e) => e.id === enemyId);
    if (!enemy || !enemy.alive) {
      return false;
    }

    enemy.hp -= damage;
    enemy.hitFlashTimer = HIT_FLASH_DURATION_MS;
    enemy.hitFlashCount = HIT_FLASH_TOTAL_TIMES;
    enemy.knockbackX = -knockbackForce;
    enemy.knockbackTimer = KNOCKBACK_DURATION_MS;

    if (this.events.onDamage) {
      this.events.onDamage({
        enemyId,
        damage,
        color: spellColor,
        x: enemy.x,
        y: enemy.y,
      });
    }

    if (enemy.hp <= 0) {
      this.killEnemy(enemy);
    }

    return true;
  }

  killEnemy(enemy: Enemy): void {
    if (!enemy.alive) {
      return;
    }

    enemy.alive = false;
    enemy.deathAnimation = 0.001;

    const config = ENEMY_CONFIGS[enemy.type];
    if (this.events.onDeath) {
      this.events.onDeath({
        enemy,
        scoreReward: config.scoreReward,
      });
    }
  }

  getEnemies(): Enemy[] {
    return this.enemies;
  }

  hitTestSpellImpact(
    impactX: number,
    impactY: number,
    radius: number,
    damage: number,
    spellColor: string
  ): Enemy[] {
    const hitEnemies: Enemy[] = [];
    const radiusSq = radius * radius;
    const knockbackForce = radius * 0.8;

    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;

      const dx = enemy.x - impactX;
      const dy = enemy.y - impactY;
      const distSq = dx * dx + dy * dy;
      const hitRadius = radius + enemy.size * 0.5;

      if (distSq <= hitRadius * hitRadius) {
        hitEnemies.push(enemy);
      }
    }

    for (const enemy of hitEnemies) {
      this.dealDamage(enemy.id, damage, spellColor, knockbackForce);
    }

    return hitEnemies;
  }

  resize(width: number, height: number): void {
    this.canvasWidth = width;
    this.canvasHeight = height;
  }

  private scheduleNextSpawn(): void {
    this.spawnInterval = 2500 + Math.random() * 1500;
    this.spawnTimer = this.spawnInterval;
  }
}
