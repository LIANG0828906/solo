import React, { useState, useCallback } from 'react'
import { useAppStore } from './store'
import { Skill } from './types'

const SkillCard: React.FC<{ skill: Skill; onDragStart: (skill: Skill) => void }> = ({
  skill,
  onDragStart,
}) => {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('skillId', skill.id)
    e.dataTransfer.effectAllowed = 'copy'
    onDragStart(skill)
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
        transition: 'all 0.2s ease',
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
  onDrop: (slotId: string) => void
  onRemove: (slotId: string) => void
  onDragStartSlot: (index: number) => void
  onDragOverSlot: (index: number) => void
  dragOverIndex: number | null
}

const Slot: React.FC<SlotProps> = ({
  slot,
  index,
  isPlaying,
  currentPlaybackIndex,
  onDrop,
  onRemove,
  onDragStartSlot,
  onDragOverSlot,
  dragOverIndex,
}) => {
  const [isDragOver, setIsDragOver] = useState(false)
  const getSkillById = useAppStore((state) => state.getSkillById)
  const skill = slot.skillId ? getSkillById(slot.skillId) : null

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    setIsDragOver(true)
    onDragOverSlot(index)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
    onDrop(slot.id)
  }

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    if (!skill || isPlaying) return
    e.dataTransfer.setData('slotIndex', String(index))
    e.dataTransfer.effectAllowed = 'move'
    onDragStartSlot(index)
  }

  const isActive = isPlaying && currentPlaybackIndex === index
  const isDragHighlight = isDragOver || dragOverIndex === index

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div
        draggable={!!skill && !isPlaying}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          width: 60,
          height: 60,
          borderRadius: 8,
          border: skill
            ? `2px solid ${isActive ? '#4ade80' : '#e94560'}`
            : isDragHighlight
              ? '2px dashed #4ade80'
              : '2px dashed rgba(255,255,255,0.3)',
          backgroundColor: isDragHighlight ? 'rgba(74, 222, 128, 0.1)' : 'rgba(15, 52, 96, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          transition: 'all 0.2s ease',
          cursor: skill ? (isPlaying ? 'default' : 'grab') : 'copy',
          transform: isActive ? 'scale(1.1)' : 'scale(1)',
          boxShadow: isActive ? '0 0 20px rgba(74, 222, 128, 0.5)' : 'none',
        }}
      >
        {skill && (
          <>
            <span style={{ fontSize: 28 }}>{skill.icon}</span>
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
        {!skill && <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>拖入</span>}
      </div>
      {skill && slot.combinationEffects.length > 0 && (
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

const SkillEditor: React.FC = () => {
  const {
    skills,
    comboSlots,
    playback: { isPlaying, currentIndex: currentPlaybackIndex },
    setSkillToSlot,
    reorderSlots,
    removeSkillFromSlot,
  } = useAppStore()

  const [draggedSkillId, setDraggedSkillId] = useState<string | null>(null)
  const [draggedSlotIndex, setDraggedSlotIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const handleSkillDragStart = useCallback((skill: Skill) => {
    setDraggedSkillId(skill.id)
    setDraggedSlotIndex(null)
  }, [])

  const handleSlotDragStart = useCallback((index: number) => {
    setDraggedSlotIndex(index)
    setDraggedSkillId(null)
  }, [])

  const handleSlotDragOver = useCallback((index: number) => {
    setDragOverIndex(index)
  }, [])

  const handleDrop = useCallback(
    (slotId: string) => {
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
    },
    [draggedSkillId, draggedSlotIndex, comboSlots, setSkillToSlot, reorderSlots]
  )

  const handleRemove = useCallback(
    (slotId: string) => {
      if (!isPlaying) {
        removeSkillFromSlot(slotId)
      }
    },
    [isPlaying, removeSkillFromSlot]
  )

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        padding: 20,
        backgroundColor: '#16213e',
        borderRadius: 4,
        border: '0.5px solid #e94560',
      }}
    >
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
          }}
        >
          {comboSlots.map((slot, index) => (
            <React.Fragment key={slot.id}>
              <Slot
                slot={slot}
                index={index}
                isPlaying={isPlaying}
                currentPlaybackIndex={currentPlaybackIndex}
                onDrop={handleDrop}
                onRemove={handleRemove}
                onDragStartSlot={handleSlotDragStart}
                onDragOverSlot={handleSlotDragOver}
                dragOverIndex={dragOverIndex}
              />
              {index < comboSlots.length - 1 && (
                <div
                  style={{
                    alignSelf: 'center',
                    color: 'rgba(255,255,255,0.3)',
                    fontSize: 18,
                    marginTop: -16,
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
