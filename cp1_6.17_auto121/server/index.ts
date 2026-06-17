import express, { Request, Response } from 'express'
import cors from 'cors'
import poemsRouter from './apiPoems.js'

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

app.use('/api/poems', poemsRouter)

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: '诗词字帖API服务运行中' })
})

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`)
})
