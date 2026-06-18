import { Card, BattleCard, BattleSide, BattleStats } from '../../types/game';
import { CombatEngine } from '../engine/CombatEngine';
import { getCardStats } from '../../data/cards';

export type OnUpdateCallback = (data: {
  playerTeam: BattleCard[];
  enemyTeam: BattleCard[];
  logs: { message: string; type: string }[];
  stats: BattleStats;
  round: number;
}) => void;

export type OnEndCallback = (result: 'win' | 'lose', stats: BattleStats) => void;

const generateInstanceId = (): string => Math.random().toString(36).slice(2, 12);

export class BattleManager {
  private playerTeam: BattleCard[] = [];
  private enemyTeam: BattleCard[] = [];
  private actionQueue: BattleCard[] = [];
  private currentRound: number = 1;
  private engine: CombatEngine;
  private stats: BattleStats = {
    totalDamage: 0,
    maxSingleDamage: 0,
    critCount: 0,
    totalRounds: 0,
  };
  private onUpdate: OnUpdateCallback | null = null;
  private onEnd: OnEndCallback | null = null;
  private isRunning: boolean = false;
  private turnTimer: number | null = null;

  constructor() {
    this.engine = new CombatEngine();
  }

  private cardToBattleCard(card: Card, side: BattleSide, index: number): BattleCard {
    const stats = getCardStats(card);
    const cooldowns: Record<string, number> = {};
    card.skills.forEach((s) => {
      cooldowns[s.name] = 0;
    });
    return {
      ...card,
      instanceId: generateInstanceId(),
      side,
      currentHp: stats.hp,
      maxHp: stats.hp,
      currentEnergy: 2,
      maxEnergy: 10,
      cooldowns,
      isAlive: true,
      position: {
        row: Math.floor(index / 3),
        col: index % 3,
      },
    };
  }

  initBattle(
    playerCards: (Card | null)[],
    enemyCards: Card[],
    onUpdate: OnUpdateCallback,
    onEnd: OnEndCallback
  ): void {
    const validPlayerCards = playerCards.filter((c): c is Card => c !== null);
    this.playerTeam = validPlayerCards.map((c, i) =>
      this.cardToBattleCard(c, 'player', i)
    );
    this.enemyTeam = enemyCards.map((c, i) =>
      this.cardToBattleCard(c, 'enemy', i)
    );
    this.currentRound = 1;
    this.stats = {
      totalDamage: 0,
      maxSingleDamage: 0,
      critCount: 0,
      totalRounds: 0,
    };
    this.engine.setRound(1);
    this.onUpdate = onUpdate;
    this.onEnd = onEnd;
    this.isRunning = false;
    if (this.turnTimer) {
      clearTimeout(this.turnTimer);
      this.turnTimer = null;
    }

    this.buildActionQueue();
    this.notifyUpdate([]);
  }

  private buildActionQueue(): void {
    const allAlive = [
      ...this.playerTeam.filter((c) => c.isAlive),
      ...this.enemyTeam.filter((c) => c.isAlive),
    ];
    this.actionQueue = this.engine.sortBySpeed(allAlive);
  }

  startBattle(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.processNextTurn();
  }

  pauseBattle(): void {
    this.isRunning = false;
    if (this.turnTimer) {
      clearTimeout(this.turnTimer);
      this.turnTimer = null;
    }
  }

  private processNextTurn(): void {
    if (!this.isRunning) return;

    const result = this.engine.checkBattleEnd(this.playerTeam, this.enemyTeam);
    if (result) {
      this.endBattle(result);
      return;
    }

    if (this.actionQueue.length === 0) {
      this.currentRound++;
      this.stats.totalRounds = this.currentRound;
      this.engine.setRound(this.currentRound);

      this.playerTeam = this.playerTeam.map((c) => this.engine.tickCooldowns(c));
      this.enemyTeam = this.enemyTeam.map((c) => this.engine.tickCooldowns(c));

      this.buildActionQueue();

      if (this.actionQueue.length === 0) {
        this.endBattle(result ?? 'lose');
        return;
      }
    }

    const currentActor = this.actionQueue.shift();
    if (!currentActor || !currentActor.isAlive) {
      this.turnTimer = window.setTimeout(() => this.processNextTurn(), 100);
      return;
    }

    const team =
      currentActor.side === 'player' ? this.playerTeam : this.enemyTeam;
    const enemyTeam =
      currentActor.side === 'player' ? this.enemyTeam : this.playerTeam;

    const actorInTeam = team.find((c) => c.instanceId === currentActor.instanceId);
    if (!actorInTeam || !actorInTeam.isAlive) {
      this.turnTimer = window.setTimeout(() => this.processNextTurn(), 100);
      return;
    }

    const { skill, target } = this.engine.aiSelectAction(actorInTeam, enemyTeam);

    const actionResult = this.engine.executeTurn(actorInTeam, target, skill);

    if (actorInTeam.side === 'player') {
      this.playerTeam = this.playerTeam.map((c) =>
        c.instanceId === actionResult.updatedAttacker.instanceId
          ? actionResult.updatedAttacker
          : c
      );
      this.enemyTeam = this.enemyTeam.map((c) =>
        c.instanceId === actionResult.updatedTarget.instanceId
          ? actionResult.updatedTarget
          : c
      );
    } else {
      this.enemyTeam = this.enemyTeam.map((c) =>
        c.instanceId === actionResult.updatedAttacker.instanceId
          ? actionResult.updatedAttacker
          : c
      );
      this.playerTeam = this.playerTeam.map((c) =>
        c.instanceId === actionResult.updatedTarget.instanceId
          ? actionResult.updatedTarget
          : c
      );
    }

    if (actorInTeam.side === 'player') {
      this.stats.totalDamage += actionResult.damageResult.damage;
      if (actionResult.damageResult.damage > this.stats.maxSingleDamage) {
        this.stats.maxSingleDamage = actionResult.damageResult.damage;
      }
      if (actionResult.damageResult.isCritical) {
        this.stats.critCount++;
      }
    }

    const logs = actionResult.logs.map((l) => ({
      message: l.message,
      type: l.type,
    }));

    this.notifyUpdate(logs);

    this.turnTimer = window.setTimeout(() => this.processNextTurn(), 800);
  }

  private notifyUpdate(logs: { message: string; type: string }[]): void {
    if (this.onUpdate) {
      this.onUpdate({
        playerTeam: [...this.playerTeam],
        enemyTeam: [...this.enemyTeam],
        logs,
        stats: { ...this.stats },
        round: this.currentRound,
      });
    }
  }

  private endBattle(result: 'win' | 'lose'): void {
    this.isRunning = false;
    if (this.turnTimer) {
      clearTimeout(this.turnTimer);
      this.turnTimer = null;
    }
    if (this.onEnd) {
      this.onEnd(result, { ...this.stats });
    }
  }

  destroy(): void {
    this.pauseBattle();
    this.onUpdate = null;
    this.onEnd = null;
  }
}
