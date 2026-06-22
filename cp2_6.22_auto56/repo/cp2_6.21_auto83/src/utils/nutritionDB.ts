export interface NutritionValue {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  sodium: number;
}

export interface NutritionDBEntry extends NutritionValue {
  name: string;
  aliases: string[];
  servingGrams: number;
}

export const DAILY_RECOMMENDED: NutritionValue = {
  calories: 2000,
  protein: 60,
  fat: 65,
  carbs: 300,
  fiber: 25,
  sodium: 2000,
};

export const NUTRITION_KEYS: (keyof NutritionValue)[] = [
  'calories', 'protein', 'fat', 'carbs', 'fiber', 'sodium'
];

export const NUTRITION_LABELS: Record<keyof NutritionValue, string> = {
  calories: '热量',
  protein: '蛋白质',
  fat: '脂肪',
  carbs: '碳水',
  fiber: '膳食纤维',
  sodium: '钠',
};

export const NUTRITION_UNITS: Record<keyof NutritionValue, string> = {
  calories: 'kcal',
  protein: 'g',
  fat: 'g',
  carbs: 'g',
  fiber: 'g',
  sodium: 'mg',
};

export const NUTRITION_COLORS: Record<keyof NutritionValue, string> = {
  calories: '#FF6B6B',
  protein: '#88B04B',
  fat: '#FFA07A',
  carbs: '#FFD93D',
  fiber: '#6BCB77',
  sodium: '#4D96FF',
};

const NUTRITION_DB: NutritionDBEntry[] = [
  { name: '鸡胸肉', aliases: ['鸡脯肉', '鸡大胸'], servingGrams: 100, calories: 165, protein: 31, fat: 3.6, carbs: 0, fiber: 0, sodium: 74 },
  { name: '西兰花', aliases: ['绿花菜', '椰菜花'], servingGrams: 100, calories: 34, protein: 2.8, fat: 0.4, carbs: 7, fiber: 2.6, sodium: 33 },
  { name: '糙米', aliases: ['玄米'], servingGrams: 100, calories: 111, protein: 2.6, fat: 0.9, carbs: 23, fiber: 1.8, sodium: 5 },
  { name: '三文鱼', aliases: ['鲑鱼'], servingGrams: 100, calories: 208, protein: 20, fat: 13, carbs: 0, fiber: 0, sodium: 59 },
  { name: '鸡蛋', aliases: ['鸡卵', '水煮蛋'], servingGrams: 100, calories: 155, protein: 13, fat: 11, carbs: 1.1, fiber: 0, sodium: 124 },
  { name: '番茄', aliases: ['西红柿', '洋柿子'], servingGrams: 100, calories: 18, protein: 0.9, fat: 0.2, carbs: 3.9, fiber: 1.2, sodium: 5 },
  { name: '土豆', aliases: ['马铃薯', '洋芋'], servingGrams: 100, calories: 77, protein: 2, fat: 0.1, carbs: 17, fiber: 2.2, sodium: 6 },
  { name: '胡萝卜', aliases: ['红萝卜', '甘荀'], servingGrams: 100, calories: 41, protein: 0.9, fat: 0.2, carbs: 9.6, fiber: 2.8, sodium: 69 },
  { name: '菠菜', aliases: ['赤根菜', '菠薐菜'], servingGrams: 100, calories: 23, protein: 2.9, fat: 0.4, carbs: 3.6, fiber: 2.2, sodium: 79 },
  { name: '牛肉', aliases: ['牛里脊', '牛肉片'], servingGrams: 100, calories: 250, protein: 26, fat: 15, carbs: 0, fiber: 0, sodium: 72 },
  { name: '豆腐', aliases: ['水豆腐', '嫩豆腐'], servingGrams: 100, calories: 76, protein: 8, fat: 4.8, carbs: 1.9, fiber: 0.3, sodium: 7 },
  { name: '蘑菇', aliases: ['双孢菇', '口蘑'], servingGrams: 100, calories: 22, protein: 3.1, fat: 0.3, carbs: 3.3, fiber: 1, sodium: 5 },
  { name: '青椒', aliases: ['菜椒', '甜椒'], servingGrams: 100, calories: 20, protein: 0.9, fat: 0.2, carbs: 4.6, fiber: 1.7, sodium: 3 },
  { name: '洋葱', aliases: ['葱头', '圆葱'], servingGrams: 100, calories: 40, protein: 1.1, fat: 0.1, carbs: 9.3, fiber: 1.7, sodium: 4 },
  { name: '大蒜', aliases: ['蒜头', '蒜瓣'], servingGrams: 100, calories: 149, protein: 6.4, fat: 0.5, carbs: 33, fiber: 2.1, sodium: 17 },
  { name: '虾', aliases: ['虾仁', '对虾'], servingGrams: 100, calories: 99, protein: 24, fat: 0.3, carbs: 0.2, fiber: 0, sodium: 148 },
  { name: '燕麦', aliases: ['燕麦片', '即食燕麦'], servingGrams: 100, calories: 389, protein: 17, fat: 7, carbs: 66, fiber: 11, sodium: 6 },
  { name: '牛奶', aliases: ['纯牛奶', '鲜牛奶'], servingGrams: 100, calories: 42, protein: 3.4, fat: 1, carbs: 5, fiber: 0, sodium: 44 },
  { name: '酸奶', aliases: ['酸牛奶', '原味酸奶'], servingGrams: 100, calories: 59, protein: 3.5, fat: 0.7, carbs: 10, fiber: 0, sodium: 40 },
  { name: '苹果', aliases: ['红富士', '青苹果'], servingGrams: 100, calories: 52, protein: 0.3, fat: 0.2, carbs: 14, fiber: 2.4, sodium: 1 },
  { name: '香蕉', aliases: ['甘蕉', '芭蕉'], servingGrams: 100, calories: 89, protein: 1.1, fat: 0.3, carbs: 23, fiber: 2.6, sodium: 1 },
  { name: '蓝莓', aliases: ['笃斯', '越橘'], servingGrams: 100, calories: 57, protein: 0.7, fat: 0.3, carbs: 14, fiber: 2.4, sodium: 1 },
  { name: '草莓', aliases: ['士多啤梨', '红莓'], servingGrams: 100, calories: 32, protein: 0.7, fat: 0.3, carbs: 7.7, fiber: 2, sodium: 1 },
  { name: '牛油果', aliases: ['鳄梨', '油梨'], servingGrams: 100, calories: 160, protein: 2, fat: 15, carbs: 8.5, fiber: 7, sodium: 7 },
  { name: '坚果', aliases: ['混合坚果', '干果'], servingGrams: 100, calories: 607, protein: 20, fat: 54, carbs: 21, fiber: 7.6, sodium: 12 },
  { name: '橄榄油', aliases: ['特级初榨橄榄油'], servingGrams: 100, calories: 884, protein: 0, fat: 100, carbs: 0, fiber: 0, sodium: 0 },
  { name: '柠檬', aliases: ['柠果', '洋柠檬'], servingGrams: 100, calories: 29, protein: 1.1, fat: 0.3, carbs: 9.3, fiber: 2.8, sodium: 2 },
  { name: '蜂蜜', aliases: ['蜜糖', '蜂糖'], servingGrams: 100, calories: 304, protein: 0.3, fat: 0, carbs: 82, fiber: 0.2, sodium: 4 },
  { name: '意大利面', aliases: ['意面', '意粉'], servingGrams: 100, calories: 131, protein: 5, fat: 1.1, carbs: 25, fiber: 1.8, sodium: 2 },
  { name: '米饭', aliases: ['白米饭', '大米饭'], servingGrams: 100, calories: 130, protein: 2.7, fat: 0.3, carbs: 28, fiber: 0.4, sodium: 1 },
  { name: '面包', aliases: ['吐司', '全麦面包'], servingGrams: 100, calories: 265, protein: 9, fat: 3.2, carbs: 49, fiber: 2.7, sodium: 480 },
  { name: '芝士', aliases: ['奶酪', '干酪'], servingGrams: 100, calories: 402, protein: 25, fat: 33, carbs: 1.3, fiber: 0, sodium: 621 },
  { name: '生菜', aliases: ['莴苣叶', '叶生菜'], servingGrams: 100, calories: 15, protein: 1.4, fat: 0.2, carbs: 2.9, fiber: 1.3, sodium: 28 },
  { name: '黄瓜', aliases: ['胡瓜', '青瓜'], servingGrams: 100, calories: 16, protein: 0.7, fat: 0.1, carbs: 3.6, fiber: 0.5, sodium: 2 },
  { name: '玉米', aliases: ['玉米粒', '玉蜀黍'], servingGrams: 100, calories: 86, protein: 3.2, fat: 1.2, carbs: 19, fiber: 2.7, sodium: 15 },
  { name: '豌豆', aliases: ['青豆', '雪豆'], servingGrams: 100, calories: 81, protein: 5.4, fat: 0.4, carbs: 14, fiber: 5.7, sodium: 5 },
  { name: '南瓜', aliases: ['倭瓜', '番瓜'], servingGrams: 100, calories: 26, protein: 1, fat: 0.1, carbs: 6.5, fiber: 0.5, sodium: 1 },
  { name: '红薯', aliases: ['番薯', '地瓜'], servingGrams: 100, calories: 86, protein: 1.6, fat: 0.1, carbs: 20, fiber: 3, sodium: 55 },
  { name: '猪肉', aliases: ['五花肉', '里脊肉'], servingGrams: 100, calories: 242, protein: 27, fat: 14, carbs: 0, fiber: 0, sodium: 62 },
  { name: '羊肉', aliases: ['山羊肉', '绵羊肉'], servingGrams: 100, calories: 294, protein: 26, fat: 21, carbs: 0, fiber: 0, sodium: 76 },
  { name: '螃蟹', aliases: ['河蟹', '大闸蟹'], servingGrams: 100, calories: 97, protein: 19, fat: 1.5, carbs: 4.7, fiber: 0, sodium: 260 },
  { name: '鱿鱼', aliases: ['枪乌贼', '柔鱼'], servingGrams: 100, calories: 92, protein: 18, fat: 1.4, carbs: 3.1, fiber: 0, sodium: 110 },
  { name: '海带', aliases: ['昆布', '江白菜'], servingGrams: 100, calories: 43, protein: 1.7, fat: 0.6, carbs: 9.6, fiber: 1.3, sodium: 2336 },
  { name: '紫菜', aliases: ['海苔', '子菜'], servingGrams: 100, calories: 207, protein: 26, fat: 1.1, carbs: 44, fiber: 22, sodium: 710 },
  { name: '木耳', aliases: ['黑木耳', '云耳'], servingGrams: 100, calories: 265, protein: 12, fat: 1.5, carbs: 65, fiber: 30, sodium: 48 },
  { name: '金针菇', aliases: ['毛柄金钱菌', '冬菇'], servingGrams: 100, calories: 26, protein: 2.4, fat: 0.4, carbs: 6, fiber: 2.7, sodium: 15 },
  { name: '藜麦', aliases: ['南美藜', '奎奴亚藜'], servingGrams: 100, calories: 368, protein: 14, fat: 6, carbs: 64, fiber: 7, sodium: 5 },
  { name: '山药', aliases: ['怀山药', '薯蓣'], servingGrams: 100, calories: 57, protein: 1.9, fat: 0.2, carbs: 13, fiber: 0.8, sodium: 18 },
  { name: '枸杞', aliases: ['枸杞子', '红耳坠'], servingGrams: 100, calories: 258, protein: 10, fat: 1.6, carbs: 64, fiber: 10, sodium: 70 },
  { name: '小葱', aliases: ['青葱', '香葱'], servingGrams: 100, calories: 30, protein: 2.5, fat: 0.4, carbs: 6.5, fiber: 1.8, sodium: 20 },
  { name: '豆浆', aliases: ['豆奶', '黄豆浆'], servingGrams: 100, calories: 54, protein: 3.3, fat: 1.8, carbs: 6.3, fiber: 0.6, sodium: 10 },
  { name: '小米粥', aliases: ['小米稀饭'], servingGrams: 100, calories: 46, protein: 1.4, fat: 0.7, carbs: 8.4, fiber: 0.5, sodium: 3 },
  { name: '包子', aliases: ['肉包', '菜包'], servingGrams: 100, calories: 227, protein: 10, fat: 3.2, carbs: 39, fiber: 2.2, sodium: 220 },
  { name: '饺子', aliases: ['水饺', '蒸饺'], servingGrams: 100, calories: 253, protein: 11, fat: 12, carbs: 26, fiber: 1.6, sodium: 330 },
  { name: '炒饭', aliases: ['蛋炒饭', '扬州炒饭'], servingGrams: 100, calories: 167, protein: 5.3, fat: 4.6, carbs: 26, fiber: 0.5, sodium: 180 },
  { name: '拉面', aliases: ['面条', '牛肉面'], servingGrams: 100, calories: 137, protein: 6, fat: 3.2, carbs: 22, fiber: 1.2, sodium: 210 },
  { name: '沙拉', aliases: ['蔬菜沙拉', '凯撒沙拉'], servingGrams: 100, calories: 85, protein: 3, fat: 6, carbs: 5.5, fiber: 2.1, sodium: 120 },
];

const PORTION_DEFAULT_GRAMS: Record<string, number> = {
  '鸡胸肉': 150, '西兰花': 200, '糙米': 150, '三文鱼': 150, '鸡蛋': 50,
  '番茄': 150, '土豆': 150, '胡萝卜': 100, '菠菜': 150, '牛肉': 100,
  '豆腐': 200, '蘑菇': 100, '青椒': 100, '洋葱': 100, '大蒜': 10,
  '虾': 100, '燕麦': 50, '牛奶': 250, '酸奶': 200, '苹果': 150,
  '香蕉': 120, '蓝莓': 100, '草莓': 100, '牛油果': 100, '坚果': 30,
  '橄榄油': 10, '柠檬': 30, '蜂蜜': 20, '意大利面': 100, '米饭': 150,
  '面包': 80, '芝士': 30, '生菜': 100, '黄瓜': 150, '玉米': 150,
  '豌豆': 100, '南瓜': 200, '红薯': 150, '猪肉': 100, '羊肉': 100,
  '螃蟹': 150, '鱿鱼': 100, '海带': 50, '紫菜': 5, '木耳': 20,
  '金针菇': 150, '藜麦': 60, '山药': 150, '枸杞': 20, '小葱': 10,
};

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

function findEntry(foodName: string): NutritionDBEntry | null {
  const name = normalize(foodName);
  let best: NutritionDBEntry | null = null;
  let bestScore = 0;
  for (const e of NUTRITION_DB) {
    const entryName = normalize(e.name);
    let score = 0;
    if (entryName === name) score = 100;
    if (entryName.startsWith(name) || name.startsWith(entryName)) score = Math.max(score, 80);
    if (entryName.includes(name) || name.includes(entryName)) score = Math.max(score, 60);
    for (const alias of e.aliases) {
      const a = normalize(alias);
      if (a === name) score = Math.max(score, 90);
      if (a.startsWith(name) || name.startsWith(a)) score = Math.max(score, 70);
      if (a.includes(name) || name.includes(a)) score = Math.max(score, 50);
    }
    if (score > bestScore) { bestScore = score; best = e; }
  }
  return bestScore >= 50 ? best : null;
}

export function lookupNutrition(foodName: string, amount: number, unit: 'g' | '份'): NutritionValue {
  const entry = findEntry(foodName);
  const empty: NutritionValue = { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0, sodium: 0 };
  if (!entry) return empty;
  let grams: number;
  if (unit === 'g') {
    grams = amount;
  } else {
    grams = PORTION_DEFAULT_GRAMS[entry.name] ?? entry.servingGrams;
    grams = grams * amount;
  }
  const ratio = grams / entry.servingGrams;
  return {
    calories: +(entry.calories * ratio).toFixed(1),
    protein: +(entry.protein * ratio).toFixed(1),
    fat: +(entry.fat * ratio).toFixed(1),
    carbs: +(entry.carbs * ratio).toFixed(1),
    fiber: +(entry.fiber * ratio).toFixed(1),
    sodium: +(entry.sodium * ratio).toFixed(1),
  };
}

export function sumNutrition(values: NutritionValue[]): NutritionValue {
  const s: NutritionValue = { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0, sodium: 0 };
  for (const v of values) {
    s.calories += v.calories;
    s.protein += v.protein;
    s.fat += v.fat;
    s.carbs += v.carbs;
    s.fiber += v.fiber;
    s.sodium += v.sodium;
  }
  for (const k of NUTRITION_KEYS) s[k] = +s[k].toFixed(1) as never;
  return s;
}

export function getNutritionPercentages(nutrition: NutritionValue): Record<keyof NutritionValue, number> {
  const p: Record<keyof NutritionValue, number> = {
    calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0, sodium: 0
  };
  for (const k of NUTRITION_KEYS) {
    p[k] = Math.min(100, Math.round((nutrition[k] / DAILY_RECOMMENDED[k]) * 100));
  }
  return p;
}

export function generateWeeklyTrend(todayCalories: number): { date: string; calories: number }[] {
  const result: { date: string; calories: number }[] = [];
  const base = [1850, 2100, 1780, 2050, 1920, 2180];
  const today = new Date();
  for (let i = 6; i >= 1; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const idx = 6 - i;
    result.push({
      date: `${d.getMonth() + 1}/${d.getDate()}`,
      calories: base[idx % base.length] + Math.floor(Math.random() * 100 - 50),
    });
  }
  result.push({
    date: `${today.getMonth() + 1}/${today.getDate()}`,
    calories: Math.round(todayCalories || 0 + 50),
  });
  return result;
}
