import React, { useRef, useEffect, useCallback } from 'react';
import { Prize } from '../types';
import { RARITY_COLORS, easeOutCubic } from '../utils';

interface LotteryWheelProps {
  prizes: Prize[];
  isDrawing: boolean;
  onDrawComplete: (winningPrize: Prize) => void;
  disabled?: boolean;
}

const CANVAS_SIZE = 400;
const ANIMATION_DURATION = 3000;
const INITIAL_ANGULAR_VELOCITY = 15;

const RARITY_CANVAS_COLORS: Record<string, { start: string; end: string }> = {
  common: { start: '#74b9ff', end: '#0984e3' },
  rare: { start: '#a29bfe', end: '#6c5ce7' },
  legendary: { start: '#fdcb6e', end: '#f39c12' },
};

const LotteryWheel: React.FC<LotteryWheelProps> = ({
  prizes,
  isDrawing,
  onDrawComplete,
  disabled = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const startAngleRef = useRef<number>(0);
  const totalRotationRef = useRef<number>(0);
  const winningPrizeRef = useRef<Prize | null>(null);
  const wheelStyleRef = useRef<HTMLDivElement>(null);
  const isAnimatingRef = useRef(false);

  const preRenderWheel = useCallback(() => {
    if (prizes.length === 0) return;

    const offscreen = document.createElement('canvas');
    offscreen.width = CANVAS_SIZE;
    offscreen.height = CANVAS_SIZE;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return;

    const centerX = CANVAS_SIZE / 2;
    const centerY = CANVAS_SIZE / 2;
    const outerRadius = CANVAS_SIZE / 2 - 10;
    const innerRadius = outerRadius - 60;
    const sliceAngle = (2 * Math.PI) / prizes.length;

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    prizes.forEach((prize, index) => {
      const startAngle = index * sliceAngle - Math.PI / 2;
      const endAngle = startAngle + sliceAngle;

      const colors = RARITY_CANVAS_COLORS[prize.rarity];
      const gradient = ctx.createRadialGradient(
        centerX,
        centerY,
        innerRadius * 0.5,
        centerX,
        centerY,
        outerRadius
      );
      gradient.addColorStop(0, colors.start);
      gradient.addColorStop(1, colors.end);

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      const midAngle = startAngle + sliceAngle / 2;
      const iconRadius = (outerRadius + innerRadius) / 2;
      const iconX = centerX + Math.cos(midAngle) * iconRadius;
      const iconY = centerY + Math.sin(midAngle) * iconRadius;

      ctx.save();
      ctx.translate(iconX, iconY);
      ctx.rotate(midAngle + Math.PI / 2);
      ctx.font = '28px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(prize.icon, 0, -10);

      ctx.font = 'bold 12px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 2;
      ctx.fillText(prize.name, 0, 15);
      ctx.restore();
    });

    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius, 0, 2 * Math.PI);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 2;
    ctx.stroke();

    offscreenCanvasRef.current = offscreen;

    const mainCanvas = canvasRef.current;
    if (mainCanvas) {
      const mainCtx = mainCanvas.getContext('2d');
      if (mainCtx) {
        mainCtx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
        mainCtx.drawImage(offscreen, 0, 0);
      }
    }
  }, [prizes]);

  const animate = useCallback(
    (currentTime: number) => {
      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / ANIMATION_DURATION, 1);
      const easedProgress = easeOutCubic(progress);

      const currentAngle =
        startAngleRef.current + totalRotationRef.current * easedProgress;

      if (wheelStyleRef.current) {
        wheelStyleRef.current.style.transform = `rotate(${currentAngle}deg)`;
      }

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        isAnimatingRef.current = false;
        if (winningPrizeRef.current) {
          onDrawComplete(winningPrizeRef.current);
        }
      }
    },
    [onDrawComplete]
  );

  useEffect(() => {
    if (isDrawing && prizes.length > 0 && !disabled && !isAnimatingRef.current) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      isAnimatingRef.current = true;

      const winningIndex = Math.floor(Math.random() * prizes.length);
      const winningPrize = prizes[winningIndex];
      winningPrizeRef.current = winningPrize;

      const sliceAngle = 360 / prizes.length;
      const prizeCenterAngle = winningIndex * sliceAngle + sliceAngle / 2;
      const targetNormalized = ((-prizeCenterAngle % 360) + 360) % 360;

      const extraSpins = 5 + Math.floor(Math.random() * 4);
      const currentAngle = startAngleRef.current;
      const currentNormalized = ((currentAngle % 360) + 360) % 360;

      let delta = targetNormalized - currentNormalized;
      if (delta <= 0) {
        delta += 360;
      }

      totalRotationRef.current = extraSpins * 360 + delta;
      startAngleRef.current = currentAngle;
      startTimeRef.current = performance.now();

      animationFrameRef.current = requestAnimationFrame(animate);
    }
  }, [isDrawing, prizes, disabled, animate]);

  useEffect(() => {
    preRenderWheel();
  }, [preRenderWheel]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div className="wheel-container">
      <div
        className="pointer"
        style={{
          position: 'absolute',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '0',
          height: '0',
          borderLeft: '15px solid transparent',
          borderRight: '15px solid transparent',
          borderTop: '30px solid',
          borderImage: 'linear-gradient(135deg, #fdcb6e, #e67e22) 1',
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
          zIndex: 10,
        }}
      />

      <div
        ref={wheelStyleRef}
        style={{
          position: 'relative',
          width: CANVAS_SIZE,
          height: CANVAS_SIZE,
          transition: 'none',
        }}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          style={{
            width: CANVAS_SIZE,
            height: CANVAS_SIZE,
            display: 'block',
          }}
        />
      </div>

      <div
        className="wheel-status"
        style={{
          marginTop: '16px',
          textAlign: 'center',
          fontSize: '14px',
          color: '#666',
        }}
      >
        {isDrawing ? '🎰 抽奖中...' : disabled ? '🔒 抽奖已禁用' : '🎯 点击开始抽奖'}
      </div>

      <style>{`
        .wheel-container {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        @media (max-width: 480px) {
          .wheel-container {
            transform: scale(0.7);
            transform-origin: center top;
          }
        }
      `}</style>
    </div>
  );
};

export default React.memo(LotteryWheel);
