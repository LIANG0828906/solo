import type {
  GameState,
  Card,
  Unit,
  LogEntry,
  PlayerSide,
  Position,
  ActionLog,
  ActionType,
  ReplayData,
} from '../types/game';
import { CardEngine } from './CardEngine';
import { createInitialDeck } from '../data/cards';
import { createHero, createMinion } from '../data/units';

export const GRID_WIDTH = 5;
export const GRID_HEIGHT = 6;
export const MAX_ENERGY = 10;
export const MAX_HAND_SIZE = 7;
export const INITIAL_ENERGY = 1;

export class GameEngine {
  private cardEngine: CardEngine;
  private state: GameState;
  private initialState: GameState | null = null;
  private actionLogCounter: number = 0;

  constructor(initialState?: Partial<GameState>) {
    this.cardEngine = new CardEngine();
    this.state = this.createInitialState(initialState);
  }

  private createInitialState(override?: Partial<GameState>): GameState {
    const defaultState: GameState = {
      phase: 'playing',
      currentTurn: 'player',
      turnNumber: 1,
      playerEnergy: INITIAL_ENERGY,
      opponentEnergy: INITIAL_ENERGY,
      maxEnergy: MAX_ENERGY,
      playerHand: [],
      opponentHand: [],
      playerDeck: [],
      opponentDeck: [],
      units: [],
      selectedCard: null,
      selectedTargetId: null,
      winner: null,
      logs: [],
      actionLogs: [],
      playerSide: 'player',
      roomId: '',
      stateVersion: 0,
    };

    return { ...defaultState, ...override };
  }

  initializeGame(playerSide: PlayerSide = 'player'): GameState {
    const playerDeck = createInitialDeck();
    const opponentDeck = createInitialDeck();

    const playerHand = playerDeck.splice(0, 4);
    const opponentHand = opponentDeck.splice(0, 4);

    const units: Unit[] = [];

    units.push(createHero('player', { x: 2, y: 5 }));
    units.push(createMinion('player', { x: 0, y: 5 }, 0));
    units.push(createMinion('player', { x: 1, y: 4 }, 1));
    units.push(createMinion('player', { x: 4, y: 5 }, 2));

    units.push(createHero('opponent', { x: 2, y: 0 }));
    units.push(createMinion('opponent', { x: 0, y: 0 }, 0));
    units.push(createMinion('opponent', { x: 1, y: 1 }, 1));
    units.push(createMinion('opponent', { x: 4, y: 0 }, 2));

    const initialLog: LogEntry = {
      id: 'log_start',
      timestamp: Date.now(),
      message: '游戏开始！你的回合',
      type: 'system',
    };

    const gameStartAction: ActionLog = this.createActionLog(
      'game_start',
      'player',
      { message: '游戏开始' },
    );

    this.state = {
      ...this.state,
      phase: 'playing',
      currentTurn: 'player',
      turnNumber: 1,
      playerEnergy: INITIAL_ENERGY,
      opponentEnergy: INITIAL_ENERGY,
      maxEnergy: MAX_ENERGY,
      playerHand,
      opponentHand,
      playerDeck,
      opponentDeck,
      units,
      selectedCard: null,
      selectedTargetId: null,
      winner: null,
      logs: [initialLog],
      actionLogs: [gameStartAction],
      playerSide,
      stateVersion: 0,
    };

    this.initialState = { ...this.state };

    return { ...this.state };
  }

  getState(): GameState {
    return { ...this.state };
  }

  setState(state: GameState) {
    this.state = state;
  }

  selectCard(cardId: string): Card | null {
    if (this.state.phase !== 'playing') return null;
    if (this.state.currentTurn !== this.state.playerSide) return null;

    const card = this.state.playerHand.find((c) => c.id === cardId);
    if (card && card.cost <= this.state.playerEnergy) {
      this.state.selectedCard = card;
      return card;
    }
    return null;
  }

  deselectCard() {
    this.state.selectedCard = null;
    this.state.selectedTargetId = null;
  }

  selectTarget(targetId: string) {
    this.state.selectedTargetId = targetId;
  }

  playCard(cardId: string, targetId?: string): { success: boolean; state: GameState } {
    if (this.state.phase !== 'playing') return { success: false, state: this.getState() };
    if (this.state.currentTurn !== this.state.playerSide) return { success: false, state: this.getState() };

    const hand = this.state.playerSide === 'player' ? this.state.playerHand : this.state.opponentHand;
    const cardIndex = hand.findIndex((c) => c.id === cardId);

    if (cardIndex === -1) return { success: false, state: this.getState() };

    const card = hand[cardIndex];
    const currentEnergy = this.state.playerSide === 'player'
      ? this.state.playerEnergy
      : this.state.opponentEnergy;

    if (card.cost > currentEnergy) return { success: false, state: this.getState() };

    const targetIds = this.resolveTargets(card, targetId);

    if (targetIds.length === 0 && card.targetType !== 'self' && card.targetType !== 'none') {
      return { success: false, state: this.getState() };
    }

    const { updatedUnits, logs } = this.cardEngine.applyCardEffect(
      card,
      this.state.playerSide,
      targetIds,
      this.state.units,
    );

    this.state.units = updatedUnits;

    if (card.effect.energyRestore) {
      if (this.state.playerSide === 'player') {
        this.state.playerEnergy = this.cardEngine.applyEnergyRestore(
          card,
          this.state.playerEnergy,
          this.state.maxEnergy,
        );
      } else {
        this.state.opponentEnergy = this.cardEngine.applyEnergyRestore(
          card,
          this.state.opponentEnergy,
          this.state.maxEnergy,
        );
      }
    }

    if (this.state.playerSide === 'player') {
      this.state.playerEnergy -= card.cost;
      this.state.playerHand = this.state.playerHand.filter((c) => c.id !== cardId);
    } else {
      this.state.opponentEnergy -= card.cost;
      this.state.opponentHand = this.state.opponentHand.filter((c) => c.id !== cardId);
    }

    this.state.logs = [...logs, ...this.state.logs];

    const playCardAction = this.createActionLog(
      'play_card',
      this.state.playerSide,
      {
        cardId: card.id,
        cardName: card.name,
        cardType: card.type,
        cost: card.cost,
        targetIds,
        effect: card.effect,
      },
      card.id,
      targetIds[0],
      card.effect.damage,
      card.effect.heal,
    );

    this.state.actionLogs = [...this.state.actionLogs, playCardAction];

    this.state.selectedCard = null;
    this.state.selectedTargetId = null;

    this.checkWinCondition();

    return { success: true, state: this.getState() };
  }

  private resolveTargets(card: Card, targetId?: string): string[] {
    const caster = this.state.playerSide;

    switch (card.targetType) {
      case 'single':
        return targetId ? [targetId] : [];
      case 'all_friendly':
        return this.cardEngine.getAllFriendlyTargets(this.state.units, caster);
      case 'all_enemy':
        return this.cardEngine.getAllEnemyTargets(this.state.units, caster);
      case 'random_enemy':
        return this.cardEngine.getRandomEnemyTargets(
          this.state.units,
          caster,
          card.effect.targetCount || 1,
        );
      case 'self':
        return [];
      case 'none':
        return [];
      default:
        return [];
    }
  }

  endTurn(): GameState {
    if (this.state.phase !== 'playing') return this.getState();

    const currentTurnSide = this.state.currentTurn;

    const { updatedUnits, logs: endTurnLogs } = this.cardEngine.processEndOfTurnEffects(
      this.state.units,
    );

    this.state.units = updatedUnits;
    this.state.logs = [...endTurnLogs, ...this.state.logs];

    const nextTurn = this.state.currentTurn === 'player' ? 'opponent' : 'player';

    if (nextTurn === 'player') {
      this.state.turnNumber++;
    }

    this.state.currentTurn = nextTurn;

    const newEnergy = Math.min(
      (nextTurn === 'player' ? this.state.playerEnergy : this.state.opponentEnergy) + 1,
      this.state.maxEnergy,
    );

    let drawnCard: Card | null = null;

    if (nextTurn === 'player') {
      this.state.playerEnergy = newEnergy;
      drawnCard = this.drawCard('player');
    } else {
      this.state.opponentEnergy = newEnergy;
      drawnCard = this.drawCard('opponent');
    }

    const turnLog: LogEntry = {
      id: `log_turn_${Date.now()}`,
      timestamp: Date.now(),
      message: `第${this.state.turnNumber}回合 - ${nextTurn === 'player' ? '你' : '对手'}的回合`,
      type: 'turn',
    };
    this.state.logs = [turnLog, ...this.state.logs];

    const endTurnAction = this.createActionLog(
      'end_turn',
      currentTurnSide,
      {
        turnNumber: this.state.turnNumber,
        nextTurn,
        newEnergy,
        drawnCard: drawnCard ? { id: drawnCard.id, name: drawnCard.name } : null,
      },
    );

    this.state.actionLogs = [...this.state.actionLogs, endTurnAction];

    if (drawnCard) {
      const drawCardAction = this.createActionLog(
        'draw_card',
        nextTurn,
        {
          cardId: drawnCard.id,
          cardName: drawnCard.name,
        },
        drawnCard.id,
      );
      this.state.actionLogs = [...this.state.actionLogs, drawCardAction];
    }

    this.checkWinCondition();

    return this.getState();
  }

  private drawCard(side: PlayerSide): Card | null {
    const deck = side === 'player' ? this.state.playerDeck : this.state.opponentDeck;
    const hand = side === 'player' ? this.state.playerHand : this.state.opponentHand;

    if (deck.length > 0 && hand.length < MAX_HAND_SIZE) {
      const card = deck.shift()!;
      if (side === 'player') {
        this.state.playerHand = [...this.state.playerHand, card];
      } else {
        this.state.opponentHand = [...this.state.opponentHand, card];
      }
      return card;
    }
    return null;
  }

  private checkWinCondition() {
    const playerHero = this.state.units.find((u) => u.type === 'hero' && u.owner === 'player');
    const opponentHero = this.state.units.find((u) => u.type === 'hero' && u.owner === 'opponent');

    if (playerHero && playerHero.hp <= 0) {
      this.state.winner = 'opponent';
      this.state.phase = 'ended';
      this.state.logs.unshift({
        id: `log_win_${Date.now()}`,
        timestamp: Date.now(),
        message: '游戏结束 - 对手获胜！',
        type: 'system',
      });
    } else if (opponentHero && opponentHero.hp <= 0) {
      this.state.winner = 'player';
      this.state.phase = 'ended';
      this.state.logs.unshift({
        id: `log_win_${Date.now()}`,
        timestamp: Date.now(),
        message: '游戏结束 - 你获胜了！',
        type: 'system',
      });
    }
  }

  deployUnit(unitId: string, position: Position): boolean {
    if (this.state.phase !== 'playing') return false;

    const unit = this.state.units.find((u) => u.id === unitId);
    if (!unit) return false;

    const isValid = this.isValidDeployPosition(position, unit.owner);
    if (!isValid) return false;

    const occupied = this.state.units.some(
      (u) => u.position.x === position.x && u.position.y === position.y && u.hp > 0,
    );
    if (occupied) return false;

    unit.position = position;

    const deployAction = this.createActionLog(
      'deploy',
      unit.owner,
      {
        unitId: unit.id,
        unitName: unit.name,
        position: { ...position },
      },
      undefined,
      unit.id,
    );
    this.state.actionLogs = [...this.state.actionLogs, deployAction];

    return true;
  }

  private isValidDeployPosition(position: Position, owner: PlayerSide): boolean {
    const { x, y } = position;
    if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) return false;

    if (owner === 'player') {
      return y >= GRID_HEIGHT - 2;
    } else {
      return y < 2;
    }
  }

  addLog(message: string, type: LogEntry['type'] = 'system') {
    const entry: LogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
      message,
      type,
    };
    this.state.logs = [entry, ...this.state.logs];
  }

  getUnitAtPosition(x: number, y: number): Unit | undefined {
    return this.state.units.find((u) => u.position.x === x && u.position.y === y && u.hp > 0);
  }

  canPlayCard(card: Card): boolean {
    if (this.state.phase !== 'playing') return false;
    if (this.state.currentTurn !== this.state.playerSide) return false;

    const currentEnergy = this.state.playerSide === 'player'
      ? this.state.playerEnergy
      : this.state.opponentEnergy;

    return card.cost <= currentEnergy;
  }

  private createActionLog(
    type: ActionType,
    playerId: PlayerSide,
    details: Record<string, unknown>,
    cardId?: string,
    targetId?: string,
    damage?: number,
    heal?: number,
  ): ActionLog {
    this.actionLogCounter++;
    return {
      id: `action_${Date.now()}_${this.actionLogCounter}`,
      timestamp: Date.now(),
      type,
      playerId,
      cardId,
      targetId,
      damage,
      heal,
      details,
    };
  }

  addActionLog(
    type: ActionType,
    playerId: PlayerSide,
    details: Record<string, unknown> = {},
    cardId?: string,
    targetId?: string,
    damage?: number,
    heal?: number,
  ): void {
    if (this.state.phase === 'ended') return;
    const action = this.createActionLog(type, playerId, details, cardId, targetId, damage, heal);
    this.state.actionLogs = [...this.state.actionLogs, action];
  }

  exportGameLog(): ActionLog[] {
    return [...this.state.actionLogs];
  }

  getReplayData(): ReplayData {
    return {
      initialState: this.initialState ? { ...this.initialState } : this.createInitialState(),
      actions: [...this.state.actionLogs],
      finalState: { ...this.state },
      winner: this.state.winner,
    };
  }
}
