import { useRef, useState } from 'react'
import { useAudioStore, type Preset } from '../store/audioStore'
import './PresetPanel.css'

interface PresetCardProps {
  preset: Preset
  isActive: boolean
  onClick: () => void
  onReorder: (fromIndex: number, toIndex: number) => void
  index: number
}

function PresetCard({ preset, isActive, onClick, onReorder, index }: PresetCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartY = useRef(0)
  const dragIndex = useRef(index)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleMouseDown = (e: React.MouseEvent) => {
    longPressTimer.current = setTimeout(() => {
      setIsDragging(true)
      dragStartY.current = e.clientY
      dragIndex.current = index
    }, 500)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !cardRef.current) return

    const cardHeight = cardRef.current.offsetHeight + 12
    const deltaY = e.clientY - dragStartY.current
    const moveSteps = Math.round(deltaY / cardHeight)

    if (moveSteps !== 0) {
      const newIndex = dragIndex.current + moveSteps
      if (newIndex >= 0) {
        onReorder(dragIndex.current, newIndex)
        dragIndex.current = newIndex
        dragStartY.current = e.clientY
      }
    }
  }

  const handleMouseUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    if (isDragging) {
      setIsDragging(false)
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    if (isDragging) {
      e.preventDefault()
      return
    }
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    onClick()
  }

  return (
    <div
      ref={cardRef}
      className={`preset-card ${isActive ? 'active' : ''} ${isDragging ? 'dragging' : ''}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleClick}
    >
      <div className="preset-card-content">
        <h3 className="preset-title">{preset.name}</h3>
        <p className="preset-description">{preset.description}</p>
        <div className="preset-meta">
          <span>{preset.leftFrequency}Hz / {preset.rightFrequency}Hz</span>
          {preset.isCustom && <span className="custom-badge">自定义</span>}
        </div>
      </div>
      <button className="preset-play-btn" onClick={(e) => { e.stopPropagation(); onClick() }}>
        <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
          {isActive ? (
            <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
          ) : (
            <path d="M8 5v14l11-7z" />
          )}
        </svg>
      </button>
    </div>
  )
}

export function PresetPanel() {
  const { presets, currentPresetId, setPreset, reorderPresets, openCreateModal } = useAudioStore()

  return (
    <div className="preset-panel">
      <div className="preset-panel-header">
        <h2>预设模式</h2>
        <button className="add-preset-btn" onClick={openCreateModal}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>
      <div className="preset-list">
        {presets.map((preset, index) => (
          <PresetCard
            key={preset.id}
            preset={preset}
            isActive={currentPresetId === preset.id}
            onClick={() => setPreset(preset.id)}
            onReorder={reorderPresets}
            index={index}
          />
        ))}
      </div>
    </div>
  )
}
