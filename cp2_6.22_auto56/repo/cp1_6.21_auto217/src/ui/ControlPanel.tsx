import { useState, useRef, useCallback, useEffect } from 'react';
import { useNebulaContext } from '@/context/NebulaContext';
import { PRESETS } from '@/utils/nebulaPresets';

const panelStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: 20,
  right: 20,
  width: 320,
  background: 'rgba(15, 23, 42, 0.8)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  borderRadius: 16,
  padding: 20,
  border: '1px solid #1E293B',
  zIndex: 100,
  color: '#E2E8F0',
  fontFamily: "'Segoe UI', system-ui, sans-serif",
  fontSize: 13,
  maxHeight: 'calc(100vh - 40px)',
  overflowY: 'auto',
};

const sliderTrackStyle: React.CSSProperties = {
  width: '100%',
  height: 6,
  borderRadius: 3,
  background: '#334155',
  outline: 'none',
  WebkitAppearance: 'none',
  appearance: 'none',
  cursor: 'pointer',
  transition: 'all 0.2s',
};

const labelStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 4,
  fontSize: 12,
  color: '#94A3B8',
};

function SliderControl({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={labelStyle}>
        <span>{label}</span>
        <span style={{ color: '#E2E8F0', fontWeight: 600 }}>{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={sliderTrackStyle}
        className="nebula-slider"
      />
    </div>
  );
}

export default function ControlPanel() {
  const { params, updateParams, applyPreset, snapshots, saveSnapshot, loadSnapshot } = useNebulaContext();
  const [presetOpen, setPresetOpen] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSaveSnapshot = useCallback(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    const thumbnail = canvas.toDataURL('image/jpeg', 0.6);
    saveSnapshot(thumbnail);
    setToastVisible(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastVisible(false), 3000);
  }, [saveSnapshot]);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const currentPresetName = PRESETS[params.presetId]?.name || '自定义';

  return (
    <>
      <div style={panelStyle}>
        <div style={{ marginBottom: 16, fontSize: 15, fontWeight: 700, color: '#F1F5F9', letterSpacing: '0.5px' }}>
          ✦ 星云控制台
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={labelStyle}><span>星云主题</span></div>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setPresetOpen(!presetOpen)}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: '#6366F1',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
                textAlign: 'left',
                transition: 'all 0.3s ease-out',
              }}
            >
              {currentPresetName} ▾
            </button>
            {presetOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: 4,
                  borderRadius: 8,
                  overflow: 'hidden',
                  zIndex: 10,
                  animation: 'slideDown 0.3s ease-out',
                }}
              >
                {Object.values(PRESETS).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      applyPreset(p.id);
                      setPresetOpen(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: params.presetId === p.id ? '#6366F1' : '#1E293B',
                      color: params.presetId === p.id ? '#fff' : '#94A3B8',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 13,
                      textAlign: 'left',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (params.presetId !== p.id) {
                        (e.target as HTMLElement).style.background = '#334155';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (params.presetId !== p.id) {
                        (e.target as HTMLElement).style.background = '#1E293B';
                      }
                    }}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <SliderControl
          label="密度"
          value={params.density}
          min={1000}
          max={20000}
          step={500}
          onChange={(v) => updateParams({ density: v })}
        />

        <SliderControl
          label="旋转速度"
          value={parseFloat(params.rotationSpeed.toFixed(4))}
          min={0}
          max={0.005}
          step={0.0001}
          onChange={(v) => updateParams({ rotationSpeed: v })}
        />

        <SliderControl
          label="粒子大小"
          value={parseFloat(params.particleSize.toFixed(2))}
          min={0.05}
          max={0.5}
          step={0.01}
          onChange={(v) => updateParams({ particleSize: v })}
        />

        <SliderControl
          label="波动振幅"
          value={parseFloat(params.waveAmplitude.toFixed(2))}
          min={0}
          max={2}
          step={0.05}
          onChange={(v) => updateParams({ waveAmplitude: v })}
        />

        <SliderControl
          label="波动频率"
          value={parseFloat(params.waveFrequency.toFixed(4))}
          min={0}
          max={0.01}
          step={0.0001}
          onChange={(v) => updateParams({ waveFrequency: v })}
        />

        <div style={{ marginBottom: 14 }}>
          <div style={labelStyle}><span>中心色调</span></div>
          <input
            type="color"
            value={params.centerColor}
            onChange={(e) => updateParams({ centerColor: e.target.value })}
            style={{
              width: '100%',
              height: 36,
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              background: 'transparent',
              padding: 0,
            }}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={labelStyle}><span>边缘色调</span></div>
          <input
            type="color"
            value={params.edgeColor}
            onChange={(e) => updateParams({ edgeColor: e.target.value })}
            style={{
              width: '100%',
              height: 36,
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              background: 'transparent',
              padding: 0,
            }}
          />
        </div>

        <button
          onClick={handleSaveSnapshot}
          style={{
            width: '100%',
            padding: '10px 0',
            background: '#10B981',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600,
            transition: 'all 0.1s',
            marginBottom: 14,
          }}
          onMouseDown={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'scale(0.95)';
          }}
          onMouseUp={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = '#059669';
          }}
          onMouseOut={(e) => {
            (e.currentTarget as HTMLElement).style.background = '#10B981';
          }}
        >
          📸 保存快照
        </button>

        {snapshots.length > 0 && (
          <div>
            <div style={{ ...labelStyle, marginBottom: 8 }}><span>快照列表</span><span>{snapshots.length}</span></div>
            <div
              style={{
                display: 'flex',
                gap: 8,
                overflowX: 'auto',
                paddingBottom: 4,
              }}
            >
              {snapshots.map((snap) => (
                <div
                  key={snap.id}
                  onClick={() => loadSnapshot(snap)}
                  style={{
                    minWidth: 120,
                    height: 80,
                    borderRadius: 8,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    border: '2px solid #334155',
                    transition: 'border-color 0.2s',
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = '#6366F1';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = '#334155';
                  }}
                >
                  <img
                    src={snap.thumbnail}
                    alt="snapshot"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {toastVisible && (
        <div
          style={{
            position: 'fixed',
            top: 24,
            right: 24,
            background: '#065F46',
            color: '#fff',
            padding: '10px 20px',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 500,
            zIndex: 200,
            animation: 'fadeInOut 3s ease-in-out',
          }}
        >
          ✅ 快照保存成功
        </div>
      )}
    </>
  );
}
