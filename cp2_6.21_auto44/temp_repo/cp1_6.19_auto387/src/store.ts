import { create } from 'zustand';
import type { TeaStore, Material, SelectedMaterial, Recommendation, TeaSubCategory } from './types';

const MATERIALS: Material[] = [
  { id: 'tea-green', name: '茉莉绿茶', category: 'tea', subCategory: 'original', color: '#A8D5BA', calories: 2, description: '清新茉莉花香，回甘悠长', icon: '🍵' },
  { id: 'tea-oolong', name: '炭焙乌龙', category: 'tea', subCategory: 'original', color: '#D4A574', calories: 3, description: '炭火烘焙，醇厚香浓', icon: '🍃' },
  { id: 'tea-black', name: '正山小种', category: 'tea', subCategory: 'original', color: '#8B4513', calories: 4, description: '经典红茶，浓郁醇厚', icon: '🫖' },
  { id: 'tea-puer', name: '云南普洱', category: 'tea', subCategory: 'original', color: '#6B4423', calories: 2, description: '陈香四溢，回甘持久', icon: '🌿' },

  { id: 'tea-rose', name: '玫瑰花茶', category: 'tea', subCategory: 'flower', color: '#F4C2C2', calories: 5, description: '浪漫玫瑰香气，养颜美容', icon: '🌹' },
  { id: 'tea-chrysanthemum', name: '桂花菊花茶', category: 'tea', subCategory: 'flower', color: '#FFF3B0', calories: 6, description: '清肝明目，清香怡人', icon: '🌼' },
  { id: 'tea-peach', name: '白桃乌龙', category: 'tea', subCategory: 'flower', color: '#FFDAB9', calories: 8, description: '白桃果香，乌龙回甘', icon: '🍑' },
  { id: 'tea-lychee', name: '荔枝红茶', category: 'tea', subCategory: 'flower', color: '#FFB6C1', calories: 7, description: '荔枝鲜甜，红茶浓郁', icon: '🧋' },

  { id: 'tea-milk-green', name: '奶绿', category: 'tea', subCategory: 'milk', color: '#C8E6C9', calories: 60, description: '绿茶与鲜奶的完美融合', icon: '🥛' },
  { id: 'tea-milk-red', name: '英式奶茶', category: 'tea', subCategory: 'milk', color: '#D2B48C', calories: 65, description: '经典红茶配香浓牛奶', icon: '🧋' },
  { id: 'tea-taro', name: '香芋奶茶', category: 'tea', subCategory: 'milk', color: '#C9A4DC', calories: 85, description: '绵密芋泥，奶香四溢', icon: '🍠' },
  { id: 'tea-matcha', name: '抹茶拿铁', category: 'tea', subCategory: 'milk', color: '#9DC183', calories: 75, description: '日式抹茶，醇厚奶香', icon: '🍵' },

  { id: 'top-pearl', name: '黑糖珍珠', category: 'topping', color: '#3E2723', calories: 95, description: 'Q弹软糯，黑糖焦香', icon: '⚫' },
  { id: 'top-coconut', name: '椰果', category: 'topping', color: '#FAFAFA', calories: 40, description: '脆爽清甜，椰香浓郁', icon: '🥥' },
  { id: 'top-agar', name: '寒天晶球', category: 'topping', color: '#E0F7FA', calories: 25, description: '晶莹剔透，口感Q弹', icon: '💎' },
  { id: 'top-pudding', name: '鸡蛋布丁', category: 'topping', color: '#FFE4B5', calories: 70, description: '嫩滑香甜，蛋香浓郁', icon: '🍮' },
  { id: 'top-redbean', name: '蜜红豆', category: 'topping', color: '#8B0000', calories: 80, description: '绵密香甜，粒粒分明', icon: '🫘' },
  { id: 'top-oat', name: '燕麦', category: 'topping', color: '#DEB887', calories: 55, description: '营养健康，嚼劲十足', icon: '🌾' },

  { id: 'syrup-honey', name: '蜂蜜糖浆', category: 'syrup', color: '#FFD700', calories: 60, description: '天然蜂蜜，温润清甜', icon: '🍯' },
  { id: 'syrup-brown', name: '黑糖糖浆', category: 'syrup', color: '#5D4037', calories: 80, description: '浓郁焦香，古法熬制', icon: '🟤' },
  { id: 'syrup-vanilla', name: '香草糖浆', category: 'syrup', color: '#FFF8DC', calories: 55, description: '香草芬芳，甜蜜丝滑', icon: '🌿' },
  { id: 'syrup-caramel', name: '焦糖糖浆', category: 'syrup', color: '#8B6914', calories: 75, description: '焦香浓郁，回味悠长', icon: '🍬' },
  { id: 'syrup-hazelnut', name: '榛果糖浆', category: 'syrup', color: '#A0522D', calories: 65, description: '坚果香气，醇厚绵长', icon: '🌰' },
];

const generateId = (): string => Math.random().toString(36).substring(2, 11);

const recommend = (selected: SelectedMaterial[]): Recommendation[] => {
  const recs: Recommendation[] = [];
  const hasTea = selected.some(m => m.category === 'tea');
  const hasTopping = selected.some(m => m.category === 'topping');
  const hasSyrup = selected.some(m => m.category === 'syrup');
  const selectedIds = new Set(selected.map(m => m.id));

  if (hasTea && !hasTopping) {
    if (!selectedIds.has('top-agar')) {
      recs.push({ id: generateId(), materialId: 'top-agar', reason: '加一份寒天晶球口感更Q弹', type: 'topping' });
    }
    if (!selectedIds.has('top-coconut')) {
      recs.push({ id: generateId(), materialId: 'top-coconut', reason: '椰果的脆爽口感与茶底很搭', type: 'topping' });
    }
  }

  if (hasTea && !hasSyrup) {
    if (!selectedIds.has('syrup-honey')) {
      recs.push({ id: generateId(), materialId: 'syrup-honey', reason: '蜂蜜的清甜能激发茶香', type: 'syrup' });
    }
  }

  const flowerTeas = selected.filter(m => m.subCategory === 'flower');
  if (flowerTeas.length > 0 && !selectedIds.has('top-agar')) {
    recs.push({ id: generateId(), materialId: 'top-agar', reason: '花果茶配寒天晶球口感更清爽', type: 'topping' });
  }

  const milkTeas = selected.filter(m => m.subCategory === 'milk');
  if (milkTeas.length > 0) {
    if (!selectedIds.has('top-pearl')) {
      recs.push({ id: generateId(), materialId: 'top-pearl', reason: '经典搭配黑糖珍珠绝配', type: 'topping' });
    }
    if (!selectedIds.has('top-pudding')) {
      recs.push({ id: generateId(), materialId: 'top-pudding', reason: '布丁的嫩滑让奶茶更有层次', type: 'topping' });
    }
  }

  if (selected.length >= 2 && !selectedIds.has('syrup-vanilla')) {
    recs.push({ id: generateId(), materialId: 'syrup-vanilla', reason: '香草风味提升整体香气', type: 'syrup' });
  }

  if (selected.length >= 3 && !selectedIds.has('top-oat')) {
    recs.push({ id: generateId(), materialId: 'top-oat', reason: '加入燕麦增加饱腹感更健康', type: 'topping' });
  }

  return recs.slice(0, 4);
};

const getTemperature = (materials: SelectedMaterial[]): string => {
  const hasMilk = materials.some(m => m.subCategory === 'milk');
  const hasFlower = materials.some(m => m.subCategory === 'flower');
  if (hasMilk) return '温热 55°C';
  if (hasFlower) return '冰饮 4°C';
  return '温热 60°C';
};

export const useTeaStore = create<TeaStore>((set, get) => ({
  materials: MATERIALS,
  selectedMaterials: [],
  recommendations: [],
  searchQuery: '',
  activeCategory: 'all',
  currentRecipe: null,
  isCardGenerating: false,
  showWorkbench: false,
  newlyAddedInstanceId: null,

  setSearchQuery: (query: string) => set({ searchQuery: query }),

  setActiveCategory: (category: TeaSubCategory | 'all') => set({ activeCategory: category }),

  addMaterial: (materialId: string) => {
    const { materials, selectedMaterials } = get();
    const material = materials.find(m => m.id === materialId);
    if (!material) return;
    const instanceId = generateId();
    const newSelected: SelectedMaterial = {
      ...material,
      instanceId,
      order: selectedMaterials.length,
    };
    const newList = [...selectedMaterials, newSelected];
    set({
      selectedMaterials: newList,
      recommendations: recommend(newList),
      showWorkbench: true,
      newlyAddedInstanceId: instanceId,
    });
  },

  removeMaterial: (instanceId: string) => {
    const { selectedMaterials } = get();
    const newList = selectedMaterials
      .filter(m => m.instanceId !== instanceId)
      .map((m, i) => ({ ...m, order: i }));
    set({
      selectedMaterials: newList,
      recommendations: recommend(newList),
    });
  },

  reorderMaterials: (fromIndex: number, toIndex: number) => {
    const { selectedMaterials } = get();
    const result = Array.from(selectedMaterials);
    const [removed] = result.splice(fromIndex, 1);
    result.splice(toIndex, 0, removed);
    const reordered = result.map((m, i) => ({ ...m, order: i }));
    set({
      selectedMaterials: reordered,
    });
  },

  generateRecommendations: () => {
    const { selectedMaterials } = get();
    set({ recommendations: recommend(selectedMaterials) });
  },

  generateRecipeCard: (name: string) => {
    const { selectedMaterials } = get();
    const totalCalories = selectedMaterials.reduce((sum, m) => sum + m.calories, 0);
    const card = {
      id: generateId(),
      name,
      materials: selectedMaterials,
      totalCalories,
      servingTemperature: getTemperature(selectedMaterials),
      createdAt: Date.now(),
    };
    set({ currentRecipe: card });
  },

  toggleWorkbench: () => set(state => ({ showWorkbench: !state.showWorkbench })),

  setCardGenerating: (status: boolean) => set({ isCardGenerating: status }),

  clearNewlyAdded: () => set({ newlyAddedInstanceId: null }),
}));
