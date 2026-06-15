import { useEffect, useRef, useCallback, useState } from 'react'
import { PlayerState } from './usePlayerLogic'

interface SyncMessage {
  type: 'STATE_UPDATE' | 'REQUEST_SYNC' | 'SYNC_RESPONSE'
  payload?: Partial<PlayerState>
  senderId: string
}

const CHANNEL_NAME = 'sync-music-player-channel'

export function useSyncChannel(
  state: PlayerState,
  syncState: (newState: Partial<PlayerState>) => void,
) {
  const channelRef = useRef<BroadcastChannel | null>(null)
  const stateRef = useRef<PlayerState>(state)
  const senderIdRef = useRef<string>(Math.random().toString(36).substring(2, 9))
  const lastBroadcastRef = useRef<number>(0)
  const [isSyncing, setIsSyncing] = useState(false)
  const syncTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    stateRef.current = state
  }, [state])

  const showSyncIndicator = useCallback(() => {
    setIsSyncing(true)
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current)
    }
    syncTimeoutRef.current = window.setTimeout(() => {
      setIsSyncing(false)
    }, 500)
  }, [])

  const broadcastState = useCallback((partialState: Partial<PlayerState>) => {
    if (!channelRef.current) return

    const now = Date.now()
    if (now - lastBroadcastRef.current < 30) return
    lastBroadcastRef.current = now

    const message: SyncMessage = {
      type: 'STATE_UPDATE',
      payload: partialState,
      senderId: senderIdRef.current,
    }

    try {
      channelRef.current.postMessage(message)
    } catch (e) {
      console.error('Broadcast failed:', e)
    }
  }, [])

  useEffect(() => {
    const channel = new BroadcastChannel(CHANNEL_NAME)
    channelRef.current = channel

    channel.onmessage = (event: MessageEvent<SyncMessage>) => {
      const message = event.data
      if (message.senderId === senderIdRef.current) return

      if (message.type === 'STATE_UPDATE' && message.payload) {
        syncState(message.payload)
        showSyncIndicator()
      } else if (message.type === 'REQUEST_SYNC') {
        const response: SyncMessage = {
          type: 'SYNC_RESPONSE',
          payload: stateRef.current,
          senderId: senderIdRef.current,
        }
        channel.postMessage(response)
      } else if (message.type === 'SYNC_RESPONSE' && message.payload) {
        syncState(message.payload)
        showSyncIndicator()
      }
    }

    const requestSync: SyncMessage = {
      type: 'REQUEST_SYNC',
      senderId: senderIdRef.current,
    }
    channel.postMessage(requestSync)

    return () => {
      channel.close()
      channelRef.current = null
    }
  }, [syncState, showSyncIndicator])

  return {
    broadcastState,
    isSyncing,
  }
}
