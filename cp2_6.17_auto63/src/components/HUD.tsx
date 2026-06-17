import { useGameStore } from '../stores/gameStore';

export const HUD = () => {
  const { players, twoPlayerMode, status, totalDots, remainingDots } =
    useGameStore();

  const player1 = players.find((p) => p.id === 'player1');
  const player2 = players.find((p) => p.id === 'player2');

  const totalScore = players.reduce((sum, p) => sum + p.score, 0);
  const progress = totalDots > 0 ? ((totalDots - remainingDots) / totalDots) * 100 : 0;

  const renderHearts = (lives: number) => {
    return Array.from({ length: 3 }, (_, i) => (
      <span
        key={i}
        style={{
          color: i < lives ? '#E94560' : '#333',
          fontSize: '16px',
          marginRight: '4px',
        }}
      >
        ♥
      </span>
    ));
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '60px',
        backgroundColor: '#0F3460',
        borderBottom: '2px solid #16213E',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        fontFamily: "'Press Start 2P', monospace",
        color: '#fff',
        zIndex: 10,
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {player1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ fontSize: '10px', color: '#FFE66D' }}>
              P1: {player1.score.toLocaleString()}
            </div>
            <div style={{ display: 'flex' }}>{renderHearts(player1.lives)}</div>
          </div>
        )}

        {player2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ fontSize: '10px', color: '#4ECDC4' }}>
              P2: {player2.score.toLocaleString()}
            </div>
            <div style={{ display: 'flex' }}>{renderHearts(player2.lives)}</div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <div style={{ fontSize: '10px' }}>SCORE</div>
        <div style={{ fontSize: '14px', color: '#00FF00' }}>
          {totalScore.toLocaleString()}
        </div>
      </div>

      {twoPlayerMode && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            width: '150px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <div style={{ fontSize: '8px', color: '#9B59B6', width: '30px' }}>
              P1
            </div>
            <div
              style={{
                flex: 1,
                height: '8px',
                backgroundColor: '#16213E',
                borderRadius: '2px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(100, (player1?.score || 0) / 10)}%`,
                  backgroundColor: '#9B59B6',
                  transition: 'width 0.3s',
                }}
              />
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <div style={{ fontSize: '8px', color: '#00FFFF', width: '30px' }}>
              P2
            </div>
            <div
              style={{
                flex: 1,
                height: '8px',
                backgroundColor: '#16213E',
                borderRadius: '2px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(100, (player2?.score || 0) / 10)}%`,
                  backgroundColor: '#00FFFF',
                  transition: 'width 0.3s',
                }}
              />
            </div>
          </div>
        </div>
      )}

      {!twoPlayerMode && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '4px',
          }}
        >
          <div style={{ fontSize: '8px', color: '#888' }}>PROGRESS</div>
          <div
            style={{
              width: '120px',
              height: '8px',
              backgroundColor: '#16213E',
              borderRadius: '2px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progress}%`,
                backgroundColor: '#00FF00',
                transition: 'width 0.3s',
              }}
            />
          </div>
        </div>
      )}

      {status !== 'menu' && (
        <div
          style={{
            position: 'absolute',
            top: '70px',
            right: '20px',
            fontSize: '8px',
            color: '#888',
            fontFamily: "'Press Start 2P', monospace",
          }}
        >
          {player1?.isPowered && (
            <div style={{ color: '#FFD700' }}>⚡ P1 POWERED!</div>
          )}
          {player2?.isPowered && (
            <div style={{ color: '#00FFFF', marginTop: '4px' }}>
              ⚡ P2 POWERED!
            </div>
          )}
        </div>
      )}
    </div>
  );
};
