import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import {
  LightConfig,
  SocketEvent,
  RoomState,
  ViewerInfo,
  DEFAULT_LIGHTS,
  PresetType,
  LIGHT_POSITIONS
} from '../client/src/types'

const app = express()
app.use(cors())
app.use(express.json())

const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  pingTimeout: 30000,
  pingInterval: 15000
})

const rooms = new Map<string, RoomState>()
const socketRoomMap = new Map<string, string>()

function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code: string
  do {
    code = ''
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
  } while (rooms.has(code))
  return code
}

function getPresetLights(preset: PresetType): LightConfig[] {
  switch (preset) {
    case 'warmDusk':
      return LIGHT_POSITIONS.map((pos, idx) => ({
        id: idx,
        color: ['#FF7A45', '#FAAD14', '#FF4D4F', '#FAAD14', '#FF7A45'][idx],
        brightness: [75, 80, 60, 80, 70][idx],
        colorTemp: 3200,
        position: pos.position,
        target: pos.target
      }))
    case 'coolTech':
      return LIGHT_POSITIONS.map((pos, idx) => ({
        id: idx,
        color: ['#1890FF', '#13C2C2', '#722ED1', '#13C2C2', '#1890FF'][idx],
        brightness: [85, 70, 65, 70, 80][idx],
        colorTemp: 6200,
        position: pos.position,
        target: pos.target
      }))
    case 'softMorning':
      return LIGHT_POSITIONS.map((pos, idx) => ({
        id: idx,
        color: ['#FFFFFF', '#FAAD14', '#FFFFFF', '#FAAD14', '#FFFFFF'][idx],
        brightness: [55, 45, 55, 45, 50][idx],
        colorTemp: 5200,
        position: pos.position,
        target: pos.target
      }))
  }
}

function broadcastViewers(roomCode: string) {
  const room = rooms.get(roomCode)
  if (room) {
    io.to(roomCode).emit(SocketEvent.VIEWERS_UPDATE, room.viewers)
  }
}

function cleanupInactiveViewers() {
  const now = Date.now()
  rooms.forEach((room, roomCode) => {
    const inactive = room.viewers.filter(v => now - v.lastActive > 30000)
    if (inactive.length > 0) {
      room.viewers = room.viewers.filter(v => now - v.lastActive <= 30000)
      inactive.forEach(v => {
        const sockets = io.sockets.sockets
        sockets.forEach((socket) => {
          if (socket.id === v.id) {
            socket.leave(roomCode)
            socketRoomMap.delete(socket.id)
          }
        })
      })
      broadcastViewers(roomCode)
    }
    if (room.viewers.length === 0 && now - room.createdAt > 300000) {
      rooms.delete(roomCode)
    }
  })
}

setInterval(cleanupInactiveViewers, 10000)

io.on('connection', (socket) => {
  socket.on(SocketEvent.JOIN_ROOM, (data: { roomCode?: string; name: string; role: 'artist' | 'viewer' }) => {
    try {
      let roomCode = data.roomCode?.toUpperCase()
      let isNewRoom = false

      if (!roomCode) {
        roomCode = generateRoomCode()
        isNewRoom = true
      }

      if (!rooms.has(roomCode)) {
        rooms.set(roomCode, {
          roomCode,
          lights: JSON.parse(JSON.stringify(DEFAULT_LIGHTS)),
          viewers: [],
          createdAt: Date.now()
        })
        isNewRoom = true
      }

      const room = rooms.get(roomCode)!

      if (room.viewers.length >= 10 && data.role === 'viewer') {
        socket.emit(SocketEvent.ERROR, { message: '房间已满，最多容纳10人' })
        return
      }

      const viewerExists = room.viewers.find(v => v.id === socket.id)
      if (!viewerExists) {
        const viewer: ViewerInfo = {
          id: socket.id,
          name: data.name || `用户${Math.floor(Math.random() * 1000)}`,
          role: data.role || 'viewer',
          joinedAt: Date.now(),
          lastActive: Date.now()
        }
        room.viewers.push(viewer)
      }

      socket.join(roomCode!)
      socketRoomMap.set(socket.id, roomCode!)

      socket.emit(SocketEvent.ROOM_JOINED, {
        roomCode,
        isNewRoom,
        lights: room.lights,
        viewers: room.viewers
      })

      broadcastViewers(roomCode!)
    } catch (err) {
      socket.emit(SocketEvent.ERROR, { message: '加入房间失败' })
    }
  })

  socket.on(SocketEvent.LIGHT_UPDATE, (data: { roomCode: string; lights: LightConfig[] }) => {
    const roomCode = data.roomCode?.toUpperCase()
    const room = rooms.get(roomCode)
    if (!room) return

    const viewer = room.viewers.find(v => v.id === socket.id)
    if (viewer) viewer.lastActive = Date.now()

    data.lights.forEach(lightData => {
      const light = room.lights.find(l => l.id === lightData.id)
      if (light) {
        light.color = lightData.color
        light.brightness = Math.max(0, Math.min(100, Math.round(lightData.brightness)))
        light.colorTemp = Math.max(3000, Math.min(6500, Math.round(lightData.colorTemp)))
        light.position = lightData.position
        light.target = lightData.target
      }
    })

    io.to(roomCode).emit(SocketEvent.LIGHT_BROADCAST, {
      lights: room.lights,
      from: socket.id
    })
  })

  socket.on(SocketEvent.PRESET_APPLY, (data: { roomCode: string; preset: PresetType }) => {
    const roomCode = data.roomCode?.toUpperCase()
    const room = rooms.get(roomCode)
    if (!room) return

    const viewer = room.viewers.find(v => v.id === socket.id)
    if (viewer) viewer.lastActive = Date.now()

    const presetLights = getPresetLights(data.preset)
    room.lights = presetLights

    io.to(roomCode).emit(SocketEvent.PRESET_BROADCAST, {
      lights: room.lights,
      preset: data.preset,
      from: socket.id
    })
  })

  socket.on(SocketEvent.VIEW_UPDATE, (data: { roomCode: string }) => {
    const roomCode = data.roomCode?.toUpperCase()
    const room = rooms.get(roomCode)
    if (!room) return

    const viewer = room.viewers.find(v => v.id === socket.id)
    if (viewer) viewer.lastActive = Date.now()
  })

  socket.on(SocketEvent.HEARTBEAT, (data: { roomCode: string }) => {
    const roomCode = data.roomCode?.toUpperCase()
    const room = rooms.get(roomCode)
    if (!room) return

    const viewer = room.viewers.find(v => v.id === socket.id)
    if (viewer) viewer.lastActive = Date.now()
  })

  socket.on(SocketEvent.LEAVE_ROOM, (data: { roomCode: string }) => {
    const roomCode = data.roomCode?.toUpperCase()
    const room = rooms.get(roomCode)
    if (room) {
      room.viewers = room.viewers.filter(v => v.id !== socket.id)
      broadcastViewers(roomCode)
    }
    socket.leave(roomCode)
    socketRoomMap.delete(socket.id)
    socket.emit(SocketEvent.ROOM_LEFT, { roomCode })
  })

  socket.on('disconnect', () => {
    const roomCode = socketRoomMap.get(socket.id)
    if (roomCode) {
      const room = rooms.get(roomCode)
      if (room) {
        room.viewers = room.viewers.filter(v => v.id !== socket.id)
        broadcastViewers(roomCode)
      }
      socketRoomMap.delete(socket.id)
    }
  })
})

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    activeRooms: rooms.size,
    totalViewers: socketRoomMap.size
  })
})

const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`LightCanvas Server running on port ${PORT}`)
})
