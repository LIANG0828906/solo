import { useRef, useEffect, useState, useCallback } from 'react'

interface UseWebSocketOptions {
  url: string
  onMessage?: (data: unknown) => void
  onOpen?: () => void
  onClose?: () => void
  onError?: (error: Event) => void
  autoReconnect?: boolean
  reconnectInterval?: number
  maxReconnectAttempts?: number
}

interface UseWebSocketReturn {
  send: (data: unknown) => void
  readyState: number
  connected: boolean
  reconnect: () => void
  close: () => void
}

export function useWebSocket({
  url,
  onMessage,
  onOpen,
  onClose,
  onError,
  autoReconnect = true,
  reconnectInterval = 3000,
  maxReconnectAttempts = 10,
}: UseWebSocketOptions): UseWebSocketReturn {
  const wsRef = useRef<WebSocket | null>(null)
  const [connected, setConnected] = useState(false)
  const [readyState, setReadyState] = useState<number>(WebSocket.CONNECTING)
  const reconnectAttemptsRef = useRef(0)
  const shouldReconnectRef = useRef(autoReconnect)

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    try {
      const ws = new WebSocket(url)
      wsRef.current = ws
      setReadyState(ws.readyState)

      ws.onopen = () => {
        setConnected(true)
        setReadyState(WebSocket.OPEN)
        reconnectAttemptsRef.current = 0
        onOpen?.()
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          onMessage?.(data)
        } catch {
          onMessage?.(event.data)
        }
      }

      ws.onclose = () => {
        setConnected(false)
        setReadyState(WebSocket.CLOSED)
        onClose?.()

        if (shouldReconnectRef.current && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++
          setTimeout(() => {
            if (shouldReconnectRef.current) {
              connect()
            }
          }, reconnectInterval)
        }
      }

      ws.onerror = (error) => {
        onError?.(error)
      }
    } catch (error) {
      console.error('WebSocket connection error:', error)
    }
  }, [url, onOpen, onMessage, onClose, onError, reconnectInterval, maxReconnectAttempts])

  const send = useCallback((data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const message = typeof data === 'string' ? data : JSON.stringify(data)
      wsRef.current.send(message)
    }
  }, [])

  const close = useCallback(() => {
    shouldReconnectRef.current = false
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
  }, [])

  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0
    shouldReconnectRef.current = true
    close()
    setTimeout(connect, 100)
  }, [connect, close])

  useEffect(() => {
    shouldReconnectRef.current = autoReconnect
    connect()

    return () => {
      shouldReconnectRef.current = false
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [connect, autoReconnect])

  return {
    send,
    readyState,
    connected,
    reconnect,
    close,
  }
}
