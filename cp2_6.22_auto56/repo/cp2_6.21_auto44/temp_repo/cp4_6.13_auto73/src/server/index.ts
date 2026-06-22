import express, { type Request, type Response, type NextFunction } from 'express'
import cors from 'cors'
import authRoutes from './routes/auth.js'
import itemsRoutes from './routes/items.js'
import tasksRoutes from './routes/tasks.js'
import usersRoutes from './routes/users.js'
import { getRecentActivities } from './db.js'

const app = express()
const PORT = 4000

app.use(cors())
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/items', itemsRoutes)
app.use('/api/tasks', tasksRoutes)
app.use('/api/users', usersRoutes)

app.get('/api/activities', (req: Request, res: Response): void => {
  try {
    const activities = getRecentActivities.all()

    const formattedActivities = activities.map(activity => ({
      id: activity.id,
      type: activity.type,
      points: activity.points,
      description: activity.description,
      created_at: activity.created_at,
      user: {
        username: activity.user_username
      }
    }))

    res.json({
      success: true,
      data: formattedActivities
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取动态失败'
    })
  }
})

app.use((error: Error, req: Request, res: Response, next: NextFunction): void => {
  console.error(error)
  res.status(500).json({
    success: false,
    error: '服务器内部错误'
  })
})

app.use((req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: 'API 不存在'
  })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
