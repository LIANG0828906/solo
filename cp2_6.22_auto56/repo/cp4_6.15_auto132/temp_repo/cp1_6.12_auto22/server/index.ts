import express from 'express'
import { createServer } from 'http'
import cors from 'cors'
import { Server as SocketIOServer } from 'socket.io'
import exhibitsRouter from './exhibits'
import { setupQuizSocket } from './quiz'

const app = express()
const server = createServer(app)
const io = new SocketIOServer(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
})

app.use(cors({
  origin: 'http://localhost:5173'
}))
app.use(express.json())

app.use('/api', exhibitsRouter)

setupQuizSocket(io)

const PORT = 3001

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`API: http://localhost:${PORT}/api/exhibits`)
  console.log(`Socket.IO: ws://localhost:${PORT}`)
})

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received')
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('SIGINT signal received')
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})

export default app
