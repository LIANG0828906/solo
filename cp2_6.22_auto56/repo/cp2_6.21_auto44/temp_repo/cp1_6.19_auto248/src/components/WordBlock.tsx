import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WordBlock as WordBlockType } from '@/types'
import { useArtStore } from '@/store/useArtStore'
import { AnimationWheel } from './AnimationWheel'

interface WordBlockProps {
  block: WordBlockType
  isSelected: boolean
  canvasRef: React.RefObject<HTMLDivElement>
}

const springConfig = { stiffness: 200, damping: 20 }

export const WordBlock = ({ block, isSelected, canvasRef }: WordBlockProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(block.text)
  const textRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const {
    updateWordBlock,
    setSelectedBlockId,
    activeAnimationWheel,
    setActiveAnimationWheel,
    setAnimation,
    deleteWordBlock,
  } = useArtStore()

  useEffect(() => {
    setEditText(block.text)
  }, [block.text])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditing(true)
  }

  const handleBlur = () => {
    setIsEditing(false)
    if (editText.trim() && editText !== block.text) {
      updateWordBlock(block.id, { text: editText.trim() })
    } else {
      setEditText(block.text)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur()
    }
    if (e.key === 'Escape') {
      setEditText(block.text)
      setIsEditing(false)
    }
  }

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: { point: { x: number; y: number } }) => {
    const canvasRect = canvasRef.current?.getBoundingClientRect()
    if (!canvasRect) return

    const x = (info.point.x - canvasRect.left) / canvasRect.width * 100
    const y = (info.point.y - canvasRect.top) / canvasRect.height * 100

    updateWordBlock(block.id, { x, y })
  }

  const handleGearClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setActiveAnimationWheel(activeAnimationWheel === block.id ? null : block.id)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    deleteWordBlock(block.id)
  }

  const renderAnimation = () => {
    const animation = block.animation

    if (animation === 'pulse') {
      return {
        animate: { scale: [1, 1.05, 1] },
        transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
      }
    }

    if (animation === 'float') {
      return {
        animate: { y: [-3, 3, -3] },
        transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
      }
    }

    if (animation === 'breathe') {
      return {
        animate: { opacity: [0.7, 1, 0.7] },
        transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
      }
    }

    return {}
  }

  const renderFlowAnimation = () => {
    if (block.animation !== 'flow') return null

    return (
      <span className="inline-block">
        {block.text.split('').map((char, index) => (
          <motion.span
            key={index}
            style={{
              display: 'inline-block',
              color: block.color,
            }}
            animate={{
              color: [block.color, '#C9A96E', block.color],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              delay: index * 0.3,
              ease: 'easeInOut',
            }}
          >
            {char}
          </motion.span>
        ))}
      </span>
    )
  }

  const animationProps = renderAnimation()

  return (
    <motion.div
      className="absolute cursor-move select-none"
      style={{
        left: `${block.x}%`,
        top: `${block.y}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: isSelected ? 20 : 10,
        willChange: 'transform, opacity',
      }}
      drag
      dragMomentum={false}
      onDragEnd={handleDragEnd}
      whileDrag={{ scale: 1.05, cursor: 'grabbing' }}
      onClick={(e) => {
        e.stopPropagation()
        setSelectedBlockId(block.id)
      }}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{ type: 'spring', ...springConfig }}
    >
      <motion.div
        ref={textRef}
        className="relative"
        style={{
          fontSize: block.fontSize,
          fontWeight: block.fontWeight,
          fontFamily: '"Noto Sans SC", sans-serif',
          color: block.animation === 'flow' ? 'transparent' : block.color,
          lineHeight: 1.2,
          whiteSpace: 'nowrap',
          textShadow: isSelected ? '0 0 20px rgba(201, 169, 110, 0.5)' : 'none',
          padding: '8px 12px',
          borderRadius: 8,
          background: isSelected ? 'rgba(27, 40, 56, 0.5)' : 'transparent',
          border: isSelected ? '2px solid rgba(201, 169, 110, 0.6)' : '2px solid transparent',
          backdropFilter: isSelected ? 'blur(4px)' : 'none',
        }}
        onDoubleClick={handleDoubleClick}
        {...(block.animation !== 'flow' ? animationProps : {})}
      >
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            style={{
              fontSize: 'inherit',
              fontWeight: 'inherit',
              fontFamily: 'inherit',
              color: block.color,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              padding: 0,
              margin: 0,
              width: `${block.text.length + 2}ch`,
              minWidth: '2ch',
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : block.animation === 'flow' ? (
          renderFlowAnimation()
        ) : (
          block.text
        )}

        {isSelected && (
          <>
            <motion.button
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer"
              style={{
                background: 'rgba(243, 166, 131, 0.9)',
                border: '2px solid #F3A683',
                fontSize: 12,
                color: '#1B2838',
              }}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleDelete}
              title="删除"
            >
              ✕
            </motion.button>

            <motion.button
              className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer"
              style={{
                background: 'rgba(27, 40, 56, 0.9)',
                border: '2px solid #8B9DC3',
                fontSize: 14,
                color: '#8B9DC3',
              }}
              whileHover={{ scale: 1.2, rotate: 15, borderColor: '#C9A96E', color: '#C9A96E' }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: 'spring', ...springConfig }}
              onClick={handleGearClick}
              title="动画设置"
            >
              ⚙
            </motion.button>
          </>
        )}

        <AnimatePresence>
          {activeAnimationWheel === block.id && (
            <AnimationWheel
              blockId={block.id}
              currentAnimation={block.animation}
              onSelect={(anim) => setAnimation(block.id, anim)}
              onClose={() => setActiveAnimationWheel(null)}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}
