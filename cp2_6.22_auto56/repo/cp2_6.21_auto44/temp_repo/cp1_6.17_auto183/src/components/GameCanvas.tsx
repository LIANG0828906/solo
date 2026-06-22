import { useRef, useEffect, useState } from 'react'
import { useGameStore } from '../state'
import { eventBus } from '../EventBus'

export default function GameCanvas() {
  const canvasRef = useRef<HTMLDivElement>(null)
  const playerPos = useGameStore((state) => state.playerPos)
  const notes = useGameStore((state) => state.notes)
  const obstacles = useGameStore((state) => state.obstacles)
  const particles = useGameStore((state) => state.particles)
  const scorePopups = useGameStore((state) => state.scorePopups)
  const isHit = useGameStore((state) => state.isHit)
  const screenShake = useGameStore((state) => state.screenShake)
  const gameState = useGameStore((state) => state.gameState)

  const [canvasWidth, setCanvasWidth] = useState(360)
  const [canvasHeight, setCanvasHeight] = useState(600)
  const [laneWidth, setLaneWidth] = useState(120)

  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768
      if (isMobile) {
        const width = window.innerWidth * 0.8
        const height = Math.min(window.innerHeight - 100, width * 1.67)
        setCanvasWidth(width)
        setCanvasHeight(height)
        setLaneWidth(width / 3)
      } else {
        setCanvasWidth(360)
        setCanvasHeight(600)
        setLaneWidth(120)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const shakeX = screenShake > 0 ? (Math.random() - 0.5) * screenShake : 0
  const shakeY = screenShake > 0 ? (Math.random() - 0.5) * screenShake : 0

  const playerX = playerPos * laneWidth + laneWidth / 2
  const playerY = 500

  const renderParticles = () => {
    return particles.map((p) => (
      <div
        key={p.id}
        className="particle"
        style={{
          left: p.x,
          top: p.y,
          width: p.size,
          height: p.size,
          backgroundColor: p.color,
          opacity: p.life / p.maxLife,
        }}
      />
    ))
  }

  const renderScorePopups = () => {
    return scorePopups.map((popup) => (
      <div
        key={popup.id}
        className="score-popup"
        style={{
          left: popup.x,
          top: popup.y,
          opacity: popup.life / popup.maxLife,
        }}
      >
        +{popup.value}
      </div>
    ))
  }

  const renderNotes = () => {
    return notes.map((note) => {
      if (note.collected) return null
      const noteX = note.lane * laneWidth + laneWidth / 2
      return (
        <div
          key={note.id}
          className={`note ${note.isStrongBeat ? 'strong' : 'weak'}`}
          style={{
            left: noteX - 15,
            top: note.y - 15,
          }}
        />
      )
    })
  }

  const renderObstacles = () => {
    return obstacles.map((obstacle) => {
      const obstacleX = obstacle.lane * laneWidth
      const showWarning = obstacle.y < -30
      const warningProgress = Math.min(1, Math.max(0, (-obstacle.y - 30) / 100))

      return (
        <div key={obstacle.id}>
          {showWarning && (
            <div
              className="obstacle-warning"
              style={{
                left: obstacleX + laneWidth / 2,
                top: 20,
                transform: `translate(-50%, 0) scale(${1 - warningProgress})`,
                opacity: warningProgress * 0.8,
              }}
            />
          )}
          {!showWarning && (
            <div
              className="obstacle"
              style={{
                left: obstacleX + 5,
                top: obstacle.y - 30,
                width: laneWidth - 10,
              }}
            />
          )}
        </div>
      )
    })
  }

  const renderParticleLines = () => {
    const lines = []
    for (let i = 0; i < 20; i++) {
      const left = (i / 20) * canvasWidth
      const delay = i * 0.1
      lines.push(
        <div
          key={i}
          className="particle-line"
          style={{
            left,
            animationDelay: `${delay}s`,
          }}
        />
      )
    }
    return lines
  }

  const renderLanes = () => {
    const lanes = []
    for (let i = 0; i < 2; i++) {
      const x = (i + 1) * laneWidth
      lanes.push(
        <div
          key={i}
          className="lane-divider"
          style={{
            left: x,
            height: canvasHeight,
          }}
        />
      )
    }
    return lanes
  }

  return (
    <div
      ref={canvasRef}
      className="game-canvas"
      style={{
        width: canvasWidth,
        height: canvasHeight,
        transform: `translate(${shakeX}px, ${shakeY}px)`,
      }}
    >
      <div className="particle-lines">{renderParticleLines()}</div>

      <div className="lanes">
        {renderLanes()}
      </div>

      {renderNotes()}
      {renderObstacles()}
      {renderParticles()}
      {renderScorePopups()}

      <div
        className={`player ${isHit ? 'hit' : ''}`}
        style={{
          left: playerX - 20,
          top: playerY - 20,
        }}
      />

      {gameState === 'ready' && (
        <div className="ready-overlay">
          <div className="ready-text">点击开始</div>
          <button
            className="start-button"
            onClick={() => eventBus.emit('startGame')}
          >
            开始游戏
          </button>
        </div>
      )}

      <style>{`
        .game-canvas {
          position: relative;
          background: linear-gradient(180deg, #0D1117 0%, #161B22 50%, #0D1117 100%);
          border: 1px solid #30363D;
          border-radius: 8px;
          overflow: hidden;
          margin-top: 80px;
        }

        .particle-lines {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          overflow: hidden;
          pointer-events: none;
        }

        .particle-line {
          position: absolute;
          width: 1px;
          height: 40px;
          background: #1F2937;
          animation: scroll-line 2s linear infinite;
          opacity: 0.6;
        }

        @keyframes scroll-line {
          0% {
            transform: translateY(-40px);
          }
          100% {
            transform: translateY(600px);
          }
        }

        .lanes {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
        }

        .lane-divider {
          position: absolute;
          top: 0;
          width: 1px;
          background: #30363D;
          opacity: 0.5;
        }

        .player {
          position: absolute;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #58A6FF;
          box-shadow: 0 0 8px rgba(88, 166, 255, 0.6), 0 0 16px rgba(88, 166, 255, 0.4);
          transition: left 0.1s ease-out;
          z-index: 10;
        }

        .player.hit {
          background: #FF4444;
          animation: hit-flash 0.15s ease-in-out infinite;
        }

        .note {
          position: absolute;
          width: 30px;
          height: 30px;
          transform: rotate(45deg);
          z-index: 5;
        }

        .note.strong {
          background: #FFD700;
          box-shadow: 0 0 10px rgba(255, 215, 0, 0.8);
        }

        .note.weak {
          background: #FF7F50;
          box-shadow: 0 0 8px rgba(255, 127, 80, 0.6);
        }

        .obstacle-warning {
          position: absolute;
          width: 160px;
          height: 160px;
          border-radius: 50%;
          border: 3px solid #FF4444;
          pointer-events: none;
          z-index: 3;
        }

        .obstacle {
          position: absolute;
          height: 60px;
          background: #FF4444;
          border-radius: 4px;
          animation: obstacle-pulse 0.5s ease-in-out infinite;
          z-index: 4;
        }

        .particle {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          z-index: 6;
        }

        .score-popup {
          position: absolute;
          font-size: 24px;
          font-weight: bold;
          color: #FFFFFF;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.8);
          pointer-events: none;
          transform: translateX(-50%);
          z-index: 20;
          animation: float-up 1s ease-out forwards;
        }

        .ready-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(13, 17, 23, 0.85);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 24px;
          z-index: 50;
        }

        .ready-text {
          font-size: 32px;
          color: #C9D1D9;
          font-weight: bold;
        }

        .start-button {
          padding: 12px 36px;
          font-size: 18px;
          font-weight: bold;
          color: #FFFFFF;
          background: #58A6FF;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .start-button:hover {
          background: #79B8FF;
          transform: scale(1.05);
        }

        .start-button:active {
          transform: scale(0.98);
        }

        @media (max-width: 768px) {
          .game-canvas {
            margin-top: 70px;
          }
        }
      `}</style>
    </div>
  )
}
