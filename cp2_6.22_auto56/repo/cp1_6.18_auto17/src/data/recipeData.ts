import type { Recipe } from '@/types';

const recipeNames = [
  '番茄炒蛋', '红烧牛肉', '宫保鸡丁', '鱼香肉丝', '糖醋排骨',
  '麻婆豆腐', '青椒肉丝', '蒜蓉西兰花', '土豆炖牛肉', '西红柿牛腩',
  '红烧肉', '清蒸鲈鱼', '水煮肉片', '回锅肉', '酸菜鱼',
  '可乐鸡翅', '啤酒鸭', '黄焖鸡', '大盘鸡', '孜然羊肉',
  '葱烧海参', '油焖大虾', '白切鸡', '盐焗鸡', '德州扒鸡',
  '叫花鸡', '佛跳墙', '北京烤鸭', '广式烧鹅', '蜜汁叉烧',
  '蒜蓉粉丝蒸虾', '剁椒鱼头', '泡椒凤爪', '口水鸡', '夫妻肺片',
  '棒棒鸡', '藤椒鱼', '酸菜鱼', '毛血旺', '干锅肥肠',
  '干锅花菜', '干锅土豆', '麻辣香锅', '麻辣烫', '串串香',
  '冒菜', '钵钵鸡', '冷锅串串', '酸辣粉', '重庆小面',
  '兰州拉面', '牛肉面', '阳春面', '担担面', '热干面',
  '炸酱面', '刀削面', '拉面', '烩面', '拌面',
  '蛋炒饭', '扬州炒饭', '酱油炒饭', '咖喱炒饭', '番茄炒饭',
  '鸡蛋羹', '紫菜蛋花汤', '西红柿蛋汤', '冬瓜排骨汤', '萝卜牛腩汤',
  '银耳莲子汤', '绿豆汤', '红豆汤', '八宝粥', '小米粥',
  '皮蛋瘦肉粥', '海鲜粥', '蔬菜粥', '南瓜粥', '银耳羹',
  '红烧茄子', '地三鲜', '干煸豆角', '手撕包菜', '清炒时蔬',
  '凉拌黄瓜', '凉拌木耳', '凉拌海带丝', '拍黄瓜', '糖拌西红柿',
  '宫保虾球', '腰果虾仁', '清炒虾仁', '蒜蓉开背虾', '油焖大虾',
  '清蒸大闸蟹', '麻辣小龙虾', '蒜蓉小龙虾', '十三香小龙虾', '香辣蟹',
];

const ingredientPool = [
  '鸡蛋', '牛奶', '面粉', '番茄', '洋葱', '胡萝卜', '土豆',
  '鸡肉', '牛肉', '猪肉', '鱼', '虾', '大米', '面条',
  '大蒜', '生姜', '黄瓜', '白菜', '蘑菇', '花生',
  '葱', '姜', '蒜', '辣椒', '花椒', '八角', '桂皮',
  '香叶', '草果', '丁香', '白芷', '陈皮', '山楂',
  '酱油', '盐', '糖', '醋', '料酒', '蚝油', '生抽',
  '老抽', '鸡精', '味精', '胡椒粉', '五香粉', '孜然粉',
  '豆腐', '豆芽', '莴笋', '莲藕', '山药', '红薯',
  '玉米', '青豆', '豌豆', '西兰花', '花椰菜', '芹菜',
  '韭菜', '菠菜', '油菜', '生菜', '空心菜', '苋菜',
  '茄子', '辣椒', '青椒', '红椒', '黄椒', '甜椒',
];

const generateSteps = (recipeName: string): string[] => {
  return [
    `准备好制作${recipeName}所需的所有食材，洗净切好备用。`,
    `热锅倒油，放入葱姜蒜爆香，加入主料翻炒均匀。`,
    `根据口味加入适量盐、酱油、料酒等调味料，翻炒至食材入味。`,
    `加入适量清水或高汤，大火烧开后转小火慢炖15-20分钟。`,
    `开盖收汁，根据需要加入水淀粉勾芡，撒上葱花即可出锅。`,
    `将菜肴装盘，配上一碗热腾腾的米饭，享用美味佳肴。`,
    `小贴士：烹饪过程中可根据个人口味调整调味料的用量。`,
  ];
};

const generateRecipe = (index: number): Recipe => {
  const name = recipeNames[index % recipeNames.length];
  const numIngredients = 5 + Math.floor(Math.random() * 4);
  const shuffledIngredients = [...ingredientPool].sort(() => Math.random() - 0.5);
  const ingredients = shuffledIngredients.slice(0, numIngredients);
  
  const isVegetarian = !ingredients.some(i => 
    ['鸡肉', '牛肉', '猪肉', '鱼', '虾', '培根', '香肠', '火腿', '腊肉'].includes(i)
  );
  
  const allergens: string[] = [];
  if (ingredients.includes('花生')) allergens.push('花生');
  if (ingredients.includes('鱼') || ingredients.includes('虾')) allergens.push('海鲜');
  if (ingredients.includes('牛奶')) allergens.push('乳制品');

  const tags: string[] = [];
  if (isVegetarian) tags.push('素食');
  const calories = 200 + Math.floor(Math.random() * 600);
  if (calories < 400) tags.push('低卡');
  const protein = 10 + Math.floor(Math.random() * 40);
  if (protein > 30) tags.push('高蛋白');
  tags.push(['家常菜', '快手菜', '下饭菜', '养生菜'][Math.floor(Math.random() * 4)]);

  return {
    id: `recipe-${index + 1}`,
    name,
    ingredients,
    cookingTime: 15 + Math.floor(Math.random() * 60),
    calories,
    protein,
    fat: 5 + Math.floor(Math.random() * 35),
    carbs: 10 + Math.floor(Math.random() * 60),
    tags,
    steps: generateSteps(name),
    isVegetarian,
    allergens,
  };
};

export const mockRecipes: Recipe[] = Array.from({ length: 100 }, (_, i) => generateRecipe(i));
