import { v4 as uuidv4 } from 'uuid';
import type {
  Dragon,
  BattleDragon,
  BattleLogEntry,
  BattleResult,
  BattleStatistics,
  TeamSide,
  Skill,
  StatusEffect,
} from '../../shared/types';
import { dataService } from '../editor/DataService';

interface BattleState {
  playerTeam: BattleDragon[];
  enemyTeam: BattleDragon[];
  logs: BattleLogEntry[];
  currentTurn: number;
  statistics: BattleStatistics;
}

export class BattleEngine {
  private state: BattleState;

  constructor(playerDragons: Dragon[], enemyDragons: Dragon[]) {
    this.state = {
      playerTeam: this.initializeTeam(playerDragons, 'player'),
      enemyTeam: this.initializeTeam(enemyDragons, 'enemy'),
      logs: [],
      currentTurn: 0,
      statistics: {
        totalDamageDealt: {},
        totalDamageTaken: {},
        totalHealing: {},
        turnsCount: 0,
        winner: null,
      },
    };
  }

  private initializeTeam(dragons: Dragon[], side: TeamSide): BattleDragon[] {
    return dragons.map((dragon, index) => ({
      ...dragon,
      currentHp: dragon.baseStats.hp,
      maxHp: dragon.baseStats.hp,
      currentAttack: dragon.baseStats.attack,
      currentDefense: dragon.baseStats.defense,
      currentSpeed: dragon.baseStats.speed,
      statusEffects: [],
      skillCooldowns: {},
      position: { row: index % 3, col: Math.floor(index / 3) },
      side,
      isAlive: true,
    }));
  }

  private addLog(
    turn: number,
    actor: string,
    actorTeam: TeamSide,
    action: string,
    damage?: number,
    effect?: string,
    target?: string
  ): void {
    const entry: BattleLogEntry = {
      id: uuidv4(),
      turn,
      actor,
      actorTeam,
      action,
      damage,
      effect,
      target,
      timestamp: Date.now(),
    };
    this.state.logs.push(entry);
  }

  private getAllDragons(): BattleDragon[] {
    return [...this.state.playerTeam, ...this.state.enemyTeam];
  }

  private getAliveDragons(side: TeamSide): BattleDragon[] {
    const team = side === 'player' ? this.state.playerTeam : this.state.enemyTeam;
    return team.filter((d) => d.isAlive);
  }

  private getOpposingTeam(side: TeamSide): BattleDragon[] {
    return side === 'player' ? this.state.enemyTeam : this.state.playerTeam;
  }

  private getAllyTeam(side: TeamSide): BattleDragon[] {
    return side === 'player' ? this.state.playerTeam : this.state.enemyTeam;
  }

  private selectTarget(attacker: BattleDragon): BattleDragon | null {
    const enemies = this.getOpposingTeam(attacker.side).filter((d) => d.isAlive);
    if (enemies.length === 0) return null;
    return enemies[Math.floor(Math.random() * enemies.length)];
  }

  private selectAlly(healer: BattleDragon): BattleDragon | null {
    const allies = this.getAllyTeam(healer.side).filter((d) => d.isAlive && d.currentHp < d.maxHp);
    if (allies.length === 0) return null;
    return allies.sort((a, b) => a.currentHp / a.maxHp - b.currentHp / b.maxHp)[0];
  }

  private selectSkill(dragon: BattleDragon): Skill {
    const availableSkills = dragon.skills.filter(
      (skill) => !dragon.skillCooldowns[skill.id] === undefined || dragon.skillCooldowns[skill.id] <= 0
    );
    if (availableSkills.length === 0) {
      return dragon.skills[0];
    }
    return availableSkills[Math.floor(Math.random() * availableSkills.length)];
  }

  private calculateDamage(
    attacker: BattleDragon,
    defender: BattleDragon,
    skill: Skill
  ): number {
    const baseDamage = attacker.currentAttack * skill.damageMultiplier;
    const elementModifier = dataService.getElementAdvantage(attacker.element, defender.element);
    const defenseReduction = defender.currentDefense * 0.5;
    let damage = Math.max(1, (baseDamage - defenseReduction) * elementModifier);

    const shieldEffect = defender.statusEffects.find((e) => e.type === 'shield');
    if (shieldEffect) {
      damage = Math.max(1, damage - shieldEffect.value);
    }

    return Math.round(damage);
  }

  private applyDamage(target: BattleDragon, damage: number, attacker: BattleDragon): void {
    target.currentHp = Math.max(0, target.currentHp - damage);
    if (target.currentHp <= 0) {
      target.isAlive = false;
    }

    const attackerKey = `${attacker.side}_${attacker.id}`;
    const targetKey = `${target.side}_${target.id}`;

    this.state.statistics.totalDamageDealt[attackerKey] =
      (this.state.statistics.totalDamageDealt[attackerKey] || 0) + damage;
    this.state.statistics.totalDamageTaken[targetKey] =
      (this.state.statistics.totalDamageTaken[targetKey] || 0) + damage;
  }

  private applyHealing(healer: BattleDragon, target: BattleDragon, amount: number): void {
    const actualHeal = Math.min(amount, target.maxHp - target.currentHp);
    target.currentHp = Math.min(target.maxHp, target.currentHp + amount);

    const healerKey = `${healer.side}_${healer.id}`;
    this.state.statistics.totalHealing[healerKey] =
      (this.state.statistics.totalHealing[healerKey] || 0) + actualHeal;
  }

  private applyStatusEffect(target: BattleDragon, effect: StatusEffect): void {
    target.statusEffects.push({ ...effect });
  }

  private processStatusEffects(dragon: BattleDragon): void {
    const burnEffects = dragon.statusEffects.filter((e) => e.type === 'burn');
    burnEffects.forEach((effect) => {
      const burnDamage = effect.value;
      dragon.currentHp = Math.max(0, dragon.currentHp - burnDamage);
      this.addLog(
        this.state.currentTurn,
        dragon.name,
        dragon.side,
        `受到 ${effect.value} 点灼烧伤害`,
        burnDamage,
        'burn'
      );
      const dragonKey = `${dragon.side}_${dragon.id}`;
      this.state.statistics.totalDamageTaken[dragonKey] =
        (this.state.statistics.totalDamageTaken[dragonKey] || 0) + burnDamage;
    });

    dragon.statusEffects = dragon.statusEffects
      .map((effect) => ({
        ...effect,
        duration: effect.duration - 1,
      }))
      .filter((effect) => effect.duration > 0);

    if (dragon.currentHp <= 0) {
      dragon.isAlive = false;
    }
  }

  private isStunned(dragon: BattleDragon): boolean {
    return dragon.statusEffects.some((e) => e.type === 'stun' || e.type === 'freeze');
  }

  private updateCooldowns(dragon: BattleDragon): void {
    Object.keys(dragon.skillCooldowns).forEach((skillId) => {
      if (dragon.skillCooldowns[skillId] > 0) {
        dragon.skillCooldowns[skillId]--;
      }
    });
  }

  private executeAction(actor: BattleDragon, skill: Skill): void {
    if (skill.effect?.type === 'heal') {
      const target = this.selectAlly(actor);
      if (target) {
        this.applyHealing(actor, target, skill.effect.value);
        this.addLog(
          this.state.currentTurn,
          actor.name,
          actor.side,
          `使用 ${skill.name} 治疗了 ${target.name}，恢复 ${skill.effect.value} 点生命`,
          undefined,
          'heal',
          target.name
        );
      } else {
        this.addLog(
          this.state.currentTurn,
          actor.name,
          actor.side,
          `使用 ${skill.name}，但没有需要治疗的目标`
        );
      }
    } else {
      const target = this.selectTarget(actor);
      if (!target) return;

      const damage = this.calculateDamage(actor, target, skill);
      this.applyDamage(target, damage, actor);

      let actionText = `${actor.name} 使用 ${skill.name} 攻击 ${target.name}，造成 ${damage} 点伤害`;

      const elementAdv = dataService.getElementAdvantage(actor.element, target.element);
      if (elementAdv > 1) {
        actionText += '（属性克制！');
      } else if (elementAdv < 1) {
        actionText += '（属性被克）';
      }

      this.addLog(
        this.state.currentTurn,
        actor.name,
        actor.side,
        actionText,
        damage,
        skill.effect?.type,
        target.name
      );

      if (skill.effect && skill.effect.type !== 'heal' && skill.effect.type !== 'shield' && target.isAlive) {
        this.applyStatusEffect(target, {
          type: skill.effect.type,
          duration: skill.effect.duration,
          value: skill.effect.value,
          source: actor.id,
        });
      }

      if (skill.effect?.type === 'shield') {
        this.applyStatusEffect(actor, {
          type: 'shield',
          duration: skill.effect.duration,
          value: skill.effect.value,
          source: actor.id,
        });
        this.addLog(
          this.state.currentTurn,
          actor.name,
          actor.side,
          `${actor.name} 使用 ${skill.name}，获得护盾效果`,
          undefined,
          'shield'
        );
      }

      if (!target.isAlive) {
        this.addLog(
          this.state.currentTurn,
          target.name,
          target.side,
          `${target.name} 被击败了！`,
          undefined,
          'defeat'
        );
      }
    }

    if (skill.cooldown > 0) {
      actor.skillCooldowns[skill.id] = skill.cooldown;
    }
  }

  private checkBattleEnd(): TeamSide | null {
    const playerAlive = this.getAliveDragons('player');
    const enemyAlive = this.getAliveDragons('enemy');

    if (playerAlive.length === 0) {
      return 'enemy';
    }
    if (enemyAlive.length === 0) {
      return 'player';
    }
    return null;
  }

  public simulate(maxTurns: number = 30): BattleResult {
    while (this.state.currentTurn < maxTurns) {
      this.state.currentTurn++;
      this.state.statistics.turnsCount = this.state.currentTurn;

      this.addLog(this.state.currentTurn, '系统', 'player', `=== 第 ${this.state.currentTurn} 回合 ===`);

      const allDragons = this.getAllDragons()
        .filter((d) => d.isAlive)
        .sort((a, b) => b.currentSpeed - a.currentSpeed);

      for (const dragon of allDragons) {
        if (!dragon.isAlive) continue;

        this.processStatusEffects(dragon);
        this.updateCooldowns(dragon);

        if (!dragon.isAlive) continue;

        if (this.isStunned(dragon)) {
          this.addLog(
            this.state.currentTurn,
            dragon.name,
            dragon.side,
            `${dragon.name} 被控制，无法行动`
          );
          continue;
        }

        const skill = this.selectSkill(dragon);
        this.executeAction(dragon, skill);

        const winner = this.checkBattleEnd();
        if (winner) {
          this.state.statistics.winner = winner;
          this.addLog(
            this.state.currentTurn,
            '系统',
            winner,
            `战斗结束！${winner === 'player' ? '我方' : '敌方'}获胜！`
          );
          return this.getResult();
        }
      }
    }

    const playerHp = this.getAliveDragons('player').reduce((sum, d) => sum + d.currentHp, 0);
    const enemyHp = this.getAliveDragons('enemy').reduce((sum, d) => sum + d.currentHp, 0);
    const winner = playerHp >= enemyHp ? 'player' : 'enemy';
    this.state.statistics.winner = winner;
    this.addLog(this.state.currentTurn, '系统', winner, `回合数已达上限，按剩余血量判定胜负');

    return this.getResult();
  }

  public getResult(): BattleResult {
    return {
      logs: [...this.state.logs],
      statistics: { ...this.state.statistics },
      winner: this.state.statistics.winner,
    };
  }

  public getPlayerTeam(): BattleDragon[] {
    return [...this.state.playerTeam];
  }

  public getEnemyTeam(): BattleDragon[] {
    return [...this.state.enemyTeam];
  }
}
