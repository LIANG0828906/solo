import React, { useState, useCallback, useEffect, useRef } from 'react'
import PuzzleBoard from './puzzle/PuzzleBoard'
import FossilModel from './model/FossilModel'
import { eventBus, EVENTS } from './eventBus'
import { FossilPieceData, FossilPreset } from './types'

interface CompleteData {
  pieces: FossilPieceData[]
  score: number
  elapsedTime: number
  fossil: FossilPreset
}

const App: React.FC = () => {
  const [restartTrigger, setRestartTrigger] = useState(0)
  const [hintTrigger, setHintTrigger] = useState(0)
  const [rotateTrigger, setRotateTrigger] = useState(0)
  const [hintMode, setHintMode] = useState(false)

  const [placedCount, setPlacedCount] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [score, setScore] = useState(0)
  const [mistakes, setMistakes] = useState(0)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  const [showModel, setShowModel] = useState(false)
  const [completeData, setCompleteData] = useState<CompleteData | null>(null)

  const handleStateChange = useCallback(
    (state: {
      placedCount: number
      totalCount: number
      score: number
      mistakes: number
      isComplete: boolean
      elapsedTime: number
      currentFossil: FossilPreset | null
    }) => {
      setPlacedCount(state.placedCount)
      setTotalCount(state.totalCount)
      setScore(state.score)
      setMistakes(state.mistakes)
      setElapsedTime(state.elapsedTime)
      setIsComplete(state.isComplete)
    },
    []
  )

  useEffect(() => {
    const unsubscribe = eventBus.on(EVENTS.PUZZLE_COMPLETE, (data: CompleteData) => {
      setCompleteData(data)
      setTimeout(() => setShowModel(true), 1200)
    })
    return unsubscribe
  }, [])

  const handleRestart = () => {
    setShowModel(false)
    setCompleteData(null)
    setIsComplete(false)
    setRestartTrigger((t) => t + 1)
  }

  const handleHint = () => {
    setHintTrigger((t) => t + 1)
  }

  const handleRotate = () => {
    setRotateTrigger((t) => t + 1)
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div className="app-container">
      <div className="header-bar">
        <div className="title-text">古生物化石修复实验室</div>
        <div className="header-buttons">
          <button className="action-btn btn-restart" onClick={handleRestart}>
            重新开始
          </button>
          <button className="action-btn btn-hint" onClick={handleHint}>
            提示
          </button>
          <button className="action-btn btn-rotate" onClick={handleRotate}>
            随机旋转
          </button>
        </div>
      </div>

      <div className="info-bar">
        <div className="info-item">
          <span className="info-label">进度：</span>
          <span className="info-value">
            {placedCount} / {totalCount}
          </span>
        </div>
        <div className="info-item">
          {isComplete ? (
            <span className="final-score">🏆 修复完成！最终得分：{score}</span>
          ) : (
            <>
              <span className="info-label">得分：</span>
              <span className="info-value">{score}</span>
            </>
          )}
        </div>
        <div className="info-item">
          <span className="info-label">错误：</span>
          <span className="info-value" style={{ color: mistakes > 0 ? '#E53935' : undefined }}>
            {mistakes}
          </span>
        </div>
        <div className="info-item">
          <span className="info-label">用时：</span>
          <span className="info-value">{formatTime(elapsedTime)}</span>
        </div>
      </div>

      <PuzzleBoard
        onStateChange={handleStateChange}
        restartTrigger={restartTrigger}
        hintTrigger={hintTrigger}
        rotateTrigger={rotateTrigger}
        hintMode={hintMode}
        setHintMode={setHintMode}
      />

      <FossilModel
        isVisible={showModel}
        onClose={handleRestart}
        completeData={completeData}
      />
    </div>
  )
}

export default App
