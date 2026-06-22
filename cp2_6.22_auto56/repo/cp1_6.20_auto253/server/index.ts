import express, { Request, Response } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { Ingredient, RecipeDetail, RecipeSummary } from '../src/types';

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

const ingredientsData: Ingredient[] = [
  { id: uuidv4(), name: '番茄', color: '#ff5252', colorEnd: '#ff9800', emoji: '🍅' },
  { id: uuidv4(), name: '黄瓜', color: '#66bb6a', colorEnd: '#a5d6a7', emoji: '🥒' },
  { id: uuidv4(), name: '土豆', color: '#ffcc80', colorEnd: '#ffab40', emoji: '🥔' },
  { id: uuidv4(), name: '胡萝卜', color: '#ff9800', colorEnd: '#ffb74d', emoji: '🥕' },
  { id: uuidv4(), name: '洋葱', color: '#ba68c8', colorEnd: '#ce93d8', emoji: '🧅' },
  { id: uuidv4(), name: '青菜', color: '#4caf50', colorEnd: '#81c784', emoji: '🥬' },
  { id: uuidv4(), name: '茄子', color: '#7b1fa2', colorEnd: '#9c27b0', emoji: '🍆' },
  { id: uuidv4(), name: '青椒', color: '#689f38', colorEnd: '#8bc34a', emoji: '🫑' },
  { id: uuidv4(), name: '白菜', color: '#e8f5e9', colorEnd: '#c8e6c9', emoji: '🥗' },
  { id: uuidv4(), name: '菠菜', color: '#2e7d32', colorEnd: '#4caf50', emoji: '🥬' },
  { id: uuidv4(), name: '猪肉', color: '#ef5350', colorEnd: '#e57373', emoji: '🥩' },
  { id: uuidv4(), name: '牛肉', color: '#c62828', colorEnd: '#ef5350', emoji: '🥩' },
  { id: uuidv4(), name: '鸡肉', color: '#ffe082', colorEnd: '#ffd54f', emoji: '🍗' },
  { id: uuidv4(), name: '鸡蛋', color: '#fff59d', colorEnd: '#ffee58', emoji: '🥚' },
  { id: uuidv4(), name: '虾', color: '#ff7043', colorEnd: '#ff8a65', emoji: '🦐' },
  { id: uuidv4(), name: '鱼', color: '#4fc3f7', colorEnd: '#81d4fa', emoji: '🐟' },
  { id: uuidv4(), name: '米饭', color: '#fff8e1', colorEnd: '#ffecb3', emoji: '🍚' },
  { id: uuidv4(), name: '面条', color: '#fff3e0', colorEnd: '#ffe0b2', emoji: '🍜' },
  { id: uuidv4(), name: '豆腐', color: '#fafafa', colorEnd: '#eeeeee', emoji: '🧈' },
  { id: uuidv4(), name: '蘑菇', color: '#8d6e63', colorEnd: '#a1887f', emoji: '🍄' },
];

const getIngredientById = (id: string): Ingredient | undefined => {
  return ingredientsData.find(ing => ing.id === id);
};

const recipesData: RecipeDetail[] = [
  {
    id: uuidv4(),
    name: '番茄炒蛋',
    description: '经典家常菜，酸甜可口，营养丰富',
    ingredients: [
      { id: ingredientsData.find(i => i.name === '番茄')!.id, name: '番茄', required: true, quantity: '2个' },
      { id: ingredientsData.find(i => i.name === '鸡蛋')!.id, name: '鸡蛋', required: true, quantity: '3个' },
    ],
    cookTime: 15,
    calories: 280,
    difficulty: 1,
    servings: 2,
    steps: [
      { stepNumber: 1, description: '番茄洗净切块，鸡蛋打散加入少许盐搅匀', duration: 5 },
      { stepNumber: 2, description: '热锅倒油，油温七成热时倒入蛋液，快速翻炒至凝固盛出', duration: 3 },
      { stepNumber: 3, description: '锅中再加少许油，放入番茄块翻炒至出汁', duration: 4 },
      { stepNumber: 4, description: '加入炒好的鸡蛋，加盐、糖调味，翻炒均匀即可出锅', duration: 3, tips: '糖可以中和番茄的酸味，让味道更鲜美' },
    ],
  },
  {
    id: uuidv4(),
    name: '酸辣土豆丝',
    description: '爽脆可口，酸辣开胃的经典下饭菜',
    ingredients: [
      { id: ingredientsData.find(i => i.name === '土豆')!.id, name: '土豆', required: true, quantity: '2个' },
      { id: ingredientsData.find(i => i.name === '青椒')!.id, name: '青椒', required: false, quantity: '1个' },
    ],
    cookTime: 20,
    calories: 220,
    difficulty: 2,
    servings: 2,
    steps: [
      { stepNumber: 1, description: '土豆去皮切成细丝，用清水浸泡去淀粉', duration: 8 },
      { stepNumber: 2, description: '青椒切丝备用，准备好醋、干辣椒、花椒', duration: 2 },
      { stepNumber: 3, description: '热锅倒油，爆香干辣椒和花椒，捞出花椒', duration: 2 },
      { stepNumber: 4, description: '倒入沥干的土豆丝大火快炒，加醋、盐调味', duration: 5 },
      { stepNumber: 5, description: '最后加入青椒丝翻炒均匀即可', duration: 3, tips: '土豆丝要切细匀，泡水去淀粉才能炒得爽脆' },
    ],
  },
  {
    id: uuidv4(),
    name: '红烧茄子',
    description: '软糯入味，酱香浓郁的下饭菜',
    ingredients: [
      { id: ingredientsData.find(i => i.name === '茄子')!.id, name: '茄子', required: true, quantity: '2根' },
      { id: ingredientsData.find(i => i.name === '猪肉')!.id, name: '猪肉', required: false, quantity: '100g' },
    ],
    cookTime: 25,
    calories: 350,
    difficulty: 2,
    servings: 3,
    steps: [
      { stepNumber: 1, description: '茄子切滚刀块，撒盐腌制10分钟挤出水分', duration: 15 },
      { stepNumber: 2, description: '猪肉切末，准备好葱姜蒜、生抽、老抽、糖', duration: 2 },
      { stepNumber: 3, description: '热锅倒油，放入茄子煎至金黄变软盛出', duration: 5 },
      { stepNumber: 4, description: '锅中留底油，炒香肉末，加葱姜蒜爆香', duration: 3 },
      { stepNumber: 5, description: '倒入茄子，加生抽、老抽、糖、水，焖煮5分钟收汁', duration: 5, tips: '茄子用盐腌制后能减少吸油量，更加健康' },
    ],
  },
  {
    id: uuidv4(),
    name: '青椒肉丝',
    description: '鲜香嫩滑，荤素搭配的经典家常菜',
    ingredients: [
      { id: ingredientsData.find(i => i.name === '猪肉')!.id, name: '猪肉', required: true, quantity: '200g' },
      { id: ingredientsData.find(i => i.name === '青椒')!.id, name: '青椒', required: true, quantity: '3个' },
    ],
    cookTime: 20,
    calories: 320,
    difficulty: 2,
    servings: 2,
    steps: [
      { stepNumber: 1, description: '猪肉切丝，用生抽、料酒、淀粉腌制10分钟', duration: 15 },
      { stepNumber: 2, description: '青椒去籽切丝，准备好葱姜蒜末', duration: 3 },
      { stepNumber: 3, description: '热锅倒油，滑炒肉丝至变色盛出', duration: 3 },
      { stepNumber: 4, description: '锅中留底油，爆香葱姜蒜，放入青椒丝翻炒', duration: 3 },
      { stepNumber: 5, description: '倒入肉丝，加盐、生抽调味，翻炒均匀即可', duration: 4, tips: '肉丝要顺着纹理切，腌制后更嫩滑' },
    ],
  },
  {
    id: uuidv4(),
    name: '麻婆豆腐',
    description: '麻辣鲜香，嫩滑入味的川菜经典',
    ingredients: [
      { id: ingredientsData.find(i => i.name === '豆腐')!.id, name: '豆腐', required: true, quantity: '1块' },
      { id: ingredientsData.find(i => i.name === '猪肉')!.id, name: '猪肉', required: false, quantity: '50g' },
    ],
    cookTime: 20,
    calories: 290,
    difficulty: 2,
    servings: 3,
    steps: [
      { stepNumber: 1, description: '豆腐切小块，用盐水浸泡5分钟后焯水', duration: 10 },
      { stepNumber: 2, description: '猪肉切末，准备好豆瓣酱、花椒粉、葱花', duration: 3 },
      { stepNumber: 3, description: '热锅倒油，炒香肉末，加入豆瓣酱炒出红油', duration: 3 },
      { stepNumber: 4, description: '加入适量水，放入豆腐，小火咕嘟3分钟', duration: 5 },
      { stepNumber: 5, description: '水淀粉勾芡，撒花椒粉、葱花即可', duration: 4, tips: '豆腐要轻推，不要翻炒，否则容易碎' },
    ],
  },
  {
    id: uuidv4(),
    name: '红烧肉',
    description: '肥而不腻，入口即化的经典硬菜',
    ingredients: [
      { id: ingredientsData.find(i => i.name === '猪肉')!.id, name: '猪肉', required: true, quantity: '500g' },
    ],
    cookTime: 90,
    calories: 680,
    difficulty: 3,
    servings: 4,
    steps: [
      { stepNumber: 1, description: '五花肉切块，冷水下锅焯水去血沫', duration: 15 },
      { stepNumber: 2, description: '准备好冰糖、生抽、老抽、料酒、八角、桂皮、香叶', duration: 3 },
      { stepNumber: 3, description: '锅中少许油，放入冰糖小火炒出糖色', duration: 5 },
      { stepNumber: 4, description: '倒入肉块翻炒上色，加葱姜、香料、料酒爆香', duration: 5 },
      { stepNumber: 5, description: '加生抽、老抽、水没过肉块，大火烧开转小火炖60分钟', duration: 70 },
      { stepNumber: 6, description: '大火收汁，汤汁浓稠包裹肉块即可', duration: 10, tips: '糖色要小火慢炒，看到大泡变小泡时马上放肉' },
    ],
  },
  {
    id: uuidv4(),
    name: '宫保鸡丁',
    description: '酸甜微辣，嫩滑可口的川菜代表',
    ingredients: [
      { id: ingredientsData.find(i => i.name === '鸡肉')!.id, name: '鸡肉', required: true, quantity: '300g' },
      { id: ingredientsData.find(i => i.name === '黄瓜')!.id, name: '黄瓜', required: false, quantity: '1根' },
      { id: ingredientsData.find(i => i.name === '胡萝卜')!.id, name: '胡萝卜', required: false, quantity: '半根' },
    ],
    cookTime: 25,
    calories: 380,
    difficulty: 2,
    servings: 3,
    steps: [
      { stepNumber: 1, description: '鸡肉切丁，用生抽、料酒、淀粉腌制15分钟', duration: 20 },
      { stepNumber: 2, description: '黄瓜、胡萝卜切丁，准备好花生米、干辣椒、花椒', duration: 3 },
      { stepNumber: 3, description: '调碗汁：生抽、醋、糖、淀粉、水搅匀', duration: 2 },
      { stepNumber: 4, description: '热锅倒油，滑炒鸡丁至变色盛出', duration: 3 },
      { stepNumber: 5, description: '锅中留底油，爆香干辣椒、花椒，放蔬菜丁翻炒', duration: 3 },
      { stepNumber: 6, description: '倒入鸡丁和碗汁，大火翻炒收汁，加花生米拌匀', duration: 4, tips: '最后加花生米保持酥脆口感' },
    ],
  },
  {
    id: uuidv4(),
    name: '鱼香肉丝',
    description: '鱼香味浓，酸甜咸辣的经典下饭菜',
    ingredients: [
      { id: ingredientsData.find(i => i.name === '猪肉')!.id, name: '猪肉', required: true, quantity: '250g' },
      { id: ingredientsData.find(i => i.name === '胡萝卜')!.id, name: '胡萝卜', required: false, quantity: '半根' },
      { id: ingredientsData.find(i => i.name === '青椒')!.id, name: '青椒', required: false, quantity: '1个' },
      { id: ingredientsData.find(i => i.name === '蘑菇')!.id, name: '蘑菇', required: false, quantity: '适量' },
    ],
    cookTime: 25,
    calories: 340,
    difficulty: 2,
    servings: 3,
    steps: [
      { stepNumber: 1, description: '猪肉切丝，用生抽、料酒、淀粉腌制10分钟', duration: 15 },
      { stepNumber: 2, description: '胡萝卜、青椒切丝，木耳泡发切丝', duration: 3 },
      { stepNumber: 3, description: '调鱼香汁：生抽、醋、糖、豆瓣酱、淀粉、水搅匀', duration: 2 },
      { stepNumber: 4, description: '热锅倒油，滑炒肉丝至变色盛出', duration: 3 },
      { stepNumber: 5, description: '锅中留底油，爆香葱姜蒜末，放蔬菜丝翻炒', duration: 3 },
      { stepNumber: 6, description: '倒入肉丝和鱼香汁，大火翻炒均匀即可', duration: 4, tips: '鱼香汁比例很重要，糖醋比例1:1最佳' },
    ],
  },
  {
    id: uuidv4(),
    name: '番茄蛋汤',
    description: '清爽可口，营养丰富的家常汤品',
    ingredients: [
      { id: ingredientsData.find(i => i.name === '番茄')!.id, name: '番茄', required: true, quantity: '2个' },
      { id: ingredientsData.find(i => i.name === '鸡蛋')!.id, name: '鸡蛋', required: true, quantity: '2个' },
    ],
    cookTime: 15,
    calories: 150,
    difficulty: 1,
    servings: 3,
    steps: [
      { stepNumber: 1, description: '番茄洗净切块，鸡蛋打散', duration: 3 },
      { stepNumber: 2, description: '热锅倒油，放入番茄块翻炒至出汁', duration: 4 },
      { stepNumber: 3, description: '加入适量清水，大火烧开转中火煮5分钟', duration: 6 },
      { stepNumber: 4, description: '淋入蛋液，形成蛋花，加盐、葱花调味即可', duration: 2, tips: '蛋液要慢慢淋入，边淋边轻轻推动汤' },
    ],
  },
  {
    id: uuidv4(),
    name: '蛋炒饭',
    description: '粒粒分明，香飘四溢的经典主食',
    ingredients: [
      { id: ingredientsData.find(i => i.name === '米饭')!.id, name: '米饭', required: true, quantity: '2碗' },
      { id: ingredientsData.find(i => i.name === '鸡蛋')!.id, name: '鸡蛋', required: true, quantity: '2个' },
      { id: ingredientsData.find(i => i.name === '胡萝卜')!.id, name: '胡萝卜', required: false, quantity: '小半根' },
    ],
    cookTime: 15,
    calories: 450,
    difficulty: 1,
    servings: 2,
    steps: [
      { stepNumber: 1, description: '米饭用隔夜饭最佳，提前打散，鸡蛋打散', duration: 2 },
      { stepNumber: 2, description: '胡萝卜切丁，准备好葱花', duration: 2 },
      { stepNumber: 3, description: '热锅倒油，倒入蛋液快速炒散盛出', duration: 2 },
      { stepNumber: 4, description: '锅中再加少许油，放入胡萝卜丁翻炒', duration: 2 },
      { stepNumber: 5, description: '倒入米饭大火翻炒至粒粒分明', duration: 5 },
      { stepNumber: 6, description: '加入炒好的鸡蛋，加盐调味，撒葱花炒匀即可', duration: 2, tips: '隔夜饭水分少，更容易炒出粒粒分明的效果' },
    ],
  },
  {
    id: uuidv4(),
    name: '炒面',
    description: '劲道爽滑，配料丰富的家常面食',
    ingredients: [
      { id: ingredientsData.find(i => i.name === '面条')!.id, name: '面条', required: true, quantity: '300g' },
      { id: ingredientsData.find(i => i.name === '鸡蛋')!.id, name: '鸡蛋', required: false, quantity: '2个' },
      { id: ingredientsData.find(i => i.name === '青菜')!.id, name: '青菜', required: false, quantity: '适量' },
    ],
    cookTime: 20,
    calories: 480,
    difficulty: 2,
    servings: 2,
    steps: [
      { stepNumber: 1, description: '面条煮至八分熟，捞出过凉水沥干', duration: 8 },
      { stepNumber: 2, description: '鸡蛋打散，青菜洗净切段', duration: 3 },
      { stepNumber: 3, description: '热锅倒油，倒入蛋液炒散盛出', duration: 2 },
      { stepNumber: 4, description: '锅中留底油，放入青菜翻炒至断生', duration: 2 },
      { stepNumber: 5, description: '倒入面条和鸡蛋，加生抽、老抽、盐调味', duration: 5, tips: '面条过凉水后更劲道，不容易粘锅' },
    ],
  },
  {
    id: uuidv4(),
    name: '清炒时蔬',
    description: '清淡健康，保留食材本味的素菜',
    ingredients: [
      { id: ingredientsData.find(i => i.name === '青菜')!.id, name: '青菜', required: true, quantity: '300g' },
    ],
    cookTime: 10,
    calories: 80,
    difficulty: 1,
    servings: 2,
    steps: [
      { stepNumber: 1, description: '青菜洗净，沥干水分', duration: 3 },
      { stepNumber: 2, description: '准备好蒜末，热锅热油', duration: 2 },
      { stepNumber: 3, description: '爆香蒜末，放入青菜大火快炒', duration: 4 },
      { stepNumber: 4, description: '加盐调味，翻炒均匀即可出锅', duration: 1, tips: '大火快炒才能保持青菜翠绿脆嫩' },
    ],
  },
  {
    id: uuidv4(),
    name: '蒜蓉菠菜',
    description: '蒜香浓郁，营养丰富的绿叶蔬菜',
    ingredients: [
      { id: ingredientsData.find(i => i.name === '菠菜')!.id, name: '菠菜', required: true, quantity: '300g' },
    ],
    cookTime: 12,
    calories: 90,
    difficulty: 1,
    servings: 2,
    steps: [
      { stepNumber: 1, description: '菠菜洗净切段，准备好蒜末', duration: 3 },
      { stepNumber: 2, description: '烧开水，菠菜焯水30秒去草酸，捞出挤干水分', duration: 3 },
      { stepNumber: 3, description: '热锅倒油，爆香一半蒜末', duration: 2 },
      { stepNumber: 4, description: '放入菠菜翻炒，加盐、剩下的蒜末炒匀即可', duration: 4, tips: '菠菜一定要焯水去除草酸，口感更好更健康' },
    ],
  },
  {
    id: uuidv4(),
    name: '蘑菇炖鸡',
    description: '鲜香浓郁，营养滋补的炖汤',
    ingredients: [
      { id: ingredientsData.find(i => i.name === '鸡肉')!.id, name: '鸡肉', required: true, quantity: '500g' },
      { id: ingredientsData.find(i => i.name === '蘑菇')!.id, name: '蘑菇', required: true, quantity: '200g' },
    ],
    cookTime: 60,
    calories: 420,
    difficulty: 3,
    servings: 4,
    steps: [
      { stepNumber: 1, description: '鸡肉切块，冷水下锅焯水去血沫', duration: 15 },
      { stepNumber: 2, description: '蘑菇洗净撕成小朵，准备好葱姜、料酒', duration: 5 },
      { stepNumber: 3, description: '砂锅加水，放入鸡块、葱姜、料酒，大火烧开转小火炖30分钟', duration: 35 },
      { stepNumber: 4, description: '加入蘑菇继续炖20分钟', duration: 25 },
      { stepNumber: 5, description: '加盐、胡椒粉调味即可', duration: 5, tips: '炖汤要一次加足水，中途加水会影响汤的鲜味' },
    ],
  },
  {
    id: uuidv4(),
    name: '紫菜蛋花汤',
    description: '清淡鲜美，快手暖胃的汤品',
    ingredients: [
      { id: ingredientsData.find(i => i.name === '鸡蛋')!.id, name: '鸡蛋', required: true, quantity: '2个' },
    ],
    cookTime: 10,
    calories: 120,
    difficulty: 1,
    servings: 3,
    steps: [
      { stepNumber: 1, description: '鸡蛋打散，准备好紫菜、葱花', duration: 2 },
      { stepNumber: 2, description: '锅中加水烧开，放入紫菜煮1分钟', duration: 3 },
      { stepNumber: 3, description: '淋入蛋液形成蛋花，加盐、香油调味', duration: 3 },
      { stepNumber: 4, description: '关火撒葱花即可', duration: 2, tips: '紫菜要提前洗去沙子，口感更好' },
    ],
  },
];

const ingredientsMap = new Map<string, Ingredient>();
ingredientsData.forEach(ing => ingredientsMap.set(ing.id, ing));

const recipesMap = new Map<string, RecipeDetail>();
recipesData.forEach(recipe => recipesMap.set(recipe.id, recipe));

const calculateMatchScore = (recipe: RecipeDetail, selectedIngredients: string[]): number => {
  const requiredIngredients = recipe.ingredients.filter(ing => ing.required);
  if (requiredIngredients.length === 0) return 0;
  
  const matchedRequired = requiredIngredients.filter(
    ing => selectedIngredients.includes(ing.id)
  ).length;
  
  return Math.round((matchedRequired / requiredIngredients.length) * 100);
};

app.get('/api/ingredients', (_req: Request, res: Response) => {
  res.json(ingredientsData);
});

app.post('/api/recipes', (req: Request, res: Response) => {
  const { ingredients } = req.body as { ingredients: string[] };
  
  if (!Array.isArray(ingredients)) {
    return res.status(400).json({ error: 'Ingredients must be an array' });
  }
  
  const recipesWithScore: { recipe: RecipeDetail; score: number }[] = [];
  
  recipesData.forEach(recipe => {
    const score = calculateMatchScore(recipe, ingredients);
    if (score >= 50) {
      recipesWithScore.push({ recipe, score });
    }
  });
  
  recipesWithScore.sort((a, b) => b.score - a.score);
  
  const topRecipes: RecipeSummary[] = recipesWithScore.slice(0, 6).map(({ recipe, score }) => ({
    id: recipe.id,
    name: recipe.name,
    ingredients: recipe.ingredients.map(ing => ({
      id: ing.id,
      name: ing.name,
      required: ing.required,
    })),
    cookTime: recipe.cookTime,
    calories: recipe.calories,
    difficulty: recipe.difficulty,
    matchScore: score,
  }));
  
  res.json(topRecipes);
});

app.get('/api/recipe/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const recipe = recipesMap.get(id);
  
  if (!recipe) {
    return res.status(404).json({ error: 'Recipe not found' });
  }
  
  res.json(recipe);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export { getIngredientById };
