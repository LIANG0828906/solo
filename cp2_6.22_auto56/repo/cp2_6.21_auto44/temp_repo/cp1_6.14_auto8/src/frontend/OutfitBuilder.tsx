import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import axios from 'axios'
import {
  Clothing,
  Category,
  Mood,
  CATEGORY_LABELS,
  MOOD_LABELS,
  MOOD_COLORS,
  OutfitRecommendation,
  LABEL_TO_CATEGORY,
} from '../shared/types'
import './OutfitBuilder.css'

type OutfitSlot = Category

interface OutfitState {
  top: Clothing | null
  bottom: Clothing | null
  outerwear: Clothing | null
  shoes: Clothing | null
  accessory: Clothing | null
}

interface DragState {
  isDragging: boolean
  item: Clothing | null
  x: number
  y: number
}

interface ParsedRecommendation {
  id: string
  pattern: { color: string; category: Category }[]
  frequency: number
  outfit: OutfitState
  hasAll: boolean
}

const CATEGORIES: Category[] = ['top', 'bottom', 'outerwear', 'shoes', 'accessory']

const SLOT_AREAS: Record<OutfitSlot, { x: number; y: number; width: number; height: number }> = {
  top: { x: 80, y: 120, width: 80, height: 100 },
  bottom: { x: 80, y: 220, width: 80, height: 120 },
  outerwear: { x: 70, y: 110, width: 100, height: 130 },
  shoes: { x: 80, y: 340, width: 80, height: 50 },
  accessory: { x: 130, y: 80, width: 60, height: 50 },
}

const SLOT_LABELS: Record<OutfitSlot, string> = {
  top: '上装区',
  bottom: '下装区',
  outerwear: '外套区',
  shoes: '鞋区',
  accessory: '配饰区',
}

const RED_COLORS = [
  '#FF6B6B',
  '#FF0000',
  '#FF4757',
  '#E74C3C',
  '#C0392B',
  '#FF6348',
  '#EB4D4B',
  '#FF7F50',
  '#FF6F61',
]

const GREEN_COLORS = [
  '#00FF00',
  '#96CEB4',
  '#2ECC71',
  '#27AE60',
  '#1ABC9C',
  '#16A085',
  '#A8E6CF',
  '#6BCB77',
  '#4ECDC4',
]

const MOODS: Mood[] = ['happy', 'calm', 'sad', 'excited', 'tired']

const CATEGORY_TO_SLOT: Record<Category, OutfitSlot> = {
  top: 'top',
  bottom: 'bottom',
  outerwear: 'outerwear',
  shoes: 'shoes',
  accessory: 'accessory',
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

function colorDistance(c1: { r: number; g: number; b: number }, c2: { r: number; g: number; b: number }): number {
  const r = c1.r - c2.r
  const g = c1.g - c2.g
  const b = c1.b - c2.b
  return Math.sqrt(r * r + g * g + b * b)
}

function isRed(color: string): boolean {
  const rgb = hexToRgb(color)
  if (!rgb) return false
  if (RED_COLORS.includes(color.toUpperCase()) || RED_COLORS.includes(color.toLowerCase())) return true
  return rgb.r > 180 && rgb.g < 120 && rgb.b < 120 && rgb.r > rgb.g && rgb.r > rgb.b
}

function isGreen(color: string): boolean {
  const rgb = hexToRgb(color)
  if (!rgb) return false
  if (GREEN_COLORS.includes(color.toUpperCase()) || GREEN_COLORS.includes(color.toLowerCase())) return true
  return rgb.g > 150 && rgb.g > rgb.r && rgb.g > rgb.b && (rgb.g - rgb.r > 30 || rgb.g - rgb.b > 30)
}

function colorMatch(color1: string, color2: string, threshold = 80): boolean {
  const rgb1 = hexToRgb(color1)
  const rgb2 = hexToRgb(color2)
  if (!rgb1 || !rgb2) return color1.toLowerCase() === color2.toLowerCase()
  return colorDistance(rgb1, rgb2) < threshold
}

function OutfitBuilder() {
  const [clothing, setClothing] = useState<Clothing[]>([])
  const [expandedCategories, setExpandedCategories] = useState<Set<Category>>(new Set(['top', 'bottom']))
  const [outfit, setOutfit] = useState<OutfitState>({
    top: null,
    bottom: null,
    outerwear: null,
    shoes: null,
    accessory: null,
  })
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    item: null,
    x: 0,
    y: 0,
  })
  const [hoveredSlot, setHoveredSlot] = useState<OutfitSlot | null>(null)
  const [conflictWarning, setConflictWarning] = useState<string | null>(null)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [selectedMood, setSelectedMood] = useState<Mood>('happy')
  const [note, setNote] = useState('')
  const [showRecommend, setShowRecommend] = useState(false)
  const [rawRecommendations, setRawRecommendations] = useState<OutfitRecommendation[]>([])
  const [popAnimation, setPopAnimation] = useState<Set<OutfitSlot>>(new Set())
  const [saveFlyAnimation, setSaveFlyAnimation] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const mannequinRef = useRef<HTMLDivElement>(null)
  const dragPreviewRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number>(0)
  const dragStateRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  useEffect(() => {
    fetchClothing()
    fetchRecommendations()
  }, [])

  useEffect(() => {
    checkConflicts()
  }, [outfit])

  const fetchClothing = async () => {
    try {
      const res = await axios.get<Clothing[]>('/api/clothing')
      setClothing(res.data)
    } catch (err) {
      setClothing([
        { id: '1', name: '白色T恤', category: 'top', color: '#FFFFFF', imageUrl: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=200', createdAt: '2024-01-01' },
        { id: '2', name: '粉色卫衣', category: 'top', color: '#FF6B6B', imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200', createdAt: '2024-01-01' },
        { id: '3', name: '蓝色牛仔裤', category: 'bottom', color: '#45B7D1', imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=200', createdAt: '2024-01-01' },
        { id: '4', name: '棕色外套', category: 'outerwear', color: '#8B4513', imageUrl: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=200', createdAt: '2024-01-01' },
        { id: '5', name: '红色运动鞋', category: 'shoes', color: '#FF6B6B', imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200', createdAt: '2024-01-01' },
        { id: '6', name: '黄色帽子', category: 'accessory', color: '#FFEAA7', imageUrl: 'https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=200', createdAt: '2024-01-01' },
      ])
    }
  }

  const fetchRecommendations = async () => {
    try {
      const res = await axios.get<OutfitRecommendation[]>('/api/recommendations')
      setRawRecommendations(res.data)
    } catch (err) {
      setRawRecommendations([])
    }
  }

  const parsedRecommendations = useMemo<ParsedRecommendation[]>(() => {
    return rawRecommendations.map(rec => {
      const newOutfit: OutfitState = {
        top: null,
        bottom: null,
        outerwear: null,
        shoes: null,
        accessory: null,
      }
      let hasAll = true

      for (const patternItem of rec.pattern) {
        const slot = CATEGORY_TO_SLOT[patternItem.category]
        let match: Clothing | null = null

        const directMatch = rec.sampleClothingIds
          .map(id => clothing.find(c => c.id === id && c.category === patternItem.category))
          .find(Boolean) || null

        if (directMatch) {
          match = directMatch
        } else {
          const closetMatch = clothing.find(
            c => c.category === patternItem.category && colorMatch(c.color, patternItem.color, 100)
          ) || null
          if (closetMatch) {
            match = closetMatch
          } else {
            const fallback = clothing.find(c => c.category === patternItem.category) || null
            if (fallback) {
              match = fallback
            } else {
                hasAll = false
              }
            }
          }

        if (match) {
            newOutfit[slot] = match
          }
      }

      return {
        id: rec.id,
        pattern: rec.pattern,
        frequency: rec.frequency,
        outfit: newOutfit,
        hasAll,
      }
    }).filter(rec => Object.values(rec.outfit).some(v => v !== null))
  }, [rawRecommendations, clothing])

  const checkConflicts = () => {
    setConflictWarning(null)
    const { top, bottom } = outfit
    if (top && bottom) {
      if ((isRed(top.color) && isGreen(bottom.color)) || (isGreen(top.color) && isRed(bottom.color))) {
        setConflictWarning('风格冲突：红配绿可能不太协调哦~')
      }
    }
  }

  const toggleCategory = (category: Category) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }

  const updateDragPosition = useCallback((clientX: number, clientY: number) => {
    dragStateRef.current = { x: clientX, y: clientY }
    if (dragPreviewRef.current) {
      dragPreviewRef.current.style.transform = `translate(${clientX}px, ${clientY}px) translate(-50%, -50%)`
    }
  }, [])

  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent, item: Clothing) => {
    e.preventDefault()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

    dragStateRef.current = { x: clientX, y: clientY }

    setDragState({
      isDragging: true,
      item,
      x: clientX,
      y: clientY,
    })

    const handleMove = (ev: MouseEvent | TouchEvent) => {
      const cx = 'touches' in ev ? ev.touches[0].clientX : (ev as MouseEvent).clientX
      const cy = 'touches' in ev ? ev.touches[0].clientY : (ev as MouseEvent).clientY

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      animationFrameRef.current = requestAnimationFrame(() => {
        updateDragPosition(cx, cy)
        setDragState(prev => ({ ...prev, x: cx, y: cy }))

        if (mannequinRef.current) {
          const rect = mannequinRef.current.getBoundingClientRect()
          const relX = cx - rect.left
          const relY = cy - rect.top
          const scaleX = 240 / rect.width
          const scaleY = 400 / rect.height
          const svgX = relX * scaleX
          const svgY = relY * scaleY

          const slot = CATEGORY_TO_SLOT[item.category]
          const area = SLOT_AREAS[slot]

          if (svgX >= area.x && svgX <= area.x + area.width && svgY >= area.y && svgY <= area.y + area.height) {
            setHoveredSlot(slot)
          } else {
            setHoveredSlot(null)
          }
        }
      })
    }

    const handleEnd = (ev: MouseEvent | TouchEvent) => {
      const cx = 'changedTouches' in ev ? ev.changedTouches[0].clientX : (ev as MouseEvent).clientX
      const cy = 'changedTouches' in ev ? ev.changedTouches[0].clientY : (ev as MouseEvent).clientY

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }

      if (mannequinRef.current) {
        const rect = mannequinRef.current.getBoundingClientRect()
        const relX = cx - rect.left
        const relY = cy - rect.top
        const scaleX = 240 / rect.width
        const scaleY = 400 / rect.height
        const svgX = relX * scaleX
        const svgY = relY * scaleY

        const slot = CATEGORY_TO_SLOT[item.category]
        const area = SLOT_AREAS[slot]

        if (svgX >= area.x && svgX <= area.x + area.width && svgY >= area.y && svgY <= area.y + area.height) {
          setOutfit(prev => ({ ...prev, [slot]: item }))
          setPopAnimation(prev => new Set(prev).add(slot))
          setTimeout(() => {
            setPopAnimation(prev => {
              const next = new Set(prev)
              next.delete(slot)
              return next
            })
          }, 300)
        }
      }

      setHoveredSlot(null)
      setDragState({
        isDragging: false,
        item: null,
        x: 0,
        y: 0,
      })

      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleEnd)
      window.removeEventListener('touchmove', handleMove)
      window.removeEventListener('touchend', handleEnd)
    }

    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleEnd)
    window.addEventListener('touchmove', handleMove, { passive: false })
    window.addEventListener('touchend', handleEnd)
  }, [updateDragPosition])

  const removeItem = (slot: OutfitSlot) => {
    setOutfit(prev => ({ ...prev, [slot]: null }))
  }

  const handleSave = () => {
    setShowSaveModal(true)
  }

  const confirmSave = async () => {
    try {
      const clothingIds = Object.values(outfit)
        .filter((item): item is Clothing => item !== null)
        .map(item => item.id)

      if (clothingIds.length === 0) {
        alert('请先搭配至少一件衣物')
        return
      }

      await axios.post('/api/diary', {
        clothingIds,
        mood: selectedMood,
        note: note.slice(0, 50),
        date: new Date().toISOString().split('T')[0],
      })

      setShowSaveModal(false)
      setNote('')
      setSaveSuccess(true)
      setSaveFlyAnimation(true)

      setTimeout(() => {
        setSaveFlyAnimation(false)
        setSaveSuccess(false)
      }, 1200)
    } catch (err) {
      console.error('保存失败', err)
      alert('保存失败，请重试')
    }
  }

  const applyRecommendation = (rec: ParsedRecommendation) => {
    setOutfit(rec.outfit)
    setShowRecommend(false)
    const slots = (Object.keys(rec.outfit) as OutfitSlot[]).filter(s => rec.outfit[s] !== null)
    slots.forEach(slot => {
      setPopAnimation(prev => new Set(prev).add(slot))
      setTimeout(() => {
        setPopAnimation(prev => {
          const next = new Set(prev)
          next.delete(slot)
          return next
        })
      }, 300)
    })
  }

  const clothingByCategory = useMemo(() => {
    return CATEGORIES.map(cat => ({
      category: cat,
      items: clothing.filter(c => c.category === cat),
    }))
  }, [clothing])

  const outfitHasItems = Object.values(outfit).some(v => v !== null)

  return (
    <div className="outfit-builder">
      <div className="builder-header">
        <h1>穿搭搭配</h1>
        <div className="header-actions">
          <button className="recommend-btn" onClick={() => setShowRecommend(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            推荐
          </button>
          <button className={`save-btn ${saveSuccess ? 'save-success-btn' : ''}`} onClick={handleSave} disabled={!outfitHasItems}>
            保存搭配
          </button>
        </div>
      </div>

      {conflictWarning && (
        <div className="conflict-warning">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          {conflictWarning}
        </div>
      )}

      <div className="builder-content">
        <div className="clothes-list">
          {clothingByCategory.map(({ category, items }) => (
            <div key={category} className="category-section">
              <button
                className="category-header"
                onClick={() => toggleCategory(category)}
              >
                <span>{CATEGORY_LABELS[category]}</span>
                <span className="item-count">{items.length}</span>
                <svg
                  className={`arrow ${expandedCategories.has(category) ? 'expanded' : ''}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
              {expandedCategories.has(category) && (
                <div className="category-items">
                  {items.map(item => (
                    <div
                      key={item.id}
                      className="draggable-item"
                      onMouseDown={e => handleDragStart(e, item)}
                      onTouchStart={e => handleDragStart(e, item)}
                    >
                      <img src={item.imageUrl} alt={CATEGORY_LABELS[category]} />
                    </div>
                  ))}
                  {items.length === 0 && (
                    <div className="empty-category">暂无衣物</div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mannequin-section">
          <div className={`mannequin-wrapper ${saveFlyAnimation ? 'fly-in' : ''}`} ref={mannequinRef}>
            <svg viewBox="0 0 240 400" className="mannequin-svg">
              <ellipse cx="120" cy="50" rx="35" ry="40" fill="#E5E0DB" stroke="#D5D0CB" strokeWidth="2" />

              {CATEGORIES.map(slot => {
                const area = SLOT_AREAS[slot]
                const isHovered = hoveredSlot === slot && dragState.item && dragState.item.category === slot
                return (
                  <rect
                    key={slot}
                    x={area.x}
                    y={area.y}
                    width={area.width}
                    height={area.height}
                    fill={isHovered ? 'rgba(250, 220, 217, 0.3)' : 'transparent'}
                    stroke={isHovered ? '#E8A5A0' : '#E5E0DB'}
                    strokeWidth={isHovered ? '2' : '1'}
                    strokeDasharray="4 4"
                    rx="8"
                    className={`slot-area ${isHovered ? 'slot-hovered' : ''}`}
                  />
                )
              })}
            </svg>

            {CATEGORIES.map(slot => {
              const item = outfit[slot]
              if (!item) return null
              const area = SLOT_AREAS[slot]
              const isPopping = popAnimation.has(slot)
              return (
                <div
                  key={slot}
                  className={`outfit-item ${isPopping ? 'pop-in' : ''}`}
                  style={{
                    left: `${(area.x / 240) * 100}%`,
                    top: `${(area.y / 400) * 100}%`,
                    width: `${(area.width / 240) * 100}%`,
                    height: `${(area.height / 400) * 100}%`,
                  }}
                  onClick={() => removeItem(slot)}
                >
                  <img src={item.imageUrl} alt="" className="outfit-item-image" />
                  <div className="remove-hint">点击移除</div>
                  <span className="slot-label">{SLOT_LABELS[slot]}</span>
                </div>
              )
            })}
          </div>
          <p className="mannequin-hint">拖拽左侧衣物到对应位置</p>
        </div>
      </div>

      {dragState.isDragging && dragState.item && (
        <div
          ref={dragPreviewRef}
          className="drag-preview"
          style={{
            transform: `translate(${dragState.x}px, ${dragState.y}px) translate(-50%, -50%)`,
          }}
        >
          <img src={dragState.item.imageUrl} alt="" />
        </div>
      )}

      {showSaveModal && (
        <div className="modal-overlay" onClick={() => setShowSaveModal(false)}>
          <div className="modal-content save-modal" onClick={e => e.stopPropagation()}>
            <h3>保存为日记</h3>

            <div className="form-group">
              <label>今日心情</label>
              <div className="mood-options">
                {MOODS.map(mood => (
                  <button
                    key={mood}
                    className={`mood-option ${selectedMood === mood ? 'active' : ''}`}
                    onClick={() => setSelectedMood(mood)}
                    style={{ borderColor: selectedMood === mood ? MOOD_COLORS[mood] : 'transparent' }}
                  >
                    <span className="mood-dot" style={{ backgroundColor: MOOD_COLORS[mood] }}></span>
                    {MOOD_LABELS[mood]}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>备注（最多50字）</label>
              <textarea
                className="note-input"
                value={note}
                onChange={e => setNote(e.target.value.slice(0, 50))}
                placeholder="记录今天的穿搭心得..."
                rows={3}
              />
              <span className="char-count">{note.length}/50</span>
            </div>

            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowSaveModal(false)}>取消</button>
              <button className="confirm-btn" onClick={confirmSave}>保存</button>
            </div>
          </div>
        </div>
      )}

      {showRecommend && (
        <div className="modal-overlay" onClick={() => setShowRecommend(false)}>
          <div className="modal-content recommend-modal" onClick={e => e.stopPropagation()}>
            <h3>今日推荐</h3>
            <div className="recommend-list">
              {parsedRecommendations.length > 0 ? (
                parsedRecommendations.map((rec, idx) => (
                <div key={rec.id} className="recommend-card">
                  <div className="recommend-header">
                    <div className="recommend-name">推荐搭配 #{idx + 1}</div>
                    <div className="recommend-frequency">历史 {rec.frequency} 次</div>
                  </div>
                  <div className="recommend-pattern">
                    {rec.pattern.map((p, i) => (
                      <div key={i} className="pattern-item">
                        <span className="pattern-color" style={{ backgroundColor: p.color }}></span>
                        <span>{CATEGORY_LABELS[p.category]}</span>
                      </div>
                    ))}
                  </div>
                  <div className="recommend-items">
                    {CATEGORIES.filter(s => rec.outfit[s]).map(slot => {
                      const item = rec.outfit[slot]
                      return item ? (
                        <div key={slot} className="recommend-item">
                          <img src={item.imageUrl} alt="" className="recommend-item-img" />
                          <span className="recommend-item-label">{CATEGORY_LABELS[item.category]}</span>
                        </div>
                      ) : null
                    })}
                  </div>
                  <button className="apply-btn" onClick={() => applyRecommendation(rec)}
                    disabled={!rec.hasAll}
                  >
                    {rec.hasAll ? '一键采纳' : '部分采纳'}
                  </button>
                </div>
              ))
              ) : (
                <div className="no-recommendations">暂无推荐搭配，请先添加更多衣物~
                </div>
              )}
            </div>
            <button className="close-btn" onClick={() => setShowRecommend(false)}>关闭</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default OutfitBuilder
