import express from 'express'
import cors from 'cors'
import Mock from 'mockjs'
import { v4 as uuidv4 } from 'uuid'

const app = express()
app.use(cors())
app.use(express.json({ limit: '10mb' }))

const ingredientPool = [
  '鸡蛋', '猪肉', '牛肉', '鸡肉', '鱼肉', '虾', '豆腐', '白菜', '青菜', '番茄',
  '土豆', '胡萝卜', '洋葱', '大蒜', '生姜', '青椒', '红椒', '黄瓜', '茄子', '豆角',
  '米饭', '面条', '面粉', '酱油', '醋', '盐', '糖', '料酒', '淀粉', '花生油',
  '香菇', '木耳', '海带', '紫菜', '花生', '芝麻', '辣椒', '花椒', '八角', '桂皮'
]

const recipeTitles = [
  '妈妈的红烧肉', '外婆的番茄炒蛋', '爸爸的糖醋排骨', '家常土豆丝', '红烧豆腐',
  '青椒肉丝', '宫保鸡丁', '鱼香肉丝', '麻婆豆腐', '回锅肉',
  '可乐鸡翅', '蒜蓉西兰花', '清蒸鲈鱼', '水煮牛肉', '干煸四季豆',
  '西红柿鸡蛋面', '蛋炒饭', '酸辣土豆丝', '红烧茄子', '肉末豆角'
]

const coverImages = [
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600',
  'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600',
  'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600',
  'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=600',
  'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=600',
  'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=600',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600',
  'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600',
  'https://images.unsplash.com/photo-1482049016gy-296799078351?w=600'
]

interface Recipe {
  id: string
  title: string
  description: string
  ingredients: { name: string; amount: string }[]
  steps: string[]
  coverImage: string
  likes: number
  dislikes: number
  author: string
  authorAvatar: string
  createdAt: string
}

let recipes: Recipe[] = []

function generateMockRecipes(count: number): Recipe[] {
  const result: Recipe[] = []
  for (let i = 0; i < count; i++) {
    const ingredientCount = Mock.Random.integer(3, 8)
    const ingredients = []
    const usedIngredients = new Set<string>()
    for (let j = 0; j < ingredientCount; j++) {
      let ing = ingredientPool[Mock.Random.integer(0, ingredientPool.length - 1)]
      while (usedIngredients.has(ing)) {
        ing = ingredientPool[Mock.Random.integer(0, ingredientPool.length - 1)]
      }
      usedIngredients.add(ing)
      ingredients.push({
        name: ing,
        amount: `${Mock.Random.integer(50, 500)}${Mock.Random.pick(['克', '毫升', '个', '勺'])}`
      })
    }

    const stepCount = Mock.Random.integer(3, 6)
    const steps = []
    for (let j = 0; j < stepCount; j++) {
      steps.push(`第${j + 1}步：${Mock.Random.cparagraph(1, 2)}`)
    }

    result.push({
      id: uuidv4(),
      title: recipeTitles[i % recipeTitles.length] + (i >= recipeTitles.length ? `·家传版` : ''),
      description: Mock.Random.cparagraph(1, 3),
      ingredients,
      steps,
      coverImage: coverImages[i % coverImages.length],
      likes: Mock.Random.integer(0, 500),
      dislikes: Mock.Random.integer(0, 50),
      author: Mock.Random.cname(),
      authorAvatar: `https://i.pravatar.cc/100?img=${Mock.Random.integer(1, 70)}`,
      createdAt: Mock.Random.datetime('yyyy-MM-dd HH:mm:ss')
    })
  }
  return result
}

recipes = generateMockRecipes(30)

app.get('/api/recipes', (req, res) => {
  const page = parseInt(req.query.page as string) || 1
  const pageSize = parseInt(req.query.pageSize as string) || 10
  const start = (page - 1) * pageSize
  const end = start + pageSize
  const data = recipes.slice(start, end)
  res.json({
    code: 0,
    data,
    total: recipes.length,
    hasMore: end < recipes.length
  })
})

app.get('/api/recipes/search', (req, res) => {
  const ingredientsParam = req.query.ingredients as string
  if (!ingredientsParam) {
    return res.json({ code: 0, data: recipes.slice(0, 10), total: recipes.length })
  }
  const searchIngredients = ingredientsParam.split(',').map(s => s.trim()).filter(Boolean)
  
  const matched = recipes.map(recipe => {
    const recipeIngredientNames = recipe.ingredients.map(ing => ing.name)
    let matchCount = 0
    searchIngredients.forEach(ing => {
      if (recipeIngredientNames.some(name => name.includes(ing) || ing.includes(name))) {
        matchCount++
      }
    })
    const matchRatio = matchCount / Math.max(searchIngredients.length, 1)
    return { ...recipe, matchCount, matchRatio }
  }).filter(r => r.matchCount > 0)
    .sort((a, b) => b.matchRatio - a.matchRatio)

  const result = matched.map(r => {
    const { matchCount, matchRatio, ...rest } = r
    return { ...rest, matchLevel: matchRatio >= 0.8 ? 'high' : matchRatio >= 0.5 ? 'medium' : 'low' }
  })

  res.json({ code: 0, data: result, total: result.length })
})

app.get('/api/recipes/hot', (req, res) => {
  const hot = [...recipes].sort((a, b) => b.likes - a.likes).slice(0, 8)
  res.json({ code: 0, data: hot })
})

app.get('/api/recipes/:id', (req, res) => {
  const recipe = recipes.find(r => r.id === req.params.id)
  if (!recipe) {
    return res.status(404).json({ code: 1, message: '菜谱不存在' })
  }
  res.json({ code: 0, data: recipe })
})

app.post('/api/recipes', (req, res) => {
  const { title, description, ingredients, steps, coverImage } = req.body
  if (!title || !ingredients || ingredients.length === 0) {
    return res.status(400).json({ code: 1, message: '菜名和食材不能为空' })
  }
  const newRecipe: Recipe = {
    id: uuidv4(),
    title,
    description: description || '',
    ingredients,
    steps: steps || [],
    coverImage: coverImage || coverImages[0],
    likes: 0,
    dislikes: 0,
    author: '美食达人',
    authorAvatar: 'https://i.pravatar.cc/100?img=12',
    createdAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
  }
  recipes.unshift(newRecipe)
  res.json({ code: 0, data: newRecipe })
})

app.post('/api/recipes/:id/like', (req, res) => {
  const recipe = recipes.find(r => r.id === req.params.id)
  if (!recipe) {
    return res.status(404).json({ code: 1, message: '菜谱不存在' })
  }
  recipe.likes++
  res.json({ code: 0, data: { likes: recipe.likes, dislikes: recipe.dislikes } })
})

app.post('/api/recipes/:id/dislike', (req, res) => {
  const recipe = recipes.find(r => r.id === req.params.id)
  if (!recipe) {
    return res.status(404).json({ code: 1, message: '菜谱不存在' })
  }
  recipe.dislikes++
  res.json({ code: 0, data: { likes: recipe.likes, dislikes: recipe.dislikes } })
})

app.get('/api/user/recent', (req, res) => {
  const recent = recipes.slice(0, 4)
  res.json({ code: 0, data: recent })
})

app.get('/api/user/published', (req, res) => {
  const published = recipes.slice(2, 6)
  res.json({ code: 0, data: published })
})

const PORT = 3001
app.listen(PORT, () => {
  console.log(`菜谱服务运行在 http://localhost:${PORT}`)
})
