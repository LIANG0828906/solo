import { useGameStore } from '../store/gameStore';

export function ScorePanel() {
  const { players, currentPlayer, balls, gamePhase, winner, resetGame } =
    useGameStore();

  const remainingBalls = balls.filter((b) => !b.pocketed && b.number !== 0).length;
  const lowRemaining = balls.filter(
    (b) => !b.pocketed && b.number >= 1 && b.number <= 7
  ).length;
  const highRemaining = balls.filter(
    (b) => !b.pocketed && b.number >= 9 && b.number <= 15
  ).length;

  return (
    <>
      <div
        className="fixed top-0 left-0 right-0 z-10 flex items-center justify-between px-6"
        style={{
          height: '60px',
          backgroundColor: 'rgba(27, 27, 47, 0.9)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <div className="flex items-center">
          <span
            style={{
              fontSize: '24px',
              color: '#00FFCC',
              textShadow: '0 0 10px #00FFFF, 0 0 20px #00FFFF',
              fontFamily: 'monospace',
              fontWeight: 'bold',
              letterSpacing: '2px',
            }}
          >
            ◆ 台球模拟器
          </span>
        </div>

        <div className="flex items-center gap-6">
          {players.map((player, idx) => (
            <div
              key={player.id}
              className="flex items-center gap-3 px-4 py-1 rounded-lg transition-all duration-300"
              style={{
                border: currentPlayer === idx ? '2px solid #00FFCC' : '2px solid transparent',
                boxShadow: currentPlayer === idx ? '0 0 15px rgba(0, 255, 204, 0.5)' : 'none',
                backgroundColor: currentPlayer === idx ? 'rgba(0, 255, 204, 0.1)' : 'transparent',
              }}
            >
              <span
                style={{
                  fontSize: '20px',
                  color: currentPlayer === idx ? '#00FFCC' : '#888',
                  textShadow: currentPlayer === idx
                    ? '0 0 10px #00FFFF, 0 0 20px #00FFFF'
                    : 'none',
                  fontFamily: 'monospace',
                  fontWeight: 'bold',
                }}
              >
                {player.name}
              </span>
              <span
                style={{
                  fontSize: '24px',
                  color: '#FFD700',
                  textShadow: '0 0 8px #FFD700',
                  fontFamily: 'monospace',
                  fontWeight: 'bold',
                  minWidth: '50px',
                  textAlign: 'right',
                }}
              >
                {player.score}
              </span>
              {player.group && (
                <span
                  className="text-xs px-2 py-0.5 rounded"
                  style={{
                    backgroundColor:
                      player.group === 'low' ? 'rgba(255,215,0,0.2)' : 'rgba(255,69,0,0.2)',
                    color: player.group === 'low' ? '#FFD700' : '#FF6347',
                    fontFamily: 'monospace',
                  }}
                >
                  {player.group === 'low' ? '低分' : '高分'}
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span style={{ color: '#888', fontSize: '14px', fontFamily: 'monospace' }}>
              剩余:
            </span>
            <span
              style={{
                fontSize: '20px',
                color: '#00FFCC',
                textShadow: '0 0 8px #00FFFF',
                fontFamily: 'monospace',
                fontWeight: 'bold',
              }}
            >
              {remainingBalls}
            </span>
            <span style={{ color: '#666', fontSize: '12px', fontFamily: 'monospace' }}>
              (低:{lowRemaining} 高:{highRemaining})
            </span>
          </div>

          {gamePhase === 'gameOver' && (
            <button
              onClick={resetGame}
              className="px-4 py-2 rounded-lg font-bold transition-all hover:scale-105"
              style={{
                backgroundColor: '#00FFCC',
                color: '#1B1B2F',
                boxShadow: '0 0 15px rgba(0, 255, 204, 0.5)',
                fontFamily: 'monospace',
              }}
            >
              重新开始
            </button>
          )}
        </div>
      </div>

      {gamePhase === 'gameOver' && winner !== null && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
        >
          <div
            className="text-center p-10 rounded-xl"
            style={{
              backgroundColor: '#1B1B2F',
              border: '2px solid #00FFCC',
              boxShadow: '0 0 40px rgba(0, 255, 204, 0.6)',
            }}
          >
            <h2
              style={{
                fontSize: '48px',
                color: '#FFD700',
                textShadow: '0 0 20px #FFD700, 0 0 40px #FFD700',
                fontFamily: 'monospace',
                fontWeight: 'bold',
                marginBottom: '20px',
              }}
            >
              🎉 {players[winner].name} 获胜！
            </h2>
            <p style={{ color: '#888', marginBottom: '30px', fontFamily: 'monospace' }}>
              最终得分: {players[winner].score} 分
            </p>
            <button
              onClick={resetGame}
              className="px-8 py-3 rounded-lg text-xl font-bold transition-all hover:scale-105"
              style={{
                backgroundColor: '#00FFCC',
                color: '#1B1B2F',
                boxShadow: '0 0 20px rgba(0, 255, 204, 0.5)',
                fontFamily: 'monospace',
              }}
            >
              再来一局
            </button>
          </div>
        </div>
      )}
    </>
  );
}
