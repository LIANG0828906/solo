import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GalaxyState, createInitialState, createGalaxy } from './GalaxyState';
import { updateGalaxies } from './PhysicsEngine';
import { Renderer } from './Renderer';
import UIPanel from './UIPanel';

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const stateRef = useRef<GalaxyState>(createInitialState());
  const animationRef = useRef<number>(0);
  const isPausedRef = useRef<boolean>(false);
  const draggedGalaxyIdRef = useRef<string | null>(null);
  const dragPositionRef = useRef<{ x: number; y: number } | null>(null);

  const [galaxyA, setGalaxyA] = useState(stateRef.current.galaxies[0]);
  const [galaxyB, setGalaxyB] = useState(stateRef.current.galaxies[1]);
  const [isPaused, setIsPaused] = useState(false);
  const [fps, setFps] = useState(60);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [totalStars, setTotalStars] = useState(380);

  const chartCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const container = canvas.parentElement;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    rendererRef.current = new Renderer(canvas, width, height);

    const handleResize = () => {
      if (!rendererRef.current || !container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      rendererRef.current.resize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    let lastTime = performance.now();
    let frameCount = 0;
    let fpsUpdateCounter = 0;

    const animate = (currentTime: number) => {
      animationRef.current = requestAnimationFrame(animate);

      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      if (!isPausedRef.current) {
        stateRef.current = updateGalaxies(
          stateRef.current,
          deltaTime,
          isPausedRef.current,
          draggedGalaxyIdRef.current,
          dragPositionRef.current
        );

        frameCount++;
        fpsUpdateCounter++;

        if (fpsUpdateCounter >= 30) {
          const calculatedFps = Math.round(1 / deltaTime);
          setFps(calculatedFps);
          fpsUpdateCounter = 0;
        }

        setCurrentFrame(stateRef.current.frameCount);
        setTotalStars(stateRef.current.totalStarCount);
      }

      if (rendererRef.current) {
        rendererRef.current.render(stateRef.current);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!chartCanvasRef.current) return;

    const canvas = chartCanvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const width = 300;
    const height = 150;
    canvas.width = width;
    canvas.height = height;

    const drawChart = () => {
      ctx.fillStyle = '#1A1A2E';
      ctx.fillRect(0, 0, width, height);

      const history = stateRef.current.history;
      if (history.length < 2) return;

      const starCounts = history.filter((_, i) => i % 2 === 0).map(h => h.starCount);
      if (starCounts.length < 2) return;

      const minVal = Math.min(...starCounts) * 0.9;
      const maxVal = Math.max(...starCounts) * 1.1;
      const range = maxVal - minVal || 1;

      ctx.strokeStyle = '#00E676';
      ctx.lineWidth = 2;
      ctx.beginPath();

      starCounts.forEach((count, i) => {
        const x = (i / (starCounts.length - 1)) * (width - 20) + 10;
        const y = height - 10 - ((count - minVal) / range) * (height - 20);

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();

      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, 'rgba(0, 230, 118, 0.3)');
      gradient.addColorStop(1, 'rgba(0, 230, 118, 0)');

      ctx.lineTo(width - 10, height - 10);
      ctx.lineTo(10, height - 10);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.fillStyle = '#888';
      ctx.font = '10px Arial';
      ctx.fillText(`${Math.round(maxVal)}`, 5, 15);
      ctx.fillText(`${Math.round(minVal)}`, 5, height - 5);
    };

    const interval = setInterval(drawChart, 100);

    return () => clearInterval(interval);
  }, []);

  const handleGalaxyAChange = useCallback((updates: Partial<typeof galaxyA>) => {
    const currentGalaxy = stateRef.current.galaxies[0];
    const newGalaxy = createGalaxy(
      currentGalaxy.id,
      currentGalaxy.centerX,
      currentGalaxy.centerY,
      updates.vx !== undefined ? updates.vx : currentGalaxy.vx,
      updates.vy !== undefined ? updates.vy : currentGalaxy.vy,
      updates.starCount !== undefined ? updates.starCount : currentGalaxy.starCount,
      updates.armDensity !== undefined ? updates.armDensity : currentGalaxy.armDensity,
      currentGalaxy.color
    );

    stateRef.current.galaxies[0] = newGalaxy;
    stateRef.current.totalStarCount =
      newGalaxy.stars.length + stateRef.current.galaxies[1].stars.length;
    setGalaxyA(newGalaxy);
    setTotalStars(stateRef.current.totalStarCount);
  }, []);

  const handleGalaxyBChange = useCallback((updates: Partial<typeof galaxyB>) => {
    const currentGalaxy = stateRef.current.galaxies[1];
    const newGalaxy = createGalaxy(
      currentGalaxy.id,
      currentGalaxy.centerX,
      currentGalaxy.centerY,
      updates.vx !== undefined ? updates.vx : currentGalaxy.vx,
      updates.vy !== undefined ? updates.vy : currentGalaxy.vy,
      updates.starCount !== undefined ? updates.starCount : currentGalaxy.starCount,
      updates.armDensity !== undefined ? updates.armDensity : currentGalaxy.armDensity,
      currentGalaxy.color
    );

    stateRef.current.galaxies[1] = newGalaxy;
    stateRef.current.totalStarCount =
      stateRef.current.galaxies[0].stars.length + newGalaxy.stars.length;
    setGalaxyB(newGalaxy);
    setTotalStars(stateRef.current.totalStarCount);
  }, []);

  const handleReset = useCallback(() => {
    stateRef.current = createInitialState();
    setGalaxyA(stateRef.current.galaxies[0]);
    setGalaxyB(stateRef.current.galaxies[1]);
    setCurrentFrame(0);
    setTotalStars(stateRef.current.totalStarCount);
    setIsPaused(false);
    isPausedRef.current = false;
  }, []);

  const handleTogglePause = useCallback(() => {
    setIsPaused(prev => {
      const newVal = !prev;
      isPausedRef.current = newVal;
      return newVal;
    });
  }, []);

  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      for (const galaxy of stateRef.current.galaxies) {
        const dx = x - galaxy.centerX;
        const dy = y - galaxy.centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 100) {
          draggedGalaxyIdRef.current = galaxy.id;
          dragPositionRef.current = { x, y };
          break;
        }
      }
    },
    []
  );

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!draggedGalaxyIdRef.current || !canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      dragPositionRef.current = { x, y };
    },
    []
  );

  const handleCanvasMouseUp = useCallback(() => {
    if (draggedGalaxyIdRef.current) {
      const galaxy = stateRef.current.galaxies.find(
        g => g.id === draggedGalaxyIdRef.current
      );
      if (galaxy) {
        if (galaxy.id === 'galaxy-a') {
          setGalaxyA({ ...galaxy });
        } else {
          setGalaxyB({ ...galaxy });
        }
      }
    }

    draggedGalaxyIdRef.current = null;
    dragPositionRef.current = null;
  }, []);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#0B0C10'
      }}
    >
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <UIPanel
          galaxyA={galaxyA}
          galaxyB={galaxyB}
          onGalaxyAChange={handleGalaxyAChange}
          onGalaxyBChange={handleGalaxyBChange}
          onReset={handleReset}
          isPaused={isPaused}
          onTogglePause={handleTogglePause}
        />

        <div
          style={{
            flex: 1,
            position: 'relative',
            minWidth: 0,
            minHeight: '600px'
          }}
        >
          <canvas
            ref={canvasRef}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
            style={{
              width: '100%',
              height: '100%',
              cursor: draggedGalaxyIdRef.current ? 'grabbing' : 'grab'
            }}
          />

          <div
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              padding: '10px 16px',
              backgroundColor: 'rgba(13, 17, 23, 0.9)',
              borderRadius: '6px',
              border: '1px solid #21262D',
              color: '#E0E0E0',
              fontSize: '12px',
              fontFamily: 'monospace'
            }}
          >
            <div style={{ marginBottom: '4px' }}>
              FPS: <span style={{ color: fps >= 45 ? '#00E676' : '#FF6F00' }}>{fps}</span>
            </div>
            <div>
              恒星总数: <span style={{ color: '#64B5F6' }}>{totalStars}</span>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          height: '200px',
          backgroundColor: '#161B22',
          borderTop: '1px solid #21262D',
          borderRadius: '8px 8px 0 0',
          padding: '16px',
          display: 'flex',
          gap: '20px',
          alignItems: 'center'
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <button
            onClick={handleTogglePause}
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              backgroundColor: '#00ACC1',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              fontSize: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease-out',
              boxShadow: '0 0 15px rgba(0, 172, 193, 0.4)'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = '#00897B';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = '#00ACC1';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {isPaused ? '▶' : '⏸'}
          </button>
          <div style={{ color: '#888', fontSize: '11px', textAlign: 'center' }}>
            {isPaused ? '继续' : '暂停'}
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: '#888', fontSize: '12px', width: '80px' }}>
              帧数: {currentFrame}
            </span>
            <div
              style={{
                flex: 1,
                height: '6px',
                backgroundColor: '#1F2833',
                borderRadius: '3px',
                position: 'relative',
                cursor: 'pointer'
              }}
            >
              <div
                style={{
                  width: `${Math.min(100, (currentFrame / 1000) * 100)}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #00ACC1, #00E676)',
                  borderRadius: '3px',
                  transition: 'width 0.1s ease'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '20px' }}>
            <div>
              <div style={{ color: '#888', fontSize: '11px', marginBottom: '4px' }}>
                星系 A 恒星数
              </div>
              <div style={{ color: '#64B5F6', fontSize: '18px', fontWeight: 600 }}>
                {galaxyA.stars.length}
              </div>
            </div>
            <div>
              <div style={{ color: '#888', fontSize: '11px', marginBottom: '4px' }}>
                星系 B 恒星数
              </div>
              <div style={{ color: '#F06292', fontSize: '18px', fontWeight: 600 }}>
                {galaxyB.stars.length}
              </div>
            </div>
            <div>
              <div style={{ color: '#888', fontSize: '11px', marginBottom: '4px' }}>
                碰撞状态
              </div>
              <div
                style={{
                  color: stateRef.current.isColliding ? '#FF6F00' : '#00E676',
                  fontSize: '14px',
                  fontWeight: 500
                }}
              >
                {stateRef.current.isColliding ? '⚡ 碰撞中' : '○ 未碰撞'}
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#1A1A2E',
            borderRadius: '8px',
            padding: '12px',
            border: '1px solid #2A2A4E'
          }}
        >
          <div style={{ color: '#888', fontSize: '11px', marginBottom: '8px' }}>
            恒星数量变化
          </div>
          <canvas ref={chartCanvasRef} style={{ display: 'block' }} />
        </div>
      </div>
    </div>
  );
};

export default App;
