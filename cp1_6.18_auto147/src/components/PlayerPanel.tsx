import { useState, useCallback } from 'react';
import { Play, Pause, SkipForward, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { VinylRecord, AudioState } from '@/types';
import SpectrumVisualizer from './SpectrumVisualizer';

interface PlayerPanelProps {
  record: VinylRecord | null;
  audioState: AudioState;
  onPlayPause: () => void;
  onNext: () => void;
  onSeek: (progress: number) => void;
  onFavorite: () => void;
  isFavorite: boolean;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export default function PlayerPanel({
  record,
  audioState,
  onPlayPause,
  onNext,
  onSeek,
  onFavorite,
  isFavorite,
}: PlayerPanelProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const progress = audioState.duration > 0
    ? (audioState.currentTime / audioState.duration) * 100
    : 0;

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const mouseX = e.clientX - centerX;
      const mouseY = e.clientY - centerY;

      let angle = Math.atan2(mouseY, mouseX) * (180 / Math.PI) + 90;
      if (angle < 0) angle += 360;

      const newProgress = angle / 360;
      onSeek(newProgress);
    },
    [onSeek]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      setIsDragging(true);
      handleProgressClick(e);
    },
    [handleProgressClick]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!isDragging) return;
      handleProgressClick(e);
    },
    [isDragging, handleProgressClick]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFavoriteClick = useCallback(() => {
    setIsAnimating(true);
    onFavorite();
    setTimeout(() => setIsAnimating(false), 200);
  }, [onFavorite]);

  if (!record) {
    return (
      <div className="w-[360px] bg-[var(--bg-secondary)] rounded-2xl p-6 flex items-center justify-center">
        <p className="text-gray-400">未选择唱片</p>
      </div>
    );
  }

  return (
    <div
      className="w-[360px] bg-[var(--bg-secondary)] rounded-2xl p-6 animate-slide-up"
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold text-white font-display mb-1">
          {record.title}
        </h2>
        <p className="text-gray-400">{record.artist}</p>
        <p className="text-gray-500 text-sm">{record.year}</p>
      </div>

      <div className="relative w-48 h-48 mx-auto mb-6">
        <svg
          className="w-full h-full cursor-pointer"
          viewBox="0 0 100 100"
          onClick={handleProgressClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
        >
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#E94560" />
              <stop offset="100%" stopColor="#0F3460" />
            </linearGradient>
          </defs>

          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="var(--bg-tertiary)"
            strokeWidth="6"
          />

          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="url(#progressGradient)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 45}`}
            strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
            transform="rotate(-90 50 50)"
          />

          {progress > 0 && (
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="transparent"
              strokeWidth="10"
            />
          )}
        </svg>

        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="w-32 h-32 rounded-full"
            style={{ backgroundColor: record.coverColor }}
          >
            <div className="w-full h-full rounded-full bg-gradient-to-br from-white/20 to-transparent flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-gray-700" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center mb-4">
        <SpectrumVisualizer data={audioState.frequencyData} barCount={32} />
      </div>

      <div className="flex justify-center gap-4 mb-4">
        <button
          onClick={onPlayPause}
          className="w-14 h-14 rounded-full bg-[var(--accent)] text-white flex items-center justify-center hover:bg-[var(--accent-light)] transition-colors shadow-lg"
        >
          {audioState.isPlaying ? (
            <Pause className="w-6 h-6" />
          ) : (
            <Play className="w-6 h-6 ml-1" />
          )}
        </button>

        <button
          onClick={onNext}
          className="w-12 h-12 rounded-full bg-[var(--bg-tertiary)] text-white flex items-center justify-center hover:bg-[var(--accent-purple)] transition-colors"
        >
          <SkipForward className="w-5 h-5" />
        </button>

        <button
          onClick={handleFavoriteClick}
          className={cn(
            'w-12 h-12 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center hover:bg-[var(--accent-purple)] transition-colors',
            isAnimating && 'animate-heart'
          )}
        >
          <Heart
            className={cn(
              'w-5 h-5 transition-colors',
              isFavorite ? 'text-[var(--accent)] fill-[var(--accent)]' : 'text-white'
            )}
          />
        </button>
      </div>

      <div className="flex justify-between text-sm text-gray-400 px-4">
        <span>{formatTime(audioState.currentTime)}</span>
        <span>{formatTime(audioState.duration)}</span>
      </div>
    </div>
  );
}
