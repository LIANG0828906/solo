import React, { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { FunctionConfig } from '../types';
import { parseExpression, PRESET_COLORS } from '../utils/mathParser';

interface ControlPanelProps {
  functions: FunctionConfig[];
  onFunctionsChange: (functions: FunctionConfig[]) => void;
  isMobileOpen: boolean;
  onMobileToggle: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  functions,
  onFunctionsChange,
  isMobileOpen,
  onMobileToggle,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[(functions.length) % PRESET_COLORS.length]);

  useEffect(() => {
    setSelectedColor(PRESET_COLORS[functions.length % PRESET_COLORS.length]);
  }, [functions.length]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    if (value.trim()) {
      const result = parseExpression(value);
      if (!result.valid) {
        setError(result.error || '表达式无效');
      } else {
        setError(null);
      }
    } else {
      setError(null);
    }
  }, []);

  const triggerShake = useCallback(() => {
    setShake(true);
    setTimeout(() => setShake(false), 400);
  }, []);

  const handleAddFunction = useCallback(() => {
    if (!inputValue.trim()) {
      setError('请输入函数表达式');
      triggerShake();
      return;
    }

    if (functions.length >= 6) {
      setError('最多只能添加6个函数');
      triggerShake();
      return;
    }

    const result = parseExpression(inputValue);
    if (!result.valid) {
      setError(result.error || '表达式无效');
      triggerShake();
      return;
    }

    const newFunc: FunctionConfig = {
      id: uuidv4(),
      expression: inputValue.trim(),
      color: selectedColor,
      amplitude: 1,
      frequency: 1,
      phase: 0,
      visible: true,
    };

    onFunctionsChange([...functions, newFunc]);
    setInputValue('');
    setError(null);
  }, [inputValue, functions, selectedColor, onFunctionsChange, triggerShake]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handleAddFunction();
      }
    },
    [handleAddFunction]
  );

  const updateFunction = useCallback(
    (id: string, updates: Partial<FunctionConfig>) => {
      onFunctionsChange(
        functions.map((f) => (f.id === id ? { ...f, ...updates } : f))
      );
    },
    [functions, onFunctionsChange]
  );

  const toggleVisibility = useCallback(
    (id: string) => {
      onFunctionsChange(
        functions.map((f) =>
          f.id === id ? { ...f, visible: !f.visible } : f
        )
      );
    },
    [functions, onFunctionsChange]
  );

  const deleteFunction = useCallback(
    (id: string) => {
      onFunctionsChange(functions.filter((f) => f.id !== id));
    },
    [functions, onFunctionsChange]
  );

  return (
    <>
      <button className="mobile-toggle" onClick={onMobileToggle}>
        {isMobileOpen ? '收起面板' : '展开面板'}
      </button>

      <div className={`control-panel ${isMobileOpen ? 'mobile-open' : ''}`}>
        <div className="panel-header">
          <h2>函数控制面板</h2>
        </div>

        <div className="input-section">
          <div className="input-wrapper">
            <input
              type="text"
              className={`function-input ${shake ? 'shake' : ''} ${error ? 'has-error' : ''}`}
              placeholder="输入函数，如 sin(x), cos(x/2)*3, x^2+sin(3*x)"
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
            />
            {error && <div className="error-message">{error}</div>}
          </div>

          <div className="color-picker-section">
            <span className="color-label">选择颜色：</span>
            <div className="color-palette">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  className={`color-swatch ${selectedColor === color ? 'selected' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColor(color)}
                  title={color}
                />
              ))}
            </div>
          </div>

          <button
            className="add-button"
            onClick={handleAddFunction}
            disabled={functions.length >= 6}
          >
            添加函数 ({functions.length}/6)
          </button>
        </div>

        <div className="function-list-section">
          <h3>函数列表</h3>
          <div className="function-list">
            {functions.length === 0 && (
              <div className="empty-hint">暂无函数，请在上方添加</div>
            )}
            {functions.map((func) => (
              <div
                key={func.id}
                className={`function-card ${!func.visible ? 'hidden' : ''}`}
              >
                <div className="function-card-header">
                  <div
                    className="function-color-dot"
                    style={{ backgroundColor: func.color }}
                  />
                  <span className="function-expression">{func.expression}</span>
                  <div className="function-actions">
                    <button
                      className="icon-button"
                      onClick={() => toggleVisibility(func.id)}
                      title={func.visible ? '隐藏' : '显示'}
                    >
                      {func.visible ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      )}
                    </button>
                    <button
                      className="icon-button delete"
                      onClick={() => deleteFunction(func.id)}
                      title="删除"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="function-card-body">
                  <div className="param-row">
                    <label>
                      <span className="param-label">振幅</span>
                      <span className="param-value">{func.amplitude.toFixed(2)}</span>
                    </label>
                    <input
                      type="range"
                      className="param-slider"
                      min="0.1"
                      max="5.0"
                      step="0.1"
                      value={func.amplitude}
                      onChange={(e) =>
                        updateFunction(func.id, { amplitude: parseFloat(e.target.value) })
                      }
                      style={{
                        background: `linear-gradient(to right, ${func.color} 0%, ${func.color} ${((func.amplitude - 0.1) / 4.9) * 100}%, rgba(255,255,255,0.1) ${((func.amplitude - 0.1) / 4.9) * 100}%, rgba(255,255,255,0.1) 100%)`,
                      }}
                    />
                  </div>

                  <div className="param-row">
                    <label>
                      <span className="param-label">频率</span>
                      <span className="param-value">{func.frequency.toFixed(2)}</span>
                    </label>
                    <input
                      type="range"
                      className="param-slider"
                      min="0.5"
                      max="5.0"
                      step="0.1"
                      value={func.frequency}
                      onChange={(e) =>
                        updateFunction(func.id, { frequency: parseFloat(e.target.value) })
                      }
                      style={{
                        background: `linear-gradient(to right, ${func.color} 0%, ${func.color} ${((func.frequency - 0.5) / 4.5) * 100}%, rgba(255,255,255,0.1) ${((func.frequency - 0.5) / 4.5) * 100}%, rgba(255,255,255,0.1) 100%)`,
                      }}
                    />
                  </div>

                  <div className="param-row">
                    <label>
                      <span className="param-label">相位</span>
                      <span className="param-value">{(func.phase / Math.PI).toFixed(2)}π</span>
                    </label>
                    <input
                      type="range"
                      className="param-slider"
                      min="0"
                      max={Math.PI * 2}
                      step="0.05"
                      value={func.phase}
                      onChange={(e) =>
                        updateFunction(func.id, { phase: parseFloat(e.target.value) })
                      }
                      style={{
                        background: `linear-gradient(to right, ${func.color} 0%, ${func.color} ${(func.phase / (Math.PI * 2)) * 100}%, rgba(255,255,255,0.1) ${(func.phase / (Math.PI * 2)) * 100}%, rgba(255,255,255,0.1) 100%)`,
                      }}
                    />
                  </div>

                  <div className="param-row color-row">
                    <span className="param-label">颜色</span>
                    <div className="inline-color-palette">
                      {PRESET_COLORS.map((color) => (
                        <button
                          key={color}
                          className={`inline-color-swatch ${func.color === color ? 'selected' : ''}`}
                          style={{ backgroundColor: color }}
                          onClick={() => updateFunction(func.id, { color })}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default ControlPanel;
