import express from 'express'
import { createServer } from 'http'
import { WebSocketServer, WebSocket } from 'ws'
import cors from 'cors'
import { v4 as uuidv4 } from 'uuid'
import {
  COLOR_PALETTE,
  MAX_MEMBERS,
  TOTAL_ROUNDS,
  MIN_WORDS,
  MAX_WORDS,
  TURN_TIMEOUT_MS,
  Member,
  Paragraph,
  RoomState,
  ClientMessage,
  ServerMessage,
} from './types'

const app = express()
app.use(cors())
app.use(express.json())

const server = createServer(app)
const wss = new WebSocketServer({ server, path: '/ws' })

interface ClientConnection {
  ws: WebSocket
  memberId?: string
  roomId?: string
}

const rooms = new Map<string, RoomState>()
const clients = new Map<WebSocket, ClientConnection>()
const turnTimers = new Map<string, NodeJS.Timeout>()

function send(ws: WebSocket, msg: ServerMessage) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg))
  }
}

function broadcast(roomId: string, msg: ServerMessage, excludeWs?: WebSocket) {
  const state = rooms.get(roomId)
  if (!state) return
  for (const [ws, conn] of clients.entries()) {
    if (conn.roomId === roomId && ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg))
    }
  }
}

function broadcastRoomsList() {
  const roomList = Array.from(rooms.values())
  const msg: ServerMessage = { type: 'roomsList', rooms: roomList }
  for (const [ws] of clients.entries()) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg))
    }
  }
}

function getAvailableColor(room: RoomState): string {
  const usedColors = new Set(room.members.map((m) => m.color))
  for (const color of COLOR_PALETTE) {
    if (!usedColors.has(color)) return color
  }
  return COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)]
}

function countChineseChars(text: string): number {
  return text.replace(/\s/g, '').length
}

function clearTurnTimer(roomId: string) {
  const timer = turnTimers.get(roomId)
  if (timer) {
    clearTimeout(timer)
    turnTimers.delete(roomId)
  }
}

function startTurnTimer(roomId: string) {
  clearTurnTimer(roomId)
  const timer = setTimeout(() => handleTurnTimeout(roomId), TURN_TIMEOUT_MS)
  turnTimers.set(roomId, timer)
}

function handleTurnTimeout(roomId: string) {
  const room = rooms.get(roomId)
  if (!room || room.status !== 'writing') return

  const skippedMember = room.members[room.currentWriterIndex]
  if (skippedMember) {
    broadcast(roomId, {
      type: 'memberSkipped',
      memberId: skippedMember.id,
      reason: '写作超时（5分钟），已自动跳过',
    })
  }

  advanceTurn(roomId)
}

function advanceTurn(roomId: string) {
  const room = rooms.get(roomId)
  if (!room) return

  if (room.members.length === 0) {
    room.status = 'waiting'
    clearTurnTimer(roomId)
    return
  }

  room.currentWriterIndex = (room.currentWriterIndex + 1) % room.members.length

  if (room.currentWriterIndex === 0) {
    room.currentRound += 1
    if (room.currentRound > room.totalRounds) {
      room.status = 'completed'
      clearTurnTimer(roomId)
      broadcast(roomId, { type: 'storyComplete', state: room })
      broadcastRoomsList()
      return
    }
  }

  room.turnDeadline = Date.now() + TURN_TIMEOUT_MS
  const currentWriter = room.members[room.currentWriterIndex]

  broadcast(roomId, {
    type: 'turnChanged',
    currentWriterId: currentWriter.id,
    deadline: room.turnDeadline,
  })
  broadcast(roomId, { type: 'roomState', state: room })
  startTurnTimer(roomId)
}

function createRoom(name: string): RoomState {
  const room: RoomState = {
    id: uuidv4(),
    name,
    members: [],
    paragraphs: [],
    currentWriterIndex: 0,
    currentRound: 1,
    totalRounds: TOTAL_ROUNDS,
    maxMembers: MAX_MEMBERS,
    status: 'waiting',
    createdAt: Date.now(),
  }
  rooms.set(room.id, room)
  return room
}

function joinRoom(ws: WebSocket, roomId: string, nickname: string) {
  let room = rooms.get(roomId)

  if (!room) {
    room = createRoom(roomId)
  }

  if (room.members.length >= room.maxMembers) {
    send(ws, { type: 'error', message: '房间已满（最多6人）' })
    return
  }

  if (room.status === 'completed') {
    send(ws, { type: 'error', message: '该房间创作已完成' })
    return
  }

  if (room.members.some((m) => m.nickname === nickname)) {
    send(ws, { type: 'error', message: '该昵称已在房间中使用' })
    return
  }

  const member: Member = {
    id: uuidv4(),
    nickname,
    color: getAvailableColor(room),
    joinedAt: Date.now(),
  }

  room.members.push(member)

  const conn = clients.get(ws) || { ws }
  conn.memberId = member.id
  conn.roomId = room.id
  clients.set(ws, conn)

  send(ws, { type: 'roomState', state: room })
  broadcast(roomId, { type: 'memberJoined', member }, ws)

  if (room.status === 'waiting' && room.members.length >= 1) {
    room.status = 'writing'
    room.turnDeadline = Date.now() + TURN_TIMEOUT_MS
    const firstWriter = room.members[0]
    broadcast(roomId, {
      type: 'turnChanged',
      currentWriterId: firstWriter.id,
      deadline: room.turnDeadline,
    })
    broadcast(roomId, { type: 'roomState', state: room })
    startTurnTimer(roomId)
  } else {
    broadcast(roomId, { type: 'roomState', state: room })
  }

  broadcastRoomsList()
}

function submitParagraph(ws: WebSocket, roomId: string, content: string) {
  const room = rooms.get(roomId)
  const conn = clients.get(ws)

  if (!room || !conn || conn.roomId !== roomId || !conn.memberId) {
    send(ws, { type: 'error', message: '未加入房间' })
    return
  }

  if (room.status !== 'writing') {
    send(ws, { type: 'error', message: '当前不在写作阶段' })
    return
  }

  const currentWriter = room.members[room.currentWriterIndex]
  if (!currentWriter || currentWriter.id !== conn.memberId) {
    send(ws, { type: 'error', message: '还没轮到你写作' })
    return
  }

  const charCount = countChineseChars(content)
  if (charCount < MIN_WORDS) {
    send(ws, { type: 'error', message: `字数不足，至少需要${MIN_WORDS}字（当前${charCount}字）` })
    return
  }
  if (charCount > MAX_WORDS) {
    send(ws, { type: 'error', message: `字数超过限制，最多${MAX_WORDS}字（当前${charCount}字）` })
    return
  }

  const paragraph: Paragraph = {
    id: uuidv4(),
    memberId: conn.memberId,
    content: content.trim(),
    round: room.currentRound,
    submittedAt: Date.now(),
  }

  room.paragraphs.push(paragraph)

  broadcast(roomId, { type: 'paragraphSubmitted', paragraph, member: currentWriter })

  advanceTurn(roomId)
  broadcastRoomsList()
}

app.get('/api/rooms', (_req, res) => {
  res.json(Array.from(rooms.values()))
})

app.get('/api/rooms/:id', (req, res) => {
  const room = rooms.get(req.params.id)
  if (!room) {
    res.status(404).json({ error: '房间不存在' })
    return
  }
  res.json(room)
})

app.post('/api/rooms', (req, res) => {
  const { name } = req.body
  if (!name || typeof name !== 'string') {
    res.status(400).json({ error: '房间名不能为空' })
    return
  }
  const room = createRoom(name.trim())
  broadcastRoomsList()
  res.json(room)
})

wss.on('connection', (ws) => {
  clients.set(ws, { ws })

  const allRooms = Array.from(rooms.values())
  send(ws, { type: 'roomsList', rooms: allRooms })

  ws.on('message', (data) => {
    try {
      const msg: ClientMessage = JSON.parse(data.toString())

      switch (msg.type) {
        case 'join':
          joinRoom(ws, msg.roomId, msg.nickname)
          break
        case 'submit':
          submitParagraph(ws, msg.roomId, msg.content)
          break
        case 'ping':
          send(ws, { type: 'ping' } as any)
          break
      }
    } catch (e) {
      console.error('消息解析失败', e)
    }
  })

  ws.on('close', () => {
    const conn = clients.get(ws)
    if (conn && conn.roomId && conn.memberId) {
      const room = rooms.get(conn.roomId)
      if (room) {
        const idx = room.members.findIndex((m) => m.id === conn.memberId)
        if (idx >= 0) {
          const wasCurrentWriter = room.currentWriterIndex === idx && room.status === 'writing'
          room.members.splice(idx, 1)

          if (room.currentWriterIndex >= room.members.length) {
            room.currentWriterIndex = 0
          }

          broadcast(conn.roomId, { type: 'memberLeft', memberId: conn.memberId! })

          if (room.members.length === 0) {
            clearTurnTimer(conn.roomId)
            room.status = 'waiting'
            rooms.delete(conn.roomId)
          } else if (wasCurrentWriter) {
            room.turnDeadline = Date.now() + TURN_TIMEOUT_MS
            const newWriter = room.members[room.currentWriterIndex]
            broadcast(conn.roomId, {
              type: 'turnChanged',
              currentWriterId: newWriter.id,
              deadline: room.turnDeadline,
            })
            startTurnTimer(conn.roomId)
          }

          broadcast(conn.roomId, { type: 'roomState', state: room })
        }
      }
      broadcastRoomsList()
    }
    clients.delete(ws)
  })
})

const PORT = 4000
server.listen(PORT, () => {
  console.log(`创意接龙服务器运行在 http://localhost:${PORT}`)
})
