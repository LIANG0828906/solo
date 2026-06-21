import express from 'express'
import cors from 'cors'
import userRoutes from './routes/users.js'
import scheduleRoutes from './routes/schedules.js'

const app = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/users', userRoutes)
app.use('/api/schedules', scheduleRoutes)

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'ok' })
})

app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'API not found' })
})

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack)
  res.status(500).json({ success: false, error: 'Server internal error' })
})

export default app
