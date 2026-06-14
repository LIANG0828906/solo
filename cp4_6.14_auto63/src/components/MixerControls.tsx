import { useRef, useState, useCallback } from 'react';
import { useMixerStore } from '@store/useStore';
import { useAudioEngine } from '@hooks/useAudioEngine';

export function MixerControls() {
  const playback = useMixerStore((state) => state.playback);
  const { play, pause, stop, seek, setBPM } = useAudioEngine();

  const progressRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  };

  const handlePlayPause = () => {
    if (playback.isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const handleStop = () => {
    stop();
  };

  const handleSeek = useCallback(
    (clientX: number) => {
      if (!progressRef.current || playback.duration === 0) return;
      const rect = progressRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, x / rect.width));
      seek(ratio * playback.duration);
    },
    [playback.duration, seek],
  );

  const handleProgressMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handleSeek(e.clientX);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    handleSeek(e.clientX);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleSeek]);

  const handleBPMChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    if (!isNaN(value) && value >= 20 && value <= 300) {
      setBPM(value);
    }
  };

  const progressPercent = playback.duration > 0
    ? (playback.currentTime / playback.duration) * 100
    : 0;

  return (
    <div
      style={{
        height: '64px',
        backgroundColor: '#1e293b',
        borderTop: '1px solid #334155',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        gap: '20px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          onClick={handleStop}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            backgroundColor: '#334155',
            color: '#94a3b8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#475569';
            e.currentTarget.style.color = '#e2e8f0';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#334155';
            e.currentTarget.style.color = '#94a3b8';
          }}
          title="停止"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="6" width="12" height="12" />
          </svg>
        </button>

        <button
          onClick={handlePlayPause}
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            backgroundColor: playback.isPlaying ? '#3b82f6' : '#ffffff',
            color: playback.isPlaying ? '#ffffff' : '#1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
            boxShadow: playback.isPlaying
              ? '0 0 20px rgba(59, 130, 246, 0.5)'
              : '0 2px 8px rgba(0, 0, 0, 0.2)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
          title={playback.isPlaying ? '暂停' : '播放'}
        >
          {playback.isPlaying ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5,3 19,12 5,21" />
            </svg>
          )}
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div
          ref={progressRef}
          onMouseDown={handleProgressMouseDown}
          style={{
            position: 'relative',
            height: '8px',
            backgroundColor: '#475569',
            borderRadius: '4px',
            cursor: 'pointer',
            overflow: 'visible',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              height: '100%',
              width: `${progressPercent}%`,
              backgroundColor: '#a855f7',
              borderRadius: '4px',
              transition: isDragging ? 'none' : 'width 0.05s linear',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: `${progressPercent}%`,
              transform: 'translate(-50%, -50%)',
              width: '16px',
              height: '16px',
              backgroundColor: '#ffffff',
              borderRadius: '50%',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
              transition: isDragging ? 'none' : 'left 0.05s linear',
            }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '14px', color: '#94a3b8', fontFamily: 'monospace' }}>
            {formatTime(playback.currentTime)}
          </span>
          <span style={{ fontSize: '14px', color: '#94a3b8', fontFamily: 'monospace' }}>
            {formatTime(playback.duration)}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '12px', color: '#94a3b8' }}>BPM</span>
        <input
          type="number"
          value={playback.bpm}
          onChange={handleBPMChange}
          min={20}
          max={300}
          step={1}
          style={{
            width: '60px',
            height: '32px',
            padding: '0 8px',
            backgroundColor: '#334155',
            border: '1px solid #475569',
            borderRadius: '6px',
            color: '#e2e8f0',
            fontSize: '13px',
            textAlign: 'center',
            outline: 'none',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#a855f7';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#475569';
          }}
        />
      </div>
    </div>
  );
}
