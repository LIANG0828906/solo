/**
 * ============================================================
 *  QuizPanel - 主持人控制面板组件
 * ============================================================
 *
 *  依赖关系：
 *    - 依赖: src/store.ts (调用题目操作方法、比赛控制方法)
 *    - 依赖: src/types.ts (Question, QuestionType 类型)
 *
 *  数据流向：
 *    输入: 从 store 读取 questions、session 状态
 *    输出: 用户操作 → 调用 store action → 更新全局状态
 *
 *  与其他组件的交互：
 *    - TeamBoard: 通过 store 共享数据，题目管理不直接影响 TeamBoard
 *    - BuzzerPage:
 *        - QuizPanel 调用 startCountdown 触发抢答倒计时
 *        - QuizPanel 调用 nextQuestion 切换到下一题
 *        - 两个组件通过 store.session 共享比赛状态
 *    - ScoreLog: 间接关联，得分由 BuzzerPage 产生
 *
 *  功能模块：
 *    1. 比赛控制区: 开始抢答、下一题、重置
 *    2. 题目列表区: 展示所有题目，支持选中和编辑
 *    3. 题目编辑区: 添加/编辑题目的表单
 * ============================================================
 */

import React, { useState, useEffect } from 'react'
import {
  Plus,
  Trash2,
  Edit3,
  Play,
  SkipForward,
  RotateCcw,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { useQuizStore } from '../store'
import { PRESET_COLORS } from '../types'
import type { Question, QuestionType } from '../types'

const emptyQuestion: Omit<Question, 'id' | 'createdAt'> = {
  type: 'single',
  content: '',
  options: ['', '', '', ''],
  correctAnswer: 0,
  timeLimit: 15,
  tags: [],
}

const QuizPanel: React.FC = () => {
  const {
    questions,
    session,
    teams,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    addTeam,
    updateTeam,
    deleteTeam,
    startCountdown,
    nextQuestion,
    resetSession,
    getCurrentQuestion,
  } = useQuizStore()

  const [activeTab, setActiveTab] = useState<'questions' | 'teams'>('questions')
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [formData, setFormData] = useState<Omit<Question, 'id' | 'createdAt'>>(
    emptyQuestion,
  )
  const [tagInput, setTagInput] = useState('')
  const [newTeamName, setNewTeamName] = useState('')
  const [newTeamColor, setNewTeamColor] = useState(PRESET_COLORS[0])

  const currentQuestion = getCurrentQuestion()

  useEffect(() => {
    if (editingQuestion) {
      setFormData({
        type: editingQuestion.type,
        content: editingQuestion.content,
        options: [...editingQuestion.options],
        correctAnswer: editingQuestion.correctAnswer,
        timeLimit: editingQuestion.timeLimit,
        tags: [...editingQuestion.tags],
      })
    } else if (isAdding) {
      setFormData({
        ...emptyQuestion,
        options: formData.type === 'truefalse' ? ['正确', '错误'] : ['', '', '', ''],
      })
    }
  }, [editingQuestion, isAdding])

  const handleTypeChange = (type: QuestionType) => {
    if (type === 'truefalse') {
      setFormData({
        ...formData,
        type,
        options: ['正确', '错误'],
        correctAnswer: 0,
      })
    } else {
      setFormData({
        ...formData,
        type,
        options: ['', '', '', ''],
        correctAnswer: 0,
      })
    }
  }

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...formData.options]
    newOptions[index] = value
    setFormData({ ...formData, options: newOptions })
  }

  const handleAddTag = () => {
    const tag = tagInput.trim()
    if (tag && !formData.tags.includes(tag)) {
      setFormData({ ...formData, tags: [...formData.tags, tag] })
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter((t) => t !== tag) })
  }

  const handleSubmit = () => {
    if (!formData.content.trim()) return

    if (formData.type === 'single') {
      const hasEmpty = formData.options.some((o) => !o.trim())
      if (hasEmpty) return
    }

    if (editingQuestion) {
      updateQuestion(editingQuestion.id, formData)
    } else {
      addQuestion(formData)
    }

    setEditingQuestion(null)
    setIsAdding(false)
  }

  const handleCancel = () => {
    setEditingQuestion(null)
    setIsAdding(false)
  }

  const handleAddTeam = () => {
    if (newTeamName.trim() && teams.length < 8) {
      addTeam(newTeamName.trim(), newTeamColor)
      setNewTeamName('')
    }
  }

  const handleDeleteTeam = (id: string) => {
    if (teams.length > 2) {
      deleteTeam(id)
    }
  }

  const showEditor = isAdding || editingQuestion

  return (
    <div className="h-full flex flex-col rounded-2xl backdrop-blur-lg bg-white/10 overflow-hidden">
      <div className="p-4 border-b border-white/10">
        <h2 className="text-xl font-bold text-white mb-3">🎮 控制面板</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('questions')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'questions'
                ? 'bg-white/20 text-white'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            题目管理
          </button>
          <button
            onClick={() => setActiveTab('teams')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'teams'
                ? 'bg-white/20 text-white'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            小组管理
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'questions' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setIsAdding(true)
                  setEditingQuestion(null)
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-all hover:-translate-y-0.5"
              >
                <Plus size={16} />
                添加题目
              </button>
              <button
                onClick={startCountdown}
                disabled={questions.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-all hover:-translate-y-0.5 disabled:hover:translate-y-0"
              >
                <Play size={16} />
                开始抢答
              </button>
              <button
                onClick={nextQuestion}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-all hover:-translate-y-0.5"
              >
                <SkipForward size={16} />
                下一题
              </button>
              <button
                onClick={resetSession}
                className="flex items-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-all hover:-translate-y-0.5"
              >
                <RotateCcw size={16} />
                重置
              </button>
            </div>

            <div className="p-3 rounded-lg bg-white/5">
              <div className="text-xs text-white/50 mb-1">当前状态</div>
              <div className="text-sm text-white">
                阶段: <span className="font-medium">{session.phase}</span> |
                第 {session.currentQuestionIndex + 1} / {questions.length} 题
              </div>
              {currentQuestion && (
                <div className="text-sm text-white/80 mt-1 truncate">
                  当前: {currentQuestion.content}
                </div>
              )}
            </div>

            {showEditor && (
              <div className="p-4 rounded-xl bg-white/10 space-y-4">
                <h3 className="text-white font-bold">
                  {editingQuestion ? '编辑题目' : '添加题目'}
                </h3>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleTypeChange('single')}
                    className={`px-3 py-1.5 rounded-lg text-sm ${
                      formData.type === 'single'
                        ? 'bg-blue-500 text-white'
                        : 'bg-white/10 text-white/70'
                    }`}
                  >
                    单选题
                  </button>
                  <button
                    onClick={() => handleTypeChange('truefalse')}
                    className={`px-3 py-1.5 rounded-lg text-sm ${
                      formData.type === 'truefalse'
                        ? 'bg-blue-500 text-white'
                        : 'bg-white/10 text-white/70'
                    }`}
                  >
                    判断题
                  </button>
                </div>

                <div>
                  <label className="block text-sm text-white/70 mb-1">题目内容</label>
                  <textarea
                    value={formData.content}
                    onChange={(e) =>
                      setFormData({ ...formData, content: e.target.value })
                    }
                    className="w-full p-3 rounded-lg bg-white/10 text-white placeholder-white/40 border border-white/10 focus:border-blue-400 focus:outline-none resize-none"
                    rows={2}
                    placeholder="请输入题目内容..."
                  />
                </div>

                <div>
                  <label className="block text-sm text-white/70 mb-2">
                    选项（点击标记正确答案）
                  </label>
                  <div className="space-y-2">
                    {formData.options.map((option, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            setFormData({ ...formData, correctAnswer: index })
                          }
                          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                            formData.correctAnswer === index
                              ? 'bg-green-500 text-white'
                              : 'bg-white/10 text-white/40'
                          }`}
                        >
                          {formData.correctAnswer === index ? (
                            <CheckCircle size={16} />
                          ) : (
                            <span className="text-sm">
                              {String.fromCharCode(65 + index)}
                            </span>
                          )}
                        </button>
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => handleOptionChange(index, e.target.value)}
                          disabled={formData.type === 'truefalse'}
                          className="flex-1 p-2 rounded-lg bg-white/10 text-white placeholder-white/40 border border-white/10 focus:border-blue-400 focus:outline-none disabled:opacity-50"
                          placeholder={`选项 ${String.fromCharCode(65 + index)}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-white/70 mb-1">
                    限时: {formData.timeLimit} 秒
                  </label>
                  <input
                    type="range"
                    min={10}
                    max={30}
                    value={formData.timeLimit}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        timeLimit: Number(e.target.value),
                      })
                    }
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm text-white/70 mb-1">标签</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                      className="flex-1 p-2 rounded-lg bg-white/10 text-white placeholder-white/40 border border-white/10 focus:border-blue-400 focus:outline-none text-sm"
                      placeholder="输入标签后按回车添加"
                    />
                    <button
                      onClick={handleAddTag}
                      className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm"
                    >
                      添加
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-blue-500/30 text-blue-200 rounded text-xs flex items-center gap-1"
                      >
                        {tag}
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-white"
                        >
                          <XCircle size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleSubmit}
                    className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-all"
                  >
                    保存
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-all"
                  >
                    取消
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <h3 className="text-white/70 text-sm font-medium">题目列表</h3>
              {questions.map((q, index) => (
                <div
                  key={q.id}
                  className={`p-3 rounded-lg transition-all cursor-pointer ${
                    index === session.currentQuestionIndex
                      ? 'bg-blue-500/30 border border-blue-400/50'
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs px-2 py-0.5 rounded bg-white/20 text-white/80">
                          {q.type === 'single' ? '单选' : '判断'}
                        </span>
                        <span className="text-xs text-white/50">
                          {q.timeLimit}秒
                        </span>
                      </div>
                      <p className="text-white text-sm truncate">{q.content}</p>
                      <div className="flex gap-1 mt-2">
                        {q.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="px-1.5 py-0.5 bg-white/10 text-white/60 rounded text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => {
                          setEditingQuestion(q)
                          setIsAdding(false)
                        }}
                        className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => deleteQuestion(q.id)}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'teams' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-white/10 space-y-3">
              <h3 className="text-white font-bold">添加小组</h3>
              <input
                type="text"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value.slice(0, 10))}
                maxLength={10}
                className="w-full p-3 rounded-lg bg-white/10 text-white placeholder-white/40 border border-white/10 focus:border-blue-400 focus:outline-none"
                placeholder="小组名称（最多10字）"
              />
              <div>
                <label className="block text-sm text-white/70 mb-2">选择颜色</label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewTeamColor(color)}
                      className={`w-8 h-8 rounded-full transition-all ${
                        newTeamColor === color
                          ? 'ring-2 ring-white ring-offset-2 ring-offset-transparent scale-110'
                          : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <button
                onClick={handleAddTeam}
                disabled={!newTeamName.trim() || teams.length >= 8}
                className="w-full py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all"
              >
                添加小组 ({teams.length}/8)
              </button>
            </div>

            <div className="space-y-2">
              <h3 className="text-white/70 text-sm font-medium">小组列表</h3>
              {teams.map((team) => (
                <div
                  key={team.id}
                  className="p-3 rounded-lg bg-white/5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: team.color }}
                    />
                    <span className="text-white">{team.name}</span>
                    <span className="text-white/50 text-sm">{team.score} 分</span>
                  </div>
                  <button
                    onClick={() => handleDeleteTeam(team.id)}
                    disabled={teams.length <= 2}
                    className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default QuizPanel
