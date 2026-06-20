// ============================================================
// PropertyPanel.tsx - 图层属性编辑面板组件
// 调用关系:
//   数据流向: useStore(layers, selectedLayerId, palette) → 显示选中图层属性
//   用户交互: 位置/缩放/旋转/不透明度/混合模式 → updateLayer(id, {...})
//   用户交互: 颜色修改 → updateLayer(id, {customColor, colorIndex:-1})
//   用户交互: 删除图层 → removeLayer(id)
//   依赖调用: 实时更新 → CanvasRenderer 脏区域重绘
// ============================================================
import { useStore } from '@/shared/store';
import type { BlendMode } from '@/shared/store';

const blendModeOptions: { value: BlendMode; label: string }[] = [
  { value: 'normal', label: '正常' },
  { value: 'multiply', label: '正片叠底' },
  { value: 'screen', label: '滤色' },
  { value: 'overlay', label: '叠加' },
];

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.08)',
  border: 'none',
  borderRadius: '4px',
  padding: '6px 8px',
  color: '#fff',
  fontSize: '12px',
  outline: 'none',
  transition: 'all 0.2s ease-out',
  width: '100%',
  boxSizing: 'border-box',
};

const rangeStyle: React.CSSProperties = {
  appearance: 'none',
  WebkitAppearance: 'none',
  height: '4px',
  background: 'rgba(255,255,255,0.15)',
  borderRadius: '2px',
  outline: 'none',
  width: '100%',
  transition: 'all 0.2s ease-out',
  cursor: 'pointer',
};

const rangeThumbStyle = `
  input[type=range]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #6496ff;
    cursor: pointer;
    transition: transform 0.2s;
  }
  input[type=range]::-webkit-slider-thumb:hover {
    transform: scale(1.2);
  }
  input[type=range]::-moz-range-thumb {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #6496ff;
    cursor: pointer;
    border: none;
    transition: transform 0.2s;
  }
  input[type=range]::-moz-range-thumb:hover {
    transform: scale(1.2);
  }
  input[type=number]:focus {
    outline: 2px solid #6496ff;
  }
  select:focus {
    outline: 2px solid #6496ff;
  }
`;

const labelStyle: React.CSSProperties = {
  fontSize: '11px',
  color: 'rgba(255,255,255,0.6)',
  marginBottom: '6px',
  display: 'block',
  transition: 'all 0.2s ease-out',
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '6px',
};

export default function PropertyPanel() {
  const layers = useStore((s) => s.layers);
  const selectedLayerId = useStore((s) => s.selectedLayerId);
  const palette = useStore((s) => s.palette);
  const updateLayer = useStore((s) => s.updateLayer);
  const removeLayer = useStore((s) => s.removeLayer);

  const selectedLayer = layers.find((l) => l.id === selectedLayerId);

  if (!selectedLayer) {
    return (
      <div style={{ width: '240px', background: '#1e1e2e', height: '100%' }}>
        <div style={{ padding: '20px', color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
          请在画布或图层列表中选择一个图层
        </div>
      </div>
    );
  }

  const color = selectedLayer.colorIndex >= 0 ? palette[selectedLayer.colorIndex] : selectedLayer.customColor || '#ffffff';

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateLayer(selectedLayer.id, { customColor: e.target.value, colorIndex: -1 });
  };

  return (
    <div style={{ width: '240px', background: '#1e1e2e', overflowY: 'auto', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <style>{rangeThumbStyle}</style>

      <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '12px' }}>
          {selectedLayer.name}
        </div>
      </div>

      <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={labelStyle}>位置</div>
        <div>
          <div style={{ display: 'inline-block', width: 'calc(50% - 6px)', marginRight: '12px' }}>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>X</div>
            <input
              type="number"
              value={Math.round(selectedLayer.x)}
              onChange={(e) => updateLayer(selectedLayer.id, { x: parseInt(e.target.value) || 0 })}
              style={inputStyle}
            />
          </div>
          <div style={{ display: 'inline-block', width: 'calc(50% - 6px)' }}>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>Y</div>
            <input
              type="number"
              value={Math.round(selectedLayer.y)}
              onChange={(e) => updateLayer(selectedLayer.id, { y: parseInt(e.target.value) || 0 })}
              style={inputStyle}
            />
          </div>
        </div>
      </div>

      <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={rowStyle}>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>缩放</div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)', textAlign: 'right' }}>{selectedLayer.scale}%</div>
        </div>
        <input
          type="range"
          min={50}
          max={200}
          step={10}
          value={selectedLayer.scale}
          onChange={(e) => updateLayer(selectedLayer.id, { scale: parseInt(e.target.value) })}
          style={rangeStyle}
        />
      </div>

      <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={rowStyle}>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>旋转</div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)', textAlign: 'right' }}>{selectedLayer.rotation}°</div>
        </div>
        <input
          type="range"
          min={-180}
          max={180}
          step={1}
          value={selectedLayer.rotation}
          onChange={(e) => updateLayer(selectedLayer.id, { rotation: parseInt(e.target.value) })}
          style={rangeStyle}
        />
      </div>

      <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={labelStyle}>混合模式</div>
        <select
          value={selectedLayer.blendMode}
          onChange={(e) => updateLayer(selectedLayer.id, { blendMode: e.target.value as BlendMode })}
          style={{ ...inputStyle, cursor: 'pointer' }}
        >
          {blendModeOptions.map((opt) => (
            <option key={opt.value} value={opt.value} style={{ background: '#1e1e2e', color: '#fff' }}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={rowStyle}>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>不透明度</div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)', textAlign: 'right' }}>{selectedLayer.opacity}%</div>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={selectedLayer.opacity}
          onChange={(e) => updateLayer(selectedLayer.id, { opacity: parseInt(e.target.value) })}
          style={rangeStyle}
        />
      </div>

      <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={labelStyle}>颜色</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ position: 'relative', display: 'inline-block', cursor: 'pointer' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                background: color,
                border: '1px solid rgba(255,255,255,0.15)',
                transition: 'all 0.2s ease-out',
              }}
            />
            <input
              type="color"
              value={color}
              onChange={handleColorChange}
              style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', top: 0, left: 0, cursor: 'pointer' }}
            />
          </label>
          <label style={{ cursor: 'pointer', position: 'relative' }}>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', fontFamily: 'monospace', letterSpacing: '0.5px' }}>
              {color.toUpperCase()}
            </div>
            <input
              type="color"
              value={color}
              onChange={handleColorChange}
              style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', top: 0, left: 0, cursor: 'pointer' }}
            />
          </label>
        </div>
      </div>

      <div style={{ padding: '16px', marginTop: 'auto' }}>
        <button
          onClick={() => removeLayer(selectedLayer.id)}
          style={{
            width: '100%',
            padding: '8px',
            color: '#ff6b6b',
            background: 'transparent',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 500,
            transition: 'all 0.2s ease-out',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,107,107,0.1)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
        >
          删除图层
        </button>
      </div>
    </div>
  );
}
