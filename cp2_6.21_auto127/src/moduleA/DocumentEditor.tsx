import { useState, useRef, useEffect, useCallback } from 'react'
import { useDocStore } from '../store/useDocStore'
import type { Annotation } from '../types'
import axios from 'axios'

const COLORS = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff']

const COLOR_NAMES: Record<string, string> = {
  '#ff6b6b': '红色',
  '#ffd93d': '黄色',
  '#6bcb77': '绿色',
  '#4d96ff': '蓝色',
}

const DocumentEditor = () => {
  const {
    paragraphs,
    annotations,
    addAnnotation,
    updateAnnotations,
    deleteAnnotation,
    clearParagraphAnnotations,
    documentId,
    isAuthenticated,
    user,
    setDocument,
  } = useDocStore()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeParagraph, setActiveParagraph] = useState<number | null>(null)
  const [newAnnotationText, setNewAnnotationText] = useState('')
  const [selectedColor, setSelectedColor] = useState(COLORS[0])
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
          updateAnnotations(data.annotations)
        } else if (data.type === 'new_annotation' || data.type === 'annotation_add') {
          addAnnotation(data.annotation || data.payload?.annotation)
        } else if (data.type === 'annotation_delete') {
          const annId = data.annotationId || data.payload?.annotationId
          if (annId) {
            deleteAnnotation(annId)
          }
        } else if (data.type === 'clear_paragraph_annotations') {
          const paraIndex = data.paragraphIndex || data.payload?.paragraphIndex
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

  const sendWsMessage = useCallback((message: object) => {
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
  }, [documentId])

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      const maxSize = 10 * 1024 * 1024
      if (file.size > maxSize) {
        alert('文件大小不能超过10MB')
        return
      }

      const validTypes = ['.md', '.txt', 'text/markdown', 'text/plain']
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
    setActiveParagraph(activeParagraph === index ? null : index)
    setNewAnnotationText('')
    setSelectedColor(COLORS[0])
  }

  const handleAddAnnotation = async () => {
    if (!newAnnotationText.trim() || activeParagraph === null || !user) return

    const newAnnotation: Annotation = {
      id: 'ann-' + Date.now(),
      userId: user.id,
      userName: user.name,
      paragraphIndex: activeParagraph,
      color: selectedColor,
      text: newAnnotationText.trim(),
      createdAt: new Date().toISOString(),
    }

    addAnnotation(newAnnotation)
    setNewAnnotationText('')

    sendWsMessage({
      type: 'add_annotation',
      annotation: newAnnotation,
    })

    try {
      await axios.post(`/api/documents/${documentId}/annotations`, {
        paragraph_index: activeParagraph,
        color: selectedColor,
        text: newAnnotationText.trim(),
      })
    } catch (e) {
      console.error('Save annotation error:', e)
    }
  }

  const handleDeleteAnnotation = async (annotationId: string) => {
    if (!confirm('确定要删除这条批注吗？')) return

    deleteAnnotation(annotationId)

    sendWsMessage({
      type: 'annotation_delete',
      annotationId,
    })

    try {
      await axios.delete(`/api/annotations/${annotationId}`)
    } catch (e) {
      console.error('Delete annotation error:', e)
    }
  }

  const handleClearParagraphAnnotations = async () => {
    if (activeParagraph === null) return
    if (!confirm('确定要清除当前段落的所有批注吗？')) return

    const paraAnnotations = getParagraphAnnotations(activeParagraph)
    clearParagraphAnnotations(activeParagraph)

    sendWsMessage({
      type: 'clear_paragraph_annotations',
      paragraphIndex: activeParagraph,
    })

    try {
      for (const ann of paraAnnotations) {
        await axios.delete(`/api/annotations/${ann.id}`)
      }
    } catch (e) {
      console.error('Clear annotations error:', e)
    }
  }

  const getParagraphAnnotations = (paragraphIndex: number): Annotation[] => {
    return annotations.filter((a) => a.paragraphIndex === paragraphIndex)
  }

  const getAnnotationColors = (paragraphIndex: number): string[] => {
    const paraAnnotations = getParagraphAnnotations(paragraphIndex)
    const colors = new Set(paraAnnotations.map((a) => a.color))
    return Array.from(colors)
  }

  const getHighlightStyle = (paragraphIndex: number): React.CSSProperties => {
    const colors = getAnnotationColors(paragraphIndex)
    if (colors.length === 0) return {}
    if (colors.length === 1) {
      return { backgroundColor: `${colors[0]}20` }
    }
    const gradient = colors.map((c) => `${c}20`).join(', ')
    return {
      background: `linear-gradient(135deg, ${gradient})`,
    }
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

  const activeParaAnnotations = activeParagraph !== null ? getParagraphAnnotations(activeParagraph) : []

  return (
    <div className="document-editor-wrapper">
      <div className="document-editor-main">
        <div className="upload-section">
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
        </div>

        {paragraphs.length > 0 && (
          <div className="paragraph-list">
            {paragraphs.map((paragraph, index) => {
              const hasAnnotation = getParagraphAnnotations(index).length > 0
              const colors = getAnnotationColors(index)
              const isActive = activeParagraph === index
              const highlightStyle = getHighlightStyle(index)

              return (
                <div
                  key={index}
                  className={`paragraph-item ${hasAnnotation ? 'has-annotation' : ''} ${isActive ? 'active-paragraph' : ''}`}
                  style={highlightStyle}
                  onClick={() => handleParagraphClick(index)}
                >
                  <span className="line-number">{index + 1}</span>

                  {hasAnnotation && colors.length > 0 && (
                    <div
                      className="paragraph-left-indicator"
                      style={{
                        position: 'absolute',
                        left: '-24px',
                        top: '16px',
                        bottom: '16px',
                        width: '4px',
                        borderRadius: '2px',
                        background: colors.length > 1
                          ? `linear-gradient(to bottom, ${colors.join(', ')})`
                          : colors[0],
                      }}
                    />
                  )}

                  <div className="paragraph-content">{paragraph}</div>

                  {hasAnnotation && (
                    <div className="paragraph-right-dots">
                      {colors.slice(0, 4).map((color, colorIndex) => (
                        <div
                          key={`${color}-${colorIndex}`}
                          className="annotation-dot"
                          style={{
                            backgroundColor: color,
                            marginLeft: colorIndex > 0 ? '4px' : '0',
                          }}
                          title={`${COLOR_NAMES[color] || ''}批注`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {paragraphs.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#b2bec3' }}>
            <p>暂无文档内容</p>
            <p style={{ fontSize: '14px', marginTop: '8px' }}>请上传文档开始批注</p>
          </div>
        )}
      </div>

      <div className={`annotation-sidebar ${activeParagraph !== null ? 'show' : ''}`}>
        {activeParagraph !== null ? (
          <>
            <div className="annotation-sidebar-header">
              <h3 className="annotation-sidebar-title">
                第 {activeParagraph + 1} 段批注
              </h3>
              <button
                className="annotation-sidebar-close"
                onClick={() => setActiveParagraph(null)}
              >
                ×
              </button>
            </div>

            <div className="annotation-sidebar-content">
              {activeParaAnnotations.length > 0 ? (
                <div className="paragraph-annotation-list">
                  {activeParaAnnotations.map((annotation) => (
                    <div
                      key={annotation.id}
                      className="paragraph-annotation-item"
                      style={{ borderLeftColor: annotation.color }}
                    >
                      <div className="paragraph-annotation-header">
                        <div className="paragraph-annotation-user-info">
                          <span
                            className="paragraph-annotation-color-dot"
                            style={{ backgroundColor: annotation.color }}
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
                          title="删除批注"
                        >
                          删除
                        </button>
                      </div>
                      <p className="paragraph-annotation-text">{annotation.text}</p>
                      <div className="paragraph-annotation-time">
                        {formatDate(annotation.createdAt)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="annotation-empty-state">
                  <p>该段落暂无批注</p>
                  <p style={{ fontSize: '12px', marginTop: '4px' }}>
                    在下方添加第一条批注
                  </p>
                </div>
              )}

              {isAuthenticated && (
                <div className="annotation-input-section">
                  <div className="color-picker-section">
                    <span className="color-picker-label">选择颜色：</span>
                    <div className="color-picker">
                      {COLORS.map((color) => (
                        <div
                          key={color}
                          className={`color-option ${selectedColor === color ? 'selected' : ''}`}
                          style={{ backgroundColor: color }}
                          onClick={() => setSelectedColor(color)}
                          title={COLOR_NAMES[color]}
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
            </div>

            {activeParaAnnotations.length > 0 && (
              <div className="annotation-sidebar-footer">
                <button
                  className="clear-annotations-btn"
                  onClick={handleClearParagraphAnnotations}
                >
                  清除当前段落所有批注
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="annotation-sidebar-placeholder">
            <div className="placeholder-icon">📝</div>
            <p className="placeholder-title">点击文档段落</p>
            <p className="placeholder-desc">查看和添加批注</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default DocumentEditor
