import { useEditorStore, SHAPE_TYPES } from '../store';
import { ShapeIcon } from './ShapeIcon';
import { clamp } from '../utils/transform';

interface ElementPanelProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

const SliderControl = ({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (v: number) => void;
}) => (
  <div className="control-group">
    <div className="control-label">
      <span>{label}</span>
      <span className="control-value">
        {value}
        {unit}
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

const ColorControl = ({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) => {
  const handleHex = (v: string) => {
    let hex = v.startsWith('#') ? v : '#' + v;
    hex = hex.slice(0, 7);
    if (/^#[0-9a-fA-F]{0,6}$/.test(hex)) {
      onChange(hex);
    }
  };

  return (
    <div className="control-group">
      <div className="control-label">
        <span>{label}</span>
      </div>
      <div className="color-row">
        <div className="color-input-wrapper">
          <input type="color" value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : '#000000'} onChange={(e) => onChange(e.target.value)} />
        </div>
        <input
          className="hex-input"
          type="text"
          value={value}
          onChange={(e) => handleHex(e.target.value)}
          placeholder="#RRGGBB"
          maxLength={7}
        />
      </div>
    </div>
  );
};

export const ElementPanel = ({ collapsed, onToggle }: ElementPanelProps) => {
  const addLayer = useEditorStore((s) => s.addLayer);
  const selectedLayerId = useEditorStore((s) => s.selectedLayerId);
  const layers = useEditorStore((s) => s.layers);
  const updateLayer = useEditorStore((s) => s.updateLayer);

  const selected = layers.find((l) => l.id === selectedLayerId) ?? null;

  return (
    <div className={`panel element-panel ${collapsed ? 'collapsed' : ''}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="panel-title" style={{ marginBottom: 0, paddingBottom: 0, borderBottom: 'none' }}>
          元素库
        </div>
        {onToggle && (
          <button className="mobile-drawer-toggle" onClick={onToggle} aria-label="toggle">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        )}
      </div>

      <div className="panel-content" style={{ marginTop: 16 }}>
        <div className="shape-grid">
          {SHAPE_TYPES.map((shape) => (
            <button
              key={shape}
              className="shape-btn"
              onClick={() => addLayer(shape)}
              title={`添加 ${shape}`}
            >
              <ShapeIcon shape={shape} />
            </button>
          ))}
        </div>

        {selected ? (
          <>
            <div className="panel-title" style={{ marginTop: 8 }}>
              参数设置 · {selected.shape}
            </div>

            <ColorControl
              label="填充颜色"
              value={selected.fillColor}
              onChange={(v) => updateLayer(selected.id, { fillColor: v })}
            />

            <ColorControl
              label="描边颜色"
              value={selected.strokeColor}
              onChange={(v) => updateLayer(selected.id, { strokeColor: v })}
            />

            <SliderControl
              label="描边粗细"
              value={selected.strokeWidth}
              min={1}
              max={8}
              step={0.5}
              unit="px"
              onChange={(v) => updateLayer(selected.id, { strokeWidth: clamp(v, 1, 8) })}
            />

            <SliderControl
              label="大小缩放"
              value={selected.scale}
              min={0.5}
              max={2.0}
              step={0.05}
              unit="×"
              onChange={(v) => updateLayer(selected.id, { scale: clamp(v, 0.5, 2.0) })}
            />

            <SliderControl
              label="径向距离"
              value={selected.radialDistance}
              min={0}
              max={200}
              step={1}
              unit="px"
              onChange={(v) => updateLayer(selected.id, { radialDistance: clamp(v, 0, 200) })}
            />

            <SliderControl
              label="旋转角度"
              value={selected.rotation}
              min={0}
              max={360}
              step={1}
              unit="°"
              onChange={(v) => updateLayer(selected.id, { rotation: clamp(v, 0, 360) })}
            />
          </>
        ) : (
          <div className="empty-layers">选择画布中的元素以编辑参数</div>
        )}
      </div>
    </div>
  );
};
