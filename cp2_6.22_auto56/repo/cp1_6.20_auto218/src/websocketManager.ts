import { io, type Socket } from 'socket.io-client'
import type { UserJoinedEvent, UserLeftEvent, CursorEvent, CursorRemovedEvent, EditEvent } from './types'

type EditCallback = (event: EditEvent) => void
type CursorCallback = (event: CursorEvent) => void
type UserJoinedCallback = (event: UserJoinedEvent) => void
type UserLeftCallback = (event: UserLeftEvent) => void
type CursorRemovedCallback = (event: CursorRemovedEvent) => void

type CallbackType = 'edit' | 'cursor' | 'userJoined' | 'userLeft' | 'cursorRemoved'

interface CallbackMap {
  edit: Set<EditCallback>
  cursor: Set<CursorCallback>
  userJoined: Set<UserJoinedCallback>
  userLeft: Set<UserLeftCallback>
  cursorRemoved: Set<CursorRemovedCallback>
}

class WebSocketManager {
  private static instance: WebSocketManager | null = null
  private socket: Socket | null = null
  private currentScriptId: string | null = null
  private currentUserId: string | null = null
  private currentUserName: string | null = null
  private callbacks: CallbackMap = {
    edit: new Set(),
    cursor: new Set(),
    userJoined: new Set(),
    userLeft: new Set(),
    cursorRemoved: new Set(),
  }

  private constructor() {}

  static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager()
    }
    return WebSocketManager.instance
  }

  connect(scriptId: string, userId: string, userName: string): void {
    if (this.socket && this.currentScriptId === scriptId && this.currentUserId === userId) {
      return
    }

    this.disconnect()

    this.currentScriptId = scriptId
    this.currentUserId = userId
    this.currentUserName = userName

    const socketUrl = import.meta.env.VITE_SOCKET_URL || ''
    this.socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
    })

    this.socket.on('connect', () => {
      console.log('WebSocket connected')
      this.socket?.emit('join', { scriptId, userId, userName })
    })

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected')
    })

    this.socket.on('edit', (data: EditEvent) => {
      if (data.userId !== this.currentUserId) {
        this.callbacks.edit.forEach((cb) => cb(data))
      }
    })

    this.socket.on('cursor', (data: CursorEvent) => {
      if (data.userId !== this.currentUserId) {
        this.callbacks.cursor.forEach((cb) => cb(data))
      }
    })

    this.socket.on('userJoined', (data: UserJoinedEvent) => {
      this.callbacks.userJoined.forEach((cb) => cb(data))
    })

    this.socket.on('userLeft', (data: UserLeftEvent) => {
      this.callbacks.userLeft.forEach((cb) => cb(data))
    })

    this.socket.on('cursorRemoved', (data: CursorRemovedEvent) => {
      this.callbacks.cursorRemoved.forEach((cb) => cb(data))
    })
  }

  disconnect(): void {
    if (this.socket && this.currentScriptId && this.currentUserId && this.currentUserName) {
      this.socket.emit('leave', {
        scriptId: this.currentScriptId,
        userId: this.currentUserId,
        userName: this.currentUserName,
      })
      this.socket.disconnect()
      this.socket = null
    } else if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
    this.currentScriptId = null
    this.currentUserId = null
    this.currentUserName = null
  }

  sendEdit(content: string): void {
    if (!this.socket || !this.socket.connected || !this.currentScriptId || !this.currentUserId) return
    this.socket.emit('edit', {
      scriptId: this.currentScriptId,
      userId: this.currentUserId,
      content,
    })
  }

  sendCursor(line: number, column: number = 0): void {
    if (!this.socket || !this.socket.connected || !this.currentScriptId || !this.currentUserId || !this.currentUserName) return
    this.socket.emit('cursor', {
      scriptId: this.currentScriptId,
      userId: this.currentUserId,
      userName: this.currentUserName,
      line,
      column,
    })
  }

  on(type: 'edit', callback: EditCallback): () => void
  on(type: 'cursor', callback: CursorCallback): () => void
  on(type: 'userJoined', callback: UserJoinedCallback): () => void
  on(type: 'userLeft', callback: UserLeftCallback): () => void
  on(type: 'cursorRemoved', callback: CursorRemovedCallback): () => void
  on(type: CallbackType, callback: unknown): () => void {
    const callbackSet = this.callbacks[type] as Set<unknown>
    callbackSet.add(callback)
    return () => {
      callbackSet.delete(callback)
    }
  }

  off(type: CallbackType, callback: unknown): void {
    const callbackSet = this.callbacks[type] as Set<unknown>
    callbackSet.delete(callback)
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false
  }
}

export const websocketManager = WebSocketManager.getInstance()
