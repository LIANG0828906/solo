import { useState, useEffect, useRef } from 'react';
import { getCarbonProgressColor } from '../utils/colors';

interface CarbonProgressProps {
  score: number;
  maxScore?: number;
  showLabel?: boolean;
  animated?: boolean;
}

export function CarbonProgress({
  score,
  maxScore = 10,
  showLabel = true,
  animated = true
}: CarbonProgressProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const [prevScore, setPrevScore] = useState(0);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!animated) {
      setDisplayScore(score);
      setPrevScore(score);
      return;
    }

    setPrevScore(displayScore);
    const startValue = displayScore;
    const endValue = score;
    const duration = 500;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / duration);

      const easeProgress =
        progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      const currentValue = startValue + (endValue - startValue) * easeProgress;
      setDisplayScore(Math.round(currentValue * 10) / 10);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
    setPrevScore(score);
  }, [score, animated, displayScore]);

  const percentage = Math.min(100, (displayScore / maxScore) * 100);
  const color = getCarbonProgressColor(displayScore);
  const isImproving = score < prevScore;
  const isWorsening = score > prevScore;

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">碳足迹评分</span>
          <div className="flex items-center gap-2">
            <span
              className={`text-lg font-bold transition-all duration-300 ${
                isImproving ? 'text-green-600 scale-110' : isWorsening ? 'text-red-600 scale-110' : 'text-gray-800'
              }`}
            >
              {displayScore.toFixed(1)}
            </span>
            <span className="text-xs text-gray-400">/ {maxScore}</span>
          </div>
        </div>
      )}

      <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          ref={progressRef}
          className="absolute top-0 left-0 h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
            boxShadow: `0 0 10px ${color}40`
          }}
        />

        <div
          className="absolute top-0 left-0 h-full opacity-50"
          style={{
            width: `${percentage}%`,
            background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)`
          }}
        />
      </div>

      {showLabel && (
        <div className="flex justify-between mt-1 text-xs text-gray-400">
          <span>低碳</span>
          <span>高碳</span>
        </div>
      )}
    </div>
  );
}
