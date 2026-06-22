import express, { type Request, type Response } from 'express'
import cors from 'cors'
import { registerUser, loginUser } from './userModule.js'
import {
  searchFoods,
  addLog,
  getLogsByDate,
  deleteLog,
  getWeeklyReport,
  type MealType,
} from './foodModule.js'

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

app.post('/api/auth/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body as { username?: string; password?: string }
    const result = await registerUser(username ?? '', password ?? '')

    if (result.success) {
      res.status(200).json({
        success: true,
        userId: result.userId,
        username: result.username,
      })
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
      })
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '服务器内部错误',
    })
  }
})

app.post('/api/auth/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body as { username?: string; password?: string }
    const result = await loginUser(username ?? '', password ?? '')

    if (result.success) {
      res.status(200).json({
        success: true,
        userId: result.userId,
        username: result.username,
      })
    } else {
      res.status(401).json({
        success: false,
        error: result.error,
      })
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '服务器内部错误',
    })
  }
})

app.get('/api/foods/search', (req: Request, res: Response): void => {
  try {
    const q = req.query.q as string
    const foods = searchFoods(q ?? '')
    res.status(200).json({ foods })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '搜索失败',
    })
  }
})

app.post('/api/logs', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, foodId, grams, mealType, date } = req.body as {
      userId?: string
      foodId?: string
      grams?: number
      mealType?: MealType
      date?: string
    }

    const result = await addLog(
      userId ?? '',
      foodId ?? '',
      grams ?? 0,
      mealType ?? ('breakfast' as MealType),
      date ?? ''
    )

    if (result.success && result.entry) {
      res.status(200).json({
        success: true,
        entry: result.entry,
      })
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
      })
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '添加日志失败',
    })
  }
})

app.get('/api/logs', (req: Request, res: Response): void => {
  try {
    const userId = req.query.userId as string
    const date = req.query.date as string
    const result = getLogsByDate(userId ?? '', date ?? '')

    res.status(200).json({
      entries: result.entries,
      totals: result.totals,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取日志失败',
    })
  }
})

app.delete('/api/logs/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const result = await deleteLog(id)

    if (result.success) {
      res.status(200).json({
        success: true,
      })
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
      })
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '删除日志失败',
    })
  }
})

app.get('/api/reports/weekly', (req: Request, res: Response): void => {
  try {
    const userId = req.query.userId as string
    const report = getWeeklyReport(userId ?? '')

    res.status(200).json(report)
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取周报失败',
    })
  }
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})

export default app
