import { useGameStore } from '../state'

export default function StatusBar() {
  const score = useGameStore((state) => state.score)
  const bpm = useGameStore((state) => state.bpm)
  const difficulty = useGameStore((state) => state.difficulty)
  const beatPulse = useGameStore((state) => state.beatPulse)

  return (
    <div className="status-bar">
      <div className="status-left">
        <div className="score-label">得分</div>
        <div className="score-value">{score.toLocaleString()}</div>
      </div>
      <div className="status-right">
        <div className="bpm-container">
          <span className="bpm-text">{bpm}</span>
          <span className="bpm-unit">BPM</span>
          <div
            className="bpm-dot"
            style={{
              transform: `scale(${0.8 + beatPulse * 0.4})`,
              opacity: 0.5 + beatPulse * 0.5,
            }}
          />
        </div>
        <div className="difficulty-container">
          <span className="level-label">LV</span>
          <span className="level-value">{difficulty}</span>
        </div>
      </div>

      <style>{`
        .status-bar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 64px;
          background: rgba(13, 17, 23, 0.8);
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          z-index: 100;
          border-bottom: 1px solid #30363D;
        }

        .status-left {
          display: flex;
          flex-direction: column;
        }

        .score-label {
          font-size: 12px;
          color: #8B949E;
        }

        .score-value {
          font-size: 36px;
          font-weight: bold;
          color: #FFFFFF;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
          line-height: 1;
        }

        .status-right {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .bpm-container {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .bpm-text {
          font-size: 18px;
          font-weight: bold;
          color: #58A6FF;
        }

        .bpm-unit {
          font-size: 12px;
          color: #8B949E;
        }

        .bpm-dot {
          width: 8px;
          height: 8px;
          background: #58A6FF;
          border-radius: 50%;
          margin-left: 4px;
          transition: transform 0.1s ease, opacity 0.1s ease;
        }

        .difficulty-container {
          display: flex;
          align-items: baseline;
          gap: 4px;
          padding: 4px 12px;
          background: rgba(88, 166, 255, 0.2);
          border-radius: 12px;
          border: 1px solid rgba(88, 166, 255, 0.4);
        }

        .level-label {
          font-size: 10px;
          color: #8B949E;
        }

        .level-value {
          font-size: 18px;
          font-weight: bold;
          color: #FFD700;
        }

        @media (max-width: 768px) {
          .status-bar {
            height: 56px;
            padding: 0 16px;
          }

          .score-value {
            font-size: 24px;
          }

          .bpm-text {
            font-size: 14px;
          }

          .level-value {
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  )
}
