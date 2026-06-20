import { useEffect, useRef, useCallback } from 'react'
import { useInventoryStore } from '@/stores/inventoryStore'

interface WebSocketMessage {
  type: 'alert' | 'ping'
  data?: {
    consumableId: string
    consumableName: string
    currentStock: number
    safetyThreshold: number
  }
}

export const useWebSocket = () => {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const addAlert = useInventoryStore((state) => state.addAlert)
  const setAlertCount = useInventoryStore((state) => state.setAlertCount)

  const connect = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/ws/alerts`

    wsRef.current = new WebSocket(wsUrl)

    wsRef.current.onopen = () => {
      console.log('WebSocket connected')
    }

    wsRef.current.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data)
        if (message.type === 'alert' && message.data) {
          addAlert({
            consumableId: message.data.consumableId,
            consumableName: message.data.consumableName,
            currentStock: message.data.currentStock,
            safetyThreshold: message.data.safetyThreshold,
          })
        } else if (message.type === 'ping') {
          wsRef.current?.send(JSON.stringify({ type: 'pong' }))
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error)
      }
    }

    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    wsRef.current.onclose = () => {
      console.log('WebSocket disconnected, attempting to reconnect...')
      setAlertCount(0)
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      reconnectTimeoutRef.current = setTimeout(connect, 3000)
    }
  }, [addAlert, setAlertCount])

  useEffect(() => {
    connect()

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [connect])

  return {
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
  }
}
