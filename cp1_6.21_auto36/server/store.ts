import { Recipe, Ingredient, InventoryItem, Comment } from '../src/types';
import { v4 as uuidv4 } from 'uuid';

export let recipes: Recipe[] = [];
export let inventory: InventoryItem[] = [];

const now = new Date();
const future = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};
const past = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
};

const sampleIngredients1: Ingredient[] = [
  { id: uuidv4(), name: '鸡蛋', quantity: 3, unit: '个' },
  { id: uuidv4(), name: '番茄', quantity: 2, unit: '个' },
  { id: uuidv4(), name: '葱花', quantity: 5, unit: '克' },
  { id: uuidv4(), name: '盐', quantity: 3, unit: '克' },
  { id: uuidv4(), name: '食用油', quantity: 15, unit: '毫升' },
];

const sampleIngredients2: Ingredient[] = [
  { id: uuidv4(), name: '土豆', quantity: 2, unit: '个' },
  { id: uuidv4(), name: '青椒', quantity: 1, unit: '个' },
  { id: uuidv4(), name: '茄子', quantity: 1, unit: '个' },
  { id: uuidv4(), name: '酱油', quantity: 20, unit: '毫升' },
  { id: uuidv4(), name: '糖', quantity: 10, unit: '克' },
];

const sampleIngredients3: Ingredient[] = [
  { id: uuidv4(), name: '五花肉', quantity: 300, unit: '克' },
  { id: uuidv4(), name: '生姜', quantity: 10, unit: '克' },
  { id: uuidv4(), name: '大葱', quantity: 20, unit: '克' },
  { id: uuidv4(), name: '八角', quantity: 2, unit: '个' },
  { id: uuidv4(), name: '冰糖', quantity: 30, unit: '克' },
];

recipes = [
  {
    id: uuidv4(),
    name: '番茄炒蛋',
    coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=delicious%20tomato%20egg%20stir%20fry%20chinese%20dish&image_size=square',
    description: '经典家常菜，酸甜可口，简单易做',
    prepTime: 10,
    cookTime: 10,
    totalTime: 20,
    difficulty: 'easy',
    servings: 2,
    ingredients: sampleIngredients1,
    steps: [
      { id: uuidv4(), order: 1, description: '鸡蛋打散，加少许盐搅拌均匀' },
      { id: uuidv4(), order: 2, description: '番茄切块，葱切葱花备用' },
      { id: uuidv4(), order: 3, description: '热锅放油，倒入蛋液炒至凝固盛出' },
      { id: uuidv4(), order: 4, description: '锅中留底油，放入番茄翻炒出汁' },
      { id: uuidv4(), order: 5, description: '加入炒好的鸡蛋，加盐调味，撒葱花出锅' },
    ],
    author: '美食达人',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    averageRating: 4.5,
    totalRatings: 128,
    tags: ['家常菜', '快手菜', '下饭菜'],
    comments: [
      {
        id: uuidv4(),
        recipeId: '',
        userId: 'u1',
        userName: '吃货小王',
        content: '超级好吃！按照步骤做出来的味道和餐馆一样',
        rating: 5,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
    ],
  },
  {
    id: uuidv4(),
    name: '地三鲜',
    coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20di%20san%20xian%20potato%20eggplant%20pepper%20dish&image_size=square',
    description: '东北经典菜，土豆茄子青椒的完美组合',
    prepTime: 15,
    cookTime: 20,
    totalTime: 35,
    difficulty: 'medium',
    servings: 3,
    ingredients: sampleIngredients2,
    steps: [
      { id: uuidv4(), order: 1, description: '土豆、茄子切滚刀块，青椒切片' },
      { id: uuidv4(), order: 2, description: '油温六成热，先下土豆炸至金黄捞出' },
      { id: uuidv4(), order: 3, description: '茄子下锅炸软，再下青椒过油一起捞出' },
      { id: uuidv4(), order: 4, description: '锅留底油，调酱汁：酱油+糖+水淀粉' },
      { id: uuidv4(), order: 5, description: '倒入所有食材翻炒均匀出锅' },
    ],
    author: '东北大厨',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    averageRating: 4.2,
    totalRatings: 86,
    tags: ['东北菜', '下饭菜', '素菜'],
    comments: [],
  },
  {
    id: uuidv4(),
    name: '红烧肉',
    coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20braised%20pork%20belly%20hongshao%20rou&image_size=square',
    description: '肥而不腻、入口即化的经典红烧肉',
    prepTime: 20,
    cookTime: 60,
    totalTime: 80,
    difficulty: 'hard',
    servings: 4,
    ingredients: sampleIngredients3,
    steps: [
      { id: uuidv4(), order: 1, description: '五花肉切块，冷水下锅焯水去血沫' },
      { id: uuidv4(), order: 2, description: '锅中放少许油，下冰糖小火炒出糖色' },
      { id: uuidv4(), order: 3, description: '放入五花肉翻炒上色，加姜葱八角' },
      { id: uuidv4(), order: 4, description: '加生抽老抽料酒，倒入开水没过肉' },
      { id: uuidv4(), order: 5, description: '大火烧开转小火炖50分钟，大火收汁即可' },
    ],
    author: '老上海厨房',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    averageRating: 4.8,
    totalRatings: 256,
    tags: ['经典菜', '宴客菜', '肉类'],
    comments: [],
  },
];

inventory = [
  { id: uuidv4(), name: '鸡蛋', quantity: 10, unit: '个', purchaseDate: past(2), expiryDate: future(20), category: '蛋类' },
  { id: uuidv4(), name: '番茄', quantity: 5, unit: '个', purchaseDate: past(3), expiryDate: future(5), category: '蔬菜' },
  { id: uuidv4(), name: '土豆', quantity: 4, unit: '个', purchaseDate: past(5), expiryDate: future(25), category: '蔬菜' },
  { id: uuidv4(), name: '茄子', quantity: 2, unit: '个', purchaseDate: past(4), expiryDate: future(2), category: '蔬菜' },
  { id: uuidv4(), name: '青椒', quantity: 3, unit: '个', purchaseDate: past(1), expiryDate: future(6), category: '蔬菜' },
  { id: uuidv4(), name: '五花肉', quantity: 500, unit: '克', purchaseDate: past(1), expiryDate: future(1), category: '肉类' },
  { id: uuidv4(), name: '盐', quantity: 500, unit: '克', purchaseDate: past(30), expiryDate: future(365), category: '调料' },
  { id: uuidv4(), name: '食用油', quantity: 2000, unit: '毫升', purchaseDate: past(60), expiryDate: future(200), category: '调料' },
  { id: uuidv4(), name: '牛奶', quantity: 500, unit: '毫升', purchaseDate: past(5), expiryDate: past(1), category: '乳制品' },
  { id: uuidv4(), name: '葱花', quantity: 100, unit: '克', purchaseDate: past(2), expiryDate: future(4), category: '蔬菜' },
  { id: uuidv4(), name: '酱油', quantity: 400, unit: '毫升', purchaseDate: past(120), expiryDate: future(200), category: '调料' },
  { id: uuidv4(), name: '糖', quantity: 300, unit: '克', purchaseDate: past(100), expiryDate: future(300), category: '调料' },
];
