import { useState, useEffect } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import Button from './Button'
import type { Question, QuestionType, Difficulty, MatchMode } from '@shared/types'

interface QuestionEditorProps {
  question: Question | null
  chapterId: string
  onSave: (data: Partial<Question>) => void
  className?: string
}

export default function QuestionEditor({
  question,
  chapterId,
  onSave,
  className,
}: QuestionEditorProps) {
  const [type, setType] = useState<QuestionType>('single')
  const [difficulty, setDifficulty] = useState<Difficulty>('basic')
  const [content, setContent] = useState('')
  const [knowledgePoint, setKnowledgePoint] = useState('')
  const [score, setScore] = useState(10)
  const [options, setOptions] = useState([{ key: 'A', content: '' }, { key: 'B', content: '' }, { key: 'C', content: '' }, { key: 'D', content: '' }])
  const [correctAnswer, setCorrectAnswer] = useState<string[]>([])
  const [fillAnswers, setFillAnswers] = useState<{ answer: string; mode: MatchMode }[]>([{ answer: '', mode: 'strict' }])
  const [explanation, setExplanation] = useState('')

  useEffect(() => {
    if (question) {
      setType(question.type)
      setDifficulty(question.difficulty)
      setContent(question.content)
      setKnowledgePoint(question.knowledgePoint)
      setScore(question.score)
      setOptions(question.options || [{ key: 'A', content: '' }, { key: 'B', content: '' }, { key: 'C', content: '' }, { key: 'D', content: '' }])
      setCorrectAnswer(question.correctAnswer || [])
      setFillAnswers(question.fillAnswers || [{ answer: '', mode: 'strict' }])
      setExplanation(question.explanation)
    } else {
      setType('single')
      setDifficulty('basic')
      setContent('')
      setKnowledgePoint('')
      setScore(10)
      setOptions([{ key: 'A', content: '' }, { key: 'B', content: '' }, { key: 'C', content: '' }, { key: 'D', content: '' }])
      setCorrectAnswer([])
      setFillAnswers([{ answer: '', mode: 'strict' }])
      setExplanation('')
    }
  }, [question])

  const handleSave = () => {
    const data: Partial<Question> = {
      chapterId,
      type,
      difficulty,
      content,
      knowledgePoint,
      score,
      explanation,
    }

    if (type === 'single' || type === 'multiple') {
      data.options = options.filter((o) => o.content.trim() !== '')
      data.correctAnswer = correctAnswer
    } else if (type === 'fill') {
      data.fillAnswers = fillAnswers.filter((a) => a.answer.trim() !== '')
    }

    onSave(data)
  }

  const handleOptionChange = (index: number, content: string) => {
    const newOptions = [...options]
    newOptions[index] = { ...newOptions[index], content }
    setOptions(newOptions)
  }

  const handleCorrectAnswerToggle = (key: string) => {
    if (type === 'single') {
      setCorrectAnswer([key])
    } else {
      setCorrectAnswer(
        correctAnswer.includes(key)
          ? correctAnswer.filter((k) => k !== key)
          : [...correctAnswer, key],
      )
    }
  }

  const handleAddOption = () => {
    const newKey = String.fromCharCode(65 + options.length)
    setOptions([...options, { key: newKey, content: '' }])
  }

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      const removedKey = options[index].key
      setOptions(options.filter((_, i) => i !== index))
      setCorrectAnswer(correctAnswer.filter((k) => k !== removedKey))
    }
  }

  const handleFillAnswerChange = (index: number, field: 'answer' | 'mode', value: string) => {
    const newFillAnswers = [...fillAnswers]
    newFillAnswers[index] = { ...newFillAnswers[index], [field]: value }
    setFillAnswers(newFillAnswers)
  }

  const handleAddFillAnswer = () => {
    setFillAnswers([...fillAnswers, { answer: '', mode: 'strict' }])
  }

  const handleRemoveFillAnswer = (index: number) => {
    if (fillAnswers.length > 1) {
      setFillAnswers(fillAnswers.filter((_, i) => i !== index))
    }
  }

  return (
    <div className={cn('h-full overflow-auto p-6', className)}>
      <h3 className="mb-6 text-xl font-semibold text-darkBlue">
        {question ? '编辑题目' : '新建题目'}
      </h3>

      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">题型</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as QuestionType)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none"
            >
              <option value="single">单选题</option>
              <option value="multiple">多选题</option>
              <option value="fill">填空题</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">难度</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none"
            >
              <option value="basic">基础</option>
              <option value="medium">中等</option>
              <option value="hard">困难</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">分值</label>
            <input
              type="number"
              value={score}
              onChange={(e) => setScore(Number(e.target.value))}
              min="1"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">知识点</label>
          <input
            type="text"
            value={knowledgePoint}
            onChange={(e) => setKnowledgePoint(e.target.value)}
            placeholder="请输入知识点"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">题目内容（支持 LaTeX）</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="例如：求解方程 $x^2 + 2x - 3 = 0$ 的根"
            rows={4}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none"
          />
        </div>

        {(type === 'single' || type === 'multiple') && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">选项</label>
              <button
                onClick={handleAddOption}
                className="flex items-center gap-1 text-sm text-primary hover:text-primary/80"
              >
                <Plus size={16} /> 添加选项
              </button>
            </div>
            <div className="space-y-3">
              {options.map((option, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div
                    onClick={() => handleCorrectAnswerToggle(option.key)}
                    className={cn(
                      'flex h-8 w-8 cursor-pointer items-center justify-center rounded-full font-bold text-sm transition-colors',
                      correctAnswer.includes(option.key)
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                    )}
                  >
                    {option.key}
                  </div>
                  <input
                    type="text"
                    value={option.content}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`选项 ${option.key} 的内容`}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none"
                  />
                  {options.length > 2 && (
                    <button
                      onClick={() => handleRemoveOption(index)}
                      className="p-2 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <p className="mt-2 text-sm text-gray-500">
              点击选项左侧字母设置正确答案 {type === 'multiple' && '（可多选）'}
            </p>
          </div>
        )}

        {type === 'fill' && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">正确答案</label>
              <button
                onClick={handleAddFillAnswer}
                className="flex items-center gap-1 text-sm text-primary hover:text-primary/80"
              >
                <Plus size={16} /> 添加答案
              </button>
            </div>
            <div className="space-y-3">
              {fillAnswers.map((fa, index) => (
                <div key={index} className="flex items-start gap-3">
                  <input
                    type="text"
                    value={fa.answer}
                    onChange={(e) => handleFillAnswerChange(index, 'answer', e.target.value)}
                    placeholder="正确答案"
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none"
                  />
                  <select
                    value={fa.mode}
                    onChange={(e) => handleFillAnswerChange(index, 'mode', e.target.value)}
                    className="w-28 rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none"
                  >
                    <option value="strict">严格匹配</option>
                    <option value="fuzzy">模糊匹配</option>
                  </select>
                  {fillAnswers.length > 1 && (
                    <button
                      onClick={() => handleRemoveFillAnswer(index)}
                      className="p-2 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">解析（支持 LaTeX）</label>
          <textarea
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            placeholder="例如：根据求根公式 $x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$"
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none"
          />
        </div>

        <div className="pt-4">
          <Button onClick={handleSave} className="w-full">
            {question ? '保存修改' : '创建题目'}
          </Button>
        </div>
      </div>
    </div>
  )
}
