// ============================================================
// API调用模块 - craftingApi.ts
// 职责: 定义与后端FastAPI交互的所有HTTP请求函数
// 被调用方: hooks/useCrafting.ts -> Zustand Store -> 组件层
// 数据流向: axios请求 -> FastAPI (/api/*) -> 返回Promise<Type>
// ============================================================

import axios from 'axios';
import type {
  Material,
  Equipment,
  CraftingRequest,
  CraftingPreview,
  CraftingResult,
} from '../types';

// API基础配置 - 后端FastAPI默认端口8000
const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================================
// 获取所有材料列表
// 调用方: CraftingPanel初始化时 -> MaterialCard渲染
// 返回: Material[] - 供材料选择列表展示
// ============================================================
export async function fetchMaterials(): Promise<Material[]> {
  try {
    const response = await api.get<Material[]>('/materials');
    return response.data;
  } catch (error) {
    console.error('获取材料列表失败:', error);
    return getMockMaterials();
  }
}

// ============================================================
// 获取基础装备列表
// 调用方: App初始化时 -> 选择装备下拉框
// ============================================================
export async function fetchEquipmentList(): Promise<Equipment[]> {
  try {
    const response = await api.get<Equipment[]>('/equipment');
    return response.data;
  } catch (error) {
    console.error('获取装备列表失败:', error);
    return getMockEquipment();
  }
}

// ============================================================
// 获取指定装备详情
// 参数: id - 装备唯一标识
// 调用方: useCrafting钩子初始化装备基础属性
// ============================================================
export async function getEquipmentDetails(id: string): Promise<Equipment> {
  try {
    const response = await api.get<Equipment>(`/equipment/${id}`);
    return response.data;
  } catch (error) {
    console.error(`获取装备${id}详情失败:`, error);
    const all = getMockEquipment();
    return all.find(e => e.id === id) ?? all[0];
  }
}

// ============================================================
// 预计算合成结果 - 实时预览用
// 当用户添加/移除/拖拽材料时自动调用
// 调用方: useCrafting.previewCrafting -> Zustand更新preview
// 返回: successRate + 属性差值 供SuccessRateCircle和AttributeDiff展示
// ============================================================
export async function calculateCraftingPreview(request: CraftingRequest): Promise<CraftingPreview> {
  try {
    const response = await api.post<CraftingPreview>('/crafting/calculate', request);
    return response.data;
  } catch (error) {
    console.error('预计算合成失败:', error);
    return calculateMockPreview(request);
  }
}

// ============================================================
// 执行合成操作 - 用户点击合成按钮时调用
// 调用方: useCrafting.executeCrafting -> 历史记录添加
// 数据流: 返回CraftingResult -> 存入CraftingHistoryItem -> EquipmentViewer特效
// ============================================================
export async function submitCrafting(request: CraftingRequest): Promise<CraftingResult> {
  try {
    const response = await api.post<CraftingResult>('/crafting/execute', request);
    return response.data;
  } catch (error) {
    console.error('执行合成失败:', error);
    return executeMockCrafting(request);
  }
}

// ============== 以下为Mock数据 - 后端不可用时兜底 ==============

function getMockMaterials(): Material[] {
  return [
    { id: 'm1', name: '铁锭', rarity: 'common', attributes: { attack: 5, durability: 10 }, color: '#ffffff', icon: '🔩', description: '基础锻造材料，增加少量攻击力和耐久度。' },
    { id: 'm2', name: '皮革', rarity: 'common', attributes: { defense: 4, durability: 8 }, color: '#ffffff', icon: '🧵', description: '柔韧的兽皮，适合制作轻甲部件。' },
    { id: 'm3', name: '翡翠', rarity: 'uncommon', attributes: { magic: 8, defense: 2 }, color: '#22c55e', icon: '💚', description: '蕴含自然魔力的宝石，提升魔法属性。' },
    { id: 'm4', name: '银矿', rarity: 'uncommon', attributes: { attack: 8, magic: 3 }, color: '#22c55e', icon: '💎', description: '纯净的银质矿石，对黑暗生物有额外效果。' },
    { id: 'm5', name: '秘银', rarity: 'rare', attributes: { attack: 12, defense: 8, durability: 15 }, color: '#3b82f6', icon: '🔷', description: '轻盈而坚韧的奇幻金属，综合属性提升。' },
    { id: 'm6', name: '魔晶核', rarity: 'rare', attributes: { magic: 18, attack: 5 }, color: '#3b82f6', icon: '🔮', description: '从高阶魔兽体内提取的能量结晶。' },
    { id: 'm7', name: '陨铁', rarity: 'epic', attributes: { attack: 25, durability: 30, defense: 10 }, color: '#a855f7', icon: '☄️', description: '来自天外的神秘金属，蕴含星辰之力。' },
    { id: 'm8', name: '龙魂石', rarity: 'epic', attributes: { magic: 30, attack: 15, defense: 5 }, color: '#a855f7', icon: '🐉', description: '远古巨龙遗骨中凝结的精华宝石。' },
    { id: 'm9', name: '混沌源质', rarity: 'legendary', attributes: { attack: 40, defense: 30, magic: 35, durability: 50 }, color: '#f59e0b', icon: '🌟', description: '传说中开天辟地时遗留的原初物质。' },
    { id: 'm10', name: '时之沙', rarity: 'legendary', attributes: { durability: 80, magic: 20 }, color: '#f59e0b', icon: '⏳', description: '流淌于时间长河中的沙粒，可使装备不朽。' },
  ];
}

function getMockEquipment(): Equipment[] {
  return [
    {
      id: 'sword-basic',
      name: '新手铁剑',
      type: 'weapon',
      baseAttributes: { attack: 20, defense: 0, magic: 0, durability: 50 },
      modelType: 'sword',
    },
    {
      id: 'shield-basic',
      name: '木盾',
      type: 'armor',
      baseAttributes: { attack: 0, defense: 25, magic: 0, durability: 60 },
      modelType: 'shield',
    },
    {
      id: 'staff-basic',
      name: '学徒法杖',
      type: 'weapon',
      baseAttributes: { attack: 5, defense: 0, magic: 25, durability: 40 },
      modelType: 'staff',
    },
  ];
}

// Mock预计算算法 - 与backend/crafting_engine.py保持一致
function calculateMockPreview(request: CraftingRequest): CraftingPreview {
  const materials = getMockMaterials();
  const equipment = getMockEquipment().find(e => e.id === request.equipmentId) ?? getMockEquipment()[0];
  const selected = request.materialIds.map(id => materials.find(m => m.id === id)!).filter(Boolean);

  let successRate = 70;
  const totalBonus = selected.reduce((s, m) => {
    const rarityMap: Record<string, number> = { common: 0, uncommon: 3, rare: 6, epic: 10, legendary: 15 };
    return s + (rarityMap[m.rarity] ?? 0);
  }, 0);
  successRate += selected.length > 0 ? totalBonus / selected.length : 0;
  if (selected.length === 3) successRate += 5;
  successRate = Math.max(10, Math.min(95, successRate));

  const multiplierMap: Record<string, number> = { common: 1.0, uncommon: 1.2, rare: 1.5, epic: 2.0, legendary: 3.0 };
  const riskFactor = 1 - (successRate / 200);

  const estimated: Record<string, number> = { ...equipment.baseAttributes };
  const diff: Record<string, number> = { attack: 0, defense: 0, magic: 0, durability: 0 };

  selected.forEach(mat => {
    const mult = multiplierMap[mat.rarity] ?? 1;
    Object.entries(mat.attributes).forEach(([key, val]) => {
      const gain = Math.round((val ?? 0) * mult * riskFactor);
      estimated[key] += gain;
      diff[key as keyof typeof diff] += gain;
    });
  });

  return {
    successRate: Math.round(successRate),
    estimatedAttributes: estimated as CraftingPreview['estimatedAttributes'],
    attributeDiff: diff as CraftingPreview['attributeDiff'],
  };
}

// Mock执行合成 - 按successRate概率决定成功/失败
function executeMockCrafting(request: CraftingRequest): CraftingResult {
  const preview = calculateMockPreview(request);
  const materials = getMockMaterials();
  const equipment = getMockEquipment().find(e => e.id === request.equipmentId) ?? getMockEquipment()[0];
  const selected = request.materialIds.map(id => materials.find(m => m.id === id)!).filter(Boolean);
  const roll = Math.random() * 100;
  const success = roll <= preview.successRate;

  return {
    success,
    successRate: preview.successRate,
    originalAttributes: { ...equipment.baseAttributes },
    newAttributes: success ? preview.estimatedAttributes : { ...equipment.baseAttributes },
    attributeDiff: success ? preview.attributeDiff : { attack: 0, defense: 0, magic: 0, durability: 0 },
    message: success ? '合成成功！装备获得了新的力量。' : '合成失败，材料消散于虚空...',
    materialColors: selected.map(m => m.color),
    timestamp: new Date().toISOString(),
  };
}
