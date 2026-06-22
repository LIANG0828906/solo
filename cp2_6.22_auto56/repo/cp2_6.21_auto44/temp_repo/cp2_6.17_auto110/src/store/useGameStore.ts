import { create } from 'zustand';
import { MaterialRegistry } from '../modules/engine/MaterialRegistry';
import { EngineController } from '../modules/engine/EngineController';
import { CraftResult } from '../types';

/**
 * 游戏状态管理接口
 */
interface GameStore {
  /** 材料库存: Map<材料ID, 数量> */
  readonly inventory: ReadonlyMap<string, number>;
  /** 坩埚中放置的材料ID数组 */
  readonly crucible: readonly string[];
  /** 已解锁的配方ID集合 */
  readonly unlockedRecipes: ReadonlySet<string>;
  /** 已发现的材料ID集合 */
  readonly discoveredMaterials: ReadonlySet<string>;
  /** 当前合成产物材料ID */
  readonly currentProduct: string | null;
  /** 提示消息 */
  readonly toastMessage: string | null;

  /**
   * 添加材料到库存
   * @param materialId - 材料ID
   * @param count - 添加数量，默认为1
   */
  addMaterial: (materialId: string, count?: number) => void;

  /**
   * 从库存移除材料
   * @param materialId - 材料ID
   * @param count - 移除数量，默认为1
   * @returns 是否成功移除
   */
  removeMaterial: (materialId: string, count?: number) => boolean;

  /**
   * 将材料放入坩埚
   * @param materialId - 材料ID
   * @returns 是否成功放入
   */
  addToCrucible: (materialId: string) => boolean;

  /**
   * 从坩埚移除一个材料
   * @param index - 坩埚中材料的索引
   * @returns 是否成功移除
   */
  removeFromCrucible: (index: number) => boolean;

  /**
   * 清空坩埚，将材料返还库存
   */
  clearCrucible: () => void;

  /**
   * 随机获取一个材料并加入库存
   * 用于探索/抽奖等功能
   * @returns 获取到的材料ID
   */
  drawRandomMaterial: () => string;

  /**
   * 执行合成操作
   * @returns 合成结果
   */
  performCraft: () => CraftResult;

  /**
   * 解锁指定配方
   * @param recipeId - 配方ID
   */
  unlockRecipe: (recipeId: string) => void;

  /**
   * 标记材料为已发现
   * @param materialId - 材料ID
   */
  discoverMaterial: (materialId: string) => void;

  /**
   * 设置提示消息
   * @param message - 消息内容
   * @param duration - 自动消失时间（毫秒），不传则不自动消失
   */
  showToast: (message: string, duration?: number) => void;

  /**
   * 清除提示消息
   */
  clearToast: () => void;

  /**
   * 设置当前产物
   * @param materialId - 产物材料ID，传null清除
   */
  setCurrentProduct: (materialId: string | null) => void;

  /**
   * 重置游戏状态
   */
  resetGame: () => void;

  /**
   * 自动解锁配方：检查所有配方，满足条件的自动解锁
   */
  autoUnlockRecipes: () => void;
}

/**
 * 坩埚最大容量
 */
const CRUCIBLE_MAX_SIZE = 4;

/**
 * 初始化库存：给玩家一些基础材料开始游戏
 */
const getInitialInventory = (): Map<string, number> => {
  const inventory = new Map<string, number>();
  const starterMaterials: readonly [string, number][] = [
    ['water', 10],
    ['fire_ash', 10],
    ['earth', 8],
    ['wind_dust', 5],
    ['herb_leaf', 8],
    ['seed', 5],
    ['stone', 6],
    ['sand', 5],
    ['wood', 5],
    ['charcoal', 5],
    ['iron_ore', 3],
    ['copper_ore', 3],
    ['salt', 4],
    ['bone_dust', 3],
    ['cloth', 3]
  ];
  for (const [id, count] of starterMaterials) {
    inventory.set(id, count);
  }
  return inventory;
};

/**
 * 初始已发现材料集合：包含所有初始库存材料
 */
const getInitialDiscoveredMaterials = (inventory: ReadonlyMap<string, number>): Set<string> => {
  const discovered = new Set<string>();
  for (const id of inventory.keys()) {
    discovered.add(id);
  }
  return discovered;
};

/**
 * 初始已解锁配方集合
 */
const getInitialUnlockedRecipes = (discovered: ReadonlySet<string>): Set<string> => {
  const unlocked = new Set<string>();
  for (const recipe of EngineController.getAllRecipes()) {
    if (EngineController.isRecipeUnlocked(recipe.id, discovered)) {
      unlocked.add(recipe.id);
    }
  }
  return unlocked;
};

export const useGameStore = create<GameStore>((set, get) => {
  const initialInventory = getInitialInventory();
  const initialDiscovered = getInitialDiscoveredMaterials(initialInventory);
  const initialUnlocked = getInitialUnlockedRecipes(initialDiscovered);

  return {
    inventory: initialInventory,
    crucible: [],
    unlockedRecipes: initialUnlocked,
    discoveredMaterials: initialDiscovered,
    currentProduct: null,
    toastMessage: null,

    addMaterial: (materialId: string, count: number = 1) => {
      if (count <= 0) return;
      const { inventory, discoverMaterial } = get();
      const newInventory = new Map(inventory);
      newInventory.set(materialId, (newInventory.get(materialId) ?? 0) + count);
      set({ inventory: newInventory });
      discoverMaterial(materialId);
    },

    removeMaterial: (materialId: string, count: number = 1): boolean => {
      if (count <= 0) return false;
      const { inventory } = get();
      const current = inventory.get(materialId) ?? 0;
      if (current < count) return false;

      const newInventory = new Map(inventory);
      const newCount = current - count;
      if (newCount <= 0) {
        newInventory.delete(materialId);
      } else {
        newInventory.set(materialId, newCount);
      }
      set({ inventory: newInventory });
      return true;
    },

    addToCrucible: (materialId: string): boolean => {
      const { crucible, inventory, removeMaterial } = get();
      if (crucible.length >= CRUCIBLE_MAX_SIZE) {
        get().showToast('坩埚已满，最多放入4种材料。');
        return false;
      }
      const stock = inventory.get(materialId) ?? 0;
      if (stock <= 0) {
        get().showToast('库存中没有这种材料。');
        return false;
      }
      if (removeMaterial(materialId, 1)) {
        set({ crucible: [...crucible, materialId] });
        return true;
      }
      return false;
    },

    removeFromCrucible: (index: number): boolean => {
      const { crucible, addMaterial } = get();
      if (index < 0 || index >= crucible.length) return false;
      const materialId = crucible[index];
      const newCrucible = [...crucible];
      newCrucible.splice(index, 1);
      set({ crucible: newCrucible });
      addMaterial(materialId, 1);
      return true;
    },

    clearCrucible: () => {
      const { crucible, addMaterial } = get();
      for (const matId of crucible) {
        addMaterial(matId, 1);
      }
      set({ crucible: [] });
    },

    drawRandomMaterial: (): string => {
      const material = MaterialRegistry.getRandomMaterial();
      const { addMaterial, showToast } = get();
      addMaterial(material.id, 1);
      const rarityName = MaterialRegistry.getRarityName(material.rarity);
      showToast(`获得了【${rarityName}】材料：${material.name}！`);
      return material.id;
    },

    performCraft: (): CraftResult => {
      const { crucible, inventory, addMaterial, unlockRecipe, setCurrentProduct, showToast, clearCrucible, autoUnlockRecipes } = get();

      if (crucible.length < 2) {
        const result: CraftResult = {
          type: 'no_recipe',
          recipe: null,
          output: null,
          message: '至少放入2种材料才能合成。'
        };
        showToast(result.message);
        return result;
      }

      const result = EngineController.performCraft(crucible, inventory);

      if (result.type === 'success' && result.output) {
        addMaterial(result.output.id, 1);
        setCurrentProduct(result.output.id);
        if (result.recipe) {
          unlockRecipe(result.recipe.id);
        }
        clearCrucible();
        autoUnlockRecipes();
        showToast(result.message);
      } else if (result.type === 'failure') {
        clearCrucible();
        setCurrentProduct(null);
        showToast(result.message);
      } else {
        showToast(result.message);
      }

      return result;
    },

    unlockRecipe: (recipeId: string) => {
      const { unlockedRecipes } = get();
      if (unlockedRecipes.has(recipeId)) return;
      const newUnlocked = new Set(unlockedRecipes);
      newUnlocked.add(recipeId);
      set({ unlockedRecipes: newUnlocked });
    },

    discoverMaterial: (materialId: string) => {
      const { discoveredMaterials, autoUnlockRecipes } = get();
      if (discoveredMaterials.has(materialId)) return;
      const newDiscovered = new Set(discoveredMaterials);
      newDiscovered.add(materialId);
      set({ discoveredMaterials: newDiscovered });
      autoUnlockRecipes();
    },

    showToast: (message: string, duration?: number) => {
      set({ toastMessage: message });
      if (duration !== undefined && duration > 0) {
        setTimeout(() => {
          const { toastMessage, clearToast } = get();
          if (toastMessage === message) {
            clearToast();
          }
        }, duration);
      }
    },

    clearToast: () => {
      set({ toastMessage: null });
    },

    setCurrentProduct: (materialId: string | null) => {
      set({ currentProduct: materialId });
    },

    resetGame: () => {
      const resetInventory = getInitialInventory();
      const resetDiscovered = getInitialDiscoveredMaterials(resetInventory);
      const resetUnlocked = getInitialUnlockedRecipes(resetDiscovered);
      set({
        inventory: resetInventory,
        crucible: [],
        unlockedRecipes: resetUnlocked,
        discoveredMaterials: resetDiscovered,
        currentProduct: null,
        toastMessage: null
      });
    },

    autoUnlockRecipes: () => {
      const { discoveredMaterials, unlockedRecipes } = get();
      const newUnlocked = new Set(unlockedRecipes);
      for (const recipe of EngineController.getAllRecipes()) {
        if (!newUnlocked.has(recipe.id) && EngineController.isRecipeUnlocked(recipe.id, discoveredMaterials)) {
          newUnlocked.add(recipe.id);
        }
      }
      if (newUnlocked.size !== unlockedRecipes.size) {
        set({ unlockedRecipes: newUnlocked });
      }
    }
  };
});
