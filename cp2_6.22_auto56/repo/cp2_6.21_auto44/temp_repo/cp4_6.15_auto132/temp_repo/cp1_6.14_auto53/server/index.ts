import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { initDB } from './db'
import itemsRouter from './routes/items'
import usersRouter from './routes/users'
import exchangesRouter from './routes/exchanges'
import notificationsRouter from './routes/notifications'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))

app.use('/api/items', itemsRouter)
app.use('/api/users', usersRouter)
app.use('/api/exchanges', exchangesRouter)
app.use('/api/notifications', notificationsRouter)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

const startServer = async () => {
  try {
    await initDB()
    console.log('Database initialized')
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()

export default app
