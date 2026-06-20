import * as THREE from 'three'
import type { StarNode, Connection } from '@/types'

export const generateId = (): string => {
  return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export const generateConnectionId = (): string => {
  return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export const generateLogId = (): string => {
  return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export const generatePulseId = (): string => {
  return `pulse_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export const getRandomColor = (): string => {
  const colors = ['#00d4ff', '#a855f7', '#06b6d4', '#8b5cf6', '#22d3ee', '#a78bfa']
  return colors[Math.floor(Math.random() * colors.length)]
}

export const getRandomRotationSpeed = (): number => {
  return (Math.random() - 0.5) * 0.02
}

export const calculateDistance = (pos1: [number, number, number], pos2: [number, number, number]): number => {
  const dx = pos2[0] - pos1[0]
  const dy = pos2[1] - pos1[1]
  const dz = pos2[2] - pos1[2]
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

export const getNodeById = (nodes: StarNode[], id: string): StarNode | undefined => {
  return nodes.find(node => node.id === id)
}

export const getConnectionPoints = (
  nodes: StarNode[],
  connection: Connection
): { start: THREE.Vector3; end: THREE.Vector3 } | null => {
  const fromNode = getNodeById(nodes, connection.from)
  const toNode = getNodeById(nodes, connection.to)
  if (!fromNode || !toNode) return null
  return {
    start: new THREE.Vector3(...fromNode.position),
    end: new THREE.Vector3(...toNode.position)
  }
}

export const screenToWorld = (
  x: number,
  y: number,
  camera: THREE.Camera,
  width: number,
  height: number
): THREE.Vector3 => {
  const mouse = new THREE.Vector2()
  mouse.x = (x / width) * 2 - 1
  mouse.y = -(y / height) * 2 + 1
  const vector = new THREE.Vector3(mouse.x, mouse.y, 0.5)
  vector.unproject(camera)
  const dir = vector.sub(camera.position).normalize()
  const distance = -camera.position.z / dir.z
  const pos = camera.position.clone().add(dir.multiplyScalar(distance + 2))
  return pos
}

export const createStarfield = (count: number): Float32Array => {
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const i3 = i * 3
    const radius = 80 + Math.random() * 40
    const theta = Math.random() * Math.PI * 2
    const phi = Math.random() * Math.PI
    positions[i3] = radius * Math.sin(phi) * Math.cos(theta)
    positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
    positions[i3 + 2] = radius * Math.cos(phi)
  }
  return positions
}

export const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

export const getNodeShortId = (id: string): string => {
  const parts = id.split('_')
  return parts.length > 1 ? parts[1].slice(-4) : id.slice(-4)
}
