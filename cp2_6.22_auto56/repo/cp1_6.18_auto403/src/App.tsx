import React, { useEffect, useState } from 'react';
import { PianoRoll } from './components/PianoRoll';
import { ControlPanel } from './components/ControlPanel';
import { SpectrumVisualizer } from './components/SpectrumVisualizer';
import { useMusicStore } from './store';
import { AudioEngine } from './components/AudioEngine';

const PlayIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const PauseIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
  </svg>
);

const StopIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="6" width="12" height="12" rx="2" />
  </svg>
);

export const App: React.FC = () => {
  const playback = useMusicStore((s) => s.playback);
  const notes = useMusicStore((s) => s.notes);
  const play = useMusicStore((s) => s.play);
  const pause = useMusicStore((s) => s.pause);
  const stop = useMusicStore((s) => s.stop);
  const setCurrentTime = useMusicStore((s) => s.setCurrentTime);
  const [viewportWidth, setViewportWidth] = useState<number>(600);

  useEffect(() => {
    const updateViewport = () => {
      const width = window.innerWidth;
      if (width < 768) setViewportWidth(Math.min(600, width - 32));
      else if (width < 1024) setViewportWidth(540);
      else setViewportWidth(600);
    };
    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  useEffect(() => {
    const engine = AudioEngine.getInstance();
    engine.onTimeUpdate = (t) => setCurrentTime(t);
    engine.onPlayEnd = () => {
      useMusicStore.setState((state) => ({
        playback: { ...state.playback, isPlaying: false, isPaused: false, currentTime: 0 },
      }));
    };
    return () => {
      engine.onTimeUpdate = null;
      engine.onPlayEnd = null;
    };
  }, [setCurrentTime]);

  const handlePlayPause = () => {
    if (notes.length === 0) return;
    if (playback.isPlaying) pause();
    else play();
  };

  const hasNotes = notes.length > 0;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0D0D1A',
        color: '#E0E0F0',
        padding: '32px 16px',
        boxSizing: 'border-box',
        fontFamily:
          '"Segoe UI", -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 24,
      }}
    >
      <header style={{ textAlign: 'center', marginBottom: 4 }}>
        <h1
          style={{
            margin: 0,
            fontSize: 28,
            fontWeight: 700,
            background: 'linear-gradient(135deg, #00D4AA 0%, #4A9EFF 50%, #FF6B35 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: 2,
          }}
        >
          ♪ 旋律工坊
        </h1>
        <p style={{ margin: '8px 0 0', color: '#8888A0', fontSize: 13 }}>
          点击卷帘添加音符 · 拖拽调整 · 随时试听 · 导出 MIDI
        </p>
      </header>

      <div
        style={{
          width: viewportWidth,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 14,
          background: '#1A1A2E',
          borderRadius: 12,
          padding: '12px 20px',
          boxSizing: 'border-box',
          border: '1px solid #2A2A3E',
        }}
      >
        <button
          onClick={handlePlayPause}
          disabled={!hasNotes}
          style={{
            width: 46,
            height: 46,
            borderRadius: '50%',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: hasNotes ? 'pointer' : 'not-allowed',
            transition: 'all 0.15s',
            background: playback.isPlaying
              ? 'linear-gradient(135deg, #00D4AA 0%, #00B894 100%)'
              : '#2A2A3E',
            color: playback.isPlaying ? '#FFFFFF' : '#E0E0F0',
            opacity: hasNotes ? 1 : 0.45,
            boxShadow: playback.isPlaying ? '0 0 16px rgba(0,212,170,0.4)' : 'none',
          }}
          onMouseOver={(e) => {
            if (hasNotes && !playback.isPlaying) {
              (e.currentTarget as HTMLButtonElement).style.background = '#3A3A4E';
            }
          }}
          onMouseOut={(e) => {
            if (!playback.isPlaying) {
              (e.currentTarget as HTMLButtonElement).style.background = '#2A2A3E';
            }
          }}
          title={playback.isPlaying ? '暂停' : '播放'}
        >
          {playback.isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>

        <button
          onClick={stop}
          disabled={!playback.isPlaying && !playback.isPaused && playback.currentTime === 0}
          style={{
            width: 42,
            height: 42,
            borderRadius: '50%',
            border: '1px solid rgba(255,68,68,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s',
            background: '#22223A',
            color: '#FF4444',
            opacity: playback.isPlaying || playback.isPaused || playback.currentTime > 0 ? 1 : 0.5,
          }}
          onMouseOver={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,68,68,0.15)';
          }}
          onMouseOut={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = '#22223A';
          }}
          title="停止"
        >
          <StopIcon />
        </button>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              flex: 1,
              height: 4,
              background: '#2A2A3E',
              borderRadius: 2,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: `${(playback.currentTime / 8) * 100}%`,
                background: 'linear-gradient(90deg, #00D4AA, #FF6B35)',
                borderRadius: 2,
                transition: 'width 0.05s linear',
              }}
            />
          </div>
          <span
            style={{
              color: '#8888A0',
              fontSize: 12,
              fontVariantNumeric: 'tabular-nums',
              minWidth: 60,
              textAlign: 'right',
            }}
          >
            {playback.currentTime.toFixed(1)} / 8.0s
          </span>
        </div>
      </div>

      <PianoRoll />
      <SpectrumVisualizer />
      <ControlPanel />

      <div
        style={{
          marginTop: 16,
          color: '#55556E',
          fontSize: 11,
          textAlign: 'center',
          maxWidth: 600,
          lineHeight: 1.7,
        }}
      >
        <div>提示：点击网格添加音符 · 拖拽音符主体移动位置 · 拖拽边缘调整时长 · 按住 Shift 多选 · Delete 键删除选中</div>
      </div>
    </div>
  );
};
