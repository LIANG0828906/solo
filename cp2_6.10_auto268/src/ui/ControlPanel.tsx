import { useState } from 'react';
import { Waves, Plus, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { useStore } from '@/store/useStore';

export const ControlPanel = () => {
  const { frequency, setFrequency, addBuoy, reset, buoys } = useStore();
  const [isMuted, setIsMuted] = useState(false);

  const handleAddBuoy = () => {
    const angle = Math.random() * Math.PI * 2;
    const radius = 2 + Math.random() * 4;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    addBuoy([x, 0, z]);
  };

  return (
    <div className="absolute bottom-6 left-6 z-10">
      <div className="backdrop-blur-xl bg-deep-ocean/60 border border-wave-white/20 rounded-2xl p-5 shadow-2xl shadow-deep-ocean/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-coral-pink to-aqua-glow flex items-center justify-center">
            <Waves className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-display text-lg text-wave-white tracking-wide">
              潮汐控制台
            </h2>
            <p className="text-xs text-wave-white/50">
              浮标数量: {buoys.length}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-wave-white/70 mb-2 font-body">
              波形频率: {frequency.toFixed(1)} Hz
            </label>
            <input
              type="range"
              min="0.1"
              max="2"
              step="0.1"
              value={frequency}
              onChange={(e) => setFrequency(parseFloat(e.target.value))}
              className="w-64 h-2 bg-ocean-light rounded-lg appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-4
                [&::-webkit-slider-thumb]:h-4
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-gradient-to-r
                [&::-webkit-slider-thumb]:from-coral-pink
                [&::-webkit-slider-thumb]:to-aqua-glow
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-webkit-slider-thumb]:shadow-lg
                [&::-webkit-slider-thumb]:shadow-coral-pink/30
                [&::-webkit-slider-thumb]:transition-transform
                [&::-webkit-slider-thumb]:hover:scale-110"
            />
            <div className="flex justify-between text-xs text-wave-white/40 mt-1">
              <span>慢</span>
              <span>快</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleAddBuoy}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4
                bg-gradient-to-r from-coral-pink/80 to-coral-pink/60
                hover:from-coral-pink hover:to-coral-pink/80
                text-white rounded-xl font-body text-sm
                transition-all duration-300
                hover:shadow-lg hover:shadow-coral-pink/30
                active:scale-95"
            >
              <Plus className="w-4 h-4" />
              生成浮标
            </button>

            <button
              onClick={reset}
              className="flex items-center justify-center gap-2 py-3 px-4
                bg-ocean-light/60 hover:bg-ocean-light/80
                text-wave-white rounded-xl
                transition-all duration-300
                hover:shadow-lg hover:shadow-aqua-glow/20
                active:scale-95"
              title="重置"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsMuted(!isMuted)}
              className="flex items-center justify-center gap-2 py-3 px-4
                bg-ocean-light/60 hover:bg-ocean-light/80
                text-wave-white rounded-xl
                transition-all duration-300
                hover:shadow-lg hover:shadow-aqua-glow/20
                active:scale-95"
              title={isMuted ? '取消静音' : '静音'}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-wave-white/10">
          <p className="text-xs text-wave-white/40 text-center font-body">
            点击海面放置浮标 · 拖拽浮标调整位置
          </p>
        </div>
      </div>
    </div>
  );
};
