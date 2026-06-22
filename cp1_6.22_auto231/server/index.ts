import express from 'express'
import cors from 'cors'
import animalsRouter from './routes/animals'
import applicationsRouter from './routes/applications'
import followupsRouter from './routes/followups'
import { store } from './data/store'

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

app.use('/app/animals', animalsRouter)
app.use('/app/applications', applicationsRouter)
app.use('/app/followups', followupsRouter)

app.get('/app/stats', (req, res) => {
  const stats = store.getStats()
  res.json(stats)
})

app.get('/app/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.listen(PORT, () => {
  console.log(`PawCare API server running on http://localhost:${PORT}`)
  console.log(`API base path: /app`)
})
