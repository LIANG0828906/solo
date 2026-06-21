export interface Ingredient {
  id: string;
  name: string;
  emoji: string;
  color: string;
  category: 'protein' | 'vegetable' | 'grain' | 'seafood' | 'fruit' | 'dairy' | 'other';
}

export interface RecipeStep {
  order: number;
  description: string;
  durationSec: number;
}

export type CookMethod = '煮' | '蒸' | '炒' | '烤' | '拌';

export interface RecipeVariant {
  cookMethod: CookMethod;
  steps: RecipeStep[];
  cookTimeMin: number;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  ingredients: string[];
  variants: RecipeVariant[];
  difficulty: '简单' | '中等' | '困难';
}

export const INGREDIENTS: Ingredient[] = [
  { id: '1', name: '鸡胸肉', emoji: '🍗', color: '#FFB3BA', category: 'protein' },
  { id: '2', name: '西兰花', emoji: '🥦', color: '#BAFFC9', category: 'vegetable' },
  { id: '3', name: '糙米', emoji: '🍚', color: '#FFDFBA', category: 'grain' },
  { id: '4', name: '三文鱼', emoji: '🐟', color: '#FFB3BA', category: 'seafood' },
  { id: '5', name: '鸡蛋', emoji: '🥚', color: '#FFFFBA', category: 'protein' },
  { id: '6', name: '番茄', emoji: '🍅', color: '#FFB3BA', category: 'vegetable' },
  { id: '7', name: '土豆', emoji: '🥔', color: '#FFDFBA', category: 'vegetable' },
  { id: '8', name: '胡萝卜', emoji: '🥕', color: '#FFDFBA', category: 'vegetable' },
  { id: '9', name: '菠菜', emoji: '🥬', color: '#BAFFC9', category: 'vegetable' },
  { id: '10', name: '牛肉', emoji: '🥩', color: '#FFB3BA', category: 'protein' },
  { id: '11', name: '豆腐', emoji: '🧈', color: '#FFFFBA', category: 'protein' },
  { id: '12', name: '蘑菇', emoji: '🍄', color: '#E5E5E5', category: 'vegetable' },
  { id: '13', name: '青椒', emoji: '🫑', color: '#BAFFC9', category: 'vegetable' },
  { id: '14', name: '洋葱', emoji: '🧅', color: '#FFFFBA', category: 'vegetable' },
  { id: '15', name: '大蒜', emoji: '🧄', color: '#FFFFBA', category: 'other' },
  { id: '16', name: '虾', emoji: '🦐', color: '#FFB3BA', category: 'seafood' },
  { id: '17', name: '燕麦', emoji: '🌾', color: '#FFDFBA', category: 'grain' },
  { id: '18', name: '牛奶', emoji: '🥛', color: '#BAE1FF', category: 'dairy' },
  { id: '19', name: '酸奶', emoji: '🥛', color: '#BAE1FF', category: 'dairy' },
  { id: '20', name: '苹果', emoji: '🍎', color: '#FFB3BA', category: 'fruit' },
  { id: '21', name: '香蕉', emoji: '🍌', color: '#FFFFBA', category: 'fruit' },
  { id: '22', name: '蓝莓', emoji: '🫐', color: '#BAE1FF', category: 'fruit' },
  { id: '23', name: '草莓', emoji: '🍓', color: '#FFB3BA', category: 'fruit' },
  { id: '24', name: '牛油果', emoji: '🥑', color: '#BAFFC9', category: 'fruit' },
  { id: '25', name: '坚果', emoji: '🥜', color: '#FFDFBA', category: 'other' },
  { id: '26', name: '橄榄油', emoji: '🫒', color: '#BAFFC9', category: 'other' },
  { id: '27', name: '柠檬', emoji: '🍋', color: '#FFFFBA', category: 'fruit' },
  { id: '28', name: '蜂蜜', emoji: '🍯', color: '#FFDFBA', category: 'other' },
  { id: '29', name: '意大利面', emoji: '🍝', color: '#FFDFBA', category: 'grain' },
  { id: '30', name: '米饭', emoji: '🍚', color: '#FFFFBA', category: 'grain' },
  { id: '31', name: '面包', emoji: '🍞', color: '#FFDFBA', category: 'grain' },
  { id: '32', name: '芝士', emoji: '🧀', color: '#FFFFBA', category: 'dairy' },
  { id: '33', name: '生菜', emoji: '🥗', color: '#BAFFC9', category: 'vegetable' },
  { id: '34', name: '黄瓜', emoji: '🥒', color: '#BAFFC9', category: 'vegetable' },
  { id: '35', name: '玉米', emoji: '🌽', color: '#FFFFBA', category: 'vegetable' },
  { id: '36', name: '豌豆', emoji: '🫛', color: '#BAFFC9', category: 'vegetable' },
  { id: '37', name: '南瓜', emoji: '🎃', color: '#FFDFBA', category: 'vegetable' },
  { id: '38', name: '红薯', emoji: '🍠', color: '#FFDFBA', category: 'vegetable' },
  { id: '39', name: '猪肉', emoji: '🥓', color: '#FFB3BA', category: 'protein' },
  { id: '40', name: '羊肉', emoji: '🍖', color: '#FFB3BA', category: 'protein' },
  { id: '41', name: '螃蟹', emoji: '🦀', color: '#FFB3BA', category: 'seafood' },
  { id: '42', name: '鱿鱼', emoji: '🦑', color: '#FFB3BA', category: 'seafood' },
  { id: '43', name: '海带', emoji: '🌿', color: '#BAFFC9', category: 'vegetable' },
  { id: '44', name: '紫菜', emoji: '🌿', color: '#BAE1FF', category: 'vegetable' },
  { id: '45', name: '木耳', emoji: '🍄', color: '#E5E5E5', category: 'vegetable' },
  { id: '46', name: '金针菇', emoji: '🍄', color: '#FFFFBA', category: 'vegetable' },
  { id: '47', name: '豆浆', emoji: '🥛', color: '#FFFFBA', category: 'dairy' },
  { id: '48', name: '藜麦', emoji: '🌾', color: '#FFDFBA', category: 'grain' },
  { id: '49', name: '山药', emoji: '🥔', color: '#FFFFBA', category: 'vegetable' },
  { id: '50', name: '枸杞', emoji: '🔴', color: '#FFB3BA', category: 'other' },
];

const makeSteps = (descs: string[], baseDuration = 180): RecipeStep[] =>
  descs.map((d, i) => ({ order: i + 1, description: d, durationSec: baseDuration + i * 30 }));

export const RECIPES: Recipe[] = [
  {
    id: 'r1',
    name: '蒜香鸡胸肉配西兰花',
    description: '高蛋白低脂健身餐，鲜嫩鸡胸肉搭配清爽西兰花，营养均衡又美味。',
    ingredients: ['鸡胸肉', '西兰花', '大蒜', '橄榄油', '柠檬'],
    difficulty: '简单',
    variants: [
      { cookMethod: '炒', cookTimeMin: 20, steps: makeSteps([
        '将鸡胸肉切片，加入少许盐、黑胡椒腌制10分钟',
        '西兰花切小朵，沸水焯1分钟捞出过冷水',
        '热锅倒橄榄油，蒜末爆香，下鸡胸肉翻炒至变色',
        '加入西兰花翻炒2分钟，挤入柠檬汁调味即可出锅'
      ]) },
      { cookMethod: '蒸', cookTimeMin: 25, steps: makeSteps([
        '鸡胸肉切片用盐、黑胡椒、蒜末腌制15分钟',
        '西兰花切小朵铺在盘底，上面摆上鸡胸肉',
        '蒸锅水开后放入，大火蒸15分钟',
        '取出淋上少许橄榄油和柠檬汁即可'
      ]) },
      { cookMethod: '烤', cookTimeMin: 30, steps: makeSteps([
        '烤箱预热200°C',
        '鸡胸肉划几刀，用蒜末、橄榄油、盐、黑胡椒腌制20分钟',
        '烤盘铺西兰花，摆上鸡胸肉',
        '入烤箱烤20分钟，取出挤柠檬汁即可'
      ]) }
    ]
  },
  {
    id: 'r2',
    name: '番茄鸡蛋意面',
    description: '经典家常意式风味，酸甜番茄配上嫩滑鸡蛋，简单快手又好吃。',
    ingredients: ['意大利面', '番茄', '鸡蛋', '洋葱', '大蒜', '橄榄油'],
    difficulty: '简单',
    variants: [
      { cookMethod: '炒', cookTimeMin: 25, steps: makeSteps([
        '锅中加水煮沸，下意大利面煮8分钟捞出沥水',
        '番茄切丁，洋葱切碎，大蒜切末，鸡蛋打散',
        '热锅倒橄榄油，炒散鸡蛋盛出',
        '再加油爆香洋葱蒜末，加番茄炒出沙',
        '倒入意面和鸡蛋，翻炒均匀加盐调味即可'
      ]) },
      { cookMethod: '煮', cookTimeMin: 30, steps: makeSteps([
        '意大利面加水煮8分钟捞出',
        '番茄洋葱大蒜切碎，锅中加水煮开',
        '放入蔬菜丁煮5分钟成浓汤',
        '打入蛋花搅散，下意面再煮2分钟调味即可'
      ]) }
    ]
  },
  {
    id: 'r3',
    name: '清蒸三文鱼配糙米',
    description: 'Omega-3脂肪酸丰富的三文鱼，搭配糙米饭，清淡健康超满足。',
    ingredients: ['三文鱼', '糙米', '柠檬', '西兰花'],
    difficulty: '简单',
    variants: [
      { cookMethod: '蒸', cookTimeMin: 35, steps: makeSteps([
        '糙米提前浸泡30分钟，加水煮25分钟成米饭',
        '三文鱼用盐、黑胡椒腌制10分钟，摆上柠檬片',
        '西兰花切小朵和三文鱼一起放入蒸锅',
        '大火蒸12分钟，搭配糙米饭即可'
      ]) },
      { cookMethod: '烤', cookTimeMin: 30, steps: makeSteps([
        '糙米煮饭；烤箱预热200°C',
        '三文鱼抹盐、黑胡椒、橄榄油腌制',
        '烤盘铺西兰花和三文鱼，摆柠檬片',
        '烤15分钟取出配糙米饭食用'
      ]) }
    ]
  },
  {
    id: 'r4',
    name: '红烧牛肉炖土豆胡萝卜',
    description: '软烂入味的经典红烧牛肉，土豆胡萝卜吸满汤汁，下饭神器。',
    ingredients: ['牛肉', '土豆', '胡萝卜', '洋葱', '大蒜'],
    difficulty: '中等',
    variants: [
      { cookMethod: '煮', cookTimeMin: 60, steps: makeSteps([
        '牛肉切块冷水下锅焯水去血沫，捞出洗净',
        '土豆胡萝卜切滚刀块，洋葱切碎，大蒜切片',
        '锅中放油爆香洋葱大蒜，下牛肉翻炒',
        '加生抽老抽冰糖炒上色，加水没过牛肉',
        '大火煮开转小火炖40分钟',
        '加入土豆胡萝卜继续炖20分钟至软烂收汁'
      ], 300) }
    ]
  },
  {
    id: 'r5',
    name: '麻婆豆腐',
    description: '香辣鲜烫的川味经典，嫩滑豆腐配上麻辣酱汁，超级下饭。',
    ingredients: ['豆腐', '牛肉', '青椒', '大蒜', '洋葱'],
    difficulty: '中等',
    variants: [
      { cookMethod: '炒', cookTimeMin: 25, steps: makeSteps([
        '豆腐切小块，盐水浸泡5分钟捞出',
        '牛肉剁碎，青椒切丁，大蒜切末，洋葱切碎',
        '热锅下油，炒香牛肉末盛出',
        '留底油爆香蒜末洋葱，加豆瓣酱炒出红油',
        '加水烧开下豆腐，轻轻推动煮5分钟',
        '加入牛肉末青椒丁，勾芡撒花椒粉出锅'
      ]) }
    ]
  },
  {
    id: 'r6',
    name: '虾仁滑蛋',
    description: 'Q弹虾仁搭配嫩滑鸡蛋，营养丰富的家常快手菜。',
    ingredients: ['虾', '鸡蛋', '洋葱', '小葱'],
    difficulty: '简单',
    variants: [
      { cookMethod: '炒', cookTimeMin: 15, steps: makeSteps([
        '虾仁去虾线，用盐料酒腌制5分钟',
        '鸡蛋打散加少许盐，洋葱切碎',
        '热锅下油，虾仁炒至变色盛出',
        '留底油倒入蛋液，半凝固时加虾仁洋葱',
        '翻炒至蛋液凝固即可出锅'
      ]) },
      { cookMethod: '蒸', cookTimeMin: 20, steps: makeSteps([
        '虾仁腌制好，鸡蛋打散加温水过筛',
        '蛋液倒入碗中，盖上保鲜膜扎小孔',
        '蒸锅水开后放入，中火蒸10分钟',
        '摆上虾仁和洋葱碎，再蒸3分钟淋生抽即可'
      ]) }
    ]
  },
  {
    id: 'r7',
    name: '牛油果鸡蛋沙拉',
    description: '清爽健康的轻食沙拉，牛油果的绵密搭配鸡蛋的嫩滑超赞。',
    ingredients: ['牛油果', '鸡蛋', '生菜', '番茄', '黄瓜', '柠檬', '橄榄油'],
    difficulty: '简单',
    variants: [
      { cookMethod: '拌', cookTimeMin: 15, steps: makeSteps([
        '鸡蛋冷水下锅，水开后煮8分钟过冷水去壳切块',
        '牛油果去核切小块，番茄切丁，黄瓜切片',
        '生菜洗净撕成小块铺在碗底',
        '所有食材摆入碗中',
        '淋上柠檬汁、橄榄油、盐黑胡椒拌匀即可'
      ]) }
    ]
  },
  {
    id: 'r8',
    name: '菠菜蘑菇燕麦粥',
    description: '温暖养胃的咸味燕麦粥，菠菜和蘑菇的鲜味融入软糯燕麦。',
    ingredients: ['燕麦', '菠菜', '蘑菇', '鸡蛋', '牛奶'],
    difficulty: '简单',
    variants: [
      { cookMethod: '煮', cookTimeMin: 20, steps: makeSteps([
        '蘑菇切片，菠菜切段，鸡蛋打散',
        '锅中加水和牛奶，倒入燕麦煮开',
        '转小火煮10分钟至燕麦浓稠',
        '加入蘑菇煮3分钟，再下菠菜',
        '淋入蛋液搅成蛋花，加盐调味即可'
      ]) }
    ]
  },
  {
    id: 'r9',
    name: '南瓜红薯浓汤',
    description: '香甜浓郁的秋日暖汤，南瓜红薯的天然甜味带来温暖治愈。',
    ingredients: ['南瓜', '红薯', '牛奶', '洋葱', '大蒜'],
    difficulty: '简单',
    variants: [
      { cookMethod: '煮', cookTimeMin: 30, steps: makeSteps([
        '南瓜红薯去皮切小块，洋葱切碎，大蒜切片',
        '锅中放油爆香洋葱大蒜，加入南瓜红薯翻炒',
        '加水没过食材，大火煮开转小火煮15分钟',
        '煮至软烂后用料理棒打成细腻浓汤',
        '倒入牛奶搅匀，加盐和黑胡椒调味即可'
      ]) },
      { cookMethod: '蒸', cookTimeMin: 40, steps: makeSteps([
        '南瓜红薯去皮切大块，洋葱大蒜备好',
        '全部材料放入蒸锅，大火蒸25分钟至软烂',
        '取出放入料理机，加牛奶打成浓汤',
        '倒回锅中加热，调味即可享用'
      ]) }
    ]
  },
  {
    id: 'r10',
    name: '什锦蔬菜炒饭',
    description: '粒粒分明的美味炒饭，多种蔬菜搭配营养满分，处理剩米饭首选。',
    ingredients: ['米饭', '鸡蛋', '胡萝卜', '豌豆', '玉米', '洋葱'],
    difficulty: '简单',
    variants: [
      { cookMethod: '炒', cookTimeMin: 15, steps: makeSteps([
        '鸡蛋打散，胡萝卜切小丁，洋葱切碎',
        '热锅下油，倒蛋液炒散盛出',
        '留底油爆香洋葱，下胡萝卜豌豆玉米翻炒2分钟',
        '倒入米饭，用铲子压散翻炒均匀',
        '加入鸡蛋碎，加盐调味翻炒至颗粒分明出锅'
      ]) }
    ]
  },
  {
    id: 'r11',
    name: '蓝莓酸奶燕麦碗',
    description: '颜值超高的健康早餐，酸甜蓝莓搭配丝滑酸奶和燕麦。',
    ingredients: ['酸奶', '燕麦', '蓝莓', '香蕉', '蜂蜜', '坚果'],
    difficulty: '简单',
    variants: [
      { cookMethod: '拌', cookTimeMin: 5, steps: makeSteps([
        '燕麦提前用少许牛奶泡软5分钟',
        '香蕉切片，蓝莓洗净，坚果切碎',
        '碗中倒入酸奶，铺上泡软的燕麦',
        '摆上香蕉片、蓝莓和坚果',
        '淋上蜂蜜即可享用'
      ], 60) }
    ]
  },
  {
    id: 'r12',
    name: '山药木耳炒肉片',
    description: '脆嫩爽滑的经典养生菜，山药健脾木耳清肺，营养又美味。',
    ingredients: ['山药', '木耳', '猪肉', '青椒', '大蒜'],
    difficulty: '中等',
    variants: [
      { cookMethod: '炒', cookTimeMin: 20, steps: makeSteps([
        '木耳温水泡发去蒂，山药去皮切片，猪肉切片腌制',
        '山药和木耳分别焯水，捞出过冷水备用',
        '热锅下油，肉片滑炒变色盛出',
        '留底油爆香蒜片，下青椒翻炒',
        '加入山药木耳翻炒，再倒回肉片',
        '加盐生抽调味，翻炒均匀出锅'
      ]) }
    ]
  }
];

export const COOK_METHODS: CookMethod[] = ['炒', '蒸', '煮', '烤', '拌'];

function editDistance(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1];
      else dp[i][j] = Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]) + 1;
    }
  }
  return dp[a.length][b.length];
}

export function fuzzySearchIngredient(keyword: string): Ingredient[] {
  if (!keyword.trim()) return [];
  const kw = keyword.trim().toLowerCase();
  const scored = INGREDIENTS.map(ing => {
    let score = 0;
    const name = ing.name.toLowerCase();
    if (name.startsWith(kw)) score += 10;
    if (name.includes(kw)) score += 5;
    if (editDistance(name, kw) <= 2) score += 3;
    return { ing, score };
  }).filter(x => x.score > 0);
  scored.sort((a, b) => b.score - a.score);
  const seen = new Set<string>();
  const result: Ingredient[] = [];
  for (const s of scored) {
    if (!seen.has(s.ing.name)) {
      seen.add(s.ing.name);
      result.push(s.ing);
      if (result.length >= 5) break;
    }
  }
  return result;
}

export function matchRecipes(selectedIngredients: string[], cookMethod: CookMethod): Recipe[] {
  if (selectedIngredients.length === 0) return RECIPES.slice(0, 3);
  const userSet = new Set(selectedIngredients);
  const scored = RECIPES.map(r => {
    let hits = 0;
    for (const ing of r.ingredients) if (userSet.has(ing)) hits++;
    const coverage = hits / r.ingredients.length;
    const utilization = selectedIngredients.length > 0 ? hits / selectedIngredients.length : 0;
    let score = coverage * 10 + utilization * 10;
    const hasMethod = r.variants.some(v => v.cookMethod === cookMethod);
    if (hasMethod) score += 5;
    return { r, score, hasMethod };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 3).map(x => x.r);
}

export function getRecipeVariant(recipe: Recipe, cookMethod: CookMethod): RecipeVariant {
  const found = recipe.variants.find(v => v.cookMethod === cookMethod);
  if (found) return found;
  return recipe.variants[0];
}

(function validateAndDedupe() {
  const seen = new Set<string>();
  const deduped: Ingredient[] = [];
  for (const ing of INGREDIENTS) {
    if (!seen.has(ing.name)) {
      seen.add(ing.name);
      deduped.push(ing);
    } else {
      console.warn(`[数据校验] 食材列表存在重复项，已自动移除："${ing.name}"`);
    }
  }
  INGREDIENTS.length = 0;
  INGREDIENTS.push(...deduped);

  for (const r of RECIPES) {
    const unique = Array.from(new Set(r.ingredients));
    if (unique.length !== r.ingredients.length) {
      console.warn(`[数据校验] 食谱 "${r.name}" 的 ingredients 存在重复项，已自动去重`);
      r.ingredients = unique;
    }
  }
})();
