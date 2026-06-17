import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../engine/StateSync';

export const HUD: React.FC = () => {
  const score = useGameStore((s) => s.displayScore);
  const level = useGameStore((s) => s.level);
  const energy = useGameStore((s) => s.energy);
  const maxEnergy = useGameStore((s) => s.maxEnergy);
  const maxLevel = useGameStore((s) => s.maxLevel);
  const isPlaying = useGameStore((s) => s.isPlaying);
  const gameOver = useGameStore((s) => s.gameOver);
  const levelComplete = useGameStore((s) => s.levelComplete);
  const startGame = useGameStore((s) => s.startGame);
  const restartGame = useGameStore((s) => s.restartGame);
  const nextLevel = useGameStore((s) => s.nextLevel);
  const isPowered = useGameStore((s) => s.isPowered);
  const isSlowed = useGameStore((s) => s.isSlowed);

  const [panelOpen, setPanelOpen] = useState(true);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const resetHideTimer = () => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }
    hideTimerRef.current = setTimeout(() => {
      setPanelOpen(false);
    }, 5000);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (e.clientX < 280) {
        setPanelOpen(true);
        resetHideTimer();
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    resetHideTimer();
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  if (!isPlaying && !gameOver && !levelComplete) {
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(11, 14, 20, 0.95)',
          zIndex: 100,
        }}
      >
        <div
          style={{
            fontSize: '56px',
            fontWeight: 'bold',
            color: '#00E5FF',
            marginBottom: '24px',
            textShadow: '0 0 30px rgba(0, 229, 255, 0.5)',
            letterSpacing: '4px',
          }}
        >
          量子粒子穿梭
        </div>
        <div
          style={{
            fontSize: '18px',
            color: '#AAAAAA',
            marginBottom: '48px',
            maxWidth: '500px',
            textAlign: 'center',
            lineHeight: '1.6',
          }}
        >
          操控高能粒子穿越量子场迷宫，吸收同色能量球强化自身，
          躲避干扰粒子，抵达出口节点！
        </div>
        <div
          style={{
            display: 'flex',
            gap: '32px',
            marginBottom: '48px',
          }}
        >
          {[
            { color: '#FF3366', name: '红' },
            { color: '#00E676', name: '绿' },
            { color: '#448AFF', name: '蓝' },
            { color: '#D500F9', name: '紫' },
          ].map((c) => (
            <div
              key={c.color}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: c.color,
                  boxShadow: `0 0 16px ${c.color}`,
                }}
              />
              <span style={{ color: '#888', fontSize: '14px' }}>{c.name}色能量</span>
            </div>
          ))}
        </div>
        <button
          onClick={startGame}
          style={{
            padding: '16px 48px',
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#FFFFFF',
            background: 'linear-gradient(135deg, #00E5FF 0%, #448AFF 100%)',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 4px 20px rgba(0, 229, 255, 0.4)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 229, 255, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 229, 255, 0.4)';
          }}
        >
          开始游戏
        </button>
        <div
          style={{
            marginTop: '40px',
            display: 'flex',
            gap: '48px',
            color: '#666666',
            fontSize: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <kbd style={kbdStyle}>W</kbd>
            <span>前进</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <kbd style={kbdStyle}>A</kbd>
            <span>左移</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <kbd style={kbdStyle}>S</kbd>
            <span>后退</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <kbd style={kbdStyle}>D</kbd>
            <span>右移</span>
          </div>
        </div>
      </div>
    );
  }

  if (gameOver) {
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(11, 14, 20, 0.95)',
          zIndex: 100,
        }}
      >
        <div
          style={{
            fontSize: '60px',
            fontWeight: 'bold',
            color: '#FFFFFF',
            marginBottom: '16px',
            letterSpacing: '6px',
          }}
        >
          GAME OVER
        </div>
        <div
          style={{
            fontSize: '24px',
            color: '#AAAAAA',
            marginBottom: '48px',
          }}
        >
          最终得分：<span style={{ color: '#00E5FF' }}>{score}</span>
        </div>
        <button
          onClick={restartGame}
          style={{
            padding: '14px 40px',
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#FFFFFF',
            background: 'linear-gradient(135deg, #00E5FF 0%, #448AFF 100%)',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 4px 20px rgba(0, 229, 255, 0.4)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 229, 255, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 229, 255, 0.4)';
          }}
        >
          重新开始
        </button>
      </div>
    );
  }

  if (levelComplete) {
    const isFinalLevel = level >= maxLevel;
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(11, 14, 20, 0.95)',
          zIndex: 100,
        }}
      >
        <div
          style={{
            fontSize: '52px',
            fontWeight: 'bold',
            color: isFinalLevel ? '#FFD700' : '#00E676',
            marginBottom: '16px',
            letterSpacing: '4px',
            textShadow: isFinalLevel
              ? '0 0 30px rgba(255, 215, 0, 0.6)'
              : '0 0 30px rgba(0, 230, 118, 0.5)',
          }}
        >
          {isFinalLevel ? '🏆 通关成功！' : `第 ${level} 关通过！`}
        </div>
        <div
          style={{
            fontSize: '22px',
            color: '#AAAAAA',
            marginBottom: '48px',
          }}
        >
          当前得分：<span style={{ color: '#00E5FF', fontSize: '28px' }}>{score}</span>
        </div>
        {!isFinalLevel && (
          <button
            onClick={nextLevel}
            style={{
              padding: '14px 40px',
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#FFFFFF',
              background: 'linear-gradient(135deg, #00E676 0%, #00E5FF 100%)',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 20px rgba(0, 230, 118, 0.4)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 230, 118, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 230, 118, 0.4)';
            }}
          >
            进入第 {level + 1} 关
          </button>
        )}
        {isFinalLevel && (
          <button
            onClick={restartGame}
            style={{
              padding: '14px 40px',
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#FFFFFF',
              background: 'linear-gradient(135deg, #FFD700 0%, #FF9100 100%)',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 20px rgba(255, 215, 0, 0.4)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(255, 215, 0, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(255, 215, 0, 0.4)';
            }}
          >
            再玩一次
          </button>
        )}
      </div>
    );
  }

  const energyPercent = (energy / maxEnergy) * 100;

  return (
    <>
      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          top: 20,
          left: panelOpen ? 20 : -260,
          width: 240,
          backgroundColor: 'rgba(26, 26, 46, 0.85)',
          backdropFilter: 'blur(10px)',
          borderRadius: '12px',
          padding: '20px',
          color: '#FFFFFF',
          fontSize: '14px',
          zIndex: 50,
          transition: 'left 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
          border: '1px solid rgba(0, 229, 255, 0.1)',
        }}
        onMouseEnter={() => {
          setPanelOpen(true);
          if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        }}
        onMouseLeave={resetHideTimer}
      >
        <div
          style={{
            fontSize: '18px',
            fontWeight: 'bold',
            marginBottom: '20px',
            color: '#00E5FF',
            borderBottom: '1px solid rgba(0, 229, 255, 0.2)',
            paddingBottom: '12px',
            letterSpacing: '1px',
          }}
        >
          量子粒子穿梭
        </div>

        <div style={{ marginBottom: '16px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '6px',
              color: '#888888',
            }}
          >
            <span>关卡</span>
            <span style={{ color: '#FFFFFF', fontWeight: 'bold' }}>
              {level} / {maxLevel}
            </span>
          </div>
          <div
            style={{
              height: '4px',
              backgroundColor: '#1E1E2E',
              borderRadius: '2px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${(level / maxLevel) * 100}%`,
                background: 'linear-gradient(90deg, #00E5FF, #448AFF)',
                transition: 'width 0.5s',
              }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '6px',
              color: '#888888',
            }}
          >
            <span>得分</span>
            <span
              style={{
                color: '#FFFFFF',
                fontWeight: 'bold',
                fontSize: '20px',
                transition: 'color 0.5s, transform 0.5s',
              }}
            >
              {score}
            </span>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '8px',
              color: '#888888',
              fontSize: '12px',
            }}
          >
            <span>粒子能量</span>
            <span style={{ color: '#00E5FF' }}>
              {energy} / {maxEnergy}
            </span>
          </div>
          <div
            style={{
              width: '100%',
              height: '14px',
              backgroundColor: '#1E1E2E',
              borderRadius: '6px',
              overflow: 'hidden',
              padding: '1px',
              boxShadow: isPowered
                ? '0 0 10px rgba(0, 229, 255, 0.6)'
                : 'none',
              transition: 'box-shadow 0.3s',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${energyPercent}%`,
                background: isPowered
                  ? 'linear-gradient(90deg, #FFD700, #FF3366, #D500F9, #448AFF, #00E676, #FFD700)'
                  : 'linear-gradient(90deg, #00E5FF, #448AFF)',
                borderRadius: '5px',
                transition: 'width 0.3s, background 0.5s',
                backgroundSize: isPowered ? '200% 100%' : '100% 100%',
                animation: isPowered ? 'rainbow 2s linear infinite' : 'none',
                boxShadow: '0 0 6px rgba(0, 229, 255, 0.5)',
              }}
            />
          </div>
          {isPowered && (
            <div
              style={{
                marginTop: '6px',
                fontSize: '12px',
                color: '#FFD700',
                fontWeight: 'bold',
                textAlign: 'center',
              }}
            >
              ⚡ 强化状态中
            </div>
          )}
        </div>

        {isSlowed && (
          <div
            style={{
              marginBottom: '16px',
              padding: '8px 12px',
              backgroundColor: 'rgba(255, 51, 102, 0.15)',
              borderRadius: '8px',
              border: '1px solid rgba(255, 51, 102, 0.3)',
              fontSize: '12px',
              color: '#FF3366',
              textAlign: 'center',
            }}
          >
            ⚠ 粒子减速中
          </div>
        )}

        <div
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            paddingTop: '16px',
          }}
        >
          <div
            style={{
              color: '#666666',
              fontSize: '12px',
              marginBottom: '12px',
            }}
          >
            操作提示
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '6px',
              maxWidth: '120px',
              margin: '0 auto',
            }}
          >
            <div />
            <kbd style={smallKbdStyle}>W</kbd>
            <div />
            <kbd style={smallKbdStyle}>A</kbd>
            <kbd style={smallKbdStyle}>S</kbd>
            <kbd style={smallKbdStyle}>D</kbd>
          </div>
          <div
            style={{
              marginTop: '14px',
              fontSize: '11px',
              color: '#555555',
              textAlign: 'center',
              lineHeight: '1.5',
            }}
          >
            鼠标拖拽旋转视角<br />
            滚轮缩放
          </div>
        </div>
      </div>

      <style>{`
        @keyframes rainbow {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
      `}</style>
    </>
  );
};

const kbdStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '28px',
  height: '28px',
  padding: '0 8px',
  backgroundColor: '#2A2A3E',
  border: '1px solid #3A3A5E',
  borderRadius: '6px',
  color: '#666666',
  fontSize: '14px',
  fontWeight: 'bold',
  fontFamily: 'monospace',
  boxShadow: '0 2px 0 #1A1A2E',
};

const smallKbdStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '30px',
  height: '30px',
  backgroundColor: '#2A2A3E',
  border: '1px solid #3A3A5E',
  borderRadius: '6px',
  color: '#666666',
  fontSize: '14px',
  fontWeight: 'bold',
  fontFamily: 'monospace',
  boxShadow: '0 2px 0 #1A1A2E',
};
