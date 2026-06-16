import { BeeManager } from './BeeManager';
import { HiveManager } from './HiveManager';
import { EnemyManager } from './EnemyManager';
import { GameState, Hive, Bee, Flower, Enemy, Particle, BeeType, Position, GamePhase } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class GameEngine {
  private beeManager: BeeManager;
  private hiveManager: HiveManager;
  private enemyManager: EnemyManager;
  
  private phase: GamePhase = 'menu';
  private wave: number = 0;
  private waveTimer: number = 30;
  private waveInterval: number = 30;
  private particles: Particle[] = [];
  private flowers: Flower[] = [];
  private discoveredAreas: Set<string> = new Set();
  private mapSize: { width: number; height: number } = { width: 1200, height: 600 };
  
  private lastFrameTime: number = 0;
  private fps: number = 60;
  private frameCount: number = 0;
  private fpsTimer: number = 0;
  
  private animationFrameId: number | null = null;
  private onStateChange: ((state: GameState) => void) | null = null;

  constructor(initialHive: Hive) {
    this.beeManager = new BeeManager();
    this.hiveManager = new HiveManager(initialHive);
    this.enemyManager = new EnemyManager();
    
    this.enemyManager.setHivePosition(initialHive.position);
    this.beeManager.setHive(initialHive);
  }

  setOnStateChange(callback: (state: GameState) => void): void {
    this.onStateChange = callback;
  }

  startGame(): void {
    this.phase = 'playing';
    this.wave = 0;
    this.waveTimer = 30;
    this.waveInterval = 30;
    this.particles = [];
    this.discoveredAreas = new Set([
      '5,7', '6,7', '5,6', '4,7', '5,8',
      '6,6', '4,8', '6,8', '4,6'
    ]);
    
    this.flowers = this.generateFlowers();
    this.beeManager.setBees([]);
    this.enemyManager.setEnemies([]);
    
    this.notifyStateChange();
  }

  resetGame(): void {
    const initialHive: Hive = {
      position: { x: 200, y: 300 },
      level: 1,
      maxLevel: 5,
      honey: 50,
      maxHoney: 500,
      shield: 500,
      maxShield: 500,
      beeSlots: 5,
      usedBeeSlots: 0,
      defenseTowers: 0,
      upgradeCosts: [100, 250, 500, 1000, 2000],
      glowRadius: 60,
      glowPhase: 0,
      upgradeAnimation: 0,
    };
    
    this.hiveManager = new HiveManager(initialHive);
    this.enemyManager.setHivePosition(initialHive.position);
    this.beeManager.setHive(initialHive);
    
    this.startGame();
  }

  pauseGame(): void {
    if (this.phase === 'playing') {
      this.phase = 'paused';
      this.notifyStateChange();
    }
  }

  resumeGame(): void {
    if (this.phase === 'paused') {
      this.phase = 'playing';
      this.lastFrameTime = performance.now();
      this.notifyStateChange();
    }
  }

  setPhase(phase: GamePhase): void {
    this.phase = phase;
    this.notifyStateChange();
  }

  start(): void {
    this.lastFrameTime = performance.now();
    this.gameLoop();
  }

  stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private gameLoop = (): void => {
    const currentTime = performance.now();
    const dt = Math.min((currentTime - this.lastFrameTime) / 1000, 0.1);
    this.lastFrameTime = currentTime;

    this.frameCount++;
    this.fpsTimer += dt;
    if (this.fpsTimer >= 1) {
      this.fps = Math.round(this.frameCount / this.fpsTimer);
      this.frameCount = 0;
      this.fpsTimer = 0;
    }

    if (this.phase === 'playing') {
      this.update(dt);
    }

    this.notifyStateChange();

    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  };

  private update(dt: number): void {
    this.waveTimer -= dt;
    if (this.waveTimer <= 0) {
      this.spawnNextWave();
    }

    const beeResult = this.beeManager.update(dt);
    
    this.flowers = beeResult.flowers;
    
    beeResult.damageToEnemies.forEach(({ enemyId, damage }) => {
      this.enemyManager.damageEnemy(enemyId, damage);
    });

    beeResult.discoveredAreas.forEach((area) => {
      this.discoveredAreas.add(area);
    });

    const hive = this.hiveManager.getHive();
    if (beeResult.honeyGained > 0) {
      this.hiveManager.addHoney(beeResult.honeyGained);
    }

    const hiveResult = this.hiveManager.update(dt);
    
    const enemyResult = this.enemyManager.update(dt, hiveResult.hive);
    
    if (enemyResult.hiveDamage > 0) {
      const damageResult = this.hiveManager.damage(enemyResult.hiveDamage);
      if (damageResult.destroyed) {
        this.phase = 'gameover';
      }
    }

    const allParticles = [
      ...beeResult.particles,
      ...hiveResult.particles,
      ...enemyResult.particles,
      ...this.particles.filter((p) => p.life > 0),
    ];

    this.particles = allParticles
      .map((p) => ({
        ...p,
        position: {
          x: p.position.x + p.velocity.x * dt,
          y: p.position.y + p.velocity.y * dt,
        },
        life: p.life - dt,
      }))
      .filter((p) => p.life > 0);

    this.beeManager.setFlowers(this.flowers);
    this.beeManager.setEnemies(this.enemyManager.getEnemies());
    this.beeManager.setHive(this.hiveManager.getHive());
  }

  private spawnNextWave(): void {
    this.wave++;
    
    if (this.wave <= 3) {
      this.waveInterval = 30;
    } else {
      this.waveInterval = Math.max(10, 30 - (this.wave - 3) * 2);
    }
    
    this.waveTimer = this.waveInterval;
    this.enemyManager.spawnWave(this.wave);
  }

  private generateFlowers(): Flower[] {
    const flowers: Flower[] = [];
    const colors = ['#FF4500', '#FFD700', '#FF69B4', '#BA55D3'];
    
    for (let i = 0; i < 15; i++) {
      flowers.push({
        id: uuidv4(),
        position: {
          x: 400 + Math.random() * (this.mapSize.width - 500),
          y: 80 + Math.random() * (this.mapSize.height - 160),
        },
        honeyAmount: 50 + Math.floor(Math.random() * 100),
        maxHoney: 100 + Math.floor(Math.random() * 50),
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2,
        discovered: false,
      });
    }
    
    return flowers;
  }

  dispatchBee(type: BeeType, target: Position): boolean {
    const hive = this.hiveManager.getHive();
    const result = this.beeManager.dispatchBee(type, target, hive, hive.beeSlots);
    
    if (result.success && result.cost > 0) {
      this.hiveManager.consumeHoney(result.cost);
    }
    
    this.notifyStateChange();
    return result.success;
  }

  upgradeHive(): boolean {
    const success = this.hiveManager.upgrade();
    if (success) {
      const hive = this.hiveManager.getHive();
      this.beeManager.setHive(hive);
      this.enemyManager.setHivePosition(hive.position);
    }
    this.notifyStateChange();
    return success;
  }

  setMapSize(width: number, height: number): void {
    this.mapSize = { width, height };
    this.beeManager.setMapSize(width, height);
    this.enemyManager.setMapSize(width, height);
  }

  getState(): GameState {
    const hive = this.hiveManager.getHive();
    return {
      phase: this.phase,
      wave: this.wave,
      waveTimer: this.waveTimer,
      waveInterval: this.waveInterval,
      hive,
      bees: this.beeManager.getBees(),
      flowers: this.flowers,
      enemies: this.enemyManager.getEnemies(),
      particles: this.particles,
      selectedBeeType: null,
      hoveredEntityId: null,
      hoveredEntityType: null,
      mousePosition: { x: 0, y: 0 },
      cameraZoom: 1,
      cameraOffset: { x: 0, y: 0 },
      mapSize: this.mapSize,
      discoveredAreas: new Set(this.discoveredAreas),
      lastFrameTime: this.lastFrameTime,
      fps: this.fps,
    };
  }

  private notifyStateChange(): void {
    if (this.onStateChange) {
      this.onStateChange(this.getState());
    }
  }

  addParticle(particle: Particle): void {
    this.particles.push(particle);
  }

  getHive(): Hive {
    return this.hiveManager.getHive();
  }

  getBees(): Bee[] {
    return this.beeManager.getBees();
  }

  getFlowers(): Flower[] {
    return this.flowers;
  }

  getEnemies(): Enemy[] {
    return this.enemyManager.getEnemies();
  }

  getWave(): number {
    return this.wave;
  }

  getWaveTimer(): number {
    return this.waveTimer;
  }

  getFps(): number {
    return this.fps;
  }

  getPhase(): GamePhase {
    return this.phase;
  }
}
