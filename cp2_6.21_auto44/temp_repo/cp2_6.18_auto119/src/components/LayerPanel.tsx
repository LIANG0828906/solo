import { useState, useRef } from 'react';
import { useGradientStore } from '../store/gradientStore';
import type { GradientType, BlendMode } from '../store/gradientStore';

interface ColorPickerProps {
  value: string;
  onChange: (v: string) => void;
  label: string;
}

const ColorPicker = ({ value, onChange, label }: ColorPickerProps) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const presetColors = [
    '#ff6b6b', '#feca57', '#48dbfb', '#1dd1a1',
    '#a78bfa', '#f368e0', '#60a5fa', '#34d399',
    '#1a1a2e', '#ffffff', '#000000', '#f1f5f9',
  ];

  return (
    <div ref={containerRef} style={cpStyles.wrapper}>
      <span style={cpStyles.label}>{label}</span>
      <div
        style={{
          ...cpStyles.swatch,
          background: value,
          borderColor: open ? '#a78bfa' : '#334155',
        }}
        onClick={() => setOpen(!open)}
      >
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={cpStyles.hiddenInput}
        />
      </div>
      {open && (
        <div
          style={{
            ...cpStyles.popover,
            animation: 'scaleIn 0.2s ease-out forwards',
          }}
        >
          <div style={cpStyles.grid}>
            {presetColors.map((c) => (
              <div
                key={c}
                style={{ ...cpStyles.presetDot, background: c }}
                onClick={() => {
                  onChange(c);
                  setOpen(false);
                }}
              />
            ))}
          </div>
          <div style={cpStyles.customRow}>
            <span style={cpStyles.customLabel}>自定义</span>
            <input
              type="color"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              style={cpStyles.bigPicker}
            />
            <input
              type="text"
              value={value}
              onChange={(e) => {
                const v = e.target.value;
                if (/^#[0-9a-fA-F]{6}$/.test(v) || /^#[0-9a-fA-F]{3}$/.test(v)) {
                  onChange(v);
                }
              }}
              style={cpStyles.hexInput}
              spellCheck={false}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const cpStyles: Record<string, React.CSSProperties> = {
  wrapper: { position: 'relative', display: 'flex', alignItems: 'center', gap: 8, flex: 1 },
  label: { fontSize: 11, color: '#94a3b8', width: 28, flexShrink: 0 },
  swatch: {
    width: 32, height: 28, borderRadius: 6, border: '2px solid #334155',
    cursor: 'pointer', transition: 'border-color 0.15s ease',
    flexShrink: 0, overflow: 'hidden', position: 'relative',
  },
  hiddenInput: {
    position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer',
    width: '100%', height: '100%', padding: 0, border: 'none',
  },
  popover: {
    position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 100,
    background: '#1e1e2e', border: '1px solid #334155', borderRadius: 10,
    padding: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.5)', width: 190,
    transformOrigin: 'top left',
  },
  grid: {
    display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6, marginBottom: 10,
  },
  presetDot: {
    width: 24, height: 24, borderRadius: 5, cursor: 'pointer',
    border: '1px solid rgba(255,255,255,0.1)',
    transition: 'transform 0.12s ease',
  },
  customRow: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  customLabel: { fontSize: 11, color: '#94a3b8', marginRight: 4 },
  bigPicker: {
    width: 34, height: 28, border: 'none', borderRadius: 6,
    background: 'transparent', cursor: 'pointer', padding: 0,
  },
  hexInput: {
    flex: 1, minWidth: 60, background: '#0f0f1a', border: '1px solid #334155',
    color: '#e2e8f0', fontSize: 11, padding: '5px 8px', borderRadius: 6,
    fontFamily: 'monospace',
  },
};

interface LayerCardProps {
  index: number;
  layerId: string;
  type: GradientType;
  colorStart: string;
  colorEnd: string;
  angle: number;
  scale: number;
  visible: boolean;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent, idx: number) => void;
  onDragOver: (e: React.DragEvent, idx: number) => void;
  onDrop: (e: React.DragEvent, idx: number) => void;
  onDragEnd: () => void;
}

const LayerCard = ({
  index, layerId, type, colorStart, colorEnd, angle, scale, visible,
  isDragging, onDragStart, onDragOver, onDrop, onDragEnd,
}: LayerCardProps) => {
  const updateLayer = useGradientStore((s) => s.updateLayer);
  const removeLayer = useGradientStore((s) => s.removeLayer);
  const dragOverIndex = useGradientStore((s) => s.dragOverIndex);
  const setDragOverIndex = useGradientStore((s) => s.setDragOverIndex);

  const showInsertLine = dragOverIndex === index;

  const typeOptions: { value: GradientType; label: string; icon: string }[] = [
    { value: 'linear', label: '线性', icon: '↗' },
    { value: 'radial', label: '径向', icon: '◉' },
    { value: 'conic', label: '圆锥', icon: '◐' },
  ];

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDragLeave={() => setDragOverIndex(null)}
      onDrop={(e) => onDrop(e, index)}
      onDragEnd={onDragEnd}
      style={{
        ...cardStyles.wrapper,
        opacity: isDragging ? 0.4 : 1,
        transform: isDragging ? 'scale(0.98)' : 'scale(1)',
        transition: 'transform 0.2s ease-out, opacity 0.2s ease-out',
      }}
    >
      {showInsertLine && <div style={cardStyles.insertLine} />}
      <div style={cardStyles.header}>
        <div
          style={{
            ...cardStyles.dragHandle,
            background: `linear-gradient(135deg, ${colorStart}, ${colorEnd})`,
          }}
          title="拖拽排序"
        >
          <span style={cardStyles.dragIcon}>⋮⋮</span>
        </div>
        <div style={cardStyles.layerIndex}>L{index + 1}</div>
        <div style={cardStyles.typeTabs}>
          {typeOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateLayer(layerId, { type: opt.value })}
              style={{
                ...cardStyles.typeTab,
                background: type === opt.value ? 'rgba(167,139,250,0.2)' : 'transparent',
                color: type === opt.value ? '#a78bfa' : '#64748b',
                borderColor: type === opt.value ? 'rgba(167,139,250,0.4)' : 'transparent',
              }}
              title={opt.label}
            >
              {opt.icon}
            </button>
          ))}
        </div>
        <button
          onClick={() => updateLayer(layerId, { visible: !visible })}
          style={{
            ...cardStyles.iconBtn,
            color: visible ? '#a78bfa' : '#475569',
          }}
          title={visible ? '隐藏' : '显示'}
        >
          {visible ? '👁' : '◌'}
        </button>
        <button
          onClick={() => removeLayer(layerId)}
          style={cardStyles.iconBtn}
          title="删除"
        >
          ✕
        </button>
      </div>

      <div style={cardStyles.body}>{!visible && <div style={cardStyles.hiddenMask} />}
        <div style={cardStyles.colorRow}>
          <ColorPicker
            value={colorStart}
            onChange={(v) => updateLayer(layerId, { colorStart: v })}
            label="起始"
          />
          <div style={cardStyles.arrow}>→</div>
          <ColorPicker
            value={colorEnd}
            onChange={(v) => updateLayer(layerId, { colorEnd: v })}
            label="结束"
          />
        </div>

        <div style={cardStyles.sliderRow}>
          <span style={cardStyles.sliderLabel}>角度 {angle}°</span>
          <input
            type="range"
            min={0}
            max={360}
            value={angle}
            onChange={(e) => updateLayer(layerId, { angle: Number(e.target.value) })}
            style={cardStyles.slider}
          />
        </div>

        <div style={cardStyles.sliderRow}>
          <span style={cardStyles.sliderLabel}>缩放 {scale.toFixed(2)}x</span>
          <input
            type="range"
            min={0.5}
            max={2.0}
            step={0.05}
            value={scale}
            onChange={(e) => updateLayer(layerId, { scale: Number(e.target.value) })}
            style={cardStyles.slider}
          />
        </div>
      </div>
    </div>
  );
};

const cardStyles: Record<string, React.CSSProperties> = {
  wrapper: {
    position: 'relative',
    background: '#1e1e2e',
    border: '1px solid #334155',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    cursor: 'grab',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
    animation: 'slideIn 0.2s ease-out',
  },
  insertLine: {
    position: 'absolute', top: -6, left: 4, right: 4, height: 3,
    background: '#a78bfa', borderRadius: 2,
    boxShadow: '0 0 10px rgba(167,139,250,0.6)',
    zIndex: 5,
  },
  header: {
    display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10,
  },
  dragHandle: {
    width: 26, height: 26, borderRadius: 6,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'grab', flexShrink: 0, position: 'relative',
    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.15)',
  },
  dragIcon: {
    fontSize: 12, color: 'rgba(255,255,255,0.85)',
    textShadow: '0 1px 2px rgba(0,0,0,0.4)',
    letterSpacing: -1,
  },
  layerIndex: {
    fontSize: 11, fontWeight: 700, color: '#a78bfa',
    background: 'rgba(167,139,250,0.12)', padding: '2px 7px', borderRadius: 4,
  },
  typeTabs: { display: 'flex', gap: 2, marginLeft: 4, flex: 1 },
  typeTab: {
    padding: '3px 7px', fontSize: 12, cursor: 'pointer',
    borderRadius: 5, border: '1px solid transparent',
    color: '#64748b', background: 'transparent',
    transition: 'all 0.15s ease',
    fontFamily: 'inherit',
  },
  iconBtn: {
    background: 'transparent', border: 'none', color: '#94a3b8',
    cursor: 'pointer', fontSize: 14, padding: '3px 5px',
    borderRadius: 5, transition: 'all 0.15s ease',
    fontFamily: 'inherit',
  },
  body: { position: 'relative', display: 'flex', flexDirection: 'column', gap: 8 },
  hiddenMask: {
    position: 'absolute', inset: 0, background: 'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(255,255,255,0.03) 5px, rgba(255,255,255,0.03) 10px)',
    borderRadius: 6, pointerEvents: 'none', zIndex: 1,
  },
  colorRow: { display: 'flex', alignItems: 'center', gap: 4 },
  arrow: { color: '#475569', fontSize: 12, flexShrink: 0 },
  sliderRow: { display: 'flex', alignItems: 'center', gap: 8 },
  sliderLabel: { fontSize: 11, color: '#94a3b8', width: 72, flexShrink: 0 },
  slider: {
    flex: 1, accentColor: '#a78bfa', height: 4,
  },
};

const LayerPanel = () => {
  const layers = useGradientStore((s) => s.layers);
  const blendMode = useGradientStore((s) => s.blendMode);
  const addLayer = useGradientStore((s) => s.addLayer);
  const resetLayers = useGradientStore((s) => s.resetLayers);
  const reorderLayers = useGradientStore((s) => s.reorderLayers);
  const setBlendMode = useGradientStore((s) => s.setBlendMode);
  const setDragOverIndex = useGradientStore((s) => s.setDragOverIndex);
  const savePreset = useGradientStore((s) => s.savePreset);
  const loadPreset = useGradientStore((s) => s.loadPreset);
  const deletePreset = useGradientStore((s) => s.deletePreset);
  const presets = useGradientStore((s) => s.presets);

  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [presetName, setPresetName] = useState('');
  const [showPresets, setShowPresets] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2000);
  };

  const handleDragStart = (e: React.DragEvent, idx: number) => {
    setDraggingIndex(idx);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(idx));
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggingIndex !== null && idx !== draggingIndex) {
      setDragOverIndex(idx);
    }
  };

  const handleDrop = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggingIndex !== null && draggingIndex !== idx) {
      reorderLayers(draggingIndex, idx);
    }
    setDraggingIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggingIndex(null);
    setDragOverIndex(null);
  };

  const blendOptions: { value: BlendMode; label: string }[] = [
    { value: 'normal', label: 'Normal' },
    { value: 'multiply', label: 'Multiply' },
    { value: 'screen', label: 'Screen' },
  ];

  const handleSavePreset = () => {
    if (savePreset(presetName)) {
      showToast('预设已保存！');
      setPresetName('');
    } else {
      showToast('预设已满（最多10个）');
    }
  };

  const generateThumbStyle = (preset: typeof presets[0]) => {
    const visible = preset.layers.filter((l) => l.visible);
    const grads = visible
      .map((l) => {
        switch (l.type) {
          case 'linear':
            return `linear-gradient(${l.angle}deg, ${l.colorStart}, ${l.colorEnd})`;
          case 'radial':
            return `radial-gradient(${l.scale * 100}% ${l.scale * 100}% at center, ${l.colorStart}, ${l.colorEnd})`;
          case 'conic':
            return `conic-gradient(from ${l.angle}deg, ${l.colorStart}, ${l.colorEnd}, ${l.colorStart})`;
          default:
            return '';
        }
      })
      .reverse();
    return {
      background: grads.join(', ') || '#333',
      backgroundBlendMode: preset.blendMode,
    };
  };

  return (
    <div style={panelStyles.container}>
      <div style={panelStyles.header}>
        <div>
          <h2 style={panelStyles.title}>渐变层</h2>
          <p style={panelStyles.subtitle}>
            共 {layers.length}/6 层
          </p>
        </div>
        <button
          onClick={addLayer}
          disabled={layers.length >= 6}
          style={{
            ...panelStyles.addBtn,
            opacity: layers.length >= 6 ? 0.5 : 1,
            cursor: layers.length >= 6 ? 'not-allowed' : 'pointer',
          }}
        >
          + 添加
        </button>
      </div>

      <div style={panelStyles.blendRow}>
        <span style={panelStyles.blendLabel}>混合模式</span>
        <div style={panelStyles.blendGroup}>
          {blendOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setBlendMode(opt.value)}
              style={{
                ...panelStyles.blendBtn,
                background: blendMode === opt.value ? '#a78bfa' : '#2a2a3e',
                color: blendMode === opt.value ? '#0f0f1a' : '#e2e8f0',
                fontWeight: blendMode === opt.value ? 600 : 400,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div
        style={panelStyles.layersList}
        onDragOver={(e) => e.preventDefault()}
      >
        {layers.length === 0 && (
          <div style={panelStyles.emptyTip}>
            <div style={panelStyles.emptyIcon}>🎨</div>
            <div>还没有渐变层</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
              点击上方添加按钮创建
            </div>
          </div>
        )}
        {layers.map((layer, idx) => (
          <LayerCard
            key={layer.id}
            index={idx}
            layerId={layer.id}
            type={layer.type}
            colorStart={layer.colorStart}
            colorEnd={layer.colorEnd}
            angle={layer.angle}
            scale={layer.scale}
            visible={layer.visible}
            isDragging={draggingIndex === idx}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
          />
        ))}
      </div>

      <div style={panelStyles.presetSection}>
        <div style={panelStyles.presetHeader}>
          <button
            onClick={() => setShowPresets(!showPresets)}
            style={panelStyles.presetToggle}
          >
            {showPresets ? '▼' : '▶'} 预设管理
          </button>
          <button
            onClick={resetLayers}
            style={panelStyles.resetBtn}
            title="重置为默认"
          >
            ↺ 重置
          </button>
        </div>

        {showPresets && (
          <div style={panelStyles.presetBody}>
            <div style={panelStyles.saveRow}>
              <input
                type="text"
                placeholder="预设名称..."
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                style={panelStyles.presetInput}
              />
              <button
                onClick={handleSavePreset}
                style={panelStyles.saveBtn}
              >
                💾 保存
              </button>
            </div>

            {presets.length > 0 ? (
              <div style={panelStyles.presetGrid}>
                {presets.map((p) => (
                  <div key={p.id} style={panelStyles.presetCard}>
                    <div
                      style={{
                        ...panelStyles.presetThumb,
                        ...generateThumbStyle(p),
                      }}
                      onClick={() => {
                        loadPreset(p.id);
                        showToast('已加载预设');
                      }}
                      title={`加载: ${p.name}`}
                    />
                    <div style={panelStyles.presetInfo}>
                      <span style={panelStyles.presetName} title={p.name}>
                        {p.name}
                      </span>
                      <button
                        onClick={() => {
                          deletePreset(p.id);
                          showToast('预设已删除');
                        }}
                        style={panelStyles.presetDel}
                        title="删除预设"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={panelStyles.emptyPresets}>暂无预设</div>
            )}
          </div>
        )}
      </div>

      {toastMsg && (
        <div style={panelStyles.toast}>
          {toastMsg}
        </div>
      )}
    </div>
  );
};

const panelStyles: Record<string, React.CSSProperties> = {
  container: {
    width: 240,
    flexShrink: 0,
    background: '#1e1e2e',
    borderRadius: 14,
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    height: 'fit-content',
    maxHeight: 'calc(100vh - 60px)',
    overflowY: 'auto',
    position: 'relative',
    border: '1px solid #2a2a3e',
    scrollbarWidth: 'thin',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 16,
    fontWeight: 700,
    color: '#e2e8f0',
    margin: 0,
  },
  subtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    margin: 0,
  },
  addBtn: {
    background: 'linear-gradient(135deg, #a78bfa, #8b5cf6)',
    color: '#fff',
    border: 'none',
    padding: '6px 12px',
    borderRadius: 7,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
    fontFamily: 'inherit',
  },
  blendRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  blendLabel: { fontSize: 12, color: '#94a3b8' },
  blendGroup: { display: 'flex', gap: 4 },
  blendBtn: {
    flex: 1, padding: '6px 4px', fontSize: 11,
    border: 'none', borderRadius: 6, cursor: 'pointer',
    transition: 'all 0.15s ease',
    fontFamily: 'inherit',
  },
  layersList: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 100,
  },
  emptyTip: {
    textAlign: 'center',
    padding: '30px 10px',
    color: '#64748b',
    fontSize: 13,
    border: '1px dashed #334155',
    borderRadius: 10,
  },
  emptyIcon: { fontSize: 28, marginBottom: 8 },
  presetSection: {
    borderTop: '1px solid #2a2a3e',
    paddingTop: 12,
  },
  presetHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  presetToggle: {
    background: 'transparent', border: 'none', color: '#a78bfa',
    cursor: 'pointer', fontSize: 12, fontWeight: 600,
    fontFamily: 'inherit',
    transition: 'color 0.15s ease',
  },
  resetBtn: {
    background: '#2a2a3e', border: 'none', color: '#94a3b8',
    padding: '4px 8px', borderRadius: 5, cursor: 'pointer',
    fontSize: 11,
    fontFamily: 'inherit',
    transition: 'all 0.15s ease',
  },
  presetBody: {
    marginTop: 10,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  saveRow: { display: 'flex', gap: 6 },
  presetInput: {
    flex: 1,
    background: '#0f0f1a',
    border: '1px solid #334155',
    color: '#e2e8f0',
    padding: '6px 10px',
    borderRadius: 6,
    fontSize: 12,
    outline: 'none',
    transition: 'border-color 0.15s ease',
    fontFamily: 'inherit',
  },
  saveBtn: {
    background: '#a78bfa',
    color: '#0f0f1a',
    border: 'none',
    padding: '6px 10px',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.15s ease',
  },
  presetGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: 8,
  },
  presetCard: {
    display: 'flex',
    flexDirection: 'column',
    background: '#2a2a3e',
    borderRadius: 8,
    overflow: 'hidden',
  },
  presetThumb: {
    width: '100%',
    height: 60,
    cursor: 'pointer',
    transition: 'transform 0.15s ease',
  },
  presetInfo: {
    padding: '6px 10px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  presetName: {
    fontSize: 11,
    color: '#e2e8f0',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flex: 1,
  },
  presetDel: {
    background: 'transparent',
    border: 'none',
    color: '#64748b',
    cursor: 'pointer',
    fontSize: 11,
    padding: 2,
    fontFamily: 'inherit',
    transition: 'color 0.15s ease',
  },
  emptyPresets: {
    padding: 15,
    textAlign: 'center',
    color: '#64748b',
    fontSize: 11,
    background: '#2a2a3e',
    borderRadius: 8,
  },
  toast: {
    position: 'absolute',
    top: 10,
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(167,139,250,0.95)',
    color: '#0f0f1a',
    padding: '6px 14px',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 600,
    zIndex: 200,
    animation: 'toastIn 0.2s ease-out',
    boxShadow: '0 4px 15px rgba(167,139,250,0.4)',
  },
};

export default LayerPanel;
