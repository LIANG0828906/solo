import { useState, useRef, useEffect, useCallback } from 'react'
import axios from 'axios'
import './OutfitBuilder.css'

type Category = '上装' | '下装' | '外套' | '鞋' | '配饰'
type OutfitSlot = 'top' | 'bottom' | 'outer' | 'shoes' | 'accessory'
type Mood = '开心' | '平静' | '悲伤' | '兴奋' | '疲惫'

interface ClothingItem {
  id: string
  imageUrl: string
  category: Category
  color: string
}

interface OutfitState {
  top: ClothingItem | null
  bottom: ClothingItem | null
  outer: ClothingItem | null
  shoes: ClothingItem | null
  accessory: ClothingItem | null
}

interface Recommendation {
  id: string
  name: string
  items: Partial<Record<OutfitSlot, ClothingItem>>
}

interface DragState {
  isDragging: boolean
  item: ClothingItem | null
  x: number
  y: number
}

const CATEGORY_TO_SLOT: Record<Category, OutfitSlot> = {
  '上装': 'top',
  '下装': 'bottom',
  '外套': 'outer',
  '鞋': 'shoes',
  '配饰': 'accessory'
}

const SLOT_AREAS: Record<OutfitSlot, { x: number; y: number; width: number; height: number }> = {
  top: { x: 80, y: 120, width: 80, height: 100 },
  bottom: { x: 80, y: 220, width: 80, height: 120 },
  outer: { x: 70, y: 110, width: 100, height: 130 },
  shoes: { x: 80, y: 340, width: 80, height: 50 },
  accessory: { x: 130, y: 80, width: 60, height: 50 }
}

const COLOR_CONFLICTS: [string, string][] = [
  ['#FF6B6B', '#96CEB4'],
  ['#FF0000', '#00FF00'],
]

const MOODS: Mood[] = ['开心', '平静', '悲伤', '兴奋', '疲惫']
const MOOD_COLORS: Record<Mood, string> = {
  '开心': '#96CEB4',
  '平静': '#45B7D1',
  '悲伤': '#6C5CE7',
  '兴奋': '#F39C12',
  '疲惫': '#999'
}

function OutfitBuilder() {
  const [clothes, setClothes] = useState<ClothingItem[]>([])
  const [expandedCategories, setExpandedCategories] = useState<Set<Category>>(new Set(['上装', '下装']))
  const [outfit, setOutfit] = useState<OutfitState>({
    top: null,
    bottom: null,
    outer: null,
    shoes: null,
    accessory: null
  })
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    item: null,
    x: 0,
    y: 0
  })
  const [conflictWarning, setConflictWarning] = useState<string | null>(null)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [selectedMood, setSelectedMood] = useState<Mood>('开心')
  const [note, setNote] = useState('')
  const [showRecommend, setShowRecommend] = useState(false)
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [saveAnimation, setSaveAnimation] = useState<OutfitSlot | null>(null)
  const mannequinRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number>(0)

  useEffect(() => {
    fetchClothes()
    fetchRecommendations()
  }, [])

  useEffect(() => {
    checkConflicts()
  }, [outfit])

  const fetchClothes = async () => {
    try {
      const res = await axios.get('/api/clothes')
      setClothes(res.data)
    } catch (err) {
      setClothes([
        { id: '1', imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200', category: '上装', color: '#FF6B6B' },
        { id: '2', imageUrl: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=200', category: '上装', color: '#FFFFFF' },
        { id: '3', imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=200', category: '下装', color: '#45B7D1' },
        { id: '4', imageUrl: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=200', category: '外套', color: '#8B4513' },
        { id: '5', imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200', category: '鞋', color: '#FF6B6B' },
        { id: '6', imageUrl: 'https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=200', category: '配饰', color: '#FFEAA7' },
      ])
    }
  }

  const fetchRecommendations = async () => {
    try {
      const res = await axios.get('/api/recommendations')
      setRecommendations(res.data)
    } catch (err) {
      setRecommendations([
        {
          id: 'r1',
          name: '清新日常',
          items: {
            top: { id: '2', imageUrl: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=200', category: '上装', color: '#FFFFFF' },
            bottom: { id: '3', imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=200', category: '下装', color: '#45B7D1' },
          }
        },
        {
          id: 'r2',
          name: '休闲出街',
          items: {
            top: { id: '1', imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200', category: '上装', color: '#FF6B6B' },
            shoes: { id: '5', imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200', category: '鞋', color: '#FF6B6B' },
          }
        }
      ])
    }
  }

  const checkConflicts = () => {
    setConflictWarning(null)
    const { top, bottom } = outfit
    if (top && bottom) {
      for (const [color1, color2] of COLOR_CONFLICTS) {
        if ((top.color === color1 && bottom.color === color2) ||
            (top.color === color2 && bottom.color === color1)) {
          setConflictWarning('风格冲突：红配绿可能不太协调哦~')
          return
        }
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

  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent, item: ClothingItem) => {
    e.preventDefault()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    
    setDragState({
      isDragging: true,
      item,
      x: clientX,
      y: clientY
    })

    const updatePosition = (clientX: number, clientY: number) => {
      setDragState(prev => ({
        ...prev,
        x: clientX,
        y: clientY
      }))
    }

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const cx = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX
      const cy = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      animationFrameRef.current = requestAnimationFrame(() => {
        updatePosition(cx, cy)
      })
    }

    const handleEnd = (e: MouseEvent | TouchEvent) => {
      const cx = 'changedTouches' in e ? e.changedTouches[0].clientX : (e as MouseEvent).clientX
      const cy = 'changedTouches' in e ? e.changedTouches[0].clientY : (e as MouseEvent).clientY
      
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

        if (svgX >= area.x && svgX <= area.x + area.width &&
            svgY >= area.y && svgY <= area.y + area.height) {
          setOutfit(prev => ({ ...prev, [slot]: item }))
          setSaveAnimation(slot)
          setTimeout(() => setSaveAnimation(null), 300)
        }
      }

      setDragState({
        isDragging: false,
        item: null,
        x: 0,
        y: 0
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
  }, [])

  const removeItem = (slot: OutfitSlot) => {
    setOutfit(prev => ({ ...prev, [slot]: null }))
  }

  const handleSave = () => {
    setShowSaveModal(true)
  }

  const confirmSave = async () => {
    try {
      await axios.post('/api/diary', {
        outfit,
        mood: selectedMood,
        note,
        date: new Date().toISOString().split('T')[0]
      })
    } catch (err) {
      console.error('保存失败', err)
    }
    setShowSaveModal(false)
    setNote('')
    alert('保存成功！')
  }

  const applyRecommendation = (rec: Recommendation) => {
    setOutfit({
      top: rec.items.top || null,
      bottom: rec.items.bottom || null,
      outer: rec.items.outer || null,
      shoes: rec.items.shoes || null,
      accessory: rec.items.accessory || null
    })
    setShowRecommend(false)
  }

  const clothesByCategory = CATEGORY_TO_SLOT ? 
    (['上装', '下装', '外套', '鞋', '配饰'] as Category[]).map(cat => ({
      category: cat,
      items: clothes.filter(c => c.category === cat)
    })) : []

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
          <button className="save-btn" onClick={handleSave}>
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
          {clothesByCategory.map(({ category, items }) => (
            <div key={category} className="category-section">
              <button
                className="category-header"
                onClick={() => toggleCategory(category)}
              >
                <span>{category}</span>
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
                      <img src={item.imageUrl} alt={category} />
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
          <div className="mannequin-wrapper" ref={mannequinRef}>
            <svg viewBox="0 0 240 400" className="mannequin-svg">
              <ellipse cx="120" cy="50" rx="35" ry="40" fill="#E5E0DB" stroke="#D5D0CB" strokeWidth="2" />
              
              <rect
                x={SLOT_AREAS.outer.x}
                y={SLOT_AREAS.outer.y}
                width={SLOT_AREAS.outer.width}
                height={SLOT_AREAS.outer.height}
                fill="transparent"
                stroke="#E5E0DB"
                strokeWidth="1"
                strokeDasharray="4 4"
                rx="8"
                className="slot-area"
              />
              
              <rect
                x={SLOT_AREAS.top.x}
                y={SLOT_AREAS.top.y}
                width={SLOT_AREAS.top.width}
                height={SLOT_AREAS.top.height}
                fill="transparent"
                stroke="#E5E0DB"
                strokeWidth="1"
                strokeDasharray="4 4"
                rx="8"
                className="slot-area"
              />
              
              <rect
                x={SLOT_AREAS.bottom.x}
                y={SLOT_AREAS.bottom.y}
                width={SLOT_AREAS.bottom.width}
                height={SLOT_AREAS.bottom.height}
                fill="transparent"
                stroke="#E5E0DB"
                strokeWidth="1"
                strokeDasharray="4 4"
                rx="8"
                className="slot-area"
              />
              
              <rect
                x={SLOT_AREAS.shoes.x}
                y={SLOT_AREAS.shoes.y}
                width={SLOT_AREAS.shoes.width}
                height={SLOT_AREAS.shoes.height}
                fill="transparent"
                stroke="#E5E0DB"
                strokeWidth="1"
                strokeDasharray="4 4"
                rx="8"
                className="slot-area"
              />
              
              <rect
                x={SLOT_AREAS.accessory.x}
                y={SLOT_AREAS.accessory.y}
                width={SLOT_AREAS.accessory.width}
                height={SLOT_AREAS.accessory.height}
                fill="transparent"
                stroke="#E5E0DB"
                strokeWidth="1"
                strokeDasharray="4 4"
                rx="8"
                className="slot-area"
              />
            </svg>

            {(Object.keys(outfit) as OutfitSlot[]).map(slot => {
              const item = outfit[slot]
              if (!item) return null
              const area = SLOT_AREAS[slot]
              return (
                <div
                  key={slot}
                  className={`outfit-item ${saveAnimation === slot ? 'pop-in' : ''}`}
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
                </div>
              )
            })}
          </div>
          <p className="mannequin-hint">拖拽左侧衣物到对应位置</p>
        </div>
      </div>

      {dragState.isDragging && dragState.item && (
        <div
          className="drag-preview"
          style={{
            left: dragState.x - 40,
            top: dragState.y - 50,
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
                    {mood}
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
              {recommendations.map(rec => (
                <div key={rec.id} className="recommend-card">
                  <div className="recommend-name">{rec.name}</div>
                  <div className="recommend-items">
                    {Object.entries(rec.items).map(([slot, item]) => (
                      item && <img key={slot} src={item.imageUrl} alt="" className="recommend-item-img" />
                    ))}
                  </div>
                  <button className="apply-btn" onClick={() => applyRecommendation(rec)}>
                    一键采纳
                  </button>
                </div>
              ))}
            </div>
            <button className="close-btn" onClick={() => setShowRecommend(false)}>关闭</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default OutfitBuilder
