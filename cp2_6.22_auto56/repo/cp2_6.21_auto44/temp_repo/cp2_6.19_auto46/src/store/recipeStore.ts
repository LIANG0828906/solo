import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export interface Ingredient {
  id: string;
  name: string;
  quantity: string;
  checked: boolean;
}

export interface CookingStep {
  id: string;
  order: number;
  description: string;
  duration: number;
  tip?: string;
}

export interface Comment {
  id: string;
  recipeId: string;
  user: {
    id: string;
    name: string;
    avatar: string;
  };
  rating: number;
  content: string;
  createdAt: string;
}

export interface Recipe {
  id: string;
  title: string;
  coverImage: string;
  author: {
    id: string;
    name: string;
    avatar: string;
  };
  ingredients: Ingredient[];
  steps: CookingStep[];
  averageRating: number;
  totalRatings: number;
  favorites: number;
  createdAt: string;
}

export interface Collection {
  id: string;
  name: string;
  icon: string;
  recipeIds: string[];
  createdAt: string;
}

interface RecipeState {
  recipes: Recipe[];
  collections: Collection[];
  comments: Comment[];
  activeCollectionId: string | null;
  isDragging: boolean;
  dragRecipeId: string | null;
  highlightCollectionId: string | null;
  flyingRecipeId: string | null;
  addComment: (recipeId: string, rating: number, content: string) => void;
  updateIngredientChecked: (recipeId: string, ingredientId: string, checked: boolean) => void;
  toggleFavorite: (recipeId: string) => void;
  addCollection: (name: string, icon: string) => void;
  deleteCollection: (collectionId: string) => void;
  addRecipeToCollection: (recipeId: string, collectionId: string) => void;
  removeRecipeFromCollection: (recipeId: string, collectionId: string) => void;
  setActiveCollection: (collectionId: string | null) => void;
  setDragging: (isDragging: boolean, recipeId: string | null) => void;
  setHighlightCollection: (collectionId: string | null) => void;
  setFlyingRecipe: (recipeId: string | null) => void;
  getRecipeById: (id: string) => Recipe | undefined;
  getCommentsByRecipeId: (recipeId: string) => Comment[];
}

const mockRecipes: Recipe[] = [
  {
    id: uuidv4(),
    title: '红烧肉',
    coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20braised%20pork%20belly%20hongshao%20rou%20in%20a%20ceramic%20bowl%20warm%20lighting%20food%20photography&image_size=square_hd',
    author: {
      id: 'user1',
      name: '王妈妈',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mom1'
    },
    ingredients: [
      { id: uuidv4(), name: '五花肉', quantity: '500g', checked: false },
      { id: uuidv4(), name: '冰糖', quantity: '30g', checked: false },
      { id: uuidv4(), name: '生抽', quantity: '3勺', checked: false },
      { id: uuidv4(), name: '老抽', quantity: '1勺', checked: false },
      { id: uuidv4(), name: '料酒', quantity: '2勺', checked: false },
      { id: uuidv4(), name: '姜片', quantity: '5片', checked: false },
      { id: uuidv4(), name: '八角', quantity: '2个', checked: false },
      { id: uuidv4(), name: '桂皮', quantity: '1小块', checked: false }
    ],
    steps: [
      { id: uuidv4(), order: 1, description: '五花肉切成2厘米见方的块，冷水下锅焯水去血沫，捞出沥干', duration: 300, tip: '冷水下锅能更好地去除血水和腥味' },
      { id: uuidv4(), order: 2, description: '锅中放少许油，加入冰糖小火炒出糖色', duration: 180, tip: '炒糖色一定要小火，避免炒糊发苦' },
      { id: uuidv4(), order: 3, description: '放入五花肉翻炒均匀，让每块肉都裹上糖色', duration: 120 },
      { id: uuidv4(), order: 4, description: '加入生抽、老抽、料酒调味，放入姜片、八角、桂皮', duration: 60 },
      { id: uuidv4(), order: 5, description: '加入没过肉的开水，大火烧开后转小火慢炖', duration: 2700, tip: '一定要加开水，肉质才会软嫩' },
      { id: uuidv4(), order: 6, description: '最后大火收汁，汤汁浓稠包裹住肉块即可出锅', duration: 300 }
    ],
    averageRating: 4.8,
    totalRatings: 156,
    favorites: 328,
    createdAt: '2024-01-15'
  },
  {
    id: uuidv4(),
    title: '番茄炒蛋',
    coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20tomato%20egg%20stir%20fry%20in%20a%20white%20bowl%20home%20style%20cooking%20warm%20light&image_size=square_hd',
    author: {
      id: 'user2',
      name: '李阿姨',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=auntie2'
    },
    ingredients: [
      { id: uuidv4(), name: '番茄', quantity: '3个', checked: false },
      { id: uuidv4(), name: '鸡蛋', quantity: '4个', checked: false },
      { id: uuidv4(), name: '葱花', quantity: '适量', checked: false },
      { id: uuidv4(), name: '盐', quantity: '适量', checked: false },
      { id: uuidv4(), name: '白糖', quantity: '1小勺', checked: false },
      { id: uuidv4(), name: '食用油', quantity: '适量', checked: false }
    ],
    steps: [
      { id: uuidv4(), order: 1, description: '番茄洗净切块，鸡蛋打散加少许盐搅匀', duration: 120 },
      { id: uuidv4(), order: 2, description: '热锅倒油，油温七成热时倒入蛋液，快速滑散盛出', duration: 90, tip: '油温要够高，鸡蛋才会蓬松' },
      { id: uuidv4(), order: 3, description: '锅中留底油，放入番茄块翻炒出汁', duration: 180, tip: '番茄要炒软出汁才好吃' },
      { id: uuidv4(), order: 4, description: '加入白糖和盐调味，让番茄充分出汁', duration: 120 },
      { id: uuidv4(), order: 5, description: '倒入炒好的鸡蛋，翻炒均匀撒上葱花即可', duration: 60 }
    ],
    averageRating: 4.6,
    totalRatings: 289,
    favorites: 512,
    createdAt: '2024-02-20'
  },
  {
    id: uuidv4(),
    title: '清蒸鲈鱼',
    coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20steamed%20sea%20bass%20fish%20with%20ginger%20scallion%20on%20a%20white%20plate%20elegant%20food%20photography&image_size=square_hd',
    author: {
      id: 'user3',
      name: '张叔叔',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=uncle3'
    },
    ingredients: [
      { id: uuidv4(), name: '鲈鱼', quantity: '1条约600g', checked: false },
      { id: uuidv4(), name: '葱', quantity: '3根', checked: false },
      { id: uuidv4(), name: '姜', quantity: '1块', checked: false },
      { id: uuidv4(), name: '蒸鱼豉油', quantity: '3勺', checked: false },
      { id: uuidv4(), name: '料酒', quantity: '1勺', checked: false },
      { id: uuidv4(), name: '食用油', quantity: '2勺', checked: false }
    ],
    steps: [
      { id: uuidv4(), order: 1, description: '鲈鱼处理干净，两面各划3刀，抹上料酒腌制15分钟', duration: 900 },
      { id: uuidv4(), order: 2, description: '葱切丝，姜切片，将部分姜片放入鱼肚和切口处', duration: 120 },
      { id: uuidv4(), order: 3, description: '蒸锅水烧开后，将鱼放入蒸8-10分钟', duration: 600, tip: '时间根据鱼的大小调整，鱼眼突出即熟' },
      { id: uuidv4(), order: 4, description: '蒸好后倒掉盘中汁水，捡去姜片', duration: 60 },
      { id: uuidv4(), order: 5, description: '淋上蒸鱼豉油，放上葱丝', duration: 30 },
      { id: uuidv4(), order: 6, description: '烧热油淋在葱丝上，激出香味即可', duration: 60 }
    ],
    averageRating: 4.9,
    totalRatings: 203,
    favorites: 425,
    createdAt: '2024-03-10'
  },
  {
    id: uuidv4(),
    title: '巧克力熔岩蛋糕',
    coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chocolate%20lava%20cake%20molten%20center%20with%20ice%20cream%20on%20a%20white%20plate%20dessert%20photography%20warm%20lighting&image_size=square_hd',
    author: {
      id: 'user4',
      name: '小芳',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=xiaofang'
    },
    ingredients: [
      { id: uuidv4(), name: '黑巧克力', quantity: '100g', checked: false },
      { id: uuidv4(), name: '黄油', quantity: '80g', checked: false },
      { id: uuidv4(), name: '鸡蛋', quantity: '2个', checked: false },
      { id: uuidv4(), name: '蛋黄', quantity: '1个', checked: false },
      { id: uuidv4(), name: '细砂糖', quantity: '30g', checked: false },
      { id: uuidv4(), name: '低筋面粉', quantity: '30g', checked: false },
      { id: uuidv4(), name: '可可粉', quantity: '适量（撒粉用）', checked: false }
    ],
    steps: [
      { id: uuidv4(), order: 1, description: '烤箱预热至220度，巧克力和黄油隔水融化搅拌均匀', duration: 300, tip: '水温不要超过60度，避免巧克力结块' },
      { id: uuidv4(), order: 2, description: '鸡蛋、蛋黄和糖打发至颜色变浅浓稠', duration: 180 },
      { id: uuidv4(), order: 3, description: '将融化的巧克力液分次加入蛋液中拌匀', duration: 120 },
      { id: uuidv4(), order: 4, description: '筛入低筋面粉，翻拌均匀至无颗粒', duration: 90, tip: '不要画圈搅拌，避免起筋' },
      { id: uuidv4(), order: 5, description: '模具刷黄油撒可可粉，倒入面糊', duration: 120 },
      { id: uuidv4(), order: 6, description: '放入烤箱中层烤8-10分钟，边缘凝固中心稍软即可', duration: 600, tip: '关键是不要烤太久，保持熔岩流心' }
    ],
    averageRating: 4.7,
    totalRatings: 178,
    favorites: 367,
    createdAt: '2024-02-28'
  },
  {
    id: uuidv4(),
    title: '酸辣土豆丝',
    coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20hot%20and%20sour%20shredded%20potato%20dish%20in%20a%20white%20bowl%20with%20chili%20peppers%20food%20photography&image_size=square_hd',
    author: {
      id: 'user5',
      name: '刘大叔',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=uncle5'
    },
    ingredients: [
      { id: uuidv4(), name: '土豆', quantity: '2个中等大小', checked: false },
      { id: uuidv4(), name: '干辣椒', quantity: '5个', checked: false },
      { id: uuidv4(), name: '花椒', quantity: '1小勺', checked: false },
      { id: uuidv4(), name: '醋', quantity: '2勺', checked: false },
      { id: uuidv4(), name: '盐', quantity: '适量', checked: false },
      { id: uuidv4(), name: '葱花', quantity: '适量', checked: false },
      { id: uuidv4(), name: '食用油', quantity: '适量', checked: false }
    ],
    steps: [
      { id: uuidv4(), order: 1, description: '土豆去皮切丝，用清水冲洗几遍去除淀粉，浸泡备用', duration: 300, tip: '多冲洗几遍，土豆丝才会爽脆' },
      { id: uuidv4(), order: 2, description: '干辣椒切段，准备好花椒', duration: 60 },
      { id: uuidv4(), order: 3, description: '热锅倒油，放入花椒和干辣椒段小火炒香', duration: 60, tip: '注意不要炒糊，会发苦' },
      { id: uuidv4(), order: 4, description: '捞出花椒（可选），放入沥干的土豆丝大火快炒', duration: 180 },
      { id: uuidv4(), order: 5, description: '沿锅边淋入醋，加盐调味，翻炒均匀', duration: 90, tip: '沿锅边淋醋，醋香味更浓' },
      { id: uuidv4(), order: 6, description: '撒上葱花，翻炒几下即可出锅', duration: 30 }
    ],
    averageRating: 4.5,
    totalRatings: 267,
    favorites: 489,
    createdAt: '2024-01-25'
  },
  {
    id: uuidv4(),
    title: '紫菜蛋花汤',
    coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20seaweed%20egg%20drop%20soup%20in%20a%20white%20soup%20bowl%20with%20green%20onion%20warm%20comfort%20food&image_size=square_hd',
    author: {
      id: 'user6',
      name: '赵奶奶',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=grandma6'
    },
    ingredients: [
      { id: uuidv4(), name: '紫菜', quantity: '1小把', checked: false },
      { id: uuidv4(), name: '鸡蛋', quantity: '2个', checked: false },
      { id: uuidv4(), name: '番茄', quantity: '1个小的', checked: false },
      { id: uuidv4(), name: '葱花', quantity: '适量', checked: false },
      { id: uuidv4(), name: '盐', quantity: '适量', checked: false },
      { id: uuidv4(), name: '香油', quantity: '几滴', checked: false },
      { id: uuidv4(), name: '胡椒粉', quantity: '少许', checked: false }
    ],
    steps: [
      { id: uuidv4(), order: 1, description: '紫菜撕碎，番茄切小块，鸡蛋打散备用', duration: 120 },
      { id: uuidv4(), order: 2, description: '锅中加适量清水，放入番茄块烧开', duration: 300 },
      { id: uuidv4(), order: 3, description: '放入紫菜煮2分钟，加盐和胡椒粉调味', duration: 120 },
      { id: uuidv4(), order: 4, description: '转小火，慢慢淋入蛋液，形成蛋花', duration: 60, tip: '小火淋蛋液，蛋花才会细腻' },
      { id: uuidv4(), order: 5, description: '关火，撒上葱花，滴几滴香油即可', duration: 30 }
    ],
    averageRating: 4.4,
    totalRatings: 145,
    favorites: 298,
    createdAt: '2024-03-05'
  },
  {
    id: uuidv4(),
    title: '可乐鸡翅',
    coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cola%20chicken%20wings%20coca%20cola%20braised%20with%20sesame%20seeds%20on%20a%20white%20plate%20chinese%20home%20cooking&image_size=square_hd',
    author: {
      id: 'user7',
      name: '小陈',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=xiaochen'
    },
    ingredients: [
      { id: uuidv4(), name: '鸡翅中', quantity: '10个', checked: false },
      { id: uuidv4(), name: '可乐', quantity: '1罐330ml', checked: false },
      { id: uuidv4(), name: '生抽', quantity: '2勺', checked: false },
      { id: uuidv4(), name: '老抽', quantity: '半勺', checked: false },
      { id: uuidv4(), name: '料酒', quantity: '1勺', checked: false },
      { id: uuidv4(), name: '姜片', quantity: '3片', checked: false },
      { id: uuidv4(), name: '白芝麻', quantity: '适量（装饰用）', checked: false }
    ],
    steps: [
      { id: uuidv4(), order: 1, description: '鸡翅两面各划2刀，便于入味，冷水下锅焯水去血沫', duration: 300 },
      { id: uuidv4(), order: 2, description: '捞出鸡翅沥干，用厨房纸吸干水分', duration: 120 },
      { id: uuidv4(), order: 3, description: '锅中放少许油，放入鸡翅小火煎至两面金黄', duration: 300, tip: '煎到皮微焦，口感更好' },
      { id: uuidv4(), order: 4, description: '加入姜片、料酒、生抽、老抽翻炒上色', duration: 120 },
      { id: uuidv4(), order: 5, description: '倒入可乐，大火烧开转小火煮15分钟', duration: 900 },
      { id: uuidv4(), order: 6, description: '大火收汁，汤汁浓稠裹住鸡翅，撒上白芝麻即可', duration: 300 }
    ],
    averageRating: 4.8,
    totalRatings: 312,
    favorites: 623,
    createdAt: '2024-02-14'
  },
  {
    id: uuidv4(),
    title: '抹茶曲奇饼干',
    coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=matcha%20green%20tea%20butter%20cookies%20on%20a%20cooling%20rack%20bakery%20style%20photography%20soft%20lighting&image_size=square_hd',
    author: {
      id: 'user8',
      name: '小美',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=xiaomei'
    },
    ingredients: [
      { id: uuidv4(), name: '黄油', quantity: '120g', checked: false },
      { id: uuidv4(), name: '糖粉', quantity: '50g', checked: false },
      { id: uuidv4(), name: '蛋黄', quantity: '1个', checked: false },
      { id: uuidv4(), name: '低筋面粉', quantity: '160g', checked: false },
      { id: uuidv4(), name: '抹茶粉', quantity: '8g', checked: false },
      { id: uuidv4(), name: '玉米淀粉', quantity: '20g', checked: false },
      { id: uuidv4(), name: '盐', quantity: '1小撮', checked: false }
    ],
    steps: [
      { id: uuidv4(), order: 1, description: '黄油室温软化，加入糖粉打发至颜色变浅体积膨胀', duration: 300, tip: '黄油要软化到位，但不能融化成液体' },
      { id: uuidv4(), order: 2, description: '加入蛋黄搅打均匀', duration: 120 },
      { id: uuidv4(), order: 3, description: '低筋面粉、抹茶粉、玉米淀粉、盐混合过筛', duration: 90 },
      { id: uuidv4(), order: 4, description: '将粉类分次加入黄油中，用刮刀翻拌均匀至无干粉', duration: 180, tip: '不要过度搅拌，避免起筋影响口感' },
      { id: uuidv4(), order: 5, description: '将面糊装入裱花袋，在烤盘上挤出喜欢的花型', duration: 300 },
      { id: uuidv4(), order: 6, description: '放入预热好的烤箱170度，烤15-18分钟', duration: 1080, tip: '最后几分钟盯着，避免底部烤焦' }
    ],
    averageRating: 4.6,
    totalRatings: 167,
    favorites: 345,
    createdAt: '2024-03-18'
  },
  {
    id: uuidv4(),
    title: '蒜蓉西兰花',
    coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=garlic%20broccoli%20stir%20fry%20chinese%20style%20green%20vegetable%20dish%20on%20a%20white%20plate%20fresh%20and%20healthy&image_size=square_hd',
    author: {
      id: 'user9',
      name: '孙阿姨',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=auntie9'
    },
    ingredients: [
      { id: uuidv4(), name: '西兰花', quantity: '1颗约400g', checked: false },
      { id: uuidv4(), name: '大蒜', quantity: '5瓣', checked: false },
      { id: uuidv4(), name: '盐', quantity: '适量', checked: false },
      { id: uuidv4(), name: '生抽', quantity: '1勺', checked: false },
      { id: uuidv4(), name: '食用油', quantity: '适量', checked: false },
      { id: uuidv4(), name: '水淀粉', quantity: '适量', checked: false }
    ],
    steps: [
      { id: uuidv4(), order: 1, description: '西兰花切小朵，用淡盐水浸泡10分钟后洗净', duration: 600, tip: '淡盐水可以去除残留农药和小虫' },
      { id: uuidv4(), order: 2, description: '大蒜切末备用', duration: 60 },
      { id: uuidv4(), order: 3, description: '锅中水烧开，加少许盐和油，放入西兰花焯水1分钟', duration: 120, tip: '加油和盐，焯水后的西兰花颜色更翠绿' },
      { id: uuidv4(), order: 4, description: '捞出过凉水保持脆感，沥干水分', duration: 60 },
      { id: uuidv4(), order: 5, description: '热锅倒油，放入蒜末小火炒香', duration: 60 },
      { id: uuidv4(), order: 6, description: '放入西兰花翻炒，加生抽和盐调味，勾薄芡出锅', duration: 120 }
    ],
    averageRating: 4.5,
    totalRatings: 189,
    favorites: 312,
    createdAt: '2024-02-08'
  },
  {
    id: uuidv4(),
    title: '麻婆豆腐',
    coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=sichuan%20mapo%20tofu%20spicy%20minced%20pork%20with%20soft%20tofu%20in%20a%20ceramic%20bowl%20chinese%20food%20photography&image_size=square_hd',
    author: {
      id: 'user10',
      name: '周大厨',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chef10'
    },
    ingredients: [
      { id: uuidv4(), name: '嫩豆腐', quantity: '1盒400g', checked: false },
      { id: uuidv4(), name: '牛肉末', quantity: '100g', checked: false },
      { id: uuidv4(), name: '郫县豆瓣酱', quantity: '1勺', checked: false },
      { id: uuidv4(), name: '豆豉', quantity: '1小勺', checked: false },
      { id: uuidv4(), name: '花椒粉', quantity: '适量', checked: false },
      { id: uuidv4(), name: '蒜末', quantity: '1勺', checked: false },
      { id: uuidv4(), name: '葱花', quantity: '适量', checked: false },
      { id: uuidv4(), name: '水淀粉', quantity: '适量', checked: false }
    ],
    steps: [
      { id: uuidv4(), order: 1, description: '豆腐切2厘米见方的块，放入加了盐的开水中焯烫2分钟', duration: 180, tip: '焯水可以去除豆腥味，让豆腐不易碎' },
      { id: uuidv4(), order: 2, description: '捞出豆腐浸泡在热水中保温', duration: 30 },
      { id: uuidv4(), order: 3, description: '热锅倒油，放入牛肉末炒散炒香至变色', duration: 180 },
      { id: uuidv4(), order: 4, description: '加入豆瓣酱、豆豉、蒜末炒出红油', duration: 120 },
      { id: uuidv4(), order: 5, description: '加入适量清水烧开，放入豆腐轻轻推动', duration: 300, tip: '用推的方式，不要用锅铲翻炒，避免豆腐碎' },
      { id: uuidv4(), order: 6, description: '分2-3次勾薄芡，出锅前撒花椒粉和葱花', duration: 180 }
    ],
    averageRating: 4.7,
    totalRatings: 234,
    favorites: 456,
    createdAt: '2024-01-30'
  }
];

const mockComments: Comment[] = [
  {
    id: uuidv4(),
    recipeId: '',
    user: { id: 'u1', name: '美食爱好者', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=foodie1' },
    rating: 5,
    content: '按照这个方法做出来的红烧肉太好吃了！入口即化，甜度刚刚好，全家人都爱吃。',
    createdAt: '2024-03-20 18:30'
  },
  {
    id: uuidv4(),
    recipeId: '',
    user: { id: 'u2', name: '厨房新手', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=newbie2' },
    rating: 4,
    content: '第一次做就成功了，步骤写得很详细。糖色稍微炒过了一点点，但整体味道很棒！',
    createdAt: '2024-03-19 20:15'
  }
];

const mockCollections: Collection[] = [
  { id: uuidv4(), name: '家常菜', icon: '🍳', recipeIds: [], createdAt: '2024-01-01' },
  { id: uuidv4(), name: '烘焙甜点', icon: '🧁', recipeIds: [], createdAt: '2024-01-01' },
  { id: uuidv4(), name: '汤羹类', icon: '🍲', recipeIds: [], createdAt: '2024-01-01' },
  { id: uuidv4(), name: '快手菜', icon: '⚡', recipeIds: [], createdAt: '2024-01-01' }
];

export const useRecipeStore = create<RecipeState>((set, get) => ({
  recipes: mockRecipes,
  collections: mockCollections,
  comments: mockComments,
  activeCollectionId: null,
  isDragging: false,
  dragRecipeId: null,
  highlightCollectionId: null,
  flyingRecipeId: null,

  addComment: (recipeId: string, rating: number, content: string) => {
    const newComment: Comment = {
      id: uuidv4(),
      recipeId,
      user: {
        id: 'current-user',
        name: '我',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=currentuser'
      },
      rating,
      content,
      createdAt: new Date().toLocaleString('zh-CN')
    };

    set(state => {
      const recipe = state.recipes.find(r => r.id === recipeId);
      if (!recipe) return state;

      const newTotalRatings = recipe.totalRatings + 1;
      const newAverageRating = (recipe.averageRating * recipe.totalRatings + rating) / newTotalRatings;

      return {
        comments: [newComment, ...state.comments],
        recipes: state.recipes.map(r =>
          r.id === recipeId
            ? { ...r, averageRating: Math.round(newAverageRating * 10) / 10, totalRatings: newTotalRatings }
            : r
        )
      };
    });
  },

  updateIngredientChecked: (recipeId: string, ingredientId: string, checked: boolean) => {
    set(state => ({
      recipes: state.recipes.map(r =>
        r.id === recipeId
          ? {
              ...r,
              ingredients: r.ingredients.map(i =>
                i.id === ingredientId ? { ...i, checked } : i
              )
            }
          : r
      )
    }));
  },

  toggleFavorite: (recipeId: string) => {
    set(state => ({
      recipes: state.recipes.map(r =>
        r.id === recipeId ? { ...r, favorites: r.favorites + 1 } : r
      )
    }));
  },

  addCollection: (name: string, icon: string) => {
    set(state => ({
      collections: [...state.collections, {
        id: uuidv4(),
        name,
        icon,
        recipeIds: [],
        createdAt: new Date().toISOString().split('T')[0]
      }]
    }));
  },

  deleteCollection: (collectionId: string) => {
    set(state => ({
      collections: state.collections.filter(c => c.id !== collectionId),
      activeCollectionId: state.activeCollectionId === collectionId ? null : state.activeCollectionId
    }));
  },

  addRecipeToCollection: (recipeId: string, collectionId: string) => {
    set(state => ({
      collections: state.collections.map(c =>
        c.id === collectionId && !c.recipeIds.includes(recipeId)
          ? { ...c, recipeIds: [...c.recipeIds, recipeId] }
          : c
      ),
      recipes: state.recipes.map(r =>
        r.id === recipeId ? { ...r, favorites: r.favorites + 1 } : r
      )
    }));
  },

  removeRecipeFromCollection: (recipeId: string, collectionId: string) => {
    set(state => ({
      collections: state.collections.map(c =>
        c.id === collectionId
          ? { ...c, recipeIds: c.recipeIds.filter(id => id !== recipeId) }
          : c
      )
    }));
  },

  setActiveCollection: (collectionId: string | null) => {
    set({ activeCollectionId: collectionId });
  },

  setDragging: (isDragging: boolean, recipeId: string | null) => {
    set({ isDragging, dragRecipeId: recipeId });
  },

  setHighlightCollection: (collectionId: string | null) => {
    set({ highlightCollectionId: collectionId });
  },

  setFlyingRecipe: (recipeId: string | null) => {
    set({ flyingRecipeId: recipeId });
  },

  getRecipeById: (id: string) => {
    return get().recipes.find(r => r.id === id);
  },

  getCommentsByRecipeId: (recipeId: string) => {
    return get().comments.filter(c => c.recipeId === recipeId || c.recipeId === '');
  }
}));
