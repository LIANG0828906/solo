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

function initDatabase() {
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

  const goalStmt = db.prepare('SELECT COUNT(*) as count FROM nutrition_goals')
  const result = goalStmt.get() as { count: number }
  if (result.count === 0) {
    db.prepare(`
      INSERT INTO nutrition_goals (daily_calories, daily_protein, daily_fat, daily_carbs)
      VALUES (2000, 60, 65, 250)
    `).run()
  }

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_meals_date ON meals(date)
  `)
}

initDatabase()

const foodMap = new Map<string, Food>()
foodDatabase.forEach(food => {
  foodMap.set(food.id, food)
})

const recipeMap = new Map<string, Recipe>()
recipeDatabase.forEach(recipe => {
  recipeMap.set(recipe.id, recipe)
})

app.get('/api/foods', (req, res) => {
  const query = (req.query.query as string) || ''
  const limit = parseInt(req.query.limit as string) || 10
  
  if (!query.trim()) {
    return res.json(foodDatabase.slice(0, limit))
  }

  const lowerQuery = query.toLowerCase()
  const results = foodDatabase.filter(food => 
    food.name.toLowerCase().includes(lowerQuery)
  ).slice(0, limit)

  res.json(results)
})

app.get('/api/foods/:id', (req, res) => {
  const food = foodMap.get(req.params.id)
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

  const food = foodMap.get(foodId)
  if (!food) {
    return res.status(404).json({ error: '食物不存在' })
  }

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
    food.calories * quantity,
    food.protein * quantity,
    food.fat * quantity,
    food.carbs * quantity,
    food.serving,
    quantity
  )

  res.status(201).json({
    id,
    date,
    foodId: food.id,
    foodName: food.name,
    calories: food.calories * quantity,
    protein: food.protein * quantity,
    fat: food.fat * quantity,
    carbs: food.carbs * quantity,
    serving: food.serving,
    quantity
  })
})

app.get('/api/meals', (req, res) => {
  const date = req.query.date as string
  
  if (!date) {
    return res.status(400).json({ error: '日期参数不能为空' })
  }

  const stmt = db.prepare(`
    SELECT id, date, food_id as foodId, food_name as foodName, 
           calories, protein, fat, carbs, serving, quantity
    FROM meals 
    WHERE date = ?
    ORDER BY created_at DESC
  `)
  
  const meals = stmt.all(date)
  
  const totals = {
    calories: 0,
    protein: 0,
    fat: 0,
    carbs: 0
  }
  
  meals.forEach((meal: any) => {
    totals.calories += meal.calories
    totals.protein += meal.protein
    totals.fat += meal.fat
    totals.carbs += meal.carbs
  })

  res.json({ meals, totals })
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
  const goal = stmt.get()
  
  if (!goal) {
    return res.status(404).json({ error: '目标未设置' })
  }
  
  res.json({
    dailyCalories: (goal as any).daily_calories,
    dailyProtein: (goal as any).daily_protein,
    dailyFat: (goal as any).daily_fat,
    dailyCarbs: (goal as any).daily_carbs
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
  
  res.json({
    dailyCalories,
    dailyProtein,
    dailyFat,
    dailyCarbs
  })
})

app.get('/api/recommendations', (req, res) => {
  const target = req.query.target as string
  const date = req.query.date as string
  
  let currentTotals = { calories: 0, protein: 0, fat: 0, carbs: 0 }
  
  if (date) {
    const stmt = db.prepare(`
      SELECT 
        COALESCE(SUM(calories), 0) as calories,
        COALESCE(SUM(protein), 0) as protein,
        COALESCE(SUM(fat), 0) as fat,
        COALESCE(SUM(carbs), 0) as carbs
      FROM meals 
      WHERE date = ?
    `)
    currentTotals = stmt.get(date) as typeof currentTotals
  }

  const goalStmt = db.prepare('SELECT * FROM nutrition_goals ORDER BY id DESC LIMIT 1')
  const goal = goalStmt.get() as any
  
  const calorieGap = goal.daily_calories - currentTotals.calories
  const proteinGap = goal.daily_protein - currentTotals.protein

  const scoredRecipes = recipeDatabase.map(recipe => {
    let score = 0
    
    if (calorieGap > 0) {
      const calorieRatio = recipe.totalCalories / calorieGap
      if (calorieRatio <= 1) {
        score += calorieRatio * 50
      } else {
        score += Math.max(0, 50 - (calorieRatio - 1) * 50)
      }
    }
    
    if (proteinGap > 0) {
      const proteinRatio = recipe.totalProtein / proteinGap
      if (proteinRatio <= 1) {
        score += proteinRatio * 30
      } else {
        score += Math.max(0, 30 - (proteinRatio - 1) * 30)
      }
    }
    
    if (target === 'lose_weight') {
      score += (1 - recipe.totalCalories / 600) * 10
      score += (recipe.totalProtein / recipe.totalCalories) * 100
    } else if (target === 'gain_muscle') {
      score += (recipe.totalProtein / 30) * 10
      score += (recipe.totalCalories / 600) * 5
    } else if (target === 'maintain') {
      const midCalorie = 450
      score += (1 - Math.abs(recipe.totalCalories - midCalorie) / 300) * 15
    }
    
    return { recipe, score }
  })

  scoredRecipes.sort((a, b) => b.score - a.score)
  
  const recommendations = scoredRecipes.slice(0, 3).map(item => ({
    ...item.recipe,
    matchScore: Math.round(item.score)
  }))

  res.json(recommendations)
})

app.get('/api/recipes', (_req, res) => {
  res.json(recipeDatabase)
})

app.get('/api/recipes/:id', (req, res) => {
  const recipe = recipeMap.get(req.params.id)
  if (!recipe) {
    return res.status(404).json({ error: '食谱不存在' })
  }
  
  const foods = recipe.foodIds.map(id => {
    const food = foodMap.get(id)
    return food ? { ...food, recipeServing: 1 } : null
  }).filter(Boolean)
  
  res.json({ ...recipe, foods })
})

app.post('/api/recipes/:id/add', (req, res) => {
  const { date } = req.body
  const recipe = recipeMap.get(req.params.id)
  
  if (!recipe) {
    return res.status(404).json({ error: '食谱不存在' })
  }
  
  if (!date) {
    return res.status(400).json({ error: '日期不能为空' })
  }

  const addedMeals = []
  
  for (let i = 0; i < recipe.foodIds.length; i++) {
    const foodId = recipe.foodIds[i]
    const servingRatio = recipe.servings[i] / 100
    const food = foodMap.get(foodId)
    
    if (!food) continue
    
    const id = uuidv4()
    const quantity = recipe.servings[i] / 100
    
    db.prepare(`
      INSERT INTO meals (id, date, food_id, food_name, calories, protein, fat, carbs, serving, quantity)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      date,
      food.id,
      food.name,
      food.calories * quantity,
      food.protein * quantity,
      food.fat * quantity,
      food.carbs * quantity,
      food.serving,
      quantity
    )
    
    addedMeals.push({
      id,
      foodName: food.name,
      calories: food.calories * quantity,
      protein: food.protein * quantity,
      fat: food.fat * quantity,
      carbs: food.carbs * quantity
    })
  }

  res.status(201).json({ addedMeals, recipeName: recipe.name })
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
  
  const weekDays: string[] = []
  const fullWeekData: any[] = []
  
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate)
    d.setDate(startDate.getDate() + i)
    const dateStr = d.toISOString().split('T')[0]
    weekDays.push(dateStr)
    
    const existing = dailyData.find(item => item.date === dateStr)
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
