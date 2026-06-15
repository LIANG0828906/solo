import { useEffect, useMemo, useState } from 'react'
import { useStore, Creature, Coral } from '@/store/useStore'
import { X, Fish, Shell, Waves, Shield, BookOpen, ChevronRight } from 'lucide-react'
import './InfoPanel.css'

interface Ripple {
  id: number
  x: number
  y: number
}

function CircularProgress({ value, max, color, label }: {
  value: number
  max: number
  color: string
  label: string
}) {
  const percentage = Math.min(100, (value / max) * 100)
  const radius = 34
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference

  return (
    <div className="circular-progress-wrapper">
      <svg width="84" height="84" viewBox="0 0 84 84">
        <circle
          cx="42"
          cy="42"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="6"
        />
        <circle
          cx="42"
          cy="42"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 42 42)"
          className="progress-circle"
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
        <text x="42" y="45" textAnchor="middle" className="progress-text">
          {Math.round(percentage)}%
        </text>
      </svg>
      <span className="progress-label">{label}</span>
    </div>
  )
}

function parseDepthRange(range: string): [number, number] {
  const match = range.match(/(\d+)-(\d+)米/)
  if (match) {
    return [parseInt(match[1]), parseInt(match[2])]
  }
  return [0, 50]
}

function getConservationColor(status: string): string {
  switch (status) {
    case '极危': return '#FF4D4D'
    case '濒危': return '#FF6B35'
    case '易危': return '#FFC107'
    case '近危': return '#4CAF50'
    case '无危': return '#4DD0E1'
    default: return '#9E9E9E'
  }
}

function getConservationValue(status: string): number {
  switch (status) {
    case '极危': return 95
    case '濒危': return 80
    case '易危': return 60
    case '近危': return 40
    case '无危': return 15
    default: return 50
  }
}

export default function InfoPanel() {
  const selectedId = useStore((s) => s.selectedCreatureId)
  const setSelectedId = useStore((s) => s.actions.setSelectedCreatureId)
  const creatures = useStore((s) => s.creatures)
  const corals = useStore((s) => s.corals)
  const [ripples, setRipples] = useState<Ripple[]>([])

  const selectedItem = useMemo(() => {
    if (!selectedId) return null
    const creature = creatures.find(c => c.id === selectedId)
    if (creature) return { ...creature, isCreature: true }
    const coral = corals.find(c => c.id === selectedId)
    if (coral) return { ...coral, isCreature: false }
    return null
  }, [selectedId, creatures, corals])

  const isExpanded = !!selectedItem

  const handleClose = () => {
    setSelectedId(null)
  }

  const handleRipple = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const id = Date.now()
    setRipples(prev => [...prev, { id, x, y }])
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== id))
    }, 600)
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const [minDepth, maxDepth] = selectedItem ? parseDepthRange(selectedItem.depthRange) : [0, 0]
  const conservationValue = selectedItem ? getConservationValue(selectedItem.conservationStatus) : 0
  const conservationColor = selectedItem ? getConservationColor(selectedItem.conservationStatus) : '#9E9E9E'

  return (
    <>
      <div
        className={`info-panel ${isExpanded ? 'expanded' : ''}`}
        onClick={handleRipple}
      >
        {ripples.map(ripple => (
          <span
            key={ripple.id}
            className="ripple-effect"
            style={{ left: ripple.x, top: ripple.y }}
          />
        ))}

        {!isExpanded && (
          <div className="panel-collapsed">
            <span className="collapsed-hint">
              <Fish size={20} />
              <span>点击生物查看详情</span>
            </span>
          </div>
        )}

        {isExpanded && selectedItem && (
          <div className="panel-content">
            <div className="panel-header">
              <div className="header-left">
                <div className="type-badge">
                  {selectedItem.isCreature ? <Fish size={16} /> : <Shell size={16} />}
                  <span>{selectedItem.isCreature ? '海洋生物' : '珊瑚'}</span>
                </div>
                <button className="close-btn" onClick={(e) => { e.stopPropagation(); handleClose() }}>
                  <X size={18} />
                </button>
              </div>
              <h2 className="species-name">{selectedItem.name}</h2>
              <p className="scientific-name">{selectedItem.scientificName}</p>
            </div>

            <div className="color-indicator">
              <div
                className="color-dot"
                style={{ backgroundColor: selectedItem.color }}
              />
              <span className="color-label">体色特征</span>
            </div>

            <div className="section">
              <div className="section-title">
                <BookOpen size={16} />
                <span>物种简介</span>
              </div>
              <p className="description">{selectedItem.description}</p>
            </div>

            <div className="section">
              <div className="section-title">
                <Waves size={16} />
                <span>生活习性</span>
              </div>
              <p className="habitat">{selectedItem.habitat}</p>
            </div>

            <div className="metrics-row">
              <CircularProgress
                value={maxDepth}
                max={120}
                color="#4DD0E1"
                label="最大深度"
              />
              <CircularProgress
                value={conservationValue}
                max={100}
                color={conservationColor}
                label="受胁程度"
              />
            </div>

            <div className="info-row">
              <div className="info-item">
                <span className="info-label">分布深度</span>
                <span className="info-value">{selectedItem.depthRange}</span>
              </div>
              <div className="info-item">
                <span className="info-label">保护状态</span>
                <span
                  className="info-value conservation-badge"
                  style={{ backgroundColor: conservationColor + '33', color: conservationColor }}
                >
                  {selectedItem.conservationStatus}
                </span>
              </div>
            </div>

            <div className="panel-footer">
              <button className="btn-learn" onClick={handleRipple}>
                <span>了解更多</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
