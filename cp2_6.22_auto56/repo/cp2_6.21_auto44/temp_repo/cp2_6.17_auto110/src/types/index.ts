/**
 * 材料稀有度枚举
 * - COMMON: 普通 (60%概率)
 * - RARE: 稀有 (25%概率)
 * - EPIC: 史诗 (12%概率)
 * - LEGENDARY: 传说 (3%概率)
 */
export enum Rarity {
  COMMON = 'common',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary'
}

/**
 * 炼金学派枚举
 * - BASIC_ELEMENT: 基础元素学派
 * - LIFE_MATTER: 生命物质学派
 * - MAGIC_ENERGY: 魔法能量学派
 * - MECHANICAL_CONSTRUCT: 机械构造学派
 * - SHADOW_MATTER: 暗影物质学派
 * - HOLY_ESSENCE: 圣光精华学派
 */
export enum AlchemySchool {
  BASIC_ELEMENT = 'basic_element',
  LIFE_MATTER = 'life_matter',
  MAGIC_ENERGY = 'magic_energy',
  MECHANICAL_CONSTRUCT = 'mechanical_construct',
  SHADOW_MATTER = 'shadow_matter',
  HOLY_ESSENCE = 'holy_essence'
}

/**
 * 材料类型分类
 */
export type MaterialType = 
  | 'element'      // 元素类
  | 'biological'   // 生物类
  | 'mineral'      // 矿物类
  | 'energy'       // 能量类
  | 'mechanical'   // 机械类
  | 'mystical';    // 神秘类

/**
 * 材料接口定义
 * @property id - 材料唯一标识
 * @property name - 材料名称
 * @property rarity - 材料稀有度
 * @property type - 材料类型
 * @property color - 材料颜色（用于UI显示）
 * @property description - 材料描述
 */
export interface Material {
  readonly id: string;
  readonly name: string;
  readonly rarity: Rarity;
  readonly type: MaterialType;
  readonly color: string;
  readonly description: string;
}

/**
 * 配方接口定义
 * @property id - 配方唯一标识
 * @property name - 配方名称
 * @property materials - 所需材料ID数组（2-4个，可重复）
 * @property output - 合成产出材料ID
 * @property school - 所属炼金学派
 * @property hint - 谜语提示
 * @property probability - 合成成功概率（0-1之间）
 */
export interface Recipe {
  readonly id: string;
  readonly name: string;
  readonly materials: readonly string[];
  readonly output: string;
  readonly school: AlchemySchool;
  readonly hint: string;
  readonly probability: number;
}

/**
 * 库存项接口
 * @property materialId - 材料ID
 * @property count - 数量
 */
export interface InventoryItem {
  readonly materialId: string;
  readonly count: number;
}

/**
 * 游戏状态接口
 * @property inventory - 材料库存
 * @property crucible - 坩埚中放置的材料ID数组
 * @property unlockedRecipes - 已解锁的配方ID集合
 * @property discoveredMaterials - 已发现的材料ID集合
 * @property currentProduct - 当前合成产物材料ID
 * @property toastMessage - 提示消息
 */
export interface GameState {
  readonly inventory: ReadonlyMap<string, number>;
  readonly crucible: readonly string[];
  readonly unlockedRecipes: ReadonlySet<string>;
  readonly discoveredMaterials: ReadonlySet<string>;
  readonly currentProduct: string | null;
  readonly toastMessage: string | null;
}

/**
 * 合成结果类型
 * - SUCCESS: 合成成功
 * - FAILURE: 合成失败
 * - NO_RECIPE: 未找到匹配配方
 * - MISSING_MATERIALS: 材料不足
 */
export type CraftResultType = 'success' | 'failure' | 'no_recipe' | 'missing_materials';

/**
 * 合成结果接口
 * @property type - 结果类型
 * @property recipe - 匹配到的配方（如果有）
 * @property output - 产出材料（如果成功）
 * @property message - 结果消息
 */
export interface CraftResult {
  readonly type: CraftResultType;
  readonly recipe: Recipe | null;
  readonly output: Material | null;
  readonly message: string;
}
