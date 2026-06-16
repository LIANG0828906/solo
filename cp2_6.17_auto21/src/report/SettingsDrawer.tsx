import { useEffect, useRef } from 'react';
import { useAnalysisStore } from '../analysis/store';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsDrawer({ isOpen, onClose }: SettingsDrawerProps) {
  const { thresholds, setThresholds, loadThresholds } = useAnalysisStore();
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadThresholds();
    }
  }, [isOpen, loadThresholds]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const handleDuplicationChange = (value: number) => {
    const clamped = Math.max(2, Math.min(10, value));
    setThresholds({ duplicationLines: clamped });
  };

  const handleComplexityChange = (value: number) => {
    const clamped = Math.max(5, Math.min(20, value));
    setThresholds({ complexity: clamped });
  };

  const handleMaxLinesChange = (value: number) => {
    const clamped = Math.max(30, Math.min(100, value));
    setThresholds({ maxFunctionLines: clamped });
  };

  const handleReset = () => {
    setThresholds({
      duplicationLines: 3,
      complexity: 10,
      maxFunctionLines: 50,
    });
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 transition-opacity duration-300"
        style={{
          backgroundColor: '#00000066',
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
        onClick={onClose}
      />

      <div
        ref={drawerRef}
        className="fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 flex flex-col"
        style={{
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">⚙️ 审查设置</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  🔴 重复代码最小行数
                </label>
                <input
                  type="number"
                  min="2"
                  max="10"
                  value={thresholds.duplicationLines}
                  onChange={(e) => handleDuplicationChange(Number(e.target.value))}
                  className="w-16 px-2 py-1 text-sm text-center border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <input
                type="range"
                min="2"
                max="10"
                value={thresholds.duplicationLines}
                onChange={(e) => handleDuplicationChange(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-400"
              />
              <p className="text-xs text-gray-500 mt-1">
                连续 {thresholds.duplicationLines} 行相同代码将被标记为重复
              </p>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  🟡 圈复杂度阈值
                </label>
                <input
                  type="number"
                  min="5"
                  max="20"
                  value={thresholds.complexity}
                  onChange={(e) => handleComplexityChange(Number(e.target.value))}
                  className="w-16 px-2 py-1 text-sm text-center border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <input
                type="range"
                min="5"
                max="20"
                value={thresholds.complexity}
                onChange={(e) => handleComplexityChange(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-yellow-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                McCabe 圈复杂度超过 {thresholds.complexity} 将被标记
              </p>
              <div className="mt-2 text-xs bg-yellow-50 p-2 rounded text-yellow-800">
                <p className="font-medium mb-1">复杂度参考：</p>
                <p>• 1-10: 简单函数，风险低</p>
                <p>• 11-20: 中等复杂度，需要关注</p>
                <p>• 21+: 高复杂度，建议拆分</p>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  🔵 函数最大行数
                </label>
                <input
                  type="number"
                  min="30"
                  max="100"
                  value={thresholds.maxFunctionLines}
                  onChange={(e) => handleMaxLinesChange(Number(e.target.value))}
                  className="w-16 px-2 py-1 text-sm text-center border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <input
                type="range"
                min="30"
                max="100"
                step="5"
                value={thresholds.maxFunctionLines}
                onChange={(e) => handleMaxLinesChange(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-400"
              />
              <p className="text-xs text-gray-500 mt-1">
                函数超过 {thresholds.maxFunctionLines} 行将被标记为过长
              </p>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <button
                onClick={handleReset}
                className="w-full py-2 px-4 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                🔄 恢复默认设置
              </button>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">📖 检测说明</h3>
              <div className="space-y-3 text-xs text-gray-600">
                <div className="p-3 bg-red-50 rounded-lg">
                  <p className="font-medium text-red-700 mb-1">🔴 重复代码检测</p>
                  <p>基于滑动窗口哈希算法，检测连续多行相同的代码片段，建议提取为公共函数。</p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <p className="font-medium text-yellow-700 mb-1">🟡 圈复杂度计算</p>
                  <p>依据 McCabe 公式，统计 if/for/while/switch/case/&&/||/?: 等决策点数量。</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="font-medium text-blue-700 mb-1">🔵 过长函数检测</p>
                  <p>统计函数体的实际代码行数，建议将长函数拆分为多个职责单一的小函数。</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            设置自动保存，下次分析时生效
          </p>
        </div>
      </div>
    </>
  );
}
