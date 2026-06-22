import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDeckStore } from '@/stores/deckStore'

interface ReviewSessionProps {
  onBack: () => void
}

const ratingLabels = [
  { value: 1, label: '完全不记得', color: '#ef4444' },
  { value: 2, label: '看了答案才想起来', color: '#f97316' },
  { value: 3, label: '勉强记得', color: '#eab308' },
  { value: 4, label: '记得不错', color: '#22c55e' },
  { value: 5, label: '记得非常好', color: '#10b981' }
]

const confettiColors = [
  '#667eea',
  '#764ba2',
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#06b6d4',
  '#ec4899'
]

export default function ReviewSession({ onBack }: ReviewSessionProps) {
  const selectedDeckId = useDeckStore((s) => s.selectedDeckId)
  const decks = useDeckStore((s) => s.decks)
  const startReview = useDeckStore((s) => s.startReview)
  const reviewQueue = useDeckStore((s) => s.reviewQueue)
  const currentCardIndex = useDeckStore((s) => s.currentCardIndex)
  const isFlipped = useDeckStore((s) => s.isFlipped)
  const toggleFlip = useDeckStore((s) => s.toggleFlip)
  const rateCard = useDeckStore((s) => s.rateCard)

  const [showCelebration, setShowCelebration] = useState(false)

  const deck = useMemo(
    () => decks.find((d) => d.id === selectedDeckId) || null,
    [decks, selectedDeckId]
  )

  const currentCard = reviewQueue[currentCardIndex]
  const isFinished = currentCardIndex >= reviewQueue.length && reviewQueue.length > 0
  const progress = reviewQueue.length > 0
    ? (currentCardIndex / reviewQueue.length) * 100
    : 0

  useEffect(() => {
    if (selectedDeckId) {
      startReview(selectedDeckId)
    }
  }, [selectedDeckId, startReview])

  useEffect(() => {
    if (isFinished && !showCelebration) {
      setShowCelebration(true)
    }
  }, [isFinished, showCelebration])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        if (!isFinished && currentCard) {
          toggleFlip()
        }
      }
      if (e.key >= '1' && e.key <= '5') {
        if (!isFinished && currentCard && isFlipped) {
          rateCard(parseInt(e.key, 10))
        }
      }
      if (e.code === 'Escape') {
        onBack()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentCard, isFlipped, isFinished, toggleFlip, rateCard, onBack])

  const confettiPieces = useMemo(() => {
    return Array.from({ length: 60 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.5,
      duration: 1.5 + Math.random() * 1.5,
      color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
      size: 6 + Math.random() * 8,
      rotation: Math.random() * 360
    }))
  }, [])

  if (!deck) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '60vh',
          color: '#6b7280'
        }}
      >
        加载中...
      </div>
    )
  }

  if (reviewQueue.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '70vh'
        }}
      >
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          style={{
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #22c55e, #10b981)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 48,
            marginBottom: 24
          }}
        >
          ✓
        </motion.div>
        <h2
          style={{
            fontSize: 24,
            fontWeight: 600,
            color: '#f8f9fa',
            marginBottom: 8
          }}
        >
          今天的复习完成啦！
        </h2>
        <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 32 }}>
          「{deck.name}」没有需要复习的卡片了
        </p>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onBack}
          style={{
            padding: '12px 32px',
            borderRadius: 10,
            border: 'none',
            cursor: 'pointer',
            fontSize: 15,
            fontWeight: 500,
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            color: '#fff'
          }}
        >
          返回卡片组列表
        </motion.button>
      </div>
    )
  }

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minHeight: 'calc(100vh - 140px)'
      }}
    >
      <AnimatePresence>
        {showCelebration &&
          confettiPieces.map((piece) => (
            <motion.div
              key={piece.id}
              className="confetti-piece"
              initial={{ opacity: 1, y: 0, rotate: 0 }}
              animate={{
                opacity: 0,
                y: -window.innerHeight,
                x: (Math.random() - 0.5) * 400,
                rotate: piece.rotation + 360 * (Math.random() > 0.5 ? 1 : -1)
              }}
              transition={{
                duration: piece.duration,
                delay: piece.delay,
                ease: 'easeOut'
              }}
              style={{
                left: `${piece.left}%`,
                width: piece.size,
                height: piece.size,
                backgroundColor: piece.color,
                borderRadius: piece.id % 3 === 0 ? '50%' : '2px'
              }}
            />
          ))}
      </AnimatePresence>

      <div
        style={{
          width: '100%',
          maxWidth: 600,
          marginBottom: 32,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onBack}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: '1px solid #374151',
            backgroundColor: 'transparent',
            color: '#9ca3af',
            cursor: 'pointer',
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          ← 返回
        </motion.button>
        <div style={{ textAlign: 'center' }}>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: '#f8f9fa',
              marginBottom: 2
            }}
          >
            {deck.name}
          </h2>
          <p style={{ fontSize: 13, color: '#6b7280' }}>
            {currentCardIndex + 1} / {reviewQueue.length} · 按 Esc 返回
          </p>
        </div>
        <div style={{ width: 80 }} />
      </div>

      <div
        style={{
          width: '100%',
          maxWidth: 600,
          height: 4,
          borderRadius: 2,
          backgroundColor: '#1e1e2e',
          overflow: 'hidden',
          marginBottom: 40
        }}
      >
        <motion.div
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          style={{
            height: '100%',
            background:
              'linear-gradient(90deg, #667eea, #764ba2, #ef4444, #eab308, #22c55e, #06b6d4)',
            backgroundSize: '200% 100%',
            animation: 'rainbow 3s linear infinite'
          }}
        />
      </div>

      <AnimatePresence mode="wait">
        {!isFinished ? (
          <motion.div
            key="card"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
          >
            <div
              className="card-flip-container"
              style={{ width: 400, height: 280, marginBottom: 32 }}
            >
              <div className={`card-flip-inner ${isFlipped ? 'flipped' : ''}`}>
                <div
                  className="card-flip-front"
                  style={{
                    border: '2px solid #d1d5db',
                    boxShadow: isFlipped
                      ? '0 4px 20px rgba(102, 126, 234, 0.1)'
                      : '0 8px 32px rgba(0,0,0,0.2)'
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: 12,
                      left: 16,
                      fontSize: 11,
                      color: '#9ca3af',
                      fontWeight: 500
                    }}
                  >
                    问题
                  </div>
                  <p
                    style={{
                      fontSize: 20,
                      fontWeight: 500,
                      color: '#1a1a2e',
                      lineHeight: 1.6
                    }}
                  >
                    {currentCard?.front}
                  </p>
                </div>
                <div
                  className="card-flip-back"
                  style={{
                    border: '2px solid #d1d5db',
                    boxShadow: '0 8px 32px rgba(102, 126, 234, 0.15)'
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: 12,
                      left: 16,
                      fontSize: 11,
                      color: '#667eea',
                      fontWeight: 500
                    }}
                  >
                    答案
                  </div>
                  <p
                    style={{
                      fontSize: 20,
                      fontWeight: 500,
                      color: '#1a1a2e',
                      lineHeight: 1.6
                    }}
                  >
                    {currentCard?.back}
                  </p>
                </div>
              </div>
            </div>

            {!isFlipped ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={toggleFlip}
                style={{
                  padding: '14px 36px',
                  borderRadius: 12,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 15,
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  color: '#fff',
                  boxShadow: '0 4px 16px rgba(102, 126, 234, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                显示答案
                <span
                  style={{
                    fontSize: 11,
                    padding: '2px 6px',
                    borderRadius: 4,
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    fontWeight: 400
                  }}
                >
                  Space
                </span>
              </motion.button>
            ) : (
              <div style={{ width: '100%', maxWidth: 500 }}>
                <p
                  style={{
                    textAlign: 'center',
                    fontSize: 13,
                    color: '#6b7280',
                    marginBottom: 16
                  }}
                >
                  你对这张卡片的记忆程度如何？（按数字键 1-5 快速评分）
                </p>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(5, 1fr)',
                    gap: 10
                  }}
                >
                  {ratingLabels.map((rating) => (
                    <motion.button
                      key={rating.value}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => rateCard(rating.value)}
                      style={{
                        padding: '14px 8px',
                        borderRadius: 10,
                        border: 'none',
                        cursor: 'pointer',
                        backgroundColor: `${rating.color}15`,
                        borderTop: `3px solid ${rating.color}`,
                        color: '#f8f9fa',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <span style={{ fontSize: 20, fontWeight: 700 }}>
                        {'★'.repeat(rating.value)}
                        <span style={{ opacity: 0.2 }}>
                          {'★'.repeat(5 - rating.value)}
                        </span>
                      </span>
                      <span style={{ fontSize: 10, color: '#9ca3af' }}>
                        {rating.label}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          padding: '1px 5px',
                          borderRadius: 3,
                          backgroundColor: 'rgba(255,255,255,0.08)',
                          color: '#6b7280'
                        }}
                      >
                        {rating.value}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="finished"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center'
            }}
          >
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                repeatType: 'reverse',
                repeatDelay: 2
              }}
              style={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 56,
                marginBottom: 24,
                boxShadow: '0 16px 48px rgba(102, 126, 234, 0.4)'
              }}
            >
              🎉
            </motion.div>
            <h2
              style={{
                fontSize: 28,
                fontWeight: 700,
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                marginBottom: 8
              }}
            >
              太棒了！
            </h2>
            <p
              style={{
                fontSize: 16,
                color: '#9ca3af',
                marginBottom: 32,
                maxWidth: 400
              }}
            >
              你完成了「{deck.name}」的 {reviewQueue.length} 张卡片复习
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onBack}
              style={{
                padding: '14px 40px',
                borderRadius: 12,
                border: 'none',
                cursor: 'pointer',
                fontSize: 16,
                fontWeight: 600,
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                color: '#fff',
                boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)'
              }}
            >
              返回卡片组列表
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
