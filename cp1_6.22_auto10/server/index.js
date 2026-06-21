import express from 'express'
import { WebSocketServer } from 'ws'
import { v4 as uuidv4 } from 'uuid'
import http from 'http'

const app = express()
const server = http.createServer(app)
const wss = new WebSocketServer({ server })

const shapes = new Map()
const users = new Map()

const randomColor = () => {
  const colors = [
    '#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff',
    '#5f27cd', '#00d2d3', '#1dd1a1', '#ff6348', '#eccc68',
    '#7bed9f', '#70a1ff', '#ffa502', '#2ed573', '#5352ed'
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

const randomUsername = () => {
  const names = ['设计师', '画家', '创作者', '艺术家', '绘图师', '工程师', '创意师', '策划师']
  return names[Math.floor(Math.random() * names.length)] + Math.floor(Math.random() * 1000)
}

const broadcast = (message, excludeId = null) => {
  const data = JSON.stringify(message)
  wss.clients.forEach((client) => {
    if (client.readyState === 1 && client.id !== excludeId) {
      client.send(data)
    }
  })
}

wss.on('connection', (ws) => {
  const userId = uuidv4()
  ws.id = userId

  const user = {
    id: userId,
    username: randomUsername(),
    color: randomColor(),
    cursor: { x: 0, y: 0 }
  }
  users.set(userId, user)

  ws.send(JSON.stringify({
    type: 'INIT',
    shapes: Array.from(shapes.values()),
    users: Array.from(users.values()),
    userId
  }))

  broadcast({ type: 'USER_JOINED', user }, userId)

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString())

      switch (msg.type) {
        case 'ADD_SHAPE': {
          const shape = { ...msg.shape, id: msg.shape.id || uuidv4() }
          shapes.set(shape.id, shape)
          broadcast({ type: 'SHAPE_ADDED', shape }, userId)
          break
        }
        case 'UPDATE_SHAPE': {
          const existing = shapes.get(msg.id)
          if (existing) {
            const updated = { ...existing, ...msg.updates }
            shapes.set(msg.id, updated)
            broadcast({ type: 'SHAPE_UPDATED', id: msg.id, updates: msg.updates }, userId)
          }
          break
        }
        case 'DELETE_SHAPE': {
          if (shapes.has(msg.id)) {
            shapes.delete(msg.id)
            broadcast({ type: 'SHAPE_DELETED', id: msg.id }, userId)
          }
          break
        }
        case 'CLEAR_ALL': {
          shapes.clear()
          broadcast({ type: 'ALL_CLEARED' }, userId)
          break
        }
        case 'CURSOR': {
          const u = users.get(userId)
          if (u) {
            u.cursor = { x: msg.x, y: msg.y }
            broadcast({
              type: 'CURSOR_UPDATE',
              userId,
              x: msg.x,
              y: msg.y,
              username: u.username,
              color: u.color
            }, userId)
          }
          break
        }
      }
    } catch (e) {
      console.error('Parse error:', e)
    }
  })

  ws.on('close', () => {
    users.delete(userId)
    broadcast({ type: 'USER_LEFT', userId }, userId)
  })
})

const PORT = 3001
server.listen(PORT, () => {
  console.log(`Collaborative drawing server running on port ${PORT}`)
})
