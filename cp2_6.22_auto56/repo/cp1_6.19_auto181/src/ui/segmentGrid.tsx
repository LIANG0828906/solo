import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store/appStore'
import { WaveformThumb } from './WaveformThumb'
import {
  EMOTION_CONFIG,
  EMOTION_OPTIONS,
  segmentProcessor,
  type EmotionType
} from '../audioEngine/segmentProcessor'

export function SegmentGrid() {
  const {
    segments,
    comments,
    gridColumns,
    updateSegmentEmotion,
    reorderSegments,
    setSelectedSegmentId,
    setGridColumns
  } = useStore()

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  if (segments.length === 0) {
    return null
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex !== null && draggedIndex !== index) {
      reorderSegments(draggedIndex, index)
    }
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const cardWidth = gridColumns === 1 ? '100%' : `calc((100% - ${(gridColumns - 1) * 16}px) / ${gridColumns})`

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div
        ref={gridRef}
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
          gap: 16,
          width: '100%'
        }}
      >
        {segments.map((segment, index) => {
          const emotionConfig = EMOTION_CONFIG[segment.emotion]
          const commentCount = comments[segment.id]?.length || 0
          const isDragging = draggedIndex === index
          const isDragOver = dragOverIndex === index

          return (
            <motion.div
              key={segment.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: isDragging ? 0.5 : 1,
                y: 0,
                scale: isDragOver ? 1.02 : 1
              }}
              transition={{ duration: 0.4, type: 'spring', damping: 20 }}
              onClick={() => setSelectedSegmentId(segment.id)}
              style={{
                width: '100%',
                aspectRatio: '260/180',
                backgroundColor: '#1A1A2E',
                borderRadius: 10,
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                cursor: 'pointer',
                border: `2px solid ${isDragOver ? emotionConfig.color : 'transparent'}`,
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                position: 'relative',
                overflow: 'hidden'
              }}
              whileHover={{
                y: -3,
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                transition: { duration: 0.3 }
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  backgroundColor: emotionConfig.color,
                  transition: 'background-color 0.3s'
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: '#8888AA', fontSize: 11, fontWeight: 500 }}>
                    #{index + 1}
                  </span>
                  <span style={{ color: '#666688', fontSize: 11 }}>
                    {segmentProcessor.formatTime(segment.start)} -{' '}
                    {segmentProcessor.formatTime(segment.end)}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {commentCount > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        backgroundColor: '#3A3A5C',
                        padding: '2px 8px',
                        borderRadius: 10,
                        fontSize: 11,
                        color: '#CCCCDD'
                      }}
                    >
                      <span>💬</span>
                      <span>{commentCount}</span>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                <WaveformThumb
                  data={segment.waveformThumb}
                  width={120}
                  height={40}
                  color={emotionConfig.color}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div
                  onClick={(e) => {
                    e.stopPropagation()
                    setOpenDropdownId(openDropdownId === segment.id ? null : segment.id)
                  }}
                  style={{ position: 'relative' }}
                >
                  <motion.span
                    animate={{ opacity: [0.8, 1.0, 0.8] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{
                      padding: '4px 12px',
                      borderRadius: 4,
                      backgroundColor: emotionConfig.color,
                      color: '#FFFFFF',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'background-color 0.3s',
                      display: 'inline-block'
                    }}
                  >
                    {emotionConfig.label}
                  </motion.span>

                  {openDropdownId === segment.id && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        marginTop: 4,
                        backgroundColor: '#1E1E2E',
                        borderRadius: 8,
                        padding: 4,
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                        zIndex: 50,
                        minWidth: 100
                      }}
                    >
                      {EMOTION_OPTIONS.map((opt) => {
                        const optConfig = EMOTION_CONFIG[opt]
                        return (
                          <div
                            key={opt}
                            onClick={() => {
                              updateSegmentEmotion(segment.id, opt as EmotionType)
                              setOpenDropdownId(null)
                            }}
                            style={{
                              padding: '8px 12px',
                              borderRadius: 4,
                              fontSize: 12,
                              color: '#FFFFFF',
                              cursor: 'pointer',
                              backgroundColor:
                                segment.emotion === opt ? optConfig.color + '40' : 'transparent',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = optConfig.color + '30'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor =
                                segment.emotion === opt ? optConfig.color + '40' : 'transparent'
                            }}
                          >
                            {optConfig.label}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                <span style={{ color: '#666688', fontSize: 10 }}>↕ 拖拽排序</span>
              </div>
            </motion.div>
          )
        })}
      </div>

      <div
        style={{
          position: 'fixed',
          right: 24,
          bottom: 24,
          backgroundColor: '#1A1A2ECC',
          backdropFilter: 'blur(8px)',
          padding: '12px 16px',
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
        }}
      >
        <span style={{ color: '#8888AA', fontSize: 12, whiteSpace: 'nowrap' }}>
          {gridColumns} 列
        </span>
        <input
          type="range"
          min={1}
          max={5}
          value={gridColumns}
          onChange={(e) => setGridColumns(Number(e.target.value))}
          style={{
            width: 120,
            height: 4,
            borderRadius: 2,
            backgroundColor: '#3A3A5C',
            appearance: 'none',
            outline: 'none',
            cursor: 'pointer'
          }}
        />
        <style>{`
          input[type="range"]::-webkit-slider-thumb {
            appearance: none;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: #6C63FF;
            cursor: pointer;
            transition: transform 0.2s;
          }
          input[type="range"]::-webkit-slider-thumb:hover {
            transform: scale(1.2);
          }
          input[type="range"]::-moz-range-thumb {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: #6C63FF;
            cursor: pointer;
            border: none;
            transition: transform 0.2s;
          }
          input[type="range"]::-moz-range-thumb:hover {
            transform: scale(1.2);
          }
        `}</style>
      </div>

      {openDropdownId && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 40 }}
          onClick={() => setOpenDropdownId(null)}
        />
      )}
    </div>
  )
}
