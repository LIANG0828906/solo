// ============================================================
// 类型定义文件
// 定义所有数据模型接口，被 craftingApi.ts、store、组件共同引用
// 数据流向: API返回 -> Zustand Store -> 组件Props
// ============================================================

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export type AttributeKey = 'attack' | 'defense' | 'magic' | 'durability';

export interface MaterialAttributes {
  attack?: number;
  defense?: number;
  magic?: number;
  durability?: number;
}

// 材料接口 - 用于MaterialCard展示和CraftingSlot槽位
export interface Material {
  id: string;
  name: string;
  rarity: Rarity;
  attributes: MaterialAttributes;
  color: string;      // 稀有度颜色: 白/绿/蓝/紫/金
  icon: string;       // emoji图标
  description: string;
}

// 基础装备接口
export interface Equipment {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'accessory';
  baseAttributes: Record<AttributeKey, number>;
  modelType: 'sword' | 'shield' | 'staff';
}

// 合成请求接口 - 由CraftingPanel提交给API
export interface CraftingRequest {
  equipmentId: string;
  materialIds: string[];
}

// 合成预计算结果 - 用于实时预览成功率和属性差值
export interface CraftingPreview {
  successRate: number;                        // 0-100 百分比
  estimatedAttributes: Record<AttributeKey, number>;
  attributeDiff: Record<AttributeKey, number>; // 正数增益, 负数减益
}

// 合成执行结果 - 由API返回后存入历史记录
export interface CraftingResult {
  success: boolean;
  successRate: number;
  originalAttributes: Record<AttributeKey, number>;
  newAttributes: Record<AttributeKey, number>;
  attributeDiff: Record<AttributeKey, number>;
  message: string;
  materialColors: string[];                    // 用于3D粒子特效颜色
  timestamp: string;
}

// 历史记录项 - 存储最近10次合成供CraftingHistory组件展示
export interface CraftingHistoryItem {
  id: string;
  materials: Material[];
  result: CraftingResult;
  equipmentId: string;
  timestamp: string;
}

// 拖拽项类型定义 - 用于react-dnd识别
export const DnDTypes = {
  MATERIAL_CARD: 'material_card',    // 从材料列表拖入槽位
  CRAFTING_SLOT: 'crafting_slot',    // 槽位间互换顺序
} as const;

export interface DragItem {
  type: typeof DnDTypes[keyof typeof DnDTypes];
  material?: Material;
  slotIndex?: number;
}

// 稀有度配置映射
export const RARITY_CONFIG: Record<Rarity, { color: string; label: string; multiplier: number; bonus: number }> = {
  common:    { color: '#ffffff', label: '普通',   multiplier: 1.0, bonus: 0 },
  uncommon:  { color: '#22c55e', label: '优秀',   multiplier: 1.2, bonus: 3 },
  rare:      { color: '#3b82f6', label: '精良',   multiplier: 1.5, bonus: 6 },
  epic:      { color: '#a855f7', label: '史诗',   multiplier: 2.0, bonus: 10 },
  legendary: { color: '#f59e0b', label: '传说',   multiplier: 3.0, bonus: 15 },
};
