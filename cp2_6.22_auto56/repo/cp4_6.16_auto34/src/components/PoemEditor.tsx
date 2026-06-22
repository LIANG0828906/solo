import React, { useRef, useEffect, useState, useCallback } from 'react'
import { usePoemStore, FONT_OPTIONS, PoemLine } from '../store/poemStore'

const PoemEditor: React.FC = () => {
  const {
    currentPoemId,
    poems,
    updatePoem,
    addLine,
    updateLine,
    deleteLine,
    startExhibition
  } = usePoemStore()

  const poem = poems.find(p => p.id === currentPoemId)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [localTitle, setLocalTitle] = useState(poem?.title || '')

  useEffect(() => {
    if (poem) {
      setLocalTitle(poem.title)
    }
  }, [poem?.id])

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalTitle(e.target.value)
  }

  const handleTitleBlur = () => {
    if (poem && localTitle !== poem.title) {
      updatePoem(poem.id, { title: localTitle || '无题' })
    }
  }

  const handleLineTextChange = (lineId: string, text: string) => {
    if (!poem) return
    updateLine(poem.id, lineId, { text })
  }

  const handleLineStyleChange = (lineId: string, updates: Partial<PoemLine>) => {
    if (!poem) return
    updateLine(poem.id, lineId, updates)
  }

  const handleAddLine = () => {
    if (!poem) return
    addLine(poem.id)
  }

  const handleDeleteLine = (lineId: string) => {
    if (!poem || poem.lines.length <= 1) return
    deleteLine(poem.id, lineId)
  }

  const handleBgTypeChange = (type: 'gradient' | 'image') => {
    if (!poem) return
    updatePoem(poem.id, { backgroundType: type })
  }

  const handleGradientChange = (index: number, color: string) => {
    if (!poem) return
    const newColors = [...poem.gradientColors]
    newColors[index] = color
    updatePoem(poem.id, { gradientColors: newColors })
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!poem || !e.target.files?.[0]) return
    const file = e.target.files[0]
    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result as string
      updatePoem(poem.id, { backgroundImage: result })
    }
    reader.readAsDataURL(file)
  }

  const handleExhibition = () => {
    if (poem) {
      startExhibition(poem.id)
    }
  }

  const getBackgroundStyle = useCallback(() => {
    if (!poem) return {}
    if (poem.backgroundType === 'image' && poem.backgroundImage) {
      return {
        backgroundImage: `url(${poem.backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }
    }
    return {
      background: `linear-gradient(135deg, ${poem.gradientColors[0]}, ${poem.gradientColors[1]})`
    }
  }, [poem])

  if (!poem) {
    return (
      <div className="editor-container">
        <div className="empty-state">
          <div className="empty-state-icon">✎</div>
          <div className="empty-state-text">请选择或创建一首诗</div>
        </div>
      </div>
    )
  }

  return (
    <div className="editor-container">
      <div className="editor-main">
        <input
          type="text"
          className="title-input"
          value={localTitle}
          onChange={handleTitleChange}
          onBlur={handleTitleBlur}
          placeholder="诗的标题..."
        />

        <div className="lines-container">
          {poem.lines.map((line, index) => (
            <div key={line.id} className="line-editor">
              <div className="line-number">{index + 1}</div>
              <div className="line-content">
                <textarea
                  className="line-text-input"
                  value={line.text}
                  onChange={(e) => handleLineTextChange(line.id, e.target.value)}
                  placeholder="写下这一行诗..."
                  rows={1}
                  style={{ fontFamily: line.fontFamily, color: line.color, fontSize: `${line.fontSize}px` }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement
                    target.style.height = 'auto'
                    target.style.height = `${target.scrollHeight}px`
                  }}
                />
                <div className="line-style-controls">
                  <div className="style-control">
                    <span>字体</span>
                    <select
                      value={line.fontFamily}
                      onChange={(e) => handleLineStyleChange(line.id, { fontFamily: e.target.value })}
                    >
                      {FONT_OPTIONS.map((font) => (
                        <option key={font.value} value={font.value}>
                          {font.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="style-control">
                    <span>字号</span>
                    <input
                      type="number"
                      value={line.fontSize}
                      min={12}
                      max={64}
                      onChange={(e) => handleLineStyleChange(line.id, { fontSize: Number(e.target.value) })}
                      style={{ width: '60px' }}
                    />
                  </div>
                  <div className="style-control">
                    <span>颜色</span>
                    <input
                      type="color"
                      value={line.color}
                      onChange={(e) => handleLineStyleChange(line.id, { color: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="line-actions">
                <button
                  className="line-action-btn"
                  onClick={() => handleDeleteLine(line.id)}
                  title="删除行"
                  disabled={poem.lines.length <= 1}
                  style={{ opacity: poem.lines.length <= 1 ? 0.3 : 1 }}
                >
                  ×
                </button>
              </div>
            </div>
          ))}

          <button className="add-line-btn" onClick={handleAddLine}>
            + 添加一行
          </button>
        </div>
      </div>

      <div className="preview-sidebar">
        <div className="preview-label">预览</div>
        <div className="preview-card" style={getBackgroundStyle()}>
          <div className="preview-content">
            {poem.lines.map((line) => (
              <div
                key={line.id}
                className="preview-line"
                style={{
                  fontFamily: line.fontFamily,
                  fontSize: `${Math.min(line.fontSize * 0.6, 20)}px`,
                  color: line.color
                }}
              >
                {line.text || '　'}
              </div>
            ))}
          </div>
        </div>

        <div className="background-panel">
          <h4>背景设置</h4>
          <div className="bg-type-tabs">
            <button
              className={`bg-type-tab ${poem.backgroundType === 'gradient' ? 'active' : ''}`}
              onClick={() => handleBgTypeChange('gradient')}
            >
              渐变色
            </button>
            <button
              className={`bg-type-tab ${poem.backgroundType === 'image' ? 'active' : ''}`}
              onClick={() => handleBgTypeChange('image')}
            >
              图片
            </button>
          </div>

          {poem.backgroundType === 'gradient' && (
            <div className="gradient-colors">
              <input
                type="color"
                value={poem.gradientColors[0]}
                onChange={(e) => handleGradientChange(0, e.target.value)}
                title="起始色"
              />
              <input
                type="color"
                value={poem.gradientColors[1]}
                onChange={(e) => handleGradientChange(1, e.target.value)}
                title="结束色"
              />
            </div>
          )}

          {poem.backgroundType === 'image' && (
            <>
              <label className="image-upload">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
                {poem.backgroundImage ? '点击更换背景图片' : '点击上传背景图片'}
              </label>
              {poem.backgroundImage && (
                <button
                  className="btn btn-ghost"
                  style={{ width: '100%', marginTop: '8px', fontSize: '12px' }}
                  onClick={() => updatePoem(poem.id, { backgroundImage: null })}
                >
                  移除图片
                </button>
              )}
            </>
          )}
        </div>

        <button className="exhibition-btn" onClick={handleExhibition}>
          展 出
        </button>
      </div>
    </div>
  )
}

export default PoemEditor
