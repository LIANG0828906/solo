import { useState, useRef, useEffect, useCallback } from 'react'
import { useDocStore } from '../store/useDocStore'
import {
  ANNOTATION_COLORS,
  DEFAULT_COLOR,
  isValidColor,
  getColorName,
  sanitizeAnnotationColor,
} from '../types'
import type { Annotation } from '../types'
import axios from 'axios'

const COLOR_ENTRIES = Object.values(ANNOTATION_COLORS)

const DocumentEditor = () => {
  const {
    paragraphs,
    annotations,
    addAnnotation,
    updateAnnotations,
    deleteAnnotation,
    clearParagraphAnnotations,
    restoreAnnotations,
    documentId,
    isAuthenticated,
    user,
    setDocument,
  } = useDocStore()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeParagraph, setActiveParagraph] = useState<number | null>(null)
  const [newAnnotationText, setNewAnnotationText] = useState('')
  const [selectedColor, setSelectedColor] = useState<string></string>(DEFAULT_COLOR)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (!documentId) return

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/ws/annotations?docId=${documentId}`
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'annotations_update') {
          const validated = (data.annotations || []).map((a: Annotation) => ({
            ...a,
            color: sanitizeAnnotationColor(a.color),
          }))
          updateAnnotations(validated)
        } else if (data.type === 'new_annotation' || data.type === 'annotation_add') {
          const raw = data.annotation || data.payload?.annotation
          if (raw) {
            addAnnotation({ ...raw, color: sanitizeAnnotationColor(raw.color) })
          }
        } else if (data.type === 'annotation_delete') {
          const annId = data.annotationId || data.payload?.annotationId
          if (annId) {
            deleteAnnotation(annId)
          }
        } else if (data.type === 'clear_paragraph_annotations') {
          const paraIndex = data.paragraphIndex ?? data.payload?.paragraphIndex
          if (paraIndex !== undefined && paraIndex !== null) {
            clearParagraphAnnotations(paraIndex)
          }
        }
      } catch (e) {
        console.error('WebSocket parse error:', e)
      }
    }

    return () => {
      ws.close()
      wsRef.current = null
    }
  }, [documentId, updateAnnotations, addAnnotation, deleteAnnotation, clearParagraphAnnotations])

  const sendWsMessage = useCallback(
    (message: object) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
        const wsUrl = `${protocol}//${window.location.host}/ws/annotations?docId=${documentId}`
        const ws = new WebSocket(wsUrl)
        ws.onopen = () => {
          ws.send(JSON.stringify(message))
          ws.close()
        }
        ws.onerror = () => {
          console.error('WebSocket connection failed')
        }
      } else {
        wsRef.current.send(JSON.stringify(message))
      }
    },
    [documentId]
  )

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      const maxSize = 10 * 1024 * 1024
      if (file.size > maxSize) {
        alert('文件大小不能超过10MB')
        return
      }

      const isValid =
        file.name.endsWith('.md') ||
        file.name.endsWith('.txt') ||
        file.type === 'text/markdown' ||
        file.type === 'text/plain'

      if (!isValid) {
        alert('只支持 .md 和 .txt 文件')
        return
      }

      const reader = new FileReader()
      reader.onload = async (e) => {
        const content = e.target?.result as string
        const paragraphs = content
          .split(/\n\n+/)
          .map((p) => p.trim())
          .filter((p) => p.length > 0)

        try {
          const response = await axios.post('/api/documents', {
            name: file.name,
            content,
            paragraphs,
          })

          if (response.data) {
            setDocument({
              id: response.data.id || response.data.documentId || 'doc-' + Date.now(),
              content,
              paragraphs,
            })
          }
        } catch (err) {
          console.error('Upload error:', err)
          setDocument({
            id: 'doc-' + Date.now(),
            content,
            paragraphs,
          })
        }
      }
      reader.readAsText(file)
    },
    [setDocument]
  )

  const handleParagraphClick = (index: number) => {
    if (!isAuthenticated) {
      alert('请先登录后再添加批注')
      return
    }
    const newActive = activeParagraph === index ? null : index
    setActiveParagraph(newActive)
    setNewAnnotationText('')
    setSelectedColor(DEFAULT_COLOR)
    if (newActive !== null) {
      setSidebarOpen(true)
    }
  }

  const handleAddAnnotation = async () => {
    if (!newAnnotationText.trim() || activeParagraph === null || !user) return

    const color = isValidColor(selectedColor) ? selectedColor : DEFAULT_COLOR

    const newAnnotation: Annotation = {
      id: 'ann-' + Date.now(),
      userId: user.id,
      userName: user.name,
      paragraphIndex: activeParagraph,
      color,
      text: newAnnotationText.trim(),
      createdAt: new Date().toISOString(),
    }

    const snapshot = [...annotations]
    addAnnotation(newAnnotation)
    setNewAnnotationText('')

    sendWsMessage({
      type: 'add_annotation',
      annotation: newAnnotation,
    })

    try {
      await axios.post(`/api/documents/${documentId}/annotations`, {
        paragraph_index: activeParagraph,
        color,
        text: newAnnotationText.trim(),
      })
    } catch (e) {
      console.error('Save annotation error:', e)
      restoreAnnotations(snapshot)
    }
  }

  const handleDeleteAnnotation = async (annotationId: string) => {
    if (!window.confirm('确定要删除这条批注吗？此操作不可撤销。')) return

    const snapshot = [...annotations]
    deleteAnnotation(annotationId)

    sendWsMessage({
      type: 'annotation_delete',
      annotationId,
    })

    try {
      await axios.delete(`/api/annotations/${annotationId}`)
    } catch (e) {
      console.error('Delete annotation error:', e)
      restoreAnnotations(snapshot)
      alert('删除批注失败，已恢复')
    }
  }

  const handleClearParagraphAnnotations = async () => {
    if (activeParagraph === null) return
    if (!window.confirm('确定要清除当前段落的所有批注吗？此操作不可撤销。')) return

    const snapshot = [...annotations]
    clearParagraphAnnotations(activeParagraph)

    sendWsMessage({
      type: 'clear_paragraph_annotations',
      paragraphIndex: activeParagraph,
    })

    const paraAnnotations = snapshot.filter((a) => a.paragraphIndex === activeParagraph)
    try {
      for (const ann of paraAnnotations) {
        await axios.delete(`/api/annotations/${ann.id}`)
      }
    } catch (e) {
      console.error('Clear annotations error:', e)
      restoreAnnotations(snapshot)
      alert('清除批注失败，已恢复')
    }
  }

  const getParagraphAnnotations = (paragraphIndex: number): Annotation[] => {
    return annotations.filter((a) => a.paragraphIndex === paragraphIndex)
  }

  const getAnnotationColors = (paragraphIndex: number): string[] => {
    const paraAnnotations = getParagraphAnnotations(paragraphIndex)
    const colors = new Set(paraAnnotations.map((a) => a.color).filter(isValidColor))
    return Array.from(colors)
  }

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr)
    return date.toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const activeParaAnnotations =
    activeParagraph !== null
      ? [...getParagraphAnnotations(activeParagraph)].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      : []

  const renderHighlightedContent = (text: string, paragraphIndex: number) => {
    const paraAnnotations = getParagraphAnnotations(paragraphIndex)
    if (paraAnnotations.length === 0) {
      return <span>{text}</span>
    }

    const primaryColor = paraAnnotations[0].color
    const cssColorClass = `mark-color-${primaryColor.replace('#', '')}`

    return (
      <mark className={`annotation-mark ${cssColorClass}`} title={`${getColorName(primaryColor)}批注`}>
        {text}
      </mark>
    )
  }

  return (
    <div className="document-editor-wrapper">
      <main className="document-editor-main">
        <section className="upload-section" aria-label="文档上传">
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,.txt"
            onChange={handleFileUpload}
            id="file-upload"
          />
          <label htmlFor="file-upload" className="upload-label">
            上传文档
          </label>
          <p className="upload-hint">支持 .md 和 .txt 格式，最大 10MB</p>
        </section>

        {paragraphs.length > 0 && (
          <div className="paragraph-list" role="list">
            {paragraphs.map((paragraph, index) => {
              const hasAnnotation = getParagraphAnnotations(index).length > 0
              const colors = getAnnotationColors(index)
              const isActive = activeParagraph === index

              return (
                <article
                  key={index}
                  role="listitem"
                  className={`paragraph-item ${hasAnnotation ? 'has-annotation' : ''} ${isActive ? 'active-paragraph' : ''}`}
                  onClick={() => handleParagraphClick(index)}
                  aria-label={`第 ${index + 1} 段${hasAnnotation ? '，有批注' : ''}`}
                >
                  <span className="line-number" aria-hidden="true">{index + 1}</span>

                  {hasAnnotation && colors.length > 0 && (
                    <div
                      className="paragraph-left-indicator"
                      style={{
                        background:
                          colors.length > 1
                            ? `linear-gradient(to bottom, ${colors.join(', ')})`
                            : colors[0],
                      }}
                      aria-hidden="true"
                    />
                  )}

                  <div className="paragraph-content">
                    {renderHighlightedContent(paragraph, index)}
                  </div>

                  {hasAnnotation && (
                    <div className="paragraph-right-dots" aria-label="批注颜色标记">
                      {colors.slice(0, 4).map((color, colorIndex) => (
                        <span
                          key={`${color}-${colorIndex}`}
                          className="annotation-dot"
                          style={{ backgroundColor: color }}
                          title={`${getColorName(color)}批注`}
                          aria-label={`${getColorName(color)}批注`}
                        />
                      ))}
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        )}

        {paragraphs.length === 0 && (
          <div className="empty-state" role="status">
            <p>暂无文档内容</p>
            <p className="empty-state-hint">请上传文档开始批注</p>
          </div>
        )}
      </main>

      {activeParagraph === null && !sidebarOpen && (
        <button
          className="sidebar-fab"
          onClick={() => {
            if (paragraphs.length > 0) {
              setSidebarOpen(true)
            }
          }}
          aria-label="打开批注面板"
          title="批注面板"
        >
          <span className="sidebar-fab-icon" aria-hidden="true">📝</span>
        </button>
      )}

      <aside
        className={`annotation-sidebar ${sidebarOpen ? 'show' : ''}`}
        aria-label="批注侧边栏"
      >
        {activeParagraph !== null && sidebarOpen ? (
          <>
            <header className="annotation-sidebar-header">
              <h3 className="annotation-sidebar-title">
                第 {activeParagraph + 1} 段批注
              </h3>
              <button
                className="annotation-sidebar-close"
                onClick={() => {
                  setSidebarOpen(false)
                  setActiveParagraph(null)
                }}
                aria-label="关闭批注面板"
              >
                ×
              </button>
            </header>

            <section className="annotation-sidebar-content" aria-label="批注列表">
              {activeParaAnnotations.length > 0 ? (
                <ul className="paragraph-annotation-list" role="list">
                  {activeParaAnnotations.map((annotation) => (
                    <li
                      key={annotation.id}
                      className="paragraph-annotation-item"
                      style={{ borderLeftColor: annotation.color }}
                      role="listitem"
                    >
                      <div className="paragraph-annotation-header">
                        <div className="paragraph-annotation-user-info">
                          <span
                            className="paragraph-annotation-color-dot"
                            style={{ backgroundColor: annotation.color }}
                            aria-hidden="true"
                          />
                          <span className="paragraph-annotation-user">
                            {annotation.userName}
                          </span>
                        </div>
                        <button
                          className="paragraph-annotation-delete"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteAnnotation(annotation.id)
                          }}
                          aria-label="删除批注"
                        >
                          删除
                        </button>
                      </div>
                      <p className="paragraph-annotation-text">{annotation.text}</p>
                      <time className="paragraph-annotation-time" dateTime={annotation.createdAt}>
                        {formatDate(annotation.createdAt)}
                      </time>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="annotation-empty-state" role="status">
                  <p>该段落暂无批注</p>
                  <p className="annotation-empty-hint">在下方添加第一条批注</p>
                </div>
              )}

              {isAuthenticated && (
                <div className="annotation-input-section">
                  <div className="color-picker-section">
                    <span className="color-picker-label">选择颜色：</span>
                    <div className="color-picker" role="radiogroup" aria-label="批注颜色选择">
                      {COLOR_ENTRIES.map((entry) => (
                        <button
                          key={entry.value}
                          className={`color-option ${selectedColor === entry.value ? 'selected' : ''}`}
                          style={{ backgroundColor: entry.value }}
                          onClick={() => setSelectedColor(entry.value)}
                          role="radio"
                          aria-checked={selectedColor === entry.value}
                          aria-label={entry.name}
                          title={entry.name}
                        />
                      ))}
                    </div>
                  </div>
                  <textarea
                    className="annotation-input"
                    placeholder={`为第 ${activeParagraph + 1} 段添加批注...`}
                    value={newAnnotationText}
                    onChange={(e) => setNewAnnotationText(e.target.value)}
                    autoFocus
                    aria-label="批注内容"
                  />
                  <button
                    className="annotation-submit-btn"
                    onClick={handleAddAnnotation}
                    disabled={!newAnnotationText.trim()}
                  >
                    添加批注
                  </button>
                </div>
              )}
            </section>

            {activeParaAnnotations.length > 0 && (
              <footer className="annotation-sidebar-footer">
                <button
                  className="clear-annotations-btn"
                  onClick={handleClearParagraphAnnotations}
                >
                  清除当前段落所有批注
                </button>
              </footer>
            )}
          </>
        ) : (
          <div className="annotation-sidebar-placeholder" role="status">
            <div className="placeholder-icon" aria-hidden="true">📝</div>
            <p className="placeholder-title">点击文档段落</p>
            <p className="placeholder-desc">查看和添加批注</p>
          </div>
        )}
      </aside>
    </div>
  )
}

export default DocumentEditor
