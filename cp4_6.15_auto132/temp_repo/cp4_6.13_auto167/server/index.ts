import express from 'express'
import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import { v4 as uuidv4 } from 'uuid'
import { foodDatabase, Food } from './foodData'
import { recipeDatabase, Recipe } from './recipeData'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = 3001

app.use(express.json())

const dbPath = path.join(__dirname, '..', 'nutrition.db')
const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('synchronous = NORMAL')
db.pragma('cache_size = -32000')

function validateFood(food: any): food is Food {
  return (
    food &&
    typeof food.id === 'string' &&
    typeof food.name === 'string' &&
    typeof food.calories === 'number' &&
    typeof food.protein === 'number' &&
    typeof food.fat === 'number' &&
    typeof food.carbs === 'number' &&
    typeof food.serving === 'string'
  )
}

function validateRecipe(recipe: any): recipe is Recipe {
  return (
    recipe &&
    typeof recipe.id === 'string' &&
    typeof recipe.name === 'string' &&
    Array.isArray(recipe.foodIds) &&
    recipe.foodIds.length > 0 &&
    recipe.foodIds.every((id: any) => typeof id === 'string') &&
    Array.isArray(recipe.servings) &&
    recipe.servings.length === recipe.foodIds.length &&
    typeof recipe.totalCalories === 'number' &&
    typeof recipe.totalProtein === 'number' &&
    typeof recipe.totalFat === 'number' &&
    typeof recipe.totalCarbs === 'number'
  )
}

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS foods (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      calories REAL NOT NULL,
      protein REAL NOT NULL,
      fat REAL NOT NULL,
      carbs REAL NOT NULL,
      serving TEXT NOT NULL
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS recipes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      category TEXT DEFAULT 'lunch',
      total_calories REAL NOT NULL,
      total_protein REAL NOT NULL,
      total_fat REAL NOT NULL,
      total_carbs REAL NOT NULL
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS recipe_foods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipe_id TEXT NOT NULL,
      food_id TEXT NOT NULL,
      serving REAL NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (recipe_id) REFERENCES recipes(id),
      FOREIGN KEY (food_id) REFERENCES foods(id)
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS meals (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      food_id TEXT NOT NULL,
      food_name TEXT NOT NULL,
      calories REAL NOT NULL,
      protein REAL NOT NULL,
      fat REAL NOT NULL,
      carbs REAL NOT NULL,
      serving TEXT NOT NULL,
      quantity REAL NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS nutrition_goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      daily_calories REAL NOT NULL DEFAULT 2000,
      daily_protein REAL NOT NULL DEFAULT 60,
      daily_fat REAL NOT NULL DEFAULT 65,
      daily_carbs REAL NOT NULL DEFAULT 250,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  const foodCount = (db.prepare('SELECT COUNT(*) as cnt FROM foods').get() as any).cnt
  const validFoods = foodDatabase.filter(validateFood)

  if (foodCount === 0 && validFoods.length > 0) {
    const seenIds = new Set<string>()
    const insertFood = db.prepare(`
      INSERT OR IGNORE INTO foods (id, name, calories, protein, fat, carbs, serving)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    const tx = db.transaction((foods: Food[]) => {
      for (const food of foods) {
        if (!seenIds.has(food.id)) {
          seenIds.add(food.id)
          insertFood.run(food.id, food.name, food.calories, food.protein, food.fat, food.carbs, food.serving)
        }
      }
    })
    tx(validFoods)
    console.log(`插入了 ${seenIds.size} 种食物到数据库`)
  }

  const recipeCount = (db.prepare('SELECT COUNT(*) as cnt FROM recipes').get() as any).cnt
  const validRecipes = recipeDatabase.filter(validateRecipe)

  if (recipeCount === 0 && validRecipes.length > 0) {
    const seenRecipeIds = new Set<string>()
    const insertRecipe = db.prepare(`
      INSERT OR IGNORE INTO recipes (id, name, description, category, total_calories, total_protein, total_fat, total_carbs)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    const insertRecipeFood = db.prepare(`
      INSERT INTO recipe_foods (recipe_id, food_id, serving, sort_order)
      VALUES (?, ?, ?, ?)
    `)

    const tx = db.transaction((recipes: Recipe[]) => {
      for (let idx = 0; idx < recipes.length; idx++) {
        const recipe = recipes[idx]
        if (!seenRecipeIds.has(recipe.id)) {
          seenRecipeIds.add(recipe.id)
          insertRecipe.run(
            recipe.id,
            recipe.name,
            recipe.description || '',
            recipe.category || 'lunch',
            recipe.totalCalories,
            recipe.totalProtein,
            recipe.totalFat,
            recipe.totalCarbs
          )
          for (let j = 0; j < recipe.foodIds.length; j++) {
            insertRecipeFood.run(recipe.id, recipe.foodIds[j], recipe.servings[j], j)
          }
        }
      }
    })
    tx(validRecipes)
    console.log(`插入了 ${seenRecipeIds.size} 组食谱到数据库`)
  }

  const goalStmt = db.prepare('SELECT COUNT(*) as count FROM nutrition_goals')
  const result = goalStmt.get() as { count: number }
  if (result.count === 0) {
    db.prepare(`
      INSERT INTO nutrition_goals (daily_calories, daily_protein, daily_fat, daily_carbs)
      VALUES (2000, 60, 65, 250)
    `).run()
  }

  db.exec(`CREATE INDEX IF NOT EXISTS idx_meals_date ON meals(date)`)
  db.exec(`CREATE INDEX IF NOT EXISTS idx_foods_name ON foods(name)`)
  db.exec(`CREATE INDEX IF NOT EXISTS idx_recipe_foods_recipe ON recipe_foods(recipe_id)`)
  db.exec(`CREATE INDEX IF NOT EXISTS idx_recipe_foods_food ON recipe_foods(food_id)`)
}

initDatabase()

const foodStmt = db.prepare('SELECT * FROM foods WHERE id = ?')
const foodMap = new Map<string, Food>()
function getFood(id: string): Food | undefined {
  if (foodMap.has(id)) return foodMap.get(id)
  const row = foodStmt.get(id) as any
  if (row) {
    const food: Food = {
      id: row.id,
      name: row.name,
      calories: row.calories,
      protein: row.protein,
      fat: row.fat,
      carbs: row.carbs,
      serving: row.serving
    }
    foodMap.set(id, food)
    return food
  }
  return undefined
}

app.get('/api/foods', (req, res) => {
  const query = (req.query.query as string) || ''
  const limit = Math.min(20, parseInt(req.query.limit as string) || 10)

  if (!query.trim()) {
    return res.json([])
  }

  const searchTerm = `%${query}%`
  const stmt = db.prepare(`
    SELECT id, name, calories, protein, fat, carbs, serving
    FROM foods
    WHERE name LIKE ?
    ORDER BY 
      CASE WHEN name = ? THEN 0 ELSE 1 END,
      CASE WHEN name LIKE ? THEN 0 ELSE 1 END,
      name
    LIMIT ?
  `)
  const results = stmt.all(searchTerm, query, `${query}%`, limit)
  res.json(results)
})

app.get('/api/foods/:id', (req, res) => {
  const food = getFood(req.params.id)
  if (!food) {
    return res.status(404).json({ error: '食物未找到' })
  }
  res.json(food)
})

app.post('/api/meals', (req, res) => {
  const { date, foodId, quantity = 1 } = req.body

  if (!date || !foodId) {
    return res.status(400).json({ error: '日期和食物ID不能为空' })
  }

  const food = getFood(foodId)
  if (!food) {
    return res.status(404).json({ error: '食物不存在' })
  }

  const qty = Math.max(0.01, Number(quantity) || 1)
  const id = uuidv4()
  const stmt = db.prepare(`
    INSERT INTO meals (id, date, food_id, food_name, calories, protein, fat, carbs, serving, quantity)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  stmt.run(
    id,
    date,
    food.id,
    food.name,
    food.calories * qty,
    food.protein * qty,
    food.fat * qty,
    food.carbs * qty,
    food.serving,
    qty
  )

  res.status(201).json({
    id,
    date,
    foodId: food.id,
    foodName: food.name,
    calories: food.calories * qty,
    protein: food.protein * qty,
    fat: food.fat * qty,
    carbs: food.carbs * qty,
    serving: food.serving,
    quantity: qty
  })
})

app.get('/api/meals', (req, res) => {
  const date = req.query.date as string

  if (!date) {
    return res.status(400).json({ error: '日期参数不能为空' })
  }

  const cacheKey = `meals:${date}`
  const cached = (db as any)._cache?.get(cacheKey)
  if (cached) {
    return res.json(cached)
  }

  const stmt = db.prepare(`
    SELECT id, date, food_id as foodId, food_name as foodName, 
           calories, protein, fat, carbs, serving, quantity
    FROM meals 
    WHERE date = ?
    ORDER BY created_at DESC
  `)

  const meals = stmt.all(date) as any[]

  const totals = meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + meal.calories,
      protein: acc.protein + meal.protein,
      fat: acc.fat + meal.fat,
      carbs: acc.carbs + meal.carbs
    }),
    { calories: 0, protein: 0, fat: 0, carbs: 0 }
  )

  const result = { meals, totals }
  res.json(result)
})

app.delete('/api/meals/:id', (req, res) => {
  const stmt = db.prepare('DELETE FROM meals WHERE id = ?')
  const result = stmt.run(req.params.id)

  if (result.changes === 0) {
    return res.status(404).json({ error: '餐食记录不存在' })
  }

  res.json({ success: true })
})

app.get('/api/goals', (_req, res) => {
  const stmt = db.prepare('SELECT * FROM nutrition_goals ORDER BY id DESC LIMIT 1')
  const goal = stmt.get() as any

  if (!goal) {
    return res.status(404).json({ error: '目标未设置' })
  }

  res.json({
    dailyCalories: goal.daily_calories,
    dailyProtein: goal.daily_protein,
    dailyFat: goal.daily_fat,
    dailyCarbs: goal.daily_carbs
  })
})

app.put('/api/goals', (req, res) => {
  const { dailyCalories, dailyProtein, dailyFat, dailyCarbs } = req.body

  const stmt = db.prepare(`
    UPDATE nutrition_goals 
    SET daily_calories = ?, daily_protein = ?, daily_fat = ?, daily_carbs = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = (SELECT id FROM nutrition_goals ORDER BY id DESC LIMIT 1)
  `)

  stmt.run(dailyCalories, dailyProtein, dailyFat, dailyCarbs)

  res.json({ dailyCalories, dailyProtein, dailyFat, dailyCarbs })
})

app.get('/api/recommendations', (req, res) => {
  const target = (req.query.target as string) || 'maintain'
  const date = req.query.date as string

  let currentTotals = { calories: 0, protein: 0, fat: 0, carbs: 0 }
  const consumedFoodIds = new Set<string>()

  if (date) {
    const totalsStmt = db.prepare(`
      SELECT 
        COALESCE(SUM(calories), 0) as calories,
        COALESCE(SUM(protein), 0) as protein,
        COALESCE(SUM(fat), 0) as fat,
        COALESCE(SUM(carbs), 0) as carbs
      FROM meals 
      WHERE date = ?
    `)
    currentTotals = totalsStmt.get(date) as typeof currentTotals

    const foodsStmt = db.prepare(`
      SELECT DISTINCT food_id 
      FROM meals 
      WHERE date = ?
    `)
    const rows = foodsStmt.all(date) as any[]
    rows.forEach(r => consumedFoodIds.add(r.food_id))
  }

  const goalStmt = db.prepare('SELECT * FROM nutrition_goals ORDER BY id DESC LIMIT 1')
  const goal = goalStmt.get() as any

  const calorieGap = Math.max(0, goal.daily_calories - currentTotals.calories)
  const proteinGap = Math.max(0, goal.daily_protein - currentTotals.protein)
  const fatGap = Math.max(0, goal.daily_fat - currentTotals.fat)
  const carbsGap = Math.max(0, goal.daily_carbs - currentTotals.carbs)

  const totalGap = calorieGap + proteinGap * 10 + fatGap * 5 + carbsGap * 2
  const calorieWeight = totalGap > 0 ? calorieGap / totalGap : 0.4
  const proteinWeight = totalGap > 0 ? (proteinGap * 10) / totalGap : 0.3
  const fatWeight = totalGap > 0 ? (fatGap * 5) / totalGap : 0.15
  const carbsWeight = totalGap > 0 ? (carbsGap * 2) / totalGap : 0.15

  const allRecipesStmt = db.prepare(`
    SELECT r.id, r.name, r.description, r.category,
           r.total_calories as totalCalories,
           r.total_protein as totalProtein,
           r.total_fat as totalFat,
           r.total_carbs as totalCarbs,
           GROUP_CONCAT(rf.food_id) as foodIds
    FROM recipes r
    JOIN recipe_foods rf ON r.id = rf.recipe_id
    GROUP BY r.id
    ORDER BY r.id
  `)
  const recipesRaw = allRecipesStmt.all() as any[]

  const scoredRecipes = recipesRaw.map(row => {
    const recipeFoodIds = (row.foodIds || '').split(',')

    const overlapCount = recipeFoodIds.filter(id => consumedFoodIds.has(id)).length
    const overlapPenalty = overlapCount > 0 ? Math.min(25, overlapCount * 8) : 0

    let calorieScore = 0
    if (calorieGap > 0) {
      const calorieRatio = row.totalCalories / calorieGap
      if (calorieRatio <= 1) {
        calorieScore = calorieRatio * 100
      } else if (calorieRatio <= 1.5) {
        calorieScore = 100 - (calorieRatio - 1) * 100
      } else {
        calorieScore = Math.max(0, 50 - (calorieRatio - 1.5) * 100)
      }
    } else {
      calorieScore = Math.max(0, 60 - row.totalCalories / 10)
    }

    let proteinScore = 0
    if (proteinGap > 0) {
      const proteinRatio = row.totalProtein / proteinGap
      if (proteinRatio <= 1) {
        proteinScore = proteinRatio * 100
      } else if (proteinRatio <= 2) {
        proteinScore = 100 - (proteinRatio - 1) * 50
      } else {
        proteinScore = 50
      }
    } else {
      proteinScore = 50
    }

    let fatScore = 50
    if (fatGap > 0) {
      const fatRatio = row.totalFat / fatGap
      if (fatRatio <= 1.5) {
        fatScore = 70 + (1 - Math.abs(1 - fatRatio) * 0.2) * 30
      }
    } else {
      fatScore = Math.max(20, 60 - row.totalFat * 3)
    }

    let carbsScore = 50
    if (carbsGap > 0) {
      const carbsRatio = row.totalCarbs / carbsGap
      if (carbsRatio <= 1.5) {
        carbsScore = 70 + (1 - Math.abs(1 - carbsRatio) * 0.2) * 30
      }
    } else {
      carbsScore = Math.max(20, 60 - row.totalCarbs)
    }

    let targetBonus = 0
    if (target === 'lose_weight') {
      targetBonus += (1 - row.totalCalories / 700) * 15
      targetBonus += Math.min(15, (row.totalProtein / Math.max(1, row.totalCalories)) * 500)
    } else if (target === 'gain_muscle') {
      targetBonus += Math.min(15, (row.totalProtein / 40) * 15)
      targetBonus += (row.totalCalories / 700) * 10
    } else {
      const midCal = 450
      targetBonus += (1 - Math.abs(row.totalCalories - midCal) / 400) * 20
    }

    const totalScore =
      calorieScore * calorieWeight +
      proteinScore * proteinWeight +
      fatScore * fatWeight +
      carbsScore * carbsWeight +
      targetBonus -
      overlapPenalty

    return {
      recipe: {
        id: row.id,
        name: row.name,
        description: row.description,
        category: row.category,
        totalCalories: row.totalCalories,
        totalProtein: row.totalProtein,
        totalFat: row.totalFat,
        totalCarbs: row.totalCarbs,
        foodIds: recipeFoodIds
      },
      score: totalScore,
      overlapCount
    }
  })

  scoredRecipes.sort((a, b) => b.score - a.score)

  const selected: typeof scoredRecipes = []
  const usedFoods = new Set<string>()
  for (const item of scoredRecipes) {
    if (selected.length >= 3) break
    const overlapWithSelected = item.recipe.foodIds.some(id => usedFoods.has(id))
    if (!overlapWithSelected || selected.length === 0) {
      selected.push(item)
      item.recipe.foodIds.forEach(id => usedFoods.add(id))
    }
  }

  if (selected.length < 3) {
    for (const item of scoredRecipes) {
      if (selected.length >= 3) break
      if (!selected.find(s => s.recipe.id === item.recipe.id)) {
        selected.push(item)
      }
    }
  }

  const recommendations = selected.map(item => ({
    ...item.recipe,
    matchScore: Math.round(Math.max(0, Math.min(100, item.score)))
  }))

  res.json(recommendations)
})

app.get('/api/recipes', (_req, res) => {
  const stmt = db.prepare(`
    SELECT r.id, r.name, r.description, r.category,
           r.total_calories as totalCalories,
           r.total_protein as totalProtein,
           r.total_fat as totalFat,
           r.total_carbs as totalCarbs
    FROM recipes r
    ORDER BY r.category, r.id
  `)
  res.json(stmt.all())
})

app.get('/api/recipes/:id', (req, res) => {
  const recipeStmt = db.prepare(`
    SELECT r.id, r.name, r.description, r.category,
           r.total_calories as totalCalories,
           r.total_protein as totalProtein,
           r.total_fat as totalFat,
           r.total_carbs as totalCarbs
    FROM recipes r
    WHERE r.id = ?
  `)
  const recipe = recipeStmt.get(req.params.id) as any

  if (!recipe) {
    return res.status(404).json({ error: '食谱不存在' })
  }

  const foodsStmt = db.prepare(`
    SELECT f.id, f.name, f.calories, f.protein, f.fat, f.carbs, f.serving,
           rf.serving as recipeServing
    FROM recipe_foods rf
    JOIN foods f ON rf.food_id = f.id
    WHERE rf.recipe_id = ?
    ORDER BY rf.sort_order
  `)
  const foods = foodsStmt.all(req.params.id)

  res.json({ ...recipe, foods })
})

app.post('/api/recipes/:id/add', (req, res) => {
  const { date } = req.body
  const recipeId = req.params.id

  const recipeStmt = db.prepare(`
    SELECT r.id, r.name
    FROM recipes r
    WHERE r.id = ?
  `)
  const recipe = recipeStmt.get(recipeId) as any

  if (!recipe) {
    return res.status(404).json({ error: '食谱不存在' })
  }

  if (!date) {
    return res.status(400).json({ error: '日期不能为空' })
  }

  const recipeFoodsStmt = db.prepare(`
    SELECT f.id as food_id, f.name, f.calories, f.protein, f.fat, f.carbs, f.serving,
           rf.serving
    FROM recipe_foods rf
    JOIN foods f ON rf.food_id = f.id
    WHERE rf.recipe_id = ?
    ORDER BY rf.sort_order
  `)
  const recipeFoods = recipeFoodsStmt.all(recipeId) as any[]

  const insertMeal = db.prepare(`
    INSERT INTO meals (id, date, food_id, food_name, calories, protein, fat, carbs, serving, quantity)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const addedMeals: any[] = []

  const tx = db.transaction(() => {
    for (const rf of recipeFoods) {
      const quantity = rf.serving / 100
      const id = uuidv4()
      insertMeal.run(
        id,
        date,
        rf.food_id,
        rf.name,
        rf.calories * quantity,
        rf.protein * quantity,
        rf.fat * quantity,
        rf.carbs * quantity,
        rf.serving,
        quantity
      )
      addedMeals.push({
        id,
        foodId: rf.food_id,
        foodName: rf.name,
        calories: rf.calories * quantity,
        protein: rf.protein * quantity,
        fat: rf.fat * quantity,
        carbs: rf.carbs * quantity
      })
    }
  })
  tx()

  res.status(201).json({
    addedMeals,
    recipeName: recipe.name,
    count: addedMeals.length
  })
})

app.get('/api/reports/weekly', (req, res) => {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(endDate.getDate() - 6)

  const startDateStr = startDate.toISOString().split('T')[0]
  const endDateStr = endDate.toISOString().split('T')[0]

  const stmt = db.prepare(`
    SELECT 
      date,
      COALESCE(SUM(calories), 0) as calories,
      COALESCE(SUM(protein), 0) as protein,
      COALESCE(SUM(fat), 0) as fat,
      COALESCE(SUM(carbs), 0) as carbs
    FROM meals 
    WHERE date BETWEEN ? AND ?
    GROUP BY date
    ORDER BY date ASC
  `)

  const dailyData = stmt.all(startDateStr, endDateStr) as any[]
  const dailyDataMap = new Map<string, any>()
  dailyData.forEach(d => dailyDataMap.set(d.date, d))

  const fullWeekData: any[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate)
    d.setDate(startDate.getDate() + i)
    const dateStr = d.toISOString().split('T')[0]
    const existing = dailyDataMap.get(dateStr)
    fullWeekData.push({
      date: dateStr,
      calories: existing ? existing.calories : 0,
      protein: existing ? existing.protein : 0,
      fat: existing ? existing.fat : 0,
      carbs: existing ? existing.carbs : 0
    })
  }

  const avgCalories = fullWeekData.reduce((sum, d) => sum + d.calories, 0) / 7
  const avgProtein = fullWeekData.reduce((sum, d) => sum + d.protein, 0) / 7
  const avgFat = fullWeekData.reduce((sum, d) => sum + d.fat, 0) / 7
  const avgCarbs = fullWeekData.reduce((sum, d) => sum + d.carbs, 0) / 7

  const goalStmt = db.prepare('SELECT * FROM nutrition_goals ORDER BY id DESC LIMIT 1')
  const goal = goalStmt.get() as any

  res.json({
    daily: fullWeekData,
    averages: {
      calories: Math.round(avgCalories),
      protein: Math.round(avgProtein * 10) / 10,
      fat: Math.round(avgFat * 10) / 10,
      carbs: Math.round(avgCarbs * 10) / 10
    },
    goals: {
      dailyCalories: goal.daily_calories,
      dailyProtein: goal.daily_protein,
      dailyFat: goal.daily_fat,
      dailyCarbs: goal.daily_carbs
    },
    period: { start: startDateStr, end: endDateStr }
  })
})

app.listen(PORT, () => {
  console.log(`Nutrition API server running on http://localhost:${PORT}`)
  console.log(`Database: ${dbPath}`)
})
