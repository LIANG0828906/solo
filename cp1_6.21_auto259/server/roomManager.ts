import { Socket } from 'socket.io'

export interface Player {
  id: 1 | 2
  socketId: string
  name: string
  hp: number
  maxHp: number
  position: { row: number; col: number }
  cooldowns: {
    fireball: number
    iceshield: number
    lightning: number
  }
  hasIceShield: boolean
  movedThisTurn: boolean
  skilledThisTurn: boolean
}

export type CellState = null | 'fire' | 'ice' | 'lightning'

export interface Room {
  id: string
  players: (Player | null)[]
  currentTurn: 1 | 2
  turnPhase: 'move' | 'skill' | 'waiting'
  turnTimer: number
  turnInterval: NodeJS.Timeout | null
  gridState: CellState[][]
  gridClearTimers: Map<string, NodeJS.Timeout>
  winner: null | 1 | 2
}

const rooms = new Map<string, Room>()
const waitingQueue: Socket[] = []

const GRID_SIZE = 5
const MAX_HP = 100
const TURN_DURATION = 5

function createInitialGrid(): CellState[][] {
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => null as CellState)
  )
}

function createPlayer(id: 1 | 2, socket: Socket, name: string): Player {
  const positions: Record<1 | 2, { row: number; col: number }> = {
    1: { row: 0, col: 0 },
    2: { row: 4, col: 4 },
  }
  return {
    id,
    socketId: socket.id,
    name,
    hp: MAX_HP,
    maxHp: MAX_HP,
    position: positions[id],
    cooldowns: { fireball: 0, iceshield: 0, lightning: 0 },
    hasIceShield: false,
    movedThisTurn: false,
    skilledThisTurn: false,
  }
}

function generateRoomId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export function createRoom(socket: Socket, playerName: string): Room {
  const roomId = generateRoomId()
  const player1 = createPlayer(1, socket, playerName)
  const room: Room = {
    id: roomId,
    players: [player1, null],
    currentTurn: 1,
    turnPhase: 'move',
    turnTimer: TURN_DURATION,
    turnInterval: null,
    gridState: createInitialGrid(),
    gridClearTimers: new Map(),
    winner: null,
  }
  rooms.set(roomId, room)
  socket.join(roomId)
  return room
}

export function findAvailableRoom(): Room | null {
  for (const room of rooms.values()) {
    if (room.players[1] === null && room.winner === null) {
      return room
    }
  }
  return null
}

export function joinRoom(
  roomId: string,
  socket: Socket,
  playerName: string
): { room: Room; player: Player } | null {
  const room = rooms.get(roomId)
  if (!room || room.players[1] !== null) return null

  const player2 = createPlayer(2, socket, playerName)
  room.players[1] = player2
  socket.join(roomId)

  room.turnTimer = TURN_DURATION
  return { room, player: player2 }
}

export function addToWaitingQueue(socket: Socket) {
  waitingQueue.push(socket)
}

export function removeFromWaitingQueue(socket: Socket) {
  const idx = waitingQueue.indexOf(socket)
  if (idx !== -1) waitingQueue.splice(idx, 1)
}

export function matchFromQueue(): { room: Room; p1: Player; p2: Player; p2Socket: Socket } | null {
  while (waitingQueue.length >= 2) {
    const s1 = waitingQueue.shift()!
    const s2 = waitingQueue.shift()!
    const room = createRoom(s1, '玩家1')
    const result = joinRoom(room.id, s2, '玩家2')
    if (result) {
      const p1 = room.players[0]!
      return { room, p1, p2: result.player, p2Socket: s2 }
    }
  }
  return null
}

export function getRoom(roomId: string): Room | undefined {
  return rooms.get(roomId)
}

export function deleteRoom(roomId: string) {
  const room = rooms.get(roomId)
  if (room) {
    if (room.turnInterval) clearInterval(room.turnInterval)
    room.gridClearTimers.forEach((t) => clearTimeout(t))
    rooms.delete(roomId)
  }
}

export function getPlayerBySocket(socket: Socket): { room: Room; player: Player } | null {
  for (const room of rooms.values()) {
    for (const p of room.players) {
      if (p && p.socketId === socket.id) {
        return { room, player: p }
      }
    }
  }
  return null
}

export { GRID_SIZE, MAX_HP, TURN_DURATION, waitingQueue }
