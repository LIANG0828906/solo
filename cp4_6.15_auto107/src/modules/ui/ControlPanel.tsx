import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, Sparkles, SlidersHorizontal } from 'lucide-react';
import { useUniverseStore } from '../../store/universeStore';

const ELASTIC_TRANSITION =
  'all 300ms cubic-bezier(0.34, 1.56, 0.64, 1)';
const EASE_OUT_TRANSITION = 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)';

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

  const [renderPanel, setRenderPanel] = useState(panelExpanded);

  useEffect(() => {
    if (panelExpanded) {
      setRenderPanel(true);
    } else {
      const t = setTimeout(() => setRenderPanel(false), 300);
      return () => clearTimeout(t);
    }
  }, [panelExpanded]);

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

  const iconButton = (
    <button
      onClick={togglePanel}
      className="fixed left-4 top-1/2 -translate-y-1/2 z-30
                 w-12 h-12 rounded-full
                 bg-[rgba(26,26,46,0.75)] border border-[rgba(255,255,255,0.12)]
                 backdrop-blur-xl
                 flex items-center justify-center
                 shadow-[0_0_20px_rgba(76,201,240,0.15)]
                 hover:shadow-[0_0_30px_rgba(76,201,240,0.35)]
                 hover:scale-115 hover:bg-[rgba(26,26,46,0.9)]
                 active:scale-95
                 transition-all duration-300"
      style={{
        fontFamily: "'Space Mono', monospace",
        transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
      title={panelExpanded ? '收起控制面板' : '展开控制面板'}
    >
      <div
        className="relative w-5 h-5 flex items-center justify-center"
        style={{
          transition: ELASTIC_TRANSITION,
          transform: panelExpanded ? 'rotate(0deg)' : 'rotate(180deg)',
        }}
      >
        {panelExpanded ? (
          <ChevronLeft className="w-5 h-5 text-cyan-400" />
        ) : (
          <SlidersHorizontal className="w-5 h-5 text-cyan-400" />
        )}
      </div>
    </button>
  );

  if (!renderPanel && !panelExpanded) {
    return iconButton;
  }

  const panelTransform = panelExpanded
    ? 'translateX(0) scale(1)'
    : isMobile
      ? 'translateX(-120%) scale(0.85)'
      : 'translateX(-105%) scale(0.9)';
  const panelOpacity = panelExpanded ? 1 : 0;

  return (
    <>
      {iconButton}
      <div
        className={`fixed top-1/2 -translate-y-1/2 z-20
                    w-72 rounded-2xl
                    bg-[rgba(15,15,30,0.78)] border border-[rgba(255,255,255,0.1)]
                    backdrop-blur-2xl
                    shadow-[0_8px_40px_rgba(0,0,0,0.5),0_0_35px_rgba(76,201,240,0.1)]
                    overflow-hidden`}
        style={{
          left: '1rem',
          fontFamily: "'Space Mono', monospace",
          transform: panelTransform,
          opacity: panelOpacity,
          transition: ELASTIC_TRANSITION,
          pointerEvents: panelExpanded ? 'auto' : 'none',
        }}
      >
        <div
          className="absolute inset-0 rounded-2xl opacity-60 pointer-events-none"
          style={{
            background:
              'linear-gradient(135deg, rgba(76,201,240,0.08) 0%, transparent 40%, rgba(114,9,183,0.06) 100%)',
          }}
        />

        <div
          className="relative p-4 border-b border-[rgba(255,255,255,0.08)]
                      flex items-center justify-between"
          style={{
            background:
              'linear-gradient(90deg, rgba(76,201,240,0.12), rgba(76,201,240,0.02) 60%, transparent)',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center
                          bg-gradient-to-br from-cyan-500/20 to-purple-500/20
                          border border-cyan-400/30"
              style={{ transition: EASE_OUT_TRANSITION }}
            >
              <Sparkles
                className="w-[18px] h-[18px] text-cyan-400"
                style={{ filter: 'drop-shadow(0 0 6px rgba(76,201,240,0.6))' }}
              />
            </div>
            <div>
              <span className="text-white font-bold text-sm tracking-[0.18em] block">
                控制中心
              </span>
              <span className="text-gray-500 text-[10px] tracking-wider">
                UNIVERSE FILTERS
              </span>
            </div>
          </div>
          <button
            onClick={togglePanel}
            className="w-9 h-9 rounded-xl
                       bg-[rgba(255,255,255,0.03)]
                       border border-[rgba(255,255,255,0.06)]
                       flex items-center justify-center
                       hover:bg-[rgba(76,201,240,0.12)]
                       hover:border-cyan-400/30
                       hover:scale-110 active:scale-95"
            style={{ transition: ELASTIC_TRANSITION }}
            title="收起"
          >
            <ChevronLeft className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="relative p-5 space-y-7">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-purple-400 to-orange-400" />
                <span className="text-gray-400 text-[11px] uppercase tracking-[0.2em]">
                  红移值过滤
                </span>
              </div>
              <span
                className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg
                           bg-[rgba(76,201,240,0.12)] text-cyan-300
                           border border-cyan-400/20"
              >
                {formatRedshift(filters.redshiftMin)} →{' '}
                {formatRedshift(filters.redshiftMax)}
              </span>
            </div>

            <div className="space-y-3">
              <div className="relative h-3 rounded-full overflow-hidden">
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background:
                      'linear-gradient(90deg, rgba(114,9,183,0.25) 0%, rgba(76,201,240,0.25) 50%, rgba(255,107,53,0.25) 100%)',
                  }}
                />
                <div
                  className="absolute h-full rounded-full"
                  style={{
                    left: `${((filters.redshiftMin + 1) / 2) * 100}%`,
                    right: `${100 - ((filters.redshiftMax + 1) / 2) * 100}%`,
                    background:
                      'linear-gradient(90deg, #7209b7 0%, #4cc9f0 50%, #ff6b35 100%)',
                    boxShadow: '0 0 18px rgba(76,201,240,0.55)',
                    transition: EASE_OUT_TRANSITION,
                  }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full
                              bg-white border-2 border-white/80
                              shadow-[0_0_14px_rgba(114,9,183,0.8)]"
                  style={{
                    left: `calc(${((filters.redshiftMin + 1) / 2) * 100}% - 8px)`,
                    transition: EASE_OUT_TRANSITION,
                  }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full
                              bg-white border-2 border-white/80
                              shadow-[0_0_14px_rgba(255,107,53,0.8)]"
                  style={{
                    left: `calc(${((filters.redshiftMax + 1) / 2) * 100}% - 8px)`,
                    transition: EASE_OUT_TRANSITION,
                  }}
                />
              </div>

              <div className="relative h-5 -mt-4 z-10">
                <input
                  type="range"
                  min="-1"
                  max="1"
                  step="0.01"
                  value={filters.redshiftMin}
                  onChange={handleRedshiftMinChange}
                  className="absolute w-full h-full opacity-0 cursor-pointer
                             [&::-webkit-slider-thumb]:appearance-none
                             [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                             [&::-webkit-slider-thumb]:rounded-full
                             [&::-webkit-slider-thumb]:cursor-pointer"
                />
                <input
                  type="range"
                  min="-1"
                  max="1"
                  step="0.01"
                  value={filters.redshiftMax}
                  onChange={handleRedshiftMaxChange}
                  className="absolute w-full h-full opacity-0 cursor-pointer
                             [&::-webkit-slider-thumb]:appearance-none
                             [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                             [&::-webkit-slider-thumb]:rounded-full
                             [&::-webkit-slider-thumb]:cursor-pointer"
                />
              </div>

              <div className="flex justify-between text-[10px]">
                <span className="text-purple-400 font-bold tracking-wider">
                  蓝移 -1.0
                </span>
                <span className="text-gray-500 tracking-wider">0.0</span>
                <span className="text-orange-400 font-bold tracking-wider">
                  红移 +1.0
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-cyan-600 to-cyan-300" />
                <span className="text-gray-400 text-[11px] uppercase tracking-[0.2em]">
                  星系质量过滤
                </span>
              </div>
              <span
                className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg
                           bg-[rgba(255,255,255,0.05)] text-cyan-300
                           border border-cyan-400/15"
              >
                {filters.massMin.toFixed(1)} ~ {filters.massMax.toFixed(1)} M☉
              </span>
            </div>

            <div className="space-y-3">
              <div className="relative h-3 rounded-full overflow-hidden">
                <div
                  className="absolute inset-0 rounded-full
                              bg-[rgba(76,201,240,0.1)]"
                />
                <div
                  className="absolute h-full rounded-full"
                  style={{
                    left: `${((filters.massMin - 0.5) / 1.5) * 100}%`,
                    right: `${100 - ((filters.massMax - 0.5) / 1.5) * 100}%`,
                    background:
                      'linear-gradient(90deg, rgba(34,211,238,0.9), rgba(103,232,249,1))',
                    boxShadow: '0 0 18px rgba(76,201,240,0.5)',
                    transition: EASE_OUT_TRANSITION,
                  }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full
                              bg-cyan-300 border-2 border-white/80
                              shadow-[0_0_14px_rgba(76,201,240,0.8)]"
                  style={{
                    left: `calc(${((filters.massMin - 0.5) / 1.5) * 100}% - 8px)`,
                    transition: EASE_OUT_TRANSITION,
                  }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full
                              bg-cyan-200 border-2 border-white/80
                              shadow-[0_0_14px_rgba(103,232,249,0.8)]"
                  style={{
                    left: `calc(${((filters.massMax - 0.5) / 1.5) * 100}% - 8px)`,
                    transition: EASE_OUT_TRANSITION,
                  }}
                />
              </div>

              <div className="relative h-5 -mt-4 z-10">
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.05"
                  value={filters.massMin}
                  onChange={handleMassMinChange}
                  className="absolute w-full h-full opacity-0 cursor-pointer
                             [&::-webkit-slider-thumb]:appearance-none
                             [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                             [&::-webkit-slider-thumb]:rounded-full
                             [&::-webkit-slider-thumb]:cursor-pointer"
                />
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.05"
                  value={filters.massMax}
                  onChange={handleMassMaxChange}
                  className="absolute w-full h-full opacity-0 cursor-pointer
                             [&::-webkit-slider-thumb]:appearance-none
                             [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                             [&::-webkit-slider-thumb]:rounded-full
                             [&::-webkit-slider-thumb]:cursor-pointer"
                />
              </div>

              <div className="flex justify-between text-[10px] text-gray-500 tracking-wider">
                <span>0.5 矮星系</span>
                <span>1.25</span>
                <span>2.0 巨星系</span>
              </div>
            </div>
          </div>
        </div>

        <div
          className="relative p-5
                      border-t border-[rgba(255,255,255,0.08)]"
          style={{
            background:
              'linear-gradient(0deg, rgba(114,9,183,0.08), rgba(76,201,240,0.06) 50%, transparent)',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-purple-500 via-cyan-400 to-orange-400 animate-pulse" />
              <span className="text-gray-400 text-[11px] uppercase tracking-[0.2em]">
                宇宙演化时间轴
              </span>
            </div>
            <div
              className="flex items-center gap-2 px-3 py-1 rounded-lg
                         bg-gradient-to-r from-purple-500/20 via-cyan-500/20 to-orange-500/20
                         border border-[rgba(255,255,255,0.1)]"
            >
              <span
                className="text-cyan-300 font-bold text-lg tracking-tight"
                style={{ textShadow: '0 0 12px rgba(76,201,240,0.7)' }}
              >
                {Math.round(timeProgress * 100)}
              </span>
              <span className="text-gray-500 text-[10px] font-bold tracking-wider">
                %
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="relative h-4 rounded-full overflow-hidden cursor-pointer group">
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background:
                    'linear-gradient(90deg, rgba(114,9,183,0.2) 0%, rgba(76,201,240,0.2) 40%, rgba(255,159,28,0.2) 80%, rgba(255,107,53,0.2) 100%)',
                }}
              />
              <div
                className="absolute h-full rounded-full relative group-hover:brightness-110"
                style={{
                  width: `${timeProgress * 100}%`,
                  background:
                    'linear-gradient(90deg, #7209b7 0%, #4cc9f0 40%, #ff9f1c 75%, #ff6b35 100%)',
                  boxShadow:
                    '0 0 20px rgba(76,201,240,0.5), inset 0 0 12px rgba(255,255,255,0.25)',
                  transition: EASE_OUT_TRANSITION,
                }}
              >
                <div
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2
                              w-6 h-6 rounded-full
                              bg-white
                              shadow-[0_0_25px_rgba(255,255,255,0.9),0_0_40px_rgba(76,201,240,0.7)]
                              border-2 border-white
                              group-hover:scale-120"
                  style={{ transition: ELASTIC_TRANSITION }}
                />
              </div>

              {[0, 25, 50, 75, 100].map((pct) => (
                <div
                  key={pct}
                  className="absolute top-1/2 -translate-y-1/2 w-0.5 h-2 bg-white/20"
                  style={{ left: `${pct}%` }}
                />
              ))}
            </div>

            <input
              type="range"
              min="0"
              max="1"
              step="0.001"
              value={timeProgress}
              onChange={handleTimeChange}
              className="w-full h-4 -mt-8 mb-4 opacity-0 cursor-pointer z-20 relative
                         [&::-webkit-slider-thumb]:appearance-none
                         [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6
                         [&::-webkit-slider-thumb]:rounded-full
                         [&::-webkit-slider-thumb]:cursor-pointer"
            />

            <div className="flex justify-between items-center">
              <div className="flex flex-col items-start">
                <span className="text-purple-400 font-bold text-[10px] tracking-wider">
                  大爆炸
                </span>
                <span className="text-gray-600 text-[9px]">0 亿年</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-cyan-400 font-bold text-[10px] tracking-wider">
                  星系形成
                </span>
                <span className="text-gray-600 text-[9px]">50 亿年</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-orange-400 font-bold text-[10px] tracking-wider">
                  现在
                </span>
                <span className="text-gray-600 text-[9px]">138 亿年</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export { ControlPanel };
