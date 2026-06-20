import React, { useState, useRef, useCallback, useEffect } from 'react'
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

function isContentEditableSupported(): boolean {
  if (typeof document === 'undefined') return false
  const div = document.createElement('div')
  return typeof div.contentEditable !== 'undefined' && document.execCommand !== undefined
}

function htmlToPlainText(html: string): string {
  const div = document.createElement('div')
  div.innerHTML = html

  const strongs = div.querySelectorAll('strong, b')
  strongs.forEach((el) => {
    const text = el.textContent || ''
    el.replaceWith(`**${text}**`)
  })

  const brs = div.querySelectorAll('br')
  brs.forEach((br) => {
    br.replaceWith('\n')
  })

  const divs = div.querySelectorAll('div, p')
  divs.forEach((el, idx) => {
    if (idx < divs.length - 1) {
      el.after('\n')
    }
  })

  return div.innerText || div.textContent || ''
}

function plainTextToHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .split('\n')
    .join('<br>')
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
  const [editTitle, setEditTitle] = useState(node.title)
  const [editText, setEditText] = useState(node.text)
  const [newConnLabel, setNewConnLabel] = useState('')
  const [newConnTarget, setNewConnTarget] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [useRichEditor, setUseRichEditor] = useState(isContentEditableSupported())
  const titleInputRef = useRef<HTMLInputElement>(null)
  const editorRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setEditTitle(node.title)
    setEditText(node.text)
    if (useRichEditor && editorRef.current) {
      editorRef.current.innerHTML = plainTextToHtml(node.text)
    }
  }, [node.id, useRichEditor])

  useEffect(() => {
    if (useRichEditor && editorRef.current) {
      const styleId = 'rich-editor-style'
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style')
        style.id = styleId
        style.textContent = `
          [contenteditable] b, [contenteditable] strong {
            color: #F39C12;
            font-weight: 700;
          }
        `
        document.head.appendChild(style)
      }
    }
  }, [useRichEditor])

  const handleSave = () => {
    let finalText = editText
    if (useRichEditor && editorRef.current) {
      finalText = htmlToPlainText(editorRef.current.innerHTML)
    }
    onUpdate({ title: editTitle, text: finalText })
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

  const execBold = useCallback(() => {
    if (!useRichEditor) return
    if (editorRef.current) {
      editorRef.current.focus()
    }
    document.execCommand('bold', false, '')
  }, [useRichEditor])

  const execNewLine = useCallback(() => {
    if (!useRichEditor) return
    if (editorRef.current) {
      editorRef.current.focus()
    }
    document.execCommand('insertLineBreak', false, '')
  }, [useRichEditor])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!useRichEditor) return
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault()
        execBold()
      }
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        execNewLine()
      }
    },
    [useRichEditor, execBold, execNewLine]
  )

  const handleEditorInput = useCallback(() => {
    if (useRichEditor && editorRef.current) {
      setEditText(htmlToPlainText(editorRef.current.innerHTML))
    }
  }, [useRichEditor])

  const handleTextareaChange = (val: string) => {
    setEditText(val)
  }

  const toggleEditorMode = () => {
    setUseRichEditor(!useRichEditor)
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
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ fontSize: '13px', color: '#B2BEC3' }}>节点文本</div>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <button
              onClick={execBold}
              title="加粗 (Ctrl+B)"
              disabled={!useRichEditor}
              style={{
                ...toolbarBtnStyle,
                opacity: useRichEditor ? 1 : 0.4,
                cursor: useRichEditor ? 'pointer' : 'not-allowed',
              }}
              onMouseEnter={(e) => { if (useRichEditor) e.currentTarget.style.backgroundColor = '#4A4E69' }}
              onMouseLeave={(e) => { if (useRichEditor) e.currentTarget.style.backgroundColor = '#2D2D3F' }}
            >
              <strong style={{ color: '#F39C12' }}>B</strong>
            </button>
            <button
              onClick={execNewLine}
              title="换行 (Enter)"
              disabled={!useRichEditor}
              style={{
                ...toolbarBtnStyle,
                opacity: useRichEditor ? 1 : 0.4,
                cursor: useRichEditor ? 'pointer' : 'not-allowed',
              }}
              onMouseEnter={(e) => { if (useRichEditor) e.currentTarget.style.backgroundColor = '#4A4E69' }}
              onMouseLeave={(e) => { if (useRichEditor) e.currentTarget.style.backgroundColor = '#2D2D3F' }}
            >
              ↵
            </button>
            <div style={{ width: '1px', height: '16px', backgroundColor: '#4A4E69', margin: '0 4px' }} />
            <button
              onClick={toggleEditorMode}
              title={useRichEditor ? '切换到纯文本模式' : '切换到富文本模式'}
              style={{
                ...toolbarBtnStyle,
                width: 'auto',
                padding: '0 8px',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#4A4E69' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#2D2D3F' }}
            >
              {useRichEditor ? '📝 富文本' : '� 纯文本'}
            </button>
          </div>
        </div>
        {useRichEditor ? (
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={handleEditorInput}
            onKeyDown={handleKeyDown}
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
              outline: 'none',
              fontFamily: 'inherit',
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
              overflow: 'auto',
              transition: 'border-color 0.2s',
              cursor: 'text',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#6C5CE7' }}
            onBlur={(e) => { e.currentTarget.style.borderColor = '#4A4E69' }}
          />
        ) : (
          <textarea
            ref={textareaRef}
            value={editText}
            onChange={(e) => handleTextareaChange(e.target.value)}
            placeholder="在此输入节点文本内容...\n\n提示：\n- 使用 **文字** 可以将文字加粗\n- Enter 键可以换行"
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
