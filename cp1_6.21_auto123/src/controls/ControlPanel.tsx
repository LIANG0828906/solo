import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Preset, PresetParams, fetchPresets, deletePreset } from '../api/presetApi';

interface ControlPanelProps {
  params: PresetParams;
  onParamsChange: (params: PresetParams) => void;
  onRandomize: () => void;
  onSavePreset: (name: string) => void;
  fps: number;
  lowPerformance: boolean;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  params,
  onParamsChange,
  onRandomize,
  onSavePreset,
  fps,
  lowPerformance,
}) => {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [keyFlash, setKeyFlash] = useState(false);

  const loadPresets = useCallback(async () => {
    try {
      const data = await fetchPresets();
      setPresets(data);
    } catch (e) {
      console.error('加载预设失败:', e);
    }
  }, []);

  useEffect(() => {
    loadPresets();
  }, [loadPresets]);

  const handleDelete = async (id: string) => {
    try {
      await deletePreset(id);
      setPresets((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      console.error('删除预设失败:', e);
    }
  };

  const handlePresetClick = (preset: Preset) => {
    onParamsChange(preset.params);
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const flashKey = () => {
    setKeyFlash(true);
    setTimeout(() => setKeyFlash(false), 150);
  };

  const sliders: { key: keyof PresetParams; label: string; min: number; max: number; step: number; unit: string }[] = [
    { key: 'density', label: '流线密度', min: 10, max: 100, step: 1, unit: '条' },
    { key: 'speed', label: '流速', min: 0.5, max: 3.0, step: 0.1, unit: 'x' },
    { key: 'hue', label: '颜色色相', min: 0, max: 360, step: 1, unit: '°' },
    { key: 'opacity', label: '透明度', min: 0.1, max: 1.0, step: 0.05, unit: '' },
  ];

  return (
    <div
      style={{
        width: 280,
        minWidth: 280,
        background: '#1E293B',
        color: '#E2E8F0',
        display: 'flex',
        flexDirection: 'column',
        padding: 20,
        overflowY: 'auto',
        position: 'relative',
        borderRight: '1px dashed #334155',
      }}
    >
      <div
        style={{
          border: keyFlash ? '3px dashed #6366F1' : '3px dashed transparent',
          borderRadius: 6,
          padding: '4px 8px',
          marginBottom: 12,
          transition: 'border-color 0.15s',
          position: 'absolute',
          top: 8,
          left: 8,
          right: 8,
          height: 2,
          pointerEvents: 'none',
        }}
      />

      {lowPerformance && (
        <div
          style={{
            background: '#F59E0B',
            color: '#000',
            fontSize: 12,
            borderRadius: 4,
            padding: '6px 10px',
            marginBottom: 12,
            textAlign: 'center',
          }}
        >
          ⚠ 性能不足，建议降低流线密度
        </div>
      )}

      <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 16 }}>
        FPS: {fps}
      </div>

      {sliders.map((s) => (
        <div key={s.key} style={{ marginBottom: 18 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 6,
              fontSize: 13,
            }}
          >
            <span>{s.label}</span>
            <span style={{ color: '#6366F1', fontSize: 12, fontFamily: 'monospace' }}>
              {params[s.key]}{s.unit}
            </span>
          </div>
          <input
            type="range"
            min={s.min}
            max={s.max}
            step={s.step}
            value={params[s.key]}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              onParamsChange({ ...params, [s.key]: s.key === 'density' ? Math.round(v) : s.key === 'hue' ? Math.round(v) : v });
            }}
          />
        </div>
      ))}

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button
          onClick={() => { onRandomize(); flashKey(); }}
          style={{
            flex: 1,
            background: '#7C3AED',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            padding: '10px 0',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
            transition: 'background 0.2s ease-in-out',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#6D28D9')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#7C3AED')}
        >
          随机生成
        </button>
        <button
          onClick={() => { onSavePreset(''); flashKey(); }}
          style={{
            flex: 1,
            background: '#6366F1',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            padding: '10px 0',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
            transition: 'background 0.2s ease-in-out',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#4F46E5')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#6366F1')}
        >
          保存预设
        </button>
      </div>

      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#94A3B8' }}>
        预设列表
      </div>
      <div
        style={{
          maxHeight: 264,
          overflowY: 'auto',
          borderRadius: 6,
        }}
      >
        {presets.length === 0 && (
          <div style={{ fontSize: 12, color: '#64748B', padding: '8px 0' }}>暂无预设</div>
        )}
        {presets.slice(0, 6).map((preset) => (
          <div
            key={preset.id}
            onClick={() => handlePresetClick(preset)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 10px',
              borderRadius: 4,
              cursor: 'pointer',
              transition: 'background 0.2s ease-in-out, transform 0.2s ease-in-out',
              marginBottom: 2,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#334155';
              e.currentTarget.style.transform = 'translateX(2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.transform = 'translateX(0)';
            }}
          >
            <div>
              <div style={{ fontSize: 13, lineHeight: 1.4 }}>{preset.name}</div>
              <div style={{ fontSize: 11, color: '#64748B' }}>{formatTime(preset.createdAt)}</div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(preset.id);
              }}
              style={{
                background: '#EF4444',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                padding: '3px 8px',
                cursor: 'pointer',
                fontSize: 11,
                transition: 'background 0.2s ease-in-out',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#DC2626')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#EF4444')}
            >
              删除
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ControlPanel;
