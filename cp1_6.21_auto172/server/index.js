import express from 'express'
import cors from 'cors'
import characterRoutes from './routes/character.js'
import rhythmRoutes from './routes/rhythm.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

app.use('/api/character', characterRoutes)
app.use('/api/rhythm', rhythmRoutes)

app.use('/api/health', (req, res) => {
  res.json({ success: true, message: 'ok' })
})

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ success: false, error: 'Server internal error' })
})

app.listen(PORT, () => {
  console.log(`Rhythm Rift server ready on port ${PORT}`)
})
