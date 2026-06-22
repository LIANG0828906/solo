import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePhotoStore, type EmojiType, type Photo } from '../store/photoStore'
import { LightLeakCanvas, type LightLeakCanvasHandle } from './LightLeakCanvas'

const EMOJI_CONFIG: { type: EmojiType; emoji: string; label: string }[] = [
  { type: 'surprised', emoji: '😮', label: '惊叹' },
  { type: 'moved', emoji: '😭', label: '感动' },
  { type: 'funny', emoji: '😂', label: '幽默' },
  { type: 'peaceful', emoji: '😌', label: '宁静' },
  { type: 'happy', emoji: '😊', label: '愉悦' },
]

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
}

export const PhotoDetailModal = () => {
  const { isModalOpen, selectedPhotoId, photos, closeModal, updateDiary, addEmoji, triggerLightLeak } =
    usePhotoStore()

  const photo = photos.find((p) => p.id === selectedPhotoId) as Photo | undefined

  const [diary, setDiary] = useState('')
  const [isLongPressing, setIsLongPressing] = useState(false)
  const [showLeakHint, setShowLeakHint] = useState(false)
  const [leakTriggered, setLeakTriggered] = useState(false)
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const leakCanvasRef = useRef<LightLeakCanvasHandle>(null)
  const imageContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (photo) {
      setDiary(photo.diary)
      setLeakTriggered(false)
    }
  }, [photo])

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
      }
    }
  }, [])

  const handleDiaryChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value.slice(0, 140)
    setDiary(value)
    if (photo) {
      updateDiary(photo.id, value)
    }
  }

  const handleEmojiClick = (type: EmojiType) => {
    if (photo) {
      addEmoji(photo.id, type)
    }
  }

  const triggerLeakAnimation = useCallback(async () => {
    if (!photo || leakTriggered) return

    const today = new Date().toDateString()
    if (photo.lastLightLeakDate === today) {
      setShowLeakHint(true)
      setTimeout(() => setShowLeakHint(false), 2000)
      return
    }

    const success = triggerLightLeak(photo.id)
    if (success && leakCanvasRef.current) {
      setLeakTriggered(true)
      await leakCanvasRef.current.play()
    }
  }, [photo, leakTriggered, triggerLightLeak])

  const handleMouseDown = () => {
    setIsLongPressing(true)
    longPressTimerRef.current = setTimeout(() => {
      triggerLeakAnimation()
    }, 800)
  }

  const handleMouseUp = () => {
    setIsLongPressing(false)
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
    }
  }

  const handleMouseLeave = () => {
    setIsLongPressing(false)
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
    }
  }

  if (!photo) return null

  const imageWidth = 250
  const imageHeight = Math.round((photo.height / photo.width) * imageWidth)

  return (
    <AnimatePresence>
      {isModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(74, 55, 40, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={closeModal}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '540px',
              maxWidth: '100%',
              backgroundColor: '#fff',
              borderRadius: '16px',
              overflow: 'hidden',
              display: 'flex',
              boxShadow: '0 20px 60px rgba(74, 55, 40, 0.4)',
            }}
          >
            <div
              ref={imageContainerRef}
              style={{
                position: 'relative',
                width: '250px',
                backgroundColor: '#F5F0E8',
                flexShrink: 0,
                cursor: 'pointer',
                userSelect: 'none',
              }}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              onTouchStart={handleMouseDown}
              onTouchEnd={handleMouseUp}
              onTouchCancel={handleMouseLeave}
            >
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: `${imageHeight}px`,
                  overflow: 'hidden',
                }}
              >
                <img
                  src={photo.url}
                  alt={photo.diary || '街头摄影作品'}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
                <LightLeakCanvas ref={leakCanvasRef} width={250} height={imageHeight} />

                {isLongPressing && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundColor: 'rgba(255, 213, 79, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, ease: 'linear', repeat: Infinity }}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        border: '3px solid rgba(255, 213, 79, 0.5)',
                        borderTopColor: '#FFD54F',
                      }}
                    />
                  </motion.div>
                )}

                <div
                  style={{
                    position: 'absolute',
                    bottom: '12px',
                    left: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    backgroundColor: 'rgba(74, 55, 40, 0.7)',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    color: '#EAE0C8',
                    fontSize: '11px',
                  }}
                >
                  <span>✨</span>
                  <span>{photo.lightLeakCount}</span>
                </div>

                <div
                  style={{
                    position: 'absolute',
                    bottom: '12px',
                    right: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: 'rgba(74, 55, 40, 0.7)',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    color: '#EAE0C8',
                    fontSize: '11px',
                  }}
                >
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: photo.dominantColor.hex,
                    }}
                  />
                  <span>{photo.dominantColor.name}</span>
                </div>
              </div>

              <AnimatePresence>
                {showLeakHint && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      backgroundColor: 'rgba(74, 55, 40, 0.9)',
                      color: '#EAE0C8',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    今日已触发过漏光效果 ✨
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div
              style={{
                flex: 1,
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span
                  style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#4A3728',
                  }}
                >
                  {photo.username}
                </span>
                <button
                  onClick={closeModal}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#8D6E63',
                    fontSize: '18px',
                    lineHeight: 1,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#F5F0E8'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  ×
                </button>
              </div>

              <div style={{ flex: 1 }}>
                <textarea
                  value={diary}
                  onChange={handleDiaryChange}
                  placeholder="记录拍摄时的光线条件和心情..."
                  maxLength={140}
                  style={{
                    width: '100%',
                    height: '120px',
                    padding: '12px',
                    border: '1px solid #D7CCC8',
                    borderRadius: '8px',
                    resize: 'none',
                    fontFamily: 'inherit',
                    fontSize: '13px',
                    lineHeight: 1.6,
                    color: '#4A3728',
                    backgroundColor: '#FAF7F2',
                    outline: 'none',
                    transition: 'border-color 0.2s ease',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#4A3728'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#D7CCC8'
                  }}
                />
                <div
                  style={{
                    textAlign: 'right',
                    fontSize: '11px',
                    color: '#8D6E63',
                    marginTop: '4px',
                  }}
                >
                  {diary.length}/140
                </div>
              </div>

              <div
                style={{
                  fontSize: '12px',
                  color: '#8D6E63',
                }}
              >
                发布于 {formatDate(photo.createdAt)}
              </div>

              <div
                style={{
                  borderTop: '1px solid #D7CCC8',
                  paddingTop: '16px',
                }}
              >
                <div
                  style={{
                    fontSize: '12px',
                    color: '#8D6E63',
                    marginBottom: '12px',
                  }}
                >
                  留下你的感受：
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                    flexWrap: 'wrap',
                  }}
                >
                  {EMOJI_CONFIG.map(({ type, emoji, label }) => (
                    <motion.button
                      key={type}
                      onClick={() => handleEmojiClick(type)}
                      whileHover={{ scale: 1.15, backgroundColor: '#F5F0E8' }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '2px',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        backgroundColor: '#FAF7F2',
                        border: '1px solid #D7CCC8',
                        minWidth: '52px',
                      }}
                      title={label}
                    >
                      <span style={{ fontSize: '20px' }}>{emoji}</span>
                      <span
                        style={{
                          fontSize: '11px',
                          color: '#8D6E63',
                        }}
                      >
                        {photo.emojiCounts[type]}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
