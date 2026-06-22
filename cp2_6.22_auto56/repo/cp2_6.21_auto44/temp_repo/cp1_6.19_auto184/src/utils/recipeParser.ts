import { v4 as uuidv4 } from 'uuid';
import type { Recipe, GroceryItem, CategoryGroup, IngredientCategory } from '@/types';

const CATEGORY_NAMES: Record<IngredientCategory, string> = {
  vegetables: '蔬菜类',
  meat: '肉类',
  seasoning: '调味品',
  drygoods: '干货类',
  other: '其他',
};

const CATEGORY_ORDER: IngredientCategory[] = ['vegetables', 'meat', 'seasoning', 'drygoods', 'other'];

const VEGETABLES_KEYWORDS = [
  '菜', '瓜', '茄', '椒', '葱', '姜', '蒜', '萝卜', '白菜', '菠菜', '芹菜',
  '韭菜', '生菜', '西红柿', '番茄', '土豆', '马铃薯', '红薯', '山药', '芋',
  '菇', '菌', '木耳', '银耳', '海带', '紫菜', '笋', '藕', '豆芽', '豌豆',
  '玉米', '胡萝卜', '黄瓜', '南瓜', '冬瓜', '苦瓜', '丝瓜', '茄子', '辣椒',
];

const MEAT_KEYWORDS = [
  '肉', '猪', '牛', '羊', '鸡', '鸭', '鹅', '鱼', '虾', '蟹', '贝', '蛋',
  '火腿', '培根', '香肠', '肉丸', '排骨', '里脊', '五花', '牛腩', '鸡胸',
  '鸡腿', '鸡翅', '鸡爪', '猪肝', '牛肉', '猪肉', '羊肉', '鱼肉', '虾仁',
];

const SEASONING_KEYWORDS = [
  '盐', '糖', '酱油', '醋', '油', '酱', '料酒', '花椒', '八角', '桂皮',
  '香叶', '辣椒', '胡椒', '芥末', '咖喱', '淀粉', '面粉', '米粉', '味精',
  '鸡精', '蚝油', '生抽', '老抽', '陈醋', '香醋', '香油', '麻油', '豆瓣酱',
  '甜面酱', '番茄酱', '沙拉酱', '蜂蜜', '红糖', '白糖', '冰糖',
];

const DRYGOODS_KEYWORDS = [
  '米', '面', '粉', '豆', '花生', '芝麻', '核桃', '杏仁', '腰果', '松子',
  '红枣', '枸杞', '桂圆', '莲子', '百合', '银耳', '木耳', '香菇', '金针菇',
  '挂面', '面条', '饺子皮', '馄饨皮', '面包', '饼干', '蛋糕',
];

function detectCategory(ingredientName: string): IngredientCategory {
  const name = ingredientName.toLowerCase();
  
  for (const keyword of VEGETABLES_KEYWORDS) {
    if (name.includes(keyword)) return 'vegetables';
  }
  for (const keyword of MEAT_KEYWORDS) {
    if (name.includes(keyword)) return 'meat';
  }
  for (const keyword of SEASONING_KEYWORDS) {
    if (name.includes(keyword)) return 'seasoning';
  }
  for (const keyword of DRYGOODS_KEYWORDS) {
    if (name.includes(keyword)) return 'drygoods';
  }
  
  return 'other';
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, '');
}

function normalizeUnit(unit: string): string {
  const trimmed = unit.trim().toLowerCase();
  const unitMap: Record<string, string> = {
    '克': 'g',
    'g': 'g',
    '千克': 'kg',
    'kg': 'kg',
    '毫升': 'ml',
    'ml': 'ml',
    '升': 'l',
    'l': 'l',
    '个': '个',
    '只': '只',
    '颗': '颗',
    '片': '片',
    '勺': '勺',
    '汤匙': '勺',
    '茶匙': '茶匙',
    '把': '把',
    '根': '根',
    '斤': '斤',
    '公斤': 'kg',
  };
  return unitMap[trimmed] || trimmed || '适量';
}

export function parseRecipesToGroceryList(recipes: Recipe[]): GroceryItem[] {
  const ingredientMap = new Map<string, GroceryItem>();
  
  for (const recipe of recipes) {
    for (const ingredient of recipe.ingredients) {
      const normalizedName = normalizeName(ingredient.name);
      const normalizedUnit = normalizeUnit(ingredient.unit);
      const key = `${normalizedName}-${normalizedUnit}`;
      
      const existing = ingredientMap.get(key);
      
      if (existing) {
        existing.quantity += ingredient.quantity;
        if (!existing.sourceRecipes.includes(recipe.name)) {
          existing.sourceRecipes.push(recipe.name);
        }
      } else {
        const category = detectCategory(ingredient.name);
        ingredientMap.set(key, {
          id: uuidv4(),
          name: ingredient.name,
          quantity: ingredient.quantity,
          unit: normalizedUnit,
          category,
          checked: false,
          sourceRecipes: [recipe.name],
        });
      }
    }
  }
  
  return Array.from(ingredientMap.values());
}

export function groupByCategory(items: GroceryItem[]): CategoryGroup[] {
  const groups = new Map<IngredientCategory, GroceryItem[]>();
  
  for (const item of items) {
    if (!groups.has(item.category)) {
      groups.set(item.category, []);
    }
    groups.get(item.category)!.push(item);
  }
  
  return CATEGORY_ORDER
    .filter(cat => groups.has(cat))
    .map(cat => ({
      category: cat,
      categoryName: CATEGORY_NAMES[cat],
      items: groups.get(cat)!,
    }));
}

export function getCategoryName(category: IngredientCategory): string {
  return CATEGORY_NAMES[category];
}
