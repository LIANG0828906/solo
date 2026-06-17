import { v4 as uuidv4 } from 'uuid';
import { Recipe, Ingredient, User } from '../shared/types';

const mockUsers: User[] = [
  { id: 'u1', name: '美食家小王', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix' },
  { id: 'u2', name: '厨房达人小李', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka' },
  { id: 'u3', name: '烘焙爱好者', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna' },
  { id: 'u4', name: '创意主厨', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Milo' },
];

function makeIngredients(list: Array<[string, string]>): Ingredient[] {
  return list.map(([name, amount]) => {
    let category: Ingredient['category'] = 'other';
    const n = name.toLowerCase();
    if (['猪肉', '牛肉', '鸡肉', '羊肉', '鱼肉', '虾', '鸡蛋', '培根', '排骨'].some(k => n.includes(k))) category = 'meat';
    else if (['盐', '糖', '酱油', '醋', '料酒', '生抽', '老抽', '蚝油', '鸡精', '花椒', '八角', '香油', '淀粉', '橄榄油'].some(k => n.includes(k))) category = 'seasoning';
    else if (['白菜', '青菜', '番茄', '西红柿', '土豆', '胡萝卜', '黄瓜', '茄子', '辣椒', '青椒', '洋葱', '大蒜', '葱', '姜', '蘑菇', '香菇', '菠菜', '西兰花', '玉米', '豆角', '豆腐'].some(k => n.includes(k))) category = 'vegetable';
    return { name, amount, category };
  });
}

const mockRecipesData: Omit<Recipe, 'id' | 'createdAt'>[] = [
  {
    title: '红烧牛肉',
    description: '软糯入味的经典家常菜，配米饭一绝',
    image: 'https://images.unsplash.com/photo-1546549032-9571cd6b27df?w=800&q=80',
    ingredients: makeIngredients([
      ['牛肉', '500g'], ['土豆', '2个'], ['胡萝卜', '1根'], ['洋葱', '半个'],
      ['葱', '适量'], ['姜', '3片'], ['大蒜', '5瓣'], ['八角', '2个'],
      ['生抽', '2勺'], ['老抽', '1勺'], ['料酒', '2勺'], ['糖', '1勺']
    ]),
    steps: ['牛肉切块焯水去血沫捞出沥干', '锅中热油，爆香葱姜蒜八角', '放入牛肉翻炒至表面微黄', '加入生抽老抽调色', '加水没过牛肉，大火烧开转小火炖1小时', '加入土豆胡萝卜块，继续炖20分钟', '大火收汁即可出锅'],
    author: mockUsers[0],
    likes: 256,
    views: 1892
  },
  {
    title: '蒜蓉西兰花炒虾仁',
    description: '清爽健康的减脂餐，高蛋白低脂肪',
    image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&q=80',
    ingredients: makeIngredients([
      ['西兰花', '1颗'], ['虾', '300g'], ['大蒜', '8瓣'],
      ['盐', '适量'], ['生抽', '1勺'], ['料酒', '1勺'], ['淀粉', '少许'], ['橄榄油', '适量']
    ]),
    steps: ['虾去壳去虾线，用料酒淀粉腌制10分钟', '西兰花切小朵，焯水30秒捞出过凉', '锅中热油爆香蒜末', '放入虾仁翻炒至变色', '加入西兰花翻炒均匀', '加盐生抽调味，出锅装盘'],
    author: mockUsers[1],
    likes: 189,
    views: 1203
  },
  {
    title: '番茄鸡蛋面',
    description: '十分钟快手早餐，温暖一整天',
    image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80',
    ingredients: makeIngredients([
      ['番茄', '2个'], ['鸡蛋', '3个'], ['面条', '一人份'],
      ['葱', '1根'], ['盐', '适量'], ['糖', '半勺'], ['生抽', '1勺'], ['香油', '几滴']
    ]),
    steps: ['番茄去皮切块，鸡蛋打散', '锅中热油炒鸡蛋，凝固后盛出', '另起锅炒番茄出沙', '加入两碗水烧开', '放入面条煮熟', '加入炒好的鸡蛋，盐糖生抽调味', '撒葱花滴香油出锅'],
    author: mockUsers[2],
    likes: 512,
    views: 3421
  },
  {
    title: '糖醋里脊',
    description: '酸甜可口外酥里嫩，小朋友最爱',
    image: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=800&q=80',
    ingredients: makeIngredients([
      ['猪里脊', '300g'], ['淀粉', '50g'], ['面粉', '30g'], ['鸡蛋', '1个'],
      ['番茄酱', '3勺'], ['糖', '2勺'], ['醋', '2勺'], ['生抽', '1勺'], ['料酒', '1勺']
    ]),
    steps: ['里脊切条，加料酒生抽腌制15分钟', '淀粉面粉加鸡蛋调成糊', '里脊裹糊炸至金黄捞出', '升高油温复炸30秒更酥脆', '锅中调糖醋汁烧开', '倒入炸好的里脊快速翻匀出锅'],
    author: mockUsers[3],
    likes: 423,
    views: 2756
  },
  {
    title: '麻婆豆腐',
    description: '麻辣鲜香的川菜经典，超级下饭',
    image: 'https://images.unsplash.com/photo-1582452919619-56e0fbde7e7e?w=800&q=80',
    ingredients: makeIngredients([
      ['豆腐', '1块'], ['猪肉末', '100g'], ['豆瓣酱', '2勺'], ['花椒', '适量'],
      ['葱', '适量'], ['姜', '适量'], ['大蒜', '适量'], ['生抽', '1勺'], ['淀粉', '适量']
    ]),
    steps: ['豆腐切块焯水备用', '锅中炒肉末至变色', '加豆瓣酱炒出红油', '加姜蒜末爆香', '加水放入豆腐烧开', '小火烧5分钟入味', '水淀粉勾芡撒花椒葱花'],
    author: mockUsers[0],
    likes: 367,
    views: 2108
  },
  {
    title: '可乐鸡翅',
    description: '零失败的新手菜，甜香浓郁',
    image: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=800&q=80',
    ingredients: makeIngredients([
      ['鸡翅', '8个'], ['可乐', '1罐'], ['生抽', '2勺'], ['老抽', '1勺'],
      ['料酒', '2勺'], ['葱', '适量'], ['姜', '3片']
    ]),
    steps: ['鸡翅两面划刀，加料酒焯水', '锅中煎至两面金黄', '加入葱姜生抽老抽', '倒入可乐没过鸡翅', '大火烧开转小火20分钟', '大火收汁即可'],
    author: mockUsers[1],
    likes: 298,
    views: 1765
  },
  {
    title: '宫保鸡丁',
    description: '香辣微甜，花生酥脆的经典川菜',
    image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800&q=80',
    ingredients: makeIngredients([
      ['鸡肉', '300g'], ['花生', '50g'], ['干辣椒', '10个'], ['花椒', '1勺'],
      ['黄瓜', '1根'], ['葱', '适量'], ['姜', '适量'], ['大蒜', '适量'],
      ['生抽', '2勺'], ['醋', '1勺'], ['糖', '1勺'], ['淀粉', '适量']
    ]),
    steps: ['鸡肉切丁加料酒淀粉腌制', '调碗汁：生抽糖醋淀粉水', '锅中爆香干辣椒花椒', '下鸡丁炒至变色', '加葱姜蒜翻炒', '倒入碗汁快速翻炒', '加黄瓜丁和花生出锅'],
    author: mockUsers[2],
    likes: 385,
    views: 2341
  },
  {
    title: '鱼香肉丝',
    description: '酸甜咸辣均衡，鱼香味十足',
    image: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=800&q=80',
    ingredients: makeIngredients([
      ['猪肉', '250g'], ['胡萝卜', '1根'], ['木耳', '适量'], ['青椒', '1个'],
      ['豆瓣酱', '1勺'], ['生抽', '2勺'], ['醋', '2勺'], ['糖', '2勺'],
      ['淀粉', '适量'], ['葱', '适量'], ['姜', '适量'], ['大蒜', '适量']
    ]),
    steps: ['猪肉切丝加淀粉腌制', '调碗汁：生抽糖醋淀粉水', '锅中炒肉丝盛出', '爆香豆瓣酱葱姜蒜', '下胡萝卜木耳青椒丝', '倒碗汁和肉丝翻炒均匀出锅'],
    author: mockUsers[3],
    likes: 312,
    views: 1987
  },
  {
    title: '清蒸鲈鱼',
    description: '鲜嫩滑口的粤式经典，最大程度保留鱼的鲜味',
    image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&q=80',
    ingredients: makeIngredients([
      ['鲈鱼', '1条'], ['葱', '适量'], ['姜', '适量'], ['蒸鱼豉油', '3勺'],
      ['料酒', '1勺'], ['香油', '适量']
    ]),
    steps: ['鲈鱼处理干净两面划刀', '鱼身抹料酒，放葱姜丝', '水开后上锅蒸8分钟', '取出倒掉汤汁，铺新葱丝', '淋蒸鱼豉油', '热油浇在葱丝上，滴几滴香油'],
    author: mockUsers[0],
    likes: 445,
    views: 2890
  },
  {
    title: '红烧肉',
    description: '肥而不腻入口即化，传统家常版本',
    image: 'https://images.unsplash.com/photo-1625938144755-652e08e359b7?w=800&q=80',
    ingredients: makeIngredients([
      ['猪肉', '600g'], ['冰糖', '30g'], ['生抽', '3勺'], ['老抽', '1勺'],
      ['料酒', '3勺'], ['八角', '2个'], ['桂皮', '1块'], ['香叶', '2片'],
      ['葱', '适量'], ['姜', '适量']
    ]),
    steps: ['五花肉切块焯水', '锅中炒糖色至枣红色', '下肉块翻炒上色', '加葱姜八角桂皮香叶', '加料酒生抽老抽', '加热水没过肉', '小火炖1小时，大火收汁'],
    author: mockUsers[1],
    likes: 567,
    views: 3521
  },
  {
    title: '干煸四季豆',
    description: '香辣入味，越嚼越香的川菜',
    image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&q=80',
    ingredients: makeIngredients([
      ['豆角', '400g'], ['猪肉末', '80g'], ['干辣椒', '8个'], ['花椒', '1勺'],
      ['豆瓣酱', '1勺'], ['大蒜', '5瓣'], ['生抽', '1勺'], ['盐', '适量']
    ]),
    steps: ['豆角洗净掰段，晾干水分', '油炸至皮皱捞出沥油', '锅中炒肉末', '加豆瓣酱干辣椒花椒蒜末', '倒入豆角翻炒', '加生抽盐调味出锅'],
    author: mockUsers[2],
    likes: 234,
    views: 1543
  },
  {
    title: '蛋炒饭',
    description: '粒粒分明金黄诱人，剩饭秒变美味',
    image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&q=80',
    ingredients: makeIngredients([
      ['米饭', '2碗'], ['鸡蛋', '2个'], ['葱', '适量'], ['火腿', '50g'],
      ['青豆', '30g'], ['玉米', '30g'], ['盐', '适量'], ['生抽', '半勺']
    ]),
    steps: ['鸡蛋打散倒入米饭拌匀', '火腿切丁，青豆玉米焯水', '锅中炒蛋炒饭至粒粒分明', '加火腿丁青豆玉米翻炒', '加盐生抽调味', '撒葱花出锅'],
    author: mockUsers[3],
    likes: 623,
    views: 4120
  }
];

let recipesDB: Recipe[] = mockRecipesData.map(r => ({
  ...r,
  id: uuidv4(),
  createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
}));

function delay<T>(data: T, ms: number = 200): Promise<T> {
  return new Promise(resolve => setTimeout(() => resolve(data), ms));
}

export async function getRecipes(): Promise<Recipe[]> {
  return delay([...recipesDB]);
}

export async function getRecipeById(id: string): Promise<Recipe | null> {
  const recipe = recipesDB.find(r => r.id === id) || null;
  if (recipe) {
    recipe.views += 1;
  }
  return delay(recipe ? { ...recipe } : null, 150);
}

export async function searchRecipes(keyword: string): Promise<Recipe[]> {
  if (!keyword.trim()) return delay([]);
  const lower = keyword.toLowerCase();
  const results = recipesDB.filter(r => {
    const titleMatch = r.title.toLowerCase().includes(lower);
    const descMatch = r.description.toLowerCase().includes(lower);
    const ingredientMatch = r.ingredients.some(i => i.name.toLowerCase().includes(lower));
    return titleMatch || descMatch || ingredientMatch;
  });
  return delay(results.slice(0, 8), 100);
}

export interface CreateRecipeInput {
  title: string;
  description: string;
  image: string;
  ingredients: Ingredient[];
  steps: string[];
}

export async function createRecipe(input: CreateRecipeInput): Promise<Recipe> {
  const newRecipe: Recipe = {
    id: uuidv4(),
    title: input.title,
    description: input.description,
    image: input.image,
    ingredients: input.ingredients,
    steps: input.steps,
    author: mockUsers[Math.floor(Math.random() * mockUsers.length)],
    likes: 0,
    views: 0,
    createdAt: new Date().toISOString()
  };
  recipesDB = [newRecipe, ...recipesDB];
  return delay(newRecipe, 300);
}

export async function incrementRecipeLikes(id: string): Promise<boolean> {
  const recipe = recipesDB.find(r => r.id === id);
  if (recipe) {
    recipe.likes += 1;
    return delay(true, 50);
  }
  return delay(false, 50);
}
