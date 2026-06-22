import React, { useRef, useEffect, useState } from 'react'
import type { StoryNode, NodeOption } from '../store'
import { useStore } from '../store'

interface NodeCardProps {
  node: StoryNode
  isSelected: boolean
  isHighlighted: boolean
  containerRef: React.RefObject<HTMLDivElement | null>
}

const NODE_WIDTH = 260

const NodeCard: React.FC<NodeCardProps> = ({ node, isSelected, isHighlighted, containerRef }) => {
  const cardRef = useRef<HTMLDivElement>(null)
  const {
    updateNode,
    deleteNode,
    addOption,
    updateOption,
    deleteOption,
    setSelectedNodeId,
    setDragState,
    setConnecting,
    connecting,
    addConnection,
    nodes,
  } = useStore()

  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    if (isHighlighted && cardRef.current) {
      cardRef.current.classList.add('node-highlight')
      const timer = setTimeout(() => {
        cardRef.current?.classList.remove('node-highlight')
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [isHighlighted])

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
    if (target.closest('.option-area')) return

    e.preventDefault()
    e.stopPropagation()
    setSelectedNodeId(node.id)

    const panState = useStore.getState().panState
    setDragState({
      isDragging: true,
      nodeId: node.id,
      startX: e.clientX,
      startY: e.clientY,
      nodeStartX: node.x,
      nodeStartY: node.y,
    })
    setIsDragging(true)

    const handleMouseMove = (moveE: MouseEvent) => {
      const { dragState, panState: currentPan } = useStore.getState()
      if (!dragState.isDragging || dragState.nodeId !== node.id) return

      const dx = (moveE.clientX - dragState.startX) / currentPan.scale
      const dy = (moveE.clientY - dragState.startY) / currentPan.scale

      updateNode(node.id, {
        x: dragState.nodeStartX + dx,
        y: dragState.nodeStartY + dy,
      })
    }

    const handleMouseUp = () => {
      setDragState({ isDragging: false, nodeId: null })
      setIsDragging(false)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  const handleOptionPortMouseDown = (
    e: React.MouseEvent,
    option: NodeOption
  ) => {
    e.preventDefault()
    e.stopPropagation()

    const panState = useStore.getState().panState
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const containerRect = containerRef.current?.getBoundingClientRect()
    if (!containerRect) return

    setConnecting({
      isConnecting: true,
      sourceNodeId: node.id,
      sourceOptionId: option.id,
      mouseX: (rect.left + rect.width / 2 - containerRect.left) / panState.scale,
      mouseY: (rect.top + rect.height / 2 - containerRect.top) / panState.scale,
    })

    const handleMouseMove = (moveE: MouseEvent) => {
      const { panState: currentPan, connecting: currentConn } = useStore.getState()
      if (!currentConn.isConnecting) return
      const cRect = containerRef.current?.getBoundingClientRect()
      if (!cRect) return

      setConnecting({
        mouseX: (moveE.clientX - cRect.left) / currentPan.scale,
        mouseY: (moveE.clientY - cRect.top) / currentPan.scale,
      })
    }

    const handleMouseUp = (upE: MouseEvent) => {
      const { connecting: currentConn, nodes: allNodes } = useStore.getState()

      if (currentConn.isConnecting && currentConn.sourceNodeId && currentConn.sourceOptionId) {
        const cRect = containerRef.current?.getBoundingClientRect()
        if (cRect) {
          const worldX = (upE.clientX - cRect.left) / useStore.getState().panState.scale
          const worldY = (upE.clientY - cRect.top) / useStore.getState().panState.scale

          const target = allNodes.find(
            (n) =>
              worldX >= n.x &&
              worldX <= n.x + NODE_WIDTH &&
              worldY >= n.y &&
              worldY <= n.y + 350 &&
              n.id !== currentConn.sourceNodeId
          )

          if (target) {
            addConnection(
              currentConn.sourceNodeId,
              currentConn.sourceOptionId,
              target.id
            )
          }
        }
      }

      setConnecting({ isConnecting: false, sourceNodeId: null, sourceOptionId: null })
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  const renderOptionPort = (option: NodeOption, idx: number) => {
    const connected = option.targetNodeId !== null
    const isActiveSource =
      connecting.isConnecting &&
      connecting.sourceNodeId === node.id &&
      connecting.sourceOptionId === option.id

    return (
      <div
        key={option.id}
        className="option-area flex items-center gap-1.5 group"
        style={{ marginBottom: idx < node.options.length - 1 ? 6 : 0 }}
      >
        <input
          type="text"
          value={option.text}
          onChange={(e) => updateOption(node.id, option.id, { text: e.target.value })}
          placeholder={`选项 ${idx + 1}`}
          onClick={(e) => e.stopPropagation()}
          style={{
            flex: 1,
            minWidth: 0,
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 4,
            padding: '5px 8px',
            fontSize: 11,
            color: '#e0e0e0',
            outline: 'none',
            transition: 'all 0.15s',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#00ffd5'
            e.currentTarget.style.boxShadow = '0 0 8px rgba(0,255,213,0.3)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        />
        <button
          onMouseDown={(e) => handleOptionPortMouseDown(e, option)}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: 18,
            height: 18,
            borderRadius: '50%',
            border: `2px solid ${connected ? '#00ffd5' : isActiveSource ? '#ff007f' : '#555'}`,
            background: connected ? '#00ffd5' : 'transparent',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'crosshair',
            boxShadow: connected ? '0 0 8px rgba(0,255,213,0.6)' : isActiveSource ? '0 0 8px rgba(255,0,127,0.6)' : 'none',
            transition: 'all 0.15s',
            transform: isActiveSource ? 'scale(1.3)' : 'scale(1)',
          }}
          title={connected ? '重新连线' : '拖拽连线'}
        >
          {connected && <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#1a1a2e' }} />}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            deleteOption(node.id, option.id)
          }}
          disabled={node.options.length <= 2}
          style={{
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: 'rgba(239,68,68,0.2)',
            color: '#f87171',
            border: 'none',
            cursor: node.options.length <= 2 ? 'not-allowed' : 'pointer',
            opacity: node.options.length <= 2 ? 0.3 : 0,
            fontSize: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'opacity 0.15s',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => { if (node.options.length > 2) e.currentTarget.style.opacity = '1' }}
          onMouseLeave={(e) => { if (node.options.length > 2) e.currentTarget.style.opacity = '0' }}
        >
          ×
        </button>
      </div>
    )
  }

  return (
    <div
      ref={cardRef}
      className="node-card"
      style={{
        position: 'absolute',
        left: node.x,
        top: node.y,
        width: NODE_WIDTH,
        zIndex: isDragging ? 50 : isSelected ? 40 : 10,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onMouseDown={handleMouseDown}
    >
      <div
        style={{
          background: 'rgba(26, 26, 46, 0.75)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: `1px solid ${
            isSelected
              ? '#00ffd5'
              : node.isStart
              ? 'rgba(0,255,213,0.4)'
              : node.isEnd
              ? 'rgba(255,0,127,0.4)'
              : 'rgba(255,255,255,0.1)'
          }`,
          borderLeft: node.isStart ? '4px solid #00ffd5' : undefined,
          borderRight: node.isEnd ? '4px solid #ff007f' : undefined,
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: isSelected
            ? '0 0 20px rgba(0,255,213,0.4), 0 0 40px rgba(0,255,213,0.1)'
            : '0 4px 20px rgba(0,0,0,0.3)',
          transition: 'box-shadow 0.2s, border-color 0.2s',
        }}
        onMouseEnter={(e) => {
          if (!isSelected) {
            e.currentTarget.style.borderColor = 'rgba(0,255,213,0.5)'
            e.currentTarget.style.boxShadow = '0 0 15px rgba(0,255,213,0.2), 0 4px 20px rgba(0,0,0,0.4)'
          }
        }}
        onMouseLeave={(e) => {
          if (!isSelected) {
            e.currentTarget.style.borderColor = node.isStart
              ? 'rgba(0,255,213,0.4)'
              : node.isEnd
              ? 'rgba(255,0,127,0.4)'
              : 'rgba(255,255,255,0.1)'
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)'
          }
        }}
      >
        <div
          style={{
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            background: node.isStart
              ? 'rgba(0,255,213,0.08)'
              : node.isEnd
              ? 'rgba(255,0,127,0.08)'
              : 'transparent',
          }}
        >
          <input
            type="text"
            value={node.title}
            onChange={(e) => updateNode(node.id, { title: e.target.value })}
            onClick={(e) => e.stopPropagation()}
            style={{
              flex: 1,
              minWidth: 0,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: 12,
              fontWeight: 600,
              color: '#a5f3fc',
              fontFamily: "'Orbitron', 'Noto Sans SC', sans-serif",
              letterSpacing: '0.05em',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {node.isStart && (
              <span
                style={{
                  fontSize: 9,
                  padding: '2px 5px',
                  borderRadius: 3,
                  fontWeight: 700,
                  background: 'rgba(0,255,213,0.2)',
                  color: '#00ffd5',
                  fontFamily: "'Orbitron', sans-serif",
                }}
              >
                S
              </span>
            )}
            {node.isEnd && (
              <span
                style={{
                  fontSize: 9,
                  padding: '2px 5px',
                  borderRadius: 3,
                  fontWeight: 700,
                  background: 'rgba(255,0,127,0.2)',
                  color: '#ff007f',
                  fontFamily: "'Orbitron', sans-serif",
                }}
              >
                E
              </span>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (confirm('确定删除这个节点？')) deleteNode(node.id)
              }}
              style={{
                width: 22,
                height: 22,
                borderRadius: 5,
                background: 'transparent',
                color: '#f87171',
                border: 'none',
                cursor: 'pointer',
                fontSize: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0,
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '1'
                e.currentTarget.style.background = 'rgba(239,68,68,0.2)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '0'
                e.currentTarget.style.background = 'transparent'
              }}
              title="删除节点"
            >
              ×
            </button>
          </div>
        </div>

        <div style={{ padding: 12 }}>
          <textarea
            value={node.description}
            onChange={(e) => updateNode(node.id, { description: e.target.value })}
            onClick={(e) => e.stopPropagation()}
            placeholder="在这里描述场景..."
            rows={4}
            style={{
              width: '100%',
              resize: 'none',
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 6,
              padding: '8px 10px',
              fontSize: 11,
              color: '#d1d5db',
              outline: 'none',
              lineHeight: 1.6,
              marginBottom: 12,
              transition: 'all 0.15s',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#00ffd5'
              e.currentTarget.style.boxShadow = '0 0 8px rgba(0,255,213,0.3)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          />

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}
          >
            <span
              style={{
                fontSize: 9,
                letterSpacing: '0.1em',
                fontWeight: 700,
                color: '#6b7280',
                fontFamily: "'Orbitron', sans-serif",
              }}
            >
              选项出口
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                addOption(node.id)
              }}
              disabled={node.options.length >= 4}
              style={{
                fontSize: 10,
                padding: '3px 8px',
                borderRadius: 5,
                border: '1px solid rgba(0,255,213,0.4)',
                color: '#00ffd5',
                background: 'rgba(0,255,213,0.05)',
                cursor: node.options.length >= 4 ? 'not-allowed' : 'pointer',
                opacity: node.options.length >= 4 ? 0.4 : 1,
                transition: 'all 0.15s',
                fontWeight: 600,
              }}
              onMouseEnter={(e) => {
                if (node.options.length < 4) {
                  e.currentTarget.style.boxShadow = '0 0 10px rgba(0,255,213,0.4)'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              + 添加
            </button>
          </div>

          <div style={{ minHeight: 10 }}>
            {node.options.map((opt, idx) => renderOptionPort(opt, idx))}
          </div>

          {node.options.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                padding: '14px 8px',
                borderRadius: 8,
                border: '1px dashed rgba(255,0,127,0.3)',
                color: '#ff007f',
                fontSize: 11,
              }}
            >
              结局节点 · 无选项
            </div>
          )}

          <div
            style={{
              marginTop: 12,
              paddingTop: 10,
              borderTop: '1px solid rgba(255,255,255,0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                cursor: 'pointer',
                fontSize: 10,
                color: '#9ca3af',
              }}
            >
              <input
                type="checkbox"
                checked={node.isStart || false}
                onChange={(e) => {
                  e.stopPropagation()
                  if (e.target.checked) {
                    nodes.forEach((n) => {
                      if (n.id !== node.id && n.isStart) {
                        updateNode(n.id, { isStart: false })
                      }
                    })
                  }
                  updateNode(node.id, { isStart: e.target.checked })
                }}
                onClick={(e) => e.stopPropagation()}
                style={{ accentColor: '#00ffd5', width: 11, height: 11 }}
              />
              起始
            </label>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                cursor: 'pointer',
                fontSize: 10,
                color: '#9ca3af',
              }}
            >
              <input
                type="checkbox"
                checked={node.isEnd || false}
                onChange={(e) => {
                  e.stopPropagation()
                  updateNode(node.id, { isEnd: e.target.checked })
                }}
                onClick={(e) => e.stopPropagation()}
                style={{ accentColor: '#ff007f', width: 11, height: 11 }}
              />
              结局
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NodeCard
