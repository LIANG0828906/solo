import { GameBoard } from './components/game-board'
import { HUD } from './components/hud'
import { WaveStatsPanel } from './components/wave-stats'
import { useGameStore } from './store/game-store'
import { RotateCcw } from 'lucide-react'

function App() {
  const { gameOver, lives, resetGame } = useGameStore()

  return (
    <div className="game-app">
      <div className="game-container">
        <HUD />
        <div className="game-main-area">
          <GameBoard />
        </div>

        {gameOver && (
          <div className="game-over-overlay">
            <div className="game-over-modal">
              <h2 className="game-over-title">游戏结束</h2>
              <p className="game-over-text">你的生命值已耗尽</p>
              <p className="game-over-lives">剩余生命：{lives}</p>
              <button className="restart-btn" onClick={resetGame}>
                <RotateCcw size={18} />
                重新开始
              </button>
            </div>
          </div>
        )}

        <WaveStatsPanel />
      </div>
    </div>
  )
}

export default App
