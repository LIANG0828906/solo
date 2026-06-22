import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCastingStore } from '@/store'
import { CastingPhase, QuenchMedium } from '@/types'
import './Quenching.css'

export default function Quenching() {
  const [isDragging, setIsDragging] = useState(false)
  const [swordPos, setSwordPos] = useState({ x: 100, y: 50 })
  const [showParams, setShowParams] = useState(false)
  const [isQuenching, setIsQuenching] = useState(false)

  const phase = useCastingStore(state => state.phase)
  const sword = useCastingStore(state => state.sword)
  const quenchParams = useCastingStore(state => state.quenchParams)
  const setQuenchParams = useCastingStore(state => state.setQuenchParams)
  const performQuench = useCastingStore(state => state.performQuench)

  const isActive = phase === CastingPhase.Quenching || (sword.polished && !sword.quenched)

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isActive || sword.quenched) return
    setIsDragging(true)
  }

  const handleDragMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging || !isActive || sword.quenched) return

    const container = e.currentTarget
    const rect = container.getBoundingClientRect()
    let clientX: number, clientY: number

    if ('touches' in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }

    const x = ((clientX - rect.left) / rect.width) * 100
    const y = ((clientY - rect.top) / rect.height) * 100

    setSwordPos({
      x: Math.max(5, Math.min(95, x)),
      y: Math.max(5, Math.min(95, y))
    })

    if (y > 60) {
      setShowParams(true)
    }
  }

  const handleDragEnd = () => {
    setIsDragging(false)
    if (swordPos.y > 60 && !showParams) {
      setShowParams(true)
    }
  }

  const handleQuench = () => {
    setIsQuenching(true)
    setTimeout(() => {
      performQuench()
      setIsQuenching(false)
    }, quenchParams.duration * 1000)
  }

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuenchParams({ duration: Number(e.target.value) })
  }

  const handleMediumChange = (medium: QuenchMedium) => {
    setQuenchParams({ medium })
  }

  if (!sword.polished && phase !== CastingPhase.Quenching) {
    return (
      <div className="quenching-placeholder">
        <p className="seal-text">完成打磨开刃后可进行淬火</p>
      </div>
    )
  }

  return (
    <div className="quenching-container">
      <div
        className="quenching-scene"
        onMouseDown={handleDragStart}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onTouchStart={handleDragStart}
        onTouchMove={handleDragMove}
        onTouchEnd={handleDragEnd}
      >
        <div
          className={`trough water-trough ${quenchParams.medium === QuenchMedium.Water ? 'selected' : ''}`}
          onClick={() => handleMediumChange(QuenchMedium.Water)}
        >
          <div className="trough-label seal-text">水淬</div>
          <div className="water-ripple ripple1" />
          <div className="water-ripple ripple2" />
          <div className="water-ripple ripple3" />
        </div>

        <div
          className={`trough oil-trough ${quenchParams.medium === QuenchMedium.Oil ? 'selected' : ''}`}
          onClick={() => handleMediumChange(QuenchMedium.Oil)}
        >
          <div className="trough-label seal-text">油淬</div>
          <div className="oil-flow flow1" />
          <div className="oil-flow flow2" />
        </div>

        <AnimatePresence>
          {!sword.quenched && (
            <motion.div
              className={`sword-draggable ${isQuenching ? 'quenching' : ''}`}
              style={{
                left: `${swordPos.x}%`,
                top: `${swordPos.y}%`
              }}
              animate={{
                y: isQuenching ? [0, 30, 0] : 0
              }}
              transition={{
                duration: quenchParams.duration,
                ease: 'easeInOut'
              }}
              drag={!isQuenching}
              dragMomentum={false}
            >
              <div className="mini-sword" />
              {isDragging && <span className="drag-hint">拖入槽中</span>}
            </motion.div>
          )}
        </AnimatePresence>

        {isQuenching && (
          <div className="quenching-effect">
            <div className="steam steam1" />
            <div className="steam steam2" />
            <div className="steam steam3" />
          </div>
        )}
      </div>

      <div className="quenching-controls">
        <AnimatePresence mode="wait">
          {!showParams && !sword.quenched ? (
            <motion.div
              key="hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="params-hint"
            >
              <span className="seal-text">将剑拖入水或油槽中开始淬火</span>
            </motion.div>
          ) : sword.quenched ? (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="results-panel"
            >
              <h3 className="results-title seal-text">铸造完成</h3>

              <div className="attributes-chart">
                <div className="chart-row">
                  <span className="attr-label seal-text">硬度</span>
                  <div className="chart-bars">
                    <div
                      className="chart-bar initial"
                      style={{ width: `${sword.initialHardness}%` }}
                    />
                    <div
                      className="chart-bar final"
                      style={{ width: `${sword.hardness}%` }}
                    />
                  </div>
                  <span className="attr-value">{sword.hardness.toFixed(0)}</span>
                </div>

                <div className="chart-row">
                  <span className="attr-label seal-text">韧性</span>
                  <div className="chart-bars">
                    <div
                      className="chart-bar initial"
                      style={{ width: `${sword.initialToughness}%` }}
                    />
                    <div
                      className="chart-bar final"
                      style={{ width: `${sword.toughness}%` }}
                    />
                  </div>
                  <span className="attr-value">{sword.toughness.toFixed(0)}</span>
                </div>

                <div className="chart-row">
                  <span className="attr-label seal-text">锋利度</span>
                  <div className="chart-bars">
                    <div
                      className="chart-bar initial"
                      style={{ width: `${sword.initialSharpness}%` }}
                    />
                    <div
                      className="chart-bar final"
                      style={{ width: `${sword.sharpness}%` }}
                    />
                  </div>
                  <span className="attr-value">{sword.sharpness.toFixed(0)}</span>
                </div>
              </div>

              <div className="chart-legend">
                <span className="legend-item">
                  <span className="legend-dot initial" /> 初始值
                </span>
                <span className="legend-item">
                  <span className="legend-dot final" /> 最终值
                </span>
              </div>

              <div className="final-score">
                <span className="score-label seal-text">综合品质</span>
                <span className="score-value">
                  {((sword.hardness + sword.toughness + sword.sharpness) / 3).toFixed(0)}
                </span>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="params"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="params-panel"
            >
              <h3 className="params-title seal-text">淬火参数</h3>

              <div className="param-group">
                <label className="param-label seal-text">淬火介质</label>
                <div className="medium-buttons">
                  <button
                    className={`medium-btn ${quenchParams.medium === QuenchMedium.Water ? 'active' : ''}`}
                    onClick={() => handleMediumChange(QuenchMedium.Water)}
                  >
                    <span className="seal-text">水淬</span>
                    <small>硬度+20% 韧性-15%</small>
                  </button>
                  <button
                    className={`medium-btn ${quenchParams.medium === QuenchMedium.Oil ? 'active' : ''}`}
                    onClick={() => handleMediumChange(QuenchMedium.Oil)}
                  >
                    <span className="seal-text">油淬</span>
                    <small>硬度+10% 韧性+10%</small>
                  </button>
                </div>
              </div>

              <div className="param-group">
                <div className="param-header">
                  <label className="param-label seal-text">冷却时长</label>
                  <span className="param-value">{quenchParams.duration}秒</span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={8}
                  step={1}
                  value={quenchParams.duration}
                  onChange={handleDurationChange}
                  className="custom-slider"
                />
              </div>

              <div className="risk-indicator">
                <span className="risk-label seal-text">裂纹风险</span>
                <div className="risk-bar-container">
                  <div
                    className={`risk-bar ${quenchParams.crackRisk > 50 ? 'high' : quenchParams.crackRisk > 25 ? 'medium' : 'low'}`}
                    style={{ width: `${quenchParams.crackRisk}%` }}
                  />
                </div>
                <span className="risk-value">{quenchParams.crackRisk.toFixed(0)}%</span>
              </div>

              <button
                className="quench-button"
                onClick={handleQuench}
                disabled={isQuenching}
              >
                <span className="seal-text">
                  {isQuenching ? `淬火中 ${quenchParams.duration}秒...` : '开始淬火'}
                </span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
