import { create } from "zustand";
import type { Material, Recipe, RecipeResult, Potion, BattleState } from "@/types";
import { calculateResult, ALL_RECIPES, ALL_MATERIALS, getInitialInventory } from "@/modules/alchemy";
import { simulateBattle, getRandomEnemyPotion } from "@/modules/battle";

interface GameState {
  inventory: Material[];
  allRecipes: Recipe[];
  discoveredRecipeIds: string[];
  selectedSlot1: Material | null;
  selectedSlot2: Material | null;
  lastResult: RecipeResult | null;
  equippedPotion: Potion | null;
  battle: BattleState;
  experience: number;
  gatherCooldownEnd: number;
  potionInventory: Potion[];
  selectMaterial: (slot: 1 | 2, material: Material | null) => void;
  synthesize: () => void;
  equipPotion: (potion: Potion) => void;
  startBattle: () => void;
  resetBattle: () => void;
  gather: () => void;
  addBattleLog: (log: string) => void;
  updateBattleHp: (who: "player" | "enemy", hp: number) => void;
  setBattlePhase: (phase: "idle" | "fighting" | "finished") => void;
  setBattleWinner: (winner: "player" | "enemy" | "draw" | null) => void;
}

const useGameStore = create<GameState>((set, get) => ({
  inventory: getInitialInventory(),
  allRecipes: ALL_RECIPES,
  discoveredRecipeIds: [],
  selectedSlot1: null,
  selectedSlot2: null,
  lastResult: null,
  equippedPotion: null,
  battle: {
    playerHp: 100,
    playerMaxHp: 100,
    enemyHp: 100,
    enemyMaxHp: 100,
    phase: "idle",
    winner: null,
    logs: [],
    playerPotion: null,
    enemyPotion: null,
  },
  experience: 0,
  gatherCooldownEnd: 0,
  potionInventory: [],

  selectMaterial: (slot, material) => {
    if (material) {
      set((state) => ({
        inventory: state.inventory.map((m) =>
          m.id === material.id ? { ...m, quantity: m.quantity - 1 } : m
        ),
        ...(slot === 1 ? { selectedSlot1: material } : { selectedSlot2: material }),
      }));
    } else {
      set(slot === 1 ? { selectedSlot1: null } : { selectedSlot2: null });
    }
  },

  synthesize: () => {
    const { selectedSlot1, selectedSlot2, discoveredRecipeIds } = get();
    if (!selectedSlot1 || !selectedSlot2) return;

    const result = calculateResult(
      selectedSlot1.id,
      selectedSlot2.id,
      discoveredRecipeIds
    );

    set((state) => {
      const isNewRecipe =
        result.recipeId && !state.discoveredRecipeIds.includes(result.recipeId);

      return {
        lastResult: result,
        discoveredRecipeIds: isNewRecipe
          ? [...state.discoveredRecipeIds, result.recipeId!]
          : state.discoveredRecipeIds,
        potionInventory: result.potion
          ? [...state.potionInventory, result.potion]
          : state.potionInventory,
        experience: result.potion ? state.experience : state.experience + 5,
        selectedSlot1: null,
        selectedSlot2: null,
      };
    });
  },

  equipPotion: (potion) => set({ equippedPotion: potion }),

  startBattle: () => {
    const { equippedPotion, battle } = get();
    if (!equippedPotion) return;
    if (battle.phase !== "idle" && battle.phase !== "finished") return;

    const enemyPotion = getRandomEnemyPotion();
    const result = simulateBattle(equippedPotion, enemyPotion);

    set({
      battle: {
        playerHp: 100,
        playerMaxHp: 100,
        enemyHp: 100,
        enemyMaxHp: 100,
        winner: null,
        logs: [],
        playerPotion: equippedPotion,
        enemyPotion,
        ...result,
        phase: "fighting",
      },
    });
  },

  resetBattle: () =>
    set({
      battle: {
        playerHp: 100,
        playerMaxHp: 100,
        enemyHp: 100,
        enemyMaxHp: 100,
        phase: "idle",
        winner: null,
        logs: [],
        playerPotion: null,
        enemyPotion: null,
      },
    }),

  gather: () => {
    const { gatherCooldownEnd } = get();
    if (gatherCooldownEnd > Date.now()) return;

    const count = Math.random() < 0.5 ? 1 : 2;
    const picked: Material[] = [];
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * ALL_MATERIALS.length);
      picked.push(ALL_MATERIALS[idx]);
    }

    set((state) => {
      const newInventory = state.inventory.map((m) => ({ ...m }));
      for (const mat of picked) {
        const existing = newInventory.find((m) => m.id === mat.id);
        if (existing) {
          existing.quantity += 1;
        } else {
          newInventory.push({ ...mat, quantity: 1 });
        }
      }
      return {
        inventory: newInventory,
        gatherCooldownEnd: Date.now() + 30000,
      };
    });
  },

  addBattleLog: (log) =>
    set((state) => ({
      battle: { ...state.battle, logs: [...state.battle.logs, log] },
    })),

  updateBattleHp: (who, hp) =>
    set((state) => ({
      battle: {
        ...state.battle,
        ...(who === "player" ? { playerHp: hp } : { enemyHp: hp }),
      },
    })),

  setBattlePhase: (phase) =>
    set((state) => ({
      battle: { ...state.battle, phase },
    })),

  setBattleWinner: (winner) =>
    set((state) => ({
      battle: { ...state.battle, winner },
    })),
}));

export default useGameStore;
