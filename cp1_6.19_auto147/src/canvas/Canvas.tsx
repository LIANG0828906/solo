import React, { forwardRef, useEffect, useRef, useState } from 'react'
import { useDrop } from 'react-dnd'
import { motion, AnimatePresence } from 'framer-motion'
import { useEditor } from '@/context/EditorContext'
import type { Sticker, StickerTemplate, CanvasBackground } from '@/types'
import CanvasSticker from './CanvasSticker'
import './Canvas.css'

const BG_OPTIONS: { value: CanvasBackground; label: string }[] = [
  { value: '#FFFFFF', label: '纯白' },
  { value: '#FFF8E1', label: '浅黄' },
  { value: '#E3F2FD', label: '浅蓝' },
  { value: '#FCE4EC', label: '浅粉' },
]

export interface CanvasHandle {}

const Canvas = forwardRef<HTMLDivElement>((_, ref) => {
  const { stickers, selectedStickerId, addSticker, selectSticker, deleteSticker, canvasBackground, setCanvasBackground } = useEditor()
  const [showBgPicker, setShowBgPicker] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'sticker',
    drop: (item: StickerTemplate, monitor) => {
      const offset = monitor.getClientOffset()
      const canvasRect = containerRef.current?.getBoundingClientRect()
      if (!offset || !canvasRect) return
      const x = offset.x - canvasRect.left - 40
      const y = offset.y - canvasRect.top - 40
      addSticker(item, Math.max(0, x), Math.max(0, y))
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }))

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && selectedStickerId) {
        deleteSticker(selectedStickerId)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedStickerId, deleteSticker])

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).dataset.canvasBg === 'true') {
      selectSticker(null)
    }
  }

  const setRefs = (node: HTMLDivElement) => {
    containerRef.current = node
    drop(node)
    if (typeof ref === 'function') {
      ref(node)
    } else if (ref) {
      ;(ref as React.MutableRefObject<HTMLDivElement>).current = node
    }
  }

  return (
    <div className="canvas-container">
      <motion.div
        ref={setRefs}
        className="canvas-area"
        onClick={handleCanvasClick}
        data-canvas-bg="true"
        animate={{ backgroundColor: canvasBackground }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
        style={{
          boxShadow: isOver ? '0 0 0 3px rgba(59, 130, 246, 0.3)' : '0 4px 20px rgba(0,0,0,0.08)',
        }}
      >
        {stickers.map((sticker: Sticker) => (
          <CanvasSticker key={sticker.id} sticker={sticker} isSelected={sticker.id === selectedStickerId} />
        ))}
      </motion.div>

      <div className="bg-toggle-wrapper">
        <motion.button
          className="bg-toggle-btn"
          onClick={() => setShowBgPicker((v) => !v)}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          transition={{ duration: 0.2 }}
        >
          🎨
        </motion.button>

        <AnimatePresence>
          {showBgPicker && (
            <motion.div
              className="bg-picker"
              initial={{ opacity: 0, scale: 0.9, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {BG_OPTIONS.map((opt) => (
                <motion.button
                  key={opt.value}
                  className="bg-option"
                  onClick={() => {
                    setCanvasBackground(opt.value)
                    setShowBgPicker(false)
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{ backgroundColor: opt.value }}
                  title={opt.label}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
})

Canvas.displayName = 'Canvas'

export default Canvas
