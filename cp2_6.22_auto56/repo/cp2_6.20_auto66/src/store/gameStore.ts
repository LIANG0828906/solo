import { create } from 'zustand';
import type {
  Character,
  Enemy,
  CombatState,
  DungeonMap,
  GameEvent,
  Item,
  EquipmentSlot,
  DiceAnimationState,
  EventResult,
} from '../types';

interface GameStore {
  character: Character | null;
  combat: CombatState | null;
  dungeon: DungeonMap | null;
  currentEvent: GameEvent | null;
  eventResult: EventResult | null;
  diceAnimation: DiceAnimationState;
  inventoryOpen: boolean;

  setCharacter: (character: Character | null) => void;
  updateCharacter: (updates: Partial<Character>) => void;

  startCombat: (enemy: Enemy) => void;
  endCombat: () => void;
  updateCombat: (updates: Partial<CombatState>) => void;
  addCombatLog: (message: string) => void;

  setDungeon: (dungeon: DungeonMap) => void;
  updateDungeon: (updates: Partial<DungeonMap>) => void;
  movePlayer: (x: number, y: number) => void;

  setCurrentEvent: (event: GameEvent | null) => void;
  setEventResult: (result: EventResult | null) => void;
  applyEventResult: (result: EventResult) => void;

  setDiceAnimation: (state: Partial<DiceAnimationState>) => void;

  addItem: (item: Item) => void;
  removeItem: (itemId: string) => void;
  equipItem: (itemId: string, slot: EquipmentSlot) => void;
  unequipItem: (slot: EquipmentSlot) => void;
  useItem: (itemId: string) => void;

  toggleInventory: () => void;
  setInventoryOpen: (open: boolean) => void;

  gainExperience: (amount: number) => void;
  heal: (amount: number) => void;
  restoreMana: (amount: number) => void;
  takeDamage: (amount: number) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  character: null,
  combat: null,
  dungeon: null,
  currentEvent: null,
  eventResult: null,
  diceAnimation: { rolling: false, value: null, finalValue: null },
  inventoryOpen: false,

  setCharacter: (character) => set({ character }),

  updateCharacter: (updates) =>
    set((state) =>
      state.character ? { character: { ...state.character, ...updates } } : state
    ),

  startCombat: (enemy) =>
    set((state) => ({
      combat: {
        active: true,
        turn: 'player',
        player: state.character!,
        enemy,
        log: [`遭遇了 ${enemy.name}！`],
        playerDefending: false,
      },
    })),

  endCombat: () => set({ combat: null }),

  updateCombat: (updates) =>
    set((state) =>
      state.combat ? { combat: { ...state.combat, ...updates } } : state
    ),

  addCombatLog: (message) =>
    set((state) =>
      state.combat
        ? { combat: { ...state.combat, log: [...state.combat.log, message] } }
        : state
    ),

  setDungeon: (dungeon) => set({ dungeon }),

  updateDungeon: (updates) =>
    set((state) =>
      state.dungeon ? { dungeon: { ...state.dungeon, ...updates } } : state
    ),

  movePlayer: (x, y) =>
    set((state) => {
      if (!state.dungeon) return state;
      const cells = state.dungeon.cells.map((row) =>
        row.map((cell) => {
          if (cell.x === x && cell.y === y) {
            return { ...cell, status: 'visited' as const };
          }
          const dx = Math.abs(cell.x - x);
          const dy = Math.abs(cell.y - y);
          if (dx <= 1 && dy <= 1 && cell.status === 'hidden') {
            return { ...cell, status: 'revealed' as const };
          }
          return cell;
        })
      );
      return {
        dungeon: {
          ...state.dungeon,
          cells,
          playerPosition: { x, y },
        },
      };
    }),

  setCurrentEvent: (event) => set({ currentEvent: event }),

  setEventResult: (result) => set({ eventResult: result }),

  applyEventResult: (result) =>
    set((state) => {
      if (!state.character) return state;
      const char = { ...state.character };

      if (result.healthChange) {
        char.currentHealth = Math.max(
          0,
          Math.min(char.maxHealth, char.currentHealth + result.healthChange)
        );
      }
      if (result.manaChange) {
        char.currentMana = Math.max(
          0,
          Math.min(char.maxMana, char.currentMana + result.manaChange)
        );
      }
      if (result.goldChange) {
        char.gold = Math.max(0, char.gold + result.goldChange);
      }
      if (result.experienceChange) {
        let exp = char.experience + result.experienceChange;
        let level = char.level;
        let expToNext = char.experienceToNext;
        let skillPoints = char.skillPoints;

        while (exp >= expToNext) {
          exp -= expToNext;
          level++;
          expToNext = Math.floor(expToNext * 1.5);
          skillPoints += 3;
        }

        char.experience = exp;
        char.level = level;
        char.experienceToNext = expToNext;
        char.skillPoints = skillPoints;
      }
      if (result.items && result.items.length > 0) {
        char.inventory = [...char.inventory, ...result.items];
      }

      return { character: char, eventResult: result };
    }),

  setDiceAnimation: (stateUpdate) =>
    set((state) => ({
      diceAnimation: { ...state.diceAnimation, ...stateUpdate },
    })),

  addItem: (item) =>
    set((state) => {
      if (!state.character) return state;
      return {
        character: {
          ...state.character,
          inventory: [...state.character.inventory, item],
        },
      };
    }),

  removeItem: (itemId) =>
    set((state) => {
      if (!state.character) return state;
      return {
        character: {
          ...state.character,
          inventory: state.character.inventory.filter((i) => i.id !== itemId),
        },
      };
    }),

  equipItem: (itemId, slot) =>
    set((state) => {
      if (!state.character) return state;
      const item = state.character.inventory.find((i) => i.id === itemId);
      if (!item) return state;

      const currentEquipped = state.character.equipment[slot];
      const newInventory = state.character.inventory.filter((i) => i.id !== itemId);
      if (currentEquipped) {
        newInventory.push(currentEquipped);
      }

      const newEquipment = { ...state.character.equipment, [slot]: item };

      const baseAttrs = { ...state.character.baseAttributes };
      const totalAttrs = { ...baseAttrs };
      Object.values(newEquipment).forEach((eq) => {
        if (eq?.attributes) {
          (Object.keys(eq.attributes) as (keyof typeof totalAttrs)[]).forEach((key) => {
            totalAttrs[key] += eq.attributes![key] || 0;
          });
        }
      });

      return {
        character: {
          ...state.character,
          inventory: newInventory,
          equipment: newEquipment,
          attributes: totalAttrs,
        },
      };
    }),

  unequipItem: (slot) =>
    set((state) => {
      if (!state.character) return state;
      const item = state.character.equipment[slot];
      if (!item) return state;

      const newEquipment = { ...state.character.equipment, [slot]: null };
      const newInventory = [...state.character.inventory, item];

      const baseAttrs = { ...state.character.baseAttributes };
      const totalAttrs = { ...baseAttrs };
      Object.values(newEquipment).forEach((eq) => {
        if (eq?.attributes) {
          (Object.keys(eq.attributes) as (keyof typeof totalAttrs)[]).forEach((key) => {
            totalAttrs[key] += eq.attributes![key] || 0;
          });
        }
      });

      return {
        character: {
          ...state.character,
          inventory: newInventory,
          equipment: newEquipment,
          attributes: totalAttrs,
        },
      };
    }),

  useItem: (itemId) =>
    set((state) => {
      if (!state.character) return state;
      const item = state.character.inventory.find((i) => i.id === itemId);
      if (!item || item.type !== 'consumable') return state;

      let newHealth = state.character.currentHealth;
      let newMana = state.character.currentMana;

      if (item.effects?.health) {
        newHealth = Math.min(
          state.character.maxHealth,
          newHealth + item.effects.health
        );
      }
      if (item.effects?.mana) {
        newMana = Math.min(state.character.maxMana, newMana + item.effects.mana);
      }

      const newInventory = state.character.inventory.filter((i) => i.id !== itemId);

      return {
        character: {
          ...state.character,
          currentHealth: newHealth,
          currentMana: newMana,
          inventory: newInventory,
        },
      };
    }),

  toggleInventory: () => set((state) => ({ inventoryOpen: !state.inventoryOpen })),

  setInventoryOpen: (open) => set({ inventoryOpen: open }),

  gainExperience: (amount) =>
    set((state) => {
      if (!state.character) return state;
      let exp = state.character.experience + amount;
      let level = state.character.level;
      let expToNext = state.character.experienceToNext;
      let skillPoints = state.character.skillPoints;

      while (exp >= expToNext) {
        exp -= expToNext;
        level++;
        expToNext = Math.floor(expToNext * 1.5);
        skillPoints += 3;
      }

      return {
        character: {
          ...state.character,
          experience: exp,
          level,
          experienceToNext: expToNext,
          skillPoints,
        },
      };
    }),

  heal: (amount) =>
    set((state) => {
      if (!state.character) return state;
      return {
        character: {
          ...state.character,
          currentHealth: Math.min(
            state.character.maxHealth,
            state.character.currentHealth + amount
          ),
        },
      };
    }),

  restoreMana: (amount) =>
    set((state) => {
      if (!state.character) return state;
      return {
        character: {
          ...state.character,
          currentMana: Math.min(
            state.character.maxMana,
            state.character.currentMana + amount
          ),
        },
      };
    }),

  takeDamage: (amount) =>
    set((state) => {
      if (!state.character) return state;
      return {
        character: {
          ...state.character,
          currentHealth: Math.max(0, state.character.currentHealth - amount),
        },
      };
    }),
}));
