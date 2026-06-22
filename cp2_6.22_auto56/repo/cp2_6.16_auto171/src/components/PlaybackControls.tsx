import React, { useState } from 'react';
import { useAnimStore } from '../store';
import { Play, Pause, RotateCcw, Gauge } from 'lucide-react';

interface PlaybackControlsProps {
  onReset: () => void;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({ onReset }) => {
  const preview = useAnimStore(s => s.preview);
  const setPreview = useAnimStore(s => s.setPreview);
  const blocks = useAnimStore(s => s.blocks);

  const [resetAnimating, setResetAnimating] = useState(false);
  const [playScale, setPlayScale] = useState(false);

  const hasShapes = blocks.some(b => b.type === 'shape');
  const hasAnimations = blocks.some(b => b.type === 'animation');
  const canPlay = hasShapes;

  const togglePlay = () => {
    if (!canPlay) return;
    setPlayScale(true);
    setTimeout(() => setPlayScale(false), 150);
    setPreview({ isPlaying: !preview.isPlaying });
  };

  const handleReset = () => {
    setResetAnimating(true);
    setPreview({ isPlaying: false, currentTime: 0 });
    onReset();
    setTimeout(() => setResetAnimating(false), 500);
  };

  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const speed = Number(e.target.value);
    setPreview({ speed });
  };

  const speedMarks = [0.5, 1, 1.5, 2, 2.5, 3];
  const closestMark = speedMarks.reduce((prev, curr) =>
    Math.abs(curr - preview.speed) < Math.abs(prev - preview.speed) ? curr : prev
  );

  return (
    <div className="relative z-10 flex items-center gap-3 p-2.5 rounded-2xl bg-[#16213e]/80 backdrop-blur-md border border-white/5">
      <button
        onClick={togglePlay}
        disabled={!canPlay}
        className={`
          relative w-11 h-11 rounded-full flex items-center justify-center
          transition-all duration-150 flex-shrink-0
          ${preview.isPlaying
            ? 'bg-[#e94560] hover:bg-[#ff5a75] shadow-lg shadow-[#e94560]/40'
            : 'bg-[#4ecdc4] hover:bg-[#66d9d1] shadow-lg shadow-[#4ecdc4]/40'
          }
          ${!canPlay ? 'opacity-50 cursor-not-allowed shadow-none' : ''}
          active:scale-90
          ${playScale ? 'scale-90' : 'scale-100'}
        `}
        style={{
          transition: 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}
      >
        {preview.isPlaying ? (
          <Pause size={18} className="text-white fill-white" strokeWidth={2.5} />
        ) : (
          <Play size={18} className="text-white fill-white ml-0.5" strokeWidth={2.5} />
        )}
        {preview.isPlaying && (
          <span
            className="absolute inset-0 rounded-full border-2 border-white/20 animate-ping"
            style={{ animationDuration: '1.5s' }}
          />
        )}
      </button>

      <button
        onClick={handleReset}
        disabled={!hasShapes}
        className={`
          w-9 h-9 rounded-full flex items-center justify-center
          bg-white/5 hover:bg-white/10 border border-white/10
          text-white/70 hover:text-white
          transition-all duration-200
          ${!hasShapes ? 'opacity-50 cursor-not-allowed' : ''}
          ${resetAnimating ? 'rotate-180' : 'rotate-0'}
        `}
        style={{
          transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.2s'
        }}
        title="重置动画"
      >
        <RotateCcw size={16} />
      </button>

      <div className="flex-1 flex flex-col gap-1 min-w-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Gauge size={12} className="text-white/50" />
            <span className="text-[10px] text-white/50">速度</span>
          </div>
          <span className="text-[11px] font-mono text-[#e94560] font-semibold">
            {closestMark}x
          </span>
        </div>
        <input
          type="range"
          min="0.5"
          max="3"
          step="0.1"
          value={preview.speed}
          onChange={handleSpeedChange}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer
            bg-gradient-to-r from-white/10 via-[#4ecdc4]/40 to-[#e94560]
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-gradient-to-br [&::-webkit-slider-thumb]:from-[#e94560] [&::-webkit-slider-thumb]:to-[#4ecdc4]
            [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-black/30
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:transition-all
            [&::-webkit-slider-thumb]:hover:scale-110"
        />
      </div>
    </div>
  );
};
