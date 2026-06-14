import { useState, useRef } from 'react';
import { FontConfig, FONT_OPTIONS, HistoryRecord } from '../utils/fontMeasure';
import './ControlPanel.css';

interface ControlPanelProps {
  config: FontConfig;
  activePanel: 'A' | 'B';
  onConfigChange: (config: FontConfig, panel: 'A' | 'B') => void;
  history: HistoryRecord[];
  onRestoreHistory: (record: HistoryRecord) => void;
}

export default function ControlPanel({
  config,
  activePanel,
  onConfigChange,
  history,
  onRestoreHistory,
}: ControlPanelProps) {
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [fontDropdownOpen, setFontDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleFontSelect = (value: string) => {
    onConfigChange({ ...config, fontFamily: value }, activePanel);
    setFontDropdownOpen(false);
  };

  const handleFontSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fontSize = parseInt(e.target.value, 10);
    onConfigChange({ ...config, fontSize }, activePanel);
  };

  const handleLineHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const lineHeight = parseFloat(e.target.value);
    onConfigChange({ ...config, lineHeight }, activePanel);
  };

  const currentFontLabel =
    FONT_OPTIONS.find((f) => f.value === config.fontFamily)?.label ||
    FONT_OPTIONS[0].label;

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  return (
    <div className="control-panel">
      <div className="panel-section">
        <div className="panel-tabs">
          <button
            className={`panel-tab ${activePanel === 'A' ? 'active' : ''}`}
            onClick={() => {}}
          >
            面板 A
          </button>
          <button
            className={`panel-tab ${activePanel === 'B' ? 'active' : ''}`}
            onClick={() => {}}
          >
            面板 B
          </button>
        </div>

        <div className="control-group">
          <label className="control-label">字体族</label>
          <div className="font-dropdown" ref={dropdownRef}>
            <button
              className="dropdown-trigger"
              onClick={() => setFontDropdownOpen(!fontDropdownOpen)}
            >
              <span className="dropdown-value">{currentFontLabel}</span>
              <span className="dropdown-arrow">▼</span>
            </button>
            {fontDropdownOpen && (
              <div className="dropdown-menu">
                {FONT_OPTIONS.map((font) => (
                  <div
                    key={font.value}
                    className={`dropdown-item ${config.fontFamily === font.value ? 'selected' : ''}`}
                    style={{ fontFamily: font.value }}
                    onClick={() => handleFontSelect(font.value)}
                  >
                    {font.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="control-group">
          <div className="control-label-row">
            <label className="control-label">字号</label>
            <span className="control-value">{config.fontSize}px</span>
          </div>
          <div className="slider-container">
            <input
              type="range"
              min="12"
              max="72"
              step="1"
              value={config.fontSize}
              onChange={handleFontSizeChange}
              className="slider"
            />
          </div>
        </div>

        <div className="control-group">
          <div className="control-label-row">
            <label className="control-label">行高</label>
            <span className="control-value">{config.lineHeight.toFixed(1)}</span>
          </div>
          <div className="slider-container">
            <input
              type="range"
              min="1.0"
              max="2.0"
              step="0.1"
              value={config.lineHeight}
              onChange={handleLineHeightChange}
              className="slider"
            />
          </div>
        </div>
      </div>

      <div className={`history-section ${historyExpanded ? 'expanded' : ''}`}>
        <div
          className="history-header"
          onClick={() => setHistoryExpanded(!historyExpanded)}
        >
          <span>历史记录</span>
          <span className="history-arrow">{historyExpanded ? '▲' : '▼'}</span>
        </div>
        {historyExpanded && (
          <div className="history-list">
            {history.length === 0 ? (
              <div className="history-empty">暂无记录</div>
            ) : (
              history.map((record) => (
                <div key={record.id} className="history-item">
                  <div className="history-info">
                    <div className="history-date">{formatDate(record.timestamp)}</div>
                    <div className="history-score">评分：{record.score}</div>
                  </div>
                  <button
                    className="history-view-btn"
                    onClick={() => onRestoreHistory(record)}
                    title="查看"
                  >
                    →
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
