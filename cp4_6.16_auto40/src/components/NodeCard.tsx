import React, { useRef, useEffect, useState } from 'react'
import type { StoryNode, NodeOption } from '../store'
import { useStore } from '../store'

interface NodeCardProps {
  node: StoryNode
  isSelected: boolean
  isHighlighted: boolean
  containerRef: React.RefObject<HTMLDivElement | null>
}

const NODE_WIDTH = 280

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
    if ((e.target as HTMLElement).tagName === 'INPUT' ||
        (e.target as HTMLElement).tagName === 'TEXTAREA' ||
        (e.target as HTMLElement).closest('[data-option-port]')) return

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
    option: NodeOption,
    optionIndex: number
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
              worldY <= n.y + 250 &&
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
        className="flex items-center gap-2 group relative"
      >
        <input
          type="text"
          value={option.text}
          onChange={(e) => updateOption(node.id, option.id, { text: e.target.value })}
          placeholder={`选项 ${idx + 1}`}
          className="flex-1 bg-black/30 border border-white/10 rounded px-2 py-1 text-xs
                     focus:border-cyan-400 focus:outline-none focus:shadow-[0_0_8px_rgba(0,255,213,0.3)]
                     text-gray-200 transition-all"
          onClick={(e) => e.stopPropagation()}
        />
        <button
          data-option-port
          onMouseDown={(e) => handleOptionPortMouseDown(e, option, idx)}
          className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center
                      transition-all cursor-crosshair
                      ${connected
                        ? 'bg-cyan-400 border-cyan-400 shadow-[0_0_8px_rgba(0,255,213,0.6)]'
                        : 'bg-transparent border-gray-500 hover:border-magenta hover:shadow-[0_0_8px_rgba(255,0,127,0.6)]'}
                      ${isActiveSource
                        ? 'ring-2 ring-magenta ring-offset-1 ring-offset-bg-primary scale-125'
                        : ''}`}
          style={connected ? { borderColor: '#00ffd5' } : undefined}
          title={connected ? '点击连线重新连接' : '拖拽连线到目标节点'}
        >
          <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-bg-primary' : 'bg-transparent'}`} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            deleteOption(node.id, option.id)
          }}
          className="w-5 h-5 rounded-full bg-red-500/20 text-red-400 opacity-0 group-hover:opacity-100
                     hover:bg-red-500/40 transition-all text-xs flex items-center justify-center
                     disabled:opacity-20 disabled:cursor-not-allowed"
          disabled={node.options.length <= 2}
          title="删除选项"
        >
          ×
        </button>
      </div>
    )
  }

  return (
    <div
      ref={cardRef}
      className={`node-card absolute rounded-xl overflow-hidden transition-shadow
                  ${isDragging ? 'cursor-grabbing z-50' : 'cursor-grab'}
                  ${isSelected ? 'z-40' : 'z-10'}`}
      style={{
        left: node.x,
        top: node.y,
        width: NODE_WIDTH,
      }}
      onMouseDown={handleMouseDown}
    >
      <div
        className={`glass-panel rounded-xl transition-all duration-200
                    ${isSelected
                      ? 'border-cyan-400 shadow-[0_0_20px_rgba(0,255,213,0.4),0_0_40px_rgba(0,255,213,0.1)]'
                      : 'hover:border-cyan-400/50 hover:shadow-[0_0_15px_rgba(0,255,213,0.2)]'}
                    ${node.isStart ? 'border-l-4' : ''}
                    ${node.isEnd ? 'border-r-4' : ''}`}
        style={{
          borderLeftWidth: node.isStart ? '4px' : undefined,
          borderLeftColor: node.isStart ? '#00ffd5' : undefined,
          borderRightWidth: node.isEnd ? '4px' : undefined,
          borderRightColor: node.isEnd ? '#ff007f' : undefined,
        }}
      >
        <div
          className={`px-4 py-2 flex items-center justify-between border-b border-white/5
                      ${node.isStart ? 'bg-cyan-400/10' : ''}
                      ${node.isEnd ? 'bg-magenta/10' : ''}`}
          style={
            node.isEnd
              ? { backgroundColor: 'rgba(255, 0, 127, 0.1)' }
              : undefined
          }
        >
          <input
            type="text"
            value={node.title}
            onChange={(e) => updateNode(node.id, { title: e.target.value })}
            className="flex-1 bg-transparent text-sm font-semibold text-cyan-100
                       focus:outline-none font-orbitron tracking-wider"
            onClick={(e) => e.stopPropagation()}
            style={{ fontFamily: "'Orbitron', sans-serif" }}
          />
          <div className="flex items-center gap-1">
            {node.isStart && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded font-bold"
                style={{
                  backgroundColor: 'rgba(0, 255, 213, 0.2)',
                  color: '#00ffd5',
                }}
              >
                START
              </span>
            )}
            {node.isEnd && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded font-bold"
                style={{
                  backgroundColor: 'rgba(255, 0, 127, 0.2)',
                  color: '#ff007f',
                }}
              >
                END
              </span>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation()
                deleteNode(node.id)
              }}
              className="w-6 h-6 rounded-md bg-red-500/20 text-red-400 opacity-0 group-hover:opacity-100
                         hover:bg-red-500/40 transition-all text-xs flex items-center justify-center"
              title="删除节点"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-4">
          <div className="mb-3">
            <textarea
              value={node.description}
              onChange={(e) => updateNode(node.id, { description: e.target.value })}
              placeholder="场景描述..."
              rows={4}
              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-300
                         focus:border-cyan-400 focus:outline-none focus:shadow-[0_0_8px_rgba(0,255,213,0.3)]
                         resize-none transition-all leading-relaxed"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">
                选项出口
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  addOption(node.id)
                }}
                disabled={node.options.length >= 4}
                className="text-[10px] px-2 py-1 rounded-md border transition-all
                           hover:shadow-[0_0_8px_rgba(0,255,213,0.5)] hover:-translate-y-0.5
                           disabled:opacity-30 disabled:hover:translate-y-0 disabled:hover:shadow-none"
                style={{
                  borderColor: 'rgba(0, 255, 213, 0.4)',
                  color: '#00ffd5',
                }}
              >
                + 添加
              </button>
            </div>
            {node.options.map((opt, idx) => renderOptionPort(opt, idx))}
            {node.options.length === 0 && (
              <div
                className="text-[11px] text-center py-4 rounded-lg border border-dashed"
                style={{ borderColor: 'rgba(255, 0, 127, 0.3)', color: '#ff007f' }}
              >
                结局节点 — 无选项出口
              </div>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
            <label className="flex items-center gap-1.5 cursor-pointer">
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
                className="w-3 h-3 accent-cyan-400"
                onClick={(e) => e.stopPropagation()}
              />
              <span className="text-[10px] text-gray-400">起始点</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={node.isEnd || false}
                onChange={(e) => {
                  e.stopPropagation()
                  updateNode(node.id, { isEnd: e.target.checked })
                }}
                className="w-3 h-3"
                style={{ accentColor: '#ff007f' }}
                onClick={(e) => e.stopPropagation()}
              />
              <span className="text-[10px] text-gray-400">结局</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NodeCard
