import { v4 as uuidv4 } from 'uuid';
import type {
  Tower,
  Enemy,
  Projectile,
  Particle,
  TowerType,
  EnemyType,
  GameState,
  GamePhase,
  Position,
  LevelConfig
} from './types';
import { TOWER_CONFIGS, ENEMY_CONFIGS, HEX_SIZE } from './types';
import { LevelManager } from './LevelManager';

export interface GameEvents {
  stateChange: (state: GameState) => void;
  towerPlaced: (tower: Tower) => void;
  enemyKilled: (enemy: Enemy) => void;
  waveComplete: (waveNumber: number) => void;
  gameOver: (victory: boolean) => void;
  scoreChanged: (score: number) => void;
}

export class TowerDefenseGame {
  private state: GameState;
  private levelManager: LevelManager;
  private listeners: Map<keyof GameEvents, Set<Function>> = new Map();
  private animationFrameId: number | null = null;
  private lastTime: number = 0;
  private spawnQueue: { type: EnemyType; spawnTime: number }[] = [];
  private waveStartTime: number = 0;
  private isRunning: boolean = false;

  constructor(levelManager: LevelManager) {
    this.levelManager = levelManager;
    this.state = this.createInitialState();
  }

  private createInitialState(): GameState {
    const levelConfig = this.levelManager.getLevelConfig();
    return {
      phase: 'preparing',
      currentWave: 0,
      totalWaves: levelConfig?.totalWaves || 5,
      lives: levelConfig?.startingLives || 10,
      score: levelConfig?.startingScore || 0,
      kills: 0,
      towers: [],
      enemies: [],
      projectiles: [],
      particles: [],
      waveCountdown: 0,
      selectedTowerType: null,
      selectedTower: null
    };
  }

  on<K extends keyof GameEvents>(event: K, callback: GameEvents[K]) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off<K extends keyof GameEvents>(event: K, callback: GameEvents[K]) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  private emit<K extends keyof GameEvents>(event: K, ...args: Parameters<GameEvents[K]>) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(cb => cb(...args));
    }
  }

  getState(): GameState {
    return { ...this.state };
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.gameLoop();
  }

  stop() {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  reset() {
    this.stop();
    this.state = this.createInitialState();
    this.spawnQueue = [];
    this.emit('stateChange', this.state);
  }

  startGame() {
    if (this.state.phase === 'preparing') {
      this.setPhase('waveEnd');
      this.state.waveCountdown = 5;
      this.state.currentWave = 0;
      this.emit('stateChange', this.state);
    }
  }

  private startNextWave() {
    const nextWave = this.state.currentWave + 1;
    if (nextWave > this.state.totalWaves) {
      this.setPhase('victory');
      this.emit('gameOver', true);
      return;
    }

    this.state.currentWave = nextWave;
    this.setPhase('wave');
    this.waveStartTime = performance.now();

    const spawnInfo = this.levelManager.generateEnemySpawnInfo(nextWave);
    this.spawnQueue = spawnInfo.map(info => ({
      type: info.type,
      spawnTime: this.waveStartTime + info.delay
    }));

    this.emit('stateChange', this.state);
  }

  private setPhase(phase: GamePhase) {
    this.state.phase = phase;
    if (phase === 'waveEnd') {
      this.state.waveCountdown = 5;
      this.emit('waveComplete', this.state.currentWave);
    }
  }

  private gameLoop = () => {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    this.update(deltaTime, currentTime);

    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  };

  private update(deltaTime: number, currentTime: number) {
    if (this.state.phase === 'waveEnd') {
      this.state.waveCountdown -= deltaTime;
      if (this.state.waveCountdown <= 0) {
        this.startNextWave();
      }
    }

    if (this.state.phase === 'wave') {
      this.spawnEnemies(currentTime);
      this.updateEnemies(deltaTime);
      this.updateTowers(currentTime);
      this.updateProjectiles(deltaTime);
      this.checkWaveComplete();
    }

    this.updateParticles(deltaTime);
    this.emit('stateChange', this.state);
  }

  private spawnEnemies(currentTime: number) {
    const path = this.levelManager.getPath();
    if (path.length === 0) return;

    const toSpawn = this.spawnQueue.filter(s => s.spawnTime <= currentTime);
    this.spawnQueue = this.spawnQueue.filter(s => s.spawnTime > currentTime);

    toSpawn.forEach(spawn => {
      const config = ENEMY_CONFIGS[spawn.type];
      const startPos = path[0];
      const waveMultiplier = 1 + (this.state.currentWave - 1) * 0.15;

      const enemy: Enemy = {
        id: uuidv4(),
        type: spawn.type,
        x: startPos.x,
        y: startPos.y + (Math.random() - 0.5) * 20,
        health: config.health * waveMultiplier,
        maxHealth: config.health * waveMultiplier,
        speed: config.speed,
        pathIndex: 0,
        pathProgress: 0,
        slowEffect: 0,
        slowDuration: 0
      };

      this.state.enemies.push(enemy);
    });
  }

  private updateEnemies(deltaTime: number) {
    const path = this.levelManager.getPath();
    if (path.length < 2) return;

    const enemiesToRemove: string[] = [];

    for (const enemy of this.state.enemies) {
      if (enemy.slowDuration > 0) {
        enemy.slowDuration -= deltaTime;
        if (enemy.slowDuration <= 0) {
          enemy.slowEffect = 0;
        }
      }

      const effectiveSpeed = enemy.speed * (1 - enemy.slowEffect) * deltaTime * 60;

      let remainingSpeed = effectiveSpeed;

      while (remainingSpeed > 0 && enemy.pathIndex < path.length - 1) {
        const currentTarget = path[enemy.pathIndex + 1];
        const dx = currentTarget.x - enemy.x;
        const dy = currentTarget.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= remainingSpeed) {
          enemy.x = currentTarget.x;
          enemy.y = currentTarget.y;
          enemy.pathIndex++;
          remainingSpeed -= dist;
        } else {
          const ratio = remainingSpeed / dist;
          enemy.x += dx * ratio;
          enemy.y += dy * ratio;
          remainingSpeed = 0;
        }
      }

      if (enemy.pathIndex >= path.length - 1) {
        enemiesToRemove.push(enemy.id);
        this.state.lives--;
        
        if (this.state.lives <= 0) {
          this.state.lives = 0;
          this.setPhase('defeat');
          this.emit('gameOver', false);
        }
      }
    }

    this.state.enemies = this.state.enemies.filter(e => !enemiesToRemove.includes(e.id));
  }

  private updateTowers(currentTime: number) {
    for (const tower of this.state.towers) {
      const config = TOWER_CONFIGS[tower.type];
      const attackInterval = 1000 / config.attackSpeed;

      if (currentTime - tower.lastAttackTime < attackInterval) {
        continue;
      }

      const target = this.findTarget(tower);
      if (target) {
        tower.target = target;
        tower.lastAttackTime = currentTime;
        this.fireTower(tower, target);
      } else {
        tower.target = null;
      }
    }
  }

  private findTarget(tower: Tower): Enemy | null {
    let closestEnemy: Enemy | null = null;
    let closestProgress = -1;

    for (const enemy of this.state.enemies) {
      const dx = enemy.x - tower.x;
      const dy = enemy.y - tower.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= tower.range) {
        const progress = enemy.pathIndex + (enemy.pathProgress / 100);
        if (progress > closestProgress) {
          closestProgress = progress;
          closestEnemy = enemy;
        }
      }
    }

    return closestEnemy;
  }

  private fireTower(tower: Tower, target: Enemy) {
    const config = TOWER_CONFIGS[tower.type];

    this.createAttackParticles(tower);

    if (tower.type === 'laser') {
      this.damageEnemy(target, tower.damage);
    } else {
      const projectile: Projectile = {
        id: uuidv4(),
        x: tower.x,
        y: tower.y,
        startX: tower.x,
        startY: tower.y,
        targetX: target.x,
        targetY: target.y,
        controlX: (tower.x + target.x) / 2 + (Math.random() - 0.5) * 50,
        controlY: Math.min(tower.y, target.y) - 60,
        progress: 0,
        duration: tower.type === 'cannon' ? 0.5 : 0.4,
        damage: tower.damage,
        type: tower.type,
        splashRadius: tower.type === 'cannon' ? 30 : 0,
        slowAmount: tower.type === 'freeze' ? 0.5 : 0,
        slowDuration: tower.type === 'freeze' ? 2 : 0
      };

      this.state.projectiles.push(projectile);
    }
  }

  private createAttackParticles(tower: Tower) {
    const config = TOWER_CONFIGS[tower.type];
    const count = Math.floor(Math.random() * 11) + 10;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 50 + 20;
      const dist = Math.random() * 15;

      const particle: Particle = {
        id: uuidv4(),
        x: tower.x + Math.cos(angle) * dist,
        y: tower.y + Math.sin(angle) * dist,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.3,
        maxLife: 0.3,
        color: config.color,
        size: Math.random() * 3 + 1
      };

      this.state.particles.push(particle);
    }
  }

  private updateProjectiles(deltaTime: number) {
    const projectilesToRemove: string[] = [];

    for (const proj of this.state.projectiles) {
      proj.progress += deltaTime / proj.duration;

      if (proj.progress >= 1) {
        projectilesToRemove.push(proj.id);
        this.handleProjectileImpact(proj);
      } else {
        const t = proj.progress;
        const mt = 1 - t;
        
        proj.x = mt * mt * proj.startX + 2 * mt * t * proj.controlX + t * t * proj.targetX;
        proj.y = mt * mt * proj.startY + 2 * mt * t * proj.controlY + t * t * proj.targetY;
      }
    }

    this.state.projectiles = this.state.projectiles.filter(p => !projectilesToRemove.includes(p.id));
  }

  private handleProjectileImpact(proj: Projectile) {
    if (proj.splashRadius > 0) {
      for (const enemy of this.state.enemies) {
        const dx = enemy.x - proj.targetX;
        const dy = enemy.y - proj.targetY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= proj.splashRadius) {
          const falloff = 1 - (dist / proj.splashRadius) * 0.5;
          this.damageEnemy(enemy, proj.damage * falloff);
        }
      }
      
      this.createExplosionParticles(proj.targetX, proj.targetY, proj.type);
    } else {
      const target = this.state.enemies.find(e => {
        const dx = e.x - proj.targetX;
        const dy = e.y - proj.targetY;
        return Math.sqrt(dx * dx + dy * dy) < 20;
      });

      if (target) {
        this.damageEnemy(target, proj.damage);
        
        if (proj.slowAmount > 0) {
          target.slowEffect = Math.max(target.slowEffect, proj.slowAmount);
          target.slowDuration = Math.max(target.slowDuration, proj.slowDuration);
        }
      }

      this.createHitParticles(proj.targetX, proj.targetY, proj.type);
    }
  }

  private createExplosionParticles(x: number, y: number, type: TowerType) {
    const color = TOWER_CONFIGS[type].color;
    const count = Math.floor(Math.random() * 11) + 15;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 80 + 30;

      const particle: Particle = {
        id: uuidv4(),
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.5,
        maxLife: 0.5,
        color,
        size: Math.random() * 4 + 2
      };

      this.state.particles.push(particle);
    }
  }

  private createHitParticles(x: number, y: number, type: TowerType) {
    const color = TOWER_CONFIGS[type].color;
    const count = Math.floor(Math.random() * 6) + 5;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 40 + 15;

      const particle: Particle = {
        id: uuidv4(),
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.3,
        maxLife: 0.3,
        color,
        size: Math.random() * 2 + 1
      };

      this.state.particles.push(particle);
    }
  }

  private damageEnemy(enemy: Enemy, damage: number) {
    enemy.health -= damage;

    if (enemy.health <= 0) {
      this.killEnemy(enemy);
    }
  }

  private killEnemy(enemy: Enemy) {
    const config = ENEMY_CONFIGS[enemy.type];
    this.state.score += config.score;
    this.state.kills++;
    this.state.enemies = this.state.enemies.filter(e => e.id !== enemy.id);

    this.createDeathParticles(enemy.x, enemy.y, enemy.type);
    this.emit('enemyKilled', enemy);
    this.emit('scoreChanged', this.state.score);
  }

  private createDeathParticles(x: number, y: number, type: EnemyType) {
    const color = ENEMY_CONFIGS[type].color;
    const count = Math.floor(Math.random() * 11) + 10;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 60 + 20;

      const particle: Particle = {
        id: uuidv4(),
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.6,
        maxLife: 0.6,
        color,
        size: Math.random() * 4 + 2
      };

      this.state.particles.push(particle);
    }
  }

  private updateParticles(deltaTime: number) {
    for (const particle of this.state.particles) {
      particle.x += particle.vx * deltaTime;
      particle.y += particle.vy * deltaTime;
      particle.life -= deltaTime;
      particle.vx *= 0.95;
      particle.vy *= 0.95;
    }

    this.state.particles = this.state.particles.filter(p => p.life > 0);
  }

  private checkWaveComplete() {
    if (this.state.phase !== 'wave') return;
    
    if (this.spawnQueue.length === 0 && this.state.enemies.length === 0) {
      if (this.state.currentWave >= this.state.totalWaves) {
        this.setPhase('victory');
        this.emit('gameOver', true);
      } else {
        this.setPhase('waveEnd');
      }
    }
  }

  placeTower(gridX: number, gridY: number, type: TowerType): boolean {
    const config = TOWER_CONFIGS[type];
    if (this.state.score < config.cost) {
      return false;
    }

    const exists = this.state.towers.some(t => t.gridX === gridX && t.gridY === gridY);
    if (exists) {
      return false;
    }

    if (this.levelManager.isOnPath(gridX, gridY, HEX_SIZE)) {
      return false;
    }

    const pos = LevelManager.hexToPixel(gridX, gridY, HEX_SIZE);

    const tower: Tower = {
      id: uuidv4(),
      type,
      gridX,
      gridY,
      x: pos.x,
      y: pos.y,
      level: 1,
      damage: config.damage,
      range: config.range,
      attackSpeed: config.attackSpeed,
      lastAttackTime: 0,
      target: null
    };

    this.state.towers.push(tower);
    this.state.score -= config.cost;

    this.emit('towerPlaced', tower);
    this.emit('stateChange', this.state);

    return true;
  }

  upgradeTower(towerId: string): boolean {
    const tower = this.state.towers.find(t => t.id === towerId);
    if (!tower) return false;

    const config = TOWER_CONFIGS[tower.type];
    if (this.state.score < config.upgradeCost) {
      return false;
    }

    if (tower.level >= 5) {
      return false;
    }

    tower.level++;
    tower.damage *= 1.3;
    tower.range *= 1.1;
    this.state.score -= config.upgradeCost;

    this.emit('stateChange', this.state);
    return true;
  }

  selectTowerType(type: TowerType | null) {
    this.state.selectedTowerType = type;
    this.state.selectedTower = null;
    this.emit('stateChange', this.state);
  }

  selectTower(tower: Tower | null) {
    this.state.selectedTower = tower;
    this.state.selectedTowerType = null;
    this.emit('stateChange', this.state);
  }

  getLevelConfig(): LevelConfig | null {
    return this.levelManager.getLevelConfig();
  }
}
