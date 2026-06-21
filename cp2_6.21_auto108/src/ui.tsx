import React, { useRef, useEffect, useState, useCallback } from 'react';
import { calcRefraction, getPrismAtPoint, getRecommendedPath } from './core';
import { useGameStore, CANVAS_WIDTH, CANVAS_HEIGHT } from './data';
import type { Point, Prism, LightSegment, Crystal } from './core';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
  size: number;
}

const COLORS = {
  red: '#FF4500',
  green: '#32CD32',
  blue: '#1E90FF',
};

const Game: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const [canvasSize, setCanvasSize] = useState({ width: CANVAS_WIDTH, height: CANVAS_HEIGHT });
  const [draggingPrism, setDraggingPrism] = useState<Prism | null>(null);
  const [dragStartAngle, setDragStartAngle] = useState<number>(0);
  const [hintAlpha, setHintAlpha] = useState<number>(0);

  const {
    prisms,
    crystals,
    obstacles,
    lightSource,
    score,
    currentLevel,
    isVictory,
    isTransitioning,
    transitionAlpha,
    showHint,
    playerProgress,
    levels,
    setPrismRotation,
    updateCrystalStates,
    loadLevel,
    resetLevel,
    nextLevel,
    toggleHint,
    updateTransition,
    setOnCrystalLit,
  } = useGameStore();

  const litCrystalsCount = crystals.filter(c => c.isLit).length;
  const totalCrystals = crystals.length;

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setCanvasSize({
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
        });
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const spawnVictoryParticles = (crystalId: string) => {
      const crystal = crystals.find(c => c.id === crystalId);
      if (!crystal) return;
      const color = COLORS[crystal.color];
      for (let i = 0; i < 10; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 2;
        particlesRef.current.push({
          x: crystal.position.x,
          y: crystal.position.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color,
          life: 60,
          maxLife: 60,
          size: 2 + Math.random() * 2,
        });
      }
    };
    setOnCrystalLit(spawnVictoryParticles);
    return () => setOnCrystalLit(null);
  }, [crystals, setOnCrystalLit]);

  useEffect(() => {
    if (isVictory) {
      crystals.forEach(crystal => {
        if (crystal.isLit) {
          const color = COLORS[crystal.color];
          for (let i = 0; i < 50; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 3;
            particlesRef.current.push({
              x: crystal.position.x,
              y: crystal.position.y,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              color,
              life: 120,
              maxLife: 120,
              size: 2 + Math.random() * 2,
            });
          }
        }
      });
    }
  }, [isVictory, crystals]);

  const updateParticles = useCallback(() => {
    particlesRef.current = particlesRef.current.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05;
      p.life--;
      return p.life > 0;
    });
  }, []);

  const getCanvasPoint = (e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isVictory || isTransitioning) return;
    const point = getCanvasPoint(e);
    const prism = getPrismAtPoint(prisms, point, 30);
    if (prism) {
      setDraggingPrism(prism);
      const dx = point.x - prism.position.x;
      const dy = point.y - prism.position.y;
      setDragStartAngle(Math.atan2(dy, dx) - prism.rotation);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggingPrism) return;
    const point = getCanvasPoint(e);
    const dx = point.x - draggingPrism.position.x;
    const dy = point.y - draggingPrism.position.y;
    const newRotation = Math.atan2(dy, dx) - dragStartAngle;
    setPrismRotation(draggingPrism.id, newRotation);
  };

  const handleMouseUp = () => {
    setDraggingPrism(null);
  };

  const handleMouseLeave = () => {
    setDraggingPrism(null);
  };

  const drawBackground = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);
  };

  const drawLightSource = (ctx: CanvasRenderingContext2D) => {
    const { position } = lightSource;
    const gradient = ctx.createRadialGradient(
      position.x, position.y, 0,
      position.x, position.y, 30
    );
    gradient.addColorStop(0, 'rgba(255, 215, 0, 0.8)');
    gradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(position.x, position.y, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(position.x, position.y, 10, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawPrism = (ctx: CanvasRenderingContext2D, prism: Prism) => {
    const { position, rotation, size } = prism;
    ctx.save();
    ctx.translate(position.x, position.y);
    ctx.rotate(rotation);
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2) / 3 - Math.PI / 2;
      const x = Math.cos(angle) * size;
      const y = Math.sin(angle) * size;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(135, 206, 235, 0.5)';
    ctx.fill();
    ctx.strokeStyle = '#4682B4';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  };

  const drawCrystal = (ctx: CanvasRenderingContext2D, crystal: Crystal, time: number) => {
    const { position, color, isLit, litTime, requiredTime } = crystal;
    const size = 12;
    const fillColor = isLit ? COLORS[color] : '#555555';
    const alpha = isLit ? 0.3 + 0.7 * Math.abs(Math.sin(time * 0.004)) : 1;
    const progress = Math.min(litTime / requiredTime, 1);

    if (isLit) {
      const glowSize = size * (1.5 + 0.3 * Math.sin(time * 0.004));
      const gradient = ctx.createRadialGradient(
        position.x, position.y, 0,
        position.x, position.y, glowSize
      );
      gradient.addColorStop(0, `${COLORS[color]}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`);
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(position.x, position.y, glowSize, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.save();
    ctx.translate(position.x, position.y);
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const x = Math.cos(angle) * size;
      const y = Math.sin(angle) * size;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.globalAlpha = alpha;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = isLit ? COLORS[color] : '#777777';
    ctx.lineWidth = 2;
    ctx.stroke();
    if (!isLit && progress > 0) {
      ctx.beginPath();
      ctx.arc(0, 0, size + 5, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
      ctx.strokeStyle = COLORS[color];
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    ctx.restore();
  };

  const drawObstacle = (ctx: CanvasRenderingContext2D, obstacle: { position: Point; width: number; height: number; rotation: number }) => {
    const { position, width, height, rotation } = obstacle;
    ctx.save();
    ctx.translate(position.x, position.y);
    ctx.rotate(rotation);
    ctx.fillStyle = 'rgba(136, 136, 136, 0.6)';
    ctx.fillRect(-width / 2, -height / 2, width, height);
    ctx.strokeStyle = '#AAAAAA';
    ctx.lineWidth = 1;
    ctx.strokeRect(-width / 2, -height / 2, width, height);
    ctx.restore();
  };

  const drawLightSegment = (ctx: CanvasRenderingContext2D, segment: LightSegment) => {
    const { start, end, color, intensity } = segment;
    const alpha = Math.max(0.3, intensity);
    ctx.strokeStyle = color;
    ctx.globalAlpha = alpha * 0.3;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    ctx.globalAlpha = alpha;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    ctx.globalAlpha = 1;
  };

  const drawHintPath = (ctx: CanvasRenderingContext2D, _time: number) => {
    if (!showHint || hintAlpha <= 0) return;
    const recommended = getRecommendedPath({ prisms, lightSource, crystals });
    recommended.forEach(rec => {
      const prism = prisms.find(p => p.id === rec.prismId);
      if (!prism) return;
      ctx.save();
      ctx.globalAlpha = hintAlpha * 0.5;
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      const targetCrystal = crystals[0];
      if (targetCrystal) {
        ctx.beginPath();
        ctx.moveTo(prism.position.x, prism.position.y);
        ctx.lineTo(targetCrystal.position.x, targetCrystal.position.y);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.restore();
    });
  };

  const drawParticles = (ctx: CanvasRenderingContext2D) => {
    particlesRef.current.forEach(p => {
      const alpha = p.life / p.maxLife;
      ctx.fillStyle = p.color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  };

  const drawTransition = (ctx: CanvasRenderingContext2D) => {
    if (!isTransitioning && transitionAlpha <= 0) return;
    ctx.fillStyle = `rgba(26, 26, 46, ${transitionAlpha})`;
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let segments: LightSegment[] = [];
    let lastCalcTime = 0;
    let lastParticleUpdateTime = 0;
    let lastParticleDrawTime = 0;

    const gameLoop = (currentTime: number) => {
      const deltaTime = currentTime - lastTimeRef.current;
      lastTimeRef.current = currentTime;

      const particleCount = particlesRef.current.length;
      const particleThreshold = 500;
      const particleUpdateInterval = particleCount > particleThreshold ? 33 : 16;
      const particleDrawInterval = particleCount > particleThreshold ? 33 : 16;

      if (currentTime - lastCalcTime > 16) {
        const startTime = performance.now();
        const result = calcRefraction(
          prisms,
          lightSource,
          obstacles,
          crystals,
          canvasSize.width,
          canvasSize.height
        );
        segments = result.segments;
        updateCrystalStates(result.hitCrystals, deltaTime);
        const calcTime = performance.now() - startTime;
        if (calcTime > 2) {
          console.warn(`Light calculation took ${calcTime.toFixed(2)}ms, target is < 2ms`);
        }
        lastCalcTime = currentTime;
      }

      if (showHint && hintAlpha < 1) {
        setHintAlpha(Math.min(1, hintAlpha + deltaTime / 300));
      } else if (!showHint && hintAlpha > 0) {
        setHintAlpha(Math.max(0, hintAlpha - deltaTime / 300));
      }

      updateTransition(deltaTime);

      if (currentTime - lastParticleUpdateTime >= particleUpdateInterval) {
        updateParticles();
        lastParticleUpdateTime = currentTime;
      }

      drawBackground(ctx);
      segments.forEach(s => drawLightSegment(ctx, s));
      obstacles.forEach(o => drawObstacle(ctx, o));
      crystals.forEach(c => drawCrystal(ctx, c, currentTime));
      prisms.forEach(p => drawPrism(ctx, p));
      drawLightSource(ctx);
      drawHintPath(ctx, currentTime);

      if (particleCount <= particleThreshold || currentTime - lastParticleDrawTime >= particleDrawInterval) {
        drawParticles(ctx);
        lastParticleDrawTime = currentTime;
      }

      drawTransition(ctx);

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [prisms, obstacles, crystals, lightSource, canvasSize, showHint, hintAlpha, isTransitioning, transitionAlpha, updateCrystalStates, updateTransition, updateParticles]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      backgroundColor: '#1a1a2e',
      color: '#ffffff',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '16px',
        fontSize: '18px',
        fontWeight: 600,
        gap: '40px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
      }}>
        <span>得分: <span style={{ color: '#FFD700' }}>{score}</span></span>
        <span>水晶: <span style={{ color: '#32CD32' }}>{litCrystalsCount}/{totalCrystals}</span></span>
        <span>关卡: <span style={{ color: '#87CEEB' }}>第 {currentLevel} 关</span></span>
      </div>

      <div style={{
        display: 'flex',
        flex: 1,
        overflow: 'hidden',
      }}>
        <div ref={containerRef} style={{
          width: '70%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}>
          <canvas
            ref={canvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              cursor: draggingPrism ? 'grabbing' : 'grab',
            }}
          />
        </div>

        <div style={{
          width: '30%',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}>
          <div style={{
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(8px)',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}>
            <h2 style={{ margin: 0, fontSize: '20px', color: '#FFD700' }}>
              光影捕手
            </h2>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#AAAAAA' }}>
                选择关卡
              </label>
              <select
                value={currentLevel}
                onChange={(e) => loadLevel(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                {levels.map(level => (
                  <option
                    key={level.id}
                    value={level.id}
                    disabled={!playerProgress.unlockedLevels.includes(level.id)}
                  >
                    第 {level.id} 关 - {level.name}
                    {playerProgress.bestScores[level.id] ? ` (最高: ${playerProgress.bestScores[level.id]}分)` : ''}
                    {!playerProgress.unlockedLevels.includes(level.id) ? ' 🔒' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={toggleHint}
                style={{
                  padding: '12px',
                  backgroundColor: showHint ? 'rgba(255, 215, 0, 0.3)' : 'rgba(135, 206, 235, 0.2)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(135, 206, 235, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = showHint ? 'rgba(255, 215, 0, 0.3)' : 'rgba(135, 206, 235, 0.2)';
                }}
              >
                {showHint ? '隐藏提示' : '显示提示'} 💡
              </button>

              <button
                onClick={resetLevel}
                style={{
                  padding: '12px',
                  backgroundColor: 'rgba(255, 69, 0, 0.2)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 69, 0, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 69, 0, 0.2)';
                }}
              >
                重置关卡 🔄
              </button>

              {isVictory && currentLevel < levels.length && (
                <button
                  onClick={nextLevel}
                  style={{
                    padding: '12px',
                    backgroundColor: 'rgba(50, 205, 50, 0.3)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    animation: 'pulse 1s infinite',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(50, 205, 50, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(50, 205, 50, 0.3)';
                  }}
                >
                  下一关 →
                </button>
              )}
            </div>

            <div style={{
              paddingTop: '16px',
              borderTop: '1px solid rgba(255,255,255,0.1)',
            }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#AAAAAA' }}>
                游戏说明
              </h3>
              <ul style={{
                margin: 0,
                paddingLeft: '20px',
                fontSize: '13px',
                color: '#888888',
                lineHeight: 1.8,
              }}>
                <li>拖拽三棱镜来旋转角度</li>
                <li>让光线折射后点亮所有水晶</li>
                <li>每种颜色的水晶需要对应颜色的光线</li>
                <li>经过障碍物的光线强度会衰减</li>
              </ul>
            </div>

            <div style={{
              paddingTop: '16px',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              fontSize: '12px',
              color: '#666666',
            }}>
              总分: {playerProgress.totalScore} 分
            </div>
          </div>
        </div>
      </div>

      {isVictory && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '35%',
          transform: 'translate(-50%, -50%)',
          padding: '40px 60px',
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          backdropFilter: 'blur(12px)',
          borderRadius: '16px',
          textAlign: 'center',
          animation: 'fadeIn 0.5s ease',
          zIndex: 100,
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '36px',
            background: 'linear-gradient(90deg, #FF4500, #32CD32, #1E90FF)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            🎉 关卡完成！
          </h2>
          <p style={{ margin: '16px 0 0 0', fontSize: '18px', color: '#FFD700' }}>
            得分: {score}
          </p>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
          to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(50, 205, 50, 0.4); }
          50% { box-shadow: 0 0 20px 5px rgba(50, 205, 50, 0.2); }
        }
      `}</style>
    </div>
  );
};

export default Game;
