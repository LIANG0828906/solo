import { useState } from 'react';
import type { RuneShard, RuneElement } from '@/types';
import { ELEMENT_COLORS, ELEMENT_ICONS, ELEMENT_NAMES } from '@/types';
import { useGameStore } from '@/store/useGameStore';
import { playDragStartSound, playDropSound, playClickSound } from '@/utils/sound';
import { RefreshCw } from 'lucide-react';

interface RuneShardCardProps {
  shard: RuneShard;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, shard: RuneShard) => void;
  onDragEnd: () => void;
}

const RuneShardCard = ({ shard, onDragStart, onDragEnd }: RuneShardCardProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const color = ELEMENT_COLORS[shard.element as RuneElement];
  const icon = ELEMENT_ICONS[shard.element as RuneElement];
  const name = ELEMENT_NAMES[shard.element as RuneElement];

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    if (shard.contaminated) {
      e.preventDefault();
      return;
    }
    setIsDragging(true);
    playDragStartSound();
    e.dataTransfer.setData('shardId', shard.id);
    e.dataTransfer.effectAllowed = 'move';
    onDragStart(e, shard);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    playDropSound();
    onDragEnd();
  };

  return (
    <div
      draggable={!shard.contaminated}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`relative w-16 h-16 md:w-20 md:h-20 rounded-xl cursor-grab active:cursor-grabbing transition-all duration-300 transform hover:scale-110 ${
        isDragging ? 'opacity-50 scale-95' : ''
      } ${shard.contaminated ? 'grayscale opacity-60 cursor-not-allowed' : ''}`}
      style={{
        background: `linear-gradient(135deg, ${color}40 0%, ${color}20 100%)`,
        boxShadow: shard.contaminated
          ? 'none'
          : `0 0 20px ${color}60, inset 0 0 20px ${color}30`,
        border: `2px solid ${shard.contaminated ? '#666' : color}`,
      }}
    >
      <div
        className="absolute inset-0 flex items-center justify-center text-2xl md:text-3xl"
        style={{
          filter: shard.contaminated ? 'grayscale(100%)' : 'drop-shadow(0 0 8px currentColor)',
          color: shard.contaminated ? '#666' : color,
        }}
      >
        {icon}
      </div>
      
      <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-xs font-medium text-gray-300 whitespace-nowrap">
        {name}
      </div>
      
      {shard.contaminated && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl">
          <span className="text-red-500 text-lg">☠️</span>
        </div>
      )}
      
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 80 80"
      >
        <polygon
          points="40,5 75,25 75,55 40,75 5,55 5,25"
          fill="none"
          stroke={shard.contaminated ? '#666' : color}
          strokeWidth="1"
          opacity="0.5"
        />
        <polygon
          points="40,15 65,30 65,50 40,65 15,50 15,30"
          fill="none"
          stroke={shard.contaminated ? '#666' : color}
          strokeWidth="0.5"
          opacity="0.3"
        />
      </svg>
    </div>
  );
};

export const RunePanel = () => {
  const { shards, refreshShards, currentEvent, handleContamination } = useGameStore();
  const [, setDraggedShard] = useState<RuneShard | null>(null);

  const handleDragStart = (_e: React.DragEvent<HTMLDivElement>, shard: RuneShard) => {
    setDraggedShard(shard);
  };

  const handleDragEnd = () => {
    setDraggedShard(null);
  };

  const handleRefresh = () => {
    playClickSound();
    if (currentEvent?.type === 'contamination') {
      handleContamination(true);
    } else {
      refreshShards();
    }
  };

  const hasContaminated = shards.some((s) => s.contaminated);

  return (
    <div className="h-full flex flex-col bg-gray-900/80 backdrop-blur-md rounded-2xl p-4 border border-gray-700/50">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-orange-400 flex items-center gap-2">
          <span>💎</span>
          符文碎片盘
        </h2>
        <button
          onClick={handleRefresh}
          className={`p-2 rounded-lg transition-all duration-300 transform hover:scale-110 active:scale-95 ${
            hasContaminated
              ? 'bg-green-600 hover:bg-green-500 text-white animate-pulse'
              : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
          }`}
          title="刷新碎片"
        >
          <RefreshCw size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 gap-6 md:gap-8 p-2">
          {shards.map((shard) => (
            <RuneShardCard
              key={shard.id}
              shard={shard}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            />
          ))}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-700/50">
        <div className="text-xs text-gray-400 space-y-1">
          <p className="flex items-center gap-2">
            <span className="text-orange-500">🔥</span> 火焰 - 攻击力
          </p>
          <p className="flex items-center gap-2">
            <span className="text-blue-400">💧</span> 寒冰 - 防御力
          </p>
          <p className="flex items-center gap-2">
            <span className="text-amber-700">🪨</span> 大地 - 生命值
          </p>
          <p className="flex items-center gap-2">
            <span className="text-green-400">🌪️</span> 疾风 - 速度
          </p>
        </div>
      </div>

      {hasContaminated && (
        <div className="mt-4 p-3 bg-red-900/50 border border-red-500/50 rounded-lg text-sm text-red-300">
          ⚠️ 部分碎片已被污染！点击刷新按钮清理污染。
        </div>
      )}
    </div>
  );
};
