import { useEffect, useRef, useState } from 'react';
import { Dataset, Marker, ProfileData, TEMPERATURE_COLOR_MAP, PRESSURE_COLOR_MAP, WIND_COLOR_MAP } from '../types';
import { getAvailableDatasets } from '../utils/dataLoader';

interface UIPanelProps {
  dataset: Dataset | null;
  markers: Marker[];
  profile: ProfileData | null;
  selectedDatasetId: string;
  onSelectDataset: (id: string) => void;
  onRemoveMarker: (id: string) => void;
  onClearMarkers: () => void;
  onClearProfile: () => void;
  isMobile: boolean;
}

const getUnit = (type: string): string => {
  switch (type) {
    case 'temperature':
      return '°C';
    case 'pressure':
      return 'hPa';
    case 'wind':
      return 'm/s';
    default:
      return '';
  }
};

const getTypeLabel = (type: string): string => {
  switch (type) {
    case 'temperature':
      return '温度';
    case 'pressure':
      return '气压';
    case 'wind':
      return '风速';
    default:
      return '数值';
  }
};

const getColorMap = (type: string) => {
  switch (type) {
    case 'temperature':
      return TEMPERATURE_COLOR_MAP;
    case 'pressure':
      return PRESSURE_COLOR_MAP;
    case 'wind':
      return WIND_COLOR_MAP;
    default:
      return TEMPERATURE_COLOR_MAP;
  }
};

const getCurveColor = (type: string): string => {
  switch (type) {
    case 'temperature':
      return '#EF4444';
    case 'pressure':
      return '#F59E0B';
    case 'wind':
      return '#8B5CF6';
    default:
      return '#3B82F6';
  }
};

const hexToRgbStr = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '0, 0, 0';
};

interface ColorBarProps {
  dataset: Dataset;
}

const ColorBar = ({ dataset }: ColorBarProps) => {
  const colorMap = getColorMap(dataset.type);
  const stops = colorMap.stops;
  const [min, max] = dataset.valueRange;

  const gradient = stops
    .map((s) => `rgb(${hexToRgbStr(s.color)}) ${(s.position * 100).toFixed(0)}%`)
    .join(', ');

  return (
    <div style={{ width: '100%', marginTop: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 11, color: '#94A3B8' }}>
        <span>{min}</span>
        <span>{max}</span>
      </div>
      <div
        style={{
          width: '100%',
          height: 10,
          borderRadius: 5,
          background: `linear-gradient(to right, ${gradient})`,
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3)',
        }}
      />
    </div>
  );
};

interface ProfileChartProps {
  profile: ProfileData;
  datasetType: string;
}

const ProfileChart = ({ profile, datasetType }: ProfileChartProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 248, height: 160 });

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth;
        setDimensions({ width: w, height: 160 });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    canvas.style.width = `${dimensions.width}px`;
    canvas.style.height = `${dimensions.height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    const padding = { top: 16, right: 12, bottom: 28, left: 36 };
    const chartWidth = dimensions.width - padding.left - padding.right;
    const chartHeight = dimensions.height - padding.top - padding.bottom;

    const samples = profile.samples;
    if (samples.length === 0) return;

    const xValues = samples.map((s) => s.distance);
    const yValues = samples.map((s) => s.value);
    const xMin = Math.min(...xValues);
    const xMax = Math.max(...xValues);
    let yMin = Math.min(...yValues);
    let yMax = Math.max(...yValues);
    const yPadding = (yMax - yMin) * 0.1 || 1;
    yMin -= yPadding;
    yMax += yPadding;

    ctx.fillStyle = '#1E293B';
    ctx.beginPath();
    ctx.roundRect(0, 0, dimensions.width, dimensions.height, 8);
    ctx.fill();

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;

    const xTickCount = 5;
    for (let i = 0; i <= xTickCount; i++) {
      const x = padding.left + (chartWidth * i) / xTickCount;
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, padding.top + chartHeight);
      ctx.globalAlpha = 0.3;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    const yTickCount = 4;
    for (let i = 0; i <= yTickCount; i++) {
      const y = padding.top + (chartHeight * i) / yTickCount;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + chartWidth, y);
      ctx.globalAlpha = 0.3;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    ctx.fillStyle = '#94A3B8';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';

    for (let i = 0; i <= xTickCount; i++) {
      const x = padding.left + (chartWidth * i) / xTickCount;
      const val = xMin + ((xMax - xMin) * i) / xTickCount;
      ctx.fillText(val.toFixed(0), x, padding.top + chartHeight + 16);
    }

    ctx.textAlign = 'right';
    for (let i = 0; i <= yTickCount; i++) {
      const y = padding.top + (chartHeight * i) / yTickCount;
      const val = yMax - ((yMax - yMin) * i) / yTickCount;
      ctx.fillText(val.toFixed(1), padding.left - 6, y + 3);
    }

    ctx.fillStyle = '#64748B';
    ctx.textAlign = 'center';
    ctx.fillText('距离', padding.left + chartWidth / 2, dimensions.height - 4);
    ctx.save();
    ctx.translate(10, padding.top + chartHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(getTypeLabel(datasetType) + `(${getUnit(datasetType)})`, 0, 0);
    ctx.restore();

    const mapX = (v: number) =>
      padding.left + ((v - xMin) / (xMax - xMin || 1)) * chartWidth;
    const mapY = (v: number) =>
      padding.top + chartHeight - ((v - yMin) / (yMax - yMin || 1)) * chartHeight;

    const curveColor = getCurveColor(datasetType);

    ctx.beginPath();
    ctx.moveTo(mapX(samples[0].distance), mapY(samples[0].value));
    for (let i = 1; i < samples.length; i++) {
      const x = mapX(samples[i].distance);
      const y = mapY(samples[i].value);
      const prevX = mapX(samples[i - 1].distance);
      const prevY = mapY(samples[i - 1].value);
      const cpX = (prevX + x) / 2;
      ctx.bezierCurveTo(cpX, prevY, cpX, y, x, y);
    }
    const lastX = mapX(samples[samples.length - 1].distance);
    const firstX = mapX(samples[0].distance);
    const bottomY = padding.top + chartHeight;

    ctx.lineTo(lastX, bottomY);
    ctx.lineTo(firstX, bottomY);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(0, padding.top, 0, bottomY);
    gradient.addColorStop(0, `${curveColor}55`);
    gradient.addColorStop(1, `${curveColor}05`);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(mapX(samples[0].distance), mapY(samples[0].value));
    for (let i = 1; i < samples.length; i++) {
      const x = mapX(samples[i].distance);
      const y = mapY(samples[i].value);
      const prevX = mapX(samples[i - 1].distance);
      const prevY = mapY(samples[i - 1].value);
      const cpX = (prevX + x) / 2;
      ctx.bezierCurveTo(cpX, prevY, cpX, y, x, y);
    }
    ctx.strokeStyle = curveColor;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.stroke();

    const dotIndices = [0, Math.floor(samples.length / 4), Math.floor(samples.length / 2), Math.floor((3 * samples.length) / 4), samples.length - 1];
    for (const idx of dotIndices) {
      const s = samples[idx];
      const x = mapX(s.distance);
      const y = mapY(s.value);
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = curveColor;
      ctx.fill();
      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    const avg = samples.reduce((a, b) => a + b.value, 0) / samples.length;
    const avgY = mapY(avg);
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(padding.left, avgY);
    ctx.lineTo(padding.left + chartWidth, avgY);
    ctx.strokeStyle = '#FBBF24';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]);
  }, [profile, datasetType, dimensions]);

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      <canvas ref={canvasRef} />
    </div>
  );
};

const UIPanel = ({
  dataset,
  markers,
  profile,
  selectedDatasetId,
  onSelectDataset,
  onRemoveMarker,
  onClearMarkers,
  onClearProfile,
  isMobile,
}: UIPanelProps) => {
  const datasets = getAvailableDatasets();
  const [expandedSections, setExpandedSections] = useState({
    data: true,
    markers: true,
    profile: true,
  });

  const toggleSection = (section: 'data' | 'markers' | 'profile') => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const sectionHeaderStyle = (expanded: boolean) => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    cursor: 'pointer',
    borderBottom: expanded ? '1px solid #334155' : 'none',
    userSelect: 'none',
  });

  const panelStyle: React.CSSProperties = isMobile
    ? {
        width: '100%',
        maxHeight: '50vh',
        overflowY: 'auto',
        background: '#0F172A',
        borderRadius: 12,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
      }
    : {
        width: 280,
        flexShrink: 0,
        overflowY: 'auto',
        background: '#0F172A',
        borderRadius: 12,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
      };

  return (
    <div style={panelStyle}>
      <div onClick={() => toggleSection('data')} style={sectionHeaderStyle(expandedSections.data)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#E2E8F0' }}>📊 数据源</span>
        </div>
        <span style={{ color: '#94A3B8', fontSize: 12, transform: expandedSections.data ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }}>▼</span>
      </div>

      {expandedSections.data && (
        <div style={{ padding: '12px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {datasets.map((ds) => {
            const isSelected = selectedDatasetId === ds.id;
            return (
              <button
                key={ds.id}
                onClick={() => onSelectDataset(ds.id)}
                style={{
                  width: '100%',
                  padding: 12,
                  borderRadius: 8,
                  border: isSelected ? '1px solid #3B82F6' : '1px solid transparent',
                  background: isSelected ? '#1E3A5F' : '#1E293B',
                  color: '#E2E8F0',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontSize: 13,
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = '#334155';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = '#1E293B';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500 }}>
                  <span>
                    {ds.type === 'temperature' ? '🌡️' : ds.type === 'pressure' ? '💨' : '🌊'}
                  </span>
                  <span>{ds.name}</span>
                </div>
                {isSelected && dataset && (
                  <div style={{ marginTop: 6, fontSize: 11, color: '#94A3B8', lineHeight: 1.5 }}>
                    <div style={{ marginBottom: 4 }}>{dataset.description}</div>
                    <div>
                      点数：{dataset.points.length.toLocaleString()} · 范围：
                      {dataset.valueRange[0]} ~ {dataset.valueRange[1]}
                    </div>
                  </div>
                )}
              </button>
            );
          })}
          {dataset && <ColorBar dataset={dataset} />}
        </div>
      )}

      <div onClick={() => toggleSection('markers')} style={sectionHeaderStyle(expandedSections.markers)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#E2E8F0' }}>📍 标记点</span>
          <span
            style={{
              background: '#3B82F6',
              color: 'white',
              fontSize: 11,
              padding: '2px 8px',
              borderRadius: 10,
              fontWeight: 500,
            }}
          >
            {markers.length}
          </span>
        </div>
        <span style={{ color: '#94A3B8', fontSize: 12, transform: expandedSections.markers ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }}>▼</span>
      </div>

      {expandedSections.markers && (
        <div style={{ padding: '12px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {markers.length > 0 && (
            <button
              onClick={onClearMarkers}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                border: 'none',
                background: '#334155',
                color: '#E2E8F0',
                cursor: 'pointer',
                fontSize: 12,
                alignSelf: 'flex-end',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = '#475569')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = '#334155')}
            >
              清空全部
            </button>
          )}

          {markers.length === 0 ? (
            <div
              style={{
                padding: 20,
                background: '#1E293B',
                borderRadius: 8,
                textAlign: 'center',
                color: '#64748B',
                fontSize: 12,
              }}
            >
              暂无标记点
              <div style={{ marginTop: 4, fontSize: 11 }}>切换到「标记」模式后点击场景添加</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: isMobile ? 160 : 200, overflowY: 'auto' }}>
              {markers.map((marker, idx) => (
                <div
                  key={marker.id}
                  style={{
                    padding: 10,
                    background: '#1E293B',
                    borderRadius: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = '#334155')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = '#1E293B')}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 500, fontSize: 12, color: '#E2E8F0' }}>
                      标记 #{idx + 1}
                    </span>
                    <button
                      onClick={() => onRemoveMarker(marker.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#EF4444',
                        cursor: 'pointer',
                        fontSize: 14,
                        padding: '2px 6px',
                        borderRadius: 4,
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(239, 68, 68, 0.15)')}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'transparent')}
                    >
                      ✕
                    </button>
                  </div>
                  <div style={{ fontSize: 11, color: '#94A3B8', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 10px' }}>
                    <span style={{ color: '#64748B' }}>数值：</span>
                    <span style={{ color: getCurveColor(dataset?.type || 'temperature'), fontWeight: 600 }}>
                      {marker.value} {dataset ? getUnit(dataset.type) : ''}
                    </span>
                    <span style={{ color: '#64748B' }}>经度：</span>
                    <span>{marker.coordinates.lon}°</span>
                    <span style={{ color: '#64748B' }}>纬度：</span>
                    <span>{marker.coordinates.lat}°</span>
                    <span style={{ color: '#64748B' }}>海拔：</span>
                    <span>{marker.altitude} km</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div onClick={() => toggleSection('profile')} style={sectionHeaderStyle(expandedSections.profile)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#E2E8F0' }}>📈 剖面分析</span>
          {profile && (
            <span
              style={{
                background: '#10B981',
                color: 'white',
                fontSize: 11,
                padding: '2px 8px',
                borderRadius: 10,
                fontWeight: 500,
              }}
            >
              活跃
            </span>
          )}
        </div>
        <span style={{ color: '#94A3B8', fontSize: 12, transform: expandedSections.profile ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }}>▼</span>
      </div>

      {expandedSections.profile && (
        <div style={{ padding: '12px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {!profile ? (
            <div
              style={{
                padding: 20,
                background: '#1E293B',
                borderRadius: 8,
                textAlign: 'center',
                color: '#64748B',
                fontSize: 12,
              }}
            >
              暂无剖面数据
              <div style={{ marginTop: 4, fontSize: 11 }}>切换到「剖面」模式后拖拽绘制线段</div>
            </div>
          ) : (
            <>
              {dataset && <ProfileChart profile={profile} datasetType={dataset.type} />}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: '#94A3B8' }}>
                <div>
                  <span style={{ color: '#64748B' }}>采样点：</span>
                  <span style={{ color: '#E2E8F0' }}>{profile.samples.length}</span>
                </div>
                <div>
                  <span style={{ color: '#64748B' }}>线段长度：</span>
                  <span style={{ color: '#E2E8F0' }}>
                    {profile.samples[profile.samples.length - 1]?.distance?.toFixed(1) || 0} 单位
                  </span>
                </div>
              </div>

              {profile.samples.length > 0 && (
                <div
                  style={{
                    padding: 10,
                    background: '#1E293B',
                    borderRadius: 8,
                    fontSize: 11,
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 8,
                  }}
                >
                  <div>
                    <div style={{ color: '#64748B', marginBottom: 2 }}>最小值</div>
                    <div style={{ color: '#60A5FA', fontWeight: 600 }}>
                      {Math.min(...profile.samples.map((s) => s.value)).toFixed(1)}{' '}
                      {dataset ? getUnit(dataset.type) : ''}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#64748B', marginBottom: 2 }}>最大值</div>
                    <div style={{ color: '#F87171', fontWeight: 600 }}>
                      {Math.max(...profile.samples.map((s) => s.value)).toFixed(1)}{' '}
                      {dataset ? getUnit(dataset.type) : ''}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#64748B', marginBottom: 2 }}>平均值</div>
                    <div style={{ color: '#FBBF24', fontWeight: 600 }}>
                      {(profile.samples.reduce((a, b) => a + b.value, 0) / profile.samples.length).toFixed(1)}{' '}
                      {dataset ? getUnit(dataset.type) : ''}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#64748B', marginBottom: 2 }}>标准差</div>
                    <div style={{ color: '#A78BFA', fontWeight: 600 }}>
                      {(Math.sqrt(profile.samples.reduce((a, b) => a + Math.pow(b.value - (profile.samples.reduce((x, y) => x + y.value, 0) / profile.samples.length), 2), 0) / profile.samples.length)).toFixed(2)}
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={onClearProfile}
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#334155',
                  color: '#E2E8F0',
                  cursor: 'pointer',
                  fontSize: 12,
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = '#475569')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = '#334155')}
              >
                清除剖面
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default UIPanel;
