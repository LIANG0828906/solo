import { useMemo, useState, useEffect } from 'react';
import {
  useAppStore,
} from './store';
import {
  getMainCurrents,
  getSeasonalCurrents,
  getCurrentColor,
  type OceanCurrent,
  type Season,
} from './oceanCurrents';
import { temperatureColorScale } from './temperatureGrid';
import { Sun, Snowflake, Leaf, Flower2, ChevronUp, ChevronDown, Waves } from 'lucide-react';
import { clsx } from 'clsx';

const SEASON_LABELS: Record<Season, { name: string; icon: any; color: string }> = {
  spring: { name: '春', icon: Flower2, color: '#86efac' },
  summer: { name: '夏', icon: Sun, color: '#fde047' },
  autumn: { name: '秋', icon: Leaf, color: '#fb923c' },
  winter: { name: '冬', icon: Snowflake, color: '#93c5fd' },
};

function rgbToRgbaStyle({ r, g, b }: { r: number; g: number; b: number }, a = 1): string {
  return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const num = parseInt(full, 16);
  return {
    r: ((num >> 16) & 0xff) / 255,
    g: ((num >> 8) & 0xff) / 255,
    b: (num & 0xff) / 255,
  };
}

function TemperatureLegend() {
  const stops = useMemo(() => {
    const temps = [-10, -5, 0, 5, 10, 15, 20, 25, 30];
    return temps.map((t) => ({
      temp: t,
      color: temperatureColorScale(t),
    }));
  }, []);

  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold text-white/70 tracking-wide">
        温度图例 (°C)
      </div>
      <div
        className="h-3 w-full rounded-md shadow-inner"
        style={{
          background: `linear-gradient(to right, ${stops
            .map((s) => s.color)
            .join(', ')})`,
        }}
      />
      <div className="flex justify-between text-[10px] font-mono text-white/60 px-0.5">
        {[-10, 0, 10, 20, 30].map((t) => (
          <span key={t}>{t}°</span>
        ))}
      </div>
    </div>
  );
}

interface CurrentItemProps {
  current: OceanCurrent;
  isActive: boolean;
  isVisible: boolean;
  isHighlighted: boolean;
  onToggleVisible: () => void;
  onHighlight: () => void;
}

function CurrentItem({
  current,
  isActive,
  isVisible,
  isHighlighted,
  onToggleVisible,
  onHighlight,
}: CurrentItemProps) {
  const dotStartColor = getCurrentColor(current.type, 0);
  const dotMidColor = getCurrentColor(current.type, 0.5);
  const dotEndColor = getCurrentColor(current.type, 1);
  const gradient = `linear-gradient(135deg, rgb(${dotStartColor.r},${dotStartColor.g},${dotStartColor.b}) 0%, rgb(${dotMidColor.r},${dotMidColor.g},${dotMidColor.b}) 50%, rgb(${dotEndColor.r},${dotEndColor.g},${dotEndColor.b}) 100%)`;

  return (
    <div
      className={clsx(
        'group relative flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all duration-300',
        'hover:bg-white/10',
        isHighlighted && 'bg-white/15 ring-1 ring-white/30',
        !isVisible && 'opacity-40',
        current.isSeasonal && !isActive && 'opacity-30 pointer-events-none'
      )}
      onClick={onHighlight}
    >
      <button
        className="relative z-10 flex-shrink-0 w-4 h-4 rounded-full shadow-lg transition-transform duration-200 hover:scale-125 focus:outline-none focus:ring-2 focus:ring-white/40"
        style={{ background: gradient }}
        onClick={(e) => {
          e.stopPropagation();
          onToggleVisible();
        }}
        aria-label={isVisible ? `隐藏 ${current.name}` : `显示 ${current.name}`}
      />
      <div className="flex-1 min-w-0">
        <div
          className={clsx(
            'text-sm font-medium truncate transition-colors',
            isHighlighted ? 'text-white' : 'text-white/90'
          )}
        >
          {current.name}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[10px] text-white/50 font-mono truncate">
            {current.nameEn}
          </span>
          {current.isSeasonal && (
            <span
              className={clsx(
                'text-[9px] px-1.5 py-0.5 rounded-full font-medium',
                isActive
                  ? 'bg-emerald-500/30 text-emerald-300 ring-1 ring-emerald-400/40'
                  : 'bg-slate-500/30 text-slate-400'
              )}
            >
              {isActive ? '激活' : '休眠'}
            </span>
          )}
        </div>
      </div>
      <div
        className={clsx(
          'text-[10px] px-2 py-0.5 rounded-full font-medium',
          current.type === 'warm'
            ? 'bg-red-500/20 text-red-300 ring-1 ring-red-400/30'
            : 'bg-sky-500/20 text-sky-300 ring-1 ring-sky-400/30'
        )}
      >
        {current.type === 'warm' ? '暖' : '寒'}
      </div>
    </div>
  );
}

export default function UIPanel() {
  const [isMobile, setIsMobile] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(true);

  const season = useAppStore((s) => s.season);
  const previousSeason = useAppStore((s) => s.previousSeason);
  const isTransitioning = useAppStore((s) => s.isTransitioning);
  const transitionProgress = useAppStore((s) => s.transitionProgress);
  const visibleCurrents = useAppStore((s) => s.visibleCurrents);
  const particleSpeed = useAppStore((s) => s.particleSpeed);
  const highlightedCurrent = useAppStore((s) => s.highlightedCurrent);
  const setSeason = useAppStore((s) => s.setSeason);
  const toggleCurrent = useAppStore((s) => s.toggleCurrent);
  const setParticleSpeed = useAppStore((s) => s.setParticleSpeed);
  const setHighlightedCurrent = useAppStore((s) => s.setHighlightedCurrent);

  const mainCurrents = useMemo(() => getMainCurrents(), []);
  const summerSeasonal = useMemo(() => getSeasonalCurrents('summer'), []);
  const winterSeasonal = useMemo(() => getSeasonalCurrents('winter'), []);
  const allSeasonal = useMemo(() => {
    const ids = new Set<string>();
    const result: OceanCurrent[] = [];
    [...summerSeasonal, ...winterSeasonal].forEach((c) => {
      if (!ids.has(c.id)) {
        ids.add(c.id);
        result.push(c);
      }
    });
    return result;
  }, [summerSeasonal, winterSeasonal]);

  const activeSeasonalIds = useMemo(
    () => new Set(getSeasonalCurrents(season).map((c) => c.id)),
    [season]
  );

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (isMobile) setDrawerOpen(false);
  }, [isMobile]);

  const seasonInfo = SEASON_LABELS[season];

  const seasonGradient = useMemo(() => {
    const p = isTransitioning ? transitionProgress : 1;
    const prevColor = hexToRgb(SEASON_LABELS[previousSeason].color);
    const nextColor = hexToRgb(seasonInfo.color);
    const mixed = {
      r: prevColor.r + (nextColor.r - prevColor.r) * p,
      g: prevColor.g + (nextColor.g - prevColor.g) * p,
      b: prevColor.b + (nextColor.b - prevColor.b) * p,
    };
    return {
      accent: rgbToRgbaStyle(mixed, 0.85),
      glow: rgbToRgbaStyle(mixed, 0.25),
      glowStrong: rgbToRgbaStyle(mixed, 0.4),
    };
  }, [season, previousSeason, isTransitioning, transitionProgress, seasonInfo]);

  const panelStyle = isMobile
    ? {
        position: 'fixed' as const,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: drawerOpen ? 'auto' : 'auto',
        maxHeight: drawerOpen ? '40vh' : undefined,
        minHeight: drawerOpen ? '40vh' : undefined,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }
    : {
        position: 'fixed' as const,
        right: 16,
        top: '50%',
        transform: 'translateY(-50%)',
        width: 280,
        borderRadius: 12,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      };

  return (
    <>
      <div
        className="z-40 overflow-hidden shadow-2xl transition-all duration-500 ease-out"
        style={{
          ...panelStyle,
          background: 'rgba(10, 15, 30, 0.85)',
          boxShadow: `0 8px 32px ${seasonGradient.glow}, 0 0 60px ${seasonGradient.glow}`,
          border: `1px solid rgba(255,255,255,0.12)`,
        }}
      >
        {isMobile && (
          <button
            className="w-full py-2.5 flex flex-col items-center justify-center text-white/70 hover:text-white transition-colors border-b border-white/5"
            onClick={() => setDrawerOpen((o) => !o)}
          >
            {drawerOpen ? (
              <ChevronDown className="w-5 h-5" />
            ) : (
              <ChevronUp className="w-5 h-5" />
            )}
            <span className="text-[10px] mt-0.5 tracking-wider">
              {drawerOpen ? '收起面板' : '展开控制面板'}
            </span>
          </button>
        )}

        {(drawerOpen || !isMobile) && (
          <div className="p-4 space-y-5 overflow-y-auto" style={{ maxHeight: isMobile ? 'calc(40vh - 40px)' : 'calc(100vh - 48px)' }}>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Waves className="w-5 h-5" style={{ color: seasonGradient.accent }} />
                <div>
                  <h2 className="text-sm font-bold text-white tracking-wide">
                    全球洋流可视化
                  </h2>
                  <p className="text-[10px] text-white/50 font-mono">
                    Ocean Currents 3D
                  </p>
                </div>
              </div>

              <div
                className="p-3 rounded-xl space-y-2"
                style={{
                  background: `linear-gradient(135deg, ${seasonGradient.glow} 0%, rgba(255,255,255,0.04) 100%)`,
                  border: `1px solid ${seasonGradient.glowStrong}`,
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <seasonInfo.icon
                      className="w-5 h-5 transition-all duration-500"
                      style={{ color: seasonGradient.accent }}
                    />
                    <div>
                      <div className="text-xs text-white/60">当前季节</div>
                      <div
                        className="text-lg font-bold"
                        style={{ color: seasonGradient.accent }}
                      >
                        {seasonInfo.name}季
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-white/60 font-mono">温度范围</div>
                    <div className="text-xs text-white/80 font-mono">
                      <span className="text-sky-300">-10°</span>
                      <span className="text-white/50"> ~ </span>
                      <span className="text-red-300">+30°C</span>
                    </div>
                  </div>
                </div>

                {isTransitioning && (
                  <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-75"
                      style={{
                        width: `${transitionProgress * 100}%`,
                        background: seasonGradient.accent,
                        boxShadow: `0 0 8px ${seasonGradient.accent}`,
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {(Object.keys(SEASON_LABELS) as Season[]).map((s) => {
                  const info = SEASON_LABELS[s];
                  const isSelected = s === season;
                  const Icon = info.icon;
                  return (
                    <button
                      key={s}
                      onClick={() => setSeason(s)}
                      disabled={isTransitioning}
                      className={clsx(
                        'flex flex-col items-center justify-center py-2.5 rounded-lg transition-all duration-300 focus:outline-none',
                        'border transition-all duration-300',
                        isSelected
                          ? 'text-white shadow-lg scale-[1.02]'
                          : 'text-white/60 hover:text-white/90 hover:bg-white/10 border-white/10',
                        isTransitioning && 'opacity-60 cursor-not-allowed'
                      )}
                      style={{
                        background: isSelected
                          ? `linear-gradient(135deg, ${info.color}33 0%, ${info.color}11 100%)`
                          : 'rgba(255,255,255,0.05)',
                        borderColor: isSelected ? info.color + '66' : undefined,
                        boxShadow: isSelected
                          ? `0 0 18px ${info.color}33`
                          : undefined,
                      }}
                    >
                      <Icon className="w-4 h-4 mb-0.5" />
                      <span className="text-[11px] font-semibold">{info.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-white/80">
                  粒子速度
                </label>
                <span
                  className="text-xs font-mono font-bold px-2 py-0.5 rounded-md"
                  style={{
                    background: seasonGradient.glow,
                    color: seasonGradient.accent,
                  }}
                >
                  {particleSpeed.toFixed(1)} /s
                </span>
              </div>
              <div className="relative px-1">
                <input
                  type="range"
                  min={1}
                  max={5}
                  step={0.1}
                  value={particleSpeed}
                  onChange={(e) => setParticleSpeed(parseFloat(e.target.value))}
                  className="w-full h-2 appearance-none rounded-full cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, ${seasonGradient.accent} 0%, ${seasonGradient.accent} ${
                      ((particleSpeed - 1) / 4) * 100
                    }%, rgba(255,255,255,0.12) ${
                      ((particleSpeed - 1) / 4) * 100
                    }%, rgba(255,255,255,0.12) 100%)`,
                  }}
                />
                <div className="flex justify-between mt-1 px-0.5 text-[9px] font-mono text-white/40">
                  <span>1</span>
                  <span>3</span>
                  <span>5</span>
                </div>
              </div>
            </div>

            <TemperatureLegend />

            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-semibold text-white/80">
                    主要洋流
                  </div>
                  <span className="text-[10px] text-white/40 font-mono">
                    {visibleCurrents.filter((id) =>
                      mainCurrents.some((c) => c.id === id)
                    ).length}/{mainCurrents.length}
                  </span>
                </div>
                <div className="space-y-1">
                  {mainCurrents.map((current) => (
                    <CurrentItem
                      key={current.id}
                      current={current}
                      isActive={true}
                      isVisible={visibleCurrents.includes(current.id)}
                      isHighlighted={highlightedCurrent === current.id}
                      onToggleVisible={() => toggleCurrent(current.id)}
                      onHighlight={() => setHighlightedCurrent(current.id)}
                    />
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-semibold text-white/80">
                    季节性洋流
                  </div>
                  <span className="text-[10px] text-white/40 font-mono">
                    {visibleCurrents.filter((id) =>
                      allSeasonal.some((c) => c.id === id)
                    ).length}/{allSeasonal.length}
                  </span>
                </div>
                <div className="space-y-1">
                  {allSeasonal.map((current) => (
                    <CurrentItem
                      key={current.id}
                      current={current}
                      isActive={activeSeasonalIds.has(current.id)}
                      isVisible={visibleCurrents.includes(current.id)}
                      isHighlighted={highlightedCurrent === current.id}
                      onToggleVisible={() => toggleCurrent(current.id)}
                      onHighlight={() => setHighlightedCurrent(current.id)}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-white/5">
              <p className="text-[10px] text-white/40 leading-relaxed">
                💡 提示：拖拽旋转地球，滚轮缩放。点击彩色圆点切换洋流显示，点击名称高亮路径。
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
