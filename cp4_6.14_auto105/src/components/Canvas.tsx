import { useRef, useState, useCallback, useEffect, useMemo } from 'react'
import { useStoryStore, type StoryNode, type Connection } from '../stores/storyStore'

const NODE_WIDTH = 220
const NODE_HEIGHT = 160
const CONNECTOR_RADIUS = 6

interface CanvasProps {
  onContextMenu: (e: React.MouseEvent) => void
}

export default function Canvas({ onContextMenu }: CanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const {
    nodes,
    connections,
    selectedNodeId,
    scale,
    panOffset,
    highlightUnconnected,
    selectNode,
    moveNode,
    connectNodes,
    setScale,
    setPanOffset,
  } = useStoryStore()

  const [isDraggingNode, setIsDraggingNode] = useState(false)
  const [dragNodeId, setDragNodeId] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [spacePressed, setSpacePressed] = useState(false)

  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionStart, setConnectionStart] = useState<{
    nodeId: string
    x: number
    y: number
  } | null>(null)
  const [connectionEnd, setConnectionEnd] = useState({ x: 0, y: 0 })

  const [hoveredConnection, setHoveredConnection] = useState<string | null>(null)

  const getSvgPoint = useCallback(
    (clientX: number, clientY: number) => {
      if (!svgRef.current) return { x: 0, y: 0 }
      const rect = svgRef.current.getBoundingClientRect()
      const x = (clientX - rect.left - panOffset.x) / scale
      const y = (clientY - rect.top - panOffset.y) / scale
      return { x, y }
    },
    [panOffset, scale]
  )

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.code === 'Space') {
      setSpacePressed(true)
    }
  }, [])

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (e.code === 'Space') {
      setSpacePressed(false)
      setIsPanning(false)
    }
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [handleKeyDown, handleKeyUp])

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 1 || (e.button === 0 && spacePressed)) {
        setIsPanning(true)
        setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y })
        e.preventDefault()
      } else if (e.button === 0) {
        const target = e.target as HTMLElement
        if (target.tagName === 'svg' || target.classList.contains('canvas-bg')) {
          selectNode(null)
        }
      }
    },
    [spacePressed, panOffset, selectNode]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning) {
        setPanOffset(e.clientX - panStart.x, e.clientY - panStart.y)
        return
      }

      if (isDraggingNode && dragNodeId) {
        const point = getSvgPoint(e.clientX, e.clientY)
        moveNode(dragNodeId, point.x - dragOffset.x, point.y - dragOffset.y)
        return
      }

      if (isConnecting && connectionStart) {
        const point = getSvgPoint(e.clientX, e.clientY)
        setConnectionEnd(point)
      }
    },
    [
      isPanning,
      panStart,
      setPanOffset,
      isDraggingNode,
      dragNodeId,
      dragOffset,
      getSvgPoint,
      moveNode,
      isConnecting,
      connectionStart,
    ]
  )

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning) {
        setIsPanning(false)
        return
      }

      if (isDraggingNode) {
        setIsDraggingNode(false)
        setDragNodeId(null)
        useStoryStore.getState().pushHistory()
        return
      }

      if (isConnecting && connectionStart) {
        const point = getSvgPoint(e.clientX, e.clientY)
        const targetNode = nodes.find((n) => {
          return (
            point.x >= n.x &&
            point.x <= n.x + NODE_WIDTH &&
            point.y >= n.y &&
            point.y <= n.y + NODE_HEIGHT
          )
        })
        if (targetNode && targetNode.id !== connectionStart.nodeId) {
          connectNodes(connectionStart.nodeId, targetNode.id)
        }
        setIsConnecting(false)
        setConnectionStart(null)
      }
    },
    [isPanning, isDraggingNode, isConnecting, connectionStart, nodes, connectNodes, getSvgPoint]
  )

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault()
      const delta = e.deltaY > 0 ? 0.9 : 1.1
      const newScale = Math.max(0.5, Math.min(2, scale * delta))

      if (svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect()
        const mouseX = e.clientX - rect.left
        const mouseY = e.clientY - rect.top

        const newOffsetX = mouseX - (mouseX - panOffset.x) * (newScale / scale)
        const newOffsetY = mouseY - (mouseY - panOffset.y) * (newScale / scale)

        setScale(newScale)
        setPanOffset(newOffsetX, newOffsetY)
      }
    },
    [scale, panOffset, setScale, setPanOffset]
  )

  const handleNodeMouseDown = useCallback(
    (e: React.MouseEvent, node: StoryNode) => {
      if (e.button !== 0) return
      e.stopPropagation()
      const point = getSvgPoint(e.clientX, e.clientY)
      setDragOffset({ x: point.x - node.x, y: point.y - node.y })
      setDragNodeId(node.id)
      setIsDraggingNode(true)
      selectNode(node.id)
    },
    [getSvgPoint, selectNode]
  )

  const handleConnectorMouseDown = useCallback(
    (e: React.MouseEvent, node: StoryNode) => {
      e.stopPropagation()
      setIsConnecting(true)
      setConnectionStart({
        nodeId: node.id,
        x: node.x + NODE_WIDTH,
        y: node.y + NODE_HEIGHT / 2,
      })
      setConnectionEnd({
        x: node.x + NODE_WIDTH,
        y: node.y + NODE_HEIGHT / 2,
      })
    },
    []
  )

  const connectionPaths = useMemo(() => {
    return connections.map((conn) => {
      const fromNode = nodes.find((n) => n.id === conn.fromNodeId)
      const toNode = nodes.find((n) => n.id === conn.toNodeId)
      if (!fromNode || !toNode) return null

      const x1 = fromNode.x + NODE_WIDTH
      const y1 = fromNode.y + NODE_HEIGHT / 2
      const x2 = toNode.x
      const y2 = toNode.y + NODE_HEIGHT / 2

      const controlOffset = Math.min(
        50,
        Math.abs(x2 - x1) / 2
      )
      const cx1 = x1 + controlOffset
      const cy1 = y1
      const cx2 = x2 - controlOffset
      const cy2 = y2

      const path = `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`
      const midX = (x1 + x2) / 2
      const midY = (y1 + y2) / 2

      return { id: conn.id, path, midX, midY, label: conn.label }
    }).filter(Boolean) as {
      id: string
      path: string
      midX: number
      midY: number
      label: string
    }[]
  }, [connections, nodes])

  const unconnectedNodeIds = useMemo(() => {
    const connectedIds = new Set<string>()
    connections.forEach((c) => {
      connectedIds.add(c.fromNodeId)
      connectedIds.add(c.toNodeId)
    })
    connectedIds.add('start')
    return nodes.filter((n) => !connectedIds.has(n.id)).map((n) => n.id)
  }, [nodes, connections])

  const tempConnectionPath = useMemo(() => {
    if (!connectionStart) return ''
    const x1 = connectionStart.x
    const y1 = connectionStart.y
    const x2 = connectionEnd.x
    const y2 = connectionEnd.y
    const controlOffset = 50
    const cx1 = x1 + controlOffset
    const cy1 = y1
    const cx2 = x2 - controlOffset
    const cy2 = y2
    return `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`
  }, [connectionStart, connectionEnd])

  return (
    <svg
      ref={svgRef}
      className="canvas-bg"
      style={{
        width: '100%',
        height: '100%',
        cursor: spacePressed || isPanning ? 'grabbing' : 'default',
        userSelect: 'none',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onContextMenu={onContextMenu}
    >
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="nodeShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="4" dy="4" stdDeviation="12" floodOpacity="0.3" />
        </filter>
      </defs>

      <g
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${scale})`,
          transformOrigin: '0 0',
        }}
      >
        <g>
          {connectionPaths.map((conn) => (
            <g key={conn.id}>
              <path
                d={conn.path}
                fill="none"
                stroke={hoveredConnection === conn.id ? '#94a3b8' : '#64748b'}
                strokeWidth={hoveredConnection === conn.id ? 3 : 2}
                style={{
                  transition: 'stroke 0.2s, stroke-width 0.2s',
                  cursor: 'pointer',
                }}
                onMouseEnter={() => setHoveredConnection(conn.id)}
                onMouseLeave={() => setHoveredConnection(null)}
              />
              <circle r="4" fill="#60a5fa">
                <animateMotion
                  dur="1.5s"
                  repeatCount="indefinite"
                  path={conn.path}
                />
              </circle>
            </g>
          ))}
        </g>

        {isConnecting && tempConnectionPath && (
          <path
            d={tempConnectionPath}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            strokeDasharray="6,4"
            opacity="0.8"
          />
        )}

        <g>
          {nodes.map((node) => {
            const isSelected = selectedNodeId === node.id
            const isUnconnectedHighlight =
              highlightUnconnected && unconnectedNodeIds.includes(node.id)

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                style={{ cursor: 'move' }}
                onMouseDown={(e) => handleNodeMouseDown(e, node)}
              >
                <rect
                  width={NODE_WIDTH}
                  height={NODE_HEIGHT}
                  rx="12"
                  fill="#1e293b"
                  stroke={isSelected ? '#3b82f6' : '#334155'}
                  strokeWidth="2"
                  filter={isSelected ? 'url(#glow)' : 'url(#nodeShadow)'}
                  style={{
                    transition: 'stroke 0.2s, filter 0.2s',
                    animation: isUnconnectedHighlight
                      ? 'pulse 0.5s ease-in-out infinite'
                      : 'none',
                  }}
                />

                <text
                  x="16"
                  y="32"
                  fill="#e2e8f0"
                  fontSize="14"
                  fontWeight="600"
                  style={{ pointerEvents: 'none' }}
                >
                  {node.title.length > 15
                    ? node.title.slice(0, 15) + '...'
                    : node.title}
                </text>

                <text
                  x="16"
                  y="56"
                  fill="#94a3b8"
                  fontSize="12"
                  style={{ pointerEvents: 'none' }}
                >
                  {node.id === 'start' ? '[起始节点]' : `ID: ${node.id.slice(0, 8)}`}
                </text>

                <foreignObject
                  x="16"
                  y="72"
                  width={NODE_WIDTH - 32}
                  height={NODE_HEIGHT - 92}
                  style={{ pointerEvents: 'none' }}
                >
                  <div
                    style={{
                      color: '#94a3b8',
                      fontSize: '12px',
                      lineHeight: '1.5',
                      wordBreak: 'break-word',
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {node.text || '(暂无内容)'}
                  </div>
                </foreignObject>

                <circle
                  cx={NODE_WIDTH}
                  cy={NODE_HEIGHT / 2}
                  r={CONNECTOR_RADIUS + 4}
                  fill="transparent"
                  style={{ cursor: 'crosshair' }}
                  onMouseDown={(e) => handleConnectorMouseDown(e, node)}
                />
                <circle
                  cx={NODE_WIDTH}
                  cy={NODE_HEIGHT / 2}
                  r={CONNECTOR_RADIUS}
                  fill="#3b82f6"
                  style={{ pointerEvents: 'none' }}
                />
              </g>
            )
          })}
        </g>
      </g>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </svg>
  )
}
