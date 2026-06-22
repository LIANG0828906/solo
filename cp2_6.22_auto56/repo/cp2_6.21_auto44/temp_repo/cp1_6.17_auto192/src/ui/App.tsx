import { useEffect, useRef, useState, useCallback } from 'react';
import { particleEmitter } from '../game/ParticleEmitter';
import { collisionFusion } from '../game/CollisionFusion';
import { scoreJudge } from '../game/ScoreJudge';
import { eventBus } from '../game/EventBus';
import { useGameStore } from '../store/useGameStore';
import type { Particle } from '../game/types';
import { rgbToString, MAX_PARTICLES_LOD, LOD_DISTANCE, COLOR_PALETTE, hexToRgb } from '../game/types';

const START_RADIUS = 50;

function lerpColor(progress: number): string {
  const c1 = hexToRgb('#FF6B6B');
  const c2 = hexToRgb('#4ECDC4');
  const r = Math.round(c1.r + (c2.r - c1.r) * progress);
  const g = Math.round(c1.g + (c2.g - c1.g) * progress);
  const b = Math.round(c1.b + (c2.b - c1.b) * progress);
  return `rgb(${r}, ${g}, ${b})`;
}

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const lastMouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastFrameRef = useRef<number>(0);
  const animFrameRef = useRef<number>(0);
  const timerRef = useRef<number>(0);
  const winAnimRef = useRef<{ phase: number; startTime: number } | null>(null);
  const explosionParticlesRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; color: string; radius: number; alpha: number }>>([]);

  const {
    score,
    fusionCount,
    progress,
    targetRadius,
    timeLeft,
    isGameOver,
    isWin,
    showHint,
    mouseX,
    mouseY,
    isMouseDown,
    isHighlighting,
    setMousePos,
    setMouseDown,
    setHighlighting,
    hideHint,
    decrementTime,
    resetGame,
  } = useGameStore();

  const [hintOpacity, setHintOpacity] = useState(0);
  const [hintVisible, setHintVisible] = useState(true);

  useEffect(() => {
    const t1 = setTimeout(() => setHintOpacity(1), 100);
    const t2 = setTimeout(() => setHintOpacity(0), 3100);
    const t3 = setTimeout(() => setHintVisible(false), 4100);
    const t4 = setTimeout(() => hideHint(), 4200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [hideHint]);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.scale(dpr, dpr);
    particleEmitter.setCanvasSize(window.innerWidth, window.innerHeight);
  }, []);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [resizeCanvas]);

  useEffect(() => {
    const off = eventBus.on('particleUpdated', (particles) => {
      particlesRef.current = particles;
    });
    return off;
  }, []);

  useEffect(() => {
    if (isGameOver || isWin) {
      clearInterval(timerRef.current);
    }
  }, [isGameOver, isWin]);

  const startTimer = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      decrementTime();
    }, 1000);
  }, [decrementTime]);

  useEffect(() => {
    startTimer();
    return () => clearInterval(timerRef.current);
  }, [startTimer]);

  const getCanvasPos = (clientX: number, clientY: number) => {
    return { x: clientX, y: clientY };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isGameOver) return;
    const pos = getCanvasPos(e.clientX, e.clientY);
    setMouseDown(true);
    setHighlighting(true);
    lastMouseRef.current = pos;
    setMousePos(pos.x, pos.y);
    setTimeout(() => setHighlighting(false), 300);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const pos = getCanvasPos(e.clientX, e.clientY);
    setMousePos(pos.x, pos.y);

    if (isMouseDown && !isGameOver) {
      const dx = pos.x - lastMouseRef.current.x;
      const dy = pos.y - lastMouseRef.current.y;
      particleEmitter.emit(pos.x, pos.y, dx, dy);
      lastMouseRef.current = pos;
    }
  };

  const handleMouseUp = () => {
    setMouseDown(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isGameOver) return;
    e.preventDefault();
    const touch = e.touches[0];
    const pos = getCanvasPos(touch.clientX, touch.clientY);
    setMouseDown(true);
    setHighlighting(true);
    lastMouseRef.current = pos;
    setMousePos(pos.x, pos.y);
    setTimeout(() => setHighlighting(false), 300);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    const pos = getCanvasPos(touch.clientX, touch.clientY);
    setMousePos(pos.x, pos.y);

    if (isMouseDown && !isGameOver) {
      const dx = pos.x - lastMouseRef.current.x;
      const dy = pos.y - lastMouseRef.current.y;
      particleEmitter.emit(pos.x, pos.y, dx, dy);
      lastMouseRef.current = pos;
    }
  };

  const handleTouchEnd = () => {
    setMouseDown(false);
  };

  const triggerWinAnimation = useCallback(() => {
    if (winAnimRef.current) return;
    winAnimRef.current = { phase: 0, startTime: performance.now() };
    const particles = particlesRef.current;
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    explosionParticlesRef.current = particles.map((p) => ({
      x: p.x,
      y: p.y,
      vx: (cx - p.x) * 0.02,
      vy: (cy - p.y) * 0.02,
      color: rgbToString(p.color),
      radius: p.radius,
      alpha: 1,
    }));
  }, []);

  useEffect(() => {
    if (isWin) {
      triggerWinAnimation();
    }
  }, [isWin, triggerWinAnimation]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = (now: number) => {
      const deltaTime = Math.min(now - lastFrameRef.current, 50);
      lastFrameRef.current = now;

      const width = window.innerWidth;
      const height = window.innerHeight;

      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, '#0B0C10');
      gradient.addColorStop(1, '#1F2833');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      if (!isGameOver || isWin) {
        particleEmitter.update(deltaTime);
        collisionFusion;
      }

      const particles = particlesRef.current;
      const useLOD = particles.length > MAX_PARTICLES_LOD;

      if (winAnimRef.current) {
        const elapsed = now - winAnimRef.current.startTime;
        const expl = explosionParticlesRef.current;
        const cx = width / 2;
        const cy = height / 2;

        if (elapsed < 800) {
          const t = elapsed / 800;
          expl.forEach((p) => {
            p.x += p.vx * (1 + t * 5);
            p.y += p.vy * (1 + t * 5);
          });
          expl.forEach((p) => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.alpha * (1 - t * 0.3);
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 20;
            ctx.fill();
            ctx.shadowBlur = 0;
          });
          ctx.globalAlpha = 1;
        } else if (elapsed < 2000) {
          const t = (elapsed - 800) / 1200;
          const count = 80;
          if (explosionParticlesRef.current.length < count) {
            for (let i = explosionParticlesRef.current.length; i < count; i++) {
              const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
              const speed = 3 + Math.random() * 6;
              const color = COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)];
              explosionParticlesRef.current.push({
                x: cx,
                y: cy,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color,
                radius: 3 + Math.random() * 4,
                alpha: 1,
              });
            }
          }
          expl.forEach((p) => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.3;
            p.alpha = Math.max(0, 1 - t);
          });
          expl.forEach((p) => {
            if (p.alpha <= 0) return;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.alpha;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 15;
            ctx.fill();
            ctx.shadowBlur = 0;
          });
          ctx.globalAlpha = 1;
        }
      } else {
        particles.forEach((p) => {
          const age = now - p.createdAt;
          const lifeLeft = p.lifespan - age;
          let alpha = 1;

          if (lifeLeft < 1000) {
            if (lifeLeft <= 0) return;
            alpha = lifeLeft / 1000;
            const blinkCycle = Math.floor(age / 200) % 2;
            alpha = blinkCycle === 0 ? 1.0 : 0.3;
            alpha *= lifeLeft / 1000;
          }

          let distance = 0;
          if (useLOD) {
            const dx = p.x - mouseX;
            const dy = p.y - mouseY;
            distance = Math.sqrt(dx * dx + dy * dy);
          }

          const shouldReduceLOD = useLOD && distance > LOD_DISTANCE;
          const colorStr = rgbToString(p.color, alpha);

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);

          if (!shouldReduceLOD) {
            ctx.shadowColor = colorStr;
            ctx.shadowBlur = Math.min(30, p.radius * 2.5);
          }

          ctx.fillStyle = colorStr;
          ctx.globalAlpha = alpha;
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 1;

          ctx.beginPath();
          ctx.arc(p.x - p.radius * 0.3, p.y - p.radius * 0.3, p.radius * 0.25, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.4})`;
          ctx.fill();
        });
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isGameOver, isWin, mouseX, mouseY]);

  const handleRestart = () => {
    particleEmitter.clear();
    scoreJudge.reset();
    winAnimRef.current = null;
    explosionParticlesRef.current = [];
    resetGame();
    startTimer();
  };

  const crosshairSize = 40;
  const pulseScale = 1 + Math.sin(performance.now() / 500) * 0.1;
  const crosshairColor = isHighlighting ? '#FFFFFF66' : '#FFFFFF33';

  const timeWarning = timeLeft <= 10;
  const timeBlinkOpacity = timeWarning ? (Math.floor(performance.now() / 500) % 2 === 0 ? 1 : 0.5) : 1;

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        cursor: 'none',
        userSelect: 'none',
        touchAction: 'none',
      }}
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ display: 'block' }}
      />

      <svg
        style={{
          position: 'absolute',
          left: mouseX - (crosshairSize * pulseScale) / 2,
          top: mouseY - (crosshairSize * pulseScale) / 2,
          width: crosshairSize * pulseScale,
          height: crosshairSize * pulseScale,
          pointerEvents: 'none',
          transition: 'color 0.2s',
        }}
      >
        <circle
          cx={(crosshairSize * pulseScale) / 2}
          cy={(crosshairSize * pulseScale) / 2}
          r={(crosshairSize * pulseScale) / 2 - 2}
          fill="none"
          stroke={crosshairColor}
          strokeWidth="1.5"
        />
        <line
          x1={(crosshairSize * pulseScale) / 2 - 8}
          y1={(crosshairSize * pulseScale) / 2}
          x2={(crosshairSize * pulseScale) / 2 + 8}
          y2={(crosshairSize * pulseScale) / 2}
          stroke={crosshairColor}
          strokeWidth="1.5"
        />
        <line
          x1={(crosshairSize * pulseScale) / 2}
          y1={(crosshairSize * pulseScale) / 2 - 8}
          x2={(crosshairSize * pulseScale) / 2}
          y2={(crosshairSize * pulseScale) / 2 + 8}
          stroke={crosshairColor}
          strokeWidth="1.5"
        />
      </svg>

      <div
        style={{
          position: 'absolute',
          top: isMobile ? 12 : 24,
          left: isMobile ? 12 : 24,
          color: '#FFFFFF',
          fontSize: 24,
          fontWeight: 'bold',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          textShadow: '0 0 10px rgba(255,255,255,0.5), 0 0 20px rgba(78,205,196,0.3)',
          pointerEvents: 'none',
          display: 'flex',
          flexDirection: isMobile ? 'row' : 'column',
          gap: isMobile ? 16 : 4,
        }}
      >
        <div>分数: {score}</div>
        <div style={{ fontSize: 16, opacity: 0.85 }}>融合: {fusionCount} 次</div>
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: isMobile ? 80 : 40,
          left: '50%',
          transform: 'translateX(-50%)',
          width: Math.min(600, window.innerWidth - 48),
          height: 8,
          backgroundColor: '#2A2A3E',
          borderRadius: 4,
          overflow: 'hidden',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            width: `${progress * 100}%`,
            height: '100%',
            background: `linear-gradient(90deg, #FF6B6B, ${lerpColor(progress)}, #4ECDC4)`,
            borderRadius: 4,
            transition: 'width 0.2s ease-out',
            boxShadow: `0 0 10px ${lerpColor(progress)}`,
          }}
        />
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: isMobile ? 100 : 56,
          left: '50%',
          transform: 'translateX(-50%)',
          color: '#C5C6C7',
          fontSize: 12,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          pointerEvents: 'none',
          opacity: 0.8,
        }}
      >
        目标半径: {targetRadius} | 当前最大: {Math.round(useGameStore.getState().maxRadius || scoreJudge.getMaxRadius())}
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: isMobile ? 12 : 24,
          right: isMobile ? 12 : 24,
          color: timeWarning ? '#FF6B6B' : '#FFFFFF',
          fontSize: isMobile ? 28 : 32,
          fontWeight: 'bold',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          textShadow: timeWarning
            ? '0 0 15px rgba(255,107,107,0.8), 0 0 30px rgba(255,107,107,0.4)'
            : '0 0 10px rgba(255,255,255,0.4)',
          opacity: timeBlinkOpacity,
          pointerEvents: 'none',
        }}
      >
        {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
      </div>

      {hintVisible && showHint && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#C5C6C7',
            fontSize: 18,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            opacity: hintOpacity,
            transition: 'opacity 1s ease-in-out',
            pointerEvents: 'none',
            textAlign: 'center',
            textShadow: '0 0 20px rgba(197,198,199,0.3)',
          }}
        >
          点击并拖动发射粒子
        </div>
      )}

      {isGameOver && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(11, 12, 16, 0.85)',
            backdropFilter: 'blur(4px)',
            cursor: 'default',
          }}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(31,40,51,0.95), rgba(11,12,16,0.95))',
              border: `2px solid ${isWin ? '#4ECDC4' : '#FF6B6B'}`,
              borderRadius: 16,
              padding: isMobile ? 32 : 48,
              textAlign: 'center',
              boxShadow: isWin
                ? '0 0 60px rgba(78,205,196,0.4), inset 0 0 60px rgba(78,205,196,0.05)'
                : '0 0 60px rgba(255,107,107,0.3), inset 0 0 60px rgba(255,107,107,0.05)',
              maxWidth: isMobile ? '90vw' : 420,
            }}
          >
            <div
              style={{
                fontSize: isMobile ? 32 : 42,
                fontWeight: 'bold',
                marginBottom: 16,
                fontFamily: 'system-ui, -apple-system, sans-serif',
                color: isWin ? '#4ECDC4' : '#FF6B6B',
                textShadow: isWin
                  ? '0 0 20px rgba(78,205,196,0.6)'
                  : '0 0 20px rgba(255,107,107,0.6)',
              }}
            >
              {isWin ? '🎉 通关成功！' : '⏰ 时间到！'}
            </div>
            <div style={{ color: '#C5C6C7', fontSize: 16, marginBottom: 8, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              最终得分
            </div>
            <div
              style={{
                fontSize: isMobile ? 40 : 56,
                fontWeight: 'bold',
                color: '#FFFFFF',
                marginBottom: 8,
                fontFamily: 'system-ui, -apple-system, sans-serif',
                textShadow: '0 0 20px rgba(255,255,255,0.4)',
              }}
            >
              {score}
            </div>
            <div style={{ color: '#888', fontSize: 14, marginBottom: 32, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              共融合 {fusionCount} 次
            </div>
            <button
              onClick={handleRestart}
              style={{
                background: isWin
                  ? 'linear-gradient(135deg, #4ECDC4, #45B7D1)'
                  : 'linear-gradient(135deg, #FF6B6B, #FF8C42)',
                border: 'none',
                color: '#FFFFFF',
                fontSize: 18,
                fontWeight: 'bold',
                padding: '14px 48px',
                borderRadius: 10,
                cursor: 'pointer',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                boxShadow: isWin
                  ? '0 0 20px rgba(78,205,196,0.5)'
                  : '0 0 20px rgba(255,107,107,0.5)',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              再来一局
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
