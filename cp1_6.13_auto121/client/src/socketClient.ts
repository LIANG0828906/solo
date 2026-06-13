import { io, Socket } from 'socket.io-client'
import {
  SocketEvent,
  LightConfig,
  ViewerInfo,
  PresetType
} from './types'

export interface SocketCallbacks {
  onLightsUpdate: (lights: LightConfig[], fromSelf: boolean) => void
  onPresetApplied: (lights: LightConfig[], preset: PresetType, fromSelf: boolean) => void
  onViewersUpdate: (viewers: ViewerInfo[]) => void
  onRoomJoined: (data: {
    roomCode: string
    isNewRoom: boolean
    lights: LightConfig[]
    viewers: ViewerInfo[]
  }) => void
  onRoomLeft: (data: { roomCode: string }) => void
  onError: (error: { message: string }) => void
}

export class SocketClient {
  private socket: Socket | null = null
  private callbacks: SocketCallbacks
  private currentRoom: string | null = null
  private heartbeatInterval: number | null = null

  constructor(callbacks: SocketCallbacks) {
    this.callbacks = callbacks
  }

  connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.hostname
    const port = import.meta.env?.DEV ? '3001' : window.location.port
    const url = `${protocol}//${host}:${port}`

    this.socket = io(url, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 10000
    })

    this.socket.on(SocketEvent.ROOM_JOINED, (data) => {
      this.currentRoom = data.roomCode
      this.startHeartbeat()
      this.callbacks.onRoomJoined(data)
    })

    this.socket.on(SocketEvent.ROOM_LEFT, (data) => {
      this.stopHeartbeat()
      this.currentRoom = null
      this.callbacks.onRoomLeft(data)
    })

    this.socket.on(SocketEvent.LIGHT_BROADCAST, (data: { lights: LightConfig[]; from: string }) => {
      const fromSelf = data.from === this.socket?.id
      this.callbacks.onLightsUpdate(data.lights, fromSelf)
    })

    this.socket.on(SocketEvent.PRESET_BROADCAST, (data: { lights: LightConfig[]; preset: PresetType; from: string }) => {
      const fromSelf = data.from === this.socket?.id
      this.callbacks.onPresetApplied(data.lights, data.preset, fromSelf)
    })

    this.socket.on(SocketEvent.VIEWERS_UPDATE, (viewers: ViewerInfo[]) => {
      this.callbacks.onViewersUpdate(viewers)
    })

    this.socket.on(SocketEvent.ERROR, (error) => {
      this.callbacks.onError(error)
    })

    this.socket.on('disconnect', () => {
      this.stopHeartbeat()
    })

    this.socket.on('connect', () => {
      if (this.currentRoom) {
        this.startHeartbeat()
      }
    })
  }

  private startHeartbeat() {
    this.stopHeartbeat()
    this.heartbeatInterval = window.setInterval(() => {
      if (this.currentRoom && this.socket?.connected) {
        this.socket.emit(SocketEvent.HEARTBEAT, { roomCode: this.currentRoom })
      }
    }, 20000)
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval !== null) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  joinRoom(roomCode: string | null, name: string, role: 'artist' | 'viewer' = 'viewer') {
    if (!this.socket) return
    this.socket.emit(SocketEvent.JOIN_ROOM, { roomCode, name, role })
  }

  leaveRoom() {
    if (!this.socket || !this.currentRoom) return
    this.socket.emit(SocketEvent.LEAVE_ROOM, { roomCode: this.currentRoom })
    this.stopHeartbeat()
    this.currentRoom = null
  }

  updateLights(lights: LightConfig[]) {
    if (!this.socket || !this.currentRoom) return
    this.socket.emit(SocketEvent.LIGHT_UPDATE, { roomCode: this.currentRoom, lights })
  }

  applyPreset(preset: PresetType) {
    if (!this.socket || !this.currentRoom) return
    this.socket.emit(SocketEvent.PRESET_APPLY, { roomCode: this.currentRoom, preset })
  }

  updateView() {
    if (!this.socket || !this.currentRoom) return
    this.socket.emit(SocketEvent.VIEW_UPDATE, { roomCode: this.currentRoom })
  }

  getCurrentRoom(): string | null {
    return this.currentRoom
  }

  isConnected(): boolean {
    return this.socket?.connected || false
  }

  disconnect() {
    this.stopHeartbeat()
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }
}
