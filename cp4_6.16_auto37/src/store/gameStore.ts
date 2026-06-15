/**
 * ============================================================
 * Game Store - Zustand 状态管理
 * ============================================================
 * 
 * 状态架构：
 * ┌─────────────────────────────────────────────────────┐
 * │                   GameStore                          │
 * ├──────────────────┬──────────────────────────────────┤
 * │ 背包系统          │ inventory: InventorySlot[]       │
 * │                  │ inventorySize: number             │
 * │                  │ unlockedSlots: Set<number>        │
 * ├──────────────────┼──────────────────────────────────┤
 * │ 合成台系统        │ craftingGrid: CraftingCell[][]   │
 * │                  │ matchedRecipe: Recipe | null      │
 * │                  │ isCrafting: boolean               │
 * ├──────────────────┼──────────────────────────────────┤
 * │ 物品数据          │ items: Record<string, Item>      │
 * │                  │ recipes: Recipe[]                 │
 * │                  │ unlockedItems: Set<string>        │
 * ├──────────────────┼──────────────────────────────────┤
 * │ 采集系统          │ isCollecting: boolean            │
 * │                  │ collectProgress: number (0-100)   │
 * │                  │ cooldownRemaining: number (秒)    │
 * ├──────────────────┼──────────────────────────────────┤
 * │ 成就系统          │ achievements: Achievement[]      │
 * │                  │ currentAchievement: Achievement   │
 * └──────────────────┴──────────────────────────────────┘
 * 
 * 背包容量设计：
 * - 初始容量：48格（8列 × 6行），全部解锁可用
 * - 每格最大堆叠：99个（基础资源），工具/装备为1
 * - 扩展机制：预留 unlockedSlots，后续可通过合成/成就解锁新行
 * 
 * 数据持久化：
 * - 使用 IndexedDB (idb-keyval) 存储
 * - 持久化内容：背包、已解锁物品、成就列表
 * - 合成台状态不持久化，刷新后清空（物品自动退回背包）
 * 
 * ============================================================
 */

import { create } from 'zustand';
import { get as idbGet, set as idbSet } from 'idb-keyval';
import { v4 as uuidv4 } from 'uuid';
import { ALL_ITEMS, RECIPES, type Item, type Recipe } from '@/data/recipes';
import { findMatchingRecipe, type GridCell } from '@/utils/patternMatcher';

/**
 * 背包槽位
 * 
 * 设计说明：
 * - 使用扁平数组而非二维数组，便于排序、堆叠等操作
 * - 第 index 个格子对应二维位置：row = floor(index/8), col = index%8
 * - itemId 为 null 表示空格子
 * - count 为堆叠数量，工具/装备类物品恒为1
 */
export interface InventorySlot {
  itemId: string | null;
  count: number;
}

/**
 * 合成台单元格
 * 
 * 设计说明：
 * - 4x4 二维数组结构
 * - 每个格子有唯一id，用于React列表渲染优化
 * - 合成时消耗格子中的物品（每个格子1个物品）
 */
export interface CraftingCell {
  itemId: string | null;
  id: string;
}

/**
 * 成就记录
 */
export interface Achievement {
  id: string;
  itemId: string;
  timestamp: number;
}

/**
 * 飞行资源动画数据
 * 用于采集时资源飞入背包的动画效果
 */
export interface FlyingResource {
  id: string;
  itemId: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  count: number;
}

/**
 * 背包解锁进度
 * 记录玩家已解锁的背包行数
 * 初始：0-5行（共6行48格）全部解锁
 * 预留扩展：7-8行可通过游戏进度解锁
 */
export const INVENTORY_ROWS = 6;
export const INVENTORY_COLS = 8;
export const INVENTORY_SIZE = INVENTORY_ROWS * INVENTORY_COLS; // 48格
export const CRAFTING_SIZE = 4;
export const MAX_STACK_SIZE = 99;
export const COLLECT_DURATION_MS = 3000; // 采集耗时：3秒
export const COOLDOWN_DURATION_MS = 5000; // 冷却时长：5秒

/**
 * GameState 完整接口定义
 */
interface GameState {
  // ===== 背包系统 =====
  inventory: InventorySlot[];
  inventorySize: number;
  
  // ===== 合成台系统 =====
  craftingGrid: CraftingCell[][];
  matchedRecipe: Recipe | null;
  isCrafting: boolean;
  
  // ===== 物品数据 =====
  items: Record<string, Item>;
  recipes: Recipe[];
  unlockedItems: Set<string>;
  
  // ===== 采集系统 =====
  isCollecting: boolean;
  collectProgress: number;
  cooldownRemaining: number;
  
  // ===== 成就系统 =====
  achievements: Achievement[];
  currentAchievement: Achievement | null;
  
  // ===== 飞行资源动画 =====
  flyingResources: FlyingResource[];
  
  // ===== 生命周期 =====
  initGame: () => Promise<void>;
  saveGame: () => Promise<void>;
  
  // ===== 背包操作 =====
  addToInventory: (itemId: string, count: number) => boolean;
  removeFromInventory: (itemId: string, count: number) => boolean;
  canAddToInventory: (itemId: string, count: number) => boolean;
  isInventoryFull: () => boolean;
  getItemCount: (itemId: string) => number;
  
  // ===== 合成台操作 =====
  addToCraftingGrid: (row: number, col: number, itemId: string) => boolean;
  removeFromCraftingGrid: (row: number, col: number) => string | null;
  swapCraftingCells: (row1: number, col1: number, row2: number, col2: number) => void;
  checkRecipeMatch: () => void;
  performCraft: () => boolean;
  clearCraftingGrid: () => void;
  returnCraftingItems: () => void;
  
  // ===== 采集操作 =====
  startCollecting: () => void;
  updateCollectProgress: (progress: number) => void;
  finishCollecting: () => void;
  setCooldown: (seconds: number) => void;
  updateCooldown: (deltaSeconds: number) => void;
  
  // ===== 飞行资源动画 =====
  addFlyingResource: (resource: Omit<FlyingResource, 'id'>) => void;
  removeFlyingResource: (id: string) => void;
  
  // ===== 成就与解锁 =====
  showAchievement: (itemId: string) => void;
  clearCurrentAchievement: () => void;
  unlockItem: (itemId: string) => void;
}

/**
 * 创建空的合成台网格
 */
function createEmptyCraftingGrid(): CraftingCell[][] {
  const grid: CraftingCell[][] = [];
  for (let r = 0; r < CRAFTING_SIZE; r++) {
    const row: CraftingCell[] = [];
    for (let c = 0; c < CRAFTING_SIZE; c++) {
      row.push({ itemId: null, id: uuidv4() });
    }
    grid.push(row);
  }
  return grid;
}

/**
 * 创建空背包
 */
function createEmptyInventory(size: number): InventorySlot[] {
  return Array.from({ length: size }, () => ({ itemId: null, count: 0 }));
}

/**
 * 从 IndexedDB 加载游戏数据
 * 如果是新玩家，给予初始资源
 */
async function loadSavedGame(): Promise<{
  inventory: InventorySlot[];
  unlockedItems: Set<string>;
  achievements: Achievement[];
}> {
  try {
    const savedInventory = await idbGet<InventorySlot[]>('inventory');
    const savedUnlocked = await idbGet<string[]>('unlockedItems');
    const savedAchievements = await idbGet<Achievement[]>('achievements');
    
    const inventory = savedInventory && Array.isArray(savedInventory)
      ? savedInventory
      : null;
    
    const unlockedItems = savedUnlocked && Array.isArray(savedUnlocked)
      ? new Set([...savedUnlocked, 'stone', 'wood', 'iron_ore', 'crystal_shard'])
      : new Set(['stone', 'wood', 'iron_ore', 'crystal_shard']);
    
    const achievements = savedAchievements && Array.isArray(savedAchievements)
      ? savedAchievements
      : [];
    
    if (inventory) {
      return { inventory, unlockedItems, achievements };
    }
  } catch (e) {
    console.warn('加载存档失败，使用默认初始值:', e);
  }
  
  // 新玩家初始资源
  const newInventory = createEmptyInventory(INVENTORY_SIZE);
  newInventory[0] = { itemId: 'stone', count: 10 };
  newInventory[1] = { itemId: 'wood', count: 10 };
  newInventory[2] = { itemId: 'iron_ore', count: 5 };
  newInventory[3] = { itemId: 'crystal_shard', count: 3 };
  
  return {
    inventory: newInventory,
    unlockedItems: new Set(['stone', 'wood', 'iron_ore', 'crystal_shard']),
    achievements: [],
  };
}

/**
 * Zustand Store 主体
 */
export const useGameStore = create<GameState>((set, get) => ({
  // ===== 初始状态 =====
  inventory: createEmptyInventory(INVENTORY_SIZE),
  inventorySize: INVENTORY_SIZE,
  craftingGrid: createEmptyCraftingGrid(),
  recipes: [],
  items: {},
  unlockedItems: new Set(),
  isCollecting: false,
  collectProgress: 0,
  cooldownRemaining: 0,
  achievements: [],
  currentAchievement: null,
  matchedRecipe: null,
  isCrafting: false,
  flyingResources: [],

  // ============================================================
  // 生命周期
  // ============================================================
  
  /**
   * 初始化游戏
   * 1. 加载物品/配方数据到内存
   * 2. 从 IndexedDB 读取存档
   * 3. 初始化合成台匹配状态
   */
  initGame: async () => {
    set({ items: ALL_ITEMS, recipes: RECIPES });
    
    const saved = await loadSavedGame();
    set({
      inventory: saved.inventory,
      unlockedItems: saved.unlockedItems,
      achievements: saved.achievements,
    });
    
    get().checkRecipeMatch();
  },

  /**
   * 保存游戏到 IndexedDB
   * 保存内容：背包、已解锁物品、成就
   */
  saveGame: async () => {
    const { inventory, unlockedItems, achievements } = get();
    try {
      await idbSet('inventory', inventory);
      await idbSet('unlockedItems', Array.from(unlockedItems));
      await idbSet('achievements', achievements);
    } catch (e) {
      console.error('保存游戏失败:', e);
    }
  },

  // ============================================================
  // 背包操作
  // ============================================================
  
  /**
   * 添加物品到背包
   * 
   * 算法：
   * 1. 先尝试堆叠到已有同类物品的格子（优先填满）
   * 2. 再尝试放入空格子
   * 3. 放不下的部分丢弃，返回 false
   * 
   * @returns 是否全部成功放入
   */
  addToInventory: (itemId: string, count: number): boolean => {
    const state = get();
    const item = state.items[itemId];
    if (!item) return false;
    
    const newInventory = [...state.inventory];
    let remaining = count;
    const maxStack = item.maxStack || MAX_STACK_SIZE;
    
    // 第一步：堆叠到已有格子
    for (let i = 0; i < newInventory.length && remaining > 0; i++) {
      if (newInventory[i].itemId === itemId && newInventory[i].count < maxStack) {
        const canAdd = Math.min(remaining, maxStack - newInventory[i].count);
        newInventory[i] = { ...newInventory[i], count: newInventory[i].count + canAdd };
        remaining -= canAdd;
      }
    }
    
    // 第二步：放入空格子
    if (remaining > 0) {
      for (let i = 0; i < newInventory.length && remaining > 0; i++) {
        if (newInventory[i].itemId === null) {
          const canAdd = Math.min(remaining, maxStack);
          newInventory[i] = { itemId, count: canAdd };
          remaining -= canAdd;
        }
      }
    }
    
    if (remaining > 0) return false;
    
    set({ inventory: newInventory });
    state.saveGame();
    return true;
  },

  /**
   * 从背包移除物品
   * 
   * 算法：
   * 1. 遍历背包，找到同类物品
   * 2. 优先从数量少的格子移除（减少格子碎片）
   * 3. 不够则返回 false
   * 
   * @returns 是否成功移除全部数量
   */
  removeFromInventory: (itemId: string, count: number): boolean => {
    const state = get();
    const newInventory = [...state.inventory];
    
    let remaining = count;
    
    for (let i = 0; i < newInventory.length && remaining > 0; i++) {
      if (newInventory[i].itemId === itemId) {
        if (newInventory[i].count <= remaining) {
          remaining -= newInventory[i].count;
          newInventory[i] = { itemId: null, count: 0 };
        } else {
          newInventory[i] = { ...newInventory[i], count: newInventory[i].count - remaining };
          remaining = 0;
        }
      }
    }
    
    if (remaining > 0) return false;
    
    set({ inventory: newInventory });
    state.saveGame();
    return true;
  },

  /**
   * 检查能否放入指定数量的物品
   * （不实际修改状态，仅用于预判）
   */
  canAddToInventory: (itemId: string, count: number): boolean => {
    const state = get();
    const item = state.items[itemId];
    if (!item) return false;
    
    let remaining = count;
    const maxStack = item.maxStack || MAX_STACK_SIZE;
    
    for (const slot of state.inventory) {
      if (slot.itemId === itemId && slot.count < maxStack) {
        remaining -= Math.min(remaining, maxStack - slot.count);
        if (remaining <= 0) return true;
      }
    }
    
    if (remaining > 0) {
      for (const slot of state.inventory) {
        if (slot.itemId === null) {
          remaining -= Math.min(remaining, maxStack);
          if (remaining <= 0) return true;
        }
      }
    }
    
    return remaining <= 0;
  },

  /**
   * 检查背包是否已满（无任何空格）
   */
  isInventoryFull: (): boolean => {
    const state = get();
    for (const slot of state.inventory) {
      if (slot.itemId === null) return false;
    }
    return true;
  },

  /**
   * 获取某种物品的总数量
   */
  getItemCount: (itemId: string): number => {
    const state = get();
    let count = 0;
    for (const slot of state.inventory) {
      if (slot.itemId === itemId) {
        count += slot.count;
      }
    }
    return count;
  },

  // ============================================================
  // 合成台操作
  // ============================================================
  
  /**
   * 添加物品到合成台指定格子
   * @returns 是否成功（格子为空时才能放入）
   */
  addToCraftingGrid: (row: number, col: number, itemId: string): boolean => {
    const state = get();
    if (state.isCrafting) return false;
    if (state.craftingGrid[row][col].itemId !== null) return false;
    
    const newGrid = state.craftingGrid.map((r, ri) =>
      r.map((c, ci) => {
        if (ri === row && ci === col) {
          return { ...c, itemId };
        }
        return c;
      })
    );
    
    set({ craftingGrid: newGrid });
    state.checkRecipeMatch();
    return true;
  },

  /**
   * 从合成台移除物品
   * @returns 被移除的物品ID，格子为空则返回null
   */
  removeFromCraftingGrid: (row: number, col: number): string | null => {
    const state = get();
    if (state.isCrafting) return null;
    
    const cell = state.craftingGrid[row][col];
    if (!cell.itemId) return null;
    
    const newGrid = state.craftingGrid.map((r, ri) =>
      r.map((c, ci) => {
        if (ri === row && ci === col) {
          return { ...c, itemId: null };
        }
        return c;
      })
    );
    
    set({ craftingGrid: newGrid });
    state.checkRecipeMatch();
    return cell.itemId;
  },

  /**
   * 交换合成台上两个格子的物品
   * 用于拖拽时的位置调整
   */
  swapCraftingCells: (row1: number, col1: number, row2: number, col2: number) => {
    const state = get();
    if (state.isCrafting) return;
    
    const newGrid = state.craftingGrid.map((r, ri) =>
      r.map((c, ci) => ({ ...c }))
    );
    
    const temp = newGrid[row1][col1].itemId;
    newGrid[row1][col1].itemId = newGrid[row2][col2].itemId;
    newGrid[row2][col2].itemId = temp;
    
    set({ craftingGrid: newGrid });
    state.checkRecipeMatch();
  },

  /**
   * 检查合成台当前布局匹配哪个配方
   * 每次合成台变化后自动调用
   */
  checkRecipeMatch: () => {
    const { craftingGrid, recipes, isCrafting } = get();
    if (isCrafting) return;
    
    const grid: GridCell[][] = craftingGrid.map(row => row.map(cell => cell.itemId));
    const matched = findMatchingRecipe(grid, recipes);
    set({ matchedRecipe: matched });
  },

  /**
   * 执行合成
   * 
   * 时序：
   * 1. 检查是否有匹配的配方
   * 2. 检查背包是否有空间放产物
   * 3. 设置 isCrafting = true，播放动画
   * 4. 600ms 后：
   *    - 清空合成台
   *    - 产物放入背包
   *    - 新物品解锁 + 成就通知
   *    - 重置 isCrafting
   * 
   * @returns 是否成功开始合成
   */
  performCraft: (): boolean => {
    const state = get();
    const { matchedRecipe } = state;
    
    if (!matchedRecipe || state.isCrafting) return false;
    
    if (!state.canAddToInventory(matchedRecipe.resultItemId, matchedRecipe.resultCount)) {
      return false;
    }
    
    set({ isCrafting: true });
    
    setTimeout(() => {
      const currentState = get();
      const newGrid = currentState.craftingGrid.map(row => 
        row.map(cell => ({ ...cell, itemId: null }))
      );
      set({ craftingGrid: newGrid });
      
      currentState.addToInventory(matchedRecipe.resultItemId, matchedRecipe.resultCount);
      
      if (!currentState.unlockedItems.has(matchedRecipe.resultItemId)) {
        currentState.unlockItem(matchedRecipe.resultItemId);
        currentState.showAchievement(matchedRecipe.resultItemId);
      }
      
      set({ isCrafting: false, matchedRecipe: null });
      currentState.checkRecipeMatch();
    }, 600);
    
    return true;
  },

  /**
   * 清空合成台，物品退回背包
   */
  clearCraftingGrid: () => {
    const state = get();
    if (state.isCrafting) return;
    
    state.returnCraftingItems();
    
    const newGrid = state.craftingGrid.map(row => 
      row.map(cell => ({ ...cell, itemId: null }))
    );
    set({ craftingGrid: newGrid });
    state.checkRecipeMatch();
  },

  /**
   * 将合成台上的物品全部退回背包
   * （不修改合成台本身，仅把物品加回背包）
   */
  returnCraftingItems: () => {
    const state = get();
    for (const row of state.craftingGrid) {
      for (const cell of row) {
        if (cell.itemId) {
          state.addToInventory(cell.itemId, 1);
        }
      }
    }
  },

  // ============================================================
  // 采集系统
  // ============================================================
  // 
  // 采集与冷却时序图：
  // 
  //   采集阶段(3s)         冷却阶段(5s)
  // ┌───────────────┐   ┌───────────────────┐
  // │ 进度条 0→100% │   │ 按钮禁用 倒计时   │
  // └───────────────┘   └───────────────────┘
  //                      ↑
  //                 采集完成立即进入冷却
  // 
  // 总周期：8秒（3秒采集 + 5秒冷却）
  // 进度条在采集完成后立即重置为0
  // 冷却期间按钮显示倒计时，不可点击
  // 背包满时按钮红色闪烁，不可点击
  
  /**
   * 开始采集
   */
  startCollecting: () => {
    const state = get();
    if (state.isCollecting || state.cooldownRemaining > 0 || state.isInventoryFull()) return;
    
    set({ isCollecting: true, collectProgress: 0 });
  },

  /**
   * 更新采集进度
   * @param progress 0-100
   */
  updateCollectProgress: (progress: number) => {
    set({ collectProgress: Math.min(100, progress) });
  },

  /**
   * 采集完成
   * 
   * 逻辑：
   * 1. 根据概率随机选择资源类型
   *    - 石头：40%
   *    - 木头：30%
   *    - 铁矿石：20%
   *    - 水晶碎片：10%
   * 2. 随机数量 1-3 个
   * 3. 尝试放入背包（背包满则只放能放的部分）
   * 4. 进入5秒冷却
   */
  finishCollecting: () => {
    const state = get();
    
    const rand = Math.random() * 100;
    let itemId = 'stone';
    if (rand < 40) {
      itemId = 'stone';
    } else if (rand < 70) {
      itemId = 'wood';
    } else if (rand < 90) {
      itemId = 'iron_ore';
    } else {
      itemId = 'crystal_shard';
    }
    
    const count = Math.floor(Math.random() * 3) + 1;
    
    if (state.canAddToInventory(itemId, count)) {
      state.addToInventory(itemId, count);
    } else if (state.canAddToInventory(itemId, 1)) {
      state.addToInventory(itemId, 1);
    }
    
    console.log('[finishCollecting] 设置冷却为5秒');
    set({ 
      isCollecting: false, 
      collectProgress: 0,
      cooldownRemaining: 5,
    });
  },

  /**
   * 设置冷却时间（秒）
   */
  setCooldown: (seconds: number) => {
    set({ cooldownRemaining: seconds });
  },

  /**
   * 更新冷却时间
   * @param deltaSeconds 减少的秒数
   */
  updateCooldown: (deltaSeconds: number) => {
    const state = get();
    if (state.cooldownRemaining > 0) {
      const newCooldown = Math.max(0, state.cooldownRemaining - deltaSeconds);
      console.log('[updateCooldown]', state.cooldownRemaining, '-', deltaSeconds, '=', newCooldown);
      set({ cooldownRemaining: newCooldown });
    }
  },

  // ============================================================
  // 飞行资源动画
  // ============================================================
  
  addFlyingResource: (resource) => {
    const id = uuidv4();
    set(state => ({
      flyingResources: [...state.flyingResources, { ...resource, id }],
    }));
  },

  removeFlyingResource: (id) => {
    set(state => ({
      flyingResources: state.flyingResources.filter(r => r.id !== id),
    }));
  },

  // ============================================================
  // 成就与解锁
  // ============================================================
  
  /**
   * 显示成就通知
   * 3秒后自动消失
   */
  showAchievement: (itemId) => {
    const achievement: Achievement = {
      id: uuidv4(),
      itemId,
      timestamp: Date.now(),
    };
    
    set(state => ({
      currentAchievement: achievement,
      achievements: [...state.achievements, achievement],
    }));
    
    setTimeout(() => {
      set({ currentAchievement: null });
    }, 3000);
  },

  clearCurrentAchievement: () => {
    set({ currentAchievement: null });
  },

  /**
   * 解锁物品（加入图鉴）
   */
  unlockItem: (itemId) => {
    set(state => {
      const newUnlocked = new Set(state.unlockedItems);
      newUnlocked.add(itemId);
      return { unlockedItems: newUnlocked };
    });
    get().saveGame();
  },
}));

if (typeof window !== 'undefined') {
  (window as any).__gameStore = useGameStore;
}
