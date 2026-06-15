import React, { useCallback, useEffect, useRef } from 'react'
import type { AnyBlock, QuizOption } from '@/types'
import TextBlock from './TextBlock'
import ImageBlock from './ImageBlock'
import QuizBlock from './QuizBlock'

interface BlockRendererProps {
  block: AnyBlock
  isSelected: boolean
  onSelect: () => void
  onUpdate: (updates: Partial<AnyBlock>) => void
  onMove: (blockId: string, x: number, y: number) => void
  onAddQuizOption: (blockId: string) => void
  onRemoveQuizOption: (blockId: string, optionId: string) => void
  onUpdateQuizOption: (blockId: string, optionId: string, updates: Partial<QuizOption>) => void
}

const BlockRenderer: React.FC<BlockRendererProps> = React.memo(({ block, isSelected, onSelect, onUpdate, onMove, onAddQuizOption, onRemoveQuizOption, onUpdateQuizOption }) => {
  const dragRef = useRef<{
    startX: number
    startY: number
    blockStartX: number
    blockStartY: number
  } | null>(null)

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      blockStartX: block.x,
      blockStartY: block.y,
    }
  }, [block.x, block.y])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return
      const dx = e.clientX - dragRef.current.startX
      const dy = e.clientY - dragRef.current.startY
      onMove(block.id, dragRef.current.blockStartX + dx, dragRef.current.blockStartY + dy)
    }

    const handleMouseUp = () => {
      dragRef.current = null
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [block.id, onMove])

  switch (block.type) {
    case 'text':
      return (
        <TextBlock
          block={block}
          isSelected={isSelected}
          onSelect={onSelect}
          onUpdate={onUpdate}
          onDragStart={handleDragStart}
        />
      )
    case 'image':
      return (
        <ImageBlock
          block={block}
          isSelected={isSelected}
          onSelect={onSelect}
          onUpdate={onUpdate}
          onDragStart={handleDragStart}
        />
      )
    case 'quiz':
      return (
        <QuizBlock
          block={block}
          isSelected={isSelected}
          onSelect={onSelect}
          onUpdate={onUpdate}
          onDragStart={handleDragStart}
          onAddOption={() => onAddQuizOption(block.id)}
          onRemoveOption={(optionId) => onRemoveQuizOption(block.id, optionId)}
          onUpdateOption={(optionId, updates) => onUpdateQuizOption(block.id, optionId, updates)}
        />
      )
  }
})

BlockRenderer.displayName = 'BlockRenderer'

export default BlockRenderer
