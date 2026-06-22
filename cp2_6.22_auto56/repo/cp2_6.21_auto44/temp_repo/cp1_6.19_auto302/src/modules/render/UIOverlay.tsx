import React, { useMemo } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { TRACK_COLORS } from '../../types/game';

interface UIOverlayProps {
  onStart: () => Promise<void>;
}

export const UIOverlay: React.FC<UIOverlayProps> = ({ onStart }) => {
  const {
    score,
    combo,
    maxCombo,
    perfectCount,
    goodCount,
    missCount,
    isPlaying,
    isEnded,
    notes,
    currentTime,
    comboShake,
    missFlash,
  } = useGameStore((s) => ({
    score: s.score,
    combo: s.combo,
    maxCombo: s.maxCombo,
    perfectCount: s.perfectCount,
    goodCount: s.goodCount,
    missCount: s.missCount,
    isPlaying: s.isPlaying,
    isEnded: s.isEnded,
    notes: s.notes,
    currentTime: s.currentTime,
    comboShake: s.comboShake,
    missFlash: s.missFlash,
  }));

  const total = perfectCount + goodCount + missCount;
  const upcoming = useMemo(() => {
    const future = notes
      .filter((n) => !n.judged && n.hitTime > currentTime)
      .sort((a, b) => a.hitTime - b.hitTime)
      .slice(0, 3);
    return future;
  }, [notes, currentTime]);

  const rating = useMemo((): string => {
    if (total === 0) return '-';
    const perfectRate = perfectCount / total;
    const goodRate = goodCount / total;
    const acc = perfectRate + goodRate * 0.5;
    if (acc >= 0.95 && missCount === 0) return 'S';
    if (acc >= 0.85) return 'A';
    if (acc >= 0.7) return 'B';
    return 'C';
  }, [perfectCount, goodCount, missCount, total]);

  const now = performance.now();
  const shakeProgress = comboShake ? Math.min(1, (now - comboShake) / 400) : 1;
  const flashProgress = missFlash ? Math.min(1, (now - missFlash) / 300) : 1;
  const comboScale = 1 + (1 - shakeProgress) * 0.6;
  const comboShakeX = (Math.random() - 0.5) * (1 - shakeProgress) * 8;

  const handleStart = onStart;

  const handleRestart = () => {
    window.location.reload();
  };

  const ratingColors: Record<string, string> = {
    S: 'text-yellow-400',
    A: 'text-green-400',
    B: 'text-blue-400',
    C: 'text-gray-400',
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {missFlash && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            boxShadow: `inset 0 0 120px 40px rgba(231,76,60,${(1 - flashProgress) * 0.8})`,
          }}
        />
      )}

      {!isPlaying && !isEnded && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-auto bg-black/60 backdrop-blur-sm">
          <div className="text-center px-10 py-12 rounded-3xl border border-white/10" style={{ background: 'rgba(15,15,45,0.9)' }}>
            <h1 className="text-5xl font-black mb-3 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              MICRO RHYTHM
            </h1>
            <p className="text-white/60 mb-8 text-lg tracking-wide">三轨道节奏挑战 · 约30秒</p>
            <div className="grid grid-cols-3 gap-6 mb-8 text-white/80 text-sm">
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ background: TRACK_COLORS[0] }}>
                  ●
                </div>
                <span className="text-white/60">D / F 键</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ background: TRACK_COLORS[1] }}>
                  ◆
                </div>
                <span className="text-white/60">轨道 2</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ background: TRACK_COLORS[2] }}>
                  ▲
                </div>
                <span className="text-white/60">J / K 键</span>
              </div>
            </div>
            <div className="text-white/50 text-xs mb-6 space-y-1">
              <p>圆形 = 点击 · 菱形 = 长按 · 三角 = 上下方向键滑动</p>
              <p>Perfect ±30ms / Good ±80ms</p>
            </div>
            <button
              onClick={handleStart}
              className="px-10 py-4 rounded-2xl text-white text-xl font-bold tracking-wider shadow-lg shadow-purple-500/30 transition-all hover:scale-105 hover:shadow-purple-500/50 active:scale-95"
              style={{ background: 'linear-gradient(135deg,#6366F1,#A855F7,#EC4899)' }}
            >
              ▶ 开始游戏
            </button>
          </div>
        </div>
      )}

      <div className="absolute top-6 left-0 right-0 flex justify-between px-10 items-start">
        <div className="text-white">
          <div className="text-xs uppercase tracking-widest text-white/40 mb-1">Score</div>
          <div className="text-4xl font-black tabular-nums" style={{ textShadow: '0 2px 20px rgba(99,102,241,0.4)' }}>
            {score.toString().padStart(7, '0')}
          </div>
        </div>

        <div
          className="text-center"
          style={{
            transform: `translateX(${comboShakeX}px) scale(${comboScale})`,
            transition: 'transform 0.05s ease-out',
          }}
        >
          {combo >= 2 && (
            <>
              <div className="text-xs uppercase tracking-widest text-amber-300/70 mb-0.5">Combo</div>
              <div
                className="text-6xl font-black tabular-nums"
                style={{
                  background: combo >= 10 ? 'linear-gradient(135deg,#F1C40F,#E67E22,#F1C40F)' : '#fff',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: combo >= 10 ? 'transparent' : undefined,
                  filter: combo >= 10 ? `drop-shadow(0 0 12px rgba(241,196,15,${(1 - shakeProgress) * 0.8 + 0.3}))` : 'none',
                }}
              >
                {combo}
              </div>
            </>
          )}
        </div>

        <div className="text-right text-white">
          <div className="text-xs uppercase tracking-widest text-white/40 mb-1">Max Combo</div>
          <div className="text-2xl font-bold tabular-nums text-white/80">{maxCombo}</div>
        </div>
      </div>

      <div className="absolute left-5 top-1/2 -translate-y-1/2 flex flex-col gap-2">
        <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1 px-1">Preview</div>
        <div className="relative w-5 h-64 rounded-full border border-white/10 overflow-hidden" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <div
            className="absolute left-0 right-0 h-0.5 bg-white/40"
            style={{ top: `${(2 / 3) * 100}%` }}
          />
          {upcoming.map((n, i) => {
            const range = 3000;
            const t = Math.max(0, (n.hitTime - currentTime) / range);
            const top = (2 / 3) - (2 / 3) * t;
            return (
              <div
                key={n.id}
                className="absolute left-1/2 -translate-x-1/2 w-3 h-1.5 rounded-sm"
                style={{
                  top: `${top * 100}%`,
                  background: TRACK_COLORS[n.track],
                  opacity: 0.4 + i * 0.2,
                }}
              />
            );
          })}
        </div>
      </div>

      {isEnded && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-auto bg-black/70 backdrop-blur-md">
          <div className="px-12 py-10 rounded-3xl border border-white/10 w-[480px]" style={{ background: 'rgba(15,15,45,0.95)' }}>
            <h2 className="text-center text-2xl font-bold text-white/80 tracking-widest mb-6 uppercase">Result</h2>

            <div className="text-center mb-8">
              <div className={`text-8xl font-black ${ratingColors[rating]} drop-shadow-2xl mb-2`} style={{ filter: 'drop-shadow(0 4px 20px currentColor)' }}>
                {rating}
              </div>
              <div className="text-3xl font-black tabular-nums text-white mb-1">{score.toLocaleString()}</div>
              <div className="text-white/50 text-sm">TOTAL SCORE</div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="rounded-xl p-4 bg-white/5 border border-white/5">
                <div className="text-xs text-white/40 mb-1">最高连击</div>
                <div className="text-2xl font-bold text-white tabular-nums">{maxCombo}</div>
              </div>
              <div className="rounded-xl p-4 bg-white/5 border border-white/5">
                <div className="text-xs text-white/40 mb-1">总判定</div>
                <div className="text-2xl font-bold text-white tabular-nums">{total}</div>
              </div>
            </div>

            <div className="space-y-3 mb-8">
              {(['perfect', 'good', 'miss'] as const).map((grade) => {
                const count = grade === 'perfect' ? perfectCount : grade === 'good' ? goodCount : missCount;
                const pct = total ? (count / total) * 100 : 0;
                const colors = { perfect: '#F1C40F', good: '#BDC3C7', miss: '#E74C3C' };
                const labels = { perfect: 'PERFECT', good: 'GOOD', miss: 'MISS' };
                return (
                  <div key={grade}>
                    <div className="flex justify-between text-sm mb-1">
                      <span style={{ color: colors[grade] }} className="font-bold">{labels[grade]}</span>
                      <span className="text-white/80 tabular-nums">{count} <span className="text-white/40">({pct.toFixed(1)}%)</span></span>
                    </div>
                    <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: colors[grade] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={handleRestart}
              className="w-full py-4 rounded-2xl text-white text-lg font-bold tracking-wider transition-all hover:scale-[1.02] active:scale-95"
              style={{ background: 'linear-gradient(135deg,#6366F1,#A855F7,#EC4899)' }}
            >
              ↻ 再来一次
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
