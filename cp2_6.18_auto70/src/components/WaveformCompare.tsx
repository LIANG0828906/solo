import { useState, useRef, useEffect } from 'react';
import { X, Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Version } from '@/types';
import Waveform from './Waveform';

interface WaveformCompareProps {
  oldVersion: Version;
  newVersion: Version;
  onClose: () => void;
}

const DURATION = 180;

export default function WaveformCompare({
  oldVersion,
  newVersion,
  onClose,
}: WaveformCompareProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = window.setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= DURATION) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 0.1;
        });
      }, 100);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying]);

  const handleSeek = (percent: number) => {
    setCurrentTime(percent * DURATION);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-bg-card rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-text-primary">
            版本对比：
            <span className="text-new-version">{newVersion.version}</span>
            <span className="text-text-secondary mx-1">vs</span>
            <span className="text-old-version">{oldVersion.version}</span>
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-bg-main text-text-secondary hover:text-text-primary transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-new-version font-medium">新版本 · {newVersion.version}</span>
            <span className="text-text-secondary">{newVersion.uploader}</span>
          </div>
          <Waveform
            data={newVersion.waveformData || []}
            color="#F97316"
            height={50}
            onSeek={handleSeek}
            currentTime={currentTime}
            duration={DURATION}
            showPlayhead
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-old-version font-medium">旧版本 · {oldVersion.version}</span>
            <span className="text-text-secondary">{oldVersion.uploader}</span>
          </div>
          <Waveform
            data={oldVersion.waveformData || []}
            color="#3B82F6"
            height={50}
            onSeek={handleSeek}
            currentTime={currentTime}
            duration={DURATION}
            showPlayhead
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
            isPlaying
              ? 'bg-accent text-bg-main hover:bg-accent/90'
              : 'bg-accent/10 text-accent hover:bg-accent/20'
          )}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {isPlaying ? '暂停' : '同步播放'}
        </button>
        <div className="text-xs text-text-secondary font-mono">
          {formatTime(currentTime)} / {formatTime(DURATION)}
        </div>
      </div>
    </div>
  );
}
