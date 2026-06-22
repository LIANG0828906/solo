import { useRef, useState, useCallback, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import useVisualizerStore from '@/store/useVisualizerStore';
import { cn } from '@/lib/utils';
import { getAverageLevel } from '@/utils/audioUtils';

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function Timeline() {
  const {
    spectrumData,
    currentFrame,
    isPlaying,
    loopStart,
    loopEnd,
    setCurrentFrame,
    setPlaying,
    setLoopStart,
    setLoopEnd,
  } = useVisualizerStore();

  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const totalFrames = spectrumData?.frameCount || 0;
  const duration = spectrumData?.duration || 0;
  const currentTime = totalFrames > 0 ? (currentFrame / totalFrames) * duration : 0;

  const getFrameFromPosition = useCallback(
    (clientX: number): number => {
      if (!trackRef.current || totalFrames === 0) return 0;
      const rect = trackRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, x / rect.width));
      return Math.floor(ratio * totalFrames);
    },
    [totalFrames]
  );

  const handleTrackClick = useCallback(
    (e: React.MouseEvent) => {
      const frame = getFrameFromPosition(e.clientX);
      setCurrentFrame(frame);
    },
    [getFrameFromPosition, setCurrentFrame]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsDragging(true);
      const frame = getFrameFromPosition(e.clientX);
      setCurrentFrame(frame);
    },
    [getFrameFromPosition, setCurrentFrame]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const frame = getFrameFromPosition(e.clientX);
      setCurrentFrame(frame);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, getFrameFromPosition, setCurrentFrame]);

  const handleLoopStart = () => {
    if (currentFrame > 0) {
      setLoopStart(currentFrame);
    }
  };

  const handleLoopEnd = () => {
    if (currentFrame < totalFrames) {
      setLoopEnd(currentFrame);
    }
  };

  const togglePlay = () => {
    setPlaying(!isPlaying);
  };

  const progressPercent = totalFrames > 0 ? (currentFrame / totalFrames) * 100 : 0;
  const loopStartPercent = loopStart !== null && totalFrames > 0 ? (loopStart / totalFrames) * 100 : 0;
  const loopEndPercent = loopEnd !== null && totalFrames > 0 ? (loopEnd / totalFrames) * 100 : 100;

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 mb-2">
        <button
          onClick={togglePlay}
          disabled={!spectrumData}
          className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200',
            spectrumData
              ? 'bg-cyan-500 hover:bg-cyan-400 text-white'
              : 'bg-white/10 text-white/30 cursor-not-allowed'
          )}
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={handleLoopStart}
            disabled={!spectrumData}
            className="p-1.5 rounded text-white/50 hover:text-white/80 transition-colors disabled:opacity-30"
            title="设置循环起点"
          >
            <SkipBack size={16} />
          </button>
          <button
            onClick={handleLoopEnd}
            disabled={!spectrumData}
            className="p-1.5 rounded text-white/50 hover:text-white/80 transition-colors disabled:opacity-30"
            title="设置循环终点"
          >
            <SkipForward size={16} />
          </button>
        </div>

        <div className="flex-1" />

        <span className="text-xs text-white/60 font-mono">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>

      <div
        ref={trackRef}
        onClick={handleTrackClick}
        className="relative w-full h-12 bg-white/5 rounded-lg cursor-pointer overflow-hidden border border-white/10"
      >
        <div className="absolute inset-0 flex items-center px-1 gap-px">
          {spectrumData &&
            spectrumData.frames.map((frame, i) => {
              const level = getAverageLevel(frame);
              const height = Math.max(2, level * 40);
              return (
                <div
                  key={i}
                  className="flex-1 bg-cyan-400/30 rounded-sm"
                  style={{ height: `${height}px`, minWidth: '1px' }}
                />
              );
            })}
        </div>

        {(loopStart !== null || loopEnd !== null) && (
          <div
            className="absolute top-0 bottom-0 bg-cyan-500/20 border-x border-cyan-500/50"
            style={{
              left: `${loopStartPercent}%`,
              width: `${loopEndPercent - loopStartPercent}%`,
            }}
          />
        )}

        <div
          className="absolute top-0 bottom-0 w-0.5 bg-cyan-400"
          style={{ left: `${progressPercent}%` }}
        />

        <div
          onMouseDown={handleMouseDown}
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-white rounded-full shadow-lg cursor-grab active:cursor-grabbing border-2 border-cyan-400 hover:scale-125 transition-transform"
          style={{ left: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}
