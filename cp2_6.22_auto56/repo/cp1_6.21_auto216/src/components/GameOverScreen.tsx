interface GameOverScreenProps {
  score: number;
  onRestart: () => void;
}

export default function GameOverScreen({ score, onRestart }: GameOverScreenProps) {
  return (
    <div className="screen-container">
      <h1
        style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: '36px',
          color: '#EF4444',
          textShadow: '0 0 20px #EF4444, 0 0 40px #EF4444',
        }}
      >
        GAME OVER
      </h1>
      <div
        style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: '16px',
          color: '#E2E8F0',
        }}
      >
        SCORE: {score.toString().padStart(8, '0')}
      </div>
      <button className="game-button" onClick={onRestart}>
        RESTART
      </button>
    </div>
  );
}
