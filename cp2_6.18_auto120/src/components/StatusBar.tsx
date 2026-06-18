import { useGameStore } from '../ui-controller'

export default function StatusBar() {
  const score = useGameStore((state) => state.score)
  const asteroidsRemaining = useGameStore((state) => state.asteroidsRemaining)
  const combo = useGameStore((state) => state.combo)
  const lives = useGameStore((state) => state.lives)
  const isLifeFlashing = useGameStore((state) => state.isLifeFlashing)

  return (
    <div className="status-bar">
      <div className="status-item">
        <span className="status-label">分数</span>
        <span className="status-value">{score}</span>
      </div>
      <div className="status-item">
        <span className="status-label">陨石</span>
        <span className="status-value">{asteroidsRemaining}</span>
      </div>
      <div className="status-item">
        <span className="status-label">连击</span>
        <span className="combo-value">x{combo}</span>
      </div>
      <div className="status-item">
        <span className="status-label">生命</span>
        <div className="lives-container">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`life-icon ${i < lives ? 'active' : 'lost'} ${isLifeFlashing && i === lives ? 'flashing' : ''}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
