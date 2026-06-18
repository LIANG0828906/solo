import React, { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useEditor } from '@/context/EditorContext'
import type { Sticker } from '@/types'

interface CanvasStickerProps {
  sticker: Sticker
  isSelected: boolean
}

const CanvasSticker: React.FC<CanvasStickerProps> = ({ sticker, isSelected }) => {
  const { selectSticker, updateStickerProp } = useEditor()
  const isDragging = useRef(false)
  const startPos = useRef({ x: 0, y: 0 })
  const startOffset = useRef({ x: 0, y: 0 })
  const rafId = useRef<number | null>(null)

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    selectSticker(sticker.id)
    isDragging.current = true
    startPos.current = { x: e.clientX, y: e.clientY }
    startOffset.current = { x: sticker.x, y: sticker.y }
    e.preventDefault()
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return
      if (rafId.current) return
      rafId.current = requestAnimationFrame(() => {
        const dx = e.clientX - startPos.current.x
        const dy = e.clientY - startPos.current.y
        updateStickerProp(sticker.id, {
          x: Math.max(0, startOffset.current.x + dx),
          y: Math.max(0, startOffset.current.y + dy),
        })
        rafId.current = null
      })
    }

    const handleMouseUp = () => {
      isDragging.current = false
      if (rafId.current) {
        cancelAnimationFrame(rafId.current)
        rafId.current = null
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      if (rafId.current) {
        cancelAnimationFrame(rafId.current)
      }
    }
  }, [sticker.id, updateStickerProp])

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    selectSticker(sticker.id)
  }

  return (
    <motion.div
      className="canvas-sticker"
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{
        x: sticker.x,
        y: sticker.y,
        scale: sticker.scale,
        rotate: sticker.rotation,
        opacity: sticker.opacity,
      }}
      transition={{
        scale: { duration: 0.3, ease: 'easeOut' },
        rotate: { duration: 0.3, ease: 'easeOut' },
        opacity: { duration: 0.3, ease: 'easeOut' },
        x: { type: false },
        y: { type: false },
      }}
      style={{
        width: sticker.width,
        height: sticker.height,
        zIndex: sticker.zIndex,
        border: isSelected ? '2px solid #3B82F6' : '2px solid transparent',
      }}
    >
      {sticker.type === 'preset' ? (
        <span className="canvas-sticker-emoji">{sticker.content}</span>
      ) : (
        <img src={sticker.content} alt="" className="canvas-sticker-image" draggable={false} />
      )}
    </motion.div>
  )
}

export default CanvasSticker
