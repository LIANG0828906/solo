import { io, Socket } from 'socket.io-client'
import type {
  SkillType,
  Position,
  GameState,
  SkillEffectEvent,
  HpChangeEvent,
  TurnTimeoutEvent,
} from '../types/game'

type EventMap = {
  joinedRoom: { roomId: string; playerId: 1 | 2 }
  waitingForMatch: void
  gameState: GameState
  skillEffect: SkillEffectEvent
  hpChange: HpChangeEvent
  turnTimeout: TurnTimeoutEvent
}

class GameSocket {
  private socket: Socket | null = null
  private listeners: Map<string, Set<(data: unknown) => void>> = new Map()

  connect() {
    if (this.socket && this.socket.connected) return
    const url =
      typeof window !== 'undefined' && window.location.hostname === 'localhost'
        ? 'http://localhost:3002'
        : ''
    this.socket = io(url, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    this.socket.onAny((event, data) => {
      const set = this.listeners.get(event)
      if (set) set.forEach((fn) => fn(data))
    })
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  on<K extends keyof EventMap>(event: K, callback: (data: EventMap[K]) => void) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set())
    this.listeners.get(event)!.add(callback as (data: unknown) => void)
  }

  off<K extends keyof EventMap>(event: K, callback: (data: EventMap[K]) => void) {
    const set = this.listeners.get(event)
    if (set) set.delete(callback as (data: unknown) => void)
  }

  joinRoom(playerName: string, roomId?: string) {
    this.socket?.emit('joinRoom', { roomId, playerName })
  }

  quickMatch(playerName: string) {
    this.socket?.emit('quickMatch', { playerName })
  }

  move(roomId: string, playerId: number, targetCell: Position) {
    this.socket?.emit('move', { roomId, playerId, targetCell })
  }

  castSkill(
    roomId: string,
    playerId: number,
    skillType: SkillType,
    targetCell: Position
  ) {
    this.socket?.emit('castSkill', { roomId, playerId, skillType, targetCell })
  }

  endTurn(roomId: string, playerId: number) {
    this.socket?.emit('endTurn', { roomId, playerId })
  }

  restartGame(roomId: string) {
    this.socket?.emit('restartGame', { roomId })
  }
}

export const gameSocket = new GameSocket()
