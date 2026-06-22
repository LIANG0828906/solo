import React, { useCallback, useEffect, useRef } from 'react'
import type {
  AnyBlock,
  QuizOption,
  TextBlock as TextBlockType,
  ImageBlock as ImageBlockType,
  QuizBlock as QuizBlockType,
} from '@/types'
import TextBlock from './TextBlock'
import ImageBlock from './ImageBlock'
import QuizBlock from './QuizBlock'

interface BlockRendererProps {
  block: AnyBlock
  isSelected: boolean
  onSelect: () => void
  onUpdate: (updates: Partial<AnyBlock>) => void
  onMove: (blockId: string, x: number, y: number) => void
  onMoveEnd: (blockId: string, x: number, y: number) => void
  onDelete: (blockId: string) => void
  onAddQuizOption: () => void
  onRemoveQuizOption: (optionId: string) => void
  onUpdateQuizOption: (optionId: string, updates: Partial<QuizOption>) => void
}

const BlockRenderer: React.FC<BlockRendererProps> = React.memo(
  ({
    block,
    isSelected,
    onSelect,
    onUpdate,
    onMove,
    onMoveEnd,
    onDelete,
    onAddQuizOption,
    onRemoveQuizOption,
    onUpdateQuizOption,
  }) => {
    const dragRef = useRef<{
      isDragging: boolean
      startX: number
      startY: number
      blockStartX: number
      blockStartY: number
    } | null>(null)

    const handleDragStart = useCallback(
      (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('[data-no-drag]')) return
        e.stopPropagation()
        onSelect()
        dragRef.current = {
          isDragging: false,
          startX: e.clientX,
          startY: e.clientY,
          blockStartX: block.x,
          blockStartY: block.y,
        }
      },
      [block.x, block.y, onSelect]
    )

    useEffect(() => {
      const handleMouseMove = (e: MouseEvent) => {
        if (!dragRef.current) return
        const dx = e.clientX - dragRef.current.startX
        const dy = e.clientY - dragRef.current.startY
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
          dragRef.current.isDragging = true
        }
        if (dragRef.current.isDragging) {
          onMove(block.id, dragRef.current.blockStartX + dx, dragRef.current.blockStartY + dy)
        }
      }

      const handleMouseUp = () => {
        if (dragRef.current && dragRef.current.isDragging) {
          onMoveEnd(block.id, block.x, block.y)
        }
        dragRef.current = null
      }

      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }, [block.id, block.x, block.y, onMove, onMoveEnd])

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === 'Delete' || e.key === 'Backspace') {
          if (isSelected && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA' && !(document.activeElement as HTMLElement)?.isContentEditable) {
            e.preventDefault()
            onDelete(block.id)
          }
        }
      },
      [isSelected, block.id, onDelete]
    )

    const commonProps = {
      block,
      isSelected,
      onSelect,
      onUpdate,
      onDragStart: handleDragStart,
      onKeyDown: handleKeyDown,
    }

    switch (block.type) {
      case 'text':
        return <TextBlock {...commonProps} block={block as TextBlockType} />
      case 'image':
        return <ImageBlock {...commonProps} block={block as ImageBlockType} />
      case 'quiz':
        return (
          <QuizBlock
            {...commonProps}
            block={block as QuizBlockType}
            onAddOption={onAddQuizOption}
            onRemoveOption={onRemoveQuizOption}
            onUpdateOption={onUpdateQuizOption}
          />
        )
    }
  }
)

BlockRenderer.displayName = 'BlockRenderer'

export default BlockRenderer
