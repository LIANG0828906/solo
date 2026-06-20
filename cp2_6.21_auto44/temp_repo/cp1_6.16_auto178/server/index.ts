import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import type { MindMapState } from '../src/modules/editor/types'

type SyncState = Omit<MindMapState, 'selectedNodeId'>

const app = express()
app.use(cors())

const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})

let mindmapSnapshot: SyncState = {
  nodes: [],
  edges: [],
  zoom: 1,
  panX: 0,
  panY: 0,
}

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)

  socket.emit('mindmap-init', mindmapSnapshot)

  socket.on('mindmap-update', (state: SyncState) => {
    mindmapSnapshot = state
    socket.broadcast.emit('mindmap-update', state)
  })

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)
  })
})

const PORT = 3001
server.listen(PORT, () => {
  console.log(`Collaboration server running on port ${PORT}`)
})
