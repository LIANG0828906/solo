import { useMemo } from 'react'
import { useStoryStore } from '../stores/storyStore'

export default function NodeEditor() {
  const {
    nodes,
    connections,
    selectedNodeId,
    selectNode,
    updateNode,
    deleteNode,
    connectNodes,
    updateConnectionLabel,
    deleteConnection,
    setHighlightUnconnected,
  } = useStoryStore()

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) || null,
    [nodes, selectedNodeId]
  )

  const outgoingConnections = useMemo(
    () => connections.filter((c) => c.fromNodeId === selectedNodeId),
    [connections, selectedNodeId]
  )

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedNodeId) return
    const value = e.target.value.slice(0, 30)
    updateNode(selectedNodeId, { title: value })
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!selectedNodeId) return
    const value = e.target.value.slice(0, 500)
    updateNode(selectedNodeId, { text: value })
  }

  const handleAddOption = () => {
    if (!selectedNodeId) return
    setHighlightUnconnected(true)
    setTimeout(() => setHighlightUnconnected(false), 500)
  }

  const handleOptionLabelChange = (connId: string, label: string) => {
    updateConnectionLabel(connId, label)
  }

  const handleDeleteOption = (connId: string) => {
    deleteConnection(connId)
  }

  const handleDeleteNode = () => {
    if (!selectedNodeId || selectedNodeId === 'start') return
    if (confirm('确定要删除这个节点吗？')) {
      deleteNode(selectedNodeId)
    }
  }

  const handleClose = () => {
    selectNode(null)
  }

  if (!selectedNode) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: 400,
          height: '100vh',
          backgroundColor: '#0f172a',
          borderLeft: '1px solid #334155',
          padding: '24px',
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#64748b',
          fontSize: '14px',
          zIndex: 10,
        }}
      >
        点击节点进行编辑
      </div>
    )
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: 400,
        height: '100vh',
        backgroundColor: '#0f172a',
        borderLeft: '1px solid #334155',
        padding: '24px',
        boxSizing: 'border-box',
        overflowY: 'auto',
        zIndex: 10,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}
      >
        <h3
          style={{
            color: '#e2e8f0',
            fontSize: '18px',
            fontWeight: 600,
            margin: 0,
          }}
        >
          节点编辑
        </h3>
        <button
          onClick={handleClose}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: 'transparent',
            color: '#ef4444',
            fontSize: '20px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#1e293b'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label
          style={{
            display: 'block',
            color: '#94a3b8',
            fontSize: '13px',
            marginBottom: '8px',
          }}
        >
          节点标题
        </label>
        <input
          type="text"
          value={selectedNode.title}
          onChange={handleTitleChange}
          placeholder="输入标题（最多30字）"
          style={{
            width: '100%',
            height: '40px',
            padding: '0 12px',
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '8px',
            color: '#e2e8f0',
            fontSize: '14px',
            boxSizing: 'border-box',
            outline: 'none',
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#3b82f6'
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#334155'
          }}
        />
        <div
          style={{
            textAlign: 'right',
            fontSize: '12px',
            color: '#64748b',
            marginTop: '4px',
          }}
        >
          {selectedNode.title.length}/30
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label
          style={{
            display: 'block',
            color: '#94a3b8',
            fontSize: '13px',
            marginBottom: '8px',
          }}
        >
          叙事文本
        </label>
        <textarea
          value={selectedNode.text}
          onChange={handleTextChange}
          placeholder="输入叙事文本（最多500字）"
          rows={8}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '8px',
            color: '#e2e8f0',
            fontSize: '14px',
            boxSizing: 'border-box',
            outline: 'none',
            resize: 'vertical',
            minHeight: '120px',
            transition: 'border-color 0.2s',
            fontFamily: 'inherit',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#3b82f6'
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#334155'
          }}
        />
        <div
          style={{
            textAlign: 'right',
            fontSize: '12px',
            color: '#64748b',
            marginTop: '4px',
          }}
        >
          {selectedNode.text.length}/500
        </div>
      </div>

      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
          }}
        >
          <label
            style={{
              color: '#94a3b8',
              fontSize: '13px',
            }}
          >
            选项/分支
          </label>
          <button
            onClick={handleAddOption}
            style={{
              height: '32px',
              padding: '0 16px',
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2563eb'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#3b82f6'
            }}
          >
            + 添加选项
          </button>
        </div>

        {outgoingConnections.length === 0 ? (
          <div
            style={{
              padding: '20px',
              textAlign: 'center',
              color: '#64748b',
              fontSize: '13px',
              backgroundColor: '#1e293b',
              borderRadius: '8px',
              border: '1px dashed #334155',
            }}
          >
            从节点右侧连接点拖拽创建连线
            <br />
            或点击上方按钮高亮未连接节点
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {outgoingConnections.map((conn) => {
              const targetNode = nodes.find((n) => n.id === conn.toNodeId)
              return (
                <div
                  key={conn.id}
                  style={{
                    padding: '12px',
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px',
                    }}
                  >
                    <span
                      style={{
                        color: '#94a3b8',
                        fontSize: '12px',
                      }}
                    >
                      选项
                    </span>
                    <button
                      onClick={() => handleDeleteOption(conn.id)}
                      style={{
                        color: '#ef4444',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '14px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        transition: 'background-color 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#334155'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }}
                    >
                      删除
                    </button>
                  </div>
                  <input
                    type="text"
                    value={conn.label}
                    onChange={(e) => handleOptionLabelChange(conn.id, e.target.value)}
                    placeholder="选项文字"
                    style={{
                      width: '100%',
                      height: '36px',
                      padding: '0 10px',
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '6px',
                      color: '#e2e8f0',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      marginBottom: '8px',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#3b82f6'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#334155'
                    }}
                  />
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#64748b',
                    }}
                  >
                    目标节点: {targetNode ? targetNode.title : '(未找到)'}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {selectedNode.id !== 'start' && (
        <button
          onClick={handleDeleteNode}
          style={{
            width: '100%',
            height: '40px',
            marginTop: '24px',
            backgroundColor: 'transparent',
            color: '#ef4444',
            border: '1px solid #ef4444',
            borderRadius: '8px',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
        >
          删除节点
        </button>
      )}
    </div>
  )
}
