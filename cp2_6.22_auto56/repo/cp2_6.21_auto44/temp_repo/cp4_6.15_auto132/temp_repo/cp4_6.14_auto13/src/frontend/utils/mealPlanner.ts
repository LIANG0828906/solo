import type { MealAssignment, Member, MealGrid, Ingredient } from '../types';

export const MEAL_RECIPES: MealAssignment[] = [
  {
    name: '西红柿鸡蛋面',
    cookTime: 20,
    cuisine: '中餐',
    ingredients: [
      { name: '西红柿', amount: '2个', category: '蔬菜' },
      { name: '鸡蛋', amount: '3个', category: '蛋类' },
      { name: '面条', amount: '300g', category: '主食' },
      { name: '葱', amount: '少许', category: '调料' },
      { name: '盐', amount: '适量', category: '调料' },
    ],
    steps: [
      '西红柿切块，鸡蛋打散备用',
      '锅中热油，炒鸡蛋盛出',
      '另起锅炒西红柿出汁，加水烧开',
      '下面条煮熟，加入炒好的鸡蛋',
      '撒葱花、调味出锅',
    ],
  },
  {
    name: '香煎三文鱼配芦笋',
    cookTime: 25,
    cuisine: '西餐',
    ingredients: [
      { name: '三文鱼', amount: '400g', category: '海鲜' },
      { name: '芦笋', amount: '1把', category: '蔬菜' },
      { name: '柠檬', amount: '半个', category: '水果' },
      { name: '黑胡椒', amount: '适量', category: '调料' },
      { name: '橄榄油', amount: '适量', category: '调料' },
    ],
    steps: [
      '三文鱼用盐和黑胡椒腌制10分钟',
      '芦笋洗净切段焯水',
      '平底锅热油，三文鱼两面煎至金黄',
      '芦笋摆盘，三文鱼放在上面',
      '挤柠檬汁提味',
    ],
  },
  {
    name: '日式照烧鸡腿饭',
    cookTime: 30,
    cuisine: '日料',
    ingredients: [
      { name: '鸡腿肉', amount: '2只', category: '肉类' },
      { name: '米饭', amount: '4碗', category: '主食' },
      { name: '酱油', amount: '3勺', category: '调料' },
      { name: '味醂', amount: '2勺', category: '调料' },
      { name: '料酒', amount: '1勺', category: '调料' },
      { name: '西兰花', amount: '半颗', category: '蔬菜' },
    ],
    steps: [
      '鸡腿肉去骨用叉子扎孔便于入味',
      '酱油、味醂、料酒调成照烧汁',
      '鸡腿皮朝下煎至金黄翻面',
      '倒入照烧汁小火收汁',
      '切片铺在米饭上，配焯水西兰花',
    ],
  },
  {
    name: '清炒时蔬沙拉',
    cookTime: 15,
    cuisine: '西餐',
    ingredients: [
      { name: '生菜', amount: '1颗', category: '蔬菜' },
      { name: '黄瓜', amount: '1根', category: '蔬菜' },
      { name: '小番茄', amount: '10颗', category: '蔬菜' },
      { name: '玉米粒', amount: '100g', category: '蔬菜' },
      { name: '橄榄油', amount: '适量', category: '调料' },
      { name: '香醋', amount: '适量', category: '调料' },
    ],
    steps: [
      '生菜撕成小片，黄瓜切片',
      '小番茄对半切',
      '所有食材放入大碗',
      '淋橄榄油和香醋拌匀',
    ],
  },
  {
    name: '麻婆豆腐',
    cookTime: 20,
    cuisine: '中餐',
    ingredients: [
      { name: '嫩豆腐', amount: '1块', category: '豆制品' },
      { name: '猪肉末', amount: '100g', category: '肉类' },
      { name: '豆瓣酱', amount: '1勺', category: '调料' },
      { name: '花椒粉', amount: '适量', category: '调料' },
      { name: '葱', amount: '少许', category: '调料' },
    ],
    steps: [
      '豆腐切块焯水备用',
      '锅中炒肉末至变色',
      '加豆瓣酱炒出红油',
      '加水烧开下豆腐',
      '勾芡撒花椒粉和葱花',
    ],
  },
  {
    name: '牛奶燕麦粥配水果',
    cookTime: 10,
    cuisine: '西餐',
    ingredients: [
      { name: '燕麦片', amount: '100g', category: '主食' },
      { name: '牛奶', amount: '500ml', category: '乳制品' },
      { name: '香蕉', amount: '1根', category: '水果' },
      { name: '蓝莓', amount: '50g', category: '水果' },
      { name: '蜂蜜', amount: '适量', category: '调料' },
    ],
    steps: [
      '牛奶加热至微沸',
      '加入燕麦片小火煮5分钟',
      '盛入碗中',
      '摆上切好的香蕉和蓝莓',
      '淋蜂蜜即可',
    ],
  },
  {
    name: '小笼包配小米粥',
    cookTime: 25,
    cuisine: '中餐',
    ingredients: [
      { name: '小笼包', amount: '8个', category: '主食' },
      { name: '小米', amount: '50g', category: '主食' },
      { name: '姜丝', amount: '少许', category: '调料' },
      { name: '醋', amount: '适量', category: '调料' },
    ],
    steps: [
      '小米淘洗干净加水熬粥',
      '小笼包上蒸锅蒸15分钟',
      '姜丝泡醋做蘸料',
      '粥熬至浓稠即可',
    ],
  },
  {
    name: '日式味噌汤配饭团',
    cookTime: 20,
    cuisine: '日料',
    ingredients: [
      { name: '味噌', amount: '2勺', category: '调料' },
      { name: '豆腐', amount: '半块', category: '豆制品' },
      { name: '海带', amount: '少许', category: '海鲜' },
      { name: '米饭', amount: '2碗', category: '主食' },
      { name: '海苔', amount: '2片', category: '调料' },
    ],
    steps: [
      '海带泡发，豆腐切块',
      '锅中加水煮海带',
      '关火加入味噌搅匀',
      '米饭捏成三角形裹海苔',
    ],
  },
  {
    name: '牛肉汉堡配薯条',
    cookTime: 30,
    cuisine: '西餐',
    ingredients: [
      { name: '牛肉馅', amount: '300g', category: '肉类' },
      { name: '汉堡胚', amount: '4个', category: '主食' },
      { name: '生菜', amount: '4片', category: '蔬菜' },
      { name: '番茄', amount: '1个', category: '蔬菜' },
      { name: '芝士片', amount: '4片', category: '乳制品' },
      { name: '土豆', amount: '2个', category: '蔬菜' },
    ],
    steps: [
      '牛肉馅调味做成肉饼',
      '土豆切条油炸成薯条',
      '肉饼煎至喜欢的熟度加芝士',
      '汉堡胚烤一下',
      '依次叠生菜、番茄、肉饼',
    ],
  },
  {
    name: '素什锦蔬菜炒面',
    cookTime: 20,
    cuisine: '中餐',
    ingredients: [
      { name: '面条', amount: '300g', category: '主食' },
      { name: '胡萝卜', amount: '1根', category: '蔬菜' },
      { name: '青椒', amount: '1个', category: '蔬菜' },
      { name: '卷心菜', amount: '4片', category: '蔬菜' },
      { name: '香菇', amount: '4朵', category: '蔬菜' },
      { name: '生抽', amount: '适量', category: '调料' },
    ],
    steps: [
      '面条煮熟过凉水',
      '所有蔬菜切丝',
      '锅中先炒蔬菜',
      '加面条和生抽翻炒均匀',
    ],
  },
  {
    name: '牛油果鸡蛋吐司',
    cookTime: 10,
    cuisine: '西餐',
    ingredients: [
      { name: '全麦吐司', amount: '4片', category: '主食' },
      { name: '牛油果', amount: '1个', category: '水果' },
      { name: '鸡蛋', amount: '2个', category: '蛋类' },
      { name: '黑胡椒', amount: '适量', category: '调料' },
    ],
    steps: [
      '吐司烤至金黄',
      '鸡蛋水煮切半',
      '牛油果切片压成泥',
      '抹牛油果泥放鸡蛋',
      '撒黑胡椒调味',
    ],
  },
  {
    name: '天妇罗拼盘',
    cookTime: 25,
    cuisine: '日料',
    ingredients: [
      { name: '虾', amount: '6只', category: '海鲜' },
      { name: '南瓜', amount: '100g', category: '蔬菜' },
      { name: '茄子', amount: '1根', category: '蔬菜' },
      { name: '天妇罗粉', amount: '100g', category: '调料' },
      { name: '蘸汁', amount: '适量', category: '调料' },
    ],
    steps: [
      '虾去壳开背，蔬菜切厚片',
      '天妇罗粉加冰水调成糊',
      '食材挂糊下油锅',
      '炸至金黄沥油',
      '配蘸汁食用',
    ],
  },
  {
    name: '皮蛋瘦肉粥',
    cookTime: 35,
    cuisine: '中餐',
    ingredients: [
      { name: '大米', amount: '80g', category: '主食' },
      { name: '皮蛋', amount: '1个', category: '蛋类' },
      { name: '瘦肉', amount: '100g', category: '肉类' },
      { name: '姜', amount: '少许', category: '调料' },
      { name: '葱', amount: '少许', category: '调料' },
    ],
    steps: [
      '大米加水大火煮开转小火',
      '瘦肉切丝腌制，皮蛋切丁',
      '粥熬至浓稠加瘦肉',
      '最后加皮蛋和姜丝',
      '撒葱花出锅',
    ],
  },
  {
    name: '蔬菜咖喱饭',
    cookTime: 30,
    cuisine: '日料',
    ingredients: [
      { name: '咖喱块', amount: '1盒', category: '调料' },
      { name: '土豆', amount: '1个', category: '蔬菜' },
      { name: '胡萝卜', amount: '1根', category: '蔬菜' },
      { name: '洋葱', amount: '半个', category: '蔬菜' },
      { name: '米饭', amount: '4碗', category: '主食' },
    ],
    steps: [
      '所有蔬菜切块',
      '锅中炒香洋葱',
      '加水煮蔬菜至软',
      '关火加咖喱块搅匀',
      '浇在米饭上',
    ],
  },
  {
    name: '意式蔬菜浓汤',
    cookTime: 25,
    cuisine: '西餐',
    ingredients: [
      { name: '番茄', amount: '2个', category: '蔬菜' },
      { name: '土豆', amount: '1个', category: '蔬菜' },
      { name: '胡萝卜', amount: '1根', category: '蔬菜' },
      { name: '芹菜', amount: '1根', category: '蔬菜' },
      { name: '黄油', amount: '10g', category: '乳制品' },
      { name: '罗勒', amount: '少许', category: '调料' },
    ],
    steps: [
      '所有蔬菜切丁',
      '黄油炒香蔬菜',
      '加水煮20分钟',
      '用料理棒打至顺滑',
      '撒罗勒叶',
    ],
  },
];

function isMealForbidden(meal: MealAssignment, restrictions: string[]): boolean {
  const rLower = restrictions.map((r) => r.toLowerCase());
  const mealText = (
    meal.name +
    ' ' +
    meal.ingredients.map((i) => i.name).join(' ')
  ).toLowerCase();
  for (const r of rLower) {
    if (!r) continue;
    if (r.includes('辣') && mealText.includes('辣')) return true;
    if (r.includes('素食') || r.includes('素')) {
      if (
        mealText.includes('肉') ||
        mealText.includes('鸡') ||
        mealText.includes('牛') ||
        mealText.includes('猪') ||
        mealText.includes('鱼') ||
        mealText.includes('虾') ||
        mealText.includes('海鲜') ||
        mealText.includes('蛋') ||
        mealText.includes('奶') ||
        mealText.includes('火腿') ||
        mealText.includes('香肠')
      )
        return true;
    }
    if (r.includes('坚果') || r.includes('花生') || r.includes('杏仁') || r.includes('核桃')) {
      if (
        mealText.includes('坚果') ||
        mealText.includes('花生') ||
        mealText.includes('杏仁') ||
        mealText.includes('核桃')
      )
        return true;
    }
    if (mealText.includes(r)) return true;
  }
  return false;
}

function scoreMealForContext(
  meal: MealAssignment,
  availableMembers: Member[],
  usedMealNames: Set<string>
): number {
  let score = 0;
  for (const m of availableMembers) {
    if (isMealForbidden(meal, m.restrictions)) return -Infinity;
    if (m.cuisinePrefs.includes(meal.cuisine)) score += 3;
  }
  if (!usedMealNames.has(meal.name)) score += 2;
  score += Math.random() * 0.5;
  return score;
}

export function generateWeekPlan(members: Member[]): MealGrid {
  const result: MealGrid = Array.from({ length: 7 }, () => [null, null, null]);
  const usedNames = new Set<string>();

  for (let d = 0; d < 7; d++) {
    for (let m = 0; m < 3; m++) {
      const avail = members.filter((mem) => mem.availability[d]?.[m]);
      if (avail.length === 0) continue;
      const scored = MEAL_RECIPES.map((meal) => ({
        meal,
        s: scoreMealForContext(meal, avail, usedNames),
      })).filter((x) => x.s > -Infinity);
      scored.sort((a, b) => b.s - a.s);
      const pick = scored[0]?.meal ?? MEAL_RECIPES[0];
      result[d][m] = pick;
      usedNames.add(pick.name);
    }
  }

  for (let i = 0; i < 50; i++) {
    const d1 = Math.floor(Math.random() * 7);
    const m1 = Math.floor(Math.random() * 3);
    const d2 = Math.floor(Math.random() * 7);
    const m2 = Math.floor(Math.random() * 3);
    if (d1 === d2 && m1 === m2) continue;

    const curScore = evaluateSwap(result, d1, m1, d2, m2, members);
    [result[d1][m1], result[d2][m2]] = [result[d2][m2], result[d1][m1]];
    const newScore = evaluateSwap(result, d1, m1, d2, m2, members);
    if (newScore < curScore) {
      [result[d1][m1], result[d2][m2]] = [result[d2][m2], result[d1][m1]];
    }
  }

  return result;
}

function evaluateSwap(
  plan: MealGrid,
  d1: number,
  m1: number,
  d2: number,
  m2: number,
  members: Member[]
): number {
  let score = 0;
  const positions: [number, number][] = [
    [d1, m1],
    [d2, m2],
  ];
  for (const [d, m] of positions) {
    const meal = plan[d][m];
    if (!meal) continue;
    const avail = members.filter((mem) => mem.availability[d]?.[m]);
    for (const mem of avail) {
      if (isMealForbidden(meal, mem.restrictions)) return -Infinity;
      if (mem.cuisinePrefs.includes(meal.cuisine)) score += 3;
    }
  }
  return score;
}

export interface ShoppingItem {
  name: string;
  amount: string;
  category: string;
}

export function generateShoppingList(plan: MealGrid): Record<string, ShoppingItem[]> {
  const merged = new Map<string, { category: string; amounts: string[] }>();

  for (let d = 0; d < 7; d++) {
    for (let m = 0; m < 3; m++) {
      const meal = plan[d][m];
      if (!meal) continue;
      for (const ing of meal.ingredients) {
        if (!merged.has(ing.name)) {
          merged.set(ing.name, { category: ing.category, amounts: [] });
        }
        merged.get(ing.name)!.amounts.push(ing.amount);
      }
    }
  }

  const grouped: Record<string, ShoppingItem[]> = {};
  for (const [name, info] of merged.entries()) {
    if (!grouped[info.category]) grouped[info.category] = [];
    grouped[info.category].push({
      name,
      amount: info.amounts.join(' + '),
      category: info.category,
    });
  }
  return grouped;
}
