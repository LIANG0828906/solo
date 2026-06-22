import { useLoomStore } from '../store/useLoomStore';
import { rainbowColors } from '../utils/colorUtils';

export function ControlPanel() {
  const threadWidth = useLoomStore((state) => state.threadWidth);
  const pulseSpeed = useLoomStore((state) => state.pulseSpeed);
  const defaultColor = useLoomStore((state) => state.defaultColor);
  const setThreadWidth = useLoomStore((state) => state.setThreadWidth);
  const setPulseSpeed = useLoomStore((state) => state.setPulseSpeed);
  const setDefaultColor = useLoomStore((state) => state.setDefaultColor);
  const clearAll = useLoomStore((state) => state.clearAll);
  const pointsCount = useLoomStore((state) => state.points.length);
  const threadsCount = useLoomStore((state) => state.threads.length);

  return (
    <div className="fixed left-6 top-6 w-72 bg-[#16213e]/80 backdrop-blur-md rounded-xl p-5 border border-[#0f3460]/50 shadow-2xl z-10">
      <h2
        className="text-xl font-bold mb-5 text-center"
        style={{
          fontFamily: "'Orbitron', sans-serif",
          background: 'linear-gradient(90deg, #e94560, #16c79a)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '2px',
        }}
      >
        控制面板
      </h2>

      <div className="mb-6 p-3 bg-[#0f3460]/30 rounded-lg">
        <div className="flex justify-between text-sm text-gray-300 mb-2">
          <span>光点数量</span>
          <span className="text-[#e94560] font-mono">{pointsCount}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-300">
          <span>光线数量</span>
          <span className="text-[#16c79a] font-mono">{threadsCount}</span>
        </div>
      </div>

      <div className="mb-5">
        <label className="block text-sm text-gray-300 mb-2 font-medium">
          光线宽度: <span className="text-[#16c79a] font-mono">{threadWidth.toFixed(1)}</span>
        </label>
        <input
          type="range"
          min="0.5"
          max="5"
          step="0.1"
          value={threadWidth}
          onChange={(e) => setThreadWidth(parseFloat(e.target.value))}
          className="w-full h-2 bg-[#0f3460] rounded-lg appearance-none cursor-pointer"
          style={{
            accentColor: '#16c79a',
          }}
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>细</span>
          <span>粗</span>
        </div>
      </div>

      <div className="mb-5">
        <label className="block text-sm text-gray-300 mb-2 font-medium">
          脉动速度: <span className="text-[#e94560] font-mono">{pulseSpeed.toFixed(1)}x</span>
        </label>
        <input
          type="range"
          min="0.1"
          max="3"
          step="0.1"
          value={pulseSpeed}
          onChange={(e) => setPulseSpeed(parseFloat(e.target.value))}
          className="w-full h-2 bg-[#0f3460] rounded-lg appearance-none cursor-pointer"
          style={{
            accentColor: '#e94560',
          }}
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>慢</span>
          <span>快</span>
        </div>
      </div>

      <div className="mb-5">
        <label className="block text-sm text-gray-300 mb-3 font-medium">
          默认光点颜色
        </label>
        <div className="flex flex-wrap gap-2">
          {rainbowColors.map((color) => (
            <button
              key={color}
              onClick={() => setDefaultColor(color)}
              className={`w-8 h-8 rounded-full transition-all duration-200 hover:scale-110 ${
                defaultColor === color
                  ? 'ring-2 ring-white ring-offset-2 ring-offset-[#16213e] scale-110'
                  : ''
              }`}
              style={{
                backgroundColor: color,
                boxShadow: defaultColor === color ? `0 0 15px ${color}` : 'none',
              }}
            />
          ))}
        </div>
      </div>

      <button
        onClick={clearAll}
        className="w-full py-3 px-4 bg-gradient-to-r from-[#e94560] to-[#ff6b6b] text-white font-semibold rounded-lg hover:from-[#ff6b6b] hover:to-[#e94560] transition-all duration-300 shadow-lg hover:shadow-[#e94560]/50 active:scale-95"
        style={{
          fontFamily: "'Noto Sans SC', sans-serif",
        }}
      >
        清空全部
      </button>

      <div className="mt-5 pt-4 border-t border-[#0f3460]/50">
        <p className="text-xs text-gray-400 leading-relaxed">
          <span className="text-[#e94560]">提示：</span>
          点击空白区域创建光点，点击两个光点连接光线，点击光线播放音效。
        </p>
      </div>
    </div>
  );
}
