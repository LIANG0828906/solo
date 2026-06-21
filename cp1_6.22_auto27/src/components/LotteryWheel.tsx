import { useEffect, useRef, useState } from 'react';
import type { Prize } from '@/types';

interface LotteryWheelProps {
  prizes: Prize[];
  spinning: boolean;
  onStop: () => void;
  targetPrizeId: string | null;
}

const COLORS = [
  '#FF6B35',
  '#7B2CBF',
  '#FFD700',
  '#FF69B4',
  '#00CED1',
  '#32CD32',
  '#FF8C00',
  '#9370DB',
];

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export default function LotteryWheel({ prizes, spinning, onStop, targetPrizeId }: LotteryWheelProps) {
  const [rotation, setRotation] = useState(0);
  const [currentRotation, setCurrentRotation] = useState(0);
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>();
  const startRotationRef = useRef<number>(0);
  const targetRotationRef = useRef<number>(0);
  const isStoppingRef = useRef(false);

  const availablePrizes = prizes.filter((p) => p.drawnCount < p.quantity);
  const totalAvailable = availablePrizes.reduce((sum, p) => sum + p.quantity - p.drawnCount, 0);

  useEffect(() => {
    if (!spinning) return;

    isStoppingRef.current = false;
    startTimeRef.current = performance.now();
    startRotationRef.current = currentRotation;

    const animate = (time: number) => {
      if (isStoppingRef.current) return;

      const elapsed = time - startTimeRef.current!;
      const baseSpeed = 0.015;
      const speed = baseSpeed * (1 - Math.min(elapsed / 3000, 0.3));
      const newRotation = startRotationRef.current + elapsed * speed;
      setCurrentRotation(newRotation);
      setRotation(newRotation);

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [spinning, currentRotation]);

  useEffect(() => {
    if (!targetPrizeId || !spinning) return;

    const targetPrize = availablePrizes.find((p) => p.id === targetPrizeId);
    if (!targetPrize) return;

    isStoppingRef.current = true;
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    let angle = 0;
    let cumulative = 0;

    for (let i = 0; i < availablePrizes.length; i++) {
      const p = availablePrizes[i];
      const sliceAngle = ((p.quantity - p.drawnCount) / totalAvailable) * 360;
      if (p.id === targetPrizeId) {
        angle = cumulative + sliceAngle / 2;
        break;
      }
      cumulative += sliceAngle;
    }

    const currentMod = ((currentRotation % 360) + 360) % 360;
    const targetAngle = 360 - angle;
    const spins = 5;
    const finalRotation = currentRotation + (targetAngle - currentMod + 360 * spins);

    startTimeRef.current = performance.now();
    startRotationRef.current = currentRotation;
    targetRotationRef.current = finalRotation;

    const duration = 3000;

    const animateStop = (time: number) => {
      const elapsed = time - startTimeRef.current!;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);

      const newRotation = startRotationRef.current + (targetRotationRef.current - startRotationRef.current) * eased;
      setCurrentRotation(newRotation);
      setRotation(newRotation);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animateStop);
      } else {
        setTimeout(() => {
          onStop();
        }, 300);
      }
    };

    animationRef.current = requestAnimationFrame(animateStop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [targetPrizeId, spinning, availablePrizes, totalAvailable, onStop, currentRotation]);

  const generateWheelSVG = () => {
    const segments: JSX.Element[] = [];
    const cx = 200;
    const cy = 200;
    const r = 190;
    let startAngle = -90;

    availablePrizes.forEach((prize, idx) => {
      const sliceAngle = ((prize.quantity - prize.drawnCount) / Math.max(totalAvailable, 1)) * 360;
      const endAngle = startAngle + sliceAngle;

      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;

      const x1 = cx + r * Math.cos(startRad);
      const y1 = cy + r * Math.sin(startRad);
      const x2 = cx + r * Math.cos(endRad);
      const y2 = cy + r * Math.sin(endRad);

      const largeArc = sliceAngle > 180 ? 1 : 0;

      const pathData = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;

      const midAngle = startAngle + sliceAngle / 2;
      const midRad = (midAngle * Math.PI) / 180;
      const textX = cx + (r * 0.65) * Math.cos(midRad);
      const textY = cy + (r * 0.65) * Math.sin(midRad);
      const textRotation = midAngle + 90;

      segments.push(
        <g key={prize.id}>
          <path
            d={pathData}
            fill={COLORS[idx % COLORS.length]}
            stroke="white"
            strokeWidth="2"
          />
          <text
            x={textX}
            y={textY}
            fill="white"
            fontSize="20"
            fontWeight="bold"
            textAnchor="middle"
            dominantBaseline="middle"
            transform={`rotate(${textRotation}, ${textX}, ${textY})`}
          >
            {prize.icon}
          </text>
        </g>
      );

      startAngle = endAngle;
    });

    return segments;
  };

  return (
    <div className="wheel-wrapper">
      <div className="wheel-pointer" />
      <svg
        className="wheel"
        viewBox="0 0 400 400"
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        {generateWheelSVG()}
      </svg>
      <div className="wheel-center">🎯</div>
    </div>
  );
}
