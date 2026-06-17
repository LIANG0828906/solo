import React, { useState } from 'react';
import { useStore } from './store';
import { FILTER_PRESETS, FONT_OPTIONS, FilterConfig } from './types';

const COLOR_PALETTE = [
  '#FF0000', '#FF4500', '#FF8C00', '#FFD700', '#FFFF00', '#9ACD32',
  '#32CD32', '#008000', '#00CED1', '#1E90FF', '#4169E1', '#0000CD',
  '#8A2BE2', '#9400D3', '#FF1493', '#DC143C', '#8B0000', '#FF6347',
  '#FFA07A', '#F0E68C', '#90EE90', '#87CEEB', '#DDA0DD', '#D3D3D3',
  '#000000', '#333333', '#666666', '#999999', '#CCCCCC', '#FFFFFF',
  '#1976D2', '#2196F3', '#4CAF50', '#FF9800', '#F44336', '#9C27B0',
];

const FilterControls: React.FC = () => {
  const selectedLayerId = useStore((state) => state.selectedLayerId);
  const selectedLayer = useStore((state) =>
    state.layers.find(l => l.id === state.selectedLayerId)
  );
  const updateLayerFilter = useStore((state) => state.updateLayerFilter);
  const applyFilterPreset = useStore((state) => state.applyFilterPreset);
  const updateLayerTextConfig = useStore((state) => state.updateLayerTextConfig);
  const addTextLayer = useStore((state) => state.addTextLayer);

  const [showColorPicker, setShowColorPicker] = useState(false);

  const handlePresetClick = (name: string, preset: FilterConfig) => {
    if (!selectedLayerId) return;
    applyFilterPreset(selectedLayerId, preset);
  };

  const handleSliderChange = (key: keyof FilterConfig, value: number) => {
    if (!selectedLayerId) return;
    updateLayerFilter(selectedLayerId, { [key]: value });
  };

  const handleTextChange = (key: string, value: string | number) => {
    if (!selectedLayerId || !selectedLayer?.textConfig) return;
    updateLayerTextConfig(selectedLayerId, { [key]: value });
  };

  const handleColorSelect = (color: string) => {
    if (!selectedLayerId) return;
    if (selectedLayer?.type === 'text') {
      updateLayerTextConfig(selectedLayerId, { color });
    }
    setShowColorPicker(false);
  };

  const presets = Object.entries(FILTER_PRESETS);
  const isImageLayer = selectedLayer?.type === 'image';
  const isTextLayer = selectedLayer?.type === 'text';

  return (
    <div
      style={{
        width: 280,
        backgroundColor: '#F9F9F9',
        borderRight: '1px solid #E0E0E0',
        padding: '16px 14px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}
    >
      <div>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#333', marginBottom: 12 }}>
          滤镜预设
        </h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 10,
          }}
        >
          {presets.map(([name, preset]) => (
            <div
              key={name}
              onClick={() => handlePresetClick(name, preset)}
              style={{
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.opacity = '0.8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.opacity = '1';
              }}
            >
              <div
                style={{
                  width: '100%',
                  aspectRatio: '1',
                  borderRadius: 8,
                  border: selectedLayer?.filter.preset === name
                    ? '2px solid #1976D2'
                    : '1px solid #E0E0E0',
                  background: `
                    linear-gradient(135deg, #FFB347 0%, #FFCC33 50%, #87CEEB 100%)
                  `,
                  filter: `
                    brightness(${preset.brightness}%)
                    contrast(${preset.contrast}%)
                    hue-rotate(${preset.hueRotate}deg)
                    saturate(${preset.saturate}%)
                    blur(${preset.blur}px)
                    sepia(${preset.sepia}%)
                    grayscale(${preset.grayscale}%)
                  `,
                  boxShadow: selectedLayer?.filter.preset === name
                    ? '0 2px 8px rgba(25, 118, 210, 0.3)'
                    : '0 1px 3px rgba(0,0,0,0.1)',
                }}
              />
              <div
                style={{
                  fontSize: 11,
                  color: '#616161',
                  textAlign: 'center',
                  marginTop: 6,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {name}
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedLayer && (
        <>
          <div
            style={{
              borderTop: '1px solid #E0E0E0',
              paddingTop: 16,
            }}
          >
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#333', marginBottom: 12 }}>
              滤镜调节
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { key: 'brightness', label: '亮度', min: 0, max: 200, unit: '%' },
                { key: 'contrast', label: '对比度', min: 0, max: 200, unit: '%' },
                { key: 'hueRotate', label: '色相', min: 0, max: 360, unit: '°' },
                { key: 'saturate', label: '饱和度', min: 0, max: 200, unit: '%' },
                { key: 'blur', label: '模糊', min: 0, max: 10, unit: 'px' },
                { key: 'sepia', label: '复古', min: 0, max: 100, unit: '%' },
                { key: 'grayscale', label: '灰度', min: 0, max: 100, unit: '%' },
              ].map(({ key, label, min, max, unit }) => (
                <div key={key}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: 4,
                    }}
                  >
                    <span style={{ fontSize: 12, color: '#616161' }}>{label}</span>
                    <span style={{ fontSize: 12, color: '#1976D2', fontWeight: 500 }}>
                      {Math.round(selectedLayer.filter[key as keyof FilterConfig] as number)}{unit}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={min}
                    max={max}
                    value={selectedLayer.filter[key as keyof FilterConfig] as number}
                    onChange={(e) => handleSliderChange(key as keyof FilterConfig, Number(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>
              ))}
            </div>
          </div>

          {isTextLayer && selectedLayer.textConfig && (
            <div
              style={{
                borderTop: '1px solid #E0E0E0',
                paddingTop: 16,
              }}
            >
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#333', marginBottom: 12 }}>
                文字设置
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: '#616161', marginBottom: 4, display: 'block' }}>
                    文字内容
                  </label>
                  <textarea
                    value={selectedLayer.textConfig.content}
                    onChange={(e) => handleTextChange('content', e.target.value)}
                    rows={2}
                    style={{ width: '100%', resize: 'vertical' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, color: '#616161', marginBottom: 4, display: 'block' }}>
                    字体
                  </label>
                  <select
                    value={selectedLayer.textConfig.fontFamily}
                    onChange={(e) => handleTextChange('fontFamily', e.target.value)}
                    style={{ width: '100%' }}
                  >
                    {FONT_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 12, color: '#616161', marginBottom: 4, display: 'block' }}>
                      字号
                    </label>
                    <input
                      type="number"
                      min={12}
                      max={120}
                      value={selectedLayer.textConfig.fontSize}
                      onChange={(e) => handleTextChange('fontSize', Number(e.target.value))}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 12, color: '#616161', marginBottom: 4, display: 'block' }}>
                      字重
                    </label>
                    <select
                      value={selectedLayer.textConfig.fontWeight}
                      onChange={(e) => handleTextChange('fontWeight', e.target.value)}
                      style={{ width: '100%' }}
                    >
                      <option value="normal">正常</option>
                      <option value="bold">粗体</option>
                      <option value="lighter">细体</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 12, color: '#616161', marginBottom: 4, display: 'block' }}>
                    颜色
                  </label>
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={() => setShowColorPicker(!showColorPicker)}
                      style={{
                        width: '100%',
                        height: 32,
                        borderRadius: 4,
                        border: '1px solid #E0E0E0',
                        backgroundColor: selectedLayer.textConfig.color,
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                      }}
                    />
                    {showColorPicker && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          marginTop: 8,
                          padding: 12,
                          backgroundColor: '#fff',
                          borderRadius: 8,
                          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                          zIndex: 100,
                        }}
                      >
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(6, 1fr)',
                            gap: 6,
                          }}
                        >
                          {COLOR_PALETTE.map(color => (
                            <div
                              key={color}
                              onClick={() => handleColorSelect(color)}
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: '50%',
                                backgroundColor: color,
                                cursor: 'pointer',
                                border: color === '#FFFFFF' ? '1px solid #E0E0E0' : 'none',
                                transition: 'transform 0.2s ease',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.15)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                              }}
                            />
                          ))}
                        </div>
                        <div style={{ marginTop: 10 }}>
                          <label style={{ fontSize: 11, color: '#616161', marginBottom: 4, display: 'block' }}>
                            透明度: {Math.round(selectedLayer.textConfig.opacity * 100)}%
                          </label>
                          <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.01}
                            value={selectedLayer.textConfig.opacity}
                            onChange={(e) => handleTextChange('opacity', Number(e.target.value))}
                            style={{ width: '100%' }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 12, color: '#616161', marginBottom: 4, display: 'block' }}>
                    对齐方式
                  </label>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {(['left', 'center', 'right'] as const).map(align => (
                      <button
                        key={align}
                        onClick={() => handleTextChange('textAlign', align)}
                        style={{
                          flex: 1,
                          padding: '6px 0',
                          fontSize: 12,
                          borderRadius: 4,
                          border: '1px solid #E0E0E0',
                          backgroundColor: selectedLayer.textConfig?.textAlign === align ? '#1976D2' : '#fff',
                          color: selectedLayer.textConfig?.textAlign === align ? '#fff' : '#333',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {align === 'left' ? '左对齐' : align === 'center' ? '居中' : '右对齐'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: '#616161' }}>旋转角度</span>
                    <span style={{ fontSize: 12, color: '#1976D2', fontWeight: 500 }}>
                      {Math.round(selectedLayer.rotation)}°
                    </span>
                  </div>
                  <input
                    type="range"
                    min={-90}
                    max={90}
                    value={selectedLayer.rotation}
                    onChange={(e) => {
                      if (selectedLayerId) {
                        useStore.getState().updateLayer(selectedLayerId, { rotation: Number(e.target.value) });
                      }
                    }}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            </div>
          )}

          {isImageLayer && (
            <div
              style={{
                borderTop: '1px solid #E0E0E0',
                paddingTop: 16,
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: '#616161' }}>图层透明度</span>
                  <span style={{ fontSize: 12, color: '#1976D2', fontWeight: 500 }}>
                    {Math.round(selectedLayer.opacity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={selectedLayer.opacity}
                  onChange={(e) => {
                    if (selectedLayerId) {
                      useStore.getState().updateLayer(selectedLayerId, { opacity: Number(e.target.value) });
                    }
                  }}
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ marginTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: '#616161' }}>旋转角度</span>
                  <span style={{ fontSize: 12, color: '#1976D2', fontWeight: 500 }}>
                    {Math.round(selectedLayer.rotation)}°
                  </span>
                </div>
                <input
                  type="range"
                  min={-90}
                  max={90}
                  value={selectedLayer.rotation}
                  onChange={(e) => {
                    if (selectedLayerId) {
                      useStore.getState().updateLayer(selectedLayerId, { rotation: Number(e.target.value) });
                    }
                  }}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          )}
        </>
      )}

      <div
        style={{
          borderTop: '1px solid #E0E0E0',
          paddingTop: 16,
          marginTop: 'auto',
        }}
      >
        <button
          onClick={addTextLayer}
          style={{
            width: '100%',
            padding: '10px 0',
            backgroundColor: '#1976D2',
            color: '#fff',
            borderRadius: 20,
            fontSize: 13,
            fontWeight: 500,
            transition: 'all 0.3s ease',
          }}
        >
          + 添加文字图层
        </button>
      </div>
    </div>
  );
};

export default FilterControls;
