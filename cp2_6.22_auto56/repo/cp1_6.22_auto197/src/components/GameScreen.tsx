import { useEffect, useRef, useState } from 'react';
import { GameEngine } from '../gameEngine';
import { getLevelById, LEVELS } from '../levelData';
import type { EngineState } from '../gameEngine';

interface GameScreenProps {
  levelId: number;
  onComplete: (levelId: number) => void;
  onNextLevel: () => void;
  onGameOver: () => void;
  onBack: () => void;
}

export default function GameScreen({ levelId, onComplete, onNextLevel, onGameOver, onBack }: GameScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!canvasRef.current) return;
    const level = getLevelById(levelId);
    if (!level) return;

    const engine = new GameEngine(
      canvasRef.current,
      level,
      (_state: EngineState) => {
        setTick(t => t + 1);
      },
      () => {
        onComplete(levelId);
        onNextLevel();
      },
      () => {
        onGameOver();
      }
    );

    engineRef.current = engine;
    engine.start();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!engineRef.current) return;
      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
          engineRef.current.setInput({ left: true });
          e.preventDefault();
          break;
        case 'ArrowRight':
        case 'KeyD':
          engineRef.current.setInput({ right: true });
          e.preventDefault();
          break;
        case 'ArrowUp':
        case 'KeyW':
        case 'Space':
          engineRef.current.setInput({ jump: true });
          e.preventDefault();
          break;
        case 'KeyT':
          engineRef.current.toggleRecording();
          e.preventDefault();
          break;
        case 'KeyR':
          engineRef.current.resetLevel(false);
          e.preventDefault();
          break;
        case 'Escape':
          onBack();
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!engineRef.current) return;
      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
          engineRef.current.setInput({ left: false });
          break;
        case 'ArrowRight':
        case 'KeyD':
          engineRef.current.setInput({ right: false });
          break;
        case 'ArrowUp':
        case 'KeyW':
        case 'Space':
          engineRef.current.setInput({ jump: false });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      engine.stop();
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [levelId, onComplete, onNextLevel, onGameOver, onBack]);

  const handleTouchStart = (dir: 'left' | 'right' | 'jump' | 'rewind') => {
    if (!engineRef.current) return;
    if (dir === 'rewind') {
      engineRef.current.toggleRecording();
    } else if (dir === 'jump') {
      engineRef.current.setInput({ jump: true });
    } else {
      engineRef.current.setInput({ [dir]: true });
    }
  };

  const handleTouchEnd = (dir: 'left' | 'right' | 'jump') => {
    if (!engineRef.current) return;
    if (dir === 'jump') {
      engineRef.current.setInput({ jump: false });
    } else {
      engineRef.current.setInput({ [dir]: false });
    }
  };

  const hasNextLevel = levelId < LEVELS.length;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        gap: 16,
        width: '100%',
        height: '100%',
        position: 'relative'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 800,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <button
          onClick={onBack}
          style={{
            padding: '8px 16px',
            fontSize: 13,
            color: '#A0AEC0',
            backgroundColor: 'rgba(226, 232, 240, 0.08)',
            border: '1px solid rgba(226, 232, 240, 0.15)',
            borderRadius: 8,
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#E2E8F0';
            e.currentTarget.style.backgroundColor = 'rgba(226, 232, 240, 0.12)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#A0AEC0';
            e.currentTarget.style.backgroundColor = 'rgba(226, 232, 240, 0.08)';
          }}
        >
          ← 关卡列表
        </button>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => engineRef.current?.resetLevel(false)}
            style={{
              padding: '8px 16px',
              fontSize: 13,
              color: '#E2E8F0',
              backgroundColor: 'rgba(99, 179, 237, 0.15)',
              border: '1px solid rgba(99, 179, 237, 0.3)',
              borderRadius: 8,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(99, 179, 237, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(99, 179, 237, 0.15)';
            }}
          >
            🔄 重试 (R)
          </button>
          {hasNextLevel && (
            <button
              onClick={onNextLevel}
              style={{
                padding: '8px 16px',
                fontSize: 13,
                color: '#1A202C',
                backgroundColor: '#48BB78',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontWeight: 600,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#68D391';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#48BB78';
              }}
            >
              下一关 →
            </button>
          )}
        </div>
      </div>

      <div
        style={{
          position: 'relative',
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 12px 48px rgba(0, 0, 0, 0.5), 0 0 0 2px rgba(99, 179, 237, 0.2)',
          background: '#1A202C'
        }}
      >
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          style={{
            display: 'block',
            width: 800,
            height: 600,
            imageRendering: 'pixelated'
          }}
        />

        <TouchControls
          onLeftStart={() => handleTouchStart('left')}
          onLeftEnd={() => handleTouchEnd('left')}
          onRightStart={() => handleTouchStart('right')}
          onRightEnd={() => handleTouchEnd('right')}
          onJumpStart={() => handleTouchStart('jump')}
          onJumpEnd={() => handleTouchEnd('jump')}
          onRewind={() => handleTouchStart('rewind')}
        />
      </div>

      <div
        style={{
          display: 'flex',
          gap: 24,
          fontSize: 12,
          color: '#718096'
        }}
      >
        <span>⌨️ 键盘: 方向键/WASD 移动 · 空格跳跃 · T 回溯 · R 重试 · ESC 返回</span>
      </div>
    </div>
  );
}

interface TouchControlsProps {
  onLeftStart: () => void;
  onLeftEnd: () => void;
  onRightStart: () => void;
  onRightEnd: () => void;
  onJumpStart: () => void;
  onJumpEnd: () => void;
  onRewind: () => void;
}

function TouchControls(props: TouchControlsProps) {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse)');
    setIsTouch(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsTouch(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const btnStyle: React.CSSProperties = {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: '50%',
    backgroundColor: 'rgba(26, 32, 44, 0.7)',
    border: '2px solid rgba(226, 232, 240, 0.3)',
    color: '#E2E8F0',
    fontSize: 24,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    touchAction: 'manipulation',
    cursor: 'pointer',
    transition: 'all 0.1s ease',
    backdropFilter: 'blur(4px)'
  };

  const activeStyle = {
    backgroundColor: 'rgba(99, 179, 237, 0.5)',
    transform: 'scale(0.95)'
  };

  if (!isTouch) return null;

  return (
    <div>
      <button
        style={{
          ...btnStyle,
          left: 20,
          bottom: 100
        }}
        onTouchStart={(e) => { e.preventDefault(); Object.assign(e.currentTarget.style, activeStyle); props.onLeftStart(); }}
        onTouchEnd={(e) => { e.preventDefault(); Object.assign(e.currentTarget.style, btnStyle); props.onLeftEnd(); }}
        onMouseDown={() => props.onLeftStart()}
        onMouseUp={() => props.onLeftEnd()}
        onMouseLeave={() => props.onLeftEnd()}
      >◀</button>

      <button
        style={{
          ...btnStyle,
          left: 95,
          bottom: 100
        }}
        onTouchStart={(e) => { e.preventDefault(); Object.assign(e.currentTarget.style, activeStyle); props.onRightStart(); }}
        onTouchEnd={(e) => { e.preventDefault(); Object.assign(e.currentTarget.style, btnStyle); props.onRightEnd(); }}
        onMouseDown={() => props.onRightStart()}
        onMouseUp={() => props.onRightEnd()}
        onMouseLeave={() => props.onRightEnd()}
      >▶</button>

      <button
        style={{
          ...btnStyle,
          right: 100,
          bottom: 100,
          backgroundColor: 'rgba(72, 187, 120, 0.6)'
        }}
        onTouchStart={(e) => { e.preventDefault(); Object.assign(e.currentTarget.style, { ...activeStyle, backgroundColor: 'rgba(72, 187, 120, 0.8)' }); props.onJumpStart(); }}
        onTouchEnd={(e) => { e.preventDefault(); e.currentTarget.style.backgroundColor = 'rgba(72, 187, 120, 0.6)'; e.currentTarget.style.transform = 'scale(1)'; props.onJumpEnd(); }}
        onMouseDown={() => props.onJumpStart()}
        onMouseUp={() => props.onJumpEnd()}
        onMouseLeave={() => props.onJumpEnd()}
      >▲</button>

      <button
        style={{
          ...btnStyle,
          right: 20,
          bottom: 100,
          backgroundColor: 'rgba(245, 101, 101, 0.6)',
          fontSize: 14,
          fontWeight: 600
        }}
        onTouchStart={(e) => { e.preventDefault(); Object.assign(e.currentTarget.style, { ...activeStyle, backgroundColor: 'rgba(245, 101, 101, 0.8)' }); props.onRewind(); }}
        onTouchEnd={(e) => { e.preventDefault(); e.currentTarget.style.backgroundColor = 'rgba(245, 101, 101, 0.6)'; e.currentTarget.style.transform = 'scale(1)'; }}
        onClick={props.onRewind}
      >⏱T</button>
    </div>
  );
}
