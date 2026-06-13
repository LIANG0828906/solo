import express from 'express'
import { createServer } from 'http'
import { WebSocketServer, WebSocket } from 'ws'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'

interface Note {
  id: string
  columnId: string
  title: string
  content: string
  color: string
  creator: string
  createdAt: string
  order: number
}

interface Column {
  id: string
  name: string
  defaultColor: string
}

interface Room {
  id: string
  columns: Column[]
  notes: Note[]
  clients: Map<string, WebSocket>
}

interface WSMessage {
  type: string
  payload: any
  clientId?: string
  roomId: string
}

const DEFAULT_COLUMNS: Column[] = [
  { id: 'todo', name: '待办', defaultColor: '#d0e8ff' },
  { id: 'in-progress', name: '进行中', defaultColor: '#ffe6cc' },
  { id: 'done', name: '已完成', defaultColor: '#d4edda' },
]

const app = express()
app.use(express.json())

const server = createServer(app)
const wss = new WebSocketServer({ server })

const rooms = new Map<string, Room>()

function generateRoomId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let id = ''
  for (let i = 0; i < 6; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return id
}

function getOrCreateRoom(roomId: string): Room {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      id: roomId,
      columns: JSON.parse(JSON.stringify(DEFAULT_COLUMNS)),
      notes: [],
      clients: new Map(),
    })
  }
  return rooms.get(roomId)!
}

function broadcast(room: Room, message: WSMessage, excludeClientId?: string) {
  const data = JSON.stringify(message)
  room.clients.forEach((ws, clientId) => {
    if (clientId !== excludeClientId && ws.readyState === WebSocket.OPEN) {
      ws.send(data)
    }
  })
}

function formatTimestamp(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hour = String(now.getHours()).padStart(2, '0')
  const minute = String(now.getMinutes()).padStart(2, '0')
  return `${month}-${day} ${hour}:${minute}`
}

wss.on('connection', (ws) => {
  const clientId = uuidv4()

  ws.on('message', (raw) => {
    try {
      const msg: WSMessage = JSON.parse(raw.toString())
      const { type, payload, roomId } = msg

      if (!roomId) return
      const room = getOrCreateRoom(roomId)

      if (room.clients.size >= 10 && type === 'join') {
        ws.send(JSON.stringify({ type: 'error', payload: { message: '房间已满' } }))
        return
      }

      switch (type) {
        case 'join': {
          room.clients.set(clientId, ws)
          ws.send(
            JSON.stringify({
              type: 'init',
              payload: {
                clientId,
                roomId,
                columns: room.columns,
                notes: room.notes,
                onlineCount: room.clients.size,
              },
            })
          )
          broadcast(room, {
            type: 'online-update',
            payload: { onlineCount: room.clients.size },
            roomId,
          })
          break
        }

        case 'add-note': {
          const note: Note = {
            id: uuidv4(),
            columnId: payload.columnId,
            title: payload.title || '',
            content: payload.content || '',
            color: payload.color || room.columns.find((c) => c.id === payload.columnId)?.defaultColor || '#fff',
            creator: payload.creator,
            createdAt: formatTimestamp(),
            order: room.notes.filter((n) => n.columnId === payload.columnId).length,
          }
          room.notes.push(note)
          ws.send(JSON.stringify({ type: 'note-id-mapped', payload: { tempId: payload.tempId, id: note.id }, roomId }))
          broadcast(
            room,
            { type: 'add-note', payload: note, roomId },
            clientId
          )
          break
        }

        case 'update-note': {
          const note = room.notes.find((n) => n.id === payload.id)
          if (note) {
            Object.assign(note, payload)
            broadcast(
              room,
              { type: 'update-note', payload, roomId },
              clientId
            )
          }
          break
        }

        case 'delete-note': {
          const idx = room.notes.findIndex((n) => n.id === payload.id)
          if (idx !== -1) {
            room.notes.splice(idx, 1)
            broadcast(
              room,
              { type: 'delete-note', payload, roomId },
              clientId
            )
          }
          break
        }

        case 'move-note': {
          const { id, toColumnId, toIndex } = payload
          const note = room.notes.find((n) => n.id === id)
          if (note) {
            const sameCol = note.columnId === toColumnId
            const sameColNotes = room.notes.filter((n) => n.columnId === toColumnId && n.id !== id)
            
            if (!sameCol) {
              note.columnId = toColumnId
            }

            sameColNotes.sort((a, b) => a.order - b.order)
            sameColNotes.splice(toIndex, 0, note)
            sameColNotes.forEach((n, i) => (n.order = i))

            if (!sameCol) {
              const prevColNotes = room.notes.filter((n) => n.columnId !== toColumnId)
              const cols = new Set(prevColNotes.map((n) => n.columnId))
              cols.forEach((cid) => {
                const colNotes = room.notes.filter((n) => n.columnId === cid)
                colNotes.sort((a, b) => a.order - b.order)
                colNotes.forEach((n, i) => (n.order = i))
              })
            }

            broadcast(
              room,
              {
                type: 'move-note',
                payload: { id, toColumnId, toIndex, order: toIndex },
                roomId,
              },
              clientId
            )
          }
          break
        }
      }
    } catch (e) {
      console.error('WS message error:', e)
    }
  })

  ws.on('close', () => {
    rooms.forEach((room) => {
      if (room.clients.has(clientId)) {
        room.clients.delete(clientId)
        broadcast(room, {
          type: 'online-update',
          payload: { onlineCount: room.clients.size },
          roomId: room.id,
        })
        if (room.clients.size === 0) {
          rooms.delete(room.id)
        }
      }
    })
  })
})

app.get('/api/rooms', (_req, res) => {
  res.json({
    rooms: Array.from(rooms.keys()).map((id) => ({
      id,
      onlineCount: rooms.get(id)!.clients.size,
    })),
  })
})

app.get('/api/export/:roomId', (req, res) => {
  const room = rooms.get(req.params.roomId.toUpperCase())
  if (!room) {
    res.status(404).json({ error: '房间不存在' })
    return
  }
  const data = {
    exportedAt: new Date().toISOString(),
    columns: room.columns,
    notes: room.notes.sort((a, b) => {
      if (a.columnId !== b.columnId) return a.columnId.localeCompare(b.columnId)
      return a.order - b.order
    }),
  }
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Content-Disposition', `attachment; filename="board-${room.id}.json"`)
  res.json(data)
})

const PORT = 3001
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
