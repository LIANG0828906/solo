import { cn } from '@/lib/utils'
import type { QuestionOption } from '@shared/types'

interface OptionCardProps {
  option: QuestionOption
  selected: boolean
  disabled?: boolean
  showCorrect?: boolean
  isCorrect?: boolean
  onClick: () => void
}

export default function OptionCard({
  option,
  selected,
  disabled = false,
  showCorrect = false,
  isCorrect = false,
  onClick,
}: OptionCardProps) {
  return (
    <div
      onClick={!disabled ? onClick : undefined}
      className={cn(
        'flex items-start gap-3 rounded-lg border-2 p-4 transition-all duration-200',
        disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:border-primary/50 hover:bg-primary/5',
        selected && !showCorrect && 'border-primary bg-primary/10',
        showCorrect && isCorrect && 'border-secondary bg-secondary/10',
        showCorrect && selected && !isCorrect && 'border-red-500 bg-red-50',
        showCorrect && !selected && !isCorrect && 'border-gray-200 bg-white',
      )}
    >
      <div
        className={cn(
          'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full font-bold text-sm',
          selected && !showCorrect && 'bg-primary text-white',
          showCorrect && isCorrect && 'bg-secondary text-white',
          showCorrect && selected && !isCorrect && 'bg-red-500 text-white',
          !selected && !showCorrect && 'bg-gray-100 text-gray-600',
          showCorrect && !selected && !isCorrect && 'bg-gray-100 text-gray-600',
        )}
      >
        {option.key}
      </div>
      <div className="flex-1 pt-1">
        <p className="text-gray-800">{option.content}</p>
      </div>
    </div>
  )
}
