import React, { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import type { Point, Stroke, CharacterStroke, AnimationSpeed } from '../types';
import { calculateStrokeSimilarity, detectPointNearStroke } from '../utils/scoring';

interface CalligraphyCanvasProps {
  characterStrokes: CharacterStroke[];
  character: string;
  size?: number;
  speed: AnimationSpeed;
  onScoreUpdate: (strokeId: number, score: number) => void;
  onAllStrokesComplete: () => void;
  onUserStrokeAdd?: (stroke: Stroke) => void;
  resetTrigger: number;
}

export interface CalligraphyCanvasHandle {
  startAnimation: () => void;
  playAnimation: () => void;
  pauseAnimation: () => void;
  resetAnimation: () => void;
  clearCanvas: () => void;
  isAnimating: () => boolean;
}

const speedDurationMap: Record<AnimationSpeed, number> = {
  slow: 3,
  normal: 1.8,
  fast: 0.8
};

const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

const CalligraphyCanvas = forwardRef<CalligraphyCanvasHandle, CalligraphyCanvasProps>(({
  characterStrokes,
  character,
  size = 420,
  speed,
  onScoreUpdate,
  onAllStrokesComplete,
  onUserStrokeAdd,
  resetTrigger
}, ref) => {
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const animCanvasRef = useRef<HTMLCanvasElement>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [completedStrokes, setCompletedStrokes] = useState<Stroke[]>([]);
  const [matchedStrokeIds, setMatchedStrokeIds] = useState<Set<number>>(new Set());
  const [isAnimating, setIsAnimating] = useState(false);
  const [animStrokeIdx, setAnimStrokeIdx] = useState(-1);
  const [goldFlows, setGoldFlows] = useState<{ strokeId: number; startTime: number }[]>([]);
  const [inkBlots, setInkBlots] = useState<{ x: number; y: number; t: number; r: number }[]>([]);

  const animFrameRef = useRef<number | null>(null);
  const strokeStartTimeRef = useRef(0);
  const isPausedRef = useRef(false);
  const pauseStateRef = useRef<{ strokeIndex: number; progress: number } | null>(null);

  const drawBrushStroke = useCallback((
    ctx: CanvasRenderingContext2D,
    points: Point[],
    strokeData: { widthStart: number; widthMid: number; widthEnd: number },
    opts: { alpha?: number; color?: string; glow?: boolean; blur?: number } = {}
  ) => {
    if (points.length < 2) return;
    const { alpha = 1, color = '#1a1a1a', glow = false, blur = 0 } = opts;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (glow || blur > 0) {
      ctx.shadowColor = glow ? '#D4AF37' : 'rgba(139, 69, 19, 0.5)';
      ctx.shadowBlur = glow ? 24 : blur;
    }

    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const t = i / points.length;

      let w: number;
      if (t < 0.15) {
        const et = t / 0.15;
        w = strokeData.widthStart + (strokeData.widthMid - strokeData.widthStart) * et;
        w *= 0.6 + 0.4 * et;
      } else if (t > 0.85) {
        const et = (t - 0.85) / 0.15;
        w = strokeData.widthMid + (strokeData.widthEnd - strokeData.widthMid) * et;
        w *= 1.0 - 0.3 * et;
      } else {
        const et = (t - 0.15) / 0.7;
        w = strokeData.widthMid + Math.sin(et * Math.PI) * strokeData.widthMid * 0.1;
      }

      const dx = curr.x - prev.x;
      const dy = curr.y - prev.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);

      const steps = Math.max(1, Math.ceil(dist / 1.5));
      for (let j = 0; j <= steps; j++) {
        const st = j / steps;
        const x = prev.x + dx * st;
        const y = prev.y + dy * st;
        const jitter = Math.sin(j * 0.5 + i * 0.3) * w * 0.04;

        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.ellipse(x, y, (w / 2) + jitter, (w / 3) - jitter * 0.5, angle, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }, []);

  const drawInkBlot = useCallback((ctx: CanvasRenderingContext2D, blot: { x: number; y: number; t: number; r: number }) => {
    const elapsed = Date.now() - blot.t;
    const progress = Math.min(elapsed / 800, 1);
    const radius = blot.r * (1 + progress * 2);
    const alpha = 0.12 * (1 - progress);

    if (alpha <= 0) return;

    ctx.save();
    const gradient = ctx.createRadialGradient(blot.x, blot.y, 0, blot.x, blot.y, radius);
    gradient.addColorStop(0, `rgba(26, 26, 26, ${alpha})`);
    gradient.addColorStop(0.5, `rgba(139, 69, 19, ${alpha * 0.5})`);
    gradient.addColorStop(1, 'rgba(245, 237, 216, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(blot.x, blot.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }, []);

  const drawGoldFlow = useCallback((ctx: CanvasRenderingContext2D, stroke: CharacterStroke, startTime: number) => {
    const elapsed = Date.now() - startTime;
    const totalDuration = 1500;

    const strokeAlpha = Math.min(elapsed / 200, 1) * (1 - Math.max((elapsed - totalDuration + 300) / 300, 0));
    if (strokeAlpha <= 0) return;

    ctx.save();
    ctx.globalAlpha = Math.max(0, strokeAlpha) * 0.9;
    ctx.shadowColor = '#F0D060';
    ctx.shadowBlur = 20;
    drawBrushStroke(ctx, stroke.points, stroke, {
      color: '#D4AF37',
      alpha: Math.max(0, strokeAlpha) * 0.85,
      glow: true
    });
    ctx.restore();

    const flowProgress = (elapsed % 800) / 800;
    const flowIdx = Math.floor(flowProgress * stroke.points.length);
    if (flowIdx < stroke.points.length) {
      const fp = stroke.points[flowIdx];
      ctx.save();
      ctx.globalAlpha = Math.max(0, strokeAlpha) * 0.8;
      const flowGrad = ctx.createRadialGradient(fp.x, fp.y, 0, fp.x, fp.y, 30);
      flowGrad.addColorStop(0, 'rgba(240, 208, 96, 0.9)');
      flowGrad.addColorStop(0.4, 'rgba(212, 175, 55, 0.4)');
      flowGrad.addColorStop(1, 'rgba(212, 175, 55, 0)');
      ctx.fillStyle = flowGrad;
      ctx.beginPath();
      ctx.arc(fp.x, fp.y, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }, [drawBrushStroke]);

  const getCanvasPoint = useCallback((e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    let cx: number, cy: number;
    if ('touches' in e) {
      const touch = e.touches[0] || e.changedTouches[0];
      cx = touch.clientX;
      cy = touch.clientY;
    } else {
      cx = e.clientX;
      cy = e.clientY;
    }
    return { x: (cx - rect.left) * scaleX, y: (cy - rect.top) * scaleY, timestamp: Date.now() };
  }, []);

  const renderMain = useCallback(() => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = '#F5EDD8';
    ctx.fillRect(0, 0, size, size);

    characterStrokes.forEach((stroke) => {
      const isMatched = matchedStrokeIds.has(stroke.id);
      const isAnimCurrent = animStrokeIdx === stroke.id;
      if (isAnimCurrent) return;

      drawBrushStroke(ctx, stroke.points, stroke, {
        alpha: isMatched ? 0.85 : 0.18,
        color: isMatched ? '#D4AF37' : '#1a1a1a',
        glow: isMatched
      });
    });

    inkBlots.forEach((blot) => drawInkBlot(ctx, blot));

    completedStrokes.forEach((stroke) => {
      if (stroke.points.length < 2) return;
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (let i = 1; i < stroke.points.length; i++) {
        const prev = stroke.points[i - 1];
        const curr = stroke.points[i];
        const t = i / stroke.points.length;

        let isNearRef = false;
        for (const ref of characterStrokes) {
          if (detectPointNearStroke(curr, ref, 18)) {
            isNearRef = true;
            break;
          }
        }

        const baseW = (stroke.width || 10) * (0.7 + 0.3 * Math.sin(t * Math.PI));

        if (isNearRef) {
          ctx.globalAlpha = 0.5;
          ctx.shadowColor = 'rgba(139, 69, 19, 0.5)';
          ctx.shadowBlur = 10;
          ctx.strokeStyle = 'rgba(26, 26, 26, 0.45)';
        } else {
          ctx.globalAlpha = 0.35;
          ctx.shadowBlur = 0;
          ctx.strokeStyle = 'rgba(26, 26, 26, 0.35)';
        }

        ctx.lineWidth = baseW;
        ctx.beginPath();
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(curr.x, curr.y);
        ctx.stroke();
      }
      ctx.restore();
    });

    if (currentStroke && currentStroke.points.length >= 2) {
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = 0.55;
      ctx.strokeStyle = 'rgba(26, 26, 26, 0.5)';

      for (let i = 1; i < currentStroke.points.length; i++) {
        const prev = currentStroke.points[i - 1];
        const curr = currentStroke.points[i];
        const t = i / currentStroke.points.length;
        const w = (currentStroke.width || 10) * (0.6 + 0.4 * Math.sin(t * Math.PI));

        let isNearRef = false;
        for (const ref of characterStrokes) {
          if (detectPointNearStroke(curr, ref, 18)) {
            isNearRef = true;
            break;
          }
        }

        if (isNearRef) {
          ctx.shadowColor = 'rgba(139, 69, 19, 0.4)';
          ctx.shadowBlur = 8;
          ctx.globalAlpha = 0.55;
        } else {
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 0.45;
        }

        ctx.lineWidth = w;
        ctx.beginPath();
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(curr.x, curr.y);
        ctx.stroke();
      }
      ctx.restore();
    }

    goldFlows.forEach((gf) => {
      const target = characterStrokes.find((s) => s.id === gf.strokeId);
      if (target) drawGoldFlow(ctx, target, gf.startTime);
    });

  }, [size, characterStrokes, matchedStrokeIds, animStrokeIdx, completedStrokes, currentStroke, goldFlows, inkBlots, drawBrushStroke, drawInkBlot, drawGoldFlow]);

  useEffect(() => {
    renderMain();
  }, [renderMain]);

  useEffect(() => {
    const iv = setInterval(() => {
      setGoldFlows((prev) => prev.filter((g) => Date.now() - g.startTime < 1500));
      setInkBlots((prev) => prev.filter((b) => Date.now() - b.t < 800));
    }, 80);
    return () => clearInterval(iv);
  }, []);

  const handlePointerDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (isAnimating) return;
    e.preventDefault();
    const point = getCanvasPoint(e);
    setIsDrawing(true);
    setCurrentStroke({ id: completedStrokes.length, points: [point], width: 10 });
  }, [isAnimating, getCanvasPoint, completedStrokes.length]);

  const handlePointerMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !currentStroke || isAnimating) return;
    e.preventDefault();
    const point = getCanvasPoint(e);
    const last = currentStroke.points[currentStroke.points.length - 1];
    if (last && Math.sqrt((point.x - last.x) ** 2 + (point.y - last.y) ** 2) < 2) return;

    setCurrentStroke((prev) => {
      if (!prev) return prev;
      return { ...prev, points: [...prev.points, point] };
    });

    for (const target of characterStrokes) {
      if (detectPointNearStroke(point, target, 12)) {
        setInkBlots((prev) => {
          if (prev.length > 40) return prev;
          return [...prev, { x: point.x, y: point.y, t: Date.now(), r: 3 + Math.random() * 4 }];
        });
      }
    }
  }, [isDrawing, currentStroke, isAnimating, getCanvasPoint, characterStrokes]);

  const handlePointerUp = useCallback(() => {
    if (!isDrawing || !currentStroke) return;
    setIsDrawing(false);

    if (currentStroke.points.length < 3) {
      setCurrentStroke(null);
      return;
    }

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

    if (onUserStrokeAdd) {
      onUserStrokeAdd(newCompleted);
    }

    if (bestStrokeId !== -1) {
      onScoreUpdate(bestStrokeId, bestScore);

      if (bestScore >= 80) {
        setMatchedStrokeIds((prev) => new Set(prev).add(bestStrokeId));
        setGoldFlows((prev) => [...prev, { strokeId: bestStrokeId, startTime: Date.now() }]);
      }
    }

    setCurrentStroke(null);

    const matchedCount = completedStrokes.filter((s) => s.matched).length + (newCompleted.matched ? 1 : 0);
    if (matchedCount >= characterStrokes.length || completedStrokes.length + 1 >= characterStrokes.length) {
      setTimeout(() => onAllStrokesComplete(), 600);
    }
  }, [isDrawing, currentStroke, characterStrokes, matchedStrokeIds, onScoreUpdate, onAllStrokesComplete, completedStrokes, onUserStrokeAdd]);

  const clearAnimCanvas = useCallback(() => {
    const animCanvas = animCanvasRef.current;
    if (animCanvas) {
      const actx = animCanvas.getContext('2d');
      if (actx) actx.clearRect(0, 0, size, size);
    }
  }, [size]);

  const startAnimation = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    isPausedRef.current = false;
    pauseStateRef.current = null;
    const duration = speedDurationMap[speed] * 1000;
    let strokeIndex = 0;
    strokeStartTimeRef.current = performance.now();

    const animateFrame = (now: number) => {
      if (isPausedRef.current) {
        pauseStateRef.current = {
          strokeIndex,
          progress: Math.min((now - strokeStartTimeRef.current) / duration, 1)
        };
        animFrameRef.current = requestAnimationFrame(animateFrame);
        return;
      }

      if (strokeIndex >= characterStrokes.length) {
        setIsAnimating(false);
        setAnimStrokeIdx(-1);
        clearAnimCanvas();
        return;
      }

      const elapsed = now - strokeStartTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const stroke = characterStrokes[strokeIndex];

      setAnimStrokeIdx(stroke.id);

      const animCanvas = animCanvasRef.current;
      if (animCanvas) {
        const actx = animCanvas.getContext('2d');
        if (actx) {
          actx.clearRect(0, 0, size, size);

          for (let i = 0; i < strokeIndex; i++) {
            drawBrushStroke(actx, characterStrokes[i].points, characterStrokes[i], { alpha: 0.9 });
          }

          const visibleCount = Math.floor(stroke.points.length * easeOutCubic(progress));
          const visiblePoints = stroke.points.slice(0, Math.max(2, visibleCount + 1));

          if (visiblePoints.length >= 2) {
            drawBrushStroke(actx, visiblePoints, stroke, { alpha: 0.95 });
          }

          if (visiblePoints.length >= 2) {
            const tip = visiblePoints[visiblePoints.length - 1];
            actx.save();
            const tipGrad = actx.createRadialGradient(tip.x, tip.y, 0, tip.x, tip.y, 16);
            tipGrad.addColorStop(0, 'rgba(26, 26, 26, 0.5)');
            tipGrad.addColorStop(1, 'rgba(26, 26, 26, 0)');
            actx.fillStyle = tipGrad;
            actx.beginPath();
            actx.arc(tip.x, tip.y, 16, 0, Math.PI * 2);
            actx.fill();
            actx.restore();
          }
        }
      }

      if (progress >= 1) {
        strokeIndex++;
        strokeStartTimeRef.current = now;
        const pauseDuration = 200 / (speed === 'slow' ? 2 : speed === 'fast' ? 0.5 : 1);
        setTimeout(() => {
          animFrameRef.current = requestAnimationFrame(animateFrame);
        }, pauseDuration);
      } else {
        animFrameRef.current = requestAnimationFrame(animateFrame);
      }
    };

    animFrameRef.current = requestAnimationFrame(animateFrame);
  }, [isAnimating, speed, characterStrokes, size, drawBrushStroke, clearAnimCanvas]);

  const pauseAnimation = useCallback(() => {
    if (!isAnimating) return;
    isPausedRef.current = true;
  }, [isAnimating]);

  const resumeAnimation = useCallback(() => {
    if (!isAnimating || !isPausedRef.current) return;
    isPausedRef.current = false;
    const state = pauseStateRef.current;
    if (!state) return;

    const duration = speedDurationMap[speed] * 1000;
    let strokeIndex = state.strokeIndex;
    strokeStartTimeRef.current = performance.now() - state.progress * duration;

    const animateFrame = (now: number) => {
      if (isPausedRef.current) {
        pauseStateRef.current = {
          strokeIndex,
          progress: Math.min((now - strokeStartTimeRef.current) / duration, 1)
        };
        animFrameRef.current = requestAnimationFrame(animateFrame);
        return;
      }

      if (strokeIndex >= characterStrokes.length) {
        setIsAnimating(false);
        setAnimStrokeIdx(-1);
        clearAnimCanvas();
        return;
      }

      const elapsed = now - strokeStartTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const stroke = characterStrokes[strokeIndex];

      setAnimStrokeIdx(stroke.id);

      const animCanvas = animCanvasRef.current;
      if (animCanvas) {
        const actx = animCanvas.getContext('2d');
        if (actx) {
          actx.clearRect(0, 0, size, size);
          for (let i = 0; i < strokeIndex; i++) {
            drawBrushStroke(actx, characterStrokes[i].points, characterStrokes[i], { alpha: 0.9 });
          }
          const visibleCount = Math.floor(stroke.points.length * easeOutCubic(progress));
          const visiblePoints = stroke.points.slice(0, Math.max(2, visibleCount + 1));
          if (visiblePoints.length >= 2) {
            drawBrushStroke(actx, visiblePoints, stroke, { alpha: 0.95 });
          }
          if (visiblePoints.length >= 2) {
            const tip = visiblePoints[visiblePoints.length - 1];
            actx.save();
            const tipGrad = actx.createRadialGradient(tip.x, tip.y, 0, tip.x, tip.y, 16);
            tipGrad.addColorStop(0, 'rgba(26, 26, 26, 0.5)');
            tipGrad.addColorStop(1, 'rgba(26, 26, 26, 0)');
            actx.fillStyle = tipGrad;
            actx.beginPath();
            actx.arc(tip.x, tip.y, 16, 0, Math.PI * 2);
            actx.fill();
            actx.restore();
          }
        }
      }

      if (progress >= 1) {
        strokeIndex++;
        strokeStartTimeRef.current = now;
        const pauseDuration = 200 / (speed === 'slow' ? 2 : speed === 'fast' ? 0.5 : 1);
        setTimeout(() => {
          animFrameRef.current = requestAnimationFrame(animateFrame);
        }, pauseDuration);
      } else {
        animFrameRef.current = requestAnimationFrame(animateFrame);
      }
    };

    animFrameRef.current = requestAnimationFrame(animateFrame);
  }, [isAnimating, speed, characterStrokes, size, drawBrushStroke, clearAnimCanvas]);

  const resetAnimation = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = null;
    isPausedRef.current = false;
    pauseStateRef.current = null;
    setIsAnimating(false);
    setAnimStrokeIdx(-1);
    clearAnimCanvas();
  }, [clearAnimCanvas]);

  const clearCanvas = useCallback(() => {
    setCompletedStrokes([]);
    setCurrentStroke(null);
    setMatchedStrokeIds(new Set());
    setGoldFlows([]);
    setInkBlots([]);
  }, []);

  useImperativeHandle(ref, () => ({
    startAnimation,
    playAnimation: startAnimation,
    pauseAnimation,
    resumeAnimation,
    resetAnimation,
    clearCanvas,
    isAnimating: () => isAnimating
  }), [startAnimation, pauseAnimation, resumeAnimation, resetAnimation, clearCanvas, isAnimating]);

  useEffect(() => {
    clearCanvas();
    resetAnimation();
  }, [resetTrigger, character, clearCanvas, resetAnimation]);

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return (
    <div
      className="calligraphy-canvas"
      style={{ width: size, height: size }}
    >
      <div className="paper-texture" />
      <div className="paper-grid" />
      <canvas
        ref={mainCanvasRef}
        width={size}
        height={size}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
      />
      <canvas
        ref={animCanvasRef}
        width={size}
        height={size}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      />
      {!isAnimating && completedStrokes.length === 0 && !currentStroke && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: size * 0.5, color: 'rgba(26, 26, 26, 0.06)', userSelect: 'none' }}>
            {character}
          </span>
        </div>
      )}
    </div>
  );
});

CalligraphyCanvas.displayName = 'CalligraphyCanvas';

export default CalligraphyCanvas;
