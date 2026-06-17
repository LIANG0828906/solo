import React, { useRef, useEffect } from 'react';
import { useSoundMapStore } from '../store';
import { SOUND_TYPE_COLORS, SOUND_TYPE_EMOJI, SOUND_TYPE_LABELS, SoundSample } from '../types';

function WaveformBar({ soundType, volume }: { soundType: SoundSample['soundType']; volume: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const color = SOUND_TYPE_COLORS[soundType];
    const barCount = 24;
    let frame = 0;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = canvas.width / barCount;
      for (let i = 0; i < barCount; i++) {
        const baseHeight = (volume / 100) * canvas.height * 0.8;
        const variation = Math.sin(frame * 0.08 + i * 0.5) * canvas.height * 0.15;
        const h = Math.max(2, baseHeight + variation);
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.7 + Math.sin(frame * 0.05 + i * 0.3) * 0.3;
        ctx.fillRect(i * barWidth + 1, canvas.height - h, barWidth - 2, h);
      }
      ctx.globalAlpha = 1;
      frame++;
      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [soundType, volume]);

  return <canvas ref={canvasRef} width={260} height={20} style={{ width: '100%', height: 20, borderRadius: 4 }} />;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

const Sidebar: React.FC = () => {
  const {
    samples,
    route,
    isAddingMode,
    setAddingMode,
    generateRoute,
    startTour,
    stopTour,
    isTourPlaying,
    activeTourIndex,
  } = useSoundMapStore();

  const activeSampleId = isTourPlaying && route && activeTourIndex >= 0
    ? route.points[activeTourIndex]?.sampleId
    : null;

  const sortedSamples = route
    ? route.points
        .map((p) => samples.find((s) => s.id === p.sampleId))
        .filter(Boolean) as SoundSample[]
    : [...samples];

  const handleCardClick = (sample: SoundSample) => {
    const mapEl = document.querySelector('.leaflet-container') as any;
    if (mapEl && (mapEl as any)._leaflet_map) {
      const map = (mapEl as any)._leaflet_map;
      map.flyTo([sample.lat, sample.lng], 16, { duration: 1.5, easeLinearity: 0.25 });
    }
  };

  return (
    <div style={{
      width: 320,
      background: '#2D3436',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      flexShrink: 0,
    }}>
      <div style={{
        padding: '20px 16px 12px',
        borderBottom: '1px solid #3D4448',
      }}>
        <h1 style={{
          color: '#fff',
          fontSize: 20,
          fontWeight: 700,
          margin: '0 0 16px',
          letterSpacing: 1,
        }}>
          🎧 声音地图探索者
        </h1>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={() => setAddingMode(!isAddingMode)}
            style={{
              padding: '8px 16px',
              borderRadius: 50,
              border: 'none',
              background: isAddingMode ? '#00A383' : '#00B894',
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.2s ease, opacity 0.15s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#00A383'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = isAddingMode ? '#00A383' : '#00B894'; }}
          >
            {isAddingMode ? '✕ 取消' : '＋ 添加声音采样'}
          </button>

          <button
            onClick={generateRoute}
            disabled={samples.length < 2}
            style={{
              padding: '8px 16px',
              borderRadius: 50,
              border: 'none',
              background: samples.length < 2 ? '#636e72' : '#E17055',
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              cursor: samples.length < 2 ? 'not-allowed' : 'pointer',
              transition: 'background 0.25s ease, opacity 0.15s',
              whiteSpace: 'nowrap',
              opacity: samples.length < 2 ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (samples.length >= 2) (e.currentTarget as HTMLButtonElement).style.background = '#D45A3E';
            }}
            onMouseLeave={(e) => {
              if (samples.length >= 2) (e.currentTarget as HTMLButtonElement).style.background = '#E17055';
            }}
          >
            🗺️ 生成声景路线
          </button>

          {route && (
            <button
              onClick={isTourPlaying ? stopTour : startTour}
              style={{
                padding: '8px 16px',
                borderRadius: 50,
                border: 'none',
                background: isTourPlaying ? '#d63031' : '#00B894',
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.25s ease, opacity 0.15s',
                whiteSpace: 'nowrap',
              }}
            >
              {isTourPlaying ? '⏹ 停止导览' : '▶ 开始导览'}
            </button>
          )}
        </div>
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}>
        {sortedSamples.length === 0 && (
          <div style={{
            color: '#636e72',
            textAlign: 'center',
            marginTop: 40,
            fontSize: 14,
            lineHeight: 1.8,
          }}>
            点击上方按钮添加声音采样<br />
            在地图上选择位置记录声音
          </div>
        )}

        {sortedSamples.map((sample, idx) => {
          const isActive = sample.id === activeSampleId;
          const order = route?.points.findIndex((p) => p.sampleId === sample.id);

          return (
            <div
              key={sample.id}
              onClick={() => handleCardClick(sample)}
              style={{
                background: isActive ? '#4A5358' : '#3D4448',
                borderRadius: 12,
                padding: 12,
                cursor: 'pointer',
                transition: 'background 0.2s ease, border-color 0.2s ease',
                border: isActive ? '2px solid #00B894' : '2px solid transparent',
                boxShadow: '#00000020 0 2px 8px',
              }}
              onMouseEnter={(e) => {
                if (!isActive) (e.currentTarget as HTMLDivElement).style.background = '#484F54';
              }}
              onMouseLeave={(e) => {
                if (!isActive) (e.currentTarget as HTMLDivElement).style.background = '#3D4448';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <div>
                  <div style={{ color: '#fff', fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
                    {route && order !== undefined && order >= 0 && (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        background: '#2D3436',
                        color: '#fff',
                        fontSize: 12,
                        fontWeight: 700,
                        marginRight: 6,
                        verticalAlign: 'middle',
                      }}>
                        {order + 1}
                      </span>
                    )}
                    {sample.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      display: 'inline-block',
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: SOUND_TYPE_COLORS[sample.soundType],
                      flexShrink: 0,
                    }} />
                    <span style={{ color: '#B2BEC3', fontSize: 13 }}>
                      {SOUND_TYPE_EMOJI[sample.soundType]} {SOUND_TYPE_LABELS[sample.soundType]}
                    </span>
                    <span style={{ color: '#636e72', fontSize: 12, marginLeft: 4 }}>
                      {formatTime(sample.recordedAt)}
                    </span>
                  </div>
                </div>
              </div>

              {isActive && sample.description && (
                <div style={{
                  color: '#DFE6E9',
                  fontSize: 13,
                  lineHeight: 1.5,
                  marginBottom: 6,
                  padding: '6px 8px',
                  background: '#2D343650',
                  borderRadius: 6,
                }}>
                  {sample.description}
                </div>
              )}

              <WaveformBar soundType={sample.soundType} volume={sample.volume} />
            </div>
          );
        })}
      </div>

      <div style={{
        padding: '10px 16px',
        borderTop: '1px solid #3D4448',
        color: '#636e72',
        fontSize: 12,
        textAlign: 'center',
      }}>
        已记录 {samples.length} 个声音采样点
        {route && ` · 路线 ${route.points.length} 站`}
      </div>
    </div>
  );
};

export default Sidebar;
