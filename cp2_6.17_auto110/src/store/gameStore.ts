import { create } from 'zustand';
import { Recipe, AlchemySchool } from '../types';
import { MaterialRegistry } from '../modules/engine/MaterialRegistry';

interface InventoryEntry {
  materialId: string;
  count: number;
  addedAt: number;
}

interface GameStoreState {
  inventory: InventoryEntry[];
  crucible: string[];
  unlockedRecipes: Set<string>;
  discoveredMaterials: Set<string>;
  toastMessage: string | null;
  showHintPanel: boolean;
  showSettingsMenu: boolean;
  showResetConfirm: boolean;
  recipes: Recipe[];
  crucibleShaking: boolean;
  lastCraftResult: 'success' | 'failure' | null;
  newlyUnlockedMaterial: string | null;

  addRandomMaterial: () => void;
  addToCrucible: (materialId: string) => boolean;
  removeFromCrucible: (index: number) => void;
  clearCrucible: () => void;
  performCraft: () => 'success' | 'failure' | 'no_recipe';
  showToast: (message: string) => void;
  hideToast: () => void;
  toggleHintPanel: () => void;
  toggleSettingsMenu: () => void;
  closeSettingsMenu: () => void;
  showResetDialog: () => void;
  hideResetDialog: () => void;
  resetGame: () => void;
  setCrucibleShaking: (shaking: boolean) => void;
  clearLastCraftResult: () => void;
  clearNewlyUnlocked: () => void;
}

const RECIPES: Recipe[] = [
  {
    id: 'r_healing_potion',
    name: '治疗药水',
    materials: ['water', 'herb_leaf', 'seed'],
    output: 'healing_potion',
    school: AlchemySchool.LIFE_MATTER,
    hint: '清水浇灌嫩芽，生命由此萌发。',
    probability: 0.9,
  },
  {
    id: 'r_fire_elixir',
    name: '火焰药剂',
    materials: ['fire_ash', 'sulphur', 'charcoal'],
    output: 'fire_elixir',
    school: AlchemySchool.BASIC_ELEMENT,
    hint: '灰烬中余温未散，硫磺点燃远古怒火。',
    probability: 0.85,
  },
  {
    id: 'r_storm_bottle',
    name: '风暴之瓶',
    materials: ['wind_dust', 'water', 'quicksilver'],
    output: 'storm_bottle',
    school: AlchemySchool.BASIC_ELEMENT,
    hint: '风与水在液态银中旋舞。',
    probability: 0.75,
  },
  {
    id: 'r_moonlight_essence',
    name: '月光精华',
    materials: ['moonstone', 'crystal', 'mana_pollen'],
    output: 'moonlight_essence',
    school: AlchemySchool.MAGIC_ENERGY,
    hint: '月华凝于晶石，魔法花粉照亮夜空。',
    probability: 0.6,
  },
  {
    id: 'r_dragon_breath',
    name: '龙息药剂',
    materials: ['dragon_scale', 'phoenix_feather', 'fire_ash', 'sulphur'],
    output: 'dragon_breath',
    school: AlchemySchool.HOLY_ESSENCE,
    hint: '龙之坚鳞与不死之羽，在火焰中重铸传奇。',
    probability: 0.4,
  },
  {
    id: 'r_earth_shield',
    name: '大地护盾',
    materials: ['earth', 'stone', 'iron_ore'],
    output: 'earth_shield',
    school: AlchemySchool.BASIC_ELEMENT,
    hint: '泥土与铁石，铸就坚不可摧的屏障。',
    probability: 0.85,
  },
  {
    id: 'r_void_portal',
    name: '虚空之门',
    materials: ['void_crystal', 'obsidian', 'demon_essence'],
    output: 'void_portal',
    school: AlchemySchool.SHADOW_MATTER,
    hint: '黑耀石上，虚空晶体映照深渊。',
    probability: 0.5,
  },
  {
    id: 'r_steam_automaton',
    name: '蒸汽机械',
    materials: ['gears', 'coil_spring', 'steam_core', 'iron_ore'],
    output: 'steam_automaton',
    school: AlchemySchool.MECHANICAL_CONSTRUCT,
    hint: '齿轮与弹簧，在蒸汽心脏中苏醒。',
    probability: 0.55,
  },
  {
    id: 'r_philosopher_stone',
    name: '贤者之石',
    materials: ['aether', 'philosopher_stone_dust', 'soul_stone', 'sun_fragment'],
    output: 'philosopher_stone',
    school: AlchemySchool.HOLY_ESSENCE,
    hint: '以太为基，灵魂为引，太阳之火点燃永恒。',
    probability: 0.2,
  },
  {
    id: 'r_life_elixir',
    name: '生命药剂',
    materials: ['world_tree_heart', 'seed', 'herb_leaf', 'glow_moss'],
    output: 'life_elixir',
    school: AlchemySchool.LIFE_MATTER,
    hint: '世界树之心，孕育万物复苏之力。',
    probability: 0.35,
  },
  {
    id: 'r_amber_charm',
    name: '琥珀护符',
    materials: ['amber', 'crystal', 'spider_silk'],
    output: 'amber_charm',
    school: AlchemySchool.MAGIC_ENERGY,
    hint: '凝固的时间在晶石蛛网中闪耀。',
    probability: 0.7,
  },
  {
    id: 'r_poison_vial',
    name: '剧毒小瓶',
    materials: ['snake_venom', 'mushroom', 'bone_dust'],
    output: 'poison_vial',
    school: AlchemySchool.SHADOW_MATTER,
    hint: '毒蛇之液与腐菌白骨，酝酿死亡之吻。',
    probability: 0.8,
  },
];

const MAX_INVENTORY_KINDS = 20;
const MAX_STACK = 99;
const MAX_CRUCIBLE = 6;

const getInitialInventory = (): InventoryEntry[] => {
  const now = Date.now();
  return [
    { materialId: 'water', count: 5, addedAt: now - 5000 },
    { materialId: 'earth', count: 5, addedAt: now - 4000 },
    { materialId: 'fire_ash', count: 3, addedAt: now - 3000 },
    { materialId: 'herb_leaf', count: 4, addedAt: now - 2000 },
    { materialId: 'seed', count: 3, addedAt: now - 1000 },
  ];
};

export const useGameStore = create<GameStoreState>((set, get) => ({
  inventory: getInitialInventory(),
  crucible: [],
  unlockedRecipes: new Set<string>(),
  discoveredMaterials: new Set<string>(['water', 'earth', 'fire_ash', 'herb_leaf', 'seed']),
  toastMessage: null,
  showHintPanel: false,
  showSettingsMenu: false,
  showResetConfirm: false,
  recipes: RECIPES,
  crucibleShaking: false,
  lastCraftResult: null,
  newlyUnlockedMaterial: null,

  addRandomMaterial: () => {
    const material = MaterialRegistry.getRandomMaterial();
    set((state) => {
      const existingIndex = state.inventory.findIndex((i) => i.materialId === material.id);
      let newInventory: InventoryEntry[];
      const newDiscovered = new Set(state.discoveredMaterials);
      let newlyUnlocked: string | null = null;

      if (existingIndex >= 0) {
        newInventory = [...state.inventory];
        const existing = newInventory[existingIndex];
        newInventory[existingIndex] = {
          ...existing,
          count: Math.min(existing.count + 1, MAX_STACK),
        };
      } else {
        newInventory = [...state.inventory, { materialId: material.id, count: 1, addedAt: Date.now() }];
        if (newInventory.length > MAX_INVENTORY_KINDS) {
          newInventory = newInventory.sort((a, b) => a.addedAt - b.addedAt).slice(-MAX_INVENTORY_KINDS);
        }
        if (!newDiscovered.has(material.id)) {
          newDiscovered.add(material.id);
          newlyUnlocked = material.id;
        }
      }

      return {
        inventory: newInventory,
        discoveredMaterials: newDiscovered,
        newlyUnlockedMaterial: newlyUnlocked,
      };
    });
  },

  addToCrucible: (materialId: string): boolean => {
    const state = get();
    if (state.crucible.length >= MAX_CRUCIBLE) {
      return false;
    }
    const invItem = state.inventory.find((i) => i.materialId === materialId);
    if (!invItem || invItem.count <= 0) {
      return false;
    }
    set((s) => ({
      crucible: [...s.crucible, materialId],
      inventory: s.inventory.map((i) =>
        i.materialId === materialId ? { ...i, count: i.count - 1 } : i
      ),
    }));
    return true;
  },

  removeFromCrucible: (index: number) => {
    set((state) => {
      const materialId = state.crucible[index];
      if (!materialId) return state;
      const newCrucible = state.crucible.filter((_, i) => i !== index);
      const existing = state.inventory.find((i) => i.materialId === materialId);
      const newInventory = existing
        ? state.inventory.map((i) =>
            i.materialId === materialId ? { ...i, count: Math.min(i.count + 1, MAX_STACK) } : i
          )
        : [...state.inventory, { materialId, count: 1, addedAt: Date.now() }];
      return { crucible: newCrucible, inventory: newInventory };
    });
  },

  clearCrucible: () => {
    set((state) => {
      const newInventory = [...state.inventory];
      state.crucible.forEach((mid) => {
        const idx = newInventory.findIndex((i) => i.materialId === mid);
        if (idx >= 0) {
          newInventory[idx] = { ...newInventory[idx], count: Math.min(newInventory[idx].count + 1, MAX_STACK) };
        } else {
          newInventory.push({ materialId: mid, count: 1, addedAt: Date.now() });
        }
      });
      return { crucible: [], inventory: newInventory };
    });
  },

  performCraft: (): 'success' | 'failure' | 'no_recipe' => {
    const state = get();
    if (state.crucible.length === 0) return 'no_recipe';

    const crucibleCount: Record<string, number> = {};
    state.crucible.forEach((mid) => {
      crucibleCount[mid] = (crucibleCount[mid] || 0) + 1;
    });
    const crucibleKeys = Object.keys(crucibleCount).sort();

    for (const recipe of state.recipes) {
      const recipeCount: Record<string, number> = {};
      recipe.materials.forEach((mid) => {
        recipeCount[mid] = (recipeCount[mid] || 0) + 1;
      });
      const recipeKeys = Object.keys(recipeCount).sort();

      if (crucibleKeys.length !== recipeKeys.length) continue;
      let match = true;
      for (let i = 0; i < crucibleKeys.length; i++) {
        if (crucibleKeys[i] !== recipeKeys[i] || crucibleCount[crucibleKeys[i]] !== recipeCount[recipeKeys[i]]) {
          match = false;
          break;
        }
      }

      if (match) {
        const success = Math.random() < recipe.probability;
        if (success) {
          set((s) => {
            const newUnlocked = new Set(s.unlockedRecipes);
            newUnlocked.add(recipe.id);
            const newDiscovered = new Set(s.discoveredMaterials);
            let newlyUnlocked: string | null = null;
            if (!newDiscovered.has(recipe.output)) {
              newDiscovered.add(recipe.output);
              newlyUnlocked = recipe.output;
            }
            const existingIdx = s.inventory.findIndex((i) => i.materialId === recipe.output);
            let newInventory: InventoryEntry[];
            if (existingIdx >= 0) {
              newInventory = s.inventory.map((i) =>
                i.materialId === recipe.output ? { ...i, count: Math.min(i.count + 1, MAX_STACK) } : i
              );
            } else {
              newInventory = [...s.inventory, { materialId: recipe.output, count: 1, addedAt: Date.now() }];
              if (newInventory.length > MAX_INVENTORY_KINDS) {
                newInventory = newInventory.sort((a, b) => a.addedAt - b.addedAt).slice(-MAX_INVENTORY_KINDS);
              }
            }
            return {
              crucible: [],
              unlockedRecipes: newUnlocked,
              discoveredMaterials: newDiscovered,
              newlyUnlockedMaterial: newlyUnlocked,
              inventory: newInventory,
              lastCraftResult: 'success',
              toastMessage: `合成成功：${recipe.name}！`,
            };
          });
          return 'success';
        } else {
          set({ crucible: [], lastCraftResult: 'failure', toastMessage: '合成失败，材料化为烟雾...' });
          return 'failure';
        }
      }
    }

    set({ crucible: [], lastCraftResult: 'failure', toastMessage: '未找到匹配的配方...' });
    return 'no_recipe';
  },

  showToast: (message: string) => set({ toastMessage: message }),
  hideToast: () => set({ toastMessage: null }),

  toggleHintPanel: () => set((s) => ({ showHintPanel: !s.showHintPanel, showSettingsMenu: false })),
  toggleSettingsMenu: () => set((s) => ({ showSettingsMenu: !s.showSettingsMenu, showHintPanel: false })),
  closeSettingsMenu: () => set({ showSettingsMenu: false }),
  showResetDialog: () => set({ showResetConfirm: true, showSettingsMenu: false }),
  hideResetDialog: () => set({ showResetConfirm: false }),

  resetGame: () => {
    set({
      inventory: getInitialInventory(),
      crucible: [],
      unlockedRecipes: new Set<string>(),
      discoveredMaterials: new Set<string>(['water', 'earth', 'fire_ash', 'herb_leaf', 'seed']),
      toastMessage: '游戏已重置',
      showHintPanel: false,
      showSettingsMenu: false,
      showResetConfirm: false,
      crucibleShaking: false,
      lastCraftResult: null,
      newlyUnlockedMaterial: null,
    });
  },

  setCrucibleShaking: (shaking: boolean) => set({ crucibleShaking: shaking }),
  clearLastCraftResult: () => set({ lastCraftResult: null }),
  clearNewlyUnlocked: () => set({ newlyUnlockedMaterial: null }),
}));
