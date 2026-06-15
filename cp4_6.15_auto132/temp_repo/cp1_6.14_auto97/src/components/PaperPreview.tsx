import { InlineMath, BlockMath } from 'react-katex'
import 'katex/dist/katex.min.css'
import { cn } from '@/lib/utils'
import type { Paper, Question } from '@shared/types'

interface PaperPreviewProps {
  paper?: Paper
  questions: Question[]
  title?: string
  className?: string
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

const typeLabels = {
  single: '单选题',
  multiple: '多选题',
  fill: '填空题',
}

export default function PaperPreview({
  paper,
  questions,
  title,
  className,
}: PaperPreviewProps) {
  const displayTitle = title || paper?.title || '试卷预览'
  const totalScore = questions.reduce((sum, q) => sum + q.score, 0)

  return (
    <div className={cn('flex justify-center bg-gray-100 p-4 md:p-8', className)}>
      <div
        className="w-full max-w-[210mm] bg-white shadow-lg"
        style={{
          minHeight: '297mm',
          padding: '20mm',
        }}
      >
        <div className="text-center">
          <h1 className="text-2xl font-bold text-darkBlue">{displayTitle}</h1>
          <div className="mt-2 flex items-center justify-center gap-8 text-sm text-gray-500">
            <span>题号：{questions.length} 题</span>
            <span>总分：{totalScore} 分</span>
          </div>
        </div>

        <div className="mt-8 space-y-8">
          {questions.map((question, index) => (
            <div key={question.id} className="page-break-inside-avoid">
              <div className="flex items-start gap-2">
                <span className="font-bold text-darkBlue">{index + 1}.</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      ({typeLabels[question.type]}，{question.score} 分)
                    </span>
                  </div>
                  <div className="mt-1 text-gray-800 leading-relaxed">
                    {renderLatex(question.content)}
                  </div>

                  {(question.type === 'single' || question.type === 'multiple') && question.options && (
                    <div className="mt-4 space-y-2">
                      {question.options.map((option, optIndex) => (
                        <div key={optIndex} className="flex items-start gap-2">
                          <span className="font-semibold text-gray-700">
                            {option.key}.
                          </span>
                          <span className="text-gray-700">
                            {renderLatex(option.content)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {question.type === 'fill' && (
                    <div className="mt-4">
                      <div className="h-10 w-full border-b-2 border-dashed border-gray-300" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center text-sm text-gray-400">
          - 试卷预览结束 -
        </div>
      </div>
    </div>
  )
}
