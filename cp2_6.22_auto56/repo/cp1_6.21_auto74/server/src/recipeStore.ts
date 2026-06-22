import { v4 as uuidv4 } from 'uuid';

export interface Ingredient {
  name: string;
  amount: string;
}

export interface Step {
  description: string;
  image?: string;
}

export interface Recipe {
  id: string;
  name: string;
  image: string;
  difficulty: number;
  cookTime: number;
  ingredients: Ingredient[];
  steps: Step[];
  category: string;
  isFavorite: boolean;
  createdAt: number;
}

const tofuSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <rect width="200" height="200" fill="#F5E6C8"/>
  <rect x="30" y="50" width="140" height="100" rx="10" fill="#FFF8DC" stroke="#8B7355" stroke-width="3"/>
  <circle cx="60" cy="80" r="8" fill="#90EE90"/>
  <circle cx="100" cy="100" r="10" fill="#D2691E"/>
  <circle cx="140" cy="85" r="7" fill="#90EE90"/>
  <circle cx="80" cy="120" r="6" fill="#D2691E"/>
  <circle cx="130" cy="125" r="8" fill="#90EE90"/>
  <text x="100" y="180" text-anchor="middle" font-size="16" fill="#5D4037" font-family="sans-serif">家常豆腐</text>
</svg>`;

const chickenSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <rect width="200" height="200" fill="#FFEFD5"/>
  <circle cx="100" cy="100" r="70" fill="#FF6347"/>
  <circle cx="70" cy="80" r="12" fill="#FFD700"/>
  <circle cx="120" cy="70" r="10" fill="#FFD700"/>
  <circle cx="90" cy="120" r="14" fill="#FFD700"/>
  <circle cx="140" cy="110" r="11" fill="#FFD700"/>
  <circle cx="60" cy="130" r="9" fill="#228B22"/>
  <circle cx="130" cy="140" r="8" fill="#228B22"/>
  <text x="100" y="180" text-anchor="middle" font-size="16" fill="#8B0000" font-family="sans-serif">宫保鸡丁</text>
</svg>`;

const mapoSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <rect width="200" height="200" fill="#FFE4E1"/>
  <ellipse cx="100" cy="105" rx="75" ry="60" fill="#CD5C5C"/>
  <rect x="55" y="75" width="25" height="20" rx="4" fill="#FFF8DC" stroke="#A0522D" stroke-width="2"/>
  <rect x="90" y="65" width="30" height="22" rx="4" fill="#FFF8DC" stroke="#A0522D" stroke-width="2"/>
  <rect x="130" y="80" width="22" height="18" rx="4" fill="#FFF8DC" stroke="#A0522D" stroke-width="2"/>
  <rect x="70" y="115" width="20" height="18" rx="4" fill="#FFF8DC" stroke="#A0522D" stroke-width="2"/>
  <rect x="110" y="110" width="28" height="20" rx="4" fill="#FFF8DC" stroke="#A0522D" stroke-width="2"/>
  <circle cx="60" cy="140" r="5" fill="#228B22"/>
  <circle cx="150" cy="135" r="4" fill="#228B22"/>
  <text x="100" y="180" text-anchor="middle" font-size="16" fill="#8B0000" font-family="sans-serif">麻婆豆腐</text>
</svg>`;

const porkSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <rect width="200" height="200" fill="#FAEBD7"/>
  <circle cx="100" cy="100" r="72" fill="#8B0000"/>
  <rect x="50" y="60" width="30" height="30" rx="6" fill="#A52A2A" stroke="#5D1A1A" stroke-width="2"/>
  <rect x="90" y="55" width="35" height="32" rx="6" fill="#A52A2A" stroke="#5D1A1A" stroke-width="2"/>
  <rect x="135" y="65" width="28" height="28" rx="6" fill="#A52A2A" stroke="#5D1A1A" stroke-width="2"/>
  <rect x="60" y="100" width="32" height="30" rx="6" fill="#A52A2A" stroke="#5D1A1A" stroke-width="2"/>
  <rect x="105" y="98" width="30" height="34" rx="6" fill="#A52A2A" stroke="#5D1A1A" stroke-width="2"/>
  <rect x="145" y="105" width="25" height="25" rx="6" fill="#A52A2A" stroke="#5D1A1A" stroke-width="2"/>
  <rect x="75" y="140" width="28" height="25" rx="6" fill="#A52A2A" stroke="#5D1A1A" stroke-width="2"/>
  <rect x="115" y="142" width="32" height="22" rx="6" fill="#A52A2A" stroke="#5D1A1A" stroke-width="2"/>
  <text x="100" y="180" text-anchor="middle" font-size="16" fill="#5D1A1A" font-family="sans-serif">红烧肉</text>
</svg>`;

const puddingSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <rect width="200" height="200" fill="#FFFACD"/>
  <ellipse cx="100" cy="140" rx="65" ry="35" fill="#FFD700"/>
  <path d="M 45 140 Q 45 70 100 65 Q 155 70 155 140 Z" fill="#FFEB3B"/>
  <ellipse cx="100" cy="140" rx="65" ry="15" fill="#FFA500" opacity="0.6"/>
  <circle cx="70" cy="110" r="10" fill="#FF6347"/>
  <circle cx="100" cy="95" r="12" fill="#FF6347"/>
  <circle cx="130" cy="108" r="11" fill="#FF6347"/>
  <circle cx="85" cy="130" r="9" fill="#FF6347"/>
  <circle cx="118" cy="128" r="10" fill="#FF6347"/>
  <text x="100" y="185" text-anchor="middle" font-size="16" fill="#B8860B" font-family="sans-serif">芒果布丁</text>
</svg>`;

const toBase64 = (svg: string): string => {
  return `data:image/svg+xml;base64,${Buffer.from(svg.trim()).toString('base64')}`;
};

const seedRecipes: Recipe[] = [
  {
    id: uuidv4(),
    name: '家常豆腐',
    image: toBase64(tofuSvg),
    difficulty: 2,
    cookTime: 25,
    category: '家常菜',
    isFavorite: false,
    createdAt: Date.now() - 500000,
    ingredients: [
      { name: '北豆腐', amount: '1块(约400g)' },
      { name: '青椒', amount: '1个' },
      { name: '红椒', amount: '1个' },
      { name: '蒜末', amount: '2瓣' },
      { name: '生抽', amount: '2汤匙' },
      { name: '盐', amount: '适量' }
    ],
    steps: [
      { description: '豆腐切成2厘米见方的块，用盐水浸泡10分钟' },
      { description: '青红椒切小块备用' },
      { description: '热锅下油，放入豆腐煎至两面金黄' },
      { description: '加入蒜末爆香，放入青红椒翻炒' },
      { description: '加入生抽和少许水，焖煮3分钟' },
      { description: '加盐调味，勾芡出锅' }
    ]
  },
  {
    id: uuidv4(),
    name: '宫保鸡丁',
    image: toBase64(chickenSvg),
    difficulty: 3,
    cookTime: 30,
    category: '川菜',
    isFavorite: true,
    createdAt: Date.now() - 400000,
    ingredients: [
      { name: '鸡胸肉', amount: '300g' },
      { name: '花生米', amount: '50g' },
      { name: '干辣椒', amount: '10个' },
      { name: '花椒', amount: '1茶匙' },
      { name: '葱白', amount: '2段' },
      { name: '料酒', amount: '1汤匙' },
      { name: '生抽', amount: '2汤匙' },
      { name: '醋', amount: '1汤匙' },
      { name: '白糖', amount: '1汤匙' }
    ],
    steps: [
      { description: '鸡胸肉切丁，用料酒、生抽、淀粉腌制15分钟' },
      { description: '调制碗汁：生抽、醋、白糖、淀粉、水混合' },
      { description: '干辣椒切段，葱白切丁' },
      { description: '热锅下油，爆香花椒和干辣椒' },
      { description: '放入鸡丁快速翻炒至变色' },
      { description: '加入葱白翻炒，倒入碗汁收汁' },
      { description: '最后加入花生米翻匀出锅' }
    ]
  },
  {
    id: uuidv4(),
    name: '麻婆豆腐',
    image: toBase64(mapoSvg),
    difficulty: 3,
    cookTime: 20,
    category: '川菜',
    isFavorite: false,
    createdAt: Date.now() - 300000,
    ingredients: [
      { name: '嫩豆腐', amount: '1盒(约400g)' },
      { name: '牛肉末', amount: '100g' },
      { name: '郫县豆瓣酱', amount: '2汤匙' },
      { name: '花椒粉', amount: '1茶匙' },
      { name: '蒜末', amount: '2瓣' },
      { name: '葱花', amount: '适量' },
      { name: '生抽', amount: '1汤匙' }
    ],
    steps: [
      { description: '豆腐切成2厘米方块，用淡盐水焯一下捞出' },
      { description: '热锅下油，放入牛肉末炒香' },
      { description: '加入豆瓣酱和蒜末炒出红油' },
      { description: '加入适量清水，放入豆腐块' },
      { description: '加生抽调味，小火焖煮5分钟' },
      { description: '勾芡撒上花椒粉和葱花即可' }
    ]
  },
  {
    id: uuidv4(),
    name: '红烧肉',
    image: toBase64(porkSvg),
    difficulty: 4,
    cookTime: 90,
    category: '家常菜',
    isFavorite: true,
    createdAt: Date.now() - 200000,
    ingredients: [
      { name: '五花肉', amount: '600g' },
      { name: '冰糖', amount: '30g' },
      { name: '生抽', amount: '3汤匙' },
      { name: '老抽', amount: '1汤匙' },
      { name: '料酒', amount: '3汤匙' },
      { name: '姜片', amount: '5片' },
      { name: '八角', amount: '2个' },
      { name: '桂皮', amount: '1小块' }
    ],
    steps: [
      { description: '五花肉切成3厘米见方的块' },
      { description: '冷水下锅焯水，去除血沫捞出' },
      { description: '锅中放少许油，加入冰糖小火炒糖色' },
      { description: '炒至琥珀色时放入肉块翻炒上色' },
      { description: '加入姜片、八角、桂皮爆香' },
      { description: '倒入料酒、生抽、老抽翻炒' },
      { description: '加入没过肉块的开水，大火烧开转小火炖60分钟' },
      { description: '大火收汁，汤汁浓稠即可出锅' }
    ]
  },
  {
    id: uuidv4(),
    name: '芒果布丁',
    image: toBase64(puddingSvg),
    difficulty: 1,
    cookTime: 15,
    category: '甜品',
    isFavorite: false,
    createdAt: Date.now() - 100000,
    ingredients: [
      { name: '芒果', amount: '2个(约400g)' },
      { name: '牛奶', amount: '200ml' },
      { name: '淡奶油', amount: '100ml' },
      { name: '吉利丁片', amount: '10g' },
      { name: '细砂糖', amount: '40g' }
    ],
    steps: [
      { description: '吉利丁片用冷水泡软备用' },
      { description: '芒果去皮切块，留一部分装饰用' },
      { description: '芒果加牛奶放入料理机打成泥' },
      { description: '淡奶油加细砂糖小火加热至糖融化' },
      { description: '加入挤干的吉利丁片搅拌融化' },
      { description: '混合芒果泥和奶油液，搅拌均匀' },
      { description: '倒入模具冷藏4小时以上，脱模装饰即可' }
    ]
  }
];

class RecipeStore {
  private store: Map<string, Recipe> = new Map();

  constructor() {
    seedRecipes.forEach(recipe => {
      this.store.set(recipe.id, recipe);
    });
  }

  getAll(): Recipe[] {
    return Array.from(this.store.values()).sort((a, b) => b.createdAt - a.createdAt);
  }

  getById(id: string): Recipe | undefined {
    return this.store.get(id);
  }

  search(keyword: string): Recipe[] {
    const lower = keyword.toLowerCase();
    return this.getAll().filter(
      r =>
        r.name.toLowerCase().includes(lower) ||
        r.category.toLowerCase().includes(lower) ||
        r.ingredients.some(i => i.name.toLowerCase().includes(lower))
    );
  }

  create(data: Omit<Recipe, 'id' | 'createdAt' | 'isFavorite'>): Recipe {
    const recipe: Recipe = {
      ...data,
      id: uuidv4(),
      isFavorite: false,
      createdAt: Date.now()
    };
    this.store.set(recipe.id, recipe);
    return recipe;
  }

  update(id: string, data: Partial<Omit<Recipe, 'id' | 'createdAt'>>): Recipe | undefined {
    const existing = this.store.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...data };
    this.store.set(id, updated);
    return updated;
  }

  delete(id: string): boolean {
    return this.store.delete(id);
  }

  toggleFavorite(id: string): Recipe | undefined {
    const existing = this.store.get(id);
    if (!existing) return undefined;
    existing.isFavorite = !existing.isFavorite;
    return existing;
  }
}

export const recipeStore = new RecipeStore();
