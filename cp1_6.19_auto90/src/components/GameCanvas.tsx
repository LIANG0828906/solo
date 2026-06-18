import { useEffect, useRef, useCallback } from 'react';
import { useGameLoop } from '../hooks/useGameLoop';
import { GameState, Debris, Particle } from '../utils/spaceDebrisData';

function drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const gradient = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.7);
  gradient.addColorStop(0, '#0B0C10');
  gradient.addColorStop(1, '#1F2833');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);
}

function drawStars(ctx: CanvasRenderingContext2D, state: GameState) {
  for (const star of state.stars) {
    const alpha = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(star.phase));
    ctx.globalAlpha = alpha * star.baseAlpha;
    ctx.fillStyle = '#C5C6C7';
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawDebris(ctx: CanvasRenderingContext2D, d: Debris) {
  if (d.type === 'recyclable') {
    const gradient = ctx.createLinearGradient(d.x - d.size / 2, d.y - d.size / 2, d.x + d.size / 2, d.y + d.size / 2);
    gradient.addColorStop(0, '#6B6E70');
    gradient.addColorStop(1, '#45A29E');
    ctx.fillStyle = gradient;
    ctx.fillRect(d.x - d.size / 2, d.y - d.size / 2, d.size, d.size);
    ctx.strokeStyle = 'rgba(102, 252, 241, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(d.x - d.size / 2, d.y - d.size / 2, d.size, d.size);
  } else {
    const gradient = ctx.createLinearGradient(d.x - d.size / 2, d.y - d.size / 2, d.x + d.size / 2, d.y + d.size / 2);
    gradient.addColorStop(0, '#FF4C4C');
    gradient.addColorStop(1, '#C3073F');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(d.x, d.y - d.size / 2);
    ctx.lineTo(d.x + d.size / 2, d.y + d.size / 2);
    ctx.lineTo(d.x - d.size / 2, d.y + d.size / 2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 76, 76, 0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function drawHalo(ctx: CanvasRenderingContext2D, d: Debris) {
  const numDots = 12;
  const radius = d.size + 8;
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < numDots; i++) {
    const angle = d.haloAngle + (i * Math.PI * 2) / numDots;
    const hx = d.x + Math.cos(angle) * radius;
    const hy = d.y + Math.sin(angle) * radius;
    ctx.globalAlpha = 0.6 + 0.4 * Math.sin(angle * 2);
    ctx.beginPath();
    ctx.arc(hx, hy, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawRecyclingBay(ctx: CanvasRenderingContext2D, state: GameState) {
  const p = state.player;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.angle);

  const flickerAlpha = 0.3 + 0.2 * Math.sin(state.time * 8);
  ctx.fillStyle = 'rgba(69, 162, 158, 0.2)';
  ctx.fillRect(-38, -15, 50, 30);
  ctx.strokeStyle = `rgba(69, 162, 158, ${flickerAlpha})`;
  ctx.lineWidth = 2;
  ctx.strokeRect(-38, -15, 50, 30);

  ctx.restore();
}

function drawTractorBeam(ctx: CanvasRenderingContext2D, state: GameState) {
  if (!state.isTractoring || state.tractoredDebrisId === null) return;
  const d = state.debris.find(dd => dd.id === state.tractoredDebrisId);
  if (!d) return;

  const p = state.player;
  const headX = p.x + Math.cos(p.angle) * 18;
  const headY = p.y + Math.sin(p.angle) * 18;

  ctx.strokeStyle = 'rgba(102, 252, 241, 0.6)';
  ctx.lineWidth = 4;
  ctx.shadowColor = '#66FCF1';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.moveTo(headX, headY);
  ctx.lineTo(d.x, d.y);
  ctx.stroke();
  ctx.shadowBlur = 0;
}

function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  for (const p of particles) {
    if (!p.active) continue;
    const lifeRatio = p.life / p.maxLife;
    const alpha = lifeRatio * 0.8;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = `rgb(${p.r},${p.g},${p.b})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * lifeRatio, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawPlayer(ctx: CanvasRenderingContext2D, state: GameState) {
  const p = state.player;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.angle);

  ctx.beginPath();
  ctx.moveTo(20, 0);
  ctx.lineTo(-13, -13);
  ctx.lineTo(-7, 0);
  ctx.lineTo(-13, 13);
  ctx.closePath();

  ctx.fillStyle = '#C5C6C7';
  ctx.fill();
  ctx.strokeStyle = 'rgba(102, 252, 241, 0.5)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.shadowColor = '#66FCF1';
  ctx.shadowBlur = 6;
  ctx.strokeStyle = 'rgba(102, 252, 241, 0.3)';
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.restore();
}

function drawFloatingTexts(ctx: CanvasRenderingContext2D, state: GameState) {
  for (const ft of state.floatingTexts) {
    const lifeRatio = ft.life / ft.maxLife;
    const scale = 1.0 + 0.5 * Math.sin((1 - lifeRatio) * Math.PI * 0.2 / 0.2);
    const finalScale = lifeRatio > 0.8 ? 1.0 + 0.5 * Math.sin((1 - lifeRatio) * Math.PI / 0.2) : 1.0;
    ctx.save();
    ctx.translate(ft.x, ft.y);
    ctx.scale(finalScale || scale, finalScale || scale);
    ctx.globalAlpha = Math.min(1, lifeRatio * 2);
    ctx.font = 'bold 20px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = ft.color;
    ctx.shadowColor = '#66FCF1';
    ctx.shadowBlur = 6;
    ctx.textAlign = 'center';
    ctx.fillText(ft.text, 0, 0);
    ctx.shadowBlur = 0;
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

function drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, filled: boolean, scale: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.font = `${size}px "Segoe UI", system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = filled ? '#E63946' : '#6B6E70';
  if (filled) {
    ctx.shadowColor = '#E63946';
    ctx.shadowBlur = 4;
  }
  ctx.fillText('♥', 0, 0);
  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawEnergyArc(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, energy: number) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(107, 110, 112, 0.4)';
  ctx.lineWidth = 6;
  ctx.stroke();

  const startAngle = -Math.PI / 2;
  const endAngle = startAngle + (energy / 100) * Math.PI * 2;

  ctx.beginPath();
  ctx.arc(x, y, radius, startAngle, endAngle);
  const energyColor = energy < 10 ? '#FF4C4C' : '#66FCF1';
  ctx.strokeStyle = energyColor;
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.shadowColor = energyColor;
  ctx.shadowBlur = 6;
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.lineCap = 'butt';

  ctx.font = 'bold 12px "Segoe UI", system-ui, sans-serif';
  ctx.fillStyle = energy < 10 ? '#FF4C4C' : '#C5C6C7';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = '#66FCF1';
  ctx.shadowBlur = 4;
  ctx.fillText(`${Math.round(energy)}%`, x, y);
  ctx.shadowBlur = 0;
}

function drawHUD(ctx: CanvasRenderingContext2D, state: GameState) {
  const baseX = 20;
  let y = 35;

  ctx.font = 'bold 24px "Segoe UI", system-ui, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = '#66FCF1';
  ctx.shadowBlur = 6;
  ctx.fillText(`分数: ${state.score}`, baseX, y);
  ctx.shadowBlur = 0;

  if (state.boostActive) {
    ctx.font = 'bold 16px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = '#FFD700';
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 6;
    ctx.fillText(`⚡ 加速 ${state.boostCountdown}s`, baseX + 160, y);
    ctx.shadowBlur = 0;
  }

  y += 35;
  const heartSize = 22;
  const heartSpacing = 28;
  for (let i = 0; i < state.maxLives; i++) {
    const filled = i < state.lives;
    const scale = (state.hitAnimTimer > 0 && i === state.lives) ? 1.0 + 0.3 * Math.sin(state.hitAnimTimer * Math.PI / 0.2) : 1.0;
    drawHeart(ctx, baseX + 12 + i * heartSpacing, y, heartSize, filled, scale);
  }

  y += 40;
  drawEnergyArc(ctx, baseX + 24, y, 22, state.energy);

  if (state.energy < 10) {
    ctx.font = 'bold 14px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = `rgba(255, 76, 76, ${0.5 + 0.5 * Math.sin(state.time * 8)})`;
    ctx.textAlign = 'left';
    ctx.shadowColor = '#FF4C4C';
    ctx.shadowBlur = 4;
    ctx.fillText('能量不足', baseX + 54, y);
    ctx.shadowBlur = 0;
  }

  ctx.font = '16px "Segoe UI", system-ui, sans-serif';
  ctx.fillStyle = '#6B6E70';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = '#66FCF1';
  ctx.shadowBlur = 4;
  ctx.fillText(`第 ${state.wave} 波`, state.canvasWidth - 20, 30);

  const waveSecLeft = Math.ceil(state.waveTimer);
  ctx.font = '13px "Segoe UI", system-ui, sans-serif';
  ctx.fillStyle = '#6B6E70';
  ctx.fillText(`${waveSecLeft}s`, state.canvasWidth - 20, 52);
  ctx.shadowBlur = 0;
}

function drawWaveAnnouncement(ctx: CanvasRenderingContext2D, state: GameState) {
  if (!state.waveAnnouncement) return;
  const wa = state.waveAnnouncement;
  const progress = 1 - wa.timer / wa.maxTimer;
  const scale = 1.5 - 0.5 * Math.min(1, progress * 2);
  const alpha = 0.3 + 0.7 * Math.min(1, progress * 2);

  ctx.save();
  ctx.translate(state.canvasWidth / 2, state.canvasHeight / 2);
  ctx.scale(scale, scale);
  ctx.globalAlpha = alpha;
  ctx.font = 'bold 64px "Segoe UI", system-ui, sans-serif';
  ctx.fillStyle = '#66FCF1';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = '#66FCF1';
  ctx.shadowBlur = 20;
  ctx.fillText(wa.text, 0, 0);
  ctx.shadowBlur = 0;
  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawBoostEdgeGlow(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const gradient = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.7);
  gradient.addColorStop(0, 'rgba(255, 215, 0, 0)');
  gradient.addColorStop(0.7, 'rgba(255, 215, 0, 0)');
  gradient.addColorStop(1, 'rgba(255, 215, 0, 0.15)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);
}

function drawFlashRed(ctx: CanvasRenderingContext2D, w: number, h: number, alpha: number) {
  if (alpha <= 0) return;
  ctx.fillStyle = `rgba(255, 0, 0, ${alpha})`;
  ctx.fillRect(0, 0, w, h);
}

function render(ctx: CanvasRenderingContext2D, state: GameState) {
  const { canvasWidth: w, canvasHeight: h } = state;

  ctx.save();

  if (state.screenShake.timer > 0) {
    ctx.translate(state.screenShake.x, state.screenShake.y);
  }

  drawBackground(ctx, w, h);
  drawStars(ctx, state);

  for (const d of state.debris) {
    drawDebris(ctx, d);
  }

  if (state.gameStarted && !state.gameOver) {
    drawRecyclingBay(ctx, state);
    drawTractorBeam(ctx, state);

    for (const d of state.debris) {
      if (d.beingTractored) {
        drawHalo(ctx, d);
      }
    }

    drawParticles(ctx, state.particles);
    drawPlayer(ctx, state);
  }

  drawFloatingTexts(ctx, state);

  if (state.gameStarted && !state.gameOver) {
    drawHUD(ctx, state);
  }

  drawWaveAnnouncement(ctx, state);

  if (state.boostActive) {
    drawBoostEdgeGlow(ctx, w, h);
  }

  drawFlashRed(ctx, w, h, state.flashRed);

  ctx.restore();
}

interface GameCanvasProps {
  onGameOver: (score: number) => void;
  gameKey: number;
  onStart: () => void;
  onRestart: (width: number, height: number) => void;
  isPlaying: boolean;
}

export default function GameCanvas({ onGameOver, gameKey, onStart, onRestart, isPlaying }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {
    stateRef,
    init,
    update,
    start,
    restart,
    handleMouseMove,
    handleMouseDown,
    handleMouseUp,
    resize,
  } = useGameLoop(onGameOver);

  const getCanvasSize = useCallback(() => {
    const parentW = window.innerWidth;
    const parentH = window.innerHeight;
    const w = Math.max(800, parentW);
    const h = Math.max(560, Math.min(parentH, w * 0.7));
    return { w, h };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const { w, h } = getCanvasSize();
    canvas.width = w;
    canvas.height = h;
    init(w, h);

    if (isPlaying) {
      start();
    }
  }, [gameKey, init, start, getCanvasSize, isPlaying]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    let animId: number;
    let lastTime = performance.now();

    function loop(time: number) {
      const dt = Math.min(time - lastTime, 50);
      lastTime = time;

      update(dt);
      const state = stateRef.current;
      if (state) {
        render(ctx, state);
      }

      animId = requestAnimationFrame(loop);
    }

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [update, stateRef]);

  useEffect(() => {
    const handleResizeEvent = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const { w, h } = getCanvasSize();
      canvas.width = w;
      canvas.height = h;
      resize(w, h);
    };

    window.addEventListener('resize', handleResizeEvent);
    return () => window.removeEventListener('resize', handleResizeEvent);
  }, [resize, getCanvasSize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      handleMouseMove(e.clientX - rect.left, e.clientY - rect.top);
    };

    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0) handleMouseDown();
    };

    const onMouseUp = (e: MouseEvent) => {
      if (e.button === 0) handleMouseUp();
    };

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      handleMouseMove(touch.clientX - rect.left, touch.clientY - rect.top);
      handleMouseDown();
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      handleMouseMove(touch.clientX - rect.left, touch.clientY - rect.top);
    };

    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      handleMouseUp();
    };

    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
    };
  }, [handleMouseMove, handleMouseDown, handleMouseUp]);

  const handleStartClick = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { w, h } = getCanvasSize();
    init(w, h);
    start();
    onStart();
  }, [init, start, onStart, getCanvasSize]);

  const handleRestartClick = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { w, h } = getCanvasSize();
    onRestart(w, h);
  }, [onRestart, getCanvasSize]);

  const state = stateRef.current;
  const showStart = state && !state.gameStarted && !state.gameOver;
  const showGameOver = state && state.gameOver;

  return (
    <div className="game-container">
      <canvas ref={canvasRef} className="game-canvas" />

      {showStart && (
        <div className="overlay start-overlay">
          <div className="game-title">太空垃圾回收</div>
          <div className="game-subtitle">SPACE DEBRIS RECYCLER</div>
          <button className="game-btn" onClick={handleStartClick}>
            开始游戏
          </button>
          <div className="instructions">
            <strong>鼠标</strong> 控制飞船移动 &nbsp;|&nbsp; <strong>左键</strong> 发射牵引光束<br />
            抓取可回收碎片拖入回收仓 &nbsp;|&nbsp; 躲避红色危险碎片
          </div>
        </div>
      )}

      {showGameOver && (
        <div className="overlay gameover-overlay">
          <div className="gameover-panel">
            <div className="gameover-title">任务结束</div>
            <div className="gameover-score">
              最终分数: <span>{state.score}</span>
            </div>
            <button className="game-btn" onClick={handleRestartClick}>
              重新开始
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
