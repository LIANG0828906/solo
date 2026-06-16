import { useRef, useState, useCallback, useEffect } from 'react';
import { Play, Pause, SkipBack, Volume2 } from 'lucide-react';
import type { AudioPlayerState } from '../types';
import { COLORS } from '../utils/constants';

interface AudioPlayerUIProps {
  audioState: AudioPlayerState;
  onPlayPause: () => void;
  onSeek: (progress: number) => void;
  workTitle: string;
}

export function AudioPlayerUI({
  audioState,
  onPlayPause,
  onSeek,
  workTitle,
}: AudioPlayerUIProps) {
  const progressRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = useCallback(
    (clientX: number) => {
      if (!progressRef.current) return;
      const rect = progressRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const progress = x / rect.width;
      onSeek(progress);
    },
    [onSeek],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      setIsDragging(true);
      handleSeek(e.clientX);
    },
    [handleSeek],
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        handleSeek(e.clientX);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleSeek]);

  const waveformBars = 30;
  const progress = audioState.progress || 0;

  return (
    <div className="glass-card rounded-card p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center">
          <Volume2 className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary truncate">
            {workTitle}
          </p>
          <p className="text-xs text-text-secondary">
            {formatTime(audioState.currentTime)} / {formatTime(audioState.duration)}
          </p>
        </div>
      </div>

      <div
        ref={progressRef}
        className={`
          relative h-16 rounded-lg bg-black/20 cursor-pointer
          overflow-hidden
          ${audioState.isPlaying ? 'animate-pulse-glow' : ''}
        `}
        onMouseDown={handleMouseDown}
      >
        <div className="absolute inset-0 flex items-center justify-center gap-0.5 px-2">
          {Array.from({ length: waveformBars }).map((_, i) => {
            const barProgress = (i + 1) / waveformBars;
            const isActive = barProgress <= progress;
            const height = 20 + Math.sin(i * 0.8) * 15 + Math.cos(i * 0.5) * 10;

            return (
              <div
                key={i}
                className="flex-1 rounded-full transition-all duration-100"
                style={{
                  height: `${Math.max(10, Math.min(40, height))}%`,
                  backgroundColor: isActive ? COLORS.waveformColor : 'rgba(255,255,255,0.15)',
                  boxShadow: isActive && audioState.isPlaying
                    ? `0 0 8px ${COLORS.waveformGlow}`
                    : 'none',
                  opacity: isActive ? 1 : 0.6,
                }}
              />
            );
          })}
        </div>

        <div
          className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white shadow-lg pointer-events-none transition-all duration-75"
          style={{
            left: `calc(${progress * 100}% - 10px)`,
            boxShadow: '0 0 12px rgba(96, 165, 250, 0.8)',
          }}
        />
      </div>

      <div className="flex items-center justify-center gap-4 mt-3">
        <button
          onClick={() => onSeek(0)}
          className="p-2 rounded-full hover:bg-white/10 transition-all duration-200 hover:scale-110 active:scale-95"
          title="重新播放"
        >
          <SkipBack className="w-5 h-5 text-text-secondary" />
        </button>

        <button
          onClick={onPlayPause}
          className="w-12 h-12 rounded-full bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center shadow-glow hover:scale-105 active:scale-95 transition-all duration-200"
        >
          {audioState.isPlaying ? (
            <Pause className="w-5 h-5 text-white" />
          ) : (
            <Play className="w-5 h-5 text-white ml-0.5" />
          )}
        </button>

        <div className="w-9" />
      </div>
    </div>
  );
}
