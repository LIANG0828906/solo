import React, { useEffect, useRef } from 'react';
import { useTimelineStore } from '@/store/timelineStore';

export default function PlayerPanel() {
  const nodes = useTimelineStore((s) => s.nodes);
  const isPlaying = useTimelineStore((s) => s.isPlaying);
  const playbackSpeed = useTimelineStore((s) => s.playbackSpeed);
  const playingIndex = useTimelineStore((s) => s.playingIndex);
  const togglePlay = useTimelineStore((s) => s.togglePlay);
  const setPlaybackSpeed = useTimelineStore((s) => s.setPlaybackSpeed);
  const setPlayingIndex = useTimelineStore((s) => s.setPlayingIndex);
  const resetPlayback = useTimelineStore((s) => s.resetPlayback);

  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isPlaying || nodes.length === 0) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    const intervalBase = 1500 / playbackSpeed;
    const startTime = performance.now() - playingIndex * intervalBase;

    const tick = () => {
      const elapsed = performance.now() - startTime;
      const newIdx = Math.floor(elapsed / intervalBase);

      if (newIdx !== playingIndex && newIdx < nodes.length) {
        setPlayingIndex(newIdx);
      }

      if (newIdx >= nodes.length) {
        resetPlayback();
        setTimeout(() => window.alert('播放完成！所有节点已展示完毕。'), 50);
        rafRef.current = null;
        return;
      }

      if (isPlaying && playingIndex < nodes.length - 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else if (isPlaying) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isPlaying, nodes.length, playbackSpeed, playingIndex, setPlayingIndex, resetPlayback]);

  const maxIndex = Math.max(0, nodes.length - 1);

  return (
    <div
      style={{
        height: 60,
        background: '#16213e',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        gap: 16,
      }}
    >
      <button
        onClick={togglePlay}
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: '#e94560',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          fontSize: 16,
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.1s',
        }}
        onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
        onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      >
        {isPlaying ? '❚❚' : '▶'}
      </button>

      <input
        type="range"
        min={0}
        max={maxIndex}
        value={playingIndex}
        onChange={(e) => setPlayingIndex(Number(e.target.value))}
        style={{
          flex: 1,
          height: 6,
          appearance: 'none',
          WebkitAppearance: 'none',
          background: '#0f3460',
          borderRadius: 3,
          outline: 'none',
          cursor: 'pointer',
        }}
      />
      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #16c79a;
          cursor: pointer;
          border: none;
        }
        input[type="range"]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #16c79a;
          cursor: pointer;
          border: none;
        }
      `}</style>

      <div style={{ display: 'flex', gap: 8 }}>
        {[1, 1.5, 2].map((speed) => (
          <button
            key={speed}
            onClick={() => setPlaybackSpeed(speed as 1 | 1.5 | 2)}
            style={{
              width: 40,
              height: 28,
              borderRadius: 6,
              border: 'none',
              cursor: 'pointer',
              fontSize: 12,
              background: playbackSpeed === speed ? '#16c79a' : '#0f3460',
              color: playbackSpeed === speed ? 'white' : '#aaa',
              fontWeight: 'bold',
              transition: 'background 0.2s, transform 0.1s',
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            {speed}x
          </button>
        ))}
      </div>

      <button
        onClick={resetPlayback}
        style={{
          width: 40,
          height: 32,
          borderRadius: 8,
          border: 'none',
          cursor: 'pointer',
          background: '#0f3460',
          color: 'white',
          fontSize: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.2s, transform 0.1s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#e94560')}
        onMouseLeave={(e) => (e.currentTarget.style.background = '#0f3460')}
        onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
        onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      >
        ↺
      </button>
    </div>
  );
}
