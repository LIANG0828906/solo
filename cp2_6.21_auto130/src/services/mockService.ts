import type { User, Recipe, Comment, MealPlanEntry, ShoppingList, Ingredient } from '@/state/appStore';
import { v4 as uuidv4 } from 'uuid';

const USERS: User[] = [
  { id: 'user-1', nickname: '小厨娘', avatarUrl: '' },
  { id: 'user-2', nickname: '美食家老王', avatarUrl: '' },
  { id: 'user-3', nickname: '健康达人', avatarUrl: '' },
  { id: 'user-4', nickname: '烘焙小白', avatarUrl: '' },
];

const makeIngredients = (arr: Array<[string, number, string, Ingredient['category'], number]>): Ingredient[] =>
  arr.map(([name, quantity, unit, category, estimatedPrice]) => ({
    id: uuidv4(),
    name,
    quantity,
    unit,
    category,
    estimatedPrice,
  }));

const RECIPES: Recipe[] = [
  {
    id: 'recipe-1',
    name: '番茄牛腩煲',
    authorId: 'user-2',
    author: USERS[1],
    thumbnail: '',
    cookTimeMinutes: 90,
    difficulty: 2,
    mainIngredients: ['牛腩', '番茄', '土豆'],
    ingredients: makeIngredients([
      ['牛腩', 500, 'g', 'meat', 38],
      ['番茄', 4, '个', 'vegetable', 8],
      ['土豆', 2, '个', 'vegetable', 4],
      ['洋葱', 1, '个', 'vegetable', 2],
      ['番茄酱', 2, '勺', 'spice', 3],
      ['生抽', 2, '勺', 'spice', 1],
    ]),
    steps: [
      '牛腩切块冷水下锅焯水去血沫',
      '番茄切块，土豆滚刀块，洋葱切丝',
      '锅中热油，炒香洋葱，加入番茄炒出红油',
      '加入牛腩翻炒均匀，加番茄酱、生抽',
      '加水没过食材，大火烧开转小火炖60分钟',
      '加入土豆继续炖20分钟，收汁即可',
    ],
    avgRating: 4.7,
    reviewCount: 128,
    createdAt: '2025-06-10T10:30:00Z',
  },
  {
    id: 'recipe-2',
    name: '蒜蓉西兰花',
    authorId: 'user-3',
    author: USERS[2],
    thumbnail: '',
    cookTimeMinutes: 15,
    difficulty: 1,
    mainIngredients: ['西兰花', '大蒜'],
    ingredients: makeIngredients([
      ['西兰花', 1, '颗', 'vegetable', 6],
      ['大蒜', 6, '瓣', 'spice', 1],
      ['盐', 1, '茶匙', 'spice', 0.5],
      ['蚝油', 1, '勺', 'spice', 1],
    ]),
    steps: [
      '西兰花掰成小朵，盐水浸泡10分钟',
      '大蒜切末',
      '水烧开加盐和油，焯西兰花1分钟',
      '捞出过凉水沥干',
      '热油爆香蒜末',
      '下西兰花翻炒，加盐蚝油炒匀',
    ],
    avgRating: 4.3,
    reviewCount: 56,
    createdAt: '2025-06-12T15:20:00Z',
  },
  {
    id: 'recipe-3',
    name: '清蒸鲈鱼',
    authorId: 'user-1',
    author: USERS[0],
    thumbnail: '',
    cookTimeMinutes: 25,
    difficulty: 2,
    mainIngredients: ['鲈鱼', '葱姜'],
    ingredients: makeIngredients([
      ['鲈鱼', 1, '条', 'seafood', 45],
      ['大葱', 1, '根', 'vegetable', 2],
      ['生姜', 1, '块', 'spice', 1],
      ['蒸鱼豉油', 3, '勺', 'spice', 3],
      ['料酒', 1, '勺', 'spice', 1],
    ]),
    steps: [
      '鲈鱼处理干净，两面划几刀',
      '鱼身抹盐和料酒腌10分钟',
      '盘底铺葱姜丝，放上鲈鱼',
      '水开后大火蒸8分钟',
      '取出倒掉汤汁，铺新鲜葱姜丝',
      '淋蒸鱼豉油，浇热油激香',
    ],
    avgRating: 4.8,
    reviewCount: 210,
    createdAt: '2025-06-08T09:15:00Z',
  },
  {
    id: 'recipe-4',
    name: '手工奶酥吐司',
    authorId: 'user-4',
    author: USERS[3],
    thumbnail: '',
    cookTimeMinutes: 180,
    difficulty: 3,
    mainIngredients: ['高筋面粉', '黄油', '牛奶', '鸡蛋'],
    ingredients: makeIngredients([
      ['高筋面粉', 300, 'g', 'grain', 8],
      ['黄油', 50, 'g', 'dairy', 6],
      ['牛奶', 180, 'ml', 'dairy', 3],
      ['鸡蛋', 1, '个', 'dairy', 1.5],
      ['细砂糖', 40, 'g', 'grain', 2],
      ['酵母', 5, 'g', 'spice', 1],
      ['盐', 3, 'g', 'spice', 0.2],
      ['奶粉', 20, 'g', 'dairy', 3],
    ]),
    steps: [
      '除黄油外所有材料揉成光滑面团',
      '加软化黄油揉至手套膜阶段',
      '基础发酵至2倍大（约60分钟）',
      '排气擀卷，松弛15分钟',
      '整形放入吐司盒，二次发酵至8分满',
      '烤箱180度烤35分钟',
    ],
    avgRating: 4.9,
    reviewCount: 87,
    createdAt: '2025-06-05T14:00:00Z',
  },
  {
    id: 'recipe-5',
    name: '麻婆豆腐',
    authorId: 'user-2',
    author: USERS[1],
    thumbnail: '',
    cookTimeMinutes: 20,
    difficulty: 2,
    mainIngredients: ['嫩豆腐', '猪肉末', '豆瓣酱'],
    ingredients: makeIngredients([
      ['嫩豆腐', 1, '盒', 'vegetable', 4],
      ['猪肉末', 100, 'g', 'meat', 8],
      ['郫县豆瓣酱', 2, '勺', 'spice', 2],
      ['花椒粉', 1, '茶匙', 'spice', 1],
      ['蒜末', 2, '勺', 'spice', 0.5],
      ['葱花', 5, '把', 'vegetable', 1],
      ['生抽', 1, '勺', 'spice', 0.5],
    ]),
    steps: [
      '豆腐切块，盐水焯2分钟捞出',
      '热油炒散肉末至金黄',
      '加豆瓣酱蒜末炒出红油',
      '加水烧开，放豆腐轻推均匀',
      '中火煮5分钟入味',
      '勾芡撒花椒粉葱花出锅',
    ],
    avgRating: 4.5,
    reviewCount: 156,
    createdAt: '2025-06-15T18:30:00Z',
  },
  {
    id: 'recipe-6',
    name: '五谷杂粮粥',
    authorId: 'user-3',
    author: USERS[2],
    thumbnail: '',
    cookTimeMinutes: 60,
    difficulty: 1,
    mainIngredients: ['大米', '小米', '红豆', '花生', '红枣'],
    ingredients: makeIngredients([
      ['大米', 50, 'g', 'grain', 1],
      ['小米', 30, 'g', 'grain', 0.8],
      ['红豆', 30, 'g', 'grain', 1],
      ['花生', 20, 'g', 'grain', 1.2],
      ['红枣', 6, '颗', 'grain', 2],
      ['桂圆干', 10, '颗', 'grain', 3],
    ]),
    steps: [
      '红豆提前浸泡2小时',
      '所有杂粮淘洗干净',
      '放入锅中加足量水',
      '大火烧开转小火慢熬',
      '期间搅拌几次防糊底',
      '熬至浓稠软糯即可',
    ],
    avgRating: 4.2,
    reviewCount: 42,
    createdAt: '2025-06-18T07:00:00Z',
  },
  {
    id: 'recipe-7',
    name: '照烧鸡腿饭',
    authorId: 'user-1',
    author: USERS[0],
    thumbnail: '',
    cookTimeMinutes: 35,
    difficulty: 2,
    mainIngredients: ['鸡腿', '米饭', '照烧酱'],
    ingredients: makeIngredients([
      ['去骨鸡腿', 2, '个', 'meat', 22],
      ['米饭', 2, '碗', 'grain', 2],
      ['生抽', 3, '勺', 'spice', 1.5],
      ['料酒', 2, '勺', 'spice', 1],
      ['蜂蜜', 1, '勺', 'spice', 1],
      ['老抽', 1, '勺', 'spice', 0.5],
      ['西兰花', 1, '朵', 'vegetable', 3],
    ]),
    steps: [
      '鸡腿肉用叉子扎孔，腌20分钟',
      '调照烧酱：生抽+料酒+蜂蜜+老抽',
      '鸡皮朝下煎至金黄翻面',
      '倒入照烧酱，中小火煮',
      '收汁浓稠，切片',
      '盛饭，摆鸡腿淋酱汁，配焯熟西兰花',
    ],
    avgRating: 4.6,
    reviewCount: 198,
    createdAt: '2025-06-14T12:10:00Z',
  },
  {
    id: 'recipe-8',
    name: '草莓奶油蛋糕',
    authorId: 'user-4',
    author: USERS[3],
    thumbnail: '',
    cookTimeMinutes: 120,
    difficulty: 3,
    mainIngredients: ['低筋面粉', '鸡蛋', '淡奶油', '草莓'],
    ingredients: makeIngredients([
      ['低筋面粉', 80, 'g', 'grain', 3],
      ['鸡蛋', 4, '个', 'dairy', 6],
      ['细砂糖', 90, 'g', 'grain', 4],
      ['淡奶油', 300, 'ml', 'dairy', 18],
      ['草莓', 500, 'g', 'vegetable', 25],
      ['牛奶', 50, 'ml', 'dairy', 1],
      ['玉米油', 40, 'g', 'grain', 3],
    ]),
    steps: [
      '蛋黄加糖牛奶玉米油搅匀，筛入面粉',
      '蛋白分三次加糖打至硬性发泡',
      '分次混合蛋黄糊和蛋白霜',
      '倒入6寸模具，150度烤50分钟',
      '出炉倒扣晾凉，横切两片',
      '奶油打发，夹层抹奶油铺草莓',
      '整体抹奶油，表面装饰草莓',
    ],
    avgRating: 4.9,
    reviewCount: 245,
    createdAt: '2025-06-03T16:45:00Z',
  },
];

const COMMENTS: Comment[] = [
  {
    id: 'comment-1',
    recipeId: 'recipe-1',
    userId: 'user-3',
    user: USERS[2],
    rating: 5,
    content: '炖出来超级香！番茄汤汁拌饭一绝，全家都爱吃。加了一点胡萝卜更营养~',
    createdAt: '2025-06-11T18:20:00Z',
  },
  {
    id: 'comment-2',
    recipeId: 'recipe-1',
    userId: 'user-4',
    user: USERS[3],
    rating: 4,
    content: '步骤很详细，新手也能上手。牛腩选肥瘦相间的更好吃！',
    createdAt: '2025-06-13T12:05:00Z',
  },
  {
    id: 'comment-3',
    recipeId: 'recipe-3',
    userId: 'user-2',
    user: USERS[1],
    rating: 5,
    content: '蒸出来的鱼肉嫩滑，浇热油那一下香味扑鼻，经典做法永远不会错！',
    createdAt: '2025-06-09T19:30:00Z',
  },
  {
    id: 'comment-4',
    recipeId: 'recipe-4',
    userId: 'user-1',
    user: USERS[0],
    rating: 5,
    content: '第一次做吐司就成功了，手套膜阶段一定要有耐心，出炉组织超棒！',
    createdAt: '2025-06-07T21:15:00Z',
  },
  {
    id: 'comment-5',
    recipeId: 'recipe-8',
    userId: 'user-3',
    user: USERS[2],
    rating: 5,
    content: '生日做了这个蛋糕，颜值口感双在线，家人都说比店里买的还好吃！',
    createdAt: '2025-06-04T10:50:00Z',
  },
];

const generateMockMealPlan = (): MealPlanEntry[] => [
  { day: 0, slot: 'breakfast', recipeId: 'recipe-6', recipe: RECIPES[5], addedBy: 'user-1' },
  { day: 0, slot: 'lunch', recipeId: 'recipe-7', recipe: RECIPES[6], addedBy: 'user-2' },
  { day: 0, slot: 'dinner', recipeId: 'recipe-1', recipe: RECIPES[0], addedBy: 'user-1' },
  { day: 1, slot: 'breakfast', recipeId: 'recipe-6', recipe: RECIPES[5], addedBy: 'user-3' },
  { day: 1, slot: 'lunch', recipeId: 'recipe-5', recipe: RECIPES[4], addedBy: 'user-2' },
  { day: 2, slot: 'lunch', recipeId: 'recipe-3', recipe: RECIPES[2], addedBy: 'user-1' },
  { day: 2, slot: 'dinner', recipeId: 'recipe-2', recipe: RECIPES[1], addedBy: 'user-3' },
  { day: 3, slot: 'breakfast', recipeId: 'recipe-4', recipe: RECIPES[3], addedBy: 'user-4' },
  { day: 4, slot: 'dinner', recipeId: 'recipe-8', recipe: RECIPES[7], addedBy: 'user-4' },
  { day: 5, slot: 'lunch', recipeId: 'recipe-7', recipe: RECIPES[6], addedBy: 'user-1' },
  { day: 6, slot: 'dinner', recipeId: 'recipe-1', recipe: RECIPES[0], addedBy: 'user-2' },
];

export const mockService = {
  async getCurrentUser(): Promise<User> {
    await new Promise((r) => setTimeout(r, 200));
    return { ...USERS[0] };
  },

  async getRecipes(): Promise<Recipe[]> {
    await new Promise((r) => setTimeout(r, 400));
    return RECIPES.map((r) => ({ ...r }));
  },

  async getRecipeComments(recipeId: string): Promise<Comment[]> {
    await new Promise((r) => setTimeout(r, 200));
    return COMMENTS.filter((c) => c.recipeId === recipeId).map((c) => ({ ...c }));
  },

  async getMealPlan(): Promise<MealPlanEntry[]> {
    await new Promise((r) => setTimeout(r, 300));
    return generateMockMealPlan();
  },

  async getShoppingList(force: boolean = false): Promise<ShoppingList> {
    await new Promise((r) => setTimeout(r, 300));
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());

    const aggregated = new Map<string, ShoppingList['items'][number]>();

    for (const entry of generateMockMealPlan()) {
      const recipe = RECIPES.find((r) => r.id === entry.recipeId);
      if (!recipe) continue;
      for (const ing of recipe.ingredients) {
        const key = ing.name;
        if (aggregated.has(key)) {
          const existing = aggregated.get(key)!;
          existing.totalQuantity += ing.quantity;
          existing.estimatedPrice = (existing.estimatedPrice ?? 0) + (ing.estimatedPrice ?? 0);
        } else {
          aggregated.set(key, {
            ingredientId: ing.id,
            name: ing.name,
            totalQuantity: ing.quantity,
            unit: ing.unit,
            category: ing.category,
            supermarketZone: mapCategoryToZone(ing.category),
            estimatedPrice: ing.estimatedPrice,
            purchased: false,
          });
        }
      }
    }

    const items = Array.from(aggregated.values()).map((it, idx) => ({
      ...it,
      purchased: force ? false : idx % 5 === 0,
      purchasedBy: (!force && idx % 5 === 0) ? 'user-2' : undefined,
    }));

    return {
      weekStartDate: weekStart.toISOString().slice(0, 10),
      items,
      lastUpdatedAt: new Date().toISOString(),
      updatedBy: 'user-1',
    };
  },

  async addComment(recipeId: string, userId: string, rating: number, content: string): Promise<Comment> {
    await new Promise((r) => setTimeout(r, 250));
    const user = USERS.find((u) => u.id === userId) ?? USERS[0];
    const comment: Comment = {
      id: `comment-${uuidv4()}`,
      recipeId,
      userId,
      user,
      rating: rating as Comment['rating'],
      content,
      createdAt: new Date().toISOString(),
    };
    COMMENTS.push(comment);
    return comment;
  },

  users: USERS,
  recipes: RECIPES,
};

function mapCategoryToZone(
  category: Ingredient['category']
): ShoppingList['items'][number]['supermarketZone'] {
  switch (category) {
    case 'vegetable':
      return 'produce';
    case 'meat':
    case 'seafood':
      return 'meat_seafood';
    case 'dairy':
      return 'dairy_eggs';
    case 'spice':
      return 'seasoning';
    case 'grain':
      return 'staples';
    default:
      return 'other';
  }
}
