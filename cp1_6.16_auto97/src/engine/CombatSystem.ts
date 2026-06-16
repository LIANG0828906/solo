import type { Spirit, Skill, BattleLogEntry, BattleResult, ElementType } from './types';

const ELEMENT_ADVANTAGE: Record<ElementType, ElementType[]> = {
  fire: ['wood'],
  wood: ['water'],
  water: ['fire'],
  light: ['dark'],
  dark: ['light'],
};

const ADVANTAGE_MULTIPLIER = 1.5;
const DISADVANTAGE_MULTIPLIER = 0.7;
const CRITICAL_MULTIPLIER = 1.5;
const BASE_CRIT_RATE = 0.1;
const ENERGY_PER_TURN = 1;
const RANDOM_TACTICS_CHANCE = 0.2;
const RANDOM_TACTICS_INTERVAL = 3;

function getElementMultiplier(attackerElement: ElementType, defenderElement: ElementType): number {
  if (ELEMENT_ADVANTAGE[attackerElement]?.includes(defenderElement)) {
    return ADVANTAGE_MULTIPLIER;
  }
  if (ELEMENT_ADVANTAGE[defenderElement]?.includes(attackerElement)) {
    return DISADVANTAGE_MULTIPLIER;
  }
  return 1;
}

function calculateDamage(
  attacker: Spirit,
  defender: Spirit,
  skill: Skill,
  isCritical: boolean
): number {
  const elementMultiplier = getElementMultiplier(attacker.element, defender.element);
  const defenseValue = defender.isDefending
    ? defender.defense + defender.defenseBonus
    : defender.defense;
  const baseDamage = Math.max(1, skill.damage + attacker.attack - defenseValue * 0.5);
  const critMultiplier = isCritical ? CRITICAL_MULTIPLIER : 1;
  const finalDamage = Math.floor(baseDamage * elementMultiplier * critMultiplier);
  return Math.max(1, finalDamage);
}

function rollCritical(critRate: number = BASE_CRIT_RATE): boolean {
  return Math.random() < critRate;
}

function generateLogId(): string {
  return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export interface CombatAction {
  type: 'skill' | 'defend' | 'switch';
  skillId?: string;
  targetSpiritId?: string;
}

export class CombatSystem {
  private playerSpirits: Spirit[];
  private enemySpirits: Spirit[];
  private playerActiveId: string;
  private enemyActiveId: string;
  private currentTurn: number = 1;
  private battleLog: BattleLogEntry[] = [];
  private totalDamageDealt: number = 0;
  private criticalHits: number = 0;
  private totalEnergyUsed: number = 0;
  private isPlayerTurn: boolean = true;
  private battleEnded: boolean = false;
  private winner: 'player' | 'enemy' | null = null;

  constructor(playerSpirits: Spirit[], enemySpirits: Spirit[]) {
    this.playerSpirits = playerSpirits.map(s => ({ ...s, skills: s.skills.map(sk => ({ ...sk })) }));
    this.enemySpirits = enemySpirits.map(s => ({ ...s, skills: s.skills.map(sk => ({ ...sk })) }));
    this.playerActiveId = playerSpirits[0]?.id || '';
    this.enemyActiveId = enemySpirits[0]?.id || '';
  }

  getPlayerActiveSpirit(): Spirit | undefined {
    return this.playerSpirits.find(s => s.id === this.playerActiveId);
  }

  getEnemyActiveSpirit(): Spirit | undefined {
    return this.enemySpirits.find(s => s.id === this.enemyActiveId);
  }

  getBattleLog(): BattleLogEntry[] {
    return [...this.battleLog];
  }

  getCurrentTurn(): number {
    return this.currentTurn;
  }

  isBattleOver(): boolean {
    return this.battleEnded;
  }

  getWinner(): 'player' | 'enemy' | null {
    return this.winner;
  }

  getPlayerSpirits(): Spirit[] {
    return this.playerSpirits.map(s => ({ ...s, skills: s.skills.map(sk => ({ ...sk })) }));
  }

  getEnemySpirits(): Spirit[] {
    return this.enemySpirits.map(s => ({ ...s, skills: s.skills.map(sk => ({ ...sk })) }));
  }

  executePlayerAction(action: CombatAction): BattleLogEntry[] {
    if (this.battleEnded || !this.isPlayerTurn) return [];

    const logs = this.executeAction(action, 'player');
    this.isPlayerTurn = false;

    if (!this.checkBattleEnd()) {
      this.endTurn();
    }

    return logs;
  }

  executeEnemyAction(): BattleLogEntry[] {
    if (this.battleEnded || this.isPlayerTurn) return [];

    const action = this.makeAIDecision();
    const logs = this.executeAction(action, 'enemy');
    this.isPlayerTurn = true;

    if (!this.checkBattleEnd()) {
      this.endTurn();
    }

    return logs;
  }

  private executeAction(action: CombatAction, actor: 'player' | 'enemy'): BattleLogEntry[] {
    const logs: BattleLogEntry[] = [];
    const activeSpirit = actor === 'player'
      ? this.getPlayerActiveSpirit()
      : this.getEnemyActiveSpirit();
    const targetSpirit = actor === 'player'
      ? this.getEnemyActiveSpirit()
      : this.getPlayerActiveSpirit();

    if (!activeSpirit || !targetSpirit) return logs;

    switch (action.type) {
      case 'skill': {
        const skill = activeSpirit.skills.find(s => s.id === action.skillId);
        if (skill && skill.currentCooldown <= 0 && activeSpirit.currentEnergy >= skill.energyCost) {
          logs.push(...this.useSkill(activeSpirit, targetSpirit, skill, actor));
        }
        break;
      }
      case 'defend': {
        logs.push(this.useDefend(activeSpirit, actor));
        break;
      }
      case 'switch': {
        if (action.targetSpiritId) {
          logs.push(this.switchSpirit(action.targetSpiritId, actor));
        }
        break;
      }
    }

    return logs;
  }

  private useSkill(
    attacker: Spirit,
    defender: Spirit,
    skill: Skill,
    actor: 'player' | 'enemy'
  ): BattleLogEntry[] {
    const logs: BattleLogEntry[] = [];

    attacker.currentEnergy -= skill.energyCost;
    this.totalEnergyUsed += skill.energyCost;
    skill.currentCooldown = skill.cooldown;

    if (skill.healAmount && skill.healAmount > 0) {
      const healAmount = Math.min(skill.healAmount, attacker.maxHp - attacker.currentHp);
      attacker.currentHp += healAmount;
      attacker.isDefending = false;
      attacker.defenseBonus = 0;

      logs.push({
        id: generateLogId(),
        turn: this.currentTurn,
        actor,
        action: 'heal',
        heal: healAmount,
        message: `${attacker.name} 使用了 ${skill.name}，恢复了 ${healAmount} 点生命值！`,
      });
    } else if (skill.type === 'defense' && skill.defenseBonus) {
      attacker.isDefending = true;
      attacker.defenseBonus = skill.defenseBonus;

      logs.push({
        id: generateLogId(),
        turn: this.currentTurn,
        actor,
        action: 'defense_skill',
        message: `${attacker.name} 使用了 ${skill.name}，进入防御姿态！`,
      });
    } else {
      attacker.isDefending = false;
      attacker.defenseBonus = 0;

      const isCritical = rollCritical();
      const damage = calculateDamage(attacker, defender, skill, isCritical);

      defender.currentHp = Math.max(0, defender.currentHp - damage);
      this.totalDamageDealt += damage;
      if (isCritical) this.criticalHits++;

      const elementMultiplier = getElementMultiplier(attacker.element, defender.element);
      let effectMsg = '';
      if (elementMultiplier > 1) effectMsg = ' 效果拔群！';
      else if (elementMultiplier < 1) effectMsg = ' 效果不佳...';

      logs.push({
        id: generateLogId(),
        turn: this.currentTurn,
        actor,
        action: 'attack',
        damage,
        isCritical,
        message: `${attacker.name} 使用了 ${skill.name}，造成 ${damage} 点伤害！${effectMsg}${isCritical ? ' 暴击！' : ''}`,
      });

      if (defender.currentHp <= 0) {
        logs.push({
          id: generateLogId(),
          turn: this.currentTurn,
          actor,
          action: 'faint',
          message: `${defender.name} 被击败了！`,
        });

        const defenderSpirits = actor === 'player' ? this.enemySpirits : this.playerSpirits;
        const nextSpirit = defenderSpirits.find(s => s.currentHp > 0 && s.id !== defender.id);
        
        if (nextSpirit) {
          if (actor === 'player') {
            this.enemyActiveId = nextSpirit.id;
          } else {
            this.playerActiveId = nextSpirit.id;
          }
          logs.push({
            id: generateLogId(),
            turn: this.currentTurn,
            actor: actor === 'player' ? 'enemy' : 'player',
            action: 'switch',
            message: `${nextSpirit.name} 登场了！`,
          });
        }
      }
    }

    this.battleLog.push(...logs);
    return logs;
  }

  private useDefend(spirit: Spirit, actor: 'player' | 'enemy'): BattleLogEntry {
    spirit.isDefending = true;
    spirit.defenseBonus = Math.floor(spirit.defense * 0.5);

    const log: BattleLogEntry = {
      id: generateLogId(),
      turn: this.currentTurn,
      actor,
      action: 'defend',
      message: `${spirit.name} 进入防御姿态！`,
    };

    this.battleLog.push(log);
    return log;
  }

  private switchSpirit(spiritId: string, actor: 'player' | 'enemy'): BattleLogEntry {
    const spirits = actor === 'player' ? this.playerSpirits : this.enemySpirits;
    const newSpirit = spirits.find(s => s.id === spiritId && s.currentHp > 0);

    let log: BattleLogEntry;

    if (newSpirit) {
      if (actor === 'player') {
        const oldSpirit = this.getPlayerActiveSpirit();
        if (oldSpirit) {
          oldSpirit.isDefending = false;
          oldSpirit.defenseBonus = 0;
        }
        this.playerActiveId = spiritId;
      } else {
        const oldSpirit = this.getEnemyActiveSpirit();
        if (oldSpirit) {
          oldSpirit.isDefending = false;
          oldSpirit.defenseBonus = 0;
        }
        this.enemyActiveId = spiritId;
      }

      log = {
        id: generateLogId(),
        turn: this.currentTurn,
        actor,
        action: 'switch',
        message: `更换为 ${newSpirit.name}！`,
      };
    } else {
      log = {
        id: generateLogId(),
        turn: this.currentTurn,
        actor,
        action: 'switch_fail',
        message: '无法更换精灵！',
      };
    }

    this.battleLog.push(log);
    return log;
  }

  private endTurn(): void {
    this.currentTurn++;

    const allSpirits = [...this.playerSpirits, ...this.enemySpirits];
    for (const spirit of allSpirits) {
      for (const skill of spirit.skills) {
        if (skill.currentCooldown > 0) {
          skill.currentCooldown--;
        }
      }

      if (spirit.currentHp > 0) {
        spirit.currentEnergy = Math.min(spirit.maxEnergy, spirit.currentEnergy + ENERGY_PER_TURN);
      }

      if (!this.isPlayerTurn && spirit.id === this.playerActiveId) {
        spirit.isDefending = false;
        spirit.defenseBonus = 0;
      }
      if (this.isPlayerTurn && spirit.id === this.enemyActiveId) {
        spirit.isDefending = false;
        spirit.defenseBonus = 0;
      }
    }
  }

  private checkBattleEnd(): boolean {
    const playerAlive = this.playerSpirits.some(s => s.currentHp > 0);
    const enemyAlive = this.enemySpirits.some(s => s.currentHp > 0);

    if (!playerAlive) {
      this.battleEnded = true;
      this.winner = 'enemy';
      return true;
    }
    if (!enemyAlive) {
      this.battleEnded = true;
      this.winner = 'player';
      return true;
    }
    return false;
  }

  private makeAIDecision(): CombatAction {
    const enemyActive = this.getEnemyActiveSpirit();
    const playerActive = this.getPlayerActiveSpirit();

    if (!enemyActive || !playerActive) {
      return { type: 'defend' };
    }

    const shouldRandomTactics = this.currentTurn % RANDOM_TACTICS_INTERVAL === 0 && Math.random() < RANDOM_TACTICS_CHANCE;

    if (shouldRandomTactics) {
      return this.makeRandomDecision(enemyActive);
    }

    const availableSkills = enemyActive.skills.filter(
      s => s.currentCooldown <= 0 && enemyActive.currentEnergy >= s.energyCost
    );

    if (availableSkills.length === 0) {
      return { type: 'defend' };
    }

    const hpRatio = enemyActive.currentHp / enemyActive.maxHp;

    if (hpRatio < 0.3) {
      const healSkill = availableSkills.find(s => s.healAmount && s.healAmount > 0);
      if (healSkill) {
        return { type: 'skill', skillId: healSkill.id };
      }
    }

    let bestSkill: Skill | null = null;
    let bestScore = -Infinity;

    for (const skill of availableSkills) {
      if (skill.healAmount && skill.healAmount > 0) {
        const healScore = hpRatio < 0.5 ? skill.healAmount * 0.8 : -100;
        if (healScore > bestScore) {
          bestScore = healScore;
          bestSkill = skill;
        }
        continue;
      }

      if (skill.type === 'defense' && skill.defenseBonus) {
        const defenseScore = hpRatio < 0.4 ? skill.defenseBonus * 0.6 : -50;
        if (defenseScore > bestScore) {
          bestScore = defenseScore;
          bestSkill = skill;
        }
        continue;
      }

      const isCrit = rollCritical();
      const expectedDamage = calculateDamage(enemyActive, playerActive, skill, isCrit);
      const elementMultiplier = getElementMultiplier(enemyActive.element, playerActive.element);
      const score = expectedDamage * elementMultiplier * (1 + BASE_CRIT_RATE * (CRITICAL_MULTIPLIER - 1));

      if (score > bestScore) {
        bestScore = score;
        bestSkill = skill;
      }
    }

    if (bestSkill) {
      return { type: 'skill', skillId: bestSkill.id };
    }

    return { type: 'defend' };
  }

  private makeRandomDecision(spirit: Spirit): CombatAction {
    const availableSkills = spirit.skills.filter(
      s => s.currentCooldown <= 0 && spirit.currentEnergy >= s.energyCost
    );

    const actions: CombatAction[] = [];

    actions.push({ type: 'defend' });

    for (const skill of availableSkills) {
      actions.push({ type: 'skill', skillId: skill.id });
    }

    const randomIndex = Math.floor(Math.random() * actions.length);
    return actions[randomIndex];
  }

  getBattleResult(): BattleResult | null {
    if (!this.battleEnded || !this.winner) return null;

    const expGained = this.winner === 'player'
      ? Math.floor(this.totalDamageDealt * 0.5 + this.currentTurn * 10)
      : Math.floor(this.totalDamageDealt * 0.2);

    return {
      winner: this.winner,
      totalTurns: this.currentTurn,
      totalDamageDealt: this.totalDamageDealt,
      criticalHits: this.criticalHits,
      totalEnergyUsed: this.totalEnergyUsed,
      expGained,
    };
  }

  canUseSkill(spirit: Spirit, skillId: string): boolean {
    const skill = spirit.skills.find(s => s.id === skillId);
    if (!skill) return false;
    return skill.currentCooldown <= 0 && spirit.currentEnergy >= skill.energyCost;
  }

  getAvailableSkills(spirit: Spirit): Skill[] {
    return spirit.skills.filter(s => s.currentCooldown <= 0 && spirit.currentEnergy >= s.energyCost);
  }

  getElementAdvantageInfo(): { playerAdvantage: boolean; enemyAdvantage: boolean; multiplier: number } {
    const player = this.getPlayerActiveSpirit();
    const enemy = this.getEnemyActiveSpirit();

    if (!player || !enemy) {
      return { playerAdvantage: false, enemyAdvantage: false, multiplier: 1 };
    }

    const multiplier = getElementMultiplier(player.element, enemy.element);

    return {
      playerAdvantage: multiplier > 1,
      enemyAdvantage: multiplier < 1,
      multiplier,
    };
  }
}

export function createCombatSystem(playerSpirits: Spirit[], enemySpirits: Spirit[]): CombatSystem {
  return new CombatSystem(playerSpirits, enemySpirits);
}

export function simulateFullBattle(
  playerSpirits: Spirit[],
  enemySpirits: Spirit[]
): { logs: BattleLogEntry[]; result: BattleResult | null } {
  const combat = new CombatSystem(playerSpirits, enemySpirits);
  const allLogs: BattleLogEntry[] = [];
  let turnCount = 0;
  const maxTurns = 100;

  while (!combat.isBattleOver() && turnCount < maxTurns) {
    const playerLogs = combat.executePlayerAction(combat.getPlayerActiveSpirit()
      ? { type: 'skill', skillId: combat.getPlayerActiveSpirit()!.skills[0]?.id }
      : { type: 'defend' }
    );
    allLogs.push(...playerLogs);

    if (combat.isBattleOver()) break;

    const enemyLogs = combat.executeEnemyAction();
    allLogs.push(...enemyLogs);

    turnCount++;
  }

  return {
    logs: allLogs,
    result: combat.getBattleResult(),
  };
}
