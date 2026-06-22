import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());

const recipes = [
  {
    id: uuidv4(),
    name: '红烧肉',
    author: '厨神小王',
    imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20braised%20pork%20belly%20hongshao%20rou%20food%20photography&image_size=square_hd',
    ingredients: [
      { name: '五花肉', category: '肉类', quantity: 500, unit: 'g', price: 35 },
      { name: '生抽', category: '调料', quantity: 2, unit: '勺', price: 2 },
      { name: '老抽', category: '调料', quantity: 1, unit: '勺', price: 1.5 },
      { name: '冰糖', category: '调料', quantity: 30, unit: 'g', price: 3 },
      { name: '八角', category: '调料', quantity: 2, unit: '个', price: 0.5 },
      { name: '桂皮', category: '调料', quantity: 1, unit: '小块', price: 0.3 },
      { name: '姜片', category: '蔬菜', quantity: 5, unit: '片', price: 1 },
      { name: '葱段', category: '蔬菜', quantity: 2, unit: '根', price: 0.8 }
    ],
    steps: [
      { description: '五花肉切块，冷水下锅焯水去血沫，捞出沥干' },
      { description: '锅中放少许油，加入冰糖小火炒出糖色' },
      { description: '放入五花肉翻炒上色，加入生抽、老抽调味' },
      { description: '加入八角、桂皮、姜片、葱段，倒入热水没过肉块' },
      { description: '大火烧开后转小火炖煮1小时，最后大火收汁即可' }
    ]
  },
  {
    id: uuidv4(),
    name: '西红柿炒鸡蛋',
    author: '家常味道',
    imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=tomato%20egg%20stir%20fry%20chinese%20home%20cooking&image_size=square_hd',
    ingredients: [
      { name: '西红柿', category: '蔬菜', quantity: 3, unit: '个', price: 6 },
      { name: '鸡蛋', category: '蛋类', quantity: 4, unit: '个', price: 4 },
      { name: '葱花', category: '蔬菜', quantity: 1, unit: '把', price: 1 },
      { name: '盐', category: '调料', quantity: 3, unit: 'g', price: 0.2 },
      { name: '白糖', category: '调料', quantity: 5, unit: 'g', price: 0.3 }
    ],
    steps: [
      { description: '西红柿洗净切块，鸡蛋打散加少许盐搅匀' },
      { description: '热锅凉油，倒入蛋液快速翻炒至凝固盛出' },
      { description: '锅中加油，放入西红柿翻炒出汁' },
      { description: '加入盐和白糖调味，倒入炒好的鸡蛋翻炒均匀' },
      { description: '撒上葱花即可出锅' }
    ]
  },
  {
    id: uuidv4(),
    name: '宫保鸡丁',
    author: '川菜大师',
    imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=kung%20pao%20chicken%20sichuan%20cuisine%20spicy%20dish&image_size=square_hd',
    ingredients: [
      { name: '鸡胸肉', category: '肉类', quantity: 300, unit: 'g', price: 18 },
      { name: '花生米', category: '干货', quantity: 50, unit: 'g', price: 4 },
      { name: '干辣椒', category: '调料', quantity: 10, unit: '个', price: 1 },
      { name: '花椒', category: '调料', quantity: 1, unit: '勺', price: 0.5 },
      { name: '生抽', category: '调料', quantity: 1, unit: '勺', price: 1 },
      { name: '醋', category: '调料', quantity: 1, unit: '勺', price: 0.8 },
      { name: '白糖', category: '调料', quantity: 1, unit: '勺', price: 0.3 },
      { name: '淀粉', category: '调料', quantity: 1, unit: '勺', price: 0.4 }
    ],
    steps: [
      { description: '鸡胸肉切丁，用盐、料酒、淀粉腌制15分钟' },
      { description: '调制料汁：生抽、醋、白糖、淀粉、清水搅匀' },
      { description: '花生米炸至金黄酥脆备用' },
      { description: '热油爆香干辣椒和花椒，放入鸡丁滑炒变色' },
      { description: '倒入料汁翻炒浓稠，最后加入花生米炒匀即可' }
    ]
  },
  {
    id: uuidv4(),
    name: '清炒时蔬',
    author: '健康厨房',
    imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=stir%20fried%20mixed%20vegetables%20healthy%20green%20dish&image_size=square_hd',
    ingredients: [
      { name: '西兰花', category: '蔬菜', quantity: 200, unit: 'g', price: 5 },
      { name: '胡萝卜', category: '蔬菜', quantity: 1, unit: '根', price: 2 },
      { name: '木耳', category: '干货', quantity: 10, unit: 'g', price: 1.5 },
      { name: '蒜片', category: '蔬菜', quantity: 3, unit: '瓣', price: 0.5 },
      { name: '盐', category: '调料', quantity: 2, unit: 'g', price: 0.1 },
      { name: '蚝油', category: '调料', quantity: 1, unit: '勺', price: 0.8 }
    ],
    steps: [
      { description: '西兰花切小朵，胡萝卜切片，木耳泡发' },
      { description: '烧开水加少许盐和油，将食材焯水1分钟捞出' },
      { description: '热油爆香蒜片，倒入所有食材快速翻炒' },
      { description: '加盐和蚝油调味，翻炒均匀即可' }
    ]
  },
  {
    id: uuidv4(),
    name: '清蒸鲈鱼',
    author: '粤菜馆',
    imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=steamed%20sea%20bass%20cantonese%20style%20ginger%20scallion&image_size=square_hd',
    ingredients: [
      { name: '鲈鱼', category: '水产', quantity: 1, unit: '条', price: 45 },
      { name: '姜丝', category: '蔬菜', quantity: 10, unit: 'g', price: 0.5 },
      { name: '葱丝', category: '蔬菜', quantity: 20, unit: 'g', price: 0.8 },
      { name: '蒸鱼豉油', category: '调料', quantity: 2, unit: '勺', price: 2 },
      { name: '料酒', category: '调料', quantity: 1, unit: '勺', price: 0.5 }
    ],
    steps: [
      { description: '鲈鱼处理干净，两面划几刀，抹上料酒腌制10分钟' },
      { description: '鱼身铺上姜丝，放入蒸锅' },
      { description: '水开后大火蒸8-10分钟，取出倒掉盘中汁水' },
      { description: '铺上新葱丝，淋上蒸鱼豉油' },
      { description: '烧热油浇在葱丝上激出香味即可' }
    ]
  },
  {
    id: uuidv4(),
    name: '麻婆豆腐',
    author: '老成都',
    imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=mapo%20tofu%20sichuan%20spicy%20minced%20pork&image_size=square_hd',
    ingredients: [
      { name: '嫩豆腐', category: '豆制品', quantity: 1, unit: '盒', price: 3 },
      { name: '猪肉末', category: '肉类', quantity: 100, unit: 'g', price: 8 },
      { name: '豆瓣酱', category: '调料', quantity: 1, unit: '勺', price: 0.8 },
      { name: '花椒粉', category: '调料', quantity: 0.5, unit: '勺', price: 0.3 },
      { name: '生抽', category: '调料', quantity: 1, unit: '勺', price: 1 },
      { name: '淀粉', category: '调料', quantity: 1, unit: '勺', price: 0.4 }
    ],
    steps: [
      { description: '豆腐切小块，放入淡盐水中浸泡' },
      { description: '热油炒散肉末，加入豆瓣酱炒出红油' },
      { description: '加入适量清水烧开，放入豆腐块轻推均匀' },
      { description: '加生抽调味，水淀粉勾芡' },
      { description: '出锅前撒上花椒粉即可' }
    ]
  },
  {
    id: uuidv4(),
    name: '糖醋排骨',
    author: '上海本帮菜',
    imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=sweet%20and%20sour%20pork%20ribs%20shanghai%20style%20glazed&image_size=square_hd',
    ingredients: [
      { name: '猪肋排', category: '肉类', quantity: 400, unit: 'g', price: 32 },
      { name: '生抽', category: '调料', quantity: 1, unit: '勺', price: 1 },
      { name: '老抽', category: '调料', quantity: 0.5, unit: '勺', price: 0.8 },
      { name: '米醋', category: '调料', quantity: 2, unit: '勺', price: 1.5 },
      { name: '白糖', category: '调料', quantity: 2, unit: '勺', price: 0.6 },
      { name: '番茄酱', category: '调料', quantity: 1, unit: '勺', price: 1 },
      { name: '料酒', category: '调料', quantity: 1, unit: '勺', price: 0.5 }
    ],
    steps: [
      { description: '排骨冷水下锅焯水，加料酒去腥，捞出沥干' },
      { description: '调制糖醋汁：生抽、老抽、米醋、白糖、番茄酱搅匀' },
      { description: '排骨裹上干淀粉，油炸至金黄酥脆' },
      { description: '锅中留底油，倒入糖醋汁熬至冒泡' },
      { description: '放入排骨快速翻炒均匀，裹满酱汁即可' }
    ]
  },
  {
    id: uuidv4(),
    name: '蒜蓉西兰花',
    author: '轻食主义',
    imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=garlic%20broccoli%20healthy%20vegetarian%20dish&image_size=square_hd',
    ingredients: [
      { name: '西兰花', category: '蔬菜', quantity: 300, unit: 'g', price: 7 },
      { name: '大蒜', category: '蔬菜', quantity: 5, unit: '瓣', price: 1 },
      { name: '盐', category: '调料', quantity: 2, unit: 'g', price: 0.1 },
      { name: '蚝油', category: '调料', quantity: 1, unit: '勺', price: 0.8 }
    ],
    steps: [
      { description: '西兰花切小朵，用盐水浸泡10分钟' },
      { description: '大蒜切末备用' },
      { description: '烧开水加少许盐，西兰花焯水2分钟捞出' },
      { description: '热油爆香蒜末，放入西兰花快速翻炒' },
      { description: '加盐和蚝油调味，翻炒均匀即可' }
    ]
  },
  {
    id: uuidv4(),
    name: '土豆炖牛肉',
    author: '东北大菜',
    imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=beef%20potato%20stew%20northeast%20chinese%20hearty&image_size=square_hd',
    ingredients: [
      { name: '牛腩', category: '肉类', quantity: 500, unit: 'g', price: 40 },
      { name: '土豆', category: '蔬菜', quantity: 2, unit: '个', price: 3 },
      { name: '胡萝卜', category: '蔬菜', quantity: 1, unit: '根', price: 2 },
      { name: '洋葱', category: '蔬菜', quantity: 0.5, unit: '个', price: 1.5 },
      { name: '生抽', category: '调料', quantity: 2, unit: '勺', price: 2 },
      { name: '老抽', category: '调料', quantity: 1, unit: '勺', price: 1.5 },
      { name: '八角', category: '调料', quantity: 1, unit: '个', price: 0.3 }
    ],
    steps: [
      { description: '牛腩切块，冷水下锅焯水去血沫' },
      { description: '土豆、胡萝卜切滚刀块，洋葱切片' },
      { description: '热油炒香洋葱，放入牛腩翻炒' },
      { description: '加生抽、老抽、八角，倒入热水烧开' },
      { description: '转小火炖1小时，加入土豆胡萝卜再炖30分钟即可' }
    ]
  },
  {
    id: uuidv4(),
    name: '蛋炒饭',
    author: '深夜食堂',
    imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=egg%20fried%20rice%20golden%20fluffy%20chinese%20style&image_size=square_hd',
    ingredients: [
      { name: '隔夜米饭', category: '主食', quantity: 2, unit: '碗', price: 2 },
      { name: '鸡蛋', category: '蛋类', quantity: 2, unit: '个', price: 2 },
      { name: '葱花', category: '蔬菜', quantity: 1, unit: '把', price: 1 },
      { name: '盐', category: '调料', quantity: 2, unit: 'g', price: 0.1 },
      { name: '生抽', category: '调料', quantity: 0.5, unit: '勺', price: 0.5 }
    ],
    steps: [
      { description: '米饭提前用筷子拨散，鸡蛋打散' },
      { description: '热油倒入蛋液，快速炒至半凝固' },
      { description: '倒入米饭继续大火翻炒均匀' },
      { description: '加盐和生抽调味，翻炒至米粒分明' },
      { description: '最后撒上葱花炒匀即可出锅' }
    ]
  }
];

app.get('/api/recipes', (req, res) => {
  res.json(recipes);
});

app.get('/api/recipes/:id', (req, res) => {
  const recipe = recipes.find(r => r.id === req.params.id);
  if (!recipe) {
    return res.status(404).json({ message: '食谱不存在' });
  }
  res.json(recipe);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
