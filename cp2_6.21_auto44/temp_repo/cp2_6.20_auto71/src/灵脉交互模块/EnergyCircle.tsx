import React from 'react'
import type { ElementType } from '@/utils/elementEngine'
import type { VeinNodeState } from '@/utils/api'

const ELEMENTS: ElementType[] = ['metal', 'wood', 'water', 'fire', 'earth']

const SHENG_CONNECTIONS: [ElementType, ElementType][] = [
  ['metal', 'water'],
  ['water', 'wood'],
  ['wood', 'fire'],
  ['fire', 'earth'],
  ['earth', 'metal'],
]

const KE_CONNECTIONS: [ElementType, ElementType][] = [
  ['metal', 'wood'],
  ['wood', 'earth'],
  ['earth', 'water'],
  ['water', 'fire'],
  ['fire', 'metal'],
]

const RING_RADIUS = 48
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

interface EnergyCircleProps {
  nodes: VeinNodeState[]
  nodePositions: Record<ElementType, { x: number; y: number }>
}

function getNodeMap(nodes: VeinNodeState[]): Record<string, VeinNodeState> {
  const map: Record<string, VeinNodeState> = {}
  for (const node of nodes) {
    map[node.id] = node
  }
  return map
}

function isBothActive(
  nodeMap: Record<string, VeinNodeState>,
  from: ElementType,
  to: ElementType,
): boolean {
  return nodeMap[from]?.isActive === true && nodeMap[to]?.isActive === true
}

const EnergyCircle: React.FC<EnergyCircleProps> = ({ nodes, nodePositions }) => {
  const nodeMap = getNodeMap(nodes)

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id="glow-green" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="glow-red" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      <g className="energy-sheng-lines">
        {SHENG_CONNECTIONS.map(([from, to]) => {
          const fromPos = nodePositions[from]
          const toPos = nodePositions[to]
          if (!fromPos || !toPos) return null
          const bothActive = isBothActive(nodeMap, from, to)
          return (
            <line
              key={`sheng-${from}-${to}`}
              x1={fromPos.x}
              y1={fromPos.y}
              x2={toPos.x}
              y2={toPos.y}
              stroke="#22c55e"
              strokeWidth={2}
              opacity={bothActive ? 1 : 0.6}
              filter={bothActive ? 'url(#glow-green)' : undefined}
            />
          )
        })}
      </g>

      <g className="energy-ke-lines">
        {KE_CONNECTIONS.map(([from, to]) => {
          const fromPos = nodePositions[from]
          const toPos = nodePositions[to]
          if (!fromPos || !toPos) return null
          const bothActive = isBothActive(nodeMap, from, to)
          return (
            <line
              key={`ke-${from}-${to}`}
              x1={fromPos.x}
              y1={fromPos.y}
              x2={toPos.x}
              y2={toPos.y}
              stroke="#ef4444"
              strokeWidth={1.5}
              strokeDasharray="8 4"
              opacity={bothActive ? 0.8 : 0.4}
              filter={bothActive ? 'url(#glow-red)' : undefined}
            />
          )
        })}
      </g>

      <g className="energy-ring-progress">
        {ELEMENTS.map((el) => {
          const pos = nodePositions[el]
          if (!pos) return null
          const node = nodeMap[el]
          const energy = node?.energy ?? 0
          const color = node?.color ?? '#888888'
          const dashOffset = (energy / 100) * CIRCUMFERENCE
          const dashArray = `${dashOffset} ${CIRCUMFERENCE}`
          return (
            <g key={`ring-${el}`}>
              <circle
                cx={pos.x}
                cy={pos.y}
                r={RING_RADIUS}
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth={4}
              />
              <circle
                cx={pos.x}
                cy={pos.y}
                r={RING_RADIUS}
                fill="none"
                stroke={color}
                strokeWidth={4}
                strokeDasharray={dashArray}
                strokeLinecap="round"
                transform={`rotate(-90, ${pos.x}, ${pos.y})`}
              />
            </g>
          )
        })}
      </g>
    </svg>
  )
}

export default React.memo(EnergyCircle)
