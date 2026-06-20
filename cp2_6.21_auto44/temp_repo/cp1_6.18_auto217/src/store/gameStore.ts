import { create } from 'zustand';
import {
  Card,
  BattleCard,
  BattleLogEntry,
  BattleStats,
  GameState,
} from '../types/game';
import { initialCards, upgradeCost } from '../data/cards';

const generateLogId = (): string => Math.random().toString(36).slice(2, 10);

const initialState: GameState = {
  playerGold: 500,
  ownedCards: initialCards,
  teamSlots: Array(9).fill(null),
  isInBattle: false,
  currentRound: 0,
  battleLog: [],
  battleResult: null,
  playerTeam: [],
  enemyTeam: [],
  currentView: 'collection',
  selectedCard: null,
  showResultModal: false,
  stats: {
    totalDamage: 0,
    maxSingleDamage: 0,
    critCount: 0,
    totalRounds: 0,
  },
};

interface GameStore extends GameState {
  selectCard: (card: Card | null) => void;
  addToTeam: (card: Card, slotIndex?: number) => boolean;
  removeFromTeam: (slotIndex: number) => void;
  setCurrentView: (view: 'collection' | 'battle') => void;
  startBattle: (playerTeam: BattleCard[], enemyTeam: BattleCard[]) => void;
  updateBattleState: (
    playerTeam: BattleCard[],
    enemyTeam: BattleCard[],
    logs: { message: string; type: string }[],
    stats: BattleStats,
    round: number
  ) => void;
  endBattle: (result: 'win' | 'lose', stats: BattleStats) => void;
  setShowResultModal: (show: boolean) => void;
  resetBattle: () => void;
  goToCollection: () => void;
  upgradeCard: (cardId: string) => boolean;
  retreat: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,

  selectCard: (card) => set({ selectedCard: card }),

  addToTeam: (card, slotIndex) => {
    const { teamSlots } = get();
    const isInTeam = teamSlots.some((c) => c !== null && c.id === card.id);
    if (isInTeam) return false;

    let targetIndex = slotIndex;
    if (targetIndex === undefined) {
      targetIndex = teamSlots.findIndex((s) => s === null);
    }
    if (targetIndex === -1 || teamSlots[targetIndex] !== null) {
      targetIndex = teamSlots.findIndex((s) => s === null);
    }
    if (targetIndex === -1) return false;

    const newSlots = [...teamSlots];
    newSlots[targetIndex] = card;
    set({ teamSlots: newSlots });
    return true;
  },

  removeFromTeam: (slotIndex) => {
    const { teamSlots } = get();
    if (slotIndex < 0 || slotIndex >= teamSlots.length) return;
    const newSlots = [...teamSlots];
    newSlots[slotIndex] = null;
    set({ teamSlots: newSlots });
  },

  setCurrentView: (view) => set({ currentView: view }),

  startBattle: (playerTeam, enemyTeam) => {
    set({
      isInBattle: true,
      currentRound: 1,
      battleLog: [
        {
          id: generateLogId(),
          round: 1,
          timestamp: Date.now(),
          type: 'info',
          message: '⚔️ 战斗开始！',
        },
      ],
      battleResult: null,
      playerTeam,
      enemyTeam,
      showResultModal: false,
      stats: {
        totalDamage: 0,
        maxSingleDamage: 0,
        critCount: 0,
        totalRounds: 0,
      },
    });
  },

  updateBattleState: (playerTeam, enemyTeam, logs, stats, round) => {
    const { battleLog } = get();
    const newEntries: BattleLogEntry[] = logs.map((l) => ({
      id: generateLogId(),
      round,
      timestamp: Date.now(),
      type: l.type as BattleLogEntry['type'],
      message: l.message,
    }));
    set({
      playerTeam,
      enemyTeam,
      currentRound: round,
      battleLog: [...battleLog, ...newEntries],
      stats,
    });
  },

  endBattle: (result, stats) => {
    const state = get();
    const goldBonus = result === 'win' ? 100 : 0;
    const finalLog: BattleLogEntry = {
      id: generateLogId(),
      round: state.currentRound,
      timestamp: Date.now(),
      type: 'info',
      message: result === 'win' ? '🎉 胜利！获得100金币' : '💀 战斗失败...',
    };
    set({
      isInBattle: false,
      battleResult: result,
      showResultModal: true,
      battleLog: [...state.battleLog, finalLog],
      stats,
      playerGold: state.playerGold + goldBonus,
    });
  },

  setShowResultModal: (show) => set({ showResultModal: show }),

  resetBattle: () => {
    const state = get();
    set({
      isInBattle: false,
      currentRound: 0,
      battleLog: [],
      battleResult: null,
      playerTeam: [],
      enemyTeam: [],
      showResultModal: false,
      stats: {
        totalDamage: 0,
        maxSingleDamage: 0,
        critCount: 0,
        totalRounds: 0,
      },
    });
  },

  goToCollection: () => {
    const state = get();
    set({
      isInBattle: false,
      currentRound: 0,
      battleLog: [],
      battleResult: null,
      playerTeam: [],
      enemyTeam: [],
      showResultModal: false,
      currentView: 'collection',
      selectedCard: null,
    });
  },

  upgradeCard: (cardId) => {
    const state = get();
    const card = state.ownedCards.find((c) => c.id === cardId);
    if (!card) return false;
    if (card.level >= card.maxLevel) return false;
    const cost = upgradeCost(card.level);
    if (state.playerGold < cost) return false;

    const updatedCards = state.ownedCards.map((c) =>
      c.id === cardId ? { ...c, level: c.level + 1 } : c
    );
    const updatedTeam = state.teamSlots.map((c) =>
      c && c.id === cardId ? { ...c, level: c.level + 1 } : c
    );
    const updatedSelected =
      state.selectedCard && state.selectedCard.id === cardId
        ? { ...state.selectedCard, level: state.selectedCard.level + 1 }
        : state.selectedCard;

    set({
      ownedCards: updatedCards,
      teamSlots: updatedTeam,
      playerGold: state.playerGold - cost,
      selectedCard: updatedSelected,
    });
    return true;
  },

  retreat: () => {
    const state = get();
    const finalLog: BattleLogEntry = {
      id: generateLogId(),
      round: state.currentRound,
      timestamp: Date.now(),
      type: 'info',
      message: '🏳️ 玩家撤退',
    };
    set({
      isInBattle: false,
      battleResult: 'lose',
      showResultModal: true,
      battleLog: [...state.battleLog, finalLog],
    });
  },
}));
