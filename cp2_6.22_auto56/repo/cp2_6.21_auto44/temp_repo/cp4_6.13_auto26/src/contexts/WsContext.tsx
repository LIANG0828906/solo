import { createContext, useContext, type ReactNode } from 'react'
import { useWebSocket } from '@/hooks/useWebSocket'

const WsContext = createContext<ReturnType<typeof useWebSocket> | null>(null)

export function WsProvider({ children }: { children: ReactNode }) {
  const ws = useWebSocket()
  return <WsContext.Provider value={ws}>{children}</WsContext.Provider>
}

export function useWs() {
  const ctx = useContext(WsContext)
  if (!ctx) throw new Error('useWs must be used within WsProvider')
  return ctx
}
