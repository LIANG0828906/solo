export interface Ingredient {
  id: string;
  name: string;
  category: 'vegetables' | 'meat' | 'seasoning' | 'staple' | 'dairy' | 'fruit';
  unit: string;
}

export interface RecipeIngredient {
  ingredientId: string;
  quantity: number;
  unit: string;
  required: boolean;
}

export interface Recipe {
  id: string;
  name: string;
  image: string;
  category: string;
  calories: number;
  tags: string[];
  steps: string[];
  ingredients: RecipeIngredient[];
}

export interface UserIngredient {
  ingredientId: string;
  quantity: number;
}

export interface ShoppingItem {
  ingredientId: string;
  name: string;
  quantity: number;
  unit: string;
  category: Ingredient['category'];
  checked: boolean;
}

export interface RecipeScore {
  recipe: Recipe;
  score: number;
  matchRate: number;
  nutritionRate: number;
  missingIngredients: RecipeIngredient[];
}

export const CATEGORY_LABELS: Record<Ingredient['category'], string> = {
  vegetables: '蔬菜',
  meat: '肉类',
  seasoning: '调味品',
  staple: '主食',
  dairy: '乳制品',
  fruit: '水果',
};

export const INGREDIENTS: Ingredient[] = [
  { id: 'i1', name: '西红柿', category: 'vegetables', unit: '个' },
  { id: 'i2', name: '鸡蛋', category: 'meat', unit: '个' },
  { id: 'i3', name: '洋葱', category: 'vegetables', unit: '个' },
  { id: 'i4', name: '鸡胸肉', category: 'meat', unit: '克' },
  { id: 'i5', name: '牛里脊', category: 'meat', unit: '克' },
  { id: 'i6', name: '猪里脊', category: 'meat', unit: '克' },
  { id: 'i7', name: '土豆', category: 'vegetables', unit: '个' },
  { id: 'i8', name: '胡萝卜', category: 'vegetables', unit: '根' },
  { id: 'i9', name: '青椒', category: 'vegetables', unit: '个' },
  { id: 'i10', name: '大蒜', category: 'seasoning', unit: '瓣' },
  { id: 'i11', name: '生姜', category: 'seasoning', unit: '片' },
  { id: 'i12', name: '酱油', category: 'seasoning', unit: '勺' },
  { id: 'i13', name: '盐', category: 'seasoning', unit: '克' },
  { id: 'i14', name: '白糖', category: 'seasoning', unit: '克' },
  { id: 'i15', name: '食用油', category: 'seasoning', unit: '勺' },
  { id: 'i16', name: '料酒', category: 'seasoning', unit: '勺' },
  { id: 'i17', name: '蚝油', category: 'seasoning', unit: '勺' },
  { id: 'i18', name: '醋', category: 'seasoning', unit: '勺' },
  { id: 'i19', name: '豆腐', category: 'staple', unit: '块' },
  { id: 'i20', name: '米饭', category: 'staple', unit: '碗' },
  { id: 'i21', name: '面条', category: 'staple', unit: '克' },
  { id: 'i22', name: '面粉', category: 'staple', unit: '克' },
  { id: 'i23', name: '虾仁', category: 'meat', unit: '克' },
  { id: 'i24', name: '三文鱼', category: 'meat', unit: '克' },
  { id: 'i25', name: '西兰花', category: 'vegetables', unit: '克' },
  { id: 'i26', name: '黄瓜', category: 'vegetables', unit: '根' },
  { id: 'i27', name: '生菜', category: 'vegetables', unit: '克' },
  { id: 'i28', name: '菠菜', category: 'vegetables', unit: '克' },
  { id: 'i29', name: '豆芽', category: 'vegetables', unit: '克' },
  { id: 'i30', name: '木耳', category: 'vegetables', unit: '克' },
  { id: 'i31', name: '香菇', category: 'vegetables', unit: '个' },
  { id: 'i32', name: '牛奶', category: 'dairy', unit: '杯' },
  { id: 'i33', name: '芝士', category: 'dairy', unit: '克' },
  { id: 'i34', name: '黄油', category: 'dairy', unit: '克' },
  { id: 'i35', name: '酸奶', category: 'dairy', unit: '杯' },
  { id: 'i36', name: '苹果', category: 'fruit', unit: '个' },
  { id: 'i37', name: '柠檬', category: 'fruit', unit: '个' },
  { id: 'i38', name: '番茄酱', category: 'seasoning', unit: '勺' },
  { id: 'i39', name: '淀粉', category: 'seasoning', unit: '克' },
  { id: 'i40', name: '花椒', category: 'seasoning', unit: '克' },
  { id: 'i41', name: '干辣椒', category: 'seasoning', unit: '个' },
  { id: 'i42', name: '五花肉', category: 'meat', unit: '克' },
  { id: 'i43', name: '鸡翅', category: 'meat', unit: '个' },
  { id: 'i44', name: '排骨', category: 'meat', unit: '克' },
  { id: 'i45', name: '白菜', category: 'vegetables', unit: '克' },
  { id: 'i46', name: '豆角', category: 'vegetables', unit: '克' },
  { id: 'i47', name: '茄子', category: 'vegetables', unit: '根' },
  { id: 'i48', name: '芹菜', category: 'vegetables', unit: '克' },
  { id: 'i49', name: '玉米', category: 'vegetables', unit: '根' },
  { id: 'i50', name: '芝麻', category: 'seasoning', unit: '克' },
];

const ingredientMap = new Map(INGREDIENTS.map((i) => [i.id, i]));

export function getIngredientById(id: string): Ingredient | undefined {
  return ingredientMap.get(id);
}

export const RECIPES: Recipe[] = [
  {
    id: 'r1',
    name: '番茄炒蛋',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Chinese%20style%20tomato%20scrambled%20eggs%20dish%20on%20white%20plate%2C%20warm%20lighting%2C%20food%20photography&image_size=square',
    category: '家常菜',
    calories: 180,
    tags: ['低卡', '快手菜'],
    steps: [
      '西红柿切块，鸡蛋打散加少许盐搅匀',
      '热锅凉油，倒入蛋液翻炒至凝固盛出',
      '锅中再加少许油，放入西红柿翻炒出汁',
      '加入白糖调味，倒回鸡蛋翻炒均匀',
      '出锅装盘',
    ],
    ingredients: [
      { ingredientId: 'i1', quantity: 2, unit: '个', required: true },
      { ingredientId: 'i2', quantity: 3, unit: '个', required: true },
      { ingredientId: 'i14', quantity: 5, unit: '克', required: false },
      { ingredientId: 'i15', quantity: 2, unit: '勺', required: true },
      { ingredientId: 'i13', quantity: 2, unit: '克', required: false },
    ],
  },
  {
    id: 'r2',
    name: '宫保鸡丁',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Kung%20Pao%20chicken%20dish%20with%20peanuts%20on%20white%20plate%2C%20Chinese%20cuisine%2C%20food%20photography&image_size=square',
    category: '川菜',
    calories: 320,
    tags: ['高蛋白'],
    steps: [
      '鸡胸肉切丁，加料酒、淀粉腌制15分钟',
      '调碗汁：酱油、醋、白糖、淀粉加水搅匀',
      '热油爆香花椒、干辣椒，下鸡丁滑散',
      '加入葱姜蒜翻炒，倒入碗汁快速翻炒',
      '加入花生米翻炒均匀，出锅',
    ],
    ingredients: [
      { ingredientId: 'i4', quantity: 300, unit: '克', required: true },
      { ingredientId: 'i10', quantity: 3, unit: '瓣', required: true },
      { ingredientId: 'i11', quantity: 3, unit: '片', required: true },
      { ingredientId: 'i12', quantity: 2, unit: '勺', required: true },
      { ingredientId: 'i16', quantity: 1, unit: '勺', required: true },
      { ingredientId: 'i39', quantity: 10, unit: '克', required: true },
      { ingredientId: 'i40', quantity: 3, unit: '克', required: false },
      { ingredientId: 'i41', quantity: 5, unit: '个', required: false },
      { ingredientId: 'i15', quantity: 3, unit: '勺', required: true },
    ],
  },
  {
    id: 'r3',
    name: '红烧排骨',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Braised%20pork%20ribs%20in%20brown%20sauce%20on%20plate%2C%20Chinese%20cuisine%2C%20food%20photography&image_size=square',
    category: '家常菜',
    calories: 450,
    tags: ['高蛋白'],
    steps: [
      '排骨焯水去血沫，捞出洗净',
      '热油炒糖色，下排骨翻炒上色',
      '加葱姜蒜、酱油、料酒调味',
      '加水没过排骨，大火烧开转小火炖40分钟',
      '大火收汁，出锅装盘',
    ],
    ingredients: [
      { ingredientId: 'i44', quantity: 500, unit: '克', required: true },
      { ingredientId: 'i10', quantity: 3, unit: '瓣', required: true },
      { ingredientId: 'i11', quantity: 3, unit: '片', required: true },
      { ingredientId: 'i12', quantity: 3, unit: '勺', required: true },
      { ingredientId: 'i16', quantity: 2, unit: '勺', required: true },
      { ingredientId: 'i14', quantity: 15, unit: '克', required: true },
      { ingredientId: 'i15', quantity: 2, unit: '勺', required: true },
    ],
  },
  {
    id: 'r4',
    name: '蒜蓉西兰花',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Steamed%20broccoli%20with%20garlic%20sauce%20on%20plate%2C%20healthy%20food%2C%20food%20photography&image_size=square',
    category: '家常菜',
    calories: 85,
    tags: ['低卡', '高蛋白'],
    steps: [
      '西兰花掰成小朵，焯水2分钟捞出',
      '大蒜切末，热油爆香',
      '倒入西兰花翻炒，加盐和蚝油调味',
      '翻炒均匀出锅',
    ],
    ingredients: [
      { ingredientId: 'i25', quantity: 300, unit: '克', required: true },
      { ingredientId: 'i10', quantity: 4, unit: '瓣', required: true },
      { ingredientId: 'i17', quantity: 1, unit: '勺', required: false },
      { ingredientId: 'i13', quantity: 2, unit: '克', required: true },
      { ingredientId: 'i15', quantity: 1, unit: '勺', required: true },
    ],
  },
  {
    id: 'r5',
    name: '土豆炖牛肉',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Chinese%20braised%20beef%20with%20potatoes%20in%20bowl%2C%20warm%20lighting%2C%20food%20photography&image_size=square',
    category: '家常菜',
    calories: 380,
    tags: ['高蛋白'],
    steps: [
      '牛肉切块焯水，土豆去皮切块',
      '热油爆香葱姜蒜，下牛肉翻炒',
      '加酱油、料酒、八角调味',
      '加水没过食材，大火烧开转小火炖1小时',
      '加入土豆继续炖20分钟至软烂',
      '大火收汁，出锅',
    ],
    ingredients: [
      { ingredientId: 'i5', quantity: 400, unit: '克', required: true },
      { ingredientId: 'i7', quantity: 2, unit: '个', required: true },
      { ingredientId: 'i10', quantity: 3, unit: '瓣', required: true },
      { ingredientId: 'i11', quantity: 3, unit: '片', required: true },
      { ingredientId: 'i12', quantity: 3, unit: '勺', required: true },
      { ingredientId: 'i16', quantity: 2, unit: '勺', required: true },
      { ingredientId: 'i15', quantity: 2, unit: '勺', required: true },
    ],
  },
  {
    id: 'r6',
    name: '清蒸鲈鱼',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Steamed%20sea%20bass%20with%20scallions%20on%20plate%2C%20Chinese%20cuisine%2C%20food%20photography&image_size=square',
    category: '粤菜',
    calories: 120,
    tags: ['低卡', '高蛋白'],
    steps: [
      '鱼处理干净，两面划刀',
      '盘底放葱姜，鱼身抹盐和料酒腌制10分钟',
      '大火蒸8-10分钟',
      '倒掉蒸出的汤汁，撒上葱丝',
      '热油浇在葱丝上，淋上蒸鱼豉油',
    ],
    ingredients: [
      { ingredientId: 'i11', quantity: 5, unit: '片', required: true },
      { ingredientId: 'i16', quantity: 1, unit: '勺', required: true },
      { ingredientId: 'i13', quantity: 3, unit: '克', required: true },
      { ingredientId: 'i15', quantity: 2, unit: '勺', required: true },
      { ingredientId: 'i12', quantity: 2, unit: '勺', required: true },
    ],
  },
  {
    id: 'r7',
    name: '麻婆豆腐',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Mapo%20tofu%20dish%20on%20white%20plate%2C%20Sichuan%20cuisine%2C%20food%20photography&image_size=square',
    category: '川菜',
    calories: 200,
    tags: ['快手菜'],
    steps: [
      '豆腐切块焯水，猪肉末备用',
      '热油炒肉末变色，加豆瓣酱炒出红油',
      '加水烧开，放入豆腐小火炖5分钟',
      '水淀粉勾芡，撒花椒粉和葱花',
      '出锅装盘',
    ],
    ingredients: [
      { ingredientId: 'i19', quantity: 1, unit: '块', required: true },
      { ingredientId: 'i6', quantity: 100, unit: '克', required: false },
      { ingredientId: 'i10', quantity: 2, unit: '瓣', required: true },
      { ingredientId: 'i11', quantity: 2, unit: '片', required: true },
      { ingredientId: 'i12', quantity: 1, unit: '勺', required: true },
      { ingredientId: 'i39', quantity: 10, unit: '克', required: true },
      { ingredientId: 'i15', quantity: 2, unit: '勺', required: true },
    ],
  },
  {
    id: 'r8',
    name: '黄瓜炒虾仁',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Stir-fried%20shrimp%20with%20cucumber%20on%20plate%2C%20light%20Chinese%20cuisine%2C%20food%20photography&image_size=square',
    category: '家常菜',
    calories: 150,
    tags: ['低卡', '高蛋白'],
    steps: [
      '虾仁去虾线，加料酒腌制10分钟',
      '黄瓜切丁，蒜切片',
      '热油滑炒虾仁变色盛出',
      '爆香蒜片，下黄瓜翻炒',
      '倒回虾仁，加盐调味翻炒均匀',
    ],
    ingredients: [
      { ingredientId: 'i23', quantity: 200, unit: '克', required: true },
      { ingredientId: 'i26', quantity: 1, unit: '根', required: true },
      { ingredientId: 'i10', quantity: 2, unit: '瓣', required: true },
      { ingredientId: 'i16', quantity: 1, unit: '勺', required: true },
      { ingredientId: 'i13', quantity: 2, unit: '克', required: true },
      { ingredientId: 'i15', quantity: 2, unit: '勺', required: true },
    ],
  },
  {
    id: 'r9',
    name: '醋溜白菜',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Sour%20cabbage%20stir%20fry%20on%20plate%2C%20Chinese%20home%20cooking%2C%20food%20photography&image_size=square',
    category: '家常菜',
    calories: 75,
    tags: ['低卡', '快手菜'],
    steps: [
      '白菜手撕成块，蒜切片，干辣椒切段',
      '热油爆香蒜片和干辣椒',
      '大火下白菜翻炒至变软',
      '加醋、酱油、盐调味翻炒均匀',
      '出锅装盘',
    ],
    ingredients: [
      { ingredientId: 'i45', quantity: 300, unit: '克', required: true },
      { ingredientId: 'i10', quantity: 3, unit: '瓣', required: true },
      { ingredientId: 'i41', quantity: 3, unit: '个', required: false },
      { ingredientId: 'i18', quantity: 2, unit: '勺', required: true },
      { ingredientId: 'i12', quantity: 1, unit: '勺', required: true },
      { ingredientId: 'i13', quantity: 2, unit: '克', required: true },
      { ingredientId: 'i15', quantity: 2, unit: '勺', required: true },
    ],
  },
  {
    id: 'r10',
    name: '番茄牛腩',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Tomato%20beef%20brisket%20stew%20in%20bowl%2C%20Chinese%20cuisine%2C%20food%20photography&image_size=square',
    category: '家常菜',
    calories: 350,
    tags: ['高蛋白'],
    steps: [
      '牛腩切块焯水，番茄切块',
      '热油炒番茄出汁，加番茄酱调味',
      '放入牛腩翻炒，加酱油、料酒',
      '加水没过食材，大火烧开转小火炖1.5小时',
      '加盐调味，大火收汁出锅',
    ],
    ingredients: [
      { ingredientId: 'i5', quantity: 400, unit: '克', required: true },
      { ingredientId: 'i1', quantity: 3, unit: '个', required: true },
      { ingredientId: 'i38', quantity: 2, unit: '勺', required: false },
      { ingredientId: 'i12', quantity: 2, unit: '勺', required: true },
      { ingredientId: 'i16', quantity: 2, unit: '勺', required: true },
      { ingredientId: 'i13', quantity: 3, unit: '克', required: true },
      { ingredientId: 'i15', quantity: 2, unit: '勺', required: true },
    ],
  },
  {
    id: 'r11',
    name: '鱼香肉丝',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Yuxiang%20shredded%20pork%20on%20plate%2C%20Sichuan%20cuisine%2C%20food%20photography&image_size=square',
    category: '川菜',
    calories: 280,
    tags: ['快手菜'],
    steps: [
      '猪里脊切丝，加料酒、淀粉腌制',
      '调鱼香汁：醋、酱油、白糖、淀粉加水搅匀',
      '热油滑炒肉丝变色盛出',
      '爆香葱姜蒜、豆瓣酱，下木耳和胡萝卜丝翻炒',
      '倒回肉丝，淋入鱼香汁翻炒收汁',
    ],
    ingredients: [
      { ingredientId: 'i6', quantity: 200, unit: '克', required: true },
      { ingredientId: 'i30', quantity: 50, unit: '克', required: true },
      { ingredientId: 'i8', quantity: 1, unit: '根', required: true },
      { ingredientId: 'i10', quantity: 2, unit: '瓣', required: true },
      { ingredientId: 'i11', quantity: 2, unit: '片', required: true },
      { ingredientId: 'i12', quantity: 2, unit: '勺', required: true },
      { ingredientId: 'i18', quantity: 2, unit: '勺', required: true },
      { ingredientId: 'i14', quantity: 10, unit: '克', required: true },
      { ingredientId: 'i39', quantity: 10, unit: '克', required: true },
      { ingredientId: 'i15', quantity: 2, unit: '勺', required: true },
    ],
  },
  {
    id: 'r12',
    name: '蒜蓉茄子',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Steamed%20eggplant%20with%20garlic%20sauce%20on%20plate%2C%20Chinese%20cuisine%2C%20food%20photography&image_size=square',
    category: '家常菜',
    calories: 95,
    tags: ['低卡'],
    steps: [
      '茄子切条，蒸10分钟至软烂',
      '大蒜切末，热油爆香',
      '加入酱油、蚝油调味',
      '将蒜蓉汁浇在茄子上',
      '撒葱花点缀',
    ],
    ingredients: [
      { ingredientId: 'i47', quantity: 2, unit: '根', required: true },
      { ingredientId: 'i10', quantity: 5, unit: '瓣', required: true },
      { ingredientId: 'i12', quantity: 2, unit: '勺', required: true },
      { ingredientId: 'i17', quantity: 1, unit: '勺', required: true },
      { ingredientId: 'i15', quantity: 2, unit: '勺', required: true },
    ],
  },
  {
    id: 'r13',
    name: '可乐鸡翅',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Cola%20chicken%20wings%20on%20plate%2C%20Chinese%20cuisine%2C%20food%20photography&image_size=square',
    category: '家常菜',
    calories: 290,
    tags: ['快手菜'],
    steps: [
      '鸡翅划刀，焯水去血沫',
      '热油煎鸡翅至两面金黄',
      '加酱油、料酒翻炒上色',
      '倒入可乐没过鸡翅，大火烧开转中小火炖20分钟',
      '大火收汁至浓稠，出锅',
    ],
    ingredients: [
      { ingredientId: 'i43', quantity: 8, unit: '个', required: true },
      { ingredientId: 'i12', quantity: 2, unit: '勺', required: true },
      { ingredientId: 'i16', quantity: 1, unit: '勺', required: true },
      { ingredientId: 'i11', quantity: 3, unit: '片', required: true },
      { ingredientId: 'i15', quantity: 1, unit: '勺', required: true },
    ],
  },
  {
    id: 'r14',
    name: '凉拌黄瓜',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Chinese%20cold%20cucumber%20salad%20on%20plate%2C%20refreshing%2C%20food%20photography&image_size=square',
    category: '凉菜',
    calories: 55,
    tags: ['低卡', '快手菜'],
    steps: [
      '黄瓜拍碎切块，蒜切末',
      '加盐腌制10分钟，倒掉水分',
      '加醋、酱油、香油、白糖调味',
      '加入蒜末拌匀',
      '冷藏10分钟后食用更佳',
    ],
    ingredients: [
      { ingredientId: 'i26', quantity: 2, unit: '根', required: true },
      { ingredientId: 'i10', quantity: 3, unit: '瓣', required: true },
      { ingredientId: 'i18', quantity: 2, unit: '勺', required: true },
      { ingredientId: 'i12', quantity: 1, unit: '勺', required: true },
      { ingredientId: 'i14', quantity: 5, unit: '克', required: false },
      { ingredientId: 'i13', quantity: 3, unit: '克', required: true },
    ],
  },
  {
    id: 'r15',
    name: '红烧肉',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Chinese%20braised%20pork%20belly%20on%20plate%2C%20rich%20brown%20sauce%2C%20food%20photography&image_size=square',
    category: '家常菜',
    calories: 520,
    tags: ['高蛋白'],
    steps: [
      '五花肉切块焯水',
      '热油炒糖色至焦糖色',
      '下肉块翻炒上色',
      '加酱油、料酒、葱姜蒜',
      '加水没过肉块，小火炖1小时',
      '大火收汁至浓稠',
    ],
    ingredients: [
      { ingredientId: 'i42', quantity: 500, unit: '克', required: true },
      { ingredientId: 'i14', quantity: 20, unit: '克', required: true },
      { ingredientId: 'i12', quantity: 3, unit: '勺', required: true },
      { ingredientId: 'i16', quantity: 2, unit: '勺', required: true },
      { ingredientId: 'i10', quantity: 3, unit: '瓣', required: true },
      { ingredientId: 'i11', quantity: 3, unit: '片', required: true },
      { ingredientId: 'i15', quantity: 1, unit: '勺', required: true },
    ],
  },
  {
    id: 'r16',
    name: '香菇滑鸡',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Steamed%20chicken%20with%20mushrooms%20on%20plate%2C%20Chinese%20cuisine%2C%20food%20photography&image_size=square',
    category: '粤菜',
    calories: 250,
    tags: ['高蛋白'],
    steps: [
      '鸡胸肉切片，加淀粉、料酒腌制15分钟',
      '香菇切片，姜切丝',
      '盘底铺香菇，上面放鸡肉片',
      '大火蒸12分钟',
      '出锅淋蒸鱼豉油，撒葱花',
    ],
    ingredients: [
      { ingredientId: 'i4', quantity: 250, unit: '克', required: true },
      { ingredientId: 'i31', quantity: 6, unit: '个', required: true },
      { ingredientId: 'i11', quantity: 3, unit: '片', required: true },
      { ingredientId: 'i39', quantity: 10, unit: '克', required: true },
      { ingredientId: 'i16', quantity: 1, unit: '勺', required: true },
      { ingredientId: 'i12', quantity: 1, unit: '勺', required: true },
    ],
  },
  {
    id: 'r17',
    name: '酸辣土豆丝',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Spicy%20sour%20shredded%20potatoes%20on%20plate%2C%20Chinese%20cuisine%2C%20food%20photography&image_size=square',
    category: '家常菜',
    calories: 110,
    tags: ['低卡', '快手菜'],
    steps: [
      '土豆切丝泡水去淀粉，干辣椒切段',
      '热油爆香花椒和干辣椒',
      '下土豆丝大火翻炒',
      '加醋、盐调味，翻炒均匀',
      '出锅前撒葱花',
    ],
    ingredients: [
      { ingredientId: 'i7', quantity: 2, unit: '个', required: true },
      { ingredientId: 'i41', quantity: 4, unit: '个', required: false },
      { ingredientId: 'i40', quantity: 3, unit: '克', required: false },
      { ingredientId: 'i18', quantity: 2, unit: '勺', required: true },
      { ingredientId: 'i13', quantity: 2, unit: '克', required: true },
      { ingredientId: 'i15', quantity: 2, unit: '勺', required: true },
    ],
  },
  {
    id: 'r18',
    name: '青椒肉丝',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Stir%20fried%20shredded%20pork%20with%20green%20pepper%20on%20plate%2C%20Chinese%20cuisine%2C%20food%20photography&image_size=square',
    category: '家常菜',
    calories: 220,
    tags: ['快手菜'],
    steps: [
      '猪里脊切丝，加淀粉、料酒腌制',
      '青椒切丝，蒜切片',
      '热油滑炒肉丝变色盛出',
      '爆香蒜片，下青椒丝翻炒',
      '倒回肉丝，加酱油、盐调味翻炒',
    ],
    ingredients: [
      { ingredientId: 'i6', quantity: 200, unit: '克', required: true },
      { ingredientId: 'i9', quantity: 2, unit: '个', required: true },
      { ingredientId: 'i10', quantity: 2, unit: '瓣', required: true },
      { ingredientId: 'i12', quantity: 2, unit: '勺', required: true },
      { ingredientId: 'i16', quantity: 1, unit: '勺', required: true },
      { ingredientId: 'i39', quantity: 5, unit: '克', required: false },
      { ingredientId: 'i15', quantity: 2, unit: '勺', required: true },
    ],
  },
  {
    id: 'r19',
    name: '三文鱼牛油果沙拉',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Salmon%20avocado%20salad%20in%20bowl%2C%20healthy%20fresh%2C%20food%20photography&image_size=square',
    category: '西餐',
    calories: 280,
    tags: ['低卡', '高蛋白'],
    steps: [
      '三文鱼切丁，牛油果切丁',
      '生菜撕成小块铺底',
      '摆上三文鱼和牛油果',
      '柠檬汁、橄榄油调汁',
      '淋上沙拉汁，撒盐和黑胡椒',
    ],
    ingredients: [
      { ingredientId: 'i24', quantity: 150, unit: '克', required: true },
      { ingredientId: 'i27', quantity: 100, unit: '克', required: true },
      { ingredientId: 'i37', quantity: 1, unit: '个', required: true },
      { ingredientId: 'i13', quantity: 2, unit: '克', required: false },
    ],
  },
  {
    id: 'r20',
    name: '芹菜炒豆干',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Stir%20fried%20celery%20with%20dried%20tofu%20on%20plate%2C%20Chinese%20cuisine%2C%20food%20photography&image_size=square',
    category: '家常菜',
    calories: 130,
    tags: ['低卡', '快手菜'],
    steps: [
      '芹菜切段，豆干切条',
      '热油爆香蒜片',
      '下芹菜翻炒至断生',
      '加入豆干翻炒',
      '加盐、酱油调味出锅',
    ],
    ingredients: [
      { ingredientId: 'i48', quantity: 200, unit: '克', required: true },
      { ingredientId: 'i19', quantity: 1, unit: '块', required: true },
      { ingredientId: 'i10', quantity: 2, unit: '瓣', required: true },
      { ingredientId: 'i12', quantity: 1, unit: '勺', required: true },
      { ingredientId: 'i13', quantity: 2, unit: '克', required: true },
      { ingredientId: 'i15', quantity: 2, unit: '勺', required: true },
    ],
  },
  {
    id: 'r21',
    name: '玉米排骨汤',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Corn%20pork%20rib%20soup%20in%20bowl%2C%20Chinese%20cuisine%2C%20food%20photography&image_size=square',
    category: '汤品',
    calories: 230,
    tags: ['高蛋白'],
    steps: [
      '排骨焯水去血沫',
      '玉米切段，胡萝卜切块',
      '砂锅加水放排骨、姜片，大火烧开',
      '转小火炖40分钟',
      '加入玉米和胡萝卜继续炖20分钟',
      '加盐调味出锅',
    ],
    ingredients: [
      { ingredientId: 'i44', quantity: 400, unit: '克', required: true },
      { ingredientId: 'i49', quantity: 1, unit: '根', required: true },
      { ingredientId: 'i8', quantity: 1, unit: '根', required: true },
      { ingredientId: 'i11', quantity: 3, unit: '片', required: true },
      { ingredientId: 'i13', quantity: 3, unit: '克', required: true },
    ],
  },
  {
    id: 'r22',
    name: '蚝油生菜',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Oyster%20sauce%20lettuce%20on%20plate%2C%20Chinese%20cuisine%2C%20food%20photography&image_size=square',
    category: '粤菜',
    calories: 60,
    tags: ['低卡', '快手菜'],
    steps: [
      '生菜洗净掰开',
      '烧开水焯烫生菜30秒捞出摆盘',
      '热油加蚝油、少许糖和水煮开',
      '淋在生菜上即可',
    ],
    ingredients: [
      { ingredientId: 'i27', quantity: 300, unit: '克', required: true },
      { ingredientId: 'i17', quantity: 2, unit: '勺', required: true },
      { ingredientId: 'i14', quantity: 3, unit: '克', required: false },
      { ingredientId: 'i15', quantity: 1, unit: '勺', required: true },
    ],
  },
  {
    id: 'r23',
    name: '蛋炒饭',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Chinese%20egg%20fried%20rice%20on%20plate%2C%20golden%20color%2C%20food%20photography&image_size=square',
    category: '主食',
    calories: 350,
    tags: ['快手菜'],
    steps: [
      '隔夜米饭拨散，鸡蛋打散',
      '热油炒散鸡蛋盛出',
      '锅中再加少许油，下米饭大火翻炒',
      '倒回鸡蛋，加酱油翻炒匀',
      '撒葱花出锅',
    ],
    ingredients: [
      { ingredientId: 'i20', quantity: 1, unit: '碗', required: true },
      { ingredientId: 'i2', quantity: 2, unit: '个', required: true },
      { ingredientId: 'i12', quantity: 1, unit: '勺', required: true },
      { ingredientId: 'i15', quantity: 2, unit: '勺', required: true },
    ],
  },
  {
    id: 'r24',
    name: '菠菜蛋花汤',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Spinach%20egg%20drop%20soup%20in%20bowl%2C%20Chinese%20cuisine%2C%20food%20photography&image_size=square',
    category: '汤品',
    calories: 70,
    tags: ['低卡', '快手菜'],
    steps: [
      '菠菜洗净切段，鸡蛋打散',
      '烧开水放入菠菜',
      '淋入蛋液搅散成蛋花',
      '加盐、香油调味出锅',
    ],
    ingredients: [
      { ingredientId: 'i28', quantity: 200, unit: '克', required: true },
      { ingredientId: 'i2', quantity: 1, unit: '个', required: true },
      { ingredientId: 'i13', quantity: 2, unit: '克', required: true },
    ],
  },
];

export const DIET_TAGS = ['低卡', '高蛋白', '低碳水', '快手菜'] as const;
export type DietTag = (typeof DIET_TAGS)[number];

export function fuzzyMatchIngredients(query: string): Ingredient[] {
  if (!query.trim()) return [];
  const q = query.trim().toLowerCase();
  return INGREDIENTS.filter((i) => i.name.toLowerCase().includes(q));
}

export function recommendRecipes(
  userIngredients: UserIngredient[],
  dietPreferences: DietTag[]
): RecipeScore[] {
  const userIngredientIds = new Set(userIngredients.map((ui) => ui.ingredientId));

  const scores: RecipeScore[] = RECIPES.map((recipe) => {
    const requiredIngredients = recipe.ingredients.filter((ri) => ri.required);
    const matchedCount = requiredIngredients.filter((ri) =>
      userIngredientIds.has(ri.ingredientId)
    ).length;
    const matchRate =
      requiredIngredients.length > 0 ? matchedCount / requiredIngredients.length : 1;

    const nutritionRate =
      dietPreferences.length > 0
        ? dietPreferences.filter((tag) => recipe.tags.includes(tag)).length /
          dietPreferences.length
        : 0.5;

    const score = 0.6 * matchRate + 0.4 * nutritionRate;

    const missingIngredients = recipe.ingredients.filter(
      (ri) => ri.required && !userIngredientIds.has(ri.ingredientId)
    );

    return {
      recipe,
      score,
      matchRate,
      nutritionRate,
      missingIngredients,
    };
  });

  return scores.sort((a, b) => b.score - a.score).slice(0, 5);
}

export function generateShoppingList(
  selectedRecipes: Recipe[],
  userIngredients: UserIngredient[]
): ShoppingItem[] {
  const userQuantityMap = new Map<string, number>();
  userIngredients.forEach((ui) => {
    userQuantityMap.set(ui.ingredientId, ui.quantity);
  });

  const neededMap = new Map<string, { quantity: number; unit: string; category: Ingredient['category']; name: string }>();

  for (const recipe of selectedRecipes) {
    for (const ri of recipe.ingredients) {
      if (!ri.required) continue;
      const ingredient = getIngredientById(ri.ingredientId);
      if (!ingredient) continue;

      const existing = neededMap.get(ri.ingredientId);
      const totalNeeded = (existing?.quantity ?? 0) + ri.quantity;
      const have = userQuantityMap.get(ri.ingredientId) ?? 0;

      if (totalNeeded > have) {
        neededMap.set(ri.ingredientId, {
          quantity: totalNeeded - have,
          unit: ri.unit,
          category: ingredient.category,
          name: ingredient.name,
        });
      }
    }
  }

  const items: ShoppingItem[] = [];
  neededMap.forEach((val, key) => {
    items.push({
      ingredientId: key,
      name: val.name,
      quantity: val.quantity,
      unit: val.unit,
      category: val.category,
      checked: false,
    });
  });

  const categoryOrder: Ingredient['category'][] = ['vegetables', 'meat', 'seasoning', 'staple', 'dairy', 'fruit'];
  items.sort((a, b) => categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category));

  return items;
}
