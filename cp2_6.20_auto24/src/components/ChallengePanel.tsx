import React, { useState, useEffect, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import {
  getTodayChallenge,
  currentUser,
  extractTags,
  StyleOption,
  Work,
} from '../data/mockData'

interface ChallengePanelProps {
  onWorkPublished: (work: Work) => void
  onNavigate: (page: string) => void
}

type TimerStatus = 'idle' | 'running' | 'paused' | 'finished'

const ChallengePanel: React.FC<ChallengePanelProps> = ({
  onWorkPublished,
  onNavigate,
}) => {
  const challenge = getTodayChallenge()
  const [selectedStyle, setSelectedStyle] = useState<StyleOption | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [timeLeft, setTimeLeft] = useState(30 * 60)
  const [timerStatus, setTimerStatus] = useState<TimerStatus>('idle')
  const [isLocked, setIsLocked] = useState(false)
  const [isPublished, setIsPublished] = useState(false)

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null

    if (timerStatus === 'running' && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setTimerStatus('finished')
            setIsLocked(true)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [timerStatus, timeLeft])

  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }, [])

  const handleStartWriting = () => {
    if (!selectedStyle) return
    setTimerStatus('running')
  }

  const handlePauseResume = () => {
    if (timerStatus === 'running') {
      setTimerStatus('paused')
    } else if (timerStatus === 'paused') {
      setTimerStatus('running')
    }
  }

  const handleSubmit = () => {
    if (!title.trim() || !content.trim() || !selectedStyle) return

    const work: Work = {
      id: uuidv4(),
      authorId: currentUser.id,
      author: currentUser,
      title: title.trim(),
      content: content.trim(),
      excerpt: content.trim().slice(0, 100) + '...',
      tags: extractTags(content),
      style: selectedStyle.name,
      challengeTheme: challenge.theme,
      publishedAt: new Date().toISOString(),
      applauds: 0,
      criticizes: 0,
      inspires: 0,
      wordCount: content.length,
    }

    onWorkPublished(work)
    setIsPublished(true)
  }

  const isWarning = timeLeft <= 300 && timerStatus === 'running'

  if (isPublished) {
    return (
      <div className="challenge-panel">
        <div className="empty-state">
          <div className="empty-state-icon">🎉</div>
          <div className="empty-state-title">作品已发布！</div>
          <div className="empty-state-desc" style={{ marginBottom: '24px' }}>
            你的作品《{title}》已成功发布到社区
          </div>
          <button className="primary-button" onClick={() => onNavigate('feed')}>
            去看看其他作品
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="challenge-panel">
      <div className="page-header">
        <h1 className="page-title">每日挑战</h1>
        <p className="page-subtitle">选择风格，开始你的30分钟创作之旅</p>
      </div>

      <div className="challenge-theme">
        <div className="challenge-theme-label">今日主题</div>
        <div className="challenge-theme-title">{challenge.theme}</div>
        <div className="challenge-theme-hint">{challenge.description}</div>
      </div>

      {timerStatus === 'idle' && (
        <>
          <div className="style-selector">
            {challenge.styles.map((style) => (
              <div
                key={style.id}
                className={`style-card ${selectedStyle?.id === style.id ? 'selected' : ''}`}
                onClick={() => setSelectedStyle(style)}
              >
                <div className="style-emoji">{style.emoji}</div>
                <div className="style-name">{style.name}</div>
                <div className="style-desc">{style.description}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button
              className="primary-button"
              disabled={!selectedStyle}
              onClick={handleStartWriting}
            >
              开始写作
            </button>
          </div>
        </>
      )}

      {(timerStatus === 'running' ||
        timerStatus === 'paused' ||
        timerStatus === 'finished') && (
        <>
          <div className="timer-container">
            <div
              className={`timer-display ${isWarning ? 'warning' : ''}`}
            >
              {formatTime(timeLeft)}
            </div>
            {timerStatus !== 'finished' && (
              <button
                className="timer-button secondary"
                onClick={handlePauseResume}
              >
                {timerStatus === 'paused' ? '继续' : '暂停'}
              </button>
            )}
          </div>

          <div className="writing-editor">
            <input
              type="text"
              className="editor-title-input"
              placeholder="给你的作品起个标题..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isLocked && title.trim() !== ''}
            />
            <textarea
              className="editor-textarea"
              placeholder="开始你的创作...&#10;&#10;灵感提示：{challenge.description}"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isLocked}
            />
            {isLocked && (
              <div className="editor-locked-overlay">
                <span className="editor-locked-text">
                  ⏰ 时间到！内容已自动锁定，不可再编辑
                </span>
              </div>
            )}
          </div>

          <div className="action-buttons">
            <button
              className="secondary-button"
              onClick={() => onNavigate('feed')}
            >
              稍后发布
            </button>
            <button
              className="primary-button"
              disabled={!title.trim() || !content.trim()}
              onClick={handleSubmit}
            >
              {isLocked ? '发布作品' : '提前发布'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default ChallengePanel
