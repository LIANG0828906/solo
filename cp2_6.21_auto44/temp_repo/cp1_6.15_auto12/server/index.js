const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// 内存数据存储
let users = [];
let recipes = [];
let comments = [];

// 初始化用户数据
function initUsers() {
  users = [
    {
      id: 'u1',
      name: '张妈妈',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangmama'
    },
    {
      id: 'u2',
      name: '李爸爸',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=libaba'
    },
    {
      id: 'u3',
      name: '王小厨',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wangxiaochu'
    }
  ];
}

// 初始化菜谱数据
function initRecipes() {
  const baseTime = Date.now();
  recipes = [
    {
      id: 'r1',
      title: '麻婆豆腐',
      description: '经典川菜，麻辣鲜香，嫩滑可口，是一道非常下饭的家常菜。',
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=mapo%20tofu%20sichuan%20cuisine%20spicy%20red%20dish&image_size=square',
      category: '川菜',
      author: { id: 'u1', name: '张妈妈', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangmama' },
      ingredients: [
        { name: '嫩豆腐', amount: '400g', prepared: '切小块，用盐水浸泡' },
        { name: '牛肉末', amount: '100g', prepared: '用料酒、生抽腌制' },
        { name: '郫县豆瓣酱', amount: '2勺', prepared: '' },
        { name: '花椒粉', amount: '1小勺', prepared: '' },
        { name: '蒜末', amount: '适量', prepared: '' },
        { name: '葱花', amount: '适量', prepared: '' }
      ],
      steps: [
        { step: 1, content: '豆腐切小块，放入加盐的开水中焯烫2分钟，捞出沥干。' },
        { step: 2, content: '锅中放油，加入牛肉末炒至变色，盛出备用。' },
        { step: 3, content: '锅中留底油，放入豆瓣酱炒出红油，加入蒜末爆香。' },
        { step: 4, content: '加入适量清水，放入豆腐，小火炖煮3分钟。' },
        { step: 5, content: '加入牛肉末，调入生抽、糖，用水淀粉勾芡。' },
        { step: 6, content: '出锅前撒上花椒粉和葱花即可。' }
      ],
      tags: ['川菜', '下饭', '家常菜'],
      rating: 4.5,
      ratingCount: 28,
      commentCount: 3,
      createdAt: new Date(baseTime - 86400000 * 5).toISOString()
    },
    {
      id: 'r2',
      title: '番茄炒蛋',
      description: '最经典的快手家常菜，酸甜可口，营养丰富，10分钟就能上桌。',
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=tomato%20scrambled%20eggs%20chinese%20home%20cooking&image_size=square',
      category: '快手菜',
      author: { id: 'u2', name: '李爸爸', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=libaba' },
      ingredients: [
        { name: '番茄', amount: '2个', prepared: '切块' },
        { name: '鸡蛋', amount: '3个', prepared: '打散' },
        { name: '葱花', amount: '适量', prepared: '' },
        { name: '盐', amount: '适量', prepared: '' },
        { name: '白糖', amount: '1小勺', prepared: '' }
      ],
      steps: [
        { step: 1, content: '鸡蛋打散，加少许盐搅匀。' },
        { step: 2, content: '热锅凉油，倒入蛋液，炒至定型盛出。' },
        { step: 3, content: '锅中再放少许油，放入番茄块翻炒出汁。' },
        { step: 4, content: '加入糖和盐调味，倒入炒好的鸡蛋翻炒均匀。' },
        { step: 5, content: '撒上葱花即可出锅。' }
      ],
      tags: ['快手菜', '家常菜', '素菜'],
      rating: 4.8,
      ratingCount: 56,
      commentCount: 4,
      createdAt: new Date(baseTime - 86400000 * 3).toISOString()
    },
    {
      id: 'r3',
      title: '芒果布丁',
      description: '香甜爽滑的芒果布丁，做法简单，是夏天最受欢迎的甜品之一。',
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=mango%20pudding%20dessert%20sweet%20summer&image_size=square',
      category: '甜品',
      author: { id: 'u3', name: '王小厨', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wangxiaochu' },
      ingredients: [
        { name: '芒果', amount: '2个', prepared: '去皮去核，部分切丁' },
        { name: '牛奶', amount: '200ml', prepared: '' },
        { name: '淡奶油', amount: '100ml', prepared: '' },
        { name: '吉利丁片', amount: '10g', prepared: '冷水泡软' },
        { name: '白糖', amount: '30g', prepared: '' }
      ],
      steps: [
        { step: 1, content: '吉利丁片用冷水泡软备用。' },
        { step: 2, content: '芒果肉放入料理机打成泥。' },
        { step: 3, content: '牛奶加糖加热，加入泡软的吉利丁片搅拌融化。' },
        { step: 4, content: '加入芒果泥和淡奶油，搅拌均匀。' },
        { step: 5, content: '倒入布丁瓶，放入冰箱冷藏4小时以上。' },
        { step: 6, content: '食用前放上芒果丁装饰即可。' }
      ],
      tags: ['甜品', '烘焙', '夏季'],
      rating: 4.6,
      ratingCount: 42,
      commentCount: 3,
      createdAt: new Date(baseTime - 86400000 * 2).toISOString()
    },
    {
      id: 'r4',
      title: '水煮肉片',
      description: '麻辣鲜香的水煮肉片，肉质滑嫩，汤汁浓郁，是川菜中的经典。',
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=boiled%20sliced%20pork%20sichuan%20spicy%20red%20chili&image_size=square',
      category: '川菜',
      author: { id: 'u1', name: '张妈妈', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangmama' },
      ingredients: [
        { name: '猪里脊肉', amount: '300g', prepared: '切薄片，用淀粉腌制' },
        { name: '豆芽', amount: '200g', prepared: '洗净' },
        { name: '郫县豆瓣酱', amount: '2勺', prepared: '' },
        { name: '干辣椒', amount: '适量', prepared: '剪段' },
        { name: '花椒', amount: '1小勺', prepared: '' },
        { name: '蒜末', amount: '适量', prepared: '' }
      ],
      steps: [
        { step: 1, content: '肉片用盐、料酒、淀粉腌制15分钟。' },
        { step: 2, content: '锅中水烧开，豆芽焯水后铺在碗底。' },
        { step: 3, content: '锅中放油，加入豆瓣酱炒出红油，加蒜末爆香。' },
        { step: 4, content: '加入清水烧开，放入肉片滑熟。' },
        { step: 5, content: '将肉片连汤倒入铺好豆芽的碗中。' },
        { step: 6, content: '表面撒上干辣椒段和花椒，淋上热油即可。' }
      ],
      tags: ['川菜', '荤菜', '下饭'],
      rating: 4.7,
      ratingCount: 35,
      commentCount: 2,
      createdAt: new Date(baseTime - 86400000 * 4).toISOString()
    },
    {
      id: 'r5',
      title: '蒜蓉西兰花',
      description: '清爽健康的蒜蓉西兰花，简单快手，是减脂期的好选择。',
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=garlic%20broccoli%20healthy%20green%20vegetable&image_size=square',
      category: '快手菜',
      author: { id: 'u2', name: '李爸爸', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=libaba' },
      ingredients: [
        { name: '西兰花', amount: '1颗', prepared: '切小朵，洗净' },
        { name: '大蒜', amount: '5瓣', prepared: '切末' },
        { name: '盐', amount: '适量', prepared: '' },
        { name: '蚝油', amount: '1勺', prepared: '' }
      ],
      steps: [
        { step: 1, content: '西兰花切小朵，用盐水浸泡10分钟。' },
        { step: 2, content: '锅中水烧开，加少许盐和油，西兰花焯水1分钟。' },
        { step: 3, content: '捞出过凉水，沥干水分。' },
        { step: 4, content: '锅中放油，小火炒香蒜末。' },
        { step: 5, content: '放入西兰花，加入蚝油和盐，大火翻炒均匀即可。' }
      ],
      tags: ['快手菜', '素菜', '健康'],
      rating: 4.4,
      ratingCount: 25,
      commentCount: 2,
      createdAt: new Date(baseTime - 86400000 * 1).toISOString()
    },
    {
      id: 'r6',
      title: '提拉米苏',
      description: '经典意式甜品，咖啡与奶酪的完美结合，入口即化。',
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=tiramisu%20italian%20dessert%20coffee%20cocoa&image_size=square',
      category: '甜品',
      author: { id: 'u3', name: '王小厨', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wangxiaochu' },
      ingredients: [
        { name: '马斯卡彭奶酪', amount: '250g', prepared: '' },
        { name: '手指饼干', amount: '200g', prepared: '' },
        { name: '浓缩咖啡', amount: '200ml', prepared: '放凉' },
        { name: '蛋黄', amount: '3个', prepared: '' },
        { name: '白糖', amount: '60g', prepared: '' },
        { name: '可可粉', amount: '适量', prepared: '' }
      ],
      steps: [
        { step: 1, content: '蛋黄加糖隔温水打发至颜色变浅、体积膨大。' },
        { step: 2, content: '加入马斯卡彭奶酪，搅拌均匀。' },
        { step: 3, content: '淡奶油打发至6分发，与奶酪糊混合。' },
        { step: 4, content: '手指饼干快速蘸取咖啡，铺在容器底部。' },
        { step: 5, content: '倒入一层奶酪糊，再铺一层饼干，重复操作。' },
        { step: 6, content: '冷藏4小时以上，食用前筛上可可粉。' }
      ],
      tags: ['甜品', '烘焙', '意式'],
      rating: 4.9,
      ratingCount: 48,
      commentCount: 3,
      createdAt: new Date(baseTime - 86400000 * 6).toISOString()
    },
    {
      id: 'r7',
      title: '宫保鸡丁',
      description: '川菜经典名菜，鸡肉滑嫩，花生酥脆，麻辣鲜香。',
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=kung%20pao%20chicken%20sichuan%20peanuts%20spicy&image_size=square',
      category: '川菜',
      author: { id: 'u1', name: '张妈妈', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangmama' },
      ingredients: [
        { name: '鸡胸肉', amount: '300g', prepared: '切丁，用料酒、淀粉腌制' },
        { name: '花生米', amount: '50g', prepared: '炸熟或炒熟' },
        { name: '干辣椒', amount: '10个', prepared: '剪段' },
        { name: '花椒', amount: '1小勺', prepared: '' },
        { name: '葱姜蒜', amount: '适量', prepared: '切末' },
        { name: '生抽、醋、糖', amount: '适量', prepared: '调碗汁' }
      ],
      steps: [
        { step: 1, content: '鸡胸肉切丁，用盐、料酒、淀粉腌制15分钟。' },
        { step: 2, content: '用生抽、醋、糖、淀粉、水调成碗汁备用。' },
        { step: 3, content: '锅中放油，将鸡丁滑炒至变色盛出。' },
        { step: 4, content: '锅中留底油，小火炒香干辣椒和花椒。' },
        { step: 5, content: '加入葱姜蒜爆香，倒入鸡丁翻炒。' },
        { step: 6, content: '淋入碗汁，加入花生米，快速翻炒均匀即可。' }
      ],
      tags: ['川菜', '荤菜', '下酒菜'],
      rating: 4.6,
      ratingCount: 38,
      commentCount: 2,
      createdAt: new Date(baseTime - 86400000 * 7).toISOString()
    }
  ];
}

// 初始化评论数据
function initComments() {
  const baseTime = Date.now();
  comments = [
    { id: 'c1', recipeId: 'r1', userId: 'u2', userName: '李爸爸', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=libaba', content: '味道真的太棒了！家人都很喜欢，下次还要做。', createdAt: new Date(baseTime - 86400000 * 4).toISOString() },
    { id: 'c2', recipeId: 'r1', userId: 'u3', userName: '王小厨', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wangxiaochu', content: '麻婆豆腐的灵魂就是花椒粉，太香了！', createdAt: new Date(baseTime - 86400000 * 3).toISOString() },
    { id: 'c3', recipeId: 'r1', userId: 'u1', userName: '张妈妈', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangmama', content: '用嫩豆腐口感更好，记得要轻轻翻哦。', createdAt: new Date(baseTime - 86400000 * 2).toISOString() },
    
    { id: 'c4', recipeId: 'r2', userId: 'u1', userName: '张妈妈', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangmama', content: '番茄一定要炒出汁才好吃！', createdAt: new Date(baseTime - 86400000 * 2).toISOString() },
    { id: 'c5', recipeId: 'r2', userId: 'u3', userName: '王小厨', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wangxiaochu', content: '加点番茄酱味道更浓郁哦。', createdAt: new Date(baseTime - 86400000 * 1).toISOString() },
    { id: 'c6', recipeId: 'r2', userId: 'u2', userName: '李爸爸', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=libaba', content: '简单又好吃，我的拿手菜。', createdAt: new Date(baseTime - 86400000 * 1).toISOString() },
    { id: 'c7', recipeId: 'r2', userId: 'u1', userName: '张妈妈', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangmama', content: '鸡蛋要炒得嫩一点才好吃。', createdAt: new Date(baseTime - 86400000 * 0.5).toISOString() },
    
    { id: 'c8', recipeId: 'r3', userId: 'u1', userName: '张妈妈', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangmama', content: '夏天吃这个太舒服了，冰冰凉凉的。', createdAt: new Date(baseTime - 86400000 * 1).toISOString() },
    { id: 'c9', recipeId: 'r3', userId: 'u2', userName: '李爸爸', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=libaba', content: '做法简单，成品很漂亮！', createdAt: new Date(baseTime - 86400000 * 0.5).toISOString() },
    { id: 'c10', recipeId: 'r3', userId: 'u3', userName: '王小厨', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wangxiaochu', content: '芒果要选熟透的，甜度才够。', createdAt: new Date(baseTime - 86400000 * 0.3).toISOString() },
    
    { id: 'c11', recipeId: 'r4', userId: 'u2', userName: '李爸爸', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=libaba', content: '麻辣过瘾，配米饭绝了！', createdAt: new Date(baseTime - 86400000 * 3).toISOString() },
    { id: 'c12', recipeId: 'r4', userId: 'u3', userName: '王小厨', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wangxiaochu', content: '肉片一定要用淀粉腌制才嫩滑。', createdAt: new Date(baseTime - 86400000 * 2).toISOString() },
    
    { id: 'c13', recipeId: 'r5', userId: 'u1', userName: '张妈妈', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangmama', content: '清淡爽口，减脂期必备。', createdAt: new Date(baseTime - 86400000 * 0.5).toISOString() },
    { id: 'c14', recipeId: 'r5', userId: 'u3', userName: '王小厨', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wangxiaochu', content: '焯水时间别太长，保持脆嫩口感。', createdAt: new Date(baseTime - 86400000 * 0.2).toISOString() },
    
    { id: 'c15', recipeId: 'r6', userId: 'u1', userName: '张妈妈', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangmama', content: '太好吃了！就是马斯卡彭有点贵。', createdAt: new Date(baseTime - 86400000 * 5).toISOString() },
    { id: 'c16', recipeId: 'r6', userId: 'u2', userName: '李爸爸', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=libaba', content: '招待朋友的必备甜品，颜值高。', createdAt: new Date(baseTime - 86400000 * 4).toISOString() },
    { id: 'c17', recipeId: 'r6', userId: 'u3', userName: '王小厨', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wangxiaochu', content: '咖啡可以加点朗姆酒，风味更独特。', createdAt: new Date(baseTime - 86400000 * 3).toISOString() },
    
    { id: 'c18', recipeId: 'r7', userId: 'u2', userName: '李爸爸', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=libaba', content: '花生酥脆，鸡肉滑嫩，完美！', createdAt: new Date(baseTime - 86400000 * 6).toISOString() },
    { id: 'c19', recipeId: 'r7', userId: 'u3', userName: '王小厨', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wangxiaochu', content: '碗汁比例很重要，酸甜适口。', createdAt: new Date(baseTime - 86400000 * 5).toISOString() }
  ];
}

// 获取菜谱列表，支持分页和分类筛选
app.get('/api/recipes', (req, res) => {
  const { category, page = 1, limit = 10 } = req.query;
  let filteredRecipes = recipes;

  if (category) {
    filteredRecipes = recipes.filter(r => r.category === category);
  }

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedRecipes = filteredRecipes.slice(startIndex, endIndex);

  res.json({
    total: filteredRecipes.length,
    page: parseInt(page),
    limit: parseInt(limit),
    data: paginatedRecipes
  });
});

// 获取单个菜谱详情
app.get('/api/recipes/:id', (req, res) => {
  const recipe = recipes.find(r => r.id === req.params.id);
  if (!recipe) {
    return res.status(404).json({ message: '菜谱不存在' });
  }
  res.json(recipe);
});

// 给菜谱评分
app.put('/api/recipes/:id/rate', (req, res) => {
  const { rating } = req.body;
  const recipe = recipes.find(r => r.id === req.params.id);

  if (!recipe) {
    return res.status(404).json({ message: '菜谱不存在' });
  }

  if (typeof rating !== 'number' || rating < 1 || rating > 5) {
    return res.status(400).json({ message: '评分必须在1-5之间' });
  }

  const totalRating = recipe.rating * recipe.ratingCount;
  recipe.ratingCount += 1;
  recipe.rating = parseFloat(((totalRating + rating) / recipe.ratingCount).toFixed(1));

  res.json({
    rating: recipe.rating,
    ratingCount: recipe.ratingCount
  });
});

// 获取菜谱评论
app.get('/api/recipes/:id/comments', (req, res) => {
  const recipeComments = comments
    .filter(c => c.recipeId === req.params.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(recipeComments);
});

// 添加评论
app.post('/api/recipes/:id/comments', (req, res) => {
  const recipe = recipes.find(r => r.id === req.params.id);
  if (!recipe) {
    return res.status(404).json({ message: '菜谱不存在' });
  }

  const { userId, content } = req.body;
  const user = users.find(u => u.id === userId);

  if (!user) {
    return res.status(400).json({ message: '用户不存在' });
  }

  if (!content || content.trim() === '') {
    return res.status(400).json({ message: '评论内容不能为空' });
  }

  const newComment = {
    id: uuidv4(),
    recipeId: req.params.id,
    userId: user.id,
    userName: user.name,
    userAvatar: user.avatar,
    content: content.trim(),
    createdAt: new Date().toISOString()
  };

  comments.push(newComment);
  recipe.commentCount += 1;

  res.status(201).json(newComment);
});

// 获取排行榜
app.get('/api/rank', (req, res) => {
  const rankedRecipes = recipes.map(recipe => {
    const score = recipe.rating * 0.7 + recipe.commentCount * 0.3;
    return {
      ...recipe,
      score: parseFloat(score.toFixed(2))
    };
  }).sort((a, b) => b.score - a.score);

  res.json(rankedRecipes);
});

// 初始化数据并启动服务器
function startServer() {
  initUsers();
  initRecipes();
  initComments();

  app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
  });
}

startServer();
