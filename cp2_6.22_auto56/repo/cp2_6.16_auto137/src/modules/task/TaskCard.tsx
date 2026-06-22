import { useState } from 'react'
import { Calendar, Music, ChevronDown, ChevronUp, Upload, Check } from 'lucide-react'
import type { Task, TaskSubmission } from '@/types'
import { ProgressRing } from '@/components/ProgressRing'
import { StarRating } from '@/components/StarRating'
import { TaskManager } from '@/modules/task/TaskManager'

interface TaskCardProps {
  task: Task
  studentId: string
  isTeacher?: boolean
}

export const TaskCard = ({ task, studentId, isTeacher = true }: TaskCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [content, setContent] = useState('')
  const [feedback, setFeedback] = useState('')
  const [score, setScore] = useState(0)

  const progress = TaskManager.getTaskProgress(task.id, studentId)
  const submission = TaskManager.getSubmission(task.id, studentId)

  const handleSubmit = async () => {
    if (!content.trim()) return
    await TaskManager.submit(task.id, studentId, content)
    setContent('')
  }

  const handleGrade = async () => {
    if (!submission || score === 0) return
    await TaskManager.grade(submission.id, score, feedback)
    setScore(0)
    setFeedback('')
  }

  const deadline = new Date(task.deadline)
  const isOverdue = new Date() > deadline

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-300 ease-out"
      style={{
        background: 'var(--card-bg)',
        border: '2px solid var(--card-border)',
        boxShadow: isExpanded ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
      }}
    >
      <div
        className="p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start gap-4">
          <ProgressRing
            progress={progress}
            size={56}
            strokeWidth={5}
            color={progress === 100 ? '#4CAF50' : isOverdue ? '#F44336' : '#667eea'}
          />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-semibold text-lg truncate" style={{ fontFamily: 'Playfair Display, serif' }}>
                {task.title}
              </h4>
              {isExpanded ? <ChevronUp size={20} className="text-gray-400 flex-shrink-0" /> : <ChevronDown size={20} className="text-gray-400 flex-shrink-0" />}
            </div>
            
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Calendar size={14} />
                {deadline.toLocaleDateString('zh-CN')}
              </span>
              {task.demoAudio && (
                <span className="flex items-center gap-1">
                  <Music size={14} />
                  示范音频
                </span>
              )}
              {isOverdue && progress < 100 && (
                <span className="text-red-500 text-xs font-medium">已逾期</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div
        className={`overflow-hidden transition-all duration-300 ease-out ${
          isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-4 pb-4 border-t pt-4" style={{ borderColor: 'var(--card-border)' }}>
          <p className="text-gray-600 mb-4">{task.description}</p>

          {task.demoAudio && (
            <div className="mb-4 p-3 rounded-xl flex items-center gap-3" style={{ background: 'var(--bg-primary)' }}>
              <Music size={20} className="text-purple-500" />
              <span className="text-sm text-gray-600">示范音频 (虚拟占位)</span>
              <button className="ml-auto px-3 py-1 rounded-lg text-sm font-medium text-white transition-all duration-200 hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
                播放
              </button>
            </div>
          )}

          {submission?.content ? (
            <div className="mb-4 p-4 rounded-xl" style={{ background: 'var(--bg-primary)' }}>
              <div className="flex items-center gap-2 mb-2">
                <Check size={16} className="text-green-500" />
                <span className="text-sm font-medium text-gray-700">已提交</span>
                <span className="text-xs text-gray-400">
                  {new Date(submission.submittedAt).toLocaleString('zh-CN')}
                </span>
              </div>
              <p className="text-sm text-gray-600">{submission.content}</p>
              
              {submission.score > 0 && (
                <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--card-border)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-gray-500">评分：</span>
                    <StarRating value={submission.score} readonly size={16} />
                  </div>
                  {submission.feedback && (
                    <p className="text-sm text-gray-600">
                      <span className="text-gray-500">老师评语：</span>{submission.feedback}
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : !isTeacher ? (
            <div className="space-y-3">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="输入你的练习记录..."
                className="w-full p-3 rounded-xl border-2 resize-none h-24 text-sm focus:outline-none transition-all duration-200"
                style={{ borderColor: 'var(--card-border)' }}
                onFocus={(e) => (e.target.style.borderColor = '#667eea')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--card-border)')}
              />
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105"
                  style={{ background: 'var(--bg-primary)', border: '2px solid var(--card-border)' }}>
                  <Upload size={16} />
                  上传文件
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!content.trim()}
                  className="flex-1 py-2 rounded-xl text-white font-medium transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}
                >
                  提交练习
                </button>
              </div>
            </div>
          ) : null}

          {isTeacher && submission?.content && submission.score === 0 && (
            <div className="mt-4 p-4 rounded-xl space-y-3" style={{ background: '#FFF8E1' }}>
              <h5 className="font-medium text-amber-800">待评分</h5>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">评分：</span>
                <StarRating value={score} onChange={setScore} size={20} />
              </div>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="输入评语..."
                className="w-full p-3 rounded-xl border-2 resize-none h-20 text-sm focus:outline-none"
                style={{ borderColor: 'var(--card-border)' }}
              />
              <button
                onClick={handleGrade}
                disabled={score === 0}
                className="w-full py-2 rounded-xl text-white font-medium transition-all duration-200 hover:scale-[1.02] disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #4CAF50, #66BB6A)' }}
              >
                完成评分
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
