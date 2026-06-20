import { useGameStore } from '../state'

export default function LevelUpEffect() {
  const showLevelUp = useGameStore((state) => state.showLevelUp)
  const levelUpTime = useGameStore((state) => state.levelUpTime)
  const difficulty = useGameStore((state) => state.difficulty)

  if (!showLevelUp) return null

  const getScale = () => {
    const t = levelUpTime / 0.5
    if (t < 0.5) {
      return 0.5 + t * 1.4
    } else {
      return 1.2 - (t - 0.5) * 0.4
    }
  }

  return (
    <div className="level-up-container">
      <div
        className="level-up-text"
        style={{
          transform: `scale(${getScale()})`,
          opacity: levelUpTime < 0.1 ? levelUpTime / 0.1 : 1 - (levelUpTime - 0.3) / 0.2,
        }}
      >
        Level {difficulty}
      </div>

      <style>{`
        .level-up-container {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          z-index: 150;
        }

        .level-up-text {
          font-size: 40px;
          font-weight: bold;
          color: #58A6FF;
          text-shadow: 0 0 20px rgba(88, 166, 255, 0.8), 0 4px 12px rgba(0, 0, 0, 0.5);
          letter-spacing: 4px;
        }

        @media (max-width: 768px) {
          .level-up-text {
            font-size: 32px;
          }
        }
      `}</style>
    </div>
  )
}
