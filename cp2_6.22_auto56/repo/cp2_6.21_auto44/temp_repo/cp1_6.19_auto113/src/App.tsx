import { useState, useMemo, useEffect } from 'react'
import { DndContext, DragEndEvent, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core'
import { AnimatePresence, motion } from 'framer-motion'
import EmotionPanel from './EmotionPanel'
import CollectorZone from './CollectorZone'
import MiniFigure from './MiniFigure'
import BarChart from './BarChart'
import { EmotionBlock, EmotionType, EMOTIONS } from './types'

export default function App() {
  const [blocks, setBlocks] = useState<EmotionBlock[]>([])
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [dominantEmotion, setDominantEmotion] = useState<EmotionType | 'equal' | 'empty'>('empty')

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 100,
        tolerance: 5,
      },
    })
  )

  const emotionCounts = useMemo(() => {
    const counts: Record<EmotionType, number> = {
      anger: 0,
      calm: 0,
      achievement: 0,
      frustration: 0,
      excitement: 0,
    }
    blocks.forEach(b => {
      counts[b.type]++
    })
    return counts
  }, [blocks])

  const totalCount = useMemo(() => blocks.length, [blocks])

  useEffect(() => {
    if (totalCount === 0) {
      setDominantEmotion('empty')
      return
    }
    const maxCount = Math.max(...Object.values(emotionCounts))
    const maxEmotions = (Object.keys(emotionCounts) as EmotionType[]).filter(
      k => emotionCounts[k] === maxCount
    )
    if (maxEmotions.length === EMOTIONS.length) {
      setDominantEmotion('equal')
    } else if (maxEmotions.length === 1) {
      setDominantEmotion(maxEmotions[0])
    } else {
      setDominantEmotion('equal')
    }
  }, [emotionCounts, totalCount])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && over.id === 'collector-zone') {
      const emotionType = active.id as EmotionType
      if (blocks.length < 200) {
        const newBlock: EmotionBlock = {
          id: `${emotionType}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          type: emotionType,
        }
        setBlocks(prev => [...prev, newBlock])
      }
    }
  }

  const handleRemoveBlock = (blockId: string) => {
    setBlocks(prev => prev.filter(b => b.id !== blockId))
  }

  const handleClearAll = () => {
    setBlocks([])
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div
        style={{
          display: 'flex',
          minHeight: '100vh',
          background: '#FFF8E7',
          padding: '20px',
          gap: '20px',
        }}
        className="main-container"
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '200px',
            flexShrink: 0,
          }}
          className="desktop-panel"
        >
          <EmotionPanel />
        </div>

        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px',
          }}
        >
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: '#333333',
              marginBottom: '10px',
            }}
          >
            🧱 乐高情绪记录器
          </h1>

          <div
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div style={{ position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)' }}>
              <BarChart counts={emotionCounts} total={totalCount} />
            </div>

            <div
              style={{
                background: '#E0E0E0',
                borderRadius: '12px',
                padding: '40px 30px 20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                border: '3px solid #333333',
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
              }}
            >
              <MiniFigure dominantEmotion={dominantEmotion} />

              <div style={{ marginTop: '20px', width: '100%' }}>
                <CollectorZone
                  blocks={blocks}
                  onRemoveBlock={handleRemoveBlock}
                />
              </div>
            </div>
          </div>

          {blocks.length > 0 && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ translateY: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
              onClick={handleClearAll}
              style={{
                padding: '10px 24px',
                background: '#FFFFFF',
                border: '3px solid #333333',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#E74C3C',
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
              }}
            >
              清空全部积木
            </motion.button>
          )}

          <div
            style={{
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap',
              justifyContent: 'center',
              maxWidth: '400px',
            }}
          >
            {EMOTIONS.map(e => (
              <div
                key={e.type}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  background: '#FFFFFF',
                  border: '2px solid #333333',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 500,
                }}
              >
                <div
                  style={{
                    width: '16px',
                    height: '16px',
                    background: e.color,
                    borderRadius: '3px',
                  }}
                />
                <span>{e.labelCN}</span>
                <span style={{ color: '#666' }}>({emotionCounts[e.type]})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <motion.button
        whileTap={{ translateY: 2 }}
        onClick={() => setMobileDrawerOpen(true)}
        style={{
          display: 'none',
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: '#FFD700',
          border: '3px solid #333333',
          boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
          fontSize: '24px',
          zIndex: 100,
          alignItems: 'center',
          justifyContent: 'center',
        }}
        className="mobile-fab"
      >
        🧱
      </motion.button>

      <AnimatePresence>
        {mobileDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileDrawerOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.4)',
                zIndex: 200,
              }}
              className="mobile-overlay"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'tween', duration: 0.3, ease: 'easeOut' }}
              style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                background: '#FFF8E7',
                borderTop: '3px solid #333333',
                borderRadius: '16px 16px 0 0',
                padding: '20px',
                zIndex: 300,
                maxHeight: '60vh',
                overflowY: 'auto',
              }}
              className="mobile-drawer"
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                }}
              >
                <h2 style={{ fontSize: '18px', fontWeight: 700 }}>选择情绪积木</h2>
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  style={{
                    background: '#FFFFFF',
                    border: '2px solid #333333',
                    borderRadius: '8px',
                    padding: '4px 12px',
                    fontSize: '14px',
                    fontWeight: 600,
                  }}
                >
                  关闭
                </button>
              </div>
              <EmotionPanel />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 768px) {
          .desktop-panel { display: none !important; }
          .mobile-fab { display: flex !important; }
          .main-container { flex-direction: column; }
        }
        @media (min-width: 769px) {
          .mobile-fab { display: none !important; }
          .mobile-overlay, .mobile-drawer { display: none !important; }
        }
      `}</style>
    </DndContext>
  )
}
