import {
  useRef,
  useState,
  useCallback,
  useEffect,
  useMemo,
  memo,
} from 'react'
import { useStoryStore, type StoryNode, type Connection } from '../stores/storyStore'
import ContextMenu from './ContextMenu'

const NODE_WIDTH = 220
const NODE_HEIGHT = 160
const CONNECTOR_RADIUS = 6

interface NodeItemProps {
  node: StoryNode
  isSelected: boolean
  isUnconnectedHighlight: boolean
  onNodeMouseDown: (e: React.MouseEvent, node: StoryNode) => void
  onConnectorMouseDown: (e: React.MouseEvent, node: StoryNode) => void
}

const NodeItem = memo(function NodeItem({
  node,
  isSelected,
  isUnconnectedHighlight,
  onNodeMouseDown,
  onConnectorMouseDown,
}: NodeItemProps) {
  return (
    <g
      transform={`translate(${node.x}, ${node.y})`}
      style={{ cursor: 'move' }}
      onMouseDown={(e) => onNodeMouseDown(e, node)}
    >
      <rect
        width={NODE_WIDTH}
        height={NODE_HEIGHT}
        rx="12"
        fill="#1e293b"
        stroke="#334155"
        strokeWidth="2"
        style={{
          filter: 'url(#nodeShadow)',
          transition: 'stroke 0.2s linear, opacity 0.2s linear',
        }}
      />

      <rect
        width={NODE_WIDTH}
        height={NODE_HEIGHT}
        rx="12"
        fill="transparent"
        stroke="#3b82f6"
        strokeWidth="2"
        style={{
          filter: 'url(#glow)',
          opacity: isSelected ? 1 : 0,
          transition: 'opacity 0.2s linear',
          pointerEvents: 'none',
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
        {node.title.length > 15 ? node.title.slice(0, 15) + '...' : node.title}
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
        r={CONNECTOR_RADIUS + 6}
        fill="transparent"
        style={{ cursor: 'crosshair' }}
        onMouseDown={(e) => onConnectorMouseDown(e, node)}
      />
      <circle
        cx={NODE_WIDTH}
        cy={NODE_HEIGHT / 2}
        r={CONNECTOR_RADIUS}
        fill="#3b82f6"
        style={{ pointerEvents: 'none' }}
      />

      {isUnconnectedHighlight && (
        <rect
          width={NODE_WIDTH}
          height={NODE_HEIGHT}
          rx="12"
          fill="transparent"
          stroke="#fbbf24"
          strokeWidth="3"
          style={{
            pointerEvents: 'none',
            animation: 'pulseHighlight 0.5s ease-in-out infinite',
          }}
        />
      )}
    </g>
  )
})

interface ConnectionItemProps {
  id: string
  path: string
  isHovered: boolean
  onEnter: () => void
  onLeave: () => void
}

const ConnectionItem = memo(function ConnectionItem({
  id,
  path,
  isHovered,
  onEnter,
  onLeave,
}: ConnectionItemProps) {
  return (
    <g key={id} onMouseEnter={onEnter} onMouseLeave={onLeave}>
      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth="14"
        style={{ cursor: 'pointer' }}
      />
      <path
        d={path}
        fill="none"
        stroke={isHovered ? '#94a3b8' : '#64748b'}
        strokeWidth={isHovered ? 3 : 2}
        style={{
          transition: 'stroke 0.2s linear, stroke-width 0.2s linear',
          pointerEvents: 'none',
        }}
      />
      <circle r="4" fill="#60a5fa" style={{ pointerEvents: 'none' }}>
        <animateMotion dur="1.5s" repeatCount="indefinite" path={path} />
      </circle>
    </g>
  )
})

export default function Canvas() {
  const svgRef = useRef<SVGSVGElement>(null)
  const rafRef = useRef<number | null>(null)
  const pendingNodeMove = useRef<{ id: string; x: number; y: number } | null>(
    null
  )
  const pendingConnectionEnd = useRef<{ x: number; y: number } | null>(null)

  const {
    selectedNodeId,
    scale,
    panOffset,
    highlightUnconnected,
    selectNode,
    moveNode,
    connectNodes,
    setScale,
    setPanOffset,
    addNode,
  } = useStoryStore()

  const nodes = useStoryStore((s) => s.nodes)
  const connections = useStoryStore((s) => s.connections)

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

  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    canvasX: number
    canvasY: number
  } | null>(null)

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
    if (e.code === 'Space' && !e.repeat) {
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

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const flushPendingMove = useCallback(() => {
    if (pendingNodeMove.current) {
      const { id, x, y } = pendingNodeMove.current
      moveNode(id, x, y)
      pendingNodeMove.current = null
    }
    if (pendingConnectionEnd.current) {
      setConnectionEnd({ ...pendingConnectionEnd.current })
      pendingConnectionEnd.current = null
    }
    rafRef.current = null
  }, [moveNode])

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 2) return

      if (e.button === 1 || (e.button === 0 && spacePressed)) {
        setIsPanning(true)
        setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y })
        e.preventDefault()
      } else if (e.button === 0) {
        const target = e.target as Element
        if (
          target.tagName === 'svg' ||
          target.classList.contains('canvas-bg') ||
          target.tagName === 'rect' && target.getAttribute('fill') === '#0f172a'
        ) {
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
        const targetX = point.x - dragOffset.x
        const targetY = point.y - dragOffset.y
        pendingNodeMove.current = { id: dragNodeId, x: targetX, y: targetY }
        if (!rafRef.current) {
          rafRef.current = requestAnimationFrame(flushPendingMove)
        }
        return
      }

      if (isConnecting && connectionStart) {
        const point = getSvgPoint(e.clientX, e.clientY)
        pendingConnectionEnd.current = { x: point.x, y: point.y }
        if (!rafRef.current) {
          rafRef.current = requestAnimationFrame(flushPendingMove)
        }
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
      isConnecting,
      connectionStart,
      flushPendingMove,
    ]
  )

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
        flushPendingMove()
      }

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
    [
      isPanning,
      isDraggingNode,
      isConnecting,
      connectionStart,
      nodes,
      connectNodes,
      getSvgPoint,
      flushPendingMove,
    ]
  )

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault()
      const delta = e.deltaY > 0 ? 0.92 : 1.08
      const newScale = Math.max(0.5, Math.min(2, scale * delta))

      if (svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect()
        const mouseX = e.clientX - rect.left
        const mouseY = e.clientY - rect.top

        const ratio = newScale / scale
        const newOffsetX = mouseX - (mouseX - panOffset.x) * ratio
        const newOffsetY = mouseY - (mouseY - panOffset.y) * ratio

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
      if (e.button !== 0) return
      e.stopPropagation()
      const startX = node.x + NODE_WIDTH
      const startY = node.y + NODE_HEIGHT / 2
      setIsConnecting(true)
      setConnectionStart({
        nodeId: node.id,
        x: startX,
        y: startY,
      })
      setConnectionEnd({ x: startX, y: startY })
      pendingConnectionEnd.current = { x: startX, y: startY }
    },
    []
  )

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      const point = getSvgPoint(e.clientX, e.clientY)
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        canvasX: point.x,
        canvasY: point.y,
      })
    },
    [getSvgPoint]
  )

  const connectionPaths = useMemo(() => {
    const result: {
      id: string
      path: string
      midX: number
      midY: number
      label: string
    }[] = []
    const nodesMap = new Map(nodes.map((n) => [n.id, n]))
    for (const conn of connections) {
      const fromNode = nodesMap.get(conn.fromNodeId)
      const toNode = nodesMap.get(conn.toNodeId)
      if (!fromNode || !toNode) continue

      const x1 = fromNode.x + NODE_WIDTH
      const y1 = fromNode.y + NODE_HEIGHT / 2
      const x2 = toNode.x
      const y2 = toNode.y + NODE_HEIGHT / 2

      const dx = x2 - x1
      const controlOffset = Math.min(80, Math.max(50, Math.abs(dx) * 0.4))
      const cx1 = x1 + controlOffset
      const cy1 = y1
      const cx2 = x2 - controlOffset
      const cy2 = y2

      const path = `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`
      const midX = (x1 + x2) / 2
      const midY = (y1 + y2) / 2

      result.push({ id: conn.id, path, midX, midY, label: conn.label })
    }
    return result
  }, [connections, nodes])

  const unconnectedNodeIds = useMemo(() => {
    const connectedIds = new Set<string>()
    for (const c of connections) {
      connectedIds.add(c.fromNodeId)
      connectedIds.add(c.toNodeId)
    }
    connectedIds.add('start')
    const ids: string[] = []
    for (const n of nodes) {
      if (!connectedIds.has(n.id)) ids.push(n.id)
    }
    return ids
  }, [nodes, connections])

  const tempConnectionPath = useMemo(() => {
    if (!connectionStart) return ''
    const x1 = connectionStart.x
    const y1 = connectionStart.y
    const x2 = connectionEnd.x
    const y2 = connectionEnd.y
    const dx = x2 - x1
    const controlOffset = Math.min(80, Math.max(30, Math.abs(dx) * 0.4 + 30))
    const cx1 = x1 + controlOffset
    const cy1 = y1
    const cx2 = x2 - controlOffset
    const cy2 = y2
    return `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`
  }, [connectionStart, connectionEnd.x, connectionEnd.y])

  const worldTransform = `translate(${panOffset.x} ${panOffset.y}) scale(${scale})`

  return (
    <>
      <svg
        ref={svgRef}
        className="canvas-bg"
        style={{
          width: '100%',
          height: '100%',
          cursor: isPanning
            ? 'grabbing'
            : spacePressed
            ? 'grab'
            : isConnecting
            ? 'crosshair'
            : 'default',
          userSelect: 'none',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onContextMenu={handleContextMenu}
      >
        <defs>
          <filter id="glow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="5" result="coloredBlur" />
            <feFlood floodColor="#3b82f6" floodOpacity="0.6" result="glowColor" />
            <feComposite
              in="glowColor"
              in2="coloredBlur"
              operator="in"
              result="softGlow"
            />
            <feMerge>
              <feMergeNode in="softGlow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter
            id="nodeShadow"
            x="-40%"
            y="-40%"
            width="180%"
            height="180%"
          >
            <feDropShadow dx="4" dy="4" stdDeviation="12" floodOpacity="0.3" />
          </filter>
        </defs>

        <rect
          width="100%"
          height="100%"
          fill="#0f172a"
          style={{ pointerEvents: 'none' }}
        />

        <g transform={worldTransform}>
          <g>
            {connectionPaths.map((conn) => (
              <ConnectionItem
                key={conn.id}
                id={conn.id}
                path={conn.path}
                isHovered={hoveredConnection === conn.id}
                onEnter={() => setHoveredConnection(conn.id)}
                onLeave={() => setHoveredConnection(null)}
              />
            ))}
          </g>

          <g>
            {nodes.map((node) => (
              <NodeItem
                key={node.id}
                node={node}
                isSelected={selectedNodeId === node.id}
                isUnconnectedHighlight={
                  highlightUnconnected && unconnectedNodeIds.includes(node.id)
                }
                onNodeMouseDown={handleNodeMouseDown}
                onConnectorMouseDown={handleConnectorMouseDown}
              />
            ))}
          </g>

          {isConnecting && connectionStart && tempConnectionPath && (
            <g>
              <path
                d={tempConnectionPath}
                fill="none"
                stroke="rgba(59, 130, 246, 0.2)"
                strokeWidth="10"
                style={{ pointerEvents: 'none' }}
              />
              <path
                d={tempConnectionPath}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2.5"
                strokeDasharray="8,6"
                style={{
                  pointerEvents: 'none',
                  animation: 'dashMove 0.6s linear infinite',
                }}
              />
              <circle
                cx={connectionEnd.x}
                cy={connectionEnd.y}
                r="8"
                fill="#3b82f6"
                fillOpacity="0.3"
                stroke="#3b82f6"
                strokeWidth="2"
                style={{ pointerEvents: 'none' }}
              />
              <circle
                cx={connectionStart.x}
                cy={connectionStart.y}
                r="6"
                fill="#3b82f6"
                style={{ pointerEvents: 'none' }}
              />
            </g>
          )}
        </g>
      </svg>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onAddNode={() =>
            addNode(contextMenu.canvasX - 110, contextMenu.canvasY - 80)
          }
          onClose={() => setContextMenu(null)}
        />
      )}

      <style>{`
        @keyframes pulseHighlight {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes dashMove {
          to { stroke-dashoffset: -28; }
        }
      `}</style>
    </>
  )
}
