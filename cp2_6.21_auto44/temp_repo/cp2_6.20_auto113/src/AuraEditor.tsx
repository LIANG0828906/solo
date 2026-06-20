import { useEffect, useRef, useState, useCallback, ChangeEvent } from 'react';
import { AuraRenderer } from './AuraCanvas';
import {
  IAuraSlot,
  IAuraParams,
  PRESET_COLORS,
  DEFAULT_AURA_PARAMS,
  PRESET_TEMPLATES,
} from './types';

const createInitialSlots = (): IAuraSlot[] => {
  const colors = ['#ff4444', '#4488ff', '#00cc44', '#ffcc00'];
  return Array.from({ length: 4 }, (_, i) => ({
    id: i + 1,
    enabled: i < 2,
    hueShift: false,
    params: {
      ...DEFAULT_AURA_PARAMS,
      color: colors[i],
      particleCount: 200 + i * 50,
      rotationSpeed: 1.0 + i * 0.5,
      radius: 2.0 + i * 0.5,
    },
  }));
};

export default function AuraEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<AuraRenderer | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [slots, setSlots] = useState<IAuraSlot[]>(createInitialSlots);
  const [expandedSlotId, setExpandedSlotId] = useState<number | null>(1);

  useEffect(() => {
    if (!canvasRef.current) return;
    const renderer = new AuraRenderer(canvasRef.current);
    rendererRef.current = renderer;
    renderer.setSlots(slots);
    renderer.start();
    return () => {
      renderer.destroy();
      rendererRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.setSlots(slots);
    }
  }, [slots]);

  const updateSlot = useCallback(
    (id: number, updater: (slot: IAuraSlot) => IAuraSlot) => {
      setSlots((prev) => prev.map((s) => (s.id === id ? updater(s) : s)));
    },
    []
  );

  const updateParam = useCallback(
    (id: number, key: keyof IAuraParams, value: string | number) => {
      updateSlot(id, (s) => ({
        ...s,
        params: { ...s.params, [key]: value },
      }));
    },
    [updateSlot]
  );

  const toggleEnabled = useCallback(
    (id: number) => {
      updateSlot(id, (s) => ({ ...s, enabled: !s.enabled }));
    },
    [updateSlot]
  );

  const toggleHueShift = useCallback(
    (id: number) => {
      updateSlot(id, (s) => ({ ...s, hueShift: !s.hueShift }));
    },
    [updateSlot]
  );

  const toggleExpand = useCallback((id: number) => {
    setExpandedSlotId((prev) => (prev === id ? null : id));
  }, []);

  const resetAll = useCallback(() => {
    setSlots(createInitialSlots());
    setExpandedSlotId(1);
  }, []);

  const applyPreset = useCallback((presetKey: string) => {
    const preset = PRESET_TEMPLATES[presetKey];
    if (!preset) return;
    setSlots(
      preset.slots.map((slotData, i) => ({
        id: i + 1,
        ...slotData,
      }))
    );
    setExpandedSlotId(1);
  }, []);

  const randomGenerate = useCallback(() => {
    setSlots(
      Array.from({ length: 4 }, (_, i) => ({
        id: i + 1,
        enabled: Math.random() > 0.25,
        hueShift: Math.random() > 0.5,
        params: {
          color: PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)],
          particleCount: Math.floor((200 + Math.random() * 200) / 10) * 10,
          rotationSpeed: Math.round((1 + Math.random() * 2) * 10) / 10,
          radius: Math.round((2 + Math.random() * 2) * 2) / 2,
          pulseFrequency: Math.round((1 + Math.random() * 1.5) * 10) / 10,
        },
      }))
    );
    setExpandedSlotId(1);
  }, []);

  const exportJson = useCallback(() => {
    const data = JSON.stringify(
      slots.map(({ id, enabled, hueShift, params }) => ({
        id,
        enabled,
        hueShift,
        params,
      })),
      null,
      2
    );
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'aura_config.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [slots]);

  const importJson = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string) as IAuraSlot[];
          if (Array.isArray(data) && data.length > 0) {
            const validSlots = data.slice(0, 4).map((s, i) => ({
              id: i + 1,
              enabled: !!s.enabled,
              hueShift: !!s.hueShift,
              params: {
                color: s.params?.color || DEFAULT_AURA_PARAMS.color,
                particleCount: Math.min(500, Math.max(50, Math.round(s.params?.particleCount || DEFAULT_AURA_PARAMS.particleCount))),
                rotationSpeed: Math.min(5, Math.max(0, Math.round((s.params?.rotationSpeed || DEFAULT_AURA_PARAMS.rotationSpeed) * 10) / 10)),
                radius: Math.min(5, Math.max(1, Math.round((s.params?.radius || DEFAULT_AURA_PARAMS.radius) * 2) / 2)),
                pulseFrequency: Math.min(3, Math.max(0.5, Math.round((s.params?.pulseFrequency || DEFAULT_AURA_PARAMS.pulseFrequency) * 10) / 10)),
              },
            }));
            while (validSlots.length < 4) {
              validSlots.push({
                id: validSlots.length + 1,
                enabled: false,
                hueShift: false,
                params: { ...DEFAULT_AURA_PARAMS },
              });
            }
            setSlots(validSlots);
            setExpandedSlotId(1);
          }
        } catch {
          alert('无效的JSON配置文件');
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    },
    []
  );

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <h1 style={styles.title}>✨ 魔法光环编辑器 ✨</h1>
      </header>

      <main style={styles.main}>
        <aside style={styles.editorPanel}>
          <div style={styles.panelHeader}>
            <span style={styles.panelTitle}>光环配置</span>
            <button style={styles.resetBtn} onClick={resetAll}>
              重置
            </button>
          </div>

          <div style={styles.slotsContainer}>
            {slots.map((slot, index) => (
              <div
                key={slot.id}
                style={{
                  ...styles.slotCard,
                  ...(expandedSlotId === slot.id ? styles.slotCardExpanded : {}),
                }}
                onClick={() => toggleExpand(slot.id)}
              >
                <div style={styles.slotHeader}>
                  <button
                    style={{
                      ...styles.toggleBtn,
                      backgroundColor: slot.enabled ? slot.params.color : '#444',
                      border: `2px solid ${slot.enabled ? '#fff' : '#555'}`,
                      cursor: 'pointer',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleEnabled(slot.id);
                    }}
                    title={slot.enabled ? '点击禁用' : '点击启用'}
                  />
                  <div
                    style={{
                      ...styles.colorIndicator,
                      backgroundColor: slot.params.color,
                      opacity: slot.enabled ? 1 : 0.4,
                    }}
                  />
                  <span
                    style={{
                      ...styles.slotName,
                      opacity: slot.enabled ? 1 : 0.5,
                    }}
                  >
                    光环{index + 1}
                  </span>
                  <span style={styles.expandIcon}>
                    {expandedSlotId === slot.id ? '▲' : '▼'}
                  </span>
                </div>

                {expandedSlotId === slot.id && (
                  <div
                    style={styles.paramsPanel}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div style={styles.paramRow}>
                      <span style={styles.paramLabel}>颜色预设</span>
                      <div style={styles.colorPalette}>
                        {PRESET_COLORS.map((color) => (
                          <button
                            key={color}
                            style={{
                              ...styles.colorSwatch,
                              backgroundColor: color,
                              outline:
                                slot.params.color.toLowerCase() === color.toLowerCase()
                                  ? '2px solid #fff'
                                  : '2px solid transparent',
                            }}
                            onClick={() => updateParam(slot.id, 'color', color)}
                          />
                        ))}
                        <label style={styles.customColorLabel}>
                          <input
                            type="color"
                            value={slot.params.color}
                            onChange={(e) =>
                              updateParam(slot.id, 'color', e.target.value)
                            }
                            style={styles.colorPicker}
                          />
                          <span style={styles.customColorText}>自定义</span>
                        </label>
                      </div>
                    </div>

                    <SliderControl
                      label="粒子数量"
                      value={slot.params.particleCount}
                      min={50}
                      max={500}
                      step={10}
                      unit="个"
                      onChange={(v) => updateParam(slot.id, 'particleCount', v)}
                    />
                    <SliderControl
                      label="旋转速度"
                      value={slot.params.rotationSpeed}
                      min={0}
                      max={5}
                      step={0.1}
                      unit="rad/s"
                      onChange={(v) => updateParam(slot.id, 'rotationSpeed', v)}
                    />
                    <SliderControl
                      label="范围半径"
                      value={slot.params.radius}
                      min={1}
                      max={5}
                      step={0.5}
                      unit="u"
                      onChange={(v) => updateParam(slot.id, 'radius', v)}
                    />
                    <SliderControl
                      label="脉动频率"
                      value={slot.params.pulseFrequency}
                      min={0.5}
                      max={3}
                      step={0.1}
                      unit="Hz"
                      onChange={(v) => updateParam(slot.id, 'pulseFrequency', v)}
                    />

                    <div style={styles.paramRow}>
                      <span style={styles.paramLabel}>色相偏移</span>
                      <label style={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={slot.hueShift}
                          onChange={() => toggleHueShift(slot.id)}
                          style={styles.checkbox}
                        />
                        <span style={styles.checkboxText}>启用动态色彩循环</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </aside>

        <section style={styles.previewSection}>
          <div style={styles.canvasWrapper}>
            <canvas
              ref={canvasRef}
              style={styles.canvas}
            />
          </div>

          <div style={styles.buttonGroups}>
            <div style={styles.buttonRow}>
              <button style={styles.actionBtn} onClick={exportJson}>
                📤 导出JSON
              </button>
              <button style={styles.actionBtn} onClick={importJson}>
                📥 导入JSON
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
            </div>
            <div style={styles.buttonRow}>
              {Object.entries(PRESET_TEMPLATES).map(([key, preset]) => (
                <button
                  key={key}
                  style={styles.presetBtn}
                  onClick={() => applyPreset(key)}
                >
                  {preset.name}
                </button>
              ))}
              <button
                style={{ ...styles.presetBtn, ...styles.randomBtn }}
                onClick={randomGenerate}
              >
                🎲 随机生成
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

interface SliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (value: number) => void;
}

function SliderControl({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: SliderControlProps) {
  const percentage = ((value - min) / (max - min)) * 100;
  return (
    <div style={styles.paramRow}>
      <div style={styles.paramLabelRow}>
        <span style={styles.paramLabel}>{label}</span>
        <span style={styles.paramValue}>
          {value} {unit}
        </span>
      </div>
      <div style={styles.sliderTrack}>
        <div
          style={{
            ...styles.sliderFill,
            width: `${percentage}%`,
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          style={styles.sliderInput}
        />
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  app: {
    minHeight: '100vh',
    width: '100%',
    background: 'radial-gradient(ellipse at center, #0d0d1a 0%, #1a1a2e 100%)',
    color: '#fff',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    padding: '16px 24px',
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  title: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 700,
    color: '#fff',
    letterSpacing: '2px',
  },
  main: {
    flex: 1,
    display: 'flex',
    gap: '32px',
    padding: '28px',
    justifyContent: 'center',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    overflowY: 'auto',
  },
  editorPanel: {
    width: '400px',
    minWidth: '340px',
    maxWidth: '100%',
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    flexShrink: 0,
  },
  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px',
  },
  panelTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  resetBtn: {
    padding: '6px 14px',
    borderRadius: '8px',
    fontSize: '13px',
    background: 'rgba(255, 100, 100, 0.15)',
    color: '#ff8888',
    border: '1px solid rgba(255, 100, 100, 0.3)',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  slotsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  slotCard: {
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '8px',
    padding: '14px 16px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: '1px solid transparent',
  },
  slotCardExpanded: {
    background: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
  },
  slotHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  toggleBtn: {
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    border: 'none',
    padding: 0,
    flexShrink: 0,
    transition: 'all 0.15s ease',
  },
  colorIndicator: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    flexShrink: 0,
    boxShadow: '0 0 10px rgba(255, 255, 255, 0.15)',
    transition: 'opacity 0.2s ease',
  },
  slotName: {
    flex: 1,
    fontSize: '14px',
    fontWeight: 500,
    color: 'rgba(255, 255, 255, 0.9)',
    transition: 'opacity 0.2s ease',
  },
  expandIcon: {
    fontSize: '10px',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  paramsPanel: {
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  paramRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  paramLabelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paramLabel: {
    fontSize: '13px',
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: 500,
  },
  paramValue: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.5)',
    fontFamily: 'monospace',
  },
  colorPalette: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    alignItems: 'center',
  },
  colorSwatch: {
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    transition: 'transform 0.15s ease',
  },
  customColorLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '6px',
    background: 'rgba(255, 255, 255, 0.05)',
  },
  colorPicker: {
    width: '24px',
    height: '24px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    background: 'transparent',
    padding: 0,
  },
  customColorText: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  sliderTrack: {
    position: 'relative',
    width: '100%',
    height: '6px',
    background: '#333',
    borderRadius: '3px',
  },
  sliderFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    background: 'linear-gradient(90deg, #4488ff, #8844ff)',
    borderRadius: '3px',
    pointerEvents: 'none',
  },
  sliderInput: {
    position: 'absolute',
    top: '50%',
    left: 0,
    transform: 'translateY(-50%)',
    width: '100%',
    height: '20px',
    margin: 0,
    opacity: 0,
    cursor: 'pointer',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    userSelect: 'none',
  },
  checkbox: {
    width: '16px',
    height: '16px',
    cursor: 'pointer',
    accentColor: '#4488ff',
  },
  checkboxText: {
    fontSize: '13px',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  previewSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '24px',
    flexShrink: 0,
  },
  canvasWrapper: {
    padding: '4px',
    borderRadius: '20px',
    background:
      'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.02) 100%)',
  },
  canvas: {
    width: '500px',
    height: '500px',
    maxWidth: '100%',
    borderRadius: '16px',
    background: '#0a0a1a',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    boxShadow:
      'inset 0 0 60px rgba(0, 0, 0, 0.5), 0 8px 32px rgba(0, 0, 0, 0.4)',
    display: 'block',
  },
  buttonGroups: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    width: '100%',
    maxWidth: '500px',
  },
  buttonRow: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  actionBtn: {
    padding: '10px 20px',
    borderRadius: '8px',
    fontSize: '14px',
    background: 'rgba(255, 255, 255, 0.08)',
    color: 'rgba(255, 255, 255, 0.9)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    fontWeight: 500,
  },
  presetBtn: {
    padding: '8px 14px',
    borderRadius: '8px',
    fontSize: '13px',
    background: 'rgba(255, 255, 255, 0.06)',
    color: 'rgba(255, 255, 255, 0.85)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  randomBtn: {
    background: 'rgba(136, 68, 255, 0.15)',
    border: '1px solid rgba(136, 68, 255, 0.3)',
    color: '#cc99ff',
  },
};

const styleElement = document.createElement('style');
styleElement.textContent = `
  * { box-sizing: border-box; }
  html, body, #root { margin: 0; padding: 0; height: 100%; }
  body { overflow: hidden; }

  input[type="range"] {
    -webkit-appearance: none;
    appearance: none;
    background: transparent;
  }
  input[type="range"]::-webkit-slider-runnable-track {
    height: 6px;
    background: #333;
    border-radius: 3px;
  }
  input[type="range"]::-moz-range-track {
    height: 6px;
    background: #333;
    border-radius: 3px;
  }
  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #fff;
    cursor: pointer;
    margin-top: -3px;
    transition: transform 0.15s ease;
    box-shadow: 0 0 6px rgba(255,255,255,0.5);
  }
  input[type="range"]::-webkit-slider-thumb:hover,
  input[type="range"]:active::-webkit-slider-thumb {
    transform: scale(1.33);
  }
  input[type="range"]::-moz-range-thumb {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #fff;
    cursor: pointer;
    border: none;
    transition: transform 0.15s ease;
    box-shadow: 0 0 6px rgba(255,255,255,0.5);
  }
  input[type="range"]::-moz-range-thumb:hover,
  input[type="range"]:active::-moz-range-thumb {
    transform: scale(1.33);
  }

  button:hover,
  [role="button"]:hover {
    filter: brightness(1.1);
  }
  button:active {
    transform: scale(0.97);
  }

  .slot-card:hover {
    background: rgba(255, 255, 255, 0.1) !important;
  }
  .color-swatch:hover {
    transform: scale(1.15);
  }

  @media (max-width: 900px) {
    main {
      flex-direction: column !important;
      align-items: center !important;
    }
    aside {
      width: 100% !important;
      max-width: 500px !important;
    }
  }
`;
document.head.appendChild(styleElement);
