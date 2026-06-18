import {
  Monster,
  Guard,
  Trap,
  Position,
  MonsterType,
  GuardType,
  TrapType,
  CoinAnimation,
  ExplosionAnimation,
  CellType,
  GRID_SIZE,
} from './types';
import { WaveManager } from './WaveManager';
import { findPath, generateMap } from './MapGenerator';

export class GameEngine {
  private waveManager: WaveManager;
  private map: CellType[][];
  private monsters: Monster[] = [];
  private guards: Guard[] = [];
  private traps: Trap[] = [];
  private coins: CoinAnimation[] = [];
  private explosions: ExplosionAnimation[] = [];
  private gold: number;
  private lives: number;
  private currentWave: number = 0;
  private totalKills: number = 0;
  private totalGoldEarned: number = 0;
  private waveInProgress: boolean = false;
  private entrance: Position = { x: 0, y: 0 };
  private exit: Position = { x: GRID_SIZE - 1, y: GRID_SIZE - 1 };
  private monsterIdCounter: number = 0;

  constructor(initialGold: number, initialLives: number) {
    this.waveManager = new WaveManager();
    this.gold = initialGold;
    this.lives = initialLives;
    this.map = generateMap();
    this.findEntranceExit();
  }

  private findEntranceExit(): void {
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (this.map[y][x] === 'entrance') {
          this.entrance = { x, y };
        } else if (this.map[y][x] === 'exit') {
          this.exit = { x, y };
        }
      }
    }
  }

  public getMap(): CellType[][] {
    return this.map;
  }

  public getState() {
    return {
      gold: this.gold,
      lives: this.lives,
      currentWave: this.currentWave,
      monsters: this.monsters,
      guards: this.guards,
      traps: this.traps,
      coins: this.coins,
      explosions: this.explosions,
      totalKills: this.totalKills,
      totalGoldEarned: this.totalGoldEarned,
      waveInProgress: this.waveInProgress,
      entrance: this.entrance,
      exit: this.exit,
    };
  }

  public canPlaceTrap(position: Position): boolean {
    if (this.map[position.y]?.[position.x] !== 'trap_area') return false;
    return !this.traps.some(
      (t) => t.position.x === position.x && t.position.y === position.y
    );
  }

  public canPlaceGuard(position: Position): boolean {
    if (this.map[position.y]?.[position.x] !== 'trap_area') return false;
    const occupied =
      this.traps.some(
        (t) => t.position.x === position.x && t.position.y === position.y
      ) ||
      this.guards.some(
        (g) => g.position.x === position.x && g.position.y === position.y
      );
    return !occupied;
  }

  public placeTrap(type: TrapType, position: Position, cost: number): boolean {
    if (!this.canPlaceTrap(position) || this.gold < cost) return false;

    this.gold -= cost;
    this.traps.push({
      id: `trap-${Date.now()}-${Math.random()}`,
      type,
      position,
      cooldown: 0,
      triggered: false,
    });
    return true;
  }

  public placeGuard(type: GuardType, position: Position, cost: number): boolean {
    if (!this.canPlaceGuard(position) || this.gold < cost) return false;

    this.gold -= cost;
    const guard = this.createGuard(type, position);
    this.guards.push(guard);
    return true;
  }

  private createGuard(type: GuardType, position: Position): Guard {
    switch (type) {
      case 'swordsman':
        return {
          id: `guard-${Date.now()}-${Math.random()}`,
          type,
          position,
          attackRange: 1.5,
          attackDamage: 30,
          attackSpeed: 1,
          lastAttackTime: 0,
          damageType: 'physical',
        };
      case 'archer':
        return {
          id: `guard-${Date.now()}-${Math.random()}`,
          type,
          position,
          attackRange: 4,
          attackDamage: 20,
          attackSpeed: 1.5,
          lastAttackTime: 0,
          damageType: 'physical',
        };
      case 'mage':
        return {
          id: `guard-${Date.now()}-${Math.random()}`,
          type,
          position,
          attackRange: 3,
          attackDamage: 15,
          attackSpeed: 1,
          lastAttackTime: 0,
          damageType: 'magical',
          slowEffect: true,
        };
    }
  }

  public spawnMonster(type: MonsterType, position: Position): void {
    const stats = this.waveManager.getMonsterStats(type);
    const path = findPath(this.map, this.entrance, this.exit);

    this.monsters.push({
      id: `monster-${this.monsterIdCounter++}`,
      type,
      position: { ...position },
      currentHp: stats.hp,
      maxHp: stats.hp,
      speed: stats.speed,
      baseSpeed: stats.speed,
      path,
      currentPathIndex: 0,
      slowTimer: 0,
      dotTimer: 0,
      dotDamage: 0,
      immuneToPhysical: stats.immuneToPhysical,
      goldDrop: stats.goldDrop,
      alive: true,
    });
  }

  public startWave(): boolean {
    if (this.waveInProgress || this.currentWave >= 10) return false;
    this.currentWave++;
    this.waveInProgress = true;
    this.waveManager.startWave(this.currentWave);
    return true;
  }

  public update(deltaTime: number): { livesLost: number; gameOver: boolean } {
    const dt = deltaTime / 1000;
    let livesLost = 0;

    if (this.waveInProgress) {
      this.waveManager.update(
        deltaTime,
        (type, pos) => this.spawnMonster(type, pos),
        this.entrance
      );
    }

    for (const monster of this.monsters) {
      if (!monster.alive) continue;

      if (monster.slowTimer > 0) {
        monster.slowTimer -= deltaTime;
        monster.speed = monster.baseSpeed * 0.5;
      } else {
        monster.speed = monster.baseSpeed;
      }

      if (monster.dotTimer > 0) {
        monster.dotTimer -= deltaTime;
        monster.currentHp -= monster.dotDamage * dt;
      }

      if (monster.currentPathIndex < monster.path.length) {
        const target = monster.path[monster.currentPathIndex];
        const dx = target.x - monster.position.x;
        const dy = target.y - monster.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 0.05) {
          monster.currentPathIndex++;
          monster.position.x = target.x;
          monster.position.y = target.y;
        } else {
          monster.position.x += (dx / dist) * monster.speed * dt;
          monster.position.y += (dy / dist) * monster.speed * dt;
        }
      }

      if (
        monster.currentPathIndex >= monster.path.length ||
        (Math.abs(monster.position.x - this.exit.x) < 0.3 &&
          Math.abs(monster.position.y - this.exit.y) < 0.3)
      ) {
        monster.alive = false;
        livesLost++;
        this.lives--;
      }

      for (const trap of this.traps) {
        const tdx = trap.position.x - monster.position.x;
        const tdy = trap.position.y - monster.position.y;
        const tdist = Math.sqrt(tdx * tdx + tdy * tdy);

        if (tdist < 0.6 && trap.cooldown <= 0) {
          this.applyTrapEffect(trap, monster);
          trap.cooldown = 1000;
          trap.triggered = true;
        }
      }

      if (monster.currentHp <= 0 && monster.alive) {
        monster.alive = false;
        this.totalKills++;
        this.addCoin(monster.position, monster.goldDrop);
      }
    }

    for (const trap of this.traps) {
      if (trap.cooldown > 0) {
        trap.cooldown -= deltaTime;
        if (trap.cooldown <= 0) {
          trap.triggered = false;
        }
      }
    }

    const now = Date.now();
    for (const guard of this.guards) {
      const attackInterval = 1000 / guard.attackSpeed;
      if (now - guard.lastAttackTime < attackInterval) continue;

      let target: Monster | null = null;
      let minDist = Infinity;

      for (const monster of this.monsters) {
        if (!monster.alive) continue;
        if (guard.damageType === 'physical' && monster.immuneToPhysical) continue;

        const dx = monster.position.x - guard.position.x;
        const dy = monster.position.y - guard.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= guard.attackRange && dist < minDist) {
          minDist = dist;
          target = monster;
        }
      }

      if (target) {
        guard.lastAttackTime = now;

        if (guard.type === 'mage') {
          for (const monster of this.monsters) {
            if (!monster.alive) continue;
            if (monster.immuneToPhysical && guard.damageType === 'physical') continue;
            const dx = monster.position.x - target.position.x;
            const dy = monster.position.y - target.position.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= 1.5) {
              monster.currentHp -= guard.attackDamage;
              if (guard.slowEffect) {
                monster.slowTimer = Math.max(monster.slowTimer, 2000);
              }
            }
          }
        } else {
          target.currentHp -= guard.attackDamage;
        }
      }
    }

    this.monsters = this.monsters.filter((m) => m.alive);

    const coinExpireTime = 500;
    this.coins = this.coins.filter((c) => now - c.createdAt < coinExpireTime);

    const explosionExpireTime = 300;
    this.explosions = this.explosions.filter(
      (e) => now - e.createdAt < explosionExpireTime
    );

    if (
      this.waveInProgress &&
      this.waveManager.isWaveComplete() &&
      this.monsters.length === 0
    ) {
      this.waveInProgress = false;
    }

    return { livesLost, gameOver: this.lives <= 0 };
  }

  private applyTrapEffect(trap: Trap, monster: Monster): void {
    switch (trap.type) {
      case 'spike':
        monster.dotTimer = 3000;
        monster.dotDamage = 10;
        break;
      case 'freeze':
        monster.slowTimer = Math.max(monster.slowTimer, 5000);
        break;
      case 'bomb':
        this.explosions.push({
          id: `exp-${Date.now()}-${Math.random()}`,
          position: { ...trap.position },
          createdAt: Date.now(),
        });
        for (const m of this.monsters) {
          if (!m.alive) continue;
          const dx = m.position.x - trap.position.x;
          const dy = m.position.y - trap.position.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist <= 2) {
            m.currentHp -= 80;
          }
        }
        this.traps = this.traps.filter((t) => t.id !== trap.id);
        break;
    }
  }

  private addCoin(position: Position, value: number): void {
    this.gold += value;
    this.totalGoldEarned += value;
    this.coins.push({
      id: `coin-${Date.now()}-${Math.random()}`,
      position: { ...position },
      value,
      createdAt: Date.now(),
    });
  }

  public reset(initialGold: number, initialLives: number): void {
    this.gold = initialGold;
    this.lives = initialLives;
    this.currentWave = 0;
    this.totalKills = 0;
    this.totalGoldEarned = 0;
    this.waveInProgress = false;
    this.monsters = [];
    this.guards = [];
    this.traps = [];
    this.coins = [];
    this.explosions = [];
    this.waveManager.reset();
    this.map = generateMap();
    this.findEntranceExit();
    this.monsterIdCounter = 0;
  }
}
