import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useGameStore, type NodeType, type StoryNode } from '../../store/gameStore'
import NodeEditor from './NodeEditor'

const NODE_COLORS: Record<NodeType, string> = {
  dialogue: '#4A4E69',
  choice: '#9B59B6',
  event: '#2ECC71',
}

const NODE_TYPE_LABELS: Record<NodeType, string> = {
  dialogue: '对话',
  choice: '选择',
  event: '事件',
}

export default function EditorCanvas() {
  const {
    nodes,
    selectedNodeId,
    selectNode,
    addNode,
    removeNode,
    moveNode,
    importStory,
    exportStory,
    importResult,
    setImportResult,
    updateNode,
    addConnection,
    removeConnection,
  } = useGameStore()

  const [dragging, setDragging] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1200)
  const [showImportModal, setShowImportModal] = useState(false)
  const [filterType, setFilterType] = useState<NodeType | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const filteredNodes = filterType
    ? nodes.filter((n) => n.type === filterType)
    : nodes

  const toggleFilter = (type: NodeType) => {
    setFilterType((prev) => (prev === type ? null : type))
  }

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 1200)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  useEffect(() => {
    if (importResult) {
      setShowImportModal(true)
    }
  }, [importResult])

  const handleMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId)
    if (!node) return
    e.stopPropagation()
    setDragging(nodeId)
    setDragOffset({ x: e.clientX - node.x, y: e.clientY - node.y })
  }, [nodes])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return
    const x = Math.max(0, e.clientX - dragOffset.x)
    const y = Math.max(0, e.clientY - dragOffset.y)
    moveNode(dragging, x, y)
  }, [dragging, dragOffset, moveNode])

  const handleMouseUp = useCallback(() => {
    setDragging(null)
  }, [])

  const handleCanvasClick = useCallback(() => {
    if (!dragging) {
      selectNode(null)
    }
  }, [dragging, selectNode])

  const handleExport = useCallback(() => {
    const json = exportStory()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'story.json'
    a.click()
    URL.revokeObjectURL(url)
  }, [exportStory])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.name.endsWith('.json')) {
      const reader = new FileReader()
      reader.onload = (ev) => {
        const text = ev.target?.result as string
        importStory(text)
      }
      reader.readAsText(file)
    }
  }, [importStory])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (ev) => {
        const text = ev.target?.result as string
        importStory(text)
      }
      reader.readAsText(file)
    }
    e.target.value = ''
  }, [importStory])

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) ?? null

  const renderSidebar = () => (
    <div
      style={{
        width: isMobile ? '100%' : '280px',
        height: isMobile ? '64px' : '100%',
        backgroundColor: '#1E1E2E',
        borderRight: isMobile ? 'none' : '1px solid #4A4E69',
        borderBottom: isMobile ? '1px solid #4A4E69' : 'none',
        overflowX: isMobile ? 'auto' : 'hidden',
        overflowY: isMobile ? 'hidden' : 'auto',
        display: 'flex',
        flexDirection: isMobile ? 'row' : 'column',
        alignItems: isMobile ? 'center' : 'stretch',
        padding: isMobile ? '0 12px' : '12px',
        gap: isMobile ? '8px' : '8px',
        flexShrink: 0,
      }}
    >
      {!isMobile && (
        <div style={{ marginBottom: '8px' }}>
          <span style={{ fontSize: '16px', fontWeight: 600, color: '#E2E8F0' }}>故事节点</span>
          <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
            {(['dialogue', 'choice', 'event'] as NodeType[]).map((type) => (
              <button
                key={type}
                onClick={() => toggleFilter(type)}
                style={{
                  height: '32px',
                  padding: '0 14px',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: filterType === type ? '#FFFFFF' : '#B2BEC3',
                  backgroundColor: filterType === type ? NODE_COLORS[type] : '#2D2D3F',
                  border: `1px solid ${filterType === type ? NODE_COLORS[type] : '#4A4E69'}`,
                  borderRadius: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (filterType !== type) {
                    e.currentTarget.style.backgroundColor = '#3D3D52'
                    e.currentTarget.style.borderColor = '#6C5CE7'
                  }
                }}
                onMouseLeave={(e) => {
                  if (filterType !== type) {
                    e.currentTarget.style.backgroundColor = '#2D2D3F'
                    e.currentTarget.style.borderColor = '#4A4E69'
                  }
                }}
              >
                {NODE_TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        </div>
      )}
      <div
        style={{
          display: 'flex',
          flexDirection: isMobile ? 'row' : 'column',
          gap: '6px',
          overflow: isMobile ? 'auto' : 'auto',
          flex: isMobile ? '0 0 auto' : '1 1 auto',
        }}
      >
        {filteredNodes.map((node) => (
          <div
            key={node.id}
            onClick={() => selectNode(node.id)}
            style={{
              height: '60px',
              minHeight: isMobile ? '48px' : '60px',
              width: isMobile ? 'auto' : '100%',
              padding: isMobile ? '8px 16px' : '0 12px',
              paddingRight: isMobile ? '16px' : '12px',
              borderRadius: '8px',
              backgroundColor: NODE_COLORS[node.type],
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              position: 'relative',
              transition: 'opacity 0.15s, transform 0.15s',
              opacity: selectedNodeId === node.id ? 1 : 0.7,
              transform: selectedNodeId === node.id ? 'scale(1.02)' : 'scale(1)',
              border: selectedNodeId === node.id ? '2px solid #F39C12' : '2px solid transparent',
              whiteSpace: isMobile ? 'nowrap' : 'normal',
            }}
          >
            <span
              style={{
                fontSize: '14px',
                color: '#FFFFFF',
                fontWeight: 500,
                paddingRight: isMobile ? '0' : '50px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {node.title}
            </span>
            <span
              style={{
                fontSize: '11px',
                color: '#B2BEC3',
                position: 'absolute',
                right: '8px',
                bottom: '8px',
              }}
            >
              {NODE_TYPE_LABELS[node.type]}
            </span>
          </div>
        ))}
      </div>
      {!isMobile && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
          <button
            onClick={() => addNode('dialogue')}
            style={addBtnStyle('#4A4E69')}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85' }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
          >
            + 对话节点
          </button>
          <button
            onClick={() => addNode('choice')}
            style={addBtnStyle('#9B59B6')}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85' }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
          >
            + 选择节点
          </button>
          <button
            onClick={() => addNode('event')}
            style={addBtnStyle('#2ECC71')}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85' }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
          >
            + 事件节点
          </button>
        </div>
      )}
    </div>
  )

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        backgroundColor: '#12121D',
        overflow: 'hidden',
      }}
    >
      {renderSidebar()}

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'row',
          minWidth: isMobile ? '100%' : '800px',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleCanvasClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          style={{
            flex: 1,
            position: 'relative',
            overflow: 'hidden',
            backgroundColor: '#12121D',
            backgroundImage:
              'radial-gradient(circle, #2D2D3F 1px, transparent 1px)',
            backgroundSize: '30px 30px',
            cursor: dragging ? 'grabbing' : 'default',
          }}
        >
          {nodes.map((node) => (
            <CanvasNode
              key={node.id}
              node={node}
              isSelected={selectedNodeId === node.id}
              onMouseDown={handleMouseDown}
              onClick={() => selectNode(node.id)}
            />
          ))}

          {nodes.length === 0 && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                color: '#4A4E69',
                pointerEvents: 'none',
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📜</div>
              <div style={{ fontSize: '18px' }}>拖拽 JSON 文件到此处导入故事</div>
              <div style={{ fontSize: '14px', marginTop: '8px' }}>或使用左侧按钮添加节点</div>
            </div>
          )}

          <div
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              display: 'flex',
              gap: '8px',
              zIndex: 10,
            }}
          >
            <button
              onClick={() => fileInputRef.current?.click()}
              style={toolbarBtnStyle}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#4A4E69' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#2D2D3F' }}
            >
              导入故事
            </button>
            <button
              onClick={handleExport}
              style={toolbarBtnStyle}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#4A4E69' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#2D2D3F' }}
            >
              导出故事
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
          </div>

          {isMobile && (
            <div
              style={{
                position: 'absolute',
                bottom: '12px',
                left: '12px',
                display: 'flex',
                gap: '6px',
                zIndex: 10,
              }}
            >
              <button onClick={() => addNode('dialogue')} style={addBtnStyle('#4A4E69')}>+对话</button>
              <button onClick={() => addNode('choice')} style={addBtnStyle('#9B59B6')}>+选择</button>
              <button onClick={() => addNode('event')} style={addBtnStyle('#2ECC71')}>+事件</button>
            </div>
          )}
        </div>

        {selectedNode && (
          <NodeEditor
            node={selectedNode}
            onUpdate={(updates) => updateNode(selectedNode.id, updates)}
            onDelete={() => {
              removeNode(selectedNode.id)
              selectNode(null)
            }}
            onAddConnection={(conn) => addConnection(selectedNode.id, conn)}
            onRemoveConnection={(targetId) => removeConnection(selectedNode.id, targetId)}
            onClose={() => selectNode(null)}
            allNodes={nodes}
          />
        )}
      </div>

      {showImportModal && importResult && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => {
            setShowImportModal(false)
            setImportResult(null)
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '400px',
              height: '200px',
              borderRadius: '16px',
              backgroundColor: '#2D2D3F',
              border: importResult.success ? '2px solid #2ECC71' : '2px solid #E74C3C',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
            }}
          >
            <span style={{ fontSize: '40px' }}>
              {importResult.success ? '✅' : '❌'}
            </span>
            <span style={{ fontSize: '16px', color: '#E2E8F0', textAlign: 'center', padding: '0 20px' }}>
              {importResult.message}
            </span>
            <button
              onClick={() => {
                setShowImportModal(false)
                setImportResult(null)
              }}
              style={{
                padding: '8px 24px',
                backgroundColor: '#6C5CE7',
                color: '#E2E8F0',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#A29BFE' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#6C5CE7' }}
            >
              确定
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function CanvasNode({
  node,
  isSelected,
  onMouseDown,
  onClick,
}: {
  node: StoryNode
  isSelected: boolean
  onMouseDown: (e: React.MouseEvent, id: string) => void
  onClick: () => void
}) {
  return (
    <div
      onMouseDown={(e) => onMouseDown(e, node.id)}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      style={{
        position: 'absolute',
        left: node.x,
        top: node.y,
        width: '180px',
        padding: '12px',
        borderRadius: '8px',
        backgroundColor: NODE_COLORS[node.type],
        border: isSelected ? '2px solid #F39C12' : '2px solid rgba(255,255,255,0.1)',
        cursor: 'grab',
        userSelect: 'none',
        transition: 'box-shadow 0.15s, border-color 0.15s',
        boxShadow: isSelected
          ? '0 0 16px rgba(243,156,18,0.4)'
          : '0 2px 8px rgba(0,0,0,0.3)',
        zIndex: isSelected ? 10 : 1,
      }}
    >
      <div style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF', marginBottom: '4px' }}>
        {node.title}
      </div>
      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginBottom: '6px' }}>
        {NODE_TYPE_LABELS[node.type]}
      </div>
      {node.outputs.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {node.outputs.map((out, i) => (
            <span
              key={i}
              style={{
                fontSize: '10px',
                padding: '2px 6px',
                borderRadius: '4px',
                backgroundColor: 'rgba(0,0,0,0.3)',
                color: 'rgba(255,255,255,0.8)',
              }}
            >
              → {out.label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function addBtnStyle(bg: string): React.CSSProperties {
  return {
    padding: '8px 12px',
    backgroundColor: bg,
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500,
    transition: 'opacity 0.15s, transform 0.15s',
    opacity: 1,
    whiteSpace: 'nowrap',
  }
}

const toolbarBtnStyle: React.CSSProperties = {
  padding: '8px 16px',
  backgroundColor: '#2D2D3F',
  color: '#E2E8F0',
  border: '1px solid #4A4E69',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: 500,
  transition: 'background-color 0.2s',
}
