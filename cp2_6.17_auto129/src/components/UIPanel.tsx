import { useCallback } from 'react';
import { useGameStore } from '../store/gameStore';

interface UIPanelProps {
  engineRef: React.MutableRefObject<any>;
}

export const UIPanel = ({ engineRef }: UIPanelProps) => {
  const {
    score,
    lives,
    gameStatus,
    gameOverOpacity,
  } = useGameStore();

  const handlePause = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.togglePause();
    }
  }, [engineRef]);

  const handleRestart = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.reset();
    }
  }, [engineRef]);

  const handleStart = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.start();
    }
  }, [engineRef]);

  const renderHearts = () => {
    const hearts = [];
    for (let i = 0; i < 3; i++) {
      const isActive = i < lives;
      hearts.push(
        <svg
          key={i}
          width="16"
          height="16"
          viewBox="0 0 16 16"
          style={{
            marginRight: i < 2 ? '8px' : '0',
            opacity: isActive ? 1 : 0.3,
            filter: isActive ? 'drop-shadow(0 0 4px rgba(255, 68, 68, 0.8))' : 'none',
          }}
        >
          <path
            d="M8 14s-6.5-4.5-6.5-8.5C1.5 2.5 3.5 0.5 5.5 0.5 6.5 0.5 7.5 1 8 2 8.5 1 9.5 0.5 10.5 0.5 12.5 0.5 14.5 2.5 14.5 5.5 14.5 9.5 8 14 8 14Z"
            fill={isActive ? '#FF4444' : '#333333'}
            stroke={isActive ? '#FF6666' : '#444444'}
            strokeWidth="0.5"
          />
        </svg>
      );
    }
    return hearts;
  };

  return (
    <>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          maxWidth: '800px',
          height: '50px',
          background: 'rgba(0, 0, 0, 0.6)',
          borderRadius: '0 0 12px 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          boxSizing: 'border-box',
          zIndex: 10,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {renderHearts()}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
          }}
        >
          <div
            style={{
              fontSize: '24px',
              color: '#FFFFFF',
              fontWeight: 'bold',
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8), 0 0 6px rgba(0, 229, 255, 0.5)',
            }}
          >
            {score}
          </div>

          <button
            onClick={handlePause}
            disabled={gameStatus === 'idle' || gameStatus === 'gameOver'}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'transparent',
              border: '2px solid #00E5FF',
              color: '#00E5FF',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 6px rgba(0, 229, 255, 0.5)',
              transition: 'all 0.2s ease',
              opacity: gameStatus === 'idle' || gameStatus === 'gameOver' ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (gameStatus !== 'idle' && gameStatus !== 'gameOver') {
                e.currentTarget.style.background = 'rgba(0, 229, 255, 0.2)';
                e.currentTarget.style.boxShadow = '0 0 12px rgba(0, 229, 255, 0.8)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.boxShadow = '0 0 6px rgba(0, 229, 255, 0.5)';
            }}
          >
            ||
          </button>
        </div>
      </div>

      {gameStatus === 'idle' && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(10, 10, 26, 0.95)',
            zIndex: 100,
          }}
        >
          <h1
            style={{
              fontSize: '64px',
              color: '#00E5FF',
              fontWeight: 'bold',
              marginBottom: '10px',
              textShadow: '0 0 20px rgba(0, 229, 255, 0.8), 0 0 40px rgba(0, 229, 255, 0.4)',
              letterSpacing: '4px',
            }}
          >
            RippleRush
          </h1>
          <p
            style={{
              fontSize: '18px',
              color: '#888888',
              marginBottom: '40px',
              textShadow: '0 0 6px rgba(0, 229, 255, 0.3)',
            }}
          >
            在蜿蜒的河道中冲刺，躲避障碍，收集金币！
          </p>
          <button
            onClick={handleStart}
            style={{
              width: '180px',
              height: '50px',
              borderRadius: '8px',
              background: '#00E5FF',
              color: '#000000',
              fontSize: '20px',
              fontWeight: 'bold',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 0 15px rgba(0, 229, 255, 0.6)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.filter = 'brightness(1.2)';
              e.currentTarget.style.boxShadow = '0 0 25px rgba(0, 229, 255, 0.9)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = 'brightness(1)';
              e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 229, 255, 0.6)';
            }}
          >
            开始游戏
          </button>
          <div
            style={{
              marginTop: '40px',
              fontSize: '14px',
              color: '#666666',
              textAlign: 'center',
            }}
          >
            <p style={{ margin: '5px 0' }}>← → 或 A D 键控制左右移动</p>
            <p style={{ margin: '5px 0' }}>鼠标拖拽也可以控制</p>
            <p style={{ margin: '5px 0' }}>P 或 ESC 键暂停游戏</p>
          </div>
        </div>
      )}

      {gameStatus === 'gameOver' && gameOverOpacity > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: gameOverOpacity,
            zIndex: 100,
            pointerEvents: gameOverOpacity >= 1 ? 'auto' : 'none',
          }}
        >
          <h1
            style={{
              fontSize: '48px',
              color: '#FF4444',
              fontWeight: 'bold',
              marginBottom: '20px',
              textShadow: '0 0 20px rgba(255, 68, 68, 0.8)',
            }}
          >
            游戏结束
          </h1>
          <p
            style={{
              fontSize: '24px',
              color: '#FFFFFF',
              marginBottom: '30px',
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8), 0 0 6px rgba(0, 229, 255, 0.5)',
            }}
          >
            得分: {score}
          </p>
          <button
            onClick={handleRestart}
            style={{
              width: '120px',
              height: '40px',
              borderRadius: '8px',
              background: '#00E5FF',
              color: '#000000',
              fontSize: '16px',
              fontWeight: 'bold',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 0 10px rgba(0, 229, 255, 0.6)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.filter = 'brightness(1.2)';
              e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 229, 255, 0.9)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = 'brightness(1)';
              e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 229, 255, 0.6)';
            }}
          >
            再来一次
          </button>
        </div>
      )}
    </>
  );
};
