import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, ChevronLeft, ChevronRight, Zap, TrendingUp, Wind, Mountain, Droplets } from 'lucide-react';
import { useStore } from '@/store';
import { optimizeLayout } from '@/simulator';

interface UIPanelProps {
  heightMap: number[][];
}

export default function UIPanel({ heightMap }: UIPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const terrainAmplitude = useStore((state) => state.terrainAmplitude);
  const particleCount = useStore((state) => state.particleCount);
  const maxTurbines = useStore((state) => state.maxTurbines);
  const turbines = useStore((state) => state.turbines);
  const suggestions = useStore((state) => state.suggestions);
  const expectedGain = useStore((state) => state.expectedGain);
  const isOptimizing = useStore((state) => state.isOptimizing);

  const setTerrainAmplitude = useStore((state) => state.setTerrainAmplitude);
  const setParticleCount = useStore((state) => state.setParticleCount);
  const setMaxTurbines = useStore((state) => state.setMaxTurbines);
  const setSuggestions = useStore((state) => state.setSuggestions);
  const setIsOptimizing = useStore((state) => state.setIsOptimizing);
  const clearSuggestions = useStore((state) => state.clearSuggestions);

  const totalPower = turbines.reduce((sum, t) => sum + t.power, 0);
  const avgWindSpeed = turbines.length > 0
    ? turbines.reduce((sum, t) => sum + t.windSpeed, 0) / turbines.length
    : 0;

  const maxPower = Math.max(...turbines.map((t) => t.power), 1000);

  const handleOptimize = useCallback(() => {
    setIsOptimizing(true);
    clearSuggestions();

    setTimeout(() => {
      const result = optimizeLayout(heightMap, turbines);
      setSuggestions(result.positions, result.gain);
      setIsOptimizing(false);
    }, 2000);
  }, [heightMap, turbines, setIsOptimizing, setSuggestions, clearSuggestions]);

  const getBarColor = (power: number, max: number) => {
    const ratio = power / max;
    const r = Math.floor(255 * ratio);
    const g = Math.floor(235 * (1 - ratio));
    return `rgb(${r}, ${g}, 59)`;
  };

  return (
    <div className="relative h-full flex">
      <AnimatePresence mode="wait">
        {!isCollapsed && (
          <motion.div
            key="panel"
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="w-full h-full overflow-y-auto p-4"
            style={{
              background: 'rgba(30, 30, 30, 0.85)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <div className="flex items-center gap-2 mb-6">
              <Settings className="w-5 h-5 text-green-500" />
              <h2 className="text-white text-lg font-semibold">控制面板</h2>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-gray-300 text-sm flex items-center gap-2">
                    <Mountain className="w-4 h-4 text-green-400" />
                    地形起伏幅度
                  </label>
                  <span className="text-green-400 text-sm font-mono">
                    {terrainAmplitude}
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="50"
                  value={terrainAmplitude}
                  onChange={(e) => setTerrainAmplitude(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>平缓</span>
                  <span>起伏</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-gray-300 text-sm flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-blue-400" />
                    粒子密度
                  </label>
                  <span className="text-blue-400 text-sm font-mono">
                    {particleCount}
                  </span>
                </div>
                <input
                  type="range"
                  min="800"
                  max="1200"
                  step="50"
                  value={particleCount}
                  onChange={(e) => setParticleCount(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>稀疏</span>
                  <span>密集</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-gray-300 text-sm flex items-center gap-2">
                    <Wind className="w-4 h-4 text-orange-400" />
                    最大风机数量
                  </label>
                  <span className="text-orange-400 text-sm font-mono">
                    {turbines.length} / {maxTurbines}
                  </span>
                </div>
                <input
                  type="range"
                  min="8"
                  max="12"
                  value={maxTurbines}
                  onChange={(e) => setMaxTurbines(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <button
                onClick={handleOptimize}
                disabled={isOptimizing}
                className="w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-300 flex items-center justify-center gap-2 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: isOptimizing
                    ? 'linear-gradient(135deg, #666 0%, #888 100%)'
                    : 'linear-gradient(135deg, #4caf50 0%, #8bc34a 100%)',
                }}
              >
                {isOptimizing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    优化计算中...
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-5 h-5" />
                    优化布局
                  </>
                )}
              </button>

              {suggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-lg border"
                  style={{
                    background: 'rgba(255, 215, 0, 0.1)',
                    borderColor: 'rgba(255, 215, 0, 0.3)',
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-5 h-5 text-yellow-400" />
                    <span className="text-yellow-400 font-semibold">优化建议</span>
                  </div>
                  <p className="text-gray-300 text-sm">
                    已找到 <span className="text-yellow-400 font-bold">{suggestions.length}</span> 个最佳新增机位
                  </p>
                  <p className="text-gray-300 text-sm mt-1">
                    预期发电量提升:{' '}
                    <span className="text-green-400 font-bold">
                      +{expectedGain.toFixed(1)}%
                    </span>
                  </p>
                </motion.div>
              )}

              <div className="pt-4 border-t border-gray-700">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  发电量统计
                </h3>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div
                    className="p-3 rounded-lg"
                    style={{ background: 'rgba(255, 235, 59, 0.1)' }}
                  >
                    <div className="text-xs text-gray-400">总功率</div>
                    <div className="text-xl font-bold text-yellow-400">
                      {totalPower.toFixed(1)} <span className="text-sm">kW</span>
                    </div>
                  </div>
                  <div
                    className="p-3 rounded-lg"
                    style={{ background: 'rgba(100, 181, 246, 0.1)' }}
                  >
                    <div className="text-xs text-gray-400">平均风速</div>
                    <div className="text-xl font-bold text-blue-400">
                      {avgWindSpeed.toFixed(1)} <span className="text-sm">m/s</span>
                    </div>
                  </div>
                </div>

                {turbines.length > 0 ? (
                  <div className="space-y-2">
                    <div className="text-xs text-gray-400 mb-2">各机组功率分布</div>
                    <div className="space-y-3">
                      {turbines.map((turbine, index) => (
                        <motion.div
                          key={turbine.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="space-y-1"
                        >
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-400">机组 #{index + 1}</span>
                            <span className="text-white font-mono">
                              {turbine.power.toFixed(1)} kW
                            </span>
                          </div>
                          <div
                            className="h-4 rounded-full overflow-hidden"
                            style={{ background: 'rgba(255,255,255,0.1)' }}
                          >
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{
                                width: `${Math.min(100, (turbine.power / maxPower) * 100)}%`,
                              }}
                              transition={{ duration: 0.5, ease: 'easeOut' }}
                              className="h-full rounded-full"
                              style={{
                                background: `linear-gradient(90deg, #ffeb3b, ${getBarColor(turbine.power, maxPower)})`,
                              }}
                            />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <Wind className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>点击地形放置风机</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full p-2 text-white hover:bg-white/10 transition-colors rounded-l-lg"
        style={{ background: 'rgba(30, 30, 30, 0.85)' }}
      >
        {isCollapsed ? (
          <ChevronLeft className="w-5 h-5" />
        ) : (
          <ChevronRight className="w-5 h-5" />
        )}
      </button>
    </div>
  );
}
