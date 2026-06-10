import { useState, useCallback } from 'react'
import { useStore } from '@/store/useStore'

export interface InteractionLogEntry {
  id: string
  nodeId: string
  energy: number
  distance: number
  timestamp: number
  type: 'click' | 'connect' | 'create'
}

const MAX_LOGS = 5

export const useInteractionLog = () => {
  const [logs, setLogs] = useState<InteractionLogEntry[]>([])
  const nodes = useStore((state) => state.nodes)

  const calculateDistance = (pos1: [number, number, number], pos2: [number, number, number]): number => {
    const dx = pos1[0] - pos2[0]
    const dy = pos1[1] - pos2[1]
    const dz = pos1[2] - pos2[2]
    return Math.sqrt(dx * dx + dy * dy + dz * dz)
  }

  const addLog = useCallback((nodeId: string, type: 'click' | 'connect' | 'create') => {
    const node = nodes.find((n) => n.id === nodeId)
    if (!node) return

    const origin: [number, number, number] = [0, 0, 0]
    const distance = calculateDistance(node.position, origin)

    const newLog: InteractionLogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      nodeId,
      energy: node.energy,
      distance: Number(distance.toFixed(2)),
      timestamp: Date.now(),
      type
    }

    setLogs((prev) => [newLog, ...prev].slice(0, MAX_LOGS))
  }, [nodes])

  const clearLogs = useCallback(() => {
    setLogs([])
  }, [])

  return {
    logs,
    addLog,
    clearLogs
  }
}
