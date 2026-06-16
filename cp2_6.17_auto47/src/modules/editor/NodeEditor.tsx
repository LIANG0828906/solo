import React, { useState, useRef, useCallback } from 'react'
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

function renderRichText(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={idx} style={{ color: '#F39C12', fontWeight: 700 }}>
          {part.slice(2, -2)}
        </strong>
      )
    }
    return <span key={idx}>{part}</span>
  })
}

function renderPreview(text: string): React.ReactNode {
  const lines = text.split('\n')
  return lines.map((line, lineIdx) => (
    <React.Fragment key={lineIdx}>
      {renderRichText(line)}
      {lineIdx < lines.length - 1 && <br />}
    </React.Fragment>
  ))
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
  const [showPreview, setShowPreview] = useState(false)
  const titleInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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

  const insertBold = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = editText.substring(start, end)

    let newText: string
    let newCursorPos: number

    if (selectedText) {
      newText = editText.substring(0, start) + `**${selectedText}**` + editText.substring(end)
      newCursorPos = end + 4
    } else {
      newText = editText.substring(0, start) + '**加粗文字**' + editText.substring(end)
      newCursorPos = start + 2
    }

    setEditText(newText)
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(newCursorPos, newCursorPos + (selectedText ? selectedText.length : 4))
    }, 0)
  }, [editText])

  const insertNewLine = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const newText = editText.substring(0, start) + '\n' + editText.substring(start)
    setEditText(newText)
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + 1, start + 1)
    }, 0)
  }, [editText])

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
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ fontSize: '13px', color: '#B2BEC3' }}>节点文本</div>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <button
              onClick={insertBold}
              title="加粗"
              style={toolbarBtnStyle}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#4A4E69' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#2D2D3F' }}
            >
              <strong style={{ color: '#F39C12' }}>B</strong>
            </button>
            <button
              onClick={insertNewLine}
              title="换行"
              style={toolbarBtnStyle}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#4A4E69' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#2D2D3F' }}
            >
              ↵
            </button>
            <div style={{ width: '1px', height: '16px', backgroundColor: '#4A4E69', margin: '0 4px' }} />
            <button
              onClick={() => setShowPreview(!showPreview)}
              title={showPreview ? '编辑' : '预览'}
              style={{
                ...toolbarBtnStyle,
                backgroundColor: showPreview ? '#6C5CE7' : '#2D2D3F',
                color: showPreview ? '#FFFFFF' : '#B2BEC3',
              }}
              onMouseEnter={(e) => {
                if (!showPreview) e.currentTarget.style.backgroundColor = '#4A4E69'
              }}
              onMouseLeave={(e) => {
                if (!showPreview) e.currentTarget.style.backgroundColor = '#2D2D3F'
              }}
            >
              {showPreview ? '✏️ 编辑' : '👁️ 预览'}
            </button>
          </div>
        </div>
        {!showPreview ? (
          <textarea
            ref={textareaRef}
            value={editText}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="在此输入节点文本内容...\n\n提示：\n- 使用 **文字** 可以将文字加粗\n- 点击工具栏 B 按钮快速加粗选中文字\n- Enter 键可以换行"
            style={{
              width: '100%',
              flex: 1,
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
        ) : (
          <div
            style={{
              width: '100%',
              flex: 1,
              minHeight: '120px',
              backgroundColor: '#2D2D3F',
              color: '#E2E8F0',
              border: '1px solid #6C5CE7',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '16px',
              lineHeight: '1.6',
              overflow: 'auto',
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
            }}
          >
            {editText ? renderPreview(editText) : (
              <span style={{ color: '#4A4E69' }}>暂无内容，切换到编辑模式添加文本</span>
            )}
          </div>
        )}
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

const toolbarBtnStyle: React.CSSProperties = {
  width: '28px',
  height: '24px',
  backgroundColor: '#2D2D3F',
  color: '#B2BEC3',
  border: '1px solid #4A4E69',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '13px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s',
}
