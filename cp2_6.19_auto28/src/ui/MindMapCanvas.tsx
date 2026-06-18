import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import { useMapStore } from '../core/MapEngine'
import { THEMES } from '../types'
import type { MindMapNode, Connection } from '../types'

const MindMapCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const isPanning = useRef(false)
  const lastMousePos = useRef({ x: 0, y: 0 })
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })
  const [newNodeIds, setNewNodeIds] = useState<Set<string>>(new Set())

  const {
    nodes,
    connections,
    selectedNodeId,
    editingNodeId,
    scale,
    offsetX,
    offsetY,
    theme,
    isDraggingNode,
    dragNodeId,
    isCreatingChild,
    creatingFromId,
    creatingPosition,
    flashNodeId,
    createNode,
    updateNodeTitle,
    selectNode,
    setEditingNode,
    startDragNode,
    dragNode,
    endDragNode,
    startCreateChild,
    updateCreatingPosition,
    endCreateChild,
    cancelCreateChild,
    setOffset,
    getNodeList,
    getConnectionList,
  } = useMapStore()

  const themeData = THEMES[theme]

  const nodeList = useMemo(() => getNodeList(), [nodes])
  const connectionList = useMemo(() => getConnectionList(), [connections])

  useEffect(() => {
    const updateSize = () => {
      if (canvasRef.current) {
        setCanvasSize({
          width: canvasRef.current.clientWidth,
          height: canvasRef.current.clientHeight,
        })
      }
    }
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  const screenToCanvas = useCallback(
    (screenX: number, screenY: number) => {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return { x: 0, y: 0 }
      return {
        x: (screenX - rect.left - offsetX) / scale,
        y: (screenY - rect.top - offsetY) / scale,
      }
    },
    [scale, offsetX, offsetY],
  )

  const handleCanvasDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target !== canvasRef.current && e.target !== svgRef.current) return
      const pos = screenToCanvas(e.clientX, e.clientY)
      const node = createNode(pos.x - 70, pos.y - 25, null, '中心主题')
      setNewNodeIds((prev) => new Set(prev).add(node.id))
      setTimeout(() => {
        setNewNodeIds((prev) => {
          const next = new Set(prev)
          next.delete(node.id)
          return next
        })
      }, 400)
    },
    [createNode, screenToCanvas],
  )

  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return
      if (e.target !== canvasRef.current && e.target !== svgRef.current) return

      isPanning.current = true
      lastMousePos.current = { x: e.clientX, y: e.clientY }
      selectNode(null)
    },
    [selectNode],
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isPanning.current) {
        const dx = e.clientX - lastMousePos.current.x
        const dy = e.clientY - lastMousePos.current.y
        setOffset(offsetX + dx, offsetY + dy)
        lastMousePos.current = { x: e.clientX, y: e.clientY }
      }

      if (isCreatingChild && creatingFromId) {
        const pos = screenToCanvas(e.clientX, e.clientY)
        updateCreatingPosition(pos.x, pos.y)
      }

      if (isDraggingNode && dragNodeId) {
        const pos = screenToCanvas(e.clientX, e.clientY)
        const node = nodes[dragNodeId]
        if (node) {
          dragNode(dragNodeId, pos.x - node.width / 2, pos.y - node.height / 2)
        }
      }
    },
    [
      isPanning,
      offsetX,
      offsetY,
      setOffset,
      isCreatingChild,
      creatingFromId,
      screenToCanvas,
      updateCreatingPosition,
      isDraggingNode,
      dragNodeId,
      nodes,
      dragNode,
    ],
  )

  const handleMouseUp = useCallback(() => {
    isPanning.current = false

    if (isCreatingChild && creatingFromId && creatingPosition) {
      endCreateChild(creatingPosition.x - 70, creatingPosition.y - 25)
    }

    if (isDraggingNode) {
      endDragNode()
    }
  }, [isCreatingChild, creatingFromId, creatingPosition, endCreateChild, isDraggingNode, endDragNode])

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])

  const handleNodeClick = useCallback(
    (e: React.MouseEvent, node: MindMapNode) => {
      e.stopPropagation()
      selectNode(node.id)
    },
    [selectNode],
  )

  const handleNodeDoubleClick = useCallback(
    (e: React.MouseEvent, node: MindMapNode) => {
      e.stopPropagation()
      selectNode(node.id)
      setEditingNode(node.id)
    },
    [selectNode, setEditingNode],
  )

  const handleNodeMouseDown = useCallback(
    (e: React.MouseEvent, node: MindMapNode) => {
      if (e.button !== 0) return
      e.stopPropagation()
      selectNode(node.id)
      startDragNode(node.id)
    },
    [selectNode, startDragNode],
  )

  const handleDragHandleMouseDown = useCallback(
    (e: React.MouseEvent, node: MindMapNode) => {
      e.stopPropagation()
      startCreateChild(node.id)
      const pos = screenToCanvas(e.clientX, e.clientY)
      updateCreatingPosition(pos.x, pos.y)
    },
    [startCreateChild, screenToCanvas, updateCreatingPosition],
  )

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, nodeId: string) => {
      if (e.key === 'Enter') {
        setEditingNode(null)
      }
    },
    [setEditingNode],
  )

  const handleInputBlur = useCallback(
    (nodeId: string, value: string) => {
      updateNodeTitle(nodeId, value)
      setEditingNode(null)
    },
    [updateNodeTitle, setEditingNode],
  )

  const getNodeCenter = (node: MindMapNode) => ({
    x: node.x + node.width / 2,
    y: node.y + node.height / 2,
  })

  const getEdgePoint = (fromNode: MindMapNode, toNode: MindMapNode) => {
    const fromCenter = getNodeCenter(fromNode)
    const toCenter = getNodeCenter(toNode)

    const dx = toCenter.x - fromCenter.x
    const dy = toCenter.y - fromCenter.y

    const halfW = fromNode.width / 2
    const halfH = fromNode.height / 2

    let scaleX = Math.abs(dx) < 0.001 ? Infinity : halfW / Math.abs(dx)
    let scaleY = Math.abs(dy) < 0.001 ? Infinity : halfH / Math.abs(dy)

    const t = Math.min(scaleX, scaleY)

    return {
      x: fromCenter.x + dx * t,
      y: fromCenter.y + dy * t,
    }
  }

  const renderConnection = (conn: Connection) => {
    const fromNode = nodes[conn.fromId]
    const toNode = nodes[conn.toId]
    if (!fromNode || !toNode) return null

    const fromPoint = getEdgePoint(fromNode, toNode)
    const toPoint = getEdgePoint(toNode, fromNode)

    const midX = (fromPoint.x + toPoint.x) / 2
    const midY = (fromPoint.y + toPoint.y) / 2

    const dx = toPoint.x - fromPoint.x
    const controlOffset = Math.abs(dx) * 0.4

    const path = `M ${fromPoint.x} ${fromPoint.y} C ${fromPoint.x + controlOffset} ${fromPoint.y}, ${toPoint.x - controlOffset} ${toPoint.y}, ${toPoint.x} ${toPoint.y}`

    const isDimmed = isDraggingNode && dragNodeId !== conn.fromId && dragNodeId !== conn.toId

    return (
      <path
        key={conn.id}
        d={path}
        className={`connection-line ${isDimmed ? 'dimmed' : ''}`}
        stroke={themeData.lineColor}
        markerEnd={`url(#arrowhead-${theme})`}
      />
    )
  }

  const renderTempLine = () => {
    if (!isCreatingChild || !creatingFromId || !creatingPosition) return null

    const fromNode = nodes[creatingFromId]
    if (!fromNode) return null

    const fromCenter = getNodeCenter(fromNode)

    const dx = creatingPosition.x - fromCenter.x
    const halfW = fromNode.width / 2
    const halfH = fromNode.height / 2

    let scaleX = Math.abs(dx) < 0.001 ? Infinity : halfW / Math.abs(dx)
    let scaleY = Infinity
    const dy = creatingPosition.y - fromCenter.y
    if (Math.abs(dy) > 0.001) {
      scaleY = halfH / Math.abs(dy)
    }

    const t = Math.min(scaleX, scaleY)

    const fromX = fromCenter.x + dx * t
    const fromY = fromCenter.y + dy * t

    const midX = (fromX + creatingPosition.x) / 2
    const controlOffset = Math.abs(creatingPosition.x - fromX) * 0.4

    const path = `M ${fromX} ${fromY} C ${fromX + controlOffset} ${fromY}, ${creatingPosition.x - controlOffset} ${creatingPosition.y}, ${creatingPosition.x} ${creatingPosition.y}`

    return (
      <>
        <path d={path} className="temp-line" stroke={themeData.lineColor} />
        <div
          className="snap-indicator"
          style={{
            left: creatingPosition.x,
            top: creatingPosition.y,
            background: themeData.lineColor,
          }}
        />
      </>
    )
  }

  const renderNode = (node: MindMapNode) => {
    const isSelected = selectedNodeId === node.id
    const isEditing = editingNodeId === node.id
    const isDragging = dragNodeId === node.id
    const isFlashing = flashNodeId === node.id
    const isNew = newNodeIds.has(node.id)
    const isDimmed = isDraggingNode && dragNodeId !== node.id && !isCreatingChild

    return (
      <div
        key={node.id}
        className={`node-element ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''} ${isFlashing ? 'flash' : ''} ${isNew ? 'pop-in' : ''} ${isDimmed ? 'dimmed' : ''}`}
        style={{
          left: node.x,
          top: node.y,
          width: node.width,
          height: node.height,
          backgroundColor: themeData.nodeFill,
          color: themeData.nodeText,
        }}
        onClick={(e) => handleNodeClick(e, node)}
        onDoubleClick={(e) => handleNodeDoubleClick(e, node)}
        onMouseDown={(e) => handleNodeMouseDown(e, node)}
      >
        {isEditing ? (
          <input
            type="text"
            className="node-edit-input"
            defaultValue={node.title}
            autoFocus
            style={{ color: themeData.nodeText }}
            onKeyDown={(e) => handleInputKeyDown(e, node.id)}
            onBlur={(e) => handleInputBlur(node.id, e.target.value)}
            onMouseDown={(e) => e.stopPropagation()}
          />
        ) : (
          <span>{node.title}</span>
        )}
        {isSelected && !isEditing && (
          <div
            className="drag-handle"
            onMouseDown={(e) => handleDragHandleMouseDown(e, node)}
            style={{ background: themeData.lineColor }}
          />
        )}
      </div>
    )
  }

  const gridBackgroundImage = `linear-gradient(${themeData.gridColor} 1px, transparent 1px), linear-gradient(90deg, ${themeData.gridColor} 1px, transparent 1px)`
  const gridBackgroundSize = `${20 * scale}px ${20 * scale}px`

  return (
    <div
      ref={canvasRef}
      className={`mind-map-canvas ${isPanning.current ? 'grabbing' : ''}`}
      style={{
        backgroundColor: themeData.background,
        '--line-color': themeData.lineColor,
        '--glow-color': themeData.glowColor,
      } as React.CSSProperties}
      onDoubleClick={handleCanvasDoubleClick}
      onMouseDown={handleCanvasMouseDown}
    >
      <div
        className="grid-background"
        style={{
          backgroundImage: gridBackgroundImage,
          backgroundSize: gridBackgroundSize,
          backgroundPosition: `${offsetX}px ${offsetY}px`,
        }}
      />

      <div
        className="canvas-content"
        style={{
          transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})`,
        }}
      >
        <svg
          ref={svgRef}
          className="connections-svg"
          width={5000}
          height={5000}
          style={{ position: 'absolute', top: 0, left: 0 }}
        >
          <defs>
            <marker
              id={`arrowhead-${theme}`}
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill={themeData.lineColor} />
            </marker>
          </defs>
          {connectionList.map(renderConnection)}
          {renderTempLine()}
        </svg>

        {nodeList.map(renderNode)}
      </div>

      <Thumbnail
        nodes={nodeList}
        connections={connectionList}
        offsetX={offsetX}
        offsetY={offsetY}
        scale={scale}
        canvasWidth={canvasSize.width}
        canvasHeight={canvasSize.height}
        theme={theme}
        themeData={themeData}
      />
    </div>
  )
}

interface ThumbnailProps {
  nodes: MindMapNode[]
  connections: Connection[]
  offsetX: number
  offsetY: number
  scale: number
  canvasWidth: number
  canvasHeight: number
  theme: string
  themeData: typeof THEMES[keyof typeof THEMES]
}

const Thumbnail: React.FC<ThumbnailProps> = ({
  nodes,
  connections,
  offsetX,
  offsetY,
  scale,
  canvasWidth,
  canvasHeight,
  theme,
  themeData,
}) => {
  const thumbnailRef = useRef<HTMLDivElement>(null)
  const [thumbSize, setThumbSize] = useState({ width: 200, height: 150 })

  useEffect(() => {
    if (thumbnailRef.current) {
      setThumbSize({
        width: thumbnailRef.current.clientWidth,
        height: thumbnailRef.current.clientHeight,
      })
    }
  }, [])

  if (nodes.length === 0) {
    return (
      <div className="thumbnail-container" style={{ backgroundColor: themeData.panelBg }}>
        <div className="thumbnail-canvas" ref={thumbnailRef} />
      </div>
    )
  }

  const minX = Math.min(...nodes.map((n) => n.x))
  const maxX = Math.max(...nodes.map((n) => n.x + n.width))
  const minY = Math.min(...nodes.map((n) => n.y))
  const maxY = Math.max(...nodes.map((n) => n.y + n.height))

  const padding = 20
  const contentWidth = maxX - minX + padding * 2
  const contentHeight = maxY - minY + padding * 2

  const thumbScale = Math.min(thumbSize.width / contentWidth, thumbSize.height / contentHeight, 1)

  const viewportX = -offsetX / scale
  const viewportY = -offsetY / scale
  const viewportW = canvasWidth / scale
  const viewportH = canvasHeight / scale

  return (
    <div className="thumbnail-container" style={{ backgroundColor: themeData.panelBg }}>
      <div className="thumbnail-canvas" ref={thumbnailRef}>
        <svg width={thumbSize.width} height={thumbSize.height}>
          {connections.map((conn) => {
            const fromNode = nodes.find((n) => n.id === conn.fromId)
            const toNode = nodes.find((n) => n.id === conn.toId)
            if (!fromNode || !toNode) return null

            const fx = (fromNode.x + fromNode.width / 2 - minX + padding) * thumbScale
            const fy = (fromNode.y + fromNode.height / 2 - minY + padding) * thumbScale
            const tx = (toNode.x + toNode.width / 2 - minX + padding) * thumbScale
            const ty = (toNode.y + toNode.height / 2 - minY + padding) * thumbScale

            return (
              <line
                key={conn.id}
                x1={fx}
                y1={fy}
                x2={tx}
                y2={ty}
                stroke={themeData.lineColor}
                strokeWidth={1}
                opacity={0.6}
              />
            )
          })}
          {nodes.map((node) => (
            <rect
              key={node.id}
              x={(node.x - minX + padding) * thumbScale}
              y={(node.y - minY + padding) * thumbScale}
              width={node.width * thumbScale}
              height={node.height * thumbScale}
              fill={themeData.nodeFill}
              stroke={themeData.lineColor}
              strokeWidth={0.5}
              rx={3}
            />
          ))}
        </svg>
        <div
          className="thumbnail-viewport"
          style={{
            left: (viewportX - minX + padding) * thumbScale,
            top: (viewportY - minY + padding) * thumbScale,
            width: viewportW * thumbScale,
            height: viewportH * thumbScale,
            borderColor: themeData.lineColor,
          }}
        />
      </div>
    </div>
  )
}

export default MindMapCanvas
