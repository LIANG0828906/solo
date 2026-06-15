import { useCallback } from 'react';
import { Filter, ChevronLeft, Sparkles } from 'lucide-react';
import { useUniverseStore } from '../../store/universeStore';

export default function ControlPanel() {
  const {
    filters,
    timeProgress,
    setFilters,
    setTimeProgress,
    panelExpanded,
    togglePanel,
    isMobile,
  } = useUniverseStore();

  const handleRedshiftMinChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(e.target.value);
      if (value <= filters.redshiftMax) {
        setFilters({ redshiftMin: value });
      }
    },
    [filters.redshiftMax, setFilters]
  );

  const handleRedshiftMaxChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(e.target.value);
      if (value >= filters.redshiftMin) {
        setFilters({ redshiftMax: value });
      }
    },
    [filters.redshiftMin, setFilters]
  );

  const handleMassMinChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(e.target.value);
      if (value <= filters.massMax) {
        setFilters({ massMin: value });
      }
    },
    [filters.massMax, setFilters]
  );

  const handleMassMaxChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(e.target.value);
      if (value >= filters.massMin) {
        setFilters({ massMax: value });
      }
    },
    [filters.massMin, setFilters]
  );

  const handleTimeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setTimeProgress(parseFloat(e.target.value));
    },
    [setTimeProgress]
  );

  const formatRedshift = (value: number) => {
    return value >= 0 ? `+${value.toFixed(2)}` : value.toFixed(2);
  };

  if (!panelExpanded) {
    return (
      <button
        onClick={togglePanel}
        className="fixed left-4 top-1/2 -translate-y-1/2 z-20 
                   w-12 h-12 rounded-full
                   bg-[rgba(26,26,46,0.7)] border border-[rgba(255,255,255,0.1)]
                   backdrop-blur-xl
                   flex items-center justify-center
                   hover:scale-110 hover:bg-[rgba(26,26,46,0.9)]
                   hover:shadow-[0_0_20px_rgba(76,201,240,0.3)]
                   transition-all duration-300 ease-out"
        style={{ fontFamily: "'Space Mono', monospace" }}
      >
        <Filter className="w-5 h-5 text-cyan-400" />
      </button>
    );
  }

  return (
    <div
      className={`fixed left-4 top-1/2 -translate-y-1/2 z-20
                  w-72 rounded-2xl
                  bg-[rgba(26,26,46,0.7)] border border-[rgba(255,255,255,0.1)]
                  backdrop-blur-xl
                  shadow-[0_0_30px_rgba(76,201,240,0.1)]
                  transform transition-all duration-300 ease-out
                  ${isMobile ? 'scale-90' : 'scale-100'}`}
      style={{ fontFamily: "'Space Mono', monospace" }}
    >
      <div className="p-4 border-b border-[rgba(255,255,255,0.1)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-cyan-400" />
          <span className="text-white font-bold text-sm tracking-wider">
            控制面板
          </span>
        </div>
        <button
          onClick={togglePanel}
          className="w-8 h-8 rounded-lg
                     hover:bg-[rgba(255,255,255,0.1)]
                     flex items-center justify-center
                     transition-all duration-300
                     hover:scale-110"
        >
          <ChevronLeft className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      <div className="p-4 space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-xs uppercase tracking-wider">
              红移值过滤
            </span>
            <span className="text-cyan-400 text-xs">
              {formatRedshift(filters.redshiftMin)} ~ {formatRedshift(filters.redshiftMax)}
            </span>
          </div>
          
          <div className="space-y-2">
            <div className="relative h-2">
              <div className="absolute inset-0 bg-[rgba(114,9,183,0.2)] rounded-full" />
              <div
                className="absolute h-full rounded-full bg-gradient-to-r from-purple-500 via-cyan-400 to-orange-500"
                style={{
                  left: `${((filters.redshiftMin + 1) / 2) * 100}%`,
                  right: `${100 - ((filters.redshiftMax + 1) / 2) * 100}%`,
                }}
              />
            </div>
            
            <div className="relative">
              <input
                type="range"
                min="-1"
                max="1"
                step="0.01"
                value={filters.redshiftMin}
                onChange={handleRedshiftMinChange}
                className="absolute w-full h-2 opacity-0 cursor-pointer
                           [&::-webkit-slider-thumb]:appearance-none
                           [&::-webkit-slider-thumb]:w-4
                           [&::-webkit-slider-thumb]:h-4
                           [&::-webkit-slider-thumb]:rounded-full
                           [&::-webkit-slider-thumb]:bg-purple-500
                           [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(114,9,183,0.5)]
                           [&::-webkit-slider-thumb]:cursor-pointer
                           [&::-webkit-slider-thumb]:transition-transform
                           [&::-webkit-slider-thumb]:duration-200
                           [&::-webkit-slider-thumb]:hover:scale-125"
              />
              <input
                type="range"
                min="-1"
                max="1"
                step="0.01"
                value={filters.redshiftMax}
                onChange={handleRedshiftMaxChange}
                className="absolute w-full h-2 opacity-0 cursor-pointer
                           [&::-webkit-slider-thumb]:appearance-none
                           [&::-webkit-slider-thumb]:w-4
                           [&::-webkit-slider-thumb]:h-4
                           [&::-webkit-slider-thumb]:rounded-full
                           [&::-webkit-slider-thumb]:bg-orange-500
                           [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(255,107,53,0.5)]
                           [&::-webkit-slider-thumb]:cursor-pointer
                           [&::-webkit-slider-thumb]:transition-transform
                           [&::-webkit-slider-thumb]:duration-200
                           [&::-webkit-slider-thumb]:hover:scale-125"
              />
            </div>
            
            <div className="flex justify-between text-[10px] text-gray-500">
              <span className="text-purple-400">蓝移 -1.0</span>
              <span className="text-gray-500">0.0</span>
              <span className="text-orange-400">红移 +1.0</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-xs uppercase tracking-wider">
              质量过滤
            </span>
            <span className="text-cyan-400 text-xs">
              {filters.massMin.toFixed(1)} ~ {filters.massMax.toFixed(1)} M☉
            </span>
          </div>
          
          <div className="space-y-2">
            <div className="relative h-2">
              <div className="absolute inset-0 bg-[rgba(76,201,240,0.2)] rounded-full" />
              <div
                className="absolute h-full rounded-full bg-gradient-to-r from-cyan-600 to-cyan-400"
                style={{
                  left: `${((filters.massMin - 0.5) / 1.5) * 100}%`,
                  right: `${100 - ((filters.massMax - 0.5) / 1.5) * 100}%`,
                }}
              />
            </div>
            
            <div className="relative">
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={filters.massMin}
                onChange={handleMassMinChange}
                className="absolute w-full h-2 opacity-0 cursor-pointer
                           [&::-webkit-slider-thumb]:appearance-none
                           [&::-webkit-slider-thumb]:w-4
                           [&::-webkit-slider-thumb]:h-4
                           [&::-webkit-slider-thumb]:rounded-full
                           [&::-webkit-slider-thumb]:bg-cyan-500
                           [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(76,201,240,0.5)]
                           [&::-webkit-slider-thumb]:cursor-pointer
                           [&::-webkit-slider-thumb]:transition-transform
                           [&::-webkit-slider-thumb]:duration-200
                           [&::-webkit-slider-thumb]:hover:scale-125"
              />
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={filters.massMax}
                onChange={handleMassMaxChange}
                className="absolute w-full h-2 opacity-0 cursor-pointer
                           [&::-webkit-slider-thumb]:appearance-none
                           [&::-webkit-slider-thumb]:w-4
                           [&::-webkit-slider-thumb]:h-4
                           [&::-webkit-slider-thumb]:rounded-full
                           [&::-webkit-slider-thumb]:bg-cyan-400
                           [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(76,201,240,0.5)]
                           [&::-webkit-slider-thumb]:cursor-pointer
                           [&::-webkit-slider-thumb]:transition-transform
                           [&::-webkit-slider-thumb]:duration-200
                           [&::-webkit-slider-thumb]:hover:scale-125"
              />
            </div>
            
            <div className="flex justify-between text-[10px] text-gray-500">
              <span>0.5</span>
              <span>1.25</span>
              <span>2.0</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-[rgba(255,255,255,0.1)]">
        <div className="flex items-center justify-between mb-3">
          <span className="text-gray-400 text-xs uppercase tracking-wider">
            宇宙演化时间轴
          </span>
          <span className="text-cyan-400 text-xs font-bold">
            {Math.round(timeProgress * 100)}%
          </span>
        </div>
        
        <div className="space-y-2">
          <div className="relative h-3">
            <div className="absolute inset-0 bg-[rgba(76,201,240,0.15)] rounded-full" />
            <div
              className="absolute h-full rounded-full bg-gradient-to-r 
                         from-purple-600 via-cyan-500 to-orange-400
                         shadow-[0_0_15px_rgba(76,201,240,0.4)]"
              style={{ width: `${timeProgress * 100}%` }}
            />
          </div>
          
          <input
            type="range"
            min="0"
            max="1"
            step="0.001"
            value={timeProgress}
            onChange={handleTimeChange}
            className="w-full h-3 -mt-5 opacity-0 cursor-pointer
                       [&::-webkit-slider-thumb]:appearance-none
                       [&::-webkit-slider-thumb]:w-5
                       [&::-webkit-slider-thumb]:h-5
                       [&::-webkit-slider-thumb]:rounded-full
                       [&::-webkit-slider-thumb]:bg-white
                       [&::-webkit-slider-thumb]:shadow-[0_0_20px_rgba(255,255,255,0.8)]
                       [&::-webkit-slider-thumb]:cursor-pointer
                       [&::-webkit-slider-thumb]:transition-transform
                       [&::-webkit-slider-thumb]:duration-200
                       [&::-webkit-slider-thumb]:hover:scale-125"
          />
          
          <div className="flex justify-between text-[10px] text-gray-500">
            <span className="text-purple-400">大爆炸</span>
            <span className="text-gray-400">50亿年</span>
            <span className="text-orange-400">138亿年</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export { ControlPanel };
