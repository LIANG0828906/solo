import { Play, Pause, Trash2, GripVertical, Clock, ArrowRight } from 'lucide-react';
import clsx from 'clsx';
import type { Keyframe, EasingType } from '../types';
import { hslToHex } from '../utils/storage';

interface TimelineProps {
  keyframes: Keyframe[];
  isPlaying: boolean;
  currentTime: number;
  totalDuration: number;
  onPlay: () => void;
  onPause: () => void;
  onDeleteKeyframe: (id: string) => void;
  onUpdateDuration: (id: string, duration: number) => void;
  onUpdateEasing: (id: string, easing: EasingType) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onSeek: (time: number) => void;
}

const KeyframeThumbnail = ({ lights }: { lights: Keyframe['lights'] }) => {
  return (
    <div className="w-full h-12 rounded-lg overflow-hidden relative bg-black/30">
      <div className="absolute inset-0 flex items-center justify-around px-1">
        {lights.map((light, i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: hslToHex(light.hue, light.saturation, light.brightness * 0.7),
              boxShadow: `0 0 6px ${hslToHex(light.hue, light.saturation, 60)}`,
            }}
          />
        ))}
      </div>
      <div
        className="absolute bottom-0 left-0 right-0 h-1"
        style={{
          background: `linear-gradient(to right, ${lights
            .map((l) => hslToHex(l.hue, l.saturation, 60))
            .join(', ')})`,
        }}
      />
    </div>
  );
};

const KeyframeCard = ({
  keyframe,
  index,
  isActive,
  onDelete,
  onDurationChange,
  onEasingChange,
  onDragStart,
  onDragOver,
  onDrop,
}: {
  keyframe: Keyframe;
  index: number;
  isActive: boolean;
  onDelete: () => void;
  onDurationChange: (duration: number) => void;
  onEasingChange: (easing: EasingType) => void;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (index: number) => void;
}) => {
  const durationSec = (keyframe.duration / 1000).toFixed(1);

  return (
    <div
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={onDragOver}
      onDrop={() => onDrop(index)}
      className={clsx(
        'relative flex-shrink-0 w-32 p-3 rounded-xl backdrop-blur-md border transition-all duration-200',
        'bg-white/5 hover:bg-white/10 cursor-grab active:cursor-grabbing',
        isActive
          ? 'border-blue-400/50 shadow-lg shadow-blue-500/20 scale-105'
          : 'border-white/10 hover:border-white/20',
      )}
    >
      <div className="absolute -left-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
        <GripVertical size={14} />
      </div>

      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400 font-medium">帧 {index + 1}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="text-gray-500 hover:text-red-400 transition-colors p-0.5"
        >
          <Trash2 size={12} />
        </button>
      </div>

      <KeyframeThumbnail lights={keyframe.lights} />

      <div className="mt-2 space-y-2">
        <div className="flex items-center gap-1.5">
          <Clock size={10} className="text-gray-500" />
          <input
            type="number"
            value={durationSec}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val) && val > 0) {
                onDurationChange(val * 1000);
              }
            }}
            className="w-12 bg-transparent text-xs text-white font-mono border-b border-gray-600 focus:border-blue-400 outline-none"
            step="0.1"
            min="0.1"
          />
          <span className="text-xs text-gray-500">秒</span>
        </div>

        <div>
          <select
            value={keyframe.easing}
            onChange={(e) => onEasingChange(e.target.value as EasingType)}
            className="w-full bg-black/30 border border-gray-600 rounded-md text-xs text-gray-300 px-2 py-1 outline-none focus:border-blue-400"
          >
            <option value="linear">线性过渡</option>
            <option value="easeInOut">缓入缓出</option>
          </select>
        </div>
      </div>
    </div>
  );
};

const Timeline = ({
  keyframes,
  isPlaying,
  currentTime,
  totalDuration,
  onPlay,
  onPause,
  onDeleteKeyframe,
  onUpdateDuration,
  onUpdateEasing,
  onReorder,
  onSeek,
}: TimelineProps) => {
  const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (totalDuration === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    onSeek(percentage * totalDuration);
  };

  return (
    <div className="flex flex-col gap-4 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">时间轴</h3>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 font-mono">
            {keyframes.length} / 10 关键帧
          </span>
          <button
            onClick={isPlaying ? onPause : onPlay}
            disabled={keyframes.length < 2}
            className={clsx(
              'flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200',
              'border backdrop-blur-md',
              keyframes.length < 2
                ? 'bg-gray-700/30 border-gray-600/30 text-gray-500 cursor-not-allowed'
                : isPlaying
                  ? 'bg-amber-500/20 border-amber-400/40 text-amber-300 hover:bg-amber-500/30 hover:shadow-lg hover:shadow-amber-500/20'
                  : 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300 hover:bg-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/20',
            )}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
          </button>
        </div>
      </div>

      <div className="relative h-3 bg-gray-700/30 rounded-full overflow-hidden cursor-pointer" onClick={handleProgressClick}>
        <div
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-75"
          style={{ width: `${progress}%`, boxShadow: '0 0 10px rgba(100, 150, 255, 0.5)' }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg"
          style={{ left: `calc(${progress}% - 8px)` }}
        />
      </div>

      <div className="text-xs text-gray-500 font-mono flex justify-between">
        <span>{(currentTime / 1000).toFixed(1)}s</span>
        <span>{(totalDuration / 1000).toFixed(1)}s</span>
      </div>

      <div className="relative">
        {keyframes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500 border-2 border-dashed border-gray-700/50 rounded-xl">
            <ArrowRight size={24} className="mb-2 opacity-50" />
            <p className="text-sm">暂无关键帧</p>
            <p className="text-xs mt-1">调节灯光后点击"添加关键帧"</p>
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-thin">
            {keyframes.map((kf, index) => {
              let elapsed = 0;
              for (let i = 0; i < index; i++) {
                elapsed += keyframes[i].duration;
              }
              const kfProgress = totalDuration > 0 ? (elapsed / totalDuration) * 100 : 0;
              const isActive = currentTime >= elapsed && currentTime < elapsed + kf.duration;

              return (
                <KeyframeCard
                  key={kf.id}
                  keyframe={kf}
                  index={index}
                  isActive={isActive}
                  onDelete={() => onDeleteKeyframe(kf.id)}
                  onDurationChange={(d) => onUpdateDuration(kf.id, d)}
                  onEasingChange={(e) => onUpdateEasing(kf.id, e)}
                  onDragStart={() => {}}
                  onDragOver={() => {}}
                  onDrop={() => {}}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Timeline;
