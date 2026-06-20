import { useEffect, useRef, useCallback } from 'react';
import { useGameStore, RiverSegment, Position } from '../store/gameStore';
import { RiverGenerator } from '../game/RiverGenerator';

interface GameCanvasProps {
  engineRef: React.MutableRefObject<any>;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

export const GameCanvas = ({ engineRef }: GameCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderAnimationRef = useRef<number | null>(null);
  const riverGeneratorRef = useRef<RiverGenerator>(new RiverGenerator());

  const {
    gameStatus,
    riverSegments,
    currentSegmentIndex,
    segmentTransition,
    playerPosition,
    playerTilt,
    isHit,
    hitTime,
    obstacles,
    coins,
    waterPhase,
    scrollOffset,
    showScoreFlash,
    scoreFlashTime,
    isPaused,
    gameOverOpacity,
  } = useGameStore();

  const getPointOnBezier = useCallback((segment: RiverSegment, t: number): Position => {
    const { startPoint, controlPoint1, controlPoint2, endPoint } = segment;
    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;
    const t2 = t * t;
    const t3 = t2 * t;

    return {
      x: mt3 * startPoint.x + 3 * mt2 * t * controlPoint1.x + 3 * mt * t2 * controlPoint2.x + t3 * endPoint.x,
      y: mt3 * startPoint.y + 3 * mt2 * t * controlPoint1.y + 3 * mt * t2 * controlPoint2.y + t3 * endPoint.y,
    };
  }, []);

  const getNormalOnBezier = useCallback((segment: RiverSegment, t: number): Position => {
    return riverGeneratorRef.current.getNormalOnBezier(segment, t);
  }, []);

  const drawRiver = useCallback((ctx: CanvasRenderingContext2D) => {
    if (riverSegments.length === 0) return;

    const currentSegment = riverSegments[currentSegmentIndex];
    const nextIndex = (currentSegmentIndex + 1) % riverSegments.length;
    const nextSegment = riverSegments[nextIndex];

    const waterWave = Math.sin(waterPhase) * 3;

    ctx.save();
    ctx.fillStyle = '#0A0A1A';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const numPoints = 100;
    const leftPoints: Position[] = [];
    const rightPoints: Position[] = [];

    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      let segment = currentSegment;
      let localT = t;

      if (segmentTransition > 0) {
        if (t < segmentTransition) {
          segment = nextSegment;
          localT = t / segmentTransition;
        } else {
          localT = (t - segmentTransition) / (1 - segmentTransition);
        }
      }

      const centerPoint = getPointOnBezier(segment, localT);
      const normal = getNormalOnBezier(segment, localT);
      const width = segment.width;
      const waveOffset = Math.sin(waterPhase + localT * 10) * 1.5;

      leftPoints.push({
        x: centerPoint.x - normal.x * (width / 2) + waveOffset,
        y: centerPoint.y - normal.y * (width / 2) + waterWave * (i % 2 === 0 ? 1 : -1),
      });

      rightPoints.push({
        x: centerPoint.x + normal.x * (width / 2) - waveOffset,
        y: centerPoint.y + normal.y * (width / 2) + waterWave * (i % 2 === 0 ? -1 : 1),
      });
    }

    ctx.beginPath();
    ctx.moveTo(leftPoints[0].x, leftPoints[0].y);
    for (let i = 1; i <= numPoints; i++) {
      ctx.lineTo(leftPoints[i].x, leftPoints[i].y);
    }
    for (let i = numPoints; i >= 0; i--) {
      ctx.lineTo(rightPoints[i].x, rightPoints[i].y);
    }
    ctx.closePath();

    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#0A2E5A');
    gradient.addColorStop(1, '#10487A');
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.strokeStyle = '#00E5FF';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#00E5FF';
    ctx.shadowBlur = 8;

    ctx.beginPath();
    ctx.moveTo(leftPoints[0].x, leftPoints[0].y);
    for (let i = 1; i <= numPoints; i++) {
      ctx.lineTo(leftPoints[i].x, leftPoints[i].y);
    }
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(rightPoints[0].x, rightPoints[0].y);
    for (let i = 1; i <= numPoints; i++) {
      ctx.lineTo(rightPoints[i].x, rightPoints[i].y);
    }
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.restore();
  }, [riverSegments, currentSegmentIndex, segmentTransition, waterPhase, getPointOnBezier, getNormalOnBezier]);

  const drawObstacles = useCallback((ctx: CanvasRenderingContext2D) => {
    obstacles.forEach(obstacle => {
      ctx.save();
      ctx.translate(obstacle.position.x, obstacle.position.y);
      ctx.rotate(obstacle.rotation);

      if (obstacle.type === 'rock') {
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fillStyle = '#666666';
        ctx.fill();
        ctx.strokeStyle = '#888888';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(-4, -4, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#777777';
        ctx.fill();
      } else {
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-8, -12, 16, 24);
        ctx.strokeStyle = '#6B3510';
        ctx.lineWidth = 2;
        ctx.strokeRect(-8, -12, 16, 24);

        ctx.strokeStyle = '#5B2510';
        ctx.lineWidth = 1;
        for (let i = -8; i < 8; i += 4) {
          ctx.beginPath();
          ctx.moveTo(i, -12);
          ctx.lineTo(i + 2, 12);
          ctx.stroke();
        }
      }

      ctx.restore();
    });
  }, [obstacles]);

  const drawCoins = useCallback((ctx: CanvasRenderingContext2D) => {
    coins.forEach(coin => {
      if (coin.scale <= 0) return;

      ctx.save();
      ctx.translate(coin.position.x, coin.position.y);
      ctx.rotate((coin.rotation * Math.PI) / 180);
      ctx.scale(coin.scale, coin.scale);

      const sideLength = 8;
      const radius = sideLength / (2 * Math.sin(Math.PI / 8));

      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 - Math.PI / 8;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();

      ctx.fillStyle = '#FFD700';
      ctx.fill();
      ctx.strokeStyle = '#FFA500';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.5, 0, Math.PI * 2);
      ctx.strokeStyle = '#FFA500';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#FFA500';
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('¥', 0, 0);

      ctx.restore();
    });
  }, [coins]);

  const drawPlayer = useCallback((ctx: CanvasRenderingContext2D) => {
    const { x, y } = playerPosition;
    const tiltAngle = playerTilt * 15 * (Math.PI / 180);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(tiltAngle);

    const trailLength = 30;
    for (let i = 0; i < 5; i++) {
      const alpha = 0.6 - i * 0.1;
      const offsetY = i * 6;
      ctx.beginPath();
      ctx.moveTo(0, trailLength + offsetY);
      ctx.lineTo(-10 + i * 2, trailLength + 20 + offsetY);
      ctx.lineTo(10 - i * 2, trailLength + 20 + offsetY);
      ctx.closePath();
      ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
      ctx.fill();
    }

    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 6;

    ctx.beginPath();
    ctx.moveTo(0, -15);
    ctx.lineTo(-10, 15);
    ctx.lineTo(10, 15);
    ctx.closePath();

    if (isHit) {
      const flashCycle = Math.floor(hitTime / 0.1) % 2;
      if (flashCycle === 0) {
        ctx.fillStyle = '#FF4444';
      } else {
        ctx.fillStyle = '#FFD700';
      }
    } else {
      ctx.fillStyle = '#FFD700';
    }

    ctx.fill();
    ctx.strokeStyle = '#FFA500';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#FFA500';
    ctx.fill();

    ctx.restore();
  }, [playerPosition, playerTilt, isHit, hitTime]);

  const drawEffects = useCallback((ctx: CanvasRenderingContext2D) => {
    if (showScoreFlash) {
      const alpha = 0.2 * (1 - scoreFlashTime / 0.15);
      ctx.save();
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.restore();
    }

    if (isPaused && gameStatus === 'paused') {
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.font = 'bold 36px Arial';
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0, 229, 255, 0.5)';
      ctx.shadowBlur = 6;
      ctx.fillText('暂停', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      ctx.restore();
    }

    if (gameStatus === 'gameOver' && gameOverOpacity > 0) {
      ctx.save();
      ctx.fillStyle = `rgba(0, 0, 0, ${gameOverOpacity})`;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.restore();
    }
  }, [showScoreFlash, scoreFlashTime, isPaused, gameStatus, gameOverOpacity]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    drawRiver(ctx);
    drawObstacles(ctx);
    drawCoins(ctx);
    drawPlayer(ctx);
    drawEffects(ctx);

    renderAnimationRef.current = requestAnimationFrame(render);
  }, [drawRiver, drawObstacles, drawCoins, drawPlayer, drawEffects]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = engineRef.current;
    if (engine) {
      engine.setCanvas(canvas);
    }

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (engineRef.current) {
        engineRef.current.handleMouseMove(x, y);
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (engineRef.current) {
        engineRef.current.handleMouseDown(x, y);
      }
    };

    const handleMouseUp = () => {
      if (engineRef.current) {
        engineRef.current.handleMouseUp();
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        if (engineRef.current) {
          engineRef.current.handleMouseMove(x, y);
        }
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        if (engineRef.current) {
          engineRef.current.handleMouseDown(x, y);
        }
      }
    };

    const handleTouchEnd = () => {
      if (engineRef.current) {
        engineRef.current.handleMouseUp();
      }
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp);
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchend', handleTouchEnd);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (engineRef.current) {
        engineRef.current.handleKeyDown(e.key);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (engineRef.current) {
        engineRef.current.handleKeyUp(e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    renderAnimationRef.current = requestAnimationFrame(render);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseUp);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);

      if (renderAnimationRef.current) {
        cancelAnimationFrame(renderAnimationRef.current);
      }
    };
  }, [render, engineRef]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      style={{
        display: 'block',
        margin: '0 auto',
        borderRadius: '8px',
        boxShadow: '0 0 30px rgba(0, 229, 255, 0.3)',
      }}
    />
  );
};
