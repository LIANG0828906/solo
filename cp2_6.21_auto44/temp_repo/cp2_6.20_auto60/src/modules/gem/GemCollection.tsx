import React, { useState, useEffect } from 'react'
import { FragmentCard } from '../../components/FragmentCard'
import { FragmentService } from '../../services/FragmentService'
import { useGameStore } from '../../stores/gameStore'
import { elementColors, getRuneInfoByName } from '../../utils/gemUtils'
import { ElementIcon } from '../../components/ElementIcon'
import type { Fragment, ElementType, Rarity } from '../../types'
import './GemCollection.css'

const elements: Array<{ value: ElementType | 'all'; label: string }> = [
  { value: 'all', label: '全部' },
  { value: 'fire', label: '火' },
  { value: 'water', label: '水' },
  { value: 'thunder', label: '雷' },
  { value: 'wind', label: '风' },
  { value: 'dark', label: '暗' },
]

const rarities: Array<{ value: Rarity | 0; label: string }> = [
  { value: 0, label: '全部星级' },
  { value: 1, label: '1星' },
  { value: 2, label: '2星' },
  { value: 3, label: '3星' },
  { value: 4, label: '4星' },
  { value: 5, label: '5星' },
]

interface GemCollectionProps {
  onNavigateToForge?: () => void
}

const DetailRarityStars: React.FC<{ rarity: Rarity; color: string }> = ({ rarity, color }) => (
  <span style={{ display: 'inline-flex', gap: '2px', alignItems: 'center' }}>
    {Array.from({ length: 5 }, (_, i) => (
      <svg key={i} width="18" height="18" viewBox="0 0 24 24" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
        <path
          d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.27 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z"
          fill={i < rarity ? color : 'rgba(255,255,255,0.12)'}
          stroke={i < rarity ? color : 'rgba(255,255,255,0.15)'}
          strokeWidth="0.5"
        />
      </svg>
    ))}
  </span>
)

export const GemCollection: React.FC<GemCollectionProps> = ({ onNavigateToForge }) => {
  const [selectedElement, setSelectedElement] = useState<ElementType | 'all'>('all')
  const [selectedRarity, setSelectedRarity] = useState<Rarity | 0>(0)
  const [showDetail, setShowDetail] = useState(false)
  const [detailFragment, setDetailFragment] = useState<Fragment | null>(null)
  const { addFragment, setForgeSlot } = useGameStore()

  useEffect(() => {
    const loadFragments = async () => {
      const data = await FragmentService.getAllFragments()
      data.forEach((f) => addFragment(f, f.count))
    }
    loadFragments()
  }, [addFragment])

  const storeFragments = useGameStore((state) => state.fragments)

  const filteredFragments = storeFragments.filter((f) => {
    if (selectedElement !== 'all' && f.element !== selectedElement) return false
    if (selectedRarity !== 0 && f.rarity !== selectedRarity) return false
    return true
  })

  const handleCardClick = (fragment: Fragment) => {
    setDetailFragment(fragment)
    setShowDetail(true)
  }

  const handleCloseDetail = () => {
    setShowDetail(false)
    setTimeout(() => setDetailFragment(null), 300)
  }

  const handleDragStart = (e: React.DragEvent, fragment: Fragment) => {
    e.dataTransfer.setData('fragment', JSON.stringify(fragment))
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleRunePreviewClick = (fragment: Fragment) => {
    const storeState = useGameStore.getState()
    storeState.clearForgeSlots()

    const slotsToFill = Math.min(fragment.count, 3)
    for (let i = 0; i < slotsToFill; i++) {
      setForgeSlot(i, { ...fragment, count: 1 })
    }

    handleCloseDetail()
    setTimeout(() => {
      onNavigateToForge?.()
    }, 100)
  }

  const elementColor = (element: ElementType): string => elementColors[element]

  return (
    <div className="gem-collection">
      <h2 className="section-title">符石图鉴</h2>

      <div className="filter-bar">
        <div className="filter-group">
          <span className="filter-label">元素:</span>
          <div className="filter-buttons">
            {elements.map((el) => (
              <button
                key={el.value}
                className={`filter-btn element-btn ${selectedElement === el.value ? 'active' : ''}`}
                onClick={() => setSelectedElement(el.value as ElementType | 'all')}
                data-element={el.value}
              >
                {el.label}
              </button>
            ))}
          </div>
        </div>
        <div className="filter-group">
          <span className="filter-label">稀有度:</span>
          <select
            className="rarity-select"
            value={selectedRarity}
            onChange={(e) => setSelectedRarity(Number(e.target.value) as Rarity | 0)}
          >
            {rarities.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="fragment-grid">
        {filteredFragments.map((fragment) => (
          <FragmentCard
            key={fragment.id}
            fragment={fragment}
            onClick={() => handleCardClick(fragment)}
            onDragStart={handleDragStart}
          />
        ))}
      </div>

      {showDetail && detailFragment && (
        <div className="detail-overlay" onClick={handleCloseDetail}>
          <div
            className={`detail-panel ${showDetail ? 'show' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="close-btn" onClick={handleCloseDetail}>
              ✕
            </button>
            <div className="detail-header">
              <div className="detail-icon" style={{ background: `radial-gradient(circle, ${elementColor(detailFragment.element)}40, transparent)` }}>
                <span style={{ fontSize: '48px' }}>
                  {detailFragment.element === 'fire' ? '🔥' :
                   detailFragment.element === 'water' ? '💧' :
                   detailFragment.element === 'thunder' ? '⚡' :
                   detailFragment.element === 'wind' ? '🌀' : '🌑'}
                </span>
              </div>
              <div>
                <h3 className="detail-name">{detailFragment.name}</h3>
                <div className="detail-rarity">
                  <DetailRarityStars rarity={detailFragment.rarity} color={elementColor(detailFragment.element)} />
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h4>背景故事</h4>
              <p className="detail-lore">{detailFragment.lore}</p>
            </div>

            <div className="detail-section">
              <h4>基础属性</h4>
              <div className="detail-stats">
                {detailFragment.baseStats.attack && <div className="stat-item"><span>攻击</span><span>+{detailFragment.baseStats.attack}</span></div>}
                {detailFragment.baseStats.defense && <div className="stat-item"><span>防御</span><span>+{detailFragment.baseStats.defense}</span></div>}
                {detailFragment.baseStats.health && <div className="stat-item"><span>生命</span><span>+{detailFragment.baseStats.health}</span></div>}
                {detailFragment.baseStats.critRate && <div className="stat-item"><span>暴击</span><span>+{detailFragment.baseStats.critRate}%</span></div>}
              </div>
            </div>

            <div className="detail-section">
              <h4>关联符文预览</h4>
              <div className="rune-preview-list">
                {detailFragment.craftableRunes.map((runeName, idx) => {
                  const runeInfo = getRuneInfoByName(runeName)
                  const runeElement = runeInfo?.element || detailFragment.element
                  const runeRarity = runeInfo?.rarity || 1
                  const runeColor = elementColor(runeElement)
                  return (
                    <div
                      key={idx}
                      className="rune-preview-card"
                      onClick={() => handleRunePreviewClick(detailFragment)}
                      style={{ '--rune-color': runeColor } as React.CSSProperties}
                    >
                      <div className="rune-preview-icon">
                        <ElementIcon element={runeElement} size={28} />
                      </div>
                      <div className="rune-preview-info">
                        <div className="rune-preview-name">{runeName}</div>
                        <div className="rune-preview-meta">
                          <span className="rune-element-tag" style={{ background: `${runeColor}30`, color: runeColor, borderColor: `${runeColor}60` }}>
                            {runeElement === 'fire' ? '火' : runeElement === 'water' ? '水' : runeElement === 'thunder' ? '雷' : runeElement === 'wind' ? '风' : '暗'}
                          </span>
                          <span className="rune-preview-rarity" style={{ color: runeColor }}>
                            {'⭐'.repeat(runeRarity)}
                          </span>
                        </div>
                      </div>
                      <div className="rune-preview-arrow">→</div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="detail-section">
              <h4>掉落地点</h4>
              <div className="drop-locations">
                {detailFragment.dropLocations.map((loc, idx) => (
                  <span key={idx} className="loc-tag">📍 {loc}</span>
                ))}
              </div>
            </div>

            <div className="detail-footer">
              <span>拥有数量: <strong>{detailFragment.count}</strong></span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
