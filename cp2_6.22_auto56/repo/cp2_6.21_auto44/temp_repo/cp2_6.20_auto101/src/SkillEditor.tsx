import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useAppStore } from './store'
import { Skill } from './types'

const ZOOM_SCALE = 1.2
const ANIMATION_DURATION = 200
const DRAG_THRESHOLD = 10

const SkillCard: React.FC<{
  skill: Skill
  onDragStart: (skill: Skill, e: React.DragEvent<HTMLDivElement>) => void
}> = ({ skill, onDragStart }) => {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('skillId', skill.id)
    e.dataTransfer.effectAllowed = 'copy'
    e.dataTransfer.setDragImage(new Image(), 0, 0)
    onDragStart(skill, e)
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      style={{
        width: 120,
        padding: 12,
        backgroundColor: '#0f3460',
        borderRadius: 4,
        border: '0.5px solid #e94560',
        cursor: 'grab',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        transition: `all ${ANIMATION_DURATION}ms ease`,
        userSelect: 'none',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)'
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(233, 69, 96, 0.3)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
      }}
      onDragStartCapture={(e) => {
        e.currentTarget.style.opacity = '0.5'
      }}
      onDragEndCapture={(e) => {
        e.currentTarget.style.opacity = '1'
      }}
    >
      <div
        style={{
          fontSize: 28,
          width: 32,
          height: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {skill.icon}
      </div>
      <div style={{ fontSize: 14, fontWeight: 600 }}>{skill.name}</div>
      <div style={{ display: 'flex', gap: 8, fontSize: 11, color: '#aaa' }}>
        <span>冷却: {skill.cooldown}s</span>
        <span>伤害: {skill.damage}</span>
      </div>
    </div>
  )
}

interface SlotProps {
  slot: {
    id: string
    skillId: string | null
    order: number
    combinationEffects: string[]
  }
  index: number
  isPlaying: boolean
  currentPlaybackIndex: number
  isDragged: boolean
  dragOverIndex: number | null
  onDrop: (slotId: string) => void
  onRemove: (slotId: string) => void
  onDragStartSlot: (index: number, e: React.DragEvent<HTMLDivElement>) => void
  onDragOverSlot: (index: number) => void
  onDragLeaveSlot: () => void
}

const Slot: React.FC<SlotProps> = ({
  slot,
  index,
  isPlaying,
  currentPlaybackIndex,
  isDragged,
  dragOverIndex,
  onDrop,
  onRemove,
  onDragStartSlot,
  onDragOverSlot,
  onDragLeaveSlot,
}) => {
  const [isDragOver, setIsDragOver] = useState(false)
  const getSkillById = useAppStore((state) => state.getSkillById)
  const skill = slot.skillId ? getSkillById(slot.skillId) : null

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = e.dataTransfer.types.includes('slotIndex') ? 'move' : 'copy'
    if (!isDragOver) {
      setIsDragOver(true)
      onDragOverSlot(index)
    }
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
    onDragLeaveSlot()
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    onDrop(slot.id)
  }

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    if (!skill || isPlaying) return
    e.dataTransfer.setData('slotIndex', String(index))
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setDragImage(new Image(), 0, 0)
    onDragStartSlot(index, e)
  }

  const isActive = isPlaying && currentPlaybackIndex === index
  const isHighlighted = isDragOver || dragOverIndex === index
  const showEmptyState = isDragged

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div
        draggable={!!skill && !isPlaying}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`slot ${isHighlighted ? 'slot-highlighted' : ''} ${isDragged ? 'slot-dragging' : ''}`}
        style={{
          width: 60,
          height: 60,
          borderRadius: 8,
          border: showEmptyState
            ? '2px dashed rgba(255,255,255,0.3)'
            : isHighlighted
              ? '2px solid #e94560'
              : skill
                ? `2px solid ${isActive ? '#4ade80' : '#e94560'}`
                : '2px dashed rgba(255,255,255,0.3)',
          backgroundColor: showEmptyState
            ? 'rgba(15, 52, 96, 0.3)'
            : isHighlighted
              ? 'rgba(233, 69, 96, 0.15)'
              : 'rgba(15, 52, 96, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          transition: `all ${ANIMATION_DURATION}ms ease`,
          cursor: showEmptyState ? 'default' : skill ? (isPlaying ? 'default' : 'grab') : 'copy',
          transform: isActive ? `scale(${ZOOM_SCALE})` : isHighlighted ? `scale(${ZOOM_SCALE})` : 'scale(1)',
          transformOrigin: 'center center',
          boxShadow: isActive
            ? '0 0 20px rgba(74, 222, 128, 0.5)'
            : isHighlighted
              ? '0 0 25px rgba(233, 69, 96, 0.6)'
              : 'none',
        }}
      >
        {skill && !showEmptyState && (
          <>
            <span
              className="slot-icon"
              style={{
                fontSize: 28,
                transition: `transform ${ANIMATION_DURATION}ms ease`,
                transform: isHighlighted ? `scale(${ZOOM_SCALE})` : 'scale(1)',
                display: 'inline-block',
                transformOrigin: 'center center',
              }}
            >
              {skill.icon}
            </span>
            {!isPlaying && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onRemove(slot.id)
                }}
                style={{
                  position: 'absolute',
                  top: -6,
                  right: -6,
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  backgroundColor: '#e94560',
                  color: 'white',
                  border: 'none',
                  fontSize: 12,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            )}
          </>
        )}
        {!skill && (
          <span
            className="slot-placeholder"
            style={{
              color: isHighlighted ? '#e94560' : 'rgba(255,255,255,0.3)',
              fontSize: 11,
              fontWeight: isHighlighted ? 600 : 400,
              transition: `transform ${ANIMATION_DURATION}ms ease`,
              transform: isHighlighted ? `scale(${ZOOM_SCALE})` : 'scale(1)',
              transformOrigin: 'center center',
              whiteSpace: 'nowrap',
              display: 'inline-block',
            }}
          >
            {isHighlighted ? '放置' : '拖入'}
          </span>
        )}
        {showEmptyState && (
          <span
            style={{
              color: 'rgba(255,255,255,0.2)',
              fontSize: 11,
              fontStyle: 'italic',
            }}
          >
            移动中
          </span>
        )}
      </div>
      {skill && !showEmptyState && slot.combinationEffects.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center', maxWidth: 80 }}>
          {slot.combinationEffects.map((effect, i) => (
            <span
              key={i}
              style={{
                fontSize: 9,
                padding: '1px 4px',
                backgroundColor: '#e94560',
                borderRadius: 4,
                whiteSpace: 'nowrap',
              }}
            >
              {effect}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

const DragPreview: React.FC<{
  visible: boolean
  position: { x: number; y: number }
  offset: { x: number; y: number }
  icon: string | null
}> = ({ visible, position, offset, icon }) => {
  if (!visible || !icon) return null

  return (
    <div
      style={{
        position: 'fixed',
        left: position.x - offset.x,
        top: position.y - offset.y,
        width: 50,
        height: 50,
        borderRadius: 8,
        backgroundColor: 'rgba(15, 52, 96, 0.95)',
        border: '2px solid #e94560',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 32,
        pointerEvents: 'none',
        zIndex: 9999,
        transform: 'rotate(-5deg)',
        boxShadow: '0 8px 32px rgba(233, 69, 96, 0.5)',
        opacity: 0.9,
        transition: 'opacity 0.1s ease',
      }}
    >
      {icon}
    </div>
  )
}

const SkillEditor: React.FC = () => {
  const {
    skills,
    comboSlots,
    playback: { isPlaying, currentIndex: currentPlaybackIndex },
    setSkillToSlot,
    reorderSlots,
    removeSkillFromSlot,
    getSkillById,
  } = useAppStore()

  const [draggedSkillId, setDraggedSkillId] = useState<string | null>(null)
  const [draggedSlotIndex, setDraggedSlotIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 })
  const [dragStartPosition, setDragStartPosition] = useState({ x: 0, y: 0 })
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [hasMoved, setHasMoved] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleDragMove = useCallback((e: MouseEvent) => {
    setDragPosition({ x: e.clientX, y: e.clientY })
    if (!hasMoved) {
      const dx = Math.abs(e.clientX - dragStartPosition.x)
      const dy = Math.abs(e.clientY - dragStartPosition.y)
      if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) {
        setHasMoved(true)
      }
    }
  }, [dragStartPosition, hasMoved])

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove)
    }
    return () => {
      window.removeEventListener('mousemove', handleDragMove)
    }
  }, [isDragging, handleDragMove])

  const handleSkillDragStart = useCallback((skill: Skill, e: React.DragEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const offsetX = e.clientX - rect.left
    const offsetY = e.clientY - rect.top

    setDraggedSkillId(skill.id)
    setDraggedSlotIndex(null)
    setIsDragging(true)
    setHasMoved(false)
    setDragPosition({ x: e.clientX, y: e.clientY })
    setDragStartPosition({ x: e.clientX, y: e.clientY })
    setDragOffset({ x: offsetX, y: offsetY })
  }, [])

  const handleSlotDragStart = useCallback((index: number, e: React.DragEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const offsetX = e.clientX - rect.left
    const offsetY = e.clientY - rect.top

    setDraggedSlotIndex(index)
    setDraggedSkillId(null)
    setIsDragging(true)
    setHasMoved(false)
    setDragPosition({ x: e.clientX, y: e.clientY })
    setDragStartPosition({ x: e.clientX, y: e.clientY })
    setDragOffset({ x: offsetX, y: offsetY })
  }, [])

  const handleSlotDragOver = useCallback((index: number) => {
    setDragOverIndex(index)
  }, [])

  const handleSlotDragLeave = useCallback(() => {
    setDragOverIndex(null)
  }, [])

  const handleDrop = useCallback(
    (slotId: string) => {
      if (!hasMoved) {
        handleDragEnd()
        return
      }

      if (draggedSkillId) {
        setSkillToSlot(slotId, draggedSkillId)
      } else if (draggedSlotIndex !== null) {
        const toIndex = comboSlots.findIndex((s) => s.id === slotId)
        if (toIndex !== -1 && draggedSlotIndex !== toIndex) {
          reorderSlots(draggedSlotIndex, toIndex)
        }
      }
      setDraggedSkillId(null)
      setDraggedSlotIndex(null)
      setDragOverIndex(null)
      setIsDragging(false)
      setHasMoved(false)
    },
    [draggedSkillId, draggedSlotIndex, hasMoved, comboSlots, setSkillToSlot, reorderSlots]
  )

  const handleDragEnd = useCallback(() => {
    setDraggedSkillId(null)
    setDraggedSlotIndex(null)
    setDragOverIndex(null)
    setIsDragging(false)
    setHasMoved(false)
  }, [])

  const handleContainerDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }, [])

  const handleContainerDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      const slotContainer = e.currentTarget.querySelector('.slot-container')
      if (slotContainer && !slotContainer.contains(e.target as Node)) {
        handleDragEnd()
      }
    },
    [handleDragEnd]
  )

  const handleRemove = useCallback(
    (slotId: string) => {
      if (!isPlaying) {
        removeSkillFromSlot(slotId)
      }
    },
    [isPlaying, removeSkillFromSlot]
  )

  const draggedIcon = draggedSkillId
    ? getSkillById(draggedSkillId)?.icon || null
    : draggedSlotIndex !== null
      ? getSkillById(comboSlots[draggedSlotIndex]?.skillId)?.icon || null
      : null

  return (
    <div
      ref={containerRef}
      onDragOver={handleContainerDragOver}
      onDrop={handleContainerDrop}
      onDragEnd={handleDragEnd}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        padding: 20,
        backgroundColor: '#16213e',
        borderRadius: 4,
        border: '0.5px solid #e94560',
        position: 'relative',
      }}
    >
      <DragPreview
        visible={isDragging && hasMoved}
        position={dragPosition}
        offset={dragOffset}
        icon={draggedIcon}
      />

      <div>
        <h3
          style={{
            fontSize: 16,
            fontWeight: 600,
            marginBottom: 12,
            color: '#e94560',
            fontFamily: "'Cinzel', serif",
          }}
        >
          技能库
        </h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {skills.map((skill) => (
            <SkillCard key={skill.id} skill={skill} onDragStart={handleSkillDragStart} />
          ))}
        </div>
      </div>

      <div>
        <h3
          style={{
            fontSize: 16,
            fontWeight: 600,
            marginBottom: 12,
            color: '#e94560',
            fontFamily: "'Cinzel', serif",
          }}
        >
          连招编辑槽位
        </h3>
        <div
          className="slot-container"
          style={{
            display: 'flex',
            gap: 16,
            alignItems: 'flex-start',
            overflowX: 'auto',
            paddingBottom: 8,
            padding: 8,
            minHeight: 80,
          }}
        >
          {comboSlots.map((slot, index) => (
            <React.Fragment key={slot.id}>
              <Slot
                slot={slot}
                index={index}
                isPlaying={isPlaying}
                currentPlaybackIndex={currentPlaybackIndex}
                isDragged={draggedSlotIndex === index}
                dragOverIndex={dragOverIndex}
                onDrop={handleDrop}
                onRemove={handleRemove}
                onDragStartSlot={handleSlotDragStart}
                onDragOverSlot={handleSlotDragOver}
                onDragLeaveSlot={handleSlotDragLeave}
              />
              {index < comboSlots.length - 1 && (
                <div
                  style={{
                    alignSelf: 'center',
                    color: 'rgba(255,255,255,0.3)',
                    fontSize: 18,
                    marginTop: -16,
                    transition: `all ${ANIMATION_DURATION}ms ease`,
                    opacity: dragOverIndex === index || dragOverIndex === index + 1 ? 0.6 : 1,
                  }}
                >
                  →
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <style>{`
        .slot-container::-webkit-scrollbar {
          height: 6px;
        }
        .slot-container::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.1);
          border-radius: 3px;
        }
        .slot-container::-webkit-scrollbar-thumb {
          background: #e94560;
          border-radius: 3px;
        }
        @keyframes pulse-border {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(233, 69, 96, 0.4);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(233, 69, 96, 0);
          }
        }
        .slot-highlighted {
          animation: pulse-border 1s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% {
            transform: rotate(-5deg) translateY(0);
          }
          50% {
            transform: rotate(-5deg) translateY(-3px);
          }
        }
        @media (max-width: 768px) {
          .slot-container {
            flex-direction: column !important;
            overflow-x: hidden !important;
            overflow-y: auto !important;
            max-height: 300px !important;
          }
        }
      `}</style>
    </div>
  )
}

export default SkillEditor
