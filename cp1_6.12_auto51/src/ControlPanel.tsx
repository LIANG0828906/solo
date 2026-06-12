import React, { useState } from 'react';
import type { IndicatorConfig } from './types';

interface ControlPanelProps {
  onCodeSubmit: (code: string) => void;
  indicatorConfig: IndicatorConfig;
  onIndicatorChange: (config: IndicatorConfig) => void;
  isOpen: boolean;
  onClose: () => void;
}

const CheckIcon: React.FC = () => (
  <svg className="checkbox__check" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const MenuIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

export const ControlPanel: React.FC<ControlPanelProps> = ({
  onCodeSubmit,
  indicatorConfig,
  onIndicatorChange,
  isOpen,
  onClose
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onCodeSubmit(inputValue.trim().toUpperCase());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  const toggleIndicator = (key: keyof IndicatorConfig) => {
    onIndicatorChange({
      ...indicatorConfig,
      [key]: !indicatorConfig[key]
    });
  };

  const indicators: Array<{ key: keyof IndicatorConfig; label: string; dotClass: string }> = [
    { key: 'ma5', label: 'MA5 均线 (5日)', dotClass: 'checkbox__dot--ma5' },
    { key: 'ma20', label: 'MA20 均线 (20日)', dotClass: 'checkbox__dot--ma20' },
    { key: 'rsi', label: 'RSI 指标 (14日)', dotClass: 'checkbox__dot--rsi' }
  ];

  return (
    <>
      <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar__header">
          <div className="sidebar__logo">K</div>
          <div>
            <div className="sidebar__title">K线分析工具</div>
            <div className="sidebar__subtitle">实时技术指标分析</div>
          </div>
        </div>

        <div className="section">
          <div className="section__label">股票 / 基金代码</div>
          <form className="input-group" onSubmit={handleSubmit}>
            <input
              className="input"
              type="text"
              placeholder="如 AAPL、MSFT"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button className="btn" type="submit">查询</button>
          </form>
        </div>

        <div className="section">
          <div className="section__label">技术指标</div>
          <div className="checkbox-list">
            {indicators.map(({ key, label, dotClass }) => (
              <div
                key={key}
                className="checkbox-item"
                onClick={() => toggleIndicator(key)}
              >
                <div className={`checkbox ${indicatorConfig[key] ? 'checkbox--checked' : ''}`}>
                  <CheckIcon />
                </div>
                <span className="checkbox__label">{label}</span>
                <span className={`checkbox__dot ${dotClass}`} />
              </div>
            ))}
          </div>
        </div>

        <div className="hint">
          <div className="hint__title">操作提示</div>
          <div>• 滚轮缩放时间范围</div>
          <div>• 拖拽平移视图</div>
          <div>• 悬停查看OHLC数据</div>
          <div>• 放大到少于10天自动切换分钟级</div>
        </div>
      </aside>

      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 99
          }}
        />
      )}
    </>
  );
};

export const MobileMenuToggle: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button className="mobile-toggle" onClick={onClick} aria-label="菜单">
    <MenuIcon />
  </button>
);
