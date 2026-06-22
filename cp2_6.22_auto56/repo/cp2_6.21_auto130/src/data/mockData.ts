import type { User, Recipe, MealPlanEntry, ShoppingItem, SupermarketZone } from '@/types';

export const mockUsers: User[] = [
  { id: 'u1', nickname: '妈妈', avatarUrl: '' },
  { id: 'u2', nickname: '爸爸', avatarUrl: '' },
  { id: 'u3', nickname: '小明', avatarUrl: '' },
];

export const mockRecipes: Recipe[] = [
  {
    id: 'r1',
    name: '西红柿炒鸡蛋',
    authorId: 'u1',
    author: mockUsers[0],
    cookTimeMinutes: 15,
    difficulty: 1,
    mainIngredients: ['西红柿', '鸡蛋'],
    ingredients: [
      { id: 'i1', name: '西红柿', quantity: 300, unit: 'g', category: 'vegetable', estimatedPrice: 4.5 },
      { id: 'i2', name: '鸡蛋', quantity: 3, unit: '个', category: 'dairy', estimatedPrice: 3 },
      { id: 'i3', name: '食用油', quantity: 15, unit: 'ml', category: 'grain', estimatedPrice: 0.8 },
      { id: 'i4', name: '盐', quantity: 3, unit: 'g', category: 'spice', estimatedPrice: 0.2 },
      { id: 'i5', name: '白糖', quantity: 5, unit: 'g', category: 'spice', estimatedPrice: 0.3 },
    ],
    steps: ['西红柿切块', '鸡蛋打散', '炒鸡蛋盛出', '炒西红柿', '混合翻炒调味'],
    avgRating: 4.8,
    reviewCount: 56,
    createdAt: '2024-01-01',
  },
  {
    id: 'r2',
    name: '红烧排骨',
    authorId: 'u1',
    author: mockUsers[0],
    cookTimeMinutes: 60,
    difficulty: 2,
    mainIngredients: ['猪排骨'],
    ingredients: [
      { id: 'i6', name: '猪排骨', quantity: 500, unit: 'g', category: 'meat', estimatedPrice: 35 },
      { id: 'i7', name: '生姜', quantity: 20, unit: 'g', category: 'vegetable', estimatedPrice: 0.5 },
      { id: 'i8', name: '大葱', quantity: 30, unit: 'g', category: 'vegetable', estimatedPrice: 0.6 },
      { id: 'i9', name: '八角', quantity: 2, unit: '个', category: 'spice', estimatedPrice: 0.5 },
      { id: 'i10', name: '生抽', quantity: 20, unit: 'ml', category: 'spice', estimatedPrice: 0.8 },
      { id: 'i11', name: '老抽', quantity: 10, unit: 'ml', category: 'spice', estimatedPrice: 0.4 },
      { id: 'i12', name: '冰糖', quantity: 15, unit: 'g', category: 'spice', estimatedPrice: 0.5 },
    ],
    steps: ['排骨焯水', '炒糖色', '爆香调料', '加入排骨', '加水炖煮', '收汁'],
    avgRating: 4.9,
    reviewCount: 128,
    createdAt: '2024-01-02',
  },
  {
    id: 'r3',
    name: '牛奶燕麦粥',
    authorId: 'u2',
    author: mockUsers[1],
    cookTimeMinutes: 10,
    difficulty: 1,
    mainIngredients: ['燕麦片', '牛奶'],
    ingredients: [
      { id: 'i13', name: '燕麦片', quantity: 60, unit: 'g', category: 'grain', estimatedPrice: 2 },
      { id: 'i14', name: '牛奶', quantity: 300, unit: 'ml', category: 'dairy', estimatedPrice: 4 },
      { id: 'i15', name: '蜂蜜', quantity: 10, unit: 'g', category: 'spice', estimatedPrice: 1.5 },
    ],
    steps: ['燕麦加少量水煮开', '加入牛奶搅拌', '出锅淋蜂蜜'],
    avgRating: 4.6,
    reviewCount: 32,
    createdAt: '2024-01-03',
  },
  {
    id: 'r4',
    name: '蒜蓉西兰花',
    authorId: 'u1',
    author: mockUsers[0],
    cookTimeMinutes: 12,
    difficulty: 1,
    mainIngredients: ['西兰花'],
    ingredients: [
      { id: 'i16', name: '西兰花', quantity: 400, unit: 'g', category: 'vegetable', estimatedPrice: 6 },
      { id: 'i17', name: '大蒜', quantity: 20, unit: 'g', category: 'vegetable', estimatedPrice: 0.5 },
      { id: 'i18', name: '食用油', quantity: 15, unit: 'ml', category: 'grain', estimatedPrice: 0.8 },
      { id: 'i19', name: '盐', quantity: 3, unit: 'g', category: 'spice', estimatedPrice: 0.2 },
    ],
    steps: ['西兰花焯水', '爆香蒜蓉', '下西兰花翻炒', '调味出锅'],
    avgRating: 4.7,
    reviewCount: 45,
    createdAt: '2024-01-04',
  },
  {
    id: 'r5',
    name: '清蒸鲈鱼',
    authorId: 'u2',
    author: mockUsers[1],
    cookTimeMinutes: 20,
    difficulty: 2,
    mainIngredients: ['鲈鱼'],
    ingredients: [
      { id: 'i20', name: '鲈鱼', quantity: 1, unit: '条', category: 'seafood', estimatedPrice: 38 },
      { id: 'i21', name: '生姜', quantity: 30, unit: 'g', category: 'vegetable', estimatedPrice: 0.8 },
      { id: 'i22', name: '大葱', quantity: 40, unit: 'g', category: 'vegetable', estimatedPrice: 0.8 },
      { id: 'i23', name: '蒸鱼豉油', quantity: 25, unit: 'ml', category: 'spice', estimatedPrice: 1 },
      { id: 'i24', name: '食用油', quantity: 20, unit: 'ml', category: 'grain', estimatedPrice: 1 },
    ],
    steps: ['鱼处理干净', '铺葱姜', '水开蒸8分钟', '淋豉油热油'],
    avgRating: 4.9,
    reviewCount: 89,
    createdAt: '2024-01-05',
  },
  {
    id: 'r6',
    name: '三明治',
    authorId: 'u3',
    author: mockUsers[2],
    cookTimeMinutes: 8,
    difficulty: 1,
    mainIngredients: ['面包片', '火腿'],
    ingredients: [
      { id: 'i25', name: '吐司面包', quantity: 4, unit: '片', category: 'grain', estimatedPrice: 4 },
      { id: 'i26', name: '火腿片', quantity: 4, unit: '片', category: 'meat', estimatedPrice: 5 },
      { id: 'i27', name: '生菜', quantity: 2, unit: '片', category: 'vegetable', estimatedPrice: 0.5 },
      { id: 'i28', name: '鸡蛋', quantity: 2, unit: '个', category: 'dairy', estimatedPrice: 2 },
      { id: 'i29', name: '沙拉酱', quantity: 15, unit: 'g', category: 'spice', estimatedPrice: 1 },
    ],
    steps: ['煎蛋', '烤面包', '依次叠放食材', '对角切开'],
    avgRating: 4.5,
    reviewCount: 28,
    createdAt: '2024-01-06',
  },
  {
    id: 'r7',
    name: '麻婆豆腐',
    authorId: 'u1',
    author: mockUsers[0],
    cookTimeMinutes: 25,
    difficulty: 2,
    mainIngredients: ['豆腐', '猪肉末'],
    ingredients: [
      { id: 'i30', name: '嫩豆腐', quantity: 400, unit: 'g', category: 'dairy', estimatedPrice: 3 },
      { id: 'i31', name: '猪肉末', quantity: 100, unit: 'g', category: 'meat', estimatedPrice: 8 },
      { id: 'i32', name: '豆瓣酱', quantity: 20, unit: 'g', category: 'spice', estimatedPrice: 0.8 },
      { id: 'i33', name: '花椒粉', quantity: 2, unit: 'g', category: 'spice', estimatedPrice: 0.3 },
      { id: 'i34', name: '大蒜', quantity: 15, unit: 'g', category: 'vegetable', estimatedPrice: 0.4 },
    ],
    steps: ['豆腐切块焯水', '炒肉末', '加豆瓣酱炒香', '下豆腐', '勾芡撒花椒'],
    avgRating: 4.8,
    reviewCount: 95,
    createdAt: '2024-01-07',
  },
  {
    id: 'r8',
    name: '白粥配咸菜',
    authorId: 'u2',
    author: mockUsers[1],
    cookTimeMinutes: 30,
    difficulty: 1,
    mainIngredients: ['大米'],
    ingredients: [
      { id: 'i35', name: '大米', quantity: 100, unit: 'g', category: 'grain', estimatedPrice: 0.8 },
      { id: 'i36', name: '榨菜', quantity: 50, unit: 'g', category: 'other', estimatedPrice: 1 },
    ],
    steps: ['米淘洗干净', '加水大火煮开', '转小火熬20分钟', '配榨菜食用'],
    avgRating: 4.3,
    reviewCount: 18,
    createdAt: '2024-01-08',
  },
];

const categoryToZone: Record<string, SupermarketZone> = {
  vegetable: 'produce',
  fruit: 'produce',
  meat: 'meat_seafood',
  seafood: 'meat_seafood',
  dairy: 'dairy_eggs',
  eggs: 'dairy_eggs',
  spice: 'seasoning',
  sauce: 'seasoning',
  grain: 'staples',
  oil: 'staples',
  other: 'other',
};

export function generateShoppingList(entries: MealPlanEntry[], recipes: Recipe[]): ShoppingItem[] {
  const ingredientMap = new Map<string, ShoppingItem>();

  entries.forEach((entry) => {
    const recipe = recipes.find((r) => r.id === entry.recipeId);
    if (!recipe) return;

    recipe.ingredients.forEach((ing) => {
      const existing = ingredientMap.get(ing.id);
      if (existing) {
        existing.totalQuantity += ing.quantity;
        if (ing.estimatedPrice && existing.estimatedPrice) {
          existing.estimatedPrice += ing.estimatedPrice;
        }
      } else {
        ingredientMap.set(ing.id, {
          ingredientId: ing.id,
          name: ing.name,
          totalQuantity: ing.quantity,
          unit: ing.unit,
          category: ing.category,
          supermarketZone: categoryToZone[ing.category] || 'other',
          estimatedPrice: ing.estimatedPrice,
          purchased: false,
        });
      }
    });
  });

  return Array.from(ingredientMap.values());
}

export function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function formatDateRange(weekStart: Date): string {
  const start = new Date(weekStart);
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  const fmt = (d: Date) => `${d.getMonth() + 1}月${d.getDate()}日`;
  return `${fmt(start)} - ${fmt(end)}`;
}

export const WEEKDAY_NAMES = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

export const SLOT_INFO: Record<string, { label: string; emoji: string }> = {
  breakfast: { label: '早餐', emoji: '🌅' },
  lunch: { label: '午餐', emoji: '☀️' },
  dinner: { label: '晚餐', emoji: '🌙' },
};

export const ZONE_INFO: Record<SupermarketZone, { label: string; emoji: string; color: string }> = {
  produce: { label: '蔬菜水果区', emoji: '🥬', color: 'bg-vegetable/20 text-vegetable border-vegetable/40' },
  meat_seafood: { label: '肉类海鲜区', emoji: '🥩', color: 'bg-meat/20 text-meat border-meat/40' },
  dairy_eggs: { label: '乳制品及蛋类', emoji: '🥚', color: 'bg-dairy/20 text-dairy border-dairy/40' },
  seasoning: { label: '调味品区', emoji: '🧂', color: 'bg-spice/20 text-spice border-spice/40' },
  staples: { label: '粮油干货区', emoji: '🌾', color: 'bg-grain/20 text-grain border-grain/40' },
  other: { label: '其他', emoji: '📦', color: 'bg-gray-100 text-gray-600 border-gray-300' },
};

export const ZONE_ORDER: SupermarketZone[] = ['produce', 'meat_seafood', 'dairy_eggs', 'seasoning', 'staples', 'other'];
