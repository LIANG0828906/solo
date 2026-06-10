import { Sparkles, RotateCcw, Plus, Zap } from 'lucide-react';
import { useDreamStore } from '@/store/useDreamStore';

export function ControlPanel() {
  const { dreamIntensity, setDreamIntensity, resetCamera, addNode } = useDreamStore();

  const handleAddRandomNode = () => {
    const x = (Math.random() - 0.5) * 10;
    const y = (Math.random() - 0.5) * 6;
    const z = (Math.random() - 0.5) * 8;
    addNode([x, y, z]);
  };

  const getIntensityLabel = () => {
    if (dreamIntensity < 25) return '平静';
    if (dreamIntensity < 50) return '柔和';
    if (dreamIntensity < 75) return '活跃';
    return '剧烈';
  };

  const getIntensityColor = () => {
    if (dreamIntensity < 25) return 'text-cyan-400';
    if (dreamIntensity < 50) return 'text-purple-400';
    if (dreamIntensity < 75) return 'text-pink-400';
    return 'text-red-400';
  };

  return (
    <div className="fixed bottom-6 left-6 z-10">
      <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-5 border border-white/10 shadow-2xl"
           style={{
             boxShadow: '0 0 40px rgba(155, 89, 182, 0.2), 0 0 80px rgba(255, 107, 107, 0.1)',
           }}>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <h2 className="text-white font-semibold text-lg tracking-wide">梦之控制台</h2>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleAddRandomNode}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl
                     bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500
                     text-white font-medium transition-all duration-300 transform hover:scale-105
                     shadow-lg hover:shadow-purple-500/30"
          >
            <Plus className="w-5 h-5" />
            生成梦境节点
          </button>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="text-white/80 text-sm">梦境强度</span>
              </div>
              <span className={`text-sm font-medium ${getIntensityColor()}`}>
                {dreamIntensity}% · {getIntensityLabel()}
              </span>
            </div>

            <div className="relative">
              <input
                type="range"
                min="0"
                max="100"
                value={dreamIntensity}
                onChange={(e) => setDreamIntensity(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #06b6d4 0%, #9b59b6 50%, #ff6b6b 100%)`,
                }}
              />
              <style>{`
                input[type="range"]::-webkit-slider-thumb {
                  -webkit-appearance: none;
                  width: 18px;
                  height: 18px;
                  border-radius: 50%;
                  background: linear-gradient(135deg, #c084fc, #f472b6);
                  cursor: pointer;
                  box-shadow: 0 0 10px rgba(192, 132, 252, 0.8);
                  border: 2px solid rgba(255, 255, 255, 0.3);
                  transition: all 0.2s ease;
                }
                input[type="range"]::-webkit-slider-thumb:hover {
                  transform: scale(1.2);
                  box-shadow: 0 0 20px rgba(192, 132, 252, 1);
                }
                input[type="range"]::-moz-range-thumb {
                  width: 18px;
                  height: 18px;
                  border-radius: 50%;
                  background: linear-gradient(135deg, #c084fc, #f472b6);
                  cursor: pointer;
                  border: 2px solid rgba(255, 255, 255, 0.3);
                  box-shadow: 0 0 10px rgba(192, 132, 252, 0.8);
                }
              `}</style>
            </div>
          </div>

          <button
            onClick={resetCamera}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl
                     bg-white/10 hover:bg-white/20 border border-white/20
                     text-white/90 font-medium transition-all duration-300
                     hover:border-purple-400/50 hover:shadow-purple-500/20 hover:shadow-lg"
          >
            <RotateCcw className="w-5 h-5" />
            重置视角
          </button>
        </div>
      </div>
    </div>
  );
}
