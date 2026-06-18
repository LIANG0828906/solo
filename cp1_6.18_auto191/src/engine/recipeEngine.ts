export interface Ingredient {
  id: string;
  name: string;
  category: "staple" | "vegetable" | "meat" | "seasoning";
  icon: string;
}

export interface RecipeIngredient {
  id: string;
  name: string;
  amount: string;
}

export interface RecipeStep {
  description: string;
  semiProduct?: string;
}

export interface Recipe {
  id: string;
  name: string;
  category: string;
  tags: string[];
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  combination: string[];
}

export const INGREDIENTS: Ingredient[] = [
  { id: "flour", name: "面粉", category: "staple", icon: "🌾" },
  { id: "rice", name: "米", category: "staple", icon: "🍚" },
  { id: "noodles", name: "面条", category: "staple", icon: "🍜" },
  { id: "mantou", name: "馒头", category: "staple", icon: "🍞" },
  { id: "water", name: "水", category: "staple", icon: "💧" },
  { id: "tomato", name: "番茄", category: "vegetable", icon: "🍅" },
  { id: "potato", name: "土豆", category: "vegetable", icon: "🥔" },
  { id: "cabbage", name: "白菜", category: "vegetable", icon: "🥬" },
  { id: "carrot", name: "胡萝卜", category: "vegetable", icon: "🥕" },
  { id: "onion", name: "洋葱", category: "vegetable", icon: "🧅" },
  { id: "pepper", name: "青椒", category: "vegetable", icon: "🫑" },
  { id: "chicken", name: "鸡肉", category: "meat", icon: "🍗" },
  { id: "pork", name: "猪肉", category: "meat", icon: "🥩" },
  { id: "beef", name: "牛肉", category: "meat", icon: "🥓" },
  { id: "egg", name: "鸡蛋", category: "meat", icon: "🥚" },
  { id: "shrimp", name: "虾", category: "meat", icon: "🦐" },
  { id: "salt", name: "盐", category: "seasoning", icon: "🧂" },
  { id: "soysauce", name: "酱油", category: "seasoning", icon: "🫗" },
  { id: "vinegar", name: "醋", category: "seasoning", icon: "🍶" },
  { id: "sugar", name: "糖", category: "seasoning", icon: "🍬" },
  { id: "yeast", name: "酵母", category: "seasoning", icon: "🫧" },
  { id: "cookingwine", name: "料酒", category: "seasoning", icon: "🍶" },
  { id: "pepperpowder", name: "胡椒粉", category: "seasoning", icon: "🌶️" },
  { id: "ginger", name: "姜", category: "seasoning", icon: "🫚" },
];

export const RECIPES: Recipe[] = [
  {
    id: "bread",
    name: "面包",
    category: "主食",
    tags: ["主食", "烘焙"],
    ingredients: [
      { id: "flour", name: "面粉", amount: "300g" },
      { id: "water", name: "水", amount: "180ml" },
      { id: "yeast", name: "酵母", amount: "5g" },
    ],
    steps: [
      { description: "将面粉、水和酵母混合，揉成光滑面团" },
      { description: "面团发酵至两倍大小，约1小时", semiProduct: "发酵面团" },
      { description: "整形后放入烤箱，180°C烤25分钟", semiProduct: "烤制中" },
      { description: "出炉晾凉，切片享用", semiProduct: "面包" },
    ],
    combination: ["flour", "water", "yeast"],
  },
  {
    id: "tomato_egg",
    name: "番茄炒蛋",
    category: "家常菜",
    tags: ["家常菜", "快手菜"],
    ingredients: [
      { id: "tomato", name: "番茄", amount: "2个" },
      { id: "egg", name: "鸡蛋", amount: "3个" },
      { id: "salt", name: "盐", amount: "适量" },
    ],
    steps: [
      { description: "番茄切块，鸡蛋打散加盐搅匀" },
      { description: "热锅凉油，倒入蛋液翻炒至凝固盛出", semiProduct: "炒蛋" },
      { description: "锅中加油炒番茄至出汁，倒回炒蛋", semiProduct: "翻炒中" },
      { description: "翻炒均匀调味出锅", semiProduct: "番茄炒蛋" },
    ],
    combination: ["tomato", "egg", "salt"],
  },
  {
    id: "braised_pork",
    name: "红烧肉",
    category: "荤菜",
    tags: ["荤菜", "硬菜"],
    ingredients: [
      { id: "pork", name: "猪肉", amount: "500g" },
      { id: "soysauce", name: "酱油", amount: "3勺" },
      { id: "sugar", name: "糖", amount: "2勺" },
    ],
    steps: [
      { description: "猪肉切块焯水去血沫" },
      { description: "锅中加糖炒出焦色，放入肉块翻炒上色", semiProduct: "炒糖色" },
      { description: "加入酱油和热水，大火烧开转小火炖1小时", semiProduct: "炖煮中" },
      { description: "大火收汁至浓稠，出锅装盘", semiProduct: "红烧肉" },
    ],
    combination: ["pork", "soysauce", "sugar"],
  },
  {
    id: "beef_stew",
    name: "土豆炖牛肉",
    category: "炖菜",
    tags: ["炖菜", "硬菜"],
    ingredients: [
      { id: "potato", name: "土豆", amount: "2个" },
      { id: "beef", name: "牛肉", amount: "400g" },
      { id: "salt", name: "盐", amount: "适量" },
    ],
    steps: [
      { description: "牛肉切块焯水，土豆去皮切块" },
      { description: "锅中爆香姜片，放入牛肉翻炒", semiProduct: "炒牛肉" },
      { description: "加入土豆和热水，小火炖煮1.5小时", semiProduct: "炖煮中" },
      { description: "加盐调味，大火收汁出锅", semiProduct: "土豆炖牛肉" },
    ],
    combination: ["potato", "beef", "salt"],
  },
  {
    id: "chicken_fried_rice",
    name: "鸡肉炒饭",
    category: "主食",
    tags: ["主食", "快手菜"],
    ingredients: [
      { id: "chicken", name: "鸡肉", amount: "150g" },
      { id: "rice", name: "米", amount: "200g" },
      { id: "soysauce", name: "酱油", amount: "1勺" },
    ],
    steps: [
      { description: "米饭提前煮好放凉，鸡肉切丁" },
      { description: "热锅炒鸡丁至变色", semiProduct: "炒鸡丁" },
      { description: "加入米饭翻炒，淋酱油调色", semiProduct: "翻炒中" },
      { description: "翻炒均匀出锅", semiProduct: "鸡肉炒饭" },
    ],
    combination: ["chicken", "rice", "soysauce"],
  },
  {
    id: "sour_potato",
    name: "酸辣土豆丝",
    category: "素菜",
    tags: ["素菜", "快手菜"],
    ingredients: [
      { id: "potato", name: "土豆", amount: "2个" },
      { id: "vinegar", name: "醋", amount: "2勺" },
      { id: "salt", name: "盐", amount: "适量" },
    ],
    steps: [
      { description: "土豆去皮切细丝，泡水去淀粉" },
      { description: "热锅凉油，放入土豆丝大火翻炒", semiProduct: "翻炒中" },
      { description: "加醋和盐调味，继续翻炒至断生", semiProduct: "调味中" },
      { description: "出锅装盘", semiProduct: "酸辣土豆丝" },
    ],
    combination: ["potato", "vinegar", "salt"],
  },
  {
    id: "dumplings",
    name: "饺子",
    category: "主食",
    tags: ["主食", "传统菜"],
    ingredients: [
      { id: "flour", name: "面粉", amount: "300g" },
      { id: "pork", name: "猪肉", amount: "200g" },
      { id: "cabbage", name: "白菜", amount: "150g" },
    ],
    steps: [
      { description: "面粉加水揉成面团，猪肉白菜剁馅调味" },
      { description: "擀皮包馅，捏成饺子", semiProduct: "包饺子" },
      { description: "烧开水，下饺子煮至浮起", semiProduct: "煮饺子" },
      { description: "捞出蘸醋享用", semiProduct: "饺子" },
    ],
    combination: ["flour", "pork", "cabbage"],
  },
  {
    id: "sweet_sour_ribs",
    name: "糖醋排骨",
    category: "荤菜",
    tags: ["荤菜", "传统菜"],
    ingredients: [
      { id: "pork", name: "猪肉", amount: "500g" },
      { id: "vinegar", name: "醋", amount: "3勺" },
      { id: "sugar", name: "糖", amount: "4勺" },
    ],
    steps: [
      { description: "排骨剁段焯水沥干" },
      { description: "热油炸至金黄捞出", semiProduct: "炸排骨" },
      { description: "锅中加糖醋调汁，倒入排骨翻炒", semiProduct: "裹汁中" },
      { description: "收汁出锅撒芝麻", semiProduct: "糖醋排骨" },
    ],
    combination: ["pork", "vinegar", "sugar"],
  },
  {
    id: "onion_beef",
    name: "洋葱炒牛肉",
    category: "荤菜",
    tags: ["荤菜", "快手菜"],
    ingredients: [
      { id: "onion", name: "洋葱", amount: "1个" },
      { id: "beef", name: "牛肉", amount: "250g" },
      { id: "soysauce", name: "酱油", amount: "2勺" },
    ],
    steps: [
      { description: "牛肉切片用酱油腌制，洋葱切丝" },
      { description: "大火爆炒牛肉至变色盛出", semiProduct: "炒牛肉" },
      { description: "炒软洋葱，倒回牛肉翻炒", semiProduct: "翻炒中" },
      { description: "调味出锅", semiProduct: "洋葱炒牛肉" },
    ],
    combination: ["onion", "beef", "soysauce"],
  },
  {
    id: "carrot_egg",
    name: "胡萝卜炒鸡蛋",
    category: "素菜",
    tags: ["素菜", "快手菜"],
    ingredients: [
      { id: "carrot", name: "胡萝卜", amount: "1根" },
      { id: "egg", name: "鸡蛋", amount: "3个" },
      { id: "salt", name: "盐", amount: "适量" },
    ],
    steps: [
      { description: "胡萝卜切丝，鸡蛋打散加盐" },
      { description: "先炒鸡蛋盛出", semiProduct: "炒蛋" },
      { description: "炒软胡萝卜丝，倒回鸡蛋翻炒", semiProduct: "翻炒中" },
      { description: "调味出锅", semiProduct: "胡萝卜炒鸡蛋" },
    ],
    combination: ["carrot", "egg", "salt"],
  },
  {
    id: "pepper_pork",
    name: "青椒肉丝",
    category: "荤菜",
    tags: ["荤菜", "快手菜"],
    ingredients: [
      { id: "pepper", name: "青椒", amount: "2个" },
      { id: "pork", name: "猪肉", amount: "200g" },
      { id: "soysauce", name: "酱油", amount: "1勺" },
    ],
    steps: [
      { description: "猪肉切丝用酱油腌制，青椒切丝" },
      { description: "大火爆炒肉丝至变色", semiProduct: "炒肉丝" },
      { description: "加入青椒丝大火翻炒", semiProduct: "翻炒中" },
      { description: "调味出锅", semiProduct: "青椒肉丝" },
    ],
    combination: ["pepper", "pork", "soysauce"],
  },
  {
    id: "ginger_chicken",
    name: "姜葱鸡",
    category: "荤菜",
    tags: ["荤菜", "传统菜"],
    ingredients: [
      { id: "chicken", name: "鸡肉", amount: "500g" },
      { id: "ginger", name: "姜", amount: "5片" },
      { id: "salt", name: "盐", amount: "适量" },
    ],
    steps: [
      { description: "鸡肉洗净切块，姜切片" },
      { description: "冷水下锅焯水去腥", semiProduct: "焯水" },
      { description: "加姜片炖煮40分钟", semiProduct: "炖煮中" },
      { description: "加盐调味出锅", semiProduct: "姜葱鸡" },
    ],
    combination: ["chicken", "ginger", "salt"],
  },
  {
    id: "egg_fried_rice",
    name: "蛋炒饭",
    category: "主食",
    tags: ["主食", "快手菜"],
    ingredients: [
      { id: "rice", name: "米", amount: "200g" },
      { id: "egg", name: "鸡蛋", amount: "2个" },
      { id: "salt", name: "盐", amount: "适量" },
    ],
    steps: [
      { description: "米饭提前煮好放凉，鸡蛋打散" },
      { description: "热锅炒蛋至半凝固", semiProduct: "炒蛋" },
      { description: "加入米饭大火翻炒", semiProduct: "翻炒中" },
      { description: "加盐调味翻炒均匀出锅", semiProduct: "蛋炒饭" },
    ],
    combination: ["rice", "egg", "salt"],
  },
  {
    id: "shrimp_stir_fry",
    name: "白灼虾",
    category: "海鲜",
    tags: ["海鲜", "快手菜"],
    ingredients: [
      { id: "shrimp", name: "虾", amount: "500g" },
      { id: "ginger", name: "姜", amount: "3片" },
      { id: "soysauce", name: "酱油", amount: "1勺" },
    ],
    steps: [
      { description: "虾洗净去虾线，姜切片" },
      { description: "锅中烧开水加姜片", semiProduct: "烧水" },
      { description: "放入虾煮至变红捞出", semiProduct: "煮虾" },
      { description: "酱油做蘸料享用", semiProduct: "白灼虾" },
    ],
    combination: ["shrimp", "ginger", "soysauce"],
  },
  {
    id: "noodle_soup",
    name: "阳春面",
    category: "主食",
    tags: ["主食", "快手菜"],
    ingredients: [
      { id: "noodles", name: "面条", amount: "200g" },
      { id: "salt", name: "盐", amount: "适量" },
      { id: "soysauce", name: "酱油", amount: "1勺" },
    ],
    steps: [
      { description: "锅中烧开水" },
      { description: "下入面条煮至八分熟", semiProduct: "煮面" },
      { description: "碗中放酱油和盐，冲入面汤", semiProduct: "调汤" },
      { description: "捞入面条撒上葱花", semiProduct: "阳春面" },
    ],
    combination: ["noodles", "salt", "soysauce"],
  },
];

export function findMatchingRecipe(ingredientIds: string[]): Recipe | null {
  if (ingredientIds.length < 2) return null;

  const sortedInput = [...ingredientIds].sort();

  for (const recipe of RECIPES) {
    const sortedCombo = [...recipe.combination].sort();
    if (sortedInput.length === sortedCombo.length && sortedInput.every((id, i) => id === sortedCombo[i])) {
      return recipe;
    }
  }

  return null;
}

export function searchRecipes(query: string): Recipe[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();

  return RECIPES.filter((recipe) => {
    if (recipe.name.toLowerCase().includes(q)) return true;
    if (recipe.tags.some((t) => t.toLowerCase().includes(q))) return true;
    if (recipe.ingredients.some((ing) => ing.name.toLowerCase().includes(q))) return true;
    return false;
  });
}
