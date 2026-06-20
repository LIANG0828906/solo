import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { WebSocketServer } from 'ws'
import { initDatabase } from './db/init.js'
import { setupWebSocketHandler } from './websocket/handler.js'
import * as surveyController from './controllers/surveyController.js'
import * as statsController from './controllers/statsController.js'

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001

const app = express()
const server = createServer(app)
const wss = new WebSocketServer({ noServer: true })

app.use(cors())
app.use(express.json())

initDatabase()

setupWebSocketHandler(wss)

app.post('/api/surveys', surveyController.createSurvey)
app.get('/api/surveys/:id', surveyController.getSurvey)
app.get('/api/surveys/code/:code', surveyController.getSurveyByCode)
app.get('/api/surveys/:id/stats', statsController.getSurveyStats)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request)
  })
})

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
  console.log(`WebSocket server is ready`)
})

process.on('SIGINT', () => {
  console.log('Shutting down server...')
  server.close(() => {
    process.exit(0)
  })
})
