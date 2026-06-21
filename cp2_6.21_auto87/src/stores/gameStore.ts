import { create } from 'zustand';
import type { GameState, Card, Unit, LogEntry, PlayerSide, Position } from '../types/game';
import { GameEngine } from '../game/GameEngine';

interface GameStore extends GameState {
  gameEngine: GameEngine | null;
  isOnline: boolean;
  isConnected: boolean;
  initGame: (playerSide?: PlayerSide) => void;
  setGameState: (state: GameState) => void;
  selectCard: (cardId: string) => Card | null;
  deselectCard: () => void;
  playCard: (cardId: string, targetId?: string) => boolean;
  endTurn: () => void;
  deployUnit: (unitId: string, position: Position) => boolean;
  addLog: (message: string, type?: LogEntry['type']) => void;
  setOnlineMode: (online: boolean) => void;
  setConnected: (connected: boolean) => void;
  getPlayerHand: () => Card[];
  getPlayerEnergy: () => number;
  getMyUnits: () => Unit[];
  getEnemyUnits: () => Unit[];
  isMyTurn: () => boolean;
}

export const useGameStore = create<GameStore>((set, get) => ({
  phase: 'playing',
  currentTurn: 'player',
  turnNumber: 1,
  playerEnergy: 1,
  opponentEnergy: 1,
  maxEnergy: 10,
  playerHand: [],
  opponentHand: [],
  playerDeck: [],
  opponentDeck: [],
  units: [],
  selectedCard: null,
  selectedTargetId: null,
  winner: null,
  logs: [],
  playerSide: 'player',
  roomId: '',
  gameEngine: null,
  isOnline: false,
  isConnected: false,

  initGame: (playerSide: PlayerSide = 'player') => {
    const engine = new GameEngine();
    const state = engine.initializeGame(playerSide);
    set({ ...state, gameEngine: engine });
  },

  setGameState: (state: GameState) => {
    const { gameEngine } = get();
    if (gameEngine) {
      gameEngine.setState(state);
    }
    set(state);
  },

  selectCard: (cardId: string) => {
    const { gameEngine } = get();
    if (!gameEngine) return null;
    const card = gameEngine.selectCard(cardId);
    if (card) {
      set({ selectedCard: card });
    }
    return card;
  },

  deselectCard: () => {
    const { gameEngine } = get();
    if (gameEngine) {
      gameEngine.deselectCard();
    }
    set({ selectedCard: null, selectedTargetId: null });
  },

  playCard: (cardId: string, targetId?: string) => {
    const { gameEngine } = get();
    if (!gameEngine) return false;

    const { success, state } = gameEngine.playCard(cardId, targetId);
    if (success) {
      set({ ...state });
    }
    return success;
  },

  endTurn: () => {
    const { gameEngine } = get();
    if (!gameEngine) return;

    const state = gameEngine.endTurn();
    set({ ...state });
  },

  deployUnit: (unitId: string, position: Position) => {
    const { gameEngine } = get();
    if (!gameEngine) return false;

    const success = gameEngine.deployUnit(unitId, position);
    if (success) {
      const state = gameEngine.getState();
      set({ ...state });
    }
    return success;
  },

  addLog: (message: string, type: LogEntry['type'] = 'system') => {
    const { gameEngine, logs } = get();
    if (gameEngine) {
      gameEngine.addLog(message, type);
      const state = gameEngine.getState();
      set({ logs: state.logs });
    } else {
      const entry: LogEntry = {
        id: `log_${Date.now()}`,
        timestamp: Date.now(),
        message,
        type,
      };
      set({ logs: [entry, ...logs] });
    }
  },

  setOnlineMode: (online: boolean) => {
    set({ isOnline: online });
  },

  setConnected: (connected: boolean) => {
    set({ isConnected: connected });
  },

  getPlayerHand: () => {
    const { playerSide, playerHand, opponentHand } = get();
    return playerSide === 'player' ? playerHand : opponentHand;
  },

  getPlayerEnergy: () => {
    const { playerSide, playerEnergy, opponentEnergy } = get();
    return playerSide === 'player' ? playerEnergy : opponentEnergy;
  },

  getMyUnits: () => {
    const { playerSide, units } = get();
    return units.filter((u) => u.owner === playerSide && u.hp > 0);
  },

  getEnemyUnits: () => {
    const { playerSide, units } = get();
    return units.filter((u) => u.owner !== playerSide && u.hp > 0);
  },

  isMyTurn: () => {
    const { currentTurn, playerSide, phase } = get();
    return phase === 'playing' && currentTurn === playerSide;
  },
}));
