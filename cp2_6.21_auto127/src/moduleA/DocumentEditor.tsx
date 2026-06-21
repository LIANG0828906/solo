import { useState, useRef, useEffect, useCallback } from 'react'
import { useDocStore } from '../store/useDocStore'
import type { Annotation } from '../types'
import axios from 'axios'

const COLORS = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff']

const DocumentEditor = () => {
  const {
    paragraphs,
    annotations,
    addAnnotation,
    updateAnnotations,
    documentId,
    isAuthenticated,
    user,
    setDocument,
  } = useDocStore()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeParagraph, setActiveParagraph] = useState<number | null>(null)
  const [newAnnotationText, setNewAnnotationText] = useState('')
  const [selectedColor, setSelectedColor] = useState(COLORS[0])
  const [hoveredAnnotation, setHoveredAnnotation] = useState<string | null>(null)

  useEffect(() => {
    if (!documentId) return

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/ws/annotations?docId=${documentId}`
    const ws = new WebSocket(wsUrl)

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'annotations_update') {
          updateAnnotations(data.annotations)
        } else if (data.type === 'new_annotation') {
          addAnnotation(data.annotation)
        }
      } catch (e) {
        console.error('WebSocket parse error:', e)
      }
    }

    return () => {
      ws.close()
    }
  }, [documentId, updateAnnotations, addAnnotation])

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
    setActiveParagraph(null)
    setNewAnnotationText('')

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/ws/annotations?docId=${documentId}`
    try {
      const ws = new WebSocket(wsUrl)
      ws.onopen = () => {
        ws.send(
          JSON.stringify({
            type: 'add_annotation',
            annotation: newAnnotation,
          })
        )
        ws.close()
      }
    } catch (e) {
      console.error('WebSocket send error:', e)
    }
  }

  const getParagraphAnnotations = (paragraphIndex: number): Annotation[] => {
    return annotations.filter((a) => a.paragraphIndex === paragraphIndex)
  }

  const getFirstAnnotationColor = (paragraphIndex: number): string | null => {
    const paraAnnotations = getParagraphAnnotations(paragraphIndex)
    return paraAnnotations.length > 0 ? paraAnnotations[0].color : null
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

  return (
    <div className="document-editor">
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
            const firstColor = getFirstAnnotationColor(index)
            const paraAnnotations = getParagraphAnnotations(index)

            return (
              <div
                key={index}
                className={`paragraph-item ${hasAnnotation ? 'has-annotation' : ''}`}
                style={
                  hasAnnotation && firstColor
                    ? ({ '--annotation-color': firstColor } as React.CSSProperties)
                    : undefined
                }
                onClick={() => handleParagraphClick(index)}
              >
                <span className="line-number">{index + 1}</span>

                {hasAnnotation && firstColor && (
                  <div
                    style={{
                      position: 'absolute',
                      left: '-24px',
                      top: '16px',
                      bottom: '16px',
                      width: '4px',
                      borderRadius: '2px',
                      backgroundColor: firstColor,
                    }}
                  />
                )}

                <div className="paragraph-content">{paragraph}</div>

                {hasAnnotation && firstColor && (
                  <div
                    className="annotation-dot"
                    style={{ backgroundColor: firstColor }}
                    onMouseEnter={(e) => {
                      e.stopPropagation()
                      setHoveredAnnotation(`para-${index}`)
                    }}
                    onMouseLeave={() => setHoveredAnnotation(null)}
                    onClick={(e) => {
                      e.stopPropagation()
                      setActiveParagraph(activeParagraph === index ? null : index)
                    }}
                  >
                    {hoveredAnnotation === `para-${index}` && (
                      <div
                        className="annotation-card"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {paraAnnotations.map((ann) => (
                          <div key={ann.id} style={{ marginBottom: '12px' }}>
                            <div className="annotation-card-header">
                              <span className="annotation-card-user">{ann.userName}</span>
                              <span className="annotation-card-time">
                                {formatDate(ann.createdAt)}
                              </span>
                            </div>
                            <p className="annotation-card-text">{ann.text}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeParagraph === index && (
                  <div
                    className="annotation-card"
                    onClick={(e) => e.stopPropagation()}
                    style={{ right: '-280px' }}
                  >
                    <div className="annotation-card-header">
                      <span className="annotation-card-user">添加批注</span>
                      <button
                        onClick={() => setActiveParagraph(null)}
                        style={{ fontSize: '18px', color: '#636e72' }}
                      >
                        ×
                      </button>
                    </div>

                    <div className="color-picker">
                      {COLORS.map((color) => (
                        <div
                          key={color}
                          className={`color-option ${selectedColor === color ? 'selected' : ''}`}
                          style={{ backgroundColor: color }}
                          onClick={() => setSelectedColor(color)}
                        />
                      ))}
                    </div>

                    <textarea
                      className="annotation-input"
                      placeholder="输入批注内容..."
                      value={newAnnotationText}
                      onChange={(e) => setNewAnnotationText(e.target.value)}
                      autoFocus
                    />

                    <button
                      className="annotation-submit"
                      onClick={handleAddAnnotation}
                      disabled={!newAnnotationText.trim()}
                    >
                      添加批注
                    </button>
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
  )
}

export default DocumentEditor
