import { useState, useRef } from 'react'
import type { StoryNode, Connection } from '../../store/gameStore'

interface NodeEditorProps {
  node: StoryNode
  onUpdate: (updates: Partial<StoryNode>) => void
  onDelete: () => void
  onAddConnection: (connection: Connection) => void
  onRemoveConnection: (targetNodeId: string) => void
  onClose: () => void
  allNodes: StoryNode[]
}

export default function NodeEditor({
  node,
  onUpdate,
  onDelete,
  onAddConnection,
  onRemoveConnection,
  onClose,
  allNodes,
}: NodeEditorProps) {
  const [editText, setEditText] = useState(node.text)
  const [editTitle, setEditTitle] = useState(node.title)
  const [newConnLabel, setNewConnLabel] = useState('')
  const [newConnTarget, setNewConnTarget] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const titleInputRef = useRef<HTMLInputElement>(null)

  const handleSave = () => {
    onUpdate({ title: editTitle, text: editText })
  }

  const handleTextChange = (val: string) => {
    setEditText(val)
  }

  const handleTitleChange = (val: string) => {
    setEditTitle(val)
  }

  const handleAddConnection = () => {
    if (newConnLabel.trim() && newConnTarget) {
      onAddConnection({ label: newConnLabel.trim(), targetNodeId: newConnTarget })
      setNewConnLabel('')
      setNewConnTarget('')
    }
  }

  const handleJumpToNode = (targetId: string) => {
    const target = allNodes.find((n) => n.id === targetId)
    if (target) {
      onClose()
    }
  }

  return (
    <div
      style={{
        width: '400px',
        minWidth: '400px',
        height: '100%',
        backgroundColor: '#1E1E2E',
        borderLeft: '1px solid #4A4E69',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid #4A4E69',
        }}
      >
        <input
          ref={titleInputRef}
          value={editTitle}
          onChange={(e) => handleTitleChange(e.target.value)}
          style={{
            fontSize: '22px',
            fontWeight: 700,
            color: '#FFFFFF',
            backgroundColor: 'transparent',
            border: 'none',
            outline: 'none',
            flex: 1,
            minWidth: 0,
          }}
        />
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleSave}
            style={{
              padding: '6px 16px',
              backgroundColor: '#6C5CE7',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#A29BFE' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#6C5CE7' }}
          >
            保存
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            style={{
              padding: '6px 16px',
              backgroundColor: '#E74C3C',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#C0392B' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#E74C3C' }}
          >
            删除
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '6px 12px',
              backgroundColor: 'transparent',
              color: '#B2BEC3',
              border: '1px solid #4A4E69',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              transition: 'border-color 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#A29BFE' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#4A4E69' }}
          >
            ✕
          </button>
        </div>
      </div>

      <div
        style={{
          flex: '1 1 60%',
          padding: '16px 20px',
          overflow: 'auto',
          minHeight: 0,
        }}
      >
        <div style={{ fontSize: '13px', color: '#B2BEC3', marginBottom: '8px' }}>节点文本</div>
        <textarea
          value={editText}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder="在此输入节点文本内容..."
          style={{
            width: '100%',
            height: '100%',
            minHeight: '120px',
            backgroundColor: '#2D2D3F',
            color: '#E2E8F0',
            border: '1px solid #4A4E69',
            borderRadius: '8px',
            padding: '12px',
            fontSize: '16px',
            lineHeight: '1.6',
            resize: 'none',
            outline: 'none',
            fontFamily: 'inherit',
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = '#6C5CE7' }}
          onBlur={(e) => { e.currentTarget.style.borderColor = '#4A4E69' }}
        />
      </div>

      <div
        style={{
          flex: '0 0 auto',
          padding: '16px 20px',
          borderTop: '1px solid #4A4E69',
          maxHeight: '40%',
          overflowY: 'auto',
        }}
      >
        <div style={{ fontSize: '13px', color: '#B2BEC3', marginBottom: '8px' }}>输出连接</div>

        {node.outputs.length === 0 && (
          <div style={{ fontSize: '13px', color: '#4A4E69', marginBottom: '12px' }}>
            暂无输出连接
          </div>
        )}

        {node.outputs.map((conn, idx) => {
          const targetNode = allNodes.find((n) => n.id === conn.targetNodeId)
          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                backgroundColor: '#2D2D3F',
                borderRadius: '6px',
                marginBottom: '6px',
                border: '1px solid #4A4E69',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: '13px', color: '#A29BFE', fontWeight: 500 }}>
                  {conn.label}
                </span>
                <span style={{ fontSize: '12px', color: '#4A4E69' }}>→</span>
                <span
                  onClick={() => handleJumpToNode(conn.targetNodeId)}
                  style={{
                    fontSize: '12px',
                    color: targetNode ? '#6C5CE7' : '#E74C3C',
                    cursor: targetNode ? 'pointer' : 'default',
                    textDecoration: targetNode ? 'underline' : 'none',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {targetNode ? targetNode.title : '（已断开）'}
                </span>
              </div>
              <button
                onClick={() => onRemoveConnection(conn.targetNodeId)}
                style={{
                  padding: '2px 8px',
                  backgroundColor: 'transparent',
                  color: '#E74C3C',
                  border: '1px solid #E74C3C',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#E74C3C'; e.currentTarget.style.color = '#FFF' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#E74C3C' }}
              >
                删除
              </button>
            </div>
          )
        })}

        <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
          <input
            value={newConnLabel}
            onChange={(e) => setNewConnLabel(e.target.value)}
            placeholder="标签"
            style={{
              flex: '1 1 80px',
              padding: '6px 10px',
              backgroundColor: '#2D2D3F',
              color: '#E2E8F0',
              border: '1px solid #4A4E69',
              borderRadius: '6px',
              fontSize: '13px',
              outline: 'none',
            }}
          />
          <select
            value={newConnTarget}
            onChange={(e) => setNewConnTarget(e.target.value)}
            style={{
              flex: '1 1 120px',
              padding: '6px 10px',
              backgroundColor: '#2D2D3F',
              color: '#E2E8F0',
              border: '1px solid #4A4E69',
              borderRadius: '6px',
              fontSize: '13px',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="">选择目标节点</option>
            {allNodes
              .filter((n) => n.id !== node.id)
              .map((n) => (
                <option key={n.id} value={n.id}>
                  {n.title}
                </option>
              ))}
          </select>
          <button
            onClick={handleAddConnection}
            disabled={!newConnLabel.trim() || !newConnTarget}
            style={{
              padding: '6px 14px',
              backgroundColor: !newConnLabel.trim() || !newConnTarget ? '#4A4E69' : '#6C5CE7',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '6px',
              cursor: !newConnLabel.trim() || !newConnTarget ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              transition: 'background-color 0.2s',
            }}
          >
            + 添加
          </button>
        </div>
      </div>

      {showDeleteConfirm && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
        >
          <div
            style={{
              width: '320px',
              padding: '24px',
              backgroundColor: '#2D2D3F',
              borderRadius: '12px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '16px', color: '#E2E8F0', marginBottom: '16px' }}>
              确定删除节点「{node.title}」？
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={onDelete}
                style={{
                  padding: '8px 20px',
                  backgroundColor: '#E74C3C',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                删除
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  padding: '8px 20px',
                  backgroundColor: '#4A4E69',
                  color: '#E2E8F0',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
