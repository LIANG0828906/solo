import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());

let recipes = [
  {
    id: '1',
    title: '麻婆豆腐',
    author: '川菜大师',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1',
    cuisine: '川菜',
    description: '经典四川名菜，麻辣鲜香，豆腐嫩滑',
    ingredients: [
      { name: '嫩豆腐', amount: '400g' },
      { name: '牛肉末', amount: '100g' },
      { name: '郫县豆瓣酱', amount: '2勺' },
      { name: '花椒粉', amount: '1茶匙' },
      { name: '蒜末', amount: '2瓣' },
      { name: '葱花', amount: '适量' },
      { name: '生抽', amount: '1勺' },
      { name: '淀粉', amount: '1勺' }
    ],
    steps: [
      '豆腐切小块，放入加盐的开水中焯烫2分钟捞出',
      '热锅放油，放入牛肉末炒至变色',
      '加入豆瓣酱、蒜末炒出红油',
      '加入适量清水，放入豆腐块',
      '加生抽调味，小火煮3分钟让豆腐入味',
      '淀粉勾芡，撒上花椒粉和葱花即可出锅'
    ],
    improveCount: 5,
    version: 6,
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-03-20T14:20:00Z',
    history: [
      {
        id: 'h1',
        author: '美食爱好者',
        authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=2',
        timestamp: '2024-03-20T14:20:00Z',
        summary: '增加了花椒粉用量，让麻味更浓郁',
        changes: { ingredients: [{ name: '花椒粉', oldAmount: '半茶匙', newAmount: '1茶匙' }] }
      },
      {
        id: 'h2',
        author: '厨房新手',
        authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=3',
        timestamp: '2024-03-10T09:15:00Z',
        summary: '优化了豆腐焯水步骤，建议加盐提升底味',
        changes: { steps: [{ index: 0, oldDesc: '豆腐切小块，放入开水中焯烫2分钟', newDesc: '豆腐切小块，放入加盐的开水中焯烫2分钟捞出' }] }
      },
      {
        id: 'h3',
        author: '营养师小王',
        authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=4',
        timestamp: '2024-02-28T16:45:00Z',
        summary: '建议使用嫩豆腐，口感更好',
        changes: { ingredients: [{ name: '豆腐', oldAmount: '400g', newAmount: '400g', note: '改为嫩豆腐' }] }
      },
      {
        id: 'h4',
        author: '辣味狂人',
        authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=5',
        timestamp: '2024-02-15T11:30:00Z',
        summary: '增加了豆瓣酱用量，红油更足',
        changes: { ingredients: [{ name: '郫县豆瓣酱', oldAmount: '1勺', newAmount: '2勺' }] }
      },
      {
        id: 'h5',
        author: '完美主义者',
        authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=6',
        timestamp: '2024-01-25T08:20:00Z',
        summary: '增加了勾芡步骤，让汤汁更浓稠',
        changes: { steps: [{ index: 5, oldDesc: '撒上花椒粉和葱花即可出锅', newDesc: '淀粉勾芡，撒上花椒粉和葱花即可出锅' }], ingredients: [{ name: '淀粉', amount: '1勺', action: 'add' }] }
      }
    ]
  },
  {
    id: '2',
    title: '日式照烧鸡腿',
    author: '日料达人',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=7',
    cuisine: '日料',
    description: '甜咸适中的照烧酱汁，配上多汁的鸡腿肉',
    ingredients: [
      { name: '去骨鸡腿肉', amount: '2块' },
      { name: '酱油', amount: '3勺' },
      { name: '味醂', amount: '2勺' },
      { name: '清酒', amount: '1勺' },
      { name: '白糖', amount: '1勺' },
      { name: '蒜末', amount: '1瓣' },
      { name: '姜片', amount: '2片' },
      { name: '白芝麻', amount: '适量' }
    ],
    steps: [
      '鸡腿肉用厨房纸吸干水分，皮朝下放入平底锅',
      '中小火煎至金黄，翻面继续煎至熟透',
      '将酱油、味醂、清酒、白糖混合调成照烧汁',
      '锅中放入蒜末、姜片炒香',
      '倒入照烧汁，放入鸡腿肉',
      '小火收汁至酱汁浓稠，切片撒上白芝麻即可'
    ],
    improveCount: 3,
    version: 4,
    createdAt: '2024-02-01T08:00:00Z',
    updatedAt: '2024-03-18T19:30:00Z',
    history: [
      {
        id: 'h6',
        author: '居酒屋主厨',
        authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=8',
        timestamp: '2024-03-18T19:30:00Z',
        summary: '建议先煎皮锁住肉汁',
        changes: { steps: [{ index: 0, oldDesc: '鸡腿肉放入平底锅煎至两面金黄', newDesc: '鸡腿肉用厨房纸吸干水分，皮朝下放入平底锅' }] }
      },
      {
        id: 'h7',
        author: '健康生活家',
        authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=9',
        timestamp: '2024-03-05T12:00:00Z',
        summary: '减少了白糖用量，更健康',
        changes: { ingredients: [{ name: '白糖', oldAmount: '2勺', newAmount: '1勺' }] }
      },
      {
        id: 'h8',
        author: '酱汁专家',
        authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=10',
        timestamp: '2024-02-20T15:45:00Z',
        summary: '调整了照烧汁比例，风味更佳',
        changes: { ingredients: [{ name: '酱油', oldAmount: '2勺', newAmount: '3勺' }, { name: '味醂', oldAmount: '3勺', newAmount: '2勺' }] }
      }
    ]
  },
  {
    id: '3',
    title: '巧克力熔岩蛋糕',
    author: '甜品师Lily',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=11',
    cuisine: '烘焙',
    description: '外酥内软，切开流心的巧克力熔岩蛋糕',
    ingredients: [
      { name: '黑巧克力', amount: '150g' },
      { name: '黄油', amount: '100g' },
      { name: '细砂糖', amount: '80g' },
      { name: '鸡蛋', amount: '2个' },
      { name: '蛋黄', amount: '1个' },
      { name: '低筋面粉', amount: '40g' },
      { name: '可可粉', amount: '适量' },
      { name: '糖粉', amount: '适量' }
    ],
    steps: [
      '巧克力和黄油隔水融化，搅拌均匀',
      '鸡蛋、蛋黄和细砂糖打至颜色变浅',
      '将巧克力液缓缓倒入蛋液中，边倒边搅拌',
      '筛入低筋面粉，翻拌均匀至无颗粒',
      '模具刷黄油撒可可粉，倒入面糊',
      '烤箱预热220度，烤8-10分钟，表面凝固即可',
      '倒扣脱模，筛上糖粉趁热享用'
    ],
    improveCount: 2,
    version: 3,
    createdAt: '2024-01-20T14:00:00Z',
    updatedAt: '2024-03-12T10:15:00Z',
    history: [
      {
        id: 'h9',
        author: '烘焙新手',
        authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=12',
        timestamp: '2024-03-12T10:15:00Z',
        summary: '增加了烤温说明，更容易成功',
        changes: { steps: [{ index: 5, oldDesc: '烤箱预热，烤8-10分钟', newDesc: '烤箱预热220度，烤8-10分钟，表面凝固即可' }] }
      },
      {
        id: 'h10',
        author: '美食博主',
        authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=13',
        timestamp: '2024-02-28T20:30:00Z',
        summary: '建议使用70%黑巧克力，风味更浓郁',
        changes: { ingredients: [{ name: '黑巧克力', oldAmount: '150g', newAmount: '150g', note: '建议70%可可含量' }] }
      }
    ]
  },
  {
    id: '4',
    title: '西红柿炒鸡蛋',
    author: '家常菜王',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=14',
    cuisine: '家常菜',
    description: '国民家常菜，酸甜可口，简单易做',
    ingredients: [
      { name: '西红柿', amount: '2个' },
      { name: '鸡蛋', amount: '3个' },
      { name: '白糖', amount: '1勺' },
      { name: '盐', amount: '适量' },
      { name: '葱花', amount: '适量' },
      { name: '食用油', amount: '适量' }
    ],
    steps: [
      '西红柿切块，鸡蛋打散加少许盐',
      '热锅放油，倒入蛋液炒至凝固盛出',
      '锅中再放少许油，放入西红柿翻炒出汁',
      '加入白糖和少许盐调味',
      '倒入炒好的鸡蛋，翻炒均匀',
      '撒上葱花即可出锅'
    ],
    improveCount: 4,
    version: 5,
    createdAt: '2024-01-05T12:00:00Z',
    updatedAt: '2024-03-22T09:45:00Z',
    history: [
      {
        id: 'h11',
        author: '厨房小白',
        authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=15',
        timestamp: '2024-03-22T09:45:00Z',
        summary: '建议西红柿去皮，口感更好',
        changes: { steps: [{ index: 0, oldDesc: '西红柿切块，鸡蛋打散', newDesc: '西红柿切块（建议用开水烫过去皮），鸡蛋打散加少许盐' }] }
      },
      {
        id: 'h12',
        author: '美食评论家',
        authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=16',
        timestamp: '2024-03-08T18:20:00Z',
        summary: '先炒出西红柿汁再放鸡蛋，更入味',
        changes: { steps: [{ index: 2, oldDesc: '放入西红柿翻炒', newDesc: '放入西红柿翻炒出汁' }] }
      },
      {
        id: 'h13',
        author: '健康达人',
        authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=17',
        timestamp: '2024-02-18T11:30:00Z',
        summary: '减少白糖用量，更健康',
        changes: { ingredients: [{ name: '白糖', oldAmount: '2勺', newAmount: '1勺' }] }
      },
      {
        id: 'h14',
        author: '大厨老爸',
        authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=18',
        timestamp: '2024-01-28T17:00:00Z',
        summary: '鸡蛋炒嫩一点更好吃',
        changes: { steps: [{ index: 1, oldDesc: '倒入蛋液炒熟盛出', newDesc: '倒入蛋液炒至凝固盛出' }] }
      }
    ]
  },
  {
    id: '5',
    title: '意大利肉酱面',
    author: '意餐爱好者',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=19',
    cuisine: '西餐',
    description: '经典意式肉酱面，番茄浓郁，肉香四溢',
    ingredients: [
      { name: '意大利面', amount: '200g' },
      { name: '牛肉末', amount: '200g' },
      { name: '番茄罐头', amount: '400g' },
      { name: '洋葱', amount: '半个' },
      { name: '胡萝卜', amount: '半根' },
      { name: '芹菜', amount: '1根' },
      { name: '蒜末', amount: '2瓣' },
      { name: '红酒', amount: '50ml' },
      { name: '橄榄油', amount: '适量' },
      { name: '盐', amount: '适量' },
      { name: '黑胡椒', amount: '适量' },
      { name: '帕玛森芝士', amount: '适量' }
    ],
    steps: [
      '洋葱、胡萝卜、芹菜切成细丁（蔬菜三剑客）',
      '热锅放橄榄油，放入蔬菜丁炒软',
      '加入蒜末炒香，放入牛肉末炒至变色',
      '倒入红酒煮至酒精挥发',
      '加入番茄罐头，加盐和黑胡椒调味',
      '小火慢炖45分钟，期间偶尔搅拌',
      '另起一锅煮意大利面至al dente',
      '将煮好的面拌入肉酱中，撒上帕玛森芝士即可'
    ],
    improveCount: 1,
    version: 2,
    createdAt: '2024-02-10T16:00:00Z',
    updatedAt: '2024-03-05T13:30:00Z',
    history: [
      {
        id: 'h15',
        author: '意籍主厨',
        authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=20',
        timestamp: '2024-03-05T13:30:00Z',
        summary: '建议炖的时间更长，风味更浓郁',
        changes: { steps: [{ index: 5, oldDesc: '小火慢炖30分钟', newDesc: '小火慢炖45分钟，期间偶尔搅拌' }] }
      }
    ]
  },
  {
    id: '6',
    title: '广式早茶虾饺',
    author: '粤点师傅',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=21',
    cuisine: '粤菜',
    description: '皮薄馅靓，晶莹剔透的经典粤式点心',
    ingredients: [
      { name: '虾仁', amount: '300g' },
      { name: '猪肥膘', amount: '50g' },
      { name: '澄粉（小麦淀粉）', amount: '150g' },
      { name: '生粉', amount: '30g' },
      { name: '竹笋', amount: '50g' },
      { name: '姜末', amount: '适量' },
      { name: '盐', amount: '适量' },
      { name: '白糖', amount: '少许' },
      { name: '香油', amount: '适量' },
      { name: '开水', amount: '适量' }
    ],
    steps: [
      '虾仁洗净吸干水分，一部分剁成虾泥，一部分切成小丁',
      '猪肥膘和竹笋切成细丁',
      '将虾泥、虾丁、肥膘丁、笋丁混合，加入姜末、盐、白糖、香油搅拌上劲',
      '澄粉和生粉混合，缓缓倒入开水，边倒边搅拌',
      '揉成光滑面团，盖上保鲜膜醒15分钟',
      '面团分成小剂子，擀成薄圆皮',
      '包入虾馅，捏成虾饺形状',
      '水开后蒸8-10分钟即可'
    ],
    improveCount: 0,
    version: 1,
    createdAt: '2024-03-15T11:00:00Z',
    updatedAt: '2024-03-15T11:00:00Z',
    history: []
  }
];

app.get('/api/recipes', (_req, res) => {
  res.json(recipes.map(r => ({
    id: r.id,
    title: r.title,
    author: r.author,
    authorAvatar: r.authorAvatar,
    cuisine: r.cuisine,
    description: r.description,
    improveCount: r.improveCount,
    updatedAt: r.updatedAt
  })));
});

app.get('/api/recipes/:id', (req, res) => {
  const recipe = recipes.find(r => r.id === req.params.id);
  if (!recipe) {
    return res.status(404).json({ error: '菜谱不存在' });
  }
  res.json(recipe);
});

app.post('/api/recipes/:id/improve', (req, res) => {
  const recipeIndex = recipes.findIndex(r => r.id === req.params.id);
  if (recipeIndex === -1) {
    return res.status(404).json({ error: '菜谱不存在' });
  }

  const { author, authorName, ingredientChanges, stepChanges, summary } = req.body;
  
  const recipe = recipes[recipeIndex];
  
  if (ingredientChanges && ingredientChanges.length > 0) {
    ingredientChanges.forEach(change => {
      const ingIndex = recipe.ingredients.findIndex(i => i.name === change.name);
      if (ingIndex !== -1 && change.newAmount) {
        recipe.ingredients[ingIndex].amount = change.newAmount;
      }
    });
  }
  
  if (stepChanges && stepChanges.length > 0) {
    stepChanges.forEach(change => {
      if (change.index !== undefined && change.newDesc) {
        recipe.steps[change.index] = change.newDesc;
      }
    });
  }
  
  const historyEntry = {
    id: uuidv4(),
    author: authorName || '匿名用户',
    authorAvatar: author || `https://api.dicebear.com/7.x/avataaars/svg?seed=${uuidv4().slice(0, 8)}`,
    timestamp: new Date().toISOString(),
    summary: summary || '进行了改进',
    changes: {
      ingredients: ingredientChanges || [],
      steps: stepChanges || []
    }
  };
  
  recipe.history.unshift(historyEntry);
  recipe.improveCount += 1;
  recipe.version += 1;
  recipe.updatedAt = new Date().toISOString();
  
  res.json(recipe);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
