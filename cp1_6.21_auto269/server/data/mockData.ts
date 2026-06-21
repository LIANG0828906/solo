import type { Recipe } from '../types';

const imageBase = 'https://images.unsplash.com';

export const mockRecipes: Recipe[] = [
  {
    id: '1',
    name: '番茄炒蛋',
    coverImage: `${imageBase}/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop`,
    ingredients: [
      { name: '番茄', amount: '2个' },
      { name: '鸡蛋', amount: '3个' },
      { name: '葱花', amount: '适量' },
      { name: '盐', amount: '少许' },
      { name: '白糖', amount: '1勺' }
    ],
    steps: '<ol><li><strong>准备食材</strong>：番茄洗净切块，鸡蛋打散备用。</li><li><strong>炒鸡蛋</strong>：热锅倒油，油温七成热时倒入蛋液，炒至金黄盛出。</li><li><strong>炒番茄</strong>：锅中留底油，放入番茄块翻炒出汁。</li><li><strong>调味</strong>：加入盐和白糖，翻炒均匀。</li><li><strong>混合</strong>：倒入炒好的鸡蛋，翻炒均匀，撒上葱花即可出锅。</li></ol>',
    tags: ['中式', '快手菜', '家常菜'],
    cookTime: 15,
    createdAt: Date.now() - 86400000 * 5,
    isFavorite: false
  },
  {
    id: '2',
    name: '红烧肉',
    coverImage: `${imageBase}/photo-1544025162-d76694265947?w=400&h=300&fit=crop`,
    ingredients: [
      { name: '五花肉', amount: '500g' },
      { name: '冰糖', amount: '30g' },
      { name: '生抽', amount: '2勺' },
      { name: '老抽', amount: '1勺' },
      { name: '料酒', amount: '2勺' },
      { name: '姜片', amount: '5片' },
      { name: '八角', amount: '2个' }
    ],
    steps: '<ol><li><strong>处理肉</strong>：五花肉切成2厘米见方的块，冷水下锅焯水去血沫。</li><li><strong>炒糖色</strong>：锅中放少许油，加入冰糖小火炒出焦糖色。</li><li><strong>煸炒</strong>：放入五花肉翻炒上色，加入姜片和八角。</li><li><strong>炖煮</strong>：加入生抽、老抽、料酒和适量热水，大火烧开后转小火炖45分钟。</li><li><strong>收汁</strong>：开大火收汁，汤汁浓稠即可出锅。</li></ol>',
    tags: ['中式', '硬菜', '经典'],
    cookTime: 60,
    createdAt: Date.now() - 86400000 * 10,
    isFavorite: false
  },
  {
    id: '3',
    name: '提拉米苏',
    coverImage: `${imageBase}/photo-1571877227200-a0d98ea607e9?w=400&h=300&fit=crop`,
    ingredients: [
      { name: '马斯卡彭奶酪', amount: '250g' },
      { name: '手指饼干', amount: '200g' },
      { name: '浓缩咖啡', amount: '200ml' },
      { name: '淡奶油', amount: '150ml' },
      { name: '蛋黄', amount: '3个' },
      { name: '细砂糖', amount: '60g' },
      { name: '可可粉', amount: '适量' }
    ],
    steps: '<ol><li><strong>制作蛋黄糊</strong>：蛋黄加糖隔温水打发至颜色变浅。</li><li><strong>混合奶酪</strong>：马斯卡彭奶酪搅拌顺滑，与蛋黄糊混合。</li><li><strong>打发奶油</strong>：淡奶油打至六分发，拌入奶酪糊中。</li><li><strong>组装</strong>：手指饼干快速蘸咖啡，铺一层，抹一层奶酪糊，重复两层。</li><li><strong>冷藏</strong>：放入冰箱冷藏4小时以上，食用前筛上可可粉。</li></ol>',
    tags: ['甜品', '意式', '下午茶'],
    cookTime: 30,
    createdAt: Date.now() - 86400000 * 3,
    isFavorite: false
  },
  {
    id: '4',
    name: '蒜蓉西兰花',
    coverImage: `${imageBase}/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop`,
    ingredients: [
      { name: '西兰花', amount: '1颗' },
      { name: '大蒜', amount: '5瓣' },
      { name: '盐', amount: '适量' },
      { name: '蚝油', amount: '1勺' }
    ],
    steps: '<ol><li><strong>准备</strong>：西兰花掰成小朵，洗净沥干，大蒜切末。</li><li><strong>焯水</strong>：锅中水烧开，加少许盐和油，放入西兰花焯水1分钟捞出。</li><li><strong>爆香</strong>：热锅倒油，放入蒜末爆香。</li><li><strong>翻炒</strong>：放入西兰花快速翻炒，加盐和蚝油调味。</li><li><strong>出锅</strong>：翻炒均匀即可出锅。</li></ol>',
    tags: ['中式', '快手菜', '素菜', '健康'],
    cookTime: 10,
    createdAt: Date.now() - 86400000 * 7,
    isFavorite: false
  },
  {
    id: '5',
    name: '日式咖喱饭',
    coverImage: `${imageBase}/photo-1585032226651-759b368d7246?w=400&h=300&fit=crop`,
    ingredients: [
      { name: '咖喱块', amount: '1盒' },
      { name: '土豆', amount: '2个' },
      { name: '胡萝卜', amount: '1根' },
      { name: '洋葱', amount: '半个' },
      { name: '鸡胸肉', amount: '200g' },
      { name: '米饭', amount: '适量' }
    ],
    steps: '<ol><li><strong>准备食材</strong>：土豆、胡萝卜切块，洋葱切丁，鸡肉切块。</li><li><strong>煸炒</strong>：热锅放油，先炒洋葱至透明，再加鸡肉翻炒变白。</li><li><strong>炖煮</strong>：加入土豆和胡萝卜，翻炒后加水没过食材，中火煮15分钟。</li><li><strong>加咖喱</strong>：关火，放入咖喱块搅拌融化。</li><li><strong>收汁</strong>：小火煮5分钟至浓稠，浇在米饭上即可。</li></ol>',
    tags: ['日式', '主食', '家常'],
    cookTime: 35,
    createdAt: Date.now() - 86400000 * 2,
    isFavorite: false
  },
  {
    id: '6',
    name: '芒果班戟',
    coverImage: `${imageBase}/photo-1565958011703-44f9829ba187?w=400&h=300&fit=crop`,
    ingredients: [
      { name: '低筋面粉', amount: '80g' },
      { name: '鸡蛋', amount: '2个' },
      { name: '牛奶', amount: '200ml' },
      { name: '淡奶油', amount: '200ml' },
      { name: '糖粉', amount: '30g' },
      { name: '芒果', amount: '2个' },
      { name: '黄油', amount: '15g' }
    ],
    steps: '<ol><li><strong>制作面糊</strong>：鸡蛋打散，加牛奶、融化的黄油、过筛的面粉，搅拌均匀静置20分钟。</li><li><strong>煎班戟皮</strong>：平底锅小火，倒入一勺面糊，转动锅摊成薄饼，一面凝固即可取出。</li><li><strong>打发奶油</strong>：淡奶油加糖粉打至硬性发泡。</li><li><strong>组装</strong>：班戟皮中间放奶油和芒果块，包成四方形即可。</li></ol>',
    tags: ['甜品', '港式', '下午茶'],
    cookTime: 40,
    createdAt: Date.now() - 86400000 * 8,
    isFavorite: false
  },
  {
    id: '7',
    name: '酸辣土豆丝',
    coverImage: `${imageBase}/photo-1586190848861-99aa4a171e90?w=400&h=300&fit=crop`,
    ingredients: [
      { name: '土豆', amount: '2个' },
      { name: '干辣椒', amount: '5个' },
      { name: '花椒', amount: '少许' },
      { name: '醋', amount: '2勺' },
      { name: '盐', amount: '适量' },
      { name: '葱花', amount: '适量' }
    ],
    steps: '<ol><li><strong>切土豆丝</strong>：土豆去皮切细丝，泡水去淀粉，沥干备用。</li><li><strong>爆香</strong>：热锅倒油，放入花椒和干辣椒爆香。</li><li><strong>翻炒</strong>：倒入土豆丝大火快炒。</li><li><strong>调味</strong>：沿锅边淋入醋，加盐翻炒均匀。</li><li><strong>出锅</strong>：撒葱花出锅。</li></ol>',
    tags: ['中式', '快手菜', '素菜', '开胃'],
    cookTime: 8,
    createdAt: Date.now() - 86400000 * 4,
    isFavorite: false
  },
  {
    id: '8',
    name: '意大利面',
    coverImage: `${imageBase}/photo-1563379926898-05f4575a45d8?w=400&h=300&fit=crop`,
    ingredients: [
      { name: '意面', amount: '200g' },
      { name: '番茄', amount: '3个' },
      { name: '洋葱', amount: '半个' },
      { name: '大蒜', amount: '3瓣' },
      { name: '罗勒叶', amount: '适量' },
      { name: '橄榄油', amount: '2勺' },
      { name: '帕玛森芝士', amount: '适量' }
    ],
    steps: '<ol><li><strong>煮意面</strong>：大锅水烧开加盐，放入意面煮至八分熟。</li><li><strong>做酱汁</strong>：洋葱和大蒜切碎，番茄去皮切丁。</li><li><strong>炒酱</strong>：橄榄油炒香洋葱和蒜，加番茄丁熬煮成酱。</li><li><strong>混合</strong>：意面捞出放入酱汁中，翻拌均匀。</li><li><strong>装盘</strong>：撒上罗勒叶和帕玛森芝士碎。</li></ol>',
    tags: ['意式', '主食', '经典'],
    cookTime: 25,
    createdAt: Date.now() - 86400000 * 6,
    isFavorite: false
  },
  {
    id: '9',
    name: '抹茶慕斯蛋糕',
    coverImage: `${imageBase}/photo-1556040220-4096d522378d?w=400&h=300&fit=crop`,
    ingredients: [
      { name: '抹茶粉', amount: '10g' },
      { name: '淡奶油', amount: '300ml' },
      { name: '牛奶', amount: '100ml' },
      { name: '吉利丁片', amount: '10g' },
      { name: '细砂糖', amount: '50g' },
      { name: '消化饼干', amount: '100g' },
      { name: '黄油', amount: '50g' }
    ],
    steps: '<ol><li><strong>做饼底</strong>：消化饼干压碎，拌入融化的黄油，铺在模具底部压实，冷藏备用。</li><li><strong>做抹茶液</strong>：抹茶粉用少许温水调开，加入牛奶和糖。</li><li><strong>融吉利丁</strong>：吉利丁片泡软，隔水融化后加入抹茶液中。</li><li><strong>拌奶油</strong>：淡奶油打至六分发，与抹茶液拌匀。</li><li><strong>冷藏</strong>：倒入模具，冷藏4小时以上即可脱模。</li></ol>',
    tags: ['甜品', '日式', '蛋糕'],
    cookTime: 45,
    createdAt: Date.now() - 86400000 * 1,
    isFavorite: false
  },
  {
    id: '10',
    name: '麻婆豆腐',
    coverImage: `${imageBase}/photo-1582576163090-09d3b6f8a969?w=400&h=300&fit=crop`,
    ingredients: [
      { name: '嫩豆腐', amount: '1盒' },
      { name: '牛肉末', amount: '100g' },
      { name: '郫县豆瓣酱', amount: '2勺' },
      { name: '花椒粉', amount: '1勺' },
      { name: '生抽', amount: '1勺' },
      { name: '淀粉', amount: '适量' },
      { name: '葱花', amount: '适量' }
    ],
    steps: '<ol><li><strong>处理豆腐</strong>：豆腐切小块，焯水后捞出备用。</li><li><strong>炒肉末</strong>：热锅放油，炒香牛肉末。</li><li><strong>炒酱</strong>：加入豆瓣酱炒出红油。</li><li><strong>烧豆腐</strong>：加入水或高汤，放入豆腐，小火煮5分钟。</li><li><strong>勾芡</strong>：水淀粉勾芡，撒花椒粉和葱花即可。</li></ol>',
    tags: ['中式', '川菜', '家常'],
    cookTime: 20,
    createdAt: Date.now() - 86400000 * 12,
    isFavorite: false
  },
  {
    id: '11',
    name: '蒸蛋羹',
    coverImage: `${imageBase}/photo-1482049016gy-e04ae8784e5a?w=400&h=300&fit=crop`,
    ingredients: [
      { name: '鸡蛋', amount: '3个' },
      { name: '温水', amount: '200ml' },
      { name: '盐', amount: '少许' },
      { name: '生抽', amount: '1勺' },
      { name: '香油', amount: '几滴' },
      { name: '葱花', amount: '适量' }
    ],
    steps: '<ol><li><strong>打蛋</strong>：鸡蛋打散，加入温水和盐搅拌均匀。</li><li><strong>过筛</strong>：蛋液过筛去除气泡，口感更细腻。</li><li><strong>蒸</strong>：盖上保鲜膜，水开后中火蒸10-12分钟。</li><li><strong>调味</strong>：淋生抽、香油，撒葱花即可。</li></ol>',
    tags: ['中式', '快手菜', '简单', '早餐'],
    cookTime: 15,
    createdAt: Date.now() - 86400000 * 9,
    isFavorite: false
  },
  {
    id: '12',
    name: '韩式炸鸡',
    coverImage: `${imageBase}/photo-1626645738196-c2a7c87a8f58?w=400&h=300&fit=crop`,
    ingredients: [
      { name: '鸡翅中', amount: '500g' },
      { name: '炸鸡粉', amount: '100g' },
      { name: '韩式辣酱', amount: '3勺' },
      { name: '蜂蜜', amount: '1勺' },
      { name: '蒜末', amount: '1勺' },
      { name: '生抽', amount: '1勺' },
      { name: '白芝麻', amount: '适量' }
    ],
    steps: '<ol><li><strong>腌制</strong>：鸡翅用盐和料酒腌制20分钟。</li><li><strong>裹粉</strong>：鸡翅裹上炸鸡粉，静置5分钟反潮。</li><li><strong>炸制</strong>：油温170度炸8分钟，捞出，油温升至190度复炸2分钟至金黄酥脆。</li><li><strong>做酱汁</strong>：韩式辣酱、蜂蜜、蒜末、生抽混合，小火加热。</li><li><strong>裹酱</strong>：炸好的鸡翅裹上酱汁，撒白芝麻即可。</li></ol>',
    tags: ['韩式', '小吃', '聚餐'],
    cookTime: 50,
    createdAt: Date.now() - 86400000 * 11,
    isFavorite: false
  }
];
