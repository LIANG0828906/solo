import React, { useMemo } from 'react';
import { useGameStore } from '../store/gameStore';
import { audioManager } from '../game/AudioManager';

interface StarStyle {
  left: string;
  top: string;
  width: string;
  height: string;
  animationDelay: string;
  animationDuration: string;
  opacity: number;
}

export const StartScreen: React.FC = () => {
  const gameState = useGameStore((s) => s.gameState);
  const initGame = useGameStore((s) => s.initGame);

  const stars = useMemo<StarStyle[]>(() => {
    const count = 200;
    const result: StarStyle[] = [];
    for (let i = 0; i < count; i++) {
      result.push({
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        width: `${1 + Math.random() * 2}px`,
        height: `${1 + Math.random() * 2}px`,
        animationDelay: `${Math.random() * 5}s`,
        animationDuration: `${3 + Math.random() * 4}s`,
        opacity: 0.3 + Math.random() * 0.7,
      });
    }
    return result;
  }, []);

  if (gameState !== 'menu') return null;

  const handleStart = () => {
    initGame(window.innerWidth, window.innerHeight);
    audioManager.init();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#0B0E1A',
        overflow: 'hidden',
        zIndex: 1000,
      }}
    >
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.3); }
        }
        @keyframes drift {
          0% { transform: translateY(0); }
          100% { transform: translateY(100vh); }
        }
        @keyframes pulse-glow {
          0%, 100% { text-shadow: 0 0 20px rgba(255, 215, 0, 0.5), 0 0 40px rgba(255, 215, 0, 0.3), 0 4px 12px rgba(0, 0, 0, 0.8), 0 6px 0 #8B6914, 0 8px 0 #6B4F10, 0 10px 30px rgba(0, 0, 0, 0.6); }
          50% { text-shadow: 0 0 30px rgba(255, 215, 0, 0.8), 0 0 60px rgba(255, 215, 0, 0.5), 0 4px 12px rgba(0, 0, 0, 0.8), 0 6px 0 #8B6914, 0 8px 0 #6B4F10, 0 10px 30px rgba(0, 0, 0, 0.6); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .star {
          position: absolute;
          background: white;
          border-radius: 50%;
          animation: twinkle ease-in-out infinite;
        }
        .title-glow {
          animation: pulse-glow 3s ease-in-out infinite;
        }
        .float-anim {
          animation: float 4s ease-in-out infinite;
        }
        kbd.key-cap {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 32px;
          height: 32px;
          padding: 0 8px;
          font-size: 13px;
          font-weight: bold;
          font-family: 'Courier New', Courier, monospace;
          color: #E0E6ED;
          background: linear-gradient(180deg, #2A2D42 0%, #1E2033 100%);
          border: 1px solid #3A3D52;
          border-radius: 6px;
          box-shadow: 0 2px 0 #0A0C15, inset 0 1px 0 rgba(255,255,255,0.08);
        }
        kbd.key-cap-accent-blue {
          color: #4fc3f7;
          border-color: #4fc3f7;
        }
        kbd.key-cap-accent-red {
          color: #ef5350;
          border-color: #ef5350;
        }
        kbd.key-cap-accent-shield {
          color: #00D4FF;
          border-color: #00D4FF;
        }
        kbd.key-cap-accent-gold {
          color: #FFD700;
          border-color: #FFD700;
        }
        .start-btn {
          transition: all 0.1s ease;
          position: relative;
          overflow: hidden;
        }
        .start-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 0 #8B6914, 0 10px 25px rgba(0, 0, 0, 0.5), inset 0 2px 0 rgba(255, 255, 255, 0.4), 0 0 50px rgba(255, 215, 0, 0.5) !important;
        }
        .start-btn:active {
          transform: translateY(4px);
          box-shadow: 0 2px 0 #8B6914, 0 4px 10px rgba(0, 0, 0, 0.5), inset 0 2px 0 rgba(255, 255, 255, 0.4) !important;
        }
        .start-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          transition: left 0.5s ease;
        }
        .start-btn:hover::before {
          left: 100%;
        }
      `}</style>

      {stars.map((star, i) => (
        <div
          key={i}
          className="star"
          style={{
            left: star.left,
            top: star.top,
            width: star.width,
            height: star.height,
            animationDelay: star.animationDelay,
            animationDuration: star.animationDuration,
            opacity: star.opacity,
          }}
        />
      ))}

      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '30%',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(80, 40, 150, 0.12) 0%, transparent 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '10%',
          right: '20%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(30, 80, 160, 0.1) 0%, transparent 70%)',
          filter: 'blur(50px)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '36px',
          padding: '40px',
        }}
      >
        <div className="float-anim" style={{ position: 'relative', textAlign: 'center' }}>
          <h1
            className="title-glow"
            style={{
              fontSize: '80px',
              fontWeight: 900,
              fontFamily: '"Courier New", Courier, monospace',
              color: '#FFD700',
              WebkitTextStroke: '3px #B8860B',
              letterSpacing: '8px',
              margin: 0,
              lineHeight: 1.1,
            }}
          >
            太空矿工对战
          </h1>
          <div
            style={{
              marginTop: '12px',
              fontSize: '18px',
              color: '#8892B0',
              letterSpacing: '12px',
              fontFamily: '"Courier New", Courier, monospace',
            }}
          >
            SPACE MINERS BATTLE
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(280px, 1fr))',
            gap: '24px',
            width: '100%',
            maxWidth: '720px',
          }}
        >
          <div
            style={{
              background: 'rgba(26, 29, 46, 0.95)',
              borderRadius: '12px',
              padding: '24px',
              border: '2px solid rgba(79, 195, 247, 0.4)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '18px',
              }}
            >
              <div
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: '#4fc3f7',
                  boxShadow: '0 0 12px #4fc3f7',
                }}
              />
              <div
                style={{
                  fontSize: '22px',
                  fontWeight: 'bold',
                  color: '#4fc3f7',
                  fontFamily: '"Courier New", Courier, monospace',
                }}
              >
                玩家 1
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                }}
              >
                <div style={{ color: '#8892B0', fontSize: '14px', fontFamily: '"Courier New", Courier, monospace', minWidth: '50px' }}>
                  移动
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <kbd className="key-cap">W</kbd>
                  <kbd className="key-cap">A</kbd>
                  <kbd className="key-cap">S</kbd>
                  <kbd className="key-cap">D</kbd>
                </div>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                }}
              >
                <div style={{ color: '#8892B0', fontSize: '14px', fontFamily: '"Courier New", Courier, monospace', minWidth: '50px' }}>
                  射击
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <kbd className="key-cap key-cap-accent-blue">Q</kbd>
                </div>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                }}
              >
                <div style={{ color: '#8892B0', fontSize: '14px', fontFamily: '"Courier New", Courier, monospace', minWidth: '50px' }}>
                  护盾
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <kbd className="key-cap key-cap-accent-shield">E</kbd>
                </div>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                }}
              >
                <div style={{ color: '#8892B0', fontSize: '14px', fontFamily: '"Courier New", Courier, monospace', minWidth: '50px' }}>
                  升级
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <kbd className="key-cap key-cap-accent-gold">1</kbd>
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              background: 'rgba(26, 29, 46, 0.95)',
              borderRadius: '12px',
              padding: '24px',
              border: '2px solid rgba(239, 83, 80, 0.4)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '18px',
              }}
            >
              <div
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: '#ef5350',
                  boxShadow: '0 0 12px #ef5350',
                }}
              />
              <div
                style={{
                  fontSize: '22px',
                  fontWeight: 'bold',
                  color: '#ef5350',
                  fontFamily: '"Courier New", Courier, monospace',
                }}
              >
                玩家 2
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                }}
              >
                <div style={{ color: '#8892B0', fontSize: '14px', fontFamily: '"Courier New", Courier, monospace', minWidth: '50px' }}>
                  移动
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <kbd className="key-cap">↑</kbd>
                  <kbd className="key-cap">↓</kbd>
                  <kbd className="key-cap">←</kbd>
                  <kbd className="key-cap">→</kbd>
                </div>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                }}
              >
                <div style={{ color: '#8892B0', fontSize: '14px', fontFamily: '"Courier New", Courier, monospace', minWidth: '50px' }}>
                  射击
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <kbd className="key-cap key-cap-accent-red">/</kbd>
                </div>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                }}
              >
                <div style={{ color: '#8892B0', fontSize: '14px', fontFamily: '"Courier New", Courier, monospace', minWidth: '50px' }}>
                  护盾
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <kbd className="key-cap key-cap-accent-shield">.</kbd>
                </div>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                }}
              >
                <div style={{ color: '#8892B0', fontSize: '14px', fontFamily: '"Courier New", Courier, monospace', minWidth: '50px' }}>
                  升级
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <kbd className="key-cap key-cap-accent-gold">2</kbd>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            background: 'rgba(26, 29, 46, 0.95)',
            borderRadius: '12px',
            padding: '20px 32px',
            maxWidth: '720px',
            width: '100%',
            border: '1px solid rgba(241, 196, 15, 0.25)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          }}
        >
          <div
            style={{
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#F1C40F',
              marginBottom: '12px',
              fontFamily: '"Courier New", Courier, monospace',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <span>⚡</span> 游戏规则
          </div>
          <div
            style={{
              color: '#C8CDE0',
              fontSize: '14px',
              lineHeight: 1.9,
              fontFamily: '"Courier New", Courier, monospace',
            }}
          >
            <div style={{ marginBottom: '4px' }}>
              • 采集 <span style={{ color: '#F1C40F', fontWeight: 'bold' }}>50单位矿物</span> 即可按 [1/2] 升级飞船
            </div>
            <div>
              • <span style={{ color: '#E74C3C', fontWeight: 'bold' }}>击败对手</span> 获得胜利！
            </div>
          </div>
        </div>

        <button
          className="start-btn"
          onClick={handleStart}
          style={{
            marginTop: '4px',
            padding: '18px 72px',
            fontSize: '26px',
            fontWeight: 'bold',
            fontFamily: '"Courier New", Courier, monospace',
            color: '#0B0E1A',
            background: 'linear-gradient(180deg, #FFD700 0%, #F1C40F 50%, #D4AC0D 100%)',
            border: '3px solid #B8860B',
            borderRadius: '12px',
            cursor: 'pointer',
            letterSpacing: '6px',
            boxShadow: '0 6px 0 #8B6914, 0 8px 20px rgba(0, 0, 0, 0.5), inset 0 2px 0 rgba(255, 255, 255, 0.4), 0 0 40px rgba(255, 215, 0, 0.3)',
          }}
        >
          开始游戏
        </button>
      </div>
    </div>
  );
};
