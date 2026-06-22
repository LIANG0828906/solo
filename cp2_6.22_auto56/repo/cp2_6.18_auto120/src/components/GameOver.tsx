import { useGameStore } from '../ui-controller'

interface GameOverProps {
  onRestart: () => void
}

export default function GameOver({ onRestart }: GameOverProps) {
  const score = useGameStore((state) => state.score)

  return (
    <div className="overlay gameover-overlay">
      <div className="overlay-content gameover-content">
        <h2 className="overlay-title gameover-title">游戏结束</h2>
        <p className="overlay-score">
          最终分数: <span className="overlay-score-value">{score}</span>
        </p>
        <button className="restart-button gameover-button" onClick={onRestart}>
          重新开始
        </button>
      </div>
    </div>
  )
}
