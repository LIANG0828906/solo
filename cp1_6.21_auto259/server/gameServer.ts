import express, { Request, Response } from 'express'
import { createServer } from 'http'
import { Server, Socket } from 'socket.io'
import cors from 'cors'
import {
  Room,
  Player,
  CellState,
  GRID_SIZE,
  MAX_HP,
  TURN_DURATION,
  createRoom,
  joinRoom,
  findAvailableRoom,
  getRoom,
  getPlayerBySocket,
  matchFromQueue,
  addToWaitingQueue,
  removeFromWaitingQueue,
  deleteRoom,
} from './roomManager'

type SkillType = 'fireball' | 'iceshield' | 'lightning'
interface Position {
  row: number
  col: number
}

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})

app.use(cors())
app.use(express.json())

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' })
})

app.get('/api/rooms', (_req: Request, res: Response) => {
  const available = findAvailableRoom()
  res.json({ available: available?.id ?? null })
})

function emitGameState(room: Room) {
  const publicState = {
    roomId: room.id,
    currentTurn: room.currentTurn,
    turnPhase: room.turnPhase,
    turnTimer: room.turnTimer,
    players: room.players.map((p) =>
      p
        ? {
            id: p.id,
            name: p.name,
            hp: p.hp,
            maxHp: p.maxHp,
            position: p.position,
            cooldowns: { ...p.cooldowns },
            hasIceShield: p.hasIceShield,
          }
        : null
    ),
    gridState: room.gridState.map((row) => [...row]),
    winner: room.winner,
  }
  io.to(room.id).emit('gameState', publicState)
}

function isAdjacent(a: Position, b: Position): boolean {
  const dr = Math.abs(a.row - b.row)
  const dc = Math.abs(a.col - b.col)
  return dr + dc === 1
}

function isValidMove(room: Room, player: Player, target: Position): boolean {
  if (target.row < 0 || target.row >= GRID_SIZE) return false
  if (target.col < 0 || target.col >= GRID_SIZE) return false
  if (!isAdjacent(player.position, target)) return false
  const other = room.players.find(
    (p) => p && p.id !== player.id && p.position.row === target.row && p.position.col === target.col
  )
  return !other
}

function setGridState(room: Room, pos: Position, state: CellState) {
  room.gridState[pos.row][pos.col] = state
  const key = `${pos.row}-${pos.col}`
  const existing = room.gridClearTimers.get(key)
  if (existing) clearTimeout(existing)
  const timer = setTimeout(() => {
    const r = getRoom(room.id)
    if (r) {
      r.gridState[pos.row][pos.col] = null
      emitGameState(r)
    }
    room.gridClearTimers.delete(key)
  }, 1500)
  room.gridClearTimers.set(key, timer)
}

function markGridBySkill(room: Room, type: SkillType, target: Position, playerPos: Position) {
  if (type === 'fireball') {
    setGridState(room, target, 'fire')
    const dirs = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ]
    for (const [dr, dc] of dirs) {
      const r = target.row + dr
      const c = target.col + dc
      if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
        setGridState(room, { row: r, col: c }, 'fire')
      }
    }
  } else if (type === 'iceshield') {
    setGridState(room, playerPos, 'ice')
  } else if (type === 'lightning') {
    const useRow = Math.random() > 0.5
    if (useRow) {
      for (let c = 0; c < GRID_SIZE; c++) {
        setGridState(room, { row: target.row, col: c }, 'lightning')
      }
    } else {
      for (let r = 0; r < GRID_SIZE; r++) {
        setGridState(room, { row: r, col: target.col }, 'lightning')
      }
    }
  }
}

function getAffectedCells(type: SkillType, target: Position): Position[] {
  const result: Position[] = []
  if (type === 'fireball') {
    result.push(target)
    const dirs = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ]
    for (const [dr, dc] of dirs) {
      const r = target.row + dr
      const c = target.col + dc
      if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
        result.push({ row: r, col: c })
      }
    }
  } else if (type === 'iceshield') {
    result.push(target)
  } else if (type === 'lightning') {
    const useRow = Math.random() > 0.5
    if (useRow) {
      for (let c = 0; c < GRID_SIZE; c++) result.push({ row: target.row, col: c })
    } else {
      for (let r = 0; r < GRID_SIZE; r++) result.push({ row: r, col: target.col })
    }
  }
  return result
}

function applyDamage(room: Room, type: SkillType, target: Position, casterId: number) {
  const affected = getAffectedCells(type, target)
  const damagedPlayers: { player: Player; damage: number }[] = []

  for (const p of room.players) {
    if (!p || p.id === casterId) continue
    if (type === 'iceshield') continue
    const hit = affected.some(
      (a) => a.row === p.position.row && a.col === p.position.col
    )
    if (hit) {
      let dmg = type === 'fireball' ? 25 : 35
      if (p.hasIceShield) {
        dmg = Math.floor(dmg * 0.5)
        p.hasIceShield = false
      }
      p.hp = Math.max(0, p.hp - dmg)
      damagedPlayers.push({ player: p, damage: dmg })
    }
  }

  for (const d of damagedPlayers) {
    io.to(room.id).emit('hpChange', {
      playerId: d.player.id,
      newHp: d.player.hp,
      delta: -d.damage,
    })
  }

  if (type === 'iceshield') {
    const caster = room.players.find((p) => p && p.id === casterId)
    if (caster) caster.hasIceShield = true
  }
}

function checkWinner(room: Room): boolean {
  for (const p of room.players) {
    if (p && p.hp <= 0) {
      room.winner = (p.id === 1 ? 2 : 1) as 1 | 2
      if (room.turnInterval) {
        clearInterval(room.turnInterval)
        room.turnInterval = null
      }
      return true
    }
  }
  return false
}

function decCooldowns(room: Room, playerId: number) {
  const p = room.players.find((x) => x && x.id === playerId)
  if (!p) return
  ;(Object.keys(p.cooldowns) as SkillType[]).forEach((k) => {
    if (p.cooldowns[k] > 0) p.cooldowns[k]--
  })
}

function startTurnTimer(room: Room) {
  if (room.turnInterval) clearInterval(room.turnInterval)
  room.turnTimer = TURN_DURATION
  room.turnPhase = 'move'
  const curPlayer = room.players.find((p) => p && p.id === room.currentTurn)
  if (curPlayer) {
    curPlayer.movedThisTurn = false
    curPlayer.skilledThisTurn = false
  }
  emitGameState(room)

  room.turnInterval = setInterval(() => {
    const r = getRoom(room.id)
    if (!r || r.winner !== null) {
      if (r?.turnInterval) {
        clearInterval(r.turnInterval)
        r.turnInterval = null
      }
      return
    }
    r.turnTimer--
    if (r.turnTimer <= 0) {
      const skipped = r.currentTurn
      io.to(r.id).emit('turnTimeout', { skipPlayerId: skipped })
      const player = r.players.find((p) => p && p.id === skipped)
      if (player) decCooldowns(r, skipped)
      r.currentTurn = (skipped === 1 ? 2 : 1) as 1 | 2
      const nextPlayer = r.players.find((p) => p && p.id === r.currentTurn)
      if (nextPlayer) {
        nextPlayer.movedThisTurn = false
        nextPlayer.skilledThisTurn = false
      }
      r.turnTimer = TURN_DURATION
      r.turnPhase = 'move'
    }
    emitGameState(r)
  }, 1000)
}

function handleStartBothPlayers(room: Room) {
  if (room.players[0] && room.players[1]) {
    startTurnTimer(room)
  }
}

io.on('connection', (socket: Socket) => {
  socket.on('joinRoom', (data: { roomId?: string; playerName: string }) => {
    const playerName = data.playerName || '玩家'
    let joinedRoom: Room | null = null
    let joinedPlayer: Player | null = null

    if (data.roomId) {
      const result = joinRoom(data.roomId, socket, playerName)
      if (result) {
        joinedRoom = result.room
        joinedPlayer = result.player
      }
    }

    if (!joinedRoom) {
      const available = findAvailableRoom()
      if (available) {
        const result = joinRoom(available.id, socket, playerName)
        if (result) {
          joinedRoom = result.room
          joinedPlayer = result.player
        }
      }
    }

    if (!joinedRoom) {
      joinedRoom = createRoom(socket, playerName)
      joinedPlayer = joinedRoom.players[0]!
    }

    socket.emit('joinedRoom', {
      roomId: joinedRoom.id,
      playerId: joinedPlayer!.id,
    })

    emitGameState(joinedRoom)
    handleStartBothPlayers(joinedRoom)
  })

  socket.on('quickMatch', (data: { playerName: string }) => {
    addToWaitingQueue(socket)
    const match = matchFromQueue()
    if (match) {
      const { room, p1, p2 } = match
      io.to(p1.socketId).emit('joinedRoom', { roomId: room.id, playerId: 1 })
      io.to(p2.socketId).emit('joinedRoom', { roomId: room.id, playerId: 2 })
      emitGameState(room)
      handleStartBothPlayers(room)
    } else {
      socket.emit('waitingForMatch')
    }
  })

  socket.on('move', (data: { roomId: string; playerId: number; targetCell: Position }) => {
    const room = getRoom(data.roomId)
    if (!room || room.winner !== null) return
    const player = room.players.find((p) => p && p.id === data.playerId)
    if (!player || player.socketId !== socket.id) return
    if (room.currentTurn !== player.id) return
    if (player.movedThisTurn) return

    if (isValidMove(room, player, data.targetCell)) {
      player.position = { ...data.targetCell }
      player.movedThisTurn = true
      room.turnPhase = 'skill'
      emitGameState(room)
    }
  })

  socket.on(
    'castSkill',
    (data: {
      roomId: string
      playerId: number
      skillType: SkillType
      targetCell: Position
    }) => {
      const room = getRoom(data.roomId)
      if (!room || room.winner !== null) return
      const player = room.players.find((p) => p && p.id === data.playerId)
      if (!player || player.socketId !== socket.id) return
      if (room.currentTurn !== player.id) return
      if (player.skilledThisTurn) return
      if (player.cooldowns[data.skillType] > 0) return

      player.skilledThisTurn = true

      const configs: Record<SkillType, number> = {
        fireball: 2,
        iceshield: 3,
        lightning: 3,
      }
      player.cooldowns[data.skillType] = configs[data.skillType]

      io.to(room.id).emit('skillEffect', {
        skillType: data.skillType,
        targetCell: data.targetCell,
        playerId: data.playerId,
        timestamp: Date.now(),
      })

      markGridBySkill(room, data.skillType, data.targetCell, player.position)
      applyDamage(room, data.skillType, data.targetCell, data.playerId)

      decCooldowns(room, player.id)
      const nextTurn = (room.currentTurn === 1 ? 2 : 1) as 1 | 2
      room.currentTurn = nextTurn
      const nextPlayer = room.players.find((p) => p && p.id === nextTurn)
      if (nextPlayer) {
        nextPlayer.movedThisTurn = false
        nextPlayer.skilledThisTurn = false
      }
      if (room.turnInterval) {
        clearInterval(room.turnInterval)
        room.turnInterval = null
      }

      if (checkWinner(room)) {
        emitGameState(room)
        return
      }
      startTurnTimer(room)
    }
  )

  socket.on('endTurn', (data: { roomId: string; playerId: number }) => {
    const room = getRoom(data.roomId)
    if (!room || room.winner !== null) return
    const player = room.players.find((p) => p && p.id === data.playerId)
    if (!player || player.socketId !== socket.id) return
    if (room.currentTurn !== player.id) return

    decCooldowns(room, player.id)
    const nextTurn = (room.currentTurn === 1 ? 2 : 1) as 1 | 2
    room.currentTurn = nextTurn
    const nextPlayer = room.players.find((p) => p && p.id === nextTurn)
    if (nextPlayer) {
      nextPlayer.movedThisTurn = false
      nextPlayer.skilledThisTurn = false
    }
    if (room.turnInterval) {
      clearInterval(room.turnInterval)
      room.turnInterval = null
    }
    startTurnTimer(room)
  })

  socket.on('restartGame', (data: { roomId: string }) => {
    const room = getRoom(data.roomId)
    if (!room) return
    const p1 = room.players[0]
    const p2 = room.players[1]
    if (!p1 || !p2) return
    p1.hp = MAX_HP
    p2.hp = MAX_HP
    p1.position = { row: 0, col: 0 }
    p2.position = { row: 4, col: 4 }
    p1.cooldowns = { fireball: 0, iceshield: 0, lightning: 0 }
    p2.cooldowns = { fireball: 0, iceshield: 0, lightning: 0 }
    p1.hasIceShield = false
    p2.hasIceShield = false
    room.gridClearTimers.forEach((t) => clearTimeout(t))
    room.gridClearTimers.clear()
    for (let r = 0; r < GRID_SIZE; r++) for (let c = 0; c < GRID_SIZE; c++) room.gridState[r][c] = null
    room.winner = null
    room.currentTurn = 1
    startTurnTimer(room)
  })

  socket.on('disconnect', () => {
    removeFromWaitingQueue(socket)
    const info = getPlayerBySocket(socket)
    if (info) {
      const { room, player } = info
      const winner = (player.id === 1 ? 2 : 1) as 1 | 2
      room.winner = winner
      if (room.turnInterval) {
        clearInterval(room.turnInterval)
        room.turnInterval = null
      }
      emitGameState(room)
      setTimeout(() => deleteRoom(room.id), 10000)
    }
  })
})

const PORT = process.env.PORT || 3002
httpServer.listen(PORT, () => {
  console.log(`[Server] Magic Duel server running on http://localhost:${PORT}`)
})
