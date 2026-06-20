import { useEffect, useRef, useCallback } from 'react'
import { useGameStore } from '@/store/gameStore'
import type { Room, WSMessage } from '../../shared/types'

export function useWebSocket() {
  const { setWs, setRoom, addNotification, sendWsMessage } = useGameStore()
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const connect = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return

    const ws = new WebSocket('ws://localhost:3001')

    ws.onopen = () => {
      setWs(ws)
      wsRef.current = ws
    }

    ws.onmessage = (event) => {
      try {
        const msg: WSMessage = JSON.parse(event.data)
        switch (msg.type) {
          case 'room:state': {
            const room = msg.payload as Room
            setRoom(room)
            break
          }
          case 'game:started': {
            const room = msg.payload as Room
            setRoom(room)
            addNotification('游戏开始！', 'success')
            break
          }
          case 'card:played': {
            const room = msg.payload as Room
            setRoom(room)
            break
          }
          case 'game:score': {
            const room = msg.payload as Room
            setRoom(room)
            break
          }
          case 'game:notification': {
            const payload = msg.payload as { message: string; type?: 'info' | 'success' | 'error' }
            addNotification(payload.message, payload.type || 'info')
            break
          }
          case 'game:end': {
            const room = msg.payload as Room
            setRoom(room)
            addNotification('游戏结束！', 'success')
            break
          }
        }
      } catch {
        // ignore parse errors
      }
    }

    ws.onclose = () => {
      setWs(null)
      wsRef.current = null
      reconnectRef.current = setTimeout(() => {
        connect()
      }, 3000)
    }

    ws.onerror = () => {
      ws.close()
    }
  }, [setWs, setRoom, addNotification])

  useEffect(() => {
    connect()
    return () => {
      if (reconnectRef.current) clearTimeout(reconnectRef.current)
      if (wsRef.current) wsRef.current.close()
    }
  }, [connect])

  const send = useCallback(
    (msg: WSMessage) => {
      sendWsMessage(msg)
    },
    [sendWsMessage]
  )

  return { send }
}
