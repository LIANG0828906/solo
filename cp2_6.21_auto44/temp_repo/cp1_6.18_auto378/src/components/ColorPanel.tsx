import { useGradientStore } from '../store/useGradientStore';
import { PRESET_COLORS, MAX_COLOR_STOPS } from '../types/gradient';
import { Plus, Trash2 } from 'lucide-react';

export function ColorPanel() {
  const {
    config,
    selectedColorStopId,
    addColorStop,
    removeColorStop,
    updateColorStop,
    selectColorStop,
  } = useGradientStore();

  const selectedStop = config.colorStops.find((stop) => stop.id === selectedColorStopId);
  const sortedStops = [...config.colorStops].sort((a, b) => a.position - b.position);

  const handleColorSelect = (color: string) => {
    if (selectedColorStopId) {
      updateColorStop(selectedColorStopId, { color });
    }
  };

  const handlePositionChange = (id: string, position: number) => {
    updateColorStop(id, { position: Math.max(0, Math.min(100, position)) });
  };

  const handleOpacityChange = (id: string, opacity: number) => {
    updateColorStop(id, { opacity: Math.max(0, Math.min(1, opacity)) });
  };

  return (
    <div className="w-[280px] bg-[#252536] rounded-xl p-5 flex flex-col gap-5">
      <h2 className="text-white text-lg font-semibold">颜色管理</h2>

      <div>
        <h3 className="text-gray-400 text-sm mb-3">预设颜色</h3>
        <div className="grid grid-cols-4 gap-3">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => handleColorSelect(color)}
              className="w-8 h-8 rounded-full transition-all duration-200 hover:scale-110 hover:-translate-y-0.5"
              style={{
                backgroundColor: color,
                boxShadow:
                  selectedStop?.color === color
                    ? '0 0 12px rgba(255,255,255,0.4)'
                    : 'none',
                border:
                  selectedStop?.color === color
                    ? '2px solid white'
                    : '2px solid transparent',
              }}
              title={color}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-gray-400 text-sm">色阶 ({config.colorStops.length}/{MAX_COLOR_STOPS})</h3>
        <button
          onClick={addColorStop}
          disabled={config.colorStops.length >= MAX_COLOR_STOPS}
          className="flex items-center gap-1 px-3 py-1.5 bg-[#3a3a50] text-white text-sm rounded-lg hover:bg-[#4a4a65] hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        >
          <Plus size={14} />
          添加
        </button>
      </div>

      <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
        {sortedStops.map((stop, index) => (
          <div
            key={stop.id}
            onClick={() => selectColorStop(stop.id)}
            className={`p-3 rounded-lg cursor-pointer transition-all duration-200 hover:-translate-y-0.5 ${
              selectedColorStopId === stop.id
                ? 'bg-[#3a3a50] shadow-[0_0_12px_rgba(255,255,255,0.1)]'
                : 'bg-[#2d2d42] hover:bg-[#35354a]'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-8 h-8 rounded-full flex-shrink-0"
                style={{
                  backgroundColor: stop.color,
                  opacity: stop.opacity,
                  border:
                    selectedColorStopId === stop.id
                      ? '2px solid white'
                      : '2px solid transparent',
                  boxShadow:
                    selectedColorStopId === stop.id
                      ? '0 0 12px rgba(255,255,255,0.4)'
                      : 'none',
                }}
              />
              <span className="text-white text-sm flex-1">色阶 {index + 1}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeColorStop(stop.id);
                }}
                disabled={config.colorStops.length <= 2}
                className="text-gray-500 hover:text-red-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="删除色阶"
              >
                <Trash2 size={14} />
              </button>
            </div>

            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>位置</span>
                  <span>{stop.position}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={stop.position}
                  onChange={(e) => handlePositionChange(stop.id, Number(e.target.value))}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full h-2 bg-[#1e1e2e] rounded-lg appearance-none cursor-pointer accent-[#4CAF50]"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>透明度</span>
                  <span>{stop.opacity.toFixed(1)}</span>
                </div>
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={stop.opacity}
                  onChange={(e) => handleOpacityChange(stop.id, Number(e.target.value))}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full px-2 py-1 bg-[#1e1e2e] text-white text-sm rounded border border-[#3a3a50] focus:border-[#4CAF50] focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
