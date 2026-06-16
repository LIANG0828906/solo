import { useEffect, useRef, useState } from 'react';

interface ProgressRingProps {
  currentAmount: number;
  targetAmount: number;
  size?: number;
  strokeWidth?: number;
}

export default function ProgressRing({
  currentAmount,
  targetAmount,
  size = 200,
  strokeWidth = 12,
}: ProgressRingProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const [displayProgress, setDisplayProgress] = useState(0);
  const targetProgress = Math.min((currentAmount / targetAmount) * 100, 100);

  useEffect(() => {
    const startTime = Date.now();
    const startProgress = displayProgress;
    const duration = 500;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      const easeT = 1 - Math.pow(1 - t, 3);
      const current = startProgress + (targetProgress - startProgress) * easeT;
      setDisplayProgress(current);

      if (t < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [targetProgress]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = (size - strokeWidth) / 2;

    ctx.clearRect(0, 0, size, size);

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = '#FFE0B2';
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.stroke();

    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + (displayProgress / 100) * 2 * Math.PI;

    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#4CAF50');
    gradient.addColorStop(1, '#81C784');

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.stroke();
  }, [displayProgress, size, strokeWidth]);

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size, display: 'block' }}
      />
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          width: '80%',
        }}
      >
        <div
          style={{
            fontSize: size > 150 ? '16px' : '12px',
            color: '#666',
            marginBottom: '4px',
          }}
        >
          已筹 ￥{currentAmount.toLocaleString()}
        </div>
        <div
          style={{
            fontSize: size > 150 ? '14px' : '11px',
            color: '#999',
          }}
        >
          目标 ￥{targetAmount.toLocaleString()}
        </div>
      </div>
    </div>
  );
}
