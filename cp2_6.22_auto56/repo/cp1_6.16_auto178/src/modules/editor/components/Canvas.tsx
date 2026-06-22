import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useMindmapStore } from '../store/useMindmapStore'
import type { MindMapNode, MindMapEdge } from '../types'

interface NodeWithSize extends MindMapNode {
  width: number
  height: number
}

const NODE_PADDING_X = 16
const NODE_PADDING_Y = 10
const NODE_MIN_WIDTH = 80
const NODE_HEIGHT = 40
const ANCHOR_RADIUS = 6
const EDGE_LINE_WIDTH = 2
const EDGE_COLOR = '#78909C'
const ANCHOR_COLOR = '#00BCD4'
const SELECTED_STROKE_COLOR = '#2196F3'
const SELECTED_STROKE_WIDTH = 2

const Canvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [showZoomIndicator, setShowZoomIndicator] = useState(false)
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null)
  const [nodeSizes, setNodeSizes] = useState<Map<string, { width: number; height: number }>>(new Map())
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)

  const {
    nodes,
    edges,
    selectedNodeId,
    zoom,
    panX,
    panY,
    addNode,
    moveNode,
    selectNode,
    removeNode,
    addEdge,
    removeEdge,
    setZoom,
    setPan,
  } = useMindmapStore()

  const dragState = useRef({
    isDragging: false,
    draggedNodeId: null as string | null,
    dragOffsetX: 0,
    dragOffsetY: 0,
  })

  const panState = useRef({
    isPanning: false,
    startX: 0,
    startY: 0,
    startPanX: 0,
    startPanY: 0,
  })

  const edgeDrawState = useRef({
    isDrawing: false,
    sourceNodeId: null as string | null,
    mouseX: 0,
    mouseY: 0,
  })

  const spacePressed = useRef(false)

  const measureText = useCallback((ctx: CanvasRenderingContext2D, text: string) => {
    ctx.font = '14px sans-serif'
    const metrics = ctx.measureText(text)
    const width = Math.max(NODE_MIN_WIDTH, metrics.width + NODE_PADDING_X * 2)
    return { width, height: NODE_HEIGHT }
  }, [])

  const getNodesWithSize = useCallback((): NodeWithSize[] => {
    return nodes.map((node) => {
      const size = nodeSizes.get(node.id)
      return {
        ...node,
        width: size?.width || NODE_MIN_WIDTH,
        height: size?.height || NODE_HEIGHT,
      }
    })
  }, [nodes, nodeSizes])

  const screenToWorld = useCallback((screenX: number, screenY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return { x: 0, y: 0 }
    return {
      x: (screenX - rect.left - panX) / zoom,
      y: (screenY - rect.top - panY) / zoom,
    }
  }, [panX, panY, zoom])

  const getNodeAtPoint = useCallback((worldX: number, worldY: number): NodeWithSize | null => {
    const nodesWithSize = getNodesWithSize()
    for (let i = nodesWithSize.length - 1; i >= 0; i--) {
      const node = nodesWithSize[i]
      if (
        worldX >= node.x &&
        worldX <= node.x + node.width &&
        worldY >= node.y &&
        worldY <= node.y + node.height
      ) {
        return node
      }
    }
    return null
  }, [getNodesWithSize])

  const getAnchorAtPoint = useCallback((worldX: number, worldY: number): NodeWithSize | null => {
    const nodesWithSize = getNodesWithSize()
    for (let i = nodesWithSize.length - 1; i >= 0; i--) {
      const node = nodesWithSize[i]
      const anchorX = node.x + node.width
      const anchorY = node.y + node.height / 2
      const dx = worldX - anchorX
      const dy = worldY - anchorY
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist <= ANCHOR_RADIUS / zoom + 4) {
        return node
      }
    }
    return null
  }, [getNodesWithSize, zoom])

  const getEdgeAtPoint = useCallback((worldX: number, worldY: number): MindMapEdge | null => {
    const nodesWithSize = getNodesWithSize()
    const nodeMap = new Map(nodesWithSize.map((n) => [n.id, n]))

    for (const edge of edges) {
      const source = nodeMap.get(edge.source)
      const target = nodeMap.get(edge.target)
      if (!source || !target) continue

      const sx = source.x + source.width
      const sy = source.y + source.height / 2
      const tx = target.x
      const ty = target.y + target.height / 2

      const cx1 = sx + (tx - sx) * 0.5
      const cy1 = sy
      const cx2 = sx + (tx - sx) * 0.5
      const cy2 = ty

      const hitRadius = 8 / zoom
      for (let t = 0; t <= 1; t += 0.05) {
        const mt = 1 - t
        const x =
          mt * mt * mt * sx +
          3 * mt * mt * t * cx1 +
          3 * mt * t * t * cx2 +
          t * t * t * tx
        const y =
          mt * mt * mt * sy +
          3 * mt * mt * t * cy1 +
          3 * mt * t * t * cy2 +
          t * t * t * ty
        const dx = worldX - x
        const dy = worldY - y
        if (Math.sqrt(dx * dx + dy * dy) <= hitRadius) {
          return edge
        }
      }
    }
    return null
  }, [getNodesWithSize, edges, zoom])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * window.devicePixelRatio
    canvas.height = rect.height * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, rect.width, rect.height)

    ctx.save()
    ctx.translate(panX, panY)
    ctx.scale(zoom, zoom)

    const nodesWithSize = getNodesWithSize()
    const nodeMap = new Map(nodesWithSize.map((n) => [n.id, n]))

    edges.forEach((edge) => {
      const source = nodeMap.get(edge.source)
      const target = nodeMap.get(edge.target)
      if (!source || !target) return

      const sx = source.x + source.width
      const sy = source.y + source.height / 2
      const tx = target.x
      const ty = target.y + target.height / 2

      const cx1 = sx + (tx - sx) * 0.5
      const cy1 = sy
      const cx2 = sx + (tx - sx) * 0.5
      const cy2 = ty

      ctx.beginPath()
      ctx.moveTo(sx, sy)
      ctx.bezierCurveTo(cx1, cy1, cx2, cy2, tx, ty)
      ctx.strokeStyle = EDGE_COLOR
      ctx.lineWidth = EDGE_LINE_WIDTH / zoom
      ctx.stroke()

      const arrowSize = 8 / zoom
      const angle = Math.atan2(ty - cy2, tx - cx2)
      ctx.beginPath()
      ctx.moveTo(tx, ty)
      ctx.lineTo(
        tx - arrowSize * Math.cos(angle - Math.PI / 6),
        ty - arrowSize * Math.sin(angle - Math.PI / 6)
      )
      ctx.lineTo(
        tx - arrowSize * Math.cos(angle + Math.PI / 6),
        ty - arrowSize * Math.sin(angle + Math.PI / 6)
      )
      ctx.closePath()
      ctx.fillStyle = EDGE_COLOR
      ctx.fill()

      if (hoveredEdgeId === edge.id) {
        const midT = 0.5
        const mt = 1 - midT
        const midX =
          mt * mt * mt * sx +
          3 * mt * mt * midT * cx1 +
          3 * mt * midT * midT * cx2 +
          midT * midT * midT * tx
        const midY =
          mt * mt * mt * sy +
          3 * mt * mt * midT * cy1 +
          3 * mt * midT * midT * cy2 +
          midT * midT * midT * ty

        const btnRadius = 10 / zoom
        ctx.beginPath()
        ctx.arc(midX, midY, btnRadius, 0, Math.PI * 2)
        ctx.fillStyle = '#fff'
        ctx.fill()
        ctx.strokeStyle = '#f44336'
        ctx.lineWidth = 2 / zoom
        ctx.stroke()

        ctx.beginPath()
        ctx.moveTo(midX - 5 / zoom, midY - 5 / zoom)
        ctx.lineTo(midX + 5 / zoom, midY + 5 / zoom)
        ctx.moveTo(midX + 5 / zoom, midY - 5 / zoom)
        ctx.lineTo(midX - 5 / zoom, midY + 5 / zoom)
        ctx.strokeStyle = '#f44336'
        ctx.lineWidth = 2 / zoom
        ctx.stroke()
      }
    })

    if (edgeDrawState.current.isDrawing && edgeDrawState.current.sourceNodeId) {
      const source = nodeMap.get(edgeDrawState.current.sourceNodeId)
      if (source) {
        const worldMouse = screenToWorld(
          edgeDrawState.current.mouseX,
          edgeDrawState.current.mouseY
        )
        const sx = source.x + source.width
        const sy = source.y + source.height / 2
        const tx = worldMouse.x
        const ty = worldMouse.y

        ctx.beginPath()
        ctx.moveTo(sx, sy)
        ctx.bezierCurveTo(
          sx + (tx - sx) * 0.5,
          sy,
          sx + (tx - sx) * 0.5,
          ty,
          tx,
          ty
        )
        ctx.strokeStyle = ANCHOR_COLOR
        ctx.lineWidth = 2 / zoom
        ctx.setLineDash([5 / zoom, 5 / zoom])
        ctx.stroke()
        ctx.setLineDash([])
      }
    }

    nodesWithSize.forEach((node) => {
      const isSelected = node.id === selectedNodeId
      const isHovered = node.id === hoveredNodeId

      if (isSelected) {
        ctx.shadowColor = 'rgba(33,150,243,0.4)'
        ctx.shadowBlur = 12 / zoom
        ctx.shadowOffsetY = 4 / zoom
      } else {
        ctx.shadowColor = 'rgba(0,0,0,0.1)'
        ctx.shadowBlur = 4 / zoom
        ctx.shadowOffsetY = 2 / zoom
      }

      const radius = 8 / zoom
      ctx.beginPath()
      ctx.roundRect(node.x, node.y, node.width, node.height, radius)
      ctx.fillStyle = node.color
      ctx.fill()
      ctx.shadowColor = 'transparent'

      if (isSelected) {
        ctx.strokeStyle = SELECTED_STROKE_COLOR
        ctx.lineWidth = SELECTED_STROKE_WIDTH / zoom
        ctx.stroke()
      }

      ctx.fillStyle = '#333333'
      ctx.font = '14px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(
        node.label,
        node.x + node.width / 2,
        node.y + node.height / 2
      )

      if (isSelected || isHovered) {
        const anchorX = node.x + node.width
        const anchorY = node.y + node.height / 2
        ctx.beginPath()
        ctx.arc(anchorX, anchorY, ANCHOR_RADIUS / zoom, 0, Math.PI * 2)
        ctx.fillStyle = ANCHOR_COLOR
        ctx.fill()
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 2 / zoom
        ctx.stroke()
      }
    })

    ctx.restore()
  }, [
    nodes,
    edges,
    selectedNodeId,
    hoveredNodeId,
    hoveredEdgeId,
    zoom,
    panX,
    panY,
    getNodesWithSize,
    screenToWorld,
  ])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const newSizes = new Map<string, { width: number; height: number }>()
    nodes.forEach((node) => {
      const size = measureText(ctx, node.label)
      newSizes.set(node.id, size)
    })
    setNodeSizes(newSizes)
  }, [nodes, measureText])

  useEffect(() => {
    draw()
  }, [draw])

  useEffect(() => {
    const handleResize = () => draw()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [draw])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        spacePressed.current = true
        if (containerRef.current) {
          containerRef.current.style.cursor = 'grab'
        }
      }
      if (e.code === 'Delete' && selectedNodeId) {
        removeNode(selectedNodeId)
      }
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ') {
        e.preventDefault()
        if (e.shiftKey) {
          useMindmapStore.getState().redo()
        } else {
          useMindmapStore.getState().undo()
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyY') {
        e.preventDefault()
        useMindmapStore.getState().redo()
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        spacePressed.current = false
        if (containerRef.current && !panState.current.isPanning) {
          containerRef.current.style.cursor = 'default'
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [selectedNodeId, removeNode])

  const handleMouseDown = (e: React.MouseEvent) => {
    const worldPos = screenToWorld(e.clientX, e.clientY)

    const anchorNode = getAnchorAtPoint(worldPos.x, worldPos.y)
    if (anchorNode) {
      edgeDrawState.current = {
        isDrawing: true,
        sourceNodeId: anchorNode.id,
        mouseX: e.clientX,
        mouseY: e.clientY,
      }
      return
    }

    if (spacePressed.current || e.button === 1) {
      panState.current = {
        isPanning: true,
        startX: e.clientX,
        startY: e.clientY,
        startPanX: panX,
        startPanY: panY,
      }
      if (containerRef.current) {
        containerRef.current.style.cursor = 'grabbing'
      }
      return
    }

    const clickedNode = getNodeAtPoint(worldPos.x, worldPos.y)
    if (clickedNode) {
      selectNode(clickedNode.id)
      dragState.current = {
        isDragging: true,
        draggedNodeId: clickedNode.id,
        dragOffsetX: worldPos.x - clickedNode.x,
        dragOffsetY: worldPos.y - clickedNode.y,
      }
    } else {
      selectNode(null)
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    const worldPos = screenToWorld(e.clientX, e.clientY)

    if (edgeDrawState.current.isDrawing) {
      edgeDrawState.current.mouseX = e.clientX
      edgeDrawState.current.mouseY = e.clientY
      draw()
      return
    }

    if (panState.current.isPanning) {
      const dx = e.clientX - panState.current.startX
      const dy = e.clientY - panState.current.startY
      setPan(panState.current.startPanX + dx, panState.current.startPanY + dy)
      return
    }

    if (dragState.current.isDragging && dragState.current.draggedNodeId) {
      const newX = worldPos.x - dragState.current.dragOffsetX
      const newY = worldPos.y - dragState.current.dragOffsetY
      moveNode(dragState.current.draggedNodeId, newX, newY)
      return
    }

    const hoveredNode = getNodeAtPoint(worldPos.x, worldPos.y)
    setHoveredNodeId(hoveredNode?.id || null)

    const hoveredEdge = getEdgeAtPoint(worldPos.x, worldPos.y)
    setHoveredEdgeId(hoveredEdge?.id || null)
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    if (edgeDrawState.current.isDrawing && edgeDrawState.current.sourceNodeId) {
      const worldPos = screenToWorld(e.clientX, e.clientY)
      const targetNode = getNodeAtPoint(worldPos.x, worldPos.y)
      if (targetNode && targetNode.id !== edgeDrawState.current.sourceNodeId) {
        addEdge(edgeDrawState.current.sourceNodeId, targetNode.id)
      }
      edgeDrawState.current = {
        isDrawing: false,
        sourceNodeId: null,
        mouseX: 0,
        mouseY: 0,
      }
    }

    if (panState.current.isPanning) {
      panState.current.isPanning = false
      if (containerRef.current && !spacePressed.current) {
        containerRef.current.style.cursor = 'default'
      }
    }

    if (dragState.current.isDragging) {
      dragState.current.isDragging = false
      dragState.current.draggedNodeId = null
    }
  }

  const handleDoubleClick = (e: React.MouseEvent) => {
    const worldPos = screenToWorld(e.clientX, e.clientY)
    const clickedNode = getNodeAtPoint(worldPos.x, worldPos.y)
    if (!clickedNode) {
      addNode('新节点', worldPos.x - NODE_MIN_WIDTH / 2, worldPos.y - NODE_HEIGHT / 2)
    }
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    const newZoom = Math.max(0.25, Math.min(2, zoom + delta))

    const rect = canvasRef.current?.getBoundingClientRect()
    if (rect) {
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      const scaleRatio = newZoom / zoom
      const newPanX = mouseX - (mouseX - panX) * scaleRatio
      const newPanY = mouseY - (mouseY - panY) * scaleRatio

      setZoom(newZoom)
      setPan(newPanX, newPanY)
    }

    setShowZoomIndicator(true)
    setTimeout(() => setShowZoomIndicator(false), 800)
  }

  const handleEdgeClick = (e: React.MouseEvent) => {
    if (hoveredEdgeId) {
      const worldPos = screenToWorld(e.clientX, e.clientY)
      const nodesWithSize = getNodesWithSize()
      const nodeMap = new Map(nodesWithSize.map((n) => [n.id, n]))
      const edge = edges.find((e) => e.id === hoveredEdgeId)
      if (edge) {
        const source = nodeMap.get(edge.source)
        const target = nodeMap.get(edge.target)
        if (source && target) {
          const sx = source.x + source.width
          const sy = source.y + source.height / 2
          const tx = target.x
          const ty = target.y + target.height / 2
          const cx1 = sx + (tx - sx) * 0.5
          const cy1 = sy
          const cx2 = sx + (tx - sx) * 0.5
          const cy2 = ty

          const midT = 0.5
          const mt = 1 - midT
          const midX =
            mt * mt * mt * sx +
            3 * mt * mt * midT * cx1 +
            3 * mt * midT * midT * cx2 +
            midT * midT * midT * tx
          const midY =
            mt * mt * mt * sy +
            3 * mt * mt * midT * cy1 +
            3 * mt * midT * midT * cy2 +
            midT * midT * midT * ty

          const dx = worldPos.x - midX
          const dy = worldPos.y - midY
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist <= 10 / zoom) {
            removeEdge(hoveredEdgeId)
            setHoveredEdgeId(null)
          }
        }
      }
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    handleEdgeClick(e)
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 relative overflow-hidden bg-white"
      style={{
        border: '1px solid #E0E0E0',
      }}
    >
      <canvas
        id="mindmap-canvas"
        ref={canvasRef}
        className="w-full h-full"
        style={{ display: 'block' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        onWheel={handleWheel}
        onClick={handleClick}
      />

      {showZoomIndicator && (
        <div
          className="absolute bottom-4 left-4 px-3 py-1.5 bg-white/90 rounded-md text-xs text-gray-500 shadow-sm"
          style={{
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          {Math.round(zoom * 100)}%
        </div>
      )}
    </div>
  )
}

export default Canvas
