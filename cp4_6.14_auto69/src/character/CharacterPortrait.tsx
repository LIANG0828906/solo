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

const ANIMATION_DURATION = 400;

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
  const currentExpressionRef = useRef<ExpressionType>(expression);
  const dprRef = useRef<number>(window.devicePixelRatio || 1);

  const drawPortraitFrame = useCallback(
    (ctx: CanvasRenderingContext2D, expr: ExpressionType, alpha: number) => {
      const sprite = spriteManager.getSprite(characterId);
      const canvas = ctx.canvas;
      const cssW = canvas.width / dprRef.current;
      const cssH = canvas.height / dprRef.current;

      if (!sprite || !sprite.image || !sprite.loaded) {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, cssW, cssH);
        ctx.fillStyle = '#64748b';
        ctx.font = `${14 * dprRef.current}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Loading...', cssW / 2, cssH / 2);
        return;
      }

      const frame = sprite.frames[expr]?.[0];
      if (!frame) return;

      ctx.save();
      ctx.globalAlpha = alpha;

      const scale = Math.min(cssW / sprite.frameWidth, cssH / sprite.frameHeight);
      const drawW = sprite.frameWidth * scale;
      const drawH = sprite.frameHeight * scale;
      const drawX = (cssW - drawW) / 2;
      const drawY = (cssH - drawH) / 2;

      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(
        sprite.image,
        frame.x,
        frame.y,
        frame.width,
        frame.height,
        drawX,
        drawY,
        drawW,
        drawH
      );

      ctx.restore();
    },
    [characterId]
  );

  const drawBackgroundFrame = useCallback((ctx: CanvasRenderingContext2D) => {
    const canvas = ctx.canvas;
    const cssW = canvas.width / dprRef.current;
    const cssH = canvas.height / dprRef.current;
    const gradient = ctx.createLinearGradient(0, 0, 0, cssH);
    gradient.addColorStop(0, '#0f172a');
    gradient.addColorStop(1, '#1e293b');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, cssW, cssH);
  }, []);

  const renderStatic = useCallback(
    (expr: ExpressionType) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.scale(dprRef.current, dprRef.current);

      drawBackgroundFrame(ctx);
      drawPortraitFrame(ctx, expr, 1);

      ctx.restore();
    },
    [drawBackgroundFrame, drawPortraitFrame]
  );

  const capturePreviousFrame = useCallback(
    (prevExpr: ExpressionType) => {
      const prevCanvas = prevCanvasRef.current;
      if (!prevCanvas) return;
      const canvas = canvasRef.current;
      if (!canvas) return;

      prevCanvas.width = canvas.width;
      prevCanvas.height = canvas.height;
      const prevCtx = prevCanvas.getContext('2d');
      if (!prevCtx) return;

      prevCtx.save();
      prevCtx.setTransform(1, 0, 0, 1, 0, 0);
      prevCtx.clearRect(0, 0, prevCanvas.width, prevCanvas.height);
      prevCtx.scale(dprRef.current, dprRef.current);

      drawBackgroundFrame(prevCtx);
      drawPortraitFrame(prevCtx, prevExpr, 1);
      prevCtx.restore();
    },
    [drawBackgroundFrame, drawPortraitFrame]
  );

  const startCrossFade = useCallback(
    (fromExpr: ExpressionType, toExpr: ExpressionType) => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }

      capturePreviousFrame(fromExpr);

      const canvas = canvasRef.current;
      const prevCanvas = prevCanvasRef.current;
      if (!canvas || !prevCanvas) {
        currentExpressionRef.current = toExpr;
        renderStatic(toExpr);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        currentExpressionRef.current = toExpr;
        renderStatic(toExpr);
        return;
      }

      const startTime = performance.now();
      let lastFrame = startTime;

      const animate = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / ANIMATION_DURATION, 1);
        lastFrame = now;

        const eased = progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.globalAlpha = 1 - eased;
        ctx.drawImage(prevCanvas, 0, 0);

        ctx.globalAlpha = eased;
        ctx.scale(dprRef.current, dprRef.current);
        drawBackgroundFrame(ctx);
        drawPortraitFrame(ctx, toExpr, 1);
        ctx.restore();

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          animationRef.current = null;
          currentExpressionRef.current = toExpr;
          renderStatic(toExpr);
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    },
    [capturePreviousFrame, drawBackgroundFrame, drawPortraitFrame, renderStatic]
  );

  useEffect(() => {
    const dpr = window.devicePixelRatio || 1;
    dprRef.current = dpr;

    const canvas = canvasRef.current;
    const prevCanvas = prevCanvasRef.current;
    if (canvas) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    }
    if (prevCanvas) {
      prevCanvas.width = width * dpr;
      prevCanvas.height = height * dpr;
    }

    renderStatic(currentExpressionRef.current);
  }, [width, height, renderStatic]);

  useEffect(() => {
    if (expression !== currentExpressionRef.current) {
      startCrossFade(currentExpressionRef.current, expression);
    }
  }, [expression, startCrossFade]);

  useEffect(() => {
    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
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
          display: 'block',
          width: `${width}px`,
          height: `${height}px`,
        }}
      />
      <canvas
        ref={prevCanvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          display: 'block',
          width: `${width}px`,
          height: `${height}px`,
          pointerEvents: 'none',
          visibility: 'hidden',
        }}
      />
    </div>
  );
};

export default CharacterPortrait;
