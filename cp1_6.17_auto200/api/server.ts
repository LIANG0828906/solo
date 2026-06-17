import http from 'http'
import { Server as IOServer } from 'socket.io'
import { createApp } from './app.js'
import { registerSyncHandlers } from './modules/sync/SyncModule.js'

const PORT = process.env.PORT || 5001

const server = http.createServer()
const io = new IOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})

const app = createApp(io)
server.on('request', app)

io.on('connection', (socket) => {
  registerSyncHandlers(io, socket)
})

server.listen(PORT, () => {
  console.log(`🚀 Collaborative Music Studio Server ready on port ${PORT}`)
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
