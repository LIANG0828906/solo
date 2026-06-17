import { create } from 'zustand';

export type CardType = 'attack' | 'defense' | 'energy';

export interface Card {
  id: string;
  name: string;
  type: CardType;
  attack: number;
  defense: number;
  skill: string;
  hp: number;
  maxHp: number;
}

export type SlotPosition = 'left' | 'right';

export interface CardSlot {
  position: SlotPosition;
  index: number;
  card: Card | null;
}

export type BattleStrategy = 'aggressive' | 'defensive' | 'energy';

export type BattlePhase = 'idle' | 'entering' | 'fighting' | 'finished';

export interface BattleAction {
  turn: number;
  attacker: 'player' | 'enemy';
  attackIndex: number;
  damage: number;
  defenderHpAfter: number;
  timestamp: number;
}

export interface BattleState {
  phase: BattlePhase;
  strategy: BattleStrategy;
  currentTurn: number;
  playerCards: Card[];
  enemyCards: Card[];
  activePlayerCard: Card | null;
  activeEnemyCard: Card | null;
  battleLog: BattleAction[];
  winner: 'player' | 'enemy' | null;
  isReplaying: boolean;
  replaySpeed: number;
}

interface GameStore {
  deck: Card[];
  leftSlots: CardSlot[];
  rightSlots: CardSlot[];
  draggedCard: Card | null;
  battle: BattleState;
  showResult: boolean;

  setDraggedCard: (card: Card | null) => void;
  placeCardToSlot: (card: Card, slotIndex: number) => void;
  removeCardFromSlot: (slotIndex: number) => void;
  setStrategy: (strategy: BattleStrategy) => void;
  startBattle: () => void;
  updateBattleState: (updates: Partial<BattleState>) => void;
  setShowResult: (show: boolean) => void;
  resetBattle: () => void;
  replayBattle: () => void;
  saveBattleRecord: () => void;
  setReplaying: (replaying: boolean) => void;
}

const makeCard = (
  id: string,
  name: string,
  type: CardType,
  attack: number,
  defense: number,
  skill: string,
  hp: number
): Card => ({
  id,
  name,
  type,
  attack,
  defense,
  skill,
  hp,
  maxHp: hp,
});

const initialDeck: Card[] = [
  makeCard('p1', '虚空刃者', 'attack', 25, 8, 'double_strike', 80),
  makeCard('p2', '暗影刺客', 'attack', 30, 5, 'critical', 65),
  makeCard('p3', '破魔战士', 'attack', 22, 12, 'pierce', 90),
  makeCard('p4', '虚空守卫', 'defense', 10, 25, 'shield_wall', 110),
  makeCard('p5', '幽影盾士', 'defense', 8, 28, 'reflect', 100),
  makeCard('p6', '能量守护者', 'defense', 12, 20, 'absorb', 95),
  makeCard('p7', '虚空法师', 'energy', 15, 10, 'energy_burst', 75),
  makeCard('p8', '星辰召唤师', 'energy', 18, 8, 'heal', 70),
  makeCard('p9', '虚空使者', 'energy', 20, 12, 'empower', 85),
];

const enemyDeck: Card[] = [
  makeCard('e1', '深渊屠夫', 'attack', 23, 9, 'rage', 85),
  makeCard('e2', '噩梦骑士', 'defense', 9, 26, 'iron_wall', 105),
  makeCard('e3', '混沌术士', 'energy', 17, 11, 'chaos', 80),
];

const initialLeftSlots: CardSlot[] = [0, 1, 2].map((i) => ({
  position: 'left',
  index: i,
  card: null,
}));

const initialRightSlots: CardSlot[] = [0, 1, 2].map((i) => ({
  position: 'right',
  index: i,
  card: enemyDeck[i] ? { ...enemyDeck[i] } : null,
}));

const initialBattle: BattleState = {
  phase: 'idle',
  strategy: 'aggressive',
  currentTurn: 0,
  playerCards: [],
  enemyCards: [],
  activePlayerCard: null,
  activeEnemyCard: null,
  battleLog: [],
  winner: null,
  isReplaying: false,
  replaySpeed: 1,
};

export const useGameStore = create<GameStore>((set, get) => ({
  deck: initialDeck,
  leftSlots: initialLeftSlots,
  rightSlots: initialRightSlots,
  draggedCard: null,
  battle: initialBattle,
  showResult: false,

  setDraggedCard: (card) => set({ draggedCard: card }),

  placeCardToSlot: (card, slotIndex) => {
    const state = get();
    const newLeftSlots = state.leftSlots.map((slot) =>
      slot.index === slotIndex ? { ...slot, card: { ...card } } : slot
    );
    const newDeck = state.deck.filter((c) => c.id !== card.id);
    set({ leftSlots: newLeftSlots, deck: newDeck, draggedCard: null });
  },

  removeCardFromSlot: (slotIndex) => {
    const state = get();
    const slot = state.leftSlots.find((s) => s.index === slotIndex);
    if (!slot || !slot.card) return;
    const removedCard = slot.card;
    const newLeftSlots = state.leftSlots.map((s) =>
      s.index === slotIndex ? { ...s, card: null } : s
    );
    const newDeck = [...state.deck, removedCard];
    set({ leftSlots: newLeftSlots, deck: newDeck });
  },

  setStrategy: (strategy) =>
    set({ battle: { ...get().battle, strategy } }),

  startBattle: () => {
    const state = get();
    const playerCards = state.leftSlots
      .filter((s) => s.card)
      .map((s) => ({ ...s.card! }));
    const enemyCards = state.rightSlots
      .filter((s) => s.card)
      .map((s) => ({ ...s.card! }));

    set({
      battle: {
        ...state.battle,
        phase: 'entering',
        currentTurn: 0,
        playerCards,
        enemyCards,
        activePlayerCard: null,
        activeEnemyCard: null,
        battleLog: [],
        winner: null,
        isReplaying: false,
      },
    });
  },

  updateBattleState: (updates) =>
    set({ battle: { ...get().battle, ...updates } }),

  setShowResult: (show) => set({ showResult: show }),

  resetBattle: () => {
    const resetRightSlots: CardSlot[] = [0, 1, 2].map((i) => ({
      position: 'right',
      index: i,
      card: enemyDeck[i] ? { ...enemyDeck[i] } : null,
    }));
    set({
      battle: initialBattle,
      showResult: false,
      deck: initialDeck,
      leftSlots: initialLeftSlots,
      rightSlots: resetRightSlots,
    });
  },

  replayBattle: () => {
    const state = get();
    const log = state.battle.battleLog;
    const playerCards = state.leftSlots
      .filter((s) => s.card)
      .map((s) => ({ ...s.card! }));
    const enemyCards = state.rightSlots
      .filter((s) => s.card)
      .map((s) => ({ ...s.card! }));

    set({
      battle: {
        ...state.battle,
        phase: 'entering',
        currentTurn: 0,
        playerCards,
        enemyCards,
        activePlayerCard: null,
        activeEnemyCard: null,
        winner: null,
        isReplaying: true,
        replaySpeed: 2,
        battleLog: log,
      },
      showResult: false,
    });
  },

  saveBattleRecord: () => {
    const state = get();
    const record = {
      version: '1.0',
      date: new Date().toISOString(),
      strategy: state.battle.strategy,
      winner: state.battle.winner,
      turns: state.battle.currentTurn,
      playerCards: state.battle.playerCards,
      enemyCards: state.battle.enemyCards,
      battleLog: state.battle.battleLog,
    };
    const blob = new Blob([JSON.stringify(record, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `void-echoes-battle-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  setReplaying: (replaying) =>
    set({ battle: { ...get().battle, isReplaying: replaying } }),
}));
