import { useGameStore } from '../store/gameStore';

export function ScorePanel() {
  const players = useGameStore((state) => state.players);
  const currentPlayer = useGameStore((state) => state.currentPlayer);
  const balls = useGameStore((state) => state.balls);
  const winner = useGameStore((state) => state.winner);
  const gamePhase = useGameStore((state) => state.gamePhase);

  const remainingBalls = balls.filter((b) => !b.pocketed && b.number !== 0).length;

  return (
    <div
      style={{
        height: 60,
        background: 'rgba(27, 27, 47, 0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 30px',
        borderBottom: '2px solid #00FFCC',
        boxShadow: '0 2px 20px rgba(0, 255, 204, 0.3)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <div
          style={{
            fontSize: 24,
            fontWeight: 'bold',
            color: '#00FFCC',
            textShadow: '0 0 10px #00FFFF, 0 0 20px #00FFFF',
            fontFamily: 'monospace',
          }}
        >
          台球对战
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
        {players.map((player, idx) => (
          <div
            key={player.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '4px 20px',
              borderRadius: 8,
              background: currentPlayer === idx ? 'rgba(0, 255, 204, 0.1)' : 'transparent',
              border: currentPlayer === idx ? '2px solid #00FFCC' : '2px solid transparent',
              transition: 'all 0.3s ease',
            }}
          >
            <span
              style={{
                fontSize: 16,
                color: currentPlayer === idx ? '#00FFCC' : '#888',
                textShadow: currentPlayer === idx ? '0 0 8px #00FFFF' : 'none',
                fontFamily: 'monospace',
              }}
            >
              {player.name}
            </span>
            <span
              style={{
                fontSize: 24,
                fontWeight: 'bold',
                color: '#00FFCC',
                textShadow: '0 0 10px #00FFFF, 0 0 20px #00FFFF',
                fontFamily: 'monospace',
              }}
            >
              {player.score}
            </span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <div
          style={{
            fontSize: 18,
            color: '#FFD700',
            textShadow: '0 0 8px #FFD700',
            fontFamily: 'monospace',
          }}
        >
          剩余球: {remainingBalls}
        </div>
        {gamePhase === 'gameOver' && winner !== null && (
          <div
            style={{
              fontSize: 20,
              fontWeight: 'bold',
              color: '#FFD700',
              textShadow: '0 0 15px #FFD700, 0 0 30px #FFD700',
              fontFamily: 'monospace',
              animation: 'pulse 1s infinite',
            }}
          >
            {players[winner].name} 获胜!
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
