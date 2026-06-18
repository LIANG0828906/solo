import { useEffect } from 'react'
import { GameProvider, useGame } from './store'
import EnergyPanel from './energy/EnergyPanel'
import MiningRace from './mining/MiningRace'
import { energyCore } from './energy/EnergyCore'
import { miningEngine } from './mining/MiningEngine'
import { eventBus } from './eventBus'

function GameContent() {
  const { state, dispatch } = useGame()

  useEffect(() => {
    energyCore.start()
    miningEngine.start()
    return () => {
      energyCore.destroy()
      miningEngine.destroy()
    }
  }, [])

  useEffect(() => {
    if (state.game.status !== 'playing') return
    const timer = setInterval(() => {
      dispatch({ type: 'SET_TIME', timeLeft: state.game.timeLeft - 1 })
    }, 1000)
    return () => clearInterval(timer)
  }, [state.game.status, state.game.timeLeft, dispatch])

  useEffect(() => {
    if (state.game.status === 'playing' && state.game.timeLeft <= 0) {
      dispatch({ type: 'END_GAME' })
      const total = state.energy.totalConsumed || 1
      const utilization = (state.mining.playerScore / total) * 100
      eventBus.emit('GAME_OVER', {
        playerScore: state.mining.playerScore,
        npcScore: state.mining.npcScore,
        energyUtilization: utilization,
      })
    }
  }, [state.game.timeLeft, state.game.status, state.mining, state.energy.totalConsumed, dispatch])

  const handleStart = () => {
    eventBus.emit('GAME_START')
    dispatch({ type: 'START_GAME' })
  }

  const handleRestart = () => {
    eventBus.emit('GAME_RESET')
  }

  const getResultText = () => {
    if (state.mining.playerScore > state.mining.npcScore) return '🎉 胜利！'
    if (state.mining.playerScore < state.mining.npcScore) return '💀 失败！'
    return '🤝 平局！'
  }

  const utilization =
    state.energy.totalConsumed > 0
      ? ((state.mining.playerScore / state.energy.totalConsumed) * 100).toFixed(1)
      : '0.0'

  return (
    <div className="app-root">
      <div className="main-layout">
        <div className="mining-area">
          <MiningRace />
        </div>
        <div className="energy-area">
          <EnergyPanel />
        </div>
      </div>

      <div className="status-bar">
        <div className="status-score">
          <span>积分</span>
          <span className="score-value">{state.mining.playerScore}</span>
          <span className="score-npc">/ NPC {state.mining.npcScore}</span>
        </div>
        <div className="status-energy">
          <div className="mini-energy">
            <span className="mini-label">引擎</span>
            <div className="mini-bar">
              <div
                className="mini-fill mini-fill-engine"
                style={{ width: `${state.energy.engine}%` }}
              />
            </div>
            <span className="mini-percent">{Math.round(state.energy.engine)}%</span>
          </div>
          <div className="mini-energy">
            <span className="mini-label">护盾</span>
            <div className="mini-bar">
              <div
                className="mini-fill mini-fill-shield"
                style={{ width: `${state.energy.shield}%` }}
              />
            </div>
            <span className="mini-percent">{Math.round(state.energy.shield)}%</span>
          </div>
        </div>
        <div className="status-time">
          <span>剩余</span>
          <span className={`time-value ${state.game.timeLeft <= 5 ? 'time-warning' : ''}`}>
            {state.game.timeLeft}s
          </span>
        </div>
      </div>

      {state.game.status === 'idle' && (
        <div className="modal-overlay">
          <div className="modal-card modal-start">
            <h1 className="modal-title">星尘航道</h1>
            <p className="modal-subtitle">30秒能量调配与星尘采集竞速</p>
            <div className="modal-rules">
              <p>• 调整滑块分配引擎与护盾能量</p>
              <p>• 按空格键或点击按钮采集晶石</p>
              <p>• 护盾低于20%时飞船减速30%</p>
              <p>• 积分高者获胜</p>
            </div>
            <button className="start-btn" onClick={handleStart}>
              开始游戏
            </button>
          </div>
        </div>
      )}

      {state.game.status === 'finished' && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h2 className="modal-result">{getResultText()}</h2>
            <div className="modal-compare">
              <div className="compare-item">
                <span className="compare-label">玩家</span>
                <span className="compare-score player-score">{state.mining.playerScore}</span>
              </div>
              <span className="compare-vs">VS</span>
              <div className="compare-item">
                <span className="compare-label">NPC</span>
                <span className="compare-score npc-score">{state.mining.npcScore}</span>
              </div>
            </div>
            <div className="modal-stats">
              <p>能量利用率: <span className="stat-value">{utilization}%</span></p>
              <p>总消耗能量: <span className="stat-value">{state.energy.totalConsumed.toFixed(1)}</span></p>
            </div>
            <button className="start-btn" onClick={handleRestart}>
              再玩一局
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function App() {
  return (
    <GameProvider>
      <GameContent />
    </GameProvider>
  )
}
