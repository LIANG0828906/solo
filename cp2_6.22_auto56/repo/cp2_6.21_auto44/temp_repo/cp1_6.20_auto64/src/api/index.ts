export type Category = '蔬菜' | '水果' | '肉类' | '乳制品' | '调料';
export type Unit = '克' | '个' | '盒';

export interface Item {
  id: string;
  name: string;
  category: Category;
  quantity: number;
  unit: Unit;
  purchaseDate: string;
  shelfLifeDays: number;
  createdAt: string;
}

export interface Stats {
  total: number;
  expiringSoon: number;
  expired: number;
  todayAdded: number;
}

export interface Recipe {
  name: string;
  ingredients: string[];
  steps: string;
}

const BASE_URL = '/api';

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '请求失败' }));
    throw new Error(error.error || '请求失败');
  }
  return response.json();
};

export const getItems = async (): Promise<Item[]> => {
  const response = await fetch(`${BASE_URL}/items`);
  return handleResponse<Item[]>(response);
};

export const getItemById = async (id: string): Promise<Item> => {
  const response = await fetch(`${BASE_URL}/items/${id}`);
  return handleResponse<Item>(response);
};

export const addItem = async (item: Omit<Item, 'id' | 'createdAt'>): Promise<Item> => {
  const response = await fetch(`${BASE_URL}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  return handleResponse<Item>(response);
};

export const updateItem = async (id: string, data: Partial<Item>): Promise<Item> => {
  const response = await fetch(`${BASE_URL}/items/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse<Item>(response);
};

export const deleteItem = async (id: string): Promise<{ message: string }> => {
  const response = await fetch(`${BASE_URL}/items/${id}`, {
    method: 'DELETE',
  });
  return handleResponse<{ message: string }>(response);
};

export const getStats = async (): Promise<Stats> => {
  const response = await fetch(`${BASE_URL}/stats`);
  return handleResponse<Stats>(response);
};

const RECIPE_RULES: { name: string; ingredients: string[]; steps: string }[] = [
  {
    name: '番茄炒蛋',
    ingredients: ['西红柿', '番茄', '鸡蛋'],
    steps: '1. 西红柿切块，鸡蛋打散；2. 热油炒鸡蛋至凝固盛出；3. 炒西红柿出汁，加入鸡蛋翻炒；4. 加盐调味出锅。',
  },
  {
    name: '青椒肉丝',
    ingredients: ['青椒', '猪肉', '肉'],
    steps: '1. 猪肉切丝用淀粉腌制，青椒切丝；2. 热油滑炒肉丝变色盛出；3. 炒青椒，加入肉丝；4. 加生抽、盐调味。',
  },
  {
    name: '蒜蓉西兰花',
    ingredients: ['西兰花', '蒜'],
    steps: '1. 西兰花切小朵焯水；2. 蒜末爆香；3. 加入西兰花翻炒；4. 加盐和少许蚝油出锅。',
  },
  {
    name: '土豆丝',
    ingredients: ['土豆', '青椒'],
    steps: '1. 土豆和青椒切丝，土豆丝泡水去淀粉；2. 热油爆香花椒；3. 下土豆丝大火快炒；4. 加青椒丝、醋、盐翻炒出锅。',
  },
  {
    name: '红烧肉',
    ingredients: ['猪肉', '五花肉', '肉', '糖'],
    steps: '1. 五花肉切块焯水；2. 炒糖色至枣红色；3. 下肉块翻炒上色；4. 加生抽、老抽、水炖40分钟收汁。',
  },
  {
    name: '水果沙拉',
    ingredients: ['苹果', '香蕉', '草莓', '蓝莓', '橙子', '酸奶', '牛奶'],
    steps: '1. 各种水果切块；2. 淋上酸奶或沙拉酱；3. 拌匀即可食用。',
  },
  {
    name: '炒青菜',
    ingredients: ['青菜', '小白菜', '生菜', '油麦菜', '菠菜', '蒜'],
    steps: '1. 青菜洗净沥干；2. 蒜末爆香；3. 下青菜大火快炒；4. 加盐调味出锅。',
  },
  {
    name: '煎蛋',
    ingredients: ['鸡蛋'],
    steps: '1. 热油；2. 打入鸡蛋；3. 煎至喜欢的熟度；4. 撒少许盐即可。',
  },
  {
    name: '凉拌黄瓜',
    ingredients: ['黄瓜', '蒜'],
    steps: '1. 黄瓜拍碎切段；2. 加盐腌出水分倒掉；3. 加蒜末、生抽、醋、香油拌匀；4. 冷藏半小时更入味。',
  },
  {
    name: '麻婆豆腐',
    ingredients: ['豆腐', '猪肉', '豆瓣酱'],
    steps: '1. 豆腐切块焯水；2. 肉末炒香加豆瓣酱炒出红油；3. 加水放入豆腐；4. 勾芡撒花椒粉出锅。',
  },
];

export const generateRecipes = (items: Item[]): Recipe[] => {
  const nonExpiredItems = items.filter((item) => {
    const purchase = new Date(item.purchaseDate);
    const expiry = new Date(purchase);
    expiry.setDate(expiry.getDate() + item.shelfLifeDays);
    return expiry >= new Date();
  });

  const ingredientNames = nonExpiredItems.map((i) => i.name);

  const matchedRecipes: Recipe[] = [];

  for (const rule of RECIPE_RULES) {
    if (matchedRecipes.length >= 3) break;

    const matchCount = rule.ingredients.filter((ing) =>
      ingredientNames.some((name) => name.includes(ing) || ing.includes(name))
    ).length;

    if (matchCount >= 1 && (matchCount / rule.ingredients.length >= 0.5 || matchCount >= 2)) {
      const usedIngredients = rule.ingredients.filter((ing) =>
        ingredientNames.some((name) => name.includes(ing) || ing.includes(name))
      );
      matchedRecipes.push({
        name: rule.name,
        ingredients: usedIngredients,
        steps: rule.steps,
      });
    }
  }

  return matchedRecipes;
};
