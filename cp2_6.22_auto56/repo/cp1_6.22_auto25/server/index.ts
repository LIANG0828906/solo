import express, { type Request, type Response, type NextFunction } from 'express'
import cors from 'cors'
import router from './routes/index.js'

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api', router)

app.use((_req: Request, res: Response): void => {
  res.status(404).json({ error: 'Not Found' })
})

app.use((err: Error, _req: Request, res: Response, _next: NextFunction): void => {
  console.error(err.stack)
  res.status(500).json({ error: 'Internal Server Error' })
})

const PORT = 3001
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
