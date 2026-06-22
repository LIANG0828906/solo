import { useGameStore } from '../state'
import { eventBus } from '../EventBus'

export default function GameOverScreen() {
  const score = useGameStore((state) => state.score)
  const difficulty = useGameStore((state) => state.difficulty)

  const handleRestart = () => {
    eventBus.emit('restartGame')
  }

  const handleRetry = () => {
    eventBus.emit('restartGame')
    setTimeout(() => {
      eventBus.emit('startGame')
    }, 100)
  }

  return (
    <div className="gameover-overlay">
      <div className="gameover-container">
        <div className="gameover-title">游戏结束</div>
        <div className="gameover-score-label">最终得分</div>
        <div className="gameover-score">{score.toLocaleString()}</div>
        <div className="gameover-stats">
          <div className="stat-item">
            <span className="stat-label">达到等级</span>
            <span className="stat-value">Lv.{difficulty}</span>
          </div>
        </div>
        <div className="gameover-buttons">
          <button className="btn btn-primary" onClick={handleRetry}>
            再玩一次
          </button>
          <button className="btn btn-secondary" onClick={handleRestart}>
            重新选择音乐
          </button>
        </div>
      </div>

      <style>{`
        .gameover-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(13, 17, 23, 0.9);
          backdrop-filter: blur(5px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 200;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .gameover-container {
          background: #161B22;
          border: 1px solid #30363D;
          border-radius: 16px;
          padding: 48px 64px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          min-width: 320px;
        }

        .gameover-title {
          font-size: 36px;
          font-weight: bold;
          color: #FF4444;
          margin-bottom: 8px;
        }

        .gameover-score-label {
          font-size: 14px;
          color: #8B949E;
        }

        .gameover-score {
          font-size: 56px;
          font-weight: bold;
          color: #FFFFFF;
          text-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
        }

        .gameover-stats {
          display: flex;
          gap: 32px;
          margin: 16px 0;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .stat-label {
          font-size: 12px;
          color: #8B949E;
        }

        .stat-value {
          font-size: 24px;
          font-weight: bold;
          color: #FFD700;
        }

        .gameover-buttons {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 16px;
          width: 100%;
        }

        .btn {
          padding: 14px 32px;
          font-size: 16px;
          font-weight: bold;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-primary {
          background: #58A6FF;
          color: #FFFFFF;
        }

        .btn-primary:hover {
          background: #79B8FF;
          transform: translateY(-2px);
        }

        .btn-secondary {
          background: transparent;
          color: #C9D1D9;
          border: 1px solid #30363D;
        }

        .btn-secondary:hover {
          background: rgba(88, 166, 255, 0.1);
          border-color: #58A6FF;
        }

        @media (max-width: 768px) {
          .gameover-container {
            padding: 32px 32px;
            min-width: 280px;
          }

          .gameover-title {
            font-size: 28px;
          }

          .gameover-score {
            font-size: 42px;
          }
        }
      `}</style>
    </div>
  )
}
