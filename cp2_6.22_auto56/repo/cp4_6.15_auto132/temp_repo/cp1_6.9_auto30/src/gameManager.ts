import {
  TowerType,
  EnemyType,
  WaveState,
  Position,
  GRID_WIDTH,
  GRID_HEIGHT,
  CELL_SIZE,
  INITIAL_GOLD,
  INITIAL_LIVES,
  TOTAL_WAVES,
  COUNTDOWN_TIME,
  WAVE_INTERVAL,
  WAVE_ENEMY_COUNTS,
  TOWER_CONFIGS,
  PATH_POINTS,
  MAX_ENEMIES
} from './types';
import { Tower, TowerManager } from './tower';
import { Enemy, EnemyManager } from './enemy';
import { BulletSystem } from './bullet';
import { ParticleSystem } from './particle';
import { Renderer } from './renderer';

export class GameManager {
  private towerManager: TowerManager;
  private enemyManager: EnemyManager;
  private bulletSystem: BulletSystem;
  private particleSystem: ParticleSystem;
  
  gold: number;
  lives: number;
  score: number;
  enemiesKilled: number;
  currentWave: number;
  waveState: WaveState;
  countdownTimer: number;
  spawnTimer: number;
  spawnQueue: Array<{ type: EnemyType; delay: number }>;
  selectedTowerType: TowerType | null;
  selectedTower: Tower | null;
  mouseGridPos: Position | null;
  goldAnimation: number;
  damageFlashCallback: (() => void) | null;
  restartTransition: number;
  isTransitioning: boolean;
  isVictory: boolean;
  private lastFrameTime: number;
  private pathCells: Set<string>;

  constructor() {
    this.towerManager = new TowerManager();
    this.enemyManager = new EnemyManager();
    this.bulletSystem = new BulletSystem();
    this.particleSystem = new ParticleSystem();
    
    this.gold = INITIAL_GOLD;
    this.lives = INITIAL_LIVES;
    this.score = 0;
    this.enemiesKilled = 0;
    this.currentWave = 1;
    this.waveState = 'countdown';
    this.countdownTimer = COUNTDOWN_TIME;
    this.spawnTimer = 0;
    this.spawnQueue = [];
    this.selectedTowerType = null;
    this.selectedTower = null;
    this.mouseGridPos = null;
    this.goldAnimation = 0;
    this.damageFlashCallback = null;
    this.restartTransition = 0;
    this.isTransitioning = false;
    this.isVictory = false;
    this.lastFrameTime = 0;
    this.pathCells = this.buildPathCellSet();
  }

  private buildPathCellSet(): Set<string> {
    const cells = new Set<string>();
    
    for (let i = 0; i < PATH_POINTS.length - 1; i++) {
      const start = PATH_POINTS[i];
      const end = PATH_POINTS[i + 1];
      
      const dx = Math.sign(end.x - start.x);
      const dy = Math.sign(end.y - start.y);
      
      let x = start.x;
      let y = start.y;
      
      while (x !== end.x || y !== end.y) {
        if (x >= 0 && x < GRID_WIDTH && y >= 0 && y < GRID_HEIGHT) {
          cells.add(`${x},${y}`);
        }
        if (x !== end.x) x += dx;
        if (y !== end.y) y += dy;
      }
    }
    
    return cells;
  }

  isPathCell(gridX: number, gridY: number): boolean {
    return this.pathCells.has(`${gridX},${gridY}`);
  }

  canPlaceTower(gridX: number, gridY: number): boolean {
    if (gridX < 0 || gridX >= GRID_WIDTH || gridY < 0 || gridY >= GRID_HEIGHT) {
      return false;
    }
    if (this.isPathCell(gridX, gridY)) {
      return false;
    }
    if (this.towerManager.hasTowerAt(gridX, gridY)) {
      return false;
    }
    return true;
  }

  placeTower(gridX: number, gridY: number, type: TowerType): boolean {
    if (!this.canPlaceTower(gridX, gridY)) {
      return false;
    }
    
    const config = TOWER_CONFIGS[type];
    if (this.gold < config.cost) {
      return false;
    }
    
    this.gold -= config.cost;
    this.towerManager.add(new Tower(gridX, gridY, type));
    this.goldAnimation = 1;
    
    return true;
  }

  upgradeTower(tower: Tower): boolean {
    if (!tower.canUpgrade()) {
      return false;
    }
    
    const cost = tower.getUpgradeCost();
    if (this.gold < cost) {
      return false;
    }
    
    this.gold -= cost;
    tower.upgrade();
    this.goldAnimation = 1;
    
    return true;
  }

  selectTower(gridX: number, gridY: number): Tower | null {
    const tower = this.towerManager.getAt(gridX, gridY);
    this.selectedTower = tower || null;
    return this.selectedTower;
  }

  selectTowerType(type: TowerType | null): void {
    this.selectedTowerType = type;
    if (type) {
      this.selectedTower = null;
    }
  }

  setMousePosition(worldX: number, worldY: number): void {
    const gridX = Math.floor(worldX / CELL_SIZE);
    const gridY = Math.floor(worldY / CELL_SIZE);
    this.mouseGridPos = { x: gridX, y: gridY };
  }

  handleClick(worldX: number, worldY: number): void {
    if (this.isTransitioning) return;
    
    const gridX = Math.floor(worldX / CELL_SIZE);
    const gridY = Math.floor(worldY / CELL_SIZE);
    
    if (this.waveState === 'gameover' || this.waveState === 'victory') {
      const buttonX = 240;
      const buttonY = 280;
      const buttonWidth = 160;
      const buttonHeight = 50;
      
      if (worldX >= buttonX && worldX <= buttonX + buttonWidth &&
          worldY >= buttonY && worldY <= buttonY + buttonHeight) {
        this.startRestart();
      }
      return;
    }
    
    if (this.selectedTowerType) {
      if (this.placeTower(gridX, gridY, this.selectedTowerType)) {
        this.selectedTowerType = null;
      }
      return;
    }
    
    const existingTower = this.towerManager.getAt(gridX, gridY);
    if (existingTower) {
      this.selectedTower = existingTower;
    } else {
      this.selectedTower = null;
    }
  }

  handleUpgradeClick(worldX: number, worldY: number): boolean {
    if (!this.selectedTower) return false;
    
    const panelX = 440;
    const panelY = 50;
    const buttonX = panelX + 10;
    const buttonY = panelY + 110;
    const buttonWidth = 170;
    const buttonHeight = 35;
    
    const localX = worldX;
    const localY = worldY;
    
    if (localX >= buttonX && localX <= buttonX + buttonWidth &&
        localY >= buttonY && localY <= buttonY + buttonHeight) {
      return this.upgradeTower(this.selectedTower);
    }
    
    return false;
  }

  handleTowerSelectClick(worldX: number, worldY: number): boolean {
    const panelY = 390;
    const panelX = 110;
    const types: TowerType[] = ['machine', 'laser', 'cannon'];
    
    for (let i = 0; i < types.length; i++) {
      const buttonX = panelX + 10 + i * 140;
      const buttonY = panelY + 10;
      const buttonWidth = 120;
      const buttonHeight = 60;
      
      if (worldX >= buttonX && worldX <= buttonX + buttonWidth &&
          worldY >= buttonY && worldY <= buttonY + buttonHeight) {
        if (this.selectedTowerType === types[i]) {
          this.selectedTowerType = null;
        } else {
          this.selectedTowerType = types[i];
          this.selectedTower = null;
        }
        return true;
      }
    }
    
    return false;
  }

  private startRestart(): void {
    this.isTransitioning = true;
    this.restartTransition = 0;
  }

  restart(): void {
    this.towerManager.clear();
    this.enemyManager.clear();
    this.bulletSystem.clear();
    this.particleSystem.clear();
    
    this.gold = INITIAL_GOLD;
    this.lives = INITIAL_LIVES;
    this.score = 0;
    this.enemiesKilled = 0;
    this.currentWave = 1;
    this.waveState = 'countdown';
    this.countdownTimer = COUNTDOWN_TIME;
    this.spawnTimer = 0;
    this.spawnQueue = [];
    this.selectedTowerType = null;
    this.selectedTower = null;
    this.mouseGridPos = null;
    this.goldAnimation = 0;
    this.isTransitioning = false;
    this.isVictory = false;
    this.restartTransition = 0;
  }

  update(deltaTime: number): void {
    this.lastFrameTime += deltaTime;
    
    if (this.isTransitioning) {
      this.restartTransition += deltaTime / 1000;
      if (this.restartTransition >= 1) {
        this.restart();
      }
      return;
    }
    
    if (this.goldAnimation > 0) {
      this.goldAnimation -= deltaTime / 300;
      if (this.goldAnimation < 0) this.goldAnimation = 0;
    }
    
    this.updateWaveState(deltaTime);
    this.updateGameObjects(deltaTime);
    this.checkCollisions();
  }

  private updateWaveState(deltaTime: number): void {
    switch (this.waveState) {
      case 'countdown':
        this.countdownTimer -= deltaTime;
        if (this.countdownTimer <= 0) {
          this.startWave();
        }
        break;
        
      case 'spawning':
        this.spawnTimer -= deltaTime;
        if (this.spawnTimer <= 0 && this.spawnQueue.length > 0) {
          this.spawnNextEnemy();
        }
        if (this.spawnQueue.length === 0 && this.enemyManager.getCount() > 0) {
          this.waveState = 'active';
        }
        break;
        
      case 'active':
        if (this.enemyManager.getCount() === 0) {
          if (this.currentWave >= TOTAL_WAVES) {
            this.waveState = 'victory';
            this.isVictory = true;
          } else {
            this.waveState = 'waiting';
            this.countdownTimer = WAVE_INTERVAL;
          }
          this.enemyManager.clear();
        }
        break;
        
      case 'waiting':
        this.countdownTimer -= deltaTime;
        if (this.countdownTimer <= 0) {
          this.currentWave++;
          this.waveState = 'countdown';
          this.countdownTimer = COUNTDOWN_TIME;
        }
        break;
        
      case 'gameover':
      case 'victory':
        break;
    }
  }

  private startWave(): void {
    this.waveState = 'spawning';
    this.spawnTimer = 0;
    
    const waveIndex = this.currentWave - 1;
    const waveConfig = WAVE_ENEMY_COUNTS[Math.min(waveIndex, WAVE_ENEMY_COUNTS.length - 1)];
    
    this.spawnQueue = [];
    for (const group of waveConfig) {
      for (let i = 0; i < group.count; i++) {
        this.spawnQueue.push({
          type: group.type,
          delay: 800 + Math.random() * 400
        });
      }
    }
    
    this.shuffleArray(this.spawnQueue);
  }

  private shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  private spawnNextEnemy(): void {
    if (this.enemyManager.getCount() >= MAX_ENEMIES) {
      this.spawnTimer = 500;
      return;
    }
    
    const spawn = this.spawnQueue.shift();
    if (spawn) {
      const waveMultiplier = 1 + (this.currentWave - 1) * 0.15;
      this.enemyManager.add(new Enemy(spawn.type, waveMultiplier));
      this.spawnTimer = spawn.delay;
    }
  }

  private updateGameObjects(deltaTime: number): void {
    const currentTime = performance.now();
    
    const bullets = this.towerManager.update(
      this.enemyManager.getAll(),
      currentTime,
      deltaTime
    );
    
    for (const bullet of bullets) {
      this.bulletSystem.add(bullet);
      
      const tower = this.towerManager.getAll().find(t => 
        Math.abs(t.x - bullet.x) < 1 && Math.abs(t.y + 8 - bullet.y) < 1
      );
      if (tower) {
        this.particleSystem.add(tower.createMuzzleFlash());
      }
    }
    
    const { reachedEnd, dead } = this.enemyManager.update(deltaTime);
    
    for (const _enemy of reachedEnd) {
      this.lives--;
      if (this.damageFlashCallback) {
        this.damageFlashCallback();
      }
      if (this.lives <= 0) {
        this.lives = 0;
        this.waveState = 'gameover';
      }
    }
    
    for (const enemy of dead) {
      this.gold += enemy.getGoldReward();
      this.score += enemy.getGoldReward() * 10;
      this.enemiesKilled++;
      this.goldAnimation = 1;
      this.particleSystem.add(enemy.getDeathParticles());
    }
    
    this.bulletSystem.update(deltaTime);
    this.particleSystem.update(deltaTime);
  }

  private checkCollisions(): void {
    const bullets = this.bulletSystem.getAll();
    const enemies = this.enemyManager.getAll();
    
    for (const bullet of bullets) {
      if (!bullet.active) continue;
      
      for (const enemy of enemies) {
        if (!enemy.active) continue;
        if (bullet.hitEnemies.has(enemy.id)) continue;
        
        const dx = enemy.x - bullet.x;
        const dy = enemy.y - bullet.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const hitRadius = enemy.getSize() / 2 + 4;
        
        if (dist < hitRadius) {
          bullet.hitEnemies.add(enemy.id);
          
          if (bullet.splashRadius > 0) {
            for (const otherEnemy of enemies) {
              if (!otherEnemy.active) continue;
              const odx = otherEnemy.x - bullet.x;
              const ody = otherEnemy.y - bullet.y;
              const odist = Math.sqrt(odx * odx + ody * ody);
              if (odist <= bullet.splashRadius) {
                otherEnemy.takeDamage(bullet.damage);
              }
            }
            bullet.active = false;
            this.particleSystem.add(bullet.createHitParticles());
          } else {
            enemy.takeDamage(bullet.damage);
            this.particleSystem.add(bullet.createHitParticles());
            
            if (!bullet.isPiercing) {
              bullet.active = false;
            }
          }
          
          if (!bullet.active) {
            break;
          }
        }
      }
    }
    
    const canvasWidth = GRID_WIDTH * CELL_SIZE;
    const canvasHeight = GRID_HEIGHT * CELL_SIZE;
    
    for (const bullet of bullets) {
      if (bullet.x < -50 || bullet.x > canvasWidth + 50 ||
          bullet.y < -50 || bullet.y > canvasHeight + 50) {
        bullet.active = false;
      }
    }
  }

  render(renderer: Renderer): void {
    if (this.isTransitioning) {
      const alpha = 1 - this.restartTransition;
      
      renderer.begin();
      
      this.renderGame(renderer);
      
      renderer.end();
      
      const ctx = (renderer as any).ctx;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#1a0f05';
      ctx.fillRect(0, 0, GRID_WIDTH * CELL_SIZE, GRID_HEIGHT * CELL_SIZE);
      ctx.globalAlpha = 1;
      
      return;
    }
    
    renderer.begin();
    this.renderGame(renderer);
    renderer.end();
    
    if (this.waveState === 'gameover' || this.waveState === 'victory') {
      renderer.begin();
      renderer.drawGameOver(this.score, this.currentWave, this.isVictory);
      renderer.end();
    }
  }

  private renderGame(renderer: Renderer): void {
    renderer.drawGrid();
    renderer.drawPath();
    
    const towers = this.towerManager.getAll();
    for (const tower of towers) {
      renderer.drawTower(tower, tower === this.selectedTower);
    }
    
    const enemies = this.enemyManager.getAll();
    for (const enemy of enemies) {
      renderer.drawEnemy(enemy);
    }
    
    const bullets = this.bulletSystem.getAll();
    for (const bullet of bullets) {
      renderer.drawBullet(bullet);
    }
    
    const particles = this.particleSystem.getAll();
    for (const particle of particles) {
      renderer.drawParticle(particle);
    }
    
    renderer.drawUI(
      this.gold,
      this.lives,
      this.currentWave,
      TOTAL_WAVES,
      this.waveState,
      this.countdownTimer,
      this.selectedTowerType,
      this.selectedTower,
      this.score,
      this.goldAnimation,
      this.mouseGridPos
    );
  }

  setDamageFlashCallback(callback: () => void): void {
    this.damageFlashCallback = callback;
  }

  getEnemiesKilled(): number {
    return this.enemiesKilled;
  }

  getTowerCount(): number {
    return this.towerManager.getCount();
  }

  getEnemyCount(): number {
    return this.enemyManager.getCount();
  }

  getBulletCount(): number {
    return this.bulletSystem.getCount();
  }

  getParticleCount(): number {
    return this.particleSystem.getCount();
  }

  handleKeyDown(key: string): void {
    if (key === ' ' && (this.waveState === 'gameover' || this.waveState === 'victory')) {
      this.startRestart();
    }
    
    if (key === 'Escape') {
      this.selectedTowerType = null;
      this.selectedTower = null;
    }
    
    if (key === '1') this.selectTowerType('machine');
    if (key === '2') this.selectTowerType('laser');
    if (key === '3') this.selectTowerType('cannon');
  }
}
