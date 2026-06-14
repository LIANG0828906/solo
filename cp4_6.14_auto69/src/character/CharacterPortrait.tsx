import React, { useEffect, useRef, useState, useCallback } from 'react';
import { spriteManager } from './SpriteManager';
import type { ExpressionType } from '../types';

interface CharacterPortraitProps {
  characterId: string;
  expression: ExpressionType;
  width?: number;
  height?: number;
  className?: string;
}

const CharacterPortrait: React.FC<CharacterPortraitProps> = ({
  characterId,
  expression,
  width = 280,
  height = 280,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prevCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const currentExpressionRef = useRef<ExpressionType>(expression);
  const targetExpressionRef = useRef<ExpressionType>(expression);

  const ANIMATION_DURATION = 400;

  const drawPortrait = useCallback(
    (ctx: CanvasRenderingContext2D, expr: ExpressionType, alpha: number = 1) => {
      const canvas = ctx.canvas;
      const sprite = spriteManager.getSprite(characterId);

      if (!sprite || !sprite.image || !sprite.loaded) {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#64748b';
        ctx.font = '14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Loading...', canvas.width / 2, canvas.height / 2);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = alpha;

      const frame = sprite.frames[expr]?.[0];
      if (!frame) return;

      const scale = Math.min(canvas.width / sprite.frameWidth, canvas.height / sprite.frameHeight);
      const drawWidth = sprite.frameWidth * scale;
      const drawHeight = sprite.frameHeight * scale;
      const drawX = (canvas.width - drawWidth) / 2;
      const drawY = (canvas.height - drawHeight) / 2;

      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(
        sprite.image,
        frame.x,
        frame.y,
        frame.width,
        frame.height,
        drawX,
        drawY,
        drawWidth,
        drawHeight
      );

      ctx.globalAlpha = 1;
    },
    [characterId]
  );

  const drawBackground = useCallback((ctx: CanvasRenderingContext2D) => {
    const canvas = ctx.canvas;
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#0f172a');
    gradient.addColorStop(1, '#1e293b');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const startCrossFade = useCallback(
    (fromExpr: ExpressionType, toExpr: ExpressionType) => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      setIsAnimating(true);

      const canvas = canvasRef.current;
      const prevCanvas = prevCanvasRef.current;
      if (!canvas || !prevCanvas) return;

      const ctx = canvas.getContext('2d');
      const prevCtx = prevCanvas.getContext('2d');
      if (!ctx || !prevCtx) return;

      prevCanvas.width = canvas.width;
      prevCanvas.height = canvas.height;

      drawBackground(prevCtx);
      drawPortrait(prevCtx, fromExpr, 1);

      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / ANIMATION_DURATION, 1);

        const easeProgress = 1 - Math.pow(1 - progress, 3);

        drawBackground(ctx);
        drawPortrait(ctx, toExpr, easeProgress);

        const combinedCtx = canvas.getContext('2d')!;
        combinedCtx.clearRect(0, 0, canvas.width, canvas.height);
        drawBackground(combinedCtx);

        combinedCtx.globalAlpha = 1 - easeProgress;
        combinedCtx.drawImage(prevCanvas, 0, 0);
        combinedCtx.globalAlpha = easeProgress;
        drawPortrait(combinedCtx, toExpr, 1);
        combinedCtx.globalAlpha = 1;

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          setIsAnimating(false);
          currentExpressionRef.current = toExpr;
          animationRef.current = null;
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    },
    [drawBackground, drawPortrait]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
      drawBackground(ctx);
      drawPortrait(ctx, expression, 1);
    }
  }, [width, height, drawBackground, drawPortrait, expression]);

  useEffect(() => {
    if (expression !== currentExpressionRef.current) {
      targetExpressionRef.current = expression;
      startCrossFade(currentExpressionRef.current, expression);
    }
  }, [expression, startCrossFade]);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div
      className={`character-portrait-container ${className}`}
      style={{
        position: 'relative',
        width: `${width}px`,
        height: `${height}px`,
        border: '2px solid #ffffff',
        borderRadius: '12px',
        overflow: 'hidden',
        background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
      />
      <canvas
        ref={prevCanvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          opacity: 0,
          display: 'none',
        }}
      />
    </div>
  );
};

export default CharacterPortrait;
