import React, { useState, useRef, useEffect } from 'react'
import { useStore } from '../store'
import type { StoryNode } from '../store'

interface NodePanelProps {
  containerRef: React.RefObject<HTMLDivElement | null>
}

const NodePanel: React.FC<NodePanelProps> = ({ containerRef }) => {
  const {
    nodes,
    reorderNodes,
    panToNode,
    setPanelOpen,
    panelOpen,
    addNode,
    selectedNodeId,
    setSelectedNodeId,
    highlightedNodeId,
  } = useStore()

  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isNarrowScreen, setIsNarrowScreen] = useState(false)
  const dragOverIndex = useRef<number | null>(null)

  useEffect(() => {
    const checkWidth = () => {
      setIsNarrowScreen(window.innerWidth < 768)
    }
    checkWidth()
    window.addEventListener('resize', checkWidth)
    return () => window.removeEventListener('resize', checkWidth)
  }, [])

  const handleFocusNode = (nodeId: string) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    panToNode(nodeId, rect.width, rect.height)
    setSelectedNodeId(nodeId)
    setIsMobileMenuOpen(false)
  }

  const handleDragStart = (index: number) => {
    setDragIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    dragOverIndex.current = index
  }

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault()
    if (dragIndex !== null && dragIndex !== toIndex) {
      reorderNodes(dragIndex, toIndex)
    }
    setDragIndex(null)
    dragOverIndex.current = null
  }

  const handleDragEnd = () => {
    setDragIndex(null)
    dragOverIndex.current = null
  }

  const renderNodeItem = (node: StoryNode, index: number) => (
    <div
      key={node.id}
      draggable
      onDragStart={() => handleDragStart(index)}
      onDragOver={(e) => handleDragOver(e, index)}
      onDrop={(e) => handleDrop(e, index)}
      onDragEnd={handleDragEnd}
      onClick={() => handleFocusNode(node.id)}
      className={`group relative px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200
                  border mb-1.5
                  ${selectedNodeId === node.id
                    ? 'bg-cyan-400/15 border-cyan-400/50'
                    : 'hover:bg-white/8 hover:border-cyan-400/30'}
                  ${highlightedNodeId === node.id ? 'node-highlight' : ''}
                  ${dragIndex === index ? 'opacity-40 scale-95' : ''}`}
      style={{
        backgroundColor: selectedNodeId === node.id ? 'rgba(0, 255, 213, 0.15)' : 'rgba(255, 255, 255, 0.03)',
        borderColor: dragOverIndex.current === index && dragIndex !== index
          ? '#ff007f'
          : selectedNodeId === node.id
          ? 'rgba(0, 255, 213, 0.5)'
          : 'rgba(255, 255, 255, 0.05)',
        boxShadow: selectedNodeId === node.id ? '0 0 10px rgba(0, 255, 213, 0.2)' : undefined,
      }}
    >
      <div className="flex items-center gap-2">
        <div
          className="flex-shrink-0 w-5 h-5 flex items-center justify-center cursor-grab active:cursor-grabbing
                     opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ color: '#6b7280' }}>
            <circle cx="9" cy="6" r="1.5" fill="currentColor" />
            <circle cx="15" cy="6" r="1.5" fill="currentColor" />
            <circle cx="9" cy="12" r="1.5" fill="currentColor" />
            <circle cx="15" cy="12" r="1.5" fill="currentColor" />
            <circle cx="9" cy="18" r="1.5" fill="currentColor" />
            <circle cx="15" cy="18" r="1.5" fill="currentColor" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-300 truncate font-medium">
              {node.title || '未命名节点'}
            </span>
            {node.isStart && (
              <span
                className="text-[9px] px-1 py-0.5 rounded font-bold flex-shrink-0"
                style={{ backgroundColor: 'rgba(0, 255, 213, 0.2)', color: '#00ffd5' }}
              >
                S
              </span>
            )}
            {node.isEnd && (
              <span
                className="text-[9px] px-1 py-0.5 rounded font-bold flex-shrink-0"
                style={{ backgroundColor: 'rgba(255, 0, 127, 0.2)', color: '#ff007f' }}
              >
                E
              </span>
            )}
          </div>
          <div className="text-[10px] text-gray-500 truncate mt-0.5">
            {node.options.length} 个选项 · ID: {node.id.slice(-4)}
          </div>
        </div>
        <div
          className="flex-shrink-0 w-2 h-2 rounded-full transition-all"
          style={{
            backgroundColor: node.isStart ? '#00ffd5' : node.isEnd ? '#ff007f' : '#4a5568',
            boxShadow: node.isStart
              ? '0 0 6px rgba(0, 255, 213, 0.8)'
              : node.isEnd
              ? '0 0 6px rgba(255, 0, 127, 0.8)'
              : undefined,
          }}
        />
      </div>
    </div>
  )

  const PanelContent = () => (
    <>
      <div
        className="px-4 py-3 border-b border-white/10 flex items-center justify-between"
        style={{ borderColor: 'rgba(255,255,255,0.1)' }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #00ffd5 0%, #ff007f 100%)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a1a2e" strokeWidth="2.5">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
          </div>
          <div>
            <div
              className="text-sm font-bold tracking-wider"
              style={{ fontFamily: "'Orbitron', sans-serif", color: '#00ffd5' }}
            >
              NODES
            </div>
            <div className="text-[10px] text-gray-500">{nodes.length} 个节点</div>
          </div>
        </div>
        {isNarrowScreen && (
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="w-7 h-7 rounded-md hover:bg-white/10 flex items-center justify-center text-gray-400"
          >
            ×
          </button>
        )}
      </div>

      <div className="p-3">
        <button
          onClick={() => addNode()}
          className="w-full py-2.5 rounded-lg text-xs font-semibold transition-all
                     border-2 hover:-translate-y-0.5 active:translate-y-0 mb-3"
          style={{
            borderColor: '#00ffd5',
            color: '#00ffd5',
            background: 'rgba(0, 255, 213, 0.05)',
            fontFamily: "'Orbitron', sans-serif",
            letterSpacing: '0.1em',
            boxShadow: '0 0 0 rgba(0,255,213,0)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 0 15px rgba(0,255,213,0.5)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 0 0 rgba(0,255,213,0)'
          }}
        >
          + 新建节点
        </button>

        <div className="text-[10px] uppercase tracking-wider text-gray-600 px-1 mb-2 font-bold">
          节点列表（拖拽排序 / 点击聚焦）
        </div>

        <div className="overflow-y-auto pr-1 space-y-1" style={{ maxHeight: 'calc(100vh - 260px)' }}>
          {nodes.map((node, index) => renderNodeItem(node, index))}
        </div>

        <div className="mt-4 pt-3 border-t border-white/10">
          <div className="text-[10px] text-gray-500 space-y-1 leading-relaxed px-1">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#00ffd5' }} />
              <span>青边 = 起始节点</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#ff007f' }} />
              <span>品红边 = 结局节点</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )

  const shouldShowPanel = isNarrowScreen ? isMobileMenuOpen : panelOpen

  return (
    <>
      <button
        className={`fixed top-4 left-4 z-50 w-10 h-10 rounded-xl
                   flex items-center justify-center transition-all glass-panel
                   hover:shadow-[0_0_15px_rgba(0,255,213,0.3)]`}
        style={{
          display: isNarrowScreen && !isMobileMenuOpen ? 'flex' : 'none',
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(16px)',
        }}
        onClick={() => setIsMobileMenuOpen(true)}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00ffd5" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      <div
        className="fixed z-40 transition-all duration-300 ease-out
                    glass-panel overflow-hidden shadow-2xl"
        style={{
          left: 0,
          top: isNarrowScreen ? 0 : 16,
          bottom: isNarrowScreen ? 0 : 16,
          width: isNarrowScreen ? '18rem' : '16rem',
          height: isNarrowScreen ? '100%' : 'auto',
          borderRadius: isNarrowScreen ? 0 : 16,
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(16px)',
          backgroundColor: 'rgba(26, 26, 46, 0.7)',
          transform: shouldShowPanel ? 'translateX(0)' : 'translateX(-110%)',
        }}
      >
        <PanelContent />
      </div>

      {isMobileMenuOpen && isNarrowScreen && (
        <div
          className="fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {!isNarrowScreen && (
        <button
          onClick={() => setPanelOpen(!panelOpen)}
          className="fixed z-40 top-1/2 -translate-y-1/2 w-5 h-16 items-center justify-center
                     transition-all duration-300 glass-panel rounded-r-lg flex"
          style={{
            left: panelOpen ? 'calc(16rem - 1px)' : 0,
            backdropFilter: 'blur(16px)',
            backgroundColor: 'rgba(26, 26, 46, 0.7)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderLeft: 'none',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 0 10px rgba(0,255,213,0.4)'
            e.currentTarget.style.borderColor = 'rgba(0, 255, 213, 0.5)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = 'none'
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
            e.currentTarget.style.borderLeft = 'none'
          }}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#00ffd5"
            strokeWidth="2.5"
            style={{ transform: panelOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }}
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      )}
    </>
  )
}

export default NodePanel
