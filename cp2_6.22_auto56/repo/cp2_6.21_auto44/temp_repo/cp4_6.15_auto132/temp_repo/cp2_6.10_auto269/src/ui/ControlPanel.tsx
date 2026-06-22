import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { MIN_BELLS, MAX_BELLS, DEFAULT_VELOCITY } from '@/utils/constants';
import { Volume2, Plus, Minus, RotateCcw, Music } from 'lucide-react';

export const ControlPanel: React.FC = () => {
  const {
    velocity,
    bellCount,
    setVelocity,
    setBellCount,
    addBell,
    removeBell,
    resetBells,
  } = useGameStore();

  return (
    <div className="fixed bottom-6 left-6 z-10">
      <div className="bg-white/20 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-white/30 min-w-[300px]">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
            <Music className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white drop-shadow">控制面板</h2>
            <p className="text-xs text-white/70">空灵编钟</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-white/90" />
                <label className="text-sm font-medium text-white/90">敲击力度</label>
              </div>
              <span className="text-sm font-bold text-white bg-white/20 px-3 py-1 rounded-full">
                {velocity}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={velocity}
              onChange={(e) => setVelocity(Number(e.target.value))}
              className="w-full h-2 bg-white/30 rounded-full appearance-none cursor-pointer
                         [&::-webkit-slider-thumb]:appearance-none
                         [&::-webkit-slider-thumb]:w-5
                         [&::-webkit-slider-thumb]:h-5
                         [&::-webkit-slider-thumb]:rounded-full
                         [&::-webkit-slider-thumb]:bg-gradient-to-r
                         [&::-webkit-slider-thumb]:from-amber-400
                         [&::-webkit-slider-thumb]:to-amber-600
                         [&::-webkit-slider-thumb]:shadow-lg
                         [&::-webkit-slider-thumb]:cursor-pointer
                         [&::-webkit-slider-thumb]:transition-transform
                         [&::-webkit-slider-thumb]:hover:scale-110"
            />
            <div className="flex justify-between text-xs text-white/50">
              <span>轻柔</span>
              <span>有力</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-white/90">编钟数量</label>
              <span className="text-sm font-bold text-white bg-white/20 px-3 py-1 rounded-full">
                {bellCount} / {MAX_BELLS}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={removeBell}
                disabled={bellCount <= MIN_BELLS}
                className="flex-1 py-2.5 px-4 bg-white/20 hover:bg-white/30 disabled:opacity-40 
                           disabled:cursor-not-allowed rounded-xl text-white font-medium
                           transition-all duration-200 flex items-center justify-center gap-2
                           border border-white/20 hover:border-white/40"
              >
                <Minus className="w-4 h-4" />
                <span>减少</span>
              </button>
              <button
                onClick={addBell}
                disabled={bellCount >= MAX_BELLS}
                className="flex-1 py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 
                           hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 
                           disabled:cursor-not-allowed rounded-xl text-white font-medium
                           transition-all duration-200 flex items-center justify-center gap-2
                           shadow-lg hover:shadow-xl"
              >
                <Plus className="w-4 h-4" />
                <span>增加</span>
              </button>
            </div>
            <input
              type="range"
              min={MIN_BELLS}
              max={MAX_BELLS}
              value={bellCount}
              onChange={(e) => setBellCount(Number(e.target.value))}
              className="w-full h-2 bg-white/30 rounded-full appearance-none cursor-pointer
                         [&::-webkit-slider-thumb]:appearance-none
                         [&::-webkit-slider-thumb]:w-4
                         [&::-webkit-slider-thumb]:h-4
                         [&::-webkit-slider-thumb]:rounded-full
                         [&::-webkit-slider-thumb]:bg-white
                         [&::-webkit-slider-thumb]:shadow-md
                         [&::-webkit-slider-thumb]:cursor-pointer"
            />
          </div>

          <button
            onClick={resetBells}
            className="w-full py-3 px-4 bg-white/10 hover:bg-red-500/30 
                       rounded-xl text-white font-medium transition-all duration-200
                       flex items-center justify-center gap-2 border border-white/20
                       hover:border-red-400/50 group"
          >
            <RotateCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
            <span>重置所有编钟</span>
          </button>
        </div>

        <div className="mt-6 pt-4 border-t border-white/20">
          <p className="text-xs text-white/60 leading-relaxed">
            💡 拖拽编钟到音阶台上释放，触发敲击音效。相邻音阶的编钟靠近时会自动产生和声共鸣！
          </p>
        </div>
      </div>
    </div>
  );
};
