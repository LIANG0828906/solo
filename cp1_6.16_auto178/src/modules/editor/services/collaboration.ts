import { io, Socket } from 'socket.io-client'
import { useMindmapStore, selectMindmapState } from '../store/useMindmapStore'
import type { MindMapState } from '../types'

type SyncState = Omit<MindMapState, 'selectedNodeId'>

let socket: Socket | null = null
let isRemoteUpdate = false
let updateCount = 0

export const initCollaboration = (onSync: (count: number) => void): void => {
  socket = io({
    transports: ['websocket', 'polling'],
  })

  socket.on('connect', () => {
    console.log('Connected to collaboration server')
  })

  socket.on('mindmap-init', (state: SyncState) => {
    if (state.nodes.length > 0 || state.edges.length > 0) {
      isRemoteUpdate = true
      const store = useMindmapStore.getState()
      store.skipNextHistory()
      store.replaceState(state)
      isRemoteUpdate = false
    }
  })

  socket.on('mindmap-update', (state: SyncState) => {
    isRemoteUpdate = true
    const store = useMindmapStore.getState()
    store.skipNextHistory()
    store.replaceState(state)
    isRemoteUpdate = false
    updateCount++
    onSync(updateCount)
  })

  useMindmapStore.subscribe(
    (state) => selectMindmapState(state),
    (newState) => {
      if (isRemoteUpdate || !socket?.connected) return
      socket.emit('mindmap-update', newState)
    }
  )
}

export const disconnectCollaboration = (): void => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
