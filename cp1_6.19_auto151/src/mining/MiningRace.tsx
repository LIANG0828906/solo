import { useEffect, useRef } from 'react'
import { useGame } from '../store'
import { eventBus } from '../eventBus'
import { miningEngine } from './MiningEngine'
import { energyCore } from '../energy/EnergyCore'

export default function MiningRace() {
  const { state, dispatch } = useGame()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let rafId: number
    let lastTime = performance.now()

    const loop = (now: number) => {
      const deltaTime = Math.min((now - lastTime) / 1000, 0.1)
      lastTime = now

      if (state.game.status === 'playing') {
        const mult = energyCore.getSpeedMultiplier()
        miningEngine.setSpeedMultiplier(mult)
        eventBus.emit('GAME_TICK', { deltaTime })

        const pos = miningEngine.getPositions()
        dispatch({
          type: 'UPDATE_SHIP_POSITIONS',
          playerXPercent: pos.playerXPercent,
          npcXPercent: pos.npcXPercent,
        })
        dispatch({ type: 'UPDATE_NPC_SPEED', factor: pos.npcSpeedFactor })

        const crystals = miningEngine.getCrystals()
        dispatch({ type: 'SET_CRYSTALS', crystals })

        const scores = miningEngine.getScores()
        if (scores.playerScore !== state.mining.playerScore) {
          // scores are handled by store via MINING_SUCCESS event
          void scores
        }
      }

      rafId = requestAnimationFrame(loop)
    }

    rafId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafId)
  }, [state.game.status, dispatch])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' && state.game.status === 'playing') {
        e.preventDefault()
        eventBus.emit('MINING_TRIGGERED', {
          playerXPercent: state.mining.playerXPercent,
        })
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [state.game.status, state.mining.playerXPercent])

  useEffect(() => {
    const timer = setInterval(() => {
      state.effects.forEach((effect) => {
        const age = Date.now() - effect.createdAt
        if (age > 500) {
          dispatch({ type: 'REMOVE_EFFECT', id: effect.id })
        }
      })
    }, 100)
    return () => clearInterval(timer)
  }, [state.effects, dispatch])

  const handleCollect = () => {
    if (state.game.status === 'playing') {
      eventBus.emit('MINING_TRIGGERED', {
        playerXPercent: state.mining.playerXPercent,
      })
    }
  }

  const stars = Array.from({ length: 80 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 100,
    size: 1 + Math.random() * 2,
    opacity: 0.3 + Math.random() * 0.4,
  }))

  return (
    <div className="mining-race" ref={containerRef}>
      <div className="starfield">
        {stars.map((s) => (
          <div
            key={s.id}
            className="star"
            style={{
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: `${s.size}px`,
              height: `${s.size}px`,
              opacity: s.opacity,
            }}
          />
        ))}
      </div>

      <div className="track-line" />

      {state.mining.crystals.map((c) => (
        <div
          key={c.id}
          className="crystal"
          style={{
            left: `${c.xPercent}%`,
            bottom: `${c.yOffset}px`,
            width: `${c.size}px`,
            height: `${c.size}px`,
          }}
        />
      ))}

      {state.effects.map((e) => {
        if (e.type === 'ring') {
          return (
            <div
              key={e.id}
              className="collect-ring"
              style={{
                left: `${e.x}%`,
                bottom: `${e.y}px`,
              }}
            />
          )
        }
        return (
          <div
            key={e.id}
            className="particle-container"
            style={{
              left: `${e.x}%`,
              bottom: `${e.y}px`,
            }}
          >
            {Array.from({ length: 8 }).map((_, i) => {
              const angle = (i / 8) * Math.PI * 2
              const dx = Math.cos(angle) * 30
              const dy = Math.sin(angle) * 30
              return (
                <div
                  key={i}
                  className="particle"
                  style={{
                    '--dx': `${dx}px`,
                    '--dy': `${dy}px`,
                  } as React.CSSProperties}
                />
              )
            })}
          </div>
        )
      })}

      <div
        className="ship player-ship"
        style={{ left: `${state.mining.playerXPercent}%` }}
      />
      <div
        className="ship npc-ship"
        style={{ left: `${state.mining.npcXPercent}%` }}
      />

      <div className="ship-label player-label" style={{ left: `${state.mining.playerXPercent}%` }}>
        玩家
      </div>
      <div className="ship-label npc-label" style={{ left: `${state.mining.npcXPercent}%` }}>
        NPC
      </div>

      <button
        className="collect-button"
        onClick={handleCollect}
        disabled={state.game.status !== 'playing'}
      >
        采集 [空格]
      </button>
    </div>
  )
}
