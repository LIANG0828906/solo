import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine, CollisionResult } from './gameEngine';
import { Renderer, RenderState } from './renderer';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const INITIAL_BALLS = 30;
const LAUNCHER_X = CANVAS_WIDTH / 2;
const LAUNCHER_Y = CANVAS_HEIGHT - 60;
const BLOCK_DISAPPEAR_DURATION = 200;
const CONSECUTIVE_TIME_WINDOW = 500;

export const GameBoard: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameEngineRef = useRef<GameEngine | null>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const animationFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const [score, setScore] = useState(0);
  const [remainingBalls, setRemainingBalls] = useState(INITIAL_BALLS);
  const [blocksEliminated, setBlocksEliminated] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isWin, setIsWin] = useState(false);
  const [isAiming, setIsAiming] = useState(false);
  const [aimAngle, setAimAngle] = useState(-Math.PI / 2);
  const [aimLength, setAimLength] = useState(100);
  const [isMobile, setIsMobile] = useState(false);

  const disappearingBlocksRef = useRef<
    Map<string, { startTime: number; duration: number }>
  >(new Map());
  const recycleMessageRef = useRef({ show: false, startTime: 0 });
  const lastEliminationTimeRef = useRef(0);
  const consecutiveEliminationsRef = useRef(0);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 900);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleCollision = useCallback((result: CollisionResult) => {
    const now = Date.now();
    const engine = gameEngineRef.current;
    if (!engine) return;

    if (disappearingBlocksRef.current.has(result.blockId)) {
      return;
    }

    disappearingBlocksRef.current.set(result.blockId, {
      startTime: now,
      duration: BLOCK_DISAPPEAR_DURATION
    });

    if (now - lastEliminationTimeRef.current < CONSECUTIVE_TIME_WINDOW) {
      consecutiveEliminationsRef.current++;
    } else {
      consecutiveEliminationsRef.current = 1;
    }
    lastEliminationTimeRef.current = now;

    const baseScore = 10;
    const multiplier = consecutiveEliminationsRef.current > 1 ? 1.5 : 1;
    const points = Math.floor(baseScore * multiplier);

    setScore(prev => prev + points);
    setBlocksEliminated(prev => prev + 1);

    engine.createParticles(result.blockData.x, result.blockData.y, result.blockData.color);
    engine.playCollisionSound();

    setTimeout(() => {
      engine.removeBlock(result.blockId);
      disappearingBlocksRef.current.delete(result.blockId);

      const blocks = engine.getBlocks();
      if (blocks.size === 0) {
        setIsWin(true);
        setIsGameOver(true);
        engine.stop();
      }
    }, BLOCK_DISAPPEAR_DURATION);
  }, []);

  const handleBallRecycle = useCallback(() => {
    recycleMessageRef.current = {
      show: true,
      startTime: Date.now()
    };

    setTimeout(() => {
      recycleMessageRef.current.show = false;
    }, 400);

    setRemainingBalls(prev => {
      const newCount = prev - 1;
      if (newCount <= 0) {
        setTimeout(() => {
          setIsGameOver(true);
          gameEngineRef.current?.stop();
        }, 500);
      }
      return newCount;
    });
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;

    gameEngineRef.current = new GameEngine(handleCollision, handleBallRecycle);
    rendererRef.current = new Renderer(canvasRef.current);

    gameEngineRef.current.start();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      gameEngineRef.current?.destroy();
      rendererRef.current?.destroy();
    };
  }, [handleCollision, handleBallRecycle]);

  useEffect(() => {
    if (!gameEngineRef.current || !rendererRef.current) return;

    const gameLoop = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const deltaTime = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      const engine = gameEngineRef.current!;
      const renderer = rendererRef.current!;

      engine.update(deltaTime);

      const renderState: RenderState = {
        blocks: engine.getBlocks(),
        balls: engine.getBalls(),
        particles: engine.getParticles(),
        isAiming,
        aimAngle,
        aimLength,
        disappearingBlocks: disappearingBlocksRef.current,
        recycleMessage: recycleMessageRef.current
      };

      renderer.render(engine.getWorld(), renderState);

      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isAiming, aimAngle, aimLength]);

  const getCanvasCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX: number, clientY: number;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const handlePointerDown = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (isGameOver || remainingBalls <= 0) return;
    e.preventDefault();

    const coords = getCanvasCoordinates(e);
    const dx = coords.x - LAUNCHER_X;
    const dy = coords.y - LAUNCHER_Y;
    let angle = Math.atan2(dy, dx);

    if (angle > 0) {
      angle = angle > Math.PI / 2 ? Math.PI : 0;
    }

    setAimAngle(angle);
    setIsAiming(true);
  };

  const handlePointerMove = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isAiming) return;
    e.preventDefault();

    const coords = getCanvasCoordinates(e);
    const dx = coords.x - LAUNCHER_X;
    const dy = coords.y - LAUNCHER_Y;
    let angle = Math.atan2(dy, dx);
    const length = Math.min(Math.sqrt(dx * dx + dy * dy), 150);

    if (angle > 0) {
      angle = angle > Math.PI / 2 ? Math.PI : 0;
    }

    setAimAngle(angle);
    setAimLength(Math.max(length, 50));
  };

  const handlePointerUp = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isAiming || isGameOver || remainingBalls <= 0) return;
    e.preventDefault();

    gameEngineRef.current?.launchBall(aimAngle);
    setIsAiming(false);
  };

  const handleRestart = () => {
    if (!gameEngineRef.current) return;

    gameEngineRef.current.reset();
    gameEngineRef.current.start();
    setScore(0);
    setRemainingBalls(INITIAL_BALLS);
    setBlocksEliminated(0);
    setIsGameOver(false);
    setIsWin(false);
    disappearingBlocksRef.current.clear();
    lastEliminationTimeRef.current = 0;
    consecutiveEliminationsRef.current = 0;
  };

  const renderBallIcons = () => {
    const balls = [];
    const displayCount = Math.min(remainingBalls, 15);
    for (let i = 0; i < displayCount; i++) {
      balls.push(
        <div
          key={i}
          style={{
            width: isMobile ? 12 : 16,
            height: isMobile ? 12 : 16,
            borderRadius: '50%',
            backgroundColor: '#ec4899',
            marginRight: 4,
            flexShrink: 0,
            transition: 'all 0.2s ease'
          }}
        />
      );
    }
    if (remainingBalls > 15) {
      balls.push(
        <span
          key="more"
          style={{
            color: '#94a3b8',
            fontSize: isMobile ? 12 : 14,
            marginLeft: 4
          }}
        >
          +{remainingBalls - 15}
        </span>
      );
    }
    return balls;
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0f172a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? 10 : 20,
        boxSizing: 'border-box'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: CANVAS_WIDTH * (isMobile ? 0.8 : 1),
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16
        }}
      >
        <div
          style={{
            fontSize: isMobile ? 28 : 36,
            fontWeight: 700,
            color: '#f8fafc',
            textShadow: '0 0 8px rgba(59, 130, 246, 0.5)',
            transition: 'all 0.2s ease'
          }}
        >
          {score}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            maxWidth: '60%',
            justifyContent: 'flex-end'
          }}
        >
          {renderBallIcons()}
        </div>
      </div>

      <div
        style={{
          position: 'relative',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          transition: 'all 0.2s ease'
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            display: 'block',
            cursor: isAiming ? 'crosshair' : 'pointer',
            touchAction: 'none'
          }}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={() => setIsAiming(false)}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
        />

        {isGameOver && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: '#00000088',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
              animation: 'fadeIn 0.3s ease'
            }}
          >
            <div
              style={{
                width: 340,
                height: 220,
                backgroundColor: '#ffffff',
                borderRadius: 20,
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
                transition: 'all 0.2s ease'
              }}
            >
              <div
                style={{
                  fontSize: isMobile ? 16 : 18,
                  fontWeight: 500,
                  color: '#64748b',
                  marginBottom: 8
                }}
              >
                {isWin ? '🎉 恭喜通关！' : '游戏结束'}
              </div>

              <div
                style={{
                  fontSize: isMobile ? 28 : 32,
                  fontWeight: 700,
                  color: '#1e293b',
                  marginBottom: 8
                }}
              >
                {score} 分
              </div>

              <div
                style={{
                  fontSize: isMobile ? 16 : 18,
                  fontWeight: 400,
                  color: '#64748b',
                  marginBottom: 20
                }}
              >
                消除方块: {blocksEliminated} 个
              </div>

              <button
                onClick={handleRestart}
                style={{
                  width: 160,
                  height: 48,
                  backgroundColor: '#3b82f6',
                  color: '#ffffff',
                  fontSize: isMobile ? 16 : 18,
                  fontWeight: 600,
                  border: 'none',
                  borderRadius: 12,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#2563eb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#3b82f6';
                }}
              >
                重新开始
              </button>
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: 16,
          color: '#64748b',
          fontSize: isMobile ? 12 : 14,
          textAlign: 'center',
          transition: 'all 0.2s ease'
        }}
      >
        按住鼠标/触摸屏幕并拖动调整发射角度，松开发射
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        * {
          -webkit-tap-highlight-color: transparent;
        }
        
        body {
          margin: 0;
          padding: 0;
          overflow-x: hidden;
        }
      `}</style>
    </div>
  );
};
