/**
 * ============================================================
 *  BuzzerPage - 抢答页面组件
 * ============================================================
 *
 *  依赖关系：
 *    - 依赖: src/store.ts (读取session状态、调用抢答/计分方法)
 *    - 依赖: src/types.ts (Question, Team, QuizPhase 等类型)
 *
 *  数据流向：
 *    输入: 从 store 读取 session、questions、teams 状态
 *    输出:
 *      - 点击大按钮 → 弹出小组选择弹窗
 *      - 选择小组 → 调用 store.buzz() 锁定抢答
 *      - 确认后 → 调用 store.confirmBuzz() 开始答题
 *      - 选择答案 → 调用 store.submitAnswer() 计分
 *      - 倒计时结束 → 自动显示答案
 *
 *  与其他组件的交互：
 *    - QuizPanel:
 *        - QuizPanel 调用 startCountdown 触发 3-2-1 倒计时
 *        - QuizPanel 调用 nextQuestion 切换题目
 *        - 本组件通过 store.session 与 QuizPanel 同步状态
 *    - TeamBoard:
 *        - 抢答成功后，TeamBoard 显示高亮和分数更新
 *        - 两个组件共享 store 中的 teams 和 session 数据
 *    - ScoreLog:
 *        - 答题结束后，得分记录自动写入 store.scoreLogs
 *        - ScoreLog 组件从 store 读取并展示
 *
 *  性能特点：
 *    - 使用 requestAnimationFrame 驱动倒计时，毫秒级精度
 *    - 抢答判定使用时间戳比较，确保 <50ms 延迟
 *    - 状态更新基于 zustand，响应式重渲染
 * ============================================================
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { X, Check } from 'lucide-react'
import { useQuizStore } from '../store'
import { useCountdown } from '../hooks/useCountdown'

const COUNTDOWN_321_MS = 3000

const BuzzerPage: React.FC = () => {
  const {
    session,
    teams,
    getCurrentQuestion,
    getTeamById,
    startBuzzing,
    buzz,
    cancelBuzz,
    confirmBuzz,
    submitAnswer,
    revealAnswer,
  } = useQuizStore()

  const [showTeamModal, setShowTeamModal] = useState(false)
  const [isButtonPressed, setIsButtonPressed] = useState(false)

  const question = getCurrentQuestion()
  const buzzedTeam = session.buzzedTeamId ? getTeamById(session.buzzedTeamId) : null

  const answerDurationMs = question ? question.timeLimit * 1000 : 15000

  const {
    remainingMs: answerRemaining,
    isRunning: answerRunning,
    start: startAnswerCountdown,
    reset: resetAnswerCountdown,
  } = useCountdown({
    duration: answerDurationMs,
    autoStart: false,
    onComplete: () => {
      revealAnswer()
    },
  })

  const {
    remainingMs: countdown321Remaining,
    isRunning: countdown321Running,
    start: start321Countdown,
    reset: reset321Countdown,
  } = useCountdown({
    duration: COUNTDOWN_321_MS,
    autoStart: false,
    onComplete: () => {
      startBuzzing()
    },
  })

  const prevPhaseRef = useRef(session.phase)
  const prevAnswerStartRef = useRef(session.answerStartTime)

  useEffect(() => {
    if (session.phase === 'countdown' && prevPhaseRef.current !== 'countdown') {
      reset321Countdown(COUNTDOWN_321_MS)
      requestAnimationFrame(() => {
        start321Countdown()
      })
    }
    prevPhaseRef.current = session.phase
  }, [session.phase, reset321Countdown, start321Countdown])

  useEffect(() => {
    if (
      session.phase === 'answering' &&
      session.answerStartTime !== null &&
      prevAnswerStartRef.current !== session.answerStartTime
    ) {
      resetAnswerCountdown(answerDurationMs)
      requestAnimationFrame(() => {
        startAnswerCountdown()
      })
    }
    prevAnswerStartRef.current = session.answerStartTime
  }, [
    session.phase,
    session.answerStartTime,
    answerDurationMs,
    resetAnswerCountdown,
    startAnswerCountdown,
  ])

  const countdownDisplay = Math.max(1, Math.ceil(countdown321Remaining / 1000))

  const handleBuzzerClick = useCallback(() => {
    if (session.phase !== 'buzzing') return

    setIsButtonPressed(true)
    setTimeout(() => setIsButtonPressed(false), 150)

    setShowTeamModal(true)
  }, [session.phase])

  const handleTeamSelect = useCallback(
    (teamId: string) => {
      const success = buzz(teamId)
      if (success) {
        setShowTeamModal(false)
      }
    },
    [buzz],
  )

  const handleCancelBuzz = useCallback(() => {
    setShowTeamModal(false)
    cancelBuzz()
  }, [cancelBuzz])

  const handleConfirmBuzz = useCallback(() => {
    confirmBuzz()
  }, [confirmBuzz])

  const handleAnswerSelect = useCallback(
    (answerIndex: number) => {
      if (session.phase !== 'answering' || !session.answerStartTime) return
      submitAnswer(answerIndex)
    },
    [session.phase, session.answerStartTime, submitAnswer],
  )

  const formatMs = (ms: number) => {
    const totalSeconds = ms / 1000
    const seconds = Math.floor(totalSeconds)
    const centiseconds = Math.floor((ms % 1000) / 10)
    return {
      seconds: seconds.toString().padStart(2, '0'),
      centiseconds: centiseconds.toString().padStart(2, '0'),
    }
  }

  const answerTime = formatMs(answerRemaining)

  const getOptionClass = (index: number) => {
    const baseClass =
      'w-full px-6 py-4 rounded-full text-lg font-medium transition-all duration-200 transform text-left'

    if (session.isAnswerRevealed || session.phase === 'result') {
      if (index === question?.correctAnswer) {
        return `${baseClass} bg-green-500 text-white ring-4 ring-green-300 cursor-default`
      }
      return `${baseClass} bg-white/10 text-white/40 cursor-default`
    }

    if (session.phase === 'answering' && session.answerStartTime) {
      return `${baseClass} bg-white/20 text-white hover:bg-white/30 hover:-translate-y-0.5 cursor-pointer`
    }

    return `${baseClass} bg-white/10 text-white/50 cursor-not-allowed`
  }

  return (
    <div className="h-full flex flex-col rounded-2xl backdrop-blur-lg bg-white/10 overflow-hidden relative">
      <div className="p-6 pb-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">🔥 抢答区</h2>
          {answerRunning && (
            <div className="flex items-baseline gap-0.5 text-3xl font-mono font-bold tabular-nums">
              <span
                className={answerRemaining < 5000 ? 'text-red-400' : 'text-yellow-400'}
              >
                {answerTime.seconds}
              </span>
              <span
                className={`text-xl ${
                  answerRemaining < 5000 ? 'text-red-400' : 'text-yellow-400'
                }`}
              >
                .
              </span>
              <span
                className={`text-xl ${
                  answerRemaining < 5000 ? 'text-red-400' : 'text-yellow-400'
                }`}
              >
                {answerTime.centiseconds}
              </span>
              <span className="text-sm text-white/60 ml-1 self-end mb-1">秒</span>
            </div>
          )}
        </div>
      </div>

      {question && (
        <div className="flex-1 flex flex-col p-6 pt-0">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                question.type === 'single'
                  ? 'bg-blue-500/30 text-blue-200'
                  : 'bg-purple-500/30 text-purple-200'
              }`}
            >
              {question.type === 'single' ? '单选题' : '判断题'}
            </span>
            <span className="text-white/50 text-sm">{question.timeLimit}秒限时</span>
            {question.tags.length > 0 && (
              <div className="flex gap-1">
                {question.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 bg-white/10 text-white/60 rounded text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <h3 className="text-2xl md:text-3xl font-bold text-white mb-8 leading-relaxed">
            {question.content}
          </h3>

          <div className="space-y-4 mb-6">
            {question.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                disabled={session.phase !== 'answering' || !session.answerStartTime}
                className={getOptionClass(index)}
              >
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/20 text-white text-sm mr-3 flex-shrink-0">
                  {String.fromCharCode(65 + index)}
                </span>
                {option}
              </button>
            ))}
          </div>

          {session.phase === 'idle' && (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-white/40 text-lg">等待主持人开始抢答...</p>
            </div>
          )}

          {session.phase === 'countdown' && countdown321Running && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-20">
              <div className="text-center">
                <div
                  className="text-[10rem] md:text-[12rem] font-black text-white drop-shadow-2xl"
                  style={{
                    animation: 'pulse 0.5s ease-in-out infinite',
                  }}
                >
                  {countdownDisplay}
                </div>
                <p className="text-xl text-white/70 mt-4">准备抢答...</p>
              </div>
            </div>
          )}

          {session.phase === 'buzzing' && (
            <div className="flex-1 flex items-center justify-center">
              <button
                onClick={handleBuzzerClick}
                className={`
                  relative w-48 h-48 md:w-56 md:h-56 rounded-full
                  bg-gradient-to-br from-red-500 via-red-600 to-red-700
                  text-white text-2xl md:text-3xl font-black
                  shadow-2xl transition-all duration-150
                  cursor-pointer hover:scale-105 active:scale-90
                `}
                style={{
                  boxShadow:
                    '0 0 60px rgba(239, 68, 68, 0.6), 0 0 120px rgba(239, 68, 68, 0.3), inset 0 -8px 20px rgba(0,0,0,0.3)',
                  animation: 'breathe 2s ease-in-out infinite',
                }}
              >
                <span className="relative z-10">抢 答</span>
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background:
                      'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)',
                    animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
                  }}
                />
              </button>
            </div>
          )}

          {buzzedTeam &&
            (session.phase === 'answering' || session.phase === 'result') && (
              <div
                className="p-4 rounded-xl mb-4 flex items-center justify-between flex-wrap gap-3"
                style={{ backgroundColor: `${buzzedTeam.color}30` }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full animate-pulse"
                    style={{
                      backgroundColor: buzzedTeam.color,
                      boxShadow: `0 0 12px ${buzzedTeam.color}`,
                    }}
                  />
                  <span className="text-white font-bold text-lg">
                    {buzzedTeam.name} 抢答成功！
                  </span>
                </div>
                {session.phase === 'answering' && !session.answerStartTime && (
                  <div className="flex gap-2">
                    <button
                      onClick={handleConfirmBuzz}
                      className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium flex items-center gap-1 transition-all"
                    >
                      <Check size={16} />
                      确认答题
                    </button>
                    <button
                      onClick={handleCancelBuzz}
                      className="px-4 py-2 bg-red-500/50 hover:bg-red-500/70 text-white rounded-lg text-sm font-medium flex items-center gap-1 transition-all"
                    >
                      <X size={16} />
                      取消
                    </button>
                  </div>
                )}
              </div>
            )}

          {session.isAnswerRevealed && (
            <div className="p-6 rounded-xl bg-white/10 text-center">
              <p className="text-white text-lg mb-2">正确答案：</p>
              <p className="font-bold text-green-400 text-2xl">
                {String.fromCharCode(65 + (question?.correctAnswer || 0))}.{' '}
                {question?.options[question.correctAnswer]}
              </p>
            </div>
          )}
        </div>
      )}

      {showTeamModal && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-30">
          <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">选择抢答小组</h3>
              <button
                onClick={() => setShowTeamModal(false)}
                className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {teams.map((team) => (
                <button
                  key={team.id}
                  onClick={() => handleTeamSelect(team.id)}
                  className="p-4 rounded-xl text-white font-medium transition-all hover:scale-105 hover:shadow-lg"
                  style={{
                    backgroundColor: `${team.color}30`,
                    borderLeft: `4px solid ${team.color}`,
                  }}
                >
                  <div
                    className="w-4 h-4 rounded-full mx-auto mb-2"
                    style={{ backgroundColor: team.color }}
                  />
                  {team.name}
                </button>
              ))}
            </div>

            <p className="text-center text-white/50 text-sm mt-4">
              请点击选择抢答的小组
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes breathe {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 60px rgba(239, 68, 68, 0.6), 0 0 120px rgba(239, 68, 68, 0.3), inset 0 -8px 20px rgba(0,0,0,0.3);
          }
          50% {
            transform: scale(1.03);
            box-shadow: 0 0 80px rgba(239, 68, 68, 0.8), 0 0 160px rgba(239, 68, 68, 0.4), inset 0 -8px 20px rgba(0,0,0,0.3);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.8;
          }
        }
        
        @keyframes ping {
          75%, 100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}

export default BuzzerPage
