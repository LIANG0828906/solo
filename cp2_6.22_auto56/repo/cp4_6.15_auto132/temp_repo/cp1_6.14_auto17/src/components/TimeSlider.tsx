import { useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { usePlanetStore } from '@/store/useStore';

function getDateString(day: number): string {
  const start = new Date(new Date().getFullYear(), 0, 1);
  const target = new Date(start.getTime() + day * 86400000);
  return target.toLocaleDateString('zh-CN', {
    month: 'long',
    day: 'numeric',
  });
}

export default function TimeSlider() {
  const { currentDay, isPlaying, setCurrentDay, togglePlaying } = usePlanetStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleReset = useCallback(() => {
    setCurrentDay(0);
  }, [setCurrentDay]);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentDay(usePlanetStore.getState().currentDay >= 365 ? 0 : usePlanetStore.getState().currentDay + 1);
      }, 100);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, setCurrentDay]);

  const progress = (currentDay / 365) * 100;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/10">
      <div className="mx-auto max-w-5xl px-4 py-3 sm:px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={togglePlaying}
            className="glow-hover flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            aria-label={isPlaying ? '暂停' : '播放'}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </button>

          <button
            onClick={handleReset}
            className="glow-hover flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            aria-label="重置"
          >
            <RotateCcw size={16} />
          </button>

          <div className="relative flex-1">
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full transition-[width] duration-100"
                style={{
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, var(--accent-blue), var(--accent-purple), var(--accent-cyan))',
                }}
              />
            </div>
            <input
              type="range"
              min={0}
              max={365}
              value={currentDay}
              onChange={(e) => setCurrentDay(Number(e.target.value))}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              aria-label="时间滑块"
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 transition-[left] duration-100"
              style={{ left: `calc(${progress}% - 8px)` }}
            >
              <div className="h-4 w-4 rounded-full border-2 border-white/80 bg-[var(--accent-blue)] shadow-lg shadow-[var(--accent-blue)]/50" />
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-end font-mono-data text-sm">
            <span className="text-white">第 {currentDay} 天</span>
            <span className="text-xs text-[var(--text-secondary)]">{getDateString(currentDay)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
