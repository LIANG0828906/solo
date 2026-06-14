import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useDrop } from 'react-dnd'
import TreeNode from './TreeNode'
import ConnectionLine from './ConnectionLine'
import PropertyModal from './PropertyModal'
import { useBehaviorTreeStore } from '@/stores/behaviorTreeStore'
import { Connection } from '@/types/behaviorTree'
import { snapToGrid } from '@/utils/geometry'

const GRID_SIZE = 20
const NODE_WIDTH = 140
const NODE_HEIGHT = 80

const TreeEditor: React.FC = () => {
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isDraggingConnection, setIsDraggingConnection] = useState(false)
  const [connectionStart, setConnectionStart] = useState<{ nodeId: string; port: 'output' } | null>(null)
  const [connectionEndPos, setConnectionEndPos] = useState<{ x: number; y: number } | null>(null)
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })

  const containerRef = useRef<HTMLDivElement>(null)

  const {
    nodes,
    connections,
    addNode,
    updateNodePosition,
    removeNode,
    addConnection,
    removeConnection,
    updateNodeProperties,
    editingNodeId,
    setEditingNode
  } = useBehaviorTreeStore()

  const getMousePosition = useCallback((e: React.MouseEvent | MouseEvent) => {
    if (!containerRef.current) return { x: 0, y: 0 }
    const rect = containerRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left - offset.x) / scale
    const y = (e.clientY - rect.top - offset.y) / scale
    return { x, y }
  }, [offset, scale])

  const [, drop] = useDrop({
    accept: 'NODE_TYPE',
    drop: (item: { type: string }, monitor) => {
      const clientOffset = monitor.getClientOffset()
      if (!clientOffset || !containerRef.current) return

      const rect = containerRef.current.getBoundingClientRect()
      const x = (clientOffset.x - rect.left - offset.x - NODE_WIDTH / 2) / scale
      const y = (clientOffset.y - rect.top - offset.y - NODE_HEIGHT / 2) / scale

      const snappedX = snapToGrid(x, GRID_SIZE)
      const snappedY = snapToGrid(y, GRID_SIZE)

      addNode(item.type as any, snappedX, snappedY)
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop()
    })
  })

  const handleStartConnection = useCallback((nodeId: string, port: 'output') => {
    setIsDraggingConnection(true)
    setConnectionStart({ nodeId, port })
  }, [])

  const handleEndConnection = useCallback((nodeId: string, port: 'input') => {
    if (isDraggingConnection && connectionStart) {
      if (connectionStart.nodeId !== nodeId) {
        const exists = connections.some(
          c => c.fromNodeId === connectionStart.nodeId && c.toNodeId === nodeId
        )
        if (!exists) {
          addConnection(connectionStart.nodeId, nodeId)
        }
      }
    }
    setIsDraggingConnection(false)
    setConnectionStart(null)
    setConnectionEndPos(null)
  }, [isDraggingConnection, connectionStart, connections, addConnection])

  const handleNodeDoubleClick = useCallback((id: string) => {
    setEditingNode(id)
  }, [setEditingNode])

  const handleNodeRemove = useCallback((id: string) => {
    removeNode(id)
  }, [removeNode])

  const handleConnectionRemove = useCallback((id: string) => {
    removeConnection(id)
  }, [removeConnection])

  const handleSaveProperties = useCallback((id: string, properties: Record<string, unknown>) => {
    updateNodeProperties(id, properties)
  }, [updateNodeProperties])

  const handleCloseModal = useCallback(() => {
    setEditingNode(null)
  }, [setEditingNode])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    const newScale = Math.max(0.3, Math.min(3, scale * delta))

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      const newOffsetX = mouseX - (mouseX - offset.x) * (newScale / scale)
      const newOffsetY = mouseY - (mouseY - offset.y) * (newScale / scale)

      setOffset({ x: newOffsetX, y: newOffsetY })
    }

    setScale(newScale)
  }, [scale, offset])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0 && !isDraggingConnection) {
      const target = e.target as HTMLElement
      if (target.closest('.tree-node') || target.closest('.connection-line')) return
      setIsPanning(true)
      setPanStart({ x: e.clientX - offset.x, y: e.clientY - offset.y })
    }
  }, [offset, isDraggingConnection])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isPanning) {
      setOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      })
    }
    if (isDraggingConnection) {
      const pos = getMousePosition(e)
      setConnectionEndPos(pos)
    }
  }, [isPanning, panStart, isDraggingConnection, getMousePosition])

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (isPanning) {
      setIsPanning(false)
    }
    if (isDraggingConnection && e.button === 0) {
      setIsDraggingConnection(false)
      setConnectionStart(null)
      setConnectionEndPos(null)
    }
  }, [isPanning, isDraggingConnection])

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
  }, [])

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])

  const editingNode = nodes.find(n => n.id === editingNodeId) || null

  const renderGrid = () => {
    const lines = []
    const width = 5000
    const height = 5000
    const offsetX = -2500
    const offsetY = -2500

    for (let x = offsetX; x <= width; x += GRID_SIZE) {
      lines.push(
        <line
          key={`v-${x}`}
          x1={x}
          y1={offsetY}
          x2={x}
          y2={height}
          stroke="#2a2a3a"
          strokeWidth={x % 100 === 0 ? 1 : 0.5}
        />
      )
    }
    for (let y = offsetY; y <= height; y += GRID_SIZE) {
      lines.push(
        <line
          key={`h-${y}`}
          x1={offsetX}
          y1={y}
          x2={width}
          y2={y}
          stroke="#2a2a3a"
          strokeWidth={y % 100 === 0 ? 1 : 0.5}
        />
      )
    }
    return lines
  }

  const renderDragConnection = () => {
    if (!isDraggingConnection || !connectionStart || !connectionEndPos) return null

    const fromNode = nodes.find(n => n.id === connectionStart.nodeId)
    if (!fromNode) return null

    const tempConnection: Connection = {
      id: 'temp-connection',
      fromNodeId: connectionStart.nodeId,
      fromPort: 'output',
      toNodeId: '',
      toPort: 'input',
      isActive: true
    }

    return (
      <ConnectionLine
        connection={tempConnection}
        fromNode={fromNode}
        toNode={undefined}
        isDragging={true}
        dragEndPosition={connectionEndPos}
      />
    )
  }

  drop(containerRef)

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-[#12121a] select-none"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onContextMenu={handleContextMenu}
      style={{ cursor: isPanning ? 'grabbing' : isDraggingConnection ? 'crosshair' : 'grab' }}
    >
      <svg
        className="absolute inset-0 pointer-events-none"
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          transformOrigin: '0 0'
        }}
      >
        {renderGrid()}
      </svg>

      <svg
        className="absolute inset-0 pointer-events-none"
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          transformOrigin: '0 0'
        }}
      >
        <g style={{ pointerEvents: 'auto' }}>
          {connections.map(connection => {
            const fromNode = nodes.find(n => n.id === connection.fromNodeId)
            const toNode = nodes.find(n => n.id === connection.toNodeId)
            return (
              <ConnectionLine
                key={connection.id}
                connection={connection}
                fromNode={fromNode}
                toNode={toNode}
                onRemove={handleConnectionRemove}
              />
            )
          })}
          {renderDragConnection()}
        </g>
      </svg>

      <div
        className="absolute inset-0"
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          transformOrigin: '0 0'
        }}
      >
        {nodes.map(node => (
          <TreeNode
            key={node.id}
            node={node}
            onPositionChange={updateNodePosition}
            onStartConnection={handleStartConnection}
            onEndConnection={handleEndConnection}
            onDoubleClick={handleNodeDoubleClick}
            onRemove={handleNodeRemove}
            isDraggingConnection={isDraggingConnection}
          />
        ))}
      </div>

      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center text-gray-500">
            <div className="text-6xl mb-4">🌳</div>
            <p className="text-xl font-medium">从左侧面板拖拽节点到此处</p>
            <p className="text-sm mt-2">开始构建你的行为树</p>
          </div>
        </div>
      )}

      <PropertyModal
        node={editingNode}
        onClose={handleCloseModal}
        onSave={handleSaveProperties}
      />

      <div className="absolute bottom-4 right-4 flex items-center space-x-2 bg-[#1a1a2e] px-3 py-2 rounded-lg text-sm text-gray-400 border border-gray-700">
        <span>缩放: {Math.round(scale * 100)}%</span>
        <span className="text-gray-600">|</span>
        <span>滚轮缩放 · 拖拽平移</span>
      </div>
    </div>
  )
}

export default TreeEditor
