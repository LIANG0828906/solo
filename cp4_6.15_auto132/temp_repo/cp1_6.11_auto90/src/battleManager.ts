import type {
  Unit,
  BattleState,
  BattleUnitState,
  BattleLogEntry,
  VisualEffect,
  Race,
  ActiveEffect
} from './types.js';
import { ArmyManager } from './armyManager.js';

const TURN_DURATION = 800;
const EFFECT_ID_DURATION = 500;
const MAX_ROUNDS = 50;

type BattleCallback = (state: BattleState) => void;

export class BattleManager {
  private armyManager: ArmyManager;
  private state: BattleState | null = null;
  private onUpdate: BattleCallback | null = null;
  private onComplete: ((winner: 'player' | 'enemy') => void) | null = null;
  private battleTimer: number | null = null;
  private isProcessing = false;

  constructor(armyManager: ArmyManager) {
    this.armyManager = armyManager;
  }

  setCallbacks(onUpdate: BattleCallback, onComplete: (winner: 'player' | 'enemy') => void): void {
    this.onUpdate = onUpdate;
    this.onComplete = onComplete;
  }

  getState(): BattleState | null {
    return this.state ? { ...this.state } : null;
  }

  startBattle(canvasWidth: number, canvasHeight: number): { success: boolean; message?: string } {
    const playerUnits = this.armyManager.getActiveFormation();
    if (playerUnits.length === 0) {
      return { success: false, message: '请先在编成界面布置至少1个单位！' };
    }

    const averageLevel = playerUnits.reduce((sum, u) => sum + u.level, 0) / playerUnits.length;
    const difficulty = Math.max(1, averageLevel);
    const enemyUnits = this.armyManager.generateEnemyArmy(difficulty);

    this.state = this.createInitialBattleState(playerUnits, enemyUnits, canvasWidth, canvasHeight);
    this.addLog('system', `===== 战斗开始！第 ${this.state.round} 回合 =====`);
    this.notify();

    this.applyPreBattleEffects();

    setTimeout(() => {
      this.processBattleTurn();
    }, 1000);

    return { success: true };
  }

  private createInitialBattleState(
    playerUnits: Unit[],
    enemyUnits: Unit[],
    canvasWidth: number,
    canvasHeight: number
  ): BattleState {
    const playerBattleUnits = this.setupBattleUnits(playerUnits, canvasWidth, canvasHeight, false);
    const enemyBattleUnits = this.setupBattleUnits(enemyUnits, canvasWidth, canvasHeight, true);

    const allUnits = [...playerBattleUnits.map(b => b.unit), ...enemyBattleUnits.map(b => b.unit)];
    const turnQueue = this.sortUnitsBySpeed(allUnits);

    return {
      round: 1,
      playerUnits: playerBattleUnits,
      enemyUnits: enemyBattleUnits,
      log: [],
      effects: [],
      phase: 'preparing',
      turnQueue,
      currentTurnIndex: 0,
      winner: null
    };
  }

  private setupBattleUnits(
    units: Unit[],
    canvasWidth: number,
    canvasHeight: number,
    isEnemy: boolean
  ): BattleUnitState[] {
    const battleUnits: BattleUnitState[] = [];
    const cols = 3;
    const rows = Math.ceil(units.length / cols);
    const marginX = canvasWidth * 0.08;
    const marginY = canvasHeight * 0.15;
    const gridWidth = canvasWidth * 0.38;
    const gridHeight = canvasHeight * 0.7;
    const cellWidth = gridWidth / cols;
    const cellHeight = gridHeight / Math.max(rows, 1);

    const baseX = isEnemy ? canvasWidth - marginX - gridWidth + cellWidth / 2 : marginX + cellWidth / 2;

    units.forEach((unit, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = baseX + col * cellWidth;
      const y = marginY + cellHeight / 2 + row * cellHeight;

      const freshUnit: Unit = {
        ...unit,
        currentHp: unit.stats.hp,
        alive: true,
        effects: [],
        hasActed: false
      };

      battleUnits.push({
        unit: freshUnit,
        screenX: x,
        screenY: y,
        targetX: x,
        targetY: y,
        animationState: 'idle',
        animationProgress: 0,
        isEnemy
      });
    });

    return battleUnits;
  }

  private sortUnitsBySpeed(units: Unit[]): Unit[] {
    return [...units].sort((a, b) => {
      if (b.stats.speed !== a.stats.speed) {
        return b.stats.speed - a.stats.speed;
      }
      return Math.random() - 0.5;
    });
  }

  private applyPreBattleEffects(): void {
    if (!this.state) return;

    const allUnits = [...this.state.playerUnits, ...this.state.enemyUnits];

    allUnits.forEach(bus => {
      if (bus.unit.skill.type === 'defense_aura') {
        const team = bus.isEnemy ? this.state!.enemyUnits : this.state!.playerUnits;
        team.forEach(ally => {
          if (ally.unit.alive) {
            ally.unit.effects.push({
              type: 'defense_buff',
              value: bus.unit.skill.value,
              duration: 999,
              source: bus.unit.instanceId
            });
          }
        });
        this.addLog('skill', `${bus.unit.name} 施放【${bus.unit.skill.name}】，提升全队属性！`);
        this.addAuraEffect(bus, bus.unit.race);
      }
    });
  }

  private addAuraEffect(bus: BattleUnitState, race: Race): void {
    if (!this.state) return;
    const color = race === 'human' ? '#FFD700' : race === 'elf' ? '#7FFF7F' : '#B080FF';
    this.state.effects.push({
      id: `aura_${Date.now()}_${Math.random()}`,
      type: 'aura',
      x: bus.screenX,
      y: bus.screenY,
      progress: 0,
      duration: EFFECT_ID_DURATION,
      color
    });
  }

  private processBattleTurn(): void {
    if (!this.state || this.state.phase === 'ended') return;

    if (this.checkBattleEnd()) {
      this.endBattle();
      return;
    }

    if (this.state.currentTurnIndex >= this.state.turnQueue.length) {
      this.startNewRound();
      return;
    }

    const currentUnitId = this.state.turnQueue[this.state.currentTurnIndex].instanceId;
    const currentUnit = this.findBattleUnit(currentUnitId);

    if (!currentUnit || !currentUnit.unit.alive || currentUnit.unit.hasActed) {
      this.state.currentTurnIndex++;
      this.processBattleTurn();
      return;
    }

    this.isProcessing = true;
    this.state.phase = 'fighting';

    this.executeTurn(currentUnit);
  }

  private startNewRound(): void {
    if (!this.state) return;

    this.state.round++;
    this.state.currentTurnIndex = 0;

    if (this.state.round > MAX_ROUNDS) {
      const playerHp = this.getTeamTotalHp(this.state.playerUnits);
      const enemyHp = this.getTeamTotalHp(this.state.enemyUnits);
      this.state.winner = playerHp >= enemyHp ? 'player' : 'enemy';
      this.addLog('system', `===== 超过最大回合数，${this.state.winner === 'player' ? '我方' : '敌方'}获胜！ =====`);
      this.endBattle();
      return;
    }

    this.applyRoundStartEffects();

    const allUnits = [
      ...this.state.playerUnits.map(b => b.unit).filter(u => u.alive),
      ...this.state.enemyUnits.map(b => b.unit).filter(u => u.alive)
    ];
    this.state.turnQueue = this.sortUnitsBySpeed(allUnits);
    allUnits.forEach(u => u.hasActed = false);

    this.addLog('system', `===== 第 ${this.state.round} 回合 =====`);
    this.notify();

    setTimeout(() => this.processBattleTurn(), 500);
  }

  private applyRoundStartEffects(): void {
    if (!this.state) return;

    const allUnits = [...this.state.playerUnits, ...this.state.enemyUnits];

    allUnits.forEach(bus => {
      if (!bus.unit.alive) return;

      const poisonEffect = bus.unit.effects.find(e => e.type === 'poison');
      if (poisonEffect) {
        const poisonDmg = Math.round(poisonEffect.value);
        bus.unit.currentHp = Math.max(0, bus.unit.currentHp - poisonDmg);
        this.addLog('damage', `${bus.unit.name} 受到毒素侵蚀，损失 ${poisonDmg} 点生命！`);
        this.addDamageTextEffect(bus.screenX, bus.screenY - 30, poisonDmg, '#9333EA');

        if (bus.unit.currentHp <= 0) {
          this.handleUnitDeath(bus);
        }
      }

      bus.unit.effects = bus.unit.effects.filter(e => {
        e.duration--;
        return e.duration > 0;
      });
    });

    allUnits.forEach(bus => {
      if (!bus.unit.alive) return;
      if (bus.unit.skill.type === 'heal') {
        const team = bus.isEnemy ? this.state!.enemyUnits : this.state!.playerUnits;
        const aliveAllies = team.filter(a => a.unit.alive);

        if (bus.unit.skill.name.includes('全队')) {
          const healAmount = Math.round(bus.unit.stats.hp * bus.unit.skill.value);
          aliveAllies.forEach(ally => {
            const healed = this.healUnit(ally, healAmount);
            if (healed > 0) {
              this.addHealTextEffect(ally.screenX, ally.screenY - 30, healed);
            }
          });
          this.addLog('heal', `${bus.unit.name} 施放【${bus.unit.skill.name}】，全队恢复 ${healAmount} 生命！`);
          this.addAuraEffect(bus, bus.unit.race);
        } else {
          const target = aliveAllies.reduce((weakest, ally) => {
            const weakestRatio = weakest ? weakest.unit.currentHp / weakest.unit.stats.hp : 1;
            const allyRatio = ally.unit.currentHp / ally.unit.stats.hp;
            return allyRatio < weakestRatio ? ally : weakest;
          }, null as BattleUnitState | null);

          if (target && target.unit.currentHp < target.unit.stats.hp) {
            const healAmount = Math.round(target.unit.stats.hp * bus.unit.skill.value);
            const healed = this.healUnit(target, healAmount);
            if (healed > 0) {
              this.addLog('heal', `${bus.unit.name} 施放【${bus.unit.skill.name}】，为 ${target.unit.name} 恢复 ${healed} 生命！`);
              this.addHealTextEffect(target.screenX, target.screenY - 30, healed);
            }
          }
        }
      }
    });
  }

  private executeTurn(attacker: BattleUnitState): void {
    if (!this.state || !attacker.unit.alive) {
      this.finishTurn(attacker);
      return;
    }

    const enemyTeam = attacker.isEnemy ? this.state.playerUnits : this.state.enemyUnits;
    const aliveEnemies = enemyTeam.filter(e => e.unit.alive);

    if (aliveEnemies.length === 0) {
      this.finishTurn(attacker);
      return;
    }

    const target = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];

    this.addLog('attack', `${attacker.unit.name} 向 ${target.unit.name} 发起攻击！`);

    const startX = attacker.screenX;
    const startY = attacker.screenY;
    const targetX = target.screenX;
    const targetY = target.screenY;

    attacker.targetX = startX + (targetX - startX) * 0.4;
    attacker.targetY = startY + (targetY - startY) * 0.2;
    attacker.animationState = 'attacking';
    attacker.animationProgress = 0;

    setTimeout(() => {
      this.performAttack(attacker, target);
    }, 300);

    setTimeout(() => {
      if (attacker.unit.alive) {
        attacker.targetX = startX;
        attacker.targetY = startY;
        attacker.animationState = 'returning';
        attacker.animationProgress = 0;
      }
      setTimeout(() => {
        if (attacker.unit.alive) {
          attacker.animationState = 'idle';
        }
        this.finishTurn(attacker);
      }, 300);
    }, TURN_DURATION - 300);
  }

  private performAttack(attacker: BattleUnitState, target: BattleUnitState): void {
    if (!this.state || !attacker.unit.alive || !target.unit.alive) return;

    const race = attacker.unit.race;
    if (race === 'elf') {
      this.state.effects.push({
        id: `arrow_${Date.now()}_${Math.random()}`,
        type: 'arrow',
        x: attacker.screenX,
        y: attacker.screenY,
        targetX: target.screenX,
        targetY: target.screenY,
        progress: 0,
        duration: EFFECT_ID_DURATION,
        color: '#7FFF7F'
      });
    } else if (race === 'undead') {
      this.state.effects.push({
        id: `shadow_${Date.now()}_${Math.random()}`,
        type: 'shadow',
        x: target.screenX,
        y: target.screenY,
        progress: 0,
        duration: EFFECT_ID_DURATION,
        color: '#9333EA'
      });
    }

    let baseDamage = this.calculateDamage(attacker, target);
    let attackCount = 1;

    if (attacker.unit.skill.type === 'double_strike') {
      if (Math.random() < attacker.unit.skill.value) {
        attackCount = 2;
        this.addLog('skill', `${attacker.unit.name} 触发【${attacker.unit.skill.name}】！`);
      }
    }

    let totalDamage = 0;
    for (let i = 0; i < attackCount; i++) {
      let damage = baseDamage;
      if (i === 1 && attacker.unit.skill.name === '元素风暴') {
        damage = Math.round(baseDamage * 2);
      }

      const evaded = this.checkEvasion(target);
      if (evaded) {
        this.addLog('skill', `${target.unit.name} 触发【${target.unit.skill.name}】，闪避了攻击！`);
        this.addDamageTextEffect(target.screenX, target.screenY - 30, 'MISS', '#60A5FA');
        continue;
      }

      damage = this.applyShieldWall(target, damage);

      damage = Math.max(1, damage);
      totalDamage += damage;

      target.unit.currentHp = Math.max(0, target.unit.currentHp - damage);
      target.animationState = 'hurt';
      target.animationProgress = 0;
      setTimeout(() => { if (target.unit.alive) target.animationState = 'idle'; }, 200);

      this.addLog('damage', `${attacker.unit.name} 对 ${target.unit.name} 造成 ${damage} 点伤害！`);
      this.addDamageTextEffect(target.screenX, target.screenY - 30, damage, '#F87171');

      this.applyOnHitEffects(attacker, target, damage);
    }

    if (totalDamage > 0 && (attacker.unit.skill.type === 'lifesteal')) {
      const healAmount = Math.round(totalDamage * attacker.unit.skill.value);
      const healed = this.healUnit(attacker, healAmount);
      if (healed > 0) {
        this.addLog('heal', `${attacker.unit.name} 触发【${attacker.unit.skill.name}】，吸收 ${healed} 生命！`);
        this.addHealTextEffect(attacker.screenX, attacker.screenY - 30, healed);
      }
    }

    if (target.unit.currentHp <= 0) {
      this.handleUnitDeath(target, attacker);
    }

    this.notify();
  }

  private calculateDamage(attacker: BattleUnitState, defender: BattleUnitState): number {
    let attack = attacker.unit.stats.attack;
    let defense = defender.unit.stats.defense;

    const attackBuffs = attacker.unit.effects.filter(e => e.type === 'defense_buff' && e.value > 0.08);
    attackBuffs.forEach(buff => {
      if (attacker.unit.skill.type === 'defense_aura' && attacker.unit.skill.name === '指挥光环') {
        attack = Math.round(attack * (1 + buff.value));
      }
    });

    const curseDebuffs = defender.unit.effects.filter(e => e.type === 'curse');
    curseDebuffs.forEach(curse => {
      attack = Math.round(attack * (1 - curse.value));
    });

    const defenseBuffs = defender.unit.effects.filter(e => e.type === 'defense_buff');
    defenseBuffs.forEach(buff => {
      defense = Math.round(defense * (1 + buff.value));
    });

    const counterBonus = this.armyManager.getCounterBonus(attacker.unit.race, defender.unit.race);
    if (counterBonus > 1) {
      this.addLog('skill', `种族克制！${attacker.unit.name} 对 ${defender.unit.name} 造成额外伤害！`);
    }

    const rawDamage = attack * counterBonus - defense * 0.5;
    const variance = 0.9 + Math.random() * 0.2;
    return Math.max(1, Math.round(rawDamage * variance));
  }

  private checkEvasion(unit: BattleUnitState): boolean {
    if (unit.unit.skill.type === 'evasion' && unit.unit.currentHp > 0) {
      const threshold = unit.unit.currentHp <= 1 ? unit.unit.skill.value : unit.unit.skill.value;
      if (unit.unit.currentHp <= 1 || !unit.unit.skill.name.includes('自然')) {
        return Math.random() < threshold;
      }
    }
    return false;
  }

  private applyShieldWall(unit: BattleUnitState, damage: number): number {
    if (unit.unit.skill.type === 'shield_wall') {
      if (Math.random() < unit.unit.skill.value) {
        damage = Math.round(damage * 0.5);
        this.addLog('skill', `${unit.unit.name} 触发【${unit.unit.skill.name}】，减免50%伤害！`);
      }
    }
    return damage;
  }

  private applyOnHitEffects(attacker: BattleUnitState, target: BattleUnitState, damage: number): void {
    if (attacker.unit.skill.type === 'poison') {
      target.unit.effects = target.unit.effects.filter(e => e.type !== 'poison');
      target.unit.effects.push({
        type: 'poison',
        value: attacker.unit.skill.value,
        duration: 3,
        source: attacker.unit.instanceId
      });
      this.addLog('skill', `${target.unit.name} 被【${attacker.unit.skill.name}】感染！`);
    }

    if (attacker.unit.skill.type === 'curse') {
      target.unit.effects = target.unit.effects.filter(e => e.type !== 'curse');
      target.unit.effects.push({
        type: 'curse',
        value: attacker.unit.skill.value,
        duration: 2,
        source: attacker.unit.instanceId
      });
      this.addLog('skill', `${target.unit.name} 被【${attacker.unit.skill.name}】诅咒，攻击力下降！`);
    }
  }

  private healUnit(target: BattleUnitState, amount: number): number {
    if (!target.unit.alive) return 0;
    const actualHeal = Math.min(amount, target.unit.stats.hp - target.unit.currentHp);
    target.unit.currentHp += actualHeal;
    return actualHeal;
  }

  private handleUnitDeath(unit: BattleUnitState, killer?: BattleUnitState): void {
    if (!this.state) return;

    unit.unit.alive = false;
    unit.unit.currentHp = 0;
    unit.animationState = 'dead';
    this.addLog('death', `${unit.unit.name} 被击败了！`);

    const reviverTeam = unit.isEnemy ? this.state.enemyUnits : this.state.playerUnits;
    const reviver = reviverTeam.find(r =>
      r.unit.skill.type === 'revive' && r.unit.alive && r.unit.instanceId !== unit.unit.instanceId
    );

    if (reviver && Math.random() < reviver.unit.skill.value) {
      const healAmount = Math.round(unit.unit.stats.hp * 0.3);
      unit.unit.alive = true;
      unit.unit.currentHp = healAmount;
      unit.animationState = 'idle';
      this.addLog('heal', `${reviver.unit.name} 触发【${reviver.unit.skill.name}】，${unit.unit.name} 复活并恢复 ${healAmount} 生命！`);
      this.addAuraEffect(unit, unit.unit.race);
      this.addHealTextEffect(unit.screenX, unit.screenY - 30, healAmount);
    }
  }

  private addDamageTextEffect(x: number, y: number, value: number | string, color: string): void {
    if (!this.state) return;
    this.state.effects.push({
      id: `dmg_${Date.now()}_${Math.random()}`,
      type: 'damage_text',
      x,
      y,
      progress: 0,
      duration: EFFECT_ID_DURATION,
      color,
      value: String(value)
    });
  }

  private addHealTextEffect(x: number, y: number, value: number): void {
    if (!this.state) return;
    this.state.effects.push({
      id: `heal_${Date.now()}_${Math.random()}`,
      type: 'heal_text',
      x,
      y,
      progress: 0,
      duration: EFFECT_ID_DURATION,
      color: '#22C55E',
      value: `+${value}`
    });
  }

  private finishTurn(unit: BattleUnitState): void {
    if (!this.state) return;
    unit.unit.hasActed = true;
    this.state.currentTurnIndex++;
    this.isProcessing = false;
    this.notify();

    if (this.checkBattleEnd()) {
      this.endBattle();
      return;
    }

    setTimeout(() => this.processBattleTurn(), 200);
  }

  private checkBattleEnd(): boolean {
    if (!this.state) return true;

    const playerAlive = this.state.playerUnits.some(u => u.unit.alive);
    const enemyAlive = this.state.enemyUnits.some(u => u.unit.alive);

    if (!playerAlive) {
      this.state.winner = 'enemy';
      this.addLog('system', '===== 战斗结束，敌方获胜！ =====');
      return true;
    }
    if (!enemyAlive) {
      this.state.winner = 'player';
      this.addLog('system', '===== 战斗结束，我方获胜！ =====');
      return true;
    }
    return false;
  }

  private endBattle(): void {
    if (!this.state) return;
    this.state.phase = 'ended';
    this.notify();

    if (this.onComplete && this.state.winner) {
      setTimeout(() => {
        this.onComplete!(this.state!.winner!);
      }, 2000);
    }
  }

  private findBattleUnit(instanceId: string): BattleUnitState | null {
    if (!this.state) return null;
    return this.state.playerUnits.find(u => u.unit.instanceId === instanceId) ||
           this.state.enemyUnits.find(u => u.unit.instanceId === instanceId) ||
           null;
  }

  private getTeamTotalHp(units: BattleUnitState[]): number {
    return units.reduce((sum, u) => sum + u.unit.currentHp, 0);
  }

  getTeamStats(): { playerTotal: number; playerCurrent: number; enemyTotal: number; enemyCurrent: number } {
    if (!this.state) return { playerTotal: 0, playerCurrent: 0, enemyTotal: 0, enemyCurrent: 0 };
    return {
      playerTotal: this.state.playerUnits.reduce((s, u) => s + u.unit.stats.hp, 0),
      playerCurrent: this.state.playerUnits.reduce((s, u) => s + u.unit.currentHp, 0),
      enemyTotal: this.state.enemyUnits.reduce((s, u) => s + u.unit.stats.hp, 0),
      enemyCurrent: this.state.enemyUnits.reduce((s, u) => s + u.unit.currentHp, 0)
    };
  }

  private addLog(type: BattleLogEntry['type'], message: string): void {
    if (!this.state) return;
    this.state.log.push({
      round: this.state.round,
      message,
      type,
      timestamp: Date.now()
    });
    if (this.state.log.length > 200) {
      this.state.log.splice(0, this.state.log.length - 200);
    }
  }

  private notify(): void {
    if (this.onUpdate && this.state) {
      this.onUpdate({ ...this.state });
    }
  }

  updateAnimations(deltaTime: number): void {
    if (!this.state) return;

    const dt = deltaTime;

    [...this.state.playerUnits, ...this.state.enemyUnits].forEach(bus => {
      const dx = bus.targetX - bus.screenX;
      const dy = bus.targetY - bus.screenY;
      if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
        bus.screenX += dx * 0.15;
        bus.screenY += dy * 0.15;
      }

      if (bus.animationState !== 'idle' && bus.animationState !== 'dead') {
        bus.animationProgress += dt;
      }
    });

    this.state.effects = this.state.effects.filter(effect => {
      effect.progress += dt;
      return effect.progress < effect.duration;
    });
  }

  stopBattle(): void {
    if (this.battleTimer) {
      clearTimeout(this.battleTimer);
      this.battleTimer = null;
    }
    this.state = null;
    this.isProcessing = false;
  }
}
