import type {
  GameState, Tower, Monster, Particle, TowerType, MonsterType,
  TowerLevel, ElementType, HexCoord
} from './types';
import {
  HEX_SIZE, INITIAL_LIVES, INITIAL_ENERGY, TOTAL_WAVES, WAVE_PREP_TIME,
  TRAIL_LENGTH, MAX_PARTICLES, TOWER_CONFIGS, MONSTER_CONFIGS, WAVE_CONFIGS,
  DEFAULT_PATH, hexToPixel, getPositionOnPath, generateId, getTowerDamage,
  getTowerRange
} from './config';
import { Renderer } from './renderer';

export class GameLoop {
  private state: GameState;
  private renderer: Renderer;
  private lastTime: number = 0;
  private animationFrameId: number | null = null;
  private onStateChange: (state: GameState) => void;

  constructor(renderer: Renderer, onStateChange: (state: GameState) => void) {
    this.renderer = renderer;
    this.onStateChange = onStateChange;
    this.state = this.createInitialState();
  }

  private createInitialState(): GameState {
    return {
      phase: 'preparing',
      currentWave: 0,
      totalWaves: TOTAL_WAVES,
      waveCountdown: 0,
      lives: INITIAL_LIVES,
      maxLives: INITIAL_LIVES,
      energy: INITIAL_ENERGY,
      towers: [],
      monsters: [],
      particles: [],
      path: [...DEFAULT_PATH],
      selectedTowerType: null,
      selectedTower: null,
      hoveredCell: null,
      kills: 0,
      totalDamageDealt: 0,
      spawnTimer: 0,
      monstersToSpawn: 0,
      warningFlash: 0
    };
  }

  public getState(): GameState {
    return this.state;
  }

  public start(): void {
    this.lastTime = performance.now();
    this.loop();
  }

  public stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public reset(): void {
    this.state = this.createInitialState();
    this.notifyChange();
  }

  public startWave(): void {
    if (this.state.phase !== 'preparing' && this.state.phase !== 'waveComplete') return;
    if (this.state.currentWave >= TOTAL_WAVES) return;

    this.state.currentWave += 1;
    const waveConfig = WAVE_CONFIGS[this.state.currentWave - 1];
    this.state.phase = 'playing';
    this.state.monstersToSpawn = waveConfig.monsterCount;
    this.state.spawnTimer = 0;
    this.notifyChange();
  }

  public selectTowerType(type: TowerType | null): void {
    this.state.selectedTowerType = type;
    this.state.selectedTower = null;
    this.notifyChange();
  }

  public setHoveredCell(cell: HexCoord | null): void {
    this.state.hoveredCell = cell;
    this.notifyChange();
  }

  public tryPlaceTower(cell: HexCoord): boolean {
    if (!this.state.selectedTowerType) return false;

    const config = TOWER_CONFIGS[this.state.selectedTowerType];
    if (this.state.energy < config.cost) {
      this.state.warningFlash = 0.3;
      this.notifyChange();
      return false;
    }

    const hasTower = this.state.towers.some(
      t => t.position.q === cell.q && t.position.r === cell.r
    );
    if (hasTower) return false;

    const pixelPos = hexToPixel(cell, HEX_SIZE);
    const tower: Tower = {
      id: generateId(),
      type: this.state.selectedTowerType,
      level: 1,
      position: cell,
      pixelPosition: pixelPos,
      cooldown: 0,
      buildAnimation: 0.4,
      upgradeAnimation: 0,
      rangeAnimation: 0.3
    };

    this.state.towers.push(tower);
    this.state.energy -= config.cost;
    this.spawnBuildParticles(pixelPos, config.color);
    this.notifyChange();
    return true;
  }

  public selectTower(tower: Tower | null): void {
    this.state.selectedTower = tower;
    this.state.selectedTowerType = null;
    this.notifyChange();
  }

  public tryUpgradeTower(towerId: string): boolean {
    const tower = this.state.towers.find(t => t.id === towerId);
    if (!tower || tower.level >= 3) return false;

    const upgradeCost = TOWER_CONFIGS[tower.type].upgradeCosts[tower.level - 1];
    if (this.state.energy < upgradeCost) {
      this.state.warningFlash = 0.3;
      this.notifyChange();
      return false;
    }

    tower.level = (tower.level + 1) as TowerLevel;
    tower.upgradeAnimation = 0.5;
    tower.rangeAnimation = 0.3;
    this.state.energy -= upgradeCost;
    this.spawnUpgradeParticles(tower.pixelPosition, TOWER_CONFIGS[tower.type].color);
    this.state.selectedTower = { ...tower };
    this.notifyChange();
    return true;
  }

  public sellTower(towerId: string): boolean {
    const index = this.state.towers.findIndex(t => t.id === towerId);
    if (index === -1) return false;

    const tower = this.state.towers[index];
    let totalCost = TOWER_CONFIGS[tower.type].cost;
    for (let i = 1; i < tower.level; i++) {
      totalCost += TOWER_CONFIGS[tower.type].upgradeCosts[i - 1];
    }
    const refund = Math.floor(totalCost * 0.7);

    this.state.energy += refund;
    this.state.towers.splice(index, 1);
    if (this.state.selectedTower?.id === towerId) {
      this.state.selectedTower = null;
    }
    this.notifyChange();
    return true;
  }

  private spawnBuildParticles(pos: { x: number; y: number }, color: string): void {
    for (let i = 0; i < 15; i++) {
      const angle = (Math.PI * 2 * i) / 15;
      this.addParticle({
        id: generateId(),
        type: 'build',
        x: pos.x,
        y: pos.y,
        vx: Math.cos(angle) * 80,
        vy: Math.sin(angle) * 80,
        life: 0.4,
        maxLife: 0.4,
        size: 4,
        color
      });
    }
  }

  private spawnUpgradeParticles(pos: { x: number; y: number }, color: string): void {
    for (let i = 0; i < 25; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 100;
      this.addParticle({
        id: generateId(),
        type: 'upgrade',
        x: pos.x,
        y: pos.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 30,
        life: 0.6,
        maxLife: 0.6,
        size: 5,
        color
      });
    }
  }

  private spawnElementParticles(monster: Monster, element: ElementType): void {
    const colors: Record<ElementType, string> = {
      frost: '#60d0ff',
      fire: '#ff6040',
      lightning: '#ffffff',
      none: '#ffffff'
    };
    const counts: Record<ElementType, number> = {
      frost: 8,
      fire: 10,
      lightning: 5,
      none: 0
    };

    if (element === 'none') return;

    for (let i = 0; i < counts[element]; i++) {
      this.addParticle({
        id: generateId(),
        type: element,
        x: monster.position.x + (Math.random() - 0.5) * 20,
        y: monster.position.y + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 60,
        vy: -20 - Math.random() * 40,
        life: element === 'lightning' ? 0.1 : element === 'fire' ? 0.5 : 0.4,
        maxLife: element === 'lightning' ? 0.1 : element === 'fire' ? 0.5 : 0.4,
        size: element === 'lightning' ? 8 : 4,
        color: colors[element]
      });
    }
  }

  private addParticle(particle: Particle): void {
    this.state.particles.push(particle);
    if (this.state.particles.length > MAX_PARTICLES) {
      const removeCount = this.state.particles.length - MAX_PARTICLES;
      this.state.particles.splice(0, removeCount);
    }
  }

  private loop = (): void => {
    const now = performance.now();
    const deltaTime = Math.min(0.05, (now - this.lastTime) / 1000);
    this.lastTime = now;

    this.update(deltaTime);
    this.renderer.render(this.state, deltaTime);

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  private update(deltaTime: number): void {
    if (this.state.phase === 'gameOver' || this.state.phase === 'victory') {
      this.updateAnimations(deltaTime);
      return;
    }

    if (this.state.warningFlash > 0) {
      this.state.warningFlash -= deltaTime;
    }

    if (this.state.phase === 'waveComplete') {
      this.state.waveCountdown -= deltaTime;
      if (this.state.waveCountdown <= 0) {
        this.startWave();
      }
    }

    if (this.state.phase === 'playing') {
      this.updateSpawning(deltaTime);
    }

    this.updateTowers(deltaTime);
    this.updateMonsters(deltaTime);
    this.updateParticles(deltaTime);
    this.updateAnimations(deltaTime);
    this.checkWaveEnd();
    this.notifyChange();
  }

  private updateAnimations(deltaTime: number): void {
    for (const tower of this.state.towers) {
      if (tower.buildAnimation > 0) tower.buildAnimation = Math.max(0, tower.buildAnimation - deltaTime);
      if (tower.upgradeAnimation > 0) tower.upgradeAnimation = Math.max(0, tower.upgradeAnimation - deltaTime);
      if (tower.rangeAnimation > 0) tower.rangeAnimation = Math.max(0, tower.rangeAnimation - deltaTime);
    }

    for (const monster of this.state.monsters) {
      if (monster.hitFlash > 0) monster.hitFlash = Math.max(0, monster.hitFlash - deltaTime);
    }
  }

  private updateSpawning(deltaTime: number): void {
    if (this.state.monstersToSpawn <= 0) return;

    this.state.spawnTimer -= deltaTime;
    const waveConfig = WAVE_CONFIGS[this.state.currentWave - 1];

    if (this.state.spawnTimer <= 0) {
      this.spawnMonster(waveConfig);
      this.state.monstersToSpawn -= 1;
      this.state.spawnTimer = waveConfig.spawnInterval;
    }
  }

  private spawnMonster(waveConfig: typeof WAVE_CONFIGS[0]): void {
    const isElite = Math.random() < waveConfig.eliteChance;
    const type: MonsterType = isElite ? 'elite' : 'normal';
    const baseConfig = MONSTER_CONFIGS[type];

    const startPos = getPositionOnPath(0, this.state.path, HEX_SIZE);
    const monster: Monster = {
      id: generateId(),
      type,
      health: baseConfig.health * waveConfig.healthMultiplier,
      maxHealth: baseConfig.health * waveConfig.healthMultiplier,
      speed: baseConfig.speed * waveConfig.speedMultiplier,
      baseSpeed: baseConfig.speed * waveConfig.speedMultiplier,
      pathProgress: 0,
      position: startPos,
      resistances: { ...baseConfig.resistances },
      effects: {
        frost: { remaining: 0, slowFactor: 1 },
        fire: { remaining: 0, damagePerSecond: 0 },
        lightning: { remaining: 0 }
      },
      trail: [],
      hitFlash: 0
    };

    this.state.monsters.push(monster);
  }

  private updateTowers(deltaTime: number): void {
    for (const tower of this.state.towers) {
      tower.cooldown = Math.max(0, tower.cooldown - deltaTime);
      if (tower.cooldown > 0) continue;

      const config = TOWER_CONFIGS[tower.type];
      const range = getTowerRange(tower.type, tower.level);
      const rangePixels = range * HEX_SIZE * Math.sqrt(3);
      const damage = getTowerDamage(tower.type, tower.level);

      const targets = this.findTargetsInRange(tower, rangePixels);
      if (targets.length === 0) continue;

      tower.cooldown = config.cooldown;

      if (tower.type === 'fire') {
        const primary = targets[0];
        const aoeRadius = (config.effect.aoeRadius || 2) * HEX_SIZE * Math.sqrt(3);
        for (const monster of this.state.monsters) {
          const dx = monster.position.x - primary.position.x;
          const dy = monster.position.y - primary.position.y;
          if (dx * dx + dy * dy <= aoeRadius * aoeRadius) {
            this.applyDamage(monster, damage, 'fire');
          }
        }
        this.renderer.addAttackLine(tower.pixelPosition, primary.position, config.color);
      } else {
        const target = targets[0];
        this.applyDamage(target, damage, tower.type);
        this.renderer.addAttackLine(tower.pixelPosition, target.position, config.color);
      }
    }
  }

  private findTargetsInRange(tower: Tower, rangePixels: number): Monster[] {
    const inRange: Monster[] = [];
    for (const monster of this.state.monsters) {
      const dx = monster.position.x - tower.pixelPosition.x;
      const dy = monster.position.y - tower.pixelPosition.y;
      if (dx * dx + dy * dy <= rangePixels * rangePixels) {
        inRange.push(monster);
      }
    }
    inRange.sort((a, b) => b.pathProgress - a.pathProgress);
    return inRange;
  }

  private applyDamage(monster: Monster, rawDamage: number, element: ElementType): void {
    const resistance = monster.resistances[element] || 0;
    const damage = rawDamage * (1 - resistance);
    monster.health -= damage;
    monster.hitFlash = 0.1;
    this.state.totalDamageDealt += damage;
    this.spawnElementParticles(monster, element);

    const config = TOWER_CONFIGS[element as TowerType];
    if (config && config.effect) {
      switch (config.effect.type) {
        case 'slow':
          monster.effects.frost.remaining = config.effect.duration;
          monster.effects.frost.slowFactor = config.effect.factor || 0.5;
          break;
        case 'burn':
          monster.effects.fire.remaining = config.effect.duration;
          monster.effects.fire.damagePerSecond = config.effect.damagePerSecond || 0;
          break;
        case 'stun':
          if (Math.random() < (config.effect.chance || 0)) {
            monster.effects.lightning.remaining = config.effect.duration;
          }
          break;
      }
    }
  }

  private updateMonsters(deltaTime: number): void {
    for (let i = this.state.monsters.length - 1; i >= 0; i--) {
      const monster = this.state.monsters[i];

      if (monster.health <= 0) {
        this.state.kills += 1;
        this.state.energy += MONSTER_CONFIGS[monster.type].reward;
        this.state.monsters.splice(i, 1);
        continue;
      }

      if (monster.effects.frost.remaining > 0) {
        monster.effects.frost.remaining -= deltaTime;
        if (monster.effects.frost.remaining <= 0) {
          monster.effects.frost.slowFactor = 1;
        }
      }
      if (monster.effects.fire.remaining > 0) {
        monster.health -= monster.effects.fire.damagePerSecond * deltaTime;
        monster.effects.fire.remaining -= deltaTime;
        if (Math.random() < 0.3) {
          this.spawnElementParticles(monster, 'fire');
        }
      }
      if (monster.effects.frost.remaining > 0 && Math.random() < 0.2) {
        this.spawnElementParticles(monster, 'frost');
      }
      if (monster.effects.lightning.remaining > 0) {
        monster.effects.lightning.remaining -= deltaTime;
      }

      const isStunned = monster.effects.lightning.remaining > 0;
      if (!isStunned) {
        const slowMultiplier = monster.effects.frost.slowFactor;
        const actualSpeed = monster.baseSpeed * slowMultiplier;
        const pathLength = this.state.path.length - 1;
        const progressDelta = (actualSpeed * deltaTime) / (pathLength * HEX_SIZE * 1.5);
        monster.pathProgress = Math.min(1, monster.pathProgress + progressDelta);
        monster.position = getPositionOnPath(monster.pathProgress, this.state.path, HEX_SIZE);
      }

      monster.trail.unshift({ x: monster.position.x, y: monster.position.y, alpha: 1 });
      if (monster.trail.length > TRAIL_LENGTH) {
        monster.trail.pop();
      }
      for (let j = 0; j < monster.trail.length; j++) {
        monster.trail[j].alpha = 1 - j / TRAIL_LENGTH;
      }

      if (monster.pathProgress >= 1) {
        this.state.lives -= 1;
        this.state.monsters.splice(i, 1);
        if (this.state.lives <= 0) {
          this.state.phase = 'gameOver';
        }
      }
    }
  }

  private updateParticles(deltaTime: number): void {
    for (let i = this.state.particles.length - 1; i >= 0; i--) {
      const p = this.state.particles[i];
      p.x += p.vx * deltaTime;
      p.y += p.vy * deltaTime;
      p.vy += 100 * deltaTime;
      p.life -= deltaTime;
      if (p.life <= 0) {
        this.state.particles.splice(i, 1);
      }
    }
  }

  private checkWaveEnd(): void {
    if (this.state.phase !== 'playing') return;
    if (this.state.monstersToSpawn > 0) return;
    if (this.state.monsters.length > 0) return;

    if (this.state.currentWave >= TOTAL_WAVES) {
      this.state.phase = 'victory';
    } else {
      this.state.phase = 'waveComplete';
      this.state.waveCountdown = WAVE_PREP_TIME;
    }
  }

  private notifyChange(): void {
    this.onStateChange({ ...this.state });
  }
}
