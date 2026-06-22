import express from 'express'
import cors from 'cors'
import userRoutes from './routes/user'
import planRoutes from './routes/plan'
import teamRoutes from './routes/team'

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

app.use('/api/user', userRoutes)
app.use('/api/plan', planRoutes)
app.use('/api/team', teamRoutes)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
