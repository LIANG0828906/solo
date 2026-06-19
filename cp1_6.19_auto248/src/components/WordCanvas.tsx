import { useRef, useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useArtStore } from '@/store/useArtStore'
import { WordBlock } from './WordBlock'
import { EmotionCategory } from '@/types'

const springConfig = { stiffness: 200, damping: 20 }

export const WordCanvas = () => {
  const canvasRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })

  const {
    wordBlocks,
    selectedBlockId,
    canvasTransform,
    setCanvasTransform,
    addWordBlock,
    setSelectedBlockId,
    setActiveAnimationWheel,
  } = useArtStore()

  const isRightMouseDown = useRef(false)
  const lastMousePos = useRef({ x: 0, y: 0 })
  const initialTransform = useRef({ scale: 1, rotation: 0 })
  const pinchStartDistance = useRef(0)
  const pinchStartScale = useRef(1)
  const isPinching = useRef(false)
  const twoTouchStart = useRef<{ x: number; y: number }[]>([])

  useEffect(() => {
    const updateSize = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect()
        setCanvasSize({ width: rect.width, height: rect.height })
      }
    }

    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const text = e.dataTransfer.getData('text/plain')
    const category = e.dataTransfer.getData('category') as EmotionCategory

    if (!text || !category || !canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width * 100
    const y = (e.clientY - rect.top) / rect.height * 100

    addWordBlock(text, category, x, y)
  }

  const handleCanvasClick = () => {
    setSelectedBlockId(null)
    setActiveAnimationWheel(null)
  }

  const getDistance = (touch1: { x: number; y: number }, touch2: { x: number; y: number }) => {
    return Math.sqrt(Math.pow(touch2.x - touch1.x, 2) + Math.pow(touch2.y - touch1.y, 2))
  }

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 3) {
      isPinching.current = true
      const touch1 = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      const touch2 = { x: e.touches[1].clientX, y: e.touches[1].clientY }
      pinchStartDistance.current = getDistance(touch1, touch2)
      pinchStartScale.current = canvasTransform.scale
      twoTouchStart.current = [touch1, touch2]
    }
  }, [canvasTransform.scale])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPinching.current || e.touches.length < 2) return

    const touch1 = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    const touch2 = { x: e.touches[1].clientX, y: e.touches[1].clientY }
    const currentDistance = getDistance(touch1, touch2)

    const scale = Math.max(0.5, Math.min(3, pinchStartScale.current * (currentDistance / pinchStartDistance.current)))

    const angle1 = Math.atan2(
      twoTouchStart.current[1].y - twoTouchStart.current[0].y,
      twoTouchStart.current[1].x - twoTouchStart.current[0].x
    )
    const angle2 = Math.atan2(touch2.y - touch1.y, touch2.x - touch1.x)
    const rotation = initialTransform.current.rotation + (angle2 - angle1) * (180 / Math.PI)

    setCanvasTransform({ scale, rotation })
  }, [setCanvasTransform])

  const handleTouchEnd = useCallback(() => {
    isPinching.current = false
  }, [])

  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (e.button === 2 && e.ctrlKey && canvasRef.current) {
      isRightMouseDown.current = true
      lastMousePos.current = { x: e.clientX, y: e.clientY }
      initialTransform.current = {
        scale: canvasTransform.scale,
        rotation: canvasTransform.rotation,
      }
      e.preventDefault()
    }
  }, [canvasTransform])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isRightMouseDown.current || !canvasRef.current) return

    const deltaX = e.clientX - lastMousePos.current.x
    const deltaY = e.clientY - lastMousePos.current.y

    const newScale = Math.max(0.5, Math.min(3, initialTransform.current.scale + deltaY * 0.01))
    const newRotation = initialTransform.current.rotation + deltaX * 0.5

    setCanvasTransform({
      scale: newScale,
      rotation: newRotation,
    })
  }, [setCanvasTransform])

  const handleMouseUp = useCallback(() => {
    isRightMouseDown.current = false
  }, [])

  const handleContextMenu = (e: React.MouseEvent) => {
    if (e.ctrlKey) {
      e.preventDefault()
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false })
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false })
    canvas.addEventListener('touchend', handleTouchEnd)
    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart)
      canvas.removeEventListener('touchmove', handleTouchMove)
      canvas.removeEventListener('touchend', handleTouchEnd)
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, handleMouseDown, handleMouseMove, handleMouseUp])

  const isOutOfBounds = (x: number, y: number) => {
    return x < 5 || x > 95 || y < 5 || y > 95
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 relative overflow-hidden"
      style={{ background: '#1B2838' }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, #3A506B 0%, #1B2838 70%)',
        }}
      />

      <motion.div
        ref={canvasRef}
        className="absolute inset-8 rounded-2xl overflow-hidden"
        style={{
          border: '2px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 0 40px rgba(255, 255, 255, 0.1), inset 0 0 60px rgba(0, 0, 0, 0.3)',
          cursor: isRightMouseDown.current ? 'grabbing' : 'default',
        }}
        animate={{
          scale: canvasTransform.scale,
          rotate: canvasTransform.rotation,
        }}
        transition={{ type: 'spring', ...springConfig }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleCanvasClick}
        onContextMenu={handleContextMenu}
      >
        <div
          className="absolute inset-0"
          style={{
            background: isDragOver
              ? 'radial-gradient(ellipse at center, rgba(201, 169, 110, 0.15) 0%, transparent 60%)'
              : 'transparent',
            transition: 'background 0.3s ease',
          }}
        />

        <AnimatePresence>
          {wordBlocks.map((block) => (
            <motion.div
              key={block.id}
            >
              <WordBlock
                block={block}
                isSelected={selectedBlockId === block.id}
                canvasRef={canvasRef}
              />
              {isOutOfBounds(block.x, block.y) && (
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    left: `${block.x}%`,
                    top: `${block.y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  animate={{
                    opacity: [0.3, 0.6, 0.3],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <div
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      background: 'radial-gradient(circle, rgba(243, 166, 131, 0.4) 0%, transparent 70%)',
                    }}
                  />
                </motion.div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isDragOver && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div
              className="px-8 py-4 rounded-xl"
              style={{
                background: 'rgba(27, 40, 56, 0.85)',
                backdropFilter: 'blur(8px)',
                border: '2px dashed rgba(201, 169, 110, 0.6)',
                color: '#C9A96E',
                fontFamily: '"Noto Sans SC", sans-serif',
                fontSize: 18,
              }}
            >
              释放以添加词语
            </div>
          </motion.div>
        )}

        {wordBlocks.length === 0 && !isDragOver && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div
              className="text-center"
              style={{
                color: 'rgba(165, 177, 194, 0.6)',
                fontFamily: '"Noto Sans SC", sans-serif',
                fontSize: 20,
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 16 }}>✦</div>
              <div>从左侧拖拽词语到画布</div>
              <div style={{ fontSize: 14, marginTop: 8, opacity: 0.7 }}>
                创作你的情绪文字艺术
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      <div
        className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl text-sm"
        style={{
          background: 'rgba(27, 40, 56, 0.85)',
          backdropFilter: 'blur(8px)',
          color: '#8B9DC3',
          fontFamily: '"Noto Sans SC", sans-serif',
          border: '1px solid rgba(139, 157, 195, 0.3)',
        }}
      >
        缩放: {Math.round(canvasTransform.scale * 100)}% | 旋转: {Math.round(canvasTransform.rotation)}°
      </div>

      <div
        className="absolute top-4 right-4 px-3 py-2 rounded-lg text-xs"
        style={{
          background: 'rgba(27, 40, 56, 0.7)',
          backdropFilter: 'blur(8px)',
          color: '#A5B1C2',
          fontFamily: '"Noto Sans SC", sans-serif',
          border: '1px solid rgba(139, 157, 195, 0.2)',
        }}
      >
        <div>Ctrl + 右键拖拽: 缩放旋转</div>
        <div>三指捏合 (触屏): 缩放旋转</div>
      </div>

      <div className="sr-only" style={{ width: canvasSize.width, height: canvasSize.height }} />
    </div>
  )
}
