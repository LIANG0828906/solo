import React from 'react';
import { useStore } from '@/store/useStore';
import type { PlaybackSpeed } from '@/types/story';

interface PlayerControlsProps {
  onExit: () => void;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({ onExit }) => {
  const {
    story,
    currentPanelIndex,
    playbackStatus,
    playbackSpeed,
    setCurrentPanelIndex,
    play,
    pause,
    nextPanel,
    prevPanel,
    setPlaybackSpeed,
  } = useStore();

  const totalPanels = story.panels.length;
  const progress = totalPanels > 1 ? (currentPanelIndex / (totalPanels - 1)) * 100 : 100;

  const speeds: PlaybackSpeed[] = [1, 1.5, 2];

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = x / rect.width;
    const idx = Math.round(pct * (totalPanels - 1));
    setCurrentPanelIndex(Math.max(0, Math.min(totalPanels - 1, idx)));
  };

  return (
    <div
      className="absolute bottom-0 left-0 right-0 z-50 px-6 py-5"
      style={{
        background: 'linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0.4), transparent)',
      }}
    >
      <div
        className="relative h-3 rounded-full mb-4 cursor-pointer"
        style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
        onClick={handleProgressClick}
      >
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all duration-300"
          style={{ width: `${progress}%`, backgroundColor: '#E63946' }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full shadow-lg transition-all duration-300"
          style={{
            left: `calc(${progress}% - 10px)`,
            backgroundColor: 'white',
            border: '3px solid #E63946',
          }}
        />
        <div className="absolute inset-0 flex justify-between items-center px-1 pointer-events-none">
          {story.panels.map((_, idx) => (
            <div
              key={idx}
              className="w-2.5 h-2.5 rounded-full transition-all"
              style={{
                backgroundColor: idx <= currentPanelIndex ? '#E63946' : 'rgba(255,255,255,0.5)',
              }}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between text-white">
        <button
          onClick={onExit}
          className="px-4 py-2 rounded-xl transition-all hover:bg-white/10 text-lg"
          style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
          title="退出播放"
        >
          ✕ 退出
        </button>

        <div className="flex items-center gap-4">
          <button
            onClick={prevPanel}
            disabled={currentPanelIndex === 0}
            className="w-11 h-11 rounded-full flex items-center justify-center text-xl transition-all hover:bg-white/10 disabled:opacity-30"
            style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
            title="上一个"
          >
            ⏮
          </button>

          <button
            onClick={playbackStatus === 'playing' ? pause : play}
            className="w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-xl transition-all hover:scale-105"
            style={{ backgroundColor: '#E63946' }}
            title={playbackStatus === 'playing' ? '暂停' : '播放'}
          >
            {playbackStatus === 'playing' ? '⏸' : '▶'}
          </button>

          <button
            onClick={nextPanel}
            disabled={currentPanelIndex >= totalPanels - 1 && playbackStatus === 'finished'}
            className="w-11 h-11 rounded-full flex items-center justify-center text-xl transition-all hover:bg-white/10 disabled:opacity-30"
            style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
            title="下一个"
          >
            ⏭
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 p-1 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
            {speeds.map((s) => (
              <button
                key={s}
                onClick={() => setPlaybackSpeed(s)}
                className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
                  playbackSpeed === s ? 'text-white' : 'text-white/60 hover:text-white'
                }`}
                style={playbackSpeed === s ? { backgroundColor: '#E63946' } : {}}
              >
                {s}x
              </button>
            ))}
          </div>
          <div
            className="font-bangers text-2xl px-4 py-2 rounded-xl"
            style={{ backgroundColor: 'rgba(255,255,255,0.08)', letterSpacing: '2px' }}
          >
            <span style={{ color: '#E63946' }}>{currentPanelIndex + 1}</span>
            <span className="text-white/60"> / {totalPanels}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
