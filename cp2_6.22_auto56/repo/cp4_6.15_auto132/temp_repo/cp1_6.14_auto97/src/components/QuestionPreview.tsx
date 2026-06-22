import { InlineMath, BlockMath } from 'react-katex'
import 'katex/dist/katex.min.css'
import { cn } from '@/lib/utils'
import type { Question } from '@shared/types'

interface QuestionPreviewProps {
  question: Question | null
  className?: string
  showAnswer?: boolean
}

function renderLatex(text: string) {
  const parts: React.ReactNode[] = []
  const regex = /(\$\$[^$]+\$\$|\$[^$]+\$)/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  let key = 0

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={key++}>{text.slice(lastIndex, match.index)}</span>)
    }

    const latex = match[0]
    const isBlock = latex.startsWith('$$')
    const content = isBlock ? latex.slice(2, -2) : latex.slice(1, -1)

    try {
      if (isBlock) {
        parts.push(
          <div key={key++} className="my-2 overflow-x-auto">
            <BlockMath math={content} />
          </div>,
        )
      } else {
        parts.push(<InlineMath key={key++} math={content} />)
      }
    } catch {
      parts.push(<span key={key++} className="text-red-500">{latex}</span>)
    }

    lastIndex = match.index + latex.length
  }

  if (lastIndex < text.length) {
    parts.push(<span key={key++}>{text.slice(lastIndex)}</span>)
  }

  return parts.length > 0 ? parts : <span>{text}</span>
}

const difficultyLabels = {
  basic: '基础',
  medium: '中等',
  hard: '困难',
}

const difficultyColors = {
  basic: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  hard: 'bg-red-100 text-red-700',
}

const typeLabels = {
  single: '单选题',
  multiple: '多选题',
  fill: '填空题',
}

export default function QuestionPreview({
  question,
  className,
  showAnswer = false,
}: QuestionPreviewProps) {
  if (!question) {
    return (
      <div className={cn('flex h-full items-center justify-center p-6', className)}>
        <p className="text-gray-400">选择题目进行预览</p>
      </div>
    )
  }

  return (
    <div className={cn('h-full overflow-auto p-6', className)}>
      <h3 className="mb-6 text-xl font-semibold text-darkBlue">题目预览</h3>

      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            {typeLabels[question.type]}
          </span>
          <span className={cn('rounded-full px-3 py-1 text-sm font-medium', difficultyColors[question.difficulty])}>
            {difficultyLabels[question.difficulty]}
          </span>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600">
            {question.score} 分
          </span>
        </div>

        <div className="rounded-lg bg-gray-50 p-4">
          <span className="text-xs font-medium text-gray-500">知识点</span>
          <p className="text-sm text-gray-700">{question.knowledgePoint}</p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <span className="text-xs font-medium text-gray-500">题目内容</span>
          <div className="mt-2 text-base text-gray-800 leading-relaxed">
            {renderLatex(question.content)}
          </div>
        </div>

        {(question.type === 'single' || question.type === 'multiple') && question.options && (
          <div className="space-y-3">
            {question.options.map((option, index) => (
              <div
                key={index}
                className={cn(
                  'flex items-start gap-3 rounded-lg border-2 p-4 transition-colors',
                  showAnswer && question.correctAnswer?.includes(option.key)
                    ? 'border-secondary bg-secondary/10'
                    : 'border-gray-200 bg-white',
                )}
              >
                <div
                  className={cn(
                    'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full font-bold text-sm',
                    showAnswer && question.correctAnswer?.includes(option.key)
                      ? 'bg-secondary text-white'
                      : 'bg-gray-100 text-gray-600',
                  )}
                >
                  {option.key}
                </div>
                <div className="flex-1 pt-1">
                  <p className="text-gray-800">{renderLatex(option.content)}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {showAnswer && question.correctAnswer && (question.type === 'single' || question.type === 'multiple') && (
          <div className="rounded-lg bg-secondary/10 p-4">
            <span className="text-xs font-medium text-secondary">正确答案</span>
            <p className="mt-1 font-semibold text-secondary">
              {question.correctAnswer.join('、')}
            </p>
          </div>
        )}

        {showAnswer && question.type === 'fill' && question.fillAnswers && (
          <div className="rounded-lg bg-secondary/10 p-4">
            <span className="text-xs font-medium text-secondary">正确答案</span>
            <div className="mt-1 space-y-1">
              {question.fillAnswers.map((fa, index) => (
                <p key={index} className="font-semibold text-secondary">
                  {fa.answer} ({fa.mode === 'strict' ? '严格匹配' : '模糊匹配'})
                </p>
              ))}
            </div>
          </div>
        )}

        {showAnswer && question.explanation && (
          <div className="rounded-lg bg-blue-50 p-4">
            <span className="text-xs font-medium text-primary">解析</span>
            <div className="mt-1 text-gray-700 leading-relaxed">
              {renderLatex(question.explanation)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
