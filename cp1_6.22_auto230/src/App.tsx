import React, { useEffect, useMemo, useRef, useState } from 'react'
import { GameEngine, GameState, Player } from './GameEngine'
import { CardGenerator, COLORS } from './CardGenerator'
import { FeedbackModule } from './FeedbackModule'
import type { Card } from './CardGenerator'
import './index.css'

const PolygonPattern: React.FC<{ patternIndex: number; color: string }> = ({ patternIndex, color }) => {
  const patterns: React.ReactNode[] = useMemo(() => [
    <polygon key="tri" points="50,10 90,85 10,85" fill={color} stroke="white" strokeWidth="3" />,
    <polygon key="pent" points="50,8 95,38 77,88 23,88 5,38" fill={color} stroke="white" strokeWidth="3" />,
    <polygon key="hex" points="50,5 93,27.5 93,72.5 50,95 7,72.5 7,27.5" fill={color} stroke="white" strokeWidth="3" />,
    <polygon key="star" points="50,5 61,38 97,38 68,58 79,92 50,72 21,92 32,58 3,38 39,38" fill={color} stroke="white" strokeWidth="2.5" />,
    <polygon key="diamond" points="50,5 95,50 50,95 5,50" fill={color} stroke="white" strokeWidth="3" />,
    <polygon key="octa" points="30,5 70,5 95,30 95,70 70,95 30,95 5,70 5,30" fill={color} stroke="white" strokeWidth="3" />,
    <g key="cross">
      <polygon points="35,5 65,5 65,35 95,35 95,65 65,65 65,95 35,95 35,65 5,65 5,35 35,35" fill={color} stroke="white" strokeWidth="2.5" />
    </g>,
    <polygon key="arrow" points="50,5 85,45 68,45 68,95 32,95 32,45 15,45" fill={color} stroke="white" strokeWidth="3" />,
  ], [color])

  return (
    <svg className="polygon-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      {patterns[patternIndex % patterns.length]}
    </svg>
  )
}

const CardComponent: React.FC<{
  card: Card
  onClick: () => void
  disabled: boolean
}> = ({ card, onClick, disabled }) => {
  const handleClick = () => {
    if (!disabled && !card.isFlipped && !card.isMatched) {
      onClick()
    }
  }

  return (
    <div
      className="card-wrapper"
      onClick={handleClick}
      style={{ cursor: disabled || card.isFlipped || card.isMatched ? 'default' : 'pointer' }}
    >
      <div className={`card-inner ${card.isFlipped || card.isMatched ? 'is-flipped' : ''}`}>
        <div className="card-face card-back">
          <span className="card-back-question">?</span>
        </div>
        <div
          className={`card-face card-front ${card.isMatched ? 'is-matched' : ''}`}
          style={{ background: COLORS[card.colorIndex] }}
        >
          <PolygonPattern patternIndex={card.patternIndex} color="white" />
        </div>
      </div>
    </div>
  )
}

const PlayerCard: React.FC<{
  player: Player
  isActive: boolean
  isWinner: boolean
}> = ({ player, isActive, isWinner }) => {
  return (
    <div
      className={`player-card ${isActive ? 'active-turn' : ''} ${isWinner ? 'is-winner' : ''}`}
    >
      <div className={`avatar avatar-${player.id}`}>P{player.id}</div>
      <div className="player-name">{player.name}</div>
      <div className="player-score">{player.score}</div>
    </div>
  )
}

const App: React.FC = () => {
  const engineRef = useRef<GameEngine | null>(null)
  const [gameState, setGameState] = useState<GameState | null>(null)

  useEffect(() => {
    const cardGenerator = new CardGenerator()
    const feedbackModule = new FeedbackModule()
    const engine = new GameEngine(cardGenerator, feedbackModule)

    engineRef.current = engine

    const unsubscribe = engine.onStateChange((state) => {
      setGameState(state)
    })

    setGameState(engine.getState())

    return () => {
      unsubscribe()
      engine.destroy()
    }
  }, [])

  const handleStartGame = () => {
    engineRef.current?.startGame()
  }

  const handleFlipCard = (cardId: string) => {
    engineRef.current?.flipCard(cardId)
  }

  const handleRestart = () => {
    engineRef.current?.resetGame()
  }

  if (!gameState) {
    return null
  }

  const isIdle = gameState.phase === 'idle'
  const isCountdown = gameState.phase === 'countdown'
  const isGameOver = gameState.phase === 'gameover'
  const shouldShowOverlay = isIdle || isCountdown || isGameOver

  const winnerPlayer = gameState.winner

  return (
    <div className="app-container">
      <div className="game-wrapper">
        <div className="game-board">
          <div className="card-grid">
            {gameState.cards.map((card: Card) => (
              <CardComponent
                key={card.id}
                card={card}
                onClick={() => handleFlipCard(card.id)}
                disabled={gameState.phase !== 'playing' || gameState.isProcessing}
              />
            ))}
          </div>

          {shouldShowOverlay && (
            <div className="overlay">
              <div className="overlay-content">
                {isIdle && (
                  <>
                    <div className="start-screen-title">触觉记忆对战</div>
                    <div className="start-screen-subtitle">双人翻牌配对游戏</div>
                    <button className="restart-button" onClick={handleStartGame}>
                      开始游戏
                    </button>
                  </>
                )}

                {isCountdown && (
                  <div className="countdown-number" key={gameState.countdownValue}>
                    {gameState.countdownValue}
                  </div>
                )}

                {isGameOver && (
                  <>
                    <div className="game-over-text">游戏结束！</div>
                    {winnerPlayer ? (
                      <div className="winner-text">🎉 {winnerPlayer.name} 获胜！</div>
                    ) : (
                      <div className="tie-text">平局！</div>
                    )}
                    <button className="restart-button" onClick={handleRestart}>
                      再来一局
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="player-panel">
          {gameState.players.map((player: Player, index: number) => (
            <PlayerCard
              key={player.id}
              player={player}
              isActive={gameState.phase === 'playing' && gameState.currentPlayerIndex === index}
              isWinner={isGameOver && winnerPlayer?.id === player.id}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default App
