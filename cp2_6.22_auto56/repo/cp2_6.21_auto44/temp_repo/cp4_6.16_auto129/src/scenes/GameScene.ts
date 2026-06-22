import Phaser from 'phaser';
import { useGameStore } from '../store/gameStore';
import {
  TILE_SIZE,
  MAP_WIDTH,
  MAP_HEIGHT,
  SIDEBAR_WIDTH,
  COLORS,
  PATH_POINTS,
  WAVES,
  type TowerType,
  type Rune,
  type EnemyType
} from '../types';
import { TowerPool } from '../entities/Tower';
import { EnemyPool } from '../entities/Enemy';
import { ProjectilePool } from '../entities/Projectile';
import { ParticleEffects } from '../effects/ParticleEffects';
import { AudioManager } from '../audio/AudioManager';
import { HUD } from '../ui/HUD';

console.log('[TRACE] 初始化 GameScene 模块...');

export class GameScene extends Phaser.Scene {
  private towerPool!: TowerPool;
  private enemyPool!: EnemyPool;
  private projectilePool!: ProjectilePool;
  private particleEffects!: ParticleEffects;
  private audioManager!: AudioManager;
  private hud!: HUD;
  private gridGraphics!: Phaser.GameObjects.Graphics;
  private pathGraphics!: Phaser.GameObjects.Graphics;
  private portalContainer!: Phaser.GameObjects.Container;
  private blockedTiles: Set<string> = new Set();
  private waveSpawnTimer: number = 0;
  private waveEnemyIndex: number = 0;
  private waveGroupIndex: number = 0;
  private perfStats: { fps: number; frameCount: number; lastTime: number } = {
    fps: 0,
    frameCount: 0,
    lastTime: 0
  };
  private lastTime: number = 0;

  constructor() {
    super('GameScene');
    console.log('[TRACE] GameScene 构造函数调用');
  }

  preload() {
    console.log('[TRACE] GameScene preload');
  }

  async create() {
    console.log('[TRACE] GameScene create 开始');

    this.audioManager = new AudioManager(this);
    await this.audioManager.init();

    this.input.on('pointerdown', () => {
      this.audioManager.resume();
    });

    this.particleEffects = new ParticleEffects(this);
    this.particleEffects.createParticleTexture();

    this.projectilePool = new ProjectilePool(this);
    this.towerPool = new TowerPool(this, this.projectilePool);
    this.enemyPool = new EnemyPool(this, this.particleEffects);

    this.hud = new HUD(this, this.audioManager);

    this.createGrid();
    this.createPath();
    this.createPortal();
    this.calculateBlockedTiles();

    this.setupInputHandlers();

    let prevTowersLen = useGameStore.getState().towers.length;
    let prevEnemiesLen = useGameStore.getState().enemies.length;

    useGameStore.subscribe((state) => {
      if (state.towers.length > prevTowersLen) {
        const newTower = state.towers[state.towers.length - 1];
        const tower = this.towerPool.build(newTower);
        if (tower) {
          const colors: Record<string, number> = {
            arrow: 0x94A3B8,
            frost: 0x67E8F9,
            fire: 0xFB923C,
            electric: 0xA78BFA
          };
          this.particleEffects.playBuildEffect(tower.getX(), tower.getY(), colors[newTower.type] || 0x94A3B8);
          this.audioManager.play('build');
          tower.getContainer().name = 'tower_' + newTower.id;
        }
      }
      prevTowersLen = state.towers.length;

      if (state.enemies.length > prevEnemiesLen) {
        const newEnemy = state.enemies[state.enemies.length - 1];
        this.enemyPool.spawn(newEnemy);
      }
      prevEnemiesLen = state.enemies.length;
    });

    useGameStore.subscribe((state) => {
      if (state.isWaveActive) {
        this.startWaveSpawn();
      }
    });

    console.log('[TRACE] GameScene create 完成');
  }

  private createGrid() {
    console.log('[TRACE] 创建地图网格');
    this.gridGraphics = this.add.graphics();
    this.gridGraphics.lineStyle(1, COLORS.GRID_LINE, 0.4);

    for (let x = 0; x <= MAP_WIDTH; x++) {
      const px = SIDEBAR_WIDTH + x * TILE_SIZE;
      this.gridGraphics.beginPath();
      this.gridGraphics.moveTo(px, 0);
      this.gridGraphics.lineTo(px, MAP_HEIGHT * TILE_SIZE);
      this.gridGraphics.stroke();
    }

    for (let y = 0; y <= MAP_HEIGHT; y++) {
      const py = y * TILE_SIZE;
      this.gridGraphics.beginPath();
      this.gridGraphics.moveTo(SIDEBAR_WIDTH, py);
      this.gridGraphics.lineTo(SIDEBAR_WIDTH + MAP_WIDTH * TILE_SIZE, py);
      this.gridGraphics.stroke();
    }
  }

  private createPath() {
    console.log('[TRACE] 创建敌人路径');
    this.pathGraphics = this.add.graphics();
    this.pathGraphics.lineStyle(3, COLORS.PATH, 0.4);

    this.pathGraphics.beginPath();
    this.pathGraphics.moveTo(PATH_POINTS[0].x, PATH_POINTS[0].y);

    for (let i = 1; i < PATH_POINTS.length; i++) {
      this.pathGraphics.lineTo(PATH_POINTS[i].x, PATH_POINTS[i].y);
    }
    this.pathGraphics.stroke();

    this.pathGraphics.lineStyle(2, COLORS.PATH, 0.2);
    
    for (let i = 0; i < PATH_POINTS.length - 1; i++) {
      const start = PATH_POINTS[i];
      const end = PATH_POINTS[i + 1];
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      const steps = Math.floor(length / 20);
      
      for (let j = 0; j < steps; j += 2) {
        const t1 = j / steps;
        const t2 = (j + 1) / steps;
        const x1 = start.x + dx * t1;
        const y1 = start.y + dy * t1;
        const x2 = start.x + dx * t2;
        const y2 = start.y + dy * t2;
        
        this.pathGraphics.beginPath();
        this.pathGraphics.moveTo(x1, y1);
        this.pathGraphics.lineTo(x2, y2);
        this.pathGraphics.stroke();
      }
    }
  }

  private createPortal() {
    console.log('[TRACE] 创建传送门');
    const portalX = PATH_POINTS[0].x;
    const portalY = PATH_POINTS[0].y;
    this.portalContainer = this.particleEffects.playPortalEffect(portalX, portalY);
  }

  private calculateBlockedTiles() {
    console.log('[TRACE] 计算路径阻挡格子');
    this.blockedTiles.clear();

    for (let i = 0; i < PATH_POINTS.length - 1; i++) {
      const start = PATH_POINTS[i];
      const end = PATH_POINTS[i + 1];

      const startGridX = Math.floor((start.x - SIDEBAR_WIDTH) / TILE_SIZE);
      const startGridY = Math.floor(start.y / TILE_SIZE);
      const endGridX = Math.floor((end.x - SIDEBAR_WIDTH) / TILE_SIZE);
      const endGridY = Math.floor(end.y / TILE_SIZE);

      const minX = Math.max(0, Math.min(startGridX, endGridX) - 1);
      const maxX = Math.min(MAP_WIDTH - 1, Math.max(startGridX, endGridX) + 1);
      const minY = Math.max(0, Math.min(startGridY, endGridY) - 1);
      const maxY = Math.min(MAP_HEIGHT - 1, Math.max(startGridY, endGridY) + 1);

      for (let gx = minX; gx <= maxX; gx++) {
        for (let gy = minY; gy <= maxY; gy++) {
          const tileCenterX = SIDEBAR_WIDTH + gx * TILE_SIZE + TILE_SIZE / 2;
          const tileCenterY = gy * TILE_SIZE + TILE_SIZE / 2;

          if (this.isPointNearLine(tileCenterX, tileCenterY, start, end, TILE_SIZE * 0.7)) {
            this.blockedTiles.add(`${gx},${gy}`);
          }
        }
      }
    }

    console.log('[TRACE] 阻挡格子数量:', this.blockedTiles.size);
  }

  private isPointNearLine(
    px: number, py: number,
    lineStart: { x: number; y: number },
    lineEnd: { x: number; y: number },
    threshold: number
  ): boolean {
    const dx = lineEnd.x - lineStart.x;
    const dy = lineEnd.y - lineStart.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length === 0) {
      const d = Math.sqrt((px - lineStart.x) ** 2 + (py - lineStart.y) ** 2);
      return d <= threshold;
    }

    const t = Math.max(0, Math.min(1, ((px - lineStart.x) * dx + (py - lineStart.y) * dy) / (length * length)));
    const nearestX = lineStart.x + t * dx;
    const nearestY = lineStart.y + t * dy;
    const distance = Math.sqrt((px - nearestX) ** 2 + (py - nearestY) ** 2);

    return distance <= threshold;
  }

  private setupInputHandlers() {
    console.log('[TRACE] 设置输入处理器');

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      const state = useGameStore.getState();
      if (state.selectedTowerType && pointer.x > SIDEBAR_WIDTH) {
        const gridX = Math.floor((pointer.x - SIDEBAR_WIDTH) / TILE_SIZE);
        const gridY = Math.floor(pointer.y / TILE_SIZE);
        const canPlace = this.canPlaceTower(gridX, gridY);
        this.hud.updateBuildPreview(pointer.x, pointer.y, canPlace);
      } else {
        this.hud.hideBuildPreview();
      }
    });

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.x < SIDEBAR_WIDTH) return;

      const state = useGameStore.getState();

      if (state.selectedTowerType) {
        const gridX = Math.floor((pointer.x - SIDEBAR_WIDTH) / TILE_SIZE);
        const gridY = Math.floor(pointer.y / TILE_SIZE);

        if (this.canPlaceTower(gridX, gridY)) {
          const success = useGameStore.getState().buildTower(state.selectedTowerType, gridX, gridY);
          if (success) {
            useGameStore.getState().setSelectedTowerType(null);
          }
        } else {
          this.audioManager.play('error');
        }
        return;
      }

      const clickedTower = this.findTowerAt(pointer.x, pointer.y);
      if (clickedTower) {
        this.towerPool.getAll().forEach(t => t.showRange(false));
        clickedTower.showRange(true);
        useGameStore.getState().setSelectedTowerId(clickedTower.id);
        this.audioManager.play('click');
      } else {
        this.towerPool.getAll().forEach(t => t.showRange(false));
        useGameStore.getState().setSelectedTowerId(null);
      }
    });

    this.input.keyboard?.on('keydown-ESC', () => {
      const state = useGameStore.getState();
      if (state.selectedTowerType) {
        useGameStore.getState().setSelectedTowerType(null);
      } else if (state.selectedTowerId) {
        this.towerPool.getAll().forEach(t => t.showRange(false));
        useGameStore.getState().setSelectedTowerId(null);
      }
    });
  }

  private canPlaceTower(gridX: number, gridY: number): boolean {
    if (gridX < 0 || gridX >= MAP_WIDTH || gridY < 0 || gridY >= MAP_HEIGHT) {
      return false;
    }

    if (this.blockedTiles.has(`${gridX},${gridY}`)) {
      return false;
    }

    const state = useGameStore.getState();
    return !state.towers.some(t => t.gridX === gridX && t.gridY === gridY);
  }

  private findTowerAt(x: number, y: number) {
    return this.towerPool.getAll().find(tower => {
      const dx = tower.getX() - x;
      const dy = tower.getY() - y;
      return Math.sqrt(dx * dx + dy * dy) < 30;
    });
  }

  private startWaveSpawn() {
    const state = useGameStore.getState();
    const waveIndex = Math.min(state.wave - 1, WAVES.length - 1);
    const waveConfig = WAVES[waveIndex];

    console.log('[TRACE] 开始波次生成，波次:', state.wave);

    this.waveEnemyIndex = 0;
    this.waveGroupIndex = 0;
    this.waveSpawnTimer = 0;
  }

  private updateWaveSpawning(deltaTime: number) {
    const state = useGameStore.getState();
    if (!state.isWaveActive) return;

    const waveIndex = Math.min(state.wave - 1, WAVES.length - 1);
    const waveConfig = WAVES[waveIndex];

    if (this.waveGroupIndex >= waveConfig.enemies.length) {
      if (this.enemyPool.getActiveCount() === 0) {
        console.log('[TRACE] 波次完成');
        useGameStore.setState({ isWaveActive: false });
      }
      return;
    }

    const currentGroup = waveConfig.enemies[this.waveGroupIndex];
    this.waveSpawnTimer += deltaTime;

    if (this.waveSpawnTimer >= currentGroup.delay && this.waveEnemyIndex < currentGroup.count) {
      const enemyType = currentGroup.type as EnemyType;
      useGameStore.getState().spawnEnemy(enemyType);
      this.waveEnemyIndex++;
      this.waveSpawnTimer = 0;

      if (this.waveEnemyIndex >= currentGroup.count) {
        this.waveGroupIndex++;
        this.waveEnemyIndex = 0;
      }
    }
  }

  update(time: number, deltaTime: number) {
    const state = useGameStore.getState();

    if (state.gameOver) return;
    if (state.isPaused) return;

    this.updateWaveSpawning(deltaTime);

    const enemies = this.enemyPool.getAll();
    this.towerPool.update(time, enemies);

    this.projectilePool.update(deltaTime);

    (this.projectilePool as any).pool.forEach((proj: any) => {
      this.setupProjectileCallbacks(proj);
    });

    const activeEnemies = this.enemyPool.getAll();
    activeEnemies.forEach(enemy => {
      this.projectilePool.updateProjectileTarget(enemy.id, enemy.getX(), enemy.getY());
    });

    const reachedEnd = this.enemyPool.update(deltaTime);
    reachedEnd.forEach(id => {
      useGameStore.getState().enemyReachedEnd(id);
    });

    this.updatePerfStats(deltaTime);
  }

  private handleProjectileHit(targetId: string, damage: number, runes: Rune[], x: number, y: number) {
    const store = useGameStore.getState();
    const result = store.damageEnemy(targetId, damage, runes);

    const enemy = this.enemyPool.get(targetId);
    if (enemy) {
      const isCrit = runes.some(r => r.type === 'critical');
      this.particleEffects.showDamageNumber(x, y, damage, isCrit);
      this.audioManager.play('damage');
    }

    if (result.killed) {
      this.audioManager.play('kill');
      this.enemyPool.remove(targetId);

      if (Math.random() < 0.15) {
        useGameStore.getState().dropRune();
      }
    }
  }

  private handleProjectileSplash(x: number, y: number, radius: number, damage: number, runes: Rune[]) {
    const store = useGameStore.getState();
    this.particleEffects.playSplashEffect(x, y, radius, 0xFB923C);
    const killed = this.enemyPool.applySplashDamage(x, y, radius, damage);
    killed.forEach(id => {
      store.removeEnemy(id);
      this.audioManager.play('kill');
      if (Math.random() < 0.15) {
        useGameStore.getState().dropRune();
      }
    });
  }

  private setupProjectileCallbacks(projectile: any) {
    if (projectile && !projectile._handlersSet) {
      projectile.setCallbacks(
        this.handleProjectileHit.bind(this),
        this.handleProjectileSplash.bind(this)
      );
      projectile._handlersSet = true;
    }
  }

  private updatePerfStats(deltaTime: number) {
    this.perfStats.frameCount++;
    const now = performance.now();

    if (now - this.perfStats.lastTime >= 1000) {
      this.perfStats.fps = Math.round(this.perfStats.frameCount * 1000 / (now - this.perfStats.lastTime));
      this.perfStats.frameCount = 0;
      this.perfStats.lastTime = now;

      const towerCount = this.towerPool.getActiveCount();
      const enemyCount = this.enemyPool.getActiveCount();
      const projectileCount = this.projectilePool.getActiveCount();

      const perfEl = document.getElementById('perf-stats');
      if (perfEl) {
        perfEl.innerHTML = `FPS: ${this.perfStats.fps} | Towers: ${towerCount} | Enemies: ${enemyCount} | Projectiles: ${projectileCount}`;

        if (this.perfStats.fps < 45) {
          perfEl.style.color = '#EF4444';
        } else if (this.perfStats.fps < 55) {
          perfEl.style.color = '#FBBF24';
        } else {
          perfEl.style.color = '#22C55E';
        }
      }

      if (towerCount >= 40 && enemyCount >= 80) {
        console.log(`[PERF-TEST] 压力测试 - FPS: ${this.perfStats.fps}, 塔: ${towerCount}, 敌人: ${enemyCount}, 投射物: ${projectileCount}`);
      }
    }
  }

  public getFPS(): number {
    return this.perfStats.fps;
  }

  public runPerformanceTest(towerCount: number, enemyCount: number): Promise<{ avgFPS: number; minFPS: number; maxFPS: number }> {
    return new Promise((resolve) => {
      console.log(`[PERF-TEST] 开始性能测试: ${towerCount}座塔, ${enemyCount}个敌人`);

      const types: TowerType[] = ['arrow', 'frost', 'fire', 'electric'];
      let placed = 0;
      let attempts = 0;

      while (placed < towerCount && attempts < 1000) {
        const gx = Math.floor(Math.random() * MAP_WIDTH);
        const gy = Math.floor(Math.random() * MAP_HEIGHT);
        const type = types[Math.floor(Math.random() * types.length)];

        if (this.canPlaceTower(gx, gy) && !useGameStore.getState().towers.some(t => t.gridX === gx && t.gridY === gy)) {
          useGameStore.setState({ gold: 99999 });
          useGameStore.getState().buildTower(type, gx, gy);
          placed++;
        }
        attempts++;
      }

      const enemyTypes: EnemyType[] = ['grunt', 'fast', 'tank'];
      for (let i = 0; i < enemyCount; i++) {
        const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
        useGameStore.getState().spawnEnemy(type);
      }

      let frames = 0;
      const fpsReadings: number[] = [];
      const testDuration = 5000;
      const startTime = performance.now();

      const measureInterval = setInterval(() => {
        fpsReadings.push(this.perfStats.fps);
        frames++;

        if (performance.now() - startTime >= testDuration) {
          clearInterval(measureInterval);

          const avgFPS = fpsReadings.reduce((a, b) => a + b, 0) / fpsReadings.length;
          const minFPS = Math.min(...fpsReadings);
          const maxFPS = Math.max(...fpsReadings);

          console.log(`[PERF-TEST] 测试完成:`);
          console.log(`  平均FPS: ${avgFPS.toFixed(1)}`);
          console.log(`  最低FPS: ${minFPS}`);
          console.log(`  最高FPS: ${maxFPS}`);
          console.log(`  通过: ${avgFPS >= 45 ? '✅' : '❌'}`);

          resolve({ avgFPS, minFPS, maxFPS });
        }
      }, 500);
    });
  }

  destroy() {
    console.log('[TRACE] 销毁 GameScene');
    this.towerPool.clear();
    this.enemyPool.clear();
    this.projectilePool.clear();
    this.particleEffects.cleanup();
    this.audioManager.destroy();
    this.hud.destroy();
  }
}
