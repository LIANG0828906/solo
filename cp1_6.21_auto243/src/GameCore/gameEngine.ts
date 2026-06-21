import { EntityManager, InputState, CollisionResult, OrbEntity, EnemyEntity, ParticleEffect } from './entityManager';
import { Renderer } from '../Renderer/renderer';

export interface UpgradeInfo {
  id: string;
  name: string;
  description: string;
  cost: number;
  purchased: boolean;
  canAfford: boolean;
}

export interface GameState {
  score: number;
  hp: number;
  maxHp: number;
  evolutionPoints: number;
  orbsEaten: number;
  enemiesKilled: number;
  survivalTime: number;
  gameOver: boolean;
  redFlash: boolean;
  spinAttackUnlocked: boolean;
  spinAttackCooldown: number;
  spinAttackMaxCooldown: number;
  upgrades: UpgradeInfo[];
}

interface UpgradeDef {
  id: string;
  name: string;
  description: string;
  cost: number;
  apply: (em: EntityManager) => void;
}

const UPGRADE_DEFS: UpgradeDef[] = [
  {
    id: 'speed',
    name: '加速突变',
    description: '移动速度增加10%',
    cost: 3,
    apply: (em) => { em.player.speed *= 1.1; },
  },
  {
    id: 'hp',
    name: '细胞强化',
    description: '生命上限+1',
    cost: 5,
    apply: (em) => { em.player.maxHp += 1; em.player.hp += 1; },
  },
  {
    id: 'spawn_rate',
    name: '吞噬加速',
    description: '球体生成间隔缩短0.5秒',
    cost: 4,
    apply: () => {},
  },
  {
    id: 'spin_attack',
    name: '旋转攻击',
    description: '按空格键释放冲击波（冷却8秒）',
    cost: 10,
    apply: (em) => { em.player.spinAttackUnlocked = true; },
  },
  {
    id: 'size_up',
    name: '体型进化',
    description: '体型增大至30px',
    cost: 15,
    apply: (em) => { em.player.radius = 30; },
  },
];

export class GameEngine {
  private entityManager: EntityManager;
  private renderer: Renderer;
  private inputState: InputState;
  private lastTime: number = 0;
  private running: boolean = false;
  private animationFrameId: number = 0;
  private orbSpawnTimer: number = 0;
  private orbSpawnInterval: number = 2.0;
  private enemySpawnTimer: number = 0;
  private enemySpawnInterval: number = 5.0;
  private survivalTime: number = 0;
  private purchasedUpgrades: Set<string> = new Set();
  private redFlashTimer: number = 0;
  private gameOver: boolean = false;
  private stateListeners: Array<(state: GameState) => void> = [];
  private stateNotifyTimer: number = 0;
  private lastNotifiedState: string = '';
  private gameTime: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.entityManager = new EntityManager();
    this.renderer = new Renderer(canvas);
    this.inputState = { up: false, down: false, left: false, right: false, space: false };
    this.setupInput();
  }

  private setupInput(): void {
    const keyHandler = (e: KeyboardEvent, pressed: boolean) => {
      switch (e.code) {
        case 'ArrowUp': case 'KeyW': this.inputState.up = pressed; break;
        case 'ArrowDown': case 'KeyS': this.inputState.down = pressed; break;
        case 'ArrowLeft': case 'KeyA': this.inputState.left = pressed; break;
        case 'ArrowRight': case 'KeyD': this.inputState.right = pressed; break;
        case 'Space':
          this.inputState.space = pressed;
          if (pressed) this.handleSpinAttack();
          break;
      }
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', (e) => keyHandler(e, true));
    window.addEventListener('keyup', (e) => keyHandler(e, false));
  }

  private handleSpinAttack(): void {
    const p = this.entityManager.player;
    if (!p.spinAttackUnlocked || p.spinAttackCooldown > 0 || this.gameOver) return;
    p.spinAttackCooldown = 8;

    const hitIds = this.entityManager.checkSpinAttackHits();
    for (const id of hitIds) {
      const enemy = this.entityManager.enemies.get(id);
      if (enemy) {
        this.entityManager.spawnEnemyDeathParticle(enemy.pos);
        enemy.active = false;
        p.enemiesKilled++;
      }
    }
    this.entityManager.spawnSpinAttackParticle(p.pos, 80);
  }

  start(): void {
    this.running = true;
    this.lastTime = performance.now();
    this.gameLoop(this.lastTime);
  }

  stop(): void {
    this.running = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  reset(): void {
    this.entityManager.reset();
    this.orbSpawnTimer = 0;
    this.orbSpawnInterval = 2.0;
    this.enemySpawnTimer = 0;
    this.survivalTime = 0;
    this.purchasedUpgrades.clear();
    this.redFlashTimer = 0;
    this.gameOver = false;
    this.gameTime = 0;
    this.inputState = { up: false, down: false, left: false, right: false, space: false };
    this.lastTime = performance.now();
    this.running = true;
    this.gameLoop(this.lastTime);
  }

  subscribe(callback: (state: GameState) => void): () => void {
    this.stateListeners.push(callback);
    return () => {
      const idx = this.stateListeners.indexOf(callback);
      if (idx >= 0) this.stateListeners.splice(idx, 1);
    };
  }

  getState(): GameState {
    const p = this.entityManager.player;
    return {
      score: p.evolutionPoints * 10,
      hp: p.hp,
      maxHp: p.maxHp,
      evolutionPoints: p.evolutionPoints,
      orbsEaten: p.orbsEaten,
      enemiesKilled: p.enemiesKilled,
      survivalTime: Math.floor(this.survivalTime),
      gameOver: this.gameOver,
      redFlash: this.redFlashTimer > 0,
      spinAttackUnlocked: p.spinAttackUnlocked,
      spinAttackCooldown: p.spinAttackCooldown,
      spinAttackMaxCooldown: 8,
      upgrades: UPGRADE_DEFS.map((def) => ({
        id: def.id,
        name: def.name,
        description: def.description,
        cost: def.cost,
        purchased: this.purchasedUpgrades.has(def.id),
        canAfford: p.evolutionPoints >= def.cost && !this.purchasedUpgrades.has(def.id),
      })),
    };
  }

  purchaseUpgrade(id: string): void {
    if (this.gameOver) return;
    const def = UPGRADE_DEFS.find((d) => d.id === id);
    if (!def) return;
    if (this.purchasedUpgrades.has(id)) return;
    const p = this.entityManager.player;
    if (p.evolutionPoints < def.cost) return;

    p.evolutionPoints -= def.cost;
    this.purchasedUpgrades.add(id);
    def.apply(this.entityManager);

    if (id === 'spawn_rate') {
      this.orbSpawnInterval = Math.max(0.5, this.orbSpawnInterval - 0.5);
    }

    this.notifyStateChange();
  }

  private gameLoop(timestamp: number): void {
    if (!this.running) return;

    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05);
    this.lastTime = timestamp;
    this.gameTime += dt;

    if (!this.gameOver) {
      this.update(dt);
    }

    this.render();
    this.stateNotifyTimer += dt;
    if (this.stateNotifyTimer >= 1 / 30) {
      this.stateNotifyTimer = 0;
      this.notifyStateChange();
    }

    this.animationFrameId = requestAnimationFrame((t) => this.gameLoop(t));
  }

  private update(dt: number): void {
    this.survivalTime += dt;

    this.entityManager.updatePlayer(this.inputState, dt);

    this.orbSpawnTimer += dt;
    if (this.orbSpawnTimer >= this.orbSpawnInterval) {
      this.orbSpawnTimer -= this.orbSpawnInterval;
      this.entityManager.spawnOrb();
    }

    this.enemySpawnTimer += dt;
    if (this.enemySpawnTimer >= this.enemySpawnInterval) {
      this.enemySpawnTimer -= this.enemySpawnInterval;
      this.entityManager.spawnEnemy();
    }

    this.entityManager.updateEnemies(dt);
    this.entityManager.updateOrbs(this.gameTime);
    this.entityManager.updateParticles(dt);

    const collisions = this.entityManager.checkCollisions();
    for (const collision of collisions) {
      this.processCollision(collision);
    }

    if (this.redFlashTimer > 0) {
      this.redFlashTimer -= dt;
    }

    this.entityManager.removeInactiveEntities();
  }

  private processCollision(collision: CollisionResult): void {
    const p = this.entityManager.player;

    if (collision.type === 'orb') {
      const orb = this.entityManager.orbs.get(collision.entityId);
      if (orb && orb.active && !orb.absorbing) {
        orb.absorbing = true;
        orb.absorbTimer = 0;
        p.evolutionPoints += 1;
        p.orbsEaten += 1;
        this.entityManager.spawnOrbAbsorbParticle(orb.pos, orb.colorPhase);
      }
    }

    if (collision.type === 'enemy') {
      const enemy = this.entityManager.enemies.get(collision.entityId);
      if (enemy && enemy.active && !enemy.dying && p.invincibleTimer <= 0) {
        p.hp -= 1;
        p.invincibleTimer = 1.0;
        this.redFlashTimer = 0.2;
        enemy.dying = true;
        enemy.deathTimer = 0;
        this.entityManager.spawnEnemyDeathParticle(enemy.pos);

        if (p.hp <= 0) {
          p.hp = 0;
          this.gameOver = true;
        }
      }
    }
  }

  private render(): void {
    const orbs: OrbEntity[] = [];
    for (const o of this.entityManager.orbs.values()) {
      if (o.active) orbs.push(o);
    }
    const enemies: EnemyEntity[] = [];
    for (const e of this.entityManager.enemies.values()) {
      if (e.active) enemies.push(e);
    }
    const particles: ParticleEffect[] = [];
    for (const p of this.entityManager.particles.values()) {
      if (p.active) particles.push(p);
    }

    this.renderer.render(
      this.entityManager.player,
      orbs,
      enemies,
      particles,
      this.gameTime,
      this.redFlashTimer > 0,
    );
  }

  private notifyStateChange(): void {
    const state = this.getState();
    const stateKey = JSON.stringify(state);
    if (stateKey !== this.lastNotifiedState) {
      this.lastNotifiedState = stateKey;
      for (const listener of this.stateListeners) {
        listener(state);
      }
    }
  }

  getEntityManager(): EntityManager {
    return this.entityManager;
  }
}
