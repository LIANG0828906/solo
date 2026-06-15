import { Unit, StrategyType, UnitPosition } from './unit';
import { HexGrid, HexCoord } from './hexGrid';

export interface BattleStats {
  totalDamage: number;
  longestKillStreak: number;
  allySurvivors: number;
  enemySurvivors: number;
  mvpUnit: Unit | null;
}

export interface DamageNumber {
  id: number;
  x: number;
  y: number;
  damage: number;
  timer: number;
  maxTimer: number;
  isHeal: boolean;
}

export interface MoraleEffect {
  id: number;
  x: number;
  y: number;
  timer: number;
  maxTimer: number;
  startRadius: number;
  endRadius: number;
}

export interface StrategyIcon {
  id: number;
  unitId: string;
  x: number;
  y: number;
  timer: number;
  maxTimer: number;
  strategy: StrategyType;
}

type BattleState = 'idle' | 'fighting' | 'finished';

export class BattleSystem {
  private units: Unit[] = [];
  private hexGrid: HexGrid;
  private battleState: BattleState = 'idle';
  private currentUnitIndex: number = 0;
  private actionQueue: Unit[] = [];
  private currentActionUnit: Unit | null = null;
  private actionTimer: number = 0;
  private actionDelay: number = 0.5;
  
  private totalDamage: number = 0;
  private longestKillStreak: number = 0;
  
  private damageNumbers: DamageNumber[] = [];
  private moraleEffects: MoraleEffect[] = [];
  private strategyIcons: StrategyIcon[] = [];
  
  private nextId: number = 1;
  private nextStrategyIconId: number = 1;

  constructor(hexGrid: HexGrid) {
    this.hexGrid = hexGrid;
  }

  public addUnit(unit: Unit): void {
    this.units.push(unit);
    
    unit.on('damage', (data: { damage: number; attacker?: Unit }) => {
      this.totalDamage += data.damage;
      this.addDamageNumber(
        unit.getPixelX(),
        unit.getPixelY() - 20,
        data.damage,
        false
      );
    });
    
    unit.on('heal', (data: { amount: number; healer?: Unit }) => {
      this.addDamageNumber(
        unit.getPixelX(),
        unit.getPixelY() - 20,
        data.amount,
        true
      );
    });
    
    unit.on('moraleTrigger', () => {
      this.addMoraleEffect(unit.getPixelX(), unit.getPixelY());
    });
    
    unit.on('death', () => {
      const killer = this.getLastKiller(unit);
      if (killer) {
        if (killer.getMaxConsecutiveKills() > this.longestKillStreak) {
          this.longestKillStreak = killer.getMaxConsecutiveKills();
        }
      }
      this.checkBattleEnd();
    });
  }

  public removeUnit(unitId: string): void {
    const idx = this.units.findIndex(u => u.getId() === unitId);
    if (idx > -1) {
      this.units.splice(idx, 1);
    }
  }

  public getUnits(): Unit[] {
    return this.units;
  }

  public getUnitById(id: string): Unit | null {
    return this.units.find(u => u.getId() === id) || null;
  }

  public getUnitsAt(col: number, row: number): Unit[] {
    return this.units.filter(u => u.getPosition().col === col && u.getPosition().row === row && u.getIsAlive());
  }

  public startBattle(): void {
    if (this.battleState === 'fighting') return;
    
    this.battleState = 'fighting';
    this.totalDamage = 0;
    this.longestKillStreak = 0;
    this.damageNumbers = [];
    this.moraleEffects = [];
    
    this.actionQueue = this.units
      .filter(u => u.getIsAlive())
      .sort((a, b) => b.getStats().speed - a.getStats().speed);
    
    this.currentUnitIndex = 0;
    this.currentActionUnit = null;
    this.actionTimer = 0;
  }

  public stopBattle(): void {
    this.battleState = 'idle';
    this.currentActionUnit = null;
  }

  public resetBattle(): void {
    this.battleState = 'idle';
    this.actionQueue = [];
    this.currentUnitIndex = 0;
    this.currentActionUnit = null;
    this.damageNumbers = [];
    this.moraleEffects = [];
    this.totalDamage = 0;
    this.longestKillStreak = 0;
  }

  public getBattleState(): BattleState {
    return this.battleState;
  }

  public getCurrentActionUnit(): Unit | null {
    return this.currentActionUnit;
  }

  public update(dt: number): void {
    for (const unit of this.units) {
      unit.updateMovement(dt);
      unit.updateAttackFlash(dt);
      unit.updateMorale(dt);
    }
    
    this.updateDamageNumbers(dt);
    this.updateMoraleEffects(dt);
    this.updateStrategyIcons(dt);
    
    if (this.battleState !== 'fighting') return;
    
    this.actionTick(dt);
  }

  private actionTick(dt: number): void {
    if (this.actionQueue.length === 0) {
      this.endBattle();
      return;
    }
    
    if (this.currentActionUnit && this.currentActionUnit.getIsMoving()) {
      return;
    }
    
    if (this.actionTimer > 0) {
      this.actionTimer -= dt;
      return;
    }
    
    this.currentActionUnit = this.getNextUnit();
    
    if (!this.currentActionUnit || !this.currentActionUnit.getIsAlive()) {
      return;
    }
    
    this.executeUnitAction(this.currentActionUnit);
    this.actionTimer = this.actionDelay;
  }

  private getNextUnit(): Unit | null {
    if (this.actionQueue.length === 0) {
      this.actionQueue = this.units
        .filter(u => u.getIsAlive())
        .sort((a, b) => b.getStats().speed - a.getStats().speed);
      this.currentUnitIndex = 0;
    }
    
    while (this.currentUnitIndex < this.actionQueue.length) {
      const unit = this.actionQueue[this.currentUnitIndex];
      this.currentUnitIndex++;
      if (unit.getIsAlive()) {
        return unit;
      }
    }
    
    this.actionQueue = this.units
      .filter(u => u.getIsAlive())
      .sort((a, b) => b.getStats().speed - a.getStats().speed);
    this.currentUnitIndex = 0;
    
    if (this.actionQueue.length === 0) {
      return null;
    }
    
    return this.getNextUnit();
  }

  private executeUnitAction(unit: Unit): void {
    const strategy = this.getActiveStrategy(unit);
    
    switch (strategy) {
      case 'attack_low_hp':
        this.executeAttackLowHp(unit);
        break;
      case 'attack_closest':
        this.executeAttackClosest(unit);
        break;
      case 'attack_ranged':
        this.executeAttackRanged(unit);
        break;
      case 'defend_ally':
        this.executeDefendAlly(unit);
        break;
      case 'capture_point':
        this.executeCapturePoint(unit);
        break;
      case 'heal_ally':
        this.executeHealAlly(unit);
        break;
      default:
        this.executeAttackClosest(unit);
    }
  }

  private getActiveStrategy(unit: Unit): StrategyType {
    const strategies = unit.getStrategies().filter(s => s !== 'none');
    return strategies[0] || 'attack_closest';
  }

  private getEnemyUnits(unit: Unit): Unit[] {
    return this.units.filter(u => u.getTeam() !== unit.getTeam() && u.getIsAlive());
  }

  private getAllyUnits(unit: Unit): Unit[] {
    return this.units.filter(u => u.getTeam() === unit.getTeam() && u.getId() !== unit.getId() && u.getIsAlive());
  }

  private executeAttackLowHp(unit: Unit): void {
    const enemies = this.getEnemyUnits(unit);
    if (enemies.length === 0) return;
    
    const unitPos = unit.getPosition();
    const inRange = enemies.filter(e => {
      const dist = this.hexGrid.hexDistance(unitPos, e.getPosition());
      return dist <= unit.getStats().attackRange;
    });
    
    if (inRange.length > 0) {
      const target = inRange.reduce((lowest, e) => 
        e.getCurrentHp() < lowest.getCurrentHp() ? e : lowest
      );
      unit.attackTarget(target);
    } else {
      const target = enemies.reduce((lowest, e) => 
        e.getCurrentHp() < lowest.getCurrentHp() ? e : lowest
      );
      this.moveTowardsTarget(unit, target);
    }
  }

  private executeAttackClosest(unit: Unit): void {
    const enemies = this.getEnemyUnits(unit);
    if (enemies.length === 0) return;
    
    const unitPos = unit.getPosition();
    let closest = enemies[0];
    let closestDist = this.hexGrid.hexDistance(unitPos, closest.getPosition());
    
    for (const e of enemies) {
      const dist = this.hexGrid.hexDistance(unitPos, e.getPosition());
      if (dist < closestDist) {
        closest = e;
        closestDist = dist;
      }
    }
    
    if (closestDist <= unit.getStats().attackRange) {
      unit.attackTarget(closest);
    } else {
      this.moveTowardsTarget(unit, closest);
    }
  }

  private executeAttackRanged(unit: Unit): void {
    const enemies = this.getEnemyUnits(unit);
    if (enemies.length === 0) return;
    
    const unitPos = unit.getPosition();
    const rangedEnemies = enemies.filter(e => e.getStats().attackRange > 1);
    
    if (rangedEnemies.length > 0) {
      const closestRanged = rangedEnemies.reduce((closest, e) => {
        const distClosest = this.hexGrid.hexDistance(unitPos, closest.getPosition());
        const distE = this.hexGrid.hexDistance(unitPos, e.getPosition());
        return distE < distClosest ? e : closest;
      });
      
      const dist = this.hexGrid.hexDistance(unitPos, closestRanged.getPosition());
      if (dist <= unit.getStats().attackRange) {
        unit.attackTarget(closestRanged);
      } else {
        this.moveTowardsTarget(unit, closestRanged);
      }
    } else {
      this.executeAttackClosest(unit);
    }
  }

  private executeDefendAlly(unit: Unit): void {
    const allies = this.getAllyUnits(unit);
    if (allies.length === 0) {
      this.executeAttackClosest(unit);
      return;
    }
    
    const unitPos = unit.getPosition();
    let weakestAlly = allies[0];
    let lowestHpRatio = weakestAlly.getCurrentHp() / weakestAlly.getMaxHp();
    
    for (const a of allies) {
      const ratio = a.getCurrentHp() / a.getMaxHp();
      if (ratio < lowestHpRatio) {
        lowestHpRatio = ratio;
        weakestAlly = a;
      }
    }
    
    const allyPos = weakestAlly.getPosition();
    const distToAlly = this.hexGrid.hexDistance(unitPos, allyPos);
    
    if (distToAlly <= 2) {
      this.executeAttackClosest(unit);
    } else {
      this.moveTowardsTarget(unit, weakestAlly);
    }
  }

  private executeCapturePoint(unit: Unit): void {
    const unitPos = unit.getPosition();
    const targetCol = unit.getTeam() === 'ally' ? this.hexGrid.getCols() - 1 : 0;
    const targetRow = Math.floor(this.hexGrid.getRows() / 2);
    
    const dist = this.hexGrid.hexDistance(unitPos, { col: targetCol, row: targetRow });
    
    if (dist <= 1) {
      this.executeAttackClosest(unit);
    } else {
      this.moveTowardsPosition(unit, { col: targetCol, row: targetRow });
    }
  }

  private executeHealAlly(unit: Unit): void {
    const allies = this.getAllyUnits(unit);
    if (allies.length === 0) {
      this.executeAttackClosest(unit);
      return;
    }
    
    const unitPos = unit.getPosition();
    let weakestAlly = allies[0];
    let lowestHpRatio = weakestAlly.getCurrentHp() / weakestAlly.getMaxHp();
    
    for (const a of allies) {
      const ratio = a.getCurrentHp() / a.getMaxHp();
      if (ratio < lowestHpRatio) {
        lowestHpRatio = ratio;
        weakestAlly = a;
      }
    }
    
    const distToAlly = this.hexGrid.hexDistance(unitPos, weakestAlly.getPosition());
    
    if (distToAlly <= unit.getStats().attackRange) {
      const healAmount = Math.floor(unit.getStats().attack * 0.8);
      weakestAlly.heal(healAmount, unit);
    } else {
      this.moveTowardsTarget(unit, weakestAlly);
    }
  }

  private moveTowardsTarget(unit: Unit, target: Unit): void {
    this.moveTowardsPosition(unit, target.getPosition());
  }

  private moveTowardsPosition(unit: Unit, targetPos: HexCoord): void {
    const occupied = new Set<string>();
    for (const u of this.units) {
      if (u.getId() !== unit.getId() && u.getIsAlive()) {
        const pos = u.getPosition();
        occupied.add(`${pos.col},${pos.row}`);
      }
    }
    
    const unitPos = unit.getPosition();
    const path = this.hexGrid.findPath(
      { col: unitPos.col, row: unitPos.row },
      targetPos,
      occupied
    );
    
    if (path.length > 1) {
      const moveRange = unit.getStats().moveRange;
      const stepCount = Math.min(moveRange, path.length - 1);
      const nextStep = path[stepCount];
      
      const targetPixel = this.hexGrid.getHexCenter(nextStep.col, nextStep.row);
      unit.setTargetPixelPosition(targetPixel.x, targetPixel.y);
      unit.moveToHex(nextStep.col, nextStep.row);
    }
  }

  private addDamageNumber(x: number, y: number, damage: number, isHeal: boolean): void {
    this.damageNumbers.push({
      id: this.nextId++,
      x,
      y,
      damage,
      timer: 0.6,
      maxTimer: 0.6,
      isHeal
    });
  }

  private updateDamageNumbers(dt: number): void {
    for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
      const d = this.damageNumbers[i];
      d.timer -= dt;
      d.y -= 40 * dt;
      if (d.timer <= 0) {
        this.damageNumbers.splice(i, 1);
      }
    }
  }

  public getDamageNumbers(): DamageNumber[] {
    return this.damageNumbers;
  }

  private addMoraleEffect(x: number, y: number): void {
    this.moraleEffects.push({
      id: this.nextId++,
      x,
      y,
      timer: 0.4,
      maxTimer: 0.4,
      startRadius: 5,
      endRadius: 30
    });
  }

  private updateMoraleEffects(dt: number): void {
    for (let i = this.moraleEffects.length - 1; i >= 0; i--) {
      const m = this.moraleEffects[i];
      m.timer -= dt;
      if (m.timer <= 0) {
        this.moraleEffects.splice(i, 1);
      }
    }
  }

  public getMoraleEffects(): MoraleEffect[] {
    return this.moraleEffects;
  }

  public addStrategyIcon(unitId: string, x: number, y: number, strategy: StrategyType): void {
    this.strategyIcons.push({
      id: this.nextStrategyIconId++,
      unitId,
      x,
      y,
      timer: 1,
      maxTimer: 1,
      strategy
    });
  }

  private updateStrategyIcons(dt: number): void {
    for (let i = this.strategyIcons.length - 1; i >= 0; i--) {
      const s = this.strategyIcons[i];
      s.timer -= dt;
      if (s.timer <= 0) {
        this.strategyIcons.splice(i, 1);
      }
    }
  }

  public getStrategyIcons(): StrategyIcon[] {
    return this.strategyIcons;
  }

  private getLastKiller(unit: Unit): Unit | null {
    for (const u of this.units) {
      if (u.getTeam() !== unit.getTeam() && u.getKillCount() > 0) {
        return u;
      }
    }
    return null;
  }

  private checkBattleEnd(): void {
    const allyAlive = this.units.filter(u => u.getTeam() === 'ally' && u.getIsAlive()).length;
    const enemyAlive = this.units.filter(u => u.getTeam() === 'enemy' && u.getIsAlive()).length;
    
    if (allyAlive === 0 || enemyAlive === 0) {
      this.endBattle();
    }
  }

  private endBattle(): void {
    if (this.battleState === 'finished') return;
    
    this.battleState = 'finished';
    this.currentActionUnit = null;
  }

  public getBattleStats(): BattleStats {
    const allyUnits = this.units.filter(u => u.getTeam() === 'ally');
    const enemyUnits = this.units.filter(u => u.getTeam() === 'enemy');
    
    const allySurvivors = allyUnits.filter(u => u.getIsAlive()).length;
    const enemySurvivors = enemyUnits.filter(u => u.getIsAlive()).length;
    
    const allAlive = this.units.filter(u => u.getIsAlive());
    let mvpUnit: Unit | null = null;
    let maxKills = 0;
    
    for (const u of allAlive) {
      if (u.getKillCount() > maxKills) {
        maxKills = u.getKillCount();
        mvpUnit = u;
      }
    }
    
    if (!mvpUnit && this.units.length > 0) {
      mvpUnit = this.units.reduce((mvp, u) => 
        u.getDamageDealt() > mvp.getDamageDealt() ? u : mvp
      );
    }
    
    return {
      totalDamage: this.totalDamage,
      longestKillStreak: this.longestKillStreak,
      allySurvivors,
      enemySurvivors,
      mvpUnit
    };
  }
}
