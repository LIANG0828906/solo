import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { useStore } from '../store'
import type { Connection, StoryNode } from '../store'
import NodeCard from './NodeCard'

interface CanvasProps {
  containerRef: React.RefObject<HTMLDivElement | null>
}

const NODE_WIDTH = 280
const NODE_HEADER_HEIGHT = 44
const NODE_PADDING = 16
const OPTION_HEIGHT = 34
const OPTION_SPACING = 8

const getOptionPortPosition = (
  node: StoryNode,
  optionIndex: number
): { x: number; y: number } => {
  const headerHeight = NODE_HEADER_HEIGHT
  const descArea = 120
  const optionsLabelHeight = 32
  const baseY = node.y + headerHeight + NODE_PADDING + descArea + NODE_PADDING + optionsLabelHeight

  let accumulatedSpacing = NODE_PADDING
  for (let i = 0; i < optionIndex; i++) {
    accumulatedSpacing += OPTION_HEIGHT + OPTION_SPACING
  }

  return {
    x: node.x + NODE_WIDTH - 12,
    y: baseY + accumulatedSpacing + OPTION_HEIGHT / 2,
  }
}

const getNodeTopCenter = (node: StoryNode): { x: number; y: number } => ({
  x: node.x + NODE_WIDTH / 2,
  y: node.y,
})

const bezierPath = (
  x1: number,
  y1: number,
  x2: number,
  y2: number
): string => {
  const dx = Math.abs(x2 - x1) * 0.5
  const minDx = 60
  const controlOffset = Math.max(dx, minDx)

  let cp1x = x1 + controlOffset
  let cp1y = y1
  let cp2x = x2 - controlOffset
  let cp2y = y2

  if (x2 < x1) {
    cp1x = x1 + controlOffset * 0.5
    cp2x = x2 - controlOffset * 0.5
    cp1y = y1 + 40
    cp2y = y2 - 40
  }

  return `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`
}

const ArrowMarker: React.FC = () => (
  <defs>
    <marker
      id="arrowhead"
      markerWidth="10"
      markerHeight="7"
      refX="9"
      refY="3.5"
      orient="auto"
    >
      <polygon points="0 0, 10 3.5, 0 7" fill="#00ffd5" />
    </marker>
    <marker
      id="arrowhead-hover"
      markerWidth="12"
      markerHeight="9"
      refX="11"
      refY="4.5"
      orient="auto"
    >
      <polygon points="0 0, 12 4.5, 0 9" fill="#ff007f" />
    </marker>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
      <feMerge>
        <feMergeNode in="coloredBlur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <filter id="glow-strong" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="4" result="coloredBlur" />
      <feMerge>
        <feMergeNode in="coloredBlur" />
        <feMergeNode in="coloredBlur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
)

const Canvas: React.FC<CanvasProps> = ({ containerRef }) => {
  const {
    nodes,
    connections,
    panState,
    setPanState,
    selectedNodeId,
    setSelectedNodeId,
    highlightedNodeId,
    connecting,
    deleteConnection,
    persistToIdb,
  } = useStore()

  const internalRef = useRef<HTMLDivElement>(null)
  const svgLayerRef = useRef<SVGSVGElement>(null)
  const isPanning = useRef(false)
  const panStartPos = useRef({ x: 0, y: 0 })
  const panStartState = useRef({ x: 0, y: 0 })
  const [tick, setTick] = useState(0)
  const animFrame = useRef<number | null>(null)
  const [hoveredConnId, setHoveredConnId] = useState<string | null>(null)
  const [viewportSize, setViewportSize] = useState({ w: 4000, h: 3000 })
  const [isViewportReady, setIsViewportReady] = useState(false)

  const actualContainerRef = (containerRef as React.RefObject<HTMLDivElement>) || internalRef

  useEffect(() => {
    const rafLoop = () => {
      setTick((t) => (t + 1) % 1000000)
      animFrame.current = requestAnimationFrame(rafLoop)
    }
    animFrame.current = requestAnimationFrame(rafLoop)
    return () => {
      if (animFrame.current) cancelAnimationFrame(animFrame.current)
    }
  }, [])

  useEffect(() => {
    if (nodes.length > 0) {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
      nodes.forEach((n) => {
        minX = Math.min(minX, n.x)
        minY = Math.min(minY, n.y)
        maxX = Math.max(maxX, n.x + NODE_WIDTH)
        maxY = Math.max(maxY, n.y + 400)
      })
      const padding = 500
      const w = Math.max(maxX - minX + padding * 2, 4000)
      const h = Math.max(maxY - minY + padding * 2, 3000)
      setViewportSize({ w, h })
    }
    setIsViewportReady(true)
  }, [nodes.length])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const rect = actualContainerRef.current?.getBoundingClientRect()
    if (!rect) return

    const delta = -e.deltaY * 0.001
    const newScale = Math.min(2, Math.max(0.2, panState.scale * (1 + delta)))

    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    const worldX = (mouseX / panState.scale) - panState.x
    const worldY = (mouseY / panState.scale) - panState.y

    const newX = (mouseX / newScale) - worldX
    const newY = (mouseY / newScale) - worldY

    setPanState({ scale: newScale, x: newX, y: newY })
  }, [panState, setPanState])

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.node-card')) return
    if ((e.target as HTMLElement).tagName === 'INPUT' ||
        (e.target as HTMLElement).tagName === 'TEXTAREA') return

    e.preventDefault()
    isPanning.current = true
    panStartPos.current = { x: e.clientX, y: e.clientY }
    panStartState.current = { x: panState.x, y: panState.y }
    setSelectedNodeId(null)

    const handleMouseMove = (moveE: MouseEvent) => {
      if (!isPanning.current) return
      const dx = (moveE.clientX - panStartPos.current.x) / panState.scale
      const dy = (moveE.clientY - panStartPos.current.y) / panState.scale
      setPanState({
        x: panStartState.current.x + dx,
        y: panStartState.current.y + dy,
      })
    }

    const handleMouseUp = () => {
      isPanning.current = false
      persistToIdb()
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  const renderConnection = (conn: Connection) => {
    const sourceNode = nodes.find((n) => n.id === conn.sourceNodeId)
    const targetNode = nodes.find((n) => n.id === conn.targetNodeId)
    if (!sourceNode || !targetNode) return null

    const optionIdx = sourceNode.options.findIndex((o) => o.id === conn.sourceOptionId)
    if (optionIdx < 0) return null

    const start = getOptionPortPosition(sourceNode, optionIdx)
    const end = getNodeTopCenter(targetNode)
    const path = bezierPath(start.x, start.y, end.x, end.y)

    const isHovered = hoveredConnId === conn.id

    return (
      <g key={conn.id}>
        <path
          d={path}
          stroke="transparent"
          strokeWidth={18}
          fill="none"
          style={{ cursor: 'pointer' }}
          onMouseEnter={() => setHoveredConnId(conn.id)}
          onMouseLeave={() => setHoveredConnId(null)}
          onClick={(e) => {
            e.stopPropagation()
            if (confirm('删除这条连线？')) {
              deleteConnection(conn.id)
            }
          }}
        />
        <path
          d={path}
          stroke={isHovered ? '#ff007f' : '#00ffd5'}
          strokeWidth={isHovered ? 3 : 2}
          fill="none"
          markerEnd={isHovered ? 'url(#arrowhead-hover)' : 'url(#arrowhead)'}
          filter={isHovered ? 'url(#glow-strong)' : 'url(#glow)'}
          opacity={isHovered ? 1 : 0.8}
          style={{
            pointerEvents: 'none',
            transition: 'stroke 0.2s, stroke-width 0.2s, opacity 0.2s',
          }}
        />
      </g>
    )
  }

  const renderConnectingLine = () => {
    if (!connecting.isConnecting || !connecting.sourceNodeId || !connecting.sourceOptionId) return null

    const sourceNode = nodes.find((n) => n.id === connecting.sourceNodeId)
    if (!sourceNode) return null

    const optionIdx = sourceNode.options.findIndex((o) => o.id === connecting.sourceOptionId)
    if (optionIdx < 0) return null

    const start = getOptionPortPosition(sourceNode, optionIdx)
    const path = bezierPath(start.x, start.y, connecting.mouseX, connecting.mouseY)

    return (
      <path
        d={path}
        stroke="#ff007f"
        strokeWidth={2.5}
        strokeDasharray="8,6"
        fill="none"
        filter="url(#glow-strong)"
        style={{ pointerEvents: 'none', opacity: 0.9 }}
      />
    )
  }

  const nodeMap = useMemo(() => {
    const map = new Map<string, StoryNode>()
    nodes.forEach((n) => map.set(n.id, n))
    return map
  }, [nodes])

  const shouldRenderNode = (node: StoryNode): boolean => {
    if (!actualContainerRef.current) return true
    const rect = actualContainerRef.current.getBoundingClientRect()

    const viewLeft = -panState.x * panState.scale - 500
    const viewRight = viewLeft + rect.width / panState.scale + 500
    const viewTop = -panState.y * panState.scale - 500
    const viewBottom = viewTop + rect.height / panState.scale + 500

    const nodeRight = node.x + NODE_WIDTH
    const nodeBottom = node.y + 400

    return !(nodeRight < viewLeft || node.x > viewRight || nodeBottom < viewTop || node.y > viewBottom)
  }

  return (
    <div
      ref={actualContainerRef}
      className="relative w-full h-full overflow-hidden cursor-grab active:cursor-grabbing"
      style={{
        background: `
          linear-gradient(180deg,
            rgba(26, 26, 46, 1) 0%,
            rgba(22, 33, 62, 0.98) 50%,
            rgba(26, 26, 46, 1) 100%
          )
        `,
        backgroundColor: '#1a1a2e',
      }}
      onWheel={handleWheel}
      onMouseDown={handleCanvasMouseDown}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 20%, rgba(0, 255, 213, 0.03) 0%, transparent 40%),
            radial-gradient(circle at 80% 80%, rgba(255, 0, 127, 0.03) 0%, transparent 40%)
          `,
        }}
      />

      <div
        ref={svgLayerRef}
        className="absolute overflow-hidden"
        style={{
          left: 0,
          top: 0,
          width: '100%',
          height: '100%',
          transform: `translate(${panState.x * panState.scale}px, ${panState.y * panState.scale}px) scale(${panState.scale})`,
          transformOrigin: '0 0',
          transition: isPanning.current ? 'none' : 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <svg
          width={viewportSize.w}
          height={viewportSize.h}
          style={{
            position: 'absolute',
            left: -viewportSize.w / 4,
            top: -viewportSize.h / 4,
            pointerEvents: 'none',
            overflow: 'visible',
          }}
        >
          <defs>
            <pattern
              id="grid-small"
              x={viewportSize.w / 4}
              y={viewportSize.h / 4}
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="rgba(0, 255, 213, 0.04)"
                strokeWidth="1"
              />
            </pattern>
            <pattern
              id="grid-large"
              x={viewportSize.w / 4}
              y={viewportSize.h / 4}
              width="200"
              height="200"
              patternUnits="userSpaceOnUse"
            >
              <rect width="200" height="200" fill="url(#grid-small)" />
              <path
                d="M 200 0 L 0 0 0 200"
                fill="none"
                stroke="rgba(0, 255, 213, 0.08)"
                strokeWidth="1.5"
              />
            </pattern>
          </defs>
          <rect
            x={-viewportSize.w / 4}
            y={-viewportSize.h / 4}
            width={viewportSize.w}
            height={viewportSize.h}
            fill="url(#grid-large)"
          />
        </svg>

        <svg
          width={viewportSize.w}
          height={viewportSize.h}
          style={{
            position: 'absolute',
            left: -viewportSize.w / 4,
            top: -viewportSize.h / 4,
            pointerEvents: 'auto',
            overflow: 'visible',
            zIndex: 5,
          }}
        >
          <ArrowMarker />
          {connections.map(renderConnection)}
          {renderConnectingLine()}
        </svg>

        <div style={{ position: 'relative', zIndex: 10 }}>
          {nodes.map((node) =>
            shouldRenderNode(node) ? (
              <NodeCard
                key={node.id}
                node={node}
                isSelected={selectedNodeId === node.id}
                isHighlighted={highlightedNodeId === node.id}
                containerRef={actualContainerRef}
              />
            ) : null
          )}
        </div>
      </div>

      <div
        className="absolute bottom-4 right-4 z-30 glass-panel rounded-xl p-2 flex items-center gap-1"
        onMouseDown={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
      >
        <button
          onClick={(e) => {
            e.stopPropagation()
            const rect = actualContainerRef.current?.getBoundingClientRect()
            if (!rect) return
            const newScale = Math.min(2, panState.scale * 1.2)
            const worldX = (rect.width / 2 / panState.scale) - panState.x
            const worldY = (rect.height / 2 / panState.scale) - panState.y
            setPanState({
              scale: newScale,
              x: rect.width / 2 / newScale - worldX,
              y: rect.height / 2 / newScale - worldY,
            })
          }}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-lg
                     hover:bg-cyan-400/20 hover:text-cyan-400 transition-all
                     text-gray-400 font-bold"
          style={{ transition: 'all 0.15s' }}
        >
          +
        </button>
        <div
          className="px-3 h-8 flex items-center rounded-lg text-xs font-mono"
          style={{
            minWidth: '56px',
            justifyContent: 'center',
            color: '#00ffd5',
            fontFamily: "'Orbitron', monospace",
          }}
        >
          {Math.round(panState.scale * 100)}%
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            const rect = actualContainerRef.current?.getBoundingClientRect()
            if (!rect) return
            const newScale = Math.max(0.2, panState.scale * 0.8)
            const worldX = (rect.width / 2 / panState.scale) - panState.x
            const worldY = (rect.height / 2 / panState.scale) - panState.y
            setPanState({
              scale: newScale,
              x: rect.width / 2 / newScale - worldX,
              y: rect.height / 2 / newScale - worldY,
            })
          }}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-lg
                     hover:bg-cyan-400/20 hover:text-cyan-400 transition-all
                     text-gray-400 font-bold"
          style={{ transition: 'all 0.15s' }}
        >
          −
        </button>
        <div className="w-px h-5 bg-white/10 mx-1" />
        <button
          onClick={(e) => {
            e.stopPropagation()
            setPanState({ x: 0, y: 0, scale: 1 })
          }}
          className="w-8 h-8 rounded-lg flex items-center justify-center
                     hover:bg-magenta/20 transition-all text-gray-400"
          title="重置视图"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </button>
      </div>

      <div
        className="absolute top-4 right-4 z-30 glass-panel rounded-xl px-4 py-2 flex items-center gap-2"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div
          className="w-2 h-2 rounded-full animate-pulse"
          style={{
            backgroundColor: '#00ffd5',
            boxShadow: '0 0 8px rgba(0, 255, 213, 0.6)',
          }}
        />
        <span
          className="text-[11px] font-bold tracking-wider"
          style={{
            fontFamily: "'Orbitron', sans-serif",
            color: '#00ffd5',
          }}
        >
          {nodes.length} NODES
        </span>
        <div className="w-px h-4 bg-white/10" />
        <span
          className="text-[11px] font-bold tracking-wider"
          style={{
            fontFamily: "'Orbitron', sans-serif",
            color: '#ff007f',
          }}
        >
          {connections.length} CONN
        </span>
      </div>
    </div>
  )
}

export default Canvas
