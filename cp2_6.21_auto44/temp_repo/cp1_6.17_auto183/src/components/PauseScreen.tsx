import { eventBus } from '../EventBus'

export default function PauseScreen() {
  const handleResume = () => {
    eventBus.emit('resumeGame')
  }

  const handleRestart = () => {
    eventBus.emit('restartGame')
  }

  return (
    <div className="pause-overlay">
      <div className="pause-container">
        <div className="pause-title">游戏暂停</div>
        <div className="pause-buttons">
          <button className="btn btn-primary" onClick={handleResume}>
            继续游戏
          </button>
          <button className="btn btn-secondary" onClick={handleRestart}>
            重新开始
          </button>
        </div>
      </div>

      <style>{`
        .pause-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(13, 17, 23, 0.85);
          backdrop-filter: blur(5px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 200;
        }

        .pause-container {
          background: #161B22;
          border: 1px solid #30363D;
          border-radius: 16px;
          padding: 40px 56px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 24px;
          min-width: 280px;
        }

        .pause-title {
          font-size: 32px;
          font-weight: bold;
          color: #C9D1D9;
        }

        .pause-buttons {
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 100%;
        }

        .btn {
          padding: 12px 28px;
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
          .pause-container {
            padding: 32px 32px;
            min-width: 240px;
          }

          .pause-title {
            font-size: 24px;
          }
        }
      `}</style>
    </div>
  )
}
