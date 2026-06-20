import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { useStore } from '../store'
import type { Connection, StoryNode } from '../store'
import NodeCard from './NodeCard'

interface CanvasProps {
  containerRef: React.RefObject<HTMLDivElement | null>
}

const NODE_WIDTH = 260
const NODE_HEADER_HEIGHT = 44
const NODE_DESC_HEIGHT = 96
const NODE_PADDING = 12
const OPTION_LABEL_HEIGHT = 24
const OPTION_HEIGHT = 30
const OPTION_SPACING = 8

const getOptionPortPosition = (
  node: StoryNode,
  optionIndex: number
): { x: number; y: number } => {
  let accumulatedY = NODE_HEADER_HEIGHT + NODE_PADDING + NODE_DESC_HEIGHT + NODE_PADDING + OPTION_LABEL_HEIGHT + 10
  for (let i = 0; i < optionIndex; i++) {
    accumulatedY += OPTION_HEIGHT + OPTION_SPACING
  }
  return {
    x: node.x + NODE_WIDTH - 21,
    y: node.y + accumulatedY + OPTION_HEIGHT / 2,
  }
}

const getNodeTopCenter = (node: StoryNode): { x: number; y: number } => ({
  x: node.x + NODE_WIDTH / 2,
  y: node.y + 16,
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

  const cp1x = x1 + controlOffset
  const cp1y = y1
  const cp2x = x2 - controlOffset
  const cp2y = y2

  if (x2 < x1 - 50) {
    const midY = (y1 + y2) / 2
    return `M ${x1} ${y1} C ${x1 + 50} ${y1}, ${x1 + 100} ${midY - 30}, ${x1 + 150} ${midY} C ${x2 - 150} ${midY}, ${x2 - 100} ${midY + 30}, ${x2 - 50} ${y2}, ${x2} ${y2}`
  }

  return `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`
}

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
  const isPanning = useRef(false)
  const panStartPos = useRef({ x: 0, y: 0 })
  const panStartState = useRef({ x: 0, y: 0 })
  const [hoveredConnId, setHoveredConnId] = useState<string | null>(null)
  const [viewportSize] = useState({ w: 6000, h: 4500 })

  const actualContainerRef = (containerRef as React.RefObject<HTMLDivElement>) || internalRef

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault()
      const rect = actualContainerRef.current?.getBoundingClientRect()
      if (!rect) return

      const delta = -e.deltaY * 0.0015
      const newScale = Math.min(2, Math.max(0.2, panState.scale * (1 + delta)))

      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      const worldX = mouseX / panState.scale - panState.x
      const worldY = mouseY / panState.scale - panState.y

      const newX = mouseX / newScale - worldX
      const newY = mouseY / newScale - worldY

      setPanState({ scale: newScale, x: newX, y: newY })
    },
    [panState, setPanState, actualContainerRef]
  )

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.closest('.node-card')) return
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
    if (target.closest('.zoom-controls') || target.closest('.stats-bar')) return

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
          strokeWidth={20}
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

  const shouldRenderNode = (node: StoryNode): boolean => {
    return true
  }

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation()
    const rect = actualContainerRef.current?.getBoundingClientRect()
    if (!rect) return
    const newScale = Math.min(2, panState.scale * 1.2)
    const worldX = rect.width / 2 / panState.scale - panState.x
    const worldY = rect.height / 2 / panState.scale - panState.y
    setPanState({
      scale: newScale,
      x: rect.width / 2 / newScale - worldX,
      y: rect.height / 2 / newScale - worldY,
    })
  }

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation()
    const rect = actualContainerRef.current?.getBoundingClientRect()
    if (!rect) return
    const newScale = Math.max(0.2, panState.scale * 0.8)
    const worldX = rect.width / 2 / panState.scale - panState.x
    const worldY = rect.height / 2 / panState.scale - panState.y
    setPanState({
      scale: newScale,
      x: rect.width / 2 / newScale - worldX,
      y: rect.height / 2 / newScale - worldY,
    })
  }

  const handleResetView = (e: React.MouseEvent) => {
    e.stopPropagation()
    setPanState({ x: 0, y: 0, scale: 1 })
  }

  const safeConnections = Array.isArray(connections) ? connections : []

  return (
    <div
      ref={actualContainerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        cursor: isPanning.current ? 'grabbing' : 'grab',
        backgroundColor: '#1a1a2e',
        backgroundImage: `
          radial-gradient(circle at 20% 20%, rgba(0, 255, 213, 0.03) 0%, transparent 40%),
          radial-gradient(circle at 80% 80%, rgba(255, 0, 127, 0.03) 0%, transparent 40%)
        `,
      }}
      onWheel={handleWheel}
      onMouseDown={handleCanvasMouseDown}
    >
      <div
        style={{
          position: 'absolute',
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
            left: -viewportSize.w / 3,
            top: -viewportSize.h / 3,
            pointerEvents: 'none',
          }}
        >
          <defs>
            <pattern
              id="grid-small"
              x={viewportSize.w / 3}
              y={viewportSize.h / 3}
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
              x={viewportSize.w / 3}
              y={viewportSize.h / 3}
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
            x={-viewportSize.w / 3}
            y={-viewportSize.h / 3}
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
            left: -viewportSize.w / 3,
            top: -viewportSize.h / 3,
            pointerEvents: 'auto',
            overflow: 'visible',
            zIndex: 5,
          }}
        >
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
          {safeConnections.map(renderConnection)}
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
        className="zoom-controls"
        style={{
          position: 'absolute',
          bottom: 16,
          right: 16,
          zIndex: 30,
          background: 'rgba(26, 26, 46, 0.7)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12,
          padding: 6,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleZoomIn}
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            border: 'none',
            background: 'transparent',
            color: '#9ca3af',
            cursor: 'pointer',
            fontSize: 18,
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(0, 255, 213, 0.15)'
            e.currentTarget.style.color = '#00ffd5'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = '#9ca3af'
          }}
        >
          +
        </button>
        <div
          style={{
            padding: '0 10px',
            height: 32,
            display: 'flex',
            alignItems: 'center',
            borderRadius: 8,
            fontSize: 11,
            fontFamily: "'Orbitron', monospace",
            color: '#00ffd5',
            minWidth: 52,
            justifyContent: 'center',
          }}
        >
          {Math.round(panState.scale * 100)}%
        </div>
        <button
          onClick={handleZoomOut}
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            border: 'none',
            background: 'transparent',
            color: '#9ca3af',
            cursor: 'pointer',
            fontSize: 20,
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(0, 255, 213, 0.15)'
            e.currentTarget.style.color = '#00ffd5'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = '#9ca3af'
          }}
        >
          −
        </button>
        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)', margin: '0 2px' }} />
        <button
          onClick={handleResetView}
          title="重置视图"
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            border: 'none',
            background: 'transparent',
            color: '#9ca3af',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 0, 127, 0.15)'
            e.currentTarget.style.color = '#ff007f'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = '#9ca3af'
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </button>
      </div>

      <div
        className="stats-bar"
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 30,
          background: 'rgba(26, 26, 46, 0.7)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12,
          padding: '8px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: '#00ffd5',
              boxShadow: '0 0 8px rgba(0, 255, 213, 0.6)',
              animation: 'pulse 2s ease-in-out infinite',
            }}
          />
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.1em',
              fontFamily: "'Orbitron', sans-serif",
              color: '#00ffd5',
            }}
          >
            {nodes.length} NODES
          </span>
        </div>
        <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)' }} />
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.1em',
            fontFamily: "'Orbitron', sans-serif",
            color: '#ff007f',
          }}
        >
          {safeConnections.length} CONN
        </span>
      </div>
    </div>
  )
}

export default Canvas
