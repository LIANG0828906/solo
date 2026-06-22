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

  const inputStyle: React.CSSProperties = {
    width: '64px',
    padding: '4px 8px',
    fontSize: '14px',
    textAlign: 'center',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    outline: 'none',
  };

  const rangeStyle = (color: string): React.CSSProperties => ({
    width: '100%',
    height: '8px',
    borderRadius: '8px',
    appearance: 'none',
    cursor: 'pointer',
    background: `linear-gradient(to right, ${color} 0%, ${color} ${100}%, #e5e7eb ${100}%, #e5e7eb 100%)`,
  });

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#00000066',
          zIndex: 40,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 0.3s cubic-bezier(0.4,0,0.2,1)',
        }}
        onClick={onClose}
      />

      <div
        ref={drawerRef}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          height: '100%',
          width: '320px',
          backgroundColor: 'white',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px',
          borderBottom: '1px solid #e5e7eb',
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1a1a2e' }}>⚙️ 审查设置</h2>
          <button
            onClick={onClose}
            style={{
              padding: '8px',
              color: '#6b7280',
              borderRadius: '8px',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f3f4f6'; e.currentTarget.style.color = '#374151'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#6b7280'; }}
          >
            ✕
          </button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 500, color: '#374151' }}>
                  🔴 重复代码最小行数
                </label>
                <input
                  type="number"
                  min="2"
                  max="10"
                  value={thresholds.duplicationLines}
                  onChange={(e) => handleDuplicationChange(Number(e.target.value))}
                  style={inputStyle}
                />
              </div>
              <input
                type="range"
                min="2"
                max="10"
                value={thresholds.duplicationLines}
                onChange={(e) => handleDuplicationChange(Number(e.target.value))}
                style={rangeStyle('#f87171')}
              />
              <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                连续 {thresholds.duplicationLines} 行相同代码将被标记为重复
              </p>
            </div>

            <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 500, color: '#374151' }}>
                  🟡 圈复杂度阈值
                </label>
                <input
                  type="number"
                  min="5"
                  max="20"
                  value={thresholds.complexity}
                  onChange={(e) => handleComplexityChange(Number(e.target.value))}
                  style={inputStyle}
                />
              </div>
              <input
                type="range"
                min="5"
                max="20"
                value={thresholds.complexity}
                onChange={(e) => handleComplexityChange(Number(e.target.value))}
                style={rangeStyle('#fbbf24')}
              />
              <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                McCabe 圈复杂度超过 {thresholds.complexity} 将被标记
              </p>
              <div style={{ marginTop: '8px', fontSize: '12px', backgroundColor: '#fffbeb', padding: '8px', borderRadius: '8px', color: '#92400e' }}>
                <p style={{ fontWeight: 500, marginBottom: '4px' }}>复杂度参考：</p>
                <p>• 1-10: 简单函数，风险低</p>
                <p>• 11-20: 中等复杂度，需要关注</p>
                <p>• 21+: 高复杂度，建议拆分</p>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 500, color: '#374151' }}>
                  🔵 函数最大行数
                </label>
                <input
                  type="number"
                  min="30"
                  max="100"
                  value={thresholds.maxFunctionLines}
                  onChange={(e) => handleMaxLinesChange(Number(e.target.value))}
                  style={inputStyle}
                />
              </div>
              <input
                type="range"
                min="30"
                max="100"
                step="5"
                value={thresholds.maxFunctionLines}
                onChange={(e) => handleMaxLinesChange(Number(e.target.value))}
                style={rangeStyle('#60a5fa')}
              />
              <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                函数超过 {thresholds.maxFunctionLines} 行将被标记为过长
              </p>
            </div>

            <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '24px' }}>
              <button
                onClick={handleReset}
                style={{
                  width: '100%',
                  padding: '8px 16px',
                  fontSize: '14px',
                  color: '#4b5563',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '8px',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e5e7eb'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f3f4f6'; }}
              >
                🔄 恢复默认设置
              </button>
            </div>

            <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '24px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '12px' }}>📖 检测说明</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px', color: '#4b5563' }}>
                <div style={{ padding: '12px', backgroundColor: '#fef2f2', borderRadius: '8px' }}>
                  <p style={{ fontWeight: 500, color: '#991b1b', marginBottom: '4px' }}>🔴 重复代码检测</p>
                  <p>基于语法Token归一化的滑动窗口算法，检测结构相似的代码片段，识别变量重命名后的语义重复。</p>
                </div>
                <div style={{ padding: '12px', backgroundColor: '#fffbeb', borderRadius: '8px' }}>
                  <p style={{ fontWeight: 500, color: '#92400e', marginBottom: '4px' }}>🟡 圈复杂度计算</p>
                  <p>依据 McCabe 公式，统计 if/for/while/switch/case/&&/||/?: 等决策点数量。</p>
                </div>
                <div style={{ padding: '12px', backgroundColor: '#eff6ff', borderRadius: '8px' }}>
                  <p style={{ fontWeight: 500, color: '#1e40af', marginBottom: '4px' }}>🔵 过长函数检测</p>
                  <p>统计函数体的实际代码行数，建议将长函数拆分为多个职责单一的小函数。</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb',
        }}>
          <p style={{ fontSize: '12px', color: '#6b7280', textAlign: 'center' }}>
            设置自动保存，下次分析时生效
          </p>
        </div>
      </div>
    </>
  );
}
