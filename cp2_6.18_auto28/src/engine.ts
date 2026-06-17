import { v4 as uuidv4 } from 'uuid';

export interface Recipe {
  id: string;
  name: string;
  ingredients: string[];
  steps: string[];
}

export interface MatchedRecipe extends Recipe {
  matchPercentage: number;
  averageRating: number;
}

const ratingsStore: Record<string, number[]> = {};

export const ingredientList: Recipe[] = [
  {
    id: uuidv4(),
    name: '番茄炒蛋',
    ingredients: ['鸡蛋', '西红柿', '葱花', '盐', '糖'],
    steps: [
      '将鸡蛋打散，加少许盐搅拌均匀',
      '西红柿切块，葱切葱花备用',
      '热锅下油，倒入蛋液炒至凝固盛出',
      '锅中再加油，放入西红柿翻炒出汁',
      '加入炒好的鸡蛋，加盐和糖调味',
      '撒上葱花出锅即可'
    ]
  },
  {
    id: uuidv4(),
    name: '青椒土豆丝',
    ingredients: ['土豆', '青椒', '蒜', '醋', '盐', '生抽'],
    steps: [
      '土豆去皮切丝，用清水浸泡去淀粉',
      '青椒切丝，蒜切末',
      '热锅下油，爆香蒜末',
      '放入土豆丝大火快炒',
      '加入青椒丝翻炒，淋入醋',
      '加盐和生抽调味，翻炒均匀出锅'
    ]
  },
  {
    id: uuidv4(),
    name: '蒜蓉西兰花',
    ingredients: ['西兰花', '蒜', '盐', '蚝油', '油'],
    steps: [
      '西兰花掰成小朵，洗净沥干',
      '蒜切末备用',
      '锅中烧水加少许盐和油，焯烫西兰花1分钟捞出',
      '热锅下油，爆香一半蒜末',
      '放入西兰花翻炒',
      '加蚝油和盐调味，撒上剩余蒜末出锅'
    ]
  },
  {
    id: uuidv4(),
    name: '红烧肉',
    ingredients: ['五花肉', '冰糖', '生抽', '老抽', '料酒', '八角', '姜', '葱'],
    steps: [
      '五花肉切块，冷水下锅焯水捞出沥干',
      '姜切片，葱切段，八角备好',
      '锅中放少许油，加冰糖小火炒出糖色',
      '放入五花肉翻炒上色',
      '加入生抽、老抽、料酒翻炒',
      '加水没过肉，放入姜片、葱段、八角，大火烧开转小火炖45分钟',
      '大火收汁即可出锅'
    ]
  },
  {
    id: uuidv4(),
    name: '宫保鸡丁',
    ingredients: ['鸡胸肉', '花生米', '干辣椒', '花椒', '葱', '姜', '蒜', '生抽', '醋', '糖', '淀粉'],
    steps: [
      '鸡胸肉切丁，用盐、料酒、淀粉腌制15分钟',
      '干辣椒剪段，葱姜蒜切末',
      '调碗汁：生抽、醋、糖、淀粉、水混合',
      '热锅下油，炸花生米至金黄捞出',
      '锅中留底油，爆香花椒和干辣椒',
      '放入鸡丁翻炒至变色',
      '加葱姜蒜末炒香，倒入碗汁翻炒',
      '最后加入花生米翻匀出锅'
    ]
  },
  {
    id: uuidv4(),
    name: '鱼香肉丝',
    ingredients: ['猪里脊肉', '胡萝卜', '木耳', '青椒', '葱', '姜', '蒜', '豆瓣酱', '醋', '糖', '生抽', '淀粉'],
    steps: [
      '猪肉切丝，用盐、料酒、淀粉腌制',
      '胡萝卜、青椒切丝，木耳泡发切丝',
      '调碗汁：醋、糖、生抽、淀粉、水',
      '热锅下油，滑炒肉丝盛出',
      '锅中留油，爆香豆瓣酱和葱姜蒜末',
      '放入蔬菜丝翻炒',
      '倒入肉丝和碗汁，翻炒均匀出锅'
    ]
  },
  {
    id: uuidv4(),
    name: '麻婆豆腐',
    ingredients: ['豆腐', '猪肉末', '豆瓣酱', '花椒粉', '葱', '姜', '蒜', '生抽', '淀粉'],
    steps: [
      '豆腐切块，用淡盐水浸泡',
      '葱姜蒜切末',
      '热锅下油，炒香肉末盛出',
      '锅中留油，爆香豆瓣酱和葱姜蒜末',
      '加水烧开，放入豆腐块煮3分钟',
      '加入肉末，淋入水淀粉勾芡',
      '出锅撒上花椒粉和葱花'
    ]
  },
  {
    id: uuidv4(),
    name: '酸辣土豆丝',
    ingredients: ['土豆', '干辣椒', '花椒', '蒜', '醋', '盐', '生抽'],
    steps: [
      '土豆去皮切细丝，清水浸泡去淀粉',
      '干辣椒剪段，蒜切末',
      '热锅下油，爆香花椒和干辣椒',
      '捞出花椒，放入蒜末爆香',
      '放入土豆丝大火快炒',
      '淋入醋，加盐和生抽调味',
      '翻炒均匀出锅'
    ]
  },
  {
    id: uuidv4(),
    name: '可乐鸡翅',
    ingredients: ['鸡翅', '可乐', '生抽', '老抽', '料酒', '姜', '葱'],
    steps: [
      '鸡翅两面划刀，便于入味',
      '冷水下锅焯水，捞出沥干',
      '姜切片，葱切段',
      '热锅下油，煎鸡翅至两面金黄',
      '加入姜片葱段，倒入生抽、老抽、料酒',
      '倒入可乐没过鸡翅',
      '大火烧开转小火炖20分钟',
      '大火收汁即可'
    ]
  },
  {
    id: uuidv4(),
    name: '洋葱炒牛肉',
    ingredients: ['牛肉', '洋葱', '青椒', '蒜', '生抽', '料酒', '淀粉', '蚝油'],
    steps: [
      '牛肉切片，用生抽、料酒、淀粉腌制15分钟',
      '洋葱切丝，青椒切片，蒜切末',
      '热锅下油，滑炒牛肉至变色盛出',
      '锅中留油，爆香蒜末',
      '放入洋葱和青椒翻炒至断生',
      '倒入牛肉，加蚝油和生抽调味',
      '翻炒均匀出锅'
    ]
  },
  {
    id: uuidv4(),
    name: '西红柿鸡蛋汤',
    ingredients: ['鸡蛋', '西红柿', '葱花', '盐', '香油'],
    steps: [
      '鸡蛋打散，西红柿切块',
      '锅中加水烧开',
      '放入西红柿煮至出汁',
      '淋入蛋液，形成蛋花',
      '加盐调味，撒上葱花',
      '滴几滴香油即可'
    ]
  },
  {
    id: uuidv4(),
    name: '紫菜蛋花汤',
    ingredients: ['鸡蛋', '紫菜', '葱花', '盐', '香油', '虾皮'],
    steps: [
      '鸡蛋打散，紫菜撕碎',
      '锅中加水烧开',
      '放入紫菜和虾皮煮1分钟',
      '淋入蛋液形成蛋花',
      '加盐调味，撒上葱花',
      '滴几滴香油出锅'
    ]
  },
  {
    id: uuidv4(),
    name: '凉拌黄瓜',
    ingredients: ['黄瓜', '蒜', '醋', '生抽', '盐', '糖', '香油', '辣椒油'],
    steps: [
      '黄瓜拍碎切块',
      '蒜切末',
      '黄瓜加少许盐腌制10分钟，挤干水分',
      '碗中放入蒜末、醋、生抽、糖、香油、辣椒油调匀',
      '将调料汁倒入黄瓜中拌匀',
      '装盘即可'
    ]
  },
  {
    id: uuidv4(),
    name: '蒜蓉空心菜',
    ingredients: ['空心菜', '蒜', '盐', '蚝油', '油'],
    steps: [
      '空心菜洗净切段，蒜切末',
      '热锅下油，爆香一半蒜末',
      '放入空心菜大火快炒',
      '加盐和蚝油调味',
      '撒上剩余蒜末',
      '翻炒均匀出锅'
    ]
  },
  {
    id: uuidv4(),
    name: '清蒸鲈鱼',
    ingredients: ['鲈鱼', '姜', '葱', '蒸鱼豉油', '料酒', '盐'],
    steps: [
      '鲈鱼处理干净，两面划刀',
      '鱼身抹盐和料酒，腌10分钟',
      '姜切片，葱切丝',
      '鱼盘底铺姜片，放上鱼',
      '水烧开后上锅蒸8分钟',
      '取出倒掉盘中水，铺葱丝',
      '淋上热油，浇蒸鱼豉油即可'
    ]
  },
  {
    id: uuidv4(),
    name: '白灼虾',
    ingredients: ['虾', '姜', '葱', '料酒', '盐'],
    steps: [
      '虾剪去虾须挑去虾线',
      '姜切片，葱切段',
      '锅中加水，放入姜片、葱段、料酒、盐',
      '水烧开后放入虾',
      '煮至虾变红弯曲（约2-3分钟）',
      '捞出沥干，配蘸料食用'
    ]
  },
  {
    id: uuidv4(),
    name: '干煸豆角',
    ingredients: ['豆角', '猪肉末', '蒜', '干辣椒', '花椒', '生抽', '盐', '豆瓣酱'],
    steps: [
      '豆角切段，洗净沥干',
      '蒜切末，干辣椒剪段',
      '热锅下油，炸豆角至表皮微皱捞出',
      '锅中留油，炒香肉末盛出',
      '锅中留油，爆香花椒、干辣椒、蒜末、豆瓣酱',
      '放入豆角和肉末翻炒',
      '加生抽和盐调味出锅'
    ]
  },
  {
    id: uuidv4(),
    name: '地三鲜',
    ingredients: ['土豆', '茄子', '青椒', '蒜', '生抽', '醋', '糖', '淀粉', '蚝油'],
    steps: [
      '土豆、茄子切块，青椒切片',
      '调碗汁：生抽、醋、糖、蚝油、淀粉、水',
      '热锅下油，炸土豆至金黄捞出',
      '炸茄子至变软捞出',
      '锅中留油，爆香蒜末',
      '放入青椒翻炒，倒入炸好的土豆和茄子',
      '淋入碗汁翻炒均匀出锅'
    ]
  },
  {
    id: uuidv4(),
    name: '糖醋里脊',
    ingredients: ['猪里脊肉', '淀粉', '面粉', '番茄酱', '醋', '糖', '生抽', '料酒'],
    steps: [
      '里脊切条，用盐、料酒腌制10分钟',
      '淀粉和面粉混合，里脊裹上粉糊',
      '调糖醋汁：番茄酱、醋、糖、生抽、水、淀粉',
      '热锅下油，炸里脊至金黄酥脆捞出',
      '油温升高复炸30秒捞出',
      '锅中留少许油，倒入糖醋汁熬至浓稠',
      '放入炸好的里脊翻匀出锅'
    ]
  },
  {
    id: uuidv4(),
    name: '冬瓜排骨汤',
    ingredients: ['排骨', '冬瓜', '姜', '葱', '盐', '料酒'],
    steps: [
      '排骨冷水下锅焯水，捞出洗净',
      '冬瓜去皮切块，姜切片，葱切段',
      '砂锅中加水，放入排骨、姜片、葱段、料酒',
      '大火烧开转小火炖40分钟',
      '放入冬瓜继续炖15分钟',
      '加盐调味即可'
    ]
  },
  {
    id: uuidv4(),
    name: '土豆炖牛肉',
    ingredients: ['牛肉', '土豆', '胡萝卜', '洋葱', '姜', '葱', '生抽', '老抽', '料酒', '八角'],
    steps: [
      '牛肉切块焯水，捞出洗净',
      '土豆、胡萝卜切块，洋葱切片',
      '热锅下油，爆香葱姜和八角',
      '放入牛肉翻炒，加生抽、老抽、料酒',
      '加水没过牛肉，大火烧开转小火炖1小时',
      '放入土豆、胡萝卜、洋葱继续炖20分钟',
      '大火收汁即可'
    ]
  }
];

export function calculateMatch(userInput: string[]): MatchedRecipe[] {
  const normalizedInput = userInput.map(i => i.trim().toLowerCase());
  const results: MatchedRecipe[] = [];

  for (const recipe of ingredientList) {
    const normalizedRecipeIngredients = recipe.ingredients.map(i => i.toLowerCase());
    const matchedCount = normalizedInput.filter(input =>
      normalizedRecipeIngredients.some(ri => ri.includes(input) || input.includes(ri))
    ).length;
    const percentage = Math.round((matchedCount / recipe.ingredients.length) * 100);

    if (percentage >= 50) {
      results.push({
        ...recipe,
        matchPercentage: percentage,
        averageRating: getAverageRating(recipe.id)
      });
    }
  }

  results.sort((a, b) => b.matchPercentage - a.matchPercentage);
  return results;
}

export function getAverageRating(recipeId: string): number {
  const scores = ratingsStore[recipeId] || [];
  if (scores.length === 0) return 0;
  const sum = scores.reduce((a, b) => a + b, 0);
  return Math.round((sum / scores.length) * 10) / 10;
}

export function recordRating(recipeId: string, score: number): void {
  if (!ratingsStore[recipeId]) {
    ratingsStore[recipeId] = [];
  }
  ratingsStore[recipeId].push(score);
}
