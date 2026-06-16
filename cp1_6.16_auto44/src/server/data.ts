import { v4 as uuidv4 } from 'uuid';
import type { Recipe, Collection, Ingredient, Step, ShoppingListItem, Stats, CreateRecipeDto, UpdateRecipeDto, CreateCollectionDto, UpdateCollectionDto } from './types.js';

export const PRESET_TAGS = [
  '川菜', '粤菜', '湘菜', '鲁菜', '苏菜', '浙菜', '闽菜', '徽菜',
  '烘焙', '甜点', '素食', '减脂', '快手菜', '家常菜', '汤品',
  '早餐', '午餐', '晚餐', '夜宵', '儿童餐', '老人餐'
];

const createSteps = (descriptions: string[]): Step[] => {
  return descriptions.map((desc, index) => ({
    id: uuidv4(),
    order: index + 1,
    description: desc,
    duration: Math.floor(Math.random() * 20) + 5
  }));
};

let recipes: Recipe[] = [
  {
    id: uuidv4(),
    name: '红烧肉',
    description: '经典家常菜，肥而不腻，入口即化，色泽红亮诱人',
    imageUrls: ['https://images.unsplash.com/photo-1623595119708-26b1f7500ddd?w=800&q=80'],
    ingredients: [
      { name: '五花肉', quantity: 500, unit: 'g' },
      { name: '冰糖', quantity: 30, unit: 'g' },
      { name: '生抽', quantity: 2, unit: '勺' },
      { name: '老抽', quantity: 1, unit: '勺' },
      { name: '料酒', quantity: 2, unit: '勺' },
      { name: '姜片', quantity: 5, unit: '片' },
      { name: '八角', quantity: 2, unit: '个' }
    ],
    steps: createSteps([
      '五花肉切块，冷水下锅焯水去血沫',
      '锅中放少许油，小火融化冰糖炒糖色',
      '放入焯好的肉块翻炒均匀上色',
      '加入生抽、老抽、料酒调味',
      '加入没过肉块的热水，放入姜片和八角',
      '大火烧开后转小火炖煮60分钟',
      '大火收汁至浓稠即可出锅'
    ]),
    totalTime: 90,
    difficulty: 3,
    tags: ['家常菜', '午餐', '晚餐'],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: uuidv4(),
    name: '番茄炒蛋',
    description: '简单快手的国民家常菜，酸甜可口，营养丰富',
    imageUrls: ['https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80'],
    ingredients: [
      { name: '番茄', quantity: 3, unit: '个' },
      { name: '鸡蛋', quantity: 3, unit: '个' },
      { name: '葱花', quantity: 10, unit: 'g' },
      { name: '盐', quantity: 3, unit: 'g' },
      { name: '白糖', quantity: 5, unit: 'g' }
    ],
    steps: createSteps([
      '番茄顶部划十字，用开水烫后去皮切块',
      '鸡蛋打散，加少许盐搅匀',
      '热锅放油，倒入蛋液快速翻炒至凝固盛出',
      '锅中补少许油，放入番茄块翻炒出汁',
      '加入盐和白糖调味',
      '倒入炒好的鸡蛋翻炒均匀',
      '撒上葱花即可出锅'
    ]),
    totalTime: 20,
    difficulty: 1,
    tags: ['快手菜', '家常菜', '素食', '午餐', '晚餐'],
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 5).toISOString()
  },
  {
    id: uuidv4(),
    name: '麻婆豆腐',
    description: '川菜经典，麻辣鲜香，豆腐嫩滑，肉末香酥',
    imageUrls: ['https://images.unsplash.com/photo-1582452932307-f63b7594ab6f?w=800&q=80'],
    ingredients: [
      { name: '嫩豆腐', quantity: 400, unit: 'g' },
      { name: '牛肉末', quantity: 100, unit: 'g' },
      { name: '豆瓣酱', quantity: 1, unit: '勺' },
      { name: '花椒粉', quantity: 2, unit: 'g' },
      { name: '蒜末', quantity: 5, unit: 'g' },
      { name: '姜末', quantity: 5, unit: 'g' },
      { name: '淀粉', quantity: 5, unit: 'g' }
    ],
    steps: createSteps([
      '豆腐切小块，用盐水浸泡5分钟',
      '热锅放油，放入牛肉末炒至变色',
      '加入豆瓣酱炒出红油',
      '加入蒜末、姜末爆香',
      '加入适量清水烧开',
      '放入豆腐块轻轻推动均匀',
      '小火煮5分钟让豆腐入味',
      '淀粉加水勾芡，撒上花椒粉即可'
    ]),
    totalTime: 30,
    difficulty: 2,
    tags: ['川菜', '家常菜', '午餐', '晚餐'],
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString()
  },
  {
    id: uuidv4(),
    name: '芝士蛋糕',
    description: '浓郁绵密的重芝士蛋糕，口感丝滑，甜而不腻',
    imageUrls: ['https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&q=80'],
    ingredients: [
      { name: '奶油奶酪', quantity: 250, unit: 'g' },
      { name: '淡奶油', quantity: 150, unit: 'ml' },
      { name: '细砂糖', quantity: 60, unit: 'g' },
      { name: '鸡蛋', quantity: 2, unit: '个' },
      { name: '低筋面粉', quantity: 20, unit: 'g' },
      { name: '消化饼干', quantity: 100, unit: 'g' },
      { name: '黄油', quantity: 50, unit: 'g' }
    ],
    steps: createSteps([
      '消化饼干压碎，加入融化的黄油拌匀铺在蛋糕模底部压实',
      '奶油奶酪室温软化，加入细砂糖打至顺滑',
      '逐个加入鸡蛋，每次都搅拌均匀',
      '加入淡奶油搅拌均匀',
      '筛入低筋面粉，轻轻翻拌至无颗粒',
      '将芝士糊倒入铺好饼底的模具中',
      '烤箱预热160度，水浴法烘烤60分钟',
      '晾凉后冷藏4小时以上即可食用'
    ]),
    totalTime: 120,
    difficulty: 4,
    tags: ['烘焙', '甜点', '下午茶'],
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 10).toISOString()
  },
  {
    id: uuidv4(),
    name: '清蒸鲈鱼',
    description: '粤菜经典，鱼肉鲜嫩，原汁原味，营养丰富',
    imageUrls: ['https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&q=80'],
    ingredients: [
      { name: '鲈鱼', quantity: 1, unit: '条' },
      { name: '葱丝', quantity: 20, unit: 'g' },
      { name: '姜丝', quantity: 10, unit: 'g' },
      { name: '蒸鱼豉油', quantity: 2, unit: '勺' },
      { name: '料酒', quantity: 1, unit: '勺' },
      { name: '食用油', quantity: 2, unit: '勺' }
    ],
    steps: createSteps([
      '鲈鱼处理干净，两面划几刀，抹上料酒腌制10分钟',
      '鱼身放上姜丝，放入烧开水的蒸锅',
      '大火蒸8-10分钟（根据鱼的大小调整）',
      '蒸好后倒掉盘中的汤汁',
      '拣去姜丝，铺上新鲜葱丝',
      '淋上蒸鱼豉油',
      '烧热食用油，淋在葱丝上激出香味即可'
    ]),
    totalTime: 25,
    difficulty: 2,
    tags: ['粤菜', '家常菜', '午餐', '晚餐', '老人餐'],
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    id: uuidv4(),
    name: '蔬菜沙拉',
    description: '清爽健康的减脂餐，低卡高纤，适合减肥人群',
    imageUrls: ['https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80'],
    ingredients: [
      { name: '生菜', quantity: 100, unit: 'g' },
      { name: '紫甘蓝', quantity: 50, unit: 'g' },
      { name: '小番茄', quantity: 10, unit: '个' },
      { name: '黄瓜', quantity: 1, unit: '根' },
      { name: '玉米粒', quantity: 50, unit: 'g' },
      { name: '橄榄油', quantity: 2, unit: '勺' },
      { name: '黑醋', quantity: 1, unit: '勺' },
      { name: '蜂蜜', quantity: 1, unit: '勺' }
    ],
    steps: createSteps([
      '生菜撕成小片，紫甘蓝切丝',
      '小番茄对半切，黄瓜切片',
      '所有蔬菜放入大碗中',
      '加入煮熟的玉米粒',
      '橄榄油、黑醋、蜂蜜混合调成酱汁',
      '将酱汁淋在蔬菜上',
      '轻轻拌匀即可食用'
    ]),
    totalTime: 15,
    difficulty: 1,
    tags: ['素食', '减脂', '快手菜', '午餐', '晚餐'],
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 7).toISOString()
  },
  {
    id: uuidv4(),
    name: '蛋炒饭',
    description: '粒粒分明，蛋香浓郁，简单却考验功力的经典主食',
    imageUrls: ['https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&q=80'],
    ingredients: [
      { name: '隔夜米饭', quantity: 300, unit: 'g' },
      { name: '鸡蛋', quantity: 2, unit: '个' },
      { name: '葱花', quantity: 15, unit: 'g' },
      { name: '盐', quantity: 3, unit: 'g' },
      { name: '生抽', quantity: 1, unit: '勺' }
    ],
    steps: createSteps([
      '隔夜米饭提前打散，每粒米分开',
      '鸡蛋打散，加少许盐搅匀',
      '热锅多放油，油热后倒入蛋液',
      '蛋液半凝固时倒入米饭快速翻炒',
      '让每粒米饭都裹上蛋液',
      '加入盐和生抽调味',
      '大火翻炒均匀，撒上葱花出锅'
    ]),
    totalTime: 15,
    difficulty: 2,
    tags: ['快手菜', '家常菜', '午餐', '晚餐', '夜宵'],
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 15).toISOString()
  },
  {
    id: uuidv4(),
    name: '小米粥',
    description: '养胃佳品，口感绵滑，适合早餐和老人儿童',
    imageUrls: ['https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=80'],
    ingredients: [
      { name: '小米', quantity: 100, unit: 'g' },
      { name: '大米', quantity: 50, unit: 'g' },
      { name: '枸杞', quantity: 10, unit: '粒' },
      { name: '冰糖', quantity: 20, unit: 'g' }
    ],
    steps: createSteps([
      '小米和大米混合淘洗干净',
      '锅中加入适量清水烧开',
      '放入淘好的米，大火煮开',
      '转小火慢熬30分钟',
      '期间搅拌几次防止粘锅',
      '加入枸杞和冰糖',
      '继续煮5分钟至冰糖融化即可'
    ]),
    totalTime: 40,
    difficulty: 1,
    tags: ['早餐', '老人餐', '儿童餐', '汤品'],
    createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 20).toISOString()
  }
];

let collections: Collection[] = [
  {
    id: uuidv4(),
    name: '一周晚餐计划',
    description: '营养均衡的一周晚餐搭配，每天不重样',
    recipeIds: recipes.slice(0, 5).map(r => r.id),
    createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: '周末烘焙时光',
    description: '周末在家享受烘焙的乐趣',
    recipeIds: [recipes[3].id],
    createdAt: new Date().toISOString()
  }
];

export const getAllRecipes = (): Recipe[] => {
  return [...recipes];
};

export const getRecipeById = (id: string): Recipe | undefined => {
  return recipes.find(r => r.id === id);
};

export const createRecipe = (recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>): Recipe => {
  const newRecipe: Recipe = {
    ...recipe,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  recipes.push(newRecipe);
  return newRecipe;
};

export const updateRecipe = (id: string, updates: Partial<Recipe>): Recipe | undefined => {
  const index = recipes.findIndex(r => r.id === id);
  if (index === -1) return undefined;
  recipes[index] = {
    ...recipes[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  return recipes[index];
};

export const deleteRecipe = (id: string): boolean => {
  const index = recipes.findIndex(r => r.id === id);
  if (index === -1) return false;
  recipes.splice(index, 1);
  collections = collections.map(c => ({
    ...c,
    recipeIds: c.recipeIds.filter(rid => rid !== id)
  }));
  return true;
};

export const generateShoppingList = (recipeIds: string[]): ShoppingListItem[] => {
  const ingredientMap = new Map<string, { quantity: number; unit: string; recipes: string[] }>();
  
  recipeIds.forEach(rid => {
    const recipe = recipes.find(r => r.id === rid);
    if (!recipe) return;
    
    recipe.ingredients.forEach(ing => {
      const key = `${ing.name}-${ing.unit}`;
      if (ingredientMap.has(key)) {
        const existing = ingredientMap.get(key)!;
        existing.quantity += ing.quantity;
        if (!existing.recipes.includes(recipe.name)) {
          existing.recipes.push(recipe.name);
        }
      } else {
        ingredientMap.set(key, {
          quantity: ing.quantity,
          unit: ing.unit,
          recipes: [recipe.name]
        });
      }
    });
  });
  
  return Array.from(ingredientMap.entries()).map(([key, value]) => ({
    name: key.split('-')[0],
    totalQuantity: value.quantity,
    unit: value.unit,
    recipes: value.recipes
  }));
};

export const getAllCollections = (): Collection[] => {
  return [...collections];
};

export const getCollectionById = (id: string): Collection | undefined => {
  return collections.find(c => c.id === id);
};

export const createCollection = (collection: Omit<Collection, 'id' | 'createdAt'>): Collection => {
  const newCollection: Collection = {
    ...collection,
    id: uuidv4(),
    createdAt: new Date().toISOString()
  };
  collections.push(newCollection);
  return newCollection;
};

export const updateCollection = (id: string, updates: Partial<Collection>): Collection | undefined => {
  const index = collections.findIndex(c => c.id === id);
  if (index === -1) return undefined;
  collections[index] = { ...collections[index], ...updates };
  return collections[index];
};

export const deleteCollection = (id: string): boolean => {
  const index = collections.findIndex(c => c.id === id);
  if (index === -1) return false;
  collections.splice(index, 1);
  return true;
};

export const getStats = (): Stats => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
  const recentAdded = recipes.filter(r => r.createdAt >= thirtyDaysAgo).length;
  
  const tagCount = new Map<string, number>();
  recipes.forEach(r => {
    r.tags.forEach(tag => {
      tagCount.set(tag, (tagCount.get(tag) || 0) + 1);
    });
  });
  
  const tagDistribution = Array.from(tagCount.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
  
  return {
    totalRecipes: recipes.length,
    totalCollections: collections.length,
    recentAdded,
    tagDistribution
  };
};

export const getRandomRecipes = (count: number): Recipe[] => {
  const shuffled = [...recipes].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

export const getRecipeShoppingList = (recipeId: string): ShoppingListItem[] | undefined => {
  const recipe = recipes.find(r => r.id === recipeId);
  if (!recipe) return undefined;
  return generateShoppingList([recipeId]);
};

export const getCollectionShoppingList = (collectionId: string): ShoppingListItem[] | undefined => {
  const collection = collections.find(c => c.id === collectionId);
  if (!collection) return undefined;
  return generateShoppingList(collection.recipeIds);
};
