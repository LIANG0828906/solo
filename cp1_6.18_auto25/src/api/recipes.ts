import { v4 as uuidv4 } from 'uuid';

export interface Comment {
  id: string;
  recipeId: string;
  user: string;
  avatar: string;
  content: string;
  createdAt: Date;
  likes: number;
  liked: boolean;
  replies: Comment[];
}

export interface Recipe {
  id: string;
  name: string;
  author: string;
  rating: number;
  imageUrl: string;
  ingredients: string[];
  steps: string[];
  createdAt: Date;
  comments: Comment[];
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const createInitialRecipes = (): Recipe[] => {
  const now = Date.now();
  const hoursAgo = (h: number) => new Date(now - h * 60 * 60 * 1000);

  const recipes: Recipe[] = [
    {
      id: uuidv4(),
      name: '红烧肉',
      author: '王大妈',
      rating: 4.5,
      imageUrl: 'https://images.unsplash.com/photo-1623595119708-26b1f7500c3f?w=600&h=400&fit=crop',
      ingredients: ['五花肉 500g', '冰糖 30g', '生抽 2勺', '老抽 1勺', '料酒 2勺', '姜 3片', '八角 2个', '桂皮 1小块'],
      steps: [
        '五花肉切成3cm见方的块，冷水下锅焯水去除血水，捞出沥干备用。',
        '锅中放少许油，加入冰糖小火炒出糖色，注意不要炒糊。',
        '放入五花肉翻炒均匀，让每块肉都裹上糖色。',
        '加入生抽、老抽、料酒调味，放入姜片、八角、桂皮。',
        '加入没过肉的热水，大火烧开后转小火炖煮60分钟。',
        '最后大火收汁，汤汁浓稠即可出锅。'
      ],
      createdAt: hoursAgo(2),
      comments: [
        {
          id: uuidv4(),
          recipeId: '',
          user: '小李',
          avatar: 'L',
          content: '做出来太香了！家人都很喜欢，收藏了。',
          createdAt: hoursAgo(1),
          likes: 12,
          liked: false,
          replies: []
        }
      ]
    },
    {
      id: uuidv4(),
      name: '番茄炒蛋',
      author: '厨房小白',
      rating: 4.0,
      imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop',
      ingredients: ['番茄 2个', '鸡蛋 3个', '葱花 适量', '盐 适量', '糖 1勺'],
      steps: [
        '番茄去皮切块，鸡蛋打散加少许盐搅匀。',
        '热锅冷油，倒入蛋液快速翻炒至凝固盛出。',
        '锅中再加少许油，放入番茄翻炒出汁。',
        '加入糖和盐调味，倒入炒好的鸡蛋翻匀。',
        '撒上葱花出锅即可。'
      ],
      createdAt: hoursAgo(5),
      comments: []
    },
    {
      id: uuidv4(),
      name: '麻婆豆腐',
      author: '川菜爱好者',
      rating: 4.8,
      imageUrl: 'https://images.unsplash.com/photo-1582452932307-f63b7594ab6f?w=600&h=400&fit=crop',
      ingredients: ['嫩豆腐 1块', '猪肉末 100g', '豆瓣酱 2勺', '花椒粉 1勺', '蒜末 适量', '葱花 适量', '生抽 1勺'],
      steps: [
        '豆腐切成2cm见方的块，用淡盐水浸泡备用。',
        '热锅放油，放入肉末炒散至变色。',
        '加入豆瓣酱和蒜末炒出红油。',
        '加入适量清水烧开，放入豆腐块。',
        '小火炖煮5分钟让豆腐入味，加入生抽调味。',
        '水淀粉勾芡，出锅前撒上花椒粉和葱花。'
      ],
      createdAt: hoursAgo(8),
      comments: []
    },
    {
      id: uuidv4(),
      name: '清蒸鲈鱼',
      author: '海鲜达人',
      rating: 4.7,
      imageUrl: 'https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=600&h=400&fit=crop',
      ingredients: ['鲈鱼 1条', '姜丝 适量', '葱丝 适量', '蒸鱼豉油 3勺', '料酒 1勺'],
      steps: [
        '鲈鱼处理干净，两面划几刀，抹上料酒腌制10分钟。',
        '盘底铺上姜丝，放上鲈鱼，鱼肚子里也塞入姜丝。',
        '水开后上锅蒸8分钟，关火虚蒸2分钟。',
        '倒掉盘中蒸出的汤汁，铺上葱丝。',
        '淋上热油，再淋上蒸鱼豉油即可。'
      ],
      createdAt: hoursAgo(12),
      comments: []
    },
    {
      id: uuidv4(),
      name: '糖醋排骨',
      author: '美食家阿强',
      rating: 4.6,
      imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&h=400&fit=crop',
      ingredients: ['排骨 500g', '醋 3勺', '糖 2勺', '生抽 2勺', '料酒 1勺', '番茄酱 2勺', '姜片 适量'],
      steps: [
        '排骨冷水下锅焯水，捞出沥干水分。',
        '调制糖醋汁：醋、糖、生抽、料酒、番茄酱混合均匀。',
        '锅中放油，放入排骨煎至两面金黄。',
        '加入姜片炒香，倒入糖醋汁。',
        '加入没过排骨的清水，大火烧开转小火炖30分钟。',
        '大火收汁至浓稠即可。'
      ],
      createdAt: hoursAgo(24),
      comments: []
    },
    {
      id: uuidv4(),
      name: '宫保鸡丁',
      author: '老北京厨子',
      rating: 4.3,
      imageUrl: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=600&h=400&fit=crop',
      ingredients: ['鸡胸肉 300g', '花生米 50g', '干辣椒 10个', '花椒 1勺', '葱段 适量', '生抽 1勺', '醋 1勺', '糖 1勺'],
      steps: [
        '鸡胸肉切丁，加生抽、料酒、淀粉腌制15分钟。',
        '调制碗汁：生抽、醋、糖、淀粉、少许清水混合。',
        '热锅凉油，放入花生米炸至金黄酥脆捞出。',
        '锅中留底油，放入干辣椒和花椒炒香。',
        '放入鸡丁快速翻炒至变色。',
        '倒入碗汁翻炒均匀，最后加入花生米和葱段翻匀出锅。'
      ],
      createdAt: hoursAgo(36),
      comments: []
    },
    {
      id: uuidv4(),
      name: '蒜蓉西兰花',
      author: '健康厨房',
      rating: 4.2,
      imageUrl: 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=600&h=400&fit=crop',
      ingredients: ['西兰花 1颗', '蒜末 3勺', '盐 适量', '蚝油 1勺'],
      steps: [
        '西兰花掰成小朵，淡盐水浸泡10分钟后洗净。',
        '烧一锅开水，加少许盐和油，放入西兰花焯水1分钟捞出。',
        '热锅放油，放入蒜末小火炒出香味。',
        '放入西兰花翻炒均匀。',
        '加入蚝油和少许盐调味即可出锅。'
      ],
      createdAt: hoursAgo(48),
      comments: []
    },
    {
      id: uuidv4(),
      name: '可乐鸡翅',
      author: '小朋友最爱',
      rating: 4.4,
      imageUrl: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=600&h=400&fit=crop',
      ingredients: ['鸡翅 8个', '可乐 1罐', '生抽 2勺', '老抽 1勺', '姜片 适量', '葱段 适量'],
      steps: [
        '鸡翅两面划几刀，冷水下锅焯水，捞出沥干。',
        '锅中放少许油，放入鸡翅煎至两面金黄。',
        '加入姜片和葱段炒香。',
        '倒入可乐没过鸡翅，加入生抽和老抽。',
        '大火烧开转小火炖20分钟。',
        '大火收汁至浓稠即可。'
      ],
      createdAt: hoursAgo(72),
      comments: []
    },
    {
      id: uuidv4(),
      name: '鱼香肉丝',
      author: '川味小厨',
      rating: 4.5,
      imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&h=400&fit=crop',
      ingredients: ['猪里脊肉 300g', '胡萝卜 1根', '木耳 适量', '泡椒 3个', '蒜末 适量', '醋 2勺', '糖 2勺', '生抽 1勺', '淀粉 适量'],
      steps: [
        '猪肉切丝，加生抽、料酒、淀粉腌制10分钟。',
        '胡萝卜切丝，木耳泡发切丝，泡椒切碎。',
        '调制鱼香汁：醋、糖、生抽、淀粉、清水混合。',
        '热锅放油，放入肉丝滑炒至变色盛出。',
        '锅中留底油，放入泡椒和蒜末炒香。',
        '放入胡萝卜丝和木耳丝翻炒，倒入肉丝。',
        '淋入鱼香汁翻炒均匀即可出锅。'
      ],
      createdAt: hoursAgo(96),
      comments: []
    },
    {
      id: uuidv4(),
      name: '蛋炒饭',
      author: '深夜食堂',
      rating: 4.1,
      imageUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&h=400&fit=crop',
      ingredients: ['隔夜米饭 1碗', '鸡蛋 2个', '葱花 适量', '盐 适量', '生抽 半勺'],
      steps: [
        '鸡蛋打散，米饭用筷子拨散。',
        '热锅多放油，油热后倒入蛋液。',
        '蛋液刚凝固时立即倒入米饭快速翻炒。',
        '让每粒米饭都裹上蛋液，炒至米粒分明。',
        '加盐和生抽调味，撒上葱花翻匀出锅。'
      ],
      createdAt: hoursAgo(120),
      comments: []
    }
  ];

  recipes.forEach(r => {
    r.comments.forEach(c => {
      c.recipeId = r.id;
    });
  });

  return recipes;
};

let recipes: Recipe[] = createInitialRecipes();

export const fetchRecipes = async (): Promise<Recipe[]> => {
  await delay(200);
  return [...recipes].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};

export const fetchRecipeById = async (id: string): Promise<Recipe | null> => {
  await delay(150);
  const recipe = recipes.find(r => r.id === id);
  return recipe ? { ...recipe } : null;
};

export const createRecipe = async (data: Omit<Recipe, 'id' | 'createdAt' | 'comments' | 'rating'>): Promise<Recipe> => {
  await delay(300);
  const newRecipe: Recipe = {
    ...data,
    id: uuidv4(),
    rating: 0,
    createdAt: new Date(),
    comments: []
  };
  recipes.unshift(newRecipe);
  return { ...newRecipe };
};

export const addComment = async (recipeId: string, content: string, user: string): Promise<Comment | null> => {
  await delay(200);
  const recipe = recipes.find(r => r.id === recipeId);
  if (!recipe) return null;

  const newComment: Comment = {
    id: uuidv4(),
    recipeId,
    user,
    avatar: user.charAt(0).toUpperCase(),
    content,
    createdAt: new Date(),
    likes: 0,
    liked: false,
    replies: []
  };
  recipe.comments.push(newComment);
  return { ...newComment };
};

export const toggleCommentLike = async (recipeId: string, commentId: string): Promise<Comment | null> => {
  await delay(100);
  const recipe = recipes.find(r => r.id === recipeId);
  if (!recipe) return null;

  const comment = recipe.comments.find(c => c.id === commentId);
  if (!comment) return null;

  comment.liked = !comment.liked;
  comment.likes += comment.liked ? 1 : -1;
  return { ...comment };
};
