import { useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { getBuildingById, getEnergyColor, type EnergyLevel } from '@/data/buildingModel';
import { generateDaylightCurveData, getSunCSSColor } from '@/analytics/solarSim';

const ENERGY_DESCS: Record<EnergyLevel, { label: string; range: string }> = {
  A: { label: '极优', range: '≤50 kWh/㎡·年' },
  B: { label: '优秀', range: '51-100 kWh/㎡·年' },
  C: { label: '良好', range: '101-150 kWh/㎡·年' },
  D: { label: '一般', range: '151-220 kWh/㎡·年' },
  E: { label: '较高', range: '＞220 kWh/㎡·年' },
};

function formatEnergy(kWh: number): string {
  if (kWh >= 10000) return `${(kWh / 10000).toFixed(2)} 万kWh/年`;
  return `${kWh.toLocaleString()} kWh/年`;
}

function DaylightChart({ points, currentHour, sunColor }: { points: Array<{ hour: number; value: number }>; currentHour: number; sunColor: string }) {
  const W = 264, H = 110, padL = 28, padR = 10, padT = 10, padB = 22;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const minH = 8, maxH = 18;
  const xFor = (h: number) => padL + ((h - minH) / (maxH - minH)) * plotW;
  const yFor = (v: number) => padT + (1 - Math.min(100, Math.max(0, v)) / 100) * plotH;
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${xFor(p.hour).toFixed(1)} ${yFor(p.value).toFixed(1)}`).join(' ');
  const areaPath = `${path} L${xFor(maxH)} ${padT + plotH} L${xFor(minH)} ${padT + plotH} Z`;
  const xTicks = [8, 10, 12, 14, 16, 18];
  const yTicks = [0, 25, 50, 75, 100];
  const curX = xFor(currentHour);
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
      <defs>
        <linearGradient id="dl-area" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={sunColor} stopOpacity="0.45" />
          <stop offset="100%" stopColor={sunColor} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {yTicks.map((t) => (
        <line key={`yt${t}`} x1={padL} x2={W - padR} y1={yFor(t)} y2={yFor(t)} stroke="#2A3A5A" strokeOpacity="0.5" strokeDasharray="2 2" />
      ))}
      {xTicks.map((t) => (
        <g key={`xt${t}`}>
          <line x1={xFor(t)} x2={xFor(t)} y1={padT} y2={padT + plotH} stroke="#2A3A5A" strokeOpacity="0.25" />
          <text x={xFor(t)} y={H - 6} fontSize="9" fill="#7A8AAC" textAnchor="middle" fontFamily="monospace">{t}:00</text>
        </g>
      ))}
      {yTicks.map((t) => (
        <text key={`ytl${t}`} x={padL - 4} y={yFor(t) + 3} fontSize="9" fill="#7A8AAC" textAnchor="end" fontFamily="monospace">{t}</text>
      ))}
      <path d={areaPath} fill="url(#dl-area)" />
      <path d={path} fill="none" stroke={sunColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <line x1={curX} x2={curX} y1={padT} y2={padT + plotH} stroke="#FFFFFF" strokeOpacity="0.8" strokeDasharray="3 3" />
      <circle cx={curX} cy={yFor(points.find((p) => Math.abs(p.hour - currentHour) < 0.3)?.value ?? 50)} r="3.2" fill="#FFFFFF" stroke={sunColor} strokeWidth="1.2" />
    </svg>
  );
}

export function InfoPanel() {
  const selectedId = useAppStore((s) => s.selectedBuildingId);
  const buildings = useAppStore((s) => s.buildings);
  const solarResults = useAppStore((s) => s.solarResults);
  const currentHour = useAppStore((s) => s.currentHour);
  const setSelected = useAppStore((s) => s.setSelectedBuilding);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const building = useMemo(() => (selectedId ? getBuildingById(buildings, selectedId) : null), [selectedId, buildings]);
  const solar = useMemo(() => solarResults.find((r) => r.buildingId === selectedId), [solarResults, selectedId]);
  const daylightCurve = useMemo(() => (building ? generateDaylightCurveData(building, buildings) : []), [building, buildings]);
  const sunColor = getSunCSSColor(currentHour);

  const visible = Boolean(building);
  const common: React.CSSProperties = {
    position: 'fixed',
    zIndex: 50,
    transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    background: 'rgba(30,30,46,0.85)',
    border: '1px solid rgba(255,255,255,0.08)',
    boxShadow: '0 12px 48px rgba(0,0,0,0.5)',
    color: '#E0E0E0',
    overflow: 'hidden',
  };
  const desktopStyle: React.CSSProperties = {
    ...common,
    top: 72,
    right: visible ? 20 : -360,
    width: 320,
    maxHeight: 'calc(100vh - 140px)',
    borderRadius: 16,
    overflowY: 'auto',
  };
  const mobileStyle: React.CSSProperties = {
    ...common,
    bottom: visible ? 0 : '-100vh',
    left: 0,
    right: 0,
    width: '100%',
    maxHeight: '85vh',
    borderRadius: '20px 20px 0 0',
    overflowY: 'auto',
  };
  const style = isMobile ? mobileStyle : desktopStyle;

  if (!building) {
    return (
      <div style={style}>
        <div style={{ padding: 20, textAlign: 'center', color: '#7A8AAC', fontSize: 13 }}>
          点击场景中的建筑以查看详情
        </div>
      </div>
    );
  }

  const levelColor = getEnergyColor(building.energyLevel);
  const levelDesc = ENERGY_DESCS[building.energyLevel];

  return (
    <div style={style}>
      <div style={{
        padding: '18px 20px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div style={{
            width: 10, height: 10, borderRadius: '50%',
            background: levelColor, boxShadow: `0 0 10px ${levelColor}80`, flexShrink: 0,
          }} />
          <h3 style={{
            margin: 0, fontSize: 17, fontWeight: 600, color: '#FFFFFF',
            letterSpacing: 0.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }} title={building.name}>{building.name}</h3>
        </div>
        <button
          onClick={() => setSelected(null)}
          style={{
            width: 28, height: 28, borderRadius: 8, cursor: 'pointer',
            background: 'rgba(255,255,255,0.06)', border: 'none', color: '#A0AEC0',
            fontSize: 16, lineHeight: '28px', textAlign: 'center', padding: 0,
            transition: 'all 0.2s', flexShrink: 0,
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,82,82,0.2)'; (e.currentTarget as HTMLButtonElement).style.color = '#FF5252'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLButtonElement).style.color = '#A0AEC0'; }}
          aria-label="关闭"
        >×</button>
      </div>

      <div style={{ padding: '16px 20px' }}>
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          borderRadius: 12, padding: 14,
          border: '1px solid rgba(255,255,255,0.04)',
          marginBottom: 16,
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: '#7A8AAC', marginBottom: 4, letterSpacing: 0.5 }}>建筑高度</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#FFFFFF', fontFamily: 'monospace' }}>{building.dimensions.height.toFixed(1)} m</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#7A8AAC', marginBottom: 4, letterSpacing: 0.5 }}>楼层数</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#FFFFFF', fontFamily: 'monospace' }}>{building.floors} 层</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#7A8AAC', marginBottom: 4, letterSpacing: 0.5 }}>占地面积</div>
              <div style={{ fontSize: 16, fontWeight: 500, color: '#FFFFFF', fontFamily: 'monospace' }}>{(building.dimensions.width * building.dimensions.depth).toFixed(1)} ㎡</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#7A8AAC', marginBottom: 4, letterSpacing: 0.5 }}>总体积</div>
              <div style={{ fontSize: 16, fontWeight: 500, color: '#FFFFFF', fontFamily: 'monospace' }}>{(building.dimensions.width * building.dimensions.height * building.dimensions.depth).toFixed(0)} m³</div>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: '#7A8AAC', marginBottom: 8, letterSpacing: 0.5 }}>能耗等级</div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: 'rgba(255,255,255,0.03)',
            borderRadius: 12, padding: 12,
            border: '1px solid rgba(255,255,255,0.04)',
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: `linear-gradient(135deg, ${levelColor}30, ${levelColor}10)`,
              border: `1.5px solid ${levelColor}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: levelColor, fontWeight: 800, fontSize: 20, fontFamily: 'monospace',
              boxShadow: `0 0 20px ${levelColor}30`,
            }}>{building.energyLevel}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                <span style={{ color: '#FFFFFF', fontWeight: 600, fontSize: 14 }}>{levelDesc.label}</span>
                <span style={{ color: levelColor, fontSize: 10, fontFamily: 'monospace' }}>{levelDesc.range}</span>
              </div>
              <div style={{ color: '#A0AEC0', fontSize: 12 }}>
                年能耗：<span style={{ color: levelColor, fontWeight: 600 }}>{formatEnergy(building.energyConsumption)}</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: '#7A8AAC', letterSpacing: 0.5 }}>日照分析（{currentHour.toFixed(1)}:00）</div>
            <div style={{ fontSize: 11, color: sunColor, fontFamily: 'monospace', fontWeight: 600 }}>
              {solar?.daylightHours.toFixed(1) ?? 0}% 日照
            </div>
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            borderRadius: 12, padding: 12,
            border: '1px solid rgba(255,255,255,0.04)',
            marginBottom: 10,
          }}>
            <DaylightChart points={daylightCurve} currentHour={currentHour} sunColor={sunColor} />
          </div>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6,
          }}>
            {(['top', 'south', 'east', 'west', 'north'] as const).map((face) => {
              const names: Record<string, string> = { top: '顶面', south: '南', east: '东', west: '西', north: '北' };
              const v = solar?.surfaceBrightness[face] ?? 0;
              const pct = Math.min(100, Math.round(v * 100));
              return (
                <div key={face} style={{
                  background: 'rgba(255,255,255,0.025)',
                  borderRadius: 8, padding: '8px 4px',
                  border: '1px solid rgba(255,255,255,0.04)',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 10, color: '#7A8AAC', marginBottom: 4 }}>{names[face]}</div>
                  <div style={{
                    height: 36, borderRadius: 4,
                    background: `linear-gradient(to top, ${sunColor}80 0%, ${sunColor}20 ${100 - pct}%, rgba(255,255,255,0.04) ${100 - pct}%, rgba(255,255,255,0.04) 100%)`,
                    marginBottom: 4,
                  }} />
                  <div style={{ fontSize: 10, fontFamily: 'monospace', color: pct > 50 ? sunColor : '#A0AEC0' }}>{pct}%</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
