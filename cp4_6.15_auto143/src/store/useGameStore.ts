import { create } from 'zustand';
import type { RaceConfig, CardInstance, BattleAction, BattleSnapshot } from '@/data/RaceData';
import { DEFAULT_RACES, loadSavedRaces, saveCustomRace } from '@/data/RaceData';

type ViewMode = 'editor' | 'cards' | 'battle';

interface GameState {
  view: ViewMode;
  currentRace: RaceConfig;
  allRaces: RaceConfig[];
  cards: CardInstance[];
  battleCards: CardInstance[];
  currentTeam: 'blue' | 'red';
  turn: number;
  actions: BattleAction[];
  snapshots: BattleSnapshot[];
  selectedCardId: string | null;
  battleEnded: boolean;
  showReplay: boolean;
  replayIndex: number;

  setView: (v: ViewMode) => void;
  setCurrentRace: (r: RaceConfig) => void;
  updateCurrentRaceAttributes: (attr: Partial<RaceConfig['attributes']>) => void;
  updateCurrentRaceSkills: (skills: string[]) => void;
  saveCurrentRace: () => void;
  loadAllRaces: () => void;
  addCard: (card: CardInstance) => void;
  removeCard: (id: string) => void;
  clearCards: () => void;
  initBattle: () => void;
  placeBattleCard: (cardId: string, row: number, col: number) => void;
  selectCard: (id: string | null) => void;
  executeAttack: (attackerId: string, targetId: string) => void;
  endTurn: () => void;
  takeSnapshot: () => void;
  setBattleEnded: (v: boolean) => void;
  setShowReplay: (v: boolean) => void;
  restoreSnapshot: (index: number) => void;
  resetBattle: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  view: 'editor',
  currentRace: DEFAULT_RACES[0],
  allRaces: [...DEFAULT_RACES],
  cards: [],
  battleCards: [],
  currentTeam: 'blue',
  turn: 1,
  actions: [],
  snapshots: [],
  selectedCardId: null,
  battleEnded: false,
  showReplay: false,
  replayIndex: -1,

  setView: (v) => set({ view: v }),

  setCurrentRace: (r) => set({ currentRace: r }),

  updateCurrentRaceAttributes: (attr) =>
    set((s) => ({
      currentRace: {
        ...s.currentRace,
        attributes: { ...s.currentRace.attributes, ...attr },
      },
    })),

  updateCurrentRaceSkills: (skills) =>
    set((s) => ({
      currentRace: { ...s.currentRace, skills },
    })),

  saveCurrentRace: () => {
    const race = get().currentRace;
    const customRace = { ...race, isCustom: true, id: race.isCustom ? race.id : `custom_${Date.now()}` };
    saveCustomRace(customRace);
    get().loadAllRaces();
  },

  loadAllRaces: () => {
    const saved = loadSavedRaces();
    set({ allRaces: [...DEFAULT_RACES, ...saved] });
  },

  addCard: (card) => set((s) => ({ cards: [...s.cards, card] })),

  removeCard: (id) => set((s) => ({ cards: s.cards.filter((c) => c.id !== id) })),

  clearCards: () => set({ cards: [] }),

  initBattle: () => {
    const cards = get().cards;
    set({
      battleCards: cards.map((c) => ({ ...c, currentHp: c.maxHp, skillCooldowns: {} })),
      currentTeam: 'blue',
      turn: 1,
      actions: [],
      snapshots: [],
      selectedCardId: null,
      battleEnded: false,
      showReplay: false,
      replayIndex: -1,
    });
  },

  placeBattleCard: (cardId, row, col) =>
    set((s) => ({
      battleCards: s.battleCards.map((c) =>
        c.id === cardId ? { ...c, gridPos: { row, col } } : c
      ),
    })),

  selectCard: (id) => set({ selectedCardId: id }),

  executeAttack: (attackerId, targetId) => {
    const state = get();
    const attacker = state.battleCards.find((c) => c.id === attackerId);
    const target = state.battleCards.find((c) => c.id === targetId);
    if (!attacker || !target) return;

    const baseDmg = Math.max(1, attacker.race.attributes.attack - target.race.attributes.defense * 0.5);
    const variance = 0.8 + Math.random() * 0.4;
    const damage = Math.round(baseDmg * variance);

    const targetHpBefore = target.currentHp;
    const attackerHpBefore = attacker.currentHp;
    const targetHpAfter = Math.max(0, target.currentHp - damage);

    const action: BattleAction = {
      turn: state.turn,
      timestamp: Date.now(),
      attackerId,
      attackerName: attacker.race.name,
      targetId,
      targetName: target.race.name,
      damage,
      attackerHpBefore,
      targetHpBefore,
      attackerHpAfter: attackerHpBefore,
      targetHpAfter,
    };

    const newCards = state.battleCards.map((c) => {
      if (c.id === targetId) return { ...c, currentHp: targetHpAfter };
      return c;
    });

    const blueAlive = newCards.some((c) => c.team === 'blue' && c.currentHp > 0);
    const redAlive = newCards.some((c) => c.team === 'red' && c.currentHp > 0);
    const ended = !blueAlive || !redAlive;

    set((s) => ({
      battleCards: newCards,
      actions: [...s.actions, action],
      selectedCardId: null,
      battleEnded: ended,
    }));

    get().takeSnapshot();
  },

  endTurn: () =>
    set((s) => ({
      currentTeam: s.currentTeam === 'blue' ? 'red' : 'blue',
      turn: s.currentTeam === 'red' ? s.turn + 1 : s.turn,
      selectedCardId: null,
    })),

  takeSnapshot: () => {
    const s = get();
    set({
      snapshots: [
        ...s.snapshots,
        {
          turn: s.turn,
          cards: JSON.parse(JSON.stringify(s.battleCards)),
          currentTeam: s.currentTeam,
          actions: [...s.actions],
        },
      ],
    });
  },

  setBattleEnded: (v) => set({ battleEnded: v }),

  setShowReplay: (v) => set({ showReplay: v }),

  restoreSnapshot: (index) => {
    const snap = get().snapshots[index];
    if (!snap) return;
    set({
      battleCards: JSON.parse(JSON.stringify(snap.cards)),
      turn: snap.turn,
      currentTeam: snap.currentTeam,
      replayIndex: index,
    });
  },

  resetBattle: () =>
    set({
      battleCards: [],
      currentTeam: 'blue',
      turn: 1,
      actions: [],
      snapshots: [],
      selectedCardId: null,
      battleEnded: false,
      showReplay: false,
      replayIndex: -1,
    }),
}));
