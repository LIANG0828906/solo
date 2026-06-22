import { useEffect, useRef, useState } from 'react';
import { useLayoutStore } from '@/store/useLayoutStore';
import { TrendingUp } from 'lucide-react';

export function StatsDisplay() {
  const utilization = useLayoutStore((s) => s.utilization);
  const optimizationProgress = useLayoutStore((s) => s.optimizationProgress);
  const pieces = useLayoutStore((s) => s.pieces);
  const [displayUtil, setDisplayUtil] = useState(0);
  const animRef = useRef<number>(0);
  const prevUtil = useRef(0);

  useEffect(() => {
    const target = utilization;
    const start = prevUtil.current;
    const diff = target - start;
    const duration = 500;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayUtil(start + diff * eased);
      if (t < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        prevUtil.current = target;
      }
    };

    cancelAnimationFrame(animRef.current);
    animRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animRef.current);
  }, [utilization]);

  const percentage = (displayUtil * 100).toFixed(1);
  const isOptimizing = optimizationProgress.isRunning;
  const progress = optimizationProgress.currentIteration / optimizationProgress.totalIterations;

  const progressColor = `hsl(${progress * 120}, 80%, 50%)`;

  return (
    <div className="absolute bottom-24 right-4 flex flex-col items-end gap-2 z-10 pointer-events-none">
      {isOptimizing && (
        <div className="glass-panel rounded-lg p-3 w-48">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-white/60">优化进度</span>
            <span className="font-mono text-[10px] text-white/80">
              {optimizationProgress.currentIteration}/{optimizationProgress.totalIterations}
            </span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-200"
              style={{
                width: `${progress * 100}%`,
                backgroundColor: progressColor,
              }}
            />
          </div>
          <div className="mt-1 text-right">
            <span className="font-mono text-[10px]" style={{ color: progressColor }}>
              {(optimizationProgress.currentUtilization * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      )}

      <div className="glass-panel rounded-xl p-4 flex flex-col items-end">
        <div className="flex items-center gap-1.5 mb-1">
          <TrendingUp size={14} className="text-accent-green/60" />
          <span className="text-[10px] text-white/50 uppercase tracking-wider">利用率</span>
        </div>
        <div
          className="font-mono text-[32px] font-bold leading-none"
          style={{
            color: displayUtil > 0.6 ? '#00ff88' : displayUtil > 0.3 ? '#ffd93d' : '#ff4444',
            textShadow: '0 0 20px rgba(255,255,255,0.15)',
          }}
        >
          {percentage}
          <span className="text-lg ml-0.5">%</span>
        </div>
        <div className="text-[10px] text-white/40 mt-1">
          {pieces.length} 个切割件
        </div>
      </div>
    </div>
  );
}
