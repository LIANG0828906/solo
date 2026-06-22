import React from 'react';
import { ObservationLog, Constellation } from '../utils/stellarData';

interface ObservationSidebarProps {
  logs: ObservationLog[];
  constellations: Constellation[];
  selectedConstellationId: string | null;
  lineColor: string;
  onConstellationSelect: (id: string | null) => void;
  onLineColorChange: (color: string) => void;
  onLogNoteChange: (logId: string, note: string) => void;
  onLogMoodChange: (logId: string, mood: string) => void;
}

const colorOptions = [
  '#7FDBFF',
  '#FFD700',
  '#FF6B6B',
  '#7FFF7F',
  '#C882FF',
  '#FF9F43',
];

const moodEmojis = ['😊', '😍', '🤩', '😌', '🌙', '✨', '🌟', '💫', '🎇', '🔭'];

const ObservationSidebar: React.FC<ObservationSidebarProps> = ({
  logs,
  constellations,
  selectedConstellationId,
  lineColor,
  onConstellationSelect,
  onLineColorChange,
  onLogNoteChange,
  onLogMoodChange,
}) => {
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'observe':
        return '观测';
      case 'connect':
        return '连线';
      case 'constellation':
        return '星座';
      default:
        return type;
    }
  };

  return (
    <div className="sidebar-container">
      <div className="sidebar-header">
        <h2>🔭 观测日志</h2>
        <p>记录你的星空发现</p>
      </div>

      <div className="section">
        <div className="section-title">✨ 预设星座</div>
        <div className="constellation-list">
          {constellations.map((c) => (
            <button
              key={c.id}
              className={`constellation-btn ${selectedConstellationId === c.id ? 'active' : ''}`}
              onClick={() => onConstellationSelect(selectedConstellationId === c.id ? null : c.id)}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div className="section">
        <div className="section-title">🎨 连线颜色</div>
        <div className="color-picker-row">
          <div className="color-swatches">
            {colorOptions.map((color) => (
              <div
                key={color}
                className={`color-swatch ${lineColor === color ? 'active' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => onLineColorChange(color)}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="section">
        <div className="section-title">💡 操作提示</div>
        <div className="tip-text">
          <p>• 点击恒星标记为已观测</p>
          <p>• 按住 <kbd>Shift</kbd> 并依次点击恒星进行自定义连线</p>
          <p>• 拖拽平移星空，滚轮缩放</p>
          <p>• 悬停查看恒星名称</p>
        </div>
      </div>

      <div className="section logs-section">
        <div className="section-title">📝 观测记录 ({logs.length})</div>
        {logs.length === 0 ? (
          <div className="tip-text" style={{ textAlign: 'center', padding: '20px 0' }}>
            暂无观测记录<br />
            点击星空开始你的观测吧~
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="log-entry">
              <div className="log-header">
                <span className={`log-type ${log.type}`}>
                  {getTypeLabel(log.type)}
                </span>
                <span className="log-time">{formatTime(log.timestamp)}</span>
              </div>
              <div className="log-target">{log.target}</div>
              <textarea
                className="log-note-input"
                placeholder="记录你的观测笔记和心情..."
                value={log.note}
                onChange={(e) => onLogNoteChange(log.id, e.target.value)}
              />
              <div className="log-mood-row">
                <span className="log-mood-label">心情:</span>
                <div className="emoji-picker">
                  {moodEmojis.map((emoji) => (
                    <button
                      key={emoji}
                      className={`emoji-btn ${log.mood === emoji ? 'selected' : ''}`}
                      onClick={() => onLogMoodChange(log.id, log.mood === emoji ? '' : emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ObservationSidebar;
