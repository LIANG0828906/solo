import { useGameStore } from './store'
import { MAX_TURNS } from './gameEngine'

function StatusBar() {
  const { playerHP, playerMaxHP, playerGold, currentLevel, turnCount } = useGameStore()

  const hpPercentage = (playerHP / playerMaxHP) * 100

  return (
    <div className="status-bar">
      <div className="status-item">
        <span className="status-label">生命值</span>
        <div className="hp-bar-container">
          <div
            className="hp-bar-fill"
            style={{ width: `${hpPercentage}%` }}
          />
          <span className="hp-text">
            {playerHP} / {playerMaxHP}
          </span>
        </div>
      </div>

      <div className="status-item">
        <span className="status-label">回合</span>
        <span className="turn-display">
          {turnCount} / {MAX_TURNS}
        </span>
      </div>

      <div className="status-item">
        <span className="status-label">金币</span>
        <span className="gold-display">{playerGold}</span>
      </div>

      <div className="status-item">
        <span className="status-label">层数</span>
        <span className="level-display">{currentLevel}</span>
      </div>
    </div>
  )
}

export default StatusBar
