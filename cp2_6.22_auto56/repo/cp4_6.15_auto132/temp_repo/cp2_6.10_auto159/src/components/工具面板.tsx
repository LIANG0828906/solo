import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePrintStore } from '../store/usePrintStore'

export default function 工具面板() {
  const {
    currentStep,
    arrangedChars,
    inkConcentration,
    pressProgress,
    isPrinted,
    setBrushPosition,
    applyInk,
    setPressProgress,
    setIsPrinted,
    setCurrentStep
  } = usePrintStore()

  const [isBrushing, setIsBrushing] = useState(false)
  const [isPressing, setIsPressing] = useState(false)
  const [inkSplashes, setInkSplashes] = useState<{ id: number; x: number; y: number }[]>([])
  const [paperWrinkles, setPaperWrinkles] = useState<{ id: number; x: number; y: number }[]>([])
  const brushAreaRef = useRef<HTMLDivElement>(null)
  const pressAreaRef = useRef<HTMLDivElement>(null)
  const inkSplashIdRef = useRef(0)
  const wrinkleIdRef = useRef(0)

  const handleBrushMove = (e: React.MouseEvent) => {
    if (currentStep !== 'ink' || !isBrushing) return
    if (arrangedChars.length === 0) return

    const rect = brushAreaRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setBrushPosition({ x: e.clientX, y: e.clientY })
    applyInk(0.3)

    if (Math.random() > 0.7) {
      const newSplash = {
        id: inkSplashIdRef.current++,
        x: x + (Math.random() - 0.5) * 40,
        y: y + (Math.random() - 0.5) * 40
      }
      setInkSplashes(prev => [...prev.slice(-10), newSplash])
      setTimeout(() => {
        setInkSplashes(prev => prev.filter(s => s.id !== newSplash.id))
      }, 500)
    }
  }

  const handlePressStart = (_e: React.MouseEvent | React.TouchEvent) => {
    if (currentStep !== 'press') return
    if (arrangedChars.length === 0) return
    if (inkConcentration < 80) return

    setIsPressing(true)
  }

  const handlePressMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isPressing || currentStep !== 'press') return

    const rect = pressAreaRef.current?.getBoundingClientRect()
    if (!rect) return

    setPressProgress(prev => Math.min(100, prev + 0.5))

    if (Math.random() > 0.8) {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
      const x = clientX - rect.left
      const y = clientY - rect.top

      const newWrinkle = {
        id: wrinkleIdRef.current++,
        x,
        y
      }
      setPaperWrinkles(prev => [...prev.slice(-5), newWrinkle])
    }
  }

  const handlePressEnd = () => {
    setIsPressing(false)
  }

  const handleRevealPaper = () => {
    if (currentStep !== 'reveal') return
    if (pressProgress < 100) return

    setIsPrinted(true)
    setCurrentStep('reveal')
  }

  useEffect(() => {
    const handleMouseUp = () => {
      setIsBrushing(false)
      setIsPressing(false)
    }

    window.addEventListener('mouseup', handleMouseUp)
    return () => window.removeEventListener('mouseup', handleMouseUp)
  }, [])

  const renderToolContent = () => {
    switch (currentStep) {
      case 'ink':
        return (
          <div
            ref={brushAreaRef}
            style={{
              position: 'relative',
              width: '100%',
              height: 120,
              background: 'linear-gradient(135deg, #e8d4a8 0%, #d4c098 100%)',
              border: '2px solid #3a2a1a',
              borderRadius: '4px',
              cursor: arrangedChars.length > 0 && inkConcentration < 100 ? 'crosshair' : 'not-allowed',
              overflow: 'hidden',
              userSelect: 'none'
            }}
            onMouseDown={() => arrangedChars.length > 0 && inkConcentration < 100 && setIsBrushing(true)}
            onMouseMove={handleBrushMove}
            onMouseUp={() => setIsBrushing(false)}
            onMouseLeave={() => setIsBrushing(false)}
          >
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              color: '#4a3a2a',
              fontSize: 14,
              pointerEvents: 'none',
              opacity: 0.6
            }}>
              {arrangedChars.length === 0 
                ? '请先排列活字' 
                : inkConcentration >= 100 
                  ? '墨迹已饱满' 
                  : '按住鼠标在活字上刷动'}
            </div>

            <AnimatePresence>
              {inkSplashes.map(splash => (
                <motion.div
                  key={splash.id}
                  className="ink-splash"
                  style={{
                    left: splash.x,
                    top: splash.y,
                    width: 20,
                    height: 20,
                    marginLeft: -10,
                    marginTop: -10
                  }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 2, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                />
              ))}
            </AnimatePresence>

            {isBrushing && (
              <motion.div
                style={{
                  position: 'absolute',
                  width: 60,
                  height: 60,
                  background: 'radial-gradient(circle, rgba(74, 58, 42, 0.4) 0%, transparent 70%)',
                  borderRadius: '50%',
                  pointerEvents: 'none',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 10
                }}
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.6, 0.8, 0.6]
                }}
                transition={{
                  duration: 0.3,
                  repeat: Infinity
                }}
              />
            )}
          </div>
        )

      case 'press':
        return (
          <div
            ref={pressAreaRef}
            style={{
              position: 'relative',
              width: '100%',
              height: 120,
              background: 'linear-gradient(135deg, #f5e6c8 0%, #e8d4a8 100%)',
              border: '2px solid #3a2a1a',
              borderRadius: '4px',
              cursor: inkConcentration >= 80 && arrangedChars.length > 0 ? 'grab' : 'not-allowed',
              overflow: 'hidden',
              userSelect: 'none'
            }}
            onMouseDown={handlePressStart}
            onMouseMove={handlePressMove}
            onMouseUp={handlePressEnd}
            onMouseLeave={handlePressEnd}
            onTouchStart={handlePressStart}
            onTouchMove={handlePressMove}
            onTouchEnd={handlePressEnd}
          >
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              color: '#4a3a2a',
              fontSize: 14,
              pointerEvents: 'none',
              opacity: 0.6
            }}>
              {arrangedChars.length === 0
                ? '请先排列活字'
                : inkConcentration < 80
                  ? '请先完成刷墨'
                  : pressProgress >= 100
                    ? '拓印完成'
                    : '按住并移动拓包按压'}
            </div>

            {paperWrinkles.map(wrinkle => (
              <div
                key={wrinkle.id}
                className="paper-wrinkle"
                style={{
                  left: wrinkle.x,
                  top: wrinkle.y,
                  width: 40,
                  height: 2,
                  transformOrigin: 'left center'
                }}
              />
            ))}

            <AnimatePresence>
              {isPressing && (
                <motion.div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: 80,
                    height: 80,
                    background: 'radial-gradient(circle, rgba(139, 69, 19, 0.3) 0%, transparent 70%)',
                    borderRadius: '50%',
                    transform: 'translate(-50%, -50%)',
                    pointerEvents: 'none'
                  }}
                  animate={{
                    scale: [1, 1.05, 1],
                    opacity: [0.5, 0.7, 0.5]
                  }}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity
                  }}
                />
              )}
            </AnimatePresence>
          </div>
        )

      case 'reveal':
        return (
          <motion.div
            style={{
              position: 'relative',
              width: '100%',
              height: 120,
              background: 'linear-gradient(135deg, #f5e6c8 0%, #e8d4a8 100%)',
              border: '2px solid #3a2a1a',
              borderRadius: '4px',
              overflow: 'hidden',
              cursor: pressProgress >= 100 && !isPrinted ? 'pointer' : 'default'
            }}
            onClick={handleRevealPaper}
            whileHover={pressProgress >= 100 && !isPrinted ? { scale: 1.01 } : {}}
            whileTap={pressProgress >= 100 && !isPrinted ? { scale: 0.99 } : {}}
          >
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              color: '#4a3a2a',
              fontSize: 14
            }}>
              {pressProgress < 100
                ? '请先完成拓印'
                : isPrinted
                  ? '✓ 印刷完成！'
                  : '点击揭起纸张查看成品'}
            </div>

            {!isPrinted && pressProgress >= 100 && (
              <motion.div
                style={{
                  position: 'absolute',
                  bottom: 10,
                  right: 10,
                  fontSize: 24
                }}
                animate={{
                  y: [0, -5, 0],
                  opacity: [1, 0.7, 1]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity
                }}
              >
                👆
              </motion.div>
            )}

            {isPrinted && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200 }}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  fontSize: 40
                }}
              >
                🎉
              </motion.div>
            )}
          </motion.div>
        )

      default:
        return (
          <div style={{
            padding: 16,
            textAlign: 'center',
            color: '#4a3a2a',
            fontSize: 13,
            background: 'rgba(245, 230, 200, 0.5)',
            border: '1px dashed #3a2a1a',
            borderRadius: '4px'
          }}>
            {currentStep === 'select' && '从左侧字架拖拽活字到中央排盘板'}
            {currentStep === 'arrange' && '完成排列后点击"下一步"进入刷墨工序'}
          </div>
        )
    }
  }

  return (
    <div style={{ padding: 12 }}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div style={{
          fontSize: 14,
          fontWeight: 700,
          color: '#3a2a1a',
          marginBottom: 12,
          textAlign: 'center',
          letterSpacing: 2
        }}>
          {currentStep === 'ink' && '🖌️ 刷墨工具'}
          {currentStep === 'press' && '📦 拓印工具'}
          {currentStep === 'reveal' && '📄 揭纸工序'}
          {(currentStep === 'select' || currentStep === 'arrange') && '🔤 排盘工序'}
        </div>

        {renderToolContent()}

        {(currentStep === 'ink' || currentStep === 'press') && (
          <div style={{ marginTop: 12, fontSize: 12, color: '#4a3a2a', textAlign: 'center' }}>
            {currentStep === 'ink' && (
              <span>当前墨迹: {inkConcentration.toFixed(0)}% / 80%</span>
            )}
            {currentStep === 'press' && (
              <span>拓印进度: {pressProgress.toFixed(0)}% / 100%</span>
            )}
          </div>
        )}

        <AnimatePresence>
          {(currentStep === 'ink' && inkConcentration >= 80) ||
           (currentStep === 'press' && pressProgress >= 100) ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              style={{
                marginTop: 12,
                padding: 10,
                background: 'linear-gradient(135deg, #c8a45a 0%, #a8843a 100%)',
                border: '2px solid #3a2a1a',
                borderRadius: '4px',
                textAlign: 'center',
                color: '#3a2a1a',
                fontWeight: 700,
                fontSize: 13
              }}
            >
              ✓ 本工序完成，可以进入下一步
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
