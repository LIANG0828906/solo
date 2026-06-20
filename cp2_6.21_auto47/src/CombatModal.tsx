import { useGameStore } from './store'

function CombatModal() {
  const { combatState, handleCombatAttack, handleCombatDefend } = useGameStore()

  if (!combatState) return null

  const playerHpPercentage = (combatState.playerHP / combatState.playerMaxHP) * 100
  const enemyHpPercentage = (combatState.enemyHP / combatState.enemyMaxHP) * 100

  return (
    <div className="modal-overlay">
      <div className="combat-modal">
        <h2 className="combat-title">战斗</h2>

        <div className="combatants">
          <div className="combatant player-combatant">
            <div className="combatant-avatar player-avatar">⚔</div>
            <div className="combatant-name">骑士</div>
            <div className="hp-bar-container combat-hp">
              <div
                className="hp-bar-fill"
                style={{ width: `${playerHpPercentage}%` }}
              />
              <span className="hp-text">
                {combatState.playerHP} / {combatState.playerMaxHP}
              </span>
            </div>
          </div>

          <div className="vs-text">VS</div>

          <div className="combatant enemy-combatant">
            <div className="combatant-avatar enemy-avatar">☠</div>
            <div className="combatant-name">骷髅兵</div>
            <div className="hp-bar-container combat-hp">
              <div
                className="hp-bar-fill"
                style={{ width: `${enemyHpPercentage}%` }}
              />
              <span className="hp-text">
                {combatState.enemyHP} / {combatState.enemyMaxHP}
              </span>
            </div>
          </div>
        </div>

        <div className="combat-log">
          {combatState.log.slice(-3).map((log, idx) => (
            <div key={idx} className="log-entry">
              {log}
            </div>
          ))}
        </div>

        <div className="combat-actions">
          <button className="combat-btn" onClick={handleCombatAttack}>
            攻击
          </button>
          <button className="combat-btn" onClick={handleCombatDefend}>
            防御
          </button>
        </div>
      </div>
    </div>
  )
}

export default CombatModal
