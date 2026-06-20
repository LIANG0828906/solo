import { useEffect } from 'react'
import { useGameStore } from './store'
import { MAX_TURNS } from './gameEngine'
import GameMap from './GameMap'
import StatusBar from './StatusBar'
import CombatModal from './CombatModal'

function App() {
  const {
    turnCount,
    isGameOver,
    gameOverReason,
    totalKills,
    totalGold,
    currentLevel,
    combatState,
    showHelp,
    message,
    startNewGame,
    toggleHelp,
    handleCellClick,
  } = useGameStore()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (combatState || isGameOver) return
      
      const { playerPos } = useGameStore.getState()
      let targetPos = { ...playerPos }

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          targetPos.y -= 1
          break
        case 'ArrowDown':
        case 's':
        case 'S':
          targetPos.y += 1
          break
        case 'ArrowLeft':
        case 'a':
        case 'A':
          targetPos.x -= 1
          break
        case 'ArrowRight':
        case 'd':
        case 'D':
          targetPos.x += 1
          break
        default:
          return
      }

      if (
        targetPos.x >= 0 &&
        targetPos.x < 8 &&
        targetPos.y >= 0 &&
        targetPos.y < 8
      ) {
        handleCellClick(targetPos)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [combatState, isGameOver, handleCellClick])

  const isTurnLow = turnCount <= 5

  return (
    <div className="app-container">
      <div className="turn-timer">
        <span className={isTurnLow ? 'turn-low' : ''}>
          {turnCount} / {MAX_TURNS}
        </span>
      </div>

      <div className="menu-container">
        <button className="menu-btn" onClick={startNewGame}>
          新游戏
        </button>
        <button className="menu-btn" onClick={toggleHelp}>
          帮助
        </button>
      </div>

      {message && <div className="game-message">{message}</div>}

      <GameMap />

      <StatusBar />

      {combatState && <CombatModal />}

      {showHelp && (
        <div className="modal-overlay" onClick={toggleHelp}>
          <div className="help-modal" onClick={(e) => e.stopPropagation()}>
            <h2>游戏帮助</h2>
            <ul>
              <li>点击相邻格子或使用 WASD/方向键 移动</li>
              <li>移动消耗1回合，敌人也会同步移动</li>
              <li>点击相邻的敌人进入战斗</li>
              <li>战斗中可选择攻击或防御</li>
              <li>宝箱可获得金币或恢复药剂</li>
              <li>陷阱会造成5点伤害</li>
              <li>到达右下角出口进入下一层</li>
              <li>每关有15回合限制</li>
            </ul>
            <button className="menu-btn" onClick={toggleHelp}>
              关闭
            </button>
          </div>
        </div>
      )}

      {isGameOver && (
        <div className="modal-overlay">
          <div className="gameover-modal">
            <h2>游戏结束</h2>
            <p>{gameOverReason}</p>
            <div className="gameover-stats">
              <p>总击杀数: {totalKills}</p>
              <p>获得金币: {totalGold}</p>
              <p>到达层数: {currentLevel}</p>
            </div>
            <button className="restart-btn" onClick={startNewGame}>
              重新开始
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
