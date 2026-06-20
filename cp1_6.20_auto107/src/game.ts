import { HexGrid, HexCoord } from './grid';
import {
  UnitData, Skill, createUnit, isAlive,
  calculateDamage, rollHit, applyDamage, applyHeal, applyShield
} from './unit';
import { EffectsSystem } from './effects';

export type GamePhase = 'deploy' | 'battle' | 'gameOver';
export type ActionType = 'move' | 'skill' | 'none';

export interface BattleLog {
  timestamp: string;
  round: number;
  unitId: string;
  unitName: string;
  team: 'player' | 'enemy';
  action: 'move' | 'skill';
  skillName?: string;
  from: { col: number; row: number };
  to: { col: number; row: number };
  targets: {
    unitId: string;
    unitName: string;
    damage?: number;
    heal?: number;
    shield?: number;
    hit: boolean;
  }[];
}

export interface BattleSummary {
  rounds: number;
  playerRemaining: number;
  enemyRemaining: number;
  totalDamageDealt: number;
  totalDamageReceived: number;
  skillHitRate: number;
  logs: BattleLog[];
}

export interface GameStats {
  totalDamageDealt: number;
  totalDamageReceived: number;
  skillAttempts: number;
  skillHits: number;
  skillsUsed: number;
}

type GameEventListener = (event: string, data?: unknown) => void;

export class Game {
  grid: HexGrid;
  effects: EffectsSystem;

  phase: GamePhase = 'deploy';
  units: UnitData[] = [];
  round = 0;
  actionQueue: UnitData[] = [];
  currentUnitIndex = -1;
  selectedUnit: UnitData | null = null;
  actionType: ActionType = 'none';
  selectedSkill: Skill | null = null;

  battleLogs: BattleLog[] = [];
  stats: GameStats = {
    totalDamageDealt: 0,
    totalDamageReceived: 0,
    skillAttempts: 0,
    skillHits: 0,
    skillsUsed: 0
  };

  winner: 'player' | 'enemy' | null = null;

  private listeners: GameEventListener[] = [];

  constructor(grid: HexGrid, effects: EffectsSystem) {
    this.grid = grid;
    this.effects = effects;
  }

  onEvent(listener: GameEventListener): void {
    this.listeners.push(listener);
  }

  private emit(event: string, data?: unknown): void {
    for (const l of this.listeners) {
      l(event, data);
    }
  }

  deployUnit(team: 'player' | 'enemy', template: string, col: number, row: number): UnitData | null {
    if (this.phase !== 'deploy') return null;
    if (!this.grid.isValid({ col, row })) return null;
    if (this.getUnitAt(col, row)) return null;
    if (this.units.filter(u => u.team === team && isAlive(u)).length >= 5) return null;

    const unit = createUnit(team, template, col, row);
    this.units.push(unit);
    this.emit('unitDeployed', unit);
    return unit;
  }

  startBattle(): void {
    if (this.phase !== 'deploy') return;
    const playerCount = this.units.filter(u => u.team === 'player' && isAlive(u)).length;
    const enemyCount = this.units.filter(u => u.team === 'enemy' && isAlive(u)).length;
    if (playerCount === 0 || enemyCount === 0) return;

    this.phase = 'battle';
    this.round = 1;
    this.buildActionQueue();
    this.currentUnitIndex = 0;
    this.emit('battleStart');

    if (this.getCurrentUnit().team === 'enemy') {
      this.emit('aiTurnStart');
    }
  }

  private buildActionQueue(): void {
    const alive = this.units.filter(u => isAlive(u));
    alive.sort((a, b) => {
      const spdDiff = b.spd - a.spd;
      if (spdDiff !== 0) return spdDiff;
      return Math.random() - 0.5;
    });
    this.actionQueue = alive;
  }

  getCurrentUnit(): UnitData {
    return this.actionQueue[this.currentUnitIndex];
  }

  selectUnit(unit: UnitData): void {
    this.selectedUnit = unit;
    this.actionType = 'none';
    this.selectedSkill = null;
    this.emit('unitSelected', unit);
  }

  getReachableHexes(unit: UnitData): HexCoord[] {
    const obstacles = this.units.filter(u => u.id !== unit.id && isAlive(u))
      .map(u => ({ col: u.col, row: u.row }));
    return this.grid.getReachableRange(
      { col: unit.col, row: unit.row },
      unit.moveRange,
      obstacles
    );
  }

  moveUnit(unit: UnitData, col: number, row: number): void {
    if (this.phase !== 'battle') return;
    const reachable = this.getReachableHexes(unit);
    if (!reachable.some(h => h.col === col && h.row === row)) return;
    if (this.getUnitAt(col, row)) return;

    const from = { col: unit.col, row: unit.row };
    unit.col = col;
    unit.row = row;

    this.addLog({
      timestamp: new Date().toISOString(),
      round: this.round,
      unitId: unit.id,
      unitName: unit.name,
      team: unit.team,
      action: 'move',
      from,
      to: { col, row },
      targets: []
    });

    this.emit('unitMoved', unit);
    this.endTurn();
  }

  useSkill(actor: UnitData, skill: Skill, targetCoord: HexCoord): void {
    if (this.phase !== 'battle') return;

    const dist = this.grid.hexDistance(
      { col: actor.col, row: actor.row },
      targetCoord
    );
    if (dist > skill.range + skill.aoeRadius) return;

    let affectedHexes: HexCoord[];
    if (skill.aoeType === 'single') {
      affectedHexes = [targetCoord];
    } else if (skill.aoeType === 'circle') {
      affectedHexes = this.grid.getHexesInCircle(targetCoord, skill.aoeRadius);
      affectedHexes.push(targetCoord);
    } else {
      const dx = this.grid.hexToPixel(targetCoord.col, targetCoord.row).x -
                 this.grid.hexToPixel(actor.col, actor.row).x;
      const dy = this.grid.hexToPixel(targetCoord.col, targetCoord.row).y -
                 this.grid.hexToPixel(actor.col, actor.row).y;
      const angle = Math.atan2(dy, dx);
      affectedHexes = this.grid.getHexesInFan(
        { col: actor.col, row: actor.row },
        angle,
        Math.PI / 2,
        skill.range
      );
    }

    const targets: BattleLog['targets'] = [];

    for (const hex of affectedHexes) {
      const targetUnit = this.getUnitAt(hex.col, hex.row);
      if (!targetUnit || !isAlive(targetUnit)) continue;

      if (skill.type === 'damage' && targetUnit.team !== actor.team) {
        this.stats.skillAttempts++;
        const hit = rollHit(skill.hitRate);
        if (hit) {
          this.stats.skillHits++;
          const rawDmg = calculateDamage(skill.value, targetUnit.def);
          const result = applyDamage(targetUnit, rawDmg);
          targets.push({
            unitId: targetUnit.id,
            unitName: targetUnit.name,
            damage: result.damage,
            hit: true
          });
          if (actor.team === 'player') {
            this.stats.totalDamageDealt += result.damage;
          } else {
            this.stats.totalDamageReceived += result.damage;
          }
          const tp = this.grid.hexToPixel(targetUnit.col, targetUnit.row);
          this.effects.emitFireBurst(tp.x, tp.y);
        } else {
          targets.push({
            unitId: targetUnit.id,
            unitName: targetUnit.name,
            damage: 0,
            hit: false
          });
        }
      } else if (skill.type === 'heal' && targetUnit.team === actor.team) {
        const healed = applyHeal(targetUnit, skill.value);
        targets.push({
          unitId: targetUnit.id,
          unitName: targetUnit.name,
          heal: healed,
          hit: true
        });
        const tp = this.grid.hexToPixel(targetUnit.col, targetUnit.row);
        this.effects.emitHealWave(tp.x, tp.y);
      } else if (skill.type === 'shield' && targetUnit.team === actor.team) {
        const shielded = applyShield(targetUnit, skill.value);
        targets.push({
          unitId: targetUnit.id,
          unitName: targetUnit.name,
          shield: shielded,
          hit: true
        });
        const tp = this.grid.hexToPixel(targetUnit.col, targetUnit.row);
        this.effects.emitShieldAura(tp.x, tp.y);
      }
    }

    this.stats.skillsUsed++;

    this.addLog({
      timestamp: new Date().toISOString(),
      round: this.round,
      unitId: actor.id,
      unitName: actor.name,
      team: actor.team,
      action: 'skill',
      skillName: skill.name,
      from: { col: actor.col, row: actor.row },
      to: targetCoord,
      targets
    });

    this.emit('skillUsed', { actor, skill, targets });
    this.endTurn();
  }

  private endTurn(): void {
    this.selectedUnit = null;
    this.actionType = 'none';
    this.selectedSkill = null;

    if (this.checkGameOver()) return;

    this.currentUnitIndex++;
    if (this.currentUnitIndex >= this.actionQueue.length) {
      this.round++;
      this.decayShields();
      this.buildActionQueue();
      this.currentUnitIndex = 0;
      this.emit('newRound', this.round);
    }

    while (this.currentUnitIndex < this.actionQueue.length &&
           !isAlive(this.actionQueue[this.currentUnitIndex])) {
      this.currentUnitIndex++;
    }

    if (this.currentUnitIndex >= this.actionQueue.length) {
      this.round++;
      this.buildActionQueue();
      this.currentUnitIndex = 0;
      this.emit('newRound', this.round);
    }

    this.emit('turnChanged');

    if (this.getCurrentUnit().team === 'enemy') {
      this.emit('aiTurnStart');
    }
  }

  private decayShields(): void {
    for (const unit of this.units) {
      if (isAlive(unit)) {
        unit.shield = Math.max(0, Math.floor(unit.shield * 0.5));
      }
    }
  }

  executeAITurn(): void {
    const unit = this.getCurrentUnit();
    if (!unit || unit.team !== 'enemy') return;

    const enemies = this.units.filter(u => u.team === 'player' && isAlive(u));
    if (enemies.length === 0) return;

    const allies = this.units.filter(u => u.team === 'enemy' && isAlive(u));

    const healSkill = unit.skills.find(s => s.type === 'heal');
    const hurtAlly = allies
      .filter(a => a.hp < a.maxHp * 0.5)
      .sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp))[0];

    if (healSkill && hurtAlly) {
      const dist = this.grid.hexDistance(
        { col: unit.col, row: unit.row },
        { col: hurtAlly.col, row: hurtAlly.row }
      );
      if (dist <= healSkill.range) {
        this.useSkill(unit, healSkill, { col: hurtAlly.col, row: hurtAlly.row });
        return;
      }
    }

    const shieldSkill = unit.skills.find(s => s.type === 'shield');
    const lowAlly = allies
      .filter(a => a.shield === 0)
      .sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp))[0];

    if (shieldSkill && lowAlly) {
      const dist = this.grid.hexDistance(
        { col: unit.col, row: unit.row },
        { col: lowAlly.col, row: lowAlly.row }
      );
      if (dist <= shieldSkill.range) {
        this.useSkill(unit, shieldSkill, { col: lowAlly.col, row: lowAlly.row });
        return;
      }
    }

    const damageSkills = unit.skills.filter(s => s.type === 'damage')
      .sort((a, b) => b.value - a.value);

    for (const skill of damageSkills) {
      const targetsInRange = enemies
        .filter(e => {
          const dist = this.grid.hexDistance(
            { col: unit.col, row: unit.row },
            { col: e.col, row: e.row }
          );
          return dist <= skill.range + skill.aoeRadius;
        })
        .sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp));

      if (targetsInRange.length > 0) {
        const target = targetsInRange[0];
        this.useSkill(unit, skill, { col: target.col, row: target.row });
        return;
      }
    }

    const reachable = this.getReachableHexes(unit);
    if (reachable.length > 0) {
      const closestEnemy = enemies.sort((a, b) => {
        const da = this.grid.hexDistance({ col: unit.col, row: unit.row }, { col: a.col, row: a.row });
        const db = this.grid.hexDistance({ col: unit.col, row: unit.row }, { col: b.col, row: b.row });
        return da - db;
      })[0];

      let bestHex = reachable[0];
      let bestDist = Infinity;
      for (const hex of reachable) {
        const dist = this.grid.hexDistance(hex, { col: closestEnemy.col, row: closestEnemy.row });
        if (dist < bestDist) {
          bestDist = dist;
          bestHex = hex;
        }
      }
      this.moveUnit(unit, bestHex.col, bestHex.row);
      return;
    }

    this.endTurn();
  }

  private checkGameOver(): boolean {
    const playerAlive = this.units.filter(u => u.team === 'player' && isAlive(u)).length;
    const enemyAlive = this.units.filter(u => u.team === 'enemy' && isAlive(u)).length;

    if (playerAlive === 0) {
      this.phase = 'gameOver';
      this.winner = 'enemy';
      this.emit('gameOver', 'enemy');
      return true;
    }
    if (enemyAlive === 0) {
      this.phase = 'gameOver';
      this.winner = 'player';
      this.emit('gameOver', 'player');
      return true;
    }
    return false;
  }

  getSkillRangeHexes(unit: UnitData, skill: Skill): HexCoord[] {
    const result: HexCoord[] = [];
    for (let row = 0; row < this.grid.rows; row++) {
      for (let col = 0; col < this.grid.cols; col++) {
        const dist = this.grid.hexDistance(
          { col: unit.col, row: unit.row },
          { col, row }
        );
        if (dist > 0 && dist <= skill.range) {
          result.push({ col, row });
        }
      }
    }
    return result;
  }

  getUnitAt(col: number, row: number): UnitData | undefined {
    return this.units.find(u => u.col === col && u.row === row && isAlive(u));
  }

  private addLog(log: BattleLog): void {
    this.battleLogs.push(log);
    this.emit('logAdded', log);
  }

  getBattleSummary(): BattleSummary {
    const playerAlive = this.units.filter(u => u.team === 'player' && isAlive(u)).length;
    const enemyAlive = this.units.filter(u => u.team === 'enemy' && isAlive(u)).length;
    return {
      rounds: this.round,
      playerRemaining: playerAlive,
      enemyRemaining: enemyAlive,
      totalDamageDealt: this.stats.totalDamageDealt,
      totalDamageReceived: this.stats.totalDamageReceived,
      skillHitRate: this.stats.skillAttempts > 0
        ? this.stats.skillHits / this.stats.skillAttempts
        : 0,
      logs: this.battleLogs
    };
  }

  reset(): void {
    this.phase = 'deploy';
    this.units = [];
    this.round = 0;
    this.actionQueue = [];
    this.currentUnitIndex = -1;
    this.selectedUnit = null;
    this.actionType = 'none';
    this.selectedSkill = null;
    this.battleLogs = [];
    this.winner = null;
    this.stats = {
      totalDamageDealt: 0,
      totalDamageReceived: 0,
      skillAttempts: 0,
      skillHits: 0,
      skillsUsed: 0
    };
    this.effects.particles = [];
    this.emit('gameReset');
  }
}
