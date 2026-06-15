import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { Point, Stroke, CharacterStroke, AnimationSpeed } from '../types';
import { calculateStrokeSimilarity, detectPointNearStroke, getScoreColor } from '../utils/scoring';

interface CalligraphyCanvasProps {
  characterStrokes: CharacterStroke[];
  character: string;
  size?: number;
  speed: AnimationSpeed;
  onScoreUpdate: (strokeId: number, score: number) => void;
  onAllStrokesComplete: () => void;
  resetTrigger: number;
}

const speedMap: Record<AnimationSpeed, number> = {
  slow: 1.5,
  normal: 1,
  fast: 0.5
};

const CalligraphyCanvas: React.FC<CalligraphyCanvasProps> = ({
  characterStrokes,
  character,
  size = 420,
  speed,
  onScoreUpdate,
  onAllStrokesComplete,
  resetTrigger
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationCanvasRef = useRef<HTMLCanvasElement>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [completedStrokes, setCompletedStrokes] = useState<Stroke[]>([]);
  const [matchedStrokeIds, setMatchedStrokeIds] = useState<Set<number>>(new Set());
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentAnimatingStroke, setCurrentAnimatingStroke] = useState(-1);
  const [glowEffects, setGlowEffects] = useState<{ strokeId: number; time: number }[]>([]);

  const animationFrameRef = useRef<number | null>(null);
  const animProgressRef = useRef(0);

  const getCanvasPoint = useCallback((e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX: number, clientY: number;
    if ('touches' in e) {
      const touch = e.touches[0] || e.changedTouches[0];
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
      timestamp: Date.now()
    };
  }, []);

  const drawBackground = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = '#F5EDD8';
    ctx.fillRect(0, 0, size, size);
  }, [size]);

  const drawReferenceStrokes = useCallback((ctx: CanvasRenderingContext2D) => {
    characterStrokes.forEach((stroke) => {
      const isMatched = matchedStrokeIds.has(stroke.id);
      const isAnimating = currentAnimatingStroke === stroke.id;

      if (isAnimating) return;

      drawBrushStroke(ctx, stroke.points, stroke, {
        alpha: isMatched ? 0.9 : 0.15,
        color: isMatched ? '#D4AF37' : '#1a1a1a',
        glow: isMatched
      });
    });
  }, [characterStrokes, matchedStrokeIds, currentAnimatingStroke]);

  const drawBrushStroke = useCallback((
    ctx: CanvasRenderingContext2D,
    points: Point[],
    strokeData: CharacterStroke | { widthStart: number; widthMid: number; widthEnd: number },
    options: { alpha?: number; color?: string; glow?: boolean } = {}
  ) => {
    if (points.length < 2) return;

    const { alpha = 1, color = '#1a1a1a', glow = false } = options;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (glow) {
      ctx.shadowColor = '#D4AF37';
      ctx.shadowBlur = 20;
    }

    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const t = i / points.length;

      let width: number;
      if (t < 0.5) {
        width = strokeData.widthStart + (strokeData.widthMid - strokeData.widthStart) * (t * 2);
      } else {
        width = strokeData.widthMid + (strokeData.widthEnd - strokeData.widthMid) * ((t - 0.5) * 2);
      }

      const dx = curr.x - prev.x;
      const dy = curr.y - prev.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);

      const steps = Math.max(1, Math.ceil(dist / 2));
      for (let j = 0; j <= steps; j++) {
        const stepT = j / steps;
        const x = prev.x + dx * stepT;
        const y = prev.y + dy * stepT;
        const w = width * (0.8 + 0.2 * Math.sin(stepT * Math.PI));

        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.ellipse(
          x,
          y,
          w / 2,
          w / 3,
          angle,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
    }

    ctx.restore();
  }, []);

  const drawUserStroke = useCallback((ctx: CanvasRenderingContext2D, stroke: Stroke, isCurrent: boolean = false) => {
    if (stroke.points.length < 1) return;

    ctx.save();
    ctx.globalAlpha = isCurrent ? 0.6 : 0.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = 1; i < stroke.points.length; i++) {
      const prev = stroke.points[i - 1];
      const curr = stroke.points[i];

      const dx = curr.x - prev.x;
      const dy = curr.y - prev.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      let isNearTarget = false;
      for (const target of characterStrokes) {
        if (detectPointNearStroke(curr, target, 15)) {
          isNearTarget = true;
          break;
        }
      }

      const baseWidth = stroke.width || 8;
      const width = baseWidth * (0.7 + 0.3 * Math.sin((i / stroke.points.length) * Math.PI));

      if (isNearTarget && !isCurrent) {
        ctx.globalAlpha = 0.55;
        ctx.shadowColor = 'rgba(139, 69, 19, 0.4)';
        ctx.shadowBlur = 8;
      } else {
        ctx.globalAlpha = isCurrent ? 0.5 : 0.4;
        ctx.shadowBlur = 0;
      }

      ctx.strokeStyle = '#2a2a2a';
      ctx.lineWidth = width;

      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(curr.x, curr.y);
      ctx.stroke();
    }

    ctx.restore();
  }, [characterStrokes]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawBackground(ctx);
    drawReferenceStrokes(ctx);

    completedStrokes.forEach((stroke) => {
      drawUserStroke(ctx, stroke);
    });

    if (currentStroke) {
      drawUserStroke(ctx, currentStroke, true);
    }

    glowEffects.forEach((effect) => {
      const target = characterStrokes.find((s) => s.id === effect.strokeId);
      if (target) {
        const elapsed = Date.now() - effect.time;
        const progress = Math.min(elapsed / 1000, 1);
        const alpha = Math.sin(progress * Math.PI);

        ctx.save();
        ctx.globalAlpha = alpha * 0.6;
        ctx.shadowColor = '#F0D060';
        ctx.shadowBlur = 30 + progress * 20;
        drawBrushStroke(ctx, target.points, target, {
          color: '#F0D060',
          alpha: alpha * 0.8
        });
        ctx.restore();
      }
    });
  }, [drawBackground, drawReferenceStrokes, drawUserStroke, drawBrushStroke, completedStrokes, currentStroke, glowEffects, characterStrokes]);

  useEffect(() => {
    render();
  }, [render]);

  useEffect(() => {
    const interval = setInterval(() => {
      setGlowEffects((prev) => prev.filter((e) => Date.now() - e.time < 1200));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const handlePointerDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (isAnimating) return;
    e.preventDefault();

    const point = getCanvasPoint(e);
    setIsDrawing(true);
    setCurrentStroke({
      id: completedStrokes.length,
      points: [point],
      width: 10
    });
  }, [isAnimating, getCanvasPoint, completedStrokes.length]);

  const handlePointerMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !currentStroke || isAnimating) return;
    e.preventDefault();

    const point = getCanvasPoint(e);
    const lastPoint = currentStroke.points[currentStroke.points.length - 1];

    if (lastPoint && Math.sqrt((point.x - lastPoint.x) ** 2 + (point.y - lastPoint.y) ** 2) < 2) {
      return;
    }

    setCurrentStroke((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        points: [...prev.points, point]
      };
    });
  }, [isDrawing, currentStroke, isAnimating, getCanvasPoint]);

  const handlePointerUp = useCallback(() => {
    if (!isDrawing || !currentStroke) return;
    setIsDrawing(false);

    let bestScore = 0;
    let bestStrokeId = -1;

    characterStrokes.forEach((target) => {
      if (matchedStrokeIds.has(target.id)) return;
      const score = calculateStrokeSimilarity(currentStroke, target);
      if (score > bestScore) {
        bestScore = score;
        bestStrokeId = target.id;
      }
    });

    const newCompleted = { ...currentStroke, completed: true, matched: bestScore >= 80 };
    setCompletedStrokes((prev) => [...prev, newCompleted]);

    if (bestStrokeId !== -1) {
      onScoreUpdate(bestStrokeId, bestScore);

      if (bestScore >= 80) {
        setMatchedStrokeIds((prev) => new Set(prev).add(bestStrokeId));
        setGlowEffects((prev) => [...prev, { strokeId: bestStrokeId, time: Date.now() }]);
      }
    }

    setCurrentStroke(null);

    if (completedStrokes.length + 1 >= characterStrokes.length) {
      setTimeout(() => {
        onAllStrokesComplete();
      }, 500);
    }
  }, [isDrawing, currentStroke, characterStrokes, matchedStrokeIds, onScoreUpdate, onAllStrokesComplete, completedStrokes.length]);

  const playAnimation = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);

    const speedMultiplier = speedMap[speed];
    let strokeIndex = 0;
    animProgressRef.current = 0;

    const animate = () => {
      if (strokeIndex >= characterStrokes.length) {
        setIsAnimating(false);
        setCurrentAnimatingStroke(-1);
        return;
      }

      setCurrentAnimatingStroke(characterStrokes[strokeIndex].id);

      const stroke = characterStrokes[strokeIndex];
      animProgressRef.current += (1 / 60) / speedMultiplier;

      const canvas = animationCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, size, size);

          for (let i = 0; i < strokeIndex; i++) {
            drawBrushStroke(ctx, characterStrokes[i].points, characterStrokes[i], { alpha: 0.9 });
          }

          const progress = Math.min(animProgressRef.current, 1);
          const visibleCount = Math.floor(stroke.points.length * progress);
          const visiblePoints = stroke.points.slice(0, visibleCount + 1);

          if (visiblePoints.length > 1) {
            drawBrushStroke(ctx, visiblePoints, stroke, { alpha: 0.95 });
          }
        }
      }

      if (animProgressRef.current >= 1) {
        strokeIndex++;
        animProgressRef.current = 0;
        setTimeout(() => {
          animationFrameRef.current = requestAnimationFrame(animate);
        }, 300 / speedMultiplier);
      } else {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [isAnimating, speed, characterStrokes, size, drawBrushStroke]);

  const clearCanvas = useCallback(() => {
    setCompletedStrokes([]);
    setCurrentStroke(null);
    setMatchedStrokeIds(new Set());
    setGlowEffects([]);
  }, []);

  useEffect(() => {
    clearCanvas();
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setIsAnimating(false);
    setCurrentAnimatingStroke(-1);
  }, [resetTrigger, character, clearCanvas]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="calligraphy-canvas"
      style={{ width: size, height: size }}
    >
      <div className="paper-texture" />
      <div className="paper-grid" />
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%'
        }}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
      />
      <canvas
        ref={animationCanvasRef}
        width={size}
        height={size}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none'
        }}
      />
      {!isAnimating && completedStrokes.length === 0 && !currentStroke && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none'
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: size * 0.5,
              color: 'rgba(26, 26, 26, 0.06)',
              userSelect: 'none'
            }}
          >
            {character}
          </span>
        </div>
      )}
    </div>
  );
};

export default CalligraphyCanvas;
export { getScoreColor };
