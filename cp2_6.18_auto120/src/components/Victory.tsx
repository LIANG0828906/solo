import { useGameStore } from '../ui-controller'

interface VictoryProps {
  onRestart: () => void
}

export default function Victory({ onRestart }: VictoryProps) {
  const score = useGameStore((state) => state.score)

  return (
    <div className="overlay victory-overlay">
      <div className="overlay-content victory-content">
        <h2 className="overlay-title victory-title">轨道已清空</h2>
        <p className="overlay-score">
          最终分数: <span className="overlay-score-value">{score}</span>
        </p>
        <button className="restart-button victory-button" onClick={onRestart}>
          再来一局
        </button>
      </div>
    </div>
  )
}
