import React, { useEffect, useRef, useCallback, memo } from 'react';
import type { KeyframeConfig } from './types';
import { parseCurveToFunction } from './curveEngine';

interface AnimationPreviewProps {
  canvasId: string;
  curve: string;
  keyframes: KeyframeConfig;
  playTrigger: number;
  onProgress?: (progress: number) => void;
  onFpsUpdate?: (fps: number) => void;
  onComplete?: () => void;
}

interface AnimationState {
  startTime: number;
  duration: number;
  timingFn: (t: number) => number;
  rafId: number | null;
  lastFrameTime: number;
  frameCount: number;
  fpsAccumulator: number;
}

const AnimationPreview: React.FC<AnimationPreviewProps> = memo(function AnimationPreview({
  canvasId,
  curve,
  keyframes,
  playTrigger,
  onProgress,
  onFpsUpdate,
  onComplete
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animStateRef = useRef<AnimationState>({
    startTime: 0,
    duration: 1000,
    timingFn: (t: number) => t,
    rafId: null,
    lastFrameTime: 0,
    frameCount: 0,
    fpsAccumulator: 0
  });

  const getInterpolatedValue = useCallback(
    (key: string, easedT: number, kfList: typeof keyframes.keyframes): number => {
      if (kfList.length === 0) return 0;

      const sorted = [...kfList].sort((a, b) => a.percentage - b.percentage);
      const progressPercent = easedT * 100;

      for (let i = 0; i < sorted.length - 1; i++) {
        const kf1 = sorted[i];
        const kf2 = sorted[i + 1];
        const v1 = (kf1.properties as Record<string, number | undefined>)[key];
        const v2 = (kf2.properties as Record<string, number | undefined>)[key];

        if (v1 === undefined || v2 === undefined) continue;
        if (progressPercent < kf1.percentage || progressPercent > kf2.percentage) continue;

        const span = kf2.percentage - kf1.percentage;
        if (span === 0) return v2;

        const localT = (progressPercent - kf1.percentage) / span;
        return v1 + (v2 - v1) * localT;
      }

      const firstKf = sorted[0];
      const lastKf = sorted[sorted.length - 1];

      if (progressPercent <= firstKf.percentage) {
        const v = (firstKf.properties as Record<string, number | undefined>)[key];
        if (v !== undefined) return v;
      }

      const v = (lastKf.properties as Record<string, number | undefined>)[key];
      if (v !== undefined) return v;

      if (key === 'scale') return 1;
      if (key === 'opacity') return 1;
      return 0;
    },
    []
  );

  const drawFrame = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number, easedT: number) => {
      ctx.clearRect(0, 0, width, height);

      const translateX = getInterpolatedValue('translateX', easedT, keyframes.keyframes);
      const translateY = getInterpolatedValue('translateY', easedT, keyframes.keyframes);
      const scale = getInterpolatedValue('scale', easedT, keyframes.keyframes);
      const rotate = getInterpolatedValue('rotate', easedT, keyframes.keyframes);
      const opacity = getInterpolatedValue('opacity', easedT, keyframes.keyframes) || 1;

      const centerY1 = 50;
      const centerY2 = 150;
      const baseX = 75;
      const size1 = 50;
      const size2 = 50;

      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, opacity));
      ctx.translate(baseX + translateX, centerY1 + translateY);
      ctx.rotate((rotate * Math.PI) / 180);
      ctx.fillStyle = '#4fc3f7';
      roundRect(ctx, -size1 / 2, -size1 / 2, size1, size1, 8);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, opacity));
      const scaleValue = Math.max(0, scale || 1);
      ctx.translate(baseX + 150, centerY2);
      ctx.scale(scaleValue, scaleValue);
      ctx.fillStyle = '#ff7043';
      roundRect(ctx, -size2 / 2, -size2 / 2, size2, size2, 8);
      ctx.fill();
      ctx.restore();
    },
    [keyframes, getInterpolatedValue]
  );

  const startPreview = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const state = animStateRef.current;
    if (state.rafId !== null) {
      cancelAnimationFrame(state.rafId);
    }

    const dpr = window.devicePixelRatio || 1;
    const cssWidth = 400;
    const cssHeight = 200;
    if (canvas.width !== cssWidth * dpr || canvas.height !== cssHeight * dpr) {
      canvas.width = cssWidth * dpr;
      canvas.height = cssHeight * dpr;
      canvas.style.width = cssWidth + 'px';
      canvas.style.height = cssHeight + 'px';
      ctx.scale(dpr, dpr);
    }

    state.startTime = performance.now();
    state.duration = keyframes.duration;
    state.timingFn = parseCurveToFunction(curve);
    state.lastFrameTime = state.startTime;
    state.frameCount = 0;
    state.fpsAccumulator = 0;

    const animate = (now: number) => {
      const elapsed = now - state.startTime;
      const rawT = Math.min(elapsed / state.duration, 1);
      const easedT = state.timingFn(rawT);

      drawFrame(ctx, cssWidth, cssHeight, easedT);

      const delta = now - state.lastFrameTime;
      if (delta > 0) {
        state.fpsAccumulator += 1000 / delta;
        state.frameCount++;
        if (state.frameCount % 10 === 0) {
          const fps = state.fpsAccumulator / state.frameCount;
          onFpsUpdate?.(fps);
        }
      }
      state.lastFrameTime = now;

      onProgress?.(rawT);

      if (rawT < 1) {
        state.rafId = requestAnimationFrame(animate);
      } else {
        state.rafId = null;
        onComplete?.();
      }
    };

    state.rafId = requestAnimationFrame(animate);
  }, [curve, keyframes, drawFrame, onProgress, onFpsUpdate, onComplete]);

  useEffect(() => {
    if (playTrigger > 0) {
      startPreview();
    }
    return () => {
      if (animStateRef.current.rafId !== null) {
        cancelAnimationFrame(animStateRef.current.rafId);
        animStateRef.current.rafId = null;
      }
    };
  }, [playTrigger, startPreview]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const cssWidth = 400;
    const cssHeight = 200;
    if (canvas.width !== cssWidth * dpr || canvas.height !== cssHeight * dpr) {
      canvas.width = cssWidth * dpr;
      canvas.height = cssHeight * dpr;
      canvas.style.width = cssWidth + 'px';
      canvas.style.height = cssHeight + 'px';
      ctx.scale(dpr, dpr);
    }

    const timingFn = parseCurveToFunction(curve);
    drawFrame(ctx, cssWidth, cssHeight, timingFn(0));
  }, [curve, keyframes, drawFrame]);

  return (
    <canvas
      ref={canvasRef}
      id={canvasId}
      style={{
        width: '400px',
        height: '200px',
        background: '#ffffff',
        border: '1px solid #ddd',
        borderRadius: '8px',
        display: 'block'
      }}
    />
  );
});

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export { AnimationPreview, startPreview_Deprecated as startPreview };

function startPreview_Deprecated(): void {
  console.warn('startPreview is deprecated, use AnimationPreview component instead');
}

export default AnimationPreview;
