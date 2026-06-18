import { useEffect, useState } from 'react';
import GameCanvas from './components/GameCanvas';
import HUD from './components/HUD';
import { useGameStore } from './store';

function App() {
  const {
    isGameOver,
    isPlaying,
    score,
    oreCounts,
    startGame,
    resetGame,
  } = useGameStore();

  const [showStartScreen, setShowStartScreen] = useState(true);
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        useGameStore.getState().setKey(e.key as 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight', true);
      }
      if (e.key === ' ' && !isPlaying && !isGameOver) {
        handleStart();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        useGameStore.getState().setKey(e.key as 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight', false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPlaying, isGameOver]);

  useEffect(() => {
    if (isGameOver) {
      setFadeIn(true);
    }
  }, [isGameOver]);

  const handleStart = () => {
    setShowStartScreen(false);
    setFadeIn(false);
    startGame();
  };

  const handleRestart = () => {
    setFadeIn(false);
    setTimeout(() => {
      resetGame();
      startGame();
    }, 300);
  };

  const totalOres = oreCounts.red + oreCounts.yellow + oreCounts.green + oreCounts.blue;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        background: '#0A0A2E',
      }}
    >
      <GameCanvas />
      <HUD />

      {showStartScreen && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(5px)',
            zIndex: 100,
          }}
        >
          <h1
            style={{
              fontSize: '48px',
              color: '#00E5FF',
              textShadow: '0 0 20px rgba(0, 229, 255, 0.5)',
              marginBottom: '20px',
              fontWeight: 'bold',
            }}
          >
            引力旋涡
          </h1>
          <p style={{ color: '#E0E0E0', fontSize: '18px', marginBottom: '30px' }}>
            太空采矿模拟
          </p>
          <div
            style={{
              color: '#AAA',
              fontSize: '14px',
              textAlign: 'center',
              marginBottom: '40px',
              lineHeight: '1.8',
            }}
          >
            <p>使用方向键控制飞船移动</p>
            <p>收集彩色矿石获得分数</p>
            <p>躲避红色陨石保护护盾</p>
            <p>在2分钟内尽可能多收集矿石！</p>
          </div>
          <button
            onClick={handleStart}
            style={{
              padding: '15px 50px',
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#FFF',
              background: 'linear-gradient(135deg, #00E5FF, #4D96FF)',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              boxShadow: '0 0 20px rgba(0, 229, 255, 0.5)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 0 30px rgba(0, 229, 255, 0.7)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 229, 255, 0.5)';
            }}
          >
            开始游戏
          </button>
          <p style={{ color: '#666', fontSize: '12px', marginTop: '20px' }}>
            按空格键快速开始
          </p>
        </div>
      )}

      {isGameOver && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: fadeIn ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: fadeIn ? 'blur(5px)' : 'blur(0px)',
            transition: 'background-color 0.5s, backdrop-filter 0.5s',
            zIndex: 100,
            pointerEvents: fadeIn ? 'auto' : 'none',
          }}
        >
          <h2
            style={{
              fontSize: '36px',
              color: '#FFFFFF',
              marginBottom: '30px',
              opacity: fadeIn ? 1 : 0,
              transition: 'opacity 0.5s',
            }}
          >
            游戏结束
          </h2>
          <div
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              padding: '30px 50px',
              borderRadius: '15px',
              marginBottom: '30px',
              opacity: fadeIn ? 1 : 0,
              transition: 'opacity 0.5s 0.2s',
              border: '1px solid rgba(0, 229, 255, 0.3)',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <p style={{ color: '#888', fontSize: '16px', marginBottom: '8px' }}>
                最终得分
              </p>
              <p
                style={{
                  fontSize: '48px',
                  fontWeight: 'bold',
                  color: '#00E5FF',
                  textShadow: '0 0 15px rgba(0, 229, 255, 0.5)',
                }}
              >
                {score}
              </p>
            </div>
            <div
              style={{
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                paddingTop: '20px',
                marginBottom: '20px',
              }}
            >
              <p style={{ color: '#888', fontSize: '14px', marginBottom: '12px', textAlign: 'center' }}>
                矿石统计 (共 {totalOres} 个)
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      width: '16px',
                      height: '16px',
                      backgroundColor: '#FF6B6B',
                      borderRadius: '3px',
                    }}
                  />
                  <span style={{ color: '#E0E0E0', fontSize: '14px' }}>红色: {oreCounts.red}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      width: '16px',
                      height: '16px',
                      backgroundColor: '#FFD93D',
                      borderRadius: '3px',
                    }}
                  />
                  <span style={{ color: '#E0E0E0', fontSize: '14px' }}>黄色: {oreCounts.yellow}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      width: '16px',
                      height: '16px',
                      backgroundColor: '#6BCB77',
                      borderRadius: '3px',
                    }}
                  />
                  <span style={{ color: '#E0E0E0', fontSize: '14px' }}>绿色: {oreCounts.green}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      width: '16px',
                      height: '16px',
                      backgroundColor: '#4D96FF',
                      borderRadius: '3px',
                    }}
                  />
                  <span style={{ color: '#E0E0E0', fontSize: '14px' }}>蓝色: {oreCounts.blue}</span>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={handleRestart}
            style={{
              padding: '15px 50px',
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#FFF',
              background: 'linear-gradient(135deg, #00E5FF, #4D96FF)',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              boxShadow: '0 0 20px rgba(0, 229, 255, 0.5)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              opacity: fadeIn ? 1 : 0,
              transitionDelay: '0.4s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 0 30px rgba(0, 229, 255, 0.7)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 229, 255, 0.5)';
            }}
          >
            再玩一次
          </button>
        </div>
      )}

      {isPlaying && (
        <div
          style={{
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            color: 'rgba(255, 255, 255, 0.4)',
            fontSize: '12px',
            pointerEvents: 'none',
          }}
        >
          方向键移动 | 收集矿石 | 躲避陨石
        </div>
      )}
    </div>
  );
}

export default App;
