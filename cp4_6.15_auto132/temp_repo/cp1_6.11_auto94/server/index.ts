import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 4000;

app.use(express.json());

interface Ingredient {
  id: string;
  name: string;
  amount: string;
}

interface Step {
  id: string;
  order: number;
  description: string;
  image?: string;
  timeMinutes: number;
}

interface Recipe {
  id: string;
  title: string;
  image: string;
  tags: string[];
  totalTime: number;
  author: string;
  ingredients: Ingredient[];
  steps: Step[];
}

interface Substitution {
  id: string;
  original: string;
  substitute: string;
  amount: string;
  textureChange: string;
  timeAdjustment: number;
}

const recipes: Recipe[] = [
  {
    id: '1',
    title: '红烧鸡肉炖土豆',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20braised%20chicken%20with%20potatoes%20in%20a%20ceramic%20bowl%2C%20warm%20lighting%2C%20food%20photography&image_size=square_hd',
    tags: ['家常菜', '炖菜', '下饭'],
    totalTime: 60,
    author: '小明',
    ingredients: [
      { id: 'i1', name: '鸡腿肉', amount: '500g' },
      { id: 'i2', name: '土豆', amount: '2个' },
      { id: 'i3', name: '生抽', amount: '2勺' },
      { id: 'i4', name: '老抽', amount: '1勺' },
      { id: 'i5', name: '冰糖', amount: '15g' },
      { id: 'i6', name: '八角', amount: '2颗' },
    ],
    steps: [
      { id: 's1', order: 1, description: '鸡腿肉切块，冷水下锅焯水去血沫，捞出沥干备用。', timeMinutes: 10 },
      { id: 's2', order: 2, description: '土豆去皮切滚刀块，放入清水中防止氧化。', timeMinutes: 5 },
      { id: 's3', order: 3, description: '锅中放少许油，加入冰糖小火炒出糖色。', timeMinutes: 5 },
      { id: 's4', order: 4, description: '放入鸡块翻炒均匀，使其裹上糖色。', timeMinutes: 5 },
      { id: 's5', order: 5, description: '加入生抽、老抽、八角，倒入开水没过鸡肉，大火烧开后转小火炖30分钟。', timeMinutes: 30 },
      { id: 's6', order: 6, description: '加入土豆块，继续炖10分钟至土豆软烂，大火收汁即可。', timeMinutes: 10 },
    ],
  },
  {
    id: '2',
    title: '番茄牛奶浓汤意面',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=creamy%20tomato%20milk%20pasta%20in%20white%20bowl%2C%20Italian%20food%20photography%2C%20warm%20cozy%20lighting&image_size=square_hd',
    tags: ['西餐', '意面', '快手'],
    totalTime: 35,
    author: '小红',
    ingredients: [
      { id: 'i7', name: '意面', amount: '200g' },
      { id: 'i8', name: '番茄', amount: '3个' },
      { id: 'i9', name: '牛奶', amount: '200ml' },
      { id: 'i10', name: '洋葱', amount: '半个' },
      { id: 'i11', name: '大蒜', amount: '3瓣' },
      { id: 'i12', name: '橄榄油', amount: '2勺' },
    ],
    steps: [
      { id: 's7', order: 1, description: '锅中加水煮沸，加少许盐，放入意面煮至8成熟，捞出备用。', timeMinutes: 10 },
      { id: 's8', order: 2, description: '番茄顶部划十字，用开水烫一下去皮，切成小块。', timeMinutes: 5 },
      { id: 's9', order: 3, description: '洋葱和大蒜切末，锅中放橄榄油炒香。', timeMinutes: 5 },
      { id: 's10', order: 4, description: '加入番茄块翻炒出汁，用铲子压成泥状。', timeMinutes: 8 },
      { id: 's11', order: 5, description: '倒入牛奶搅匀，小火煮至浓稠。', timeMinutes: 5 },
      { id: 's12', order: 6, description: '放入煮好的意面翻拌均匀，撒上黑胡椒即可。', timeMinutes: 2 },
    ],
  },
  {
    id: '3',
    title: '蒜蓉西兰花炒虾仁',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=garlic%20broccoli%20stir%20fry%20with%20shrimp%2C%20chinese%20healthy%20dish%2C%20bright%20colors%20food%20photography&image_size=square_hd',
    tags: ['低卡', '快手', '健康'],
    totalTime: 25,
    author: '小丽',
    ingredients: [
      { id: 'i13', name: '虾仁', amount: '300g' },
      { id: 'i14', name: '西兰花', amount: '1颗' },
      { id: 'i15', name: '大蒜', amount: '5瓣' },
      { id: 'i16', name: '蚝油', amount: '1勺' },
      { id: 'i17', name: '料酒', amount: '1勺' },
      { id: 'i18', name: '盐', amount: '适量' },
    ],
    steps: [
      { id: 's13', order: 1, description: '虾仁挑去虾线，用料酒和少许盐腌制10分钟。', timeMinutes: 12 },
      { id: 's14', order: 2, description: '西兰花掰成小朵，用盐水浸泡后洗净。', timeMinutes: 5 },
      { id: 's15', order: 3, description: '锅中水烧开，放少许盐和油，西兰花焯水1分钟捞出。', timeMinutes: 3 },
      { id: 's16', order: 4, description: '大蒜切末，锅中放油爆香蒜末。', timeMinutes: 2 },
      { id: 's17', order: 5, description: '放入虾仁翻炒至变色。', timeMinutes: 2 },
      { id: 's18', order: 6, description: '加入西兰花和蚝油翻炒均匀即可。', timeMinutes: 1 },
    ],
  },
  {
    id: '4',
    title: '日式咖喱牛肉饭',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Japanese%20beef%20curry%20rice%2C%20thick%20curry%20sauce%20over%20white%20rice%2C%20food%20photography%20warm%20tones&image_size=square_hd',
    tags: ['日料', '咖喱', '下饭'],
    totalTime: 75,
    author: '小华',
    ingredients: [
      { id: 'i19', name: '牛肉', amount: '400g' },
      { id: 'i20', name: '胡萝卜', amount: '1根' },
      { id: 'i21', name: '土豆', amount: '2个' },
      { id: 'i22', name: '洋葱', amount: '1个' },
      { id: 'i23', name: '咖喱块', amount: '1盒' },
      { id: 'i24', name: '米饭', amount: '4碗' },
    ],
    steps: [
      { id: 's19', order: 1, description: '牛肉切块，土豆、胡萝卜切块，洋葱切丝备用。', timeMinutes: 10 },
      { id: 's20', order: 2, description: '锅中放油，炒香洋葱丝至透明。', timeMinutes: 8 },
      { id: 's21', order: 3, description: '加入牛肉翻炒至变色。', timeMinutes: 7 },
      { id: 's22', order: 4, description: '倒入开水没过食材，大火烧开转小火炖30分钟。', timeMinutes: 35 },
      { id: 's23', order: 5, description: '加入土豆、胡萝卜继续炖15分钟。', timeMinutes: 15 },
      { id: 's24', order: 6, description: '关火放入咖喱块搅匀，小火再煮5分钟至浓稠，浇在米饭上即可。', timeMinutes: 5 },
    ],
  },
  {
    id: '5',
    title: '豆浆燕麦水果碗',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=soy%20milk%20oatmeal%20fruit%20bowl%20with%20berries%20and%20banana%2C%20healthy%20breakfast%2C%20bright%20natural%20lighting&image_size=square_hd',
    tags: ['早餐', '健康', '素食'],
    totalTime: 15,
    author: '小芳',
    ingredients: [
      { id: 'i25', name: '燕麦片', amount: '60g' },
      { id: 'i26', name: '豆浆', amount: '250ml' },
      { id: 'i27', name: '香蕉', amount: '1根' },
      { id: 'i28', name: '蓝莓', amount: '30g' },
      { id: 'i29', name: '蜂蜜', amount: '1勺' },
      { id: 'i30', name: '奇亚籽', amount: '1勺' },
    ],
    steps: [
      { id: 's25', order: 1, description: '将燕麦片和奇亚籽混合放入碗中。', timeMinutes: 2 },
      { id: 's26', order: 2, description: '豆浆加热至微温，倒入碗中搅匀。', timeMinutes: 3 },
      { id: 's27', order: 3, description: '静置10分钟让燕麦充分吸收豆浆变软。', timeMinutes: 10 },
      { id: 's28', order: 4, description: '香蕉切片摆放在上面。', timeMinutes: 2 },
      { id: 's29', order: 5, description: '撒上蓝莓，淋上蜂蜜即可享用。', timeMinutes: 1 },
      { id: 's30', order: 6, description: '如需更甜可额外添加枫糖浆。', timeMinutes: 0 },
    ],
  },
  {
    id: '6',
    title: '家常豆腐煲',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20homemade%20tofu%20hotpot%20in%20claypot%2C%20savory%20brown%20sauce%2C%20green%20onion%20garnish%2C%20food%20photography&image_size=square_hd',
    tags: ['家常菜', '素食', '下饭'],
    totalTime: 40,
    author: '小强',
    ingredients: [
      { id: 'i31', name: '老豆腐', amount: '1块' },
      { id: 'i32', name: '香菇', amount: '6朵' },
      { id: 'i33', name: '青菜', amount: '3颗' },
      { id: 'i34', name: '生抽', amount: '2勺' },
      { id: 'i35', name: '蚝油', amount: '1勺' },
      { id: 'i36', name: '水淀粉', amount: '适量' },
    ],
    steps: [
      { id: 's31', order: 1, description: '豆腐切成厚块，用厨房纸吸干水分。', timeMinutes: 5 },
      { id: 's32', order: 2, description: '锅中放油，将豆腐煎至两面金黄捞出。', timeMinutes: 10 },
      { id: 's33', order: 3, description: '香菇泡发后切片，青菜洗净对半切开。', timeMinutes: 5 },
      { id: 's34', order: 4, description: '锅中留底油，炒香香菇片。', timeMinutes: 3 },
      { id: 's35', order: 5, description: '加入豆腐、生抽、蚝油和少许水，小火炖10分钟。', timeMinutes: 12 },
      { id: 's36', order: 6, description: '加入青菜煮至断生，淋水淀粉勾芡即可。', timeMinutes: 5 },
    ],
  },
];

const substitutionMap: Record<string, Substitution[]> = {
  '鸡腿肉': [
    { id: 'sub1', original: '鸡腿肉', substitute: '豆腐', amount: '400g', textureChange: '口感会更嫩滑，缺少肉的嚼劲，建议切块后先煎一下定型', timeAdjustment: -5 },
    { id: 'sub2', original: '鸡腿肉', substitute: '鸡胸肉', amount: '500g', textureChange: '肉质更紧实偏柴，建议用淀粉腌制后再烹饪', timeAdjustment: -2 },
    { id: 'sub3', original: '鸡腿肉', substitute: '蘑菇', amount: '300g', textureChange: '增添浓郁的菌香，口感软嫩有弹性', timeAdjustment: -8 },
  ],
  '牛肉': [
    { id: 'sub4', original: '牛肉', substitute: '猪肉', amount: '400g', textureChange: '口感更软嫩，肉香稍淡', timeAdjustment: -10 },
    { id: 'sub5', original: '牛肉', substitute: '豆腐', amount: '400g', textureChange: '完全素食，需要增加调味料提升风味', timeAdjustment: -15 },
    { id: 'sub6', original: '牛肉', substitute: '鹰嘴豆', amount: '2罐', textureChange: '软糯绵密，适合炖菜，建议提前泡发', timeAdjustment: -5 },
  ],
  '虾仁': [
    { id: 'sub7', original: '虾仁', substitute: '鸡胸肉丁', amount: '300g', textureChange: '口感更有嚼劲，无海鲜味', timeAdjustment: 1 },
    { id: 'sub8', original: '虾仁', substitute: '豆腐丁', amount: '300g', textureChange: '软嫩滑爽，注意不要炒碎', timeAdjustment: -1 },
    { id: 'sub9', original: '虾仁', substitute: '鲜贝', amount: '250g', textureChange: '更鲜甜有弹性，烹饪时间略短', timeAdjustment: -1 },
  ],
  '牛奶': [
    { id: 'sub10', original: '牛奶', substitute: '豆浆', amount: '200ml', textureChange: '略带豆香，颜色稍黄，质地相近', timeAdjustment: 0 },
    { id: 'sub11', original: '牛奶', substitute: '杏仁奶', amount: '200ml', textureChange: '带有坚果香气，口感更清爽', timeAdjustment: 0 },
    { id: 'sub12', original: '牛奶', substitute: '椰浆', amount: '180ml', textureChange: '更浓稠香甜，带有椰香风味', timeAdjustment: 0 },
  ],
  '豆浆': [
    { id: 'sub13', original: '豆浆', substitute: '牛奶', amount: '250ml', textureChange: '奶香浓郁，颜色更白', timeAdjustment: 0 },
    { id: 'sub14', original: '豆浆', substitute: '燕麦奶', amount: '250ml', textureChange: '带有谷物香气，口感微甜', timeAdjustment: 0 },
    { id: 'sub15', original: '豆浆', substitute: '腰果奶', amount: '250ml', textureChange: '更浓稠顺滑，坚果风味', timeAdjustment: 0 },
  ],
  '老豆腐': [
    { id: 'sub16', original: '老豆腐', substitute: '嫩豆腐', amount: '1块', textureChange: '更嫩滑易碎，烹饪时要轻柔翻动', timeAdjustment: -3 },
    { id: 'sub17', original: '老豆腐', substitute: '千叶豆腐', amount: '1盒', textureChange: 'Q弹有嚼劲，吸汁性强', timeAdjustment: 0 },
    { id: 'sub18', original: '老豆腐', substitute: '鸡肉块', amount: '350g', textureChange: '增加蛋白质和肉香', timeAdjustment: 5 },
  ],
  '土豆': [
    { id: 'sub19', original: '土豆', substitute: '红薯', amount: '2个', textureChange: '略带甜味，颜色金黄，更绵密', timeAdjustment: 0 },
    { id: 'sub20', original: '土豆', substitute: '胡萝卜', amount: '3根', textureChange: '增加甜味和维生素，口感稍脆', timeAdjustment: -2 },
    { id: 'sub21', original: '土豆', substitute: '山药', amount: '2段', textureChange: '更软糯粘稠，带有中药香气', timeAdjustment: -3 },
  ],
  '意面': [
    { id: 'sub22', original: '意面', substitute: '全麦意面', amount: '200g', textureChange: '更有嚼劲，麦香浓，更健康', timeAdjustment: 2 },
    { id: 'sub23', original: '意面', substitute: '乌冬面', amount: '200g', textureChange: '更粗更Q弹，日式风味', timeAdjustment: -3 },
    { id: 'sub24', original: '意面', substitute: '荞麦面', amount: '200g', textureChange: '更细更爽滑，带有荞麦香', timeAdjustment: -2 },
  ],
  '西兰花': [
    { id: 'sub25', original: '西兰花', substitute: '花椰菜', amount: '1颗', textureChange: '更软嫩，味道稍淡', timeAdjustment: 0 },
    { id: 'sub26', original: '西兰花', substitute: '芥蓝', amount: '1把', textureChange: '更爽脆，略带苦味', timeAdjustment: -1 },
    { id: 'sub27', original: '西兰花', substitute: '芦笋', amount: '1捆', textureChange: '更嫩更鲜，高端食材', timeAdjustment: -2 },
  ],
  '鸡蛋': [
    { id: 'sub28', original: '鸡蛋', substitute: '豆腐', amount: '2块', textureChange: '适合素食，口感软嫩', timeAdjustment: 2 },
    { id: 'sub29', original: '鸡蛋', substitute: '鹰嘴豆泥', amount: '150g', textureChange: '植物蛋白，绵密口感', timeAdjustment: 3 },
  ],
  '米饭': [
    { id: 'sub30', original: '米饭', substitute: '糙米饭', amount: '4碗', textureChange: '更有嚼劲，富含膳食纤维', timeAdjustment: 0 },
    { id: 'sub31', original: '米饭', substitute: '藜麦饭', amount: '4碗', textureChange: '颗粒感强，高蛋白低脂', timeAdjustment: 0 },
  ],
};

app.get('/api/recipes', (_req: Request, res: Response) => {
  res.json(recipes);
});

app.get('/api/recipes/:id', (req: Request, res: Response) => {
  const recipe = recipes.find(r => r.id === req.params.id);
  if (!recipe) {
    res.status(404).json({ error: '食谱不存在' });
    return;
  }
  res.json(recipe);
});

app.get('/api/substitutions', (req: Request, res: Response) => {
  const ingredient = req.query.ingredient as string;
  if (!ingredient) {
    res.status(400).json({ error: '缺少ingredient参数' });
    return;
  }
  const substitutions = substitutionMap[ingredient] || [];
  if (substitutions.length === 0) {
    const fallbackSubs: Substitution[] = [
      {
        id: uuidv4(),
        original: ingredient,
        substitute: '同量的相似食材',
        amount: '等量替换',
        textureChange: '建议根据实际情况调整用量和烹饪方式',
        timeAdjustment: 0,
      },
    ];
    res.json(fallbackSubs);
    return;
  }
  res.json(substitutions);
});

app.listen(PORT, () => {
  console.log(`食谱API服务器运行在 http://localhost:${PORT}`);
});
