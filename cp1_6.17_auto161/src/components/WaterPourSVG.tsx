import React, { useEffect, useState } from 'react';
import { PourStage } from '../modules/brewing/BrewingService';

interface WaterPourSVGProps {
  pourStages: PourStage[];
  currentStage: number;
  isAnimating: boolean;
  onAnimationComplete?: () => void;
}

const WaterPourSVG: React.FC<WaterPourSVGProps> = ({
  pourStages,
  currentStage,
  isAnimating,
  onAnimationComplete,
}) => {
  const [pourProgress, setPourProgress] = useState(0);

  useEffect(() => {
    if (!isAnimating) {
      setPourProgress(0);
      return;
    }
    const stage = pourStages[currentStage];
    if (!stage) {
      onAnimationComplete?.();
      return;
    }
    const duration = stage.time * 100;
    const startTime = Date.now();
    let raf: number;
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setPourProgress(progress);
      if (progress < 1) {
        raf = requestAnimationFrame(animate);
      } else {
        setTimeout(() => onAnimationComplete?.(), 300);
      }
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [isAnimating, currentStage, pourStages, onAnimationComplete]);

  const stage = pourStages[currentStage];
  const pourAngle = currentStage * 30 - 30;
  const potCenterX = 250;
  const potCenterY = 220;

  const spoutBaseAngle = 135;
  const spoutAngle = spoutBaseAngle + pourAngle + pourProgress * 15;
  const spoutLen = 70;
  const spoutX = potCenterX + Math.cos((spoutAngle * Math.PI) / 180) * spoutLen;
  const spoutY = potCenterY - 50 + Math.sin((spoutAngle * Math.PI) / 180) * spoutLen;

  const drops = [];
  if (isAnimating && pourProgress > 0.05) {
    const dropCount = Math.floor(pourProgress * 15);
    for (let i = 0; i < dropCount; i++) {
      const t = (i + 1) / dropCount;
      const dropY = spoutY + t * 80 + Math.sin(t * 10) * 2;
      const dropX = spoutX + t * 10;
      drops.push(
        <circle
          key={i}
          cx={dropX}
          cy={dropY}
          r={3 - t * 1.5}
          fill="#5DADE2"
          opacity={0.8 - t * 0.3}
        />
      );
    }
  }

  const waterHeight = 10 + (currentStage / Math.max(pourStages.length, 1)) * 40 + pourProgress * 10;

  return (
    <svg viewBox="0 0 500 400" width="100%" height="100%" style={{ display: 'block' }}>
      <defs>
        <radialGradient id="potGrad" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#D5B48C" />
          <stop offset="60%" stopColor="#B8956E" />
          <stop offset="100%" stopColor="#8B6B4A" />
        </radialGradient>
        <radialGradient id="waterGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#85C1E9" />
          <stop offset="100%" stopColor="#3498DB" />
        </radialGradient>
        <radialGradient id="dripperGrad" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#F5F0E8" />
          <stop offset="100%" stopColor="#E0D5C1" />
        </radialGradient>
        <pattern id="dotPattern" x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1" fill="#D5B48C" opacity="0.3" />
        </pattern>
      </defs>

      <rect width="500" height="400" fill="url(#dotPattern)" />

      <g transform={`rotate(${pourAngle + pourProgress * 10}, ${potCenterX}, ${potCenterY - 50})`}>
        <ellipse cx={potCenterX} cy={potCenterY - 50} rx="65" ry="50" fill="url(#potGrad)" stroke="#6B4423" strokeWidth="2" />
        <ellipse cx={potCenterX} cy={potCenterY - 85} rx="50" ry="10" fill="#8B6B4A" stroke="#6B4423" strokeWidth="2" />
        <path
          d={`M ${potCenterX + 55} ${potCenterY - 60}
              Q ${potCenterX + 90} ${potCenterY - 55}, ${potCenterX + 100} ${potCenterY - 30}
              Q ${potCenterX + 105} ${potCenterY - 15}, ${potCenterX + 95} ${potCenterY - 25}
              L ${potCenterX + 60} ${potCenterY - 40} Z`}
          fill="url(#potGrad)"
          stroke="#6B4423"
          strokeWidth="2"
        />
        <ellipse cx={potCenterX - 20} cy={potCenterY - 50} rx="18" ry="15" fill="#5D4037" opacity="0.3" />
        <path
          d={`M ${potCenterX - 60} ${potCenterY - 70}
              C ${potCenterX - 100} ${potCenterY - 70}, ${potCenterX - 110} ${potCenterY - 20}, ${potCenterX - 70} ${potCenterY - 20}`}
          fill="none"
          stroke="#6B4423"
          strokeWidth="6"
          strokeLinecap="round"
        />
      </g>

      {drops}

      <g>
        <path
          d={`M 320 280 L 380 280 L 360 340 L 340 340 Z`}
          fill="url(#dripperGrad)"
          stroke="#B8956E"
          strokeWidth="1.5"
        />
        <path
          d={`M 340 340 L 360 340 L 355 360 L 345 360 Z`}
          fill="#F0E6D3"
          stroke="#B8956E"
          strokeWidth="1"
        />
        <ellipse cx="350" cy="280" rx="30" ry="5" fill="#E0D5C1" stroke="#B8956E" strokeWidth="1" />
        <rect x="328" y="285" width="44" height="45" fill="#D4B896" opacity="0.6" rx="2" />
      </g>

      <g>
        <ellipse cx="350" cy="390" rx="55" ry="10" fill="#2C1810" opacity="0.2" />
        <path
          d="M 295 390 L 305 320 L 395 320 L 405 390 Z"
          fill="#F8F4EC"
          stroke="#B8956E"
          strokeWidth="2"
        />
        <ellipse cx="350" cy="320" rx="45" ry="6" fill="#F8F4EC" stroke="#B8956E" strokeWidth="1.5" />
        <clipPath id="cupClip">
          <path d="M 298 388 L 307 322 L 393 322 L 402 388 Z" />
        </clipPath>
        <g clipPath="url(#cupClip)">
          <ellipse
            cx="350"
            cy={388 - waterHeight}
            rx="50"
            ry="8"
            fill="url(#waterGrad)"
            opacity="0.85"
          />
          <rect
            x="300"
            y={388 - waterHeight}
            width="100"
            height={waterHeight}
            fill="#5DADE2"
            opacity="0.7"
          />
        </g>
        <path
          d="M 406 340 Q 425 340, 425 355 Q 425 370, 406 370"
          fill="none"
          stroke="#B8956E"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </g>

      {isAnimating && (
        <g>
          <rect x="150" y="60" width="200" height="36" rx="18" fill="#4A3728" opacity="0.85" />
          <text x="250" y="83" textAnchor="middle" fill="#FDFCF8" fontSize="14" fontWeight="600" fontFamily="Noto Sans SC, sans-serif">
            第 {currentStage + 1} 段注水 · {stage?.water || 0}g · {stage?.time || 0}s
          </text>
          <rect x="160" y="55" width="180" height="6" rx="3" fill="#D35400" opacity="0.3" />
          <rect x="160" y="55" width={180 * pourProgress} height="6" rx="3" fill="#D35400" />
        </g>
      )}

      {!isAnimating && pourStages.length > 0 && (
        <g>
          <rect x="150" y="60" width="200" height="36" rx="18" fill="#D5B48C" opacity="0.9" />
          <text x="250" y="83" textAnchor="middle" fill="#4A3728" fontSize="13" fontWeight="500" fontFamily="Noto Sans SC, sans-serif">
            共 {pourStages.length} 段注水 · {pourStages.reduce((s, p) => s + p.water, 0)}g
          </text>
        </g>
      )}
    </svg>
  );
};

export default WaterPourSVG;
