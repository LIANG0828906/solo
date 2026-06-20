import { v4 as uuidv4 } from 'uuid';

export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  avatar: string;
  createdAt: Date;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  image: string;
  ingredients: string[];
  steps: string[];
  tags: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  cookingTime: number;
  servings: number;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  likes: string[];
  rating: number;
  ratingCount: number;
  createdAt: Date;
}

export interface Comment {
  id: string;
  recipeId: string;
  userId: string;
  username: string;
  userAvatar: string;
  content: string;
  rating: number;
  createdAt: Date;
}

interface DataStore {
  users: User[];
  recipes: Recipe[];
  comments: Comment[];
}

const avatarUrls = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Max',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Zoe',
];

const foodImages = [
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800',
  'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800',
  'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800',
  'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
  'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800',
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800',
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800',
  'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=800',
];

const allTags = ['中餐', '西餐', '日料', '甜点', '素食', '快手菜', '家常菜', '下饭菜', '早餐', '养生'];

export const dataStore: DataStore = {
  users: [],
  recipes: [],
  comments: [],
};

function createMockUsers(): User[] {
  const mockUsernames = ['美食达人小王', '厨房新手小李', '烘焙爱好者', '川菜大师', '健康饮食家'];
  return mockUsernames.map((username, index) => ({
    id: uuidv4(),
    username,
    email: `user${index + 1}@example.com`,
    password: '123456',
    avatar: avatarUrls[index % avatarUrls.length],
    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
  }));
}

function createMockRecipes(users: User[]): Recipe[] {
  const mockRecipes = [
    {
      title: '番茄炒蛋',
      description: '经典家常菜，酸甜可口，简单易做，是每个厨房新手必学的第一道菜。',
      ingredients: ['番茄 2个', '鸡蛋 3个', '葱花 适量', '盐 适量', '糖 1小勺', '食用油 适量'],
      steps: [
        '番茄洗净切块，鸡蛋打散加少许盐搅匀',
        '热锅冷油，倒入蛋液，炒至凝固盛出',
        '锅中再加少许油，放入番茄翻炒出汁',
        '加入盐和糖调味，倒入炒好的鸡蛋',
        '翻炒均匀，撒上葱花出锅',
      ],
      tags: ['家常菜', '下饭菜', '快手菜'],
      difficulty: 'easy' as const,
      cookingTime: 15,
      servings: 2,
      image: foodImages[0],
    },
    {
      title: '红烧肉',
      description: '肥而不腻，入口即化的经典红烧肉，色泽红亮，香气四溢。',
      ingredients: ['五花肉 500g', '冰糖 30g', '生抽 2勺', '老抽 1勺', '料酒 2勺', '姜片 适量', '八角 2个', '桂皮 1小块'],
      steps: [
        '五花肉切块，冷水下锅焯水去血沫，捞出沥干',
        '锅中放少许油，加冰糖小火炒出糖色',
        '放入五花肉翻炒均匀上色',
        '加入姜片、八角、桂皮炒香',
        '倒入料酒、生抽、老抽翻炒',
        '加开水没过肉，大火烧开转小火炖1小时',
        '大火收汁即可出锅',
      ],
      tags: ['中餐', '家常菜', '下饭菜'],
      difficulty: 'medium' as const,
      cookingTime: 90,
      servings: 4,
      image: foodImages[1],
    },
    {
      title: '意大利肉酱面',
      description: '浓郁番茄肉酱配上Q弹意面，经典意式风味，在家也能做出餐厅级别的味道。',
      ingredients: ['意大利面 200g', '牛肉末 200g', '番茄 3个', '洋葱 半个', '大蒜 3瓣', '番茄酱 2勺', '橄榄油 适量', '盐和黑胡椒 适量', '帕玛森芝士 适量'],
      steps: [
        '番茄去皮切丁，洋葱和大蒜切末',
        '锅中加橄榄油，炒香洋葱和蒜末',
        '加入牛肉末炒至变色',
        '加入番茄丁和番茄酱，小火煮20分钟',
        '另起一锅煮意面至八分熟',
        '将意面加入肉酱中拌匀',
        '装盘撒上帕玛森芝士和黑胡椒',
      ],
      tags: ['西餐', '下饭菜'],
      difficulty: 'medium' as const,
      cookingTime: 40,
      servings: 2,
      image: foodImages[2],
    },
    {
      title: '日式照烧鸡腿',
      description: '外焦里嫩的照烧鸡腿，甜咸适中的照烧酱汁，配上米饭简直绝了。',
      ingredients: ['鸡腿 2个', '酱油 3勺', '味淋 2勺', '清酒 1勺', '糖 1勺', '蒜末 1小勺', '姜末 少许', '白芝麻 适量'],
      steps: [
        '鸡腿去骨，用叉子在肉面扎几下便于入味',
        '调制照烧酱：酱油、味淋、清酒、糖、蒜末、姜末混合',
        '平底锅不放油，鸡皮朝下煎至金黄出油',
        '翻面继续煎至两面金黄',
        '倒入照烧酱，小火收汁至浓稠',
        '切片装盘，撒上白芝麻',
      ],
      tags: ['日料', '下饭菜', '家常菜'],
      difficulty: 'easy' as const,
      cookingTime: 30,
      servings: 2,
      image: foodImages[3],
    },
    {
      title: '提拉米苏',
      description: '经典意式甜点，绵密细腻的口感，咖啡与马斯卡彭的完美融合。',
      ingredients: ['马斯卡彭奶酪 250g', '手指饼干 200g', '浓缩咖啡 200ml', '蛋黄 3个', '细砂糖 80g', '淡奶油 200ml', '可可粉 适量', '朗姆酒 1勺'],
      steps: [
        '蛋黄加糖隔水加热打发至颜色变浅',
        '加入马斯卡彭奶酪拌匀',
        '淡奶油打发至六分发，与奶酪糊混合',
        '咖啡加朗姆酒混合，手指饼干快速蘸取',
        '一层饼干一层奶酪糊交替铺放',
        '冷藏4小时以上，食用前筛可可粉',
      ],
      tags: ['甜点', '西餐'],
      difficulty: 'hard' as const,
      cookingTime: 60,
      servings: 6,
      image: foodImages[4],
    },
    {
      title: '麻婆豆腐',
      description: '麻辣鲜香，嫩滑入味的经典川菜，豆腐配上肉末，好吃到停不下来。',
      ingredients: ['嫩豆腐 1块', '牛肉末 100g', '郫县豆瓣酱 2勺', '花椒粉 1小勺', '蒜末 适量', '葱花 适量', '生抽 1勺', '淀粉 适量'],
      steps: [
        '豆腐切小块，用盐水浸泡5分钟',
        '锅中放油，炒香牛肉末盛出',
        '锅中留底油，炒香豆瓣酱和蒜末',
        '加水烧开，放入豆腐块',
        '加入生抽，小火煮3分钟',
        '勾芡，倒入牛肉末，撒花椒粉和葱花',
      ],
      tags: ['中餐', '下饭菜', '家常菜'],
      difficulty: 'easy' as const,
      cookingTime: 25,
      servings: 2,
      image: foodImages[5],
    },
    {
      title: '牛油果三明治',
      description: '健康美味的快手早餐，牛油果的绵密配上鸡蛋的营养，活力一整天。',
      ingredients: ['全麦吐司 2片', '牛油果 1个', '鸡蛋 1个', '生菜 适量', '番茄 2片', '盐和黑胡椒 适量', '柠檬汁 几滴'],
      steps: [
        '吐司烤至金黄酥脆',
        '牛油果去核压成泥，加柠檬汁、盐、黑胡椒拌匀',
        '煎一个溏心蛋',
        '吐司抹上牛油果泥',
        '依次放上生菜、番茄、煎蛋',
        '盖上另一片吐司，对半切开',
      ],
      tags: ['早餐', '素食', '快手菜', '健康饮食'],
      difficulty: 'easy' as const,
      cookingTime: 10,
      servings: 1,
      image: foodImages[6],
    },
    {
      title: '水煮鱼',
      description: '麻辣鲜香的经典川菜，鱼片嫩滑，汤汁浓郁，喜欢辣的朋友一定不能错过。',
      ingredients: ['草鱼 1条', '豆芽 200g', '干辣椒 50g', '花椒 20g', '郫县豆瓣酱 3勺', '姜蒜 适量', '淀粉 适量', '盐和料酒 适量'],
      steps: [
        '鱼片成片，用盐、料酒、淀粉腌制15分钟',
        '豆芽焯水铺在盆底',
        '锅中放油，炒香豆瓣酱、姜蒜',
        '加水烧开，放入鱼头鱼骨煮5分钟',
        '一片片放入鱼片，煮至变色',
        '连汤倒入盆中，撒上干辣椒和花椒',
        '淋上热油激出香味',
      ],
      tags: ['中餐', '下饭菜'],
      difficulty: 'hard' as const,
      cookingTime: 50,
      servings: 4,
      image: foodImages[7],
    },
    {
      title: '藜麦蔬菜沙拉',
      description: '营养均衡的健康沙拉，藜麦富含蛋白质，配上新鲜蔬菜，低卡又美味。',
      ingredients: ['藜麦 100g', '樱桃番茄 10颗', '黄瓜 半根', '紫甘蓝 适量', '玉米粒 50g', '牛油果 半个', '橄榄油 2勺', '柠檬汁 1勺', '盐和黑胡椒 适量'],
      steps: [
        '藜麦洗净，加水煮15分钟至透明，沥干放凉',
        '樱桃番茄对半切，黄瓜切片',
        '紫甘蓝切丝，牛油果切丁',
        '所有食材放入大碗',
        '淋上橄榄油、柠檬汁，加盐和黑胡椒拌匀',
      ],
      tags: ['素食', '养生', '健康饮食'],
      difficulty: 'easy' as const,
      cookingTime: 20,
      servings: 2,
      image: foodImages[8],
    },
    {
      title: '蒜蓉粉丝蒸虾',
      description: '鲜嫩的大虾配上爽滑的粉丝，蒜蓉的香气完全渗透，简单又上档次。',
      ingredients: ['大虾 12只', '粉丝 1把', '大蒜 1头', '生抽 2勺', '蚝油 1勺', '糖 半勺', '葱花 适量', '食用油 适量'],
      steps: [
        '粉丝用温水泡软，铺在盘底',
        '虾去虾线，开背摆在粉丝上',
        '大蒜切末，一半炸至金黄，一半生蒜混合',
        '加入生抽、蚝油、糖调成蒜蓉酱',
        '将蒜蓉酱浇在虾上',
        '水开后蒸6-8分钟',
        '出锅撒葱花，淋上热油',
      ],
      tags: ['中餐', '家常菜'],
      difficulty: 'medium' as const,
      cookingTime: 25,
      servings: 3,
      image: foodImages[9],
    },
    {
      title: '抹茶千层蛋糕',
      description: '层层薄饼与奶油叠加，抹茶的微苦与奶油的香甜完美平衡。',
      ingredients: ['低筋面粉 100g', '抹茶粉 10g', '鸡蛋 2个', '牛奶 250ml', '糖 40g', '黄油 20g', '淡奶油 300ml', '糖粉 30g'],
      steps: [
        '面粉、抹茶粉、糖混合，加鸡蛋和牛奶搅匀',
        '加入融化黄油拌匀，过筛静置30分钟',
        '小火摊成薄饼，约15-18张，放凉',
        '淡奶油加糖粉打发',
        '一层饼皮一层奶油交替叠放',
        '冷藏4小时，食用前筛抹茶粉',
      ],
      tags: ['甜点'],
      difficulty: 'hard' as const,
      cookingTime: 90,
      servings: 8,
      image: foodImages[4],
    },
    {
      title: '皮蛋瘦肉粥',
      description: '广式经典早餐，绵软香滑，咸鲜可口，暖身又养胃。',
      ingredients: ['大米 1杯', '皮蛋 2个', '瘦肉 150g', '姜丝 适量', '葱花 适量', '盐 适量', '白胡椒粉 少许', '香油 几滴'],
      steps: [
        '大米洗净，加水浸泡30分钟',
        '瘦肉切丝，用盐和料酒腌制',
        '皮蛋切小块',
        '大米加水大火煮开，转小火熬40分钟',
        '加入肉丝和姜丝，煮至肉丝变色',
        '加入皮蛋，再煮5分钟',
        '加盐、白胡椒粉调味，撒葱花滴香油',
      ],
      tags: ['早餐', '养生', '家常菜'],
      difficulty: 'easy' as const,
      cookingTime: 60,
      servings: 3,
      image: foodImages[6],
    },
  ];

  return mockRecipes.map((recipe, index) => {
    const user = users[index % users.length];
    const likeCount = Math.floor(Math.random() * 50) + 5;
    const randomLikers = users
      .filter((_, i) => i !== index % users.length)
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(likeCount, users.length - 1))
      .map((u) => u.id);

    return {
      id: uuidv4(),
      ...recipe,
      authorId: user.id,
      authorName: user.username,
      authorAvatar: user.avatar,
      likes: randomLikers,
      rating: 3.5 + Math.random() * 1.5,
      ratingCount: Math.floor(Math.random() * 30) + 3,
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    };
  });
}

function createMockComments(users: User[], recipes: Recipe[]): Comment[] {
  const commentContents = [
    '太棒了！照着做成功了，家人都说好吃！',
    '菜谱很详细，新手也能上手，味道很赞~',
    '收藏了，下次一定要试试！',
    '做出来色香味俱全，感谢分享！',
    '稍微调整了一下配料，依然很好吃！',
    '步骤清晰，图片也很有食欲，已收藏~',
    '试做了一次，非常成功！孩子超喜欢。',
    '这个做法真的绝了，比外面餐厅的还好吃！',
    '厨房小白表示无压力，感谢这么详细的教程！',
    '味道很不错，就是我做的时候盐放多了一点。',
  ];

  const comments: Comment[] = [];
  recipes.forEach((recipe) => {
    const commentCount = Math.floor(Math.random() * 5) + 1;
    const commentUsers = [...users].sort(() => Math.random() - 0.5).slice(0, commentCount);
    commentUsers.forEach((user, idx) => {
      comments.push({
        id: uuidv4(),
        recipeId: recipe.id,
        userId: user.id,
        username: user.username,
        userAvatar: user.avatar,
        content: commentContents[Math.floor(Math.random() * commentContents.length)],
        rating: 4 + Math.floor(Math.random() * 2),
        createdAt: new Date(recipe.createdAt.getTime() + (idx + 1) * 24 * 60 * 60 * 1000),
      });
    });
  });
  return comments;
}

export function initializeMockData(): void {
  const users = createMockUsers();
  dataStore.users = users;
  const recipes = createMockRecipes(users);
  dataStore.recipes = recipes;
  dataStore.comments = createMockComments(users, recipes);
}
