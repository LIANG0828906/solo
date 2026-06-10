import React, { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { v4 as uuidv4 } from 'uuid'
import { useGameStore } from '@/store/gameStore'
import { GameEngine, type HitZones } from '@/game/GameEngine'
import Pitcher from '@/components/Pitcher'
import ArrowQuiver from '@/components/ArrowQuiver'
import Arrow from '@/components/Arrow'
import Scoreboard from '@/components/Scoreboard'
import ParticleEffects from '@/components/ParticleEffects'
import type { FeatherColor, PowerLevel, HitResult } from '@/store/gameStore'

const App: React.FC = () => {
  const {
    aimingAngle,
    aimingPower,
    animating,
    currentArrow,
    seatProgress,
    message,
    showSilkRibbon,
    arrowsRemaining,
    setAimingAngle,
    setAimingPower,
    launchArrow,
    updateArrowTrajectory,
    completeArrowAnimation,
    updateScore,
    advanceSeat,
    showMessage,
    hideMessage,
    resetGame,
  } = useGameStore()

  const [hitZones, setHitZones] = useState<HitZones | null>(null)
  const [selectedColor, setSelectedColor] = useState<FeatherColor | null>(null)

  const handleHitZonesReady = useCallback((zones: HitZones) => {
    setHitZones(zones)
  }, [])

  const handleArrowSelect = useCallback((color: string) => {
    if (animating || arrowsRemaining === 0) return
    setSelectedColor(color as FeatherColor)
  }, [animating, arrowsRemaining])

  const handleLaunch = useCallback(() => {
    if (animating || !selectedColor || arrowsRemaining === 0) return

    const startX = window.innerWidth * 0.3
    const startY = window.innerHeight * 0.6

    const arrowId = `arrow-${selectedColor}-${uuidv4().slice(0, 8)}`
    launchArrow(arrowId, selectedColor, startX, startY)

    const trajectory = GameEngine.calculateTrajectory({
      angle: aimingAngle,
      power: aimingPower,
      startX,
      startY,
    })

    const groundY = window.innerHeight * 0.7
    const landingPos = GameEngine.getLandingPosition(trajectory, groundY)

    let hitResult: HitResult = 'miss'
    if (hitZones) {
      hitResult = GameEngine.hitTest(landingPos.x, landingPos.y, hitZones)
    }

    let endX = landingPos.x
    let endY = landingPos.y

    if (hitResult === 'inner' && hitZones) {
      endX = hitZones.inner.x
      endY = hitZones.inner.y
    } else if (hitResult === 'ear' && hitZones) {
      const leftDist = Math.abs(landingPos.x - hitZones.leftEar.x)
      const rightDist = Math.abs(landingPos.x - hitZones.rightEar.x)
      const targetEar = leftDist < rightDist ? hitZones.leftEar : hitZones.rightEar
      endX = targetEar.x
      endY = targetEar.y + 50
    }

    updateArrowTrajectory(endX, endY, hitResult)

    const animationDuration = aimingPower === 'light' ? 1500 : aimingPower === 'medium' ? 1200 : 900

    setTimeout(() => {
      const points = GameEngine.calculateScore(hitResult)
      const msg = GameEngine.getScoreMessage(hitResult)

      updateScore(points)
      showMessage(msg)

      if (hitResult === 'inner' || hitResult === 'ear') {
        const pitcherEl = document.querySelector('.pitcher-wrapper')
        if (pitcherEl) {
          const shakeEvent = new CustomEvent('pitcherHit', { detail: { type: hitResult } })
          pitcherEl.dispatchEvent(shakeEvent)
        }
      }

      setTimeout(() => {
        hideMessage()
      }, 1500)

      setTimeout(() => {
        completeArrowAnimation()
        setSelectedColor(null)

        const newProgress = seatProgress + Math.abs(points)
        if (newProgress >= 5 && points > 0) {
          setTimeout(() => {
            advanceSeat()
          }, 500)
        }
      }, 800)
    }, animationDuration)
  }, [
    animating,
    selectedColor,
    arrowsRemaining,
    aimingAngle,
    aimingPower,
    hitZones,
    launchArrow,
    updateArrowTrajectory,
    updateScore,
    showMessage,
    hideMessage,
    completeArrowAnimation,
    advanceSeat,
    seatProgress,
  ])

  const handlePowerChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value)
    if (value === 1) setAimingPower('light')
    else if (value === 2) setAimingPower('medium')
    else setAimingPower('heavy')
  }, [setAimingPower])

  const getPowerValue = (power: PowerLevel): number => {
    switch (power) {
      case 'light': return 1
      case 'medium': return 2
      case 'heavy': return 3
    }
  }

  const getPowerLabel = (power: PowerLevel): string => {
    switch (power) {
      case 'light': return '轻'
      case 'medium': return '中'
      case 'heavy': return '重'
    }
  }

  useEffect(() => {
    if (arrowsRemaining === 0 && !animating) {
      setTimeout(() => {
        showMessage('一轮结束！点击重新开始')
      }, 1000)
    }
  }, [arrowsRemaining, animating, showMessage])

  const handleReset = useCallback(() => {
    resetGame()
    setSelectedColor(null)
  }, [resetGame])

  return (
    <div className="game-container">
      <div className="candle-light" />

      <div className="scene">
        <div className="floor" />

        <div className="carpet" />

        <div className="ice-container" />

        <Pitcher onHitZonesReady={handleHitZonesReady} />

        <ArrowQuiver onArrowSelect={handleArrowSelect} />

        <Scoreboard />

        {currentArrow && (
          <Arrow
            featherColor={currentArrow.featherColor}
            isInQuiver={false}
            index={0}
          />
        )}

        <ParticleEffects />

        <div className="game-instructions">
          <h4>投壶礼</h4>
          <p>1. 从箭筒选箭</p>
          <p>2. 调整角度(10-60°)</p>
          <p>3. 选择腕力(轻/中/重)</p>
          <p>4. 点击投掷</p>
          <p style={{ marginTop: '10px', fontSize: '11px', opacity: 0.7 }}>
            内壶: 2筹 | 耳环: 1筹 | 失误: -1筹
          </p>
          <p style={{ fontSize: '11px', opacity: 0.7 }}>
            每5筹晋升座次
          </p>
        </div>

        <div className="aiming-controls">
          <div className="angle-control">
            <span>仰角: {aimingAngle}°</span>
            <input
              type="range"
              min="10"
              max="60"
              value={aimingAngle}
              onChange={(e) => setAimingAngle(parseInt(e.target.value))}
              className="control-slider"
              disabled={animating}
            />
          </div>

          <div className="power-control">
            <span>腕力: {getPowerLabel(aimingPower)}</span>
            <input
              type="range"
              min="1"
              max="3"
              step="1"
              value={getPowerValue(aimingPower)}
              onChange={handlePowerChange}
              className="control-slider"
              disabled={animating}
            />
          </div>

          {arrowsRemaining > 0 ? (
            <button
              className="launch-btn"
              onClick={handleLaunch}
              disabled={animating || !selectedColor}
            >
              {animating ? '投掷中...' : selectedColor ? '投！' : '请先选箭'}
            </button>
          ) : (
            <button className="launch-btn" onClick={handleReset}>
              重新开始
            </button>
          )}
        </div>

        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="message-popup"
            >
              {message}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showSilkRibbon && (
            <motion.div
              initial={{ left: '-100%' }}
              animate={{ left: '0%' }}
              exit={{ left: '100%' }}
              transition={{ duration: 1.5, ease: 'easeInOut' }}
              className="silk-ribbon"
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  color: '#ffd700',
                  fontSize: '28px',
                  fontWeight: 'bold',
                  textShadow: '0 0 20px rgba(255, 215, 0, 0.8)',
                }}
              >
                晋升！
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default App
