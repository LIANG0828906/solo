import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import type { Recipe, Comment } from './types';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const imagePrompt = (dish: string, style: string) =>
  encodeURIComponent(`专业美食摄影，${dish}，${style}，高清，45度角，精致摆盘，自然光，餐厅背景`);

const imgUrl = (prompt: string) =>
  `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${prompt}&image_size=square_hd`;

const mockRecipes: Recipe[] = [
  {
    id: uuidv4(),
    name: '番茄意大利面',
    image: imgUrl(imagePrompt('番茄意大利面', '意式风味')),
    cookTime: '30分钟',
    tags: ['西餐', '快手', '清淡'],
    ingredients: [
      { name: '意大利面', quantity: '200克' },
      { name: '番茄', quantity: '3个' },
      { name: '大蒜', quantity: '3瓣' },
      { name: '橄榄油', quantity: '2汤匙' },
      { name: '盐', quantity: '适量' },
      { name: '黑胡椒', quantity: '适量' },
      { name: '罗勒叶', quantity: '少许' }
    ],
    steps: [
      '将意大利面按包装说明煮至八成熟，捞出沥干备用',
      '番茄切丁，大蒜切末',
      '热锅倒入橄榄油，爆香蒜末',
      '加入番茄丁翻炒出汁，小火熬煮10分钟',
      '加入煮好的意大利面，翻炒均匀',
      '加盐和黑胡椒调味，撒上新鲜罗勒叶即可'
    ],
    rating: 4.5,
    reviewCount: 128
  },
  {
    id: uuidv4(),
    name: '素食沙拉碗',
    image: imgUrl(imagePrompt('素食沙拉碗', '健康轻食')),
    cookTime: '15分钟',
    tags: ['素食', '低卡', '健康', '快手'],
    ingredients: [
      { name: '生菜', quantity: '100克' },
      { name: '紫甘蓝', quantity: '50克' },
      { name: '牛油果', quantity: '半个' },
      { name: '鹰嘴豆', quantity: '80克' },
      { name: '樱桃番茄', quantity: '10颗' },
      { name: '橄榄油', quantity: '1汤匙' },
      { name: '柠檬汁', quantity: '1汤匙' }
    ],
    steps: [
      '生菜和紫甘蓝洗净切丝，铺在碗底',
      '鹰嘴豆提前煮熟沥干',
      '牛油果切片，樱桃番茄对半切',
      '将所有食材摆放在沙拉碗中',
      '橄榄油和柠檬汁混合调匀作为酱汁',
      '淋上酱汁即可享用'
    ],
    rating: 4.8,
    reviewCount: 96
  },
  {
    id: uuidv4(),
    name: '红烧排骨',
    image: imgUrl(imagePrompt('红烧排骨', '中式家常菜')),
    cookTime: '60分钟',
    tags: ['中餐', '高蛋白'],
    ingredients: [
      { name: '猪排骨', quantity: '500克' },
      { name: '生姜', quantity: '3片' },
      { name: '大葱', quantity: '1根' },
      { name: '八角', quantity: '2个' },
      { name: '生抽', quantity: '2汤匙' },
      { name: '老抽', quantity: '1汤匙' },
      { name: '冰糖', quantity: '30克' }
    ],
    steps: [
      '排骨冷水下锅焯水，撇去浮沫后捞出洗净',
      '热锅冷油，放入冰糖小火炒出糖色',
      '放入排骨翻炒均匀，裹上糖色',
      '加入生姜、大葱、八角爆香',
      '加入生抽、老抽和适量热水，大火烧开',
      '转小火炖煮40分钟，最后大火收汁即可'
    ],
    rating: 4.9,
    reviewCount: 256
  },
  {
    id: uuidv4(),
    name: '草莓蛋糕',
    image: imgUrl(imagePrompt('草莓奶油蛋糕', '精致甜点')),
    cookTime: '90分钟',
    tags: ['甜点', '高蛋白'],
    ingredients: [
      { name: '低筋面粉', quantity: '100克' },
      { name: '鸡蛋', quantity: '4个' },
      { name: '细砂糖', quantity: '80克' },
      { name: '淡奶油', quantity: '300毫升' },
      { name: '草莓', quantity: '200克' },
      { name: '牛奶', quantity: '50毫升' },
      { name: '玉米油', quantity: '40毫升' }
    ],
    steps: [
      '蛋黄加糖打散，加入牛奶和玉米油拌匀',
      '筛入低筋面粉，翻拌至顺滑无颗粒',
      '蛋白分三次加糖打发至湿性发泡',
      '取三分之一蛋白霜加入蛋黄糊翻拌，再倒回蛋白霜中',
      '倒入模具，150度烘烤50分钟',
      '蛋糕晾凉后切片，抹上奶油，夹入草莓，表面装饰即可'
    ],
    rating: 4.7,
    reviewCount: 189
  },
  {
    id: uuidv4(),
    name: '麻婆豆腐',
    image: imgUrl(imagePrompt('麻婆豆腐', '川菜经典')),
    cookTime: '25分钟',
    tags: ['中餐', '辣', '快手', '素食'],
    ingredients: [
      { name: '嫩豆腐', quantity: '400克' },
      { name: '牛肉末', quantity: '100克' },
      { name: '郫县豆瓣酱', quantity: '2汤匙' },
      { name: '花椒粉', quantity: '1茶匙' },
      { name: '蒜末', quantity: '1汤匙' },
      { name: '葱花', quantity: '适量' },
      { name: '水淀粉', quantity: '适量' }
    ],
    steps: [
      '豆腐切小块，开水焯烫1分钟捞出',
      '热锅放油，炒香牛肉末至变色',
      '加入豆瓣酱和蒜末炒出红油',
      '加入适量清水，放入豆腐块',
      '大火烧开后转小火煮5分钟入味',
      '加水淀粉勾芡，撒上花椒粉和葱花即可'
    ],
    rating: 4.6,
    reviewCount: 312
  },
  {
    id: uuidv4(),
    name: '鸡胸肉藜麦沙拉',
    image: imgUrl(imagePrompt('鸡胸肉藜麦沙拉', '健身减脂餐')),
    cookTime: '40分钟',
    tags: ['低卡', '高蛋白', '健康'],
    ingredients: [
      { name: '鸡胸肉', quantity: '200克' },
      { name: '藜麦', quantity: '100克' },
      { name: '西兰花', quantity: '150克' },
      { name: '胡萝卜', quantity: '1根' },
      { name: '橄榄油', quantity: '2汤匙' },
      { name: '柠檬', quantity: '半个' },
      { name: '黑胡椒', quantity: '适量' }
    ],
    steps: [
      '藜麦洗净，加水煮15分钟至透明，沥干备用',
      '鸡胸肉用盐和黑胡椒腌制15分钟',
      '平底锅煎鸡胸肉至两面金黄，切片备用',
      '西兰花切小朵，胡萝卜切片，焯水后过凉水',
      '将所有食材混合放入大碗',
      '淋上橄榄油和柠檬汁，撒黑胡椒拌匀即可'
    ],
    rating: 4.4,
    reviewCount: 156
  },
  {
    id: uuidv4(),
    name: '奶油蘑菇汤',
    image: imgUrl(imagePrompt('奶油蘑菇浓汤', '西式浓汤')),
    cookTime: '35分钟',
    tags: ['西餐', '清淡'],
    ingredients: [
      { name: '口蘑', quantity: '300克' },
      { name: '洋葱', quantity: '半个' },
      { name: '黄油', quantity: '30克' },
      { name: '淡奶油', quantity: '100毫升' },
      { name: '面粉', quantity: '20克' },
      { name: '鸡汤', quantity: '500毫升' },
      { name: '百里香', quantity: '少许' }
    ],
    steps: [
      '口蘑切片，洋葱切末',
      '黄油融化，炒香洋葱末',
      '加入口蘑片翻炒至出水变软',
      '撒入面粉翻炒均匀',
      '慢慢倒入鸡汤，边倒边搅拌至顺滑',
      '大火烧开后转小火煮15分钟，用料理棒打至细腻',
      '加入淡奶油和百里香，调味即可'
    ],
    rating: 4.5,
    reviewCount: 87
  },
  {
    id: uuidv4(),
    name: '宫保鸡丁',
    image: imgUrl(imagePrompt('宫保鸡丁', '经典川菜')),
    cookTime: '25分钟',
    tags: ['中餐', '辣', '快手', '高蛋白'],
    ingredients: [
      { name: '鸡胸肉', quantity: '300克' },
      { name: '花生米', quantity: '50克' },
      { name: '干辣椒', quantity: '10个' },
      { name: '花椒', quantity: '1茶匙' },
      { name: '生抽', quantity: '2汤匙' },
      { name: '醋', quantity: '1汤匙' },
      { name: '白糖', quantity: '1汤匙' }
    ],
    steps: [
      '鸡胸肉切丁，用生抽、料酒、淀粉腌制15分钟',
      '干辣椒剪段，调碗汁：生抽、醋、白糖、淀粉、清水',
      '花生米提前炸熟或炒熟备用',
      '热锅放油，爆香干辣椒和花椒',
      '放入鸡丁快速翻炒至变色',
      '倒入碗汁翻炒至浓稠，最后加入花生米翻匀即可'
    ],
    rating: 4.8,
    reviewCount: 423
  },
  {
    id: uuidv4(),
    name: '清蒸鲈鱼',
    image: imgUrl(imagePrompt('清蒸鲈鱼', '粤式家常菜')),
    cookTime: '20分钟',
    tags: ['中餐', '清淡', '健康', '高蛋白'],
    ingredients: [
      { name: '鲈鱼', quantity: '1条约500克' },
      { name: '生姜', quantity: '1块' },
      { name: '大葱', quantity: '2根' },
      { name: '蒸鱼豉油', quantity: '2汤匙' },
      { name: '料酒', quantity: '1汤匙' },
      { name: '食用油', quantity: '2汤匙' }
    ],
    steps: [
      '鲈鱼处理干净，两面各划3刀，用料酒和盐腌制10分钟',
      '生姜和大葱切细丝，一部分垫在鱼身下',
      '水开后将鱼放入蒸锅，大火蒸8分钟',
      '取出倒掉盘中蒸出的汁水',
      '铺上葱姜丝，淋上蒸鱼豉油',
      '烧热油淋在葱姜丝上激出香味即可'
    ],
    rating: 4.9,
    reviewCount: 298
  },
  {
    id: uuidv4(),
    name: '法式吐司',
    image: imgUrl(imagePrompt('法式吐司配水果', '西式早餐')),
    cookTime: '15分钟',
    tags: ['甜点', '快手', '西餐'],
    ingredients: [
      { name: '厚切吐司', quantity: '2片' },
      { name: '鸡蛋', quantity: '2个' },
      { name: '牛奶', quantity: '100毫升' },
      { name: '白糖', quantity: '20克' },
      { name: '黄油', quantity: '20克' },
      { name: '枫糖浆', quantity: '适量' },
      { name: '新鲜水果', quantity: '适量' }
    ],
    steps: [
      '鸡蛋打散，加入牛奶和白糖搅匀',
      '将吐司放入蛋液中浸泡，让两面充分吸饱蛋液',
      '平底锅加热，放入黄油融化',
      '放入吐司，小火煎至两面金黄',
      '盛盘，淋上枫糖浆',
      '搭配新鲜水果即可享用'
    ],
    rating: 4.6,
    reviewCount: 187
  },
  {
    id: uuidv4(),
    name: '酸辣土豆丝',
    image: imgUrl(imagePrompt('酸辣土豆丝', '家常下饭菜')),
    cookTime: '20分钟',
    tags: ['中餐', '素食', '快手', '辣', '低卡'],
    ingredients: [
      { name: '土豆', quantity: '2个' },
      { name: '干辣椒', quantity: '5个' },
      { name: '大蒜', quantity: '3瓣' },
      { name: '醋', quantity: '2汤匙' },
      { name: '盐', quantity: '适量' },
      { name: '食用油', quantity: '2汤匙' }
    ],
    steps: [
      '土豆去皮切细丝，用清水浸泡去除淀粉',
      '干辣椒切段，大蒜切末',
      '热锅放油，爆香干辣椒和蒜末',
      '捞出土豆丝沥干水分，下锅大火快炒',
      '沿锅边淋入醋，快速翻炒均匀',
      '加盐调味，炒至土豆丝断生即可出锅'
    ],
    rating: 4.7,
    reviewCount: 521
  },
  {
    id: uuidv4(),
    name: '芒果班戟',
    image: imgUrl(imagePrompt('芒果班戟', '港式甜点')),
    cookTime: '45分钟',
    tags: ['甜点', '健康'],
    ingredients: [
      { name: '低筋面粉', quantity: '80克' },
      { name: '鸡蛋', quantity: '2个' },
      { name: '牛奶', quantity: '200毫升' },
      { name: '糖粉', quantity: '30克' },
      { name: '淡奶油', quantity: '200毫升' },
      { name: '芒果', quantity: '2个' },
      { name: '黄油', quantity: '15克' }
    ],
    steps: [
      '鸡蛋打散，加入牛奶和融化的黄油搅匀',
      '筛入低筋面粉和糖粉，搅拌至顺滑无颗粒',
      '平底锅小火加热，倒入一勺面糊摊成薄饼',
      '小火煎至两面凝固，取出放凉',
      '淡奶油加糖打发至硬性发泡',
      '芒果切块，取一张饼皮，中间放奶油和芒果，包成四方形即可'
    ],
    rating: 4.8,
    reviewCount: 167
  }
];

let recipes: Recipe[] = [...mockRecipes];
const commentsStore: Map<string, Comment[]> = new Map();

function getRandomUsername(): string {
  const usernames = [
    '美食家小王', '吃货一枚', '厨房小白', '烘焙达人', '家常菜高手',
    '减脂餐博主', '甜品控', '川菜爱好者', '健康饮食家', '新手厨师',
    '老饕客', '料理初心者', '美食探索者', '家常菜妈妈', '健身餐达人'
  ];
  return usernames[Math.floor(Math.random() * usernames.length)];
}

recipes.forEach(r => {
  const sampleComments: Comment[] = [
    {
      id: uuidv4(),
      recipeId: r.id,
      username: getRandomUsername(),
      content: '味道非常棒，家人都很喜欢！',
      rating: 5,
      createdAt: Date.now() - 86400000 * 2
    },
    {
      id: uuidv4(),
      recipeId: r.id,
      username: getRandomUsername(),
      content: '做法简单，步骤清晰，一次就成功了',
      rating: 4,
      createdAt: Date.now() - 86400000
    }
  ];
  commentsStore.set(r.id, sampleComments);
});

app.get('/api/recipes', (req, res) => {
  const limit = parseInt(req.query.limit as string) || 20;
  const search = (req.query.search as string)?.toLowerCase() || '';
  const tagsParam = req.query.tags as string;
  const tags = tagsParam ? tagsParam.split(',') : [];

  let filtered = recipes;

  if (search) {
    filtered = filtered.filter(
      r => r.name.toLowerCase().includes(search) ||
           r.tags.some(t => t.toLowerCase().includes(search))
    );
  }

  if (tags.length > 0) {
    filtered = filtered.filter(r =>
      tags.every(t => r.tags.includes(t))
    );
  }

  const result = filtered.slice(0, limit);
  res.json({ recipes: result, total: filtered.length });
});

app.get('/api/recipes/:id', (req, res) => {
  const recipe = recipes.find(r => r.id === req.params.id);
  if (!recipe) {
    res.status(404).json({ error: 'Recipe not found' });
    return;
  }
  res.json(recipe);
});

app.get('/api/recipes/:id/comments', (req, res) => {
  const comments = commentsStore.get(req.params.id) || [];
  const sorted = [...comments].sort((a, b) => b.createdAt - a.createdAt);
  res.json({ comments: sorted });
});

app.post('/api/recipes/:id/comments', (req, res) => {
  const { content, rating } = req.body;
  const recipeId = req.params.id;

  if (!content || content.length > 100 || !rating || rating < 1 || rating > 5) {
    res.status(400).json({ error: 'Invalid comment data' });
    return;
  }

  const recipe = recipes.find(r => r.id === recipeId);
  if (!recipe) {
    res.status(404).json({ error: 'Recipe not found' });
    return;
  }

  const newComment: Comment = {
    id: uuidv4(),
    recipeId,
    username: getRandomUsername(),
    content,
    rating,
    createdAt: Date.now()
  };

  const existingComments = commentsStore.get(recipeId) || [];
  existingComments.push(newComment);
  commentsStore.set(recipeId, existingComments);

  const allRatings = existingComments.map(c => c.rating);
  recipe.rating = allRatings.reduce((a, b) => a + b, 0) / allRatings.length;
  recipe.reviewCount = existingComments.length;

  res.json({ success: true, comment: newComment, recipe });
});

app.get('/api/recommend', (req, res) => {
  const favoritesParam = req.query.favorites as string;
  const favoriteIds = favoritesParam ? favoritesParam.split(',') : [];

  if (favoriteIds.length === 0) {
    const shuffled = [...recipes].sort(() => Math.random() - 0.5);
    res.json({ recommendations: shuffled.slice(0, 4) });
    return;
  }

  const favoriteRecipes = recipes.filter(r => favoriteIds.includes(r.id));
  const tagFrequency = new Map<string, number>();

  favoriteRecipes.forEach(r => {
    r.tags.forEach(tag => {
      tagFrequency.set(tag, (tagFrequency.get(tag) || 0) + 1);
    });
  });

  const scoredRecipes = recipes
    .filter(r => !favoriteIds.includes(r.id))
    .map(r => {
      let score = 0;
      r.tags.forEach(tag => {
        score += tagFrequency.get(tag) || 0;
      });
      return { recipe: r, score };
    })
    .sort((a, b) => b.score - a.score || b.recipe.rating - a.recipe.rating);

  let recommendations = scoredRecipes.map(s => s.recipe).slice(0, 4);

  if (recommendations.length < 4) {
    const remaining = recipes
      .filter(r => !favoriteIds.includes(r.id) && !recommendations.includes(r))
      .sort(() => Math.random() - 0.5);
    recommendations = [...recommendations, ...remaining].slice(0, 4);
  }

  res.json({ recommendations });
});

app.listen(PORT, () => {
  console.log(`Recipe API server running on http://localhost:${PORT}`);
});
