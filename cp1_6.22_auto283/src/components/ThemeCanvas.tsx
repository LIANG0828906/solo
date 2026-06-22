import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useStore, Inspiration, InspirationType, ThemeNode } from '../store/InspirationStore'
import {
  forceSimulation,
  forceManyBody,
  forceCenter,
  forceLink,
  Simulation,
  SimulationNodeDatum,
  SimulationLinkDatum,
} from 'd3-force'

const typeColors: Record<InspirationType, string> = {
  text: '#6B7280',
  image: '#3B82F6',
  voice: '#F59E0B',
}

interface SimNode extends SimulationNodeDatum {
  id: string
  x: number
  y: number
  label: string
}

interface SimLink extends SimulationLinkDatum<SimNode> {
  source: SimNode | string
  target: SimNode | string
}

const ThemeCanvas: React.FC = () => {
  const { state, dispatch } = useStore()
  const canvasRef = useRef<HTMLDivElement>(null)
  const simulationRef = useRef<Simulation<SimNode, SimLink> | null>(null)
  const [nodes, setNodes] = useState<ThemeNode[]>([])
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set())
  const dragStateRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null)

  const activeTheme = state.themes.find((t) => t.id === state.activeThemeId)
  const activeThemeData = state.activeThemeId ? state.themeData[state.activeThemeId] : null

  const getInspirationById = useCallback(
    (id: string): Inspiration | undefined => {
      return state.inspirations.find((i) => i.id === id)
    },
    [state.inspirations]
  )

  useEffect(() => {
    if (activeThemeData) {
      setNodes(activeThemeData.nodes)
    } else {
      setNodes([])
    }
  }, [activeThemeData])

  useEffect(() => {
    if (!activeThemeData || !canvasRef.current) return

    const width = canvasRef.current.clientWidth
    const height = canvasRef.current.clientHeight

    const simNodes: SimNode[] = activeThemeData.nodes.map((n) => ({
      id: n.inspirationId,
      x: n.x,
      y: n.y,
      label: n.label,
    }))

    const simLinks: SimLink[] = activeThemeData.links.map((l) => ({
      source: l.source,
      target: l.target,
    }))

    if (simulationRef.current) {
      simulationRef.current.stop()
    }

    const simulation = forceSimulation<SimNode>(simNodes)
      .force('link', forceLink<SimNode, SimLink>(simLinks).id((d) => d.id).distance(120).strength(0.3))
      .force('charge', forceManyBody().strength(-200))
      .force('center', forceCenter(width / 2, height / 2).strength(0.05))
      .alphaDecay(0.02)

    simulation.on('tick', () => {
      setNodes((prev) =>
        prev.map((node) => {
          const simNode = simNodes.find((sn) => sn.id === node.inspirationId)
          if (simNode && simNode.x !== undefined && simNode.y !== undefined) {
            return { ...node, x: simNode.x, y: simNode.y }
          }
          return node
        })
      )
    })

    simulationRef.current = simulation

    return () => {
      simulation.stop()
    }
  }, [activeThemeData, state.activeThemeId])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    if (!state.activeThemeId || !canvasRef.current) return

    const inspirationId = e.dataTransfer.getData('text/plain')
    if (!inspirationId) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    dispatch({
      type: 'ADD_NODE_TO_THEME',
      payload: { themeId: state.activeThemeId, inspirationId, x, y },
    })

    if (simulationRef.current) {
      simulationRef.current.alpha(0.3).restart()
    }
  }

  const handleMouseDown = (e: React.MouseEvent, node: ThemeNode) => {
    e.stopPropagation()
    const nodeElement = (e.target as HTMLElement).closest('.canvas-node')
    if (!nodeElement) return

    const rect = nodeElement.getBoundingClientRect()
    dragStateRef.current = {
      id: node.inspirationId,
      offsetX: e.clientX - rect.left - rect.width / 2,
      offsetY: e.clientY - rect.top - rect.height / 2,
    }

    if (e.shiftKey) {
      setSelectedNodes((prev) => {
        const next = new Set(prev)
        if (next.has(node.inspirationId)) {
          next.delete(node.inspirationId)
        } else {
          next.add(node.inspirationId)
        }
        return next
      })
    } else if (!selectedNodes.has(node.inspirationId)) {
      setSelectedNodes(new Set([node.inspirationId]))
    }
  }

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragStateRef.current || !canvasRef.current || !state.activeThemeId) return

      const rect = canvasRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left - dragStateRef.current.offsetX
      const y = e.clientY - rect.top - dragStateRef.current.offsetY

      const node = nodes.find((n) => n.inspirationId === dragStateRef.current!.id)
      if (node) {
        dispatch({
          type: 'UPDATE_NODE_POSITION',
          payload: { themeId: state.activeThemeId, inspirationId: dragStateRef.current.id, x, y },
        })
      }
    },
    [nodes, dispatch, state.activeThemeId]
  )

  const handleMouseUp = useCallback(() => {
    dragStateRef.current = null
  }, [])

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])

  const handleDoubleClick = (node: ThemeNode) => {
    setEditingNodeId(node.inspirationId)
    setEditLabel(node.label)
  }

  const commitEdit = () => {
    if (editingNodeId && state.activeThemeId) {
      dispatch({
        type: 'UPDATE_NODE_LABEL',
        payload: { themeId: state.activeThemeId, inspirationId: editingNodeId, label: editLabel },
      })
    }
    setEditingNodeId(null)
    setEditLabel('')
  }

  const createCurvePath = (source: ThemeNode, target: ThemeNode) => {
    const midX = (source.x + target.x) / 2
    const midY = (source.y + target.y) / 2
    const dx = target.x - source.x
    const dy = target.y - source.y

    const controlX = midX - dy * 0.2
    const controlY = midY + dx * 0.2

    return `M ${source.x} ${source.y} Q ${controlX} ${controlY} ${target.x} ${target.y}`
  }

  if (!activeTheme) {
    return (
      <div
        ref={canvasRef}
        style={{
          flex: 1,
          backgroundColor: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#9CA3AF',
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🕸️</div>
        <p style={{ fontSize: '16px', marginBottom: '8px' }}>尚未选择主题</p>
        <p style={{ fontSize: '13px' }}>在顶部创建或选择一个主题，然后拖拽灵感到画布上</p>
      </div>
    )
  }

  return (
    <div
      ref={canvasRef}
      onDragOver={(e) => {
        e.preventDefault()
        setIsDragOver(true)
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      onClick={() => setSelectedNodes(new Set())}
      style={{
        flex: 1,
        backgroundColor: isDragOver ? '#EFF6FF' : '#FFFFFF',
        position: 'relative',
        overflow: 'hidden',
        transition: 'background-color 0.2s ease',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          zIndex: 10,
        }}
      >
        <div
          style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: activeTheme.color,
          }}
        />
        <span style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937' }}>
          {activeTheme.name}
        </span>
        <span style={{ fontSize: '12px', color: '#9CA3AF' }}>
          {activeThemeData?.nodes.length || 0} 个节点
        </span>
      </div>

      {isDragOver && (
        <div
          style={{
            position: 'absolute',
            inset: '20px',
            border: '2px dashed #3B82F6',
            borderRadius: '12px',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#3B82F6',
            fontSize: '14px',
            zIndex: 100,
          }}
        >
          释放以添加到主题
        </div>
      )}

      <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6B7280" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#6B7280" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#6B7280" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        {activeThemeData?.links.map((link, idx) => {
          const source = nodes.find((n) => n.inspirationId === link.source)
          const target = nodes.find((n) => n.inspirationId === link.target)
          if (!source || !target) return null
          return (
            <path
              key={`${link.source}-${link.target}-${idx}`}
              d={createCurvePath(source, target)}
              fill="none"
              stroke="url(#lineGradient)"
              strokeWidth="1.5"
              strokeDasharray="1000"
              style={{
                animation: 'pathGrow 0.5s ease forwards',
              }}
            />
          )
        })}
      </svg>

      {nodes.map((node) => {
        const inspiration = getInspirationById(node.inspirationId)
        if (!inspiration) return null
        const color = typeColors[inspiration.type]
        const isSelected = selectedNodes.has(node.inspirationId)
        const isEditing = editingNodeId === node.inspirationId

        return (
          <div
            key={node.inspirationId}
            className="canvas-node"
            onMouseDown={(e) => handleMouseDown(e, node)}
            onDoubleClick={() => handleDoubleClick(node)}
            style={{
              position: 'absolute',
              left: node.x,
              top: node.y,
              transform: 'translate(-50%, -50%)',
              backgroundColor: isSelected ? color : '#FFFFFF',
              color: isSelected ? '#FFFFFF' : '#374151',
              padding: '10px 14px',
              borderRadius: '10px',
              boxShadow: isSelected
                ? `0 4px 16px ${color}66`
                : '0 2px 8px rgba(0,0,0,0.1)',
              cursor: 'grab',
              userSelect: 'none',
              border: `2px solid ${color}`,
              minWidth: '100px',
              maxWidth: '160px',
              textAlign: 'center',
              fontSize: '12px',
              zIndex: isSelected ? 5 : 1,
              transition: 'box-shadow 0.2s ease',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '-6px',
                right: '-6px',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: color,
                border: '2px solid #fff',
              }}
            />
            {isEditing ? (
              <input
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitEdit()
                  if (e.key === 'Escape') {
                    setEditingNodeId(null)
                    setEditLabel('')
                  }
                }}
                autoFocus
                style={{
                  width: '100%',
                  backgroundColor: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'inherit',
                  fontSize: '12px',
                  textAlign: 'center',
                  fontFamily: 'inherit',
                }}
              />
            ) : (
              <span style={{ wordBreak: 'break-word' }}>{node.label}</span>
            )}
          </div>
        )
      })}

      {nodes.length === 0 && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            color: '#9CA3AF',
          }}
        >
          <p style={{ fontSize: '14px', marginBottom: '4px' }}>拖拽左侧灵感卡片到这里</p>
          <p style={{ fontSize: '12px' }}>节点将自动关联并生成连接</p>
        </div>
      )}
    </div>
  )
}

export default ThemeCanvas
