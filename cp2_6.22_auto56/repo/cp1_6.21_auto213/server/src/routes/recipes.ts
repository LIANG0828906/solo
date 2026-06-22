import { Router, Request, Response } from 'express';

interface Ingredient {
  name: string;
  amount: string;
}

interface Step {
  number: number;
  description: string;
  image?: string;
}

interface Recipe {
  id: string;
  title: string;
  author: string;
  authorId: string;
  coverImage: string;
  cookTime: number;
  category: string;
  ingredients: Ingredient[];
  steps: Step[];
  createdAt: string;
  favoritesCount: number;
  commentsCount: number;
  avgRating: number;
}

const recipes: Recipe[] = [
  {
    id: '1',
    title: '红烧肉',
    author: '张师傅',
    authorId: 'u1',
    coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=braised+pork+belly+Chinese+cuisine+dark+glossy+sauce+appetizing+food+photography&image_size=landscape_4_3',
    cookTime: 90,
    category: '家常菜',
    ingredients: [
      { name: '五花肉', amount: '500g' },
      { name: '生抽', amount: '3勺' },
      { name: '老抽', amount: '1勺' },
      { name: '料酒', amount: '2勺' },
      { name: '冰糖', amount: '30g' },
      { name: '葱段', amount: '适量' },
      { name: '姜片', amount: '5片' },
      { name: '八角', amount: '2个' }
    ],
    steps: [
      { number: 1, description: '五花肉切块冷水下锅焯水去腥捞出沥干' },
      { number: 2, description: '锅中少许油放入冰糖小火炒出焦糖色' },
      { number: 3, description: '放入肉块大火翻炒使每块均匀上色' },
      { number: 4, description: '加入葱段姜片八角炒出香味' },
      { number: 5, description: '倒入料酒生抽老抽翻炒均匀' },
      { number: 6, description: '加入热水没过肉块大火烧开' },
      { number: 7, description: '转小火盖盖炖煮60分钟至肉酥烂' },
      { number: 8, description: '开大火收汁至浓稠即可出锅' }
    ],
    createdAt: '2024-01-15T08:00:00Z',
    favoritesCount: 234,
    commentsCount: 56,
    avgRating: 4.8
  },
  {
    id: '2',
    title: '宫保鸡丁',
    author: '李大厨',
    authorId: 'u2',
    coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=kung+pao+chicken+with+peanuts+red+chilies+Sichuan+cuisine+food+photography&image_size=landscape_4_3',
    cookTime: 25,
    category: '川菜',
    ingredients: [
      { name: '鸡胸肉', amount: '300g' },
      { name: '花生米', amount: '50g' },
      { name: '干辣椒', amount: '8个' },
      { name: '花椒', amount: '1勺' },
      { name: '葱段', amount: '适量' },
      { name: '姜末', amount: '1勺' },
      { name: '蒜末', amount: '1勺' },
      { name: '生抽', amount: '2勺' },
      { name: '醋', amount: '1勺' },
      { name: '白糖', amount: '1勺' },
      { name: '淀粉', amount: '1勺' }
    ],
    steps: [
      { number: 1, description: '鸡胸肉切丁加生抽淀粉腌制15分钟' },
      { number: 2, description: '花生米小火炒香盛出备用' },
      { number: 3, description: '调碗汁：生抽醋白糖淀粉水拌匀' },
      { number: 4, description: '锅中热油放花椒干辣椒小火炸香' },
      { number: 5, description: '放入鸡丁大火翻炒至变白' },
      { number: 6, description: '加入姜末蒜末翻炒出香' },
      { number: 7, description: '倒入碗汁快速翻炒至浓稠' },
      { number: 8, description: '撒入花生米葱段翻匀出锅' }
    ],
    createdAt: '2024-01-20T10:00:00Z',
    favoritesCount: 189,
    commentsCount: 42,
    avgRating: 4.6
  },
  {
    id: '3',
    title: '麻婆豆腐',
    author: '王味仙',
    authorId: 'u3',
    coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=mapo+tofu+Sichuan+tofu+dish+spicy+red+oil+food+photography&image_size=landscape_4_3',
    cookTime: 20,
    category: '川菜',
    ingredients: [
      { name: '嫩豆腐', amount: '1盒' },
      { name: '猪肉末', amount: '100g' },
      { name: '郫县豆瓣酱', amount: '2勺' },
      { name: '花椒粉', amount: '1勺' },
      { name: '蒜末', amount: '1勺' },
      { name: '姜末', amount: '1勺' },
      { name: '葱花', amount: '适量' },
      { name: '生抽', amount: '1勺' },
      { name: '水淀粉', amount: '适量' }
    ],
    steps: [
      { number: 1, description: '嫩豆腐切小块入开水焯2分钟捞出' },
      { number: 2, description: '锅中油热放入肉末炒散变色' },
      { number: 3, description: '加入郫县豆瓣酱炒出红油' },
      { number: 4, description: '放入姜蒜末翻炒出香' },
      { number: 5, description: '加入适量水烧开放入豆腐块' },
      { number: 6, description: '小火煮3分钟让豆腐入味' },
      { number: 7, description: '淋入水淀粉勾芡推匀' },
      { number: 8, description: '撒花椒粉葱花出锅' }
    ],
    createdAt: '2024-02-01T09:00:00Z',
    favoritesCount: 156,
    commentsCount: 38,
    avgRating: 4.5
  },
  {
    id: '4',
    title: '糖醋排骨',
    author: '赵美食',
    authorId: 'u4',
    coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=sweet+and+sour+ribs+Chinese+cuisine+glossy+red+sauce+food+photography&image_size=landscape_4_3',
    cookTime: 45,
    category: '家常菜',
    ingredients: [
      { name: '排骨', amount: '500g' },
      { name: '料酒', amount: '2勺' },
      { name: '生抽', amount: '2勺' },
      { name: '醋', amount: '3勺' },
      { name: '白糖', amount: '3勺' },
      { name: '番茄酱', amount: '1勺' },
      { name: '姜片', amount: '3片' },
      { name: '葱段', amount: '适量' },
      { name: '白芝麻', amount: '适量' }
    ],
    steps: [
      { number: 1, description: '排骨冷水下锅加料酒姜片焯水捞出' },
      { number: 2, description: '调糖醋汁：生抽醋白糖番茄酱拌匀' },
      { number: 3, description: '锅中少许油放入排骨煎至两面金黄' },
      { number: 4, description: '倒入糖醋汁加入适量清水' },
      { number: 5, description: '大火烧开后转小火炖30分钟' },
      { number: 6, description: '开大火收汁至浓稠挂在排骨上' },
      { number: 7, description: '撒白芝麻和葱花出锅装盘' }
    ],
    createdAt: '2024-02-10T11:00:00Z',
    favoritesCount: 210,
    commentsCount: 48,
    avgRating: 4.7
  },
  {
    id: '5',
    title: '鱼香肉丝',
    author: '张师傅',
    authorId: 'u1',
    coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=yuxiang+shredded+pork+with+wood+ear+mushroom+Chinese+stir+fry+food+photography&image_size=landscape_4_3',
    cookTime: 20,
    category: '川菜',
    ingredients: [
      { name: '猪里脊', amount: '250g' },
      { name: '木耳', amount: '50g' },
      { name: '胡萝卜', amount: '1根' },
      { name: '青椒', amount: '1个' },
      { name: '泡椒', amount: '3个' },
      { name: '蒜末', amount: '1勺' },
      { name: '姜末', amount: '1勺' },
      { name: '葱花', amount: '适量' },
      { name: '生抽', amount: '2勺' },
      { name: '醋', amount: '2勺' },
      { name: '白糖', amount: '1勺' },
      { name: '郫县豆瓣酱', amount: '1勺' },
      { name: '淀粉', amount: '1勺' }
    ],
    steps: [
      { number: 1, description: '猪里脊切丝加盐料酒淀粉腌制' },
      { number: 2, description: '木耳泡发胡萝卜青椒切丝' },
      { number: 3, description: '调鱼香汁：生抽醋白糖淀粉水拌匀' },
      { number: 4, description: '锅中热油放入肉丝滑散盛出' },
      { number: 5, description: '锅中留油放豆瓣酱炒出红油' },
      { number: 6, description: '加入姜蒜末泡椒炒香' },
      { number: 7, description: '放入木耳胡萝卜青椒翻炒' },
      { number: 8, description: '倒回肉丝淋入鱼香汁翻炒出锅' }
    ],
    createdAt: '2024-02-20T14:00:00Z',
    favoritesCount: 178,
    commentsCount: 35,
    avgRating: 4.4
  },
  {
    id: '6',
    title: '西红柿炒鸡蛋',
    author: '赵美食',
    authorId: 'u4',
    coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=tomato+egg+stir+fry+Chinese+home+cooking+food+photography&image_size=landscape_4_3',
    cookTime: 15,
    category: '家常菜',
    ingredients: [
      { name: '西红柿', amount: '2个' },
      { name: '鸡蛋', amount: '3个' },
      { name: '白糖', amount: '1勺' },
      { name: '盐', amount: '适量' },
      { name: '葱花', amount: '适量' },
      { name: '食用油', amount: '适量' }
    ],
    steps: [
      { number: 1, description: '西红柿切块鸡蛋打散加少许盐搅匀' },
      { number: 2, description: '锅中多放些油烧至七成热' },
      { number: 3, description: '倒入蛋液待底部凝固后快速翻炒成块盛出' },
      { number: 4, description: '锅中留底油放入葱花爆香' },
      { number: 5, description: '加入西红柿块大火翻炒出汁' },
      { number: 6, description: '加入白糖和少许盐调味' },
      { number: 7, description: '倒回鸡蛋翻炒均匀' },
      { number: 8, description: '出锅装盘撒上葱花' }
    ],
    createdAt: '2024-03-01T08:00:00Z',
    favoritesCount: 320,
    commentsCount: 67,
    avgRating: 4.3
  },
  {
    id: '7',
    title: '清蒸鲈鱼',
    author: '李大厨',
    authorId: 'u2',
    coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=steamed+sea+bass+with+ginger+scallion+Cantonese+cuisine+food+photography&image_size=landscape_4_3',
    cookTime: 25,
    category: '粤菜',
    ingredients: [
      { name: '鲈鱼', amount: '1条' },
      { name: '葱丝', amount: '适量' },
      { name: '姜丝', amount: '适量' },
      { name: '蒸鱼豉油', amount: '3勺' },
      { name: '料酒', amount: '1勺' },
      { name: '食用油', amount: '适量' }
    ],
    steps: [
      { number: 1, description: '鲈鱼去鳞去内脏洗净在鱼身划几刀' },
      { number: 2, description: '鱼身抹料酒塞入姜丝腌10分钟' },
      { number: 3, description: '盘底铺葱段鱼身放姜丝' },
      { number: 4, description: '水烧开后放入鱼大火蒸8-10分钟' },
      { number: 5, description: '蒸好倒掉盘中腥水去掉葱姜' },
      { number: 6, description: '鱼身上铺新鲜葱丝姜丝' },
      { number: 7, description: '淋上蒸鱼豉油' },
      { number: 8, description: '锅中烧热油浇在葱姜丝上激出香味' }
    ],
    createdAt: '2024-03-10T12:00:00Z',
    favoritesCount: 267,
    commentsCount: 51,
    avgRating: 4.9
  },
  {
    id: '8',
    title: '回锅肉',
    author: '王味仙',
    authorId: 'u3',
    coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=twice+cooked+pork+with+leek+Sichuan+cuisine+food+photography&image_size=landscape_4_3',
    cookTime: 30,
    category: '川菜',
    ingredients: [
      { name: '五花肉', amount: '400g' },
      { name: '蒜苗', amount: '100g' },
      { name: '郫县豆瓣酱', amount: '2勺' },
      { name: '甜面酱', amount: '1勺' },
      { name: '豆豉', amount: '1勺' },
      { name: '姜片', amount: '3片' },
      { name: '料酒', amount: '1勺' },
      { name: '青椒', amount: '2个' }
    ],
    steps: [
      { number: 1, description: '五花肉整块冷水下锅加姜片料酒煮20分钟' },
      { number: 2, description: '捞出晾凉后切成薄片' },
      { number: 3, description: '蒜苗切段青椒切块' },
      { number: 4, description: '锅不放油放入肉片小火煸出油' },
      { number: 5, description: '肉片煸至微微卷曲呈灯盏窝状' },
      { number: 6, description: '推至一边放豆瓣酱豆豉炒出红油' },
      { number: 7, description: '加甜面酱与肉片一起翻炒' },
      { number: 8, description: '放入蒜苗青椒大火翻炒断生出锅' }
    ],
    createdAt: '2024-03-20T16:00:00Z',
    favoritesCount: 198,
    commentsCount: 44,
    avgRating: 4.6
  }
];

export { recipes };

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const { search, timeMin, timeMax, category } = req.query;
  let filtered = [...recipes];

  if (search && typeof search === 'string') {
    const keyword = search.toLowerCase();
    filtered = filtered.filter(r =>
      r.title.toLowerCase().includes(keyword) ||
      r.ingredients.some(i => i.name.toLowerCase().includes(keyword))
    );
  }

  if (timeMin) {
    filtered = filtered.filter(r => r.cookTime >= Number(timeMin));
  }

  if (timeMax) {
    filtered = filtered.filter(r => r.cookTime <= Number(timeMax));
  }

  if (category && typeof category === 'string') {
    filtered = filtered.filter(r => r.category === category);
  }

  res.json(filtered);
});

router.get('/:id', (req: Request, res: Response) => {
  const recipe = recipes.find(r => r.id === req.params.id);
  if (!recipe) {
    res.status(404).json({ error: 'Recipe not found' });
    return;
  }
  res.json(recipe);
});

router.post('/', (req: Request, res: Response) => {
  const newRecipe: Recipe = {
    id: String(Date.now()),
    title: req.body.title || '',
    author: req.body.author || '',
    authorId: req.body.authorId || '',
    coverImage: req.body.coverImage || '',
    cookTime: req.body.cookTime || 0,
    category: req.body.category || '',
    ingredients: req.body.ingredients || [],
    steps: req.body.steps || [],
    createdAt: new Date().toISOString(),
    favoritesCount: 0,
    commentsCount: 0,
    avgRating: 0
  };
  recipes.push(newRecipe);
  res.status(201).json(newRecipe);
});

router.put('/:id', (req: Request, res: Response) => {
  const index = recipes.findIndex(r => r.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: 'Recipe not found' });
    return;
  }
  recipes[index] = { ...recipes[index], ...req.body, id: recipes[index].id };
  res.json(recipes[index]);
});

router.delete('/:id', (req: Request, res: Response) => {
  const index = recipes.findIndex(r => r.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: 'Recipe not found' });
    return;
  }
  const deleted = recipes.splice(index, 1)[0];
  res.json(deleted);
});

export default router;
