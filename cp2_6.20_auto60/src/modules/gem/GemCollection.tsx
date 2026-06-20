import React, { useState, useEffect } from 'react'
import { FragmentCard } from '../../components/FragmentCard'
import { FragmentService } from '../../services/FragmentService'
import { useGameStore } from '../../stores/gameStore'
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

export const GemCollection: React.FC = () => {
  const [fragments, setFragments] = useState<Fragment[]>([])
  const [selectedElement, setSelectedElement] = useState<ElementType | 'all'>('all')
  const [selectedRarity, setSelectedRarity] = useState<Rarity | 0>(0)
  const [showDetail, setShowDetail] = useState(false)
  const [detailFragment, setDetailFragment] = useState<Fragment | null>(null)
  const { addFragment } = useGameStore()

  useEffect(() => {
    const loadFragments = async () => {
      const data = await FragmentService.getAllFragments()
      setFragments(data)
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
              <div className="detail-icon" style={{ background: `radial-gradient(circle, ${detailFragment.element === 'fire' ? '#ff450040' : detailFragment.element === 'water' ? '#00bfff40' : detailFragment.element === 'thunder' ? '#ffd70040' : detailFragment.element === 'wind' ? '#32cd3240' : '#9932cc40'}, transparent)` }}>
                <span style={{ fontSize: '48px' }}>
                  {detailFragment.element === 'fire' ? '🔥' :
                   detailFragment.element === 'water' ? '💧' :
                   detailFragment.element === 'thunder' ? '⚡' :
                   detailFragment.element === 'wind' ? '🌀' : '🌑'}
                </span>
              </div>
              <div>
                <h3 className="detail-name">{detailFragment.name}</h3>
                <div className="detail-rarity" style={{ color: detailFragment.element === 'fire' ? '#ff4500' : detailFragment.element === 'water' ? '#00bfff' : detailFragment.element === 'thunder' ? '#ffd700' : detailFragment.element === 'wind' ? '#32cd32' : '#9932cc' }}>
                  {'★'.repeat(detailFragment.rarity)}
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
              <h4>可合成符文</h4>
              <div className="rune-list">
                {detailFragment.craftableRunes.map((rune, idx) => (
                  <span key={idx} className="rune-tag">{rune}</span>
                ))}
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
