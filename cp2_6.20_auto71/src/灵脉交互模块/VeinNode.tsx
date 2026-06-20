import React, { useState, useCallback, useEffect, useRef } from 'react'
import { type ElementType, isSheng, isKe, SHENG_MAP, KE_MAP } from '@/utils/elementEngine'
import { type VeinNodeState, activateVeinNode } from '@/utils/api'

const ELEMENT_CONFIG: Record<ElementType, { label: string; symbol: string; color: string }> = {
  metal: { label: '金', symbol: '⚙', color: '#ffd700' },
  wood: { label: '木', symbol: '🌱', color: '#4ade80' },
  water: { label: '水', symbol: '🌊', color: '#3b82f6' },
  fire: { label: '火', symbol: '🔥', color: '#ef4444' },
  earth: { label: '土', symbol: '⛰', color: '#a16207' },
}

const ENERGY_RING_RADIUS = 40
const CIRCUMFERENCE = 2 * Math.PI * ENERGY_RING_RADIUS
const CLICK_ENERGY = 10
const SHENG_ENERGY = 5
const KE_ENERGY = -5
const MAX_ENERGY = 100
const MIN_ENERGY = 0

interface VeinNodeProps {
  nodes: VeinNodeState[]
  onNodesChange: (nodes: VeinNodeState[]) => void
  onResonation: (result: any) => void
  centerX: number
  centerY: number
  radius: number
}

interface NodeVisualState {
  isPulsing: boolean
  isShengHighlight: boolean
  isKeWarning: boolean
  rippleKey: number
}

function getNodePosition(index: number, centerX: number, centerY: number, radius: number) {
  const angle = (index * 72 - 90) * (Math.PI / 180)
  return {
    x: centerX + Math.cos(angle) * radius,
    y: centerY + Math.sin(angle) * radius,
  }
}

function getShengTargets(element: ElementType): ElementType {
  return SHENG_MAP[element]
}

function getKeTargets(element: ElementType): ElementType {
  return KE_MAP[element]
}

const VeinNode = React.memo(function VeinNode({
  nodes,
  onNodesChange,
  onResonation,
  centerX,
  centerY,
  radius,
}: VeinNodeProps) {
  const [visualStates, setVisualStates] = useState<Record<string, NodeVisualState>>({})
  const [resonationBurst, setResonationBurst] = useState(false)
  const activationOrderRef = useRef<ElementType[]>([])
  const animFrameRef = useRef<number>(0)
  const rippleIdRef = useRef(0)

  const elements: ElementType[] = ['metal', 'wood', 'water', 'fire', 'earth']

  const nodeMap = nodes.reduce((acc, node) => {
    acc[node.id] = node
    return acc
  }, {} as Record<string, VeinNodeState>)

  const nodePositions = elements.reduce((acc, el, index) => {
    acc[el] = getNodePosition(index, centerX, centerY, radius)
    return acc
  }, {} as Record<ElementType, { x: number; y: number }>)

  const triggerShengHighlight = useCallback((targetId: string) => {
    setVisualStates((prev) => ({
      ...prev,
      [targetId]: {
        ...prev[targetId],
        isShengHighlight: true,
      },
    }))
    setTimeout(() => {
      setVisualStates((prev) => ({
        ...prev,
        [targetId]: {
          ...prev[targetId],
          isShengHighlight: false,
        },
      }))
    }, 1000)
  }, [])

  const triggerKeWarning = useCallback((targetId: string) => {
    setVisualStates((prev) => ({
      ...prev,
      [targetId]: {
        ...prev[targetId],
        isKeWarning: true,
      },
    }))
    setTimeout(() => {
      setVisualStates((prev) => ({
        ...prev,
        [targetId]: {
          ...prev[targetId],
          isKeWarning: false,
        },
      }))
    }, 1000)
  }, [])

  const triggerPulse = useCallback((nodeId: string) => {
    rippleIdRef.current += 1
    setVisualStates((prev) => ({
      ...prev,
      [nodeId]: {
        ...prev[nodeId],
        isPulsing: true,
        rippleKey: rippleIdRef.current,
      },
    }))
    setTimeout(() => {
      setVisualStates((prev) => ({
        ...prev,
        [nodeId]: {
          ...prev[nodeId],
          isPulsing: false,
        },
      }))
    }, 600)
  }, [])

  const detectResonation = useCallback(
    (activatedElement: ElementType) => {
      activationOrderRef.current.push(activatedElement)

      const order = activationOrderRef.current
      let chainLength = 1

      for (let i = order.length - 1; i > 0; i--) {
        if (isSheng(order[i - 1], order[i])) {
          chainLength++
        } else {
          break
        }
      }

      if (chainLength >= 3) {
        const burstNodes = order.slice(order.length - chainLength)
        const result = {
          chainLength,
          isBurst: chainLength >= 5,
          burstNodes,
          totalEnergyOutput: chainLength * 20,
          boostPercent: chainLength * 5,
        }

        setResonationBurst(true)
        onResonation(result)

        setTimeout(() => setResonationBurst(false), 2000)
      }

      if (activationOrderRef.current.length > 10) {
        activationOrderRef.current = activationOrderRef.current.slice(-5)
      }
    },
    [onResonation],
  )

  const handleNodeClick = useCallback(
    async (nodeId: ElementType) => {
      const clickedNode = nodeMap[nodeId]
      if (!clickedNode) return

      triggerPulse(nodeId)
      detectResonation(nodeId)

      const shengTarget = getShengTargets(nodeId)
      const keTarget = getKeTargets(nodeId)

      const updatedNodes = nodes.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            energy: Math.min(MAX_ENERGY, node.energy + CLICK_ENERGY),
            isActive: true,
          }
        }
        if (node.id === shengTarget) {
          triggerShengHighlight(node.id)
          return {
            ...node,
            energy: Math.min(MAX_ENERGY, node.energy + SHENG_ENERGY),
          }
        }
        if (node.id === keTarget) {
          triggerKeWarning(node.id)
          return {
            ...node,
            energy: Math.max(MIN_ENERGY, node.energy + KE_ENERGY),
          }
        }
        return node
      })

      onNodesChange(updatedNodes)

      try {
        await activateVeinNode(nodeId, updatedNodes)
      } catch {
        // Silent fail - already updated locally
      }
    },
    [nodes, nodeMap, triggerPulse, triggerShengHighlight, triggerKeWarning, detectResonation, onNodesChange],
  )

  useEffect(() => {
    let running = true

    const animate = () => {
      if (!running) return
      animFrameRef.current = requestAnimationFrame(animate)
    }

    animFrameRef.current = requestAnimationFrame(animate)

    return () => {
      running = false
      cancelAnimationFrame(animFrameRef.current)
    }
  }, [])

  const svgSize = radius * 2 + 120
  const svgCenter = svgSize / 2
  const offsetX = svgCenter - centerX
  const offsetY = svgCenter - centerY

  return (
    <div
      style={{
        position: 'relative',
        width: svgSize,
        height: svgSize,
        userSelect: 'none',
      }}
    >
      {resonationBurst && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 20,
            fontSize: 28,
            fontWeight: 900,
            color: '#ffd700',
            textShadow: '0 0 20px #ffd700, 0 0 40px #ff8800',
            animation: 'burstText 2s ease-out forwards',
            pointerEvents: 'none',
          }}
        >
          共振共鸣！
        </div>
      )}

      <svg
        width={svgSize}
        height={svgSize}
        style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
      >
        <defs>
          <filter id="glow-green-vein" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="glow-red-vein" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {elements.map((fromEl) => {
          const shengTo = SHENG_MAP[fromEl]
          const fromPos = nodePositions[fromEl]
          const toPos = nodePositions[shengTo]
          const fromNode = nodeMap[fromEl]
          const toNode = nodeMap[shengTo]
          const bothActive = fromNode?.isActive && toNode?.isActive

          return (
            <line
              key={`sheng-line-${fromEl}`}
              x1={fromPos.x + offsetX}
              y1={fromPos.y + offsetY}
              x2={toPos.x + offsetX}
              y2={toPos.y + offsetY}
              stroke="#22c55e"
              strokeWidth={2}
              opacity={bothActive ? 0.8 : 0.3}
              filter={bothActive ? 'url(#glow-green-vein)' : undefined}
            />
          )
        })}

        {elements.map((el) => {
          const pos = nodePositions[el]
          const node = nodeMap[el]
          const energy = node?.energy ?? 0
          const color = ELEMENT_CONFIG[el].color
          const dashOffset = (energy / 100) * CIRCUMFERENCE
          const dashArray = `${dashOffset} ${CIRCUMFERENCE}`
          const visualState = visualStates[el]
          const isShengGlow = visualState?.isShengHighlight || node?.isActive

          return (
            <g key={`ring-${el}`}>
              <circle
                cx={pos.x + offsetX}
                cy={pos.y + offsetY}
                r={ENERGY_RING_RADIUS}
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth={4}
              />
              <circle
                cx={pos.x + offsetX}
                cy={pos.y + offsetY}
                r={ENERGY_RING_RADIUS}
                fill="none"
                stroke={isShengGlow ? '#22c55e' : color}
                strokeWidth={4}
                strokeDasharray={dashArray}
                strokeLinecap="round"
                transform={`rotate(-90, ${pos.x + offsetX}, ${pos.y + offsetY})`}
                style={{
                  transition: 'stroke 0.3s ease',
                  filter: isShengGlow ? 'url(#glow-green-vein)' : undefined,
                  willChange: 'stroke-dasharray',
                }}
              />
            </g>
          )
        })}
      </svg>

      {elements.map((el, index) => {
        const pos = nodePositions[el]
        const node = nodeMap[el]
        const config = ELEMENT_CONFIG[el]
        const visualState = visualStates[el]
        const isPulsing = visualState?.isPulsing
        const isShengHighlight = visualState?.isShengHighlight
        const isKeWarning = visualState?.isKeWarning
        const rippleKey = visualState?.rippleKey ?? 0

        return (
          <div
            key={el}
            onClick={() => handleNodeClick(el)}
            style={{
              position: 'absolute',
              left: pos.x + offsetX - 35,
              top: pos.y + offsetY - 35,
              width: 70,
              height: 70,
              borderRadius: '50%',
              background: `radial-gradient(circle at 35% 35%, ${config.color}dd, ${config.color}66)`,
              border: `3px solid ${config.color}`,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              willChange: 'transform',
              transform: isPulsing ? 'scale(1)' : 'scale(1)',
              animation: isPulsing ? 'pulseScale 0.6s ease-out' : 'none',
              boxShadow: isShengHighlight
                ? `0 0 25px #22c55e, 0 0 50px #22c55e66, inset 0 0 20px #22c55e44`
                : `0 0 12px ${config.color}88`,
              transition: 'box-shadow 0.3s ease',
              zIndex: 10,
            }}
          >
            {rippleKey > 0 && (
              <div
                key={rippleKey}
                style={{
                  position: 'absolute',
                  inset: -5,
                  borderRadius: '50%',
                  border: `2px solid ${config.color}`,
                  animation: 'rippleExpand 0.6s ease-out forwards',
                  willChange: 'transform, opacity',
                  pointerEvents: 'none',
                }}
              />
            )}

            {isKeWarning && (
              <div
                style={{
                  position: 'absolute',
                  inset: -8,
                  borderRadius: '50%',
                  border: '2px dashed #ef4444',
                  animation: 'keWarningPulse 0.5s ease-in-out infinite',
                  willChange: 'opacity, transform',
                  pointerEvents: 'none',
                }}
              />
            )}

            <span
              style={{
                fontSize: 20,
                lineHeight: 1,
              }}
            >
              {config.symbol}
            </span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: '#fff',
                textShadow: '0 1px 2px rgba(0,0,0,0.6)',
                marginTop: 2,
              }}
            >
              {config.label}
            </span>
            <span
              style={{
                fontSize: 10,
                color: '#fff',
                opacity: 0.9,
                marginTop: 1,
              }}
            >
              {node?.energy ?? 0}
            </span>
          </div>
        )
      })}

      <style>{`
        @keyframes pulseScale {
          0% { transform: scale(1); }
          30% { transform: scale(0.95); }
          60% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }
        @keyframes rippleExpand {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        @keyframes keWarningPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.05); }
        }
        @keyframes burstText {
          0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
          30% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
          70% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
        }
      `}</style>
    </div>
  )
})

export default VeinNode
