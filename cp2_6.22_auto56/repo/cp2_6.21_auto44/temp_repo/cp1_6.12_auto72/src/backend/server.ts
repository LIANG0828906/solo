import express from 'express'
import cors from 'cors'
import projectsRouter from './routes/projects'
import materialsRouter from './routes/materials'
import publicRouter from './routes/public'

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

app.use('/api/projects', projectsRouter)
app.use('/api/materials', materialsRouter)
app.use('/api/public', publicRouter)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.listen(PORT, () => {
  console.log(`后端服务器运行在 http://localhost:${PORT}`)
})
