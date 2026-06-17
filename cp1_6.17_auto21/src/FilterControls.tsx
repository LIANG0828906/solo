import { useState } from 'react';
import { useStore, FILTER_PRESETS, FONT_OPTIONS, COLOR_PALETTE, createTextLayer } from '@/store';
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

export default function FilterControls() {
  const { layers, selectedLayerId, canvasWidth, canvasHeight, updateLayer, addLayer } = useStore();
  const selectedLayer = layers.find((l) => l.id === selectedLayerId) ?? null;
  const [colorPickerOpen, setColorPickerOpen] = useState(false);

  if (!selectedLayer) {
    return (
      <div
        style={{ width: 280, background: '#F9F9F9', borderRight: '1px solid #E0E0E0' }}
        className="flex items-center justify-center h-full text-sm text-gray-400"
      >
        请选择一个图层
      </div>
    );
  }

  const presets = FILTER_PRESETS.filter((p) => p.key !== 'none');

  const applyPreset = (preset: (typeof presets)[number]) => {
    updateLayer(selectedLayer.id, {
      filterPreset: preset.key,
      brightness: preset.brightness,
      contrast: preset.contrast,
      hue: preset.hue,
      saturate: preset.saturate,
    });
  };

  const handleAddTextLayer = () => {
    const layer = createTextLayer(canvasWidth, canvasHeight);
    addLayer(layer);
  };

  return (
    <div
      style={{ width: 280, background: '#F9F9F9', borderRight: '1px solid #E0E0E0' }}
      className="h-full overflow-y-auto scrollbar-thin p-4 flex flex-col gap-5"
    >
      <section>
        <h3 className="text-sm font-medium text-gray-700 mb-2">预设滤镜</h3>
        <div className="grid grid-cols-2 gap-2">
          {presets.map((preset) => (
            <div
              key={preset.key}
              onClick={() => applyPreset(preset)}
              className="flex items-center justify-center cursor-pointer rounded-[8px] text-xs text-gray-600"
              style={{
                width: 60,
                height: 60,
                border:
                  selectedLayer.filterPreset === preset.key
                    ? '2px solid #1976D2'
                    : '1px solid #E0E0E0',
              }}
            >
              {preset.label}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-sm font-medium text-gray-700 mb-2">色彩调节</h3>
        <div className="flex flex-col gap-3">
          {(
            [
              { label: '亮度', key: 'brightness', min: 50, max: 200 },
              { label: '对比度', key: 'contrast', min: 50, max: 200 },
              { label: '色相', key: 'hue', min: 0, max: 360 },
              { label: '饱和度', key: 'saturate', min: 0, max: 200 },
            ] as const
          ).map((item) => (
            <div key={item.key} className="flex flex-col gap-1">
              <div className="flex justify-between text-xs text-gray-600">
                <span>{item.label}</span>
                <span>{selectedLayer[item.key]}</span>
              </div>
              <input
                type="range"
                min={item.min}
                max={item.max}
                value={selectedLayer[item.key]}
                onChange={(e) =>
                  updateLayer(selectedLayer.id, { [item.key]: Number(e.target.value) })
                }
                className="w-full"
              />
            </div>
          ))}
        </div>
      </section>

      {selectedLayer.type === 'text' && (
        <section>
          <h3 className="text-sm font-medium text-gray-700 mb-2">文字属性</h3>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600">文案内容</label>
              <input
                type="text"
                value={selectedLayer.text ?? ''}
                onChange={(e) => updateLayer(selectedLayer.id, { text: e.target.value })}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600">字体</label>
              <select
                value={selectedLayer.fontFamily ?? "'Noto Sans SC', sans-serif"}
                onChange={(e) => updateLayer(selectedLayer.id, { fontFamily: e.target.value })}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded outline-none"
              >
                {FONT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-xs text-gray-600">
                <span>字号</span>
                <span>{selectedLayer.fontSize}</span>
              </div>
              <input
                type="range"
                min={12}
                max={120}
                value={selectedLayer.fontSize ?? 32}
                onChange={(e) =>
                  updateLayer(selectedLayer.id, { fontSize: Number(e.target.value) })
                }
                className="w-full"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600">字重</label>
              <select
                value={selectedLayer.fontWeight ?? '700'}
                onChange={(e) => updateLayer(selectedLayer.id, { fontWeight: e.target.value })}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded outline-none"
              >
                {['300', '400', '500', '700', '900'].map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600">颜色</label>
              <div className="relative">
                <button
                  onClick={() => setColorPickerOpen((prev) => !prev)}
                  className="w-8 h-8 rounded-full border-2 border-gray-300 cursor-pointer"
                  style={{ backgroundColor: selectedLayer.color ?? '#FFFFFF' }}
                />
                {colorPickerOpen && (
                  <div
                    className="absolute top-10 left-0 bg-white p-3 rounded-lg z-50"
                    style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                  >
                    <div className="grid grid-cols-6 gap-1 mb-2">
                      {COLOR_PALETTE.map((c) => (
                        <button
                          key={c}
                          className="w-6 h-6 rounded-full border border-gray-200 cursor-pointer"
                          style={{ backgroundColor: c }}
                          onClick={() => {
                            updateLayer(selectedLayer.id, { color: c });
                          }}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">透明度</span>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={Math.round((selectedLayer.opacity ?? 1) * 100)}
                        onChange={(e) =>
                          updateLayer(selectedLayer.id, {
                            opacity: Number(e.target.value) / 100,
                          })
                        }
                        className="flex-1"
                      />
                      <span className="text-xs text-gray-500 w-8 text-right">
                        {Math.round((selectedLayer.opacity ?? 1) * 100)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-xs text-gray-600">
                <span>旋转角度</span>
                <span>{selectedLayer.rotation}°</span>
              </div>
              <input
                type="range"
                min={-90}
                max={90}
                value={selectedLayer.rotation}
                onChange={(e) =>
                  updateLayer(selectedLayer.id, { rotation: Number(e.target.value) })
                }
                className="w-full"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600">对齐</label>
              <div className="flex gap-1">
                {([
                  { align: 'left' as const, Icon: AlignLeft },
                  { align: 'center' as const, Icon: AlignCenter },
                  { align: 'right' as const, Icon: AlignRight },
                ]).map(({ align, Icon }) => (
                  <button
                    key={align}
                    onClick={() => updateLayer(selectedLayer.id, { textAlign: align })}
                    className="flex-1 flex items-center justify-center py-1.5 rounded border cursor-pointer"
                    style={{
                      borderColor:
                        selectedLayer.textAlign === align ? '#1976D2' : '#E0E0E0',
                      color: selectedLayer.textAlign === align ? '#1976D2' : '#999',
                      background:
                        selectedLayer.textAlign === align ? '#E3F2FD' : 'transparent',
                    }}
                  >
                    <Icon size={16} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <button
        onClick={handleAddTextLayer}
        className="w-full py-2.5 text-white text-sm font-medium rounded-[20px] btn-hover cursor-pointer"
        style={{ background: '#1976D2' }}
      >
        添加文字图层
      </button>
    </div>
  );
}
