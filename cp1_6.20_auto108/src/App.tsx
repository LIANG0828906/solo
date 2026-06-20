import { useState, useMemo, useCallback, useEffect } from 'react';
import { Building2, Sun as SunIcon, Info, X as XIcon, Clock, Shield, Cpu } from 'lucide-react';
import SceneView from './components/scene/SceneView';
import ControlPanel from './components/control/ControlPanel';
import { DEFAULT_BUILDING, DEFAULT_LATITUDE, DEFAULT_LONGITUDE } from './types';
import type { BuildingConfig, DisplayOptions, ShadowData, GroundClickInfo, TimeSlot } from './types';
import { getSunPosition, formatDateKey, formatHour } from './utils/suncalc';
import { computeAllShadowData } from './utils/shadowcalc';

function buildDefaultDate(): Date {
  const today = new Date();
  return new Date(today.getFullYear(), 4, 21, 12, 0, 0);
}

function TimeSlotBadge({ slot }: { slot: TimeSlot }) {
  return (
    <span className={`time-slot-tag ${slot.inShadow ? 'time-slot-shadow' : 'time-slot-sun'}`}>
      {slot.inShadow ? <Shield size={12} /> : <SunIcon size={12} />}
      {formatHour(slot.startHour)} ~ {formatHour(slot.endHour)}
    </span>
  );
}

function InfoModal({
  info,
  onClose,
}: {
  info: GroundClickInfo | null;
  onClose: () => void;
}) {
  if (!info) return null;
  const shadowHours = info.timeSlots
    .filter((s) => s.inShadow)
    .reduce((acc, s) => acc + (s.endHour - s.startHour), 0);
  const sunHours = Math.max(0, 12 - shadowHours);

  const coveragePct = info.shadowCoverageRatio * 100;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Info size={18} color="#e94560" />
              <h3 className="font-display font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                地点日照分析报告
              </h3>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              报告日期：{info.dateStr}
            </p>
          </div>
          <button
            className="btn-secondary"
            style={{ padding: '6px 10px' }}
            onClick={onClose}
            aria-label="关闭"
          >
            <XIcon size={16} />
          </button>
        </div>

        <div
          className="mb-4 p-3 rounded-xl"
          style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid var(--border-glass)' }}
        >
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
                坐标位置 (X, Z)
              </div>
              <div className="font-display font-semibold">
                ({info.point.x.toFixed(1)}, {info.point.z.toFixed(1)})
              </div>
            </div>
            <div>
              <div className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
                阴影覆盖率
              </div>
              <div className="font-display font-bold text-lg" style={{ color: '#e94560' }}>
                {coveragePct.toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="text-xs mb-1 flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                <SunIcon size={11} /> 日照时长
              </div>
              <div className="font-display font-semibold" style={{ color: '#fbbf24' }}>
                {sunHours.toFixed(1)} h
              </div>
            </div>
            <div>
              <div className="text-xs mb-1 flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                <Shield size={11} /> 阴影时长
              </div>
              <div className="font-display font-semibold" style={{ color: '#60a5fa' }}>
                {shadowHours.toFixed(1)} h
              </div>
            </div>
          </div>
          <div className="mt-3">
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(251,191,36,0.2)' }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${100 - coveragePct}%`,
                  background: 'linear-gradient(90deg,#fbbf24,#f59e0b)',
                  transition: 'width 0.5s ease',
                }}
              />
            </div>
            <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
              <span>☀️ 日照 {((100 - coveragePct)).toFixed(0)}%</span>
              <span>🌧 阴影 {coveragePct.toFixed(0)}%</span>
            </div>
          </div>
        </div>

        <div>
          <div
            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider mb-2"
            style={{ color: 'var(--text-secondary)' }}
          >
            <Clock size={12} /> 日照时段明细（6:00 ~ 18:00）
          </div>
          <div>
            {info.timeSlots.length === 0 ? (
              <p className="text-sm py-6 text-center" style={{ color: 'var(--text-secondary)' }}>
                暂无详细数据，请先点击「重新计算热力图」
              </p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {info.timeSlots.map((s, i) => (
                  <TimeSlotBadge key={i} slot={s} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [buildingConfig, setBuildingConfig] = useState<BuildingConfig>(DEFAULT_BUILDING);
  const [currentDate, setCurrentDate] = useState<Date>(buildDefaultDate());
  const [currentHour, setCurrentHour] = useState<number>(12);
  const [displayOptions, setDisplayOptions] = useState<DisplayOptions>({
    showShadowTrail: false,
    showIsochron: false,
    showHeatmap: false,
  });
  const [shadowData, setShadowData] = useState<ShadowData | null>(null);
  const [groundClickInfo, setGroundClickInfo] = useState<GroundClickInfo | null>(null);
  const [isHeatmapComputing, setIsHeatmapComputing] = useState<boolean>(false);
  const [mobileLeftOpen, setMobileLeftOpen] = useState<boolean>(false);
  const [mobileRightOpen, setMobileRightOpen] = useState<boolean>(false);

  const sunPosition = useMemo(
    () => getSunPosition(currentDate, currentHour, DEFAULT_LATITUDE, DEFAULT_LONGITUDE),
    [currentDate, currentHour]
  );

  const dateStr = formatDateKey(currentDate);

  const buildingStats = useMemo(
    () => ({
      totalHeight: buildingConfig.floors * buildingConfig.floorHeight,
      footprint: buildingConfig.length * buildingConfig.width,
    }),
    [buildingConfig]
  );

  const regenerateHeatmap = useCallback(() => {
    if (isHeatmapComputing) return;
    setIsHeatmapComputing(true);
    const t0 = performance.now();
    setTimeout(() => {
      try {
        const data = computeAllShadowData(
          buildingConfig,
          currentDate,
          currentHour,
          DEFAULT_LATITUDE,
          DEFAULT_LONGITUDE
        );
        setShadowData(data);
        console.log(`[Heatmap] 重新计算完成，耗时 ${(performance.now() - t0).toFixed(0)}ms`);
      } finally {
        setIsHeatmapComputing(false);
      }
    }, 30);
  }, [buildingConfig, currentDate, currentHour, isHeatmapComputing]);

  const onShadowDataReady = useCallback((data: ShadowData) => {
    setShadowData(data);
  }, []);

  const handleGroundClick = useCallback((info: GroundClickInfo) => {
    setGroundClickInfo(info);
  }, []);

  const handleBuildingChange = useCallback((cfg: BuildingConfig) => {
    setBuildingConfig(cfg);
    setShadowData(null);
  }, []);

  const handleDateChange = useCallback((d: Date) => {
    setCurrentDate(d);
    setShadowData(null);
  }, []);

  useEffect(() => {
    if (
      (displayOptions.showHeatmap || displayOptions.showShadowTrail || displayOptions.showIsochron) &&
      !shadowData &&
      !isHeatmapComputing
    ) {
      regenerateHeatmap();
    }
  }, [displayOptions.showHeatmap, displayOptions.showShadowTrail, displayOptions.showIsochron, shadowData, isHeatmapComputing, regenerateHeatmap]);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', background: '#0f172a' }}>
      {/* 顶部栏 */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          pointerEvents: 'none',
        }}
      >
        <div style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '9px 14px',
              borderRadius: 12,
              background: 'var(--bg-panel)',
              backdropFilter: 'blur(14px) saturate(140%)',
              WebkitBackdropFilter: 'blur(14px) saturate(140%)',
              border: '1px solid var(--border-glass)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
            }}
          >
            <Building2 size={18} color="#e94560" />
            <div className="flex flex-col leading-tight">
              <span
                className="font-display font-bold text-sm tracking-wide"
                style={{ color: 'var(--text-primary)' }}
              >
                SUN SHADOW
              </span>
              <span
                className="font-display text-[10px] tracking-[2px]"
                style={{ color: 'var(--accent)' }}
              >
                ANALYZER 3D
              </span>
            </div>
          </div>
          <div
            className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
            style={{
              background: 'var(--bg-panel)',
              backdropFilter: 'blur(14px)',
              border: '1px solid var(--border-glass)',
              color: 'var(--text-secondary)',
            }}
          >
            <Cpu size={13} style={{ color: '#22c55e' }} />
            北纬 {DEFAULT_LATITUDE.toFixed(1)}° · 东经 {DEFAULT_LONGITUDE.toFixed(1)}°
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, pointerEvents: 'auto' }}>
          <button
            className="hamburger-btn md:hidden"
            onClick={() => {
              setMobileLeftOpen((v) => !v);
              if (!mobileLeftOpen) setMobileRightOpen(false);
            }}
            aria-label="显示建筑参数"
          >
            <Building2 size={20} />
          </button>
          <button
            className="hamburger-btn md:hidden"
            onClick={() => {
              setMobileRightOpen((v) => !v);
              if (!mobileRightOpen) setMobileLeftOpen(false);
            }}
            aria-label="显示控制面板"
          >
            {mobileRightOpen ? <XIcon size={20} /> : <SunIcon size={20} />}
          </button>
        </div>
      </div>

      {/* 左侧面板 - 说明 */}
      <div
        className={`panel-left ${mobileLeftOpen ? '' : 'hidden md:flex'}`}
        style={{
          position: 'absolute',
          top: 12,
          left: 12,
          bottom: 12,
          width: 280,
          zIndex: 40,
          overflowY: 'auto',
          padding: '70px 10px 10px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div className="glass-panel p-4">
          <div className="section-title">
            <Info size={14} color="#e94560" />
            操作指南
          </div>
          <ul className="text-xs space-y-3" style={{ color: 'var(--text-secondary)' }}>
            <li className="flex gap-2 items-start">
              <span style={{ color: '#e94560', flexShrink: 0, fontWeight: 700 }}>01</span>
              <span>调整右侧「建筑参数」滑块自定义体块尺寸</span>
            </li>
            <li className="flex gap-2 items-start">
              <span style={{ color: '#e94560', flexShrink: 0, fontWeight: 700 }}>02</span>
              <span>切换日期与时间，太阳位置和阴影将平滑过渡</span>
            </li>
            <li className="flex gap-2 items-start">
              <span style={{ color: '#e94560', flexShrink: 0, fontWeight: 700 }}>03</span>
              <span>勾选「轨迹线 / 等照时线 / 热力图」查看分析结果</span>
            </li>
            <li className="flex gap-2 items-start">
              <span style={{ color: '#e94560', flexShrink: 0, fontWeight: 700 }}>04</span>
              <span>点击地面任意位置，查看该点全天日照时段统计</span>
            </li>
          </ul>
        </div>

        <div className="glass-panel p-4">
          <div className="section-title">视角操作</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-lg text-center" style={{ background: 'rgba(15,23,42,0.5)' }}>
              <div className="font-display font-semibold text-sm mb-0.5" style={{ color: 'var(--text-primary)' }}>
                左键拖拽
              </div>
              <div style={{ color: 'var(--text-secondary)' }}>旋转视角</div>
            </div>
            <div className="p-2.5 rounded-lg text-center" style={{ background: 'rgba(15,23,42,0.5)' }}>
              <div className="font-display font-semibold text-sm mb-0.5" style={{ color: 'var(--text-primary)' }}>
                滚轮
              </div>
              <div style={{ color: 'var(--text-secondary)' }}>缩放</div>
            </div>
            <div className="p-2.5 rounded-lg text-center" style={{ background: 'rgba(15,23,42,0.5)' }}>
              <div className="font-display font-semibold text-sm mb-0.5" style={{ color: 'var(--text-primary)' }}>
                右键拖拽
              </div>
              <div style={{ color: 'var(--text-secondary)' }}>平移</div>
            </div>
            <div className="p-2.5 rounded-lg text-center" style={{ background: 'rgba(15,23,42,0.5)' }}>
              <div className="font-display font-semibold text-sm mb-0.5" style={{ color: 'var(--text-primary)' }}>
                点击地面
              </div>
              <div style={{ color: 'var(--text-secondary)' }}>日照报告</div>
            </div>
          </div>
        </div>

        <div className="glass-panel p-4">
          <div className="section-title">图例说明</div>
          <div className="space-y-3 text-xs">
            <div className="flex items-center gap-3">
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 4,
                  background: 'linear-gradient(90deg,#2563eb,#f59e0b,#dc2626)',
                  flexShrink: 0,
                  opacity: 0.9,
                }}
              />
              <div style={{ color: 'var(--text-secondary)' }}>
                热力图：蓝 → 红 = 阴影覆盖由低到高
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div
                style={{
                  width: 18,
                  borderTop: '2px dashed #e94560',
                  flexShrink: 0,
                }}
              />
              <div style={{ color: 'var(--text-secondary)' }}>阴影轨迹线：一天中阴影尖端轨迹</div>
            </div>
            <div className="flex items-center gap-3">
              <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#eab308' }} />
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#f97316' }} />
              </div>
              <div style={{ color: 'var(--text-secondary)' }}>等照时线：相同日照时长等值线</div>
            </div>
          </div>
        </div>
      </div>

      {/* 中央 3D 场景 */}
      <div style={{ position: 'absolute', inset: 0 }}>
        <SceneView
          buildingConfig={buildingConfig}
          currentDate={currentDate}
          currentHour={currentHour}
          displayOptions={displayOptions}
          shadowData={shadowData}
          onGroundClick={handleGroundClick}
          dateStr={dateStr}
          onShadowDataReady={onShadowDataReady}
        />
      </div>

      {/* 右侧面板 - 控制 + 数据 */}
      <div
        className={`panel-right ${mobileRightOpen ? '' : 'hidden md:block'}`}
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          bottom: 12,
          width: 330,
          zIndex: 40,
          overflowY: 'auto',
          padding: '70px 10px 10px 10px',
        }}
      >
        <ControlPanel
          buildingConfig={buildingConfig}
          onBuildingChange={handleBuildingChange}
          currentDate={currentDate}
          onDateChange={handleDateChange}
          currentHour={currentHour}
          onHourChange={setCurrentHour}
          displayOptions={displayOptions}
          onDisplayOptionsChange={setDisplayOptions}
          sunPosition={sunPosition}
          regenerateHeatmap={regenerateHeatmap}
          isHeatmapComputing={isHeatmapComputing}
          buildingStats={buildingStats}
        />
      </div>

      <InfoModal
        info={groundClickInfo}
        onClose={() => setGroundClickInfo(null)}
      />
    </div>
  );
}
