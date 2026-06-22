import { useEffect, useState } from 'react';
import GameCanvas from './components/GameCanvas';
import HUD from './components/HUD';
import { useGameStore } from './store/gameStore';

export default function App() {
  const [windowWidth, setWindowWidth] = useState(() => 
    typeof window !== 'undefined' ? window.innerWidth : 1280
  );
  const resetGame = useGameStore(s => s.resetGame);
  const state = useGameStore(s => s.state);
  const defeatTransition = useGameStore(s => s.defeatTransition);
  const phase = state.phase;
  
  useEffect(() => {
    const handler = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  
  useEffect(() => {
    const keyHandler = (e: KeyboardEvent) => {
      if (phase !== 'playing') return;
      const movePlayer = useGameStore.getState().movePlayer;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          movePlayer('up');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          movePlayer('down');
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          movePlayer('left');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          movePlayer('right');
          break;
      }
    };
    window.addEventListener('keydown', keyHandler);
    return () => window.removeEventListener('keydown', keyHandler);
  }, [phase]);
  
  const isCollapsed = windowWidth < 1024;
  
  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: isCollapsed ? 'column' : 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isCollapsed ? '10px' : '20px',
      gap: '20px',
      position: 'relative',
      overflow: 'auto'
    }}>
      {isCollapsed ? (
        <>
          <div style={{
            display: 'flex',
            flexDirection: 'row',
            gap: '20px',
            width: '100%',
            maxWidth: '600px',
            justifyContent: 'center'
          }}>
            <HUD variant="left" compact />
            <HUD variant="right" compact />
          </div>
          <GameCanvas />
        </>
      ) : (
        <>
          <HUD variant="left" />
          <GameCanvas />
          <HUD variant="right" />
        </>
      )}
      
      {phase === 'victory' && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100
        }}>
          <div style={{
            textAlign: 'center',
            padding: '60px 80px',
            background: 'linear-gradient(135deg, #1E1E1E 0%, #2A2A2A 100%)',
            borderRadius: '20px',
            border: '2px solid #FFB300',
            boxShadow: '0 0 60px rgba(255, 179, 0, 0.3)'
          }}>
            <div style={{
              fontSize: '72px',
              fontWeight: 'bold',
              color: '#FFB300',
              textShadow: '0 0 30px rgba(255, 179, 0, 0.8)',
              marginBottom: '20px',
              animation: 'pulse 1.5s ease-in-out infinite'
            }}>
              胜利！
            </div>
            <div style={{
              fontSize: '18px',
              color: '#E0E0E0',
              marginBottom: '30px'
            }}>
              你成功击败了所有怪物并逃出了地下城
            </div>
            <button
              onClick={resetGame}
              style={{
                padding: '12px 40px',
                fontSize: '18px',
                fontWeight: 'bold',
                background: 'linear-gradient(180deg, #FFB300 0%, #FF8F00 100%)',
                color: '#1A1A1A',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(255, 179, 0, 0.4)'
              }}
            >
              再来一局
            </button>
          </div>
        </div>
      )}
      
      {phase === 'defeat' && defeatTransition >= 0.9 && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: `rgba(0, 0, 0, ${0.7 + defeatTransition * 0.25})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          filter: `grayscale(${defeatTransition * 100}%)`
        }}>
          <div style={{
            textAlign: 'center',
            padding: '60px 80px',
            background: 'linear-gradient(135deg, #1E1E1E 0%, #2A2A2A 100%)',
            borderRadius: '20px',
            border: '2px solid #FF5252'
          }}>
            <div style={{
              fontSize: '72px',
              fontWeight: 'bold',
              color: '#FF5252',
              textShadow: '0 0 30px rgba(255, 82, 82, 0.8)',
              marginBottom: '20px',
              animation: 'breathe 2s ease-in-out infinite'
            }}>
              失败
            </div>
            <div style={{
              fontSize: '18px',
              color: '#E0E0E0',
              marginBottom: '30px'
            }}>
              你被黑暗中的怪物击败了...
            </div>
            <button
              onClick={resetGame}
              style={{
                padding: '12px 40px',
                fontSize: '18px',
                fontWeight: 'bold',
                background: 'linear-gradient(180deg, #FF5252 0%, #D32F2F 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              重新开始
            </button>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.9; }
        }
        @keyframes breathe {
          0%, 100% { opacity: 0.8; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.03); }
        }
      `}</style>
    </div>
  );
}
