import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
  GameState,
  FurnitureId,
  ItemId,
  Furniture,
  INITIAL_FURNITURE,
  INITIAL_PUZZLES,
  COMBINATION_RULES,
  Particle,
} from './types';

const deepCloneFurniture = (f: Record<FurnitureId, Furniture>) =>
  JSON.parse(JSON.stringify(f)) as Record<FurnitureId, Furniture>;

export const useGameStore = create<GameState>((set, get) => ({
  collectedItems: [],
  selectedItem: null,
  furniture: deepCloneFurniture(INITIAL_FURNITURE),
  puzzles: { ...INITIAL_PUZZLES },
  activePuzzleId: null,
  puzzleChain: { layer1: false, layer2: false, layer3: false },
  completedPuzzles: [],
  activeFurnitureOverlay: null,
  overlayClickPosition: null,
  victory: false,
  draggedItemId: null,
  dropHoverTarget: null,
  flashEvents: [],
  particles: [],
  itemBarCollapsed: false,
  highlightNewItem: null,

  addItem: (itemId: ItemId) => {
    const state = get();
    if (state.collectedItems.includes(itemId)) return;
    set({
      collectedItems: [...state.collectedItems, itemId],
      highlightNewItem: itemId,
    });
    if (state.itemBarCollapsed) {
      set({ itemBarCollapsed: false });
    }
    setTimeout(() => {
      if (get().highlightNewItem === itemId) {
        set({ highlightNewItem: null });
      }
    }, 2000);
  },

  removeItem: (itemId: ItemId) => {
    set((s) => ({
      collectedItems: s.collectedItems.filter((i) => i !== itemId),
    }));
  },

  setSelectedItem: (itemId: ItemId | null) => {
    set({ selectedItem: itemId });
  },

  openFurnitureOverlay: (id: FurnitureId, clickPos) => {
    set({ activeFurnitureOverlay: id, overlayClickPosition: clickPos ?? null });
  },

  closeFurnitureOverlay: () => {
    set({ activeFurnitureOverlay: null, overlayClickPosition: null });
  },

  collectHiddenItem: (furnitureId: FurnitureId, itemId: ItemId) => {
    const state = get();
    const furniture = state.furniture[furnitureId];
    if (!furniture) return;
    const hiddenItem = furniture.hiddenItems.find((h) => h.itemId === itemId);
    if (!hiddenItem || hiddenItem.collected) return;
    if (hiddenItem.requiresItem && !state.collectedItems.includes(hiddenItem.requiresItem)) return;
    if (furniture.locked && furniture.unlockedBy && !state.collectedItems.includes(furniture.unlockedBy)) return;

    const newFurniture = {
      ...state.furniture,
      [furnitureId]: {
        ...furniture,
        hiddenItems: furniture.hiddenItems.map((h) =>
          h.itemId === itemId ? { ...h, collected: true } : h
        ),
      },
    };
    set({ furniture: newFurniture });
    state.addItem(itemId);
  },

  tryCombine: (itemId: ItemId, targetFurnitureId: FurnitureId) => {
    const state = get();
    const rule = COMBINATION_RULES.find(
      (r) => r.itemId === itemId && r.targetId === targetFurnitureId
    );
    if (!rule) return false;

    const targetFurniture = state.furniture[targetFurnitureId];
    if (rule.requiredItems) {
      const hasAll = rule.requiredItems.every((ri) => state.collectedItems.includes(ri));
      if (!hasAll) return false;
    }

    if (rule.unlocksFurniture) {
      const unlocked = rule.unlocksFurniture;
      const furnPos = state.furniture[unlocked].position;
      set((s) => ({
        furniture: {
          ...s.furniture,
          [unlocked]: { ...s.furniture[unlocked], locked: false },
        },
      }));
      get().spawnParticles(
        { x: furnPos.x + furnPos.w / 2, y: furnPos.y + furnPos.h / 2 }
      );
    }

    if (rule.unlocksPuzzle) {
      setTimeout(() => {
        get().openPuzzle(rule.unlocksPuzzle as string);
      }, 400);
    }

    if (rule.resultItem) {
      get().addItem(rule.resultItem as ItemId);
    }

    if (rule.triggersLayer) {
      const layer = `layer${rule.triggersLayer}` as keyof typeof state.puzzleChain;
      set((s) => ({ puzzleChain: { ...s.puzzleChain, [layer]: true } }));
    }

    if (targetFurnitureId === 'door' && itemId === 'key_large') {
      set({ victory: true });
    }

    return true;
  },

  openPuzzle: (puzzleId: string) => {
    set({ activePuzzleId: puzzleId });
  },

  closePuzzle: () => {
    set({ activePuzzleId: null });
  },

  solvePuzzle: (puzzleId: string, triggerPos) => {
    const state = get();
    const puzzle = state.puzzles[puzzleId];
    if (!puzzle) return;
    if (state.completedPuzzles.includes(puzzleId)) return;

    const pos =
      triggerPos ?? {
        x: state.furniture[puzzle.targetFurnitureId].position.x +
          state.furniture[puzzle.targetFurnitureId].position.w / 2,
        y: state.furniture[puzzle.targetFurnitureId].position.y +
          state.furniture[puzzle.targetFurnitureId].position.h / 2,
      };

    const newCompleted = [...state.completedPuzzles, puzzleId];
    const newChain = {
      ...state.puzzleChain,
      [`layer${puzzle.unlocksLayer}` as keyof typeof state.puzzleChain]: true,
    };

    set({
      completedPuzzles: newCompleted,
      puzzleChain: newChain,
      activePuzzleId: null,
    });

    if (puzzle.rewards) {
      puzzle.rewards.forEach((r, i) => {
        setTimeout(() => {
          get().addItem(r as ItemId);
          if (puzzle.type === 'assembly') {
            get().removeItem('puzzle_piece_1');
            get().removeItem('puzzle_piece_2');
            get().removeItem('puzzle_piece_3');
          }
        }, i * 200);
      });
    }

    get().addFlashEvent(pos, 'puzzle_solve');
    get().spawnParticles(pos, '#66ccff', 40);
  },

  setDraggedItem: (itemId: ItemId | null) => {
    set({ draggedItemId: itemId });
  },

  setDropHoverTarget: (target: FurnitureId | null) => {
    set({ dropHoverTarget: target });
  },

  addFlashEvent: (position, type) => {
    const id = uuidv4();
    set((s) => ({ flashEvents: [...s.flashEvents, { id, position, type }] }));
    setTimeout(() => {
      get().clearFlashEvent(id);
    }, 1200);
  },

  clearFlashEvent: (id: string) => {
    set((s) => ({ flashEvents: s.flashEvents.filter((f) => f.id !== id) }));
  },

  spawnParticles: (origin, color = '#ffd700', count = 24) => {
    const newParticles: Particle[] = Array.from({ length: count }, () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 4;
      return {
        id: uuidv4(),
        x: origin.x,
        y: origin.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 1,
        color,
        size: 3 + Math.random() * 4,
      };
    });
    set((s) => ({ particles: [...s.particles, ...newParticles] }));
    setTimeout(() => {
      newParticles.forEach((p) => get().clearParticle(p.id));
    }, 1100);
  },

  clearParticle: (id: string) => {
    set((s) => ({ particles: s.particles.filter((p) => p.id !== id) }));
  },

  toggleItemBarCollapsed: () => {
    set((s) => ({ itemBarCollapsed: !s.itemBarCollapsed }));
  },

  setItemBarCollapsed: (collapsed: boolean) => {
    set({ itemBarCollapsed: collapsed });
  },

  setHighlightNewItem: (itemId: ItemId | null) => {
    set({ highlightNewItem: itemId });
  },

  reset: () => {
    set({
      collectedItems: [],
      selectedItem: null,
      furniture: deepCloneFurniture(INITIAL_FURNITURE),
      puzzles: { ...INITIAL_PUZZLES },
      activePuzzleId: null,
      puzzleChain: { layer1: false, layer2: false, layer3: false },
      completedPuzzles: [],
      activeFurnitureOverlay: null,
      overlayClickPosition: null,
      victory: false,
      draggedItemId: null,
      dropHoverTarget: null,
      flashEvents: [],
      particles: [],
      itemBarCollapsed: false,
      highlightNewItem: null,
    });
  },
}));
