import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
  RuneType,
  SpellLevel,
  RuneBoard,
  ExplorationLog,
  AlignmentResult,
} from './types';
import {
  createEmptyBoard,
  checkAlignment,
  consumeMana,
  calculateCombo,
  regenerateMana,
  generateRandomCombination,
  getCombinationKey,
  createExplorationLog,
  getAllSpells,
} from './gameLogic';

interface GameState {
  runeBoard: RuneBoard;
  mana: number;
  maxMana: number;
  combo: number;
  lastCastTime: number;
  isCoolingDown: boolean;
  cooldownStartTime: number;
  discoveredSpells: Set<string>;
  autoExplore: boolean;
  explorationLogs: ExplorationLog[];
  selectedCell: { row: number; col: number } | null;
  showCollection: boolean;
  activeSpellEffect: { type: RuneType; level: SpellLevel; startTime: number } | null;
  pulseEffect: { type: RuneType; startTime: number } | null;
  triedCombinations: Set<string>;
  castFailTime: number | null;
  flyingSpellOrbs: Array<{
    id: string;
    type: RuneType;
    level: SpellLevel;
    startTime: number;
    startX: number;
    startY: number;
  }>;
  boardSize: number;
}

interface GameActions {
  placeRune: (row: number, col: number, type: RuneType) => void;
  clearBoard: () => void;
  castSpell: (type: RuneType, level: SpellLevel) => void;
  updateMana: (delta: number) => void;
  incrementCombo: () => void;
  resetCombo: () => void;
  setCoolingDown: (value: boolean) => void;
  discoverSpell: (spellId: string) => void;
  toggleAutoExplore: () => void;
  addExplorationLog: (log: ExplorationLog) => void;
  toggleCollection: () => void;
  setSelectedCell: (cell: { row: number; col: number } | null) => void;
  setActiveSpellEffect: (effect: { type: RuneType; level: SpellLevel; startTime: number } | null) => void;
  setPulseEffect: (effect: { type: RuneType; startTime: number } | null) => void;
  setCastFailTime: (time: number | null) => void;
  addFlyingSpellOrb: (orb: Omit<GameState['flyingSpellOrbs'][0], 'id' | 'startTime'>) => void;
  removeFlyingSpellOrb: (id: string) => void;
  tick: (deltaTime: number) => void;
  autoExploreTick: () => void;
  setBoardSize: (size: number) => void;
}

const initialBoardSize = typeof window !== 'undefined' && window.innerWidth < 768 ? 2 : 3;

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  runeBoard: createEmptyBoard(initialBoardSize),
  mana: 100,
  maxMana: 100,
  combo: 0,
  lastCastTime: 0,
  isCoolingDown: false,
  cooldownStartTime: 0,
  discoveredSpells: new Set(),
  autoExplore: false,
  explorationLogs: [],
  selectedCell: null,
  showCollection: false,
  activeSpellEffect: null,
  pulseEffect: null,
  triedCombinations: new Set(),
  castFailTime: null,
  flyingSpellOrbs: [],
  boardSize: initialBoardSize,

  placeRune: (row: number, col: number, type: RuneType) => {
    const state = get();
    const newBoard = state.runeBoard.map((r, ri) =>
      r.map((c, ci) => (ri === row && ci === col ? type : c))
    );

    const alignments = checkAlignment(newBoard);

    if (alignments.length > 0) {
      const alignment = alignments[0];
      set({
        runeBoard: newBoard,
        pulseEffect: { type: alignment.type, startTime: Date.now() },
      });

      setTimeout(() => {
        get().addFlyingSpellOrb({
          type: alignment.type,
          level: alignment.level,
          startX: 50,
          startY: 50,
        });
      }, 300);

      setTimeout(() => {
        get().castSpell(alignment.type, alignment.level);
      }, 800);

      const spellId = `${alignment.type}-${alignment.mode}`;
      if (!get().discoveredSpells.has(spellId)) {
        get().discoverSpell(spellId);
      }
    } else {
      set({ runeBoard: newBoard, selectedCell: null });
    }
  },

  clearBoard: () => {
    set({ runeBoard: createEmptyBoard(get().boardSize) });
  },

  castSpell: (type: RuneType, level: SpellLevel) => {
    const state = get();

    if (state.isCoolingDown) {
      set({ castFailTime: Date.now() });
      setTimeout(() => set({ castFailTime: null }), 300);
      return;
    }

    const manaResult = consumeMana(state.mana, level);
    if (!manaResult.success) {
      set({ castFailTime: Date.now() });
      setTimeout(() => set({ castFailTime: null }), 300);
      return;
    }

    const now = Date.now();
    const newCombo = calculateCombo(state.combo, state.lastCastTime);
    const updatedCombo = Math.min(newCombo + 1, 10);

    set({
      mana: manaResult.remaining,
      combo: updatedCombo,
      lastCastTime: now,
      isCoolingDown: true,
      cooldownStartTime: now,
      activeSpellEffect: { type, level, startTime: now },
    });

    setTimeout(() => {
      get().setCoolingDown(false);
      get().setActiveSpellEffect(null);
    }, 1500);
  },

  updateMana: (delta: number) => {
    set((state) => ({
      mana: Math.max(0, Math.min(state.maxMana, state.mana + delta)),
    }));
  },

  incrementCombo: () => {
    set((state) => ({ combo: Math.min(state.combo + 1, 10) }));
  },

  resetCombo: () => {
    set({ combo: 0 });
  },

  setCoolingDown: (value: boolean) => {
    set({ isCoolingDown: value });
  },

  discoverSpell: (spellId: string) => {
    set((state) => {
      const newDiscovered = new Set(state.discoveredSpells);
      newDiscovered.add(spellId);
      return { discoveredSpells: newDiscovered };
    });
  },

  toggleAutoExplore: () => {
    set((state) => ({ autoExplore: !state.autoExplore }));
  },

  addExplorationLog: (log: ExplorationLog) => {
    set((state) => {
      const newLogs = [...state.explorationLogs, log];
      if (newLogs.length > 100) {
        newLogs.shift();
      }
      return { explorationLogs: newLogs };
    });
  },

  toggleCollection: () => {
    set((state) => ({ showCollection: !state.showCollection }));
  },

  setSelectedCell: (cell: { row: number; col: number } | null) => {
    set({ selectedCell: cell });
  },

  setActiveSpellEffect: (effect: { type: RuneType; level: SpellLevel; startTime: number } | null) => {
    set({ activeSpellEffect: effect });
  },

  setPulseEffect: (effect: { type: RuneType; startTime: number } | null) => {
    set({ pulseEffect: effect });
  },

  setCastFailTime: (time: number | null) => {
    set({ castFailTime: time });
  },

  addFlyingSpellOrb: (orb) => {
    set((state) => ({
      flyingSpellOrbs: [
        ...state.flyingSpellOrbs,
        { ...orb, id: uuidv4(), startTime: Date.now() },
      ],
    }));
  },

  removeFlyingSpellOrb: (id: string) => {
    set((state) => ({
      flyingSpellOrbs: state.flyingSpellOrbs.filter((o) => o.id !== id),
    }));
  },

  tick: (deltaTime: number) => {
    const state = get();

    if (state.mana < state.maxMana) {
      const newMana = regenerateMana(state.mana, state.maxMana, deltaTime);
      set({ mana: newMana });
    }

    if (state.combo > 0 && Date.now() - state.lastCastTime > 5000) {
      set({ combo: 0 });
    }

    const orbsToRemove = state.flyingSpellOrbs.filter(
      (orb) => Date.now() - orb.startTime > 800
    );
    orbsToRemove.forEach((orb) => get().removeFlyingSpellOrb(orb.id));

    if (state.pulseEffect && Date.now() - state.pulseEffect.startTime > 600) {
      set({ pulseEffect: null });
    }
  },

  autoExploreTick: () => {
    const state = get();
    if (!state.autoExplore) return;

    const playerPlaced = state.runeBoard.flat().some((r) => r !== null);
    if (playerPlaced) return;

    const newBoard = generateRandomCombination(state.triedCombinations, state.boardSize);
    if (!newBoard) return;

    const key = getCombinationKey(newBoard);
    set((s) => {
      const newTried = new Set(s.triedCombinations);
      newTried.add(key);
      return { triedCombinations: newTried, runeBoard: newBoard };
    });

    const alignments = checkAlignment(newBoard);
    const runes = newBoard.flat().filter((r): r is RuneType => r !== null);

    if (alignments.length > 0) {
      const alignment = alignments[0];
      const spellId = `${alignment.type}-${alignment.mode}`;

      set({
        pulseEffect: { type: alignment.type, startTime: Date.now() },
      });

      if (!get().discoveredSpells.has(spellId)) {
        get().discoverSpell(spellId);
      }

      get().addExplorationLog(
        createExplorationLog(runes, true, alignment.level)
      );

      setTimeout(() => {
        get().clearBoard();
      }, 2000);
    } else {
      get().addExplorationLog(createExplorationLog(runes, false));
      setTimeout(() => {
        get().clearBoard();
      }, 1000);
    }
  },

  setBoardSize: (size: number) => {
    set({ boardSize: size, runeBoard: createEmptyBoard(size) });
  },
}));

export { getAllSpells };
