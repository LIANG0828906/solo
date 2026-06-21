import { useState, useCallback } from 'react';
import GameCanvas from './GameCanvas';

type GameScreen = 'idle' | 'playing' | 'gameover';

export default function App() {
  const [screen, setScreen] = useState<GameScreen>('idle');
  const [finalScore, setFinalScore] = useState(0);

  const handleStart = useCallback(() => {
    setScreen('playing');
  }, []);

  const handleGameOver = useCallback((score: number) => {
    setFinalScore(score);
    setScreen('gameover');
  }, []);

  const handleRestart = useCallback(() => {
    setScreen('playing');
  }, []);

  if (screen === 'playing') {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#0f0f23',
        padding: '20px',
      }}>
        <GameCanvas onGameOver={handleGameOver} />
      </div>
    );
  }

  if (screen === 'gameover') {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#0f0f23',
        fontFamily: '"Press Start 2P", monospace',
        padding: '20px',
      }}>
        <h1 style={{
          fontSize: '36px',
          color: '#ffffff',
          textShadow: '0 0 10px rgba(68, 136, 255, 0.6)',
          marginBottom: '30px',
        }}>
          游戏结束
        </h1>
        <p style={{
          fontSize: '20px',
          color: '#cccccc',
          marginBottom: '40px',
        }}>
          最终得分：{finalScore}
        </p>
        <button
          onClick={handleRestart}
          style={{
            width: '150px',
            height: '40px',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            border: 'none',
            borderRadius: '4px',
            color: '#ffffff',
            fontSize: '14px',
            fontFamily: '"Press Start 2P", monospace',
            cursor: 'pointer',
            transition: 'filter 0.2s',
          }}
          onMouseEnter={e => { (e.target as HTMLElement).style.filter = 'brightness(1.2)'; }}
          onMouseLeave={e => { (e.target as HTMLElement).style.filter = 'brightness(1)'; }}
        >
          重新开始
        </button>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#1a1a2e',
      fontFamily: '"Press Start 2P", monospace',
      padding: '20px',
    }}>
      <h1 style={{
        fontSize: '36px',
        color: '#ffffff',
        textShadow: '0 0 10px rgba(68, 136, 255, 0.6), 0 0 20px rgba(68, 136, 255, 0.3)',
        marginBottom: '50px',
        textAlign: 'center',
        lineHeight: '1.4',
      }}>
        极速像素
      </h1>
      <button
        onClick={handleStart}
        style={{
          width: '150px',
          height: '40px',
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          border: 'none',
          borderRadius: '4px',
          color: '#ffffff',
          fontSize: '14px',
          fontFamily: '"Press Start 2P", monospace',
          cursor: 'pointer',
          transition: 'filter 0.2s',
        }}
        onMouseEnter={e => { (e.target as HTMLElement).style.filter = 'brightness(1.2)'; }}
        onMouseLeave={e => { (e.target as HTMLElement).style.filter = 'brightness(1)'; }}
      >
        开始游戏
      </button>
      <p style={{
        fontSize: '10px',
        color: '#555577',
        marginTop: '30px',
        textAlign: 'center',
        lineHeight: '2',
      }}>
        ← → 方向键控制赛车
      </p>
    </div>
  );
}
