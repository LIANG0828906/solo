import { Server as SocketIOServer } from 'socket.io'
import type { Server } from 'http'

let io: SocketIOServer

function init(server: Server): void {
  io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  })

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id)

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id)
    })
  })
}

function broadcastUpdate(boardId: string, action: string, task: any, user?: string): void {
  if (io) {
    io.emit('boardUpdate', { boardId, action, task, user })
  }
}

export { init, broadcastUpdate }
