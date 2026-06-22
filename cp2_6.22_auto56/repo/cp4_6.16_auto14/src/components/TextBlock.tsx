import React, { useCallback } from 'react'
import type { TextBlock as TextBlockType } from '@/types'

interface TextBlockProps {
  block: TextBlockType
  isSelected: boolean
  onSelect: () => void
  onUpdate: (updates: Partial<TextBlockType>) => void
  onDragStart: (e: React.MouseEvent) => void
}

const TextBlock: React.FC<TextBlockProps> = React.memo(({ block, isSelected, onSelect, onUpdate, onDragStart }) => {
  const handleInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    onUpdate({ content: (e.target as HTMLDivElement).innerHTML })
  }, [onUpdate])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect()
    if (e.button === 0) {
      onDragStart(e)
    }
  }, [onSelect, onDragStart])

  return (
    <div
      className={`absolute rounded-lg transition-all duration-200 ${isSelected
        ? 'border-2 border-[#FF9800]'
        : 'border-2 border-transparent shadow-md hover:shadow-lg'
      }`}
      style={{
        left: block.x,
        top: block.y,
        width: block.width,
        height: block.height,
        animation: isSelected ? 'pulse-glow 2s ease-in-out infinite' : 'none',
      }}
      onMouseDown={handleMouseDown}
    >
      <div
        contentEditable
        suppressContentEditableWarning
        className="w-full h-full p-3 outline-none overflow-auto text-sm leading-relaxed"
        onInput={handleInput}
        dangerouslySetInnerHTML={{ __html: block.content || '' }}
        data-placeholder="点击编辑文字..."
      />
      {!block.content && (
        <span className="absolute top-3 left-3 text-gray-400 pointer-events-none text-sm select-none">
          点击编辑文字...
        </span>
      )}
    </div>
  )
})

TextBlock.displayName = 'TextBlock'

export default TextBlock
