import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useNoteStore } from '../core/NoteStore'
import { useMapStore } from '../core/MapEngine'
import { THEMES } from '../types'
import type { ImageAnnotation } from '../types'

const NoteEditor: React.FC = () => {
  const { activeNodeId, notes, updateNoteContent, addImage, removeImage } = useNoteStore()
  const { nodes, theme } = useMapStore()
  const themeData = THEMES[theme]

  const [isFading, setIsFading] = useState(false)
  const [displayNodeId, setDisplayNodeId] = useState<string | null>(null)
  const [boldActive, setBoldActive] = useState(false)
  const [italicActive, setItalicActive] = useState(false)
  const [underlineActive, setUnderlineActive] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const activeNote = activeNodeId ? notes[activeNodeId] : null
  const activeNode = activeNodeId ? nodes[activeNodeId] : null
  const displayNote = displayNodeId ? notes[displayNodeId] : null

  useEffect(() => {
    if (activeNodeId === displayNodeId) return

    setIsFading(true)
    const timer = setTimeout(() => {
      setDisplayNodeId(activeNodeId)
      setIsFading(false)
    }, 150)

    return () => clearTimeout(timer)
  }, [activeNodeId, displayNodeId])

  const handleContentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (!displayNodeId) return
      updateNoteContent(displayNodeId, e.target.value)
    },
    [displayNodeId, updateNoteContent],
  )

  const applyFormat = useCallback(
    (format: string) => {
      if (!textareaRef.current || !displayNodeId) return

      const textarea = textareaRef.current
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const selectedText = textarea.value.substring(start, end)

      let prefix = ''
      let suffix = ''

      switch (format) {
        case 'bold':
          prefix = '**'
          suffix = '**'
          break
        case 'italic':
          prefix = '*'
          suffix = '*'
          break
        case 'underline':
          prefix = '__'
          suffix = '__'
          break
        case 'list':
          const lines = selectedText.split('\n')
          const formatted = lines.map((line) => `- ${line}`).join('\n')
          const newValue =
            textarea.value.substring(0, start) + formatted + textarea.value.substring(end)
          updateNoteContent(displayNodeId, newValue)
          return
        default:
          return
      }

      const newText = prefix + selectedText + suffix
      const newValue =
        textarea.value.substring(0, start) + newText + textarea.value.substring(end)

      updateNoteContent(displayNodeId, newValue)

      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + prefix.length, end + prefix.length)
      }, 0)
    },
    [displayNodeId, updateNoteContent],
  )

  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (!files || !displayNodeId) return

      Array.from(files).forEach((file) => {
        const reader = new FileReader()
        reader.onload = (event) => {
          const result = event.target?.result as string
          if (result) {
            addImage(displayNodeId, result)
          }
        }
        reader.readAsDataURL(file)
      })

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    },
    [displayNodeId, addImage],
  )

  const handleRemoveImage = useCallback(
    (imageId: string) => {
      if (!displayNodeId) return
      removeImage(displayNodeId, imageId)
    },
    [displayNodeId, removeImage],
  )

  const textareaClasses = ['note-textarea']
  if (boldActive) textareaClasses.push('bold')
  if (italicActive) textareaClasses.push('italic')
  if (underlineActive) textareaClasses.push('underline')

  return (
    <div
      className="note-editor"
      style={{
        backgroundColor: themeData.panelBg,
        color: themeData.panelText,
        '--line-color': themeData.lineColor,
      } as React.CSSProperties}
    >
      <div className="note-editor-header" style={{ color: themeData.panelText }}>
        {activeNode ? `笔记 - ${activeNode.title}` : '笔记编辑器'}
      </div>

      {displayNodeId && displayNote !== undefined ? (
        <>
          <div className="note-editor-toolbar">
            <button
              className={`toolbar-btn ${boldActive ? 'active' : ''}`}
              onClick={() => {
                applyFormat('bold')
                setBoldActive(!boldActive)
              }}
              style={{ color: themeData.panelText }}
              title="加粗"
            >
              <strong>B</strong>
            </button>
            <button
              className={`toolbar-btn ${italicActive ? 'active' : ''}`}
              onClick={() => {
                applyFormat('italic')
                setItalicActive(!italicActive)
              }}
              style={{ color: themeData.panelText }}
              title="斜体"
            >
              <em>I</em>
            </button>
            <button
              className={`toolbar-btn ${underlineActive ? 'active' : ''}`}
              onClick={() => {
                applyFormat('underline')
                setUnderlineActive(!underlineActive)
              }}
              style={{ color: themeData.panelText }}
              title="下划线"
            >
              <u>U</u>
            </button>
            <button
              className="toolbar-btn"
              onClick={() => applyFormat('list')}
              style={{ color: themeData.panelText }}
              title="列表"
            >
              • 列表
            </button>
            <button
              className="toolbar-btn"
              onClick={() => fileInputRef.current?.click()}
              style={{ color: themeData.panelText }}
              title="插入图片"
            >
              🖼 图片
            </button>
          </div>

          <div
            className={`note-editor-content ${isFading ? 'fade-enter' : ''}`}
            style={{ opacity: isFading ? 0 : 1 }}
          >
            <textarea
              ref={textareaRef}
              className={textareaClasses.join(' ')}
              value={displayNote?.content || ''}
              onChange={handleContentChange}
              placeholder="在这里输入笔记内容..."
              style={{
                backgroundColor: themeData.background,
                color: themeData.panelText,
                borderColor: themeData.gridColor,
              }}
            />

            <div className="images-section">
              <div className="images-section-title" style={{ color: themeData.panelText }}>
                图片标注
              </div>
              <div className="image-list">
                {displayNote?.images.map((img: ImageAnnotation) => (
                  <div key={img.id} className="image-item">
                    <img src={img.src} alt={img.caption || '标注图片'} />
                    {img.caption && (
                      <div
                        className="image-caption"
                        style={{
                          backgroundColor: themeData.background,
                          color: themeData.panelText,
                        }}
                      >
                        {img.caption}
                      </div>
                    )}
                    <button
                      className="image-remove-btn"
                      onClick={() => handleRemoveImage(img.id)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <button
                className="upload-btn"
                onClick={() => fileInputRef.current?.click()}
                style={{ color: themeData.panelText, borderColor: themeData.gridColor }}
              >
                + 添加图片
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={handleImageUpload}
              />
            </div>
          </div>
        </>
      ) : (
        <div className="empty-note" style={{ color: themeData.panelText }}>
          请选择一个节点查看笔记
        </div>
      )}
    </div>
  )
}

export default NoteEditor
