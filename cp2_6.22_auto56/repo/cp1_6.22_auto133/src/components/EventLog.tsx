import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, clearLogs, EventLogEntry, RootState } from '@/store/store';
import { ScrollText, Trash2, Clock } from 'lucide-react';

const eventTypeLabels: Record<string, string> = {
  onHover: '悬停 Hover',
  onClick: '点击 Click',
  onLongPress: '长按 LongPress',
};

const eventTypeColors: Record<string, { bg: string; text: string; dot: string }> = {
  onHover: { bg: '#EEF2FF', text: '#4F46E5', dot: '#A5B4FC' },
  onClick: { bg: '#ECFDF5', text: '#047857', dot: '#34D399' },
  onLongPress: { bg: '#FEF3C7', text: '#B45309', dot: '#FBBF24' },
};

const componentLabels: Record<string, string> = {
  'primary-button': '主按钮',
  'secondary-button': '次要按钮',
  card: '卡片',
  modal: '模态框',
  accordion: '折叠面板',
  switch: '开关',
  spinner: '加载旋转器',
  notification: '通知横幅',
};

const EventLog: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const logs = useSelector((s: RootState) => s.app.logs);
  const isOpen = useSelector((s: RootState) => s.app.ui.rightPanelOpen);
  const latestId = logs[0]?.id;

  const formatComponentId = (id: string) => {
    const s = id.split('-');
    const tail = s[s.length - 1].slice(0, 4).toUpperCase();
    return `cmp-${tail}`;
  };

  return (
    <aside
      className="right-panel"
      style={{
        width: isOpen ? '280px' : '0px',
        opacity: isOpen ? 1 : 0,
      }}
    >
      <div className="log-header">
        <div className="log-header-left">
          <ScrollText size={16} />
          <span>事件日志</span>
          {logs.length > 0 && (
            <span className="log-count">{logs.length}/100</span>
          )}
        </div>
        <button
          className="log-clear-btn"
          onClick={() => dispatch(clearLogs())}
          disabled={logs.length === 0}
          title="清空日志"
        >
          <Trash2 size={14} />
          <span>清空</span>
        </button>
      </div>

      <div className="log-list">
        {logs.length === 0 ? (
          <div className="log-empty">
            <Clock size={28} className="log-empty-icon" />
            <div>暂无交互事件</div>
            <div className="log-empty-tip">在画布上与组件交互</div>
          </div>
        ) : (
          logs.map((entry: EventLogEntry, index: number) => {
            const colors = eventTypeColors[entry.eventType] || eventTypeColors.onClick;
            const isLatest = entry.id === latestId;
            return (
              <div
                key={entry.id}
                className={`log-item ${isLatest ? 'log-item-latest' : ''}`}
                style={{
                  animation: isLatest ? 'logFadeIn 0.2s ease-out' : undefined,
                }}
              >
                <div className="log-item-top">
                  <span
                    className="log-event-badge"
                    style={{ background: colors.bg, color: colors.text }}
                  >
                    <span
                      className="log-event-dot"
                      style={{ background: colors.dot }}
                    />
                    {eventTypeLabels[entry.eventType]}
                  </span>
                  <span className="log-time">[{entry.timestamp}]</span>
                </div>
                <div className="log-item-bottom">
                  <span className="log-component-id">
                    {formatComponentId(entry.componentId)}
                  </span>
                  <span className="log-component-type">
                    {componentLabels[entry.componentType] || entry.componentType}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};

export default EventLog;
