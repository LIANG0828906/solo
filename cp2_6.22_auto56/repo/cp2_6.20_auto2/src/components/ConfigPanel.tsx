import React from 'react';
import { PasswordConfig, PasswordMode } from '../utils/passwordGenerator';

interface ConfigPanelProps {
  config: PasswordConfig;
  onConfigChange: (updates: Partial<PasswordConfig>) => void;
}

const modeOptions: { value: PasswordMode; name: string; desc: string; icon: string }[] = [
  { value: 'random', name: '随机字符组合', desc: '字母、数字、符号随机混合', icon: '🔀' },
  { value: 'phrase', name: '基于短语的密码', desc: '多个英文单词组合，易记忆', icon: '📝' },
  { value: 'readable', name: '可读性密码', desc: '英文单词 + 数字组合', icon: '📖' }
];

const checkboxOptions = [
  { key: 'includeUppercase' as const, label: '大写字母 A-Z' },
  { key: 'includeLowercase' as const, label: '小写字母 a-z' },
  { key: 'includeNumbers' as const, label: '数字 0-9' },
  { key: 'includeSymbols' as const, label: '特殊符号 !@#' }
];

export const ConfigPanel: React.FC<ConfigPanelProps> = ({ config, onConfigChange }) => {
  return (
    <aside className="config-panel">
      <h1 className="config-panel__title">🔐 密码生成器</h1>
      <p className="config-panel__subtitle">安全、强大、可定制的密码解决方案</p>

      <div className="config-section">
        <h3 className="config-section__title">生成模式</h3>
        <div className="mode-selector">
          {modeOptions.map(option => (
            <div
              key={option.value}
              className={`mode-option ${config.mode === option.value ? 'mode-option--active' : ''}`}
              onClick={() => onConfigChange({ mode: option.value })}
            >
              <span className="mode-option__icon">{option.icon}</span>
              <div className="mode-option__info">
                <div className="mode-option__name">{option.name}</div>
                <div className="mode-option__desc">{option.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="config-section">
        <h3 className="config-section__title">密码长度 ({config.length} 位)</h3>
        <div className="slider-container">
          <div className="slider-header">
            <span className="slider-label">长度范围</span>
            <span className="slider-value">{config.length}</span>
          </div>
          <input
            type="range"
            className="slider"
            min={12}
            max={64}
            value={config.length}
            onChange={(e) => onConfigChange({ length: parseInt(e.target.value) })}
          />
        </div>
      </div>

      <div className="config-section">
        <h3 className="config-section__title">字符集组合</h3>
        <div className="checkbox-group">
          {checkboxOptions.map(option => (
            <div
              key={option.key}
              className={`checkbox-item ${config[option.key] ? 'checkbox-item--active' : ''}`}
              onClick={() => {
                const newValue = !config[option.key];
                const allFalse = [
                  option.key === 'includeUppercase' ? newValue : config.includeUppercase,
                  option.key === 'includeLowercase' ? newValue : config.includeLowercase,
                  option.key === 'includeNumbers' ? newValue : config.includeNumbers,
                  option.key === 'includeSymbols' ? newValue : config.includeSymbols
                ].every(v => !v);
                if (!allFalse) {
                  onConfigChange({ [option.key]: newValue });
                }
              }}
            >
              <div className="checkbox-item__box">
                {config[option.key] && <span className="checkbox-item__check">✓</span>}
              </div>
              <span className="checkbox-item__label">{option.label}</span>
            </div>
          ))}
        </div>
      </div>

      {config.mode === 'phrase' && (
        <div className="config-section">
          <h3 className="config-section__title">短语模式配置</h3>
          <div className="slider-container" style={{ marginBottom: '16px' }}>
            <div className="slider-header">
              <span className="slider-label">单词数量</span>
              <span className="slider-value">{config.phraseWords || 4}</span>
            </div>
            <input
              type="range"
              className="slider"
              min={2}
              max={8}
              value={config.phraseWords || 4}
              onChange={(e) => onConfigChange({ phraseWords: parseInt(e.target.value) })}
            />
          </div>
          <div className="slider-header">
            <span className="slider-label">分隔符</span>
          </div>
          <div className="checkbox-group">
            {['-', '_', '.', '+'].map(sep => (
              <div
                key={sep}
                className={`checkbox-item ${config.phraseSeparator === sep ? 'checkbox-item--active' : ''}`}
                onClick={() => onConfigChange({ phraseSeparator: sep })}
              >
                <div className="checkbox-item__box">
                  {config.phraseSeparator === sep && <span className="checkbox-item__check">✓</span>}
                </div>
                <span className="checkbox-item__label">&quot;{sep}&quot;</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {config.mode === 'readable' && (
        <div className="config-section">
          <h3 className="config-section__title">可读性模式配置</h3>
          <div className="slider-container">
            <div className="slider-header">
              <span className="slider-label">基础单词数</span>
              <span className="slider-value">{config.readableWords || 3}</span>
            </div>
            <input
              type="range"
              className="slider"
              min={1}
              max={6}
              value={config.readableWords || 3}
              onChange={(e) => onConfigChange({ readableWords: parseInt(e.target.value) })}
            />
          </div>
        </div>
      )}

      <div className="config-section">
        <h3 className="config-section__title">高级选项</h3>
        <div className="toggle-row">
          <span className="toggle-label">排除相似字符 (0/O, 1/l)</span>
          <div
            className={`toggle ${config.excludeSimilar ? 'toggle--active' : ''}`}
            onClick={() => onConfigChange({ excludeSimilar: !config.excludeSimilar })}
          >
            <div className="toggle__knob" />
          </div>
        </div>
        <div style={{ marginTop: '12px' }}>
          <div className="slider-header" style={{ marginBottom: '8px' }}>
            <span className="slider-label">关键词过滤 (逗号分隔)</span>
          </div>
          <input
            type="text"
            className="text-input"
            placeholder="例如: admin, password, 123456"
            value={config.keywordFilter}
            onChange={(e) => onConfigChange({ keywordFilter: e.target.value })}
          />
        </div>
      </div>
    </aside>
  );
};

export default ConfigPanel;
