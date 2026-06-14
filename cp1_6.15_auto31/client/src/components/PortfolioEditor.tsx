import { useState, useCallback, useRef, useEffect } from 'react'
import { apiService } from '../services/apiService'
import {
  ProjectCard,
  TemplateStyle,
  Template,
  GlobalSettings,
  PortfolioState,
  Toast,
  ToastType,
} from '../types'

const GRID_SIZE = 40
const CARD_WIDTH = 260
const CARD_HEIGHT = 320

const TEMPLATES: Template[] = [
  { id: 'minimal', name: '简约风格', description: '干净简洁的设计，适合专业展示' },
  { id: 'modern', name: '现代风格', description: '渐变背景，充满科技感' },
  { id: 'artistic', name: '艺术风格', description: '柔和色彩，富有创意气息' },
]

const FONT_OPTIONS = [
  { value: 'system-ui, sans-serif', label: '系统默认' },
  { value: 'Georgia, serif', label: '衬线字体' },
  { value: '"Courier New", monospace', label: '等宽字体' },
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: '"Times New Roman", serif', label: 'Times New Roman' },
]

const GRADIENT_OPTIONS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
  'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
]

const TAG_PRESETS = ['全栈', '前端', '后端', '设计', '移动端', 'UI/UX', 'React', 'Node.js', 'TypeScript']

const defaultCard: Omit<ProjectCard, 'id' | 'x' | 'y'> = {
  name: '新项目',
  description: '点击编辑按钮添加项目描述',
  thumbnailUrl: '',
  tags: ['前端'],
  link: '',
}

interface ToastWithClosing extends Toast {
  closing: boolean
}

export default function PortfolioEditor() {
  const [template, setTemplate] = useState<TemplateStyle>('minimal')
  const [cards, setCards] = useState<ProjectCard[]>([])
  const [settings, setSettings] = useState<GlobalSettings>({
    backgroundColor: '#1a1a2e',
    fontFamily: 'system-ui, sans-serif',
    borderRadius: 12,
    spacing: 16,
  })

  const [editingCard, setEditingCard] = useState<ProjectCard | null>(null)
  const [showGradientPicker, setShowGradientPicker] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [toasts, setToasts] = useState<ToastWithClosing[]>([])
  const [canvasTransition, setCanvasTransition] = useState<'idle' | 'fade-out' | 'fade-in'>('idle')
  const [draggingCardId, setDraggingCardId] = useState<string | null>(null)
  const [snappingCardId, setSnappingCardId] = useState<string | null>(null)
  const [newCardId, setNewCardId] = useState<string | null>(null)

  const canvasRef = useRef<HTMLDivElement>(null)
  const dragStateRef = useRef({
    offsetX: 0,
    offsetY: 0,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    velocityX: 0,
    velocityY: 0,
    lastTime: 0,
    rafId: 0,
  })
  const toastIdRef = useRef(0)

  const showToast = useCallback((type: ToastType, message: string) => {
    const id = `toast-${++toastIdRef.current}`
    const toast: ToastWithClosing = { id, type, message, closing: false }
    setToasts((prev) => [...prev, toast])

    setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, closing: true } : t))
      )
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, 300)
    }, 2700)
  }, [])

  const handleTemplateChange = useCallback((newTemplate: TemplateStyle) => {
    if (newTemplate === template) return
    setCanvasTransition('fade-out')
    setTimeout(() => {
      setTemplate(newTemplate)
      setCanvasTransition('fade-in')
      setTimeout(() => {
        setCanvasTransition('idle')
      }, 300)
    }, 300)
  }, [template])

  const snapToGrid = useCallback((value: number) => {
    return Math.round(value / GRID_SIZE) * GRID_SIZE
  }, [])

  const handleAddCard = useCallback(() => {
    const newCard: ProjectCard = {
      ...defaultCard,
      id: `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      x: snapToGrid(40 + (cards.length % 3) * (CARD_WIDTH + settings.spacing)),
      y: snapToGrid(80 + Math.floor(cards.length / 3) * (CARD_HEIGHT + settings.spacing)),
    }

    setCards((prev) => [...prev, newCard])
    setNewCardId(newCard.id)
    setTimeout(() => setNewCardId(null), 400)
  }, [cards.length, settings.spacing, snapToGrid])

  const applySpringPhysics = useCallback(() => {
    const state = dragStateRef.current
    if (!draggingCardId) {
      cancelAnimationFrame(state.rafId)
      return
    }

    const targetX = state.currentX - state.offsetX
    const targetY = state.currentY - state.offsetY

    setCards((prev) =>
      prev.map((card) =>
        card.id === draggingCardId
          ? { ...card, x: Math.max(0, targetX), y: Math.max(0, targetY) }
          : card
      )
    )

    state.rafId = requestAnimationFrame(applySpringPhysics)
  }, [draggingCardId])

  const handleCardMouseDown = useCallback(
    (e: React.MouseEvent, cardId: string) => {
      e.preventDefault()
      e.stopPropagation()
      const card = cards.find((c) => c.id === cardId)
      if (!card || !canvasRef.current) return

      const canvasRect = canvasRef.current.getBoundingClientRect()
      const state = dragStateRef.current

      state.offsetX = e.clientX - canvasRect.left - card.x
      state.offsetY = e.clientY - canvasRect.top - card.y
      state.startX = e.clientX
      state.startY = e.clientY
      state.currentX = e.clientX
      state.currentY = e.clientY
      state.lastTime = performance.now()

      setDraggingCardId(cardId)
      state.rafId = requestAnimationFrame(applySpringPhysics)
    },
    [cards, applySpringPhysics]
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!draggingCardId) return
      const state = dragStateRef.current
      const now = performance.now()
      const dt = Math.max(now - state.lastTime, 1)

      state.velocityX = (e.clientX - state.currentX) / dt
      state.velocityY = (e.clientY - state.currentY) / dt
      state.currentX = e.clientX
      state.currentY = e.clientY
      state.lastTime = now
    },
    [draggingCardId]
  )

  const handleMouseUp = useCallback(() => {
    if (!draggingCardId) return

    cancelAnimationFrame(dragStateRef.current.rafId)
    setSnappingCardId(draggingCardId)

    setCards((prev) =>
      prev.map((card) =>
        card.id === draggingCardId
          ? { ...card, x: snapToGrid(card.x), y: snapToGrid(card.y) }
          : card
      )
    )

    setTimeout(() => setSnappingCardId(null), 200)
    setDraggingCardId(null)
  }, [draggingCardId, snapToGrid])

  useEffect(() => {
    if (draggingCardId) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'grabbing'
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
        document.body.style.cursor = ''
      }
    }
  }, [draggingCardId, handleMouseMove, handleMouseUp])

  const handleEditCard = useCallback((card: ProjectCard) => {
    setEditingCard({ ...card })
  }, [])

  const handleDeleteCard = useCallback((cardId: string) => {
    setCards((prev) => prev.filter((c) => c.id !== cardId))
    showToast('success', '卡片已删除')
  }, [showToast])

  const handleSaveCard = useCallback(() => {
    if (!editingCard) return
    setCards((prev) =>
      prev.map((c) => (c.id === editingCard.id ? editingCard : c))
    )
    setEditingCard(null)
    showToast('success', '卡片已保存')
  }, [editingCard, showToast])

  const handleSaveDraft = useCallback(async () => {
    setIsSaving(true)
    try {
      const state: PortfolioState = { template, cards, settings }
      const response = await apiService.saveProject(state)
      showToast('success', response.message || '草稿保存成功！')
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : '保存失败')
    } finally {
      setIsSaving(false)
    }
  }, [template, cards, settings, showToast])

  const handlePublish = useCallback(async () => {
    setIsPublishing(true)
    try {
      const state: PortfolioState = { template, cards, settings }
      const response = await apiService.publishProject(state)
      showToast('success', response.message || '发布成功！')
      if (response.downloadUrl) {
        setTimeout(() => {
          window.open(response.downloadUrl, '_blank')
        }, 500)
      }
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : '发布失败')
    } finally {
      setIsPublishing(false)
    }
  }, [template, cards, settings, showToast])

  const handleSettingChange = useCallback(
    <K extends keyof GlobalSettings>(key: K, value: GlobalSettings[K]) => {
      setSettings((prev) => ({ ...prev, [key]: value }))
    },
    []
  )

  const getCanvasStyle = useCallback(() => {
    const base: React.CSSProperties = {
      fontFamily: settings.fontFamily,
    }

    if (settings.backgroundColor.startsWith('linear-gradient')) {
      base.background = settings.backgroundColor
    } else {
      base.backgroundColor = settings.backgroundColor
    }

    return base
  }, [settings])

  const getCardStyle = useCallback(
    (card: ProjectCard): React.CSSProperties => ({
      left: card.x,
      top: card.y,
      borderRadius: settings.borderRadius,
      margin: settings.spacing / 2,
    }),
    [settings]
  )

  const getCanvasClass = () => {
    const classes = ['canvas', `template-${template}`]
    if (canvasTransition === 'fade-out') classes.push('fade-out')
    if (canvasTransition === 'fade-in') classes.push('fade-in')
    if (cards.length === 0) classes.push('empty')
    return classes.join(' ')
  }

  const getCardClass = (card: ProjectCard) => {
    const classes = ['project-card']
    if (draggingCardId === card.id) classes.push('dragging')
    if (snappingCardId === card.id) classes.push('snap-animation')
    if (newCardId === card.id) classes.push('bounce-in')
    return classes.join(' ')
  }

  const currentTemplate = TEMPLATES.find((t) => t.id === template)

  return (
    <div className="portfolio-editor">
      <div className="top-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            className="hamburger-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="菜单"
          >
            ☰
          </button>
          <h1>作品集生成器</h1>
        </div>
        <div className="toolbar-actions">
          <button className="btn" onClick={handleSaveDraft} disabled={isSaving}>
            <span>💾</span>
            <span className="btn-text">{isSaving ? '保存中...' : '保存草稿'}</span>
          </button>
          <button
            className="btn btn-primary"
            onClick={handlePublish}
            disabled={isPublishing}
          >
            <span>🚀</span>
            <span className="btn-text">{isPublishing ? '发布中...' : '一键发布'}</span>
          </button>
        </div>
      </div>

      <div
        className={`mobile-menu-overlay ${mobileMenuOpen ? 'active' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
      />

      <div className="main-content">
        <aside className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          <h3>选择模板</h3>
          <div className="template-selector">
            {TEMPLATES.map((t) => (
              <div
                key={t.id}
                className={`template-option ${template === t.id ? 'active' : ''}`}
                onClick={() => {
                  handleTemplateChange(t.id)
                  setMobileMenuOpen(false)
                }}
              >
                <h4>{t.name}</h4>
                <p>{t.description}</p>
              </div>
            ))}
          </div>

          <h3>全局设置</h3>

          <div className="setting-group">
            <label>背景色</label>
            <div className="color-picker-wrapper">
              <input
                type="color"
                value={
                  settings.backgroundColor.startsWith('#')
                    ? settings.backgroundColor
                    : '#1a1a2e'
                }
                onChange={(e) => handleSettingChange('backgroundColor', e.target.value)}
                onClick={() => setShowGradientPicker(!showGradientPicker)}
              />
              {showGradientPicker && (
                <div className="gradient-palette">
                  {GRADIENT_OPTIONS.map((gradient, idx) => (
                    <div
                      key={idx}
                      className="gradient-swatch"
                      style={{ background: gradient }}
                      onClick={() => {
                        handleSettingChange('backgroundColor', gradient)
                        setShowGradientPicker(false)
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="setting-group">
            <label>字体</label>
            <select
              value={settings.fontFamily}
              onChange={(e) => handleSettingChange('fontFamily', e.target.value)}
            >
              {FONT_OPTIONS.map((font) => (
                <option key={font.value} value={font.value}>
                  {font.label}
                </option>
              ))}
            </select>
          </div>

          <div className="setting-group">
            <label>卡片圆角: {settings.borderRadius}px</label>
            <input
              type="range"
              min="0"
              max="32"
              value={settings.borderRadius}
              onChange={(e) =>
                handleSettingChange('borderRadius', parseInt(e.target.value))
              }
            />
          </div>

          <div className="setting-group">
            <label>间距: {settings.spacing}px</label>
            <input
              type="range"
              min="8"
              max="48"
              value={settings.spacing}
              onChange={(e) =>
                handleSettingChange('spacing', parseInt(e.target.value))
              }
            />
          </div>
        </aside>

        <div className="canvas-area">
          <div className="canvas-wrapper">
            <div
              ref={canvasRef}
              className={getCanvasClass()}
              style={getCanvasStyle()}
            >
              {currentTemplate && canvasTransition !== 'fade-out' && (
                <div key={template} className="template-label">
                  {currentTemplate.name}
                </div>
              )}

              {cards.length === 0 && (
                <div className="empty-hint">
                  <div className="empty-hint-icon">📁</div>
                  <p>点击右下角按钮添加项目卡片</p>
                </div>
              )}

              {cards.map((card) => (
                <div
                  key={card.id}
                  className={getCardClass(card)}
                  style={getCardStyle(card)}
                  onMouseDown={(e) => handleCardMouseDown(e, card.id)}
                >
                  {card.thumbnailUrl ? (
                    <img
                      src={card.thumbnailUrl}
                      alt={card.name}
                      className="card-thumbnail"
                      style={{
                        borderRadius: `${settings.borderRadius}px ${settings.borderRadius}px 0 0`,
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  ) : (
                    <div
                      className="card-thumbnail-placeholder"
                      style={{
                        borderRadius: `${settings.borderRadius}px ${settings.borderRadius}px 0 0`,
                      }}
                    >
                      🖼️
                    </div>
                  )}
                  <div className="card-content">
                    <h3 className="card-name">{card.name}</h3>
                    <p className="card-description">{card.description}</p>
                    <div className="card-tags">
                      {card.tags.map((tag, idx) => (
                        <span key={idx} className="card-tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                    {card.link && (
                      <a
                        href={card.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="card-link"
                        onClick={(e) => e.stopPropagation()}
                      >
                        查看项目 →
                      </a>
                    )}
                  </div>
                  <div className="card-actions">
                    <button
                      className="card-action-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEditCard(card)
                      }}
                      title="编辑"
                    >
                      ✏️
                    </button>
                    <button
                      className="card-action-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteCard(card.id)
                      }}
                      title="删除"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}

              <button
                className="add-card-btn"
                onClick={handleAddCard}
                title="添加项目卡片"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <aside className="preview-panel">
          <h3>实时预览</h3>
          <div
            className="preview-frame"
            style={
              settings.backgroundColor.startsWith('linear-gradient')
                ? { background: settings.backgroundColor }
                : { backgroundColor: settings.backgroundColor }
            }
          >
            <div
              className="preview-content"
              style={{ fontFamily: settings.fontFamily }}
            >
              {cards.length === 0 ? (
                <p
                  style={{
                    color: 'var(--text-secondary)',
                    fontSize: 12,
                    textAlign: 'center',
                  }}
                >
                  暂无卡片
                </p>
              ) : (
                [...cards]
                  .sort((a, b) => {
                    if (a.y !== b.y) return a.y - b.y
                    return a.x - b.x
                  })
                  .map((card) => (
                    <div
                      key={card.id}
                      className="preview-card"
                      style={{ borderRadius: settings.borderRadius }}
                    >
                      <div className="preview-card-name">{card.name}</div>
                      <div className="preview-card-desc">{card.description}</div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </aside>
      </div>

      {editingCard && (
        <div className="modal-overlay" onClick={() => setEditingCard(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>编辑项目卡片</h2>
              <button className="modal-close" onClick={() => setEditingCard(null)}>
                ×
              </button>
            </div>

            <div className="form-group">
              <label>项目名称</label>
              <input
                type="text"
                value={editingCard.name}
                onChange={(e) =>
                  setEditingCard({ ...editingCard, name: e.target.value })
                }
                placeholder="输入项目名称"
              />
            </div>

            <div className="form-group">
              <label>项目描述</label>
              <textarea
                value={editingCard.description}
                onChange={(e) =>
                  setEditingCard({ ...editingCard, description: e.target.value })
                }
                placeholder="输入项目描述"
              />
            </div>

            <div className="form-group">
              <label>缩略图 URL</label>
              <input
                type="text"
                value={editingCard.thumbnailUrl}
                onChange={(e) =>
                  setEditingCard({ ...editingCard, thumbnailUrl: e.target.value })
                }
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="form-group">
              <label>标签</label>
              <div className="tags-input">
                {editingCard.tags.map((tag, idx) => (
                  <span key={idx} className="tag-chip">
                    {tag}
                    <button
                      onClick={() =>
                        setEditingCard({
                          ...editingCard,
                          tags: editingCard.tags.filter((_, i) => i !== idx),
                        })
                      }
                    >
                      ×
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  placeholder="输入标签后回车"
                  onKeyDown={(e) => {
                    if (
                      e.key === 'Enter' &&
                      (e.target as HTMLInputElement).value.trim()
                    ) {
                      e.preventDefault()
                      const newTag = (e.target as HTMLInputElement).value.trim()
                      if (!editingCard.tags.includes(newTag)) {
                        setEditingCard({
                          ...editingCard,
                          tags: [...editingCard.tags, newTag],
                        })
                      }
                      (e.target as HTMLInputElement).value = ''
                    }
                  }}
                  list="tag-presets"
                />
                <datalist id="tag-presets">
                  {TAG_PRESETS.map((tag) => (
                    <option key={tag} value={tag} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="form-group">
              <label>项目链接</label>
              <input
                type="text"
                value={editingCard.link}
                onChange={(e) =>
                  setEditingCard({ ...editingCard, link: e.target.value })
                }
                placeholder="https://example.com"
              />
            </div>

            <div className="modal-actions">
              <button className="btn" onClick={() => setEditingCard(null)}>
                取消
              </button>
              <button className="btn btn-primary" onClick={handleSaveCard}>
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="toast-container">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast ${toast.type} ${toast.closing ? 'closing' : ''}`}
          >
            <div className="toast-icon">{toast.type === 'success' ? '✓' : '✕'}</div>
            <div className="toast-message">{toast.message}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
