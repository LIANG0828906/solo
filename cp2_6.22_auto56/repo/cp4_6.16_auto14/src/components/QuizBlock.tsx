import React, { useCallback } from 'react'
import type { QuizBlock as QuizBlockType, QuizOption } from '@/types'

interface QuizBlockProps {
  block: QuizBlockType
  isSelected: boolean
  onSelect: () => void
  onUpdate: (updates: Partial<QuizBlockType>) => void
  onDragStart: (e: React.MouseEvent) => void
  onAddOption: () => void
  onRemoveOption: (optionId: string) => void
  onUpdateOption: (optionId: string, updates: Partial<QuizOption>) => void
}

const QuizBlock: React.FC<QuizBlockProps> = React.memo(({ block, isSelected, onSelect, onUpdate, onDragStart, onAddOption, onRemoveOption, onUpdateOption }) => {
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect()
    if (e.button === 0) {
      onDragStart(e)
    }
  }, [onSelect, onDragStart])

  const handleQuestionChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ question: e.target.value })
  }, [onUpdate])

  const handleModeToggle = useCallback(() => {
    onUpdate({ mode: block.mode === 'single' ? 'multi' : 'single' })
  }, [block.mode, onUpdate])

  const totalScore = block.options.filter((o) => o.isCorrect).length

  return (
    <div
      className={`absolute rounded-lg transition-all duration-200 bg-white ${isSelected
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
      <div className="flex flex-col gap-2 p-3 h-full overflow-auto">
        <input
          type="text"
          value={block.question}
          onChange={handleQuestionChange}
          placeholder="输入题目..."
          className="w-full px-2 py-1 text-sm font-medium border-b border-gray-200 focus:outline-none focus:border-[#FF9800] transition-colors duration-200"
          onMouseDown={(e) => e.stopPropagation()}
        />

        <div className="flex items-center gap-2">
          <button
            onClick={handleModeToggle}
            className={`px-2.5 py-0.5 text-xs rounded-full transition-all duration-200 ${block.mode === 'single'
              ? 'bg-[#FF9800] text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            onMouseDown={(e) => e.stopPropagation()}
          >
            单选
          </button>
          <button
            onClick={handleModeToggle}
            className={`px-2.5 py-0.5 text-xs rounded-full transition-all duration-200 ${block.mode === 'multi'
              ? 'bg-[#FF9800] text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            onMouseDown={(e) => e.stopPropagation()}
          >
            多选
          </button>
          <span className="ml-auto text-xs text-gray-400">
            得分: {totalScore}
          </span>
        </div>

        <div className="flex flex-col gap-1.5 flex-1 overflow-auto">
          {block.options.map((option) => (
            <div key={option.id} className="flex items-center gap-1.5">
              {block.mode === 'single' ? (
                <div
                  className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 transition-colors duration-200 cursor-pointer ${option.isCorrect ? 'border-[#FF9800] bg-[#FF9800]' : 'border-gray-300'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation()
                    onUpdateOption(option.id, { isCorrect: !option.isCorrect })
                  }}
                >
                  {option.isCorrect && (
                    <div className="w-full h-full rounded-full flex items-center justify-center">
                      <div className="w-1 h-1 rounded-full bg-white" />
                    </div>
                  )}
                </div>
              ) : (
                <div
                  className={`w-3.5 h-3.5 rounded-sm border-2 flex-shrink-0 flex items-center justify-center transition-colors duration-200 cursor-pointer ${option.isCorrect ? 'border-[#FF9800] bg-[#FF9800]' : 'border-gray-300'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation()
                    onUpdateOption(option.id, { isCorrect: !option.isCorrect })
                  }}
                >
                  {option.isCorrect && (
                    <svg viewBox="0 0 12 12" className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M2 6l3 3 5-6" />
                    </svg>
                  )}
                </div>
              )}
              <input
                type="text"
                value={option.text}
                onChange={(e) => onUpdateOption(option.id, { text: e.target.value })}
                placeholder="选项文字..."
                className="flex-1 px-2 py-0.5 text-xs border border-gray-200 rounded focus:outline-none focus:border-[#FF9800] transition-colors duration-200 min-w-0"
                onMouseDown={(e) => e.stopPropagation()}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onRemoveOption(option.id)
                }}
                className="w-5 h-5 flex-shrink-0 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors duration-200"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <svg viewBox="0 0 16 16" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4l8 8M12 4l-8 8" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation()
            onAddOption()
          }}
          className="w-full py-1 text-xs text-[#FF9800] border border-dashed border-[#FF9800] rounded hover:bg-orange-50 transition-colors duration-200"
          onMouseDown={(e) => e.stopPropagation()}
        >
          + 添加选项
        </button>
      </div>
    </div>
  )
})

QuizBlock.displayName = 'QuizBlock'

export default QuizBlock
