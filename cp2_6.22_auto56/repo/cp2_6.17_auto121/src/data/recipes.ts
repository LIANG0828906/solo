import { v4 as uuidv4 } from 'uuid'

export interface Recipe {
  id: string
  name: string
  cover: string
  author: string
  description: string
  ingredients: string[]
  steps: string[]
  isFavorited: boolean
  createdAt: number
}

const RECIPES_KEY = 'recipeforge_recipes'
const FAVORITES_KEY = 'recipeforge_favorites'

const foodImages = [
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600',
  'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600',
  'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600',
  'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=600',
  'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=600',
  'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=600',
  'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600',
  'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=600',
  'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=600',
  'https://images.unsplash.com/photo-1541544537156-7627a7a4aa1c?w=600',
  'https://images.unsplash.com/photo-1574484284002-952d92456975?w=600',
]

const recipeNames = [
  '番茄炒蛋', '红烧排骨', '宫保鸡丁', '鱼香肉丝', '麻婆豆腐',
  '糖醋里脊', '水煮牛肉', '地三鲜', '蒜蓉西兰花', '可乐鸡翅',
  '青椒土豆丝', '红烧茄子', '干煸四季豆', '回锅肉', '口水鸡',
  '酸辣土豆丝', '葱爆牛肉', '清蒸鲈鱼', '白切鸡', '东坡肉',
  '北京烤鸭', '辣子鸡', '水煮鱼', '酸菜鱼', '毛血旺',
  '扬州炒饭', '蛋炒饭', '牛肉拉面', '炸酱面', '热干面',
  '兰州拉面', '刀削面', '担担面', '冷面', '意大利面',
  '日式咖喱饭', '韩式拌饭', '越南河粉', '泰式冬阴功', '西班牙海鲜饭',
  '法式洋葱汤', '美式汉堡', '英式下午茶', '墨西哥卷饼', '印度咖喱',
  '希腊沙拉', '土耳其烤肉', '巴西烤肉', '北非炖蛋', '中东烤肉'
]

const authors = [
  '美食家小王', '厨神阿杰', '家庭主妇李阿姨', '新手厨师小张', '私房菜达人',
  '米其林三星主厨', '路边摊老板', '深夜食堂老板', '美食博主小美', '健身营养师'
]

const descriptions = [
  '这是一道家常菜，简单易做，味道鲜美，适合全家人一起享用。',
  '经典的中式菜肴，色香味俱全，是宴客的不二之选。',
  '口感丰富，营养均衡，既美味又健康。',
  '传承百年的老配方，每一口都是家乡的味道。',
  '创新做法，保留传统风味的同时加入了现代元素。',
  '十分钟就能搞定的快手菜，忙碌上班族的福音。',
  '低脂高蛋白，健身减脂期的完美选择。',
  '小孩子最爱吃的家常菜，下饭神器。'
]

const allIngredients = [
  '番茄 2个', '鸡蛋 3个', '盐 适量', '糖 少许', '葱花 适量',
  '排骨 500g', '生抽 2勺', '老抽 1勺', '料酒 1勺', '冰糖 10g',
  '鸡胸肉 300g', '花生米 50g', '干辣椒 适量', '花椒 少许', '葱姜蒜 适量',
  '牛肉 300g', '土豆 2个', '胡萝卜 1根', '洋葱 半个', '咖喱块 2块',
  '豆腐 1块', '猪肉末 100g', '豆瓣酱 1勺', '花椒粉 少许', '蒜末 适量',
  '里脊 300g', '番茄酱 3勺', '白醋 1勺', '淀粉 适量', '料酒 1勺',
  '鱼肉 500g', '豆芽 200g', '干辣椒 10个', '花椒 1勺', '火锅底料 1块',
  '茄子 2根', '青椒 2个', '土豆 1个', '蒜末 适量', '生抽 1勺',
  '西兰花 1颗', '大蒜 5瓣', '蚝油 1勺', '盐 适量', '食用油 适量',
  '鸡翅 8个', '可乐 1罐', '生抽 2勺', '老抽 半勺', '姜片 适量'
]

const allSteps = [
  '将食材洗净切好备用。',
  '热锅下油，放入葱姜蒜爆香。',
  '加入主料翻炒至变色。',
  '加入调料和适量水，大火煮开后转小火慢炖。',
  '收汁至浓稠，撒上葱花即可出锅。',
  '另起一锅烧水，将配菜焯水后捞出。',
  '将所有食材混合均匀，淋上酱汁。',
  '装盘摆盘，点缀一些香菜或芝麻。'
]

function generateMockRecipes(): Recipe[] {
  const recipes: Recipe[] = []
  
  for (let i = 0; i < 50; i++) {
    const numIngredients = 4 + Math.floor(Math.random() * 4)
    const numSteps = 3 + Math.floor(Math.random() * 4)
    
    const shuffledIngredients = [...allIngredients].sort(() => Math.random() - 0.5)
    const shuffledSteps = [...allSteps].sort(() => Math.random() - 0.5)
    
    recipes.push({
      id: uuidv4(),
      name: recipeNames[i % recipeNames.length],
      cover: foodImages[i % foodImages.length],
      author: authors[i % authors.length],
      description: descriptions[i % descriptions.length],
      ingredients: shuffledIngredients.slice(0, numIngredients),
      steps: shuffledSteps.slice(0, numSteps),
      isFavorited: false,
      createdAt: Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
    })
  }
  
  return recipes
}

export function getRecipes(): Recipe[] {
  try {
    const stored = localStorage.getItem(RECIPES_KEY)
    if (stored) {
      const recipes: Recipe[] = JSON.parse(stored)
      const favorites = getFavorites()
      return recipes.map(r => ({
        ...r,
        isFavorited: favorites.includes(r.id)
      }))
    }
    
    const mockRecipes = generateMockRecipes()
    localStorage.setItem(RECIPES_KEY, JSON.stringify(mockRecipes))
    return mockRecipes
  } catch {
    return generateMockRecipes()
  }
}

export function getRecipeById(id: string): Recipe | undefined {
  const recipes = getRecipes()
  return recipes.find(r => r.id === id)
}

export function createRecipe(data: Omit<Recipe, 'id' | 'isFavorited' | 'createdAt'>): Recipe {
  const newRecipe: Recipe = {
    ...data,
    id: uuidv4(),
    isFavorited: false,
    createdAt: Date.now()
  }
  
  const rawRecipes = getRawRecipes()
  rawRecipes.unshift(newRecipe)
  localStorage.setItem(RECIPES_KEY, JSON.stringify(rawRecipes))
  
  return newRecipe
}

export function updateRecipe(id: string, data: Partial<Recipe>): Recipe | undefined {
  const recipes = getRawRecipes()
  const index = recipes.findIndex(r => r.id === id)
  if (index === -1) return undefined
  
  recipes[index] = { ...recipes[index], ...data }
  localStorage.setItem(RECIPES_KEY, JSON.stringify(recipes))
  
  return getRecipeById(id)
}

export function deleteRecipe(id: string): boolean {
  const recipes = getRawRecipes()
  const filtered = recipes.filter(r => r.id !== id)
  if (filtered.length === recipes.length) return false
  
  localStorage.setItem(RECIPES_KEY, JSON.stringify(filtered))
  removeFavorite(id)
  return true
}

function getRawRecipes(): Recipe[] {
  try {
    const stored = localStorage.getItem(RECIPES_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
    const mockRecipes = generateMockRecipes()
    localStorage.setItem(RECIPES_KEY, JSON.stringify(mockRecipes))
    return mockRecipes
  } catch {
    return generateMockRecipes()
  }
}

function getFavorites(): string[] {
  try {
    const stored = localStorage.getItem(FAVORITES_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
    return []
  } catch {
    return []
  }
}

export function toggleFavorite(id: string): boolean {
  const favorites = getFavorites()
  const index = favorites.indexOf(id)
  
  if (index === -1) {
    favorites.push(id)
  } else {
    favorites.splice(index, 1)
  }
  
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites))
  return index === -1
}

function removeFavorite(id: string): void {
  const favorites = getFavorites()
  const index = favorites.indexOf(id)
  if (index !== -1) {
    favorites.splice(index, 1)
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites))
  }
}

export function getRandomRecipes(count: number, excludeId?: string): Recipe[] {
  const recipes = getRecipes().filter(r => r.id !== excludeId)
  const shuffled = [...recipes].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

function extractKeywords(recipe: Recipe): Set<string> {
  const keywords = new Set<string>()
  const addKeyword = (text: string) => {
    const clean = text.toLowerCase().trim()
    if (clean.length >= 2) {
      keywords.add(clean)
      clean.split(/[\s,，。、]+/).forEach(word => {
        if (word.length >= 2) keywords.add(word)
      })
    }
  }
  recipe.ingredients.forEach(addKeyword)
  recipe.name && addKeyword(recipe.name)
  return keywords
}

export function getRelatedRecipes(recipe: Recipe, count: number): Recipe[] {
  const allRecipes = getRecipes().filter(r => r.id !== recipe.id)
  const currentKeywords = extractKeywords(recipe)

  const scored = allRecipes.map(r => {
    const rKeywords = extractKeywords(r)
    let score = 0
    currentKeywords.forEach(kw => {
      if (rKeywords.has(kw)) score += 1
      for (const rkw of rKeywords) {
        if (rkw.includes(kw) || kw.includes(rkw)) score += 0.5
      }
    })
    return { recipe: r, score }
  })

  scored.sort((a, b) => b.score - a.score)

  const matched = scored.filter(s => s.score > 0)
  if (matched.length >= count) {
    return matched.slice(0, count).map(s => s.recipe)
  }

  const matchedIds = new Set(matched.map(s => s.recipe.id))
  const remaining = allRecipes
    .filter(r => !matchedIds.has(r.id))
    .sort(() => Math.random() - 0.5)

  return [
    ...matched.map(s => s.recipe),
    ...remaining.slice(0, count - matched.length)
  ]
}
