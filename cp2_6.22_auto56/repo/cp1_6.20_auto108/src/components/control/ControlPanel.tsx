import { useMemo } from 'react';
import {
  CalendarDays,
  Clock3,
  Eye,
  Sun as SunIcon,
  Compass,
  TrendingUp,
  Activity,
  MapPin,
  RefreshCw,
} from 'lucide-react';
import type { BuildingConfig, DisplayOptions, SunPosition } from '../../types';
import { formatHour, formatDateKey } from '../../utils/suncalc';

interface ControlPanelProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  currentHour: number;
  onHourChange: (hour: number) => void;
  displayOptions: DisplayOptions;
  onDisplayOptionsChange: (opts: DisplayOptions) => void;
  sunPosition: SunPosition;
  regenerateHeatmap: () => void;
  isHeatmapComputing: boolean;
  buildingStats: { totalHeight: number; footprint: number };
  buildingConfig: BuildingConfig;
  onBuildingChange: (cfg: BuildingConfig) => void;
}

function NumberSlider({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="slider-wrap">
      <div className="slider-label">
        <span>{label}</span>
        <span className="slider-value">
          {value.toFixed(step < 1 ? 1 : 0)}
          <span style={{ fontSize: 11, fontWeight: 400, marginLeft: 3, color: 'var(--text-secondary)' }}>
            {unit}
          </span>
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </div>
  );
}

export default function ControlPanel({
  currentDate,
  onDateChange,
  currentHour,
  onHourChange,
  displayOptions,
  onDisplayOptionsChange,
  sunPosition,
  regenerateHeatmap,
  isHeatmapComputing,
  buildingStats,
  buildingConfig,
  onBuildingChange,
}: ControlPanelProps) {
  const azimuthDeg = useMemo(() => (sunPosition.azimuth * 180) / Math.PI, [sunPosition.azimuth]);
  const altitudeDeg = useMemo(() => (sunPosition.altitude * 180) / Math.PI, [sunPosition.altitude]);
  const dateInputVal = formatDateKey(currentDate);
  const year = currentDate.getFullYear();

  return (
    <div className="flex flex-col gap-4">
      {/* 建筑参数 (紧凑版) */}
      <div className="glass-panel p-4">
        <div className="section-title">建筑参数</div>
        <div className="grid grid-cols-2 gap-x-3">
          <NumberSlider
            label="长度"
            value={buildingConfig.length}
            min={5}
            max={50}
            step={1}
            unit="m"
            onChange={(v) => onBuildingChange({ ...buildingConfig, length: v })}
          />
          <NumberSlider
            label="宽度"
            value={buildingConfig.width}
            min={5}
            max={50}
            step={1}
            unit="m"
            onChange={(v) => onBuildingChange({ ...buildingConfig, width: v })}
          />
          <NumberSlider
            label="层数"
            value={buildingConfig.floors}
            min={1}
            max={30}
            step={1}
            unit="F"
            onChange={(v) => onBuildingChange({ ...buildingConfig, floors: v })}
          />
          <NumberSlider
            label="层高"
            value={buildingConfig.floorHeight}
            min={2.5}
            max={6}
            step={0.1}
            unit="m"
            onChange={(v) => onBuildingChange({ ...buildingConfig, floorHeight: v })}
          />
        </div>
        <div className="grid grid-cols-2 gap-2 mt-1">
          <div className="p-2.5 rounded-lg text-xs" style={{ background: 'rgba(15,23,42,0.5)' }}>
            <div style={{ color: 'var(--text-secondary)' }}>总高度</div>
            <div className="font-display font-semibold text-base" style={{ color: 'var(--accent)' }}>
              {buildingStats.totalHeight.toFixed(1)}m
            </div>
          </div>
          <div className="p-2.5 rounded-lg text-xs" style={{ background: 'rgba(15,23,42,0.5)' }}>
            <div style={{ color: 'var(--text-secondary)' }}>占地面积</div>
            <div className="font-display font-semibold text-base" style={{ color: 'var(--accent)' }}>
              {buildingStats.footprint.toFixed(0)}m²
            </div>
          </div>
        </div>
      </div>

      {/* 日期时间控制 */}
      <div className="glass-panel p-4">
        <div className="section-title">
          <CalendarDays size={14} color="#e94560" />
          日期与时间
        </div>
        <div style={{ marginBottom: 14 }}>
          <div className="slider-label mb-1.5" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <CalendarDays size={12} style={{ color: 'var(--text-secondary)' }} />
            <span style={{ color: 'var(--text-secondary)' }}>日期选择</span>
          </div>
          <input
            type="date"
            value={dateInputVal}
            min={`${year}-01-01`}
            max={`${year}-12-31`}
            onChange={(e) => {
              const [y, m, d] = e.target.value.split('-').map(Number);
              onDateChange(new Date(y, m - 1, d));
            }}
          />
        </div>

        <div style={{ position: 'relative', paddingTop: 24 }}>
          {[6, 8, 10, 12, 14, 16, 18].map((h) => (
            <div
              key={h}
              className="time-tick-mark"
              style={{ left: `${((h - 6) / 12) * 100}%`, bottom: 8 }}
            >
              <div className="time-tick-label">{String(h).padStart(2, '0')}</div>
            </div>
          ))}
          <div className="slider-wrap">
            <div className="slider-label">
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock3 size={12} style={{ color: 'var(--text-secondary)' }} />
                <span style={{ color: 'var(--text-secondary)' }}>当前时间</span>
              </span>
              <span
                className="font-display font-semibold text-lg"
                style={{ color: altitudeDeg > 0 ? '#fbbf24' : '#64748b' }}
              >
                {formatHour(currentHour)}
              </span>
            </div>
            <input
              type="range"
              min={6}
              max={18}
              step={0.1}
              value={currentHour}
              onChange={(e) => onHourChange(parseFloat(e.target.value))}
            />
          </div>
        </div>
        <div className="flex gap-2 mt-4 flex-wrap">
          {[6, 9, 12, 15, 18].map((h) => (
            <button
              key={h}
              className="btn-secondary"
              style={{ flex: 1, minWidth: 0, padding: '7px 6px', fontSize: 11 }}
              onClick={() => onHourChange(h)}
            >
              {String(h).padStart(2, '0')}:00
            </button>
          ))}
        </div>
      </div>

      {/* 显示模式 */}
      <div className="glass-panel p-4">
        <div className="section-title">
          <Eye size={14} color="#e94560" />
          显示选项
        </div>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={displayOptions.showShadowTrail}
            onChange={(e) =>
              onDisplayOptionsChange({
                ...displayOptions,
                showShadowTrail: e.target.checked,
              })
            }
          />
          <TrendingUp size={14} style={{ color: '#e94560', flexShrink: 0 }} />
          <span>阴影轨迹线</span>
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(233,69,96,0.15)', color: '#e94560' }}>
            橙虚线
          </span>
        </label>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={displayOptions.showIsochron}
            onChange={(e) =>
              onDisplayOptionsChange({
                ...displayOptions,
                showIsochron: e.target.checked,
              })
            }
          />
          <Activity size={14} style={{ color: '#22c55e', flexShrink: 0 }} />
          <span>等照时线</span>
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}>
            彩色点
          </span>
        </label>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={displayOptions.showHeatmap}
            onChange={(e) =>
              onDisplayOptionsChange({
                ...displayOptions,
                showHeatmap: e.target.checked,
              })
            }
          />
          <MapPin size={14} style={{ color: '#3b82f6', flexShrink: 0 }} />
          <span>阴影热力图</span>
        </label>
        <button
          className="btn-primary mt-3"
          onClick={regenerateHeatmap}
          disabled={isHeatmapComputing}
          style={{
            opacity: isHeatmapComputing ? 0.65 : 1,
            cursor: isHeatmapComputing ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <RefreshCw
            size={15}
            style={{ animation: isHeatmapComputing ? 'spin 1s linear infinite' : 'none' }}
          />
          {isHeatmapComputing ? '重新计算中...' : '重新计算热力图'}
        </button>
      </div>

      {/* 实时数据 */}
      <div className="glass-panel p-4">
        <div className="section-title">
          <SunIcon size={14} color="#e94560" />
          实时太阳数据
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="stat-card">
            <div className="stat-label flex items-center gap-1">
              <Compass size={10} /> 方位角
            </div>
            <div className="stat-value">
              {azimuthDeg.toFixed(1)}
              <span className="stat-unit">°</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label flex items-center gap-1">
              <SunIcon size={10} /> 高度角
            </div>
            <div
              className="stat-value"
              style={{ color: altitudeDeg > 0 ? '#fbbf24' : '#64748b' }}
            >
              {altitudeDeg.toFixed(1)}
              <span className="stat-unit">°</span>
            </div>
          </div>
        </div>
        <div
          className="mt-3 p-3 rounded-lg text-xs"
          style={{ background: 'rgba(15,23,42,0.5)', color: 'var(--text-secondary)' }}
        >
          <div className="flex justify-between mb-1.5">
            <span>太阳状态</span>
            <span style={{ color: altitudeDeg > 0 ? '#22c55e' : '#f87171', fontWeight: 600 }}>
              {altitudeDeg > 0 ? '☀️ 日照中' : '🌙 地平线以下'}
            </span>
          </div>
          <div className="flex justify-between mb-1.5">
            <span>日期</span>
            <span className="font-display" style={{ color: 'var(--text-primary)' }}>
              {dateInputVal}
            </span>
          </div>
          <div className="flex justify-between">
            <span>时间</span>
            <span className="font-display" style={{ color: 'var(--text-primary)' }}>
              {formatHour(currentHour)}
            </span>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
