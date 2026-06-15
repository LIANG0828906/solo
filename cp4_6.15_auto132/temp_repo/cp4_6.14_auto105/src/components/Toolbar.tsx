import { useState, useEffect, useRef } from 'react'
import { useStoryStore } from '../stores/storyStore'

interface ToolbarProps {
  onPreview: () => void
}

interface StoryItem {
  id: string
  name: string
  updatedAt: number
}

export default function Toolbar({ onPreview }: ToolbarProps) {
  const {
    undo,
    redo,
    historyIndex,
    history,
    saveToDB,
    listFromDB,
    loadFromDB,
    deleteFromDB,
  } = useStoryStore()

  const [showLoadList, setShowLoadList] = useState(false)
  const [stories, setStories] = useState<StoryItem[]>([])
  const [saveInput, setSaveInput] = useState('')
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const loadListRef = useRef<HTMLDivElement>(null)

  const canUndo = historyIndex > 0
  const canRedo = historyIndex < history.length - 1

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault()
        if (e.shiftKey) {
          redo()
        } else {
          undo()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (loadListRef.current && !loadListRef.current.contains(e.target as Node)) {
        setShowLoadList(false)
        setShowSaveDialog(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSave = async () => {
    if (!saveInput.trim()) return
    await saveToDB(saveInput.trim())
    setShowSaveDialog(false)
    setSaveInput('')
    alert('保存成功！')
  }

  const handleLoad = async () => {
    const list = await listFromDB()
    setStories(list)
    setShowLoadList(true)
  }

  const handleSelectStory = async (id: string) => {
    await loadFromDB(id)
    setShowLoadList(false)
  }

  const handleDeleteStory = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (confirm('确定要删除这个存档吗？')) {
      await deleteFromDB(id)
      const list = await listFromDB()
      setStories(list)
    }
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const buttonStyle: React.CSSProperties = {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    backgroundColor: '#1e293b',
    border: 'none',
    color: '#e2e8f0',
    fontSize: '18px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s, opacity 0.2s',
  }

  const disabledStyle: React.CSSProperties = {
    opacity: 0.3,
    cursor: 'not-allowed',
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '56px',
        backgroundColor: '#0f172a',
        borderBottom: '1px solid #334155',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: '8px',
        zIndex: 20,
      }}
    >
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => setShowSaveDialog(true)}
          style={buttonStyle}
          title="保存"
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#334155'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#1e293b'
          }}
        >
          💾
        </button>

        <div ref={loadListRef} style={{ position: 'relative' }}>
          <button
            onClick={handleLoad}
            style={buttonStyle}
            title="加载"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#334155'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#1e293b'
            }}
          >
            📂
          </button>

          {showLoadList && (
            <div
              style={{
                position: 'absolute',
                top: '44px',
                left: 0,
                width: '280px',
                maxHeight: '400px',
                overflowY: 'auto',
                backgroundColor: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '8px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
                padding: '8px',
                zIndex: 100,
              }}
            >
              <div
                style={{
                  color: '#94a3b8',
                  fontSize: '12px',
                  padding: '8px 12px',
                  borderBottom: '1px solid #334155',
                  marginBottom: '4px',
                }}
              >
                存档列表
              </div>
              {stories.length === 0 ? (
                <div
                  style={{
                    padding: '24px',
                    textAlign: 'center',
                    color: '#64748b',
                    fontSize: '13px',
                  }}
                >
                  暂无存档
                </div>
              ) : (
                stories.map((story) => (
                  <div
                    key={story.id}
                    onClick={() => handleSelectStory(story.id)}
                    style={{
                      height: '48px',
                      padding: '0 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: '#1e293b',
                      borderRadius: '8px',
                      marginBottom: '4px',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#334155'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#1e293b'
                    }}
                  >
                    <div>
                      <div
                        style={{
                          color: '#e2e8f0',
                          fontSize: '14px',
                          fontWeight: 500,
                        }}
                      >
                        {story.name}
                      </div>
                      <div
                        style={{
                          color: '#64748b',
                          fontSize: '11px',
                        }}
                      >
                        {formatDate(story.updatedAt)}
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDeleteStory(e, story.id)}
                      style={{
                        color: '#ef4444',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '12px',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        opacity: 0,
                        transition: 'opacity 0.2s, background-color 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = '1'
                        e.stopPropagation()
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.opacity = '1'
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.opacity = '0'
                      }}
                    >
                      删除
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {showSaveDialog && (
            <div
              style={{
                position: 'absolute',
                top: '44px',
                left: 0,
                width: '280px',
                backgroundColor: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '8px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
                padding: '16px',
                zIndex: 100,
              }}
            >
              <div
                style={{
                  color: '#e2e8f0',
                  fontSize: '14px',
                  fontWeight: 500,
                  marginBottom: '12px',
                }}
              >
                保存项目
              </div>
              <input
                type="text"
                value={saveInput}
                onChange={(e) => setSaveInput(e.target.value)}
                placeholder="输入项目名称"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave()
                }}
                style={{
                  width: '100%',
                  height: '36px',
                  padding: '0 10px',
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  color: '#e2e8f0',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                  outline: 'none',
                  marginBottom: '12px',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#334155'
                }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setShowSaveDialog(false)}
                  style={{
                    flex: 1,
                    height: '32px',
                    backgroundColor: '#334155',
                    color: '#e2e8f0',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  取消
                </button>
                <button
                  onClick={handleSave}
                  style={{
                    flex: 1,
                    height: '32px',
                    backgroundColor: '#3b82f6',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  保存
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={undo}
          disabled={!canUndo}
          style={{
            ...buttonStyle,
            ...(!canUndo ? disabledStyle : {}),
          }}
          title="撤销 (Ctrl+Z)"
          onMouseEnter={(e) => {
            if (canUndo) e.currentTarget.style.backgroundColor = '#334155'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#1e293b'
          }}
        >
          ↶
        </button>

        <button
          onClick={redo}
          disabled={!canRedo}
          style={{
            ...buttonStyle,
            ...(!canRedo ? disabledStyle : {}),
          }}
          title="重做 (Ctrl+Shift+Z)"
          onMouseEnter={(e) => {
            if (canRedo) e.currentTarget.style.backgroundColor = '#334155'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#1e293b'
          }}
        >
          ↷
        </button>
      </div>

      <div style={{ flex: 1 }} />

      <button
        onClick={onPreview}
        style={{
          ...buttonStyle,
          backgroundColor: '#3b82f6',
          color: '#ffffff',
        }}
        title="预览故事"
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#2563eb'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#3b82f6'
        }}
      >
        ▶
      </button>
    </div>
  )
}
